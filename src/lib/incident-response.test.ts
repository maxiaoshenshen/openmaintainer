import { describe, it, expect } from "vitest";
import {
  analyzeIncidents,
  getSeverityColor,
  getIncidentTypeIcon,
} from "./incident-response";
import type { MaintainerRepository, MaintainerIssue, MaintainerPullRequest } from "./types";

describe("incident-response", () => {
  describe("analyzeIncidents", () => {
    it("should detect security incidents", () => {
      const repo = createMockRepo("owner/repo");
      const issues = [
        createMockIssue(1, "Security vulnerability in auth", "open", [
          "security",
        ]),
      ];
      const prs: MaintainerPullRequest[] = [];

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
      const prs: MaintainerPullRequest[] = [];

      const plan = analyzeIncidents(repo, issues, prs);

      expect(plan.incidents.some((i) => i.type === "bug")).toBe(true);
    });

    it("should separate active and resolved incidents", () => {
      const repo = createMockRepo("owner/repo");
      const issues = [
        createMockIssue(1, "Open bug", "open", ["bug"]),
        createMockIssue(2, "Fixed bug", "closed", ["bug"]),
      ];
      const prs: MaintainerPullRequest[] = [];

      const plan = analyzeIncidents(repo, issues, prs);

      expect(plan.activeIncidents.length).toBe(1);
      expect(plan.recentResolutions.length).toBe(1);
    });

    it("should generate recommendations", () => {
      const repo = createMockRepo("owner/repo");
      const issues = [
        createMockIssue(1, "Critical security issue", "open", ["security"]),
      ];
      const prs: MaintainerPullRequest[] = [];

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

function createMockRepo(name: string): MaintainerRepository {
  const parts = name.split("/");
  return {
    identity: {
      owner: parts[0],
      name: parts[1],
      fullName: name,
      url: `https://github.com/${name}`,
    },
    description: "A test repository",
    stars: 100,
    forks: 20,
    watchers: 50,
    openIssues: 10,
    defaultBranch: "main",
    license: "MIT",
    updatedAt: new Date().toISOString(),
    issues: [],
    pullRequests: [],
    contributors: [],
  };
}

function createMockIssue(
  id: number,
  title: string,
  state: string,
  labels: string[],
  comments = 0
): MaintainerIssue {
  return {
    id,
    number: id,
    title,
    body: "Test body",
    author: "testuser",
    labels,
    comments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: `https://github.com/owner/repo/issues/${id}`,
    state: state as "open" | "closed",
  };
}
