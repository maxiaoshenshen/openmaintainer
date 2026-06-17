import { describe, it, expect } from 'vitest';
import { shouldTriggerBot, evaluateCondition, executeAction, runBot, GREETING_BOT, SECURITY_BOT } from './bot-automation';

describe('Bot Automation', () => {
  const samplePR = {
    number: 123,
    title: 'Add new feature',
    author: 'contributor',
    files: ['src/index.ts'],
    additions: 50,
    deletions: 10,
    changedFiles: 1,
    labels: [],
    draft: false,
    baseBranch: 'main',
    headBranch: 'feature/new',
  };

  describe('shouldTriggerBot', () => {
    it('should trigger for matching events', () => {
      expect(shouldTriggerBot(GREETING_BOT, 'pull_request', samplePR)).toBe(true);
    });

    it('should not trigger for disabled bots', () => {
      const disabled = { ...GREETING_BOT, enabled: false };
      expect(shouldTriggerBot(disabled, 'pull_request', samplePR)).toBe(false);
    });

    it('should not trigger for non-matching events', () => {
      expect(shouldTriggerBot(GREETING_BOT, 'push', samplePR)).toBe(false);
    });
  });

  describe('evaluateCondition', () => {
    it('should evaluate draft condition', () => {
      expect(evaluateCondition('draft', { ...samplePR, draft: true })).toBe(true);
      expect(evaluateCondition('draft', samplePR)).toBe(false);
    });

    it('should evaluate size conditions', () => {
      expect(evaluateCondition('small pr', { ...samplePR, changedFiles: 5 })).toBe(true);
      expect(evaluateCondition('large pr', { ...samplePR, changedFiles: 100 })).toBe(true);
    });

    it('should evaluate security conditions', () => {
      expect(evaluateCondition('security related', { ...samplePR, labels: ['security'] })).toBe(true);
    });
  });

  describe('executeAction', () => {
    it('should execute comment action', () => {
      const result = executeAction(
        { type: 'comment', config: { message: 'Hello!' } },
        samplePR
      );
      expect(result.triggered).toBe(true);
      expect(result.actionTaken).toBe('comment');
    });

    it('should execute label action', () => {
      const result = executeAction(
        { type: 'label', config: { name: 'approved' } },
        samplePR
      );
      expect(result.triggered).toBe(true);
      expect(result.actionTaken).toBe('add_label');
    });
  });

  describe('runBot', () => {
    it('should run greeting bot on PR', () => {
      const results = runBot(GREETING_BOT, 'pull_request', samplePR);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].triggered).toBe(true);
    });

    it('should not trigger on draft PRs for greeting', () => {
      const draftPR = { ...samplePR, draft: true };
      const results = runBot(GREETING_BOT, 'pull_request', draftPR);
      expect(results.every(r => !r.triggered)).toBe(true);
    });

    it('should trigger security bot for security-related PRs', () => {
      const securityPR = { ...samplePR, labels: ['security'] };
      const results = runBot(SECURITY_BOT, 'pull_request', securityPR);
      expect(results.some(r => r.actionTaken === 'add_label')).toBe(true);
    });
  });
});
