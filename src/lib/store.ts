export interface Checkpoint {
  id: string;
  timestamp: string;
  status: 'Order Placed' | 'Picked Up' | 'Hub Received' | 'Export Cleared' | 'In Flight' | 'At Sea' | 'In Transit' | 'Import Cleared' | 'Customs Cleared' | 'Out for Delivery' | 'Delivered' | 'Delayed';
  location: string;
  description: string;
  isCompleted: boolean;
}

export interface Shipment {
  id: string;
  service: string;
  serviceCode: 'EXP' | 'CARGO' | 'RUSH' | 'INTL' | 'AIR' | 'SEA' | 'FUL';
  isInternational?: boolean;
  status: 'In Transit' | 'Out for Delivery' | 'Customs Cleared' | 'Delivered' | 'Pending Pickup' | 'Exception';
  origin: {
    city: string;
    province?: string;
    country?: string;
    hub: string;
  };
  destination: {
    city: string;
    province?: string;
    country?: string;
    hub: string;
    areaCode?: string;
    postalCode?: string;
  };
  sender: {
    name: string;
    company: string;
    phone: string;
  };
  recipient: {
    name: string;
    company: string;
    address: string;
    phone: string;
  };
  cargo: {
    pieces: number;
    weightKg: number;
    volumeCbm?: number;
    description: string;
    declaredValueNpr?: number;
    declaredValueUsd?: number;
    hazardClass?: string;
  };
  telemetry: {
    transportVehicle?: string;
    flightVesselNumber?: string;
    waybillNumber?: string;
    airwayBill?: string;
    trackingRoute?: string;
    containerUnit?: string;
    estimatedArrival: string;
    temperatureCelsius?: number;
    currentSpeedKmh?: number;
  };
  checkpoints: Checkpoint[];
  proofOfDelivery?: {
    deliveredAt: string;
    receivedBy: string;
    signatureText: string;
  };
  codAmount?: number;
  serviceType?: string;
  assignedVehicle?: string;
}

export const INITIAL_SHIPMENTS: Shipment[] = [];

const STORAGE_KEY = 'double7_shipments_v1';

export function getShipments(): Shipment[] {
  if (typeof window === 'undefined') return INITIAL_SHIPMENTS;
  try {
    // Purge legacy storage versions
    localStorage.removeItem('double11_shipments_nepal_v1');
    localStorage.removeItem('double11_shipments_v2');
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('double11_shipments_v3');
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHIPMENTS));
      return INITIAL_SHIPMENTS;
    }
    return JSON.parse(saved);
  } catch {
    return INITIAL_SHIPMENTS;
  }
}

export async function fetchD1Tracking(trackingNumber: string): Promise<any | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`/api/track?id=${encodeURIComponent(trackingNumber.trim())}`);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.found && data.consignment) {
        return data.consignment;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchD1Status(): Promise<any | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/db-status');
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeD1Shipment(raw: any): Shipment {
  let details: any = {};
  if (typeof raw.raw_details === 'string') {
    try {
      details = JSON.parse(raw.raw_details);
    } catch {
      details = {};
    }
  } else if (raw.raw_details && typeof raw.raw_details === 'object') {
    details = raw.raw_details;
  }

  const rawStatus = (raw.status || '').toLowerCase();
  let status: Shipment['status'] = 'In Transit';
  if (rawStatus.includes('deliver') || rawStatus === 'completed') {
    status = 'Delivered';
  } else if (rawStatus.includes('out') || rawStatus.includes('courier')) {
    status = 'Out for Delivery';
  } else if (rawStatus.includes('custom') || rawStatus.includes('cleared')) {
    status = 'Customs Cleared';
  } else if (rawStatus.includes('pending') || rawStatus.includes('pickup')) {
    status = 'Pending Pickup';
  }

  const destCity = details.destination_city || details.city || 'Pokhara';

  return {
    id: raw.tracking_number || details.number || `D7-D1-${raw.id}`,
    service: 'Double 7 Nepal Express',
    serviceCode: 'EXP',
    status: status,
    origin: {
      city: 'Kathmandu',
      hub: 'Kathmandu Mega-Hub (KTM-01)'
    },
    destination: {
      city: destCity,
      hub: `${destCity} Regional Hub`
    },
    sender: {
      name: 'Central Merchant Dispatch',
      company: 'Double 7 Logistics Command HQ',
      phone: '+977 1 4411000'
    },
    recipient: {
      name: raw.consignee_name || details.consignee_name || 'Verified Consignee',
      company: details.consignee_company || '',
      address: details.destination_address || `${destCity} Main Road, Ward 4`,
      phone: raw.consignee_contact || details.consignee_contact || '+977 98000 00000'
    },
    cargo: {
      pieces: Number(details.pieces || 1),
      weightKg: Number(details.weight || details.weightKg || 2.5),
      description: details.contents || details.description || 'Commercial Merchandise Parcel',
      declaredValueNpr: Number(details.declared_value || 4500)
    },
    telemetry: {
      transportVehicle: 'BA 2 KHA 8841 (Express E-Van)',
      estimatedArrival: 'Guaranteed 24H SLA',
      trackingRoute: 'Kathmandu Mega-Hub -> Prithvi Highway -> Regional Hub'
    },
    checkpoints: [
      {
        id: `cp-${raw.id || '1'}`,
        timestamp: raw.created_at || '2026-08-27 06:00',
        status: status === 'Delivered' ? 'Delivered' : 'In Transit',
        location: `${destCity} Regional Hub`,
        description: raw.latest_event || 'Consignment verified in Cloudflare D1 tracking database',
        isCompleted: true
      }
    ]
  };
}

export async function getAllCombinedBookings(): Promise<Shipment[]> {
  const localShipments = getShipments();
  if (typeof window === 'undefined') return localShipments;

  try {
    const res = await fetch('/api/shipments');
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.success && Array.isArray(data.shipments)) {
        const remoteShipments = data.shipments.map(normalizeD1Shipment);
        const seenIds = new Set(localShipments.map(s => s.id.toUpperCase()));
        const combined = [...localShipments];
        for (const remote of remoteShipments) {
          if (!seenIds.has(remote.id.toUpperCase())) {
            combined.push(remote);
            seenIds.add(remote.id.toUpperCase());
          }
        }
        return combined;
      }
    }
  } catch (err) {
    console.error('Error fetching combined shipments:', err);
  }
  return localShipments;
}

export function getShipmentById(id: string): Shipment | undefined {
  const shipments = getShipments();
  const cleanId = id.trim().toUpperCase();
  return shipments.find(s => s.id.toUpperCase() === cleanId);
}

export function createShipment(data: Partial<Shipment>): Shipment {
  const current = getShipments();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const code = data.serviceCode || 'EXP';
  const newId = `D7-${randomNum}-${code}`;

  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newShipment: Shipment = {
    id: newId,
    service: data.service || 'Double 7 Nepal Express',
    serviceCode: code,
    status: 'Pending Pickup',
    origin: data.origin || { city: 'Kathmandu', province: 'Bagmati Province', hub: 'Kathmandu Central Hub' },
    destination: data.destination || { city: 'Pokhara', province: 'Gandaki Province', hub: 'Pokhara Regional Hub', areaCode: '33700' },
    sender: data.sender || { name: 'Verified Merchant', company: 'Nepal Business', phone: '+977 98000 00000' },
    recipient: data.recipient || { name: 'Customer Receiver', company: 'Personal', address: 'City Road', phone: '+977 98000 00000' },
    cargo: data.cargo || { pieces: 1, weightKg: 2.0, volumeCbm: 0.01, description: 'E-Commerce Consignment', declaredValueNpr: 5000 },
    telemetry: {
      transportVehicle: 'D7 Swift Electric Dispatch Unit',
      waybillNumber: `AWB-D7-NP-${randomNum}`,
      trackingRoute: `${data.origin?.city || 'Kathmandu'} to ${data.destination?.city || 'Pokhara'} Express Corridor`,
      estimatedArrival: 'Next Business Day (by 17:00 NPT)',
      temperatureCelsius: 21.5,
    },
    checkpoints: [
      {
        id: `cp-${Date.now()}`,
        timestamp: `${now}`,
        status: 'Order Placed',
        location: `${data.origin?.city || 'Kathmandu'} Dispatch Center`,
        description: 'Consignment confirmed online. Digital waybill issued. Rider assigned for collection.',
        isCompleted: true,
      },
    ],
  };

  const updated = [newShipment, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newShipment;
}

export function updateShipmentStatus(
  id: string,
  newStatus: Shipment['status'],
  location: string,
  note: string
): Shipment | null {
  const current = getShipments();
  const index = current.findIndex(s => s.id.toUpperCase() === id.toUpperCase());
  if (index === -1) return null;

  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedShipment = { ...current[index] };
  updatedShipment.status = newStatus;

  let checkpointStatus: Checkpoint['status'] = 'Hub Received';
  if (newStatus === 'Out for Delivery') checkpointStatus = 'Out for Delivery';
  else if (newStatus === 'Delivered') {
    checkpointStatus = 'Delivered';
    updatedShipment.proofOfDelivery = {
      deliveredAt: now,
      receivedBy: `${updatedShipment.recipient.name} (Direct Signature)`,
      signatureText: `${updatedShipment.recipient.name} - Electronic POD Handheld`,
    };
  } else if (newStatus === 'Customs Cleared') checkpointStatus = 'Import Cleared';
  else if (newStatus === 'In Transit') checkpointStatus = 'In Transit';

  const newCheckpoint: Checkpoint = {
    id: `cp-${Date.now()}`,
    timestamp: now,
    status: checkpointStatus,
    location: location || updatedShipment.destination.city,
    description: note || `Shipment status updated to: ${newStatus}`,
    isCompleted: true,
  };

  updatedShipment.checkpoints = [newCheckpoint, ...updatedShipment.checkpoints];
  current[index] = updatedShipment;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }

  return updatedShipment;
}

export function deleteShipment(id: string): boolean {
  const current = getShipments();
  const filtered = current.filter(s => s.id.toUpperCase() !== id.toUpperCase());
  if (filtered.length === current.length) return false;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  return true;
}

export function assignShipmentVehicle(id: string, vehicle: string, route?: string): boolean {
  const current = getShipments();
  const index = current.findIndex(s => s.id.toUpperCase() === id.toUpperCase());
  if (index === -1) return false;

  current[index].telemetry.transportVehicle = vehicle;
  if (route) current[index].telemetry.trackingRoute = route;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
  return true;
}

export function addCustomCheckpoint(
  id: string,
  data: { status: Checkpoint['status']; location: string; description: string }
): boolean {
  const current = getShipments();
  const index = current.findIndex(s => s.id.toUpperCase() === id.toUpperCase());
  if (index === -1) return false;

  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newCheckpoint: Checkpoint = {
    id: `cp-adm-${Date.now()}`,
    timestamp: now,
    status: data.status,
    location: data.location,
    description: data.description,
    isCompleted: true,
  };

  current[index].checkpoints = [newCheckpoint, ...current[index].checkpoints];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
  return true;
}

const WAITLIST_STORAGE_KEY = 'double7_intl_waitlist_v1';
const DEFAULT_WAITLIST = [
  'apex.export@nepaltrading.com',
  'himalayan.cashmere@crafts.np',
  'tea.organic@ilamestate.com'
];

export function getWaitlistSubscribers(): string[] {
  if (typeof window === 'undefined') return DEFAULT_WAITLIST;
  try {
    const raw = localStorage.getItem(WAITLIST_STORAGE_KEY) || localStorage.getItem('double11_intl_waitlist_v1');
    if (!raw) {
      localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(DEFAULT_WAITLIST));
      return DEFAULT_WAITLIST;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_WAITLIST;
  }
}

export function addWaitlistSubscriber(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const current = getWaitlistSubscribers();
  const clean = email.trim().toLowerCase();
  if (current.includes(clean)) return true;

  const updated = [clean, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(updated));
  }
  return true;
}

export interface QuoteRequest {
  originCity: string;
  destCity: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  isInternational?: boolean;
}

export interface DomesticRateOption {
  serviceName: string;
  serviceCode: 'EXP' | 'CARGO' | 'RUSH' | 'INTL';
  transitDays: string;
  estimatedCostNpr: number;
  isComingSoon?: boolean;
  carrierType: string;
  features: string[];
  recommended?: boolean;
}

export function calculateDomesticFreightRate(params: QuoteRequest): DomesticRateOption[] {
  const volumetricWeight = (params.lengthCm * params.widthCm * params.heightCm) / 5000;
  const chargeableWeight = Math.max(params.weightKg, volumetricWeight, 1);

  // Valley vs Outstation calculation
  const isValley =
    (params.originCity === 'Kathmandu' || params.originCity === 'Lalitpur' || params.originCity === 'Bhaktapur') &&
    (params.destCity === 'Kathmandu' || params.destCity === 'Lalitpur' || params.destCity === 'Bhaktapur');

  const baseExpress = isValley ? 120 + (chargeableWeight - 1) * 40 : 220 + (chargeableWeight - 1) * 70;
  const baseCargo = isValley ? 90 + chargeableWeight * 25 : 160 + chargeableWeight * 45;
  const baseRush = isValley ? 250 + (chargeableWeight - 1) * 50 : 390 + (chargeableWeight - 1) * 90;

  return [
    {
      serviceName: 'Double 7 Nepal Express',
      serviceCode: 'EXP',
      transitDays: isValley ? 'Same-Day (within 6 hrs)' : 'Next-Day (24 hrs Guaranteed)',
      estimatedCostNpr: Math.round(baseExpress),
      carrierType: 'Dedicated High-Speed Electric Fleet & Highway Linehaul',
      features: ['Real-time GPS rider tracking', 'Free Doorstep Pickup', '100% On-Time SLA Guarantee', 'Automated SMS alerts to recipient'],
      recommended: true,
    },
    {
      serviceName: 'Nationwide Hub Cargo',
      serviceCode: 'CARGO',
      transitDays: '2 - 3 Days Nationwide (All 7 Provinces)',
      estimatedCostNpr: Math.round(baseCargo),
      carrierType: 'Inter-Provincial Heavy Freight Network',
      features: ['Best for bulk parcels & B2B stock', 'Secure warehouse buffering', 'Full waybill tracking across all 77 districts'],
    },
    {
      serviceName: 'Same-Day Valley Rush',
      serviceCode: 'RUSH',
      transitDays: 'Under 3 Hours (Kathmandu, Lalitpur, Bhaktapur)',
      estimatedCostNpr: Math.round(baseRush),
      carrierType: 'Instant Dedicated Electric Two-Wheeler / Van Fleet',
      features: ['Direct point-to-point courier', 'Urgent medical, documents & food orders', 'Instant digital POD with photo'],
    },
    {
      serviceName: 'International Cross-Border Cargo',
      serviceCode: 'INTL',
      transitDays: 'Coming Soon (Launching Q4 2026)',
      estimatedCostNpr: 0,
      isComingSoon: true,
      carrierType: 'Tribhuvan Airport (TIA) Direct Cargo Flights to Global Hubs',
      features: ['Export customs pre-clearance with Nepal Customs', 'Direct connections to India, China, UAE & US/EU', 'Register your business for early access'],
    },
  ];
}
