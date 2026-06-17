/**
 * Dependency Manager - Track and manage project dependencies
 */

export interface Dependency {
  name: string;
  version: string;
  type: "production" | "development" | "peer" | "optional";
  description?: string;
  repository?: string;
  homepage?: string;
  license?: string;
  lastPublish?: number;
  downloads?: number;
  vulnerabilities?: Vulnerability[];
  outdated?: boolean;
  latestVersion?: string;
}

export interface Vulnerability {
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  affectedVersions: string;
  fixedIn?: string;
  url?: string;
}

export interface UpdateRecommendation {
  dependency: string;
  current: string;
  latest: string;
  type: "major" | "minor" | "patch";
  breaking?: boolean;
  changelog?: string;
}

export interface DependencyAudit {
  total: number;
  production: number;
  development: number;
  outdated: number;
  vulnerable: number;
  license: LicenseIssue[];
  recommendations: UpdateRecommendation[];
}

export interface LicenseIssue {
  dependency: string;
  license: string;
  compatible: boolean;
  spdxId?: string;
}

const ALLOWED_LICENSES = [
  "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC",
  "CC0-1.0", "Unlicense", "0BSD", "Zlib", "Python-2.0"
];

const RESTRICTIVE_LICENSES = [
  "GPL-3.0", "AGPL-3.0", "LGPL-3.0", "MPL-2.0", "EUPL-1.2"
];

/**
 * Parse dependency string into name and version
 */
export function parseDependency(depString: string): { name: string; version: string } {
  const match = depString.match(/^(@?[^@]+)@(.+)$/);
  if (!match) {
    throw new Error(`Invalid dependency format: ${depString}`);
  }
  return { name: match[1], version: match[2] };
}

/**
 * Check if dependency version satisfies constraint
 */
export function satisfiesVersion(version: string, constraint: string): boolean {
  const op = constraint.match(/^([\^~>=<]+)?(.+)$/);
  if (!op) return false;

  const operator = op[1] || "=";
  const target = op[2];
  const [v1, v2, v3] = version.split(/[.-]/).map(Number);
  const [t1, t2, t3] = target.split(/[.-]/).map(Number) || [0, 0, 0];

  switch (operator) {
    case "^":
      return v1 === t1 && (v2 > t2 || (v2 === t2 && v3 >= t3));
    case "~":
      return v1 === t1 && v2 === t2 && v3 >= t3;
    case ">=":
      return compareVersionParts(v1, v2, v3, t1, t2, t3) >= 0;
    case ">":
      return compareVersionParts(v1, v2, v3, t1, t2, t3) > 0;
    case "<=":
      return compareVersionParts(v1, v2, v3, t1, t2, t3) <= 0;
    case "<":
      return compareVersionParts(v1, v2, v3, t1, t2, t3) < 0;
    case "=":
    default:
      return version === target || `${v1}.${v2}.${v3}` === target;
  }
}

function compareVersionParts(v1: number, v2: number, v3: number, t1: number, t2: number, t3: number): number {
  if (v1 !== t1) return v1 - t1;
  if (v2 !== t2) return v2 - t2;
  return v3 - t3;
}

/**
 * Determine update type from version changes
 */
export function determineUpdateType(current: string, latest: string): "major" | "minor" | "patch" {
  const [c1, c2, c3] = current.split(/[.-]/).map(Number);
  const [l1, l2, l3] = latest.split(/[.-]/).map(Number);

  if (l1 > c1) return "major";
  if (l2 > c2) return "minor";
  return "patch";
}

/**
 * Check for breaking changes between versions
 */
export function hasBreakingChanges(current: string, latest: string): boolean {
  const [c1] = current.split(".").map(Number);
  const [l1] = latest.split(".").map(Number);
  return l1 > c1;
}

/**
 * Audit dependencies for issues
 */
export function auditDependencies(dependencies: Dependency[]): DependencyAudit {
  const audit: DependencyAudit = {
    total: dependencies.length,
    production: dependencies.filter(d => d.type === "production").length,
    development: dependencies.filter(d => d.type === "development").length,
    outdated: 0,
    vulnerable: 0,
    license: [],
    recommendations: [],
  };

  for (const dep of dependencies) {
    // Check for outdated
    if (dep.outdated && dep.latestVersion) {
      audit.outdated++;
      audit.recommendations.push({
        dependency: dep.name,
        current: dep.version,
        latest: dep.latestVersion,
        type: determineUpdateType(dep.version, dep.latestVersion),
        breaking: hasBreakingChanges(dep.version, dep.latestVersion),
      });
    }

    // Check for vulnerabilities
    if (dep.vulnerabilities && dep.vulnerabilities.length > 0) {
      audit.vulnerable++;
    }

    // Check license compatibility
    if (dep.license) {
      const isAllowed = ALLOWED_LICENSES.some(l => 
        dep.license!.toLowerCase().includes(l.toLowerCase())
      );
      const isRestrictive = RESTRICTIVE_LICENSES.some(l =>
        dep.license!.toLowerCase().includes(l.toLowerCase())
      );
      
      if (!isAllowed || isRestrictive) {
        audit.license.push({
          dependency: dep.name,
          license: dep.license,
          compatible: isAllowed && !isRestrictive,
        });
      }
    }
  }

  return audit;
}

/**
 * Get security score based on vulnerabilities
 */
export function calculateSecurityScore(audit: DependencyAudit): number {
  let score = 100;
  
  for (const dep of audit.recommendations) {
    if (hasBreakingChanges(dep.current, dep.latest)) {
      score -= 15;
    }
  }
  
  score -= audit.vulnerable * 20;
  score -= audit.outdated * 5;
  score -= audit.license.filter(l => !l.compatible).length * 10;
  
  return Math.max(0, score);
}

/**
 * Suggest dependencies to add based on usage patterns
 */
export function suggestDependencies(
  projectType: "node" | "python" | "rust" | "go" | "java",
  categories: ("testing" | "ci" | "security" | "docs" | "performance" | "logging")[]
): string[] {
  const suggestions: Record<string, Record<string, string>> = {
    node: {
      testing: "vitest",
      ci: "github-actions",
      security: "snyk",
      docs: "typedoc",
      performance: "clinic",
      logging: "pino",
    },
    python: {
      testing: "pytest",
      ci: "github-actions",
      security: "bandit",
      docs: "sphinx",
      performance: "py-spy",
      logging: "structlog",
    },
    rust: {
      testing: "cargo-test",
      ci: "github-actions",
      security: "cargo-audit",
      docs: "cargo-docs",
      performance: "perf",
      logging: "tracing",
    },
    go: {
      testing: "go test",
      ci: "github-actions",
      security: "gosec",
      docs: "godoc",
      performance: "pprof",
      logging: "zap",
    },
    java: {
      testing: "junit",
      ci: "github-actions",
      security: "owasp",
      docs: "javadoc",
      performance: "async-profiler",
      logging: "log4j",
    },
  };

  return categories
    .map(cat => suggestions[projectType]?.[cat])
    .filter(Boolean) as string[];
}
