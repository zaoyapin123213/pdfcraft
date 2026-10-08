/**
 * Blog content registry
 * Aggregates all posts; static export prerenders one page per post (en only).
 */

import type { BlogPost } from './types';

export type { BlogPost, RelatedTool, BlogFAQ } from './types';

import { howToChangeFontColorInPdf } from './posts/how-to-change-font-color-in-pdf';
import { howToChangeFontInPdf } from './posts/how-to-change-font-in-pdf';
import { howToChangeFontSizeInPdf } from './posts/how-to-change-font-size-in-pdf';
import { howToOpenPdfInPaint } from './posts/how-to-open-pdf-in-paint';
import { canYouEditASignedPdf } from './posts/can-you-edit-a-signed-pdf';
import { howToEditAReadOnlyPdf } from './posts/how-to-edit-a-read-only-pdf';
import { howToEditPdfInIllustrator } from './posts/how-to-edit-pdf-in-illustrator';
import { howToMakeAnEditablePdfInCanva } from './posts/how-to-make-an-editable-pdf-in-canva';
import { howToAddTextToAPdf } from './posts/how-to-add-text-to-a-pdf';
import { howToInsertAnImageIntoAPdf } from './posts/how-to-insert-an-image-into-a-pdf';
import { howToAddALinkToAPdf } from './posts/how-to-add-a-link-to-a-pdf';
import { howToInsertALineInAPdf } from './posts/how-to-insert-a-line-in-a-pdf';
import { howToRotateAPdfInFirefox } from './posts/how-to-rotate-a-pdf-in-firefox';
import { howToReplaceTextInAPdf } from './posts/how-to-replace-text-in-a-pdf';
import { pdfFileEditorProgramCrossword } from './posts/pdf-file-editor-program-crossword';
import { pdfEditorForPackagingPrepress } from './posts/pdf-editor-for-packaging-prepress';
import { howToAdjustPdfContrastAndBrightness } from './posts/how-to-adjust-pdf-contrast-and-brightness';
import { macroPdfEditorReview } from './posts/macro-pdf-editor-review';
import { pi7PdfEditorReview } from './posts/pi7-pdf-editor-review';
import { swiftpdfReview } from './posts/swiftpdf-review';
import { xaraCloudPdfEditorReview } from './posts/xara-cloud-pdf-editor-review';
import { adobePdfPackFreeAlternative } from './posts/adobe-pdf-pack-free-alternative';
import { pdfToDesignGuide } from './posts/pdf-to-design-guide';
import { perpetualLicensePdfEditors } from './posts/perpetual-license-pdf-editors';
import { hipaaCompliantPdfEditor } from './posts/hipaa-compliant-pdf-editor';
import { portablePdfEditor } from './posts/portable-pdf-editor';

export const blogPosts: BlogPost[] = [
  howToChangeFontColorInPdf,
  howToChangeFontInPdf,
  howToChangeFontSizeInPdf,
  howToOpenPdfInPaint,
  canYouEditASignedPdf,
  howToEditAReadOnlyPdf,
  howToEditPdfInIllustrator,
  howToMakeAnEditablePdfInCanva,
  howToAddTextToAPdf,
  howToInsertAnImageIntoAPdf,
  howToAddALinkToAPdf,
  howToInsertALineInAPdf,
  howToRotateAPdfInFirefox,
  howToReplaceTextInAPdf,
  pdfFileEditorProgramCrossword,
  pdfEditorForPackagingPrepress,
  howToAdjustPdfContrastAndBrightness,
  macroPdfEditorReview,
  pi7PdfEditorReview,
  swiftpdfReview,
  xaraCloudPdfEditorReview,
  adobePdfPackFreeAlternative,
  pdfToDesignGuide,
  perpetualLicensePdfEditors,
  hipaaCompliantPdfEditor,
  portablePdfEditor,
].sort((a, b) => b.datePublished.localeCompare(a.datePublished));

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getBlogSlugList(): string[] {
  return blogPosts.map((p) => p.slug);
}

/**
 * Blog guides whose relatedTools include the given tool - used to render
 * "Related guides" links on tool pages (hub-and-spoke internal linking:
 * guides already link to tools; this returns the reciprocal direction).
 */
export function getBlogPostsForTool(toolSlug: string): Array<{
  slug: string;
  h1: string;
  description: string;
}> {
  return blogPosts
    .filter((p) =>
      p.relatedTools.some(
        (t) => t.href === `/en/tools/${toolSlug}/` || t.href === `/en/tools/${toolSlug}`
      )
    )
    .slice(0, 2)
    .map((p) => ({ slug: p.slug, h1: p.h1, description: p.description }));
}
