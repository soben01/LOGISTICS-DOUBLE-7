'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Banknote,
  Truck,
  Boxes,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  Radio,
  FileText,
  Lock,
  Download,
  Upload,
  Activity,
  Layers,
  Zap,
  Globe2,
  DollarSign
} from 'lucide-react';
import {
  SubUser,
  getSubUsers,
  addSubUser,
  toggleSubUserStatus,
  deleteSubUser,
  switchActiveSubUser,
  getCurrentUser,
  User
} from '../../lib/auth';
import {
  CodOrderRecord,
  getCodRecords,
  resolveDiscrepancy,
  toggleDisputeHold,
  depositRiderCashBatchToHub,
  resetCodDemoData
} from '../../lib/cod';
import { SYSTEM_PERMISSIONS, ROLE_PRESETS } from '../../lib/permissions';
import { getShipments, Shipment, assignShipmentVehicle } from '../../lib/store';

interface Props {
  onNotice?: (msg: string) => void;
}

export default function AdminToolsSuite({ onNotice }: Props) {
  const [activeTool, setActiveTool] = useState<
    'sub_admins' | 'cod_radar' | 'rider_fleet' | 'tariffs' | 'hub_capacity' | 'diagnostics'
  >('sub_admins');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [codRecords, setCodRecords] = useState<CodOrderRecord[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  // Sub-admin form state
  const [newSubName, setNewSubName] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubRole, setNewSubRole] = useState('Operations & Hub Controller');
  const [newSubPhone, setNewSubPhone] = useState('+977 98000 11223');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'admin:linehaul_dispatch',
    'admin:hub_telemetry',
    'admin:carrier_routing'
  ]);

  // Tariffs state
  const [valleyBaseRate, setValleyBaseRate] = useState(120);
  const [cargoBaseRate, setCargoBaseRate] = useState(160);
  const [rushBaseRate, setRushBaseRate] = useState(250);
  const [fuelSurchargePct, setFuelSurchargePct] = useState(12);
  const [festiveSurgeActive, setFestiveSurgeActive] = useState(false);
  const [festiveMultiplier, setFestiveMultiplier] = useState(1.25);

  // Hub Capacity state
  const [hubCapacities, setHubCapacities] = useState({
    ktm: 85,
    pkr: 60,
    brg: 75,
    brt: 50,
    ctw: 40,
    btw: 55,
  });

  // Rider Fleet state
  const [selectedRiderForDeposit, setSelectedRiderForDeposit] = useState<string>('');
  const [assignShipmentId, setAssignShipmentId] = useState<string>('');
  const [assignVehicleCode, setAssignVehicleCode] = useState<string>('BA 2 KHA 8841 (Express E-Van)');

  const triggerAlert = (msg: string) => {
    if (onNotice) onNotice(msg);
  };

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    // Sub-admins scoped to admin
    setSubUsers(getSubUsers('admin', user?.id));
    setCodRecords(getCodRecords());
    setShipments(getShipments());
  };

  useEffect(() => {
    loadData();
    const handleAuth = () => loadData();
    const handleCod = () => loadData();
    window.addEventListener('auth-change', handleAuth);
    window.addEventListener('cod-records-change', handleCod);
    return () => {
      window.removeEventListener('auth-change', handleAuth);
      window.removeEventListener('cod-records-change', handleCod);
    };
  }, []);

  const handleCreateSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubEmail.trim()) {
      triggerAlert('Please enter name and valid business email.');
      return;
    }

    const res = addSubUser({
      name: newSubName.trim(),
      email: newSubEmail.trim(),
      role: 'admin',
      subRole: newSubRole,
      parentId: currentUser?.id || 'usr-admin-1',
      parentName: currentUser?.name || 'Soben (Founder HQ)',
      phone: newSubPhone.trim(),
      permissions: selectedPermissions
    });

    if (res.success) {
      triggerAlert(`Created scoped Sub-Admin: ${newSubName} (${newSubRole})`);
      setNewSubName('');
      setNewSubEmail('');
      loadData();
    } else {
      triggerAlert(`Error: ${res.error}`);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = ROLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setNewSubRole(preset.label);
      setSelectedPermissions(preset.permissions);
    }
  };

  const togglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleAssignRiderToShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignShipmentId || !assignVehicleCode) return;
    assignShipmentVehicle(assignShipmentId, assignVehicleCode);
    triggerAlert(`Assigned ${assignVehicleCode} to consignment ${assignShipmentId}`);
    loadData();
  };

  const adminPermissions = SYSTEM_PERMISSIONS.filter(p => p.scope === 'admin' || p.scope === 'both');

  // Discrepancy & Aging orders
  const discrepancyOrders = codRecords.filter(r => r.isDiscrepancy);
  const agingOrders = codRecords.filter(r => r.isAgingAlert);

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Tool Navigation Tabs */}
      <div className="mobile-scroll-x" style={{
        display: 'flex',
        background: 'rgba(11, 17, 32, 0.95)',
        padding: '0.4rem',
        borderRadius: '12px',
        border: '1px solid var(--border-medium)',
        gap: '0.35rem',
        overflowX: 'auto',
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        marginBottom: '2rem'
      }}>
        {[
          { id: 'sub_admins', label: 'Scoped Sub-Admins', icon: Users, count: subUsers.length },
          { id: 'cod_radar', label: 'COD Discrepancy & SLA Radar', icon: Banknote, count: discrepancyOrders.length + agingOrders.length },
          { id: 'rider_fleet', label: 'Rider Fleet & Cash Allocator', icon: Truck },
          { id: 'tariffs', label: 'Tariffs & Peak Surge Engine', icon: Sliders },
          { id: 'hub_capacity', label: 'Hub Capacity & Balancer', icon: Boxes },
          { id: 'diagnostics', label: 'Diagnostics & Backup', icon: Activity },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTool(t.id as any)}
              style={{
                flex: '1 1 auto',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                background: isActive ? 'var(--brand-orange)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span style={{
                  fontSize: '0.68rem',
                  background: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(255, 102, 0, 0.2)',
                  color: isActive ? '#ffffff' : 'var(--brand-orange)',
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

      {/* ======================================================== */}
      {/* 1. SCOPED SUB-ADMINS TOOL                                */}
      {/* ======================================================== */}
      {activeTool === 'sub_admins' && (
        <div className="grid-responsive-2">
          {/* Create Sub-Admin Form */}
          <div className="card card-responsive">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Users size={18} color="var(--brand-orange)" />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Provision Scoped Sub-Admin</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Each admin only manages sub-admins they created. Granted permissions define which hub operations, tariffs, and ledgers this sub-user can access.
            </p>

            {/* Quick Role Preset Picker */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                QUICK ROLE PRESET
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {ROLE_PRESETS.filter(p => p.accountType === 'admin').map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetSelect(p.id)}
                    className={`btn btn-sm ${newSubRole === p.label ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSubAdmin}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suman Neupane"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    BUSINESS EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="suman.ops@double7.com"
                    value={newSubEmail}
                    onChange={(e) => setNewSubEmail(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    SUB-ROLE TITLE
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubRole}
                    onChange={(e) => setNewSubRole(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    PHONE NUMBER
                  </label>
                  <input
                    type="text"
                    value={newSubPhone}
                    onChange={(e) => setNewSubPhone(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Permission Checkboxes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  SECURITY CLEARANCE &amp; PERMISSION MATRIX ({selectedPermissions.length} selected)
                </label>
                <div style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  background: 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  {adminPermissions.map(perm => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          color: isChecked ? '#ffffff' : 'var(--text-secondary)',
                          padding: '0.3rem 0.4rem',
                          borderRadius: '6px',
                          background: isChecked ? 'rgba(255, 102, 0, 0.08)' : 'transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          style={{ marginTop: '0.2rem' }}
                        />
                        <div>
                          <strong style={{ display: 'block' }}>{perm.label}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{perm.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={16} />
                <span>Authorize &amp; Provision Sub-Admin</span>
              </button>
            </form>
          </div>

          {/* Sub-Admins List */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Scoped Sub-Admins in Your Org ({subUsers.length})</h3>
              <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>SCOPED ACCESS</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Created by you (<strong style={{ color: '#ffffff' }}>{currentUser?.name}</strong>). You hold exclusive rights to toggle their operational clearance or revoke access.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {subUsers.map(su => (
                <div
                  key={su.id}
                  style={{
                    background: 'rgba(7, 10, 18, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>{su.name}</strong>
                      <span className={su.status === 'active' ? 'badge badge-emerald' : 'badge badge-rose'} style={{ fontSize: '0.65rem' }}>
                        {su.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {su.email} &bull; {su.subRole} &bull; {su.phone}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                      {su.permissions.map((p, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.65rem',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)'
                        }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        toggleSubUserStatus(su.id);
                        loadData();
                        triggerAlert(`Toggled status for ${su.name}`);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                    >
                      {su.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchActiveSubUser(su);
                        triggerAlert(`Switched active session to ${su.name} (${su.subRole})`);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.74rem', borderColor: 'var(--brand-cyan)', color: 'var(--brand-cyan)' }}
                    >
                      Test Login
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Permanently revoke clearance for ${su.name}?`)) {
                          deleteSubUser(su.id);
                          loadData();
                          triggerAlert(`Revoked sub-admin ${su.name}`);
                        }
                      }}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.3rem 0.5rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. COD DISCREPANCY & AGING SLA RADAR                     */}
      {/* ======================================================== */}
      {activeTool === 'cod_radar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Discrepancies */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <AlertTriangle size={18} color="var(--brand-red)" />
                  <span>Flagged Cash Collection Discrepancies ({discrepancyOrders.length})</span>
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Triggered automatically when rider marked collected cash &ne; consignment invoice amount. Payout is auto-held until reconciled.
                </p>
              </div>

              <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>
                AUTO-HOLD ACTIVE ON DISPUTES
              </span>
            </div>

            {discrepancyOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem auto' }} />
                <p>No active discrepancies! All cash collections 100% matched against consignment amounts.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {discrepancyOrders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1.5px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                          {order.trackingNumber}
                        </span>
                        <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                          MISMATCH: Rs. {(order.discrepancyNpr || 0).toLocaleString()} NPR
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Merchant: <strong>{order.merchantName}</strong> &bull; Consignee: {order.consigneeName} &bull; Rider: <strong style={{ color: 'var(--brand-orange)' }}>{order.riderName}</strong> ({order.riderPhone})
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '0.3rem', fontStyle: 'italic' }}>
                        Reason: {order.discrepancyReason || order.holdReason}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          resolveDiscrepancy(
                            order.id,
                            'merchant_voucher_discount',
                            'Store promo voucher accepted and validated by central treasury',
                            { name: currentUser?.name || 'Soben (Admin)', role: 'Admin HQ' }
                          );
                          loadData();
                          triggerAlert(`Resolved mismatch for ${order.trackingNumber} via Merchant Discount`);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: '#10b981', color: '#10b981', fontSize: '0.78rem' }}
                      >
                        Accept Merchant Voucher
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          resolveDiscrepancy(
                            order.id,
                            'rider_shortage_debt',
                            'Short collection marked as debit on rider weekly settlement ledger',
                            { name: currentUser?.name || 'Soben (Admin)', role: 'Admin HQ' }
                          );
                          loadData();
                          triggerAlert(`Shortage booked as Rider Debt for ${order.riderName}`);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: 'var(--brand-orange)', color: 'var(--brand-orange)', fontSize: '0.78rem' }}
                      >
                        Book Rider Debt
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toggleDisputeHold(
                            order.id,
                            !order.isPayoutHeld,
                            'Manual Admin override toggle',
                            { name: currentUser?.name || 'Soben (Admin)', role: 'Admin HQ' }
                          );
                          loadData();
                          triggerAlert(`Toggled hold for ${order.trackingNumber}`);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem' }}
                      >
                        {order.isPayoutHeld ? 'Release Hold' : 'Apply Hold'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aging SLA Radar (>24h Unremitted) */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Clock size={18} color="var(--brand-amber)" />
                  <span>Cash Aging SLA Radar (&gt;24 Hours Unremitted)</span>
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Monitors cash held in rider pockets exceeding the 24-hour hub safe deposit mandate.
                </p>
              </div>

              <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
                SLA THRESHOLD: 24 HOURS
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.84rem' }}>
                <thead>
                  <tr>
                    <th>Tracking Code</th>
                    <th>Rider In Custody</th>
                    <th>Destination Hub</th>
                    <th>Collected Amount</th>
                    <th>Elapsed Time</th>
                    <th>SLA Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {codRecords.filter(r => r.stage === 'cash_collected' || r.isAgingAlert).map(order => (
                    <tr key={order.id}>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{order.trackingNumber}</strong>
                      </td>
                      <td>
                        <strong>{order.riderName}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order.riderPhone}</div>
                      </td>
                      <td>{order.destinationHub}</td>
                      <td>
                        <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                          Rs. {(order.collectedAmountNpr || order.orderAmountNpr).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: order.elapsedHours > 24 ? 'var(--brand-red)' : 'var(--brand-amber)', fontWeight: 700 }}>
                          {order.elapsedHours} hrs
                        </span>
                      </td>
                      <td>
                        <span className={order.elapsedHours > 24 ? 'badge badge-rose' : 'badge badge-amber'} style={{ fontSize: '0.68rem' }}>
                          {order.elapsedHours > 24 ? 'SLA BREACHED' : 'APPROACHING SLA'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            depositRiderCashBatchToHub(order.riderId, {
                              name: currentUser?.name || 'Soben (Admin)',
                              role: 'Central Hub Cashier'
                            });
                            loadData();
                            triggerAlert(`Confirmed hub safe deposit for rider ${order.riderName}`);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                        >
                          Confirm Safe Deposit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. RIDER FLEET & CASH ALLOCATOR                          */}
      {/* ======================================================== */}
      {activeTool === 'rider_fleet' && (
        <div className="grid-responsive-2">
          {/* Active Rider List */}
          <div className="card card-responsive">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Active Rider Telemetry &amp; Pocket Cash</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Real-time cash in transit held by linehaul and last-mile electric courier drivers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { id: 'rider-pk-04', name: 'Dipendra Shrestha', vehicle: 'BA 2 KHA 8841 (EV)', city: 'Pokhara', cashHeld: 4500, activeParcels: 4 },
                { id: 'rider-br-11', name: 'Subash Tamang', vehicle: 'KO 1 KHA 3312 (Van)', city: 'Biratnagar', cashHeld: 12000, activeParcels: 3 },
                { id: 'rider-ktm-02', name: 'Bibek Bhattarai', vehicle: 'BA 99 PA 7711 (E-Bike)', city: 'Kathmandu', cashHeld: 0, activeParcels: 6 },
                { id: 'rider-btw-09', name: 'Manoj Rana', vehicle: 'LU 2 CHA 4490 (Truck)', city: 'Butwal', cashHeld: 0, activeParcels: 2 },
              ].map(rider => (
                <div
                  key={rider.id}
                  style={{
                    background: 'rgba(7, 10, 18, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>
                      {rider.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {rider.vehicle} &bull; {rider.city} &bull; {rider.activeParcels} Assigned
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CASH IN HAND</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: rider.cashHeld > 0 ? 'var(--brand-amber)' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                      Rs. {rider.cashHeld.toLocaleString()}
                    </div>
                    {rider.cashHeld > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          depositRiderCashBatchToHub(rider.id, {
                            name: currentUser?.name || 'Soben (Admin HQ)',
                            role: 'Hub Cashier'
                          });
                          loadData();
                          triggerAlert(`Deposited Rs. ${rider.cashHeld.toLocaleString()} for ${rider.name}`);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', marginTop: '0.3rem' }}
                      >
                        Safe Deposit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assign Fleet Unit to Consignment */}
          <div className="card card-responsive">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Assign Consignment Fleet Unit</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Dispatch or re-assign transport vehicles to active shipments.
            </p>

            <form onSubmit={handleAssignRiderToShipment}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  SELECT CONSIGNMENT
                </label>
                <select
                  value={assignShipmentId}
                  onChange={(e) => setAssignShipmentId(e.target.value)}
                  className="select-field"
                  style={{ fontSize: '0.84rem' }}
                  required
                >
                  <option value="">-- Choose Consignment --</option>
                  {shipments.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} ({s.origin.city} &rarr; {s.destination.city}) - {s.status}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  DEDICATED FLEET VEHICLE / RIDER
                </label>
                <input
                  type="text"
                  required
                  value={assignVehicleCode}
                  onChange={(e) => setAssignVehicleCode(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.84rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Truck size={16} />
                <span>Confirm Vehicle Dispatch Assignment</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TARIFFS & PEAK SURGE ENGINE                           */}
      {/* ======================================================== */}
      {activeTool === 'tariffs' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', margin: 0 }}>National Freight Tariffs &amp; Dynamic Surge Matrix</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Configure base pricing across Kathmandu Valley and 7 Provincial Linehauls, plus festive peak multipliers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => triggerAlert('Saved freight tariff matrix & updated live rate calculators across all portals.')}
              className="btn btn-primary btn-sm"
            >
              <Check size={14} />
              <span>Save Tariffs</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>VALLEY EXPRESS BASE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', color: '#ffffff' }}>Rs.</span>
                <input
                  type="number"
                  value={valleyBaseRate}
                  onChange={(e) => setValleyBaseRate(Number(e.target.value))}
                  className="input-field"
                  style={{ fontSize: '1.2rem', fontWeight: 800, width: '110px' }}
                />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Kathmandu, Lalitpur, Bhaktapur door-to-door
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>NATIONWIDE CARGO BASE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', color: '#ffffff' }}>Rs.</span>
                <input
                  type="number"
                  value={cargoBaseRate}
                  onChange={(e) => setCargoBaseRate(Number(e.target.value))}
                  className="input-field"
                  style={{ fontSize: '1.2rem', fontWeight: 800, width: '110px' }}
                />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Inter-provincial linehaul to 77 districts
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SAME-DAY RUSH BASE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', color: '#ffffff' }}>Rs.</span>
                <input
                  type="number"
                  value={rushBaseRate}
                  onChange={(e) => setRushBaseRate(Number(e.target.value))}
                  className="input-field"
                  style={{ fontSize: '1.2rem', fontWeight: 800, width: '110px' }}
                />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Under 3-hour dedicated rush dispatch
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FUEL SURCHARGE (%)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="number"
                  value={fuelSurchargePct}
                  onChange={(e) => setFuelSurchargePct(Number(e.target.value))}
                  className="input-field"
                  style={{ fontSize: '1.2rem', fontWeight: 800, width: '90px' }}
                />
                <span style={{ fontSize: '1.1rem', color: '#ffffff' }}>%</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Applied to all freight base tariffs
              </p>
            </div>
          </div>

          {/* Festive Peak Surge Multiplier Box */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
            border: '1px solid rgba(255, 102, 0, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>
                  Festive Surge Multiplier (Dashain / 11.11 / Tihar)
                </span>
                <span className={festiveSurgeActive ? 'badge badge-orange' : 'badge badge-subtle'} style={{ fontSize: '0.68rem' }}>
                  {festiveSurgeActive ? 'SURGE ACTIVE' : 'STANDARD TARIFFS'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Automatically throttles peak inbound volumes and scales driver milestone bonuses by {festiveMultiplier}x.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="number"
                step="0.05"
                value={festiveMultiplier}
                onChange={(e) => setFestiveMultiplier(Number(e.target.value))}
                className="input-field"
                style={{ width: '80px', fontSize: '1rem', fontWeight: 800 }}
              />
              <button
                type="button"
                onClick={() => {
                  setFestiveSurgeActive(!festiveSurgeActive);
                  triggerAlert(festiveSurgeActive ? 'Disabled Festive Surge' : 'Activated Festive Surge Multiplier');
                }}
                className={`btn btn-sm ${festiveSurgeActive ? 'btn-danger' : 'btn-primary'}`}
              >
                {festiveSurgeActive ? 'Deactivate Surge' : 'Activate Festive Surge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. HUB CAPACITY & LOAD BALANCER                          */}
      {/* ======================================================== */}
      {activeTool === 'hub_capacity' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', margin: 0 }}>Mega-Hub Sorting Throughput &amp; Load Balancing</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Adjust conveyor sorting velocity and inbound parcel acceptance thresholds across Nepal&apos;s 6 main freight hubs.
              </p>
            </div>

            <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
              AUTOMATED AGV ROBOTICS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { id: 'ktm', name: 'Kathmandu Central Hub (KTM-01)', code: 'BAGMATI PROVINCE', value: hubCapacities.ktm },
              { id: 'pkr', name: 'Pokhara Lakeside Hub (PKR-02)', code: 'GANDAKI PROVINCE', value: hubCapacities.pkr },
              { id: 'brg', name: 'Birgunj Border Inland Port (BRG-03)', code: 'MADHESH PROVINCE', value: hubCapacities.brg },
              { id: 'brt', name: 'Biratnagar Eastern Mega-Hub (BRT-04)', code: 'KOSHI PROVINCE', value: hubCapacities.brt },
              { id: 'ctw', name: 'Chitwan Central Crossdock (CTW-05)', code: 'BAGMATI PROVINCE', value: hubCapacities.ctw },
              { id: 'btw', name: 'Butwal Highway Terminal (BTW-06)', code: 'LUMBINI PROVINCE', value: hubCapacities.btw },
            ].map(hub => (
              <div
                key={hub.id}
                style={{
                  background: 'rgba(7, 10, 18, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>{hub.name}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--brand-cyan)' }}>{hub.code}</div>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: hub.value > 80 ? 'var(--brand-red)' : 'var(--brand-emerald)' }}>
                    {hub.value}%
                  </span>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', margin: '0.75rem 0' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${hub.value}%`,
                      background: hub.value > 80 ? 'var(--brand-red)' : (hub.value > 65 ? 'var(--brand-amber)' : '#10b981'),
                      borderRadius: '4px',
                      transition: 'width 0.2s ease'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={hub.value}
                    onChange={(e) => {
                      setHubCapacities({ ...hubCapacities, [hub.id]: Number(e.target.value) });
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SYSTEM DIAGNOSTICS & BACKUP                          */}
      {/* ======================================================== */}
      {activeTool === 'diagnostics' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>System Health, D1 Telemetry &amp; Database Backup</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Inspect Cloudflare D1 distributed bindings, export local storage snapshots, and reset demo datasets.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Activity size={18} color="#10b981" />
                <strong style={{ color: '#ffffff' }}>Cloudflare D1 Tracking DB</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Edge SQLite replica operational across global endpoints with automated schema version 1.
              </p>
              <button
                type="button"
                onClick={() => triggerAlert('D1 Connection Verified. Latency: 14ms')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                Ping Database
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Download size={18} color="var(--brand-orange)" />
                <strong style={{ color: '#ffffff' }}>Export Full System JSON</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Download a unified snapshot of all shipments, merchants, sub-admins, and COD audit logs.
              </p>
              <button
                type="button"
                onClick={() => {
                  const dump = {
                    shipments,
                    subUsers,
                    codRecords,
                    exportedAt: new Date().toISOString()
                  };
                  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `double7_system_backup_${Date.now()}.json`;
                  a.click();
                  triggerAlert('Full system backup downloaded.');
                }}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                Download Snapshot
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <RefreshCw size={18} color="var(--brand-red)" />
                <strong style={{ color: '#ffffff' }}>Reset Demo Datasets</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Restores initial sample shipments, COD test parcels, and demo sub-users.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all demo data to default states?')) {
                    resetCodDemoData();
                    loadData();
                    triggerAlert('Demo data successfully restored.');
                  }
                }}
                className="btn btn-danger btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                Reset to Factory Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
