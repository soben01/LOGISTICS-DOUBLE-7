'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ExternalLink,
  Printer,
  Copy,
  Check,
  MapPin,
  Calendar,
  User as UserIcon,
  Truck,
  Banknote,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Lock,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, loginAsDemo, User } from '../../lib/auth';
import {
  getAllCombinedBookings,
  updateShipmentStatus,
  Shipment
} from '../../lib/store';
import PrintableLabel from '../../components/shipping/PrintableLabel';
import {
  getTrackingWorkflow,
  getNextWorkflowStage,
  calculateWorkflowProgress,
  WorkflowStage
} from '../../lib/workflow';

export default function AllBookingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printingShipment, setPrintingShipment] = useState<Shipment | null>(null);
  const [bulkPrintingShipments, setBulkPrintingShipments] = useState<Shipment[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const router = useRouter();

  // Quick edit status modal state
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<Shipment['status']>('In Transit');
  const [newLocation, setNewLocation] = useState('');
  const [newNote, setNewNote] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    const data = await getAllCombinedBookings();
    setShipments(data);
    setLoading(false);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login?redirect=/bookings');
      return;
    }
    setCurrentUser(user);
    setAuthChecking(false);
    loadBookings();

    const handleAuth = () => {
      const u = getCurrentUser();
      if (!u) {
        router.push('/login?redirect=/bookings');
      } else {
        setCurrentUser(u);
      }
    };
    window.addEventListener('auth-change', handleAuth);
    return () => window.removeEventListener('auth-change', handleAuth);
  }, [router]);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenEdit = (s: Shipment) => {
    setEditingShipment(s);
    setNewStatus(s.status);
    setNewLocation(s.destination.city);
    setNewNote(`Scanned and verified at ${s.destination.city} hub.`);
    setUpdateSuccess(false);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    const updated = updateShipmentStatus(editingShipment.id, newStatus, newLocation, newNote);
    if (updated) {
      setUpdateSuccess(true);
      loadBookings();
      setTimeout(() => {
        setEditingShipment(null);
        setUpdateSuccess(false);
      }, 1000);
    }
  };

  const handleLabelsPrinted = (ids: string[]) => {
    ids.forEach(id => {
      updateShipmentStatus(id, 'Label Generated', undefined, 'Shipping label generated and ready for hub dispatch');
    });
    loadBookings();
    setPrintFeedback(`✓ Shipping label printed! Status automatically updated to "Label Generated" for ${ids.length} consignment(s).`);
    setTimeout(() => setPrintFeedback(null), 6000);
  };

  const handleBulkMarkLabelGenerated = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    ids.forEach(id => {
      updateShipmentStatus(id, 'Label Generated', undefined, 'Batch status update to Label Generated');
    });
    loadBookings();
    setSelectedIds(new Set());
    setPrintFeedback(`✓ Marked ${ids.length} selected consignment(s) as "Label Generated".`);
    setTimeout(() => setPrintFeedback(null), 6000);
  };

  const handleExportSelectedCSV = () => {
    const selectedShipments = shipments.filter(s => selectedIds.has(s.id));
    if (selectedShipments.length === 0) return;
    const headers = ['AWB_ID', 'Date', 'Origin_City', 'Destination_City', 'Consignee_Name', 'Consignee_Phone', 'Pieces', 'Weight_KG', 'Service', 'Status', 'Declared_Value_NPR'];
    const rows = selectedShipments.map(s => [
      s.id,
      s.checkpoints[0]?.timestamp || '2026-08-27',
      s.origin.city,
      s.destination.city,
      `"${s.recipient.name.replace(/"/g, '""')}"`,
      `"${s.recipient.phone}"`,
      s.cargo.pieces,
      s.cargo.weightKg,
      s.service,
      s.status,
      s.cargo.declaredValueNpr || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Double7_Selected_${selectedShipments.length}_Manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (shipments.length === 0) return;
    const headers = ['AWB_ID', 'Date', 'Origin_City', 'Destination_City', 'Consignee_Name', 'Consignee_Phone', 'Pieces', 'Weight_KG', 'Service', 'Status', 'Declared_Value_NPR'];
    const rows = filteredShipments.map(s => [
      s.id,
      s.checkpoints[0]?.timestamp || '2026-08-27',
      s.origin.city,
      s.destination.city,
      `"${s.recipient.name.replace(/"/g, '""')}"`,
      `"${s.recipient.phone}"`,
      s.cargo.pieces,
      s.cargo.weightKg,
      s.service,
      s.status,
      s.cargo.declaredValueNpr || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Double7_Bookings_Manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredShipments = shipments.filter(s => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipient.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sender.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.origin.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cargo.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status.toUpperCase() === statusFilter.toUpperCase();
    const matchesHub = hubFilter === 'ALL' || s.destination.city.toUpperCase() === hubFilter.toUpperCase() || s.origin.city.toUpperCase() === hubFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesHub;
  });

  const getStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'Label Generated':
        return <span className="badge badge-purple">Label Generated</span>;
      case 'Shipment Dispatched':
        return <span className="badge badge-orange" style={{ background: 'rgba(255, 102, 0, 0.22)', borderColor: 'var(--brand-orange)', color: '#ffedd5' }}>Shipment Dispatched</span>;
      case 'Origin Hub Inwarded':
        return <span className="badge badge-cyan">Hub Inwarded</span>;
      case 'Courier Assigned':
        return <span className="badge badge-subtle" style={{ color: '#93c5fd', borderColor: '#3b82f6' }}>Courier Assigned</span>;
      case 'Regional Sort Complete':
        return <span className="badge badge-cyan">Sort Complete</span>;
      case 'Delivered':
        return <span className="badge badge-emerald">Delivered</span>;
      case 'Out for Delivery':
        return <span className="badge badge-amber">Out for Delivery</span>;
      case 'In Transit':
        return <span className="badge badge-orange">In Transit</span>;
      case 'Customs Cleared':
        return <span className="badge badge-cyan">Customs Cleared</span>;
      case 'Pending Pickup':
        return <span className="badge badge-subtle">Pending Pickup</span>;
      default:
        return <span className="badge badge-subtle">{status}</span>;
    }
  };

  if (authChecking) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255, 102, 0, 0.15)', border: '1px solid rgba(255, 102, 0, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange)' }}>
          <Boxes size={24} className="animate-pulse" />
        </div>
        <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Loading Consignment Registry...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0 6rem 0' }}>
      <div className="container">
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div className="badge badge-orange" style={{ marginBottom: '0.4rem', fontSize: '0.72rem' }}>
              <Boxes size={13} /> {currentUser ? (currentUser.role === 'admin' ? 'Nationwide Consignment Records' : 'Merchant Consignment Ledger') : 'Central Consignment Registry'}
            </div>
            <h1 style={{ margin: 0, fontSize: '2.1rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
              {currentUser ? (currentUser.role === 'admin' ? 'All Bookings Registry' : 'My Bookings Registry') : 'All Bookings Registry'}
            </h1>
            <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              {currentUser
                ? (currentUser.role === 'admin'
                  ? 'Complete centralized booking records from Cloudflare D1 & merchant dispatches across all 77 districts.'
                  : `Active booking manifests, delivery dispatches, and AWB labels for ${currentUser.company}.`)
                : 'Centralized registry database of all consignments, delivery waybills, and dispatch manifests across Nepal.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={loadBookings}
              className="btn btn-secondary btn-sm"
              title="Reload from Cloudflare D1 Database"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh ({shipments.length})</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="btn btn-outline btn-sm"
              title="Download CSV Manifest"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <Link href="/book" className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>New Consignment</span>
            </Link>
          </div>
        </div>

        {/* Search & Filtering Controls */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by AWB #, Consignee, Sender, City, Phone or Cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.3rem', fontSize: '0.85rem' }}
              />
            </div>

            {/* Hub Selector */}
            <div style={{ minWidth: '180px' }}>
              <select
                value={hubFilter}
                onChange={(e) => setHubFilter(e.target.value)}
                className="select-field"
                style={{ fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
              >
                <option value="ALL">All Hubs (Nationwide)</option>
                <option value="Kathmandu">Kathmandu Mega-Hub</option>
                <option value="Pokhara">Pokhara Hub</option>
                <option value="Birgunj">Birgunj Gateway</option>
                <option value="Biratnagar">Biratnagar Hub</option>
                <option value="Chitwan">Chitwan Central</option>
                <option value="Butwal">Butwal / Bhairahawa</option>
                <option value="Dharan">Dharan / Itahari</option>
                <option value="Nepalgunj">Nepalgunj</option>
              </select>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            {[
              { id: 'ALL', label: 'All Bookings', count: shipments.length },
              { id: 'LABEL GENERATED', label: 'Label Generated', count: shipments.filter(s => s.status === 'Label Generated').length },
              { id: 'SHIPMENT DISPATCHED', label: 'Shipment Dispatched', count: shipments.filter(s => s.status === 'Shipment Dispatched').length },
              { id: 'IN TRANSIT', label: 'In Transit', count: shipments.filter(s => s.status === 'In Transit').length },
              { id: 'OUT FOR DELIVERY', label: 'Out for Delivery', count: shipments.filter(s => s.status === 'Out for Delivery').length },
              { id: 'DELIVERED', label: 'Delivered', count: shipments.filter(s => s.status === 'Delivered').length },
              { id: 'PENDING PICKUP', label: 'Pending Pickup', count: shipments.filter(s => s.status === 'Pending Pickup').length },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className="preset-chip"
                style={{
                  background: statusFilter === tab.id ? 'rgba(255, 102, 0, 0.2)' : undefined,
                  borderColor: statusFilter === tab.id ? 'var(--brand-orange)' : undefined,
                  color: statusFilter === tab.id ? '#ffffff' : undefined,
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem'
                }}
              >
                {tab.label} <span style={{ opacity: 0.7, fontFamily: 'var(--font-mono)' }}>({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Print Feedback Notification */}
        {printFeedback && (
          <div style={{
            background: 'rgba(168, 85, 247, 0.16)',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            color: '#f3e8ff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            boxShadow: '0 8px 24px rgba(168, 85, 247, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle2 size={18} color="#c084fc" />
              <span>{printFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setPrintFeedback(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#d8b4fe',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Bulk Selection Actions Floating Toolbar */}
        {selectedIds.size > 0 && (
          <div style={{
            position: 'sticky',
            top: '76px',
            zIndex: 40,
            background: 'linear-gradient(135deg, rgba(16, 25, 46, 0.98), rgba(10, 15, 29, 0.98))',
            border: '1px solid rgba(255, 102, 0, 0.5)',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: 'rgba(255, 102, 0, 0.22)',
                color: 'var(--brand-orange)',
                fontWeight: 800,
                fontSize: '0.82rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                border: '1px solid rgba(255, 102, 0, 0.4)'
              }}>
                <Check size={14} />
                <span>{selectedIds.size} Selected</span>
              </div>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Batch warehouse actions ready
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const selectedList = shipments.filter(s => selectedIds.has(s.id));
                  setBulkPrintingShipments(selectedList);
                }}
                className="btn btn-primary btn-sm"
                style={{
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 1.1rem',
                  boxShadow: '0 4px 14px rgba(255, 102, 0, 0.35)'
                }}
              >
                <Printer size={15} />
                <span>Bulk Print Labels ({selectedIds.size})</span>
              </button>

              <button
                type="button"
                onClick={handleBulkMarkLabelGenerated}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
                title="Mark all selected consignments as Label Generated"
              >
                <CheckCircle2 size={14} color="#c084fc" />
                <span>Mark as Label Generated</span>
              </button>

              <button
                type="button"
                onClick={handleExportSelectedCSV}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                title="Export selected rows as CSV Manifest"
              >
                <Download size={14} />
                <span>Export Selected</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', opacity: 0.8 }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Bookings Data Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '1rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Showing <strong>{filteredShipments.length}</strong> of <strong>{shipments.length}</strong> total bookings
              {selectedIds.size > 0 && <span style={{ color: 'var(--brand-orange)', marginLeft: '0.5rem' }}>&bull; {selectedIds.size} selected</span>}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sorted by latest booking date
            </div>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ width: '42px', padding: '0.85rem 0.5rem 0.85rem 1rem', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      aria-label="Select all consignments in view"
                      checked={filteredShipments.length > 0 && filteredShipments.every(s => selectedIds.has(s.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const next = new Set(selectedIds);
                          filteredShipments.forEach(s => next.add(s.id));
                          setSelectedIds(next);
                        } else {
                          const next = new Set(selectedIds);
                          filteredShipments.forEach(s => next.delete(s.id));
                          setSelectedIds(next);
                        }
                      }}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--brand-orange)' }}
                    />
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>AWB / Consignment ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Origin &rarr; Destination Hub</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Consignee (Recipient)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Shipper (Consignor)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Cargo Specs</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Boxes size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                      <div style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600 }}>No bookings match your filter criteria</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing your search query or selecting "All Bookings".</div>
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((s) => (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background var(--transition-fast)',
                        background: selectedIds.has(s.id) ? 'rgba(255, 102, 0, 0.07)' : undefined
                      }}
                      className="table-row-hover"
                    >
                      {/* Checkbox */}
                      <td style={{ width: '42px', padding: '0.85rem 0.5rem 0.85rem 1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <input
                          type="checkbox"
                          aria-label={`Select consignment ${s.id}`}
                          checked={selectedIds.has(s.id)}
                          onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(s.id)) {
                              next.delete(s.id);
                            } else {
                              next.add(s.id);
                            }
                            setSelectedIds(next);
                          }}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--brand-orange)' }}
                        />
                      </td>

                      {/* AWB # */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Link
                            href={`/track?id=${encodeURIComponent(s.id)}`}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: 'var(--brand-orange)',
                              textDecoration: 'none'
                            }}
                          >
                            {s.id}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(s.id)}
                            title="Copy AWB #"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedId === s.id ? 'var(--brand-emerald)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.2rem',
                              display: 'flex'
                            }}
                          >
                            {copiedId === s.id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {s.checkpoints[0]?.timestamp || '2026-08-27'}
                        </div>
                      </td>

                      {/* Origin -> Destination */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{s.origin.city}</span>
                          <span style={{ color: 'var(--brand-orange)' }}>&rarr;</span>
                          <span>{s.destination.city}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {s.destination.hub}
                        </div>
                      </td>

                      {/* Consignee */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>
                          {s.recipient.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {s.recipient.phone}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.recipient.address}
                        </div>
                      </td>

                      {/* Consignor */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>
                          {s.sender.company}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {s.sender.name}
                        </div>
                      </td>

                      {/* Cargo Details */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                          {s.cargo.weightKg} KG &bull; {s.cargo.pieces} Colli
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.cargo.description}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        {getStatusBadge(s.status)}
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/track?id=${encodeURIComponent(s.id)}`}
                            className="btn btn-secondary btn-sm"
                            title="Live Tracking View"
                            style={{ padding: '0.35rem 0.55rem' }}
                          >
                            <ExternalLink size={13} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setPrintingShipment(s)}
                            className="btn btn-outline btn-sm"
                            title="Print Consignment AWB Label"
                            style={{ padding: '0.35rem 0.55rem' }}
                          >
                            <Printer size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="btn btn-secondary btn-sm"
                            title="Update Status"
                            style={{ padding: '0.35rem 0.55rem' }}
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Update Modal */}
        {editingShipment && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)'
          }}>
            <div className="card" style={{ width: '90%', maxWidth: '480px', padding: '1.75rem' }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#ffffff' }}>
                Update Booking Status: {editingShipment.id}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Consignee: {editingShipment.recipient.name} ({editingShipment.destination.city})
              </p>

              {/* Step-by-Step Workflow Guidance */}
              {(() => {
                const workflow = getTrackingWorkflow();
                const prog = calculateWorkflowProgress(editingShipment.status, workflow);
                const next = getNextWorkflowStage(editingShipment.status, workflow);

                return (
                  <div style={{
                    marginBottom: '1.25rem',
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                        Workflow Step {prog.currentStageIndex + 1} of {prog.activeStages.length}
                      </span>
                      <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                        Current: {prog.currentStage?.label || editingShipment.status}
                      </span>
                    </div>

                    {next ? (
                      <div style={{
                        marginTop: '0.6rem',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next Sequential Stage:</div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#c084fc' }}>
                            #{next.order} {next.label}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setNewStatus(next.key as any);
                            setNewNote(`Step-by-step workflow progression to ${next.label}`);
                            if (!newLocation) setNewLocation(editingShipment.destination.city);
                          }}
                          className="btn btn-sm"
                          style={{
                            background: '#a855f7',
                            borderColor: '#9333ea',
                            color: '#ffffff',
                            fontWeight: 700,
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem'
                          }}
                        >
                          ⏩ Set Next Stage
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.4rem', fontWeight: 600 }}>
                        ✓ Final Terminal Milestone Reached (Delivered).
                      </div>
                    )}
                  </div>
                );
              })()}

              {updateSuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem'
                }}>
                  Status successfully updated in system!
                </div>
              )}

              <form onSubmit={handleSaveStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Select Workflow Stage *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as Shipment['status'])}
                    className="select-field"
                  >
                    {getTrackingWorkflow().map(stg => (
                      <option key={stg.id} value={stg.key}>
                        #{stg.order} {stg.label} ({stg.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Current Location / Hub *</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Pokhara Regional Hub"
                    required
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Checkpoint Note / Event Description</label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Scanned into sorting facility"
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    Save Checkpoint
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingShipment(null)}
                    className="btn btn-outline btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Single Printable Label Modal */}
        {printingShipment && (
          <PrintableLabel
            shipment={printingShipment}
            onClose={() => setPrintingShipment(null)}
            onPrinted={handleLabelsPrinted}
          />
        )}

        {/* Bulk Printable Labels Modal */}
        {bulkPrintingShipments && bulkPrintingShipments.length > 0 && (
          <PrintableLabel
            shipments={bulkPrintingShipments}
            onClose={() => setBulkPrintingShipments(null)}
            onPrinted={handleLabelsPrinted}
          />
        )}
      </div>

      <style jsx global>{`
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
      `}</style>
    </div>
  );
}
