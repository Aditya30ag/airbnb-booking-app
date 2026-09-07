'use client';

import { useState, useEffect, useCallback } from 'react';
import { Grid2X2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ListingImageResponse } from '@/types';

interface Props {
  images: ListingImageResponse[];
}

export function ImageGallery({ images }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, handleNext, handlePrev]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-200 rounded-xl flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  const mainImage = images[0];
  const gridImages = images.slice(1, 5);

  return (
    <>
      <div className="relative w-full mb-8">
        {/* Mobile View */}
        <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory hide-scrollbar">
          {images.map((img) => (
            <div key={img.id} className="min-w-full snap-center h-[300px]">
              <img src={img.url} alt="Listing" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex gap-2 h-[400px] rounded-xl overflow-hidden relative group">
          <div className="w-1/2 h-full cursor-pointer" onClick={() => setShowModal(true)}>
            <img
              src={mainImage.url}
              alt="Main"
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
          </div>
          <div className="w-1/2 h-full grid grid-cols-2 grid-rows-2 gap-2">
            {gridImages.map((img) => (
              <div key={img.id} className="w-full h-full cursor-pointer" onClick={() => setShowModal(true)}>
                <img
                  src={img.url}
                  alt="Gallery"
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg font-semibold border border-black shadow-sm flex items-center gap-2 hover:bg-gray-100 transition"
          >
            <Grid2X2 className="w-5 h-5" />
            Show all photos
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center text-white">
            <span className="text-sm">
              {currentIndex + 1} / {images.length}
            </span>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center p-4">
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <div className="max-w-5xl max-h-full w-full h-full flex items-center justify-center">
              <img
                key={currentIndex}
                src={images[currentIndex].url}
                alt={`Photo ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
