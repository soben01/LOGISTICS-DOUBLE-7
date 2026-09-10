'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Search,
  Plus,
  Printer,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  ShieldCheck,
  Building,
  User as UserIcon,
  Phone,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Lock,
  Download,
  Trash2,
  Eye,
  Check,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { User, getCurrentUser } from '../../lib/auth';
import { getShipments, updateShipmentStatus, Shipment } from '../../lib/store';
import {
  BranchManifest,
  ManifestItem,
  getBranchManifests,
  saveBranchManifest,
  createBranchManifest,
  markManifestPrinted,
  approveAndDispatchManifest,
  lookupShipmentForManifest
} from '../../lib/manifest';

interface Props {
  user?: User | null;
}

export default function BranchManifestManager({ user }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);
  const [manifests, setManifests] = useState<BranchManifest[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'dispatched_manifests' | 'dispatched_shipments'>('create');
  
  // Staging state for new manifest creation
  const [inputBookingId, setInputBookingId] = useState('');
  const [stagedItems, setStagedItems] = useState<ManifestItem[]>([]);
  const [inputFeedback, setInputFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Linehaul vehicle & route details
  const [branchOrigin, setBranchOrigin] = useState('Kathmandu Mega-Hub (KTM-01)');
  const [branchCode, setBranchCode] = useState('KTM-01');
  const [destinationHub, setDestinationHub] = useState('Pokhara Regional Sort Hub (Gandaki)');
  const [destinationCity, setDestinationCity] = useState('Pokhara');
  const [linehaulVehicle, setLinehaulVehicle] = useState('BA 2 KHA 8841 (Express E-Van)');
  const [driverName, setDriverName] = useState('Bhimsen Thapa');
  const [driverPhone, setDriverPhone] = useState('+977 98510 11223');
  const [sealNumber, setSealNumber] = useState('SL-99412');
  const [manifestNotes, setManifestNotes] = useState('Scheduled evening trunk dispatch. Fragile and priority parcels segregated.');

  // Modal view for generated/selected manifest
  const [activeManifest, setActiveManifest] = useState<BranchManifest | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Quick-add drawer state
  const [showEligibleDrawer, setShowEligibleDrawer] = useState(false);
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);

  const reloadData = () => {
    const list = getBranchManifests(currentUser?.branchCode);
    setManifests(list);
    setAllShipments(getShipments());
  };

  useEffect(() => {
    const u = currentUser || getCurrentUser();
    if (u) {
      setCurrentUser(u);
      if (u.branchCode) {
        setBranchCode(u.branchCode);
        setBranchOrigin(u.company || `${u.name} Hub`);
      }
    }
    reloadData();

    const handleManifestUpdate = () => reloadData();
    window.addEventListener('manifest-updated', handleManifestUpdate);
    window.addEventListener('shipments-updated', handleManifestUpdate);
    return () => {
      window.removeEventListener('manifest-updated', handleManifestUpdate);
      window.removeEventListener('shipments-updated', handleManifestUpdate);
    };
  }, []);

  // Set default seal number randomly if empty
  useEffect(() => {
    if (!sealNumber) {
      setSealNumber(`SL-${Math.floor(10000 + Math.random() * 90000)}`);
    }
  }, []);

  const handleDestinationChange = (hubName: string) => {
    setDestinationHub(hubName);
    if (hubName.includes('Pokhara')) setDestinationCity('Pokhara');
    else if (hubName.includes('Biratnagar')) setDestinationCity('Biratnagar');
    else if (hubName.includes('Birgunj')) setDestinationCity('Birgunj');
    else if (hubName.includes('Nepalgunj')) setDestinationCity('Nepalgunj');
    else if (hubName.includes('Butwal')) setDestinationCity('Butwal');
    else if (hubName.includes('Chitwan')) setDestinationCity('Bharatpur');
    else if (hubName.includes('Dhangadhi')) setDestinationCity('Dhangadhi');
    else setDestinationCity('Kathmandu');
  };

  const handleAddBookingById = (idToAdd?: string) => {
    const targetId = (idToAdd || inputBookingId).trim().toUpperCase();
    if (!targetId) {
      setInputFeedback({ type: 'error', message: 'Please enter a booking or waybill number.' });
      return;
    }

    // Check if already staged
    if (stagedItems.some(i => i.bookingId.toUpperCase() === targetId)) {
      setInputFeedback({ type: 'error', message: `Booking ${targetId} is already added in current staging manifest.` });
      return;
    }

    const shipment = lookupShipmentForManifest(targetId);
    if (!shipment) {
      setInputFeedback({
        type: 'error',
        message: `Booking #${targetId} not found in consignment registry. Please verify the number.`
      });
      return;
    }

    const newItem: ManifestItem = {
      bookingId: shipment.id,
      consigneeName: shipment.recipient.name,
      consigneePhone: shipment.recipient.phone,
      destinationCity: shipment.destination.city,
      destinationHub: shipment.destination.hub,
      pieces: shipment.cargo.pieces,
      weightKg: shipment.cargo.weightKg,
      service: shipment.service,
      serviceCode: shipment.serviceCode,
      codAmount: shipment.codAmount || 0,
      status: shipment.status,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setStagedItems(prev => [newItem, ...prev]);
    setInputBookingId('');
    setInputFeedback({
      type: 'success',
      message: `✓ Added ${shipment.id} (${shipment.cargo.pieces} Pkgs, ${shipment.cargo.weightKg} KG, Dest: ${shipment.destination.city})`
    });
    setTimeout(() => setInputFeedback(null), 4000);
  };

  const handleRemoveStagedItem = (bookingId: string) => {
    setStagedItems(prev => prev.filter(i => i.bookingId !== bookingId));
  };

  const handleGenerateManifest = () => {
    if (stagedItems.length === 0) {
      alert('Please add at least one booking number before generating a manifest.');
      return;
    }

    const manifest = createBranchManifest({
      branchOrigin,
      branchCode,
      destinationHub,
      destinationCity,
      linehaulVehicle,
      driverName,
      driverPhone,
      sealNumber: sealNumber || `SL-${Math.floor(10000 + Math.random() * 90000)}`,
      items: stagedItems,
      notes: manifestNotes,
    });

    setStagedItems([]);
    setActiveManifest(manifest);
    setIsPrintPreviewOpen(true);
    reloadData();
    setActionSuccessNotice(`✓ Linehaul Manifest ${manifest.manifestNumber} generated successfully with ${manifest.totalShipments} consignments!`);
    setTimeout(() => setActionSuccessNotice(null), 6000);
  };

  const handlePrintManifest = (manifest: BranchManifest) => {
    markManifestPrinted(manifest.id);
    reloadData();
    const updated = { ...manifest, status: (manifest.status === 'Approved & Dispatched' ? 'Approved & Dispatched' : 'Printed') as any };
    setActiveManifest(updated);
    window.print();
  };

  const handleApproveAndDispatch = (manifestId: string) => {
    const res = approveAndDispatchManifest(manifestId, currentUser?.name);
    if (!res.success) {
      alert(res.error || 'Failed to approve dispatch.');
      return;
    }

    reloadData();
    if (activeManifest && activeManifest.id === manifestId && res.manifest) {
      setActiveManifest(res.manifest);
    }

    setActionSuccessNotice(
      `🚀 Manifest Approved & Dispatched! Updated ${res.updatedCount} consignment(s) to "Shipment Dispatched" status.`
    );
    setTimeout(() => setActionSuccessNotice(null), 8000);
  };

  // Staging Totals
  const totalStagedPkgs = stagedItems.reduce((acc, i) => acc + (i.pieces || 1), 0);
  const totalStagedWeight = Math.round(stagedItems.reduce((acc, i) => acc + (i.weightKg || 0), 0) * 10) / 10;
  const totalStagedCod = stagedItems.reduce((acc, i) => acc + (i.codAmount || 0), 0);

  // Filtered shipments for 'dispatched_shipments' tab
  const dispatchedShipments = allShipments.filter(s => s.status === 'Shipment Dispatched' || s.status === 'In Transit');

  // Eligible shipments to quick add
  const eligibleShipments = allShipments.filter(
    s =>
      !stagedItems.some(i => i.bookingId.toUpperCase() === s.id.toUpperCase()) &&
      (s.status === 'Order Placed' || s.status === 'Label Generated' || s.status === 'Origin Hub Inwarded' || s.status === 'Pending Pickup')
  );

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container">
        {/* Branch Context Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(10, 15, 29, 0.95) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              boxShadow: '0 8px 20px rgba(168, 85, 247, 0.25)'
            }}>
              <Boxes size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-purple">
                  <MapPin size={11} /> {branchCode}
                </span>
                <span className="badge badge-subtle">
                  BRANCH DISPATCH CONSOLE
                </span>
                {currentUser?.role === 'admin' && (
                  <span className="badge badge-orange">HQ Super Admin Mode</span>
                )}
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.1rem 0' }}>
                {branchOrigin}
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Booking manifest generator, physical handover sheets, and linehaul dispatch approval engine.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => reloadData()}
              className="btn btn-secondary btn-sm"
              title="Refresh Data"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <Link href="/bookings" className="btn btn-secondary btn-sm">
              <ExternalLink size={14} /> Consignment Registry
            </Link>
          </div>
        </div>

        {/* Global Action Feedback Alert */}
        {actionSuccessNotice && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.92rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={20} />
            <span>{actionSuccessNotice}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem'
        }}>
          <button
            onClick={() => setActiveTab('create')}
            className={`btn btn-sm ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px' }}
          >
            <Plus size={14} />
            <span>New Manifest / Staging</span>
            {stagedItems.length > 0 && (
              <span style={{
                background: '#ffffff',
                color: '#000000',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                marginLeft: '0.35rem'
              }}>
                {stagedItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dispatched_manifests')}
            className={`btn btn-sm ${activeTab === 'dispatched_manifests' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px' }}
          >
            <Truck size={14} />
            <span>Dispatched Manifest Archive</span>
            <span style={{
              background: 'rgba(255,255,255,0.12)',
              padding: '0.1rem 0.45rem',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              marginLeft: '0.35rem'
            }}>
              {manifests.filter(m => m.status === 'Approved & Dispatched').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dispatched_shipments')}
            className={`btn btn-sm ${activeTab === 'dispatched_shipments' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px' }}
          >
            <Layers size={14} />
            <span>Shipment Dispatched Section</span>
            <span style={{
              background: 'rgba(255, 102, 0, 0.2)',
              color: 'var(--brand-orange)',
              padding: '0.1rem 0.45rem',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              marginLeft: '0.35rem'
            }}>
              {dispatchedShipments.length} Active
            </span>
          </button>
        </div>

        {/* ================= TAB 1: CREATE MANIFEST / STAGING ================= */}
        {activeTab === 'create' && (
          <div>
            {/* Input Bar Card */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Boxes size={18} color="#c084fc" /> Step 1: Input Booking Number
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                    Scan barcode or type AWB booking ID to assemble items into this linehaul manifest.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEligibleDrawer(!showEligibleDrawer)}
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
                >
                  <Search size={14} /> Browse Available Bookings ({eligibleShipments.length})
                </button>
              </div>

              {/* Quick Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddBookingById();
                }}
                style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
              >
                <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                  <input
                    type="text"
                    value={inputBookingId}
                    onChange={(e) => setInputBookingId(e.target.value)}
                    placeholder="Enter Booking Number (e.g. D7-8821-EXP / D7-6042-CARGO)"
                    className="input-field"
                    style={{ fontSize: '1rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#a855f7', borderColor: '#a855f7', color: '#ffffff', minWidth: '160px' }}
                >
                  <Plus size={16} /> Add to Manifest
                </button>
              </form>

              {/* Input feedback message */}
              {inputFeedback && (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: inputFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: inputFeedback.type === 'success' ? '#34d399' : '#f87171',
                  border: `1px solid ${inputFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {inputFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{inputFeedback.message}</span>
                </div>
              )}

              {/* Eligible Shipments Quick-Add Drawer */}
              {showEligibleDrawer && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1.25rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                      📦 Inwarded & Pending Pickups Ready for Dispatch ({eligibleShipments.length}):
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click [ + Add ] to include in manifest</span>
                  </div>

                  {eligibleShipments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No unassigned consignments currently waiting in origin staging.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.65rem', maxHeight: '240px', overflowY: 'auto' }}>
                      {eligibleShipments.map(s => (
                        <div
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.85rem',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#ffffff' }}>{s.id}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              To: {s.destination.city} • {s.cargo.pieces} Pkg • {s.cargo.weightKg} KG
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddBookingById(s.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Linehaul Routing & Vehicle Assignment */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={18} color="var(--brand-orange)" /> Step 2: Linehaul Route & Carrier Assignment
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Origin Departure Hub</label>
                  <input
                    type="text"
                    value={branchOrigin}
                    onChange={(e) => setBranchOrigin(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Destination Gateway Hub</label>
                  <select
                    value={destinationHub}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="input-field"
                  >
                    <option value="Pokhara Regional Sort Hub (Gandaki)">Pokhara Regional Sort Hub (Gandaki)</option>
                    <option value="Biratnagar Hub (Koshi Eastern Corridor)">Biratnagar Hub (Koshi Eastern Corridor)</option>
                    <option value="Birgunj Port Terminal (Madhesh Commercial Gateway)">Birgunj Port Terminal (Madhesh)</option>
                    <option value="Nepalgunj Western Regional Hub (Lumbini / Karnali)">Nepalgunj Western Regional Hub</option>
                    <option value="Butwal Cross-Dock Transit Hub">Butwal Cross-Dock Transit Hub</option>
                    <option value="Chitwan Narayangarh Gateway Hub">Chitwan Narayangarh Gateway Hub</option>
                    <option value="Dhangadhi Far-Western Terminal">Dhangadhi Far-Western Terminal</option>
                    <option value="Kathmandu Mega-Hub (KTM-01)">Kathmandu Mega-Hub (KTM-01)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Linehaul Vehicle / Flight</label>
                  <input
                    type="text"
                    value={linehaulVehicle}
                    onChange={(e) => setLinehaulVehicle(e.target.value)}
                    placeholder="e.g. BA 2 KHA 8841 (Express E-Van)"
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Driver / Carrier Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Bhimsen Thapa"
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Driver Phone Number</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+977 98..."
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Container / Security Seal Number</label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder="e.g. SL-99412"
                    className="input-field"
                    style={{ fontWeight: 700, letterSpacing: '0.05em' }}
                  />
                </div>
              </div>
            </div>

            {/* Staged Items Table */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="var(--brand-cyan)" /> Step 3: Staged Consignments ({stagedItems.length})
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                    Review all bookings included in this manifest before generating the formal handover sheet.
                  </p>
                </div>

                {/* Staging KPIs */}
                <div style={{ display: 'flex', gap: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shipments</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{stagedItems.length}</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Pkgs</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>{totalStagedPkgs}</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weight</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-orange)' }}>{totalStagedWeight} KG</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>COD Total</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>Rs. {totalStagedCod.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Table */}
              {stagedItems.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  border: '2px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: 'var(--text-muted)'
                }}>
                  <Boxes size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.25rem' }}>
                    No Consignments Added Yet
                  </div>
                  <p style={{ maxWidth: '440px', margin: '0 auto 1rem auto', fontSize: '0.85rem' }}>
                    Use the input field above to enter or scan booking numbers, or click "Browse Available Bookings".
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>#</th>
                        <th style={{ padding: '0.75rem' }}>Booking / AWB</th>
                        <th style={{ padding: '0.75rem' }}>Consignee & Phone</th>
                        <th style={{ padding: '0.75rem' }}>Destination City</th>
                        <th style={{ padding: '0.75rem' }}>Pkgs</th>
                        <th style={{ padding: '0.75rem' }}>Gross Wt</th>
                        <th style={{ padding: '0.75rem' }}>Service</th>
                        <th style={{ padding: '0.75rem' }}>Payment / COD</th>
                        <th style={{ padding: '0.75rem' }}>Current Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stagedItems.map((item, idx) => (
                        <tr
                          key={item.bookingId}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 700, color: '#ffffff' }}>
                            <Link href={`/track?id=${item.bookingId}`} target="_blank" style={{ color: 'var(--brand-orange)', textDecoration: 'none' }}>
                              {item.bookingId}
                            </Link>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.consigneeName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.consigneePhone}</div>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{item.destinationCity}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.pieces} Pkg</td>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.weightKg} KG</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className="badge badge-subtle" style={{ fontSize: '0.7rem' }}>{item.serviceCode}</span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {item.codAmount > 0 ? (
                              <span style={{ color: '#34d399', fontWeight: 700 }}>COD: Rs. {item.codAmount.toLocaleString()}</span>
                            ) : (
                              <span style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>PREPAID</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className="badge badge-subtle">{item.status}</span>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveStagedItem(item.bookingId)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: '0.3rem',
                                borderRadius: '4px'
                              }}
                              title="Remove item from manifest"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Step 4 Generate Button */}
              {stagedItems.length > 0 && (
                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setStagedItems([])}
                    className="btn btn-secondary"
                  >
                    Clear Staging
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateManifest}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                      borderColor: '#9333ea',
                      padding: '0.75rem 1.75rem',
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      boxShadow: '0 8px 24px rgba(168, 85, 247, 0.35)'
                    }}
                  >
                    <FileText size={18} />
                    <span>Generate Manifest ({stagedItems.length} Bookings)</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: DISPATCHED MANIFEST ARCHIVE ================= */}
        {activeTab === 'dispatched_manifests' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={18} color="var(--brand-orange)" /> Linehaul Dispatch Manifest Archive
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Historical and live records of all generated manifests, driver handovers, and linehaul departures.
                </p>
              </div>
            </div>

            {manifests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No manifests have been generated yet for this branch.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>Manifest Number</th>
                      <th style={{ padding: '0.75rem' }}>Destination Hub</th>
                      <th style={{ padding: '0.75rem' }}>Vehicle & Driver</th>
                      <th style={{ padding: '0.75rem' }}>Seal No.</th>
                      <th style={{ padding: '0.75rem' }}>Shipments</th>
                      <th style={{ padding: '0.75rem' }}>Weight</th>
                      <th style={{ padding: '0.75rem' }}>COD Total</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifests.map((m) => (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: '#ffffff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FileText size={15} color="#c084fc" />
                            <span>{m.manifestNumber}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                          <div style={{ fontWeight: 600 }}>{m.destinationCity}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.destinationHub}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{m.linehaulVehicle}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {m.driverName} ({m.driverPhone})
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                          {m.sealNumber}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                          {m.totalShipments} Consignments
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                          {m.totalWeightKg} KG
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#34d399' }}>
                          Rs. {m.totalCodNpr.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {m.status === 'Approved & Dispatched' ? (
                            <span className="badge badge-emerald">Approved & Dispatched</span>
                          ) : m.status === 'Printed' ? (
                            <span className="badge badge-cyan">Printed / Ready</span>
                          ) : (
                            <span className="badge badge-purple">Generated</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveManifest(m);
                                setIsPrintPreviewOpen(true);
                              }}
                              className="btn btn-secondary btn-sm"
                              title="View & Print Handover Manifest"
                            >
                              <Eye size={13} /> View / Print
                            </button>

                            {m.status !== 'Approved & Dispatched' && (
                              <button
                                type="button"
                                onClick={() => handleApproveAndDispatch(m.id)}
                                className="btn btn-sm"
                                style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  borderColor: 'rgba(16, 185, 129, 0.4)',
                                  color: '#34d399',
                                  fontWeight: 700
                                }}
                              >
                                <Check size={13} /> Approve Dispatched
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: SHIPMENT DISPATCHED SECTION ================= */}
        {activeTab === 'dispatched_shipments' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="var(--brand-orange)" /> Shipment Dispatched Section ({dispatchedShipments.length})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  All individual consignments currently approved and active on linehaul transit routes across Nepal.
                </p>
              </div>

              <Link href="/bookings?status=Shipment+Dispatched" className="btn btn-secondary btn-sm">
                <ExternalLink size={14} /> Open in Bookings Registry
              </Link>
            </div>

            {dispatchedShipments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No consignments currently in Shipment Dispatched status.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>AWB Number</th>
                      <th style={{ padding: '0.75rem' }}>Origin & Destination</th>
                      <th style={{ padding: '0.75rem' }}>Consignee</th>
                      <th style={{ padding: '0.75rem' }}>Cargo Specs</th>
                      <th style={{ padding: '0.75rem' }}>Assigned Vehicle</th>
                      <th style={{ padding: '0.75rem' }}>Latest Checkpoint</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchedShipments.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                          <Link href={`/track?id=${s.id}`} style={{ color: 'var(--brand-orange)', textDecoration: 'none' }}>
                            {s.id}
                          </Link>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#ffffff' }}>
                          <div style={{ fontWeight: 600 }}>{s.origin.city} → {s.destination.city}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.destination.hub}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{s.recipient.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.recipient.phone}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {s.cargo.pieces} Pkg • {s.cargo.weightKg} KG
                          {s.codAmount ? <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>COD Rs. {s.codAmount.toLocaleString()}</div> : null}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                          {s.telemetry.transportVehicle || 'BA 2 KHA 8841 (Express E-Van)'}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '220px' }}>
                          <div style={{ color: '#ffffff', fontWeight: 600 }}>{s.checkpoints[0]?.status}</div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.checkpoints[0]?.description}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className="badge badge-orange">Shipment Dispatched</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= MODAL: PRINTABLE OFFICIAL MANIFEST ================= */}
        {isPrintPreviewOpen && activeManifest && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(3, 7, 18, 0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            overflowY: 'auto'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '900px',
              backgroundColor: '#0c1222',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
              overflow: 'hidden'
            }}>
              {/* Modal Actions Header Bar */}
              <div style={{
                padding: '1rem 1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="badge badge-purple">
                    <FileText size={12} /> {activeManifest.manifestNumber}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Status: <strong style={{ color: activeManifest.status === 'Approved & Dispatched' ? '#34d399' : '#c084fc' }}>{activeManifest.status}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {/* PRINT OUT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handlePrintManifest(activeManifest)}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#3b82f6', borderColor: '#2563eb', padding: '0.5rem 1rem', fontSize: '0.84rem' }}
                  >
                    <Printer size={15} /> Print Out Manifest
                  </button>

                  {/* APPROVE DISPATCHED BUTTON */}
                  {activeManifest.status !== 'Approved & Dispatched' ? (
                    <button
                      type="button"
                      onClick={() => handleApproveAndDispatch(activeManifest.id)}
                      className="btn btn-sm"
                      style={{
                        background: '#10b981',
                        borderColor: '#059669',
                        color: '#ffffff',
                        fontWeight: 700,
                        padding: '0.5rem 1rem',
                        fontSize: '0.84rem'
                      }}
                    >
                      <Check size={15} /> Approve Dispatched
                    </button>
                  ) : (
                    <span className="badge badge-emerald" style={{ padding: '0.4rem 0.8rem' }}>
                      <CheckCircle2 size={13} /> Dispatched
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsPrintPreviewOpen(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

              {/* Printable Document Paper */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '2rem',
                backgroundColor: '#ffffff',
                color: '#000000',
              }}>
                <div id="printable-manifest-sheet" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {/* Print Document Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000000', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src="/images/logo.png"
                        alt="Double 7 Logistics"
                        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#000000' }}>
                          DOUBLE 7 LOGISTICS
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Official Linehaul Dispatch & Gateway Handover Manifest
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#666666' }}>
                          HQ Command: Kathmandu, Nepal • Phone: +977 1 4411000 • www.double7.com.np
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#000000', letterSpacing: '0.05em' }}>
                        {activeManifest.manifestNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#555555' }}>
                        Issued: {new Date(activeManifest.createdAt).toLocaleString()}
                      </div>
                      <div style={{
                        marginTop: '0.35rem',
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        border: '1.5px solid #000000',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}>
                        {activeManifest.status}
                      </div>
                    </div>
                  </div>

                  {/* Route & Transport Specification Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem', border: '1px solid #000000', padding: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#666666' }}>Origin Hub</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{activeManifest.branchOrigin}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#666666' }}>Destination Gateway</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{activeManifest.destinationHub}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#666666' }}>Assigned Vehicle</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{activeManifest.linehaulVehicle}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#666666' }}>Security Seal No.</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#000000' }}>#{activeManifest.sealNumber}</div>
                    </div>
                  </div>

                  {/* Driver & Dispatcher Details */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '1rem', padding: '0 0.25rem' }}>
                    <div><strong>Driver Name:</strong> {activeManifest.driverName} ({activeManifest.driverPhone})</div>
                    <div><strong>Dispatched By:</strong> {activeManifest.dispatchedBy || 'Branch Operations Officer'}</div>
                  </div>

                  {/* Consignment Items Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '1.5rem', border: '1px solid #000000' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1.5px solid #000000', textAlign: 'left' }}>
                        <th style={{ padding: '0.45rem', borderRight: '1px solid #cccccc', width: '35px' }}>S.N.</th>
                        <th style={{ padding: '0.45rem', borderRight: '1px solid #cccccc' }}>Booking / AWB ID</th>
                        <th style={{ padding: '0.45rem', borderRight: '1px solid #cccccc' }}>Consignee Name</th>
                        <th style={{ padding: '0.45rem', borderRight: '1px solid #cccccc' }}>Destination City</th>
                        <th style={{ padding: '0.45rem', borderRight: '1px solid #cccccc', textAlign: 'center' }}>Pkgs</th>
                        <th style={{ padding: '0.45rem', borderRight: '1px solid #cccccc', textAlign: 'right' }}>Wt (KG)</th>
                        <th style={{ padding: '0.45rem', borderRight: '1px solid #cccccc', textAlign: 'right' }}>COD (NPR)</th>
                        <th style={{ padding: '0.45rem', textAlign: 'center', width: '110px' }}>Receiver Sign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeManifest.items.map((item, i) => (
                        <tr key={item.bookingId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.45rem', borderRight: '1px solid #cccccc', color: '#555555' }}>{i + 1}</td>
                          <td style={{ padding: '0.45rem', borderRight: '1px solid #cccccc', fontWeight: 800 }}>{item.bookingId}</td>
                          <td style={{ padding: '0.45rem', borderRight: '1px solid #cccccc' }}>
                            <div style={{ fontWeight: 600 }}>{item.consigneeName}</div>
                            <div style={{ fontSize: '0.7rem', color: '#666666' }}>{item.consigneePhone}</div>
                          </td>
                          <td style={{ padding: '0.45rem', borderRight: '1px solid #cccccc' }}>{item.destinationCity}</td>
                          <td style={{ padding: '0.45rem', borderRight: '1px solid #cccccc', textAlign: 'center', fontWeight: 700 }}>{item.pieces}</td>
                          <td style={{ padding: '0.45rem', borderRight: '1px solid #cccccc', textAlign: 'right', fontWeight: 700 }}>{item.weightKg}</td>
                          <td style={{ padding: '0.45rem', borderRight: '1px solid #cccccc', textAlign: 'right', fontWeight: 800 }}>
                            {item.codAmount > 0 ? `Rs. ${item.codAmount.toLocaleString()}` : 'PAID'}
                          </td>
                          <td style={{ padding: '0.45rem', borderRight: 'none', borderBottom: '1px dashed #aaaaaa' }}></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #000000', fontWeight: 900 }}>
                        <td colSpan={4} style={{ padding: '0.5rem', textAlign: 'right', borderRight: '1px solid #cccccc' }}>
                          TOTAL CARGO SUMMARY:
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #cccccc' }}>
                          {activeManifest.totalPieces} Pkgs
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', borderRight: '1px solid #cccccc' }}>
                          {activeManifest.totalWeightKg} KG
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', borderRight: '1px solid #cccccc' }}>
                          Rs. {activeManifest.totalCodNpr.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Operational Sign-off & Handover Signatures */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #000000' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ height: '40px', borderBottom: '1px dotted #666666', marginBottom: '0.4rem' }}></div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>DISPATCHING OFFICER</div>
                      <div style={{ fontSize: '0.68rem', color: '#666666' }}>Double 7 Origin Hub</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ height: '40px', borderBottom: '1px dotted #666666', marginBottom: '0.4rem' }}></div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>LINEHAUL DRIVER ACKNOWLEDGMENT</div>
                      <div style={{ fontSize: '0.68rem', color: '#666666' }}>Seal Verified Intact</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ height: '40px', borderBottom: '1px dotted #666666', marginBottom: '0.4rem' }}></div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>DESTINATION HUB RECEIVING OFFICER</div>
                      <div style={{ fontSize: '0.68rem', color: '#666666' }}>Piece Count & Verification</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.65rem', color: '#777777', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>
                    DOUBLE 7 LOGISTICS OPERATIONAL SYSTEM • ALL SHIPMENTS CARRIED SUBJECT TO STANDARD CARRIAGE CONDITIONS • ENFORCED WORKFLOW PROTOCOL
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
