import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import { generateFaqMetadata, generateFAQPageSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import FAQPageClient from './FAQPageClient';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = locales.includes(locale as Locale) ? (locale as Locale) : 'en';
  const t = await getTranslations({ locale: validLocale, namespace: 'metadata' });

  return generateFaqMetadata(validLocale, {
    title: t('faq.title'),
    description: t('faq.description'),
  });
}

interface FAQPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Question keys per category - must stay in sync with FAQPageClient,
 * which renders the same items on the page. The visible content and
 * the FAQPage structured data must always describe the same Q&As.
 */
const FAQ_CATEGORY_KEYS: Record<string, string[]> = {
  general: ['whatIs', 'isFree', 'account'],
  privacy: ['uploaded', 'safe', 'storage'],
  features: ['operations', 'merge', 'images', 'edit'],
  technical: ['browsers', 'sizeLimit', 'slow', 'offline'],
  languages: ['supported', 'change'],
};

export default async function FAQPage({ params }: FAQPageProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Build the FAQ list server-side (same keys as the client component)
  // and emit FAQPage structured data for rich results and AI answers.
  const t = await getTranslations({ locale: locale as Locale, namespace: 'faqPage' });

  const faqItems = Object.entries(FAQ_CATEGORY_KEYS).flatMap(([category, keys]) =>
    keys.map(key => ({
      question: t(`sections.${category}.${key}.question`),
      answer: t(`sections.${category}.${key}.answer`),
    }))
  );

  const faqSchema = generateFAQPageSchema(faqItems);

  return (
    <>
      <JsonLd data={faqSchema} />
      <FAQPageClient locale={locale as Locale} />
    </>
  );
}
