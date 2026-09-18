'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import PageTransition from './PageTransition';

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRiderRoute = pathname ? pathname.startsWith('/rider') : false;

  // Strict architectural separation:
  // Rider routes (/rider, /rider/login, /rider/dashboard, etc.) do NOT use public Navbar, Footer, or MobileBottomNav
  if (isRiderRoute) {
    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#050811',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '80vh' }}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <div className="mobile-bottom-nav-spacer" />
      <Footer />
      <MobileBottomNav />
    </>
  );
}
