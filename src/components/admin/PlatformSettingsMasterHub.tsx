'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Users,
  Shield,
  ShieldCheck,
  Truck,
  Boxes,
  DollarSign,
  Banknote,
  Bell,
  KeyRound,
  Lock,
  Settings as SettingsIcon,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Download,
  Upload,
  Radio,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  Sparkles,
  Layers,
  FileText,
  Mail,
  Smartphone,
  Server,
  Zap,
  Clock,
  Database,
  ExternalLink,
  RefreshCw,
  Table2
} from 'lucide-react';
import {
  WebsiteSettings,
  getWebsiteSettings,
  updateWebsiteSettings,
  resetToDefaultSettings,
  exportSettingsBackupJson,
  importSettingsBackupJson
} from '../../lib/settings';
import {
  PERMISSION_BUILDER_MODULES,
  PERMISSION_BUILDER_ACTIONS,
  PERMISSION_BUILDER_SCOPES,
  PermissionModule,
  PermissionAction,
  PermissionScope,
  generatePermissionCode,
  DynamicPermissionRule
} from '../../lib/permissions';

type SettingsTab =
  | 'general'
  | 'users_roles'
  | 'logistics'
  | 'pricing'
  | 'finance'
  | 'notifications'
  | 'integrations'
  | 'security'
  | 'database'
  | 'system';

interface Props {
  onNotice?: (msg: string) => void;
  onNavigateWorkflow?: () => void;
  onNavigateDatabase?: () => void;
}

export default function PlatformSettingsMasterHub({ onNotice, onNavigateWorkflow, onNavigateDatabase }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<WebsiteSettings>(getWebsiteSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dynamic Permission Builder State (Pillar 2)
  const [selectedModule, setSelectedModule] = useState<PermissionModule>('Orders');
  const [selectedAction, setSelectedAction] = useState<PermissionAction>('View');
  const [selectedScope, setSelectedScope] = useState<PermissionScope>('Organization');
  const [customRules, setCustomRules] = useState<DynamicPermissionRule[]>([
    {
      id: 'rule-1',
      module: 'Orders',
      action: 'Create',
      scope: 'Organization',
      code: 'orders:create:organization',
      label: 'Create bookings within merchant organization',
      createdAt: '2026-09-10'
    },
    {
      id: 'rule-2',
      module: 'Shipments',
      action: 'Approve',
      scope: 'Branch',
      code: 'shipments:approve:branch',
      label: 'Authorize linehaul dispatch for assigned branch hub',
      createdAt: '2026-09-10'
    },
    {
      id: 'rule-3',
      module: 'Finance',
      action: 'View',
      scope: 'Own Records',
      code: 'finance:view:own_records',
      label: 'Inspect own COD remittance ledger and payout history',
      createdAt: '2026-09-10'
    }
  ]);

  // Logistics Failed Delivery Reason input (Pillar 3)
  const [newReasonInput, setNewReasonInput] = useState('');

  // Backup Import State (Pillar 9)
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    setSettings(getWebsiteSettings());
  }, []);

  const triggerAlert = (msg: string) => {
    if (onNotice) onNotice(msg);
    setSaveBanner(msg);
    setTimeout(() => setSaveBanner(''), 4000);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const updated = updateWebsiteSettings(settings, 'Super Admin Master Hub');
    setSettings(updated);
    setTimeout(() => {
      setIsSaving(false);
      triggerAlert('Master settings saved and synchronized with Cloudflare KV edge cache!');
    }, 400);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all 9 platform settings pillars to factory defaults?')) {
      const def = resetToDefaultSettings();
      setSettings(def);
      triggerAlert('Reset all platform settings to system defaults.');
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
    triggerAlert('Copied to clipboard!');
  };

  const handleAddPermissionRule = () => {
    const code = generatePermissionCode(selectedModule, selectedAction, selectedScope);
    if (customRules.some(r => r.code === code)) {
      triggerAlert(`Rule ${code} already exists in matrix.`);
      return;
    }
    const newRule: DynamicPermissionRule = {
      id: `rule-${Date.now()}`,
      module: selectedModule,
      action: selectedAction,
      scope: selectedScope,
      code,
      label: `${selectedAction} ${selectedModule} with ${selectedScope} scope`,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setCustomRules([newRule, ...customRules]);
    triggerAlert(`Added permission rule: ${code}`);
  };

  const handleDeletePermissionRule = (id: string) => {
    setCustomRules(customRules.filter(r => r.id !== id));
    triggerAlert('Permission rule removed.');
  };

  const handleAddFailedReason = () => {
    if (!newReasonInput.trim()) return;
    if (settings.failedDeliveryReasons.includes(newReasonInput.trim())) {
      triggerAlert('Reason already exists.');
      return;
    }
    const updatedReasons = [...settings.failedDeliveryReasons, newReasonInput.trim()];
    setSettings({ ...settings, failedDeliveryReasons: updatedReasons });
    setNewReasonInput('');
    triggerAlert('Added failed delivery reason.');
  };

  const handleRemoveFailedReason = (reason: string) => {
    const updated = settings.failedDeliveryReasons.filter(r => r !== reason);
    setSettings({ ...settings, failedDeliveryReasons: updated });
    triggerAlert('Removed failed delivery reason.');
  };

  const handleExportBackup = () => {
    const json = exportSettingsBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `double7-settings-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerAlert('Platform settings backup JSON downloaded.');
  };

  const handleImportBackup = () => {
    if (!importJsonText.trim()) return;
    const res = importSettingsBackupJson(importJsonText.trim());
    if (res.success) {
      setSettings(getWebsiteSettings());
      setShowImportModal(false);
      setImportJsonText('');
      triggerAlert(res.message);
    } else {
      triggerAlert(res.message);
    }
  };

  const tabsConfig = [
    { id: 'general', label: 'General', icon: Globe2, desc: 'Company, Logo & Locales' },
    { id: 'users_roles', label: 'Users & Roles', icon: Users, desc: 'Permission Builder Matrix' },
    { id: 'logistics', label: 'Logistics & NDR', icon: Truck, desc: 'Reattempt & Status Rules' },
    { id: 'pricing', label: 'Pricing & Tariffs', icon: DollarSign, desc: 'Express & Bulk Surcharges' },
    { id: 'finance', label: 'Finance & COD', icon: Banknote, desc: 'VAT & Daily Remittances' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'SMS, Email & WhatsApp' },
    { id: 'integrations', label: 'API & Webhooks', icon: KeyRound, desc: 'Keys, Endpoints & Plugins' },
    { id: 'security', label: 'Security & 2FA', icon: Lock, desc: 'Access Control & Lockout' },
    { id: 'database', label: 'Database & Storage', icon: Database, desc: 'D1 Engine & Google Sheets DB' },
    { id: 'system', label: 'System & Audit', icon: Server, desc: 'Backup, Cache & Live Mode' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem 1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <SettingsIcon size={20} color="#ef4444" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                Platform Settings Master Hub
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.15rem 0 0 0' }}>
                Full 9-pillar architecture: Permissions, NDR rules, freight tariffs, COD settlement & edge config.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportBackup}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={14} /> Export Backup
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Upload size={14} /> Restore
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} /> Factory Reset
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.4rem',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: isSaving ? 'wait' : 'pointer',
              boxShadow: '0 4px 18px rgba(239, 68, 68, 0.35)'
            }}
          >
            <Save size={15} />
            {isSaving ? 'Synchronizing...' : 'Save & Deploy Settings'}
          </button>
        </div>
      </div>

      {/* Live Save Notice Banner */}
      {saveBanner && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#10b981',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle2 size={16} /> {saveBanner}
        </div>
      )}

      {/* 9-Pillars Tab Bar */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {tabsConfig.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1.1rem',
                borderRadius: '10px',
                border: isActive ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.06)',
                backgroundColor: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={16} color={isActive ? '#ef4444' : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* PILLAR 1: GENERAL & BRAND IDENTITY */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Brand & Gateway */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe2 size={18} color="#3b82f6" /> Brand Identity & Legal Details
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Brand Name</label>
              <input
                type="text"
                value={settings.brandName}
                onChange={e => setSettings({ ...settings, brandName: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Network Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Headquarters Gateway Address</label>
              <input
                type="text"
                value={settings.headquartersAddress}
                onChange={e => setSettings({ ...settings, headquartersAddress: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Company Registration / PAN No.</label>
              <input
                type="text"
                value={settings.businessRegistrationNo}
                onChange={e => setSettings({ ...settings, businessRegistrationNo: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Card 2: Logo & Locales */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#f59e0b" /> Logo & Localization
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Logo Asset URL</label>
              <input
                type="text"
                value={settings.logoUrl}
                onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="/logo.png"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live Preview:</span>
                <img src={settings.logoUrl || '/logo.png'} alt="Preview" style={{ height: '32px', objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Base Currency</label>
                <select
                  value={settings.currency}
                  onChange={e => {
                    const c = e.target.value;
                    const sym = c === 'NPR' ? 'Rs.' : (c === 'USD' ? '$' : (c === 'EUR' ? '€' : '₹'));
                    setSettings({ ...settings, currency: c, currencySymbol: sym });
                  }}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="NPR" style={{ backgroundColor: '#0a0f1d' }}>NPR - Nepalese Rupee (Rs.)</option>
                  <option value="USD" style={{ backgroundColor: '#0a0f1d' }}>USD - US Dollar ($)</option>
                  <option value="INR" style={{ backgroundColor: '#0a0f1d' }}>INR - Indian Rupee (₹)</option>
                  <option value="EUR" style={{ backgroundColor: '#0a0f1d' }}>EUR - Euro (€)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Timezone</label>
                <input
                  type="text"
                  value={settings.timezone}
                  onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Primary Language</label>
              <select
                value={settings.primaryLanguage}
                onChange={e => setSettings({ ...settings, primaryLanguage: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="English (UK / Global)" style={{ backgroundColor: '#0a0f1d' }}>English (UK / Global)</option>
                <option value="Nepali (नेपाली)" style={{ backgroundColor: '#0a0f1d' }}>Nepali (नेपाली)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 2: USERS & ROLES - PERMISSION BUILDER MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'users_roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section A: Role Hierarchy & Signup Policies */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#c084fc" /> Platform Hierarchy & User Onboarding Policies
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Super Admin Control</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>Full Platform Master Scope</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Branch Hub Operators</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#c084fc', marginTop: '0.2rem' }}>Branch Manifest & Sort Scoped</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Merchant Shipper Accounts</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-cyan)', marginTop: '0.2rem' }}>Tenant Organization Scoped</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Public Merchant Signup</label>
                <select
                  value={settings.publicMerchantSignup ? 'true' : 'false'}
                  onChange={e => setSettings({ ...settings, publicMerchantSignup: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="true" style={{ backgroundColor: '#0a0f1d' }}>Allowed (Open Portal Registration)</option>
                  <option value="false" style={{ backgroundColor: '#0a0f1d' }}>Invite-Only (Restricted by Admin)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Merchant Approval Mode</label>
                <select
                  value={settings.autoApproveMerchants ? 'true' : 'false'}
                  onChange={e => setSettings({ ...settings, autoApproveMerchants: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="false" style={{ backgroundColor: '#0a0f1d' }}>Manual KYC Review (Recommended)</option>
                  <option value="true" style={{ backgroundColor: '#0a0f1d' }}>Instant Auto-Approval</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeoutMinutes}
                  onChange={e => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section B: Dynamic Permission Builder (Module x Action x Scope) */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#10b981" /> Dynamic Permission Builder (Module &times; Action &times; Scope)
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                  Construct granular RBAC security rules following the unified platform permission architecture.
                </p>
              </div>
              <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>Super Admin Engine</span>
            </div>

            {/* Matrix Selector Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Step 1: Module */}
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-orange)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  1. Target Module
                </label>
                <select
                  value={selectedModule}
                  onChange={e => setSelectedModule(e.target.value as PermissionModule)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#0a0f1d', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.85rem' }}
                >
                  {PERMISSION_BUILDER_MODULES.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {PERMISSION_BUILDER_MODULES.find(m => m.id === selectedModule)?.description}
                </div>
              </div>

              {/* Step 2: Action */}
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  2. Allowed Action
                </label>
                <select
                  value={selectedAction}
                  onChange={e => setSelectedAction(e.target.value as PermissionAction)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#0a0f1d', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.85rem' }}
                >
                  {PERMISSION_BUILDER_ACTIONS.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {PERMISSION_BUILDER_ACTIONS.find(a => a.id === selectedAction)?.description}
                </div>
              </div>

              {/* Step 3: Scope */}
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  3. Access Scope
                </label>
                <select
                  value={selectedScope}
                  onChange={e => setSelectedScope(e.target.value as PermissionScope)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#0a0f1d', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.85rem' }}
                >
                  {PERMISSION_BUILDER_SCOPES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {PERMISSION_BUILDER_SCOPES.find(s => s.id === selectedScope)?.description}
                </div>
              </div>
            </div>

            {/* Preview & Add Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '0.85rem 1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.15)'
            }}>
              <div>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>Generated Permission Code:</span>
                <div style={{ fontFamily: 'monospace', fontSize: '0.92rem', fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>
                  {generatePermissionCode(selectedModule, selectedAction, selectedScope)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPermissionRule}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Add to Rule Matrix
              </button>
            </div>

            {/* Active Matrix Rules */}
            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                Active Dynamic Permission Rules ({customRules.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {customRules.map(rule => (
                  <div
                    key={rule.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#38bdf8', fontWeight: 700 }}>
                        {rule.code}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        &bull; {rule.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePermissionRule(rule.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        padding: '0.2rem 0.4rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Remove rule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 3: LOGISTICS & NDR REATTEMPT RULES */}
      {/* ========================================================================= */}
      {activeTab === 'logistics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Failed Delivery & Reattempt Configuration */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#f59e0b" /> Failed Delivery (NDR) & Reattempt Rules Engine
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                  Direct implementation of Section 7 (Failed Delivery Graph): controls reattempt thresholds and automatic Return to Merchant (RTO).
                </p>
              </div>

              {onNavigateWorkflow && (
                <button
                  type="button"
                  onClick={onNavigateWorkflow}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 0.9rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 102, 0, 0.12)',
                    border: '1px solid rgba(255, 102, 0, 0.3)',
                    color: 'var(--brand-orange)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Sliders size={14} /> Open Tracking Workflow Editor &rarr;
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Max Delivery Attempts Before RTO
                </label>
                <select
                  value={settings.maxDeliveryAttempts}
                  onChange={e => setSettings({ ...settings, maxDeliveryAttempts: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value={1} style={{ backgroundColor: '#0a0f1d' }}>1 Attempt (Immediate Return if Failed)</option>
                  <option value={2} style={{ backgroundColor: '#0a0f1d' }}>2 Attempts (Standard Double 7 Rule)</option>
                  <option value={3} style={{ backgroundColor: '#0a0f1d' }}>3 Attempts (Extended Commercial Rule)</option>
                </select>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  When attempts reach max, system automatically flags parcel for Return to Merchant (RTO).
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Reattempt Grace Interval
                </label>
                <select
                  value={settings.reattemptGraceHours}
                  onChange={e => setSettings({ ...settings, reattemptGraceHours: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value={12} style={{ backgroundColor: '#0a0f1d' }}>12 Hours (Same-Day Evening Slot)</option>
                  <option value={24} style={{ backgroundColor: '#0a0f1d' }}>24 Hours (Next Day Morning Slot)</option>
                  <option value={48} style={{ backgroundColor: '#0a0f1d' }}>48 Hours (Weekend / Post-Holiday Slot)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Auto-Trigger NDR SMS to Consignee
                </label>
                <select
                  value={settings.autoSendNdrSms ? 'true' : 'false'}
                  onChange={e => setSettings({ ...settings, autoSendNdrSms: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="true" style={{ backgroundColor: '#0a0f1d' }}>Enabled (SMS with reattempt date & helpline)</option>
                  <option value="false" style={{ backgroundColor: '#0a0f1d' }}>Disabled (Manual dispatcher call only)</option>
                </select>
              </div>
            </div>

            {/* Configured Failed Reasons List */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Configured NDR Failed Delivery Reasons
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                {settings.failedDeliveryReasons.map((reason, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#fbbf24',
                      fontSize: '0.78rem'
                    }}
                  >
                    {reason}
                    <button
                      type="button"
                      onClick={() => handleRemoveFailedReason(reason)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '540px' }}>
                <input
                  type="text"
                  placeholder="Enter new exception reason..."
                  value={newReasonInput}
                  onChange={e => setNewReasonInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFailedReason(); } }}
                  style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={handleAddFailedReason}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Add Reason
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 4: PRICING & TARIFFS */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Base Tariffs */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} color="#10b981" /> Zone Base Rates ({settings.currencySymbol})
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Intra-Kathmandu Valley Rate</label>
              <input
                type="number"
                value={settings.valleyBaseRate}
                onChange={e => setSettings({ ...settings, valleyBaseRate: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Outside Valley / Highway Trunk Rate</label>
              <input
                type="number"
                value={settings.outsideValleyBaseRate}
                onChange={e => setSettings({ ...settings, outsideValleyBaseRate: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Remote Mountain & Air Cargo Rate</label>
              <input
                type="number"
                value={settings.remoteBaseRate}
                onChange={e => setSettings({ ...settings, remoteBaseRate: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Weight Thresholds & Surcharges */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Boxes size={18} color="#ff6600" /> Weight & Bulk Surcharges
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Bulk Cargo Weight Threshold (kg)</label>
              <input
                type="number"
                value={settings.bulkWeightThresholdKg}
                onChange={e => setSettings({ ...settings, bulkWeightThresholdKg: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Shipments &gt; 10kg require dimension input and volumetric freight calculation.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Volumetric Divisor (L &times; W &times; H / divisor)</label>
              <input
                type="number"
                value={settings.bulkVolumetricDivisor}
                onChange={e => setSettings({ ...settings, bulkVolumetricDivisor: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Return Fee (%)</label>
                <input
                  type="number"
                  value={settings.returnFeePercent}
                  onChange={e => setSettings({ ...settings, returnFeePercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Fuel Surcharge (%)</label>
                <input
                  type="number"
                  value={settings.fuelSurchargePercent}
                  onChange={e => setSettings({ ...settings, fuelSurchargePercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 5: FINANCE & COD SETTLEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'finance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Banknote size={18} color="#10b981" /> COD Collection & Settlement Schedules
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>COD Handling Fee (% or Flat)</label>
              <input
                type="number"
                step="0.1"
                value={settings.codFeeValue}
                onChange={e => setSettings({ ...settings, codFeeValue: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Daily Cut-Off & Reset Time (NPT)</label>
              <input
                type="text"
                value={settings.dailyResetTime}
                onChange={e => setSettings({ ...settings, dailyResetTime: e.target.value })}
                placeholder="18:00 (6:00 PM)"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Settlement Cycle</label>
              <select
                value={settings.settlementCycle}
                onChange={e => setSettings({ ...settings, settlementCycle: e.target.value as any })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="daily" style={{ backgroundColor: '#0a0f1d' }}>Daily Automated Batch (18:00 NPT)</option>
                <option value="weekly" style={{ backgroundColor: '#0a0f1d' }}>Weekly on Fridays</option>
                <option value="biweekly" style={{ backgroundColor: '#0a0f1d' }}>Bi-Weekly (1st & 15th)</option>
                <option value="on_demand" style={{ backgroundColor: '#0a0f1d' }}>On-Demand Merchant Request</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Minimum Payout Threshold (Rs.)</label>
              <input
                type="number"
                value={settings.minPayoutThresholdNpr}
                onChange={e => setSettings({ ...settings, minPayoutThresholdNpr: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#3b82f6" /> Tax & Digital Invoicing
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Government VAT Rate (%)</label>
              <input
                type="number"
                value={settings.vatRatePercent}
                onChange={e => setSettings({ ...settings, vatRatePercent: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Platform PAN / VAT Number</label>
              <input
                type="text"
                value={settings.panVatNumber}
                onChange={e => setSettings({ ...settings, panVatNumber: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Digital Invoice Prefix</label>
              <input
                type="text"
                value={settings.digitalInvoicePrefix}
                onChange={e => setSettings({ ...settings, digitalInvoicePrefix: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Remittance Instructions Notes</label>
              <input
                type="text"
                value={settings.bankRemittanceNotes}
                onChange={e => setSettings({ ...settings, bankRemittanceNotes: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 6: MULTI-CHANNEL NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* SMS & WhatsApp */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={18} color="#10b981" /> SMS & WhatsApp Gateways
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>SMS Provider</label>
              <select
                value={settings.smsProvider}
                onChange={e => setSettings({ ...settings, smsProvider: e.target.value as any })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="sparrow" style={{ backgroundColor: '#0a0f1d' }}>Sparrow SMS (Nepal Telecom / Ncell)</option>
                <option value="aakash" style={{ backgroundColor: '#0a0f1d' }}>Aakash SMS Gateway</option>
                <option value="twilio" style={{ backgroundColor: '#0a0f1d' }}>Twilio Global SMS</option>
                <option value="disabled" style={{ backgroundColor: '#0a0f1d' }}>Disabled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>SMS Sender ID</label>
              <input
                type="text"
                value={settings.smsSenderId}
                onChange={e => setSettings({ ...settings, smsSenderId: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>WhatsApp Business Gateway</label>
              <select
                value={settings.whatsappApiEnabled ? 'true' : 'false'}
                onChange={e => setSettings({ ...settings, whatsappApiEnabled: e.target.value === 'true' })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="true" style={{ backgroundColor: '#0a0f1d' }}>Active (Doorstep OTP & live tracking link)</option>
                <option value="false" style={{ backgroundColor: '#0a0f1d' }}>Disabled</option>
              </select>
            </div>
          </div>

          {/* Email & Triggers */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} color="#38bdf8" /> Transactional Email & Triggers
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Email Relay Provider</label>
              <select
                value={settings.emailProvider}
                onChange={e => setSettings({ ...settings, emailProvider: e.target.value as any })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="cloudflare_relay" style={{ backgroundColor: '#0a0f1d' }}>Cloudflare Email Routing (dispatch@sobinupreti.com.np)</option>
                <option value="smtp" style={{ backgroundColor: '#0a0f1d' }}>Custom SMTP Relay</option>
                <option value="ses" style={{ backgroundColor: '#0a0f1d' }}>Amazon SES</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Default Sender Address</label>
              <input
                type="email"
                value={settings.defaultSenderEmail}
                onChange={e => setSettings({ ...settings, defaultSenderEmail: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Automated Customer Milestone Alerts</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.notifyOnCreated} onChange={e => setSettings({ ...settings, notifyOnCreated: e.target.checked })} /> Booking Confirmed
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.notifyOnDispatched} onChange={e => setSettings({ ...settings, notifyOnDispatched: e.target.checked })} /> Dispatched
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.notifyOnOutForDelivery} onChange={e => setSettings({ ...settings, notifyOnOutForDelivery: e.target.checked })} /> Out for Delivery
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.notifyOnDelivered} onChange={e => setSettings({ ...settings, notifyOnDelivered: e.target.checked })} /> Delivered (Signed)
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 7: API & WEBHOOKS */}
      {/* ========================================================================= */}
      {activeTab === 'integrations' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* API Keys */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={18} color="#ef4444" /> REST API Credentials
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Production Secret Key</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="password"
                  readOnly
                  value={settings.productionApiKey}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(settings.productionApiKey, 'prod_key')}
                  style={{ padding: '0.65rem 0.9rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer' }}
                >
                  {copiedKey === 'prod_key' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Sandbox Test Key</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="password"
                  readOnly
                  value={settings.sandboxApiKey}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(settings.sandboxApiKey, 'sand_key')}
                  style={{ padding: '0.65rem 0.9rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer' }}
                >
                  {copiedKey === 'sand_key' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const newKey = `d7_live_pk_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
                setSettings({ ...settings, productionApiKey: newKey });
                triggerAlert('Regenerated live API key.');
              }}
              style={{ padding: '0.55rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Rotate Production Key
            </button>
          </div>

          {/* Webhooks & E-Commerce */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="#f59e0b" /> Webhooks & E-Commerce Sync
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Webhook Listener URL</label>
              <input
                type="url"
                value={settings.webhookUrl}
                onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Webhook Signing Secret</label>
              <input
                type="text"
                readOnly
                value={settings.webhookSecret}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>E-Commerce Store Plugins</label>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.shopifyEnabled} onChange={e => setSettings({ ...settings, shopifyEnabled: e.target.checked })} /> Shopify App
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.woocommerceEnabled} onChange={e => setSettings({ ...settings, woocommerceEnabled: e.target.checked })} /> WooCommerce Plugin
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 8: SECURITY & 2FA */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="#ef4444" /> Authentication & Password Policy
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Two-Factor Authentication (2FA)</label>
              <select
                value={settings.twoFactorEnforced ? 'true' : 'false'}
                onChange={e => setSettings({ ...settings, twoFactorEnforced: e.target.value === 'true' })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="true" style={{ backgroundColor: '#0a0f1d' }}>Enforced for Super Admins & Branch Hub Operators</option>
                <option value="false" style={{ backgroundColor: '#0a0f1d' }}>Optional (Standard Password Login)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Minimum Password Length</label>
                <input
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={e => setSettings({ ...settings, passwordMinLength: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Max Failed Login Lockout</label>
                <input
                  type="number"
                  value={settings.maxFailedLogins}
                  onChange={e => setSettings({ ...settings, maxFailedLogins: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="#c084fc" /> IP Whitelisting & Infrastructure Guard
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>IP Address Restrictions</label>
              <select
                value={settings.ipRestrictionEnabled ? 'true' : 'false'}
                onChange={e => setSettings({ ...settings, ipRestrictionEnabled: e.target.value === 'true' })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="false" style={{ backgroundColor: '#0a0f1d' }}>Disabled (Worldwide Operator Access)</option>
                <option value="true" style={{ backgroundColor: '#0a0f1d' }}>Enabled (Only Whitelisted Hub CIDR Blocks)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Whitelisted Hub Subnets</label>
              <input
                type="text"
                value={settings.whitelistedIps.join(', ')}
                onChange={e => setSettings({ ...settings, whitelistedIps: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 9: SYSTEM & AUDIT */}
      {/* ========================================================================= */}
      {/* TAB 9: DATABASE & CLOUD STORAGE SETTINGS */}
      {activeTab === 'database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Banner with Direct Launch CTA */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(255, 102, 0, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <Database size={22} color="var(--brand-orange)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Active Hybrid Database Engine: Cloudflare D1 + Google Sheets Live
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                Double 7 Logistics synchronizes relational edge state (D1 SQLite bindings) with a live, two-way synchronized Google Sheets Master Database for instant operations, audits, and automated 6:00 PM reconciliations.
              </p>
            </div>
            {onNavigateDatabase && (
              <button
                type="button"
                onClick={onNavigateDatabase}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--brand-orange)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(255, 102, 0, 0.4)'
                }}
              >
                <Table2 size={16} /> Open Full Database Control Center &rarr;
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Google Sheets Live Database Card */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                  <Globe2 size={18} /> Google Sheets Master Live DB
                </h3>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                  CONNECTED &bull; 8 TABS
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Master Spreadsheet Document URL
                </label>
                <input
                  type="text"
                  readOnly
                  value="https://docs.google.com/spreadsheets/d/1VSfNIHXouc3u_DTcWY1Hs-Hp7wCFf6tfrZC87zlprVA/edit?usp=sharing"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {['01_SHIPMENTS', '02_MANIFESTS', '03_CHECKPOINTS', '04_COD_REMITTANCE', '05_USERS', '06_HUBS', '07_STAFF_DRIVERS', '08_AUDIT_LOGS'].map(tab => (
                  <span key={tab} style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                    {tab}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                <a
                  href="https://docs.google.com/spreadsheets/d/1VSfNIHXouc3u_DTcWY1Hs-Hp7wCFf6tfrZC87zlprVA/edit?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <ExternalLink size={14} /> Open Live Sheet ↗
                </a>
                <a
                  href="/DOUBLE_7_LOGISTICS_MASTER_DB.xlsx"
                  download="DOUBLE_7_LOGISTICS_MASTER_DB.xlsx"
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Download size={14} /> Export .xlsx
                </a>
              </div>
            </div>

            {/* Cloudflare D1 Edge Relational DB Settings */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={18} color="var(--brand-orange)" /> Cloudflare D1 Edge Bindings
                </h3>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '6px', backgroundColor: 'rgba(255, 102, 0, 0.15)', color: 'var(--brand-orange)', fontWeight: 700 }}>
                  ACTIVE BINDINGS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    <span>tracking_db</span>
                    <span style={{ color: '#10b981' }}>OK</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    165e3eb4-9323-413f-be55-cc7846857cd3
                  </div>
                </div>

                <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    <span>users</span>
                    <span style={{ color: '#10b981' }}>OK</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    6adbc3b5-ed24-48cc-8be2-8244363b650d
                  </div>
                </div>

                <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    <span>KV LOGISTICS_CACHE</span>
                    <span style={{ color: '#10b981' }}>OK</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    fbe236634e3b4516a768338e81028b55
                  </div>
                </div>
              </div>

              {onNavigateDatabase && (
                <button
                  type="button"
                  onClick={onNavigateDatabase}
                  style={{
                    marginTop: 'auto',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 102, 0, 0.12)',
                    border: '1px solid rgba(255, 102, 0, 0.3)',
                    color: 'var(--brand-orange)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <RefreshCw size={14} /> Open SQL Console &amp; Table Manager &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: SYSTEM & AUDIT */}
      {activeTab === 'system' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Site Mode & Maintenance */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={18} color="#f59e0b" /> Site Operation Mode & Broadcast Banner
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Platform Operating Mode</label>
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
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Announcement Active</label>
              <select
                value={settings.announcement.active ? 'true' : 'false'}
                onChange={e => setSettings({ ...settings, announcement: { ...settings.announcement, active: e.target.value === 'true' } })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="true" style={{ backgroundColor: '#0a0f1d' }}>Active (Show on website banner)</option>
                <option value="false" style={{ backgroundColor: '#0a0f1d' }}>Disabled (Hidden)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Announcement Title</label>
              <input
                type="text"
                value={settings.announcement.title}
                onChange={e => setSettings({ ...settings, announcement: { ...settings.announcement, title: e.target.value } })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Announcement Message</label>
              <input
                type="text"
                value={settings.announcement.message}
                onChange={e => setSettings({ ...settings, announcement: { ...settings.announcement, message: e.target.value } })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Backup & Audit */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} color="#3b82f6" /> Edge Snapshot & Data Retention
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Data Retention Policy (Days)</label>
              <input
                type="number"
                value={settings.dataRetentionDays}
                onChange={e => setSettings({ ...settings, dataRetentionDays: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Last Master Configuration Update</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Time: {new Date(settings.lastUpdated).toLocaleString('en-US')}<br />
                By: {settings.updatedBy}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={handleExportBackup}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Download size={14} /> Export Backup
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Upload size={14} /> Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            backgroundColor: '#0a0f1d',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '1.5rem',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#fff' }}>
              Restore Settings from JSON Backup
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 1rem 0' }}>
              Paste your exported JSON backup text below to restore all 9 settings pillars.
            </p>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              placeholder="Paste backup JSON here..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportJsonText(''); }}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportBackup}
                style={{
                  padding: '0.6rem 1.3rem',
                  borderRadius: '8px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Apply Backup Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
