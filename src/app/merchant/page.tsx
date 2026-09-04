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
  Mail,
  Zap,
  Package,
  Check,
  AlertTriangle,
  Users,
  Key,
  Download,
  Phone,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import { getCurrentUser, logoutUser, User as AuthUser } from '../../lib/auth';
import { getShipments, Shipment } from '../../lib/store';
import PrintableLabel from '../../components/shipping/PrintableLabel';
import EmailSummaryModal from '../../components/notifications/EmailSummaryModal';
import AccountStructureAndCodWorkflow from '../../components/workflow/AccountStructureAndCodWorkflow';
import MerchantToolsSuite from '../../components/merchant/MerchantToolsSuite';

type MerchantTab = 'consignments' | 'cod_settlements' | 'ndr_desk' | 'staff' | 'profile_api' | 'workflow';

export default function MerchantPortal() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<MerchantTab>('consignments');
  const [printingShipment, setPrintingShipment] = useState<Shipment | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string>('');

  // Remittance Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(25000);
  const [payoutBank, setPayoutBank] = useState('Nabil Bank - Kathmandu Branch (A/C: 019283746501)');
  const [payoutSubmitted, setPayoutSubmitted] = useState(false);

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4000);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login?portal=merchant&redirect=/merchant');
      return;
    }
    setCurrentUser(user);

    const allShipments = getShipments();
    const merchantShipments = allShipments.filter(
      s =>
        s.sender.company.toLowerCase().includes(user.company.toLowerCase()) ||
        s.sender.name.toLowerCase().includes(user.name.toLowerCase()) ||
        user.role === 'admin'
    );
    setShipments(merchantShipments.length > 0 ? merchantShipments : allShipments.slice(0, 6));
  }, [router]);

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutSubmitted(true);
    triggerNotice(`Bank remittance request for Rs. ${payoutAmount.toLocaleString()} submitted! Daily settlement cut-off at 6:00 PM NPT.`);
    setTimeout(() => {
      setShowPayoutModal(false);
      setPayoutSubmitted(false);
    }, 2000);
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#060911', color: '#f8fafc' }}>
        <p>Loading Merchant Command Center...</p>
      </div>
    );
  }

  const filteredShipments = shipments.filter(s => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCodReconciled = currentUser.codBalanceNpr || 45200;
  const inTransitCount = shipments.filter(s => s.status === 'In Transit').length;
  const deliveredCount = shipments.filter(s => s.status === 'Delivered').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060911', color: '#f8fafc', paddingBottom: '5rem' }}>
      {/* Top Banner Notice */}
      {actionNotice && (
        <div style={{
          backgroundColor: '#10b981',
          color: '#060911',
          padding: '0.75rem 1.5rem',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.875rem',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
        }}>
          <CheckCircle2 size={18} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Merchant Header Bar */}
      <div style={{
        backgroundColor: '#0a0f1d',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1.75rem 0'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Store Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <Building size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                  {currentUser.company || 'Nepal Merchant Partner'}
                </h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  <ShieldCheck size={12} /> VERIFIED SHIPPER
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>ID: <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>{currentUser.id}</strong></span>
                <span>&bull;</span>
                <span>Contact: {currentUser.name} ({currentUser.email})</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowPayoutModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Banknote size={16} /> Request Payout
            </button>

            <Link
              href="/book"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Plus size={16} /> Book Shipment
            </Link>

            <button
              onClick={() => setShowEmailModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Mail size={15} /> 24h Digest
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: '0.6rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                cursor: 'pointer'
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="container" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Available COD */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Reconciled COD Balance</span>
              <Banknote size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981', marginBottom: '0.25rem' }}>
              Rs. {totalCodReconciled.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Cleared for immediate bank payout transfer
            </div>
          </div>

          {/* Card 2: In Transit */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active in Highway Transit</span>
              <Truck size={18} color="#3b82f6" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
              {inTransitCount} Units
            </div>
            <div style={{ fontSize: '0.72rem', color: '#3b82f6' }}>
              Linehaul moving across 77 districts
            </div>
          </div>

          {/* Card 3: Delivered */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Delivered Parcels</span>
              <CheckCircle2 size={18} color="#a855f7" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
              {deliveredCount} Delivered
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981' }}>
              99.4% On-Time Carrier Delivery SLA
            </div>
          </div>

          {/* Card 4: Daily Reset Notice */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700 }}>Daily 6:00 PM Reset</span>
              <Clock size={18} color="#ef4444" />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
              18:00 NPT Cut-Off
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Shipments created before 6 PM ship on tonight's linehaul
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="container" style={{ marginTop: '2rem' }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '0.75rem',
          overflowX: 'auto'
        }}>
          {[
            { id: 'consignments', label: 'My Consignments', icon: Package, count: shipments.length },
            { id: 'cod_settlements', label: 'COD Remittances & Bank Ledger', icon: Banknote },
            { id: 'ndr_desk', label: 'NDR & Re-attempt Desk', icon: AlertTriangle },
            { id: 'staff', label: 'Store Staff (Sub-Merchants)', icon: Users },
            { id: 'profile_api', label: 'Store Profile & API Keys', icon: Key },
            { id: 'workflow', label: 'COD Architecture Flow', icon: Layers },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#3b82f6' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span style={{
                    fontSize: '0.7rem',
                    backgroundColor: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px'
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="container" style={{ marginTop: '1.5rem' }}>
        {/* ========================================================================= */}
        {/* TAB 1: MY CONSIGNMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'consignments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Search & Filter Strip */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              padding: '1rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search orders by Tracking ID, recipient, or destination city..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', width: '100%', fontSize: '0.875rem', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
                {['ALL', 'In Transit', 'Out for Delivery', 'Delivered', 'Pending Pickup', 'Exception'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: statusFilter === st ? 700 : 500,
                      backgroundColor: statusFilter === st ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                      color: statusFilter === st ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Consignments Table */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Tracking ID</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Destination</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Recipient</th>
                    <th style={{ padding: '0.85rem 1rem' }}>COD Amount</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>{s.id}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.serviceType || s.service}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{s.destination.city}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.recipient.address || s.destination.hub}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ color: '#f8fafc' }}>{s.recipient.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.recipient.phone}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: (s.codAmount || s.cargo?.declaredValueNpr) ? '#10b981' : 'var(--text-muted)' }}>
                          {(s.codAmount || s.cargo?.declaredValueNpr) ? `Rs. ${(s.codAmount || s.cargo?.declaredValueNpr)!.toLocaleString()}` : 'Prepaid'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: s.status === 'Delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: s.status === 'Delivered' ? '#10b981' : '#3b82f6'
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Link
                            href={`/track?id=${s.id}`}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              fontSize: '0.75rem',
                              textDecoration: 'none'
                            }}
                          >
                            Track
                          </Link>
                          <button
                            onClick={() => setPrintingShipment(s)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Printer size={13} /> Label
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COD SETTLEMENTS & BANK LEDGER */}
        {/* ========================================================================= */}
        {activeTab === 'cod_settlements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Card 1: Balance & Request Payout */}
              <div style={{
                padding: '1.75rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Banknote size={20} color="#10b981" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Settlement Balance</h3>
                  </div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem' }}>
                    Rs. {totalCodReconciled.toLocaleString()}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Available collected cash from delivered COD parcels. Requests submitted before 6:00 PM NPT are cleared into your registered bank account on the same evening.
                  </p>
                </div>
                <button
                  onClick={() => setShowPayoutModal(true)}
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: '#060911',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Request Bank Remittance Payout
                </button>
              </div>

              {/* Card 2: Registered Bank Details */}
              <div style={{
                padding: '1.75rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Building size={20} color="#3b82f6" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Registered Bank Details</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Bank Name</div>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>Nabil Bank Limited</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Branch & Routing</div>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>Kathmandu Corporate Branch (NCHL-IPS: 0101)</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Account Number</div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>019283746501</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Beneficiary Name</div>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{currentUser.company}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Past Remittances History */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Recent Bank Remittances & Tax Vouchers
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', textAlign: 'left', fontSize: '0.75rem' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Voucher Ref</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Transfer Date</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Amount Transferred</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Clearing Method</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ref: 'NCHL-TX-9921', date: 'Sep 3, 2026', amount: 38400, method: 'NCHL-IPS Direct Credit', status: 'Settled & Cleared' },
                    { ref: 'NCHL-TX-8812', date: 'Aug 28, 2026', amount: 52100, method: 'NCHL-IPS Direct Credit', status: 'Settled & Cleared' },
                  ].map(tx => (
                    <tr key={tx.ref} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.85rem 0.5rem', fontFamily: 'monospace', color: '#3b82f6', fontWeight: 700 }}>{tx.ref}</td>
                      <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>{tx.date}</td>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: '#10b981' }}>Rs. {tx.amount.toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>{tx.method}</td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3, 4, 5: EMBEDDED MERCHANT TOOLS SUITE */}
        {/* ========================================================================= */}
        {(activeTab === 'ndr_desk' || activeTab === 'staff' || activeTab === 'profile_api') && (
          <MerchantToolsSuite />
        )}

        {/* ========================================================================= */}
        {/* TAB 6: COD ARCHITECTURE & WORKFLOW */}
        {/* ========================================================================= */}
        {activeTab === 'workflow' && (
          <AccountStructureAndCodWorkflow />
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal 1: Request Bank Remittance Payout */}
      {showPayoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <form onSubmit={handleRequestPayout} style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#0a0f1d',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.75rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Request Bank Payout Remittance
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Available Balance: <strong style={{ color: '#10b981' }}>Rs. {totalCodReconciled.toLocaleString()}</strong>. Cut-off time is 6:00 PM NPT.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Withdrawal Amount (NPR)</label>
                <input
                  type="number"
                  min="1000"
                  max={totalCodReconciled}
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '1rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Target Bank Account</label>
                <input
                  type="text"
                  readOnly
                  value={payoutBank}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                style={{ padding: '0.55rem 1rem', borderRadius: '6px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={payoutSubmitted}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', backgroundColor: '#10b981', border: 'none', color: '#060911', fontWeight: 700, cursor: 'pointer' }}
              >
                {payoutSubmitted ? 'Submitted!' : 'Confirm Remittance'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Thermal Waybill Label */}
      {printingShipment && (
        <PrintableLabel shipment={printingShipment} onClose={() => setPrintingShipment(null)} />
      )}

      {/* Modal 3: 24h Summary Email Modal */}
      {showEmailModal && (
        <EmailSummaryModal
          onClose={() => setShowEmailModal(false)}
          role="merchant"
        />
      )}
    </div>
  );
}
