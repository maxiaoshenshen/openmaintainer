import { describe, it, expect } from "vitest";
import { StaleIssueManager } from "./stale-issue-manager";

describe("StaleIssueManager", () => {
  const manager = new StaleIssueManager({ staleDays: 60, closeDays: 7 });

  const mockIssues = (daysAgo: number): any => ({
    id: 1, number: 1, title: "Test issue", body: "", author: "user1",
    state: "open", labels: [], comments: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://github.com/test/test/issues/1"
  });

  it("marks recent issues as fresh", () => {
    const issues = [mockIssues(30)];
    const result = manager.analyzeIssues(issues);
    expect(result[0].status).toBe("fresh");
  });

  it("marks old issues as stale", () => {
    const issues = [mockIssues(70)];
    const result = manager.analyzeIssues(issues);
    expect(result[0].status).toBe("stale");
  });

  it("exempts issues with security label", () => {
    const issue = mockIssues(100);
    issue.labels = ["security"];
    const result = manager.analyzeIssues([issue]);
    expect(result[0].status).toBe("fresh");
  });

  it("generates stale message", () => {
    const issue: any = mockIssues(65);
    issue.daysUntilClose = 2;
    const msg = manager.generateStaleMessage(issue);
    expect(msg).toContain("stale");
    expect(msg).toContain("2 days");
  });

  it("returns statistics", () => {
    const issues = [mockIssues(10), mockIssues(30), mockIssues(70), mockIssues(80)];
    const stats = manager.getStatistics(issues);
    expect(stats.total).toBe(4);
    expect(stats.stale).toBeGreaterThan(0);
    expect(stats.fresh).toBeGreaterThan(0);
  });
});
