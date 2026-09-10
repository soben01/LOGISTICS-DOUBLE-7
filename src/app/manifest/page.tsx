'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Boxes, ShieldAlert } from 'lucide-react';
import { getCurrentUser, User } from '../../lib/auth';
import BranchManifestManager from '../../components/manifest/BranchManifestManager';

export default function ManifestPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login?redirect=/manifest');
      return;
    }
    setCurrentUser(user);
    setAuthChecking(false);

    const handleAuth = () => {
      const u = getCurrentUser();
      if (!u) router.push('/login?redirect=/manifest');
      else setCurrentUser(u);
    };
    window.addEventListener('auth-change', handleAuth);
    return () => window.removeEventListener('auth-change', handleAuth);
  }, [router]);

  if (authChecking) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{ width: 50, height: 50, borderRadius: '14px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
          <Boxes size={26} className="animate-pulse" />
        </div>
        <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Loading Branch Manifest Hub...</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh' }}>
      <BranchManifestManager user={currentUser} />
    </div>
  );
}
