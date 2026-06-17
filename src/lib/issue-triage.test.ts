import { describe, it, expect } from 'vitest';
import { createIssueTriageSystem } from './issue-triage';

describe('issue-triage', () => {
  const { categorizeIssue, triageIssues, generateTriageSummary, getPriorityColor, getCategoryColor } = createIssueTriageSystem();

  const mockIssue = {
    id: '1',
    number: 1,
    title: 'Test Issue',
    state: 'open' as const,
    body: 'This is a test issue',
    author: 'testuser',
    labels: [],
    assignees: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: 0
  };

  describe('categorizeIssue', () => {
    it('should categorize bug issues', () => {
      const issue = { ...mockIssue, title: 'App crashes when clicking button' };
      const result = categorizeIssue(issue);
      
      expect(result.category).toBe('bug');
      expect(result.priority).toBe('high');
      expect(result.suggestedLabels).toContain('bug');
    });

    it('should categorize security issues', () => {
      const issue = { ...mockIssue, title: 'Security vulnerability in auth' };
      const result = categorizeIssue(issue);
      
      expect(result.category).toBe('security');
      expect(result.priority).toBe('critical');
      expect(result.suggestedLabels).toContain('security');
    });

    it('should categorize feature requests', () => {
      const issue = { ...mockIssue, title: 'Would be nice to have dark mode' };
      const result = categorizeIssue(issue);
      
      expect(result.category).toBe('feature-request');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should return confidence score', () => {
      const result = categorizeIssue(mockIssue);
      
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should suggest labels', () => {
      const result = categorizeIssue(mockIssue);
      
      expect(result.suggestedLabels).toBeDefined();
      expect(Array.isArray(result.suggestedLabels)).toBe(true);
    });
  });

  describe('triageIssues', () => {
    it('should triage multiple issues', () => {
      const issues = [
        { ...mockIssue, title: 'App crashes when clicking' },
        { ...mockIssue, title: 'Add dark mode feature' },
        { ...mockIssue, title: 'How to use?' }
      ];
      
      const results = triageIssues(issues);
      
      expect(results.length).toBe(3);
      expect(results[0].category).toBe('bug');
    });
  });

  describe('generateTriageSummary', () => {
    it('should generate summary statistics', () => {
      const issues = [
        { ...mockIssue, title: 'Bug 1' },
        { ...mockIssue, title: 'Add dark mode feature' },
        { ...mockIssue, title: 'Documentation fix' }
      ];
      const results = triageIssues(issues);
      const summary = generateTriageSummary(results);
      
      expect(summary.totalIssues).toBe(3);
      expect(summary.byCategory).toBeDefined();
      expect(summary.byPriority).toBeDefined();
    });

    it('should track issues by priority', () => {
      const results = triageIssues([mockIssue]);
      const summary = generateTriageSummary(results);
      
      expect(summary.byPriority).toHaveProperty('critical');
      expect(summary.byPriority).toHaveProperty('high');
      expect(summary.byPriority).toHaveProperty('medium');
      expect(summary.byPriority).toHaveProperty('low');
    });
  });

  describe('getPriorityColor', () => {
    it('should return correct colors', () => {
      expect(getPriorityColor('critical')).toBe('#ef4444');
      expect(getPriorityColor('high')).toBe('#f97316');
      expect(getPriorityColor('medium')).toBe('#f59e0b');
      expect(getPriorityColor('low')).toBe('#10b981');
    });
  });

  describe('getCategoryColor', () => {
    it('should return correct colors', () => {
      expect(getCategoryColor('bug')).toBe('#ef4444');
      expect(getCategoryColor('security')).toBe('#dc2626');
      expect(getCategoryColor('feature-request')).toBe('#8b5cf6');
    });
  });
});
