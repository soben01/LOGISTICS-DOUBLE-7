'use client';

import React, { useState } from 'react';
import {
  Package,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  Barcode
} from 'lucide-react';
import { Shipment, getShipments } from '../../lib/store';
import { NEPAL_HUBS, NepalHub } from '../../lib/manifest';
import { createMasterBag, MasterBag } from '../../lib/bagging';
import { playScanBeep, playErrorBuzz, playRouteMismatchSiren, playDispatchFanfare } from '../../lib/soundFx';

interface Props {
  originHubCode: string;
  originHubName: string;
  onClose: () => void;
  onBagCreated: (bag: MasterBag) => void;
}

export default function MasterBaggingModal({
  originHubCode,
  originHubName,
  onClose,
  onBagCreated
}: Props) {
  const [destinationHubCode, setDestinationHubCode] = useState('PKR-01');
  const [destinationHubName, setDestinationHubName] = useState('Pokhara Regional Sort Hub (PKR-01)');
  const [sealNumber, setSealNumber] = useState(() => `SL-${Math.floor(10000 + Math.random() * 90000)}`);
  const [bagNotes, setBagNotes] = useState('Consolidated priority e-commerce parcel sack.');
  
  const [scanInput, setScanInput] = useState('');
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const shipments = getShipments();
  const eligibleShipments = shipments.filter(s => 
    !selectedBookingIds.includes(s.id) &&
    s.status !== 'Delivered' &&
    s.status !== 'Shipment Dispatched'
  );

  const handleDestinationChange = (code: string) => {
    setDestinationHubCode(code);
    const found = NEPAL_HUBS.find(h => h.code === code);
    if (found) {
      setDestinationHubName(found.name);
    }
  };

  const handleAddBooking = (idToAdd?: string) => {
    const targetId = (idToAdd || scanInput).trim().toUpperCase();
    if (!targetId) return;

    if (selectedBookingIds.includes(targetId)) {
      playErrorBuzz();
      setFeedback({ type: 'error', msg: `Booking ${targetId} is already inside this bag.` });
      return;
    }

    const found = shipments.find(s => s.id.toUpperCase() === targetId || s.bookingNo?.toUpperCase() === targetId);
    if (!found) {
      playErrorBuzz();
      setFeedback({ type: 'error', msg: `Booking #${targetId} not found in inventory.` });
      return;
    }

    // Route Mismatch Sentinel
    const targetDestHub = found.destination.hub.toUpperCase();
    if (!targetDestHub.includes(destinationHubCode.toUpperCase())) {
      playRouteMismatchSiren();
      setFeedback({
        type: 'error',
        msg: `⚠️ ROUTE MISMATCH: Booking ${found.id} is destined for ${found.destination.city} (${found.destination.hub}), but this Master Bag is departing for ${destinationHubName}!`
      });
      return;
    }

    playScanBeep(1600, 0.08);
    setSelectedBookingIds(prev => [found.id, ...prev]);
    setScanInput('');
    setFeedback({
      type: 'success',
      msg: `✓ Packed ${found.id} (${found.cargo.weightKg} KG) into bag.`
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRemoveBooking = (id: string) => {
    playScanBeep(1000, 0.05);
    setSelectedBookingIds(prev => prev.filter(item => item !== id));
  };

  const totalWeight = selectedBookingIds.reduce((sum, id) => {
    const s = shipments.find(item => item.id === id);
    return sum + (s?.cargo.weightKg || 0);
  }, 0);

  const totalPieces = selectedBookingIds.reduce((sum, id) => {
    const s = shipments.find(item => item.id === id);
    return sum + (s?.cargo.pieces || 1);
  }, 0);

  const totalCod = selectedBookingIds.reduce((sum, id) => {
    const s = shipments.find(item => item.id === id);
    return sum + (s?.codAmount || 0);
  }, 0);

  const handleSealBag = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBookingIds.length === 0) {
      playErrorBuzz();
      alert('Please add at least 1 booking to seal into this master bag.');
      return;
    }

    playDispatchFanfare();
    const bag = createMasterBag({
      originHub: originHubCode,
      originHubName,
      destinationHub: destinationHubCode,
      destinationHubName,
      sealNumber,
      itemBookingIds: selectedBookingIds,
      totalPieces,
      totalWeightKg: totalWeight,
      totalCodNpr: totalCod,
      notes: bagNotes
    });

    onBagCreated(bag);
  };

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
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(168, 85, 247, 0.15)',
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
          background: 'linear-gradient(to right, rgba(168, 85, 247, 0.1), transparent)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{
                background: 'rgba(168, 85, 247, 0.2)',
                color: '#c084fc',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}>
                CONTAINERIZATION ENGINE
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Origin Hub: {originHubCode}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Pack & Seal Master Bag (Tamper-Evident)
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Pack multiple loose parcels into a sealed sack for single-barcode linehaul transit
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

        {/* Form Body */}
        <form onSubmit={handleSealBag} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Bag Destination & Security Seal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Bag Destination Gateway Hub
              </label>
              <select
                value={destinationHubCode}
                onChange={e => handleDestinationChange(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0e1422',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '0.65rem',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              >
                {NEPAL_HUBS.filter(h => h.code !== originHubCode).map(hub => (
                  <option key={hub.code} value={hub.code}>{hub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Pull-Tight Security Seal Barcode #
              </label>
              <input
                type="text"
                value={sealNumber}
                onChange={e => setSealNumber(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0e1422',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '0.65rem',
                  color: '#c084fc',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
                required
              />
            </div>
          </div>

          {/* Barcode Scanner Input */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1rem',
          }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Barcode size={16} /> Scan AWB into Bag (Automatic Route-Mismatch Check)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="SCAN OR TYPE BOOKING # (E.G. D7-8821)"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBooking();
                  }
                }}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  letterSpacing: '0.05em'
                }}
              />
              <button
                type="button"
                onClick={() => handleAddBooking()}
                style={{
                  background: 'rgba(168, 85, 247, 0.25)',
                  border: '1px solid rgba(168, 85, 247, 0.5)',
                  color: '#e9d5ff',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Plus size={16} /> Pack
              </button>
            </div>

            {feedback && (
              <div style={{
                marginTop: '0.6rem',
                fontSize: '0.8rem',
                color: feedback.type === 'success' ? '#34d399' : '#f87171',
                fontWeight: 600,
              }}>
                {feedback.msg}
              </div>
            )}

            {/* Quick-add pills for eligible inventory */}
            {eligibleShipments.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Available consignments destined for {destinationHubCode}:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {eligibleShipments.slice(0, 6).map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleAddBooking(s.id)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      + {s.id} ({s.cargo.weightKg}kg)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Staged Items In This Bag */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                Parcels Inside Bag ({selectedBookingIds.length})
              </span>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pieces: <strong style={{ color: '#fff' }}>{totalPieces}</strong></span>
                <span style={{ color: 'var(--text-muted)' }}>Gross Wt: <strong style={{ color: '#c084fc' }}>{totalWeight.toFixed(1)} KG</strong></span>
                <span style={{ color: 'var(--text-muted)' }}>COD Total: <strong style={{ color: '#fbbf24' }}>Rs. {totalCod.toLocaleString()}</strong></span>
              </div>
            </div>

            <div style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              {selectedBookingIds.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No parcels packed yet. Scan or click above to pack into this master bag.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)' }}>AWB #</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)' }}>Consignee</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>Weight</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>COD</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBookingIds.map(id => {
                      const s = shipments.find(item => item.id === id);
                      return (
                        <tr key={id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600, color: '#38bdf8' }}>{id}</td>
                          <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{s?.recipient.name || 'Unknown'}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', color: '#c084fc' }}>{s?.cargo.weightKg || 0} kg</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', color: '#fbbf24' }}>Rs. {(s?.codAmount || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveBooking(id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: '0.2rem'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
              Bag Manifest Remarks
            </label>
            <input
              type="text"
              value={bagNotes}
              onChange={e => setBagNotes(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '0.5rem',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={selectedBookingIds.length === 0}
            style={{
              background: selectedBookingIds.length === 0
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: selectedBookingIds.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: selectedBookingIds.length === 0 ? 'none' : '0 4px 15px rgba(168, 85, 247, 0.4)',
            }}
          >
            <ShieldCheck size={18} />
            Apply Security Seal & Close Master Bag
          </button>
        </form>
      </div>
    </div>
  );
}
