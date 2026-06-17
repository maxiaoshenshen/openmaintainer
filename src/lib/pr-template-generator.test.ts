import { describe, it, expect } from 'vitest';
import {
  createTemplate,
  generateTemplateMarkdown,
  validatePR,
  suggestLabels,
  parseConventionalPRTitle,
  generatePRFromTemplate,
  DEFAULT_SECTIONS,
  DEFAULT_CHECKLIST,
} from './pr-template-generator';

describe('pr-template-generator', () => {
  describe('createTemplate', () => {
    it('should create template with defaults', () => {
      const template = createTemplate();
      expect(template.name).toBe('Default PR Template');
      expect(template.sections.length).toBeGreaterThan(0);
    });

    it('should create custom template', () => {
      const template = createTemplate({
        name: 'Custom Template',
        labels: ['custom-label'],
      });
      expect(template.name).toBe('Custom Template');
      expect(template.labels).toContain('custom-label');
    });
  });

  describe('generateTemplateMarkdown', () => {
    it('should generate markdown', () => {
      const template = createTemplate();
      const md = generateTemplateMarkdown(template);
      expect(md).toContain('# Default PR Template');
      expect(md).toContain('## Summary');
      expect(md).toContain('## Changes Made');
    });

    it('should include checklist items', () => {
      const template = createTemplate();
      const md = generateTemplateMarkdown(template);
      expect(md).toContain('- [ ]');
    });
  });

  describe('validatePR', () => {
    it('should validate good PR', () => {
      const pr = { title: 'feat: add new feature', body: 'This adds a great new feature', labels: [], reviewers: [], assignees: [] };
      const result = validatePR(pr);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short titles', () => {
      const pr = { title: 'fix', body: 'This is a fix for something important', labels: [], reviewers: [], assignees: [] };
      const result = validatePR(pr);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('title'))).toBe(true);
    });

    it('should reject empty body', () => {
      const pr = { title: 'fix: some fix', body: '', labels: [], reviewers: [], assignees: [] };
      const result = validatePR(pr);
      expect(result.valid).toBe(false);
    });
  });

  describe('suggestLabels', () => {
    it('should suggest bug label', () => {
      const pr = { title: 'fix: issue', body: 'Fixed a bug', labels: [], reviewers: [], assignees: [] };
      const labels = suggestLabels(pr);
      expect(labels).toContain('bug');
    });

    it('should suggest enhancement label', () => {
      const pr = { title: 'feat: new feature', body: 'Added new feature', labels: [], reviewers: [], assignees: [] };
      const labels = suggestLabels(pr);
      expect(labels).toContain('enhancement');
    });

    it('should suggest breaking-change', () => {
      const pr = { title: 'feat!: breaking change', body: 'This is breaking', labels: [], reviewers: [], assignees: [] };
      const labels = suggestLabels(pr);
      expect(labels).toContain('breaking-change');
    });
  });

  describe('parseConventionalPRTitle', () => {
    it('should parse feat', () => {
      const result = parseConventionalPRTitle('feat: add new feature');
      expect(result.type).toBe('feat');
      expect(result.description).toBe('add new feature');
      expect(result.isBreaking).toBe(false);
    });

    it('should parse with scope', () => {
      const result = parseConventionalPRTitle('fix(api): fix endpoint');
      expect(result.type).toBe('fix');
      expect(result.scope).toBe('api');
    });

    it('should parse breaking', () => {
      const result = parseConventionalPRTitle('feat!: breaking change');
      expect(result.isBreaking).toBe(true);
    });

    it('should handle non-conventional titles', () => {
      const result = parseConventionalPRTitle('Some random title');
      expect(result.type).toBe('chore');
    });
  });

  describe('generatePRFromTemplate', () => {
    it('should generate PR from answers', () => {
      const template = createTemplate();
      const answers = {
        title: 'feat: add login',
        summary: 'Added login feature',
        changes: '- Created auth module\n- Added login form',
        testing: 'Added unit tests',
      };
      const pr = generatePRFromTemplate(template, answers);
      expect(pr.title).toBe('feat: add login');
      expect(pr.labels.length).toBeGreaterThan(0);
    });
  });
});
