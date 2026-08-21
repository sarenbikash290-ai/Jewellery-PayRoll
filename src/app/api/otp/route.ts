import nodemailer from 'nodemailer';

// ── Rate limiter (max 3 OTP sends per 10 minutes per IP) ────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

// ── In-memory OTP store (valid 10 minutes) ──────────────────────────────────
// { token → { otp, expiresAt } }
const globalForAdminOtp = globalThis as unknown as {
  otpStore?: Map<string, { otp: string; expiresAt: number }>;
};

const otpStore =
  globalForAdminOtp.otpStore ||
  new Map<string, { otp: string; expiresAt: number }>();

globalForAdminOtp.otpStore = otpStore;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.slice(0, 2) + '***' + local.slice(-1);
  return `${masked}@${domain}`;
}

// ── POST /api/otp  →  { action: 'send' | 'verify', otp?, token? } ──────────
export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  // ── SEND OTP ──────────────────────────────────────────────────────────────
  if (action === 'send') {
    // Rate limit: max 3 OTP sends per 10 minutes per IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    if (isRateLimited(clientIp)) {
      return Response.json(
        { ok: false, error: 'Too many OTP requests. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    const gmailUser  = process.env.GMAIL_USER;
    const gmailPass  = process.env.GMAIL_APP_PASSWORD;
    const toEmail    = process.env.RECOVERY_EMAIL;

    if (!gmailUser || !gmailPass || !toEmail) {
      return Response.json(
        { ok: false, error: 'Email service is not configured. Please set GMAIL_USER, GMAIL_APP_PASSWORD and RECOVERY_EMAIL in .env.local' },
        { status: 500 }
      );
    }

    const otp   = generateOTP();
    const token = crypto.randomUUID();
    otpStore.set(token, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d1424;border-radius:16px;overflow:hidden;">
        <div style="height:4px;background:linear-gradient(90deg,#4F8EF7,#8B5CF6,#10B981);"></div>
        <div style="padding:40px 36px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-flex;width:56px;height:56px;background:linear-gradient(135deg,#4F8EF7,#8B5CF6);border-radius:14px;align-items:center;justify-content:center;font-size:28px;">🛡️</div>
            <h1 style="color:#F0F4FF;font-size:20px;font-weight:800;margin:14px 0 4px;letter-spacing:-0.5px;">HRPulse — OTP Verification</h1>
            <p style="color:#64748B;font-size:13px;margin:0;">Shri Sai Jewellers · Enterprise Suite</p>
          </div>

          <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px;">
            A password recovery was requested for your HRPulse account. Use the one-time code below to proceed.
          </p>

          <div style="background:#111b2e;border:1px solid rgba(79,142,247,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="color:#64748B;font-size:11px;font-weight:600;letter-spacing:2px;margin:0 0 10px;text-transform:uppercase;">Your OTP Code</p>
            <div style="font-size:38px;font-weight:900;letter-spacing:10px;color:#4F8EF7;font-family:monospace;">${otp}</div>
            <p style="color:#64748B;font-size:12px;margin:10px 0 0;">⏱ Valid for <strong style="color:#F59E0B;">10 minutes</strong> only</p>
          </div>

          <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:14px 16px;margin-bottom:24px;">
            <p style="color:#EF4444;font-size:12px;margin:0;line-height:1.6;">
              ⚠️ If you did not request this, please ignore this email. Your account remains secure.
            </p>
          </div>

          <p style="color:#475569;font-size:11px;text-align:center;margin:0;">
            © ${new Date().getFullYear()} Shri Sai Jewellers · HRPulse v1.0
          </p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"HRPulse · Shri Sai Jewellers" <${gmailUser}>`,
        to: toEmail,
        subject: `🔐 Your HRPulse OTP: ${otp}`,
        html,
      });

      return Response.json({
        ok: true,
        token,
        maskedEmail: maskEmail(toEmail),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return Response.json({ ok: false, error: `Failed to send email: ${msg}` }, { status: 500 });
    }
  }

  // ── VERIFY OTP ────────────────────────────────────────────────────────────
  if (action === 'verify') {
    const { token, otp } = body as { token: string; otp: string };
    const entry = otpStore.get(token);

    if (!entry) {
      return Response.json({ ok: false, error: 'OTP expired or invalid. Please request a new one.' }, { status: 400 });
    }
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(token);
      return Response.json({ ok: false, error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }
    if (otp !== entry.otp) {
      return Response.json({ ok: false, error: 'Incorrect OTP. Please try again.' }, { status: 400 });
    }

    otpStore.delete(token); // one-time use
    const expectedPassword = process.env.ADMIN_PASSWORD || 'Bikash@123';
    return Response.json({ ok: true, password: expectedPassword });
  }

  return Response.json({ ok: false, error: 'Invalid action.' }, { status: 400 });
}
