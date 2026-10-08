import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import { generateBaseMetadata } from '@/lib/seo';
import WorkflowPageClient from './WorkflowPageClient';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

interface WorkflowPageProps {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({
    params,
}: WorkflowPageProps): Promise<Metadata> {
    const { locale } = await params;
    const validLocale = locales.includes(locale as Locale) ? (locale as Locale) : 'en';
    const t = await getTranslations({ locale: validLocale, namespace: 'workflow' });

    // Without its own metadata this page would inherit the homepage's
    // title AND canonical URL, effectively telling Google not to index it.
    return generateBaseMetadata({
        locale: validLocale,
        path: '/workflow',
        title: t('metaTitle'),
        description: t('metaDescription'),
        keywords: ['pdf workflow', 'batch pdf processing', 'automate pdf tasks', 'pdf pipeline'],
    });
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
    const { locale } = await params;

    // Enable static rendering
    setRequestLocale(locale);

    return <WorkflowPageClient locale={locale as Locale} />;
}
