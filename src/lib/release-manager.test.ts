import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  formatVersion,
  bumpVersion,
  compareVersions,
  parseConventionalCommit,
  generateChangelog,
  validateChangelogEntry,
  suggestNextVersion,
} from './release-manager';

describe('Release Manager', () => {
  describe('parseVersion', () => {
    it('should parse standard version', () => {
      const v = parseVersion('1.2.3');
      expect(v.major).toBe(1);
      expect(v.minor).toBe(2);
      expect(v.patch).toBe(3);
      expect(v.preRelease).toBeUndefined();
    });

    it('should parse prerelease version', () => {
      const v = parseVersion('1.2.3-beta.5');
      expect(v.major).toBe(1);
      expect(v.preRelease).toEqual({ type: 'beta', version: 5 });
    });

    it('should throw on invalid format', () => {
      expect(() => parseVersion('invalid')).toThrow();
    });
  });

  describe('formatVersion', () => {
    it('should format standard version', () => {
      expect(formatVersion({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3');
    });

    it('should format prerelease version', () => {
      expect(formatVersion({ major: 1, minor: 2, patch: 3, preRelease: { type: 'alpha', version: 1 } }))
        .toBe('1.2.3-alpha.1');
    });
  });

  describe('bumpVersion', () => {
    it('should bump major version', () => {
      const v = bumpVersion({ major: 1, minor: 2, patch: 3 }, 'major');
      expect(v).toEqual({ major: 2, minor: 0, patch: 0 });
    });

    it('should bump minor version', () => {
      const v = bumpVersion({ major: 1, minor: 2, patch: 3 }, 'minor');
      expect(v).toEqual({ major: 1, minor: 3, patch: 0 });
    });

    it('should bump patch version', () => {
      const v = bumpVersion({ major: 1, minor: 2, patch: 3 }, 'patch');
      expect(v).toEqual({ major: 1, minor: 2, patch: 4 });
    });

    it('should increment prerelease', () => {
      const v = bumpVersion({ major: 1, minor: 0, patch: 0, preRelease: { type: 'alpha', version: 1 } }, 'alpha');
      expect(v.preRelease?.version).toBe(2);
    });
  });

  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      expect(compareVersions({ major: 2, minor: 0, patch: 0 }, { major: 1, minor: 9, patch: 9 })).toBeGreaterThan(0);
      expect(compareVersions({ major: 1, minor: 2, patch: 3 }, { major: 1, minor: 2, patch: 3 })).toBe(0);
    });

    it('should handle prerelease ordering', () => {
      expect(compareVersions({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 0, preRelease: { type: 'alpha', version: 1 } }))
        .toBeGreaterThan(0);
    });
  });

  describe('parseConventionalCommit', () => {
    it('should parse feat commit', () => {
      const entry = parseConventionalCommit('feat(auth): add login');
      expect(entry?.type).toBe('feat');
      expect(entry?.scope).toBe('auth');
      expect(entry?.message).toBe('add login');
    });

    it('should parse breaking commit', () => {
      const entry = parseConventionalCommit('feat!: breaking change');
      expect(entry?.type).toBe('breaking');
      expect(entry?.message).toContain('breaking change');
    });

    it('should return null for invalid format', () => {
      expect(parseConventionalCommit('invalid')).toBeNull();
    });
  });

  describe('generateChangelog', () => {
    it('should generate changelog', () => {
      const entries = [
        { type: 'feat' as const, message: 'new feature', commit: 'feat: new feature' },
        { type: 'fix' as const, message: 'bug fix', commit: 'fix: bug fix' },
      ];
      const version = { major: 1, minor: 0, patch: 0 };
      const changelog = generateChangelog(entries, version);
      expect(changelog).toContain('## 1.0.0');
      expect(changelog).toContain('Features');
      expect(changelog).toContain('Bug Fixes');
    });

    it('should generate Chinese changelog', () => {
      const entries = [{ type: 'feat' as const, message: 'feature', commit: 'feat: feature' }];
      const version = { major: 1, minor: 0, patch: 0 };
      const changelog = generateChangelog(entries, version, { language: 'zh' });
      expect(changelog).toContain('新功能');
    });
  });

  describe('validateChangelogEntry', () => {
    it('should validate correct entry', () => {
      expect(validateChangelogEntry('feat: add feature')).toEqual({ valid: true });
    });

    it('should reject empty entry', () => {
      expect(validateChangelogEntry('')).toEqual({ valid: false, error: 'Empty entry' });
    });

    it('should reject invalid format', () => {
      expect(validateChangelogEntry('random text')).toEqual({ valid: false, error: 'Must follow conventional commits format' });
    });
  });

  describe('suggestNextVersion', () => {
    it('should suggest major for breaking changes', () => {
      const commits = ['feat!: breaking', 'fix: something'];
      const current = { major: 1, minor: 2, patch: 3 };
      const next = suggestNextVersion(commits, current);
      expect(next.major).toBe(2);
    });

    it('should suggest minor for features', () => {
      const commits = ['feat: new feature'];
      const current = { major: 1, minor: 2, patch: 3 };
      const next = suggestNextVersion(commits, current);
      expect(next.minor).toBe(3);
    });

    it('should suggest patch for fixes', () => {
      const commits = ['fix: bug'];
      const current = { major: 1, minor: 2, patch: 3 };
      const next = suggestNextVersion(commits, current);
      expect(next.patch).toBe(4);
    });
  });
});
