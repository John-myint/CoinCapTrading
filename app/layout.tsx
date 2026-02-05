import type { Metadata } from 'next';
import './globals.css';
import { RootLayoutClient } from './RootLayoutClient';

export const metadata: Metadata = {
  title: 'CryptoTrade - Crypto Trading Dashboard',
  description: 'Professional crypto trading dashboard with real-time data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
