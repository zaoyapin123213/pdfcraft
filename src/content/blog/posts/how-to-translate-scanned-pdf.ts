import { BlogPost } from '../types';

export const howToTranslateAScannedPdf: BlogPost = {
  slug: 'how-to-translate-scanned-pdf',
  title: 'How to Translate a Scanned PDF (Free, Step by Step)',
  h1: 'How to Translate a Scanned PDF',
  description:
    'Scanned PDFs are pictures, so normal translators cannot read them. This free step-by-step guide shows how to OCR a scanned PDF and translate it into 9 languages with the layout preserved.',
  keywords: [
    'how to translate scanned pdf',
    'translate scanned pdf',
    'translate scanned document',
    'scanned pdf translation',
    'ocr translate pdf',
    'translate pdf from scan',
    'how can i translate scanned documents',
    'translate scanned documents',
  ],
  datePublished: '2026-11-04',
  dateModified: '2026-11-04',
  category: 'Tutorials',
  readingMinutes: 16,
  relatedTools: [
    { title: 'Translate PDF', href: '/en/tools/translate-pdf/', description: 'Translate a text-based PDF into 9 languages with the original layout kept, plus a bilingual edition.' },
    { title: 'OCR PDF', href: '/en/tools/ocr-pdf/', description: 'Recover selectable text from scanned pages right in your browser.' },
    { title: 'PDF Reader', href: '/en/tools/pdf-reader/', description: 'Open and check the finished translation before you share it.' },
    { title: 'Edit PDF', href: '/en/tools/edit-pdf/', description: 'Fix a stray OCR typo without leaving the browser.' },
  ],
  faq: [
    { question: 'Is it free to translate a scanned PDF?', answer: 'Yes. Both steps are free on PDFEditorFree: the OCR tool recovers the text and the Translate PDF tool produces the translation. There is no account, no page quota and no watermark.' },
    { question: 'How accurate is the OCR step before translation?', answer: 'On clean printed scans, modern OCR reaches about 98 to 99 percent character accuracy, which is a 1 to 2 percent character error rate. Accuracy drops on crooked pages, faint print and handwriting, so scan quality directly controls translation quality.' },
    { question: 'What languages can I translate a scanned PDF into?', answer: 'Nine languages in any direction: English, Simplified Chinese, Japanese, Korean, Spanish, French, German, Portuguese and Russian. The source language can be detected automatically.' },
    { question: 'Will the translated PDF keep pictures and tables?', answer: 'Yes. The tool renders each original page as the base image, so photos, charts, stamps and signatures stay exactly where they were. Only the text areas are covered with translated wording.' },
    { question: 'Can I get a bilingual version instead of a translated-only file?', answer: 'Yes. Turn on the bilingual option before you translate. The output interleaves every original page with its translated page, which is ideal for checking terminology line by line.' },
    { question: 'How can I translate scanned documents without paying for software?', answer: 'Use the same two-step pairing on PDFEditorFree: run the scan through the free OCR PDF tool to recover the text layer, then open the result in Translate PDF and pick your target language. The translated and bilingual editions download directly, with no account, no page quota and no watermark.' },
    { question: 'Is it safe to translate confidential scans this way?', answer: 'The PDF file never leaves your device: parsing, rendering and composition all run in your browser. Only the extracted text strings are sent to the online translation service, and the tool shows this disclosure before you start.' },
  ],
  body: `
**TL;DR:** A scanned PDF is a photo of a page, not text, so ordinary translators see nothing to read. To translate one, run it through OCR first to recover the hidden text, then send that text to a translator and rebuild the pages. This guide shows exactly how to translate scanned pdf files in three free steps, entirely in your browser, and how to download a bilingual edition that pairs every original page with its translation. Once you know how to translate scanned pdf documents this way, the job takes about two minutes on any device. Start with the [Translate PDF](/en/tools/translate-pdf/) tool.

---

To translate a scanned PDF, recover its text with OCR first, then run the recovered file through a translator. That is the whole method. A scan is a picture of a page, so translators cannot see any words until OCR converts the picture back into real characters. The free workflow below uses two browser tools, the [OCR PDF](/en/tools/ocr-pdf/) tool and the [Translate PDF](/en/tools/translate-pdf/) tool, takes about two minutes for a typical page, supports nine target languages with automatic source detection, and produces a bilingual edition where every original page sits next to its translation.

If you have ever pasted a scanned file into an online translator and gotten nothing back, that failure is exactly what the steps above prevent. The letters you see on a scan are just ink in a photo. Press Ctrl+F on a scanned page and the search finds nothing, because there is no text inside a photo of a newspaper.

This guide walks through both steps in detail, shows what results to expect, and covers the small details that separate a clean translation from a mess. Everything runs on your own device, with no account and no watermark.

**Quick answer:** to translate a scanned PDF, first recover its text with the [OCR PDF](/en/tools/ocr-pdf/) tool, then open the recovered file in [Translate PDF](/en/tools/translate-pdf/), choose your target language, and download the bilingual or translated-only result. Both tools are free and run in your browser. So if you are asking 'how can I translate scanned documents' for free without installing anything, this two-step pairing is the answer, and the rest of this guide covers the details.

## What Is a Scanned PDF and Why Won't Normal Translation Tools Work on It?

A scanned PDF stores pages as images rather than text, so translation tools find no words to read until an OCR pass converts the picture of each letter back into real characters. Normal translators work only on text-based PDFs, which is why a scan comes back empty or throws an error.

Here is the background. There are two kinds of PDF, and they look identical on screen.

A **text-based PDF** contains actual characters. You can click and select a sentence, copy it, or search inside it. Files exported from Word, Google Docs or most modern apps are like this.

A **scanned PDF** (sometimes called an image PDF) contains one full-page picture per page. The letters you see are just ink in the photo. Press Ctrl+A and nothing highlights. Press Ctrl+F and the search finds nothing.

The PDF format itself is documented in the ISO 32000 standard, and it supports both styles equally well, which is why your eyes cannot tell them apart at a glance [ISO 32000-2 standard](https://www.iso.org/standard/75839.html). The quick test: try to select text. If you cannot, it is a scan, and it needs OCR before any translator can work on it.

OCR stands for Optical Character Recognition. It is software that looks at the picture and outputs the characters it recognizes, with their positions on the page. Once that text layer exists, the PDF behaves like a text-based file for every downstream tool, including translators.

## How Do You Translate a Scanned PDF Step by Step?

The complete workflow is: run the scanned file through OCR to recover its text layer, then feed the recovered file to a translation tool, then download either the translated edition or a bilingual edition that pairs each original page with its translation. On a typical one-page scan the whole process takes under two minutes, it runs entirely in your browser, and it is completely free with no account required.

We tested this exact workflow on a one-page English scan and watched it finish in seconds: parse, translate, compose, done. Here are the steps in detail.

### Step 1: Recover the text with OCR

Open the [OCR PDF](/en/tools/ocr-pdf/) tool and drop in your scanned file.

1. Pick the document language from the dropdown. This matters more than anything else you do. OCR engines are tuned per alphabet, and accuracy depends heavily on choosing correctly.
2. Click run. The tool processes each page in your browser and embeds a fresh text layer.
3. Download the result.

You now have a PDF that looks identical to the scan but carries invisible, selectable text underneath. Quick check: open it, try to select a sentence. If text highlights, you are ready for step 2.

### Step 2: Translate the recovered PDF

Open the [Translate PDF](/en/tools/translate-pdf/) tool and drop in the OCR output.

1. Choose the source language (or leave it on auto-detect) and pick the target language. The tool supports nine languages in any direction: English, Simplified Chinese, Japanese, Korean, Spanish, French, German, Portuguese and Russian.
2. Decide on the bilingual option. Leave it checked for your first run: the output interleaves every original page with its translated page, so you can verify terminology against the source.
3. Click translate and watch the progress bar. The tool reads each page locally, translates the text blocks online, then paints the translated wording onto the original layout.
4. Download the result. You get either a translated-only PDF or the bilingual edition, named after your original file.

### Step 3: Check the result before sharing

Open the download in the [PDF Reader](/en/tools/pdf-reader/) and skim one page against the original. Look for three things: names (OCR sometimes mangles unusual spellings), numbers (a wrong digit can change meaning), and any text the translator left untouched (it flags text it could not confidently read). If you spot a typo, the [Edit PDF](/en/tools/edit-pdf/) tool can cover and retype single words without a desktop app.

That is the whole workflow. Scan, OCR, translate, check, done.

### Notes for each step, from our own testing

We ran this workflow on real documents before writing this guide, and a few practical details kept coming up. They take thirty seconds to learn and save a lot of re-work.

**On the OCR step.** Choose the language before running, not after. If the scan is in Spanish and you leave English selected, accented characters turn into garbage, and the translation stage inherits the garbage. Also keep the original file name during downloads: the translated output inherits it, so you can always trace a result back to its source scan.

**On the translate step.** Leave bilingual mode on for the first pass. Machine translation is strong on facts and sentences, and weaker on idioms and specialized terms. The interleaved view lets you mark two or three paragraphs for a second look instead of re-reading everything. For a second, cleaner copy, re-run with bilingual mode off.

**On file size.** A phone photo can easily run 8 to 15 MB per page at full resolution. If a multi-page scan feels heavy, compress it first with the [Compress PDF](/en/tools/compress-pdf/) tool. Compressed scans process faster, and at 300 DPI the text quality is unchanged for translation purposes.

**On expectations.** A one-page scan finishes in seconds. A fifty-page report takes longer, mostly in the rendering stage, because each page is rebuilt locally in your browser at high resolution. That rendering is exactly what keeps figures, stamps and tables in place, so the wait buys you fidelity.

## What Should a Good Scanned PDF Translator Actually Do?

A good scanned PDF translator preserves the original layout, supports the languages you need, keeps the file on your device where possible, offers a bilingual view for verification and costs nothing to try. Most tools on the market fail at least one of these five points, so it pays to check before you upload anything confidential.

Here is the checklist we recommend, based on years of watching people get burned by the alternatives.

**Layout preservation.** Academic papers have two-column layouts. Contracts have numbered clauses. Engineering documents have tables and dimension lines. If the translator reflows everything into plain paragraphs, cross-references die and tables become soup. Layout preservation is the single hardest part of the job, and it is the difference between a usable result and a re-typing chore.

**Language coverage.** Translation quality and coverage matter more every year. Google Translate expanded by 110 languages in a single 2024 update, its largest jump ever [110 new languages are coming to Google Translate](https://blog.google/products/translate/110-new-languages/), and further additions brought the total to 249 languages and varieties [Google Translate language count](https://translate.google.com). Whatever tool you choose, confirm it covers your actual pair, because coverage is not uniform across engines.

**Privacy model.** A scanned contract or a medical report is sensitive. The strongest privacy setup keeps the file on your device and discloses exactly what leaves it. That is the model we built: the PDF is parsed and rendered locally in your browser, and only the extracted text strings travel to the translation service. The tool tells you this before you start, every time.

**Bilingual verification.** Machine translation is good but not perfect. A bilingual output, original page and translated page side by side, lets a human check the passages that matter (prices, dates, liabilities) instead of trusting the whole file blindly.

**Honest limits.** A tool that quietly accepts a 200-page scan and then produces garbage is worse than one that says "this is a scan, run OCR first". Look for tools that tell you what they cannot do.

## Which Documents Gain the Most From Scanned PDF Translation?

Almost any scanned document in a language you cannot read fluently benefits, but four categories come up again and again, and each one uses the output a little differently.

**Academic papers.** Research relevant to your field gets published in dozens of languages. A scholar who reads only English misses a large share of the global literature, and the gap is widest in fields with strong regional journals. Translating a scanned paper with layout intact keeps the figures, equations and citation numbering in place, so you can follow the argument and cite the source correctly.

**Contracts, quotes and tenders.** Cross-border business runs on documents that arrive as scans, often stamped, signed and photographed twice before reaching you. Here the bilingual edition matters most. A buyer can read the translated page while keeping the original next to it, so every price, deadline and liability clause can be verified against the source wording before anyone signs.

**Certificates and official records.** Birth certificates, transcripts, registration papers and court documents are almost always scans, because that is how institutions issue and archive them. Translation here is rarely about reading for pleasure. It is about submitting a readable copy alongside the original, which is exactly what the interleaved bilingual output produces.

**Manuals and equipment documentation.** Second-hand machinery, imported instruments and legacy hardware often come with a single manual in the factory's language. Scanning the relevant pages and translating them turns a paperweight into a usable reference, and because diagrams are preserved as part of the base page, the translated text stays matched to the illustration it describes.

The common thread across all four: the reader needs the meaning, but also needs to trust where that meaning came from. Layout-preserving bilingual output provides both, which is why we recommend it as the default mode in the [Translate PDF](/en/tools/translate-pdf/) tool.

## How Accurate Is Scanned PDF Translation Really?

Overall accuracy is the product of two stages: OCR accuracy times translation accuracy. On clean printed scans, OCR typically reaches 98 to 99 percent character accuracy (a 1 to 2 percent character error rate) [OCR accuracy comparison](https://pdf.ai/resources/ocr-accuracy-comparison), and modern engines hold around 95 percent or better even on plain setups [comparative OCR benchmarks](https://intuitionlabs.ai/articles/ai-ocr-models-pdf-structured-text-comparison). Translation then adds its own small error rate, so expect the final file to be very good but not flawless, and plan a quick human check of numbers and names.

A few details move the OCR stage a lot, and they are all under your control.

**Scan quality first.** Straight pages beat crooked ones. 300 DPI beats 150 DPI. Black text on white paper beats gray-on-gray. Screenshots of documents beat photos taken at an angle with shadows. Every one of those improvements flows straight into recognition accuracy.

**Print beats handwriting.** Benchmarks consistently show printed text in the high 90s while handwriting lands far lower, sometimes below 70 percent [real-world OCR accuracy test](https://parsea.io/blog/ocr-accuracy). If your document is handwritten, expect to proofread heavily.

**Translation stage expectations.** For everyday business and academic prose, modern engines produce clean, readable output. For poetry, legal nuance and idioms, keep the bilingual edition next to you. The translator is a brilliant first draft reader, not a sworn translator.

**Fix typos before you share.** If OCR misread one character in a critical number, the translation will faithfully translate the wrong number. A thirty-second check of dates, amounts and names in the [PDF Reader](/en/tools/pdf-reader/) catches almost all of these.

**A five-minute bilingual proofreading pass.** When the document really matters (a signed agreement, a submitted application), add this quick routine. Open the bilingual PDF and read only the translated pages. Mark any sentence that reads oddly. Flip to the matching original page and compare the marked line. Nine times out of ten the translation is right and your eye just caught an idiom. The tenth time, it caught a real error, and that one finding pays for the whole five minutes.

## Why Is Scanned PDF Translation Suddenly So Important?

Demand has exploded because three curves crossed at once: global study and business are more cross-border than ever, machine translation quality became genuinely usable, and the tools moved from expensive desktop suites to free browser pages. A task that used to need a paid specialist now needs two browser tabs and two minutes.

Consider the scale of the language problem. English accounts for roughly half of all website content, but far less of the world speaks it, a gap tracked continuously by [W3Techs language statistics](https://w3techs.com/technologies/overview/content_language). Documents follow the same imbalance. Research, tenders, certificates and manuals arrive in languages the recipient cannot read.

At the same time, translation engines got dramatically better and broader. Google's 2024 expansion added 110 languages in one update [the largest Translate expansion](https://blog.google/products/translate/110-new-languages/), and coverage has kept growing since [current language support](https://translate.google.com). Combined with OCR that handles most printed scans at 98 percent or better, the old excuse (machine output is unreadable) no longer holds for everyday documents.

The practical consequence shows up in real workflows. Students translate papers before citing them. Small firms translate supplier quotes before responding. Families translate immigration paperwork before signing. In each case, the bottleneck was never the translation engine. It was the scan sitting in front of it, unreadable by machines. Solve the OCR step and the rest follows.

## Common Problems and Quick Fixes

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Translator says the file has no text | The PDF is still a scan (no text layer) | Run [OCR PDF](/en/tools/ocr-pdf/) first, then translate the output |
| Translated text overflows its box | Source block had very tight spacing | Accept the small overflow, or re-run with the original at higher resolution |
| Some sentences stay in the original language | OCR missed faint or stylized lines | Re-scan at 300 DPI, straighten the page, re-run OCR |
| Names and numbers look wrong | OCR misread one character | Check names, dates and amounts against the original in the [PDF Reader](/en/tools/pdf-reader/), fix with [Edit PDF](/en/tools/edit-pdf/) |
| Handwriting comes out garbled | OCR is tuned for print | Expect heavy proofreading, or retype the key passages |
| File too large to process | High-resolution scans inflate size | Compress first with the [Compress PDF](/en/tools/compress-pdf/) tool, then translate |

One more pattern worth naming: mixed documents. Some PDFs contain a text-based first half and a scanned second half (a typed contract with a scanned signature page, for example). Run the OCR step on the whole file anyway. OCR on pages that already have text is harmless, and it guarantees the scanner pages become translatable too.

## Can You Translate Scanned PDFs on a Phone?

Yes, the whole workflow runs in a mobile browser with no app install, because both tools execute on the device rather than on a remote server. Photograph the document, upload it from your phone's storage, run OCR, translate, and download the bilingual file, all on the same screen you are holding.

Phone cameras have quietly become excellent scanners. The notes that matter are the same as on desktop: hold the camera parallel to the page, avoid shadows, and fill the frame. Modern phones also apply their own document-edge detection, which straightens pages before you even save.

Where phones fall behind desktops is proofreading. Reviewing a bilingual PDF on a 6-inch screen is slower and easier to rush. Our recommendation: translate on whatever device is in your hand, but do the final check of names and numbers on the biggest screen you have.

## Going Further: What to Do With the Translated File

The bilingual PDF you download is a regular PDF, so every other tool in the toolbox applies to it. A few combinations cover almost everything people do after translating.

**Annotate and correct.** Spotted a term the translator handled oddly? Mark it directly with the [Edit PDF](/en/tools/edit-pdf/) tool instead of printing and highlighting. The correction travels with the file when you send it.

**Sign the translated copy.** Contracts that were signed in the source language often need a second signature on the translated version. [Sign PDF](/en/tools/sign-pdf/) adds your signature in the browser, on the translated page, next to the original.

**Combine a batch into one file.** Translating a ten-scan batch produces ten outputs. [Merge PDF](/en/tools/merge-pdf/) joins them into a single document in any order, which is how we would assemble a multi-document application package.

**Trim the size before emailing.** Interleaved bilingual files carry roughly twice the pages, so if you need to email one, a quick pass through [Compress PDF](/en/tools/compress-pdf/) brings the attachment back to a friendly size.

The point is that translation is a step, not a destination. Keep the finished file moving: read it, correct it, sign it, combine it, send it. The [full tools index](/en/tools/) is one click away on every page.

## Wrap-Up: Build the Two-Tool Habit

A scanned PDF is a picture, and a picture cannot be translated until a machine can read it. That single fact explains every failed attempt you have ever had with an online translator, and it makes the solution boringly repeatable.

The habit is two tools and three steps. [OCR PDF](/en/tools/ocr-pdf/) recovers the text layer. [Translate PDF](/en/tools/translate-pdf/) turns it into your language, with the original layout preserved and a bilingual edition for checking. A quick pass in the [PDF Reader](/en/tools/pdf-reader/) catches the stray typo. Two minutes, no upload of your actual file, no account, no watermark.

If you deal with foreign-language documents regularly, bookmark the [full tools index](/en/tools/) as well. The same browser-only approach covers merging, splitting, compressing, editing and signing, so the document can go from scan to signed translation without ever touching a desktop app.

Try it now on the document sitting in your downloads folder: [Translate PDF](/en/tools/translate-pdf/).

---

## Frequently Asked Questions

### Is it free to translate a scanned PDF?

Yes. Both steps are free on PDFEditorFree: the OCR tool recovers the text and the Translate PDF tool produces the translation. There is no account, no page quota and no watermark.

### How accurate is the OCR step before translation?

On clean printed scans, modern OCR reaches about 98 to 99 percent character accuracy, which is a 1 to 2 percent character error rate [OCR accuracy comparison](https://pdf.ai/resources/ocr-accuracy-comparison). Accuracy drops on crooked pages, faint print and handwriting, so scan quality directly controls translation quality.

### What languages can I translate a scanned PDF into?

Nine languages in any direction: English, Simplified Chinese, Japanese, Korean, Spanish, French, German, Portuguese and Russian. The source language can be detected automatically.

### Will the translated PDF keep pictures and tables?

Yes. The tool renders each original page as the base image, so photos, charts, stamps and signatures stay exactly where they were. Only the text areas are covered with translated wording.

### Can I get a bilingual version instead of a translated-only file?

Yes. Turn on the bilingual option before you translate. The output interleaves every original page with its translated page, which is ideal for checking terminology line by line.

### Is it safe to translate confidential scans this way?

The PDF file never leaves your device: parsing, rendering and composition all run in your browser. Only the extracted text strings are sent to the online translation service, and the tool shows this disclosure before you start.
`,
};
