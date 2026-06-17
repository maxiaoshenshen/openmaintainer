import { describe, it, expect } from "vitest";
import {
  parseDependency,
  satisfiesVersion,
  determineUpdateType,
  hasBreakingChanges,
  auditDependencies,
  calculateSecurityScore,
  suggestDependencies,
  type Dependency,
} from "./dependency-manager";

describe("DependencyManager", () => {
  describe("parseDependency", () => {
    it("should parse simple dependency", () => {
      const result = parseDependency("lodash@4.17.21");
      expect(result).toEqual({ name: "lodash", version: "4.17.21" });
    });

    it("should parse scoped dependency", () => {
      const result = parseDependency("@types/node@20.0.0");
      expect(result).toEqual({ name: "@types/node", version: "20.0.0" });
    });

    it("should throw on invalid format", () => {
      expect(() => parseDependency("invalid")).toThrow("Invalid dependency format");
    });
  });

  describe("satisfiesVersion", () => {
    it("should match exact version", () => {
      expect(satisfiesVersion("1.2.3", "1.2.3")).toBe(true);
      expect(satisfiesVersion("1.2.4", "1.2.3")).toBe(false);
    });

    it("should match caret ranges", () => {
      expect(satisfiesVersion("1.2.3", "^1.0.0")).toBe(true);
      expect(satisfiesVersion("2.0.0", "^1.0.0")).toBe(false);
      expect(satisfiesVersion("1.5.0", "^1.2.0")).toBe(true);
    });

    it("should match tilde ranges", () => {
      expect(satisfiesVersion("1.2.5", "~1.2.0")).toBe(true);
      expect(satisfiesVersion("1.3.0", "~1.2.0")).toBe(false);
    });

    it("should handle comparison operators", () => {
      expect(satisfiesVersion("2.0.0", ">=1.0.0")).toBe(true);
      expect(satisfiesVersion("0.5.0", ">=1.0.0")).toBe(false);
      expect(satisfiesVersion("1.5.0", ">1.0.0")).toBe(true);
      expect(satisfiesVersion("1.0.0", ">1.0.0")).toBe(false);
    });
  });

  describe("determineUpdateType", () => {
    it("should detect major updates", () => {
      expect(determineUpdateType("1.0.0", "2.0.0")).toBe("major");
      expect(determineUpdateType("1.0.0", "3.0.0")).toBe("major");
    });

    it("should detect minor updates", () => {
      expect(determineUpdateType("1.0.0", "1.1.0")).toBe("minor");
      expect(determineUpdateType("1.2.3", "1.5.0")).toBe("minor");
    });

    it("should detect patch updates", () => {
      expect(determineUpdateType("1.0.0", "1.0.1")).toBe("patch");
      expect(determineUpdateType("1.2.3", "1.2.5")).toBe("patch");
    });
  });

  describe("hasBreakingChanges", () => {
    it("should detect breaking changes in major version", () => {
      expect(hasBreakingChanges("1.0.0", "2.0.0")).toBe(true);
      expect(hasBreakingChanges("1.0.0", "1.0.1")).toBe(false);
    });
  });

  describe("auditDependencies", () => {
    it("should count dependencies correctly", () => {
      const deps: Dependency[] = [
        { name: "express", version: "4.18.0", type: "production" },
        { name: "vitest", version: "1.0.0", type: "development" },
      ];
      const audit = auditDependencies(deps);
      expect(audit.total).toBe(2);
      expect(audit.production).toBe(1);
      expect(audit.development).toBe(1);
    });

    it("should detect outdated dependencies", () => {
      const deps: Dependency[] = [
        { name: "lodash", version: "4.0.0", type: "production", outdated: true, latestVersion: "4.17.21" },
      ];
      const audit = auditDependencies(deps);
      expect(audit.outdated).toBe(1);
      expect(audit.recommendations.length).toBe(1);
    });

    it("should detect license issues", () => {
      const deps: Dependency[] = [
        { name: "bad-license", version: "1.0.0", type: "production", license: "GPL-3.0" },
      ];
      const audit = auditDependencies(deps);
      expect(audit.license.length).toBe(1);
      expect(audit.license[0].compatible).toBe(false);
    });
  });

  describe("calculateSecurityScore", () => {
    it("should return 100 for clean audit", () => {
      const audit = auditDependencies([]);
      expect(calculateSecurityScore(audit)).toBe(100);
    });

    it("should deduct for vulnerabilities", () => {
      const deps: Dependency[] = [
        { 
          name: "vuln-pkg", 
          version: "1.0.0", 
          type: "production",
          vulnerabilities: [{ severity: "high" as const, title: "Vuln", description: "", affectedVersions: "1.0.0" }]
        },
      ];
      const audit = auditDependencies(deps);
      const score = calculateSecurityScore(audit);
      expect(score).toBeLessThan(100);
    });
  });

  describe("suggestDependencies", () => {
    it("should suggest dependencies for Node project", () => {
      const suggestions = suggestDependencies("node", ["testing", "logging"]);
      expect(suggestions).toContain("vitest");
      expect(suggestions).toContain("pino");
    });

    it("should suggest dependencies for Python project", () => {
      const suggestions = suggestDependencies("python", ["testing"]);
      expect(suggestions).toContain("pytest");
    });

    it("should suggest dependencies for Rust project", () => {
      const suggestions = suggestDependencies("rust", ["security", "logging"]);
      expect(suggestions).toContain("cargo-audit");
      expect(suggestions).toContain("tracing");
    });
  });
});
