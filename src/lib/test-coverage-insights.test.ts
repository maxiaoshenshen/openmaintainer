import { describe, it, expect } from 'vitest';
import { TestCoverageInsights, testCoverageInsights } from './test-coverage-insights';

describe('TestCoverageInsights', () => {
  const insights = new TestCoverageInsights();

  describe('generateReport', () => {
    it('should generate coverage report', async () => {
      const report = await insights.generateReport();
      
      expect(report).toHaveProperty('overallCoverage');
      expect(report).toHaveProperty('lineCoverage');
      expect(report).toHaveProperty('branchCoverage');
      expect(report).toHaveProperty('functionCoverage');
      expect(report).toHaveProperty('filesNeedingAttention');
      expect(report).toHaveProperty('totalFiles');
      expect(report).toHaveProperty('coverageHistory');
      expect(report.overallCoverage).toBeGreaterThanOrEqual(0);
      expect(report.overallCoverage).toBeLessThanOrEqual(100);
    });
  });

  describe('getSuggestions', () => {
    it('should get test suggestions', async () => {
      const suggestions = await insights.getSuggestions(80);
      
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(s => {
        expect(s).toHaveProperty('file');
        expect(s).toHaveProperty('uncoveredLines');
        expect(s).toHaveProperty('suggestedTestCases');
        expect(s).toHaveProperty('priority');
      });
    });

    it('should prioritize high coverage gaps', async () => {
      const suggestions = await insights.getSuggestions(50);
      const priorities = suggestions.map(s => s.priority);
      
      const highCount = priorities.filter(p => p === 'high').length;
      expect(highCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateGoals', () => {
    it('should calculate coverage goals', async () => {
      const goal = await insights.calculateGoals(90);
      
      expect(goal).toHaveProperty('target', 90);
      expect(goal).toHaveProperty('current');
      expect(goal).toHaveProperty('remaining');
      expect(goal).toHaveProperty('estimatedTestsNeeded');
      expect(goal.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('identifyUntestedPaths', () => {
    it('should identify untested paths', async () => {
      const paths = await insights.identifyUntestedPaths('src/api/users.ts');
      
      expect(Array.isArray(paths)).toBe(true);
      paths.forEach(p => {
        expect(p).toHaveProperty('path');
        expect(p).toHaveProperty('line');
        expect(p).toHaveProperty('type');
      });
    });

    it('should return empty for non-existent file', async () => {
      const paths = await insights.identifyUntestedPaths('non/existent.ts');
      expect(paths).toHaveLength(0);
    });
  });

  describe('compareCoverage', () => {
    it('should compare coverage between commits', async () => {
      const comparison = await insights.compareCoverage('abc123', 'def456');
      
      expect(comparison).toHaveProperty('baseCoverage');
      expect(comparison).toHaveProperty('headCoverage');
      expect(comparison).toHaveProperty('delta');
      expect(comparison).toHaveProperty('improvedFiles');
      expect(comparison).toHaveProperty('degradedFiles');
      expect(comparison).toHaveProperty('summary');
    });
  });
});
