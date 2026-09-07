import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { ChatWidget } from '@/components/chat/ChatWidget';

export const metadata: Metadata = {
  title: 'Airbnb | Vacation rentals, cabins, beach houses & more',
  description: 'Find vacation rentals, cabins, beach houses, unique homes and experiences around the world.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased selection:bg-[#FF5A5F]/20 selection:text-[#FF5A5F]">
        <ToastProvider>
          <AuthProvider>
            <ChatProvider>
              {children}
              <AuthModal />
              <ChatWidget />
            </ChatProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
