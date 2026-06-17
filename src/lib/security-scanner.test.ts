import { describe, it, expect, beforeEach } from "vitest";
import { SecurityScanner } from "./security-scanner";

describe("SecurityScanner", () => {
  let scanner: SecurityScanner;

  beforeEach(() => {
    scanner = new SecurityScanner();
  });

  describe("scanRepository", () => {
    it("should scan and return issues", async () => {
      const result = await scanner.scanRepository("test/repo");

      expect(result.repository).toBe("test/repo");
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.summary.total).toBe(result.issues.length);
    });

    it("should calculate score based on severity", async () => {
      const result = await scanner.scanRepository("test/repo");

      expect(result.summary.critical).toBeGreaterThan(0);
      expect(result.summary.score).toBeGreaterThan(0);
    });

    it("should filter issues by severity threshold", async () => {
      const strictScanner = new SecurityScanner({ severityThreshold: "high" });
      const result = await strictScanner.scanRepository("test/repo");

      const severities = result.issues.map(i => i.severity);
      expect(severities.every(s => ["critical", "high"].includes(s))).toBe(true);
    });
  });

  describe("configuration", () => {
    it("should disable secrets scanning when configured", async () => {
      const scanner = new SecurityScanner({ scanSecrets: false });
      const result = await scanner.scanRepository("test/repo");

      const hasSecretsIssues = result.issues.some(i => i.type.includes("secret"));
      expect(hasSecretsIssues).toBe(false);
    });

    it("should disable dependency scanning when configured", async () => {
      const scanner = new SecurityScanner({ scanDependencies: false });
      const result = await scanner.scanRepository("test/repo");

      const hasDependencyIssues = result.issues.some(i => i.type.includes("dependency"));
      expect(hasDependencyIssues).toBe(false);
    });
  });

  describe("getRecommendations", () => {
    it("should return recommendations for issues", async () => {
      const result = await scanner.scanRepository("test/repo");
      const recommendations = scanner.getRecommendations(result.issues);

      expect(recommendations.length).toBe(result.issues.length);
      expect(recommendations.every(r => typeof r === "string")).toBe(true);
    });
  });
});
