export interface EmailNotificationSubscription {
  id: string;
  email: string;
  frequency: '24h' | 'instant';
  role: 'merchant' | 'admin' | 'consignee';
  includeDispatches: boolean;
  includeCodReport: boolean;
  includeExceptions: boolean;
  associatedTrackingId?: string;
  subscribedAt: string;
  lastSentAt?: string;
  status: 'active' | 'paused';
}

const STORAGE_KEY = 'double7_gmail_subscriptions_v1';

const DEFAULT_SUBSCRIPTIONS: EmailNotificationSubscription[] = [
  {
    id: 'sub-soben',
    email: 'soben@double7.com',
    frequency: '24h',
    role: 'admin',
    includeDispatches: true,
    includeCodReport: true,
    includeExceptions: true,
    subscribedAt: 'Sep 01, 2026',
    lastSentAt: 'Sep 02, 2026 - 08:00 NPT',
    status: 'active',
  },
  {
    id: 'sub-pradeep',
    email: 'pradeep@himalayantech.np',
    frequency: '24h',
    role: 'merchant',
    includeDispatches: true,
    includeCodReport: true,
    includeExceptions: true,
    subscribedAt: 'Sep 02, 2026',
    lastSentAt: 'Sep 02, 2026 - 08:00 NPT',
    status: 'active',
  },
];

export function getEmailSubscriptions(): EmailNotificationSubscription[] {
  if (typeof window === 'undefined') return DEFAULT_SUBSCRIPTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('double11_gmail_subscriptions_v1');
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUBSCRIPTIONS));
      return DEFAULT_SUBSCRIPTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SUBSCRIPTIONS;
  }
}

export function subscribeTo24hSummary(data: {
  email: string;
  role?: 'merchant' | 'admin' | 'consignee';
  frequency?: '24h' | 'instant';
  includeDispatches?: boolean;
  includeCodReport?: boolean;
  includeExceptions?: boolean;
  associatedTrackingId?: string;
}): { success: boolean; subscription: EmailNotificationSubscription } {
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Valid email address is required.');
  }

  const current = getEmailSubscriptions();
  const cleanEmail = data.email.trim().toLowerCase();

  const existingIdx = current.findIndex(
    s => s.email.toLowerCase() === cleanEmail && s.associatedTrackingId === data.associatedTrackingId
  );

  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let updatedSubscription: EmailNotificationSubscription;

  if (existingIdx !== -1) {
    current[existingIdx] = {
      ...current[existingIdx],
      frequency: data.frequency || current[existingIdx].frequency,
      includeDispatches: data.includeDispatches ?? current[existingIdx].includeDispatches,
      includeCodReport: data.includeCodReport ?? current[existingIdx].includeCodReport,
      includeExceptions: data.includeExceptions ?? current[existingIdx].includeExceptions,
      status: 'active',
      subscribedAt: now,
    };
    updatedSubscription = current[existingIdx];
  } else {
    updatedSubscription = {
      id: `sub-${Date.now()}`,
      email: cleanEmail,
      frequency: data.frequency || '24h',
      role: data.role || 'merchant',
      includeDispatches: data.includeDispatches ?? true,
      includeCodReport: data.includeCodReport ?? true,
      includeExceptions: data.includeExceptions ?? true,
      associatedTrackingId: data.associatedTrackingId,
      subscribedAt: now,
      lastSentAt: 'Pending next 24-hr schedule (08:00 NPT)',
      status: 'active',
    };
    current.push(updatedSubscription);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('subscription-change'));
  }

  return { success: true, subscription: updatedSubscription };
}

export function unsubscribeEmail(id: string): boolean {
  const current = getEmailSubscriptions();
  const filtered = current.filter(s => s.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('subscription-change'));
  }
  return true;
}
