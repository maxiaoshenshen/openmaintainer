import { describe, it, expect } from 'vitest';
import {
  calculateCVSS,
  getSeverityScore,
  calculateRiskScore,
  canAutoFix,
  isVersionAffected,
  suggestUpgradePath,
  generateSecurityReport,
  checkLicense,
  prioritizeFixes,
  type Vulnerability,
  type License,
} from './security-scanner';

describe('security-scanner', () => {
  describe('calculateCVSS', () => {
    it('should map CVSS scores to severity', () => {
      expect(calculateCVSS(9.5)).toBe('critical');
      expect(calculateCVSS(8.0)).toBe('high');
      expect(calculateCVSS(5.0)).toBe('medium');
      expect(calculateCVSS(2.0)).toBe('low');
      expect(calculateCVSS(0)).toBe('unknown');
    });
  });

  describe('getSeverityScore', () => {
    it('should return correct scores', () => {
      expect(getSeverityScore('critical')).toBe(10);
      expect(getSeverityScore('high')).toBe(7);
      expect(getSeverityScore('medium')).toBe(4);
      expect(getSeverityScore('low')).toBe(1);
      expect(getSeverityScore('unknown')).toBe(0);
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate average risk', () => {
      const vulns: Vulnerability[] = [
        { id: '1', title: 'Test', description: '', severity: 'high', package: 'pkg', currentVersion: '1.0', exploitAvailable: false, cweIds: [], references: [], publishedAt: new Date(), affectedVersions: [] },
        { id: '2', title: 'Test', description: '', severity: 'low', package: 'pkg', currentVersion: '1.0', exploitAvailable: false, cweIds: [], references: [], publishedAt: new Date(), affectedVersions: [] },
      ];
      expect(calculateRiskScore(vulns)).toBeGreaterThan(0);
    });

    it('should return 0 for empty array', () => {
      expect(calculateRiskScore([])).toBe(0);
    });
  });

  describe('canAutoFix', () => {
    it('should indicate fix availability', () => {
      const vulnWithFix: Vulnerability = {
        id: '1', title: 'Test', description: '', severity: 'high', package: 'pkg', currentVersion: '1.0', fixedVersion: '1.1', exploitAvailable: false, cweIds: [], references: [], publishedAt: new Date(), affectedVersions: []
      };
      expect(canAutoFix(vulnWithFix)).toBe('available');

      const vulnNoFix: Vulnerability = {
        id: '2', title: 'Test', description: '', severity: 'high', package: 'pkg', currentVersion: '1.0', exploitAvailable: false, cweIds: [], references: [], publishedAt: new Date(), affectedVersions: []
      };
      expect(canAutoFix(vulnNoFix)).toBe('no-fix');
    });
  });

  describe('isVersionAffected', () => {
    it('should check version ranges', () => {
      expect(isVersionAffected('1.5.0', ['>=1.0.0'])).toBe(true);
      expect(isVersionAffected('0.9.0', ['>=1.0.0'])).toBe(false);
      expect(isVersionAffected('1.0.0', ['*'])).toBe(true);
      expect(isVersionAffected('1.5.0', ['1.0.0-2.0.0'])).toBe(true);
    });
  });

  describe('suggestUpgradePath', () => {
    it('should suggest upgrade paths', () => {
      const paths = suggestUpgradePath('1.2.3', '2.0.0');
      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0]).toContain('2.0.0');
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate comprehensive report', () => {
      const deps = [{ name: 'lodash', version: '4.17.15' }];
      const vulns: Vulnerability[] = [
        { id: '1', title: 'Prototype Pollution', description: '', severity: 'high', package: 'lodash', currentVersion: '4.17.15', fixedVersion: '4.17.21', exploitAvailable: true, cweIds: [], references: [], publishedAt: new Date(), affectedVersions: ['<=4.17.20'] }
      ];
      const report = generateSecurityReport(deps, vulns);
      expect(report.overallRisk).toBe('high');
      expect(report.criticalCount).toBe(0);
      expect(report.highCount).toBe(1);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('checkLicense', () => {
    it('should flag deprecated licenses', () => {
      const license: License = { spdxId: 'GPL-1.0', name: 'GPL v1', isOsiApproved: false, isDeprecated: true };
      const issue = checkLicense(license);
      expect(issue).not.toBeNull();
      expect(issue?.recommendation).toContain('deprecated');
    });

    it('should return null for good licenses', () => {
      const license: License = { spdxId: 'MIT', name: 'MIT License', isOsiApproved: true, isDeprecated: false };
      expect(checkLicense(license)).toBeNull();
    });
  });

  describe('prioritizeFixes', () => {
    it('should sort by severity and exploit availability', () => {
      const vulns: Vulnerability[] = [
        { id: '1', title: 'Low', description: '', severity: 'low', package: 'pkg', currentVersion: '1.0', exploitAvailable: false, cweIds: [], references: [], publishedAt: new Date(), affectedVersions: [] },
        { id: '2', title: 'Critical', description: '', severity: 'critical', package: 'pkg', currentVersion: '1.0', exploitAvailable: true, cweIds: [], references: [], publishedAt: new Date(), affectedVersions: [] },
        { id: '3', title: 'High', description: '', severity: 'high', package: 'pkg', currentVersion: '1.0', exploitAvailable: false, cweIds: [], references: [], publishedAt: new Date(), affectedVersions: [] },
      ];
      const prioritized = prioritizeFixes(vulns);
      expect(prioritized[0].severity).toBe('critical');
      expect(prioritized[0].exploitAvailable).toBe(true);
    });
  });
});
