import { describe, it, expect } from 'vitest';
import {
  parseWorkspace,
  buildPackageGraph,
  calculateBuildOrder,
  findAffectedPackages,
  getWorkspaceSummary
} from './monorepo-manager';

describe('monorepo-manager', () => {
  describe('parseWorkspace', () => {
    it('should parse package.json', () => {
      const pkg = {
        name: 'my-package',
        version: '1.0.0',
        dependencies: { lodash: '^4.0.0' },
        devDependencies: { jest: '^29.0.0' }
      };
      const ws = parseWorkspace(pkg, 'packages/my-package');
      expect(ws.name).toBe('my-package');
      expect(ws.version).toBe('1.0.0');
      expect(ws.dependencies).toContain('lodash');
    });
  });

  describe('buildPackageGraph', () => {
    it('should build dependency graph', () => {
      const workspaces = [
        parseWorkspace({ name: 'core', dependencies: {} }, 'core'),
        parseWorkspace({ name: 'app', dependencies: { core: '1.0.0' } }, 'app')
      ];
      const graph = buildPackageGraph(workspaces);
      expect(graph.get('app')?.dependencies).toContain('core');
      expect(graph.get('core')?.dependents).toContain('app');
    });
  });

  describe('calculateBuildOrder', () => {
    it('should calculate build phases', () => {
      const workspaces = [
        parseWorkspace({ name: 'lib-a', dependencies: {} }, 'a'),
        parseWorkspace({ name: 'lib-b', dependencies: { 'lib-a': '1.0.0' } }, 'b'),
        parseWorkspace({ name: 'app', dependencies: { 'lib-b': '1.0.0' } }, 'app')
      ];
      const graph = buildPackageGraph(workspaces);
      const order = calculateBuildOrder(graph);
      expect(order.totalPhases).toBe(3);
      expect(order.order[0]).toBe('lib-a');
    });

    it('should detect circular dependencies', () => {
      const workspaces = [
        parseWorkspace({ name: 'a', dependencies: { b: '1.0.0' } }, 'a'),
        parseWorkspace({ name: 'b', dependencies: { a: '1.0.0' } }, 'b')
      ];
      const graph = buildPackageGraph(workspaces);
      expect(() => calculateBuildOrder(graph)).toThrow('Circular dependency');
    });
  });

  describe('findAffectedPackages', () => {
    it('should find affected packages', () => {
      const workspaces = [
        parseWorkspace({ name: 'core', dependencies: {} }, 'core'),
        parseWorkspace({ name: 'app', dependencies: { core: '1.0.0' } }, 'app')
      ];
      const affected = findAffectedPackages(['core/index.ts'], workspaces, f => f.includes('core') ? 'core' : 'app');
      expect(affected.map(w => w.name)).toContain('core');
      expect(affected.map(w => w.name)).toContain('app');
    });
  });

  describe('getWorkspaceSummary', () => {
    it('should return summary', () => {
      const workspaces = [
        parseWorkspace({ name: 'lib', dependencies: {} }, 'lib'),
        parseWorkspace({ name: 'app', dependencies: { lib: '1.0.0' } }, 'app')
      ];
      const summary = getWorkspaceSummary(workspaces);
      expect(summary.total).toBe(2);
      expect(summary.mostDependent?.name).toBe('lib');
      expect(summary.leafPackages.map(w => w.name)).toContain('app');
    });
  });
});
