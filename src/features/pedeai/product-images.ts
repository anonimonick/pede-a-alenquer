import { supabase } from '@/integrations/supabase/client';

export const IMAGE_BUCKET = 'product-images';
const BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/sign/${IMAGE_BUCKET}/`;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Storage path of a product photo, or null when the URL is an external link. */
export const storagePath = (url: string | null | undefined) => (url && url.startsWith(BASE) ? decodeURIComponent(url.slice(BASE.length)) : null);

export function imageFileError(f: File): string | null {
  if (!TYPES[f.type]) return 'Use uma foto JPG, PNG ou WEBP.';
  if (f.size > MAX_IMAGE_BYTES) return 'A foto deve ter no máximo 5 MB.';
  return null;
}

/** Uploads to the restaurant's folder (RLS: managers only) and returns the stable https reference stored in products.image_url. */
export async function uploadProductImage(restaurantId: string, f: File): Promise<string> {
  const path = `${restaurantId}/${crypto.randomUUID()}.${TYPES[f.type]}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, f, { contentType: f.type, upsert: false });
  if (error) throw error;
  return BASE + path;
}

export async function removeProductImage(url: string | null | undefined) {
  const p = storagePath(url); if (p) await supabase.storage.from(IMAGE_BUCKET).remove([p]);
}

/** Replaces stored references with short-lived signed URLs (bucket is private). */
export async function resolveImages<T extends { image_url: string | null }>(rows: T[]): Promise<T[]> {
  const paths = [...new Set(rows.map(r => storagePath(r.image_url)).filter((p): p is string => Boolean(p)))];
  if (!paths.length) return rows;
  const { data } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(paths, 60 * 60 * 12);
  const map = new Map((data ?? []).filter(d => d.signedUrl).map(d => [d.path, d.signedUrl]));
  return rows.map(r => { const p = storagePath(r.image_url); return p ? { ...r, image_url: map.get(p) ?? null } : r; });
}
