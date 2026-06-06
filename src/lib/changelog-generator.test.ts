import { describe, it, expect } from 'vitest';
import { generateChangelog, formatChangelogMarkdown, formatChangelogKeepAChangelog } from './changelog-generator';

describe('Changelog Generator', () => {
  it('generates changelog', () => {
    const changelog = generateChangelog({
      repository: 'test/repo',
      version: '1.0.0',
    });

    expect(changelog.version).toBe('1.0.0');
    expect(changelog.date).toBeDefined();
    expect(changelog.sections.length).toBeGreaterThan(0);
    expect(changelog.stats.total).toBeGreaterThan(0);
  });

  it('formats markdown changelog', () => {
    const changelog = generateChangelog({
      repository: 'test/repo',
      version: '2.0.0',
    });

    const markdown = formatChangelogMarkdown(changelog);
    expect(markdown).toContain('2.0.0');
    expect(markdown).toContain('Changelog');
  });

  it('formats keep a changelog format', () => {
    const changelog = generateChangelog({
      repository: 'test/repo',
      version: '1.5.0',
    });

    const changelog_md = formatChangelogKeepAChangelog(changelog);
    expect(changelog_md).toContain('Keep a Changelog');
    expect(changelog_md).toContain('1.5.0');
  });

  it('counts breaking changes', () => {
    const changelog = generateChangelog({
      repository: 'test/repo',
      version: '3.0.0',
    });

    expect(changelog.stats.breaking).toBeGreaterThanOrEqual(0);
  });

  it('identifies contributors', () => {
    const changelog = generateChangelog({
      repository: 'test/repo',
      version: '1.0.0',
    });

    expect(changelog.stats.contributors.length).toBeGreaterThan(0);
  });
});
