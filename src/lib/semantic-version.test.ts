import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticVersionManager } from './semantic-version';

describe('SemanticVersionManager', () => {
  let semver: SemanticVersionManager;

  beforeEach(() => {
    semver = new SemanticVersionManager();
  });

  describe('parseVersion', () => {
    it('should parse simple version', () => {
      const version = semver.parseVersion('1.2.3');
      expect(version).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it('should parse version with prerelease', () => {
      const version = semver.parseVersion('1.0.0-alpha.1');
      expect(version?.prerelease).toEqual(['alpha', '1']);
    });

    it('should parse version with build metadata', () => {
      const version = semver.parseVersion('1.0.0+build.123');
      expect(version?.buildMetadata).toBe('build.123');
    });

    it('should parse full version', () => {
      const version = semver.parseVersion('2.0.0-beta.1+build.456');
      expect(version?.major).toBe(2);
      expect(version?.minor).toBe(0);
      expect(version?.patch).toBe(0);
      expect(version?.prerelease).toEqual(['beta', '1']);
      expect(version?.buildMetadata).toBe('build.456');
    });

    it('should return null for invalid version', () => {
      expect(semver.parseVersion('invalid')).toBeNull();
    });
  });

  describe('formatVersion', () => {
    it('should format simple version', () => {
      const formatted = semver.formatVersion({ major: 1, minor: 2, patch: 3 });
      expect(formatted).toBe('1.2.3');
    });

    it('should format with prerelease', () => {
      const formatted = semver.formatVersion({ major: 1, minor: 0, patch: 0, prerelease: ['alpha'] });
      expect(formatted).toBe('1.0.0-alpha');
    });

    it('should format with build metadata', () => {
      const formatted = semver.formatVersion({ major: 1, minor: 0, patch: 0, buildMetadata: 'build.1' });
      expect(formatted).toBe('1.0.0+build.1');
    });
  });

  describe('compareVersions', () => {
    it('should compare major versions', () => {
      const v1 = semver.parseVersion('2.0.0')!;
      const v2 = semver.parseVersion('1.0.0')!;
      expect(semver.compareVersions(v1, v2)).toBeGreaterThan(0);
    });

    it('should compare minor versions', () => {
      const v1 = semver.parseVersion('1.2.0')!;
      const v2 = semver.parseVersion('1.1.0')!;
      expect(semver.compareVersions(v1, v2)).toBeGreaterThan(0);
    });

    it('should compare patch versions', () => {
      const v1 = semver.parseVersion('1.0.2')!;
      const v2 = semver.parseVersion('1.0.1')!;
      expect(semver.compareVersions(v1, v2)).toBeGreaterThan(0);
    });

    it('should consider prerelease lower', () => {
      const v1 = semver.parseVersion('1.0.0-alpha')!;
      const v2 = semver.parseVersion('1.0.0')!;
      expect(semver.compareVersions(v1, v2)).toBeLessThan(0);
    });
  });

  describe('bumpVersion', () => {
    it('should bump major version', () => {
      const v = { major: 1, minor: 2, patch: 3 };
      const bumped = semver.bumpVersion(v, { type: 'major' });
      expect(bumped.major).toBe(2);
      expect(bumped.minor).toBe(0);
      expect(bumped.patch).toBe(0);
    });

    it('should bump minor version', () => {
      const v = { major: 1, minor: 2, patch: 3 };
      const bumped = semver.bumpVersion(v, { type: 'minor' });
      expect(bumped.major).toBe(1);
      expect(bumped.minor).toBe(3);
      expect(bumped.patch).toBe(0);
    });

    it('should bump patch version', () => {
      const v = { major: 1, minor: 2, patch: 3 };
      const bumped = semver.bumpVersion(v, { type: 'patch' });
      expect(bumped.patch).toBe(4);
    });

    it('should add prerelease', () => {
      const v = { major: 1, minor: 0, patch: 0 };
      const bumped = semver.bumpVersion(v, { type: 'prerelease', prereleaseType: 'beta' });
      expect(bumped.prerelease).toEqual(['beta', '0']);
    });
  });

  describe('satisfies', () => {
    it('should satisfy exact match', () => {
      const v = semver.parseVersion('1.2.3')!;
      const range = semver.parseRange('1.2.3')!;
      expect(semver.satisfies(v, range)).toBe(true);
    });

    it('should satisfy greater than', () => {
      const v = semver.parseVersion('1.2.4')!;
      const range = semver.parseRange('>1.2.3')!;
      expect(semver.satisfies(v, range)).toBe(true);
    });

    it('should satisfy caret range', () => {
      const v1 = semver.parseVersion('1.2.3')!;
      const v2 = semver.parseVersion('1.9.9')!;
      const range = semver.parseRange('^1.2.0')!;
      expect(semver.satisfies(v1, range)).toBe(true);
      expect(semver.satisfies(v2, range)).toBe(true);
    });

    it('should satisfy tilde range', () => {
      const v1 = semver.parseVersion('1.2.3')!;
      const v2 = semver.parseVersion('1.3.0')!;
      const range = semver.parseRange('~1.2.0')!;
      expect(semver.satisfies(v1, range)).toBe(true);
      expect(semver.satisfies(v2, range)).toBe(false);
    });
  });

  describe('sortVersions', () => {
    it('should sort versions correctly', () => {
      const versions = [
        semver.parseVersion('2.0.0')!,
        semver.parseVersion('1.0.0')!,
        semver.parseVersion('1.5.0')!
      ];
      const sorted = semver.sortVersions(versions);
      expect(sorted[0].major).toBe(1);
      expect(sorted[2].major).toBe(2);
    });
  });

  describe('getLatest', () => {
    it('should return latest version', () => {
      const versions = [
        semver.parseVersion('1.0.0')!,
        semver.parseVersion('2.0.0')!,
        semver.parseVersion('1.5.0')!
      ];
      const latest = semver.getLatest(versions);
      expect(latest?.major).toBe(2);
    });

    it('should return null for empty array', () => {
      expect(semver.getLatest([])).toBeNull();
    });
  });

  describe('diff', () => {
    it('should detect major bump', () => {
      const v1 = semver.parseVersion('1.0.0')!;
      const v2 = semver.parseVersion('2.0.0')!;
      expect(semver.diff(v1, v2)).toBe('major');
    });

    it('should detect minor bump', () => {
      const v1 = semver.parseVersion('1.0.0')!;
      const v2 = semver.parseVersion('1.1.0')!;
      expect(semver.diff(v1, v2)).toBe('minor');
    });

    it('should detect patch bump', () => {
      const v1 = semver.parseVersion('1.0.0')!;
      const v2 = semver.parseVersion('1.0.1')!;
      expect(semver.diff(v1, v2)).toBe('patch');
    });
  });
});
