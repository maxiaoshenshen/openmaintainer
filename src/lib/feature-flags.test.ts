import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureFlagManager } from './feature-flags';

describe('FeatureFlagManager', () => {
  let manager: FeatureFlagManager;

  beforeEach(() => {
    manager = new FeatureFlagManager({ enableLogging: false });
  });

  describe('createFlag', () => {
    it('should create a new feature flag', () => {
      const flag = manager.createFlag({
        id: 'test-flag',
        name: 'Test Flag',
        description: 'A test flag',
        enabled: false,
        rolloutPercentage: 100
      });

      expect(flag.id).toBe('test-flag');
      expect(flag.name).toBe('Test Flag');
      expect(flag.enabled).toBe(false);
      expect(flag.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getFlag', () => {
    it('should return existing flag', () => {
      manager.createFlag({
        id: 'my-flag',
        name: 'My Flag',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 50
      });

      const flag = manager.getFlag('my-flag');
      expect(flag).toBeDefined();
      expect(flag?.name).toBe('My Flag');
    });

    it('should return undefined for non-existent flag', () => {
      expect(manager.getFlag('non-existent')).toBeUndefined();
    });
  });

  describe('updateFlag', () => {
    it('should update existing flag', () => {
      manager.createFlag({
        id: 'updatable',
        name: 'Original',
        description: 'Test',
        enabled: false,
        rolloutPercentage: 0
      });

      const updated = manager.updateFlag('updatable', {
        name: 'Updated',
        enabled: true
      });

      expect(updated?.name).toBe('Updated');
      expect(updated?.enabled).toBe(true);
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(updated!.createdAt.getTime());
    });
  });

  describe('deleteFlag', () => {
    it('should delete existing flag', () => {
      manager.createFlag({
        id: 'to-delete',
        name: 'Delete Me',
        description: 'Test',
        enabled: false,
        rolloutPercentage: 0
      });

      expect(manager.deleteFlag('to-delete')).toBe(true);
      expect(manager.getFlag('to-delete')).toBeUndefined();
    });
  });

  describe('evaluateFlag', () => {
    it('should return false for disabled flag', () => {
      manager.createFlag({
        id: 'disabled-flag',
        name: 'Disabled',
        description: 'Test',
        enabled: false,
        rolloutPercentage: 100
      });

      const result = manager.evaluateFlag('disabled-flag', {});
      expect(result.result).toBe(false);
      expect(result.reason).toBe('disabled');
    });

    it('should respect rollout percentage', () => {
      manager.createFlag({
        id: 'rollout-flag',
        name: 'Rollout',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 100
      });

      const result = manager.evaluateFlag('rollout-flag', {});
      expect(result.result).toBe(true);
    });

    it('should check target users', () => {
      manager.createFlag({
        id: 'user-flag',
        name: 'User Targeted',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 100,
        targetUsers: ['user1', 'user2']
      });

      const allowed = manager.evaluateFlag('user-flag', { userId: 'user1' });
      const denied = manager.evaluateFlag('user-flag', { userId: 'user3' });

      expect(allowed.result).toBe(true);
      expect(denied.result).toBe(false);
      expect(denied.reason).toBe('user_not_targeted');
    });

    it('should return default for non-existent flag', () => {
      const result = manager.evaluateFlag('non-existent', {});
      expect(result.result).toBe(false);
      expect(result.reason).toBe('flag_not_found');
    });
  });

  describe('enableFlag / disableFlag', () => {
    it('should enable flag', () => {
      manager.createFlag({
        id: 'toggle-flag',
        name: 'Toggle',
        description: 'Test',
        enabled: false,
        rolloutPercentage: 100
      });

      expect(manager.enableFlag('toggle-flag')).toBe(true);
      expect(manager.getFlag('toggle-flag')?.enabled).toBe(true);
    });

    it('should disable flag', () => {
      manager.createFlag({
        id: 'toggle-flag-2',
        name: 'Toggle 2',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 100
      });

      expect(manager.disableFlag('toggle-flag-2')).toBe(true);
      expect(manager.getFlag('toggle-flag-2')?.enabled).toBe(false);
    });
  });

  describe('setRolloutPercentage', () => {
    it('should update rollout percentage', () => {
      manager.createFlag({
        id: 'rollout-test',
        name: 'Rollout Test',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 0
      });

      manager.setRolloutPercentage('rollout-test', 50);
      expect(manager.getFlag('rollout-test')?.rolloutPercentage).toBe(50);
    });

    it('should clamp percentage to valid range', () => {
      manager.createFlag({
        id: 'clamp-test',
        name: 'Clamp Test',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 50
      });

      manager.setRolloutPercentage('clamp-test', 150);
      expect(manager.getFlag('clamp-test')?.rolloutPercentage).toBe(100);

      manager.setRolloutPercentage('clamp-test', -10);
      expect(manager.getFlag('clamp-test')?.rolloutPercentage).toBe(0);
    });
  });

  describe('batchEvaluate', () => {
    it('should evaluate multiple flags', () => {
      manager.createFlag({
        id: 'flag-a',
        name: 'Flag A',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 100
      });
      manager.createFlag({
        id: 'flag-b',
        name: 'Flag B',
        description: 'Test',
        enabled: false,
        rolloutPercentage: 100
      });

      const results = manager.batchEvaluate(['flag-a', 'flag-b'], {});
      expect(results).toHaveLength(2);
      expect(results[0].result).toBe(true);
      expect(results[1].result).toBe(false);
    });
  });

  describe('getFlagStats', () => {
    it('should return correct statistics', () => {
      manager.createFlag({
        id: 'stats-1',
        name: 'Stats 1',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 20
      });
      manager.createFlag({
        id: 'stats-2',
        name: 'Stats 2',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 60
      });
      manager.createFlag({
        id: 'stats-3',
        name: 'Stats 3',
        description: 'Test',
        enabled: false,
        rolloutPercentage: 80
      });

      const stats = manager.getFlagStats();
      expect(stats.total).toBe(3);
      expect(stats.enabled).toBe(2);
      expect(stats.disabled).toBe(1);
    });
  });

  describe('export/import', () => {
    it('should export all flags', () => {
      manager.createFlag({
        id: 'export-1',
        name: 'Export 1',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 100
      });

      const exported = manager.exportFlags();
      expect(exported).toHaveLength(1);
      expect(exported[0].id).toBe('export-1');
    });

    it('should import new flags', () => {
      const imported = manager.importFlags([
        {
          id: 'import-1',
          name: 'Imported',
          description: 'Test',
          enabled: true,
          rolloutPercentage: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      expect(imported).toBe(1);
      expect(manager.getFlag('import-1')).toBeDefined();
    });
  });
});
