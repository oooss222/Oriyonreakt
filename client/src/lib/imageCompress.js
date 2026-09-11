const HEIC_NAME_PATTERN = /\.(heic|heif)$/i;

function isHeicLike(file) {
  const type = (file?.type || "").toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    HEIC_NAME_PATTERN.test(file?.name || "")
  );
}

/**
 * Compress/resize an image File in the browser before upload.
 * Returns a JPEG/WebP File (falls back to original on failure).
 */
export async function compressImageFile(file, {
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82,
  mimeType = "image/jpeg",
} = {}) {
  if (!file || !file.type?.startsWith("image/")) return file;
  if (typeof createImageBitmap !== "function" && typeof Image === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), mimeType, quality);
    });

    if (!blob) return file;

    const base = String(file.name || "photo").replace(/\.[^.]+$/, "");
    const ext = mimeType === "image/webp" ? "webp" : "jpg";

    return new File([blob], `${base}.${ext}`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

/**
 * Compress a batch of files. Returns the compressed files plus the subset
 * that look like HEIC/HEIF and could not be decoded in this browser (they're
 * still included in `files`, unmodified, so upload isn't blocked — the caller
 * decides whether/how to warn the user).
 */
export async function compressImageFiles(files = [], options) {
  const list = Array.from(files || []);
  const next = [];
  const unsupported = [];

  for (const file of list) {
    const compressed = await compressImageFile(file, options);
    if (compressed === file && isHeicLike(file)) {
      unsupported.push(file);
    }
    next.push(compressed);
  }

  return { files: next, unsupported };
}

export function moveArrayItem(list, fromIndex, toIndex) {
  const next = [...list];
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= next.length ||
    toIndex >= next.length
  ) {
    return next;
  }

  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
