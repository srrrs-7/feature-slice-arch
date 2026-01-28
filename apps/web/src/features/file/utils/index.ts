/**
 * Format file size in bytes to human readable string
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get human readable label for content type
 */
export function getContentTypeLabel(contentType: string): string {
  const typeMap: Record<string, string> = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "image/webp": "WebP",
    "application/pdf": "PDF",
    "text/plain": "TXT",
    "text/csv": "CSV",
  };
  return typeMap[contentType] ?? contentType;
}

/**
 * Check if content type is an image
 */
export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/**
 * Check if content type is a PDF
 */
export function isPdfContentType(contentType: string): boolean {
  return contentType === "application/pdf";
}

/**
 * Check if content type is text-based
 */
export function isTextContentType(contentType: string): boolean {
  return contentType.startsWith("text/");
}
