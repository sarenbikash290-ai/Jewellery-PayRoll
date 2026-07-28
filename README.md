# Jewellery-PayRoll (HRPulse)

A comprehensive Payroll & HR Management application built specifically for **Shri Sai Jewellers** — tailored for jewellery retail operations, sales teams, and goldsmith workshop management.

---

## 🚀 Features

- 👥 **Employee Management**: Staff profiles, Goldsmiths, Sales Team tracking, salary structure, and status management.
- 🕐 **Attendance & Time Tracking**: Daily check-ins, late mark calculations, biometric audit log ingestion, LOP tracking, and lunch break alerts.
- 💰 **Payroll Processing & Locks**: Automated salary calculations (Basic / HRA / Allowances / PF / ESI / TDS / LOP deductions) with monthly locking mechanism.
- 🎁 **Incentives & Sales Commissions**: Monthly sales targets, individual sales records, lead commissions, and bonus approvals.
- 📄 **Document Generation**: Automated PDF generation for Monthly Payslips, Salary Certificates, Form 16 Tax Summaries, and Custom HR Reports.
- 🔐 **Dual Auth Portals**: Separate secure access portals for Admin (Passcode protected) and Employees (PIN + Email OTP verification).
- 📊 **Reports & Analytics**: Visual dashboards with headcount by department, payroll cost trends, and weekly/monthly attendance averages.

---

## 🛠️ Tech Stack

### 🧠 Core Framework & Runtime
- **[Next.js 16](https://nextjs.org)** — Full-stack React framework (App Router, Server API Routes)
- **[React 19](https://react.dev)** — Modern UI component framework
- **[TypeScript](https://www.typescriptlang.org)** — Type safety across front-end components and server APIs

### 🗄️ Database & Storage
- **[Supabase](https://supabase.com)** (PostgreSQL) — Cloud relational database storing:
  - `employees` — Staff master profiles & employment details
  - `attendance_records` — Daily check-in/out logs & status
  - `payroll_locks` — Monthly finalized payroll snapshot locks
  - `employee_sales` & `commissions` — Sales transactions & commission payouts
  - `advance_payments` — Employee salary advances & payback logs
  - `employee_pins` — Encrypted 4-digit PIN authentication records
  - `attendance_audit_logs` — Raw biometric device logs
- **`@supabase/supabase-js`** — Official database SDK client

### 🔑 Authentication & Security
- **Employee Portal Auth**: 
  - **PIN + Email OTP (2-Factor)**: 4-digit PIN check followed by a 6-digit One-Time Password sent to the employee's registered email
  - **Gmail SMTP Integration (`nodemailer`)**: Delivers branded OTP access emails securely
- **Admin Portal Auth**: Passcode-based authentication with secure HTTP-only cookies
- **Session Management**: Secure HTTP-only cookies (`hrpulse_admin_session`, `hrpulse_emp_session`) handled via Next.js `cookies()` header API

### 📊 Data Visualization & UI
- **[Recharts](https://recharts.org)** — Interactive Area, Bar, and Line charts for Payroll Cost Trends, Department Headcounts, and Attendance Analytics
- **[Lucide React](https://lucide.dev)** — Modern UI iconography
- **[React Datepicker](https://react-datepicker.com)** — Date range selection for leave applications and attendance filters
- **Vanilla CSS Design System** — Custom CSS design tokens with glassmorphism, responsive drawer menus, and dark/light UI support

### 📄 Document & PDF Generation
- **[jsPDF](https://github.com/parallax/jsPDF)** — Client-side PDF generation engine for instant download of:
  - Official Salary Payslips with shop letterhead branding
  - Salary Certificates
  - Form 16 Tax Summaries
  - Custom Payroll & HR Reports

### ☁️ Hosting & Analytics
- **[Vercel](https://vercel.com)** — Production deployment and edge hosting
- **`@vercel/analytics`** — Production performance & usage monitoring

---

## 🚦 Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- Supabase project credentials (URL and Service Role Key)

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: Gmail SMTP for Email OTP delivery
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch the application.

---

## 📜 License

Private repository built for **Shri Sai Jewellers**. All rights reserved.
