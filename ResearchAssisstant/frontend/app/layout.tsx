import './globals.css';

export const metadata = {
  title: 'Research Assistant',
  description: 'AI-powered research assistant with workflow tracing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
