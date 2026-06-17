import { describe, it, expect, beforeEach } from 'vitest';
import { BackupManager } from './backup-manager';

describe('BackupManager', () => {
  let manager: BackupManager;

  beforeEach(() => {
    manager = new BackupManager('/test/backups');
  });

  describe('createBackupConfig', () => {
    it('should create backup config with defaults', () => {
      const config = manager.createBackupConfig({
        name: 'test-backup',
        sourcePath: '/data',
        destinationPath: '/backups',
        compression: 'gzip',
        retention: { maxBackups: 10, maxAgeDays: 30 }
      });
      expect(config.excludePatterns).toContain('node_modules');
    });
  });

  describe('createBackup', () => {
    it('should create a backup', async () => {
      const config = manager.createBackupConfig({
        name: 'test',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      const backup = await manager.createBackup(config);
      expect(backup.status).toBe('completed');
      expect(backup.id).toBeDefined();
    });
  });

  describe('getBackup', () => {
    it('should return existing backup', async () => {
      const config = manager.createBackupConfig({
        name: 'get-test',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      const created = await manager.createBackup(config);
      const backup = manager.getBackup(created.id);
      expect(backup).toBeDefined();
      expect(backup?.name).toBe('get-test');
    });

    it('should return undefined for non-existent backup', () => {
      expect(manager.getBackup('non-existent')).toBeUndefined();
    });
  });

  describe('listBackups', () => {
    it('should list all backups', async () => {
      const config = manager.createBackupConfig({
        name: 'list-test',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      await manager.createBackup(config);
      await manager.createBackup(config);
      const backups = manager.listBackups();
      expect(backups.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter backups by name', async () => {
      const config1 = manager.createBackupConfig({
        name: 'filter-me',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      const config2 = manager.createBackupConfig({
        name: 'keep-me',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      await manager.createBackup(config1);
      await manager.createBackup(config2);
      const filtered = manager.listBackups({ name: 'filter' });
      expect(filtered.every(b => b.name.includes('filter'))).toBe(true);
    });
  });

  describe('deleteBackup', () => {
    it('should delete existing backup', async () => {
      const config = manager.createBackupConfig({
        name: 'delete-test',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      const backup = await manager.createBackup(config);
      expect(manager.deleteBackup(backup.id)).toBe(true);
      expect(manager.getBackup(backup.id)).toBeUndefined();
    });
  });

  describe('restoreBackup', () => {
    it('should restore a completed backup', async () => {
      const config = manager.createBackupConfig({
        name: 'restore-test',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      const backup = await manager.createBackup(config);
      const restore = await manager.restoreBackup(backup.id, '/restore/path');
      expect(restore).toBeDefined();
      expect(restore?.backupId).toBe(backup.id);
    });
  });

  describe('createSchedule', () => {
    it('should create backup schedule', () => {
      const config = manager.createBackupConfig({
        name: 'scheduled',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'gzip',
        retention: { maxBackups: 10, maxAgeDays: 30 }
      });
      const schedule = manager.createSchedule('daily', 'Daily Backup', config);
      expect(schedule).toBeDefined();
      expect(schedule?.enabled).toBe(true);
    });

    it('should not create duplicate schedule', () => {
      const config = manager.createBackupConfig({
        name: 'dup',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      manager.createSchedule('id', 'Name', config);
      expect(manager.createSchedule('id', 'Name', config)).toBeNull();
    });
  });

  describe('getBackupStats', () => {
    it('should return backup statistics', async () => {
      const config = manager.createBackupConfig({
        name: 'stats',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      await manager.createBackup(config);
      const stats = manager.getBackupStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.completed).toBeGreaterThan(0);
    });
  });

  describe('verifyBackup', () => {
    it('should verify completed backup', async () => {
      const config = manager.createBackupConfig({
        name: 'verify',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 5, maxAgeDays: 7 }
      });
      const backup = await manager.createBackup(config);
      expect(manager.verifyBackup(backup.id)).toBe(true);
    });
  });

  describe('pruneOldBackups', () => {
    it('should identify old backups for deletion', async () => {
      const config = manager.createBackupConfig({
        name: 'prune-test',
        sourcePath: '/src',
        destinationPath: '/dest',
        compression: 'none',
        retention: { maxBackups: 2, maxAgeDays: 0 }
      });
      for (let i = 0; i < 5; i++) {
        await manager.createBackup(config);
      }
      const toDelete = manager.pruneOldBackups('prune-test', 2, 0);
      expect(toDelete.length).toBeGreaterThan(0);
    });
  });
});
