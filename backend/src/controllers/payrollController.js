const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { sendEmail, templates } = require('../config/mail');
const { createNotification } = require('../utils/notificationHelper');

// Helper to ensure uploads dir exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// POST /api/payroll/process - Process payroll for a month
const processPayroll = async (req, res, next) => {
  try {
    const { employee_id, month, year, status, custom_salary } = req.body;
    if (!employee_id || !month || !year) {
      return res.status(400).json({ success: false, message: 'Employee, month, and year are required.' });
    }

    const empResult = await query(
      'SELECT e.*, u.email FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = $1',
      [employee_id]
    );
    if (empResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    const emp = empResult.rows[0];

    // Get attendance for the month
    const attendResult = await query(
      `SELECT COUNT(*) FILTER (WHERE status IN ('Present','Late')) as present_days,
              COUNT(*) FILTER (WHERE status = 'Absent') as absent_days,
              COUNT(*) as total_recorded,
              COALESCE(SUM(working_hours), 0) as total_hours
       FROM attendance WHERE employee_id = $1
       AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`,
      [employee_id, month, year]
    );
    const attend = attendResult.rows[0];

    // Get leaves taken
    const leavesResult = await query(
      `SELECT COALESCE(SUM(total_days), 0) as leaves_taken FROM leaves
       WHERE employee_id = $1 AND status = 'Approved'
       AND EXTRACT(MONTH FROM start_date) = $2 AND EXTRACT(YEAR FROM start_date) = $3`,
      [employee_id, month, year]
    );
    const leavesTaken = parseInt(leavesResult.rows[0].leaves_taken);

    // Salary calculation
    const workingDaysInMonth = 26;
    const presentDays = parseInt(attend.present_days) || 0;
    
    // Use custom salary if provided, otherwise employee base salary
    const baseSalary = (custom_salary !== undefined && custom_salary !== '') ? parseFloat(custom_salary) : parseFloat(emp.salary);
    const perDaySalary = baseSalary / workingDaysInMonth;
    const earnedBasic = perDaySalary * presentDays;

    const hra = earnedBasic * 0.40;
    const transportAllowance = 1600;
    const otherAllowances = earnedBasic * 0.10;
    const grossSalary = earnedBasic + hra + transportAllowance + otherAllowances;

    const pfDeduction = earnedBasic * 0.12;
    const taxDeduction = grossSalary > 50000 ? grossSalary * 0.10 : 0;
    const totalDeductions = pfDeduction + taxDeduction;
    const netSalary = grossSalary - totalDeductions;

    const payrollStatus = status || 'Unpaid';
    const isPaid = payrollStatus === 'Paid';
    const payDate = isPaid ? new Date().toISOString().split('T')[0] : null;
    const payMethod = isPaid ? 'Bank Transfer' : null;

    // Check if already exists
    const existingResult = await query(
      'SELECT id FROM payrolls WHERE employee_id = $1 AND month = $2 AND year = $3',
      [employee_id, month, year]
    );

    let payrollResult;
    if (existingResult.rows.length > 0) {
      payrollResult = await query(
        `UPDATE payrolls SET basic_salary=$1, hra=$2, transport_allowance=$3, other_allowances=$4,
          pf_deduction=$5, tax_deduction=$6, gross_salary=$7, net_salary=$8,
          working_days=$9, present_days=$10, leaves_taken=$11, processed_by=$12, status=$13,
          payment_date=$14, payment_method=$15, updated_at=NOW()
         WHERE id=$16 RETURNING *`,
        [earnedBasic, hra, transportAllowance, otherAllowances, pfDeduction, taxDeduction,
          grossSalary, netSalary, workingDaysInMonth, presentDays, leavesTaken,
          req.user.userId, payrollStatus, payDate, payMethod, existingResult.rows[0].id]
      );
    } else {
      payrollResult = await query(
        `INSERT INTO payrolls (employee_id, month, year, basic_salary, hra, transport_allowance, other_allowances,
          pf_deduction, tax_deduction, gross_salary, net_salary, working_days, present_days, leaves_taken, processed_by, status, payment_date, payment_method)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [employee_id, month, year, earnedBasic, hra, transportAllowance, otherAllowances,
          pfDeduction, taxDeduction, grossSalary, netSalary, workingDaysInMonth, presentDays, leavesTaken, req.user.userId, payrollStatus, payDate, payMethod]
      );
    }

    // Notify employee
    await createNotification(
      emp.user_id,
      isPaid ? 'Salary Disbursed' : 'Payroll Processed',
      isPaid 
        ? `Your salary of ₹${parseFloat(netSalary).toLocaleString('en-IN')} for ${month}/${year} has been credited.`
        : `Your payroll for ${month}/${year} has been processed. Net Salary: ₹${parseFloat(netSalary).toLocaleString('en-IN')}`,
      isPaid ? 'success' : 'info',
      '/payroll'
    );

    res.json({
      success: true,
      message: 'Payroll processed successfully.',
      data: { ...payrollResult.rows[0], employee: emp },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payroll - List payrolls
const getPayrolls = async (req, res, next) => {
  try {
    const { month, year, employee_id, status, page = 1, limit = 20 } = req.query;
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
        return res.json({
          success: true,
          data: [],
          pagination: { total: 0, page: parseInt(page), limit: parseInt(limit) },
        });
      }
    }

    if (targetEmpId) { conditions.push(`p.employee_id = $${pi++}`); params.push(targetEmpId); }
    if (month) { conditions.push(`p.month = $${pi++}`); params.push(month); }
    if (year) { conditions.push(`p.year = $${pi++}`); params.push(year); }
    if (status) { conditions.push(`p.status = $${pi++}`); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT p.*, e.name as employee_name, e.employee_code, e.department, e.designation
       FROM payrolls p JOIN employees e ON p.employee_id = e.id
       ${where} ORDER BY p.year DESC, p.month DESC
       LIMIT $${pi++} OFFSET $${pi}`,
      [...params, limit, offset]
    );

    const count = await query(`SELECT COUNT(*) FROM payrolls p ${where}`, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: { total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payroll/:id/generate-slip - Generate salary slip PDF
const generateSalarySlip = async (req, res, next) => {
  try {
    let result;
    if (req.user && req.user.role === 'Staff') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.userId]);
      if (empResult.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Forbidden. No employee record found.' });
      }
      const employeeId = empResult.rows[0].id;
      result = await query(
        `SELECT p.*, e.name, e.employee_code, e.email, e.department, e.designation, e.bank_account
         FROM payrolls p JOIN employees e ON p.employee_id = e.id
         WHERE p.id = $1 AND p.employee_id = $2`,
        [req.params.id, employeeId]
      );
    } else {
      result = await query(
        `SELECT p.*, e.name, e.employee_code, e.email, e.department, e.designation, e.bank_account
         FROM payrolls p JOIN employees e ON p.employee_id = e.id
         WHERE p.id = $1`,
        [req.params.id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payroll record not found.' });
    }

    const p = result.rows[0];
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const uploadsDir = path.join(__dirname, '../../uploads/payslips');
    ensureDir(uploadsDir);
    const filename = `salary_slip_${p.employee_code}_${p.month}_${p.year}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.rect(0, 0, 595, 120).fill('#1e3a5f');
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('HPS CRM', 50, 30);
    doc.fontSize(11).font('Helvetica').text('Harsha Perfect Solutions', 50, 58);
    doc.fontSize(18).font('Helvetica-Bold').text('SALARY SLIP', 350, 40);
    doc.fontSize(11).font('Helvetica').text(`${monthNames[p.month]} ${p.year}`, 350, 65);

    // Employee Info
    doc.fillColor('#1e3a5f').fontSize(13).font('Helvetica-Bold').text('Employee Details', 50, 140);
    doc.moveTo(50, 158).lineTo(545, 158).strokeColor('#1e3a5f').lineWidth(1).stroke();

    const infoY = 170;
    doc.fillColor('#333').fontSize(10).font('Helvetica');
    doc.text(`Employee Name: ${p.name}`, 50, infoY);
    doc.text(`Employee Code: ${p.employee_code}`, 50, infoY + 18);
    doc.text(`Department: ${p.department || '-'}`, 50, infoY + 36);
    doc.text(`Designation: ${p.designation || '-'}`, 50, infoY + 54);
    doc.text(`Bank Account: ${p.bank_account || '-'}`, 300, infoY);
    doc.text(`Working Days: ${p.working_days}`, 300, infoY + 18);
    doc.text(`Present Days: ${p.present_days}`, 300, infoY + 36);
    doc.text(`Leaves Taken: ${p.leaves_taken}`, 300, infoY + 54);

    // Earnings & Deductions
    const tableY = 265;
    doc.fillColor('#1e3a5f').fontSize(13).font('Helvetica-Bold').text('Earnings', 50, tableY);
    doc.text('Deductions', 300, tableY);
    doc.moveTo(50, tableY + 18).lineTo(545, tableY + 18).strokeColor('#1e3a5f').lineWidth(1).stroke();

    const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const rowY = tableY + 28;
    doc.fillColor('#333').fontSize(10).font('Helvetica');

    const earnings = [
      ['Basic Salary', p.basic_salary],
      ['HRA (40%)', p.hra],
      ['Transport Allow.', p.transport_allowance],
      ['Other Allowances', p.other_allowances],
    ];
    const deductions = [
      ['PF Deduction (12%)', p.pf_deduction],
      ['Tax Deduction', p.tax_deduction],
      ['Other Deductions', p.other_deductions],
    ];

    earnings.forEach(([label, val], i) => {
      doc.text(label, 50, rowY + i * 22);
      doc.text(fmt(val), 200, rowY + i * 22, { align: 'right', width: 80 });
    });
    deductions.forEach(([label, val], i) => {
      doc.text(label, 300, rowY + i * 22);
      doc.text(fmt(val), 450, rowY + i * 22, { align: 'right', width: 80 });
    });

    // Totals
    const totY = rowY + 110;
    doc.rect(50, totY, 240, 1).fill('#ccc');
    doc.rect(300, totY, 245, 1).fill('#ccc');
    doc.fillColor('#1e3a5f').fontSize(11).font('Helvetica-Bold');
    doc.text('Gross Salary:', 50, totY + 10);
    doc.text(fmt(p.gross_salary), 200, totY + 10, { align: 'right', width: 80 });
    doc.text('Total Deductions:', 300, totY + 10);
    doc.text(fmt(parseFloat(p.pf_deduction || 0) + parseFloat(p.tax_deduction || 0) + parseFloat(p.other_deductions || 0)), 450, totY + 10, { align: 'right', width: 80 });

    // Net Salary Banner
    const netY = totY + 45;
    doc.rect(50, netY, 495, 45).fill('#1e3a5f');
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold');
    doc.text('NET SALARY:', 70, netY + 14);
    doc.fontSize(18).text(fmt(p.net_salary), 300, netY + 10, { align: 'right', width: 225 });

    // Footer
    doc.fillColor('#666').fontSize(9).font('Helvetica').text('This is a computer-generated salary slip. No signature required.', 50, 720, { align: 'center', width: 495 });
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} | HPS CRM - Harsha Perfect Solutions`, 50, 735, { align: 'center', width: 495 });

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Update payroll with PDF path
    await query('UPDATE payrolls SET pdf_url = $1 WHERE id = $2', [`/uploads/payslips/${filename}`, p.id]);

    res.json({ success: true, message: 'Salary slip generated.', data: { pdfUrl: `/uploads/payslips/${filename}`, filename } });
  } catch (error) {
    next(error);
  }
};

// POST /api/payroll/:id/send-slip - Email salary slip
const sendSalarySlip = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT p.*, e.name, e.email, e.employee_code FROM payrolls p JOIN employees e ON p.employee_id = e.id WHERE p.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payroll not found.' });
    }
    const p = result.rows[0];
    if (!p.pdf_url) {
      return res.status(400).json({ success: false, message: 'Please generate the salary slip PDF first.' });
    }

    const filepath = path.join(__dirname, '../../', p.pdf_url);
    const { subject, html } = templates.salarySlip(p.name, p.month, p.year, p.net_salary);

    await sendEmail({
      to: p.email,
      subject,
      html,
      attachments: [{ filename: `Salary_Slip_${p.month}_${p.year}.pdf`, path: filepath }],
    });

    await query(
      'INSERT INTO email_logs (recipient, subject, template_name, entity_type, entity_id, status) VALUES ($1,$2,$3,$4,$5,$6)',
      [p.email, subject, 'salary_slip', 'PAYROLL', p.id, 'Sent']
    );

    res.json({ success: true, message: `Salary slip emailed to ${p.email}` });
  } catch (error) {
    next(error);
  }
};

// PUT /api/payroll/:id/mark-paid
const markAsPaid = async (req, res, next) => {
  try {
    const { payment_method, payment_date } = req.body;
    const result = await query(
      "UPDATE payrolls SET status='Paid', payment_method=$1, payment_date=$2, updated_at=NOW() WHERE id=$3 RETURNING *",
      [payment_method, payment_date || new Date().toISOString().split('T')[0], req.params.id]
    );

    // Notify employee
    const payrollDetails = await query(
      `SELECT p.month, p.year, p.net_salary, e.user_id 
       FROM payrolls p 
       JOIN employees e ON p.employee_id = e.id 
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (payrollDetails.rows.length > 0) {
      const pDet = payrollDetails.rows[0];
      if (pDet.user_id) {
        await createNotification(
          pDet.user_id,
          'Salary Disbursed',
          `Your salary of ₹${parseFloat(pDet.net_salary).toLocaleString('en-IN')} for ${pDet.month}/${pDet.year} has been credited.`,
          'success',
          '/payroll'
        );
      }
    }

    res.json({ success: true, message: 'Payroll marked as paid.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/payroll/:id
const deletePayroll = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM payrolls WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payroll record not found.' });
    }
    res.json({ success: true, message: 'Payroll record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/payroll/:id
const updatePayroll = async (req, res, next) => {
  try {
    const { basic_salary, present_days, status } = req.body;
    
    const existing = await query('SELECT * FROM payrolls WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payroll record not found.' });
    }
    const p = existing.rows[0];

    const basicSalary = basic_salary !== undefined ? parseFloat(basic_salary) : parseFloat(p.basic_salary);
    const presDays = present_days !== undefined ? parseInt(present_days) : p.present_days;

    const hra = basicSalary * 0.40;
    const transportAllowance = 1600;
    const otherAllowances = basicSalary * 0.10;
    const grossSalary = basicSalary + hra + transportAllowance + otherAllowances;

    const pfDeduction = basicSalary * 0.12;
    const taxDeduction = grossSalary > 50000 ? grossSalary * 0.10 : 0;
    const totalDeductions = pfDeduction + taxDeduction;
    const netSalary = grossSalary - totalDeductions;

    const payrollStatus = status || p.status;
    const isPaid = payrollStatus === 'Paid';
    const payDate = isPaid ? (p.payment_date || new Date().toISOString().split('T')[0]) : null;
    const payMethod = isPaid ? (p.payment_method || 'Bank Transfer') : null;

    const result = await query(
      `UPDATE payrolls 
       SET basic_salary=$1, hra=$2, transport_allowance=$3, other_allowances=$4,
           pf_deduction=$5, tax_deduction=$6, gross_salary=$7, net_salary=$8,
           present_days=$9, status=$10, payment_date=$11, payment_method=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [basicSalary, hra, transportAllowance, otherAllowances, pfDeduction, taxDeduction,
       grossSalary, netSalary, presDays, payrollStatus, payDate, payMethod, req.params.id]
    );

    res.json({ success: true, message: 'Payroll updated successfully.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { processPayroll, getPayrolls, generateSalarySlip, sendSalarySlip, markAsPaid, updatePayroll, deletePayroll };
