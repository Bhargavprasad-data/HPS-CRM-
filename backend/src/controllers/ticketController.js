const { query } = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');

// GET /api/tickets
const getTickets = async (req, res, next) => {
  try {
    const { search, status, priority, assigned_to, raised_by, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let pi = 1;

    if (search) { conditions.push(`(t.title ILIKE $${pi} OR t.description ILIKE $${pi} OR t.ticket_number ILIKE $${pi})`); params.push(`%${search}%`); pi++; }
    if (status) { conditions.push(`t.status = $${pi++}`); params.push(status); }
    if (priority) { conditions.push(`t.priority = $${pi++}`); params.push(priority); }
    if (assigned_to) { conditions.push(`t.assigned_to = $${pi++}`); params.push(assigned_to); }
    if (raised_by) { conditions.push(`t.raised_by = $${pi++}`); params.push(raised_by); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) FROM tickets t ${where}`, params);
    const result = await query(
      `SELECT t.*, r.name as raised_by_name, r.employee_code as raised_by_code,
              a.name as assigned_to_name
       FROM tickets t
       JOIN employees r ON t.raised_by = r.id
       LEFT JOIN employees a ON t.assigned_to = a.id
       ${where} ORDER BY
         CASE t.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
         t.created_at DESC
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

// GET /api/tickets/:id
const getTicket = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT t.*, r.name as raised_by_name, r.photo_url as raised_by_photo, r.department,
              a.name as assigned_to_name, a.photo_url as assigned_to_photo
       FROM tickets t
       JOIN employees r ON t.raised_by = r.id
       LEFT JOIN employees a ON t.assigned_to = a.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets
const createTicket = async (req, res, next) => {
  try {
    const { title, description, raised_by, priority, category } = req.body;
    
    let employeeId = raised_by;
    if (!employeeId && req.user) {
      const empRes = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empRes.rows.length > 0) {
        employeeId = empRes.rows[0].id;
      }
    }

    if (!title || !employeeId) {
      return res.status(400).json({ success: false, message: 'Title and employee ID are required.' });
    }

    const count = await query('SELECT COUNT(*) FROM tickets');
    const ticketNumber = `TKT-${String(parseInt(count.rows[0].count) + 1).padStart(5, '0')}`;

    const result = await query(
      'INSERT INTO tickets (ticket_number, title, description, raised_by, priority, category) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [ticketNumber, title, description, employeeId, priority || 'Medium', category]
    );

    // Notify admins
    const admins = await query("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name IN ('Admin', 'Manager')");
    for (const admin of admins.rows) {
      await createNotification(
        admin.id,
        'New Support Ticket',
        `Ticket ${ticketNumber}: ${title} (Priority: ${priority || 'Medium'})`,
        'warning',
        '/tickets'
      );
    }

    res.status(201).json({ success: true, message: 'Ticket raised successfully.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tickets/:id
const updateTicket = async (req, res, next) => {
  try {
    const { status, assigned_to, priority, resolution } = req.body;
    const updates = [];
    const params = [];
    let pi = 1;

    if (status !== undefined) { updates.push(`status = $${pi++}`); params.push(status); }
    if (assigned_to !== undefined) { updates.push(`assigned_to = $${pi++}`); params.push(assigned_to); }
    if (priority !== undefined) { updates.push(`priority = $${pi++}`); params.push(priority); }
    if (resolution !== undefined) { updates.push(`resolution = $${pi++}`); params.push(resolution); }
    if (status === 'Resolved' || status === 'Closed') {
      updates.push(`resolved_at = NOW()`);
    }
    updates.push(`updated_at = NOW()`);

    const result = await query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${pi} RETURNING *`,
      [...params, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const ticket = result.rows[0];

    // Notify assigned employee
    if (assigned_to) {
      const empRes = await query('SELECT user_id FROM employees WHERE id = $1', [assigned_to]);
      if (empRes.rows.length > 0 && empRes.rows[0].user_id) {
        await createNotification(
          empRes.rows[0].user_id,
          'Ticket Assigned',
          `Ticket ${ticket.ticket_number} has been assigned to you.`,
          'info',
          '/tickets'
        );
      }
    }

    // Notify the creator of status updates
    if (status) {
      const creatorRes = await query('SELECT user_id FROM employees WHERE id = $1', [ticket.raised_by]);
      if (creatorRes.rows.length > 0 && creatorRes.rows[0].user_id) {
        await createNotification(
          creatorRes.rows[0].user_id,
          'Ticket Status Update',
          `Ticket ${ticket.ticket_number} status updated to: ${status}`,
          status === 'Resolved' ? 'success' : 'info',
          '/tickets'
        );
      }
    }

    res.json({ success: true, message: 'Ticket updated.', data: ticket });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets/stats
const getTicketStats = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'Open') as open,
        COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'Resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'Closed') as closed,
        COUNT(*) FILTER (WHERE priority = 'Critical') as critical,
        COUNT(*) FILTER (WHERE priority = 'High') as high,
        COUNT(*) as total
       FROM tickets`
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTickets, getTicket, createTicket, updateTicket, getTicketStats };
