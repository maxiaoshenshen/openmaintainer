import { describe, it, expect } from 'vitest';
import {
  extractPriority,
  extractType,
  estimateEffort,
  convertIssueToRoadmapItem,
  groupByMilestone,
  sortByPriority,
  calculateMilestoneProgress,
  estimateCompletion,
  generateRoadmap,
  exportRoadmapMarkdown,
  generateGanttData,
} from './roadmap-generator';
import type { Issue } from './types';

describe('roadmap-generator', () => {
  const createIssue = (overrides: Partial<Issue> = {}): Issue => ({
    identity: { owner: 'org', name: 'repo', fullName: 'org/repo', url: '' },
    number: 1,
    title: 'Test Issue',
    author: 'user',
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  describe('extractPriority', () => {
    it('should extract priority from labels', () => {
      expect(extractPriority(['priority:critical'])).toBe('critical');
      expect(extractPriority(['p1'])).toBe('high');
      expect(extractPriority(['priority:medium'])).toBe('medium');
      expect(extractPriority([])).toBe('low');
    });
  });

  describe('extractType', () => {
    it('should extract type from labels', () => {
      expect(extractType(['feature'])).toBe('feature');
      expect(extractType(['bug'])).toBe('bugfix');
      expect(extractType(['documentation'])).toBe('documentation');
      expect(extractType([])).toBe('feature');
    });
  });

  describe('estimateEffort', () => {
    it('should estimate effort based on labels', () => {
      expect(estimateEffort(createIssue({ labels: ['effort:large'] }))).toBe(5);
      expect(estimateEffort(createIssue({ labels: ['effort:medium'] }))).toBe(3);
      expect(estimateEffort(createIssue({ title: 'Architecture refactor' }))).toBeGreaterThan(1);
    });
  });

  describe('convertIssueToRoadmapItem', () => {
    it('should convert issue to roadmap item', () => {
      const issue = createIssue({ number: 42, title: 'New Feature', labels: ['feature'] });
      const item = convertIssueToRoadmapItem(issue);
      expect(item.id).toBe('issue-42');
      expect(item.title).toBe('New Feature');
      expect(item.type).toBe('feature');
    });
  });

  describe('groupByMilestone', () => {
    it('should group issues by milestone', () => {
      const issues = [
        createIssue({ number: 1, milestone: 'v1.0' }),
        createIssue({ number: 2, milestone: 'v1.0' }),
        createIssue({ number: 3, milestone: 'v2.0' }),
      ];
      const groups = groupByMilestone(issues);
      expect(groups.get('v1.0')?.length).toBe(2);
      expect(groups.get('v2.0')?.length).toBe(1);
    });
  });

  describe('sortByPriority', () => {
    it('should sort items by priority', () => {
      const items = [
        { id: '1', title: '', description: '', priority: 'low' as const, type: 'feature' as const, estimatedEffort: 1, labels: [], linkedIssues: [], status: 'planned' as const },
        { id: '2', title: '', description: '', priority: 'critical' as const, type: 'feature' as const, estimatedEffort: 1, labels: [], linkedIssues: [], status: 'planned' as const },
        { id: '3', title: '', description: '', priority: 'high' as const, type: 'feature' as const, estimatedEffort: 1, labels: [], linkedIssues: [], status: 'planned' as const },
      ];
      const sorted = sortByPriority(items);
      expect(sorted[0].priority).toBe('critical');
      expect(sorted[1].priority).toBe('high');
      expect(sorted[2].priority).toBe('low');
    });
  });

  describe('calculateMilestoneProgress', () => {
    it('should calculate progress', () => {
      const milestone = {
        id: '1', title: 'Test', description: '', startDate: new Date(), targetDate: new Date(),
        items: [
          { id: '1', title: '', description: '', priority: 'low' as const, type: 'feature' as const, estimatedEffort: 1, labels: [], linkedIssues: [], status: 'completed' as const },
          { id: '2', title: '', description: '', priority: 'low' as const, type: 'feature' as const, estimatedEffort: 1, labels: [], linkedIssues: [], status: 'planned' as const },
        ],
        progress: 0,
        status: 'in-progress' as const,
      };
      expect(calculateMilestoneProgress(milestone)).toBe(50);
    });
  });

  describe('estimateCompletion', () => {
    it('should estimate future completion date', () => {
      const items = [
        { id: '1', title: '', description: '', priority: 'low' as const, type: 'feature' as const, estimatedEffort: 4, labels: [], linkedIssues: [], status: 'planned' as const },
      ];
      const future = estimateCompletion(items, 2);
      expect(future.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('generateRoadmap', () => {
    it('should generate complete roadmap', () => {
      const issues = [
        createIssue({ number: 1, title: 'Feature A', labels: ['feature'] }),
        createIssue({ number: 2, title: 'Bug Fix', labels: ['bug'] }),
      ];
      const roadmap = generateRoadmap(issues, 'My Project', '1.0.0');
      expect(roadmap.version).toBe('1.0.0');
      expect(roadmap.totalItems).toBe(2);
      expect(roadmap.milestones.length).toBeGreaterThan(0);
    });
  });

  describe('exportRoadmapMarkdown', () => {
    it('should export as markdown', () => {
      const issues = [createIssue({ number: 1, title: 'Test' })];
      const roadmap = generateRoadmap(issues, 'Test', '1.0.0');
      const md = exportRoadmapMarkdown(roadmap);
      expect(md).toContain('# Test');
      expect(md).toContain('Test');
    });
  });

  describe('generateGanttData', () => {
    it('should generate Gantt chart data', () => {
      const issues = [createIssue({ number: 1, title: 'Test' })];
      const roadmap = generateRoadmap(issues, 'Test', '1.0.0');
      const gantt = generateGanttData(roadmap);
      expect(gantt.milestones.length).toBeGreaterThan(0);
      expect(gantt.items.length).toBeGreaterThan(0);
    });
  });
});
