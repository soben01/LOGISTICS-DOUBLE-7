'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Globe2,
  Calculator,
  Clock,
  MapPin,
  Phone,
  ChevronRight,
  Award,
  Sparkles,
  Smartphone,
  Check,
  HelpCircle,
  Layers,
  Cpu,
  Activity,
  RefreshCw,
  ExternalLink,
  Printer,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { getCurrentUser, User } from '../lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Rate Estimator State
  const [originCity, setOriginCity] = useState('Kathmandu');
  const [destCity, setDestCity] = useState('Pokhara');
  const [weightKg, setWeightKg] = useState(3);
  const [serviceSpeed, setServiceSpeed] = useState<'express' | 'standard'>('express');
  const [declaredValue, setDeclaredValue] = useState(2500);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Phone Frame Interactive Preview State
  const [phoneTab, setPhoneTab] = useState<'feed' | 'remittance' | 'actions'>('feed');

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

  // Instant Rate Calculation Logic
  const rateCalculation = useMemo(() => {
    const isValleyToValley = originCity === 'Kathmandu' && (destCity === 'Lalitpur' || destCity === 'Bhaktapur');
    const isRemote = ['Jumla', 'Surkhet', 'Dhangadhi', 'Ilam'].includes(destCity);

    let baseRate = isValleyToValley ? 80 : 130;
    let perKgRate = isValleyToValley ? 20 : 35;

    if (serviceSpeed === 'express') {
      baseRate += 50;
      perKgRate += 15;
    }

    if (isRemote) {
      baseRate += 80;
      perKgRate += 20;
    }

    const calculatedFreight = baseRate + Math.max(0, weightKg - 1) * perKgRate;
    const codProcessingFee = Math.round(declaredValue * 0.01);
    const totalEstimate = calculatedFreight + codProcessingFee;

    const transitHours = isValleyToValley ? (serviceSpeed === 'express' ? '4-6 Hours' : 'Same-Day (12 Hours)')
      : serviceSpeed === 'express' ? '18-24 Hours (Next Morning)' : '24-48 Hours';

    return {
      freight: calculatedFreight,
      codFee: codProcessingFee,
      total: totalEstimate,
      transitHours,
      slaText: serviceSpeed === 'express' ? 'Overnight Express Linehaul' : 'Standard Highway Freight'
    };
  }, [originCity, destCity, weightKg, serviceSpeed, declaredValue]);

  const nepaliCities = [
    'Kathmandu',
    'Pokhara',
    'Biratnagar',
    'Birgunj',
    'Butwal',
    'Chitwan (Bharatpur)',
    'Nepalgunj',
    'Dhangadhi',
    'Itahari',
    'Hetauda',
    'Dharan',
    'Surkhet',
    'Janakpur',
    'Lalitpur',
    'Bhaktapur'
  ];

  const provinces = [
    { id: 1, name: 'Koshi Province', hub: 'Biratnagar / Itahari Hub', sla: '24-36 Hours', status: 'Optimal', corridors: 'E-W Highway & Mechi Linehaul' },
    { id: 2, name: 'Madhesh Province', hub: 'Birgunj / Janakpur Hub', sla: '20-24 Hours', status: 'Optimal', corridors: 'Tribhuvan Highway Corridor' },
    { id: 3, name: 'Bagmati Province', hub: 'Kathmandu Central Sorting Hub', sla: '6-12 Hours', status: 'Live 100%', corridors: 'Ring Road Express & Narayanghat' },
    { id: 4, name: 'Gandaki Province', hub: 'Pokhara Central Hub', sla: '18-24 Hours', status: 'Optimal', corridors: 'Prithvi Highway Night Fleet' },
    { id: 5, name: 'Lumbini Province', hub: 'Butwal / Bhairahawa Hub', sla: '20-24 Hours', status: 'Optimal', corridors: 'Siddhartha Highway Corridor' },
    { id: 6, name: 'Karnali Province', hub: 'Surkhet Birendranagar Hub', sla: '48-72 Hours', status: 'Weather Cleared', corridors: 'Mid-Hill Highway & Air Link' },
    { id: 7, name: 'Sudurpashchim', hub: 'Dhangadhi / Attariya Hub', sla: '48 Hours', status: 'Optimal', corridors: 'Far-West Highway Linehaul' },
  ];

  const faqs = [
    {
      q: 'How does the daily 6:00 PM operational cutoff and reset work?',
      a: 'Double 7 operates on a 24-hour synchronized dispatch cycle. Consignments booked and handed over before 6:00 PM NPT are sorted and dispatched onto the overnight linehaul fleet the very same evening. At 6:00 PM, the daily dispatch manifest finalizes, and all collected Cash on Delivery (COD) funds are queued for automated bank remittance to merchant accounts.'
    },
    {
      q: 'When do merchants receive their collected Cash on Delivery (COD) funds?',
      a: 'We guarantee zero-delay COD settlements. Delivered consignments are reconciled daily, and bank payouts are processed directly into your registered merchant bank account or digital wallet (ConnectIPS, Fonepay, Esewa, Khalti) every business day at 6:00 PM.'
    },
    {
      q: 'Can I track shipments and manage consignments from a smartphone?',
      a: 'Yes! Double 7 features a dedicated Phone UI Dashboard engineered specifically for mobile browsers. You can generate 4x6 shipping waybills, track truck GPS telemetry, view live COD balances, and receive 24-hour email digests directly on your mobile device without installing an app.'
    },
    {
      q: 'What is included in the 24-hour merchant email digest?',
      a: 'When you trigger or schedule your summary email, Double 7 sends your company\'s live dashboard telemetry: your in-transit parcels, delivered orders, cleared COD remittance balance, and your live waybill manifest for the day.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060911', color: '#f8fafc' }}>
      
      {/* ================= LIVE OPERATIONS TELEMETRY TICKER ================= */}
      <div style={{
        backgroundColor: '#0a0f1d',
        borderBottom: '1px solid rgba(255, 102, 0, 0.25)',
        padding: '0.55rem 1rem',
        fontSize: '0.78rem',
        color: '#94a3b8',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2rem',
          animation: 'marquee 30s linear infinite',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            KATHMANDU CENTRAL HUB: 100% OPERATIONAL
          </span>
          <span>&bull;</span>
          <span style={{ color: '#ff8533', fontWeight: 700 }}>
            ⏰ DAILY LINEHAUL DISPATCH CUTOFF: 6:00 PM (18:00 NPT)
          </span>
          <span>&bull;</span>
          <span style={{ color: '#38bdf8' }}>
            🚚 PRITHVI &amp; TRIBHUVAN CORRIDORS: ALL TRUCKS GPS TRACKED
          </span>
          <span>&bull;</span>
          <span style={{ color: '#10b981', fontWeight: 700 }}>
            💰 SAME-DAY COD BANK SETTLEMENTS: 100% CLEARED
          </span>
          <span>&bull;</span>
          <span style={{ color: '#cbd5e1' }}>
            🏔️ 77 DISTRICTS NATIONAL EXPRESS COVERAGE
          </span>
        </div>
      </div>

      {/* ================= HERO SECTION ================= */}
      <section style={{
        padding: '4.5rem 0 3.5rem 0',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 10%, rgba(255, 102, 0, 0.08) 0%, transparent 60%)'
      }}>
        <div className="container">
          <div className="hero-grid">
            {/* Left Col: Headings & Quick Tracker */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 102, 0, 0.1)',
                border: '1px solid rgba(255, 102, 0, 0.3)',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--brand-orange)',
                marginBottom: '1.25rem'
              }}>
                <Sparkles size={14} />
                <span>NEPAL&apos;S PREMIER TECH FREIGHT &amp; CARGO NETWORK</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.2rem, 5.5vw, 3.4rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em',
                color: '#ffffff'
              }}>
                Next-Gen Express Freight &amp;{' '}
                <span style={{
                  background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-amber) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Guaranteed 6:00 PM COD Settlements
                </span>
              </h1>

              <p style={{
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '2rem',
                maxWidth: '580px'
              }}>
                Connecting Kathmandu Valley to all 77 districts across Nepal. Experience guaranteed linehaul transit SLAs, thermal barcode waybills, live highway GPS tracking, and automated daily merchant remittance.
              </p>

              {/* Waybill Tracking Bar */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.65rem' }}>
                  🔍 Real-Time Consignment &amp; Waybill Tracking
                </div>
                <form onSubmit={handleTrackSubmit} className="hero-tracking-form" style={{ display: 'flex', gap: '0.65rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="Enter Waybill Tracking ID (e.g., NEP-882194)..."
                      className="input-field"
                      style={{ paddingLeft: '2.75rem', width: '100%', height: '48px', fontSize: '0.95rem' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: '48px', padding: '0 1.5rem', whiteSpace: 'nowrap' }}>
                    <span>Track Cargo</span>
                    <ArrowRight size={16} />
                  </button>
                </form>

                {/* Quick Tracking Samples */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Recent Waybills:</span>
                  <button
                    type="button"
                    onClick={() => { setTrackingId('NEP-882194'); router.push('/track?id=NEP-882194'); }}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace' }}
                  >
                    NEP-882194 (Pokhara)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTrackingId('NEP-441209'); router.push('/track?id=NEP-441209'); }}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace' }}
                  >
                    NEP-441209 (Biratnagar)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  href={currentUser ? "/book" : "/login?redirect=/book"}
                  className="btn btn-primary"
                  style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
                >
                  <Boxes size={18} />
                  <span>Book Consignment</span>
                </Link>

                <Link
                  href={currentUser ? (currentUser.role === 'admin' ? '/admin' : '/merchant') : '/login?portal=merchant'}
                  className="btn btn-secondary"
                  style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
                >
                  <LayoutDashboard size={18} />
                  <span>{currentUser ? 'Open My Dashboard' : 'Merchant Portal Login'}</span>
                </Link>
              </div>
            </div>

            {/* Right Col: Live Corridor & Daily Reset Status Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card glass-panel" style={{
                border: '1px solid rgba(255, 102, 0, 0.35)',
                background: 'linear-gradient(135deg, rgba(16, 25, 46, 0.95) 0%, rgba(10, 15, 29, 0.95) 100%)',
                padding: '1.75rem',
                borderRadius: '16px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255, 102, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange)' }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--brand-orange)', fontWeight: 800, textTransform: 'uppercase' }}>
                        DAILY DISPATCH CUTOFF
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                        Every Day at 6:00 PM NPT
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                    ACTIVE CYCLE
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                  Consignments booked prior to 6:00 PM depart on the national night linehaul fleet. Reconciled COD funds are locked for same-day digital bank settlement.
                </div>

                {/* Real-time Highway Departure Board */}
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                    Tonight&apos;s Linehaul Highway Departures
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>KTM &rarr; Pokhara Express</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>Departs 19:30 NPT &bull; On Time</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>KTM &rarr; Biratnagar Linehaul</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>Departs 20:00 NPT &bull; Ready</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>KTM &rarr; Butwal / Bhairahawa</span>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>Departs 20:30 NPT &bull; Loading</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Trust Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-orange)' }}>99.4%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>On-Time SLA</div>
                </div>
                <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>77 Districts</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Coverage</div>
                </div>
                <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>0% Delay</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>COD Payout</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2: INTERACTIVE RATE & TRANSIT TIME ESTIMATOR ================= */}
      <section style={{ padding: '4.5rem 0', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="badge badge-cyan" style={{ marginBottom: '0.5rem' }}>
              TRANSPARENT FREIGHT ESTIMATOR
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#ffffff' }}>
              Instant Freight Rate &amp; Delivery SLA Calculator
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0.5rem auto 0 auto', fontSize: '0.95rem' }}>
              Calculate exact door-to-door delivery costs, COD processing fees, and transit windows across Nepal before booking.
            </p>
          </div>

          <div style={{
            maxWidth: '960px',
            margin: '0 auto',
            backgroundColor: '#0b1222',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 16px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              
              {/* Controls Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Origin Hub
                    </label>
                    <select
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', height: '42px', fontSize: '0.88rem' }}
                    >
                      {nepaliCities.map(c => (
                        <option key={c} value={c} style={{ background: '#0b1222', color: '#fff' }}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Destination Hub
                    </label>
                    <select
                      value={destCity}
                      onChange={(e) => setDestCity(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', height: '42px', fontSize: '0.88rem' }}
                    >
                      {nepaliCities.filter(c => c !== originCity).map(c => (
                        <option key={c} value={c} style={{ background: '#0b1222', color: '#fff' }}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Weight Selector */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Consignment Weight (KG)
                    </label>
                    <span style={{ fontWeight: 800, color: 'var(--brand-orange)', fontSize: '0.9rem' }}>
                      {weightKg} KG
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--brand-orange)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>1 KG (Parcel)</span>
                    <span>25 KG (Box)</span>
                    <span>50 KG (Freight Pallet)</span>
                  </div>
                </div>

                {/* Declared Value (for COD) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Cash on Delivery (COD) Amount (NPR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '100%', height: '42px', fontSize: '0.88rem' }}
                    placeholder="Enter COD amount to collect..."
                  />
                </div>

                {/* Speed SLA Toggle */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Service Tier &amp; Speed
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setServiceSpeed('express')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: serviceSpeed === 'express' ? '2px solid var(--brand-orange)' : '1px solid rgba(255,255,255,0.1)',
                        background: serviceSpeed === 'express' ? 'rgba(255, 102, 0, 0.12)' : 'rgba(255,255,255,0.02)',
                        color: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: serviceSpeed === 'express' ? 'var(--brand-orange)' : '#fff' }}>
                        ⚡ Express Priority
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Next-Morning Delivery</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceSpeed('standard')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: serviceSpeed === 'standard' ? '2px solid var(--brand-cyan)' : '1px solid rgba(255,255,255,0.1)',
                        background: serviceSpeed === 'standard' ? 'rgba(34, 211, 238, 0.12)' : 'rgba(255,255,255,0.02)',
                        color: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: serviceSpeed === 'standard' ? 'var(--brand-cyan)' : '#fff' }}>
                        🚚 Standard Linehaul
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Economy 24-48h</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculated Rate Result Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.08) 0%, rgba(16, 25, 46, 0.8) 100%)',
                border: '1px solid rgba(255, 102, 0, 0.3)',
                borderRadius: '12px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>
                      {rateCalculation.slaText}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
                      ✓ Guaranteed 6 PM Cutoff
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Estimated Total Logistics Fee
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffffff', margin: '0.25rem 0 1rem 0' }}>
                    Rs. {rateCalculation.total.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>NPR</span>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Base Freight ({weightKg} KG):</span>
                      <span style={{ fontWeight: 700, color: '#fff' }}>Rs. {rateCalculation.freight.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>COD Collection &amp; Remittance:</span>
                      <span style={{ fontWeight: 700, color: '#34d399' }}>Rs. {rateCalculation.codFee.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Estimated Transit Time:</span>
                      <span style={{ fontWeight: 800, color: '#38bdf8' }}>{rateCalculation.transitHours}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Route Corridor:</span>
                      <span style={{ color: '#fff' }}>{originCity} &rarr; {destCity}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <Link
                    href={currentUser ? `/book?origin=${encodeURIComponent(originCity)}&dest=${encodeURIComponent(destCity)}&weight=${weightKg}` : '/login?redirect=/book'}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                  >
                    <span>Book Shipment at This Rate</span>
                    <ArrowRight size={16} />
                  </Link>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                    Includes thermal waybill label generation &amp; live SMS/Email dispatch alerts.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: DEDICATED PHONE UI DASHBOARD SECTION ================= */}
      <section style={{ padding: '4.5rem 0', borderBottom: '1px solid var(--border-subtle)', background: '#070b15' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            
            {/* Left: Explanation */}
            <div>
              <div className="badge badge-orange" style={{ marginBottom: '0.65rem' }}>
                <Smartphone size={13} style={{ marginRight: '4px' }} />
                1-THUMB MOBILE PHONE UI
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '1rem' }}>
                Dedicated Mobile Phone Dashboard Built for Fast Cargo Operations
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Never struggle with cramped desktop spreadsheets on a phone screen. Double 7 provides a native-feel Phone UI Dashboard with swipeable KPI cards, one-touch waybill thermal printing, and live COD remittance tracking.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} />
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Swipeable horizontal KPI metric cards (Active, In-Transit, Remitted)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} />
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Vertical consignment card feed with 0% horizontal table overflow</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} />
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Quick actions for rapid 4x6 Waybill Label printing &amp; dispatch</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  href="/dashboard"
                  className="btn btn-primary"
                  style={{ padding: '0.8rem 1.6rem' }}
                >
                  <LayoutDashboard size={16} />
                  <span>Launch Live Dashboard</span>
                </Link>
                <Link
                  href="/track"
                  className="btn btn-secondary"
                  style={{ padding: '0.8rem 1.6rem' }}
                >
                  <Search size={16} />
                  <span>Track Consignment</span>
                </Link>
              </div>
            </div>

            {/* Right: Phone Frame Simulation Mockup (Interactive) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '100%',
                maxWidth: '360px',
                backgroundColor: '#050811',
                border: '8px solid #1e293b',
                borderRadius: '38px',
                padding: '1.1rem 1rem 1.25rem 1rem',
                boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(255, 102, 0, 0.18)',
                position: 'relative'
              }}>
                {/* Phone Speaker Notch & Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>18:00 NPT</span>
                  <div style={{ width: '80px', height: '12px', backgroundColor: '#1e293b', borderRadius: '10px' }} />
                  <span style={{ fontWeight: 600 }}>5G &bull; 100%</span>
                </div>

                {/* Mobile App Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--brand-orange)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      DOUBLE 7 MOBILE FLEET
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>
                      Phone Operations Hub
                    </div>
                  </div>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                    LIVE 6 PM RESET
                  </span>
                </div>

                {/* Interactive Phone KPI Cards (Tap to switch views) */}
                <div className="mobile-kpi-scroll-row" style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', marginBottom: '0.85rem', paddingBottom: '0.2rem' }}>
                  <button
                    type="button"
                    onClick={() => setPhoneTab('feed')}
                    style={{
                      flex: '1 1 0',
                      background: phoneTab === 'feed' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                      border: phoneTab === 'feed' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '0.55rem 0.4rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>In-Transit</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>14</div>
                    <div style={{ fontSize: '0.55rem', color: '#34d399' }}>Live Feed</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhoneTab('remittance')}
                    style={{
                      flex: '1 1 0',
                      background: phoneTab === 'remittance' ? 'rgba(52, 211, 153, 0.15)' : '#0f172a',
                      border: phoneTab === 'remittance' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '0.55rem 0.4rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>COD Ledger</div>
                    <div style={{ fontSize: '1.0rem', fontWeight: 800, color: '#34d399' }}>Rs. 45.2K</div>
                    <div style={{ fontSize: '0.55rem', color: '#ff8533' }}>Cleared 6 PM</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhoneTab('actions')}
                    style={{
                      flex: '1 1 0',
                      background: phoneTab === 'actions' ? 'rgba(167, 139, 250, 0.15)' : '#0f172a',
                      border: phoneTab === 'actions' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '0.55rem 0.4rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quick Tools</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#a78bfa' }}>1-Touch</div>
                    <div style={{ fontSize: '0.55rem', color: '#38bdf8' }}>Actions</div>
                  </button>
                </div>

                {/* Tab 1: Live Consignments Feed */}
                {phoneTab === 'feed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <Link
                      href="/track?id=D7-8821-EXP"
                      style={{
                        background: '#0d1527',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '10px',
                        padding: '0.7rem 0.75rem',
                        textDecoration: 'none',
                        display: 'block'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', fontSize: '0.8rem' }}>D7-8821-EXP</span>
                        <span style={{ fontSize: '0.62rem', background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>In Transit</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                        <span>Kathmandu &rarr; Pokhara</span>
                        <span style={{ fontWeight: 700, color: '#34d399' }}>Rs. 4,500 COD</span>
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        BA 2 KHA 8841 &bull; Prithvi Highway Corridor
                      </div>
                    </Link>

                    <Link
                      href="/track?id=D7-7730-EXP"
                      style={{
                        background: '#0d1527',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '10px',
                        padding: '0.7rem 0.75rem',
                        textDecoration: 'none',
                        display: 'block'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', fontSize: '0.8rem' }}>D7-7730-EXP</span>
                        <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>Delivered</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                        <span>Kathmandu &rarr; Biratnagar</span>
                        <span style={{ fontWeight: 700, color: '#34d399' }}>Rs. 12,800 COD</span>
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Signed by Dipendra Chaudhari &bull; 100% SLA
                      </div>
                    </Link>
                  </div>
                )}

                {/* Tab 2: COD Remittances */}
                {phoneTab === 'remittance' && (
                  <div style={{
                    background: '#0d1527',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    borderRadius: '10px',
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cleared Available Balance</span>
                      <span style={{ fontSize: '0.62rem', background: '#10b98122', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>VERIFIED</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                      Rs. 45,200
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      Auto-Transfer: <strong>Nabil Bank (AC ****4891)</strong>
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--brand-orange)', fontWeight: 600 }}>
                      ⏰ Payout triggers today at 6:00 PM NPT sharp
                    </div>
                  </div>
                )}

                {/* Tab 3: Quick 1-Touch Actions */}
                {phoneTab === 'actions' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <Link
                      href="/book"
                      style={{
                        background: '#0d1527',
                        border: '1px solid rgba(255, 102, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.5rem',
                        textDecoration: 'none',
                        color: '#ffffff',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}
                    >
                      <div style={{ fontSize: '1rem', marginBottom: '2px' }}>📦</div>
                      Book Cargo
                    </Link>

                    <Link
                      href="/dashboard"
                      style={{
                        background: '#0d1527',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.5rem',
                        textDecoration: 'none',
                        color: '#ffffff',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}
                    >
                      <div style={{ fontSize: '1rem', marginBottom: '2px' }}>🛰️</div>
                      Fleet Radar
                    </Link>

                    <Link
                      href="/bookings"
                      style={{
                        background: '#0d1527',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.5rem',
                        textDecoration: 'none',
                        color: '#ffffff',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        gridColumn: 'span 2'
                      }}
                    >
                      <span>🖨️ 4x6 Thermal Waybill Printing &rarr;</span>
                    </Link>
                  </div>
                )}

                {/* Bottom Quick Bar Mock with Working Next.js Links */}
                <div style={{
                  marginTop: '0.85rem',
                  paddingTop: '0.65rem',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-around',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)'
                }}>
                  <Link href="/" style={{ color: 'var(--brand-orange)', textDecoration: 'none', fontWeight: 700 }}>
                    ● Home
                  </Link>
                  <Link href="/track" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    🔍 Track
                  </Link>
                  <Link href="/book" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    + Book
                  </Link>
                  <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    📊 Fleet
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 4: 77-DISTRICT PROVINCE SLA & COVERAGE MATRIX ================= */}
      <section style={{ padding: '4.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="badge badge-orange" style={{ marginBottom: '0.5rem' }}>
              NATIONWIDE EXPRESS LOGISTICS
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#ffffff' }}>
              77-District Province Delivery SLAs &amp; Linehaul Corridors
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0.5rem auto 0 auto', fontSize: '0.95rem' }}>
              Direct trunk linehaul connections linking Kathmandu Central Sorting Facility to provincial hubs across all 7 provinces of Nepal.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
            {provinces.map((prov) => (
              <div
                key={prov.id}
                className="card"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-orange)', textTransform: 'uppercase' }}>
                      Province {prov.id}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      {prov.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                    {prov.name}
                  </h3>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                    <MapPin size={13} style={{ display: 'inline', marginRight: '4px', color: 'var(--brand-cyan)' }} />
                    {prov.hub}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Corridor: {prov.corridors}
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivery SLA:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>{prov.sla}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 5: GUARANTEED COD REMITTANCE & MERCHANT BENEFITS ================= */}
      <section style={{ padding: '4.5rem 0', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(180deg, #060911 0%, #0a1122 100%)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div>
              <div className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>
                ZERO-DELAY MERCHANT RECONCILIATION
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '1rem' }}>
                Automated Daily 6:00 PM COD Bank Settlements
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Cash on Delivery should power your business cash flow, not freeze it. Double 7 synchronizes collection data directly with Nepal Clearing House (NCHL) and commercial bank APIs for automated daily payouts.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>Daily 6:00 PM</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Automatic Bank Remittance</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '1.1rem' }}>Direct Banking</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>ConnectIPS &bull; Fonepay &bull; Wallets</div>
                </div>
              </div>

              <Link
                href="/login?portal=merchant"
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.8rem' }}
              >
                <span>Register as Merchant Partner</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--brand-orange)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Thermal 4x6 Waybill Printing
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Generate professional thermal shipping labels with standard Code-128 barcodes and routing QR codes ready for zebra and standard desktop printers.
                </p>
              </div>

              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--brand-emerald)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Live 24-Hour Email Summary Digest
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Receive personalized 24-hour operations digests sent straight to your email, populated with your merchant company&apos;s own active shipments, delivered parcels, and cleared COD pool.
                </p>
              </div>

              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--brand-cyan)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Strict Tenant Isolation &amp; Privacy
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Your merchant portal isolates exclusively your consignments, rates, and customer contacts. Enterprise security ensures zero data leakage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 6: FAQ ACCORDION ================= */}
      <section style={{ padding: '4.5rem 0' }}>
        <div className="container-narrow">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge badge-orange" style={{ marginBottom: '0.5rem' }}>
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.2rem)', fontWeight: 800, color: '#ffffff' }}>
              Everything You Need to Know About Double 7
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '1.15rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    size={18}
                    style={{
                      transform: openFaq === idx ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      color: 'var(--brand-orange)',
                      flexShrink: 0
                    }}
                  />
                </button>

                {openFaq === idx && (
                  <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
