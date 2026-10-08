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
 * Priority values for different page types
 */
const PRIORITY = {
  home: 1.0,
  tools: 0.9,
  category: 0.8,
  toolPage: 0.8,
  blog: 0.7,
  static: 0.6,
} as const;

/**
 * Change frequency for different page types
 */
const CHANGE_FREQUENCY = {
  home: 'daily',
  tools: 'weekly',
  category: 'weekly',
  toolPage: 'monthly',
  static: 'monthly',
} as const;

/**
 * Static pages that exist for all locales
 */
const STATIC_PAGES = [
  { path: '', priority: PRIORITY.home, changeFrequency: CHANGE_FREQUENCY.home },
  { path: '/tools', priority: PRIORITY.tools, changeFrequency: CHANGE_FREQUENCY.tools },
  { path: '/workflow', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
  { path: '/about', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
  { path: '/faq', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
  { path: '/privacy', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
  { path: '/contact', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
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
    entries.push({
      url: localizedUrl(locale, page.path),
      lastModified,
      changeFrequency: page.changeFrequency as 'daily' | 'weekly' | 'monthly',
      priority: page.priority,
    });
  }

  // Add category pages
  for (const category of TOOL_CATEGORIES) {
    entries.push({
      url: localizedUrl(locale, `tools/category/${category}`),
      lastModified,
      changeFrequency: CHANGE_FREQUENCY.category as 'weekly',
      priority: PRIORITY.category,
    });
  }

  // Add tool pages
  const tools = getAllTools();
  for (const tool of tools) {
    entries.push({
      url: localizedUrl(locale, `tools/${tool.slug}`),
      lastModified,
      changeFrequency: CHANGE_FREQUENCY.toolPage as 'monthly',
      priority: PRIORITY.toolPage,
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

  // Blog is English-only
  allEntries.push({
    url: `${siteConfig.url}/en/blog/`,
    lastModified,
    changeFrequency: 'weekly',
    priority: PRIORITY.blog,
  });
  for (const post of blogPosts) {
    allEntries.push({
      url: `${siteConfig.url}/en/blog/${post.slug}/`,
      lastModified: new Date(post.dateModified),
      changeFrequency: 'monthly',
      priority: PRIORITY.blog,
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
