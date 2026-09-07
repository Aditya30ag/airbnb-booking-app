import { apiClient } from '@/lib/apiClient';
import type { ListingDetailResponse, PaginatedListings, AmenityResponse, AvailabilityResponse } from '@/types';

export const listingService = {
  getById: (id: string) => apiClient<ListingDetailResponse>(`/api/listings/${id}`),
  search: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient<PaginatedListings>(`/api/listings?${qs}`);
  },
  getAmenities: () => apiClient<AmenityResponse[]>('/api/amenities'),
  getAvailability: (id: string) => apiClient<AvailabilityResponse>(`/api/listings/${id}/availability`),
};
