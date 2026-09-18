'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Copy,
  Check,
  QrCode,
  CreditCard,
  Banknote,
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Package,
  FileText,
  CheckCircle2,
  Download,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Share2,
  Building,
  DollarSign,
  Barcode,
  Layers,
  Sparkles,
  Smartphone,
  Info
} from 'lucide-react';
import { Shipment, updateShipmentStatus } from '../../lib/store';
import { playScanBeep, playDispatchFanfare } from '../../lib/soundFx';
import { COMPANY_PAYMENT_DETAILS } from '../../lib/settings';

interface AWBViewModalProps {
  shipment: Shipment;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export default function AWBViewModal({ shipment, onClose, onStatusUpdated }: AWBViewModalProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(true);
  const [paymentTarget, setPaymentTarget] = useState<'freight' | 'cod' | 'full'>('full');
  const [paymentGateway, setPaymentGateway] = useState<'fonepay' | 'esewa' | 'khalti' | 'connectips' | 'cod'>('fonepay');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'cod_pending'>('unpaid');
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'packing_list' | 'billing' | 'payment_qr'>('overview');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [onClose]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Destination and Origin 3-letter IATA-style hub codes
  const originCode = (shipment.origin.city || 'KTM').substring(0, 3).toUpperCase();
  const destCode = (shipment.destination.city || 'NP').substring(0, 3).toUpperCase();

  // Packing List & Dimensions computation
  const packingDetails = useMemo(() => {
    const pieces = Math.max(1, shipment.cargo.pieces || 1);
    const weightKg = shipment.cargo.weightKg || 1;
    const declaredValue = shipment.cargo.declaredValueNpr || 4500;

    // Estimate realistic package dimensions if not explicitly set
    const lengthCm = Math.round(20 + Math.min(30, weightKg * 3));
    const widthCm = Math.round(15 + Math.min(20, weightKg * 2));
    const heightCm = Math.round(10 + Math.min(15, weightKg * 1.5));
    const volumeCbm = (lengthCm * widthCm * heightCm * pieces) / 1000000;
    
    // IATA Air Cargo Volumetric Weight standard: (L x W x H in cm) / 5000
    const volumetricWeightKg = Number(((lengthCm * widthCm * heightCm * pieces) / 5000).toFixed(2));
    const chargeableWeightKg = Math.max(weightKg, volumetricWeightKg);

    // Itemized inventory colli items
    const desc = shipment.cargo.description || 'General Commercial Cargo & Freight Parcel';
    const subItems = [
      {
        colliNo: '1 / ' + pieces,
        description: desc,
        qty: pieces,
        dimensions: `${lengthCm} × ${widthCm} × ${heightCm} cm`,
        actualWeight: `${weightKg.toFixed(1)} kg`,
        volumetricWeight: `${volumetricWeightKg.toFixed(1)} kg`,
        declaredValueNpr: declaredValue,
        handling: ['Handle With Care', weightKg > 10 ? 'Heavy Cargo' : 'Standard Express']
      }
    ];

    return {
      pieces,
      weightKg,
      declaredValue,
      lengthCm,
      widthCm,
      heightCm,
      volumeCbm: volumeCbm.toFixed(4),
      volumetricWeightKg,
      chargeableWeightKg,
      items: subItems
    };
  }, [shipment]);

  // Comprehensive Fare & Billing Breakdown computation
  const billingBreakdown = useMemo(() => {
    const isValleyToValley =
      shipment.origin.city === 'Kathmandu' &&
      (shipment.destination.city === 'Lalitpur' || shipment.destination.city === 'Bhaktapur');

    const isRemote = ['Jumla', 'Surkhet', 'Dhangadhi', 'Ilam', 'Bajura'].includes(shipment.destination.city);

    let baseRate = isValleyToValley ? 110 : (isRemote ? 320 : 180);
    let perKgRate = isValleyToValley ? 20 : (isRemote ? 45 : 30);

    if (shipment.serviceCode === 'EXP' || shipment.serviceCode === 'RUSH') {
      baseRate += 60;
      perKgRate += 15;
    }

    const weightCharge = Math.max(0, Math.ceil(packingDetails.chargeableWeightKg - 1)) * perKgRate;
    const codAmount = shipment.codAmount || 0;
    const codHandlingFee = codAmount > 0 ? Math.max(45, Math.round(codAmount * 0.012)) : 0;
    const transitInsurance = Math.round(packingDetails.declaredValue * 0.005);
    const fuelTerminalSurcharge = 35;
    const subtotal = baseRate + weightCharge + codHandlingFee + transitInsurance + fuelTerminalSurcharge;
    const vat13Pct = Math.round(subtotal * 0.13);
    const totalFreightBill = subtotal + vat13Pct;
    const grandTotalCombined = totalFreightBill + codAmount;

    return {
      baseRate,
      weightCharge,
      codAmount,
      codHandlingFee,
      transitInsurance,
      fuelTerminalSurcharge,
      subtotal,
      vat13Pct,
      totalFreightBill,
      grandTotalCombined
    };
  }, [shipment, packingDetails]);

  // Selected payment amount depending on user choice
  const activeAmountNpr = useMemo(() => {
    if (paymentTarget === 'freight') return billingBreakdown.totalFreightBill;
    if (paymentTarget === 'cod') return billingBreakdown.codAmount || billingBreakdown.totalFreightBill;
    return billingBreakdown.grandTotalCombined;
  }, [paymentTarget, billingBreakdown]);

  // Generate real dynamic QR code whenever amount, gateway, or target changes
  useEffect(() => {
    setQrLoading(true);
    let payload = '';

    if (paymentGateway === 'fonepay') {
      // Fonepay / NIC ASIA Bank EMVCo payload representation
      payload = `fonepay://pay?merchant=SOBIN_UPRETI&name=SOBIN%20UPRETI&bank=NIC_ASIA_BANK&account=3025752253490001&branch=Lagankhel&amount=${activeAmountNpr}&ref=${encodeURIComponent(shipment.id)}&remarks=AWB_${encodeURIComponent(shipment.id)}_${paymentTarget.toUpperCase()}`;
    } else if (paymentGateway === 'esewa') {
      // eSewa Wallet direct payment payload with 9745255231
      payload = `esewa://pay?to=9745255231&name=SOBIN%20UPRETI&amount=${activeAmountNpr}&pid=${encodeURIComponent(shipment.id)}&remarks=AWB_${encodeURIComponent(shipment.id)}&scd=EPAYTEST`;
    } else if (paymentGateway === 'khalti') {
      // Khalti Wallet payment payload with 9745255231
      payload = `khalti://pay?mobile=9745255231&name=SOBIN%20UPRETI&product_identity=${encodeURIComponent(shipment.id)}&amount=${activeAmountNpr * 100}&remarks=AWB_${encodeURIComponent(shipment.id)}`;
    } else if (paymentGateway === 'connectips') {
      // ConnectIPS / Direct Bank transfer to NIC ASIA BANK (Lagankhel)
      payload = `connectips://transfer?bank=NIC_ASIA_BANK&branch=Lagankhel&account=3025752253490001&receiver=SOBIN%20UPRETI&amount=${activeAmountNpr}&ref=${encodeURIComponent(shipment.id)}`;
    } else {
      payload = `DOUBLE7_COD_COLLECT:${shipment.id}:NPR_${activeAmountNpr}:A_C_SOBIN_UPRETI_3025752253490001`;
    }

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 1,
      color: {
        dark: '#080c15',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H'
    })
      .then((url: string) => {
        setQrDataUrl(url);
        setQrLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Failed to generate QR code:', err);
        setQrLoading(false);
      });
  }, [activeAmountNpr, paymentGateway, paymentTarget, shipment.id]);

  // Simulate payment settlement
  const handleSimulatePayment = () => {
    try {
      playDispatchFanfare();
    } catch {
      // Audio fallback
    }

    const targetLabel = paymentTarget === 'freight' ? 'Freight Fare' : (paymentTarget === 'cod' ? 'COD Amount' : 'Full Invoice');
    const gatewayLabel = paymentGateway === 'fonepay' ? 'Fonepay QR' : (paymentGateway === 'esewa' ? 'eSewa' : (paymentGateway === 'khalti' ? 'Khalti' : 'ConnectIPS'));

    setPaymentStatus('paid');
    setPaymentSuccessToast(`Payment of Rs. ${activeAmountNpr.toLocaleString()} settled via ${gatewayLabel} for ${targetLabel}!`);

    // Record in shipment notes
    updateShipmentStatus(
      shipment.id,
      shipment.status,
      undefined,
      `Payment Received: Rs. ${activeAmountNpr.toLocaleString()} paid via ${gatewayLabel} (${targetLabel}) [Ref: ${shipment.id}]`
    );

    if (onStatusUpdated) {
      onStatusUpdated();
    }

    setTimeout(() => setPaymentSuccessToast(null), 5000);
  };

  // Download QR Code image
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Double7_Payment_QR_${shipment.id}_${activeAmountNpr}NPR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="awb-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="card awb-screen-modal"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0c1220',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL HEADER BAR ================= */}
        <div
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                flexShrink: 0,
              }}
            >
              <FileText size={22} strokeWidth={2.4} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Air Waybill &amp; Billing Dossier
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '0.18rem 0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(249, 115, 22, 0.12)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    color: 'var(--brand-orange)',
                  }}
                >
                  {shipment.id}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Official Carriage Manifest &bull; Double 7 High-Velocity Dispatch Network
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-outline btn-sm"
              title="Print Official AWB Document"
              style={{ gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Printer size={14} />
              <span>Print AWB</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================= TAB NAVIGATION ================= */}
        <div
          className="mobile-scroll-x"
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'overview' ? '1px solid rgba(249, 115, 22, 0.35)' : '1px solid transparent',
              backgroundColor: activeTab === 'overview' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'overview' ? 'var(--brand-orange)' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Truck size={14} />
            <span>AWB Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packing_list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'packing_list' ? '1px solid rgba(249, 115, 22, 0.35)' : '1px solid transparent',
              backgroundColor: activeTab === 'packing_list' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'packing_list' ? 'var(--brand-orange)' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Package size={14} />
            <span>Packing List ({packingDetails.pieces} Colli)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'billing' ? '1px solid rgba(249, 115, 22, 0.35)' : '1px solid transparent',
              backgroundColor: activeTab === 'billing' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'billing' ? 'var(--brand-orange)' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Banknote size={14} />
            <span>Bill Amount &amp; Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment_qr')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'payment_qr' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
              backgroundColor: activeTab === 'payment_qr' ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
              color: activeTab === 'payment_qr' ? '#22d3ee' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <QrCode size={14} />
            <span>Dynamic Payment QR</span>
          </button>
        </div>

        {/* ================= MODAL SCROLLABLE CONTENT ================= */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {/* Toast Notice */}
          {paymentSuccessToast && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                color: '#34d399',
                fontSize: '0.86rem',
                fontWeight: 600,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{paymentSuccessToast}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Waybill Hero Barcode & Corridor Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(14, 20, 36, 0.95), rgba(19, 27, 46, 0.95))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Waybill Telemetry Barcode
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#ffffff', letterSpacing: '0.02em', marginTop: '0.15rem' }}>
                    {shipment.id}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>
                      {shipment.service}
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                      Status: {shipment.status}
                    </span>
                    {shipment.codAmount && shipment.codAmount > 0 ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        COD Rs. {shipment.codAmount.toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Corridor Route Visual */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    DISPATCH CORRIDOR
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                    <span>{shipment.origin.city}</span>
                    <span style={{ color: 'var(--brand-orange)' }}>&rarr;</span>
                    <span>{shipment.destination.city}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Via {shipment.destination.hub}
                  </div>
                </div>
              </div>

              {/* Shipper & Consignee 2-Col Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {/* Shipper Card */}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1.1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--brand-orange)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                    <Building size={14} />
                    <span>Consignor (Shipper / Sender)</span>
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
                    {shipment.sender.company || shipment.sender.name}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Attention: {shipment.sender.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                    <Phone size={13} color="var(--brand-orange)" />
                    <span>{shipment.sender.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <MapPin size={13} />
                    <span>{shipment.origin.hub}, {shipment.origin.city}</span>
                  </div>
                </div>

                {/* Consignee Card */}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1.1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--brand-cyan)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                    <MapPin size={14} />
                    <span>Consignee (Recipient)</span>
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
                    {shipment.recipient.name}
                  </div>
                  {shipment.recipient.company ? (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {shipment.recipient.company}
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                    <Phone size={13} color="var(--brand-cyan)" />
                    <span>{shipment.recipient.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    <MapPin size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{shipment.recipient.address}, {shipment.destination.city}</span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Cards (Weight, COD, Billing) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CARGO WEIGHT</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {packingDetails.weightKg} KG
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Chargeable: {packingDetails.chargeableWeightKg} KG
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>FREIGHT BILL FARE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    Rs. {billingBreakdown.totalFreightBill.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Taxes &amp; Handling Incl.
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>COD COLLECTION</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: billingBreakdown.codAmount ? '#34d399' : '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {billingBreakdown.codAmount ? `Rs. ${billingBreakdown.codAmount.toLocaleString()}` : 'Non-COD (Prepaid)'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Payable upon delivery
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAYMENT STATUS</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: paymentStatus === 'paid' ? '#34d399' : '#fbbf24', marginTop: '2px' }}>
                    {paymentStatus === 'paid' ? 'Paid & Settled' : 'Pending Settlement'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Scan QR to verify
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PACKING LIST */}
          {activeTab === 'packing_list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                    Colli Inventory &amp; Cargo Packing Manifest
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Comprehensive packing list specifications, colli counts, volumetric dimensions, and hazard tags.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-subtle" style={{ fontSize: '0.72rem' }}>
                    Total Pieces: {packingDetails.pieces}
                  </span>
                  <span className="badge badge-subtle" style={{ fontSize: '0.72rem' }}>
                    Total Volume: {packingDetails.volumeCbm} m³
                  </span>
                </div>
              </div>

              {/* Packing List Table */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Colli #</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Item Description</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Qty</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Dimensions (L×W×H)</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Actual Wt</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Volumetric Wt</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Declared Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packingDetails.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-orange)' }}>
                          {item.colliNo}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.description}</div>
                          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
                            {item.handling.map((h, i) => (
                              <span key={i} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                {h}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>
                          {item.qty} Pcs
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {item.dimensions}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                          {item.actualWeight}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--brand-cyan)' }}>
                          {item.volumetricWeight}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', textAlign: 'right' }}>
                          Rs. {item.declaredValueNpr.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Volumetric Weight Formula Card */}
              <div
                style={{
                  padding: '0.85rem 1.1rem',
                  backgroundColor: 'rgba(6, 182, 212, 0.06)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  fontSize: '0.8rem',
                }}
              >
                <Info size={20} color="var(--brand-cyan)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#ffffff' }}>IATA Air Cargo Volumetric Weight Rule:</strong> Chargeable weight is determined by taking the maximum of actual gross weight ({packingDetails.weightKg} kg) vs volumetric weight ({packingDetails.volumetricWeightKg} kg, calculated as L×W×H / 5000). Chargeable weight for this consignment is <strong>{packingDetails.chargeableWeightKg} KG</strong>.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BILL AMOUNT & BREAKDOWN */}
          {activeTab === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  Itemized Tariff &amp; Billing Statement
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Transparent freight cost breakdown with linehaul charges, insurance coverage, and COD fees.
                </p>
              </div>

              {/* Billing Table */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Base Linehaul Freight Rate ({shipment.origin.city} &rarr; {shipment.destination.city}):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                      Rs. {billingBreakdown.baseRate.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Incremental Weight Surcharge ({packingDetails.chargeableWeightKg} KG):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                      Rs. {billingBreakdown.weightCharge.toLocaleString()}
                    </span>
                  </div>

                  {billingBreakdown.codHandlingFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Cash on Delivery (COD) Automated Remittance Fee:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                        Rs. {billingBreakdown.codHandlingFee.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Transit Risk Cargo Insurance (0.5% of Declared Rs. {packingDetails.declaredValue.toLocaleString()}):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                      Rs. {billingBreakdown.transitInsurance.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Fuel Index &amp; Hub Cross-Docking Surcharge:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                      Rs. {billingBreakdown.fuelTerminalSurcharge.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>VAT &amp; Statutory Service Taxes (13%):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                      Rs. {billingBreakdown.vat13Pct.toLocaleString()}
                    </span>
                  </div>

                  {/* Freight Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase' }}>
                        TOTAL FREIGHT BILLING AMOUNT
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        All handling, transit, and tax charges included
                      </div>
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)' }}>
                      Rs. {billingBreakdown.totalFreightBill.toLocaleString()} <span style={{ fontSize: '0.75rem' }}>NPR</span>
                    </div>
                  </div>

                  {/* Cash on Delivery Notice */}
                  {billingBreakdown.codAmount > 0 && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#34d399' }}>
                          Cash on Delivery (COD) Goods Value:
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Collected by dispatch rider from consignee upon handover
                        </div>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        Rs. {billingBreakdown.codAmount.toLocaleString()} NPR
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DYNAMIC PAYMENT QR */}
          {activeTab === 'payment_qr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  Generate Dynamic Payment QR Code
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Select the particular booking value to bill, choose your payment gateway, and scan directly via Fonepay or digital wallets.
                </p>
              </div>

              {/* 1. Value Selector */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Payment Value Target:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentTarget('freight')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      border: paymentTarget === 'freight' ? '1px solid var(--brand-orange)' : '1px solid var(--border-subtle)',
                      backgroundColor: paymentTarget === 'freight' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Freight Fare Only</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      Rs. {billingBreakdown.totalFreightBill.toLocaleString()}
                    </div>
                  </button>

                  {billingBreakdown.codAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentTarget('cod')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        border: paymentTarget === 'cod' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                        backgroundColor: paymentTarget === 'cod' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>COD Cargo Value</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        Rs. {billingBreakdown.codAmount.toLocaleString()}
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPaymentTarget('full')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      border: paymentTarget === 'full' ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
                      backgroundColor: paymentTarget === 'full' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Combined Total</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22d3ee', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      Rs. {billingBreakdown.grandTotalCombined.toLocaleString()}
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Gateway Selector */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Payment Gateway / Rail:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                  {[
                    { id: 'fonepay', name: 'NIC ASIA / Fonepay QR', color: '#ef4444' },
                    { id: 'esewa', name: 'eSewa (9745255231)', color: '#10b981' },
                    { id: 'khalti', name: 'Khalti (9745255231)', color: '#a855f7' },
                    { id: 'connectips', name: 'ConnectIPS / Bank Transfer', color: '#3b82f6' },
                    { id: 'cod', name: 'Rider Cash / POS', color: '#f59e0b' },
                  ].map((gw) => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setPaymentGateway(gw.id as typeof paymentGateway)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: paymentGateway === gw.id ? `1px solid ${gw.color}` : '1px solid var(--border-subtle)',
                        backgroundColor: paymentGateway === gw.id ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        color: paymentGateway === gw.id ? '#ffffff' : 'var(--text-secondary)',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {gw.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Settlement Beneficiary Details Card */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(249, 115, 22, 0.35)',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building size={16} color="var(--brand-orange)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Official Settlement Beneficiary Details
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem', borderRadius: '20px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontWeight: 700, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                    ✓ Verified Account
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  {/* NIC ASIA BANK Details */}
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                        Primary Bank Account
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--brand-orange)', fontWeight: 800 }}>NIC ASIA BANK</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', marginTop: '0.3rem' }}>
                      SOBIN UPRETI
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)', fontWeight: 800, marginTop: '0.2rem' }}>
                      A/C: 3025752253490001
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      Branch: <strong>Lagankhel</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('3025752253490001', 'bank_ac')}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.6rem', padding: '0.25rem 0.6rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {copiedText === 'bank_ac' ? <Check size={13} color="var(--brand-emerald)" /> : <Copy size={13} />}
                      <span>{copiedText === 'bank_ac' ? 'Copied Account No' : 'Copy A/C No'}</span>
                    </button>
                  </div>

                  {/* eSewa & Khalti Digital Wallets */}
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                        Digital Wallets (Instant QR)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 800 }}>eSewa &bull; Khalti</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', marginTop: '0.3rem' }}>
                      SOBIN UPRETI
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Wallet ID:</span>
                      <strong style={{ fontSize: '0.92rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>9745255231</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      Accepted on both eSewa &amp; Khalti
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => handleCopy('9745255231', 'esewa')}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {copiedText === 'esewa' ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedText === 'esewa' ? 'Copied' : 'Copy eSewa'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy('9745255231', 'khalti')}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {copiedText === 'khalti' ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedText === 'khalti' ? 'Copied' : 'Copy Khalti'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Generated QR Display Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2rem',
                  flexWrap: 'wrap',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                }}
              >
                {/* QR Code Container */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '14px',
                    borderRadius: '14px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {qrLoading ? (
                    <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#080c15' }}>
                      Generating QR...
                    </div>
                  ) : (
                    <img
                      src={qrDataUrl}
                      alt={`Payment QR for ${shipment.id}`}
                      style={{ width: '220px', height: '220px', display: 'block' }}
                    />
                  )}
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#080c15', letterSpacing: '0.08em', marginTop: '6px', textTransform: 'uppercase' }}>
                    SOBIN UPRETI &bull; NIC ASIA (Lagankhel)
                  </div>
                </div>

                {/* QR Details & Action Suite */}
                <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--brand-cyan)', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Dynamic Payment Payload
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      Rs. {activeAmountNpr.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>NPR</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Payee: <strong style={{ color: '#ffffff' }}>SOBIN UPRETI</strong> &bull; NIC ASIA BANK (Lagankhel)
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      A/C: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-orange)', fontWeight: 800 }}>3025752253490001</span> &bull; Wallet: <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 800 }}>9745255231</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Ref: <span style={{ fontFamily: 'var(--font-mono)' }}>{shipment.id}</span> &bull; Gate: <span style={{ textTransform: 'uppercase' }}>{paymentGateway}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Download size={14} />
                      <span>Download QR PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(shipment.id, 'id')}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {copiedText === 'id' ? <Check size={14} color="var(--brand-emerald)" /> : <Copy size={14} />}
                      <span>Copy AWB Ref</span>
                    </button>
                  </div>

                  {/* Simulate Instant Payment Button */}
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirm &amp; Settle Rs. {activeAmountNpr.toLocaleString()} NPR</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER BAR ================= */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={14} color="var(--brand-orange)" />
            <span>Cryptographically Verified AWB &bull; 24-Hour Settlement SLA</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>

      {/* ================= DEDICATED PRINTABLE AIR WAYBILL & MANIFEST DOSSIER ================= */}
      {/* Hidden on web screen; Activated and displayed razor-sharp during browser print */}
      <div id="printable-awb-dossier" className="printable-awb-document">
        <div style={{
          width: '100%',
          maxWidth: '195mm',
          margin: '0 auto',
          padding: '6mm 8mm',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: 'var(--font-sans)',
          fontSize: '9.5pt',
          lineHeight: 1.35,
        }}>
          {/* Header with Logo, Title, and Badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #000000', paddingBottom: '8px', marginBottom: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/images/logo.png" alt="Double 7" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #000000' }} />
                <div>
                  <div style={{ fontSize: '17pt', fontWeight: 900, letterSpacing: '-0.02em', color: '#000000', lineHeight: 1.1 }}>
                    DOUBLE 7 LOGISTICS
                  </div>
                  <div style={{ fontSize: '7pt', fontWeight: 800, color: '#111111', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Next-Gen Global Supply Chain &bull; Air Cargo &bull; 77 Districts Network
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '7.5pt', color: '#333333', marginTop: '4px' }}>
                Official Air Waybill (AWB) &bull; Carriage Manifest &bull; Dispatch Hub: KTM-CENTRAL
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-block',
                border: '2px solid #000000',
                padding: '3px 10px',
                fontWeight: 900,
                fontSize: '11pt',
                fontFamily: 'monospace',
                backgroundColor: '#f3f4f6',
              }}>
                {originCode} &rarr; {destCode}
              </div>
              <div style={{ fontSize: '7.5pt', fontWeight: 800, marginTop: '3px', textTransform: 'uppercase' }}>
                SERVICE: {shipment.service}
              </div>
              <div style={{ fontSize: '7pt', color: '#444444' }}>
                DATE: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* High-Contrast Courier Barcode Strip */}
          <div style={{
            border: '1.5px solid #000000',
            padding: '6px 10px',
            marginBottom: '10px',
            textAlign: 'center',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'stretch',
              height: '36px',
              gap: '2px',
              margin: '0 auto 4px auto',
              maxWidth: '320px'
            }}>
              {[3,1,2,4,1,3,2,1,4,2,3,1,1,4,2,3,1,2,4,1,3,2,1,4,2,1,3,4,1,2,3,1,4,2,1,3,2,4,1,3].map((w, i) => (
                <div
                  key={i}
                  style={{
                    background: i % 2 === 0 ? '#000000' : 'transparent',
                    width: `${w * 1.8}px`,
                    height: '100%'
                  }}
                />
              ))}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '12pt', fontWeight: 900, letterSpacing: '2px', color: '#000000' }}>
              * {shipment.id} *
            </div>
            <div style={{ fontSize: '7pt', color: '#444444', fontWeight: 600 }}>
              AWB NO: {shipment.telemetry.waybillNumber || shipment.id} &bull; TELEMETRY NODE: NP-77-VERIFIED
            </div>
          </div>

          {/* Shipper & Consignee 2-Box Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {/* Box 1: Shipper */}
            <div style={{ border: '1.5px solid #000000', padding: '6px 8px', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', color: '#444444', borderBottom: '1px solid #cccccc', paddingBottom: '2px', marginBottom: '4px' }}>
                1. SHIPPER / CONSIGNOR (ORIGIN)
              </div>
              <div style={{ fontSize: '9.5pt', fontWeight: 800, color: '#000000' }}>
                {shipment.sender.name}
              </div>
              <div style={{ fontSize: '8pt', color: '#222222', marginTop: '1px' }}>
                {shipment.sender.company || shipment.origin.hub}, {shipment.origin.city}
              </div>
              <div style={{ fontSize: '8pt', fontWeight: 700, marginTop: '2px' }}>
                TEL: {shipment.sender.phone}
              </div>
              <div style={{ fontSize: '7pt', color: '#555555', marginTop: '1px' }}>
                ORIGIN HUB: {shipment.origin.city.toUpperCase()}-CENTRAL-NODE
              </div>
            </div>

            {/* Box 2: Consignee */}
            <div style={{ border: '2px solid #000000', padding: '6px 8px', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', color: '#000000', borderBottom: '1px solid #000000', paddingBottom: '2px', marginBottom: '4px' }}>
                2. CONSIGNEE / DELIVER TO (DESTINATION)
              </div>
              <div style={{ fontSize: '10.5pt', fontWeight: 900, color: '#000000' }}>
                {shipment.recipient.name}
              </div>
              <div style={{ fontSize: '8.5pt', fontWeight: 600, color: '#111111', marginTop: '1px' }}>
                {shipment.recipient.address || shipment.destination.city}, {shipment.destination.city}
              </div>
              <div style={{ fontSize: '9pt', fontWeight: 800, marginTop: '2px' }}>
                TEL: {shipment.recipient.phone}
              </div>
              <div style={{ fontSize: '7pt', fontWeight: 700, color: '#000000', marginTop: '1px' }}>
                DESTINATION HUB: {shipment.destination.city.toUpperCase()}-EXPRESS-DISPATCH
              </div>
            </div>
          </div>

          {/* Cargo Weights & Specifications Bar */}
          <div style={{ border: '1.5px solid #000000', marginBottom: '10px' }}>
            <div style={{ fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', backgroundColor: '#f3f4f6', padding: '3px 8px', borderBottom: '1px solid #000000' }}>
              3. CARGO SPECIFICATIONS &amp; VOLUMETRIC DIMENSIONS (IATA AIR CARGO STANDARD)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', fontSize: '7.5pt', textAlign: 'center' }}>
              <div style={{ padding: '5px 3px', borderRight: '1px solid #dddddd' }}>
                <div style={{ fontSize: '6.5pt', color: '#555555' }}>PIECES</div>
                <div style={{ fontWeight: 800, fontSize: '9pt' }}>{packingDetails.pieces} Colli</div>
              </div>
              <div style={{ padding: '5px 3px', borderRight: '1px solid #dddddd' }}>
                <div style={{ fontSize: '6.5pt', color: '#555555' }}>ACTUAL WT</div>
                <div style={{ fontWeight: 800, fontSize: '9pt' }}>{packingDetails.weightKg} kg</div>
              </div>
              <div style={{ padding: '5px 3px', borderRight: '1px solid #dddddd' }}>
                <div style={{ fontSize: '6.5pt', color: '#555555' }}>VOLUMETRIC</div>
                <div style={{ fontWeight: 800, fontSize: '9pt' }}>{packingDetails.volumetricWeightKg} kg</div>
              </div>
              <div style={{ padding: '5px 3px', borderRight: '1px solid #dddddd' }}>
                <div style={{ fontSize: '6.5pt', color: '#555555' }}>CHARGEABLE WT</div>
                <div style={{ fontWeight: 900, fontSize: '9pt', color: '#000000' }}>{packingDetails.chargeableWeightKg} kg</div>
              </div>
              <div style={{ padding: '5px 3px', borderRight: '1px solid #dddddd' }}>
                <div style={{ fontSize: '6.5pt', color: '#555555' }}>DIMENSIONS</div>
                <div style={{ fontWeight: 700, fontSize: '7.5pt' }}>{packingDetails.lengthCm}×{packingDetails.widthCm}×{packingDetails.heightCm} cm</div>
              </div>
              <div style={{ padding: '5px 3px' }}>
                <div style={{ fontSize: '6.5pt', color: '#555555' }}>DECLARED VALUE</div>
                <div style={{ fontWeight: 800, fontSize: '8.5pt' }}>Rs. {packingDetails.declaredValue.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Itemized Packing List Table */}
          <div style={{ border: '1.5px solid #000000', marginBottom: '10px' }}>
            <div style={{ fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', backgroundColor: '#f3f4f6', padding: '3px 8px', borderBottom: '1px solid #000000' }}>
              4. ITEMIZED CARGO PACKING LIST &amp; CUSTOMS DECLARATION
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fafafa', textAlign: 'left' }}>
                  <th style={{ padding: '3px 6px', width: '65px' }}>COLLI #</th>
                  <th style={{ padding: '3px 6px' }}>CONTENTS DESCRIPTION</th>
                  <th style={{ padding: '3px 6px', width: '40px', textAlign: 'center' }}>QTY</th>
                  <th style={{ padding: '3px 6px', width: '100px' }}>DIMENSIONS</th>
                  <th style={{ padding: '3px 6px', width: '70px', textAlign: 'right' }}>ACTUAL WT</th>
                  <th style={{ padding: '3px 6px', width: '90px', textAlign: 'right' }}>DECLARED VAL</th>
                </tr>
              </thead>
              <tbody>
                {packingDetails.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eeeeee' }}>
                    <td style={{ padding: '3px 6px', fontFamily: 'monospace', fontWeight: 700 }}>{item.colliNo}</td>
                    <td style={{ padding: '3px 6px', fontWeight: 600 }}>{item.description}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '3px 6px', fontSize: '7pt' }}>{item.dimensions}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'right' }}>{item.actualWeight}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 700 }}>Rs. {item.declaredValueNpr.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Billing & Payment QR 2-Column Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px', marginBottom: '10px' }}>
            {/* Financial Breakdown Table */}
            <div style={{ border: '1.5px solid #000000', padding: '5px 8px' }}>
              <div style={{ fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #000000', paddingBottom: '2px', marginBottom: '4px' }}>
                5. AIR CARGO BILLING ASSESSMENT
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '1.5px 0', color: '#444444' }}>Base Freight Fare:</td>
                    <td style={{ padding: '1.5px 0', textAlign: 'right', fontWeight: 600 }}>Rs. {billingBreakdown.baseRate}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1.5px 0', color: '#444444' }}>Chargeable Weight Surcharge:</td>
                    <td style={{ padding: '1.5px 0', textAlign: 'right', fontWeight: 600 }}>Rs. {billingBreakdown.weightCharge}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1.5px 0', color: '#444444' }}>Fuel &amp; Security Surcharge:</td>
                    <td style={{ padding: '1.5px 0', textAlign: 'right', fontWeight: 600 }}>Rs. {billingBreakdown.fuelTerminalSurcharge}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1.5px 0', color: '#444444' }}>Cargo Insurance (0.5%):</td>
                    <td style={{ padding: '1.5px 0', textAlign: 'right', fontWeight: 600 }}>Rs. {billingBreakdown.transitInsurance}</td>
                  </tr>
                  {billingBreakdown.codAmount > 0 && (
                    <tr>
                      <td style={{ padding: '1.5px 0', color: '#444444' }}>COD Remittance Fee:</td>
                      <td style={{ padding: '1.5px 0', textAlign: 'right', fontWeight: 600 }}>Rs. {billingBreakdown.codHandlingFee}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '1.5px solid #000000' }}>
                    <td style={{ padding: '3px 0', fontWeight: 900, fontSize: '8.5pt' }}>TOTAL AIR FREIGHT:</td>
                    <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 900, fontSize: '9.5pt' }}>
                      Rs. {billingBreakdown.totalFreightBill.toLocaleString()}
                    </td>
                  </tr>
                  {billingBreakdown.codAmount > 0 && (
                    <tr style={{ borderTop: '1px dashed #666666' }}>
                      <td style={{ padding: '2px 0', fontWeight: 800, color: '#000000', fontSize: '8pt' }}>C.O.D. CASH TO COLLECT:</td>
                      <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 900, fontSize: '9pt' }}>
                        Rs. {billingBreakdown.codAmount.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment & Verification QR Box */}
            <div style={{ border: '1.5px solid #000000', padding: '5px 6px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', width: '100%', borderBottom: '1px solid #000000', paddingBottom: '2px' }}>
                6. DIGITAL PAYMENT &amp; TELEMETRY QR
              </div>
              
              <div style={{ margin: '4px auto', width: '76px', height: '76px', border: '1px solid #cccccc', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Payment QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontSize: '6pt', color: '#666666' }}>QR Code</div>
                )}
              </div>

              <div style={{ fontSize: '6.2pt', color: '#222222', lineHeight: 1.2 }}>
                <div><strong>A/C:</strong> SOBIN UPRETI &bull; NIC ASIA BANK</div>
                <div><strong>A/C NO:</strong> 3025752253490001 (Lagankhel)</div>
                <div><strong>ESEWA / KHALTI:</strong> 9745255231</div>
              </div>

              <div style={{
                marginTop: '3px',
                padding: '1px 6px',
                border: '1px solid #000000',
                fontSize: '6.5pt',
                fontWeight: 800,
                backgroundColor: paymentStatus === 'paid' ? '#e6f4ea' : '#fef3c7'
              }}>
                STATUS: {paymentStatus === 'paid' ? 'PAID & VERIFIED' : 'PENDING SETTLEMENT'}
              </div>
            </div>
          </div>

          {/* Signatures & Execution Section */}
          <div style={{ border: '1.5px solid #000000', padding: '6px 8px', marginTop: '2px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', fontSize: '7pt' }}>
              <div>
                <div style={{ height: '28px', borderBottom: '1px solid #000000', marginBottom: '3px' }}></div>
                <div style={{ fontWeight: 800 }}>SHIPPER ACCEPTANCE</div>
                <div style={{ color: '#666666', fontSize: '6pt' }}>Goods handed over in good order</div>
              </div>
              <div>
                <div style={{ height: '28px', borderBottom: '1px solid #000000', marginBottom: '3px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <span style={{ fontSize: '6pt', fontFamily: 'monospace', fontWeight: 800, color: '#111111' }}>[DOUBLE 7 AUTH SEAL]</span>
                </div>
                <div style={{ fontWeight: 800 }}>CARRIER DISPATCH AGENT</div>
                <div style={{ color: '#666666', fontSize: '6pt' }}>Authorized Double 7 Dispatch</div>
              </div>
              <div>
                <div style={{ height: '28px', borderBottom: '1px solid #000000', marginBottom: '3px' }}></div>
                <div style={{ fontWeight: 800 }}>CONSIGNEE PROOF OF DELIVERY (POD)</div>
                <div style={{ color: '#666666', fontSize: '6pt' }}>Received in full with seal intact</div>
              </div>
            </div>
          </div>

          {/* Legal Carriage Notice Footer */}
          <div style={{ fontSize: '5.8pt', color: '#666666', textAlign: 'center', marginTop: '6px', lineHeight: 1.25 }}>
            This Air Waybill is an official non-negotiable contract of carriage subject to Double 7 Logistics Standard Terms &amp; Conditions.
            Consignment is tracked via real-time telemetry nodes across Nepal's 77 districts. Customer Support: 01-5970000 / dispatch@sobinupreti.com.np.
          </div>
        </div>
      </div>
    </div>
  );
}
