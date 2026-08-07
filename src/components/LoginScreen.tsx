'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Eye, EyeOff, Lock, User, ShieldCheck, AlertCircle,
  ArrowLeft, Mail, RefreshCw, CheckCircle2, KeyRound, Sparkles, HelpCircle,
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

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(circle at 50% 30%, #17382d 0%, #10261f 50%, #091713 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflow: 'hidden', padding: '16px'
    }}>
      {/* Background ambient glowing orbs */}
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(46, 140, 108, 0.18) 0%, transparent 70%)', top: '-150px', left: '-100px', animation: 'orbFloat 10s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(74, 158, 151, 0.15) 0%, transparent 70%)', bottom: '-120px', right: '-100px', animation: 'orbFloat 12s ease-in-out infinite reverse', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', top: '35%', right: '15%', animation: 'orbFloat 14s ease-in-out infinite 2s', pointerEvents: 'none' }} />

      {/* ─── Main Card Container ─────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: '980px', minHeight: '580px',
        background: '#153026',
        borderRadius: '36px',
        boxShadow: '0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        position: 'relative', overflow: 'hidden',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: shake ? 'shake 0.5s ease' : 'none',
      }}>

        {/* ══ LEFT PANEL (Light section with Organic Wave Curve) ══ */}
        <div className="left-panel-container" style={{
          background: '#ffffff',
          position: 'relative',
          padding: '40px 36px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          zIndex: 2,
        }}>

          {/* SVG Wave separator cutting into the dark right panel */}
          <div className="wave-separator" style={{
            position: 'absolute', top: 0, right: '-70px', bottom: 0, width: '75px',
            pointerEvents: 'none', zIndex: 10,
          }}>
            <svg viewBox="0 0 100 800" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <path d="M0,0 Q120,250 0,500 T0,800 L0,0 Z" fill="#ffffff" />
            </svg>
          </div>

          {/* Header Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 3 }}>
            {/* Logo image or Emblem fallback */}
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #18382d 0%, #2b5747 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(24, 56, 45, 0.25)',
              padding: '6px'
            }}>
              <img
                src="/logo.png"
                alt="Shri Sai Jewellers Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
              <div className="logo-fallback" style={{ display: 'none', color: '#4a9e97', fontWeight: 800, fontSize: '18px' }}>
                SJ
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#163328', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Shri Sai Jewellers
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#4b7565', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                HRPulse Enterprise Suite
              </div>
            </div>
          </div>

          {/* Center Graphic / Illustration inside soft mint blob */}
          <div style={{
            position: 'relative', margin: '30px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '280px', zIndex: 3
          }}>
            {/* Organic mint blob backdrop */}
            <div style={{
              position: 'absolute', width: '260px', height: '260px',
              borderRadius: '42% 58% 70% 30% / 45% 45% 55% 55%',
              background: 'linear-gradient(135deg, #cde6dd 0%, #b3dad0 100%)',
              animation: 'blobMorph 12s ease-in-out infinite alternate',
              opacity: 0.85,
            }} />

            {/* Floating detail elements */}
            <div style={{
              position: 'absolute', top: '15px', right: '40px', width: '38px', height: '38px',
              background: '#1b3d32', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(27, 61, 50, 0.25)', animation: 'floatSlow 6s ease-in-out infinite'
            }}>
              <ShieldCheck size={20} color="#5ec4b6" />
            </div>

            <div style={{
              position: 'absolute', bottom: '20px', left: '25px', width: '34px', height: '34px',
              background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)', animation: 'floatSlow 7s ease-in-out infinite reverse'
            }}>
              <Sparkles size={16} color="#1b3d32" />
            </div>

            {/* Main Central HR Payroll & Jewellery Dashboard Illustration */}
            <div style={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
              <svg width="240" height="210" viewBox="0 0 240 210" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Soft ground shadow */}
                <ellipse cx="120" cy="192" rx="85" ry="10" fill="#9dbfb5" opacity="0.45" />

                {/* Main Floating Payroll & HR Dashboard Card */}
                <g transform="translate(30, 15)">
                  {/* Card Container */}
                  <rect x="0" y="0" width="180" height="135" rx="14" fill="#ffffff" filter="drop-shadow(0px 14px 28px rgba(27, 61, 50, 0.18))" />
                  <rect x="0" y="0" width="180" height="26" rx="14" fill="#1b3d32" />
                  <rect x="0" y="14" width="180" height="12" fill="#1b3d32" />
                  
                  {/* Window Controls */}
                  <circle cx="16" cy="13" r="3.5" fill="#ef4444" />
                  <circle cx="28" cy="13" r="3.5" fill="#f59e0b" />
                  <circle cx="40" cy="13" r="3.5" fill="#10b981" />
                  <rect x="56" y="10" width="68" height="6" rx="3" fill="#ffffff" opacity="0.45" />

                  {/* Salary Growth & Analytics Chart */}
                  <g transform="translate(14, 40)">
                    <line x1="0" y1="52" x2="92" y2="52" stroke="#e2e8f0" strokeDasharray="2 2" />
                    <line x1="0" y1="32" x2="92" y2="32" stroke="#e2e8f0" strokeDasharray="2 2" />

                    {/* Chart Bars */}
                    <rect x="4" y="26" width="12" height="26" rx="4" fill="#b3dad0" />
                    <rect x="24" y="16" width="12" height="36" rx="4" fill="#4a9e97" />
                    <rect x="44" y="8" width="12" height="44" rx="4" fill="#1b3d32" />
                    <rect x="64" y="20" width="12" height="32" rx="4" fill="#5ec4b6" />

                    {/* Trendline */}
                    <path d="M10 24 L30 14 L50 6 L70 18" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="70" cy="18" r="3" fill="#f59e0b" />
                  </g>

                  {/* Staff & Verified Payout Widget */}
                  <g transform="translate(116, 40)">
                    <rect x="0" y="0" width="50" height="36" rx="8" fill="#f0f9f6" stroke="#cde6dd" />
                    <text x="6" y="15" fontFamily="sans-serif" fontSize="9" fontWeight="bold" fill="#1b3d32">Employees</text>
                    <circle cx="14" cy="26" r="5" fill="#4a9e97" />
                    <circle cx="23" cy="26" r="5" fill="#1b3d32" />
                    <circle cx="32" cy="26" r="5" fill="#f59e0b" />

                    {/* Paid Badge */}
                    <rect x="0" y="44" width="50" height="24" rx="7" fill="#10b981" />
                    <text x="6" y="59" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#ffffff">₹ PAID ✓</text>
                  </g>
                </g>

                {/* Gold Coin Stack (Salary / Jewellery Prosperity) */}
                <g transform="translate(22, 120)">
                  <ellipse cx="18" cy="24" rx="14" ry="5" fill="#d97706" />
                  <rect x="4" y="14" width="28" height="10" fill="#f59e0b" />
                  <ellipse cx="18" cy="14" rx="14" ry="5" fill="#fbbf24" />

                  <ellipse cx="18" cy="14" rx="14" ry="5" fill="#d97706" />
                  <rect x="4" y="4" width="28" height="10" fill="#f59e0b" />
                  <ellipse cx="18" cy="4" rx="14" ry="5" fill="#fef08a" />
                  <text x="14" y="8" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#b45309">₹</text>
                </g>

                {/* Business Team Member Figure (HR Manager) */}
                <g transform="translate(10, 80)">
                  <path d="M22 68 C22 50 38 50 38 68 Z" fill="#1b3d32" />
                  <circle cx="30" cy="42" r="7" fill="#4a9e97" />
                  <rect x="32" y="50" width="12" height="16" rx="2" fill="#ffffff" stroke="#1b3d32" strokeWidth="1.5" />
                </g>

                {/* Business Team Member Figure (Employee Representative) */}
                <g transform="translate(182, 90)">
                  <path d="M24 64 C24 48 40 48 40 64 Z" fill="#4a9e97" />
                  <circle cx="32" cy="40" r="7" fill="#1b3d32" />
                </g>

                {/* Diamond / Jewellery Store Sparkle Emblem (Top Right) */}
                <g transform="translate(196, 20)">
                  <polygon points="12,0 18,8 12,16 6,8" fill="#5ec4b6" />
                  <polygon points="12,3 15,8 12,13 9,8" fill="#ffffff" />
                </g>
              </svg>
            </div>
          </div>

          {/* Left Footer */}
          <div style={{ zIndex: 3, fontSize: '11px', color: '#688c7d', fontWeight: 500 }}>
            <div>© 1987–{new Date().getFullYear()} Shri Sai Jewellers</div>
            <div style={{ fontSize: '10px', color: '#90afa2', marginTop: '2px' }}>Powered by HRPulse</div>
          </div>
        </div>

        {/* ══ RIGHT PANEL (Dark Forest Green Login Form) ══ */}
        <div style={{
          background: '#153026',
          padding: '48px 44px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          position: 'relative', zIndex: 5,
        }}>

          {/* ══ SCREEN 1: LOGIN ══ */}
          {screen === 'login' && (<>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{
                fontSize: '32px', fontWeight: 700, color: '#ffffff',
                margin: '0 0 8px 0', letterSpacing: '-0.5px'
              }}>
                Login
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', margin: 0 }}>
                Welcome back! Please enter your credentials.
              </p>
            </div>

            {sendError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', marginBottom: '18px', fontSize: '12px', color: '#FCA5A5' }}>
                <AlertCircle size={15} /> {sendError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Owner Chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px',
                background: 'rgba(0, 0, 0, 0.22)', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px', marginBottom: '4px'
              }}>
                <div style={{
                  width: '32px', height: '32px', background: 'linear-gradient(135deg, #4aa39a, #2b5747)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <User size={15} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Admin</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>Super Administrator · Owner</div>
                </div>
                <div style={{
                  marginLeft: 'auto', fontSize: '10px', fontWeight: 700, padding: '3px 9px',
                  borderRadius: '100px', background: 'rgba(94, 196, 182, 0.15)', color: '#5ec4b6',
                  border: '1px solid rgba(94, 196, 182, 0.3)', letterSpacing: '0.5px'
                }}>
                  OWNER
                </div>
              </div>

              {/* Password Input Field */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.85)', display: 'block', marginBottom: '8px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={pwRef}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      background: loginError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 0, 0, 0.28)',
                      border: `1px solid ${loginError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                      borderRadius: '24px',
                      padding: '13px 46px 13px 20px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = loginError ? '#EF4444' : '#4a9e97'; e.target.style.background = 'rgba(0, 0, 0, 0.38)'; }}
                    onBlur={e => { e.target.style.borderColor = loginError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.12)'; e.target.style.background = loginError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 0, 0, 0.28)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255, 255, 255, 0.5)', padding: '4px', display: 'flex', alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Error & Forgot Password Link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', minHeight: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#FCA5A5', opacity: loginError ? 1 : 0, transition: 'opacity 0.2s' }}>
                    {loginError && <><AlertCircle size={13} />{loginError}</>}
                  </div>
                  <button
                    type="button"
                    onClick={sendOtp}
                    style={{
                      fontSize: '12px', color: '#5ec4b6', background: 'none', border: 'none',
                      cursor: 'pointer', fontWeight: 500, padding: 0, transition: 'color 0.2s', textDecoration: 'underline'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#86e4d7')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#5ec4b6')}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Login Button (Pill shape teal gradient) */}
              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: '100%', padding: '14px',
                  background: loginLoading ? '#387870' : 'linear-gradient(135deg, #4aa39a 0%, #358077 100%)',
                  border: 'none', borderRadius: '24px',
                  color: '#ffffff', fontSize: '15px', fontWeight: 600,
                  cursor: loginLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 24px rgba(74, 163, 154, 0.35)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  marginTop: '10px'
                }}
                onMouseEnter={e => { if (!loginLoading) { (e.currentTarget.style.transform = 'translateY(-2px)'); (e.currentTarget.style.boxShadow = '0 8px 28px rgba(74, 163, 154, 0.45)'); } }}
                onMouseLeave={e => { (e.currentTarget.style.transform = 'none'); (e.currentTarget.style.boxShadow = '0 6px 24px rgba(74, 163, 154, 0.35)'); }}
              >
                {loginLoading ? (
                  <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Logging in…</>
                ) : (
                  'Login to HRPulse'
                )}
              </button>
            </form>

            {/* Restricted Notice Box */}
            <div style={{
              marginTop: '20px', padding: '12px 14px',
              background: 'rgba(0, 0, 0, 0.22)', border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start'
            }}>
              <ShieldCheck size={16} color="#5ec4b6" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
                Restricted to authorized personnel only. Forgot your password? Use the recovery link above — an OTP will be sent to your registered email.
              </div>
            </div>

            {/* Bottom Right Links */}
            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
              <a href="#terms" style={{ color: 'rgba(255, 255, 255, 0.5)', textDecoration: 'underline' }}>Terms and Services</a>
              <div>
                Have a problem? Contact us at{' '}
                <a href="mailto:support@saisjewellers.com" style={{ color: '#5ec4b6', textDecoration: 'underline' }}>support@saisjewellers.com</a>
              </div>
            </div>
          </>)}

          {/* ══ SCREEN 2: SENDING OTP ══ */}
          {screen === 'sending' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ width: '52px', height: '52px', border: '3px solid rgba(94, 196, 182, 0.2)', borderTopColor: '#5ec4b6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
              <h3 style={{ color: '#ffffff', fontSize: '18px', margin: '0 0 8px 0' }}>Sending Security Code…</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6 }}>
                Please wait while we send a 6-digit OTP code to your registered email address.
              </p>
            </div>
          )}

          {/* ══ SCREEN 3: OTP VERIFICATION ══ */}
          {screen === 'otp' && (<>
            <button
              onClick={() => setScreen('login')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)', background: 'none', border: 'none',
                cursor: 'pointer', marginBottom: '24px', padding: 0, transition: 'color 0.2s'
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
            >
              <ArrowLeft size={14} /> Back to Login
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0' }}>
              Check Your Email
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', marginBottom: '24px', lineHeight: 1.5 }}>
              Enter the 6-digit verification code sent to <strong style={{ color: '#5ec4b6' }}>{maskedEmail}</strong>
            </p>

            <form onSubmit={verifyOtp}>
              {/* 6 Digit Input Boxes */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: '42px', height: '50px', textAlign: 'center',
                      fontSize: '20px', fontWeight: 700, fontFamily: 'monospace',
                      background: digit ? 'rgba(94, 196, 182, 0.15)' : 'rgba(0, 0, 0, 0.28)',
                      border: `2px solid ${otpError ? 'rgba(239, 68, 68, 0.6)' : digit ? '#5ec4b6' : 'rgba(255, 255, 255, 0.12)'}`,
                      borderRadius: '14px', color: '#ffffff', outline: 'none',
                      transition: 'all 0.15s', caretColor: '#5ec4b6',
                    }}
                    onFocus={e => { e.target.style.borderColor = otpError ? '#EF4444' : '#5ec4b6'; e.target.style.boxShadow = '0 0 0 3px rgba(94, 196, 182, 0.2)'; }}
                    onBlur={e => { e.target.style.borderColor = otpError ? 'rgba(239, 68, 68, 0.6)' : digit ? '#5ec4b6' : 'rgba(255, 255, 255, 0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                ))}
              </div>

              {/* Error and Timer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '22px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#FCA5A5', opacity: otpError ? 1 : 0, transition: 'opacity 0.2s' }}>
                  {otpError && <><AlertCircle size={13} />{otpError}</>}
                </div>
                <div style={{ fontSize: '12px', color: timer < 60 ? '#FCA5A5' : 'rgba(255, 255, 255, 0.6)', fontWeight: 600, fontFamily: 'monospace' }}>
                  {timer > 0 ? `⏱ ${fmtTimer(timer)}` : 'Expired'}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={otpLoading || timer === 0}
                style={{
                  width: '100%', padding: '14px',
                  background: (otpLoading || timer === 0) ? '#387870' : 'linear-gradient(135deg, #4aa39a 0%, #358077 100%)',
                  border: 'none', borderRadius: '24px',
                  color: '#ffffff', fontSize: '14px', fontWeight: 600,
                  cursor: (otpLoading || timer === 0) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 24px rgba(74, 163, 154, 0.35)',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  marginBottom: '16px'
                }}
              >
                {otpLoading ? (
                  <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Verifying…</>
                ) : (
                  <><KeyRound size={16} /> Verify OTP</>
                )}
              </button>
            </form>

            {/* Resend Code with Countdown Timer */}
            {(() => {
              const resendCooldown = Math.max(0, timer - (OTP_EXPIRY_SEC - 30));
              const isResendDisabled = resendLoading || resendCooldown > 0;
              return (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Didn&apos;t receive it?{' '}
                  <button
                    disabled={isResendDisabled}
                    onClick={async () => { setResendLoading(true); await sendOtp(); setResendLoading(false); }}
                    style={{
                      fontSize: '12px',
                      color: isResendDisabled ? 'rgba(255, 255, 255, 0.4)' : '#5ec4b6',
                      background: 'none', border: 'none',
                      cursor: isResendDisabled ? 'not-allowed' : 'pointer',
                      fontWeight: 600, padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s'
                    }}
                  >
                    <RefreshCw size={12} style={{ animation: resendLoading ? 'spin 0.8s linear infinite' : 'none' }} />
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              );
            })()}
          </>)}

          {/* ══ SCREEN 4: PASSWORD REVEALED ══ */}
          {screen === 'revealed' && (<>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', background: 'rgba(94, 196, 182, 0.15)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', border: '1px solid rgba(94, 196, 182, 0.3)'
              }}>
                <CheckCircle2 size={28} color="#5ec4b6" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>Identity Verified!</h2>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>Here is your account password:</p>
            </div>

            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{
                padding: '20px 56px 20px 20px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(94, 196, 182, 0.4)',
                borderRadius: '20px', textAlign: 'center'
              }}>
                <div style={{
                  fontSize: showReveal ? '22px' : '26px', fontWeight: 800,
                  color: '#5ec4b6', letterSpacing: showReveal ? '3px' : '8px',
                  fontFamily: 'monospace', transition: 'all 0.3s'
                }}>
                  {showReveal ? recoveredPassword : '••••••••••'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReveal(v => !v)}
                style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#5ec4b6', padding: '4px', display: 'flex', alignItems: 'center',
                  transition: 'color 0.2s'
                }}
              >
                {showReveal ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              onClick={() => { setScreen('login'); setPassword(''); setOtp(['', '', '', '', '', '']); setShowReveal(false); }}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #4aa39a 0%, #358077 100%)',
                border: 'none', borderRadius: '24px', color: '#ffffff',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(74, 163, 154, 0.35)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <ArrowLeft size={16} /> Return to Sign In
            </button>
          </>)}

        </div>
      </div>

      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -20px) scale(1.05); }
        }
        @keyframes blobMorph {
          0% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; }
          100% { border-radius: 65% 35% 40% 60% / 55% 60% 40% 45%; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @media (max-width: 768px) {
          .wave-separator { display: none !important; }
          .left-panel-container { display: none !important; }
        }
        input::placeholder { color: rgba(255, 255, 255, 0.45); }
      `}</style>
    </div>
  );
}
