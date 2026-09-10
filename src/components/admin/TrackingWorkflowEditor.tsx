'use client';

import React, { useState, useEffect } from 'react';
import {
  WorkflowStage,
  getTrackingWorkflow,
  saveTrackingWorkflow,
  resetTrackingWorkflow,
  DEFAULT_WORKFLOW_STAGES,
  StageCategory,
  StageColor
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
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Edit3,
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
  AlertTriangle
} from 'lucide-react';

interface TrackingWorkflowEditorProps {
  isSuperAdmin?: boolean;
}

const AVAILABLE_ICONS = [
  { name: 'Boxes', icon: Boxes },
  { name: 'Printer', icon: Printer },
  { name: 'Truck', icon: Truck },
  { name: 'Building', icon: Building },
  { name: 'MapPin', icon: MapPin },
  { name: 'Radio', icon: Radio },
  { name: 'CheckCircle2', icon: CheckCircle2 },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Compass', icon: Compass },
  { name: 'AlertCircle', icon: AlertCircle }
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
  const [activePreviewStageIndex, setActivePreviewStageIndex] = useState(3);

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState<Omit<WorkflowStage, 'id' | 'order'>>({
    key: '',
    label: '',
    description: '',
    category: 'transit',
    color: 'orange',
    icon: 'Truck',
    targetSlaHours: 12,
    enabled: true,
    notifyCustomer: true,
    requireLocation: true,
    requireNotes: false
  });

  useEffect(() => {
    setStages(getTrackingWorkflow());
  }, []);

  const getIconComponent = (iconName: string, size = 16, color?: string) => {
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    const IconComp = found ? found.icon : Truck;
    return <IconComp size={size} color={color} />;
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const updated = [...stages];
    if (direction === 'up' && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === 'down' && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(reordered);
    setHasUnsavedChanges(true);
  };

  const handleToggleEnabled = (id: string) => {
    const updated = stages.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setStages(updated);
    setHasUnsavedChanges(true);
  };

  const handleToggleNotify = (id: string) => {
    const updated = stages.map(s => (s.id === id ? { ...s, notifyCustomer: !s.notifyCustomer } : s));
    setStages(updated);
    setHasUnsavedChanges(true);
  };

  const handleDelete = (id: string) => {
    if (stages.length <= 3) {
      alert('A minimum of 3 stages is required for a valid tracking pipeline.');
      return;
    }
    const updated = stages.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(updated);
    setHasUnsavedChanges(true);
  };

  const handleOpenAdd = () => {
    setEditingStageId(null);
    setModalForm({
      key: `custom_${Date.now()}`,
      label: '',
      description: '',
      category: 'transit',
      color: 'orange',
      icon: 'Truck',
      targetSlaHours: 12,
      enabled: true,
      notifyCustomer: true,
      requireLocation: true,
      requireNotes: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stage: WorkflowStage) => {
    setEditingStageId(stage.id);
    setModalForm({
      key: stage.key,
      label: stage.label,
      description: stage.description,
      category: stage.category,
      color: stage.color,
      icon: stage.icon,
      targetSlaHours: stage.targetSlaHours,
      enabled: stage.enabled,
      notifyCustomer: stage.notifyCustomer,
      requireLocation: stage.requireLocation,
      requireNotes: stage.requireNotes,
      isTerminal: stage.isTerminal
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.label.trim()) {
      alert('Please provide a valid stage label.');
      return;
    }

    if (editingStageId) {
      const updated = stages.map(s => (s.id === editingStageId ? { ...s, ...modalForm } : s));
      setStages(updated);
    } else {
      const newStage: WorkflowStage = {
        ...modalForm,
        id: `wf-${Date.now()}`,
        order: stages.length + 1
      };
      setStages([...stages, newStage]);
    }

    setIsModalOpen(false);
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    saveTrackingWorkflow(stages);
    setHasUnsavedChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleReset = () => {
    if (confirm('Reset tracking workflow to official Double 7 8-stage defaults? Any custom stages will be removed.')) {
      const reset = resetTrackingWorkflow();
      setStages(reset);
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const activeStages = stages.filter(s => s.enabled);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div className="card" style={{
        padding: '1.75rem',
        background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.08) 0%, rgba(10, 15, 29, 0.95) 100%)',
        border: '1px solid rgba(255, 102, 0, 0.35)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                background: 'rgba(255, 102, 0, 0.2)',
                color: 'var(--brand-orange)',
                border: '1px solid rgba(255, 102, 0, 0.4)',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Shield size={12} /> SUPER ADMIN WORKFLOW GOVERNANCE
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Active Stages: <strong style={{ color: '#ffffff' }}>{activeStages.length}</strong> of {stages.length}
              </span>
            </div>

            <h2 style={{ margin: 0, fontSize: '1.65rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Consignment Tracking Status Lifecycle Workflow
            </h2>
            <p style={{ marginTop: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '750px', lineHeight: 1.5 }}>
              Customize and govern the progression sequence of parcel waypoints and tracking milestones. Configure notification triggers, SLA targets, and stage properties. Changes immediately update customer tracking timelines, dispatch scanners, and booking registers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
            >
              <Plus size={15} />
              <span>Add Tracking Stage</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Reset to Double 7 official defaults"
            >
              <RefreshCw size={13} />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges}
              className="btn btn-sm"
              style={{
                background: hasUnsavedChanges ? 'var(--brand-emerald)' : 'rgba(255, 255, 255, 0.08)',
                color: hasUnsavedChanges ? '#000' : 'var(--text-muted)',
                fontWeight: 800,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: hasUnsavedChanges ? 'pointer' : 'default',
                boxShadow: hasUnsavedChanges ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              <Save size={14} />
              <span>{hasUnsavedChanges ? 'Save Workflow (Unsaved)' : 'Saved & Synced'}</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div style={{
            marginTop: '1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Check size={16} />
            <span>Workflow updated successfully! Synced across tracking timelines, D1 telemetry nodes, and booking registers.</span>
          </div>
        )}
      </div>

      {/* Live Pipeline Stepper Preview */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} color="var(--brand-orange)" />
              <span>Live Public Tracking Pipeline Preview (as seen by customers on /track)</span>
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Active sequence of {activeStages.length} progression milestones for consignment telemetry
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span>Simulate Stage:</span>
            <select
              value={activePreviewStageIndex}
              onChange={(e) => setActivePreviewStageIndex(Number(e.target.value))}
              className="select-field"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', width: 'auto' }}
            >
              {activeStages.map((st, idx) => (
                <option key={st.id} value={idx}>
                  Step {idx + 1}: {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Route Progress Bar */}
        <div style={{
          background: 'rgba(5, 10, 20, 0.7)',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: `${Math.max(650, activeStages.length * 110)}px`,
            position: 'relative'
          }}>
            {activeStages.map((stage, idx) => {
              const isPast = idx < activePreviewStageIndex;
              const isCurrent = idx === activePreviewStageIndex;
              const colorObj = AVAILABLE_COLORS.find(c => c.id === stage.color) || AVAILABLE_COLORS[0];

              return (
                <React.Fragment key={stage.id}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 2,
                    width: '90px'
                  }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isCurrent
                        ? colorObj.hex
                        : isPast
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: isCurrent ? '#000' : isPast ? '#34d399' : 'var(--text-muted)',
                      border: isCurrent
                        ? `3px solid #fff`
                        : isPast
                        ? '2px solid rgba(16, 185, 129, 0.5)'
                        : '2px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: isCurrent ? `0 0 18px ${colorObj.hex}` : 'none',
                      transition: 'all 0.25s ease'
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

                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
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
      </div>

      {/* Workflow Stages Editor List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '1.1rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} color="var(--brand-orange)" />
              <span>Configured Tracking Stages Sequence ({stages.length} Total Stages)</span>
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Order determines the exact lifecycle progression. Use arrow buttons to reorder stages.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={14} />
            <span>Add Stage</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {stages.map((stage, idx) => {
            const colorObj = AVAILABLE_COLORS.find(c => c.id === stage.color) || AVAILABLE_COLORS[0];

            return (
              <div
                key={stage.id}
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  borderBottom: idx < stages.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  background: !stage.enabled ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                  opacity: stage.enabled ? 1 : 0.6,
                  transition: 'background 0.2s ease',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left: Reorder Controls + Order Number */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: 'none',
                        color: idx === 0 ? 'rgba(255, 255, 255, 0.2)' : '#ffffff',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer'
                      }}
                      title="Move stage earlier in sequence"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === stages.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: 'none',
                        color: idx === stages.length - 1 ? 'rgba(255, 255, 255, 0.2)' : '#ffffff',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        cursor: idx === stages.length - 1 ? 'not-allowed' : 'pointer'
                      }}
                      title="Move stage later in sequence"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>

                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    color: '#ffffff'
                  }}>
                    #{stage.order}
                  </div>

                  {/* Stage Icon */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: colorObj.bg,
                    border: `1px solid ${colorObj.hex}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colorObj.hex
                  }}>
                    {getIconComponent(stage.icon, 20, colorObj.hex)}
                  </div>

                  {/* Stage Label & Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                        {stage.label}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)'
                      }}>
                        key: {stage.key}
                      </span>
                      <span className={`badge badge-${stage.color}`} style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                        {stage.category}
                      </span>
                      {!stage.enabled && (
                        <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                          Disabled
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '560px' }}>
                      {stage.description}
                    </div>
                  </div>
                </div>

                {/* Right: Configuration Switches & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={12} color="var(--brand-amber)" />
                      <span>Target SLA: <strong style={{ color: '#ffffff' }}>{stage.targetSlaHours} hrs</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNotify(stage.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: stage.notifyCustomer ? 'var(--brand-emerald)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      title="Toggle automated SMS / Email notifications on stage entry"
                    >
                      <Bell size={12} />
                      <span>{stage.notifyCustomer ? 'Notify Customer (Active)' : 'Silent Stage (No Alerts)'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(stage.id)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.35rem 0.65rem',
                        color: stage.enabled ? '#34d399' : '#ef4444'
                      }}
                    >
                      {stage.enabled ? 'Enabled' : 'Disabled'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(stage)}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.35rem 0.6rem' }}
                      title="Edit Stage Configuration"
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(stage.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.35rem 0.6rem', color: '#ef4444' }}
                      title="Delete Stage"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Add / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '560px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#ffffff' }}>
                {editingStageId ? 'Edit Tracking Stage' : 'Add New Tracking Stage'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Stage Display Name *</label>
                <input
                  type="text"
                  value={modalForm.label}
                  onChange={(e) => setModalForm({ ...modalForm, label: e.target.value })}
                  placeholder="e.g. Customs Cleared / Dock Scanned"
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">System Key / Event Code *</label>
                  <input
                    type="text"
                    value={modalForm.key}
                    onChange={(e) => setModalForm({ ...modalForm, key: e.target.value })}
                    placeholder="e.g. In Transit"
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Stage Category</label>
                  <select
                    value={modalForm.category}
                    onChange={(e) => setModalForm({ ...modalForm, category: e.target.value as StageCategory })}
                    className="select-field"
                  >
                    <option value="initial">Initial / Booking</option>
                    <option value="processing">Processing &amp; Pickup</option>
                    <option value="transit">Linehaul &amp; Hub Transit</option>
                    <option value="delivery">Out for Delivery</option>
                    <option value="completed">Delivered / Terminal</option>
                    <option value="exception">Exception / NDR</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Stage Description (Customer Visible)</label>
                <textarea
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  placeholder="Explain what occurs during this tracking event..."
                  className="input-field"
                  rows={2}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              {/* Icon & Color Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Stage Icon</label>
                  <select
                    value={modalForm.icon}
                    onChange={(e) => setModalForm({ ...modalForm, icon: e.target.value })}
                    className="select-field"
                  >
                    {AVAILABLE_ICONS.map(ic => (
                      <option key={ic.name} value={ic.name}>
                        {ic.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Badge Color Theme</label>
                  <select
                    value={modalForm.color}
                    onChange={(e) => setModalForm({ ...modalForm, color: e.target.value as StageColor })}
                    className="select-field"
                  >
                    {AVAILABLE_COLORS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SLA Hours */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Target SLA Timeframe (Hours from booking)</label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={modalForm.targetSlaHours}
                  onChange={(e) => setModalForm({ ...modalForm, targetSlaHours: Number(e.target.value) })}
                  className="input-field"
                  required
                />
              </div>

              {/* Checkbox Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#ffffff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalForm.notifyCustomer}
                    onChange={(e) => setModalForm({ ...modalForm, notifyCustomer: e.target.checked })}
                    style={{ accentColor: 'var(--brand-orange)' }}
                  />
                  <span>Send Automated SMS &amp; Email Dispatch Alerts on Stage Entry</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#ffffff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalForm.requireLocation}
                    onChange={(e) => setModalForm({ ...modalForm, requireLocation: e.target.checked })}
                    style={{ accentColor: 'var(--brand-orange)' }}
                  />
                  <span>Require Hub / Courier GPS Location for Checkpoint Verification</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#ffffff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalForm.enabled}
                    onChange={(e) => setModalForm({ ...modalForm, enabled: e.target.checked })}
                    style={{ accentColor: 'var(--brand-orange)' }}
                  />
                  <span>Stage Active &amp; Visible in Tracking Stepper</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center', fontWeight: 800 }}
                >
                  {editingStageId ? 'Update Tracking Stage' : 'Insert Stage into Workflow'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
