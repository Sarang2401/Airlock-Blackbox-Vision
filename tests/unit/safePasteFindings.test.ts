import { describe, expect, it } from 'vitest';
import { transformCaseDocuments } from '../../src/airlock/transformation';
import { normalizeDocumentText } from '../../src/ingestion/normalizer';
import { findSafePasteEntities } from '../../src/ingestion/safePasteFindings';

describe('Safe Paste local masking', () => {
  it('protects an unlabelled name and every occurrence of manually selected text', () => {
    const document = normalizeDocumentText('test', 'NOTES', 'Prompt', 'Avery Quill asked about ZYNQ+7. Please refer to ZYNQ+7 in the reply.');
    const transform = transformCaseDocuments('test', [document], findSafePasteEntities(document, ['ZYNQ+7']), {
      discloseHospital: false,
      expandDiagnosis: false,
    });
    const text = transform.sanitizedDocuments[0].sanitizedText;

    expect(text).not.toContain('Avery Quill');
    expect(text).not.toContain('ZYNQ+7');
    expect(Object.values(transform.transformationMap.placeholders)).toEqual(expect.arrayContaining(['Avery Quill', 'ZYNQ+7']));
  });
});
