import { describe, it, expect } from 'vitest';
import { CommitAnalyzer } from './commit-analysis';

describe('CommitAnalyzer', () => {
  const analyzer = new CommitAnalyzer();

  it('should add commits', async () => {
    const commit = await analyzer.addCommit({
      sha: 'abc123',
      message: 'feat: add new feature',
      author: 'testuser',
      authorEmail: 'test@example.com',
      date: new Date(),
      filesChanged: 5,
      insertions: 100,
      deletions: 20,
    });

    expect(commit.sha).toBe('abc123');
    expect(commit.type).toBe('feat');
  });

  it('should parse conventional commits', async () => {
    const commit = await analyzer.addCommit({
      sha: 'def456',
      message: 'fix(api): solve authentication bug',
      author: 'dev',
      authorEmail: 'dev@example.com',
      date: new Date(),
      filesChanged: 2,
      insertions: 50,
      deletions: 30,
    });

    expect(commit.type).toBe('fix');
    expect(commit.scope).toBe('api');
  });

  it('should parse breaking changes', async () => {
    const commit = await analyzer.addCommit({
      sha: 'breaking789',
      message: 'feat!: breaking change',
      author: 'dev',
      authorEmail: 'dev@example.com',
      date: new Date(),
      filesChanged: 10,
      insertions: 200,
      deletions: 100,
    });

    expect(commit.type).toBe('feat');
    expect(commit.breaking).toBe(true);
  });

  it('should get recent commits', async () => {
    await analyzer.addCommit({
      sha: 'new1',
      message: 'chore: test 1',
      author: 'dev',
      authorEmail: 'dev@example.com',
      date: new Date(),
      filesChanged: 1,
      insertions: 10,
      deletions: 5,
    });

    const recent = await analyzer.getRecentCommits(10);
    expect(recent.length).toBeGreaterThan(0);
  });

  it('should get statistics', async () => {
    await analyzer.addCommit({
      sha: 'stat1',
      message: 'feat: feature 1',
      author: 'alice',
      authorEmail: 'alice@example.com',
      date: new Date(),
      filesChanged: 3,
      insertions: 50,
      deletions: 10,
    });

    await analyzer.addCommit({
      sha: 'stat2',
      message: 'fix: fix 1',
      author: 'bob',
      authorEmail: 'bob@example.com',
      date: new Date(),
      filesChanged: 1,
      insertions: 20,
      deletions: 5,
    });

    const stats = await analyzer.getStatistics();
    expect(stats.totalCommits).toBeGreaterThanOrEqual(2);
    expect(stats.byAuthor).toBeDefined();
    expect(stats.byType).toBeDefined();
    expect(stats.byDay).toBeDefined();
  });

  it('should get contributors', async () => {
    await analyzer.addCommit({
      sha: 'contrib1',
      message: 'feat: feature',
      author: 'charlie',
      authorEmail: 'charlie@example.com',
      date: new Date(),
      filesChanged: 1,
      insertions: 10,
      deletions: 2,
    });

    const contributors = await analyzer.getContributors();
    expect(contributors.length).toBeGreaterThan(0);
    expect(contributors[0]).toHaveProperty('author');
    expect(contributors[0]).toHaveProperty('commits');
    expect(contributors[0]).toHaveProperty('lastCommit');
  });

  it('should search commits', async () => {
    await analyzer.addCommit({
      sha: 'search1',
      message: 'feat: search feature',
      author: 'dev',
      authorEmail: 'dev@example.com',
      date: new Date(),
      filesChanged: 5,
      insertions: 100,
      deletions: 20,
    });

    const results = await analyzer.searchCommits('search');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].message).toContain('search');
  });

  it('should get breaking changes', async () => {
    await analyzer.addCommit({
      sha: 'break1',
      message: 'feat!: breaking',
      author: 'dev',
      authorEmail: 'dev@example.com',
      date: new Date(),
      filesChanged: 10,
      insertions: 200,
      deletions: 100,
    });

    const breaking = await analyzer.getBreakingChanges();
    expect(breaking.length).toBeGreaterThan(0);
    expect(breaking[0].breaking).toBe(true);
  });

  it('should get changelogs', async () => {
    await analyzer.addCommit({
      sha: 'cl1',
      message: 'feat: new feature',
      author: 'dev',
      authorEmail: 'dev@example.com',
      date: new Date(),
      filesChanged: 5,
      insertions: 100,
      deletions: 20,
    });

    const changelogs = await analyzer.getChangelogs();
    expect(changelogs).toBeDefined();
  });

  it('should get trends', async () => {
    const trends = await analyzer.getTrends(7);
    expect(trends.length).toBeLessThanOrEqual(7);
    expect(trends[0]).toHaveProperty('date');
    expect(trends[0]).toHaveProperty('commits');
    expect(trends[0]).toHaveProperty('authors');
  });

  it('should get burndown data', async () => {
    const burndown = await analyzer.getBurndownData(5);
    expect(burndown.length).toBeLessThanOrEqual(5);
  });
});
