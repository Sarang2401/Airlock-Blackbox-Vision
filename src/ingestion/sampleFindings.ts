import { EntityFinding, EntityType, NormalizedDocument } from '../contracts/types';
import { runDeterministicDetectors } from '../airlock/deterministic';
import { SyntheticSampleCase } from './syntheticSamples';

export function findSampleEntities(document: NormalizedDocument, labels: SyntheticSampleCase['privacyLabels']): EntityFinding[] {
  const { id, normalizedText } = document;
  const labeled: EntityFinding[] = [];
  for (const [type, values] of Object.entries(labels)) {
    for (const value of values) {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const match of normalizedText.matchAll(new RegExp(escaped, 'gi'))) {
        labeled.push({
          id: `fixture_${id}_${labeled.length + 1}`,
          documentId: id,
          type: type as EntityType,
          start: match.index,
          end: match.index + match[0].length,
          exactSubstring: match[0],
          provenance: 'FIXTURE_LABEL',
          confidence: 1,
          reviewed: true,
        });
      }
    }
  }

  const detected = runDeterministicDetectors(id, normalizedText).filter((finding) => {
    // In these verified fixtures, contextual words following “policy” and “claim” are prose.
    if ((finding.type === 'POLICY_NUMBER' || finding.type === 'CLAIM_NUMBER') && !/\d/.test(finding.exactSubstring)) return false;
    return !labeled.some(({ start, end }) => finding.start < end && start < finding.end);
  });
  return [...labeled, ...detected];
}
