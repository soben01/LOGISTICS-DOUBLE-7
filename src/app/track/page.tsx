'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plane,
  Ship,
  Truck,
  Boxes,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
  Bell,
  ArrowRight,
  FileText,
  Thermometer,
  Gauge,
  UserCheck,
  ChevronRight,
  RefreshCw,
  Printer,
  Mail,
  Radio,
  Navigation,
  Compass,
  Zap,
  Check,
  Copy,
  ExternalLink
} from 'lucide-react';
import { getShipmentById, getShipments, fetchD1Tracking, Shipment, Checkpoint } from '../../lib/store';
import PrintableLabel from '../../components/shipping/PrintableLabel';
import EmailSummaryModal from '../../components/notifications/EmailSummaryModal';

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryId = searchParams.get('id') || '';

  const [searchInput, setSearchInput] = useState(queryId);
  const [currentShipment, setCurrentShipment] = useState<Shipment | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPrintLabel, setShowPrintLabel] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (queryId) {
      setSearchInput(queryId);
      const local = getShipmentById(queryId);
      if (local) {
        setCurrentShipment(local);
        setNotFound(false);
      } else {
        // Query Cloudflare D1 tracking_db in real-time
        fetchD1Tracking(queryId).then((d1Record) => {
          if (!isMounted) return;
          if (d1Record) {
            const adapted: Shipment = {
              id: d1Record.tracking_number,
              service: d1Record.carrier ? `Carrier: ${d1Record.carrier}` : 'Double 7 Express (Cloudflare D1)',
              serviceCode: 'EXP',
              status: (d1Record.status === 'Delivered' ? 'Delivered' : 'In Transit') as any,
              origin: {
                city: 'Central Dispatch Hub',
                hub: 'National Logistics Hub',
              },
              destination: {
                city: d1Record.consignee_name ? d1Record.consignee_name.split(' ').slice(-1)[0] : 'Destination Terminal',
                hub: 'Local Destination Delivery Center',
              },
              sender: {
                name: 'Double 7 Logistics Command',
                company: 'Double 7 Dispatch Terminal',
                phone: '+977 1 4411000',
              },
              recipient: {
                name: d1Record.consignee_name || 'Consignee Recipient',
                company: d1Record.consignee_name || 'Consignee Recipient',
                address: d1Record.consignee_name || 'Delivery Address on File',
                phone: d1Record.consignee_contact || 'Registered on File',
              },
              cargo: {
                pieces: 1,
                weightKg: 2.0,
                volumeCbm: 0.015,
                description: d1Record.latest_event || 'Verified Consignment Cargo',
              },
              telemetry: {
                waybillNumber: d1Record.tracking_number,
                estimatedArrival: d1Record.status === 'Delivered' ? 'Delivered' : 'In Transit via Corridor',
              },
              checkpoints: [
                {
                  id: `chk-d1-${d1Record.id}`,
                  timestamp: d1Record.created_at || 'Recorded in Cloudflare D1',
                  status: (d1Record.status === 'Delivered' ? 'Delivered' : 'In Transit') as any,
                  location: 'Cloudflare D1 Network Telemetry Gateway',
                  description: d1Record.latest_event || `Current Status: ${d1Record.status}`,
                  isCompleted: true,
                },
              ],
            };
            setCurrentShipment(adapted);
            setNotFound(false);
          } else {
            setCurrentShipment(null);
            setNotFound(true);
          }
        });
      }
    } else {
      const all = getShipments();
      if (all.length > 0) {
        setCurrentShipment(all[0]);
        setSearchInput(all[0].id);
      } else {
        setCurrentShipment(null);
        setNotFound(false);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [queryId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/track?id=${encodeURIComponent(searchInput.trim())}`);
  };

  const copyTrackingLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      if (currentShipment) {
        const found = getShipmentById(currentShipment.id);
        if (found) setCurrentShipment({ ...found });
      }
      setIsRefreshing(false);
    }, 500);
  };

  const getStatusBadgeClass = (status: Shipment['status']) => {
    switch (status) {
      case 'Delivered':
        return 'badge-emerald';
      case 'Out for Delivery':
        return 'badge-amber';
      case 'In Transit':
        return 'badge-orange';
      case 'Customs Cleared':
        return 'badge-cyan';
      default:
        return 'badge-subtle';
    }
  };

  const getServiceIcon = (code: Shipment['serviceCode']) => {
    switch (code) {
      case 'INTL':
      case 'AIR':
        return <Plane size={22} color="var(--brand-amber)" />;
      case 'SEA':
        return <Ship size={22} color="var(--brand-cyan)" />;
      case 'EXP':
      case 'RUSH':
        return <Truck size={22} color="var(--brand-orange)" />;
      default:
        return <Boxes size={22} color="var(--brand-cyan)" />;
    }
  };

  // Determine active step index (0 to 4)
  const getStepIndex = (status: Shipment['status']) => {
    switch (status) {
      case 'Pending Pickup':
        return 1;
      case 'In Transit':
      case 'Customs Cleared':
        return 2;
      case 'Out for Delivery':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 2;
    }
  };

  const currentStep = currentShipment ? getStepIndex(currentShipment.status) : 2;

  return (
    <div style={{ padding: '3.5rem 0 6rem 0', position: 'relative' }}>
      {/* Background Glow */}
      <div className="hero-ambient-glow" style={{ top: '-120px', opacity: 0.75 }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div className="badge badge-orange" style={{ marginBottom: '0.75rem', padding: '0.35rem 0.9rem' }}>
            <span className="pulse-dot pulse-dot-orange" style={{ marginRight: '4px' }}></span>
            <span>LIVE SATELLITE DISPATCH TELEMETRY &bull; ALL 77 DISTRICTS</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.3rem, 4vw, 3.4rem)', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
            Consignment Telemetry Center
          </h1>

          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Real-time GPS vehicle tracking, multi-modal waypoint telemetry, electronic chain of custody, and digital Proof of Delivery across Nepal and cross-border corridors.
          </p>
        </div>

        {/* Search Bar & Fast Demo Switcher */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem', maxWidth: '880px', margin: '0 auto 3rem auto', border: '1px solid rgba(255, 102, 0, 0.25)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <Search
                size={18}
                color="var(--brand-orange)"
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Enter Consignment or AWB # (e.g. CP002994035NP or D7-XXXXXXXX)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '3rem', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.8rem' }}>
              <span>Track Telemetry</span>
              <ArrowRight size={16} />
            </button>
          </form>

        </div>

        {/* Consignment Not Found Alert */}
        {notFound && (
          <div className="card" style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'center', padding: '3.5rem 2rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--brand-red)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <AlertCircle size={30} />
            </div>
            <h3 style={{ fontSize: '1.4rem' }}>Consignment Not Found</h3>
            <p style={{ marginTop: '0.5rem', marginBottom: '1.75rem', color: 'var(--text-secondary)' }}>
              No active shipment matches tracking ID <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{searchInput}</strong> in our dispatch database. Verify the Airway Bill number or dispatch a new consignment.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/book" className="btn btn-primary btn-sm">
                Book New Consignment &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Active Telemetry Cockpit */}
        {currentShipment && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '2rem' }} className="track-layout">
            {/* Left Column: Mission Overview, Progress Stepper & Milestone Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Main Mission Status Card */}
              <div className="card glow-card-orange" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <span className={`badge ${getStatusBadgeClass(currentShipment.status)}`}>
                        {currentShipment.status}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Tier: <strong style={{ color: '#ffffff' }}>{currentShipment.service}</strong>
                      </span>
                    </div>

                    <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '2.1rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
                      {currentShipment.id}
                    </h2>
                  </div>

                  {/* Actions Header Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowPrintLabel(true)}
                      className="btn btn-primary btn-sm"
                      title="Print Official Thermal/A4 Shipping Label"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Printer size={14} />
                      <span>Print Waybill</span>
                    </button>

                    <button
                      type="button"
                      onClick={copyTrackingLink}
                      className="btn btn-secondary btn-sm"
                      title="Share live tracking link"
                    >
                      {copiedLink ? <Check size={14} color="var(--brand-emerald)" /> : <Share2 size={14} />}
                      <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowEmailModal(true)}
                      className="btn btn-outline btn-sm"
                      title="Subscribe to 24-Hour Gmail Logistics Summaries"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Mail size={14} color="var(--brand-orange)" />
                      <span>24h Alerts</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="btn btn-outline btn-sm"
                      title="Refresh satellite telemetry"
                      style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Animated Route Step Progression Bar */}
                <div style={{
                  background: 'rgba(9, 13, 24, 0.7)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.5rem',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.75rem'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>DISPATCH PROGRESSION STATUS</span>
                    <span style={{ color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)' }}>STAGE {currentStep} OF 4</span>
                  </div>

                  <div className="route-progress-bar">
                    {/* Step 1 */}
                    <div className={`route-step ${currentStep >= 1 ? (currentStep === 1 ? 'active' : 'completed') : ''}`}>
                      <div className="route-step-node">
                        {currentStep > 1 ? <Check size={14} /> : 1}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: currentStep >= 1 ? '#ffffff' : 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>
                        Booked
                      </span>
                      <div className="route-step-line" />
                    </div>

                    {/* Step 2 */}
                    <div className={`route-step ${currentStep >= 2 ? (currentStep === 2 ? 'active' : 'completed') : ''}`}>
                      <div className="route-step-node">
                        {currentStep > 2 ? <Check size={14} /> : 2}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: currentStep >= 2 ? '#ffffff' : 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>
                        Cross-Docked
                      </span>
                      <div className="route-step-line" />
                    </div>

                    {/* Step 3 */}
                    <div className={`route-step ${currentStep >= 3 ? (currentStep === 3 ? 'active' : 'completed') : ''}`}>
                      <div className="route-step-node">
                        {currentStep > 3 ? <Check size={14} /> : 3}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: currentStep >= 3 ? '#ffffff' : 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>
                        In Linehaul
                      </span>
                      <div className="route-step-line" />
                    </div>

                    {/* Step 4 */}
                    <div className={`route-step ${currentStep >= 4 ? 'completed' : ''}`}>
                      <div className="route-step-node">
                        {currentStep >= 4 ? <Check size={14} /> : 4}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: currentStep >= 4 ? 'var(--brand-emerald)' : 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>
                        Delivered
                      </span>
                    </div>
                  </div>
                </div>

                {/* Origin -> Destination Visual Banner */}
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ minWidth: '160px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ORIGIN HUB</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                      {currentShipment.origin.city}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--brand-orange)', marginTop: '0.1rem' }}>
                      {currentShipment.origin.hub}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(255, 102, 0, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 102, 0, 0.35)',
                      boxShadow: '0 0 15px rgba(255, 102, 0, 0.2)'
                    }}>
                      {getServiceIcon(currentShipment.serviceCode)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      HIGHWAY LINEHAUL
                    </span>
                  </div>

                  <div style={{ minWidth: '160px', textAlign: 'right' }} className="route-dest-cell">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DESTINATION GATEWAY</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                      {currentShipment.destination.city}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--brand-cyan)', marginTop: '0.1rem' }}>
                      {currentShipment.destination.hub}
                    </div>
                  </div>
                </div>

                {/* Estimated Delivery Strip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.92rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={16} color="var(--brand-amber)" /> Guaranteed Arrival SLA:
                  </span>
                  <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {currentShipment.telemetry.estimatedArrival}
                  </strong>
                </div>
              </div>

              {/* Waypoints & Checkpoint Telemetry Timeline */}
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} color="var(--brand-orange)" />
                    <span>Waypoint Telemetry &amp; Chain of Custody</span>
                  </h3>
                  <span className="badge badge-subtle" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                    {currentShipment.checkpoints.length} RECORDED WAYPOINTS
                  </span>
                </div>

                <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                  {/* Vertical line connecting milestones */}
                  <div style={{
                    position: 'absolute',
                    left: '10px',
                    top: '12px',
                    bottom: '12px',
                    width: '2px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)'
                  }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {currentShipment.checkpoints.map((cp, idx) => (
                      <div key={cp.id} style={{ position: 'relative' }}>
                        {/* Dot indicator */}
                        <div style={{
                          position: 'absolute',
                          left: '-2rem',
                          top: '3px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: idx === 0 ? 'var(--brand-orange)' : 'var(--bg-card)',
                          border: idx === 0 ? '3px solid rgba(255, 102, 0, 0.4)' : '2px solid var(--border-medium)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: idx === 0 ? '0 0 14px var(--brand-orange)' : undefined
                        }}>
                          {idx === 0 && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.02rem', fontWeight: 700, color: idx === 0 ? '#ffffff' : 'var(--text-secondary)' }}>
                              {cp.status} &mdash; <span style={{ color: idx === 0 ? 'var(--brand-orange)' : undefined }}>{cp.location}</span>
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {cp.timestamp}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: '1.5' }}>
                            {cp.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Digital Proof of Delivery (POD) (When status is Delivered) */}
              {currentShipment.proofOfDelivery && (
                <div className="card glow-card-emerald" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-emerald)' }}>
                      <UserCheck size={24} />
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--brand-emerald)' }}>Official Digital Proof of Delivery (POD)</h3>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>VERIFIED HANDOVER</span>
                  </div>

                  <p style={{ fontSize: '0.92rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    This consignment has been verified with customer photo/OTP confirmation and physically handed over to the authorized consignee.
                  </p>

                  <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1.25rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DELIVERY TIMESTAMP</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                        {currentShipment.proofOfDelivery.deliveredAt}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RECEIVED BY (CONSIGNEE)</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                        {currentShipment.proofOfDelivery.receivedBy}
                      </div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                        DIGITAL SIGNATURE ATTESTATION
                      </div>
                      <div style={{
                        padding: '1rem 1.25rem',
                        background: '#070b14',
                        borderRadius: '8px',
                        border: '1px dashed rgba(16, 185, 129, 0.4)',
                        fontFamily: 'cursive, serif',
                        fontSize: '1.35rem',
                        color: 'var(--brand-emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>{currentShipment.proofOfDelivery.signatureText}</span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>E-SIGNED</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Fleet Unit Telemetry & Cargo Specifications */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Transport Telemetry Hardware Card */}
              <div className="card glow-card-cyan" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Gauge size={18} color="var(--brand-cyan)" />
                    <span>Courier Fleet Telemetry</span>
                  </h3>
                  <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>GPS LOCKED</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Courier Unit:</span>
                    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      {currentShipment.telemetry.transportVehicle || currentShipment.telemetry.flightVesselNumber || 'BA-2-PA-8892'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Waybill (AWB):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-orange)', fontWeight: 700 }}>
                      {currentShipment.telemetry.waybillNumber || currentShipment.telemetry.airwayBill}
                    </span>
                  </div>

                  {currentShipment.telemetry.trackingRoute && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Route Highway:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                        {currentShipment.telemetry.trackingRoute}
                      </span>
                    </div>
                  )}

                  {currentShipment.telemetry.temperatureCelsius !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Thermometer size={15} color="var(--brand-cyan)" /> Sensor Reading:
                      </span>
                      <strong style={{ color: 'var(--brand-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {currentShipment.telemetry.temperatureCelsius}&deg;C (Optimal)
                      </strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.2rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>GPS Satellite Lock:</span>
                    <span style={{ color: 'var(--brand-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                      <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }}></span>
                      Active &bull; 9 Satellites
                    </span>
                  </div>
                </div>
              </div>

              {/* Cargo Specifications Card */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Boxes size={18} color="var(--brand-amber)" />
                  <span>Cargo Manifest &amp; Spec</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      COMMODITY DESCRIPTION
                    </span>
                    <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.25rem' }}>
                      {currentShipment.cargo.description}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="metric-pill" style={{ padding: '0.85rem' }}>
                      <span className="metric-number" style={{ fontSize: '1.35rem', color: '#ffffff' }}>
                        {currentShipment.cargo.weightKg} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>KG</span>
                      </span>
                      <span className="metric-label" style={{ fontSize: '0.68rem' }}>Gross Weight</span>
                    </div>

                    <div className="metric-pill" style={{ padding: '0.85rem' }}>
                      <span className="metric-number" style={{ fontSize: '1.35rem', color: '#ffffff' }}>
                        {currentShipment.cargo.pieces} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>PCS</span>
                      </span>
                      <span className="metric-label" style={{ fontSize: '0.68rem' }}>Colli Count</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Declared Consignment Value:</span>
                    <strong style={{ color: 'var(--brand-emerald)', fontFamily: 'var(--font-mono)' }}>
                      {currentShipment.cargo.declaredValueNpr ? `Rs. ${currentShipment.cargo.declaredValueNpr.toLocaleString()} NPR` : `$${(currentShipment.cargo.declaredValueUsd || 0).toLocaleString()} USD`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Admin & Operations Control Tower Shortcut */}
              <div className="card" style={{ padding: '1.5rem', background: 'rgba(255, 102, 0, 0.04)', border: '1px solid rgba(255, 102, 0, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-orange)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <Zap size={14} />
                  <span>OPERATIONS TOWER</span>
                </div>
                <p style={{ fontSize: '0.82rem', marginBottom: '1rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Need to update delivery checkpoints, assign an electric van, or record cash collection? Dispatch agents can access the central control room.
                </p>
                <Link href="/operations" className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                  Open Dispatch Controls &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Printable Label Modal (High-Contrast Thermal/A4) */}
        {showPrintLabel && currentShipment && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1.5rem',
              overflowY: 'auto'
            }}
          >
            <div style={{ maxWidth: '750px', width: '100%', margin: 'auto' }}>
              <PrintableLabel
                shipment={currentShipment}
                onClose={() => setShowPrintLabel(false)}
              />
            </div>
          </div>
        )}

        {/* 24-Hour Gmail Notification Modal */}
        {showEmailModal && (
          <EmailSummaryModal
            initialEmail=""
            role="consignee"
            associatedTrackingId={currentShipment?.id}
            onClose={() => setShowEmailModal(false)}
          />
        )}
      </div>

      <style jsx>{`
        @media (max-width: 950px) {
          .track-layout {
            grid-template-columns: 1fr !important;
          }
          .route-dest-cell {
            text-align: left !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading satellite telemetry...
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
