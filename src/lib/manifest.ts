'use client';

import { getShipments, updateShipmentStatus, Shipment } from './store';

export interface ManifestItem {
  bookingId: string;
  consigneeName: string;
  consigneePhone: string;
  destinationCity: string;
  destinationHub: string;
  pieces: number;
  weightKg: number;
  service: string;
  serviceCode: string;
  codAmount: number;
  status: string;
  addedAt: string;
}

export type ManifestStatus = 'Draft' | 'Pending Approval' | 'Printed' | 'Approved & Dispatched';

export interface NepalHub {
  code: string;
  name: string;
  city: string;
  region: string;
  prefix: string;
}

export const NEPAL_HUBS: NepalHub[] = [
  { code: 'KTM-01', name: 'Kathmandu Mega-Hub (KTM-01)', city: 'Kathmandu', region: 'Bagmati Central', prefix: 'KTM' },
  { code: 'PKR-01', name: 'Pokhara Regional Sort Hub (PKR-01)', city: 'Pokhara', region: 'Gandaki Western', prefix: 'PKR' },
  { code: 'BRT-01', name: 'Biratnagar Hub (BRT-01)', city: 'Biratnagar', region: 'Koshi Eastern', prefix: 'BRT' },
  { code: 'BRG-01', name: 'Birgunj Port Gateway (BRG-01)', city: 'Birgunj', region: 'Madhesh Commercial', prefix: 'BRG' },
  { code: 'CHT-01', name: 'Chitwan Narayangarh Hub (CHT-01)', city: 'Bharatpur', region: 'Central Terai', prefix: 'CHT' },
  { code: 'BTW-01', name: 'Butwal Cross-Dock Hub (BTW-01)', city: 'Butwal', region: 'Lumbini Corridor', prefix: 'BTW' },
  { code: 'NPJ-01', name: 'Nepalgunj Regional Hub (NPJ-01)', city: 'Nepalgunj', region: 'Bheri / Karnali Gateway', prefix: 'NPJ' },
  { code: 'DHN-01', name: 'Dhangadhi Terminal (DHN-01)', city: 'Dhangadhi', region: 'Sudurpashchim Gateway', prefix: 'DHN' },
];

export interface BranchManifest {
  id: string;
  manifestNumber: string;
  branchOrigin: string;
  branchCode: string;
  destinationHub: string;
  destinationCity: string;
  linehaulVehicle: string;
  driverName: string;
  driverPhone: string;
  sealNumber: string;
  items: ManifestItem[];
  totalShipments: number;
  totalPieces: number;
  totalWeightKg: number;
  totalCodNpr: number;
  status: ManifestStatus;
  isLocked?: boolean;
  createdAt: string;
  generatedAt?: string;
  printedAt?: string;
  dispatchedAt?: string;
  dispatchedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

const MANIFESTS_STORAGE_KEY = 'double7_branch_manifests_v2';

export const DEFAULT_BRANCH_MANIFESTS: BranchManifest[] = [];

export function getBranchManifests(branchCode?: string): BranchManifest[] {
  if (typeof window === 'undefined') return DEFAULT_BRANCH_MANIFESTS;
  try {
    localStorage.removeItem('double7_branch_manifests_v1');
    const raw = localStorage.getItem(MANIFESTS_STORAGE_KEY);
    let list: BranchManifest[] = raw ? JSON.parse(raw) : DEFAULT_BRANCH_MANIFESTS;
    if (!raw) {
      localStorage.setItem(MANIFESTS_STORAGE_KEY, JSON.stringify(DEFAULT_BRANCH_MANIFESTS));
    }
    if (branchCode && branchCode !== 'ALL') {
      return list.filter(m => m.branchCode.toUpperCase() === branchCode.toUpperCase());
    }
    return list;
  } catch {
    return DEFAULT_BRANCH_MANIFESTS;
  }
}

export function saveBranchManifest(manifest: BranchManifest): void {
  if (typeof window === 'undefined') return;
  const current = getBranchManifests();
  const index = current.findIndex(m => m.id === manifest.id);
  if (index !== -1) {
    current[index] = manifest;
  } else {
    current.unshift(manifest);
  }
  localStorage.setItem(MANIFESTS_STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('manifest-updated'));
}

export function updateBranchManifest(updated: BranchManifest): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Window undefined' };
  const current = getBranchManifests();
  const index = current.findIndex(m => m.id === updated.id);
  if (index === -1) {
    return { success: false, error: 'Manifest not found in registry.' };
  }
  const existing = current[index];
  if (existing.status === 'Approved & Dispatched' || existing.isLocked) {
    return {
      success: false,
      error: 'CRITICAL SECURITY: This manifest is already Verified & Dispatched. It is permanently locked and cannot be edited.'
    };
  }

  // Recalculate totals
  const totalPieces = updated.items.reduce((sum, item) => sum + (item.pieces || 1), 0);
  const totalWeightKg = Math.round(updated.items.reduce((sum, item) => sum + (item.weightKg || 0), 0) * 10) / 10;
  const totalCodNpr = updated.items.reduce((sum, item) => sum + (item.codAmount || 0), 0);

  current[index] = {
    ...updated,
    totalShipments: updated.items.length,
    totalPieces,
    totalWeightKg,
    totalCodNpr,
  };

  localStorage.setItem(MANIFESTS_STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('manifest-updated'));
  return { success: true };
}

export function deleteBranchManifest(id: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Window undefined' };
  const current = getBranchManifests();
  const target = current.find(m => m.id === id);
  if (!target) return { success: false, error: 'Manifest not found.' };
  if (target.status === 'Approved & Dispatched' || target.isLocked) {
    return { success: false, error: 'Cannot delete an Approved & Dispatched manifest. It is permanently archived.' };
  }
  const filtered = current.filter(m => m.id !== id);
  localStorage.setItem(MANIFESTS_STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new Event('manifest-updated'));
  return { success: true };
}

export function getManifestById(id: string): BranchManifest | undefined {
  const manifests = getBranchManifests();
  return manifests.find(m => m.id.toLowerCase() === id.toLowerCase() || m.manifestNumber.toLowerCase() === id.toLowerCase());
}

export function createBranchManifest(params: {
  branchOrigin: string;
  branchCode: string;
  destinationHub: string;
  destinationCity: string;
  linehaulVehicle: string;
  driverName: string;
  driverPhone: string;
  sealNumber: string;
  items: ManifestItem[];
  status?: ManifestStatus;
  notes?: string;
}): BranchManifest {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const manifestNumber = `MNF-${params.branchCode.replace(/[^A-Za-z0-9]/g, '').slice(0, 3)}-${dateStr}-${randomSuffix}`;
  const id = manifestNumber;

  const totalPieces = params.items.reduce((sum, item) => sum + (item.pieces || 1), 0);
  const totalWeightKg = Math.round(params.items.reduce((sum, item) => sum + (item.weightKg || 0), 0) * 10) / 10;
  const totalCodNpr = params.items.reduce((sum, item) => sum + (item.codAmount || 0), 0);

  const newManifest: BranchManifest = {
    id,
    manifestNumber,
    branchOrigin: params.branchOrigin,
    branchCode: params.branchCode,
    destinationHub: params.destinationHub,
    destinationCity: params.destinationCity,
    linehaulVehicle: params.linehaulVehicle,
    driverName: params.driverName,
    driverPhone: params.driverPhone,
    sealNumber: params.sealNumber,
    items: params.items,
    totalShipments: params.items.length,
    totalPieces,
    totalWeightKg,
    totalCodNpr,
    status: params.status || 'Pending Approval',
    isLocked: false,
    createdAt: now.toISOString(),
    generatedAt: now.toISOString(),
    notes: params.notes,
  };

  saveBranchManifest(newManifest);
  return newManifest;
}

export function markManifestPrinted(id: string): BranchManifest | null {
  const manifest = getManifestById(id);
  if (!manifest) return null;
  if (manifest.status !== 'Approved & Dispatched') {
    manifest.status = 'Printed';
  }
  manifest.printedAt = new Date().toISOString();
  saveBranchManifest(manifest);
  return manifest;
}

/**
 * Approves and dispatches the manifest, updating ALL included shipments to "Shipment Dispatched"
 * and permanently locking the manifest from any further edits.
 */
export function approveAndDispatchManifest(
  manifestId: string,
  approvedBy?: string
): { success: boolean; manifest?: BranchManifest; updatedCount: number; error?: string } {
  const manifests = getBranchManifests();
  const manifest = manifests.find(m => m.id.toLowerCase() === manifestId.toLowerCase() || m.manifestNumber.toLowerCase() === manifestId.toLowerCase());
  if (!manifest) {
    return { success: false, updatedCount: 0, error: 'Manifest not found in registry.' };
  }

  if (manifest.status === 'Approved & Dispatched' || manifest.isLocked) {
    return { success: false, updatedCount: 0, error: 'This manifest is already verified, dispatched, and locked.' };
  }

  if (manifest.items.length === 0) {
    return { success: false, updatedCount: 0, error: 'Cannot dispatch an empty manifest without shipments.' };
  }

  const now = new Date().toISOString();
  manifest.status = 'Approved & Dispatched';
  manifest.isLocked = true;
  manifest.dispatchedAt = now;
  manifest.approvedAt = now;
  manifest.dispatchedBy = approvedBy || 'Authorized Branch Officer';
  manifest.approvedBy = approvedBy || 'HQ Operations Controller';

  let updatedCount = 0;
  // Update every shipment in this manifest to 'Shipment Dispatched'
  manifest.items.forEach(item => {
    item.status = 'Shipment Dispatched';
    const note = `Manifest ${manifest.manifestNumber} verified & dispatched by ${manifest.approvedBy}. Transit via ${manifest.linehaulVehicle} to ${manifest.destinationHub}. Container Seal #${manifest.sealNumber}.`;
    updateShipmentStatus(item.bookingId, 'Shipment Dispatched', manifest.branchOrigin, note);
    updatedCount++;
  });

  saveBranchManifest(manifest);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('manifest-updated'));
    window.dispatchEvent(new Event('shipments-updated'));
    window.dispatchEvent(new Event('storage'));
  }

  return { success: true, manifest, updatedCount };
}

/**
 * Searches for a shipment by booking number / AWB ID.
 */
export function lookupShipmentForManifest(bookingId: string): Shipment | null {
  if (!bookingId || !bookingId.trim()) return null;
  const cleanId = bookingId.trim().toUpperCase();
  const shipments = getShipments();
  const found = shipments.find(s => s.id.toUpperCase() === cleanId || s.telemetry?.waybillNumber?.toUpperCase() === cleanId || s.bookingNo?.toUpperCase() === cleanId);
  return found || null;
}

export function resetBranchManifests(): BranchManifest[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANIFESTS_STORAGE_KEY, JSON.stringify(DEFAULT_BRANCH_MANIFESTS));
    localStorage.removeItem('double7_branch_manifests_v1');
    window.dispatchEvent(new Event('manifest-updated'));
  }
  return DEFAULT_BRANCH_MANIFESTS;
}
