import { describe, it, expect } from 'vitest';
import {
  calculateContrastRatio,
  checkColorContrast,
  checkImageAlt,
  checkHeadingHierarchy,
  checkFormLabels,
  generateA11yReport
} from './accessibility-audit';

describe('accessibility-audit', () => {
  describe('calculateContrastRatio', () => {
    it('should calculate contrast ratio', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeGreaterThan(20);
      expect(ratio).toBeLessThan(22);
    });

    it('should return 1 for same colors', () => {
      const ratio = calculateContrastRatio('#000000', '#000000');
      expect(ratio).toBe(1);
    });
  });

  describe('checkColorContrast', () => {
    it('should pass for good contrast', () => {
      const result = checkColorContrast('#000000', '#ffffff');
      expect(result.passesAA).toBe(true);
      expect(result.passesAAA).toBe(true);
    });

    it('should fail for poor contrast', () => {
      const result = checkColorContrast('#777777', '#888888');
      expect(result.passesAA).toBe(false);
    });
  });

  describe('checkImageAlt', () => {
    it('should detect missing alt', () => {
      const issue = checkImageAlt({ hasAlt: false });
      expect(issue?.severity).toBe('critical');
    });

    it('should pass for proper alt', () => {
      const issue = checkImageAlt({ hasAlt: true, altText: 'Description' });
      expect(issue).toBeNull();
    });
  });

  describe('checkHeadingHierarchy', () => {
    it('should detect heading jumps', () => {
      const issues = checkHeadingHierarchy([1, 2, 4]);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should allow proper hierarchy', () => {
      const issues = checkHeadingHierarchy([1, 2, 3]);
      expect(issues.length).toBe(0);
    });
  });

  describe('generateA11yReport', () => {
    it('should generate report', () => {
      const report = generateA11yReport({
        images: [{ hasAlt: true, altText: 'Test' }],
        headings: [1, 2],
        inputs: [{ id: 'email', hasLabel: true }]
      });
      expect(report.score).toBeGreaterThan(0);
      expect(report.totalChecks).toBe(4);
    });
  });
});
