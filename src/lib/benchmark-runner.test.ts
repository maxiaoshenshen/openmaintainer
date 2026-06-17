import { describe, it, expect } from 'vitest';
import {
  runBenchmark,
  compareBenchmarks,
  formatBenchmarkMarkdown
} from './benchmark-runner';

describe('benchmark-runner', () => {
  describe('runBenchmark', () => {
    it('should run benchmark and return results', () => {
      const result = runBenchmark({
        name: 'array-sort-test',
        fn: () => { const arr = [3,1,4,1,5,9,2,6]; arr.sort((a,b) => a-b); },
        iterations: 10,
        warmup: 2
      });
      expect(result.name).toBe('array-sort-test');
      expect(result.iterations).toBe(10);
      expect(result.mean).toBeDefined();
      expect(result.median).toBeDefined();
    });

    it('should include percentiles', () => {
      const result = runBenchmark({
        name: 'percentile-test',
        fn: () => { const sum = 0; for (let i = 0; i < 100; i++) sum + i; },
        iterations: 100
      });
      expect(result.percentiles.p50).toBeDefined();
      expect(result.percentiles.p95).toBeGreaterThanOrEqual(result.percentiles.p50);
    });
  });

  describe('compareBenchmarks', () => {
    it('should detect improvement', () => {
      const baseline = { name: 'v1', iterations: 10, mean: 100, median: 95, min: 50, max: 200, stdDev: 30, percentiles: { p50: 95, p95: 150, p99: 190 } };
      const current = { name: 'v2', iterations: 10, mean: 80, median: 75, min: 40, max: 150, stdDev: 25, percentiles: { p50: 75, p95: 120, p99: 145 } };
      const result = compareBenchmarks(baseline, current);
      expect(result.improvement.faster).toBe(true);
      expect(result.improvement.percentage).toBe(20);
    });

    it('should detect regression', () => {
      const baseline = { name: 'v1', iterations: 10, mean: 100, median: 95, min: 50, max: 200, stdDev: 30, percentiles: { p50: 95, p95: 150, p99: 190 } };
      const current = { name: 'v2', iterations: 10, mean: 120, median: 115, min: 60, max: 250, stdDev: 40, percentiles: { p50: 115, p95: 180, p99: 240 } };
      const result = compareBenchmarks(baseline, current);
      expect(result.regression.detected).toBe(true);
    });
  });

  describe('formatBenchmarkMarkdown', () => {
    it('should format result as markdown', () => {
      const result = runBenchmark({ name: 'test', fn: () => { const x = 1+1; }, iterations: 5 });
      const md = formatBenchmarkMarkdown(result);
      expect(md).toContain('test');
      expect(md).toContain('Mean');
    });
  });
});
