'use client';

import React from 'react';
import { Shipment } from '../../lib/store';
import { Printer, CheckCircle2, ShieldCheck, MapPin, Phone, Package, Truck, QrCode } from 'lucide-react';

interface PrintableLabelProps {
  shipment: Shipment;
  onClose?: () => void;
  isModal?: boolean;
}

export default function PrintableLabel({ shipment, onClose, isModal = Boolean(onClose) }: PrintableLabelProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  React.useEffect(() => {
    if (!isModal || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModal, onClose]);

  const originCode = (shipment.origin.city || 'KTM').substring(0, 3).toUpperCase();
  const destCode = (shipment.destination.city || 'NP').substring(0, 3).toUpperCase();

  const labelContent = (
    <div style={{
      width: '100%',
      maxWidth: '740px',
      margin: isModal ? 'auto' : '0 auto',
      position: 'relative'
    }}>
      {/* On-screen control buttons (Hidden during actual print) */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(16, 25, 46, 0.96)',
        border: '1px solid rgba(255, 102, 0, 0.4)',
        borderRadius: '12px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#ffffff', fontSize: '0.92rem', fontWeight: 700 }}>
          <Printer size={18} color="var(--brand-orange)" />
          <span>Airway Bill (AWB) Label Preview &bull; {shipment.id}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
            >
              Close Preview
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 1.1rem', fontWeight: 800 }}
          >
            <Printer size={15} />
            <span>Print Label Now</span>
          </button>
        </div>
      </div>

      {/* Scrollable label preview container */}
      <div style={{
        maxHeight: isModal ? 'calc(90vh - 85px)' : undefined,
        overflowY: isModal ? 'auto' : undefined,
        borderRadius: '6px',
        boxShadow: isModal ? '0 16px 48px rgba(0, 0, 0, 0.8)' : undefined
      }}>
        {/* ================= PRINTABLE SHIPPING LABEL ================= */}
        {/* This element has id="printable-shipping-label" and is the ONLY thing printed by @media print */}
        <div
          id="printable-shipping-label"
          style={{
            background: '#ffffff',
            color: '#000000',
            padding: '18px',
            borderRadius: '4px',
            border: '3px solid #000000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            lineHeight: '1.3',
            maxWidth: '720px',
            margin: '0 auto',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
          }}
        >
        {/* Top Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #000000',
          paddingBottom: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#000000' }}>
              DOUBLE 7 LOGISTICS &bull; NEPAL
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#333333', textTransform: 'uppercase' }}>
              DOMESTIC COURIER AIRWAY BILL &bull; 77 DISTRICTS NETWORK
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              background: '#000000',
              color: '#ffffff',
              padding: '4px 12px',
              fontWeight: 900,
              fontSize: '1.2rem',
              borderRadius: '3px',
              fontFamily: 'monospace'
            }}>
              {originCode} &rarr; {destCode}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '3px', color: '#111' }}>
              {shipment.service}
            </div>
          </div>
        </div>

        {/* Barcode & Tracking Row */}
        <div style={{
          borderBottom: '2px solid #000000',
          paddingBottom: '14px',
          marginBottom: '12px',
          textAlign: 'center',
          background: '#f9fafb',
          padding: '12px',
          border: '1px solid #000000'
        }}>
          {/* Simulated High-Contrast Courier Barcode */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            height: '48px',
            gap: '2px',
            margin: '0 auto 6px auto',
            maxWidth: '380px'
          }}>
            {[3,1,2,4,1,3,2,1,4,2,3,1,1,4,2,3,1,2,4,1,3,2,1,4,2,1,3,4,1,2,3,1,4,2,1,3,2,4,1,3].map((w, i) => (
              <div
                key={i}
                style={{
                  background: i % 2 === 0 ? '#000000' : 'transparent',
                  width: `${w * 2.2}px`,
                  height: '100%'
                }}
              />
            ))}
          </div>

          <div style={{
            fontFamily: 'monospace',
            fontSize: '1.35rem',
            fontWeight: 900,
            letterSpacing: '3px',
            color: '#000000'
          }}>
            * {shipment.id} *
          </div>

          <div style={{ fontSize: '0.72rem', color: '#444444', fontWeight: 600, marginTop: '2px' }}>
            WAYBILL: {shipment.telemetry.waybillNumber || shipment.telemetry.airwayBill || shipment.id} &bull; DISPATCH NODE: NP-7-HUB
          </div>
        </div>

        {/* Consignee (DELIVER TO) - Huge Prominent Box */}
        <div style={{
          border: '2px solid #000000',
          padding: '12px',
          marginBottom: '12px',
          background: '#ffffff'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555555', letterSpacing: '0.05em' }}>
            SHIP TO (CONSIGNEE / RECIPIENT):
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#000000', margin: '4px 0 2px 0' }}>
            {shipment.recipient.name}
          </div>
          {shipment.recipient.company && (
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#222222' }}>
              {shipment.recipient.company}
            </div>
          )}
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#000000', margin: '4px 0' }}>
            {shipment.recipient.address}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000000' }}>
            {shipment.destination.city}, Nepal {shipment.destination.areaCode ? `(${shipment.destination.areaCode})` : ''}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#000000', marginTop: '4px' }}>
            TEL: {shipment.recipient.phone}
          </div>
        </div>

        {/* Shipper & Origin Box */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 0.7fr',
          gap: '12px',
          borderBottom: '2px solid #000000',
          paddingBottom: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ border: '1px solid #000000', padding: '8px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#555' }}>
              FROM (SHIPPER / MERCHANT):
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#000' }}>
              {shipment.sender.name}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#222' }}>
              {shipment.sender.company}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#333' }}>
              Hub: {shipment.origin.hub}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#000' }}>
              Phone: {shipment.sender.phone}
            </div>
          </div>

          <div style={{ border: '1px solid #000000', padding: '8px', textAlign: 'center', background: '#f3f4f6' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#555' }}>SORT ROUTING:</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#000', fontFamily: 'monospace' }}>
              {originCode}-{destCode}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#111' }}>
              GATEWAY: {shipment.destination.hub}
            </div>
          </div>
        </div>

        {/* Cargo Specs & Payment Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          borderBottom: '2px solid #000000',
          paddingBottom: '12px',
          marginBottom: '12px',
          fontSize: '0.82rem'
        }}>
          <div style={{ border: '1px solid #000', padding: '6px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#666' }}>COLLI / PKGS</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#000' }}>{shipment.cargo.pieces} PKG</div>
          </div>

          <div style={{ border: '1px solid #000', padding: '6px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#666' }}>GROSS WEIGHT</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#000' }}>{shipment.cargo.weightKg} KG</div>
          </div>

          <div style={{ border: '1px solid #000', padding: '6px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#666' }}>DECLARED VAL</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#000' }}>Rs. {(shipment.cargo.declaredValueNpr || 0).toLocaleString()}</div>
          </div>

          <div style={{ border: '2px solid #000', padding: '6px', background: '#e5e7eb' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#000' }}>PAYMENT / COD</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#000' }}>VERIFIED</div>
          </div>
        </div>

        {/* Commodity Description */}
        <div style={{ fontSize: '0.8rem', borderBottom: '1px solid #000', paddingBottom: '8px', marginBottom: '10px' }}>
          <strong>Commodity Description:</strong> {shipment.cargo.description}
        </div>

        {/* Security / Signature Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: '0.75rem',
          paddingTop: '6px'
        }}>
          <div>
            <div style={{ fontWeight: 800, color: '#000' }}>
              ✓ DOUBLE 7 LOGISTICS OFFICIAL DOMESTIC DISPATCH
            </div>
            <div style={{ color: '#555', fontSize: '0.7rem' }}>
              Electronic Waybill pre-authorized. Direct signature required upon delivery.
            </div>
          </div>

          <div style={{ textAlign: 'right', borderTop: '1px solid #000', width: '220px', paddingTop: '4px' }}>
            <div style={{ fontSize: '0.7rem', color: '#555' }}>Recipient Signature &amp; Date:</div>
            <div style={{ height: '24px' }}></div>
          </div>
        </div>
      </div>
      {/* End scroll container */}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="print-modal-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          overflowY: 'auto'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        {labelContent}
      </div>
    );
  }

  return labelContent;
}
