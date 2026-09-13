'use client';

import React, { useState, useEffect } from 'react';
import {
  WorkflowStage,
  getTrackingWorkflow,
  saveTrackingWorkflow,
  resetTrackingWorkflow,
  DEFAULT_WORKFLOW_STAGES,
  StageCategory,
  StageColor,
  insertWorkflowStageAtIndex,
  WORKFLOW_PRESETS,
  calculateWorkflowProgress
} from '../../lib/workflow';
import {
  Boxes,
  Printer,
  Truck,
  Building,
  MapPin,
  Radio,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Compass,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  Bell,
  Clock,
  Shield,
  Save,
  Eye,
  Sliders,
  AlertTriangle,
  Smartphone,
  Workflow,
  Kanban,
  Shuffle,
  Volume2
} from 'lucide-react';
import { playScanBeep, playErrorBuzz, playDispatchFanfare, playReceiveChime } from '../../lib/soundFx';

interface TrackingWorkflowEditorProps {
  isSuperAdmin?: boolean;
}

const AVAILABLE_ICONS = [
  { name: 'Boxes', icon: Boxes, label: 'Boxes' },
  { name: 'Printer', icon: Printer, label: 'Printer' },
  { name: 'Truck', icon: Truck, label: 'Truck' },
  { name: 'Building', icon: Building, label: 'Hub Facility' },
  { name: 'MapPin', icon: MapPin, label: 'GPS Pin' },
  { name: 'Radio', icon: Radio, label: 'Courier Radar' },
  { name: 'CheckCircle2', icon: CheckCircle2, label: 'Check Circle' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Customs Shield' },
  { name: 'Compass', icon: Compass, label: 'Transit Compass' },
  { name: 'AlertCircle', icon: AlertCircle, label: 'Exception Alert' }
];

const AVAILABLE_COLORS: { id: StageColor; label: string; hex: string; bg: string }[] = [
  { id: 'orange', label: 'Brand Orange', hex: '#ff6600', bg: 'rgba(255, 102, 0, 0.15)' },
  { id: 'purple', label: 'Deep Purple', hex: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)' },
  { id: 'cyan', label: 'Electric Cyan', hex: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  { id: 'amber', label: 'Amber Gold', hex: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'emerald', label: 'Emerald Green', hex: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'rose', label: 'Crimson Rose', hex: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' },
  { id: 'blue', label: 'Cobalt Blue', hex: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' }
];

export default function TrackingWorkflowEditor({ isSuperAdmin = true }: TrackingWorkflowEditorProps) {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePreviewStageIndex, setActivePreviewStageIndex] = useState(2);
  const [viewMode, setViewMode] = useState<'canvas' | 'phases'>('canvas');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setStages(getTrackingWorkflow());
  }, []);

  const getIconComponent = (iconName: string, size = 16, color?: string) => {
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    const IconComp = found ? found.icon : Truck;
    return <IconComp size={size} color={color} />;
  };

  // Move stage left or right in sequence
  const handleMove = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === stages.length - 1) return;

    if (soundEnabled) playScanBeep(1200, 0.06);

    const updated = [...stages];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(reordered);
    setHasUnsavedChanges(true);
  };

  // Direct Inline Update
  const handleInlineUpdate = (id: string, updates: Partial<WorkflowStage>) => {
    setStages(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    setHasUnsavedChanges(true);
  };

  // Insert a new stage between existing stages
  const handleInsertStageAt = (index: number) => {
    if (soundEnabled) playScanBeep(1800, 0.08);

    const newStage: WorkflowStage = {
      id: `wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      key: `Custom Checkpoint ${stages.length + 1}`,
      label: `New Tracking Milestone`,
      description: 'Custom inspection or processing milestone configured in pipeline.',
      category: 'transit',
      color: 'cyan',
      icon: 'MapPin',
      order: index + 1,
      targetSlaHours: 12,
      enabled: true,
      notifyCustomer: true,
      requireLocation: true,
      requireNotes: false
    };

    const updated = [...stages];
    updated.splice(index, 0, newStage);
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(reordered);
    setHasUnsavedChanges(true);
  };

  // Delete stage
  const handleDelete = (id: string) => {
    if (stages.length <= 3) {
      if (soundEnabled) playErrorBuzz();
      alert('A minimum of 3 stages is required for a valid tracking pipeline.');
      return;
    }
    if (soundEnabled) playErrorBuzz();
    const updated = stages.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(updated);
    setHasUnsavedChanges(true);
  };

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const preset = WORKFLOW_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    if (confirm(`Load "${preset.name}" preset? Any unsaved edits will be replaced.`)) {
      if (soundEnabled) playDispatchFanfare();
      const reordered = preset.stages.map((s, idx) => ({ ...s, order: idx + 1 }));
      setStages(reordered);
      setHasUnsavedChanges(true);
    }
  };

  // Save All Changes
  const handleSaveAll = () => {
    if (soundEnabled) playDispatchFanfare();
    saveTrackingWorkflow(stages);
    setHasUnsavedChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Reset to default 8-stage
  const handleReset = () => {
    if (confirm('Reset tracking workflow to official Double 7 8-stage defaults? Any custom stages will be replaced.')) {
      if (soundEnabled) playReceiveChime();
      const reset = resetTrackingWorkflow();
      setStages(reset);
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const activeStages = stages.filter(s => s.enabled);
  const currentSimStage = activeStages[activePreviewStageIndex] || activeStages[0];
  const simPercent = activeStages.length > 0 ? Math.round(((activePreviewStageIndex + 1) / activeStages.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner: Super Admin Governance & Controls */}
      <div className="card" style={{
        padding: '1.5rem 1.75rem',
        background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.08) 0%, rgba(10, 15, 29, 0.95) 100%)',
        border: '1px solid rgba(255, 102, 0, 0.35)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(255, 102, 0, 0.2)',
                color: 'var(--brand-orange)',
                border: '1px solid rgba(255, 102, 0, 0.4)',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Shield size={12} /> VISUAL WORKFLOW PIPELINE BUILDER
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Active Stages: <strong style={{ color: '#ffffff' }}>{activeStages.length}</strong> of {stages.length}
              </span>
              {hasUnsavedChanges && (
                <span style={{
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  fontWeight: 700,
                  animation: 'pulse 2s infinite'
                }}>
                  ● Unsaved Edits Pending
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#ffffff' }}>
              Free-Form Tracking Status Workflow Architecture
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '750px', lineHeight: 1.5 }}>
              Configure custom consignment lifecycle stages visually. Edit stage titles, SLA durations, alert settings, and color themes directly on each workstation card. No rigid tables.
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '2px'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                style={{
                  background: viewMode === 'canvas' ? 'rgba(255, 102, 0, 0.25)' : 'transparent',
                  color: viewMode === 'canvas' ? 'var(--brand-orange)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Workflow size={13} /> Visual Conduit Flow
              </button>
              <button
                type="button"
                onClick={() => setViewMode('phases')}
                style={{
                  background: viewMode === 'phases' ? 'rgba(255, 102, 0, 0.25)' : 'transparent',
                  color: viewMode === 'phases' ? 'var(--brand-orange)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Kanban size={13} /> Lifecycle Phase Grid
              </button>
            </div>

            {/* Sound FX Toggle */}
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playScanBeep(1600, 0.08);
              }}
              style={{
                background: soundEnabled ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                color: soundEnabled ? '#34d399' : 'var(--text-muted)',
                border: soundEnabled ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '0.45rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="Toggle audio chimes on reorder & save"
            >
              <Volume2 size={13} /> {soundEnabled ? 'Audio: ON' : 'Audio: OFF'}
            </button>

            {/* Presets Dropdown */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleLoadPreset(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              style={{
                background: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>Load Architecture Preset...</option>
              {WORKFLOW_PRESETS.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.badge})
                </option>
              ))}
            </select>

            {/* Reset to Default */}
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.78rem' }}
              title="Reset to 8-stage Double 7 standard"
            >
              <RefreshCw size={13} /> Reset
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges}
              className="btn btn-primary btn-sm"
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                boxShadow: hasUnsavedChanges ? '0 0 20px rgba(255, 102, 0, 0.5)' : 'none',
                opacity: hasUnsavedChanges ? 1 : 0.6
              }}
            >
              <Save size={14} />
              <span>Save Pipeline</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '8px',
            color: '#34d399',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            <CheckCircle2 size={16} />
            <span>Workflow pipeline saved successfully! Public tracking page (`/track`) & operations consoles updated in real-time.</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LIVE SIMULATOR: CUSTOMER TRACKING & SMS PREVIEW */}
      {/* ========================================================================= */}
      <div className="card" style={{ padding: '1.5rem', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              LIVE SATELLITE RADAR SIMULATION
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: '#f8fafc' }}>
              How Consignments Flow Through Your Active Pipeline ({simPercent}% Complete)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Click milestone to simulate lifecycle transition:</span>
          </div>
        </div>

        {/* Interactive Continuous Stepper Bar */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem',
          overflowX: 'auto',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: `${Math.max(600, activeStages.length * 115)}px`,
            position: 'relative'
          }}>
            {activeStages.map((stage, idx) => {
              const isPast = idx < activePreviewStageIndex;
              const isCurrent = idx === activePreviewStageIndex;
              const colorObj = AVAILABLE_COLORS.find(c => c.id === stage.color) || AVAILABLE_COLORS[0];

              return (
                <React.Fragment key={stage.id}>
                  <div
                    onClick={() => {
                      setActivePreviewStageIndex(idx);
                      if (soundEnabled) playScanBeep(1400 + idx * 80, 0.05);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      zIndex: 2,
                      width: '95px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isCurrent
                        ? colorObj.hex
                        : isPast
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(255, 255, 255, 0.06)',
                      color: isCurrent ? '#000' : isPast ? '#34d399' : 'var(--text-muted)',
                      border: isCurrent
                        ? `3px solid #fff`
                        : isPast
                        ? '2px solid rgba(16, 185, 129, 0.5)'
                        : '2px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: isCurrent ? `0 0 20px ${colorObj.hex}` : 'none',
                      transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                      {isPast ? <Check size={16} /> : getIconComponent(stage.icon, 16, isCurrent ? '#000' : undefined)}
                    </div>

                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? '#ffffff' : isPast ? '#34d399' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100px'
                    }}>
                      {stage.label}
                    </div>

                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {stage.targetSlaHours}h SLA
                    </div>
                  </div>

                  {idx < activeStages.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: '3px',
                      background: idx < activePreviewStageIndex
                        ? 'linear-gradient(90deg, #10b981, #10b981)'
                        : 'rgba(255, 255, 255, 0.1)',
                      position: 'relative',
                      top: '-14px',
                      zIndex: 1
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Customer SMS / WhatsApp Milestone Notification Preview */}
        {currentSimStage && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                ACTIVE SIMULATED STAGE
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge badge-${currentSimStage.color}`}>#{currentSimStage.order}</span>
                {currentSimStage.label}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                {currentSimStage.description}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                CUSTOMER SMS / WHATSAPP PREVIEW
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.78rem',
                color: '#bae6fd',
                lineHeight: 1.4
              }}>
                💬 <strong>Double 7 Alert:</strong> Shipment <em>D7-8821</em> has reached <strong>{currentSimStage.label}</strong>. {currentSimStage.notifyCustomer ? 'Live status updated at double7.com/track' : '(Silent milestone: internal operational log only)'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FREE-FORM VIEW 1: VISUAL CONDUIT FLOW CANVAS (HORIZONTAL PIPELINE) */}
      {/* ========================================================================= */}
      {viewMode === 'canvas' && (
        <div className="card" style={{ padding: '1.75rem', background: '#0a0f1d', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Workflow size={18} color="var(--brand-orange)" />
                <span>Connected Pipeline Workstations ({stages.length} Milestones)</span>
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Edit titles, SLA targets, and alert settings directly on each workstation card. Click (+) on any conduit to insert milestones.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleInsertStageAt(stages.length)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.82rem', borderColor: 'rgba(255, 102, 0, 0.4)', color: 'var(--brand-orange)' }}
            >
              <Plus size={14} /> Append Milestone at End
            </button>
          </div>

          {/* Horizontal Scrollable Flow Canvas */}
          <div style={{
            overflowX: 'auto',
            paddingBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            scrollbarWidth: 'thin'
          }}>
            {stages.map((stage, idx) => {
              const colorObj = AVAILABLE_COLORS.find(c => c.id === stage.color) || AVAILABLE_COLORS[0];

              return (
                <React.Fragment key={stage.id}>
                  {/* WORKSTATION CARD NODE */}
                  <div style={{
                    width: '320px',
                    flexShrink: 0,
                    background: stage.enabled ? '#0f172a' : 'rgba(15, 23, 42, 0.5)',
                    border: `1px solid ${stage.enabled ? colorObj.hex + '40' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: stage.enabled ? `0 10px 30px -10px ${colorObj.hex}25` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}>
                    {/* Top Row: Order Badge, Glow Icon, Reorder Buttons & Delete */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: '#fff'
                        }}>
                          #{stage.order}
                        </span>

                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: colorObj.bg,
                          border: `1px solid ${colorObj.hex}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colorObj.hex
                        }}>
                          {getIconComponent(stage.icon, 18, colorObj.hex)}
                        </div>

                        <div>
                          <select
                            value={stage.icon}
                            onChange={(e) => handleInlineUpdate(stage.id, { icon: e.target.value })}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            {AVAILABLE_ICONS.map(i => (
                              <option key={i.name} value={i.name} style={{ background: '#0e1422' }}>
                                {i.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Controls: Reorder Left/Right & Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'left')}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: idx === 0 ? 'rgba(255, 255, 255, 0.2)' : '#fff',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer'
                          }}
                          title="Move milestone left in sequence"
                        >
                          <ArrowLeft size={12} />
                        </button>

                        <button
                          type="button"
                          disabled={idx === stages.length - 1}
                          onClick={() => handleMove(idx, 'right')}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: idx === stages.length - 1 ? 'rgba(255, 255, 255, 0.2)' : '#fff',
                            cursor: idx === stages.length - 1 ? 'not-allowed' : 'pointer'
                          }}
                          title="Move milestone right in sequence"
                        >
                          <ArrowRight size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(stage.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f87171',
                            cursor: 'pointer'
                          }}
                          title="Delete Milestone"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Direct Inline Editable Stage Name */}
                    <div>
                      <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.2rem' }}>
                        Milestone Display Name
                      </label>
                      <input
                        type="text"
                        value={stage.label}
                        onChange={(e) => handleInlineUpdate(stage.id, { label: e.target.value })}
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.35)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '6px',
                          padding: '0.45rem 0.65rem',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    {/* Direct Inline Editable Description */}
                    <div>
                      <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.2rem' }}>
                        Customer Visible Description
                      </label>
                      <textarea
                        rows={2}
                        value={stage.description}
                        onChange={(e) => handleInlineUpdate(stage.id, { description: e.target.value })}
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.35)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '6px',
                          padding: '0.45rem 0.65rem',
                          color: 'var(--text-secondary)',
                          fontSize: '0.78rem',
                          resize: 'none',
                          lineHeight: 1.3
                        }}
                      />
                    </div>

                    {/* System Event Key & Category */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                          EVENT CODE
                        </label>
                        <input
                          type="text"
                          value={stage.key}
                          onChange={(e) => handleInlineUpdate(stage.id, { key: e.target.value })}
                          style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            padding: '0.35rem 0.5rem',
                            color: '#e2e8f0',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.72rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                          CATEGORY
                        </label>
                        <select
                          value={stage.category}
                          onChange={(e) => handleInlineUpdate(stage.id, { category: e.target.value as StageCategory })}
                          style={{
                            width: '100%',
                            background: '#0d1527',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            padding: '0.35rem 0.5rem',
                            color: '#fff',
                            fontSize: '0.72rem'
                          }}
                        >
                          <option value="initial">Initial Intake</option>
                          <option value="processing">Hub Sorting</option>
                          <option value="transit">Trunk Transit</option>
                          <option value="delivery">Delivery</option>
                          <option value="completed">Completed</option>
                          <option value="exception">Exception</option>
                        </select>
                      </div>
                    </div>

                    {/* SLA Stepper & Color Swatches */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '0.45rem 0.65rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} color="var(--brand-amber)" />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SLA:</span>
                        <button
                          type="button"
                          onClick={() => handleInlineUpdate(stage.id, { targetSlaHours: Math.max(1, stage.targetSlaHours - 2) })}
                          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          -
                        </button>
                        <strong style={{ fontSize: '0.78rem', color: '#fff' }}>{stage.targetSlaHours}h</strong>
                        <button
                          type="button"
                          onClick={() => handleInlineUpdate(stage.id, { targetSlaHours: stage.targetSlaHours + 2 })}
                          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          +
                        </button>
                      </div>

                      {/* Color Theme Swatches */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {AVAILABLE_COLORS.map(c => (
                          <div
                            key={c.id}
                            onClick={() => handleInlineUpdate(stage.id, { color: c.id })}
                            title={c.label}
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: c.hex,
                              cursor: 'pointer',
                              border: stage.color === c.id ? '2px solid #ffffff' : '1px solid transparent',
                              transform: stage.color === c.id ? 'scale(1.25)' : 'scale(1)',
                              transition: 'transform 0.15s ease'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Operational Toggle Chips */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleInlineUpdate(stage.id, { notifyCustomer: !stage.notifyCustomer })}
                        style={{
                          background: stage.notifyCustomer ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: stage.notifyCustomer ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.68rem',
                          color: stage.notifyCustomer ? '#34d399' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Bell size={10} />
                        {stage.notifyCustomer ? 'Alerts ON' : 'Silent'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInlineUpdate(stage.id, { requireLocation: !stage.requireLocation })}
                        style={{
                          background: stage.requireLocation ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: stage.requireLocation ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.68rem',
                          color: stage.requireLocation ? '#38bdf8' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <MapPin size={10} />
                        {stage.requireLocation ? 'GPS Required' : 'GPS Optional'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInlineUpdate(stage.id, { enabled: !stage.enabled })}
                        style={{
                          background: stage.enabled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.15)',
                          border: stage.enabled ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.68rem',
                          color: stage.enabled ? '#fff' : '#f87171',
                          cursor: 'pointer'
                        }}
                      >
                        {stage.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* ANIMATED PIPELINE CONDUIT WITH (+) INSERT BUTTON */}
                  {idx < stages.length - 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      padding: '0 0.5rem',
                      zIndex: 3
                    }}>
                      {/* Conduit Line */}
                      <div style={{
                        width: '38px',
                        height: '3px',
                        background: 'linear-gradient(90deg, rgba(255, 102, 0, 0.6), rgba(56, 189, 248, 0.6))',
                        position: 'relative'
                      }} />

                      {/* (+) Quick Insert Button */}
                      <button
                        type="button"
                        onClick={() => handleInsertStageAt(idx + 1)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#0d1527',
                          border: '2px solid var(--brand-orange)',
                          color: 'var(--brand-orange)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          boxShadow: '0 0 10px rgba(255, 102, 0, 0.4)',
                          zIndex: 4
                        }}
                        title={`Insert milestone between #${stage.order} and #${stages[idx + 1].order}`}
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>

                      {/* Direction Pointer Arrow */}
                      <div style={{
                        width: '38px',
                        height: '3px',
                        background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.6), rgba(52, 211, 153, 0.6))'
                      }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FREE-FORM VIEW 2: LIFECYCLE PHASE GRID ARCHITECTURE */}
      {/* ========================================================================= */}
      {viewMode === 'phases' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          {[
            { cat: 'initial', title: 'Phase 1: Booking & Intake', color: '#ff6600', icon: Boxes },
            { cat: 'processing', title: 'Phase 2: Sorting & Preparation', color: '#c084fc', icon: Building },
            { cat: 'transit', title: 'Phase 3: Trunk Linehaul Transit', color: '#38bdf8', icon: Truck },
            { cat: 'delivery', title: 'Phase 4: Last-Mile Delivery', color: '#fbbf24', icon: Radio },
            { cat: 'completed', title: 'Phase 5: Final POD & Terminal', color: '#34d399', icon: CheckCircle2 },
          ].map(phase => {
            const phaseStages = stages.filter(s => s.category === phase.cat);
            const PhaseIcon = phase.icon;

            return (
              <div key={phase.cat} className="card" style={{
                padding: '1.25rem',
                background: '#0a0f1d',
                border: `1px solid ${phase.color}30`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: phase.color, fontWeight: 700, fontSize: '0.85rem' }}>
                    <PhaseIcon size={16} />
                    <span>{phase.title}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#fff' }}>
                    {phaseStages.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {phaseStages.map(stage => {
                    const colorObj = AVAILABLE_COLORS.find(c => c.id === stage.color) || AVAILABLE_COLORS[0];
                    return (
                      <div key={stage.id} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: colorObj.hex }}>#{stage.order}</span> {stage.label}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{stage.targetSlaHours}h SLA</span>
                        </div>

                        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                          {stage.description}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.65rem', color: stage.notifyCustomer ? '#34d399' : 'var(--text-muted)' }}>
                            {stage.notifyCustomer ? '🔔 Alerts Customer' : '🔇 Silent'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleInlineUpdate(stage.id, { enabled: !stage.enabled })}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: stage.enabled ? '#34d399' : '#ef4444',
                              fontSize: '0.68rem',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            {stage.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
