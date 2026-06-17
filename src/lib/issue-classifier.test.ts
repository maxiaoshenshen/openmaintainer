import { describe, it, expect } from 'vitest';
import { classifyIssue, batchClassifyIssues } from './issue-classifier';

describe('Issue Classifier', () => {
  describe('classifyIssue', () => {
    it('should classify bug reports', () => {
      const result = classifyIssue({
        title: 'Application crashes on startup',
        body: 'The app crashes when trying to load the config file. Error: Cannot read property "name" of undefined',
      });

      expect(result.category).toBe('bug');
      expect(['critical', 'high', 'medium']).toContain(result.priority);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify feature requests', () => {
      const result = classifyIssue({
        title: 'Add dark mode support',
        body: 'It would be nice to have a dark mode option in the settings. This would improve user experience.',
      });

      expect(result.category).toBe('enhancement');
      expect(result.suggestedLabels).toContain('enhancement');
    });

    it('should classify security issues', () => {
      const result = classifyIssue({
        title: 'Security: XSS vulnerability in comment section',
        body: 'The comment section does not sanitize HTML input, allowing XSS attacks.',
      });

      expect(result.category).toBe('security');
      expect(['critical', 'high', 'medium']).toContain(result.priority);
    });

    it('should classify questions', () => {
      const result = classifyIssue({
        title: 'How do I configure the API endpoint?',
        body: 'I am having trouble understanding the configuration options. Can you help?',
      });

      expect(result.category).toBe('question');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should classify help wanted issues', () => {
      const result = classifyIssue({
        title: 'Help wanted: Review authentication flow',
        body: 'Looking for someone to help review the new authentication implementation. First time contributors welcome!',
      });

      expect(result.category).toBe('help-wanted');
      expect(result.suggestedLabels).toContain('help wanted');
    });

    it('should classify good first issues', () => {
      const result = classifyIssue({
        title: 'Good first issue: Fix typo in README',
        body: 'Simple starter issue - just need to fix a small typo.',
      });

      expect(result.category).toBe('good-first-issue');
      expect(result.complexity).toBe('simple');
    });

    it('should classify performance issues', () => {
      const result = classifyIssue({
        title: 'Slow loading time for large datasets',
        body: 'Loading 10k records takes over 30 seconds. We need to optimize the query or add pagination.',
      });

      expect(result.category).toBe('performance');
      expect(result.estimatedEffort).toBeDefined();
    });

    it('should classify accessibility issues', () => {
      const result = classifyIssue({
        title: 'Add ARIA labels to navigation',
        body: 'Screen reader users cannot navigate the menu properly. Need to add proper ARIA labels.',
      });

      expect(result.category).toBe('accessibility');
    });

    it('should generate correct label suggestions', () => {
      const result = classifyIssue({
        title: 'Critical bug: Data loss when saving',
        body: 'Users are losing data when they try to save.',
      });

      expect(result.suggestedLabels).toContain('bug');
      expect(result.suggestedLabels).toContain('critical');
    });

    it('should estimate effort correctly', () => {
      const simple = classifyIssue({
        title: 'Fix typo',
        body: 'Just a typo in a string.',
      });

      const complex = classifyIssue({
        title: 'Refactor authentication system with many files',
        body: 'Need to completely refactor the auth module to use the new library. Multiple files need changes. We need to update src/auth/login.ts, src/auth/logout.ts, src/auth/session.ts, src/auth/permissions.ts and more. This is a big refactor.',
      });

      expect(simple.estimatedEffort).toContain('min');
      expect(complex.estimatedEffort).toBeDefined();
    });
  });

  describe('batchClassifyIssues', () => {
    it('should classify multiple issues', () => {
      const issues = [
        { title: 'Bug: App crashes', body: 'Description' },
        { title: 'Feature: Add export', body: 'Description' },
        { title: 'Question: How to use?', body: 'Description' },
      ];

      const results = batchClassifyIssues(issues);

      expect(results).toHaveLength(3);
      expect(results[0].category).toBe('bug');
      expect(results[1].category).toBe('enhancement');
      expect(results[2].category).toBe('question');
    });
  });
});
