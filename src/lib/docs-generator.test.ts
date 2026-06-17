import { describe, it, expect } from 'vitest';
import {
  generateAPIDocs,
  generateReadme,
  generateContributionGuide,
  generateArchitectureDoc,
  generateDocs
} from './docs-generator';

describe('docs-generator', () => {
  describe('generateAPIDocs', () => {
    it('should generate API documentation', () => {
      const docs = generateAPIDocs(['getUser', 'createPost']);
      expect(docs).toHaveLength(2);
      expect(docs[0].name).toBe('getUser');
      expect(docs[1].name).toBe('createPost');
    });

    it('should include examples', () => {
      const docs = generateAPIDocs(['testFn']);
      expect(docs[0].examples).toContain('// Example usage of testFn\ntestFn();');
    });
  });

  describe('generateReadme', () => {
    it('should generate README content', () => {
      const readme = generateReadme({
        name: 'test-package',
        description: 'A test package',
        features: ['Feature 1', 'Feature 2'],
        installation: 'npm install test-package',
        quickStart: 'import test from "test-package";'
      });

      expect(readme).toContain('# test-package');
      expect(readme).toContain('A test package');
      expect(readme).toContain('- Feature 1');
    });
  });

  describe('generateContributionGuide', () => {
    it('should generate English guide by default', () => {
      const guide = generateContributionGuide({ repoUrl: 'https://github.com/test/test', language: 'en' });
      expect(guide.gettingStarted).toContain('Fork the repository');
    });

    it('should generate Chinese guide', () => {
      const guide = generateContributionGuide({ repoUrl: 'https://github.com/test/test', language: 'zh' });
      expect(guide.gettingStarted).toContain('Fork 本仓库');
    });
  });

  describe('generateArchitectureDoc', () => {
    it('should generate architecture documentation', () => {
      const doc = generateArchitectureDoc([
        { name: 'API', responsibility: 'Handle HTTP requests', dependencies: ['Auth'] }
      ]);
      expect(doc).toContain('### API');
      expect(doc).toContain('Handle HTTP requests');
    });
  });

  describe('generateDocs', () => {
    it('should generate multiple documents', () => {
      const docs = generateDocs({
        name: 'test-repo',
        description: 'Test repository',
        functions: ['fn1', 'fn2']
      }, {
        language: 'en',
        include: ['readme', 'api'],
        format: 'md'
      });

      expect(docs.length).toBeGreaterThanOrEqual(1);
      expect(docs.some(d => d.path === 'README.md')).toBe(true);
    });

    it('should include security policy when requested', () => {
      const docs = generateDocs({
        name: 'test-repo',
        description: 'Test'
      }, {
        language: 'en',
        include: ['security'],
        format: 'md'
      });

      expect(docs.some(d => d.path === 'SECURITY.md')).toBe(true);
    });
  });
});
