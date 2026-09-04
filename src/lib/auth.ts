export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  role: 'merchant' | 'admin';
  subRole?: string;
  permissions?: string[];
  status: 'active' | 'suspended';
  codBalanceNpr: number;
  totalShipments?: number;
  createdAt: string;
}

const USERS_STORAGE_KEY = 'double7_users_v1';
const CURRENT_USER_KEY = 'double7_current_user_v1';

const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-anil',
    name: 'Anil',
    email: 'anil@double7.com.np',
    company: 'Double 7 Logistics Command HQ',
    phone: '+977 1 4411000',
    role: 'admin',
    subRole: 'Command HQ / Operations Admin',
    status: 'active',
    codBalanceNpr: 0,
    totalShipments: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-admin-anil-com',
    name: 'Anil',
    email: 'anil@double7.com',
    company: 'Double 7 Logistics Command HQ',
    phone: '+977 1 4411000',
    role: 'admin',
    subRole: 'Command HQ / Operations Admin',
    status: 'active',
    codBalanceNpr: 0,
    totalShipments: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-admin-1',
    name: 'Soben',
    email: 'soben@double7.com',
    company: 'Double 7 Logistics Command HQ',
    phone: '+977 1 4411000',
    role: 'admin',
    subRole: 'Command HQ / Super Admin',
    status: 'active',
    codBalanceNpr: 0,
    totalShipments: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-admin-soben-11',
    name: 'Soben',
    email: 'soben@double11.com',
    company: 'Double 7 Logistics Command HQ',
    phone: '+977 1 4411000',
    role: 'admin',
    subRole: 'Command HQ / Super Admin',
    status: 'active',
    codBalanceNpr: 0,
    totalShipments: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-admin-artistry',
    name: 'Soben (Artistry)',
    email: 'artistrygigs@gmail.com',
    company: 'Double 7 Logistics Command HQ',
    phone: '+977 98000 00000',
    role: 'admin',
    subRole: 'Command HQ / Executive Lead',
    status: 'active',
    codBalanceNpr: 0,
    totalShipments: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-admin-upreti',
    name: 'Soben Upreti',
    email: 'upreti.soben@gmail.com',
    company: 'Double 7 Logistics Command HQ',
    phone: '+977 1 4411000',
    role: 'admin',
    subRole: 'Command HQ / Executive Director',
    status: 'active',
    codBalanceNpr: 0,
    totalShipments: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-merch-1',
    name: 'Sobin Upreti',
    email: 'sobin@merchant.com',
    company: 'Himalayan Commerce Pvt Ltd',
    phone: '+977 98412 88990',
    role: 'merchant',
    subRole: 'Merchant Consignor / Shipper',
    status: 'active',
    codBalanceNpr: 45200,
    totalShipments: 18,
    createdAt: '2026-01-15',
  },
  {
    id: 'usr-merch-default',
    name: 'Nepal Merchant',
    email: 'merchant@double7.com.np',
    company: 'Everest Retail & Cargo Hub',
    phone: '+977 98000 12345',
    role: 'merchant',
    subRole: 'Merchant Consignor / Shipper',
    status: 'active',
    codBalanceNpr: 32400,
    totalShipments: 12,
    createdAt: '2026-02-01',
  },
];

export function getUsers(): User[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    // Purge legacy storage versions
    localStorage.removeItem('double11_users_v2');
    localStorage.removeItem('double11_users');
    const raw = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem('double11_users_v3');
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed: User[] = JSON.parse(raw);
    // Ensure all DEFAULT_USERS are present in stored users
    let updated = false;
    for (const def of DEFAULT_USERS) {
      if (!parsed.some(p => p.email.toLowerCase() === def.email.toLowerCase())) {
        parsed.push(def);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    localStorage.removeItem('double11_current_user_v2');
    localStorage.removeItem('double11_current_user');
    const raw = localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem('double11_current_user_v3');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loginUser(email: string, password?: string, subRole?: string): { success: boolean; user?: User; error?: string } {
  if (!email || !email.trim()) {
    return { success: false, error: 'Please enter your registered email address.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  let user = users.find(u => {
    const uEmail = u.email.toLowerCase();
    return uEmail === normalizedEmail ||
      (normalizedEmail === 'soben@double11.com' && uEmail === 'soben@double7.com') ||
      (normalizedEmail === 'soben@double7.com' && uEmail === 'soben@double11.com') ||
      (normalizedEmail === 'anil@double7.com' && uEmail === 'anil@double7.com.np') ||
      (normalizedEmail === 'anil@double7.com.np' && uEmail === 'anil@double7.com');
  });

  // 1. Check SubUsers if not in primary users
  if (!user) {
    const subUsers = getSubUsers();
    const subUser = subUsers.find(su => su.email.toLowerCase() === normalizedEmail);
    if (subUser) {
      const switched = switchActiveSubUser(subUser);
      return { success: true, user: switched };
    }
  }

  // 2. Corporate auto-provision for Double 7 team (@double7.com.np, @double7.com, @double11.com, @sobinupreti.com.np)
  if (!user) {
    const isCorporateAdmin =
      normalizedEmail.endsWith('@double7.com.np') ||
      normalizedEmail.endsWith('@double7.com') ||
      normalizedEmail.endsWith('@double11.com') ||
      normalizedEmail.endsWith('@sobinupreti.com.np');

    const isMerchantDomain =
      normalizedEmail.endsWith('@merchant.np') ||
      normalizedEmail.endsWith('@merchant.com');

    if (isCorporateAdmin || isMerchantDomain) {
      const rawName = normalizedEmail.split('@')[0].replace(/[._-]/g, ' ');
      const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      user = {
        id: isCorporateAdmin ? `usr-admin-${Date.now()}` : `usr-merch-${Date.now()}`,
        name,
        email: normalizedEmail,
        company: isCorporateAdmin ? 'Double 7 Logistics Command HQ' : 'Nepal Merchant Commerce Pvt Ltd',
        phone: '+977 1 4411000',
        role: isCorporateAdmin ? 'admin' : 'merchant',
        subRole: isCorporateAdmin ? 'Command HQ / Operations Admin' : 'Merchant Consignor / Shipper',
        status: 'active',
        codBalanceNpr: isCorporateAdmin ? 0 : 25000,
        totalShipments: isCorporateAdmin ? 0 : 5,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const updatedUsers = [...users, user];
      if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      }
    }
  }

  if (!user) {
    return {
      success: false,
      error: 'No account found with this email. Please check your spelling or register a new Merchant account.',
    };
  }

  if (user.status === 'suspended') {
    return {
      success: false,
      error: 'This account has been suspended. Please contact Double 7 Command HQ support.',
    };
  }

  if (subRole) {
    user.subRole = subRole;
  } else if (!user.subRole) {
    user.subRole = user.role === 'admin' ? 'Command HQ / Super Admin' : 'Merchant Consignor / Shipper';
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('auth-change'));
  }

  return { success: true, user };
}

export function updateUserSubRole(subRole: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getCurrentUser();
  if (!current) return false;

  current.subRole = subRole;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current));

  const users = getUsers();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx !== -1) {
    users[idx].subRole = subRole;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  window.dispatchEvent(new Event('auth-change'));
  return true;
}

export function signupUser(params: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  role?: 'merchant' | 'admin';
  password?: string;
}): { success: boolean; user?: User; error?: string } {
  if (!params.name.trim()) {
    return { success: false, error: 'Full name or company representative name is required.' };
  }
  if (!params.email.trim() || !params.email.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }

  const users = getUsers();
  const normalizedEmail = params.email.trim().toLowerCase();
  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (existing) {
    return {
      success: false,
      error: 'An account with this email already exists. Please Sign In instead.',
    };
  }

  const newUser: User = {
    id: `usr-merch-${Date.now()}`,
    name: params.name.trim(),
    email: normalizedEmail,
    company: params.company?.trim() || 'Verified Nepal Merchant',
    phone: params.phone?.trim() || '+977 98000 00000',
    role: params.role || 'merchant',
    status: 'active',
    codBalanceNpr: 0,
    totalShipments: 0,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updatedUsers = [...users, newUser];

  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    window.dispatchEvent(new Event('auth-change'));
  }

  return { success: true, user: newUser };
}

export function updateMerchantStatus(id: string, status: 'active' | 'suspended'): boolean {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;

  users[index].status = status;
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    // If updating current user, refresh current user state too
    const current = getCurrentUser();
    if (current && current.id === id) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[index]));
    }
    window.dispatchEvent(new Event('auth-change'));
  }
  return true;
}

export function recordMerchantRemittance(id: string, amountToRemit: number): boolean {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;

  const currentBal = users[index].codBalanceNpr || 0;
  users[index].codBalanceNpr = Math.max(0, currentBal - amountToRemit);

  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    const current = getCurrentUser();
    if (current && current.id === id) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[index]));
    }
    window.dispatchEvent(new Event('auth-change'));
  }
  return true;
}

export function deleteMerchant(id: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('auth-change'));
  }
  return true;
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.dispatchEvent(new Event('auth-change'));
  }
}

export function findUserByEmail(email: string): User | undefined {
  if (!email || !email.trim()) return undefined;
  const normalized = email.trim().toLowerCase();
  const users = getUsers();
  const found = users.find(u => {
    const uEmail = u.email.toLowerCase();
    return uEmail === normalized ||
      (normalized === 'anil@double7.com' && uEmail === 'anil@double7.com.np') ||
      (normalized === 'anil@double7.com.np' && uEmail === 'anil@double7.com');
  });
  if (found) return found;

  // Check sub-users
  const subUsers = getSubUsers();
  const sub = subUsers.find(s => s.email.toLowerCase() === normalized);
  if (sub) {
    return {
      id: sub.id,
      name: sub.name,
      email: sub.email,
      company: sub.role === 'admin' ? 'Double 7 Command HQ' : 'Nepal Merchant Staff',
      phone: sub.phone || '+977 98000 00000',
      role: sub.role,
      subRole: sub.subRole,
      status: sub.status,
      codBalanceNpr: 0,
      totalShipments: 0,
      createdAt: sub.createdAt,
    };
  }

  // Detect corporate Double 7 domain
  if (
    normalized.endsWith('@double7.com.np') ||
    normalized.endsWith('@double7.com') ||
    normalized.endsWith('@double11.com') ||
    normalized.endsWith('@sobinupreti.com.np')
  ) {
    const rawName = normalized.split('@')[0].replace(/[._-]/g, ' ');
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return {
      id: `usr-admin-detected`,
      name,
      email: normalized,
      company: 'Double 7 Logistics Command HQ',
      phone: '+977 1 4411000',
      role: 'admin',
      subRole: 'Command HQ / Operations Admin',
      status: 'active',
      codBalanceNpr: 0,
      totalShipments: 0,
      createdAt: '2026-01-01',
    };
  }

  if (normalized.endsWith('@merchant.np') || normalized.endsWith('@merchant.com')) {
    return {
      id: `usr-merch-detected`,
      name: 'Nepal Merchant Partner',
      email: normalized,
      company: 'Verified Nepal Merchant',
      phone: '+977 98000 00000',
      role: 'merchant',
      subRole: 'Merchant Consignor / Shipper',
      status: 'active',
      codBalanceNpr: 35000,
      totalShipments: 10,
      createdAt: '2026-01-01',
    };
  }

  return undefined;
}

export interface PortalConfig {
  role: 'admin' | 'merchant';
  portalPath: '/admin' | '/merchant';
  portalName: string;
  badgeLabel: string;
  description: string;
}

export function getMatchingPortal(userOrRole: User | 'merchant' | 'admin'): PortalConfig {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
  if (role === 'admin') {
    return {
      role: 'admin',
      portalPath: '/admin',
      portalName: 'Admin Control Tower',
      badgeLabel: 'ADMIN CONSOLE',
      description: 'Central operations, telemetry, hub management & fleet dispatch control',
    };
  }
  return {
    role: 'merchant',
    portalPath: '/merchant',
    portalName: 'Merchant Portal',
    badgeLabel: 'MERCHANT HUB',
    description: 'COD remittance ledger, tracking, cargo manifest & consignment dispatch',
  };
}

export function resolveMatchedRedirect(user: User, redirectParam?: string | null): string {
  // Landing page after login is /dashboard by default
  if (!redirectParam || redirectParam.startsWith('/login') || redirectParam === '/') {
    return '/dashboard';
  }

  // Must be relative root path
  if (!redirectParam.startsWith('/')) {
    return '/dashboard';
  }

  if (user.role === 'admin') {
    // Admins can navigate to any section except falling into raw merchant redirect
    if (redirectParam.startsWith('/merchant')) {
      return '/dashboard';
    }
    return redirectParam;
  } else {
    // Merchants cannot access /admin
    if (redirectParam.startsWith('/admin')) {
      return '/dashboard';
    }
    return redirectParam;
  }
}

export interface SubUser {
  id: string;
  parentId?: string;
  parentName?: string;
  name: string;
  email: string;
  password?: string;
  role: 'merchant' | 'admin';
  subRole: string;
  phone?: string;
  permissions: string[];
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
}

const SUB_USERS_STORAGE_KEY = 'double7_sub_users_v1';

const DEFAULT_SUB_USERS: SubUser[] = [
  {
    id: 'sub-usr-1',
    parentId: 'usr-admin-1',
    name: 'Pradeep KC',
    email: 'pradeep.ops@double7.com',
    password: 'password123',
    role: 'admin',
    subRole: 'Operations & Hub Controller',
    phone: '+977 98111 22334',
    permissions: ['Linehaul Dispatching', 'Hub Sort Telemetry', 'Carrier SLA Routing'],
    status: 'active',
    createdAt: '2026-02-15',
    lastLoginAt: 'Today 09:30 NPT',
  },
  {
    id: 'sub-usr-2',
    parentId: 'usr-admin-1',
    name: 'Bikram Rayamajhi',
    email: 'bikram.audit@double7.com',
    password: 'password123',
    role: 'admin',
    subRole: 'Compliance & Security Auditor',
    phone: '+977 98222 33445',
    permissions: ['Audit Trail Inspection', 'KYC & Merchant Risk', 'Dispute Resolution'],
    status: 'active',
    createdAt: '2026-02-20',
    lastLoginAt: 'Yesterday 14:15 NPT',
  },
  {
    id: 'sub-usr-3',
    parentId: 'usr-merch-default',
    name: 'Ramesh Sharma',
    email: 'ramesh.warehouse@merchant.np',
    password: 'password123',
    role: 'merchant',
    subRole: 'Warehouse Dispatcher',
    phone: '+977 98412 34567',
    permissions: ['Print Thermal Waybills', 'Barcode Scan Sorting', 'Manifest Creation'],
    status: 'active',
    createdAt: '2026-03-01',
    lastLoginAt: 'Today 11:00 NPT',
  },
  {
    id: 'sub-usr-4',
    parentId: 'usr-merch-default',
    name: 'Sunita Thapa',
    email: 'sunita.finance@merchant.np',
    password: 'password123',
    role: 'merchant',
    subRole: 'Finance & COD Accountant',
    phone: '+977 98510 98765',
    permissions: ['COD Remittance Ledger', 'Bank Account Settlement', 'Financial Statements'],
    status: 'active',
    createdAt: '2026-03-10',
    lastLoginAt: 'Today 16:45 NPT',
  },
];

export function getSubUsers(filterRole?: 'merchant' | 'admin', parentId?: string): SubUser[] {
  if (typeof window === 'undefined') {
    let list = DEFAULT_SUB_USERS;
    if (parentId) list = list.filter(u => u.parentId === parentId);
    else if (filterRole) list = list.filter(u => u.role === filterRole);
    return list;
  }
  try {
    const raw = localStorage.getItem(SUB_USERS_STORAGE_KEY) || localStorage.getItem('double11_sub_users_v2');
    let list: SubUser[] = raw ? JSON.parse(raw) : DEFAULT_SUB_USERS;
    if (!raw) {
      localStorage.setItem(SUB_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_SUB_USERS));
    }
    if (parentId) {
      return list.filter(u => u.parentId === parentId);
    }
    if (filterRole) {
      return list.filter(u => u.role === filterRole);
    }
    return list;
  } catch {
    return DEFAULT_SUB_USERS;
  }
}

export function addSubUser(data: {
  name: string;
  email: string;
  password?: string;
  role: 'merchant' | 'admin';
  subRole: string;
  parentId?: string;
  parentName?: string;
  phone?: string;
  permissions?: string[];
}): { success: boolean; subUser?: SubUser; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: 'Sub-user full name is required.' };
  }
  if (!data.email || !data.email.includes('@')) {
    return { success: false, error: 'Valid business email is required.' };
  }

  const current = getSubUsers();
  const cleanEmail = data.email.trim().toLowerCase();

  if (current.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'A sub-user with this email already exists.' };
  }

  const newSubUser: SubUser = {
    id: `sub-usr-${Date.now()}`,
    parentId: data.parentId || 'active_parent',
    parentName: data.parentName,
    name: data.name.trim(),
    email: cleanEmail,
    password: data.password || 'password123',
    role: data.role,
    subRole: data.subRole,
    phone: data.phone?.trim() || '+977 98000 00000',
    permissions: data.permissions && data.permissions.length > 0 ? data.permissions : ['Standard Portal Access', 'Dispatch Telemetry'],
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    lastLoginAt: 'Just created',
  };

  const updated = [newSubUser, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUB_USERS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('sub-users-change'));
  }

  return { success: true, subUser: newSubUser };
}

export function updateSubUser(id: string, updates: Partial<SubUser>): boolean {
  const current = getSubUsers();
  const index = current.findIndex(u => u.id === id);
  if (index === -1) return false;

  current[index] = { ...current[index], ...updates };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUB_USERS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('sub-users-change'));
  }
  return true;
}

export function toggleSubUserStatus(id: string): boolean {
  const current = getSubUsers();
  const index = current.findIndex(u => u.id === id);
  if (index === -1) return false;

  current[index].status = current[index].status === 'active' ? 'suspended' : 'active';
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUB_USERS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('sub-users-change'));
  }
  return true;
}

export function deleteSubUser(id: string): boolean {
  const current = getSubUsers();
  const filtered = current.filter(u => u.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUB_USERS_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('sub-users-change'));
  }
  return true;
}

export function switchActiveSubUser(subUser: SubUser): User {
  const currentUser = getCurrentUser();
  const switchedUser: User = {
    id: currentUser ? currentUser.id : subUser.id,
    name: subUser.name,
    email: subUser.email,
    company: currentUser ? currentUser.company : (subUser.role === 'admin' ? 'Double 7 Logistics HQ' : 'Nepal Merchant Pvt Ltd'),
    phone: subUser.phone || '+977 98000 00000',
    role: subUser.role,
    subRole: subUser.subRole,
    permissions: subUser.permissions,
    status: 'active',
    codBalanceNpr: currentUser ? currentUser.codBalanceNpr : 0,
    totalShipments: currentUser ? currentUser.totalShipments : 0,
    createdAt: currentUser ? currentUser.createdAt : subUser.createdAt,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(switchedUser));
    window.dispatchEvent(new Event('auth-change'));
  }

  return switchedUser;
}

