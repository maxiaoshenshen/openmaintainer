import type { Repository, Contributor, Issue, PullRequest, MaintainerRepository } from "./types";
import { calculateHealthScore } from "./community-health";
import { createSprintPlan } from "./sprint-planning";
import { analyzePerformance, generateAlerts } from "./performance-monitor";
import { planRelease } from "./release-manager";
import { performCodeReview } from "./code-review-assistant";
import { generateOnboardingPath } from "./contributor-onboarding";
import { analyzeIncidents } from "./incident-response";
import { analyzeDependencies, analyzeLicenses } from "./dependency-tracker";

// Demo Repository - using MaintainerRepository format for compatibility
export const demoRepository: MaintainerRepository = {
  identity: {
    owner: "openmaintainer",
    name: "open-maintainer",
    fullName: "openmaintainer/open-maintainer",
    url: "https://github.com/openmaintainer/open-maintainer",
  },
  description: "AI-powered workbench for open source maintainers. Analyze repositories, manage contributors, and ship with confidence.",
  stars: 2847,
  forks: 423,
  openIssues: 47,
  openPRs: 12,
  language: "TypeScript",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2026-06-03T00:00:00Z",
  lastCommitDate: "2026-06-02T18:30:00Z",
  contributors: [
    { identity: { owner: "openmaintainer", name: "open-maintainer", fullName: "openmaintainer/open-maintainer", url: "" }, username: "sarah-dev", contributions: 127 },
    { identity: { owner: "openmaintainer", name: "open-maintainer", fullName: "openmaintainer/open-maintainer", url: "" }, username: "alex-code", contributions: 89 },
    { identity: { owner: "openmaintainer", name: "open-maintainer", fullName: "openmaintainer/open-maintainer", url: "" }, username: "maria-test", contributions: 64 },
  ],
  health: { score: 85, issues: [] },
  readiness: { score: 80, gaps: [] },
  qualitySignals: [],
  trend: { direction: "stable" as const, changes: [], qualitySignalChanges: [] },
};

// Demo Contributors - using Contributor type
export const demoContributors: Contributor[] = [
  { id: 1, username: "sarah-dev", avatarUrl: "https://avatars.githubusercontent.com/u/1", contributions: 127, type: "User" },
  { id: 2, username: "alex-code", avatarUrl: "https://avatars.githubusercontent.com/u/2", contributions: 89, type: "User" },
  { id: 3, username: "maria-test", avatarUrl: "https://avatars.githubusercontent.com/u/3", contributions: 64, type: "User" },
  { id: 4, username: "james-docs", avatarUrl: "https://avatars.githubusercontent.com/u/4", contributions: 45, type: "User" },
  { id: 5, username: "lisa-feature", avatarUrl: "https://avatars.githubusercontent.com/u/5", contributions: 38, type: "User" },
  { id: 6, username: "bob-fix", avatarUrl: "https://avatars.githubusercontent.com/u/6", contributions: 29, type: "User" },
  { id: 7, username: "emma-ci", avatarUrl: "https://avatars.githubusercontent.com/u/7", contributions: 22, type: "User" },
  { id: 8, username: "chris-ui", avatarUrl: "https://avatars.githubusercontent.com/u/8", contributions: 18, type: "User" },
  { id: 9, username: "newbie-first", avatarUrl: "https://avatars.githubusercontent.com/u/9", contributions: 5, type: "User" },
  { id: 10, username: "mentor-guide", avatarUrl: "https://avatars.githubusercontent.com/u/10", contributions: 156, type: "User" },
];

// Demo Issues - using Issue type
export const demoIssues: Issue[] = [
  {
    id: 1, number: 156, title: "Add support for GitHub Actions integration",
    body: "## Feature Request\nWe should add GitHub Actions support for automated testing...",
    state: "open", author: "community-user",
    labels: ["enhancement", "good first issue"],
    assignees: [],
    createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-02T14:30:00Z",
    url: ""
  },
  {
    id: 2, number: 155, title: "Performance issue with large repositories",
    body: "Loading time is slow for repos with 1000+ issues...",
    state: "open", author: "reporter-bug",
    labels: ["bug", "performance"],
    assignees: ["sarah-dev"],
    createdAt: "2026-05-28T08:00:00Z", updatedAt: "2026-06-01T16:00:00Z",
    url: ""
  },
  {
    id: 3, number: 154, title: "Documentation: API reference incomplete",
    body: "The API documentation needs more examples...",
    state: "open", author: "doc-seeker",
    labels: ["documentation"],
    assignees: ["james-docs"],
    createdAt: "2026-05-25T12:00:00Z", updatedAt: "2026-05-30T09:00:00Z",
    url: ""
  },
  {
    id: 4, number: 153, title: "Security: API token exposure in logs",
    body: "## Security Issue\nTokens are being logged in plaintext...",
    state: "closed", author: "security-researcher",
    labels: ["security", "critical"],
    assignees: ["sarah-dev"],
    createdAt: "2026-05-20T08:00:00Z", updatedAt: "2026-05-22T18:00:00Z",
    url: ""
  },
  {
    id: 5, number: 152, title: "Help wanted: Review migration guide",
    body: "Need help reviewing the v2 to v3 migration guide...",
    state: "open", author: "migrator-needs-help",
    labels: ["help wanted"],
    assignees: [],
    createdAt: "2026-05-18T14:00:00Z", updatedAt: "2026-05-20T10:00:00Z",
    url: ""
  },
];

// Demo Pull Requests - using PullRequest type
export const demoPullRequests: PullRequest[] = [
  {
    id: 1, number: 89, title: "feat: Add dark mode support",
    body: "## Changes\n- Added dark mode toggle\n- Persisted preference in localStorage\n- Updated all components for dark theme support",
    state: "open", status: "open", author: "chris-ui",
    labels: ["enhancement"],
    assignees: ["sarah-dev"],
    createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-02T15:00:00Z",
    url: "", additions: 850, deletions: 120, changedFiles: 28
  },
  {
    id: 2, number: 88, title: "fix: Resolve token exposure in logs",
    body: "## Fix\n- Sanitized all log statements\n- Added redaction utility\n- Updated tests",
    state: "merged", status: "merged", author: "sarah-dev",
    labels: ["bug", "security"],
    assignees: [],
    createdAt: "2026-05-20T08:00:00Z", updatedAt: "2026-05-22T18:00:00Z",
    url: "", additions: 45, deletions: 28, changedFiles: 5
  },
  {
    id: 3, number: 87, title: "docs: Complete API reference",
    body: "## Documentation\n- Added all endpoint documentation\n- Included request/response examples\n- Added TypeScript interfaces",
    state: "open", status: "open", author: "james-docs",
    labels: ["documentation"],
    assignees: [],
    createdAt: "2026-05-28T12:00:00Z", updatedAt: "2026-05-30T09:00:00Z",
    url: "", additions: 420, deletions: 15, changedFiles: 12
  },
  {
    id: 4, number: 86, title: "test: Add E2E tests for dashboard",
    body: "## Tests\n- Added Playwright E2E tests\n- Test coverage for main flows\n- CI integration",
    state: "merged", status: "merged", author: "maria-test",
    labels: ["testing"],
    assignees: [],
    createdAt: "2026-05-15T10:00:00Z", updatedAt: "2026-05-20T14:00:00Z",
    url: "", additions: 680, deletions: 0, changedFiles: 18
  },
];

// Generate extended demo data
export function generateExtendedDemoData(repoName?: string) {
  const communityHealth = calculateHealthScore({
    activity: {
      commitsThisWeek: 30,
      commitsLastWeek: 25,
      prsOpened: 10,
      prsMerged: 8,
      issuesOpened: 15,
      issuesClosed: 12,
      activeContributors: 5,
    },
    response: {
      avgIssueResponseTime: 12,
      avgPRReviewTime: 18,
      firstResponseRate: 95,
      followUpRate: 80,
    },
    community: {
      stars: demoRepository.stars,
      forks: demoRepository.forks,
      openIssues: demoRepository.openIssues,
      openPRs: demoRepository.openPRs,
      watchers: 200,
      subscribers: 100,
      trend: 15,
    },
    daysSinceLastRelease: 14,
  });
  const sprintPlan = createSprintPlan(demoRepository, demoIssues, demoPullRequests, demoContributors);
  const performance = analyzePerformance(demoRepository, demoIssues, demoPullRequests);
  const performanceAlerts = generateAlerts(performance);
  const releasePlan = planRelease(demoRepository, demoPullRequests, demoIssues, "1.2.0");
  const codeReview = performCodeReview({ pr: demoPullRequests[0], repo: demoRepository, reviewer: demoContributors[0] });
  const onboarding = generateOnboardingPath(demoRepository, demoIssues, demoContributors);
  const incidents = analyzeIncidents(demoRepository, demoIssues, demoPullRequests);
  const dependencies = analyzeDependencies(demoRepository);
  const licenses = analyzeLicenses(demoRepository);

  return {
    communityHealth,
    sprintPlan,
    performanceMetrics: { ...performance, alerts: performanceAlerts },
    codeReview,
    onboarding,
    incidents,
    dependencies,
    licenses,
  };
}
