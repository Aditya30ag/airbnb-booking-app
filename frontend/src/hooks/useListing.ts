'use client';

import { useState, useEffect } from 'react';
import { listingService } from '@/services/listingService';
import type { ListingDetailResponse, BlockedRange } from '@/types';

export function useListing(id: string) {
  const [listing, setListing] = useState<ListingDetailResponse | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      listingService.getById(id),
      listingService.getAvailability(id),
    ])
      .then(([listingData, availData]) => {
        setListing(listingData);
        setBlockedRanges(availData.blocked_ranges || []);
      })
      .catch((err) => setError(err.message || 'An error occurred'))
      .finally(() => setLoading(false));
  }, [id]);

  return { listing, blockedRanges, loading, error };
}
