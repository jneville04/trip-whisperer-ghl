/**
 * Convert a Supabase public storage URL to a transformed (resized) variant
 * for fast thumbnails. Falls back to original URL for non-Supabase URLs.
 */
export function thumbUrl(url: string | null | undefined, width = 480, quality = 70): string {
  if (!url) return "";
  // Skip data URLs and external (non-supabase) hosts
  if (url.startsWith("data:")) return url;
  // Convert /storage/v1/object/public/<bucket>/<path> -> /storage/v1/render/image/public/<bucket>/<path>?width=...
  if (url.includes("/storage/v1/object/public/")) {
    const transformed = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const sep = transformed.includes("?") ? "&" : "?";
    return `${transformed}${sep}width=${width}&quality=${quality}&resize=cover`;
  }
  return url;
}
