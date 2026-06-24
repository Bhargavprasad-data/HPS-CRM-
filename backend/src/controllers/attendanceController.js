const { query } = require('../config/db');

// POST /api/attendance/checkin
const checkIn = async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    let targetEmpId = employee_id;
    if (!targetEmpId && req.user) {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empResult.rows.length > 0) {
        targetEmpId = empResult.rows[0].id;
      }
    }

    if (!targetEmpId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    // Check if already checked in today
    const existing = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [targetEmpId, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].check_in) {
      return res.status(400).json({ success: false, message: 'Already checked in today.' });
    }

    const checkInTime = new Date();
    const standardTime = new Date();
    standardTime.setHours(9, 30, 0);
    const status = checkInTime > standardTime ? 'Late' : 'Present';

    let result;
    if (existing.rows.length > 0) {
      result = await query(
        'UPDATE attendance SET check_in = $1, status = $2, ip_address = $3 WHERE id = $4 RETURNING *',
        [now, status, req.ip, existing.rows[0].id]
      );
    } else {
      result = await query(
        'INSERT INTO attendance (employee_id, date, check_in, status, ip_address) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [targetEmpId, today, now, status, req.ip]
      );
    }

    res.json({ success: true, message: `Check-in recorded at ${now}`, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance/checkout
const checkOut = async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    let targetEmpId = employee_id;
    if (!targetEmpId && req.user) {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empResult.rows.length > 0) {
        targetEmpId = empResult.rows[0].id;
      }
    }

    if (!targetEmpId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    const existing = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [targetEmpId, today]
    );

    if (existing.rows.length === 0 || !existing.rows[0].check_in) {
      return res.status(400).json({ success: false, message: 'You must check in first.' });
    }

    if (existing.rows[0].check_out) {
      return res.status(400).json({ success: false, message: 'Already checked out today.' });
    }

    // Calculate working hours
    const checkIn = existing.rows[0].check_in;
    const [inH, inM, inS] = checkIn.split(':').map(Number);
    const [outH, outM, outS] = now.split(':').map(Number);
    const workingHours = ((outH * 60 + outM) - (inH * 60 + inM)) / 60;

    const result = await query(
      'UPDATE attendance SET check_out = $1, working_hours = $2 WHERE id = $3 RETURNING *',
      [now, workingHours.toFixed(2), existing.rows[0].id]
    );

    res.json({ success: true, message: `Check-out recorded at ${now}. Working hours: ${workingHours.toFixed(2)}h`, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance - List attendance records
const getAttendance = async (req, res, next) => {
  try {
    const { employee_id, date, month, year, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let pi = 1;

    let targetEmpId = employee_id;
    if (req.user && req.user.role === 'Staff') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empResult.rows.length > 0) {
        targetEmpId = empResult.rows[0].id;
      } else {
        targetEmpId = '00000000-0000-0000-0000-000000000000';
      }
    }

    if (targetEmpId) { conditions.push(`a.employee_id = $${pi++}`); params.push(targetEmpId); }
    if (date) { conditions.push(`a.date = $${pi++}`); params.push(date); }
    if (month && year) {
      conditions.push(`EXTRACT(MONTH FROM a.date) = $${pi++} AND EXTRACT(YEAR FROM a.date) = $${pi++}`);
      params.push(month, year);
    }

    if (req.user && req.user.role === 'Manager') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empResult.rows.length > 0) {
        const managerEmpId = empResult.rows[0].id;
        conditions.push(`e.manager_id = $${pi++}`);
        params.push(managerEmpId);
      } else {
        conditions.push('e.manager_id = -1');
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT a.*, e.name as employee_name, e.employee_code, e.department
       FROM attendance a JOIN employees e ON a.employee_id = e.id
       ${where} ORDER BY a.date DESC, a.created_at DESC
       LIMIT $${pi++} OFFSET $${pi}`,
      [...params, limit, offset]
    );

    const count = await query(
      `SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id ${where}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(count.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/today - Today's summary
const getTodayAttendance = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let queryStr = `
      SELECT a.*, e.name, e.employee_code, e.department, e.photo_url
      FROM attendance a JOIN employees e ON a.employee_id = e.id
      WHERE a.date = $1
    `;
    const params = [today];

    if (req.user && req.user.role === 'Manager') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empResult.rows.length > 0) {
        queryStr += ' AND e.manager_id = $2';
        params.push(empResult.rows[0].id);
      } else {
        queryStr += ' AND e.manager_id = -1';
      }
    }

    queryStr += ' ORDER BY a.check_in ASC';
    const result = await query(queryStr, params);

    const stats = {
      present: result.rows.filter(r => r.status === 'Present').length,
      late: result.rows.filter(r => r.status === 'Late').length,
      total: result.rows.length,
    };

    res.json({ success: true, data: result.rows, stats });
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance/leave
const applyLeave = async (req, res, next) => {
  try {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;
    let targetEmpId = employee_id;
    if (!targetEmpId && req.user) {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empResult.rows.length > 0) {
        targetEmpId = empResult.rows[0].id;
      }
    }

    if (!targetEmpId || !leave_type || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const result = await query(
      'INSERT INTO leaves (employee_id, leave_type, start_date, end_date, total_days, reason) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [targetEmpId, leave_type, start_date, end_date, totalDays, reason]
    );

    // Notify manager or admin
    const leave = result.rows[0];
    const empDetails = await query('SELECT name, manager_id FROM employees WHERE id = $1', [targetEmpId]);
    if (empDetails.rows.length > 0) {
      const employeeName = empDetails.rows[0].name;
      const managerId = empDetails.rows[0].manager_id;
      const { createNotification } = require('../utils/notificationHelper');
      
      if (managerId) {
        const mgrUser = await query('SELECT user_id FROM employees WHERE id = $1', [managerId]);
        if (mgrUser.rows.length > 0 && mgrUser.rows[0].user_id) {
          await createNotification(
            mgrUser.rows[0].user_id,
            'New Leave Application',
            `${employeeName} has applied for leave (${leave_type}) from ${new Date(start_date).toLocaleDateString('en-IN')} to ${new Date(end_date).toLocaleDateString('en-IN')}.`,
            'info',
            '/attendance'
          );
        }
      } else {
        const admins = await query('SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = \'Admin\' LIMIT 1)');
        for (const admin of admins.rows) {
          await createNotification(
            admin.id,
            'New Leave Application',
            `${employeeName} has applied for leave (${leave_type}) from ${new Date(start_date).toLocaleDateString('en-IN')} to ${new Date(end_date).toLocaleDateString('en-IN')}.`,
            'info',
            '/attendance'
          );
        }
      }
    }

    res.status(201).json({ success: true, message: 'Leave application submitted.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// PUT /api/attendance/leave/:id/approve
const approveLeave = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await query(
      'UPDATE leaves SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 RETURNING *',
      [status, req.user.userId, req.params.id]
    );

    // Notify employee of leave status change
    const leave = result.rows[0];
    if (leave) {
      const empRes = await query('SELECT user_id FROM employees WHERE id = $1', [leave.employee_id]);
      if (empRes.rows.length > 0 && empRes.rows[0].user_id) {
        const { createNotification } = require('../utils/notificationHelper');
        await createNotification(
          empRes.rows[0].user_id,
          `Leave Request ${status}`,
          `Your leave request from ${new Date(leave.start_date).toLocaleDateString('en-IN')} to ${new Date(leave.end_date).toLocaleDateString('en-IN')} has been ${status.toLowerCase()}.`,
          status === 'Approved' ? 'success' : 'error',
          '/leaves'
        );
      }
    }
    res.json({ success: true, message: `Leave ${status}.`, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/leaves
const getLeaves = async (req, res, next) => {
  try {
    const { employee_id, status } = req.query;
    let conditions = [];
    let params = [];
    let pi = 1;

    let targetEmpId = employee_id;
    if (req.user && req.user.role === 'Staff') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empResult.rows.length > 0) {
        targetEmpId = empResult.rows[0].id;
      } else {
        targetEmpId = '00000000-0000-0000-0000-000000000000';
      }
    }

    if (targetEmpId) { conditions.push(`l.employee_id = $${pi++}`); params.push(targetEmpId); }
    if (status) { conditions.push(`l.status = $${pi++}`); params.push(status); }

    if (req.user && req.user.role === 'Manager') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empResult.rows.length > 0) {
        const managerEmpId = empResult.rows[0].id;
        conditions.push(`e.manager_id = $${pi++}`);
        params.push(managerEmpId);
      } else {
        conditions.push('e.manager_id = -1');
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT l.*, e.name as employee_name, e.employee_code, e.department
       FROM leaves l JOIN employees e ON l.employee_id = e.id
       ${where} ORDER BY l.created_at DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkIn, checkOut, getAttendance, getTodayAttendance, applyLeave, approveLeave, getLeaves };
