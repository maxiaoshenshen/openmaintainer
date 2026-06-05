

export const demoRepository: MaintainerRepository = {
  identity: {
    owner: "openmaintainer",
    name: "demo-repo",
    fullName: "openmaintainer/demo-repo",
    url: "https://github.com/openmaintainer/demo-repo",
  },
  description:
    "A demo repository used to show how OpenMaintainer helps maintainers triage issues and review pull requests.",
  stars: 1284,
  forks: 96,
  watchers: 42,
  openIssues: 37,
  defaultBranch: "main",
  license: "MIT",
  updatedAt: "2026-05-30T10:15:00Z",
  issues: [
    {
      id: 1,
      number: 284,
      title: "Windows install fails when pnpm is not already available",
      body: "The setup script exits with command not found on Windows 11. I tried npm install and then pnpm dev, but pnpm is missing.",
      author: "first-time-contributor",
      labels: [],
      comments: 2,
      createdAt: "2026-05-29T12:30:00Z",
      updatedAt: "2026-05-30T08:01:00Z",
      url: "https://github.com/openmaintainer/demo-repo/issues/284",
    },
    {
      id: 2,
      number: 285,
      title: "Add Chinese README quickstart",
      body: "A short zh-CN quickstart would help independent developers understand the workflow faster.",
      author: "cn-maintainer",
      labels: ["good first issue"],
      comments: 4,
      createdAt: "2026-05-29T14:20:00Z",
      updatedAt: "2026-05-30T09:20:00Z",
      url: "https://github.com/openmaintainer/demo-repo/issues/285",
    },
    {
      id: 3,
      number: 286,
      title: "Question: can the triage model run without an API key?",
      body: "I want to use this in a public workshop without requiring every attendee to create credentials.",
      author: "workshop-host",
      labels: ["question"],
      comments: 1,
      createdAt: "2026-05-30T03:10:00Z",
      updatedAt: "2026-05-30T06:45:00Z",
      url: "https://github.com/openmaintainer/demo-repo/issues/286",
    },
    {
      id: 6,
      number: 287,
      title: "Install script fails on Windows when pnpm is missing",
      body: "Fresh Windows machine, Node 22 installed. Running npm run setup fails because pnpm is not recognized.",
      author: "windows-user",
      labels: [],
      comments: 1,
      createdAt: "2026-05-30T07:10:00Z",
      updatedAt: "2026-05-30T09:05:00Z",
      url: "https://github.com/openmaintainer/demo-repo/issues/287",
    },
  ],
  pullRequests: [
    {
      id: 4,
      number: 92,
      title: "Refactor GitHub adapter error handling",
      body: "This consolidates fetch errors and adds user-facing messages for rate limits and missing permissions.",
      author: "adapter-owner",
      additions: 214,
      deletions: 87,
      changedFiles: 6,
      labels: ["refactor"],
      createdAt: "2026-05-29T11:00:00Z",
      updatedAt: "2026-05-30T07:30:00Z",
      url: "https://github.com/openmaintainer/demo-repo/pull/92",
    },
    {
      id: 5,
      number: 93,
      title: "Add release notes generator",
      body: "Adds grouped release notes from merged pull requests and labeled issues.",
      author: "release-captain",
      additions: 128,
      deletions: 12,
      changedFiles: 3,
      labels: ["feature"],
      createdAt: "2026-05-30T04:00:00Z",
      updatedAt: "2026-05-30T09:40:00Z",
      url: "https://github.com/openmaintainer/demo-repo/pull/93",
    },
  ],
};

export const demoPreviousSnapshot: RepositoryAnalysisSnapshot = {
  capturedAt: "2026-05-25T00:00:00Z",
  healthScore: 68,
  readinessScore: 80,
  openIssues: 42,
  openPullRequests: 4,
  qualitySignals: [
    { id: "label-coverage", score: 25 },
    { id: "issue-response-gap", score: 40 },
    { id: "pr-age", score: 30 },
    { id: "review-load", score: 68 },
  ],
};

export const demoPortfolioRepositories: MaintainerRepository[] = [
  {
    ...demoRepository,
    identity: {
      owner: "openmaintainer",
      name: "urgent-sdk",
      fullName: "openmaintainer/urgent-sdk",
      url: "https://github.com/openmaintainer/urgent-sdk",
    },
    description:
      "A high-pressure SDK repository with aging pull requests, duplicate install reports, and a larger issue backlog.",
    openIssues: 82,
    license: null,
    issues: demoRepository.issues.map((issue) => ({
      ...issue,
      updatedAt: "2026-05-25T00:00:00Z",
    })),
    pullRequests: [
      ...demoRepository.pullRequests,
      {
        ...demoRepository.pullRequests[0],
        id: 50,
        number: 120,
        title: "Large auth refactor needs review",
        createdAt: "2026-05-20T00:00:00Z",
        changedFiles: 14,
        additions: 900,
        deletions: 240,
        url: "https://github.com/openmaintainer/urgent-sdk/pull/120",
      },
    ],
  },
  {
    ...demoRepository,
    identity: {
      owner: "openmaintainer",
      name: "docs-kit",
      fullName: "openmaintainer/docs-kit",
      url: "https://github.com/openmaintainer/docs-kit",
    },
    description: "A small docs helper with a calm maintainer queue.",
    openIssues: 4,
    issues: [],
    pullRequests: [],
  },
];


import type { MaintainerAnalysis } from "./types";

export function createDemoAnalysis(): MaintainerAnalysis {
  // Build a basic analysis from demo data
  const issues = demoRepository.issues.map(issue => ({
    id: String(issue.id),
    number: issue.number,
    title: issue.title,
    body: issue.body,
    author: issue.author,
    state: "open" as const,
    labels: issue.labels,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    url: issue.url,
    commentCount: issue.comments,
    assignees: [] as string[],
    milestone: null,
    pullRequest: null,
  }));

  const pullRequests = demoRepository.pullRequests.map(pr => ({
    id: String(pr.id),
    number: pr.number,
    title: pr.title,
    body: pr.body,
    author: pr.author,
    state: "open" as const,
    labels: pr.labels,
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
    url: pr.url,
    commentCount: 0,
    assignees: [] as string[],
    milestone: null,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changedFiles,
    headRef: "main",
    baseRef: "main",
    isDraft: false,
    mergeable: "mergeable" as const,
    reviewRequests: 0,
    comments: 0,
    commits: 0,
  }));

  return {
    repository: demoRepository,
    inbox: {
      items: [...issues, ...pullRequests],
      totalCount: issues.length + pullRequests.length,
      unreadCount: issues.filter(i => i.commentCount === 0).length,
      issues,
      pullRequests,
    },
    health: {
      score: demoPreviousSnapshot.healthScore,
      status: "watch" as const,
      qualitySignals: demoPreviousSnapshot.qualitySignals,
      nextActions: [],
      summary: "Demo analysis for testing",
    },
    readiness: {
      score: demoPreviousSnapshot.readinessScore,
      status: "needs-work" as const,
      blockers: [],
      summary: "Demo readiness analysis",
    },
    settings: {
      preferredLabels: ["bug", "enhancement", "good first issue"],
      autoAssign: false,
      triageMode: "ai-assist" as const,
    },
    previousSnapshot: demoPreviousSnapshot,
  };
}