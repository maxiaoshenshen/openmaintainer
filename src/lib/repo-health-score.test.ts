import { describe, it, expect } from 'vitest';
import { calculateHealthScore, getHealthRecommendations, compareHealthScores } from './repo-health-score';

function createMockRepo() {
  return {
    id: 'repo-1',
    name: 'test-repo',
    fullName: 'test/repo',
    description: 'A test repository',
    owner: 'test',
    isPrivate: false,
    stars: 100,
    forks: 50,
    openIssues: 10,
    language: 'TypeScript',
    createdAt: new Date(),
    updatedAt: new Date(),
    pushedAt: new Date(),
    url: 'https://github.com/test/repo'
  };
}

function createMockIssue(state = 'open') {
  return {
    id: `issue-${Date.now()}`,
    number: 1,
    title: 'Test Issue',
    body: 'Issue body',
    state,
    author: 'test-user',
    labels: [],
    assignees: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: 0,
    url: 'https://github.com/test/repo/issues/1'
  };
}

function createMockPR(state = 'open') {
  return {
    id: `pr-${Date.now()}`,
    number: 1,
    title: 'Test PR',
    body: 'PR body',
    state,
    author: 'test-user',
    labels: [],
    reviewers: [],
    additions: 100,
    deletions: 20,
    commits: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    mergedAt: null,
    url: 'https://github.com/test/repo/pull/1'
  };
}

function createMockContributor() {
  return {
    id: 'user-1',
    username: 'test-user',
    avatarUrl: 'https://example.com/avatar.png',
    contributions: 50,
    isMaintainer: false
  };
}



describe('repo-health-score', () => {
  describe('calculateHealthScore', () => {
    it('should calculate health score', () => {
      const repo = createMockRepo();
      const issues = [createMockIssue(), createMockIssue({ state: 'closed' })];
      const prs = [createMockPR()];
      const contributors = [createMockContributor()];
      
      const score = calculateHealthScore(repo, issues, prs, contributors);
      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.grade).toMatch(/^[A-F][+]?$/);
    });

    it('should include breakdown scores', () => {
      const score = calculateHealthScore(createMockRepo(), [], [], []);
      expect(score.breakdown).toHaveProperty('activity');
      expect(score.breakdown).toHaveProperty('responsiveness');
      expect(score.breakdown).toHaveProperty('maintenance');
      expect(score.breakdown).toHaveProperty('community');
      expect(score.breakdown).toHaveProperty('documentation');
    });
  });

  describe('getHealthRecommendations', () => {
    it('should provide recommendations for low scores', () => {
      const lowScore = {
        overall: 40,
        breakdown: { activity: 30, responsiveness: 30, maintenance: 30, community: 30, documentation: 30 },
        grade: 'D' as const,
        trends: { direction: 'declining' as const, delta: -30 }
      };
      const recommendations = getHealthRecommendations(lowScore);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should praise good scores', () => {
      const goodScore = {
        overall: 90,
        breakdown: { activity: 90, responsiveness: 90, maintenance: 90, community: 90, documentation: 90 },
        grade: 'A' as const,
        trends: { direction: 'improving' as const, delta: 20 }
      };
      const recommendations = getHealthRecommendations(goodScore);
      expect(recommendations.some(r => r.includes('Great job'))).toBe(true);
    });
  });

  describe('compareHealthScores', () => {
    it('should detect improvements', () => {
      const before = {
        overall: 50,
        breakdown: { activity: 50, responsiveness: 50, maintenance: 50, community: 50, documentation: 50 },
        grade: 'C' as const,
        trends: { direction: 'stable' as const, delta: 0 }
      };
      const after = {
        overall: 70,
        breakdown: { activity: 70, responsiveness: 70, maintenance: 70, community: 70, documentation: 70 },
        grade: 'B' as const,
        trends: { direction: 'improving' as const, delta: 20 }
      };
      const comparison = compareHealthScores(before, after);
      expect(comparison.improved.length).toBe(5);
    });
  });
});
