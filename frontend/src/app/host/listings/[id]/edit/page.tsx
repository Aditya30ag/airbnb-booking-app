'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ListingForm } from '@/components/host/ListingForm';
import { HostGuard } from '@/components/host/HostGuard';
import { Header } from '@/components/navigation/Header';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import type { ListingDetailResponse, ListingFormData } from '@/types';

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listingId } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (!listingId) return;
    apiClient<ListingDetailResponse>(`/api/listings/${listingId}`)
      .then(setListing)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [listingId]);

  const handleSubmit = async (data: ListingFormData) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      property_type: data.property_type || undefined,
      room_type: data.room_type || undefined,
      max_guests: data.max_guests,
      bedrooms: data.bedrooms,
      beds: data.beds,
      bathrooms: data.bathrooms,
      address: data.address || undefined,
      city: data.city,
      state: data.state || undefined,
      country: data.country,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      price_per_night: parseFloat(data.price_per_night),
      cleaning_fee: parseFloat(data.cleaning_fee || '0'),
      amenity_ids: data.amenity_ids,
      images: data.images.map((img, i) => ({ url: img.url, is_cover: img.is_cover, display_order: i })),
    };
    await apiClient(`/api/listings/${listingId}`, { method: 'PUT', body: JSON.stringify(payload) });
    addToast('Listing updated!', 'success');
    setTimeout(() => router.push('/host'), 1200);
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse"><div className="h-8 bg-gray-200 rounded w-64 mb-8" /><div className="h-96 bg-gray-200 rounded-2xl" /></div>;
  if (error || !listing) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><p className="text-red-500">{error || 'Listing not found'}</p><button onClick={() => router.back()} className="mt-4 underline text-gray-600">Go back</button></div>;

  const initialData: Partial<ListingFormData> = {
    title: listing.title,
    description: listing.description || '',
    property_type: listing.property_type || 'Apartment',
    room_type: listing.room_type || 'Entire place',
    max_guests: listing.max_guests || 2,
    bedrooms: listing.bedrooms || 1,
    beds: listing.beds || 1,
    bathrooms: listing.bathrooms || 1,
    address: listing.address || '',
    city: listing.city,
    state: listing.state || '',
    country: listing.country,
    latitude: listing.latitude?.toString() || '',
    longitude: listing.longitude?.toString() || '',
    price_per_night: listing.price_per_night.toString(),
    cleaning_fee: listing.cleaning_fee.toString(),
    amenity_ids: listing.amenities.map(a => a.id),
    images: listing.images.map(img => ({ url: img.url, is_cover: img.is_cover, display_order: img.display_order })),
  };

  return (
    <HostGuard>
      <Header />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black transition mb-4 flex items-center gap-1">← Back</button>
          <h1 className="text-3xl font-bold">Edit listing</h1>
          <p className="text-gray-500 mt-1 line-clamp-1">{listing.title}</p>
        </div>
        <ListingForm initialData={initialData} onSubmit={handleSubmit} submitLabel="Save changes" />
      </div>
    </HostGuard>
  );
}
