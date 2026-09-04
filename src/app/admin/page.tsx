'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Boxes,
  Truck,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit3,
  RefreshCw,
  Plus,
  ArrowRight,
  ChevronRight,
  Globe2,
  Banknote,
  Sliders,
  Send,
  UserCheck,
  Building,
  Radio,
  Lock,
  Printer,
  Mail
} from 'lucide-react';
import {
  getShipments,
  updateShipmentStatus,
  deleteShipment,
  assignShipmentVehicle,
  addCustomCheckpoint,
  getWaitlistSubscribers,
  Shipment,
  Checkpoint
} from '../../lib/store';
import {
  getUsers,
  getCurrentUser,
  updateMerchantStatus,
  recordMerchantRemittance,
  deleteMerchant,
  loginUser,
  User
} from '../../lib/auth';
import PrintableLabel from '../../components/shipping/PrintableLabel';
import EmailSummaryModal from '../../components/notifications/EmailSummaryModal';

export default function AdminControlPanel() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'shipments' | 'merchants' | 'waitlist' | 'hubs'>('shipments');
  const [printingShipment, setPrintingShipment] = useState<Shipment | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Shipments state
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected shipment for status edit
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [editStatus, setEditStatus] = useState<Shipment['status']>('In Transit');
  const [editLocation, setEditLocation] = useState('');
  const [editNote, setEditNote] = useState('');

  // Selected shipment for vehicle assignment
  const [assigningShipment, setAssigningShipment] = useState<Shipment | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState('');
  const [assignedRoute, setAssignedRoute] = useState('');

  // Selected shipment for custom checkpoint
  const [checkpointShipment, setCheckpointShipment] = useState<Shipment | null>(null);
  const [cpStatus, setCpStatus] = useState<Checkpoint['status']>('In Transit');
  const [cpLocation, setCpLocation] = useState('');
  const [cpDescription, setCpDescription] = useState('');

  // Merchants state
  const [merchants, setMerchants] = useState<User[]>([]);
  const [remittanceMerchant, setRemittanceMerchant] = useState<User | null>(null);
  const [remitAmount, setRemitAmount] = useState<number>(10000);

  // Waitlist state
  const [waitlist, setWaitlist] = useState<string[]>([]);

  // Feedback notifications
  const [actionNotice, setActionNotice] = useState('');

  const loadAllData = () => {
    setShipments(getShipments());
    setMerchants(getUsers().filter(u => u.role === 'merchant'));
    setWaitlist(getWaitlistSubscribers());
  };

  const getAdminStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'Delivered':
        return 'badge-emerald';
      case 'Out for Delivery':
        return 'badge-amber';
      case 'In Transit':
        return 'badge-orange';
      case 'Customs Cleared':
        return 'badge-cyan';
      default:
        return 'badge-subtle';
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadAllData();

    const handleAuth = () => {
      setCurrentUser(getCurrentUser());
      loadAllData();
    };

    window.addEventListener('auth-change', handleAuth);
    return () => window.removeEventListener('auth-change', handleAuth);
  }, []);

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3000);
  };


  // Shipment handlers
  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;
    updateShipmentStatus(editingShipment.id, editStatus, editLocation, editNote);
    setEditingShipment(null);
    loadAllData();
    triggerNotice(`Shipment ${editingShipment.id} status updated to: ${editStatus}`);
  };

  const handleAssignVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningShipment || !assignedVehicle.trim()) return;
    assignShipmentVehicle(assigningShipment.id, assignedVehicle.trim(), assignedRoute.trim());
    setAssigningShipment(null);
    loadAllData();
    triggerNotice(`Assigned vehicle ${assignedVehicle} to ${assigningShipment.id}`);
  };

  const handleAddCheckpointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointShipment || !cpLocation.trim()) return;
    addCustomCheckpoint(checkpointShipment.id, {
      status: cpStatus,
      location: cpLocation.trim(),
      description: cpDescription.trim() || `Scanned at ${cpLocation}`,
    });
    setCheckpointShipment(null);
    loadAllData();
    triggerNotice(`Waypoint logged for ${checkpointShipment.id} at ${cpLocation}`);
  };

  const handleDeleteShipment = (id: string) => {
    if (window.confirm(`Are you sure you want to cancel and delete consignment ${id}?`)) {
      deleteShipment(id);
      loadAllData();
      triggerNotice(`Consignment ${id} deleted.`);
    }
  };

  // Merchant handlers
  const handleToggleMerchantStatus = (merchant: User) => {
    const nextStatus = merchant.status === 'active' ? 'suspended' : 'active';
    updateMerchantStatus(merchant.id, nextStatus);
    loadAllData();
    triggerNotice(`Merchant ${merchant.name} is now ${nextStatus.toUpperCase()}`);
  };

  const handleRemitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remittanceMerchant || remitAmount <= 0) return;
    recordMerchantRemittance(remittanceMerchant.id, remitAmount);
    setRemittanceMerchant(null);
    loadAllData();
    triggerNotice(`Recorded COD bank payout of Rs. ${remitAmount.toLocaleString()} to ${remittanceMerchant.company}`);
  };

  const handleDeleteMerchant = (id: string, name: string) => {
    if (window.confirm(`Permanently delete merchant account for ${name}?`)) {
      deleteMerchant(id);
      loadAllData();
      triggerNotice(`Merchant ${name} deleted.`);
    }
  };

  const filteredShipments = shipments.filter(s => {
    const term = shipmentSearch.toLowerCase();
    const matches =
      s.id.toLowerCase().includes(term) ||
      s.origin.city.toLowerCase().includes(term) ||
      s.destination.city.toLowerCase().includes(term) ||
      s.sender.company.toLowerCase().includes(term) ||
      s.recipient.name.toLowerCase().includes(term);

    if (statusFilter === 'ALL') return matches;
    return matches && s.status.toUpperCase() === statusFilter.toUpperCase();
  });

  return (
    <div style={{ padding: '3rem 0 6rem 0' }}>
      <div className="container">
        {/* ACTION FEEDBACK ALERT */}
        {actionNotice && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* SECURITY CHECK: ADMIN AUTHORIZATION REQUIRED */}
        {(!currentUser || currentUser.role !== 'admin') ? (
          <div className="glass-panel" style={{ padding: '3.5rem 2rem', maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              color: 'var(--brand-red)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <ShieldAlert size={32} />
            </div>

            <div className="badge badge-orange" style={{ marginBottom: '0.75rem' }}>
              ADMIN PRIVILEGES REQUIRED
            </div>

            <h2 style={{ fontSize: '1.85rem', marginBottom: '0.75rem' }}>
              Restricted Control Console
            </h2>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.7', fontSize: '0.95rem' }}>
              The Double 7 Central Admin Control Panel allows complete authority over national logistics corridors, dispatching drivers, merchant account approval, and shipment override. You must be signed in as an authorized Administrator.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px', margin: '0 auto' }}>
              <Link href="/login" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
                <ShieldCheck size={18} />
                <span>Admin Login &rarr;</span>
              </Link>
            </div>
          </div>
        ) : (
          /* ================= AUTHORIZED ADMIN PANEL ================= */
          <div>
            {/* Top Admin Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '2.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1.5rem'
            }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }} className="badge badge-orange">
                  <ShieldCheck size={14} />
                  <span>CENTRAL ADMINISTRATION COMMAND &bull; FOUNDER ACCESS</span>
                </div>
                <h1 style={{ fontSize: '2.4rem' }}>Double 7 Control Tower</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Authenticated Admin: <strong style={{ color: '#ffffff' }}>{currentUser.name}</strong> ({currentUser.company}) &bull; Master Operational Privileges
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: 'var(--brand-orange)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Mail size={14} color="var(--brand-orange)" />
                  <span>24h Gmail Digest</span>
                </button>
                <button onClick={loadAllData} className="btn btn-secondary btn-sm">
                  <RefreshCw size={14} />
                  <span>Refresh Telemetry</span>
                </button>
                <Link href="/book" className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  <span>Dispatch New Shipment</span>
                </Link>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="grid grid-cols-4 gap-5" style={{ marginBottom: '2.5rem' }}>
              <div className="card glow-card-orange">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="metric-label">TOTAL CONSIGNMENTS</span>
                  <Truck size={18} color="var(--brand-orange)" />
                </div>
                <span className="metric-number" style={{ color: 'var(--brand-orange)', fontSize: '2.2rem' }}>{shipments.length}</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Active nationwide linehauls &bull; 100% SLA
                </div>
              </div>

              <div className="card glow-card-cyan">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="metric-label">REGISTERED MERCHANTS</span>
                  <Users size={18} color="var(--brand-cyan)" />
                </div>
                <span className="metric-number" style={{ color: 'var(--brand-cyan)', fontSize: '2.2rem' }}>{merchants.length}</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Verified e-commerce brands on COD network
                </div>
              </div>

              <div className="card glow-card-emerald">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="metric-label">COD BANK REMITTANCE</span>
                  <Banknote size={18} color="var(--brand-emerald)" />
                </div>
                <span className="metric-number" style={{ color: 'var(--brand-emerald)', fontSize: '2.2rem' }}>Rs. 1.2M</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Next-day 10:00 AM bank payout SLA
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="metric-label">ALL 77 DISTRICTS</span>
                  <Globe2 size={18} color="var(--brand-amber)" />
                </div>
                <span className="metric-number" style={{ color: '#ffffff', fontSize: '2.2rem' }}>77</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--brand-amber)', marginTop: '0.35rem' }}>
                  {waitlist.length} International export leads queued
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tab-list" style={{ marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('shipments')}
                className={`tab-btn ${activeTab === 'shipments' ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Truck size={15} />
                <span>Shipment Control &amp; Overrides ({shipments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('merchants')}
                className={`tab-btn ${activeTab === 'merchants' ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Users size={15} />
                <span>Merchant Accounts &amp; COD ({merchants.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('waitlist')}
                className={`tab-btn ${activeTab === 'waitlist' ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Globe2 size={15} />
                <span>International Waitlist Leads ({waitlist.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hubs')}
                className={`tab-btn ${activeTab === 'hubs' ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Sliders size={15} />
                <span>Hubs &amp; Tariffs Config</span>
              </button>
            </div>

            {/* ================= TAB 1: SHIPMENTS CONTROL ================= */}
            {activeTab === 'shipments' && (
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>National Consignment Override Console</h3>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search ID, city, merchant..."
                        value={shipmentSearch}
                        onChange={(e) => setShipmentSearch(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '2.2rem', width: '240px', fontSize: '0.82rem' }}
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="select-field"
                      style={{ fontSize: '0.82rem', width: 'auto' }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="IN TRANSIT">In Transit</option>
                      <option value="OUT FOR DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="PENDING PICKUP">Pending Pickup</option>
                      <option value="CUSTOMS CLEARED">Customs Cleared</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tracking ID / Waybill</th>
                        <th>Service Tier</th>
                        <th>Route (From &rarr; To)</th>
                        <th>Consignor (Merchant)</th>
                        <th>Carrier Unit</th>
                        <th>Live Status</th>
                        <th style={{ textAlign: 'right' }}>Admin Overrides</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShipments.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <Link href={`/track?id=${s.id}`} style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand-orange)', textDecoration: 'underline' }}>
                              {s.id}
                            </Link>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {s.telemetry.waybillNumber || s.telemetry.airwayBill}
                            </div>
                          </td>

                          <td>
                            <span style={{ fontWeight: 600 }}>{s.service}</span>
                          </td>

                          <td>
                            <div style={{ fontWeight: 600 }}>{s.origin.city} &rarr; {s.destination.city}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>To: {s.recipient.name}</div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 600 }}>{s.sender.company}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.sender.phone}</div>
                          </td>

                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--brand-cyan)' }}>
                              {s.telemetry.transportVehicle || 'Unassigned'}
                            </span>
                          </td>

                          <td>
                            <span className={`badge ${getAdminStatusBadge(s.status)}`} style={{ fontSize: '0.72rem' }}>
                              {s.status}
                            </span>
                          </td>

                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingShipment(s);
                                  setEditStatus(s.status);
                                  setEditLocation(s.destination.city);
                                  setEditNote(`Updated by Admin`);
                                }}
                                className="btn btn-secondary btn-sm"
                                title="Update Status"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                <Edit3 size={12} />
                                <span>Status</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setAssigningShipment(s);
                                  setAssignedVehicle(s.telemetry.transportVehicle || 'Electric Van #BA-2-PA-8892');
                                  setAssignedRoute(s.telemetry.trackingRoute || 'Express Highway Route');
                                }}
                                className="btn btn-outline btn-sm"
                                title="Assign Vehicle / Route"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                <Truck size={12} />
                                <span>Assign</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setCheckpointShipment(s);
                                  setCpStatus(s.status === 'Delivered' ? 'Delivered' : s.status === 'Out for Delivery' ? 'Out for Delivery' : 'In Transit');
                                  setCpLocation(s.origin.city);
                                  setCpDescription(`Sorted at central hub.`);
                                }}
                                className="btn btn-outline btn-sm"
                                title="Add Checkpoint Waypoint"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                <Plus size={12} />
                                <span>Point</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPrintingShipment(s)}
                                className="btn btn-outline btn-sm"
                                title="Print Official Shipping Label"
                                style={{ padding: '0.35rem 0.5rem', color: 'var(--brand-orange)', borderColor: 'rgba(255, 102, 0, 0.4)' }}
                              >
                                <Printer size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteShipment(s.id)}
                                className="btn btn-outline btn-sm"
                                title="Delete Consignment"
                                style={{ padding: '0.35rem 0.5rem', color: 'var(--brand-red)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                              >
                                <Trash2 size={13} />
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

            {/* ================= TAB 2: MERCHANTS & COD ================= */}
            {activeTab === 'merchants' && (
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem' }}>Merchant Accounts &amp; COD Ledger</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Control merchant access, audit KYC registration, and record automated Cash on Delivery bank remittances.
                    </p>
                  </div>

                  <Link href="/login?portal=merchant" className="btn btn-secondary btn-sm">
                    <Plus size={14} />
                    <span>Register New Merchant</span>
                  </Link>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Merchant Representative</th>
                        <th>Company / E-Commerce Store</th>
                        <th>Contact Info</th>
                        <th>Account Status</th>
                        <th>Pending COD Balance</th>
                        <th style={{ textAlign: 'right' }}>Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {merchants.map((m) => (
                        <tr key={m.id}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 700, color: '#ffffff' }}>{m.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {m.id}</div>
                          </td>

                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 600 }}>{m.company}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--brand-cyan)' }}>Nepal Verified Consignor</div>
                          </td>

                          <td style={{ padding: '1rem' }}>
                            <div>{m.email}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.phone}</div>
                          </td>

                          <td style={{ padding: '1rem' }}>
                            {m.status === 'active' ? (
                              <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>Active</span>
                            ) : (
                              <span className="badge badge-orange" style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>Suspended</span>
                            )}
                          </td>

                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>
                              Rs. {(m.codBalanceNpr || 0).toLocaleString()} NPR
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--brand-emerald)' }}>Eligible for Payout</div>
                          </td>

                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setRemittanceMerchant(m);
                                  setRemitAmount(m.codBalanceNpr || 5000);
                                }}
                                className="btn btn-secondary btn-sm"
                                title="Record Remittance Payout"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                              >
                                <Banknote size={13} />
                                <span>Remit COD</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleMerchantStatus(m)}
                                className={`btn btn-sm ${m.status === 'active' ? 'btn-outline' : 'btn-primary'}`}
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                              >
                                {m.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteMerchant(m.id, m.name)}
                                className="btn btn-outline btn-sm"
                                title="Delete Merchant"
                                style={{ padding: '0.35rem 0.5rem', color: 'var(--brand-red)' }}
                              >
                                <Trash2 size={13} />
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

            {/* ================= TAB 3: INTERNATIONAL WAITLIST ================= */}
            {activeTab === 'waitlist' && (
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem' }}>International Air Cargo Priority Waitlist</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Companies and exporters pre-registered for the Q4 2026 Tribhuvan Airport (TIA) cross-border air charter corridors.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(waitlist.join(', '));
                      triggerNotice('Copied all waitlist emails to clipboard!');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Copy All Emails</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {waitlist.map((email, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem 1.25rem',
                        background: 'var(--bg-surface)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-amber)', fontWeight: 700 }}>#{idx + 1}</span>
                        <span style={{ fontWeight: 600, color: '#ffffff' }}>{email}</span>
                      </div>
                      <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>Early Access Qualified</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB 4: HUBS & TARIFFS CONFIG ================= */}
            {activeTab === 'hubs' && (
              <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Nepal Domestic Logistics Network Architecture</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.92rem' }}>
                  Hub capacities, daily linehaul transit schedules, and automated barcode sorter configurations.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--brand-orange)', marginBottom: '0.75rem' }}>Active Base Rates (NPR)</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Kathmandu Valley Rush (Inside Ring Road):</span>
                        <strong style={{ color: '#ffffff' }}>Rs. 120 (0-1 KG) &bull; Rs. 40/kg addl</strong>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Intercity Corridor (KTM &rarr; PKR / BRT / BRJ):</span>
                        <strong style={{ color: '#ffffff' }}>Rs. 180 (0-1 KG) &bull; Rs. 55/kg addl</strong>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Regional Hubs (Dharan, Butwal, Nepalgunj):</span>
                        <strong style={{ color: '#ffffff' }}>Rs. 220 (0-1 KG) &bull; Rs. 65/kg addl</strong>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>77 Districts Mountain &amp; Hill Outstations:</span>
                        <strong style={{ color: '#ffffff' }}>Rs. 290 (0-1 KG) &bull; Rs. 85/kg addl</strong>
                      </li>
                    </ul>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--brand-cyan)', marginBottom: '0.75rem' }}>Fleet &amp; Dispatch Linehauls</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Prithvi Highway Linehaul:</span>
                        <strong style={{ color: 'var(--brand-emerald)' }}>Departures 06:00 &bull; 14:00 &bull; 21:00</strong>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Mahendra Highway South Corridor:</span>
                        <strong style={{ color: 'var(--brand-emerald)' }}>Departures 07:00 &bull; 19:00 Daily</strong>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Kathmandu Valley Electric Dispatch Fleet:</span>
                        <strong style={{ color: 'var(--brand-emerald)' }}>Continuous 24/7 Dispatch</strong>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>International Air Cargo (TIA Airport):</span>
                        <strong style={{ color: 'var(--brand-amber)' }}>Charter Licensing (Q4 2026)</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: EDIT SHIPMENT STATUS */}
        {editingShipment && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', border: '1px solid var(--brand-orange)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Override Status: {editingShipment.id}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Route: {editingShipment.origin.city} &rarr; {editingShipment.destination.city} ({editingShipment.recipient.name})
              </p>

              <form onSubmit={handleUpdateStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">New Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as Shipment['status'])}
                    className="select-field"
                  >
                    <option value="Pending Pickup">Pending Pickup</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered (Signs electronic POD)</option>
                    <option value="Customs Cleared">Customs Cleared</option>
                    <option value="Exception">Exception / Delay</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Current Checkpoint Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Admin Update Note</label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Cleared Mugling pass, en route to Pokhara hub"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setEditingShipment(null)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save Status Override
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ASSIGN VEHICLE */}
        {assigningShipment && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Assign Fleet &amp; Driver: {assigningShipment.id}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Allocate courier van or highway linehaul carrier to this consignment.
              </p>

              <form onSubmit={handleAssignVehicleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Carrier Unit / Vehicle Plate</label>
                  <input
                    type="text"
                    value={assignedVehicle}
                    onChange={(e) => setAssignedVehicle(e.target.value)}
                    className="input-field"
                    placeholder="e.g. D7 Electric Van #BA-2-PA-8892"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Highway Route Corridor</label>
                  <input
                    type="text"
                    value={assignedRoute}
                    onChange={(e) => setAssignedRoute(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Prithvi Highway Linehaul Express"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setAssigningShipment(null)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Assign Fleet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD CHECKPOINT */}
        {checkpointShipment && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Log Waypoint: {checkpointShipment.id}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Add an official tracking milestone visible on the public tracker.
              </p>

              <form onSubmit={handleAddCheckpointSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Milestone Status</label>
                  <select
                    value={cpStatus}
                    onChange={(e) => setCpStatus(e.target.value as Checkpoint['status'])}
                    className="select-field"
                  >
                    <option value="Hub Received">Hub Received</option>
                    <option value="In Transit">In Transit (Highway Scan)</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Customs Cleared">Customs Cleared</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Waypoint Location</label>
                  <input
                    type="text"
                    value={cpLocation}
                    onChange={(e) => setCpLocation(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Mugling Transit Cross-Dock"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Detailed Telemetry Note</label>
                  <input
                    type="text"
                    value={cpDescription}
                    onChange={(e) => setCpDescription(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Optical barcode scan verified. Package transferred to regional unit."
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setCheckpointShipment(null)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Log Checkpoint
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: REMIT COD TO MERCHANT */}
        {remittanceMerchant && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Record COD Payout</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Merchant: <strong>{remittanceMerchant.name}</strong> ({remittanceMerchant.company})
              </p>

              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.88rem'
              }}>
                Current Outstanding Balance: <strong style={{ color: 'var(--brand-emerald)' }}>Rs. {(remittanceMerchant.codBalanceNpr || 0).toLocaleString()} NPR</strong>
              </div>

              <form onSubmit={handleRemitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Remittance Amount (NPR)</label>
                  <input
                    type="number"
                    min="1"
                    max={remittanceMerchant.codBalanceNpr || 1000000}
                    value={remitAmount}
                    onChange={(e) => setRemitAmount(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setRemittanceMerchant(null)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Confirm Bank Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Label Modal for Admin */}
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

        {/* 24-Hour Gmail Logistics & COD Summary Modal */}
        {showEmailModal && currentUser && (
          <EmailSummaryModal
            initialEmail={currentUser.email}
            role="admin"
            onClose={() => setShowEmailModal(false)}
          />
        )}
      </div>
    </div>
  );
}
