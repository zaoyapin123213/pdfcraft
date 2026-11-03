'use client';

/**
 * Translate PDF Tool — original client-side implementation.
 *
 * Pipeline: pdf.js text extraction (blocks with bboxes) → online translation
 * API (browser-direct) → canvas composition (original page raster + translated
 * text overlay) → image-based PDF via pdf-lib. Two outputs: translated-only
 * and interleaved bilingual PDF.
 *
 * Privacy: the PDF file never leaves the browser; extracted TEXT is sent to
 * the translation service (disclosed in the UI).
 */

import React, { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Phase = 'idle' | 'loading' | 'translating' | 'composing' | 'done' | 'error';

interface TextBlock {
  page: number;
  x: number; y: number; w: number; h: number; // PDF user-space coords (origin bottom-left)
  text: string;
  fontSize: number;
  translated?: string;
}

interface Lang { code: string; label: string; }

const SOURCE_LANGS: Lang[] = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
];

const TARGET_LANGS: Lang[] = SOURCE_LANGS.filter(l => l.code !== 'auto');

const MAX_PAGES = 50;
const RENDER_SCALE = 2;
const CHUNK_LIMIT = 1200;

function configureWorker(pdfjsLib: unknown) {
  const lib = pdfjsLib as { GlobalWorkerOptions: { workerSrc: string } };
  lib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
}

async function translateChunk(
  text: string,
  sl: string,
  tl: string,
  signal?: AbortSignal,
): Promise<string> {
  // Same-origin Pages Function proxy (/functions/api/translate.ts): direct
  // browser calls to translate.googleapis.com fail for visitors behind
  // networks that block Google (e.g. mainland China); the proxy runs on
  // Cloudflare's edge where Google is reachable.
  const url =
    '/api/translate?client=gtx&dt=t' +
    `&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(text)}`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('bad payload');
      return (data[0] as unknown[])
        .map(seg => (Array.isArray(seg) ? String(seg[0] ?? '') : ''))
        .join('');
    } catch (e) {
      lastErr = e;
      if (signal?.aborted) throw e;
      await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('translation failed');
}

/** Group pdf.js text items into reading-order blocks. Order-independent:
 *  pass 1 clusters fragments into lines by baseline (global match), pass 2
 *  merges consecutive lines into paragraph blocks (top tracked explicitly). */
function buildBlocks(
  items: Array<{ str: string; transform: number[]; width: number; height: number; hasEOL?: boolean }>,
  pageHeight: number,
): TextBlock[] {
  type Line = { x0: number; x1: number; y: number; size: number; text: string };
  const frags: Line[] = [];
  for (const it of items) {
    const str = it.str;
    if (!str || !str.trim()) continue;
    frags.push({
      x0: it.transform[4],
      x1: it.transform[4] + (it.width || str.length * 5),
      y: it.transform[5],
      size: Math.hypot(it.transform[2], it.transform[3]) || it.height || 10,
      text: str,
    });
  }
  // pass 1: baseline clustering
  frags.sort((a, b) => b.y - a.y || a.x0 - b.x0);
  const lines: Line[] = [];
  for (const f of frags) {
    const line = lines.find(
      l =>
        Math.abs(l.y - f.y) <= Math.max(l.size, f.size) * 0.6 &&
        f.x0 <= l.x1 + f.size * 8 &&
        f.x0 >= l.x0 - f.size * 2,
    );
    if (line) {
      line.text += (f.x0 - line.x1 > line.size * 0.3 ? ' ' : '') + f.text;
      line.x1 = Math.max(line.x1, f.x1);
      line.size = Math.max(line.size, f.size);
    } else {
      lines.push({ ...f });
    }
  }
  // pass 2: paragraph merge
  lines.sort((a, b) => b.y - a.y);
  type Block = TextBlock & { top: number; x0: number; x1: number; size: number };
  const blocks: Block[] = [];
  for (const ln of lines) {
    const prev = blocks[blocks.length - 1];
    const gap = prev ? prev.y - ln.y : Infinity;
    if (
      prev &&
      gap > 0 &&
      gap <= Math.max(prev.size, ln.size) * 2.2 &&
      Math.abs(prev.x0 - ln.x0) <= Math.max(prev.size, ln.size) * 1.5 &&
      Math.abs(prev.size - ln.size) <= Math.max(prev.size, ln.size) * 0.15
    ) {
      prev.text += ' ' + ln.text;
      prev.x0 = Math.min(prev.x0, ln.x0);
      prev.x1 = Math.max(prev.x1, ln.x1);
      prev.y = ln.y;
      prev.w = prev.x1 - prev.x0;
      prev.h = prev.top - ln.y;
    } else {
      blocks.push({ page: 0, x: ln.x0, y: ln.y, w: ln.x1 - ln.x0, h: ln.size, text: ln.text, fontSize: ln.size, top: ln.y + ln.size, x0: ln.x0, x1: ln.x1, size: ln.size });
    }
  }
  void pageHeight;
  return blocks
    .filter(b => b.text.trim().length > 1)
    .map(({ top, x0, x1, size, ...b }) => {
      void top; void x0; void x1; void size;
      return b;
    });
}

export function TranslatePdfTool() {
  const t = useTranslations('tools.translatePdf');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('zh-CN');
  const [bilingual, setBilingual] = useState(true);
  const [resultUrl, setResultUrl] = useState('');
  const [resultName, setResultName] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setError('');
    setResultUrl('');
    setResultName('');
    setPreviewDataUrl('');
    setProgress({ done: 0, total: 0 });
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      reset();
      setFileName(file.name);
      if (!/\.pdf$/i.test(file.name)) {
        setError(t('errorPdfOnly'));
        setPhase('error');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError(t('errorTooLarge'));
        setPhase('error');
        return;
      }
      const ac = new AbortController();
      abortRef.current = ac;
      setPhase('loading');
      try {
        const pdfjsLib = await import('pdfjs-dist');
        configureWorker(pdfjsLib);
        const buffer = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        const pageCount = Math.min(doc.numPages, MAX_PAGES);
        const allBlocks: TextBlock[] = [];
        const pageRasters: HTMLCanvasElement[] = [];
        const pageViewports: { width: number; height: number }[] = [];

        for (let p = 1; p <= pageCount; p++) {
          const page = await doc.getPage(p);
          const vp = page.getViewport({ scale: RENDER_SCALE });
          pageViewports.push({ width: vp.width, height: vp.height });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          pageRasters.push(canvas);
          const tc = await page.getTextContent();
          const blocks = buildBlocks(
            tc.items as Parameters<typeof buildBlocks>[0],
            vp.height,
          );
          blocks.forEach(b => (b.page = p - 1));
          allBlocks.push(...blocks);
          page.cleanup();
          setProgress({ done: p, total: pageCount });
          if (ac.signal.aborted) return;
        }

        // skip blocks that look like control glyphs with no translatable text
        const translatable = allBlocks.filter(b => /[A-Za-z\u4e00-\u9fff\u0400-\u04ff\u00c0-\u024f]/.test(b.text));
        setPhase('translating');
        setProgress({ done: 0, total: translatable.length });

        const cache = new Map<string, string>();
        let done = 0;
        const queue = [...translatable];
        const worker = async () => {
          while (queue.length && !ac.signal.aborted) {
            const b = queue.shift()!;
            const hit = cache.get(b.text);
            if (hit !== undefined) {
              b.translated = hit;
            } else {
              const out = await translateChunk(b.text, sourceLang, targetLang, ac.signal);
              cache.set(b.text, out);
              b.translated = out;
            }
            done++;
            if (done % 5 === 0 || queue.length === 0) setProgress({ done, total: translatable.length });
          }
        };
        await Promise.all([worker(), worker(), worker()]);
        if (ac.signal.aborted) return;

        setPhase('composing');
        const { PDFDocument } = await import('pdf-lib');
        const outDoc = await PDFDocument.create();
        const previewCanvas = document.createElement('canvas');

        for (let p = 0; p < pageCount; p++) {
          const vp = pageViewports[p];
          const raster = pageRasters[p];

          // compose translated page: raster + white-out + translated text
          const comp = document.createElement('canvas');
          comp.width = raster.width;
          comp.height = raster.height;
          const c = comp.getContext('2d')!;
          c.drawImage(raster, 0, 0);
          const sx = vp.width / 612; // pdf units → canvas px (approx; works for letter/A4 widths)
          const sy = vp.height / 792;
          void sx; void sy;
          const scale = raster.width / (vp.width / RENDER_SCALE);
          for (const b of allBlocks) {
            if (b.page !== p || !b.translated) continue;
            // cover the WHOLE original block: glyphs extend from baseline up to
            // ~fontSize, and descenders go ~0.3em below — pad both sides.
            const fsPx = b.fontSize * scale;
            const rectTop = raster.height - (b.y + b.h + 0.35 * b.fontSize) * scale;
            const rectH = (b.h + 0.8 * b.fontSize) * scale;
            const bx = b.x * scale - 2;
            const bw = Math.max(b.w * scale + 4, 10);
            const px = c.getImageData(Math.max(0, Math.min(raster.width - 2, Math.round(bx + 1))), Math.max(0, Math.min(raster.height - 2, Math.round(rectTop + 1))), 1, 1).data;
            c.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`;
            c.fillRect(bx, rectTop, bw, rectH + 2);
            // fit translated text: shrink font until the wrapped text fits the box
            let fontSize = Math.max(7, Math.min(b.fontSize * scale * 0.92, 40));
            const wrap = (size: number) => {
              c.font = `${size}px "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif`;
              const out: string[] = [];
              let line = '';
              for (const ch of b.translated!) {
                if (c.measureText(line + ch).width > bw && line) {
                  out.push(line);
                  line = ch;
                } else line += ch;
              }
              if (line) out.push(line);
              return out;
            };
            let linesOut = wrap(fontSize);
            const maxTextH = rectH + fsPx * 0.6; // may extend slightly past the box
            while (linesOut.length * fontSize * 1.25 > maxTextH && fontSize > 6) {
              fontSize -= 0.5;
              linesOut = wrap(fontSize);
            }
            c.fillStyle = '#111111';
            c.textBaseline = 'top';
            linesOut.slice(0, Math.max(1, Math.floor(maxTextH / (fontSize * 1.25)))).forEach((l, i) => {
              c.fillText(l, bx + 1, rectTop + 2 + i * fontSize * 1.25);
            });
          }

          const addPage = async (source: HTMLCanvasElement, name: string) => {
            const jpeg = source.toDataURL('image/jpeg', 0.82);
            const img = await outDoc.embedJpg(jpeg);
            const pageOut = outDoc.addPage([source.width, source.height]);
            pageOut.drawImage(img, { x: 0, y: 0, width: source.width, height: source.height });
            void name;
          };

          if (bilingual) await addPage(raster, 'original');
          await addPage(comp, 'translated');

          if (p === 0) {
            previewCanvas.width = comp.width;
            previewCanvas.height = comp.height;
            previewCanvas.getContext('2d')!.drawImage(comp, 0, 0);
          }
        }

        const bytes = await outDoc.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        const base = file.name.replace(/\.pdf$/i, '');
        setResultName(`${base}-${targetLang}${bilingual ? '-bilingual' : ''}.pdf`);
        setPreviewDataUrl(previewCanvas.toDataURL('image/jpeg', 0.7));
        setPhase('done');
      } catch (e) {
        if (!ac.signal.aborted) {
          setError(e instanceof Error ? e.message : String(e));
          setPhase('error');
        }
      }
    },
    [bilingual, fileName, sourceLang, targetLang, t],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) void handleFile(f);
    },
    [handleFile],
  );

  const busy = phase === 'loading' || phase === 'translating' || phase === 'composing';

  return (
    <div className="w-full max-w-3xl mx-auto" data-testid="translate-pdf-tool">
      <Card variant="outlined" size="lg" className="glass-card p-6">
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed border-[hsl(var(--color-border))] rounded-xl p-10 text-center cursor-pointer hover:border-[hsl(var(--color-primary))] transition-colors"
          onClick={() => document.getElementById('translate-pdf-input')?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') document.getElementById('translate-pdf-input')?.click(); }}
        >
          <input
            id="translate-pdf-input"
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
          />
          <p className="text-lg font-semibold text-[hsl(var(--color-foreground))]">
            {fileName || t('uploadLabel')}
          </p>
          <p className="text-sm text-[hsl(var(--color-muted-foreground))] mt-2">{t('uploadDescription')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[hsl(var(--color-muted-foreground))]">{t('sourceLang')}</span>
            <select
              value={sourceLang}
              onChange={e => setSourceLang(e.target.value)}
              className="select"
              disabled={busy}
            >
              {SOURCE_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[hsl(var(--color-muted-foreground))]">{t('targetLang')}</span>
            <select
              value={targetLang}
              onChange={e => setTargetLang(e.target.value)}
              className="select"
              disabled={busy}
            >
              {TARGET_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm text-[hsl(var(--color-foreground))]">
          <input type="checkbox" checked={bilingual} onChange={e => setBilingual(e.target.checked)} disabled={busy} />
          {t('bilingualMode')}
        </label>

        <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-3">{t('privacyNote')}</p>

        {busy && (
          <div className="mt-5" role="status" aria-live="polite">
            <div className="h-2 rounded-full bg-[hsl(var(--color-muted))] overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--color-primary))] transition-all"
                style={{ width: progress.total ? `${Math.round((progress.done / progress.total) * 100)}%` : '8%' }}
              />
            </div>
            <p className="text-sm text-[hsl(var(--color-muted-foreground))] mt-2">
              {phase === 'loading' && t('phaseParsing', { done: progress.done, total: progress.total })}
              {phase === 'translating' && t('phaseTranslating', { done: progress.done, total: progress.total })}
              {phase === 'composing' && t('phaseComposing')}
            </p>
          </div>
        )}

        {phase === 'error' && (
          <p className="mt-4 text-sm text-red-600" role="alert">{t('errorGeneric')} {error}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-5">
          {busy && (
            <Button variant="ghost" onClick={() => { abortRef.current?.abort(); reset(); }}>
              {t('cancel')}
            </Button>
          )}
          {phase === 'done' && resultUrl && (
            <>
              <a href={resultUrl} download={resultName}>
                <Button variant="primary">{t('download')}</Button>
              </a>
              <Button variant="ghost" onClick={reset}>{t('translateAnother')}</Button>
            </>
          )}
        </div>

        {phase === 'done' && previewDataUrl && (
          <div className="mt-6">
            <p className="text-sm font-medium text-[hsl(var(--color-muted-foreground))] mb-2">{t('previewTitle')}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewDataUrl} alt={t('previewAlt')} className="w-full rounded-lg border border-[hsl(var(--color-border))]" />
          </div>
        )}
      </Card>
    </div>
  );
}

export default TranslatePdfTool;
