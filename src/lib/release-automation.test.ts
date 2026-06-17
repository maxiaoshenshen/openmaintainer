import { describe, it, expect } from 'vitest';
import {
  suggestReleaseVersion,
  generateReleaseNotes,
  validateRelease,
  parseConventionalCommit,
} from './release-automation';

describe('Release Automation', () => {
  describe('suggestReleaseVersion', () => {
    it('should suggest patch for bug fixes', () => {
      const result = suggestReleaseVersion({
        currentVersion: 'v1.2.3',
        commits: ['fix: resolve null pointer'],
        prDescriptions: ['fix: resolve null pointer'],
      });

      expect(result.suggestedVersion).toBe('v1.2.4');
      expect(result.releaseType).toBe('patch');
    });

    it('should suggest minor for new features', () => {
      const result = suggestReleaseVersion({
        currentVersion: 'v1.2.3',
        commits: ['feat: add new command'],
        prDescriptions: ['feat: add new command'],
      });

      expect(result.suggestedVersion).toBe('v1.3.0');
      expect(result.releaseType).toBe('minor');
    });

    it('should suggest major for breaking changes', () => {
      const result = suggestReleaseVersion({
        currentVersion: 'v2.5.0',
        commits: ['BREAKING: change API'],
        prDescriptions: ['breaking: change API signature'],
      });

      expect(result.suggestedVersion).toBe('v3.0.0');
      expect(result.releaseType).toBe('major');
    });

    it('should include required checklist items', () => {
      const result = suggestReleaseVersion({
        currentVersion: 'v1.0.0',
        commits: [],
        prDescriptions: [],
      });

      expect(result.checklist.some(i => i.id === 'tests')).toBe(true);
      expect(result.checklist.some(i => i.id === 'changelog')).toBe(true);
      expect(result.checklist.some(i => i.id === 'version')).toBe(true);
    });

    it('should add migration guide for breaking changes', () => {
      const result = suggestReleaseVersion({
        currentVersion: 'v1.0.0',
        commits: ['BREAKING CHANGE'],
        prDescriptions: ['breaking: new API'],
      });

      expect(result.checklist.some(i => i.id === 'migration')).toBe(true);
    });
  });

  describe('generateReleaseNotes', () => {
    it('should generate structured release notes', () => {
      const notes = generateReleaseNotes({
        version: 'v1.2.0',
        entries: [
          { type: 'feature', scope: 'auth', description: 'Add OAuth support' },
          { type: 'fix', scope: 'ui', description: 'Fix button alignment' },
        ],
        contributors: ['alice', 'bob'],
        stats: { additions: 500, deletions: 100 },
        config: {
          owner: 'test',
          repo: 'project',
          defaultBranch: 'main',
          changelogTemplate: '',
        },
      });

      expect(notes).toContain('# v1.2.0');
      expect(notes).toContain('## ✨ Features');
      expect(notes).toContain('## 🐛 Bug Fixes');
      expect(notes).toContain('## ❤️ Contributors');
    });

    it('should separate breaking changes', () => {
      const notes = generateReleaseNotes({
        version: 'v2.0.0',
        entries: [
          { type: 'breaking', description: 'Remove old API' },
          { type: 'feature', description: 'New API' },
        ],
        contributors: ['maintainer'],
        stats: { additions: 200, deletions: 300 },
        config: {
          owner: 'test',
          repo: 'project',
          defaultBranch: 'main',
          changelogTemplate: '',
        },
      });

      expect(notes).toContain('## ⚠️ Breaking Changes');
      expect(notes).toContain('Remove old API');
    });
  });

  describe('validateRelease', () => {
    it('should be ready when all items complete', () => {
      const plan = suggestReleaseVersion({
        currentVersion: 'v1.0.0',
        commits: [],
        prDescriptions: [],
      });

      const result = validateRelease({
        plan,
        completedChecklist: plan.checklist.map(i => i.id),
        testsPassed: true,
        ciPassed: true,
      });

      expect(result.ready).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should report missing items', () => {
      const plan = suggestReleaseVersion({
        currentVersion: 'v1.0.0',
        commits: [],
        prDescriptions: [],
      });

      const result = validateRelease({
        plan,
        completedChecklist: [],
        testsPassed: true,
        ciPassed: true,
      });

      expect(result.ready).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });
  });

  describe('parseConventionalCommit', () => {
    it('should parse feat commits', () => {
      const result = parseConventionalCommit('feat(auth): add login');
      expect(result?.type).toBe('feature');
      expect(result?.scope).toBe('auth');
      expect(result?.description).toBe('add login');
    });

    it('should parse fix commits', () => {
      const result = parseConventionalCommit('fix(ui): fix button');
      expect(result?.type).toBe('fix');
    });

    it('should detect breaking commits', () => {
      const result = parseConventionalCommit('feat!: breaking change');
      expect(result?.type).toBe('breaking');
    });

    it('should return null for invalid format', () => {
      const result = parseConventionalCommit('random text');
      expect(result).toBeNull();
    });
  });
});
