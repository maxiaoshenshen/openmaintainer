import { describe, it, expect } from "vitest";
import {
  parseIssue,
  detectIssueType,
  detectPriority,
  suggestIssueTitle,
  searchIssues,
  sortIssues,
  createStandardTemplates,
  calculateIssueStats,
  suggestLabels,
  type Issue,
} from "./issue-manager";

describe("IssueManager", () => {
  describe("parseIssue", () => {
    it("should parse GitHub API issue format", () => {
      const data = {
        id: 123,
        number: 42,
        title: "Bug: Something broken",
        body: "Description here",
        user: { login: "developer" },
        state: "open",
        labels: [{ name: "bug" }],
        assignees: [{ login: "dev1" }],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
        comments: 5,
        reactions: { "+1": 10, "-1": 1, heart: 3, rocket: 2 },
      };
      
      const issue = parseIssue(data);
      
      expect(issue.id).toBe("123");
      expect(issue.number).toBe(42);
      expect(issue.title).toBe("Bug: Something broken");
      expect(issue.author).toBe("developer");
      expect(issue.state).toBe("open");
      expect(issue.labels).toContain("bug");
      expect(issue.assignees).toContain("dev1");
    });

    it("should handle closed issues", () => {
      const data = {
        number: 1,
        title: "Closed issue",
        state: "closed",
        closed_at: "2024-01-03T00:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };
      
      const issue = parseIssue(data);
      expect(issue.state).toBe("closed");
      expect(issue.closedAt).toBeDefined();
    });
  });

  describe("detectIssueType", () => {
    it("should detect bug issues", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "Bug in login", body: "It crashes", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
      };
      expect(detectIssueType(issue)).toBe("bug");
    });

    it("should detect feature requests", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "Feature request", body: "Would be nice to have", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
      };
      expect(detectIssueType(issue)).toBe("feature");
    });

    it("should detect questions", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "How to use?", body: "Question about API", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
      };
      expect(detectIssueType(issue)).toBe("question");
    });

    it("should return null for unrecognized types", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "Random title", body: "Some content", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
      };
      expect(detectIssueType(issue)).toBeNull();
    });
  });

  describe("detectPriority", () => {
    it("should detect critical priority", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "Critical bug", body: "Production is down!", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
      };
      expect(detectPriority(issue)).toBe("critical");
    });

    it("should detect priority from reactions", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "Issue", body: "Content", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
        reactions: { "+1": 15 },
      };
      expect(detectPriority(issue)).toBe("high");
    });

    it("should default to medium priority", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "Issue", body: "Content", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
      };
      expect(detectPriority(issue)).toBe("medium");
    });
  });

  describe("suggestIssueTitle", () => {
    it("should suggest titles for bug", () => {
      const title = suggestIssueTitle("bug", "login form not working properly");
      expect(title).toContain("Bug:");
    });

    it("should suggest titles for feature", () => {
      const title = suggestIssueTitle("feature", "dark mode support");
      expect(title).toContain("Feature:");
    });
  });

  describe("searchIssues", () => {
    const issues: Issue[] = [
      { id: "1", number: 1, title: "Bug 1", body: "", author: "a", state: "open", labels: ["bug"], assignees: ["dev1"], createdAt: 1, updatedAt: 1, comments: 0 },
      { id: "2", number: 2, title: "Feature 1", body: "", author: "b", state: "open", labels: ["enhancement"], assignees: [], createdAt: 2, updatedAt: 2, comments: 0 },
      { id: "3", number: 3, title: "Bug 2", body: "", author: "a", state: "closed", labels: ["bug"], assignees: [], createdAt: 3, updatedAt: 3, comments: 0 },
    ];

    it("should filter by state", () => {
      const result = searchIssues(issues, { state: "open" });
      expect(result.length).toBe(2);
    });

    it("should filter by author", () => {
      const result = searchIssues(issues, { author: "a" });
      expect(result.length).toBe(2);
    });

    it("should filter for unassigned", () => {
      const result = searchIssues(issues, { noAssignee: true });
      expect(result.length).toBe(2);
    });

    it("should combine multiple filters", () => {
      const result = searchIssues(issues, { state: "open", author: "a" });
      expect(result.length).toBe(1);
      expect(result[0].number).toBe(1);
    });
  });

  describe("sortIssues", () => {
    const issues: Issue[] = [
      { id: "1", number: 1, title: "Old", body: "", author: "a", state: "open", labels: [], assignees: [], createdAt: 1000, updatedAt: 1000, comments: 5 },
      { id: "2", number: 2, title: "New", body: "", author: "a", state: "open", labels: [], assignees: [], createdAt: 2000, updatedAt: 2000, comments: 10 },
    ];

    it("should sort by created date", () => {
      const sorted = sortIssues(issues, "created");
      expect(sorted[0].number).toBe(2);
    });

    it("should sort by comments", () => {
      const sorted = sortIssues(issues, "comments");
      expect(sorted[0].comments).toBe(10);
    });
  });

  describe("createStandardTemplates", () => {
    it("should create bug report template", () => {
      const templates = createStandardTemplates();
      const bugTemplate = templates.find(t => t.name === "Bug Report");
      expect(bugTemplate).toBeDefined();
      expect(bugTemplate?.labels).toContain("bug");
      expect(bugTemplate?.body).toContain("## Bug Description");
    });

    it("should create feature request template", () => {
      const templates = createStandardTemplates();
      const featureTemplate = templates.find(t => t.name === "Feature Request");
      expect(featureTemplate).toBeDefined();
      expect(featureTemplate?.labels).toContain("enhancement");
    });
  });

  describe("calculateIssueStats", () => {
    it("should calculate basic statistics", () => {
      const issues: Issue[] = [
        { id: "1", number: 1, title: "Bug", body: "", author: "a", state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0 },
        { id: "2", number: 2, title: "Feature", body: "", author: "b", state: "closed", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0 },
      ];
      
      const stats = calculateIssueStats(issues);
      expect(stats.total).toBe(2);
      expect(stats.open).toBe(1);
      expect(stats.closed).toBe(1);
    });

    it("should count unassigned issues", () => {
      const issues: Issue[] = [
        { id: "1", number: 1, title: "", body: "", author: "a", state: "open", labels: [], assignees: ["dev1"], createdAt: 1, updatedAt: 1, comments: 0 },
        { id: "2", number: 2, title: "", body: "", author: "b", state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0 },
      ];
      
      const stats = calculateIssueStats(issues);
      expect(stats.unassigned).toBe(1);
    });
  });

  describe("suggestLabels", () => {
    it("should suggest bug label", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "Bug in code", body: "Something crashes", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
      };
      const labels = suggestLabels(issue);
      expect(labels).toContain("bug");
    });

    it("should suggest security label", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "Security vulnerability", body: "SQL injection possible", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
      };
      const labels = suggestLabels(issue);
      expect(labels).toContain("security");
    });

    it("should suggest platform labels", () => {
      const issue: Issue = {
        id: "1", number: 1, title: "Windows issue", body: "Only happens on Windows", author: "a",
        state: "open", labels: [], assignees: [], createdAt: 1, updatedAt: 1, comments: 0,
      };
      const labels = suggestLabels(issue);
      expect(labels).toContain("windows");
    });
  });
});
