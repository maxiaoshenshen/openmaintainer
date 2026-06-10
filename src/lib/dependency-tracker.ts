import type { Repository, PullRequest } from "./types";

export interface Dependency {
  name: string;
  version: string;
  latestVersion: string;
  outdated: boolean;
  vulnerable: boolean;
  breaking: boolean;
  updateType: "major" | "minor" | "patch";
}

export interface DependencyReport {
  repository: string;
  total: number;
  outdated: number;
  vulnerable: number;
  dependencies: Dependency[];
  riskScore: number;
  recommendations: string[];
}

export interface License {
  name: string;
  spdx: string;
  compatible: boolean;
}

export interface LicenseReport {
  repository: string;
  licenses: License[];
  hasIncompatible: boolean;
  summary: string;
}

export function analyzeDependencies(
  repo: Repository,
  packageJson?: string
): DependencyReport {
  // Mock dependency data for demonstration
  const dependencies = parsePackageJson(packageJson);

  return {
    repository: repo.identity.fullName,
    total: dependencies.length,
    outdated: dependencies.filter((d) => d.outdated).length,
    vulnerable: dependencies.filter((d) => d.vulnerable).length,
    dependencies,
    riskScore: calculateRiskScore(dependencies),
    recommendations: generateDependencyRecommendations(dependencies),
  };
}

function parsePackageJson(json?: string): Dependency[] {
  // If no package.json provided, return sample data
  if (!json) {
    return [
      {
        name: "react",
        version: "^18.2.0",
        latestVersion: "18.3.1",
        outdated: true,
        vulnerable: false,
        breaking: false,
        updateType: "minor",
      },
      {
        name: "typescript",
        version: "^5.3.0",
        latestVersion: "5.4.5",
        outdated: true,
        vulnerable: false,
        breaking: true,
        updateType: "minor",
      },
      {
        name: "vitest",
        version: "^1.0.0",
        latestVersion: "1.5.0",
        outdated: true,
        vulnerable: false,
        breaking: false,
        updateType: "minor",
      },
      {
        name: "lodash",
        version: "^4.17.20",
        latestVersion: "4.17.21",
        outdated: true,
        vulnerable: false,
        breaking: false,
        updateType: "patch",
      },
    ];
  }

  // Parse actual package.json if provided
  try {
    const pkg = JSON.parse(json);
    return [
      ...Object.entries(pkg.dependencies || {}).map(
        ([name, version]) => ({
          name,
          version: version as string,
          latestVersion: version as string,
          outdated: false,
          vulnerable: false,
          breaking: false,
          updateType: "patch" as const,
        })
      ),
      ...Object.entries(pkg.devDependencies || {}).map(
        ([name, version]) => ({
          name,
          version: version as string,
          latestVersion: version as string,
          outdated: false,
          vulnerable: false,
          breaking: false,
          updateType: "patch" as const,
        })
      ),
    ];
  } catch {
    return [];
  }
}

function calculateRiskScore(dependencies: Dependency[]): number {
  let risk = 0;

  // High risk: vulnerable dependencies
  risk += dependencies.filter((d) => d.vulnerable).length * 30;

  // Medium risk: outdated major versions
  risk += dependencies.filter(
    (d) => d.outdated && d.updateType === "major"
  ).length * 15;

  // Low risk: outdated minor/patch versions
  risk += dependencies.filter(
    (d) => d.outdated && d.updateType !== "major"
  ).length * 5;

  return Math.min(100, risk);
}

function generateDependencyRecommendations(
  dependencies: Dependency[]
): string[] {
  const recs: string[] = [];

  const vulnerable = dependencies.filter((d) => d.vulnerable);
  if (vulnerable.length > 0) {
    recs.push(
      `URGENT: ${vulnerable.length} vulnerable dependency(ies) need immediate attention`
    );
  }

  const outdated = dependencies.filter(
    (d) => d.outdated && !d.vulnerable
  );
  if (outdated.length > 0) {
    recs.push(
      `${outdated.length} dependencies have updates available. Run 'npm update' to apply.`
    );
  }

  const breaking = dependencies.filter((d) => d.breaking);
  if (breaking.length > 0) {
    recs.push(
      `${breaking.map((d) => d.name).join(", ")} may have breaking changes. Review changelog before updating.`
    );
  }

  if (dependencies.length > 50) {
    recs.push(
      "Consider auditing dependencies regularly to reduce supply chain risks"
    );
  }

  return recs;
}

export function analyzeLicenses(
  repo: Repository,
  licenses?: string[]
): LicenseReport {
  const detectedLicenses = licenses || ["MIT", "Apache-2.0"];
  const knownLicenses = detectKnownLicenses(detectedLicenses);

  return {
    repository: repo.identity.fullName,
    licenses: knownLicenses,
    hasIncompatible: knownLicenses.some((l) => !l.compatible),
    summary: generateLicenseSummary(knownLicenses),
  };
}

function detectKnownLicenses(licenses: string[]): License[] {
  const compatibilityMap: Record<string, boolean> = {
    "MIT": true,
    "Apache-2.0": true,
    "BSD-2-Clause": true,
    "BSD-3-Clause": true,
    "ISC": true,
    "CC0-1.0": true,
    "Unlicense": true,
    "GPL-3.0": false,
    "AGPL-3.0": false,
    "LGPL-3.0": false,
  };

  return licenses.map((name) => ({
    name,
    spdx: name,
    compatible: compatibilityMap[name] ?? false,
  }));
}

function generateLicenseSummary(licenses: License[]): string {
  const compatible = licenses.filter((l) => l.compatible).length;
  const total = licenses.length;

  if (compatible === total) {
    return `All ${total} license(s) are open source compatible.`;
  }

  return `${compatible}/${total} licenses are compatible. ${total - compatible} may require commercial licensing review.`;
}

// Additional utility functions for tests
export interface ParsedDependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  type: "production" | "development";
  updateAvailable: boolean;
  breaking: boolean;
  releaseDate: Date;
}

export function parseDependencies(pkg: Record<string, any>): ParsedDependency[] {
  const deps: ParsedDependency[] = [];

  if (pkg.dependencies) {
    Object.entries(pkg.dependencies).forEach(([name, version]) => {
      deps.push({
        name,
        currentVersion: version as string,
        latestVersion: version as string,
        type: "production",
        updateAvailable: false,
        breaking: false,
        releaseDate: new Date(),
      });
    });
  }

  if (pkg.devDependencies) {
    Object.entries(pkg.devDependencies).forEach(([name, version]) => {
      deps.push({
        name,
        currentVersion: version as string,
        latestVersion: version as string,
        type: "development",
        updateAvailable: false,
        breaking: false,
        releaseDate: new Date(),
      });
    });
  }

  return deps;
}

export function isBreakingUpdate(from: string, to: string): boolean {
  const fromParts = from.split(".").map(Number);
  const toParts = to.split(".").map(Number);
  return toParts[0] > fromParts[0];
}

export function getUpdateSeverity(from: string, to: string): "major" | "minor" | "patch" {
  const fromParts = from.split(".").map(Number);
  const toParts = to.split(".").map(Number);

  if (toParts[0] > fromParts[0]) return "major";
  if (toParts[1] > fromParts[1]) return "minor";
  return "patch";
}

export interface AuditReport {
  total: number;
  upToDate: number;
  outdated: number;
  breaking: number;
}

export function auditDependencies(deps: ParsedDependency[]): AuditReport {
  return {
    total: deps.length,
    upToDate: deps.filter((d) => !d.updateAvailable).length,
    outdated: deps.filter((d) => d.updateAvailable).length,
    breaking: deps.filter((d) => d.breaking).length,
  };
}

export interface GroupedDependencies {
  critical: ParsedDependency[];
  major: ParsedDependency[];
  minor: ParsedDependency[];
  patch: ParsedDependency[];
}

export function groupByUpdatePriority(deps: ParsedDependency[]): GroupedDependencies {
  const grouped: GroupedDependencies = {
    critical: [],
    major: [],
    minor: [],
    patch: [],
  };

  deps.forEach((dep) => {
    if (dep.breaking) {
      grouped.critical.push(dep);
    } else if (dep.updateAvailable) {
      const severity = getUpdateSeverity(dep.currentVersion, dep.latestVersion);
      grouped[severity].push(dep);
    }
  });

  return grouped;
}
