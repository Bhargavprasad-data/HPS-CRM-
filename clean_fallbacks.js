const path = require('path');

const targetRoots = [
  'admin-panel/src/pages',
  'manager-panel/src/pages',
  'staff-panel/src/pages',
  'accountant-panel/src/pages'
];

const basePath = 'c:/Users/Bharg/OneDrive/Desktop/CRM';

const replacements = [
  {
    // EmployeesPage fallback demo data
    target: `setEmployees([
        { id: '1', employee_code: 'HPS-001', name: 'Admin User', email: 'admin@hps.com', phone: '+91-9000000001', department: 'Administration', designation: 'System Administrator', salary: 80000, joining_date: '2022-01-01', is_active: true },
        { id: '2', employee_code: 'HPS-002', name: 'Manager User', email: 'manager@hps.com', phone: '+91-9000000002', department: 'Operations', designation: 'Operations Manager', salary: 65000, joining_date: '2022-03-15', is_active: true },
        { id: '3', employee_code: 'HPS-003', name: 'Staff User', email: 'staff@hps.com', phone: '+91-9000000003', department: 'Development', designation: 'Software Engineer', salary: 45000, joining_date: '2023-01-10', is_active: true },
        { id: '4', employee_code: 'HPS-004', name: 'Accountant User', email: 'accountant@hps.com', phone: '+91-9000000004', department: 'Finance', designation: 'Senior Accountant', salary: 55000, joining_date: '2022-06-01', is_active: true },
      ]);`,
    replacement: `setEmployees([]);
      toast.error('Failed to load employee records.');`
  },
  {
    // Admin/Staff Attendance fallback mock data
    target: `setAttendance([
        { id: '1', employee_name: 'Admin User', employee_code: 'HPS-001', department: 'Administration', date: new Date().toISOString(), check_in: '09:05:00', check_out: '18:30:00', status: 'Present', working_hours: 9.4 },
        { id: '2', employee_name: 'Manager User', employee_code: 'HPS-002', department: 'Operations', date: new Date().toISOString(), check_in: '09:45:00', check_out: '18:00:00', status: 'Late', working_hours: 8.2 },
        { id: '3', employee_name: 'Staff User', employee_code: 'HPS-003', department: 'Development', date: new Date().toISOString(), check_in: null, check_out: null, status: 'Absent', working_hours: null },
      ]);
      setLeaves([
        { id: '1', employee_name: 'Staff User', employee_code: 'HPS-003', leave_type: 'Sick', start_date: '2024-05-20', end_date: '2024-05-21', total_days: 2, reason: 'Medical appointment', status: 'Pending' },
      ]);`,
    replacement: `setAttendance([]);
      setLeaves([]);
      toast.error('Failed to load attendance logs.');`
  },
  {
    // Payroll fallback mock data
    target: `setPayrolls([
        { id: '1', employee_name: 'Admin User', employee_code: 'HPS-001', department: 'Administration', designation: 'System Administrator', month: filters.month, year: filters.year, basic_salary: 61538, hra: 24615, transport_allowance: 1600, gross_salary: 98753, net_salary: 87245, pf_deduction: 7385, tax_deduction: 4123, status: 'Unpaid', present_days: 24, working_days: 26 },
        { id: '2', employee_name: 'Manager User', employee_code: 'HPS-002', department: 'Operations', designation: 'Operations Manager', month: filters.month, year: filters.year, basic_salary: 50000, hra: 20000, transport_allowance: 1600, gross_salary: 79600, net_salary: 70228, pf_deduction: 6000, tax_deduction: 3372, status: 'Paid', present_days: 26, working_days: 26 },
      ]);`,
    replacement: `setPayrolls([]);
      toast.error('Failed to load payroll entries.');`
  },
  {
    // Customers fallback mock data
    target: `setCustomers([
        { id: '1', customer_code: 'CUST-001', name: 'TechVentures Pvt Ltd', email: 'contact@techventures.com', phone: '+91-8000000001', company: 'TechVentures Pvt Ltd', city: 'Hyderabad', state: 'Telangana', gst_number: '36AADCT1234A1Z5', status: 'Active', project_count: 2, invoice_count: 5 },
        { id: '2', customer_code: 'CUST-002', name: 'Global Innovations', email: 'info@globalinnov.com', phone: '+91-8000000002', company: 'Global Innovations LLC', city: 'Bangalore', state: 'Karnataka', status: 'Active', project_count: 1, invoice_count: 3 },
      ]);`,
    replacement: `setCustomers([]);
      toast.error('Failed to load customer directory.');`
  },
  {
    // Projects fallback mock data
    target: `setProjects([
        { id: '1', project_code: 'PROJ-001', name: 'CRM Development', customer_name: 'TechVentures Pvt Ltd', manager_name: 'Manager User', start_date: '2024-01-15', end_date: '2024-06-30', status: 'In Progress', priority: 'High', progress: 65, budget: 500000, team_size: 3 },
        { id: '2', project_code: 'PROJ-002', name: 'E-commerce Portal', customer_name: 'Global Innovations', manager_name: 'Manager User', start_date: '2024-02-01', end_date: '2024-08-31', status: 'In Progress', priority: 'High', progress: 30, budget: 750000, team_size: 5 },
      ]);
      setStats({ total: 12, in_progress: 7, completed: 3, not_started: 1, overdue: 2 });`,
    replacement: `setProjects([]);
      setStats({ total: 0, in_progress: 0, completed: 0, not_started: 0, overdue: 0 });
      toast.error('Failed to load project timelines.');`
  },
  {
    // Tickets fallback mock data
    target: `setTickets([
        { id: '1', ticket_number: 'TKT-00001', title: 'Server downtime on production', description: 'Production server went down at 2pm', raised_by_name: 'Staff User', assigned_to_name: 'Manager User', status: 'Open', priority: 'Critical', category: 'Infrastructure', created_at: new Date() },
        { id: '2', ticket_number: 'TKT-00002', title: 'Email service not working', description: 'Cannot send emails from the system', raised_by_name: 'Manager User', assigned_to_name: null, status: 'In Progress', priority: 'High', category: 'Email', created_at: new Date() },
        { id: '3', ticket_number: 'TKT-00003', title: 'Salary slip download issue', description: 'PDF not generating correctly', raised_by_name: 'Staff User', assigned_to_name: 'Admin User', status: 'Resolved', priority: 'Medium', category: 'Payroll', created_at: new Date() },
      ]);
      setStats({ total: 31, open: 8, in_progress: 5, resolved: 15, closed: 3, critical: 2, high: 6 });`,
    replacement: `setTickets([]);
      setStats({ total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0, critical: 0, high: 0 });
      toast.error('Failed to load tickets.');`
  },
  {
    // Invoices Page fallback mock data
    target: `setInvoices([
        { id: '1', invoice_number: 'INV-00001', customer_name: 'TechVentures Pvt Ltd', date: '2024-05-01', due_date: '2024-05-31', subtotal: 250000, tax_percent: 18, total: 295000, paid_amount: 295000, balance_due: 0, status: 'Paid' },
        { id: '2', invoice_number: 'INV-00002', customer_name: 'Global Innovations', date: '2024-05-10', due_date: '2024-06-10', subtotal: 180000, tax_percent: 18, total: 212400, paid_amount: 0, balance_due: 212400, status: 'Unpaid' },
        { id: '3', invoice_number: 'INV-00003', customer_name: 'Sunrise Retail', date: '2024-04-15', due_date: '2024-05-15', subtotal: 120000, tax_percent: 18, total: 141600, paid_amount: 0, balance_due: 141600, status: 'Overdue' },
      ]);`,
    replacement: `setInvoices([]);
      toast.error('Failed to load invoice records.');`
  },
  {
    // Quotations fallback mock data
    target: `setQuotations([
        { id: '1', quotation_number: 'QTN-00001', customer_name: 'TechVentures Pvt Ltd', date: '2024-05-01', expiry_date: '2024-05-15', total: 295000, status: 'Sent' },
        { id: '2', quotation_number: 'QTN-00002', customer_name: 'Global Innovations', date: '2024-05-10', expiry_date: '2024-05-24', total: 212400, status: 'Accepted' },
      ]);`,
    replacement: `setQuotations([]);
      toast.error('Failed to load quotation records.');`
  },
  {
    // Offer letters fallback mock data
    target: `setLetters([{ id: '1', offer_number: 'OFFER-0001', candidate_name: 'Rahul Sharma', candidate_email: 'rahul@example.com', designation: 'Software Engineer', department: 'Development', salary: 45000, joining_date: '2024-06-01', status: 'Generated' }]);`,
    replacement: `setLetters([]);
      toast.error('Failed to load offer letters.');`
  },
  {
    // ID Cards fallback mock data
    target: `setEmployees([
        { id: '1', employee_code: 'HPS-001', name: 'Admin User', department: 'Administration', designation: 'System Administrator', is_active: true },
        { id: '2', employee_code: 'HPS-002', name: 'Manager User', department: 'Operations', designation: 'Operations Manager', is_active: true },
        { id: '3', employee_code: 'HPS-003', name: 'Staff User', department: 'Development', designation: 'Software Engineer', is_active: true },
      ]);`,
    replacement: `setEmployees([]);
      toast.error('Failed to load ID card directory.');`
  }
];

// Reusable recursive directory scanner
function scanDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDir(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

// Clean pages inside target roots
targetRoots.forEach(root => {
  const rootPath = path.join(basePath, root);
  if (!fs.existsSync(rootPath)) return;

  const files = scanDir(rootPath);
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Direct String Replacements for Standard catch block fallbacks
    replacements.forEach(rep => {
      // Normalize whitespace for comparison
      const normTarget = rep.target.replace(/\s+/g, ' ');
      const normContent = content.replace(/\s+/g, ' ');

      if (content.includes(rep.target)) {
        content = content.replace(rep.target, rep.replacement);
        modified = true;
        console.log(`[REPLACED STANDARD MATCH] in ${file.replace(basePath, '')}`);
      }
    });

    // Clean exact matches for newly created manager/staff components that might use minor formatting variations
    // Projects Page in manager
    const managerProjTarget = `setProjects([
        { id: '1', project_code: 'PROJ-001', name: 'CRM Development', customer_name: 'TechVentures Pvt Ltd', manager_name: 'Manager User', start_date: '2024-01-15', end_date: '2024-06-30', status: 'In Progress', priority: 'High', progress: 65, budget: 500000, team_size: 3 },
        { id: '2', project_code: 'PROJ-002', name: 'E-commerce Portal', customer_name: 'Global Innovations', manager_name: 'Manager User', start_date: '2024-02-01', end_date: '2024-08-31', status: 'In Progress', priority: 'High', progress: 30, budget: 750000, team_size: 5 },
      ]);
      setStats({ total: 12, in_progress: 7, completed: 3, not_started: 1, overdue: 2 });`;

    if (content.includes(managerProjTarget)) {
      content = content.replace(managerProjTarget, `setProjects([]);
      setStats({ total: 0, in_progress: 0, completed: 0, not_started: 0, overdue: 0 });
      toast.error('Failed to load project timelines.');`);
      modified = true;
    }

    // Projects Page in staff (uses slightly different layout: manager_name: 'Manager User', start_date: '2026-01-15' etc)
    const staffProjTarget = `setProjects([
        { id: '1', project_code: 'PROJ-001', name: 'CRM Development', customer_name: 'TechVentures Pvt Ltd', manager_name: 'Manager User', start_date: '2026-01-15', end_date: '2026-06-30', status: 'In Progress', priority: 'High', progress: 65, team_size: 3 },
        { id: '2', project_code: 'PROJ-002', name: 'E-commerce Portal', customer_name: 'Global Innovations', manager_name: 'Manager User', start_date: '2026-02-01', end_date: '2026-08-31', status: 'In Progress', priority: 'High', progress: 30, team_size: 5 },
      ]);`;
    if (content.includes(staffProjTarget)) {
      content = content.replace(staffProjTarget, `setProjects([]);
      toast.error('Failed to load assigned projects.');`);
      modified = true;
    }

    // Attendance in Staff
    const staffAttTarget = `setAttendance([
        { id: '1', date: new Date().toISOString(), check_in: '09:05:00', check_out: '18:30:00', status: 'Present', working_hours: 9.4 },
        { id: '2', date: new Date(Date.now() - 86400000).toISOString(), check_in: '09:45:00', check_out: '18:00:00', status: 'Late', working_hours: 8.25 },
        { id: '3', date: new Date(Date.now() - 172800000).toISOString(), check_in: null, check_out: null, status: 'Absent', working_hours: null },
      ]);`;
    if (content.includes(staffAttTarget)) {
      content = content.replace(staffAttTarget, `setAttendance([]);
      toast.error('Failed to load attendance logs.');`);
      modified = true;
    }

    // Leaves in Staff
    const staffLeaveTarget = `setLeaves([
        { id: '1', leave_type: 'Sick', start_date: '2026-05-20', end_date: '2026-05-21', total_days: 2, reason: 'Medical appointment', status: 'Pending' },
        { id: '2', leave_type: 'Casual', start_date: '2026-04-10', end_date: '2026-04-11', total_days: 2, reason: 'Family trip', status: 'Approved' },
      ]);`;
    if (content.includes(staffLeaveTarget)) {
      content = content.replace(staffLeaveTarget, `setLeaves([]);
      toast.error('Failed to load leave history.');`);
      modified = true;
    }

    // Tickets in Staff
    const staffTicketTarget = `setTickets([
        { id: '1', ticket_number: 'TKT-00001', title: 'Server downtime on production', description: 'Production server went down at 2pm', status: 'Open', priority: 'Critical', category: 'Infrastructure', created_at: new Date() },
        { id: '2', ticket_number: 'TKT-00003', title: 'Salary slip download issue', description: 'PDF not generating correctly', status: 'Resolved', priority: 'Medium', category: 'Payroll', created_at: new Date() },
      ]);`;
    if (content.includes(staffTicketTarget)) {
      content = content.replace(staffTicketTarget, `setTickets([]);
      toast.error('Failed to load support tickets.');`);
      modified = true;
    }

    // Payslips in Staff
    const staffPayslipTarget = `setPayrolls([
        { id: '1', month: 5, year: 2026, basic_salary: 45000, hra: 18000, transport_allowance: 1600, gross_salary: 64600, net_salary: 58200, pf_deduction: 5400, tax_deduction: 1000, status: 'Paid', payment_date: '2026-05-31' },
        { id: '2', month: 4, year: 2026, basic_salary: 45000, hra: 18000, transport_allowance: 1600, gross_salary: 64600, net_salary: 58200, pf_deduction: 5400, tax_deduction: 1000, status: 'Paid', payment_date: '2026-04-30' },
      ]);`;
    if (content.includes(staffPayslipTarget)) {
      content = content.replace(staffPayslipTarget, `setPayrolls([]);
      toast.error('Failed to load monthly payslips.');`);
      modified = true;
    }

    // Dashboard staff-panel
    const staffDashTarget = `setAttendance([
          { id: '1', date: new Date().toISOString(), check_in: '09:05', check_out: '18:30', status: 'Present', working_hours: 9.4 },
          { id: '2', date: new Date(Date.now() - 86400000).toISOString(), check_in: '09:00', check_out: '18:00', status: 'Present', working_hours: 9 },
        ]);`;
    if (content.includes(staffDashTarget)) {
      content = content.replace(staffDashTarget, `setAttendance([]);`);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ [CLEANED] ${file.replace(basePath, '')}`);
    }
  });
});

console.log('🎉 Cleanup of fallback demo lists completed successfully.');
