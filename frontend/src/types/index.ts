export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_host: boolean;
  role: string;
}

export interface AmenityResponse {
  id: string;
  name: string;
  icon?: string;
  category?: string;
}

export interface ListingImageResponse {
  id: string;
  url: string;
  is_cover: boolean;
  display_order: number;
}

export interface ListingCardResponse {
  id: string;
  title: string;
  city: string;
  state?: string;
  country: string;
  property_type?: string;
  price_per_night: number;
  cleaning_fee: number;
  rating_avg: number;
  review_count: number;
  is_active: boolean;
  cover_image_url?: string;
  host_id: string;
}

export interface ListingDetailResponse {
  id: string;
  host_id: string;
  title: string;
  description?: string;
  property_type?: string;
  room_type?: string;
  max_guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  price_per_night: number;
  cleaning_fee: number;
  address?: string;
  city: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  rating_avg: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
  images: ListingImageResponse[];
  amenities: AmenityResponse[];
  host: User;
}

export interface PaginatedListings {
  items: ListingCardResponse[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface Review {
  id: string;
  listing_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface BlockedRange {
  start: string;
  end: string;
}

export interface AvailabilityResponse {
  blocked_ranges: BlockedRange[];
}

export interface DateRange {
  checkIn: Date | null;
  checkOut: Date | null;
}

export interface PriceBreakdown {
  nights: number;
  pricePerNight: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
}

export interface BookingResponse {
  id: string;
  listing_id: string;
  guest_id: string;
  host_id: string;
  check_in: string;  // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  guests: number;
  nights: number;
  price_per_night: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  listing_title?: string;
  listing_city?: string;
  listing_cover_image_url?: string;
}

export interface WishlistResponse {
  items: ListingCardResponse[];
  count: number;
}

export interface WishlistIdsResponse {
  ids: string[];
}

export interface HostListingResponse {
  id: string;
  title: string;
  city: string;
  state?: string;
  country: string;
  property_type?: string;
  price_per_night: number;
  cleaning_fee: number;
  rating_avg: number;
  review_count: number;
  is_active: boolean;
  cover_image_url?: string;
  booking_count: number;
}

export interface HostBookingResponse {
  id: string;
  listing_id: string;
  guest_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  price_per_night: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  listing_title?: string;
  listing_city?: string;
  listing_cover_image_url?: string;
  guest_name?: string;
  guest_email?: string;
  guest_avatar?: string;
}

export interface HostStatsResponse {
  total_listings: number;
  active_listings: number;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  total_revenue: number;
}

export interface ListingFormData {
  title: string;
  description: string;
  property_type: string;
  room_type: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  price_per_night: string;
  cleaning_fee: string;
  amenity_ids: string[];
  images: ImageEntry[];
}

export interface ImageEntry {
  url: string;
  is_cover: boolean;
  display_order: number;
}
