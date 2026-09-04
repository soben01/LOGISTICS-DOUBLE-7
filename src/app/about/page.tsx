'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Cpu,
  Globe,
  Award,
  Users,
  ArrowRight,
  Plane,
  Boxes,
  CheckCircle2
} from 'lucide-react';

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div style={{ padding: '3.5rem 0 6rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="badge badge-orange" style={{ marginBottom: '0.75rem' }}>
            <Award size={13} /> Our Mission & Origins
          </div>
          <h1>The Double 7 Logistics Story</h1>
          <p style={{ maxWidth: '640px', margin: '0.5rem auto 0 auto', fontSize: '1.1rem' }}>
            Engineered to thrive under the world&apos;s most demanding supply chain conditions—where seconds matter and peak volumes require flawless execution.
          </p>
        </div>

        {/* Founder Spotlight Card */}
        <div className="glass-panel" style={{ padding: '3rem', marginBottom: '4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2.5rem', alignItems: 'center' }} className="founder-grid">
            {/* Avatar / Brand Hexagon */}
            <div style={{
              width: '130px',
              height: '130px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #ff6600 0%, #ff8533 50%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '3.5rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 12px 36px rgba(255, 102, 0, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              7
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.85rem' }}>Soben</h2>
                <span className="badge badge-cyan">Founder &amp; Chief Architect</span>
                <a
                  href="https://github.com/soben01"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                >
                  <GithubIcon size={16} /> @soben01
                </a>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                &ldquo;We started <strong>DOUBLE 7</strong> to solve the toughest logistics challenge in Nepal: connecting all 7 provinces and 77 districts with guaranteed next-day linehauls, automated Cash on Delivery (COD), and sub-second digital tracking. We are operating 100% active across Nepal today, and preparing our direct international cross-border air cargo corridors for launch in Q4 2026.&rdquo;
              </p>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <span>&bull; Nationwide Nepal Domestic Hubs (77 Districts)</span>
                <span>&bull; Automated E-Commerce COD Remittance</span>
                <span>&bull; International Air Cargo Expansion (Coming Soon)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why "Double 7"? */}
        <div className="grid grid-cols-2 gap-8" style={{ marginBottom: '4rem' }}>
          <div className="card" style={{ padding: '2.5rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(255, 102, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-orange)',
              marginBottom: '1.25rem'
            }}>
              <Zap size={22} />
            </div>
            <h3>Why the Name &ldquo;Double 7&rdquo;?</h3>
            <p style={{ marginTop: '0.75rem', lineHeight: '1.7' }}>
              In high-velocity commerce, <strong>Double 7</strong> represents seamless nationwide connectivity across all <strong>7 Provinces and 77 Districts of Nepal</strong>, synchronized with chartered Boeing 777F international air cargo routes.
            </p>
            <p style={{ marginTop: '0.75rem', lineHeight: '1.7' }}>
              A network that can maintain 99.8% on-time performance across complex Himalayan terrain and global corridors can conquer any logistics challenge in the world. We took that standard as our namesake and built every system, sorting center, and air route to handle peak pressure every single day.
            </p>
          </div>

          <div className="card" style={{ padding: '2.5rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-cyan)',
              marginBottom: '1.25rem'
            }}>
              <Cpu size={22} />
            </div>
            <h3>Algorithmic Routing &amp; Robotics</h3>
            <p style={{ marginTop: '0.75rem', lineHeight: '1.7' }}>
              Unlike legacy freight forwarding firms that rely on manual email threads and paper waybills, Double 7 is software-defined.
            </p>
            <p style={{ marginTop: '0.75rem', lineHeight: '1.7' }}>
              From the moment an order is booked, automated flight slot reservation engines allocate cargo capacity across our chartered Boeing 777Fs and commercial partners, while Autonomous Mobile Robots (AMRs) route packages across our sorting hubs in under 18 minutes.
            </p>
          </div>
        </div>

        {/* Global Infrastructure Numbers */}
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '2rem' }}>Our Global Footprint</h2>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--brand-orange)', fontFamily: 'var(--font-mono)' }}>6</div>
              <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>Automated Mega-Hubs</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shenzhen, HK, Singapore, Tokyo, Frankfurt, LA</div>
            </div>

            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--brand-cyan)', fontFamily: 'var(--font-mono)' }}>14</div>
              <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>Dedicated Cargo Charters</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>B777-Freighters on transpacific lanes</div>
            </div>

            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--brand-emerald)', fontFamily: 'var(--font-mono)' }}>140+</div>
              <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>Direct Airport Gateways</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Seamless customs pre-clearance</div>
            </div>

            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--brand-amber)', fontFamily: 'var(--font-mono)' }}>99.8%</div>
              <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>Peak Delivery SLA</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Continuous real-time audit</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .founder-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
            justify-items: center;
          }
        }
      `}</style>
    </div>
  );
}
