import { describe, it, expect } from 'vitest';
import { BranchStrategyManager } from './branch-strategy';

describe('BranchStrategyManager', () => {
  const manager = new BranchStrategyManager();

  it('should initialize with main branch', async () => {
    const main = await manager.getBranch('main');
    expect(main).toBeDefined();
    expect(main?.type).toBe('main');
  });

  it('should create branch', async () => {
    const branch = await manager.createBranch('feature/new-feature', 'feature');
    expect(branch.name).toBe('feature/new-feature');
    expect(branch.type).toBe('feature');
  });

  it('should get branch', async () => {
    await manager.createBranch('feature/test', 'feature');
    const branch = await manager.getBranch('feature/test');
    expect(branch).toBeDefined();
    expect(branch?.name).toBe('feature/test');
  });

  it('should get all branches', async () => {
    const branches = await manager.getAllBranches();
    expect(branches.length).toBeGreaterThan(0);
    expect(branches.some(b => b.name === 'main')).toBe(true);
  });

  it('should filter branches by type', async () => {
    await manager.createBranch('feature/feat1', 'feature');
    await manager.createBranch('feature/feat2', 'feature');
    await manager.createBranch('hotfix/hot1', 'hotfix');

    const features = await manager.getBranchesByType('feature');
    expect(features.length).toBeGreaterThanOrEqual(2);
    expect(features.every(b => b.type === 'feature')).toBe(true);
  });

  it('should update branch', async () => {
    await manager.createBranch('feature/update-test', 'feature');
    const updated = await manager.updateBranch('feature/update-test', {
      lastCommitAt: new Date(),
    });
    expect(updated).toBeDefined();
  });

  it('should delete branch', async () => {
    await manager.createBranch('feature/to-delete', 'feature');
    const deleted = await manager.deleteBranch('feature/to-delete');
    expect(deleted).toBe(true);

    const branch = await manager.getBranch('feature/to-delete');
    expect(branch).toBeNull();
  });

  it('should protect branch', async () => {
    await manager.createBranch('feature/protected', 'feature');
    const protected_ = await manager.protectBranch('feature/protected', {
      requireReviews: 1,
      requireStatusChecks: true,
      requireBranchesUpToDate: true,
      dismissStaleReviews: true,
      requireCodeOwnerReview: false,
      requireLinearHistory: false,
    });

    expect(protected_?.protectionRules).toBeDefined();
    expect(protected_?.protectionRules?.requireReviews).toBe(1);
  });

  it('should remove protection', async () => {
    await manager.createBranch('feature/unprotect', 'feature');
    await manager.protectBranch('feature/unprotect', {
      requireReviews: 2,
      requireStatusChecks: true,
      requireBranchesUpToDate: true,
      dismissStaleReviews: true,
      requireCodeOwnerReview: false,
      requireLinearHistory: false,
    });

    const unprotected = await manager.removeProtection('feature/unprotect');
    expect(unprotected?.protectionRules).toBeUndefined();
  });

  it('should set and get merge strategy', async () => {
    await manager.setMergeStrategy('main', {
      type: 'merge',
      deleteBranchAfterMerge: true,
      allowEditsFromMaintainers: true,
    });

    const strategy = await manager.getMergeStrategy('main');
    expect(strategy?.type).toBe('merge');
    expect(strategy?.deleteBranchAfterMerge).toBe(true);
  });

  it('should merge branches', async () => {
    await manager.createBranch('feature/to-merge', 'feature');
    const result = await manager.mergeBranch('feature/to-merge', 'main');
    expect(result.success).toBeDefined();
  });

  it('should get metrics', async () => {
    const metrics = await manager.getMetrics();
    expect(metrics.totalBranches).toBeGreaterThan(0);
    expect(metrics).toHaveProperty('activeBranches');
    expect(metrics).toHaveProperty('staleBranches');
    expect(metrics).toHaveProperty('avgLifetime');
    expect(metrics).toHaveProperty('mergeRate');
  });

  it('should get stale branches', async () => {
    const stale = await manager.getStaleBranches(30);
    expect(Array.isArray(stale)).toBe(true);
  });

  it('should suggest branch name', async () => {
    const name = await manager.suggestBranchName('feature', 'Add new login feature');
    expect(name).toContain('feature/');
    expect(name).toContain('new-login');
  });

  it('should validate branch names', async () => {
    const valid = await manager.validateBranchName('feature/valid-name');
    expect(valid.valid).toBe(true);

    const invalid = await manager.validateBranchName('');
    expect(invalid.valid).toBe(false);

    const invalidSpace = await manager.validateBranchName('has space');
    expect(invalidSpace.valid).toBe(false);
  });
});
