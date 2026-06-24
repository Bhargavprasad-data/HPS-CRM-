const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

// GET /api/reports/dashboard - Main dashboard stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [employees, customers, projects, tickets, revenue, payroll, attendance] = await Promise.all([
      query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM employees"),
      query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Active') as active FROM customers"),
      query(`SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
               COUNT(*) FILTER (WHERE status = 'Completed') as completed,
               COUNT(*) FILTER (WHERE end_date < CURRENT_DATE AND status != 'Completed') as overdue FROM projects`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Open') as open,
               COUNT(*) FILTER (WHERE priority = 'Critical') as critical FROM tickets`),
      query(`SELECT COALESCE(SUM(total), 0) as total_revenue,
               COALESCE(SUM(total) FILTER (WHERE status = 'Paid'), 0) as paid,
               COALESCE(SUM(total) FILTER (WHERE status = 'Unpaid'), 0) as pending
             FROM invoices WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)`),
      query(`SELECT COALESCE(SUM(net_salary), 0) as total_payroll FROM payrolls
             WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)`),
      query(`SELECT COUNT(*) as today_present, COUNT(*) FILTER (WHERE status = 'Late') as today_late
             FROM attendance WHERE date = CURRENT_DATE`),
    ]);

    // Monthly revenue chart (last 6 months)
    const monthlyRevenue = await query(`
      SELECT TO_CHAR(date, 'Mon YYYY') as month, COALESCE(SUM(total), 0) as revenue
      FROM invoices WHERE date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(date, 'Mon YYYY'), EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
    `);

    // Recent activity
    const recentActivity = await query(`
      SELECT 'ticket' as type, ticket_number as reference, title as description, status, created_at FROM tickets
      UNION ALL
      SELECT 'project' as type, project_code, name, status, created_at FROM projects
      UNION ALL
      SELECT 'invoice' as type, invoice_number, invoice_number as description, status, created_at FROM invoices
      ORDER BY created_at DESC LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        employees: employees.rows[0],
        customers: customers.rows[0],
        projects: projects.rows[0],
        tickets: tickets.rows[0],
        revenue: revenue.rows[0],
        payroll: payroll.rows[0],
        attendance: attendance.rows[0],
        monthlyRevenue: monthlyRevenue.rows,
        recentActivity: recentActivity.rows,
      },
    });
  } catch (error) { next(error); }
};

// GET /api/reports/attendance?start_date=&end_date=&format=excel|pdf
const getAttendanceReport = async (req, res, next) => {
  try {
    const { start_date, end_date, format = 'excel' } = req.query;
    if (!start_date || !end_date) return res.status(400).json({ success: false, message: 'start_date and end_date are required.' });

    const result = await query(
      `SELECT a.date, a.check_in, a.check_out, a.status, a.working_hours,
              e.name as employee_name, e.employee_code, e.department, e.designation
       FROM attendance a JOIN employees e ON a.employee_id = e.id
       WHERE a.date BETWEEN $1 AND $2 ORDER BY a.date, e.name`,
      [start_date, end_date]
    );

    const uploadsDir = path.join(__dirname, '../../uploads/reports');
    ensureDir(uploadsDir);

    if (format === 'excel') {
      const filename = `attendance_report_${start_date}_${end_date}.xlsx`;
      const filepath = path.join(uploadsDir, filename);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'HPS CRM';
      const sheet = workbook.addWorksheet('Attendance Report');

      sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Employee Code', key: 'employee_code', width: 18 },
        { header: 'Employee Name', key: 'employee_name', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Check In', key: 'check_in', width: 12 },
        { header: 'Check Out', key: 'check_out', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Working Hours', key: 'working_hours', width: 15 },
      ];

      // Style header row
      sheet.getRow(1).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      });

      result.rows.forEach((row) => {
        const dataRow = sheet.addRow({
          date: new Date(row.date).toLocaleDateString('en-IN'),
          employee_code: row.employee_code,
          employee_name: row.employee_name,
          department: row.department,
          check_in: row.check_in || '-',
          check_out: row.check_out || '-',
          status: row.status,
          working_hours: row.working_hours ? `${row.working_hours}h` : '-',
        });

        // Color coding for status
        const statusCell = dataRow.getCell('status');
        if (row.status === 'Present') statusCell.font = { color: { argb: 'FF22c55e' } };
        else if (row.status === 'Late') statusCell.font = { color: { argb: 'FFf59e0b' } };
        else if (row.status === 'Absent') statusCell.font = { color: { argb: 'FFef4444' } };
      });

      await workbook.xlsx.writeFile(filepath);
      res.json({ success: true, data: { fileUrl: `/uploads/reports/${filename}`, rows: result.rows.length } });
    } else {
      res.json({ success: true, data: result.rows });
    }
  } catch (error) { next(error); }
};

// GET /api/reports/payroll?month=&year=&format=
const getPayrollReport = async (req, res, next) => {
  try {
    const { month, year, format = 'excel' } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year are required.' });

    const result = await query(
      `SELECT p.month, p.year, p.basic_salary, p.hra, p.transport_allowance, p.other_allowances,
              p.pf_deduction, p.tax_deduction, p.gross_salary, p.net_salary, p.status,
              p.working_days, p.present_days, p.leaves_taken,
              e.name as employee_name, e.employee_code, e.department, e.designation
       FROM payrolls p JOIN employees e ON p.employee_id = e.id
       WHERE p.month = $1 AND p.year = $2 ORDER BY e.name`,
      [month, year]
    );

    if (format === 'excel') {
      const uploadsDir = path.join(__dirname, '../../uploads/reports');
      ensureDir(uploadsDir);
      const filename = `payroll_report_${month}_${year}.xlsx`;
      const filepath = path.join(uploadsDir, filename);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`Payroll ${month}/${year}`);

      sheet.columns = [
        { header: 'Emp Code', key: 'employee_code', width: 14 },
        { header: 'Name', key: 'employee_name', width: 22 },
        { header: 'Department', key: 'department', width: 18 },
        { header: 'Basic', key: 'basic_salary', width: 14 },
        { header: 'HRA', key: 'hra', width: 12 },
        { header: 'Transport', key: 'transport_allowance', width: 12 },
        { header: 'Other Allow.', key: 'other_allowances', width: 12 },
        { header: 'Gross', key: 'gross_salary', width: 14 },
        { header: 'PF', key: 'pf_deduction', width: 12 },
        { header: 'Tax', key: 'tax_deduction', width: 12 },
        { header: 'Net Salary', key: 'net_salary', width: 14 },
        { header: 'Status', key: 'status', width: 10 },
      ];

      sheet.getRow(1).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      });

      let totalNet = 0;
      result.rows.forEach((row) => {
        sheet.addRow({ ...row });
        totalNet += parseFloat(row.net_salary);
      });

      const totalRow = sheet.addRow({ employee_name: 'TOTAL', net_salary: totalNet });
      totalRow.font = { bold: true };
      totalRow.getCell('net_salary').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } };

      await workbook.xlsx.writeFile(filepath);
      res.json({ success: true, data: { fileUrl: `/uploads/reports/${filename}`, rows: result.rows.length, totalNet } });
    } else {
      res.json({ success: true, data: result.rows });
    }
  } catch (error) { next(error); }
};

// GET /api/reports/revenue?start_date=&end_date=
const getRevenueReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const where = start_date && end_date ? 'WHERE i.date BETWEEN $1 AND $2' : '';
    const params = start_date && end_date ? [start_date, end_date] : [];

    const result = await query(
      `SELECT i.invoice_number, i.date, i.total, i.paid_amount, i.balance_due, i.status,
              c.name as customer_name, c.company
       FROM invoices i JOIN customers c ON i.customer_id = c.id
       ${where} ORDER BY i.date DESC`,
      params
    );

    const stats = await query(
      `SELECT COALESCE(SUM(total), 0) as total_billed,
              COALESCE(SUM(paid_amount), 0) as total_collected,
              COALESCE(SUM(balance_due), 0) as total_pending
       FROM invoices i ${where}`,
      params
    );

    res.json({ success: true, data: result.rows, stats: stats.rows[0] });
  } catch (error) { next(error); }
};

// GET /api/reports/notifications
const getNotifications = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.userId]
    );
    const unreadCount = result.rows.filter(n => !n.is_read).length;
    res.json({ success: true, data: result.rows, unreadCount });
  } catch (error) { next(error); }
};

// PUT /api/reports/notifications/:id/read
const markNotificationRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) { next(error); }
};

// PUT /api/reports/notifications/read-all
const markAllNotificationsRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.userId]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) { next(error); }
};

// GET /api/reports/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT al.*, u.email as user_email FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

module.exports = { getDashboardStats, getAttendanceReport, getPayrollReport, getRevenueReport, getNotifications, markNotificationRead, markAllNotificationsRead, getAuditLogs };
