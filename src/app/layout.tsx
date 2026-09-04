import type { Metadata } from 'next';
import '../styles/globals.css';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'DOUBLE 7 LOGISTICS | Next-Gen Global Supply Chain & Air Cargo Network',
  description: 'Enterprise international air express, smart robotic warehousing, and ocean container logistics powered by high-velocity dispatch and real-time telemetry. Founded by Soben.',
  keywords: ['Double 7 Logistics', 'Air Cargo', 'Express Shipping', 'Cross-Border Supply Chain', 'Robotic Fulfillment', 'Global Freight'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Navbar />
        <main style={{ minHeight: '80vh' }}>
          {children}
        </main>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', whiteSpace: 'nowrap' }}>
                DOUBLE <span style={{ color: 'var(--brand-orange)' }}>7</span>
              </span>
        <Footer />
      </body>
    </html>
  );
}
