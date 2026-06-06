import { describe, it, expect } from 'vitest';
import {
  calculatePRScore,
  getRiskLevel,
  getMergeRecommendation,
  analyzeCodeQuality,
  generateMergeChecklist,
  generatePRSummary,
} from './pr-merge-advisor';

describe('PR Merge Advisor', () => {
  describe('calculatePRScore', () => {
    it('calculates base score', () => {
      expect(calculatePRScore([])).toBe(70);
    });

    it('applies positive impacts', () => {
      const factors = [
        { name: 'test', impact: 10, description: 'tests' },
        { name: 'docs', impact: 15, description: 'docs' },
      ];
      expect(calculatePRScore(factors)).toBe(95);
    });

    it('applies negative impacts', () => {
      const factors = [
        { name: 'security', impact: -20, description: 'vuln' },
      ];
      expect(calculatePRScore(factors)).toBe(50);
    });

    it('clamps to 0-100 range', () => {
      const factors = [
        { name: 'a', impact: 50, description: '' },
        { name: 'b', impact: 50, description: '' },
      ];
      expect(calculatePRScore(factors)).toBe(100);
    });
  });

  describe('getRiskLevel', () => {
    it('returns low for score >= 80', () => {
      expect(getRiskLevel(80)).toBe('low');
      expect(getRiskLevel(100)).toBe('low');
    });

    it('returns medium for score >= 60', () => {
      expect(getRiskLevel(60)).toBe('medium');
      expect(getRiskLevel(79)).toBe('medium');
    });

    it('returns high for score >= 40', () => {
      expect(getRiskLevel(40)).toBe('high');
      expect(getRiskLevel(59)).toBe('high');
    });

    it('returns critical for score < 40', () => {
      expect(getRiskLevel(0)).toBe('critical');
      expect(getRiskLevel(39)).toBe('critical');
    });
  });

  describe('getMergeRecommendation', () => {
    it('approves high score PRs', () => {
      expect(getMergeRecommendation(90, [])).toBe('approve');
    });

    it('blocks PRs with blocking factors', () => {
      const factors = [{ name: 'security', impact: -25, description: '' }];
      expect(getMergeRecommendation(50, factors)).toBe('block');
    });

    it('requests changes for major concerns', () => {
      const factors = [{ name: 'logic', impact: -15, description: '' }];
      expect(getMergeRecommendation(60, factors)).toBe('request_changes');
    });
  });

  describe('analyzeCodeQuality', () => {
    it('analyzes code quality metrics', () => {
      const code = 'const x = 1; // comment';
      const quality = analyzeCodeQuality(code);
      expect(quality).toHaveProperty('testCoverage');
      expect(quality).toHaveProperty('lintScore');
      expect(quality).toHaveProperty('complexity');
      expect(quality).toHaveProperty('documentation');
    });

    it('detects lint issues', () => {
      const code = 'console.log("test"); var x = 1;';
      const quality = analyzeCodeQuality(code);
      expect(quality.lintScore).toBeLessThan(100);
    });
  });

  describe('generateMergeChecklist', () => {
    it('generates checklist items', () => {
      const analysis = {
        prNumber: 1,
        title: 'Test',
        score: 85,
        riskLevel: 'low' as const,
        recommendation: 'approve' as const,
        factors: [],
        suggestions: [],
      };
      const checklist = generateMergeChecklist(analysis);
      expect(checklist.length).toBeGreaterThan(0);
      expect(checklist[0]).toHaveProperty('title');
      expect(checklist[0]).toHaveProperty('passed');
      expect(checklist[0]).toHaveProperty('required');
    });
  });

  describe('generatePRSummary', () => {
    it('generates formatted summary', () => {
      const analysis = {
        prNumber: 123,
        title: 'Add feature',
        score: 85,
        riskLevel: 'low' as const,
        recommendation: 'approve' as const,
        factors: [],
        suggestions: ['Add tests'],
      };
      const summary = generatePRSummary(analysis);
      expect(summary).toContain('123');
      expect(summary).toContain('Add feature');
      expect(summary).toContain('85');
    });
  });
});
