/**
 * Homepage SEO content (English only - the primary market for
 * "pdf editor free"). The visible section on the homepage and the
 * FAQPage structured data both render from this module so they can
 * never drift apart.
 */

export interface HomeFAQ {
  question: string;
  answer: string;
}

export const homeSeoHeading = 'The free PDF editor that runs in your browser';

export const homeSeoParagraphs = [
  'PDFEditorFree is a free PDF editor with 95 professional tools that run entirely in your browser. There is no signup, no watermark and no hidden paywall: open a tool, drop in your file, and download the result. It works on Windows, Mac, Linux, Android and iPhone, because every task is processed by your own device rather than a remote server.',
  'Editing stays private by design. Unlike upload-based online editors, each operation - merging, splitting, compressing, converting, signing, annotating - runs locally in your browser, so contracts, IDs and financial documents never leave your computer.',
  'The toolbox covers the full PDF workflow: edit text and images, merge and split files, convert to and from Word, Excel, PowerPoint and images, compress heavy attachments, fill and sign forms, encrypt sensitive documents and run OCR on scans.',
];

export const homeFaqs: HomeFAQ[] = [
  {
    question: 'Is PDFEditorFree really free?',
    answer:
      'Yes. All 95 tools are free to use with no registration, no subscription and no watermarks. Processing happens on your own device, so there are no server costs to pass on.',
  },
  {
    question: 'Is it safe to edit PDF files here?',
    answer:
      'It is safer than typical online editors: your files are processed locally in your browser and never uploaded to any server, which is why confidential documents such as contracts and statements can be edited here safely.',
  },
  {
    question: 'Do I need to install software or create an account?',
    answer:
      'No. The editor runs in any modern browser - Chrome, Edge, Firefox or Safari - on desktop and mobile. There is no installation, no account and no email required.',
  },
  {
    question: 'Can I edit PDF files on my phone or tablet?',
    answer:
      'Yes. The same tools work in mobile Safari and Chrome: open the site, pick a tool, and process files directly on your device.',
  },
  {
    question: 'Will my edited PDF have a watermark?',
    answer:
      'No. Downloaded files are clean, full-quality PDFs with no watermarks and no page limits.',
  },
  {
    question: 'What can this free PDF editor do?',
    answer:
      'It covers the complete PDF workflow: edit text and images, merge, split and organize pages, convert to and from Word, Excel, PowerPoint and images, compress files, fill and sign forms, encrypt documents and recognize text in scans with OCR.',
  },
];
