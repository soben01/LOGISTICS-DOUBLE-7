'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building,
  Truck,
  Boxes,
  Banknote,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Search,
  ExternalLink,
  ShieldCheck,
  FileText,
  User,
  LogOut,
  Sparkles,
  Printer,
  Mail
} from 'lucide-react';
import { getCurrentUser, logoutUser, User as AuthUser } from '../../lib/auth';
import { getShipments, Shipment } from '../../lib/store';
import PrintableLabel from '../../components/shipping/PrintableLabel';
import EmailSummaryModal from '../../components/notifications/EmailSummaryModal';

export default function MerchantPortal() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [printingShipment, setPrintingShipment] = useState<Shipment | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login?portal=merchant&redirect=/merchant');
      return;
    }
    setCurrentUser(user);

    const allShipments = getShipments();
    // Filter shipments belonging to this merchant or show active domestic bookings
    const merchantShipments = allShipments.filter(
      s =>
        s.sender.company.toLowerCase().includes(user.company.toLowerCase()) ||
        s.sender.name.toLowerCase().includes(user.name.toLowerCase()) ||
        user.role === 'admin'
    );
    // If new merchant with 0 shipments, show all sample shipments so they can test tracking
    setShipments(merchantShipments.length > 0 ? merchantShipments : allShipments.slice(0, 3));
  }, [router]);

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  if (!currentUser) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p>Loading Merchant Portal...</p>
      </div>
    );
  }

  const filtered = shipments.filter(s =>
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.destination.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '3.5rem 0 6rem 0' }}>
      <div className="container">
        {/* Merchant Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }} className="badge badge-cyan">
              <Building size={14} />
              <span>VERIFIED NEPAL MERCHANT PORTAL</span>
            </div>
            <h1 style={{ fontSize: '2.2rem' }}>{currentUser.company}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Authorized Rep: <strong style={{ color: '#ffffff' }}>{currentUser.name}</strong> &bull; {currentUser.email} &bull; {currentUser.phone}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/book" className="btn btn-primary">
              <Plus size={16} />
              <span>Book New Shipment</span>
            </Link>
            {currentUser.role === 'admin' && (
              <Link href="/admin" className="btn btn-outline" style={{ borderColor: 'var(--brand-orange)', color: 'var(--brand-orange)' }}>
                <ShieldCheck size={16} />
                <span>Admin Panel</span>
              </Link>
            )}
            <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Merchant Financials & Metrics */}
        <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '3rem' }}>
          {/* COD Balance */}
          <div className="card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING COD REMITTANCE</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Automated Payout</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              Rs. {(currentUser.codBalanceNpr || 0).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600 }}>NPR</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Collected Cash on Delivery awaiting weekly bank transfer to your registered Nepal bank account.
            </p>
          </div>

          {/* Dispatched Consignments */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE PARCELS</span>
              <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>Real-Time GPS</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              {shipments.length}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Total consignments dispatched through Double 7 linehauls across Nepal&apos;s 7 provinces.
            </p>
          </div>

          {/* Service Level SLA */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>ON-TIME SLA RATE</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>Top Tier</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              99.6%
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Next-day intercity guaranteed linehaul performance with live SMS dispatch notifications.
            </p>
          </div>
        </div>

        {/* Automated 24-Hour Gmail Logistics & COD Digest Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
          border: '1px solid rgba(255, 102, 0, 0.3)',
          borderRadius: '14px',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>24-Hour Gmail Logistics &amp; COD Digest</span>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>ACTIVE 24H SCHEDULE</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Automated 24-hr summary dispatched to <strong>{currentUser.email}</strong> daily at 08:00 NPT (Active Linehauls, Delivered Parcels, and COD Remittance Report).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--brand-orange)', color: '#ffffff' }}
          >
            <Clock size={14} color="var(--brand-orange)" />
            <span>Configure 24h Gmail Alerts</span>
          </button>
        </div>

        {/* Consignment Records Table */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Your Consignment Dispatches</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Track live parcels, view digital recipient signatures, and download official domestic waybills.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search waybill, city, recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.2rem', width: '260px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Tracking Code</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Service</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Destination</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Recipient</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Declared Value</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem' }}>
                      <Link href={`/track?id=${s.id}`} style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand-orange)', textDecoration: 'underline' }}>
                        {s.id}
                      </Link>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {s.telemetry.waybillNumber || s.telemetry.airwayBill}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 600 }}>{s.service}</span>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{s.destination.city}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.origin.city} &rarr; {s.destination.city}</div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{s.recipient.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.recipient.phone}</div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                        Rs. {(s.cargo.declaredValueNpr || 0).toLocaleString()} NPR
                      </span>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>
                        {s.status}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setPrintingShipment(s)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Print Official Shipping Label"
                        >
                          <Printer size={12} />
                          <span>Print Label</span>
                        </button>

                        <Link href={`/track?id=${s.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                          <span>Track</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Label Modal */}
        {printingShipment && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1.5rem',
              overflowY: 'auto'
            }}
          >
            <div style={{ maxWidth: '750px', width: '100%', margin: 'auto' }}>
              <PrintableLabel
                shipment={printingShipment}
                onClose={() => setPrintingShipment(null)}
              />
            </div>
          </div>
        )}

        {/* 24-Hour Gmail Summary Modal */}
        {showEmailModal && currentUser && (
          <EmailSummaryModal
            initialEmail={currentUser.email}
            role="merchant"
            onClose={() => setShowEmailModal(false)}
          />
        )}
      </div>
    </div>
  );
}
