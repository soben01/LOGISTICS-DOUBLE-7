'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plane,
  Ship,
  Truck,
  Boxes,
  ShieldCheck,
  Zap,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  Globe2,
  ChevronRight,
  Sparkles,
  Layers,
  Banknote,
  Building
} from 'lucide-react';
import { getCurrentUser, User } from '../lib/auth';
import { addWaitlistSubscriber } from '../lib/store';

export default function HomePage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
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


  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    addWaitlistSubscriber(waitlistEmail.trim());
    setWaitlistSuccess(true);
  };

  return (
    <div>
      {/* ================= HERO SECTION ================= */}
      <section style={{
        position: 'relative',
        padding: '5rem 0 4.5rem 0',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {/* Ambient background glow */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '750px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(255, 102, 0, 0.12) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '3.5rem', alignItems: 'center' }} className="hero-grid">
            {/* Left Col: Headings & Quick Tracker */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }} className="badge badge-orange">
                <Zap size={13} />
                <span>NEPAL DOMESTIC LOGISTICS &bull; ALL 7 PROVINCES ACTIVE</span>
              </div>

              <h1 style={{ marginBottom: '1.25rem' }}>
                Unstoppable Cargo Speed Across{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #ff6600 0%, #ff944d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Nepal</span>.
              </h1>

              <p style={{ fontSize: '1.12rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '750px' }}>
                Next-generation domestic logistics network powering high-velocity e-commerce, same-day Kathmandu Valley dispatch, 24-hour intercity linehauls, and Cash on Delivery (COD) across all 77 districts. International cross-border cargo expanding soon.
              </p>

              {/* Instant Tracking Box */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', width: '100%' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Search size={15} color="var(--brand-orange)" />
                  <span>TRACK DOMESTIC CONSIGNMENT OR WAYBILL (AWB)</span>
                </div>

                <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter Tracking # (e.g. CP002994035NP)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    style={{ flex: 1, minWidth: '220px', fontFamily: 'var(--font-mono)', fontSize: '1rem', padding: '0.85rem 1.1rem' }}
                  />
                  <button type="submit" className="btn btn-primary btn-lg" style={{ padding: '0.85rem 1.5rem' }}>
                    <span>Track Now</span>
                    <ArrowRight size={16} />
                  </button>
                </form>

                {/* D1 Database Tracking Telemetry Indicator */}
                <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Instant Telemetry Tracking connected to Cloudflare D1 Database
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="var(--brand-emerald)" /> All 77 Districts Covered
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="var(--brand-emerald)" /> Same-Day &amp; 24h Delivery SLA
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="var(--brand-emerald)" /> Automated Merchant COD Remittance
                </span>
              </div>
            </div>

            {/* Right Col: Hero Graphic Card with Live Telemetry Overlay */}
            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
                position: 'relative'
              }}>
                <img
                  src="/images/hero.jpg"
                  alt="Double 7 Logistics Hub Terminal"
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                />

                {/* Glassmorphic Live Telemetry Overlay Card */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  background: 'rgba(9, 13, 24, 0.88)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '12px',
                  padding: '1.15rem 1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ACTIVE DISPATCH</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>BA-2-PA-8892</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--brand-cyan)' }}>Electric Courier Van</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ROUTE TRANSIT</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>KTM &rarr; PKR</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--brand-emerald)' }}>Prithvi Highway (On Time)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NETWORK CAPACITY</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>100% SLA</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--brand-orange)' }}>Nepal All 7 Provinces</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= LIVE METRICS STRIP ================= */}
      <section style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '2.5rem 0'
      }}>
        <div className="container">
          <div className="grid grid-cols-4 gap-6">
            <div className="metric-pill">
              <div className="metric-number">99.8%</div>
              <div className="metric-label">On-Time Delivery SLA</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Across Kathmandu &amp; major cities</div>
            </div>

            <div className="metric-pill">
              <div className="metric-number">77</div>
              <div className="metric-label">Districts Covered</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Complete nationwide reach</div>
            </div>

            <div className="metric-pill">
              <div className="metric-number" style={{ color: 'var(--brand-cyan)' }}>6 HRS</div>
              <div className="metric-label">Same-Day Valley Rush</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Kathmandu, Lalitpur, Bhaktapur</div>
            </div>

            <div className="metric-pill">
              <div className="metric-number" style={{ color: '#ffffff' }}>7</div>
              <div className="metric-label">Provinces Connected</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Daily express linehaul runs</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE SERVICES SECTION ================= */}
      <section style={{ padding: '5.5rem 0', borderBottom: '1px solid var(--border-subtle)' }} id="services">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="badge badge-orange" style={{ marginBottom: '0.75rem' }}>
                <Layers size={13} /> High-Velocity Logistics
              </div>
              <h2>Domestic Across Nepal &bull; International Coming Soon</h2>
            </div>
            <Link href="/rates" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>View All Rates &amp; Tariffs</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {/* Service 1: Double 7 Nepal Express */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 102, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-orange)',
                marginBottom: '1.25rem'
              }}>
                <Truck size={24} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>100% ACTIVE</span>
              </div>
              <h3>Double 7 Nepal Express</h3>
              <p style={{ margin: '0.75rem 0 1.25rem 0', fontSize: '0.92rem' }}>
                Same-Day dispatch in Kathmandu Valley and 24-hour intercity linehauls to Pokhara, Birgunj, Biratnagar, Chitwan, and Butwal with real-time GPS tracking.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-orange)" /> 24h Guaranteed Intercity SLA
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-orange)" /> Electric Express Vans &amp; Riders
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-orange)" /> Free Doorstep Merchant Pickup
                </li>
              </ul>
              <Link
                href={currentUser ? "/book?service=EXP" : "/login?redirect=/book"}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
              >
                {currentUser ? "Book Express \u2192" : "Login to Dispatch \u2192"}
              </Link>
            </div>

            {/* Service 2: Nationwide Hub Cargo */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-cyan)',
                marginBottom: '1.25rem'
              }}>
                <Boxes size={24} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>77 DISTRICTS</span>
              </div>
              <h3>Nationwide Hub Cargo</h3>
              <p style={{ margin: '0.75rem 0 1.25rem 0', fontSize: '0.92rem' }}>
                Dedicated freight linehauls connecting East-West Highway corridors. Engineered for bulky shipments, electronics, wholesale inventory, and manufacturing goods.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-cyan)" /> Complete All-Province Coverage
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-cyan)" /> Bulk Freight Discount Pricing
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-cyan)" /> Barcoded Warehouse Cross-Docking
                </li>
              </ul>
              <Link
                href={currentUser ? "/book?service=CARGO" : "/login?redirect=/book"}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
              >
                {currentUser ? "Book Cargo \u2192" : "Login to Dispatch \u2192"}
              </Link>
            </div>

            {/* Service 3: E-Commerce Cash on Delivery (COD) */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-emerald)',
                marginBottom: '1.25rem'
              }}>
                <Banknote size={24} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>COD SPECIALIST</span>
              </div>
              <h3>E-Commerce COD Network</h3>
              <p style={{ margin: '0.75rem 0 1.25rem 0', fontSize: '0.92rem' }}>
                Automated Cash on Delivery management with next-day bank remittance, real-time OTP delivery verification, and low return rates for online stores.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-emerald)" /> Next-Day Direct Bank Remittance
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-emerald)" /> Customer Phone &amp; OTP Verification
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-emerald)" /> Return &amp; Exchange Handling
                </li>
              </ul>
              <Link
                href={currentUser ? "/merchant" : "/login"}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
              >
                {currentUser ? "Merchant COD Portal \u2192" : "Login \u2192"}
              </Link>
            </div>

            {/* Service 4: International Cross-Border Cargo (COMING SOON) */}
            <div className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.06) 0%, rgba(13, 20, 36, 0.6) 100%)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000000',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                letterSpacing: '0.05em'
              }}>
                COMING SOON
              </div>

              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-amber)',
                marginBottom: '1.25rem'
              }}>
                <Globe2 size={24} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-orange" style={{ fontSize: '0.68rem' }}>GLOBAL EXPANSION</span>
              </div>
              <h3>International Air Freight</h3>
              <p style={{ margin: '0.75rem 0 1.25rem 0', fontSize: '0.92rem' }}>
                Dedicated cross-border air cargo charter connecting Tribhuvan International Airport (TIA) to Dubai, India, China, and Western markets. Launching Q4 2026.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-amber)" /> Nepal Customs Pre-Clearance
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-amber)" /> Direct Air Cargo Charters
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--brand-amber)" /> Door-to-Door Global Forwarding
                </li>
              </ul>
              <a href="#international-waitlist" className="btn btn-outline btn-sm" style={{ marginTop: 'auto', borderColor: 'var(--brand-amber)', color: 'var(--brand-amber)' }}>
                Pre-Register for Launch &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERNATIONAL EXPANSION WAITLIST BANNER ================= */}
      <section style={{ padding: '4.5rem 0', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }} id="international-waitlist">
        <div className="container-narrow">
          <div className="glass-panel" style={{
            padding: '3rem 2.5rem',
            textAlign: 'center',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.08) 0%, rgba(13, 20, 36, 0.95) 70%)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--brand-amber)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1rem'
            }}>
              <Globe2 size={14} />
              <span>GLOBAL CORRIDOR &bull; INTERNATIONAL COMING SOON</span>
            </div>

            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
              Expanding Nepal&apos;s Exporters to Global Gateways
            </h2>

            <p style={{ maxWidth: '640px', margin: '0 auto 2rem auto', color: 'var(--text-secondary)', fontSize: '1rem' }}>
              While our domestic fleet handles 100% of Nepal nationwide, our international air cargo division is completing aviation licensing and customs integrations for Q4 2026. Pre-register your business for early access and preferential charter tariffs.
            </p>

            {waitlistSuccess ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '1rem 1.5rem',
                maxWidth: '520px',
                margin: '0 auto',
                color: 'var(--brand-emerald)',
                fontWeight: 600
              }}>
                &check; Thank you! Your merchant account has been registered for International Pilot Priority. We will notify you before launch.
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: '520px', margin: '0 auto', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="Enter company email for international access..."
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, minWidth: '240px' }}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  <span>Get Early Access</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION ================= */}
      <section style={{ padding: '6rem 0' }}>
        <div className="container-narrow">
          <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #ff6600, #06b6d4, #10b981)'
            }} />

            <div className="badge badge-orange" style={{ marginBottom: '1rem' }}>
              <Zap size={13} /> START DISPATCHING TODAY
            </div>

            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>
              Ready to Accelerate Your Domestic Logistics?
            </h2>

            <p style={{ maxWidth: '580px', margin: '0 auto 2rem auto', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
              Sign in to your verified Nepal merchant portal to book consignments across all 7 provinces, generate instant waybills, and automate Cash on Delivery remittance.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                href={currentUser ? "/book" : "/login?redirect=/book"}
                className="btn btn-primary btn-lg"
              >
                <span>{currentUser ? "Book New Consignment" : "Sign In to Book Shipment"}</span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/track" className="btn btn-secondary btn-lg">
                <Search size={16} />
                <span>Track Existing Consignment</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 1080px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
