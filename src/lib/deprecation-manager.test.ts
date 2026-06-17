import { describe, it, expect } from 'vitest';
import { DeprecationManager, DeprecationLevel, MigrationStatus } from './deprecation-manager';

describe('DeprecationManager', () => {
  const manager = new DeprecationManager();

  it('should add deprecation', async () => {
    const dep = await manager.addDeprecation({
      item: 'oldApiMethod',
      version: '1.0.0',
      reason: 'Replaced by newApiMethod',
      alternative: 'newApiMethod',
      level: 'warning',
    });

    expect(dep.id).toBeDefined();
    expect(dep.item).toBe('oldApiMethod');
    expect(dep.level).toBe('warning');
  });

  it('should add migration task', async () => {
    const dep = await manager.addDeprecation({
      item: 'legacyFunction',
      version: '2.0.0',
      reason: 'Function no longer needed',
      level: 'error',
      removedIn: '3.0.0',
    });

    const task = await manager.addMigrationTask(dep.id, 'Remove legacyFunction calls');
    expect(task).not.toBeNull();
    expect(task?.status).toBe('pending');
  });

  it('should update migration status', async () => {
    const dep = await manager.addDeprecation({
      item: 'testFunc',
      version: '1.0.0',
      reason: 'Test',
      level: 'warning',
    });

    const task = await manager.addMigrationTask(dep.id, 'Test migration');
    const updated = await manager.updateMigrationStatus(task!.id, 'completed');
    expect(updated?.status).toBe('completed');
    expect(updated?.completedAt).toBeDefined();
  });

  it('should get deprecation', async () => {
    const dep = await manager.addDeprecation({
      item: 'getDep',
      version: '1.0.0',
      reason: 'Testing get',
      level: 'warning',
    });

    const found = await manager.getDeprecation(dep.id);
    expect(found?.id).toBe(dep.id);
  });

  it('should get all deprecations', async () => {
    await manager.addDeprecation({
      item: 'deprecate1',
      version: '1.0.0',
      reason: 'Test 1',
      level: 'warning',
    });

    const all = await manager.getAllDeprecations();
    expect(all.length).toBeGreaterThan(0);
  });

  it('should get active deprecations', async () => {
    const dep = await manager.addDeprecation({
      item: 'activeDep',
      version: '1.0.0',
      reason: 'Active',
      level: 'warning',
    });

    await manager.addDeprecation({
      item: 'removedDep',
      version: '1.0.0',
      reason: 'Removed',
      level: 'removed',
    });

    const active = await manager.getActiveDeprecations();
    expect(active.some(d => d.item === 'activeDep')).toBe(true);
    expect(active.some(d => d.item === 'removedDep')).toBe(false);
  });

  it('should get deprecation report', async () => {
    await manager.addDeprecation({
      item: 'reportDep',
      version: '1.0.0',
      reason: 'Report test',
      level: 'error',
    });

    const report = await manager.getDeprecationReport('repo-1');
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.errors).toBeGreaterThan(0);
  });

  it('should get migration progress', async () => {
    const dep = await manager.addDeprecation({
      item: 'progressDep',
      version: '1.0.0',
      reason: 'Progress test',
      level: 'warning',
    });

    await manager.addMigrationTask(dep.id, 'Task 1');
    await manager.addMigrationTask(dep.id, 'Task 2');

    const progress = await manager.getMigrationProgress(dep.id);
    expect(progress.total).toBe(2);
    expect(progress.percentage).toBe(0);
  });

  it('should handle non-existent deprecation for migration', async () => {
    const result = await manager.addMigrationTask('nonexistent', 'Task');
    expect(result).toBeNull();
  });

  it('should handle non-existent migration task update', async () => {
    const result = await manager.updateMigrationStatus('nonexistent', 'completed');
    expect(result).toBeNull();
  });
});
