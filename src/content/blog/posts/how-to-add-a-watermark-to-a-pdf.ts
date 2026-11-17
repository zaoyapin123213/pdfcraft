import type { BlogPost } from '../types';

export const howToAddAWatermarkToAPdf: BlogPost = {
  slug: 'how-to-add-a-watermark-to-a-pdf',
  title: 'How to Add a Watermark to a PDF (Free, Text or Image)',
  h1: 'How to Add a Watermark to a PDF',
  description:
    'Add a watermark to any PDF free: text, image or stamp, with opacity and tiling control. No upload. DRAFT contracts covered step by step.',
  keywords: [
    'how to add a watermark to a pdf',
    'add watermark to pdf',
    'pdf watermark',
    'draft watermark pdf',
    'add text watermark to pdf',
    'add image watermark to pdf',
    'free pdf watermark tool',
  ],
  datePublished: '2026-11-16',
  dateModified: '2026-11-16',
  category: 'Tutorials',
  readingMinutes: 12,
  relatedTools: [
    { title: 'Add Watermark to PDF', href: '/en/tools/add-watermark/', description: 'Apply a text or image watermark to one page or the whole document, with opacity and rotation control.' },
    { title: 'Add Stamps to PDF', href: '/en/tools/add-stamps/', description: 'Place APPROVED, DRAFT or date stamps at a spot on the page, like ink.' },
    { title: 'Flatten PDF', href: '/en/tools/flatten-pdf/', description: 'Bake the watermark into the page so it prints identically everywhere.' },
    { title: 'Encrypt PDF', href: '/en/tools/encrypt-pdf/', description: 'Watermarks mark; encryption actually restricts. Add a password when it matters.' },
  ],
  faq: [
    { question: 'How do I add a watermark to a PDF for free?', answer: 'Open the free Add Watermark tool in your browser and drop in the PDF. Choose a text or image watermark, set position, rotation and opacity, and apply it to all pages. It runs locally, with no account and no watermark of its own on the output.' },
    { question: 'What opacity should a PDF watermark be?', answer: 'For a watermark you can read over, 30 to 50 percent works on most documents. A large diagonal DRAFT over contract text reads fine at 20 to 30 percent. Below about 15 percent, the mark vanishes in print. Above about 60 percent, it starts to fight the body text.' },
    { question: 'How do I put a DRAFT watermark on every page?', answer: 'Pick the text watermark type and type DRAFT. Set rotation to 45 degrees and opacity to about 25 percent. Choose a diagonal or tiled placement and apply to all pages. A typical 12-page agreement takes under a minute.' },
    { question: 'Can a watermark be removed from a PDF?', answer: 'Yes. A watermark is ordinary page content, not protection. Anyone with a PDF editor can delete it or cover it. Use a watermark to communicate status. Use encryption or a digital signature when you need an actual restriction or tamper evidence.' },
    { question: 'Why does my watermark sit at the wrong angle on some pages?', answer: 'Those pages are probably rotated landscape pages stored inside a portrait document. The watermark coordinates follow the stored page, not how the viewer displays it. Check the preview page by page, normalize the rotation first, or set the watermark per page range.' },
  ],
  body: `
You can add a watermark to a PDF in about a minute, free, with no installs. Open the file in a browser tool. Type your text or pick an image, set the opacity, and apply it to every page. Three watermark types cover different jobs: text for status, images for branding, stamps for approvals. Below you will find the type that fits. Plus the settings that look professional, and the two mistakes that ruin first attempts.

**TL;DR:** open the free [Add Watermark tool](/en/tools/add-watermark/), drop in your PDF, pick a text or image watermark. Set opacity to 30-50 percent and apply to all pages. For contracts still circulating, tile the word DRAFT diagonally at 20-30 percent on every page. Two pitfalls come first: rotated pages move your watermark, and form fields can cover it. One honest limit: a watermark marks a document. It does not protect it.

## On this page

- [Three watermark types and when each fits](#types)
- [Opacity and layer order](#opacity)
- [The DRAFT contract workflow](#draft)
- [Two pitfalls that ruin watermarks](#pitfalls)
- [What a watermark does not do](#limits)
- [FAQ](#faq)

## Three watermark types and when each fits {#types}

The core workflow is the same for every type, and it takes three steps. Open the [Add Watermark tool](/en/tools/add-watermark/) and drop in your file. Choose the watermark type, its position, its rotation and its opacity. Apply it to all pages and download. The only real decision is which type fits your document.

**Text watermarks** are words set across the page: DRAFT, CONFIDENTIAL, COPY, SAMPLE, or your company name. This is the type for status marking. A text watermark adds a few kilobytes to the file. It stays sharp at any zoom level. Anyone can read it on a black-and-white printout. Use one whenever a document might be mistaken for its final version.

**Image watermarks** are pictures, usually a logo, laid across the page. This is the type for branding. A product brochure, a quotation template, a slide deck exported to PDF. A light logo watermark on every page says the document is yours. And it does so without covering the content. Use a PNG with a transparent background, roughly 200 to 400 pixels wide. At normal page sizes that is plenty of resolution. It also keeps the file small.

**Stamps** are the third type, and they come from a different tool. A stamp sits at one spot on the page, like ink on paper. Examples: APPROVED over the signature block, REVIEWED in the margin, a date beside a signature line. The [Add Stamps tool](/en/tools/add-stamps/) carries preset stamps for exactly this. Pick a stamp when the mark must sit at a precise location. Pick a watermark when the mark should claim the whole page.

Acrobat can add watermarks too. Adobe documents its version on its [watermark help page](https://helpx.adobe.com/acrobat/using/add-watermarks-pdfs.html). The browser tool above does the same job free and locally, with no account. That is why this guide uses it for the workflows below.

## Opacity and layer order {#opacity}

Opacity decides whether a watermark looks professional or ruins the page. Two numbers cover most needs.

For a readable document with the mark behind the text, work between 30 and 50 percent opacity. At 40 percent, a diagonal CONFIDENTIAL is unmistakable on screen. Every sentence still reads cleanly. Below about 15 percent, the mark all but disappears once the page prints or photocopies. Above about 60 percent, it starts competing with the body text.

For a large DRAFT laid over dense contract text, go lower: 20 to 30 percent. The word is huge, so it does not need strength to be seen.

Layer order matters as much as opacity. A watermark can be drawn behind the page content or over it. Behind keeps every word readable. That is the right choice for documents people will read on screen. Over the top is bolder and survives photocopying better. But it can wash out small print like footnotes and table cells. When a document has both, use the behind-the-text placement and a slightly higher opacity.

One more setting earns its keep on long documents: tiling. Tiling repeats the watermark in a grid across the whole page. It is the standard choice for draft contracts. Any single page copied out of the file still carries the mark.

## The DRAFT contract workflow {#draft}

Here is the scenario that sends most people looking for this guide. A contract draft is about to circulate among several parties. If someone signs an early version by mistake, the cleanup is painful. A DRAFT watermark on every page is cheap insurance.

The steps take under a minute on a typical 12-page agreement:

1. Open the [Add Watermark tool](/en/tools/add-watermark/) and drop in the contract.
2. Choose a text watermark and type DRAFT. Add the version and date if it helps: DRAFT v3 - 2026-11-16.
3. Set rotation to 45 degrees and opacity to about 25 percent. Pick a diagonal or tiled placement.
4. Apply to all pages, download, and send the marked file. Keep the clean original unsigned.

Three habits make this workflow reliable. First, apply the mark to the copy that circulates. Keep a clean master file for the final version. The final contract should go out from the clean original. Never from an unmarked copy of uncertain lineage. Second, mark the file the same day you send it. A draft marked hours later protects no one in between. Third, when the final version goes out, check page 1 of the clean file. Confirming the absence of the mark takes five seconds. It prevents the opposite embarrassment.

Stamp-based teams run a variant of this. Instead of tiling DRAFT, they place a dated DRAFT stamp at the top of page 1. The [Add Stamps tool](/en/tools/add-stamps/) handles it. It is tidier, and it suits internal review copies where a full-page mark feels heavy.

## Two pitfalls that ruin watermarks {#pitfalls}

**Pitfall 1: rotated pages.** Some PDFs mix portrait and landscape pages. They store every page as portrait and add a rotation flag. The viewer turns the landscape pages for display. The watermark does not follow the display. Its coordinates follow the stored page. So a 45-degree diagonal can show up horizontal or vertical on a rotated page. It can even land off the visible area, while looking perfect on nearby pages. The fix: watch the preview page by page as you set the watermark. If mixed pages exist, set the watermark per page range. Or normalize rotation first with the [Rotate PDF](/en/tools/rotate-pdf/) tool, watermark, then rotate back.

**Pitfall 2: form fields.** Fillable form fields render above the page content in every PDF viewer. Two consequences follow. A watermark drawn behind the content disappears behind any field with an opaque background. So the mark can look fine on the blank form and vanish from the filled one. A watermark drawn over the content can wash out the field labels. That makes the form harder to fill. The practical check: test with one filled field before circulating. If the mark hides, drop the opacity to 20-25 percent. Or move the watermark away from the form area. If the form is finished and only needs the mark for the record, flatten it. The [Flatten PDF](/en/tools/flatten-pdf/) tool merges everything into one layer. The watermark then shows across the whole page.

## What a watermark does not do {#limits}

This is the honest part, and it matters more than the settings.

A watermark is a visual marker. It is not encryption, and it is not a permission system. Anyone who can edit the file can remove a watermark in one pass. Anyone with a screenshot can copy it onto something else. Treat the mark as a message to honest readers. That is exactly who it works on.

It also does not prove anything. A watermark does not identify the author. It does not timestamp the document. It does not detect later edits. For tamper evidence, the PDF world uses digital certificate signatures. For confidentiality, use encryption: the [Encrypt PDF](/en/tools/encrypt-pdf/) tool adds a real password in seconds. Watermark the pages, then encrypt the file. That gives you both the message and the lock.

## FAQ {#faq}

**How do I add a watermark to a PDF for free?**
Open the free [Add Watermark tool](/en/tools/add-watermark/) in your browser and drop in the PDF. Choose a text or image watermark. Set position, rotation and opacity, then apply to all pages. It runs locally, with no account. The output carries no watermark of its own.

**What opacity should a PDF watermark be?**
30 to 50 percent for a readable watermark behind text. A large diagonal DRAFT over contract text works at 20 to 30 percent. Below about 15 percent the mark vanishes in print. Above about 60 percent it fights the body text.

**How do I put a DRAFT watermark on every page?**
Text watermark, the word DRAFT, 45-degree rotation, about 25 percent opacity. Choose diagonal or tiled placement, applied to all pages. Send the marked copy. Keep the clean original for the final version.

**Can a watermark be removed from a PDF?**
Yes. A watermark is ordinary page content, not protection. Any PDF editor can delete or cover it. Pair the mark with encryption or a digital signature when the document needs a real restriction.

**Why does my watermark sit at the wrong angle on some pages?**
Those pages carry a rotation flag: stored portrait, displayed landscape. Watermark coordinates follow the stored page. Normalize the rotation first, or set the watermark per page range. Check the preview as you go.
`,
};
