import { describe, it, expect } from 'vitest';
import { TechDebtTracker, DebtCategory, DebtSeverity, DebtStatus } from './tech-debt-tracker';

describe('TechDebtTracker', () => {
  const tracker = new TechDebtTracker();

  it('should add tech debt', async () => {
    const debt = await tracker.addDebt({
      title: 'Outdated dependencies',
      description: 'Several packages are behind current versions',
      category: 'dependencies',
      severity: 'medium',
      estimatedEffort: '4 hours',
      impactedAreas: ['build', 'security'],
    });

    expect(debt.id).toBeDefined();
    expect(debt.title).toBe('Outdated dependencies');
    expect(debt.status).toBe('identified');
  });

  it('should update debt status', async () => {
    const debt = await tracker.addDebt({
      title: 'Test debt',
      description: 'Testing status update',
      category: 'testing',
      severity: 'low',
      estimatedEffort: '1 hour',
      impactedAreas: ['tests'],
    });

    const updated = await tracker.updateDebtStatus(debt.id, 'in-progress');
    expect(updated?.status).toBe('in-progress');
  });

  it('should resolve debt with timestamp', async () => {
    const debt = await tracker.addDebt({
      title: 'Resolve test',
      description: 'Testing resolution',
      category: 'documentation',
      severity: 'low',
      estimatedEffort: '30 minutes',
      impactedAreas: ['docs'],
    });

    const resolved = await tracker.updateDebtStatus(debt.id, 'resolved');
    expect(resolved?.resolvedAt).toBeDefined();
  });

  it('should filter debts by category', async () => {
    await tracker.addDebt({
      title: 'Security debt',
      description: 'Security issue',
      category: 'security',
      severity: 'high',
      estimatedEffort: '8 hours',
      impactedAreas: ['auth'],
    });

    const securityDebts = await tracker.getAllDebts({ category: 'security' });
    expect(securityDebts.length).toBeGreaterThan(0);
    expect(securityDebts[0].category).toBe('security');
  });

  it('should filter debts by severity', async () => {
    await tracker.addDebt({
      title: 'Critical debt',
      description: 'Critical issue',
      category: 'performance',
      severity: 'critical',
      estimatedEffort: '16 hours',
      impactedAreas: ['api'],
    });

    const criticalDebts = await tracker.getAllDebts({ severity: 'critical' });
    expect(criticalDebts.length).toBeGreaterThan(0);
    expect(criticalDebts[0].severity).toBe('critical');
  });

  it('should get metrics', async () => {
    await tracker.addDebt({
      title: 'Metrics test',
      description: 'Testing metrics',
      category: 'code-quality',
      severity: 'medium',
      estimatedEffort: '2 hours',
      impactedAreas: ['src'],
    });

    const metrics = await tracker.getMetrics();
    expect(metrics.totalDebt).toBeGreaterThan(0);
    expect(metrics.debtByCategory).toBeDefined();
    expect(metrics.debtBySeverity).toBeDefined();
  });

  it('should get trends', async () => {
    await tracker.addDebt({
      title: 'Trend test',
      description: 'Testing trends',
      category: 'architecture',
      severity: 'low',
      estimatedEffort: '1 hour',
      impactedAreas: ['design'],
    });

    const trends = await tracker.getTrends(7);
    expect(Array.isArray(trends)).toBe(true);
  });

  it('should assign debt', async () => {
    const debt = await tracker.addDebt({
      title: 'Assign test',
      description: 'Testing assignment',
      category: 'testing',
      severity: 'low',
      estimatedEffort: '1 hour',
      impactedAreas: ['tests'],
    });

    const assigned = await tracker.assignDebt(debt.id, 'developer-1');
    expect(assigned?.assignee).toBe('developer-1');
  });

  it('should get individual debt', async () => {
    const debt = await tracker.addDebt({
      title: 'Get test',
      description: 'Testing get',
      category: 'documentation',
      severity: 'low',
      estimatedEffort: '30 minutes',
      impactedAreas: ['readme'],
    });

    const found = await tracker.getDebt(debt.id);
    expect(found?.id).toBe(debt.id);
  });

  it('should handle non-existent debt', async () => {
    const result = await tracker.updateDebtStatus('nonexistent', 'resolved');
    expect(result).toBeNull();
  });
});
