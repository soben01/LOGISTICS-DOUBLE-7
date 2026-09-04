import React from 'react';
import Link from 'next/link';
import {
  Plane,
  Ship,
  Truck,
  ShieldCheck,
  Globe,
  Mail,
  MapPin,
  Phone,
  ExternalLink,
  Cpu,
  Boxes
} from 'lucide-react';

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '4.5rem 0 2rem 0',
      marginTop: '6rem',
      position: 'relative'
    }}>
      <div className="container">
        <div className="grid grid-cols-4 gap-8" style={{ marginBottom: '3.5rem' }}>
          {/* Col 1: Brand & Founder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff6600 0%, #b33900 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 102, 0, 0.4)'
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>7</span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                DOUBLE <span style={{ color: 'var(--brand-orange)' }}>7</span> LOGISTICS
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Next-generation international air express, smart fulfillment, and multi-modal container freight network built to handle high-velocity global trade and peak-surge volumes with surgical precision.
            </p>

            {/* Founder Badge */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                S
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                  Founded by Soben
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--brand-cyan)' }}>
                  Lead Architect &middot; @soben01
                </div>
              </div>
              <a
                href="https://github.com/soben01/DOUBLE-7"
                target="_blank"
                rel="noreferrer"
                style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}
                aria-label="GitHub Repository"
              >
                <GithubIcon size={16} />
              </a>
            </div>
          </div>

          {/* Col 2: Core Services */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Logistics Services
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <Link href="/track" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plane size={15} color="var(--brand-orange)" /> Double 7 Super Express
              </Link>
              <Link href="/rates" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ship size={15} color="var(--brand-cyan)" /> Ocean Container FCL / LCL
              </Link>
              <Link href="/book" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Boxes size={15} color="var(--brand-amber)" /> Smart Warehousing & Robotic Hubs
              </Link>
              <Link href="/rates" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={15} color="var(--brand-emerald)" /> Cross-Border Fast-Track Customs
              </Link>
              <Link href="/book" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={15} color="#a855f7" /> High-Value & Cold Chain Cargo
              </Link>
            </div>
          </div>

          {/* Col 3: Key Hubs & Infrastructure */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Global Gateways
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }}></span>
                <span><strong>Shenzhen (SZX)</strong> Mega-Fulfillment Park</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }}></span>
                <span><strong>Hong Kong (HKG)</strong> Super Terminal 1</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }}></span>
                <span><strong>Singapore (SIN)</strong> Changi Sky Hub</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }}></span>
                <span><strong>Frankfurt (FRA)</strong> CargoCity South</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }}></span>
                <span><strong>Los Angeles (LAX)</strong> Transpacific Center</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Operations & Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              24/7 Operations Command
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Phone size={15} color="var(--brand-orange)" />
                <span>Global Priority Hotline: <strong>+1 (800) 555-D7</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={15} color="var(--brand-cyan)" />
                <span>dispatch@double7logistics.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={15} color="var(--brand-amber)" />
                <span>Global HQ: Double 7 SkyTower, Gateway 7</span>
              </div>
              
              <Link href="/operations" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem', width: 'fit-content' }}>
                <Cpu size={14} /> Open Control Tower
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Compliance & Copyright */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            &copy; 2026 DOUBLE 7 LOGISTICS LTD. All rights reserved. Architected & built by <strong style={{ color: '#f8fafc' }}>Soben</strong>.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span>IATA Certified Cargo Agent</span>
            <span>AEO-F Security Accredit</span>
            <span>ISO 9001:2015</span>
            <Link href="/support" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>
            <Link href="/support" style={{ color: 'var(--text-secondary)' }}>Terms of Carriage</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
