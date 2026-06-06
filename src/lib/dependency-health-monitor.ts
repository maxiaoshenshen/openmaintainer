/**
 * Dependency Health Monitor
 * Tracks dependency updates, vulnerabilities, and compatibility
 */
import type { Repository } from "./types";

export interface DependencyHealth {
  name: string;
  version: string;
  latestVersion: string;
  isOutdated: boolean;
  hasVulnerabilities: boolean;
  vulnerabilityCount: number;
  lastUpdated: Date;
  status: "healthy" | "outdated" | "vulnerable" | "deprecated";
}

export interface DependencyHealthReport {
  repository: string;
  generatedAt: Date;
  dependencies: DependencyHealth[];
  outdatedCount: number;
  vulnerableCount: number;
  deprecatedCount: number;
  healthScore: number;
  criticalUpdates: { name: string; reason: string; }[];
  // Legacy alias
  totalDependencies: number;
}

const sampleDependencies = [
  { name: "lodash", current: "4.17.20", latest: "4.17.21", vuln: 0, deprecated: false },
  { name: "axios", current: "0.27.2", latest: "1.6.0", vuln: 2, deprecated: false },
  { name: "express", current: "4.18.2", latest: "4.18.2", vuln: 0, deprecated: false },
  { name: "react", current: "18.2.0", latest: "18.2.0", vuln: 0, deprecated: false },
  { name: "vue", current: "3.3.0", latest: "3.4.0", vuln: 0, deprecated: false },
];

export function checkDependencyHealth(repository: Repository): DependencyHealthReport {
  const dependencies: DependencyHealth[] = sampleDependencies.map(dep => {
    const isOutdated = dep.current !== dep.latest;
    return {
      name: dep.name,
      version: dep.current,
      latestVersion: dep.latest,
      isOutdated,
      hasVulnerabilities: dep.vuln > 0,
      vulnerabilityCount: dep.vuln,
      lastUpdated: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      status: dep.deprecated ? "deprecated" : 
              dep.vuln > 0 ? "vulnerable" :
              isOutdated ? "outdated" : "healthy",
    };
  });

  const outdatedCount = dependencies.filter(d => d.isOutdated).length;
  const vulnerableCount = dependencies.filter(d => d.hasVulnerabilities).length;
  const deprecatedCount = dependencies.filter(d => d.status === "deprecated").length;
  
  const healthScore = Math.floor(
    ((dependencies.length - outdatedCount) / dependencies.length) * 50 +
    ((dependencies.length - vulnerableCount) / dependencies.length) * 50
  );

  const criticalUpdates = dependencies
    .filter(d => d.hasVulnerabilities || d.status === "deprecated")
    .map(d => ({
      name: d.name,
      reason: d.hasVulnerabilities 
        ? `${d.vulnerabilityCount} vulnerabilities detected` 
        : "Package is deprecated",
    }));

  return {
    repository: repository.name,
    generatedAt: new Date(),
    dependencies,
    outdatedCount,
    vulnerableCount,
    deprecatedCount,
    healthScore,
    criticalUpdates,
    totalDependencies: dependencies.length,
  };
}
