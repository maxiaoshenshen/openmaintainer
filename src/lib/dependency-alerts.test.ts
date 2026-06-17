import { describe, it, expect } from 'vitest';
import { checkVersionDiff, filterUpdates, generateAlertMessage, prioritizeUpdates, generateUpdatePR } from './dependency-alerts';

describe('Dependency Alerts', () => {
  describe('checkVersionDiff', () => {
    it('should detect major updates', () => {
      expect(checkVersionDiff('1.0.0', '2.0.0')).toBe('major');
    });

    it('should detect minor updates', () => {
      expect(checkVersionDiff('1.0.0', '1.1.0')).toBe('minor');
    });

    it('should detect patch updates', () => {
      expect(checkVersionDiff('1.0.0', '1.0.1')).toBe('patch');
    });
  });

  describe('filterUpdates', () => {
    const updates = [
      { name: 'pkg-a', currentVersion: '1.0.0', latestVersion: '2.0.0', type: 'major', releaseDate: '2024-01-01' },
      { name: 'pkg-b', currentVersion: '1.0.0', latestVersion: '1.1.0', type: 'minor', releaseDate: '2024-01-01' },
      { name: 'pkg-c', currentVersion: '1.0.0', latestVersion: '1.0.1', type: 'patch', releaseDate: '2024-01-01' },
    ];

    it('should filter by allowed updates', () => {
      const filtered = filterUpdates(updates, { allowedUpdates: 'patch' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('pkg-c');
    });

    it('should exclude specified packages', () => {
      const filtered = filterUpdates(updates, { excludePackages: ['pkg-a'] });
      expect(filtered.find(u => u.name === 'pkg-a')).toBeUndefined();
    });
  });

  describe('generateAlertMessage', () => {
    it('should generate alert for security issues', () => {
      const alert = {
        outdated: [],
        security: [{ id: '1', severity: 'critical' as const, package: 'pkg', versions: ['1.0.0'], description: 'test' }],
        deprecated: [],
        summary: '',
      };
      const msg = generateAlertMessage(alert);
      expect(msg).toContain('Security Alerts');
    });

    it('should return success message when no alerts', () => {
      const alert = { outdated: [], security: [], deprecated: [], summary: '' };
      expect(generateAlertMessage(alert)).toContain('up to date');
    });
  });

  describe('prioritizeUpdates', () => {
    it('should prioritize vulnerable packages', () => {
      const updates = [
        { name: 'safe', currentVersion: '1.0.0', latestVersion: '2.0.0', type: 'major' as const, releaseDate: '2024-01-01' },
        { name: 'vuln', currentVersion: '1.0.0', latestVersion: '2.0.0', type: 'patch' as const, releaseDate: '2024-01-01' },
      ];
      const vulnerabilities = [{ id: '1', severity: 'high' as const, package: 'vuln', versions: ['1.0.0'], description: '' }];
      const prioritized = prioritizeUpdates(updates, vulnerabilities);
      expect(prioritized[0].name).toBe('vuln');
    });
  });

  describe('generateUpdatePR', () => {
    it('should group updates by type', () => {
      const updates = [
        { name: 'pkg1', currentVersion: '1.0.0', latestVersion: '2.0.0', type: 'major' as const, releaseDate: '2024-01-01' },
        { name: 'pkg2', currentVersion: '1.0.0', latestVersion: '1.1.0', type: 'minor' as const, releaseDate: '2024-01-01' },
      ];
      const pr = generateUpdatePR(updates);
      expect(pr).toContain('Major Updates');
      expect(pr).toContain('Minor Updates');
    });
  });
});
