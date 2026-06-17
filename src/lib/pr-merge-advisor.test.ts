import { describe, it, expect } from 'vitest';
import { createPRMergeAdvisor } from './pr-merge-advisor';

describe('pr-merge-advisor', () => {
  const { analyzePR, createBatchMergePlan, getMergeScoreColor } = createPRMergeAdvisor();

  const mockRepo = {
    id: '1',
    name: 'test-repo',
    fullName: 'owner/test-repo',
    owner: 'owner',
    description: 'Test repository',
    isPrivate: false,
    stars: 100,
    forks: 20,
    openIssues: 10,
    language: 'TypeScript'
  };

  const mockPR = {
    id: '1',
    number: 42,
    title: 'Add new feature',
    state: 'open' as const,
    additions: 50,
    deletions: 10,
    changedFiles: 3,
    body: 'This PR adds a new feature with tests',
    labels: ['approved'],
    author: 'contributor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  describe('analyzePR', () => {
    it('should analyze PR and return recommendation', () => {
      const rec = analyzePR(mockPR, mockRepo);
      
      expect(rec).toBeDefined();
      expect(rec.pullRequest).toEqual(mockPR);
      expect(rec.canMerge).toBeDefined();
      expect(rec.mergeStrategy).toBeDefined();
      expect(rec.score).toBeGreaterThanOrEqual(0);
      expect(rec.score).toBeLessThanOrEqual(100);
    });

    it('should detect draft PRs', () => {
      const draftPR = { ...mockPR, state: 'draft' as const };
      const rec = analyzePR(draftPR, mockRepo);
      
      expect(rec.canMerge).toBe(false);
      expect(rec.blockers.some(b => b.type === 'draft')).toBe(true);
    });

    it('should warn about large PRs', () => {
      const largePR = { ...mockPR, additions: 600 };
      const rec = analyzePR(largePR, mockRepo);
      
      expect(rec.suggestions.some(s => s.includes('split'))).toBe(true);
    });

    it('should calculate estimated review time', () => {
      const rec = analyzePR(mockPR, mockRepo);
      
      expect(rec.estimatedReviewTime).toBeGreaterThan(0);
    });
  });

  describe('createBatchMergePlan', () => {
    it('should create batch merge plan', () => {
      const prs = [mockPR, { ...mockPR, id: '2', state: 'draft' as const }];
      const plan = createBatchMergePlan(prs, mockRepo);
      
      expect(plan).toBeDefined();
      expect(plan.recommendedOrder).toBeDefined();
      expect(plan.batchGroups).toBeDefined();
      expect(plan.estimatedCompletionTime).toBeGreaterThanOrEqual(0);
    });

    it('should prioritize mergeable PRs', () => {
      const prs = [
        { ...mockPR, id: '1' },
        { ...mockPR, id: '2', state: 'draft' as const }
      ];
      const plan = createBatchMergePlan(prs, mockRepo);
      
      expect(plan.recommendedOrder[0].id).toBe('1');
    });
  });

  describe('getMergeScoreColor', () => {
    it('should return green for high scores', () => {
      expect(getMergeScoreColor(90)).toBe('#10b981');
    });

    it('should return yellow for medium scores', () => {
      expect(getMergeScoreColor(60)).toBe('#f59e0b');
    });

    it('should return red for low scores', () => {
      expect(getMergeScoreColor(30)).toBe('#ef4444');
    });
  });
});
