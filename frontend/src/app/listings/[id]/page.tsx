'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListing } from '@/hooks/useListing';
import { useChat } from '@/context/ChatContext';
import { ImageGallery } from '@/components/listings/ImageGallery';
import { AmenityList } from '@/components/listings/AmenityList';
import { BookingCard } from '@/components/booking/BookingCard';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { Header } from '@/components/navigation/Header';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { MapPin, Users, Bed, Bath, Star, Share, Award } from 'lucide-react';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { listing, blockedRanges, loading, error } = useListing(id);
  const { setCurrentListingId } = useChat();

  useEffect(() => {
    setCurrentListingId(id);
    return () => setCurrentListingId(null);
  }, [id, setCurrentListingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="w-3/4 h-8 bg-gray-200 rounded-lg mb-4" />
          <div className="w-1/3 h-5 bg-gray-200 rounded mb-6" />
          <div className="w-full h-[440px] bg-gray-200 rounded-3xl mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-6">
              <div className="w-1/2 h-7 bg-gray-200 rounded-lg" />
              <div className="w-full h-32 bg-gray-200 rounded-2xl" />
              <div className="w-full h-48 bg-gray-200 rounded-2xl" />
            </div>
            <div className="md:col-span-1">
              <div className="w-full h-[420px] bg-gray-200 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Listing not found</h1>
          <p className="text-gray-500 mb-8">{error || "The listing you're looking for doesn't exist or is inactive."}</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3.5 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            Explore other homes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 md:pb-16 animate-fade-in">
        
        {/* Title & Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-4 gap-y-1">
              <div className="flex items-center font-semibold text-gray-900">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500 mr-1" />
                {listing.rating_avg > 0 ? listing.rating_avg.toFixed(2) : 'New'} ·{' '}
                <span className="underline ml-1 font-normal text-gray-600">{listing.review_count} reviews</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                {listing.city}, {listing.state ? `${listing.state}, ` : ''}{listing.country}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: listing.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              aria-label="Share listing"
              className="flex items-center gap-1.5 text-sm font-semibold underline p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <Share className="w-4 h-4" /> Share
            </button>
            <div className="flex items-center gap-1 text-sm font-semibold underline p-1 hover:bg-gray-100 rounded-xl transition">
              <FavoriteButton listingId={listing.id} isWishlisted={false} />
              <span className="pr-2">Save</span>
            </div>
          </div>
        </div>

        {/* Hero Gallery */}
        <ImageGallery images={listing.images || []} />

        {/* Details Grid (Responsive: 1 col on mobile, 2 cols on desktop) */}
        <div className="mt-8 flex flex-col md:flex-row gap-12">
          
          {/* Left Column (60%) */}
          <div className="w-full md:w-[60%] flex flex-col gap-8">
            
            {/* Host Banner & Room Specs */}
            <div className="py-4 border-b flex justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {listing.room_type || 'Entire place'} hosted by {listing.host?.full_name || 'Host'}
                </h2>
                <div className="flex flex-wrap items-center text-gray-600 gap-x-3 gap-y-1 text-sm mt-2 font-medium">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4 text-gray-400" /> {listing.max_guests} guests</span> ·
                  <span className="flex items-center gap-1"><Bed className="w-4 h-4 text-gray-400" /> {listing.bedrooms} bedrooms</span> ·
                  <span className="flex items-center gap-1"><Bed className="w-4 h-4 text-gray-400" /> {listing.beds} beds</span> ·
                  <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-gray-400" /> {listing.bathrooms} baths</span>
                </div>
              </div>

              {listing.host?.avatar_url ? (
                <img
                  src={listing.host.avatar_url}
                  alt={listing.host.full_name}
                  className="w-14 h-14 rounded-full object-cover border shadow-sm shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#FF5A5F]/10 text-[#FF5A5F] flex items-center justify-center font-bold text-lg shrink-0">
                  {listing.host?.full_name?.charAt(0) || 'H'}
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="py-2 border-b">
                <h3 className="text-lg font-bold text-gray-900 mb-3">About this space</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            <div className="border-b pb-8">
              <AmenityList amenities={listing.amenities || []} />
            </div>

            {/* Reviews Section */}
            <div>
              <ReviewSection
                listingId={listing.id}
                rating={listing.rating_avg}
                reviewCount={listing.review_count}
              />
            </div>
          </div>

          {/* Right Column (40%): Sticky Booking Card on Desktop */}
          <div className="w-full md:w-[40%]">
            <BookingCard listing={listing} blockedRanges={blockedRanges} />
          </div>
        </div>
      </main>
    </div>
  );
}
