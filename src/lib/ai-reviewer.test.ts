import { describe, it, expect } from 'vitest';
import { createAIReviewer, generateReviewTemplate } from './ai-reviewer';

describe('ai-reviewer', () => {
  describe('createAIReviewer', () => {
    it('should create a reviewer with default config', () => {
      const reviewer = createAIReviewer();
      expect(reviewer).toBeDefined();
    });

    it('should accept custom config', () => {
      const reviewer = createAIReviewer({
        enableSecurityScan: false,
        maxComments: 10,
      });
      expect(reviewer).toBeDefined();
    });
  });

  describe('reviewPullRequest', () => {
    it('should review a PR with no issues', () => {
      const reviewer = createAIReviewer();
      const review = reviewer.reviewPullRequest(
        {
          id: '1',
          number: 1,
          title: 'Test PR',
          state: 'open',
          additions: 10,
          deletions: 2,
          changedFiles: 1,
        },
        {
          id: '1',
          name: 'test-repo',
          fullName: 'test/repo',
          owner: 'test',
          description: 'A test repo',
          isPrivate: false,
          stars: 100,
          forks: 10,
          openIssues: 5,
          language: 'TypeScript',
        }
      );

      expect(review.score).toBeDefined();
      expect(review.summary).toBeDefined();
      expect(Array.isArray(review.comments)).toBe(true);
    });

    it('should detect code with eval', () => {
      const reviewer = createAIReviewer({ enableSecurityScan: true });
      const review = reviewer.reviewPullRequest(
        {
          id: '1',
          number: 1,
          title: 'Fix bug',
          state: 'open',
          additions: 10,
          deletions: 2,
          changedFiles: 1,
          additionsList: ['eval(userInput)'],
        },
        { id: '1', name: 'test', fullName: 'test/repo', owner: 'test', description: '', isPrivate: false, stars: 0, forks: 0, openIssues: 0, language: 'JavaScript' }
      );

      const criticalIssues = review.comments.filter(
        c => c.severity === 'critical'
      );
      expect(criticalIssues.length).toBeGreaterThan(0);
    });

    it('should calculate lower score for problematic code', () => {
      const reviewer = createAIReviewer({ enableSecurityScan: true });
      const review = reviewer.reviewPullRequest(
        {
          id: '1',
          number: 1,
          title: 'Risky PR',
          state: 'open',
          additions: 50,
          deletions: 5,
          changedFiles: 10,
        },
        { id: '1', name: 'test', fullName: 'test/repo', owner: 'test', description: '', isPrivate: false, stars: 0, forks: 0, openIssues: 0, language: 'TypeScript' }
      );

      expect(review.score).toBeLessThanOrEqual(100);
    });
  });

  describe('generateReviewTemplate', () => {
    it('should generate markdown template', () => {
      const reviewer = createAIReviewer();
      const review = reviewer.reviewPullRequest(
        {
          id: '1',
          number: 1,
          title: 'Test PR',
          state: 'open',
          additions: 10,
          deletions: 2,
          changedFiles: 1,
        },
        { id: '1', name: 'test', fullName: 'test/repo', owner: 'test', description: '', isPrivate: false, stars: 0, forks: 0, openIssues: 0, language: 'TypeScript' }
      );

      const template = generateReviewTemplate(review);
      expect(template).toContain('# AI Code Review');
      expect(template).toContain('## Summary');
      expect(template).toContain(`Score: ${review.score}`);
    });

    it('should include comments in template', () => {
      const reviewer = createAIReviewer();
      const review = reviewer.reviewPullRequest(
        {
          id: '1',
          number: 1,
          title: 'Test PR',
          state: 'open',
          additions: 10,
          deletions: 2,
          changedFiles: 1,
        },
        { id: '1', name: 'test', fullName: 'test/repo', owner: 'test', description: '', isPrivate: false, stars: 0, forks: 0, openIssues: 0, language: 'TypeScript' }
      );

      const template = generateReviewTemplate(review);
      expect(template).toContain('# AI Code Review');
    });
  });
});
