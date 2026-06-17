import { describe, it, expect, beforeEach } from 'vitest';
import { RepositoryMirror } from './repository-mirror';

describe('RepositoryMirror', () => {
  let mirror: RepositoryMirror;

  beforeEach(() => {
    mirror = new RepositoryMirror();
  });

  describe('createMirror', () => {
    it('should create a new mirror', () => {
      const metadata = mirror.createMirror('repo-1', 'Test Repo', {
        sourceUrl: 'https://github.com/test/repo',
        targetPath: '/tmp/repo',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: true
      });

      expect(metadata.id).toBe('repo-1');
      expect(metadata.name).toBe('Test Repo');
      expect(metadata.status.status).toBe('synced');
    });
  });

  describe('getMirror', () => {
    it('should return existing mirror', () => {
      mirror.createMirror('mirror-1', 'Mirror 1', {
        sourceUrl: 'https://github.com/test/repo',
        targetPath: '/tmp/repo',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: false
      });

      const found = mirror.getMirror('mirror-1');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Mirror 1');
    });

    it('should return undefined for non-existent', () => {
      expect(mirror.getMirror('non-existent')).toBeUndefined();
    });
  });

  describe('updateMirror', () => {
    it('should update mirror config', () => {
      mirror.createMirror('update-test', 'Update Test', {
        sourceUrl: 'https://github.com/test/repo',
        targetPath: '/tmp/repo',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: false
      });

      const updated = mirror.updateMirror('update-test', {
        branch: 'develop',
        syncInterval: 7200000
      });

      expect(updated?.config.branch).toBe('develop');
      expect(updated?.config.syncInterval).toBe(7200000);
    });

    it('should return null for non-existent', () => {
      expect(mirror.updateMirror('non-existent', { branch: 'main' })).toBeNull();
    });
  });

  describe('deleteMirror', () => {
    it('should delete existing mirror', () => {
      mirror.createMirror('delete-test', 'Delete Test', {
        sourceUrl: 'https://github.com/test/repo',
        targetPath: '/tmp/repo',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: false
      });

      expect(mirror.deleteMirror('delete-test')).toBe(true);
      expect(mirror.getMirror('delete-test')).toBeUndefined();
    });

    it('should return false for non-existent', () => {
      expect(mirror.deleteMirror('non-existent')).toBe(false);
    });
  });

  describe('listMirrors', () => {
    it('should list all mirrors', () => {
      mirror.createMirror('list-1', 'List 1', {
        sourceUrl: 'https://github.com/test/repo1',
        targetPath: '/tmp/repo1',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: false
      });
      mirror.createMirror('list-2', 'List 2', {
        sourceUrl: 'https://github.com/test/repo2',
        targetPath: '/tmp/repo2',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: false
      });

      const mirrors = mirror.listMirrors();
      expect(mirrors).toHaveLength(2);
    });
  });

  describe('syncMirror', () => {
    it('should sync mirror successfully', async () => {
      mirror.createMirror('sync-test', 'Sync Test', {
        sourceUrl: 'https://github.com/test/repo',
        targetPath: '/tmp/repo',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: false
      });

      const status = await mirror.syncMirror('sync-test');
      expect(status.lastSync).toBeInstanceOf(Date);
      expect(status.lastCommit).toBeTruthy();
    });

    it('should return error for non-existent', async () => {
      const status = await mirror.syncMirror('non-existent');
      expect(status.status).toBe('error');
      expect(status.error).toBe('Mirror not found');
    });
  });

  describe('getSyncStatus', () => {
    it('should return current sync status', async () => {
      mirror.createMirror('status-test', 'Status Test', {
        sourceUrl: 'https://github.com/test/repo',
        targetPath: '/tmp/repo',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: false
      });

      const status = mirror.getSyncStatus('status-test');
      expect(status).toBeDefined();
      expect(status?.status).toBe('synced');
    });

    it('should return null for non-existent', () => {
      expect(mirror.getSyncStatus('non-existent')).toBeNull();
    });
  });

  describe('getMirrorStats', () => {
    it('should return correct stats', () => {
      mirror.createMirror('stats-1', 'Stats 1', {
        sourceUrl: 'https://github.com/test/repo1',
        targetPath: '/tmp/repo1',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: false
      });
      mirror.createMirror('stats-2', 'Stats 2', {
        sourceUrl: 'https://github.com/test/repo2',
        targetPath: '/tmp/repo2',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: false
      });

      const stats = mirror.getMirrorStats();
      expect(stats.total).toBe(2);
      expect(stats.synced).toBe(2);
    });
  });

  describe('exportConfig', () => {
    it('should export mirror config', () => {
      mirror.createMirror('export-test', 'Export Test', {
        sourceUrl: 'https://github.com/test/repo',
        targetPath: '/tmp/repo',
        branch: 'main',
        syncInterval: 3600000,
        includeLfs: true
      });

      const config = mirror.exportConfig('export-test');
      expect(config?.sourceUrl).toBe('https://github.com/test/repo');
      expect(config?.includeLfs).toBe(true);
    });
  });

  describe('importConfig', () => {
    it('should import new config', () => {
      const metadata = mirror.importConfig({
        sourceUrl: 'https://github.com/import/repo',
        targetPath: '/tmp/import',
        branch: 'develop',
        syncInterval: 7200000,
        includeLfs: false
      });

      expect(metadata.config.sourceUrl).toBe('https://github.com/import/repo');
      expect(metadata.id).toContain('mirror-');
    });
  });
});
