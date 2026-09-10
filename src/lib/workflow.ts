'use client';

export type StageCategory = 'initial' | 'processing' | 'transit' | 'delivery' | 'completed' | 'exception';
export type StageColor = 'orange' | 'purple' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'blue';

export interface WorkflowStage {
  id: string;
  key: string;
  label: string;
  description: string;
  category: StageCategory;
  color: StageColor;
  icon: string; // Lucide icon name
  order: number;
  targetSlaHours: number;
  enabled: boolean;
  notifyCustomer: boolean;
  requireLocation: boolean;
  requireNotes: boolean;
  isTerminal?: boolean;
}

export const DEFAULT_WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 'wf-1',
    key: 'Order Placed',
    label: 'Order Placed',
    description: 'Consignment booking confirmed. Digital airway bill registered in Double 7 network.',
    category: 'initial',
    color: 'orange',
    icon: 'Boxes',
    order: 1,
    targetSlaHours: 2,
    enabled: true,
    notifyCustomer: true,
    requireLocation: false,
    requireNotes: false
  },
  {
    id: 'wf-2',
    key: 'Label Generated',
    label: 'Label Generated',
    description: 'Official 4x6 AWB shipping label printed. Package tagged for courier collection.',
    category: 'processing',
    color: 'purple',
    icon: 'Printer',
    order: 2,
    targetSlaHours: 4,
    enabled: true,
    notifyCustomer: false,
    requireLocation: false,
    requireNotes: false
  },
  {
    id: 'wf-3',
    key: 'Pending Pickup',
    label: 'Courier Assigned',
    description: 'Dedicated pickup rider dispatched to merchant/shipper premises for handover.',
    category: 'processing',
    color: 'blue',
    icon: 'Truck',
    order: 3,
    targetSlaHours: 6,
    enabled: true,
    notifyCustomer: true,
    requireLocation: true,
    requireNotes: false
  },
  {
    id: 'wf-4',
    key: 'Hub Received',
    label: 'Origin Hub Inwarded',
    description: 'Parcel scanned into origin departure sorting facility and assigned linehaul cage.',
    category: 'transit',
    color: 'cyan',
    icon: 'Building',
    order: 4,
    targetSlaHours: 12,
    enabled: true,
    notifyCustomer: false,
    requireLocation: true,
    requireNotes: true
  },
  {
    id: 'wf-5',
    key: 'Shipment Dispatched',
    label: 'Shipment Dispatched',
    description: 'Consignment approved on branch manifest & linehaul vehicle dispatched on scheduled trunk route.',
    category: 'transit',
    color: 'orange',
    icon: 'Truck',
    order: 5,
    targetSlaHours: 24,
    enabled: true,
    notifyCustomer: true,
    requireLocation: true,
    requireNotes: false
  },
  {
    id: 'wf-6',
    key: 'Customs Cleared',
    label: 'Regional Sort Complete',
    description: 'Consignment arrived at destination gateway hub; barcode verified for last-mile route.',
    category: 'transit',
    color: 'cyan',
    icon: 'MapPin',
    order: 6,
    targetSlaHours: 36,
    enabled: true,
    notifyCustomer: false,
    requireLocation: true,
    requireNotes: false
  },
  {
    id: 'wf-7',
    key: 'Out for Delivery',
    label: 'Out for Delivery',
    description: 'Consignment loaded onto delivery rider e-van for doorstep recipient handover.',
    category: 'delivery',
    color: 'amber',
    icon: 'Radio',
    order: 7,
    targetSlaHours: 44,
    enabled: true,
    notifyCustomer: true,
    requireLocation: true,
    requireNotes: true
  },
  {
    id: 'wf-8',
    key: 'Delivered',
    label: 'Delivered (Signed)',
    description: 'Successfully handed over to recipient. Electronic signature & POD archived.',
    category: 'completed',
    color: 'emerald',
    icon: 'CheckCircle2',
    order: 8,
    targetSlaHours: 48,
    enabled: true,
    notifyCustomer: true,
    requireLocation: true,
    requireNotes: false,
    isTerminal: true
  }
];

export const WORKFLOW_STORAGE_KEY = 'double7_tracking_workflow_v1';

export function getTrackingWorkflow(): WorkflowStage[] {
  if (typeof window === 'undefined') return DEFAULT_WORKFLOW_STAGES;
  try {
    const saved = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(DEFAULT_WORKFLOW_STAGES));
      return DEFAULT_WORKFLOW_STAGES;
    }
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(DEFAULT_WORKFLOW_STAGES));
      return DEFAULT_WORKFLOW_STAGES;
    }
    return parsed.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_WORKFLOW_STAGES;
  }
}

export function saveTrackingWorkflow(stages: WorkflowStage[]): void {
  if (typeof window === 'undefined') return;
  const sorted = [...stages].map((s, idx) => ({ ...s, order: idx + 1 }));
  localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(sorted));
  window.dispatchEvent(new Event('workflow-updated'));
}

export function resetTrackingWorkflow(): WorkflowStage[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(DEFAULT_WORKFLOW_STAGES));
    window.dispatchEvent(new Event('workflow-updated'));
  }
  return DEFAULT_WORKFLOW_STAGES;
}

export function addWorkflowStage(stage: Omit<WorkflowStage, 'id' | 'order'>): WorkflowStage[] {
  const current = getTrackingWorkflow();
  const newStage: WorkflowStage = {
    ...stage,
    id: `wf-${Date.now()}`,
    order: current.length + 1
  };
  const updated = [...current, newStage];
  saveTrackingWorkflow(updated);
  return updated;
}

export function updateWorkflowStage(id: string, updates: Partial<WorkflowStage>): WorkflowStage[] {
  const current = getTrackingWorkflow();
  const updated = current.map(stage => {
    if (stage.id === id) {
      return { ...stage, ...updates };
    }
    return stage;
  });
  saveTrackingWorkflow(updated);
  return updated;
}

export function deleteWorkflowStage(id: string): WorkflowStage[] {
  const current = getTrackingWorkflow();
  const filtered = current.filter(s => s.id !== id);
  saveTrackingWorkflow(filtered);
  return getTrackingWorkflow();
}

export function moveWorkflowStage(id: string, direction: 'up' | 'down'): WorkflowStage[] {
  const current = getTrackingWorkflow();
  const index = current.findIndex(s => s.id === id);
  if (index === -1) return current;

  if (direction === 'up' && index > 0) {
    const temp = current[index];
    current[index] = current[index - 1];
    current[index - 1] = temp;
  } else if (direction === 'down' && index < current.length - 1) {
    const temp = current[index];
    current[index] = current[index + 1];
    current[index + 1] = temp;
  }

  saveTrackingWorkflow(current);
  return getTrackingWorkflow();
}

/**
 * Calculates current progression along the active workflow for a given status string.
 */
export function calculateWorkflowProgress(status: string, workflow?: WorkflowStage[]): {
  activeStages: WorkflowStage[];
  currentStageIndex: number;
  currentStage: WorkflowStage | undefined;
  percentage: number;
  isCompleted: boolean;
} {
  const activeStages = (workflow || getTrackingWorkflow()).filter(s => s.enabled);
  const normalizedStatus = (status || '').trim().toLowerCase();

  let foundIndex = -1;
  for (let i = 0; i < activeStages.length; i++) {
    const s = activeStages[i];
    if (
      s.key.toLowerCase() === normalizedStatus ||
      s.label.toLowerCase() === normalizedStatus ||
      (normalizedStatus.includes('deliver') && s.category === 'completed') ||
      (normalizedStatus.includes('dispatch') && (s.key.toLowerCase().includes('dispatch') || s.label.toLowerCase().includes('dispatch'))) ||
      (normalizedStatus.includes('transit') && (s.key.toLowerCase().includes('transit') || s.key.toLowerCase().includes('dispatch'))) ||
      (normalizedStatus.includes('pickup') && s.key.toLowerCase().includes('pickup')) ||
      (normalizedStatus.includes('inward') && s.label.toLowerCase().includes('inward')) ||
      (normalizedStatus.includes('label') && s.key.toLowerCase().includes('label'))
    ) {
      foundIndex = i;
      break;
    }
  }

  // Fallback defaults
  if (foundIndex === -1) {
    if (normalizedStatus.includes('deliver')) foundIndex = activeStages.length - 1;
    else if (normalizedStatus.includes('out')) foundIndex = Math.max(0, activeStages.length - 2);
    else if (normalizedStatus.includes('dispatch') || normalizedStatus.includes('transit')) foundIndex = Math.min(4, activeStages.length - 1);
    else if (normalizedStatus.includes('inward') || normalizedStatus.includes('hub')) foundIndex = Math.min(3, activeStages.length - 1);
    else if (normalizedStatus.includes('pickup') || normalizedStatus.includes('courier')) foundIndex = Math.min(2, activeStages.length - 1);
    else if (normalizedStatus.includes('label')) foundIndex = Math.min(1, activeStages.length - 1);
    else foundIndex = 0;
  }

  const isCompleted = foundIndex >= activeStages.length - 1;
  const percentage = activeStages.length > 1
    ? Math.min(100, Math.round((foundIndex / (activeStages.length - 1)) * 100))
    : 100;

  return {
    activeStages,
    currentStageIndex: foundIndex,
    currentStage: activeStages[foundIndex],
    percentage,
    isCompleted
  };
}

/**
 * Returns the next sequential stage in the workflow following step-by-step rules.
 */
export function getNextWorkflowStage(currentStatus: string, workflow?: WorkflowStage[]): WorkflowStage | null {
  const { activeStages, currentStageIndex } = calculateWorkflowProgress(currentStatus, workflow);
  if (currentStageIndex < activeStages.length - 1) {
    return activeStages[currentStageIndex + 1];
  }
  return null;
}

/**
 * Returns the previous sequential stage in the workflow.
 */
export function getPreviousWorkflowStage(currentStatus: string, workflow?: WorkflowStage[]): WorkflowStage | null {
  const { activeStages, currentStageIndex } = calculateWorkflowProgress(currentStatus, workflow);
  if (currentStageIndex > 0) {
    return activeStages[currentStageIndex - 1];
  }
  return null;
}

/**
 * Validates whether transition from current stage to next stage follows workflow progression.
 */
export function isStepByStepAllowed(currentStatus: string, targetStatus: string, workflow?: WorkflowStage[]): boolean {
  const { activeStages, currentStageIndex } = calculateWorkflowProgress(currentStatus, workflow);
  const targetInfo = calculateWorkflowProgress(targetStatus, workflow);
  // Allowed if advancing to next step (+1) or staying on current step
  return targetInfo.currentStageIndex === currentStageIndex + 1 || targetInfo.currentStageIndex === currentStageIndex;
}

