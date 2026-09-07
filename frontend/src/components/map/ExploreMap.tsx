'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { ListingCardResponse } from '@/types';
import Link from 'next/link';
import { Star, MapPin, X } from 'lucide-react';

interface ExploreMapProps {
  listings: ListingCardResponse[];
  className?: string;
  selectedId?: string | null;
  onSelectListing?: (id: string | null) => void;
}

export default function ExploreMap({
  listings,
  className = 'w-full h-full min-h-[500px]',
  selectedId,
  onSelectListing,
}: ExploreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [activeListing, setActiveListing] = useState<ListingCardResponse | null>(null);

  // Filter listings with valid coordinates
  const validListings = listings.filter(
    (l) => typeof l.latitude === 'number' && typeof l.longitude === 'number' && !isNaN(l.latitude) && !isNaN(l.longitude)
  );

  useEffect(() => {
    let isMounted = true;

    // Dynamically import leaflet to prevent SSR window issues
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default fallback center (India center or first listing)
      const defaultCenter: [number, number] = validListings.length > 0
        ? [validListings[0].latitude!, validListings[0].longitude!]
        : [15.4989, 73.8278];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: validListings.length > 0 ? 9 : 5,
        zoomControl: false,
        attributionControl: false,
      });

      // Add zoom control at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers
      renderMarkers(L, map);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when listings change or when map is ready
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      if (mapInstanceRef.current) {
        renderMarkers(L, mapInstanceRef.current);
      }
    });
  }, [listings, selectedId]);

  const renderMarkers = (L: any, map: any) => {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (validListings.length === 0) return;

    const bounds = L.latLngBounds([]);

    validListings.forEach((listing) => {
      const lat = listing.latitude!;
      const lng = listing.longitude!;
      const isSelected = listing.id === selectedId;

      const priceFormatted = Number(listing.price_per_night).toLocaleString('en-IN');
      const badgeHtml = `
        <div class="px-2.5 py-1 font-bold text-xs rounded-full shadow-md border transition-all duration-150 cursor-pointer flex items-center gap-1 ${
          isSelected
            ? 'bg-black text-white border-black scale-110 shadow-xl'
            : 'bg-white text-gray-900 border-gray-300 hover:bg-black hover:text-white hover:border-black'
        }">
          <span>₹${priceFormatted}</span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'airbnb-map-marker',
        html: badgeHtml,
        iconSize: [60, 30],
        iconAnchor: [30, 15],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      marker.on('click', () => {
        setActiveListing(listing);
        if (onSelectListing) onSelectListing(listing.id);
        map.panTo([lat, lng], { animate: true, duration: 0.5 });
      });

      markersRef.current.push(marker);
      bounds.extend([lat, lng]);
    });

    if (validListings.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
      });
    }
  };

  return (
    <div className={`relative ${className} overflow-hidden rounded-2xl border border-gray-200 shadow-sm`}>
      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-0" />

      {/* Floating Selected Listing Card Popup */}
      {activeListing && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
          <button
            onClick={() => setActiveListing(null)}
            className="absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <Link href={`/listings/${activeListing.id}`} className="block group">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
              <img
                src={activeListing.cover_image_url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'}
                alt={activeListing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#FF5A5F]" />
                {activeListing.city}, {activeListing.country}
              </div>
            </div>

            <div className="p-3.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 text-sm truncate flex-1">
                  {activeListing.title}
                </h4>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-900 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-black" />
                  <span>{activeListing.rating_avg > 0 ? activeListing.rating_avg.toFixed(1) : 'New'}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 capitalize mb-2">
                {activeListing.property_type?.replace(/_/g, ' ') || 'Entire home'}
              </p>

              <div className="flex items-baseline gap-1">
                <span className="font-bold text-gray-900 text-sm">
                  ₹{Number(activeListing.price_per_night).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-500">night</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* No Coordinates Indicator Banner */}
      {validListings.length === 0 && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
          <MapPin className="w-10 h-10 text-gray-400 mb-2" />
          <h4 className="font-semibold text-gray-800 text-base">No map coordinates available</h4>
          <p className="text-xs text-gray-500 max-w-xs mt-1">
            None of the listings matching this search have location coordinates.
          </p>
        </div>
      )}
    </div>
  );
}
