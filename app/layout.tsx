import type { Metadata } from 'next';
import './globals.css';
import AppLock from '@/components/auth/AppLock';

export const metadata: Metadata = {
  title: 'Pristine Retro Enterprise — Factory OS',
  description: 'Production-quality OS for modern apparel factories, powered by Google Sheets and Next.js.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppLock>{children}</AppLock>
      </body>
    </html>
  );
}
