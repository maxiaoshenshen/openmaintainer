/**
 * Repository Mirror - Sync and backup remote repositories
 */

export interface MirrorConfig {
  sourceUrl: string;
  targetPath: string;
  branch: string;
  syncInterval: number;
  includeLfs: boolean;
}

export interface SyncStatus {
  lastSync: Date | null;
  lastCommit: string;
  ahead: number;
  behind: number;
  status: 'synced' | 'ahead' | 'behind' | 'diverged' | 'error';
  error?: string;
}

export interface MirrorMetadata {
  id: string;
  name: string;
  config: MirrorConfig;
  status: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class RepositoryMirror {
  private mirrors: Map<string, MirrorMetadata> = new Map();

  createMirror(id: string, name: string, config: MirrorConfig): MirrorMetadata {
    const metadata: MirrorMetadata = {
      id,
      name,
      config,
      status: {
        lastSync: null,
        lastCommit: '',
        ahead: 0,
        behind: 0,
        status: 'synced'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mirrors.set(id, metadata);
    return metadata;
  }

  getMirror(id: string): MirrorMetadata | undefined {
    return this.mirrors.get(id);
  }

  updateMirror(id: string, updates: Partial<MirrorConfig>): MirrorMetadata | null {
    const mirror = this.mirrors.get(id);
    if (!mirror) return null;

    mirror.config = { ...mirror.config, ...updates };
    mirror.updatedAt = new Date();
    return mirror;
  }

  deleteMirror(id: string): boolean {
    return this.mirrors.delete(id);
  }

  listMirrors(): MirrorMetadata[] {
    return Array.from(this.mirrors.values());
  }

  async syncMirror(id: string): Promise<SyncStatus> {
    const mirror = this.mirrors.get(id);
    if (!mirror) {
      return {
        lastSync: null,
        lastCommit: '',
        ahead: 0,
        behind: 0,
        status: 'error',
        error: 'Mirror not found'
      };
    }

    mirror.status = {
      lastSync: new Date(),
      lastCommit: this.generateMockCommit(),
      ahead: Math.floor(Math.random() * 3),
      behind: Math.floor(Math.random() * 2),
      status: this.calculateSyncStatus(0, 0)
    };
    mirror.updatedAt = new Date();

    return mirror.status;
  }

  getSyncStatus(id: string): SyncStatus | null {
    const mirror = this.mirrors.get(id);
    return mirror ? mirror.status : null;
  }

  private calculateSyncStatus(ahead: number, behind: number): SyncStatus['status'] {
    if (ahead === 0 && behind === 0) return 'synced';
    if (ahead > 0 && behind === 0) return 'ahead';
    if (ahead === 0 && behind > 0) return 'behind';
    return 'diverged';
  }

  private generateMockCommit(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  getMirrorStats(): {
    total: number;
    synced: number;
    needsSync: number;
    errors: number;
  } {
    const mirrors = Array.from(this.mirrors.values());
    return {
      total: mirrors.length,
      synced: mirrors.filter(m => m.status.status === 'synced').length,
      needsSync: mirrors.filter(m => ['ahead', 'behind', 'diverged'].includes(m.status.status)).length,
      errors: mirrors.filter(m => m.status.status === 'error').length
    };
  }

  exportConfig(id: string): MirrorConfig | null {
    const mirror = this.mirrors.get(id);
    return mirror ? mirror.config : null;
  }

  importConfig(config: MirrorConfig): MirrorMetadata {
    const id = `mirror-${Date.now()}`;
    const name = config.sourceUrl.split('/').pop() || 'Imported Mirror';
    return this.createMirror(id, name, config);
  }
}

export const createRepositoryMirror = () => new RepositoryMirror();
