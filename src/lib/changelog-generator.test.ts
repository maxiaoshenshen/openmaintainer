import { describe, it, expect } from "vitest";
import {
  parseCommit,
  parseCommits,
  groupByType,
  generateMarkdown,
  generateReleaseSummary,
  filterByType,
  getCommitStats,
  type Commit,
} from "./changelog-generator";

describe("ChangelogGenerator", () => {
  describe("parseCommit", () => {
    it("should parse conventional commit", () => {
      const result = parseCommit("feat(api): add new endpoint");
      expect(result.type).toBe("feat");
      expect(result.scope).toBe("api");
      expect(result.message).toBe("add new endpoint");
    });

    it("should parse commit with breaking change", () => {
      const result = parseCommit("feat!: breaking change");
      expect(result.breaking).toBe(true);
    });

    it("should handle non-conventional commits", () => {
      const result = parseCommit("update readme");
      expect(result.type).toBe("chore");
      expect(result.message).toBe("update readme");
    });
  });

  describe("parseCommits", () => {
    it("should parse multiple commits", () => {
      const lines = [
        "abc123 | feat: add feature",
        "def456 | fix: fix bug",
      ];
      const commits = parseCommits(lines);
      expect(commits.length).toBe(2);
      expect(commits[0].type).toBe("feat");
      expect(commits[1].type).toBe("fix");
    });
  });

  describe("groupByType", () => {
    it("should group commits by type", () => {
      const commits: Commit[] = [
        { hash: "1", message: "feat 1", author: "a", date: 1, type: "feat" },
        { hash: "2", message: "feat 2", author: "a", date: 1, type: "feat" },
        { hash: "3", message: "fix 1", author: "a", date: 1, type: "fix" },
      ];
      const groups = groupByType(commits);
      const featGroup = groups.find(g => g.type === "feat");
      const fixGroup = groups.find(g => g.type === "fix");
      expect(featGroup?.commits.length).toBe(2);
      expect(fixGroup?.commits.length).toBe(1);
    });
  });

  describe("generateMarkdown", () => {
    it("should generate changelog with sections", () => {
      const commits: Commit[] = [
        { hash: "abc123", message: "add login feature", author: "dev", date: 1, type: "feat" },
        { hash: "def456", message: "fix login bug", author: "dev", date: 1, type: "fix" },
      ];
      const changelog = generateMarkdown(commits);
      expect(changelog).toContain("##");
      expect(changelog).toContain("add login feature");
      expect(changelog).toContain("fix login bug");
    });

    it("should include commit hash when enabled", () => {
      const commits: Commit[] = [
        { hash: "abc123", message: "change", author: "a", date: 1, type: "fix" },
      ];
      const changelog = generateMarkdown(commits, { includeCommitHash: true });
      expect(changelog).toContain("`abc123`");
    });
  });

  describe("generateReleaseSummary", () => {
    it("should summarize release", () => {
      const commits: Commit[] = [
        { hash: "1", message: "f1", author: "a", date: 1, type: "feat" },
        { hash: "2", message: "f2", author: "a", date: 1, type: "feat" },
        { hash: "3", message: "fix1", author: "a", date: 1, type: "fix" },
      ];
      const summary = generateReleaseSummary(commits);
      expect(summary.featureCount).toBe(2);
      expect(summary.fixCount).toBe(1);
      expect(summary.summary).toContain("2 new features");
    });

    it("should count breaking changes", () => {
      const commits: Commit[] = [
        { hash: "1", message: "breaking", author: "a", date: 1, type: "feat", breaking: true },
      ];
      const summary = generateReleaseSummary(commits);
      expect(summary.breakingCount).toBe(1);
    });
  });

  describe("filterByType", () => {
    it("should filter commits by type", () => {
      const commits: Commit[] = [
        { hash: "1", message: "feat", author: "a", date: 1, type: "feat" },
        { hash: "2", message: "fix", author: "a", date: 1, type: "fix" },
        { hash: "3", message: "feat2", author: "a", date: 1, type: "feat" },
      ];
      const filtered = filterByType(commits, ["feat"]);
      expect(filtered.length).toBe(2);
    });
  });

  describe("getCommitStats", () => {
    it("should calculate statistics", () => {
      const commits: Commit[] = [
        { hash: "1", message: "f", author: "a", date: 1, type: "feat", scope: "api" },
        { hash: "2", message: "f", author: "b", date: 1, type: "feat", scope: "api" },
        { hash: "3", message: "f", author: "a", date: 1, type: "fix" },
      ];
      const stats = getCommitStats(commits);
      expect(stats.total).toBe(3);
      expect(stats.byType.feat).toBe(2);
      expect(stats.byType.fix).toBe(1);
      expect(stats.byAuthor.a).toBe(2);
      expect(stats.byAuthor.b).toBe(1);
      expect(stats.byScope.api).toBe(2);
    });
  });
});
