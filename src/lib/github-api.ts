import type { Repository, PullRequest, Issue, Contributor, Comment, RepositoryIdentity } from "./types";

export async function getRepository(owner: string, repo: string): Promise<Repository> {
  return {
    id: 1,
    name: repo,
    fullName: `${owner}/${repo}`,
    description: `Repository: ${owner}/${repo}`,
    stars: Math.floor(Math.random() * 10000),
    forks: Math.floor(Math.random() * 1000),
    openIssues: Math.floor(Math.random() * 100),
    openPRs: Math.floor(Math.random() * 20),
    language: 'TypeScript',
    license: 'MIT',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    url: `https://github.com/${owner}/${repo}`,
  };
}

export async function getRepositoryIdentity(owner: string, repo: string): Promise<RepositoryIdentity> {
  return {
    owner,
    name: repo,
    fullName: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
  };
}

export async function getPullRequests(
  owner: string,
  repo: string,
  options: { state?: 'open' | 'closed' | 'all' } = {}
): Promise<PullRequest[]> {
  const prs: PullRequest[] = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `Feature: ${['Add new feature', 'Fix bug', 'Improve performance', 'Update docs', 'Refactor code'][i]}`,
    body: `PR description for #${i + 1}`,
    state: i === 0 ? 'open' : (i > 2 ? 'merged' : 'closed'),
    author: `author-${i}`,
    additions: Math.floor(Math.random() * 500),
    deletions: Math.floor(Math.random() * 200),
    changedFiles: Math.floor(Math.random() * 10) + 1,
    labels: [],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
    mergedAt: i > 2 ? new Date(Date.now() - i * 21600000).toISOString() : undefined,
    url: `https://github.com/${owner}/${repo}/pull/${i + 1}`,
  }));
  
  if (options.state === 'open') return prs.filter(p => p.state === 'open');
  if (options.state === 'closed') return prs.filter(p => p.state === 'closed' || p.state === 'merged');
  return prs;
}

export async function getPullRequest(owner: string, repo: string, number: number): Promise<PullRequest> {
  const prs = await getPullRequests(owner, repo);
  return prs.find(p => p.number === number) || prs[0];
}

export async function getIssues(
  owner: string,
  repo: string,
  options: { state?: 'open' | 'closed'; labels?: string } = {}
): Promise<Issue[]> {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `Issue #${i + 1}: ${['Bug report', 'Feature request', 'Question', 'Documentation', 'Enhancement', 'Help wanted', 'Good first issue', 'Performance', 'Security', 'UI improvement'][i]}`,
    body: `Issue description for #${i + 1}`,
    author: `user-${i}`,
    state: i < 7 ? 'open' : 'closed',
    labels: i % 3 === 0 ? ['bug'] : i % 3 === 1 ? ['enhancement'] : ['question'],
    comments: Math.floor(Math.random() * 20),
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
    url: `https://github.com/${owner}/${repo}/issues/${i + 1}`,
  }));
}

export async function getIssue(owner: string, repo: string, number: number): Promise<Issue> {
  const issues = await getIssues(owner, repo);
  return issues.find(i => i.number === number) || issues[0];
}

export async function getComments(owner: string, repo: string, issueNumber: number): Promise<Comment[]> {
  return Array.from({ length: 3 }, (_, i) => ({
    id: `comment-${issueNumber}-${i}`,
    body: `This is comment ${i + 1} on issue #${issueNumber}`,
    user: { login: `commenter-${i}` },
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

export async function getContributors(owner: string, repo: string): Promise<Contributor[]> {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `user-${i + 1}`,
    login: `contributor-${i + 1}`,
    contributions: (10 - i) * 10,
    avatarUrl: `https://avatars.githubusercontent.com/u/${i + 1}`,
    url: `https://github.com/contributor-${i + 1}`,
  }));
}

export async function getLabels(owner: string, repo: string): Promise<{ name: string; color: string; description?: string }[]> {
  return [
    { name: 'bug', color: 'd73a4a', description: 'Something is not working' },
    { name: 'enhancement', color: 'a2eeef', description: 'New feature or request' },
    { name: 'documentation', color: '0075ca', description: 'Improvements to the docs' },
    { name: 'good first issue', color: '7057ff', description: 'Good for newcomers' },
    { name: 'help wanted', color: '008672', description: 'Extra attention is needed' },
  ];
}

export async function getBranches(owner: string, repo: string): Promise<{ name: string; protected: boolean }[]> {
  return [
    { name: 'main', protected: true },
    { name: 'develop', protected: false },
    { name: 'feature/new-feature', protected: false },
  ];
}
