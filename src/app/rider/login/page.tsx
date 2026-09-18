'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Lock,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Truck,
  MapPin
} from 'lucide-react';
import {
  loginRider,
  getAuthenticatedRider,
  PRESET_RIDERS,
  RiderProfile
} from '../../../lib/rider';

export default function RiderLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('9841234567');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // If already authenticated as a rider, immediately redirect to /rider/dashboard
  useEffect(() => {
    const existingRider = getAuthenticatedRider();
    if (existingRider) {
      router.replace('/rider/dashboard');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = loginRider(phone, pin);
    if (res.success && res.rider) {
      setSuccessMsg(`✓ Verified: ${res.rider.name} (${res.rider.hubCode}). Loading Run-Sheet...`);
      setTimeout(() => {
        router.push('/rider/dashboard');
      }, 400);
    } else {
      setIsLoading(false);
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickDemoSelect = (rider: RiderProfile) => {
    setErrorMsg(null);
    setPhone(rider.phone);
    setPin(rider.pin);
    setIsLoading(true);
    const res = loginRider(rider.phone, rider.pin);
    if (res.success && res.rider) {
      setSuccessMsg(`✓ Verified: ${res.rider.name} (${res.rider.hubCode}). Entering Terminal...`);
      setTimeout(() => {
        router.push('/rider/dashboard');
      }, 300);
    } else {
      setIsLoading(false);
      setErrorMsg(res.error || 'Authentication failed.');
    }
  };

  if (isCheckingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050811',
        color: '#94a3b8',
        fontFamily: 'var(--font-sans)',
        gap: '0.75rem'
      }}>
        <RefreshCw size={20} className="animate-spin" color="var(--brand-orange)" />
        <span>Verifying terminal credentials...</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050811',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.1) 0%, rgba(5, 8, 17, 0) 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'var(--font-sans)',
      color: '#ffffff'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto'
      }}>
        {/* Rider Terminal Brand Badge */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.08))',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.2)',
            marginBottom: '1rem'
          }}>
            <Bike size={32} color="#fb923c" />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(249, 115, 22, 0.12)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            color: '#fb923c',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            <ShieldCheck size={12} />
            Field Dispatch Network
          </div>

          <h1 style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0.25rem 0',
            color: '#ffffff'
          }}>
            DOUBLE 7 LOGISTICS
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: '#94a3b8',
            margin: 0
          }}>
            Rider Operations &amp; Run-Sheet Portal
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          backgroundColor: '#0c1220',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '2rem 1.75rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}>
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              borderRadius: '10px',
              padding: '0.75rem 0.9rem',
              fontSize: '0.82rem',
              marginBottom: '1.25rem'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              backgroundColor: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399',
              borderRadius: '10px',
              padding: '0.75rem 0.9rem',
              fontSize: '0.82rem',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Phone or Rider ID */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.4rem'
              }}>
                Rider Mobile Number or ID
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }}>
                  <Smartphone size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9841234567 or rider-ktm-01"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem 0.75rem 2.45rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* 4-Digit PIN */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#cbd5e1'
                }}>
                  4-Digit Security PIN
                </label>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Default: 1234
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 2.45rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: showPin ? '0.1em' : '0.25em',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Terminal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#94a3b8' }}>
                <input
                  type="checkbox"
                  checked={rememberTerminal}
                  onChange={(e) => setRememberTerminal(e.target.checked)}
                  style={{ accentColor: 'var(--brand-orange)' }}
                />
                Remember this terminal device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Connecting to Terminal...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Delivery Run-Sheet</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Rider Accounts */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.85rem'
            }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: '#64748b',
                textTransform: 'uppercase'
              }}>
                Instant Demo Rider Terminal
              </span>
              <span style={{
                fontSize: '0.68rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#94a3b8'
              }}>
                PIN: 1234
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
              {PRESET_RIDERS.slice(0, 4).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleQuickDemoSelect(r)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)';
                    e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#fb923c', fontFamily: 'var(--font-mono)' }}>
                    {r.hubCode} &bull; {r.vehiclePlate}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security / Dispatch notice */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.75rem',
          color: '#64748b',
          lineHeight: '1.5'
        }}>
          Authorized field delivery personnel only. Unauthorized terminal access attempts are logged and monitored by Double 7 Logistics Station Dispatch Controller.
        </div>
      </div>
    </div>
  );
}
