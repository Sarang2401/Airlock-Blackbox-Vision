/**
 * Airlock-Bench Full 105-Document Validation Test.
 * Verified in CI & Release Gate: npm run bench:validate
 */
import { describe, it, expect } from 'vitest';
import { generateBenchmarkCorpus } from './syntheticCorpus';
import { evaluateAirlockBench } from './runner';

describe('Airlock-Bench 105-Document Corpus & Privacy Evaluation', () => {
  const corpus = generateBenchmarkCorpus();

  it('generates at least 100 fully labeled synthetic documents across all 5 categories', () => {
    expect(corpus.length).toBeGreaterThanOrEqual(100);
    expect(corpus.length).toBe(105);

    const categories = new Set(corpus.map((d) => d.category));
    expect(categories.has('BILL')).toBe(true);
    expect(categories.has('DENIAL')).toBe(true);
    expect(categories.has('POLICY')).toBe(true);
    expect(categories.has('DISCHARGE')).toBe(true);
    expect(categories.has('PHARMACY')).toBe(true);
  });

  it('achieves 0% residual leak rate on sensitive direct identifiers', () => {
    const metrics = evaluateAirlockBench(corpus);
    expect(metrics.residualLeaksCount).toBe(0);
    expect(metrics.leakRate).toBe(0.0);
  });

  it('achieves >= 90% recall on sensitive entities', () => {
    const metrics = evaluateAirlockBench(corpus);
    expect(metrics.recall).toBeGreaterThanOrEqual(0.90);
  });

  it('maintains >= 90% cloud eligibility for verified synthetic fixtures', () => {
    const metrics = evaluateAirlockBench(corpus);
    expect(metrics.eligiblePercentage).toBeGreaterThanOrEqual(90);
  });
});
