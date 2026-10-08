/**
 * Site configuration
 */
export const siteConfig = {
  name: 'PDFCraft',
  description: 'Free online PDF editor with 95 professional tools. Merge, split, compress, convert, and edit PDF files in your browser - no upload, no registration, 100% private.',
  url: 'https://pdfeditorfree.net',
  ogImage: '/images/og-image.png',
  links: {
    github: 'https://github.com/zaoyapin123213/pdfcraft',
    twitter: 'https://twitter.com/pdfcraft',
  },
  creator: 'PDFCraft Team',
  keywords: [
    'PDF tools',
    'PDF editor',
    'free PDF editor',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'convert PDF',
    'free PDF tools',
    'online PDF editor',
    'browser-based PDF',
    'private PDF processing',
  ],
  // SEO-related settings
  seo: {
    titleTemplate: '%s | PDFCraft',
    defaultTitle: 'Free PDF Editor & 95 Online PDF Tools | PDFCraft',
    twitterHandle: '@pdfcraft',
    locale: 'en_US',
  },
};

/**
 * Navigation configuration
 */
export const navConfig = {
  mainNav: [
    { title: 'Home', href: '/' },
    { title: 'Tools', href: '/tools' },
    { title: 'About', href: '/about' },
    { title: 'FAQ', href: '/faq' },
  ],
  footerNav: [
    { title: 'Privacy', href: '/privacy' },
    { title: 'Terms', href: '/terms' },
    { title: 'Contact', href: '/contact' },
  ],
};
