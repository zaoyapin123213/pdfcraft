import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'PDFEditorFree - Professional PDF Tools',
  description: 'Free online PDF tools for merging, splitting, compressing, and converting PDF files. All processing happens in your browser for maximum privacy.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

// Root layout - provides the basic HTML structure
// The actual layout with i18n is in [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <style dangerouslySetInnerHTML={{ __html: 'html{scrollbar-gutter:stable}' }} />
        {/* The root <html> is statically "en" (the root layout cannot read
            [locale] params). The [locale] layout carries lang on its wrapper
            div; this one-liner also aligns the html element for JS clients.
            Non-JS crawlers rely on hreflang + page language, which are set. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var m=location.pathname.match(/^\\/(en|ja|ko|es|fr|de|zh|zh-TW|pt)(\\/|$)/);if(m)document.documentElement.lang=m[1]}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
