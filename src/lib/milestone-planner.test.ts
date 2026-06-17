import { describe, it, expect } from 'vitest';
import {
  createMilestone,
  analyzeMilestone,
  planReleaseScope,
  generateMilestonePlan,
  suggestMilestoneIssues,
} from './milestone-planner';

describe('Milestone Planner', () => {
  describe('createMilestone', () => {
    it('should create a milestone with defaults', () => {
      const milestone = createMilestone({
        title: 'v1.0 Release',
        description: 'First stable release',
        dueDate: '2026-07-01',
      });

      expect(milestone.title).toBe('v1.0 Release');
      expect(milestone.status).toBe('open');
      expect(milestone.progress).toBe(0);
      expect(milestone.id).toBeDefined();
    });

    it('should include target issues', () => {
      const milestone = createMilestone({
        title: 'Test',
        description: 'Test',
        dueDate: '2026-07-01',
        targetIssues: [1, 2, 3],
      });

      expect(milestone.issues).toEqual([1, 2, 3]);
    });
  });

  describe('analyzeMilestone', () => {
    it('should calculate progress correctly', () => {
      const milestone = createMilestone({
        title: 'Test',
        description: 'Test',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        targetIssues: [1, 2, 3, 4],
      });

      const issues: any[] = [
        { number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }
      ];

      // Complete 2 issues
      milestone.completedIssues = [1, 2];

      const result = analyzeMilestone({ milestone, issues });

      expect(result.progress).toBe(50);
    });
  });

  describe('planReleaseScope', () => {
    it('should identify included and excluded issues', () => {
      const milestone = createMilestone({
        title: 'v1.0',
        description: 'Test',
        dueDate: '2026-07-01',
        targetIssues: [1, 2, 3],
      });

      const allIssues = [
        { number: 1, title: 'Issue 1', priority: 'high' as const, type: 'feature' as const, labels: [] },
        { number: 2, title: 'Issue 2', priority: 'medium' as const, type: 'bug' as const, labels: [] },
        { number: 3, title: 'Issue 3', priority: 'low' as const, type: 'enhancement' as const, labels: [] },
        { number: 4, title: 'Issue 4', priority: 'high' as const, type: 'feature' as const, labels: [] },
      ];

      const scope = planReleaseScope({ milestone, allIssues });

      expect(scope.includedIssues).toHaveLength(3);
      expect(scope.includedIssues[0].number).toBe(1); // High priority first
    });
  });

  describe('generateMilestonePlan', () => {
    it('should identify overdue milestones', () => {
      const milestones = [
        createMilestone({
          title: 'Overdue',
          description: 'Test',
          dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ];

      const plan = generateMilestonePlan({ milestones, issues: [] });

      expect(plan.overdue).toHaveLength(1);
      expect(plan.risks).toContain('1 milestone(s) are overdue');
    });

    it('should calculate on track status', () => {
      const milestones = [
        createMilestone({
          title: 'Good',
          description: 'Test',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ];

      const plan = generateMilestonePlan({ milestones, issues: [] });

      expect(plan.onTrack).toBe(true);
    });
  });

  describe('suggestMilestoneIssues', () => {
    it('should prioritize matching labels', () => {
      const issues = [
        { number: 1, title: 'Bug', priority: 'low' as const, type: 'bug' as const, labels: ['bug'] },
        { number: 2, title: 'Feature', priority: 'high' as const, type: 'feature' as const, labels: ['enhancement'] },
        { number: 3, title: 'Critical', priority: 'critical' as const, type: 'bug' as const, labels: ['bug', 'security'] },
      ];

      const suggestions = suggestMilestoneIssues({
        allIssues: issues,
        milestoneLabels: ['bug', 'security'],
        milestoneAssignees: [],
        maxIssues: 2,
      });

      expect(suggestions.length).toBeLessThanOrEqual(2);
      expect(suggestions[0]?.priority).toBe('critical');
    });
  });
});
