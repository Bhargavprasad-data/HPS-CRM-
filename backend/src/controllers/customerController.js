const { query } = require('../config/db');

// GET /api/customers
const getCustomers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let pi = 1;

    if (search) {
      conditions.push(`(c.name ILIKE $${pi} OR c.email ILIKE $${pi} OR c.company ILIKE $${pi} OR c.phone ILIKE $${pi})`);
      params.push(`%${search}%`);
      pi++;
    }
    if (status) { conditions.push(`c.status = $${pi++}`); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) FROM customers c ${where}`, params);
    const result = await query(
      `SELECT c.*, e.name as assigned_to_name,
              (SELECT name FROM projects WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as assigned_project,
              (SELECT COUNT(*) FROM projects WHERE customer_id = c.id) as project_count,
              (SELECT COUNT(*) FROM invoices WHERE customer_id = c.id) as invoice_count
       FROM customers c
       LEFT JOIN employees e ON c.assigned_to = e.id
       ${where} ORDER BY c.created_at DESC
       LIMIT $${pi++} OFFSET $${pi}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
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

// GET /api/customers/:id
const getCustomer = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, e.name as assigned_to_name FROM customers c
       LEFT JOIN employees e ON c.assigned_to = e.id WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Get customer history
    const projects = await query('SELECT id, name, status, start_date, end_date FROM projects WHERE customer_id = $1', [req.params.id]);
    const invoices = await query('SELECT id, invoice_number, total, status, date FROM invoices WHERE customer_id = $1 ORDER BY date DESC LIMIT 5', [req.params.id]);
    const quotations = await query('SELECT id, quotation_number, total, status, date FROM quotations WHERE customer_id = $1 ORDER BY date DESC LIMIT 5', [req.params.id]);

    res.json({
      success: true,
      data: { ...result.rows[0], projects: projects.rows, invoices: invoices.rows, quotations: quotations.rows },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, company, website, address, city, state, country, pincode, gst_number, notes, assigned_to, project_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Customer name is required.' });

    const count = await query('SELECT COUNT(*) FROM customers');
    const customerCode = `CUST-${String(parseInt(count.rows[0].count) + 1).padStart(4, '0')}`;

    const result = await query(
      `INSERT INTO customers (customer_code, name, email, phone, company, website, address, city, state, country, pincode, gst_number, notes, assigned_to, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [customerCode, name, email, phone, company, website, address, city, state, country || 'India', pincode, gst_number, notes, assigned_to || null, req.user.userId]
    );

    if (project_id) {
      await query('UPDATE projects SET customer_id = $1 WHERE id = $2', [result.rows[0].id, project_id]);
    }

    res.status(201).json({ success: true, message: 'Customer created.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, company, website, address, city, state, country, pincode, gst_number, notes, assigned_to, status, project_id } = req.body;
    const result = await query(
      `UPDATE customers SET name=$1, email=$2, phone=$3, company=$4, website=$5, address=$6,
        city=$7, state=$8, country=$9, pincode=$10, gst_number=$11, notes=$12,
        assigned_to=$13, status=$14, updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [name, email, phone, company, website, address, city, state, country, pincode, gst_number, notes, assigned_to || null, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found.' });

    if (project_id) {
      await query('UPDATE projects SET customer_id = $1 WHERE id = $2', [req.params.id, project_id]);
    }

    res.json({ success: true, message: 'Customer updated.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    await query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Customer deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
