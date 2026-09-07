import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'StayFinder - Find your perfect stay in India',
  description: 'Discover and book unique stays across India.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/logo.svg',
    shortcut: '/favicon.svg',
  },
  themeColor: '#FF385C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased selection:bg-[#FF5A5F]/20 selection:text-[#FF5A5F] flex flex-col">
        <ToastProvider>
          <AuthProvider>
            <ChatProvider>
              <div className="flex-1 flex flex-col">
                {children}
              </div>
              <Footer />
              <AuthModal />
              <ChatWidget />
            </ChatProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
