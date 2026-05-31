import { demoRepository } from "./demo-data";
import type {
  MaintainerIssue,
  MaintainerPullRequest,
  MaintainerRepository,
  RepositoryIdentity,
} from "./types";

const GITHUB_API = "https://api.github.com";

type GitHubRepositoryResponse = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  default_branch: string;
  license: { spdx_id: string; name: string } | null;
  updated_at: string;
};

type GitHubIssueResponse = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  user: { login: string } | null;
  labels: Array<string | { name?: string | null }>;
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  pull_request?: unknown;
};

type GitHubPullRequestResponse = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  user: { login: string } | null;
  additions: number;
  deletions: number;
  changed_files: number;
  labels?: Array<string | { name?: string | null }>;
  created_at: string;
  updated_at: string;
  html_url: string;
};

export function parseRepositoryInput(input: string): RepositoryIdentity {
  const trimmed = input.trim().replace(/\.git$/, "");
  const shorthand = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  const url = trimmed.match(/^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/.*)?$/);
  const match = shorthand ?? url;

  if (!match) {
    throw new Error("Enter a GitHub repository as owner/name or https://github.com/owner/name");
  }

  const owner = match[1];
  const name = match[2];

  return {
    owner,
    name,
    fullName: `${owner}/${name}`,
    url: `https://github.com/${owner}/${name}`,
  };
}

function headers() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: headers(),
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function labelNames(labels: Array<string | { name?: string | null }> = []) {
  return labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter((label): label is string => Boolean(label));
}

function toIssue(issue: GitHubIssueResponse): MaintainerIssue {
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    author: issue.user?.login ?? "unknown",
    labels: labelNames(issue.labels),
    comments: issue.comments,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    url: issue.html_url,
  };
}

function toPullRequest(pullRequest: GitHubPullRequestResponse): MaintainerPullRequest {
  return {
    id: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    body: pullRequest.body ?? "",
    author: pullRequest.user?.login ?? "unknown",
    additions: pullRequest.additions,
    deletions: pullRequest.deletions,
    changedFiles: pullRequest.changed_files,
    labels: labelNames(pullRequest.labels ?? []),
    createdAt: pullRequest.created_at,
    updatedAt: pullRequest.updated_at,
    url: pullRequest.html_url,
  };
}

export async function fetchMaintainerRepository(input: string): Promise<MaintainerRepository> {
  const identity = parseRepositoryInput(input);
  const [repo, issues, pullRequests] = await Promise.all([
    githubFetch<GitHubRepositoryResponse>(`/repos/${identity.owner}/${identity.name}`),
    githubFetch<GitHubIssueResponse[]>(
      `/repos/${identity.owner}/${identity.name}/issues?state=open&per_page=12&sort=updated`,
    ),
    githubFetch<GitHubPullRequestResponse[]>(
      `/repos/${identity.owner}/${identity.name}/pulls?state=open&per_page=8&sort=updated`,
    ),
  ]);

  return {
    identity,
    description: repo.description ?? "",
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.watchers_count,
    openIssues: repo.open_issues_count,
    defaultBranch: repo.default_branch,
    license: repo.license?.spdx_id ?? repo.license?.name ?? null,
    updatedAt: repo.updated_at,
    issues: issues.filter((issue) => !issue.pull_request).map(toIssue),
    pullRequests: pullRequests.map(toPullRequest),
  };
}

export async function getRepositoryOrDemo(input?: string | null) {
  if (!input || input.trim().toLowerCase() === "demo") {
    return { repository: demoRepository, source: "demo" as const };
  }

  try {
    return { repository: await fetchMaintainerRepository(input), source: "github" as const };
  } catch (error) {
    return {
      repository: demoRepository,
      source: "demo" as const,
      warning: error instanceof Error ? error.message : "Unable to fetch repository",
    };
  }
}
