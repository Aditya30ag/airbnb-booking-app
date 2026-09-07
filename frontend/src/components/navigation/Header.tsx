'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Globe, Menu, User as UserIcon, 
  Heart, Calendar, PlusCircle, LogOut, Sparkles, X, Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  onSearch?: (searchParams: { city?: string; guests?: number }) => void;
  showHeroSearch?: boolean;
}

export function Header({ onSearch, showHeroSearch = false }: Props) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(!showHeroSearch);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [guestsInput, setGuestsInput] = useState(1);

  const menuRef = useRef<HTMLDivElement>(null);

  const {
    user,
    isHost,
    isAuthenticated,
    becomeHost,
    logout,
    openAuthModal,
  } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveUser = mounted ? user : null;
  const effectiveIsHost = mounted && isHost;
  const effectiveIsAuthenticated = mounted && isAuthenticated;

  // IntersectionObserver or scroll listener for collapsed pill
  useEffect(() => {
    if (!showHeroSearch) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showHeroSearch]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSearch) {
      onSearch({
        city: cityInput.trim() || undefined,
        guests: guestsInput > 1 ? guestsInput : undefined,
      });
    } else {
      const params = new URLSearchParams();
      if (cityInput.trim()) params.set('city', cityInput.trim());
      if (guestsInput > 1) params.set('guests', guestsInput.toString());
      router.push(`/?${params.toString()}`);
    }
    setMobileSearchOpen(false);
  };

  const handleHostButtonClick = async () => {
    if (!isAuthenticated) {
      openAuthModal({ initialTab: 'login', defaultRole: 'host' });
      return;
    }
    try {
      await becomeHost();
      router.push('/host');
    } catch {
      // toast is displayed in becomeHost
    }
  };

  const handleSignOut = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-shadow duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] rounded-xl p-1">
            <svg
              className="w-8 h-8 text-[#FF5A5F]"
              viewBox="0 0 32 32"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.447l.011.37c0 4.258-3.197 7.7-7.5 7.7-2.612 0-4.664-1.258-5.998-3.076-1.335 1.818-3.388 3.076-6.002 3.076-4.303 0-7.5-3.442-7.5-7.7 0-1.267.362-2.528 1.116-4.17l.535-1.127C3.99 15.35 8.09 6.7 9.878 3.208A5.728 5.728 0 0 1 14.877 1H16zm0 2.2c-.886 0-1.572.417-2.28 1.761l-.317.632C11.517 9.303 7.42 17.94 5.485 22.03c-.63 1.38-.916 2.376-.916 3.27 0 3.033 2.228 5.5 5.431 5.5 2.122 0 3.864-1.144 4.887-3.238l.413-.912.7.75c1.028 2.062 2.766 3.4 4.887 3.4 3.203 0 5.431-2.467 5.431-5.5 0-.894-.286-1.89-.916-3.27l-.462-1.018C22.95 17.06 18.91 8.528 16.924 4.606l-.21-.397C16.31 3.414 15.886 3.2 16 3.2z" />
            </svg>
            <span className="font-bold text-xl text-[#FF5A5F] tracking-tight hidden sm:inline">airbnb</span>
          </Link>

          {/* Center Search Pill (Desktop) */}
          <div className="hidden md:flex items-center">
            {isScrolled ? (
              <button
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Search destinations"
                className="flex items-center gap-3 border border-gray-200 shadow-sm hover:shadow-md transition rounded-full py-2 px-4 text-sm font-medium text-gray-800 bg-white"
              >
                <span className="px-2">Anywhere</span>
                <span className="h-4 w-px bg-gray-200" />
                <span className="px-2">Any week</span>
                <span className="h-4 w-px bg-gray-200" />
                <span className="px-2 text-gray-500 font-normal">Add guests</span>
                <div className="w-8 h-8 rounded-full bg-[#FF5A5F] flex items-center justify-center text-white">
                  <Search className="w-4 h-4" />
                </div>
              </button>
            ) : null}
          </div>

          {/* Mobile Search Button (Compact) */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search destinations"
            className="md:hidden flex-1 flex items-center gap-3 border border-gray-200 shadow-sm rounded-full py-2.5 px-4 text-left bg-white"
          >
            <Search className="w-4 h-4 text-gray-700" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-900">Where to?</span>
              <span className="text-[11px] text-gray-400">Anywhere · Any week · Add guests</span>
            </div>
          </button>

          {/* Right Nav Menu */}
          <div className="flex items-center gap-2 relative">
            {effectiveIsHost ? (
              <Link
                href="/host"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-full px-4 py-2.5 transition border border-gray-200 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Host Dashboard
              </Link>
            ) : effectiveIsAuthenticated ? (
              <button
                onClick={handleHostButtonClick}
                className="hidden sm:inline-block text-sm font-semibold text-[#FF5A5F] hover:bg-rose-50 rounded-full px-4 py-2.5 transition"
              >
                Switch to Hosting
              </button>
            ) : (
              <button
                onClick={() => openAuthModal({ initialTab: 'login', defaultRole: 'host' })}
                className="hidden sm:inline-block text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-full px-4 py-2.5 transition"
              >
                Airbnb your home
              </button>
            )}

            {/* Profile Dropdown Trigger */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-label="User navigation menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-3 border border-gray-200 rounded-full p-2 hover:shadow-md transition bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
              >
                <Menu className="w-4 h-4 text-gray-600 ml-1" />
                {effectiveUser?.avatar_url ? (
                  <img
                    src={effectiveUser.avatar_url}
                    alt={effectiveUser.full_name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-600 text-white flex items-center justify-center font-semibold text-xs overflow-hidden">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-sm">
                  {effectiveIsAuthenticated && effectiveUser ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                        {effectiveUser.avatar_url ? (
                          <img
                            src={effectiveUser.avatar_url}
                            alt={effectiveUser.full_name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#FF5A5F]/10 text-[#FF5A5F] flex items-center justify-center font-bold text-sm shrink-0">
                            {effectiveUser.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{effectiveUser.full_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                effectiveIsHost
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {effectiveIsHost ? 'Host' : 'Guest'}
                            </span>
                            <span className="text-xs text-gray-400 truncate">{effectiveUser.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Host-only links: ONLY show if effectiveIsHost is true */}
                      {effectiveIsHost && (
                        <>
                          <Link
                            href="/host"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-900 font-semibold hover:bg-gray-50 transition"
                          >
                            <PlusCircle className="w-4 h-4 text-[#FF5A5F]" />
                            Host Dashboard
                          </Link>
                          <Link
                            href="/host/listings/new"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                          >
                            <Sparkles className="w-4 h-4 text-gray-400" />
                            Create new listing
                          </Link>
                          <div className="h-px bg-gray-100 my-1" />
                        </>
                      )}

                      <Link
                        href="/trips"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition font-medium"
                      >
                        <Calendar className="w-4 h-4 text-gray-500" />
                        My Trips
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition font-medium"
                      >
                        <Heart className="w-4 h-4 text-gray-500" />
                        Wishlist
                      </Link>

                      {!effectiveIsHost && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleHostButtonClick();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition font-medium text-left"
                        >
                          <Sparkles className="w-4 h-4 text-[#FF5A5F]" />
                          Activate Host Mode
                        </button>
                      )}

                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition font-medium text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          openAuthModal({ initialTab: 'signup' });
                        }}
                        className="w-full text-left px-4 py-3 text-gray-900 font-bold hover:bg-gray-50 transition"
                      >
                        Sign up
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          openAuthModal({ initialTab: 'login' });
                        }}
                        className="w-full text-left px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 transition"
                      >
                        Log in
                      </button>
                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          openAuthModal({ initialTab: 'signup', defaultRole: 'host' });
                        }}
                        className="w-full text-left px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 transition"
                      >
                        Airbnb your home
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          openAuthModal({ initialTab: 'login' });
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-[#FF5A5F] font-semibold hover:bg-rose-50 transition flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Demo 1-Click Accounts
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal / Expandable Dialog */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full mx-auto p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-lg text-gray-900">Search stays</h3>
              <button
                onClick={() => setMobileSearchOpen(false)}
                aria-label="Close search"
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
              <div className="border border-gray-200 rounded-2xl p-4 focus-within:ring-2 focus-within:ring-[#FF5A5F]">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Destination</label>
                <input
                  type="text"
                  placeholder="Where are you going? (e.g. Goa, Delhi, Mumbai)"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full text-base font-medium outline-none bg-transparent"
                  autoFocus
                />
              </div>

              <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500">Guests</label>
                  <span className="text-sm font-medium text-gray-700">{guestsInput} {guestsInput === 1 ? 'guest' : 'guests'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuestsInput((prev) => Math.max(1, prev - 1))}
                    disabled={guestsInput <= 1}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="font-semibold text-sm w-4 text-center">{guestsInput}</span>
                  <button
                    type="button"
                    onClick={() => setGuestsInput((prev) => prev + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCityInput('');
                    setGuestsInput(1);
                    if (onSearch) onSearch({});
                    setMobileSearchOpen(false);
                  }}
                  className="flex-1 py-3.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Clear all
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#FF5A5F] hover:bg-[#E0484D] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md"
                >
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
