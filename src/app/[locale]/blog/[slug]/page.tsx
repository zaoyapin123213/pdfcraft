import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { getBlogPost, getBlogSlugList, blogPosts } from '@/content/blog';
import { JsonLd } from '@/components/seo/JsonLd';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const SITE_URL = 'https://pdfeditorfree.net';

interface BlogPostParams {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  // English-only; other locales 404 rather than duplicate content
  return getBlogSlugList().map((slug) => ({ locale: 'en', slug }));
}

/**
 * marked does not parse "{#id}" heading syntax. Posts use it for TOC
 * anchors, so convert those markers into real heading ids after parsing.
 */
function addHeadingIds(html: string): string {
  return html.replace(
    /<h([1-4])>([\s\S]*?)\s*\{#([\w-]+)\}<\/h\1>/g,
    (_match, level: string, inner: string, id: string) => `<h${level} id="${id}">${inner}</h${level}>`
  );
}

export async function generateMetadata({ params }: BlogPostParams): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const url = `${SITE_URL}/en/blog/${post.slug}/`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      siteName: 'PDFEditorFree',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      images: [{ url: `${SITE_URL}/images/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostParams) {
  const { locale, slug } = await params;
  if (locale !== 'en') notFound();

  const post = getBlogPost(slug);
  if (!post) notFound();

  const html = addHeadingIds(await marked.parse(post.body));
  const url = `${SITE_URL}/en/blog/${post.slug}/`;

  // Topical cluster: sibling guides in the same category (crawl + ranking)
  const relatedGuides = blogPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.h1,
      description: post.description,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      author: { '@type': 'Organization', name: 'PDFEditorFree Team', url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: 'PDFEditorFree',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      image: `${SITE_URL}/images/og-image.png`,
      inLanguage: 'en-US',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/en/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/en/blog/` },
        { '@type': 'ListItem', position: 3, name: post.h1, item: url },
      ],
    },
  ];

  if (post.faq.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale="en" />
      <JsonLd data={schemas} />
      <main id="main-content" className="flex-1 w-full max-w-3xl mx-auto px-4 pt-24 pb-16">
        <nav aria-label="Breadcrumb" className="text-sm text-[hsl(var(--color-muted-foreground))] mb-4">
          <Link href="/en/" className="hover:text-[hsl(var(--color-primary))]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/en/blog/" className="hover:text-[hsl(var(--color-primary))]">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-[hsl(var(--color-foreground))]">{post.category}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.h1}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--color-muted-foreground))] mb-8">
          <span>By PDFEditorFree Team</span>
          <span aria-hidden="true">•</span>
          <time dateTime={post.dateModified}>
            Updated {new Date(post.dateModified).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <span aria-hidden="true">•</span>
          <span>{post.readingMinutes} min read</span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <article className="blog-body" dangerouslySetInnerHTML={{ __html: html }} />

        {post.relatedTools.length > 0 && (
          <section className="mt-14" aria-labelledby="related-tools">
            <h2 id="related-tools" className="text-2xl font-bold mb-4">Try the tools from this guide</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {post.relatedTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-xl border border-[hsl(var(--color-border))] p-5 hover:border-[hsl(var(--color-primary))] transition-colors"
                >
                  <p className="font-semibold mb-1">{tool.title}</p>
                  <p className="text-sm text-[hsl(var(--color-muted-foreground))]">{tool.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {relatedGuides.length > 0 && (
          <section className="mt-14" aria-labelledby="related-guides">
            <h2 id="related-guides" className="text-2xl font-bold mb-4">Related guides</h2>
            <ul className="grid gap-3">
              {relatedGuides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/en/blog/${guide.slug}/`}
                    className="block rounded-xl border border-[hsl(var(--color-border))] p-5 hover:border-[hsl(var(--color-primary))] transition-colors"
                  >
                    <p className="font-semibold mb-1">{guide.h1}</p>
                    <p className="text-sm text-[hsl(var(--color-muted-foreground))]">{guide.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 pt-8 border-t border-[hsl(var(--color-border))]">
          <Link href="/en/blog/" className="text-sm font-medium text-[hsl(var(--color-primary))] hover:underline">
            ← Back to all PDF guides
          </Link>
        </div>
      </main>
      <Footer locale="en" />
    </div>
  );
}
