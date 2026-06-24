const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { sendEmail, templates } = require('../config/mail');
const cloudinary = require('../config/cloudinary');

const saveBase64Image = (base64Str, folder = 'employees') => {
  if (!base64Str || !base64Str.startsWith('data:image')) {
    return base64Str;
  }
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    const ext = matches[1].split('/')[1] || 'png';
    const dataBuffer = Buffer.from(matches[2], 'base64');
    
    const uploadsDir = path.join(__dirname, '../../uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, dataBuffer);
    
    return `/uploads/${folder}/${filename}`;
  } catch (err) {
    console.error('Failed to save base64 image locally:', err);
    return null;
  }
};

const getFullUrl = (req, photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  const protocol = req.protocol;
  const host = req.get('host');
  const cleanPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${protocol}://${host}${cleanPath}`;
};

// GET /api/employees - List all employees
const getEmployees = async (req, res, next) => {
  try {
    const { search, department, designation, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = ['e.is_active = true'];
    let params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(e.name ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex} OR e.employee_code ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (department) {
      conditions.push(`e.department = $${paramIndex}`);
      params.push(department);
      paramIndex++;
    }
    if (designation) {
      conditions.push(`e.designation = $${paramIndex}`);
      params.push(designation);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM employees e ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT e.id, e.user_id, e.employee_code, e.name, e.email, e.phone, e.department, e.designation,
              COALESCE(
                NULLIF(e.salary, 0),
                (SELECT basic_salary FROM payrolls WHERE employee_id = e.id ORDER BY year DESC, month DESC LIMIT 1),
                0
              ) AS salary,
              e.joining_date, e.manager_id, e.photo_url, e.address, e.emergency_contact,
              e.bank_account, e.ifsc_code, e.pan_number, e.is_active, e.created_at, e.updated_at,
              m.name as manager_name, r.name as role_name 
       FROM employees e 
       LEFT JOIN employees m ON e.manager_id = m.id
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       ${whereClause}
       ORDER BY e.name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const formattedRows = result.rows.map(row => {
      if (row.photo_url) {
        row.photo_url = getFullUrl(req, row.photo_url);
      }
      return row;
    });

    res.json({
      success: true,
      data: formattedRows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:id
const getEmployee = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT e.id, e.user_id, e.employee_code, e.name, e.email, e.phone, e.department, e.designation,
              COALESCE(
                NULLIF(e.salary, 0),
                (SELECT basic_salary FROM payrolls WHERE employee_id = e.id ORDER BY year DESC, month DESC LIMIT 1),
                0
              ) AS salary,
              e.joining_date, e.manager_id, e.photo_url, e.address, e.emergency_contact,
              e.bank_account, e.ifsc_code, e.pan_number, e.is_active, e.created_at, e.updated_at,
              m.name as manager_name, u.email as login_email, r.name as role_name
       FROM employees e
       LEFT JOIN employees m ON e.manager_id = m.id
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const emp = result.rows[0];
    if (emp.photo_url) {
      emp.photo_url = getFullUrl(req, emp.photo_url);
    }

    res.json({ success: true, data: emp });
  } catch (error) {
    next(error);
  }
};

// POST /api/employees - Create employee
const createEmployee = async (req, res, next) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');

    const {
      name, email, phone, department, designation, salary,
      joining_date, manager_id, address, bank_account, ifsc_code,
      pan_number, emergency_contact, password = 'Admin@123',
      role = 'Staff'
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    // Generate employee code
    const countResult = await client.query("SELECT COUNT(*) FROM employees");
    const count = parseInt(countResult.rows[0].count) + 1;
    const employeeCode = `HPS-${String(count).padStart(3, '0')}`;

    // Create user account
    const passwordHash = await bcrypt.hash(password, 10);
    const roleResult = await client.query("SELECT id FROM roles WHERE name = $1", [role]);
    let roleId = roleResult.rows[0]?.id;
    if (!roleId) {
      const staffRole = await client.query("SELECT id FROM roles WHERE name = 'Staff'");
      roleId = staffRole.rows[0]?.id;
    }

    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id',
      [email.toLowerCase(), passwordHash, roleId]
    );
    const userId = userResult.rows[0].id;

    // Upload photo if provided
    let photoUrl = req.body.photo_url || null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'hps_crm/employees' });
        photoUrl = result.secure_url;
      } catch (e) {
        console.warn('Photo upload failed:', e.message);
      }
    } else if (photoUrl && photoUrl.startsWith('data:image')) {
      try {
        const result = await cloudinary.uploader.upload(photoUrl, { folder: 'hps_crm/employees' });
        photoUrl = result.secure_url;
      } catch (e) {
        console.warn('Base64 photo upload failed, saving locally:', e.message);
        photoUrl = saveBase64Image(photoUrl, 'employees');
      }
    }

    // Create employee
    const empResult = await client.query(
      `INSERT INTO employees (user_id, employee_code, name, email, phone, department, designation,
        salary, joining_date, manager_id, address, bank_account, ifsc_code, pan_number,
        emergency_contact, photo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [userId, employeeCode, name, email, phone, department, designation,
        salary || 0, joining_date, manager_id || null, address, bank_account,
        ifsc_code, pan_number, emergency_contact, photoUrl]
    );

    await client.query('COMMIT');

    // Send welcome email
    const { subject, html } = templates.welcome(name, email, password);
    await sendEmail({ to: email, subject, html });

    // Log email
    await query(
      'INSERT INTO email_logs (recipient, subject, template_name, status) VALUES ($1, $2, $3, $4)',
      [email, subject, 'welcome', 'Sent']
    );

    // Audit log
    await query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, 'CREATE_EMPLOYEE', 'EMPLOYEE', empResult.rows[0].id, JSON.stringify(empResult.rows[0])]
    );

    const emp = empResult.rows[0];
    if (emp.photo_url) {
      emp.photo_url = getFullUrl(req, emp.photo_url);
    }
    res.status(201).json({ success: true, message: 'Employee created successfully.', data: emp });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, department, designation, salary, joining_date, manager_id, address, bank_account, ifsc_code, pan_number, emergency_contact, role } = req.body;

    let photoUrl = req.body.photo_url;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'hps_crm/employees' });
        photoUrl = result.secure_url;
      } catch (e) {
        console.warn('Photo upload failed:', e.message);
      }
    } else if (photoUrl && photoUrl.startsWith('data:image')) {
      try {
        const result = await cloudinary.uploader.upload(photoUrl, { folder: 'hps_crm/employees' });
        photoUrl = result.secure_url;
      } catch (e) {
        console.warn('Base64 update photo upload failed, saving locally:', e.message);
        photoUrl = saveBase64Image(photoUrl, 'employees');
      }
    }

    const result = await query(
      `UPDATE employees SET name=$1, phone=$2, department=$3, designation=$4, salary=$5,
        joining_date=$6, manager_id=$7, address=$8, bank_account=$9, ifsc_code=$10,
        pan_number=$11, emergency_contact=$12, photo_url=COALESCE($13, photo_url), updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [name, phone, department, designation, salary, joining_date, manager_id || null,
        address, bank_account, ifsc_code, pan_number, emergency_contact, photoUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    if (role) {
      const roleResult = await query("SELECT id FROM roles WHERE name = $1", [role]);
      const roleId = roleResult.rows[0]?.id;
      if (roleId) {
        await query('UPDATE users SET role_id = $1 WHERE id = (SELECT user_id FROM employees WHERE id = $2)', [roleId, id]);
      }
    }

    const emp = result.rows[0];
    if (emp.photo_url) {
      emp.photo_url = getFullUrl(req, emp.photo_url);
    }
    res.json({ success: true, message: 'Employee updated successfully.', data: emp });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/employees/:id (soft delete)
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('UPDATE employees SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
    await query('UPDATE users SET is_active = false WHERE id = (SELECT user_id FROM employees WHERE id = $1)', [id]);
    res.json({ success: true, message: 'Employee deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/stats - Dashboard stats
const getStats = async (req, res, next) => {
  try {
    const [total, departments, byDept] = await Promise.all([
      query("SELECT COUNT(*) FROM employees WHERE is_active = true"),
      query("SELECT DISTINCT department FROM employees WHERE is_active = true AND department IS NOT NULL ORDER BY department"),
      query("SELECT department, COUNT(*) as count FROM employees WHERE is_active = true AND department IS NOT NULL GROUP BY department ORDER BY count DESC"),
    ]);

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        departments: departments.rows.map(r => r.department),
        byDepartment: byDept.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getStats };
