import { describe, it, expect } from 'vitest';
import { SecurityAdvisoryTracker, securityAdvisoryTracker } from './security-advisory-tracker';

describe('SecurityAdvisoryTracker', () => {
  const tracker = new SecurityAdvisoryTracker();

  describe('searchAdvisories', () => {
    it('should search for advisories by query', async () => {
      const results = await tracker.searchAdvisories('lodash');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('ghsaId');
      expect(results[0]).toHaveProperty('severity');
    });
  });

  describe('getAdvisory', () => {
    it('should get advisory by GHSA ID', async () => {
      const advisory = await tracker.getAdvisory('GHSA-xxxx-xxxx-xxxx');
      expect(advisory).not.toBeNull();
      expect(advisory?.ghsaId).toBe('GHSA-xxxx-xxxx-xxxx');
    });
  });

  describe('checkPackageVulnerabilities', () => {
    it('should check vulnerabilities for a package', async () => {
      const alerts = await tracker.checkPackageVulnerabilities('lodash', 'npm');
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toHaveProperty('id');
      expect(alerts[0]).toHaveProperty('advisory');
      expect(alerts[0]).toHaveProperty('recommendedAction');
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate security report from dependencies', async () => {
      const deps = [
        { name: 'lodash', version: '1.0.0', ecosystem: 'npm' },
        { name: 'express', version: '4.17.0', ecosystem: 'npm' }
      ];
      const report = await tracker.generateSecurityReport(deps);
      expect(report).toHaveProperty('totalAdvisories');
      expect(report).toHaveProperty('criticalCount');
      expect(report).toHaveProperty('highCount');
      expect(report).toHaveProperty('needsImmediateAction');
      expect(report).toHaveProperty('summary');
    });
  });

  describe('filterAdvisories', () => {
    it('should filter by severity', async () => {
      const advisories = await tracker.searchAdvisories('test');
      const filtered = tracker.filterAdvisories(advisories, { severity: ['critical', 'high'] });
      filtered.forEach(adv => {
        expect(['critical', 'high']).toContain(adv.severity);
      });
    });

    it('should filter by ecosystem', async () => {
      const advisories = await tracker.searchAdvisories('test');
      const filtered = tracker.filterAdvisories(advisories, { ecosystem: 'npm' });
      filtered.forEach(adv => {
        expect(adv.vulnerabilities.some(v => v.ecosystem === 'npm')).toBe(true);
      });
    });
  });

  describe('getSeverityFromScore', () => {
    it('should return critical for scores >= 9.0', () => {
      expect(tracker.getSeverityFromScore(9.5)).toBe('critical');
      expect(tracker.getSeverityFromScore(10.0)).toBe('critical');
    });

    it('should return high for scores 7.0-8.9', () => {
      expect(tracker.getSeverityFromScore(7.0)).toBe('high');
      expect(tracker.getSeverityFromScore(8.5)).toBe('high');
    });

    it('should return medium for scores 4.0-6.9', () => {
      expect(tracker.getSeverityFromScore(4.0)).toBe('medium');
      expect(tracker.getSeverityFromScore(5.5)).toBe('medium');
    });

    it('should return low for scores < 4.0', () => {
      expect(tracker.getSeverityFromScore(3.5)).toBe('low');
      expect(tracker.getSeverityFromScore(0)).toBe('low');
    });
  });
});
