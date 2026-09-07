'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Lock, Calendar, Users, Moon, CheckCircle, ArrowLeft } from 'lucide-react';
import { bookingApi } from '@/services/bookingApi';
import { PriceBreakdown } from '@/components/booking/PriceBreakdown';
import { useToast } from '@/hooks/useToast';
import { Header } from '@/components/navigation/Header';
import type { BookingResponse, PriceBreakdown as PriceBreakdownType } from '@/types';

export default function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    bookingApi.getById(bookingId)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const handleExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (cardNumber.replace(/\s/g, '').length !== 16) errors.cardNumber = 'Card number must be 16 digits';
    if (!expiry.match(/^\d{2}\/\d{2}$/)) errors.expiry = 'Use MM/YY format';
    if (cvv.length < 3 || cvv.length > 4) errors.cvv = 'CVV must be 3 or 4 digits';
    if (!cardholderName.trim()) errors.cardholderName = 'Cardholder name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await new Promise((res) => setTimeout(res, 1200));
      await bookingApi.confirm(bookingId);
      setSuccess(true);
      addToast('Booking confirmed! Check your trips.', 'success');
      setTimeout(() => router.push('/trips'), 1800);
    } catch (err: any) {
      addToast(err.message || 'Payment simulation failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const inp = (f: string) =>
    `w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent transition ${
      formErrors[f] ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
    }`;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="h-44 bg-gray-200 rounded-3xl" />
              <div className="h-32 bg-gray-200 rounded-3xl" />
            </div>
            <div className="h-96 bg-gray-200 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking unavailable</h2>
          <p className="text-gray-500 mb-6">{error || 'Booking details not found.'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Your trip to {booking.listing_city} has been booked. Redirecting you to your trips...
          </p>
          <button
            onClick={() => router.push('/trips')}
            className="px-8 py-3 bg-[#FF5A5F] hover:bg-[#E0484D] text-white rounded-xl font-bold text-sm transition shadow-md"
          >
            View my trips
          </button>
        </div>
      </div>
    );
  }

  const breakdown: PriceBreakdownType = {
    nights: booking.nights,
    pricePerNight: booking.price_per_night,
    subtotal: booking.subtotal,
    cleaningFee: booking.cleaning_fee,
    serviceFee: booking.service_fee,
    total: booking.total,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            aria-label="Back to listing"
            className="p-2 rounded-full hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Confirm and pay</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Summary & Breakdown */}
          <div className="w-full md:w-[55%] flex flex-col gap-6">
            
            {/* Listing Summary Card */}
            <div className="border border-gray-200 rounded-3xl overflow-hidden p-4 shadow-sm flex gap-4">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border">
                {booking.listing_cover_image_url ? (
                  <img
                    src={booking.listing_cover_image_url}
                    alt={booking.listing_title || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-base text-gray-900 line-clamp-2">{booking.listing_title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{booking.listing_city}</p>
              </div>
            </div>

            {/* Trip Details */}
            <div className="border border-gray-200 rounded-3xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Your trip</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-400 font-bold uppercase text-[11px] tracking-wider">Dates</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {fmtDate(booking.check_in)} – {fmtDate(booking.check_out)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-400 font-bold uppercase text-[11px] tracking-wider">Duration</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
                    <Moon className="w-4 h-4 text-gray-400" />
                    {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 col-span-2 pt-2 border-t">
                  <span className="text-gray-400 font-bold uppercase text-[11px] tracking-wider">Guests</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
                    <Users className="w-4 h-4 text-gray-400" />
                    {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Details */}
            <div className="border border-gray-200 rounded-3xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-3">Price details</h2>
              <PriceBreakdown breakdown={breakdown} />
            </div>
          </div>

          {/* Right Payment Form */}
          <div className="w-full md:w-[45%]">
            <div className="sticky top-28 border border-gray-200 rounded-3xl p-6 shadow-sm bg-white">
              <div className="text-center pb-6 border-b mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Total amount due</p>
                <p className="text-4xl font-black text-gray-900">{fmt(booking.total)}</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Card number</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className={`${inp('cardNumber')} pl-11`}
                    />
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {formErrors.cardNumber && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.cardNumber}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Expiration</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className={inp('expiry')}
                    />
                    {formErrors.expiry && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">CVV</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="123"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className={inp('cvv')}
                    />
                    {formErrors.cvv && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.cvv}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Cardholder name</label>
                  <input
                    type="text"
                    placeholder="Full name on card"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className={inp('cardholderName')}
                  />
                  {formErrors.cardholderName && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.cardholderName}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-[#FF5A5F] hover:bg-[#E0484D] text-white font-bold text-base transition duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                >
                  <Lock className="w-4 h-4" />
                  {submitting ? 'Confirming payment...' : `Confirm & pay ${fmt(booking.total)}`}
                </button>

                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5 pt-1">
                  <Lock className="w-3.5 h-3.5" /> Simulated checkout for demo purposes
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
