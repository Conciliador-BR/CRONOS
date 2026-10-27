/** Limites de upload (os buckets também impõem os mesmos limites). */
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
