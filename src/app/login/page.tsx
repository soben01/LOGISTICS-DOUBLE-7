'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  UserCheck,
  Mail,
  Building,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  Truck,
  Users,
  LogIn
} from 'lucide-react';
import {
  getCurrentUser,
  loginUser,
  signupUser,
  findUserByEmail,
  getMatchingPortal,
  resolveMatchedRedirect,
  User
} from '../../lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  // Sub-tabs: 'signin' | 'signup'
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Live account & role detection
  const [detectedUser, setDetectedUser] = useState<User | undefined>(undefined);

  // Status messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Auto-redirect already authenticated users based on role
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const destination = resolveMatchedRedirect(user, redirectPath);
      router.push(destination);
    }
  }, [redirectPath, router]);

  // 2. Real-time role detection as user enters their email
  useEffect(() => {
    if (email.trim().length >= 3) {
      const found = findUserByEmail(email);
      setDetectedUser(found);
    } else {
      setDetectedUser(undefined);
    }
  }, [email]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = loginUser(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed. Please check your credentials.');
    } else if (res.user) {
      const matched = getMatchingPortal(res.user);
      const destination = resolveMatchedRedirect(res.user, redirectPath);

      setSuccessMsg(
        `✓ Authentication Successful (${res.user.role.toUpperCase()})! Welcome back, ${res.user.name}. Landing on Operations Dashboard...`
      );
      setTimeout(() => {
        router.push(destination);
      }, 500);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = signupUser({
      name: signupName,
      email: signupEmail,
      company: signupCompany,
      phone: signupPhone,
      password: signupPassword,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to create account.');
      return;
    }

    // Call Cloudflare API to register merchant email in D1, Cloudflare Email Routing & dispatch welcome email with credentials
    let cfNote = '';
    try {
      const cfRes = await fetch('/api/register-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail.trim(),
          name: signupName.trim(),
          company: signupCompany.trim(),
          phone: signupPhone.trim(),
          password: signupPassword,
        }),
      });
      const cfData = (await cfRes.json()) as any;
      if (cfData?.message) {
        cfNote = ` ${cfData.message}`;
      }
    } catch {
      // Non-blocking
    }

    if (res.user) {
      const destination = resolveMatchedRedirect(res.user, redirectPath);
      setSuccessMsg(
        `✓ Merchant account registered successfully! Login details & direct links dispatched to ${signupEmail}. (Daily operational cycle resets at 6:00 PM NPT).${cfNote} Redirecting to your portal...`
      );
      setTimeout(() => {
        router.push(destination);
      }, 2500);
    }
  };

  return (
    <div style={{ padding: '3.5rem 0 6rem 0' }}>
      <div className="container-narrow">
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="badge badge-orange" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={13} /> DOUBLE 7 AUTHENTICATION
          </div>
          <h1 style={{ fontSize: '2.4rem' }}>Login</h1>
          <p style={{ maxWidth: '520px', margin: '0.5rem auto 0 auto', color: 'var(--text-secondary)' }}>
            Enter your credentials. Your account role (Merchant or Admin) is automatically detected to direct you to your portal.
          </p>
        </div>

        {/* Main Form Glass Panel */}
        <div className="glass-panel" style={{ maxWidth: '540px', margin: '0 auto', padding: '2.5rem' }}>
          {/* Sub-tabs: Login vs Register */}
          <div className="tab-list" style={{ marginBottom: '1.75rem' }}>
            <button
              type="button"
              onClick={() => { setAuthTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`tab-btn ${authTab === 'signin' ? 'active' : ''}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`tab-btn ${authTab === 'signup' ? 'active' : ''}`}
            >
              Register Merchant
            </button>
          </div>

          {/* Real-time Dynamic Role Detection Badge */}
          {authTab === 'signin' && detectedUser && (
            <div style={{
              background: detectedUser.role === 'admin'
                ? 'rgba(255, 102, 0, 0.12)'
                : 'rgba(6, 182, 212, 0.12)',
              border: detectedUser.role === 'admin'
                ? '1px solid rgba(255, 102, 0, 0.4)'
                : '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              animation: 'fadeIn 0.25s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {detectedUser.role === 'admin' ? (
                  <ShieldCheck size={18} color="var(--brand-orange)" />
                ) : (
                  <Truck size={18} color="var(--brand-cyan)" />
                )}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: detectedUser.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-cyan)' }}>
                    ROLE DETECTED: {detectedUser.role.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#ffffff' }}>
                    {detectedUser.name} &bull; <span style={{ color: 'var(--text-secondary)' }}>{detectedUser.company}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#ffffff', background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                <span>Routes to:</span>
                <strong style={{ color: detectedUser.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-cyan)' }}>
                  {detectedUser.role === 'admin' ? '/admin' : '/merchant'}
                </strong>
                <ArrowRight size={12} />
              </div>
            </div>
          )}

          {/* Feedback alerts */}
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={17} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={17} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= TAB 1: LOGIN ================= */}
          {authTab === 'signin' ? (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email address"
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                <LogIn size={16} />
                <span>Login</span>
                <ArrowRight size={16} />
              </button>

              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Quick Access Profiles (1-Click)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setEmail('anil@double7.com.np'); setPassword('password123'); }}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.45rem 0.6rem', justifyContent: 'flex-start', border: '1px solid rgba(255,102,0,0.3)' }}
                  >
                    <ShieldCheck size={13} color="var(--brand-orange)" />
                    <span style={{ color: '#ffffff' }}>Anil (Admin HQ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('soben@double7.com'); setPassword('password123'); }}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.45rem 0.6rem', justifyContent: 'flex-start', border: '1px solid rgba(255,102,0,0.3)' }}
                  >
                    <ShieldCheck size={13} color="var(--brand-orange)" />
                    <span style={{ color: '#ffffff' }}>Soben (Super Admin)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('merchant@double7.com.np'); setPassword('password123'); }}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.45rem 0.6rem', justifyContent: 'flex-start', border: '1px solid rgba(6,182,212,0.3)' }}
                  >
                    <Truck size={13} color="var(--brand-cyan)" />
                    <span style={{ color: '#ffffff' }}>Nepal Merchant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('pradeep.ops@double7.com'); setPassword('password123'); }}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.45rem 0.6rem', justifyContent: 'flex-start', border: '1px solid rgba(16,185,129,0.3)' }}
                  >
                    <Users size={13} color="var(--brand-emerald)" />
                    <span style={{ color: '#ffffff' }}>Pradeep (Hub Ops)</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ================= TAB 2: REGISTER MERCHANT ================= */
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Company / Shop Name</label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={signupCompany}
                    onChange={(e) => setSignupCompany(e.target.value)}
                    placeholder="e.g. Pokhara Electronics Hub"
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Authorized Representative Full Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Pradeep Gurung"
                  className="input-field"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Business Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="pradeep@business.np"
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Nepal Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+977 98000 00000"
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                <span>Register Merchant &amp; Login</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '6rem 0', textAlign: 'center' }}>Loading login...</div>}>
      <LoginContent />
    </Suspense>
  );
}

