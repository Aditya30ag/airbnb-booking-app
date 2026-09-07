'use client';

import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';
import type { ListingCardResponse } from '@/types';

interface Props {
  listing: ListingCardResponse;
  isWishlisted?: boolean;
  onClick?: () => void;
}

export function ListingCard({ listing, isWishlisted = false, onClick }: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) onClick();
    else router.push(`/listings/${listing.id}`);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`View listing: ${listing.title} in ${listing.city}`}
      className="cursor-pointer group flex flex-col focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] rounded-2xl transition-all duration-300"
    >
      {/* Image Container with subtle scale on hover */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-all duration-300">
        {listing.cover_image_url ? (
          <img
            src={listing.cover_image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm font-medium">No image</span>
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton listingId={listing.id} isWishlisted={isWishlisted} />
        </div>
      </div>

      {/* Info Block */}
      <div className="mt-3 flex flex-col gap-1">
        <div className="flex justify-between items-start gap-2">
          <p className="font-semibold text-[15px] text-gray-900 line-clamp-1 group-hover:text-[#FF5A5F] transition-colors">
            {listing.city}, {listing.country}
          </p>
          {listing.rating_avg > 0 ? (
            <span className="flex items-center gap-1 text-sm font-medium shrink-0 text-gray-900">
              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
              {listing.rating_avg.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-gray-400 font-medium">New</span>
          )}
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-1">{listing.title}</p>
        
        {listing.property_type && (
          <p className="text-xs text-gray-400 capitalize">{listing.property_type.replace('_', ' ')}</p>
        )}

        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-bold text-[15px] text-gray-900">{formatPrice(listing.price_per_night)}</span>
          <span className="text-sm text-gray-500 font-normal">night</span>
        </div>
      </div>
    </div>
  );
}
