/**
 * themeColors.js
 *
 * Runtime color resolution for light/dark mode. Object color data persisted
 * to the server is never modified: black-like colors (the default for
 * manually created objects and text) are simply *rendered* white while dark
 * mode is active. Custom colors (scan-created objects, user-picked colors)
 * always render as stored.
 */

const BLACK_LIKE = new Set(['black', '#000', '#000000']);

export function isBlackLike(color) {
  if (color == null || color === '') return true;
  if (typeof color !== 'string') return false;
  return BLACK_LIKE.has(color.trim().toLowerCase());
}

/** Edge/line color: black-like colors render white in dark mode. */
export function resolveEdgeColor(color, mode) {
  if (mode === 'dark' && isBlackLike(color)) return '#ffffff';
  return color;
}

/** 3D text color: same rule as edges, with a concrete fallback for light mode. */
export function resolveTextColor(color, mode) {
  if (mode === 'dark' && isBlackLike(color)) return '#ffffff';
  return color || '#000000';
}
