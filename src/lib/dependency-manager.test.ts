import { describe, it, expect } from 'vitest';
import { 
  analyzeDependencyHealth,
  prioritizeDependencyUpdates,
  createDependencyUpdatePR,
  calculateUpdateRisk,
  generateDependencyReport,
  DependencyHealth
} from './dependency-manager';

describe('Dependency Manager', () => {
  const mockDependencies = [
    { name: 'react', currentVersion: '17.0.0', latestVersion: '18.2.0', vulnerabilities: [] },
    { name: 'lodash', currentVersion: '4.17.20', latestVersion: '4.17.21', vulnerabilities: [] },
    { name: 'axios', currentVersion: '0.21.0', latestVersion: '1.0.0', vulnerabilities: [
      { id: 'CVE-2021-1234', severity: 'high', title: 'Server-side forgery', vulnerableVersions: '<1.0.0', fixedIn: '1.0.0' }
    ]},
    { name: 'deprecated-pkg', currentVersion: '1.0.0', latestVersion: '1.0.0', deprecated: true, deprecatedMessage: 'Use new-pkg instead' }
  ];

  describe('analyzeDependencyHealth', () => {
    it('should identify outdated dependencies', () => {
      const health = analyzeDependencyHealth(mockDependencies);
      expect(health.outdated.length).toBe(3);
      expect(health.outdated.find(u => u.name === 'react')).toBeDefined();
    });

    it('should categorize updates by type', () => {
      const health = analyzeDependencyHealth(mockDependencies);
      const react = health.outdated.find(u => u.name === 'react');
      expect(react?.type).toBe('major');
      
      const lodash = health.outdated.find(u => u.name === 'lodash');
      expect(lodash?.type).toBe('patch');
    });

    it('should detect vulnerabilities', () => {
      const health = analyzeDependencyHealth(mockDependencies);
      expect(health.vulnerable.length).toBe(1);
      expect(health.vulnerable[0].package).toBe('axios');
    });

    it('should identify deprecated packages', () => {
      const health = analyzeDependencyHealth(mockDependencies);
      expect(health.deprecated.length).toBe(1);
      expect(health.deprecated[0].name).toBe('deprecated-pkg');
    });
  });

  describe('prioritizeDependencyUpdates', () => {
    it('should prioritize security updates first', () => {
      const health = analyzeDependencyHealth(mockDependencies);
      const prioritized = prioritizeDependencyUpdates(health, { requireSecurityUpdates: true });
      
      const axios = prioritized.find(u => u.name === 'axios');
      expect(axios).toBeDefined();
      expect(prioritized[0].name).toBe('axios');
    });

    it('should exclude specified packages', () => {
      const health = analyzeDependencyHealth(mockDependencies);
      const prioritized = prioritizeDependencyUpdates(health, { excludePackages: ['react'] });
      
      expect(prioritized.find(u => u.name === 'react')).toBeUndefined();
    });
  });

  describe('createDependencyUpdatePR', () => {
    it('should generate PR for dependency update', () => {
      const health = analyzeDependencyHealth(mockDependencies);
      const update = health.outdated[0];
      const pr = createDependencyUpdatePR(update, 'Bug fixes', []);
      
      expect(pr.title).toContain(update.name);
      expect(pr.labels).toContain('dependencies');
    });

    it('should mark breaking changes', () => {
      const health = analyzeDependencyHealth(mockDependencies);
      const update = health.outdated.find(u => u.name === 'react')!;
      const pr = createDependencyUpdatePR(update, 'New features', ['useEffect cleanup']);
      
      expect(pr.labels).toContain('breaking-change');
    });
  });

  describe('calculateUpdateRisk', () => {
    it('should calculate high risk for major updates', () => {
      const health: DependencyHealth = { outdated: [], vulnerable: [], deprecated: [], unused: [], missing: [] };
      const update = { name: 'react', currentVersion: '17.0.0', latestVersion: '18.0.0', type: 'major', urgency: 'high', breaking: true };
      const { risk } = calculateUpdateRisk(update, health);
      expect(risk).toBe('high');
    });

    it('should calculate low risk for patch updates', () => {
      const health: DependencyHealth = { outdated: [], vulnerable: [], deprecated: [], unused: [], missing: [] };
      const update = { name: 'lodash', currentVersion: '4.17.20', latestVersion: '4.17.21', type: 'patch', urgency: 'low', breaking: false };
      const { risk } = calculateUpdateRisk(update, health);
      expect(risk).toBe('low');
    });
  });

  describe('generateDependencyReport', () => {
    it('should generate markdown report', () => {
      const health = analyzeDependencyHealth(mockDependencies);
      const report = generateDependencyReport(health, {});
      
      expect(report).toContain('# Dependency Health Report');
      expect(report).toContain('Vulnerable');
      expect(report).toContain('Deprecated');
    });
  });
});
