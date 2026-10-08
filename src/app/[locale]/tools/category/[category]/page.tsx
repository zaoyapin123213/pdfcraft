import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import { TOOL_CATEGORIES, type ToolCategory } from '@/types/tool';
import CategoryPageClient from './CategoryPageClient';
import { notFound } from 'next/navigation';
import { generateBaseMetadata, generateItemListSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { getAllTools } from '@/config/tools';
import { getToolContent } from '@/config/tool-content';

// Localized label keys for each tool category
const categoryTranslationKeys: Record<ToolCategory, string> = {
  'edit-annotate': 'editAnnotate',
  'convert-to-pdf': 'convertToPdf',
  'convert-from-pdf': 'convertFromPdf',
  'organize-manage': 'organizeManage',
  'optimize-repair': 'optimizeRepair',
  'secure-pdf': 'securePdf',
};

export function generateStaticParams() {
    return locales.flatMap((locale) =>
        TOOL_CATEGORIES.map((category) => ({
            locale,
            category,
        }))
    );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }): Promise<Metadata> {
    const { locale: localeParam, category } = await params;
    const validLocale = locales.includes(localeParam as Locale) ? (localeParam as Locale) : 'en';

    if (!TOOL_CATEGORIES.includes(category as ToolCategory)) {
        return {};
    }

    const tHome = await getTranslations({ locale: validLocale, namespace: 'home' });
    const tMeta = await getTranslations({ locale: validLocale, namespace: 'metadata' });

    const categoryLabel = tHome(`categories.${categoryTranslationKeys[category as ToolCategory]}`);

    // Full metadata with canonical URL, hreflang alternates and OG tags.
    // The generic title/description this page had before gave Google an
    // English-only, canonical-less page in every language.
    return generateBaseMetadata({
        locale: validLocale,
        path: `/tools/category/${category}`,
        title: tMeta('category.title', { category: categoryLabel }),
        description: tMeta('category.description', { category: categoryLabel }),
        keywords: [`${categoryLabel} PDF`, 'free PDF tools', 'online PDF tools'],
    });
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; category: string }> }) {
    const { locale, category } = await params;

    // Validate category
    if (!TOOL_CATEGORIES.includes(category as ToolCategory)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    const tHome = await getTranslations({ locale: locale as Locale, namespace: 'home' });
    const tCommon = await getTranslations({ locale: locale as Locale, namespace: 'common' });
    const categoryLabel = tHome(`categories.${categoryTranslationKeys[category as ToolCategory]}`);

    // Get localized content for tools
    const allTools = getAllTools();
    const toolsInCategory = allTools.filter(tool => tool.category === category);

    const localizedToolContent = toolsInCategory.reduce((acc, tool) => {
        const content = getToolContent(locale as Locale, tool.id);
        if (content) {
            acc[tool.id] = {
                title: content.title,
                description: content.metaDescription
            };
        }
        return acc;
    }, {} as Record<string, { title: string; description: string }>);

    // Structured data: ItemList of the category's tools + breadcrumb
    const itemListSchema = generateItemListSchema(
        categoryLabel,
        toolsInCategory.map(tool => ({
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
            { name: categoryLabel, path: `/tools/category/${category}` },
        ],
        locale as Locale
    );

    return (
        <>
            <JsonLd data={[itemListSchema, breadcrumbSchema]} />
            <CategoryPageClient
                locale={locale as Locale}
                category={category as ToolCategory}
                localizedToolContent={localizedToolContent}
            />
        </>
    );
}
