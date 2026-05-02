import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'HealthCare Shop - Premium Healthcare Products',
  description: 'Browse and discover healthcare products with AI-powered recommendations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: '#f8fdf2' }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#fff',
              color: '#2d5a0e',
              border: '1px solid rgba(139,195,74,0.3)',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
