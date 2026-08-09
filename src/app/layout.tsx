import type { Metadata } from "next";
import "./globals.css";
import PWARegistration from "@/components/PWARegistration";
import { Analytics } from "@vercel/analytics/next";

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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FCF9F4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HRPulse" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <PWARegistration />
        <Analytics />
      </body>
    </html>
  );
}
