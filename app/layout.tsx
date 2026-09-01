import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kyros - The open inference layer',
  description:
    'Rent verified GPU capacity for AI inference and pay per completed call on Robinhood Chain.',
  openGraph: {
    title: 'Kyros - The open inference layer',
    description:
      'Rent verified GPU capacity for AI inference and pay per completed call on Robinhood Chain.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kyros - The open inference layer',
    description:
      'Rent verified GPU capacity for AI inference and pay per completed call on Robinhood Chain.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
