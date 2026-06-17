import { describe, it, expect } from 'vitest';
import { exportToJSON, exportToCSV, exportToMarkdown, exportToHTML, exportToYAML, generateFilename, createExportBundle } from './data-export';

describe('Data Export', () => {
  const sampleData = {
    repositories: [
      { name: 'repo1', stars: 100, forks: 20, openIssues: 5, language: 'TypeScript' },
      { name: 'repo2', stars: 50, forks: 10, openIssues: 2, language: 'JavaScript' },
    ],
    metadata: {
      exportedAt: '2024-01-15',
      version: '1.0.0',
      maintainer: 'testuser',
    },
  };

  describe('exportToJSON', () => {
    it('should export to JSON', () => {
      const json = exportToJSON(sampleData);
      expect(json).toContain('repo1');
      expect(json).toContain('"stars": 100');
    });

    it('should pretty print by default', () => {
      const json = exportToJSON(sampleData);
      expect(json).toContain('\n');
    });
  });

  describe('exportToCSV', () => {
    it('should export to CSV', () => {
      const csv = exportToCSV(sampleData.repositories);
      expect(csv).toContain('name,stars');
      expect(csv).toContain('repo1,100');
    });

    it('should handle specific columns', () => {
      const csv = exportToCSV(sampleData.repositories, ['name', 'stars']);
      expect(csv).toContain('name,stars');
      expect(csv).not.toContain('forks');
    });

    it('should handle empty data', () => {
      const csv = exportToCSV([]);
      expect(csv).toBe('');
    });
  });

  describe('exportToMarkdown', () => {
    it('should export to Markdown', () => {
      const md = exportToMarkdown(sampleData);
      expect(md).toContain('#');
      expect(md).toContain('| Name |');
    });

    it('should include metadata', () => {
      const md = exportToMarkdown(sampleData, 'Test Report');
      expect(md).toContain('Test Report');
      expect(md).toContain('testuser');
    });
  });

  describe('exportToHTML', () => {
    it('should export to HTML', () => {
      const html = exportToHTML(sampleData);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<table>');
      expect(html).toContain('repo1');
    });
  });

  describe('exportToYAML', () => {
    it('should export to YAML', () => {
      const yaml = exportToYAML(sampleData);
      expect(yaml).toContain('repositories:');
      expect(yaml).toContain('name: repo1');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with date', () => {
      const filename = generateFilename('report', 'json');
      expect(filename).toMatch(/^report-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should handle different formats', () => {
      expect(generateFilename('report', 'markdown')).toContain('.md');
      expect(generateFilename('report', 'csv')).toContain('.csv');
    });
  });

  describe('createExportBundle', () => {
    it('should create bundle with multiple formats', () => {
      const bundle = createExportBundle(sampleData, [
        { format: 'json' },
        { format: 'csv' },
        { format: 'markdown' },
      ]);
      expect(bundle.length).toBe(3);
      expect(bundle[0].format).toBe('json');
      expect(bundle[1].format).toBe('csv');
      expect(bundle[2].format).toBe('markdown');
    });
  });
});
