/**
 * Dependency Graph Module
 * Visualize and analyze project dependencies
 */

export interface DependencyNode {
  name: string;
  version: string;
  type: 'prod' | 'dev' | 'peer' | 'optional';
  children?: DependencyNode[];
  metadata?: Record<string, string>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'depends-on' | 'peer' | 'optional';
  version?: string;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
}

export interface Vulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  package: string;
  vulnerableVersions: string;
  recommendation?: string;
}

export interface CircularDependency {
  path: string[];
  nodes: string[];
}

export class DependencyGraphAnalyzer {
  private graph: DependencyGraph = {
    nodes: new Map(),
    edges: [],
  };

  /**
   * Add a dependency to the graph
   */
  addDependency(
    name: string,
    version: string,
    type: 'prod' | 'dev' | 'peer' | 'optional' = 'prod',
    metadata?: Record<string, string>
  ): void {
    const node: DependencyNode = {
      name,
      version,
      type,
      metadata,
    };
    this.graph.nodes.set(name, node);
  }

  /**
   * Add dependency relationship
   */
  addEdge(from: string, to: string, type: 'depends-on' | 'peer' | 'optional' = 'depends-on'): void {
    const edge: DependencyEdge = { from, to, type };
    this.graph.edges.push(edge);
  }

  /**
   * Build graph from package.json dependencies
   */
  buildFromPackageJson(deps: Record<string, string>, devDeps: Record<string, string> = {}): void {
    // Add production dependencies
    for (const [name, version] of Object.entries(deps)) {
      this.addDependency(name, version, 'prod');
    }

    // Add dev dependencies
    for (const [name, version] of Object.entries(devDeps)) {
      this.addDependency(name, version, 'dev');
    }

    // Build edges (simplified - assumes direct dependencies on main packages)
    for (const name of Object.keys(deps)) {
      if (name.startsWith('@')) continue;
      // Add edges for known transitive dependencies
      this.addTransitiveEdges(name);
    }
  }

  /**
   * Add transitive dependency edges
   */
  private addTransitiveEdges(packageName: string): void {
    // Simulated transitive dependencies
    const commonDeps: Record<string, string[]> = {
      react: ['loose-envify', 'js-tokens', 'object-assign'],
      'react-dom': ['react', 'fbjs', 'loose-envify'],
      typescript: ['@types/node'],
      jest: ['@types/jest', '@types/node', 'js-timers'],
      eslint: ['@eslint/plugin-unicorn'],
    };

    const deps = commonDeps[packageName] || [];
    for (const dep of deps) {
      this.addEdge(packageName, dep);
    }
  }

  /**
   * Find circular dependencies
   */
  findCircularDependencies(): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const edges = this.graph.edges.filter(e => e.from === node);
      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          dfs(edge.to);
        } else if (recursionStack.has(edge.to)) {
          // Found cycle
          const cycleStart = path.indexOf(edge.to);
          const cyclePath = path.slice(cycleStart);
          cycles.push({
            path: [...cyclePath, edge.to],
            nodes: cyclePath,
          });
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const node of this.graph.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  /**
   * Get all dependencies of a package
   */
  getDependents(packageName: string): string[] {
    return this.graph.edges
      .filter(e => e.to === packageName)
      .map(e => e.from);
  }

  /**
   * Get all dependencies for a package
   */
  getDependencies(packageName: string): string[] {
    return this.graph.edges
      .filter(e => e.from === packageName)
      .map(e => e.to);
  }

  /**
   * Get dependency tree as nested structure
   */
  getDependencyTree(rootPackage: string, depth: number = 3): DependencyNode | null {
    const node = this.graph.nodes.get(rootPackage);
    if (!node) return null;

    const buildTree = (name: string, currentDepth: number): DependencyNode | null => {
      if (currentDepth <= 0) return null;

      const deps = this.getDependencies(name);
      const children = deps
        .slice(0, 5) // Limit children
        .map(dep => buildTree(dep, currentDepth - 1))
        .filter((n): n is DependencyNode => n !== null);

      const depNode = this.graph.nodes.get(name);
      return {
        ...depNode!,
        children: children.length > 0 ? children : undefined,
      };
    };

    return buildTree(rootPackage, depth);
  }

  /**
   * Calculate total dependency count
   */
  getTotalCount(): { prod: number; dev: number; total: number } {
    let prod = 0;
    let dev = 0;

    for (const node of this.graph.nodes.values()) {
      if (node.type === 'prod') prod++;
      else if (node.type === 'dev') dev++;
    }

    return { prod, dev, total: prod + dev };
  }

  /**
   * Get outdated packages
   */
  getOutdatedPackages(
    currentVersions: Map<string, string>,
    latestVersions: Map<string, string>
  ): { name: string; current: string; latest: string }[] {
    const outdated: { name: string; current: string; latest: string }[] = [];

    for (const [name, current] of currentVersions) {
      const latest = latestVersions.get(name);
      if (latest && latest !== current) {
        outdated.push({ name, current, latest });
      }
    }

    return outdated.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Simulate vulnerability check
   */
  checkVulnerabilities(): Vulnerability[] {
    const knownVulnerable: Record<string, { severity: Vulnerability['severity']; title: string }> = {
      'lodash': { severity: 'high', title: 'Prototype Pollution' },
      'moment': { severity: 'medium', title: 'Path Traversal' },
      'axios': { severity: 'low', title: 'SSRF Vulnerability' },
      'minimist': { severity: 'critical', title: 'Prototype Pollution' },
      'handlebars': { severity: 'high', title: 'Remote Code Execution' },
    };

    const vulnerabilities: Vulnerability[] = [];

    for (const [name, info] of Object.entries(knownVulnerable)) {
      if (this.graph.nodes.has(name)) {
        vulnerabilities.push({
          id: `CVE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          severity: info.severity,
          title: info.title,
          package: name,
          vulnerableVersions: '*',
          recommendation: `Update ${name} to the latest version`,
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Export graph as adjacency list
   */
  exportAsAdjacencyList(): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const node of this.graph.nodes.keys()) {
      result[node] = this.getDependencies(node);
    }

    return result;
  }

  /**
   * Export graph as edge list
   */
  exportAsEdgeList(): { source: string; target: string; type: string }[] {
    return this.graph.edges.map(e => ({
      source: e.from,
      target: e.to,
      type: e.type,
    }));
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.graph = { nodes: new Map(), edges: [] };
  }

  /**
   * Get all nodes
   */
  getNodes(): DependencyNode[] {
    return Array.from(this.graph.nodes.values());
  }

  /**
   * Get all edges
   */
  getEdges(): DependencyEdge[] {
    return [...this.graph.edges];
  }
}

export const dependencyGraphAnalyzer = new DependencyGraphAnalyzer();
