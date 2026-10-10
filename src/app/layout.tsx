import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SmartPrint | RIT Autonomous Campus Printing Kiosk',
  description: 'SmartPrint - Autonomous Self-Service Printing Kiosks for Rajalakshmi Institute of Technology. Upload anywhere, get warm prints in 30 seconds.',
  icons: {
    icon: [
      { url: '/rit-logo.png', type: 'image/png' },
    ],
    shortcut: '/rit-logo.png',
    apple: '/rit-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        <link rel="icon" type="image/png" href="/rit-logo.png" />
        <link rel="apple-touch-icon" href="/rit-logo.png" />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${jakarta.className} min-h-screen bg-[#fafbfc] text-[#0a0a0a] antialiased selection:bg-[#2563eb] selection:text-white`}>
        {children}
      </body>
    </html>
  );
}


