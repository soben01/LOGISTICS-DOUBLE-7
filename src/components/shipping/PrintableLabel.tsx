'use client';

import React from 'react';
import { Shipment, updateShipmentStatus } from '../../lib/store';
import { Printer, CheckCircle2, ShieldCheck, MapPin, Phone, Package, Truck, QrCode, Layers } from 'lucide-react';

interface PrintableLabelProps {
  shipment?: Shipment;
  shipments?: Shipment[];
  onClose?: () => void;
  onPrinted?: (ids: string[]) => void;
  isModal?: boolean;
}

export default function PrintableLabel({
  shipment,
  shipments,
  onClose,
  onPrinted,
  isModal = Boolean(onClose)
}: PrintableLabelProps) {
  const items: Shipment[] = shipments && shipments.length > 0
    ? shipments
    : (shipment ? [shipment] : []);

  const handlePrint = () => {
    if (typeof window !== 'undefined' && items.length > 0) {
      const ids = items.map(s => s.id);
      ids.forEach(id => {
        updateShipmentStatus(id, 'Label Generated', undefined, 'Shipping label generated and ready for hub dispatch');
      });
      if (onPrinted) {
        onPrinted(ids);
      }
      window.print();
    }
  };

  React.useEffect(() => {
    if (items.length === 0) return;
    const handleAfterPrint = () => {
      const ids = items.map(s => s.id);
      ids.forEach(id => {
        updateShipmentStatus(id, 'Label Generated', undefined, 'Shipping label generated and ready for hub dispatch');
      });
      if (onPrinted) {
        onPrinted(ids);
      }
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [items, onPrinted]);

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

  if (items.length === 0) return null;

  const isBulk = items.length > 1;

  const labelContent = (
    <div style={{
      width: '100%',
      maxWidth: '760px',
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
          {isBulk ? (
            <>
              <Layers size={18} color="var(--brand-orange)" />
              <span>Bulk AWB Print Preview &bull; {items.length} Shipping Labels</span>
            </>
          ) : (
            <>
              <Printer size={18} color="var(--brand-orange)" />
              <span>Airway Bill (AWB) Label Preview &bull; {items[0].id}</span>
            </>
          )}
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
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 1.15rem', fontWeight: 800 }}
          >
            <Printer size={15} />
            <span>{isBulk ? `Print All (${items.length}) Labels Now` : 'Print Label Now'}</span>
          </button>
        </div>
      </div>

      {/* Scrollable label preview container */}
      <div style={{
        maxHeight: isModal ? 'calc(90vh - 85px)' : undefined,
        overflowY: isModal ? 'auto' : undefined,
        paddingRight: isModal ? '4px' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {/* ================= PRINTABLE SHIPPING LABEL CONTAINER ================= */}
        {/* This container has id="printable-shipping-label" and wraps all printable pages */}
        <div id="printable-shipping-label" style={{ width: '100%' }}>
          {items.map((s, idx) => {
            const originCode = (s.origin.city || 'KTM').substring(0, 3).toUpperCase();
            const destCode = (s.destination.city || 'NP').substring(0, 3).toUpperCase();
            const isCod = Boolean(s.codAmount && Number(s.codAmount) > 0);
            const codAmount = Number(s.codAmount || 0);

            return (
              <div key={s.id} style={{ marginBottom: isBulk ? '1.5rem' : 0 }}>
                {/* On-screen bulk label index header */}
                {isBulk && (
                  <div className="no-print" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '4px 4px 0 0',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#e2e8f0',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderBottom: 'none'
                  }}>
                    <span>Label {idx + 1} of {items.length} &bull; AWB: <strong style={{ color: 'var(--brand-orange)' }}>{s.id}</strong></span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.origin.city} &rarr; {s.destination.city} ({s.cargo.weightKg} KG)</span>
                  </div>
                )}

                {/* Individual Printable Label Sheet */}
                <div
                  className="printable-label-page"
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    padding: '18px',
                    borderRadius: isBulk ? '0 0 4px 4px' : '4px',
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
                        {s.service}
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
                      * {s.id} *
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#444444', fontWeight: 600, marginTop: '2px' }}>
                      WAYBILL: {s.telemetry.waybillNumber || s.telemetry.airwayBill || s.id} &bull; DISPATCH NODE: NP-7-HUB
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
                      {s.recipient.name}
                    </div>
                    {s.recipient.company && (
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#222222' }}>
                        {s.recipient.company}
                      </div>
                    )}
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#000000', margin: '4px 0' }}>
                      {s.recipient.address}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000000' }}>
                      {s.destination.city}, Nepal {s.destination.areaCode ? `(${s.destination.areaCode})` : ''}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#000000', marginTop: '4px' }}>
                      TEL: {s.recipient.phone}
                    </div>
                  </div>

                  {/* Routing & Sortation Node Bar (Shipper details completely removed as requested) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 0.8fr',
                    gap: '12px',
                    borderBottom: '2px solid #000000',
                    paddingBottom: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ border: '1px solid #000000', padding: '8px', background: '#f9fafb' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#555555', textTransform: 'uppercase' }}>
                        DISPATCH NODE &amp; ORIGIN CORRIDOR:
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#000000', marginTop: '2px' }}>
                        {s.origin.hub}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333333' }}>
                        Origin City: {s.origin.city}, Nepal
                      </div>
                    </div>

                    <div style={{ border: '1px solid #000000', padding: '8px', textAlign: 'center', background: '#f3f4f6' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#555555' }}>SORT ROUTING:</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#000000', fontFamily: 'monospace' }}>
                        {originCode}-{destCode}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#111111' }}>
                        GATEWAY: {s.destination.hub}
                      </div>
                    </div>
                  </div>

                  {/* Cargo Specs & Payment Details (Declared Value removed; dynamic Payment/COD) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1.3fr',
                    gap: '10px',
                    borderBottom: '2px solid #000000',
                    paddingBottom: '12px',
                    marginBottom: '12px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ border: '1px solid #000000', padding: '8px' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#666666' }}>COLLI / PKGS</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#000000', marginTop: '2px' }}>{s.cargo.pieces} PKG</div>
                    </div>

                    <div style={{ border: '1px solid #000000', padding: '8px' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#666666' }}>GROSS WEIGHT</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#000000', marginTop: '2px' }}>{s.cargo.weightKg} KG</div>
                    </div>

                    {isCod ? (
                      <div style={{ border: '2px solid #000000', padding: '6px 10px', background: '#f3f4f6', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#000000', letterSpacing: '0.05em' }}>
                          COD
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#000000', fontFamily: 'monospace', marginTop: '2px' }}>
                          Rs. {codAmount.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div style={{ border: '2px solid #000000', padding: '6px 10px', background: '#f3f4f6', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#000000', letterSpacing: '0.05em' }}>
                          PAYMENT
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#000000', letterSpacing: '0.08em', marginTop: '2px' }}>
                          PAID
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Commodity Description */}
                  <div style={{ fontSize: '0.8rem', borderBottom: '1px solid #000', paddingBottom: '8px', marginBottom: '10px' }}>
                    <strong>Commodity Description:</strong> {s.cargo.description}
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
              </div>
            );
          })}
        </div>
        {/* End printable shipping label container */}
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
