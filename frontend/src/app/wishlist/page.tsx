'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Compass } from 'lucide-react';
import { wishlistApi } from '@/services/wishlistApi';
import { ListingCard } from '@/components/ui/ListingCard';
import { Header } from '@/components/navigation/Header';
import type { ListingCardResponse } from '@/types';

export default function WishlistPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    wishlistApi.getAll()
      .then((data) => setListings(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Wishlists</h1>
          <p className="text-sm text-gray-500">
            {listings.length} {listings.length === 1 ? 'saved home' : 'saved homes'}
          </p>
        </div>

        {loading ? (
          // Skeleton Loading Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 animate-pulse">
                <div className="aspect-square w-full bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                <div className="h-3.5 bg-gray-200 rounded-md w-1/2" />
                <div className="h-4 bg-gray-200 rounded-md w-1/3 mt-1" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-rose-500 text-sm">{error}</p>
          </div>
        ) : listings.length === 0 ? (
          // Empty State
          <div className="border border-dashed border-gray-200 rounded-3xl py-24 px-4 text-center max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-5">
              <Heart className="w-8 h-8 text-[#FF5A5F]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              As you search, tap the heart icon to save your favorite places and experiences.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3.5 bg-[#FF5A5F] hover:bg-[#E0484D] text-white rounded-xl font-semibold text-sm transition shadow-md"
            >
              Start exploring
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isWishlisted={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
