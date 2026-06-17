import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityScanner } from './security-scanner';
import { GitHubClient } from './github-client';

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;
  let mockGithub: GitHubClient;

  beforeEach(() => {
    mockGithub = {
      getFile: vi.fn().mockRejectedValue(new Error('Not found')),
    } as unknown as GitHubClient;
    scanner = new SecurityScanner(mockGithub);
  });

  describe('scan', () => {
    it('should return security report', async () => {
      const report = await scanner.scan();

      expect(report).toHaveProperty('vulnerabilities');
      expect(report).toHaveProperty('secrets');
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('grade');
      expect(report).toHaveProperty('recommendations');
      expect(typeof report.score).toBe('number');
      expect(['A', 'B', 'C', 'D', 'F']).toContain(report.grade);
    });

    it('should calculate score based on issues', async () => {
      const report = await scanner.scan();

      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkVulnerabilities', () => {
    it('should return vulnerabilities array', async () => {
      const vulnerabilities = await scanner.checkVulnerabilities();

      expect(Array.isArray(vulnerabilities)).toBe(true);
    });

    it('should detect lodash vulnerability', async () => {
      vi.mocked(mockGithub.getFile).mockResolvedValue('{"dependencies": {"lodash": "^4.17.0"}}' as any);

      const vulnerabilities = await scanner.checkVulnerabilities();

      expect(vulnerabilities.some(v => v.title?.includes('Lodash'))).toBe(true);
    });
  });

  describe('checkSecrets', () => {
    it('should return secrets array', async () => {
      const secrets = await scanner.checkSecrets();

      expect(Array.isArray(secrets)).toBe(true);
    });
  });

  describe('generateBadge', () => {
    it('should return badge URL', async () => {
      const badge = await scanner.generateBadge();

      expect(typeof badge).toBe('string');
      expect(badge).toContain('shields.io');
      expect(badge).toContain('security');
    });
  });

  describe('checkDependencies', () => {
    it('should return dependency list', async () => {
      const deps = await scanner.checkDependencies();

      expect(Array.isArray(deps)).toBe(true);
    });
  });

  describe('generateSecurityPolicy', () => {
    it('should return security policy markdown', async () => {
      const policy = await scanner.generateSecurityPolicy();

      expect(typeof policy).toBe('string');
      expect(policy).toContain('Security Policy');
      expect(policy).toContain('Reporting a Vulnerability');
    });
  });
});
