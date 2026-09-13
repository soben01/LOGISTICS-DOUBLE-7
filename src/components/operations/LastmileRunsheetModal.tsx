'use client';

import React, { useState } from 'react';
import {
  X,
  Truck,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  DollarSign,
  PenTool,
  Check
} from 'lucide-react';
import { Shipment, updateShipmentStatus } from '../../lib/store';

interface LastmileRunsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: Shipment[];
  onUpdated: () => void;
  activeCity?: string;
}

const FLEET_RIDERS = [
  { id: 'RDR-01', name: 'Bikash Thapa', phone: '+977 98111 22334', vehicle: 'EV Bike (BA-99-PA-1204)', area: 'Kathmandu Core / Thamel / New Road' },
  { id: 'RDR-02', name: 'Ram Kumar Shrestha', phone: '+977 98412 34567', vehicle: 'Cargo Van (BA-02-CHA-5512)', area: 'Lalitpur / Patan / Pulchowk' },
  { id: 'RDR-03', name: 'Sujan Tamang', phone: '+977 98601 99882', vehicle: 'Motorcycle (BA-85-PA-4421)', area: 'Bhaktapur / Suryabinayak / Thimi' },
  { id: 'RDR-04', name: 'Deepak Adhikari', phone: '+977 98012 33445', vehicle: 'EV Scooter (GA-12-PA-8890)', area: 'Pokhara Lakeside / Mahendrapool' },
  { id: 'RDR-05', name: 'Rohan Chaudhary', phone: '+977 98188 55443', vehicle: 'Express Van (NA-04-CHA-1122)', area: 'Birgunj & Parsa Commercial Corridor' },
];

export default function LastmileRunsheetModal({
  isOpen,
  onClose,
  shipments,
  onUpdated,
  activeCity = 'Kathmandu'
}: LastmileRunsheetModalProps) {
  const [selectedRiderId, setSelectedRiderId] = useState(FLEET_RIDERS[0].id);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<string>>(new Set());
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [mode, setMode] = useState<'create_runsheet' | 'pod_closure'>('create_runsheet');
  
  // POD Closure state
  const [podShipment, setPodShipment] = useState<Shipment | null>(null);
  const [receivedByName, setReceivedByName] = useState('');
  const [podSignature, setPodSignature] = useState('');
  const [collectedCash, setCollectedCash] = useState('0');
  const [closureStatus, setClosureStatus] = useState<'Delivered' | 'Reattempt Scheduled' | 'Exception'>('Delivered');
  const [exceptionReason, setExceptionReason] = useState('');

  if (!isOpen) return null;

  const eligibleShipments = shipments.filter(s =>
    s.status === 'Hub Received' ||
    s.status === 'Origin Hub Inwarded' ||
    s.status === 'Customs Cleared' ||
    s.status === 'Order Placed' ||
    s.status === 'In Transit'
  );

  const outForDeliveryShipments = shipments.filter(s => s.status === 'Out for Delivery');

  const selectedRider = FLEET_RIDERS.find(r => r.id === selectedRiderId) || FLEET_RIDERS[0];

  const handleToggleSelect = (id: string) => {
    setSelectedShipmentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedShipmentIds.size === eligibleShipments.length) {
      setSelectedShipmentIds(new Set());
    } else {
      setSelectedShipmentIds(new Set(eligibleShipments.map(s => s.id)));
    }
  };

  const handleDispatchRunsheet = () => {
    if (selectedShipmentIds.size === 0) {
      alert('Please select at least 1 shipment to assign to the rider runsheet.');
      return;
    }

    selectedShipmentIds.forEach(id => {
      updateShipmentStatus(
        id,
        'Out for Delivery',
        `${activeCity} Lastmile Hub`,
        `Dispatched Out for Delivery with Rider ${selectedRider.name} (${selectedRider.phone}). Handheld runsheet active.`
      );
    });

    setDispatchSuccess(true);
    onUpdated();
    setTimeout(() => {
      setDispatchSuccess(false);
      setSelectedShipmentIds(new Set());
    }, 2500);
  };

  const handleCompletePod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podShipment) return;

    if (closureStatus === 'Delivered') {
      const updated = updateShipmentStatus(
        podShipment.id,
        'Delivered',
        `${podShipment.destination.city} Customer Handover`,
        `Delivered directly to ${receivedByName || podShipment.recipient.name}. COD collected: Rs. ${collectedCash}. Electronic POD signature verified: ${podSignature || 'Customer Direct OTP/Handshake'}.`
      );
      if (updated) {
        updated.proofOfDelivery = {
          deliveredAt: new Date().toLocaleString(),
          receivedBy: receivedByName.trim() || podShipment.recipient.name,
          signatureText: podSignature.trim() || `${podShipment.recipient.name} (Direct Signature)`,
        };
      }
    } else {
      updateShipmentStatus(
        podShipment.id,
        closureStatus === 'Reattempt Scheduled' ? 'Order Placed' : 'Order Placed',
        `${podShipment.destination.city} Hub`,
        `Delivery attempt failed: ${exceptionReason || 'Customer unavailable / Door locked'}. Reattempt queued.`
      );
    }

    onUpdated();
    setPodShipment(null);
  };

  const totalCodOnRunsheet = eligibleShipments
    .filter(s => selectedShipmentIds.has(s.id))
    .reduce((sum, s) => sum + (s.codAmount || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 12, 10, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#0a1612',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Lastmile Delivery Runsheet &amp; Rider POD
                </h2>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  fontWeight: 800
                }}>
                  LASTMILE
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.15rem' }}>
                Assign deliveries to local couriers, dispatch runsheets, and record Proof of Delivery (POD).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '0.2rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                type="button"
                onClick={() => setMode('create_runsheet')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: mode === 'create_runsheet' ? '#10b981' : 'transparent',
                  color: mode === 'create_runsheet' ? '#042f1f' : 'var(--text-secondary)'
                }}
              >
                1. Dispatch Runsheet
              </button>
              <button
                type="button"
                onClick={() => setMode('pod_closure')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: mode === 'pod_closure' ? '#10b981' : 'transparent',
                  color: mode === 'pod_closure' ? '#042f1f' : 'var(--text-secondary)'
                }}
              >
                2. POD Delivery Closure ({outForDeliveryShipments.length})
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '8px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {mode === 'create_runsheet' ? (
            <>
              {/* Rider Selector Box */}
              <div style={{
                padding: '1.2rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    SELECT DELIVERY RIDER / COURIER
                  </label>
                  <select
                    value={selectedRiderId}
                    onChange={e => setSelectedRiderId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: '#0c1a15',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    {FLEET_RIDERS.map(rider => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name} ({rider.area})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assigned Courier Unit:</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#34d399', marginTop: '0.15rem' }}>
                    {selectedRider.vehicle}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Phone: {selectedRider.phone}
                  </div>
                </div>
              </div>

              {/* Success Banner */}
              {dispatchSuccess && (
                <div style={{
                  padding: '0.85rem 1.2rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}>
                  <CheckCircle2 size={18} />
                  <span>✓ Runsheet successfully generated! Shipments dispatched Out for Delivery.</span>
                </div>
              )}

              {/* Shipment Selection Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Select Parcels to Assign ({selectedShipmentIds.size} of {eligibleShipments.length} selected)
                  </span>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700 }}>
                      Runsheet COD Total: Rs. {totalCodOnRunsheet.toLocaleString()} NPR
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      style={{ fontSize: '0.72rem', color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {selectedShipmentIds.size === eligibleShipments.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <div style={{
                  maxHeight: '280px',
                  overflowY: 'auto',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)'
                }}>
                  {eligibleShipments.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No unassigned parcels available for delivery dispatch. Create new bookings from Reception or inward packages at Branch Hub.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.6rem 0.8rem', width: '30px' }}>✓</th>
                          <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>AWB</th>
                          <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Consignee &amp; Phone</th>
                          <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Delivery Address</th>
                          <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>COD (NPR)</th>
                          <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eligibleShipments.map(s => {
                          const isChecked = selectedShipmentIds.has(s.id);
                          return (
                            <tr
                              key={s.id}
                              onClick={() => handleToggleSelect(s.id)}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                cursor: 'pointer'
                              }}
                            >
                              <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  style={{ accentColor: '#10b981' }}
                                />
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                                {s.id}
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem' }}>
                                <div style={{ color: '#ffffff', fontWeight: 600 }}>{s.recipient.name}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{s.recipient.phone}</div>
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)' }}>
                                {s.recipient.address}, {s.destination.city}
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 700, color: s.codAmount ? '#fbbf24' : 'var(--text-muted)' }}>
                                {s.codAmount ? `Rs. ${s.codAmount.toLocaleString()}` : 'Prepaid'}
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem' }}>
                                <span style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.7rem'
                                }}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* POD Closure Mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Packages currently Out for Delivery with couriers. Click <strong>Record POD</strong> to mark delivered with consignee signature and cash collection.
              </div>

              {outForDeliveryShipments.length === 0 ? (
                <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No shipments are currently marked Out for Delivery. Use &quot;Dispatch Runsheet&quot; first.
                </div>
              ) : (
                <div style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>AWB</th>
                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Recipient</th>
                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Address</th>
                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>COD Due</th>
                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outForDeliveryShipments.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                            {s.id}
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <div style={{ color: '#ffffff', fontWeight: 600 }}>{s.recipient.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{s.recipient.phone}</div>
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)' }}>
                            {s.recipient.address}
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 700, color: s.codAmount ? '#fbbf24' : '#10b981' }}>
                            {s.codAmount ? `Rs. ${s.codAmount.toLocaleString()}` : 'PAID'}
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setPodShipment(s);
                                setReceivedByName(s.recipient.name);
                                setCollectedCash(String(s.codAmount || 0));
                                setPodSignature('');
                              }}
                              className="btn btn-primary btn-sm"
                              style={{
                                backgroundColor: '#10b981',
                                borderColor: '#10b981',
                                color: '#042f1f',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '0.25rem 0.6rem'
                              }}
                            >
                              Record POD &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.2rem 1.5rem',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Selected: <strong style={{ color: '#10b981' }}>{selectedShipmentIds.size} Parcels</strong>
          </span>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm"
            >
              Close
            </button>

            {mode === 'create_runsheet' && (
              <button
                type="button"
                onClick={handleDispatchRunsheet}
                disabled={selectedShipmentIds.size === 0}
                className="btn btn-primary btn-sm"
                style={{
                  backgroundColor: '#10b981',
                  borderColor: '#10b981',
                  color: '#042f1f',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Truck size={15} />
                <span>Dispatch Rider Runsheet ({selectedShipmentIds.size})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modal for POD Closure */}
      {podShipment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#0a1612',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            padding: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                  Proof of Delivery (POD)
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#10b981', fontFamily: 'monospace' }}>
                  AWB: {podShipment.id}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPodShipment(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompletePod} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Delivery Status Outcome
                </label>
                <select
                  value={closureStatus}
                  onChange={e => setClosureStatus(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#0c1a15',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontWeight: 700
                  }}
                >
                  <option value="Delivered">✓ Successfully Delivered</option>
                  <option value="Reattempt Scheduled">⚠️ Reattempt Scheduled (Customer Not Home)</option>
                  <option value="Exception">❌ Exception / Address Not Found</option>
                </select>
              </div>

              {closureStatus === 'Delivered' ? (
                <>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Received By (Full Name)
                    </label>
                    <input
                      type="text"
                      value={receivedByName}
                      onChange={e => setReceivedByName(e.target.value)}
                      placeholder="Receiver name"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Digital Signature / Receiver Confirmation
                    </label>
                    <input
                      type="text"
                      value={podSignature}
                      onChange={e => setPodSignature(e.target.value)}
                      placeholder="e.g. R. Shrestha (Signed on Handheld)"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontStyle: 'italic'
                      }}
                      required
                    />
                  </div>

                  {podShipment.codAmount ? (
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800, display: 'block', marginBottom: '0.25rem' }}>
                        COD Cash Collected (NPR)
                      </label>
                      <input
                        type="number"
                        value={collectedCash}
                        onChange={e => setCollectedCash(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          fontSize: '0.88rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid #fbbf24',
                          color: '#fbbf24',
                          fontWeight: 800
                        }}
                        required
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#f87171', display: 'block', marginBottom: '0.25rem' }}>
                    Reason for Failure / Delay
                  </label>
                  <input
                    type="text"
                    value={exceptionReason}
                    onChange={e => setExceptionReason(e.target.value)}
                    placeholder="e.g. Phone switched off, delivery rescheduled for tomorrow"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#ffffff'
                    }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPodShipment(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#042f1f', fontWeight: 800 }}
                >
                  Confirm &amp; Close POD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
