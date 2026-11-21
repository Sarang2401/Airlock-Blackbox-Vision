/**
 * Fast Smoke Benchmark Test.
 * Verified via npm run bench:fast
 */
import { describe, it, expect } from 'vitest';
import { generateBenchmarkCorpus } from './syntheticCorpus';
import { evaluateAirlockBench } from './runner';

describe('Airlock-Bench Fast Suite', () => {
  it('evaluates pilot subset quickly with 0 leaks', () => {
    const pilot = generateBenchmarkCorpus().slice(0, 20);
    const metrics = evaluateAirlockBench(pilot);

    expect(metrics.totalDocuments).toBe(20);
    expect(metrics.residualLeaksCount).toBe(0);
    expect(metrics.recall).toBeGreaterThanOrEqual(0.9);
  });
});
