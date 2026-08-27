'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (token) {
        router.push('/logs');
      } else {
        router.push('/login');
      }
    }
  }, [token, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090d16] text-[#e2e8f0]">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-xs text-slate-400 font-medium">Loading Sentinel Operations Desk...</p>
      </div>
    </div>
  );
}
