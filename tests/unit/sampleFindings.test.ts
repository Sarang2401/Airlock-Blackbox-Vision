import { describe, expect, it } from 'vitest';
import { transformCaseDocuments } from '../../src/airlock/transformation';
import { normalizeDocumentText } from '../../src/ingestion/normalizer';
import { findSampleEntities } from '../../src/ingestion/sampleFindings';
import { SYNTHETIC_SAMPLE_CASES } from '../../src/ingestion/syntheticSamples';

describe('curated sample privacy review', () => {
  it.each(SYNTHETIC_SAMPLE_CASES)('protects every labeled occurrence in $id', (sample) => {
    const documents = sample.documents.map((doc, index) =>
      normalizeDocumentText(`doc_${index}`, doc.kind, doc.displayName, doc.text)
    );
    const findings = documents.flatMap((doc) => findSampleEntities(doc, sample.privacyLabels));
    const result = transformCaseDocuments('sample', documents, findings, {
      discloseHospital: false,
      expandDiagnosis: false,
    });
    const protectedText = result.sanitizedDocuments.map((doc) => doc.sanitizedText).join('\n').toLowerCase();

    expect(result.residualWarnings).toEqual([]);
    for (const value of Object.values(sample.privacyLabels).flat()) {
      expect(protectedText).not.toContain(value.toLowerCase());
    }
    expect(protectedText).toContain('[date_dref_');
  });
});
