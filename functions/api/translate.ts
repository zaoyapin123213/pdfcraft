// Cloudflare Pages Function: same-origin proxy for the PDF translation tool.
// The client calls /api/translate?q=...&sl=..&tl=..; this function forwards
// the query to a translation endpoint from Cloudflare's edge (reachable from
// mainland-China visitors, unlike direct browser calls to Google) and returns
// the JSON with same-origin CORS. Endpoints are tried in order; each returns
// the same shape: [[ [translated, original, ...], ... ], ...] like Google's
// translate_a/single, normalized by the client.
type Upstream = { url: string; parse: (body: string) => string };

const UPSTREAMS: Upstream[] = [
  {
    // Google translate_a/single (gtx) — canonical shape [[trans, orig, ...],...]
    url: (q, sl, tl) =>
      `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(q)}`,
    parse: (body) => {
      const data = JSON.parse(body) as unknown;
      if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('gtx bad payload');
      return (data[0] as unknown[])
        .map(seg => (Array.isArray(seg) ? String(seg[0] ?? '') : ''))
        .join('');
    },
  },
  {
    // Google chrome-dict endpoint on a different host
    url: (q, sl, tl) =>
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(q)}`,
    parse: (body) => {
      const data = JSON.parse(body) as unknown;
      // shape: [["译文", "source"]...] or ["译文"] depending on client param
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return (data as unknown[]).map(seg => (Array.isArray(seg) ? String(seg[0] ?? '') : String(seg))).join('');
      }
      if (Array.isArray(data)) return data.map(x => String(x)).join('');
      throw new Error('dict bad payload');
    },
  },
  {
    // Lingva community proxy (Google results without API key)
    url: (q, sl, tl) =>
      `https://lingva.ml/api/v1/${sl === 'auto' ? 'auto' : sl}/${tl}/${encodeURIComponent(q)}`,
    parse: (body) => {
      const data = JSON.parse(body) as { translation?: string };
      if (!data.translation) throw new Error('lingva bad payload');
      return data.translation;
    },
  },
];

const json = (body: string, status: number): Response =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });

export const onRequestGet = async ({ request }: { request: Request }): Promise<Response> => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') ?? '';
  const sl = url.searchParams.get('sl') || 'auto';
  const tl = url.searchParams.get('tl') || '';
  if (!q || !tl) return json(JSON.stringify({ error: 'missing q or tl' }), 400);
  if (q.length > 1800) return json(JSON.stringify({ error: 'q too long' }), 413);

  const errors: string[] = [];
  for (const up of UPSTREAMS) {
    try {
      const res = await fetch(up.url(q, sl, tl), {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!res.ok) {
        errors.push(`${new URL(up.url(q, sl, tl)).host} ${res.status}`);
        continue;
      }
      const translated = up.parse(await res.text());
      return new Response(
        JSON.stringify([[translated, q, null, null, null]]),
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    } catch (e) {
      const host = (() => { try { return new URL(up.url(q, sl, tl)).host; } catch { return 'unknown'; } })();
      errors.push(`${host} ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return json(JSON.stringify({ error: 'all upstreams failed', detail: errors }), 502);
};
