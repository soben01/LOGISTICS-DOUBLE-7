'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plane,
  Package,
  Search,
  Menu,
  X,
  Radio,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Cpu,
  User as UserIcon,
  LogOut,
  Lock,
  Building,
  Truck,
  Boxes
} from 'lucide-react';
import { getCurrentUser, logoutUser, User } from '../../lib/auth';
import ProfilePortalDrawer from './ProfilePortalDrawer';

export default function Navbar() {
  const [quickTrackId, setQuickTrackId] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = () => {
      setCurrentUser(getCurrentUser());
    };
    checkUser();

    window.addEventListener('auth-change', checkUser);
    window.addEventListener('storage', checkUser);
    return () => {
      window.removeEventListener('auth-change', checkUser);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    router.push('/');
  };

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackId.trim()) return;
    router.push(`/track?id=${encodeURIComponent(quickTrackId.trim())}`);
    setQuickTrackId('');
    setMobileMenuOpen(false);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(7, 10, 18, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      width: '100%'
    }}>
      {/* Top Telemetry Ticker Bar */}
      <div style={{
        backgroundColor: 'rgba(13, 20, 36, 0.98)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '0.75rem',
        padding: '0.4rem 0',
        color: 'var(--text-secondary)',
        width: '100%'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'nowrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            minWidth: 0
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>
              <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }}></span>
              DOMESTIC NEPAL: 100% ACTIVE
            </span>
            <span style={{ color: 'var(--border-medium)', flexShrink: 0 }}>|</span>
            <span className="ticker-hide-sm" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              Hubs: <strong style={{ color: '#f8fafc' }}>KTM &bull; Pokhara &bull; Birgunj &bull; Biratnagar &bull; Chitwan &bull; Butwal</strong>
            </span>
            <span style={{ color: 'var(--border-medium)', flexShrink: 0 }} className="ticker-hide-md">|</span>
            <span className="ticker-hide-md" style={{ whiteSpace: 'nowrap', color: 'var(--brand-amber)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe2 size={12} /> International Cross-Border: <strong style={{ color: '#ffffff', background: 'rgba(245, 158, 11, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>Coming Soon</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--brand-orange)', fontWeight: 600, fontSize: '0.72rem' }} className="ticker-hide-sm">
              <Radio size={12} className="animate-pulse" /> 24/7 Dispatch Control
            </span>

            {/* Profile Section moved into Top Bar */}
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setProfileDrawerOpen(true)}
                  title="Open Account Control & All Portals"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: currentUser.role === 'admin' ? '1px solid rgba(255, 102, 0, 0.45)' : '1px solid rgba(6, 182, 212, 0.45)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: currentUser.role === 'admin' ? 'linear-gradient(135deg, #ff6600 0%, #b45309 100%)' : 'linear-gradient(135deg, #06b6d4 0%, #0d9488 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', lineHeight: 1.1 }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#ffffff' }}>
                        {currentUser.name}
                      </span>
                      <span className={currentUser.role === 'admin' ? 'badge badge-orange' : 'badge badge-cyan'} style={{ fontSize: '0.56rem', padding: '0.04rem 0.3rem' }}>
                        {currentUser.role === 'admin' ? 'ADMIN' : 'MERCHANT'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.62rem', color: currentUser.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-cyan)', marginTop: '1px' }}>
                      My Profile &bull; All Portals ▾
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                  title="Sign Out"
                  style={{ padding: '0.25rem 0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, height: '26px' }}
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setProfileDrawerOpen(true)}
                style={{
                  fontSize: '0.7rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                <Lock size={12} />
                <span>Portal Login ▾</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar Row */}
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4.75rem',
        gap: '1.25rem',
        flexWrap: 'nowrap'
      }}>
        {/* Brand Logo - Strictly Non-Wrapping & Fixed */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textDecoration: 'none',
          flexShrink: 0,
          whiteSpace: 'nowrap'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff6600 0%, #b33900 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(255, 102, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: '#ffffff',
              letterSpacing: '-1px'
            }}>7</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', whiteSpace: 'nowrap' }}>
                DOUBLE <span style={{ color: 'var(--brand-orange)' }}>7</span>
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                letterSpacing: '0.08em',
                color: 'var(--brand-cyan)',
                whiteSpace: 'nowrap'
              }}>LOGISTICS</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              Nepal Nationwide &bull; International Coming Soon
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-desktop-links" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {/* Authenticated Internal Operations: Dashboard & My/All Bookings (Only visible when logged in) */}
          {currentUser && (
            <>
              {/* Priority 1: Dashboard */}
              <Link
                href="/dashboard"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Cpu size={14} color="var(--brand-cyan)" />
                <span>Dashboard</span>
              </Link>

              {/* Priority 2: Bookings Registry (My Bookings for merchant, All Bookings for admin) */}
              <Link
                href="/bookings"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'rgba(255, 102, 0, 0.12)',
                  border: '1px solid rgba(255, 102, 0, 0.35)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Boxes size={14} color="var(--brand-orange)" />
                <span>{currentUser.role === 'admin' ? 'All Bookings' : 'My Bookings'}</span>
              </Link>

              {/* Priority 3: Dedicated Admin or Merchant Console */}
              {currentUser.role === 'admin' ? (
                <Link
                  href="/admin"
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: 'rgba(255, 102, 0, 0.18)',
                    border: '1px solid rgba(255, 102, 0, 0.5)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <ShieldCheck size={14} color="var(--brand-orange)" />
                  <span>Admin Tools</span>
                </Link>
              ) : (
                <Link
                  href="/merchant"
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: 'rgba(6, 182, 212, 0.18)',
                    border: '1px solid rgba(6, 182, 212, 0.5)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <Building size={14} color="var(--brand-cyan)" />
                  <span>Merchant Tools</span>
                </Link>
              )}
            </>
          )}

          {/* Priority 3: Book Cargo */}
          <Link
            href={currentUser ? "/book" : "/login?redirect=/book"}
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Truck size={14} color="var(--text-muted)" />
            <span>Book Cargo</span>
          </Link>

          {/* Priority 4: Tracking Center */}
          <Link
            href="/track"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <span>Tracking Center</span>
          </Link>

          {/* Priority 5: Rates & Tariffs */}
          <Link href="/rates" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Rates &amp; Tariffs
          </Link>

          {/* Priority 6: Support */}
          <Link href="/support" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Support
          </Link>

          {/* Priority 7: About & Founder */}
          <Link href="/about" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            About &amp; Founder
          </Link>
        </nav>

        {/* Right Action Bar: Quick Track + Auth + CTA */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
          whiteSpace: 'nowrap'
        }}>
          {/* Quick Track Input - Collapses cleanly on smaller viewports */}
          <form onSubmit={handleQuickTrack} className="nav-search-desktop" style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <input
              type="text"
              placeholder="Track AWB # (e.g. CP002994035NP)"
              value={quickTrackId}
              onChange={(e) => setQuickTrackId(e.target.value)}
              style={{
                background: 'rgba(18, 27, 48, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.55rem 2.25rem 0.55rem 0.85rem',
                fontSize: '0.82rem',
                color: '#ffffff',
                width: '190px',
                outline: 'none',
                fontFamily: 'var(--font-mono)'
              }}
            />
            <button
              type="submit"
              aria-label="Search Tracking ID"
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--brand-orange)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Search size={15} />
            </button>
          </form>

          {/* Main Navbar Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            {!currentUser && (
              <Link
                href="/login"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                <UserIcon size={14} />
                <span>Login / Sign In</span>
              </Link>
            )}

            <Link
              href={currentUser ? "/book" : "/login?redirect=/book"}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              <span>{currentUser ? "+ Book Cargo" : "Ship Now"}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="nav-mobile-toggle"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '0.55rem',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-medium)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {currentUser ? (
            <div style={{
              padding: '0.85rem 1rem',
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser.email} &bull; {currentUser.company}</div>
                <div style={{ fontSize: '0.72rem', color: currentUser.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-cyan)', marginTop: '0.2rem' }}>
                  Role: {currentUser.subRole || (currentUser.role === 'admin' ? 'Super Admin' : 'Merchant Consignor')}
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setProfileDrawerOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                My Profile ▾
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'center', gap: '0.4rem' }}
            >
              <UserIcon size={14} /> Sign In / Register
            </Link>
          )}

          <form onSubmit={handleQuickTrack} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Track AWB # (e.g. CP002994035NP)"
              value={quickTrackId}
              onChange={(e) => setQuickTrackId(e.target.value)}
              className="input-field"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Track
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.25rem' }}>
            {currentUser && (
              <>
                {/* Priority 1: Dashboard */}
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '0.6rem 0', color: 'var(--brand-cyan)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Cpu size={16} /> Operations Dashboard
                </Link>

                {/* Priority 2: All Bookings / My Bookings */}
                <Link
                  href="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '0.6rem 0', color: 'var(--brand-orange)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Boxes size={16} /> {currentUser.role === 'admin' ? 'All Bookings (Registry)' : 'My Bookings (Registry)'}
                </Link>

                {/* Priority 3: Admin Tools or Merchant Tools */}
                {currentUser.role === 'admin' ? (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: '0.6rem 0', color: 'var(--brand-orange)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <ShieldCheck size={16} /> Admin Tools &amp; Control Tower
                  </Link>
                ) : (
                  <Link
                    href="/merchant"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: '0.6rem 0', color: 'var(--brand-cyan)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <Building size={16} /> Merchant Tools &amp; Staff Hub
                  </Link>
                )}
              </>
            )}

            {/* Priority 3: Book Cargo */}
            <Link
              href={currentUser ? "/book" : "/login?redirect=/book"}
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '0.6rem 0', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Truck size={16} /> Book Cargo
            </Link>

            {/* Priority 4: Tracking Center */}
            <Link
              href="/track"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '0.6rem 0', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Search size={16} /> Tracking Center
            </Link>

            {/* Priority 5: Rates & Tariffs */}
            <Link
              href="/rates"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '0.6rem 0', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              Rates &amp; Tariffs
            </Link>

            {/* Priority 6: Support */}
            <Link
              href="/support"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '0.6rem 0', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              Customer Support
            </Link>

            {/* Priority 7: About */}
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '0.6rem 0', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              About Double 7 &amp; Founder
            </Link>
          </div>
        </div>
      )}

      {/* Render Profile and Relative Portals Drawer */}
      <ProfilePortalDrawer
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        currentUser={currentUser}
      />

      {/* Breakpoint Style Rules */}
      <style jsx global>{`
        /* Hide search on widths under 1280px to prevent crowding */
        @media (max-width: 1280px) {
          .nav-search-desktop {
            display: none !important;
          }
          .ticker-hide-md {
            display: none !important;
          }
        }

        /* Responsive tablet breakpoint: when window is < 1080px or zoomed in, switch to drawer */
        @media (max-width: 1080px) {
          .nav-desktop-links {
            display: none !important;
          }
          .nav-mobile-toggle {
            display: flex !important;
          }
          .nav-user-details {
            display: none !important;
          }
        }

        /* Mobile ticker hide */
        @media (max-width: 700px) {
          .ticker-hide-sm {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
