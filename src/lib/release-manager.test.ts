import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  formatVersion,
  bumpVersion,
  determineReleaseType,
  generateReleaseNotes,
  checkReleaseReadiness,
  createRelease
} from './release-manager';

describe('release-manager', () => {
  describe('parseVersion', () => {
    it('should parse valid version', () => {
      const version = parseVersion('1.2.3');
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
    });

    it('should parse prerelease version', () => {
      const version = parseVersion('1.0.0-alpha.1');
      expect(version.prerelease).toBe('alpha.1');
    });
  });

  describe('formatVersion', () => {
    it('should format version to string', () => {
      const version = { major: 1, minor: 2, patch: 3 };
      expect(formatVersion(version)).toBe('1.2.3');
    });

    it('should include prerelease', () => {
      const version = { major: 1, minor: 0, patch: 0, prerelease: 'beta.1' };
      expect(formatVersion(version)).toBe('1.0.0-beta.1');
    });
  });

  describe('bumpVersion', () => {
    it('should bump major version', () => {
      const v = { major: 1, minor: 2, patch: 3 };
      const bumped = bumpVersion(v, 'major');
      expect(bumped.major).toBe(2);
      expect(bumped.minor).toBe(0);
    });

    it('should bump minor version', () => {
      const v = { major: 1, minor: 2, patch: 3 };
      const bumped = bumpVersion(v, 'minor');
      expect(bumped.minor).toBe(3);
      expect(bumped.patch).toBe(0);
    });

    it('should bump patch version', () => {
      const v = { major: 1, minor: 2, patch: 3 };
      const bumped = bumpVersion(v, 'patch');
      expect(bumped.patch).toBe(4);
    });
  });

  describe('determineReleaseType', () => {
    it('should return major for breaking changes', () => {
      expect(determineReleaseType(['feat!: breaking'])).toBe('major');
    });

    it('should return minor for features', () => {
      expect(determineReleaseType(['feat: new feature'])).toBe('minor');
    });

    it('should return patch for fixes', () => {
      expect(determineReleaseType(['fix: bug fix'])).toBe('patch');
    });
  });

  describe('createRelease', () => {
    it('should create release object', () => {
      const release = createRelease('1.0.0', ['Change 1', 'Change 2']);
      expect(release.version).toBe('1.0.0');
      expect(release.tag).toBe('v1.0.0');
      expect(release.changes).toHaveLength(2);
    });
  });

  describe('checkReleaseReadiness', () => {
    it('should detect missing version', () => {
      const release = { version: '', tag: '', date: new Date(), notes: 'Notes', changes: [], isPrerelease: false, isDraft: false };
      const { ready } = checkReleaseReadiness(release);
      expect(ready).toBe(false);
    });

    it('should be ready with valid release', () => {
      const release = { version: '1.0.0', tag: 'v1.0.0', date: new Date(), notes: 'Great release', changes: ['Fix'], isPrerelease: false, isDraft: false };
      const { ready } = checkReleaseReadiness(release);
      expect(ready).toBe(true);
    });
  });
});
