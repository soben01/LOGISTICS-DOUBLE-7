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

export function insertWorkflowStageAtIndex(
  stage: Omit<WorkflowStage, 'id' | 'order'>,
  index: number
): WorkflowStage[] {
  const current = getTrackingWorkflow();
  const newStage: WorkflowStage = {
    ...stage,
    id: `wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    order: index + 1
  };
  const updated = [...current];
  updated.splice(index, 0, newStage);
  const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
  saveTrackingWorkflow(reordered);
  return reordered;
}

export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  stages: WorkflowStage[];
}

export const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    id: 'official_8',
    name: 'Double 7 Official Express (8-Stage)',
    description: 'Standard end-to-end multi-hub linehaul routing across Nepal gateways',
    badge: 'Standard Nationwide',
    stages: DEFAULT_WORKFLOW_STAGES
  },
  {
    id: 'rush_urban_4',
    name: 'Same-Day Valley Rush (4-Stage)',
    description: 'Streamlined intra-city dispatch for Kathmandu, Lalitpur & Bhaktapur',
    badge: 'Intra-City 6h',
    stages: [
      {
        id: 'wf-rush-1',
        key: 'Order Placed',
        label: 'Booking Confirmed',
        description: 'Instant courier booking confirmed in Valley dispatch pool.',
        category: 'initial',
        color: 'orange',
        icon: 'Boxes',
        order: 1,
        targetSlaHours: 1,
        enabled: true,
        notifyCustomer: true,
        requireLocation: false,
        requireNotes: false
      },
      {
        id: 'wf-rush-2',
        key: 'Pending Pickup',
        label: 'Courier Dispatched',
        description: 'Dedicated two-wheeler pickup courier dispatched to shipper.',
        category: 'processing',
        color: 'blue',
        icon: 'Truck',
        order: 2,
        targetSlaHours: 2,
        enabled: true,
        notifyCustomer: true,
        requireLocation: true,
        requireNotes: false
      },
      {
        id: 'wf-rush-3',
        key: 'Out for Delivery',
        label: 'Out for Direct Delivery',
        description: 'Parcel collected and heading directly to consignee address.',
        category: 'delivery',
        color: 'amber',
        icon: 'Radio',
        order: 3,
        targetSlaHours: 4,
        enabled: true,
        notifyCustomer: true,
        requireLocation: true,
        requireNotes: true
      },
      {
        id: 'wf-rush-4',
        key: 'Delivered',
        label: 'Handover Completed',
        description: 'Successfully delivered to recipient with OTP signature.',
        category: 'completed',
        color: 'emerald',
        icon: 'CheckCircle2',
        order: 4,
        targetSlaHours: 6,
        enabled: true,
        notifyCustomer: true,
        requireLocation: true,
        requireNotes: false,
        isTerminal: true
      }
    ]
  },
  {
    id: 'intl_cargo_10',
    name: 'Cross-Border Air Cargo (9-Stage)',
    description: 'International customs clearance, airport transfer, and air waybill export',
    badge: 'International Air/Sea',
    stages: [
      {
        id: 'wf-intl-1',
        key: 'Order Placed',
        label: 'Export Booking Created',
        description: 'Commercial invoice & international airway bill generated.',
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
        id: 'wf-intl-2',
        key: 'Hub Received',
        label: 'KTM Export Gateway Inward',
        description: 'Consignment weighed, x-rayed, and security tagged at Mega-Hub.',
        category: 'processing',
        color: 'cyan',
        icon: 'Building',
        order: 2,
        targetSlaHours: 6,
        enabled: true,
        notifyCustomer: false,
        requireLocation: true,
        requireNotes: true
      },
      {
        id: 'wf-intl-3',
        key: 'Customs',
        label: 'Nepal Customs Appraisal',
        description: 'Department of Customs inspection & export documentation cleared.',
        category: 'transit',
        color: 'purple',
        icon: 'ShieldCheck',
        order: 3,
        targetSlaHours: 12,
        enabled: true,
        notifyCustomer: true,
        requireLocation: true,
        requireNotes: true
      },
      {
        id: 'wf-intl-4',
        key: 'Shipment Dispatched',
        label: 'Tribhuvan Airport (TIA) Transfer',
        description: 'Cargo transferred to air cargo terminal under bonded escort.',
        category: 'transit',
        color: 'blue',
        icon: 'Truck',
        order: 4,
        targetSlaHours: 18,
        enabled: true,
        notifyCustomer: false,
        requireLocation: true,
        requireNotes: false
      },
      {
        id: 'wf-intl-5',
        key: 'In Flight',
        label: 'International Flight in Air',
        description: 'Aircraft departed Kathmandu airspace on scheduled cargo flight.',
        category: 'transit',
        color: 'cyan',
        icon: 'Compass',
        order: 5,
        targetSlaHours: 24,
        enabled: true,
        notifyCustomer: true,
        requireLocation: false,
        requireNotes: false
      },
      {
        id: 'wf-intl-6',
        key: 'Import Cleared',
        label: 'Destination Customs Cleared',
        description: 'Import tariffs assessed and cleared by foreign customs authorities.',
        category: 'transit',
        color: 'purple',
        icon: 'ShieldCheck',
        order: 6,
        targetSlaHours: 36,
        enabled: true,
        notifyCustomer: true,
        requireLocation: true,
        requireNotes: true
      },
      {
        id: 'wf-intl-7',
        key: 'Regional Sort Complete',
        label: 'Overseas Gateway Sort',
        description: 'Sorted at destination air freight hub into regional postal cages.',
        category: 'transit',
        color: 'cyan',
        icon: 'Building',
        order: 7,
        targetSlaHours: 48,
        enabled: true,
        notifyCustomer: false,
        requireLocation: true,
        requireNotes: false
      },
      {
        id: 'wf-intl-8',
        key: 'Out for Delivery',
        label: 'Overseas Local Courier Out',
        description: 'Dispatched with partner courier for last-mile delivery.',
        category: 'delivery',
        color: 'amber',
        icon: 'Radio',
        order: 8,
        targetSlaHours: 60,
        enabled: true,
        notifyCustomer: true,
        requireLocation: true,
        requireNotes: true
      },
      {
        id: 'wf-intl-9',
        key: 'Delivered',
        label: 'International Delivery Signed',
        description: 'Successfully signed for and handed over to consignee abroad.',
        category: 'completed',
        color: 'emerald',
        icon: 'CheckCircle2',
        order: 9,
        targetSlaHours: 72,
        enabled: true,
        notifyCustomer: true,
        requireLocation: true,
        requireNotes: false,
        isTerminal: true
      }
    ]
  }
];

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

// --- Failed Delivery & Reattempt Exception Workflow (ChatGPT Section 7) ---

export interface DeliveryAttemptRecord {
  attemptNumber: number;
  timestamp: string;
  reason: string;
  riderNote?: string;
  nextAction: 'reattempt' | 'return_to_merchant';
  nextScheduledDate?: string;
}

export interface FailedDeliveryEvaluation {
  attemptCount: number;
  maxAttempts: number;
  isMaxAttemptsExceeded: boolean;
  nextStatus: 'Reattempt Scheduled' | 'Return Initiated (RTO)';
  statusMessage: string;
  attemptRecord: DeliveryAttemptRecord;
}

/**
 * Evaluates a delivery failure according to the Failed Delivery Graph:
 * If attempt < maxAttempts -> Reattempt Scheduled
 * If attempt >= maxAttempts -> Return Initiated (RTO)
 */
export function evaluateDeliveryFailure(
  currentAttemptCount: number,
  reason: string,
  maxAllowedAttempts: number = 2,
  riderNote?: string
): FailedDeliveryEvaluation {
  const attemptNumber = currentAttemptCount + 1;
  const isMaxAttemptsExceeded = attemptNumber >= maxAllowedAttempts;

  const nextAction = isMaxAttemptsExceeded ? 'return_to_merchant' : 'reattempt';
  const nextStatus = isMaxAttemptsExceeded ? 'Return Initiated (RTO)' : 'Reattempt Scheduled';

  const statusMessage = isMaxAttemptsExceeded
    ? `Max delivery attempts reached (${attemptNumber}/${maxAllowedAttempts}). Consignment flagged for return to merchant.`
    : `Delivery attempt ${attemptNumber} of ${maxAllowedAttempts} unsuccessful (${reason}). Reattempt scheduled for next transit cycle.`;

  const attemptRecord: DeliveryAttemptRecord = {
    attemptNumber,
    timestamp: new Date().toISOString(),
    reason,
    riderNote,
    nextAction,
    nextScheduledDate: !isMaxAttemptsExceeded
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : undefined
  };

  return {
    attemptCount: attemptNumber,
    maxAttempts: maxAllowedAttempts,
    isMaxAttemptsExceeded,
    nextStatus,
    statusMessage,
    attemptRecord
  };
}

// ---------------------------------------------------------------------------
// NODE-BASED VISUAL WORKFLOW GRAPH (COMFYUI / N8N / LANGFLOW CANVAS ENGINE)
// ---------------------------------------------------------------------------

export interface WorkflowGraphNode {
  id: string;
  stageId: string;
  stage: WorkflowStage;
  x: number;
  y: number;
  collapsed?: boolean;
}

export interface WorkflowGraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  animated?: boolean;
}

export interface WorkflowGraphState {
  flowTitle: string;
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
  zoom: number;
  panX: number;
  panY: number;
  lastUpdated: string;
}

export interface PaletteNodeTemplate {
  id: string;
  category: 'Built-in Nodes' | 'Intake & Booking' | 'Sorting & Gateway' | 'Transit & Linehaul' | 'Last-Mile & Delivery' | 'Logic & Sentinels';
  label: string;
  sublabel: string;
  iconName: string;
  stageColor: StageColor;
  defaultSla: number;
  stageCategory: StageCategory;
  description: string;
  badge?: string;
}

export const NODE_PALETTE_TEMPLATES: PaletteNodeTemplate[] = [
  // Built-in Nodes
  {
    id: 'tpl-booking',
    category: 'Built-in Nodes',
    label: 'Order Intake Booking',
    sublabel: 'Consignment Created',
    iconName: 'Boxes',
    stageColor: 'orange',
    defaultSla: 2,
    stageCategory: 'initial',
    description: 'Registers consignor booking and assigns AWB in Double 7 network.',
    badge: 'Core'
  },
  {
    id: 'tpl-label',
    category: 'Built-in Nodes',
    label: 'AWB Label Generator',
    sublabel: '4x6 Shipping Barcode',
    iconName: 'Printer',
    stageColor: 'purple',
    defaultSla: 4,
    stageCategory: 'processing',
    description: 'Generates standard shipping barcode sticker and dispatch manifest slip.',
    badge: 'Core'
  },
  {
    id: 'tpl-hub-inward',
    category: 'Built-in Nodes',
    label: 'Hub Belt Inward',
    sublabel: 'Origin Gateway Inward',
    iconName: 'Building',
    stageColor: 'cyan',
    defaultSla: 8,
    stageCategory: 'transit',
    description: 'Primary conveyor intake and barcode verification at origin sorting facility.',
    badge: 'Gateway'
  },
  {
    id: 'tpl-linehaul',
    category: 'Built-in Nodes',
    label: 'Linehaul Trunk Transit',
    sublabel: 'Inter-City Linehaul',
    iconName: 'Truck',
    stageColor: 'blue',
    defaultSla: 18,
    stageCategory: 'transit',
    description: 'Scheduled multi-hub container truck linehaul across highway trunk corridor.',
    badge: 'Trunk'
  },
  {
    id: 'tpl-out-delivery',
    category: 'Built-in Nodes',
    label: 'Out for Delivery',
    sublabel: 'Last-Mile Rider Van',
    iconName: 'Radio',
    stageColor: 'amber',
    defaultSla: 6,
    stageCategory: 'delivery',
    description: 'Assigned to destination delivery courier for doorstep recipient handover.',
    badge: 'Last-Mile'
  },
  {
    id: 'tpl-pod-signed',
    category: 'Built-in Nodes',
    label: 'Digital POD Handover',
    sublabel: 'Delivered & Signed',
    iconName: 'CheckCircle2',
    stageColor: 'emerald',
    defaultSla: 1,
    stageCategory: 'completed',
    description: 'OTP verified, recipient signature archived, and COD cash collected.',
    badge: 'Terminal'
  },

  // Intake & Booking
  {
    id: 'tpl-api-webhook',
    category: 'Intake & Booking',
    label: 'API Webhook Ingest',
    sublabel: 'Merchant E-Commerce API',
    iconName: 'Boxes',
    stageColor: 'orange',
    defaultSla: 1,
    stageCategory: 'initial',
    description: 'Automated REST webhook order creation from Shopify, WooCommerce or Daraz.',
    badge: 'API'
  },
  {
    id: 'tpl-kyc-check',
    category: 'Intake & Booking',
    label: 'Shipper KYC Check',
    sublabel: 'Hazardous Goods Screen',
    iconName: 'ShieldCheck',
    stageColor: 'purple',
    defaultSla: 2,
    stageCategory: 'initial',
    description: 'Automated verification of merchant business license and prohibited items screening.',
    badge: 'Security'
  },
  {
    id: 'tpl-doorstep-pickup',
    category: 'Intake & Booking',
    label: 'Doorstep Courier Pickup',
    sublabel: 'First-Mile Rider',
    iconName: 'Truck',
    stageColor: 'blue',
    defaultSla: 4,
    stageCategory: 'processing',
    description: 'First-mile rider dispatched to merchant warehouse to collect booked packages.',
    badge: 'First-Mile'
  },

  // Sorting & Gateway
  {
    id: 'tpl-master-bagging',
    category: 'Sorting & Gateway',
    label: 'Master Bagging & Seal',
    sublabel: 'Tamper-Evident Consolidation',
    iconName: 'Building',
    stageColor: 'cyan',
    defaultSla: 4,
    stageCategory: 'processing',
    description: 'Parcels consolidated into destination master bag with tamper-evident security seal.',
    badge: 'Security'
  },
  {
    id: 'tpl-volumetric-audit',
    category: 'Sorting & Gateway',
    label: 'Weight & Dim Audit',
    sublabel: 'Laser Dimensioner',
    iconName: 'Printer',
    stageColor: 'amber',
    defaultSla: 2,
    stageCategory: 'processing',
    description: 'Automatic optical dimensioning and scale audit to calculate chargeable weight.',
    badge: 'Billing'
  },
  {
    id: 'tpl-regional-sort',
    category: 'Sorting & Gateway',
    label: 'Regional Gateway Sort',
    sublabel: 'Cross-Dock Transit Hub',
    iconName: 'Building',
    stageColor: 'cyan',
    defaultSla: 6,
    stageCategory: 'transit',
    description: 'De-bagging and barcode sorting into local delivery cluster route cages.',
    badge: 'Sort Hub'
  },

  // Transit & Linehaul
  {
    id: 'tpl-highway-checkpoint',
    category: 'Transit & Linehaul',
    label: 'Highway GPS Checkpoint',
    sublabel: 'Corridor Geo-Fence',
    iconName: 'Compass',
    stageColor: 'blue',
    defaultSla: 12,
    stageCategory: 'transit',
    description: 'Automatic GPS geo-fence trigger at Mugling, Narayanghat, or Kohalpur toll junctions.',
    badge: 'GPS Radar'
  },
  {
    id: 'tpl-mismatch-sentinel',
    category: 'Transit & Linehaul',
    label: 'Route Mismatch Sentinel',
    sublabel: 'Misrouting Interceptor',
    iconName: 'AlertCircle',
    stageColor: 'rose',
    defaultSla: 1,
    stageCategory: 'transit',
    description: 'Live conveyor scanner checks package destination against truck route manifest.',
    badge: 'Sentinel'
  },
  {
    id: 'tpl-customs-clearance',
    category: 'Transit & Linehaul',
    label: 'Customs Border Appraisal',
    sublabel: 'Import/Export Documentation',
    iconName: 'ShieldCheck',
    stageColor: 'purple',
    defaultSla: 24,
    stageCategory: 'transit',
    description: 'Department of Customs inspection, duty calculation, and clearance stamp.',
    badge: 'Customs'
  },
  {
    id: 'tpl-air-cargo',
    category: 'Transit & Linehaul',
    label: 'TIA Air Cargo Flight',
    sublabel: 'Aviation Bonded Transfer',
    iconName: 'Compass',
    stageColor: 'cyan',
    defaultSla: 8,
    stageCategory: 'transit',
    description: 'Tribhuvan International Airport bonded cargo apron handling and flight transit.',
    badge: 'Air Cargo'
  },

  // Last-Mile & Delivery
  {
    id: 'tpl-rider-runsheet',
    category: 'Last-Mile & Delivery',
    label: 'Rider Runsheet Batching',
    sublabel: 'AI Route Optimization',
    iconName: 'Radio',
    stageColor: 'amber',
    defaultSla: 3,
    stageCategory: 'delivery',
    description: 'Parcels clustered into optimal delivery sequences for courier two-wheeler navigation.',
    badge: 'Routing'
  },
  {
    id: 'tpl-recipient-otp',
    category: 'Last-Mile & Delivery',
    label: 'Customer Delivery OTP',
    sublabel: 'SMS Passcode Handshake',
    iconName: 'ShieldCheck',
    stageColor: 'emerald',
    defaultSla: 1,
    stageCategory: 'delivery',
    description: 'Rider verifies 4-digit SMS OTP from recipient before handing over consignment.',
    badge: 'Security'
  },
  {
    id: 'tpl-cod-cash',
    category: 'Last-Mile & Delivery',
    label: 'COD Cash Collection',
    sublabel: 'Cash on Delivery Settlement',
    iconName: 'CheckCircle2',
    stageColor: 'emerald',
    defaultSla: 2,
    stageCategory: 'completed',
    description: 'Rider collects payment, prints electronic cash receipt, and reconciles balance.',
    badge: 'Finance'
  },
  {
    id: 'tpl-ndr-exception',
    category: 'Last-Mile & Delivery',
    label: 'NDR Exception Handler',
    sublabel: 'Reattempt / RTO Scheduler',
    iconName: 'AlertCircle',
    stageColor: 'rose',
    defaultSla: 24,
    stageCategory: 'exception',
    description: 'Automated disposition if customer unreachable: schedules next-day retry or returns to merchant.',
    badge: 'Exception'
  },

  // Logic & Sentinels
  {
    id: 'tpl-hub-splitter',
    category: 'Logic & Sentinels',
    label: 'Hub Gate Splitter',
    sublabel: 'Multi-Branch Conditional Branch',
    iconName: 'Compass',
    stageColor: 'blue',
    defaultSla: 1,
    stageCategory: 'processing',
    description: 'Evaluates destination pincode to divert packages toward Western or Eastern Nepal linehauls.',
    badge: 'Condition'
  },
  {
    id: 'tpl-sla-alarm',
    category: 'Logic & Sentinels',
    label: 'SLA Breach Monitor',
    sublabel: 'Delay Alarm Sentinel',
    iconName: 'AlertCircle',
    stageColor: 'rose',
    defaultSla: 1,
    stageCategory: 'exception',
    description: 'Triggers priority supervisor alerts if stage processing exceeds target SLA hours.',
    badge: 'Sentinel'
  }
];

export const WORKFLOW_GRAPH_STORAGE_KEY = 'double7_workflow_graph_v2';

/**
 * Generates an elegant staggered DAG layout matching the visual workflow editor reference image
 */
export function generateAutoLayout(stages: WorkflowStage[]): WorkflowGraphState {
  // Staggered flowing layout matching the user's reference canvas
  const nodeSpacingX = 380;
  const nodes: WorkflowGraphNode[] = stages.map((stage, idx) => {
    // Dynamic Y offset creates natural flowchart stagger (like in the reference screenshot)
    let y = 200;
    if (idx === 0) y = 260;
    else if (idx === 1) y = 140;
    else if (idx === 2) y = 320;
    else if (idx === 3) y = 160;
    else if (idx === 4) y = 360;
    else if (idx === 5) y = 180;
    else if (idx === 6) y = 340;
    else if (idx >= 7) y = 220 + ((idx - 7) % 2) * 120;

    return {
      id: `node-${stage.id}`,
      stageId: stage.id,
      stage: { ...stage },
      x: 80 + idx * nodeSpacingX,
      y: y
    };
  });

  // Connect node[i] -> node[i+1]
  const edges: WorkflowGraphEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge-${nodes[i].id}-${nodes[i + 1].id}`,
      fromNodeId: nodes[i].id,
      toNodeId: nodes[i + 1].id,
      animated: true
    });
  }

  return {
    flowTitle: 'Double 7 Nationwide Express Dispatch & Tracking Pipeline',
    nodes,
    edges,
    zoom: 0.9,
    panX: 40,
    panY: 30,
    lastUpdated: new Date().toISOString()
  };
}

export function getWorkflowGraphState(): WorkflowGraphState {
  if (typeof window === 'undefined') {
    return generateAutoLayout(DEFAULT_WORKFLOW_STAGES);
  }
  try {
    const saved = localStorage.getItem(WORKFLOW_GRAPH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load workflow graph state:', err);
  }

  // Fallback to active stages from tracking workflow
  const currentStages = getTrackingWorkflow();
  const generated = generateAutoLayout(currentStages);
  saveWorkflowGraphState(generated);
  return generated;
}

export function saveWorkflowGraphState(graph: WorkflowGraphState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORKFLOW_GRAPH_STORAGE_KEY, JSON.stringify(graph));

    // Also sync the ordered stages to the public tracking store double7_tracking_workflow_v1
    // Derive order from graph topological or X coordinate sorting
    const sortedStages: WorkflowStage[] = [...graph.nodes]
      .sort((a, b) => a.x - b.x)
      .map((node, index) => ({
        ...node.stage,
        order: index + 1
      }));

    saveTrackingWorkflow(sortedStages);
    window.dispatchEvent(new Event('workflow-updated'));
  } catch (err) {
    console.error('Failed to save workflow graph state:', err);
  }
}


