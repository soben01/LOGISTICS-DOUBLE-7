'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Navigation, ShieldCheck } from 'lucide-react';

export default function LogisticsSplashScreen() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(14);
  const [statusIndex, setStatusIndex] = useState(0);

  const statusMessages = [
    'CONNECTING SATELLITE TELEMETRY...',
    'SYNCING 77 DISTRICTS FLEET HUBS...',
    'OPTIMIZING AIR & LINEHAUL ROUTING...',
    'DOUBLE 7 DISPATCH NETWORK READY'
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Show splash animation on first opening in session
    const hasSeen = sessionStorage.getItem('d7_splash_loaded');
    if (hasSeen) {
      setLoading(false);
      return;
    }

    // Step progress smoothly from 14% to 100% over ~1.6s
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        const increment = Math.floor(Math.random() * 18) + 14;
        return Math.min(prev + increment, 100);
      });
    }, 170);

    // Step status text
    const textTimer1 = setTimeout(() => setStatusIndex(1), 400);
    const textTimer2 = setTimeout(() => setStatusIndex(2), 850);
    const textTimer3 = setTimeout(() => setStatusIndex(3), 1300);

    // Trigger smooth fade-out at 1.7s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
      sessionStorage.setItem('d7_splash_loaded', 'true');
    }, 1700);

    // Remove from DOM at 2.1s
    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 2100);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(textTimer1);
      clearTimeout(textTimer2);
      clearTimeout(textTimer3);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      id="logistics-splash-screen"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#060911',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? 'scale(1.03)' : 'scale(1)',
        pointerEvents: fadeOut ? 'none' : 'auto',
        transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient Radial Background Glows */}
      <div
        style={{
          position: 'absolute',
          width: 'min(700px, 95vw)',
          height: 'min(700px, 95vw)',
          background: 'radial-gradient(circle, rgba(255, 102, 0, 0.18) 0%, rgba(6, 182, 212, 0.08) 45%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          animation: 'pulseGlow 2.5s infinite alternate ease-in-out',
        }}
      />

      {/* Grid Pattern Mesh */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.65,
          pointerEvents: 'none',
        }}
      />

      {/* Center Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Top Brand Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(255, 102, 0, 0.12)',
            border: '1px solid rgba(255, 102, 0, 0.35)',
            color: '#ff8533',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            marginBottom: '1.75rem',
            textTransform: 'uppercase',
            boxShadow: '0 0 20px rgba(255, 102, 0, 0.2)',
          }}
        >
          <span className="pulse-dot pulse-dot-orange" style={{ width: 6, height: 6 }} />
          <span>High-Velocity Cargo Dispatch</span>
        </div>

        {/* Brand Icon & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff6600 0%, #d9480f 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(255, 102, 0, 0.5)',
            }}
          >
            <span
              style={{
                fontSize: '1.45rem',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                color: '#ffffff',
              }}
            >
              7
            </span>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                lineHeight: 1.15,
              }}
            >
              DOUBLE <span style={{ color: 'var(--brand-orange)' }}>7</span>
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Express Cargo & Logistics
            </div>
          </div>
        </div>

        {/* Animated Logistics Route Track (Truck Travelling Along Highway) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '110px',
            backgroundColor: 'rgba(11, 17, 32, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1rem',
            overflow: 'hidden',
            marginBottom: '1.5rem',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 10px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Moving Road Surface & Waypoints */}
          <div
            style={{
              position: 'absolute',
              bottom: '22px',
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Illuminated Route Line filled to progress % */}
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--brand-orange), var(--brand-cyan))',
                boxShadow: '0 0 12px var(--brand-orange-glow)',
                transition: 'width 0.2s linear',
              }}
            />
          </div>

          {/* Road Dashes Animation */}
          <div
            className="animated-road-dashes"
            style={{
              position: 'absolute',
              bottom: '18px',
              left: 0,
              right: 0,
              height: '12px',
              opacity: 0.4,
            }}
          />

          {/* Logistics Vehicle Cruising Along the Progress Route */}
          <div
            style={{
              position: 'absolute',
              bottom: '28px',
              left: `calc(max(10px, ${progress}% - 38px))`,
              transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Truck SVG Icon with Headlights Glow */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #ff6600, #ff8533)',
                  color: '#ffffff',
                  padding: '6px 9px',
                  borderRadius: '8px',
                  boxShadow: '0 0 16px rgba(255, 102, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Truck size={18} strokeWidth={2.4} />
              </div>

              {/* Headlight Beam Projecting Forward */}
              <div
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '45px',
                  height: '24px',
                  background: 'linear-gradient(90deg, rgba(255, 220, 150, 0.65) 0%, transparent 100%)',
                  clipPath: 'polygon(0% 35%, 100% 0%, 100% 100%, 0% 65%)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Micro Wheels Bouncing Effect */}
            <div
              style={{
                width: '26px',
                height: '3px',
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '50%',
                marginTop: '3px',
              }}
            />
          </div>

          {/* Waypoints: KTM Hub -> Linehaul -> Destination */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            <span style={{ color: progress >= 20 ? 'var(--brand-orange)' : 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Navigation size={10} /> KTM HUB
            </span>
            <span style={{ color: progress >= 60 ? 'var(--brand-cyan)' : 'inherit' }}>
              LINEHAUL 24H
            </span>
            <span style={{ color: progress >= 95 ? 'var(--brand-emerald)' : 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ShieldCheck size={10} /> 77 DISTRICTS
            </span>
          </div>
        </div>

        {/* Progress Metric & Status Messages */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
            <span
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                minHeight: '18px',
                transition: 'all 0.2s ease',
              }}
            >
              {statusMessages[statusIndex]}
            </span>
            <span
              style={{
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              {progress}%
            </span>
          </div>

          {/* Ultra Thin Glowing Progress Line */}
          <div
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #ff6600 0%, #06b6d4 100%)',
                boxShadow: '0 0 10px rgba(255, 102, 0, 0.8)',
                transition: 'width 0.18s ease-out',
              }}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulseGlow {
          from {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0.6;
          }
          to {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.95;
          }
        }
        .animated-road-dashes {
          background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.3) 50%, transparent 50%);
          background-size: 20px 2px;
          background-repeat: repeat-x;
          animation: roadMove 0.4s linear infinite;
        }
        @keyframes roadMove {
          from { background-position-x: 0px; }
          to { background-position-x: -20px; }
        }
      `}</style>
    </div>
  );
}
