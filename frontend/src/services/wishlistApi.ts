import { apiClient } from '@/lib/apiClient';
import type { WishlistResponse, WishlistIdsResponse } from '@/types';

export const wishlistApi = {
  getAll: () => apiClient<WishlistResponse>('/api/wishlist'),
  getIds: () => apiClient<WishlistIdsResponse>('/api/wishlist/ids'),
  add: (listingId: string) =>
    apiClient<{ id: string; listing_id: string }>(`/api/wishlist/${listingId}`, { method: 'POST' }),
  remove: (listingId: string) =>
    apiClient<{ removed: boolean }>(`/api/wishlist/${listingId}`, { method: 'DELETE' }),
};
