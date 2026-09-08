// src/lib/cod.ts

export type CodStage =
  | 'order_placed'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cash_collected'
  | 'remitted_to_hub'
  | 'reconciled'
  | 'settled'
  | 'failed';

export interface CodAuditEntry {
  id: string;
  timestamp: string;
  fromStage?: CodStage;
  toStage: CodStage;
  actor: string;
  actorRole: string;
  note: string;
  amountChanged?: {
    expected: number;
    collected: number;
  };
}

export interface CodOrderRecord {
  id: string;
  consignmentId: string;
  trackingNumber: string;
  merchantId: string;
  merchantName: string;
  consigneeName: string;
  consigneePhone: string;
  destinationCity: string;
  destinationHub: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  orderAmountNpr: number;
  collectedAmountNpr?: number;
  remittedAmountNpr?: number;
  stage: CodStage;
  status: 'pending' | 'collected' | 'remitted' | 'reconciled' | 'settled' | 'disputed' | 'failed';
  discrepancyNpr?: number;
  discrepancyReason?: string;
  isDiscrepancy: boolean;
  slaHours: number;
  elapsedHours: number;
  isAgingAlert: boolean;
  isPayoutHeld: boolean;
  holdReason?: string;
  createdAt: string;
  deliveredAt?: string;
  cashCollectedAt?: string;
  hubRemittedAt?: string;
  reconciledAt?: string;
  settledAt?: string;
  auditTrail: CodAuditEntry[];
}

const COD_STORAGE_KEY = 'double7_cod_prod_v1';

export const INITIAL_COD_RECORDS: CodOrderRecord[] = [];

export function getCodRecords(merchantId?: string): CodOrderRecord[] {
  if (typeof window === 'undefined') {
    return merchantId ? INITIAL_COD_RECORDS.filter(r => r.merchantId === merchantId) : INITIAL_COD_RECORDS;
  }
  try {
    const raw = localStorage.getItem(COD_STORAGE_KEY);
    let list: CodOrderRecord[] = raw ? JSON.parse(raw) : INITIAL_COD_RECORDS;
    if (!raw) {
      localStorage.setItem(COD_STORAGE_KEY, JSON.stringify(INITIAL_COD_RECORDS));
    }
    if (merchantId) {
      return list.filter(r => r.merchantId === merchantId);
    }
    return list;
  } catch {
    return INITIAL_COD_RECORDS;
  }
}

export function saveCodRecords(records: CodOrderRecord[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(COD_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('cod-records-change'));
  }
}

export function advanceCodStage(
  recordId: string,
  newStage: CodStage,
  actor: { name: string; role: string },
  opts?: {
    collectedAmount?: number;
    remittedAmount?: number;
    note?: string;
    isFailed?: boolean;
    failReason?: string;
  }
): { success: boolean; record?: CodOrderRecord; error?: string } {
  const current = getCodRecords();
  const index = current.findIndex(r => r.id === recordId);
  if (index === -1) {
    return { success: false, error: 'COD Record not found.' };
  }

  const rec = { ...current[index] };
  const prevStage = rec.stage;
  const nowStr = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' NPT';

  rec.stage = newStage;

  if (newStage === 'delivered') {
    rec.deliveredAt = nowStr;
  }

  if (newStage === 'cash_collected') {
    rec.cashCollectedAt = nowStr;
    const collected = opts?.collectedAmount !== undefined ? opts.collectedAmount : rec.orderAmountNpr;
    rec.collectedAmountNpr = collected;
    if (collected !== rec.orderAmountNpr) {
      rec.isDiscrepancy = true;
      rec.discrepancyNpr = collected - rec.orderAmountNpr;
      rec.discrepancyReason = `Discrepancy: Collected Rs. ${collected} differs from Order Rs. ${rec.orderAmountNpr}`;
      rec.status = 'disputed';
      rec.isPayoutHeld = true;
      rec.holdReason = 'Auto-hold: Amount discrepancy on cash collection';
    } else {
      rec.status = 'collected';
    }
  }

  if (newStage === 'remitted_to_hub') {
    rec.hubRemittedAt = nowStr;
    rec.remittedAmountNpr = opts?.remittedAmount !== undefined ? opts.remittedAmount : (rec.collectedAmountNpr || rec.orderAmountNpr);
    rec.status = 'remitted';
  }

  if (newStage === 'reconciled') {
    rec.reconciledAt = nowStr;
    rec.status = 'reconciled';
  }

  if (newStage === 'settled') {
    if (rec.isPayoutHeld) {
      return { success: false, error: `Cannot settle payout while hold is active: ${rec.holdReason}` };
    }
    rec.settledAt = nowStr;
    rec.status = 'settled';
  }

  if (newStage === 'failed') {
    rec.status = 'failed';
  }

  const auditEntry: CodAuditEntry = {
    id: `aud-${Date.now()}`,
    timestamp: nowStr,
    fromStage: prevStage,
    toStage: newStage,
    actor: actor.name,
    actorRole: actor.role,
    note: opts?.note || `Advanced stage to ${newStage.replace(/_/g, ' ').toUpperCase()}`,
    amountChanged: opts?.collectedAmount !== undefined ? { expected: rec.orderAmountNpr, collected: opts.collectedAmount } : undefined,
  };

  rec.auditTrail = [auditEntry, ...(rec.auditTrail || [])];
  current[index] = rec;
  saveCodRecords(current);

  return { success: true, record: rec };
}

export function toggleDisputeHold(
  recordId: string,
  hold: boolean,
  reason: string,
  actor: { name: string; role: string }
): { success: boolean; record?: CodOrderRecord } {
  const current = getCodRecords();
  const index = current.findIndex(r => r.id === recordId);
  if (index === -1) return { success: false };

  const rec = { ...current[index] };
  const nowStr = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' NPT';

  rec.isPayoutHeld = hold;
  rec.holdReason = hold ? reason : undefined;
  if (!hold && rec.status === 'disputed') {
    rec.status = rec.reconciledAt ? 'reconciled' : (rec.hubRemittedAt ? 'remitted' : 'collected');
  }

  rec.auditTrail = [
    {
      id: `aud-${Date.now()}`,
      timestamp: nowStr,
      toStage: rec.stage,
      actor: actor.name,
      actorRole: actor.role,
      note: hold ? `Dispute hold applied: ${reason}` : `Dispute hold released: ${reason}`,
    },
    ...rec.auditTrail,
  ];

  current[index] = rec;
  saveCodRecords(current);
  return { success: true, record: rec };
}

export function resolveDiscrepancy(
  recordId: string,
  resolutionType: 'rider_shortage_debt' | 'merchant_voucher_discount' | 'admin_override_waive',
  note: string,
  actor: { name: string; role: string }
): { success: boolean; record?: CodOrderRecord } {
  const current = getCodRecords();
  const index = current.findIndex(r => r.id === recordId);
  if (index === -1) return { success: false };

  const rec = { ...current[index] };
  const nowStr = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' NPT';

  rec.isDiscrepancy = false;
  rec.isPayoutHeld = false;
  rec.holdReason = undefined;
  rec.discrepancyReason = `Resolved via ${resolutionType.replace(/_/g, ' ')}: ${note}`;
  rec.status = rec.reconciledAt ? 'reconciled' : (rec.hubRemittedAt ? 'remitted' : 'collected');

  rec.auditTrail = [
    {
      id: `aud-${Date.now()}`,
      timestamp: nowStr,
      toStage: rec.stage,
      actor: actor.name,
      actorRole: actor.role,
      note: `Discrepancy resolved (${resolutionType.toUpperCase()}): ${note}`,
    },
    ...rec.auditTrail,
  ];

  current[index] = rec;
  saveCodRecords(current);
  return { success: true, record: rec };
}

export function depositRiderCashBatchToHub(
  riderId: string,
  actor: { name: string; role: string }
): { success: boolean; count: number; totalAmount: number } {
  const current = getCodRecords();
  const nowStr = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' NPT';
  let count = 0;
  let totalAmount = 0;

  for (let i = 0; i < current.length; i++) {
    const rec = current[i];
    if (rec.riderId === riderId && rec.stage === 'cash_collected') {
      rec.stage = 'remitted_to_hub';
      rec.hubRemittedAt = nowStr;
      rec.remittedAmountNpr = rec.collectedAmountNpr || rec.orderAmountNpr;
      rec.status = 'remitted';
      count++;
      totalAmount += rec.remittedAmountNpr;

      rec.auditTrail = [
        {
          id: `aud-${Date.now()}-${i}`,
          timestamp: nowStr,
          fromStage: 'cash_collected',
          toStage: 'remitted_to_hub',
          actor: actor.name,
          actorRole: actor.role,
          note: `Batch hub safe deposit confirmed for rider ${rec.riderName} (Rs. ${rec.remittedAmountNpr.toLocaleString()})`,
        },
        ...rec.auditTrail,
      ];
    }
  }

  if (count > 0) {
    saveCodRecords(current);
    return { success: true, count, totalAmount };
  }
  return { success: false, count: 0, totalAmount: 0 };
}

export function scheduleNdrReattempt(
  recordId: string,
  newDateStr: string,
  note: string,
  actor: { name: string; role: string }
): { success: boolean; record?: CodOrderRecord } {
  const current = getCodRecords();
  const index = current.findIndex(r => r.id === recordId);
  if (index === -1) return { success: false };

  const rec = { ...current[index] };
  const nowStr = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' NPT';

  rec.stage = 'out_for_delivery';
  rec.status = 'pending';

  rec.auditTrail = [
    {
      id: `aud-${Date.now()}`,
      timestamp: nowStr,
      fromStage: 'failed',
      toStage: 'out_for_delivery',
      actor: actor.name,
      actorRole: actor.role,
      note: `NDR Re-attempt scheduled for ${newDateStr}: ${note}`,
    },
    ...rec.auditTrail,
  ];

  current[index] = rec;
  saveCodRecords(current);
  return { success: true, record: rec };
}

export function initiateRtoReturn(
  recordId: string,
  reason: string,
  actor: { name: string; role: string }
): { success: boolean; record?: CodOrderRecord } {
  const current = getCodRecords();
  const index = current.findIndex(r => r.id === recordId);
  if (index === -1) return { success: false };

  const rec = { ...current[index] };
  const nowStr = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' NPT';

  rec.stage = 'failed';
  rec.status = 'failed';
  rec.holdReason = `RTO (Return to Origin) Initiated: ${reason}`;

  rec.auditTrail = [
    {
      id: `aud-${Date.now()}`,
      timestamp: nowStr,
      fromStage: 'failed',
      toStage: 'failed',
      actor: actor.name,
      actorRole: actor.role,
      note: `RTO Initiated by ${actor.role}: ${reason}`,
    },
    ...rec.auditTrail,
  ];

  current[index] = rec;
  saveCodRecords(current);
  return { success: true, record: rec };
}

export function resetCodDemoData(): CodOrderRecord[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(COD_STORAGE_KEY, JSON.stringify(INITIAL_COD_RECORDS));
    window.dispatchEvent(new Event('cod-records-change'));
  }
  return INITIAL_COD_RECORDS;
}
