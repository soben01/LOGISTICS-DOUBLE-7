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

export type ManifestStatus = 'Draft' | 'Generated' | 'Printed' | 'Approved & Dispatched';

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
  createdAt: string;
  generatedAt?: string;
  printedAt?: string;
  dispatchedAt?: string;
  dispatchedBy?: string;
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
    status: 'Generated',
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
  manifest.status = manifest.status === 'Approved & Dispatched' ? 'Approved & Dispatched' : 'Printed';
  manifest.printedAt = new Date().toISOString();
  saveBranchManifest(manifest);
  return manifest;
}

/**
 * Approves and dispatches the manifest, updating ALL included shipments to "Shipment Dispatched".
 */
export function approveAndDispatchManifest(
  manifestId: string,
  dispatchedBy?: string
): { success: boolean; manifest?: BranchManifest; updatedCount: number; error?: string } {
  const manifest = getManifestById(manifestId);
  if (!manifest) {
    return { success: false, updatedCount: 0, error: 'Manifest not found.' };
  }

  if (manifest.items.length === 0) {
    return { success: false, updatedCount: 0, error: 'Cannot dispatch an empty manifest.' };
  }

  const now = new Date().toISOString();
  manifest.status = 'Approved & Dispatched';
  manifest.dispatchedAt = now;
  manifest.dispatchedBy = dispatchedBy || 'Authorized Branch Dispatcher';

  let updatedCount = 0;
  // Update every shipment in this manifest to 'Shipment Dispatched'
  manifest.items.forEach(item => {
    item.status = 'Shipment Dispatched';
    const note = `Manifest ${manifest.manifestNumber} approved & dispatched. Transit via ${manifest.linehaulVehicle} to ${manifest.destinationHub}. Security Seal #${manifest.sealNumber}.`;
    updateShipmentStatus(item.bookingId, 'Shipment Dispatched', manifest.branchOrigin, note);
    updatedCount++;
  });

  saveBranchManifest(manifest);
  if (typeof window !== 'undefined') {
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
  const found = shipments.find(s => s.id.toUpperCase() === cleanId || s.telemetry.waybillNumber?.toUpperCase() === cleanId);
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
