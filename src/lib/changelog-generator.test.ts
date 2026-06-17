import { describe, it, expect } from 'vitest';
import { 
  parseCommits,
  generateChangelog,
  suggestVersion,
  bumpVersion,
  parseChangelog,
  validateChangelog
} from './changelog-generator';

describe('Changelog Generator', () => {
  const mockCommits = [
    { message: 'feat: add new feature' },
    { message: 'fix: fix a bug' },
    { message: 'docs: update documentation' },
    { message: 'perf: improve performance' },
    { message: 'BREAKING: breaking change' }
  ];

  describe('parseCommits', () => {
    it('should categorize commits correctly', () => {
      const changes = parseCommits(mockCommits);
      
      expect(changes.features).toContain('add new feature');
      expect(changes.bugfixes).toContain('fix a bug');
      expect(changes.documentation).toContain('update documentation');
      expect(changes.performance).toContain('improve performance');
      expect(changes.breaking).toContain('breaking change');
    });

    it('should handle scoped commits', () => {
      const scopedCommits = [
        { message: 'feat(auth): add login feature' }
      ];
      
      const changes = parseCommits(scopedCommits);
      
      expect(changes.features![0]).toContain('**auth:**');
    });
  });

  describe('generateChangelog', () => {
    it('should generate markdown changelog', () => {
      const entries = [{
        version: '1.0.0',
        date: '2024-01-01',
        type: 'major' as const,
        changes: parseCommits(mockCommits),
        contributors: ['@developer']
      }];
      
      const md = generateChangelog(entries);
      
      expect(md).toContain('# Changelog');
      expect(md).toContain('## [1.0.0]');
      expect(md).toContain('add new feature');
    });
  });

  describe('suggestVersion', () => {
    it('should suggest major for breaking changes', () => {
      const changes = { breaking: ['change'], features: [] };
      expect(suggestVersion('1.0.0', changes)).toBe('major');
    });

    it('should suggest minor for new features', () => {
      const changes = { breaking: [], features: ['new'] };
      expect(suggestVersion('1.0.0', changes)).toBe('minor');
    });

    it('should suggest patch for bugfixes only', () => {
      const changes = { breaking: [], features: [], bugfixes: ['fix'] };
      expect(suggestVersion('1.0.0', changes)).toBe('patch');
    });
  });

  describe('bumpVersion', () => {
    it('should bump major version', () => {
      expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0');
    });

    it('should bump minor version', () => {
      expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
    });

    it('should bump patch version', () => {
      expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
    });
  });

  describe('parseChangelog', () => {
    it('should parse existing changelog', () => {
      const content = `# Changelog

## [1.0.0] - 2024-01-01

### Features

- new feature
`;
      
      const entries = parseChangelog(content);
      
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].version).toBe('1.0.0');
    });
  });

  describe('validateChangelog', () => {
    it('should validate proper changelog', () => {
      const content = `# Changelog

## [1.0.0] - 2024-01-01

- change
`;
      
      const result = validateChangelog(content);
      
      expect(result.valid).toBe(true);
    });

    it('should reject invalid changelog', () => {
      const result = validateChangelog('invalid content');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
