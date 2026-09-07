import { apiClient } from '@/lib/apiClient';
import type { Review } from '@/types';

export interface CreateReviewData {
  booking_id: string;
  rating: number;
  comment?: string;
}

export const reviewApi = {
  create: (listingId: string, data: CreateReviewData) =>
    apiClient<Review>(`/api/listings/${listingId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getForListing: (listingId: string) =>
    apiClient<{ items: Review[] }>(`/api/reviews?listing_id=${listingId}`),
};
