/**
 * Robots.txt Generation
 * Configures crawling rules for search engines AND AI / agentic crawlers.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

// Required for static export
export const dynamic = 'force-static';

const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Amazonbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Only block non-existent dynamic API paths.
        // /_next/ static assets (JS/CSS) stay crawlable so Googlebot can
        // render pages and AI crawlers can fetch resources.
        disallow: ['/api/'],
      },
      {
        // Explicitly welcome AI / agentic crawlers: they are already covered
        // by the wildcard rule above; listing them makes the policy
        // unambiguous for agent platforms that parse per-agent rules.
        userAgent: AI_AGENTS,
        allow: '/',
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
