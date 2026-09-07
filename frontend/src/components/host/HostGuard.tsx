'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, LogIn, UserPlus, Compass, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/navigation/Header';

interface Props {
  children: React.ReactNode;
}

export function HostGuard({ children }: Props) {
  const { user, isHost, isAuthenticated, loading, becomeHost, openAuthModal } = useAuth();
  const [activating, setActivating] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col">
        <Header />
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded-lg w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-3xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  // If user is not authenticated or not a host, DO NOT show the host dashboard
  if (!isAuthenticated || !isHost) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-[#FF5A5F] flex items-center justify-center mb-6 shadow-sm border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
            Host Access Required
          </h1>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
            {!isAuthenticated ? (
              <>
                You need to be signed in with a <strong>Host</strong> account to access the host dashboard, manage properties, and review bookings.
              </>
            ) : (
              <>
                You are currently signed in as <strong>{user?.full_name}</strong> (<em>Guest account</em>). You can activate hosting on your current account with one click below without creating a new login!
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {isAuthenticated ? (
              // Already logged in: NO create/login button needed! 1-Click activate hosting!
              <>
                <button
                  type="button"
                  disabled={activating}
                  onClick={async () => {
                    setActivating(true);
                    try {
                      await becomeHost();
                    } finally {
                      setActivating(false);
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FF5A5F] hover:bg-[#E0484D] active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {activating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Activating Host Mode...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Activate Host Mode (1-Click)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openAuthModal({ initialTab: 'login' })}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm shadow-sm transition"
                >
                  Switch Account
                </button>
              </>
            ) : (
              // Truly logged out: show Log in / Sign up options
              <>
                <button
                  onClick={() => openAuthModal({ initialTab: 'login', defaultRole: 'host' })}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FF5A5F] hover:bg-[#E0484D] active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Log in as Host
                </button>
                <button
                  onClick={() => openAuthModal({ initialTab: 'signup', defaultRole: 'host' })}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Host Account
                </button>
              </>
            )}

            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Explore Stays
            </Link>
          </div>

          {/* Quick Info Box */}
          {!isAuthenticated && (
            <div className="mt-12 p-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm max-w-md text-left text-xs text-gray-500 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-800">Quick Testing: </span>
                Click &quot;Log in as Host&quot; and pick any of the pre-seeded demo Host accounts (like <em>Arjun Mehta</em> or <em>Priya Sharma</em>) to immediately test the host features!
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Authenticated as host
  return <>{children}</>;
}
