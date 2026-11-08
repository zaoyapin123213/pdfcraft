/**
 * Edit PDF — core logic: object model, fonts, text-line extraction and
 * the pdf-lib export pipeline. Pure functions; no React imports.
 *
 * Coordinate system: every object stores PDF-space coordinates in points
 * with a TOP-LEFT anchor (x, yTop measured from the page top edge). This
 * makes the DOM overlay trivial (multiply by zoom) and converts to
 * pdf-lib's bottom-left origin only at export time.
 */

import { getEditorStrings } from './strings';

export type FontId = 'helvetica' | 'times' | 'courier' | 'system-cjk';

export interface BaseObject {
  id: string;
  pageIndex: number; // 0-based index into the ORIGINAL page order
}

export interface TextObject extends BaseObject {
  kind: 'text';
  x: number;
  yTop: number;
  width: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  fontId: FontId;
}

export interface WhiteoutObject extends BaseObject {
  kind: 'whiteout';
  x: number;
  yTop: number;
  width: number;
  height: number;
}

export interface ImageObject extends BaseObject {
  kind: 'image';
  x: number;
  yTop: number;
  width: number;
  height: number;
  src: string; // data URL (PNG or JPEG)
}

export interface LinkObject extends BaseObject {
  kind: 'link';
  x: number;
  yTop: number;
  width: number;
  height: number;
  linkType: 'url' | 'email' | 'phone' | 'page';
  value: string; // url, email, phone or "1"-based target page number
}

export interface ShapeObject extends BaseObject {
  kind: 'rect' | 'ellipse';
  x: number;
  yTop: number;
  width: number;
  height: number;
  stroke: string;
  fill: string; // 'none' or css color
  strokeWidth: number;
}

export interface LineObject extends BaseObject {
  kind: 'line' | 'arrow';
  x1: number;
  yTop1: number;
  x2: number;
  yTop2: number;
  stroke: string;
  strokeWidth: number;
}

export interface FreehandObject extends BaseObject {
  kind: 'freehand';
  points: Array<{ x: number; yTop: number }>;
  stroke: string;
  strokeWidth: number;
}

export interface AreaMarkObject extends BaseObject {
  kind: 'highlight' | 'strikeout' | 'underline';
  x: number;
  yTop: number;
  width: number;
  height: number;
  color: string;
}

export interface SymbolObject extends BaseObject {
  kind: 'check' | 'cross' | 'dot';
  x: number;
  yTop: number;
  size: number;
  color: string;
}

export interface StampObject extends BaseObject {
  kind: 'stamp';
  x: number;
  yTop: number;
  text: string;
  includeDate: boolean;
  color: string;
  fontSize: number;
}

export type EditObject =
  | TextObject
  | WhiteoutObject
  | ImageObject
  | LinkObject
  | ShapeObject
  | LineObject
  | FreehandObject
  | AreaMarkObject
  | SymbolObject
  | StampObject;

export interface PageOp {
  rotationDelta: number; // 0 | 90 | 180 | 270 (clockwise, added to existing /Rotate)
  deleted: boolean;
}

export interface FormFieldValue {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'optionlist' | 'button' | 'signature' | 'unknown';
  value?: string; // current text/selection for text-like fields
  checked?: boolean;
  options?: string[]; // dropdown/radio choices
  readOnly?: boolean;
}

export type FormValues = Record<string, string | boolean>;

export interface TextLine {
  pageIndex: number;
  str: string;
  x: number; // PDF space, left edge
  yTop: number; // PDF space, top edge of line box
  width: number;
  height: number;
  fontSize: number;
  /** Native pdf.js fragments inside this line — replacement positioning
   *  uses these (per-fragment char width is far more accurate than the
   *  whole-line average when a "line" spans table columns). */
  items: Array<{ str: string; x: number; width: number }>;
}

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const EDITOR_MAX_FILE_BYTES = MAX_FILE_BYTES;

let idCounter = 0;
export function nextObjectId(): string {
  idCounter += 1;
  return `eo_${Date.now().toString(36)}_${idCounter}`;
}

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const CJK_RE = /[\u2E80-\u2EFF\u3000-\u303F\u3040-\u30FF\u3130-\u318F\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFF00-\uFFEF]/;

export function isNotoFont(fontId: FontId): boolean {
  return fontId === 'system-cjk';
}

/** Standard-font family used by the export pipeline and the CSS preview. */
export function isStandardFont(fontId: FontId): boolean {
  return fontId === 'helvetica' || fontId === 'times' || fontId === 'courier';
}

/** CJK text is exported as a high-DPI image (see renderTextObjectToPng). */
export function fontSupportsStyle(fontId: FontId): boolean {
  return true; // system-cjk renders bold/italic via canvas font weight/style
}

export const FONT_OPTIONS: Array<{ id: FontId; label: string }> = [
  { id: 'helvetica', label: 'Helvetica (Arial)' },
  { id: 'times', label: 'Times New Roman' },
  { id: 'courier', label: 'Courier (Mono)' },
  { id: 'system-cjk', label: '中文 / 日本語 / 한국어' },
];

/**
 * Pick the effective font for a text run. Any text containing CJK
 * characters uses the system-CJK path: pdf-lib's font subsetting cannot
 * handle CJK OTF/TTF files (glyphs silently drop), so CJK runs are
 * rendered through the canvas system stack and embedded as a high-DPI
 * image — visually identical, no font download, tiny output.
 */
export function resolveFontId(fontId: FontId, text: string): FontId {
  if (fontId !== 'system-cjk' && CJK_RE.test(text)) return 'system-cjk';
  return fontId;
}

export function resolveFontIdForPreview(fontId: FontId, text: string): FontId {
  return resolveFontId(fontId, text);
}

// ---------------------------------------------------------------------------
// CJK text → high-DPI PNG (system font stack, no font downloads)
// ---------------------------------------------------------------------------

const CJK_FONT_STACK = '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Malgun Gothic", "Yu Gothic", sans-serif';

/**
 * Render a (possibly multi-line) text run with the system CJK font stack
 * onto a transparent canvas at 3x resolution and return a PNG data URL.
 * Returns null when canvas is unavailable (SSR / tests).
 */
export function renderCjkTextToPng(
  text: string,
  fontSize: number,
  color: string,
  bold: boolean,
  italic: boolean
): { dataUrl: string; widthPt: number; heightPt: number } | null {
  if (typeof document === 'undefined') return null;
  const SCALE = 3;
  const lineHeight = fontSize * 1.35;
  const lines = text.split('\n');
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) return null;
  const weight = bold ? '700 ' : '400 ';
  const style = italic ? 'italic ' : '';
  const fontSpec = `${style}${weight}${fontSize}px ${CJK_FONT_STACK}`;
  measure.font = fontSpec;
  let maxW = 0;
  for (const l of lines) maxW = Math.max(maxW, measure.measureText(l || ' ').width);

  const wPt = Math.max(maxW + fontSize * 0.2, fontSize);
  const hPt = lineHeight * lines.length;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(wPt * SCALE);
  canvas.height = Math.ceil(hPt * SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(SCALE, SCALE);
  ctx.font = fontSpec;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, fontSize * 0.1, i * lineHeight + fontSize * 0.12));
  return { dataUrl: canvas.toDataURL('image/png'), widthPt: wPt, heightPt: hPt };
}

// ---------------------------------------------------------------------------
// Text line extraction (powers "click existing text", find & replace and
// hit-testing for the select tool)
// ---------------------------------------------------------------------------

interface RawItem {
  str: string;
  x: number;
  baselineY: number;
  width: number;
  height: number;
  fontSize: number;
}

function clusterIntoLines(items: RawItem[], pageIndex: number, pageHeight: number): TextLine[] {
  // Group items whose baselines are within 2pt, sort left-to-right inside
  // each group, then merge neighbours whose gap is small relative to font
  // size (word spacing artifacts).
  const sorted = [...items].sort((a, b) => (a.baselineY === b.baselineY ? a.x - b.x : b.baselineY - a.baselineY));
  const groups: RawItem[][] = [];
  for (const it of sorted) {
    const g = groups.find((grp) => Math.abs(grp[0].baselineY - it.baselineY) <= 2);
    if (g) g.push(it);
    else groups.push([it]);
  }
  const lines: TextLine[] = [];
  for (const g of groups) {
    g.sort((a, b) => a.x - b.x);
    const merged: RawItem[] = [];
    for (const it of g) {
      const prev = merged[merged.length - 1];
      const gap = prev ? it.x - (prev.x + prev.width) : Infinity;
      const tolerance = Math.max(prev?.fontSize ?? it.fontSize, it.fontSize) * 1.2;
      if (prev && gap < tolerance && gap > -prev.width * 0.5) {
        merged.push(it);
      } else {
        merged.push(it);
        // mark boundary: we handle merging below by walking runs
      }
    }
    // Build runs with the gap rule
    const runs: RawItem[][] = [];
    let run: RawItem[] = [merged[0]];
    for (let i = 1; i < merged.length; i++) {
      const prev = merged[i - 1];
      const it = merged[i];
      const gap = it.x - (prev.x + prev.width);
      const tolerance = Math.max(prev.fontSize, it.fontSize) * 1.2;
      if (gap < tolerance && gap > -prev.width * 0.5) run.push(it);
      else {
        runs.push(run);
        run = [it];
      }
    }
    runs.push(run);
    for (const r of runs) {
      const str = r.map((it) => it.str).join('');
      if (!str.trim()) continue;
      const x = r[0].x;
      const width = r[r.length - 1].x + r[r.length - 1].width - x;
      const fontSize = Math.max(...r.map((it) => it.fontSize));
      const height = Math.max(...r.map((it) => it.height), fontSize * 1.15);
      const baselineY = Math.max(...r.map((it) => it.baselineY));
      lines.push({
        pageIndex,
        str,
        x,
        yTop: pageHeight - baselineY - height,
        width,
        height,
        fontSize,
        items: r.map((it) => ({ str: it.str, x: it.x, width: it.width })),
      });
    }
  }
  return lines;
}

/**
 * Extract clickable text lines for one page. Uses the same pdf.js document
 * instance the renderer holds; coordinates are converted into the top-left
 * PDF space the editor uses.
 */
export async function extractTextLines(
  pdfjsPage: {
    getViewport: (o: { scale: number }) => { width: number; height: number };
    getTextContent: () => Promise<{ items: Array<Record<string, unknown>> }>;
  },
  pageIndex: number
): Promise<TextLine[]> {
  const viewport = pdfjsPage.getViewport({ scale: 1 });
  const tc = await pdfjsPage.getTextContent();
  const items: RawItem[] = [];
  for (const it of tc.items) {
    const str = typeof it.str === 'string' ? it.str : '';
    const tr = it.transform as number[] | undefined;
    if (!tr || !str) continue;
    const x = tr[4];
    const baselineY = tr[5];
    const width = typeof it.width === 'number' ? it.width : 0;
    const height = typeof it.height === 'number' && it.height > 0 ? it.height : Math.abs(tr[3]) || 10;
    items.push({ str, x, baselineY, width, height, fontSize: height });
  }
  return clusterIntoLines(items, pageIndex, viewport.height);
}

/** Find the text line containing the given point (top-left PDF space). */
export function findLineAt(lines: TextLine[], pageIndex: number, x: number, yTop: number): TextLine | null {
  for (const l of lines) {
    if (l.pageIndex !== pageIndex) continue;
    if (x >= l.x - 2 && x <= l.x + l.width + 2 && yTop >= l.yTop - 2 && yTop <= l.yTop + l.height + 2) {
      return l;
    }
  }
  return null;
}

export interface ReplacementEdit {
  whiteout: WhiteoutObject;
  text: TextObject;
}

/**
 * Build whiteout + replacement-text objects for every match of `find`.
 * Positioning happens at the pdf.js item (fragment) level: a fragment's own
 * width over its own length gives an accurate char width even when the
 * surrounding "line" merges table columns. Matches spanning fragments or
 * lines are skipped (the UI states this limitation).
 */
export function buildReplacements(
  lines: TextLine[],
  find: string,
  replaceWith: string,
  matchCase: boolean,
  pageHeights: number[]
): { edits: ReplacementEdit[]; count: number } {
  const edits: ReplacementEdit[] = [];
  if (!find) return { edits, count: 0 };
  const needle = matchCase ? find : find.toLowerCase();
  for (const line of lines) {
    for (const item of line.items) {
      const haystack = matchCase ? item.str : item.str.toLowerCase();
      let searchFrom = 0;
      for (;;) {
        const idx = haystack.indexOf(needle, searchFrom);
        if (idx === -1) break;
        searchFrom = idx + needle.length;
        if (item.str.length === 0) continue;
        const cw = item.width / item.str.length;
        const startX = item.x + idx * cw;
        const matchWidth = Math.max(needle.length * cw, 2);
        // +30% height covers descenders and baseline jitter so no ghost of
        // the covered text peeks out below the whiteout.
        const height = line.height * 1.3;
        const whiteout: WhiteoutObject = {
          id: nextObjectId(),
          kind: 'whiteout',
          pageIndex: line.pageIndex,
          x: startX,
          yTop: line.yTop,
          width: matchWidth,
          height,
        };
        const text: TextObject = {
          id: nextObjectId(),
          kind: 'text',
          pageIndex: line.pageIndex,
          x: startX,
          yTop: line.yTop,
          width: Math.max(replaceWith.length * cw, matchWidth),
          text: replaceWith,
          fontSize: line.fontSize,
          color: '#111111',
          bold: false,
          italic: false,
          fontId: 'helvetica',
        };
        void pageHeights;
        edits.push({ whiteout, text });
      }
    }
  }
  return { edits, count: edits.length };
}

// ---------------------------------------------------------------------------
// Export pipeline
// ---------------------------------------------------------------------------

function hexToRgbRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

async function dataUrlToBytes(dataUrl: string): Promise<{ bytes: Uint8Array; isPng: boolean }> {
  const res = await fetch(dataUrl);
  const buf = await res.arrayBuffer();
  const u8 = new Uint8Array(buf);
  const isPng = u8[0] === 0x89 && u8[1] === 0x50;
  return { bytes: u8, isPng };
}

interface ExportPdfLib {
  PDFDocument: typeof import('pdf-lib').PDFDocument;
  StandardFonts: typeof import('pdf-lib').StandardFonts;
  degrees: typeof import('pdf-lib').degrees;
  rgb: typeof import('pdf-lib').rgb;
  PDFName: typeof import('pdf-lib').PDFName;
  PDFArray: typeof import('pdf-lib').PDFArray;
  PDFString: typeof import('pdf-lib').PDFString;
  PDFTextField: typeof import('pdf-lib').PDFTextField;
  PDFCheckBox: typeof import('pdf-lib').PDFCheckBox;
  PDFDropdown: typeof import('pdf-lib').PDFDropdown;
  PDFRadioGroup: typeof import('pdf-lib').PDFRadioGroup;
  PDFOptionList: typeof import('pdf-lib').PDFOptionList;
}

/** Map a FontId + style flags to an embedded pdf-lib standard font.
 *  CJK runs never reach here — they are exported as canvas-rendered PNGs. */
async function embedFontFor(
  pdfLib: ExportPdfLib,
  pdfDoc: import('pdf-lib').PDFDocument,
  fontId: FontId,
  bold: boolean,
  italic: boolean,
  text: string,
  embeddedFonts: Map<string, import('pdf-lib').PDFFont>
): Promise<import('pdf-lib').PDFFont> {
  const effective = resolveFontId(fontId, text);
  const key = `${effective}|${bold ? 'b' : ''}${italic ? 'i' : ''}`;
  const hit = embeddedFonts.get(key);
  if (hit) return hit;

  const S = pdfLib.StandardFonts;
  const table: Record<string, import('pdf-lib').StandardFonts> = {
    'helvetica|': S.Helvetica,
    'helvetica|b': S.HelveticaBold,
    'helvetica|i': S.HelveticaOblique,
    'helvetica|bi': S.HelveticaBoldOblique,
    'times|': S.TimesRoman,
    'times|b': S.TimesRomanBold,
    'times|i': S.TimesRomanItalic,
    'times|bi': S.TimesRomanBoldItalic,
    'courier|': S.Courier,
    'courier|b': S.CourierBold,
    'courier|i': S.CourierOblique,
    'courier|bi': S.CourierBoldOblique,
  };
  const std = table[key] ?? S.Helvetica;
  const font = await pdfDoc.embedFont(std);
  embeddedFonts.set(key, font);
  return font;
}

/** Add a /Link annotation without disturbing existing annotations. */
function addLinkAnnotation(
  pdfLib: ExportPdfLib,
  pdfDoc: import('pdf-lib').PDFDocument,
  page: import('pdf-lib').PDFPage,
  rect: [number, number, number, number],
  link: LinkObject,
  pages: import('pdf-lib').PDFPage[]
): void {
  const { PDFName, PDFArray, PDFString } = pdfLib;
  const ctx = pdfDoc.context;
  const rectArr = ctx.obj([rect[0], rect[1], rect[2], rect[3]]);
  let action;
  if (link.linkType === 'url') {
    action = ctx.obj({ S: 'URI', URI: PDFString.of(link.value) });
  } else if (link.linkType === 'email') {
    action = ctx.obj({ S: 'URI', URI: PDFString.of(`mailto:${link.value}`) });
  } else if (link.linkType === 'phone') {
    action = ctx.obj({ S: 'URI', URI: PDFString.of(`tel:${link.value}`) });
  } else {
    const targetIdx = Math.max(0, Math.min(pages.length - 1, parseInt(link.value, 10) - 1));
    const targetRef = pages[targetIdx]?.ref ?? page.ref;
    action = ctx.obj({ S: 'GoTo', D: ctx.obj([targetRef, 'Fit']) });
  }
  const annot = ctx.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: rectArr,
    Border: ctx.obj([0, 0, 0]),
    A: action,
    F: 4,
  });
  let annots = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  if (!annots) {
    annots = ctx.obj([]);
    page.node.set(PDFName.of('Annots'), annots);
  }
  annots.push(annot);
}

export interface ExportOptions {
  originalBytes: ArrayBuffer;
  fileName: string;
  objects: EditObject[];
  pageOps: Record<number, PageOp>;
  formValues: FormValues;
  onProgress?: (pct: number, message: string) => void;
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
}

/**
 * Rebuild the PDF with all edits applied. Vector page content is preserved;
 * edits are drawn on top in insertion order (whiteouts under later text).
 */
export async function exportEditedPdf(options: ExportOptions): Promise<ExportResult> {
  const { originalBytes, fileName, objects, pageOps, formValues, onProgress } = options;
  const pdfLibModule = await import('pdf-lib');
  const pdfLib: ExportPdfLib = {
    PDFDocument: pdfLibModule.PDFDocument,
    StandardFonts: pdfLibModule.StandardFonts,
    degrees: pdfLibModule.degrees,
    rgb: pdfLibModule.rgb,
    PDFName: pdfLibModule.PDFName,
    PDFArray: pdfLibModule.PDFArray,
    PDFString: pdfLibModule.PDFString,
    PDFTextField: pdfLibModule.PDFTextField,
    PDFCheckBox: pdfLibModule.PDFCheckBox,
    PDFDropdown: pdfLibModule.PDFDropdown,
    PDFRadioGroup: pdfLibModule.PDFRadioGroup,
    PDFOptionList: pdfLibModule.PDFOptionList,
  };

  onProgress?.(10, 'Opening PDF');
  const pdfDoc = await pdfLib.PDFDocument.load(originalBytes, { ignoreEncryption: false, updateMetadata: false });

  // Form fill (best effort — skip silently when the document has no AcroForm)
  const entries = Object.entries(formValues);
  if (entries.length > 0) {
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      for (const [name, value] of entries) {
        const field = fields.find((f) => f.getName() === name);
        if (!field) continue;
        try {
          if (field instanceof pdfLib.PDFTextField && typeof value === 'string') field.setText(value);
          else if (field instanceof pdfLib.PDFCheckBox && typeof value === 'boolean') {
            if (value) field.check();
            else field.uncheck();
          } else if (
            (field instanceof pdfLib.PDFDropdown || field instanceof pdfLib.PDFRadioGroup || field instanceof pdfLib.PDFOptionList) &&
            typeof value === 'string'
          ) {
            field.select(value);
          }
        } catch {
          // skip incompatible value
        }
      }
    } catch {
      // no AcroForm in this document
    }
  }
  onProgress?.(25, 'Applying page operations');

  // Page rotation (only pages without edits can be rotated — enforced in UI)
  const pages = pdfDoc.getPages();
  for (const [idxStr, op] of Object.entries(pageOps)) {
    const idx = parseInt(idxStr, 10);
    const page = pages[idx];
    if (!page || op.deleted) continue;
    if (op.rotationDelta !== 0) {
      const current = page.getRotation().angle;
      page.setRotation(pdfLib.degrees((current + op.rotationDelta + 360) % 360));
    }
  }

  // Draw edit objects (skip those on deleted pages)
  const embeddedFonts = new Map<string, import('pdf-lib').PDFFont>();
  const embeddedImages = new Map<string, import('pdf-lib').PDFImage>();
  // Rotated pages never receive edit objects (locked in the UI, matching
  // Sejda's own limitation) — this guard is pure defense.
  const initialRots = pages.map((p) => (((p.getRotation().angle % 360) + 360) % 360));
  const { rgb, degrees: _degreesUnused } = pdfLib;
  void _degreesUnused;

  const total = objects.length || 1;
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const page = pages[obj.pageIndex];
    if (!page) continue;
    const op = pageOps[obj.pageIndex];
    if (op?.deleted) continue;
    const { width: pw, height: ph } = page.getSize();
    if (initialRots[obj.pageIndex] !== 0) continue; // defensive; UI locks rotated pages
    const pct = 30 + Math.round((i / total) * 60);
    if (i % 5 === 0) onProgress?.(pct, 'Drawing edits');

    switch (obj.kind) {
      case 'whiteout': {
        page.drawRectangle({
          x: obj.x,
          y: ph - obj.yTop - obj.height,
          width: obj.width,
          height: obj.height,
          color: rgb(1, 1, 1),
        });
        break;
      }
      case 'highlight': {
        const c = hexToRgbRgb(obj.color);
        page.drawRectangle({
          x: obj.x,
          y: ph - obj.yTop - obj.height,
          width: obj.width,
          height: obj.height,
          color: rgb(c.r, c.g, c.b),
          opacity: 0.35,
        });
        break;
      }
      case 'strikeout':
      case 'underline': {
        const c = hexToRgbRgb(obj.color);
        const yLine =
          obj.kind === 'strikeout'
            ? ph - obj.yTop - obj.height / 2
            : ph - obj.yTop - obj.height - 1.5;
        page.drawLine({
          start: { x: obj.x, y: yLine },
          end: { x: obj.x + obj.width, y: yLine },
          thickness: Math.max(1, obj.height * 0.4),
          color: rgb(c.r, c.g, c.b),
        });
        break;
      }
      case 'text': {
        const effective = resolveFontId(obj.fontId, obj.text);
        if (effective === 'system-cjk') {
          // CJK: render with the system font stack and embed as a high-DPI
          // image. pdf-lib's font subsetting drops CJK glyphs, and embedding
          // a full Noto CJK would add ~16 MB — this path is lossless, needs
          // no download and keeps the output small.
          const rendered = renderCjkTextToPng(obj.text, obj.fontSize, obj.color, obj.bold, obj.italic);
          if (rendered) {
            const { bytes, isPng } = await dataUrlToBytes(rendered.dataUrl);
            const cacheKey = `cjk:${rendered.dataUrl.length}:${rendered.widthPt}x${rendered.heightPt}`;
            let img = embeddedImages.get(cacheKey);
            if (!img) {
              img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
              embeddedImages.set(cacheKey, img);
            }
            page.drawImage(img, {
              x: obj.x,
              y: ph - obj.yTop - rendered.heightPt,
              width: rendered.widthPt,
              height: rendered.heightPt,
            });
            break;
          }
          // canvas unavailable — fall through to standard font (glyph loss
          // only affects non-Latin chars; better than dropping the edit)
        }
        const font = await embedFontFor(pdfLib, pdfDoc, obj.fontId, obj.bold, obj.italic, obj.text, embeddedFonts);
        const c = hexToRgbRgb(obj.color);
        const lines = obj.text.split('\n');
        const lineHeight = obj.fontSize * 1.25;
        for (let li = 0; li < lines.length; li++) {
          const baseline = ph - obj.yTop - obj.fontSize * (li + 1) + obj.fontSize * 0.22;
          page.drawText(lines[li], {
            x: obj.x,
            y: baseline,
            size: obj.fontSize,
            font,
            color: rgb(c.r, c.g, c.b),
          });
        }
        break;
      }
      case 'image': {
        let img = embeddedImages.get(obj.src);
        if (!img) {
          const { bytes, isPng } = await dataUrlToBytes(obj.src);
          img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
          embeddedImages.set(obj.src, img);
        }
        page.drawImage(img, {
          x: obj.x,
          y: ph - obj.yTop - obj.height,
          width: obj.width,
          height: obj.height,
        });
        break;
      }
      case 'stamp': {
        const effFont = resolveFontId('helvetica', obj.text);
        const c = hexToRgbRgb(obj.color);
        const dateStr = obj.includeDate ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
        if (effFont === 'system-cjk') {
          // CJK stamp: render text+date as an image, frame it with a rectangle
          const stampTextFull = dateStr ? `${obj.text}\n${dateStr}` : obj.text;
          const rendered = renderCjkTextToPng(stampTextFull, obj.fontSize, obj.color, false, false);
          if (rendered) {
            const boxW = rendered.widthPt + 12;
            const boxH = rendered.heightPt + 10;
            const yBox = ph - obj.yTop - boxH;
            page.drawRectangle({ x: obj.x, y: yBox, width: boxW, height: boxH, borderColor: rgb(c.r, c.g, c.b), borderWidth: 1.5 });
            const { bytes, isPng } = await dataUrlToBytes(rendered.dataUrl);
            const img = await pdfDoc.embedPng(bytes);
            page.drawImage(img, { x: obj.x + 6, y: yBox + 5, width: rendered.widthPt, height: rendered.heightPt });
            break;
          }
        }
        const font = await embedFontFor(pdfLib, pdfDoc, effFont, false, false, obj.text, embeddedFonts);
        const textW = Math.max(font.widthOfTextAtSize(obj.text, obj.fontSize), dateStr ? font.widthOfTextAtSize(dateStr, obj.fontSize * 0.8) : 0);
        const boxW = textW + 12;
        const boxH = obj.fontSize * (dateStr ? 2.6 : 1.6);
        const yBox = ph - obj.yTop - boxH;
        page.drawRectangle({
          x: obj.x,
          y: yBox,
          width: boxW,
          height: boxH,
          borderColor: rgb(c.r, c.g, c.b),
          borderWidth: 1.5,
        });
        page.drawText(obj.text, {
          x: obj.x + 6,
          y: yBox + boxH - obj.fontSize * 1.25,
          size: obj.fontSize,
          font,
          color: rgb(c.r, c.g, c.b),
        });
        if (dateStr) {
          page.drawText(dateStr, {
            x: obj.x + 6,
            y: yBox + obj.fontSize * 0.45,
            size: obj.fontSize * 0.8,
            font,
            color: rgb(c.r, c.g, c.b),
          });
        }
        break;
      }
      case 'rect':
      case 'ellipse': {
        const stroke = hexToRgbRgb(obj.stroke);
        const hasFill = obj.fill && obj.fill !== 'none';
        const fill = hasFill ? hexToRgbRgb(obj.fill) : { r: 0, g: 0, b: 0 };
        const yBox = ph - obj.yTop - obj.height;
        if (obj.kind === 'rect') {
          page.drawRectangle({
            x: obj.x,
            y: yBox,
            width: obj.width,
            height: obj.height,
            borderColor: rgb(stroke.r, stroke.g, stroke.b),
            borderWidth: obj.strokeWidth,
            color: hasFill ? rgb(fill.r, fill.g, fill.b) : undefined,
            borderOpacity: 1,
          });
        } else {
          page.drawEllipse({
            x: obj.x + obj.width / 2,
            y: yBox + obj.height / 2,
            xScale: obj.width / 2,
            yScale: obj.height / 2,
            borderColor: rgb(stroke.r, stroke.g, stroke.b),
            borderWidth: obj.strokeWidth,
            color: hasFill ? rgb(fill.r, fill.g, fill.b) : undefined,
          });
        }
        break;
      }
      case 'line':
      case 'arrow': {
        const c = hexToRgbRgb(obj.stroke);
        const y1 = ph - obj.yTop1;
        const y2 = ph - obj.yTop2;
        page.drawLine({
          start: { x: obj.x1, y: y1 },
          end: { x: obj.x2, y: y2 },
          thickness: obj.strokeWidth,
          color: rgb(c.r, c.g, c.b),
        });
        if (obj.kind === 'arrow') {
          const angle = Math.atan2(y2 - y1, obj.x2 - obj.x1);
          const headLen = Math.max(8, obj.strokeWidth * 4);
          for (const spread of [2.5, -2.5]) {
            page.drawLine({
              start: { x: obj.x2, y: y2 },
              end: {
                x: obj.x2 - headLen * Math.cos(angle + spread / 4),
                y: y2 - headLen * Math.sin(angle + spread / 4),
              },
              thickness: obj.strokeWidth,
              color: rgb(c.r, c.g, c.b),
            });
          }
        }
        break;
      }
      case 'freehand': {
        const c = hexToRgbRgb(obj.stroke);
        for (let pi = 1; pi < obj.points.length; pi++) {
          const a = obj.points[pi - 1];
          const b = obj.points[pi];
          page.drawLine({
            start: { x: a.x, y: ph - a.yTop },
            end: { x: b.x, y: ph - b.yTop },
            thickness: obj.strokeWidth,
            color: rgb(c.r, c.g, c.b),
          });
        }
        break;
      }
      case 'check':
      case 'cross': {
        const c = hexToRgbRgb(obj.color);
        const yTop = ph - obj.yTop;
        const size = obj.size;
        if (obj.kind === 'check') {
          const pts = [
            { x: obj.x, y: yTop - size * 0.55 },
            { x: obj.x + size * 0.35, y: yTop - size * 0.9 },
            { x: obj.x + size, y: yTop - size * 0.1 },
          ];
          page.drawLine({ start: pts[0], end: pts[1], thickness: size * 0.12, color: rgb(c.r, c.g, c.b) });
          page.drawLine({ start: pts[1], end: pts[2], thickness: size * 0.12, color: rgb(c.r, c.g, c.b) });
        } else {
          page.drawLine({
            start: { x: obj.x, y: yTop - size },
            end: { x: obj.x + size, y: yTop },
            thickness: size * 0.12,
            color: rgb(c.r, c.g, c.b),
          });
          page.drawLine({
            start: { x: obj.x, y: yTop },
            end: { x: obj.x + size, y: yTop - size },
            thickness: size * 0.12,
            color: rgb(c.r, c.g, c.b),
          });
        }
        break;
      }
      case 'dot': {
        const c = hexToRgbRgb(obj.color);
        page.drawEllipse({
          x: obj.x + obj.size / 2,
          y: ph - obj.yTop - obj.size / 2,
          xScale: obj.size / 2,
          yScale: obj.size / 2,
          color: rgb(c.r, c.g, c.b),
        });
        break;
      }
      case 'link': {
        const y1 = ph - obj.yTop;
        const y2 = ph - obj.yTop - obj.height;
        addLinkAnnotation(pdfLib, pdfDoc, page, [obj.x, Math.min(y1, y2), obj.x + obj.width, Math.max(y1, y2)], obj, pages);
        break;
      }
    }
  }
  onProgress?.(95, 'Saving');

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  onProgress?.(100, 'Done');
  const base = fileName.replace(/\.pdf$/i, '');
  return { blob, fileName: `${base}_edited.pdf` };
}

// ---------------------------------------------------------------------------
// Signature generation (type / draw) — produce PNG data URLs
// ---------------------------------------------------------------------------

export function drawSignatureToDataUrl(strokes: Array<Array<{ x: number; y: number }>>, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (const p of stroke.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  return canvas.toDataURL('image/png');
}

export async function typeSignatureToDataUrl(name: string, fontFamily: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const scale = 3;
  const w = 600;
  const h = 160;
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#111111';
  ctx.font = `italic ${44}px ${fontFamily}, cursive`;
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 20, h / 2);
  return canvas.toDataURL('image/png');
}

export async function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export function estimateImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 200, height: 100 });
    img.src = dataUrl;
  });
}

/** Guard used by the uploader: true when the file looks processable. */
export function validatePdfFile(file: File, locale: string): string | null {
  const s = getEditorStrings(locale);
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return s.errorPdfOnly;
  if (file.size > MAX_FILE_BYTES) return s.errorTooLarge;
  return null;
}
