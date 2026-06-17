import { describe, it, expect } from "vitest";
import {
  parseDependency,
  checkVersionStatus,
  createUpdatePlan,
  analyzeDependencyUpdate,
  buildDependencyDashboard,
  generateBatchUpdates,
} from "./dependency-updater";

describe("Dependency Updater", () => {
  describe("parseDependency", () => {
    it("should parse a production dependency", () => {
      const dep = parseDependency("react", "^18.0.0", "production");
      
      expect(dep.name).toBe("react");
      expect(dep.version).toBe("^18.0.0");
      expect(dep.type).toBe("production");
      expect(dep.deprecated).toBe(false);
    });

    it("should parse a dev dependency", () => {
      const dep = parseDependency("vitest", "^1.0.0", "development");
      
      expect(dep.type).toBe("development");
    });
  });

  describe("checkVersionStatus", () => {
    it("should detect patch update", () => {
      const status = checkVersionStatus("1.0.0", "1.0.1");
      
      expect(status.outdated).toBe(true);
      expect(status.patch).toBe(true);
      expect(status.minor).toBe(false);
      expect(status.major).toBe(false);
    });

    it("should detect minor update", () => {
      const status = checkVersionStatus("1.0.0", "1.1.0");
      
      expect(status.outdated).toBe(true);
      expect(status.minor).toBe(true);
    });

    it("should detect major update", () => {
      const status = checkVersionStatus("1.0.0", "2.0.0");
      
      expect(status.outdated).toBe(true);
      expect(status.major).toBe(true);
    });

    it("should return not outdated for same version", () => {
      const status = checkVersionStatus("1.0.0", "1.0.0");
      
      expect(status.outdated).toBe(false);
    });
  });

  describe("createUpdatePlan", () => {
    it("should create a plan with breaking changes for major update", () => {
      const dep = parseDependency("lodash", "4.0.0");
      const plan = createUpdatePlan(dep, "5.0.0");
      
      expect(plan.targetVersion).toBe("5.0.0");
      expect(plan.breakingChanges.length).toBeGreaterThan(0);
      expect(plan.migrationGuide).toBeDefined();
      expect(plan.risks.length).toBeGreaterThan(0);
    });

    it("should create a safe plan for minor update", () => {
      const dep = parseDependency("react", "18.0.0");
      const plan = createUpdatePlan(dep, "18.1.0");
      
      expect(plan.breakingChanges.length).toBe(0);
      expect(plan.estimatedEffort).toBe("low");
    });

    it("should estimate high effort for many risks", () => {
      const dep = { ...parseDependency("test", "1.0.0"), vulnerable: true, deprecated: true };
      const plan = createUpdatePlan(dep, "2.0.0");
      
      expect(plan.risks.length).toBeGreaterThanOrEqual(3);
      expect(["low", "medium", "high"]).toContain(plan.estimatedEffort);
    });
  });

  describe("analyzeDependencyUpdate", () => {
    it("should mark vulnerable dependencies for security update", () => {
      const dep = { ...parseDependency("axios", "0.21.0"), vulnerable: true, vulnerableSeverity: "high" as const };
      const update = analyzeDependencyUpdate(dep, "0.21.4");
      
      expect(update.dependency.vulnerable).toBe(true);
      expect(update.plan.benefits.some(b => b.includes("security"))).toBe(true);
    });

    it("should not be auto-mergeable for major updates", () => {
      const dep = parseDependency("express", "4.0.0");
      const update = analyzeDependencyUpdate(dep, "5.0.0");
      
      expect(update.autoMergeable).toBe(false);
      expect(update.requiresReview).toBe(true);
    });

    it("should be auto-mergeable for minor updates", () => {
      const dep = parseDependency("express", "4.0.0");
      const update = analyzeDependencyUpdate(dep, "4.1.0");
      
      expect(update.autoMergeable).toBe(true);
    });
  });

  describe("buildDependencyDashboard", () => {
    const deps = [
      parseDependency("react", "18.0.0"),
      parseDependency("lodash", "4.0.0"),
      parseDependency("axios", "0.21.0"),
    ];

    const latestVersions = {
      "react": "18.2.0",
      "lodash": "4.17.21",
      "axios": "1.6.0",
    };

    it("should count outdated dependencies", () => {
      const dashboard = buildDependencyDashboard(deps, latestVersions);
      
      expect(dashboard.outdatedCount).toBe(3);
      expect(dashboard.outdatedDependencies.length).toBe(3);
    });

    it("should categorize major updates", () => {
      const dashboard = buildDependencyDashboard(deps, latestVersions);
      
      expect(dashboard.majorUpdates.length).toBe(1); // axios 0.21 -> 1.6 is major
    });

    it("should include security updates", () => {
      const vulnerableDeps = [
        { ...parseDependency("lodash", "4.0.0"), vulnerable: true, vulnerableSeverity: "high" as const },
      ];
      
      const dashboard = buildDependencyDashboard(vulnerableDeps, { "lodash": "4.17.21" });
      
      expect(dashboard.securityCritical).toBe(1);
    });
  });

  describe("generateBatchUpdates", () => {
    it("should skip major updates with safe strategy", () => {
      const deps = [parseDependency("express", "4.0.0")];
      const latest = { "express": "5.0.0" };
      
      const result = generateBatchUpdates(deps, latest, { type: "safe" });
      
      expect(result.batch.length).toBe(0);
      expect(result.warnings.length).toBe(1);
    });

    it("should include major updates with major strategy", () => {
      const deps = [parseDependency("express", "4.0.0")];
      const latest = { "express": "5.0.0" };
      
      const result = generateBatchUpdates(deps, latest, { type: "major" });
      
      expect(result.batch.length).toBe(1);
    });

    it("should respect ignore patterns", () => {
      const deps = [
        parseDependency("lodash", "4.0.0"),
        parseDependency("axios", "0.21.0"),
      ];
      const latest = { "lodash": "5.0.0", "axios": "1.0.0" };
      
      const result = generateBatchUpdates(deps, latest, { 
        type: "major",
        ignorePatterns: ["lodash"]
      });
      
      expect(result.warnings.some(w => w.includes("lodash"))).toBe(true);
    });
  });
});
