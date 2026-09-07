'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { PriceBreakdown } from './PriceBreakdown';
import type { ListingDetailResponse, BlockedRange, PriceBreakdown as PriceBreakdownType } from '@/types';

interface Props {
  listing: ListingDetailResponse;
  blockedRanges: BlockedRange[];
}

export function BookingCard({ listing, blockedRanges }: Props) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if a given date string (YYYY-MM-DD) is within any blocked range
  const isDateBlocked = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return blockedRanges.some((range) => {
      const s = new Date(range.start);
      s.setHours(0, 0, 0, 0);
      const e = new Date(range.end);
      e.setHours(0, 0, 0, 0);
      return d >= s && d <= e;
    });
  };

  // Check if range contains blocked dates
  const hasBlockedDatesInRange = (start: string, end: string) => {
    if (!start || !end) return false;
    const s = new Date(start);
    const e = new Date(end);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      if (isDateBlocked(d.toISOString().split('T')[0])) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (checkIn && checkOut) {
      if (new Date(checkOut) <= new Date(checkIn)) {
        setError('Check-out must be after check-in');
      } else if (hasBlockedDatesInRange(checkIn, checkOut)) {
        setError('Selected dates include blocked dates');
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [checkIn, checkOut, blockedRanges]);

  const priceBreakdown = useMemo<PriceBreakdownType | null>(() => {
    if (!checkIn || !checkOut || error) return null;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return null;

    const subtotal = nights * listing.price_per_night;
    const cleaningFee = listing.cleaning_fee || 0;
    const serviceFee = subtotal * 0.12;
    const total = subtotal + cleaningFee + serviceFee;

    return {
      nights,
      pricePerNight: listing.price_per_night,
      subtotal,
      cleaningFee,
      serviceFee,
      total,
    };
  }, [checkIn, checkOut, error, listing]);

  const handleReserve = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      alert('Please sign in to make a reservation');
      return;
    }
    
    if (!checkIn || !checkOut || !priceBreakdown || error) {
      alert('Please complete the dates correctly.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient<{ id: string }>('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          total_price: priceBreakdown.total,
        }),
      });
      router.push(`/checkout/${response.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const content = (
    <div className="flex flex-col gap-4">
      <div className="text-2xl font-semibold">
        ₹{listing.price_per_night} <span className="text-base font-normal text-gray-500">night</span>
      </div>

      <div className="border rounded-xl flex flex-col border-gray-400 overflow-hidden">
        <div className="flex border-b border-gray-400">
          <div className="flex-1 p-3 border-r border-gray-400">
            <label className="block text-[10px] font-bold uppercase text-gray-700">Check-In</label>
            <input 
              type="date" 
              className="w-full text-sm outline-none bg-transparent"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div className="flex-1 p-3">
            <label className="block text-[10px] font-bold uppercase text-gray-700">Check-Out</label>
            <input 
              type="date" 
              className="w-full text-sm outline-none bg-transparent"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>
        <div className="p-3">
          <label className="block text-[10px] font-bold uppercase text-gray-700">Guests</label>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm">{guests} {guests === 1 ? 'guest' : 'guests'}</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black disabled:opacity-50"
                disabled={guests <= 1}
              >-</button>
              <button 
                onClick={() => setGuests(Math.min(listing.max_guests || 10, guests + 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black disabled:opacity-50"
                disabled={guests >= (listing.max_guests || 10)}
              >+</button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {blockedRanges.length > 0 && (
        <div className="text-xs text-gray-500">
          Some dates are blocked and cannot be selected.
        </div>
      )}

      <button
        onClick={handleReserve}
        disabled={loading || !!error || !checkIn || !checkOut}
        className="w-full py-3.5 rounded-lg font-semibold text-white bg-[#FF385C] hover:bg-[#D90B38] transition disabled:opacity-50 mt-2"
      >
        {loading ? 'Reserving...' : 'Reserve'}
      </button>

      {priceBreakdown && (
        <>
          <div className="text-center text-sm text-gray-500 mt-2">You won't be charged yet</div>
          <PriceBreakdown breakdown={priceBreakdown} />
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block sticky top-24 bg-white p-6 rounded-xl border shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
        {content}
      </div>

      {/* Mobile Bottom Bar View */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center justify-between z-40">
        <div className="flex flex-col">
          <div className="font-semibold text-lg">
            ₹{listing.price_per_night} <span className="text-sm font-normal">night</span>
          </div>
          {checkIn && checkOut && priceBreakdown ? (
            <span className="text-xs underline font-semibold mt-1">₹{priceBreakdown.total} total</span>
          ) : (
            <a href="#booking-section" className="text-sm underline font-semibold mt-1">Select dates</a>
          )}
        </div>
        <button
          onClick={() => {
            if (checkIn && checkOut) handleReserve();
            else window.location.hash = '#booking-section';
          }}
          className="px-6 py-3 rounded-lg font-semibold text-white bg-[#FF385C] hover:bg-[#D90B38]"
        >
          {checkIn && checkOut ? 'Reserve' : 'Check availability'}
        </button>
      </div>

      {/* Mobile Form Anchor */}
      <div id="booking-section" className="md:hidden mt-8 pt-8 border-t">
        <h2 className="text-xl font-bold mb-4">Book your stay</h2>
        {content}
      </div>
    </>
  );
}
