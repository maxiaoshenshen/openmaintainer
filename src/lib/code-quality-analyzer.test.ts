import { describe, it, expect } from 'vitest';
import {
  calculateComplexity,
  calculateMaintainability,
  categorizeComplexity,
  analyzeFile,
  generateIssues,
  generateQualityReport,
  suggestRefactoring,
  calculateTechnicalDebt,
} from './code-quality-analyzer';

describe('code-quality-analyzer', () => {
  describe('calculateComplexity', () => {
    it('should calculate complexity', () => {
      const complexity = calculateComplexity(100, 5, 3);
      expect(complexity).toBeGreaterThan(0);
      expect(complexity).toBeLessThanOrEqual(100);
    });

    it('should weight loops higher', () => {
      const withLoops = calculateComplexity(100, 5, 10);
      const withoutLoops = calculateComplexity(100, 5, 0);
      expect(withLoops).toBeGreaterThan(withoutLoops);
    });
  });

  describe('calculateMaintainability', () => {
    it('should calculate maintainability score', () => {
      const score = calculateMaintainability(10, 100, 0.2, 5);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should penalize high complexity', () => {
      const lowComplexity = calculateMaintainability(5, 50, 0.3, 2);
      const highComplexity = calculateMaintainability(50, 50, 0.3, 2);
      expect(lowComplexity).toBeGreaterThan(highComplexity);
    });
  });

  describe('categorizeComplexity', () => {
    it('should categorize complexity levels', () => {
      expect(categorizeComplexity(5).rating).toContain('Low');
      expect(categorizeComplexity(25).rating).toContain('Elevated');
      expect(categorizeComplexity(60).rating).toContain('Very High');
    });
  });

  describe('analyzeFile', () => {
    it('should analyze file content', () => {
      const content = `
        // This is a comment
        function test() {
          if (true) {
            for (let i = 0; i < 10; i++) {
              console.log(i);
            }
          }
        }
      `;
      const metrics = analyzeFile(content, 'test.ts');
      expect(metrics.file).toBe('test.ts');
      expect(metrics.lines).toBeGreaterThan(0);
      expect(metrics.complexity).toBeGreaterThan(0);
    });
  });

  describe('generateIssues', () => {
    it('should generate issues for complex files', () => {
      const metrics = [{
        file: 'complex.ts',
        lines: 200,
        codeLines: 150,
        commentLines: 10,
        blankLines: 40,
        complexity: 60,
        maintainability: 30,
        duplication: 10,
      }];
      const issues = generateIssues(metrics);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.category === 'complexity')).toBe(true);
    });
  });

  describe('generateQualityReport', () => {
    it('should generate complete report', () => {
      const metrics = [{
        file: 'test.ts',
        lines: 100,
        codeLines: 80,
        commentLines: 10,
        blankLines: 10,
        complexity: 15,
        maintainability: 70,
        duplication: 3,
      }];
      const report = generateQualityReport(metrics);
      expect(report.score).toBeGreaterThan(0);
      expect(report.grade).toBeDefined();
      expect(report.issues.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('suggestRefactoring', () => {
    it('should suggest refactoring for complexity', () => {
      const issue = { file: 'test.ts', line: 1, severity: 'warning' as const, category: 'complexity' as const, message: '', rule: '' };
      const suggestion = suggestRefactoring(issue);
      expect(suggestion).toContain('extract');
    });
  });

  describe('calculateTechnicalDebt', () => {
    it('should calculate debt in days', () => {
      const issues = [
        { file: 'test.ts', line: 1, severity: 'error' as const, category: 'complexity' as const, message: '', rule: '', effort: 5 },
      ];
      const debt = calculateTechnicalDebt(issues);
      expect(debt.minutes).toBeGreaterThan(0);
      expect(debt.days).toBeGreaterThan(0);
    });
  });
});
