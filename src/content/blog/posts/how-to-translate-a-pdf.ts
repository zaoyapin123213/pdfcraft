import type { BlogPost } from '../types';

export const howToTranslateAPdf: BlogPost = {
  slug: 'how-to-translate-a-pdf',
  title: 'How to Translate a PDF: 4 Methods Compared (Free Options)',
  h1: 'How to Translate a PDF',
  description:
    'Translate any PDF four ways compared: layout-preserving browser tool, Google Translate limits, Word, DeepL. Scanned files need OCR first - here is why.',
  keywords: [
    'how to translate a pdf',
    'translate pdf document',
    'translate a pdf to english',
    'pdf translator',
    'translate pdf online',
    'translate pdf keep layout',
    'translate pdf free',
  ],
  datePublished: '2026-11-16',
  dateModified: '2026-11-16',
  category: 'Tutorials',
  readingMinutes: 11,
  relatedTools: [
    { title: 'Translate PDF', href: '/en/tools/translate-pdf/', description: 'Translate a whole PDF into 9 languages with the original layout kept, plus a bilingual edition.' },
    { title: 'OCR PDF', href: '/en/tools/ocr-pdf/', description: 'Scanned pages have no text to translate. Recover the text layer first.' },
    { title: 'Compress PDF', href: '/en/tools/compress-pdf/', description: 'Shrink oversized files so online translators accept them.' },
    { title: 'Split PDF', href: '/en/tools/split-pdf/', description: 'Divide a 400-page document into chunks under the 300-page cap.' },
  ],
  faq: [
    { question: 'What is the best way to translate a PDF?', answer: 'It depends on the file. Layout-critical documents go to a tool that paints the translation onto the original pages. Plain reports read fine through Google Translate. Its caps: 10 MB and 300 pages. Editable output goes through Word. Scans need OCR before any of it works.' },
    { question: 'How do I translate a PDF and keep the layout?', answer: 'Use a tool that translates on top of the original pages rather than rebuilding the document. The free Translate PDF tool renders each page as the visual base. Tables, stamps and columns stay put. The bilingual mode lets you check the wording against the source.' },
    { question: 'Why did Google Translate return an almost empty PDF?', answer: 'Your file is a scan: a photo of text with no text layer. The translator had nothing to read. Run it through the OCR PDF tool first, then translate the recovered file. The Ctrl+F test confirms the diagnosis in seconds.' },
    { question: 'How do I translate a scanned PDF?', answer: 'Two steps: OCR to recover the text, then translate. Both are free in the browser. The full procedure with accuracy expectations is in our scanned-PDF guide.' },
    { question: 'Is it safe to upload confidential PDFs to online translators?', answer: 'Treat an upload like an email to that provider. The file is processed on their servers. For contracts, medical records or financial documents, use a local tool. It keeps the document on your device and sends only short text strings for translation. Read the disclosure before you start.' },
  ],
  body: `
To translate a PDF, pick the method by what your file is. Text-based PDFs translate four ways. Use a layout-preserving browser tool, Google Translate's Documents tab, Microsoft Word, or DeepL. Scanned PDFs are a different case. They are pictures of pages, and every translator sees nothing to read. OCR must recover the text first. This page compares all four methods in one table. Then it hands you off to the detailed guide for your exact situation.

**TL;DR:** for PDFs that must keep their layout, use the free [Translate PDF tool](/en/tools/translate-pdf/). It paints the translation onto the original pages and offers a bilingual copy. For a quick reading copy of a plain report, [Google Translate](https://translate.google.com) is fastest. Its caps: 10 MB and 300 pages. Word is the pick when you need to edit while translating. DeepL leads on European-language quality. Scanned file? Run OCR first, whatever method you choose.

## On this page

- [Four methods, compared](#methods)
- [Method 1: the browser tool that keeps the layout](#browser)
- [Method 2: Google Translate](#google)
- [Method 3: Microsoft Word](#word)
- [Method 4: DeepL](#deepl)
- [Scanned PDFs: OCR comes first](#scans)
- [The detailed guides](#guides)
- [FAQ](#faq)

## Four methods, compared {#methods}

The right method is decided by three questions. Must the page still look like the original after translation? How big is the file? And who else may see it? The table answers all three at once:

| Method | Keeps layout? | Free limits | Best for |
| --- | --- | --- | --- |
| Browser tool (Translate PDF) | Yes - draws the translation onto the original pages | No size fee; 9 languages, bilingual output | Forms, certificates, confidential files |
| Google Translate (Documents tab) | No - rebuilds the document as plain text | 10 MB, 300 pages, one file per job | Quick reading copies of plain reports |
| Microsoft Word | Partial - the page reflows | Requires Microsoft 365 | Documents you must edit while translating |
| DeepL (web) | Mostly, in the paid workflow | About 5 MB and a monthly cap on free | European-language translation quality |

The one rule the table cannot show: these methods only work on text-based PDFs. Check your file first. Try to select a sentence. If the cursor highlights words, you are ready for any row of the table. If nothing highlights, the file is a scan. It needs OCR first, and that case is at the bottom of this page.

## Method 1: the browser tool that keeps the layout {#browser}

This is our tool, so weigh the bias yourself. The mechanism is the reason it exists. The [Translate PDF tool](/en/tools/translate-pdf/) renders each original page as the visual base. It translates the text blocks and paints the translated wording onto the same spots. Tables keep their grids. Stamps and signatures stay where the author left them. A two-column page comes out two-column.

The details that matter in practice:

- Nine target languages, in any direction: English, Simplified Chinese, Japanese, Korean, Spanish, French, German, Portuguese and Russian. Source detection is automatic.
- A bilingual option interleaves every original page with its translated page. It is the fastest way to check terminology line by line.
- The document itself is processed in your browser. Only the extracted text strings travel to the translation service. The interface says so before you start. For contracts with confidential pricing or medical paperwork, that difference decides the choice.

The honest trade-off: nine languages is a short list next to Google's coverage. Machine translation quality is also a draft to check, not a finished text. Names, numbers and dates deserve a spot-check against the original every time.

## Method 2: Google Translate {#google}

The Documents tab at [translate.google.com](https://translate.google.com) is the free default. It works today, with no account, in more languages than any competitor. Upload the file, pick two languages, and click Translate. A translated copy downloads. Google added 110 languages in 2024. The service now covers 249 languages and varieties, as [Google announced here](https://blog.google/products-and-platforms/products/translate/google-translate-new-languages-2024).

The caps decide whether your file gets in at all:

- 10 MB maximum file size. Image-heavy scans and brochures hit this first.
- 300 pages maximum. Book-length documents need splitting into parts.
- One file per job. A stack of thirty invoices means thirty uploads.
- Four accepted formats: .docx, .pdf, .pptx and .xlsx.

The output is the trade. Google rebuilds the document from extracted text. Columns collapse into prose, tables flatten, and design elements drop out. For a plain report you need to understand by tomorrow, that cost is nothing. For a form that must still look like a form, the cost is the whole point. Our full guide to [Google Translate and PDFs](/en/blog/can-google-translate-pdf-documents/) walks through the caps and the fixes.

## Method 3: Microsoft Word {#word}

Word opens PDFs by converting them into editable documents. It also carries a built-in translator under the Review tab. That combination fits one job: translating a document you intend to keep working in. Convert, translate, then edit the result directly. Fix a term, adjust a clause, or add your own notes. No second tool needed.

The trade is fidelity. The PDF-to-Word conversion reflows the page, so complex layouts arrive rearranged. Heavily designed files convert badly; simple reports and letters convert well. If your starting file is a scan, Word's conversion includes basic OCR on the way in. That sometimes rescues light scans that fail elsewhere.

No Microsoft 365 subscription, no method. No Office subscription? The browser tool or Google Translate covers the same ground free. And if you work the other direction, convert with the [Word to PDF](/en/tools/word-to-pdf/) tool first. Edit in Word, then translate the finished PDF instead.

## Method 4: DeepL {#deepl}

DeepL earned its reputation on European languages. Reviewers keep ranking its output ahead of the free giants for fluency on business prose. If your document is French, German, Spanish or Portuguese, DeepL is worth the upload. That holds especially when a customer will read the translation.

The constraints are real. The free web tier accepts files up to about 5 MB, with a monthly cap. Layout survives only approximately, and the best fidelity features sit in the paid plans. DeepL's language list is far shorter than Google's, so rare languages are out of scope. The pragmatic pattern: use DeepL for the quality-critical European pairs. Keep Google for breadth. Keep the layout-preserving tool for anything where the page itself must survive.

## Scanned PDFs: OCR comes first {#scans}

Every method above fails identically on a scan, so this limitation deserves its own section. A scanned PDF stores each page as one full-page photograph. The letters you see are ink in a picture. There is no text layer, so there is nothing for any translator to read. Google's uploader returns a nearly empty file. The mistake looks like a broken tool when the file is the problem.

The thirty-second diagnosis: open the PDF and press Ctrl+F. Search for a word you can see on the page. No match means no text layer, which means OCR first.

OCR (optical character recognition) reads the picture and outputs real characters with their positions. Run the scan through the free [OCR PDF tool](/en/tools/ocr-pdf/). Download the recovered file, then translate it through any method above. On clean printed scans, modern OCR reaches about 98 to 99 percent character accuracy. Crooked pages, faint print and handwriting drag the number down. The translation inherits every OCR error. Expect a draft, check names and numbers, and budget a manual pass for anything high-stakes. The complete walkthrough is in our guide to [translating a scanned PDF](/en/blog/how-to-translate-scanned-pdf/).

## The detailed guides {#guides}

Each situation below has a full guide with steps, settings and failure modes:

- [How to Translate a Scanned PDF](/en/blog/how-to-translate-scanned-pdf/) - the OCR-then-translate workflow in three steps, tested on real scans.
- [Translate a PDF From French to English](/en/blog/translate-pdf-french-to-english/) - three free ways for the most requested language pair.
- [How to Translate a PDF on Mac](/en/blog/how-to-translate-pdf-on-mac/) - Preview, Google Docs and browser methods compared for macOS.
- [Can Adobe Translate a PDF?](/en/blog/can-adobe-translate-a-pdf/) - what Acrobat's paid paths do, and where the free routes match them.
- [Can Google Translate PDF Documents?](/en/blog/can-google-translate-pdf-documents/) - the Documents tab in depth: caps, errors, and when to skip it.

Start with the tool itself if you already know your file is text-based. [Translate PDF](/en/tools/translate-pdf/), free, in your browser.

## FAQ {#faq}

**What is the best way to translate a PDF?**
It depends on the file. Layout-critical documents go to a tool that paints the translation onto the original pages. Plain reports read fine through Google Translate. Its caps: 10 MB and 300 pages. Editable output goes through Word. Scans need OCR before any of it works.

**How do I translate a PDF and keep the layout?**
Use a tool that translates on top of the original pages rather than rebuilding the document. The free [Translate PDF tool](/en/tools/translate-pdf/) renders each page as the visual base. Tables, stamps and columns stay put. The bilingual mode lets you check the wording against the source.

**Why did Google Translate return an almost empty PDF?**
Your file is a scan: a photo of text with no text layer. The translator had nothing to read. Run it through the [OCR PDF tool](/en/tools/ocr-pdf/) first, then translate the recovered file. The Ctrl+F test confirms the diagnosis in seconds.

**How do I translate a scanned PDF?**
Two steps: OCR to recover the text, then translate. Both are free in the browser. The full procedure with accuracy expectations is in the [scanned-PDF guide](/en/blog/how-to-translate-scanned-pdf/).

**Is it safe to upload confidential PDFs to online translators?**
Treat an upload like an email to that provider. The file is processed on their servers. For contracts, medical records or financial documents, use a local tool. It keeps the document on your device and sends only short text strings for translation. Read the disclosure before you start.
`,
};
