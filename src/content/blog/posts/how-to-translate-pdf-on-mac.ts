import { BlogPost } from '../types';

export const howToTranslatePdfOnMac: BlogPost = {
  slug: 'how-to-translate-pdf-on-mac',
  title: 'How to Translate a PDF on Mac: 3 Methods That Actually Work',
  h1: 'How to Translate a PDF on Mac',
  description:
    'Three working ways to translate a PDF on Mac: the macOS Translate feature for short passages, Google Translate for whole files, and a free browser tool that keeps the layout. Steps for each.',
  keywords: [
    'how to translate pdf on mac',
    'translate pdf on mac',
    'translate pdf mac',
    'mac translate pdf',
    'translate a pdf on macbook',
  ],
  datePublished: '2026-11-04',
  dateModified: '2026-11-04',
  category: 'Tutorials',
  readingMinutes: 14,
  relatedTools: [
    { title: 'Translate PDF', href: '/en/tools/translate-pdf/', description: 'Translate a whole PDF in your Safari or Chrome window, no install needed.' },
    { title: 'OCR PDF', href: '/en/tools/ocr-pdf/', description: 'Recover text from scanned pages before translating.' },
    { title: 'PDF Reader', href: '/en/tools/pdf-reader/', description: 'Proofread the translated file before you send it.' },
    { title: 'Compress PDF', href: '/en/tools/compress-pdf/', description: 'Shrink big translated files under the 10 MB upload limits.' },
  ],
  faq: [
    { question: 'Does Mac have a built-in PDF translator?', answer: 'No. macOS has a system-wide Translate feature since Monterey, and it works on text you select in Preview, but there is no built-in tool that translates a whole PDF file and gives you back a translated document. For that you need an online translator or a browser-based tool.' },
    { question: 'How do I translate text in Preview?', answer: 'Open the PDF in Preview, select the text you want, control-click the selection, and pick Translate from the menu. macOS shows a small window with the translation. It works best for short passages, and you may need to enable it under System Settings > Language & Region.' },
    { question: 'What is the fastest way to translate a whole PDF on Mac?', answer: 'Open a browser tool like the Translate PDF tool on our site, drop the file in, pick the target language, and download the result. It runs on your Mac in Safari, Chrome, or Edge, needs no install or account, and keeps the original layout with a bilingual option.' },
    { question: 'Can Google Translate open a PDF on Mac?', answer: 'Yes. On translate.google.com, switch to the Documents tab, upload a PDF up to 10 MB and 300 pages, and Google returns a translated file. The layout mostly does not survive, and scanned PDFs do not work without an OCR pass first.' },
    { question: 'Why does the Translate option not show up when I control-click in Preview?', answer: 'The macOS Translate feature must be enabled and may need language packs downloaded. Check System Settings > Language & Region > Translation Languages, add the languages you need, and make sure the PDF has a real text layer. Selected text on a scanned image cannot be translated.' },
    { question: 'Can I translate a scanned PDF on Mac for free?', answer: 'Yes, in two steps. First run the file through a free OCR tool to recover the text layer, then translate the recovered file. Our OCR PDF and Translate PDF tools both run in the browser on your Mac and handle this pair without installing anything.' },
  ],
  body: `
**TL;DR:** Macs have no built-in whole-PDF translator, but you still have three good options. For a sentence or a paragraph, select text in Preview and use the macOS Translate feature. For a whole file, how to translate PDF on Mac comes down to two routes: upload it to Google Translate, or open a browser tool like the [Translate PDF](/en/tools/translate-pdf/) tool, which keeps the layout. Both take about two minutes, and this guide walks through how to translate PDF on Mac step by step.

---

**Quick answer:** to translate a PDF on Mac, use one of three methods. Short passages: select text in Preview, control-click, and choose Translate. Whole files with layout kept: open the free [Translate PDF](/en/tools/translate-pdf/) tool in your browser, drop the PDF in, and download the translated or bilingual copy. Whole files with any size up to 10 MB: upload to Google Translate's Documents tab and accept that the layout will change.

You found a PDF in French, Japanese, or German, and you are working on a Mac. Maybe it is a contract from a supplier, a research paper, or an invoice with numbers you cannot guess your way through. The obvious move is to right-click the file and look for a Translate option, and Preview does not offer one.

That surprises people, because Safari translates web pages and iPhones translate messages. But a PDF is a document format, not a web page, and Apple never shipped a tool that translates a whole PDF file. What Apple did ship is a system translation feature that works on text you select, and that distinction shapes every method below.

This guide walks through all three ways to translate a PDF on Mac, in the order you should try them. You will see exact steps for each, the limits to know before you start, and a short way to decide which method fits your file.

## Does Mac Have a Built-In PDF Translator?

No, macOS has no built-in tool that translates an entire PDF document. Since macOS Monterey arrived in 2021, Apple has included a system-wide Translate feature, but it works on text you select, not on files you open [How To Translate Text On Your Mac](https://macmost.com/how-to-translate-text-on-your-mac.html).

The difference matters for how you plan your work. The system feature handles a paragraph, a clause in a contract, or a block of instructions in seconds. It cannot take a 40-page PDF and hand you back a translated document, because it never sees the file, only the words you highlight.

So the honest answer splits in two. If your question is really "how do I understand this one section," Preview plus the macOS Translate feature is your answer, and it is covered in the next section. If your question is "how do I get a usable translated copy of the whole file," you need a translation service, and this guide covers the two fastest ones on a Mac.

## How Do You Translate Selected Text in Preview With the macOS Translate Feature?

Select the text, control-click it, and choose Translate from the context menu. macOS detects the source language and opens a small floating window with the translation below the original [use the Translation feature in macOS](https://eshop.macsales.com/blog/79302-how-to-use-the-translation-text-feature-in-macos-monterey/). That is the whole method, and it works in Preview because Preview hands selected text to the system.

Here are the exact steps:

1. Open your PDF in Preview.
2. Drag to select the passage you want to understand. Selection only works if the PDF has a real text layer, not a scanned image.
3. Control-click, or tap with two fingers on the trackpad.
4. Choose **Translate** from the menu that appears.
5. A window opens showing the detected language and the translation. You can click a language name to switch the target.

Two details trip people up. First, the feature may need to be turned on: check **System Settings > Language & Region**, where macOS lists the languages it can translate into, and download the ones you need for offline use [enable the built-in translator](https://www.askdavetaylor.com/enable-macos-12-monterey-built-in-language-translator-tool). Second, the menu item sometimes guesses the wrong source language. If the result looks like nonsense, open the translation window and set the input language by hand [common Translate quirks](https://discussions.apple.com/thread/256303371).

This method is perfect for the job it was built for: a quick check of one paragraph without leaving your PDF. It is the wrong tool for a whole document, because selecting 30 pages and translating them as one blob produces a wall of text with no formatting, no page structure, and no way to save it as a file.

## Does Safari Translate PDFs?

No. Safari's Translate feature works on web pages, and a PDF opened in Safari's viewer is a document, not a page of HTML, so the Translate button does not appear for it. This is a common dead end for Mac users, because Safari feels like the natural place to start.

The distinction is easier to remember this way: Safari translates pages it renders from the web, while PDFs are files. If you find yourself opening a PDF in Safari hoping for the translation icon, skip straight to one of the whole-file methods below. Nothing is wrong with your Mac, and there is no setting that unlocks translation for PDFs in Safari.

One near-exception worth knowing: if a web page links to an HTML version of a document, Safari can translate that page normally. But the moment the link ends in .pdf, you are back to file territory, and the browser translation does not apply.

## Can You Translate a PDF With Microsoft Word on Mac?

Yes, through a two-step route: convert the PDF to Word, then let Word translate it. Word on Mac, Windows, and the web includes translation under **Review > Translate**, with **Translate Document** converting the whole file and **Translate Selection** handling a highlight [translate text in Word](https://support.microsoft.com/en-us/office/languages/translate-text-into-a-different-language). The feature covers dozens of languages and works with the Microsoft 365 subscription most offices already have.

The steps on a Mac:

1. Convert the PDF into an editable Word file. Our free [PDF to Word](/en/tools/pdf-to-docx/) tool does this in the browser, or Acrobat Pro can export if you have it.
2. Open the converted file in Word for Mac.
3. Go to **Review > Translate > Translate Document**.
4. Pick the target language and click **Translate**. Word produces the translated document in a new window or file.
5. Save the result as Word or export it back to PDF with **File > Save As** if you need a PDF again.

The quality of this route depends entirely on step one. A cleanly born-digital PDF converts to Word nearly perfectly, and the translation inherits that quality. A complex or scanned PDF converts with broken tables and misplaced text, and the translation will faithfully reproduce every one of those flaws. Check the Word file before translating, not after, so you know which problems came from the conversion and which came from the language.

This method earns its place when you were going to edit the document anyway. Translation into an editable Word file is often more useful than translation into a fixed PDF, because you can adjust the wording, fill in your own details, and re-export.

## How Do You Translate a Whole PDF on Mac With Google Translate?

Upload the file to the Documents tab at translate.google.com and Google returns a translated copy. The service accepts PDFs up to 10 MB and 300 pages, alongside Word, PowerPoint, and Excel files [translate documents and websites](https://support.google.com/translate/answer/2534559). It runs in Safari, so nothing to install.

The steps on a Mac:

1. Open [translate.google.com](https://translate.google.com) in Safari or Chrome on your Mac.
2. Click the **Documents** tab. It sits next to the Text tab above the language boxes.
3. Click **Browse your computer**, choose your PDF, and set the source and target languages.
4. Click **Translate**, and a translated file downloads when the job finishes.

The catch is what comes back. Google rebuilds the document as plain flowing text, so multi-column layouts, tables, sidebars, and most design elements do not survive the trip. For a report you just need to read, that is fine. For a form, a brochure, or anything where the page matters, the result can be hard to use.

There is a second catch: the file must have a text layer. Scanned pages are pictures of text, and Google's free uploader cannot read them, so the translation comes back empty. If your PDF is a scan, run it through the free [OCR PDF](/en/tools/ocr-pdf/) tool first to recover the text, then translate.

## What Is the Best Free Way to Keep the Original Layout on Mac?

Use a browser-based tool that translates on top of the original pages instead of rebuilding the file. The [Translate PDF](/en/tools/translate-pdf/) tool on our site works this way, and it runs entirely on your Mac in Safari, Chrome, or Edge, with no install and no account.

The steps take about two minutes:

1. Open the [Translate PDF](/en/tools/translate-pdf/) tool in your browser.
2. Drop your PDF onto the page. The file never leaves your device during processing.
3. Pick the target language from the list, which covers nine languages including English, Chinese, Japanese, Spanish, French, German, Portuguese, Korean, and Russian.
4. Choose translated-only or bilingual output. The bilingual version places the translation under each original page.
5. Download the result and open it in Preview to check it.

Because the tool keeps the original pages as the visual base, tables, columns, stamps, and signatures stay where they were. That makes it the practical choice for invoices, contracts, and forms, which are exactly the documents people usually need translated. If you want to compare this approach against paid software first, our review of [whether Adobe can translate a PDF](/en/blog/can-adobe-translate-a-pdf/) covers what Acrobat's AI Assistant and Express flows do, and what they cost.

## When Should You Use DeepL for Mac Instead?

Use DeepL when the translation quality matters more than convenience, especially for European languages. DeepL has a native Mac app and a web uploader that translates PDF files while keeping the formatting, and it is widely regarded as strong on French, German, and Spanish [DeepL document translation](https://www.deepl.com/en/features/document-translation).

The free tier has real limits, so check them before you build a workflow around it. A free account covers document translation up to 5 MB per file, with a monthly cap on total characters, and paid plans lift those limits [DeepL translator files](https://www.deepl.com/en/translator/files). For an occasional contract or a cover letter, the free allowance is usually enough. For steady work, the subscription pays for itself in time saved on cleanup.

DeepL pairs well with the macOS methods above rather than replacing them. Keep Preview's Translate for quick checks, keep a layout-preserving tool for documents that must look right, and keep DeepL for the texts where wording precision matters most, such as a client-facing proposal you will send in another language.

## Which Mac PDF Translation Method Should You Use?

Pick by file size, layout needs, and how much text you actually need to understand. The table below sums up the trade-offs:

| Method | Best for | Keeps layout? | Limit to know |
| --- | --- | --- | --- |
| Preview + macOS Translate | A paragraph or a clause | N/A, on-screen only | Selected text only, no output file |
| Translate PDF browser tool | Whole files that must look right | Yes, plus bilingual mode | Nine target languages |
| Google Translate Documents | Long plain reports, quick reading | No, rebuilt as plain text | 10 MB and 300 pages max |
| DeepL for Mac | Quality-critical European languages | Mostly yes | Free tier: 5 MB per file, monthly cap |

A quick way to choose: if you only need to understand one section, stay in Preview. If you need a file you can print or send, use the browser tool that keeps the layout. If you just need the gist of a long plain report and do not care how it looks, Google Translate is fine.

## What About Scanned PDFs on Mac?

Scanned PDFs need one extra step before any translation method will work. A scan is a photograph of a page, so there is no text to select in Preview and nothing for a translator to read. The fix is OCR, which reconstructs the text layer from the image [what a scanned PDF is](/en/blog/how-to-translate-scanned-pdf/).

On a Mac, the free path is two browser tools in a row:

1. Run the file through the [OCR PDF](/en/tools/ocr-pdf/) tool. It rebuilds the text layer while keeping the original pages.
2. Open the recovered file in the [Translate PDF](/en/tools/translate-pdf/) tool and translate as normal.

The same pair works before Google Translate if you prefer that route. The full walkthrough of the two-step method, including what results to expect from old photocopies and phone photos, is in our guide to [translating a scanned PDF](/en/blog/how-to-translate-scanned-pdf/).

One sign your file needs this: you open it in Preview, try to select a sentence, and the cursor will not highlight any words. That is a scan, not a text PDF, and every method in this guide will fail on it until the text layer is recovered.

## Can You Automate Translation on a Mac?

Partly, yes, but only for text, not for whole files. The Shortcuts app includes a Translate Text action, so you can build a shortcut that translates whatever is on your clipboard and shows the result in a notification. Pair it with Preview's copy command and checking a paragraph becomes a single keyboard shortcut.

That covers snippets, and for many people it is enough. Whole-document automation is a different story: there is no supported way to pipe a PDF through macOS translation and get a file back. If your week involves many documents, the realistic setup is a browser tool for the files and a shortcut or Preview for the quick checks, which is the split most Mac power users land on.

Building the clipboard shortcut takes about a minute in the Shortcuts app. Create a new shortcut, add the **Receive text from Quick Actions** input, add the **Translate Text** action with your target language, and finish with **Show Result** or a notification. Enable it as a Quick Action under **System Settings > Extensions > Finder**, and from then on any selected text in Preview can be translated with a right-click into your chosen language. It sounds like developer territory, but it is all menus and no code, and it removes the copy-paste loop for paragraph-sized checks.

## Why Is the Translate Menu Missing or the Text Not Selectable?

Four causes explain nearly every "Translate does not work on my Mac" report. Work down the list and the problem usually names itself:

- **The feature is not enabled.** Open **System Settings > Language & Region** and check that Translation Languages includes your target. Add languages there, and let macOS download the language packs it offers, since some translations run on-device and need those files [enable the built-in translator](https://www.askdavetaylor.com/enable-macos-12-monterey-built-in-language-translator-tool).
- **The PDF has no text layer.** Try to select a word. If nothing highlights, the page is an image, and the Translate menu will not appear for a selection that does not exist. Run the file through the [OCR PDF](/en/tools/ocr-pdf/) tool first. On recent macOS versions, Live Text can sometimes select words inside images too, which is worth one try before OCR.
- **The wrong language is detected.** The floating window shows what macOS guessed. Click the detected language and set it by hand; mixed-language documents fool the detector [detection quirks](https://discussions.apple.com/thread/256303371).
- **You are in the wrong app.** The context-menu Translate item appears in Preview, Notes, Safari, and most Apple and modern third-party apps, but not everywhere. If it is missing in one app, copy the text into Notes and translate there, or use the clipboard shortcut from the automation section above.

None of these require reinstalling anything. In the worst case, the fallback is universal: select the text, press Command-C, and paste into any translation service. Clunky, but it always works, and it is exactly what the system feature automates for you.

## Which Methods Keep Your File Private?

The methods split cleanly into local and uploaded. Everything that runs on the Mac itself, like Preview selections, Shortcuts clipboard flows, and Word working on a local file, keeps the document on your machine. Every web uploader, Google Translate and DeepL included, sends the file to that company's servers, so the privacy question applies to the whole document.

For confidential material, contracts with pricing, medical records, anything with a tax ID, the local-first options deserve a look. The [Translate PDF](/en/tools/translate-pdf/) tool processes the document on your device and only sends short text passages to the translation service, with the trade-off stated plainly in its interface. That is a middle path: more private than uploading the whole file, while still using an online engine for the language work.

A practical habit for mixed workloads: classify before you translate. Public or low-sensitivity documents can go anywhere, including the most convenient uploader. Private documents stay in the local lane, even if that means a few extra copy-paste rounds for the price of keeping the file at home.

## FAQ: Translating PDFs on Mac

**Does Mac have a built-in PDF translator?** No. macOS has a system-wide Translate feature since Monterey, and it works on text you select in Preview, but there is no built-in tool that translates a whole PDF file and gives you back a translated document. For that you need an online translator or a browser-based tool.

**How do I translate text in Preview?** Open the PDF in Preview, select the text you want, control-click the selection, and pick Translate from the menu. macOS shows a small window with the translation. It works best for short passages, and you may need to enable it under System Settings > Language & Region.

**What is the fastest way to translate a whole PDF on Mac?** Open a browser tool like the Translate PDF tool on our site, drop the file in, pick the target language, and download the result. It runs on your Mac in Safari, Chrome, or Edge, needs no install or account, and keeps the original layout with a bilingual option.

**Can Google Translate open a PDF on Mac?** Yes. On translate.google.com, switch to the Documents tab, upload a PDF up to 10 MB and 300 pages, and Google returns a translated file. The layout mostly does not survive, and scanned PDFs do not work without an OCR pass first.

**Why does the Translate option not show up when I control-click in Preview?** The macOS Translate feature must be enabled and may need language packs downloaded. Check System Settings > Language & Region > Translation Languages, add the languages you need, and make sure the PDF has a real text layer. Selected text on a scanned image cannot be translated.

**Can I translate a scanned PDF on Mac for free?** Yes, in two steps. First run the file through a free OCR tool to recover the text layer, then translate the recovered file. Our OCR PDF and Translate PDF tools both run in the browser on your Mac and handle this pair without installing anything.

## Wrap-Up: The Three-Method Habit

The Mac translation workflow settles into a habit fast. Preview and the system Translate feature answer the "what does this paragraph say" moments. A layout-preserving browser tool handles the files you need to keep, send, or print. Google Translate covers the long plain reports where appearance does not matter, and DeepL steps in when wording quality is the priority.

None of these need a purchase to try. Start with the one that matches your file: if the document has to look right when it is done, the [Translate PDF](/en/tools/translate-pdf/) tool is the two-minute starting point, and the [OCR PDF](/en/tools/ocr-pdf/) tool is its partner for anything scanned. Try your file once and you will know which method your workflow needs, and the answer usually holds for every PDF after it.
`.trim(),
};
