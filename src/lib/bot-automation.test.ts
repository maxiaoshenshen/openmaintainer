import { describe, it, expect } from 'vitest';
import { BotAutomationManager } from './bot-automation';

describe('BotAutomationManager', () => {
  const manager = new BotAutomationManager();

  it('should create a rule', async () => {
    const rule = await manager.createRule({
      name: 'Welcome New Contributors',
      description: 'Send welcome message to new contributors',
      action: 'welcome_contributor',
      trigger: {
        type: 'event',
        event: 'pr_opened',
      },
    });

    expect(rule.id).toBeDefined();
    expect(rule.name).toBe('Welcome New Contributors');
    expect(rule.enabled).toBe(true);
  });

  it('should create scheduled rule', async () => {
    const rule = await manager.createRule({
      name: 'Close Inactive Issues',
      description: 'Close issues inactive for 30 days',
      action: 'close_inactive',
      trigger: {
        type: 'schedule',
        schedule: '0 9 * * *', // Daily at 9 AM
      },
    });

    expect(rule.id).toBeDefined();
    expect(rule.trigger.type).toBe('schedule');
    expect(rule.trigger.schedule).toBe('0 9 * * *');
  });

  it('should update rule', async () => {
    const rule = await manager.createRule({
      name: 'Test Rule',
      description: 'Test',
      action: 'welcome_contributor',
      trigger: { type: 'event', event: 'pr_opened' },
    });

    const updated = await manager.updateRule(rule.id, {
      name: 'Updated Rule',
      enabled: false,
    });

    expect(updated?.name).toBe('Updated Rule');
    expect(updated?.enabled).toBe(false);
  });

  it('should delete rule', async () => {
    const rule = await manager.createRule({
      name: 'To Delete',
      description: 'Test',
      action: 'welcome_contributor',
      trigger: { type: 'event', event: 'pr_opened' },
    });

    const deleted = await manager.deleteRule(rule.id);
    expect(deleted).toBe(true);

    const retrieved = await manager.getRule(rule.id);
    expect(retrieved).toBeNull();
  });

  it('should trigger event and execute matching rules', async () => {
    await manager.createRule({
      name: 'Welcome PRs',
      description: 'Welcome new PRs',
      action: 'welcome_contributor',
      trigger: { type: 'event', event: 'pr_opened' },
    });

    await manager.createRule({
      name: 'Thank Merges',
      description: 'Thank merged PRs',
      action: 'thank_contributor',
      trigger: { type: 'event', event: 'pr_merged' },
    });

    const logs = await manager.triggerEvent('pr_opened', { pr: 123 });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].ruleId).toBeDefined();
    expect(logs[0].triggeredBy).toBe('pr_opened');
  });

  it('should execute scheduled rules', async () => {
    await manager.createRule({
      name: 'Daily Task',
      description: 'Run daily',
      action: 'close_inactive',
      trigger: { type: 'schedule', schedule: '0 9 * * *' },
    });

    const logs = await manager.executeScheduledRules();
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should execute rule manually', async () => {
    const rule = await manager.createRule({
      name: 'Manual Task',
      description: 'Run manually',
      action: 'add_labels',
      trigger: { type: 'event', event: 'issue_opened' },
    });

    const log = await manager.executeRuleManually(rule.id, { issue: 456 });
    expect(log).toBeDefined();
    expect(log?.ruleId).toBe(rule.id);
  });

  it('should get logs', async () => {
    const rule = await manager.createRule({
      name: 'Log Test',
      description: 'Test',
      action: 'welcome_contributor',
      trigger: { type: 'event', event: 'pr_opened' },
    });

    await manager.triggerEvent('pr_opened', { pr: 1 });
    await manager.triggerEvent('pr_opened', { pr: 2 });

    const logs = await manager.getLogs(rule.id);
    expect(logs.length).toBeGreaterThanOrEqual(2);
  });

  it('should get metrics', async () => {
    await manager.createRule({
      name: 'Rule 1',
      description: 'Test',
      action: 'welcome_contributor',
      trigger: { type: 'event', event: 'pr_opened' },
    });

    await manager.createRule({
      name: 'Rule 2',
      description: 'Test',
      action: 'thank_contributor',
      trigger: { type: 'event', event: 'pr_merged' },
      enabled: false,
    });

    const metrics = await manager.getMetrics();
    expect(metrics.totalRules).toBeGreaterThanOrEqual(2);
    expect(metrics.activeRules).toBeGreaterThan(0);
  });

  it('should enable and disable rules', async () => {
    const rule = await manager.createRule({
      name: 'Toggle Test',
      description: 'Test',
      action: 'welcome_contributor',
      trigger: { type: 'event', event: 'pr_opened' },
    });

    await manager.disableRule(rule.id);
    let retrieved = await manager.getRule(rule.id);
    expect(retrieved?.enabled).toBe(false);

    await manager.enableRule(rule.id);
    retrieved = await manager.getRule(rule.id);
    expect(retrieved?.enabled).toBe(true);
  });

  it('should respect conditions in actions', async () => {
    const rule = await manager.createRule({
      name: 'Conditional Rule',
      description: 'Test',
      action: 'request_review',
      trigger: { type: 'event', event: 'pr_opened' },
      conditions: { reviewers: ['alice', 'bob'] },
    });

    const log = await manager.executeRuleManually(rule.id, { pr: 789 });
    expect(log?.output?.reviewers).toEqual(['alice', 'bob']);
  });

  it('should track trigger count', async () => {
    const rule = await manager.createRule({
      name: 'Count Test',
      description: 'Test',
      action: 'welcome_contributor',
      trigger: { type: 'event', event: 'pr_opened' },
    });

    expect(rule.triggerCount).toBe(0);

    await manager.triggerEvent('pr_opened', { pr: 1 });
    const updated = await manager.getRule(rule.id);
    expect(updated?.triggerCount).toBe(1);

    await manager.triggerEvent('pr_opened', { pr: 2 });
    const updated2 = await manager.getRule(rule.id);
    expect(updated2?.triggerCount).toBe(2);
  });
});
