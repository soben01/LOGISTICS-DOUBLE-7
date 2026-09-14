export interface Checkpoint {
  id: string;
  timestamp: string;
  status: 'Order Placed' | 'Label Generated' | 'Courier Assigned' | 'Origin Hub Inwarded' | 'Shipment Dispatched' | 'Picked Up' | 'Hub Received' | 'Export Cleared' | 'In Flight' | 'At Sea' | 'In Transit' | 'Import Cleared' | 'Customs Cleared' | 'Regional Sort Complete' | 'Out for Delivery' | 'Delivered' | 'Delayed';
  location: string;
  description: string;
  isCompleted: boolean;
}

export interface Shipment {
  id: string;
  bookingNo?: string;
  trackingNo?: string;
  parcelNo?: string;
  merchant?: string;
  remarks?: string;
  consignee?: string;
  service: string;
  serviceCode: 'EXP' | 'CARGO' | 'RUSH' | 'INTL' | 'AIR' | 'SEA' | 'FUL';
  isInternational?: boolean;
  status: 'In Transit' | 'Out for Delivery' | 'Customs Cleared' | 'Delivered' | 'Pending Pickup' | 'Exception' | 'Label Generated' | 'Shipment Dispatched' | 'Origin Hub Inwarded' | 'Hub Received' | 'Courier Assigned' | 'Regional Sort Complete' | 'Order Placed' | 'Reattempt Scheduled' | 'Return Initiated' | 'Returned to Merchant' | 'Booked' | 'Picked Up' | 'Customs' | 'Returned';
  deliveryAttempts?: number;
  origin: {
    city: string;
    province?: string;
    country?: string;
    hub: string;
  };
  destination: {
    city: string;
    province?: string;
    state?: string;
    country?: string;
    hub: string;
    areaCode?: string;
    postalCode?: string;
  };
  sender: {
    name: string;
    company: string;
    phone: string;
    email?: string;
  };
  recipient: {
    name: string;
    company: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone: string;
    email?: string;
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
    assignedVehicle?: string;
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
  deliveryOtp?: string;
  assignedRider?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
  };
  ndrReason?: string;
  ndrNotes?: string;
  podSignature?: string;
  podPhotoUrl?: string;
}

export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'D7-8821-EXP',
    bookingNo: 'D7-8821-EXP',
    trackingNo: 'D7-8821-EXP',
    parcelNo: 'PCL-KTM-8821',
    merchant: 'Double 7 Direct Flagship',
    service: 'Double 7 Valley Express',
    serviceCode: 'EXP',
    status: 'Out for Delivery',
    deliveryAttempts: 0,
    deliveryOtp: '482913',
    assignedRider: {
      id: 'rider-ktm-01',
      name: 'Ramesh Thapa',
      phone: '+977 98412 34567',
      vehicle: 'Honda CB Shine (BA 2 PA 4521)',
    },
    origin: {
      city: 'Kathmandu',
      province: 'Bagmati Province',
      country: 'Nepal',
      hub: 'Kathmandu Mega-Hub (KTM-01)',
    },
    destination: {
      city: 'Kathmandu',
      province: 'Bagmati Province',
      country: 'Nepal',
      hub: 'Kathmandu Mega-Hub (KTM-01)',
      areaCode: '44600',
    },
    sender: {
      name: 'Central Warehouse Dispatch',
      company: 'Double 7 Logistics Hub',
      phone: '+977 1 4411000',
    },
    recipient: {
      name: 'John Doe',
      company: 'Personal Consignee',
      address: 'Thamel Chowk, Street 4, Near Garden of Dreams',
      city: 'Kathmandu',
      phone: '+977 98412 88210',
    },
    cargo: {
      pieces: 1,
      weightKg: 3.0,
      description: 'Electronics & Audio Equipment Box',
      declaredValueNpr: 4500,
    },
    codAmount: 4500,
    telemetry: {
      transportVehicle: 'BA 2 PA 4521 (Rider Courier Express)',
      estimatedArrival: 'Today by 14:00 NPT',
      trackingRoute: 'Kathmandu Mega-Hub -> Thamel Delivery Corridor',
    },
    checkpoints: [
      {
        id: 'cp-8821-3',
        timestamp: '2026-09-14 09:15',
        status: 'Out for Delivery',
        location: 'Kathmandu Delivery Zone',
        description: 'Out for final doorstep delivery with Rider Ramesh Thapa. Delivery OTP dispatched to customer.',
        isCompleted: true,
      },
      {
        id: 'cp-8821-2',
        timestamp: '2026-09-14 07:30',
        status: 'Regional Sort Complete',
        location: 'Kathmandu Mega-Hub (KTM-01)',
        description: 'Consignment sorted into Route Zone 1 (Thamel / Central). Handed over to rider run-sheet.',
        isCompleted: true,
      },
      {
        id: 'cp-8821-1',
        timestamp: '2026-09-13 18:00',
        status: 'Origin Hub Inwarded',
        location: 'Kathmandu Mega-Hub (KTM-01)',
        description: 'Shipment received from merchant and scanned into warehouse inventory.',
        isCompleted: true,
      },
    ],
  },
  {
    id: 'D7-3490-EXP',
    bookingNo: 'D7-3490-EXP',
    trackingNo: 'D7-3490-EXP',
    parcelNo: 'PCL-KTM-3490',
    merchant: 'Himalayan Apparel Ltd',
    service: 'Double 7 Valley Express',
    serviceCode: 'EXP',
    status: 'Out for Delivery',
    deliveryAttempts: 0,
    deliveryOtp: '719402',
    assignedRider: {
      id: 'rider-ktm-01',
      name: 'Ramesh Thapa',
      phone: '+977 98412 34567',
      vehicle: 'Honda CB Shine (BA 2 PA 4521)',
    },
    origin: {
      city: 'Kathmandu',
      hub: 'Kathmandu Mega-Hub (KTM-01)',
    },
    destination: {
      city: 'Kathmandu',
      hub: 'Kathmandu Mega-Hub (KTM-01)',
      areaCode: '44600',
    },
    sender: {
      name: 'Himalayan Apparel Store',
      company: 'Himalayan Apparel Ltd',
      phone: '+977 1 4230000',
    },
    recipient: {
      name: 'Anita Shrestha',
      company: 'Personal',
      address: 'Baluwatar, Prime Minister Quarter Road, House 12',
      city: 'Kathmandu',
      phone: '+977 98510 34900',
    },
    cargo: {
      pieces: 2,
      weightKg: 1.8,
      description: 'Handcrafted Woolen Garments & Pashmina Shawl',
      declaredValueNpr: 2800,
    },
    codAmount: 2800,
    telemetry: {
      transportVehicle: 'BA 2 PA 4521 (Rider Courier Express)',
      estimatedArrival: 'Today by 15:30 NPT',
    },
    checkpoints: [
      {
        id: 'cp-3490-2',
        timestamp: '2026-09-14 09:45',
        status: 'Out for Delivery',
        location: 'Kathmandu Central Delivery Zone',
        description: 'Assigned to Rider Ramesh Thapa for same-day delivery.',
        isCompleted: true,
      },
      {
        id: 'cp-3490-1',
        timestamp: '2026-09-13 17:30',
        status: 'Order Placed',
        location: 'Baluwatar Booking Point',
        description: 'Booking confirmed online by merchant.',
        isCompleted: true,
      },
    ],
  },
  {
    id: 'D7-5120-RUSH',
    bookingNo: 'D7-5120-RUSH',
    trackingNo: 'D7-5120-RUSH',
    parcelNo: 'PCL-LAL-5120',
    merchant: 'Kathmandu Tech Hub',
    service: 'Direct Same-Day Express',
    serviceCode: 'RUSH',
    status: 'Out for Delivery',
    deliveryAttempts: 0,
    deliveryOtp: '552109',
    assignedRider: {
      id: 'rider-ktm-02',
      name: 'Bikash Tamang',
      phone: '+977 98510 98765',
      vehicle: 'Super Soco CPx Electric (BA 1 JA 7722)',
    },
    origin: {
      city: 'Kathmandu',
      hub: 'Kathmandu Mega-Hub (KTM-01)',
    },
    destination: {
      city: 'Lalitpur',
      hub: 'Kathmandu Mega-Hub (KTM-01)',
      areaCode: '44700',
    },
    sender: {
      name: 'Tech Hub Dispatch',
      company: 'Kathmandu Tech Hub',
      phone: '+977 1 5520000',
    },
    recipient: {
      name: 'Dr. Bikram Sen',
      company: 'Patan Hospital Campus',
      address: 'Lagankhel Main Road, Near Bus Park, Ward 5',
      city: 'Lalitpur',
      phone: '+977 98012 51200',
    },
    cargo: {
      pieces: 1,
      weightKg: 1.2,
      description: 'Precision Diagnostic Instruments',
      declaredValueNpr: 6200,
    },
    codAmount: 6200,
    telemetry: {
      transportVehicle: 'BA 1 JA 7722 (Electric Van Express)',
      estimatedArrival: 'Today by 13:00 NPT',
    },
    checkpoints: [
      {
        id: 'cp-5120-2',
        timestamp: '2026-09-14 09:20',
        status: 'Out for Delivery',
        location: 'Lalitpur / Patan Delivery Zone',
        description: 'Dispatched on electric courier van with Rider Bikash Tamang.',
        isCompleted: true,
      },
      {
        id: 'cp-5120-1',
        timestamp: '2026-09-14 07:00',
        status: 'Order Placed',
        location: 'Kathmandu Hub',
        description: 'Urgent priority dispatch scheduled.',
        isCompleted: true,
      },
    ],
  },
  {
    id: 'D7-9012-EXP',
    bookingNo: 'D7-9012-EXP',
    trackingNo: 'D7-9012-EXP',
    parcelNo: 'PCL-PKR-9012',
    merchant: 'Pokhara Organic Tea',
    service: 'Double 7 Regional Courier',
    serviceCode: 'EXP',
    status: 'Delivered',
    deliveryAttempts: 1,
    deliveryOtp: '384112',
    assignedRider: {
      id: 'rider-pkr-01',
      name: 'Suresh Shrestha',
      phone: '+977 98031 22334',
      vehicle: 'Bajaj Pulsar (GA 1 PA 8812)',
    },
    origin: {
      city: 'Kathmandu',
      hub: 'Kathmandu Mega-Hub (KTM-01)',
    },
    destination: {
      city: 'Pokhara',
      hub: 'Pokhara Regional Sort Hub (PKR-01)',
      areaCode: '33700',
    },
    sender: {
      name: 'Nepal Organic Tea Co',
      company: 'Pokhara Organic Tea',
      phone: '+977 61 520000',
    },
    recipient: {
      name: 'Rajesh Basnet',
      company: 'Personal',
      address: 'Lakeside Ward 6, Near Barahi Temple',
      city: 'Pokhara',
      phone: '+977 98031 90120',
    },
    cargo: {
      pieces: 1,
      weightKg: 2.5,
      description: 'Specialty Tea & Honey Gift Basket',
      declaredValueNpr: 1450,
    },
    codAmount: 1450,
    proofOfDelivery: {
      deliveredAt: '2026-09-14 08:45',
      receivedBy: 'Rajesh Basnet (Self - OTP 384112 Verified)',
      signatureText: 'Rajesh Basnet - Mobile OTP Digital Confirmation',
    },
    telemetry: {
      transportVehicle: 'GA 1 PA 8812',
      estimatedArrival: 'Delivered',
    },
    checkpoints: [
      {
        id: 'cp-9012-3',
        timestamp: '2026-09-14 08:45',
        status: 'Delivered',
        location: 'Pokhara Lakeside',
        description: 'Successfully handed over to recipient. COD collected: NPR 1,450. Verified via Customer OTP.',
        isCompleted: true,
      },
      {
        id: 'cp-9012-2',
        timestamp: '2026-09-14 07:15',
        status: 'Out for Delivery',
        location: 'Pokhara Regional Sort Hub (PKR-01)',
        description: 'Assigned to Rider Suresh Shrestha for Lakeside delivery.',
        isCompleted: true,
      },
      {
        id: 'cp-9012-1',
        timestamp: '2026-09-13 22:00',
        status: 'Hub Received',
        location: 'Pokhara Regional Sort Hub (PKR-01)',
        description: 'Linehaul vehicle BA 2 KHA 8841 arrived from Kathmandu Hub.',
        isCompleted: true,
      },
    ],
  },
  {
    id: 'D7-6641-EXP',
    bookingNo: 'D7-6641-EXP',
    trackingNo: 'D7-6641-EXP',
    parcelNo: 'PCL-KTM-6641',
    merchant: 'Double 7 Direct Flagship',
    service: 'Double 7 Valley Express',
    serviceCode: 'EXP',
    status: 'Exception',
    deliveryAttempts: 1,
    deliveryOtp: '620184',
    ndrReason: 'Customer Rescheduled',
    ndrNotes: 'Customer requested evening reattempt after 18:00 due to office meeting.',
    assignedRider: {
      id: 'rider-ktm-01',
      name: 'Ramesh Thapa',
      phone: '+977 98412 34567',
      vehicle: 'Honda CB Shine (BA 2 PA 4521)',
    },
    origin: {
      city: 'Kathmandu',
      hub: 'Kathmandu Mega-Hub (KTM-01)',
    },
    destination: {
      city: 'Kathmandu',
      hub: 'Kathmandu Mega-Hub (KTM-01)',
      areaCode: '44600',
    },
    sender: {
      name: 'Double 7 Merchant Store',
      company: 'Double 7 Retail',
      phone: '+977 1 4411000',
    },
    recipient: {
      name: 'Pradeep Sharma',
      company: 'Apex Trading Corp',
      address: 'New Road, Khichapokhari Complex 2nd Floor',
      city: 'Kathmandu',
      phone: '+977 98419 66410',
    },
    cargo: {
      pieces: 1,
      weightKg: 2.2,
      description: 'Leather Bags & Accessories',
      declaredValueNpr: 3100,
    },
    codAmount: 3100,
    telemetry: {
      transportVehicle: 'BA 2 PA 4521',
      estimatedArrival: 'Reattempt Scheduled for 18:30 NPT',
    },
    checkpoints: [
      {
        id: 'cp-6641-3',
        timestamp: '2026-09-14 10:15',
        status: 'Delayed',
        location: 'New Road Delivery Beat',
        description: 'First delivery attempt NDR: Customer requested reattempt after 18:00.',
        isCompleted: true,
      },
      {
        id: 'cp-6641-2',
        timestamp: '2026-09-14 08:30',
        status: 'Out for Delivery',
        location: 'Kathmandu Central Beat',
        description: 'Out for delivery with Rider Ramesh Thapa.',
        isCompleted: true,
      },
      {
        id: 'cp-6641-1',
        timestamp: '2026-09-13 16:00',
        status: 'Origin Hub Inwarded',
        location: 'Kathmandu Mega-Hub (KTM-01)',
        description: 'Consignment booked and verified.',
        isCompleted: true,
      },
    ],
  },
];

const STORAGE_KEY = 'double7_shipments_prod_v2';

export function getShipments(): Shipment[] {
  if (typeof window === 'undefined') return INITIAL_SHIPMENTS;
  try {
    // Purge legacy storage versions
    localStorage.removeItem('double7_shipments_prod_v1');
    localStorage.removeItem('double7_shipments_v1');
    localStorage.removeItem('double11_shipments_nepal_v1');
    localStorage.removeItem('double11_shipments_v2');
    localStorage.removeItem('double11_shipments_v3');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHIPMENTS));
      return INITIAL_SHIPMENTS;
    }
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHIPMENTS));
      return INITIAL_SHIPMENTS;
    }
    return parsed;
  } catch {
    return INITIAL_SHIPMENTS;
  }
}

export function resetDemoShipments(): Shipment[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
  return [];
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
    bookingNo: raw.booking_no || details.booking_no || raw.tracking_number || details.number,
    trackingNo: raw.tracking_number || details.number,
    parcelNo: raw.parcel_no || details.parcel_no || '',
    merchant: raw.merchant || details.merchant || 'Double 7 Merchant',
    service: raw.service_type || 'Double 7 Nepal Express',
    serviceCode: 'EXP',
    status: status,
    remarks: raw.remarks || details.remarks || '',
    origin: {
      city: raw.origin || details.origin || 'Kathmandu',
      hub: 'Kathmandu Mega-Hub (KTM-01)'
    },
    destination: {
      city: raw.city || destCity,
      province: raw.province || details.province || '',
      state: raw.province || details.state || '',
      country: raw.country || details.country || 'Nepal',
      postalCode: raw.postal_code || details.postal_code || '',
      hub: `${destCity} Regional Hub`
    },
    sender: {
      name: raw.sender_name || raw.merchant || 'Central Merchant Dispatch',
      company: raw.merchant || 'Double 7 Logistics Command HQ',
      phone: '+977 1 4411000'
    },
    recipient: {
      name: raw.consignee_name || raw.recipient_name || details.consignee_name || 'Verified Consignee',
      company: details.consignee_company || '',
      address: raw.consignee_address || details.destination_address || `${destCity} Main Road`,
      city: raw.city || destCity,
      state: raw.province || details.state || '',
      country: raw.country || details.country || 'Nepal',
      postalCode: raw.postal_code || details.postal_code || '',
      phone: raw.consignee_phone || raw.consignee_contact || details.consignee_contact || '+977 98000 00000',
      email: raw.consignee_email || details.consignee_email || ''
    },
    cargo: {
      pieces: Number(raw.pieces || details.pieces || 1),
      weightKg: Number(raw.weight_kg || details.weight || details.weightKg || 2.5),
      description: raw.cargo_description || details.contents || details.description || 'Commercial Merchandise Parcel',
      declaredValueNpr: Number(raw.cod_amount || details.declared_value || 4500)
    },
    codAmount: Number(raw.cod_amount || 0),
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
  const cleanDigits = cleanId.replace(/\D/g, '');
  return shipments.find(s => {
    if (s.id.toUpperCase() === cleanId) return true;
    if (s.bookingNo && s.bookingNo.toUpperCase() === cleanId) return true;
    if (s.trackingNo && s.trackingNo.toUpperCase() === cleanId) return true;
    if (s.parcelNo && s.parcelNo.toUpperCase() === cleanId) return true;
    if (cleanDigits.length >= 6) {
      if (s.recipient?.phone && s.recipient.phone.replace(/\D/g, '').includes(cleanDigits)) return true;
      if (s.sender?.phone && s.sender.phone.replace(/\D/g, '').includes(cleanDigits)) return true;
    }
    return false;
  });
}

export async function bulkCreateShipments(items: Partial<Shipment>[]): Promise<{ added: number; skipped: number; shipments: Shipment[] }> {
  const current = getShipments();
  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const createdList: Shipment[] = [];
  let added = 0;
  let skipped = 0;

  for (const data of items) {
    const trackingId = (data.id || data.bookingNo || `D7-${Math.floor(1000 + Math.random() * 9000)}-${data.serviceCode || 'EXP'}`).trim();
    const code = data.serviceCode || 'EXP';
    const booking = (data.bookingNo || trackingId).trim();
    const parcel = (data.parcelNo || '').trim();

    const newShipment: Shipment = {
      id: trackingId,
      bookingNo: booking,
      trackingNo: trackingId,
      parcelNo: parcel,
      merchant: data.merchant || data.sender?.name || 'Double 7 Merchant',
      service: data.service || 'Double 7 Nepal Express',
      serviceCode: code,
      status: (data.status as any) || 'Booked',
      remarks: data.remarks || '',
      origin: data.origin || { city: 'Kathmandu', province: 'Bagmati Province', hub: 'Kathmandu Central Hub' },
      destination: data.destination || { city: 'Pokhara', province: 'Gandaki Province', hub: 'Pokhara Regional Hub' },
      sender: data.sender || { name: data.merchant || 'Verified Merchant', company: 'Nepal Business', phone: '+977 98000 00000' },
      recipient: data.recipient || { name: 'Customer Receiver', company: 'Personal', address: 'City Road', phone: '+977 98000 00000' },
      cargo: data.cargo || { pieces: 1, weightKg: 2.0, volumeCbm: 0.01, description: 'E-Commerce Consignment', declaredValueNpr: data.codAmount || 5000 },
      codAmount: data.codAmount || 0,
      telemetry: data.telemetry || {
        transportVehicle: 'D7 Swift Fleet Unit',
        waybillNumber: `AWB-D7-${trackingId}`,
        trackingRoute: `${data.origin?.city || 'Kathmandu'} to ${data.destination?.city || 'Pokhara'} Express Corridor`,
        estimatedArrival: 'Next Business Day (by 17:00 NPT)',
      },
      checkpoints: data.checkpoints && data.checkpoints.length > 0 ? data.checkpoints : [
        {
          id: `cp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
          status: (data.status as any) || 'Order Placed',
          location: `${data.origin?.city || 'Kathmandu'} Dispatch Center`,
          description: data.remarks || 'Consignment registered via bulk import. Digital waybill issued.',
          isCompleted: true,
        },
      ],
    };

    createdList.push(newShipment);
    added++;
  }

  // De-duplicate against current list by id and bookingNo
  const existingIds = new Set(current.map(s => s.id.toUpperCase()));
  const filteredNew = createdList.filter(s => !existingIds.has(s.id.toUpperCase()));
  const updated = [...filteredNew, ...current];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  // Asynchronously sync to Cloudflare D1
  if (typeof window !== 'undefined' && createdList.length > 0) {
    try {
      fetch('/api/shipments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipments: createdList }),
      }).catch(() => {});
    } catch {}
  }

  return { added: filteredNew.length, skipped: createdList.length - filteredNew.length, shipments: filteredNew };
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
  location?: string,
  note?: string
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
  if (newStatus === 'Label Generated') {
    checkpointStatus = 'Label Generated';
  } else if (newStatus === 'Shipment Dispatched') {
    checkpointStatus = 'Shipment Dispatched';
  } else if (newStatus === 'Origin Hub Inwarded') {
    checkpointStatus = 'Origin Hub Inwarded';
  } else if (newStatus === 'Courier Assigned') {
    checkpointStatus = 'Courier Assigned';
  } else if (newStatus === 'Regional Sort Complete') {
    checkpointStatus = 'Regional Sort Complete';
  } else if (newStatus === 'Out for Delivery') {
    checkpointStatus = 'Out for Delivery';
  } else if (newStatus === 'Delivered') {
    checkpointStatus = 'Delivered';
    updatedShipment.proofOfDelivery = {
      deliveredAt: now,
      receivedBy: `${updatedShipment.recipient.name} (Direct Signature)`,
      signatureText: `${updatedShipment.recipient.name} - Electronic POD Handheld`,
    };
  } else if (newStatus === 'Customs Cleared') checkpointStatus = 'Import Cleared';
  else if (newStatus === 'In Transit') checkpointStatus = 'In Transit';
  else if (newStatus === 'Order Placed') checkpointStatus = 'Order Placed';

  const newCheckpoint: Checkpoint = {
    id: `cp-${Date.now()}`,
    timestamp: now,
    status: checkpointStatus,
    location: location || updatedShipment.origin.hub || updatedShipment.destination.city,
    description: note || (newStatus === 'Label Generated' ? 'Shipping label generated and ready for hub dispatch' : `Shipment status updated to: ${newStatus}`),
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

const WAITLIST_STORAGE_KEY = 'double7_intl_waitlist_prod_v1';
const DEFAULT_WAITLIST: string[] = [];

export function getWaitlistSubscribers(): string[] {
  if (typeof window === 'undefined') return DEFAULT_WAITLIST;
  try {
    localStorage.removeItem('double7_intl_waitlist_v1');
    localStorage.removeItem('double11_intl_waitlist_v1');
    const raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
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
  const isBulk = (params.weightKg || 0) >= 10;
  const volumetricWeight = isBulk && params.lengthCm && params.widthCm && params.heightCm
    ? (params.lengthCm * params.widthCm * params.heightCm) / 5000
    : 0;
  const chargeableWeight = Math.max(params.weightKg, volumetricWeight, 1);

  // Valley vs Outstation calculation
  const isValley =
    (params.originCity === 'Kathmandu' || params.originCity === 'Lalitpur' || params.originCity === 'Bhaktapur') &&
    (params.destCity === 'Kathmandu' || params.destCity === 'Lalitpur' || params.destCity === 'Bhaktapur');

  const destLabel = params.destCity || 'Destination';
  const baseExpress = isValley ? 120 + (chargeableWeight - 1) * 40 : 220 + (chargeableWeight - 1) * 70;
  const baseCargo = isValley ? 90 + chargeableWeight * 25 : 160 + chargeableWeight * 45;
  const baseRush = isValley ? 250 + (chargeableWeight - 1) * 50 : 390 + (chargeableWeight - 1) * 85;

  if (isBulk) {
    // 10 KG+ Bulk Cargo / Heavy Freight Options
    return [
      {
        serviceName: `Nationwide Hub Cargo (${destLabel})`,
        serviceCode: 'CARGO',
        transitDays: isValley ? 'Next-Day Scheduled Bulk Dispatch' : '2 - 3 Days Nationwide Highway Linehaul',
        estimatedCostNpr: Math.round(baseCargo),
        carrierType: 'Heavy Commercial Linehaul & Cross-Dock Network',
        features: [
          'Discounted bulk rate (Rs. 45/kg vs Rs. 70/kg express)',
          'Hydraulic liftgate doorstep commercial pickup',
          'Automated IATA volumetric calculation standard',
          'Full digital manifest & multi-box master waybills'
        ],
        recommended: true,
      },
      {
        serviceName: `B2B Dedicated Pallet & Crate Linehaul`,
        serviceCode: 'EXP',
        transitDays: isValley ? 'Same-Day Bulk Transfer (within 8 hrs)' : `24 - 36 Hours Priority to ${destLabel}`,
        estimatedCostNpr: Math.round(baseExpress * 0.95), // 5% bulk express volume rebate
        carrierType: 'Dedicated High-Capacity Freight Fleet',
        features: [
          'Shrink-wrapped pallet & crate security strapping',
          'Forklift dock-to-dock cross-docking',
          'Priority cargo space allocation on scheduled trucks',
          'Dedicated account manager & direct dispatcher line'
        ],
      },
      {
        serviceName: isValley ? 'Valley Direct Van Charter' : `Full Truckload (FTL) Charter to ${destLabel}`,
        serviceCode: 'RUSH',
        transitDays: isValley ? 'Direct Point-to-Point (Under 4 Hours)' : `Direct Non-Stop Dispatch to ${destLabel}`,
        estimatedCostNpr: Math.round(baseRush * 1.15),
        carrierType: 'Exclusive Dedicated Fleet Vehicle (No Consignment Sharing)',
        features: [
          'Exclusive vehicle dispatched directly from your warehouse',
          'Zero transshipment risk / tamper-evident seals',
          'Live continuous GPS fleet tracking with geofencing',
          'Immediate instant digital POD upon offloading'
        ],
      },
      {
        serviceName: 'International Cross-Border Heavy Air Cargo',
        serviceCode: 'INTL',
        transitDays: 'Coming Soon (Launching Q4 2026)',
        estimatedCostNpr: 0,
        isComingSoon: true,
        carrierType: 'Tribhuvan Airport (TIA) Direct Cargo Flights to Global Hubs',
        features: [
          'Export customs pre-clearance with Nepal Customs',
          'Direct air links to India, China, UAE, USA & Europe',
          'Pre-register verified merchant account for bulk air tariffs'
        ],
      },
    ];
  }

  // < 10 KG Express Delivery Options for Selected Destination
  return [
    {
      serviceName: isValley ? 'Double 7 Valley Express' : `Double 7 ${destLabel} Express`,
      serviceCode: 'EXP',
      transitDays: isValley ? 'Same-Day (within 6 hrs)' : `Next-Day (24 hrs Guaranteed to ${destLabel})`,
      estimatedCostNpr: Math.round(baseExpress),
      carrierType: isValley ? 'Dedicated High-Speed Electric Fleet' : `Prithvi / East-West Highway Express Linehaul`,
      features: [
        'Real-time GPS rider tracking',
        'Free Doorstep Pickup',
        '100% On-Time SLA Guarantee',
        'Automated SMS alerts with live tracking link to recipient'
      ],
      recommended: true,
    },
    ...(isValley ? [
      {
        serviceName: 'Same-Day Valley Rush',
        serviceCode: 'RUSH' as const,
        transitDays: 'Under 3 Hours (Kathmandu, Lalitpur, Bhaktapur)',
        estimatedCostNpr: Math.round(baseRush),
        carrierType: 'Instant Dedicated Electric Two-Wheeler / Van Fleet',
        features: [
          'Direct point-to-point courier rider',
          'Urgent medical, documents & e-commerce orders',
          'Instant digital POD with consignee photo'
        ],
      }
    ] : [
      {
        serviceName: `Priority Highway Rush to ${destLabel}`,
        serviceCode: 'RUSH' as const,
        transitDays: `18 Hours Overnight Express Corridor`,
        estimatedCostNpr: Math.round(baseRush),
        carrierType: `Dedicated Overnight Express Linehaul to ${destLabel}`,
        features: [
          'Nightly 8:00 PM cutoff with guaranteed morning 9:00 AM delivery',
          'Direct terminal priority cross-docking',
          'Priority handling for time-sensitive commercial packages'
        ],
      }
    ]),
    {
      serviceName: `Standard Regional Courier (${destLabel})`,
      serviceCode: 'CARGO' as const,
      transitDays: isValley ? 'Next-Day Economy' : `24 - 48 Hours to ${destLabel}`,
      estimatedCostNpr: Math.round(baseCargo),
      carrierType: 'Standard National Distribution Fleet',
      features: [
        'Cost-effective economy parcel dispatch',
        'Full district hub tracking across Nepal',
        'Door-to-door delivery with OTP confirmation'
      ],
    },
    {
      serviceName: 'International Cross-Border Express',
      serviceCode: 'INTL' as const,
      transitDays: 'Coming Soon (Launching Q4 2026)',
      estimatedCostNpr: 0,
      isComingSoon: true,
      carrierType: 'Tribhuvan Airport (TIA) Direct Flights',
      features: [
        'Commercial document & parcel export clearance',
        'Direct connections to India, China, UAE & Western markets',
        'Register your business for early access'
      ],
    },
  ];
}

export function getRiderShipments(riderId?: string): Shipment[] {
  const list = getShipments();
  if (!riderId) return list;
  return list.filter(s => s.assignedRider?.id === riderId);
}

export function markOutForDelivery(id: string, riderName?: string): Shipment | null {
  const note = riderName ? `Out for delivery with Rider ${riderName}. Customer notified via SMS with secure OTP.` : 'Out for delivery to consignee address.';
  return updateShipmentStatus(id, 'Out for Delivery', undefined, note);
}

export function verifyDeliveryOtp(
  trackingId: string,
  otp: string,
  receivedBy: string,
  signatureText?: string,
  signatureDataUrl?: string,
  photoUrl?: string
): { success: boolean; message: string; shipment?: Shipment } {
  const current = getShipments();
  const index = current.findIndex(s => s.id.toUpperCase() === trackingId.toUpperCase());
  if (index === -1) {
    return { success: false, message: 'Shipment not found' };
  }

  const s = current[index];
  const cleanInputOtp = (otp || '').trim();
  const expectedOtp = (s.deliveryOtp || '482913').trim();

  // Allow bypass with special manager override code "777777" or exact OTP
  if (cleanInputOtp !== expectedOtp && cleanInputOtp !== '777777') {
    return { success: false, message: `Invalid Delivery OTP. Expected 6-digit code sent to ${s.recipient.phone}.` };
  }

  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated: Shipment = {
    ...s,
    status: 'Delivered',
    deliveryAttempts: (s.deliveryAttempts || 0) + 1,
    proofOfDelivery: {
      deliveredAt: now,
      receivedBy: `${receivedBy || s.recipient.name} (Verified via OTP: ${cleanInputOtp})`,
      signatureText: signatureText || `${receivedBy || s.recipient.name} - Handheld OTP Confirmation`,
    },
    podSignature: signatureDataUrl,
    podPhotoUrl: photoUrl,
    checkpoints: [
      {
        id: `cp-pod-${Date.now()}`,
        timestamp: now,
        status: 'Delivered',
        location: s.destination.city || 'Doorstep Delivery',
        description: `Delivered successfully to ${receivedBy || s.recipient.name}. Customer 6-digit OTP verified. Digital POD registered.${s.codAmount ? ` COD Collected: NPR ${s.codAmount.toLocaleString()}.` : ' Prepaid order.'}`,
        isCompleted: true,
      },
      ...s.checkpoints,
    ],
  };

  current[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('shipments-updated'));
  }

  // Also advance COD stage if COD record exists
  if (typeof window !== 'undefined') {
    try {
      const codRaw = localStorage.getItem('double7_cod_prod_v1');
      if (codRaw) {
        const codRecords = JSON.parse(codRaw);
        const codIdx = codRecords.findIndex((c: any) => c.trackingNumber === s.id || c.consignmentId === s.id);
        if (codIdx !== -1) {
          codRecords[codIdx].stage = 'cash_collected';
          codRecords[codIdx].status = 'collected';
          codRecords[codIdx].collectedAmountNpr = s.codAmount || 0;
          codRecords[codIdx].cashCollectedAt = now;
          localStorage.setItem('double7_cod_prod_v1', JSON.stringify(codRecords));
          window.dispatchEvent(new Event('cod-records-change'));
        }
      }
    } catch {}
  }

  return { success: true, message: 'Delivery confirmed & verified via OTP.', shipment: updated };
}

export function recordRiderDeliveryFailure(
  trackingId: string,
  reason: string,
  notes?: string
): Shipment | null {
  const current = getShipments();
  const index = current.findIndex(s => s.id.toUpperCase() === trackingId.toUpperCase());
  if (index === -1) return null;

  const s = current[index];
  const attempts = (s.deliveryAttempts || 0) + 1;
  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated: Shipment = {
    ...s,
    status: 'Exception',
    deliveryAttempts: attempts,
    ndrReason: reason,
    ndrNotes: notes || `Attempt ${attempts} failed: ${reason}`,
    checkpoints: [
      {
        id: `cp-ndr-${Date.now()}`,
        timestamp: now,
        status: 'Delayed',
        location: s.destination.city || 'Delivery Beat',
        description: `Delivery attempt #${attempts} NDR: ${reason}. ${notes || 'Reattempt scheduled for next delivery cycle.'}`,
        isCompleted: true,
      },
      ...s.checkpoints,
    ],
  };

  current[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('shipments-updated'));
  }

  return updated;
}

export function assignRiderToShipment(
  trackingId: string,
  rider: { id: string; name: string; phone: string; vehicle: string }
): Shipment | null {
  const current = getShipments();
  const index = current.findIndex(s => s.id.toUpperCase() === trackingId.toUpperCase());
  if (index === -1) return null;

  const s = current[index];
  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated: Shipment = {
    ...s,
    assignedRider: rider,
    status: s.status === 'Pending Pickup' ? 'Courier Assigned' : s.status,
    checkpoints: [
      {
        id: `cp-rider-${Date.now()}`,
        timestamp: now,
        status: 'Courier Assigned',
        location: s.origin.hub || 'Hub Terminal',
        description: `Assigned to Courier Rider ${rider.name} (${rider.vehicle}, Contact: ${rider.phone}) for delivery run-sheet.`,
        isCompleted: true,
      },
      ...s.checkpoints,
    ],
  };

  current[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('shipments-updated'));
  }

  return updated;
}

