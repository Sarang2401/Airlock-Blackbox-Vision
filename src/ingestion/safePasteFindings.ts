import { EntityFinding, EntityType, NormalizedDocument } from '../contracts/types';
import { runDeterministicDetectors } from '../airlock/deterministic';

export function findSafePasteEntities(document: NormalizedDocument, manualSelections: string[]): EntityFinding[] {
  const { id, normalizedText } = document;
  const findings = runDeterministicDetectors(id, normalizedText);

  function addMatches(pattern: RegExp, type: EntityType, reviewed: boolean) {
    for (const match of normalizedText.matchAll(pattern)) {
      findings.push({
        id: `paste_${findings.length + 1}`,
        documentId: id,
        type,
        start: match.index,
        end: match.index + match[0].length,
        exactSubstring: match[0],
        provenance: 'DETERMINISTIC',
        reviewed,
      });
    }
  }

  // Treat title-cased name-like phrases as candidates even without a field label.
  addMatches(/(?<![\p{L}\p{M}])\p{Lu}[\p{Ll}\p{M}]+(?:[ '-]\p{Lu}[\p{Ll}\p{M}]+){1,3}(?![\p{L}\p{M}])/gu, 'PERSON_NAME', false);
  for (const selection of manualSelections) {
    const escaped = selection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    addMatches(new RegExp(escaped, 'giu'), 'GENERIC_IDENTIFIER', true);
  }

  return findings;
}
