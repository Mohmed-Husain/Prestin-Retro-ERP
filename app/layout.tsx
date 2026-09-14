import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Threadly Factory OS — Clothing Factory Management',
  description: 'Production-quality OS for modern apparel factories, powered by Google Sheets and Next.js.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
