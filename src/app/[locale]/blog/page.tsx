import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts } from '@/content/blog';
import { JsonLd } from '@/components/seo/JsonLd';
import { generateWebSiteSchema } from '@/lib/seo';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const BLOG_URL = 'https://pdfeditorfree.net/en/blog/';

export function generateStaticParams() {
  // Blog is English-only; other locales intentionally 404 to avoid
  // duplicating identical English content across language folders.
  return [{ locale: 'en' }];
}

export const metadata: Metadata = {
  title: 'PDF Blog - Guides, Tutorials & Editor Reviews',
  description:
    'Step-by-step PDF guides: change font color and size, edit signed or read-only PDFs, replace text, add links and images, plus honest reviews of PDF editors.',
  alternates: { canonical: BLOG_URL },
  openGraph: {
    type: 'website',
    url: BLOG_URL,
    title: 'PDF Blog - Guides, Tutorials & Editor Reviews | PDFEditorFree',
    description:
      'Step-by-step PDF guides and honest editor reviews. Every tutorial is free to follow with a browser-based PDF tool - no uploads, no signup.',
    siteName: 'PDFEditorFree',
  },
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header locale="en" />
      <JsonLd
        data={[
          generateWebSiteSchema('en'),
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'PDFEditorFree PDF Blog',
            url: BLOG_URL,
            description:
              'PDF tutorials, how-to guides and editor reviews. Learn to edit, convert, secure and optimize PDF files for free.',
            blogPost: blogPosts.map((p) => ({
              '@type': 'BlogPosting',
              headline: p.h1,
              url: `https://pdfeditorfree.net/en/blog/${p.slug}/`,
              datePublished: p.datePublished,
              dateModified: p.dateModified,
            })),
          },
        ]}
      />
      <main id="main-content" className="flex-1 w-full max-w-4xl mx-auto px-4 pt-24 pb-16">
        <p className="text-sm font-semibold text-[hsl(var(--color-primary))] mb-2">PDF Blog</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">PDF Guides, Tutorials &amp; Editor Reviews</h1>
        <p className="text-lg text-[hsl(var(--color-muted-foreground))] mb-10">
          Practical, step-by-step answers to the most-searched PDF questions. Every guide comes with a
          free browser-based tool - your files never leave your device.
        </p>

        <div className="grid gap-6">
          {blogPosts.map((post) => (
            <article key={post.slug} className="group rounded-xl border border-[hsl(var(--color-border))] p-6 hover:border-[hsl(var(--color-primary))] transition-colors">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--color-muted-foreground))] mb-2">
                <span className="rounded-full bg-[hsl(var(--color-muted))] px-2.5 py-0.5">{post.category}</span>
                <time dateTime={post.dateModified}>{post.dateModified}</time>
                <span>{post.readingMinutes} min read</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                <Link href={`/en/blog/${post.slug}/`} className="group-hover:text-[hsl(var(--color-primary))] transition-colors">
                  {post.h1}
                </Link>
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-3">{post.description}</p>
              <Link
                href={`/en/blog/${post.slug}/`}
                className="text-sm font-medium text-[hsl(var(--color-primary))] hover:underline"
              >
                Read the guide →
              </Link>
            </article>
          ))}
        </div>
      </main>
      <Footer locale="en" />
    </div>
  );
}
