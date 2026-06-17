import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplianceChecker } from './compliance-checker';
import { GitHubClient } from './github-client';

describe('ComplianceChecker', () => {
  let checker: ComplianceChecker;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {
      getLicense: vi.fn().mockResolvedValue({
        key: 'mit',
        spdx_id: 'MIT',
        name: 'MIT License',
        url: 'https://opensource.org/licenses/MIT'
      }),
      getFile: vi.fn().mockRejectedValue(new Error('Not found')),
      getContents: vi.fn().mockResolvedValue([]),
    } as unknown as GitHubClient;
    checker = new ComplianceChecker(mockGithub);
  });

  describe('checkLicense', () => {
    it('should return license info', async () => {
      const license = await checker.checkLicense();

      expect(license).toBeTruthy();
      expect(license?.spdxId).toBe('MIT');
      expect(license?.name).toBeTruthy();
    });

    it('should return null for no license', async () => {
      vi.mocked(mockGithub.getLicense).mockResolvedValue(null);

      const license = await checker.checkLicense();

      expect(license).toBeNull();
    });
  });

  describe('checkCompliance', () => {
    it('should return compliance report', async () => {
      const report = await checker.checkCompliance();

      expect(report).toHaveProperty('repository');
      expect(report).toHaveProperty('license');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('score');
      expect(typeof report.score).toBe('number');
    });

    it('should calculate score based on issues', async () => {
      const report = await checker.checkCompliance();

      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkSecurityFiles', () => {
    it('should detect missing security files', async () => {
      const issues = await checker.checkSecurityFiles();

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.some(i => i.file === 'SECURITY.md')).toBe(true);
    });
  });

  describe('checkDependencies', () => {
    it('should check package.json dependencies', async () => {
      const issues = await checker.checkDependencies('{"dependencies": {"lodash": "^4.17.0"}}');

      expect(Array.isArray(issues)).toBe(true);
    });

    it('should handle invalid package.json', async () => {
      const issues = await checker.checkDependencies('invalid json');

      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('generateBadge', () => {
    it('should return badge color', async () => {
      const badge = await checker.generateBadge();

      expect(['green', 'yellow', 'orange', 'red']).toContain(badge);
    });
  });

  describe('recommendLicense', () => {
    it('should recommend licenses for library', () => {
      const recs = checker.recommendLicense('library');

      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should recommend licenses for application', () => {
      const recs = checker.recommendLicense('application');

      expect(Array.isArray(recs)).toBe(true);
    });
  });

  describe('checkTrademarkUsage', () => {
    it('should detect trademark mentions', () => {
      const issues = checker.checkTrademarkUsage('Built with React and Node.js');

      expect(issues.length).toBeGreaterThan(0);
    });
  });
});
