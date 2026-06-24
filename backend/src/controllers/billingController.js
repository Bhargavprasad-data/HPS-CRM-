const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { sendEmail, templates } = require('../config/mail');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ─── QUOTATIONS ────────────────────────────────────────────────

// GET /api/billing/quotations
const getQuotations = async (req, res, next) => {
  try {
    const { customer_id, status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let pi = 1;

    if (customer_id) { conditions.push(`q.customer_id = $${pi++}`); params.push(customer_id); }
    if (status) { conditions.push(`q.status = $${pi++}`); params.push(status); }
    if (search) { conditions.push(`(q.quotation_number ILIKE $${pi} OR c.name ILIKE $${pi})`); params.push(`%${search}%`); pi++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT q.*, c.name as customer_name, c.email as customer_email, c.company
       FROM quotations q JOIN customers c ON q.customer_id = c.id
       ${where} ORDER BY q.created_at DESC LIMIT $${pi++} OFFSET $${pi}`,
      [...params, limit, offset]
    );
    const count = await query(`SELECT COUNT(*) FROM quotations q JOIN customers c ON q.customer_id = c.id ${where}`, params);

    res.json({ success: true, data: result.rows, pagination: { total: parseInt(count.rows[0].count) } });
  } catch (error) { next(error); }
};

// POST /api/billing/quotations
const createQuotation = async (req, res, next) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    const { customer_id, date, expiry_date, subject, notes, terms, items, tax_percent, discount } = req.body;

    if (!customer_id || !items?.length) {
      return res.status(400).json({ success: false, message: 'Customer and items are required.' });
    }

    const count = await client.query('SELECT COUNT(*) FROM quotations');
    const quotationNumber = `QUO-${String(parseInt(count.rows[0].count) + 1).padStart(5, '0')}`;

    let subtotal = 0;
    for (const item of items) { subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price); }
    const discountAmt = parseFloat(discount || 0);
    const taxPercent = parseFloat(tax_percent || 18);
    const taxAmount = (subtotal - discountAmt) * (taxPercent / 100);
    const total = subtotal - discountAmt + taxAmount;

    const q = await client.query(
      `INSERT INTO quotations (quotation_number, customer_id, date, expiry_date, subject, notes, terms, subtotal, discount, tax_percent, tax_amount, total, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [quotationNumber, customer_id, date || new Date(), expiry_date, subject, notes, terms, subtotal, discountAmt, taxPercent, taxAmount, total, req.user.userId]
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      await client.query(
        'INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
        [q.rows[0].id, item.description, item.quantity, item.unit_price, itemTotal, i]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Quotation created.', data: q.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); next(error); }
  finally { client.release(); }
};

// POST /api/billing/quotations/:id/generate-pdf
const generateQuotationPdf = async (req, res, next) => {
  try {
    const q = await query(
      `SELECT qu.*, c.name as customer_name, c.email as customer_email, c.company, c.address, c.gst_number, c.phone
       FROM quotations qu JOIN customers c ON qu.customer_id = c.id WHERE qu.id = $1`,
      [req.params.id]
    );
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: 'Quotation not found.' });

    const items = await query('SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order', [req.params.id]);
    const data = q.rows[0];

    const uploadsDir = path.join(__dirname, '../../uploads/quotations');
    ensureDir(uploadsDir);
    const filename = `quotation_${data.quotation_number}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.rect(0, 0, 595, 100).fill('#1e3a5f');
    doc.fillColor('white').fontSize(26).font('Helvetica-Bold').text('HPS CRM', 50, 25);
    doc.fontSize(10).font('Helvetica').text('Harsha Perfect Solutions', 50, 55);
    doc.fontSize(22).font('Helvetica-Bold').text('QUOTATION', 350, 30);
    doc.fontSize(11).font('Helvetica').text(data.quotation_number, 350, 58);

    // Billing details
    doc.fillColor('#333').fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 120);
    doc.font('Helvetica').fontSize(10).fillColor('#555');
    doc.text(data.customer_name, 50, 135);
    doc.text(data.company || '', 50, 150);
    doc.text(data.customer_email || '', 50, 165);
    doc.text(`GST: ${data.gst_number || 'N/A'}`, 50, 180);

    doc.fillColor('#333').fontSize(10).font('Helvetica-Bold').text('Date:', 350, 120);
    doc.font('Helvetica').fillColor('#555').text(new Date(data.date).toLocaleDateString('en-IN'), 400, 120);
    doc.font('Helvetica-Bold').text('Expiry:', 350, 135);
    doc.font('Helvetica').text(data.expiry_date ? new Date(data.expiry_date).toLocaleDateString('en-IN') : 'N/A', 400, 135);

    // Items table header
    const tableY = 220;
    doc.rect(50, tableY, 495, 25).fill('#1e3a5f');
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
    doc.text('#', 60, tableY + 8);
    doc.text('Description', 85, tableY + 8);
    doc.text('Qty', 330, tableY + 8);
    doc.text('Unit Price', 375, tableY + 8);
    doc.text('Total', 460, tableY + 8);

    let rowY = tableY + 30;
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    items.rows.forEach((item, idx) => {
      if (idx % 2 === 0) doc.rect(50, rowY - 5, 495, 22).fill('#f9fafb');
      doc.fillColor('#333');
      doc.text(String(idx + 1), 60, rowY);
      doc.text(item.description, 85, rowY, { width: 230 });
      doc.text(String(item.quantity), 330, rowY);
      doc.text(fmt(item.unit_price), 375, rowY);
      doc.text(fmt(item.total), 460, rowY);
      rowY += 25;
    });

    // Totals
    const totY = rowY + 15;
    doc.moveTo(350, totY).lineTo(545, totY).strokeColor('#ddd').lineWidth(1).stroke();
    doc.fillColor('#555').fontSize(10).font('Helvetica').text('Subtotal:', 350, totY + 8); doc.text(fmt(data.subtotal), 460, totY + 8);
    doc.text(`Discount:`, 350, totY + 25); doc.text(`-${fmt(data.discount)}`, 460, totY + 25);
    doc.text(`Tax (${data.tax_percent}%):`, 350, totY + 42); doc.text(fmt(data.tax_amount), 460, totY + 42);
    doc.rect(350, totY + 58, 195, 30).fill('#1e3a5f');
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold').text('TOTAL:', 360, totY + 67); doc.text(fmt(data.total), 450, totY + 67);

    if (data.notes) {
      doc.fillColor('#555').fontSize(9).font('Helvetica').text('Notes: ' + data.notes, 50, totY + 100);
    }
    if (data.terms) {
      doc.text('Terms & Conditions: ' + data.terms, 50, totY + 115);
    }
    doc.fillColor('#999').fontSize(8).text('Thank you for your business! | HPS CRM - Harsha Perfect Solutions', 50, 780, { align: 'center', width: 495 });

    doc.end();
    await new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); });

    await query('UPDATE quotations SET pdf_url = $1, status = CASE WHEN status = $2 THEN $3 ELSE status END WHERE id = $4',
      [`/uploads/quotations/${filename}`, 'Draft', 'Draft', data.id]);

    res.json({ success: true, message: 'Quotation PDF generated.', data: { pdfUrl: `/uploads/quotations/${filename}` } });
  } catch (error) { next(error); }
};

// POST /api/billing/quotations/:id/send
const sendQuotation = async (req, res, next) => {
  try {
    const q = await query(
      'SELECT qu.*, c.name, c.email FROM quotations qu JOIN customers c ON qu.customer_id = c.id WHERE qu.id = $1',
      [req.params.id]
    );
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: 'Quotation not found.' });
    const data = q.rows[0];
    if (!data.pdf_url) return res.status(400).json({ success: false, message: 'Generate PDF first.' });

    const { subject, html } = templates.quotation(data.name, data.quotation_number, data.total);
    const filepath = path.join(__dirname, '../../', data.pdf_url);
    await sendEmail({ to: data.email, subject, html, attachments: [{ filename: `${data.quotation_number}.pdf`, path: filepath }] });
    await query("UPDATE quotations SET status = 'Sent' WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: `Quotation sent to ${data.email}` });
  } catch (error) { next(error); }
};

// POST /api/billing/quotations/:id/convert - Convert to Invoice
const convertToInvoice = async (req, res, next) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    const { due_date } = req.body;
    const q = await client.query(
      'SELECT * FROM quotations WHERE id = $1', [req.params.id]
    );
    if (q.rows.length === 0) return res.status(404).json({ success: false, message: 'Quotation not found.' });
    const quotation = q.rows[0];

    const count = await client.query('SELECT COUNT(*) FROM invoices');
    const invoiceNumber = `INV-${String(parseInt(count.rows[0].count) + 1).padStart(5, '0')}`;

    const inv = await client.query(
      `INSERT INTO invoices (invoice_number, customer_id, quotation_id, date, due_date, subject, notes, terms, subtotal, discount, tax_percent, tax_amount, total, balance_due, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [invoiceNumber, quotation.customer_id, quotation.id, new Date(), due_date, quotation.subject,
        quotation.notes, quotation.terms, quotation.subtotal, quotation.discount, quotation.tax_percent,
        quotation.tax_amount, quotation.total, quotation.total, req.user.userId]
    );

    // Copy items
    const qItems = await client.query('SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order', [quotation.id]);
    for (const item of qItems.rows) {
      await client.query(
        'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
        [inv.rows[0].id, item.description, item.quantity, item.unit_price, item.total, item.sort_order]
      );
    }

    await client.query("UPDATE quotations SET status = 'Accepted' WHERE id = $1", [quotation.id]);
    await client.query('COMMIT');

    res.status(201).json({ success: true, message: 'Invoice created from quotation.', data: inv.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); next(error); }
  finally { client.release(); }
};

// ─── INVOICES ────────────────────────────────────────────────

// GET /api/billing/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { customer_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let pi = 1;

    if (customer_id) { conditions.push(`i.customer_id = $${pi++}`); params.push(customer_id); }
    if (status) { conditions.push(`i.status = $${pi++}`); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT i.*, c.name as customer_name, c.email as customer_email, c.company
       FROM invoices i JOIN customers c ON i.customer_id = c.id
       ${where} ORDER BY i.created_at DESC LIMIT $${pi++} OFFSET $${pi}`,
      [...params, limit, offset]
    );
    const count = await query(`SELECT COUNT(*) FROM invoices i ${where}`, params);
    res.json({ success: true, data: result.rows, pagination: { total: parseInt(count.rows[0].count) } });
  } catch (error) { next(error); }
};

// POST /api/billing/invoices
const createInvoice = async (req, res, next) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    const { customer_id, due_date, subject, notes, terms, items, tax_percent, discount } = req.body;

    const count = await client.query('SELECT COUNT(*) FROM invoices');
    const invoiceNumber = `INV-${String(parseInt(count.rows[0].count) + 1).padStart(5, '0')}`;

    let subtotal = 0;
    for (const item of items) { subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price); }
    const discountAmt = parseFloat(discount || 0);
    const taxPercent = parseFloat(tax_percent || 18);
    const taxAmount = (subtotal - discountAmt) * (taxPercent / 100);
    const total = subtotal - discountAmt + taxAmount;

    const inv = await client.query(
      `INSERT INTO invoices (invoice_number, customer_id, date, due_date, subject, notes, terms, subtotal, discount, tax_percent, tax_amount, total, balance_due, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [invoiceNumber, customer_id, new Date(), due_date, subject, notes, terms, subtotal, discountAmt, taxPercent, taxAmount, total, total, req.user.userId]
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await client.query(
        'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
        [inv.rows[0].id, item.description, item.quantity, item.unit_price, parseFloat(item.quantity) * parseFloat(item.unit_price), i]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Invoice created.', data: inv.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); next(error); }
  finally { client.release(); }
};

// POST /api/billing/invoices/:id/generate-pdf
const generateInvoicePdf = async (req, res, next) => {
  try {
    const invResult = await query(
      `SELECT i.*, c.name as customer_name, c.email as customer_email, c.company, c.address, c.gst_number, c.phone
       FROM invoices i JOIN customers c ON i.customer_id = c.id WHERE i.id = $1`,
      [req.params.id]
    );
    if (invResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const items = await query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order', [req.params.id]);
    const data = invResult.rows[0];

    const uploadsDir = path.join(__dirname, '../../uploads/invoices');
    ensureDir(uploadsDir);
    const filename = `invoice_${data.invoice_number}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.rect(0, 0, 595, 100).fill('#0f4c81');
    doc.fillColor('white').fontSize(26).font('Helvetica-Bold').text('HPS CRM', 50, 25);
    doc.fontSize(10).font('Helvetica').text('Harsha Perfect Solutions', 50, 55);
    doc.fontSize(22).font('Helvetica-Bold').text('INVOICE', 390, 30);
    doc.fontSize(11).font('Helvetica').text(data.invoice_number, 390, 58);

    doc.fillColor('#333').fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 120);
    doc.font('Helvetica').fontSize(10).fillColor('#555');
    doc.text(data.customer_name, 50, 135);
    doc.text(data.company || '', 50, 150);
    doc.text(data.customer_email || '', 50, 165);
    doc.text(`GST: ${data.gst_number || 'N/A'}`, 50, 180);

    doc.fillColor('#333').fontSize(10).font('Helvetica-Bold').text('Invoice Date:', 350, 120);
    doc.font('Helvetica').fillColor('#555').text(new Date(data.date).toLocaleDateString('en-IN'), 440, 120);
    doc.font('Helvetica-Bold').text('Due Date:', 350, 137);
    doc.font('Helvetica').text(data.due_date ? new Date(data.due_date).toLocaleDateString('en-IN') : 'N/A', 440, 137);
    doc.font('Helvetica-Bold').text('Status:', 350, 154);
    doc.font('Helvetica').text(data.status, 440, 154);

    const tableY = 220;
    doc.rect(50, tableY, 495, 25).fill('#0f4c81');
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
    doc.text('#', 60, tableY + 8); doc.text('Description', 85, tableY + 8);
    doc.text('Qty', 330, tableY + 8); doc.text('Unit Price', 375, tableY + 8); doc.text('Total', 460, tableY + 8);

    let rowY = tableY + 30;
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    items.rows.forEach((item, idx) => {
      if (idx % 2 === 0) doc.rect(50, rowY - 5, 495, 22).fill('#f0f7ff');
      doc.fillColor('#333');
      doc.text(String(idx + 1), 60, rowY); doc.text(item.description, 85, rowY, { width: 230 });
      doc.text(String(item.quantity), 330, rowY); doc.text(fmt(item.unit_price), 375, rowY); doc.text(fmt(item.total), 460, rowY);
      rowY += 25;
    });

    const totY = rowY + 15;
    doc.fillColor('#555').fontSize(10).font('Helvetica');
    doc.text('Subtotal:', 350, totY); doc.text(fmt(data.subtotal), 460, totY);
    doc.text(`Tax (${data.tax_percent}%):`, 350, totY + 17); doc.text(fmt(data.tax_amount), 460, totY + 17);
    doc.rect(350, totY + 33, 195, 30).fill('#0f4c81');
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold').text('TOTAL:', 360, totY + 42); doc.text(fmt(data.total), 450, totY + 42);
    doc.fillColor('#e53e3e').text(`Balance Due: ${fmt(data.balance_due)}`, 360, totY + 70);
    doc.fillColor('#999').fontSize(8).font('Helvetica').text('Thank you for your business! | HPS CRM - Harsha Perfect Solutions', 50, 780, { align: 'center', width: 495 });

    doc.end();
    await new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); });
    await query('UPDATE invoices SET pdf_url = $1 WHERE id = $2', [`/uploads/invoices/${filename}`, data.id]);

    res.json({ success: true, message: 'Invoice PDF generated.', data: { pdfUrl: `/uploads/invoices/${filename}` } });
  } catch (error) { next(error); }
};

// PUT /api/billing/invoices/:id/mark-paid
const markInvoicePaid = async (req, res, next) => {
  try {
    const { payment_method, paid_amount } = req.body;
    const result = await query(
      `UPDATE invoices SET paid_amount = $1, balance_due = total - $1,
        status = CASE WHEN $1 >= total THEN 'Paid' ELSE 'Partially Paid' END,
        payment_method = $2, payment_date = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [paid_amount, payment_method, req.params.id]
    );
    res.json({ success: true, message: 'Payment recorded.', data: result.rows[0] });
  } catch (error) { next(error); }
};

module.exports = {
  getQuotations, createQuotation, generateQuotationPdf, sendQuotation, convertToInvoice,
  getInvoices, createInvoice, generateInvoicePdf, markInvoicePaid,
};
