import type { Metadata } from 'next';
import { Lexend, Poppins } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-lexend',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PrintPoint | Print. Pay. Done. - Self-Service Printing Kiosks',
  description: 'PrintPoint - Autonomous Self-Service Printing Kiosks & Xerox Station SaaS Platform',
  icons: {
    icon: [
      { url: '/printpoint-icon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/printpoint-icon.svg',
    apple: '/printpoint-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lexend.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/printpoint-icon.svg" />
        <link rel="alternate icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/printpoint-icon.svg" />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${lexend.className} min-h-screen bg-mint-grid text-slate-900 antialiased selection:bg-[#00b51e] selection:text-white`}>
        {children}
      </body>
    </html>
  );
}

