import { describe, it, expect, beforeEach, vi } from "vitest";
import { GitHubAPIClient, GitHubAPIError } from "./github-api";
import { CacheManager } from "./cache-manager";

describe("GitHubAPIClient", () => {
  let client: GitHubAPIClient;
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({ maxSize: 100 });
    client = new GitHubAPIClient(
      { token: "test-token", owner: "test-owner", repo: "test-repo" },
      cache
    );
    global.fetch = vi.fn();
  });

  describe("getRepository", () => {
    it("should fetch repository data", async () => {
      const mockRepo = {
        id: 123, name: "test-repo", full_name: "test-owner/test-repo",
        description: "Test repository", private: false, fork: false,
        url: "https://github.com/test-owner/test-repo", stargazers_count: 100,
        forks_count: 50, open_issues_count: 10, watchers_count: 100,
        language: "TypeScript", default_branch: "main",
        created_at: "2024-01-01", updated_at: "2024-06-01", pushed_at: "2024-06-15",
        topics: ["typescript"], license: { key: "mit", name: "MIT" },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, json: () => Promise.resolve(mockRepo),
      });

      const repo = await client.getRepository("test-owner", "test-repo");
      expect(repo.name).toBe("test-repo");
      expect(repo.stargazers_count).toBe(100);
    });

    it("should use cache for subsequent requests", async () => {
      const mockRepo = {
        id: 123, name: "test-repo", full_name: "test-owner/test-repo",
        description: "Test", private: false, fork: false,
        url: "https://github.com/test/test", stargazers_count: 100,
        forks_count: 50, open_issues_count: 10, watchers_count: 100,
        language: "TypeScript", default_branch: "main",
        created_at: "2024-01-01", updated_at: "2024-06-01", pushed_at: "2024-06-15",
        topics: [], license: null,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, json: () => Promise.resolve(mockRepo),
      });

      await client.getRepository("test-owner", "test-repo");
      await client.getRepository("test-owner", "test-repo");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw GitHubAPIError on failure", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false, status: 404, json: () => Promise.resolve({ message: "Not Found" }),
      });

      await expect(client.getRepository("nonexistent", "repo")).rejects.toThrow(GitHubAPIError);
    });
  });

  describe("getPullRequests", () => {
    it("should fetch open pull requests", async () => {
      const mockPRs = [{
        id: 1, number: 1, title: "Test PR", body: "Description",
        state: "open", merged: false, mergeable: true,
        user: { login: "user1", avatar_url: "https://avatar.com/1" },
        created_at: "2024-06-01", updated_at: "2024-06-15", closed_at: null, merged_at: null,
        draft: false, labels: [], requested_reviewers: [],
        head: { ref: "feature", sha: "abc123" }, base: { ref: "main", sha: "def456" },
      }];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, json: () => Promise.resolve(mockPRs),
      });

      const prs = await client.getPullRequests("test-owner", "test-repo", "open");
      expect(prs).toHaveLength(1);
      expect(prs[0].title).toBe("Test PR");
    });
  });

  describe("getIssues", () => {
    it("should fetch issues", async () => {
      const mockIssues = [{
        id: 1, number: 1, title: "Bug issue", body: "Bug description",
        state: "open", user: { login: "user1", avatar_url: "https://avatar.com/1" },
        labels: [{ id: 1, name: "bug", color: "ff0000" }],
        assignees: [], created_at: "2024-06-01", updated_at: "2024-06-15",
        closed_at: null, comments: 5,
      }];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, json: () => Promise.resolve(mockIssues),
      });

      const issues = await client.getIssues("test-owner", "test-repo", "open");
      expect(issues).toHaveLength(1);
      expect(issues[0].labels[0].name).toBe("bug");
    });
  });

  describe("getContributors", () => {
    it("should fetch contributors", async () => {
      const mockContributors = [
        { login: "contributor1", avatar_url: "https://avatar.com/1", contributions: 100, type: "User" },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, json: () => Promise.resolve(mockContributors),
      });

      const contributors = await client.getContributors("test-owner", "test-repo");
      expect(contributors).toHaveLength(1);
      expect(contributors[0].contributions).toBe(100);
    });
  });

  describe("createIssue", () => {
    it("should create a new issue", async () => {
      const mockIssue = {
        id: 999, number: 42, title: "New Issue", body: "Issue body",
        state: "open", user: { login: "test-owner", avatar_url: "https://avatar.com/1" },
        labels: [], assignees: [], created_at: "2024-06-15", updated_at: "2024-06-15",
        closed_at: null, comments: 0,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, json: () => Promise.resolve(mockIssue),
      });

      const issue = await client.createIssue("test-owner", "test-repo", "New Issue", "Issue body");
      expect(issue.number).toBe(42);
    });
  });

  describe("GitHubAPIError", () => {
    it("should have correct properties", () => {
      const error = new GitHubAPIError(404, "Not Found", "/repos/owner/repo");
      expect(error.status).toBe(404);
      expect(error.message).toBe("Not Found");
      expect(error.endpoint).toBe("/repos/owner/repo");
    });
  });
});
