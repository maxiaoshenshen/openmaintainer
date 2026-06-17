import { describe, it, expect } from 'vitest';
import { classifyIssue, suggestAssignee, suggestLabels, triageIssue, batchTriage } from './issue-triage';

describe('Issue Triage', () => {
  const sampleIssue = {
    id: '1',
    title: 'Fix login bug',
    body: 'The login button is not working when clicked',
    labels: [],
    author: 'user1',
    createdAt: '2024-01-01',
  };

  describe('classifyIssue', () => {
    it('should classify bug issues', () => {
      const result = classifyIssue(sampleIssue);
      expect(result.type).toBe('bug');
    });

    it('should classify feature requests', () => {
      const result = classifyIssue({
        ...sampleIssue,
        title: 'Add dark mode feature',
        body: 'Would be nice to have dark mode support',
      });
      expect(result.type).toBe('feature');
    });

    it('should classify questions', () => {
      const result = classifyIssue({
        ...sampleIssue,
        title: 'How to contribute?',
        body: 'Can someone explain how to set up the project?',
      });
      expect(result.type).toBe('question');
    });

    it('should detect critical priority', () => {
      const result = classifyIssue({
        ...sampleIssue,
        title: 'CRITICAL: Security vulnerability',
        body: 'There is a critical security issue',
      });
      expect(result.priority).toBe('critical');
    });
  });

  describe('suggestAssignee', () => {
    const team = [
      { name: 'Alice', skills: ['javascript', 'typescript'], currentWorkload: 2, expertise: { javascript: 5, typescript: 4 }, availability: 'full' as const },
      { name: 'Bob', skills: ['python'], currentWorkload: 5, expertise: { python: 5 }, availability: 'partial' as const },
    ];

    it('should suggest based on skills', () => {
      const issue = { ...sampleIssue, body: 'Fix JavaScript issue' };
      const assignee = suggestAssignee(issue, team);
      expect(assignee).toBe('Alice');
    });

    it('should skip unavailable members', () => {
      const unavailableTeam = [{ name: 'Carol', skills: ['javascript'], currentWorkload: 0, expertise: { javascript: 10 }, availability: 'unavailable' as const }];
      const assignee = suggestAssignee(sampleIssue, unavailableTeam);
      expect(assignee).toBeUndefined();
    });
  });

  describe('suggestLabels', () => {
    it('should suggest type and priority labels', () => {
      const classification = { type: 'bug' as const, priority: 'high' as const, complexity: 'moderate' as const, confidence: 80 };
      const labels = suggestLabels(sampleIssue, classification);
      expect(labels).toContain('type: bug');
      expect(labels).toContain('priority: high');
    });
  });

  describe('triageIssue', () => {
    it('should triage and return complete result', () => {
      const team = [
        { name: 'Alice', skills: ['javascript'], currentWorkload: 0, expertise: { javascript: 5 }, availability: 'full' as const },
      ];
      const result = triageIssue(sampleIssue, team);
      expect(result.classification).toBeDefined();
      expect(result.routing).toBeDefined();
      expect(result.actionItems).toBeDefined();
    });
  });

  describe('batchTriage', () => {
    it('should sort by priority', () => {
      const issues = [
        { ...sampleIssue, id: '1', title: 'Low priority', labels: [], author: 'u', createdAt: '2024-01-01' },
        { ...sampleIssue, id: '2', title: 'CRITICAL issue', labels: [], author: 'u', createdAt: '2024-01-01' },
      ];
      const results = batchTriage(issues, []);
      expect(results[0].classification.priority).toBe('critical');
    });
  });
});
