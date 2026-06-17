import { describe, it, expect } from 'vitest';
import {
  parseTemplateVariables,
  renderTemplate,
  getBuiltInTemplates,
  searchTemplates,
  exportTemplate,
} from './template-engine';

describe('Template Engine', () => {
  describe('parseTemplateVariables', () => {
    it('should extract variables from template content', () => {
      const template = {
        id: 'test',
        name: 'Test',
        type: 'pr' as const,
        description: 'Test',
        content: '# {{title}}\n\n## {{section}}\n\n{{body}}',
        variables: [],
        category: 'Test',
        tags: [],
        language: 'en',
      };
      
      const vars = parseTemplateVariables(template);
      
      expect(vars.length).toBe(3);
      expect(vars.map(v => v.name)).toContain('title');
      expect(vars.map(v => v.name)).toContain('section');
      expect(vars.map(v => v.name)).toContain('body');
    });
  });

  describe('renderTemplate', () => {
    it('should render template with variables', () => {
      const template = {
        id: 'test',
        name: 'Test',
        type: 'pr' as const,
        description: 'Test',
        content: '# {{title}}\n\n{{description}}',
        variables: [],
        category: 'Test',
        tags: [],
        language: 'en',
      };
      
      const result = renderTemplate(template, {
        title: 'Test PR',
        description: 'This is a test',
      });
      
      expect(result).toContain('Test PR');
      expect(result).toContain('This is a test');
    });

    it('should handle default values', () => {
      const template = {
        id: 'test',
        name: 'Test',
        type: 'pr' as const,
        description: 'Test',
        content: '{{title:Default Title}}',
        variables: [],
        category: 'Test',
        tags: [],
        language: 'en',
      };
      
      const result = renderTemplate(template, {});
      expect(result).toBe('Default Title');
    });

    it('should handle array variables', () => {
      const template = {
        id: 'test',
        name: 'Test',
        type: 'issue' as const,
        description: 'Test',
        content: 'Related: {{issues}}',
        variables: [],
        category: 'Test',
        tags: [],
        language: 'en',
      };
      
      const result = renderTemplate(template, {
        issues: ['#1', '#2', '#3'],
      });
      
      expect(result).toContain('#1, #2, #3');
    });
  });

  describe('getBuiltInTemplates', () => {
    it('should return templates in English by default', () => {
      const templates = getBuiltInTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].language).toBe('en');
    });

    it('should return templates in Chinese when specified', () => {
      const templates = getBuiltInTemplates('zh');
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].language).toBe('zh');
      expect(templates[0].name).toContain('PR');
    });
  });

  describe('searchTemplates', () => {
    it('should filter templates by query', () => {
      const templates = getBuiltInTemplates();
      const results = searchTemplates(templates, 'security');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter templates by type', () => {
      const templates = getBuiltInTemplates();
      const results = searchTemplates(templates, '', { type: 'pr' });
      
      expect(results.every(t => t.type === 'pr')).toBe(true);
    });
  });

  describe('exportTemplate', () => {
    it('should export template as markdown', () => {
      const template = getBuiltInTemplates()[0];
      const md = exportTemplate(template, 'md');
      
      expect(md).toContain('# ');
    });
  });
});
