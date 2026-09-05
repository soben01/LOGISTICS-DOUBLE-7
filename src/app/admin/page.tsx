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
  Mail,
  Zap,
  LayoutDashboard,
  Settings as SettingsIcon,
  Activity,
  FileText,
  Key,
  Database,
  Server,
  Layers,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  Compass,
  DollarSign,
  AlertTriangle,
  History,
  SlidersHorizontal
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
  isSuperAdmin,
  updateUserRole,
  updateUserPassword,
  updateUserDetails,
  updateUserBalance,
  User
} from '../../lib/auth';
import {
  getWebsiteSettings,
  updateWebsiteSettings,
  resetToDefaultSettings,
  WebsiteSettings
} from '../../lib/settings';
import PrintableLabel from '../../components/shipping/PrintableLabel';
import EmailSummaryModal from '../../components/notifications/EmailSummaryModal';
import AccountStructureAndCodWorkflow from '../../components/workflow/AccountStructureAndCodWorkflow';
import AdminToolsSuite from '../../components/admin/AdminToolsSuite';

type AdminSection =
  | 'overview'
  | 'users'
  | 'roles'
  | 'settings'
  | 'shipments'
  | 'cod'
  | 'edge'
  | 'email'
  | 'workflow'
  | 'audit';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  details: string;
  status: 'success' | 'warning' | 'alert';
}

const INITIAL_AUDIT_LOGS: AuditEntry[] = [
  {
    id: 'aud-01',
    timestamp: 'Today 18:00 NPT',
    actor: 'System Cron',
    action: 'Operational Daily Reset',
    entity: 'Global Operations',
    details: 'Daily counters reset at 6:00 PM NPT. COD balances archived for bank cut-off.',
    status: 'success',
  },
  {
    id: 'aud-02',
    timestamp: 'Today 17:34 NPT',
    actor: 'Soben (Super Admin)',
    action: 'Email Dispatch',
    entity: 'Cloudflare Email Routing',
    details: 'Dispatched 24-Hour Dashboard Summary to upreti.soben@gmail.com.',
    status: 'success',
  },
  {
    id: 'aud-03',
    timestamp: 'Today 16:12 NPT',
    actor: 'Anil (Operations HQ)',
    action: 'Linehaul Fleet Assignment',
    entity: 'Consignment D7-882193',
    details: 'Assigned Tata Ultra 1518 (BA 3 KHA 9921) to Kathmandu-Pokhara Highway Route.',
    status: 'success',
  },
  {
    id: 'aud-04',
    timestamp: 'Yesterday 18:00 NPT',
    actor: 'System Cron',
    action: 'Operational Daily Reset',
    entity: 'Global Operations',
    details: 'Scheduled 6:00 PM daily reset completed without exceptions.',
    status: 'success',
  },
];

export default function AdminControlPanel() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [actionNotice, setActionNotice] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [printingShipment, setPrintingShipment] = useState<Shipment | null>(null);

  // Impersonation / View-As Mode
  const [viewAsRole, setViewAsRole] = useState<'super_admin' | 'ops_admin' | 'compliance_auditor' | 'merchant'>('super_admin');

  // Website Settings State
  const [settings, setSettings] = useState<WebsiteSettings>(getWebsiteSettings());
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  // Shipments State
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Shipment modals
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [editStatus, setEditStatus] = useState<Shipment['status']>('In Transit');
  const [editLocation, setEditLocation] = useState('');
  const [editNote, setEditNote] = useState('');

  const [assigningShipment, setAssigningShipment] = useState<Shipment | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState('');
  const [assignedRoute, setAssignedRoute] = useState('');

  const [checkpointShipment, setCheckpointShipment] = useState<Shipment | null>(null);
  const [cpStatus, setCpStatus] = useState<Checkpoint['status']>('In Transit');
  const [cpLocation, setCpLocation] = useState('');
  const [cpDescription, setCpDescription] = useState('');

  // Users & Roles State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // User Management Modals
  const [pwdModalUser, setPwdModalUser] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [newRoleVal, setNewRoleVal] = useState<'merchant' | 'admin'>('merchant');
  const [newSubRoleVal, setNewSubRoleVal] = useState('');
  const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
  const [newBalanceVal, setNewBalanceVal] = useState<number>(0);
  const [balanceReason, setBalanceReason] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    role: 'merchant' as 'merchant' | 'admin',
    subRole: 'Merchant Consignor / Shipper',
    password: 'password123',
    codBalanceNpr: 0,
  });

  // COD & Remittance State
  const [payoutRequests, setPayoutRequests] = useState([
    { id: 'rem-101', merchantName: 'Himalayan Commerce Pvt Ltd', email: 'sobin@merchant.com', amount: 45200, bank: 'Nabil Bank (A/C: 019283746501)', status: 'Pending Review', requestedAt: 'Today 11:20 NPT' },
    { id: 'rem-102', merchantName: 'Everest Retail & Cargo Hub', email: 'merchant@double7.com.np', amount: 32400, bank: 'Global IME Bank (A/C: 99102837461)', status: 'Pending Review', requestedAt: 'Today 14:45 NPT' },
  ]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOGS);

  // Edge Telemetry State
  const [edgeStatus, setEdgeStatus] = useState<any>(null);
  const [triggeringReset, setTriggeringReset] = useState(false);

  // Cloudflare Email Routing & Verification State
  const [cfAddresses, setCfAddresses] = useState<Array<{ id: string; email: string; verified: string | null; status: string }>>([]);
  const [loadingCfAddresses, setLoadingCfAddresses] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [checkingVerifyEmail, setCheckingVerifyEmail] = useState<string | null>(null);
  const [manualSendEmail, setManualSendEmail] = useState('upreti.soben@gmail.com');
  const [manualSendType, setManualSendType] = useState('24h_summary');
  const [manualSending, setManualSending] = useState(false);
  const [manualSendResult, setManualSendResult] = useState<any>(null);

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4000);
  };

  const addAudit = (action: string, entity: string, details: string, status: 'success' | 'warning' | 'alert' = 'success') => {
    const newEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: 'Just now',
      actor: currentUser ? `${currentUser.name} (${currentUser.role === 'admin' ? 'Super Admin' : 'Admin'})` : 'Super Admin',
      action,
      entity,
      details,
      status,
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  const loadCfAddresses = async () => {
    setLoadingCfAddresses(true);
    try {
      const res = await fetch('/api/registered-emails');
      const data = (await res.json()) as any;
      if (data?.addresses) {
        setCfAddresses(data.addresses);
      }
    } catch {
      // fallback
    } finally {
      setLoadingCfAddresses(false);
    }
  };

  const handleResendVerification = async (targetEmail: string) => {
    setResendingEmail(targetEmail);
    try {
      const res = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = (await res.json()) as any;
      notify(data.message || `Verification link dispatched to ${targetEmail}`);
      addAudit('Resend Email Verification', targetEmail, `Dispatched Cloudflare verification link to ${targetEmail}.`);
      loadCfAddresses();
    } catch {
      notify(`Failed to dispatch verification to ${targetEmail}`);
    } finally {
      setResendingEmail(null);
    }
  };

  const handleCheckAndDispatch = async (targetEmail: string) => {
    setCheckingVerifyEmail(targetEmail);
    try {
      const res = await fetch('/api/check-and-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = (await res.json()) as any;
      notify(data.message || `Verification checked for ${targetEmail}`);
      addAudit('Check Verification Status', targetEmail, data.message || `Checked verification for ${targetEmail}.`);
      loadCfAddresses();
    } catch {
      notify(`Could not check verification status for ${targetEmail}`);
    } finally {
      setCheckingVerifyEmail(null);
    }
  };

  const handleManualEmailSend = async () => {
    if (!manualSendEmail || !manualSendEmail.includes('@')) {
      notify('Please enter a valid recipient email.');
      return;
    }
    setManualSending(true);
    setManualSendResult(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: manualSendEmail.trim(),
          type: manualSendType,
          subject: manualSendType === '24h_summary' ? undefined : '🎉 Welcome to Double 7 Logistics • Merchant Account Activated & Login Credentials',
        }),
      });
      const data = (await res.json()) as any;
      setManualSendResult(data);
      if (data.success) {
        notify(`✓ Email delivered to ${manualSendEmail} via ${data.provider}!`);
        addAudit('Manual Email Dispatch', manualSendEmail, `Dispatched ${manualSendType} to ${manualSendEmail} via ${data.provider}.`);
      } else {
        notify(`Dispatch status: ${data.error || 'Check details console below'}`);
      }
      loadCfAddresses();
    } catch (err: any) {
      notify(`Dispatch error: ${err?.message || String(err)}`);
    } finally {
      setManualSending(false);
    }
  };

  const loadData = () => {
    setShipments(getShipments());
    const allUsers = getUsers();
    setUsersList(allUsers);
    setSettings(getWebsiteSettings());
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login?portal=admin&redirect=/admin');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setCurrentUser(user);
    loadData();
    loadCfAddresses();

    // Fetch live D1 & Edge diagnostics
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => setEdgeStatus(data))
      .catch(() => {});
  }, [router]);

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateWebsiteSettings(settings, currentUser?.email);
    setSettingsSavedNotice(true);
    addAudit('Update Website Settings', 'Global Config', 'Updated platform branding, operational cut-off schedule, and VAT rules.');
    notify('Website & Platform Settings saved and synced with Cloudflare KV!');
    setTimeout(() => setSettingsSavedNotice(false), 3500);
  };

  // Handle Super Admin Trigger 6:00 PM Reset
  const handleTriggerDailyReset = async () => {
    setTriggeringReset(true);
    try {
      const res = await fetch('/api/admin/trigger-reset', { method: 'POST' });
      const data = (await res.json()) as any;
      addAudit('Manual Daily Operational Reset', 'Global Highway Operations', 'Manually triggered the 6:00 PM operational cut-off and counter synchronization.');
      notify(data.message || '6:00 PM Daily Operational Reset successfully triggered!');
    } catch {
      notify('Reset triggered locally: daily dispatch counters and cut-offs refreshed.');
    } finally {
      setTriggeringReset(false);
    }
  };

  // User Actions
  const handleToggleUserStatus = (u: User) => {
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    updateMerchantStatus(u.id, newStatus);
    loadData();
    addAudit(`Account ${newStatus === 'active' ? 'Re-activated' : 'Suspended'}`, u.email, `Changed status of ${u.name} to ${newStatus}.`);
    notify(`User ${u.name} is now ${newStatus.toUpperCase()}`);
  };

  const handleOpenRoleModal = (u: User) => {
    setRoleModalUser(u);
    setNewRoleVal(u.role);
    setNewSubRoleVal(u.subRole || (u.role === 'admin' ? 'Command HQ / Operations Admin' : 'Merchant Consignor / Shipper'));
  };

  const handleSaveUserRole = () => {
    if (!roleModalUser) return;
    updateUserRole(roleModalUser.id, newRoleVal, newSubRoleVal);
    addAudit('Role Elevation / Update', roleModalUser.email, `Elevated/updated role of ${roleModalUser.name} to ${newRoleVal.toUpperCase()} (${newSubRoleVal}).`);
    notify(`Updated ${roleModalUser.name}'s role to ${newRoleVal.toUpperCase()}`);
    setRoleModalUser(null);
    loadData();
  };

  const handleOpenPasswordModal = (u: User) => {
    setPwdModalUser(u);
    setNewPasswordVal(u.password || '');
  };

  const handleSaveUserPassword = () => {
    if (!pwdModalUser || !newPasswordVal.trim()) return;
    updateUserPassword(pwdModalUser.id, newPasswordVal.trim());
    addAudit('Direct Password Reset', pwdModalUser.email, `Direct administrative password reset executed by Super Admin.`);
    notify(`Password updated for ${pwdModalUser.name}!`);
    setPwdModalUser(null);
    setNewPasswordVal('');
    loadData();
  };

  const handleOpenBalanceModal = (u: User) => {
    setBalanceModalUser(u);
    setNewBalanceVal(u.codBalanceNpr);
    setBalanceReason('');
  };

  const handleSaveUserBalance = () => {
    if (!balanceModalUser) return;
    updateUserBalance(balanceModalUser.id, newBalanceVal);
    addAudit('COD Balance Adjustment', balanceModalUser.email, `Adjusted COD balance to Rs. ${newBalanceVal.toLocaleString()} (Reason: ${balanceReason || 'Administrative ledger reconciliation'}).`);
    notify(`Updated ${balanceModalUser.name}'s COD balance to Rs. ${newBalanceVal.toLocaleString()}`);
    setBalanceModalUser(null);
    loadData();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      notify('Name and valid email are required');
      return;
    }
    const newUser: User = {
      id: `usr-${addForm.role === 'admin' ? 'admin' : 'merch'}-${Date.now()}`,
      name: addForm.name.trim(),
      email: addForm.email.trim().toLowerCase(),
      company: addForm.company.trim() || (addForm.role === 'admin' ? 'Double 7 Command HQ' : 'Nepal Merchant Partner'),
      phone: addForm.phone.trim() || '+977 98000 00000',
      role: addForm.role,
      subRole: addForm.subRole,
      status: 'active',
      codBalanceNpr: Number(addForm.codBalanceNpr) || 0,
      totalShipments: 0,
      createdAt: new Date().toISOString().split('T')[0],
      password: addForm.password,
    };

    const currentUsers = getUsers();
    const updated = [newUser, ...currentUsers];
    localStorage.setItem('double7_users_v1', JSON.stringify(updated));
    window.dispatchEvent(new Event('auth-change'));

    // Sync to D1 & Cloudflare Email Routing
    fetch('/api/register-merchant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
      .then(r => r.json())
      .then((data: any) => {
        if (data.message) {
          notify(`Provisioned: ${data.message}`);
        }
        loadCfAddresses();
      })
      .catch(() => {});

    addAudit('New Account Provisioned', newUser.email, `Super Admin provisioned ${newUser.name} with role ${newUser.role.toUpperCase()}. Cloudflare registration triggered.`);
    notify(`Created new account for ${newUser.name} (${newUser.email})`);
    setShowAddUserModal(false);
    setAddForm({
      name: '',
      email: '',
      company: '',
      phone: '',
      role: 'merchant',
      subRole: 'Merchant Consignor / Shipper',
      password: 'password123',
      codBalanceNpr: 0,
    });
    loadData();
  };

  // Approve Bank Remittance
  const handleApproveRemittance = (reqId: string, merchantName: string, amount: number) => {
    setPayoutRequests(prev => prev.filter(r => r.id !== reqId));
    addAudit('Bank Payout Remittance Approved', merchantName, `Cleared Rs. ${amount.toLocaleString()} bank payout transfer via Nepal Clearing House.`);
    notify(`Approved and cleared Rs. ${amount.toLocaleString()} payout for ${merchantName}!`);
  };

  // Filtered Users
  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.company.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Shipments
  const filteredShipments = shipments.filter(s => {
    const matchesSearch =
      s.id.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.sender.name.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.recipient.name.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.destination.city.toLowerCase().includes(shipmentSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCodBalance = usersList.reduce((acc, u) => acc + (u.codBalanceNpr || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060911', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
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

      {/* Main Admin Workspace Shell */}
      <div className="admin-layout-shell" style={{ display: 'flex', flex: 1 }}>
        {/* Left Navigation Sidebar (Desktop >= 1025px) */}
        <aside className="admin-sidebar" style={{
          width: '280px',
          backgroundColor: '#0a0f1d',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto'
        }}>
          {/* Brand Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}>
                <Shield size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: '#fff' }}>
                  Double 7 Command
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>
                  <span className="pulse-dot pulse-dot-red" style={{ width: 6, height: 6 }}></span>
                  SUPER ADMIN TOWER
                </div>
              </div>
            </div>
          </div>

          {/* User Profile Card in Sidebar */}
          <div style={{
            margin: '1rem',
            padding: '0.875rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                {currentUser?.name || 'Soben'}
              </div>
              <span style={{
                fontSize: '0.65rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontWeight: 800
              }}>
                SUPER ADMIN
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.email || 'soben@double7.com'}
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '0.5rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Group 1: Core Operations */}
            <div>
              <div style={{ padding: '0 0.75rem 0.5rem 0.75rem', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Core Operations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button
                  onClick={() => setActiveSection('overview')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'overview' ? 700 : 500,
                    backgroundColor: activeSection === 'overview' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'overview' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <LayoutDashboard size={18} color={activeSection === 'overview' ? '#ef4444' : 'currentColor'} />
                    Overview
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('shipments')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'shipments' ? 700 : 500,
                    backgroundColor: activeSection === 'shipments' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'shipments' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Truck size={18} color={activeSection === 'shipments' ? '#ef4444' : 'currentColor'} />
                    Master Consignments
                  </span>
                  <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                    {shipments.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('cod')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'cod' ? 700 : 500,
                    backgroundColor: activeSection === 'cod' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'cod' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Banknote size={18} color={activeSection === 'cod' ? '#ef4444' : 'currentColor'} />
                    COD Treasury & Payouts
                  </span>
                  {payoutRequests.length > 0 && (
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#f59e0b', color: '#060911', padding: '0.1rem 0.45rem', borderRadius: '10px', fontWeight: 800 }}>
                      {payoutRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Group 2: Super Admin Sovereignty */}
            <div>
              <div style={{ padding: '0 0.75rem 0.5rem 0.75rem', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ef4444', fontWeight: 800 }}>
                Super Admin Controls
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button
                  onClick={() => setActiveSection('users')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'users' ? 700 : 500,
                    backgroundColor: activeSection === 'users' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'users' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Users size={18} color={activeSection === 'users' ? '#ef4444' : 'currentColor'} />
                    Users & Merchants
                  </span>
                  <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                    {usersList.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('roles')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'roles' ? 700 : 500,
                    backgroundColor: activeSection === 'roles' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'roles' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={18} color={activeSection === 'roles' ? '#ef4444' : 'currentColor'} />
                    Role & Permission Matrix
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('settings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'settings' ? 700 : 500,
                    backgroundColor: activeSection === 'settings' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'settings' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <SettingsIcon size={18} color={activeSection === 'settings' ? '#ef4444' : 'currentColor'} />
                    Website & System Settings
                  </span>
                </button>
              </div>
            </div>

            {/* Group 3: Infrastructure & Telemetry */}
            <div>
              <div style={{ padding: '0 0.75rem 0.5rem 0.75rem', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                System & Logs
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button
                  onClick={() => setActiveSection('edge')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'edge' ? 700 : 500,
                    backgroundColor: activeSection === 'edge' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'edge' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Zap size={18} color={activeSection === 'edge' ? '#ef4444' : 'currentColor'} />
                    Edge Telemetry & 6 PM Reset
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('email')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'email' ? 700 : 500,
                    backgroundColor: activeSection === 'email' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'email' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Mail size={18} color={activeSection === 'email' ? '#ef4444' : 'currentColor'} />
                    Email & Verification
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    backgroundColor: cfAddresses.some(a => a.status === 'unverified' || !a.verified) ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: cfAddresses.some(a => a.status === 'unverified' || !a.verified) ? '#f59e0b' : '#10b981',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    {cfAddresses.filter(a => a.status === 'verified' || !!a.verified).length}/{cfAddresses.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('workflow')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'workflow' ? 700 : 500,
                    backgroundColor: activeSection === 'workflow' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'workflow' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Layers size={18} color={activeSection === 'workflow' ? '#ef4444' : 'currentColor'} />
                    Architecture & COD Flow
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('audit')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeSection === 'audit' ? 700 : 500,
                    backgroundColor: activeSection === 'audit' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: activeSection === 'audit' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <History size={18} color={activeSection === 'audit' ? '#ef4444' : 'currentColor'} />
                    Security Audit Trail
                  </span>
                  <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                    {auditLogs.length}
                  </span>
                </button>
              </div>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link
              href="/merchant"
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none'
              }}
            >
              <Building size={14} /> Merchant Portal &rarr;
            </Link>
            <Link
              href="/dashboard"
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none'
              }}
            >
              Live Ops &rarr;
            </Link>
          </div>
        </aside>

        {/* Mobile / Tablet Horizontal Navigation Bar (Visible on screens <= 1024px) */}
        <nav className="admin-mobile-nav" aria-label="Admin Mobile Navigation">
          <div className="mobile-scroll-x" style={{ alignItems: 'center' }}>
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'users', label: `Users (${usersList.length})`, icon: Users },
              { id: 'shipments', label: `Shipments (${shipments.length})`, icon: Boxes },
              { id: 'cod', label: 'COD Ledger', icon: Banknote },
              { id: 'email', label: 'Email & CF', icon: Mail },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
              { id: 'roles', label: 'Roles Matrix', icon: ShieldCheck },
              { id: 'edge', label: 'Edge Diagnostics', icon: Activity },
              { id: 'workflow', label: 'Architecture', icon: Layers },
              { id: 'audit', label: `Security (${auditLogs.length})`, icon: History },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as AdminSection)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem 0.9rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(239, 68, 68, 0.55)' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: isActive ? 'rgba(239, 68, 68, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.82rem',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <Icon size={14} color={isActive ? '#ef4444' : 'currentColor'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="admin-main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
          {/* Top Control Bar */}
          <header style={{
            minHeight: '64px',
            backgroundColor: '#0a0f1d',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            {/* Breadcrumb & Live State */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Super Admin Tower</span>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ fontWeight: 700, color: '#f8fafc', textTransform: 'capitalize' }}>
                  {activeSection.replace('_', ' ')}
                </span>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }}></span>
                DAILY RESET: 6:00 PM NPT
              </span>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Impersonation Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Eye size={14} color="#f59e0b" />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>View As:</span>
                <select
                  value={viewAsRole}
                  onChange={(e) => {
                    setViewAsRole(e.target.value as any);
                    notify(`Simulating view for role: ${e.target.value.toUpperCase()}`);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="super_admin" style={{ backgroundColor: '#0a0f1d' }}>Super Admin (Full Sovereignty)</option>
                  <option value="ops_admin" style={{ backgroundColor: '#0a0f1d' }}>Operations Controller</option>
                  <option value="compliance_auditor" style={{ backgroundColor: '#0a0f1d' }}>Compliance Auditor</option>
                  <option value="merchant" style={{ backgroundColor: '#0a0f1d' }}>Merchant Consignor</option>
                </select>
              </div>

              {/* Trigger 6 PM Reset Button */}
              <button
                onClick={handleTriggerDailyReset}
                disabled={triggeringReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Zap size={15} />
                {triggeringReset ? 'Resetting...' : 'Trigger 6 PM Reset'}
              </button>

              {/* 24h Summary Modal Trigger */}
              <button
                onClick={() => setShowEmailModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Mail size={15} />
                24h Summary
              </button>
            </div>
          </header>

          {/* Section Container */}
          <div style={{ padding: '2rem', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
            {/* ========================================================================= */}
            {/* SECTION 1: OVERVIEW */}
            {/* ========================================================================= */}
            {activeSection === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                    Super Admin Operations Tower
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Full sovereign control across 77-district highway linehaul routing, users, merchants, COD treasury, and Cloudflare Edge infrastructure.
                  </p>
                </div>

                {/* 4 KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Shipments</span>
                      <Truck size={20} color="#3b82f6" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
                      {shipments.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>&uarr; 100% On-Time SLA</span> &bull; <span>77 Districts</span>
                    </div>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Reconciled COD</span>
                      <Banknote size={20} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
                      Rs. {totalCodBalance.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>{payoutRequests.length} Pending Payouts</span> &bull; <span>6 PM Cut-Off</span>
                    </div>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>System Accounts</span>
                      <Users size={20} color="#a855f7" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
                      {usersList.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {usersList.filter(u => u.role === 'admin').length} Admins &bull; {usersList.filter(u => u.role === 'merchant').length} Merchants
                    </div>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Edge Infrastructure</span>
                      <Zap size={20} color="#ef4444" />
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="pulse-dot pulse-dot-green" style={{ width: 8, height: 8 }}></span>
                      OPERATIONAL
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      D1 DB &bull; KV Cache &bull; Email Dispatch Active
                    </div>
                  </div>
                </div>

                {/* Quick Master Shortcuts */}
                <div className="grid-responsive-2">
                  {/* Shortcut 1: Manage Accounts */}
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                          <Users size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>User & Merchant Sovereignty</h3>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                        Super Admin directory allows elevating any user to Super Admin, demoting, resetting passwords, adjusting COD balances, and toggling suspension.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSection('users')}
                      style={{
                        padding: '0.65rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      Open User Directory &rarr;
                    </button>
                  </div>

                  {/* Shortcut 2: Website Settings */}
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                          <SettingsIcon size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Global Website Settings</h3>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                        Configure platform brand name, global emergency announcement banners, maintenance mode toggle, daily 6:00 PM reset schedules, and VAT rules.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSection('settings')}
                      style={{
                        padding: '0.65rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      Configure Website Settings &rarr;
                    </button>
                  </div>

                  {/* Shortcut 3: COD Payout Console */}
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                          <Banknote size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>COD Treasury Desk</h3>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                        Review pending merchant remittance withdrawal requests, clear bank transfers with 1 click, and enforce aging SLA cash collection rules.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSection('cod')}
                      style={{
                        padding: '0.65rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      Review Remittances ({payoutRequests.length}) &rarr;
                    </button>
                  </div>
                </div>

                {/* Embedded Tools Suite */}
                <div style={{ marginTop: '1rem' }}>
                  <AdminToolsSuite />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 2: USERS & MERCHANTS DIRECTORY (SUPER ADMIN) */}
            {/* ========================================================================= */}
            {activeSection === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                      User & Merchant Directory
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Super Admin master directory: Elevate roles, reset passwords, adjust COD balances, and toggle suspensions.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <UserPlus size={16} />
                    Add Account
                  </button>
                </div>

                {/* Filter & Search Bar */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
                    <Search size={16} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, company, or phone..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        width: '100%',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Role:</span>
                    <select
                      value={userRoleFilter}
                      onChange={e => setUserRoleFilter(e.target.value)}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#f8fafc',
                        borderRadius: '6px',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.78rem',
                        outline: 'none'
                      }}
                    >
                      <option value="ALL" style={{ backgroundColor: '#0a0f1d' }}>All Roles</option>
                      <option value="admin" style={{ backgroundColor: '#0a0f1d' }}>Admins Only</option>
                      <option value="merchant" style={{ backgroundColor: '#0a0f1d' }}>Merchants Only</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflowX: 'auto'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>User / Company</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Contact</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Role & Scope</th>
                        <th style={{ padding: '0.85rem 1rem' }}>COD Balance</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Password</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Super Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const isUserSuperAdmin = isSuperAdmin(u);
                        const isRevealed = showPasswordMap[u.id];

                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.company}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{u.email}</span>
                                {cfAddresses.some(a => a.email.toLowerCase() === u.email.toLowerCase() && (a.status === 'verified' || !!a.verified)) ? (
                                  <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                                    ✓ CF Verified
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleCheckAndDispatch(u.email)}
                                    title="Click to check Cloudflare verification and auto-dispatch credentials"
                                    style={{
                                      fontSize: '0.62rem',
                                      padding: '0.1rem 0.35rem',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                      color: '#f59e0b',
                                      fontWeight: 700,
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ⏳ CF Pending ⟳
                                  </button>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                <span style={{
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  backgroundColor: u.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: u.role === 'admin' ? '#ef4444' : '#3b82f6'
                                }}>
                                  {isUserSuperAdmin ? 'SUPER ADMIN' : u.role.toUpperCase()}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {u.subRole || (u.role === 'admin' ? 'Operations Admin' : 'Merchant Shipper')}
                              </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: 700, color: u.codBalanceNpr > 0 ? '#10b981' : 'var(--text-muted)' }}>
                                Rs. {u.codBalanceNpr.toLocaleString()}
                              </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  {isRevealed ? (u.password || 'password123') : '••••••••'}
                                </span>
                                <button
                                  onClick={() => setShowPasswordMap(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                                  title="Toggle password view"
                                >
                                  {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                backgroundColor: u.status === 'active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: u.status === 'active' ? '#10b981' : '#ef4444'
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: u.status === 'active' ? '#10b981' : '#ef4444' }}></span>
                                {u.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                <button
                                  onClick={() => handleOpenRoleModal(u)}
                                  title="Change Role / Elevate"
                                  style={{
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                    color: '#a855f7',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Role
                                </button>
                                <button
                                  onClick={() => handleOpenPasswordModal(u)}
                                  title="Reset Password"
                                  style={{
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    color: '#3b82f6',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Key size={13} />
                                </button>
                                <button
                                  onClick={() => handleOpenBalanceModal(u)}
                                  title="Adjust COD Balance"
                                  style={{
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    color: '#10b981',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Rs
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                                  style={{
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '6px',
                                    backgroundColor: u.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: u.status === 'active' ? '#ef4444' : '#10b981',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {u.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 3: ROLE & PERMISSION MATRIX */}
            {/* ========================================================================= */}
            {activeSection === 'roles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                    Role & Permissions Matrix Engine
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Defines what each system role can view, edit, or execute. Super Admin retains unconditional root clearance.
                  </p>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.5rem',
                  overflowX: 'auto'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem' }}>Module / Permission Capability</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', color: '#ef4444' }}>Super Admin</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Ops Controller</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Security Auditor</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>COD Treasury</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', color: '#3b82f6' }}>Merchant Portal</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Store Staff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Consignment: Create / Book New Shipment', sa: true, ops: true, aud: false, tr: false, merch: true, staff: true },
                        { name: 'Consignment: Master Status Override', sa: true, ops: true, aud: false, tr: false, merch: false, staff: false },
                        { name: 'Consignment: Delete or Force RTO', sa: true, ops: true, aud: false, tr: false, merch: false, staff: false },
                        { name: 'Linehaul Fleet: Assign Heavy Trucks / Vans', sa: true, ops: true, aud: false, tr: false, merch: false, staff: false },
                        { name: 'COD: Reconciled Balance & Remittance Request', sa: true, ops: false, aud: true, tr: true, merch: true, staff: false },
                        { name: 'COD: Approve & Transfer Bank Payouts', sa: true, ops: false, aud: false, tr: true, merch: false, staff: false },
                        { name: 'COD: Discrepancy & Aging SLA Resolution', sa: true, ops: true, aud: true, tr: true, merch: false, staff: false },
                        { name: 'User Management: Elevate Roles & Permissions', sa: true, ops: false, aud: false, tr: false, merch: false, staff: false },
                        { name: 'User Management: Direct Password Reset', sa: true, ops: false, aud: false, tr: false, merch: false, staff: false },
                        { name: 'User Management: Suspend / Activate Accounts', sa: true, ops: false, aud: true, tr: false, merch: false, staff: false },
                        { name: 'Website Settings: Modify Brand & Announcement', sa: true, ops: false, aud: false, tr: false, merch: false, staff: false },
                        { name: 'Website Settings: 6:00 PM Operational Reset Time', sa: true, ops: false, aud: false, tr: false, merch: false, staff: false },
                        { name: 'Edge Infrastructure: Cloudflare D1 & KV Controls', sa: true, ops: false, aud: false, tr: false, merch: false, staff: false },
                        { name: 'Security: Full Tamper-Evident Audit Inspection', sa: true, ops: true, aud: true, tr: true, merch: false, staff: false },
                      ].map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: '#f8fafc' }}>{p.name}</td>
                          <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                            {p.sa ? <CheckCircle2 size={16} color="#ef4444" style={{ margin: '0 auto' }} /> : <span style={{ color: 'var(--text-muted)' }}>&times;</span>}
                          </td>
                          <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                            {p.ops ? <CheckCircle2 size={16} color="#10b981" style={{ margin: '0 auto' }} /> : <span style={{ color: 'var(--text-muted)' }}>&times;</span>}
                          </td>
                          <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                            {p.aud ? <CheckCircle2 size={16} color="#10b981" style={{ margin: '0 auto' }} /> : <span style={{ color: 'var(--text-muted)' }}>&times;</span>}
                          </td>
                          <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                            {p.tr ? <CheckCircle2 size={16} color="#10b981" style={{ margin: '0 auto' }} /> : <span style={{ color: 'var(--text-muted)' }}>&times;</span>}
                          </td>
                          <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                            {p.merch ? <CheckCircle2 size={16} color="#3b82f6" style={{ margin: '0 auto' }} /> : <span style={{ color: 'var(--text-muted)' }}>&times;</span>}
                          </td>
                          <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                            {p.staff ? <CheckCircle2 size={16} color="#3b82f6" style={{ margin: '0 auto' }} /> : <span style={{ color: 'var(--text-muted)' }}>&times;</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 4: WEBSITE & SYSTEM SETTINGS (SUPER ADMIN) */}
            {/* ========================================================================= */}
            {activeSection === 'settings' && (
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                      Website & Platform Settings
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Global master configuration persisted in Cloudflare KV edge cache. Changes take effect platform-wide.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        resetToDefaultSettings();
                        setSettings(getWebsiteSettings());
                        notify('Reset settings to system defaults');
                      }}
                      style={{
                        padding: '0.65rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Reset Defaults
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        backgroundColor: '#ef4444',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      Save & Deploy Settings
                    </button>
                  </div>
                </div>

                {settingsSavedNotice && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>
                    &check; Global settings successfully saved and deployed to Cloudflare KV Edge!
                  </div>
                )}

                {/* Card 1: Brand & Identity */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe2 size={18} color="#3b82f6" /> Brand Identity & Legal Entity
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Platform Brand Name</label>
                      <input
                        type="text"
                        value={settings.brandName}
                        onChange={e => setSettings({ ...settings, brandName: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Tagline</label>
                      <input
                        type="text"
                        value={settings.tagline}
                        onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Support Hotline</label>
                      <input
                        type="text"
                        value={settings.supportPhone}
                        onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Primary Support Email</label>
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Central Cargo Gateway Address</label>
                      <input
                        type="text"
                        value={settings.headquartersAddress}
                        onChange={e => setSettings({ ...settings, headquartersAddress: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Site Status & Global Announcement */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Radio size={18} color="#f59e0b" /> Site Operation Mode & Emergency Announcement
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Platform Operating Mode</label>
                      <select
                        value={settings.siteMode}
                        onChange={e => setSettings({ ...settings, siteMode: e.target.value as any })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="live" style={{ backgroundColor: '#0a0f1d' }}>Live Mode (100% Operational)</option>
                        <option value="maintenance" style={{ backgroundColor: '#0a0f1d' }}>Maintenance Mode (Notice displayed)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Announcement Active</label>
                      <select
                        value={settings.announcement.active ? 'true' : 'false'}
                        onChange={e => setSettings({ ...settings, announcement: { ...settings.announcement, active: e.target.value === 'true' } })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="true" style={{ backgroundColor: '#0a0f1d' }}>Active (Show on website)</option>
                        <option value="false" style={{ backgroundColor: '#0a0f1d' }}>Disabled (Hidden)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Announcement Title</label>
                      <input
                        type="text"
                        value={settings.announcement.title}
                        onChange={e => setSettings({ ...settings, announcement: { ...settings.announcement, title: e.target.value } })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Announcement Message</label>
                      <input
                        type="text"
                        value={settings.announcement.message}
                        onChange={e => setSettings({ ...settings, announcement: { ...settings.announcement, message: e.target.value } })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3: Operational Reset & Financial Rules */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} color="#ef4444" /> Operational Reset Schedules & Financial Rules
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Daily Reset Time (NPT)</label>
                      <input
                        type="text"
                        value={settings.dailyResetTime}
                        onChange={e => setSettings({ ...settings, dailyResetTime: e.target.value })}
                        placeholder="18:00 (6:00 PM)"
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>VAT Rate (%)</label>
                      <input
                        type="number"
                        value={settings.vatRatePercent}
                        onChange={e => setSettings({ ...settings, vatRatePercent: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>COD Handling Fee (% or Flat)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.codFeeValue}
                        onChange={e => setSettings({ ...settings, codFeeValue: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Minimum Payout Request (Rs.)</label>
                      <input
                        type="number"
                        value={settings.minPayoutThresholdNpr}
                        onChange={e => setSettings({ ...settings, minPayoutThresholdNpr: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>24-Hour Executive Summary Email Recipients (Comma-separated)</label>
                      <input
                        type="text"
                        value={settings.dailySummaryRecipients.join(', ')}
                        onChange={e => setSettings({ ...settings, dailySummaryRecipients: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* SECTION 5: MASTER CONSIGNMENTS */}
            {/* ========================================================================= */}
            {activeSection === 'shipments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                      Master Consignments Desk
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Central dispatch grid: Status overrides, linehaul vehicle assignments, and printable waybills.
                    </p>
                  </div>
                  <Link
                    href="/book"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#ef4444',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Plus size={16} /> Book Consignment
                  </Link>
                </div>

                {/* Filter Bar */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                    <Search size={16} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Search tracking ID, sender, recipient, destination city..."
                      value={shipmentSearch}
                      onChange={e => setShipmentSearch(e.target.value)}
                      style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', width: '100%', fontSize: '0.875rem', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
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
                          backgroundColor: statusFilter === st ? '#ef4444' : 'rgba(255, 255, 255, 0.05)',
                          color: statusFilter === st ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shipments Table */}
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Tracking ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Route & Hub</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Shipper & Recipient</th>
                        <th style={{ padding: '0.85rem 1rem' }}>COD Value</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShipments.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{s.id}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.serviceType || s.service}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{s.origin.city} &rarr; {s.destination.city}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.assignedVehicle || s.telemetry?.transportVehicle || 'Linehaul Fleet'}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ color: '#f8fafc' }}>{s.recipient.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>From: {s.sender.company || s.sender.name}</div>
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                onClick={() => {
                                  setEditingShipment(s);
                                  setEditStatus(s.status);
                                  setEditLocation(s.destination.city);
                                  setEditNote('');
                                }}
                                title="Override Status"
                                style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                Override
                              </button>
                              <button
                                onClick={() => setPrintingShipment(s)}
                                title="Print Thermal Label"
                                style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                <Printer size={13} />
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
            {/* SECTION 6: COD TREASURY & REMITTANCES */}
            {/* ========================================================================= */}
            {activeSection === 'cod' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                    COD Treasury & Merchant Payouts
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Approve bank remittance requests, reconcile daily cash collection pools, and resolve discrepancy aging past the 6:00 PM cut-off.
                  </p>
                </div>

                {/* Pending Payout Requests */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Banknote size={18} color="#10b981" /> Pending Merchant Bank Remittance Requests ({payoutRequests.length})
                  </h3>

                  {payoutRequests.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      All merchant remittance requests have been cleared and disbursed to bank accounts.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {payoutRequests.map(req => (
                        <div key={req.id} style={{
                          padding: '1.25rem',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>{req.merchantName}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.email} &bull; Requested: {req.requestedAt}</div>
                            <div style={{ fontSize: '0.82rem', color: '#3b82f6', marginTop: '0.3rem' }}>{req.bank}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                                Rs. {req.amount.toLocaleString()}
                              </div>
                              <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>Awaiting Transfer</span>
                            </div>
                            <button
                              onClick={() => handleApproveRemittance(req.id, req.merchantName, req.amount)}
                              style={{
                                padding: '0.6rem 1.25rem',
                                borderRadius: '8px',
                                backgroundColor: '#10b981',
                                border: 'none',
                                color: '#060911',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              Approve & Transfer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 7: EDGE TELEMETRY & 6 PM RESET */}
            {/* ========================================================================= */}
            {activeSection === 'edge' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                    Cloudflare Edge Telemetry & Operational Reset
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Live bindings status, D1 databases health, KV edge cache, and manual trigger for the 6:00 PM daily operational reset.
                  </p>
                </div>

                {/* Big Reset Action Banner */}
                <div style={{
                  padding: '2rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.5rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Zap size={22} color="#ef4444" />
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                        Daily 6:00 PM Operational Reset Schedule
                      </h2>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.5 }}>
                      Scheduled daily at 18:00 (6:00 PM NPT). Resets all highway linehaul counters, reconciles collected COD funds for evening bank cut-off, and archives batch manifests across 77 districts.
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerDailyReset}
                    disabled={triggeringReset}
                    style={{
                      padding: '0.85rem 1.75rem',
                      borderRadius: '10px',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    {triggeringReset ? 'Executing Reset...' : 'Execute Manual 6 PM Reset Now'}
                  </button>
                </div>

                {/* Edge Bindings Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.25rem' }}>
                  <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>D1 tracking_db</span>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>CONNECTED</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      ID: 165e3eb4-9323-413f-be55-cc7846857cd3
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Holds 61 domestic consignments & checkpoint telemetry.
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>D1 users</span>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>CONNECTED</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      ID: 6adbc3b5-ed24-48cc-8be2-8244363b650d
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Holds {usersList.length} authenticated accounts with passwords & roles.
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>KV LOGISTICS_CACHE</span>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>ACTIVE</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      ID: fbe236634e3b4516a768338e81028b55
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Sub-10ms edge caching for website settings & rate tables.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 8: WORKFLOW ARCHITECTURE */}
            {/* ========================================================================= */}
            {activeSection === 'workflow' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <AccountStructureAndCodWorkflow />
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 9: CLOUDFLARE EMAIL ROUTING & VERIFIED SENDING */}
            {/* ========================================================================= */}
            {activeSection === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 800 }}>
                        OFFICIAL DOMAIN DISPATCH
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sender: <code style={{ color: '#38bdf8' }}>dispatch@sobinupreti.com.np</code>
                      </span>
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                      Cloudflare Email Routing &amp; Verified Dispatch Center
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '800px' }}>
                      Manage destination addresses registered with Cloudflare, monitor real-time verification status, and execute automatic or manual dispatches for daily 6:00 PM operational resets and merchant welcome credentials.
                    </p>
                  </div>
                  <button
                    onClick={loadCfAddresses}
                    disabled={loadingCfAddresses}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <RefreshCw size={14} className={loadingCfAddresses ? 'animate-spin' : ''} />
                    {loadingCfAddresses ? 'Syncing...' : 'Refresh Addresses'}
                  </button>
                </div>

                {/* 3 Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Total Registered Recipients
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc' }}>
                      {cfAddresses.length}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      In Cloudflare Email Routing pool
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Verified &amp; Active (Sendable)
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981' }}>
                      {cfAddresses.filter(a => a.status === 'verified' || !!a.verified).length}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      100% instant deliverability from domain
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Pending Link Verification
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b' }}>
                      {cfAddresses.filter(a => a.status !== 'verified' && !a.verified).length}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Awaiting verification link click in Gmail
                    </div>
                  </div>
                </div>

                {/* Manual Dispatcher Console */}
                <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Send size={18} color="#ff6600" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Dispatch &amp; Real Email Test Console</h3>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Send a real transactional dispatch from <code>dispatch@sobinupreti.com.np</code> to verify delivery or dispatch credentials to any merchant.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Recipient Email Address
                      </label>
                      <input
                        type="email"
                        value={manualSendEmail}
                        onChange={e => setManualSendEmail(e.target.value)}
                        placeholder="merchant@gmail.com"
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.85rem' }}
                      />
                      {/* Quick fill pills */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Quick select:</span>
                        {cfAddresses.slice(0, 5).map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setManualSendEmail(a.email)}
                            style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: a.status === 'verified' ? '#10b981' : '#f59e0b', cursor: 'pointer' }}
                          >
                            {a.email}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Email Template
                      </label>
                      <select
                        value={manualSendType}
                        onChange={e => setManualSendType(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="24h_summary">24-Hour Operations &amp; COD Summary (6:00 PM Reset)</option>
                        <option value="merchant_welcome">Merchant Welcome, Activated Credentials &amp; Links</option>
                      </select>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        Includes live D1 shipments tally, COD ledger totals, and direct portal authentication links.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleManualEmailSend}
                    disabled={manualSending}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
                  >
                    <Send size={15} />
                    {manualSending ? 'Dispatching from Cloudflare...' : 'Send Live Email Now'}
                  </button>

                  {/* Result Box */}
                  {manualSendResult && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: manualSendResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${manualSendResult.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ fontWeight: 700, color: manualSendResult.success ? '#10b981' : '#ef4444', marginBottom: '0.25rem' }}>
                        {manualSendResult.success ? '✓ Dispatch Successful' : '✗ Dispatch Notice'}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {manualSendResult.success ? (
                          <>Dispatched to <strong>{manualSendResult.recipient}</strong> via <strong>{manualSendResult.provider}</strong>. Message ID: <code>{manualSendResult.messageId}</code></>
                        ) : (
                          manualSendResult.error || 'Recipient address has not been verified in Cloudflare yet. Check your Gmail inbox for the authorization link.'
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Registered Addresses Table */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflowX: 'auto'
                }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cloudflare Email Routing Registered Destination Addresses</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Auto-refreshed from Cloudflare API</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Destination Address</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Cloudflare Status</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Verification Time</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cfAddresses.map(addr => {
                        const isVerified = addr.status === 'verified' || !!addr.verified;
                        return (
                          <tr key={addr.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{addr.email}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {addr.id}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {isVerified ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                                  <Check size={13} /> Verified &amp; Active
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                                  <Clock size={13} /> Pending Link Click
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                              {addr.verified ? new Date(addr.verified).toLocaleString() : 'Pending Confirmation'}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleCheckAndDispatch(addr.email)}
                                  disabled={checkingVerifyEmail === addr.email}
                                  className="btn btn-outline btn-sm"
                                  title="Check if user clicked the link; if yes, delivers queued credentials"
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                                >
                                  {checkingVerifyEmail === addr.email ? 'Checking...' : 'Check & Auto-Dispatch'}
                                </button>
                                {!isVerified && (
                                  <button
                                    onClick={() => handleResendVerification(addr.email)}
                                    disabled={resendingEmail === addr.email}
                                    className="btn btn-secondary btn-sm"
                                    title="Dispatches Cloudflare verification email to user inbox"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                                  >
                                    {resendingEmail === addr.email ? 'Sending...' : 'Resend Verification'}
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setManualSendEmail(addr.email);
                                    setManualSendType('24h_summary');
                                  }}
                                  className="btn btn-outline btn-sm"
                                  title="Load into manual console to send 6 PM report"
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                                >
                                  Send 6 PM Report
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Explanation Card */}
                <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <ShieldCheck size={16} /> How Cloudflare Email Routing &amp; Domain Sending Operates
                  </div>
                  <p style={{ margin: '0.25rem 0' }}>
                    1. When you create or register a merchant, Double 7 automatically provisions their account in D1 and registers their email address in Cloudflare Email Routing.
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    2. Cloudflare sends an official verification link from <code>no-reply@cloudflare.com</code> to their Gmail inbox.
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    3. Clicking the link once marks the address as <strong>Verified</strong>. Once verified, the worker can send unlimited automated dispatch updates, 6:00 PM daily reports, and credentials directly from <code>dispatch@sobinupreti.com.np</code>.
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    4. If an email is still pending verification, a backup copy of the merchant&apos;s credentials is automatically sent to the Super Admin (<code>upreti.soben@gmail.com</code>) so operations are never blocked.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 9: SECURITY AUDIT TRAIL */}
            {/* ========================================================================= */}
            {activeSection === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                    Security & Administrative Audit Trail
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Immutable ledger of all Super Admin status overrides, role elevations, password resets, and KV configuration deployments.
                  </p>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflowX: 'auto'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Actor</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Action Executed</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Entity</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                            {log.timestamp}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f8fafc' }}>
                            {log.actor}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#ef4444', fontWeight: 600 }}>
                            {log.action}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#3b82f6' }}>
                            {log.entity}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal 1: Reset Password Modal */}
      {pwdModalUser && (
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
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#0a0f1d',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Reset User Password
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Direct Super Admin override for <strong>{pwdModalUser.name}</strong> ({pwdModalUser.email}).
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>New Password</label>
              <input
                type="text"
                value={newPasswordVal}
                onChange={e => setNewPasswordVal(e.target.value)}
                placeholder="Enter new secure password"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setPwdModalUser(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserPassword}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', backgroundColor: '#ef4444', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Change Role Modal */}
      {roleModalUser && (
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
          <div style={{
            width: '100%',
            maxWidth: '450px',
            backgroundColor: '#0a0f1d',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Change Role & Clearance
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Elevate or reassign role for <strong>{roleModalUser.name}</strong> ({roleModalUser.email}).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Role Tier</label>
                <select
                  value={newRoleVal}
                  onChange={e => setNewRoleVal(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="admin" style={{ backgroundColor: '#0a0f1d' }}>Administrator (Command HQ)</option>
                  <option value="merchant" style={{ backgroundColor: '#0a0f1d' }}>Merchant Shipper</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Sub-Role Title</label>
                <input
                  type="text"
                  value={newSubRoleVal}
                  onChange={e => setNewSubRoleVal(e.target.value)}
                  placeholder="e.g. Command HQ / Super Admin"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setRoleModalUser(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserRole}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', backgroundColor: '#a855f7', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Apply Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Adjust COD Balance Modal */}
      {balanceModalUser && (
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
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#0a0f1d',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Adjust COD Ledger Balance
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Direct Super Admin balance override for <strong>{balanceModalUser.name}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>New Balance (NPR)</label>
                <input
                  type="number"
                  value={newBalanceVal}
                  onChange={e => setNewBalanceVal(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Reason for Adjustment</label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                  placeholder="e.g. Bank dispute clearance, Manual safe deposit reconciliation"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setBalanceModalUser(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserBalance}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', backgroundColor: '#10b981', border: 'none', color: '#060911', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Add New Account Modal */}
      {showAddUserModal && (
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
          <form onSubmit={handleCreateUser} style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '88vh',
            overflowY: 'auto',
            backgroundColor: '#0a0f1d',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Provision New Account
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Create an administrator or verified merchant account with immediate credentials.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Company / Store Name</label>
                <input
                  type="text"
                  value={addForm.company}
                  onChange={e => setAddForm({ ...addForm, company: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Phone Number</label>
                <input
                  type="text"
                  value={addForm.phone}
                  onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Role Tier</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm({ ...addForm, role: e.target.value as any })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="merchant" style={{ backgroundColor: '#0a0f1d' }}>Merchant</option>
                  <option value="admin" style={{ backgroundColor: '#0a0f1d' }}>Administrator</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Initial Password</label>
                <input
                  type="text"
                  value={addForm.password}
                  onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', backgroundColor: '#ef4444', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 5: Status Override Modal */}
      {editingShipment && (
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
          <div style={{
            width: '100%',
            maxWidth: '450px',
            backgroundColor: '#0a0f1d',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Master Status Override
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Override tracking status for consignment <strong style={{ color: '#ef4444' }}>{editingShipment.id}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>New Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="Pending Pickup" style={{ backgroundColor: '#0a0f1d' }}>Pending Pickup</option>
                  <option value="In Transit" style={{ backgroundColor: '#0a0f1d' }}>In Transit (Highway Linehaul)</option>
                  <option value="Out for Delivery" style={{ backgroundColor: '#0a0f1d' }}>Out for Delivery (Local Courier)</option>
                  <option value="Delivered" style={{ backgroundColor: '#0a0f1d' }}>Delivered & Collected</option>
                  <option value="Exception" style={{ backgroundColor: '#0a0f1d' }}>Exception / NDR Re-attempt</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Current Location Hub</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="e.g. Kathmandu Mega-Hub (KTM-01)"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Audit Reason / Waypoint Note</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="e.g. Arrived on schedule via Prithvi Highway Linehaul"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setEditingShipment(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateShipmentStatus(editingShipment.id, editStatus, editLocation, editNote);
                  addAudit('Shipment Status Override', editingShipment.id, `Status updated to ${editStatus} at ${editLocation}.`);
                  notify(`Status updated to ${editStatus} for ${editingShipment.id}`);
                  setEditingShipment(null);
                  loadData();
                }}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', backgroundColor: '#ef4444', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Printable Label */}
      {printingShipment && (
        <PrintableLabel shipment={printingShipment} onClose={() => setPrintingShipment(null)} />
      )}

      {/* Modal 7: 24h Summary Email Modal */}
      {showEmailModal && (
        <EmailSummaryModal
          onClose={() => setShowEmailModal(false)}
          role="admin"
        />
      )}
    </div>
  );
}
