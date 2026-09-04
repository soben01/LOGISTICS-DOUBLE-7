'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Truck,
  Boxes,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Printer,
  Sparkles,
  Lock,
  UserCheck,
  AlertCircle,
  Building,
  Mail,
  Phone,
  KeyRound,
  LogOut,
  Clock,
  Globe2,
  MapPin,
  Banknote,
  Navigation,
  Info,
  Copy,
  Check,
  Sliders,
  DollarSign
} from 'lucide-react';
import { createShipment, Shipment } from '../../lib/store';
import { getCurrentUser, loginUser, signupUser, logoutUser, User } from '../../lib/auth';
import PrintableLabel from '../../components/shipping/PrintableLabel';

function BookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialService = (searchParams.get('service') as Shipment['serviceCode']) || 'EXP';
  const initialOrigin = searchParams.get('origin') || 'Kathmandu';
  const initialDest = searchParams.get('dest') || 'Pokhara';
  const initialWt = parseFloat(searchParams.get('wt') || '3.5');

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authName, setAuthName] = useState('');
  const [authCompany, setAuthCompany] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // 1. Shipper (Origin / Sender - Hidden by Default)
  const [originCity, setOriginCity] = useState(initialOrigin || 'Kathmandu');
  const [senderName, setSenderName] = useState('Soben');
  const [senderCompany, setSenderCompany] = useState('Double 7 Logistics Command HQ');
  const [senderPhone, setSenderPhone] = useState('+977 1 4411000');
  const [showShipperDetails, setShowShipperDetails] = useState(false);

  // 2. Consignee (Destination / Recipient)
  const [recipientCity, setRecipientCity] = useState(initialDest);
  const [recipientName, setRecipientName] = useState('');
  const [recipientCompany, setRecipientCompany] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientPostal, setRecipientPostal] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // 3. Cargo Specifications (Direct Weight without Dimensions)
  const [cargoDesc, setCargoDesc] = useState('');
  const [pieces, setPieces] = useState<number>(1);
  const [weightKg, setWeightKg] = useState<number>(initialWt || 3.5);
  const [declaredValueNpr, setDeclaredValueNpr] = useState<number>(8500);

  // 4. Cash on Delivery (COD)
  const [isCod, setIsCod] = useState<boolean>(true);
  const [codAmountNpr, setCodAmountNpr] = useState<number>(3200);

  // 5. Service Tier & Add-ons
  const [selectedService, setSelectedService] = useState<Shipment['serviceCode']>(initialService);
  const [addInsurance, setAddInsurance] = useState<boolean>(true);
  const [addCarbonOffset, setAddCarbonOffset] = useState<boolean>(false);

  // Submission & Confirmed Shipment
  const [createdShipment, setCreatedShipment] = useState<Shipment | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync authentication
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login?redirect=/book');
      return;
    }
    setCurrentUser(user);
    setSenderName(user.name);
    setSenderCompany(user.company);
    setSenderPhone(user.phone);

    const handleAuthChange = () => {
      const u = getCurrentUser();
      if (!u) {
        router.push('/login?redirect=/book');
        return;
      }
      setCurrentUser(u);
      setSenderName(u.name);
      setSenderCompany(u.company);
      setSenderPhone(u.phone);
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [router]);

  const handleInlineLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const res = loginUser(authEmail, authPassword);
    if (!res.success) {
      setAuthError(res.error || 'Authentication failed.');
    } else if (res.user) {
      setCurrentUser(res.user);
      setSenderName(res.user.name);
      setSenderCompany(res.user.company);
      setSenderPhone(res.user.phone);
      setAuthSuccess(`Welcome back, ${res.user.name}!`);
    }
  };

  const handleInlineSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const res = signupUser({
      name: authName,
      email: authEmail,
      company: authCompany,
      phone: authPhone,
      password: authPassword,
    });

    if (!res.success) {
      setAuthError(res.error || 'Failed to create account.');
    } else if (res.user) {
      setCurrentUser(res.user);
      setSenderName(res.user.name);
      setSenderCompany(res.user.company);
      setSenderPhone(res.user.phone);
      setAuthSuccess(`Account created for ${res.user.name}!`);
    }
  };


  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Quick Preset Handlers
  const applyPreset = (desc: string, wt: number, val: number) => {
    setCargoDesc(desc);
    setWeightKg(wt);
    setDeclaredValueNpr(val);
  };

  const handleUseMyProfile = () => {
    if (currentUser) {
      setSenderName(currentUser.name);
      setSenderCompany(currentUser.company);
      setSenderPhone(currentUser.phone);
    }
  };

  // Chargeable calculations based directly on Actual Gross Weight
  const chargeableWeight = Math.max(0.1, Number(weightKg) || 1.0);

  // ONE FARE Calculation: Comprehensive, Transparent, and All-Inclusive
  const getOneFareBreakdown = () => {
    let baseRate = 220;
    let ratePerKg = 60;
    let serviceLabel = 'Double 7 Nepal Express';
    let transitSla = '24h Intercity Delivery SLA';

    if (selectedService === 'CARGO') {
      baseRate = 160;
      ratePerKg = 40;
      serviceLabel = 'Nationwide Hub Cargo';
      transitSla = '2-3 Days Economy All-District SLA';
    } else if (selectedService === 'RUSH') {
      baseRate = 290;
      ratePerKg = 50;
      serviceLabel = 'Same-Day Valley Rush';
      transitSla = 'Under 3 Hours Instant Dispatch';
    }

    const weightCost = Math.round(baseRate + Math.max(0, chargeableWeight - 1) * ratePerKg);
    const insuranceCost = addInsurance ? 150 : 0;
    const carbonCost = addCarbonOffset ? 50 : 0;
    const codHandlingFee = isCod ? 30 : 0;
    const oneTotalFare = weightCost + insuranceCost + carbonCost + codHandlingFee;

    return {
      serviceLabel,
      transitSla,
      baseRate,
      weightCost,
      insuranceCost,
      carbonCost,
      codHandlingFee,
      oneTotalFare
    };
  };

  const fare = getOneFareBreakdown();

  // Unified Form Submit: One click to book and issue Airway Bill
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderName.trim() || !senderPhone.trim()) {
      alert('Please enter Shipper Name and Phone number.');
      return;
    }

    if (!recipientName.trim() || !recipientAddress.trim() || !recipientPhone.trim()) {
      alert('Please enter Consignee Name, Delivery Address, and Mobile Phone.');
      return;
    }

    if (isCod && (!codAmountNpr || codAmountNpr <= 0)) {
      alert('Please enter a valid Cash on Delivery (COD) amount.');
      return;
    }

    setIsSubmitting(true);

    const shipment = createShipment({
      service: fare.serviceLabel as Shipment['service'],
      serviceCode: selectedService,
      origin: {
        city: originCity,
        province: 'Bagmati Province',
        hub: `${originCity} Central Hub`,
      },
      destination: {
        city: recipientCity,
        province: 'Nepal',
        hub: `${recipientCity} Regional Hub`,
        areaCode: recipientPostal,
      },
      sender: {
        name: senderName || currentUser?.name || 'Verified Merchant',
        company: senderCompany || currentUser?.company || 'Nepal Merchant Pvt Ltd',
        phone: senderPhone || currentUser?.phone || '+977 98000 00000',
      },
      recipient: {
        name: recipientName,
        company: recipientCompany,
        address: recipientAddress,
        phone: recipientPhone,
      },
      cargo: {
        pieces: Number(pieces),
        weightKg: Number(weightKg),
        volumeCbm: 0,
        description: cargoDesc,
        declaredValueNpr: Number(declaredValueNpr),
      },
    });

    // Automatic email dispatch notice
    if (currentUser?.email) {
      fetch('/api/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          role: currentUser.role,
          trackingId: shipment.id,
          type: 'booking_confirmation',
          subject: `[Double 7] Waybill Issued: ${shipment.id} (${shipment.origin.city} → ${shipment.destination.city})`,
        }),
      }).catch(() => {});
    }

    setTimeout(() => {
      setCreatedShipment(shipment);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 250);
  };

  const copyTrackingId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div style={{ padding: '3rem 0 6rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="badge badge-orange" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={13} /> ALL-IN-ONE DISPATCH &bull; UNIFIED FARE
          </div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
            Instant Domestic Consignment Booking
          </h1>
          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Shipper, Consignee, Cargo Specs, and Cash on Delivery (COD) unified into one streamlined dispatch form with one transparent, all-inclusive fare.
          </p>
        </div>

        {/* ================= UNAUTHENTICATED SCREEN (FALLBACK) ================= */}
        {!currentUser ? (
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '540px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(255, 102, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--brand-orange)',
              border: '1px solid rgba(255, 102, 0, 0.3)',
              boxShadow: '0 0 20px rgba(255, 102, 0, 0.25)'
            }}>
              <Lock size={26} />
            </div>

            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.5rem' }}>
              Merchant Authentication Required
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              To ensure parcel security and next-day automated COD bank remittances, <strong>only registered Double 7 merchants can book and dispatch consignments</strong>.
            </p>

            <div className="tab-list" style={{ marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => { setAuthTab('signin'); setAuthError(''); }}
                className={`tab-btn ${authTab === 'signin' ? 'active' : ''}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('signup'); setAuthError(''); }}
                className={`tab-btn ${authTab === 'signup' ? 'active' : ''}`}
              >
                Create Merchant Account
              </button>
            </div>

            {authError && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <CheckCircle2 size={16} />
                <span>{authSuccess}</span>
              </div>
            )}

            {authTab === 'signin' ? (
              <form onSubmit={handleInlineLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                <div className="input-group">
                  <label className="input-label">Merchant Business Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      placeholder="merchant@company.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem', width: '100%' }}>
                  <span>Sign In &amp; Dispatch Cargo</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleInlineSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                <div className="input-group">
                  <label className="input-label">Authorized Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Thapa"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Company / Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kathmandu Handicrafts Pvt Ltd"
                    value={authCompany}
                    onChange={(e) => setAuthCompany(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="ramesh@handicrafts.np"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Mobile Phone (Nepal)</label>
                  <input
                    type="tel"
                    placeholder="+977 98510 00000"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem', width: '100%' }}>
                  <span>Register &amp; Unlock Booking</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        ) : createdShipment ? (
          /* ================= SUCCESS CONFIRMATION & SHIPPING LABEL ================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                color: 'var(--brand-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                Consignment Confirmed &amp; Dispatched!
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
                Digital Airway Bill has been authorized and queued for departure from {originCity} Hub.
              </p>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.85rem 1.5rem',
                borderRadius: '10px',
                border: '1px solid var(--border-medium)',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TRACKING CODE</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-orange)' }}>
                    {createdShipment.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyTrackingId(createdShipment.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
                >
                  {copiedTracking ? <Check size={14} color="var(--brand-emerald)" /> : <Copy size={14} />}
                  <span>{copiedTracking ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href={`/track?id=${createdShipment.id}`} className="btn btn-primary">
                  <span>Track Consignment Live</span>
                  <ArrowRight size={16} />
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    if (currentUser?.email) {
                      await fetch('/api/send-summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: currentUser.email,
                          role: currentUser.role,
                          trackingId: createdShipment.id,
                          type: 'booking_confirmation',
                          subject: `[Double 7] Consignment Summary: ${createdShipment.id}`,
                        }),
                      });
                      setEmailSent(true);
                      setTimeout(() => setEmailSent(false), 4000);
                    }
                  }}
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Mail size={14} color="var(--brand-orange)" />
                  <span>{emailSent ? 'Summary Sent to Email!' : 'Email Waybill Summary'}</span>
                </button>

                {currentUser?.role === 'admin' ? (
                  <Link href="/admin" className="btn btn-secondary">
                    <span>Admin Control Tower</span>
                  </Link>
                ) : (
                  <Link href="/merchant" className="btn btn-secondary">
                    <span>Merchant Portal</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCreatedShipment(null);
                  }}
                  className="btn btn-outline"
                >
                  <span>Book Another Consignment</span>
                </button>
              </div>
            </div>

            {/* Printable Label & Barcode */}
            <PrintableLabel shipment={createdShipment} />
          </div>
        ) : (
          /* ================= UNIFIED ALL-IN-ONE DISPATCH FORM ================= */
          <form onSubmit={handleSubmitBooking}>
            {/* Modern Flex Booking Layout: Dispatch Modules on Left, Sticky Live Manifest on Right */}
            <div className="booking-layout-flex">
              {/* Left Column: All Dispatch Modules (Shipper, Consignee, Cargo, COD, Service) */}
              <div className="booking-form-col">

                {/* Compact Shipper Origin Bar (Shipper Details Hidden by Default) */}
                <div style={{
                  background: 'rgba(255, 102, 0, 0.05)',
                  border: '1px solid rgba(255, 102, 0, 0.2)',
                  borderRadius: '12px',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: 'rgba(255, 102, 0, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-orange)'
                    }}>
                      <Package size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 700 }}>
                        Dispatch Origin: {originCity} Mega-Hub
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Consignor: {senderName} ({senderCompany}) &bull; {senderPhone}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowShipperDetails(prev => !prev)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    <span>{showShipperDetails ? 'Hide Shipper Details ▲' : 'Edit Shipper Details ▾'}</span>
                  </button>
                </div>

                {/* Optional Expanded Shipper Details */}
                {showShipperDetails && (
                  <div className="booking-card" style={{ border: '1px solid rgba(255, 102, 0, 0.3)' }}>
                    <div className="booking-card-header">
                      <div className="booking-step-badge" style={{ background: 'rgba(255, 102, 0, 0.15)', color: 'var(--brand-orange)' }}>
                        Origin
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>
                          Shipper Details (Origin Hub)
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Free doorstep pickup across Kathmandu Valley, Pokhara &amp; Birgunj
                        </div>
                      </div>
                    </div>

                    <div className="booking-field-row">
                      <div className="input-group booking-field-col-6">
                        <label className="input-label">Origin Nepal Hub *</label>
                        <select
                          value={originCity}
                          onChange={(e) => setOriginCity(e.target.value)}
                          className="select-field"
                        >
                          <option value="Kathmandu">Kathmandu (Central Mega-Hub - TIA Gate)</option>
                          <option value="Lalitpur">Lalitpur (Patan Hub)</option>
                          <option value="Bhaktapur">Bhaktapur (East Valley Hub)</option>
                          <option value="Pokhara">Pokhara (Gandaki Regional Hub)</option>
                          <option value="Birgunj">Birgunj (Dry Port Trade Terminal)</option>
                          <option value="Biratnagar">Biratnagar (Koshi Province Hub)</option>
                          <option value="Chitwan">Chitwan (Bharatpur / Narayangarh)</option>
                          <option value="Butwal">Butwal (Lumbini Trade Corridor)</option>
                        </select>
                      </div>

                      <div className="input-group booking-field-col-6">
                        <label className="input-label">Shipper Contact Name *</label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          className="input-field"
                          placeholder="e.g. Ramesh Thapa"
                          required
                        />
                      </div>

                      <div className="input-group booking-field-col-6">
                        <label className="input-label">Company / Brand Name</label>
                        <input
                          type="text"
                          value={senderCompany}
                          onChange={(e) => setSenderCompany(e.target.value)}
                          className="input-field"
                          placeholder="e.g. Himalayan Apparel Nepal"
                        />
                      </div>

                      <div className="input-group booking-field-col-6">
                        <label className="input-label">Consignor Telephone *</label>
                        <input
                          type="tel"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          className="input-field"
                          placeholder="+977 98510 12345"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= ROW 1: 1 - 2 SECTIONS (2 COLUMNS, DISPLAY: FLEX) ================= */}
                <div className="booking-sections-row">
                  {/* Column 1: 1. CONSIGNEE (TO) */}
                  <div className="booking-section-col">
                    <div className="booking-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <div className="booking-card-header">
                        <div className="booking-step-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--brand-cyan)' }}>
                          1
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                            <MapPin size={18} color="var(--brand-cyan)" />
                            <span>Consignee Details (Destination)</span>
                          </h3>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Doorstep delivery with SMS tracking &amp; OTP security
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Popular Cities */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                          POPULAR DESTINATIONS:
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {['Pokhara', 'Kathmandu', 'Biratnagar', 'Birgunj', 'Chitwan', 'Butwal', 'Dharan', 'Nepalgunj'].map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => setRecipientCity(city)}
                              className="preset-chip"
                              style={{
                                background: recipientCity === city ? 'rgba(6, 182, 212, 0.2)' : undefined,
                                borderColor: recipientCity === city ? 'var(--brand-cyan)' : undefined,
                                color: recipientCity === city ? '#ffffff' : undefined
                              }}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="booking-field-row" style={{ marginTop: 'auto' }}>
                        <div className="input-group booking-field-col-6">
                          <label className="input-label">Destination Hub *</label>
                          <select
                            value={recipientCity}
                            onChange={(e) => setRecipientCity(e.target.value)}
                            className="select-field"
                          >
                            <option value="Pokhara">Pokhara (Gandaki Province)</option>
                            <option value="Kathmandu">Kathmandu Valley</option>
                            <option value="Lalitpur">Lalitpur (Patan)</option>
                            <option value="Bhaktapur">Bhaktapur</option>
                            <option value="Biratnagar">Biratnagar (Koshi Province)</option>
                            <option value="Birgunj">Birgunj (Madhesh Province)</option>
                            <option value="Chitwan">Chitwan (Bharatpur / Narayangarh)</option>
                            <option value="Butwal">Butwal / Bhairahawa</option>
                            <option value="Dharan">Dharan / Itahari</option>
                            <option value="Nepalgunj">Nepalgunj (Banke)</option>
                            <option value="Dhangadhi">Dhangadhi (Far-West)</option>
                            <option value="Rest of Nepal">Rest of Nepal (77 Districts)</option>
                          </select>
                        </div>

                        <div className="input-group booking-field-col-6">
                          <label className="input-label">Recipient Name *</label>
                          <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="input-field"
                            placeholder="e.g. Pradeep Gurung"
                            required
                          />
                        </div>

                        <div className="input-group booking-field-col-6">
                          <label className="input-label">Recipient Mobile (OTP) *</label>
                          <input
                            type="tel"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            className="input-field"
                            placeholder="+977 98XXXXXXXX"
                            required
                          />
                        </div>

                        <div className="input-group booking-field-col-6">
                          <label className="input-label">Company / Store Name</label>
                          <input
                            type="text"
                            value={recipientCompany}
                            onChange={(e) => setRecipientCompany(e.target.value)}
                            className="input-field"
                            placeholder="e.g. Annapurna IT Solutions"
                          />
                        </div>

                        <div className="input-group booking-field-col-12">
                          <label className="input-label">Doorstep Delivery Address *</label>
                          <input
                            type="text"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            className="input-field"
                            placeholder="e.g. Lakeside Ward 6, Near Barahi Chowk, Pokhara"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: 2. CARGO SPECIFICATIONS */}
                  <div className="booking-section-col">
                    <div className="booking-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <div className="booking-card-header">
                        <div className="booking-step-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--brand-emerald)' }}>
                          2
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                            <Boxes size={18} color="var(--brand-emerald)" />
                            <span>Cargo Specifications &amp; Weight</span>
                          </h3>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Doorstep parcel weighing &amp; barcode labeling at dispatch
                          </div>
                        </div>
                      </div>

                      {/* Category Presets */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                          QUICK CARGO PRESETS:
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => applyPreset('Standard E-Commerce Parcel', 2.0, 3500)}
                            className="preset-chip"
                          >
                            📦 Standard Box (2.0 KG)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('Important Legal Documents & Contracts', 0.5, 1000)}
                            className="preset-chip"
                          >
                            📄 Documents (0.5 KG)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('Clothing, Apparel & Knitwear', 3.5, 6000)}
                            className="preset-chip"
                          >
                            👗 Apparel (3.5 KG)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('Electronics, Smartphone & Accessories', 1.5, 18000)}
                            className="preset-chip"
                          >
                            💻 Electronics (1.5 KG)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('Industrial Bulk Spares & Hardware', 12.0, 25000)}
                            className="preset-chip"
                          >
                            🏭 Carton (12 KG)
                          </button>
                        </div>
                      </div>

                      <div className="booking-field-row" style={{ marginTop: 'auto' }}>
                        <div className="input-group booking-field-col-12">
                          <label className="input-label">Commodity / Package Contents *</label>
                          <input
                            type="text"
                            value={cargoDesc}
                            onChange={(e) => setCargoDesc(e.target.value)}
                            className="input-field"
                            placeholder="e.g. Handicrafts, Men's Shoes, Electronic Gadgets"
                            required
                          />
                        </div>

                        <div className="input-group booking-field-col-6">
                          <label className="input-label">Pieces (Colli) *</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={pieces}
                            onChange={(e) => setPieces(parseInt(e.target.value) || 1)}
                            className="input-field"
                            required
                          />
                        </div>

                        <div className="input-group booking-field-col-6">
                          <label className="input-label">Gross Actual Weight (KG) *</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="2000"
                            value={weightKg}
                            onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.5)}
                            className="input-field"
                            required
                          />
                        </div>

                        <div className="input-group booking-field-col-12">
                          <label className="input-label">Declared Cargo Value (Rs. NPR)</label>
                          <input
                            type="number"
                            min="100"
                            value={declaredValueNpr}
                            onChange={(e) => setDeclaredValueNpr(parseFloat(e.target.value) || 1000)}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= ROW 2: 3 - 4 SECTIONS (2 COLUMNS, DISPLAY: FLEX) ================= */}
                <div className="booking-sections-row">
                  {/* Column 1: 3. CASH ON DELIVERY (COD) */}
                  <div className="booking-section-col">
                    <div className="booking-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <div className="booking-card-header">
                        <div className="booking-step-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--brand-amber)' }}>
                          3
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                            <Banknote size={18} color="var(--brand-amber)" />
                            <span>Cash on Delivery (COD) Settings</span>
                          </h3>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Doorstep collection &amp; next-day direct bank settlement
                          </div>
                        </div>
                      </div>

                      <div style={{
                        background: isCod ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: isCod ? '2px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        transition: 'all var(--transition-fast)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        flex: 1
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={isCod}
                              onChange={(e) => setIsCod(e.target.checked)}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--brand-emerald)' }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                                Enable Cash on Delivery (COD)
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Rider collects cash at recipient doorstep
                              </div>
                            </div>
                          </label>

                          <span className={isCod ? 'badge badge-emerald' : 'badge badge-subtle'}>
                            {isCod ? 'COD ACTIVE' : 'PREPAID'}
                          </span>
                        </div>

                        {isCod && (
                          <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)', paddingTop: '0.85rem' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                              <label className="input-label" style={{ color: 'var(--brand-emerald)', fontWeight: 700 }}>
                                COD Cash Amount to Collect (Rs. NPR) *
                              </label>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: 'var(--brand-emerald)', fontSize: '1.05rem' }}>
                                  Rs.
                                </span>
                                <input
                                  type="number"
                                  min="10"
                                  value={codAmountNpr}
                                  onChange={(e) => setCodAmountNpr(parseFloat(e.target.value) || 0)}
                                  className="input-field"
                                  style={{ paddingLeft: '2.8rem', fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800 }}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          marginTop: 'auto'
                        }}>
                          ⚡ <strong>Auto-Remittance:</strong> Funds credited to merchant bank account next business day at 16:00 NPT.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: 4. SERVICE TIER & ALL-INCLUSIVE FARE */}
                  <div className="booking-section-col">
                    <div className="booking-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <div className="booking-card-header">
                        <div className="booking-step-badge" style={{ background: 'rgba(255, 102, 0, 0.15)', color: 'var(--brand-orange)' }}>
                          4
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                            <Truck size={18} color="var(--brand-orange)" />
                            <span>Service Speed &amp; Unified Fare</span>
                          </h3>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Transit corridors with guaranteed SLA &amp; fixed rates
                          </div>
                        </div>
                      </div>

                      {/* 3 Service Tiers stacked cleanly */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                        {/* Tier 1: Double 7 Nepal Express */}
                        <div
                          onClick={() => setSelectedService('EXP')}
                          className={`service-card-select ${selectedService === 'EXP' ? 'selected' : ''}`}
                          style={{ padding: '0.75rem 1rem' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 800, color: 'var(--brand-orange)', fontSize: '0.92rem' }}>Nepal Express</span>
                              <span className="badge badge-orange" style={{ fontSize: '0.58rem', padding: '0.15rem 0.4rem' }}>24H SLA</span>
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                              Rs. {Math.round(220 + Math.max(0, chargeableWeight - 1) * 60)} NPR
                            </div>
                          </div>
                          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Intercity linehauls to Pokhara, Birgunj, Biratnagar, Chitwan &amp; Butwal.
                          </p>
                        </div>

                        {/* Tier 2: Nationwide Hub Cargo */}
                        <div
                          onClick={() => setSelectedService('CARGO')}
                          className={`service-card-select ${selectedService === 'CARGO' ? 'selected' : ''}`}
                          style={{ padding: '0.75rem 1rem' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 800, color: 'var(--brand-cyan)', fontSize: '0.92rem' }}>Nationwide Cargo</span>
                              <span className="badge badge-cyan" style={{ fontSize: '0.58rem', padding: '0.15rem 0.4rem' }}>77 DISTRICTS</span>
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                              Rs. {Math.round(160 + Math.max(0, chargeableWeight - 1) * 40)} NPR
                            </div>
                          </div>
                          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Bulk freight and cross-docking for heavy commercial inventory.
                          </p>
                        </div>

                        {/* Tier 3: Same-Day Valley Rush */}
                        <div
                          onClick={() => setSelectedService('RUSH')}
                          className={`service-card-select ${selectedService === 'RUSH' ? 'selected' : ''}`}
                          style={{ padding: '0.75rem 1rem' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 800, color: 'var(--brand-emerald)', fontSize: '0.92rem' }}>Valley Rush</span>
                              <span className="badge badge-emerald" style={{ fontSize: '0.58rem', padding: '0.15rem 0.4rem' }}>&lt; 3 HOURS</span>
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                              Rs. {Math.round(290 + Math.max(0, chargeableWeight - 1) * 50)} NPR
                            </div>
                          </div>
                          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Dedicated instant rider in Kathmandu, Lalitpur &amp; Bhaktapur.
                          </p>
                        </div>
                      </div>

                      {/* Value Add Options */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginTop: 'auto'
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontSize: '0.78rem' }}>
                          <input
                            type="checkbox"
                            checked={addInsurance}
                            onChange={(e) => setAddInsurance(e.target.checked)}
                            style={{ width: '15px', height: '15px', accentColor: 'var(--brand-orange)' }}
                          />
                          <span>
                            Domestic Transit Insurance (Covers to Rs. 100k) &mdash; <strong>+Rs. 150</strong>
                          </span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontSize: '0.78rem' }}>
                          <input
                            type="checkbox"
                            checked={addCarbonOffset}
                            onChange={(e) => setAddCarbonOffset(e.target.checked)}
                            style={{ width: '15px', height: '15px', accentColor: 'var(--brand-emerald)' }}
                          />
                          <span>
                            Electric Van Contribution (Hydro-Charged) &mdash; <strong>+Rs. 50</strong>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Live Manifest & ONE FARE Total */}
              <div className="booking-manifest-col">
                <div className="booking-card" style={{ border: '1px solid rgba(255, 102, 0, 0.35)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Navigation size={16} color="var(--brand-orange)" />
                      <span>DISPATCH MANIFEST</span>
                    </div>
                    <span className="badge badge-orange">
                      {selectedService}
                    </span>
                  </div>

                  {/* Route Visualizer */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>FROM (SHIPPER)</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{originCity}</div>
                    </div>

                    <div style={{ color: 'var(--brand-orange)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Truck size={18} />
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>DIRECT LINEHAUL</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TO (CONSIGNEE)</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{recipientCity}</div>
                    </div>
                  </div>

                  {/* Service SLA Notice */}
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--brand-emerald)',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    padding: '0.4rem 0.65rem',
                    borderRadius: '6px'
                  }}>
                    <CheckCircle2 size={13} />
                    <span>{fare.transitSla}</span>
                  </div>

                  {/* Weight Specs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Colli / Pieces:</span>
                      <span style={{ fontWeight: 600 }}>{pieces} PKG</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Actual Gross Wt:</span>
                      <span style={{ fontWeight: 600 }}>{weightKg} KG</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Chargeable Wt:</span>
                      <strong style={{ color: 'var(--brand-orange)' }}>{chargeableWeight.toFixed(1)} KG</strong>
                    </div>
                  </div>

                  {/* Cash on Delivery Notice in Manifest */}
                  {isCod && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '6px',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.82rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: 'var(--brand-emerald)', fontWeight: 700 }}>Rider COD Collection:</span>
                      <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>
                        Rs. {codAmountNpr.toLocaleString()}
                      </strong>
                    </div>
                  )}

                  {/* ONE FARE Itemized Cost Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Base Freight Rate:</span>
                      <span>Rs. {fare.baseRate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Weight Charge:</span>
                      <span>Rs. {fare.weightCost - fare.baseRate}</span>
                    </div>
                    {isCod && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>COD Handling Fee:</span>
                        <span>Rs. {fare.codHandlingFee}</span>
                      </div>
                    )}
                    {addInsurance && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Transit Insurance:</span>
                        <span>Rs. {fare.insuranceCost}</span>
                      </div>
                    )}
                    {addCarbonOffset && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>EV Fleet Green Offset:</span>
                        <span>Rs. {fare.carbonCost}</span>
                      </div>
                    )}

                    {/* THE ONE FARE TOTAL */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '2px solid var(--border-medium)',
                      paddingTop: '0.85rem',
                      marginTop: '0.4rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--brand-orange)', fontWeight: 800, letterSpacing: '0.05em' }}>
                          ONE ALL-INCLUSIVE FARE
                        </div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                          Rs. {fare.oneTotalFare.toLocaleString()} <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>NPR</span>
                        </div>
                      </div>
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        ALL TAXES INCL
                      </span>
                    </div>
                  </div>

                  {/* Simulated Waybill Barcode Graphic */}
                  <div style={{
                    background: '#040711',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '1.4rem',
                      letterSpacing: '2px',
                      color: '#ffffff',
                      lineHeight: '1',
                      userSelect: 'none'
                    }}>
                      ||||| | ||||| ||| ||||||| | ||||
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.35rem' }}>
                      PRE-AUTHORIZED &bull; D7-WAYBILL-2026
                    </div>
                  </div>

                  {/* The Single Submit Action Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', padding: '0.95rem 1.25rem', fontSize: '1rem', fontWeight: 800 }}
                  >
                    {isSubmitting ? (
                      <span>Issuing Waybill...</span>
                    ) : (
                      <>
                        <span>Dispatch &amp; Issue Waybill</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>

                {/* Service SLA & Security Guarantee */}
                <div className="card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                    <ShieldCheck size={16} color="var(--brand-emerald)" />
                    <span>Double 7 Carrier Guarantee</span>
                  </div>
                  <div>100% money-back guarantee if 24h delivery SLA is breached. Automated barcode generation &amp; real-time GPS tracking included in one fare.</div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{ padding: '6rem 0', textAlign: 'center' }}>Loading Double 7 Dispatch Terminal...</div>}>
      <BookContent />
    </Suspense>
  );
}
