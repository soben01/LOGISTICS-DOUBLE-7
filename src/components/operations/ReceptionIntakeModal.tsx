'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Package,
  User,
  Phone,
  MapPin,
  Banknote,
  Scale,
  Sparkles,
  ArrowRight,
  QrCode
} from 'lucide-react';
import { createShipment, Shipment } from '../../lib/store';

interface ReceptionIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (shipment: Shipment, shouldPrint?: boolean) => void;
  defaultOriginCity?: string;
  defaultOriginHub?: string;
}

const NEPAL_DESTINATIONS = [
  { city: 'Pokhara', hub: 'Pokhara Regional Hub (PKR)', province: 'Gandaki Province' },
  { city: 'Kathmandu', hub: 'Kathmandu Central Hub (KTM-01)', province: 'Bagmati Province' },
  { city: 'Lalitpur', hub: 'Patan Valley Hub', province: 'Bagmati Province' },
  { city: 'Bhaktapur', hub: 'Bhaktapur Hub', province: 'Bagmati Province' },
  { city: 'Biratnagar', hub: 'Biratnagar Eastern Hub (BRT)', province: 'Koshi Province' },
  { city: 'Birgunj', hub: 'Birgunj Industrial Gateway (BRG)', province: 'Madhesh Province' },
  { city: 'Chitwan', hub: 'Chitwan Central Hub (CHT)', province: 'Bagmati Province' },
  { city: 'Butwal', hub: 'Butwal Western Hub (BTW)', province: 'Lumbini Province' },
  { city: 'Dharan', hub: 'Dharan Regional Depot', province: 'Koshi Province' },
  { city: 'Nepalgunj', hub: 'Nepalgunj Hub (NPJ)', province: 'Lumbini Province' },
  { city: 'Dhangadhi', hub: 'Dhangadhi Far-Western Hub (DHI)', province: 'Sudurpashchim Province' },
  { city: 'Hetauda', hub: 'Hetauda Industrial Depot', province: 'Bagmati Province' },
];

export default function ReceptionIntakeModal({
  isOpen,
  onClose,
  onCreated,
  defaultOriginCity = 'Kathmandu',
  defaultOriginHub = 'Kathmandu Central Hub'
}: ReceptionIntakeModalProps) {
  const [awbPrefix, setAwbPrefix] = useState<'VIP' | 'BCC' | 'FIC'>('VIP');
  const [customAwbNumber, setCustomAwbNumber] = useState('');
  
  // Sender Details
  const [senderType, setSenderType] = useState<'walkin' | 'merchant'>('walkin');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderCompany, setSenderCompany] = useState('');
  
  // Consignee Details
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneePhone, setConsigneePhone] = useState('');
  const [destinationCity, setDestinationCity] = useState('Pokhara');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Package & Payment Details
  const [weightKg, setWeightKg] = useState('1.0');
  const [pieces, setPieces] = useState('1');
  const [serviceType, setServiceType] = useState('Express Courier');
  const [cargoDescription, setCargoDescription] = useState('General Documents / Parcel');
  const [paymentMode, setPaymentMode] = useState<'cash_counter' | 'cod' | 'fonepay_qr'>('cash_counter');
  const [codAmount, setCodAmount] = useState('0');
  const [chargesNpr, setChargesNpr] = useState('250');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Generate sequence number
  const generateAwbId = () => {
    if (customAwbNumber.trim()) {
      return customAwbNumber.trim().toUpperCase();
    }
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `${awbPrefix}${rand}`;
  };

  const handleSubmit = async (shouldPrint = false) => {
    if (!consigneeName.trim() || !consigneePhone.trim() || !deliveryAddress.trim()) {
      alert('Please enter recipient name, phone number, and delivery address.');
      return;
    }

    setSubmitting(true);
    const awbId = generateAwbId();
    const destMeta = NEPAL_DESTINATIONS.find(d => d.city === destinationCity) || {
      city: destinationCity,
      hub: `${destinationCity} Hub`,
      province: 'Nepal'
    };

    const newShipmentData: Partial<Shipment> = {
      id: awbId,
      bookingNo: awbId,
      trackingNo: awbId,
      parcelNo: `PCL-${awbId}`,
      service: serviceType,
      serviceCode: awbPrefix === 'VIP' ? 'EXP' : (awbPrefix === 'BCC' ? 'CARGO' : 'RUSH'),
      status: 'Order Placed',
      origin: {
        city: defaultOriginCity,
        hub: defaultOriginHub,
        country: 'Nepal'
      },
      destination: {
        city: destMeta.city,
        hub: destMeta.hub,
        province: destMeta.province,
        country: 'Nepal'
      },
      sender: {
        name: senderName.trim() || (senderType === 'walkin' ? 'Walk-in Customer' : 'Registered Merchant'),
        company: senderCompany.trim() || (senderType === 'walkin' ? 'Direct Counter' : 'Merchant Shipper'),
        phone: senderPhone.trim() || '+977 98000 00000',
      },
      recipient: {
        name: consigneeName.trim(),
        company: 'Personal / Direct Consignee',
        address: deliveryAddress.trim(),
        city: destinationCity,
        phone: consigneePhone.trim(),
      },
      cargo: {
        pieces: parseInt(pieces, 10) || 1,
        weightKg: parseFloat(weightKg) || 1.0,
        description: cargoDescription.trim() || 'General Courier Consignment',
        declaredValueNpr: paymentMode === 'cod' ? (parseFloat(codAmount) || 0) : (parseFloat(chargesNpr) * 5)
      },
      codAmount: paymentMode === 'cod' ? (parseFloat(codAmount) || 0) : 0,
      remarks: `Reception Counter Intake [Payment: ${paymentMode.toUpperCase()} | NPR ${chargesNpr}]`,
      telemetry: {
        waybillNumber: awbId,
        assignedVehicle: 'Counter Reception Dispatch',
        trackingRoute: `${defaultOriginCity} Counter to ${destinationCity}`,
        estimatedArrival: 'Next Business Day'
      }
    };

    try {
      const created = createShipment(newShipmentData);

      // Async sync to edge worker
      fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newShipmentData,
          awb: awbId,
          referenceNo: awbId,
          consigneeName: consigneeName.trim(),
          consigneePhone: consigneePhone.trim(),
          consigneeAddress: deliveryAddress.trim(),
          destinationCity: destinationCity,
          weightKg: parseFloat(weightKg) || 1.0,
          codAmount: paymentMode === 'cod' ? (parseFloat(codAmount) || 0) : 0,
        })
      }).catch(() => {});

      onCreated(created, shouldPrint);
      onClose();
    } catch (err: any) {
      alert(`Intake failed: ${err?.message || String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 12, 10, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#0a1612',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.15)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#10b981',
              color: '#042f1f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900
            }}>
              +
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Reception Counter Intake
                </h2>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  fontWeight: 800
                }}>
                  ORIGIN: {defaultOriginCity.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.15rem' }}>
                Instant parcel weigh-in, automatic AWB generation, and waybill slip issuance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. AWB Generation Series Banner */}
          <div style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AWB Series Tag
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                {customAwbNumber.trim() ? customAwbNumber.trim().toUpperCase() : `${awbPrefix}01XXXX (Auto-Seq)`}
              </div>
            </div>

            {/* AWB Prefix Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prefix:</span>
              {(['VIP', 'BCC', 'FIC'] as const).map(prefix => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => { setAwbPrefix(prefix); setCustomAwbNumber(''); }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    backgroundColor: awbPrefix === prefix && !customAwbNumber ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                    color: awbPrefix === prefix && !customAwbNumber ? '#042f1f' : 'var(--text-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {prefix}
                </button>
              ))}
              <input
                type="text"
                placeholder="Or custom AWB..."
                value={customAwbNumber}
                onChange={e => setCustomAwbNumber(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  width: '130px'
                }}
              />
            </div>
          </div>

          {/* 2. Sender & Receiver Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Sender Box */}
            <div style={{
              padding: '1.2rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={15} color="#10b981" /> 1. SENDER DETAILS
                </span>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => setSenderType('walkin')}
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: senderType === 'walkin' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: senderType === 'walkin' ? '#34d399' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Walk-in
                  </button>
                  <button
                    type="button"
                    onClick={() => setSenderType('merchant')}
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: senderType === 'merchant' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: senderType === 'merchant' ? '#34d399' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Merchant
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Sender Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Karki / Kathmandu Store"
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Sender Phone
                    </label>
                    <input
                      type="text"
                      placeholder="98XXXXXXXX"
                      value={senderPhone}
                      onChange={e => setSenderPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Business / Store
                    </label>
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={senderCompany}
                      onChange={e => setSenderCompany(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Consignee Box */}
            <div style={{
              padding: '1.2rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                <MapPin size={15} color="#10b981" /> 2. RECIPIENT &amp; DESTINATION
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Consignee Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Recipient Full Name"
                      value={consigneeName}
                      onChange={e => setConsigneeName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#ffffff'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Receiver Phone *
                    </label>
                    <input
                      type="text"
                      placeholder="98XXXXXXXX"
                      value={consigneePhone}
                      onChange={e => setConsigneePhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#ffffff'
                      }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Destination City / Hub *
                    </label>
                    <select
                      value={destinationCity}
                      onChange={e => setDestinationCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        backgroundColor: '#0c1a15',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        fontWeight: 700
                      }}
                    >
                      {NEPAL_DESTINATIONS.map(d => (
                        <option key={d.city} value={d.city}>
                          {d.city} ({d.hub})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Detailed Street Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ward 4, Chipledhunga"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff'
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Cargo, Weight, & Payment Controls */}
          <div style={{
            padding: '1.2rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
              <Scale size={15} color="#10b981" /> 3. CARGO SPECIFICATIONS &amp; COUNTER CHARGES
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Weight (KG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightKg}
                  onChange={e => {
                    setWeightKg(e.target.value);
                    const w = parseFloat(e.target.value) || 1;
                    setChargesNpr(String(Math.round(200 + w * 50)));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontWeight: 700
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Pieces / Packages
                </label>
                <input
                  type="number"
                  min="1"
                  value={pieces}
                  onChange={e => setPieces(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Payment Method
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    backgroundColor: '#0c1a15',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontWeight: 700
                  }}
                >
                  <option value="cash_counter">Counter Cash Paid</option>
                  <option value="fonepay_qr">Fonepay QR Collected</option>
                  <option value="cod">Cash on Delivery (COD)</option>
                </select>
              </div>

              {paymentMode === 'cod' ? (
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginBottom: '0.25rem', fontWeight: 800 }}>
                    COD Amount to Collect (NPR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={codAmount}
                    onChange={e => setCodAmount(e.target.value)}
                    placeholder="Rs. Amount"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid #f59e0b',
                      color: '#fbbf24',
                      fontWeight: 800
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>
                    Intake Courier Fee (NPR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={chargesNpr}
                    onChange={e => setChargesNpr(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid #10b981',
                      color: '#34d399',
                      fontWeight: 800
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1.2rem 1.5rem',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Intake Channel: <strong style={{ color: '#10b981' }}>Double 7 Reception Counter</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm"
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <CheckCircle2 size={14} />
              <span>{submitting ? 'Registering...' : 'Save & Close'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#10b981',
                borderColor: '#10b981',
                color: '#042f1f',
                fontWeight: 800
              }}
            >
              <Printer size={15} />
              <span>Book &amp; Print Waybill Label</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
