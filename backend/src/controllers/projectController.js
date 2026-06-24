const { query } = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const { search, status, priority, customer_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let pi = 1;

    // Filter by staff project assignments
    if (req.user.role === 'Staff') {
      const empRes = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empRes.rows.length > 0) {
        const employeeId = empRes.rows[0].id;
        conditions.push(`p.id IN (SELECT project_id FROM project_assignments WHERE employee_id = $${pi++})`);
        params.push(employeeId);
      } else {
        conditions.push('p.id = -1');
      }
    }

    if (search) { conditions.push(`(p.name ILIKE $${pi} OR p.description ILIKE $${pi})`); params.push(`%${search}%`); pi++; }
    if (status) { conditions.push(`p.status = $${pi++}`); params.push(status); }
    if (priority) { conditions.push(`p.priority = $${pi++}`); params.push(priority); }
    if (customer_id) { conditions.push(`p.customer_id = $${pi++}`); params.push(customer_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) FROM projects p ${where}`, params);
    const result = await query(
      `SELECT p.*, c.name as customer_name, e.name as manager_name,
              (SELECT COUNT(*) FROM project_assignments WHERE project_id = p.id) as team_size,
              (SELECT STRING_AGG(emp.name, ', ') FROM project_assignments pa JOIN employees emp ON pa.employee_id = emp.id WHERE pa.project_id = p.id) as employee_names,
              (SELECT STRING_AGG(emp.id::text, ', ') FROM project_assignments pa JOIN employees emp ON pa.employee_id = emp.id WHERE pa.project_id = p.id) as employee_ids
       FROM projects p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN employees e ON p.manager_id = e.id
       ${where} ORDER BY p.created_at DESC
       LIMIT $${pi++} OFFSET $${pi}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: { total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    if (req.user.role === 'Staff') {
      const empRes = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empRes.rows.length > 0) {
        const employeeId = empRes.rows[0].id;
        const check = await query('SELECT 1 FROM project_assignments WHERE project_id = $1 AND employee_id = $2', [req.params.id, employeeId]);
        if (check.rows.length === 0) {
          return res.status(403).json({ success: false, message: 'Access denied. You are not assigned to this project.' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const result = await query(
      `SELECT p.*, c.name as customer_name, c.email as customer_email, e.name as manager_name
       FROM projects p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN employees e ON p.manager_id = e.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });

    const team = await query(
      `SELECT pa.*, e.name, e.employee_code, e.designation, e.photo_url, e.department
       FROM project_assignments pa JOIN employees e ON pa.employee_id = e.id
       WHERE pa.project_id = $1`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...result.rows[0], team: team.rows } });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description, customer_id, start_date, end_date, budget, status, priority, manager_id, team_members } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Project name is required.' });

    let finalManagerId = manager_id;
    if (!finalManagerId && req.user.role === 'Manager') {
      const mgrRes = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (mgrRes.rows.length > 0) {
        finalManagerId = mgrRes.rows[0].id;
      }
    }

    const count = await query('SELECT COUNT(*) FROM projects');
    const projectCode = `PROJ-${String(parseInt(count.rows[0].count) + 1).padStart(3, '0')}`;

    const result = await query(
      `INSERT INTO projects (project_code, name, description, customer_id, start_date, end_date, budget, status, priority, manager_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [projectCode, name, description, customer_id || null, start_date, end_date, budget || 0,
        status || 'Not Started', priority || 'Medium', finalManagerId || null, req.user.userId]
    );

    const project = result.rows[0];

    // Assign team members
    if (team_members && team_members.length > 0) {
      for (const member of team_members) {
        await query(
          'INSERT INTO project_assignments (project_id, employee_id, role_in_project) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [project.id, member.employee_id, member.role_in_project || 'Team Member']
        );
      }
    }

    // Notify Manager
    if (manager_id) {
      const empRes = await query('SELECT user_id FROM employees WHERE id = $1', [manager_id]);
      if (empRes.rows.length > 0 && empRes.rows[0].user_id) {
        await createNotification(
          empRes.rows[0].user_id,
          'New Project Assigned',
          `You have been assigned as the Manager of project: ${name}`,
          'info',
          '/projects'
        );
      }
    }

    res.status(201).json({ success: true, message: 'Project created successfully.', data: project });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const { name, description, customer_id, start_date, end_date, budget, priority, manager_id, team_members } = req.body;
    let { status, progress } = req.body;

    const projRes = await query('SELECT status, progress FROM projects WHERE id = $1', [req.params.id]);
    if (projRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });
    
    const currentProj = projRes.rows[0];
    let finalStatus = status !== undefined ? status : currentProj.status;
    let finalProgress = progress !== undefined ? parseInt(progress) : currentProj.progress;

    // Enforce consistency rules
    if (finalProgress === 100) {
      finalStatus = 'Completed';
    } else if (finalStatus === 'Completed' && finalProgress < 100) {
      finalProgress = 100;
    } else if (finalStatus === 'Not Started') {
      finalProgress = 0;
    } else if (finalProgress > 0 && finalProgress < 100 && finalStatus === 'Not Started') {
      finalStatus = 'In Progress';
    } else if (finalProgress < 100 && finalStatus === 'Completed') {
      finalStatus = 'In Progress';
    }

    const result = await query(
      `UPDATE projects SET name=$1, description=$2, customer_id=$3, start_date=$4, end_date=$5,
        budget=$6, status=$7, priority=$8, manager_id=$9, progress=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [name, description, customer_id || null, start_date, end_date, budget, finalStatus, priority, manager_id || null, finalProgress, req.params.id]
    );

    const project = result.rows[0];

    // Update assignments if team_members is provided
    if (team_members !== undefined) {
      await query('DELETE FROM project_assignments WHERE project_id = $1', [project.id]);
      if (team_members && team_members.length > 0) {
        for (const member of team_members) {
          await query(
            'INSERT INTO project_assignments (project_id, employee_id, role_in_project) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [project.id, member.employee_id, member.role_in_project || 'Team Member']
          );
        }
      }
    }

    // Notify manager
    if (project.manager_id) {
      const empRes = await query('SELECT user_id FROM employees WHERE id = $1', [project.manager_id]);
      if (empRes.rows.length > 0 && empRes.rows[0].user_id) {
        await createNotification(
          empRes.rows[0].user_id,
          'Project Updated',
          `Project "${project.name}" status updated to "${project.status}" (${project.progress}% completed).`,
          'info',
          '/projects'
        );
      }
    }

    // Notify assigned team members
    const teamMembers = await query(
      `SELECT e.user_id FROM project_assignments pa
       JOIN employees e ON pa.employee_id = e.id
       WHERE pa.project_id = $1`,
      [project.id]
    );
    for (const member of teamMembers.rows) {
      if (member.user_id && member.user_id !== req.user.userId) {
        await createNotification(
          member.user_id,
          'Project Updated',
          `Project "${project.name}" status updated to "${project.status}" (${project.progress}% completed).`,
          'info',
          '/projects'
        );
      }
    }

    res.json({ success: true, message: 'Project updated.', data: project });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/assign
const assignTeamMember = async (req, res, next) => {
  try {
    const { employee_id, role_in_project } = req.body;
    await query(
      'INSERT INTO project_assignments (project_id, employee_id, role_in_project) VALUES ($1, $2, $3) ON CONFLICT (project_id, employee_id) DO UPDATE SET role_in_project = $3',
      [req.params.id, employee_id, role_in_project || 'Team Member']
    );

    // Get project name
    const projRes = await query('SELECT name FROM projects WHERE id = $1', [req.params.id]);
    const projName = projRes.rows[0]?.name || 'a project';

    // Notify employee
    const empRes = await query('SELECT user_id FROM employees WHERE id = $1', [employee_id]);
    if (empRes.rows.length > 0 && empRes.rows[0].user_id) {
      await createNotification(
        empRes.rows[0].user_id,
        'Assigned to Project',
        `You have been assigned to project: ${projName} as ${role_in_project || 'Team Member'}.`,
        'success',
        '/projects'
      );
    }

    res.json({ success: true, message: 'Team member assigned.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id/assign/:employee_id
const removeTeamMember = async (req, res, next) => {
  try {
    await query('DELETE FROM project_assignments WHERE project_id = $1 AND employee_id = $2', [req.params.id, req.params.employee_id]);
    res.json({ success: true, message: 'Team member removed.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/stats
const getProjectStats = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'Not Started') as not_started,
        COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'Testing') as testing,
        COUNT(*) FILTER (WHERE status = 'Completed') as completed,
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE AND status != 'Completed') as overdue,
        COUNT(*) as total
       FROM projects`
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id/progress
const updateProjectProgress = async (req, res, next) => {
  try {
    const { status, progress } = req.body;

    // If user is Staff, check if they are assigned to this project
    if (req.user.role === 'Staff') {
      const empRes = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empRes.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied. Employee record not found.' });
      }
      const employeeId = empRes.rows[0].id;
      const check = await query('SELECT 1 FROM project_assignments WHERE project_id = $1 AND employee_id = $2', [req.params.id, employeeId]);
      if (check.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied. You are not assigned to this project.' });
      }
    }

    const projRes = await query('SELECT status, progress FROM projects WHERE id = $1', [req.params.id]);
    if (projRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });
    
    const currentProj = projRes.rows[0];
    let finalStatus = status !== undefined ? status : currentProj.status;
    let finalProgress = progress !== undefined ? parseInt(progress) : currentProj.progress;

    // Enforce consistency rules
    if (finalProgress === 100) {
      finalStatus = 'Completed';
    } else if (finalStatus === 'Completed' && finalProgress < 100) {
      finalProgress = 100;
    } else if (finalStatus === 'Not Started') {
      finalProgress = 0;
    } else if (finalProgress > 0 && finalProgress < 100 && finalStatus === 'Not Started') {
      finalStatus = 'In Progress';
    } else if (finalProgress < 100 && finalStatus === 'Completed') {
      finalStatus = 'In Progress';
    }

    const result = await query(
      `UPDATE projects SET status = $1, progress = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [finalStatus, finalProgress, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = result.rows[0];

    // Notify manager of updates
    if (project.manager_id) {
      const empRes = await query('SELECT user_id FROM employees WHERE id = $1', [project.manager_id]);
      if (empRes.rows.length > 0 && empRes.rows[0].user_id) {
        await createNotification(
          empRes.rows[0].user_id,
          'Project Progress Updated',
          `Project "${project.name}" progress updated to ${project.progress}% (${project.status}) by ${req.user.email}.`,
          'info',
          '/projects'
        );
      }
    }

    res.json({ success: true, message: 'Project progress updated.', data: project });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, assignTeamMember, removeTeamMember, getProjectStats, updateProjectProgress };
