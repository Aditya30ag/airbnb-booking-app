'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/navigation/Header';
import { CategoryBar } from '@/components/navigation/CategoryBar';
import { ListingCard } from '@/components/ui/ListingCard';
import { listingService } from '@/services/listingService';
import { wishlistApi } from '@/services/wishlistApi';
import type { ListingCardResponse } from '@/types';
import { Search, SlidersHorizontal, MapPin, Sparkles, Map as MapIcon, List } from 'lucide-react';
import dynamic from 'next/dynamic';

const ExploreMap = dynamic(() => import('@/components/map/ExploreMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[650px] bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400 font-medium">
      Loading interactive map...
    </div>
  ),
});

export default function LandingExplorePage() {
  const [listings, setListings] = useState<ListingCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchParams, setSearchParams] = useState<{ city?: string; guests?: number }>({});
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Fetch wishlisted listing IDs for current user
  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    if (userId) {
      wishlistApi.getIds()
        .then((res) => setWishlistedIds(new Set(res.ids)))
        .catch(() => {});
    }
  }, []);

  // Fetch listings with category/search filters
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const query: Record<string, string> = {
        limit: '24',
        page: '1',
      };
      if (searchParams.city) {
        query.city = searchParams.city;
      }
      if (searchParams.guests) {
        query.guests = searchParams.guests.toString();
      }
      if (selectedCategory !== 'all') {
        query.property_type = selectedCategory;
      }

      const res = await listingService.search(query);
      const seen = new Set<string>();
      const uniqueItems = (res.items || []).filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      setListings(uniqueItems);
      setHasNext(res.has_next);
    } catch (err) {
      console.error('Failed to load listings', err);
      setListings([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [searchParams, selectedCategory]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const query: Record<string, string> = {
        limit: '24',
        page: nextPage.toString(),
      };
      if (searchParams.city) query.city = searchParams.city;
      if (searchParams.guests) query.guests = searchParams.guests.toString();
      if (selectedCategory !== 'all') query.property_type = selectedCategory;

      const res = await listingService.search(query);
      setListings((prev) => {
        const existingIds = new Set(prev.map((l) => l.id));
        const uniqueIncoming = (res.items || []).filter((l) => !existingIds.has(l.id));
        return [...prev, ...uniqueIncoming];
      });
      setPage(nextPage);
      setHasNext(res.has_next);
    } catch (err) {
      console.error('Failed to load more listings', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (newParams: { city?: string; guests?: number }) => {
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Header onSearch={handleSearch} showHeroSearch={true} />

      {/* Categories Bar */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {/* Active Filter Pill Bar */}
        {(searchParams.city || searchParams.guests || selectedCategory !== 'all') && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtered by:</span>
            {searchParams.city && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                <MapPin className="w-3 h-3 text-gray-500" /> City: {searchParams.city}
              </span>
            )}
            {searchParams.guests && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                Guests: {searchParams.guests}+
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-[#FF5A5F] rounded-full text-xs font-medium capitalize">
                {selectedCategory}
              </span>
            )}
            <button
              onClick={() => {
                setSearchParams({});
                setSelectedCategory('all');
              }}
              className="text-xs text-gray-500 underline hover:text-gray-900 ml-2"
            >
              Reset all
            </button>
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          // Skeleton Loading State
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 animate-pulse">
                <div className="aspect-square w-full bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                <div className="h-3.5 bg-gray-200 rounded-md w-1/2" />
                <div className="h-4 bg-gray-200 rounded-md w-1/3 mt-1" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          // Empty State
          <div className="py-24 text-center max-w-md mx-auto flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
              <Search className="w-9 h-9 text-[#FF5A5F]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No exact matches</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Try changing or clearing some of your filters or searching a different city to see available homes.
            </p>
            <button
              onClick={() => {
                setSearchParams({});
                setSelectedCategory('all');
              }}
              className="px-6 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-800 transition"
            >
              Clear all filters
            </button>
          </div>
        ) : viewMode === 'map' ? (
          // Interactive Map View
          <div className="animate-fade-in">
            <ExploreMap
              listings={listings}
              className="w-full h-[calc(100vh-230px)] min-h-[520px]"
            />
          </div>
        ) : (
          // Grid View
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {listings.map((listing, index) => (
                <ListingCard
                  key={`${listing.id}-${index}`}
                  listing={listing}
                  isWishlisted={wishlistedIds.has(listing.id)}
                />
              ))}
            </div>

            {hasNext && (
              <div className="mt-14 mb-6 text-center flex flex-col items-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 bg-black hover:bg-gray-800 text-white font-semibold text-sm rounded-2xl shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {loadingMore ? 'Loading more stays...' : 'Show more stays'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Map / Grid Toggle Pill (Airbnb signature feature) */}
      {!loading && listings.length > 0 && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => {
              setViewMode((prev) => (prev === 'grid' ? 'map' : 'grid'));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-gray-900 hover:bg-black text-white text-sm font-semibold shadow-2xl hover:scale-105 transition-all duration-200 active:scale-95 border border-gray-700 cursor-pointer"
          >
            {viewMode === 'grid' ? (
              <>
                <span>Show map</span>
                <MapIcon className="w-4 h-4 text-white" />
              </>
            ) : (
              <>
                <span>Show list</span>
                <List className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
