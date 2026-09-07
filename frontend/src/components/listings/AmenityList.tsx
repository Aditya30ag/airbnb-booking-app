'use client';

import { useState } from 'react';
import { CheckCircle, Wifi, Car, Waves, Dumbbell, UtensilsCrossed, Tv, Wind, AirVent, Flame, Coffee, X } from 'lucide-react';
import type { AmenityResponse } from '@/types';

interface Props {
  amenities: AmenityResponse[];
}

const IconMap: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  pool: Waves,
  gym: Dumbbell,
  kitchen: UtensilsCrossed,
  tv: Tv,
  washer: Wind,
  air_conditioning: AirVent,
  ac: AirVent,
  heating: Flame,
  breakfast: Coffee,
};

export function AmenityList({ amenities }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (!amenities || amenities.length === 0) return null;

  const displayAmenities = showAll ? amenities : amenities.slice(0, 10);

  return (
    <div className="py-8 border-b">
      <h2 className="text-2xl font-semibold mb-6">What this place offers</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {displayAmenities.map((amenity) => {
          const IconComponent = amenity.icon && IconMap[amenity.icon.toLowerCase()] 
            ? IconMap[amenity.icon.toLowerCase()] 
            : CheckCircle;

          return (
            <div key={amenity.id} className="flex items-center gap-4 text-gray-700">
              <IconComponent className="w-6 h-6 text-gray-800" strokeWidth={1.5} />
              <span className="text-lg">{amenity.name}</span>
            </div>
          );
        })}
      </div>

      {!showAll && amenities.length > 10 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-6 px-6 py-3 border border-black rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Show all {amenities.length} amenities
        </button>
      )}

      {showAll && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center">
              <button onClick={() => setShowAll(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold flex-1 text-center pr-9">Amenities</h3>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid gap-6">
                {amenities.map((amenity) => {
                  const IconComponent = amenity.icon && IconMap[amenity.icon.toLowerCase()] 
                    ? IconMap[amenity.icon.toLowerCase()] 
                    : CheckCircle;
                  return (
                    <div key={amenity.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                      <IconComponent className="w-7 h-7 text-gray-800" strokeWidth={1.5} />
                      <span className="text-lg">{amenity.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
