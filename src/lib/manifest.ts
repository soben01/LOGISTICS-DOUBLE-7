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

const MANIFESTS_STORAGE_KEY = 'double7_branch_manifests_v1';

export const DEFAULT_BRANCH_MANIFESTS: BranchManifest[] = [
  {
    id: 'MNF-KTM-2026-0910-001',
    manifestNumber: 'MNF-KTM-0910-001',
    branchOrigin: 'Kathmandu Mega-Hub (KTM-01)',
    branchCode: 'KTM-01',
    destinationHub: 'Pokhara Regional Sort Hub (Gandaki)',
    destinationCity: 'Pokhara',
    linehaulVehicle: 'BA 2 KHA 8841 (Express E-Van)',
    driverName: 'Bhimsen Thapa',
    driverPhone: '+977 98510 11223',
    sealNumber: 'SL-88190',
    items: [
      {
        bookingId: 'D7-8821-EXP',
        consigneeName: 'Suresh Shrestha',
        consigneePhone: '+977 9846012345',
        destinationCity: 'Pokhara',
        destinationHub: 'Pokhara Regional Sort Hub (Gandaki)',
        pieces: 2,
        weightKg: 4.5,
        service: 'Double 7 Nepal Express',
        serviceCode: 'EXP',
        codAmount: 4500,
        status: 'Shipment Dispatched',
        addedAt: '2026-09-10 10:45 NPT',
      },
      {
        bookingId: 'D7-6042-CARGO',
        consigneeName: 'Bijay Shrestha',
        consigneePhone: '+977 9801045678',
        destinationCity: 'Pokhara',
        destinationHub: 'Pokhara Regional Sort Hub (Gandaki)',
        pieces: 6,
        weightKg: 28.5,
        service: 'Double 7 Heavy Cargo',
        serviceCode: 'CARGO',
        codAmount: 12800,
        status: 'Shipment Dispatched',
        addedAt: '2026-09-10 11:15 NPT',
      }
    ],
    totalShipments: 2,
    totalPieces: 8,
    totalWeightKg: 33.0,
    totalCodNpr: 17300,
    status: 'Approved & Dispatched',
    createdAt: '2026-09-10T11:00:00Z',
    generatedAt: '2026-09-10T11:30:00Z',
    printedAt: '2026-09-10T11:40:00Z',
    dispatchedAt: '2026-09-10T12:00:00Z',
    dispatchedBy: 'Soben Upreti (Command HQ)',
    notes: 'Prithvi Highway corridor linehaul dispatched on time with zero seal tampering.'
  },
  {
    id: 'MNF-KTM-2026-0910-002',
    manifestNumber: 'MNF-KTM-0910-002',
    branchOrigin: 'Kathmandu Mega-Hub (KTM-01)',
    branchCode: 'KTM-01',
    destinationHub: 'Biratnagar Hub (Koshi Eastern Corridor)',
    destinationCity: 'Biratnagar',
    linehaulVehicle: 'NA 6 KHA 2109 (Linehaul Truck)',
    driverName: 'Ram Kumar Mandal',
    driverPhone: '+977 98040 22334',
    sealNumber: 'SL-99241',
    items: [
      {
        bookingId: 'D7-7730-EXP',
        consigneeName: 'Dipendra Chaudhari',
        consigneePhone: '+977 9804056789',
        destinationCity: 'Biratnagar',
        destinationHub: 'Biratnagar Hub (Koshi Eastern Corridor)',
        pieces: 4,
        weightKg: 12.0,
        service: 'Double 7 Nepal Express',
        serviceCode: 'EXP',
        codAmount: 0,
        status: 'Delivered',
        addedAt: '2026-09-09 14:00 NPT',
      }
    ],
    totalShipments: 1,
    totalPieces: 4,
    totalWeightKg: 12.0,
    totalCodNpr: 0,
    status: 'Approved & Dispatched',
    createdAt: '2026-09-09T14:30:00Z',
    generatedAt: '2026-09-09T14:45:00Z',
    printedAt: '2026-09-09T14:50:00Z',
    dispatchedAt: '2026-09-09T15:00:00Z',
    dispatchedBy: 'Kathmandu Hub Dispatch Officer',
    notes: 'BP Highway linehaul trunk movement completed.'
  }
];

export function getBranchManifests(branchCode?: string): BranchManifest[] {
  if (typeof window === 'undefined') return DEFAULT_BRANCH_MANIFESTS;
  try {
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
