'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  ShieldCheck,
  Building,
  Truck,
  Boxes,
  Banknote,
  FileText,
  Settings,
  LogOut,
  X,
  ChevronRight,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Cpu,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Users,
  ShieldAlert,
  Plus,
  Trash2,
  KeyRound,
  Check,
  LogIn,
  AlertCircle,
  UserCheck,
  Briefcase
} from 'lucide-react';
import {
  User,
  SubUser,
  getSubUsers,
  addSubUser,
  deleteSubUser,
  switchActiveSubUser,
  loginUser,
  logoutUser,
  updateUserSubRole
} from '../../lib/auth';

interface ProfilePortalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const MERCHANT_SUB_ROLES = [
  {
    id: 'Merchant Consignor / Shipper',
    label: 'Merchant Consignor / Shipper',
    desc: 'Primary merchant authority for booking orders & managing shipments.',
    icon: Building,
    badgeColor: 'var(--brand-cyan)',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    permissions: ['Create Consignments', 'View COD Balances', 'Print Thermal Labels', 'Customer OTP Management']
  },
  {
    id: 'Warehouse Dispatcher',
    label: 'Warehouse Dispatcher',
    desc: 'Sorting, packaging, barcode scanning, and AWB manifest printing.',
    icon: Boxes,
    badgeColor: 'var(--brand-emerald)',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    permissions: ['Barcode Scan Sorting', 'Print Thermal Labels & Manifests', 'Warehouse Inbound/Outbound']
  },
  {
    id: 'Finance & COD Accountant',
    label: 'Finance & COD Accountant',
    desc: 'Cash collection verification, remittance ledger, and bank settlement.',
    icon: Banknote,
    badgeColor: 'var(--brand-amber)',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    permissions: ['COD Remittance Ledger', 'Bank Account Settlement', 'Financial Statements & Tax Invoices']
  },
  {
    id: 'Dispatch Operations Staff',
    label: 'Dispatch Operations Staff',
    desc: 'Fleet coordination, parcel staging, and highway carrier handover.',
    icon: Truck,
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    permissions: ['Fleet Handover', 'Live Route Telemetry', 'Driver Manifests']
  },
  {
    id: 'Customer Support Desk',
    label: 'Customer Support Desk',
    desc: 'Consignee inquiry handling, delivery rescheduling, and NDR resolution.',
    icon: Users,
    badgeColor: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    permissions: ['Real-time Tracking Inquiries', 'NDR Re-attempt Scheduling', 'Customer Dispute Notes']
  }
];

export const ADMIN_SUB_ROLES = [
  {
    id: 'Command HQ / Super Admin',
    label: 'Command HQ / Super Admin',
    desc: 'Full operational control, database telemetry, and platform permissions.',
    icon: ShieldCheck,
    badgeColor: 'var(--brand-orange)',
    badgeBg: 'rgba(255, 102, 0, 0.18)',
    permissions: ['All Database Access', 'User Management', 'Cloudflare Bindings Telemetry', 'System Configuration']
  },
  {
    id: 'Operations & Hub Controller',
    label: 'Operations & Hub Controller',
    desc: 'Intercity linehaul dispatch, hub sort capacity, and transit SLAs.',
    icon: Truck,
    badgeColor: 'var(--brand-cyan)',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    permissions: ['Hub Capacity Scheduling', 'Linehaul Dispatch Routing', 'Transit SLA Monitoring']
  },
  {
    id: 'Compliance & Security Auditor',
    label: 'Compliance & Security Auditor',
    desc: 'Audit trails, merchant KYC verification, and dispute resolution.',
    icon: ShieldAlert,
    badgeColor: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    permissions: ['Audit Trail Inspection', 'KYC & Merchant Risk', 'Dispute Resolution', 'Access Logs']
  },
  {
    id: 'Linehaul Fleet Dispatcher',
    label: 'Linehaul Fleet Dispatcher',
    desc: 'Highway trunk movement, GPS telemetry tracking, and corridor bypass.',
    icon: Boxes,
    badgeColor: 'var(--brand-emerald)',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    permissions: ['Highway Corridor Routing', 'Vehicle Telemetry GPS', 'Fleet Unit Maintenance']
  }
];

const AVAILABLE_PERMISSIONS = [
  'Create Consignments',
  'Print Thermal Labels & Manifests',
  'View COD Collections & Ledgers',
  'Settle Bank Remittances',
  'Live Telemetry & GPS Tracking',
  'Carrier SLA & Route Optimization',
  'Audit KYC & Security Compliance',
  'Customer Support & NDR Handling'
];

export default function ProfilePortalDrawer({
  isOpen,
  onClose,
  currentUser
}: ProfilePortalDrawerProps) {
  const router = useRouter();

  // Drawer Tabs: 'account' | 'subusers' | 'switch'
  const [activeTab, setActiveTab] = useState<'account' | 'subusers' | 'switch'>('account');

  // Sub-Users List
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSubUsers(getSubUsers(currentUser?.role));
    }
  }, [isOpen, currentUser?.role]);

  // Sub-User creation form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');
  const [newSubPassword, setNewSubPassword] = useState('password123');
  const [newSubRole, setNewSubRole] = useState<'merchant' | 'admin'>(currentUser?.role || 'merchant');
  const [newSubClassRole, setNewSubClassRole] = useState<string>(
    (currentUser?.role || 'merchant') === 'admin' ? 'Operations & Hub Controller' : 'Warehouse Dispatcher'
  );
  const [newPermissions, setNewPermissions] = useState<string[]>([
    'Create Consignments',
    'Print Thermal Labels & Manifests',
    'Live Telemetry & GPS Tracking'
  ]);
  const [subUserFormError, setSubUserFormError] = useState('');
  const [subUserSuccessMessage, setSubUserSuccessMessage] = useState('');

  // Sub-Role switcher notification
  const [roleSwitchSuccess, setRoleSwitchSuccess] = useState('');

  // Guest Sub-Login states
  const [guestLoginTab, setGuestLoginTab] = useState<'merchant' | 'admin'>('merchant');
  const [guestSubRole, setGuestSubRole] = useState<string>(
    guestLoginTab === 'admin' ? 'Command HQ / Super Admin' : 'Merchant Consignor / Shipper'
  );
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  if (!isOpen) return null;

  const currentSubRoles = currentUser?.role === 'admin' ? ADMIN_SUB_ROLES : MERCHANT_SUB_ROLES;
  const activeRoleObj = currentSubRoles.find(r => r.id === (currentUser?.subRole || currentSubRoles[0].id)) || currentSubRoles[0];

  const handleSubRoleChange = (newSubRoleTitle: string) => {
    updateUserSubRole(newSubRoleTitle);
    setRoleSwitchSuccess(`Active role switched to: ${newSubRoleTitle}`);
    setTimeout(() => setRoleSwitchSuccess(''), 2500);
  };

  const handleCreateSubUser = (e: React.FormEvent) => {
    e.preventDefault();
    setSubUserFormError('');
    setSubUserSuccessMessage('');

    if (!newSubName.trim()) {
      setSubUserFormError('Full name is required.');
      return;
    }
    if (!newSubEmail.trim() || !newSubEmail.includes('@')) {
      setSubUserFormError('A valid email address is required.');
      return;
    }

    const res = addSubUser({
      name: newSubName.trim(),
      email: newSubEmail.trim(),
      phone: newSubPhone.trim() || '+977 98000 00000',
      password: newSubPassword,
      role: newSubRole,
      subRole: newSubClassRole,
      parentId: currentUser?.id,
      permissions: newPermissions,
    });

    if (!res.success) {
      setSubUserFormError(res.error || 'Failed to create sub-user.');
      return;
    }

    setSubUsers(getSubUsers(currentUser?.role));
    setSubUserSuccessMessage(`Sub-user "${newSubName}" created with role "${newSubClassRole}"!`);
    setShowAddForm(false);
    setNewSubName('');
    setNewSubEmail('');
    setNewSubPhone('');
    setTimeout(() => setSubUserSuccessMessage(''), 3500);
  };

  const handleSwitchToSubUser = (su: SubUser) => {
    switchActiveSubUser(su);
    setRoleSwitchSuccess(`Logged in as: ${su.name} (${su.subRole})`);
    setTimeout(() => {
      setRoleSwitchSuccess('');
      onClose();
      router.push('/dashboard');
    }, 700);
  };

  const handleDeleteSubUser = (id: string, name: string) => {
    if (confirm(`Remove sub-user "${name}" from account control?`)) {
      deleteSubUser(id);
      setSubUsers(getSubUsers(currentUser?.role));
    }
  };

  const togglePermission = (perm: string) => {
    if (newPermissions.includes(perm)) {
      setNewPermissions(newPermissions.filter(p => p !== perm));
    } else {
      setNewPermissions([...newPermissions, perm]);
    }
  };

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    setTimeout(() => {
      const res = loginUser(loginEmail, loginPassword, guestSubRole);
      setLoginLoading(false);
      if (!res.success) {
        setLoginError(res.error || 'Login failed. Please check credentials.');
      } else {
        onClose();
        router.push('/dashboard');
      }
    }, 200);
  };

  const handleLogout = () => {
    logoutUser();
    onClose();
    router.push('/');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(5, 8, 16, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Backdrop Click Outside */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: 'pointer'
        }}
      />

      {/* Drawer Container */}
      <div style={{
        position: 'relative',
        zIndex: 10000,
        width: '100%',
        maxWidth: '520px',
        height: '100vh',
        backgroundColor: 'rgba(10, 15, 29, 0.98)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.95)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: currentUser?.role === 'admin'
                ? 'linear-gradient(135deg, #ff6600 0%, #b33900 100%)'
                : 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800
            }}>
              {currentUser?.role === 'admin' ? <ShieldCheck size={20} /> : <UserIcon size={18} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.02rem', letterSpacing: '-0.01em' }}>
                {currentUser ? 'Enterprise Account Control' : 'Portal Sub-Login'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {currentUser ? `${currentUser.name} • ${currentUser.role === 'admin' ? 'Super Admin HQ' : 'Merchant Consignor'}` : 'Double 7 Logistics Command'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Profile Drawer"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '0.4rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ================= AUTHENTICATED DRAWER NAVIGATION TABS ================= */}
        {currentUser && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(8, 12, 24, 0.6)',
            padding: '0 1rem'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              style={{
                flex: 1,
                padding: '0.75rem 0.5rem',
                border: 'none',
                borderBottom: activeTab === 'account' ? '2px solid var(--brand-orange)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === 'account' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'account' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={14} color={activeTab === 'account' ? 'var(--brand-orange)' : 'currentColor'} />
              <span>Account &amp; Roles</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subusers')}
              style={{
                flex: 1,
                padding: '0.75rem 0.5rem',
                border: 'none',
                borderBottom: activeTab === 'subusers' ? '2px solid var(--brand-cyan)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === 'subusers' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'subusers' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Users size={14} color={activeTab === 'subusers' ? 'var(--brand-cyan)' : 'currentColor'} />
              <span>Sub-Users</span>
              <span style={{
                fontSize: '0.62rem',
                padding: '0.05rem 0.35rem',
                borderRadius: '10px',
                background: 'rgba(6, 182, 212, 0.2)',
                color: 'var(--brand-cyan)',
                fontWeight: 800
              }}>
                {subUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('switch')}
              style={{
                flex: 1,
                padding: '0.75rem 0.5rem',
                border: 'none',
                borderBottom: activeTab === 'switch' ? '2px solid var(--brand-amber)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === 'switch' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: activeTab === 'switch' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <KeyRound size={14} color={activeTab === 'switch' ? 'var(--brand-amber)' : 'currentColor'} />
              <span>Switch Login</span>
            </button>
          </div>
        )}

        {/* Global Toast Alert */}
        {roleSwitchSuccess && (
          <div style={{
            margin: '0.75rem 1.25rem 0 1.25rem',
            padding: '0.65rem 0.85rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '8px',
            color: 'var(--brand-emerald)',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{roleSwitchSuccess}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {subUserSuccessMessage && (
          <div style={{
            margin: '0.75rem 1.25rem 0 1.25rem',
            padding: '0.65rem 0.85rem',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '8px',
            color: 'var(--brand-cyan)',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={16} />
            <span>{subUserSuccessMessage}</span>
          </div>
        )}

        {/* Drawer Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>

          {currentUser ? (
            <>
              {/* ================= TAB 1: ACCOUNT OVERVIEW & ROLES ================= */}
              {activeTab === 'account' && (
                <>
                  {/* Executive Profile Card */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: currentUser.role === 'admin' ? '1px solid rgba(255, 102, 0, 0.35)' : '1px solid rgba(6, 182, 212, 0.35)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-30px',
                      right: '-30px',
                      width: '120px',
                      height: '120px',
                      background: currentUser.role === 'admin' ? 'rgba(255, 102, 0, 0.12)' : 'rgba(6, 182, 212, 0.12)',
                      borderRadius: '50%',
                      filter: 'blur(30px)',
                      pointerEvents: 'none'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: currentUser.role === 'admin'
                            ? 'linear-gradient(135deg, #ff6600, #b45309)'
                            : 'linear-gradient(135deg, #06b6d4, #0d9488)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          color: '#ffffff'
                        }}>
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: 800 }}>
                            {currentUser.name}
                          </h3>
                          <div style={{ fontSize: '0.8rem', color: currentUser.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-cyan)', fontWeight: 600 }}>
                            {currentUser.company}
                          </div>
                        </div>
                      </div>

                      <span className={currentUser.role === 'admin' ? 'badge badge-orange' : 'badge badge-cyan'} style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
                        {currentUser.role === 'admin' ? 'SYSTEM ADMIN' : 'VERIFIED MERCHANT'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Mail size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span>{currentUser.phone}</span>
                      </div>
                    </div>

                    {/* Merchant COD Unsettled Card */}
                    {currentUser.role === 'merchant' && (
                      <div style={{
                        padding: '0.75rem 0.95rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--brand-emerald)', fontWeight: 600 }}>
                            COD UNSETTLED BALANCE:
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                            Rs. {currentUser.codBalanceNpr.toLocaleString()} NPR
                          </div>
                        </div>
                        <Link
                          href="/merchant#cod"
                          onClick={onClose}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          Bank Ledger &rarr;
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Active Sub-Class Role Selection */}
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.6rem'
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
                        ACTIVE SUB-CLASS ROLE:
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        color: activeRoleObj.badgeColor,
                        background: activeRoleObj.badgeBg,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>
                        {activeRoleObj.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {currentSubRoles.map((role) => {
                        const isCurrent = (currentUser.subRole || currentSubRoles[0].id) === role.id;
                        const IconComp = role.icon;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => handleSubRoleChange(role.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.65rem 0.85rem',
                              background: isCurrent ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.02)',
                              border: isCurrent ? `1px solid ${role.badgeColor}` : '1px solid rgba(255, 255, 255, 0.06)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{
                                color: role.badgeColor,
                                background: role.badgeBg,
                                padding: '0.35rem',
                                borderRadius: '6px',
                                display: 'flex'
                              }}>
                                <IconComp size={15} />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                                  {role.label}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                                  {role.desc}
                                </div>
                              </div>
                            </div>
                            {isCurrent && (
                              <span style={{ fontSize: '0.65rem', color: role.badgeColor, fontWeight: 800 }}>
                                ACTIVE
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Role Permissions Matrix */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '0.85rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={13} color="var(--brand-emerald)" />
                      <span>PERMISSIONS GRANTED FOR {activeRoleObj.label.toUpperCase()}:</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {activeRoleObj.permissions.map((perm) => (
                        <span key={perm} style={{
                          fontSize: '0.68rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <Check size={10} color="var(--brand-emerald)" />
                          <span>{perm}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Relative Portal Navigation */}
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                      {currentUser.role === 'admin' ? 'ADMIN CONSOLE SHORTCUTS:' : 'MERCHANT WORKSPACE SHORTCUTS:'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {currentUser.role === 'merchant' ? (
                        <>
                          <Link href="/bookings" onClick={onClose} className="profile-portal-link">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <Boxes size={16} color="var(--brand-orange)" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>My Bookings Registry</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pure shipment records, customer data, and AWB numbers</div>
                              </div>
                            </div>
                            <ChevronRight size={15} color="var(--text-muted)" />
                          </Link>

                          <Link href="/dashboard" onClick={onClose} className="profile-portal-link">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <Cpu size={16} color="var(--brand-cyan)" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>Operations &amp; Telemetry Dashboard</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Real-time GPS coordinates, hub sort capacity, and SLA</div>
                              </div>
                            </div>
                            <ChevronRight size={15} color="var(--text-muted)" />
                          </Link>

                          <Link href="/merchant#cod" onClick={onClose} className="profile-portal-link">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <Banknote size={16} color="var(--brand-emerald)" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>COD Remittance Ledger</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Settled bank transfers and daily collected cash</div>
                              </div>
                            </div>
                            <ChevronRight size={15} color="var(--text-muted)" />
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/dashboard" onClick={onClose} className="profile-portal-link">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <Cpu size={16} color="var(--brand-cyan)" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>Operations &amp; Telemetry Dashboard</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Accurate live telemetry, hub load distribution</div>
                              </div>
                            </div>
                            <ChevronRight size={15} color="var(--text-muted)" />
                          </Link>

                          <Link href="/bookings" onClick={onClose} className="profile-portal-link">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <Boxes size={16} color="var(--brand-amber)" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>All Bookings Data Registry</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pure shipment records, customer search, status updates</div>
                              </div>
                            </div>
                            <ChevronRight size={15} color="var(--text-muted)" />
                          </Link>

                          <Link href="/admin#merchants" onClick={onClose} className="profile-portal-link">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <Users size={16} color="var(--brand-emerald)" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>Merchant Accounts &amp; KYC</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Approve merchants, verify KYC, audit COD transfers</div>
                              </div>
                            </div>
                            <ChevronRight size={15} color="var(--text-muted)" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ================= TAB 2: SUB-USERS & TEAM CONTROL ================= */}
              {activeTab === 'subusers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#ffffff', fontWeight: 800 }}>
                        Sub-User Team Logins
                      </h4>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        Create dedicated logins with custom roles for dispatchers, accountants, and staff.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    >
                      {showAddForm ? <X size={13} /> : <Plus size={13} />}
                      <span>{showAddForm ? 'Cancel' : 'Add Sub-User'}</span>
                    </button>
                  </div>

                  {/* Add Sub-User Form */}
                  {showAddForm && (
                    <form onSubmit={handleCreateSubUser} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-cyan)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Plus size={14} />
                        <span>Create New Sub-User Login</span>
                      </div>

                      {subUserFormError && (
                        <div style={{
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#f87171',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <AlertCircle size={13} />
                          <span>{subUserFormError}</span>
                        </div>
                      )}

                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>Full Name / Staff Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Sharma"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          className="input-field"
                          style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>Staff Login Email</label>
                        <input
                          type="email"
                          placeholder="ramesh.dispatch@merchant.np"
                          value={newSubEmail}
                          onChange={(e) => setNewSubEmail(e.target.value)}
                          className="input-field"
                          style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.75rem' }}>Phone Number</label>
                          <input
                            type="text"
                            placeholder="+977 98000 00000"
                            value={newSubPhone}
                            onChange={(e) => setNewSubPhone(e.target.value)}
                            className="input-field"
                            style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.75rem' }}>Default Password</label>
                          <input
                            type="password"
                            value={newSubPassword}
                            onChange={(e) => setNewSubPassword(e.target.value)}
                            className="input-field"
                            style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                            required
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>Assigned Sub-Class Role</label>
                        <select
                          value={newSubClassRole}
                          onChange={(e) => setNewSubClassRole(e.target.value)}
                          className="input-field"
                          style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                        >
                          {currentSubRoles.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>Granted Permissions</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                          {AVAILABLE_PERMISSIONS.map(perm => (
                            <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={newPermissions.includes(perm)}
                                onChange={() => togglePermission(perm)}
                                style={{ width: '14px', height: '14px', accentColor: 'var(--brand-cyan)' }}
                              />
                              <span>{perm}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.78rem', fontWeight: 700 }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Save &amp; Issue Sub-User Login</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Sub-Users Directory List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {subUsers.length === 0 ? (
                      <div style={{
                        padding: '2rem 1rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.82rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                        border: '1px dashed rgba(255, 255, 255, 0.1)'
                      }}>
                        No sub-users created yet. Click "+ Add Sub-User" to issue staff logins.
                      </div>
                    ) : (
                      subUsers.map((su) => {
                        const isMatchCurrent = currentUser.email.toLowerCase() === su.email.toLowerCase();
                        return (
                          <div
                            key={su.id}
                            style={{
                              background: isMatchCurrent ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                              border: isMatchCurrent ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.07)',
                              borderRadius: '10px',
                              padding: '0.85rem 1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: su.role === 'admin' ? 'rgba(255, 102, 0, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                                  color: su.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-cyan)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.85rem'
                                }}>
                                  {su.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span>{su.name}</span>
                                    {isMatchCurrent && (
                                      <span style={{ fontSize: '0.6rem', color: 'var(--brand-cyan)', fontWeight: 800, background: 'rgba(6, 182, 212, 0.15)', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                                        ACTIVE
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {su.email} {su.phone && `• ${su.phone}`}
                                  </div>
                                </div>
                              </div>

                              <span style={{
                                fontSize: '0.66rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontWeight: 700,
                                background: su.role === 'admin' ? 'rgba(255, 102, 0, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: su.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-emerald)'
                              }}>
                                {su.subRole}
                              </span>
                            </div>

                            {/* Permissions Chips */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {su.permissions.slice(0, 3).map(p => (
                                <span key={p} style={{
                                  fontSize: '0.64rem',
                                  color: 'var(--text-secondary)',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '3px'
                                }}>
                                  {p}
                                </span>
                              ))}
                              {su.permissions.length > 3 && (
                                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                                  +{su.permissions.length - 3} more
                                </span>
                              )}
                            </div>

                            {/* Actions Bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Last active: {su.lastLoginAt || 'Recently'}
                              </span>

                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {!isMatchCurrent && (
                                  <button
                                    type="button"
                                    onClick={() => handleSwitchToSubUser(su)}
                                    className="btn btn-outline btn-sm"
                                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: 'var(--brand-cyan)' }}
                                    title={`Log in as ${su.name}`}
                                  >
                                    <LogIn size={11} />
                                    <span>Switch / Log In</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubUser(su.id, su.name)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem', color: '#f87171' }}
                                  title="Delete sub-user"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ================= TAB 3: SWITCH ACCOUNT / SUB-LOGIN ================= */}
              {activeTab === 'switch' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#ffffff', fontWeight: 800 }}>
                      Quick Switch Credentials
                    </h4>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Fast-switch directly into any sub-user or primary portal role.
                    </div>
                  </div>

                  {/* 1-Click Quick Demo Switch Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        loginUser('soben@double7.com', 'admin123', 'Command HQ / Super Admin');
                        setRoleSwitchSuccess('Switched to Super Admin (Soben)');
                        setTimeout(() => { onClose(); router.push('/dashboard'); }, 600);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 102, 0, 0.08)',
                        border: '1px solid rgba(255, 102, 0, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <ShieldCheck size={18} color="var(--brand-orange)" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#ffffff' }}>
                            Super Admin (Soben)
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            soben@double7.com &bull; Command HQ
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-orange" style={{ fontSize: '0.62rem' }}>SWITCH &rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        loginUser('sobin@merchant.com', 'password123', 'Merchant Consignor / Shipper');
                        setRoleSwitchSuccess('Switched to Verified Merchant (Sobin Upreti)');
                        setTimeout(() => { onClose(); router.push('/dashboard'); }, 600);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Building size={18} color="var(--brand-cyan)" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#ffffff' }}>
                            Verified Merchant (Sobin Upreti)
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            sobin@merchant.com &bull; Consignor
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>SWITCH &rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const warehouseSub = subUsers.find(s => s.subRole.includes('Warehouse')) || {
                          id: 'sub-ramesh',
                          name: 'Ramesh Sharma',
                          email: 'ramesh.warehouse@merchant.np',
                          role: 'merchant',
                          subRole: 'Warehouse Dispatcher',
                          permissions: ['Barcode Scan Sorting', 'Print Thermal Labels'],
                          status: 'active',
                          createdAt: '2026-03-01'
                        };
                        switchActiveSubUser(warehouseSub as any);
                        setRoleSwitchSuccess('Switched to Warehouse Dispatcher (Ramesh Sharma)');
                        setTimeout(() => { onClose(); router.push('/dashboard'); }, 600);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Boxes size={18} color="var(--brand-emerald)" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#ffffff' }}>
                            Warehouse Dispatcher (Ramesh Sharma)
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Barcode sorting &amp; Thermal label printing
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>SWITCH &rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const financeSub = subUsers.find(s => s.subRole.includes('Finance')) || {
                          id: 'sub-sunita',
                          name: 'Sunita Thapa',
                          email: 'sunita.finance@merchant.np',
                          role: 'merchant',
                          subRole: 'Finance & COD Accountant',
                          permissions: ['COD Remittance Ledger', 'Bank Account Settlement'],
                          status: 'active',
                          createdAt: '2026-03-10'
                        };
                        switchActiveSubUser(financeSub as any);
                        setRoleSwitchSuccess('Switched to Finance & COD Accountant (Sunita Thapa)');
                        setTimeout(() => { onClose(); router.push('/dashboard'); }, 600);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Banknote size={18} color="var(--brand-amber)" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#ffffff' }}>
                            Finance Accountant (Sunita Thapa)
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            COD remittance &amp; bank settlements
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>SWITCH &rarr;</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Drawer Bottom Footer Actions */}
              <div style={{
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center', gap: '0.4rem', color: '#ef4444' }}
                >
                  <LogOut size={14} />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </>
          ) : (
            /* ================= GUEST SUB-LOGIN MODE ================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>
                  Portal Sub-Login
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Select your destination portal and sub-class role to access your dashboard.
                </p>
              </div>

              {/* Portal Tabs: Merchant vs Admin */}
              <div style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.25rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setGuestLoginTab('merchant');
                    setGuestSubRole('Merchant Consignor / Shipper');
                    setLoginError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: guestLoginTab === 'merchant' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                    color: guestLoginTab === 'merchant' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: guestLoginTab === 'merchant' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Building size={15} color={guestLoginTab === 'merchant' ? 'var(--brand-cyan)' : 'currentColor'} />
                  <span>Merchant Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGuestLoginTab('admin');
                    setGuestSubRole('Command HQ / Super Admin');
                    setLoginError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: guestLoginTab === 'admin' ? 'rgba(255, 102, 0, 0.2)' : 'transparent',
                    color: guestLoginTab === 'admin' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: guestLoginTab === 'admin' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShieldCheck size={15} color={guestLoginTab === 'admin' ? 'var(--brand-orange)' : 'currentColor'} />
                  <span>Admin Tower</span>
                </button>
              </div>

              {/* Sub-Class Role Options for Selected Portal */}
              <div>
                <label className="input-label" style={{ fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                  Target Sub-Class Role:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(guestLoginTab === 'admin' ? ADMIN_SUB_ROLES : MERCHANT_SUB_ROLES).map((role) => {
                    const isSelected = guestSubRole === role.id;
                    const IconComp = role.icon;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setGuestSubRole(role.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.75rem',
                          background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? `1px solid ${role.badgeColor}` : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <IconComp size={14} color={role.badgeColor} />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>
                              {role.label}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {role.desc}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={13} color={role.badgeColor} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleGuestLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {loginError && (
                  <div style={{
                    padding: '0.65rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <AlertCircle size={14} />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Registered Business Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      placeholder={guestLoginTab === 'admin' ? 'soben@double7.com' : 'merchant@company.com'}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontWeight: 700, marginTop: '0.5rem' }}
                >
                  <LogIn size={15} />
                  <span>{loginLoading ? 'Authenticating...' : `Log In to ${guestLoginTab === 'admin' ? 'Admin Tower' : 'Merchant Portal'}`}</span>
                </button>
              </form>

              {/* Quick Preset Credentials */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '0.85rem',
                fontSize: '0.78rem'
              }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  ONE-CLICK DEMO ACCOUNTS:
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setGuestLoginTab('admin');
                      setGuestSubRole('Command HQ / Super Admin');
                      setLoginEmail('soben@double7.com');
                      setLoginPassword('admin123');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                  >
                    Super Admin (Soben)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGuestLoginTab('merchant');
                      setGuestSubRole('Merchant Consignor / Shipper');
                      setLoginEmail('sobin@merchant.com');
                      setLoginPassword('password123');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                  >
                    Merchant (Sobin Upreti)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
