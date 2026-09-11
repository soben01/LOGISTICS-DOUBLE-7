'use client';

import React, { useState } from 'react';
import {
  Navigation,
  Radio,
  Truck,
  MapPin,
  Compass,
  Gauge,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  Layers,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { Shipment } from '../../lib/store';

interface TrackingCorridorRadarProps {
  shipment: Shipment;
}

interface WaypointPoint {
  name: string;
  code?: string;
  distanceKm: number;
  isCompleted: boolean;
  isCurrent: boolean;
  xPercent: number;
  yPercent: number;
  elevationM: number;
}

export default function TrackingCorridorRadar({ shipment }: TrackingCorridorRadarProps) {
  const [viewMode, setViewMode] = useState<'radar' | 'telematics'>('radar');
  const [activePin, setActivePin] = useState<string | null>('malekhu');

  const originCity = shipment.origin.city.toLowerCase();
  const destCity = shipment.destination.city.toLowerCase();

  // Determine corridor route details
  let corridorName = 'Central Trunk Highway Corridor (NH04)';
  let totalDistanceKm = 200;
  let currentProgressPercent = 42; // default 42% for In Transit KTM -> PKR
  let currentVehicleLocationName = 'Prithvi Highway — Malekhu Sector';
  let currentGpsCoords = '27.8124° N, 84.8219° E';
  let currentAltitude = 420;
  let waypoints: WaypointPoint[] = [];

  if (originCity.includes('kathmandu') && destCity.includes('pokhara')) {
    corridorName = 'Prithvi Highway (NH04) Himalayan Linehaul Corridor';
    totalDistanceKm = 200;
    currentProgressPercent = 42;
    currentVehicleLocationName = 'Malekhu Highway Sector (KM 72)';
    currentGpsCoords = '27.8124° N, 84.8219° E';
    currentAltitude = 420;
    waypoints = [
      { name: 'KTM Mega-Hub', code: 'KTM-01', distanceKm: 0, isCompleted: true, isCurrent: false, xPercent: 12, yPercent: 40, elevationM: 1350 },
      { name: 'Nagdhunga Tunnel', code: 'BYPASS', distanceKm: 18, isCompleted: true, isCurrent: false, xPercent: 24, yPercent: 48, elevationM: 1480 },
      { name: 'Naubise Jct', code: 'NBS', distanceKm: 28, isCompleted: true, isCurrent: false, xPercent: 34, yPercent: 62, elevationM: 920 },
      { name: 'Malekhu (Live GPS)', code: 'MLK-04', distanceKm: 72, isCompleted: true, isCurrent: true, xPercent: 48, yPercent: 54, elevationM: 420 },
      { name: 'Mugling Junction', code: 'MUG-01', distanceKm: 110, isCompleted: false, isCurrent: false, xPercent: 62, yPercent: 66, elevationM: 280 },
      { name: 'Damauli Hub', code: 'DAM-01', distanceKm: 152, isCompleted: false, isCurrent: false, xPercent: 76, yPercent: 46, elevationM: 350 },
      { name: 'Pokhara Gateway', code: 'PKR-01', distanceKm: 200, isCompleted: false, isCurrent: false, xPercent: 88, yPercent: 32, elevationM: 822 },
    ];
  } else if (originCity.includes('kathmandu') && destCity.includes('biratnagar')) {
    corridorName = 'BP Highway & East-West Express Corridor (NH02)';
    totalDistanceKm = 375;
    currentProgressPercent = shipment.status === 'Delivered' ? 100 : 75;
    currentVehicleLocationName = shipment.status === 'Delivered' ? 'Biratnagar Hub (Koshi)' : 'Itahari Bypass Sector';
    currentGpsCoords = '26.6667° N, 87.2833° E';
    currentAltitude = 115;
    waypoints = [
      { name: 'Kathmandu Hub', code: 'KTM-01', distanceKm: 0, isCompleted: true, isCurrent: false, xPercent: 12, yPercent: 35, elevationM: 1350 },
      { name: 'Dhulikhel Gate', code: 'DKL', distanceKm: 32, isCompleted: true, isCurrent: false, xPercent: 26, yPercent: 45, elevationM: 1550 },
      { name: 'Sindhuli Pass', code: 'SDL', distanceKm: 128, isCompleted: true, isCurrent: false, xPercent: 44, yPercent: 65, elevationM: 610 },
      { name: 'Bardibas Jct', code: 'BRD', distanceKm: 185, isCompleted: true, isCurrent: false, xPercent: 60, yPercent: 75, elevationM: 140 },
      { name: 'Lahan City', code: 'LHN', distanceKm: 260, isCompleted: true, isCurrent: false, xPercent: 74, yPercent: 72, elevationM: 110 },
      { name: 'Biratnagar Hub', code: 'BRT-01', distanceKm: 375, isCompleted: shipment.status === 'Delivered', isCurrent: shipment.status === 'Delivered', xPercent: 88, yPercent: 68, elevationM: 80 },
    ];
  } else if (originCity.includes('kathmandu') && destCity.includes('birgunj')) {
    corridorName = 'Tribhuvan Highway & Fast-Track Cargo Corridor (NH07)';
    totalDistanceKm = 135;
    currentProgressPercent = 88;
    currentVehicleLocationName = 'Birgunj City Industrial Approach';
    currentGpsCoords = '27.0133° N, 84.8773° E';
    currentAltitude = 92;
    waypoints = [
      { name: 'Kathmandu Hub', code: 'KTM-01', distanceKm: 0, isCompleted: true, isCurrent: false, xPercent: 15, yPercent: 25, elevationM: 1350 },
      { name: 'Thankot Gate', code: 'TKT', distanceKm: 14, isCompleted: true, isCurrent: false, xPercent: 30, yPercent: 38, elevationM: 1510 },
      { name: 'Hetauda Industrial', code: 'HTD-01', distanceKm: 85, isCompleted: true, isCurrent: false, xPercent: 55, yPercent: 62, elevationM: 465 },
      { name: 'Pathlaiya Jct', code: 'PTH', distanceKm: 110, isCompleted: true, isCurrent: false, xPercent: 72, yPercent: 75, elevationM: 160 },
      { name: 'Birgunj Gateway', code: 'BRG-01', distanceKm: 135, isCompleted: false, isCurrent: true, xPercent: 88, yPercent: 82, elevationM: 92 },
    ];
  } else {
    // Dynamic fallback
    corridorName = `${shipment.origin.city} to ${shipment.destination.city} National Corridor`;
    totalDistanceKm = 180;
    currentProgressPercent = shipment.status === 'Delivered' ? 100 : 50;
    currentVehicleLocationName = `${shipment.origin.city} Transit Sector`;
    currentGpsCoords = '27.7172° N, 85.3240° E';
    currentAltitude = 650;
    waypoints = [
      { name: shipment.origin.city, code: 'ORG', distanceKm: 0, isCompleted: true, isCurrent: false, xPercent: 15, yPercent: 50, elevationM: 1200 },
      { name: 'Midway Linehaul Transit', code: 'MID', distanceKm: 90, isCompleted: currentProgressPercent >= 50, isCurrent: currentProgressPercent < 100, xPercent: 50, yPercent: 50, elevationM: 650 },
      { name: shipment.destination.city, code: 'DST', distanceKm: 180, isCompleted: shipment.status === 'Delivered', isCurrent: shipment.status === 'Delivered', xPercent: 85, yPercent: 50, elevationM: 800 },
    ];
  }

  // Calculate distance traveled and remaining
  const distanceTraveled = Math.round((currentProgressPercent / 100) * totalDistanceKm);
  const distanceRemaining = Math.max(0, totalDistanceKm - distanceTraveled);
  const vehiclePlate = shipment.telemetry?.transportVehicle || 'BA 2 KHA 8841 (Express E-Van)';
  const speedKmh = shipment.telemetry?.currentSpeedKmh || (shipment.status === 'Delivered' ? 0 : 58);

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(13, 19, 36, 0.95) 0%, rgba(9, 13, 24, 0.98) 100%)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(255, 102, 0, 0.28)',
      overflow: 'hidden',
      marginBottom: '1.75rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
    }}>
      {/* Top Header Bar: Corridor Identity & Real-Time Sync Status */}
      <div style={{
        padding: '0.9rem 1.4rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(255, 102, 0, 0.15)',
            border: '1px solid rgba(255, 102, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-orange)'
          }}>
            <Navigation size={15} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                {corridorName}
              </span>
              <span className="badge badge-orange" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', textTransform: 'uppercase' }}>
                LIVE GPS RADAR
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Telemetry Feed &bull; Transmit ID: IRIDIUM-SBD-8821 &bull; Refresh Rate: 10s
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.4)', padding: '0.2rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={() => setViewMode('radar')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.74rem',
              fontWeight: 600,
              background: viewMode === 'radar' ? 'var(--brand-orange)' : 'transparent',
              color: viewMode === 'radar' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Activity size={12} />
            <span>Highway Radar Map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('telematics')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.74rem',
              fontWeight: 600,
              background: viewMode === 'telematics' ? 'var(--brand-orange)' : 'transparent',
              color: viewMode === 'telematics' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Gauge size={12} />
            <span>Vehicle Telematics</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Visual Radar Section */}
      {viewMode === 'radar' ? (
        <div style={{ position: 'relative', width: '100%', minHeight: '230px', padding: '1.25rem 1.5rem 1rem 1.5rem', background: 'radial-gradient(ellipse at 50% 30%, rgba(255, 102, 0, 0.07) 0%, rgba(9, 13, 24, 0.95) 75%)' }}>
          {/* Background Grid & Topographical Contour Lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 48% 54%, rgba(255, 102, 0, 0.15) 0%, transparent 40%),
              linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 36px 36px, 36px 36px',
            pointerEvents: 'none',
            opacity: 0.85
          }} />

          {/* SVG Route Corridor Layer */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              overflow: 'visible'
            }}
            viewBox="0 0 1000 240"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="routeProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="42%" stopColor="#ff6600" stopOpacity="1" />
                <stop offset="43%" stopColor="#ff6600" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.12)" />
              </linearGradient>

              {/* Glowing radar ripple filter */}
              <filter id="glowOrange" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* River / Natural Valley Topography (Trishuli River Corridor in blue) */}
            <path
              d="M 80,120 Q 220,165 340,150 T 480,135 T 620,165 T 780,120 T 920,80"
              fill="none"
              stroke="rgba(6, 182, 212, 0.18)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 80,120 Q 220,165 340,150 T 480,135 T 620,165 T 780,120 T 920,80"
              fill="none"
              stroke="rgba(6, 182, 212, 0.4)"
              strokeWidth="2"
              strokeDasharray="4,6"
            />

            {/* Mountain Contour Silhouette Background */}
            <path
              d="M 50,70 L 150,40 L 280,65 L 420,30 L 580,55 L 720,25 L 860,60 L 960,35"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1.5"
            />

            {/* Highway Corridor Path Shadow */}
            <path
              d="M 120,95 Q 240,115 340,150 T 480,130 T 620,160 T 760,110 T 880,75"
              fill="none"
              stroke="rgba(0, 0, 0, 0.8)"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Inactive Upcoming Route (Dashed) */}
            <path
              d="M 120,95 Q 240,115 340,150 T 480,130 T 620,160 T 760,110 T 880,75"
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="3.5"
              strokeDasharray="6,6"
              strokeLinecap="round"
            />

            {/* Completed Path Traversed (Glowing Gradient) */}
            <path
              d="M 120,95 Q 240,115 340,150 T 480,130"
              fill="none"
              stroke="url(#routeProgressGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#glowOrange)"
            />

            {/* Pulsing Radar Ring around Current Location (Malekhu at 480, 130) */}
            <circle cx="480" cy="130" r="16" fill="none" stroke="rgba(255, 102, 0, 0.6)" strokeWidth="1.5">
              <animate attributeName="r" values="8;24;36" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="480" cy="130" r="10" fill="none" stroke="rgba(255, 102, 0, 0.9)" strokeWidth="2" />
          </svg>

          {/* Interactive Waypoint Nodes & Badges Overlay */}
          <div style={{ position: 'relative', width: '100%', height: '170px', zIndex: 2 }}>
            {waypoints.map((wp, idx) => {
              const isSelected = activePin === wp.name.toLowerCase();
              return (
                <div
                  key={idx}
                  onClick={() => setActivePin(wp.name.toLowerCase())}
                  style={{
                    position: 'absolute',
                    left: `${wp.xPercent}%`,
                    top: `${wp.yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {/* Waypoint Pin Marker */}
                  <div style={{
                    width: wp.isCurrent ? '34px' : '22px',
                    height: wp.isCurrent ? '34px' : '22px',
                    borderRadius: '50%',
                    background: wp.isCurrent
                      ? 'var(--brand-orange)'
                      : wp.isCompleted
                        ? 'rgba(16, 185, 129, 0.9)'
                        : 'rgba(23, 31, 54, 0.9)',
                    border: wp.isCurrent
                      ? '3px solid #ffffff'
                      : wp.isCompleted
                        ? '2px solid #10b981'
                        : '2px solid rgba(255, 255, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: wp.isCurrent
                      ? '0 0 20px rgba(255, 102, 0, 0.9), 0 0 35px rgba(255, 102, 0, 0.5)'
                      : wp.isCompleted
                        ? '0 0 10px rgba(16, 185, 129, 0.4)'
                        : 'none',
                    zIndex: wp.isCurrent ? 10 : 3
                  }}>
                    {wp.isCurrent ? (
                      <Truck size={17} color="#ffffff" className="animate-pulse" />
                    ) : wp.isCompleted ? (
                      <CheckCircle2 size={13} color="#ffffff" />
                    ) : (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</span>
                    )}
                  </div>

                  {/* Waypoint Label */}
                  <div style={{
                    marginTop: '0.35rem',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    background: wp.isCurrent ? 'rgba(255, 102, 0, 0.95)' : 'rgba(7, 11, 20, 0.85)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    border: `1px solid ${wp.isCurrent ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: wp.isCurrent ? 800 : 600,
                      color: wp.isCurrent ? '#ffffff' : wp.isCompleted ? '#e2e8f0' : 'var(--text-muted)'
                    }}>
                      {wp.name}
                    </span>
                    {wp.isCurrent && (
                      <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                        LIVE &bull; 58 KM/H
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Telemetry HUD Ribbon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.78rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Compass size={14} color="var(--brand-orange)" />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>GPS Coordinates</span>
                <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{currentGpsCoords}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Gauge size={14} color="var(--brand-cyan)" />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>Linehaul Speed</span>
                <strong style={{ color: 'var(--brand-cyan)', fontFamily: 'var(--font-mono)' }}>{speedKmh} km/h (Cruise)</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <MapPin size={14} color="var(--brand-emerald)" />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>Corridor Transit</span>
                <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {distanceTraveled} km / {totalDistanceKm} km ({currentProgressPercent}%)
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldCheck size={14} color="var(--brand-amber)" />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>Security E-Seal</span>
                <strong style={{ color: 'var(--brand-amber)', fontFamily: 'var(--font-mono)' }}>#SEAL-882190-NP (Intact)</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Alternate Tab: In-Depth Vehicle Telematics & Diagnostics */
        <div style={{ padding: '1.5rem', background: 'rgba(9, 13, 24, 0.95)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Assigned Fleet Unit</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {vehiclePlate}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-orange)', marginTop: '0.2rem' }}>
                Double 7 Express Zero-Emission Fleet
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Linehaul Pilot & Custody</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                Bikash Shrestha
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-emerald)', marginTop: '0.2rem' }}>
                Verified Specialist &bull; Badge #D7-902 &bull; &#9733; 4.96
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Cargo Bay Sensors</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-cyan)', fontFamily: 'var(--font-mono)' }}>
                22.4&deg;C &bull; Optimal Ambient
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Shock / Tilt: Normal &bull; Humidity: 54%
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Highway Corridor Status</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                Open &bull; Dry Road Surface
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Nagdhunga Tunnel &bull; Prithvi Highway Cleared
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
