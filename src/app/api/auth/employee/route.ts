import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

// In-memory OTP store for employee login validations
// { token UUID -> { employeeId, otp, expiresAt } }
const employeeOtpStore = new Map<string, { employeeId: string; otp: string; expiresAt: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const cookieStore = await cookies();

    if (action === 'logout') {
      cookieStore.delete('hrpulse_emp_session');
      return NextResponse.json({ ok: true });
    }

    // 1. SEND OTP ACTION (With Gmail SMTP integration)
    if (action === 'sendOtp') {
      const { phone, pin } = body;
      if (!phone || !pin) {
        return NextResponse.json({ ok: false, error: 'Phone number and PIN are required' }, { status: 400 });
      }

      // Format input phone to only digits for match check
      const cleanInputPhone = phone.replace(/[^\d]/g, '');
      if (cleanInputPhone.length < 10) {
        return NextResponse.json({ ok: false, error: 'Please enter a valid phone number with at least 10 digits' }, { status: 400 });
      }

      // Fetch all employees to loosely match phone formats
      const { data: employees, error: empErr } = await supabase
        .from('employees')
        .select('id, name, phone, email');

      if (empErr) {
        console.error('Error fetching employees:', empErr);
        return NextResponse.json({ ok: false, error: 'Database query error' }, { status: 500 });
      }

      const matchedEmp = (employees || []).find(e => {
        if (!e.phone) return false;
        const cleanDbPhone = e.phone.replace(/[^\d]/g, '');
        return cleanDbPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(cleanDbPhone);
      });

      if (!matchedEmp) {
        return NextResponse.json({ ok: false, error: 'Phone number is not registered. Please contact your manager.' }, { status: 404 });
      }

      // Check PIN
      const { data: pinData, error: pinErr } = await supabase
        .from('employee_pins')
        .select('pin')
        .eq('employee_id', matchedEmp.id)
        .maybeSingle();

      if (pinErr) {
        console.error('Error checking employee PIN:', pinErr);
        return NextResponse.json({ ok: false, error: 'Database PIN check error' }, { status: 500 });
      }

      const storedPin = pinData?.pin || '1234';

      if (pin !== storedPin) {
        return NextResponse.json({ ok: false, error: 'Incorrect PIN. Please try again.' }, { status: 401 });
      }

      // Generate OTP Code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const token = crypto.randomUUID();

      // Store in memory (expires in 10 minutes)
      employeeOtpStore.set(token, {
        employeeId: matchedEmp.id,
        otp: otpCode,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      // Attempt SMTP send
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_APP_PASSWORD;
      let emailSent = false;
      let smtpError = '';

      if (gmailUser && gmailPass && matchedEmp.email) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: gmailUser, pass: gmailPass },
          });

          const html = `
            <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <div style="height:4px;background:#D97706;"></div>
              <div style="padding:40px 36px;">
                <div style="text-align:center;margin-bottom:28px;">
                  <div style="display:inline-flex;width:56px;height:56px;background:rgba(217, 119, 6, 0.1);border-radius:14px;align-items:center;justify-content:center;font-size:28px;color:#D97706;">🔐</div>
                  <h1 style="color:#0F172A;font-size:20px;font-weight:800;margin:14px 0 4px;letter-spacing:-0.5px;">HRPulse Employee Access</h1>
                  <p style="color:#64748B;font-size:13px;margin:0;">Shri Sai Jewellers · Employee Portal</p>
                </div>

                <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 24px;">
                  Hello <strong>${matchedEmp.name}</strong>,<br/>
                  Use the secure verification code below to log in to your HRPulse Employee Portal.
                </p>

                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                  <p style="color:#64748B;font-size:11px;font-weight:600;letter-spacing:2px;margin:0 0 10px;text-transform:uppercase;">One-Time Verification Code</p>
                  <div style="font-size:38px;font-weight:900;letter-spacing:10px;color:#D97706;font-family:monospace;">${otpCode}</div>
                  <p style="color:#64748B;font-size:12px;margin:10px 0 0;">⏱ Valid for <strong style="color:#B45309;">10 minutes</strong></p>
                </div>

                <p style="color:#64748B;font-size:12px;line-height:1.5;margin:0 0 24px;text-align:center;">
                  If you did not request this, you can safely ignore this message.
                </p>

                <p style="color:#94A3B8;font-size:11px;text-align:center;margin:0;border-top:1px solid #f1f5f9;padding-top:20px;">
                  © ${new Date().getFullYear()} Shri Sai Jewellers · HRPulse Employee Portal
                </p>
              </div>
            </div>
          `;

          await transporter.sendMail({
            from: `"HRPulse Employee Portal" <${gmailUser}>`,
            to: matchedEmp.email,
            subject: `🔐 Your HRPulse Login Code: ${otpCode}`,
            html,
          });
          emailSent = true;
        } catch (err: any) {
          console.error('Failed to send employee login SMTP email:', err);
          smtpError = err.message || 'SMTP configuration error';
        }
      }

      // Mask email helper for response display
      const maskEmail = (email: string) => {
        const parts = email.split('@');
        if (parts.length !== 2) return '***';
        const name = parts[0];
        const domain = parts[1];
        if (name.length <= 2) return `***@${domain}`;
        return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
      };

      return NextResponse.json({
        ok: true,
        step: 'otp',
        token,
        employeeId: matchedEmp.id,
        emailSent,
        maskedEmail: matchedEmp.email ? maskEmail(matchedEmp.email) : 'N/A',
        otp: emailSent ? undefined : otpCode, // Only send raw code if email fails (for sandbox/demo testing)
        warning: emailSent ? undefined : (smtpError || 'Email service not configured. Falling back to on-screen OTP.')
      });
    }

    // 2. VERIFY OTP & LOGIN ACTION
    if (action === 'login') {
      const { token, otp } = body;
      if (!token || !otp) {
        return NextResponse.json({ ok: false, error: 'Verification token and OTP are required' }, { status: 400 });
      }

      const entry = employeeOtpStore.get(token);
      if (!entry) {
        return NextResponse.json({ ok: false, error: 'OTP session expired or invalid. Please try again.' }, { status: 400 });
      }

      if (Date.now() > entry.expiresAt) {
        employeeOtpStore.delete(token);
        return NextResponse.json({ ok: false, error: 'OTP has expired. Please request a new one.' }, { status: 400 });
      }

      if (otp !== entry.otp) {
        return NextResponse.json({ ok: false, error: 'Incorrect OTP. Please try again.' }, { status: 400 });
      }

      const employeeId = entry.employeeId;
      employeeOtpStore.delete(token);

      // Fetch employee details
      const { data: empDetails, error: empErr } = await supabase
        .from('employees')
        .select('name')
        .eq('id', employeeId)
        .single();

      if (empErr) {
        console.error('Error fetching employee on success:', empErr);
      }

      // Grant session
      cookieStore.set('hrpulse_emp_session', employeeId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({
        ok: true,
        employee: {
          id: employeeId,
          name: empDetails?.name || 'Employee'
        }
      });
    }

    // 3. CHANGE PIN ACTION
    if (action === 'changePin') {
      const { employeeId, oldPin, newPin } = body;
      if (!employeeId || !oldPin || !newPin) {
        return NextResponse.json({ ok: false, error: 'Employee ID, current and new PIN are required' }, { status: 400 });
      }

      const upperEmpId = employeeId.toUpperCase();

      // Fetch stored PIN
      const { data: pinData, error: pinErr } = await supabase
        .from('employee_pins')
        .select('pin')
        .eq('employee_id', upperEmpId)
        .maybeSingle();

      if (pinErr) {
        console.error('Error verifying PIN on change:', pinErr);
        return NextResponse.json({ ok: false, error: 'PIN check failed' }, { status: 500 });
      }

      const storedPin = pinData?.pin || '1234';

      if (oldPin !== storedPin) {
        return NextResponse.json({ ok: false, error: 'Current PIN is incorrect' }, { status: 401 });
      }

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return NextResponse.json({ ok: false, error: 'New PIN must be exactly 4 digits' }, { status: 400 });
      }

      // Upsert new PIN
      const { error: updateErr } = await supabase
        .from('employee_pins')
        .upsert({ employee_id: upperEmpId, pin: newPin });

      if (updateErr) {
        console.error('Error updating PIN:', updateErr);
        return NextResponse.json({ ok: false, error: 'Failed to update PIN in database' }, { status: 500 });
      }

      // Ensure cookie session is set/refreshed
      cookieStore.set('hrpulse_emp_session', upperEmpId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({ ok: true });
    }

    // 4. ADMIN PIN RESET ACTION
    if (action === 'resetPinByAdmin') {
      const adminSession = cookieStore.get('hrpulse_admin_session');
      const isAdmin = adminSession && adminSession.value === 'granted';

      if (!isAdmin) {
        return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
      }

      const { employeeId } = body;
      if (!employeeId) {
        return NextResponse.json({ ok: false, error: 'Employee ID is required for PIN reset' }, { status: 400 });
      }

      const upperEmpId = employeeId.toUpperCase();

      // Reset PIN to default '1234'
      const { error: resetErr } = await supabase
        .from('employee_pins')
        .upsert({ employee_id: upperEmpId, pin: '1234' });

      if (resetErr) {
        console.error('Error resetting employee PIN:', resetErr);
        return NextResponse.json({ ok: false, error: 'Database update failed' }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}
