import React from 'react';
import Link from 'next/link';
import {
  Truck,
  Boxes,
  Banknote,
  Search,
  Mail,
  MapPin,
  Phone
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
      padding: '3.5rem 0 2rem 0',
      marginTop: '4rem',
    }}>
      <div className="container">
        <div className="grid grid-cols-4 gap-8" style={{ marginBottom: '2.5rem' }}>
          {/* Col 1: Brand & Founder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img
                src="/images/logo.png"
                alt="Double 7"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  boxShadow: '0 2px 8px rgba(255, 102, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              />
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                DOUBLE <span style={{ color: 'var(--brand-orange)' }}>7</span> <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>LOGISTICS</span>
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Next-generation domestic logistics, express linehaul, and automated Cash on Delivery across all 7 provinces of Nepal.
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}>
              <span>Built by Soben</span>
              <a
                href="https://github.com/soben01/LOGISTICS-DOUBLE-7"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}
                aria-label="GitHub Repository"
              >
                <GithubIcon size={14} />
              </a>
            </div>
          </div>

          {/* Col 2: Services */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ color: '#ffffff', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Services
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <Link href="/track" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                Track Consignment
              </Link>
              <Link href="/book" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                Book Express Delivery
              </Link>
              <Link href="/rates" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                Rates &amp; Tariffs
              </Link>
              <Link href="/merchant" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                Merchant COD Portal
              </Link>
            </div>
          </div>

          {/* Col 3: Key Hubs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ color: '#ffffff', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Hub Network
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div>Kathmandu Central Dispatch</div>
              <div>Pokhara Regional Hub</div>
              <div>Birgunj Linehaul Terminal</div>
              <div>Biratnagar Eastern Gateway</div>
              <div>Chitwan &amp; Butwal Hubs</div>
            </div>
          </div>

          {/* Col 4: Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ color: '#ffffff', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} color="var(--brand-orange)" />
                <span>dispatch@sobinupreti.com.np</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} color="var(--brand-cyan)" />
                <span>Kathmandu, Nepal</span>
              </div>
              <Link
                href="/support"
                style={{ color: 'var(--brand-orange)', textDecoration: 'none', fontWeight: 600, marginTop: '0.25rem' }}
              >
                Help &amp; Support &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}>
          <div>
            &copy; 2026 Double 7 Logistics. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link href="/support" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/support" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Carriage</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
