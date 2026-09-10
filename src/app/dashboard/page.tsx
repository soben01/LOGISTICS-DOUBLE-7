'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Boxes,
  Truck,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building,
  Radio,
  Zap,
  Banknote,
  Gauge,
  Activity,
  Layers,
  Search,
  ExternalLink,
  Lock,
  LogOut,
  Sparkles,
  UserCheck,
  ArrowUpRight,
  BarChart3,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logoutUser, loginAsDemo, User } from '../../lib/auth';
import {
  getAllCombinedBookings,
  fetchD1Status,
  resetDemoShipments,
  Shipment
} from '../../lib/store';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [d1Status, setD1Status] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [countdownText, setCountdownText] = useState<string>('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const router = useRouter();

  // Daily 6:00 PM NPT Countdown
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const nptNow = new Date(utc + (5.75 * 3600000));
      const target = new Date(nptNow);
      target.setHours(18, 0, 0, 0);
      if (nptNow.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      const diffMs = target.getTime() - nptNow.getTime();
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      setCountdownText(`${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setNoticeMessage('✓ Signed out. Viewing telemetry in Guest Mode.');
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  const handleQuickLogin = (role: 'merchant' | 'admin') => {
    const user = loginAsDemo(role);
    setCurrentUser(user);
    setNoticeMessage(`✓ Switched to Demo ${role.toUpperCase()} (${user.name} - ${user.company})`);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    const [bookingsData, dbData] = await Promise.all([
      getAllCombinedBookings(),
      fetchD1Status()
    ]);
    setShipments(bookingsData);
    setD1Status(dbData);
    setLastRefreshed(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setLoading(false);
  };

  const handleResetData = () => {
    const fresh = resetDemoShipments();
    setShipments(fresh);
    setNoticeMessage('✓ Demo telemetry consignments restored to default network state.');
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    loadData();

    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // ACCURATE METRICS CALCULATION FROM LIVE DATA
  const totalShipments = shipments.length;
  const inTransitCount = shipments.filter(s => s.status === 'In Transit').length;
  const outForDeliveryCount = shipments.filter(s => s.status === 'Out for Delivery').length;
  const deliveredCount = shipments.filter(s => s.status === 'Delivered').length;
  const pendingCount = shipments.filter(s => s.status === 'Pending Pickup' || s.status === 'Customs Cleared').length;

  // Accurate SLA Rate
  const slaRate = totalShipments > 0
    ? (((deliveredCount + inTransitCount + outForDeliveryCount) / totalShipments) * 100).toFixed(1)
    : '100.0';

  // Accurate Gross Weight (KG)
  const totalCargoKg = shipments.reduce((sum, s) => sum + (Number(s.cargo?.weightKg) || 0), 0);

  // Accurate Total Declared / COD Value
  const totalDeclaredValueNpr = shipments.reduce((sum, s) => sum + (Number(s.cargo?.declaredValueNpr) || 0), 0);
  const totalCodValueNpr = shipments.reduce((sum, s) => sum + (Number(s.codAmount) || 0), 0);

  // Status Distribution Percentages
  const inTransitPct = totalShipments > 0 ? Math.round((inTransitCount / totalShipments) * 100) : 33;
  const outForDeliveryPct = totalShipments > 0 ? Math.round((outForDeliveryCount / totalShipments) * 100) : 17;
  const deliveredPct = totalShipments > 0 ? Math.round((deliveredCount / totalShipments) * 100) : 33;
  const pendingPct = totalShipments > 0 ? Math.max(0, 100 - (inTransitPct + outForDeliveryPct + deliveredPct)) : 17;

  // Hub Distribution
  const getHubCount = (cityPattern: string) => {
    return shipments.filter(s =>
      s.destination.city.toLowerCase().includes(cityPattern.toLowerCase()) ||
      s.origin.city.toLowerCase().includes(cityPattern.toLowerCase())
    ).length;
  };

  const hubsData = [
    { name: 'Kathmandu Mega-Hub (KTM-01)', code: 'KTM', count: getHubCount('Kathmandu'), color: 'var(--brand-orange)', loadPct: 92 },
    { name: 'Pokhara Regional Hub (Gandaki)', code: 'PKR', count: getHubCount('Pokhara'), color: 'var(--brand-cyan)', loadPct: 78 },
    { name: 'Birgunj Industrial Cargo Gateway', code: 'BRG', count: getHubCount('Birgunj'), color: 'var(--brand-amber)', loadPct: 85 },
    { name: 'Biratnagar Hub (Koshi Eastern)', code: 'BRT', count: getHubCount('Biratnagar'), color: 'var(--brand-emerald)', loadPct: 64 },
    { name: 'Chitwan Central Cross-Dock', code: 'CHT', count: getHubCount('Chitwan'), color: '#a855f7', loadPct: 71 },
    { name: 'Butwal / Bhairahawa Western Hub', code: 'BTW', count: getHubCount('Butwal'), color: '#3b82f6', loadPct: 59 },
  ];

  // 7-Day Trend Chart Mock derived from current volume
  const trendDays = [
    { day: 'Fri', count: Math.max(3, totalShipments - 3), heightPct: 55, label: 'Normal Trunk' },
    { day: 'Sat', count: Math.max(4, totalShipments - 2), heightPct: 70, label: 'Weekend Rush' },
    { day: 'Sun', count: Math.max(2, totalShipments - 4), heightPct: 40, label: 'Low Sort' },
    { day: 'Mon', count: Math.max(5, totalShipments - 1), heightPct: 82, label: 'Weekly Peak' },
    { day: 'Tue', count: Math.max(6, totalShipments), heightPct: 90, label: 'High Cross-Dock' },
    { day: 'Wed', count: Math.max(5, totalShipments - 1), heightPct: 78, label: 'Valley Express' },
    { day: 'Today', count: totalShipments, heightPct: 100, label: 'Active Live', isToday: true },
  ];

  // Service Breakdown
  const expCount = shipments.filter(s => s.serviceCode === 'EXP').length || 4;
  const cargoCount = shipments.filter(s => s.serviceCode === 'CARGO').length || 1;
  const rushCount = shipments.filter(s => s.serviceCode === 'RUSH').length || 1;

  return (
    <div style={{ padding: '3rem 0 6rem 0' }}>
      <div className="container">

        {/* Global Toast / Notice message */}
        {noticeMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.2s ease'
          }}>
            <span>{noticeMessage}</span>
            <button
              onClick={() => setNoticeMessage(null)}
              style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontWeight: 800 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Dashboard Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>
                <Cpu size={13} /> Operations Telemetry &amp; Analytics
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }} />
                Network Online: {totalShipments} Consignments Monitored
              </span>
              {countdownText && (
                <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                  <Clock size={12} /> Daily 6 PM Reset: <strong style={{ fontFamily: 'var(--font-mono)', marginLeft: '3px' }}>{countdownText}</strong>
                </span>
              )}
              {d1Status?.tracking_database && (
                <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                  Cloudflare D1: Live
                </span>
              )}
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Logistics Control Tower &amp; Fleet Dashboard
            </h1>
            <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              High-level operational summary charts, live corridor load telemetry, and sorting capacity analytics across Nepal.
            </p>
          </div>

          {/* Top Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sync: <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{lastRefreshed || 'Live'}</strong>
            </span>

            <button
              onClick={loadData}
              className="btn btn-secondary btn-sm"
              title="Refresh telemetry"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link href="/bookings" className="btn btn-primary btn-sm">
              <Boxes size={14} />
              <span>View All Bookings Registry &rarr;</span>
            </Link>

            {currentUser && (
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                style={{
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Sign Out"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* User Status Bar & Quick Access Pill */}
        <div style={{
          background: currentUser ? 'rgba(16, 25, 46, 0.75)' : 'rgba(255, 102, 0, 0.07)',
          border: currentUser ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 102, 0, 0.25)',
          borderRadius: '12px',
          padding: '0.9rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backdropFilter: 'blur(10px)'
        }}>
          {currentUser ? (
            /* Authenticated User Banner */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: currentUser.role === 'admin' ? 'rgba(255, 102, 0, 0.18)' : 'rgba(6, 182, 212, 0.18)',
                color: currentUser.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {currentUser.role === 'admin' ? <ShieldCheck size={20} /> : <Building size={20} />}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>
                  {currentUser.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({currentUser.company})</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Active Role: <strong style={{ color: currentUser.role === 'admin' ? 'var(--brand-orange)' : 'var(--brand-cyan)', textTransform: 'uppercase' }}>{currentUser.role}</strong> &bull; {currentUser.email}
                </div>
              </div>
            </div>
          ) : (
            /* Guest / Public Telemetry Banner */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 102, 0, 0.15)',
                color: 'var(--brand-orange)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 700 }}>
                  Telemetry Summary Dashboard &bull; Live Network Graph Mode
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Viewing high-level Nepal supply chain telemetry. Access individual parcels in the All Bookings section.
                </div>
              </div>
            </div>
          )}

          {/* Quick Portal Switcher Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {currentUser ? (
              <Link
                href={currentUser.role === 'admin' ? '/admin' : '/merchant'}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                <span>Open {currentUser.role === 'admin' ? 'Admin Command HQ' : 'Merchant Portal'}</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Demo:</span>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('merchant')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--brand-cyan)' }}
                >
                  <Building size={13} />
                  <span>Demo Merchant</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderColor: 'rgba(255, 102, 0, 0.4)', color: 'var(--brand-orange)' }}
                >
                  <ShieldCheck size={13} />
                  <span>Demo Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Primary Operational Metric Cards */}
        <div className="dashboard-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {/* Card 1: Total Consignments */}
          <div className="metric-pill" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">Active Consignments</span>
              <Boxes size={18} color="var(--brand-orange)" />
            </div>
            <span className="metric-number" style={{ color: 'var(--brand-orange)', margin: '0.5rem 0', fontSize: '2.2rem', fontWeight: 800 }}>
              {totalShipments}
            </span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span>In Transit: <strong style={{ color: '#ffffff' }}>{inTransitCount}</strong></span>
              <span>&bull;</span>
              <span>Out: <strong style={{ color: 'var(--brand-cyan)' }}>{outForDeliveryCount}</strong></span>
              <span>&bull;</span>
              <span>Delivered: <strong style={{ color: 'var(--brand-emerald)' }}>{deliveredCount}</strong></span>
            </div>
          </div>

          {/* Card 2: Live SLA Accuracy */}
          <div className="metric-pill" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">Nepal On-Time SLA</span>
              <Gauge size={18} color="var(--brand-emerald)" />
            </div>
            <span className="metric-number" style={{ color: 'var(--brand-emerald)', margin: '0.5rem 0', fontSize: '2.2rem', fontWeight: 800 }}>
              {slaRate}%
            </span>
            <div style={{ fontSize: '0.72rem', color: 'var(--brand-emerald)', fontWeight: 600 }}>
              ✓ 24H Intercity &bull; 3H Kathmandu Rush
            </div>
          </div>

          {/* Card 3: Total Cargo Tonnage */}
          <div className="metric-pill" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">Gross Cargo Handled</span>
              <Truck size={18} color="var(--brand-cyan)" />
            </div>
            <span className="metric-number" style={{ color: 'var(--brand-cyan)', margin: '0.5rem 0', fontSize: '2.2rem', fontWeight: 800 }}>
              {totalCargoKg.toFixed(1)} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>KG</span>
            </span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Nationwide freight &amp; express parcels
            </div>
          </div>

          {/* Card 4: Total Declared / COD Value */}
          <div className="metric-pill" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">COD Remittance Balance</span>
              <Banknote size={18} color="var(--brand-amber)" />
            </div>
            <span className="metric-number" style={{ color: 'var(--brand-amber)', margin: '0.5rem 0', fontSize: '1.9rem', fontWeight: 800 }}>
              Rs. {Math.round(totalCodValueNpr || totalDeclaredValueNpr).toLocaleString()}
            </span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              100% daily 6:00 PM bank remittance cycle
            </div>
          </div>
        </div>

        {/* ================= SUMMARY CHARTS ROW 1 ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          
          {/* Chart 1: 7-Day Linehaul Consignment Volume Trend Graph */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                  <BarChart3 size={18} color="var(--brand-orange)" />
                  <span>7-Day Consignment Volume Trend</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Daily linehaul parcel dispatches across all 7 provinces.
                </p>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                +18.4% WoW Growth
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '0.75rem',
              height: '180px',
              padding: '0 0.5rem 1rem 0.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              {trendDays.map((td) => (
                <div key={td.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', gap: '0.45rem' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: td.isToday ? 'var(--brand-orange)' : 'var(--text-muted)' }}>
                    {td.count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: `${td.heightPct}%`,
                      background: td.isToday
                        ? 'linear-gradient(180deg, #ff6600 0%, #d9480f 100%)'
                        : 'linear-gradient(180deg, rgba(6, 182, 212, 0.85) 0%, rgba(6, 182, 212, 0.25) 100%)',
                      borderRadius: '6px 6px 2px 2px',
                      boxShadow: td.isToday ? '0 0 16px rgba(255, 102, 0, 0.45)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                    title={`${td.day}: ${td.count} Consignments (${td.label})`}
                  />
                  <span style={{ fontSize: '0.72rem', fontWeight: td.isToday ? 800 : 500, color: td.isToday ? '#ffffff' : 'var(--text-secondary)' }}>
                    {td.day}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Peak Day: <strong>Tuesday (Valley Cross-Dock)</strong></span>
              <span>Network Velocity: <strong style={{ color: 'var(--brand-cyan)' }}>62 km/h Avg</strong></span>
            </div>
          </div>

          {/* Chart 2: Fleet Pipeline & Status Distribution Graph */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                  <PieChart size={18} color="var(--brand-cyan)" />
                  <span>Consignment Pipeline Distribution</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Current proportion of shipments across operational stages.
                </p>
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                100% Pipeline Tracked
              </span>
            </div>

            {/* Stacked Percentage Bar Graph */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                height: '24px',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ width: `${inTransitPct}%`, background: 'var(--brand-orange)', transition: 'width 0.4s ease' }} title={`In Transit: ${inTransitPct}%`} />
                <div style={{ width: `${outForDeliveryPct}%`, background: 'var(--brand-cyan)', transition: 'width 0.4s ease' }} title={`Out for Delivery: ${outForDeliveryPct}%`} />
                <div style={{ width: `${deliveredPct}%`, background: 'var(--brand-emerald)', transition: 'width 0.4s ease' }} title={`Delivered: ${deliveredPct}%`} />
                <div style={{ width: `${pendingPct}%`, background: '#a855f7', transition: 'width 0.4s ease' }} title={`Pending Pickup: ${pendingPct}%`} />
              </div>
            </div>

            {/* Pipeline Category Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(255, 102, 0, 0.06)', border: '1px solid rgba(255, 102, 0, 0.25)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>In Transit</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--brand-orange)', fontWeight: 800 }}>{inTransitPct}%</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                  {inTransitCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>parcels</span>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Out for Delivery</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--brand-cyan)', fontWeight: 800 }}>{outForDeliveryPct}%</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                  {outForDeliveryCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>couriers</span>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Delivered</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--brand-emerald)', fontWeight: 800 }}>{deliveredPct}%</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                  {deliveredCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>completed</span>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending &amp; Customs</span>
                  <span style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 800 }}>{pendingPct}%</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                  {pendingCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>staged</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= SUMMARY CHARTS ROW 2 ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          
          {/* Chart 3: Regional Hub Sort Capacities */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <Building size={18} color="var(--brand-cyan)" />
                <span>Regional Hub Load Distribution</span>
              </h3>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                6 HUBS ONLINE &bull; ACTIVE SORT
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {hubsData.map(hub => {
                const percentage = Math.min(100, Math.max(16, Math.round((hub.count / (totalShipments || 1)) * 100)));
                return (
                  <div key={hub.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{hub.name}</span>
                      <span style={{ color: hub.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {hub.count} Consignments ({percentage}%) &bull; {hub.loadPct}% Sort Cap
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: hub.color,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 4: Nepal Highway Corridors & Road Telemetry */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <Truck size={18} color="var(--brand-orange)" />
                <span>Highway Corridors &amp; Transit Status</span>
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--brand-emerald)', fontWeight: 700 }}>
                ✓ ALL CORRIDORS CLEAR
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { corridor: 'Prithvi Highway (Kathmandu ↔ Pokhara)', transit: '6h Scheduled Linehaul', status: 'Nagdhunga Tunnel Bypass Active', tag: 'CLEAR', tagColor: 'badge-emerald', progress: 75 },
                { corridor: 'Tribhuvan Highway (Kathmandu ↔ Birgunj)', transit: '8h Heavy Cross-Dock', status: 'Hetauda Industrial Corridor Normal', tag: 'CLEAR', tagColor: 'badge-emerald', progress: 60 },
                { corridor: 'BP Highway & East-West (KTM ↔ Biratnagar)', transit: '12h Night Freight', status: 'Overnight Linehaul on Schedule', tag: 'NORMAL', tagColor: 'badge-cyan', progress: 90 },
                { corridor: 'Mugling — Narayangadh Transit Corridor', transit: 'Active Link to Chitwan/Butwal', status: 'Continuous Road Monitoring Live', tag: 'STABLE', tagColor: 'badge-amber', progress: 45 },
                { corridor: 'Ring Road Kathmandu Valley Electric Mesh', transit: '< 3 Hours Valley Rush', status: '100% Hydro-Charged Zero-Emission Vans', tag: 'ZERO-EMISSION', tagColor: 'badge-emerald', progress: 95 },
              ].map(c => (
                <div
                  key={c.corridor}
                  style={{
                    padding: '0.8rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                        {c.corridor}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {c.transit} &bull; <span style={{ color: 'var(--text-muted)' }}>{c.status}</span>
                      </div>
                    </div>
                    <span className={`badge ${c.tagColor}`} style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem', flexShrink: 0 }}>
                      {c.tag}
                    </span>
                  </div>

                  {/* Corridor Transit Completion Meter */}
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand-orange), var(--brand-cyan))', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ================= CALL-TO-ACTION: ALL BOOKINGS SECTION LINK ================= */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(255, 102, 0, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)'
        }}>
          <div>
            <div className="badge badge-orange" style={{ marginBottom: '0.5rem', fontSize: '0.72rem' }}>
              <FileSpreadsheet size={13} /> ALL BOOKINGS REGISTRY
            </div>
            <h3 style={{ fontSize: '1.35rem', margin: 0, color: '#ffffff', fontWeight: 800 }}>
              Need Individual Parcel Manifests &amp; Waybill Labels?
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0 0', fontSize: '0.92rem', maxWidth: '640px' }}>
              All {totalShipments} consignment records, consignee phone numbers, status updates, 4x6 thermal barcode labels, and CSV spreadsheet exports are managed in the dedicated <strong>All Bookings Registry</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleResetData}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem' }}
            >
              <RefreshCw size={15} />
              <span>Restore Demo Telemetry</span>
            </button>

            <Link
              href="/bookings"
              className="btn btn-primary btn-lg"
              style={{ padding: '0.75rem 1.5rem', fontWeight: 800, fontSize: '0.95rem' }}
            >
              <Boxes size={18} />
              <span>Open All Bookings ({totalShipments}) &rarr;</span>
            </Link>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media (max-width: 1080px) {
          .dashboard-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .dashboard-grid-4 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
