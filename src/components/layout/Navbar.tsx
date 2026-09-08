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
  Cpu
} from 'lucide-react';
import { getCurrentUser, logoutUser, User } from '../../lib/auth';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setMobileMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
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
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #ff6600 0%, #d9480f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(255, 102, 0, 0.35)',
          }}>
            <span style={{
              fontSize: '1.15rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: '#ffffff',
            }}>7</span>
          </div>

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

          {/* If authenticated, link to Bookings */}
          {currentUser && (
            <Link
              href="/bookings"
              style={{
                fontSize: '0.9rem',
                fontWeight: pathname === '/bookings' ? 700 : 500,
                color: pathname === '/bookings' ? '#ffffff' : 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              Bookings
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                href={currentUser.role === 'admin' ? '/admin' : '/merchant'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {currentUser.role === 'admin' ? (
                  <ShieldCheck size={15} color="var(--brand-orange)" />
                ) : (
                  <Building size={15} color="var(--brand-cyan)" />
                )}
                <span>{currentUser.name.split(' ')[0]}</span>
                <span className={currentUser.role === 'admin' ? 'badge badge-orange' : 'badge badge-cyan'} style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>
                  {currentUser.role === 'admin' ? 'Admin' : 'Merchant'}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="btn btn-outline btn-sm"
                style={{
                  padding: '0.35rem 0.55rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '34px',
                }}
              >
                <LogOut size={14} />
              </button>
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
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{currentUser.email}</div>
              </div>
              <Link
                href={currentUser.role === 'admin' ? '/admin' : '/merchant'}
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary btn-sm"
              >
                Portal →
              </Link>
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
              <>
                <Link
                  href="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '0.45rem 0', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}
                >
                  Bookings Registry
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '0.45rem 0', color: 'var(--brand-cyan)', fontWeight: 600, fontSize: '0.95rem' }}
                >
                  Operations Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-red)',
                    padding: '0.45rem 0',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 900px) {
          .nav-desktop-links {
            display: none !important;
          }
          .nav-desktop-auth {
            display: none !important;
          }
          .nav-mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
