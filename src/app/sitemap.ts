/**
 * Sitemap Generation
 * Generates sitemap.xml for all pages across all locales
 *
 * URL rules:
 * - All URLs use a trailing slash to match the `trailingSlash: true`
 *   config and the rendered canonical tags exactly.
 * - Tool pages are generated for every locale (zh-TW falls back to zh
 *   content), category/workflow/static pages exist for every locale.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { locales, type Locale } from '@/lib/i18n/config';
import { getAllTools } from '@/config/tools';
import { TOOL_CATEGORIES } from '@/types/tool';
import { blogPosts } from '@/content/blog';

// Required for static export
export const dynamic = 'force-static';

/**
 * Static pages that exist for all locales
 */
const STATIC_PAGES = [
  { path: '' },
  { path: '/tools' },
  { path: '/workflow' },
  { path: '/about' },
  { path: '/faq' },
  { path: '/privacy' },
  { path: '/contact' },
];

/**
 * Build a localized URL with trailing slash, matching canonical tags
 */
function localizedUrl(locale: Locale, path: string): string {
  const cleanPath = path === '' ? '' : `/${path.replace(/^\//, '').replace(/\/$/, '')}`;
  return `${siteConfig.url}/${locale}${cleanPath}/`;
}

/**
 * Generate sitemap entries for a specific locale
 */
function generateLocaleEntries(locale: Locale, lastModified: Date): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Add static pages
  for (const page of STATIC_PAGES) {
    // lastmod omitted: same honesty rule as tool pages (no per-page dates)
    entries.push({
      url: localizedUrl(locale, page.path),
    });
  }

  // Add category pages
  for (const category of TOOL_CATEGORIES) {
    entries.push({
      url: localizedUrl(locale, `tools/category/${category}`),
    });
  }

  // Add tool pages
  const tools = getAllTools();
  for (const tool of tools) {
    // lastmod omitted: no per-tool content dates exist, and a build
    // timestamp is not a truthful modification date (Google discounts it)
    entries.push({
      url: localizedUrl(locale, `tools/${tool.slug}`),
    });
  }

  return entries;
}

/**
 * Generate the complete sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const allEntries: MetadataRoute.Sitemap = [];

  // Blog is English-only; entries carry the post's real dateModified
  allEntries.push({
    url: `${siteConfig.url}/en/blog/`,
    lastModified,
  });
  for (const post of blogPosts) {
    allEntries.push({
      url: `${siteConfig.url}/en/blog/${post.slug}/`,
      lastModified: new Date(post.dateModified),
    });
  }

  // Generate entries for each locale
  for (const locale of locales) {
    const localeEntries = generateLocaleEntries(locale, lastModified);
    allEntries.push(...localeEntries);
  }

  return allEntries;
}

/**
 * Get total number of URLs in sitemap
 * Useful for testing and validation
 */
export function getSitemapUrlCount(): number {
  const tools = getAllTools();
  const pagesPerLocale = STATIC_PAGES.length + TOOL_CATEGORIES.length + tools.length;
  return pagesPerLocale * locales.length;
}
