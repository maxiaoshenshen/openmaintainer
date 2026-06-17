import { describe, it, expect } from 'vitest';
import { GitHubAPIClient } from './github-api';

describe('GitHubAPI Client', () => {
  it('creates client instance', () => {
    const client = new GitHubAPIClient();
    expect(client).toBeDefined();
  });

  it('creates client with token', () => {
    const client = new GitHubAPIClient({ token: 'test-token' });
    expect(client).toBeDefined();
  });

  describe('data conversion methods', () => {
    it('converts GitHub repo data to Repository format', () => {
      const client = new GitHubAPIClient();
      const repoData = {
        fullName: 'test-owner/test-repo',
        description: 'A test repository',
        stars: 100,
        forks: 50,
        openIssues: 10,
        openPRs: 5,
        language: 'TypeScript',
        license: 'MIT',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
        lastRelease: 'v1.0.0',
        topics: ['typescript', 'nodejs'],
        defaultBranch: 'main',
      };
      const contributors = [
        { login: 'user1', avatarUrl: 'https://example.com/avatar.png', contributions: 100, type: 'User' as const },
        { login: 'bot1', avatarUrl: 'https://example.com/bot.png', contributions: 50, type: 'Bot' as const },
      ];

      const result = client.toRepository(repoData, contributors);
      expect(result.name).toBe('test-repo');
      expect(result.owner).toBe('test-owner');
      expect(result.stars).toBe(100);
      expect(result.language).toBe('TypeScript');
      expect(result.topics).toContain('typescript');
      expect(result.contributors).toHaveLength(2);
    });

    it('converts GitHub PR data to PullRequest format', () => {
      const client = new GitHubAPIClient();
      const prs = [
        {
          number: 1,
          title: 'Fix bug',
          state: 'open' as const,
          author: 'user1',
          createdAt: '2024-06-01T00:00:00Z',
          updatedAt: '2024-06-02T00:00:00Z',
          mergedAt: null,
          labels: ['bug', 'high-priority'],
          additions: 50,
          deletions: 10,
          reviewers: ['reviewer1'],
          baseBranch: 'main',
          headBranch: 'fix-bug',
        },
      ];

      const result = client.toPullRequests(prs);
      expect(result).toHaveLength(1);
      expect(result[0].number).toBe(1);
      expect(result[0].title).toBe('Fix bug');
      expect(result[0].status).toBe('open');
      expect(result[0].additions).toBe(50);
    });

    it('converts merged PRs correctly', () => {
      const client = new GitHubAPIClient();
      const prs = [
        {
          number: 2,
          title: 'Add feature',
          state: 'merged' as const,
          author: 'user2',
          createdAt: '2024-05-01T00:00:00Z',
          updatedAt: '2024-05-02T00:00:00Z',
          mergedAt: '2024-05-02T12:00:00Z',
          labels: ['enhancement'],
          additions: 200,
          deletions: 20,
          reviewers: ['reviewer1', 'reviewer2'],
          baseBranch: 'main',
          headBranch: 'add-feature',
        },
      ];

      const result = client.toPullRequests(prs);
      expect(result[0].status).toBe('merged');
    });

    it('converts GitHub issue data to Issue format', () => {
      const client = new GitHubAPIClient();
      const issues = [
        {
          number: 10,
          title: 'Question about API',
          state: 'open' as const,
          author: 'newuser',
          createdAt: '2024-06-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
          labels: ['question'] as any,
          commentCount: 2,
          assignees: ['maintainer1'],
        },
      ];

      const result = client.toIssues(issues);
      expect(result).toHaveLength(1);
      expect(result[0].number).toBe(10);
      expect(result[0].title).toBe('Question about API');
      expect(result[0].status).toBe('open');
      expect(result[0].comments).toBe(2);
    });
  });
});
