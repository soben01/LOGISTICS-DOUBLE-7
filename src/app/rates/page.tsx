'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  DollarSign,
  Info,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Boxes,
  Truck,
  Plane,
  Globe2,
  HelpCircle,
  Clock,
  Navigation,
  MapPin,
  Banknote,
  Sparkles,
  Zap,
  RotateCcw,
  Check,
  ChevronRight,
  Radio
} from 'lucide-react';
import { calculateDomesticFreightRate, DomesticRateOption } from '../../lib/store';
import { getCurrentUser, User } from '../../lib/auth';

export default function RatesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handleAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth-change', handleAuth);
    return () => window.removeEventListener('auth-change', handleAuth);
  }, []);

  // Calculator Parameters
  const [originCity, setOriginCity] = useState('Kathmandu');
  const [destCity, setDestCity] = useState('Pokhara');
  const [weightKg, setWeightKg] = useState<number>(5);
  const [lengthCm, setLengthCm] = useState<number>(30);
  const [widthCm, setWidthCm] = useState<number>(20);
  const [heightCm, setHeightCm] = useState<number>(20);

  // COD Simulator State
  const [simCodAmount, setSimCodAmount] = useState<number>(4500);

  // Table Filter State
  const [zoneFilter, setZoneFilter] = useState<'ALL' | 'VALLEY' | 'INTERCITY' | 'REGIONAL' | 'REMOTE'>('ALL');

  const rates: DomesticRateOption[] = calculateDomesticFreightRate({
    originCity,
    destCity,
    weightKg,
    lengthCm,
    widthCm,
    heightCm
  });

  const volumetricWeight = (lengthCm * widthCm * heightCm) / 5000;
  const chargeableWeight = Math.max(weightKg, volumetricWeight).toFixed(1);

  // Quick weight presets
  const weightPresets = [1, 2, 5, 10, 15, 25, 40];

  // Route telemetry details
  const getRouteDetails = () => {
    if (originCity === destCity || (originCity === 'Kathmandu' && (destCity === 'Lalitpur' || destCity === 'Bhaktapur'))) {
      return {
        corridor: 'Ring Road & Inner Valley Express Corridor',
        distance: '8 - 18 KM',
        transitHours: 'Under 3 - 6 Hours',
        hubTransit: 'Direct Point-to-Point Rider Dispatch'
      };
    }
    if (destCity === 'Pokhara') {
      return {
        corridor: 'Prithvi Highway High-Speed Linehaul',
        distance: '205 KM',
        transitHours: '24 Hours Guaranteed',
        hubTransit: 'Kathmandu Mega-Hub \u2192 Pokhara Regional Hub'
      };
    }
    if (destCity === 'Birgunj' || destCity === 'Chitwan') {
      return {
        corridor: 'Tribhuvan Highway & Narayanghat Trade Artery',
        distance: '145 - 280 KM',
        transitHours: '24 Hours Guaranteed',
        hubTransit: 'Kathmandu Mega-Hub \u2192 Dry Port Gateways'
      };
    }
    if (destCity === 'Biratnagar' || destCity === 'Dharan') {
      return {
        corridor: 'East-West Highway Eastern Express Corridor',
        distance: '390 - 450 KM',
        transitHours: '24 - 36 Hours',
        hubTransit: 'Kathmandu Mega-Hub \u2192 Biratnagar Eastern Hub'
      };
    }
    return {
      corridor: 'Nationwide All-Province Network Corridor',
      distance: '150 - 850 KM',
      transitHours: '24 - 48 Hours',
      hubTransit: 'Regional Cross-Docking Hubs (All 77 Districts)'
    };
  };

  const routeInfo = getRouteDetails();

  // COD Simulator Calculations
  const codFeePercent = 0.015; // 1.5%
  const codHandlingFee = Math.round(simCodAmount * codFeePercent);
  const estimatedFreight = rates[0]?.estimatedCostNpr || 220;
  const netMerchantPayout = Math.max(0, simCodAmount - estimatedFreight - codHandlingFee);

  return (
    <div style={{ padding: '3.5rem 0 6rem 0', position: 'relative' }}>
      {/* Background Ambient Glow */}
      <div className="hero-ambient-glow" style={{ top: '-100px', opacity: 0.8 }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="badge badge-orange" style={{ marginBottom: '1rem', padding: '0.35rem 0.9rem' }}>
            <Zap size={14} />
            <span>NEPAL DOMESTIC TARIFFS &bull; ALL 77 DISTRICTS ACTIVE</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.3rem, 4vw, 3.4rem)', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Published Freight Tariffs &amp; Pricing Engine
          </h1>

          <p style={{ maxWidth: '720px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.08rem', lineHeight: '1.6' }}>
            Transparent, all-inclusive pricing for same-day Kathmandu Valley dispatch, 24-hour intercity linehauls, and Cash on Delivery (COD) across all 7 provinces. Direct international air cargo tariffs arriving Q4 2026.
          </p>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              <CheckCircle2 size={16} color="var(--brand-emerald)" />
              <span>Zero Hidden Fuel Surcharges</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              <CheckCircle2 size={16} color="var(--brand-emerald)" />
              <span>Next-Day Automated Bank COD Remittance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              <CheckCircle2 size={16} color="var(--brand-emerald)" />
              <span>Free Doorstep Merchant Pickup</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            INTERACTIVE FREIGHT CALCULATOR COCKPIT
            ======================================================== */}
        <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '4rem', border: '1px solid rgba(255, 102, 0, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-orange)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                <Radio size={14} className="animate-pulse" />
                <span>Live Telemetry Engine</span>
              </div>
              <h2 style={{ fontSize: '1.65rem' }}>Interactive Freight &amp; Route Simulator</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Formula Standard:</span>
              <span className="badge badge-subtle" style={{ fontFamily: 'var(--font-mono)' }}>IATA &bull; L&times;W&times;H / 5000</span>
            </div>
          </div>

          {/* Form Controls Grid */}
          <div className="grid grid-cols-4 gap-5" style={{ marginBottom: '2rem' }}>
            {/* Origin */}
            <div className="input-group">
              <label className="input-label">
                <span>Origin Gateway Hub</span>
                <MapPin size={14} color="var(--brand-orange)" />
              </label>
              <select
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="select-field"
                style={{ fontWeight: 600 }}
              >
                <option value="Kathmandu">Kathmandu (Central Mega-Hub)</option>
                <option value="Lalitpur">Lalitpur (Patan Hub)</option>
                <option value="Bhaktapur">Bhaktapur (East Valley Hub)</option>
                <option value="Pokhara">Pokhara (Gandaki Province Hub)</option>
                <option value="Birgunj">Birgunj (Dry Port Trade Gateway)</option>
                <option value="Biratnagar">Biratnagar (Eastern Province Hub)</option>
                <option value="Chitwan">Chitwan (Bharatpur Logistics Center)</option>
                <option value="Butwal">Butwal (Lumbini Trade Corridor)</option>
              </select>
            </div>

            {/* Destination */}
            <div className="input-group">
              <label className="input-label">
                <span>Destination City / District</span>
                <Navigation size={14} color="var(--brand-cyan)" />
              </label>
              <select
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
                className="select-field"
                style={{ fontWeight: 600 }}
              >
                <option value="Pokhara">Pokhara (Gandaki Province)</option>
                <option value="Kathmandu">Kathmandu Valley</option>
                <option value="Biratnagar">Biratnagar (Koshi Province)</option>
                <option value="Birgunj">Birgunj (Madhesh Province)</option>
                <option value="Chitwan">Chitwan / Narayangarh</option>
                <option value="Butwal">Butwal / Bhairahawa</option>
                <option value="Dharan">Dharan / Itahari</option>
                <option value="Nepalgunj">Nepalgunj (Banke)</option>
                <option value="Dhangadhi">Dhangadhi (Far-West)</option>
                <option value="Nationwide">Rest of Nepal (77 Districts)</option>
              </select>
            </div>

            {/* Weight Slider with Presets */}
            <div className="input-group" style={{ gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label" style={{ margin: 0 }}>Actual Gross Weight</label>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)' }}>
                  {weightKg} KG
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.5)}
                className="range-slider"
                style={{ marginTop: '0.6rem', marginBottom: '0.6rem' }}
              />
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {weightPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWeightKg(preset)}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.5rem',
                      background: weightKg === preset ? 'var(--brand-orange)' : 'rgba(255, 255, 255, 0.06)',
                      color: weightKg === preset ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {preset}kg
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div className="input-group">
              <label className="input-label">Dimensions (L &times; W &times; H cm)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    placeholder="L"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-field"
                    style={{ textAlign: 'center', padding: '0.75rem 0.2rem', fontFamily: 'var(--font-mono)' }}
                  />
                  <span style={{ position: 'absolute', right: '4px', top: '2px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>cm</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    placeholder="W"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-field"
                    style={{ textAlign: 'center', padding: '0.75rem 0.2rem', fontFamily: 'var(--font-mono)' }}
                  />
                  <span style={{ position: 'absolute', right: '4px', top: '2px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>cm</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    placeholder="H"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-field"
                    style={{ textAlign: 'center', padding: '0.75rem 0.2rem', fontFamily: 'var(--font-mono)' }}
                  />
                  <span style={{ position: 'absolute', right: '4px', top: '2px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Corridor & Telemetry Status Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(13, 20, 36, 0.95), rgba(18, 27, 48, 0.7))',
            border: '1px solid rgba(255, 102, 0, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            gap: '1.25rem',
            alignItems: 'center'
          }} className="route-telemetry-strip">
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TRANSIT ROUTE &bull; CORRIDOR
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                {originCity} &rarr; {destCity}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--brand-orange)' }}>
                {routeInfo.corridor}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TRANSIT DISTANCE &bull; SLA
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-emerald)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                {routeInfo.distance}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Guaranteed: {routeInfo.transitHours}
              </div>
            </div>

            <div style={{ textAlign: 'right' }} className="weight-calc-col">
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CHARGEABLE BILLABLE WEIGHT
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>
                {chargeableWeight} <span style={{ fontSize: '0.85rem', color: 'var(--brand-orange)' }}>KG</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Volumetric: {volumetricWeight.toFixed(2)} KG &bull; Actual: {weightKg} KG
              </div>
            </div>
          </div>

          {/* Rate Cards Grid */}
          <div className="grid grid-cols-4 gap-5">
            {rates.map((rate, idx) => (
              <div
                key={idx}
                className={`card ${rate.recommended ? 'glow-card-orange' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: rate.isComingSoon ? '1px dashed rgba(245, 158, 11, 0.45)' : undefined,
                  background: rate.isComingSoon ? 'rgba(245, 158, 11, 0.03)' : undefined
                }}
              >
                {rate.recommended && (
                  <div style={{
                    position: 'absolute',
                    top: '-11px',
                    right: '16px',
                    background: 'linear-gradient(135deg, #ff6600, #ea580c)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '12px',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 10px rgba(255, 102, 0, 0.4)'
                  }}>
                    MOST POPULAR &bull; 100% SLA
                  </div>
                )}

                {rate.isComingSoon && (
                  <div style={{
                    position: 'absolute',
                    top: '-11px',
                    right: '16px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000000',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '12px',
                    letterSpacing: '0.05em'
                  }}>
                    COMING SOON &bull; Q4 2026
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    SERVICE: {rate.serviceCode}
                  </span>
                  {rate.serviceCode === 'EXP' && <Truck size={18} color="var(--brand-orange)" />}
                  {rate.serviceCode === 'CARGO' && <Boxes size={18} color="var(--brand-cyan)" />}
                  {rate.serviceCode === 'RUSH' && <Zap size={18} color="var(--brand-emerald)" />}
                  {rate.serviceCode === 'INTL' && <Globe2 size={18} color="var(--brand-amber)" />}
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{rate.serviceName}</h3>

                <div style={{ marginBottom: '0.75rem' }}>
                  {rate.isComingSoon ? (
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--brand-amber)' }}>
                      Coming Soon
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>
                        Rs. {rate.estimatedCostNpr.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> NPR all-inclusive</span>
                    </div>
                  )}
                </div>

                <div style={{
                  fontSize: '0.82rem',
                  color: rate.isComingSoon ? 'var(--brand-amber)' : 'var(--brand-emerald)',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Clock size={14} />
                  <span>{rate.transitDays}</span>
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  {rate.features.map((feature, fIdx) => (
                    <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <CheckCircle2 size={14} color={rate.isComingSoon ? 'var(--brand-amber)' : 'var(--brand-orange)'} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {rate.isComingSoon ? (
                  <a
                    href="#intl-notice"
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: 'auto', textAlign: 'center', borderColor: 'var(--brand-amber)', color: 'var(--brand-amber)' }}
                  >
                    Register for Launch &rarr;
                  </a>
                ) : (
                  <Link
                    href={currentUser ? `/book?service=${rate.serviceCode}&origin=${encodeURIComponent(originCity)}&dest=${encodeURIComponent(destCity)}&wt=${chargeableWeight}` : `/login?redirect=${encodeURIComponent(`/book?service=${rate.serviceCode}`)}`}
                    className={`btn ${rate.recommended ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ marginTop: 'auto', textAlign: 'center' }}
                  >
                    <span>{currentUser ? "Book with this Tariff \u2192" : "Login to Dispatch \u2192"}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================
            COD REMITTANCE & BANK PAYOUT ESTIMATOR WIDGET
            ======================================================== */}
        <div className="glass-panel" style={{
          padding: '2.5rem',
          marginBottom: '4rem',
          background: 'radial-gradient(circle at left, rgba(16, 185, 129, 0.08) 0%, rgba(11, 17, 32, 0.95) 70%)',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2.5rem', alignItems: 'center' }} className="cod-estimator-grid">
            <div>
              <div className="badge badge-emerald" style={{ marginBottom: '0.75rem' }}>
                <Banknote size={14} />
                <span>MERCHANT CASH ON DELIVERY CALCULATOR</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
                Automated Cash on Delivery (COD) Remittance
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
                Double 7 collects Cash on Delivery across all 77 districts with customer OTP verification and automatically remits collected funds directly to your Nepal bank account the next business day.
              </p>

              {/* Interactive COD Amount Input */}
              <div className="input-group" style={{ maxWidth: '420px' }}>
                <label className="input-label">
                  <span>Enter Sample Consignment COD Value (NPR)</span>
                  <span style={{ color: 'var(--brand-emerald)', fontFamily: 'var(--font-mono)' }}>Rs. {simCodAmount.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={simCodAmount}
                  onChange={(e) => setSimCodAmount(parseInt(e.target.value) || 500)}
                  className="range-slider"
                  style={{ marginBottom: '0.75rem' }}
                />
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[1500, 3500, 7500, 15000, 30000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSimCodAmount(val)}
                      className="badge badge-subtle"
                      style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}
                    >
                      Rs. {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculated Breakdown Card */}
            <div className="card glow-card-emerald" style={{ padding: '1.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                ESTIMATED SETTLEMENT BREAKDOWN
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Gross COD Collected:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>Rs. {simCodAmount.toLocaleString()} NPR</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Express Courier Freight:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>- Rs. {estimatedFreight} NPR</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>COD Remittance Processing (1.5%):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>- Rs. {codHandlingFee} NPR</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '2px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NET DIRECT BANK PAYOUT</div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--brand-emerald)', fontFamily: 'var(--font-mono)' }}>
                      Rs. {netMerchantPayout.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>NEXT-DAY 10:00 AM SLA</span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>All Commercial Banks</div>
                  </div>
                </div>
              </div>

              <Link
                href={currentUser ? "/merchant" : "/login"}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', marginTop: '1.25rem', textAlign: 'center' }}
              >
                <span>{currentUser ? "Open Merchant COD Ledger \u2192" : "Login for COD \u2192"}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================
            OFFICIAL PUBLISHED DOMESTIC TARIFF SCHEDULE TABLE
            ======================================================== */}
        <div style={{ marginBottom: '4.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>
                Published Domestic Tariff Matrix
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Standard base freight rates across national corridors. All tariffs include tracking and automated customer notification.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="tab-list">
              <button
                type="button"
                onClick={() => setZoneFilter('ALL')}
                className={`tab-btn ${zoneFilter === 'ALL' ? 'active' : ''}`}
              >
                All Zones
              </button>
              <button
                type="button"
                onClick={() => setZoneFilter('VALLEY')}
                className={`tab-btn ${zoneFilter === 'VALLEY' ? 'active' : ''}`}
              >
                Valley Rush
              </button>
              <button
                type="button"
                onClick={() => setZoneFilter('INTERCITY')}
                className={`tab-btn ${zoneFilter === 'INTERCITY' ? 'active' : ''}`}
              >
                Major Intercity
              </button>
              <button
                type="button"
                onClick={() => setZoneFilter('REGIONAL')}
                className={`tab-btn ${zoneFilter === 'REGIONAL' ? 'active' : ''}`}
              >
                Regional
              </button>
              <button
                type="button"
                onClick={() => setZoneFilter('REMOTE')}
                className={`tab-btn ${zoneFilter === 'REMOTE' ? 'active' : ''}`}
              >
                77 Districts
              </button>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zone / Delivery Destination</th>
                  <th>Transit Guarantee</th>
                  <th>Base Tariff (First 1 KG)</th>
                  <th>Addl. Per KG</th>
                  <th>COD Processing Fee</th>
                  <th style={{ textAlign: 'right' }}>Quick Dispatch</th>
                </tr>
              </thead>
              <tbody>
                {(zoneFilter === 'ALL' || zoneFilter === 'VALLEY') && (
                  <tr>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>Kathmandu Valley Rush</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kathmandu, Lalitpur, Bhaktapur</div>
                    </td>
                    <td>
                      <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>Same-Day (3-6h)</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>Rs. 120</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Rs. 40 / kg</td>
                    <td><span style={{ color: 'var(--brand-emerald)', fontWeight: 600 }}>FREE (0%)</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={currentUser ? "/book?service=EXP&dest=Kathmandu" : "/login?redirect=/book"} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.75rem' }}>
                        Book &rarr;
                      </Link>
                    </td>
                  </tr>
                )}

                {(zoneFilter === 'ALL' || zoneFilter === 'INTERCITY') && (
                  <tr>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>Major Intercity Express Corridors</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pokhara, Birgunj, Biratnagar, Chitwan, Butwal</div>
                    </td>
                    <td>
                      <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>24h Next-Day Guaranteed</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>Rs. 180</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Rs. 55 / kg</td>
                    <td><span style={{ color: 'var(--brand-emerald)', fontWeight: 600 }}>1.5% Remittance</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={currentUser ? "/book?service=EXP&dest=Pokhara" : "/login?redirect=/book"} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.75rem' }}>
                        Book &rarr;
                      </Link>
                    </td>
                  </tr>
                )}

                {(zoneFilter === 'ALL' || zoneFilter === 'REGIONAL') && (
                  <tr>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>Regional District Trade Hubs</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dharan, Itahari, Nepalgunj, Dhangadhi, Hetauda</div>
                    </td>
                    <td>
                      <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>24 - 48 Hours</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>Rs. 220</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Rs. 65 / kg</td>
                    <td><span style={{ color: 'var(--brand-emerald)', fontWeight: 600 }}>1.5% Remittance</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={currentUser ? "/book?service=CARGO&dest=Dharan" : "/login?redirect=/book"} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.75rem' }}>
                        Book &rarr;
                      </Link>
                    </td>
                  </tr>
                )}

                {(zoneFilter === 'ALL' || zoneFilter === 'REMOTE') && (
                  <tr>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>All 77 Districts &bull; Hill / Mountain Lanes</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jumla, Mustang, Solukhumbu, Ilam, Baitadi, etc.</div>
                    </td>
                    <td>
                      <span className="badge badge-subtle" style={{ fontSize: '0.72rem' }}>2 - 3 Days</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>Rs. 290</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Rs. 85 / kg</td>
                    <td><span style={{ color: 'var(--brand-emerald)', fontWeight: 600 }}>2.0% Remittance</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={currentUser ? "/book?service=CARGO&dest=Nationwide" : "/login?redirect=/book"} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.75rem' }}>
                        Book &rarr;
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================
            INTERNATIONAL AIR CARGO NOTICE BANNER (Q4 2026)
            ======================================================== */}
        <div id="intl-notice" className="glass-panel" style={{
          padding: '2.5rem',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(13, 20, 36, 0.85) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-amber)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <Globe2 size={16} />
              <span>INTERNATIONAL CROSS-BORDER AIR CARGO &bull; COMING SOON (Q4 2026)</span>
            </div>
            <h3 style={{ fontSize: '1.45rem', marginBottom: '0.5rem' }}>
              Expanding Nepal Exporters to Dubai, India, China &amp; the World
            </h3>
            <p style={{ maxWidth: '680px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Scheduled air freight operations direct from Tribhuvan International Airport (TIA) are in final regulatory review with CAAN and Nepal Customs. Pre-register your verified merchant account today to lock in introductory air freight tariffs.
            </p>
          </div>

          <Link href="/#international-waitlist" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <span>Join Priority Waitlist</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1040px) {
          .route-telemetry-strip {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .weight-calc-col {
            text-align: left !important;
          }
          .cod-estimator-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
