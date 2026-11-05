import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import { generatePrivacyMetadata, generateStaticPageSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import PrivacyPageClient from './PrivacyPageClient';

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

  return generatePrivacyMetadata(validLocale, {
    title: t('privacy.title'),
    description: t('privacy.description'),
  });
}

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const validLocale = locales.includes(locale as Locale) ? (locale as Locale) : 'en';

  // Enable static rendering
  setRequestLocale(validLocale);

  const t = await getTranslations({ locale: validLocale, namespace: 'metadata' });
  const pageSchema = generateStaticPageSchema(
    validLocale,
    '/privacy',
    'WebPage',
    t('privacy.title'),
    t('privacy.description')
  );

  return (
    <>
      <JsonLd data={pageSchema} />
      <PrivacyPageClient locale={validLocale} />
    </>
  );
}
