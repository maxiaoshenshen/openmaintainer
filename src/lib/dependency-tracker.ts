/**
 * Dependency Tracker
 * Tracks and manages project dependencies
 */

export type DependencyType = 'production' | 'development' | 'peer' | 'optional';
export type UpdateFrequency = 'daily' | 'weekly' | 'monthly' | 'rarely';
export type HealthStatus = 'healthy' | 'outdated' | 'vulnerable' | 'deprecated';

export interface Dependency {
  name: string;
  version: string;
  latestVersion?: string;
  type: DependencyType;
  deprecated: boolean;
  health: HealthStatus;
  vulnerabilities?: Vulnerability[];
  weeklyDownloads: number;
  lastUpdated: string;
  repository?: string;
  description?: string;
}

export interface Vulnerability {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  patchedIn?: string;
  vulnerableVersions?: string;
}

export interface DependencyReport {
  dependencies: Dependency[];
  outdatedCount: number;
  vulnerableCount: number;
  deprecatedCount: number;
  healthScore: number; // 0-100
  majorOutdated: string[];
  recommendations: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  type: DependencyType;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'depends-on';
}

/**
 * Analyze dependencies for a project
 */
export function analyzeDependencies(params: {
  dependencies?: Array<{
    name: string;
    version: string;
    type?: DependencyType;
    dev?: boolean;
    peer?: boolean;
    optional?: boolean;
  }>;
  outdated?: Record<string, string>;
  vulnerabilities?: Array<{
    dependency: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    patchedIn?: string;
  }>;
  deprecatedPackages?: string[];
}): DependencyReport {
  const { dependencies = [], outdated = {}, vulnerabilities = [], deprecatedPackages = [] } = params;

  const analyzed: Dependency[] = dependencies.map(dep => {
    const latestVersion = outdated[dep.name];
    const isOutdated = latestVersion && latestVersion !== dep.version;
    const isDeprecated = deprecatedPackages.includes(dep.name);
    const depVulnerabilities = vulnerabilities
      .filter(v => v.dependency === dep.name)
      .map(v => ({
        severity: v.severity,
        title: v.title,
        description: v.description,
        patchedIn: v.patchedIn,
      }));

    let health: HealthStatus = 'healthy';
    if (isDeprecated) health = 'deprecated';
    else if (depVulnerabilities.length > 0) health = 'vulnerable';
    else if (isOutdated) health = 'outdated';

    return {
      name: dep.name,
      version: dep.version,
      latestVersion: latestVersion || dep.version,
      type: dep.type || (dep.dev ? 'development' : dep.peer ? 'peer' : 'production'),
      deprecated: isDeprecated,
      health,
      vulnerabilities: depVulnerabilities,
      weeklyDownloads: Math.floor(Math.random() * 1000000), // Simulated
      lastUpdated: new Date().toISOString(),
      repository: `https://www.npmjs.com/package/${dep.name}`,
      description: `Package: ${dep.name}`,
    };
  });

  const vulnerableCount = analyzed.filter(d => d.health === 'vulnerable').length;
  const outdatedCount = analyzed.filter(d => d.health === 'outdated').length;
  const deprecatedCount = analyzed.filter(d => d.deprecated).length;

  const healthScore = calculateHealthScore(analyzed, vulnerableCount, outdatedCount, deprecatedCount);
  const majorOutdated = analyzed
    .filter(d => {
      if (!d.latestVersion) return false;
      const current = parseVersion(d.version);
      const latest = parseVersion(d.latestVersion);
      return latest.major > current.major;
    })
    .map(d => `${d.name}: ${d.version} -> ${d.latestVersion}`);

  const recommendations = generateRecommendations(analyzed, vulnerableCount, majorOutdated);

  return {
    dependencies: analyzed,
    outdatedCount,
    vulnerableCount,
    deprecatedCount,
    healthScore,
    majorOutdated,
    recommendations,
  };
}

function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.replace(/^[\^~>=<]/, '').match(/(\d+)\.(\d+)\.(\d+)/);
  if (match) {
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
    };
  }
  return { major: 0, minor: 0, patch: 0 };
}

function calculateHealthScore(
  dependencies: Dependency[],
  vulnerableCount: number,
  outdatedCount: number,
  deprecatedCount: number
): number {
  if (dependencies.length === 0) return 100;

  let score = 100;
  
  // Vulnerabilities are most critical
  score -= vulnerableCount * 15;
  
  // Deprecated packages are concerning
  score -= deprecatedCount * 10;
  
  // Outdated packages matter less if minor
  score -= outdatedCount * 2;

  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(
  dependencies: Dependency[],
  vulnerableCount: number,
  majorOutdated: string[]
): string[] {
  const recommendations: string[] = [];

  // Critical vulnerabilities
  const criticalVulns = dependencies.flatMap(d => 
    d.vulnerabilities?.filter(v => v.severity === 'critical') || []
  );
  
  if (criticalVulns.length > 0) {
    recommendations.push(`🔴 Critical: ${criticalVulns.length} critical vulnerability(ies) found. Update immediately.`);
  }

  // High vulnerabilities
  const highVulns = dependencies.flatMap(d => 
    d.vulnerabilities?.filter(v => v.severity === 'high') || []
  );
  
  if (highVulns.length > 0) {
    recommendations.push(`🟠 High: ${highVulns.length} high severity vulnerability(ies). Plan updates soon.`);
  }

  // Major version updates
  if (majorOutdated.length > 0) {
    recommendations.push(`🟡 Major updates available for: ${majorOutdated.slice(0, 3).join(', ')}${majorOutdated.length > 3 ? '...' : ''}`);
  }

  // Deprecated packages
  const deprecated = dependencies.filter(d => d.deprecated);
  if (deprecated.length > 0) {
    recommendations.push(`⚠️ Deprecated packages: ${deprecated.map(d => d.name).join(', ')}. Find alternatives.`);
  }

  // General advice
  if (vulnerableCount === 0 && deprecated.length === 0 && majorOutdated.length === 0) {
    recommendations.push('✅ All dependencies are healthy. Keep up-to-date with regular updates.');
  }

  return recommendations;
}

/**
 * Build dependency graph
 */
export function buildDependencyGraph(dependencies: Dependency[]): DependencyGraph {
  const nodes: DependencyNode[] = dependencies.map(dep => ({
    id: dep.name,
    name: dep.name,
    version: dep.version,
    type: dep.type,
  }));

  const edges: DependencyEdge[] = dependencies
    .filter(dep => dep.type === 'production')
    .map(dep => ({
      from: 'root',
      to: dep.name,
      type: 'depends-on' as const,
    }));

  return { nodes, edges };
}

/**
 * Analyze license compatibility
 */
export function analyzeLicenses(dependencies: Dependency[]): {
  compatible: string[];
  incompatible: Array<{ package: string; license: string; reason: string }>;
  unknown: string[];
  recommendations: string[];
} {
  const incompatible: Array<{ package: string; license: string; reason: string }> = [];
  const unknown: string[] = [];
  
  // Common incompatible licenses for OSS projects
  const problematicLicenses: Record<string, string> = {
    'GPL-3.0': 'Copyleft - may affect distribution',
    'AGPL-3.0': 'Strong copyleft - may affect SaaS usage',
    'LGPL-2.1': 'Weak copyleft - may require source disclosure',
    'Commercial': 'May require purchase for commercial use',
    'Proprietary': 'No redistribution allowed',
  };

  for (const dep of dependencies) {
    // Simulate license lookup
    const license = getLicenseForPackage(dep.name);
    
    if (!license) {
      unknown.push(dep.name);
    } else if (problematicLicenses[license]) {
      incompatible.push({
        package: dep.name,
        license,
        reason: problematicLicenses[license],
      });
    }
  }

  const recommendations: string[] = [];
  if (incompatible.length > 0) {
    recommendations.push(`Review ${incompatible.length} packages with potentially problematic licenses`);
  }
  if (unknown.length > 0) {
    recommendations.push(`${unknown.length} packages have unknown licenses - verify manually`);
  }

  return {
    compatible: dependencies.map(d => d.name).filter(n => 
      !incompatible.some(i => i.package === n) && !unknown.includes(n)
    ),
    incompatible,
    unknown,
    recommendations,
  };
}

function getLicenseForPackage(name: string): string | undefined {
  // Simulated - in real implementation, would look up from registry
  const knownLicenses: Record<string, string> = {
    'react': 'MIT',
    'lodash': 'MIT',
    'express': 'MIT',
    'vue': 'MIT',
    'next': 'MIT',
    'typescript': 'Apache-2.0',
    'vite': 'MIT',
    'webpack': 'MIT',
  };

  const lowerName = name.toLowerCase();
  for (const [pkg, license] of Object.entries(knownLicenses)) {
    if (lowerName.includes(pkg)) {
      return license;
    }
  }

  return 'MIT'; // Default assumption
}
