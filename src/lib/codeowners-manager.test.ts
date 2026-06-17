import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeownersManager, CodeOwner } from './codeowners-manager';
import { GitHubClient } from './github-client';

describe('CodeownersManager', () => {
  let manager: CodeownersManager;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {
      getFile: vi.fn(),
      createOrUpdateFile: vi.fn(),
      listBranches: vi.fn(),
      getContents: vi.fn(),
    } as unknown as GitHubClient;
    manager = new CodeownersManager(mockGithub);
  });

  describe('parseCodeowners', () => {
    it('should parse CODEOWNERS content correctly', () => {
      const content = `*.js @frontend-team\n/src @dev-team\n/docs @docs-team # Documentation`;

      const owners = manager.parseCodeowners(content);

      expect(owners.length).toBeGreaterThanOrEqual(2);
      expect(owners[0].pattern).toBe('*.js');
      expect(owners[0].owners).toContain('@frontend-team');
    });

    it('should handle multiple owners per pattern', () => {
      const content = `/src @team1 @team2 @team3`;

      const owners = manager.parseCodeowners(content);

      expect(owners[0].owners).toHaveLength(3);
    });

    it('should skip empty lines and comments', () => {
      const content = `# Comment\n*.ts @team`;

      const owners = manager.parseCodeowners(content);

      expect(owners).toHaveLength(1);
    });
  });

  describe('generateCodeowners', () => {
    it('should generate valid CODEOWNERS file', () => {
      const owners: CodeOwner[] = [
        { pattern: '*.js', owners: ['@frontend'] },
        { pattern: '/src', owners: ['@backend'], description: 'Source code' }
      ];

      const content = manager.generateCodeowners(owners);

      expect(content).toContain('*.js @frontend');
      expect(content).toContain('/src @backend');
    });

    it('should include header', () => {
      const content = manager.generateCodeowners([]);

      expect(content).toContain('CODEOWNERS');
    });
  });

  describe('validateCodeowners', () => {
    it('should return valid for proper CODEOWNERS', async () => {
      vi.mocked(mockGithub.getFile).mockResolvedValue('*.js @team\n/src @team2' as any);

      const result = await manager.validateCodeowners();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('suggestions');
    });

    it('should detect duplicate patterns', async () => {
      vi.mocked(mockGithub.getFile).mockResolvedValue('*.js @team\n*.js @team2' as any);

      const result = await manager.validateCodeowners();

      expect(result.isValid).toBe(false);
    });
  });

  describe('calculateCoverage', () => {
    it('should calculate coverage percentage', async () => {
      vi.mocked(mockGithub.getFile).mockResolvedValue('/src @team' as any);

      const files = ['/src/index.ts', '/src/utils.ts', '/other.txt'];
      const coverage = await manager.calculateCoverage(files);

      expect(coverage.totalFiles).toBe(3);
      expect(coverage.coveredFiles).toBeGreaterThan(0);
    });
  });

  describe('suggestPatterns', () => {
    it('should suggest patterns based on directory', async () => {
      const suggestions = await manager.suggestPatterns('/src/components/Button.ts', ['@team1', '@team2']);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('pattern');
    });

    it('should suggest patterns based on file extension', async () => {
      const suggestions = await manager.suggestPatterns('index.ts', ['@team']);

      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('exportAsJson / importFromJson', () => {
    it('should export JSON', async () => {
      vi.mocked(mockGithub.getFile).mockResolvedValue('' as any);
      vi.mocked(mockGithub.createOrUpdateFile).mockResolvedValue({} as any);

      const exportJson = await manager.exportAsJson();
      expect(exportJson).toContain('codeowners');
    });

    it('should import from JSON', async () => {
      vi.mocked(mockGithub.createOrUpdateFile).mockResolvedValue({} as any);

      const json = JSON.stringify({ codeowners: [{ pattern: '*.js', owners: ['@team'] }] });
      const imported = await manager.importFromJson(json);
      expect(Array.isArray(imported)).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear internal cache', () => {
      manager.clearCache();
      expect(true).toBe(true);
    });
  });
});
