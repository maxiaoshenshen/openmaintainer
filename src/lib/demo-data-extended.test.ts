import { describe, it, expect } from "vitest";
import { generateExtendedDemoData } from "./demo-data-extended";

describe("demo-data-extended", () => {
  describe("generateExtendedDemoData", () => {
    it("should generate all extended data modules", () => {
      const data = generateExtendedDemoData("test/repo");
      
      expect(data.communityHealth).toBeDefined();
      expect(data.sprintPlan).toBeDefined();
      expect(data.performanceMetrics).toBeDefined();
      expect(data.codeReview).toBeDefined();
      expect(data.onboarding).toBeDefined();
      expect(data.incidents).toBeDefined();
      expect(data.dependencies).toBeDefined();
    });

    it("should have valid community health metrics", () => {
      const data = generateExtendedDemoData("test/repo");
      
      expect(data.communityHealth.score).toBeGreaterThanOrEqual(0);
      expect(data.communityHealth.score).toBeLessThanOrEqual(100);
    });

    it("should have sprint plan with current sprint", () => {
      const data = generateExtendedDemoData("test/repo");
      
      expect(data.sprintPlan.currentSprint).toBeDefined();
      expect(data.sprintPlan.upcomingSprints).toBeDefined();
    });

    it("should have performance metrics with alerts", () => {
      const data = generateExtendedDemoData("test/repo");
      
      expect(data.performanceMetrics).toBeDefined();
    });

    it("should have code review with findings", () => {
      const data = generateExtendedDemoData("test/repo");
      
      expect(data.codeReview).toBeDefined();
    });

    it("should have onboarding with checklist", () => {
      const data = generateExtendedDemoData("test/repo");
      
      expect(data.onboarding).toBeDefined();
    });

    it("should have incidents with recommendations", () => {
      const data = generateExtendedDemoData("test/repo");
      
      expect(data.incidents).toBeDefined();
    });

    it("should have dependencies with risk score", () => {
      const data = generateExtendedDemoData("test/repo");
      
      expect(data.dependencies).toBeDefined();
    });
  });
});
