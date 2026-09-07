'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { reviewApi } from '@/services/reviewApi';
import type { BookingResponse } from '@/types';

interface Props {
  booking: BookingResponse;
  onClose: () => void;
  onSuccess: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function ReviewModal({ booking, onClose, onSuccess, addToast }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.create(booking.listing_id, {
        booking_id: booking.id,
        rating,
        comment: comment.trim() || undefined,
      });
      addToast('Review submitted successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">How was your stay?</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <p className="font-bold text-gray-900 line-clamp-1">{booking.listing_title}</p>
            <p className="text-xs text-gray-500">{booking.listing_city}</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Overall rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => {
                    setRating(star);
                    setError('');
                  }}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hovered || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 stroke-[1.5]'
                    }`}
                  />
                </button>
              ))}
            </div>
            {error && <p className="text-rose-500 text-xs mt-1.5 font-medium">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
              Public review (optional)
            </label>
            <textarea
              rows={4}
              placeholder="Tell other travelers about your stay, the location, or the host..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#FF5A5F] hover:bg-[#E0484D] text-white font-bold text-sm transition shadow-md disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      </div>
    </div>
  );
}
