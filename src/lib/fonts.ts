/**
 * Font Configuration
 * Requirements: 8.4 - Font optimization
 * 
 * Uses next/font for automatic font optimization including:
 * - Font subsetting (only loads characters used)
 * - Self-hosting (no external requests to Google Fonts)
 * - Zero layout shift with size-adjust
 * - display: optional for zero font-swap CLS
 */

import { Inter, JetBrains_Mono } from 'next/font/google';

/**
 * Inter font - Primary sans-serif font
 * Used for body text and UI elements
 */
export const inter = Inter({
  subsets: ['latin'],
  // 'optional' (not 'swap'): with preload the font either arrives within
  // the ~100ms block period (font applies, zero reflow) or the metric-
  // adjusted fallback is used for the whole session (zero reflow, fast
  // first paint). Both paths are CLS-free; 'swap' measured 0.036 CLS on
  // the homepage from the post-load swap reflow.
  display: 'optional',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true,
});

/**
 * JetBrains Mono font - Monospace font
 * Used for code snippets and technical content
 */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  // 'optional' — same zero-CLS rationale as Inter above; the Consolas/
  // Menlo fallback is metric-adjusted so code blocks keep their layout.
  display: 'optional',
  variable: '--font-jetbrains-mono',
  preload: false, // Only preload if code is shown above the fold
  fallback: ['Fira Code', 'Consolas', 'Monaco', 'monospace'],
  adjustFontFallback: true,
});

/**
 * Combined font variables for use in className
 */
export const fontVariables = `${inter.variable} ${jetbrainsMono.variable}`;

/**
 * Font class names for direct usage
 */
export const fontClassNames = {
  sans: inter.className,
  mono: jetbrainsMono.className,
};

/**
 * CSS custom properties for fonts
 * These are set as CSS variables and can be used in Tailwind
 */
export const fontCssVariables = {
  '--font-sans': inter.style.fontFamily,
  '--font-mono': jetbrainsMono.style.fontFamily,
} as const;
