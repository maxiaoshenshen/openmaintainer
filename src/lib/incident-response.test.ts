import { describe, it, expect } from "vitest";
import {
  analyzeIncidents,
  getSeverityColor,
  getIncidentTypeIcon,
} from "./incident-response";
import type { Repository, Issue, PullRequest } from "./types";

describe("incident-response", () => {
  describe("analyzeIncidents", () => {
    it("should detect security incidents", () => {
      const repo = createMockRepo("owner/repo");
      const issues = [
        createMockIssue(1, "Security vulnerability in auth", "open", [
          "security",
        ]),
      ];
      const prs: PullRequest[] = [];

      const plan = analyzeIncidents(repo, issues, prs);

      expect(plan.incidents.length).toBeGreaterThan(0);
      expect(plan.incidents[0].type).toBe("security");
      expect(plan.incidents[0].severity).toBe("critical");
    });

    it("should detect bug incidents", () => {
      const repo = createMockRepo("owner/repo");
      const issues = [
        createMockIssue(1, "App crashes on startup", "open", ["bug"], 15),
      ];
      const prs: PullRequest[] = [];

      const plan = analyzeIncidents(repo, issues, prs);

      expect(plan.incidents.some((i) => i.type === "bug")).toBe(true);
    });

    it("should separate active and resolved incidents", () => {
      const repo = createMockRepo("owner/repo");
      const issues = [
        createMockIssue(1, "Open bug", "open", ["bug"]),
        createMockIssue(2, "Fixed bug", "closed", ["bug"]),
      ];
      const prs: PullRequest[] = [];

      const plan = analyzeIncidents(repo, issues, prs);

      expect(plan.activeIncidents.length).toBe(1);
      expect(plan.recentResolutions.length).toBe(1);
    });

    it("should generate recommendations", () => {
      const repo = createMockRepo("owner/repo");
      const issues = [
        createMockIssue(1, "Critical security issue", "open", ["security"]),
      ];
      const prs: PullRequest[] = [];

      const plan = analyzeIncidents(repo, issues, prs);

      expect(plan.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("getSeverityColor", () => {
    it("should return correct colors for each severity", () => {
      expect(getSeverityColor("critical")).toBe("text-red-600");
      expect(getSeverityColor("high")).toBe("text-orange-600");
      expect(getSeverityColor("medium")).toBe("text-yellow-600");
      expect(getSeverityColor("low")).toBe("text-blue-600");
    });
  });

  describe("getIncidentTypeIcon", () => {
    it("should return correct icons for each type", () => {
      expect(getIncidentTypeIcon("security")).toBe("🔒");
      expect(getIncidentTypeIcon("bug")).toBe("🐛");
      expect(getIncidentTypeIcon("regression")).toBe("↩️");
      expect(getIncidentTypeIcon("performance")).toBe("⚡");
      expect(getIncidentTypeIcon("outage")).toBe("🚨");
    });
  });
});

function createMockRepo(name: string): Repository {
  return {
    id: 1,
    name: name.split("/")[1],
    full_name: name,
    owner: { login: name.split("/")[0], id: 1, avatar_url: "", url: "" },
    description: "A test repository",
    html_url: `https://github.com/${name}`,
    stargazers_count: 100,
    forks_count: 20,
    open_issues_count: 10,
    watchers_count: 50,
    language: "TypeScript",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    topics: ["javascript"],
    has_wiki: true,
    homepage: "https://example.com",
    private: false,
    default_branch: "main",
  };
}

function createMockIssue(
  id: number,
  title: string,
  state: string,
  labels: string[],
  comments = 0
): Issue {
  return {
    id,
    number: id,
    title,
    body: "Test body",
    state: state as "open" | "closed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { login: "testuser", id: 1, avatar_url: "", url: "" },
    labels,
    assignees: [],
    comments,
    url: "",
  };
}
