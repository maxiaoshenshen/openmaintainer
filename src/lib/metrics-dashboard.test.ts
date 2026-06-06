import { describe, it, expect } from "vitest";
import { MetricsDashboard } from "./metrics-dashboard";

describe("MetricsDashboard", () => {
  const dashboard = new MetricsDashboard();

  it("generates dashboard metrics", () => {
    const metrics = dashboard.generateDashboard([], [], { stars: 1000, forks: 100 });
    expect(metrics.overview.totalStars).toBe(1000);
    expect(metrics.overview.totalForks).toBe(100);
  });

  it("calculates issue close rate", () => {
    const metrics = dashboard.generateDashboard([
      { id: 1, number: 1, title: "Open", body: "", author: "a", state: "open", labels: [], comments: 0, createdAt: "", updatedAt: "", url: "" },
      { id: 2, number: 2, title: "Closed", body: "", author: "a", state: "closed", labels: [], comments: 0, createdAt: "", updatedAt: "", url: "" },
    ], [], { stars: 100, forks: 10 });

    expect(metrics.health.issueCloseRate).toBe(50);
  });

  it("calculates burnout risk", () => {
    const manyOpenIssues = Array(60).fill(null).map((_, i) => ({
      id: i, number: i, title: "Issue", body: "", author: "a", state: "open" as const,
      labels: [], comments: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), url: ""
    }));

    const metrics = dashboard.generateDashboard(manyOpenIssues, Array(25).fill(null).map((_, i) => ({
      id: i, number: i, title: "PR", body: "", author: "a", state: "merged" as const,
      labels: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), url: "",
      additions: 10, deletions: 2, changedFiles: 1
    })), { stars: 500, forks: 50 });

    expect(metrics.predictions.burnoutRisk).toBe("high");
  });

  it("generates markdown report", () => {
    const metrics = dashboard.generateDashboard([], [], { stars: 1000, forks: 100 });
    const md = dashboard.generateMarkdown(metrics);
    expect(md).toContain("Stars: 1000");
    expect(md).toContain("Forks: 100");
  });
});
