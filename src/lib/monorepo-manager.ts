/**
 * Monorepo Manager - Tools for managing monorepo workspaces
 */

export interface Workspace {
  name: string;
  path: string;
  version: string;
  dependencies: string[];
  devDependencies: string[];
}

export interface PackageGraph {
  workspace: Workspace;
  dependents: string[];
  dependencies: string[];
  depth: number;
}

export interface BuildOrder {
  order: string[];
  canBuildParallel: string[][];
  totalPhases: number;
}

/**
 * Parse workspace from package.json
 */
export function parseWorkspace(pkg: { name?: string; version?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }, path: string): Workspace {
  return {
    name: pkg.name || 'unnamed',
    path,
    version: pkg.version || '0.0.0',
    dependencies: Object.keys(pkg.dependencies || {}),
    devDependencies: Object.keys(pkg.devDependencies || {})
  };
}

/**
 * Build dependency graph
 */
export function buildPackageGraph(workspaces: Workspace[]): Map<string, PackageGraph> {
  const graph = new Map<string, PackageGraph>();
  
  workspaces.forEach(ws => {
    graph.set(ws.name, {
      workspace: ws,
      dependents: [],
      dependencies: ws.dependencies.filter(dep => workspaces.some(w => w.name === dep)),
      depth: 0
    });
  });

  graph.forEach((node, name) => {
    node.dependencies.forEach(dep => {
      const depNode = graph.get(dep);
      if (depNode) {
        depNode.dependents.push(name);
      }
    });
  });

  const visited = new Set<string>();
  const calculateDepth = (name: string, depth: number): number => {
    if (visited.has(name)) return depth;
    visited.add(name);
    const node = graph.get(name);
    if (!node || node.dependencies.length === 0) return depth;
    return Math.max(...node.dependencies.map(d => calculateDepth(d, depth + 1)));
  };

  graph.forEach((_, name) => {
    const node = graph.get(name)!;
    node.depth = calculateDepth(name, 0);
  });

  return graph;
}

/**
 * Calculate topological build order
 */
export function calculateBuildOrder(graph: Map<string, PackageGraph>): BuildOrder {
  const order: string[] = [];
  const phases: string[][] = [];
  const remaining = new Set(graph.keys());

  while (remaining.size > 0) {
    const ready: string[] = [];
    remaining.forEach(name => {
      const node = graph.get(name)!;
      if (node.dependencies.every(dep => !remaining.has(dep))) {
        ready.push(name);
      }
    });

    if (ready.length === 0 && remaining.size > 0) {
      throw new Error('Circular dependency detected');
    }

    phases.push(ready);
    order.push(...ready);
    ready.forEach(name => remaining.delete(name));
  }

  return { order, canBuildParallel: phases, totalPhases: phases.length };
}

/**
 * Find affected packages
 */
export function findAffectedPackages(
  changedFiles: string[],
  workspaces: Workspace[],
  mapping: (file: string) => string
): Workspace[] {
  const affected = new Set<string>();
  
  changedFiles.forEach(file => {
    const pkg = mapping(file);
    affected.add(pkg);
    
    const graph = buildPackageGraph(workspaces);
    const pkgGraph = graph.get(pkg);
    if (pkgGraph) {
      const findDependents = (name: string): void => {
        const node = graph.get(name);
        if (node) {
          node.dependents.forEach(dep => {
            affected.add(dep);
            findDependents(dep);
          });
        }
      };
      findDependents(pkg);
    }
  });

  return workspaces.filter(ws => affected.has(ws.name));
}

/**
 * Get workspace summary
 */
export function getWorkspaceSummary(workspaces: Workspace[]): {
  total: number;
  totalDependencies: number;
  mostDependent: Workspace | null;
  leafPackages: Workspace[];
} {
  const graph = buildPackageGraph(workspaces);
  let mostDependent: Workspace | null = null;
  let maxDeps = 0;

  workspaces.forEach(ws => {
    const node = graph.get(ws.name);
    if (node && node.dependents.length > maxDeps) {
      maxDeps = node.dependents.length;
      mostDependent = ws;
    }
  });

  const leafPackages = workspaces.filter(ws => {
    const node = graph.get(ws.name);
    return node && node.dependents.length === 0;
  });

  return {
    total: workspaces.length,
    totalDependencies: workspaces.reduce((sum, ws) => sum + ws.dependencies.length, 0),
    mostDependent,
    leafPackages
  };
}
