'use client';

/**
 * Edit PDF tool — a fully client-side PDF editor.
 *
 * Architecture: pdf.js renders each page onto a canvas; a DOM overlay on
 * top holds the edit objects (text, images, shapes, whiteout, marks,
 * links, symbols, stamps, signatures). "Apply changes" runs the pdf-lib
 * export pipeline in editor-core.ts which draws the objects onto the
 * original (vector) document. Nothing ever leaves the browser.
 *
 * UI strings come from ./strings.ts (9 locales) — deliberately outside
 * messages/*.json so the shared locale files stay untouched.
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
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import FileUploader from '@/components/tools/FileUploader';
import DownloadButton from '@/components/tools/DownloadButton';
import { loadPdfjs } from '@/lib/pdf/loader';
import { getEditorStrings } from './strings';
import {
  EDITOR_MAX_FILE_BYTES,
  FONT_OPTIONS,
  fontSupportsStyle,
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
  type FormFieldValue,
  type FormValues,
  type LineObject,
  type PageOp,
  type ShapeObject,
  type StampObject,
  type TextLine,
  type TextObject,
} from './editor-core';

/* eslint-disable @typescript-eslint/no-explicit-any */

type ToolId =
  | 'select' | 'text' | 'image' | 'link' | 'whiteout'
  | 'highlight' | 'strikeout' | 'underline' | 'draw'
  | 'rect' | 'ellipse' | 'line' | 'arrow'
  | 'check' | 'cross' | 'dot' | 'sign' | 'stamp' | 'find';

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

export function EditPDFTool({ className }: EditPDFToolProps) {
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
  const [historyTick, setHistoryTick] = useState(0); // re-render undo/redo buttons

  // UI state
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [fitZoom, setFitZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
  const [stampDate, setStampDate] = useState(true);

  // Link draft (edited in the side panel after drawing)
  const [linkType, setLinkType] = useState<'url' | 'email' | 'phone' | 'page'>('url');
  const [linkValue, setLinkValue] = useState('');

  // Find & replace
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [finding, setFinding] = useState(false);
  const textLinesRef = useRef<Map<number, TextLine[]>>(new Map());

  // Text editing
  const [editingId, setEditingId] = useState<string | null>(null);

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
  const drawDirtyRef = useRef(false);

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
    setResultBlob(null); // further edits invalidate the previous export
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

  // ------------------------------------------------------------------
  // File loading
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
      setFile(f);
      setObjects([]);
      setPageOps({});
      setFormFields([]);
      setFormValues({});
      undoStackRef.current = [];
      redoStackRef.current = [];
      setResultBlob(null);
      setSelectedId(null);
      setActiveTool('select');
      textLinesRef.current = new Map();
      void extractForms(buf);
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el && sizes[0]) {
          const fit = Math.min(1.4, Math.max(MIN_ZOOM, (el.clientWidth - 48) / sizes[0].w));
          setFitZoom(fit);
          setZoom(fit);
        }
      });
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
  // Coordinate helpers (visual space == PDF pt space for unlocked pages)
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

  const updateObject = useCallback((id: string, patch: Partial<EditObject>) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? ({ ...o, ...patch } as EditObject) : o)));
  }, []);

  // ------------------------------------------------------------------
  // Text lines (existing text) — lazy per page
  // ------------------------------------------------------------------

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
  // Object creation helpers
  // ------------------------------------------------------------------

  const addTextAt = useCallback(async (pageIndex: number, vx: number, vy: number) => {
    if (pageLocked(pageIndex)) { flash(s.scanWarning); return; }
    const lines = await getLines(pageIndex);
    const hit = findLineAt(lines, pageIndex, vx, vy);
    const obj: TextObject = hit
      ? {
          id: nextObjectId(), kind: 'text', pageIndex,
          x: hit.x, yTop: hit.yTop, width: hit.width,
          text: hit.str, fontSize: hit.fontSize, color: '#111111',
          bold: false, italic: false, fontId: 'helvetica',
        }
      : {
          id: nextObjectId(), kind: 'text', pageIndex,
          x: vx, yTop: vy, width: 200, text: '', fontSize: styleSize,
          color: styleColor, bold: styleBold, italic: styleItalic, fontId: styleFont,
        };
    const next: EditObject[] = hit
      ? [
          ...objects.map((o) => o),
          { id: nextObjectId(), kind: 'whiteout', pageIndex, x: hit!.x, yTop: hit!.yTop, width: hit!.width, height: hit!.height * 1.3 },
          obj,
        ]
      : [...objects, obj];
    commit(next);
    setSelectedId(obj.id);
    setEditingId(obj.id);
    setActiveTool('select');
  }, [commit, flash, getLines, objects, pageLocked, s.scanWarning, styleBold, styleColor, styleFont, styleItalic, styleSize]);

  const placeAsset = useCallback((pageIndex: number, vx: number, vy: number) => {
    if (pageLocked(pageIndex)) { flash(s.scanWarning); return; }
    let next = objects;
    let newId = '';
    if (activeTool === 'image' && pendingImage) {
      newId = nextObjectId();
      // default placement: 40% of page width, aspect kept (height fixed by estimate)
      const w = Math.min(220, pageSizes[pageIndex].w * 0.4);
      next = [...objects, { id: newId, kind: 'image', pageIndex, x: vx, yTop: vy, width: w, height: w * 0.66, src: pendingImage }];
      setPendingImage(null);
    } else if (activeTool === 'sign' && pendingSign) {
      newId = nextObjectId();
      const w = 160;
      next = [...objects, { id: newId, kind: 'image', pageIndex, x: vx, yTop: vy, width: w, height: w * 0.4, src: pendingSign }];
      setPendingSign(null);
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
    if (activeTool === 'image' || activeTool === 'sign') setActiveTool('select');
  }, [activeTool, commit, flash, objects, pageLocked, pageSizes, pendingImage, pendingSign, s.scanWarning, stampDate, stampText, styleColor, styleStroke]);

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
    if (activeTool === 'link') setActiveTool('select');
  }, [activeTool, commit, flash, objects, pageLocked, s.scanWarning, styleFill, styleStroke, styleStrokeWidth]);

  const finishLineDrag = useCallback((pageIndex: number, x1: number, y1: number, x2: number, y2: number) => {
    if (pageLocked(pageIndex)) { flash(s.scanWarning); return; }
    if (Math.abs(x2 - x1) + Math.abs(y2 - y1) < 3) return;
    const obj: LineObject = { id: nextObjectId(), kind: activeTool === 'arrow' ? 'arrow' : 'line', pageIndex, x1, yTop1: y1, x2, yTop2: y2, stroke: styleStroke, strokeWidth: styleStrokeWidth };
    commit([...objects, obj]);
    setSelectedId(obj.id);
  }, [activeTool, commit, flash, objects, pageLocked, s.scanWarning, styleStroke, styleStrokeWidth]);

  // ------------------------------------------------------------------
  // Pointer handlers on page overlays
  // ------------------------------------------------------------------

  const onOverlayPointerDown = useCallback((pageIndex: number, e: React.PointerEvent) => {
    if (applying) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-oid]')) return; // objects handle their own events
    const pt = toViewPt(pageIndex, e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (activeTool === 'select') {
      setSelectedId(null);
      setEditingId(null);
      return;
    }
    if (activeTool === 'text') {
      void addTextAt(pageIndex, pt.x, pt.y);
      return;
    }
    if (activeTool === 'image' || activeTool === 'sign' || activeTool === 'check' || activeTool === 'cross' || activeTool === 'dot' || activeTool === 'stamp') {
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
    // rect-family tools
    dragRef.current = { mode: 'draw-rect', pageIndex, startVx: pt.x, startVy: pt.y };
    setDraftRect({ pageIndex, x: pt.x, yTop: pt.y, w: 0, h: 0 });
  }, [activeTool, addTextAt, applying, placeAsset, toViewPt]);

  const onOverlayPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const pt = toViewPt(drag.pageIndex, e.clientX, e.clientY);
    if (drag.mode === 'freehand') {
      setDraftPoints((prev) => (prev ? { ...prev, pts: [...prev.pts, { x: pt.x, yTop: pt.y }] } : prev));
    } else if (drag.mode === 'draw-line') {
      setDraftLine({ pageIndex: drag.pageIndex, x1: drag.startVx, yTop1: drag.startVy, x2: pt.x, yTop2: pt.y });
    } else if (drag.mode === 'draw-rect') {
      setDraftRect({ pageIndex: drag.pageIndex, x: Math.min(drag.startVx, pt.x), yTop: Math.min(drag.startVy, pt.y), w: Math.abs(pt.x - drag.startVx), h: Math.abs(pt.y - drag.startVy) });
    }
  }, [toViewPt]);

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

  // Object move/resize via pointer events on object elements
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
      switch (o.kind) {
        case 'text': updateObject(o.id, { x: o.x + dx, yTop: o.yTop + dy } as Partial<TextObject>); break;
        case 'whiteout': case 'highlight': case 'strikeout': case 'underline': case 'link':
          updateObject(o.id, { x: o.x + dx, yTop: o.yTop + dy }); break;
        case 'image': updateObject(o.id, { x: o.x + dx, yTop: o.yTop + dy }); break;
        case 'rect': case 'ellipse': updateObject(o.id, { x: o.x + dx, yTop: o.yTop + dy }); break;
        case 'check': case 'cross': case 'dot': updateObject(o.id, { x: o.x + dx, yTop: o.yTop + dy }); break;
        case 'stamp': updateObject(o.id, { x: o.x + dx, yTop: o.yTop + dy }); break;
        default: break;
      }
    } else if (drag.mode === 'resize') {
      switch (o.kind) {
        case 'text': updateObject(o.id, { width: Math.max(30, (o as TextObject).width + dx), fontSize: Math.max(6, (o as TextObject).fontSize + dy * 0.2) } as Partial<TextObject>); break;
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
        if (selectedId) {
          e.preventDefault();
          commit(objects.filter((o) => o.id !== selectedId));
          setSelectedId(null);
        }
      } else if (e.key === 'Escape') {
        setActiveTool('select');
        setEditingId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit, objects, redo, selectedId, undo]);

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
  // Image upload for pending placement
  // ------------------------------------------------------------------

  const onImagePicked = useCallback(async (f: File) => {
    try {
      const url = await fileToDataUrl(f);
      await estimateImageSize(url);
      setPendingImage(url);
      setError(null);
    } catch {
      setError(s.errorImage);
    }
  }, [s.errorImage]);

  // ------------------------------------------------------------------
  // Signature drawing pad
  // ------------------------------------------------------------------

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
    drawDirtyRef.current = true;
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
    if (url) setPendingSign(url);
  }, []);

  const saveTypeSignature = useCallback(async () => {
    if (!signName.trim()) return;
    const url = await typeSignatureToDataUrl(signName.trim(), '"Segoe Script", "Brush Script MT", "Comic Sans MS", cursive');
    if (url) setPendingSign(url);
  }, [signName]);

  const onSignFilePicked = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setPendingSign(await fileToDataUrl(f));
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
  // Render helpers
  // ------------------------------------------------------------------

  const tools: Array<{ id: ToolId; icon: any; label: string; group: number }> = [
    { id: 'select', icon: MousePointer2, label: s.toolSelect, group: 0 },
    { id: 'text', icon: Type, label: s.toolText, group: 0 },
    { id: 'image', icon: ImageIcon, label: s.toolImage, group: 0 },
    { id: 'link', icon: Link2, label: s.toolLink, group: 0 },
    { id: 'sign', icon: PenTool, label: s.toolSign, group: 0 },
    { id: 'whiteout', icon: Eraser, label: s.toolWhiteout, group: 1 },
    { id: 'highlight', icon: Highlighter, label: s.toolHighlight, group: 1 },
    { id: 'strikeout', icon: Strikethrough, label: s.toolStrikeout, group: 1 },
    { id: 'underline', icon: UnderlineIcon, label: s.toolUnderline, group: 1 },
    { id: 'draw', icon: Pencil, label: s.toolDraw, group: 1 },
    { id: 'rect', icon: Square, label: s.toolRectangle, group: 2 },
    { id: 'ellipse', icon: Circle, label: s.toolEllipse, group: 2 },
    { id: 'line', icon: Minus, label: s.toolLine, group: 2 },
    { id: 'arrow', icon: MoveUpRight, label: s.toolArrow, group: 2 },
    { id: 'check', icon: Check, label: s.toolCheck, group: 3 },
    { id: 'cross', icon: X, label: s.toolCross, group: 3 },
    { id: 'dot', icon: Dot, label: s.toolDot, group: 3 },
    { id: 'stamp', icon: Stamp, label: s.toolStamp, group: 3 },
    { id: 'find', icon: Search, label: s.toolFind, group: 4 },
  ];

  const hint = (() => {
    switch (activeTool) {
      case 'select': return s.hintSelect;
      case 'text': return `${s.hintText} ${s.hintTextExisting}`;
      case 'image': return s.hintImage;
      case 'link': return s.hintLink;
      case 'whiteout': return s.hintWhiteout;
      case 'highlight': case 'strikeout': case 'underline': return s.hintAnnotate;
      case 'draw': return s.hintDraw;
      case 'rect': case 'ellipse': case 'line': case 'arrow': return s.hintShape;
      case 'check': case 'cross': case 'dot': case 'stamp': return s.hintSymbol;
      case 'sign': return s.hintSign;
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
            <li>Add text with fonts, sizes, colors — including Chinese, Japanese and Korean</li>
            <li>Click existing text to replace it; find and replace across the document</li>
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
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm font-medium truncate max-w-[200px]" title={file.name}>{file.name}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))} title={s.zoomOut}><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))} title={s.zoomIn}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom(fitZoom)} title="Fit"><Square className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={undo} disabled={undoStackRef.current.length === 0} title={s.undo}><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={redoStackRef.current.length === 0} title={s.redo}><Redo2 className="h-4 w-4" /></Button>
        </div>
        {selectedId && (
          <Button variant="ghost" size="sm" onClick={() => { commit(objects.filter((o) => o.id !== selectedId)); setSelectedId(null); }} title={s.deleteObject}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={reset} title={s.reset}><RefreshCw className="h-4 w-4" /><span className="ml-1 hidden sm:inline">{s.reset}</span></Button>
        {resultBlob ? (
          <DownloadButton file={resultBlob} filename={resultName} label={s.apply.replace(/&.*/, '').trim() || 'Download'} />
        ) : (
          <Button variant="primary" size="sm" onClick={() => void applyChanges()} disabled={applying || objects.length === 0}>
            {applying ? s.applying : s.apply}
          </Button>
        )}
      </div>

      {applying && (
        <div className="h-1.5 w-full bg-[hsl(var(--color-muted))] rounded-full overflow-hidden mb-2">
          <div className="h-full bg-[hsl(var(--color-primary))] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {message && (
        <div className="mb-2 rounded-lg bg-[hsl(var(--color-muted))] px-3 py-1.5 text-sm">{message}</div>
      )}
      {error && (
        <div className="mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-2">
        {/* Tool rail */}
        <div className="flex flex-col gap-1 p-1 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] self-start sticky top-20 max-h-[70vh] overflow-y-auto">
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setActiveTool(t.id); if (t.id !== 'select') { setSelectedId(null); setEditingId(null); } }}
              title={t.label}
              className={`p-2 rounded-lg transition-colors ${activeTool === t.id ? 'bg-[hsl(var(--color-primary))] text-white' : 'hover:bg-[hsl(var(--color-muted))]'}`}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* Pages */}
        <div ref={scrollRef} className="flex-1 overflow-auto rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-muted))] p-4 max-h-[76vh]">
          {pageSizes.map((ps, idx) => {
            const op = pageOps[idx];
            if (op?.deleted) {
              return (
                <div key={`del-${idx}`} className="mx-auto mb-4 max-w-md rounded-lg border border-dashed border-[hsl(var(--color-border))] p-3 text-center text-sm text-[hsl(var(--color-muted-foreground))]">
                  {s.pageDelete} · Page {idx + 1}
                </div>
              );
            }
            const rot = ((initialRots[idx] + (op?.rotationDelta ?? 0)) % 360 + 360) % 360;
            const rotated = rot === 90 || rot === 270;
            const dispW = (rotated ? ps.h : ps.w) * zoom;
            const dispH = (rotated ? ps.w : ps.h) * zoom;
            return (
              <div key={idx} className="mx-auto mb-6" style={{ width: dispW }}>
                <PageCanvas
                  pdfDoc={pdfDocRef.current}
                  pageIndex={idx}
                  zoom={zoom}
                  rotation={rot}
                  dispW={dispW}
                  dispH={dispH}
                  registerRef={(el) => { pageRefs.current[idx] = el; }}
                />
                {/* Overlay */}
                <div
                  className={`relative bg-transparent ${activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
                  style={{ width: dispW, height: dispH, marginTop: -dispH, touchAction: 'none' }}
                  onPointerDown={(e) => onOverlayPointerDown(idx, e)}
                  onPointerMove={onOverlayPointerMove}
                  onPointerUp={onOverlayPointerUp}
                >
                  {objects.filter((o) => o.pageIndex === idx).map((o) => (
                    <ObjectView
                      key={o.id}
                      obj={o}
                      zoom={zoom}
                      s={s}
                      selected={o.id === selectedId}
                      editing={o.id === editingId}
                      activeTool={activeTool}
                      onSelect={() => { if (activeTool === 'select') setSelectedId(o.id); }}
                      onPointerDown={(e, handle) => onObjectPointerDown(o, e, handle)}
                      onPointerMove={onObjectPointerMove}
                      onPointerUp={onObjectPointerUp}
                      onCommitText={(text) => {
                        if (!text.trim()) {
                          // new empty text dropped; also drop paired whiteout? keep simple: remove text only
                          commit(objects.filter((x) => x.id !== o.id));
                        } else {
                          commit(objects.map((x) => (x.id === o.id ? { ...(x as TextObject), text } : x)));
                        }
                        setEditingId(null);
                      }}
                      onStartEdit={() => setEditingId(o.id)}
                    />
                  ))}
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
                {/* Page footer controls */}
                <div className="flex items-center justify-center gap-2 mt-1 text-xs text-[hsl(var(--color-muted-foreground))]">
                  <span>{s.pageLabel} {idx + 1} {s.pageOf} {pageSizes.length}</span>
                  <Button variant="ghost" size="sm" disabled={selectedPageHasObjects(idx)} title={selectedPageHasObjects(idx) ? s.pageLocked : s.pageRotateLeft} onClick={() => rotatePage(idx, -90)}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled={selectedPageHasObjects(idx)} title={selectedPageHasObjects(idx) ? s.pageLocked : s.pageRotateRight} onClick={() => rotatePage(idx, 90)}>
                    <RotateCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled={selectedPageHasObjects(idx) || pageSizes.length <= 1} title={selectedPageHasObjects(idx) ? s.pageLocked : s.pageDelete} onClick={() => deletePage(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Side panel */}
        <div className="w-60 shrink-0 self-start sticky top-20 max-h-[76vh] overflow-y-auto flex flex-col gap-3">
          {/* Tool hint */}
          <Card className="p-3">
            <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{hint}</p>
          </Card>

          {/* Text defaults / selected text */}
          {(activeTool === 'text' || selected?.kind === 'text') && (
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">{s.toolText}</p>
              <label className="block text-xs">{s.font}
                <select
                  className="mt-1 w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                  value={selected?.kind === 'text' ? selected.fontId : styleFont}
                  onChange={(e) => {
                    const v = e.target.value as FontId;
                    if (selected?.kind === 'text') { commit(objects.map((o) => (o.id === selected.id ? { ...selected, fontId: v } : o))); }
                    else setStyleFont(v);
                  }}
                >
                  {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </label>
              <div className="flex gap-2">
                <label className="block text-xs flex-1">{s.fontSize}
                  <input
                    type="number" min={6} max={96}
                    className="mt-1 w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                    value={selected?.kind === 'text' ? Math.round(selected.fontSize) : styleSize}
                    onChange={(e) => {
                      const v = Math.max(6, Math.min(96, Number(e.target.value) || 14));
                      if (selected?.kind === 'text') { commit(objects.map((o) => (o.id === selected.id ? { ...selected, fontSize: v } : o))); }
                      else setStyleSize(v);
                    }}
                  />
                </label>
                <label className="block text-xs w-20">{s.color}
                  <input
                    type="color"
                    className="mt-1 w-full h-7 rounded-md border border-[hsl(var(--color-border))]"
                    value={selected?.kind === 'text' ? selected.color : styleColor}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (selected?.kind === 'text') { commit(objects.map((o) => (o.id === selected.id ? { ...selected, color: v } : o))); }
                      else setStyleColor(v);
                    }}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                {(['bold', 'italic'] as const).map((k) => {
                  const effFont = selected?.kind === 'text' ? selected.fontId : styleFont;
                  const active = selected?.kind === 'text' ? selected[k] : k === 'bold' ? styleBold : styleItalic;
                  return (
                    <button
                      key={k}
                      type="button"
                      disabled={!fontSupportsStyle(effFont)}
                      title={fontSupportsStyle(effFont) ? (k === 'bold' ? s.bold : s.italic) : 'Noto fonts ship regular weight only'}
                      onClick={() => {
                        if (selected?.kind === 'text') commit(objects.map((o) => (o.id === selected.id ? ({ ...selected, [k]: !selected[k] } as TextObject) : o)));
                        else if (k === 'bold') setStyleBold((v) => !v);
                        else setStyleItalic((v) => !v);
                      }}
                      className={`flex-1 rounded-md border px-2 py-1 text-xs ${active ? 'bg-[hsl(var(--color-primary))] text-white border-transparent' : 'border-[hsl(var(--color-border))]'}`}
                    >
                      {k === 'bold' ? 'B' : 'I'}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Shape style */}
          {(selected?.kind === 'rect' || selected?.kind === 'ellipse' || selected?.kind === 'line' || selected?.kind === 'arrow' || selected?.kind === 'freehand' || ['rect', 'ellipse', 'line', 'arrow'].includes(activeTool)) && (
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">{s.toolRectangle}/{s.toolEllipse}/{s.toolLine}</p>
              <div className="flex gap-2">
                <label className="block text-xs flex-1">{s.color}
                  <input
                    type="color"
                    className="mt-1 w-full h-7 rounded-md border border-[hsl(var(--color-border))]"
                    value={selected && 'stroke' in selected ? selected.stroke : styleStroke}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (selected && 'stroke' in selected) commit(objects.map((o) => (o.id === selected.id ? { ...selected, stroke: v } : o)));
                      else setStyleStroke(v);
                    }}
                  />
                </label>
                {(!selected || selected.kind === 'rect' || selected.kind === 'ellipse') && (
                  <label className="block text-xs flex-1">Fill
                    <select
                      className="mt-1 w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-1 py-1 text-xs"
                      value={selected?.kind === 'rect' || selected?.kind === 'ellipse' ? selected.fill : styleFill}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (selected && (selected.kind === 'rect' || selected.kind === 'ellipse')) commit(objects.map((o) => (o.id === selected.id ? { ...selected, fill: v } : o)));
                        else setStyleFill(v);
                      }}
                    >
                      <option value="none">none</option>
                      <option value="#fde047">yellow</option>
                      <option value="#93c5fd">blue</option>
                      <option value="#86efac">green</option>
                      <option value="#fca5a5">red</option>
                      <option value="#111111">black</option>
                    </select>
                  </label>
                )}
              </div>
              <label className="block text-xs">Width
                <input
                  type="number" min={1} max={20}
                  className="mt-1 w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                  value={selected && 'strokeWidth' in selected ? selected.strokeWidth : styleStrokeWidth}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(20, Number(e.target.value) || 2));
                    if (selected && 'strokeWidth' in selected) commit(objects.map((o) => (o.id === selected.id ? { ...selected, strokeWidth: v } : o)));
                    else setStyleStrokeWidth(v);
                  }}
                />
              </label>
            </Card>
          )}

          {/* Link target */}
          {selected?.kind === 'link' && (
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">{s.toolLink}</p>
              <select
                className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                value={selected.linkType}
                onChange={(e) => {
                  const v = e.target.value as 'url' | 'email' | 'phone' | 'page';
                  commit(objects.map((o) => (o.id === selected.id ? { ...selected, linkType: v } : o)));
                  setLinkType(v);
                }}
              >
                <option value="url">{s.linkUrl}</option>
                <option value="email">{s.linkEmail}</option>
                <option value="phone">{s.linkPhone}</option>
                <option value="page">{s.linkPage}</option>
              </select>
              {selected.linkType === 'page' ? (
                <select
                  className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                  value={selected.value || '1'}
                  onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...selected, value: e.target.value } : o)))}
                >
                  {pageSizes.map((_, i) => <option key={i} value={String(i + 1)}>{i + 1}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                  placeholder={linkType === 'url' ? s.linkPlaceholder : linkType === 'email' ? 'name@example.com' : '+1 234 567 890'}
                  value={selected.value}
                  onChange={(e) => commit(objects.map((o) => (o.id === selected.id ? { ...selected, value: e.target.value } : o)))}
                />
              )}
            </Card>
          )}

          {/* Stamp props */}
          {(activeTool === 'stamp' || selected?.kind === 'stamp') && (
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">{s.toolStamp}</p>
              <input
                type="text"
                className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                value={selected?.kind === 'stamp' ? selected.text : stampText}
                onChange={(e) => {
                  const v = e.target.value;
                  if (selected?.kind === 'stamp') commit(objects.map((o) => (o.id === selected.id ? { ...selected, text: v } : o)));
                  else setStampText(v);
                }}
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selected?.kind === 'stamp' ? selected.includeDate : stampDate}
                  onChange={(e) => {
                    const v = e.target.checked;
                    if (selected?.kind === 'stamp') commit(objects.map((o) => (o.id === selected.id ? { ...selected, includeDate: v } : o)));
                    else setStampDate(v);
                  }}
                />
                {s.stampDate}
              </label>
            </Card>
          )}

          {/* Image picker */}
          {activeTool === 'image' && (
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">{s.toolImage}</p>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="w-full text-xs"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImagePicked(f); }}
              />
              {pendingImage && (
                <div className="rounded-md border border-[hsl(var(--color-border))] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pendingImage} alt="pending" className="max-h-20 mx-auto" />
                  <p className="text-[10px] text-center text-[hsl(var(--color-muted-foreground))] mt-1">{s.hintImage}</p>
                </div>
              )}
            </Card>
          )}

          {/* Signature panel */}
          {activeTool === 'sign' && (
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">{s.toolSign}</p>
              <div className="flex gap-1">
                {(['type', 'draw', 'upload'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setSignMode(m); setPendingSign(null); }}
                    className={`flex-1 rounded-md border px-1 py-1 text-xs ${signMode === m ? 'bg-[hsl(var(--color-primary))] text-white border-transparent' : 'border-[hsl(var(--color-border))]'}`}
                  >
                    {m === 'type' ? s.signType : m === 'draw' ? s.signDraw : s.signUpload}
                  </button>
                ))}
              </div>
              {signMode === 'type' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                    placeholder={s.signName}
                    value={signName}
                    onChange={(e) => setSignName(e.target.value)}
                  />
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => void saveTypeSignature()} disabled={!signName.trim()}>
                    {s.signType}
                  </Button>
                </div>
              )}
              {signMode === 'draw' && (
                <div className="space-y-2">
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
              {pendingSign && (
                <div className="rounded-md border border-[hsl(var(--color-border))] p-2 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pendingSign} alt="signature" className="max-h-16 mx-auto" />
                  <p className="text-[10px] text-center text-[hsl(var(--color-muted-foreground))] mt-1">{s.hintSign}</p>
                </div>
              )}
            </Card>
          )}

          {/* Find & replace */}
          {activeTool === 'find' && (
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">{s.toolFind}</p>
              <input
                type="text"
                className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                placeholder={s.findPlaceholder}
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
              />
              <input
                type="text"
                className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                placeholder={s.replacePlaceholder}
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} />
                {s.matchCase}
              </label>
              <Button variant="primary" size="sm" className="w-full" onClick={() => void replaceAll()} disabled={!findText || finding}>
                {finding ? '…' : s.replaceAll}
              </Button>
              <p className="text-[10px] text-[hsl(var(--color-muted-foreground))]">{s.replaceInlineOnly}</p>
            </Card>
          )}

          {/* Form fields */}
          {formFields.length > 0 && (
            <Card className="p-3 space-y-2">
              <p className="text-xs font-semibold">{s.formsFill}</p>
              {formFields.map((f) => (
                <div key={f.name} className="space-y-1">
                  <label className="block text-[10px] text-[hsl(var(--color-muted-foreground))] truncate" title={f.name}>{f.name}</label>
                  {f.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={Boolean(formValues[f.name])}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [f.name]: e.target.checked }))}
                    />
                  ) : f.type === 'dropdown' || f.type === 'radio' || f.type === 'optionlist' ? (
                    <select
                      className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                      value={String(formValues[f.name] ?? '')}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    >
                      <option value="">—</option>
                      {(f.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-2 py-1 text-xs"
                      value={String(formValues[f.name] ?? '')}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* Whiteout honesty note */}
          {(activeTool === 'whiteout' || selected?.kind === 'whiteout') && (
            <Card className="p-3">
              <p className="text-[10px] text-amber-700">{s.whiteoutWarning}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Editor size guard */}
      <p className="mt-2 text-[10px] text-[hsl(var(--color-muted-foreground))]">
        {EDITOR_MAX_FILE_BYTES / (1024 * 1024)} MB max · runs 100% in your browser
      </p>
    </div>
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
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  const { pdfDoc, pageIndex, zoom, rotation, dispW, dispH, registerRef } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
    if (!visible || !pdfDoc) return;
    const key = `${pageIndex}|${zoom.toFixed(3)}|${rotation}`;
    if (renderedRef.current === key) return;
    renderedRef.current = key;
    let cancelled = false;
    void (async () => {
      try {
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
      } catch {
        // render failures leave the previous frame in place
      }
    })();
    return () => { cancelled = true; };
  }, [visible, pdfDoc, pageIndex, zoom, rotation]);

  return (
    <div ref={(el) => { wrapRef.current = el; registerRef(el); }} style={{ width: dispW, height: dispH }} className="relative bg-white shadow-md rounded-sm overflow-hidden">
      <canvas ref={canvasRef} style={{ width: dispW, height: dispH, display: 'block' }} />
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
  onSelect: () => void;
  onPointerDown: (e: React.PointerEvent, handle?: 'se') => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onCommitText: (text: string) => void;
  onStartEdit: () => void;
}) {
  const { obj, zoom, s, selected, editing, activeTool, onSelect, onPointerDown, onPointerMove, onPointerUp, onCommitText, onStartEdit } = props;
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
        return (
          <textarea
            autoFocus
            data-oid={obj.id}
            className="absolute bg-white/90 border-2 border-blue-500 rounded-sm px-0.5 resize-none overflow-hidden"
            style={{ left: obj.x * zoom, top: obj.yTop * zoom, width: Math.max(obj.width, 60) * zoom, height: Math.max(obj.fontSize * 1.4 * zoom, 28), fontSize: obj.fontSize * zoom, fontFamily: family, fontWeight: obj.bold ? 700 : 400, fontStyle: obj.italic ? 'italic' : 'normal', color: obj.color, lineHeight: 1.25 }}
            defaultValue={obj.text}
            onBlur={(e) => onCommitText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
              }
              if (e.key === 'Escape') onCommitText(obj.text);
            }}
          />
        );
      }
      return (
        <div
          data-oid={obj.id}
          className={`absolute whitespace-pre-wrap break-words cursor-move select-none${ring}`}
          style={{ ...base, left: obj.x * zoom, top: obj.yTop * zoom, width: Math.max(obj.width, 20) * zoom, fontSize: obj.fontSize * zoom, fontFamily: family, fontWeight: obj.bold ? 700 : 400, fontStyle: obj.italic ? 'italic' : 'normal', color: obj.color, lineHeight: 1.25, minHeight: obj.fontSize * 1.25 * zoom }}
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
          {obj.kind === 'arrow' && interactive && (
            <circle cx={x2} cy={y2} r={6} fill="transparent" style={{ pointerEvents: 'all' }} {...commonHandlers} />
          )}
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
