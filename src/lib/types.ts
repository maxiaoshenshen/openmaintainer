export type MaintainerLanguage = "en" | "zh";

export type RepositoryIdentity = {
  owner: string;
  name: string;
  fullName: string;
  url: string;
};

export type MaintainerIssue = {
  id: number;
  number: number;
  title: string;
  body: string;
  author: string;
  labels: string[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  url: string;
};

export type MaintainerPullRequest = {
  id: number;
  number: number;
  title: string;
  body: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
};

export type MaintainerRepository = {
  identity: RepositoryIdentity;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  defaultBranch: string;
  license: string | null;
  updatedAt: string;
  issues: MaintainerIssue[];
  pullRequests: MaintainerPullRequest[];
};

export type IssueTriage = {
  issueNumber: number;
  category: "bug" | "feature" | "question" | "documentation" | "maintenance";
  priority: "urgent" | "high" | "normal" | "low";
  suggestedLabels: string[];
  maintainerReply: string;
  missingInformation: string[];
};

export type PullRequestReview = {
  pullRequestNumber: number;
  summary: string;
  risk: "high" | "medium" | "low";
  focusAreas: string[];
  suggestedTests: string[];
};

export type RepositoryHealth = {
  score: number;
  status: "stable" | "watch" | "attention";
  strengths: string[];
  risks: string[];
  nextActions: string[];
};

export type SimilarIssueCluster = {
  issueNumbers: number[];
  reason: string;
  suggestedAction: string;
};

export type ReadinessCheck = {
  id: "license" | "description" | "default-branch" | "issue-load" | "review-queue";
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type RepositoryReadiness = {
  score: number;
  checks: ReadinessCheck[];
};

export type MaintainerAction = {
  id: string;
  title: string;
  target: "issue" | "pull-request" | "release" | "repository";
  priority: "urgent" | "high" | "normal" | "low";
  url: string;
  summary: string;
  draft: string;
  commands: string[];
  githubCommands: string[];
};

export type RepositoryPlaybookStep = {
  actionId: string;
  label: string;
  reason: string;
  expectedOutcome: string;
};

export type RepositoryPlaybook = {
  id: "today" | "weekly" | "release";
  title: string;
  cadence: "daily" | "weekly" | "release";
  goal: string;
  steps: RepositoryPlaybookStep[];
};

export type MaintainerDigestItem = {
  actionId?: string;
  label: string;
  reason: string;
};

export type MaintainerDigest = {
  title: string;
  riskLevel: "stable" | "watch" | "attention";
  releaseReadiness: "ready" | "ready-with-review" | "blocked";
  highlights: string[];
  priorities: MaintainerDigestItem[];
  deferrals: MaintainerDigestItem[];
  markdown: string;
};

export type RepositoryQualitySignal = {
  id: "label-coverage" | "issue-response-gap" | "pr-age" | "review-load";
  label: string;
  score: number;
  level: "stable" | "watch" | "attention";
  detail: string;
  evidence: string[];
  nextAction: string;
};

export type MaintainerAnalysis = {
  health: RepositoryHealth;
  readiness: RepositoryReadiness;
  qualitySignals: RepositoryQualitySignal[];
  triage: IssueTriage[];
  reviews: PullRequestReview[];
  similarIssues: SimilarIssueCluster[];
  actions: MaintainerAction[];
  playbooks: RepositoryPlaybook[];
  digest: MaintainerDigest;
  releaseNotes: string;
};
