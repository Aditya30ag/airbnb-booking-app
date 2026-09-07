'use client';

import { useRouter } from 'next/navigation';
import { ListingForm } from '@/components/host/ListingForm';
import { HostGuard } from '@/components/host/HostGuard';
import { Header } from '@/components/navigation/Header';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import type { ListingFormData } from '@/types';

export default function NewListingPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

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
      images: data.images.map((img, i) => ({
        url: img.url,
        is_cover: img.is_cover,
        display_order: i,
      })),
    };

    const created = await apiClient<{ id: string }>('/api/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    addToast('Listing created successfully! Taking you to view it...', 'success');
    setTimeout(() => {
      if (created?.id) {
        router.push(`/listings/${created.id}`);
      } else {
        router.push('/host');
      }
    }, 1000);
  };

  return (
    <HostGuard>
      <Header />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <button onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-black transition mb-4 flex items-center gap-1">
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Create a new listing</h1>
          <p className="text-gray-500 mt-1">Fill in the details to list your property</p>
        </div>
        <ListingForm onSubmit={handleSubmit} submitLabel="Create listing" />
      </div>
    </HostGuard>
  );
}
