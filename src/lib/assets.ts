// Resolves an image reference to a URL that works regardless of the site's base
// path (e.g. '/dream_horizan/' on GitHub Pages vs '/' on Netlify).
//
// Some records (e.g. projects seeded into Firestore) store base-less paths like
// '/work/download.png'. Served under a base path, those 404. This normaliser
// prefixes the current base while leaving absolute URLs and inline data URIs
// untouched. It is idempotent — a value that already includes the base is
// returned unchanged.
export const resolveAssetUrl = (src?: string | null): string => {
  if (!src) return '';

  // External URLs and inline base64 images are already fully qualified.
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  const base = (import.meta as any).env.BASE_URL || '/'; // e.g. '/dream_horizan/'

  // Already correctly prefixed.
  if (src.startsWith(base)) return src;

  // Normalise 'work/x.png' or '/work/x.png' to '<base>work/x.png'.
  return `${base}${src.replace(/^\//, '')}`;
};
