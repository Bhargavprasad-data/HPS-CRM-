# HPS CRM — Harsha Perfect Solutions CRM
> Enterprise-grade CRM, HRMS, Payroll, Project Management & Billing System

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- PostgreSQL 14+
- npm v9+

### 1. Setup Database
```bash
psql -U postgres -c "CREATE DATABASE hps_crm;"
psql -U postgres -d hps_crm -f backend/schema.sql
```

### 2. Backend (Port 5000)
```bash
cd backend
cp .env.example .env     # Edit with your credentials
npm install
npm run dev
```

### 3. Frontend Panels (run each in separate terminals)
```bash
# Admin Panel - Port 3000
cd admin-panel && npm install && npm run dev

# Manager Panel - Port 3001
cd manager-panel && npm install && npm run dev

# Staff Panel - Port 3002  
cd staff-panel && npm install && npm run dev

# Accountant Panel - Port 3003
cd accountant-panel && npm install && npm run dev
```

## 🔑 Demo Credentials (Password: `Admin@123`)
| Role       | Email                  | Portal                         |
|------------|------------------------|--------------------------------|
| Admin      | admin@hps.com          | http://localhost:3000           |
| Manager    | manager@hps.com        | http://localhost:3001           |
| Staff      | staff@hps.com          | http://localhost:3002           |
| Accountant | accountant@hps.com     | http://localhost:3003           |

## 🏗 Architecture

```
HPS-CRM/
├── backend/              # Express.js API — Port 5000
│   ├── src/
│   │   ├── config/       # DB, JWT, Mail, Cloudinary
│   │   ├── controllers/  # Auth, Employee, Attendance, Payroll,
│   │   │                   Customer, Project, Ticket, Billing,
│   │   │                   Document, Report
│   │   ├── middleware/   # Auth, Role RBAC, Error handling
│   │   └── routes/       # All API routes
│   ├── uploads/          # Generated PDFs (salary slips, invoices, etc.)
│   └── schema.sql        # PostgreSQL schema (20 tables)
│
├── admin-panel/          # React + Vite + Tailwind — Port 3000
│   └── Features: Full access to all modules
│
├── manager-panel/        # React + Vite + Tailwind — Port 3001
│   └── Features: Team, Projects, Tickets, Customers
│
├── staff-panel/          # React + Vite + Tailwind — Port 3002
│   └── Features: Attendance, Leaves, Payslips, Personal
│
└── accountant-panel/     # React + Vite + Tailwind — Port 3003
    └── Features: Payroll, Quotations, Invoices, Reports
```

## 📋 Modules

### Admin Panel
- **Dashboard** — Real-time analytics, charts, revenue KPIs
- **Employees** — HRMS: create, edit, manage with photo upload
- **Attendance** — Daily log, leave approval/rejection
- **Payroll** — Process salary, generate PDF salary slips, email dispatch
- **Customers** — CRM: full contact and company management
- **Projects** — Track progress, assign teams, manage milestones
- **Tickets** — Support ticket lifecycle management
- **Quotations** — Create with line items, GST, generate PDF, email & convert to invoice
- **Invoices** — Track payments, mark paid, generate PDF
- **Offer Letters** — Generate and send candidate offer letters (PDF)
- **ID Cards** — Generate digital ID cards with QR codes
- **Reports** — Excel export for attendance, payroll, revenue

### Staff Panel
- **Check-in/Check-out** — One-click attendance with timestamp
- **Leave Application** — Apply for casual/sick/earned leaves
- **My Projects** — View assigned projects
- **My Tickets** — Raise and track support tickets
- **Payslips** — Download PDF salary slips

### Manager Panel
- **Team Dashboard** — Attendance overview and performance
- **Project Management** — Track all projects with progress bars
- **Ticket Resolution** — Manage and resolve team tickets
- **Reports** — Generate team reports

### Accountant Panel
- **Financial Dashboard** — Revenue vs expenses chart, KPIs
- **Payroll Processing** — Process and approve payrolls
- **Quotations & Invoices** — Full billing cycle management
- **Financial Reports** — Excel exports

## 🛠 Tech Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS 3 |
| State     | Redux Toolkit                  |
| Charts    | Recharts                       |
| Backend   | Node.js, Express.js            |
| Database  | PostgreSQL                     |
| Auth      | JWT + Refresh Tokens           |
| PDF       | PDFKit                         |
| Excel     | ExcelJS                        |
| QR Code   | qrcode                         |
| Email     | Nodemailer SMTP                |
| Storage   | Cloudinary                     |

## 🔗 API Endpoints

### Base URL: `http://localhost:5000/api`

| Module      | Endpoints                                    |
|-------------|----------------------------------------------|
| Auth        | POST /auth/login, /refresh, /logout, /me     |
| Employees   | CRUD /employees                              |
| Attendance  | /attendance/checkin, /checkout, /leaves      |
| Payroll     | /payroll, /payroll/process, /:id/generate-slip |
| Customers   | CRUD /customers                              |
| Projects    | CRUD /projects, /:id/assign                  |
| Tickets     | CRUD /tickets                                |
| Billing     | /billing/quotations, /billing/invoices        |
| Documents   | /documents/offer-letters, /id-cards          |
| Reports     | /reports/dashboard, /attendance, /payroll, /revenue |

## 📄 License
© 2024 Harsha Perfect Solutions. All rights reserved.
