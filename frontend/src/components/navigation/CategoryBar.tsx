'use client';

import { useState, useRef } from 'react';
import { 
  Palmtree, Waves, Mountain, Flame, Castle, 
  Home, BedDouble, Trees, Building2, ChevronLeft, ChevronRight,
  Sparkles, Coffee, Warehouse, Compass
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'beach', label: 'Beach', icon: Waves },
  { id: 'villa', label: 'Villas', icon: Castle },
  { id: 'mountain', label: 'Mountains', icon: Mountain },
  { id: 'cabin', label: 'Cabins', icon: Flame },
  { id: 'apartment', label: 'Apartments', icon: Building2 },
  { id: 'house', label: 'Houses', icon: Home },
  { id: 'countryside', label: 'Countryside', icon: Trees },
  { id: 'tropical', label: 'Tropical', icon: Palmtree },
  { id: 'bed_and_breakfast', label: 'B&Bs', icon: Coffee },
  { id: 'loft', label: 'Lofts', icon: Warehouse },
  { id: 'rooms', label: 'Private Rooms', icon: BedDouble },
  { id: 'iconic', label: 'Iconic Cities', icon: Compass },
];

interface Props {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryBar({ selectedCategory, onSelectCategory }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -280 : 280;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center">
        
        {/* Left Scroll Button & Shadow */}
        {showLeftArrow && (
          <div className="absolute left-4 sm:left-6 z-10 flex items-center pr-6 bg-gradient-to-r from-white via-white/90 to-transparent">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll categories left"
              className="p-1.5 rounded-full border border-gray-300 bg-white hover:border-gray-900 shadow-sm hover:scale-105 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-8 overflow-x-auto no-scrollbar py-4 scroll-smooth w-full"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                aria-label={`Category: ${cat.label}`}
                className={`flex flex-col items-center gap-2 pb-2 shrink-0 border-b-2 transition-all duration-200 group focus:outline-none ${
                  isSelected
                    ? 'border-[#FF5A5F] text-[#FF5A5F]'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                    isSelected ? 'text-[#FF5A5F]' : 'text-gray-500 group-hover:text-gray-900'
                  }`}
                />
                <span className={`text-xs whitespace-nowrap font-medium ${isSelected ? 'font-semibold' : ''}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button & Shadow */}
        {showRightArrow && (
          <div className="absolute right-4 sm:right-6 z-10 flex items-center pl-6 bg-gradient-to-l from-white via-white/90 to-transparent">
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll categories right"
              className="p-1.5 rounded-full border border-gray-300 bg-white hover:border-gray-900 shadow-sm hover:scale-105 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
