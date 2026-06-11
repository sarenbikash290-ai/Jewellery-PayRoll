import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HRPulse — HR & Payroll Management Platform",
  description: "Enterprise-grade HR & Payroll SaaS. Manage workforce, attendance, payroll, incentives, and analytics from one powerful dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
