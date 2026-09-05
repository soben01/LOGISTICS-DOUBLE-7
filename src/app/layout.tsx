import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MobileBottomNav from '../components/layout/MobileBottomNav';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#060911',
};

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Navbar />
        <main style={{ minHeight: '80vh' }}>
          {children}
        </main>
        <div className="mobile-bottom-nav-spacer" />
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
