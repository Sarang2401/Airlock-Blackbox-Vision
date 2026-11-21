/**
 * Ingestion bounds and resource budget enforcement.
 */

export const INGESTION_LIMITS = {
  MAX_FILE_BYTES: 2 * 1024 * 1024, // 2 MiB
  MAX_CHAR_COUNT: 12000, // 12,000 UTF-16 code units
  MAX_DOCUMENTS_PER_CASE: 5,
};

export function validateInputBounds(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Document content is empty.' };
  }
  if (content.length > INGESTION_LIMITS.MAX_CHAR_COUNT) {
    return {
      valid: false,
      error: `Document exceeds length limit (${content.length} / ${INGESTION_LIMITS.MAX_CHAR_COUNT} characters). Please split or reduce the excerpt.`,
    };
  }
  return { valid: true };
}
