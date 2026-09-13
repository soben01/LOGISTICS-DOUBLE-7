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
  ExternalLink,
  Edit3,
  XCircle,
  CheckCheck,
  AlertTriangle,
  RotateCcw,
  Inbox,
  Send,
  CornerDownLeft,
  Clock,
  ClipboardList,
  Ban
} from 'lucide-react';
import { User, getCurrentUser } from '../../lib/auth';
import { getShipments, updateShipmentStatus, Shipment } from '../../lib/store';
import {
  BranchManifest,
  ManifestItem,
  ManifestStatus,
  NEPAL_HUBS,
  NepalHub,
  ManifestHistoryEntry,
  getBranchManifests,
  saveBranchManifest,
  updateBranchManifest,
  deleteBranchManifest,
  createBranchManifest,
  markManifestPrinted,
  approveManifest,
  rejectManifest,
  approveAndDispatchManifest,
  receiveManifestAtDestination,
  lookupShipmentForManifest
} from '../../lib/manifest';

interface Props {
  user?: User | null;
}

export default function BranchManifestManager({ user }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);
  const [manifests, setManifests] = useState<BranchManifest[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'dispatched_manifests' | 'incoming_receiving' | 'dispatched_shipments'>('create');
  
  // Hub Selection & Switching
  const [selectedHubCode, setSelectedHubCode] = useState<string>('KTM-01');
  const [branchOrigin, setBranchOrigin] = useState('Kathmandu Mega-Hub (KTM-01)');
  const [branchCode, setBranchCode] = useState('KTM-01');

  // Archive Filter Hub & Status
  const [archiveHubFilter, setArchiveHubFilter] = useState<string>('ALL');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'REJECTED' | 'RECEIVED'>('ALL');

  // Staging / Editing state for manifest creation
  const [editingManifestId, setEditingManifestId] = useState<string | null>(null);
  const [inputBookingId, setInputBookingId] = useState('');
  const [stagedItems, setStagedItems] = useState<ManifestItem[]>([]);
  const [inputFeedback, setInputFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Linehaul vehicle & route details
  const [destinationHub, setDestinationHub] = useState('Pokhara Regional Sort Hub (PKR-01)');
  const [destinationCity, setDestinationCity] = useState('Pokhara');
  const [linehaulVehicle, setLinehaulVehicle] = useState('BA 2 KHA 8841 (Express E-Van)');
  const [driverName, setDriverName] = useState('Bhimsen Thapa');
  const [driverPhone, setDriverPhone] = useState('+977 98510 11223');
  const [sealNumber, setSealNumber] = useState('SL-99412');
  const [manifestNotes, setManifestNotes] = useState('Scheduled linehaul trunk dispatch. Priority and fragile parcels segregated.');

  // Modal view for generated/selected manifest
  const [activeManifest, setActiveManifest] = useState<BranchManifest | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  
  // Admin Confirmation / Action Modals
  const [confirmDispatchModal, setConfirmDispatchModal] = useState<BranchManifest | null>(null);
  const [rejectModalManifest, setRejectModalManifest] = useState<BranchManifest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Destination Hub Inward Receiving Modal
  const [receivingModalManifest, setReceivingModalManifest] = useState<BranchManifest | null>(null);
  const [receivedPackagesCount, setReceivedPackagesCount] = useState<number>(0);
  const [receivingRemarks, setReceivingRemarks] = useState<string>('');

  // Quick-add drawer state
  const [showEligibleDrawer, setShowEligibleDrawer] = useState(false);
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);

  const reloadData = () => {
    const list = getBranchManifests('ALL');
    setManifests(list);
    setAllShipments(getShipments());
  };

  useEffect(() => {
    const u = currentUser || getCurrentUser();
    if (u) {
      setCurrentUser(u);
      if (u.branchCode) {
        const found = NEPAL_HUBS.find(h => h.code === u.branchCode);
        if (found) {
          setSelectedHubCode(found.code);
          setBranchCode(found.code);
          setBranchOrigin(found.name);
        }
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

  // Handle Switching Origin Hub
  const handleSwitchHub = (hubCode: string) => {
    setSelectedHubCode(hubCode);
    const hub = NEPAL_HUBS.find(h => h.code === hubCode);
    if (hub) {
      setBranchCode(hub.code);
      setBranchOrigin(hub.name);
      
      // Auto-set default destination to a different hub
      const otherHubs = NEPAL_HUBS.filter(h => h.code !== hub.code);
      if (otherHubs.length > 0) {
        setDestinationHub(otherHubs[0].name);
        setDestinationCity(otherHubs[0].city);
      }
    }
    // If editing a manifest from another hub, ask to cancel
    if (editingManifestId) {
      if (confirm('Switching hubs will exit manifest edit mode. Discard current changes?')) {
        handleCancelEdit();
      }
    }
  };

  const handleDestinationChange = (hubName: string) => {
    setDestinationHub(hubName);
    const found = NEPAL_HUBS.find(h => h.name === hubName);
    if (found) {
      setDestinationCity(found.city);
    }
  };

  const handleAddBookingById = (idToAdd?: string) => {
    const targetId = (idToAdd || inputBookingId).trim().toUpperCase();
    if (!targetId) {
      setInputFeedback({ type: 'error', message: 'Please enter a booking or waybill number.' });
      return;
    }

    // Check if already staged
    if (stagedItems.some(i => i.bookingId.toUpperCase() === targetId)) {
      setInputFeedback({ type: 'error', message: `Booking ${targetId} is already added in this manifest.` });
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

  // Create or Update Manifest
  const handleSaveManifest = (statusToSet: ManifestStatus = 'Pending Approval') => {
    if (stagedItems.length === 0) {
      alert('Please add at least one booking number to the manifest.');
      return;
    }

    if (editingManifestId) {
      // Update existing manifest
      const existing = manifests.find(m => m.id === editingManifestId);
      if (!existing) {
        alert('Error: Original manifest not found.');
        return;
      }
      if (existing.status === 'Approved & Dispatched' || existing.status === 'Approved' || existing.status === 'Received' || existing.isLocked) {
        alert('SECURITY ERROR: This manifest is locked and cannot be edited.');
        return;
      }

      const updated: BranchManifest = {
        ...existing,
        branchOrigin,
        branchCode,
        destinationHub,
        destinationCity,
        linehaulVehicle,
        driverName,
        driverPhone,
        sealNumber: sealNumber || existing.sealNumber,
        items: stagedItems,
        notes: manifestNotes,
        status: statusToSet,
      };

      const res = updateBranchManifest(updated);
      if (!res.success) {
        alert(res.error || 'Failed to update manifest.');
        return;
      }

      setActionSuccessNotice(`✓ Manifest ${existing.manifestNumber} updated and ${statusToSet === 'Pending Approval' ? 'submitted for admin approval' : 'saved'}.`);
      handleCancelEdit();
      reloadData();
      setActiveTab('dispatched_manifests');
      setTimeout(() => setActionSuccessNotice(null), 6000);
    } else {
      // Create fresh manifest
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
        status: statusToSet,
        notes: manifestNotes,
        createdBy: currentUser?.name || `${branchCode} Hub Officer`,
      });

      setStagedItems([]);
      setActiveManifest(manifest);
      setIsPrintPreviewOpen(true);
      reloadData();
      setActionSuccessNotice(
        statusToSet === 'Pending Approval'
          ? `✓ Linehaul Manifest ${manifest.manifestNumber} submitted for Admin Approval!`
          : `✓ Linehaul Manifest ${manifest.manifestNumber} saved as Draft.`
      );
      setTimeout(() => setActionSuccessNotice(null), 6000);
    }
  };

  // Start Editing an Existing Manifest (Only if NOT Locked)
  const handleStartEdit = (manifest: BranchManifest) => {
    if (manifest.status === 'Approved & Dispatched' || manifest.status === 'Approved' || manifest.status === 'Received' || manifest.isLocked) {
      alert('🔒 IMMUTABLE MANIFEST: This manifest has been verified and locked by Admin. Handover records and container seals cannot be altered.');
      return;
    }

    setEditingManifestId(manifest.id);
    setSelectedHubCode(manifest.branchCode);
    setBranchCode(manifest.branchCode);
    setBranchOrigin(manifest.branchOrigin);
    setDestinationHub(manifest.destinationHub);
    setDestinationCity(manifest.destinationCity);
    setLinehaulVehicle(manifest.linehaulVehicle);
    setDriverName(manifest.driverName);
    setDriverPhone(manifest.driverPhone);
    setSealNumber(manifest.sealNumber);
    setManifestNotes(manifest.notes || '');
    setStagedItems([...manifest.items]);

    setActiveTab('create');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingManifestId(null);
    setStagedItems([]);
    setSealNumber(`SL-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const handlePrintManifest = (manifest: BranchManifest) => {
    markManifestPrinted(manifest.id);
    reloadData();
    const updated = {
      ...manifest,
      status: (manifest.status === 'Approved & Dispatched' || manifest.status === 'Received' ? manifest.status : 'Printed') as ManifestStatus
    };
    setActiveManifest(updated);
    window.print();
  };

  // Admin Approves Manifest (Locks from Hub edits, ready for linehaul departure)
  const handleAdminApproveOnly = (manifestId: string) => {
    const res = approveManifest(manifestId, currentUser?.name || 'Super Admin');
    if (!res.success) {
      alert(res.error || 'Failed to approve manifest.');
      return;
    }
    reloadData();
    setActionSuccessNotice(`✓ Manifest ${res.manifest?.manifestNumber} APPROVED by Admin. Manifest is now locked from hub edits and queued for dispatch.`);
    setTimeout(() => setActionSuccessNotice(null), 7000);
  };

  // Open Rejection Modal
  const handleOpenRejectModal = (manifest: BranchManifest) => {
    setRejectModalManifest(manifest);
    setRejectionReason('');
  };

  // Confirm Rejection & Return to Hub
  const handleConfirmReject = () => {
    if (!rejectModalManifest) return;
    if (!rejectionReason.trim()) {
      alert('Please enter a reason for rejecting and returning this manifest to the hub.');
      return;
    }
    const res = rejectManifest(rejectModalManifest.id, currentUser?.name || 'Super Admin', rejectionReason.trim());
    if (!res.success) {
      alert(res.error || 'Failed to reject manifest.');
      return;
    }
    setRejectModalManifest(null);
    setRejectionReason('');
    reloadData();
    setActionSuccessNotice(`⚠️ Manifest ${res.manifest?.manifestNumber} returned to ${res.manifest?.branchCode} Hub for correction.`);
    setTimeout(() => setActionSuccessNotice(null), 7000);
  };

  // Execute Dispatch & Lock
  const handleExecuteApprovalAndDispatch = (manifestId: string) => {
    const res = approveAndDispatchManifest(manifestId, currentUser?.name || 'HQ Operations Admin');
    if (!res.success) {
      alert(res.error || 'Failed to approve dispatch.');
      return;
    }

    setConfirmDispatchModal(null);
    reloadData();
    if (activeManifest && activeManifest.id === manifestId && res.manifest) {
      setActiveManifest(res.manifest);
    }

    setActionSuccessNotice(
      `🔒 Manifest ${res.manifest?.manifestNumber} VERIFIED & DISPATCHED! Updated ${res.updatedCount} consignment(s) to "Shipment Dispatched" and permanently locked manifest against editing.`
    );
    setTimeout(() => setActionSuccessNotice(null), 8000);
  };

  // Destination Hub Receiving Flow
  const handleOpenReceiveModal = (manifest: BranchManifest) => {
    setReceivingModalManifest(manifest);
    setReceivedPackagesCount(manifest.totalPieces || manifest.items.reduce((sum, i) => sum + (i.pieces || 1), 0));
    setReceivingRemarks(`All ${manifest.totalPieces || manifest.items.length} packages received intact. Security seal #${manifest.sealNumber} verified.`);
  };

  const handleConfirmReceive = () => {
    if (!receivingModalManifest) return;
    const res = receiveManifestAtDestination(
      receivingModalManifest.id,
      currentUser?.name || `${selectedHubCode} Receiving Desk`,
      receivingRemarks.trim()
    );
    if (!res.success) {
      alert(res.error || 'Failed to receive manifest.');
      return;
    }
    setReceivingModalManifest(null);
    reloadData();
    setActionSuccessNotice(
      `📥 Manifest ${res.manifest?.manifestNumber} RECEIVED at ${selectedHubCode}! Updated all ${res.manifest?.items.length} consignment(s) to "Hub Received".`
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
      (s.status === 'Order Placed' || s.status === 'Label Generated' || s.status === 'Origin Hub Inwarded' || s.status === 'Pending Pickup' || s.status === 'Hub Received')
  );

  // Incoming manifests for the current hub
  const activeHubObj = NEPAL_HUBS.find(h => h.code === selectedHubCode);
  const incomingManifests = manifests.filter(m => {
    if (!activeHubObj) return false;
    const dest = m.destinationHub.toLowerCase();
    const city = m.destinationCity.toLowerCase();
    const code = activeHubObj.code.toLowerCase();
    const hubCity = activeHubObj.city.toLowerCase();
    return dest.includes(code) || dest.includes(hubCity) || city.includes(hubCity);
  });
  const incomingAwaitingCount = incomingManifests.filter(m => m.status === 'Approved & Dispatched').length;

  // Filtered Archive Manifests
  const filteredManifests = manifests.filter(m => {
    if (archiveHubFilter !== 'ALL' && m.branchCode.toUpperCase() !== archiveHubFilter.toUpperCase()) {
      return false;
    }
    if (archiveStatusFilter === 'DRAFT' && m.status !== 'Draft') {
      return false;
    }
    if (archiveStatusFilter === 'PENDING' && m.status !== 'Pending Approval' && m.status !== 'Printed') {
      return false;
    }
    if (archiveStatusFilter === 'APPROVED' && m.status !== 'Approved') {
      return false;
    }
    if (archiveStatusFilter === 'DISPATCHED' && m.status !== 'Approved & Dispatched') {
      return false;
    }
    if (archiveStatusFilter === 'REJECTED' && m.status !== 'Rejected') {
      return false;
    }
    if (archiveStatusFilter === 'RECEIVED' && m.status !== 'Received') {
      return false;
    }
    return true;
  });

  const draftCount = manifests.filter(m => m.status === 'Draft').length;
  const pendingApprovalCount = manifests.filter(m => m.status === 'Pending Approval' || m.status === 'Printed').length;
  const approvedCount = manifests.filter(m => m.status === 'Approved').length;
  const dispatchedCount = manifests.filter(m => m.status === 'Approved & Dispatched').length;
  const rejectedCount = manifests.filter(m => m.status === 'Rejected').length;
  const receivedCount = manifests.filter(m => m.status === 'Received').length;

  const currentEditingManifest = editingManifestId ? manifests.find(m => m.id === editingManifestId) : null;

  return (
    <div style={{ padding: '2.5rem 0 6rem 0' }}>
      <div className="container">
        {/* ================= 1. MULTI-HUB CONTEXT & CONTROLS BANNER ================= */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(10, 15, 29, 0.96) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(168, 85, 247, 0.22)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              boxShadow: '0 8px 24px rgba(168, 85, 247, 0.25)'
            }}>
              <Boxes size={30} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-purple" style={{ fontWeight: 800 }}>
                  <MapPin size={11} /> {branchCode}
                </span>
                <span className="badge badge-subtle">
                  MULTI-HUB LINEHAUL CONSOLE
                </span>
                <span className="badge badge-orange">
                  <ShieldCheck size={11} /> Central Admin Approval &amp; Permanent Lock
                </span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.35rem 0 0.15rem 0', letterSpacing: '-0.02em' }}>
                {branchOrigin}
              </h1>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Multi-hub dispatch console: Staging &rarr; Admin Review &rarr; Approval &rarr; Immutable Dispatch Lock &rarr; Destination Hub Receiving.
              </p>
            </div>
          </div>

          {/* Right: Operating Hub Switcher & Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'flex-end' }}>
            {/* Hub Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(255, 255, 255, 0.07)',
              padding: '0.45rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <Building size={16} color="#c084fc" />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                Active Hub:
              </span>
              <select
                value={selectedHubCode}
                onChange={(e) => handleSwitchHub(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {NEPAL_HUBS.map(hub => (
                  <option key={hub.code} value={hub.code} style={{ background: '#0a0f1d', color: '#ffffff' }}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => reloadData()}
                className="btn btn-secondary btn-sm"
                title="Refresh Manifests & Bookings"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <Link href="/bookings" className="btn btn-secondary btn-sm">
                <ExternalLink size={14} /> Consignments
              </Link>
            </div>
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
            fontWeight: 600,
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <CheckCircle2 size={22} />
            <span>{actionSuccessNotice}</span>
          </div>
        )}

        {/* ================= 2. WORKFLOW NAVIGATION TABS ================= */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem'
        }}>
          {/* Tab 1: Create / Edit Staging */}
          <button
            onClick={() => setActiveTab('create')}
            className={`btn btn-sm ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px' }}
          >
            {editingManifestId ? <Edit3 size={14} /> : <Plus size={14} />}
            <span>{editingManifestId ? 'Editing Staged Manifest' : 'New Manifest / Staging'}</span>
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

          {/* Tab 2: All Manifests & Approval Queue */}
          <button
            onClick={() => setActiveTab('dispatched_manifests')}
            className={`btn btn-sm ${activeTab === 'dispatched_manifests' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px' }}
          >
            <ShieldCheck size={14} />
            <span>All Manifests &amp; Approval Queue</span>
            {pendingApprovalCount > 0 && (
              <span style={{
                background: '#f59e0b',
                color: '#060911',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                marginLeft: '0.35rem'
              }}>
                {pendingApprovalCount} Pending
              </span>
            )}
            {approvedCount > 0 && (
              <span style={{
                background: 'rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                marginLeft: '0.2rem'
              }}>
                {approvedCount} Approved
              </span>
            )}
            {dispatchedCount > 0 && (
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                marginLeft: '0.2rem'
              }}>
                {dispatchedCount} Dispatched 🔒
              </span>
            )}
          </button>

          {/* Tab 3: Incoming Hub Receiving (Destination Desk) */}
          <button
            onClick={() => setActiveTab('incoming_receiving')}
            className={`btn btn-sm ${activeTab === 'incoming_receiving' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px' }}
          >
            <Inbox size={14} />
            <span>Incoming Manifests (Receiving Desk)</span>
            {incomingAwaitingCount > 0 && (
              <span style={{
                background: 'rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                marginLeft: '0.35rem'
              }}>
                {incomingAwaitingCount} Awaiting Inward
              </span>
            )}
          </button>

          {/* Tab 4: Active Dispatched Shipments */}
          <button
            onClick={() => setActiveTab('dispatched_shipments')}
            className={`btn btn-sm ${activeTab === 'dispatched_shipments' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px' }}
          >
            <Layers size={14} />
            <span>Linehaul Transit Consignments</span>
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

        {/* ================= TAB 1: CREATE / EDIT MANIFEST STAGING ================= */}
        {activeTab === 'create' && (
          <div>
            {/* If currently editing an existing manifest, display prominent notice */}
            {editingManifestId && (
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                background: currentEditingManifest?.status === 'Rejected' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: `1px solid ${currentEditingManifest?.status === 'Rejected' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                color: currentEditingManifest?.status === 'Rejected' ? '#fca5a5' : '#f59e0b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.75rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {currentEditingManifest?.status === 'Rejected' ? <XCircle size={20} color="#ef4444" /> : <Edit3 size={18} />}
                  <div>
                    <strong>
                      {currentEditingManifest?.status === 'Rejected' ? 'REJECTED MANIFEST CORRECTION MODE' : 'Editing Staged Manifest'}: {editingManifestId}
                    </strong>
                    {currentEditingManifest?.rejectionReason && (
                      <div style={{ fontSize: '0.84rem', color: '#ffffff', marginTop: '0.25rem', fontWeight: 600 }}>
                        Admin Reason: &quot;{currentEditingManifest.rejectionReason}&quot;
                      </div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                      Make adjustments below and click &quot;Update &amp; Resubmit for Approval&quot; to send back to Admin.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
                >
                  <RotateCcw size={13} /> Cancel Edit (Discard)
                </button>
              </div>
            )}

            {/* Step 1: Input Bar Card */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Boxes size={18} color="#c084fc" /> Step 1: Input Booking Number
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                    Scan barcode or type AWB booking ID to assemble items into this linehaul manifest for <strong>{branchOrigin}</strong>.
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
                    placeholder="ENTER BOOKING NUMBER (E.G. D7-8821-EXP / VIP016279 / FIC086274)"
                    className="input-field"
                    style={{ fontSize: '1rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#a855f7', borderColor: '#a855f7', color: '#ffffff', minWidth: '160px', fontWeight: 700 }}
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
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                      📦 Inwarded &amp; Unassigned Consignments Ready for Linehaul ({eligibleShipments.length}):
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click [ + Add ] to stage into manifest</span>
                  </div>

                  {eligibleShipments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No unassigned consignments currently waiting in staging.
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

            {/* Step 2: Linehaul Route & Carrier Assignment */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={18} color="var(--brand-orange)" /> Step 2: Linehaul Route &amp; Carrier Assignment
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {/* Origin Departure Hub */}
                <div className="input-group">
                  <label className="input-label">Origin Departure Hub</label>
                  <select
                    value={selectedHubCode}
                    onChange={(e) => handleSwitchHub(e.target.value)}
                    className="input-field"
                    style={{ fontWeight: 700, color: '#c084fc' }}
                  >
                    {NEPAL_HUBS.map(hub => (
                      <option key={hub.code} value={hub.code}>
                        {hub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Gateway Hub */}
                <div className="input-group">
                  <label className="input-label">Destination Gateway Hub</label>
                  <select
                    value={destinationHub}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="input-field"
                    style={{ fontWeight: 700 }}
                  >
                    {NEPAL_HUBS.filter(h => h.code !== selectedHubCode).map(hub => (
                      <option key={hub.code} value={hub.name}>
                        {hub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle */}
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

                {/* Driver */}
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

                {/* Driver Phone */}
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

                {/* Security Seal Number */}
                <div className="input-group">
                  <label className="input-label">Container / Security Seal Number</label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder="e.g. SL-99412"
                    className="input-field"
                    style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--brand-cyan)' }}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Staged Consignments */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="var(--brand-cyan)" /> Step 3: Staged Consignments ({stagedItems.length})
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                    Review all bookings before saving draft or submitting for Super Admin approval.
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

              {/* Staged Table */}
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
                    Use the input field above to enter or scan booking numbers, or click &quot;Browse Available Bookings&quot;.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>#</th>
                        <th style={{ padding: '0.75rem' }}>Booking / AWB</th>
                        <th style={{ padding: '0.75rem' }}>Consignee &amp; Phone</th>
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

              {/* Actions Footer */}
              {stagedItems.length > 0 && (
                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <button
                      type="button"
                      onClick={() => setStagedItems([])}
                      className="btn btn-secondary btn-sm"
                    >
                      Clear Staging
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Save as Draft */}
                    <button
                      type="button"
                      onClick={() => handleSaveManifest('Draft')}
                      className="btn btn-secondary"
                    >
                      Save as Draft
                    </button>

                    {/* Submit for Approval */}
                    <button
                      type="button"
                      onClick={() => handleSaveManifest('Pending Approval')}
                      className="btn btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                        borderColor: '#9333ea',
                        fontWeight: 700
                      }}
                    >
                      <CheckCheck size={16} />
                      <span>{editingManifestId ? 'Update & Submit for Approval' : 'Submit for Admin Approval'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: ALL MANIFESTS & APPROVAL QUEUE ================= */}
        {activeTab === 'dispatched_manifests' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            {/* Header & Filter Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} color="#34d399" /> Multi-Hub Central Manifest &amp; Approval Engine
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Central Super Admin review for all Nepal hubs. Admins inspect consignments, approve, reject with reason, or dispatch. Dispatched manifests are permanently locked.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Hub Filter */}
                <select
                  value={archiveHubFilter}
                  onChange={(e) => setArchiveHubFilter(e.target.value)}
                  className="input-field"
                  style={{ width: 'auto', fontSize: '0.84rem', padding: '0.45rem 0.85rem' }}
                >
                  <option value="ALL">All Hubs (Nationwide View)</option>
                  {NEPAL_HUBS.map(hub => (
                    <option key={hub.code} value={hub.code}>
                      {hub.code} - {hub.city}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'ALL', label: `All (${manifests.length})` },
                    { id: 'PENDING', label: `Pending (${pendingApprovalCount})` },
                    { id: 'APPROVED', label: `Approved (${approvedCount})` },
                    { id: 'DISPATCHED', label: `Dispatched 🔒 (${dispatchedCount})` },
                    { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
                    { id: 'RECEIVED', label: `Received (${receivedCount})` },
                    { id: 'DRAFT', label: `Drafts (${draftCount})` },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setArchiveStatusFilter(f.id as any)}
                      className={`btn btn-sm ${archiveStatusFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem', borderRadius: '6px', padding: '0.35rem 0.6rem' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Manifests Table */}
            {filteredManifests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <Boxes size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>No Manifests Matching Filter</div>
                <p style={{ fontSize: '0.84rem', maxWidth: '400px', margin: '0.25rem auto 1rem auto' }}>
                  Use &quot;New Manifest / Staging&quot; tab to stage and submit a manifest.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>Manifest # &amp; Date</th>
                      <th style={{ padding: '0.75rem' }}>Origin &rarr; Destination</th>
                      <th style={{ padding: '0.75rem' }}>Carrier &amp; Seal</th>
                      <th style={{ padding: '0.75rem' }}>Shipments</th>
                      <th style={{ padding: '0.75rem' }}>Weight &amp; COD</th>
                      <th style={{ padding: '0.75rem' }}>Status &amp; Lock</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Admin / Hub Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredManifests.map((m) => {
                      const isLocked = m.status === 'Approved & Dispatched' || m.status === 'Approved' || m.status === 'Received' || m.isLocked;
                      const isDispatched = m.status === 'Approved & Dispatched';
                      const isReceived = m.status === 'Received';
                      const isPending = m.status === 'Pending Approval' || m.status === 'Printed';
                      const isApproved = m.status === 'Approved';
                      const isRejected = m.status === 'Rejected';
                      const isDraft = m.status === 'Draft';

                      return (
                        <tr
                          key={m.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            backgroundColor: isDispatched
                              ? 'rgba(16, 185, 129, 0.02)'
                              : isPending
                              ? 'rgba(245, 158, 11, 0.02)'
                              : isRejected
                              ? 'rgba(239, 68, 68, 0.03)'
                              : 'transparent'
                          }}
                        >
                          {/* Manifest Number & Timestamp */}
                          <td style={{ padding: '0.75rem', fontWeight: 800, color: '#ffffff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <FileText size={15} color={isDispatched ? '#34d399' : isPending ? '#fbbf24' : isRejected ? '#f87171' : '#c084fc'} />
                              <span>{m.manifestNumber}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {new Date(m.createdAt).toLocaleString()}
                            </div>
                          </td>

                          {/* Route */}
                          <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                            <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{m.branchCode}</span>
                              <ArrowRight size={12} color="#94a3b8" />
                              <span>{m.destinationCity}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {m.destinationHub}
                            </div>
                          </td>

                          {/* Vehicle, Driver & Seal */}
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{m.linehaulVehicle}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {m.driverName} • Seal: <strong style={{ color: 'var(--brand-cyan)' }}>#{m.sealNumber}</strong>
                            </div>
                          </td>

                          {/* Total Shipments */}
                          <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                            {m.totalShipments} Consignments
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.totalPieces} Pieces</div>
                          </td>

                          {/* Weight & COD */}
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--brand-orange)' }}>{m.totalWeightKg} KG</div>
                            {m.totalCodNpr > 0 ? (
                              <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                                COD Rs. {m.totalCodNpr.toLocaleString()}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Prepaid</div>
                            )}
                          </td>

                          {/* Status Badge & Lock Indicator */}
                          <td style={{ padding: '0.75rem' }}>
                            {isDispatched ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                                  <Lock size={11} /> DISPATCHED &amp; SEALED
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#10b981' }}>
                                  Permanently Locked
                                </span>
                              </div>
                            ) : isReceived ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, background: 'rgba(52, 211, 153, 0.2)' }}>
                                  <CheckCircle2 size={11} /> RECEIVED AT HUB
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#34d399' }}>
                                  Handover Completed 🔒
                                </span>
                              </div>
                            ) : isApproved ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                                  <ShieldCheck size={11} /> ADMIN APPROVED
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#60a5fa' }}>
                                  Locked • Ready for Departure
                                </span>
                              </div>
                            ) : isPending ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                                  <AlertCircle size={11} /> Pending Approval
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#fbbf24' }}>
                                  Awaiting Super Admin Review
                                </span>
                              </div>
                            ) : isRejected ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                                  <XCircle size={11} /> REJECTED
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#fca5a5' }} title={m.rejectionReason}>
                                  Returned for correction
                                </span>
                              </div>
                            ) : (
                              <span className="badge badge-purple">Draft</span>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {/* View / Print Handover Sheet */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveManifest(m);
                                  setIsPrintPreviewOpen(true);
                                }}
                                className="btn btn-secondary btn-sm"
                                title="Inspect Manifest & View Consignments"
                              >
                                <Eye size={13} /> Inspect
                              </button>

                              {/* PENDING APPROVAL ACTIONS */}
                              {isPending && (
                                <>
                                  {/* Edit (if hub wants to tweak before approval) */}
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(m)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
                                    title="Edit Manifest Staging & Cargo"
                                  >
                                    <Edit3 size={13} /> Edit
                                  </button>

                                  {/* Approve Only (locks manifest) */}
                                  <button
                                    type="button"
                                    onClick={() => handleAdminApproveOnly(m.id)}
                                    className="btn btn-sm"
                                    style={{
                                      background: '#3b82f6',
                                      borderColor: '#2563eb',
                                      color: '#ffffff',
                                      fontWeight: 700
                                    }}
                                    title="Admin Approve Manifest (Lock from hub edits)"
                                  >
                                    <Check size={13} /> Approve
                                  </button>

                                  {/* Approve & Dispatch Modal */}
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDispatchModal(m)}
                                    className="btn btn-sm"
                                    style={{
                                      background: '#10b981',
                                      borderColor: '#059669',
                                      color: '#ffffff',
                                      fontWeight: 800,
                                      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)'
                                    }}
                                    title="Verify & Dispatch directly"
                                  >
                                    <Truck size={13} /> Dispatch
                                  </button>

                                  {/* Reject with Reason */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectModal(m)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                                    title="Reject Manifest with required correction notes"
                                  >
                                    <Ban size={13} /> Reject
                                  </button>
                                </>
                              )}

                              {/* APPROVED ACTIONS (Awaiting Departure) */}
                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDispatchModal(m)}
                                  className="btn btn-sm"
                                  style={{
                                    background: '#10b981',
                                    borderColor: '#059669',
                                    color: '#ffffff',
                                    fontWeight: 800,
                                  }}
                                  title="Confirm departure and seal vehicle"
                                >
                                  <Truck size={13} /> Confirm Dispatch 🔒
                                </button>
                              )}

                              {/* REJECTED ACTIONS (Hub can fix & resubmit) */}
                              {isRejected && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(m)}
                                  className="btn btn-primary btn-sm"
                                  style={{ background: '#f59e0b', borderColor: '#d97706', color: '#000000', fontWeight: 800 }}
                                  title="Fix discrepancies and resubmit"
                                >
                                  <Edit3 size={13} /> Fix &amp; Resubmit
                                </button>
                              )}

                              {/* DRAFT ACTIONS */}
                              {isDraft && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(m)}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    <Edit3 size={13} /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = updateBranchManifest({ ...m, status: 'Pending Approval' });
                                      if (res.success) {
                                        reloadData();
                                        setActionSuccessNotice(`✓ Manifest ${m.manifestNumber} submitted for Admin Approval.`);
                                        setTimeout(() => setActionSuccessNotice(null), 5000);
                                      }
                                    }}
                                    className="btn btn-primary btn-sm"
                                    style={{ background: '#a855f7', borderColor: '#9333ea' }}
                                  >
                                    <Send size={13} /> Submit
                                  </button>
                                </>
                              )}

                              {/* DISPATCHED ACTIONS */}
                              {isDispatched && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceiveModal(m)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}
                                  title="Receive this manifest at destination hub"
                                >
                                  <Inbox size={13} /> Receive
                                </button>
                              )}

                              {/* When Locked permanently */}
                              {(isDispatched || isReceived) && (
                                <div
                                  title="Locked: Handover records and container seals are permanently sealed."
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.35rem 0.55rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    cursor: 'not-allowed'
                                  }}
                                >
                                  <Lock size={11} color="#10b981" />
                                  <span>Locked</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: INCOMING HUB RECEIVING DESK ================= */}
        {activeTab === 'incoming_receiving' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Inbox size={20} color="#38bdf8" /> Destination Hub Receiving Desk: {branchOrigin}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Inspect incoming linehaul manifests arriving at <strong>{selectedHubCode}</strong>. Verify security seal, cross-check package count, and confirm receipt into local sorting.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-purple" style={{ fontWeight: 800 }}>
                  Dest Hub: {selectedHubCode}
                </span>
              </div>
            </div>

            {incomingManifests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <Inbox size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>No Incoming Linehaul Manifests</div>
                <p style={{ fontSize: '0.84rem', maxWidth: '440px', margin: '0.25rem auto 1rem auto' }}>
                  No manifests currently routed to {branchOrigin}. When another hub dispatches to {selectedHubCode}, it will appear here for arrival verification.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>Manifest # &amp; Dispatched</th>
                      <th style={{ padding: '0.75rem' }}>Origin Departure Hub</th>
                      <th style={{ padding: '0.75rem' }}>Vehicle, Driver &amp; Phone</th>
                      <th style={{ padding: '0.75rem' }}>Container Seal #</th>
                      <th style={{ padding: '0.75rem' }}>Manifested Cargo</th>
                      <th style={{ padding: '0.75rem' }}>Arrival Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Receiving Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingManifests.map((m) => {
                      const isArrived = m.status === 'Received';
                      const isEnRoute = m.status === 'Approved & Dispatched';

                      return (
                        <tr
                          key={m.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            backgroundColor: isEnRoute ? 'rgba(56, 189, 248, 0.03)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '0.75rem', fontWeight: 800, color: '#ffffff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <FileText size={15} color={isArrived ? '#34d399' : '#38bdf8'} />
                              <span>{m.manifestNumber}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Dispatched: {m.dispatchedAt ? new Date(m.dispatchedAt).toLocaleString() : 'Pending'}
                            </div>
                          </td>

                          <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                            <div style={{ fontWeight: 700, color: '#ffffff' }}>{m.branchOrigin}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hub Code: {m.branchCode}</div>
                          </td>

                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{m.linehaulVehicle}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {m.driverName} • {m.driverPhone}
                            </div>
                          </td>

                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              fontWeight: 800,
                              fontFamily: 'monospace'
                            }}>
                              <Lock size={11} /> #{m.sealNumber}
                            </span>
                          </td>

                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 700, color: '#ffffff' }}>
                              {m.totalShipments} Bookings • {m.totalPieces} Pkgs
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--brand-orange)' }}>
                              {m.totalWeightKg} KG Gross
                            </div>
                          </td>

                          <td style={{ padding: '0.75rem' }}>
                            {isArrived ? (
                              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                                <CheckCircle2 size={11} /> Received &amp; Inwarded
                              </span>
                            ) : isEnRoute ? (
                              <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                                <Truck size={11} /> Linehaul In Transit
                              </span>
                            ) : (
                              <span className="badge badge-amber">{m.status}</span>
                            )}
                          </td>

                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveManifest(m);
                                  setIsPrintPreviewOpen(true);
                                }}
                                className="btn btn-secondary btn-sm"
                              >
                                <Eye size={13} /> View
                              </button>

                              {isEnRoute ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceiveModal(m)}
                                  className="btn btn-sm"
                                  style={{
                                    background: '#0284c7',
                                    borderColor: '#0369a1',
                                    color: '#ffffff',
                                    fontWeight: 800
                                  }}
                                >
                                  <Inbox size={13} /> Receive Manifest
                                </button>
                              ) : isArrived ? (
                                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                                  ✓ Inwarded by {m.receivedBy || 'Desk'}
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: DISPATCHED SHIPMENTS SECTION ================= */}
        {activeTab === 'dispatched_shipments' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="var(--brand-orange)" /> Linehaul Transit Consignments ({dispatchedShipments.length})
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
                      <th style={{ padding: '0.75rem' }}>Origin &rarr; Destination</th>
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
                          <div style={{ fontWeight: 600 }}>{s.origin.city} &rarr; {s.destination.city}</div>
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
                          {s.telemetry?.transportVehicle || 'BA 2 KHA 8841 (Express E-Van)'}
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

        {/* ================= MODAL 1: ADMIN REJECTION REASON MODAL ================= */}
        {rejectModalManifest && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(3, 7, 18, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0d1527',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Reject Manifest &amp; Return to Hub
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>
                    {rejectModalManifest.manifestNumber} • {rejectModalManifest.branchOrigin}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Enter the reason for rejection (e.g. weight mismatch, missing invoice, incorrect driver assigned). The hub user will be notified to edit and resubmit.
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label" style={{ color: '#fca5a5' }}>
                  Rejection Reason / Required Corrections *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Booking D7-8821 has incorrect package weight. Please re-weigh before approval."
                  className="input-field"
                  style={{ width: '100%', resize: 'vertical' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRejectModalManifest(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="btn btn-primary"
                  style={{ background: '#ef4444', borderColor: '#dc2626', color: '#fff', fontWeight: 800 }}
                >
                  <Ban size={15} /> Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: CONFIRM DISPATCH & LOCK ================= */}
        {confirmDispatchModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#0d1527',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Confirm Dispatch &amp; Lock Manifest
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                    {confirmDispatchModal.manifestNumber}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Origin &rarr; Destination:</span>
                  <strong style={{ color: '#fff' }}>{confirmDispatchModal.branchCode} &rarr; {confirmDispatchModal.destinationCity}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Linehaul Vehicle:</span>
                  <strong style={{ color: '#fff' }}>{confirmDispatchModal.linehaulVehicle}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Driver / Carrier:</span>
                  <strong style={{ color: '#fff' }}>{confirmDispatchModal.driverName} ({confirmDispatchModal.driverPhone})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Security Container Seal:</span>
                  <strong style={{ color: 'var(--brand-cyan)' }}>#{confirmDispatchModal.sealNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Included Shipments:</span>
                  <strong style={{ color: '#34d399' }}>{confirmDispatchModal.totalShipments} Bookings ({confirmDispatchModal.totalWeightKg} KG)</strong>
                </div>
              </div>

              {/* Security Lock Notice */}
              <div style={{
                padding: '0.85rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.82rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.5rem'
              }}>
                <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>IMMUTABILITY WARNING:</strong> Once verified and approved for dispatch, this manifest will be <strong>PERMANENTLY LOCKED</strong>. No further edits, parcel additions, or deletions will be permitted.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setConfirmDispatchModal(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteApprovalAndDispatch(confirmDispatchModal.id)}
                  className="btn btn-primary"
                  style={{ background: '#10b981', borderColor: '#059669', color: '#fff', fontWeight: 800 }}
                >
                  <Check size={16} /> Yes, Approve &amp; Lock Dispatch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 3: DESTINATION HUB RECEIVING MODAL ================= */}
        {receivingModalManifest && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(3, 7, 18, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#0d1527',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Inbox size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Confirm Manifest Arrival &amp; Inward
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>
                    {receivingModalManifest.manifestNumber} • From: {receivingModalManifest.branchCode}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Arriving Vehicle:</span>
                  <strong style={{ color: '#fff' }}>{receivingModalManifest.linehaulVehicle}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Driver:</span>
                  <strong style={{ color: '#fff' }}>{receivingModalManifest.driverName} ({receivingModalManifest.driverPhone})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Container Seal Verified:</span>
                  <strong style={{ color: 'var(--brand-cyan)' }}>#{receivingModalManifest.sealNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Consignments:</span>
                  <strong style={{ color: '#34d399' }}>
                    {receivingModalManifest.totalShipments} Bookings ({receivingModalManifest.totalPieces} Packages)
                  </strong>
                </div>
              </div>

              {/* Package Verification Count */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">
                  Received Packages Count (Expected: {receivingModalManifest.totalPieces})
                </label>
                <input
                  type="number"
                  value={receivedPackagesCount}
                  onChange={(e) => setReceivedPackagesCount(Number(e.target.value))}
                  className="input-field"
                  style={{ fontWeight: 800, color: '#38bdf8' }}
                />
              </div>

              {/* Remarks / Discrepancy */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Receiving Remarks / Discrepancy Notes</label>
                <input
                  type="text"
                  value={receivingRemarks}
                  onChange={(e) => setReceivingRemarks(e.target.value)}
                  placeholder="e.g. All packages intact, seal verified, inwarded to sorting area"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setReceivingModalManifest(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReceive}
                  className="btn btn-primary"
                  style={{ background: '#0284c7', borderColor: '#0369a1', color: '#fff', fontWeight: 800 }}
                >
                  <CheckCircle2 size={16} /> Confirm Receipt &amp; Inward Consignments
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 4: PRINTABLE OFFICIAL MANIFEST & AUDIT TRAIL ================= */}
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
              maxWidth: '920px',
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
                  <div className="badge badge-purple" style={{ fontWeight: 800 }}>
                    <FileText size={12} /> {activeManifest.manifestNumber}
                  </div>
                  {activeManifest.status === 'Approved & Dispatched' || activeManifest.isLocked ? (
                    <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                      <Lock size={12} /> Verified &amp; Locked
                    </span>
                  ) : activeManifest.status === 'Received' ? (
                    <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                      <CheckCircle2 size={12} /> Received at Destination
                    </span>
                  ) : activeManifest.status === 'Approved' ? (
                    <span className="badge badge-blue" style={{ fontWeight: 700, color: '#60a5fa' }}>
                      <ShieldCheck size={12} /> Admin Approved
                    </span>
                  ) : activeManifest.status === 'Rejected' ? (
                    <span className="badge badge-red" style={{ fontWeight: 800, color: '#f87171' }}>
                      <XCircle size={12} /> Rejected
                    </span>
                  ) : (
                    <span className="badge badge-amber" style={{ fontWeight: 700 }}>
                      {activeManifest.status}
                    </span>
                  )}
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

                  {/* APPROVE BUTTON (If pending) */}
                  {(activeManifest.status === 'Pending Approval' || activeManifest.status === 'Draft' || activeManifest.status === 'Printed') && (
                    <button
                      type="button"
                      onClick={() => setConfirmDispatchModal(activeManifest)}
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
                      <Check size={15} /> Approve &amp; Dispatch
                    </button>
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

              {/* Audit Trail Timeline Drawer in Header */}
              {activeManifest.history && activeManifest.history.length > 0 && (
                <div style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#c084fc', marginBottom: '0.5rem' }}>
                    <ClipboardList size={14} /> OFFICIAL CHAIN OF CUSTODY AUDIT TRAIL:
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                    {activeManifest.history.map((entry, idx) => (
                      <div
                        key={idx}
                        style={{
                          flexShrink: 0,
                          padding: '0.4rem 0.65rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          maxWidth: '240px'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle2 size={12} color="#34d399" />
                          <span>{entry.action}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          By: {entry.actor} • {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {entry.notes && (
                          <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Printable Document Paper */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '2rem',
                backgroundColor: '#ffffff',
                color: '#000000',
              }}>
                <div id="printable-manifest-sheet" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {/* Lock Banner in Print Preview if Locked */}
                  {(activeManifest.status === 'Approved & Dispatched' || activeManifest.isLocked) && (
                    <div style={{
                      backgroundColor: '#ecfdf5',
                      border: '1.5px solid #10b981',
                      borderRadius: '8px',
                      padding: '0.65rem 1rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: '#065f46',
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={16} />
                        <strong>OFFICIAL RECORD: VERIFIED &amp; LOCKED FOR DISPATCH</strong>
                      </div>
                      <div>
                        Verified by: <strong>{activeManifest.approvedBy || 'Operations Admin'}</strong> at {new Date(activeManifest.approvedAt || activeManifest.dispatchedAt || '').toLocaleString()}
                      </div>
                    </div>
                  )}

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
                          Official Linehaul Dispatch &amp; Gateway Handover Manifest
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
                    <div><strong>Dispatched / Approved By:</strong> {activeManifest.approvedBy || activeManifest.dispatchedBy || 'Authorized Officer'}</div>
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
                      <div style={{ fontSize: '0.68rem', color: '#666666' }}>Piece Count &amp; Verification</div>
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
