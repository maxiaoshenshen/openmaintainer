import { describe, it, expect } from 'vitest';
import { PRCoverageTracker, prCoverageTracker } from './pr-coverage';

describe('PRCoverageTracker', () => {
  const tracker = new PRCoverageTracker();

  describe('comparePRCoverage', () => {
    it('should compare PR coverage between commits', async () => {
      const result = await tracker.comparePRCoverage(123, 'abc123', 'def456');
      
      expect(result).toHaveProperty('prNumber', 123);
      expect(result).toHaveProperty('baseCoverage');
      expect(result).toHaveProperty('headCoverage');
      expect(result).toHaveProperty('delta');
      expect(result).toHaveProperty('changedFilesCoverage');
      expect(result).toHaveProperty('overallImpact');
      expect(result).toHaveProperty('riskLevel');
    });
  });

  describe('getCoverageTrend', () => {
    it('should track coverage over time', async () => {
      const trends = await tracker.getCoverageTrend('test/repo', 30);
      
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBe(31);
      trends.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('overallCoverage');
        expect(trend.overallCoverage).toBeGreaterThanOrEqual(0);
        expect(trend.overallCoverage).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('generateCoverageReport', () => {
    it('should generate coverage report for commit', async () => {
      const report = await tracker.generateCoverageReport('abc123');
      
      expect(report).toHaveProperty('lines');
      expect(report).toHaveProperty('statements');
      expect(report).toHaveProperty('functions');
      expect(report).toHaveProperty('branches');
    });
  });

  describe('findUncoveredAreas', () => {
    it('should find areas needing more tests', async () => {
      const files = [
        { file: 'src/a.ts', metrics: { lines: { covered: 50, total: 100, percentage: 50 }, statements: { covered: 0, total: 0, percentage: 0 }, functions: { covered: 0, total: 0, percentage: 0 }, branches: { covered: 0, total: 0, percentage: 0 } }, uncoveredLines: [1, 2, 3], uncoveredBranches: [], complexity: 5 },
        { file: 'src/b.ts', metrics: { lines: { covered: 90, total: 100, percentage: 90 }, statements: { covered: 0, total: 0, percentage: 0 }, functions: { covered: 0, total: 0, percentage: 0 }, branches: { covered: 0, total: 0, percentage: 0 } }, uncoveredLines: [5], uncoveredBranches: [], complexity: 3 }
      ];
      const areas = tracker.findUncoveredAreas(files);
      
      expect(areas.length).toBeGreaterThan(0);
      expect(areas[0].file).toBe('src/a.ts');
    });
  });

  describe('checkThresholds', () => {
    it('should check if coverage meets thresholds', () => {
      const coverage = {
        lines: { covered: 85, total: 100, percentage: 85 },
        statements: { covered: 80, total: 100, percentage: 80 },
        functions: { covered: 90, total: 100, percentage: 90 },
        branches: { covered: 75, total: 100, percentage: 75 }
      };
      
      expect(tracker.checkThresholds(coverage, { minLines: 80 })).toBe(true);
      expect(tracker.checkThresholds(coverage, { minLines: 90 })).toBe(false);
    });
  });
});
