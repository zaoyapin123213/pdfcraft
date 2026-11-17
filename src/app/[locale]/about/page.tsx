import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import { generateAboutMetadata, generateStaticPageSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import AboutPageClient from './AboutPageClient';

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

  return generateAboutMetadata(validLocale, {
    title: t('about.title'),
    description: t('about.description'),
  });
}

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const validLocale = locales.includes(locale as Locale) ? (locale as Locale) : 'en';

  // Enable static rendering
  setRequestLocale(validLocale);

  const t = await getTranslations({ locale: validLocale, namespace: 'metadata' });
  const tCommon = await getTranslations({ locale: validLocale, namespace: 'common' });
  const pageSchema = generateStaticPageSchema(
    validLocale,
    '/about',
    'AboutPage',
    t('about.title'),
    t('about.description')
  );

  return (
    <>
      <JsonLd data={[pageSchema, generateBreadcrumbSchema(
        [
          { name: tCommon('navigation.home'), path: '' },
          { name: tCommon('navigation.about'), path: '/about' },
        ],
        validLocale
      )]} />
      <AboutPageClient locale={validLocale} />
    </>
  );
}
