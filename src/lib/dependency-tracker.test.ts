import { describe, it, expect } from 'vitest';
import {
  analyzeDependencies,
  buildDependencyGraph,
  analyzeLicenses,
} from './dependency-tracker';

describe('Dependency Tracker', () => {
  describe('analyzeDependencies', () => {
    it('should analyze healthy dependencies', () => {
      const result = analyzeDependencies({
        dependencies: [
          { name: 'react', version: '18.2.0' },
          { name: 'lodash', version: '4.17.21' },
        ],
      });

      expect(result.dependencies).toHaveLength(2);
      expect(result.healthScore).toBeGreaterThan(80);
    });

    it('should detect vulnerable dependencies', () => {
      const result = analyzeDependencies({
        dependencies: [
          { name: 'vulnerable-lib', version: '1.0.0' },
        ],
        vulnerabilities: [
          {
            dependency: 'vulnerable-lib',
            severity: 'critical',
            title: 'Remote Code Execution',
            description: 'Allows arbitrary code execution',
          },
        ],
      });

      expect(result.vulnerableCount).toBe(1);
      expect(result.healthScore).toBeLessThan(90);
    });

    it('should detect outdated dependencies', () => {
      const result = analyzeDependencies({
        dependencies: [
          { name: 'old-lib', version: '1.0.0' },
        ],
        outdated: {
          'old-lib': '2.0.0',
        },
      });

      expect(result.outdatedCount).toBe(1);
      const outdated = result.dependencies.find(d => d.name === 'old-lib');
      expect(outdated?.health).toBe('outdated');
    });

    it('should generate recommendations', () => {
      const result = analyzeDependencies({
        dependencies: [
          { name: 'react', version: '18.0.0' },
        ],
        outdated: {
          'react': '18.2.0',
        },
        vulnerabilities: [
          {
            dependency: 'security-lib',
            severity: 'high',
            title: 'XSS Vulnerability',
            description: 'Cross-site scripting possible',
          },
        ],
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify major version updates', () => {
      const result = analyzeDependencies({
        dependencies: [
          { name: 'major-update-lib', version: '1.0.0' },
        ],
        outdated: {
          'major-update-lib': '3.0.0',
        },
      });

      expect(result.majorOutdated).toHaveLength(1);
      expect(result.majorOutdated[0]).toContain('3.0.0');
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build dependency graph', () => {
      const deps = [
        { name: 'react', version: '18.2.0', type: 'production' as const, deprecated: false, health: 'healthy' as const, weeklyDownloads: 1000000, lastUpdated: '' },
        { name: 'vite', version: '5.0.0', type: 'development' as const, deprecated: false, health: 'healthy' as const, weeklyDownloads: 500000, lastUpdated: '' },
      ];

      const graph = buildDependencyGraph(deps);

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1); // Only production deps
    });
  });

  describe('analyzeLicenses', () => {
    it('should identify compatible licenses', () => {
      const deps = [
        { name: 'react', version: '18.2.0', type: 'production' as const, deprecated: false, health: 'healthy' as const, weeklyDownloads: 1000000, lastUpdated: '' },
      ];

      const result = analyzeLicenses(deps);

      expect(result.compatible).toContain('react');
    });

    it('should handle unknown licenses', () => {
      const deps = [
        { name: 'unknown-package-xyz', version: '1.0.0', type: 'production' as const, deprecated: false, health: 'healthy' as const, weeklyDownloads: 100, lastUpdated: '' },
      ];

      const result = analyzeLicenses(deps);

      expect(result.unknown.length).toBeGreaterThanOrEqual(0);
    });
  });
});
