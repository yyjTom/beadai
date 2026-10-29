import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { env } from '@/lib/env';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  alternates: { canonical: '/' },
  title: {
    default: 'beadai — Turn any photo or idea into a fuse bead pattern',
    template: '%s | beadai',
  },
  description:
    'Upload a photo or describe an idea and beadai converts it into a printable Perler or Artkal bead pattern with an exact shopping list. No sign-up needed to start.',
  keywords: [
    'perler bead pattern',
    'fuse bead pattern generator',
    'pixel art to beads',
    'bead sprite maker',
    'artkal bead chart',
    'AI pixel art generator',
  ],
  openGraph: {
    type: 'website',
    url: env.siteUrl,
    siteName: 'beadai',
    title: 'beadai — Turn any photo or idea into a fuse bead pattern',
    description:
      'Convert photos or AI-generated pixel art into printable bead patterns with exact colour counts.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'beadai — Turn any photo or idea into a fuse bead pattern',
    description:
      'Convert photos or AI-generated pixel art into printable bead patterns with exact colour counts.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#FFFDF7',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen">
        <SiteHeader />
        <main className="pt-[72px]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
