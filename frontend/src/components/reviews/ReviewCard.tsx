'use client';

import { Star } from 'lucide-react';
import type { Review } from '@/types';

interface Props {
  review: Review;
}

export function ReviewCard({ review }: Props) {
  const dateStr = new Date(review.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const initials = review.reviewer_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-xl bg-white shadow-sm">
      <div className="flex items-center gap-4">
        {review.reviewer_avatar ? (
          <img 
            src={review.reviewer_avatar} 
            alt={review.reviewer_name} 
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
            {initials}
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-semibold">{review.reviewer_name}</span>
          <span className="text-sm text-gray-500">{dateStr}</span>
        </div>
      </div>
      
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < review.rating ? 'fill-black text-black' : 'text-gray-300'}`} 
          />
        ))}
      </div>
      
      <p className="text-gray-700 line-clamp-4 leading-relaxed">
        {review.comment}
      </p>
    </div>
  );
}
