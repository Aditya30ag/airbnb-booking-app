'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import type { ListingFormData, ImageEntry, AmenityResponse } from '@/types';

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Studio', 'Cabin', 'Other'];
const ROOM_TYPES = ['Entire place', 'Private room', 'Shared room'];

const STEPS = [
  { title: 'Basic Information', desc: 'Tell guests about your place' },
  { title: 'Property Details', desc: 'Capacity and room counts' },
  { title: 'Location', desc: 'Where is your property?' },
  { title: 'Pricing', desc: 'Set your nightly rate' },
  { title: 'Amenities', desc: 'What does your place offer?' },
  { title: 'Photos', desc: 'Add photos of your place' },
];

const DEFAULT_DATA: ListingFormData = {
  title: '',
  description: '',
  property_type: 'Apartment',
  room_type: 'Entire place',
  max_guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  address: '',
  city: '',
  state: '',
  country: '',
  latitude: '',
  longitude: '',
  price_per_night: '',
  cleaning_fee: '0',
  amenity_ids: [],
  images: [],
};

interface Props {
  initialData?: Partial<ListingFormData>;
  onSubmit: (data: ListingFormData) => Promise<void>;
  submitLabel?: string;
}

export function ListingForm({ initialData, onSubmit, submitLabel = 'Create listing' }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ListingFormData>({ ...DEFAULT_DATA, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormData | string, string>>>({});
  const [amenities, setAmenities] = useState<AmenityResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient<AmenityResponse[]>('/api/amenities')
      .then(setAmenities)
      .catch(console.error);
  }, []);

  const set = (field: keyof ListingFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (s: number): boolean => {
    const errs: Partial<Record<string, string>> = {};
    if (s === 0) {
      if (!data.title.trim()) errs.title = 'Title is required';
      else if (data.title.trim().length < 3) errs.title = 'Title must be at least 3 characters';
      if (!data.property_type) errs.property_type = 'Select a property type';
      if (!data.room_type) errs.room_type = 'Select a room type';
    }
    if (s === 1) {
      if (data.max_guests < 1) errs.max_guests = 'Must allow at least 1 guest';
      if (data.bedrooms < 0) errs.bedrooms = 'Cannot be negative';
      if (data.beds < 1) errs.beds = 'Must have at least 1 bed';
      if (data.bathrooms < 0.5) errs.bathrooms = 'Must have at least 0.5 bathrooms';
    }
    if (s === 2) {
      if (!data.city.trim()) errs.city = 'City is required';
      if (!data.country.trim()) errs.country = 'Country is required';
    }
    if (s === 3) {
      const p = parseFloat(data.price_per_night);
      if (!data.price_per_night || isNaN(p) || p <= 0) errs.price_per_night = 'Enter a valid positive price';
      const c = parseFloat(data.cleaning_fee || '0');
      if (isNaN(c) || c < 0) errs.cleaning_fee = 'Cleaning fee cannot be negative';
    }
    if (s === 5) {
      const valid = data.images.filter((img) => Boolean(img.url && img.url.trim()));
      if (valid.length === 0) {
        errs.images = 'Please enter a valid photo URL (or click "Use sample photos")';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(STEPS.length - 1, prev + 1));
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err: any) {
      setErrors({ form: err.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const addImage = () => {
    const isFirst = data.images.length === 0;
    const newEntry: ImageEntry = { url: '', is_cover: isFirst, display_order: data.images.length };
    setData((prev) => ({ ...prev, images: [...prev.images, newEntry] }));
  };

  const removeImage = (idx: number) => {
    const next = data.images.filter((_, i) => i !== idx).map((img, i) => ({
      ...img,
      display_order: i,
      is_cover: img.is_cover || (i === 0 && !data.images.some((x, xi) => xi !== idx && x.is_cover)),
    }));
    setData((prev) => ({ ...prev, images: next }));
  };

  const updateImageUrl = (idx: number, url: string) => {
    const next = data.images.map((img, i) => i === idx ? { ...img, url } : img);
    setData((prev) => ({ ...prev, images: next }));
  };

  const setCoverImage = (idx: number) => {
    const next = data.images.map((img, i) => ({ ...img, is_cover: i === idx }));
    setData((prev) => ({ ...prev, images: next }));
  };

  const fillSamplePhotos = () => {
    const samples: ImageEntry[] = [
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', is_cover: true, display_order: 0 },
      { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80', is_cover: false, display_order: 1 },
      { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80', is_cover: false, display_order: 2 },
    ];
    setData((prev) => ({ ...prev, images: samples }));
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const toggleAmenity = (id: string) => {
    setData((prev) => {
      const exists = prev.amenity_ids.includes(id);
      return {
        ...prev,
        amenity_ids: exists ? prev.amenity_ids.filter((a) => a !== id) : [...prev.amenity_ids, id],
      };
    });
  };

  const inputCls = (err?: string) =>
    `w-full border rounded-2xl px-4 py-3.5 text-sm outline-none transition focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent ${
      err ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200 hover:border-gray-300'
    }`;

  const Counter = ({ label, value, onChange, min = 0, step: s = 1 }: {
    label: string; value: number; onChange: (v: number) => void; min?: number; step?: number;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="font-semibold text-gray-800 text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - s))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:border-black disabled:opacity-30 transition"
        >
          -
        </button>
        <span className="w-8 text-center font-bold text-sm text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + s)}
          aria-label={`Increase ${label}`}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:border-black transition"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      {/* Step Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span className="text-gray-900">{STEPS[step].title}</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#FF5A5F] h-full transition-all duration-300 rounded-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{STEPS[step].desc}</p>
      </div>

      {errors.form && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {errors.form}
        </div>
      )}

      {/* Step 0: Basic Information */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Listing title *</label>
            <input
              type="text"
              placeholder="e.g. Cozy Sea-facing Villa in Goa"
              value={data.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputCls(errors.title)}
            />
            {errors.title && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Description</label>
            <textarea
              rows={4}
              placeholder="Describe what makes your space special, nearby attractions, amenities..."
              value={data.description}
              onChange={(e) => set('description', e.target.value)}
              className={`${inputCls()} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Property type *</label>
              <select
                value={data.property_type}
                onChange={(e) => set('property_type', e.target.value)}
                className={inputCls(errors.property_type)}
              >
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Room type *</label>
              <select
                value={data.room_type}
                onChange={(e) => set('room_type', e.target.value)}
                className={inputCls(errors.room_type)}
              >
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="border border-gray-200 rounded-2xl p-4 divide-y divide-gray-100">
          <Counter label="Max Guests" value={data.max_guests} onChange={(v) => set('max_guests', v)} min={1} />
          <Counter label="Bedrooms" value={data.bedrooms} onChange={(v) => set('bedrooms', v)} min={0} />
          <Counter label="Beds" value={data.beds} onChange={(v) => set('beds', v)} min={1} />
          <Counter label="Bathrooms" value={data.bathrooms} onChange={(v) => set('bathrooms', v)} min={0.5} step={0.5} />
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Street Address</label>
            <input
              type="text"
              placeholder="e.g. 12 Beach Road, Calangute"
              value={data.address}
              onChange={(e) => set('address', e.target.value)}
              className={inputCls()}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">City *</label>
              <input
                type="text"
                placeholder="e.g. Goa"
                value={data.city}
                onChange={(e) => set('city', e.target.value)}
                className={inputCls(errors.city)}
              />
              {errors.city && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">State</label>
              <input
                type="text"
                placeholder="e.g. Goa"
                value={data.state}
                onChange={(e) => set('state', e.target.value)}
                className={inputCls()}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Country *</label>
            <input
              type="text"
              placeholder="e.g. India"
              value={data.country}
              onChange={(e) => set('country', e.target.value)}
              className={inputCls(errors.country)}
            />
            {errors.country && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.country}</p>}
          </div>
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Price per night (₹ INR) *</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 4500"
              value={data.price_per_night}
              onChange={(e) => set('price_per_night', e.target.value)}
              className={inputCls(errors.price_per_night)}
            />
            {errors.price_per_night && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.price_per_night}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Cleaning fee (₹ INR)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 500"
              value={data.cleaning_fee}
              onChange={(e) => set('cleaning_fee', e.target.value)}
              className={inputCls(errors.cleaning_fee)}
            />
            {errors.cleaning_fee && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.cleaning_fee}</p>}
          </div>
        </div>
      )}

      {/* Step 4: Amenities */}
      {step === 4 && (
        <div>
          <p className="text-xs font-bold uppercase text-gray-600 mb-4">Select all that apply</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {amenities.map((am) => {
              const selected = data.amenity_ids.includes(am.id);
              return (
                <button
                  key={am.id}
                  type="button"
                  onClick={() => toggleAmenity(am.id)}
                  aria-pressed={selected}
                  className={`p-3.5 rounded-2xl border text-left text-sm font-semibold transition flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] ${
                    selected
                      ? 'border-[#FF5A5F] bg-rose-50/50 text-[#FF5A5F]'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="truncate">{am.name}</span>
                  {selected && <Check className="w-4 h-4 text-[#FF5A5F] shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 5: Photos */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <label className="block text-xs font-bold uppercase text-gray-600">Photo URLs *</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fillSamplePhotos}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline transition"
              >
                Use sample photos
              </button>
              <button
                type="button"
                onClick={addImage}
                className="flex items-center gap-1.5 text-xs font-bold text-[#FF5A5F] hover:text-[#E0484D] transition"
              >
                <Plus className="w-4 h-4" /> Add photo
              </button>
            </div>
          </div>

          {errors.images && <p className="text-rose-500 text-xs font-medium">{errors.images}</p>}

          {data.images.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-3xl p-8 text-center">
              <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">No photos added yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Paste image URLs or populate realistic photos instantly.</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={fillSamplePhotos}
                  className="px-4 py-2 bg-[#FF5A5F] text-white text-xs font-semibold rounded-xl hover:bg-[#E0484D] transition"
                >
                  Use sample photos
                </button>
                <button
                  type="button"
                  onClick={addImage}
                  className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition"
                >
                  Add custom URL
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.images.map((img, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                    {img.url ? (
                      <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={img.url}
                      onChange={(e) => updateImageUrl(i, e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-[#FF5A5F]"
                    />
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="cover"
                          checked={img.is_cover}
                          onChange={() => setCoverImage(i)}
                          className="accent-[#FF5A5F]"
                        />
                        <span>Cover Photo</span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="Remove photo"
                    className="p-2 text-gray-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-100">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="flex items-center gap-1 px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-0"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-800 transition"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-[#FF5A5F] hover:bg-[#E0484D] text-white font-bold text-sm transition shadow-md disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
