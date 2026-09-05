'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Plus,
  Boxes,
  Shield,
  Building,
  User as UserIcon
} from 'lucide-react';
import { getCurrentUser, User } from '../../lib/auth';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  return (
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

      {/* 4. Bookings */}
      <Link
        href="/bookings"
        className={`mobile-bottom-nav-item ${isBookingsActive ? 'active' : ''}`}
        aria-label="All Bookings Registry"
      >
        <Boxes size={20} strokeWidth={isBookingsActive ? 2.5 : 1.8} />
        <span>Bookings</span>
      </Link>

      {/* 5. Portal / User */}
      <Link
        href={portalHref}
        className={`mobile-bottom-nav-item ${isPortalActive ? 'active' : ''}`}
        aria-label={portalLabel}
      >
        <PortalIcon size={20} strokeWidth={isPortalActive ? 2.5 : 1.8} />
        <span>{portalLabel}</span>
      </Link>
    </nav>
  );
}
