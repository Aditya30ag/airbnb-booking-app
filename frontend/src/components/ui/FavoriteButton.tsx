'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/hooks/useToast';

interface Props {
  listingId: string;
  isWishlisted: boolean;
  onToggle?: (newState: boolean) => void;
  className?: string;
}

export function FavoriteButton({ listingId, isWishlisted, onToggle, className = '' }: Props) {
  const { toggle } = useWishlist();
  const { addToast } = useToast();
  const [localState, setLocalState] = useState(isWishlisted);
  const [pending, setPending] = useState(false);
  const [isPopping, setIsPopping] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    if (!userId) {
      addToast('Please sign in to save listings to your wishlist.', 'info');
      return;
    }

    const next = !localState;
    setLocalState(next);
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 350);

    setPending(true);
    const result = await toggle(listingId);
    
    if (result.needsAuth) {
      setLocalState(!next);
      addToast('Please sign in to save listings to your wishlist.', 'info');
    } else if (!result.success) {
      setLocalState(!next);
      addToast('Could not update wishlist. Please try again.', 'error');
    } else {
      addToast(next ? 'Saved to wishlist!' : 'Removed from wishlist', 'success');
      onToggle?.(next);
    }
    setPending(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={localState ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`relative p-2 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] active:scale-90 ${
        pending ? 'opacity-70' : 'hover:scale-110'
      } ${className}`}
    >
      <Heart
        className={`w-6 h-6 transition-colors duration-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] ${
          isPopping ? 'animate-heart-pop' : ''
        } ${
          localState
            ? 'fill-[#FF5A5F] text-[#FF5A5F]'
            : 'fill-black/30 text-white stroke-[2.2]'
        }`}
      />
    </button>
  );
}
