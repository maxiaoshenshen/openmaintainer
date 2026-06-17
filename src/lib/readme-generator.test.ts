import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReadmeGenerator, ReadmeConfig } from './readme-generator';
import { GitHubClient } from './github-client';

describe('ReadmeGenerator', () => {
  let generator: ReadmeGenerator;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {
      getFile: vi.fn().mockRejectedValue(new Error('Not found')),
    } as unknown as GitHubClient;
    generator = new ReadmeGenerator(mockGithub);
  });

  describe('generate', () => {
    it('should generate complete README', async () => {
      const config: ReadmeConfig = {
        projectName: 'test-project',
        description: 'A test project'
      };

      const readme = await generator.generate(config);

      expect(readme).toContain('# test-project');
      expect(readme).toContain('## About');
      expect(readme).toContain('## Installation');
      expect(readme).toContain('## Usage');
    });

    it('should include badges when configured', async () => {
      const config: ReadmeConfig = {
        projectName: 'test',
        description: 'Test',
        includeBadges: true
      };

      const readme = await generator.generate(config);

      expect(readme).toContain('License');
    });

    it('should exclude TOC when disabled', async () => {
      const config: ReadmeConfig = {
        projectName: 'test',
        description: 'Test',
        includeToc: false
      };

      const readme = await generator.generate(config);

      expect(readme).not.toContain('Table of Contents');
    });
  });

  describe('generateMinimal', () => {
    it('should generate minimal README', async () => {
      const readme = await generator.generateMinimal('MyProject');

      expect(readme).toContain('# MyProject');
      expect(readme).toContain('npm install');
    });
  });

  describe('generateApiDocs', () => {
    it('should generate API documentation', async () => {
      const endpoints = [
        { method: 'GET', path: '/users', description: 'Get all users' },
        { method: 'POST', path: '/users', description: 'Create a user' }
      ];

      const docs = await generator.generateApiDocs('API', endpoints);

      expect(docs).toContain('# API');
      expect(docs).toContain('GET');
      expect(docs).toContain('/users');
      expect(docs).toContain('Endpoints');
    });
  });

  describe('getTemplates', () => {
    it('should return available templates', () => {
      const templates = generator.getTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('sections');
    });

    it('should include minimal template', () => {
      const templates = generator.getTemplates();
      const minimal = templates.find(t => t.name === 'minimal');

      expect(minimal).toBeDefined();
      expect(minimal?.description).toBeTruthy();
    });
  });

  describe('updateExisting', () => {
    it('should handle missing existing README', async () => {
      vi.mocked(mockGithub.getFile).mockRejectedValue(new Error('Not found'));

      const sections = [{ type: 'custom', content: '# Additional Section', order: 100 }];
      const result = await generator.updateExisting(sections);

      expect(result).toContain('Additional Section');
    });

    it('should append to existing README', async () => {
      vi.mocked(mockGithub.getFile).mockResolvedValue('# Existing README' as any);

      const sections = [{ type: 'custom', content: '# New Section', order: 1 }];
      const result = await generator.updateExisting(sections);

      expect(result).toContain('Existing README');
      expect(result).toContain('New Section');
    });
  });
});
