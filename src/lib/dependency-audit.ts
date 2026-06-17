/**
 * Dependency Audit - Security and health audit for dependencies
 */

export interface DependencyVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;
  vulnerableVersions: string;
  patchedVersions?: string;
  title: string;
  url?: string;
}

export interface DependencyHealth {
  name: string;
  version: string;
  isOutdated: boolean;
  latestVersion?: string;
  hasVulnerabilities: boolean;
  vulnerabilities: DependencyVulnerability[];
  maintenanceScore: number;
  downloads: number;
  deprecated: boolean;
}

export interface AuditReport {
  total: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  outdated: number;
  deprecated: number;
  recommendations: string[];
}

/**
 * Check if version is vulnerable
 */
export function isVulnerable(
  version: string,
  vulnerableRanges: string
): boolean {
  if (vulnerableRanges === '*') return true;
  
  const ranges = vulnerableRanges.split(',').map(r => r.trim());
  return ranges.every(range => {
    if (range.startsWith('<=')) {
      const v = range.slice(2);
      return compareVersions(version, v) <= 0;
    }
    if (range.startsWith('<')) {
      const v = range.slice(1);
      return compareVersions(version, v) < 0;
    }
    if (range.startsWith('>=')) {
      const v = range.slice(2);
      return compareVersions(version, v) >= 0;
    }
    if (range.startsWith('>')) {
      const v = range.slice(1);
      return compareVersions(version, v) > 0;
    }
    if (range.startsWith('=')) {
      return version === range.slice(1);
    }
    if (range.includes('-')) {
      const [start, end] = range.split('-');
      return compareVersions(version, start) >= 0 && compareVersions(version, end) <= 0;
    }
    return false;
  });
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^[\^~]/, '').split('.').map(Number);
  const parts2 = v2.replace(/^[\^~]/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Calculate maintenance score
 */
export function calculateMaintenanceScore(dep: {
  downloads?: number;
  hasVulnerabilities?: boolean;
  deprecated?: boolean;
  updatedRecently?: boolean;
}): number {
  let score = 100;

  if (dep.deprecated) score -= 40;
  if (dep.hasVulnerabilities) score -= 30;
  if (!dep.updatedRecently) score -= 20;
  if (dep.downloads && dep.downloads < 1000) score -= 10;

  return Math.max(0, score);
}

/**
 * Check dependency health
 */
export function checkDependencyHealth(
  name: string,
  version: string,
  data?: {
    latestVersion?: string;
    vulnerabilities?: DependencyVulnerability[];
    downloads?: number;
    deprecated?: boolean;
  }
): DependencyHealth {
  const vulnerabilities = data?.vulnerabilities || [];
  const latestVersion = data?.latestVersion;
  
  let isOutdated = false;
  if (latestVersion && compareVersions(version, latestVersion) < 0) {
    isOutdated = true;
  }

  const hasVulnerabilities = vulnerabilities.length > 0;

  return {
    name,
    version,
    isOutdated,
    latestVersion,
    hasVulnerabilities,
    vulnerabilities,
    maintenanceScore: calculateMaintenanceScore({
      downloads: data?.downloads,
      hasVulnerabilities,
      deprecated: data?.deprecated
    }),
    downloads: data?.downloads || 0,
    deprecated: data?.deprecated || false
  };
}

/**
 * Generate audit report
 */
export function generateAuditReport(
  dependencies: DependencyHealth[]
): AuditReport {
  const vulnerabilities = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  dependencies.forEach(dep => {
    dep.vulnerabilities.forEach(v => {
      vulnerabilities[v.severity]++;
    });
  });

  const outdated = dependencies.filter(d => d.isOutdated).length;
  const deprecated = dependencies.filter(d => d.deprecated).length;
  const recommendations: string[] = [];

  if (vulnerabilities.critical > 0) {
    recommendations.push(`URGENT: Fix ${vulnerabilities.critical} critical vulnerabilities immediately`);
  }
  if (outdated > dependencies.length * 0.5) {
    recommendations.push(`${outdated} dependencies are outdated - consider updating`);
  }
  if (deprecated > 0) {
    recommendations.push(`${deprecated} dependencies are deprecated - find alternatives`);
  }

  return {
    total: dependencies.length,
    vulnerabilities,
    outdated,
    deprecated,
    recommendations
  };
}

/**
 * Prioritize updates
 */
export function prioritizeUpdates(
  dependencies: DependencyHealth[]
): DependencyHealth[] {
  return dependencies
    .filter(d => d.isOutdated || d.hasVulnerabilities)
    .sort((a, b) => {
      if (a.hasVulnerabilities && !b.hasVulnerabilities) return -1;
      if (!a.hasVulnerabilities && b.hasVulnerabilities) return 1;
      
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aMax = Math.min(...a.vulnerabilities.map(v => severityOrder[v.severity]));
      const bMax = Math.min(...b.vulnerabilities.map(v => severityOrder[v.severity]));
      return aMax - bMax;
    });
}
