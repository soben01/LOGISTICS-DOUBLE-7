'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  WorkflowStage,
  WorkflowGraphNode,
  WorkflowGraphEdge,
  WorkflowGraphState,
  getWorkflowGraphState,
  saveWorkflowGraphState,
  generateAutoLayout,
  NODE_PALETTE_TEMPLATES,
  PaletteNodeTemplate,
  WORKFLOW_PRESETS,
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
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Rocket,
  Code,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Power,
  Volume2,
  VolumeX,
  Smartphone,
  ChevronRight,
  ChevronDown,
  Layers,
  Check,
  X
} from 'lucide-react';
import {
  playScanBeep,
  playErrorBuzz,
  playDispatchFanfare,
  playReceiveChime
} from '../../lib/soundFx';

interface TrackingWorkflowEditorProps {
  isSuperAdmin?: boolean;
}

const AVAILABLE_ICONS: Record<string, React.ElementType> = {
  Boxes,
  Printer,
  Truck,
  Building,
  MapPin,
  Radio,
  CheckCircle2,
  ShieldCheck,
  Compass,
  AlertCircle
};

const COLOR_MAP: Record<StageColor, { hex: string; bg: string; border: string; glow: string }> = {
  orange: { hex: '#ff6600', bg: 'rgba(255, 102, 0, 0.14)', border: '#ff6600', glow: 'rgba(255, 102, 0, 0.35)' },
  purple: { hex: '#c084fc', bg: 'rgba(192, 132, 252, 0.14)', border: '#a855f7', glow: 'rgba(168, 85, 247, 0.35)' },
  cyan: { hex: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: '#0284c7', glow: 'rgba(56, 189, 248, 0.35)' },
  amber: { hex: '#fbbf24', bg: 'rgba(251, 191, 36, 0.14)', border: '#d97706', glow: 'rgba(245, 158, 11, 0.35)' },
  emerald: { hex: '#34d399', bg: 'rgba(52, 211, 153, 0.14)', border: '#059669', glow: 'rgba(16, 185, 129, 0.35)' },
  rose: { hex: '#f43f5e', bg: 'rgba(244, 63, 94, 0.14)', border: '#e11d48', glow: 'rgba(244, 63, 94, 0.35)' },
  blue: { hex: '#60a5fa', bg: 'rgba(96, 165, 250, 0.14)', border: '#2563eb', glow: 'rgba(37, 99, 235, 0.35)' }
};

const PALETTE_CATEGORIES = [
  'Built-in Nodes',
  'Intake & Booking',
  'Sorting & Gateway',
  'Transit & Linehaul',
  'Last-Mile & Delivery',
  'Logic & Sentinels'
] as const;

export default function TrackingWorkflowEditor({ isSuperAdmin = true }: TrackingWorkflowEditorProps) {
  // Graph state
  const [graph, setGraph] = useState<WorkflowGraphState>({
    flowTitle: 'Double 7 Nationwide Express Dispatch & Tracking Pipeline',
    nodes: [],
    edges: [],
    zoom: 0.85,
    panX: 40,
    panY: 30,
    lastUpdated: new Date().toISOString()
  });

  // UI & Canvas Controls
  const [isLocked, setIsLocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structureTab, setStructureTab] = useState<'nodes' | 'json'>('nodes');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simActiveNodeId, setSimActiveNodeId] = useState<string | null>(null);
  const [simPacketPos, setSimPacketPos] = useState<{ x: number; y: number } | null>(null);
  const [showSimDrawer, setShowSimDrawer] = useState(false);
  const [simLog, setSimLog] = useState<Array<{ time: string; stage: string; note: string; color: string }>>([]);

  // Canvas Drag & Wire Creation
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [wiringFromNodeId, setWiringFromNodeId] = useState<string | null>(null);
  const [wireMousePos, setWireMousePos] = useState<{ x: number; y: number } | null>(null);

  // Initialize graph on mount
  useEffect(() => {
    const loaded = getWorkflowGraphState();
    setGraph(loaded);
  }, []);

  // Auto-save with debouncing
  const triggerAutoSave = useCallback((updated: WorkflowGraphState) => {
    setAutoSaving(true);
    setGraph(updated);
    saveWorkflowGraphState(updated);
    setTimeout(() => {
      setAutoSaving(false);
    }, 600);
  }, []);

  const renderIcon = (name: string, size = 16, color = 'currentColor') => {
    const IconComponent = AVAILABLE_ICONS[name] || Truck;
    return <IconComponent size={size} color={color} />;
  };

  const NODE_WIDTH = 300;
  const PORT_Y_OFFSET = 26; // aligned with card header

  // Canvas Mouse & Interaction Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return;
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - graph.panX, y: e.clientY - graph.panY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && !isLocked) {
      setGraph(prev => ({
        ...prev,
        panX: e.clientX - panStart.x,
        panY: e.clientY - panStart.y
      }));
    } else if (draggingNodeId && !isLocked) {
      const currentZoom = graph.zoom || 1;
      const newX = (e.clientX - graph.panX - dragOffset.x) / currentZoom;
      const newY = (e.clientY - graph.panY - dragOffset.y) / currentZoom;

      setGraph(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === draggingNodeId ? { ...n, x: Math.max(10, Math.round(newX)), y: Math.max(10, Math.round(newY)) } : n
        )
      }));
    } else if (wiringFromNodeId) {
      const currentZoom = graph.zoom || 1;
      setWireMousePos({
        x: (e.clientX - graph.panX) / currentZoom,
        y: (e.clientY - graph.panY) / currentZoom
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingNodeId) {
      setDraggingNodeId(null);
      triggerAutoSave(graph);
    }
    if (wiringFromNodeId) {
      setWiringFromNodeId(null);
      setWireMousePos(null);
    }
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (isLocked) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(1.8, Math.max(0.4, Number((graph.zoom * zoomFactor).toFixed(2))));
    setGraph(prev => ({ ...prev, zoom: newZoom }));
  };

  // Node Drag Start
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    if (isLocked) return;
    e.stopPropagation();
    const currentZoom = graph.zoom || 1;
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX - (nodeX * currentZoom + graph.panX),
      y: e.clientY - (nodeY * currentZoom + graph.panY)
    });
    if (soundEnabled) playScanBeep(1400, 0.04);
  };

  // Wiring Handlers
  const handleStartWire = (e: React.MouseEvent, fromNodeId: string) => {
    e.stopPropagation();
    if (isLocked) return;
    setWiringFromNodeId(fromNodeId);
    const fromNode = graph.nodes.find(n => n.id === fromNodeId);
    if (fromNode) {
      setWireMousePos({ x: fromNode.x + NODE_WIDTH + 10, y: fromNode.y + PORT_Y_OFFSET });
    }
    if (soundEnabled) playScanBeep(1800, 0.05);
  };

  const handleCompleteWire = (e: React.MouseEvent, toNodeId: string) => {
    e.stopPropagation();
    if (!wiringFromNodeId || wiringFromNodeId === toNodeId) {
      setWiringFromNodeId(null);
      setWireMousePos(null);
      return;
    }

    const exists = graph.edges.some(
      edge => edge.fromNodeId === wiringFromNodeId && edge.toNodeId === toNodeId
    );

    if (!exists) {
      const newEdge: WorkflowGraphEdge = {
        id: `edge-${wiringFromNodeId}-${toNodeId}`,
        fromNodeId: wiringFromNodeId,
        toNodeId: toNodeId,
        animated: true
      };

      const updated = {
        ...graph,
        edges: [...graph.edges, newEdge]
      };
      triggerAutoSave(updated);
      if (soundEnabled) playReceiveChime();
    } else {
      if (soundEnabled) playErrorBuzz();
    }

    setWiringFromNodeId(null);
    setWireMousePos(null);
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (soundEnabled) playErrorBuzz();
    const updated = {
      ...graph,
      edges: graph.edges.filter(e => e.id !== edgeId)
    };
    triggerAutoSave(updated);
  };

  // Node Updates
  const handleUpdateNodeStage = (nodeId: string, updates: Partial<WorkflowStage>) => {
    const updated = {
      ...graph,
      nodes: graph.nodes.map(n =>
        n.id === nodeId ? { ...n, stage: { ...n.stage, ...updates } } : n
      )
    };
    triggerAutoSave(updated);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (graph.nodes.length <= 1) {
      if (soundEnabled) playErrorBuzz();
      alert('Workflow must have at least one stage.');
      return;
    }
    if (soundEnabled) playErrorBuzz();
    const updated = {
      ...graph,
      nodes: graph.nodes.filter(n => n.id !== nodeId),
      edges: graph.edges.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId)
    };
    triggerAutoSave(updated);
  };

  const handleDuplicateNode = (nodeId: string) => {
    const source = graph.nodes.find(n => n.id === nodeId);
    if (!source) return;

    const newId = `node-wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newStage: WorkflowStage = {
      ...source.stage,
      id: `wf-${Date.now()}`,
      label: `${source.stage.label} (Copy)`,
      order: graph.nodes.length + 1
    };

    const newNode: WorkflowGraphNode = {
      id: newId,
      stageId: newStage.id,
      stage: newStage,
      x: source.x + 40,
      y: source.y + 40
    };

    const updated = {
      ...graph,
      nodes: [...graph.nodes, newNode]
    };
    triggerAutoSave(updated);
    if (soundEnabled) playScanBeep(1600, 0.08);
  };

  const handleToggleNodePower = (nodeId: string) => {
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    handleUpdateNodeStage(nodeId, { enabled: !node.stage.enabled });
    if (soundEnabled) playScanBeep(1200, 0.05);
  };

  // Add from Palette
  const handleAddNodeFromTemplate = (tpl: PaletteNodeTemplate) => {
    const currentZoom = graph.zoom || 1;
    const spawnX = Math.round((-graph.panX + 520) / currentZoom);
    const spawnY = Math.round((-graph.panY + 280) / currentZoom);

    const stageId = `wf-custom-${Date.now()}`;
    const newStage: WorkflowStage = {
      id: stageId,
      key: tpl.label,
      label: tpl.label,
      description: tpl.description,
      category: tpl.stageCategory,
      color: tpl.stageColor,
      icon: tpl.iconName,
      order: graph.nodes.length + 1,
      targetSlaHours: tpl.defaultSla,
      enabled: true,
      notifyCustomer: true,
      requireLocation: true,
      requireNotes: false
    };

    const nodeId = `node-${stageId}`;
    const newNode: WorkflowGraphNode = {
      id: nodeId,
      stageId,
      stage: newStage,
      x: spawnX,
      y: spawnY
    };

    const newEdges = [...graph.edges];
    if (graph.nodes.length > 0) {
      const rightmostNode = [...graph.nodes].sort((a, b) => b.x - a.x)[0];
      if (rightmostNode) {
        newEdges.push({
          id: `edge-${rightmostNode.id}-${nodeId}`,
          fromNodeId: rightmostNode.id,
          toNodeId: nodeId,
          animated: true
        });
      }
    }

    const updated: WorkflowGraphState = {
      ...graph,
      nodes: [...graph.nodes, newNode],
      edges: newEdges
    };
    triggerAutoSave(updated);
    if (soundEnabled) playReceiveChime();
  };

  const handleAutoLayout = () => {
    const sortedStages = [...graph.nodes]
      .sort((a, b) => a.x - b.x)
      .map(n => n.stage);
    const reordered = generateAutoLayout(sortedStages);
    reordered.flowTitle = graph.flowTitle;
    triggerAutoSave(reordered);
    if (soundEnabled) playDispatchFanfare();
  };

  const handleApplyPreset = (presetId: string) => {
    const found = WORKFLOW_PRESETS.find(p => p.id === presetId);
    if (!found) return;
    const generated = generateAutoLayout(found.stages);
    generated.flowTitle = found.name;
    triggerAutoSave(generated);
    if (soundEnabled) playDispatchFanfare();
  };

  const handleDeploy = () => {
    triggerAutoSave(graph);
    setDeploySuccess(true);
    if (soundEnabled) playDispatchFanfare();
    setTimeout(() => {
      setDeploySuccess(false);
    }, 2800);
  };

  // Run Flow Simulation
  const runSimulation = () => {
    if (isSimulating || graph.nodes.length === 0) return;
    setIsSimulating(true);
    setShowSimDrawer(true);
    setSimLog([]);

    const sequence = [...graph.nodes].sort((a, b) => a.x - b.x);
    let index = 0;

    const executeNextStep = () => {
      if (index >= sequence.length) {
        setIsSimulating(false);
        setSimActiveNodeId(null);
        setSimPacketPos(null);
        if (soundEnabled) playDispatchFanfare();
        setSimLog(prev => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            stage: 'Simulation Completed',
            note: 'Package successfully completed delivery cycle with verified POD archive.',
            color: '#10b981'
          }
        ]);
        return;
      }

      const node = sequence[index];
      setSimActiveNodeId(node.id);
      setSimPacketPos({ x: node.x + NODE_WIDTH / 2, y: node.y + PORT_Y_OFFSET });

      if (soundEnabled) playScanBeep(1200 + index * 100, 0.08);

      setSimLog(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          stage: node.stage.label,
          note: `${node.stage.description} (Target SLA: ${node.stage.targetSlaHours}h | SMS: ${node.stage.notifyCustomer ? 'SENT' : 'SILENT'})`,
          color: COLOR_MAP[node.stage.color]?.hex || '#ff6600'
        }
      ]);

      index++;
      setTimeout(executeNextStep, 1000);
    };

    executeNextStep();
  };

  // Minimap Calculations
  const minimapNodes = useMemo(() => {
    if (graph.nodes.length === 0) return { minX: 0, maxX: 1000, minY: 0, maxY: 600, scale: 0.1, mapBoxWidth: 200, mapBoxHeight: 120 };
    const xs = graph.nodes.map(n => n.x);
    const ys = graph.nodes.map(n => n.y);
    const minX = Math.min(...xs, 0);
    const maxX = Math.max(...xs, 1200);
    const minY = Math.min(...ys, 0);
    const maxY = Math.max(...ys, 600);
    const width = Math.max(1, maxX - minX + NODE_WIDTH + 80);
    const height = Math.max(1, maxY - minY + 200);

    const mapBoxWidth = 200;
    const mapBoxHeight = 120;
    const scale = Math.min(mapBoxWidth / width, mapBoxHeight / height);

    return { minX, maxX, minY, maxY, width, height, scale, mapBoxWidth, mapBoxHeight };
  }, [graph.nodes]);

  // SVG Bezier Curves
  const renderedWires = useMemo(() => {
    return graph.edges.map(edge => {
      const fromNode = graph.nodes.find(n => n.id === edge.fromNodeId);
      const toNode = graph.nodes.find(n => n.id === edge.toNodeId);
      if (!fromNode || !toNode) return null;

      const x1 = fromNode.x + NODE_WIDTH;
      const y1 = fromNode.y + PORT_Y_OFFSET;
      const x2 = toNode.x;
      const y2 = toNode.y + PORT_Y_OFFSET;

      const dx = Math.max(60, Math.abs(x2 - x1) * 0.5);
      const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const isCurrentSimWire = isSimulating && simActiveNodeId === toNode.id;

      return {
        id: edge.id,
        pathD,
        midX,
        midY,
        fromNode,
        toNode,
        isCurrentSimWire
      };
    }).filter(Boolean);
  }, [graph.edges, graph.nodes, isSimulating, simActiveNodeId]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: 'calc(100vh - 170px)',
        minHeight: '680px',
        backgroundColor: '#070b12',
        color: '#f8fafc',
        userSelect: 'none',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)'
      }}
    >
      {/* -------------------------------------------------------------------- */}
      {/* TOP HEADER / ACTION TOOLBAR                                          */}
      {/* -------------------------------------------------------------------- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: '#090e1a',
          borderBottom: '1px solid #1e293b',
          zIndex: 20,
          flexShrink: 0,
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 102, 0, 0.15)',
                color: '#ff6600',
                border: '1px solid rgba(255, 102, 0, 0.3)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Boxes size={16} />
            </span>
            <input
              type="text"
              value={graph.flowTitle}
              onChange={e => {
                const title = e.target.value;
                setGraph(prev => ({ ...prev, flowTitle: title }));
                saveWorkflowGraphState({ ...graph, flowTitle: title });
              }}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#f8fafc',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #334155',
                outline: 'none',
                width: '320px'
              }}
              title="Click to rename workflow flow"
            />
          </div>

          {/* Run Flow Button */}
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: isSimulating ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isSimulating ? 'rgba(245, 158, 11, 0.2)' : '#059669',
              color: isSimulating ? '#fbbf24' : '#ffffff',
              border: isSimulating ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.5)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {isSimulating ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
            <span>{isSimulating ? 'Simulating...' : `Run Flow (${graph.nodes.length})`}</span>
          </button>

          {/* Auto Saving Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              fontSize: '0.72rem',
              color: '#94a3b8'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: autoSaving ? '#fbbf24' : '#34d399'
              }}
            />
            <span>{autoSaving ? 'Auto saving...' : 'Auto saving...'}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Preset dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>
              Presets:
            </span>
            <select
              onChange={e => e.target.value && handleApplyPreset(e.target.value)}
              defaultValue=""
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontSize: '0.75rem',
                padding: '5px 10px',
                borderRadius: '6px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>Choose Pipeline Preset</option>
              {WORKFLOW_PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Auto Layout */}
          <button
            onClick={handleAutoLayout}
            title="Automatically arrange nodes into clean flowchart DAG"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#0f172a',
              color: '#cbd5e1',
              border: '1px solid #334155',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Sparkles size={13} color="#ff6600" />
            <span>Auto-Layout</span>
          </button>

          {/* View Structure */}
          <button
            onClick={() => setShowStructureModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#0f172a',
              color: '#cbd5e1',
              border: '1px solid #334155',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Code size={13} />
            <span>View Structure</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              color: soundEnabled ? '#34d399' : '#64748b',
              cursor: 'pointer'
            }}
            title={soundEnabled ? 'Audio FX Enabled' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Deploy Button */}
          <button
            onClick={handleDeploy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              backgroundColor: deploySuccess ? '#10b981' : '#059669',
              color: '#ffffff',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)'
            }}
          >
            {deploySuccess ? <Check size={13} /> : <Rocket size={13} />}
            <span>{deploySuccess ? 'Deployed Live!' : 'Deploy'}</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MAIN WORKSPACE: LEFT PALETTE + INFINITE DOT CANVAS                   */}
      {/* -------------------------------------------------------------------- */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* ================================================================= */}
        {/* LEFT SIDEBAR: NODE PALETTE (MATCHING SCREENSHOT)                  */}
        {/* ================================================================= */}
        <div
          style={{
            width: '260px',
            minWidth: '260px',
            maxWidth: '260px',
            backgroundColor: '#090d16',
            borderRight: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
            overflowY: 'auto'
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e293b', backgroundColor: '#0b111e' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Layers size={13} color="#ff6600" />
                Pipeline Node Library
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              >
                {NODE_PALETTE_TEMPLATES.length}
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
              Click any node to inject it into your active dispatch pipeline.
            </p>
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {PALETTE_CATEGORIES.map(category => {
              const items = NODE_PALETTE_TEMPLATES.filter(t => t.category === category);
              if (items.length === 0) return null;
              const isCollapsed = collapsedCategories[category];

              return (
                <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    onClick={() => setCollapsedCategories(prev => ({ ...prev, [category]: !isCollapsed }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                  >
                    <span>{category}</span>
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </div>

                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {items.map(tpl => {
                        const col = COLOR_MAP[tpl.stageColor] || COLOR_MAP.orange;
                        return (
                          <div
                            key={tpl.id}
                            onClick={() => handleAddNodeFromTemplate(tpl)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              backgroundColor: '#0f172a',
                              border: '1px solid #1e293b',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <span
                                style={{
                                  padding: '5px',
                                  borderRadius: '6px',
                                  backgroundColor: col.bg,
                                  color: col.hex,
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {renderIcon(tpl.iconName, 13, col.hex)}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {tpl.label}
                                </div>
                                <div style={{ fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {tpl.sublabel}
                                </div>
                              </div>
                            </div>
                            <span style={{ color: '#ff6600', padding: '2px', display: 'flex', alignItems: 'center' }}>
                              <Plus size={13} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* INFINITE DOT-GRID CANVAS                                         */}
        {/* ================================================================= */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleCanvasWheel}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            cursor: isPanning ? 'grabbing' : 'grab',
            backgroundColor: '#070b12',
            backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.18) 1.2px, transparent 1.2px)',
            backgroundSize: `${Math.round(24 * graph.zoom)}px ${Math.round(24 * graph.zoom)}px`,
            backgroundPosition: `${graph.panX}px ${graph.panY}px`
          }}
        >
          {/* =============================================================== */}
          {/* MINIMAP (TOP-LEFT)                                              */}
          {/* =============================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              zIndex: 20,
              backgroundColor: 'rgba(11, 18, 32, 0.92)',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '10px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={11} color="#ff6600" />
                Map
              </span>
              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b' }}>
                {graph.nodes.length} nodes
              </span>
            </div>

            <div
              style={{
                position: 'relative',
                backgroundColor: '#070b12',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                overflow: 'hidden',
                cursor: 'pointer',
                width: `${minimapNodes.mapBoxWidth}px`,
                height: `${minimapNodes.mapBoxHeight}px`
              }}
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = (e.clientX - rect.left) / minimapNodes.scale + minimapNodes.minX;
                const clickY = (e.clientY - rect.top) / minimapNodes.scale + minimapNodes.minY;
                setGraph(prev => ({
                  ...prev,
                  panX: -clickX * prev.zoom + 400,
                  panY: -clickY * prev.zoom + 250
                }));
              }}
            >
              {graph.nodes.map(n => {
                const mx = (n.x - minimapNodes.minX) * minimapNodes.scale;
                const my = (n.y - minimapNodes.minY) * minimapNodes.scale;
                const col = COLOR_MAP[n.stage.color]?.hex || '#ff6600';
                return (
                  <div
                    key={n.id}
                    style={{
                      position: 'absolute',
                      left: `${mx}px`,
                      top: `${my}px`,
                      width: `${Math.max(6, NODE_WIDTH * minimapNodes.scale)}px`,
                      height: '14px',
                      backgroundColor: n.id === simActiveNodeId ? '#fbbf24' : col,
                      borderRadius: '2px',
                      opacity: 0.8
                    }}
                  />
                );
              })}

              <div
                style={{
                  position: 'absolute',
                  border: '1px solid #38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  borderRadius: '2px',
                  pointerEvents: 'none',
                  left: `${(-graph.panX / graph.zoom - minimapNodes.minX) * minimapNodes.scale}px`,
                  top: `${(-graph.panY / graph.zoom - minimapNodes.minY) * minimapNodes.scale}px`,
                  width: `${(800 / graph.zoom) * minimapNodes.scale}px`,
                  height: `${(500 / graph.zoom) * minimapNodes.scale}px`
                }}
              />
            </div>
          </div>

          {/* =============================================================== */}
          {/* CANVAS CONTROLS (TOP-RIGHT)                                     */}
          {/* =============================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(11, 18, 32, 0.92)',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '4px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'auto'
            }}
          >
            <button
              onClick={() => setGraph(prev => ({ ...prev, zoom: Math.min(1.8, Number((prev.zoom + 0.1).toFixed(2))) }))}
              title="Zoom In"
              style={{ padding: '8px', color: '#cbd5e1', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setGraph(prev => ({ ...prev, zoom: Math.max(0.4, Number((prev.zoom - 0.1).toFixed(2))) }))}
              title="Zoom Out"
              style={{ padding: '8px', color: '#cbd5e1', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={() => setGraph(prev => ({ ...prev, zoom: 0.85, panX: 40, panY: 30 }))}
              title="Reset View / Fit"
              style={{ padding: '8px', color: '#cbd5e1', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
            >
              <Maximize2 size={15} />
            </button>
            <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '4px 2px' }} />
            <button
              onClick={() => setIsLocked(!isLocked)}
              title={isLocked ? 'Canvas Locked (Click to Unlock)' : 'Lock Canvas'}
              style={{
                padding: '8px',
                color: isLocked ? '#fbbf24' : '#94a3b8',
                backgroundColor: isLocked ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
            </button>
          </div>

          {/* =============================================================== */}
          {/* TRANSFORM CONTAINER (PAN & ZOOM APPLIED)                        */}
          {/* =============================================================== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              transform: `translate(${graph.panX}px, ${graph.panY}px) scale(${graph.zoom})`
            }}
          >
            {/* SVG CABLES / WIRES LAYER */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'visible',
                pointerEvents: 'auto',
                width: '4500px',
                height: '3500px'
              }}
            >
              {renderedWires.map(wire => {
                if (!wire) return null;
                return (
                  <g key={wire.id} style={{ cursor: 'pointer' }}>
                    {/* Background hit area */}
                    <path
                      d={wire.pathD}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="18"
                      onClick={() => handleDeleteEdge(wire.id)}
                    />
                    {/* Outer glow */}
                    <path
                      d={wire.pathD}
                      fill="none"
                      stroke={wire.isCurrentSimWire ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)'}
                      strokeWidth={wire.isCurrentSimWire ? '5' : '3'}
                      strokeDasharray={wire.isCurrentSimWire ? '8,4' : undefined}
                    />
                    {/* Main wire line */}
                    <path
                      d={wire.pathD}
                      fill="none"
                      stroke={wire.isCurrentSimWire ? '#ffffff' : '#334155'}
                      strokeWidth="2"
                    />

                    {/* Midpoint Disconnect Button */}
                    <g
                      transform={`translate(${wire.midX}, ${wire.midY})`}
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteEdge(wire.id);
                      }}
                    >
                      <circle r="9" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.5" />
                      <text
                        x="0"
                        y="3.5"
                        fill="#f43f5e"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        ×
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Live Rubberband Wire while connecting */}
              {wiringFromNodeId && wireMousePos && (() => {
                const fromNode = graph.nodes.find(n => n.id === wiringFromNodeId);
                if (!fromNode) return null;
                const x1 = fromNode.x + NODE_WIDTH;
                const y1 = fromNode.y + PORT_Y_OFFSET;
                const x2 = wireMousePos.x;
                const y2 = wireMousePos.y;
                const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
                const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                return (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ff6600"
                    strokeWidth="2.5"
                    strokeDasharray="6,4"
                  />
                );
              })()}

              {/* Simulating Traveling Packet Token */}
              {isSimulating && simPacketPos && (
                <g transform={`translate(${simPacketPos.x}, ${simPacketPos.y})`}>
                  <circle r="14" fill="#ff6600" stroke="#ffffff" strokeWidth="2" />
                  <text x="0" y="4" fill="#ffffff" fontSize="11" textAnchor="middle">📦</text>
                </g>
              )}
            </svg>

            {/* ============================================================= */}
            {/* DRAGGABLE NODE CARDS                                          */}
            {/* ============================================================= */}
            {graph.nodes.map(node => {
              const col = COLOR_MAP[node.stage.color] || COLOR_MAP.orange;
              const isActiveSim = isSimulating && simActiveNodeId === node.id;
              const isWiringOrigin = wiringFromNodeId === node.id;

              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${NODE_WIDTH}px`,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '12px',
                    border: `1.5px solid ${isActiveSim ? '#fbbf24' : col.border}`,
                    boxShadow: isActiveSim
                      ? `0 0 30px #fbbf24, 0 8px 32px rgba(0,0,0,0.8)`
                      : `0 0 16px ${col.glow}, 0 8px 24px rgba(0,0,0,0.6)`,
                    pointerEvents: 'auto',
                    opacity: !node.stage.enabled ? 0.5 : 1,
                    transition: 'box-shadow 0.2s, border-color 0.2s'
                  }}
                >
                  {/* LEFT INPUT PORT (● In) */}
                  <div
                    onClick={e => handleCompleteWire(e, node.id)}
                    title="Input Port (Connect from previous stage)"
                    style={{
                      position: 'absolute',
                      left: '-10px',
                      top: `${PORT_Y_OFFSET - 8}px`,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#090e1a',
                      border: '2.5px solid #38bdf8',
                      cursor: 'crosshair',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 20,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                    <span style={{ position: 'absolute', left: '-22px', fontSize: '0.65rem', fontFamily: 'monospace', color: '#38bdf8', pointerEvents: 'none' }}>
                      In
                    </span>
                  </div>

                  {/* RIGHT OUTPUT PORT (● Out) */}
                  <div
                    onClick={e => handleStartWire(e, node.id)}
                    title="Output Port (Click and drag to next stage)"
                    style={{
                      position: 'absolute',
                      right: '-10px',
                      top: `${PORT_Y_OFFSET - 8}px`,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#090e1a',
                      border: `2.5px solid ${isWiringOrigin ? '#ff6600' : '#10b981'}`,
                      cursor: 'crosshair',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 20,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isWiringOrigin ? '#ff6600' : '#10b981' }} />
                    <span style={{ position: 'absolute', right: '-24px', fontSize: '0.65rem', fontFamily: 'monospace', color: '#10b981', pointerEvents: 'none' }}>
                      Out
                    </span>
                  </div>

                  {/* NODE HEADER (DRAGGABLE) */}
                  <div
                    onMouseDown={e => handleNodeDragStart(e, node.id, node.x, node.y)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderBottom: '1px solid #1e293b',
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      borderTopLeftRadius: '10px',
                      borderTopRightRadius: '10px',
                      cursor: 'grab'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          padding: '4px',
                          borderRadius: '6px',
                          backgroundColor: col.bg,
                          color: col.hex,
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        {renderIcon(node.stage.icon, 13, col.hex)}
                      </span>
                      <input
                        type="text"
                        value={node.stage.label}
                        onChange={e => handleUpdateNodeStage(node.id, { label: e.target.value })}
                        style={{
                          backgroundColor: 'transparent',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: '#f8fafc',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          border: '1px solid transparent',
                          outline: 'none',
                          width: '100%',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      />
                    </div>

                    {/* Action Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#0f172a',
                          color: '#cbd5e1',
                          fontFamily: 'monospace',
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}
                      >
                        {node.stage.targetSlaHours}h
                      </span>

                      <button
                        onClick={() => handleToggleNodePower(node.id)}
                        title={node.stage.enabled ? 'Node Active' : 'Node Disabled'}
                        style={{
                          padding: '3px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: node.stage.enabled ? '#94a3b8' : '#f43f5e',
                          cursor: 'pointer',
                          display: 'flex'
                        }}
                      >
                        <Power size={11} />
                      </button>

                      <button
                        onClick={() => handleDuplicateNode(node.id)}
                        title="Duplicate Node"
                        style={{
                          padding: '3px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex'
                        }}
                      >
                        <Copy size={11} />
                      </button>

                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        title="Delete Node"
                        style={{
                          padding: '3px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex'
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* NODE BODY */}
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Category pill & Color Swatches */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          backgroundColor: col.bg,
                          color: col.hex
                        }}
                      >
                        {node.stage.category}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {(['orange', 'cyan', 'purple', 'emerald', 'amber', 'rose', 'blue'] as StageColor[]).map(c => (
                          <div
                            key={c}
                            onClick={() => handleUpdateNodeStage(node.id, { color: c })}
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              backgroundColor: COLOR_MAP[c].hex,
                              boxShadow: node.stage.color === c ? '0 0 0 1.5px #ffffff' : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Customer Status Description */}
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Tracking Status Update:
                      </label>
                      <textarea
                        rows={2}
                        value={node.stage.description}
                        onChange={e => handleUpdateNodeStage(node.id, { description: e.target.value })}
                        style={{
                          width: '100%',
                          backgroundColor: '#090e1a',
                          border: '1px solid #1e293b',
                          borderRadius: '6px',
                          padding: '6px',
                          color: '#e2e8f0',
                          fontSize: '0.72rem',
                          outline: 'none',
                          resize: 'none',
                          lineHeight: 1.3
                        }}
                      />
                    </div>

                    {/* SLA Stepper & Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #1e293b' }}>
                      {/* SLA Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#090e1a', border: '1px solid #1e293b', borderRadius: '4px', padding: '2px 4px' }}>
                        <button
                          onClick={() => handleUpdateNodeStage(node.id, { targetSlaHours: Math.max(1, node.stage.targetSlaHours - 1) })}
                          style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, padding: '0 3px' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#cbd5e1', fontWeight: 700 }}>
                          {node.stage.targetSlaHours}h SLA
                        </span>
                        <button
                          onClick={() => handleUpdateNodeStage(node.id, { targetSlaHours: node.stage.targetSlaHours + 1 })}
                          style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, padding: '0 3px' }}
                        >
                          +
                        </button>
                      </div>

                      {/* Quick Chips */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => handleUpdateNodeStage(node.id, { notifyCustomer: !node.stage.notifyCustomer })}
                          title="Toggle Customer SMS Alert"
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: node.stage.notifyCustomer ? 'rgba(16, 185, 129, 0.2)' : '#0f172a',
                            color: node.stage.notifyCustomer ? '#34d399' : '#64748b',
                            border: node.stage.notifyCustomer ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #1e293b'
                          }}
                        >
                          SMS
                        </button>
                        <button
                          onClick={() => handleUpdateNodeStage(node.id, { requireLocation: !node.stage.requireLocation })}
                          title="Toggle Required GPS Coordinates"
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: node.stage.requireLocation ? 'rgba(6, 182, 212, 0.2)' : '#0f172a',
                            color: node.stage.requireLocation ? '#38bdf8' : '#64748b',
                            border: node.stage.requireLocation ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid #1e293b'
                          }}
                        >
                          GPS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SIMULATION TELEMETRY DRAWER (SLIDES UP ON "RUN FLOW")                 */}
      {/* -------------------------------------------------------------------- */}
      {showSimDrawer && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '260px',
            right: 0,
            backgroundColor: 'rgba(9, 15, 29, 0.96)',
            borderTop: '1px solid #1e293b',
            zIndex: 30,
            padding: '14px',
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Simulation Telemetry & SMS Dispatch Preview
              </span>
            </div>
            <button
              onClick={() => setShowSimDrawer(false)}
              style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', maxHeight: '130px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Routing Log Sequence:
              </span>
              {simLog.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '5px 8px', borderRadius: '4px', border: '1px solid #1e293b', fontSize: '0.72rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#64748b', flexShrink: 0 }}>{entry.time}</span>
                  <span style={{ fontWeight: 700, color: entry.color, flexShrink: 0 }}>{entry.stage}:</span>
                  <span style={{ color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.note}</span>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#070b12', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '0.72rem', marginBottom: '4px' }}>
                  <Smartphone size={13} />
                  <span>Customer SMS Preview (Recipient: 9801234567)</span>
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.72rem', lineHeight: 1.4, backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '6px 8px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  {simLog.length > 0
                    ? `[DOUBLE 7 EXPRESS] AWB-782910: ${simLog[simLog.length - 1].stage} - ${simLog[simLog.length - 1].note}. Live tracking: https://double7.com.np/track/AWB-782910`
                    : 'Awaiting package dispatch event...'}
                </p>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span>Carrier Gateway: Ncell / Nepal Telecom (SMS API)</span>
                <span style={{ color: '#34d399', fontFamily: 'monospace' }}>Status: 200 OK</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* VIEW STRUCTURE MODAL                                                 */}
      {/* -------------------------------------------------------------------- */}
      {showStructureModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0b1220',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #1e293b', backgroundColor: '#090e1a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={16} color="#ff6600" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Workflow Graph Structure</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '2px', borderRadius: '6px' }}>
                  <button
                    onClick={() => setStructureTab('nodes')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: structureTab === 'nodes' ? '#ff6600' : 'transparent',
                      color: structureTab === 'nodes' ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    Topological Nodes ({graph.nodes.length})
                  </button>
                  <button
                    onClick={() => setStructureTab('json')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: structureTab === 'json' ? '#ff6600' : 'transparent',
                      color: structureTab === 'json' ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    Raw Graph JSON
                  </button>
                </div>
                <button
                  onClick={() => setShowStructureModal(false)}
                  style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ padding: '16px', maxHeight: '55vh', overflowY: 'auto' }}>
              {structureTab === 'nodes' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {graph.nodes
                    .sort((a, b) => a.x - b.x)
                    .map((node, index) => {
                      const col = COLOR_MAP[node.stage.color] || COLOR_MAP.orange;
                      return (
                        <div
                          key={node.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#1e293b', color: '#cbd5e1', fontSize: '0.72rem', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {index + 1}
                            </span>
                            <span style={{ padding: '4px', borderRadius: '6px', backgroundColor: col.bg, color: col.hex, display: 'flex' }}>
                              {renderIcon(node.stage.icon, 13, col.hex)}
                            </span>
                            <div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>{node.stage.label}</div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{node.stage.description}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8' }}>
                            <span>X: {Math.round(node.x)}</span>
                            <span>Y: {Math.round(node.y)}</span>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#34d399', fontWeight: 700, fontSize: '0.68rem' }}>
                              {node.stage.targetSlaHours}h
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <pre style={{ padding: '12px', backgroundColor: '#070b12', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '0.72rem', fontFamily: 'monospace', color: '#34d399', overflowX: 'auto' }}>
                  {JSON.stringify(graph, null, 2)}
                </pre>
              )}
            </div>

            <div style={{ padding: '12px 18px', borderTop: '1px solid #1e293b', backgroundColor: '#090e1a', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(graph, null, 2));
                  alert('Copied graph JSON to clipboard!');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Copy Graph Schema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
