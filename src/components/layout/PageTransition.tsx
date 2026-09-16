'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [animationClass, setAnimationClass] = useState('animate-fade-in');

  useEffect(() => {
    // Whenever the pathname changes, re-trigger the animation
    setAnimationClass('');
    const timer = setTimeout(() => {
      setAnimationClass('animate-fade-in animate-slide-up');
    }, 10);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className={animationClass} style={{ width: '100%' }}>
      {children}
    </div>
  );
}
