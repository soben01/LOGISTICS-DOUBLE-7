'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Truck,
  ShieldCheck,
  Building,
  Cpu,
  Settings as SettingsIcon,
  ChevronDown,
  MapPin,
  Boxes
} from 'lucide-react';
import { getCurrentUser, logoutUser, User } from '../../lib/auth';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setAccountDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push('/');
  };

  if (pathname?.startsWith('/operations')) {
    return null;
  }

  const navLinks = [
    ...(currentUser ? [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/operations', label: 'Operations Desk' },
      { href: '/bookings', label: 'Bookings' },
      ...(currentUser.role === 'admin' || currentUser.role === 'branch' ? [
        { href: '/manifest', label: 'Manifest' }
      ] : []),
    ] : []),
    { href: '/track', label: 'Track' },
    { href: currentUser ? '/book' : '/login?redirect=/book', label: 'Book Cargo' },
    { href: '/rates', label: 'Rates' },
    { href: '/support', label: 'Support' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(7, 10, 18, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      width: '100%',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4.25rem',
        gap: '1.5rem',
      }}>
        {/* Brand Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          textDecoration: 'none',
          flexShrink: 0,
        }}>
          <img
            src="/images/logo.png"
            alt="Double 7"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              objectFit: 'cover',
              boxShadow: '0 2px 10px rgba(255, 102, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              fontSize: '1.18rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}>
              DOUBLE <span style={{ color: 'var(--brand-orange)' }}>7</span>
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              letterSpacing: '0.06em',
            }}>
              LOGISTICS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-desktop-links" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.75rem',
        }}>
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          {currentUser ? (
            <div
              ref={dropdownRef}
              className="nav-account-capsule-wrapper"
              style={{ position: 'relative' }}
            >
              <div
                className="nav-account-capsule"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: accountDropdownOpen ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.05)',
                  border: accountDropdownOpen ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '30px',
                  padding: '3px 4px 3px 10px',
                  gap: '0.45rem',
                  userSelect: 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {/* Profile Trigger (Desktop) */}
                <button
                  type="button"
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="nav-user-desktop"
                  title="Account Menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck size={15} color="var(--brand-orange)" />
                  ) : currentUser.role === 'branch' ? (
                    <MapPin size={15} color="#c084fc" />
                  ) : (
                    <Building size={15} color="var(--brand-cyan)" />
                  )}
                  <span>{currentUser.name.split(' ')[0]}</span>
                  <span
                    className={currentUser.role === 'admin' ? 'badge badge-orange' : (currentUser.role === 'branch' ? 'badge badge-purple' : 'badge badge-cyan')}
                    style={{ fontSize: '0.6rem', padding: '0.08rem 0.4rem' }}
                  >
                    {currentUser.role === 'admin' ? 'Admin' : (currentUser.role === 'branch' ? 'Branch' : 'Merchant')}
                  </span>
                  <ChevronDown
                    size={13}
                    style={{
                      transform: accountDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.18s ease',
                      opacity: 0.75,
                      marginLeft: '-2px',
                    }}
                  />
                </button>

                {/* Profile Trigger (Mobile Compact) */}
                <button
                  type="button"
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="nav-user-mobile"
                  title="Account Menu"
                  style={{
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck size={14} color="var(--brand-orange)" />
                  ) : currentUser.role === 'branch' ? (
                    <MapPin size={14} color="#c084fc" />
                  ) : (
                    <Building size={14} color="var(--brand-cyan)" />
                  )}
                  <span>{currentUser.role === 'admin' ? 'Admin' : (currentUser.role === 'branch' ? 'Branch' : currentUser.name.split(' ')[0])}</span>
                  <ChevronDown
                    size={12}
                    style={{
                      transform: accountDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.18s ease',
                      opacity: 0.75,
                    }}
                  />
                </button>

                {/* Subtle Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  }}
                />

                {/* Direct Sign Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out (Log Out)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#f87171',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>

              {/* Floating Dropdown Menu (Strictly Settings & Tools - NO Dashboard) */}
              {accountDropdownOpen && (
                <div
                  className="nav-account-dropdown"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '240px',
                    backgroundColor: '#0a0f1d',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '0.65rem',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  {/* Dropdown Header */}
                  <div style={{
                    padding: '0.55rem 0.75rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '0.2rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                        {currentUser.name}
                      </span>
                      <span className={currentUser.role === 'admin' ? 'badge badge-orange' : (currentUser.role === 'branch' ? 'badge badge-purple' : 'badge badge-cyan')} style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>
                        {currentUser.role === 'admin' ? 'Admin' : (currentUser.role === 'branch' ? 'Branch Hub' : 'Merchant')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentUser.company || currentUser.email}
                    </div>
                  </div>

                  {/* Branch Role Specific Options */}
                  {currentUser.role === 'branch' && (
                    <>
                      <Link
                        href="/manifest"
                        onClick={() => setAccountDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(168, 85, 247, 0.08)',
                          border: '1px solid rgba(168, 85, 247, 0.25)',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <Boxes size={16} color="#c084fc" />
                        <span>Branch Manifest Hub</span>
                      </Link>

                      <Link
                        href="/bookings"
                        onClick={() => setAccountDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          color: '#cbd5e1',
                          textDecoration: 'none',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <Truck size={16} color="var(--brand-cyan)" />
                        <span>Consignment Registry</span>
                      </Link>
                    </>
                  )}

                  {/* Admin Role Specific Options */}
                  {currentUser.role === 'admin' && (
                    <>
                      <Link
                        href="/admin"
                        onClick={() => setAccountDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          transition: 'background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                      >
                        <ShieldCheck size={16} color="var(--brand-orange)" />
                        <span>Admin Tools</span>
                      </Link>

                      <Link
                        href="/manifest"
                        onClick={() => setAccountDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          color: '#cbd5e1',
                          textDecoration: 'none',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          transition: 'background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                      >
                        <Boxes size={16} color="#c084fc" />
                        <span>Branch Manifests</span>
                      </Link>

                      <Link
                        href="/admin?section=settings"
                        onClick={() => setAccountDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          color: '#cbd5e1',
                          textDecoration: 'none',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          transition: 'background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                      >
                        <SettingsIcon size={16} color="#94a3b8" />
                        <span>Settings</span>
                      </Link>
                    </>
                  )}

                  {/* Merchant Role Specific Options */}
                  {currentUser.role === 'merchant' && (
                    <>
                      <Link
                        href="/merchant"
                        onClick={() => setAccountDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          transition: 'background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                      >
                        <Building size={16} color="var(--brand-cyan)" />
                        <span>Merchant Tools</span>
                      </Link>

                      <Link
                        href="/merchant?tab=profile_api"
                        onClick={() => setAccountDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          color: '#cbd5e1',
                          textDecoration: 'none',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          transition: 'background var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                      >
                        <SettingsIcon size={16} color="#94a3b8" />
                        <span>Settings</span>
                      </Link>
                    </>
                  )}

                  {/* Subtle Divider */}
                  <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '0.2rem 0' }} />

                  {/* 3. Sign Out */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      color: '#f87171',
                      background: 'rgba(239, 68, 68, 0.06)',
                      border: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.14)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.06)')}
                  >
                    <LogOut size={16} color="#f87171" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link
                href="/login"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  padding: '0.4rem 0.75rem',
                }}
              >
                Log In
              </Link>

              <Link
                href="/login?redirect=/book"
                className="btn btn-primary btn-sm"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.45rem 1rem',
                }}
              >
                <span>Ship Now</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="nav-mobile-toggle"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          animation: 'slideDownDrawer 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-medium)',
          padding: '1.25rem 1.25rem 1.5rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {currentUser ? (
            <div style={{
              padding: '0.85rem',
              background: 'var(--bg-surface)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{currentUser.company || currentUser.email}</div>
                </div>
                <span className={currentUser.role === 'admin' ? 'badge badge-orange' : 'badge badge-cyan'} style={{ fontSize: '0.65rem' }}>
                  {currentUser.role === 'admin' ? 'Admin' : 'Merchant'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.15rem' }}>
                <Link
                  href={currentUser.role === 'admin' ? '/admin' : '/merchant'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.6rem' }}
                >
                  {currentUser.role === 'admin' ? <ShieldCheck size={14} color="var(--brand-orange)" /> : <Building size={14} color="var(--brand-cyan)" />}
                  <span>{currentUser.role === 'admin' ? 'Admin Tools' : 'Merchant Tools'}</span>
                </Link>
                <Link
                  href={currentUser.role === 'admin' ? '/admin?section=settings' : '/merchant?tab=profile_api'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.6rem' }}
                >
                  <SettingsIcon size={14} color="#94a3b8" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Log In
              </Link>
              <Link
                href="/login?redirect=/book"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Ship Now
              </Link>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.8rem' }}>
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '0.45rem 0',
                  color: pathname === item.href ? 'var(--brand-orange)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            ))}

            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                <LogOut size={16} /> Sign Out of {currentUser.name}
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .nav-account-capsule {
          display: inline-flex;
          align-items: center;
          transition: all 0.2s ease;
        }
        .nav-account-capsule:hover {
          border-color: rgba(255, 255, 255, 0.22) !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .nav-user-desktop {
          display: flex;
        }
        .nav-user-mobile {
          display: none;
        }
        @media (max-width: 1040px) {
          .nav-desktop-links {
            display: none !important;
          }
          .nav-desktop-auth {
            display: none !important;
          }
          .nav-user-desktop {
            display: none !important;
          }
          .nav-user-mobile {
            display: flex !important;
          }
          .nav-mobile-toggle {
            display: flex !important;
          }
          .nav-account-capsule {
            padding: 2px 3px 2px 7px !important;
            gap: 0.35rem !important;
          }
        }
      `}</style>
    </header>
  );
}
