// src/lib/permissions.ts

export type AccountType = 'admin' | 'merchant';

export interface PermissionDefinition {
  id: string;
  label: string;
  category: 'Operations' | 'Finance & COD' | 'Staff & Roles' | 'Compliance & Security' | 'Customer Care';
  description: string;
  scope: AccountType | 'both';
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // --- Merchant Scoped Permissions ---
  {
    id: 'merchant:create_consignments',
    label: 'Create & Book Consignments',
    category: 'Operations',
    description: 'Book domestic linehauls, schedule pickups, and issue digital waybills.',
    scope: 'merchant',
  },
  {
    id: 'merchant:print_waybills',
    label: 'Print Thermal Waybills & Manifests',
    category: 'Operations',
    description: 'Generate barcode shipping labels and dispatch manifests for riders.',
    scope: 'merchant',
  },
  {
    id: 'merchant:barcode_scan',
    label: 'Barcode Scanning & Sorting',
    category: 'Operations',
    description: 'Scan inbound and outbound parcels at warehouse receiving bays.',
    scope: 'merchant',
  },
  {
    id: 'merchant:cod_ledger',
    label: 'View COD Remittance Ledger',
    category: 'Finance & COD',
    description: 'Access real-time Cash on Delivery balance, rider collections, and remittances.',
    scope: 'merchant',
  },
  {
    id: 'merchant:payout_settlement',
    label: 'Request Payout Settlements',
    category: 'Finance & COD',
    description: 'Initiate bank withdrawals and export tax invoices for reconciled funds.',
    scope: 'merchant',
  },
  {
    id: 'merchant:manage_staff',
    label: 'Manage Sub-Merchants & Staff',
    category: 'Staff & Roles',
    description: 'Create, edit permissions, and suspend staff accounts under this merchant.',
    scope: 'merchant',
  },
  {
    id: 'merchant:dispute_claims',
    label: 'File Claims & Discrepancies',
    category: 'Customer Care',
    description: 'Flag cash collection discrepancies, transit damage, or missing items.',
    scope: 'merchant',
  },
  {
    id: 'merchant:support_desk',
    label: 'Customer Support & NDR Desk',
    category: 'Customer Care',
    description: 'Manage Non-Delivery Reports (NDR), re-attempt delivery scheduling, and buyer OTPs.',
    scope: 'merchant',
  },

  // --- Admin Scoped Permissions ---
  {
    id: 'admin:linehaul_dispatch',
    label: 'Linehaul & Fleet Dispatch',
    category: 'Operations',
    description: 'Assign highway corridors, chartered cargo flights, and electric vans.',
    scope: 'admin',
  },
  {
    id: 'admin:hub_telemetry',
    label: 'Hub Sort Telemetry & Capacity',
    category: 'Operations',
    description: 'Monitor sorting conveyor throughput, AGV robotics, and hub congestion.',
    scope: 'admin',
  },
  {
    id: 'admin:carrier_routing',
    label: 'Carrier SLA & Dynamic Tariffs',
    category: 'Operations',
    description: 'Configure freight tariffs, peak surge algorithms, and third-party airline SLAs.',
    scope: 'admin',
  },
  {
    id: 'admin:cod_reconciliation',
    label: 'Central Hub COD Reconciliation',
    category: 'Finance & COD',
    description: 'Verify rider hub cash deposits, resolve discrepancies, and approve payouts.',
    scope: 'admin',
  },
  {
    id: 'admin:dispute_resolution',
    label: 'Dispute & Auto-Hold Overrides',
    category: 'Finance & COD',
    description: 'Enforce or release payout holds on merchants with unresolved delivery issues.',
    scope: 'admin',
  },
  {
    id: 'admin:merchant_kyc',
    label: 'Merchant KYC & Account Approval',
    category: 'Compliance & Security',
    description: 'Approve new business registrations, review tax PAN/VAT certificates, and audit risks.',
    scope: 'admin',
  },
  {
    id: 'admin:audit_trail',
    label: 'System Audit Trail Inspection',
    category: 'Compliance & Security',
    description: 'Review tamper-evident security logs, employee logins, and consignment overrides.',
    scope: 'admin',
  },
  {
    id: 'admin:manage_sub_admins',
    label: 'Manage Sub-Admins & Permissions',
    category: 'Staff & Roles',
    description: 'Provision scoped sub-admin accounts and customize security clearance levels.',
    scope: 'admin',
  },
];

export interface RolePreset {
  id: string;
  label: string;
  accountType: AccountType;
  description: string;
  permissions: string[];
}

export const ROLE_PRESETS: RolePreset[] = [
  // --- Admin Presets ---
  {
    id: 'admin_super',
    label: 'Super Admin HQ',
    accountType: 'admin',
    description: 'Full system control, database telemetry, staff provisioning, and platform configuration.',
    permissions: SYSTEM_PERMISSIONS.filter(p => p.scope === 'admin').map(p => p.id),
  },
  {
    id: 'admin_ops_hub',
    label: 'Operations & Hub Controller',
    accountType: 'admin',
    description: 'Linehaul highway routing, regional sorting hub capacity, and transit SLA oversight.',
    permissions: [
      'admin:linehaul_dispatch',
      'admin:hub_telemetry',
      'admin:carrier_routing',
    ],
  },
  {
    id: 'admin_auditor',
    label: 'Compliance & Security Auditor',
    accountType: 'admin',
    description: 'Audit trail inspection, KYC merchant risk validation, and dispute mediation.',
    permissions: [
      'admin:audit_trail',
      'admin:merchant_kyc',
      'admin:dispute_resolution',
    ],
  },
  {
    id: 'admin_cod_finance',
    label: 'Central COD Treasury Manager',
    accountType: 'admin',
    description: 'Rider cash collection intake, discrepancy resolution, and merchant payout authorization.',
    permissions: [
      'admin:cod_reconciliation',
      'admin:dispute_resolution',
      'admin:audit_trail',
    ],
  },

  // --- Merchant Presets ---
  {
    id: 'merchant_owner',
    label: 'Store Owner / Principal Merchant',
    accountType: 'merchant',
    description: 'Owns store, billing, staff, bank settlement credentials, and full merchant features.',
    permissions: SYSTEM_PERMISSIONS.filter(p => p.scope === 'merchant').map(p => p.id),
  },
  {
    id: 'merchant_warehouse',
    label: 'Warehouse Dispatcher',
    accountType: 'merchant',
    description: 'Package creation, thermal waybill printing, barcode sorting, and handover to pickup rider.',
    permissions: [
      'merchant:create_consignments',
      'merchant:print_waybills',
      'merchant:barcode_scan',
    ],
  },
  {
    id: 'merchant_finance',
    label: 'Finance & COD Accountant',
    accountType: 'merchant',
    description: 'Monitors COD remittances, manages bank settlement requests, and handles cash discrepancies.',
    permissions: [
      'merchant:cod_ledger',
      'merchant:payout_settlement',
      'merchant:dispute_claims',
    ],
  },
  {
    id: 'merchant_support',
    label: 'Customer Support & Claims Agent',
    accountType: 'merchant',
    description: 'Handles tracking inquiries, triggers delivery re-attempts, and communicates with consignees.',
    permissions: [
      'merchant:support_desk',
      'merchant:dispute_claims',
    ],
  },
];

export function getAvailablePermissions(accountType: AccountType): PermissionDefinition[] {
  return SYSTEM_PERMISSIONS.filter(p => p.scope === accountType || p.scope === 'both');
}

export function getPresetsForAccountType(accountType: AccountType): RolePreset[] {
  return ROLE_PRESETS.filter(r => r.accountType === accountType);
}

export function hasPermission(grantedPermissions: string[] | undefined, permissionId: string): boolean {
  if (!grantedPermissions) return false;
  return grantedPermissions.includes(permissionId);
}
