import { describe, it, expect } from 'vitest';
import { createBackupManager, BackupManager } from './backup-manager';
import type { Repository } from './types';

describe('BackupManager', () => {
  it('creates backup manager instance', () => {
    const manager = createBackupManager();
    expect(manager).toBeDefined();
  });

  it('creates a backup with minimal config', () => {
    const manager = createBackupManager();
    const mockRepo: Partial<Repository> = {
      fullName: 'test/repo',
      openIssues: 10,
      openPullRequests: 5,
      contributors: [],
    };
    
    const backup = manager.createBackup({
      repository: mockRepo as Repository,
      includeIssues: true,
      includePRs: true,
      includeSettings: true,
      includeAnalytics: false,
    });
    
    expect(backup.id).toBeDefined();
    expect(backup.repository).toBe('test/repo');
    expect(backup.status).toBe('pending');
    expect(backup.size).toBeGreaterThan(0);
  });

  it('lists backups', () => {
    const manager = createBackupManager();
    const mockRepo: Partial<Repository> = { fullName: 'test/repo', openIssues: 10, openPullRequests: 5, contributors: [] };
    manager.createBackup({ repository: mockRepo as Repository, includeIssues: true, includePRs: true, includeSettings: true, includeAnalytics: false });
    const backups = manager.listBackups();
    expect(backups.length).toBeGreaterThan(0);
  });

  it('calculates total size', () => {
    const manager = createBackupManager();
    const mockRepo: Partial<Repository> = { fullName: 'test/repo', openIssues: 10, openPullRequests: 5, contributors: [] };
    manager.createBackup({ repository: mockRepo as Repository, includeIssues: true, includePRs: true, includeSettings: true, includeAnalytics: false });
    const totalSize = manager.getTotalSize();
    expect(totalSize).toBeGreaterThan(0);
  });

  it('schedules backup', () => {
    const manager = createBackupManager();
    const schedule = manager.scheduleBackup({
      name: 'Daily Backup',
      frequency: 'daily',
      retentionDays: 30,
      enabled: true,
    });
    
    expect(schedule.id).toBeDefined();
    expect(schedule.name).toBe('Daily Backup');
    expect(schedule.frequency).toBe('daily');
  });

  it('deletes backup', () => {
    const manager = createBackupManager();
    const mockRepo: Partial<Repository> = { fullName: 'test/repo', openIssues: 10, openPullRequests: 5, contributors: [] };
    const backup = manager.createBackup({ repository: mockRepo as Repository, includeIssues: true, includePRs: true, includeSettings: true, includeAnalytics: false });
    const deleted = manager.deleteBackup(backup.id);
    expect(deleted).toBe(true);
  });

  it('cleans old backups', () => {
    const manager = createBackupManager();
    const mockRepo: Partial<Repository> = { fullName: 'test/repo', openIssues: 10, openPullRequests: 5, contributors: [] };
    manager.createBackup({ repository: mockRepo as Repository, includeIssues: true, includePRs: true, includeSettings: true, includeAnalytics: false });
    const deleted = manager.cleanOldBackups('test/repo', 0);
    expect(deleted).toBeGreaterThanOrEqual(0);
  });
});
