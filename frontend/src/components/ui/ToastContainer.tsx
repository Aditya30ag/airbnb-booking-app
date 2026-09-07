'use client';

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { Toast } from '@/context/ToastContext';

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl text-white backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-fade-in ${
              isSuccess
                ? 'bg-emerald-600/95 border border-emerald-500/50 shadow-emerald-900/20'
                : isError
                ? 'bg-rose-600/95 border border-rose-500/50 shadow-rose-900/20'
                : 'bg-blue-600/95 border border-blue-500/50 shadow-blue-900/20'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-100" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-100" />}
              {isInfo && <Info className="w-5 h-5 text-blue-100" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              aria-label="Close notification"
              className="shrink-0 p-1 hover:bg-white/20 rounded-full transition focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X className="w-4 h-4 text-white/80 hover:text-white" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
