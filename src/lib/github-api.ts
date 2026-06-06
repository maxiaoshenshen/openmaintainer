// GitHub API Client for OpenMaintainer
// Provides real data integration with GitHub

import type { Repository, Contributor, PullRequest, Issue } from './types';

export interface GitHubConfig {
  token?: string;
  owner: string;
  repo: string;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export interface GitHubRepoData {
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  language: string;
  license: string;
  createdAt: string;
  updatedAt: string;
  lastRelease: string | null;
  topics: string[];
  defaultBranch: string;
}

export interface GitHubContributorData {
  login: string;
  avatarUrl: string;
  contributions: number;
  type: 'User' | 'Bot';
}

export interface GitHubIssueData {
  number: number;
  title: string;
  state: 'open' | 'closed';
  author: string;
  createdAt: string;
  updatedAt: string;
  labels: string[];
  comments: number;
  assignees: string[];
}

export interface GitHubPRData {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  labels: string[];
  additions: number;
  deletions: number;
  reviewers: string[];
  baseBranch: string;
  headBranch: string;
}

class GitHubAPIClient {
  private baseUrl = 'https://api.github.com';
  private token?: string;

  constructor(config?: { token?: string }) {
    this.token = config?.token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        const rateLimit = response.headers.get('X-RateLimit-Remaining');
        if (rateLimit === '0') {
          throw new Error('GitHub API rate limit exceeded. Please wait or use a token.');
        }
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRateLimit(): Promise<GitHubRateLimit> {
    return this.request<GitHubRateLimit>('/rate_limit');
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepoData> {
    const data = await this.request<any>(`/repos/${owner}/${repo}`);
    return {
      fullName: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      openPRs: 0,
      language: data.language,
      license: data.license?.spdx_id || 'Unknown',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastRelease: data.release?.tag_name || null,
      topics: data.topics || [],
      defaultBranch: data.default_branch,
    };
  }

  async getContributors(owner: string, repo: string): Promise<GitHubContributorData[]> {
    const data = await this.request<any[]>(`/repos/${owner}/${repo}/contributors`);
    return data.map((contributor) => ({
      login: contributor.login,
      avatarUrl: contributor.avatar_url,
      contributions: contributor.contributions,
      type: contributor.type,
    }));
  }

  async getIssues(owner: string, repo: string, options?: {
    state?: 'open' | 'closed' | 'all';
    perPage?: number;
    page?: number;
  }): Promise<GitHubIssueData[]> {
    const params = new URLSearchParams({
      state: options?.state || 'open',
      per_page: String(options?.perPage || 30),
      page: String(options?.page || 1),
      sort: 'updated',
      direction: 'desc',
    });

    const data = await this.request<any[]>(`/repos/${owner}/${repo}/issues?${params}`);
    return data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state as 'open' | 'closed',
        author: issue.user.login,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        labels: issue.labels.map((l: any) => l.name),
        comments: issue.comments,
        assignees: issue.assignees.map((a: any) => a.login),
      }));
  }

  async getPullRequests(owner: string, repo: string, options?: {
    state?: 'open' | 'closed' | 'all';
    perPage?: number;
    page?: number;
  }): Promise<GitHubPRData[]> {
    const params = new URLSearchParams({
      state: options?.state || 'open',
      per_page: String(options?.perPage || 30),
      page: String(options?.page || 1),
      sort: 'updated',
      direction: 'desc',
    });

    const data = await this.request<any[]>(`/repos/${owner}/${repo}/pulls?${params}`);
    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.merged_at ? 'merged' : pr.state as 'open' | 'closed',
      author: pr.user.login,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at,
      labels: pr.labels.map((l: any) => l.name),
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      reviewers: pr.requested_reviewers?.map((r: any) => r.login) || [],
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
    }));
  }

  async getReleases(owner: string, repo: string, perPage = 10): Promise<any[]> {
    return this.request<any[]>(`/repos/${owner}/${repo}/releases?per_page=${perPage}`);
  }

  async getCommits(owner: string, repo: string, options?: {
    since?: string;
    until?: string;
    perPage?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams({ per_page: String(options?.perPage || 100) });
    if (options?.since) params.set('since', options.since);
    if (options?.until) params.set('until', options.until);
    return this.request<any[]>(`/repos/${owner}/${repo}/commits?${params}`);
  }

  toRepository(data: GitHubRepoData, contributors: GitHubContributorData[]): Partial<Repository> {
    return {
      name: data.fullName.split('/')[1],
      owner: data.fullName.split('/')[0],
      stars: data.stars,
      forks: data.forks,
      openIssues: data.openIssues,
      language: data.language,
      description: data.description,
      license: data.license,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      topics: data.topics,
      defaultBranch: data.defaultBranch,
      contributors: contributors.map((c) => ({
        username: c.login,
        avatar: c.avatarUrl,
        contributions: c.contributions,
        joinedAt: new Date(),
      })),
    };
  }

  toPullRequests(prs: GitHubPRData[]): Partial<PullRequest>[] {
    return prs.map((pr) => ({
      number: pr.number,
      title: pr.title,
      author: pr.author,
      status: pr.state === 'open' ? 'open' : pr.state === 'merged' ? 'merged' : 'closed',
      createdAt: new Date(pr.createdAt),
      updatedAt: new Date(pr.updatedAt),
      additions: pr.additions,
      deletions: pr.deletions,
      reviewers: pr.reviewers,
      labels: pr.labels,
      baseBranch: pr.baseBranch,
      headBranch: pr.headBranch,
    }));
  }

  toIssues(issues: GitHubIssueData[]): Partial<Issue>[] {
    return issues.map((issue) => ({
      number: issue.number,
      title: issue.title,
      author: issue.author,
      status: issue.state === 'open' ? 'open' : 'closed',
      labels: issue.labels,
      assignees: issue.assignees,
      createdAt: new Date(issue.createdAt),
      updatedAt: new Date(issue.updatedAt),
      comments: issue.comments,
    }));
  }
}

let githubClient: GitHubAPIClient | null = null;

export function getGitHubClient(config?: { token?: string }): GitHubAPIClient {
  if (!githubClient) {
    githubClient = new GitHubAPIClient(config);
  }
  return githubClient;
}

export { GitHubAPIClient };
