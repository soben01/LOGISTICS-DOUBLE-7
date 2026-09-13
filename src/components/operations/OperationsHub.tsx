'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Menu,
  Home,
  Search,
  Plus,
  FileText,
  Laptop,
  Building,
  Calendar,
  Truck,
  Printer,
  ExternalLink,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Scale,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Boxes,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getAllCombinedBookings, Shipment, updateShipmentStatus } from '../../lib/store';
import { getCurrentUser, User } from '../../lib/auth';
import PrintableLabel from '../shipping/PrintableLabel';
import ReceptionIntakeModal from './ReceptionIntakeModal';
import BranchInwardModal from './BranchInwardModal';
import LastmileRunsheetModal from './LastmileRunsheetModal';
import { exportShipmentsToExcel } from '../../lib/excelImport';

type OperationsMode = 'all_bookings' | 'reception' | 'branch' | 'lastmile';

export default function OperationsHub() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeMode, setActiveMode] = useState<OperationsMode>('all_bookings');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeBranch, setActiveBranch] = useState('ALL');
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals state
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showBranchInwardModal, setShowBranchInwardModal] = useState(false);
  const [showLastmileModal, setShowLastmileModal] = useState(false);
  const [printingShipment, setPrintingShipment] = useState<Shipment | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getAllCombinedBookings();
    setShipments(data);
    setLoading(false);
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadData();

    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('shipments-updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('shipments-updated', handleStorage);
    };
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered shipments based on active mode, search, branch, and status
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchAwb = s.id?.toLowerCase().includes(q);
        const matchBooking = s.bookingNo?.toLowerCase().includes(q);
        const matchWaybill = s.telemetry?.waybillNumber?.toLowerCase().includes(q);
        const matchRecipient = s.recipient?.name?.toLowerCase().includes(q);
        const matchPhone = s.recipient?.phone?.includes(q);
        const matchCity = s.destination?.city?.toLowerCase().includes(q) || s.origin?.city?.toLowerCase().includes(q);
        if (!matchAwb && !matchBooking && !matchWaybill && !matchRecipient && !matchPhone && !matchCity) {
          return false;
        }
      }

      // 2. Branch Hub Filter
      if (activeBranch !== 'ALL') {
        const matchHub = s.origin.city.toUpperCase().includes(activeBranch.toUpperCase()) ||
                         s.destination.city.toUpperCase().includes(activeBranch.toUpperCase());
        if (!matchHub) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'BOOKED' && s.status !== 'Order Placed' && s.status !== 'Pending Pickup') return false;
        if (statusFilter === 'INWARDED' && s.status !== 'Origin Hub Inwarded' && s.status !== 'Hub Received') return false;
        if (statusFilter === 'TRANSIT' && s.status !== 'In Transit' && s.status !== 'Shipment Dispatched') return false;
        if (statusFilter === 'OUT_FOR_DELIVERY' && s.status !== 'Out for Delivery') return false;
        if (statusFilter === 'DELIVERED' && s.status !== 'Delivered') return false;
      }

      // 4. Role Mode specific views
      if (activeMode === 'reception') {
        // Reception sees recent counter bookings, unmanifested
        return true;
      }
      if (activeMode === 'branch') {
        // Branch focuses on Hub Received, Inwarded, Dispatched
        return s.status === 'Origin Hub Inwarded' || s.status === 'Hub Received' || s.status === 'In Transit' || s.status === 'Order Placed';
      }
      if (activeMode === 'lastmile') {
        // Lastmile focuses on destination hub and out for delivery
        return s.status === 'Out for Delivery' || s.status === 'Hub Received' || s.status === 'Delivered';
      }

      return true;
    });
  }, [shipments, searchTerm, activeBranch, statusFilter, activeMode]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShipments.slice(start, start + pageSize);
  }, [filteredShipments, currentPage, pageSize]);

  const handleExportExcel = () => {
    exportShipmentsToExcel(filteredShipments, `double7_operations_${activeMode}_${new Date().toISOString().split('T')[0]}.xlsx`);
    notify('✓ Operational spreadsheet downloaded.');
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Delivered':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Out for Delivery':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'In Transit':
      case 'Shipment Dispatched':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' };
      case 'Origin Hub Inwarded':
      case 'Hub Received':
        return { bg: 'rgba(14, 165, 233, 0.15)', text: '#0ea5e9', border: 'rgba(14, 165, 233, 0.3)' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    }
  };

  const getModeTitleAndSubtitle = () => {
    switch (activeMode) {
      case 'reception':
        return {
          title: 'Reception Counter Desk',
          subtitle: 'Direct walk-in customer bookings, AWB sequencing, and counter intake.',
          icon: Laptop
        };
      case 'branch':
        return {
          title: 'Branch Hub Operations',
          subtitle: 'Incoming bag scans, hub sorting, cage transfers, and dispatch manifests.',
          icon: Building
        };
      case 'lastmile':
        return {
          title: 'Lastmile Delivery Runsheet',
          subtitle: 'Courier dispatch runsheets, delivery tracking, and digital Proof of Delivery (POD).',
          icon: Truck
        };
      default:
        return {
          title: 'All Bookings',
          subtitle: 'View and manage all courier & cargo entries across Nepal network hubs.',
          icon: Truck
        };
    }
  };

  const currentModeInfo = getModeTitleAndSubtitle();
  const HeroIcon = currentModeInfo.icon;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)'
    }}>
      {/* ========================================================================= */}
      {/* 1. EMERALD GREEN VERTICAL OPERATIONS SIDEBAR (Matching Reference UI) */}
      {/* ========================================================================= */}
      <aside style={{
        width: '68px',
        backgroundColor: '#1b4d3e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.25rem 0.5rem',
        gap: '1.25rem',
        boxShadow: '3px 0 15px rgba(0, 0, 0, 0.08)',
        zIndex: 40,
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        {/* Top Logo Emblem */}
        <Link
          href="/"
          title="Double 7 Logistics Home"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            border: '2px solid #2d6a4f',
            textDecoration: 'none',
            fontSize: '1.15rem'
          }}
        >
          🦅
        </Link>

        {/* Quick Add / New Booking Pill Button (White Rounded Button from Screenshot) */}
        <button
          onClick={() => setShowReceptionModal(true)}
          title="New Reception Counter Booking (+)"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            color: '#1b4d3e',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={22} strokeWidth={3} />
        </button>

        {/* Navigation Mode Icons Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', alignItems: 'center', marginTop: '0.5rem' }}>
          {/* All Bookings */}
          <button
            onClick={() => setActiveMode('all_bookings')}
            title="All Bookings (Master Directory)"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: activeMode === 'all_bookings' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: '#ffffff',
              border: activeMode === 'all_bookings' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <FileText size={20} />
          </button>

          {/* Reception Counter */}
          <button
            onClick={() => setActiveMode('reception')}
            title="Reception Counter Desk"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: activeMode === 'reception' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: '#ffffff',
              border: activeMode === 'reception' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <Laptop size={20} />
          </button>

          {/* Branch Hub Inward/Outward */}
          <button
            onClick={() => setActiveMode('branch')}
            title="Branch Hub Operations & Inward"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: activeMode === 'branch' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: '#ffffff',
              border: activeMode === 'branch' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <Building size={20} />
          </button>

          {/* Lastmile Rider Runsheet */}
          <button
            onClick={() => setActiveMode('lastmile')}
            title="Lastmile Delivery Runsheets & POD"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: activeMode === 'lastmile' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: '#ffffff',
              border: activeMode === 'lastmile' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <Calendar size={20} />
          </button>
        </div>

        {/* Bottom Home / Logout */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <Link
            href="/dashboard"
            title="Live Operations Dashboard"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
          >
            <Layers size={18} />
          </Link>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN OPERATIONS WORKSPACE */}
      {/* ========================================================================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Control Bar (Navbar from Screenshot: ☰, 🏠, Search bookings...) */}
        <header style={{
          height: '60px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          {/* Left: Hamburger, Home, Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '640px' }}>
            <button
              type="button"
              onClick={() => {}}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}
            >
              <Menu size={20} />
            </button>

            <Link
              href="/"
              style={{ color: '#64748b', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
              title="Home"
            >
              <Home size={19} />
            </Link>

            {/* Search bookings... input from screenshot */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              width: '100%',
              maxWidth: '380px',
              gap: '0.5rem'
            }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search bookings..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.85rem',
                  color: '#1e293b',
                  width: '100%'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right: Branch Selector & User Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Hub Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#475569' }}>
              <MapPin size={15} color="#1b4d3e" />
              <select
                value={activeBranch}
                onChange={e => { setActiveBranch(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#1b4d3e',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Nepal Hubs</option>
                <option value="Kathmandu">Kathmandu Mega-Hub</option>
                <option value="Pokhara">Pokhara Hub (PKR)</option>
                <option value="Biratnagar">Biratnagar Hub (BRT)</option>
                <option value="Birgunj">Birgunj Gateway (BRG)</option>
                <option value="Chitwan">Chitwan Central (CHT)</option>
                <option value="Butwal">Butwal Western (BTW)</option>
              </select>
            </div>

            {/* Role / User Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46' }}>
                {currentUser?.name || 'Operations Controller'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Notification Alert */}
          {notification && (
            <div style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              <CheckCircle2 size={16} />
              <span>{notification}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. PATTERNED GREEN HERO HEADER CARD (Matching Reference Image) */}
          {/* ========================================================================= */}
          <div style={{
            borderRadius: '16px',
            backgroundColor: '#23604f',
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.12) 1px, #23604f 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
            padding: '1.75rem 2rem',
            color: '#ffffff',
            boxShadow: '0 4px 20px rgba(27, 77, 62, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)'
              }}>
                <HeroIcon size={30} color="#ffffff" />
              </div>

              <div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                  {currentModeInfo.title}
                </h1>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                  {currentModeInfo.subtitle}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons on Hero */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowReceptionModal(true)}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#1b4d3e',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <Plus size={16} strokeWidth={3} />
                <span>+ Counter Intake</span>
              </button>

              <button
                onClick={() => setShowBranchInwardModal(true)}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Building size={16} />
                <span>Branch Inward</span>
              </button>

              <button
                onClick={() => setShowLastmileModal(true)}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Truck size={16} />
                <span>Rider Runsheet</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. DATA CONTROLS & FILTER BAR ("Show 100 entries" from Screenshot) */}
          {/* ========================================================================= */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            {/* Left: Show [ 100 ] entries (Exactly like reference image) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#475569' }}>
              <span>Show</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#1b4d3e',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
              <span>entries</span>
            </div>

            {/* Middle: Filter Status Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All (${shipments.length})` },
                { id: 'BOOKED', label: 'Booked' },
                { id: 'INWARDED', label: 'Hub Inward' },
                { id: 'TRANSIT', label: 'In Transit' },
                { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
                { id: 'DELIVERED', label: 'Delivered' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => { setStatusFilter(f.id); setCurrentPage(1); }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: statusFilter === f.id ? '1.5px solid #1b4d3e' : '1px solid #e2e8f0',
                    backgroundColor: statusFilter === f.id ? '#1b4d3e' : '#f8fafc',
                    color: statusFilter === f.id ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Right: Tools & Export */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={loadData}
                disabled={loading}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#475569', borderColor: '#cbd5e1' }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#1b4d3e', borderColor: '#1b4d3e', fontWeight: 700 }}
              >
                <Download size={14} />
                <span>Export (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. CLEAN AWB OPERATIONS TABLE (Matching Reference Image) */}
          {/* ========================================================================= */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '2px solid #e2e8f0',
                    color: '#1b4d3e',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800 }}>AWB</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>Date / Route</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>Consignee &amp; Phone</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>Service / Weight</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 800, textAlign: 'right' }}>COD Due</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                        <div>Loading operational waybills...</div>
                      </td>
                    </tr>
                  ) : paginatedShipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>No Bookings Found</div>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '420px', margin: '0.35rem auto 1.25rem auto' }}>
                          There are currently 0 consignments matching this filter. Use <strong>+ Counter Intake</strong> to register a new parcel.
                        </p>
                        <button
                          onClick={() => setShowReceptionModal(true)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            backgroundColor: '#1b4d3e',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.82rem'
                          }}
                        >
                          + New Reception Intake
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedShipments.map(s => {
                      const badge = getStatusBadgeStyle(s.status);
                      return (
                        <tr
                          key={s.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {/* AWB (Bold style matching reference screenshot: VIP016279, BCC026276, etc.) */}
                          <td style={{ padding: '0.9rem 1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                color: '#0f172a',
                                fontSize: '0.95rem',
                                letterSpacing: '0.02em'
                              }}>
                                {s.id}
                              </span>
                              <Link
                                href={`/track?id=${encodeURIComponent(s.id)}`}
                                title="Public Live Tracking Page"
                                target="_blank"
                                style={{ color: '#94a3b8', textDecoration: 'none' }}
                              >
                                <ExternalLink size={13} />
                              </Link>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                              {s.sender.company || s.sender.name}
                            </div>
                          </td>

                          {/* Route & Date */}
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{s.origin.city}</span>
                              <ArrowRight size={12} color="#94a3b8" />
                              <span>{s.destination.city}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                              {s.checkpoints?.[0]?.timestamp ? s.checkpoints[0].timestamp.split(',')[0] : 'Today'}
                            </div>
                          </td>

                          {/* Consignee */}
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>
                              {s.recipient.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {s.recipient.phone}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.recipient.address}
                            </div>
                          </td>

                          {/* Service / Weight */}
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: '#334155' }}>
                              {s.service}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {s.cargo.weightKg} kg &bull; {s.cargo.pieces} pcs
                            </div>
                          </td>

                          {/* COD Amount */}
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                            {s.codAmount && s.codAmount > 0 ? (
                              <div style={{ fontWeight: 800, color: '#b45309', fontFamily: 'monospace' }}>
                                Rs. {s.codAmount.toLocaleString()}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                                PREPAID
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              backgroundColor: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              fontSize: '0.74rem',
                              fontWeight: 700
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.text }} />
                              {s.status}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              {/* Print Waybill */}
                              <button
                                onClick={() => setPrintingShipment(s)}
                                title="Print 4x6 Waybill Label"
                                style={{
                                  padding: '0.35rem 0.55rem',
                                  borderRadius: '6px',
                                  backgroundColor: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  color: '#334155',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Printer size={13} />
                              </button>

                              {/* Quick Inward (If booked) */}
                              {s.status === 'Order Placed' && (
                                <button
                                  onClick={() => {
                                    updateShipmentStatus(s.id, 'Hub Received', s.origin.hub, 'Inwarded at Hub Counter');
                                    notify(`✓ ${s.id} marked Inwarded at Hub!`);
                                    loadData();
                                  }}
                                  title="Mark Hub Inward"
                                  style={{
                                    padding: '0.35rem 0.55rem',
                                    borderRadius: '6px',
                                    backgroundColor: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    color: '#065f46',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 700
                                  }}
                                >
                                  Inward
                                </button>
                              )}

                              {/* Dispatch Out for Delivery (If in hub) */}
                              {(s.status === 'Hub Received' || s.status === 'Origin Hub Inwarded') && (
                                <button
                                  onClick={() => setShowLastmileModal(true)}
                                  title="Assign to Rider Runsheet"
                                  style={{
                                    padding: '0.35rem 0.55rem',
                                    borderRadius: '6px',
                                    backgroundColor: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    color: '#1d4ed8',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 700
                                  }}
                                >
                                  Assign Rider
                                </button>
                              )}

                              {/* Deliver POD (If Out for Delivery) */}
                              {s.status === 'Out for Delivery' && (
                                <button
                                  onClick={() => setShowLastmileModal(true)}
                                  title="Record Delivery Proof (POD)"
                                  style={{
                                    padding: '0.35rem 0.55rem',
                                    borderRadius: '6px',
                                    backgroundColor: '#10b981',
                                    border: '1px solid #10b981',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 800
                                  }}
                                >
                                  POD ✓
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Showing {filteredShipments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                {Math.min(currentPage * pageSize, filteredShipments.length)} of {filteredShipments.length} entries
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: currentPage === 1 ? '#94a3b8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.78rem'
                  }}
                >
                  <ChevronLeft size={14} />
                </button>

                <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 0.5rem', color: '#1b4d3e' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.78rem'
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODALS INTEGRATION */}
      {/* ========================================================================= */}

      {/* Reception Intake Modal */}
      <ReceptionIntakeModal
        isOpen={showReceptionModal}
        onClose={() => setShowReceptionModal(false)}
        onCreated={(newShipment, shouldPrint) => {
          loadData();
          notify(`✓ Consignment ${newShipment.id} successfully booked!`);
          if (shouldPrint) {
            setPrintingShipment(newShipment);
          }
        }}
        defaultOriginCity={activeBranch !== 'ALL' ? activeBranch : 'Kathmandu'}
      />

      {/* Branch Inward Scanner Modal */}
      <BranchInwardModal
        isOpen={showBranchInwardModal}
        onClose={() => setShowBranchInwardModal(false)}
        onUpdated={() => {
          loadData();
          notify('✓ Branch Inward records updated.');
        }}
        branchName={activeBranch !== 'ALL' ? `${activeBranch} Hub` : 'Kathmandu Mega-Hub (KTM-01)'}
        branchCode={activeBranch !== 'ALL' ? activeBranch.substring(0, 3).toUpperCase() : 'KTM'}
      />

      {/* Lastmile Runsheet Modal */}
      <LastmileRunsheetModal
        isOpen={showLastmileModal}
        onClose={() => setShowLastmileModal(false)}
        shipments={shipments}
        onUpdated={() => {
          loadData();
          notify('✓ Lastmile delivery dispatch updated.');
        }}
        activeCity={activeBranch !== 'ALL' ? activeBranch : 'Kathmandu'}
      />

      {/* Printable 4x6 Waybill Label */}
      {printingShipment && (
        <PrintableLabel
          shipment={printingShipment}
          onClose={() => setPrintingShipment(null)}
        />
      )}
    </div>
  );
}
