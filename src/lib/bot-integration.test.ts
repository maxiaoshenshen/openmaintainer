import { describe, it, expect } from 'vitest';
import {
  createBotConfig,
  createBotTask,
  createAutomationRule,
  shouldTriggerRule,
  calculateBotStats
} from './bot-integration';

describe('bot-integration', () => {
  describe('createBotConfig', () => {
    it('should create bot configuration', () => {
      const config = createBotConfig('welcome-bot', true, '0 9 * * *');
      expect(config.name).toBe('welcome-bot');
      expect(config.enabled).toBe(true);
      expect(config.schedule).toBe('0 9 * * *');
    });
  });

  describe('createBotTask', () => {
    it('should create bot task', () => {
      const task = createBotTask('welcome-bot', 'add_comment', 'issue-123');
      expect(task.botName).toBe('welcome-bot');
      expect(task.action).toBe('add_comment');
      expect(task.target).toBe('issue-123');
      expect(task.status).toBe('pending');
    });
  });

  describe('createAutomationRule', () => {
    it('should create automation rule', () => {
      const rule = createAutomationRule(
        'Auto Label',
        'issue_created',
        { labels: ['bug'] },
        [{ type: 'add_label', params: { label: 'needs-triage' } }]
      );
      expect(rule.name).toBe('Auto Label');
      expect(rule.trigger).toBe('issue_created');
      expect(rule.enabled).toBe(true);
    });
  });

  describe('shouldTriggerRule', () => {
    it('should match rule conditions', () => {
      const rule = createAutomationRule(
        'Test Rule',
        'issue_created',
        { labels: ['bug'] },
        [{ type: 'add_label', params: {} }]
      );
      const event = { type: 'issue_created', labels: ['bug', 'urgent'] };
      expect(shouldTriggerRule(rule, event)).toBe(true);
    });

    it('should not match non-matching rule', () => {
      const rule = createAutomationRule(
        'Test Rule',
        'issue_created',
        { labels: ['enhancement'] },
        [{ type: 'add_label', params: {} }]
      );
      const event = { type: 'issue_created', labels: ['bug'] };
      expect(shouldTriggerRule(rule, event)).toBe(false);
    });
  });

  describe('calculateBotStats', () => {
    it('should calculate bot statistics', () => {
      const tasks = [
        { id: '1', botName: 'bot1', action: '', target: '', status: 'completed' as const, createdAt: new Date(), completedAt: new Date() },
        { id: '2', botName: 'bot1', action: '', target: '', status: 'completed' as const, createdAt: new Date(), completedAt: new Date() },
        { id: '3', botName: 'bot1', action: '', target: '', status: 'failed' as const, createdAt: new Date(), completedAt: new Date() }
      ];
      const stats = calculateBotStats(tasks);
      expect(stats).toHaveLength(1);
      expect(stats[0].tasksProcessed).toBe(3);
      expect(stats[0].successRate).toBeGreaterThan(60);
    });
  });
});
