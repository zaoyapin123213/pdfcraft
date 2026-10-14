/**
 * PDFEditorFree brand mark.
 *
 * Design: red gradient badge, white document sheet with an amber folded
 * corner, and an amber pencil drawing a fresh edit stroke — the "editing
 * in progress" read that carries the brand in SERP favicons and headers.
 * Single source of truth: this component must visually mirror
 * public/favicon.svg (same geometry/colors); update both together.
 */
export function LogoMark({
  className = '',
  idPrefix = 'pde',
}: {
  className?: string;
  /** Unique per-mount gradient id prefix — avoids duplicate SVG ids when
   * the mark renders twice on one page (e.g. header + footer). */
  idPrefix?: string;
}) {
  const bgId = `${idPrefix}-logo-bg`;
  const sheenId = `${idPrefix}-logo-sheen`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EF4444" />
          <stop offset="1" stopColor="#B91C1C" />
        </linearGradient>
        <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${bgId})`} />
      <rect width="64" height="64" rx="14" fill={`url(#${sheenId})`} />
      {/* document sheet with folded corner */}
      <path d="M17 10 H33 L42 19 V45 Q42 48 39 48 H17 Q14 48 14 45 V13 Q14 10 17 10 Z" fill="#ffffff" />
      <path d="M33 10 L42 19 H35 Q33 19 33 17 Z" fill="#FCD34D" />
      {/* text lines */}
      <rect x="19.5" y="23.5" width="17" height="2.6" rx="1.3" fill="#CBD5E1" />
      <rect x="19.5" y="29.5" width="10.5" height="2.6" rx="1.3" fill="#CBD5E1" />
      {/* fresh amber edit stroke the pencil is drawing */}
      <rect x="19.5" y="36.4" width="14.5" height="3.2" rx="1.6" fill="#F59E0B" />
      {/* pencil, 45°, tip up-left */}
      <polygon points="36.5,38 43.45,40.03 38.32,45.16" fill="#FDE68A" />
      <polygon points="36.5,38 38.87,38.89 37.39,40.37" fill="#7C2D12" />
      <polygon points="38.32,45.16 43.45,40.03 52.32,48.9 47.19,54.03" fill="#F59E0B" />
      <polygon points="47.19,54.03 52.32,48.9 54.28,50.86 49.15,55.99" fill="#F1F5F9" />
    </svg>
  );
}
