import type { Repository, Contributor, Issue, PullRequest } from "./types";
import { analyzeCommunityHealth } from "./community-health";
import { createSprintPlan } from "./sprint-planning";
import { analyzePerformance, generateAlerts } from "./performance-monitor";
import { planRelease } from "./release-manager";
import { performCodeReview } from "./code-review-assistant";
import { generateOnboardingPath } from "./contributor-onboarding";
import { analyzeIncidents } from "./incident-response";
import { analyzeDependencies, analyzeLicenses } from "./dependency-tracker";

// Demo Repository
export const demoRepository: Repository = {
  id: 77427333,
  name: "open-maintainer",
  full_name: "openmaintainer/open-maintainer",
  owner: { login: "openmaintainer", id: 123456, avatar_url: "https://avatars.githubusercontent.com/u/123456", url: "" },
  description: "AI-powered workbench for open source maintainers. Analyze repositories, manage contributors, and ship with confidence.",
  html_url: "https://github.com/openmaintainer/open-maintainer",
  stargazers_count: 2847,
  forks_count: 423,
  open_issues_count: 47,
  watchers_count: 156,
  language: "TypeScript",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2026-06-03T00:00:00Z",
  pushed_at: "2026-06-02T18:30:00Z",
  topics: ["open-source", "maintainer-tools", "github", "typescript", "react", "ai"],
  has_wiki: true,
  homepage: "https://openmaintainer.vercel.app",
  private: false,
  default_branch: "main",
};

// Demo Contributors
export const demoContributors: Contributor[] = [
  { login: "sarah-dev", id: 1, avatar_url: "https://avatars.githubusercontent.com/u/1", url: "", contributions: 127 },
  { login: "alex-code", id: 2, avatar_url: "https://avatars.githubusercontent.com/u/2", url: "", contributions: 89 },
  { login: "maria-test", id: 3, avatar_url: "https://avatars.githubusercontent.com/u/3", url: "", contributions: 64 },
  { login: "james-docs", id: 4, avatar_url: "https://avatars.githubusercontent.com/u/4", url: "", contributions: 45 },
  { login: "lisa-feature", id: 5, avatar_url: "https://avatars.githubusercontent.com/u/5", url: "", contributions: 38 },
  { login: "bob-fix", id: 6, avatar_url: "https://avatars.githubusercontent.com/u/6", url: "", contributions: 29 },
  { login: "emma-ci", id: 7, avatar_url: "https://avatars.githubusercontent.com/u/7", url: "", contributions: 22 },
  { login: "chris-ui", id: 8, avatar_url: "https://avatars.githubusercontent.com/u/8", url: "", contributions: 18 },
  { login: "newbie-first", id: 9, avatar_url: "https://avatars.githubusercontent.com/u/9", url: "", contributions: 5 },
  { login: "mentor-guide", id: 10, avatar_url: "https://avatars.githubusercontent.com/u/10", url: "", contributions: 156 },
];

// Demo Issues
export const demoIssues: Issue[] = [
  {
    id: 1, number: 156, title: "Add support for GitHub Actions integration",
    body: "## Feature Request\nWe should add GitHub Actions support for automated testing...", state: "open",
    created_at: "2026-06-01T10:00:00Z", updated_at: "2026-06-02T14:30:00Z",
    user: { login: "community-user", id: 11, avatar_url: "", url: "" },
    labels: ["enhancement", "good first issue"], assignees: [], comments: 8, url: ""
  },
  {
    id: 2, number: 155, title: "Performance issue with large repositories",
    body: "Loading time is slow for repos with 1000+ issues...", state: "open",
    created_at: "2026-05-28T08:00:00Z", updated_at: "2026-06-01T16:00:00Z",
    user: { login: "reporter-bug", id: 12, avatar_url: "", url: "" },
    labels: ["bug", "performance"], assignees: [{ login: "sarah-dev", id: 1, avatar_url: "", url: "" }], comments: 15, url: ""
  },
  {
    id: 3, number: 154, title: "Documentation: API reference incomplete",
    body: "The API documentation needs more examples...", state: "open",
    created_at: "2026-05-25T12:00:00Z", updated_at: "2026-05-30T09:00:00Z",
    user: { login: "doc-seeker", id: 13, avatar_url: "", url: "" },
    labels: ["documentation"], assignees: [{ login: "james-docs", id: 4, avatar_url: "", url: "" }], comments: 3, url: ""
  },
  {
    id: 4, number: 153, title: "Security: API token exposure in logs",
    body: "## Security Issue\nTokens are being logged in plaintext...", state: "closed",
    created_at: "2026-05-20T08:00:00Z", updated_at: "2026-05-22T18:00:00Z",
    user: { login: "security-researcher", id: 14, avatar_url: "", url: "" },
    labels: ["security", "critical"], assignees: [{ login: "sarah-dev", id: 1, avatar_url: "", url: "" }], comments: 22, url: ""
  },
  {
    id: 5, number: 152, title: "Help wanted: Review migration guide",
    body: "Need help reviewing the v2 to v3 migration guide...", state: "open",
    created_at: "2026-05-18T14:00:00Z", updated_at: "2026-05-20T10:00:00Z",
    user: { login: "migrator-needs-help", id: 15, avatar_url: "", url: "" },
    labels: ["help wanted"], assignees: [], comments: 1, url: ""
  },
];

// Demo Pull Requests
export const demoPullRequests: PullRequest[] = [
  {
    id: 1, number: 89, title: "feat: Add dark mode support",
    body: "## Changes\n- Added dark mode toggle\n- Persisted preference in localStorage\n- Updated all components for dark theme support", state: "open",
    created_at: "2026-06-01T10:00:00Z", updated_at: "2026-06-02T15:00:00Z",
    user: { login: "chris-ui", id: 8, avatar_url: "", url: "" },
    labels: ["enhancement"], assignees: [{ login: "sarah-dev", id: 1, avatar_url: "", url: "" }],
    head: { ref: "feature/dark-mode", sha: "", repo: { full_name: "" } },
    base: { ref: "main", sha: "", repo: { full_name: "" } },
    merged: false, mergeable: true, comments: 6, commits: 12, additions: 850, deletions: 120, changed_files: 28, url: ""
  },
  {
    id: 2, number: 88, title: "fix: Resolve token exposure in logs",
    body: "## Fix\n- Sanitized all log statements\n- Added redaction utility\n- Updated tests", state: "closed",
    created_at: "2026-05-20T08:00:00Z", updated_at: "2026-05-22T18:00:00Z",
    user: { login: "sarah-dev", id: 1, avatar_url: "", url: "" },
    labels: ["bug", "security"], assignees: [],
    head: { ref: "fix/token-logging", sha: "", repo: { full_name: "" } },
    base: { ref: "main", sha: "", repo: { full_name: "" } },
    merged: true, mergeable: true, comments: 12, commits: 3, additions: 45, deletions: 28, changed_files: 5, url: ""
  },
  {
    id: 3, number: 87, title: "docs: Complete API reference",
    body: "## Documentation\n- Added all endpoint documentation\n- Included request/response examples\n- Added TypeScript interfaces", state: "open",
    created_at: "2026-05-28T12:00:00Z", updated_at: "2026-05-30T09:00:00Z",
    user: { login: "james-docs", id: 4, avatar_url: "", url: "" },
    labels: ["documentation"], assignees: [],
    head: { ref: "docs/api-reference", sha: "", repo: { full_name: "" } },
    base: { ref: "main", sha: "", repo: { full_name: "" } },
    merged: false, mergeable: true, comments: 2, commits: 8, additions: 420, deletions: 15, changed_files: 12, url: ""
  },
  {
    id: 4, number: 86, title: "test: Add E2E tests for dashboard",
    body: "## Tests\n- Added Playwright E2E tests\n- Test coverage for main flows\n- CI integration", state: "closed",
    created_at: "2026-05-15T10:00:00Z", updated_at: "2026-05-20T14:00:00Z",
    user: { login: "maria-test", id: 3, avatar_url: "", url: "" },
    labels: ["testing"], assignees: [],
    head: { ref: "test/e2e-dashboard", sha: "", repo: { full_name: "" } },
    base: { ref: "main", sha: "", repo: { full_name: "" } },
    merged: true, mergeable: true, comments: 5, commits: 15, additions: 680, deletions: 0, changed_files: 18, url: ""
  },
];

// Generate extended demo data
export function generateExtendedDemoData() {
  const communityHealth = analyzeCommunityHealth(demoRepository, demoContributors, demoIssues, demoPullRequests);
  const sprintPlan = createSprintPlan(demoRepository, demoIssues, demoPullRequests, demoContributors);
  const performance = analyzePerformance(demoRepository, demoIssues, demoPullRequests);
  const performanceAlerts = generateAlerts(performance);
  const releasePlan = planRelease(demoRepository, demoPullRequests.filter(pr => pr.mergedAt), demoIssues, "1.2.0");
  const codeReview = performCodeReview({ pr: demoPullRequests[0], repo: demoRepository, reviewer: demoContributors[0] });
  const onboarding = generateOnboardingPath(demoRepository, demoIssues, demoContributors);
  const incidents = analyzeIncidents(demoRepository, demoIssues, demoPullRequests);
  const dependencies = analyzeDependencies(demoRepository);
  const licenses = analyzeLicenses(demoRepository);

  return {
    communityHealth,
    sprintPlan,
    performance,
    performanceAlerts,
    releasePlan,
    codeReview,
    onboarding,
    incidents,
    dependencies,
    licenses,
  };
}
