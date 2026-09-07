'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, User as UserIcon, Home, Compass, Loader2, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/authApi';
import type { User } from '@/types';

export function AuthModal() {
  const {
    user,
    isAuthenticated,
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    authModalRole,
    setAuthModalRole,
    login,
    signup,
    becomeHost,
    logout,
  } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isHostRole, setIsHostRole] = useState(authModalRole === 'host');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Demo users state
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [loadingDemoUsers, setLoadingDemoUsers] = useState(false);

  useEffect(() => {
    setIsHostRole(authModalRole === 'host');
  }, [authModalRole]);

  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMsg('');
      setLoadingDemoUsers(true);
      authApi
        .getDemoUsers()
        .then((users) => setDemoUsers(users || []))
        .catch(() => setDemoUsers([]))
        .finally(() => setLoadingDemoUsers(false));
    }
  }, [isAuthModalOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (authModalTab === 'signup' && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      if (authModalTab === 'signup') {
        await signup({
          email: email.trim(),
          full_name: fullName.trim(),
          is_host: isHostRole,
        });
      } else {
        await login(email.trim());
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSignIn = async (demoEmail: string) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await login(demoEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in demo user');
    } finally {
      setLoading(false);
    }
  };

  const demoHosts = demoUsers.filter((u) => u.is_host);
  const demoGuests = demoUsers.filter((u) => !u.is_host);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900 tracking-tight">
              {isAuthenticated && user
                ? 'Your Account'
                : authModalTab === 'login'
                ? 'Welcome to Airbnb'
                : 'Create your Airbnb account'}
            </span>
          </div>
          <button
            onClick={closeAuthModal}
            aria-label="Close modal"
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAuthenticated && user ? (
          /* Already Logged In: Never show create/login form */
          <div className="p-6 space-y-6 text-center">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-20 h-20 rounded-full object-cover mx-auto shadow-sm border border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#FF5A5F]/10 text-[#FF5A5F] flex items-center justify-center font-bold text-2xl mx-auto">
                {user.full_name?.charAt(0) || 'U'}
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-gray-900">{user.full_name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
              <div className="mt-2">
                <span
                  className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    user.is_host
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {user.is_host ? 'Host Account' : 'Guest Account'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 max-w-sm mx-auto">
              {!user.is_host && (
                <button
                  type="button"
                  onClick={async () => {
                    await becomeHost();
                    closeAuthModal();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#FF5A5F] hover:bg-[#E0484D] active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Activate Host Mode (1-Click)
                </button>
              )}

              <button
                type="button"
                onClick={closeAuthModal}
                className="w-full py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-sm transition"
              >
                Continue to Airbnb
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setAuthModalTab('login');
                }}
                className="w-full py-2 text-xs font-semibold text-rose-600 hover:underline transition"
              >
                Sign out or switch account
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 border-b border-gray-100 p-1.5 bg-gray-50/80 mx-6 mt-5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('login');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${
              authModalTab === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('signup');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${
              authModalTab === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-center gap-2">
              <span className="font-semibold">Notice:</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authModalTab === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/20 text-sm font-medium outline-none transition"
                    />
                  </div>
                </div>

                {/* Account Type Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    I want to use Airbnb as:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsHostRole(false)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 relative ${
                        !isHostRole
                          ? 'border-[#FF5A5F] bg-rose-50/40 ring-1 ring-[#FF5A5F]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {!isHostRole && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#FF5A5F] text-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <Compass className="w-4 h-4 text-[#FF5A5F]" />
                        Guest
                      </div>
                      <p className="text-xs text-gray-500 leading-snug">
                        Explore places, make reservations & save wishlists
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsHostRole(true)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 relative ${
                        isHostRole
                          ? 'border-[#FF5A5F] bg-rose-50/40 ring-1 ring-[#FF5A5F]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isHostRole && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#FF5A5F] text-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <Home className="w-4 h-4 text-[#FF5A5F]" />
                        Host
                      </div>
                      <p className="text-xs text-gray-500 leading-snug">
                        List homes, manage bookings & access Host Dashboard
                      </p>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/20 text-sm font-medium outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#FF5A5F] hover:bg-[#E0484D] active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {authModalTab === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : authModalTab === 'login' ? (
                'Continue to Airbnb'
              ) : isHostRole ? (
                'Create Host Account'
              ) : (
                'Create Guest Account'
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                1-Click Quick Demo Accounts
              </span>
            </div>

            {loadingDemoUsers ? (
              <div className="h-14 bg-gray-50 rounded-2xl animate-pulse" />
            ) : (
              <div className="space-y-2">
                {/* Host Demo */}
                {demoHosts.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 mb-1">Host accounts:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {demoHosts.slice(0, 2).map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickSignIn(h.email)}
                          className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-rose-50/50 hover:border-rose-200 text-left transition text-xs group"
                        >
                          <img
                            src={h.avatar_url || `https://i.pravatar.cc/150?u=${h.id}`}
                            alt={h.full_name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div className="flex-1 truncate">
                            <div className="font-semibold text-gray-900 group-hover:text-[#FF5A5F] truncate">
                              {h.full_name}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">Host Dashboard Access</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF5A5F] shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guest Demo */}
                {demoGuests.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[11px] font-semibold text-gray-400 mb-1">Guest accounts:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {demoGuests.slice(0, 2).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickSignIn(g.email)}
                          className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition text-xs group"
                        >
                          <img
                            src={g.avatar_url || `https://i.pravatar.cc/150?u=${g.id}`}
                            alt={g.full_name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div className="flex-1 truncate">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                              {g.full_name}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">Traveler & Explorer</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
