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

const COD_STORAGE_KEY = 'double7_cod_ledger_v1';

export const INITIAL_COD_RECORDS: CodOrderRecord[] = [
  {
    id: 'cod-np-101',
    consignmentId: 'D7-8902-EXP',
    trackingNumber: 'AWB-D7-NP-8902',
    merchantId: 'usr-merch-default',
    merchantName: 'Nepal Crafts & Pashmina Ltd',
    consigneeName: 'Aarav Adhikari',
    consigneePhone: '+977 98412 11002',
    destinationCity: 'Pokhara',
    destinationHub: 'Pokhara Lakeside Sorting Hub',
    riderId: 'rider-pk-04',
    riderName: 'Dipendra Shrestha',
    riderPhone: '+977 98112 34567',
    orderAmountNpr: 4500,
    collectedAmountNpr: 4500,
    remittedAmountNpr: 4500,
    stage: 'reconciled',
    status: 'reconciled',
    isDiscrepancy: false,
    slaHours: 24,
    elapsedHours: 18,
    isAgingAlert: false,
    isPayoutHeld: false,
    createdAt: '2026-09-03 08:30 NPT',
    deliveredAt: '2026-09-03 14:15 NPT',
    cashCollectedAt: '2026-09-03 14:15 NPT',
    hubRemittedAt: '2026-09-03 19:40 NPT',
    reconciledAt: '2026-09-04 09:00 NPT',
    auditTrail: [
      { id: 'aud-1', timestamp: '2026-09-03 08:30 NPT', toStage: 'order_placed', actor: 'Store Dispatcher', actorRole: 'Sub-Merchant', note: 'Order placed with payment mode COD Rs. 4,500' },
      { id: 'aud-2', timestamp: '2026-09-03 10:15 NPT', fromStage: 'order_placed', toStage: 'picked_up', actor: 'Dipendra Shrestha', actorRole: 'Pickup Rider', note: 'Picked up from merchant warehouse' },
      { id: 'aud-3', timestamp: '2026-09-03 12:45 NPT', fromStage: 'picked_up', toStage: 'out_for_delivery', actor: 'Pokhara Lakeside Hub', actorRole: 'Hub Dispatcher', note: 'Out for delivery via Pokhara Linehaul EV' },
      { id: 'aud-4', timestamp: '2026-09-03 14:15 NPT', fromStage: 'out_for_delivery', toStage: 'delivered', actor: 'Dipendra Shrestha', actorRole: 'Delivery Rider', note: 'Consignment handed over to consignee with OTP' },
      { id: 'aud-5', timestamp: '2026-09-03 14:15 NPT', fromStage: 'delivered', toStage: 'cash_collected', actor: 'Dipendra Shrestha', actorRole: 'Delivery Rider', note: 'Rider received Rs. 4,500 exact cash from customer' },
      { id: 'aud-6', timestamp: '2026-09-03 19:40 NPT', fromStage: 'cash_collected', toStage: 'remitted_to_hub', actor: 'Pokhara Lakeside Cashier', actorRole: 'Hub Cashier', note: 'Rider cash physically deposited in hub night drop safe' },
      { id: 'aud-7', timestamp: '2026-09-04 09:00 NPT', fromStage: 'remitted_to_hub', toStage: 'reconciled', actor: 'Bikram Rayamajhi', actorRole: 'Admin Treasury', note: 'Matched order against hub cash envelope voucher' },
    ]
  },
  {
    id: 'cod-np-102',
    consignmentId: 'D7-4421-RUSH',
    trackingNumber: 'AWB-D7-NP-4421',
    merchantId: 'usr-merch-default',
    merchantName: 'Nepal Crafts & Pashmina Ltd',
    consigneeName: 'Pooja Karki',
    consigneePhone: '+977 98510 44221',
    destinationCity: 'Biratnagar',
    destinationHub: 'Biratnagar Main Hub',
    riderId: 'rider-br-11',
    riderName: 'Subash Tamang',
    riderPhone: '+977 98234 56789',
    orderAmountNpr: 12800,
    collectedAmountNpr: 12000,
    stage: 'cash_collected',
    status: 'disputed',
    discrepancyNpr: -800,
    discrepancyReason: 'Customer partial payment: consignee deducted Rs. 800 claiming promo voucher',
    isDiscrepancy: true,
    slaHours: 24,
    elapsedHours: 28,
    isAgingAlert: true,
    isPayoutHeld: true,
    holdReason: 'Auto-hold: Discrepancy flag active (Collected Rs. 12,000 vs Ordered Rs. 12,800)',
    createdAt: '2026-09-03 09:00 NPT',
    deliveredAt: '2026-09-03 15:30 NPT',
    cashCollectedAt: '2026-09-03 15:30 NPT',
    auditTrail: [
      { id: 'aud-201', timestamp: '2026-09-03 09:00 NPT', toStage: 'order_placed', actor: 'Store Dispatcher', actorRole: 'Sub-Merchant', note: 'Order placed COD Rs. 12,800' },
      { id: 'aud-202', timestamp: '2026-09-03 11:00 NPT', fromStage: 'order_placed', toStage: 'picked_up', actor: 'Subash Tamang', actorRole: 'Rider', note: 'Consignment loaded into linehaul' },
      { id: 'aud-203', timestamp: '2026-09-03 13:45 NPT', fromStage: 'picked_up', toStage: 'out_for_delivery', actor: 'Biratnagar Hub', actorRole: 'Hub Dispatcher', note: 'Out for delivery' },
      { id: 'aud-204', timestamp: '2026-09-03 15:30 NPT', fromStage: 'out_for_delivery', toStage: 'delivered', actor: 'Subash Tamang', actorRole: 'Rider', note: 'Delivered to customer' },
      { id: 'aud-205', timestamp: '2026-09-03 15:30 NPT', fromStage: 'delivered', toStage: 'cash_collected', actor: 'Subash Tamang', actorRole: 'Rider', note: 'Rider entered Rs. 12,000 collected (Short by Rs. 800)', amountChanged: { expected: 12800, collected: 12000 } },
      { id: 'aud-206', timestamp: '2026-09-04 10:00 NPT', toStage: 'cash_collected', actor: 'System Rule Engine', actorRole: 'Security Engine', note: 'Auto-hold payout triggered: unremitted cash >24 hrs SLA aging alert' },
    ]
  },
  {
    id: 'cod-np-103',
    consignmentId: 'D7-6109-EXP',
    trackingNumber: 'AWB-D7-NP-6109',
    merchantId: 'usr-merch-default',
    merchantName: 'Nepal Crafts & Pashmina Ltd',
    consigneeName: 'Roshan Shrestha',
    consigneePhone: '+977 98012 34991',
    destinationCity: 'Kathmandu',
    destinationHub: 'Baluwatar Valley Central Hub',
    riderId: 'rider-ktm-02',
    riderName: 'Bibek Bhattarai',
    riderPhone: '+977 98499 88776',
    orderAmountNpr: 3200,
    stage: 'out_for_delivery',
    status: 'pending',
    isDiscrepancy: false,
    slaHours: 12,
    elapsedHours: 4,
    isAgingAlert: false,
    isPayoutHeld: false,
    createdAt: '2026-09-04 07:00 NPT',
    auditTrail: [
      { id: 'aud-301', timestamp: '2026-09-04 07:00 NPT', toStage: 'order_placed', actor: 'Sunita Thapa', actorRole: 'Finance Sub-Merchant', note: 'Consignment confirmed for COD collection Rs. 3,200' },
      { id: 'aud-302', timestamp: '2026-09-04 08:30 NPT', fromStage: 'order_placed', toStage: 'picked_up', actor: 'Bibek Bhattarai', actorRole: 'Rider', note: 'Bagged and scanned at merchant' },
      { id: 'aud-303', timestamp: '2026-09-04 11:15 NPT', fromStage: 'picked_up', toStage: 'out_for_delivery', actor: 'Bibek Bhattarai', actorRole: 'Rider', note: 'Rider active on route in Baluwatar sector' },
    ]
  },
  {
    id: 'cod-np-104',
    consignmentId: 'D7-7714-CARGO',
    trackingNumber: 'AWB-D7-NP-7714',
    merchantId: 'usr-merch-default',
    merchantName: 'Nepal Crafts & Pashmina Ltd',
    consigneeName: 'Devika Gurung',
    consigneePhone: '+977 98601 23456',
    destinationCity: 'Butwal',
    destinationHub: 'Butwal Highway Crossdock Hub',
    riderId: 'rider-btw-09',
    riderName: 'Manoj Rana',
    riderPhone: '+977 98199 00112',
    orderAmountNpr: 8900,
    collectedAmountNpr: 8900,
    remittedAmountNpr: 8900,
    stage: 'settled',
    status: 'settled',
    isDiscrepancy: false,
    slaHours: 24,
    elapsedHours: 22,
    isAgingAlert: false,
    isPayoutHeld: false,
    createdAt: '2026-09-02 10:00 NPT',
    deliveredAt: '2026-09-02 16:30 NPT',
    cashCollectedAt: '2026-09-02 16:30 NPT',
    hubRemittedAt: '2026-09-02 20:00 NPT',
    reconciledAt: '2026-09-03 10:00 NPT',
    settledAt: '2026-09-03 16:00 NPT',
    auditTrail: [
      { id: 'aud-401', timestamp: '2026-09-02 10:00 NPT', toStage: 'order_placed', actor: 'Ramesh Sharma', actorRole: 'Warehouse Sub-Merchant', note: 'Booked COD' },
      { id: 'aud-402', timestamp: '2026-09-02 16:30 NPT', toStage: 'delivered', actor: 'Manoj Rana', actorRole: 'Rider', note: 'Delivered' },
      { id: 'aud-403', timestamp: '2026-09-02 16:30 NPT', toStage: 'cash_collected', actor: 'Manoj Rana', actorRole: 'Rider', note: 'Collected Rs. 8,900' },
      { id: 'aud-404', timestamp: '2026-09-02 20:00 NPT', toStage: 'remitted_to_hub', actor: 'Hub Cashier', actorRole: 'Cashier', note: 'Deposited in safe' },
      { id: 'aud-405', timestamp: '2026-09-03 10:00 NPT', toStage: 'reconciled', actor: 'Admin Treasury', actorRole: 'Admin', note: '100% matched against bank deposit slip' },
      { id: 'aud-406', timestamp: '2026-09-03 16:00 NPT', toStage: 'settled', actor: 'Automated Payout Engine', actorRole: 'System', note: 'NPR 8,900 remitted directly to Merchant Nepal Bank Account' },
    ]
  },
  {
    id: 'cod-np-105',
    consignmentId: 'D7-1904-EXP',
    trackingNumber: 'AWB-D7-NP-1904',
    merchantId: 'usr-merch-default',
    merchantName: 'Nepal Crafts & Pashmina Ltd',
    consigneeName: 'Anup Thapa',
    consigneePhone: '+977 98188 77665',
    destinationCity: 'Dharan',
    destinationHub: 'Dharan Eastern Corridor Hub',
    riderId: 'rider-dhr-03',
    riderName: 'Kushal Rai',
    riderPhone: '+977 98422 33114',
    orderAmountNpr: 5400,
    stage: 'failed',
    status: 'failed',
    isDiscrepancy: false,
    slaHours: 24,
    elapsedHours: 14,
    isAgingAlert: false,
    isPayoutHeld: false,
    createdAt: '2026-09-03 12:00 NPT',
    auditTrail: [
      { id: 'aud-501', timestamp: '2026-09-03 12:00 NPT', toStage: 'order_placed', actor: 'Store Dispatcher', actorRole: 'Sub-Merchant', note: 'Booked COD Rs. 5,400' },
      { id: 'aud-502', timestamp: '2026-09-03 14:00 NPT', toStage: 'picked_up', actor: 'Kushal Rai', actorRole: 'Rider', note: 'Scanned' },
      { id: 'aud-503', timestamp: '2026-09-03 17:30 NPT', toStage: 'out_for_delivery', actor: 'Kushal Rai', actorRole: 'Rider', note: 'Attempting delivery' },
      { id: 'aud-504', timestamp: '2026-09-03 19:10 NPT', toStage: 'failed', actor: 'Kushal Rai', actorRole: 'Rider', note: 'Customer unreachable (Phone switched off after 3 attempts). Re-attempt scheduled for tomorrow morning.' },
    ]
  }
];

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
