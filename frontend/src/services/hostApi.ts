import { apiClient } from '@/lib/apiClient';
import type { HostListingResponse, HostBookingResponse, HostStatsResponse } from '@/types';

export const hostApi = {
  getListings: () => apiClient<HostListingResponse[]>('/api/host/listings'),
  getBookings: () => apiClient<HostBookingResponse[]>('/api/host/bookings'),
  getStats: () => apiClient<HostStatsResponse>('/api/host/stats'),
  deleteListing: (id: string) =>
    apiClient<{ success: boolean }>(`/api/listings/${id}`, { method: 'DELETE' }),
};
