'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, CheckCircle, Calendar, IndianRupee, 
  Plus, Pencil, Trash2, Star, MapPin, TrendingUp, Eye 
} from 'lucide-react';
import { hostApi } from '@/services/hostApi';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/navigation/Header';
import { HostGuard } from '@/components/host/HostGuard';
import { useAuth } from '@/context/AuthContext';
import type { HostListingResponse, HostBookingResponse, HostStatsResponse } from '@/types';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-bold text-lg text-gray-900 mb-2">Deactivate listing</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition">
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HostDashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { isHost, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<HostStatsResponse | null>(null);
  const [listings, setListings] = useState<HostListingResponse[]>([]);
  const [bookings, setBookings] = useState<HostBookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [s, l, b] = await Promise.all([
        hostApi.getStats(),
        hostApi.getListings(),
        hostApi.getBookings()
      ]);
      setStats(s);
      setListings(l || []);
      setBookings(b || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to load host dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (isAuthenticated && isHost) {
      fetchAll();
    }
  }, [fetchAll, isAuthenticated, isHost]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await hostApi.deleteListing(deleteTarget);
      addToast('Listing deactivated.', 'success');
      await fetchAll();
    } catch (err: any) {
      addToast(err.message || 'Failed to deactivate listing', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <HostGuard>
      <div className="min-h-screen bg-gray-50/50 flex flex-col">
        <Header />

      {deleteTarget && (
        <ConfirmDialog
          message="This will deactivate the listing. Guests will no longer be able to search or book it."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Host Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your active listings, upcoming reservations, and earnings</p>
          </div>
          <button
            onClick={() => router.push('/host/listings/new')}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF5A5F] hover:bg-[#E0484D] text-white rounded-xl font-bold text-sm transition shadow-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Create new listing
          </button>
        </div>

        {/* 4 Stats Cards (Stacked on mobile, 4-col grid on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-3xl animate-pulse" />
            ))
          ) : (
            <>
              <StatCard
                icon={Building2}
                label="Total Listings"
                value={stats?.total_listings ?? 0}
                color="bg-rose-50 text-[#FF5A5F]"
              />
              <StatCard
                icon={CheckCircle}
                label="Active Listings"
                value={stats?.active_listings ?? 0}
                color="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                icon={Calendar}
                label="Total Bookings"
                value={stats?.total_bookings ?? 0}
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                icon={IndianRupee}
                label="Total Revenue"
                value={fmt(Number(stats?.total_revenue ?? 0))}
                color="bg-amber-50 text-amber-600"
              />
            </>
          )}
        </div>

        {/* Listings Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your properties</h2>
            <span className="text-xs font-semibold text-gray-400">{listings.length} total</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Listing</th>
                    <th className="px-5 py-3.5 hidden md:table-cell">Price / night</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">Bookings</th>
                    <th className="px-5 py-3.5 hidden md:table-cell">Rating</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-10 w-44 bg-gray-200 rounded-lg" /></td>
                        <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full" /></td>
                        <td className="px-5 py-4 hidden sm:table-cell"><div className="h-4 w-8 bg-gray-200 rounded" /></td>
                        <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                        <td className="px-5 py-4 text-right"><div className="h-8 w-16 bg-gray-200 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : listings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 px-4">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-bold text-gray-700">No properties listed yet</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">Start earning as a host by listing your first place.</p>
                        <button
                          onClick={() => router.push('/host/listings/new')}
                          className="px-5 py-2.5 bg-[#FF5A5F] text-white rounded-xl font-semibold text-xs hover:bg-[#E0484D] transition"
                        >
                          Create a listing
                        </button>
                      </td>
                    </tr>
                  ) : (
                    listings.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border">
                              {item.cover_image_url ? (
                                <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-200" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" /> {item.city}, {item.country}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell font-semibold text-gray-900">
                          {fmt(item.price_per_night)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider border ${
                            item.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell font-medium text-gray-600">
                          {item.booking_count}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {item.rating_avg > 0 ? (
                            <span className="flex items-center gap-1 font-semibold text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {item.rating_avg.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">New</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/listings/${item.id}`}
                              aria-label="View listing as guest"
                              title="View listing as guest"
                              className="p-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => router.push(`/host/listings/${item.id}/edit`)}
                              aria-label="Edit listing"
                              title="Edit listing"
                              className="p-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100 transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item.id)}
                              aria-label="Deactivate listing"
                              title="Deactivate listing"
                              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Bookings Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Reservations</h2>
            <span className="text-xs font-semibold text-gray-400">{bookings.length} total</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Listing</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">Guest</th>
                    <th className="px-5 py-3.5 hidden md:table-cell">Dates</th>
                    <th className="px-5 py-3.5 hidden lg:table-cell">Guests</th>
                    <th className="px-5 py-3.5 hidden md:table-cell">Total</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-6 w-36 bg-gray-200 rounded" /></td>
                        <td className="px-5 py-4 hidden sm:table-cell"><div className="h-6 w-24 bg-gray-200 rounded" /></td>
                        <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                        <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                        <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full" /></td>
                      </tr>
                    ))
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 px-4">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-bold text-gray-700">No reservations yet</p>
                        <p className="text-xs text-gray-400 mt-1">Bookings from guests will show up here.</p>
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-5 py-4 font-semibold text-gray-900 line-clamp-1">
                          {b.listing_title}
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell text-gray-700 font-medium">
                          {b.guest_name || 'Guest'}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell text-xs text-gray-600">
                          {fmtDate(b.check_in)} – {fmtDate(b.check_out)} ({b.nights}n)
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-600">
                          {b.guests}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell font-bold text-gray-900">
                          {fmt(b.total)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      </div>
    </HostGuard>
  );
}
