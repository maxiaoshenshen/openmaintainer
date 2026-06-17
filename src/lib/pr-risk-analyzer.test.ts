import { describe, it, expect } from 'vitest';
import { analyzePRRisk, quickRiskCheck } from './pr-risk-analyzer';

describe('PR Risk Analyzer', () => {
  describe('analyzePRRisk', () => {
    it('should return low risk for small, well-reviewed PRs', () => {
      const result = analyzePRRisk({
        additions: 50,
        deletions: 20,
        filesChanged: 3,
        hasTests: true,
        hasBreakingChanges: false,
        isDependencyUpdate: false,
        hasDocumentation: true,
        commentDensity: 2,
        reviewCount: 2,
        age: 2,
        isDraft: false,
      });

      expect(result.overallRisk).toBe('low');
      expect(result.riskScore).toBeLessThan(40);
      expect(result.canAutoMerge).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });

    it('should return high risk for large PRs without tests', () => {
      const result = analyzePRRisk({
        additions: 600,
        deletions: 300,
        filesChanged: 25,
        hasTests: false,
        hasBreakingChanges: true,
        isDependencyUpdate: false,
        hasDocumentation: false,
        commentDensity: 0.2,
        reviewCount: 0,
        age: 5,
        isDraft: false,
      });

      expect(result.overallRisk).toBe('high');
      expect(result.riskScore).toBeGreaterThan(60);
      expect(result.canAutoMerge).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
    });

    it('should handle dependency updates with lower risk', () => {
      const result = analyzePRRisk({
        additions: 100,
        deletions: 80,
        filesChanged: 2,
        hasTests: true,
        hasBreakingChanges: false,
        isDependencyUpdate: true,
        hasDocumentation: false,
        commentDensity: 0,
        reviewCount: 1,
        age: 1,
        isDraft: false,
      });

      expect(result.overallRisk).toBe('low');
    });

    it('should flag stale PRs', () => {
      const result = analyzePRRisk({
        additions: 30,
        deletions: 10,
        filesChanged: 2,
        hasTests: true,
        hasBreakingChanges: false,
        isDependencyUpdate: false,
        hasDocumentation: true,
        commentDensity: 1,
        reviewCount: 2,
        age: 45,
        isDraft: false,
      });

      const staleFactor = result.factors.find(f => f.name === 'Staleness');
      expect(staleFactor?.score).toBeGreaterThan(70);
    });

    it('should estimate review time correctly', () => {
      const small = analyzePRRisk({
        additions: 20,
        deletions: 10,
        filesChanged: 2,
        hasTests: true,
        hasBreakingChanges: false,
        isDependencyUpdate: false,
        hasDocumentation: true,
        commentDensity: 1,
        reviewCount: 1,
        age: 1,
        isDraft: false,
      });
      expect(small.estimatedReviewTime).toBe('< 15 min');

      const large = analyzePRRisk({
        additions: 1000,
        deletions: 500,
        filesChanged: 30,
        hasTests: true,
        hasBreakingChanges: false,
        isDependencyUpdate: false,
        hasDocumentation: true,
        commentDensity: 1,
        reviewCount: 2,
        age: 1,
        isDraft: false,
      });
      expect(large.estimatedReviewTime).toMatch(/\d+h/);
    });
  });

  describe('quickRiskCheck', () => {
    it('should pass well-reviewed PRs', () => {
      const result = quickRiskCheck({
        hasTests: true,
        reviewCount: 1,
        isDraft: false,
      });

      expect(result.pass).toBe(true);
    });

    it('should fail draft PRs', () => {
      const result = quickRiskCheck({
        hasTests: true,
        reviewCount: 2,
        isDraft: true,
      });

      expect(result.pass).toBe(false);
      expect(result.message).toContain('draft');
    });

    it('should fail PRs without reviews', () => {
      const result = quickRiskCheck({
        hasTests: true,
        reviewCount: 0,
        isDraft: false,
      });

      expect(result.pass).toBe(false);
      expect(result.message).toContain('review');
    });

    it('should fail PRs without tests', () => {
      const result = quickRiskCheck({
        hasTests: false,
        reviewCount: 1,
        isDraft: false,
      });

      expect(result.pass).toBe(false);
      expect(result.message).toContain('test');
    });
  });
});
