'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and redirect
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then((data) => {
        if (data.data.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/shop');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0d15, #1a1625)',
    }}>
      <div className="pulse-glow" style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #c45680, #e879a0)',
      }} />
    </div>
  );
}
