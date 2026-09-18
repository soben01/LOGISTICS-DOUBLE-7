'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Banknote,
  Navigation,
  KeyRound,
  FileSignature,
  Camera,
  RefreshCw,
  Search,
  ChevronRight,
  Package,
  Layers,
  Copy,
  Check,
  X,
  Printer,
  FileText,
  UserCheck,
  Truck,
  Smartphone,
  Download,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  LogOut,
  QrCode,
  ExternalLink,
  Share2,
  Sparkles
} from 'lucide-react';
import {
  Shipment,
  getShipments,
  markOutForDelivery,
  verifyDeliveryOtp,
  recordRiderDeliveryFailure
} from '../../lib/store';
import {
  RiderProfile,
  PRESET_RIDERS,
  getActiveRider,
  setActiveRider,
  getAuthenticatedRider,
  loginRider,
  logoutRider,
  getRiderStats,
  createRiderRemittance,
  getRiderRemittances,
  RiderRemittanceRecord
} from '../../lib/rider';

export default function RiderPortalPage() {
  const router = useRouter();
  const [activeRiderProfile, setActiveRiderProfile] = useState<RiderProfile>(PRESET_RIDERS[0]);
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [filterTab, setFilterTab] = useState<'active' | 'delivered' | 'failed' | 'remit'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Delivery Modal state
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  // Canvas signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // NDR Exception Modal state
  const [ndrShipment, setNdrShipment] = useState<Shipment | null>(null);
  const [ndrReason, setNdrReason] = useState('Customer Phone Unreachable / Switched Off');
  const [ndrNotes, setNdrNotes] = useState('');

  // Remittance Modal state
  const [showRemitModal, setShowRemitModal] = useState(false);
  const [cashierName, setCashierName] = useState('Central Hub Cashier');
  const [latestReceipt, setLatestReceipt] = useState<RiderRemittanceRecord | null>(null);

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rider Authentication Session
  const [authenticatedRider, setAuthenticatedRider] = useState<RiderProfile | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [loginPhone, setLoginPhone] = useState('9841234567');
  const [loginPin, setLoginPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App Install / PWA & APK Modal State
  const [showAppModal, setShowAppModal] = useState(false);
  const [appModalTab, setAppModalTab] = useState<'pwa' | 'apk'>('pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsInstalled(!!isStandalone);

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      const currentAuth = getAuthenticatedRider();
      setAuthenticatedRider(currentAuth);
      if (currentAuth) {
        setActiveRiderProfile(currentAuth);
      }
      setIsAuthChecked(true);
      loadData();

      const handleUpdate = () => loadData();
      const handleAuthUpdate = () => {
        const auth = getAuthenticatedRider();
        setAuthenticatedRider(auth);
        if (auth) {
          setActiveRiderProfile(auth);
        }
        loadData();
      };

      window.addEventListener('shipments-updated', handleUpdate);
      window.addEventListener('rider-changed', handleUpdate);
      window.addEventListener('rider-auth-changed', handleAuthUpdate);
      window.addEventListener('remittance-created', handleUpdate);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('shipments-updated', handleUpdate);
        window.removeEventListener('rider-changed', handleUpdate);
        window.removeEventListener('rider-auth-changed', handleAuthUpdate);
        window.removeEventListener('remittance-created', handleUpdate);
      };
    }
  }, []);

  const loadData = () => {
    const sList = getShipments();
    setAllShipments(sList);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const res = loginRider(loginPhone, loginPin);
    setIsLoggingIn(false);
    if (res.success && res.rider) {
      setAuthenticatedRider(res.rider);
      setActiveRiderProfile(res.rider);
      showNotice(`✓ Welcome back, ${res.rider.name}! Run-sheet loaded for ${res.rider.hubCode}`);
    } else {
      setLoginError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickDemoLogin = (rider: RiderProfile) => {
    setLoginError(null);
    setLoginPhone(rider.phone);
    setLoginPin(rider.pin);
    const res = loginRider(rider.phone, rider.pin);
    if (res.success && res.rider) {
      setAuthenticatedRider(res.rider);
      setActiveRiderProfile(res.rider);
      showNotice(`✓ Authenticated as ${res.rider.name} (${res.rider.hubCode})`);
    }
  };

  const handleLogout = () => {
    logoutRider();
    setAuthenticatedRider(null);
    router.push('/rider/login');
  };

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          showNotice('✓ Double 7 Rider App installed to Home Screen!');
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch {
        setShowAppModal(true);
        setAppModalTab('pwa');
      }
    } else {
      setShowAppModal(true);
      setAppModalTab('pwa');
    }
  };

  const handleRiderChange = (riderId: string) => {
    setActiveRider(riderId);
    const found = PRESET_RIDERS.find(r => r.id === riderId);
    if (found) {
      setActiveRiderProfile(found);
      setAuthenticatedRider(found);
      showNotice(`Switched active rider view to: ${found.name}`);
    }
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const stats = getRiderStats(activeRiderProfile.id, allShipments);

  // Filter shipments for active rider
  const riderShipments = allShipments.filter(s => {
    if (s.assignedRider && s.assignedRider.id === activeRiderProfile.id) return true;
    if (s.destination?.hub && s.destination.hub.includes(activeRiderProfile.hubCode.split('-')[0])) return true;
    return false;
  });

  const filteredShipments = riderShipments.filter(s => {
    if (filterTab === 'active') {
      if (s.status === 'Delivered') return false;
      if (s.status === 'Exception') return false;
    } else if (filterTab === 'delivered') {
      if (s.status !== 'Delivered') return false;
    } else if (filterTab === 'failed') {
      if (s.status !== 'Exception' && (!s.deliveryAttempts || s.deliveryAttempts === 0)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = s.id.toLowerCase().includes(q);
      const matchName = s.recipient.name.toLowerCase().includes(q);
      const matchPhone = s.recipient.phone.toLowerCase().includes(q);
      const matchAddr = (s.recipient.address || '').toLowerCase().includes(q);
      return matchTrack || matchName || matchPhone || matchAddr;
    }
    return true;
  });

  // Open delivery modal
  const openDeliveryModal = (s: Shipment) => {
    setSelectedShipment(s);
    setReceiverName(s.recipient.name);
    setOtpInput('');
    setOtpError(null);
    setHasPhoto(false);
    setHasSignature(false);

    setTimeout(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
        }
      }
    }, 100);
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (e.type === 'mousedown' || e.type === 'touchstart') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setHasSignature(false);
  };

  // Confirm delivery
  const handleConfirmDelivery = () => {
    if (!selectedShipment) return;
    if (!otpInput.trim()) {
      setOtpError('Please enter the 6-digit delivery OTP.');
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    let sigDataUrl = '';
    if (canvasRef.current && hasSignature) {
      sigDataUrl = canvasRef.current.toDataURL('image/png');
    }

    const result = verifyDeliveryOtp(
      selectedShipment.id,
      otpInput.trim(),
      receiverName.trim() || selectedShipment.recipient.name,
      `${receiverName.trim()} (OTP Verified)`,
      sigDataUrl,
      hasPhoto ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop' : undefined
    );

    setIsVerifying(false);

    if (result.success) {
      showNotice(`✅ Consignment ${selectedShipment.id} delivered successfully! COD collected: Rs. ${selectedShipment.codAmount?.toLocaleString() || 0}`);
      setSelectedShipment(null);
      loadData();
    } else {
      setOtpError(result.message);
    }
  };

  // Handle NDR / Exception
  const handleReportNdr = () => {
    if (!ndrShipment) return;
    recordRiderDeliveryFailure(ndrShipment.id, ndrReason, ndrNotes);
    showNotice(`⚠️ NDR recorded for ${ndrShipment.id}. Reattempt scheduled.`);
    setNdrShipment(null);
    setNdrNotes('');
    loadData();
  };

  // Mark out for delivery
  const handleStartDelivery = (shipmentId: string) => {
    markOutForDelivery(shipmentId, activeRiderProfile.name);
    showNotice(`Consignment ${shipmentId} marked Out for Delivery.`);
    loadData();
  };

  // Submit remittance
  const handleRemitCash = () => {
    const deliveredShipments = riderShipments.filter(s => s.status === 'Delivered' && (s.codAmount || 0) > 0);
    const trackingIds = deliveredShipments.map(s => s.id);
    const amount = stats.cashInHandNpr;

    if (amount <= 0) {
      showNotice('No unremitted cash available to remit.');
      return;
    }

    const rec = createRiderRemittance(
      activeRiderProfile.id,
      activeRiderProfile.hubCode,
      trackingIds,
      amount,
      cashierName
    );

    setLatestReceipt(rec);
    setShowRemitModal(false);
    showNotice(`💰 Remitted Rs. ${amount.toLocaleString()} to Hub Cashier (${cashierName}). Receipt: ${rec.receiptNo}`);
    loadData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const remittances = getRiderRemittances(activeRiderProfile.id);

  // Helper: App Install & APK Modal
  const renderAppInstallModal = () => {
    if (!showAppModal) return null;
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(255, 102, 0, 0.4)',
          borderRadius: '22px',
          padding: '1.75rem',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 102, 0, 0.15)', border: '1px solid rgba(255, 102, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={20} color="var(--brand-orange)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Double 7 Rider Mobile App
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Standalone mobile experience for Android &amp; iOS
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAppModal(false)}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '0.35rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              onClick={() => setAppModalTab('pwa')}
              style={{
                flex: 1,
                padding: '0.6rem 0.75rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: appModalTab === 'pwa' ? 'var(--brand-orange)' : 'transparent',
                color: appModalTab === 'pwa' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={15} />
              <span>Instant App (PWA)</span>
            </button>
            <button
              type="button"
              onClick={() => setAppModalTab('apk')}
              style={{
                flex: 1,
                padding: '0.6rem 0.75rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: appModalTab === 'apk' ? 'var(--brand-orange)' : 'transparent',
                color: appModalTab === 'apk' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <Download size={15} />
              <span>Build Android APK</span>
            </button>
          </div>

          {/* Tab 1: PWA */}
          {appModalTab === 'pwa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'rgba(255, 102, 0, 0.08)',
                border: '1px solid rgba(255, 102, 0, 0.25)',
                borderRadius: '14px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#060911', border: '1px solid rgba(255, 102, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src="/logo.png" alt="D7 Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>D7 Rider Terminal</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Standalone Progressive Mobile App</div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>✓ Zero Browser Bar</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', fontWeight: 700 }}>✓ Camera Scan</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700 }}>✓ Offline Cache</span>
                  </div>
                </div>
              </div>

              {/* Android Chrome Instructions */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fed7aa', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <span>🤖 Android (Google Chrome / Brave)</span>
                </div>
                <ol style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li>Open this page on your phone browser: <code style={{ color: 'var(--brand-cyan)' }}>/rider</code></li>
                  <li>Tap the <strong>three dots menu (⋮)</strong> in top-right corner of Chrome.</li>
                  <li>Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Tap <strong>Install</strong>. The D7 Rider icon will appear on your phone home screen!</li>
                </ol>
              </div>

              {/* iPhone Safari Instructions */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <span>🍎 iPhone (Apple Safari)</span>
                </div>
                <ol style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li>Open this page in <strong>Safari</strong> on your iPhone.</li>
                  <li>Tap the <strong>Share button</strong> (square with up arrow ⎋) at bottom.</li>
                  <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>Add</strong>. It launches in full-screen standalone mode without Safari UI!</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={handleTriggerInstall}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem',
                  fontWeight: 800,
                  gap: '0.5rem',
                  boxShadow: '0 4px 20px rgba(255, 102, 0, 0.4)'
                }}
              >
                <Smartphone size={18} />
                <span>⚡ Tap to Install App to Phone</span>
              </button>
            </div>
          )}

          {/* Tab 2: Native Android APK */}
          {appModalTab === 'apk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                DOUBLE 7 is pre-configured with <strong>Capacitor (<code style={{ color: 'var(--brand-orange)' }}>capacitor.config.json</code>)</strong>. You can compile this project into a native Android <code style={{ color: 'var(--brand-cyan)' }}>.apk</code> file for fleet sideloading or Google Play distribution.
              </div>

              <div style={{
                backgroundColor: '#060911',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.76rem',
                color: '#a7f3d0',
                position: 'relative'
              }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}># Terminal commands to build Android APK:</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
{`npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap copy
npx cap open android`}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`npm install @capacitor/core @capacitor/cli @capacitor/android\nnpx cap add android\nnpx cap copy\nnpx cap open android`);
                    setCopiedCmd(true);
                    setTimeout(() => setCopiedCmd(false), 2000);
                  }}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {copiedCmd ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-cyan)', marginBottom: '0.25rem' }}>
                  📦 Output APK Location:
                </div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  android/app/build/outputs/apk/debug/app-debug.apk
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  You can copy this <code style={{ color: '#fed7aa' }}>.apk</code> file to any Android device or share via WhatsApp/Telegram to install immediately.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAppModal(false)}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Close Guide
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // AUTHENTICATION GUARD (Redirects unauthenticated users to /rider/login)
  // =========================================================================
  useEffect(() => {
    if (isAuthChecked && !authenticatedRider) {
      router.replace('/rider/login');
    }
  }, [isAuthChecked, authenticatedRider, router]);

  if (!isAuthChecked || !authenticatedRider) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050811',
        color: '#94a3b8',
        fontFamily: 'var(--font-sans)',
        gap: '0.75rem'
      }}>
        <RefreshCw size={20} className="animate-spin" color="var(--brand-orange)" />
        <span>Authenticating Terminal Session...</span>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED RIDER RUN-SHEET VIEW
  // =========================================================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060911', color: '#f8fafc', padding: '2rem 0 6rem 0' }}>
      {/* Toast Notification */}
      {notice && (
        <div style={{
          position: 'fixed',
          top: '5rem',
          right: '1.5rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 102, 0, 0.4)',
          backgroundColor: '#0f172a',
          color: '#fed7aa',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          fontSize: '0.86rem',
          fontWeight: 600,
        }}>
          <ShieldCheck size={18} color="var(--brand-orange)" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="container" style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.12) 0%, rgba(11, 17, 32, 0.95) 100%)',
          border: '1px solid rgba(255, 102, 0, 0.35)',
          borderRadius: '18px',
          padding: '1.5rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ff6600 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 18px rgba(255, 102, 0, 0.4)',
                flexShrink: 0
              }}>
                <Bike size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                    Rider Delivery Portal
                  </h1>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '20px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.35)'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 1.5s infinite' }} />
                    LIVE RUN-SHEET
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <strong style={{ color: '#ffffff' }}>{activeRiderProfile.name}</strong>
                  <span>•</span>
                  <span>{activeRiderProfile.hubName}</span>
                  <span>•</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-cyan)', fontWeight: 600 }}>{activeRiderProfile.vehiclePlate}</span>
                </div>
              </div>
            </div>

            {/* Header Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {/* App Install Button */}
              <button
                type="button"
                onClick={() => { setShowAppModal(true); setAppModalTab('pwa'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  color: 'var(--brand-cyan)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Smartphone size={15} />
                <span>Mobile App</span>
              </button>

              {/* Rider Switcher dropdown */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '0.45rem 0.75rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <UserCheck size={15} color="var(--brand-orange)" />
                <select
                  value={activeRiderProfile.id}
                  onChange={(e) => handleRiderChange(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {PRESET_RIDERS.map(r => (
                    <option key={r.id} value={r.id} style={{ backgroundColor: '#0a0f1d', color: '#fff' }}>
                      {r.name} ({r.hubCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sign Out / Lock Button */}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Lock Terminal & Sign Out"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Route Zone Banner */}
          <div style={{
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)' }}>
              <MapPin size={15} color="var(--brand-cyan)" />
              <span>Assigned Beat: <strong style={{ color: '#ffffff' }}>{activeRiderProfile.routeZone}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>★ {activeRiderProfile.rating} Rating</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{activeRiderProfile.vehicle}</span>
            </div>
          </div>
        </div>

        {/* Operational KPI Dashboard Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          {/* Total Assigned */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <span>Run-Sheet Total</span>
              <Layers size={18} color="var(--brand-cyan)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
              {stats.assignedTotal}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Consignments today</div>
          </div>

          {/* Delivered */}
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '14px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <span>Delivered</span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#6ee7b7' }}>
              {stats.delivered}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>{stats.completionRate}% completion rate</div>
          </div>

          {/* Pending Delivery */}
          <div style={{
            backgroundColor: 'rgba(255, 102, 0, 0.08)',
            border: '1px solid rgba(255, 102, 0, 0.3)',
            borderRadius: '14px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--brand-orange)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <span>Pending Delivery</span>
              <Clock size={18} color="var(--brand-orange)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fdba74' }}>
              {stats.assignedTotal - stats.delivered - stats.failedNdr}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#fb923c', marginTop: '0.25rem' }}>On active delivery route</div>
          </div>

          {/* Cash in Hand (COD) */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(16, 25, 46, 0.95) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f59e0b', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <span>COD Cash in Hand</span>
              <Banknote size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fde68a' }}>
              Rs. {stats.cashInHandNpr.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Unremitted Cash</span>
              {stats.cashInHandNpr > 0 && (
                <button
                  onClick={() => setShowRemitModal(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}
                >
                  Remit Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Selector & Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingTop: '0.5rem'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: '0.35rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflowX: 'auto'
          }}>
            <button
              onClick={() => setFilterTab('active')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filterTab === 'active' ? 'var(--brand-orange)' : 'transparent',
                color: filterTab === 'active' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: filterTab === 'active' ? '0 2px 10px rgba(255, 102, 0, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Active Deliveries ({stats.assignedTotal - stats.delivered - stats.failedNdr})
            </button>
            <button
              onClick={() => setFilterTab('delivered')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filterTab === 'delivered' ? '#10b981' : 'transparent',
                color: filterTab === 'delivered' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: filterTab === 'delivered' ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Delivered ({stats.delivered})
            </button>
            <button
              onClick={() => setFilterTab('failed')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filterTab === 'failed' ? '#ef4444' : 'transparent',
                color: filterTab === 'failed' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: filterTab === 'failed' ? '0 2px 10px rgba(239, 68, 68, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              NDR Exceptions ({stats.failedNdr})
            </button>
            <button
              onClick={() => setFilterTab('remit')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filterTab === 'remit' ? '#d97706' : 'transparent',
                color: filterTab === 'remit' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: filterTab === 'remit' ? '0 2px 10px rgba(217, 119, 6, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Remittance History ({remittances.length})
            </button>
          </div>

          {/* Search Input */}
          {filterTab !== 'remit' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: '10px',
              padding: '0.45rem 0.75rem',
              minWidth: '240px'
            }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search consignee, phone, waybill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>
          )}
        </div>

        {/* Consignment List Section */}
        {filterTab !== 'remit' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredShipments.length === 0 ? (
              <div style={{
                padding: '4rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px'
              }}>
                <Package size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>No consignments found</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {searchQuery ? 'Try clearing your search query.' : 'All assigned consignments for this view have been processed.'}
                </p>
              </div>
            ) : (
              filteredShipments.map((s) => {
                const isDelivered = s.status === 'Delivered';
                const isException = s.status === 'Exception';
                const isOutForDelivery = s.status === 'Out for Delivery';
                const codAmount = s.codAmount || 0;

                return (
                  <div
                    key={s.id}
                    style={{
                      backgroundColor: isDelivered
                        ? 'rgba(16, 185, 129, 0.05)'
                        : isException
                        ? 'rgba(239, 68, 68, 0.05)'
                        : 'var(--bg-card)',
                      border: isDelivered
                        ? '1px solid rgba(16, 185, 129, 0.35)'
                        : isException
                        ? '1px solid rgba(239, 68, 68, 0.35)'
                        : isOutForDelivery
                        ? '1px solid rgba(255, 102, 0, 0.4)'
                        : '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                  >
                    {/* Header Row: Tracking Number + Service Badge + Status Badge + COD */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      paddingBottom: '0.85rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(s.id)}
                          title="Click to copy tracking ID"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '1rem',
                            cursor: 'pointer'
                          }}
                        >
                          <span>{s.id}</span>
                          {copiedId === s.id ? (
                            <Check size={14} color="#10b981" />
                          ) : (
                            <Copy size={14} color="#94a3b8" />
                          )}
                        </button>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#e2e8f0',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.15)'
                        }}>
                          {s.serviceCode}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {/* Status Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          backgroundColor: isDelivered
                            ? 'rgba(16, 185, 129, 0.18)'
                            : isException
                            ? 'rgba(239, 68, 68, 0.18)'
                            : isOutForDelivery
                            ? 'rgba(255, 102, 0, 0.18)'
                            : 'rgba(255, 255, 255, 0.08)',
                          color: isDelivered
                            ? '#10b981'
                            : isException
                            ? '#ef4444'
                            : isOutForDelivery
                            ? 'var(--brand-orange)'
                            : '#cbd5e1',
                          border: `1px solid ${
                            isDelivered
                              ? 'rgba(16, 185, 129, 0.35)'
                              : isException
                              ? 'rgba(239, 68, 68, 0.35)'
                              : isOutForDelivery
                              ? 'rgba(255, 102, 0, 0.35)'
                              : 'rgba(255, 255, 255, 0.15)'
                          }`
                        }}>
                          {isDelivered && <CheckCircle2 size={13} />}
                          {isException && <AlertTriangle size={13} />}
                          {isOutForDelivery && <Clock size={13} />}
                          <span>{s.status}</span>
                        </span>

                        {/* COD or Prepaid */}
                        {codAmount > 0 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#fde68a',
                            border: '1px solid rgba(245, 158, 11, 0.35)'
                          }}>
                            <Banknote size={14} color="#f59e0b" />
                            <span>COD: Rs. {codAmount.toLocaleString()}</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(6, 182, 212, 0.12)',
                            color: '#67e8f9',
                            border: '1px solid rgba(6, 182, 212, 0.25)'
                          }}>
                            Prepaid
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '1rem',
                      fontSize: '0.85rem'
                    }}>
                      {/* Consignee Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ffffff' }}>
                            {s.recipient.name}
                          </span>
                          <a
                            href={`tel:${s.recipient.phone}`}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.78rem',
                              fontFamily: 'var(--font-mono)',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              color: '#6ee7b7'
                            }}
                          >
                            <Phone size={13} color="#10b981" />
                            <span>Call {s.recipient.phone}</span>
                          </a>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          <MapPin size={16} color="var(--brand-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{s.recipient.address}, {s.destination.city}</span>
                        </div>
                      </div>

                      {/* Cargo Specs & Expected OTP */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span>Merchant: <strong style={{ color: '#e2e8f0' }}>{s.merchant || s.sender.name}</strong></span>
                          <span>{s.cargo.weightKg} KG • {s.cargo.pieces} Pc</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Contents: <span style={{ color: '#cbd5e1' }}>{s.cargo.description}</span>
                        </div>

                        {s.deliveryOtp && !isDelivered && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(6, 182, 212, 0.08)',
                            border: '1px solid rgba(6, 182, 212, 0.25)',
                            color: '#67e8f9',
                            fontSize: '0.8rem'
                          }}>
                            <KeyRound size={14} color="var(--brand-cyan)" />
                            <span>Customer SMS OTP: <strong style={{ fontFamily: 'var(--font-mono)', color: '#ffffff', letterSpacing: '2px' }}>{s.deliveryOtp}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Exception Banner if NDR */}
                    {isException && s.ndrReason && (
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem'
                      }}>
                        <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>
                          <strong>NDR Exception Logged:</strong> {s.ndrReason}
                          {s.ndrNotes && <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>{s.ndrNotes}</p>}
                        </div>
                      </div>
                    )}

                    {/* Proof of Delivery Banner if Delivered */}
                    {isDelivered && s.proofOfDelivery && (
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#6ee7b7',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={16} color="#10b981" />
                          <span>Delivered to <strong>{s.proofOfDelivery.receivedBy}</strong> at {s.proofOfDelivery.deliveredAt}</span>
                        </div>
                        <Link
                          href={`/track?id=${s.id}`}
                          style={{ color: 'var(--brand-cyan)', textDecoration: 'underline', fontSize: '0.78rem' }}
                        >
                          View Consignment Tracking &rarr;
                        </Link>
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.07)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.recipient.address}, ${s.destination.city}, Nepal`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <Navigation size={13} color="var(--brand-cyan)" />
                          <span>Google Maps</span>
                        </a>

                        <Link
                          href={`/track?id=${s.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          <FileText size={13} color="var(--text-secondary)" />
                          <span>Details</span>
                        </Link>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {!isDelivered && !isOutForDelivery && (
                          <button
                            type="button"
                            onClick={() => handleStartDelivery(s.id)}
                            className="btn btn-primary btn-sm"
                          >
                            <Truck size={14} />
                            <span>Mark Out for Delivery</span>
                          </button>
                        )}

                        {!isDelivered && (
                          <>
                            <button
                              type="button"
                              onClick={() => setNdrShipment(s)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.5rem 0.9rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#fca5a5',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <AlertTriangle size={14} color="#ef4444" />
                              <span>Report NDR / Failed</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeliveryModal(s)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.55rem 1.15rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(16, 185, 129, 0.5)',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                fontSize: '0.84rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
                              }}
                            >
                              <CheckCircle2 size={16} color="#ffffff" />
                              <span>Confirm Delivery (OTP)</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Remittance Tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Hub Cash Remittance Summary
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Handover all collected Cash-on-Delivery funds to the Hub Cashier at the end of each delivery shift.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRemitModal(true)}
                disabled={stats.cashInHandNpr <= 0}
                className="btn btn-primary"
                style={{
                  background: stats.cashInHandNpr > 0 ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' : 'var(--bg-surface)',
                  color: stats.cashInHandNpr > 0 ? '#000000' : 'var(--text-muted)',
                  cursor: stats.cashInHandNpr > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 800
                }}
              >
                <Banknote size={18} />
                <span>Handover Cash (Rs. {stats.cashInHandNpr.toLocaleString()})</span>
              </button>
            </div>

            {remittances.length === 0 ? (
              <div style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem'
              }}>
                No past remittance records on file for {activeRiderProfile.name}.
              </div>
            ) : (
              remittances.map((r) => (
                <div
                  key={r.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                      <FileSignature size={16} color="#f59e0b" />
                      <span>{r.receiptNo}</span>
                      <span className="badge badge-emerald">
                        {r.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0 }}>
                      Received by Cashier: <strong style={{ color: '#ffffff' }}>{r.cashierName}</strong> at {r.hubName} on {r.submittedAt}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem', margin: 0 }}>
                      Covers {r.consignmentsCount} consignments ({r.trackingNumbers.slice(0, 3).join(', ')}{r.trackingNumbers.length > 3 ? '...' : ''})
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fde68a' }}>
                      Rs. {r.totalAmountNpr.toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--brand-cyan)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        marginTop: '0.25rem'
                      }}
                    >
                      <Printer size={13} />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: OTP DELIVERY VERIFICATION & POD SIGNATURE                         */}
      {/* ========================================================================= */}
      {selectedShipment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1050,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#0a0f1d',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            margin: '2rem 0'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>
                <ShieldCheck size={22} color="#10b981" />
                <span>Confirm Consignment Handover</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Shipment Snapshot */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '0.85rem', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff' }}>
                <span>{selectedShipment.id}</span>
                {selectedShipment.codAmount ? (
                  <span style={{ color: '#fde68a' }}>COLLECT COD: Rs. {selectedShipment.codAmount.toLocaleString()}</span>
                ) : (
                  <span style={{ color: '#67e8f9' }}>PREPAID (NO CASH DUE)</span>
                )}
              </div>
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginTop: '0.25rem' }}>
                {selectedShipment.recipient.name} • {selectedShipment.recipient.phone}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                {selectedShipment.recipient.address}
              </div>
            </div>

            {/* OTP Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <KeyRound size={15} color="var(--brand-orange)" />
                  Enter Customer 6-Digit Delivery OTP:
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sent via SMS to customer</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value.replace(/\D/g, ''));
                  setOtpError(null);
                }}
                placeholder="e.g. 482913"
                autoFocus
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.3em',
                  fontWeight: 800,
                  backgroundColor: '#060911',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  border: '1px solid rgba(255, 102, 0, 0.5)',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Demo OTP: <strong style={{ color: 'var(--brand-cyan)', fontFamily: 'var(--font-mono)' }}>{selectedShipment.deliveryOtp || '482913'}</strong></span>
                <span>Override: <strong style={{ color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)' }}>777777</strong></span>
              </div>
              {otpError && (
                <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} color="#ef4444" />
                  <span>{otpError}</span>
                </div>
              )}
            </div>

            {/* Recipient Full Name Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Received By (Full Name):
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Consignee or authorized recipient"
                style={{
                  width: '100%',
                  backgroundColor: '#060911',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Signature Pad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <label style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileSignature size={15} color="var(--brand-cyan)" />
                  Recipient Digital Signature:
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Clear Pad
                </button>
              </div>
              <div style={{ position: 'relative', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', backgroundColor: '#060911', overflow: 'hidden' }}>
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={110}
                  onMouseDown={startDrawing}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchEnd={stopDrawing}
                  onTouchMove={draw}
                  style={{ width: '100%', height: '110px', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
                />
                {!hasSignature && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.8rem', pointerEvents: 'none' }}>
                    Sign with finger or stylus on touch screen
                  </div>
                )}
              </div>
            </div>

            {/* Photo POD Simulation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)' }}>
                <Camera size={16} color="var(--brand-cyan)" />
                <span>Doorstep Photo Proof:</span>
              </div>
              <button
                type="button"
                onClick={() => setHasPhoto(!hasPhoto)}
                className={hasPhoto ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              >
                {hasPhoto ? '✓ Photo Attached' : '+ Attach Photo'}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={isVerifying}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
                }}
              >
                {isVerifying ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify OTP &amp; Complete Delivery</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REPORT NDR / DELIVERY FAILURE EXCEPTION                           */}
      {/* ========================================================================= */}
      {ndrShipment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1050,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#0a0f1d',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 800, fontSize: '1.1rem' }}>
                <AlertTriangle size={20} color="#ef4444" />
                <span>Report Failed Delivery / NDR</span>
              </div>
              <button
                type="button"
                onClick={() => setNdrShipment(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '0.85rem', fontSize: '0.84rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff' }}>{ndrShipment.id}</div>
              <div style={{ color: '#e2e8f0', marginTop: '0.2rem' }}>{ndrShipment.recipient.name} • {ndrShipment.recipient.phone}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>{ndrShipment.recipient.address}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Failure Reason:</label>
              <select
                value={ndrReason}
                onChange={(e) => setNdrReason(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#060911',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Customer Phone Unreachable / Switched Off">Customer Phone Unreachable / Switched Off</option>
                <option value="Customer Rescheduled for Later / Evening">Customer Rescheduled for Later / Evening</option>
                <option value="Cash on Delivery (COD) Amount Not Ready">Cash on Delivery (COD) Amount Not Ready</option>
                <option value="Incorrect / Incomplete Delivery Address">Incorrect / Incomplete Delivery Address</option>
                <option value="Customer Refused to Accept Consignment">Customer Refused to Accept Consignment</option>
                <option value="Customer Not Available at Doorstep">Customer Not Available at Doorstep</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Field Remarks / Notes:</label>
              <textarea
                rows={3}
                value={ndrNotes}
                onChange={(e) => setNdrNotes(e.target.value)}
                placeholder="e.g. Called 3 times, customer requested reattempt tomorrow 10:00 AM."
                style={{
                  width: '100%',
                  backgroundColor: '#060911',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setNdrShipment(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportNdr}
                className="btn btn-primary"
                style={{ flex: 2, background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
              >
                Log NDR &amp; Schedule Reattempt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: HANDOVER CASH TO HUB CASHIER                                      */}
      {/* ========================================================================= */}
      {showRemitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1050,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#0a0f1d',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 800, fontSize: '1.1rem' }}>
                <Banknote size={20} color="#f59e0b" />
                <span>End-of-Shift Cash Remittance</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRemitModal(false)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>Total Cash Handover</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fde68a', margin: '0.35rem 0' }}>
                Rs. {stats.cashInHandNpr.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                From {activeRiderProfile.name}'s daily delivery run-sheet
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Receiving Cashier / Station Officer:</label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#060911',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Receiving Station Hub:</label>
              <input
                type="text"
                disabled
                value={activeRiderProfile.hubName}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowRemitModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemitCash}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  color: '#000000',
                  fontWeight: 800
                }}
              >
                Confirm Handover &amp; Issue Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: App Install Modal in Authenticated View */}
      {renderAppInstallModal()}

    </div>
  );
}
