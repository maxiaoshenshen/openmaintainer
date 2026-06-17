import { describe, it, expect } from 'vitest';
import { parseCommitForChangelog, generateChangelog, generateReleaseNotes, determineVersion } from './changelog-generator';

describe('Changelog Generator', () => {
  describe('parseCommitForChangelog', () => {
    it('should extract short description', () => {
      const result = parseCommitForChangelog('feat(auth): add login feature', 'feat');
      expect(result.shortDesc).toBe('add login feature');
    });

    it('should detect breaking changes', () => {
      const result = parseCommitForChangelog('feat(api)!: change response', 'feat');
      expect(result.breaking).toBe(true);
    });
  });

  describe('generateChangelog', () => {
    const sampleRelease = {
      version: '1.0.0',
      tag: 'v1.0.0',
      date: '2024-01-15',
      commits: [
        { sha: 'abc123', message: 'feat: add dark mode', author: 'Alice' },
        { sha: 'def456', message: 'fix: resolve login bug', author: 'Bob' },
        { sha: 'ghi789', message: 'docs: update README', author: 'Alice' },
      ],
    };

    it('should generate markdown changelog', () => {
      const changelog = generateChangelog([sampleRelease]);
      expect(changelog).toContain('# Changelog');
      expect(changelog).toContain('## 1.0.0');
      expect(changelog).toContain('add dark mode');
    });

    it('should include version and date', () => {
      const changelog = generateChangelog([sampleRelease]);
      expect(changelog).toContain('1.0.0');
      expect(changelog).toContain('2024-01-15');
    });
  });

  describe('generateReleaseNotes', () => {
    it('should generate release notes', () => {
      const release = {
        version: '2.0.0',
        tag: 'v2.0.0',
        date: '2024-02-01',
        commits: [
          { sha: '123', message: 'feat: major feature', author: 'Dev' },
        ],
      };
      const notes = generateReleaseNotes(release);
      expect(notes).toContain('# Release 2.0.0');
      expect(notes).toContain('2024-02-01');
    });
  });

  describe('determineVersion', () => {
    it('should bump major for breaking changes', () => {
      expect(determineVersion('1.0.0', ['feat!: breaking change'])).toBe('2.0.0');
    });

    it('should bump minor for features', () => {
      expect(determineVersion('1.0.0', ['feat: new feature'])).toBe('1.1.0');
    });

    it('should bump patch for fixes', () => {
      expect(determineVersion('1.0.0', ['fix: bug fix'])).toBe('1.0.1');
    });
  });
});
