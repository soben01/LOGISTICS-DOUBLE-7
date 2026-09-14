'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Package,
  Layers,
  Building,
  Bike,
  ChevronRight,
  Command
} from 'lucide-react';
import { getShipments, Shipment } from '../../lib/store';
import { getBranchManifests, BranchManifest, NEPAL_HUBS } from '../../lib/manifest';
import { PRESET_RIDERS } from '../../lib/rider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'shipments' | 'manifests' | 'hubs' | 'riders'>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allShipments = getShipments();
  const allManifests = getBranchManifests();
  const cleanQ = query.trim().toLowerCase();
  const cleanDigits = cleanQ.replace(/\D/g, '');

  const matchedShipments = cleanQ
    ? allShipments.filter((s) => {
        if (s.id.toLowerCase().includes(cleanQ)) return true;
        if (s.recipient.name.toLowerCase().includes(cleanQ)) return true;
        if (s.sender.name.toLowerCase().includes(cleanQ)) return true;
        if (s.merchant && s.merchant.toLowerCase().includes(cleanQ)) return true;
        if (s.destination.city.toLowerCase().includes(cleanQ)) return true;
        if (cleanDigits.length >= 4 && s.recipient.phone.replace(/\D/g, '').includes(cleanDigits)) return true;
        return false;
      })
    : [];

  const matchedManifests = cleanQ
    ? allManifests.filter((m) => {
        if (m.manifestNumber.toLowerCase().includes(cleanQ)) return true;
        if (m.branchCode.toLowerCase().includes(cleanQ)) return true;
        if (m.destinationCity.toLowerCase().includes(cleanQ)) return true;
        if (m.driverName && m.driverName.toLowerCase().includes(cleanQ)) return true;
        if (m.linehaulVehicle && m.linehaulVehicle.toLowerCase().includes(cleanQ)) return true;
        return false;
      })
    : [];

  const matchedHubs = cleanQ
    ? NEPAL_HUBS.filter((h) => {
        if (h.code.toLowerCase().includes(cleanQ)) return true;
        if (h.name.toLowerCase().includes(cleanQ)) return true;
        if (h.city.toLowerCase().includes(cleanQ)) return true;
        if (h.region.toLowerCase().includes(cleanQ)) return true;
        return false;
      })
    : [];

  const matchedRiders = cleanQ
    ? PRESET_RIDERS.filter((r) => {
        if (r.name.toLowerCase().includes(cleanQ)) return true;
        if (r.routeZone.toLowerCase().includes(cleanQ)) return true;
        if (r.vehiclePlate.toLowerCase().includes(cleanQ)) return true;
        if (r.hubCode.toLowerCase().includes(cleanQ)) return true;
        return false;
      })
    : [];

  const totalMatches =
    matchedShipments.length +
    matchedManifests.length +
    matchedHubs.length +
    matchedRiders.length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '1rem',
      paddingTop: '4rem',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '680px',
        backgroundColor: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '20px',
        boxShadow: '0 24px 70px rgba(0, 0, 0, 0.9)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '85vh'
      }}>
        
        {/* Search Input Bar */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: '#0f172a'
        }}>
          <Search size={20} color="var(--brand-orange)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Waybill (D7-...), Phone, Consignee, Manifest, Hub, Rider..."
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={18} />
            </button>
          )}
          <span style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap'
          }}>
            ESC
          </span>
        </div>

        {/* Filter Pills */}
        {cleanQ && (
          <div style={{
            padding: '0.5rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            overflowX: 'auto',
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}>
            {[
              { id: 'all', label: `All (${totalMatches})` },
              { id: 'shipments', label: `Shipments (${matchedShipments.length})` },
              { id: 'manifests', label: `Manifests (${matchedManifests.length})` },
              { id: 'hubs', label: `Hubs (${matchedHubs.length})` },
              { id: 'riders', label: `Riders (${matchedRiders.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.id ? 'var(--brand-orange)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Results Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
          {!cleanQ ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Command size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Type a waybill number (<strong style={{ color: 'var(--brand-orange)' }}>D7-8821-EXP</strong>), phone number (<strong style={{ color: 'var(--brand-cyan)' }}>98412...</strong>), consignee name, or hub code to search the entire logistics network.
              </p>
            </div>
          ) : totalMatches === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Shipments Section */}
              {(activeTab === 'all' || activeTab === 'shipments') && matchedShipments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Package size={13} color="var(--brand-orange)" />
                    <span>Consignments &amp; Waybills ({matchedShipments.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {matchedShipments.map((s) => (
                      <Link
                        key={s.id}
                        href={`/track?id=${s.id}`}
                        onClick={onClose}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          textDecoration: 'none',
                          color: 'inherit',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff' }}>
                            <span>{s.id}</span>
                            <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>{s.status}</span>
                          </div>
                          <div style={{ color: '#e2e8f0', marginTop: '0.2rem', fontWeight: 600 }}>
                            {s.recipient.name} • {s.recipient.phone}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {s.recipient.address}, {s.destination.city}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {s.codAmount ? (
                            <span style={{ fontFamily: 'var(--font-mono)', color: '#fde68a', fontWeight: 800 }}>
                              Rs. {s.codAmount.toLocaleString()}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--brand-cyan)', fontSize: '0.75rem' }}>Prepaid</span>
                          )}
                          <ChevronRight size={16} color="var(--text-muted)" style={{ marginTop: '0.25rem', marginLeft: 'auto' }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Manifests Section */}
              {(activeTab === 'all' || activeTab === 'manifests') && matchedManifests.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={13} color="var(--brand-cyan)" />
                    <span>Branch Linehaul Manifests ({matchedManifests.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {matchedManifests.map((m) => (
                      <Link
                        key={m.id}
                        href="/manifest"
                        onClick={onClose}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          textDecoration: 'none',
                          color: 'inherit',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff' }}>
                            {m.manifestNumber}
                          </div>
                          <div style={{ color: '#e2e8f0', marginTop: '0.2rem' }}>
                            {m.branchOrigin} &rarr; {m.destinationCity}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Vehicle: {m.linehaulVehicle} • Driver: {m.driverName}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>{m.status}</span>
                          <ChevronRight size={16} color="var(--text-muted)" style={{ marginTop: '0.25rem', marginLeft: 'auto' }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Hubs Section */}
              {(activeTab === 'all' || activeTab === 'hubs') && matchedHubs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={13} color="#10b981" />
                    <span>Regional Sort Hubs ({matchedHubs.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {matchedHubs.map((h) => (
                      <Link
                        key={h.code}
                        href="/operations"
                        onClick={onClose}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          textDecoration: 'none',
                          color: 'inherit',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#ffffff' }}>{h.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{h.region} • Prefix: {h.prefix}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-cyan)' }}>{h.code}</span>
                          <ChevronRight size={16} color="var(--text-muted)" style={{ marginTop: '0.25rem', marginLeft: 'auto' }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Riders Section */}
              {(activeTab === 'all' || activeTab === 'riders') && matchedRiders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Bike size={13} color="#f59e0b" />
                    <span>Courier Fleet Riders ({matchedRiders.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {matchedRiders.map((r) => (
                      <Link
                        key={r.id}
                        href="/rider"
                        onClick={onClose}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          textDecoration: 'none',
                          color: 'inherit',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#ffffff' }}>{r.name} ({r.hubCode})</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{r.routeZone}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Plate: {r.vehiclePlate} • {r.vehicle}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>★ {r.rating}</span>
                          <ChevronRight size={16} color="var(--text-muted)" style={{ marginTop: '0.25rem', marginLeft: 'auto' }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#070b12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>DOUBLE 7 Global Telemetry &amp; Cross-Index Search</span>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.75rem' }}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
