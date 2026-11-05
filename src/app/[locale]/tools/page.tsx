import type { Metadata } from 'next';
import { Suspense } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import { generateToolsListMetadata, generateItemListSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import ToolsPageClient from './ToolsPageClient';

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

  return generateToolsListMetadata(validLocale, {
    title: t('tools.title'),
    description: t('tools.description'),
  });
}

interface ToolsPageProps {
  params: Promise<{ locale: string }>;
}

function ToolsPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-[hsl(var(--color-muted-foreground))]">
        Loading...
      </div>
    </div>
  );
}

export default async function ToolsPage({ params }: ToolsPageProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Get localized content for tools (getAllTools excludes disabled tools so
  // the ItemList schema never lists a tool the page cannot show)
  const { getAllTools } = await import('@/config/tools');
  const { getToolContent } = await import('@/config/tool-content');
  const tools = getAllTools();

  const localizedToolContent = tools.reduce((acc, tool) => {
    const content = getToolContent(locale as Locale, tool.id);
    if (content) {
      acc[tool.id] = {
        title: content.title,
        description: content.metaDescription
      };
    }
    return acc;
  }, {} as Record<string, { title: string; description: string }>);

  // Structured data: ItemList of every tool + breadcrumb, mirroring the
  // category-page pattern (checklist B: list pages carry ItemList).
  const tMetadata = await getTranslations({ locale: locale as Locale, namespace: 'metadata' });
  const tCommon = await getTranslations({ locale: locale as Locale, namespace: 'common' });
  const itemListSchema = generateItemListSchema(
    tMetadata('tools.title'),
    tools.map((tool) => ({
      name: getToolContent(locale as Locale, tool.id)?.title ?? tool.slug,
      path: tool.slug,
    })),
    locale as Locale,
    '/tools'
  );
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: tCommon('navigation.home'), path: '' },
      { name: tCommon('navigation.tools'), path: '/tools' },
    ],
    locale as Locale
  );

  // Note: searchParams are handled client-side in ToolsPageClient
  // because static export doesn't support server-side searchParams
  return (
    <>
      <JsonLd data={[itemListSchema, breadcrumbSchema]} />
      <Suspense fallback={<ToolsPageFallback />}>
        <ToolsPageClient locale={locale as Locale} localizedToolContent={localizedToolContent} />
      </Suspense>
    </>
  );
}
