import type { Metadata } from 'next';
import Link from 'next/link';
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
    'translate': 'translate',
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

    // Labels that already end in "PDF" (Convert to PDF / Convert from PDF /
    // Secure PDF) would produce "Convert to PDF PDF Tools" via the generic
    // template - special-case them in English.
    const endsWithPdf = validLocale === 'en' && /pdf$/i.test(categoryLabel.trim());
    const title = endsWithPdf
        ? `${categoryLabel} - Free Online Tools`
        : tMeta('category.title', { category: categoryLabel });
    const description = endsWithPdf
        ? `${categoryLabel} free online - fast, secure and private. All processing happens locally in your browser, no signup.`
        : tMeta('category.description', { category: categoryLabel });

    // Full metadata with canonical URL, hreflang alternates and OG tags.
    // The generic title/description this page had before gave Google an
    // English-only, canonical-less page in every language.
    return generateBaseMetadata({
        locale: validLocale,
        path: `/tools/category/${category}`,
        title,
        description,
        keywords: [`${categoryLabel}`, 'free PDF tools', 'online PDF tools'],
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

    // Hub reciprocates the cluster: link up to 4 guides whose relatedTools
    // point at tools in this category (fixes the hub dead-end found in audit)
    const { blogPosts } = await import('@/content/blog');
    const relatedPosts = blogPosts
        .filter((p) =>
            p.relatedTools.some((t) =>
                toolsInCategory.some((tool) => t.href === `/en/tools/${tool.slug}/` || t.href === `/en/tools/${tool.slug}`)
            )
        )
        .slice(0, 4);

    return (
        <>
            <JsonLd data={[itemListSchema, breadcrumbSchema]} />
            <CategoryPageClient
                locale={locale as Locale}
                category={category as ToolCategory}
                localizedToolContent={localizedToolContent}
            />
            {relatedPosts.length > 0 && (
                <section className="max-w-4xl mx-auto px-4 pb-16 w-full" aria-labelledby="related-guides-hub">
                    <h2 id="related-guides-hub" className="text-2xl font-bold mb-4">Related guides</h2>
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {relatedPosts.map((p) => (
                            <li key={p.slug}>
                                <Link
                                    href={`/${locale}/blog/${p.slug}/`}
                                    className="block rounded-xl border border-[hsl(var(--color-border))] p-5 hover:border-[hsl(var(--color-primary))] transition-colors h-full"
                                >
                                    <p className="font-semibold mb-1">{p.h1}</p>
                                    <p className="text-sm text-[hsl(var(--color-muted-foreground))]">{p.description}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </>
    );
}
