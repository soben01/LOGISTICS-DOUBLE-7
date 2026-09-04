'use client';

export interface WebsiteSettings {
  // Brand & Identity
  brandName: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  headquartersAddress: string;
  businessRegistrationNo: string;
  
  // Platform Status & Announcement
  siteMode: 'live' | 'maintenance';
  maintenanceMessage: string;
  announcement: {
    active: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    dismissible: boolean;
  };

  // Operational Reset & Cut-offs
  dailyResetTime: string; // e.g. "18:00"
  timezone: string; // e.g. "Asia/Kathmandu"
  publicMerchantSignup: boolean;
  autoApproveMerchants: boolean;

  // Financial & COD Rules
  currency: string;
  currencySymbol: string;
  vatRatePercent: number;
  codFeeType: 'percentage' | 'flat';
  codFeeValue: number;
  minPayoutThresholdNpr: number;

  // Email & Communication
  defaultSenderEmail: string;
  dailySummaryRecipients: string[];
  cloudflareEmailRoutingSync: boolean;

  lastUpdated: string;
  updatedBy: string;
}

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  brandName: 'Double 7 Logistics',
  tagline: 'Premier Nepal Highway Express & 77-District Cargo Linehaul Network',
  supportPhone: '+977 1 4411000',
  supportEmail: 'dispatch@sobinupreti.com.np',
  headquartersAddress: 'Double 7 Central Cargo Gateway, Ring Road, Kathmandu, Nepal',
  businessRegistrationNo: 'NP-LOG-2026-7788',

  siteMode: 'live',
  maintenanceMessage: 'Platform is undergoing routine scheduled maintenance. Emergency shipments are actively routed via Highway Control.',
  announcement: {
    active: true,
    title: '24-Hour Dashboard Continuous Updates',
    message: 'Continuous Highway Linehaul Active • All Daily Dispatch Counters & COD Cut-Offs Reset Promptly at 6:00 PM NPT',
    type: 'info',
    dismissible: true,
  },

  dailyResetTime: '18:00',
  timezone: 'Asia/Kathmandu (NPT)',
  publicMerchantSignup: true,
  autoApproveMerchants: false,

  currency: 'NPR',
  currencySymbol: 'Rs.',
  vatRatePercent: 13,
  codFeeType: 'percentage',
  codFeeValue: 1.5,
  minPayoutThresholdNpr: 5000,

  defaultSenderEmail: 'dispatch@sobinupreti.com.np',
  dailySummaryRecipients: ['upreti.soben@gmail.com', 'artistrygigs@gmail.com', 'sobin.vipexpress@gmail.com'],
  cloudflareEmailRoutingSync: true,

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
