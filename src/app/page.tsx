'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Boxes,
  Banknote,
  Search,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Globe2
} from 'lucide-react';
import { getCurrentUser, User } from '../lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handleAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth-change', handleAuth);
    return () => window.removeEventListener('auth-change', handleAuth);
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    router.push(`/track?id=${encodeURIComponent(trackingId.trim())}`);
  };

  return (
    <div>
      {/* ================= HERO SECTION ================= */}
      <section style={{
        padding: '4.5rem 0 3.5rem 0',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="container">
          <div className="hero-grid">
            {/* Left Col: Headings & Quick Tracker */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--brand-orange)',
                background: 'rgba(255, 102, 0, 0.1)',
                border: '1px solid rgba(255, 102, 0, 0.25)',
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
              }}>
                <Zap size={14} />
                <span>Nepal Domestic Logistics &bull; All 7 Provinces</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: '1.25rem',
              }}>
                Fast, reliable logistics across{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #ff6600 0%, #ffa94d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Nepal
                </span>.
              </h1>

              <p style={{
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '2rem',
                maxWidth: '620px',
              }}>
                Same-day Kathmandu Valley dispatch, 24-hour intercity express linehauls, and Cash on Delivery (COD) across all 77 districts.
              </p>

              {/* Clean Instant Tracking Box */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-md)',
                maxWidth: '620px',
                marginBottom: '1.5rem',
              }}>
                <form onSubmit={handleTrackSubmit} className="hero-tracking-form" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter Tracking Number (e.g. CP002994035NP)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.95rem',
                      padding: '0.75rem 1rem',
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>Track</span>
                    <ArrowRight size={16} />
                  </button>
                </form>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  marginTop: '0.85rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  flexWrap: 'wrap',
                }}>
                  <span>Need to ship cargo?</span>
                  <Link
                    href={currentUser ? "/book" : "/login?redirect=/book"}
                    style={{ color: 'var(--brand-orange)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Book Consignment &rarr;
                  </Link>
                  <Link
                    href="/rates"
                    style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                  >
                    Calculate Rates &rarr;
                  </Link>
                </div>
              </div>

              {/* Clean Features Checklist */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                flexWrap: 'wrap',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="var(--brand-emerald)" /> 77 Districts Covered
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="var(--brand-emerald)" /> 24h Intercity Linehaul
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="var(--brand-emerald)" /> Next-Day COD Remittance
                </span>
              </div>
            </div>

            {/* Right Col: Clean Hero Image */}
            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              }}>
                <img
                  src="/images/hero.jpg"
                  alt="Double 7 Logistics Hub Terminal"
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= METRICS STRIP ================= */}
      <section style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '2rem 0',
      }}>
        <div className="container">
          <div className="grid grid-cols-4 gap-6">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                77
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Districts Covered
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-cyan)', fontFamily: 'var(--font-mono)' }}>
                6 HRS
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Valley Express Rush
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)' }}>
                24 HRS
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Intercity Linehaul SLA
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-emerald)', fontFamily: 'var(--font-mono)' }}>
                100%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Automated COD Remittance
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE SERVICES ================= */}
      <section style={{ padding: '4.5rem 0', borderBottom: '1px solid var(--border-subtle)' }} id="services">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              Our Core Logistics Services
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto', fontSize: '0.98rem' }}>
              Engineered for e-commerce brands, manufacturers, distributors, and merchants across Nepal.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Service 1: Express Courier */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(255, 102, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-orange)',
                marginBottom: '1.25rem',
              }}>
                <Truck size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Nepal Express Courier</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                Same-day delivery within Kathmandu Valley and guaranteed 24-hour intercity linehauls to Pokhara, Biratnagar, Birgunj, Chitwan, and Butwal.
              </p>
              <Link
                href={currentUser ? "/book?service=EXP" : "/login?redirect=/book"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--brand-orange)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                <span>Book Express Delivery</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Service 2: Nationwide Cargo */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(6, 182, 212, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-cyan)',
                marginBottom: '1.25rem',
              }}>
                <Boxes size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Nationwide Hub Cargo</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                Dedicated bulk linehaul freight connecting East-West corridors. Built for bulky goods, wholesale orders, and retail inventory distribution.
              </p>
              <Link
                href={currentUser ? "/book?service=CARGO" : "/login?redirect=/book"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--brand-cyan)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                <span>Book Hub Cargo</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Service 3: Cash on Delivery (COD) */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-emerald)',
                marginBottom: '1.25rem',
              }}>
                <Banknote size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>E-Commerce COD</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                Automated Cash on Delivery management with next-day direct bank settlement, customer OTP verification, and dedicated merchant ledger.
              </p>
              <Link
                href={currentUser ? "/merchant" : "/login"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--brand-emerald)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                <span>Merchant COD Portal</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION ================= */}
      <section style={{ padding: '4.5rem 0' }}>
        <div className="container-narrow">
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '1.9rem', marginBottom: '0.75rem' }}>
              Ready to ship across Nepal?
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              maxWidth: '520px',
              margin: '0 auto 1.75rem auto',
            }}>
              Sign in to your merchant account to generate waybills, schedule pickups, and track packages in real-time.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                href={currentUser ? "/book" : "/login?redirect=/book"}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                <span>{currentUser ? "Book Consignment" : "Sign In to Ship"}</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/track"
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                <span>Track a Shipment</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .grid-cols-4 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem !important;
          }
          .grid-cols-3 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
