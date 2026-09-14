// src/lib/rider.ts
'use client';

import { Shipment, getShipments } from './store';

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  pin: string;
  email: string;
  hubCode: string;
  hubName: string;
  routeZone: string;
  vehicle: string;
  vehiclePlate: string;
  rating: number;
  avatarUrl?: string;
  joinedDate: string;
}

export const PRESET_RIDERS: RiderProfile[] = [
  {
    id: 'rider-ktm-01',
    name: 'Ramesh Thapa',
    phone: '+977 98412 34567',
    pin: '1234',
    email: 'ramesh.rider@double7.com.np',
    hubCode: 'KTM-01',
    hubName: 'Kathmandu Mega-Hub (KTM-01)',
    routeZone: 'KTM Central / New Road / Thamel / Baluwatar',
    vehicle: 'Honda CB Shine 125',
    vehiclePlate: 'BA 2 PA 4521',
    rating: 4.92,
    joinedDate: '2025-04-12',
  },
  {
    id: 'rider-ktm-02',
    name: 'Bikash Tamang',
    phone: '+977 98510 98765',
    pin: '1234',
    email: 'bikash.rider@double7.com.np',
    hubCode: 'KTM-01',
    hubName: 'Kathmandu Mega-Hub (KTM-01)',
    routeZone: 'Lalitpur / Patan Durbar / Jawalakhel / Kupondole',
    vehicle: 'Super Soco CPx Electric Scooter',
    vehiclePlate: 'BA 1 JA 7722',
    rating: 4.85,
    joinedDate: '2025-08-01',
  },
  {
    id: 'rider-pkr-01',
    name: 'Suresh Shrestha',
    phone: '+977 98031 22334',
    pin: '1234',
    email: 'suresh.rider@double7.com.np',
    hubCode: 'PKR-01',
    hubName: 'Pokhara Regional Sort Hub (PKR-01)',
    routeZone: 'Lakeside / Mahendrapool / New Road Pokhara',
    vehicle: 'Bajaj Pulsar 150',
    vehiclePlate: 'GA 1 PA 8812',
    rating: 4.96,
    joinedDate: '2025-06-18',
  },
  {
    id: 'rider-brt-01',
    name: 'Hari Prasad Acharya',
    phone: '+977 98123 44556',
    pin: '1234',
    email: 'hari.rider@double7.com.np',
    hubCode: 'BRT-01',
    hubName: 'Biratnagar Hub (BRT-01)',
    routeZone: 'Main Road / Traffic Chowk / Rani Port Gateway',
    vehicle: 'TVS Raider 125',
    vehiclePlate: 'KO 2 PA 3341',
    rating: 4.78,
    joinedDate: '2025-09-10',
  },
];

export interface RiderStats {
  assignedTotal: number;
  outForDelivery: number;
  delivered: number;
  pendingPickup: number;
  failedNdr: number;
  cashInHandNpr: number;
  totalDeliveredNpr: number;
  completionRate: number;
}

export interface RiderRemittanceRecord {
  id: string;
  receiptNo: string;
  riderId: string;
  riderName: string;
  hubCode: string;
  hubName: string;
  cashierName: string;
  totalAmountNpr: number;
  consignmentsCount: number;
  trackingNumbers: string[];
  status: 'verified_by_cashier' | 'pending_audit' | 'bank_deposited';
  submittedAt: string;
  notes?: string;
}

const ACTIVE_RIDER_KEY = 'double7_active_rider_id_v1';
const RIDER_SESSION_KEY = 'double7_rider_session_token_v1';
const REMITTANCES_KEY = 'double7_rider_remittances_v1';

export function getRiders(): RiderProfile[] {
  return PRESET_RIDERS;
}

/**
 * Returns the currently authenticated rider session, or null if no rider is logged in.
 */
export function getAuthenticatedRider(): RiderProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const savedId = localStorage.getItem(RIDER_SESSION_KEY);
    if (savedId) {
      const found = PRESET_RIDERS.find(r => r.id === savedId);
      if (found) return found;
    }
  } catch {}
  return null;
}

/**
 * Log in a field delivery rider by Phone, Rider ID, Email, or Name + 4-digit PIN.
 */
export function loginRider(credential: string, pin: string): { success: boolean; rider?: RiderProfile; error?: string } {
  if (!credential || !credential.trim()) {
    return { success: false, error: 'Please enter your registered Rider Phone Number or Rider ID.' };
  }
  if (!pin || !pin.trim()) {
    return { success: false, error: 'Please enter your 4-digit security PIN.' };
  }

  const cleanCred = credential.trim().toLowerCase();
  const digitsOnlyCred = cleanCred.replace(/[^0-9]/g, '');
  const cleanPin = pin.trim();

  const found = PRESET_RIDERS.find(r => {
    const rDigits = r.phone.replace(/[^0-9]/g, '');
    const matchPhone = rDigits.includes(digitsOnlyCred) || (digitsOnlyCred.length >= 7 && rDigits.endsWith(digitsOnlyCred));
    const matchId = r.id.toLowerCase() === cleanCred;
    const matchEmail = r.email.toLowerCase() === cleanCred;
    const matchName = r.name.toLowerCase().includes(cleanCred);
    return matchPhone || matchId || matchEmail || matchName;
  });

  if (!found) {
    return {
      success: false,
      error: 'Rider identity not found. Verify your mobile number or select a registered demo rider below.',
    };
  }

  if (found.pin !== cleanPin && cleanPin !== '1234') {
    return {
      success: false,
      error: 'Incorrect 4-digit security PIN. Default terminal PIN is 1234.',
    };
  }

  // Persist session
  if (typeof window !== 'undefined') {
    localStorage.setItem(RIDER_SESSION_KEY, found.id);
    localStorage.setItem(ACTIVE_RIDER_KEY, found.id);
    window.dispatchEvent(new Event('rider-auth-changed'));
    window.dispatchEvent(new Event('rider-changed'));
  }

  return { success: true, rider: found };
}

/**
 * Terminate the active rider session and lock the mobile terminal.
 */
export function logoutRider(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(RIDER_SESSION_KEY);
    window.dispatchEvent(new Event('rider-auth-changed'));
    window.dispatchEvent(new Event('rider-changed'));
  }
}

export function getActiveRider(): RiderProfile {
  if (typeof window === 'undefined') return PRESET_RIDERS[0];
  try {
    const authRider = getAuthenticatedRider();
    if (authRider) return authRider;

    const saved = localStorage.getItem(ACTIVE_RIDER_KEY);
    if (saved) {
      const found = PRESET_RIDERS.find(r => r.id === saved);
      if (found) return found;
    }
  } catch {}
  return PRESET_RIDERS[0];
}

export function setActiveRider(riderId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_RIDER_KEY, riderId);
    localStorage.setItem(RIDER_SESSION_KEY, riderId);
    window.dispatchEvent(new Event('rider-changed'));
    window.dispatchEvent(new Event('rider-auth-changed'));
  }
}

export function getRiderStats(riderId: string, allShipments: Shipment[]): RiderStats {
  const riderShipments = allShipments.filter(s => {
    if (s.assignedRider && s.assignedRider.id === riderId) return true;
    // Fallback: match by city/hub
    const rider = PRESET_RIDERS.find(r => r.id === riderId);
    if (rider && s.destination?.hub?.includes(rider.hubCode.split('-')[0])) return true;
    return false;
  });

  const assignedTotal = riderShipments.length;
  let delivered = 0;
  let outForDelivery = 0;
  let pendingPickup = 0;
  let failedNdr = 0;
  let cashInHandNpr = 0;
  let totalDeliveredNpr = 0;

  for (const s of riderShipments) {
    const cod = s.codAmount || 0;
    if (s.status === 'Delivered') {
      delivered++;
      totalDeliveredNpr += cod;
      // Cash in hand from delivered COD
      cashInHandNpr += cod;
    } else if (s.status === 'Out for Delivery') {
      outForDelivery++;
    } else if (s.status === 'Pending Pickup' || s.status === 'Courier Assigned') {
      pendingPickup++;
    } else if (s.status === 'Exception' || (s.deliveryAttempts && s.deliveryAttempts > 0)) {
      failedNdr++;
    }
  }

  // Deduct already remitted cash
  const remittances = getRiderRemittances(riderId);
  const totalRemitted = remittances.reduce((sum, r) => sum + r.totalAmountNpr, 0);
  cashInHandNpr = Math.max(0, cashInHandNpr - totalRemitted);

  const completionRate = assignedTotal > 0 ? Math.round((delivered / assignedTotal) * 100) : 100;

  return {
    assignedTotal,
    outForDelivery,
    delivered,
    pendingPickup,
    failedNdr,
    cashInHandNpr,
    totalDeliveredNpr,
    completionRate,
  };
}

export function getRiderRemittances(riderId?: string): RiderRemittanceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REMITTANCES_KEY);
    const list: RiderRemittanceRecord[] = raw ? JSON.parse(raw) : [];
    if (riderId) {
      return list.filter(r => r.riderId === riderId);
    }
    return list;
  } catch {
    return [];
  }
}

export function createRiderRemittance(
  riderId: string,
  hubCode: string,
  trackingNumbers: string[],
  amount: number,
  cashierName: string = 'Station Cashier'
): RiderRemittanceRecord {
  const rider = PRESET_RIDERS.find(r => r.id === riderId) || PRESET_RIDERS[0];
  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const receiptNo = `REC-COD-${Date.now().toString().slice(-6)}`;
  const record: RiderRemittanceRecord = {
    id: `rem-${Date.now()}`,
    receiptNo,
    riderId: rider.id,
    riderName: rider.name,
    hubCode: rider.hubCode,
    hubName: rider.hubName,
    cashierName,
    totalAmountNpr: amount,
    consignmentsCount: trackingNumbers.length,
    trackingNumbers,
    status: 'verified_by_cashier',
    submittedAt: now,
    notes: `Daily run-sheet COD cash handover acknowledged by ${cashierName}.`,
  };

  if (typeof window !== 'undefined') {
    const current = getRiderRemittances();
    const updated = [record, ...current];
    localStorage.setItem(REMITTANCES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('remittance-created'));
  }

  return record;
}
