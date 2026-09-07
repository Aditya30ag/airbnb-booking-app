'use client';

import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { ReviewCard } from './ReviewCard';
import { reviewApi } from '@/services/reviewApi';
import type { Review } from '@/types';

interface Props {
  listingId: string;
  rating: number;
  reviewCount: number;
}

export function ReviewSection({ listingId, rating, reviewCount }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    reviewApi.getForListing(listingId)
      .then((data) => setReviews(data.items || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) {
    return <div className="py-8 animate-pulse bg-gray-100 h-32 rounded-xl mt-8"></div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="py-8 border-t mt-8">
        <h2 className="text-2xl font-semibold mb-2">No reviews (yet)</h2>
        <p className="text-gray-500">This host has no reviews for this place.</p>
      </div>
    );
  }

  const displayReviews = showAll ? reviews : reviews.slice(0, 6);

  return (
    <div className="py-8 border-t mt-8">
      <div className="flex items-center gap-2 text-2xl font-semibold mb-8">
        <Star className="w-6 h-6 fill-black text-black" />
        <span>{rating.toFixed(2)} · {reviewCount} reviews</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {!showAll && reviews.length > 6 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-8 px-6 py-3 border border-black rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Show all {reviews.length} reviews
        </button>
      )}

      {showAll && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center">
              <button onClick={() => setShowAll(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold flex-1 text-center pr-9">
                <Star className="w-4 h-4 inline fill-black text-black mr-1" />
                {rating.toFixed(2)} · {reviewCount} reviews
              </h3>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 gap-6">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
