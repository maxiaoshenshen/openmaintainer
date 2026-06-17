export type DeprecationLevel = 'warning' | 'error' | 'removed';
export type MigrationStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';

export interface Deprecation {
  id: string;
  item: string;
  version: string;
  removedIn?: string;
  reason: string;
  alternative?: string;
  level: DeprecationLevel;
  migrationGuide?: string;
  affectedEndpoints?: string[];
  createdAt: Date;
}

export interface MigrationTask {
  id: string;
  deprecationId: string;
  task: string;
  status: MigrationStatus;
  assignee?: string;
  completedAt?: Date;
}

export interface DeprecationReport {
  repoId: string;
  deprecations: Deprecation[];
  migrations: MigrationTask[];
  summary: {
    total: number;
    warnings: number;
    errors: number;
    removed: number;
    migrated: number;
    pending: number;
  };
}

export class DeprecationManager {
  private deprecations: Map<string, Deprecation> = new Map();
  private migrations: Map<string, MigrationTask[]> = new Map();

  async addDeprecation(data: {
    item: string;
    version: string;
    reason: string;
    alternative?: string;
    level: DeprecationLevel;
    removedIn?: string;
    migrationGuide?: string;
    affectedEndpoints?: string[];
  }): Promise<Deprecation> {
    const deprecation: Deprecation = {
      id: `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...data,
      createdAt: new Date(),
    };

    this.deprecations.set(deprecation.id, deprecation);
    this.migrations.set(deprecation.id, []);
    return deprecation;
  }

  async addMigrationTask(deprecationId: string, task: string, assignee?: string): Promise<MigrationTask | null> {
    const deprecation = this.deprecations.get(deprecationId);
    if (!deprecation) return null;

    const migration: MigrationTask = {
      id: `MIG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      deprecationId,
      task,
      status: 'pending',
      assignee,
    };

    const tasks = this.migrations.get(deprecationId) || [];
    tasks.push(migration);
    this.migrations.set(deprecationId, tasks);

    return migration;
  }

  async updateMigrationStatus(taskId: string, status: MigrationStatus): Promise<MigrationTask | null> {
    for (const [deprecationId, tasks] of this.migrations.entries()) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        if (status === 'completed') {
          task.completedAt = new Date();
        }
        return task;
      }
    }
    return null;
  }

  async getDeprecation(id: string): Promise<Deprecation | null> {
    return this.deprecations.get(id) || null;
  }

  async getAllDeprecations(repoId?: string): Promise<Deprecation[]> {
    return Array.from(this.deprecations.values());
  }

  async getDeprecationReport(repoId: string): Promise<DeprecationReport> {
    const deprecations = Array.from(this.deprecations.values());
    const allMigrations = Array.from(this.migrations.values()).flat();

    const summary = {
      total: deprecations.length,
      warnings: deprecations.filter(d => d.level === 'warning').length,
      errors: deprecations.filter(d => d.level === 'error').length,
      removed: deprecations.filter(d => d.level === 'removed').length,
      migrated: allMigrations.filter(m => m.status === 'completed').length,
      pending: allMigrations.filter(m => m.status === 'pending').length,
    };

    return { repoId, deprecations, migrations: allMigrations, summary };
  }

  async getActiveDeprecations(): Promise<Deprecation[]> {
    return Array.from(this.deprecations.values()).filter(
      d => d.level !== 'removed'
    );
  }

  async getMigrationProgress(deprecationId: string): Promise<{
    total: number;
    completed: number;
    percentage: number;
  }> {
    const tasks = this.migrations.get(deprecationId) || [];
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    return {
      total: tasks.length,
      completed,
      percentage: tasks.length > 0 ? (completed / tasks.length) * 100 : 0,
    };
  }
}
