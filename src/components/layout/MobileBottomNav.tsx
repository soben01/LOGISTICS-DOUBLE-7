'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Search,
  Plus,
  Boxes,
  Shield,
  Building,
  User as UserIcon,
  LogOut,
  X,
  ExternalLink,
  Cpu,
  Calculator,
  Settings as SettingsIcon,
  Bike
} from 'lucide-react';
import { getCurrentUser, logoutUser, User } from '../../lib/auth';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAccountSheet, setShowAccountSheet] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setCurrentUser(getCurrentUser());
    };
    checkAuth();

    window.addEventListener('auth-change', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setShowAccountSheet(false);
    router.push('/login');
  };

  // Determine portal route and icon based on role
  let portalHref = '/login';
  let portalLabel = 'Account';
  let PortalIcon = UserIcon;

  if (currentUser) {
    if (currentUser.role === 'admin') {
      portalHref = '/admin';
      portalLabel = 'Admin';
      PortalIcon = Shield;
    } else {
      portalHref = '/merchant';
      portalLabel = 'Merchant';
      PortalIcon = Building;
    }
  }

  const isHomeActive = pathname === '/';
  const isTrackActive = pathname.startsWith('/track');
  const isBookActive = pathname.startsWith('/book');
  const isBookingsActive = pathname.startsWith('/bookings');
  const isPortalActive =
    (currentUser?.role === 'admin' && pathname.startsWith('/admin')) ||
    (currentUser?.role === 'merchant' && pathname.startsWith('/merchant')) ||
    (!currentUser && pathname.startsWith('/login'));

  const handlePortalClick = (e: React.MouseEvent) => {
    if (currentUser && isPortalActive) {
      // If already on portal, open account sheet to allow easy logout or switching
      e.preventDefault();
      setShowAccountSheet(!showAccountSheet);
    }
  };

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
        {/* 1. Home */}
        <Link
          href="/"
          className={`mobile-bottom-nav-item ${isHomeActive ? 'active' : ''}`}
          aria-label="Home"
        >
          <Home size={20} strokeWidth={isHomeActive ? 2.5 : 1.8} />
          <span>Home</span>
        </Link>

        {/* 2. Track */}
        <Link
          href="/track"
          className={`mobile-bottom-nav-item ${isTrackActive ? 'active' : ''}`}
          aria-label="Track Shipment"
        >
          <Search size={20} strokeWidth={isTrackActive ? 2.5 : 1.8} />
          <span>Track</span>
        </Link>

        {/* 3. Book (Elevated Center CTA) */}
        <Link
          href={currentUser ? "/book" : "/login?redirect=/book"}
          className="mobile-bottom-nav-center-btn"
          aria-label="Book Cargo Consignment"
          title="Book Cargo"
        >
          <Plus size={24} strokeWidth={2.8} />
        </Link>

        {/* 4. Rates (Logged out) or Dashboard Hub (Logged in) */}
        {currentUser ? (
          <Link
            href="/dashboard"
            className={`mobile-bottom-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
            aria-label="Live Dashboard"
          >
            <LayoutDashboard size={20} strokeWidth={pathname === '/dashboard' ? 2.5 : 1.8} />
            <span>Dashboard</span>
          </Link>
        ) : (
          <Link
            href="/rates"
            className={`mobile-bottom-nav-item ${pathname === '/rates' ? 'active' : ''}`}
            aria-label="Rates & Tariffs"
          >
            <Calculator size={20} strokeWidth={pathname === '/rates' ? 2.5 : 1.8} />
            <span>Rates</span>
          </Link>
        )}

        {/* 5. Portal / User */}
        <Link
          href={portalHref}
          onClick={handlePortalClick}
          className={`mobile-bottom-nav-item ${isPortalActive ? 'active' : ''}`}
          aria-label={portalLabel}
        >
          <PortalIcon size={20} strokeWidth={isPortalActive ? 2.5 : 1.8} />
          <span>{portalLabel}</span>
        </Link>
      </nav>

      {/* Slide-Up Mobile Account & Quick Logout Sheet */}
      {showAccountSheet && currentUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'flex-end',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowAccountSheet(false)}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: '#0c1220',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px 20px 0 0',
              padding: '1.25rem 1.25rem',
              paddingBottom: 'calc(max(1rem, var(--sab)) + 4.5rem)',
              animation: 'slideUpMobileSheet 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 -10px 36px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div style={{ width: '36px', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.16)', borderRadius: '2px', margin: '0 auto 1.25rem auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {currentUser.email} &bull; <span style={{ color: currentUser.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-cyan)', textTransform: 'uppercase', fontWeight: 600 }}>{currentUser.role}</span>
                </div>
              </div>
              <button
                onClick={() => setShowAccountSheet(false)}
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Links: Strictly Tools and Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
              <Link
                href="/rider"
                onClick={() => setShowAccountSheet(false)}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.9rem', borderColor: 'rgba(255, 102, 0, 0.3)' }}
              >
                <Bike size={16} color="var(--brand-orange)" />
                <span>Rider Delivery Portal</span>
              </Link>
              <Link
                href={currentUser.role === 'admin' ? '/admin' : '/merchant'}
                onClick={() => setShowAccountSheet(false)}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.9rem' }}
              >
                {currentUser.role === 'admin' ? <Shield size={15} color="var(--brand-orange)" /> : <Building size={15} color="var(--brand-cyan)" />}
                <span>{currentUser.role === 'admin' ? 'Admin Tools' : 'Merchant Tools'}</span>
              </Link>
              <Link
                href={currentUser.role === 'admin' ? '/admin?section=settings' : '/merchant?tab=profile_api'}
                onClick={() => setShowAccountSheet(false)}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.9rem' }}
              >
                <SettingsIcon size={15} color="#94a3b8" />
                <span>Settings</span>
              </Link>
            </div>

            {/* Log Out Button */}
            <button
              onClick={handleLogout}
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                padding: '0.75rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                borderRadius: '9px',
                cursor: 'pointer',
              }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
