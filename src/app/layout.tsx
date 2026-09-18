import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import LogisticsSplashScreen from '../components/layout/LogisticsSplashScreen';
import AppLayoutWrapper from '../components/layout/AppLayoutWrapper';

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'D7 Rider',
  },
  keywords: ['Double 7 Logistics', 'Air Cargo', 'Express Shipping', 'Cross-Border Supply Chain', 'Robotic Fulfillment', 'Global Freight'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <LogisticsSplashScreen />
        <AppLayoutWrapper>
          {children}
        </AppLayoutWrapper>
      </body>
    </html>
  );
}
