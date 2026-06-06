import { describe, it, expect } from "vitest";
import { 
  generateExtendedDemoData,
  demoRepository,
  demoContributors,
  demoIssues,
  demoPullRequests
} from "./demo-data-extended";

describe("demo-data-extended", () => {
  describe("generateExtendedDemoData", () => {
    it("should generate all extended data modules", () => {
      const data = generateExtendedDemoData();

      expect(data.communityHealth).toBeDefined();
      expect(data.sprintPlan).toBeDefined();
      expect(data.performance).toBeDefined();
      expect(data.releasePlan).toBeDefined();
      expect(data.codeReview).toBeDefined();
      expect(data.onboarding).toBeDefined();
      expect(data.incidents).toBeDefined();
      expect(data.dependencies).toBeDefined();
      expect(data.licenses).toBeDefined();
    });

    it("should have valid community health metrics", () => {
      const data = generateExtendedDemoData();

      expect(data.communityHealth.metrics.length).toBe(5);
      expect(data.communityHealth.overallScore).toBeGreaterThan(0);
      expect(data.communityHealth.overallScore).toBeLessThanOrEqual(100);
    });

    it("should have sprint plan with current sprint", () => {
      const data = generateExtendedDemoData();

      expect(data.sprintPlan.currentSprint).toBeDefined();
      expect(data.sprintPlan.currentSprint.title).toBeTruthy();
      expect(data.sprintPlan.velocity).toBeGreaterThan(0);
    });

    it("should have performance metrics with alerts", () => {
      const data = generateExtendedDemoData();

      expect(data.performance.responseTime).toBeDefined();
      expect(data.performance.quality).toBeDefined();
      expect(data.performance.productivity).toBeDefined();
      expect(Array.isArray(data.performanceAlerts)).toBe(true);
    });

    it("should have code review with findings", () => {
      const data = generateExtendedDemoData();

      expect(data.codeReview.score).toBeGreaterThanOrEqual(0);
      expect(data.codeReview.findings.length).toBeGreaterThan(0);
      expect(data.codeReview.suggestions.length).toBeGreaterThan(0);
    });

    it("should have onboarding with checklist", () => {
      const data = generateExtendedDemoData();

      expect(data.onboarding.checklist.length).toBeGreaterThan(0);
      expect(data.onboarding.suggestedStartIssues.length).toBeGreaterThan(0);
      expect(data.onboarding.learningResources.length).toBeGreaterThan(0);
    });

    it("should have incidents with recommendations", () => {
      const data = generateExtendedDemoData();

      expect(Array.isArray(data.incidents.incidents)).toBe(true);
      expect(Array.isArray(data.incidents.recommendations)).toBe(true);
    });

    it("should have dependencies with risk score", () => {
      const data = generateExtendedDemoData();

      expect(data.dependencies.dependencies.length).toBeGreaterThan(0);
      expect(data.dependencies.riskScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe("demo data integrity", () => {
    it("should have valid repository", () => {
      expect(demoRepository.full_name).toBe("openmaintainer/open-maintainer");
      expect(demoRepository.language).toBe("TypeScript");
      expect(demoRepository.topics.length).toBeGreaterThan(0);
    });

    it("should have contributors", () => {
      expect(demoContributors.length).toBeGreaterThan(0);
      expect(demoContributors[0].contributions).toBeGreaterThan(0);
    });

    it("should have issues (open and closed)", () => {
      const openIssues = demoIssues.filter(i => i.state === "open");
      const closedIssues = demoIssues.filter(i => i.state === "closed");
      expect(openIssues.length).toBeGreaterThan(0);
      expect(closedIssues.length).toBeGreaterThan(0);
    });

    it("should have pull requests (open and merged)", () => {
      const openPRs = demoPullRequests.filter(p => p.state === "open");
      const mergedPRs = demoPullRequests.filter(p => p.merged);
      expect(openPRs.length).toBeGreaterThan(0);
      expect(mergedPRs.length).toBeGreaterThan(0);
    });
  });
});
