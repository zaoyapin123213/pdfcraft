import { setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import HomePageClient from './HomePageClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { generateWebSiteSchema, generateOrganizationSchema } from '@/lib/seo';
import { homeFaqs } from '@/content/homeFaq';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Site-level structured data helps search engines and AI assistants
  // understand and cite the brand (WebSite) and the organization behind it.
  const webSiteSchema = generateWebSiteSchema(locale as Locale);
  const organizationSchema = generateOrganizationSchema();

  // Homepage FAQ schema mirrors the visible FAQ section (English only),
  // targeting the "People also ask" box for "pdf editor free".
  const schemas =
    locale === 'en'
      ? [
          webSiteSchema,
          organizationSchema,
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: homeFaqs.map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          },
        ]
      : [webSiteSchema, organizationSchema];

  // Get localized content for tools
  const { tools } = await import('@/config/tools');
  const { getToolContent } = await import('@/config/tool-content');

  const localizedToolContent = tools.reduce((acc, tool) => {
    const content = getToolContent(locale as Locale, tool.id);
    // Use metaDescription for the card description as it's short and summary-like
    // Use title from the content
    if (content) {
      acc[tool.id] = {
        title: content.title,
        description: content.metaDescription
      };
    }
    return acc;
  }, {} as Record<string, { title: string; description: string }>);

  return (
    <>
      <JsonLd data={schemas} />
      <HomePageClient locale={locale as Locale} localizedToolContent={localizedToolContent} />
    </>
  );
}
