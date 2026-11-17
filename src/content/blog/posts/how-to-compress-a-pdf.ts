import type { BlogPost } from '../types';

export const howToCompressAPdf: BlogPost = {
  slug: 'how-to-compress-a-pdf',
  title: 'How to Compress a PDF (Free, Local, Step by Step)',
  h1: 'How to Compress a PDF',
  description:
    'Compress a PDF in your browser: three methods, honest trade-offs, email size limits. Free, local, no account, plus fixes for files that will not shrink.',
  keywords: [
    'how to compress a pdf',
    'compress pdf',
    'reduce pdf file size',
    'compress pdf to 100kb',
    'compress pdf without losing quality',
    'shrink pdf file',
    'pdf too large to email',
  ],
  datePublished: '2026-11-16',
  dateModified: '2026-11-16',
  category: 'Tutorials',
  readingMinutes: 12,
  relatedTools: [
    { title: 'Compress PDF', href: '/en/tools/compress-pdf/', description: 'Three compression methods that run on your device, with no upload of the file.' },
    { title: 'Split PDF', href: '/en/tools/split-pdf/', description: 'Break a large file into parts when one chapter is all the recipient needs.' },
    { title: 'Merge PDF', href: '/en/tools/merge-pdf/', description: 'Join files first, then compress the single result once.' },
    { title: 'PDF to Word', href: '/en/tools/pdf-to-docx/', description: 'Convert instead of compressing when the recipient needs to edit the text.' },
  ],
  faq: [
    { question: 'Is it free to compress a PDF?', answer: 'Yes. The Compress PDF tool is free, with no account, no watermark and no page quota. The file is processed in your browser and never uploaded, so there is no size-based paywall.' },
    { question: 'How much smaller will my PDF get?', answer: 'It depends on what is inside. Text-heavy reports typically lose 10 to 30 percent. Image-heavy files can lose 50 to 90 percent with rasterization. A file that is already JPEG-compressed often shrinks by only a few percent.' },
    { question: 'Which compression setting should I choose?', answer: 'Start with the default: Standard, medium quality. Use Condense when the PDF has form fields or links you must keep. Use Photon only when size matters more than anything else. It converts pages to images and drops selectable text and interactivity.' },
    { question: 'Can I compress a PDF to exactly 100 KB?', answer: 'No tool guarantees an exact target size. For text-only documents of a few pages, 100 KB is usually reachable. For scans it rarely is: 20 KB per page across 5 pages is below legible resolution. Iterate instead: compress, check the size, lower the quality, repeat.' },
    { question: 'Why is my PDF still too big after compressing?', answer: 'Three usual causes: images already JPEG-compressed, full-page photo scans, or embedded fonts. Try Photon at 120 to 150 DPI. Or split the file and send only the needed pages.' },
  ],
  body: `
To compress a PDF, drop the file into the [Compress PDF](/en/tools/compress-pdf/) tool and click compress. Everything runs in your browser. The file never leaves your device. There is no upload wait, no account and no watermark. The tool is free and works in any modern browser, on any operating system.

**TL;DR:** PDFs get big for three reasons: images, embedded fonts and duplicated objects. The right compression method depends on which one dominates your file. This guide covers the causes, three compression tiers, and the size limits you actually hit. It ends with five fixes for files that refuse to shrink. If someone needs one chapter rather than the whole file, splitting beats compressing: [Split PDF](/en/tools/split-pdf/).

---

## On this page

- [Why PDF files get big](#why-big)
- [Three compression tiers and their trade-offs](#tiers)
- [How to compress a PDF step by step](#steps)
- [Attachment limits: what size fits where](#email)
- [Five pitfalls when a PDF will not shrink](#pitfalls)
- [FAQ](#faq)

## Why PDF files get big {#why-big}

PDF is a container format, defined in the ISO 32000-2 standard [ISO 32000-2 standard](https://www.iso.org/standard/75839.html). The container is cheap: a few hundred bytes of structure per page. The payload inside is what costs. Three payload types cause almost all large PDFs.

**Images first.** A scanned page at 300 DPI holds about 2,550 x 3,300 pixels on a US Letter sheet. Uncompressed, that is roughly 25 MB of raw color data per page. JPEG encoding brings it down to 0.5 to 2 MB. The builder's choices (DPI, quality, color depth) explain the spread. Those choices separate a 2 MB scan from a 40 MB one. Presentations behave the same way. Every slide becomes a full-resolution image object inside the PDF.

**Embedded fonts second.** A PDF can embed its fonts, so the file looks right on machines that lack them. A full Latin font adds 100 KB to 1 MB. A complete Chinese, Japanese or Korean font can add 5 to 20 MB. Some generators embed it whole for two characters. Font subsetting fixes this at the source. It embeds only the glyphs used, and shrinks those megabytes to kilobytes.

**Duplicated objects third.** A logo on 200 pages can be stored once and referenced 200 times. A naive generator instead copies it 200 times as separate image objects. Both are valid PDF. But 200 copies of a 50 KB logo is 10 MB of nothing. Files built by such generators carry that weight page after page.

There is a fourth, smaller cost: revision history. Some editors append changes instead of rewriting the file. Saving ten times can leave ten generations of objects inside. Garbage collection removes them.

## Three compression tiers and their trade-offs {#tiers}

Compression methods differ in what they may change. The [Compress PDF](/en/tools/compress-pdf/) tool offers three. The honest description of each includes what it costs.

**Tier 1: structural cleanup (Condense).** This method removes unused objects and merges duplicate resources. It rebuilds the file without touching page appearance. Text stays selectable, links keep working, form fields survive. Typical result: 5 to 30 percent smaller. Cost: nearly zero. This is the right first move for every file. It is the only safe move for files with form fields, signatures or hyperlinks. Those elements must keep working.

**Tier 2: image recompression (Standard).** This method re-encodes the images inside the file. You choose a quality level from low to maximum. It attacks the dominant cost in image-heavy files. Typical result: 30 to 70 percent smaller. Cost: image detail. At maximum quality the loss is hard to see on screen. At low quality, gradient fills band and fine print frays. Text pages lose almost nothing, because text is stored as characters rather than pixels.

**Tier 3: rasterization (Photon).** This method renders each page to a flat image at a DPI you pick. The default is 150. It then rebuilds the PDF from those images. It is the nuclear option, and it wins where the others cannot. A 60 MB design export can come out under 3 MB. Cost: everything interactive dies. Text stops being selectable, links stop working, form fields vanish. Zooming past the chosen DPI turns sharp edges soft. Use it when the file must clear a hard size limit. Assume the reader only needs to read.

One rule of thumb: try Condense, then Standard, then Photon. Stop at the first tier that gets you under your limit. Every step down the list buys size with fidelity.

## How to compress a PDF step by step {#steps}

The whole workflow runs locally in your browser. Nothing is uploaded, so it works offline and on confidential files alike.

1. Open the [Compress PDF](/en/tools/compress-pdf/) tool and drop in your file.
2. Pick the method. Default to Condense if the file has forms or links, Standard otherwise.
3. Pick a quality level. Medium is the sensible default. Choose maximum for print-ready output, low only for drafts.
4. Run it and compare. The tool reports the before and after sizes. Judge with numbers, not feelings.
5. Open the result and check the pages that matter most. Usually that is the smallest text or the busiest image.
6. If the file is still over your limit, step down one tier and run again.

A useful habit for repeated sends: note the method and quality that worked. The second compress of a similar file takes thirty seconds instead of an experiment.

## Attachment limits: what size fits where {#email}

Most compression sessions have one goal: get under a specific cap. These are the limits people hit most often. Published caps change, so confirm with the provider when a send really matters.

| Recipient system | Typical cap | What that fits |
| --- | --- | --- |
| Gmail / Google Workspace | 25 MB per message | 100+ pages of a text report, or 10 to 25 scanned pages |
| Outlook.com | 20 MB per message | 80+ text pages, or 8 to 20 scanned pages |
| Yahoo Mail | 25 MB per message | Same ballpark as Gmail |
| Corporate mail (Exchange) | Often 10 MB by default | 40+ text pages, or 4 to 10 scanned pages |
| Government or job portals | Often 1 to 2 MB per file | 5 to 30 text pages; scans usually need rasterization |

The scanned-pages column is where compression earns its keep. A 25 MB scan attachment exceeds every row of that table. The same scan at 150 DPI through Photon lands under 5 MB. That clears even the 10 MB corporate default.

Two notes on the table. First, the caps count the whole message, attachments plus the body. Second, some limits beat any compressor. A 30-page scan against a 1 MB portal cap needs fewer pages, not smaller pixels. Split it with the [Separate PDF into Individual Pages](/en/blog/separate-pdf-into-individual-pages/) guide. Or convert it to text with the [Transfer a PDF to a Word Document](/en/blog/transfer-pdf-to-word-document/) walkthrough. Send what the form asks for.

## Five pitfalls when a PDF will not shrink {#pitfalls}

**1. The file is already compressed.** The images inside may already be JPEG-encoded at a reasonable quality. Re-encoding them buys a few percent at best. It adds artifacts at worst. If Standard gains under 5 percent, the images are near their floor. Either accept the size, or switch to Photon. Photon changes the approach instead of shaving the same pixels again.

**2. Naive re-encoding makes scans bigger.** Re-saving a JPEG scan through a lossless pipeline can inflate the file. Lossless encoding cannot improve on JPEG. It often stores the same pixels less efficiently. For scans, match the method to the material. Photon with JPEG output at 120 to 150 DPI shrinks scans reliably.

**3. The file is text, and there is nothing to give.** A 40 KB letter of pure text has no images and no font bloat. Compressing it yields 38 KB, which is not a win. The real lever is page count. Delete the appendix pages ([Delete PDF Pages for Free](/en/blog/delete-pdf-pages-for-free/)). Or split the file into chapters.

**4. Embedded fonts dominate, and cleanup cannot rewrite fonts.** Condense garbage-collects unused objects, but it leaves a fully embedded CJK font alone. Rewriting fonts risks breaking rendering. If your generator offers a subset-fonts option, re-export from the source. That single checkbox often saves more megabytes than any compression pass.

**5. Rasterization destroys things silently.** Photon makes files small, and nobody notices the losses until a reader does. A link no longer opens. A form field no longer accepts typing. Check any interactive feature before you send a rasterized file. If the recipient must fill the form, go back to Condense. Find the megabytes elsewhere.

One more honest note on expectations. Compression is subtraction, not magic. A file whose bulk is 40 pages of 300 DPI scans will never reach 100 KB legibly. That budget is 2.5 KB per page, below the resolution of readable print. Files with that target need fewer pages, not smaller pixels.

## What compression is worth when privacy matters {#privacy}

Uploaded compressors see your document. That trade is fine for a menu. It is not fine for a contract, a medical record or a payroll file. A local browser tool parses and rewrites the file on your device. The document never crosses the network. Upload-based services, including [Adobe's compress tool page](https://www.adobe.com/learn/acrobat/web/compress-pdf), state that model openly. The file travels to their servers before processing starts. For everyday files that is often acceptable. For the files above, local wins on principle as well as speed. A 20 MB file compresses in seconds because there is no upload leg at all.

## FAQ {#faq}

### Is it free to compress a PDF?

Yes. The Compress PDF tool is free, with no account, no watermark and no page quota. The file is processed in your browser and never uploaded, so there is no size-based paywall.

### How much smaller will my PDF get?

It depends on what is inside. Text-heavy reports typically lose 10 to 30 percent. Image-heavy files can lose 50 to 90 percent with rasterization. A file that is already JPEG-compressed often shrinks by only a few percent.

### Which compression setting should I choose?

Start with the default: Standard, medium quality. Use Condense when the PDF has form fields or links you must keep. Use Photon only when size matters more than anything else. It converts pages to images and drops selectable text and interactivity.

### Can I compress a PDF to exactly 100 KB?

No tool guarantees an exact target size. For text-only documents of a few pages, 100 KB is usually reachable. For scans it rarely is: 20 KB per page across 5 pages is below legible resolution. Iterate instead: compress, check the size, lower the quality, repeat.

### Why is my PDF still too big after compressing?

Three usual causes: images already JPEG-compressed, full-page photo scans, or embedded fonts. Try Photon at 120 to 150 DPI. Or split the file and send only the needed pages.

---

Try it on the file sitting in your drafts: [Compress PDF](/en/tools/compress-pdf/). If the recipient needs to edit rather than read, conversion beats compression. The [PDF to Word](/en/tools/pdf-to-docx/) tool produces an editable document instead of a smaller frozen one.
`,
};
