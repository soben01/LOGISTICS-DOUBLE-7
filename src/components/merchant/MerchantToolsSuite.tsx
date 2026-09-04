'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  Users,
  Banknote,
  Truck,
  Boxes,
  Sliders,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Plus,
  Search,
  FileText,
  Printer,
  Calendar,
  RotateCcw,
  Zap,
  KeyRound,
  Download,
  Phone,
  Mail,
  Copy,
  Check,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Send
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
  scheduleNdrReattempt,
  initiateRtoReturn
} from '../../lib/cod';
import { SYSTEM_PERMISSIONS, ROLE_PRESETS } from '../../lib/permissions';
import { calculateDomesticFreightRate, createShipment } from '../../lib/store';

interface Props {
  onNotice?: (msg: string) => void;
}

export default function MerchantToolsSuite({ onNotice }: Props) {
  const [activeTool, setActiveTool] = useState<
    'staff' | 'cod_settlement' | 'ndr_manager' | 'bulk_dispatch' | 'rate_calc' | 'api_webhooks'
  >('staff');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subStaff, setSubStaff] = useState<SubUser[]>([]);
  const [codRecords, setCodRecords] = useState<CodOrderRecord[]>([]);

  // Staff creation state
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('Warehouse Dispatcher');
  const [staffPhone, setStaffPhone] = useState('+977 98410 00000');
  const [selectedStaffPerms, setSelectedStaffPerms] = useState<string[]>([
    'merchant:create_consignments',
    'merchant:print_waybills',
    'merchant:barcode_scan'
  ]);

  // Payout request modal state
  const [payoutAmount, setPayoutAmount] = useState<number>(10000);
  const [payoutBank, setPayoutBank] = useState<string>('Nabil Bank Ltd (Acc: 010203040506)');
  const [payoutReceipt, setPayoutReceipt] = useState<any>(null);

  // NDR actions state
  const [ndrNote, setNdrNote] = useState<string>('Customer confirmed available tomorrow 10:00 AM');

  // Rate calculator state
  const [calcWeight, setCalcWeight] = useState<number>(2.5);
  const [calcL, setCalcL] = useState<number>(25);
  const [calcW, setCalcW] = useState<number>(20);
  const [calcH, setCalcH] = useState<number>(15);
  const [calcOrigin, setCalcOrigin] = useState<string>('Kathmandu');
  const [calcDest, setCalcDest] = useState<string>('Pokhara');
  const [calculatedRates, setCalculatedRates] = useState<any[]>([]);

  // API Key state
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://mystore.np/api/double7-webhook');
  const [webhookTestStatus, setWebhookTestStatus] = useState<string>('');

  const triggerAlert = (msg: string) => {
    if (onNotice) onNotice(msg);
  };

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    // Sub-merchants scoped strictly to this merchant account
    setSubStaff(getSubUsers('merchant', user?.id || 'usr-merch-default'));
    setCodRecords(getCodRecords(user?.id || 'usr-merch-default'));
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

  // Compute rates on change
  useEffect(() => {
    const rates = calculateDomesticFreightRate({
      originCity: calcOrigin,
      destCity: calcDest,
      weightKg: calcWeight,
      lengthCm: calcL,
      widthCm: calcW,
      heightCm: calcH
    });
    setCalculatedRates(rates);
  }, [calcWeight, calcL, calcW, calcH, calcOrigin, calcDest]);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) {
      triggerAlert('Please enter staff name and business email.');
      return;
    }

    const res = addSubUser({
      name: staffName.trim(),
      email: staffEmail.trim(),
      role: 'merchant',
      subRole: staffRole,
      parentId: currentUser?.id || 'usr-merch-default',
      parentName: currentUser?.company || 'Nepal Merchant Pvt Ltd',
      phone: staffPhone.trim(),
      permissions: selectedStaffPerms
    });

    if (res.success) {
      triggerAlert(`Added staff member: ${staffName} (${staffRole})`);
      setStaffName('');
      setStaffEmail('');
      loadData();
    } else {
      triggerAlert(`Error: ${res.error}`);
    }
  };

  const handleStaffPresetSelect = (presetId: string) => {
    const preset = ROLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setStaffRole(preset.label);
      setSelectedStaffPerms(preset.permissions);
    }
  };

  const toggleStaffPermission = (permId: string) => {
    if (selectedStaffPerms.includes(permId)) {
      setSelectedStaffPerms(selectedStaffPerms.filter(p => p !== permId));
    } else {
      setSelectedStaffPerms([...selectedStaffPerms, permId]);
    }
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount <= 0) return;

    const receipt = {
      payoutId: `PAY-D7-${Math.floor(10000 + Math.random() * 90000)}`,
      merchantName: currentUser?.company || 'Nepal Merchant Pvt Ltd',
      bankDetails: payoutBank,
      amountNpr: payoutAmount,
      feeNpr: 0,
      timestamp: new Date().toLocaleString(),
      status: 'SCHEDULED (10:00 AM NPT NEXT DAY BANK CLEARING)'
    };
    setPayoutReceipt(receipt);
    triggerAlert(`Scheduled bank remittance payout of Rs. ${payoutAmount.toLocaleString()} NPR`);
  };

  // Bulk Dispatch Generator
  const handleGenerateBatchConsignments = () => {
    const cities = ['Pokhara', 'Biratnagar', 'Butwal', 'Birgunj', 'Dharan', 'Chitwan'];
    const names = ['Binod Aryal', 'Puspa Gautam', 'Sanjay KC', 'Anjali Shrestha', 'Kiran Joshi'];

    for (let i = 0; i < 3; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      createShipment({
        service: 'Double 7 Nepal Express',
        serviceCode: 'EXP',
        origin: { city: 'Kathmandu', hub: 'Kathmandu Central Hub' },
        destination: { city, hub: `${city} Regional Hub` },
        sender: {
          name: currentUser?.name || 'Verified Merchant',
          company: currentUser?.company || 'Nepal E-Commerce Merchant',
          phone: currentUser?.phone || '+977 1 4411000'
        },
        recipient: {
          name,
          company: 'Personal Consignee',
          address: `${city} Main Road, Ward 2`,
          phone: `+977 98${Math.floor(10000000 + Math.random() * 90000000)}`
        },
        cargo: {
          pieces: 1,
          weightKg: Number((1.5 + Math.random() * 3).toFixed(1)),
          description: 'E-Commerce Merchant Merchandise (Batch Dispatch)',
          declaredValueNpr: Math.floor(2500 + Math.random() * 5000)
        }
      });
    }

    triggerAlert('Generated 3 batch consignments with instant digital waybills.');
    window.location.reload();
  };

  const merchantPerms = SYSTEM_PERMISSIONS.filter(p => p.scope === 'merchant' || p.scope === 'both');

  // NDR Orders
  const ndrOrders = codRecords.filter(r => r.stage === 'failed' || r.status === 'failed');

  // Settlement totals
  const totalReconciled = codRecords.filter(r => r.stage === 'reconciled').reduce((sum, r) => sum + r.orderAmountNpr, 0);
  const totalSettled = codRecords.filter(r => r.stage === 'settled').reduce((sum, r) => sum + r.orderAmountNpr, 0);
  const totalDisputed = codRecords.filter(r => r.isPayoutHeld).reduce((sum, r) => sum + r.orderAmountNpr, 0);

  return (
    <div style={{ marginTop: '2.5rem' }}>
      {/* Tool Header & Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} className="badge badge-cyan">
            <Building size={13} />
            <span>MERCHANT OPERATIONAL TOOLS</span>
          </div>
          <h2 style={{ fontSize: '1.55rem', margin: '0.35rem 0 0.15rem 0' }}>
            Merchant Administration &amp; Self-Service Tools
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Scoped staff provisioning, daily COD bank settlement, NDR re-attempt coordination, and developer API keys.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(11, 17, 32, 0.95)',
          padding: '0.35rem',
          borderRadius: '10px',
          border: '1px solid var(--border-medium)',
          gap: '0.3rem',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'staff', label: 'Store Staff (Sub-Merchants)', icon: Users, count: subStaff.length },
            { id: 'cod_settlement', label: 'COD Settlement & Payout', icon: Banknote },
            { id: 'ndr_manager', label: 'NDR Re-attempt Desk', icon: Clock, count: ndrOrders.length },
            { id: 'bulk_dispatch', label: 'Bulk Batch Dispatch', icon: Boxes },
            { id: 'rate_calc', label: 'Shipping Calculator', icon: Calculator },
            { id: 'api_webhooks', label: 'API Keys & Webhooks', icon: KeyRound },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTool(t.id as any)}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '7px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: isActive ? 'var(--brand-cyan)' : 'transparent',
                  color: isActive ? '#070a13' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span style={{
                    fontSize: '0.65rem',
                    background: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(6, 182, 212, 0.25)',
                    color: isActive ? '#000000' : 'var(--brand-cyan)',
                    padding: '0.08rem 0.4rem',
                    borderRadius: '8px'
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. STORE STAFF (SUB-MERCHANTS)                           */}
      {/* ======================================================== */}
      {activeTool === 'staff' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          {/* Add Staff Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Users size={18} color="var(--brand-cyan)" />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Add Sub-Merchant Staff</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Staff added here can only view and manage consignments belonging to <strong style={{ color: '#ffffff' }}>{currentUser?.company}</strong>. They have zero access to other merchants or admin telemetry.
            </p>

            {/* Quick Presets */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                MERCHANT ROLE PRESET
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {ROLE_PRESETS.filter(p => p.accountType === 'merchant' && p.id !== 'merchant_owner').map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleStaffPresetSelect(p.id)}
                    className={`btn btn-sm ${staffRole === p.label ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    STAFF NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
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
                    placeholder="ramesh@yourstore.np"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    POSITION / SUB-ROLE
                  </label>
                  <input
                    type="text"
                    required
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
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
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Scoped Permissions */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  SCOPED STORE PERMISSIONS ({selectedStaffPerms.length} active)
                </label>
                <div style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  background: 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  {merchantPerms.map(perm => {
                    const isChecked = selectedStaffPerms.includes(perm.id);
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
                          background: isChecked ? 'rgba(6, 182, 212, 0.08)' : 'transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStaffPermission(perm.id)}
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
                <span>Add Sub-Merchant Staff</span>
              </button>
            </form>
          </div>

          {/* Active Staff List */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Active Store Staff ({subStaff.length})</h3>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>STORE SCOPED</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your delegated store team. Only you as the merchant owner can provision credentials and adjust task clearances.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {subStaff.map(su => (
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
                      {su.email} &bull; <strong style={{ color: 'var(--brand-cyan)' }}>{su.subRole}</strong> &bull; {su.phone}
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
                        triggerAlert(`Switched session to ${su.name} (${su.subRole})`);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.74rem', borderColor: 'var(--brand-cyan)', color: 'var(--brand-cyan)' }}
                    >
                      Test Login
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. COD SETTLEMENT & BANK PAYOUT CONSOLE                  */}
      {/* ======================================================== */}
      {activeTool === 'cod_settlement' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
          {/* Balance Cards & Request Payout */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Request Bank Remittance Transfer</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Remittance payouts are deposited daily at 10:00 AM NPT via Nepal Clearing House (NCHL-IPS / ConnectIPS).
            </p>

            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVAILABLE RECONCILED COD</span>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)', margin: '0.3rem 0' }}>
                Rs. {(currentUser?.codBalanceNpr || 24500).toLocaleString()} NPR
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                100% Hub safe verified &bull; Ready for instant bank transfer
              </div>
            </div>

            <form onSubmit={handlePayoutSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  PAYOUT WITHDRAWAL AMOUNT (NPR)
                </label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="input-field"
                  style={{ fontSize: '1rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  REGISTERED NEPAL BANK ACCOUNT
                </label>
                <input
                  type="text"
                  required
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.84rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Banknote size={16} />
                <span>Submit Bank Transfer Request</span>
              </button>
            </form>
          </div>

          {/* Settlement Voucher & Payout History */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Settlement Voucher &amp; Statement</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Official tax invoice and bank payout clearing statements for your accounting ledger.
            </p>

            {payoutReceipt ? (
              <div style={{
                background: 'rgba(7, 10, 18, 0.9)',
                border: '1px solid #10b981',
                borderRadius: '12px',
                padding: '1.5rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>OFFICIAL BANK VOUCHER</span>
                    <div style={{ fontWeight: 800, color: '#ffffff', marginTop: '0.3rem' }}>{payoutReceipt.payoutId}</div>
                  </div>
                  <Printer size={18} color="#10b981" style={{ cursor: 'pointer' }} onClick={() => window.print()} />
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  <div>Merchant: <strong style={{ color: '#ffffff' }}>{payoutReceipt.merchantName}</strong></div>
                  <div>Account: {payoutReceipt.bankDetails}</div>
                  <div>Amount: <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>Rs. {payoutReceipt.amountNpr.toLocaleString()} NPR</strong></div>
                  <div>Platform Fee: NPR 0 (Free Merchant Remittance)</div>
                  <div>Status: <span style={{ color: '#10b981' }}>{payoutReceipt.status}</span></div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerAlert('Downloaded PDF Settlement Statement.')}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', marginTop: '1.25rem', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  <Download size={14} />
                  <span>Download Tax-Compliant PDF</span>
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                <FileText size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                <p>Submit a payout request to view your official bank clearing statement.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. NDR RE-ATTEMPT DESK                                  */}
      {/* ======================================================== */}
      {activeTool === 'ndr_manager' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--brand-amber)" />
                <span>Non-Delivery Reports (NDR) &amp; Re-attempt Desk ({ndrOrders.length})</span>
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Handle parcels that failed delivery due to customer unavailability, wrong address, or requested reschedule.
              </p>
            </div>

            <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
              RE-ATTEMPT SLA: 3 MAXIMUM TRIES
            </span>
          </div>

          {ndrOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.5rem auto' }} />
              <p>Zero delivery failures! 100% of your parcels have been successfully handed over or are on active routes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ndrOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1.5px solid rgba(245, 158, 11, 0.4)',
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
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#ffffff' }}>
                        {order.trackingNumber}
                      </strong>
                      <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                        DELIVERY FAILED
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Consignee: <strong style={{ color: '#ffffff' }}>{order.consigneeName}</strong> ({order.consigneePhone}) &bull; Destination: {order.destinationCity} &bull; Rider: {order.riderName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--brand-amber)', marginTop: '0.3rem' }}>
                      Latest Exception Note: {order.auditTrail[0]?.note || 'Consignee phone unreachable after multiple attempts.'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        scheduleNdrReattempt(order.id, 'Tomorrow 10:00 AM NPT', ndrNote, {
                          name: currentUser?.name || 'Merchant Owner',
                          role: 'Merchant Dispatcher'
                        });
                        loadData();
                        triggerAlert(`Scheduled next-day reattempt for ${order.trackingNumber}`);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      Schedule Re-attempt
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        initiateRtoReturn(order.id, 'Customer cancelled order after multiple failed contact attempts', {
                          name: currentUser?.name || 'Merchant Owner',
                          role: 'Merchant Dispatcher'
                        });
                        loadData();
                        triggerAlert(`Initiated Return to Origin (RTO) for ${order.trackingNumber}`);
                      }}
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      Authorize RTO Return
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. BULK BATCH DISPATCH TOOL                              */}
      {/* ======================================================== */}
      {activeTool === 'bulk_dispatch' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', margin: 0 }}>Bulk Consignment &amp; Manifest Generator</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Generate batch consignments with 1-click or paste multi-order manifests for instant thermal waybill printing.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateBatchConsignments}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              <span>Simulate 3-Parcel Batch Booking</span>
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
              PASTE CSV / TAB-SEPARATED CONSIGNMENT MANIFEST
            </label>
            <textarea
              rows={4}
              placeholder={`Recipient Name, Phone, Destination City, Cargo Description, COD Amount (NPR)\nAarav Shrestha, +977 98412 11002, Pokhara, Pashmina Shawls, 4500\nPooja Karki, +977 98510 44221, Biratnagar, Organic Tea, 12800`}
              className="input-field"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => triggerAlert('Bulk CSV validated. 2 orders staged for courier collection.')}
                className="btn btn-secondary btn-sm"
              >
                Validate CSV Manifest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SHIPPING CALCULATOR                                   */}
      {/* ======================================================== */}
      {activeTool === 'rate_calc' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Dimensional Weight &amp; Shipping Cost Estimator</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Calculate volumetric billing weight and check rates across Kathmandu Valley, Outstation Linehaul, and Express Rush.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* Input Controls */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    ORIGIN CITY
                  </label>
                  <select
                    value={calcOrigin}
                    onChange={(e) => setCalcOrigin(e.target.value)}
                    className="select-field"
                    style={{ fontSize: '0.84rem' }}
                  >
                    <option value="Kathmandu">Kathmandu</option>
                    <option value="Pokhara">Pokhara</option>
                    <option value="Birgunj">Birgunj</option>
                    <option value="Biratnagar">Biratnagar</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    DESTINATION CITY
                  </label>
                  <select
                    value={calcDest}
                    onChange={(e) => setCalcDest(e.target.value)}
                    className="select-field"
                    style={{ fontSize: '0.84rem' }}
                  >
                    <option value="Pokhara">Pokhara</option>
                    <option value="Kathmandu">Kathmandu</option>
                    <option value="Biratnagar">Biratnagar</option>
                    <option value="Butwal">Butwal</option>
                    <option value="Dharan">Dharan</option>
                    <option value="Chitwan">Chitwan</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>WEIGHT (KG)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    className="input-field"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>L (CM)</label>
                  <input
                    type="number"
                    value={calcL}
                    onChange={(e) => setCalcL(Number(e.target.value))}
                    className="input-field"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>W (CM)</label>
                  <input
                    type="number"
                    value={calcW}
                    onChange={(e) => setCalcW(Number(e.target.value))}
                    className="input-field"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>H (CM)</label>
                  <input
                    type="number"
                    value={calcH}
                    onChange={(e) => setCalcH(Number(e.target.value))}
                    className="input-field"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Volumetric Weight: <strong style={{ color: '#ffffff' }}>{((calcL * calcW * calcH) / 5000).toFixed(2)} KG</strong> (Formula: L&times;W&times;H / 5000). Chargeable weight is whichever is greater.
              </div>
            </div>

            {/* Calculated Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {calculatedRates.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    background: opt.recommended ? 'rgba(255, 102, 0, 0.08)' : 'rgba(7, 10, 18, 0.7)',
                    border: opt.recommended ? '1.5px solid var(--brand-orange)' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{opt.serviceName}</strong>
                      {opt.recommended && <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>BEST VALUE</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Transit: {opt.transitDays}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: opt.recommended ? 'var(--brand-orange)' : '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      Rs. {opt.estimatedCostNpr} <span style={{ fontSize: '0.75rem' }}>NPR</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. API KEYS & WEBHOOKS                                   */}
      {/* ======================================================== */}
      {activeTool === 'api_webhooks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Developer API Credentials</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Authenticate your Shopify, WooCommerce, or custom storefront to book consignments and query tracking automatically.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                PUBLISHABLE MERCHANT API KEY
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value="d7_live_pk_994038102488aefc"
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('d7_live_pk_994038102488aefc');
                    setApiKeyCopied(true);
                    setTimeout(() => setApiKeyCopied(false), 2000);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  {apiKeyCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                REST SECRET KEY (KEEP PRIVATE)
              </label>
              <input
                type="password"
                readOnly
                value="d7_sec_994038102488aefc_secret_production"
                className="input-field"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Webhook Dispatch Notifications</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Double 7 posts real-time HTTP payloads whenever a parcel changes status or cash is remitted.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                YOUR WEBHOOK ENDPOINT URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setWebhookTestStatus('Simulating delivery event dispatch...');
                setTimeout(() => {
                  setWebhookTestStatus('HTTP 200 OK received from endpoint in 42ms.');
                  triggerAlert('Webhook test ping succeeded!');
                }, 800);
              }}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--brand-cyan)', color: 'var(--brand-cyan)' }}
            >
              <Send size={13} />
              <span>Send Test Webhook Ping</span>
            </button>

            {webhookTestStatus && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                {webhookTestStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
