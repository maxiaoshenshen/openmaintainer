import { describe, it, expect } from "vitest";
import { HealthChecker } from "./health-checker";

describe("HealthChecker", () => {
  it("creates a health checker instance", () => {
    const checker = new HealthChecker();
    expect(checker).toBeDefined();
  });

  it("runs all checks with timeout", async () => {
    const checker = new HealthChecker();
    const report = await checker.runAllChecks();
    expect(report).toBeDefined();
    expect(report.checks).toBeDefined();
  }, 10000);
});
