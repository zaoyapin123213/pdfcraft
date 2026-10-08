/**
 * Blog content types
 *
 * Blog posts are English-only (en locale). Each post targets a cluster of
 * long-tail Google keywords with identical search intent (one keyword ->
 * exactly one page), and links internally to the matching tool pages.
 */

export interface RelatedTool {
  title: string;
  href: string; // relative, e.g. /en/tools/merge-pdf/
  description: string;
}

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  /** SEO title tag, ideally < 60 chars */
  title: string;
  /** Visible H1 (may differ slightly from title tag) */
  h1: string;
  /** Meta description, < 160 chars */
  description: string;
  /** Keyword cluster this page targets (for internal reference & meta keywords) */
  keywords: string[];
  datePublished: string; // ISO date
  dateModified: string; // ISO date
  category: string;
  /** ~reading time in minutes */
  readingMinutes: number;
  relatedTools: RelatedTool[];
  faq: BlogFAQ[];
  /** Markdown body (no HTML script tags) */
  body: string;
}
