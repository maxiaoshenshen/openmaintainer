import { describe, it, expect } from "vitest";
import { summarizeItems, getPriorityItems } from "./ai-summarizer";

describe("AI Summarizer", () => {
  const mockIssues = [
    {
      id: "1",
      number: 1,
      title: "App crashes on startup",
      body: "Error: Cannot read property 'x' of undefined\nSteps to reproduce:\n1. Open app\n2. Click button",
      author: "user1",
      state: "open" as const,
      labels: ["bug", "critical"],
      comments: 0,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      url: "https://github.com/test/repo/issues/1"
    },
    {
      id: "2",
      number: 2,
      title: "Feature request: Dark mode",
      body: "Would be nice to have dark mode support",
      author: "user2",
      state: "open" as const,
      labels: ["enhancement"],
      comments: 2,
      createdAt: "2024-01-02",
      updatedAt: "2024-01-02",
      url: "https://github.com/test/repo/issues/2"
    }
  ];

  const mockPRs = [
    {
      id: "1",
      number: 101,
      title: "Fix login bug",
      body: "This PR fixes the login issue",
      author: "contributor1",
      state: "open" as const,
      status: "open" as const,
      reviewStatus: "pending" as const,
      labels: ["bug"],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      url: "https://github.com/test/repo/pull/101",
      commentCount: 1,
      additions: 20,
      deletions: 5,
      changedFiles: 2
    }
  ];

  it("summarizes issues correctly", () => {
    const result = summarizeItems(mockIssues, []);
    
    expect(result.totalCount).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].type).toBe("issue");
  });

  it("prioritizes by sentiment", () => {
    const result = summarizeItems(mockIssues, []);
    
    // First item should have negative or urgent sentiment
    expect(["negative", "urgent"]).toContain(result.items[0].sentiment);
  });

  it("categorizes issues correctly", () => {
    const result = summarizeItems(mockIssues, []);
    
    expect(result.categoryBreakdown).toHaveProperty("bug");
  });

  it("generates suggested labels", () => {
    const issuesWithNoLabels = [{
      id: "3",
      number: 3,
      title: "Help needed",
      body: "How do I use this?",
      author: "user3",
      state: "open" as const,
      labels: [],
      comments: 0,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      url: ""
    }];
    
    const result = summarizeItems(issuesWithNoLabels, []);
    
    // Items with no labels should get suggested labels
    expect(result.items[0].suggestedLabels).toContain("needs-triage");
  });

  it("summarizes PRs correctly", () => {
    const result = summarizeItems([], mockPRs);
    
    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("pr");
  });

  it("gets priority items with limit", () => {
    const result = getPriorityItems(mockIssues, mockPRs, 2);
    
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("marks items with no labels as needing action", () => {
    const issuesNoLabels = [{
      id: "3",
      number: 3,
      title: "Help needed",
      body: "How do I use this?",
      author: "user3",
      state: "open" as const,
      labels: [],
      comments: 0,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      url: ""
    }];
    
    const result = summarizeItems(issuesNoLabels, []);
    
    expect(result.items[0].actionNeeded).toBe(true);
  });

  it("calculates action required count", () => {
    const result = summarizeItems(mockIssues, mockPRs);
    
    expect(result.actionRequiredCount).toBeGreaterThan(0);
  });
});
