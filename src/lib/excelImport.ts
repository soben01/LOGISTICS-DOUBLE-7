import * as XLSX from 'xlsx';
import { Shipment } from './store';

export interface ParsedRowValidation {
  rowNumber: number;
  isValid: boolean;
  warnings: string[];
  shipment: Partial<Shipment>;
  rawRow: Record<string, any>;
}

export interface ParsedExcelResult {
  fileName: string;
  totalRows: number;
  validCount: number;
  warningCount: number;
  headers: string[];
  detectedMappings: Record<string, string>;
  rows: ParsedRowValidation[];
}

const HEADER_ALIASES: Record<string, string> = {
  // Booking / Tracking
  date: 'date',
  shipment_date: 'date',
  booking_date: 'date',
  order_date: 'date',
  created_at: 'date',
  booking_no: 'booking_no',
  bookingno: 'booking_no',
  booking: 'booking_no',
  booking_id: 'booking_no',
  order_no: 'booking_no',
  order_id: 'booking_no',
  consignment_no: 'booking_no',
  awb: 'booking_no',
  awb_no: 'booking_no',
  tracking_no: 'tracking_no',
  trackingno: 'tracking_no',
  tracking: 'tracking_no',
  tracking_id: 'tracking_no',
  parcel_no: 'parcel_no',
  parcelno: 'parcel_no',
  parcel: 'parcel_no',
  package_no: 'parcel_no',
  barcode: 'parcel_no',

  // Merchant / Sender
  merchant: 'merchant',
  merchant_name: 'merchant',
  sender: 'merchant',
  sender_name: 'merchant',
  shipper: 'merchant',
  client: 'merchant',
  client_name: 'merchant',
  vendor: 'merchant',

  // Consignee / Receiver
  consignee: 'consignee',
  consignee_name: 'consignee',
  receiver: 'consignee',
  receiver_name: 'consignee',
  recipient: 'consignee',
  recipient_name: 'consignee',
  customer: 'consignee',
  customer_name: 'consignee',
  contact_person: 'consignee',

  // Contact Details
  phone: 'phone',
  consignee_phone: 'phone',
  receiver_phone: 'phone',
  recipient_phone: 'phone',
  mobile: 'phone',
  contact: 'phone',
  contact_no: 'phone',
  cell: 'phone',
  telephone: 'phone',
  email: 'email',
  consignee_email: 'email',
  receiver_email: 'email',
  recipient_email: 'email',

  // Address & Geography
  address: 'address',
  consignee_address: 'address',
  receiver_address: 'address',
  delivery_address: 'address',
  street: 'address',
  street_address: 'address',
  city: 'city',
  destination_city: 'city',
  district: 'city',
  destination: 'city',
  hub: 'city',
  state: 'state',
  province: 'state',
  region: 'state',
  postal_code: 'postal_code',
  zip: 'postal_code',
  zip_code: 'postal_code',
  pincode: 'postal_code',
  country: 'country',
  destination_country: 'country',

  // Cargo & Package
  description: 'description',
  cargo_description: 'description',
  contents: 'description',
  item_description: 'description',
  item: 'description',
  goods: 'description',
  product: 'description',
  weight: 'weight',
  weight_kg: 'weight',
  wt: 'weight',
  gross_weight: 'weight',
  pieces: 'pieces',
  qty: 'pieces',
  quantity: 'pieces',
  packages: 'pieces',
  boxes: 'pieces',
  colli: 'pieces',

  // Service & Financials
  service_type: 'service_type',
  service: 'service_type',
  shipping_mode: 'service_type',
  speed: 'service_type',
  delivery_type: 'service_type',
  amount: 'amount',
  cod_amount: 'amount',
  cod: 'amount',
  declared_value: 'amount',
  price: 'amount',
  total: 'amount',
  value: 'amount',

  // Operational
  status: 'status',
  delivery_status: 'status',
  shipment_status: 'status',
  remarks: 'remarks',
  notes: 'remarks',
  comment: 'remarks',
  comments: 'remarks',
  instructions: 'remarks',
};

function normalizeHeaderKey(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return HEADER_ALIASES[cleaned] || cleaned;
}

export async function parseShipmentsExcel(file: File): Promise<ParsedExcelResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to array of arrays to inspect headers
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('Spreadsheet must contain a header row and at least one data row.');
  }

  const rawHeaderRow = rawRows[0] as any[];
  const normalizedHeaders: string[] = [];
  const detectedMappings: Record<string, string> = {};

  rawHeaderRow.forEach((rawCol, idx) => {
    const rawStr = String(rawCol || '').trim();
    if (rawStr) {
      const canonical = normalizeHeaderKey(rawStr);
      normalizedHeaders[idx] = canonical;
      detectedMappings[rawStr] = canonical;
    }
  });

  const parsedValidations: ParsedRowValidation[] = [];
  let validCount = 0;
  let warningCount = 0;

  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    // Skip completely empty lines
    if (!row || row.every((c) => c === '' || c === null || c === undefined)) {
      continue;
    }

    const rowObj: Record<string, any> = {};
    normalizedHeaders.forEach((key, colIdx) => {
      if (key) {
        let val = row[colIdx];
        if (val instanceof Date) {
          val = val.toISOString().split('T')[0];
        }
        rowObj[key] = typeof val === 'string' ? val.trim() : val;
      }
    });

    const warnings: string[] = [];

    // Extract identifiers
    let bookingNo = String(rowObj['booking_no'] || rowObj['tracking_no'] || '').trim();
    if (!bookingNo) {
      bookingNo = `D7-IMP-${Math.floor(100000 + Math.random() * 900000)}`;
      warnings.push('Auto-generated missing booking number');
    }

    const parcelNo = String(rowObj['parcel_no'] || '').trim() || `P-${bookingNo.slice(-6)}`;
    const trackingNo = String(rowObj['tracking_no'] || bookingNo).trim();
    const merchant = String(rowObj['merchant'] || 'Verified Merchant').trim();
    const consignee = String(rowObj['consignee'] || 'Consignee Receiver').trim();
    const phone = String(rowObj['phone'] || '+977 98000 00000').trim();
    const email = String(rowObj['email'] || '').trim();
    const address = String(rowObj['address'] || 'Main Road, Ward 4').trim();
    const city = String(rowObj['city'] || 'Kathmandu').trim();
    const state = String(rowObj['state'] || 'Bagmati Province').trim();
    const country = String(rowObj['country'] || 'Nepal').trim();
    const postalCode = String(rowObj['postal_code'] || '').trim();
    const description = String(rowObj['description'] || 'General E-Commerce Consignment').trim();
    const weight = Number(rowObj['weight'] || 2.5) || 2.5;
    const pieces = Math.max(1, parseInt(rowObj['pieces'] || '1', 10) || 1);
    const amount = Number(rowObj['amount'] || 0) || 0;
    const remarks = String(rowObj['remarks'] || '').trim();

    // Determine normalized status
    const rawStatus = String(rowObj['status'] || 'Booked').trim().toLowerCase();
    let status: Shipment['status'] = 'Booked';
    if (rawStatus.includes('deliver')) status = 'Delivered';
    else if (rawStatus.includes('out')) status = 'Out for Delivery';
    else if (rawStatus.includes('transit')) status = 'In Transit';
    else if (rawStatus.includes('pick')) status = 'Picked Up';
    else if (rawStatus.includes('custom')) status = 'Customs Cleared';
    else if (rawStatus.includes('return')) status = 'Returned';
    else status = 'Booked';

    if (!rowObj['consignee']) warnings.push('Default consignee name applied');
    if (!rowObj['phone']) warnings.push('Default contact phone applied');
    if (!rowObj['city']) warnings.push('Default destination city (Kathmandu) applied');

    const mappedShipment: Partial<Shipment> = {
      id: trackingNo,
      bookingNo,
      trackingNo,
      parcelNo,
      merchant,
      service: String(rowObj['service_type'] || 'Double 7 Express (Excel Imported)'),
      serviceCode: 'EXP',
      status,
      remarks,
      origin: {
        city: 'Kathmandu Central Hub',
        province: 'Bagmati Province',
        hub: 'National Logistics Hub (Kathmandu)',
      },
      destination: {
        city,
        province: state,
        state,
        country,
        postalCode,
        hub: `${city} Central Hub`,
      },
      sender: {
        name: merchant,
        company: merchant,
        phone: '+977 1 4411000',
      },
      recipient: {
        name: consignee,
        company: consignee,
        address,
        city,
        state,
        country,
        postalCode,
        phone,
        email,
      },
      cargo: {
        pieces,
        weightKg: weight,
        description,
        declaredValueNpr: amount,
      },
      codAmount: amount,
      telemetry: {
        waybillNumber: `AWB-D7-${bookingNo}`,
        estimatedArrival: 'Today by 17:00 NPT (Guaranteed 24H SLA)',
        trackingRoute: `Kathmandu to ${city} Express Corridor`,
      },
    };

    if (warnings.length > 0) warningCount++;
    else validCount++;

    parsedValidations.push({
      rowNumber: r + 1,
      isValid: true,
      warnings,
      shipment: mappedShipment,
      rawRow: rowObj,
    });
  }

  return {
    fileName: file.name,
    totalRows: parsedValidations.length,
    validCount,
    warningCount,
    headers: rawHeaderRow.map((h) => String(h || '')),
    detectedMappings,
    rows: parsedValidations,
  };
}

export function downloadExcelTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const headers = [
    'Date',
    'Booking No',
    'Tracking No',
    'Merchant',
    'Consignee',
    'Phone',
    'Email',
    'Address',
    'City',
    'State',
    'Postal Code',
    'Country',
    'Parcel No',
    'Description',
    'Weight',
    'Pieces',
    'Service Type',
    'Amount',
    'Status',
    'Remarks',
  ];

  const sampleRows = [
    [
      '2026-09-11',
      'P250009404758',
      'D7-8821-EXP',
      'Everest Gadgets Pvt Ltd',
      'Aarav Sharma',
      '+977 9841234567',
      'aarav.sharma@gmail.com',
      'Traffic Chowk, Ward 4',
      'Butwal',
      'Lumbini Province',
      '32907',
      'Nepal',
      'P-9404758',
      'High-Value Electronics Assemblies',
      2.5,
      2,
      'Express Courier',
      4500,
      'Booked',
      'Fragile, handle with extreme care',
    ],
    [
      '2026-09-11',
      'P250009404759',
      'D7-7730-EXP',
      'Himalayan Organic Tea',
      'Pooja Thapa',
      '+977 9851098765',
      'pooja.thapa@gmail.com',
      'Lakeside North, Ward 6',
      'Pokhara',
      'Gandaki Province',
      '33700',
      'Nepal',
      'P-9404759',
      'Premium Organic Orthodox Tea (Export Box)',
      1.8,
      1,
      'Standard Air Cargo',
      3200,
      'In Transit',
      'Temperature controlled cargo',
    ],
    [
      '2026-09-11',
      'P250009404760',
      'D7-6042-CARGO',
      'Birat Textiles & Apparel',
      'Bikash Shrestha',
      '+977 9812345678',
      'bikash.s@yahoo.com',
      'Main Road, Tintolia',
      'Biratnagar',
      'Koshi Province',
      '56613',
      'Nepal',
      'P-9404760',
      'Garment Fabrics & Winter Apparel Sample',
      8.4,
      4,
      'Linehaul Heavy Freight',
      9800,
      'Booked',
      'Direct warehouse cross-dock',
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for clean readability
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 18 }, // Booking No
    { wch: 16 }, // Tracking No
    { wch: 25 }, // Merchant
    { wch: 20 }, // Consignee
    { wch: 16 }, // Phone
    { wch: 24 }, // Email
    { wch: 26 }, // Address
    { wch: 14 }, // City
    { wch: 18 }, // State
    { wch: 12 }, // Postal Code
    { wch: 10 }, // Country
    { wch: 14 }, // Parcel No
    { wch: 32 }, // Description
    { wch: 10 }, // Weight
    { wch: 8 },  // Pieces
    { wch: 20 }, // Service Type
    { wch: 12 }, // Amount
    { wch: 14 }, // Status
    { wch: 28 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Shipments');

  if (format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Double7_Shipment_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    XLSX.writeFile(wb, 'Double7_Shipment_Import_Template.xlsx');
  }
}

export function exportShipmentsToExcel(shipments: Shipment[], filename = 'Double7_Consignments_Export.xlsx') {
  const headers = [
    'Date',
    'Booking No',
    'Tracking No',
    'Parcel No',
    'Merchant',
    'Consignee',
    'Phone',
    'Email',
    'Destination City',
    'Province',
    'Address',
    'Description',
    'Weight (kg)',
    'Pieces',
    'Service',
    'COD Amount (NPR)',
    'Status',
    'Remarks',
  ];

  const rows = shipments.map((s) => [
    s.checkpoints?.[0]?.timestamp || new Date().toISOString().split('T')[0],
    s.bookingNo || s.id,
    s.id,
    s.parcelNo || `P-${s.id.slice(-6)}`,
    s.merchant || s.sender?.company || s.sender?.name || 'Double 7 Merchant',
    s.recipient?.name || 'Consignee Recipient',
    s.recipient?.phone || '',
    s.recipient?.email || '',
    s.destination?.city || '',
    s.destination?.province || s.destination?.state || '',
    s.recipient?.address || '',
    s.cargo?.description || '',
    s.cargo?.weightKg || 0,
    s.cargo?.pieces || 1,
    s.service || 'Double 7 Express',
    s.codAmount || s.cargo?.declaredValueNpr || 0,
    s.status,
    s.remarks || '',
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 26 },
    { wch: 30 },
    { wch: 12 },
    { wch: 8 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 26 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Shipments');
  XLSX.writeFile(wb, filename);
}
