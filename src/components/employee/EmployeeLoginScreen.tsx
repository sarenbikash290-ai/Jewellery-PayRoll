'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { Lock, User, AlertCircle, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';

interface EmployeeLoginScreenProps {
  onSuccess: (empSession: { empId: string; name: string }) => void;
}

type ScreenType = 'login' | 'changePin' | 'success';

export default function EmployeeLoginScreen({ onSuccess }: EmployeeLoginScreenProps) {
  const { employees, toast } = useApp();
  const [screen, setScreen] = useState<ScreenType>('login');
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);

  // Login inputs
  const [empId, setEmpId] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Change PIN inputs
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const idRef = useRef<HTMLInputElement>(null);
  const newPinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    idRef.current?.focus();
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId.trim() || !pin) {
      setLoginError('Please fill in both fields.');
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      // Verify PIN via server directly
      const res = await fetch('/api/auth/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', employeeId: empId.trim(), pin })
      });
      const data = await res.json();
      if (!data.ok) {
        setLoading(false);
        setLoginError(data.error || 'Incorrect PIN. Please try again.');
        triggerShake();
        setPin('');
        return;
      }

      setLoading(false);
      // Check if it is default pin
      if (pin === '1234') {
        toast('warning', 'Default PIN Detected', 'Please change your default PIN before logging in.');
        setScreen('changePin');
        setTimeout(() => newPinRef.current?.focus(), 150);
      } else {
        // Complete login
        setScreen('success');
        setTimeout(() => {
          onSuccess({ empId: data.employee.id, name: data.employee.name });
        }, 1200);
      }
    } catch {
      setLoading(false);
      setLoginError('Server authentication failed.');
      triggerShake();
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || confirmPin.length !== 4) {
      setPinError('PIN must be exactly 4 digits.');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('PIN must contain only numbers.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match.');
      triggerShake();
      return;
    }
    if (newPin === '1234') {
      setPinError('Cannot use default 1234. Choose a secure PIN.');
      triggerShake();
      return;
    }

    try {
      const res = await fetch('/api/auth/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changePin',
          employeeId: empId.trim(),
          oldPin: '1234',
          newPin
        })
      });
      const data = await res.json();
      if (data.ok) {
        setScreen('success');
        toast('success', 'PIN Updated', 'Your PIN has been changed successfully.');
        setTimeout(() => {
          onSuccess({ empId: empId.trim().toUpperCase(), name: data.employee?.name || 'Employee' });
        }, 1200);
      } else {
        setPinError(data.error || 'Failed to update PIN.');
        triggerShake();
      }
    } catch {
      setPinError('Server communication failed.');
      triggerShake();
    }
  };

  const baseInput: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid rgba(15, 23, 42, 0.12)',
    borderRadius: '12px',
    padding: '13px 16px 13px 42px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
    width: '100%',
  };

  const accentGrad =
    screen === 'success'
      ? 'linear-gradient(90deg,#10B981,#059669,#10B981)'
      : 'linear-gradient(90deg,#FCD34D,#D97706,#FCD34D)';

  const iconBg =
    screen === 'success'
      ? 'linear-gradient(135deg,#10B981,#059669)'
      : 'linear-gradient(135deg,#FCD34D,#D97706)';

  const iconGlow =
    screen === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(217,119,6,0.1)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Background Blobs */}
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle,rgba(79,142,247,0.05) 0%,transparent 70%)', top:'-100px', left:'-100px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle,rgba(79,142,247,0.03) 0%,transparent 70%)', bottom:'-80px', right:'-80px', pointerEvents:'none' }} />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          margin: '0 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          animation: shake ? 'shake 0.5s ease' : 'none',
        }}
      >
        <div style={{ height: '3px', background: accentGrad, transition: 'background 0.4s ease' }} />

        {/* Header */}
        <div style={{ padding: '32px 40px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '56px', height: '56px', background: iconBg, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 8px 24px ${iconGlow}`, position: 'relative' }}>
            {screen === 'success' ? <CheckCircle2 size={26} color="#fff" /> : screen === 'changePin' ? <KeyRound size={26} color="#fff" /> : <ShieldCheck size={26} color="#fff" />}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            {screen === 'success' ? 'Authenticated!' : screen === 'changePin' ? 'Change Default PIN' : 'Employee Portal'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
            SAI Jewellers · Employee Portal
          </div>
          <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {screen === 'success'
              ? 'Loading your dashboard...'
              : screen === 'changePin'
                ? 'Your account is using the default PIN. Please set a new 4-digit PIN.'
                : 'Enter your Employee ID and 4-digit PIN to sign in'}
          </div>
        </div>

        {/* Forms */}
        <div style={{ padding: '28px 40px 36px' }}>
          {screen === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {loginError && (
                <div style={{ display: 'flex', gap: '10px', padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger)', fontSize: '12.5px', lineHeight: '1.4' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{loginError}</span>
                </div>
              )}

              {/* ID Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>EMPLOYEE ID</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '15px', top: '16px' }} />
                  <input
                    ref={idRef}
                    type="text"
                    placeholder="e.g. EMP001"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    style={baseInput}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* PIN Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>4-DIGIT PIN</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '15px', top: '16px' }} />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) setPin(e.target.value);
                    }}
                    style={{ ...baseInput, letterSpacing: '8px', fontSize: '16px' }}
                    disabled={loading}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  First login? Use default PIN <strong>1234</strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#0F172A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
                  marginTop: '10px',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          )}

          {screen === 'changePin' && (
            <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {pinError && (
                <div style={{ display: 'flex', gap: '10px', padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger)', fontSize: '12.5px', lineHeight: '1.4' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{pinError}</span>
                </div>
              )}

              {/* New PIN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>NEW 4-DIGIT PIN</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '15px', top: '16px' }} />
                  <input
                    ref={newPinRef}
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) setNewPin(e.target.value);
                    }}
                    style={{ ...baseInput, letterSpacing: '8px', fontSize: '16px' }}
                  />
                </div>
              </div>

              {/* Confirm PIN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>CONFIRM PIN</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '15px', top: '16px' }} />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) setConfirmPin(e.target.value);
                    }}
                    style={{ ...baseInput, letterSpacing: '8px', fontSize: '16px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  background: '#0F172A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
                  marginTop: '10px',
                }}
              >
                Set PIN & Log In
              </button>
            </form>
          )}

          {screen === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid rgba(15,23,42,0.1)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Redirecting to portal...</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Embedded CSS Animations for Login */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
}
