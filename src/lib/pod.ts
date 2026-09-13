'use client';

import { Shipment, getShipments, updateShipmentStatus } from './store';

export interface ProofOfDeliveryRecord {
  id: string;
  bookingId: string;
  trackingNo: string;
  recipientName: string;
  recipientPhone: string;
  deliveryOtp: string;
  isOtpVerified: boolean;
  signatureDataUrl?: string;
  codAmountDue: number;
  codAmountCollected: number;
  deliveredByRider: string;
  riderPhone: string;
  branchCode: string;
  deliveredAt: string;
  status: 'Delivered' | 'Reattempt Scheduled' | 'Returned';
  ndrReason?: string;
  notes?: string;
  cashRemittedToBranch?: boolean;
  branchCashierApproved?: boolean;
}

const POD_STORAGE_KEY = 'double7_pod_records_v1';

export function getPodRecords(branchCode?: string): ProofOfDeliveryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(POD_STORAGE_KEY);
    const list: ProofOfDeliveryRecord[] = raw ? JSON.parse(raw) : [];
    if (branchCode && branchCode !== 'ALL' && branchCode !== 'HQ') {
      return list.filter(r => r.branchCode === branchCode);
    }
    return list;
  } catch {
    return [];
  }
}

export function savePodRecord(record: ProofOfDeliveryRecord): void {
  if (typeof window === 'undefined') return;
  const current = getPodRecords();
  const index = current.findIndex(r => r.id === record.id);
  if (index !== -1) {
    current[index] = record;
  } else {
    current.unshift(record);
  }
  localStorage.setItem(POD_STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('pod-updated'));
}

/**
 * Generate a predictable 4-digit OTP for a booking (stored or derived from ID)
 */
export function getOrCreateDeliveryOtp(bookingId: string): string {
  let hash = 0;
  for (let i = 0; i < bookingId.length; i++) {
    hash = (hash << 5) - hash + bookingId.charCodeAt(i);
    hash |= 0;
  }
  const otp = Math.abs(hash % 9000) + 1000;
  return otp.toString();
}

/**
 * Complete a Digital Proof of Delivery
 */
export function completeDeliveryWithPod(params: {
  bookingId: string;
  recipientName: string;
  recipientPhone: string;
  enteredOtp: string;
  signatureDataUrl?: string;
  codCollected: number;
  riderName: string;
  riderPhone: string;
  branchCode: string;
  deliveryNotes?: string;
}): { success: boolean; error?: string; record?: ProofOfDeliveryRecord } {
  const expectedOtp = getOrCreateDeliveryOtp(params.bookingId);
  const isValidOtp = params.enteredOtp.trim() === expectedOtp || params.enteredOtp.trim() === '7777'; // 7777 is universal master override for test demo

  if (!isValidOtp) {
    return {
      success: false,
      error: `Invalid OTP. Recipient phone receives 4-digit code (Demo hint: ${expectedOtp} or master code 7777).`
    };
  }

  const shipment = getShipments().find(s => s.id === params.bookingId || s.bookingNo === params.bookingId);
  const codDue = shipment?.codAmount || 0;

  const record: ProofOfDeliveryRecord = {
    id: `pod-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    bookingId: params.bookingId,
    trackingNo: shipment?.trackingNo || params.bookingId,
    recipientName: params.recipientName,
    recipientPhone: params.recipientPhone,
    deliveryOtp: params.enteredOtp,
    isOtpVerified: true,
    signatureDataUrl: params.signatureDataUrl,
    codAmountDue: codDue,
    codAmountCollected: params.codCollected,
    deliveredByRider: params.riderName,
    riderPhone: params.riderPhone,
    branchCode: params.branchCode,
    deliveredAt: new Date().toISOString(),
    status: 'Delivered',
    notes: params.deliveryNotes,
    cashRemittedToBranch: false,
    branchCashierApproved: false,
  };

  savePodRecord(record);

  // Update shipment status to Delivered
  updateShipmentStatus(
    params.bookingId,
    'Delivered',
    `Verified recipient handover by ${params.riderName}. Recipient OTP confirmed. ${params.codCollected > 0 ? `COD collected: NPR ${params.codCollected.toLocaleString()}` : 'Non-COD freight complete.'}`,
    shipment?.destination.city || 'Destination Hub'
  );

  return { success: true, record };
}

/**
 * Record Non-Delivery Report (NDR) / Reattempt
 */
export function recordDeliveryAttemptFailure(params: {
  bookingId: string;
  reason: string;
  riderName: string;
  branchCode: string;
  reattemptDate?: string;
  notes?: string;
}): { success: boolean; record: ProofOfDeliveryRecord } {
  const shipment = getShipments().find(s => s.id === params.bookingId || s.bookingNo === params.bookingId);

  const record: ProofOfDeliveryRecord = {
    id: `ndr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    bookingId: params.bookingId,
    trackingNo: shipment?.trackingNo || params.bookingId,
    recipientName: shipment?.recipient.name || 'Recipient',
    recipientPhone: shipment?.recipient.phone || '',
    deliveryOtp: '',
    isOtpVerified: false,
    codAmountDue: shipment?.codAmount || 0,
    codAmountCollected: 0,
    deliveredByRider: params.riderName,
    riderPhone: '',
    branchCode: params.branchCode,
    deliveredAt: new Date().toISOString(),
    status: 'Reattempt Scheduled',
    ndrReason: params.reason,
    notes: params.notes,
    cashRemittedToBranch: false,
    branchCashierApproved: false,
  };

  savePodRecord(record);

  updateShipmentStatus(
    params.bookingId,
    'Reattempt Scheduled',
    `Delivery attempt incomplete: ${params.reason}. ${params.reattemptDate ? `Scheduled for re-attempt on ${params.reattemptDate}` : 'Rider logged non-delivery report.'}`,
    shipment?.destination.city || 'Destination Hub'
  );

  return { success: true, record };
}

/**
 * Branch Cashier Reconciliation: approve rider COD cash handover
 */
export function reconcileRiderCashHandover(podIds: string[], cashierName: string): void {
  const current = getPodRecords();
  current.forEach(r => {
    if (podIds.includes(r.id)) {
      r.cashRemittedToBranch = true;
      r.branchCashierApproved = true;
    }
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(POD_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('pod-updated'));
  }
}
