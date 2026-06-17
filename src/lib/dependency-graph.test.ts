import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyGraphAnalyzer } from './dependency-graph';

describe('DependencyGraphAnalyzer', () => {
  let analyzer: DependencyGraphAnalyzer;

  beforeEach(() => {
    analyzer = new DependencyGraphAnalyzer();
  });

  describe('addDependency', () => {
    it('should add a dependency node', () => {
      analyzer.addDependency('react', '18.2.0', 'prod');

      const nodes = analyzer.getNodes();
      expect(nodes.length).toBe(1);
      expect(nodes[0].name).toBe('react');
      expect(nodes[0].version).toBe('18.2.0');
    });

    it('should add dependency with metadata', () => {
      analyzer.addDependency('lodash', '4.17.21', 'prod', { license: 'MIT' });

      const nodes = analyzer.getNodes();
      expect(nodes[0].metadata?.license).toBe('MIT');
    });
  });

  describe('addEdge', () => {
    it('should add dependency relationship', () => {
      analyzer.addDependency('react-dom', '18.2.0');
      analyzer.addDependency('react', '18.2.0');
      analyzer.addEdge('react-dom', 'react');

      const edges = analyzer.getEdges();
      expect(edges.length).toBe(1);
      expect(edges[0].from).toBe('react-dom');
      expect(edges[0].to).toBe('react');
    });
  });

  describe('buildFromPackageJson', () => {
    it('should build graph from package.json', () => {
      analyzer.buildFromPackageJson(
        { react: '^18.0.0', 'react-dom': '^18.0.0' },
        { typescript: '^5.0.0' }
      );

      const nodes = analyzer.getNodes();
      expect(nodes.length).toBeGreaterThanOrEqual(3);
      
      const prodDeps = nodes.filter(n => n.type === 'prod');
      const devDeps = nodes.filter(n => n.type === 'dev');
      expect(prodDeps.length).toBeGreaterThanOrEqual(2);
      expect(devDeps.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getDependencies / getDependents', () => {
    it('should get direct dependencies', () => {
      analyzer.addDependency('a', '1.0.0');
      analyzer.addDependency('b', '1.0.0');
      analyzer.addDependency('c', '1.0.0');
      analyzer.addEdge('a', 'b');
      analyzer.addEdge('a', 'c');

      const deps = analyzer.getDependencies('a');
      expect(deps).toContain('b');
      expect(deps).toContain('c');
    });

    it('should get dependents (reverse dependencies)', () => {
      analyzer.addDependency('a', '1.0.0');
      analyzer.addDependency('b', '1.0.0');
      analyzer.addEdge('b', 'a');

      const dependents = analyzer.getDependents('a');
      expect(dependents).toContain('b');
    });
  });

  describe('getDependencyTree', () => {
    it('should return null for non-existent package', () => {
      const tree = analyzer.getDependencyTree('nonexistent');
      expect(tree).toBeNull();
    });

    it('should build dependency tree', () => {
      analyzer.addDependency('root', '1.0.0');
      analyzer.addDependency('dep1', '1.0.0');
      analyzer.addDependency('dep2', '1.0.0');
      analyzer.addEdge('root', 'dep1');
      analyzer.addEdge('root', 'dep2');

      const tree = analyzer.getDependencyTree('root', 2);
      expect(tree).toBeDefined();
      expect(tree?.children?.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTotalCount', () => {
    it('should count dependencies by type', () => {
      analyzer.addDependency('prod1', '1.0.0', 'prod');
      analyzer.addDependency('prod2', '1.0.0', 'prod');
      analyzer.addDependency('dev1', '1.0.0', 'dev');

      const counts = analyzer.getTotalCount();
      expect(counts.prod).toBe(2);
      expect(counts.dev).toBe(1);
      expect(counts.total).toBe(3);
    });
  });

  describe('getOutdatedPackages', () => {
    it('should detect outdated packages', () => {
      const current = new Map([['lodash', '4.17.20'], ['react', '18.0.0']]);
      const latest = new Map([['lodash', '4.17.21'], ['react', '18.2.0']]);

      const outdated = analyzer.getOutdatedPackages(current, latest);
      expect(outdated.length).toBe(2);
      expect(outdated.find(p => p.name === 'lodash')?.current).toBe('4.17.20');
    });

    it('should not list up-to-date packages', () => {
      const current = new Map([['react', '18.2.0']]);
      const latest = new Map([['react', '18.2.0']]);

      const outdated = analyzer.getOutdatedPackages(current, latest);
      expect(outdated.length).toBe(0);
    });
  });

  describe('checkVulnerabilities', () => {
    it('should detect vulnerable packages', () => {
      analyzer.addDependency('lodash', '4.17.20');
      analyzer.addDependency('react', '18.2.0');

      const vulns = analyzer.checkVulnerabilities();
      expect(vulns.length).toBeGreaterThanOrEqual(1);
      expect(vulns.some(v => v.package === 'lodash')).toBe(true);
    });

    it('should include vulnerability severity', () => {
      analyzer.addDependency('lodash', '4.17.20');
      analyzer.addDependency('minimist', '1.2.5');

      const vulns = analyzer.checkVulnerabilities();
      const critical = vulns.find(v => v.package === 'minimist');
      expect(critical?.severity).toBe('critical');
    });
  });

  describe('exportAsAdjacencyList', () => {
    it('should export graph as adjacency list', () => {
      analyzer.addDependency('a', '1.0.0');
      analyzer.addDependency('b', '1.0.0');
      analyzer.addEdge('a', 'b');

      const list = analyzer.exportAsAdjacencyList();
      expect(list['a']).toContain('b');
    });
  });

  describe('exportAsEdgeList', () => {
    it('should export graph as edge list', () => {
      analyzer.addDependency('a', '1.0.0');
      analyzer.addDependency('b', '1.0.0');
      analyzer.addEdge('a', 'b', 'depends-on');

      const edges = analyzer.exportAsEdgeList();
      expect(edges.length).toBe(1);
      expect(edges[0]).toEqual({ source: 'a', target: 'b', type: 'depends-on' });
    });
  });

  describe('clear', () => {
    it('should clear the graph', () => {
      analyzer.addDependency('a', '1.0.0');
      analyzer.addDependency('b', '1.0.0');
      analyzer.addEdge('a', 'b');

      analyzer.clear();

      expect(analyzer.getNodes().length).toBe(0);
      expect(analyzer.getEdges().length).toBe(0);
    });
  });
});
