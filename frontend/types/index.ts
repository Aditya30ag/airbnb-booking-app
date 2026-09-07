export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  hostId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingImage {
  id: string;
  listingId: string;
  url: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
}

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

export interface Review {
  id: string;
  listingId: string;
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  listingId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
