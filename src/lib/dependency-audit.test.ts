import { describe, it, expect } from 'vitest';
import {
  isVulnerable,
  calculateMaintenanceScore,
  checkDependencyHealth,
  generateAuditReport,
  prioritizeUpdates
} from './dependency-audit';

describe('dependency-audit', () => {
  describe('isVulnerable', () => {
    it('should detect vulnerable versions', () => {
      expect(isVulnerable('1.0.0', '<1.0.1')).toBe(true);
      expect(isVulnerable('2.0.0', '<1.0.0')).toBe(false);
    });

    it('should handle ranges with comma separator', () => {
      expect(isVulnerable('1.5.0', '>=1.0.0,<2.0.0')).toBe(true);
      expect(isVulnerable('3.0.0', '>=1.0.0,<2.0.0')).toBe(false);
    });
  });

  describe('calculateMaintenanceScore', () => {
    it('should calculate score', () => {
      expect(calculateMaintenanceScore({ deprecated: false, hasVulnerabilities: false, updatedRecently: true })).toBe(100);
      expect(calculateMaintenanceScore({ deprecated: true, hasVulnerabilities: false, updatedRecently: true })).toBe(60);
      expect(calculateMaintenanceScore({ deprecated: true, hasVulnerabilities: true })).toBe(10);
    });
  });

  describe('checkDependencyHealth', () => {
    it('should check health status', () => {
      const health = checkDependencyHealth('lodash', '4.17.0', {
        latestVersion: '4.17.21',
        downloads: 1000000
      });
      expect(health.isOutdated).toBe(true);
      expect(health.maintenanceScore).toBeGreaterThan(50);
    });
  });

  describe('generateAuditReport', () => {
    it('should generate report', () => {
      const deps = [
        checkDependencyHealth('a', '1.0.0', { 
          vulnerabilities: [{ id: '1', severity: 'critical', package: 'a', vulnerableVersions: '*', title: 'Bug' }] 
        })
      ];
      const report = generateAuditReport(deps);
      expect(report.vulnerabilities.critical).toBe(1);
    });
  });

  describe('prioritizeUpdates', () => {
    it('should prioritize vulnerable packages', () => {
      const deps = [
        { name: 'a', version: '1.0', isOutdated: true, hasVulnerabilities: false, vulnerabilities: [], maintenanceScore: 80, downloads: 0, deprecated: false },
        { name: 'b', version: '1.0', isOutdated: true, hasVulnerabilities: true, vulnerabilities: [{ id: '1', severity: 'high', package: 'b', vulnerableVersions: '*', title: 'Bug' }], maintenanceScore: 60, downloads: 0, deprecated: false }
      ];
      const prioritized = prioritizeUpdates(deps as any);
      expect(prioritized[0].name).toBe('b');
    });
  });
});
