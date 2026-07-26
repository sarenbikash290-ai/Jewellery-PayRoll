'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Eye, EyeOff, Lock, User, ShieldCheck, AlertCircle,
  ArrowLeft, Mail, RefreshCw, CheckCircle2, KeyRound,
} from 'lucide-react';

// ── Auth helpers ──────────────────────────────────────────────────────────────
export async function checkAdminSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check' })
    });
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    });
  } catch { }
}

// ─────────────────────────────────────────────────────────────────────────────

type Screen = 'login' | 'sending' | 'otp' | 'revealed';

const OTP_EXPIRY_SEC = 10 * 60; // 10 minutes

interface LoginScreenProps { onSuccess: () => void; }

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [screen, setScreen] = useState<Screen>('login');
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);

  // Login
  const [password, setPassword] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // OTP
  const [otpToken, setOtpToken] = useState('');           // server token
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(OTP_EXPIRY_SEC);
  const [resendLoading, setResendLoading] = useState(false);
  const [sendError, setSendError] = useState('');

  // Reveal
  const [showReveal, setShowReveal] = useState(false);

  const pwRef = useRef<HTMLInputElement>(null);
  const otp0Ref = useRef<HTMLInputElement>(null);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => { setMounted(true); setTimeout(() => pwRef.current?.focus(), 400); }, []);

  // Countdown timer while on OTP screen
  useEffect(() => {
    if (screen !== 'otp') return;
    setTimer(OTP_EXPIRY_SEC);
    const id = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(id); return 0; } return t - 1; }), 1000);
    return () => clearInterval(id);
  }, [screen, otpToken]);

  useEffect(() => { if (screen === 'otp') setTimeout(() => otpRefs[0].current?.focus(), 150); }, [screen]);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setLoginError('Please enter the password.'); return; }
    setLoginLoading(true); setLoginError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password })
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess();
      } else {
        setLoginLoading(false);
        setLoginError(data.error || 'Incorrect password. Please try again.');
        triggerShake(); setPassword('');
        setTimeout(() => pwRef.current?.focus(), 50);
      }
    } catch {
      setLoginLoading(false);
      setLoginError('Server authentication failed.');
      triggerShake();
    }
  };

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setScreen('sending'); setSendError('');
    try {
      const res = await fetch('/api/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send' }) });
      const data = await res.json();
      if (!data.ok) { setSendError(data.error || 'Failed to send OTP.'); setScreen('login'); return; }
      setOtpToken(data.token);
      setMaskedEmail(data.maskedEmail);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setScreen('otp');
    } catch {
      setSendError('Network error. Is the dev server running?');
      setScreen('login');
    }
  };

  // ── OTP digit input ───────────────────────────────────────────────────────
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[index] = val.slice(-1);
    setOtp(next);
    setOtpError('');
    if (val && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = [...otp];
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs[Math.min(text.length, 5)].current?.focus();
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Please enter all 6 digits.'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      const res = await fetch('/api/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', token: otpToken, otp: code }) });
      const data = await res.json();
      if (!data.ok) {
        setOtpLoading(false);
        setOtpError(data.error || 'Invalid OTP.');
        triggerShake();
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs[0].current?.focus(), 50);
        return;
      }
      setRecoveredPassword(data.password || '');
      setScreen('revealed');
    } catch {
      setOtpLoading(false); setOtpError('Network error. Please try again.');
    }
  };

  const fmtTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Shared input style ────────────────────────────────────────────────────
  const baseInput: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', padding: '13px 44px 13px 42px', color: '#F0F4FF',
    fontSize: '14px', outline: 'none', transition: 'all 0.2s',
    fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', width: '100%',
  };

  // ── accent colour per screen ──────────────────────────────────────────────
  const accentGrad =
    screen === 'revealed' ? 'linear-gradient(90deg,#10B981,#34D399,#10B981)' :
      screen === 'otp' || screen === 'sending' ? 'linear-gradient(90deg,#8B5CF6,#4F8EF7,#8B5CF6)' :
        'linear-gradient(90deg,#4F8EF7,#8B5CF6,#10B981)';

  const iconBg =
    screen === 'revealed' ? 'linear-gradient(135deg,#10B981,#34D399)' :
      screen === 'otp' || screen === 'sending' ? 'linear-gradient(135deg,#8B5CF6,#4F8EF7)' :
        'linear-gradient(135deg,#4F8EF7,#8B5CF6)';

  const iconGlow =
    screen === 'revealed' ? 'rgba(16,185,129,0.4)' :
      screen === 'otp' || screen === 'sending' ? 'rgba(139,92,246,0.4)' :
        'rgba(79,142,247,0.4)';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg,#060912 0%,#0d1424 50%,#111b2e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      overflow: 'hidden',
    }}>
      {/* Blobs */}
      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,142,247,0.12) 0%,transparent 70%)', top: '-100px', left: '-100px', animation: 'blobFloat 8s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)', bottom: '-80px', right: '-80px', animation: 'blobFloat 10s ease-in-out infinite reverse', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 70%)', top: '40%', right: '20%', animation: 'blobFloat 12s ease-in-out infinite 2s', pointerEvents: 'none' }} />
      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* ─── Card ──────────────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: '420px', margin: '0 16px',
        background: 'rgba(13,20,36,0.92)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px', boxShadow: `0 32px 80px rgba(0,0,0,0.7),0 0 0 1px ${iconGlow.replace('0.4', '0.08')}`,
        backdropFilter: 'blur(24px)', overflow: 'hidden',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease,transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        animation: shake ? 'shake 0.5s ease' : 'none',
      }}>
        {/* Accent bar */}
        <div style={{ height: '3px', background: accentGrad, transition: 'background 0.4s ease' }} />

        {/* Logo header */}
        <div style={{ padding: '32px 40px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '56px', height: '56px', background: iconBg, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 8px 32px ${iconGlow}`, position: 'relative', transition: 'all 0.4s ease' }}>
            {screen === 'revealed' ? <CheckCircle2 size={26} color="#fff" /> : screen === 'otp' || screen === 'sending' ? <Mail size={26} color="#fff" /> : <ShieldCheck size={26} color="#fff" strokeWidth={2} />}
            <div style={{ position: 'absolute', inset: '-4px', borderRadius: '20px', border: `1px solid ${iconGlow.replace('0.4', '0.3')}`, animation: 'ringPulse 2s ease-in-out infinite' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FF', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            {screen === 'revealed' ? 'Identity Verified!' : screen === 'sending' ? 'Sending OTP…' : screen === 'otp' ? 'Check Your Email' : 'HRPulse'}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(148,163,184,0.7)', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' }}>
            SAI Jewellers · Enterprise Suite
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(100,116,139,0.9)' }}>
            {screen === 'revealed' ? 'Your password has been retrieved.' :
              screen === 'sending' ? 'Please wait while we send the OTP to your email.' :
                screen === 'otp' ? `Enter the 6-digit OTP sent to ${maskedEmail}` :
                  'Sign in to access your dashboard'}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 40px 36px' }}>

          {/* ══ LOGIN ══ */}
          {screen === 'login' && (<>
            {/* Owner chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: '12px', marginBottom: '22px' }}>
              <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={14} color="#fff" /></div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#F0F4FF' }}>Admin</div>
                <div style={{ fontSize: '11px', color: 'rgba(148,163,184,0.7)', marginTop: '1px' }}>Super Administrator · Owner</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>OWNER</div>
            </div>

            {sendError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', marginBottom: '16px', fontSize: '12px', color: '#EF4444' }}>
                <AlertCircle size={14} /> {sendError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148,163,184,0.7)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: loginError ? '#EF4444' : 'rgba(100,116,139,0.8)', pointerEvents: 'none', transition: 'color 0.2s' }}><Lock size={15} /></div>
                  <input
                    ref={pwRef} type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                    placeholder="Enter your password" autoComplete="current-password"
                    style={{ ...baseInput, border: `1px solid ${loginError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`, background: loginError ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)' }}
                    onFocus={e => { e.target.style.borderColor = loginError ? 'rgba(239,68,68,0.5)' : 'rgba(79,142,247,0.5)'; e.target.style.boxShadow = loginError ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(79,142,247,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = loginError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(100,116,139,0.7)', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#F0F4FF')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(100,116,139,0.7)')}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', minHeight: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#EF4444', opacity: loginError ? 1 : 0, transition: 'opacity 0.2s' }}>
                    {loginError && <><AlertCircle size={13} />{loginError}</>}
                  </div>
                  {/* Forgot password */}
                  <button type="button" onClick={sendOtp} style={{ fontSize: '11px', color: 'rgba(79,142,247,0.8)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#7CAFFF')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(79,142,247,0.8)')}>
                    Forgot password?
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loginLoading} style={{ width: '100%', padding: '13px', background: loginLoading ? 'rgba(79,142,247,0.5)' : 'linear-gradient(135deg,#4F8EF7 0%,#2563EB 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loginLoading ? 'not-allowed' : 'pointer', boxShadow: loginLoading ? 'none' : '0 4px 20px rgba(79,142,247,0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={e => { if (!loginLoading) (e.currentTarget.style.transform = 'translateY(-1px)'); }}
                onMouseLeave={e => { (e.currentTarget.style.transform = 'none'); }}>
                {loginLoading ? (<><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Verifying…</>) : (<><Lock size={15} />Sign In</>)}
              </button>
            </form>

            <div style={{ marginTop: '20px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <ShieldCheck size={13} color="rgba(79,142,247,0.6)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '11px', color: 'rgba(100,116,139,0.7)', lineHeight: 1.5 }}>
                Restricted to authorized personnel only. Forgot your password? Use the recovery link above — an OTP will be sent to your registered email.
              </div>
            </div>
          </>)}

          {/* ══ SENDING ══ */}
          {screen === 'sending' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '48px', height: '48px', border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
              <div style={{ fontSize: '14px', color: 'rgba(148,163,184,0.8)', lineHeight: 1.6 }}>
                Sending a 6-digit OTP to your<br />registered email address…
              </div>
            </div>
          )}

          {/* ══ OTP ENTRY ══ */}
          {screen === 'otp' && (<>
            <button onClick={() => setScreen('login')} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(148,163,184,0.7)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0, transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#F0F4FF')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.7)')}>
              <ArrowLeft size={14} /> Back to login
            </button>

            {/* Info box */}
            <div style={{ padding: '12px 16px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', marginBottom: '22px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Mail size={16} color="#8B5CF6" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.85)', lineHeight: 1.5 }}>
                OTP sent to <strong style={{ color: '#F0F4FF' }}>{maskedEmail}</strong>.<br />
                Check your inbox (and spam folder).
              </div>
            </div>

            <form onSubmit={verifyOtp}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148,163,184,0.7)', letterSpacing: '0.8px', display: 'block', marginBottom: '12px' }}>ENTER 6-DIGIT OTP</label>

              {/* OTP boxes */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: '44px', height: '52px', textAlign: 'center',
                      fontSize: '22px', fontWeight: 800, fontFamily: 'monospace',
                      background: digit ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `2px solid ${otpError ? 'rgba(239,68,68,0.5)' : digit ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '12px', color: '#F0F4FF', outline: 'none',
                      transition: 'all 0.15s', caretColor: '#8B5CF6',
                    }}
                    onFocus={e => { e.target.style.borderColor = otpError ? 'rgba(239,68,68,0.6)' : 'rgba(139,92,246,0.7)'; e.target.style.boxShadow = otpError ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(139,92,246,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = otpError ? 'rgba(239,68,68,0.5)' : digit ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                ))}
              </div>

              {/* Error / timer row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '22px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#EF4444', opacity: otpError ? 1 : 0, transition: 'opacity 0.2s' }}>
                  {otpError && <><AlertCircle size={13} />{otpError}</>}
                </div>
                <div style={{ fontSize: '12px', color: timer < 60 ? '#EF4444' : 'rgba(100,116,139,0.7)', fontWeight: 600, fontFamily: 'monospace' }}>
                  {timer > 0 ? `⏱ ${fmtTimer(timer)}` : 'Expired'}
                </div>
              </div>

              <button type="submit" disabled={otpLoading || timer === 0} style={{ width: '100%', padding: '13px', background: (otpLoading || timer === 0) ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: (otpLoading || timer === 0) ? 'not-allowed' : 'pointer', boxShadow: (otpLoading || timer === 0) ? 'none' : '0 4px 20px rgba(139,92,246,0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}
                onMouseEnter={e => { if (!otpLoading && timer > 0) (e.currentTarget.style.transform = 'translateY(-1px)'); }}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                {otpLoading ? (<><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Verifying…</>) : (<><KeyRound size={15} />Verify OTP</>)}
              </button>
            </form>

            {/* Resend */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'rgba(100,116,139,0.7)' }}>Didn&apos;t receive it? </span>
              <button
                disabled={resendLoading || timer > OTP_EXPIRY_SEC - 30}
                onClick={async () => { setResendLoading(true); await sendOtp(); setResendLoading(false); }}
                style={{ fontSize: '12px', color: (resendLoading || timer > OTP_EXPIRY_SEC - 30) ? 'rgba(79,142,247,0.35)' : 'rgba(79,142,247,0.8)', background: 'none', border: 'none', cursor: (resendLoading || timer > OTP_EXPIRY_SEC - 30) ? 'not-allowed' : 'pointer', fontWeight: 600, padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s' }}>
                <RefreshCw size={12} style={{ animation: resendLoading ? 'spin 0.8s linear infinite' : 'none' }} />
                Resend OTP
              </button>
            </div>
          </>)}

          {/* ══ REVEALED ══ */}
          {screen === 'revealed' && (<>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(16,185,129,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 size={26} color="#10B981" />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F4FF', marginBottom: '4px' }}>OTP Verified Successfully</div>
              <div style={{ fontSize: '12px', color: 'rgba(100,116,139,0.8)' }}>Here is your account password:</div>
            </div>

            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{ padding: '18px 56px 18px 20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: showReveal ? '22px' : '28px', fontWeight: 900, color: '#10B981', letterSpacing: showReveal ? '4px' : '8px', fontFamily: 'monospace', transition: 'all 0.3s', userSelect: showReveal ? 'text' : 'none' }}>
                  {showReveal ? recoveredPassword : '••••••••••'}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(100,116,139,0.6)', marginTop: '6px' }}>
                  {showReveal ? 'Copy and save it somewhere safe!' : 'Tap the eye icon to reveal'}
                </div>
              </div>
              <button type="button" onClick={() => setShowReveal(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(16,185,129,0.7)', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#10B981')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(16,185,129,0.7)')}>
                {showReveal ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button onClick={() => { setScreen('login'); setPassword(''); setOtp(['', '', '', '', '', '']); setShowReveal(false); }} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#4F8EF7 0%,#2563EB 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,142,247,0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
              <ArrowLeft size={15} /> Back to Sign In
            </button>
          </>)}

        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '20px', fontSize: '11px', color: 'rgba(100,116,139,0.4)', textAlign: 'center', letterSpacing: '0.5px' }}>
        © {new Date().getFullYear()} SAI Jewellers · HRPulse v1.0
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-20px) scale(1.05)} 66%{transform:translate(-15px,15px) scale(0.97)} }
        @keyframes ringPulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-6px)} 60%{transform:translateX(6px)} 75%{transform:translateX(-4px)} 90%{transform:translateX(4px)} }
        input::placeholder{color:rgba(100,116,139,0.45)}
      `}</style>
    </div>
  );
}
