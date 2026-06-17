import { describe, it, expect } from 'vitest';
import { ChangelogGenerator, ChangeEntry } from './changelog-generator';

describe('ChangelogGenerator', () => {
  const generator = new ChangelogGenerator();

  const mockEntries: ChangeEntry[] = [
    { type: 'feature', scope: 'api', description: 'Add new REST endpoints' },
    { type: 'fix', scope: 'auth', description: 'Fix token expiration bug' },
    { type: 'docs', description: 'Update API documentation' },
    { type: 'breaking', scope: 'core', description: 'Remove deprecated methods' },
  ];

  it('should generate changelog entry', async () => {
    const entry = await generator.generateChangelog('repo-1', mockEntries, '1.0.0');
    expect(entry.version).toBe('1.0.0');
    expect(entry.changes.length).toBe(3);
    expect(entry.breakingChanges.length).toBe(1);
  });

  it('should get changelog by repo', async () => {
    await generator.generateChangelog('repo-2', mockEntries, '1.0.0');
    const changelog = await generator.getChangelog('repo-2');
    expect(Array.isArray(changelog)).toBe(true);
    expect((changelog as any[]).length).toBe(1);
  });

  it('should get changelog by version', async () => {
    await generator.generateChangelog('repo-3', mockEntries, '2.0.0');
    const entry = await generator.getChangelog('repo-3', '2.0.0');
    expect(entry).not.toBeNull();
    expect((entry as any).version).toBe('2.0.0');
  });

  it('should format changelog as markdown', async () => {
    await generator.generateChangelog('repo-4', mockEntries, '1.0.0');
    const md = await generator.formatChangelogMarkdown('repo-4');
    expect(md).toContain('# Changelog');
    expect(md).toContain('## 1.0.0');
    expect(md).toContain('Feature');
    expect(md).toContain('Fix');
  });

  it('should generate release notes', async () => {
    await generator.generateChangelog('repo-5', mockEntries, '1.0.0');
    const notes = await generator.generateReleaseNotes('repo-5', '1.0.0');
    expect(notes).toContain('# Release 1.0.0');
    expect(notes).toContain('New Features');
    expect(notes).toContain('Bug Fixes');
  });

  it('should handle multiple versions', async () => {
    await generator.generateChangelog('repo-6', mockEntries, '1.0.0');
    await generator.generateChangelog('repo-6', mockEntries, '1.1.0');
    const changelog = await generator.getChangelog('repo-6') as any[];
    expect(changelog.length).toBe(2);
  });

  it('should return null for non-existent repo', async () => {
    const result = await generator.getChangelog('nonexistent');
    expect(result).toBeNull();
  });

  it('should return null for non-existent version', async () => {
    await generator.generateChangelog('repo-7', mockEntries, '1.0.0');
    const result = await generator.getChangelog('repo-7', '2.0.0');
    expect(result).toBeNull();
  });

  it('should handle empty changelog in markdown', async () => {
    const md = await generator.formatChangelogMarkdown('empty-repo');
    expect(md).toContain('No releases yet');
  });

  it('should handle release notes for non-existent version', async () => {
    const notes = await generator.generateReleaseNotes('repo-8', '1.0.0');
    expect(notes).toContain('No release notes available');
  });
});
