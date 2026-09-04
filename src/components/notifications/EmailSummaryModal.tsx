'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  X,
  Sparkles,
  Truck,
  Banknote,
  Bell,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';
import { subscribeTo24hSummary, EmailNotificationSubscription } from '../../lib/notifications';
import { getShipments } from '../../lib/store';

interface EmailSummaryModalProps {
  initialEmail?: string;
  role?: 'merchant' | 'admin' | 'consignee';
  associatedTrackingId?: string;
  onClose: () => void;
}

export default function EmailSummaryModal({
  initialEmail = '',
  role = 'merchant',
  associatedTrackingId,
  onClose,
}: EmailSummaryModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [frequency, setFrequency] = useState<'24h' | 'instant'>('24h');
  const [includeDispatches, setIncludeDispatches] = useState(true);
  const [includeCodReport, setIncludeCodReport] = useState(true);
  const [includeExceptions, setIncludeExceptions] = useState(true);

  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [previewTemplate, setPreviewTemplate] = useState<'24h_summary' | 'merchant_welcome'>('24h_summary');
  const [isSaved, setIsSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [welcomeTestSent, setWelcomeTestSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const shipments = getShipments();
  const activeCount = shipments.filter(s => s.status !== 'Delivered').length;
  const deliveredCount = shipments.filter(s => s.status === 'Delivered').length;

  const [isSending, setIsSending] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid Gmail / email address.');
      return;
    }

    try {
      setIsSending(true);
      subscribeTo24hSummary({
        email,
        role,
        frequency,
        includeDispatches,
        includeCodReport,
        includeExceptions,
        associatedTrackingId,
      });

      // Dispatch real summary email immediately
      try {
        await fetch('/api/send-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            role,
            trackingId: associatedTrackingId,
            type: '24h_summary',
            subject: associatedTrackingId
              ? `[Double 7] Waybill & Dispatch Notice: ${associatedTrackingId}`
              : `[Double 7] 24-Hour Operations & COD Summary Activated • Daily Reset 6:00 PM (${email.trim()})`,
          }),
        });
      } catch {
        // Non-blocking network catch
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save subscription.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTest = async (sendType: '24h_summary' | 'merchant_welcome' = '24h_summary') => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter your Gmail / email address first.');
      return;
    }
    setErrorMessage('');
    setIsSending(true);
    try {
      // Auto-register to ensure address is submitted to Cloudflare Email Routing
      try {
        await fetch('/api/register-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), name: 'Valued Merchant Partner' }),
        });
      } catch {
        // non-blocking
      }

      const res = await fetch('/api/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role,
          trackingId: associatedTrackingId,
          type: sendType,
          name: email.split('@')[0],
          company: 'Nepal Merchant Commerce Pvt Ltd',
          password: '•••••••• (Your Chosen Secure Password)',
          subject: sendType === 'merchant_welcome'
            ? `🎉 Welcome to Double 7 Logistics • Merchant Account Activated & Login Credentials`
            : associatedTrackingId
            ? `[Double 7] Consignment Tracking Summary: ${associatedTrackingId}`
            : `[Double 7] 24-Hour Operations & COD Summary Report • Daily Reset: 6:00 PM NPT`,
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.message || 'Failed to dispatch email.');
      }
      if (sendType === 'merchant_welcome') {
        setWelcomeTestSent(true);
        setTimeout(() => setWelcomeTestSent(false), 4500);
      } else {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 4500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to connect to email gateway.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1.25rem',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '680px',
        width: '100%',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 102, 0, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        position: 'relative',
        margin: 'auto'
      }}>
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(255, 102, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-orange)',
            border: '1px solid rgba(255, 102, 0, 0.3)'
          }}>
            <Mail size={22} />
          </div>
          <div>
            <div className="badge badge-orange" style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }}>
              24H DASHBOARD UPDATES • DAILY RESET AT 6:00 PM NPT
            </div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
              24-Hour Operations & COD Summary
            </h2>
          </div>
        </div>

        {/* Navigation Tabs (Settings vs Email Preview) */}
        <div className="tab-list" style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          >
            <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
            <span>Notification Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          >
            <Eye size={14} style={{ display: 'inline', marginRight: '5px' }} />
            <span>Live Gmail Preview</span>
          </button>
        </div>

        {/* TAB 1: Configuration Form */}
        {activeTab === 'config' && (
          <form onSubmit={handleSubscribe}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
              border: '1px solid rgba(255, 102, 0, 0.35)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              fontSize: '0.86rem',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-orange)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.78rem' }}>
                ⏰ 24-Hour Cycle &bull; Daily Reset at 6:00 PM (18:00 NPT)
              </div>
              <div style={{ color: '#e2e8f0' }}>
                Double 7 Logistics dashboard updates continuously every 24 hours. The official daily operational cycle and dispatch manifests <strong>reset promptly at 6:00 PM Nepal Time</strong>. Consignments booked before 6:00 PM depart on same-day night linehauls, and COD remittances are locked for morning bank payouts.
              </div>
            </div>

            {errorMessage && (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            {isSaved && (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--brand-emerald)',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <CheckCircle2 size={16} />
                <span>24-Hour Gmail notification schedule successfully activated!</span>
              </div>
            )}

            {testSent && (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: 'var(--brand-cyan)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <Send size={15} />
                <span>Sample 24-Hour Summary (6:00 PM Reset) dispatched to <strong>{email}</strong>! Check Gmail.</span>
              </div>
            )}

            {welcomeTestSent && (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--brand-emerald)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <CheckCircle2 size={15} />
                <span>Sample Merchant Registration & Login Details dispatched to <strong>{email}</strong>! Check Gmail.</span>
              </div>
            )}

            {/* Email Address Input */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">Your Gmail / Corporate Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--brand-orange)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {/* Frequency Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Dispatch Notification Schedule
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div
                  onClick={() => setFrequency('24h')}
                  style={{
                    border: frequency === '24h' ? '2px solid var(--brand-orange)' : '1px solid var(--border-subtle)',
                    background: frequency === '24h' ? 'rgba(255, 102, 0, 0.1)' : 'var(--bg-card)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={15} color="var(--brand-orange)" />
                    <span>Every 24 Hours</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Daily reset & recap at 6:00 PM NPT
                  </div>
                </div>

                <div
                  onClick={() => setFrequency('instant')}
                  style={{
                    border: frequency === 'instant' ? '2px solid var(--brand-orange)' : '1px solid var(--border-subtle)',
                    background: frequency === 'instant' ? 'rgba(255, 102, 0, 0.1)' : 'var(--bg-card)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Bell size={15} color="var(--brand-cyan)" />
                    <span>Real-time + 24h Digest</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Instant dispatch alerts + 6:00 PM summary
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist items to include */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeDispatches}
                  onChange={(e) => setIncludeDispatches(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand-orange)' }}
                />
                <span>Include 24-hr consignment linehaul dispatch list &amp; transit statuses</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeCodReport}
                  onChange={(e) => setIncludeCodReport(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand-emerald)' }}
                />
                <span>Include Cash on Delivery (COD) collection &amp; bank remittance breakdown</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeExceptions}
                  onChange={(e) => setIncludeExceptions(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand-amber)' }}
                />
                <span>Include highway weather alerts &amp; Prithvi corridor transit telemetry</span>
              </label>
            </div>

            {/* Actions & Sample Test Triggers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleSendTest('24h_summary')}
                  disabled={isSending}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem', borderColor: 'var(--brand-orange)', color: '#ffffff' }}
                >
                  <Send size={12} className={isSending ? 'animate-spin' : ''} />
                  <span>{isSending ? 'Sending...' : 'Test 24h Summary (6 PM Reset)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendTest('merchant_welcome')}
                  disabled={isSending}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem', borderColor: 'var(--brand-emerald)', color: '#ffffff' }}
                >
                  <Sparkles size={12} color="var(--brand-emerald)" />
                  <span>Test Merchant Login Email</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  <CheckCircle2 size={14} />
                  <span>{isSending ? 'Activating...' : 'Activate 24-Hour Digest'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Live HTML Gmail Preview */}
        {activeTab === 'preview' && (
          <div>
            {/* Template Toggle Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setPreviewTemplate('24h_summary')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: previewTemplate === '24h_summary' ? '1px solid var(--brand-orange)' : '1px solid var(--border-subtle)',
                  background: previewTemplate === '24h_summary' ? 'rgba(255, 102, 0, 0.15)' : 'var(--bg-card)',
                  color: previewTemplate === '24h_summary' ? 'var(--brand-orange)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                24-Hour Operations Summary (Reset 6 PM)
              </button>
              <button
                type="button"
                onClick={() => setPreviewTemplate('merchant_welcome')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: previewTemplate === 'merchant_welcome' ? '1px solid var(--brand-emerald)' : '1px solid var(--border-subtle)',
                  background: previewTemplate === 'merchant_welcome' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                  color: previewTemplate === 'merchant_welcome' ? 'var(--brand-emerald)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Merchant Registration &amp; Login Details
              </button>
            </div>

            {/* PREVIEW 1: 24-Hour Operations Summary */}
            {previewTemplate === '24h_summary' && (
              <div style={{
                background: '#0b1120',
                color: '#f8fafc',
                borderRadius: '12px',
                padding: '1.5rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                border: '1px solid rgba(255, 102, 0, 0.35)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                fontSize: '0.88rem',
                lineHeight: '1.5'
              }}>
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #ff6600 0%, #ea580c 100%)',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>DOUBLE 7 LOGISTICS</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.9)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      National Express &bull; Kathmandu HQ
                    </div>
                  </div>
                  <span style={{ background: 'rgba(0,0,0,0.3)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
                    24H SUMMARY &bull; RESET 6 PM
                  </span>
                </div>

                {/* Salutation */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Hello <strong>{email || 'merchant@store.np'}</strong>,</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                    Full 24-Hour Operations &amp; COD Summary Report
                  </div>
                </div>

                {/* 24-Hour Updates & 6 PM Reset Alert */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.18) 0%, rgba(234, 88, 12, 0.08) 100%)',
                  border: '1px solid rgba(255, 102, 0, 0.45)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '1.25rem',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ fontWeight: 800, color: '#ff8533', textTransform: 'uppercase', fontSize: '0.74rem', marginBottom: '3px' }}>
                    ⏰ 24-Hour Dashboard Updates &bull; Daily Reset at 6:00 PM NPT
                  </div>
                  <div style={{ color: '#e2e8f0', lineHeight: '1.5' }}>
                    All metrics update continuously across every 24-hour cycle. <strong>The official operational manifest resets every evening at 6:00 PM (18:00 NPT)</strong>. Bookings before 6:00 PM depart on the night linehaul fleet across 77 districts, and COD proceeds finalize for morning settlement.
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#16223e', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ff8533' }}>{activeCount}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Active In-Transit</div>
                  </div>
                  <div style={{ background: '#16223e', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>6:00 PM</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Daily Reset Cutoff</div>
                  </div>
                  <div style={{ background: '#16223e', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#22d3ee' }}>Rs. 45,200</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>COD Remitted (NPR)</div>
                  </div>
                </div>

                {/* Action CTA */}
                <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                  <a
                    href="/dashboard"
                    target="_blank"
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #ff6600 0%, #ea580c 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      padding: '10px 22px',
                      textDecoration: 'none',
                      borderRadius: '6px'
                    }}
                  >
                    Open Live Operations Dashboard &rarr;
                  </a>
                </div>
              </div>
            )}

            {/* PREVIEW 2: Merchant Welcome & Login Credentials */}
            {previewTemplate === 'merchant_welcome' && (
              <div style={{
                background: '#0b1120',
                color: '#f8fafc',
                borderRadius: '12px',
                padding: '1.5rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                fontSize: '0.88rem',
                lineHeight: '1.5'
              }}>
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #ff6600 0%, #ea580c 100%)',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>DOUBLE 7 LOGISTICS</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.9)', textTransform: 'uppercase' }}>
                      Merchant Account Provisioning
                    </div>
                  </div>
                  <span style={{ background: 'rgba(0,0,0,0.3)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
                    REGISTRATION CONFIRMED
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Dear <strong>{email ? email.split('@')[0] : 'Nepal Merchant'}</strong>,</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                    🎉 Your Merchant Account is Successfully Registered!
                  </div>
                </div>

                {/* Login Credentials Box */}
                <div style={{
                  background: '#10192e',
                  border: '1px solid rgba(255, 102, 0, 0.35)',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '1.25rem',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ fontWeight: 800, color: '#ff8533', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    🔐 Your Merchant Portal Login Details
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '5px 0', color: '#94a3b8' }}>Login Portal URL:</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#38bdf8', fontWeight: 700 }}>
                          https://sobinupreti.com.np/login
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '5px 0', color: '#94a3b8' }}>Username / Email:</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#ffffff', fontWeight: 700, fontFamily: 'monospace' }}>
                          {email || 'merchant@store.np'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '5px 0', color: '#94a3b8' }}>Password:</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>
                          •••••••• (Chosen at registration)
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 0', color: '#94a3b8' }}>Role Tier:</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#ff8533', fontWeight: 700 }}>
                          Merchant Shipper (Active)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 24-Hour Cycle & 6 PM Reset Box */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
                  border: '1px solid rgba(255, 102, 0, 0.35)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                  color: '#e2e8f0'
                }}>
                  <strong>⏰ Daily Operations:</strong> The merchant dashboard updates in real-time. Daily operational cycles reset at <strong>6:00 PM (18:00 NPT)</strong>. Bookings before 6:00 PM depart same-day across 77 districts.
                </div>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <a
                    href="/login"
                    target="_blank"
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #ff6600 0%, #ea580c 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      padding: '10px 24px',
                      textDecoration: 'none',
                      borderRadius: '6px'
                    }}
                  >
                    Log In to Merchant Dashboard &rarr;
                  </a>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className="btn btn-primary btn-sm"
              >
                <span>Back to Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
