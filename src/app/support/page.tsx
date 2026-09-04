'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Headphones,
  Bot
} from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
  category: 'Tracking' | 'Customs' | 'Pricing' | 'Claims';
}

const FAQS: FAQ[] = [
  {
    category: 'Tracking',
    q: 'How frequently is waypoint telemetry updated for air and ocean shipments?',
    a: 'Air express shipments transmit telemetry every 60 seconds via onboard satellite transponders, updating altitude, GPS coordinates, and temperature. Ocean containers update every 2 hours via satellite AIS and automated port gate scans.',
  },
  {
    category: 'Customs',
    q: 'How does Double 7 Fast-Track customs pre-clearance work?',
    a: 'Our cloud platform electronically transmits commercial invoices, HS codes, and security declarations to border authorities (US CBP, EU ICS2, UK HMRC) while your cargo is still in flight. Over 94% of consignments receive automated green-channel release before touchdown.',
  },
  {
    category: 'Pricing',
    q: 'What is the difference between actual gross weight and volumetric weight?',
    a: 'International freight uses the IATA standard divisor of 5,000 for air cargo (Length x Width x Height in cm divided by 5,000). The billable weight is whichever number is greater between actual gross weight and volumetric weight.',
  },
  {
    category: 'Claims',
    q: 'What is the Double 7 Peak Surge On-Time Guarantee?',
    a: 'If a consignment booked under Double 7 Super Express fails to arrive within its guaranteed service SLA window due to non-force-majeure airline operations, we issue an automatic 100% freight refund plus a 20% future booking credit.',
  },
  {
    category: 'Customs',
    q: 'Can I ship lithium batteries or high-tech equipment with Double 7?',
    a: 'Yes, we are fully certified under IATA Dangerous Goods Regulations (DGR) to transport Section II lithium ion (UN3481) and metal batteries (UN3091) on our dedicated Boeing 777F cargo aircraft.',
  },
];

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Live Chat Simulator state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'agent' | 'user'; text: string; time: string }>>([
    {
      sender: 'agent',
      text: 'Hello! I am your Double 7 Dispatch Assistant. How can I help you with your consignment, customs clearance, or freight rate today?',
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Contact Form state
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMsg = { sender: 'user' as const, text: userText, time: 'Just now' };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Generate intelligent logistics response
    setTimeout(() => {
      let reply = 'Thank you for reaching out. Our dispatch command has logged your inquiry. For immediate urgent flight manifests, you can also view the Operations Tower.';
      const lower = userText.toLowerCase();

      if (lower.includes('track') || lower.includes('where') || lower.includes('d7') || lower.includes('d11') || lower.includes('awb')) {
        reply = 'You can track any consignment in real-time by clicking "Tracking Center" in the top navigation or entering your tracking or Airway Bill (AWB) number!';
      } else if (lower.includes('rate') || lower.includes('cost') || lower.includes('price')) {
        reply = 'Our dynamic rate estimator calculates exact volumetric pricing based on origin, destination, and dimensions. Check out the "Rates & Tariffs" page for instant quotes.';
      } else if (lower.includes('customs') || lower.includes('duty') || lower.includes('tax')) {
        reply = 'Double 7 provides automated green-channel customs pre-clearance with US CBP, EU ICS2, and UK border force so consignments clear while still airborne.';
      } else if (lower.includes('soben') || lower.includes('founder')) {
        reply = 'Double 7 Logistics was founded and architected by Soben (@soben01) to provide frictionless, high-velocity freight infrastructure for modern global trade.';
      }

      setChatMessages(prev => [...prev, { sender: 'agent', text: reply, time: 'Just now' }]);
    }, 600);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const filteredFaqs = activeCategory === 'ALL'
    ? FAQS
    : FAQS.filter(f => f.category === activeCategory);

  return (
    <div style={{ padding: '3.5rem 0 6rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
            <Headphones size={13} /> 24/7 Global Dispatch &amp; Support
          </div>
          <h1>How Can We Help You?</h1>
          <p style={{ maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
            Round-the-clock air cargo operations assistance, customs compliance advice, and instantaneous live dispatch support.
          </p>
        </div>

        {/* Support Grid: Live Chat + Contact Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2.5rem', marginBottom: '4.5rem' }} className="support-grid">
          {/* Left: Interactive Live Dispatch Chat Assistant */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--brand-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                    Double 7 Dispatch Bot
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--brand-emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span className="pulse-dot pulse-dot-green" style={{ width: 6, height: 6 }} /> Connected to Global HQ
                  </div>
                </div>
              </div>
              <span className="badge badge-subtle" style={{ fontSize: '0.7rem' }}>Avg Reply: &lt;1s</span>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    backgroundColor: msg.sender === 'user' ? 'var(--brand-orange)' : 'var(--bg-surface)',
                    color: '#ffffff',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                    lineHeight: '1.5'
                  }}
                >
                  <div>{msg.text}</div>
                  <div style={{
                    fontSize: '0.68rem',
                    color: msg.sender === 'user' ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
                    textAlign: 'right',
                    marginTop: '0.25rem'
                  }}>
                    {msg.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about customs, rates, tracking, or founder..."
                className="input-field"
                style={{ fontSize: '0.88rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0 1.25rem' }}>
                <Send size={15} />
              </button>
            </form>
          </div>

          {/* Right: Direct Priority Inquiry Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={18} color="var(--brand-orange)" />
              <span>Priority Consignment Inquiry</span>
            </h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Directly contact our senior air freight dispatchers for high-value cargo, charter bookings, or customs resolution.
            </p>

            {contactSubmitted ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px'
              }}>
                <CheckCircle2 size={40} color="var(--brand-emerald)" style={{ margin: '0 auto 1rem auto' }} />
                <h4>Inquiry Logged Successfully!</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  A priority dispatch manager has been alerted and will respond within 15 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setContactSubmitted(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '1.25rem' }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" defaultValue="Elena Rostova" className="input-field" required />
                </div>

                <div className="input-group">
                  <label className="input-label">Business Email</label>
                  <input type="email" placeholder="you@company.com" className="input-field" required />
                </div>

                <div className="input-group">
                  <label className="input-label">AWB or Consignment ID (Optional)</label>
                  <input type="text" placeholder="e.g. CP002994035NP" className="input-field" />
                </div>

                <div className="input-group">
                  <label className="input-label">Message Details</label>
                  <textarea rows={3} placeholder="Provide details regarding your cargo or customs inquiry..." className="textarea-field" required />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  <span>Submit to Dispatch Center</span>
                  <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Searchable FAQ Accordion */}
        <div className="glass-panel" style={{ padding: '3rem 2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Frequently Asked Questions</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Everything you need to know about Double 7 Logistics shipping protocols, volumetric weights, and SLAs.
            </p>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              {['ALL', 'Tracking', 'Customs', 'Pricing', 'Claims'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '840px', margin: '0 auto' }}>
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.98rem',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ color: 'var(--brand-orange)', marginLeft: '1rem' }}>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 850px) {
          .support-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
