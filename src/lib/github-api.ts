/**
 * GitHub API Client - Structured API for GitHub operations
 */

import { CacheManager } from "./cache-manager";

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  license: { key: string; name: string } | null;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  merged: boolean;
  mergeable: boolean | null;
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  draft: boolean;
  labels: { id: number; name: string; color: string }[];
  requested_reviewers: { login: string; avatar_url: string }[];
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  user: { login: string; avatar_url: string };
  labels: { id: number; name: string; color: string }[];
  assignees: { login: string; avatar_url: string }[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  comments: number;
}

export interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
  type: string;
}

export interface GitHubMetrics {
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  closedIssuesThisWeek: number;
  closedPRsThisWeek: number;
  averageMergeTime: number;
  activeContributors: number;
}

export class GitHubAPIClient {
  private baseUrl = "https://api.github.com";
  private token: string;
  private cache: CacheManager;
  private requestCount = 0;
  private lastReset = Date.now();

  constructor(config: GitHubConfig, cache: CacheManager) {
    this.token = config.token;
    this.cache = cache;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Simple rate limiting: 10 requests per second
    this.requestCount++;
    if (this.requestCount > 10) {
      const now = Date.now();
      if (now - this.lastReset < 1000) {
        await new Promise(r => setTimeout(r, 1000 - (now - this.lastReset)));
      }
      this.requestCount = 0;
      this.lastReset = Date.now();
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new GitHubAPIError(response.status, error.message || response.statusText, endpoint);
    }

    return response.json();
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const cacheKey = `repo:${owner}/${repo}`;
    const cached = this.cache.get<Repository>(cacheKey);
    if (cached) return cached;

    const data = await this.request<Repository>(`/repos/${owner}/${repo}`);
    this.cache.set(cacheKey, data, 300);
    return data;
  }

  async getPullRequests(owner: string, repo: string, state: "open" | "closed" | "all" = "open"): Promise<PullRequest[]> {
    const cacheKey = `prs:${owner}/${repo}:${state}`;
    const cached = this.cache.get<PullRequest[]>(cacheKey);
    if (cached) return cached;

    const data = await this.request<PullRequest[]>(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`);
    this.cache.set(cacheKey, data, 60);
    return data;
  }

  async getIssues(owner: string, repo: string, state: "open" | "closed" | "all" = "open"): Promise<Issue[]> {
    const cacheKey = `issues:${owner}/${repo}:${state}`;
    const cached = this.cache.get<Issue[]>(cacheKey);
    if (cached) return cached;

    const data = await this.request<Issue[]>(`/repos/${owner}/${repo}/issues?state=${state}&per_page=100`);
    this.cache.set(cacheKey, data, 60);
    return data;
  }

  async getContributors(owner: string, repo: string): Promise<Contributor[]> {
    const cacheKey = `contributors:${owner}/${repo}`;
    const cached = this.cache.get<Contributor[]>(cacheKey);
    if (cached) return cached;

    const data = await this.request<Contributor[]>(`/repos/${owner}/${repo}/contributors?per_page=100`);
    this.cache.set(cacheKey, data, 600);
    return data;
  }

  async getMetrics(owner: string, repo: string): Promise<GitHubMetrics> {
    const [repoData, openPRs, closedPRs, openIssues, closedIssues, contributors] = await Promise.all([
      this.getRepository(owner, repo),
      this.getPullRequests(owner, repo, "open"),
      this.getPullRequests(owner, repo, "closed"),
      this.getIssues(owner, repo, "open"),
      this.getIssues(owner, repo, "closed"),
      this.getContributors(owner, repo),
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const closedPRsThisWeek = closedPRs.filter((pr) => pr.merged_at && new Date(pr.merged_at) > oneWeekAgo);
    const closedIssuesThisWeek = closedIssues.filter((issue) => issue.closed_at && new Date(issue.closed_at) > oneWeekAgo);

    let totalMergeTime = 0;
    const mergedPRs = closedPRs.filter((pr) => pr.merged_at);
    for (const pr of mergedPRs) {
      const created = new Date(pr.created_at);
      const merged = new Date(pr.merged_at!);
      totalMergeTime += (merged.getTime() - created.getTime()) / (1000 * 60 * 60);
    }
    const averageMergeTime = mergedPRs.length > 0 ? totalMergeTime / mergedPRs.length : 0;

    return {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: openIssues.length,
      openPRs: openPRs.length,
      closedIssuesThisWeek: closedIssuesThisWeek.length,
      closedPRsThisWeek: closedPRsThisWeek.length,
      averageMergeTime: Math.round(averageMergeTime * 10) / 10,
      activeContributors: contributors.length,
    };
  }

  async createIssue(owner: string, repo: string, title: string, body: string, labels?: string[]): Promise<Issue> {
    return this.request<Issue>(`/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, labels }),
    });
  }

  async createPullRequest(owner: string, repo: string, title: string, head: string, base: string, body?: string): Promise<PullRequest> {
    return this.request<PullRequest>(`/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, head, base, body }),
    });
  }

  async addLabels(owner: string, repo: string, issueNumber: number, labels: string[]): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels }),
    });
  }

  async requestReview(owner: string, repo: string, prNumber: number, reviewers: string[]): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/requested_reviewers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewers }),
    });
  }

  async mergePullRequest(owner: string, repo: string, prNumber: number, method: "merge" | "squash" | "rebase" = "squash"): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merge_method: method }),
    });
  }

  async closeIssue(owner: string, repo: string, issueNumber: number): Promise<Issue> {
    return this.request<Issue>(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "closed" }),
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export class GitHubAPIError extends Error {
  constructor(
    public status: number,
    message: string,
    public endpoint: string
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }
}
