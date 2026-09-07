'use client';

import { useState, useEffect, useCallback } from 'react';
import { wishlistApi } from '@/services/wishlistApi';

export function useWishlist() {
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const isAuthenticated = () => !!localStorage.getItem('user_id');

  useEffect(() => {
    if (!isAuthenticated()) return;
    setLoading(true);
    wishlistApi.getIds()
      .then((data) => setWishlistedIds(new Set(data.ids)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const add = useCallback(async (listingId: string): Promise<boolean> => {
    if (!isAuthenticated()) return false;
    // Optimistic update
    setWishlistedIds((prev) => new Set([...prev, listingId]));
    try {
      await wishlistApi.add(listingId);
      return true;
    } catch {
      // Rollback
      setWishlistedIds((prev) => { const next = new Set(prev); next.delete(listingId); return next; });
      return false;
    }
  }, []);

  const remove = useCallback(async (listingId: string): Promise<boolean> => {
    if (!isAuthenticated()) return false;
    // Optimistic update
    setWishlistedIds((prev) => { const next = new Set(prev); next.delete(listingId); return next; });
    try {
      await wishlistApi.remove(listingId);
      return true;
    } catch {
      // Rollback
      setWishlistedIds((prev) => new Set([...prev, listingId]));
      return false;
    }
  }, []);

  const toggle = useCallback(async (listingId: string): Promise<{ success: boolean; needsAuth: boolean }> => {
    if (!isAuthenticated()) return { success: false, needsAuth: true };
    if (wishlistedIds.has(listingId)) {
      const ok = await remove(listingId);
      return { success: ok, needsAuth: false };
    } else {
      const ok = await add(listingId);
      return { success: ok, needsAuth: false };
    }
  }, [wishlistedIds, add, remove]);

  return { wishlistedIds, loading, add, remove, toggle };
}
