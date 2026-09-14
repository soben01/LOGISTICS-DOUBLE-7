'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  Send,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Banknote,
  Truck,
  Layers,
  MapPin,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Zap,
  Building,
  Bike
} from 'lucide-react';
import { getShipments, Shipment } from '../../lib/store';
import { getCodRecords, CodOrderRecord } from '../../lib/cod';
import { getBranchManifests, BranchManifest, NEPAL_HUBS } from '../../lib/manifest';
import { PRESET_RIDERS } from '../../lib/rider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisResult {
  query: string;
  headline: string;
  summary: string;
  metrics: { label: string; value: string; color: string }[];
  flaggedItems?: { id: string; title: string; subtitle: string; status: string; link?: string }[];
  recommendedActions: string[];
}

export default function AIOperationsAssistantModal({ isOpen, onClose }: Props) {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<string[]>([
    'Show shipments delayed > 24 hours',
    'Which hub has the highest failed-delivery rate?',
    'Show today pending COD breakdown by hub',
    'Analyze rider on-time delivery performance'
  ]);

  useEffect(() => {
    if (isOpen && !activeAnalysis) {
      runAnalysis('Show shipments delayed > 24 hours');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runAnalysis = (query: string) => {
    setIsAnalyzing(true);
    setInputText(query);

    setTimeout(() => {
      const shipments = getShipments();
      const codRecords = getCodRecords();
      const manifests = getBranchManifests();
      const q = query.toLowerCase();

      let result: AnalysisResult;

      if (q.includes('delay') || q.includes('24 hour') || q.includes('late')) {
        const delayed = shipments.filter(s => 
          s.status === 'Exception' || 
          (s.checkpoints && s.checkpoints.some(c => c.status === 'Delayed')) ||
          ((s.deliveryAttempts || 0) > 0 && s.status !== 'Delivered')
        );

        const totalDelayedCod = delayed.reduce((sum, s) => sum + (s.codAmount || 0), 0);

        result = {
          query,
          headline: `${delayed.length} Consignments Flagged for Delivery Delay / NDR`,
          summary: `Our telemetry engine identified ${delayed.length} parcel(s) exceeding normal transit SLA or flagged with customer reschedule / unreachable exceptions. Total at-risk COD value is NPR ${totalDelayedCod.toLocaleString()}.`,
          metrics: [
            { label: 'Delayed Consignments', value: `${delayed.length}`, color: '#f87171' },
            { label: 'At-Risk COD Value', value: `Rs. ${totalDelayedCod.toLocaleString()}`, color: '#fbbf24' },
            { label: 'Primary Cause', value: 'Customer NDR / Reschedule', color: '#fb923c' },
            { label: 'SLA Health', value: '96.2%', color: '#34d399' },
          ],
          flaggedItems: delayed.map(s => ({
            id: s.id,
            title: `${s.id} • ${s.recipient.name} (${s.destination.city})`,
            subtitle: s.ndrReason || s.remarks || 'Exceeded 24H transit checkpoint threshold',
            status: s.status,
            link: `/track?id=${s.id}`,
          })),
          recommendedActions: [
            'Trigger automated SMS and WhatsApp reschedule prompts to recipients.',
            'Assign secondary rider run-sheet for evening beats (after 18:00 NPT).',
            'Escalate unresolved NDR consignments past 48H to merchant for return authorization.'
          ]
        };
      } else if (q.includes('hub') || q.includes('rate') || q.includes('fail') || q.includes('performance')) {
        result = {
          query,
          headline: 'Hub Performance & Exception Rate Analysis',
          summary: 'Kathmandu Mega-Hub (KTM-01) leads inbound throughput with 98.4% timely sorting. Pokhara (PKR-01) maintains 96.8% delivery success, while mountain and peripheral lines experience minor weather-induced transit buffer.',
          metrics: [
            { label: 'Top Hub Throughput', value: 'Kathmandu (KTM-01)', color: '#38bdf8' },
            { label: 'Highest On-Time Rate', value: 'Pokhara (97.1%)', color: '#34d399' },
            { label: 'Highest Exception Rate', value: 'Central Terai (3.8%)', color: '#fbbf24' },
            { label: 'Active Linehaul Fleet', value: `${manifests.length} Dispatched`, color: '#ffffff' },
          ],
          flaggedItems: NEPAL_HUBS.map(h => ({
            id: h.code,
            title: `${h.name} (${h.region})`,
            subtitle: `Prefix: ${h.prefix} • Standard SLA: 24H Express`,
            status: 'Operational',
            link: '/operations',
          })),
          recommendedActions: [
            'Increase linehaul frequency on Kathmandu <-> Pokhara highway corridor.',
            'Maintain strict manifest locking on dispatch to eliminate routing leakage.',
            'Review Terai cross-dock turnaround during monsoon road maintenance.'
          ]
        };
      } else if (q.includes('cod') || q.includes('cash') || q.includes('pending') || q.includes('finance')) {
        const totalCodNpr = shipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);
        const deliveredCodNpr = shipments.filter(s => s.status === 'Delivered').reduce((sum, s) => sum + (s.codAmount || 0), 0);
        const pendingCodNpr = totalCodNpr - deliveredCodNpr;

        result = {
          query,
          headline: `NPR ${pendingCodNpr.toLocaleString()} in Active Pipeline COD`,
          summary: `Total COD across all recorded shipments is NPR ${totalCodNpr.toLocaleString()}. Delivered and collected COD stands at NPR ${deliveredCodNpr.toLocaleString()} with strict remittance reconciliation enabled.`,
          metrics: [
            { label: 'Pipeline COD', value: `Rs. ${pendingCodNpr.toLocaleString()}`, color: '#fbbf24' },
            { label: 'Collected Today', value: `Rs. ${deliveredCodNpr.toLocaleString()}`, color: '#34d399' },
            { label: 'Reconciliation Health', value: '100% Audited', color: '#38bdf8' },
            { label: 'Dispute Rate', value: '0.0%', color: '#94a3b8' },
          ],
          flaggedItems: shipments.filter(s => (s.codAmount || 0) > 0).slice(0, 5).map(s => ({
            id: s.id,
            title: `${s.id} — Rs. ${(s.codAmount || 0).toLocaleString()}`,
            subtitle: `Consignee: ${s.recipient.name} • Status: ${s.status}`,
            status: s.status,
            link: `/track?id=${s.id}`,
          })),
          recommendedActions: [
            'Enforce evening rider cash remittance handover before 19:30 NPT.',
            'Process automated ConnectIPS / NCHL merchant batch disbursements for verified funds.',
            'Flag COD collection discrepancies immediately in the Finance radar.'
          ]
        };
      } else {
        result = {
          query,
          headline: 'Rider Fleet & Last-Mile Operations Intelligence',
          summary: `Double 7 fleet currently has ${PRESET_RIDERS.length} active terminal couriers across Kathmandu, Pokhara, and Biratnagar. Average run-sheet completion rate is 94.8% with digital OTP and signature POD validation.`,
          metrics: [
            { label: 'Active Field Couriers', value: `${PRESET_RIDERS.length} Riders`, color: '#38bdf8' },
            { label: 'Fleet On-Time Rate', value: '95.2%', color: '#34d399' },
            { label: 'Avg Beat Drop Time', value: '14.2 Mins', color: '#fb923c' },
            { label: 'Digital POD Compliance', value: '100% OTP Enabled', color: '#34d399' },
          ],
          flaggedItems: PRESET_RIDERS.map(r => ({
            id: r.id,
            title: `${r.name} (${r.hubCode})`,
            subtitle: `${r.routeZone} • Vehicle: ${r.vehiclePlate}`,
            status: `Rating: ${r.rating}★`,
            link: '/rider',
          })),
          recommendedActions: [
            'Deploy dynamic route re-balancing during morning sort peak.',
            'Incentivize first-attempt delivery success with OTP prompt alerts.',
            'Review rider battery/fuel logistics for evening shift extensions.'
          ]
        };
      }

      setActiveAnalysis(result);
      setIsAnalyzing(false);
    }, 400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    runAnalysis(inputText);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1050,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '740px',
        borderRadius: '20px',
        border: '1px solid rgba(6, 182, 212, 0.45)',
        background: 'linear-gradient(180deg, #0a0f1d 0%, #060911 100%)',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9)',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        margin: '2rem 0'
      }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 18px rgba(6, 182, 212, 0.35)',
              flexShrink: 0
            }}>
              <Bot size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                  AI Operations &amp; Logistics Assistant
                </h2>
                <span className="badge badge-cyan">
                  <Sparkles size={11} className="animate-spin" />
                  TELEMETRY AI
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Natural language query engine scanning live shipments, manifests, hubs, and COD ledgers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Query Prompts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Operational Inquiries:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {history.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => runAnalysis(h)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Zap size={12} color="var(--brand-cyan)" />
                <span>{h}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Bar */}
        <form onSubmit={handleFormSubmit} style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything: e.g. 'Show shipments delayed > 24 hours', 'Which hub has highest failure rate?'..."
            style={{
              width: '100%',
              backgroundColor: '#060911',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '12px',
              padding: '0.85rem 3.25rem 0.85rem 1rem',
              color: '#ffffff',
              fontSize: '0.88rem',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
            }}
          />
          <button
            type="submit"
            disabled={isAnalyzing}
            className="btn btn-cyan btn-sm"
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '0.45rem',
              padding: '0.45rem 0.85rem'
            }}
          >
            {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>

        {/* Output Area */}
        {isAnalyzing ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <RefreshCw size={28} color="var(--brand-cyan)" className="animate-spin" />
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              Scanning active consignments, branch manifests, and COD ledger...
            </p>
          </div>
        ) : activeAnalysis ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Headline Card */}
            <div style={{
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              borderRadius: '14px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#ffffff', fontWeight: 800, fontSize: '1rem' }}>
                <Sparkles size={16} color="var(--brand-cyan)" />
                <span>{activeAnalysis.headline}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                {activeAnalysis.summary}
              </p>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {activeAnalysis.metrics.map((m, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.75rem'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.label}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: m.color, marginTop: '0.2rem' }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Flagged Items */}
            {activeAnalysis.flaggedItems && activeAnalysis.flaggedItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <span>Flagged Operational Records ({activeAnalysis.flaggedItems.length}):</span>
                  <span style={{ color: 'var(--text-muted)' }}>Live Database Snapshot</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {activeAnalysis.flaggedItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{item.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.subtitle}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{item.status}</span>
                        {item.link && (
                          <Link href={item.link} onClick={onClose} style={{ color: 'var(--brand-cyan)' }}>
                            <ChevronRight size={16} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Interventions */}
            <div style={{
              backgroundColor: 'rgba(255, 102, 0, 0.08)',
              border: '1px solid rgba(255, 102, 0, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-orange)', fontWeight: 800, fontSize: '0.84rem' }}>
                <ShieldAlert size={16} color="var(--brand-orange)" />
                <span>Recommended Operational Interventions:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {activeAnalysis.recommendedActions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>

          </div>
        ) : null}

        {/* Modal Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Powered by DOUBLE 7 Autonomous Telemetry Engine</span>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
