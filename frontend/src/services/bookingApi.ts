import { apiClient } from '@/lib/apiClient';
import type { BookingResponse } from '@/types';

export interface CreateBookingData {
  listing_id: string;
  check_in: string;
  check_out: string;
  guests: number;
}

export const bookingApi = {
  create: (data: CreateBookingData) =>
    apiClient<BookingResponse>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) =>
    apiClient<BookingResponse>(`/api/bookings/${id}`),

  getMyTrips: () =>
    apiClient<BookingResponse[]>('/api/bookings/my-trips'),

  confirm: (id: string) =>
    apiClient<BookingResponse>(`/api/bookings/${id}/confirm`, { method: 'PATCH' }),

  cancel: (id: string) =>
    apiClient<BookingResponse>(`/api/bookings/${id}/cancel`, { method: 'PATCH' }),
};
