import { describe, it, expect } from "vitest";
import {
  scanDependencies,
  scanForSecrets,
  checkLicenses,
  generateSecurityReport,
  type SecurityFinding,
} from "./security-scanner";

describe("SecurityScanner", () => {
  describe("scanDependencies", () => {
    it("should find vulnerabilities in dependencies", async () => {
      const packages = [
        { name: "lodash", version: "4.17.19" },
        { name: "axios", version: "0.18.0" },
        { name: "express", version: "4.18.0" },
      ];

      const findings = await scanDependencies(packages);
      expect(findings.length).toBeGreaterThan(0);
      
      const lodashVuln = findings.find(f => f.package === "lodash");
      expect(lodashVuln).toBeDefined();
      expect(lodashVuln?.severity).toBe("high");
      expect(lodashVuln?.cveId).toBe("CVE-2021-23337");
    });

    it("should respect severity threshold", async () => {
      const packages = [{ name: "axios", version: "0.18.0" }];
      const findings = await scanDependencies(packages, { severityThreshold: "high" });
      
      const criticalHigh = findings.filter(f => f.severity === "critical" || f.severity === "high");
      expect(criticalHigh.length).toBe(0);
    });

    it("should skip dev dependencies when configured", async () => {
      const packages = [
        { name: "lodash", version: "4.17.19", dev: false },
        { name: "jest", version: "27.0.0", dev: true },
      ];

      const findings = await scanDependencies(packages, { includeDevDeps: false });
      expect(findings.some(f => f.package === "jest")).toBe(false);
    });
  });

  describe("scanForSecrets", () => {
    it("should detect AWS access keys", () => {
      const files = [{
        path: "config.js",
        content: "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nGITHUB_TOKEN=ghp_1234567890abcdefghijklmnop",
      }];

      const findings = scanForSecrets(files);
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings.some(f => f.type === "secret")).toBe(true);
    });

    it("should detect private keys", () => {
      const files = [{
        path: "keys.pem",
        content: "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAL...\n-----END RSA PRIVATE KEY-----",
      }];

      const findings = scanForSecrets(files);
      expect(findings.some(f => f.title.includes("Private Key"))).toBe(true);
    });

    it("should return empty array for clean code", () => {
      const files = [{
        path: "index.js",
        content: "const port = process.env.PORT || 3000;\nexport default app;",
      }];

      const findings = scanForSecrets(files);
      expect(findings.length).toBe(0);
    });
  });

  describe("checkLicenses", () => {
    it("should flag forbidden licenses", () => {
      const dependencies = [
        { name: "fancy-license-lib", version: "1.0.0", license: "GPL-3.0" },
        { name: "mit-lib", version: "2.0.0", license: "MIT" },
      ];

      const findings = checkLicenses(dependencies);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].severity).toBe("high");
      expect(findings[0].title).toContain("Forbidden license");
    });

    it("should flag risky licenses with medium severity", () => {
      const dependencies = [
        { name: "mpl-lib", version: "1.0.0", license: "MPL-2.0" },
      ];

      const findings = checkLicenses(dependencies);
      expect(findings[0].severity).toBe("medium");
    });

    it("should allow MIT licensed packages", () => {
      const dependencies = [
        { name: "express", version: "4.18.0", license: "MIT" },
      ];

      const findings = checkLicenses(dependencies);
      expect(findings.length).toBe(0);
    });
  });

  describe("generateSecurityReport", () => {
    it("should generate comprehensive report", async () => {
      const packages = [
        { name: "lodash", version: "4.17.19" },
        { name: "express", version: "4.18.0" },
      ];

      const report = await generateSecurityReport("owner/repo", packages);

      expect(report.repository).toBe("owner/repo");
      expect(report.timestamp).toBeDefined();
      expect(report.scanDuration).toBeGreaterThanOrEqual(0);
      expect(report.findings).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.total).toBe(report.findings.length);
      expect(report.summary.critical).toBeDefined();
      expect(report.summary.high).toBeDefined();
    });

    it("should pass when no critical/high vulnerabilities", async () => {
      const packages = [
        { name: "safe-lib", version: "1.0.0" },
      ];

      const report = await generateSecurityReport("owner/repo", packages);
      expect(report.passed).toBe(true);
    });
  });
});
