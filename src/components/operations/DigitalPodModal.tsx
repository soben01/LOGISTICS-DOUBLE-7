'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  PenTool,
  RotateCcw,
  Banknote,
  Clock,
  User,
  MapPin,
  Calendar,
  X
} from 'lucide-react';
import { Shipment } from '../../lib/store';
import {
  getOrCreateDeliveryOtp,
  completeDeliveryWithPod,
  recordDeliveryAttemptFailure,
  ProofOfDeliveryRecord
} from '../../lib/pod';
import { playScanBeep, playErrorBuzz, playDispatchFanfare } from '../../lib/soundFx';

interface Props {
  shipment: Shipment;
  branchCode: string;
  onClose: () => void;
  onSuccess: (record: ProofOfDeliveryRecord) => void;
}

export default function DigitalPodModal({ shipment, branchCode, onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<'success_pod' | 'ndr_failure'>('success_pod');
  
  // OTP Verification
  const expectedOtp = getOrCreateDeliveryOtp(shipment.id);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Recipient & Rider Info
  const [recipientName, setRecipientName] = useState(shipment.recipient.name || '');
  const [recipientPhone, setRecipientPhone] = useState(shipment.recipient.phone || '');
  const [riderName, setRiderName] = useState('Suman Gurung (Rider #R-41)');
  const [riderPhone, setRiderPhone] = useState('+977 98410 99887');
  const [deliveryNotes, setDeliveryNotes] = useState('Handed over at recipient front entrance.');

  // COD Collection
  const codDue = shipment.codAmount || 0;
  const [codCollected, setCodCollected] = useState(codDue);
  const [cashTendered, setCashTendered] = useState(codDue);

  // NDR Form
  const [ndrReason, setNdrReason] = useState('Customer Phone Unreachable / Switched Off');
  const [reattemptDate, setReattemptDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [ndrNotes, setNdrNotes] = useState('Called recipient 3 times. No answer. Scheduled next attempt.');

  // Canvas E-Signature Pad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8'; // brand cyan
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleCompleteDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    let signatureData: string | undefined = undefined;
    if (canvasRef.current && hasSignature) {
      signatureData = canvasRef.current.toDataURL('image/png');
    }

    const res = completeDeliveryWithPod({
      bookingId: shipment.id,
      recipientName,
      recipientPhone,
      enteredOtp,
      signatureDataUrl: signatureData,
      codCollected: Number(codCollected),
      riderName,
      riderPhone,
      branchCode,
      deliveryNotes,
    });

    if (!res.success) {
      playErrorBuzz();
      setOtpError(res.error || 'OTP verification failed');
      return;
    }

    playDispatchFanfare();
    if (res.record) {
      onSuccess(res.record);
    }
  };

  const handleRecordFailure = (e: React.FormEvent) => {
    e.preventDefault();
    playScanBeep(600, 0.15);

    const res = recordDeliveryAttemptFailure({
      bookingId: shipment.id,
      reason: ndrReason,
      riderName,
      branchCode,
      reattemptDate,
      notes: ndrNotes,
    });

    onSuccess(res.record);
  };

  const returnChange = Math.max(0, cashTendered - codCollected);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#090d16',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.15)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to right, rgba(56, 189, 248, 0.08), transparent)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}>
                LAST-MILE POD ENGINE
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Station: {branchCode}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Digital Handover & Proof of Delivery
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              AWB #{shipment.id} • Destination: {shipment.destination.city}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          padding: '0.75rem 1.5rem',
          gap: '0.75rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('success_pod')}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '10px',
              border: activeTab === 'success_pod' ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid transparent',
              background: activeTab === 'success_pod' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'success_pod' ? '#34d399' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={16} />
            Recipient Handover (OTP & Signature)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ndr_failure')}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '10px',
              border: activeTab === 'ndr_failure' ? '1px solid rgba(248, 113, 113, 0.4)' : '1px solid transparent',
              background: activeTab === 'ndr_failure' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'ndr_failure' ? '#f87171' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <AlertTriangle size={16} />
            Non-Delivery Report (NDR Reattempt)
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {activeTab === 'success_pod' ? (
            <form onSubmit={handleCompleteDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Step 1: OTP Verification */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Smartphone size={15} /> Step 1: Customer Delivery OTP Verification
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEnteredOtp(expectedOtp);
                      playScanBeep(1800, 0.05);
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '6px',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      color: '#38bdf8',
                      cursor: 'pointer',
                    }}
                    title="Click to fill SMS OTP for testing"
                  >
                    Auto-Fill SMS Code: {expectedOtp}
                  </button>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.6rem 0' }}>
                  Ask the recipient for the 4-digit code dispatched to their phone ({shipment.recipient.phone}).
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="ENTER 4-DIGIT OTP"
                    value={enteredOtp}
                    onChange={e => setEnteredOtp(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: otpError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '0.65rem 1rem',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      letterSpacing: '0.25em',
                      textAlign: 'center',
                      color: '#38bdf8',
                    }}
                    required
                  />
                  {enteredOtp.trim() === expectedOtp && (
                    <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={16} /> OTP Match!
                    </span>
                  )}
                </div>
                {otpError && (
                  <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: 600 }}>
                    {otpError}
                  </div>
                )}
              </div>

              {/* Step 2: Recipient Signature Pad */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <PenTool size={15} /> Step 2: Digital Signature Pad (Sign Below)
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <RotateCcw size={12} /> Clear Signature
                  </button>
                </div>
                <div style={{
                  border: '1px dashed rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'crosshair',
                  height: '110px'
                }}>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  />
                  {!hasSignature && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255, 255, 255, 0.2)',
                      fontSize: '0.85rem',
                      fontStyle: 'italic'
                    }}>
                      Recipient signs here with finger or mouse
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Cash On Delivery (COD) Breakdown */}
              {codDue > 0 ? (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '12px',
                  padding: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <Banknote size={16} /> Step 3: Cash on Delivery Collection (NPR {codDue.toLocaleString()})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>COD Amount To Collect</span>
                      <input
                        type="number"
                        value={codCollected}
                        onChange={e => setCodCollected(Number(e.target.value))}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          color: '#fbbf24',
                          fontWeight: 700
                        }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Customer Cash Handed</span>
                      <input
                        type="number"
                        value={cashTendered}
                        onChange={e => setCashTendered(Number(e.target.value))}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          color: '#fff',
                          fontWeight: 700
                        }}
                      />
                    </div>
                  </div>
                  {cashTendered > codCollected && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                      💵 Return Change to Customer: NPR {returnChange.toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: 'rgba(52, 211, 153, 0.05)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={16} /> Prepaid / Zero-COD Shipment. No cash collection required.
                </div>
              )}

              {/* Handover Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Received By (Person Name)</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Delivering Rider</label>
                  <input
                    type="text"
                    value={riderName}
                    onChange={e => setRiderName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  marginTop: '0.5rem'
                }}
              >
                <ShieldCheck size={18} />
                Confirm POD & Mark Delivered
              </button>
            </form>
          ) : (
            /* NDR Failure Form */
            <form onSubmit={handleRecordFailure} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '1rem',
              }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={15} /> Select Primary Non-Delivery Reason
                </label>
                <select
                  value={ndrReason}
                  onChange={e => setNdrReason(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0e1422',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="Customer Phone Unreachable / Switched Off">📵 Customer Phone Unreachable / Switched Off</option>
                  <option value="Customer Requested Delivery Reschedule">📅 Customer Requested Delivery Reschedule</option>
                  <option value="Customer Not Available at Address / Door Closed">🚪 Customer Not Available at Address / Door Closed</option>
                  <option value="COD Cash Not Prepared by Recipient">💵 COD Cash Not Prepared by Recipient</option>
                  <option value="Customer Refused Parcel (Damaged / Changed Mind)">❌ Customer Refused Parcel (Damaged / Changed Mind)</option>
                  <option value="Incomplete / Inaccurate Street Address">🗺️ Incomplete / Inaccurate Street Address</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Scheduled Re-attempt Date</label>
                  <input
                    type="date"
                    value={reattemptDate}
                    onChange={e => setReattemptDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Reporting Rider</label>
                  <input
                    type="text"
                    value={riderName}
                    onChange={e => setRiderName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rider Incident Notes</label>
                <textarea
                  rows={3}
                  value={ndrNotes}
                  onChange={e => setNdrNotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                  placeholder="Record customer conversation, building security remarks, or street landmark details..."
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                  marginTop: '0.5rem'
                }}
              >
                <Clock size={18} />
                Schedule Re-attempt (NDR Exception)
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
