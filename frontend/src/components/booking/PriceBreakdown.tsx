'use client';

import type { PriceBreakdown as PriceBreakdownType } from '@/types';

interface Props {
  breakdown: PriceBreakdownType;
}

export function PriceBreakdown({ breakdown }: Props) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="w-full flex flex-col gap-3 py-4 text-gray-700">
      <div className="flex justify-between">
        <span className="underline decoration-gray-400">
          {formatMoney(breakdown.pricePerNight)} x {breakdown.nights} {breakdown.nights === 1 ? 'night' : 'nights'}
        </span>
        <span>{formatMoney(breakdown.subtotal)}</span>
      </div>
      
      {breakdown.cleaningFee > 0 && (
        <div className="flex justify-between">
          <span className="underline decoration-gray-400">Cleaning fee</span>
          <span>{formatMoney(breakdown.cleaningFee)}</span>
        </div>
      )}

      <div className="flex justify-between">
        <span className="underline decoration-gray-400">Service fee</span>
        <span>{formatMoney(breakdown.serviceFee)}</span>
      </div>

      <div className="pt-4 mt-2 border-t flex justify-between font-bold text-gray-900 text-lg">
        <span>Total</span>
        <span>{formatMoney(breakdown.total)}</span>
      </div>
    </div>
  );
}
