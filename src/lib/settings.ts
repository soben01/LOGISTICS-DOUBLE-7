'use client';

export interface WebsiteSettings {
  // 1. General & Brand Identity
  brandName: string;
  tagline: string;
  logoUrl: string;
  supportPhone: string;
  supportEmail: string;
  headquartersAddress: string;
  businessRegistrationNo: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  primaryLanguage: string;

  // 2. Users & Roles
  publicMerchantSignup: boolean;
  autoApproveMerchants: boolean;
  requireKycVerification: boolean;
  sessionTimeoutMinutes: number;
  defaultRoleOnSignup: string;
  allowSubUserCreation: boolean;

  // 3. Logistics & NDR Reattempt Rules
  maxDeliveryAttempts: number;
  failedDeliveryReasons: string[];
  autoRtoOnMaxAttempts: boolean;
  autoSendNdrSms: boolean;
  reattemptGraceHours: number;
  requirePodSignature: boolean;
  requirePhotoPod: boolean;

  // 4. Pricing & Tariffs
  valleyBaseRate: number;
  outsideValleyBaseRate: number;
  remoteBaseRate: number;
  bulkWeightThresholdKg: number;
  bulkVolumetricDivisor: number;
  codFeeType: 'percentage' | 'flat';
  codFeeValue: number;
  returnFeePercent: number;
  festiveSurgeMultiplier: number;
  fuelSurchargePercent: number;

  // 5. Finance & Settlements
  vatRatePercent: number;
  dailyResetTime: string; // e.g. "18:00"
  settlementCycle: 'daily' | 'weekly' | 'biweekly' | 'on_demand';
  minPayoutThresholdNpr: number;
  panVatNumber: string;
  digitalInvoicePrefix: string;
  bankRemittanceNotes: string;

  // 6. Notifications & Communications
  smsProvider: 'sparrow' | 'twilio' | 'aakash' | 'disabled';
  smsApiKey: string;
  smsSenderId: string;
  emailProvider: 'cloudflare_relay' | 'smtp' | 'ses';
  smtpHost: string;
  smtpPort: number;
  defaultSenderEmail: string;
  dailySummaryRecipients: string[];
  whatsappApiEnabled: boolean;
  whatsappApiKey: string;
  notifyOnCreated: boolean;
  notifyOnDispatched: boolean;
  notifyOnOutForDelivery: boolean;
  notifyOnDelivered: boolean;
  notifyOnFailed: boolean;
  cloudflareEmailRoutingSync: boolean;

  // 7. API & Integrations
  productionApiKey: string;
  sandboxApiKey: string;
  webhookUrl: string;
  webhookSecret: string;
  webhookEvents: string[];
  shopifyEnabled: boolean;
  woocommerceEnabled: boolean;
  darazSyncEnabled: boolean;

  // 8. Security & Governance
  twoFactorEnforced: boolean;
  passwordMinLength: number;
  requireSpecialChar: boolean;
  ipRestrictionEnabled: boolean;
  whitelistedIps: string[];
  maxFailedLogins: number;

  // 9. System & Audit
  siteMode: 'live' | 'maintenance';
  maintenanceMessage: string;
  announcement: {
    active: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    dismissible: boolean;
  };
  dataRetentionDays: number;
  liveAuditLogEnabled: boolean;

  lastUpdated: string;
  updatedBy: string;
}

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  // 1. General & Brand Identity
  brandName: 'Double 7 Logistics',
  tagline: 'Premier Nepal Highway Express & 77-District Cargo Linehaul Network',
  logoUrl: '/logo.png',
  supportPhone: '+977 1 4411000',
  supportEmail: 'dispatch@sobinupreti.com.np',
  headquartersAddress: 'Double 7 Central Cargo Gateway, Ring Road, Kathmandu, Nepal',
  businessRegistrationNo: 'NP-LOG-2026-7788',
  currency: 'NPR',
  currencySymbol: 'Rs.',
  timezone: 'Asia/Kathmandu (NPT +5:45)',
  primaryLanguage: 'English (UK / Global)',

  // 2. Users & Roles
  publicMerchantSignup: true,
  autoApproveMerchants: false,
  requireKycVerification: true,
  sessionTimeoutMinutes: 60,
  defaultRoleOnSignup: 'merchant',
  allowSubUserCreation: true,

  // 3. Logistics & NDR Reattempt Rules
  maxDeliveryAttempts: 2,
  failedDeliveryReasons: [
    'Customer Unavailable / Phone Switched Off',
    'Incorrect Address / Unreachable Landmark',
    'Consignee Refused to Accept / Order Cancelled',
    'Delivery Rescheduled by Consignee',
    'Out of Delivery Coverage Area',
    'Security / Access Restricted'
  ],
  autoRtoOnMaxAttempts: true,
  autoSendNdrSms: true,
  reattemptGraceHours: 24,
  requirePodSignature: true,
  requirePhotoPod: true,

  // 4. Pricing & Tariffs
  valleyBaseRate: 120,
  outsideValleyBaseRate: 180,
  remoteBaseRate: 280,
  bulkWeightThresholdKg: 10,
  bulkVolumetricDivisor: 5000,
  codFeeType: 'percentage',
  codFeeValue: 1.5,
  returnFeePercent: 50,
  festiveSurgeMultiplier: 1.0,
  fuelSurchargePercent: 12,

  // 5. Finance & Settlements
  vatRatePercent: 13,
  dailyResetTime: '18:00',
  settlementCycle: 'daily',
  minPayoutThresholdNpr: 5000,
  panVatNumber: '601234567',
  digitalInvoicePrefix: 'D7-INV-',
  bankRemittanceNotes: 'Daily batch automated transfer via Nepal Clearing House / ConnectIPS',

  // 6. Notifications & Communications
  smsProvider: 'sparrow',
  smsApiKey: 'sparrow_live_d7log_9921_secret',
  smsSenderId: 'DOUBLE7',
  emailProvider: 'cloudflare_relay',
  smtpHost: 'smtp.cloudflare.com',
  smtpPort: 587,
  defaultSenderEmail: 'dispatch@sobinupreti.com.np',
  dailySummaryRecipients: ['upreti.soben@gmail.com', 'artistrygigs@gmail.com', 'sobin.vipexpress@gmail.com'],
  whatsappApiEnabled: true,
  whatsappApiKey: 'wa_live_nepal_gateway_double7',
  notifyOnCreated: true,
  notifyOnDispatched: true,
  notifyOnOutForDelivery: true,
  notifyOnDelivered: true,
  notifyOnFailed: true,
  cloudflareEmailRoutingSync: true,

  // 7. API & Integrations
  productionApiKey: 'd7_live_pk_9941a029fe28d701a',
  sandboxApiKey: 'd7_test_sk_4421b019ee18e902b',
  webhookUrl: 'https://api.merchant-store.com.np/webhooks/double7',
  webhookSecret: 'whsec_99a8b7c6d5e4f3a2b1',
  webhookEvents: ['shipment.created', 'shipment.dispatched', 'shipment.delivered', 'shipment.failed', 'cod.collected'],
  shopifyEnabled: true,
  woocommerceEnabled: true,
  darazSyncEnabled: false,

  // 8. Security & Governance
  twoFactorEnforced: true,
  passwordMinLength: 8,
  requireSpecialChar: true,
  ipRestrictionEnabled: false,
  whitelistedIps: ['103.145.0.0/24', '202.51.0.0/16'],
  maxFailedLogins: 5,

  // 9. System & Audit
  siteMode: 'live',
  maintenanceMessage: 'Platform is undergoing routine scheduled maintenance. Emergency shipments are actively routed via Highway Control.',
  announcement: {
    active: true,
    title: '24-Hour Dashboard Continuous Updates',
    message: 'Continuous Highway Linehaul Active • All Daily Dispatch Counters & COD Cut-Offs Reset Promptly at 6:00 PM NPT',
    type: 'info',
    dismissible: true,
  },
  dataRetentionDays: 365,
  liveAuditLogEnabled: true,

  lastUpdated: new Date().toISOString(),
  updatedBy: 'Super Admin (Command HQ)',
};

const SETTINGS_STORAGE_KEY = 'double7_website_settings_v1';

export function getWebsiteSettings(): WebsiteSettings {
  if (typeof window === 'undefined') return DEFAULT_WEBSITE_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_WEBSITE_SETTINGS));
      return DEFAULT_WEBSITE_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_WEBSITE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

export function updateWebsiteSettings(updates: Partial<WebsiteSettings>, authorEmail?: string): WebsiteSettings {
  const current = getWebsiteSettings();
  const updated: WebsiteSettings = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString(),
    updatedBy: authorEmail || current.updatedBy || 'Super Admin',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('website-settings-change'));
  }

  // Asynchronously synchronize with Cloudflare Worker KV
  if (typeof window !== 'undefined') {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {
      // Non-blocking fallback
    });
  }

  return updated;
}

export function resetToDefaultSettings(): WebsiteSettings {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_WEBSITE_SETTINGS));
    window.dispatchEvent(new Event('website-settings-change'));
  }
  return DEFAULT_WEBSITE_SETTINGS;
}

export function exportSettingsBackupJson(): string {
  const settings = getWebsiteSettings();
  return JSON.stringify(settings, null, 2);
}

export function importSettingsBackupJson(jsonString: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Invalid JSON backup format.' };
    }
    updateWebsiteSettings(parsed, 'Backup Restore');
    return { success: true, message: 'Settings successfully restored from backup snapshot.' };
  } catch (err: any) {
    return { success: false, message: `Parse error: ${err?.message || 'Invalid JSON'}` };
  }
}

export async function fetchRemoteWebsiteSettings(): Promise<WebsiteSettings | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    if (data.success && data.settings) {
      const merged = { ...DEFAULT_WEBSITE_SETTINGS, ...data.settings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('website-settings-change'));
      return merged;
    }
    return null;
  } catch {
    return null;
  }
}
