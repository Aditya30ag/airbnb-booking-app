'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Moon, Users, Star, Compass } from 'lucide-react';
import { bookingApi } from '@/services/bookingApi';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/navigation/Header';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import type { BookingResponse } from '@/types';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

function ConfirmDialog({
  message, onConfirm, onCancel
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel reservation</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Keep stay
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
          >
            Yes, cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function TripCard({
  booking,
  onCancel,
  onReview,
}: {
  booking: BookingResponse;
  onCancel: (id: string) => void;
  onReview: (b: BookingResponse) => void;
}) {
  const router = useRouter();
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatMoney = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row group">
      <div
        onClick={() => router.push(`/listings/${booking.listing_id}`)}
        className="cursor-pointer w-full sm:w-56 h-48 sm:h-auto shrink-0 relative bg-gray-100 overflow-hidden"
      >
        {booking.listing_cover_image_url ? (
          <img
            src={booking.listing_cover_image_url}
            alt={booking.listing_title || 'Listing'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3
              onClick={() => router.push(`/listings/${booking.listing_id}`)}
              className="font-bold text-base text-gray-900 line-clamp-1 cursor-pointer hover:text-[#FF5A5F] transition-colors"
            >
              {booking.listing_title}
            </h3>
            <StatusBadge status={booking.status} />
          </div>

          <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            {booking.listing_city}
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
            </span>
            <span className="flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-gray-400" />
              {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400 block">Total paid</span>
            <span className="font-bold text-base text-gray-900">{formatMoney(booking.total)}</span>
          </div>

          <div className="flex items-center gap-2">
            {(booking.status === 'confirmed' || booking.status === 'pending') && (
              <button
                onClick={() => onCancel(booking.id)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
              >
                Cancel
              </button>
            )}

            {booking.status === 'completed' && (
              <button
                onClick={() => onReview(booking)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-black text-white hover:bg-gray-800 transition flex items-center gap-1.5 shadow-sm"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Write review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<BookingResponse | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      const data = await bookingApi.getMyTrips();
      setBookings(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to load your trips', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      await bookingApi.cancel(cancelTarget);
      addToast('Reservation cancelled successfully.', 'success');
      await fetchTrips();
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel reservation', 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {cancelTarget && (
        <ConfirmDialog
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={fetchTrips}
          addToast={addToast}
        />
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trips</h1>
        <p className="text-sm text-gray-500 mb-8">View and manage your upcoming and completed stays</p>

        {loading ? (
          // Matching shape skeleton loaders
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-3xl p-0 overflow-hidden flex flex-col sm:flex-row animate-pulse">
                <div className="w-full sm:w-56 h-48 sm:h-44 bg-gray-200 shrink-0" />
                <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded-md w-2/3" />
                    <div className="h-4 bg-gray-200 rounded-md w-1/3" />
                    <div className="h-3.5 bg-gray-200 rounded-md w-1/2 mt-3" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded-xl w-1/4 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          // Empty State
          <div className="border border-dashed border-gray-200 rounded-3xl py-20 px-4 text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-5">
              <Compass className="w-8 h-8 text-[#FF5A5F]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">No trips booked... yet!</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Time to dust off your bags and start planning your next great adventure.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3.5 bg-[#FF5A5F] hover:bg-[#E0484D] text-white rounded-xl font-semibold text-sm transition shadow-md"
            >
              Start searching
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {bookings.map((booking) => (
              <TripCard
                key={booking.id}
                booking={booking}
                onCancel={(id) => setCancelTarget(id)}
                onReview={(b) => setReviewTarget(b)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
