import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReleaseNotesGenerator, ReleaseNote } from './release-notes-generator';
import { GitHubClient } from './github-client';

describe('ReleaseNotesGenerator', () => {
  let generator: ReleaseNotesGenerator;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {
      getCommits: vi.fn().mockResolvedValue([
        { sha: 'abc123', commit: { message: 'feat: add new feature (#1)' }, author: { login: 'user1' } },
        { sha: 'def456', commit: { message: 'fix: resolve bug (#2)' }, author: { login: 'user2' } }
      ]),
      getPullRequest: vi.fn().mockResolvedValue({ number: 1, title: 'Add feature', labels: [{ name: 'feature' }] }),
      getReleases: vi.fn().mockResolvedValue([]),
    } as unknown as GitHubClient;
    generator = new ReleaseNotesGenerator(mockGithub);
  });

  describe('generateReleaseNotes', () => {
    it('should generate release notes', async () => {
      const notes = await generator.generateReleaseNotes('v1.0.0');

      expect(notes.version).toBe('v1.0.0');
      expect(notes.date).toBeTruthy();
      expect(notes.totalChanges).toBeGreaterThan(0);
    });

    it('should categorize changes', async () => {
      const notes = await generator.generateReleaseNotes('v1.0.0');

      expect(notes.sections.length).toBeGreaterThan(0);
      expect(notes.sections[0]).toHaveProperty('title');
      expect(notes.sections[0]).toHaveProperty('type');
      expect(notes.sections[0]).toHaveProperty('items');
    });

    it('should extract contributors', async () => {
      const notes = await generator.generateReleaseNotes('v1.0.0');

      expect(notes.contributors).toContain('user1');
      expect(notes.contributors).toContain('user2');
    });
  });

  describe('toMarkdown', () => {
    it('should convert to markdown', () => {
      const notes: ReleaseNote = {
        version: 'v1.0.0',
        date: '2024-01-01',
        title: 'Release v1.0.0',
        sections: [{ title: 'Added', type: 'added', items: ['New feature'] }],
        contributors: ['user1'],
        totalChanges: 1
      };

      const markdown = generator.toMarkdown(notes);

      expect(markdown).toContain('Release v1.0.0');
      expect(markdown).toContain('Added');
      expect(markdown).toContain('New feature');
    });
  });

  describe('generateKeepAChangelog', () => {
    it('should generate keepachangelog format', async () => {
      const changelog = await generator.generateKeepAChangelog('v1.0.0');

      expect(changelog).toContain('v1.0.0');
      expect(changelog).toContain('🆕');
    });
  });

  describe('generateMarkdown', () => {
    it('should return markdown string', async () => {
      const markdown = await generator.generateMarkdown('v1.0.0');

      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('generateGitHubReleaseBody', () => {
    it('should generate GitHub release body', async () => {
      const body = await generator.generateGitHubReleaseBody('v1.0.0');

      expect(body).toContain('##');
      expect(body).toContain('-');
    });
  });
});
