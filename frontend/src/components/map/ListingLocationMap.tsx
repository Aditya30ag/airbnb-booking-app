'use client';

import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface ListingLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  title: string;
  city: string;
  state?: string | null;
  country: string;
  address?: string | null;
}

export default function ListingLocationMap({
  latitude,
  longitude,
  title,
  city,
  state,
  country,
  address,
}: ListingLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  useEffect(() => {
    if (!hasCoords) return;
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [latitude!, longitude!],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false, // avoid accidental page scroll hijacking
      });

      // Add zoom control at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      // Add Airbnb-style circular privacy zone (approx. 400m radius)
      L.circle([latitude!, longitude!], {
        color: '#FF5A5F',
        fillColor: '#FF5A5F',
        fillOpacity: 0.15,
        weight: 1.5,
        radius: 450,
      }).addTo(map);

      // Custom Airbnb House Icon Pin in Center
      const pinHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-11 h-11 rounded-full bg-[#FF5A5F] shadow-lg flex items-center justify-center text-white border-2 border-white ring-4 ring-[#FF5A5F]/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'airbnb-location-pin',
        html: pinHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      L.marker([latitude!, longitude!], { icon })
        .addTo(map)
        .bindPopup(
          `<div class="p-1 font-sans text-xs">
            <p class="font-bold text-gray-900">${title}</p>
            <p class="text-gray-500 mt-0.5">${city}, ${country}</p>
          </div>`
        );

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, hasCoords]);

  return (
    <div className="py-8 border-t border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-1">Where you&apos;ll be</h3>
      <p className="text-sm text-gray-600 mb-5 flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-[#FF5A5F] shrink-0" />
        <span>
          {address ? `${address}, ` : ''}
          {city}
          {state ? `, ${state}` : ''}, {country}
        </span>
      </p>

      {hasCoords ? (
        <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
          <div ref={mapContainerRef} className="w-full h-full" />
          <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 shadow-xs">
            Exact location provided after booking
          </div>
        </div>
      ) : (
        <div className="w-full h-[260px] rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
            <MapPin className="w-6 h-6 text-[#FF5A5F]" />
          </div>
          <h4 className="font-semibold text-gray-900 text-base">{city}, {country}</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Location map details are available directly upon reservation confirmation.
          </p>
        </div>
      )}
    </div>
  );
}
