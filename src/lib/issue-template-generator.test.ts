import { describe, it, expect } from 'vitest';
import {
  createBugTemplate,
  createFeatureTemplate,
  createQuestionTemplate,
  createSchema,
  generateIssueFromTemplate,
  getDefaultTemplates
} from './issue-template-generator';

describe('issue-template-generator', () => {
  describe('createBugTemplate', () => {
    it('should create bug template', () => {
      const tmpl = createBugTemplate();
      expect(tmpl.name).toBe('Bug Report');
      expect(tmpl.labels).toContain('bug');
      expect(tmpl.body).toContain('Description');
    });
  });

  describe('createFeatureTemplate', () => {
    it('should create feature template', () => {
      const tmpl = createFeatureTemplate();
      expect(tmpl.name).toBe('Feature Request');
      expect(tmpl.labels).toContain('enhancement');
    });
  });

  describe('createQuestionTemplate', () => {
    it('should create question template', () => {
      const tmpl = createQuestionTemplate();
      expect(tmpl.name).toBe('Question');
      expect(tmpl.labels).toContain('question');
    });
  });

  describe('createSchema', () => {
    it('should create template schema', () => {
      const schema = createSchema('Test', 'Test schema', [
        { title: 'Title', inputType: 'text' as const, required: true },
        { title: 'Description', inputType: 'textarea' as const, required: true }
      ]);
      expect(schema.name).toBe('Test');
      expect(schema.variables.length).toBe(2);
    });
  });

  describe('generateIssueFromTemplate', () => {
    it('should generate issue from template', () => {
      const tmpl = createBugTemplate();
      const issue = generateIssueFromTemplate(tmpl, { title: 'Test Bug' });
      expect(issue.title).toContain('Test Bug');
      expect(issue.labels).toContain('bug');
    });
  });

  describe('getDefaultTemplates', () => {
    it('should return default templates', () => {
      const templates = getDefaultTemplates();
      expect(templates.length).toBe(4);
      expect(templates.map(t => t.name)).toContain('Bug Report');
    });
  });
});
