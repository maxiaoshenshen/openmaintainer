import { describe, it, expect } from "vitest";
import { 
  generateReplyTemplate, 
  generatePRReviewComment, 
  identifyStaleItems,
  generateDailyBriefing,
  generateBatchActions 
} from "./maintainer-assistant";

describe("Maintainer Assistant", () => {
  const mockIssue = {
    id: "1",
    number: 1,
    title: "Test bug",
    body: "Something is broken",
    author: "user1",
    state: "open" as const,
    labels: ["bug"],
    comments: 0,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    url: "https://github.com/test/repo/issues/1"
  };

  const mockPR = {
    id: "1",
    number: 101,
    title: "Test PR",
    body: "Test description",
    author: "contributor1",
    state: "open" as const,
    status: "open" as const,
    reviewStatus: "pending" as const,
    labels: [],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    url: "https://github.com/test/repo/pull/101",
    commentCount: 0,
    additions: 50,
    deletions: 10,
    changedFiles: 3
  };

  it("generates reply template for bug", () => {
    const template = generateReplyTemplate(mockIssue);
    expect(template).toContain("bug");
    expect(template).toContain("environment");
  });

  it("generates PR review comment", () => {
    const comment = generatePRReviewComment(mockPR);
    expect(comment).toContain("Files changed");
    expect(comment).toContain("3");
  });

  it("identifies stale items", () => {
    const oldIssue = { ...mockIssue, updatedAt: "2020-01-01" };
    const stale = identifyStaleItems([oldIssue], []);
    expect(stale.length).toBe(1);
    expect(stale[0].type).toBe("comment");
  });

  it("generates daily briefing", () => {
    const briefing = generateDailyBriefing({
      identity: { owner: "test", name: "repo", fullName: "test/repo", url: "" },
      description: "",
      stars: 100,
      forks: 10,
      watchers: 5,
      openIssues: 5,
      defaultBranch: "main",
      license: null,
      updatedAt: "",
      issues: [mockIssue],
      pullRequests: [mockPR]
    });
    
    expect(briefing.date).toBeDefined();
    expect(briefing.summary).toBeDefined();
    expect(Array.isArray(briefing.quickActions)).toBe(true);
  });

  it("generates batch actions for unlabeled items", () => {
    const unlabeledIssue = { ...mockIssue, labels: [] };
    const actions = generateBatchActions([unlabeledIssue], []);
    expect(actions.length).toBeGreaterThan(0);
  });
});
