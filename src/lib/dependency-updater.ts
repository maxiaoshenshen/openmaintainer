/**
 * Dependency Updater - Intelligent dependency management
 */

export interface Dependency {
  name: string;
  version: string;
  latestVersion?: string;
  type: "production" | "development" | "peer" | "optional";
  deprecated?: boolean;
  vulnerable?: boolean;
  vulnerableSeverity?: "low" | "medium" | "high" | "critical";
}

export interface UpdatePlan {
  id: string;
  targetVersion: string;
  breakingChanges: string[];
  migrationGuide?: string;
  risks: string[];
  benefits: string[];
  estimatedEffort: "low" | "medium" | "high";
}

export interface DependencyUpdate {
  dependency: Dependency;
  plan: UpdatePlan;
  autoMergeable: boolean;
  requiresReview: boolean;
  blockingPackages: string[];
}

export interface OutdatedDependency extends Dependency {
  currentVersion: string;
  latestVersion: string;
  wantedVersion: string;
  major: boolean;
  minor: boolean;
  patch: boolean;
  isMajor: boolean;
}

export interface UpdateStrategy {
  type: "safe" | "minor" | "major" | "custom";
  ignorePatterns?: string[];
  allowedVersions?: string[];
  blockers?: string[];
}

/**
 * Parse dependency from package.json format
 */
export function parseDependency(
  name: string,
  version: string,
  type: Dependency["type"] = "production"
): Dependency {
  return {
    name,
    version,
    type,
    deprecated: false,
    vulnerable: false,
  };
}

/**
 * Check if version is outdated
 */
export function checkVersionStatus(
  current: string,
  latest: string
): { outdated: boolean; major: boolean; minor: boolean; patch: boolean } {
  const currentParts = current.replace(/[^0-9.]/g, "").split(".").map(Number);
  const latestParts = latest.replace(/[^0-9.]/g, "").split(".").map(Number);

  const isMajor = latestParts[0] > (currentParts[0] || 0);
  const isMinor = latestParts[0] === (currentParts[0] || 0) && latestParts[1] > (currentParts[1] || 0);
  const isPatch = latestParts[0] === (currentParts[0] || 0) && latestParts[1] === (currentParts[1] || 0) && latestParts[2] > (currentParts[2] || 0);

  return {
    outdated: isMajor || isMinor || isPatch,
    major: isMajor,
    minor: isMinor,
    patch: isPatch,
  };
}

/**
 * Create an update plan for a dependency
 */
export function createUpdatePlan(
  dependency: Dependency,
  targetVersion: string,
  strategy: UpdateStrategy = { type: "safe" }
): UpdatePlan {
  const breakingChanges = detectBreakingChanges(dependency.version, targetVersion);
  const risks = generateRisks(dependency, targetVersion);
  const benefits = generateBenefits(dependency, targetVersion);

  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    targetVersion,
    breakingChanges,
    migrationGuide: breakingChanges.length > 0 ? generateMigrationGuide(dependency, targetVersion) : undefined,
    risks,
    benefits,
    estimatedEffort: calculateEffort(breakingChanges, risks),
  };
}

function detectBreakingChanges(from: string, to: string): string[] {
  const changes: string[] = [];
  const fromParts = from.replace(/[^0-9.]/g, "").split(".").map(Number);
  const toParts = to.replace(/[^0-9.]/g, "").split(".").map(Number);

  if (toParts[0] > (fromParts[0] || 0)) {
    changes.push(`Major version bump: ${fromParts[0] || 0}.x.x → ${toParts[0]}.x.x`);
    changes.push("API may have breaking changes");
    changes.push("Review changelog for migration steps");
  }

  if (toParts[0] > (fromParts[0] || 0) + 1) {
    changes.push(`Skipping ${toParts[0] - (fromParts[0] || 0) - 1} major version(s)`);
    changes.push("Consider updating incrementally");
  }

  return changes;
}

function generateRisks(dependency: Dependency, targetVersion: string): string[] {
  const risks: string[] = [];

  if (dependency.vulnerable) {
    risks.push(`Known vulnerability (${dependency.vulnerableSeverity} severity)`);
  }

  if (dependency.deprecated) {
    risks.push("Package is deprecated");
  }

  const fromParts = dependency.version.replace(/[^0-9.]/g, "").split(".").map(Number);
  const toParts = targetVersion.replace(/[^0-9.]/g, "").split(".").map(Number);

  if (toParts[0] > (fromParts[0] || 0)) {
    risks.push("Potential breaking changes");
    risks.push("May require code modifications");
  }

  return risks;
}

function generateBenefits(dependency: Dependency, targetVersion: string): string[] {
  const benefits: string[] = [];

  benefits.push(`Updated from ${dependency.version} to ${targetVersion}`);

  if (dependency.vulnerable) {
    benefits.push("Resolves security vulnerability");
  }

  benefits.push("Access to latest features");
  benefits.push("Performance improvements");
  benefits.push("Bug fixes");

  return benefits;
}

function generateMigrationGuide(dependency: Dependency, targetVersion: string): string {
  return `# Migration Guide: ${dependency.name} ${dependency.version} → ${targetVersion}

## Overview
This guide helps you migrate from ${dependency.name} v${dependency.version} to v${targetVersion}.

## Breaking Changes
${detectBreakingChanges(dependency.version, targetVersion).map(c => `- ${c}`).join("\n")}

## Step-by-Step Migration

1. **Update the package**
   \`\`\`bash
   npm install ${dependency.name}@${targetVersion}
   \`\`\`

2. **Review the changelog**
   Check the official changelog for detailed breaking changes.

3. **Run tests**
   \`\`\`bash
   npm test
   \`\`\`

4. **Fix any breaking changes**
   Update your code according to the breaking changes identified.

5. **Verify functionality**
   Test all affected features.
`;
}

function calculateEffort(breakingChanges: string[], risks: string[]): "low" | "medium" | "high" {
  const score = breakingChanges.length * 2 + risks.length;
  if (score <= 2) return "low";
  if (score <= 5) return "medium";
  return "high";
}

/**
 * Analyze a dependency for update eligibility
 */
export function analyzeDependencyUpdate(
  dependency: Dependency,
  latestVersion: string,
  strategy: UpdateStrategy = { type: "safe" }
): DependencyUpdate {
  const status = checkVersionStatus(dependency.version, latestVersion);
  const plan = createUpdatePlan(dependency, latestVersion, strategy);

  // Check if update is blocked by other dependencies
  const blockingPackages = findBlockingPackages(dependency.name, latestVersion);

  // Determine if auto-mergeable
  let autoMergeable = false;
  if (strategy.type === "safe" || strategy.type === "minor") {
    autoMergeable = !status.major && plan.breakingChanges.length === 0;
  }

  // Check if review is required
  let requiresReview = status.major || plan.breakingChanges.length > 0;
  if (dependency.name.match(new RegExp(strategy.ignorePatterns?.join("|") || "^$"))) {
    requiresReview = false;
  }

  return {
    dependency: { ...dependency, latestVersion },
    plan,
    autoMergeable,
    requiresReview,
    blockingPackages,
  };
}

function findBlockingPackages(dependency: string, version: string): string[] {
  // Simulated blocking packages detection
  // In real implementation, would check package-lock.json for dependents
  const blockingMap: Record<string, string[]> = {
    "react": ["react-dom", "react-native"],
    "lodash": [],
  };

  return blockingMap[dependency] || [];
}

/**
 * Build dependency update dashboard
 */
export function buildDependencyDashboard(
  dependencies: Dependency[],
  latestVersions: Record<string, string>
) {
  const outdated: OutdatedDependency[] = [];
  const securityUpdates: DependencyUpdate[] = [];
  const minorUpdates: DependencyUpdate[] = [];
  const majorUpdates: DependencyUpdate[] = [];

  for (const dep of dependencies) {
    const latest = latestVersions[dep.name];
    if (!latest) continue;

    const status = checkVersionStatus(dep.version, latest);
    if (status.outdated) {
      const update = analyzeDependencyUpdate(dep, latest);

      outdated.push({
        ...dep,
        currentVersion: dep.version,
        latestVersion: latest,
        wantedVersion: latest,
        major: status.major,
        minor: status.minor,
        patch: status.patch,
        isMajor: status.major,
      });

      if (dep.vulnerable) {
        securityUpdates.push(update);
      } else if (status.major) {
        majorUpdates.push(update);
      } else {
        minorUpdates.push(update);
      }
    }
  }

  return {
    total: dependencies.length,
    outdatedCount: outdated.length,
    securityCritical: securityUpdates.length,
    majorUpdates,
    minorUpdates,
    securityUpdates,
    outdatedDependencies: outdated,
    summary: {
      upToDate: dependencies.length - outdated.length,
      needsAttention: outdated.length,
    },
  };
}

/**
 * Generate batch update recommendations
 */
export function generateBatchUpdates(
  dependencies: Dependency[],
  latestVersions: Record<string, string>,
  strategy: UpdateStrategy = { type: "safe" }
): { batch: DependencyUpdate[]; warnings: string[] } {
  const batch: DependencyUpdate[] = [];
  const warnings: string[] = [];

  for (const dep of dependencies) {
    const latest = latestVersions[dep.name];
    if (!latest) continue;

    const status = checkVersionStatus(dep.version, latest);
    if (!status.outdated) continue;

    // Apply strategy filters
    if (strategy.type === "safe" && status.major) {
      warnings.push(`Skipping major update for ${dep.name}`);
      continue;
    }

    if (strategy.ignorePatterns?.some(pattern => dep.name.match(new RegExp(pattern)))) {
      warnings.push(`Skipping ${dep.name} (matches ignore pattern)`);
      continue;
    }

    const update = analyzeDependencyUpdate(dep, latest, strategy);

    if (!update.blockingPackages.length || strategy.type === "major") {
      batch.push(update);
    } else {
      warnings.push(`${dep.name} is blocked by ${update.blockingPackages.join(", ")}`);
    }
  }

  return { batch, warnings };
}
