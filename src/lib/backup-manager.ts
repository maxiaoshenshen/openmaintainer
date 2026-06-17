// Backup Manager for OpenMaintainer
// Handles automated backups of maintainer data and settings

import type { MaintainerRepository } from './types';

export interface BackupConfig {
  repository: MaintainerRepository;
  includeIssues: boolean;
  includePRs: boolean;
  includeSettings: boolean;
  includeAnalytics: boolean;
  includeConfig?: boolean;
  storagePath?: string;
}

export interface Backup {
  id: string;
  timestamp: Date;
  repository: string;
  size: number;
  type: 'full' | 'incremental';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  checksum?: string;
  metadata: {
    issuesCount: number;
    prsCount: number;
    contributorsCount: number;
    analysisCount: number;
  };
}

export interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  retentionDays: number;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class BackupManager {
  private backups: Map<string, Backup> = new Map();
  private schedules: Map<string, BackupSchedule> = new Map();
  private storagePath: string;

  constructor(options?: { storagePath?: string }) {
    this.storagePath = options?.storagePath ?? '/tmp/backups';
  }

  createBackup(config: BackupConfig): Backup {
    const backup: Backup = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      repository: config.repository.identity.fullName,
      size: this.estimateSize(config),
      type: 'full',
      status: 'pending',
      metadata: {
        issuesCount: config.includeIssues ? config.repository.issues?.length ?? 0 : 0,
        prsCount: config.includePRs ? config.repository.pullRequests?.length ?? 0 : 0,
        contributorsCount: config.repository.contributors?.length ?? 0,
        analysisCount: config.includeAnalytics ? 1 : 0,
      },
    };

    this.backups.set(backup.id, backup);
    return backup;
  }

  private estimateSize(config: BackupConfig): number {
    const baseSize = 1024;
    const issuesSize = config.includeIssues ? (config.repository.issues?.length ?? 0) * 512 : 0;
    const prsSize = config.includePRs ? (config.repository.pullRequests?.length ?? 0) * 1024 : 0;
    const settingsSize = config.includeSettings || config.includeConfig ? 4096 : 0;
    return baseSize + issuesSize + prsSize + settingsSize;
  }

  getBackup(id: string): Backup | undefined {
    return this.backups.get(id);
  }

  listBackups(repository?: string): Backup[] {
    const backups = Array.from(this.backups.values());
    if (repository) {
      return backups.filter((b) => b.repository === repository);
    }
    return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  deleteBackup(id: string): boolean {
    return this.backups.delete(id);
  }

  scheduleBackup(schedule: Omit<BackupSchedule, 'id'>): BackupSchedule {
    const newSchedule: BackupSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}`,
    };
    this.schedules.set(newSchedule.id, newSchedule);
    return newSchedule;
  }

  getSchedules(): BackupSchedule[] {
    return Array.from(this.schedules.values());
  }

  calculateNextRun(schedule: BackupSchedule): Date {
    const now = new Date();
    const interval = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };

    return new Date(now.getTime() + interval[schedule.frequency]);
  }

  cleanOldBackups(repository: string, retentionDays: number): number {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    let deleted = 0;

    this.backups.forEach((backup, id) => {
      if (backup.repository === repository && backup.timestamp < cutoff) {
        this.backups.delete(id);
        deleted++;
      }
    });

    return deleted;
  }

  getTotalSize(repository?: string): number {
    let total = 0;
    this.backups.forEach((backup) => {
      if (!repository || backup.repository === repository) {
        total += backup.size;
      }
    });
    return total;
  }

  exportBackupManifest(repository?: string): string {
    const backups = this.listBackups(repository);
    const manifest = {
      exportedAt: new Date().toISOString(),
      repository: repository || 'all',
      totalBackups: backups.length,
      totalSize: this.getTotalSize(repository),
      backups: backups.map((b) => ({
        id: b.id,
        timestamp: b.timestamp.toISOString(),
        size: b.size,
        type: b.type,
        status: b.status,
      })),
    };

    return JSON.stringify(manifest, null, 2);
  }
}

export const backupManager = new BackupManager();

export function createBackupManager(): BackupManager {
  return new BackupManager();
}
