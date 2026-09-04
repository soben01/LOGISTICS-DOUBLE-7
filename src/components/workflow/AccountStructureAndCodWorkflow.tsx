'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Banknote,
  Truck,
  Boxes,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  Sliders,
  RotateCcw,
  Zap,
  Play,
  FileText,
  Lock,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  CodOrderRecord,
  CodStage,
  getCodRecords,
  advanceCodStage,
  resolveDiscrepancy,
  toggleDisputeHold,
  depositRiderCashBatchToHub,
  scheduleNdrReattempt,
  initiateRtoReturn,
  resetCodDemoData
} from '../../lib/cod';
import { SYSTEM_PERMISSIONS, ROLE_PRESETS } from '../../lib/permissions';
import { getCurrentUser, User, SubUser, getSubUsers } from '../../lib/auth';

interface Props {
  initialRole?: 'admin' | 'merchant';
  showInteractiveControls?: boolean;
}

export default function AccountStructureAndCodWorkflow({
  initialRole = 'admin',
  showInteractiveControls = true,
}: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'pipeline' | 'ledgers' | 'audit'>('pipeline');
  const [codRecords, setCodRecords] = useState<CodOrderRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('cod-np-102');
  const [selectedStage, setSelectedStage] = useState<CodStage | 'all'>('all');
  const [actionNotice, setActionNotice] = useState<string>('');
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);

  // Simulation controls state
  const [simCollectedAmount, setSimCollectedAmount] = useState<number>(4500);
  const [simFailReason, setSimFailReason] = useState<string>('Customer phone unreachable');
  const [simDiscrepancyNote, setSimDiscrepancyNote] = useState<string>('Customer promo voucher applied');

  const reloadData = () => {
    setCodRecords(getCodRecords());
    setSubUsers(getSubUsers());
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    reloadData();

    const handleCodChange = () => reloadData();
    window.addEventListener('cod-records-change', handleCodChange);
    return () => window.removeEventListener('cod-records-change', handleCodChange);
  }, []);

  const triggerToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  const selectedRecord = codRecords.find(r => r.id === selectedRecordId) || codRecords[0];

  // Stage counts
  const stageCounts: Record<string, number> = {
    all: codRecords.length,
    order_placed: codRecords.filter(r => r.stage === 'order_placed').length,
    picked_up: codRecords.filter(r => r.stage === 'picked_up').length,
    out_for_delivery: codRecords.filter(r => r.stage === 'out_for_delivery').length,
    delivered: codRecords.filter(r => r.stage === 'delivered').length,
    cash_collected: codRecords.filter(r => r.stage === 'cash_collected').length,
    remitted_to_hub: codRecords.filter(r => r.stage === 'remitted_to_hub').length,
    reconciled: codRecords.filter(r => r.stage === 'reconciled').length,
    settled: codRecords.filter(r => r.stage === 'settled').length,
    failed: codRecords.filter(r => r.stage === 'failed').length,
  };

  // Summary Metrics
  const totalCodValue = codRecords.reduce((sum, r) => sum + r.orderAmountNpr, 0);
  const totalCollected = codRecords.reduce((sum, r) => sum + (r.collectedAmountNpr || 0), 0);
  const discrepancyCount = codRecords.filter(r => r.isDiscrepancy).length;
  const agingAlertCount = codRecords.filter(r => r.isAgingAlert).length;
  const disputeHoldCount = codRecords.filter(r => r.isPayoutHeld).length;

  return (
    <div style={{ width: '100%', marginBottom: '2.5rem' }}>
      {/* Toast Notice */}
      {actionNotice && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          background: 'linear-gradient(135deg, #ff6600, #ea580c)',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={18} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Section Header with View Modes */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }} className="badge badge-orange">
            <Zap size={13} />
            <span>ENTERPRISE ARCHITECTURE &amp; COD ENGINE</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', margin: 0 }}>
            Account Structure &amp; Advanced COD Workflow
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Multi-tenant permission hierarchy &bull; End-to-end Cash-on-Delivery loop with automated dispute handling
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(18, 28, 52, 0.7)',
          padding: '0.3rem',
          borderRadius: '10px',
          border: '1px solid var(--border-medium)',
          gap: '0.25rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'pipeline' ? 'var(--brand-orange)' : 'transparent',
              color: activeTab === 'pipeline' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Banknote size={14} />
            <span>COD Workflow Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'architecture' ? 'var(--brand-cyan)' : 'transparent',
              color: activeTab === 'architecture' ? '#070a13' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={14} />
            <span>Account Structure</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledgers')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'ledgers' ? '#10b981' : 'transparent',
              color: activeTab === 'ledgers' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Boxes size={14} />
            <span>Rider &amp; Hub Ledgers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'audit' ? '#a855f7' : 'transparent',
              color: activeTab === 'audit' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={14} />
            <span>Audit Trail Log</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ACCOUNT STRUCTURE VIEW (FAITHFUL TO REFERENCE DIAGRAM 1) */}
      {/* ======================================================== */}
      {activeTab === 'architecture' && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 2.5rem auto' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Multi-Tenant Hierarchy &amp; Scoped Permissions
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Hierarchical isolation ensures complete enterprise data segregation. Admins manage internal staff; merchants manage store dispatchers. Both are governed by Double 7&apos;s unified permission matrix.
            </p>
          </div>

          {/* DIAGRAM 1: CLEAN VISUAL STRUCTURE MATCHING SCREENSHOT */}
          <div style={{
            maxWidth: '820px',
            margin: '0 auto',
            padding: '2rem 1.5rem',
            background: 'rgba(7, 10, 18, 0.65)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative'
          }}>
            {/* Top Row: Admin Portal (Left) and Merchant Portal (Right) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2.5rem',
              marginBottom: '2rem'
            }}>
              {/* Admin Portal Card (Blue theme) */}
              <div style={{
                background: 'rgba(14, 165, 233, 0.06)',
                border: '2px solid rgba(56, 189, 248, 0.6)',
                borderRadius: '14px',
                padding: '1.5rem',
                position: 'relative'
              }}>
                <div style={{
                  color: '#38bdf8',
                  fontWeight: 800,
                  fontSize: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <ShieldCheck size={18} />
                  <span>Admin portal</span>
                </div>

                {/* Admin Account Box (Mint Green) */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1.5px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
                    Admin account
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Full system access
                  </div>
                </div>

                {/* Down Arrow */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0.35rem 0', color: '#38bdf8' }}>
                  <ArrowDown size={18} />
                </div>

                {/* Sub-admins Box (Light Blue) */}
                <div style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1.5px solid rgba(56, 189, 248, 0.5)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.95rem' }}>
                    Sub-admins
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Scoped, role-based access
                  </div>
                </div>
              </div>

              {/* Merchant Portal Card (Peach / Brown theme) */}
              <div style={{
                background: 'rgba(249, 115, 22, 0.06)',
                border: '2px solid rgba(249, 115, 22, 0.6)',
                borderRadius: '14px',
                padding: '1.5rem',
                position: 'relative'
              }}>
                <div style={{
                  color: '#fb923c',
                  fontWeight: 800,
                  fontSize: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Building size={18} />
                  <span>Merchant portal</span>
                </div>

                {/* Merchant Account Box (Rose / Lavender) */}
                <div style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1.5px solid rgba(244, 63, 94, 0.45)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ fontWeight: 800, color: '#fb7185', fontSize: '0.95rem' }}>
                    Merchant account
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Owns store, billing, staff
                  </div>
                </div>

                {/* Down Arrow */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0.35rem 0', color: '#fb923c' }}>
                  <ArrowDown size={18} />
                </div>

                {/* Sub-merchants Box (Peach) */}
                <div style={{
                  background: 'rgba(251, 146, 60, 0.12)',
                  border: '1.5px solid rgba(251, 146, 60, 0.45)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 800, color: '#fb923c', fontSize: '0.95rem' }}>
                    Sub-merchants
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Staff with limited scope
                  </div>
                </div>
              </div>
            </div>

            {/* Connecting Bracket Line Down to Engine */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '60%',
                height: '18px',
                borderLeft: '2px solid rgba(255, 255, 255, 0.25)',
                borderRight: '2px solid rgba(255, 255, 255, 0.25)',
                borderBottom: '2px solid rgba(255, 255, 255, 0.25)',
                marginBottom: '0.5rem'
              }}></div>
              <ArrowDown size={20} color="var(--brand-orange)" />
            </div>

            {/* Centered Engine Box: Roles and Permissions Engine */}
            <div style={{
              maxWidth: '420px',
              margin: '0 auto',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '12px',
              padding: '1.1rem',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Sliders size={16} color="var(--brand-orange)" />
                <span>Roles and permissions engine</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Defines what each sub-user can see or do
              </div>
            </div>

            {/* Footnote text matching user screenshot */}
            <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Each admin only manages sub-admins they created; each merchant only manages their own sub-merchants
            </div>
          </div>

          {/* Explanatory callout matching screenshot text */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem 2rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.94rem',
            color: 'var(--text-primary)',
            lineHeight: '1.7'
          }}>
            <strong style={{ color: '#ffffff' }}>That&apos;s the account structure:</strong> each admin manages only the sub-admins they created, and each merchant manages only their own sub-merchant staff, both governed by a shared permission engine so access stays scoped and isolated per parent account.
          </div>

          {/* Active Sub-Users Table across Roles */}
          <div style={{ marginTop: '2.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="var(--brand-cyan)" />
              <span>Current Configured Sub-Users ({subUsers.length})</span>
            </h4>

            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Sub-User Name</th>
                    <th>Parent Account</th>
                    <th>Portal Scope</th>
                    <th>Designated Sub-Role</th>
                    <th>Granted Permissions</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subUsers.map(su => (
                    <tr key={su.id}>
                      <td>
                        <strong>{su.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{su.email}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                          {su.parentName || su.parentId || 'Master Admin'}
                        </span>
                      </td>
                      <td>
                        <span className={su.role === 'admin' ? 'badge badge-orange' : 'badge badge-cyan'} style={{ fontSize: '0.7rem' }}>
                          {su.role === 'admin' ? 'ADMIN PORTAL' : 'MERCHANT PORTAL'}
                        </span>
                      </td>
                      <td>
                        <strong>{su.subRole}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: '320px' }}>
                          {su.permissions.map((p, idx) => (
                            <span key={idx} style={{
                              fontSize: '0.68rem',
                              background: 'rgba(255,255,255,0.07)',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)'
                            }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={su.status === 'active' ? 'badge badge-emerald' : 'badge badge-rose'} style={{ fontSize: '0.7rem' }}>
                          {su.status.toUpperCase()}
                        </span>
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
      {/* 2. COD WORKFLOW VIEW (FAITHFUL TO REFERENCE DIAGRAM 2)    */}
      {/* ======================================================== */}
      {activeTab === 'pipeline' && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          {/* Header Description matching screenshot */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '1.05rem', color: '#ffffff', lineHeight: '1.7', margin: 0 }}>
              Now here&apos;s the <strong>advanced COD workflow</strong> &mdash; from order placement through to merchant settlement, with exception handling built in.
            </p>
          </div>

          {/* DIAGRAM 2: PIPELINE WITH FORKS AND EXCEPTION HANDLING */}
          <div style={{
            background: 'rgba(7, 10, 18, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            marginBottom: '2.5rem',
            position: 'relative'
          }}>
            {/* Top Horizontal Row: Order placed -> Picked up -> Out for delivery -> Delivered? */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '2.5rem'
            }}>
              {/* Stage 1: Order placed */}
              <div style={{
                flex: '1 1 180px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '12px',
                padding: '1.1rem 0.9rem',
                textAlign: 'center',
                position: 'relative',
                boxShadow: stageCounts.order_placed > 0 ? '0 0 16px rgba(255,255,255,0.1)' : 'none'
              }}>
                <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>
                  Order placed
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Payment mode: COD
                </div>
                <span className="badge badge-subtle" style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '0.65rem' }}>
                  {stageCounts.order_placed} orders
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight size={18} color="var(--border-medium)" style={{ flexShrink: 0 }} />

              {/* Stage 2: Picked up */}
              <div style={{
                flex: '1 1 180px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1.5px solid rgba(56, 189, 248, 0.5)',
                borderRadius: '12px',
                padding: '1.1rem 0.9rem',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.95rem' }}>
                  Picked up
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Assigned to rider
                </div>
                <span className="badge badge-cyan" style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '0.65rem' }}>
                  {stageCounts.picked_up} orders
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight size={18} color="var(--border-medium)" style={{ flexShrink: 0 }} />

              {/* Stage 3: Out for delivery */}
              <div style={{
                flex: '1 1 180px',
                background: 'rgba(14, 165, 233, 0.16)',
                border: '1.5px solid rgba(14, 165, 233, 0.65)',
                borderRadius: '12px',
                padding: '1.1rem 0.9rem',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.95rem' }}>
                  Out for delivery
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Live tracking
                </div>
                <span className="badge badge-cyan" style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '0.65rem' }}>
                  {stageCounts.out_for_delivery} orders
                </span>
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Yes</span>
                <ArrowRight size={18} color="#10b981" />
              </div>

              {/* Decision Node: Delivered? */}
              <div style={{
                flex: '1 1 180px',
                background: 'rgba(245, 158, 11, 0.14)',
                border: '2px solid rgba(245, 158, 11, 0.6)',
                borderRadius: '12px',
                padding: '1.1rem 0.9rem',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.95rem' }}>
                  Delivered?
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Rider confirms
                </div>
                <span className="badge badge-amber" style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '0.65rem' }}>
                  {stageCounts.delivered} confirmed
                </span>
              </div>
            </div>

            {/* Split Branches Row:
                Success Branch: Cash collected -> Remitted to hub -> Reconciled -> Settled
                Failed Branch: Downward arrow -> Failed (Reattempt or return) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              alignItems: 'start'
            }}>
              {/* Left Column: The Cash Collection -> Settlement Pipeline */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} />
                  <span>SUCCESS PATH (CASH COLLECTED &rarr; HUB REMITTANCE &rarr; RECONCILIATION &rarr; SETTLEMENT)</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                  marginBottom: '1rem'
                }}>
                  {/* Stage: Cash collected */}
                  <div style={{
                    flex: '1 1 140px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1.5px solid rgba(16, 185, 129, 0.55)',
                    borderRadius: '10px',
                    padding: '0.85rem 0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.88rem' }}>Cash collected</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Rider marks amount</div>
                  </div>

                  <ArrowRight size={16} color="var(--border-medium)" />

                  {/* Stage: Remitted to hub */}
                  <div style={{
                    flex: '1 1 140px',
                    background: 'rgba(20, 184, 166, 0.12)',
                    border: '1.5px solid rgba(20, 184, 166, 0.55)',
                    borderRadius: '10px',
                    padding: '0.85rem 0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 800, color: '#14b8a6', fontSize: '0.88rem' }}>Remitted to hub</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Rider deposits cash</div>
                  </div>

                  <ArrowRight size={16} color="var(--border-medium)" />

                  {/* Stage: Reconciled */}
                  <div style={{
                    flex: '1 1 140px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1.5px solid rgba(168, 85, 247, 0.55)',
                    borderRadius: '10px',
                    padding: '0.85rem 0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 800, color: '#c084fc', fontSize: '0.88rem' }}>Reconciled</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Matched against order</div>
                  </div>

                  <ArrowRight size={16} color="var(--border-medium)" />

                  {/* Stage: Settled */}
                  <div style={{
                    flex: '1 1 140px',
                    background: 'rgba(99, 102, 241, 0.14)',
                    border: '1.5px solid rgba(99, 102, 241, 0.6)',
                    borderRadius: '10px',
                    padding: '0.85rem 0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.88rem' }}>Settled</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Payout to merchant</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Failed Delivery Branch */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px dashed rgba(239, 68, 68, 0.45)',
                borderRadius: '12px',
                padding: '1.25rem',
                minWidth: '220px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <AlertCircle size={15} />
                  <span>EXCEPTION PATH (NO &rarr; FAILED)</span>
                </div>

                <div style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1.5px solid rgba(239, 68, 68, 0.6)',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  textAlign: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.92rem' }}>
                    Failed
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#fca5a5', marginTop: '0.2rem' }}>
                    Reattempt or return
                  </div>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Triggers Non-Delivery Report (NDR), automated buyer SMS reschedule, or Return-to-Origin (RTO) without COD liability.
                </p>
              </div>
            </div>

            {/* Advanced Controls Layered Box matching user screenshot */}
            <div style={{
              marginTop: '2.5rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '14px',
              padding: '1.5rem 1.75rem'
            }}>
              <div style={{
                fontWeight: 800,
                color: '#ffffff',
                fontSize: '0.98rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Sliders size={17} color="var(--brand-orange)" />
                <span>Advanced controls layered on the flow</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.84rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--brand-orange)', fontWeight: 800 }}>&bull;</span>
                  <span><strong>Discrepancy flag</strong> when collected &ne; order amount</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--brand-amber)', fontWeight: 800 }}>&bull;</span>
                  <span><strong>Aging alerts</strong> on unremitted cash past SLA (&gt;24 hrs)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>&bull;</span>
                  <span><strong>Per-rider and per-merchant</strong> real-time COD ledgers</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>&bull;</span>
                  <span><strong>Auto-hold</strong> merchant payout on unresolved disputes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#a855f7', fontWeight: 800 }}>&bull;</span>
                  <span><strong>Audit trail</strong> for every status and amount change</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explanatory text matching screenshot */}
          <div style={{
            padding: '1.5rem 2rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.94rem',
            color: 'var(--text-primary)',
            lineHeight: '1.7',
            marginBottom: '2.5rem'
          }}>
            <strong style={{ color: '#ffffff' }}>That covers the full loop &mdash;</strong> order to pickup to delivery, with a failed-delivery branch, cash collection, hub remittance, reconciliation, and merchant settlement, plus the control layer (discrepancy flags, aging alerts, per-rider ledgers, dispute holds, audit trail) that makes it &quot;advanced&quot; rather than a bare status pipeline.
          </div>

          {/* ======================================================== */}
          {/* INTERACTIVE WORKFLOW SIMULATOR & ORDER TESTER            */}
          {/* ======================================================== */}
          {showInteractiveControls && (
            <div style={{
              background: 'rgba(18, 28, 52, 0.65)',
              borderRadius: '14px',
              border: '1px solid var(--border-medium)',
              padding: '1.75rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '1rem'
              }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--brand-orange)', fontWeight: 700, fontSize: '0.8rem' }}>
                    <Play size={13} />
                    <span>INTERACTIVE SIMULATOR &amp; STAGE ADVANCER</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>
                    Simulate Pipeline Execution on Live Parcels
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetCodDemoData();
                    reloadData();
                    triggerToast('Demo COD database reset to initial states.');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RotateCcw size={13} />
                  <span>Reset Demo Orders</span>
                </button>
              </div>

              {/* Order Selector Pills */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {codRecords.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRecordId(r.id)}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: selectedRecordId === r.id ? 'rgba(255, 102, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                      border: selectedRecordId === r.id ? '1.5px solid var(--brand-orange)' : '1px solid var(--border-subtle)',
                      color: selectedRecordId === r.id ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>{r.trackingNumber}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--brand-orange)' }}>
                      Rs. {r.orderAmountNpr.toLocaleString()}
                    </span>
                    {r.isDiscrepancy && (
                      <span className="badge badge-rose" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>Flag</span>
                    )}
                    {r.isAgingAlert && (
                      <span className="badge badge-amber" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>&gt;24h</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Selected Order Details & Step Actions */}
              {selectedRecord && (
                <div style={{
                  background: 'rgba(7, 10, 18, 0.8)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-medium)',
                  padding: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                          {selectedRecord.trackingNumber}
                        </span>
                        <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>
                          STAGE: {selectedRecord.stage.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {selectedRecord.isPayoutHeld && (
                          <span className="badge badge-rose" style={{ fontSize: '0.72rem' }}>
                            AUTO-HOLD ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Merchant: <strong style={{ color: '#ffffff' }}>{selectedRecord.merchantName}</strong> &bull; Consignee: {selectedRecord.consigneeName} ({selectedRecord.consigneePhone}) &bull; Dest: {selectedRecord.destinationCity} ({selectedRecord.destinationHub})
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER VALUE (COD)</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        Rs. {selectedRecord.orderAmountNpr.toLocaleString()} NPR
                      </div>
                      {selectedRecord.collectedAmountNpr !== undefined && (
                        <div style={{ fontSize: '0.78rem', color: selectedRecord.isDiscrepancy ? 'var(--brand-red)' : '#10b981' }}>
                          Collected: Rs. {selectedRecord.collectedAmountNpr.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Controls for this record */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {/* Advance Stage Form */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.6rem' }}>
                        Advance Pipeline Stage
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                        {(['order_placed', 'picked_up', 'out_for_delivery', 'delivered', 'cash_collected', 'remitted_to_hub', 'reconciled', 'settled'] as CodStage[]).map(stg => (
                          <button
                            key={stg}
                            type="button"
                            onClick={() => {
                              const res = advanceCodStage(
                                selectedRecord.id,
                                stg,
                                { name: currentUser?.name || 'Soben (Admin HQ)', role: currentUser?.role || 'admin' },
                                { note: `Simulated step transition to ${stg}` }
                              );
                              if (res.success) {
                                triggerToast(`Advanced to ${stg.replace(/_/g, ' ').toUpperCase()}`);
                              } else {
                                triggerToast(`Error: ${res.error}`);
                              }
                            }}
                            className={`btn btn-sm ${selectedRecord.stage === stg ? 'btn-primary' : 'btn-outline'}`}
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                          >
                            {stg.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>

                      {/* Exception: Mark Failed */}
                      <button
                        type="button"
                        onClick={() => {
                          const res = advanceCodStage(
                            selectedRecord.id,
                            'failed',
                            { name: currentUser?.name || 'Dipendra Shrestha (Rider)', role: 'Rider' },
                            { note: simFailReason, isFailed: true }
                          );
                          if (res.success) triggerToast('Order marked as FAILED. NDR flow initiated.');
                        }}
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: '0.72rem', width: '100%' }}
                      >
                        Simulate Delivery Failure (Trigger NDR)
                      </button>
                    </div>

                    {/* Discrepancy & Dispute Controls */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.6rem' }}>
                        Simulate Cash Discrepancy &amp; Auto-Hold
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <input
                          type="number"
                          placeholder="Collected Amount"
                          value={simCollectedAmount}
                          onChange={(e) => setSimCollectedAmount(Number(e.target.value))}
                          className="input-field"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            advanceCodStage(
                              selectedRecord.id,
                              'cash_collected',
                              { name: 'Dipendra Shrestha', role: 'Rider' },
                              { collectedAmount: simCollectedAmount, note: `Rider collected Rs. ${simCollectedAmount}` }
                            );
                            triggerToast(`Recorded collection: Rs. ${simCollectedAmount} (Flag triggered if mismatch)`);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        >
                          Record Cash
                        </button>
                      </div>

                      {selectedRecord.isDiscrepancy ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              resolveDiscrepancy(
                                selectedRecord.id,
                                'merchant_voucher_discount',
                                'Store customer discount validated by merchant accounting',
                                { name: currentUser?.name || 'Bikram Rayamajhi (Audit)', role: 'Admin Treasury' }
                              );
                              triggerToast('Discrepancy resolved via merchant discount adjustment.');
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.72rem', borderColor: '#10b981', color: '#10b981' }}
                          >
                            Accept Voucher
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              resolveDiscrepancy(
                                selectedRecord.id,
                                'rider_shortage_debt',
                                'Shortage recorded as rider wage deduction ledger entry',
                                { name: currentUser?.name || 'Pradeep KC', role: 'Hub Controller' }
                              );
                              triggerToast('Shortage logged against rider ledger.');
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.72rem', borderColor: 'var(--brand-orange)', color: 'var(--brand-orange)' }}
                          >
                            Rider Debt
                          </button>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                          No discrepancy active on this order. Enter an amount different from Rs. {selectedRecord.orderAmountNpr} above to test the automated flag.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PER-RIDER & PER-MERCHANT LEDGERS TAB                  */}
      {/* ======================================================== */}
      {activeTab === 'ledgers' && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            Per-Rider &amp; Per-Merchant Real-Time COD Ledgers
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '2rem' }}>
            Live cash balance in rider custody, unremitted cash past SLA, and merchant balance awaiting bank payout.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Rider Cash in Hand Ledger */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={16} color="var(--brand-orange)" />
                  <span>Rider Cash Custody Ledger</span>
                </h4>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>LIVE TELEMETRY</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Rider Name</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Sector</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cash Held</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'rider-pk-04', name: 'Dipendra Shrestha', sector: 'Pokhara Lakeside', cash: 4500, orders: 1 },
                      { id: 'rider-br-11', name: 'Subash Tamang', sector: 'Biratnagar Hub', cash: 12000, orders: 1 },
                      { id: 'rider-ktm-02', name: 'Bibek Bhattarai', sector: 'Kathmandu Valley', cash: 0, orders: 1 },
                      { id: 'rider-btw-09', name: 'Manoj Rana', sector: 'Butwal Highway', cash: 0, orders: 0 },
                    ].map(rd => (
                      <tr key={rd.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.6rem 0.5rem' }}>
                          <strong>{rd.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rd.id}</div>
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem' }}>{rd.sector}</td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 800, color: rd.cash > 0 ? 'var(--brand-amber)' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                          Rs. {rd.cash.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                          {rd.cash > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const res = depositRiderCashBatchToHub(rd.id, {
                                  name: currentUser?.name || 'Soben (Admin HQ)',
                                  role: 'Hub Cashier'
                                });
                                if (res.success) {
                                  triggerToast(`Deposited Rs. ${res.totalAmount.toLocaleString()} to Hub Safe`);
                                }
                              }}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                            >
                              Hub Safe Deposit
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Remitted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Merchant Settlement Ledger */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={16} color="var(--brand-cyan)" />
                  <span>Merchant Remittance Ledger</span>
                </h4>
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>BANK PAYOUT</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Merchant</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Reconciled</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Held / Disputed</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Nepal Crafts & Pashmina Ltd', reconciled: 4500, held: 12000, settled: 8900 },
                      { name: 'Himalayan Organic Tea Co', reconciled: 7800, held: 0, settled: 14500 },
                      { name: 'Kathmandu Trekking Gear', reconciled: 15400, held: 0, settled: 32000 }
                    ].map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.6rem 0.5rem' }}>
                          <strong>{m.name}</strong>
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                          Rs. {m.reconciled.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 700, color: m.held > 0 ? 'var(--brand-red)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {m.held > 0 ? `Rs. ${m.held.toLocaleString()}` : '-'}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                          <span className={m.held > 0 ? 'badge badge-rose' : 'badge badge-emerald'} style={{ fontSize: '0.68rem' }}>
                            {m.held > 0 ? 'DISPUTE HOLD' : 'READY TO PAYOUT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. IMMUTABLE AUDIT TRAIL LOG TAB                         */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', margin: 0 }}>
                Tamper-Evident Audit Trail &amp; Event Logs
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
                Every status update, rider cash collection, discrepancy flag, and remittance change is recorded with actor attribution and timestamps.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const jsonStr = JSON.stringify(codRecords.map(r => ({ id: r.id, tracking: r.trackingNumber, audit: r.auditTrail })), null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `double7_audit_trail_${Date.now()}.json`;
                a.click();
                triggerToast('Downloaded audit trail as JSON.');
              }}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FileText size={14} />
              <span>Export Audit JSON</span>
            </button>
          </div>

          {/* Audit Events List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {selectedRecord ? (
              selectedRecord.auditTrail.map((entry, idx) => (
                <div
                  key={entry.id || idx}
                  style={{
                    background: 'rgba(7, 10, 18, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 102, 0, 0.12)',
                      border: '1px solid rgba(255, 102, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-orange)'
                    }}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.88rem' }}>
                        {entry.note}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Actor: <strong style={{ color: 'var(--brand-cyan)' }}>{entry.actor}</strong> ({entry.actorRole}) &bull; Stage: <span style={{ color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)' }}>{entry.toStage.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {entry.timestamp}
                  </div>
                </div>
              ))
            ) : (
              <p>No audit trail selected.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
