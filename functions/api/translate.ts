// Cloudflare Pages Function: same-origin proxy for the PDF translation tool.
// The client tool calls /api/translate?q=...&sl=..&tl=..; this function
// forwards the query to Google's translate endpoint from Cloudflare's edge
// (reachable from mainland-China visitors, unlike translate.googleapis.com
// direct browser calls) and returns the JSON with same-origin CORS.
export const onRequestGet = async ({ request }: { request: Request }): Promise<Response> => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') ?? '';
  const sl = url.searchParams.get('sl') || 'auto';
  const tl = url.searchParams.get('tl') || '';
  const json = (body: string, status: number): Response =>
    new Response(body, {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  if (!q || !tl) return json(JSON.stringify({ error: 'missing q or tl' }), 400);
  if (q.length > 1800) return json(JSON.stringify({ error: 'q too long' }), 413);
  const target =
    'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t' +
    `&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(q)}`;
  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!upstream.ok) {
      return json(JSON.stringify({ error: `upstream ${upstream.status}` }), 502);
    }
    const body = await upstream.text();
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return json(
      JSON.stringify({ error: 'fetch failed', detail: e instanceof Error ? `${e.name}: ${e.message}` : String(e) }),
      502,
    );
  }
};
