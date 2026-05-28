/**
 * Prefixes root-relative asset URLs (e.g. starting with '/') with Vite's BASE_URL
 * to ensure they resolve correctly on environments hosted under sub-paths (like GitHub Pages).
 */
export function resolveAssetPath(path: string): string {
  if (!path) return "";
  if (path.startsWith("/")) {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    return `${base}${path}`;
  }
  return path;
}
