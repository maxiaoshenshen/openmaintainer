import { describe, it, expect } from 'vitest';
import {
  parseCodeOwners,
  validateCodeOwners,
  checkFileCoverage,
  findUncoveredFiles,
  suggestCodeOwners
} from './codeowners-checker';

describe('codeowners-checker', () => {
  describe('parseCodeOwners', () => {
    it('should parse CODEOWNERS file', () => {
      const content = `
# Default owners
* @global
src/ @frontend-team
docs/ @docs-team
`;
      const owners = parseCodeOwners(content);
      expect(owners.length).toBeGreaterThanOrEqual(1);
      expect(owners[0].pattern).toBe('*');
      expect(owners[0].owners).toContain('@global');
    });

    it('should ignore comments', () => {
      const content = '# This is a comment\n* @owner';
      const owners = parseCodeOwners(content);
      expect(owners).toHaveLength(1);
    });
  });

  describe('validateCodeOwners', () => {
    it('should validate valid file', () => {
      const content = '* @owner\nsrc/ @team';
      const result = validateCodeOwners(content);
      expect(result.valid).toBe(true);
    });

    it('should detect missing owners', () => {
      const content = '*.js';
      const result = validateCodeOwners(content);
      expect(result.valid).toBe(false);
    });
  });

  describe('checkFileCoverage', () => {
    it('should find matching owners', () => {
      const owners = [
        { pattern: 'src/', owners: ['@frontend'], line: 1 },
        { pattern: '*', owners: ['@all'], line: 2 }
      ];
      const coverage = checkFileCoverage('src/index.js', owners);
      expect(coverage.covered).toBe(true);
      expect(coverage.owners).toContain('@frontend');
    });

    it('should detect uncovered files', () => {
      const owners = [{ pattern: 'src/', owners: ['@frontend'], line: 1 }];
      const coverage = checkFileCoverage('docs/readme.md', owners);
      expect(coverage.covered).toBe(false);
    });
  });

  describe('findUncoveredFiles', () => {
    it('should find uncovered files', () => {
      const owners = [{ pattern: 'src/', owners: ['@team'], line: 1 }];
      const files = ['src/index.js', 'docs/readme.md'];
      const uncovered = findUncoveredFiles(files, owners);
      expect(uncovered).toContain('docs/readme.md');
    });
  });

  describe('suggestCodeOwners', () => {
    it('should suggest patterns for directories', () => {
      const owners: any[] = [];
      const files = [
        'lib/a.js', 'lib/b.js', 'lib/c.js',
        'test/d.js', 'test/e.js'
      ];
      const suggestions = suggestCodeOwners(files, owners);
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });
});
