/**
 * Unicode text normalizer and segmenter.
 */
import { NormalizedDocument, DocumentKind } from '../contracts/types';

export function normalizeDocumentText(
  documentId: string,
  kind: DocumentKind,
  displayName: string,
  rawText: string
): NormalizedDocument {
  // Unicode NFC normalization
  const normalized = rawText.normalize('NFC').replace(/\r\n/g, '\n');

  return {
    id: documentId,
    kind,
    displayName,
    originalText: rawText,
    normalizedText: normalized,
    charCount: normalized.length,
  };
}
