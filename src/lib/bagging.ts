'use client';

import { Shipment, getShipments, updateShipmentStatus } from './store';
import { ManifestItem } from './manifest';

export interface MasterBag {
  id: string;
  bagNumber: string;
  originHub: string;
  originHubName: string;
  destinationHub: string;
  destinationHubName: string;
  sealNumber: string;
  itemBookingIds: string[];
  totalPieces: number;
  totalWeightKg: number;
  totalCodNpr: number;
  status: 'Open' | 'Sealed' | 'Manifested' | 'Debagged';
  manifestId?: string;
  createdAt: string;
  sealedAt?: string;
  sealedBy?: string;
  debaggedAt?: string;
  debaggedBy?: string;
  notes?: string;
}

const BAGGING_STORAGE_KEY = 'double7_master_bags_v1';

export function getMasterBags(hubCode?: string): MasterBag[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BAGGING_STORAGE_KEY);
    const list: MasterBag[] = raw ? JSON.parse(raw) : [];
    if (hubCode && hubCode !== 'ALL' && hubCode !== 'HQ') {
      return list.filter(b => b.originHub === hubCode || b.destinationHub === hubCode);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveMasterBag(bag: MasterBag): void {
  if (typeof window === 'undefined') return;
  const current = getMasterBags();
  const index = current.findIndex(b => b.id === bag.id);
  if (index !== -1) {
    current[index] = bag;
  } else {
    current.unshift(bag);
  }
  localStorage.setItem(BAGGING_STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('bags-updated'));
}

export function createMasterBag(params: {
  originHub: string;
  originHubName: string;
  destinationHub: string;
  destinationHubName: string;
  sealNumber: string;
  itemBookingIds: string[];
  totalPieces: number;
  totalWeightKg: number;
  totalCodNpr: number;
  sealedBy?: string;
  notes?: string;
}): MasterBag {
  const timestamp = Date.now();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.floor(100 + Math.random() * 900);
  const bagNumber = `BAG-${params.originHub.slice(0, 3)}-${dateStr}-${seq}`;

  const bag: MasterBag = {
    id: `bag-${timestamp}-${seq}`,
    bagNumber,
    originHub: params.originHub,
    originHubName: params.originHubName,
    destinationHub: params.destinationHub,
    destinationHubName: params.destinationHubName,
    sealNumber: params.sealNumber || `SL-${Math.floor(10000 + Math.random() * 90000)}`,
    itemBookingIds: params.itemBookingIds,
    totalPieces: params.totalPieces,
    totalWeightKg: params.totalWeightKg,
    totalCodNpr: params.totalCodNpr,
    status: 'Sealed',
    createdAt: new Date().toISOString(),
    sealedAt: new Date().toISOString(),
    sealedBy: params.sealedBy || 'Hub Sorting Desk',
    notes: params.notes,
  };

  saveMasterBag(bag);
  return bag;
}

export function debagMasterBag(bagId: string, debaggedBy: string): MasterBag | null {
  const list = getMasterBags();
  const bag = list.find(b => b.id === bagId);
  if (!bag) return null;

  bag.status = 'Debagged';
  bag.debaggedAt = new Date().toISOString();
  bag.debaggedBy = debaggedBy;
  saveMasterBag(bag);
  return bag;
}
