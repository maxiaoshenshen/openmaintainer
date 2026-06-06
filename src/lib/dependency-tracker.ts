/**
 * Dependency Tracker
 * Track and manage project dependencies with update recommendations
 */

export interface Dependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  type: 'production' | 'development';
  updateAvailable: boolean;
  breaking: boolean;
  releaseDate: Date;
  changelog?: string;
}

export interface DependencyUpdate {
  dependency: string;
  from: string;
  to: string;
  severity: 'major' | 'minor' | 'patch';
  breaking: boolean;
  releaseNotes?: string;
}

export interface AuditResult {
  total: number;
  upToDate: number;
  outdated: number;
  vulnerable: number;
  recommendations: DependencyUpdate[];
}

/**
 * Parse package.json and extract dependencies
 */
export function parseDependencies(packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }): Omit<Dependency, 'latestVersion' | 'updateAvailable' | 'breaking' | 'releaseDate' | 'changelog'>[] {
  const deps: Omit<Dependency, 'latestVersion' | 'updateAvailable' | 'breaking' | 'releaseDate' | 'changelog'>[] = [];
  
  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      deps.push({ name, currentVersion: version, type: 'production' });
    }
  }
  
  if (packageJson.devDependencies) {
    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      deps.push({ name, currentVersion: version, type: 'development' });
    }
  }
  
  return deps;
}

/**
 * Check if update is breaking
 */
export function isBreakingUpdate(current: string, latest: string): boolean {
  const currentMajor = parseInt(current.replace(/[^0-9].*/, '')) || 0;
  const latestMajor = parseInt(latest.replace(/[^0-9].*/, '')) || 0;
  return latestMajor > currentMajor;
}

/**
 * Get update severity
 */
export function getUpdateSeverity(current: string, latest: string): 'major' | 'minor' | 'patch' {
  const parseVersion = (v: string) => {
    const parts = v.replace(/^[^0-9]*/, '').split('.');
    return parts.map(p => parseInt(p) || 0);
  };
  
  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);
  
  if (latestParts[0] > (currentParts[0] || 0)) return 'major';
  if (latestParts[1] > (currentParts[1] || 0)) return 'minor';
  return 'patch';
}

/**
 * Generate audit report
 */
export function auditDependencies(dependencies: Dependency[]): AuditResult {
  const outdated = dependencies.filter(d => d.updateAvailable);
  const vulnerable = 0; // Would integrate with security scanner
  
  const recommendations: DependencyUpdate[] = outdated.map(d => ({
    dependency: d.name,
    from: d.currentVersion,
    to: d.latestVersion,
    severity: getUpdateSeverity(d.currentVersion, d.latestVersion),
    breaking: d.breaking,
  })).sort((a, b) => {
    const order = { major: 0, minor: 1, patch: 2 };
    return order[a.severity] - order[b.severity];
  });
  
  return {
    total: dependencies.length,
    upToDate: dependencies.length - outdated.length,
    outdated: outdated.length,
    vulnerable,
    recommendations,
  };
}

/**
 * Group dependencies by update priority
 */
export function groupByUpdatePriority(deps: Dependency[]): { critical: Dependency[]; major: Dependency[]; minor: Dependency[]; patch: Dependency[] } {
  return {
    critical: deps.filter(d => d.breaking || d.type === 'production'),
    major: deps.filter(d => getUpdateSeverity(d.currentVersion, d.latestVersion) === 'major' && !d.breaking),
    minor: deps.filter(d => getUpdateSeverity(d.currentVersion, d.latestVersion) === 'minor'),
    patch: deps.filter(d => getUpdateSeverity(d.currentVersion, d.latestVersion) === 'patch'),
  };
}
