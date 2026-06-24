-- ============================================================
-- HPS CRM - PostgreSQL Database Schema
-- Harsha Perfect Solutions CRM
-- ============================================================

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS id_cards CASCADE;
DROP TABLE IF EXISTS offer_letters CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS payrolls CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    refresh_token TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. EMPLOYEES
-- ============================================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    designation VARCHAR(100),
    salary DECIMAL(12, 2) DEFAULT 0,
    joining_date DATE,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    photo_url TEXT,
    address TEXT,
    emergency_contact VARCHAR(20),
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(20),
    pan_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(20) DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Half Day', 'Holiday')),
    working_hours DECIMAL(5,2),
    ip_address VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- ============================================================
-- 5. LEAVES
-- ============================================================
CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) CHECK (leave_type IN ('Sick', 'Casual', 'Annual', 'Maternity', 'Paternity', 'Unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. PAYROLLS
-- ============================================================
CREATE TABLE payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    basic_salary DECIMAL(12,2) DEFAULT 0,
    hra DECIMAL(12,2) DEFAULT 0,
    transport_allowance DECIMAL(12,2) DEFAULT 0,
    other_allowances DECIMAL(12,2) DEFAULT 0,
    pf_deduction DECIMAL(12,2) DEFAULT 0,
    tax_deduction DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    gross_salary DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2) DEFAULT 0,
    working_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    leaves_taken INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid', 'Processing')),
    payment_date DATE,
    payment_method VARCHAR(50),
    pdf_url TEXT,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

-- ============================================================
-- 7. CUSTOMERS
-- ============================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    gst_number VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Prospect')),
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. PROJECTS
-- ============================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    status VARCHAR(30) DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Testing', 'Completed', 'On Hold', 'Cancelled')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 9. PROJECT ASSIGNMENTS
-- ============================================================
CREATE TABLE project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role_in_project VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, employee_id)
);

-- ============================================================
-- 10. TICKETS
-- ============================================================
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    raised_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    category VARCHAR(100),
    resolution TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 11. QUOTATIONS
-- ============================================================
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    subject TEXT,
    notes TEXT,
    terms TEXT,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 18,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Declined', 'Expired')),
    pdf_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 12. QUOTATION ITEMS
-- ============================================================
CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- 13. INVOICES
-- ============================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subject TEXT,
    notes TEXT,
    terms TEXT,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 18,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled')),
    payment_method VARCHAR(50),
    payment_date DATE,
    pdf_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 14. INVOICE ITEMS
-- ============================================================
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- 15. OFFER LETTERS
-- ============================================================
CREATE TABLE offer_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_number VARCHAR(50) UNIQUE,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255),
    candidate_phone VARCHAR(20),
    designation VARCHAR(100),
    department VARCHAR(100),
    salary DECIMAL(12,2),
    joining_date DATE,
    valid_until DATE,
    status VARCHAR(30) DEFAULT 'Generated' CHECK (status IN ('Generated', 'Sent', 'Accepted', 'Declined', 'Expired')),
    pdf_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 16. ID CARDS
-- ============================================================
CREATE TABLE id_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    qr_code_data TEXT,
    qr_code_url TEXT,
    pdf_url TEXT,
    generated_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 17. EMAIL LOGS
-- ============================================================
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    template_name VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    status VARCHAR(20) DEFAULT 'Sent' CHECK (status IN ('Sent', 'Failed', 'Pending')),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 18. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 19. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 20. REPORTS
-- ============================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(30) CHECK (type IN ('Daily', 'Monthly', 'Yearly', 'Custom')),
    category VARCHAR(100),
    start_date DATE,
    end_date DATE,
    file_url TEXT,
    file_type VARCHAR(10) CHECK (file_type IN ('PDF', 'Excel')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX idx_payrolls_employee_id ON payrolls(employee_id);
CREATE INDEX idx_payrolls_month_year ON payrolls(month, year);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_raised_by ON tickets(raised_by);
CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- SEED DATA - Roles
-- ============================================================
INSERT INTO roles (name, description) VALUES
    ('Admin', 'Full system access - manages everything'),
    ('Manager', 'Team and project management access'),
    ('Staff', 'Employee self-service portal access'),
    ('Accountant', 'Financial and billing module access');

-- ============================================================
-- SEED DATA - Demo Users (password: Admin@123)
-- bcrypt hash of "Admin@123" with 10 rounds
-- ============================================================
INSERT INTO users (id, email, password_hash, role_id, is_active) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'bhargavvana80@gmail.com', '$2a$10$1PBYllROSztcev1Xcr8kkuY9PwARa4CeP5Ci7L2oqlbHJGR7nFRLy', 1, TRUE),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'manager@hps.com', '$2a$10$oPlbCI/RvvySA1Q7imqowuQ0KRF15ETcJLwQoxozylA8MTRe9MEQ6', 2, TRUE),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'staff@hps.com', '$2a$10$oPlbCI/RvvySA1Q7imqowuQ0KRF15ETcJLwQoxozylA8MTRe9MEQ6', 3, TRUE),
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 'accountant@hps.com', '$2a$10$oPlbCI/RvvySA1Q7imqowuQ0KRF15ETcJLwQoxozylA8MTRe9MEQ6', 4, TRUE);

-- ============================================================
-- SEED DATA - Demo Employees
-- ============================================================
INSERT INTO employees (id, user_id, employee_code, name, email, phone, department, designation, salary, joining_date) VALUES
    ('e1f2a3b4-c5d6-7890-efab-cd1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'HPS-001', 'Admin User', 'bhargavvana80@gmail.com', '+91-9000000001', 'Administration', 'System Administrator', 80000, '2022-01-01'),
    ('f2a3b4c5-d6e7-8901-fabc-de2345678901', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'HPS-002', 'Manager User', 'manager@hps.com', '+91-9000000002', 'Operations', 'Operations Manager', 65000, '2022-03-15'),
    ('a3b4c5d6-e7f8-9012-abcd-ef3456789012', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'HPS-003', 'Staff User', 'staff@hps.com', '+91-9000000003', 'Development', 'Software Engineer', 45000, '2023-01-10'),
    ('b4c5d6e7-f8a9-0123-bcde-f45678901234', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'HPS-004', 'Accountant User', 'accountant@hps.com', '+91-9000000004', 'Finance', 'Senior Accountant', 55000, '2022-06-01');

-- Update manager reference for staff
UPDATE employees SET manager_id = 'f2a3b4c5-d6e7-8901-fabc-de2345678901' WHERE employee_code = 'HPS-003';

-- ============================================================
-- SEED DATA - Sample Customers
-- ============================================================
INSERT INTO customers (customer_code, name, email, phone, company, city, state, gst_number, status) VALUES
    ('CUST-001', 'TechVentures Pvt Ltd', 'contact@techventures.com', '+91-8000000001', 'TechVentures Pvt Ltd', 'Hyderabad', 'Telangana', '36AADCT1234A1Z5', 'Active'),
    ('CUST-002', 'Global Innovations', 'info@globalinnov.com', '+91-8000000002', 'Global Innovations LLC', 'Bangalore', 'Karnataka', '29AABCG5678B2Z8', 'Active'),
    ('CUST-003', 'Sunrise Retail', 'accounts@sunriseretail.in', '+91-8000000003', 'Sunrise Retail Ltd', 'Mumbai', 'Maharashtra', '27AAECS9012C3Z1', 'Prospect');

-- ============================================================
-- SEED DATA - Sample Projects
-- ============================================================
INSERT INTO projects (project_code, name, description, customer_id, start_date, end_date, budget, status, priority, manager_id, progress, created_by)
SELECT 
    'PROJ-001', 'CRM Development', 'Custom CRM solution for TechVentures', c.id, '2024-01-15', '2024-06-30', 500000, 'In Progress', 'High', e.id, 65, u.id
FROM customers c, employees e, users u 
WHERE c.customer_code = 'CUST-001' AND e.employee_code = 'HPS-002' AND u.email = 'admin@hps.com';

INSERT INTO projects (project_code, name, description, customer_id, start_date, end_date, budget, status, priority, manager_id, progress, created_by)
SELECT 
    'PROJ-002', 'E-commerce Portal', 'Full e-commerce platform development', c.id, '2024-02-01', '2024-08-31', 750000, 'In Progress', 'High', e.id, 30, u.id
FROM customers c, employees e, users u 
WHERE c.customer_code = 'CUST-002' AND e.employee_code = 'HPS-002' AND u.email = 'admin@hps.com';

COMMIT;
