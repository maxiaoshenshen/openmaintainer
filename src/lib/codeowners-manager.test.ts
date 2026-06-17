import { describe, it, expect } from 'vitest';
import {
  parseCodeowners,
  generateCodeowners,
  validateCodeowners,
  findOwners,
  suggestOwnership,
  detectUnownedPaths
} from './codeowners-manager';

describe('codeowners-manager', () => {
  describe('parseCodeowners', () => {
    it('should parse codeowners file', () => {
      const content = `
# This is a comment
*.js @owner1 @owner2
/src @maintainer
docs/ @docs-team
`;
      const entries = parseCodeowners(content);
      expect(entries).toHaveLength(3);
      expect(entries[0].path).toBe('*.js');
      expect(entries[0].owners).toContain('@owner1');
    });
  });

  describe('generateCodeowners', () => {
    it('should generate codeowners content', () => {
      const rules = [
        { pattern: '*.js', owners: ['@js-team'], description: 'JavaScript files' },
        { pattern: '*.ts', owners: ['@ts-team'] }
      ];
      const content = generateCodeowners(rules);
      expect(content).toContain('*.js');
      expect(content).toContain('@js-team');
    });
  });

  describe('validateCodeowners', () => {
    it('should validate entries', () => {
      const entries = [
        { path: '*', owners: ['@default'], isActive: true },
        { path: 'src', owners: ['@dev'], isActive: true }
      ];
      const result = validateCodeowners(entries);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findOwners', () => {
    it('should find owners for file', () => {
      const entries = [
        { path: '*.js', owners: ['@js-team'], isActive: true },
        { path: 'src/*', owners: ['@src-team'], isActive: true }
      ];
      const owners = findOwners(entries, 'src/app.js');
      expect(owners).toContain('@src-team');
    });
  });

  describe('suggestOwnership', () => {
    it('should suggest ownership based on history', () => {
      const recentChanges = [
        { author: 'alice', path: 'src/app.js' },
        { author: 'alice', path: 'src/app.js' },
        { author: 'bob', path: 'src/app.js' }
      ];
      const suggestions = suggestOwnership('src/app.js', recentChanges);
      expect(suggestions[0]).toBe('alice');
    });
  });

  describe('detectUnownedPaths', () => {
    it('should detect unowned paths', () => {
      const entries = [
        { path: 'src/*', owners: ['@team'], isActive: true }
      ];
      const allPaths = ['src/app.js', 'docs/readme.md'];
      const unowned = detectUnownedPaths(entries, allPaths);
      expect(unowned).toContain('docs/readme.md');
    });
  });
});
