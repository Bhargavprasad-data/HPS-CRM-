# HPS CRM

A comprehensive Customer Relationship Management (CRM) and Employee Management system built with React, Node.js, Express, and PostgreSQL.

## Features

This CRM provides three distinct portals tailored to different roles within the organization:

### 1. Admin Panel
The central hub for organizational oversight and management.
- **Dashboard & Analytics**: High-level overview of revenue, projects, and active employees.
- **Employee Management**: Manage employee profiles, roles, and ID cards.
- **Payroll**: Process salaries, track unpaid dues, and manage payslips.
- **Customer Directory**: Centralized customer management and tracking.
- **Invoices & Quotations**: Generate, track, and manage financial documents.
- **Projects & Tasks**: Monitor active projects, assignments, and overall progress.

### 2. Manager Panel
Designed for middle-management to oversee day-to-day operations and team productivity.
- **Project Tracking**: Manage assigned projects and track completion status.
- **Task Pipeline**: Kanban-style board for task assignment and progression.
- **Attendance**: Track and monitor team attendance and leaves.
- **Customer Interaction**: Manage customer details and relationships.
- **Reports**: Generate and view operational reports.

### 3. Staff Panel
A dedicated space for employees to manage their work and personal HR details.
- **My Projects**: View assigned projects, update progress, and mark tasks as complete.
- **Attendance**: Clock in/out and view daily attendance history.
- **Leave Management**: Apply for leaves and track approval status.
- **Payslips**: Access and download monthly salary slips.
- **Support Tickets**: Raise internal IT or HR support tickets.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JSON Web Tokens (JWT)
- **File Storage**: Cloudinary (for avatars and documents)

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Bhargavprasad-data/HPS-CRM-.git
   cd HPS-CRM-
   ```

2. Install dependencies for all panels and the backend:
   ```bash
   cd backend && npm install
   cd ../admin-panel && npm install
   cd ../manager-panel && npm install
   cd ../staff-panel && npm install
   ```

3. Set up the environment variables (`.env` files) in each directory. See `.env.example` files for reference.

4. Initialize the database:
   ```bash
   cd backend
   node src/config/initDb.js
   ```

5. Start the development servers:
   - Backend: `npm run dev`
   - Admin Panel: `npm run dev`
   - Manager Panel: `npm run dev`
   - Staff Panel: `npm run dev`

## License
Proprietary / All Rights Reserved
