'use client';

/**
 * Edit PDF tool — a fully client-side PDF editor with a Sejda-style
 * workspace: a horizontal top toolbar with grouped dropdowns, a per-page
 * tool row, click-to-select text with a floating context toolbar, and a
 * floating Apply button. Rendering/export live in editor-core.ts.
 *
 * Interactions mirror the reference editor's model:
 *  - Text tool: hover highlights the text line under the pointer; click
 *    selects it (blue overlay + floating toolbar); "Edit text" covers the
 *    line with whiteout and opens an inline editor prefilled with the
 *    original string. Clicking empty space starts a new text box.
 *  - Select tool: click an edit object to select it; the floating toolbar
 *    offers style controls, duplicate and delete.
 * All processing stays local; UI strings come from ./strings.ts (9 locales).
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import {
  MousePointer2,
  Type,
  Image as ImageIcon,
  Link2,
  Eraser,
  Highlighter,
  Strikethrough,
  Underline as UnderlineIcon,
  Pencil,
  Square,
  Circle,
  Minus,
  MoveUpRight,
  Check,
  X,
  Dot,
  PenTool,
  Stamp,
  Search,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Trash2,
  RefreshCw,
  ChevronDown,
  Copy,
  ClipboardList,
  Move,
  MessageSquare,
  Underline as UnderlineIcon2,
  Superscript,
  Subscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { Button, Card, Modal } from '@/components/ui';
import FileUploader from '@/components/tools/FileUploader';
import DownloadButton from '@/components/tools/DownloadButton';
import { loadPdfjs } from '@/lib/pdf/loader';
import { getEditorStrings } from './strings';
import {
  EDITOR_MAX_FILE_BYTES,
  FONT_OPTIONS,
  buildBlocksFromLines,
  buildLinesFromSpans,
  buildReplacements,
  drawSignatureToDataUrl,
  estimateImageSize,
  exportEditedPdf,
  extractTextLines,
  fileToDataUrl,
  findLineAt,
  nextObjectId,
  typeSignatureToDataUrl,
  validatePdfFile,
  type EditObject,
  type FontId,
  type FormFieldObject,
  type FormFieldType,
  type NoteObject,
  type FormFieldValue,
  type FormValues,
  type LineObject,
  type PageOp,
  type ShapeObject,
  type StampObject,
  type SpanInfo,
  type TextBlock,
  type TextLine,
  type TextObject,
} from './editor-core';

/* eslint-disable @typescript-eslint/no-explicit-any */

type ToolId =
  | 'select' | 'text' | 'image' | 'link' | 'whiteout'
  | 'highlight' | 'strikeout' | 'underline' | 'draw'
  | 'rect' | 'ellipse' | 'line' | 'arrow'
  | 'check' | 'cross' | 'dot' | 'sign' | 'stamp' | 'find'
  | 'formfield' | 'note';

type MenuId = 'text' | 'forms' | 'images' | 'sign' | 'annotate' | 'shapes' | null;

interface PageSize { w: number; h: number }

interface Snapshot {
  objects: EditObject[];
  pageOps: Record<number, PageOp>;
}

type DragMode = 'draw-rect' | 'draw-line' | 'freehand' | 'move' | 'resize' | null;

interface DragState {
  mode: DragMode;
  pageIndex: number;
  startVx: number;
  startVy: number;
  objectId?: string;
  orig?: EditObject;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;

export interface EditPDFToolProps {
  className?: string;
}

let textLayerCssInstalled = false;
function installTextLayerCss() {
  if (textLayerCssInstalled || typeof document === 'undefined') return;
  const st = document.createElement('style');
  st.textContent = '.pdfjs-textlayer span{position:absolute;white-space:pre;transform-origin:0% 0%;color:transparent;cursor:text;line-height:1;}';
  document.head.appendChild(st);
  textLayerCssInstalled = true;
}

export function EditPDFTool({ className }: EditPDFToolProps) {
  installTextLayerCss();
  const locale = useLocale();
  const s = useMemo(() => getEditorStrings(locale), [locale]);

  // Document state
  const [file, setFile] = useState<File | null>(null);
  const originalBytesRef = useRef<ArrayBuffer | null>(null);
  const pdfDocRef = useRef<any>(null);
  const [pageSizes, setPageSizes] = useState<PageSize[]>([]);
  const [initialRots, setInitialRots] = useState<number[]>([]);
  const [formFields, setFormFields] = useState<FormFieldValue[]>([]);

  // Edits
  const [objects, setObjects] = useState<EditObject[]>([]);
  const [pageOps, setPageOps] = useState<Record<number, PageOp>>({});
  const [formValues, setFormValues] = useState<FormValues>({});
  const undoStackRef = useRef<Snapshot[]>([]);
  const redoStackRef = useRef<Snapshot[]>([]);
  const [, setHistoryTick] = useState(0);

  // UI state
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [zoom, setZoom] = useState(1);
  const [fitZoom, setFitZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Text selection (click-to-edit existing text)
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [blocksByPage, setBlocksByPage] = useState<Map<number, TextBlock[]>>(new Map());
  const hoverBlockRef = useRef<TextBlock | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [moveMode, setMoveMode] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TextBlock | null>(null);
  const lastPressRef = useRef<{ t: number; x: number; y: number }>({ t: 0, x: 0, y: 0 });
  useEffect(() => {
    if (objects.length > 0) {
      console.warn('[probe-obj]', JSON.stringify(objects.map((o) => ({ k: o.kind, fs: o.kind === 'text' ? (o as TextObject).fontSize : undefined, id: o.id.slice(-4) }))));
    }
  }, [objects]);

  // Style defaults for new objects
  const [styleFont, setStyleFont] = useState<FontId>('helvetica');
  const [styleSize, setStyleSize] = useState(14);
  const [styleColor, setStyleColor] = useState('#111111');
  const [styleBold, setStyleBold] = useState(false);
  const [styleItalic, setStyleItalic] = useState(false);
  const [styleStroke, setStyleStroke] = useState('#e11d48');
  const [styleFill, setStyleFill] = useState('none');
  const [styleStrokeWidth, setStyleStrokeWidth] = useState(2);

  // Pending assets
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingSign, setPendingSign] = useState<string | null>(null);
  const [signMode, setSignMode] = useState<'type' | 'draw' | 'upload'>('type');
  const [signName, setSignName] = useState('');
  const [stampText, setStampText] = useState('APPROVED');
  const [formFieldType, setFormFieldType] = useState<FormFieldType>('text');
  const [pendingField, setPendingField] = useState<FormFieldObject | null>(null);
  const [fieldOptions, setFieldOptions] = useState('');
  const [originalPageCount, setOriginalPageCount] = useState(0);
  const [stampDate, setStampDate] = useState(true);

  // Find & replace
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [finding, setFinding] = useState(false);
  const textLinesRef = useRef<Map<number, TextLine[]>>(new Map());

  // Drag / preview
  const dragRef = useRef<DragState | null>(null);
  const [draftRect, setDraftRect] = useState<{ pageIndex: number; x: number; yTop: number; w: number; h: number } | null>(null);
  const [draftLine, setDraftLine] = useState<{ pageIndex: number; x1: number; yTop1: number; x2: number; yTop2: number } | null>(null);
  const [draftPoints, setDraftPoints] = useState<{ pageIndex: number; pts: Array<{ x: number; yTop: number }> } | null>(null);

  // Export
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');

  // Layout refs
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawStrokesRef = useRef<Array<Array<{ x: number; y: number }>>>([]);

  const selected = objects.find((o) => o.id === selectedId) ?? null;
  const selectedPageHasObjects = useCallback(
    (idx: number) => objects.some((o) => o.pageIndex === idx),
    [objects]
  );

  const commit = useCallback((nextObjects: EditObject[], nextPageOps?: Record<number, PageOp>) => {
    undoStackRef.current.push({ objects, pageOps });
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
    setObjects(nextObjects);
    if (nextPageOps) setPageOps(nextPageOps);
    setResultBlob(null);
    setHistoryTick((t) => t + 1);
  }, [objects, pageOps]);

  const undo = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    redoStackRef.current.push({ objects, pageOps });
    setObjects(prev.objects);
    setPageOps(prev.pageOps);
    setSelectedId(null);
    setResultBlob(null);
    setHistoryTick((t) => t + 1);
  }, [objects, pageOps]);

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push({ objects, pageOps });
    setObjects(next.objects);
    setPageOps(next.pageOps);
    setSelectedId(null);
    setResultBlob(null);
    setHistoryTick((t) => t + 1);
  }, [objects, pageOps]);

  const flash = useCallback((msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 3500);
  }, []);

  const updateObject = useCallback((id: string, patch: Partial<EditObject>) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? ({ ...o, ...patch } as EditObject) : o)));
  }, []);

  // ------------------------------------------------------------------
  // File loading (+ background text-layer extraction)
  // ------------------------------------------------------------------

  const extractForms = useCallback(async (bytes: ArrayBuffer) => {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: false, updateMetadata: false });
      const form = doc.getForm();
      const fields = form.getFields();
      const list: FormFieldValue[] = fields.slice(0, 40).map((f) => {
        const name = f.getName();
        const ctor = f.constructor.name;
        let type: FormFieldValue['type'] = 'unknown';
        let options: string[] | undefined;
        let value: string | undefined;
        let checked: boolean | undefined;
        let readOnly = false;
        try {
          const anyF = f as any;
          if (anyF.isReadOnly?.()) readOnly = true;
          if (ctor === 'PDFTextField') { type = 'text'; value = anyF.getText() ?? ''; }
          else if (ctor === 'PDFCheckBox') { type = 'checkbox'; checked = anyF.isChecked(); }
          else if (ctor === 'PDFDropdown') { type = 'dropdown'; options = anyF.getOptions(); value = anyF.getSelected()?.[0]; }
          else if (ctor === 'PDFRadioGroup') { type = 'radio'; options = anyF.getOptions(); value = anyF.getSelected(); }
          else if (ctor === 'PDFOptionList') { type = 'optionlist'; options = anyF.getOptions(); value = anyF.getSelected()?.[0]; }
          else type = 'unknown';
        } catch { type = 'unknown'; }
        return { name, type, value, checked, options, readOnly };
      }).filter((f) => f.type !== 'unknown' && !f.readOnly);
      setFormFields(list);
      const init: FormValues = {};
      for (const f of list) {
        if (f.type === 'checkbox') init[f.name] = f.checked ?? false;
        else if (f.value) init[f.name] = f.value;
      }
      setFormValues(init);
    } catch {
      setFormFields([]);
      setFormValues({});
    }
  }, []);

  const openFile = useCallback(async (f: File) => {
    const invalid = validatePdfFile(f, locale);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const buf = await f.arrayBuffer();
      originalBytesRef.current = buf;
      const pdfjs = await loadPdfjs();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
      pdfDocRef.current = doc;
      const n = doc.numPages;
      const sizes: PageSize[] = [];
      const rots: number[] = [];
      for (let i = 1; i <= n; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        sizes.push({ w: vp.width, h: vp.height });
        rots.push(((page.rotate ?? 0) % 360 + 360) % 360);
      }
      setPageSizes(sizes);
      setInitialRots(rots);
      setOriginalPageCount(n);
      setFile(f);
      setObjects([]);
      setPageOps({});
      setFormFields([]);
      setFormValues({});
      undoStackRef.current = [];
      redoStackRef.current = [];
      setResultBlob(null);
      setSelectedId(null);
      // Sejda opens with the Text tool active — clicking any existing text
      // works right away, no tool selection needed first.
      setActiveTool('text');
      textLinesRef.current = new Map();
      void extractForms(buf);
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el && sizes[0]) {
          // Open at 100% (Acrobat default). Fit-to-width stays available via
          // the toolbar's Fit button; it is remembered as fitZoom for it.
          const fit = Math.min(1.4, Math.max(MIN_ZOOM, (el.clientWidth - 48) / sizes[0].w));
          setFitZoom(fit);
          setZoom(1);
        }
      });
      // Fallback pre-extraction (transform-based) for pages whose canvas
      // has not rendered yet; DOM-accurate lines arrive from the text layer
      // and override these as each page renders.
      void (async () => {
        for (let i = 0; i < n; i++) {
          try {
            if (textLinesRef.current.has(i)) continue;
            const pg = await doc.getPage(i + 1);
            const lines = await extractTextLines(pg, i);
            if (!textLinesRef.current.has(i)) textLinesRef.current.set(i, lines);
          } catch {
            // page without a text layer — click-to-edit simply won't hit
          }
        }
      })();
    } catch (e) {
      void e;
      setError(s.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [extractForms, locale, s.errorLoad]);

  const reset = useCallback(() => {
    if (objects.length > 0 && !window.confirm(s.confirmReset)) return;
    pdfDocRef.current?.destroy?.();
    pdfDocRef.current = null;
    originalBytesRef.current = null;
    setFile(null);
    setPageSizes([]);
    setInitialRots([]);
    setObjects([]);
    setPageOps({});
    setFormFields([]);
    setFormValues({});
    setPendingImage(null);
    setPendingSign(null);
    setResultBlob(null);
    setError(null);
    textLinesRef.current = new Map();
  }, [objects.length, s.confirmReset]);

  // ------------------------------------------------------------------
  // Coordinates / helpers
  // ------------------------------------------------------------------

  const toViewPt = useCallback((pageIndex: number, clientX: number, clientY: number) => {
    const el = pageRefs.current[pageIndex];
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  }, [zoom]);

  const pageLocked = useCallback(
    (idx: number) => initialRots[idx] !== 0 || (pageOps[idx]?.rotationDelta ?? 0) !== 0,
    [initialRots, pageOps]
  );

  const getLines = useCallback(async (pageIndex: number): Promise<TextLine[]> => {
    const cached = textLinesRef.current.get(pageIndex);
    if (cached) return cached;
    const doc = pdfDocRef.current;
    if (!doc) return [];
    const page = await doc.getPage(pageIndex + 1);
    const lines = await extractTextLines(page, pageIndex);
    textLinesRef.current.set(pageIndex, lines);
    return lines;
  }, []);

  // ------------------------------------------------------------------
  // Text: hover highlight, click select, edit/duplicate
  // ------------------------------------------------------------------

  const onOverlayPointerMove = useCallback((pageIndex: number, e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag) {
      const pt = toViewPt(drag.pageIndex, e.clientX, e.clientY);
      if (drag.mode === 'freehand') {
        setDraftPoints((prev) => (prev ? { ...prev, pts: [...prev.pts, { x: pt.x, yTop: pt.y }] } : prev));
      } else if (drag.mode === 'draw-line') {
        setDraftLine({ pageIndex: drag.pageIndex, x1: drag.startVx, yTop1: drag.startVy, x2: pt.x, yTop2: pt.y });
      } else if (drag.mode === 'draw-rect') {
        setDraftRect({ pageIndex: drag.pageIndex, x: Math.min(drag.startVx, pt.x), yTop: Math.min(drag.startVy, pt.y), w: Math.abs(pt.x - drag.startVx), h: Math.abs(pt.y - drag.startVy) });
      }
      return;
    }
    if (activeTool !== 'text') {
      if (hoverKey) { setHoverKey(null); hoverBlockRef.current = null; }
      return;
    }
    // Zoom-proof: the text-layer span under the pointer knows its line —
    // native elementFromPoint needs no coordinate math at all.
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const liAttr = el?.closest?.('[data-li]')?.getAttribute('data-li');
    let hitLine: TextLine | null = null;
    if (liAttr !== null && liAttr !== undefined && liAttr !== '-1') {
      const lines = textLinesRef.current.get(pageIndex);
      hitLine = lines?.[Number(liAttr)] ?? null;
    }
    if (!hitLine) {
      const pt = toViewPt(pageIndex, e.clientX, e.clientY);
      const lines = textLinesRef.current.get(pageIndex);
      hitLine = lines ? findLineAt(lines, pageIndex, pt.x, pt.y) : null;
    }
    // Upgrade to block: lines of the same page that cluster with the hit
    let hitBlock: TextBlock | null = null;
    if (hitLine) {
      const blocks = blocksByPage.get(pageIndex);
      hitBlock = blocks?.find((b) => b.lines.some((l) => l === hitLine)) ?? null;
    }
    const key = hitLine ? `${pageIndex}:${(hitBlock ?? hitLine).x.toFixed(0)}:${(hitBlock ?? hitLine).yTop.toFixed(0)}` : null;
    if (key !== hoverKey) {
      setHoverKey(key);
      hoverBlockRef.current = hitBlock;
    }
  }, [activeTool, blocksByPage, hoverKey, findLineAt, toViewPt]);

  /** Acrobat behaviour: a single click on existing text selects the whole
   *  block (Acrobat's dashed boundary), whites out the block area and opens
   *  a prefilled block editor that re-flows on export. */
  const startBlockEdit = useCallback((block: TextBlock) => {
    if (editingId) return; // already editing — a dblclick's 2nd click lands here
    const whiteout: EditObject = { id: nextObjectId(), kind: 'whiteout', pageIndex: block.pageIndex, x: block.x, yTop: block.yTop, width: block.width, height: block.height * 1.15 };
    const text: TextObject = {
      id: nextObjectId(), kind: 'text', pageIndex: block.pageIndex,
      x: block.x, yTop: block.yTop, width: Math.max(block.width, 40),
      text: block.text, fontSize: block.fontSize,
      color: '#111111', bold: styleBold, italic: styleItalic, fontId: styleFont,
      lineHeightRatio: block.lineHeightRatio, wrap: true,
    };
    commit([...objects, whiteout, text]);
    setSelectedId(text.id);
    setEditingId(text.id);
    setDraftText(text.text);
    setActiveTool('select');
  }, [commit, editingId, objects, styleBold, styleFont, styleItalic]);

  /** Commit the draft (Enter or the Done button). Blur is deliberately
   *  inert: clicking the floating style bar must not close the editor. */
  const commitTextEdit = useCallback(() => {
    if (!editingId) return;
    const t = draftText.trim();
    if (!t) {
      commit(objects.filter((x) => x.id !== editingId));
    } else {
      commit(objects.map((x) => (x.id === editingId ? { ...(x as TextObject), text: draftText } : x)));
    }
    setEditingId(null);
  }, [commit, draftText, editingId, objects]);

  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    const clone = { ...selected, id: nextObjectId() } as EditObject;
    if ('yTop' in clone) (clone as any).yTop = (clone as any).yTop + 24;
    else if ('yTop1' in clone) { (clone as any).yTop1 += 24; (clone as any).yTop2 += 24; }
    else if ('points' in clone) (clone as any).points = (clone as any).points.map((p: any) => ({ ...p, yTop: p.yTop + 24 }));
    commit([...objects, clone]);
    setSelectedId(clone.id);
  }, [commit, objects, selected]);

  /** Bounding box of any edit object in PDF space (top-left anchor). */
  const objBBox = useCallback((o: EditObject): { x: number; yTop: number; w: number; h: number } => {
    switch (o.kind) {
      case 'line': case 'arrow':
        return { x: Math.min(o.x1, o.x2), yTop: Math.min(o.yTop1, o.yTop2), w: Math.abs(o.x2 - o.x1) || 2, h: Math.abs(o.yTop2 - o.yTop1) || 2 };
      case 'freehand': {
        const xs = o.points.map((p) => p.x); const ys = o.points.map((p) => p.yTop);
        return { x: Math.min(...xs), yTop: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) || 2, h: Math.max(...ys) - Math.min(...ys) || 2 };
      }
      case 'check': case 'cross': case 'dot':
        return { x: o.x, yTop: o.yTop, w: o.size, h: o.size };
      case 'note':
        return { x: o.x, yTop: o.yTop, w: 24, h: 24 };
      case 'stamp':
        return { x: o.x, yTop: o.yTop, w: o.fontSize * 5, h: o.fontSize * 2 };
      case 'text':
        return { x: o.x, yTop: o.yTop, w: o.width, h: o.fontSize * 1.3 };
      default:
        return { x: o.x, yTop: o.yTop, w: o.width, h: o.height };
    }
  }, []);

  const findObjectAt = useCallback((pageIndex: number, vx: number, vy: number): EditObject | null => {
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      if (o.pageIndex !== pageIndex) continue;
      const b = objBBox(o);
      const pad = 3;
      if (vx >= b.x - pad && vx <= b.x + b.w + pad && vy >= b.yTop - pad && vy <= b.yTop + b.h + pad) return o;
    }
    return null;
  }, [objects, objBBox]);

  // ------------------------------------------------------------------
  // Object creation
  // ------------------------------------------------------------------

  const addTextAt = useCallback((pageIndex: number, vx: number, vy: number) => {
    if (pageLocked(pageIndex)) { flash(s.scanWarning); return; }
    const obj: TextObject = {
      id: nextObjectId(), kind: 'text', pageIndex,
      x: vx, yTop: vy, width: 200, text: '', fontSize: styleSize,
      color: styleColor, bold: styleBold, italic: styleItalic, fontId: styleFont,
    };
    commit([...objects, obj]);
    setSelectedId(obj.id);
    setEditingId(obj.id);
    setDraftText('');
    setActiveTool('select');
  }, [commit, flash, objects, pageLocked, s.scanWarning, styleBold, styleColor, styleFont, styleItalic, styleSize]);

  const placeAsset = useCallback((pageIndex: number, vx: number, vy: number) => {
    if (pageLocked(pageIndex)) { flash(s.scanWarning); return; }
    let next = objects;
    let newId = '';
    if (activeTool === 'image' && pendingImage) {
      newId = nextObjectId();
      const w = Math.min(220, pageSizes[pageIndex].w * 0.4);
      next = [...objects, { id: newId, kind: 'image', pageIndex, x: vx, yTop: vy, width: w, height: w * 0.66, src: pendingImage }];
      setPendingImage(null);
      setActiveTool('select');
    } else if (activeTool === 'sign' && pendingSign) {
      newId = nextObjectId();
      const w = 160;
      next = [...objects, { id: newId, kind: 'image', pageIndex, x: vx, yTop: vy, width: w, height: w * 0.4, src: pendingSign }];
      setPendingSign(null);
      setActiveTool('select');
    } else if (activeTool === 'formfield') {
      const dims: Record<FormFieldType, [number, number]> = {
        text: [170, 26], textarea: [190, 64], dropdown: [150, 26],
        radio: [22, 22], checkbox: [22, 22], signature: [170, 50],
      };
      const [w, h] = dims[formFieldType];
      setPendingField({
        id: nextObjectId(), kind: 'formfield', pageIndex, x: vx, yTop: vy,
        width: w, height: h, fieldType: formFieldType,
        name: `${formFieldType}_${pageIndex + 1}_${Math.round(vy)}`,
        value: formFieldType === 'checkbox' ? 'false' : '',
        options: formFieldType === 'dropdown' ? ['Option 1', 'Option 2'] : undefined,
      });
      setFieldOptions(formFieldType === 'dropdown' ? 'Option 1\nOption 2' : '');
      return;
    } else if (activeTool === 'note') {
      newId = nextObjectId();
      next = [...objects, { id: newId, kind: 'note', pageIndex, x: vx, yTop: vy, text: '', author: 'Me', createdAt: new Date().toISOString() } as NoteObject];
    } else if (activeTool === 'check' || activeTool === 'cross' || activeTool === 'dot') {
      newId = nextObjectId();
      const size = 18;
      next = [...objects, { id: newId, kind: activeTool, pageIndex, x: vx, yTop: vy, size, color: styleColor } as EditObject];
    } else if (activeTool === 'stamp') {
      newId = nextObjectId();
      next = [...objects, { id: newId, kind: 'stamp', pageIndex, x: vx, yTop: vy, text: stampText, includeDate: stampDate, color: styleStroke, fontSize: 16 } as StampObject];
    } else {
      return;
    }
    commit(next);
    if (newId) setSelectedId(newId);
  }, [activeTool, commit, flash, formFieldType, objects, pageLocked, pageSizes, pendingImage, pendingSign, s.scanWarning, stampDate, stampText, styleColor, styleStroke]);

  const finishRectDrag = useCallback((pageIndex: number, x1: number, y1: number, x2: number, y2: number) => {
    if (pageLocked(pageIndex)) { flash(s.scanWarning); return; }
    const x = Math.min(x1, x2);
    const yTop = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    if (w < 3 && h < 3) return;
    let obj: EditObject | null = null;
    switch (activeTool) {
      case 'whiteout': obj = { id: nextObjectId(), kind: 'whiteout', pageIndex, x, yTop, width: w, height: h }; break;
      case 'highlight': obj = { id: nextObjectId(), kind: 'highlight', pageIndex, x, yTop, width: w, height: h, color: '#fde047' }; break;
      case 'strikeout': obj = { id: nextObjectId(), kind: 'strikeout', pageIndex, x, yTop: yTop + h / 2 - h * 0.1, width: w, height: h * 0.2 + 2, color: '#dc2626' }; break;
      case 'underline': obj = { id: nextObjectId(), kind: 'underline', pageIndex, x, yTop: yTop + h - 3, width: w, height: 3, color: '#2563eb' }; break;
      case 'link': obj = { id: nextObjectId(), kind: 'link', pageIndex, x, yTop, width: w, height: h, linkType: 'url', value: '' }; break;
      case 'rect':
      case 'ellipse':
        obj = { id: nextObjectId(), kind: activeTool, pageIndex, x, yTop, width: w, height: h, stroke: styleStroke, fill: styleFill, strokeWidth: styleStrokeWidth } as ShapeObject;
        break;
      default: return;
    }
    commit([...objects, obj]);
    setSelectedId(obj.id);
  }, [activeTool, commit, flash, objects, pageLocked, s.scanWarning, styleFill, styleStroke, styleStrokeWidth]);

  const finishLineDrag = useCallback((pageIndex: number, x1: number, y1: number, x2: number, y2: number) => {
    if (pageLocked(pageIndex)) { flash(s.scanWarning); return; }
    if (Math.abs(x2 - x1) + Math.abs(y2 - y1) < 3) return;
    const obj: LineObject = { id: nextObjectId(), kind: activeTool === 'arrow' ? 'arrow' : 'line', pageIndex, x1, yTop1: y1, x2, yTop2: y2, stroke: styleStroke, strokeWidth: styleStrokeWidth };
    commit([...objects, obj]);
    setSelectedId(obj.id);
  }, [activeTool, commit, flash, objects, pageLocked, s.scanWarning, styleStroke, styleStrokeWidth]);

  // ------------------------------------------------------------------
  // Pointer handlers
  // ------------------------------------------------------------------

  const onOverlayPointerDown = useCallback((pageIndex: number, e: React.PointerEvent) => {
    if (applying) return;
    setOpenMenu(null);
    const target = e.target as HTMLElement;
    if (target.closest('[data-floating]')) return;
    if (target.closest('[data-oid]')) return;
    const pt = toViewPt(pageIndex, e.clientX, e.clientY);
    // Pointer capture is only needed for drag-drawing tools; capturing on
    // click-select tools (select/text) swallows the browser's dblclick
    // synthesis, so double-click-to-edit never fired.
    if (activeTool !== 'select' && activeTool !== 'text') {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    if (activeTool === 'select') {
      if (moveMode && selected) {
        const b = objBBox(selected);
        const dx = pt.x - (b.x + b.w / 2);
        const dy = pt.y - (b.yTop + b.h / 2);
        const moved = { ...selected } as any;
        if ('points' in moved) moved.points = moved.points.map((p: any) => ({ x: p.x + dx, yTop: p.yTop + dy }));
        else if ('x1' in moved) { moved.x1 += dx; moved.x2 += dx; moved.yTop1 += dy; moved.yTop2 += dy; }
        else { moved.x += dx; moved.yTop += dy; }
        commit(objects.map((o) => (o.id === selected.id ? moved : o)));
        setMoveMode(false);
        return;
      }
      if (editingId) commitTextEdit(); // clicking empty space finishes the edit
      setSelectedId(null);
      setEditingId(null);
      setSelectedBlock(null);
        return;
    }
    if (activeTool === 'text') {
      // Acrobat interaction: single click SELECTS the block (persistent
      // boundary), double click (or a second click on the selected block)
      // enters in-place editing. Double-click is self-rolled (two presses
      // < 400ms apart within 6px) because the browser's dblclick synthesis
      // is unreliable after pointer-event handling on overlays.
      const now = Date.now();
      const last = lastPressRef.current;
      const isDouble = now - last.t < 400 && Math.abs(e.clientX - last.x) < 6 && Math.abs(e.clientY - last.y) < 6;
      lastPressRef.current = { t: now, x: e.clientX, y: e.clientY };
      const objHit = findObjectAt(pageIndex, pt.x, pt.y);
      if (objHit) {
        setSelectedId(objHit.id);
        setActiveTool('select');
        return;
      }
      const hitTest = (): TextBlock | null => {
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const liAttr = el?.closest?.('[data-li]')?.getAttribute('data-li');
        if (liAttr !== null && liAttr !== undefined && liAttr !== '-1') {
          const lines = textLinesRef.current.get(pageIndex);
          const hit = lines?.[Number(liAttr)] ?? null;
          if (hit) {
            return blocksByPage.get(pageIndex)?.find((b) => b.lines.some((l) => l === hit)) ??
              ({ ...hit, lineHeightRatio: 1.25 } as unknown as TextBlock);
          }
        }
        return null;
      };
      const blk = hitTest();
      if (blk) {
        if (editingId) return; // double-click's 2nd press: editor already open
        if (isDouble || (selectedBlock && sameBlock(selectedBlock, blk))) {
          startBlockEdit(blk); // double click / second click on selected block
        } else {
          setSelectedBlock(blk); // first click: persistent selection
        }
        return;
      }
      // Race-safe: if the background pre-extraction has not finished yet,
      // extract now (cached after the first call) instead of missing the
      // click entirely.
      void (async () => {
        const lines = await getLines(pageIndex);
        const pt2 = toViewPt(pageIndex, e.clientX, e.clientY);
        const hit = findLineAt(lines, pageIndex, pt2.x, pt2.y);
        if (hit) {
          const blk2 = blocksByPage.get(pageIndex)?.find((b) => b.lines.some((l) => l === hit)) ??
            ({ ...hit, lineHeightRatio: 1.25 } as unknown as TextBlock);
          if (editingId) return;
          if (isDouble || (selectedBlock && sameBlock(selectedBlock, blk2))) {
            startBlockEdit(blk2);
          } else {
            setSelectedBlock(blk2);
          }
        } else {
          setSelectedBlock(null);
          addTextAt(pageIndex, pt2.x, pt2.y);
        }
      })();
      return;
    }
    if (activeTool === 'image' || activeTool === 'sign' || activeTool === 'check' || activeTool === 'cross' || activeTool === 'dot' || activeTool === 'stamp' || activeTool === 'formfield' || activeTool === 'note') {
      placeAsset(pageIndex, pt.x, pt.y);
      return;
    }
    if (activeTool === 'draw') {
      dragRef.current = { mode: 'freehand', pageIndex, startVx: pt.x, startVy: pt.y };
      setDraftPoints({ pageIndex, pts: [{ x: pt.x, yTop: pt.y }] });
      return;
    }
    if (activeTool === 'line' || activeTool === 'arrow') {
      dragRef.current = { mode: 'draw-line', pageIndex, startVx: pt.x, startVy: pt.y };
      setDraftLine({ pageIndex, x1: pt.x, yTop1: pt.y, x2: pt.x, yTop2: pt.y });
      return;
    }
    dragRef.current = { mode: 'draw-rect', pageIndex, startVx: pt.x, startVy: pt.y };
    setDraftRect({ pageIndex, x: pt.x, yTop: pt.y, w: 0, h: 0 });
  }, [activeTool, addTextAt, applying, blocksByPage, commitTextEdit, editingId, findObjectAt, moveMode, objects, placeAsset, selected, selectedBlock, startBlockEdit, toViewPt]);

  const onOverlayPointerUp = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    const pt = toViewPt(drag.pageIndex, e.clientX, e.clientY);
    if (drag.mode === 'freehand') {
      const pts = draftPoints?.pts ?? [];
      setDraftPoints(null);
      if (pts.length > 1 && !pageLocked(drag.pageIndex)) {
        commit([...objects, { id: nextObjectId(), kind: 'freehand', pageIndex: drag.pageIndex, points: pts, stroke: styleStroke, strokeWidth: styleStrokeWidth }]);
      }
    } else if (drag.mode === 'draw-line') {
      const dl = draftLine;
      setDraftLine(null);
      if (dl) finishLineDrag(drag.pageIndex, dl.x1, dl.yTop1, dl.x2, dl.yTop2);
    } else if (drag.mode === 'draw-rect') {
      const dr = draftRect;
      setDraftRect(null);
      if (dr) finishRectDrag(drag.pageIndex, drag.startVx, drag.startVy, pt.x, pt.y);
    }
  }, [commit, draftLine, draftPoints, draftRect, finishLineDrag, finishRectDrag, objects, pageLocked, styleStroke, styleStrokeWidth, toViewPt]);

  const onObjectPointerDown = useCallback((obj: EditObject, e: React.PointerEvent, handle?: 'se') => {
    if (activeTool !== 'select' || applying) return;
    e.stopPropagation();
    const pt = toViewPt(obj.pageIndex, e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    undoStackRef.current.push({ objects, pageOps });
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
    setHistoryTick((t) => t + 1);
    dragRef.current = { mode: handle ? 'resize' : 'move', pageIndex: obj.pageIndex, startVx: pt.x, startVy: pt.y, objectId: obj.id, orig: { ...obj } };
    setSelectedId(obj.id);
  }, [activeTool, applying, objects, pageOps, toViewPt]);

  const onObjectPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !drag.objectId || !drag.orig) return;
    const pt = toViewPt(drag.pageIndex, e.clientX, e.clientY);
    const dx = pt.x - drag.startVx;
    const dy = pt.y - drag.startVy;
    const o = drag.orig;
    if (drag.mode === 'move') {
      if ('x' in o && 'yTop' in o) updateObject(o.id, { x: o.x + dx, yTop: o.yTop + dy } as Partial<EditObject>);
    } else if (drag.mode === 'resize') {
      switch (o.kind) {
        case 'text': updateObject(o.id, { width: Math.max(30, (o as TextObject).width + dx), fontSize: Math.max(6, (o as TextObject).fontSize + dy * 0.2) } as Partial<EditObject>); break;
        case 'image': updateObject(o.id, { width: Math.max(20, o.width + dx), height: Math.max(20, o.height + dy) }); break;
        case 'rect': case 'ellipse': case 'whiteout': case 'highlight': case 'strikeout': case 'underline': case 'link':
          updateObject(o.id, { width: Math.max(5, o.width + dx), height: Math.max(5, o.height + dy) }); break;
        case 'check': case 'cross': case 'dot': updateObject(o.id, { size: Math.max(8, o.size + dx) }); break;
        default: break;
      }
    }
  }, [toViewPt, updateObject]);

  const onObjectPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // ------------------------------------------------------------------
  // Keyboard
  // ------------------------------------------------------------------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.activeElement;
        const inEditor = active instanceof HTMLElement && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.isContentEditable);
        if (inEditor) return; // let the textarea handle its own text selection edits
        if (selectedId) {
          e.preventDefault();
          commit(objects.filter((o) => o.id !== selectedId));
          setSelectedId(null);
        }
      } else if (e.key === 'Escape') {
        setActiveTool('select');
        setEditingId(null);
        setSelectedBlock(null);
        setOpenMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit, objects, redo, selectedId, undo]);

  const handleLinesReady = useCallback((pi: number, lines: TextLine[]) => {
    textLinesRef.current.set(pi, lines);
    setBlocksByPage((prev) => {
      const next = new Map(prev);
      next.set(pi, buildBlocksFromLines(lines));
      return next;
    });
  }, []);

  // ------------------------------------------------------------------
  // Page rotation & deletion
  // ------------------------------------------------------------------

  const rotatePage = useCallback((idx: number, delta: number) => {
    if (selectedPageHasObjects(idx)) { flash(s.pageLocked); return; }
    const next = { ...pageOps };
    const cur = next[idx] ?? { rotationDelta: 0, deleted: false };
    next[idx] = { ...cur, rotationDelta: ((cur.rotationDelta + delta) % 360 + 360) % 360 };
    undoStackRef.current.push({ objects, pageOps });
    redoStackRef.current = [];
    setPageOps(next);
    setResultBlob(null);
    setHistoryTick((t) => t + 1);
  }, [flash, objects, pageOps, selectedPageHasObjects, s.pageLocked]);

  const deletePage = useCallback((idx: number) => {
    if (selectedPageHasObjects(idx)) { flash(s.pageLocked); return; }
    if (pageSizes.length <= 1) return;
    const next = { ...pageOps };
    const cur = next[idx] ?? { rotationDelta: 0, deleted: false };
    next[idx] = { ...cur, deleted: true };
    undoStackRef.current.push({ objects, pageOps });
    redoStackRef.current = [];
    setPageOps(next);
    setResultBlob(null);
    setHistoryTick((t) => t + 1);
  }, [flash, objects, pageOps, pageSizes.length, selectedPageHasObjects, s.pageLocked]);

  // ------------------------------------------------------------------
  // Find & replace
  // ------------------------------------------------------------------

  const replaceAll = useCallback(async () => {
    if (!findText) return;
    setFinding(true);
    try {
      const doc = pdfDocRef.current;
      if (!doc) return;
      const all: TextLine[] = [];
      for (let i = 0; i < doc.numPages; i++) {
        const lines = await getLines(i);
        all.push(...lines);
      }
      const heights = pageSizes.map((p) => p.h);
      const { edits, count } = buildReplacements(all, findText, replaceText, matchCase, heights);
      if (count === 0) {
        flash(s.noMatches);
      } else {
        commit([...objects, ...edits.map((e) => e.whiteout), ...edits.map((e) => e.text)]);
        flash(`${count} ${s.replacements}`);
      }
    } finally {
      setFinding(false);
    }
  }, [commit, findText, flash, getLines, matchCase, objects, pageSizes, replaceText, s.noMatches, s.replacements]);

  // ------------------------------------------------------------------
  // Image / signature inputs
  // ------------------------------------------------------------------

  const onImagePicked = useCallback(async (f: File) => {
    try {
      const url = await fileToDataUrl(f);
      await estimateImageSize(url);
      setPendingImage(url);
      setError(null);
      setActiveTool('image');
    } catch {
      setError(s.errorImage);
    }
  }, [s.errorImage]);

  useEffect(() => {
    if (signMode !== 'draw') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStrokesRef.current = [];
  }, [signMode]);

  const onDrawPadPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    canvas.setPointerCapture(e.pointerId);
    drawStrokesRef.current.push([{ x, y }]);
  }, []);

  const onDrawPadPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const stroke = drawStrokesRef.current[drawStrokesRef.current.length - 1];
    if (!canvas || !ctx || !stroke) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const prev = stroke[stroke.length - 1];
    stroke.push({ x, y });
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  const clearDrawPad = useCallback(() => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStrokesRef.current = [];
  }, []);

  const saveDrawSignature = useCallback(() => {
    const url = drawSignatureToDataUrl(drawStrokesRef.current, 360, 120);
    if (url) { setPendingSign(url); setActiveTool('sign'); }
  }, []);

  const saveTypeSignature = useCallback(async () => {
    if (!signName.trim()) return;
    const url = await typeSignatureToDataUrl(signName.trim(), '"Segoe Script", "Brush Script MT", "Comic Sans MS", cursive');
    if (url) { setPendingSign(url); setActiveTool('sign'); }
  }, [signName]);

  const onSignFilePicked = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setPendingSign(await fileToDataUrl(f));
      setActiveTool('sign');
    } catch {
      setError(s.errorImage);
    }
  }, [s.errorImage]);

  // ------------------------------------------------------------------
  // Apply changes
  // ------------------------------------------------------------------

  const applyChanges = useCallback(async () => {
    if (!originalBytesRef.current || !file) return;
    setApplying(true);
    setProgress(0);
    setError(null);
    try {
      const out = await exportEditedPdf({
        originalBytes: originalBytesRef.current,
        fileName: file.name,
        objects,
        pageOps,
        formValues,
        displayPageCount: pageSizes.length,
        onProgress: (p) => setProgress(p),
      });
      setResultBlob(out.blob);
      setResultName(out.fileName);
    } catch {
      setError(s.errorExport);
    } finally {
      setApplying(false);
    }
  }, [file, formValues, objects, pageOps, s.errorExport]);

  // ------------------------------------------------------------------
  // Form field dialog confirm + blank page
  // ------------------------------------------------------------------

  const confirmField = useCallback(() => {
    if (!pendingField) return;
    const nameTaken = objects.some((o) => o.kind === 'formfield' && o.name === pendingField.name) ||
      formFields.some((f) => f.name === pendingField.name);
    if (nameTaken) { flash(s.formDuplicateName); return; }
    const opts = fieldOptions.split('\n').map((o) => o.trim()).filter(Boolean);
    const obj: FormFieldObject = {
      ...pendingField,
      value: pendingField.fieldType === 'checkbox' ? 'false' : pendingField.value,
      options: pendingField.fieldType === 'dropdown' || pendingField.fieldType === 'radio' ? opts : undefined,
    };
    commit([...objects, obj]);
    setSelectedId(obj.id);
    setPendingField(null);
    setActiveTool('select');
  }, [commit, fieldOptions, flash, formFields, objects, pendingField, s.formDuplicateName]);

  const addBlankPage = useCallback(() => {
    setPageSizes((prev) => [...prev, { w: 595, h: 842 }]);
    setInitialRots((prev) => [...prev, 0]);
    // jump scroll to the new page
    requestAnimationFrame(() => {
      const el = pageRefs.current[pageSizes.length];
      el?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [pageSizes.length]);

  // ------------------------------------------------------------------
  // Toolbar model
  // ------------------------------------------------------------------

  const setTool = useCallback((t: ToolId) => {
    setActiveTool(t);
    setSelectedId(null);
    setEditingId(null);
    setSelectedBlock(null);
  }, []);

  const menuDefs: Array<{ id: Exclude<MenuId, null>; label: string; icon: any; active: boolean; items: Array<{ tool: ToolId; label: string; icon: any }>; colors?: string[] }> = [
    {
      id: 'annotate', label: 'Annotate', icon: Highlighter, active: ['highlight', 'strikeout', 'underline', 'draw'].includes(activeTool),
      items: [
        { tool: 'note', label: s.toolNote, icon: MessageSquare },
        { tool: 'highlight', label: s.toolHighlight, icon: Highlighter },
        { tool: 'strikeout', label: s.toolStrikeout, icon: Strikethrough },
        { tool: 'underline', label: s.toolUnderline, icon: UnderlineIcon },
        { tool: 'draw', label: s.toolDraw, icon: Pencil },
      ],
      colors: ['#fde047', '#86efac', '#93c5fd', '#fca5a5', '#111111'],
    },
    {
      id: 'shapes', label: 'Shapes', icon: Square, active: ['rect', 'ellipse', 'line', 'arrow'].includes(activeTool),
      items: [
        { tool: 'rect', label: s.toolRectangle, icon: Square },
        { tool: 'ellipse', label: s.toolEllipse, icon: Circle },
        { tool: 'line', label: s.toolLine, icon: Minus },
        { tool: 'arrow', label: s.toolArrow, icon: MoveUpRight },
      ],
    },
    {
      id: 'images', label: s.toolImage, icon: ImageIcon, active: activeTool === 'image',
      items: [],
    },
    {
      id: 'sign', label: s.toolSign, icon: PenTool, active: activeTool === 'sign' || activeTool === 'stamp',
      items: [
        { tool: 'stamp', label: s.toolStamp, icon: Stamp },
      ],
    },
    {
      id: 'forms', label: 'Forms', icon: ClipboardList, active: ['check', 'cross', 'dot', 'formfield'].includes(activeTool),
      items: [
        { tool: 'check', label: s.toolCheck, icon: Check },
        { tool: 'cross', label: s.toolCross, icon: X },
        { tool: 'dot', label: s.toolDot, icon: Dot },
      ],
    },
  ];

  const hint = (() => {
    switch (activeTool) {
      case 'select': return moveMode && selected ? s.hintMove : s.hintSelect;
      case 'text': return `${s.hintTextExisting} · ${s.hintText}`;
      case 'image': return pendingImage ? s.hintImage : s.toolImage;
      case 'link': return s.hintLink;
      case 'whiteout': return s.hintWhiteout;
      case 'highlight': case 'strikeout': case 'underline': return s.hintAnnotate;
      case 'draw': return s.hintDraw;
      case 'rect': case 'ellipse': case 'line': case 'arrow': return s.hintShape;
      case 'note': return s.hintNote;
      case 'check': case 'cross': case 'dot': case 'stamp': return s.hintSymbol;
      case 'sign': return pendingSign ? s.hintSign : s.signType;
      default: return '';
    }
  })();

  // ------------------------------------------------------------------
  // Upload screen
  // ------------------------------------------------------------------

  if (!file) {
    return (
      <div className={`w-full max-w-2xl mx-auto ${className ?? ''}`}>
        <FileUploader
          accept={['application/pdf', '.pdf']}
          multiple={false}
          maxFiles={1}
          onFilesSelected={(files: File[]) => { const f = files[0]; if (f) void openFile(f); }}
          onError={(msg: string) => setError(msg)}
          disabled={loading}
          label={s.uploadTitle}
          description={s.uploadDescription}
        />
        {loading && (
          <Card className="mt-4 p-4 text-sm text-[hsl(var(--color-muted-foreground))]">
            <div className="flex items-center gap-3">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--color-primary))] border-t-transparent" />
              Loading…
            </div>
          </Card>
        )}
        {error && (
          <Card className="mt-4 p-4 text-sm text-red-600 border-red-300">{error}</Card>
        )}
        <Card className="mt-6 p-5">
          <h3 className="font-semibold mb-2">What you can do</h3>
          <ul className="text-sm text-[hsl(var(--color-muted-foreground))] space-y-1 list-disc pl-5">
            <li>Click any existing text to select it, then edit or replace it</li>
            <li>Add text with fonts, sizes, colors — including Chinese, Japanese and Korean</li>
            <li>Add images, links, shapes, check marks and signatures</li>
            <li>Highlight, strike out, underline and whiteout areas</li>
            <li>Fill form fields, rotate or delete pages</li>
          </ul>
          <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-3">
            Everything runs locally in your browser. Your file is never uploaded.
          </p>
        </Card>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Editor
  // ------------------------------------------------------------------

  return (
    <div className={`w-full ${className ?? ''}`}>
      {/* ===== Top toolbar (Sejda-style horizontal groups) ===== */}
      <div className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-[hsl(var(--color-background))]/95 backdrop-blur border-b border-[hsl(var(--color-border))]">
        {/* Object format bar — docked above the Text button (Acrobat panel style) */}
        {selected && (
          <div className="flex items-center gap-0.5 flex-wrap rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] shadow-sm px-1 py-1 mb-1">
            <div
data-floating
className="flex items-center gap-0.5 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] shadow-sm px-1 py-1 flex-wrap"
onPointerDown={(e) => e.stopPropagation()}
  >
{selected.kind === 'text' && (
  <>
    <StyleToggle active={(selected as TextObject).bold} onClick={() => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as TextObject), bold: !(selected as TextObject).bold } : o)))} disabled={false} label="B" title={s.bold} />
    <StyleToggle active={(selected as TextObject).italic} onClick={() => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as TextObject), italic: !(selected as TextObject).italic } : o)))} disabled={false} label="I" title={s.italic} />
    <StyleToggle
      active={Boolean((selected as TextObject).underline)}
      onClick={() => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as TextObject), underline: !(selected as TextObject).underline } : o)))}
      disabled={false}
      label="U"
      title={s.toolUnderline}
    />
    <StyleToggle
      active={(selected as TextObject).script === 'super'}
      onClick={() => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as TextObject), script: (selected as TextObject).script === 'super' ? 'normal' : 'super' } : o)))}
      disabled={false}
      label="x²"
      title="Superscript"
    />
    <StyleToggle
      active={(selected as TextObject).script === 'sub'}
      onClick={() => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as TextObject), script: (selected as TextObject).script === 'sub' ? 'normal' : 'sub' } : o)))}
      disabled={false}
      label="x₂"
      title="Subscript"
    />
    <select
      className="h-7 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1 text-xs"
      value={Math.round((selected as TextObject).fontSize)}
      onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as TextObject), fontSize: Number(e.target.value) || 14 } : o)))}
    >
      {sizeOptionsWith((selected as TextObject).fontSize).map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
    <select
      className="h-7 max-w-24 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1 text-xs"
      value={(selected as TextObject).fontId}
      onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as TextObject), fontId: e.target.value as FontId } : o)))}
    >
      {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
    </select>
    <div className="flex items-center gap-0.5">
      {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([al, Icon]) => (
        <button
          key={al}
          type="button"
          title={`Align ${al}`}
          onClick={() => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as TextObject), align: al } : o)))}
          className={`h-7 w-7 flex items-center justify-center rounded-md border ${((selected as TextObject).align ?? 'left') === al ? 'bg-[hsl(var(--color-primary))] text-white border-transparent' : 'border-[hsl(var(--color-border))]'}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
    <select
      className="h-7 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1 text-xs"
      value={String((selected as TextObject).lineHeightRatio ?? 1.25)}
      onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as TextObject), lineHeightRatio: Number(e.target.value) || 1.25 } : o)))}
      title="Line spacing"
    >
      {[1, 1.15, 1.25, 1.5, 2].map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  </>
)}
{'stroke' in selected && (
  <>
    <input
      type="color"
      className="h-7 w-7 rounded-md border border-[hsl(var(--color-border))]"
      value={selected.stroke}
      onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...selected, stroke: e.target.value } : o)))}
      title={s.color}
    />
    {(selected.kind === 'rect' || selected.kind === 'ellipse') && (
      <select
        className="h-7 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1 text-xs"
        value={(selected as ShapeObject).fill}
        onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as ShapeObject), fill: e.target.value } : o)))}
        title="Fill"
      >
        <option value="none">none</option>
        <option value="#fde047">yellow</option>
        <option value="#93c5fd">blue</option>
        <option value="#86efac">green</option>
        <option value="#fca5a5">red</option>
        <option value="#111111">black</option>
      </select>
    )}
  </>
)}
{selected.kind === 'highlight' && (
  <input
    type="color"
    className="h-7 w-7 rounded-md border border-[hsl(var(--color-border))]"
    value={selected.color}
    onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...selected, color: e.target.value } : o)))}
    title={s.color}
  />
)}
{selected.kind === 'link' && (
  <>
    <select
      className="h-7 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1 text-xs"
      value={selected.linkType}
      onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...selected, linkType: e.target.value as 'url' | 'email' | 'phone' | 'page' } : o)))}
    >
      <option value="url">{s.linkUrl}</option>
      <option value="email">{s.linkEmail}</option>
      <option value="phone">{s.linkPhone}</option>
      <option value="page">{s.linkPage}</option>
    </select>
    {selected.linkType === 'page' ? (
      <select
        className="h-7 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1 text-xs"
        value={selected.value || '1'}
        onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...selected, value: e.target.value } : o)))}
      >
        {pageSizes.map((_, i) => <option key={i} value={String(i + 1)}>{i + 1}</option>)}
      </select>
    ) : (
      <input
        type="text"
        className="h-7 w-36 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1.5 text-xs"
        placeholder={s.linkPlaceholder}
        value={selected.value}
        onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...selected, value: e.target.value } : o)))}
      />
    )}
  </>
)}
{selected.kind === 'stamp' && (
  <input
    type="text"
    className="h-7 w-28 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1.5 text-xs"
    value={(selected as StampObject).text}
    onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...(selected as StampObject), text: e.target.value } : o)))}
    title={s.stampText}
  />
)}
{editingId === selected.id && (
  <Button variant="primary" size="sm" className="h-7 px-2 text-xs" onClick={commitTextEdit}>
    <Check className="h-3.5 w-3.5 mr-0.5" />{s.signClear === '清除' ? '完成' : 'Done'}
  </Button>
)}
<Button
  variant={moveMode ? 'primary' : 'ghost'}
  size="sm"
  className="h-7 w-7 p-0"
  title={s.toolSelect + ' · ' + s.hintMove}
  onClick={() => setMoveMode((v) => !v)}
>
  <Move className="h-3.5 w-3.5" />
</Button>
<Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={s.duplicate} onClick={duplicateSelected}>
  <Copy className="h-3.5 w-3.5" />
</Button>
<Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={s.deleteObject} onClick={() => { commit(objects.filter((o) => o.id !== selected.id)); setSelectedId(null); }}>
  <Trash2 className="h-3.5 w-3.5" />
</Button>
  </div>
          </div>
        )}

        <div className="flex items-center gap-1 flex-wrap rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] px-2 py-1.5 shadow-sm">
          {/* Text — direct button, single click = edit existing / add new */}
          <button
            type="button"
            onClick={() => setTool('text')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${activeTool === 'text' ? 'bg-[hsl(var(--color-primary))] text-white' : 'hover:bg-[hsl(var(--color-muted))]'}`}
          >
            <Type className="h-4 w-4" /> {s.toolText}
          </button>

          {menuDefs.map((m) => (
            <div key={m.id} className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${m.active ? 'bg-[hsl(var(--color-primary))] text-white' : 'hover:bg-[hsl(var(--color-muted))]'}`}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
                {(m.items.length > 0 || m.id === 'images' || m.id === 'sign') && <ChevronDown className="h-3 w-3 opacity-70" />}
              </button>

              {/* Dropdown panels */}
              {openMenu === m.id && m.id === 'annotate' && (
                <div className="absolute left-0 top-full mt-1 z-40 w-52 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] shadow-lg p-1.5">
                  {m.items.map((it) => (
                    <div key={it.tool} className="flex items-center gap-1">
                      <div className="flex-1 min-w-0">
                        <MenuItem icon={it.icon} label={it.label} onClick={() => { setTool(it.tool); setOpenMenu(null); }} active={activeTool === it.tool} />
                      </div>
                      {(m.colors ?? []).map((c) => (
                        <button
                          key={c}
                          type="button"
                          title={c}
                          onClick={() => { setStyleColor(c); setTool(it.tool); setOpenMenu(null); }}
                          className="h-3.5 w-3.5 rounded-full border border-[hsl(var(--color-border))] shrink-0"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {openMenu === m.id && m.id === 'shapes' && (
                <div className="absolute left-0 top-full mt-1 z-40 w-44 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] shadow-lg p-1.5">
                  {m.items.map((it) => (
                    <MenuItem key={it.tool} icon={it.icon} label={it.label} onClick={() => { setTool(it.tool); setOpenMenu(null); }} active={activeTool === it.tool} />
                  ))}
                </div>
              )}
              {openMenu === m.id && m.id === 'images' && (
                <div className="absolute left-0 top-full mt-1 z-40 w-56 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] shadow-lg p-2.5 space-y-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="w-full text-xs"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImagePicked(f); setOpenMenu(null); }}
                  />
                  {pendingImage && (
                    <div className="rounded-md border border-[hsl(var(--color-border))] p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={pendingImage} alt="" className="max-h-14 mx-auto" />
                      <p className="text-[10px] text-center text-[hsl(var(--color-muted-foreground))] mt-1">{s.hintImage}</p>
                    </div>
                  )}
                </div>
              )}
              {openMenu === m.id && m.id === 'sign' && (
                <div className="absolute left-0 top-full mt-1 z-40 w-72 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] shadow-lg p-2.5 space-y-2">
                  <div className="flex gap-1">
                    {(['type', 'draw', 'upload'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSignMode(mode)}
                        className={`flex-1 rounded-md border px-1 py-1 text-xs ${signMode === mode ? 'bg-[hsl(var(--color-primary))] text-white border-transparent' : 'border-[hsl(var(--color-border))]'}`}
                      >
                        {mode === 'type' ? s.signType : mode === 'draw' ? s.signDraw : s.signUpload}
                      </button>
                    ))}
                  </div>
                  {signMode === 'type' && (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        className="flex-1 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                        placeholder={s.signName}
                        value={signName}
                        onChange={(e) => setSignName(e.target.value)}
                      />
                      <Button variant="secondary" size="sm" onClick={() => void saveTypeSignature()} disabled={!signName.trim()}>{s.signType}</Button>
                    </div>
                  )}
                  {signMode === 'draw' && (
                    <div className="space-y-1.5">
                      <canvas
                        ref={drawCanvasRef}
                        width={360}
                        height={120}
                        className="w-full rounded-md border border-[hsl(var(--color-border))] bg-white touch-none"
                        onPointerDown={onDrawPadPointerDown}
                        onPointerMove={onDrawPadPointerMove}
                      />
                      <div className="flex gap-1">
                        <Button variant="secondary" size="sm" className="flex-1" onClick={clearDrawPad}>{s.signClear}</Button>
                        <Button variant="primary" size="sm" className="flex-1" onClick={saveDrawSignature}>OK</Button>
                      </div>
                    </div>
                  )}
                  {signMode === 'upload' && (
                    <input type="file" accept="image/png,image/jpeg" className="w-full text-xs" onChange={onSignFilePicked} />
                  )}
                  <button
                    type="button"
                    onClick={() => { setTool('stamp'); setOpenMenu(null); }}
                    className={`w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs ${activeTool === 'stamp' ? 'bg-[hsl(var(--color-primary))] text-white' : 'hover:bg-[hsl(var(--color-muted))]'}`}
                  >
                    <Stamp className="h-3.5 w-3.5" /> {s.toolStamp}
                  </button>
                  {pendingSign && (
                    <div className="rounded-md border border-[hsl(var(--color-border))] p-1.5 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={pendingSign} alt="" className="max-h-12 mx-auto" />
                      <p className="text-[10px] text-center text-[hsl(var(--color-muted-foreground))] mt-1">{s.hintSign}</p>
                    </div>
                  )}
                </div>
              )}
              {openMenu === m.id && m.id === 'forms' && (
                <div className="absolute left-0 top-full mt-1 z-40 w-52 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] shadow-lg p-1.5">
                  <p className="px-2 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-[hsl(var(--color-muted-foreground))]">Symbols</p>
                  {m.items.map((it) => (
                    <MenuItem key={it.tool} icon={it.icon} label={it.label} onClick={() => { setTool(it.tool); setOpenMenu(null); }} active={activeTool === it.tool} />
                  ))}
                  <p className="px-2 pt-1.5 pb-0.5 text-[10px] uppercase tracking-wide text-[hsl(var(--color-muted-foreground))]">{s.formAddFields}</p>
                  {([
                    ['text', s.formTextField], ['textarea', s.formTextarea], ['dropdown', s.formDropdown],
                    ['radio', s.formRadio], ['checkbox', s.formCheckbox], ['signature', s.formSignatureBox],
                  ] as const).map(([ft, label]) => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => { setFormFieldType(ft); setTool('formfield'); setOpenMenu(null); }}
                      className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left ${activeTool === 'formfield' && formFieldType === ft ? 'bg-[hsl(var(--color-primary))] text-white' : 'hover:bg-[hsl(var(--color-muted))]'}`}
                    >
                      <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                  {formFields.length > 0 && (
                    <div className="border-t border-[hsl(var(--color-border))] mt-1 pt-1.5 max-h-52 overflow-y-auto">
                      <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-[hsl(var(--color-muted-foreground))]">{s.formsFill}</p>
                      {formFields.map((f) => (
                        <div key={f.name} className="px-2 py-1 space-y-0.5">
                          <label className="block text-[10px] text-[hsl(var(--color-muted-foreground))] truncate" title={f.name}>{f.name}</label>
                          {f.type === 'checkbox' ? (
                            <input
                              type="checkbox"
                              checked={Boolean(formValues[f.name])}
                              onChange={(e) => setFormValues((prev) => ({ ...prev, [f.name]: e.target.checked }))}
                            />
                          ) : f.type === 'dropdown' || f.type === 'radio' || f.type === 'optionlist' ? (
                            <select
                              className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1.5 py-1 text-xs"
                              value={String(formValues[f.name] ?? '')}
                              onChange={(e) => setFormValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                            >
                              <option value="">—</option>
                              {(f.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1.5 py-1 text-xs"
                              value={String(formValues[f.name] ?? '')}
                              onChange={(e) => setFormValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Whiteout — direct button like Sejda */}
          <button
            type="button"
            onClick={() => setTool('whiteout')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${activeTool === 'whiteout' ? 'bg-[hsl(var(--color-primary))] text-white' : 'hover:bg-[hsl(var(--color-muted))]'}`}
          >
            <Eraser className="h-4 w-4" /> {s.toolWhiteout}
          </button>

          <div className="w-px h-6 bg-[hsl(var(--color-border))] mx-1" />
          <Button variant={activeTool === 'find' ? 'primary' : 'ghost'} size="sm" onClick={() => setTool('find')} title={s.toolFind}><Search className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={undo} disabled={undoStackRef.current.length === 0} title={s.undo}><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={redoStackRef.current.length === 0} title={s.redo}><Redo2 className="h-4 w-4" /></Button>

          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))} title={s.zoomOut}><ZoomOut className="h-4 w-4" /></Button>
            <span className="text-xs w-11 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))} title={s.zoomIn}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={reset} title={s.reset}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="mt-1 h-5 flex items-center px-1">
          <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{hint}</p>
          {message && <p className="ml-3 text-xs font-medium text-[hsl(var(--color-primary))]">{message}</p>}
        </div>
        {/* Find & Replace panel (the toolbar Find button is dead without it) */}
        {activeTool === 'find' && (
          <div className="mt-1 flex items-center gap-2 flex-wrap rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] px-2 py-1.5">
            <input
              type="text"
              className="w-44 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
              placeholder={s.findPlaceholder}
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
            />
            <input
              type="text"
              className="w-44 rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
              placeholder={s.replacePlaceholder}
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
            />
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} />
              {s.matchCase}
            </label>
            <Button variant="primary" size="sm" onClick={() => void replaceAll()} disabled={!findText || finding}>
              {finding ? '…' : s.replaceAll}
            </Button>
            <p className="text-[10px] text-[hsl(var(--color-muted-foreground))]">{s.replaceInlineOnly}</p>
          </div>
        )}
      </div>

      {applying && (
        <div className="h-1.5 w-full bg-[hsl(var(--color-muted))] rounded-full overflow-hidden mt-2">
          <div className="h-full bg-[hsl(var(--color-primary))] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-sm text-red-700">{error}</div>
      )}

      {/* ===== Pages ===== */}
      <div ref={scrollRef} className="mt-3 overflow-auto rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-muted))] p-4 pb-24 max-h-[72vh]">
        {pageSizes.map((ps, idx) => {
          const op = pageOps[idx];
          if (op?.deleted) {
            return (
              <div key={`del-${idx}`} className="mx-auto mb-4 max-w-md rounded-lg border border-dashed border-[hsl(var(--color-border))] p-3 text-center text-sm text-[hsl(var(--color-muted-foreground))]">
                {s.pageDelete} · {s.pageLabel} {idx + 1}
              </div>
            );
          }
          const rot = ((initialRots[idx] + (op?.rotationDelta ?? 0)) % 360 + 360) % 360;
          const rotated = rot === 90 || rot === 270;
          const dispW = (rotated ? ps.h : ps.w) * zoom;
          const dispH = (rotated ? ps.w : ps.h) * zoom;
          return (
            <div key={idx} className="mx-auto mb-8" style={{ width: dispW }}>
              {/* Page tool row */}
              <div className="flex items-center justify-center gap-1 mb-2 text-xs text-[hsl(var(--color-muted-foreground))]">
                <span className="font-medium">{idx + 1}</span>
                <Button variant="ghost" size="sm" disabled={selectedPageHasObjects(idx)} title={selectedPageHasObjects(idx) ? s.pageLocked : s.pageDelete} onClick={() => deletePage(idx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" disabled={selectedPageHasObjects(idx)} title={selectedPageHasObjects(idx) ? s.pageLocked : s.pageRotateLeft} onClick={() => rotatePage(idx, -90)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" disabled={selectedPageHasObjects(idx)} title={selectedPageHasObjects(idx) ? s.pageLocked : s.pageRotateRight} onClick={() => rotatePage(idx, 90)}>
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                {idx === pageSizes.length - 1 && (
                  <Button variant="ghost" size="sm" title={s.addBlankPage} onClick={addBlankPage}>
                    <Copy className="h-3.5 w-3.5 rotate-90" />
                  </Button>
                )}
                <span className="ml-1">{s.pageOf} {pageSizes.length}</span>
              </div>

              <PageCanvas
                pdfDoc={pdfDocRef.current}
                pageIndex={idx}
                zoom={zoom}
                rotation={rot}
                dispW={dispW}
                dispH={dispH}
                originalPageCount={originalPageCount}
                registerRef={(el) => { pageRefs.current[idx] = el; }}
                onLinesReady={handleLinesReady}
              />

              {/* Overlay */}
              <div
                className={`relative ${activeTool === 'text' && hoverKey ? 'cursor-text' : activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
                style={{ width: dispW, height: dispH, marginTop: -dispH, touchAction: 'none' }}
                onPointerDown={(e) => onOverlayPointerDown(idx, e)}
                onPointerMove={(e) => onOverlayPointerMove(idx, e)}
                onPointerUp={onOverlayPointerUp}
                onDoubleClick={(e) => {
                  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
                  const liAttr = el?.closest?.('[data-li]')?.getAttribute('data-li');
                  if (liAttr !== null && liAttr !== undefined && liAttr !== '-1') {
                    const lines = textLinesRef.current.get(idx);
                    const hit = lines?.[Number(liAttr)] ?? null;
                    if (hit) {
                      const blk = blocksByPage.get(idx)?.find((b) => b.lines.some((l) => l === hit)) ??
                        ({ ...hit, lineHeightRatio: 1.25 } as unknown as TextBlock);
                      startBlockEdit(blk);
                    }
                  }
                }}
              >
                {/* Persistent block selection (single click) */}
                {activeTool === 'text' && selectedBlock?.pageIndex === idx && (() => {
                  const b = selectedBlock;
                  return (
                    <div className="absolute border-2 border-blue-600 bg-blue-500/10 pointer-events-none rounded-sm"
                      style={{ left: b.x * zoom, top: b.yTop * zoom, width: b.width * zoom, height: b.height * zoom }} />
                  );
                })()}

                {/* Hover highlight (Text tool) */}
                {activeTool === 'text' && hoverBlockRef.current?.pageIndex === idx && (() => {
                  const b = hoverBlockRef.current;
                  return (
                    <div className="absolute bg-blue-500/15 border-2 border-dashed border-blue-500 pointer-events-none rounded-sm"
                      style={{ left: b.x * zoom, top: b.yTop * zoom, width: b.width * zoom, height: b.height * zoom }} />
                  );
                })()}

                {objects.filter((o) => o.pageIndex === idx).map((o) => (
                  <ObjectView
                    key={o.id}
                    obj={o}
                    zoom={zoom}
                    s={s}
                    selected={o.id === selectedId}
                    editing={o.id === editingId}
                    activeTool={activeTool}
                    onPointerDown={(e, handle) => onObjectPointerDown(o, e, handle)}
                    onPointerMove={onObjectPointerMove}
                    onPointerUp={onObjectPointerUp}
                    onStartEdit={() => setEditingId(o.id)}
                  />
                ))}

                {/* Live textarea for the text object being edited (blur-inert:
                    Enter or the Done button commits; clicking the style bar
                    keeps the editor open) */}
                {editingId && selected && selected.kind === 'text' && selected.pageIndex === idx && (() => {
                  const t = selected as TextObject;
                  const family = t.fontId === 'times' ? '"Times New Roman", serif'
                    : t.fontId === 'courier' ? '"Courier New", monospace'
                      : t.fontId === 'system-cjk' ? '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Malgun Gothic", "Yu Gothic", sans-serif'
                        : 'Helvetica, Arial, sans-serif';
                  return (
                    <textarea
                      autoFocus
                      data-e2e="editing"
                      data-floating
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute bg-white/85 border-2 border-blue-500 rounded-sm px-0.5 resize-none overflow-hidden z-10"
                      style={{ left: t.x * zoom, top: t.yTop * zoom, width: Math.max(t.width, 60) * zoom, height: Math.max(t.fontSize * (t.lineHeightRatio ?? 1.25) * draftText.split('\n').length + 14, 30), fontSize: t.fontSize * zoom, fontFamily: family, fontWeight: t.bold ? 700 : 400, fontStyle: t.italic ? 'italic' : 'normal', color: t.color, lineHeight: t.lineHeightRatio ?? 1.25 }}
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          commitTextEdit();
                        }
                        if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                    />
                  );
                })()}

                {/* Sticky note editor popover */}
                {selected && selected.kind === 'note' && selected.pageIndex === idx && (() => {
                  const n = selected as NoteObject;
                  return (
                    <div
                      data-floating
                      className="absolute z-30 w-64 rounded-lg border border-amber-300 bg-amber-50 shadow-lg p-2.5"
                      style={{ left: Math.min(n.x * zoom + 28, dispW - 260), top: n.yTop * zoom }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-amber-800">{n.author} · {new Date(n.createdAt).toLocaleDateString()}</span>
                        <button
                          type="button"
                          className="text-amber-700 hover:text-amber-900"
                          title={s.deleteObject}
                          onClick={() => { commit(objects.filter((o) => o.id !== n.id)); setSelectedId(null); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <textarea
                        autoFocus
                        className="w-full h-20 rounded-md border border-amber-300 bg-white px-2 py-1.5 text-sm resize-none"
                        placeholder={s.hintNote}
                        value={n.text}
                        onChange={(e) => updateObject(n.id, { text: e.target.value } as Partial<NoteObject>)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setSelectedId(null);
                        }}
                      />
                      <div className="mt-1.5 text-right">
                        <Button variant="primary" size="sm" className="h-7 px-2 text-xs" onClick={() => { commit(objects.map((o) => o.id === n.id ? { ...n } : o)); setSelectedId(null); }}>
                          {s.done}
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {draftRect?.pageIndex === idx && (
                  <div className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none"
                    style={{ left: draftRect.x * zoom, top: draftRect.yTop * zoom, width: draftRect.w * zoom, height: draftRect.h * zoom }} />
                )}
                {draftLine?.pageIndex === idx && (
                  <svg className="absolute inset-0 pointer-events-none" width={dispW} height={dispH}>
                    <line x1={draftLine.x1 * zoom} y1={draftLine.yTop1 * zoom} x2={draftLine.x2 * zoom} y2={draftLine.yTop2 * zoom} stroke={styleStroke} strokeWidth={styleStrokeWidth} />
                  </svg>
                )}
                {draftPoints?.pageIndex === idx && (
                  <svg className="absolute inset-0 pointer-events-none" width={dispW} height={dispH}>
                    <polyline
                      points={draftPoints.pts.map((p) => `${p.x * zoom},${p.yTop * zoom}`).join(' ')}
                      fill="none" stroke={styleStroke} strokeWidth={styleStrokeWidth} strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                )}


              </div>
            </div>
          );
        })}
      </div>

      {/* Whiteout honesty note */}
      {activeTool === 'whiteout' && (
        <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
          {s.whiteoutWarning}
        </div>
      )}

      <p className="mt-2 text-[10px] text-[hsl(var(--color-muted-foreground))]">
        {EDITOR_MAX_FILE_BYTES / (1024 * 1024)} MB max · runs 100% in your browser
      </p>

      {/* ===== Form field property dialog ===== */}
      <Modal isOpen={pendingField !== null} onClose={() => setPendingField(null)} title={s.formAddFields}>
        {pendingField && (
          <div className="p-5 space-y-3 w-80">
            <h3 className="font-semibold">{s.formAddFields}</h3>
            <label className="block text-xs">
              {s.formFieldName}
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1.5 text-sm"
                value={pendingField.name}
                onChange={(e) => setPendingField({ ...pendingField, name: e.target.value })}
              />
            </label>
            {(pendingField.fieldType === 'text' || pendingField.fieldType === 'textarea' || pendingField.fieldType === 'dropdown') && (
              <label className="block text-xs">
                {s.formDefaultValue}
                {pendingField.fieldType === 'textarea' ? (
                  <textarea
                    className="mt-1 w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1.5 text-sm h-20"
                    value={pendingField.value ?? ''}
                    onChange={(e) => setPendingField({ ...pendingField, value: e.target.value })}
                  />
                ) : (
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1.5 text-sm"
                    value={pendingField.value ?? ''}
                    onChange={(e) => setPendingField({ ...pendingField, value: e.target.value })}
                  />
                )}
              </label>
            )}
            {(pendingField.fieldType === 'dropdown' || pendingField.fieldType === 'radio') && (
              <label className="block text-xs">
                {s.formOptions}
                <textarea
                  className="mt-1 w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1.5 text-sm h-20"
                  value={fieldOptions}
                  onChange={(e) => setFieldOptions(e.target.value)}
                />
              </label>
            )}
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(pendingField.required)}
                onChange={(e) => setPendingField({ ...pendingField, required: e.target.checked })}
              />
              {s.formRequired}
            </label>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPendingField(null)}>Cancel</Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={confirmField}>{s.done}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Floating Apply button (bottom center) ===== */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
        {resultBlob ? (
          <DownloadButton file={resultBlob} filename={resultName} label="Download" />
        ) : (
          <Button variant="primary" onClick={() => void applyChanges()} disabled={applying || objects.length === 0} className="shadow-lg">
            {applying ? `${s.applying} ${progress}%` : s.apply}
          </Button>
        )}
      </div>
    </div>
  );
}

const SIZE_STEPS = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72];
/** Font-size options with the current value merged in, so a line whose
 *  original size is not on the steps still displays its true size. */
function sizeOptionsWith(current: number): number[] {
  return [...new Set([...SIZE_STEPS, Math.round(current)])].sort((a, b) => a - b);
}

/** Identity compare for block selection (same page + same origin). */
function sameBlock(a: TextBlock, b: TextBlock): boolean {
  return a.pageIndex === b.pageIndex && Math.abs(a.x - b.x) < 1 && Math.abs(a.yTop - b.yTop) < 1;
}

function MenuItem({ icon: Icon, label, onClick, active }: { icon: any; label: string; onClick: () => void; active: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left ${active ? 'bg-[hsl(var(--color-primary))] text-white' : 'hover:bg-[hsl(var(--color-muted))]'}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function StyleToggle({ active, onClick, disabled, label, title }: { active: boolean; onClick: () => void; disabled: boolean; label: string; title: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`h-7 min-w-7 rounded-md border px-1.5 text-xs font-semibold ${active ? 'bg-[hsl(var(--color-primary))] text-white border-transparent' : 'border-[hsl(var(--color-border))]'}`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// PageCanvas — lazy pdf.js render at device-pixel precision
// ---------------------------------------------------------------------------

function PageCanvas(props: {
  pdfDoc: any;
  pageIndex: number;
  zoom: number;
  rotation: number;
  dispW: number;
  dispH: number;
  originalPageCount: number;
  registerRef: (el: HTMLDivElement | null) => void;
  onLinesReady?: (pageIndex: number, lines: TextLine[]) => void;
}) {
  const { pdfDoc, pageIndex, zoom, rotation, dispW, dispH, originalPageCount, registerRef, onLinesReady } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(pageIndex < 2);
  const renderedRef = useRef('');

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    if (!pdfDoc) return;
    const key = `${pageIndex}|${zoom.toFixed(3)}|${rotation}`;
    if (renderedRef.current === key) return;
    renderedRef.current = key;
    let cancelled = false;
    void (async () => {
      try {
        if (pageIndex + 1 > originalPageCount) {
          // blank virtual page — no pdf.js backing
          const canvas = canvasRef.current;
          if (!canvas || cancelled) return;
          canvas.width = Math.floor(dispW * Math.min(window.devicePixelRatio || 1, 2));
          canvas.height = Math.floor(dispH * Math.min(window.devicePixelRatio || 1, 2));
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
          return;
        }
        const page = await pdfDoc.getPage(pageIndex + 1);
        const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
        const viewport = page.getViewport({ scale: zoom * dpr, rotation });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
        // Browser-laid-out text layer: spans are pixel-aligned with the
        // canvas, so line boxes derived from their DOM rects can never
        // drift the way transform-based estimates do.
        const layerDiv = textLayerRef.current;
        console.warn('[tl-debug] stage0 layerDiv=', !!layerDiv, 'onLinesReady=', !!onLinesReady);
        if (layerDiv && onLinesReady) {
          try {
            layerDiv.innerHTML = '';
            layerDiv.style.setProperty('--scale-factor', String(zoom));
            const pdfjsMod = await import('pdfjs-dist');
            console.warn('[tl-debug] stage1 mod=', typeof pdfjsMod.TextLayer);
            const tl = new pdfjsMod.TextLayer({
              textContentSource: page.streamTextContent(),
              container: layerDiv,
              viewport: page.getViewport({ scale: zoom, rotation }),
            });
            console.warn('[tl-debug] stage2 constructed');
            await tl.render();
            console.warn('[tl-debug] stage3 rendered spans=', layerDiv.querySelectorAll('span').length);
            const spans = [...layerDiv.querySelectorAll('span')].map((sp) => {
              const r = sp.getBoundingClientRect();
              const w0 = wrapRef.current?.getBoundingClientRect();
              // pdf.js sets font-size as calc(var(--scale-factor)*<N>px) where
              // <N> is the size in PDF points — parse it straight out.
              const fsCalc = /calc\([^)]*?([0-9.]+)px\)/.exec(sp.style.fontSize || '');
              const fontSizePt = fsCalc ? parseFloat(fsCalc[1]) : r.height / zoom;
              return {
                text: sp.textContent || '',
                leftPx: r.left - (w0?.left ?? 0),
                topPx: r.top - (w0?.top ?? 0),
                widthPx: r.width,
                heightPx: r.height,
                fontSizePt,
              } as SpanInfo;
            });
            const { lines, spanLineIndex } = buildLinesFromSpans(spans, pageIndex, zoom);
            if (lines.length > 0) {
              const domSpans = [...layerDiv.querySelectorAll('span')];
              let ui = 0;
              for (const sp of domSpans) {
                const txt = sp.textContent || '';
                if (!txt.trim()) { sp.dataset.li = '-1'; continue; }
                sp.dataset.li = String(spanLineIndex[ui] ?? 0);
                ui += 1;
              }
              onLinesReady(pageIndex, lines);
            }
          } catch {
            // text layer is an enhancement; canvas editing still works
          }
        }
      } catch {
        // render failures leave the previous frame in place
      }
    })();
    return () => { cancelled = true; };
  }, [visible, pdfDoc, pageIndex, zoom, rotation, originalPageCount, dispW, dispH, onLinesReady]);

  return (
    <div ref={(el) => { wrapRef.current = el; registerRef(el); }} style={{ width: dispW, height: dispH }} className="relative bg-white shadow-md rounded-sm overflow-hidden">
      <canvas ref={canvasRef} style={{ width: dispW, height: dispH, display: 'block' }} />
      <div
        ref={textLayerRef}
        className="pdfjs-textlayer absolute inset-0"
        style={{ '--scale-factor': zoom } as React.CSSProperties}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ObjectView — DOM representation of one edit object
// ---------------------------------------------------------------------------

function ObjectView(props: {
  obj: EditObject;
  zoom: number;
  s: ReturnType<typeof getEditorStrings>;
  selected: boolean;
  editing: boolean;
  activeTool: ToolId;
  onPointerDown: (e: React.PointerEvent, handle?: 'se') => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onStartEdit: () => void;
}) {
  const { obj, zoom, s, selected, editing, activeTool, onPointerDown, onPointerMove, onPointerUp, onStartEdit } = props;
  const interactive = activeTool === 'select';
  const base: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: interactive ? 'auto' : 'none',
    touchAction: 'none',
  };
  const ring = selected ? ' outline outline-2 outline-blue-500 outline-offset-1' : '';
  const commonHandlers = {
    onPointerDown: (e: React.PointerEvent) => onPointerDown(e),
    onPointerMove,
    onPointerUp,
  };

  switch (obj.kind) {
    case 'text': {
      const family = obj.fontId === 'times' ? '"Times New Roman", serif'
        : obj.fontId === 'courier' ? '"Courier New", monospace'
          : obj.fontId === 'system-cjk' ? '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Malgun Gothic", "Yu Gothic", sans-serif'
            : 'Helvetica, Arial, sans-serif';
      if (editing) {
        // The main component renders the live textarea on top of this
        // placeholder (controlled draft — blur-inert by design).
        return (
          <div
            data-oid={obj.id}
            className="absolute border-2 border-blue-500 bg-white/40 rounded-sm"
            style={{ left: obj.x * zoom, top: obj.yTop * zoom, width: Math.max(obj.width, 60) * zoom, height: Math.max(obj.fontSize * 1.4 * zoom, 28), pointerEvents: 'none' }}
          />
        );
      }
      return (
        <div
          data-oid={obj.id}
          className={`absolute whitespace-pre-wrap break-words cursor-move select-none${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: Math.max(obj.width, 20) * zoom, fontSize: (obj.script === 'normal' || !obj.script ? obj.fontSize : obj.fontSize * 0.65) * zoom, fontFamily: family, fontWeight: obj.bold ? 700 : 400, fontStyle: obj.italic ? 'italic' : 'normal', color: obj.color, lineHeight: String(obj.lineHeightRatio ?? 1.25), textAlign: obj.align ?? 'left', textDecoration: obj.underline ? 'underline' : undefined, transform: obj.script === 'super' ? 'translateY(-12%)' : obj.script === 'sub' ? 'translateY(8%)' : undefined, minHeight: obj.fontSize * (obj.lineHeightRatio ?? 1.25) * zoom }}
          {...commonHandlers}
          onDoubleClick={onStartEdit}
        >
          {obj.text || ' '}
          {selected && (
            <span
              data-handle="se"
              className="absolute -right-1.5 -bottom-1.5 h-3 w-3 rounded-sm bg-blue-500 border border-white cursor-se-resize"
              onPointerDown={(e) => onPointerDown(e, 'se')}
            />
          )}
        </div>
      );
    }
    case 'whiteout':
      return (
        <div
          data-oid={obj.id}
          className={`absolute bg-white cursor-move${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: obj.width * zoom, height: obj.height * zoom, border: selected ? undefined : '1px dashed #d4d4d8' }}
          {...commonHandlers}
        >
          {selected && <HandleSE onPointerDown={onPointerDown} />}
        </div>
      );
    case 'highlight':
      return (
        <div
          data-oid={obj.id}
          className={`absolute cursor-move${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: obj.width * zoom, height: obj.height * zoom, background: obj.color, opacity: 0.35, borderRadius: 2 }}
          {...commonHandlers}
        >
          {selected && <HandleSE onPointerDown={onPointerDown} />}
        </div>
      );
    case 'strikeout':
    case 'underline':
      return (
        <div
          data-oid={obj.id}
          className={`absolute cursor-move${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: obj.width * zoom, height: Math.max(obj.height * zoom, 2) }}
          {...commonHandlers}
        >
          <div style={{ width: '100%', height: Math.max(1.5, obj.height * zoom * 0.6), background: obj.color, marginTop: obj.kind === 'strikeout' ? '50%' : 0, transform: obj.kind === 'strikeout' ? 'translateY(-50%)' : undefined }} />
          {selected && <HandleSE onPointerDown={onPointerDown} />}
        </div>
      );
    case 'image':
      return (
        <div
          data-oid={obj.id}
          className={`absolute cursor-move${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: obj.width * zoom, height: obj.height * zoom }}
          {...commonHandlers}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={obj.src} alt="" draggable={false} style={{ width: '100%', height: '100%' }} />
          {selected && <HandleSE onPointerDown={onPointerDown} />}
        </div>
      );
    case 'link':
      return (
        <div
          data-oid={obj.id}
          className={`absolute bg-blue-500/10 border border-blue-400/60 cursor-move${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: obj.width * zoom, height: obj.height * zoom }}
          {...commonHandlers}
        >
          <span className="absolute -top-4 left-0 text-[9px] bg-blue-500 text-white px-1 rounded">{s.toolLink}</span>
          {selected && <HandleSE onPointerDown={onPointerDown} />}
        </div>
      );
    case 'rect':
    case 'ellipse': {
      const style: React.CSSProperties = {
        ...base,
        left: obj.x * zoom,
        top: obj.yTop * zoom,
        width: obj.width * zoom,
        height: obj.height * zoom,
        border: `${obj.strokeWidth * zoom}px solid ${obj.stroke}`,
        borderRadius: obj.kind === 'ellipse' ? '50%' : 2,
        background: obj.fill !== 'none' ? obj.fill : 'transparent',
        cursor: 'move',
      };
      return (
        <div data-oid={obj.id} className={ring} style={style} {...commonHandlers}>
          {selected && <HandleSE onPointerDown={onPointerDown} />}
        </div>
      );
    }
    case 'line':
    case 'arrow': {
      const x1 = obj.x1 * zoom;
      const y1 = obj.yTop1 * zoom;
      const x2 = obj.x2 * zoom;
      const y2 = obj.yTop2 * zoom;
      return (
        <svg
          data-oid={obj.id}
          className="absolute inset-0 overflow-visible"
          style={{ ...base, left: 0, top: 0, pointerEvents: 'none' }}
          width="100%"
          height="100%"
        >
          <line
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth * zoom}
            strokeLinecap="round"
            style={{ pointerEvents: interactive ? 'stroke' : 'none', cursor: 'move' }}
            {...commonHandlers}
          />
        </svg>
      );
    }
    case 'freehand': {
      const pts = obj.points;
      if (pts.length === 0) return null;
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.yTop);
      const minX = Math.min(...xs) - obj.strokeWidth;
      const minY = Math.min(...ys) - obj.strokeWidth;
      return (
        <svg
          data-oid={obj.id}
          className={`absolute cursor-move${ring}`}
          style={{ ...base, left: minX * zoom, top: minY * zoom }}
          width={(Math.max(...xs) - minX + obj.strokeWidth) * zoom}
          height={(Math.max(...ys) - minY + obj.strokeWidth) * zoom}
        >
          <polyline
            points={pts.map((p) => `${(p.x - minX) * zoom},${(p.yTop - minY) * zoom}`).join(' ')}
            fill="none"
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth * zoom}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    case 'check':
    case 'cross': {
      const size = obj.size * zoom;
      return (
        <svg
          data-oid={obj.id}
          className={`absolute cursor-move${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom }}
          width={size}
          height={size}
        >
          {obj.kind === 'check' ? (
            <polyline
              points={`${size * 0.1},${size * 0.55} ${size * 0.38},${size * 0.85} ${size * 0.92},${size * 0.12}`}
              fill="none" stroke={obj.color} strokeWidth={size * 0.14} strokeLinecap="round" strokeLinejoin="round"
            />
          ) : (
            <>
              <line x1={2} y1={2} x2={size - 2} y2={size - 2} stroke={obj.color} strokeWidth={size * 0.14} strokeLinecap="round" />
              <line x1={2} y1={size - 2} x2={size - 2} y2={2} stroke={obj.color} strokeWidth={size * 0.14} strokeLinecap="round" />
            </>
          )}
        </svg>
      );
    }
    case 'dot':
      return (
        <div
          data-oid={obj.id}
          className={`absolute rounded-full cursor-move${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: obj.size * zoom, height: obj.size * zoom, background: obj.color }}
          {...commonHandlers}
        />
      );
    case 'stamp':
      return (
        <div
          data-oid={obj.id}
          className={`absolute px-2 py-1 cursor-move select-none${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, border: `${Math.max(1.5, 1.5 * zoom)}px solid ${obj.color}`, color: obj.color, fontSize: obj.fontSize * zoom, fontWeight: 700, borderRadius: 4, lineHeight: 1.3 }}
          {...commonHandlers}
        >
          {obj.text}
          {obj.includeDate && (
            <span className="block font-normal" style={{ fontSize: obj.fontSize * 0.72 * zoom }}>
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
          {selected && <HandleSE onPointerDown={onPointerDown} />}
        </div>
      );
    case 'note': {
      const size = 24 * zoom;
      return (
        <div
          data-oid={obj.id}
          className={`absolute cursor-move${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: size, height: size }}
          {...commonHandlers}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <svg width={size} height={size} viewBox="0 0 24 24">
            <path
              d="M4 4h16v12H8l-4 4z"
              fill={obj.text.trim() ? '#f59e0b' : '#e5e7eb'}
              stroke="#92400e"
              strokeWidth={1.5}
            />
            <path d="M8 8h8M8 11h6" stroke="#92400e" strokeWidth={1.2} />
          </svg>
          {selected && <HandleSE onPointerDown={onPointerDown} />}
        </div>
      );
    }
    case 'formfield': {
      const label = { text: s.formTextField, textarea: s.formTextarea, dropdown: s.formDropdown, radio: s.formRadio, checkbox: s.formCheckbox, signature: s.formSignatureBox }[obj.fieldType];
      return (
        <div
          data-oid={obj.id}
          className={`absolute border-2 border-dashed border-violet-500 bg-violet-500/5 cursor-move flex items-center px-1.5 gap-1${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: obj.width * zoom, height: obj.height * zoom }}
          {...commonHandlers}
        >
          <ClipboardList className="h-3 w-3 text-violet-600 shrink-0" />
          <span className="text-[10px] text-violet-700 truncate">{obj.name || label}</span>
          {selected && <HandleSE onPointerDown={onPointerDown} />}
        </div>
      );
    }
    default:
      return null;
  }
}

function HandleSE({ onPointerDown }: { onPointerDown: (e: React.PointerEvent, handle: 'se') => void }) {
  return (
    <span
      data-handle="se"
      className="absolute -right-1.5 -bottom-1.5 h-3 w-3 rounded-sm bg-blue-500 border border-white cursor-se-resize"
      onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, 'se'); }}
    />
  );
}

export default EditPDFTool;
