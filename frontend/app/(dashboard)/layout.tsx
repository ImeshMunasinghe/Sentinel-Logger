'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Map, BarChart3, FileSpreadsheet, Lock } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] text-[#e2e8f0]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xs text-slate-400">Loading secure logs dashboard...</p>
        </div>
      </div>
    );
  }

  // Guard: if user is not admin, deny access
  if (user && user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] text-[#e2e8f0]">
        <div className="w-full max-w-sm text-center p-6 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
            <Lock size={20} />
          </div>
          <h2 className="text-lg font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Only administrators are authorized to access this dashboard. Officers should use the simulator CLI utility to log inspections.
          </p>
          <Button onClick={logout} className="w-full bg-slate-800 text-slate-205 hover:bg-slate-700 text-xs">
            Log Out & Return
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Checkins Logs', path: '/logs', icon: LayoutDashboard },
    { label: 'Route Map', path: '/map', icon: Map },
    { label: 'Live Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Export Reports', path: '/reports', icon: FileSpreadsheet }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#090d16]">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <span className="font-bold tracking-tight text-white text-base">Sentinel Logger</span>
            </div>
            
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                      isActive
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Desk</p>
              <p className="text-xs font-semibold text-slate-350">{user?.full_name}</p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-red-400 hover:border-red-500/20"
              title="Log Out"
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Pages Body Content */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
