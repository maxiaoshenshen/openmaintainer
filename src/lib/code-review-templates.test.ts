import { describe, it, expect } from 'vitest';
import {
  generateReviewChecklist,
  calculateReviewTime,
  getTemplate,
  customizeTemplate,
  DEFAULT_TEMPLATES,
} from './code-review-templates';

describe('Code Review Templates', () => {
  describe('generateReviewChecklist', () => {
    it('generates checklist for security template', () => {
      const template = DEFAULT_TEMPLATES[0];
      const checklist = generateReviewChecklist(template, 5, 'medium');
      expect(checklist).toContain('Security First');
      expect(checklist).toContain('5');
    });
  });

  describe('calculateReviewTime', () => {
    it('calculates time for small change', () => {
      const template = DEFAULT_TEMPLATES[0];
      const time = calculateReviewTime(template, 3, 'small');
      expect(time).toBeGreaterThan(0);
    });

    it('calculates more time for large change', () => {
      const template = DEFAULT_TEMPLATES[0];
      const smallTime = calculateReviewTime(template, 3, 'small');
      const largeTime = calculateReviewTime(template, 3, 'large');
      expect(largeTime).toBeGreaterThan(smallTime);
    });
  });

  describe('getTemplate', () => {
    it('returns template by id', () => {
      const template = getTemplate('security-first');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Security First');
    });

    it('returns undefined for unknown id', () => {
      const template = getTemplate('unknown');
      expect(template).toBeUndefined();
    });
  });

  describe('customizeTemplate', () => {
    it('adds custom items to template', () => {
      const template = DEFAULT_TEMPLATES[0];
      const customItem = {
        id: 'custom-1',
        category: 'auth',
        question: 'Custom question?',
        severity: 'high' as const,
        required: true,
      };
      const customized = customizeTemplate(template, [customItem]);
      expect(customized.defaultItems.length).toBeGreaterThan(template.defaultItems.length);
    });
  });
});
