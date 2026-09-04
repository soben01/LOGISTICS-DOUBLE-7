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
  const [isSaved, setIsSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);
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
              : `[Double 7] 24-Hour Logistics & COD Operations Digest Activated (${email.trim()})`,
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

  const handleSendTest = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter your Gmail / email address first.');
      return;
    }
    setErrorMessage('');
    setIsSending(true);
    try {
      const res = await fetch('/api/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role,
          trackingId: associatedTrackingId,
          type: 'sample_summary',
          subject: associatedTrackingId
            ? `[Double 7] Consignment Tracking Summary: ${associatedTrackingId}`
            : `[Double 7] Sample 24-Hour Logistics & COD Digest (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`,
        }),
      });
      const data = await res.json() as any;
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to dispatch email.');
      }
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
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
              AUTOMATED EMAIL DIGEST
            </div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
              24-Hour Gmail Logistics Summary
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
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Receive an automated 24-hour executive email summary directly to your Gmail inbox every morning at <strong>08:00 NPT</strong>. Includes all active linehauls, delivered parcels, and COD remittance accounting.
            </p>

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
                <span>Sample 24-hour summary dispatched to <strong>{email}</strong>! Check inbox.</span>
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
                    Daily recap at 08:00 NPT morning
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
                    Instant alerts on delivery + 24h summary
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
                <span>Include highway weather alerts &amp; Prithvi corridor transit delays</span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSending}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.8rem' }}
              >
                <Send size={13} className={isSending ? 'animate-spin' : ''} />
                <span>{isSending ? 'Dispatching...' : testSent ? 'Sample Sent to Gmail!' : 'Send Sample 24h Summary'}</span>
              </button>

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
                  <span>{isSending ? 'Activating & Sending...' : 'Activate 24-Hour Gmail Digest'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Live HTML Gmail Preview */}
        {activeTab === 'preview' && (
          <div>
            <div style={{
              background: '#ffffff',
              color: '#1f2937',
              borderRadius: '8px',
              padding: '1.5rem',
              fontFamily: 'Arial, sans-serif',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              fontSize: '0.88rem',
              lineHeight: '1.4'
            }}>
              {/* Fake Gmail Top metadata */}
              <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>
                  [Double 7] Daily 24-Hour Logistics &amp; COD Summary &bull; Morning Report
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem' }}>
                  From: <strong>Double 7 Dispatch Center</strong> &lt;dispatch@double7.com&gt;
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  To: <strong>{email || 'your-gmail@gmail.com'}</strong> &bull; Schedule: Every 24 Hours (08:00 NPT)
                </div>
              </div>

              {/* Email Content Body */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem',
                borderLeft: '4px solid #ea580c'
              }}>
                <div style={{ fontWeight: 700, color: '#ea580c', fontSize: '0.95rem' }}>
                  Good morning! Here is your 24-Hour Double 7 Network Digest:
                </div>
                <div style={{ color: '#4b5563', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Reporting Period: Past 24 Hours across Kathmandu, Pokhara, Birgunj &amp; 77 Districts
                </div>
              </div>

              {/* 24-hr Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ea580c' }}>{activeCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase' }}>Active In-Transit</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>{deliveredCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase' }}>Delivered Past 24h</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0284c7' }}>Rs. 45,200</div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase' }}>COD Remitted (NPR)</div>
                </div>
              </div>

              {/* Sample Consignment Table */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '0.5rem 0.6rem' }}>Waybill Code</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>Route</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>Status</th>
                      <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>COD Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.slice(0, 3).map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.5rem 0.6rem', fontWeight: 700, color: '#ea580c' }}>{s.id}</td>
                        <td style={{ padding: '0.5rem 0.6rem' }}>{s.origin.city} &rarr; {s.destination.city}</td>
                        <td style={{ padding: '0.5rem 0.6rem' }}>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 700 }}>
                          Rs. {(s.cargo.declaredValueNpr || 2500).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                Double 7 Logistics Nepal &bull; 24/7 Automated Telemetry Hub &bull; Kathmandu, Nepal
              </div>
            </div>

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
