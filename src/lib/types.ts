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

export type MaintainerCommandQueueItem = {
  actionId: string;
  title: string;
  target: MaintainerAction["target"];
  priority: MaintainerAction["priority"];
  url: string;
  commandCount: number;
  commands: string[];
  requiresReview: boolean;
  reviewReason: string | null;
};

export type MaintainerCommandQueue = {
  summary: string;
  commandCount: number;
  items: MaintainerCommandQueueItem[];
  markdown: string;
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

export type MaintainerSettings = {
  targetLabelCoverage: number;
  maxIssueResponseDays: number;
  maxPullRequestAgeDays: number;
  maxOpenPullRequests: number;
  releaseCadenceDays: number;
  preferredLabels: string[];
};

export type RepositoryAnalysisSnapshot = {
  capturedAt: string;
  healthScore: number;
  readinessScore: number;
  openIssues: number;
  openPullRequests: number;
  qualitySignals: Array<{
    id: RepositoryQualitySignal["id"];
    score: number;
  }>;
};

export type RepositoryTrendChange = {
  label: string;
  previous: number;
  current: number;
  delta: number;
  direction: "up" | "down" | "flat";
};

export type RepositoryQualitySignalTrend = RepositoryTrendChange & {
  id: RepositoryQualitySignal["id"];
};

export type RepositoryTrend = {
  direction: "improving" | "declining" | "steady" | "baseline";
  summary: string;
  since: string | null;
  changes: RepositoryTrendChange[];
  qualitySignalChanges: RepositoryQualitySignalTrend[];
};

export type MaintainerAnalysis = {
  settings: MaintainerSettings;
  health: RepositoryHealth;
  readiness: RepositoryReadiness;
  qualitySignals: RepositoryQualitySignal[];
  trend: RepositoryTrend;
  triage: IssueTriage[];
  reviews: PullRequestReview[];
  similarIssues: SimilarIssueCluster[];
  actions: MaintainerAction[];
  playbooks: RepositoryPlaybook[];
  digest: MaintainerDigest;
  releaseNotes: string;
};

export type MaintainerInboxItem = {
  repository: string;
  url: string;
  painScore: number;
  painLevel: "critical" | "watch" | "calm";
  openIssues: number;
  openPullRequests: number;
  topActionId: string | null;
  topActionTitle: string | null;
  reasons: string[];
};

export type MaintainerInbox = {
  summary: string;
  totals: {
    repositories: number;
    openIssues: number;
    openPullRequests: number;
    attentionRepositories: number;
  };
  items: MaintainerInboxItem[];
};

export type ContributorImpactItem = {
  id: string;
  contributor: string;
  source: "issue" | "pull-request";
  number: number;
  title: string;
  url: string;
  waitDays: number;
  impactLevel: "blocked" | "waiting" | "low";
  unblockActionId: string | null;
  nextStep: string;
};

export type ContributorImpactQueue = {
  summary: string;
  totals: {
    contributorsWaiting: number;
    blockedItems: number;
    averageWaitDays: number;
  };
  items: ContributorImpactItem[];
};

export type ResponseSlaItem = {
  id: string;
  contributor: string;
  title: string;
  url: string;
  source: ContributorImpactItem["source"];
  waitDays: number;
  targetDays: number;
  daysOverTarget: number;
  daysUntilTarget: number;
  status: "overdue" | "at-risk" | "on-track";
  nextStep: string;
};

export type ResponseSlaQueue = {
  summary: string;
  totals: {
    overdue: number;
    atRisk: number;
    onTrack: number;
  };
  items: ResponseSlaItem[];
  markdown: string;
};

export type ReproductionRequestItem = {
  id: string;
  issueNumber: number;
  title: string;
  contributor: string;
  url: string;
  missingInformation: string[];
  checklist: string[];
  commentDraft: string;
  githubCommand: string;
};

export type ReproductionRequestKit = {
  summary: string;
  items: ReproductionRequestItem[];
  markdown: string;
};

export type PullRequestReviewHandoffItem = {
  id: string;
  pullRequestNumber: number;
  title: string;
  contributor: string;
  url: string;
  risk: PullRequestReview["risk"];
  focusAreas: string[];
  suggestedTests: string[];
  reviewCommentDraft: string;
  maintainerCommands: string[];
  githubCommentCommand: string;
};

export type PullRequestReviewHandoffKit = {
  summary: string;
  items: PullRequestReviewHandoffItem[];
  markdown: string;
};

export type ContributorStarterKitItem = {
  id: string;
  issueNumber: number;
  title: string;
  contributor: string;
  url: string;
  difficulty: "starter" | "guided";
  reason: string;
  suggestedBranch: string;
  acceptanceCriteria: string[];
  pullRequestChecklist: string[];
  maintainerCommentDraft: string;
  githubCommentCommand: string;
};

export type ContributorStarterKit = {
  summary: string;
  items: ContributorStarterKitItem[];
  markdown: string;
};

export type ContributorReplyOutboxItem = {
  id: string;
  priority: "urgent" | "high" | "normal";
  source: "repro" | "review" | "starter";
  target: "issue" | "pull-request";
  targetNumber: number;
  contributor: string;
  title: string;
  url: string;
  body: string;
  githubCommand: string;
};

export type ContributorReplyOutbox = {
  summary: string;
  items: ContributorReplyOutboxItem[];
  markdown: string;
};

export type ReleaseGateItem = {
  id: string;
  source: "issue" | "pull-request" | "repository";
  targetNumber: number | null;
  title: string;
  detail: string;
  url: string;
};

export type ReleaseGateCheck = {
  id: "high-priority-bugs" | "reproduction-details" | "pull-request-risk" | "oss-readiness";
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type ReleaseReadinessGate = {
  status: "ready" | "needs-review" | "blocked";
  summary: string;
  blockers: ReleaseGateItem[];
  warnings: ReleaseGateItem[];
  checks: ReleaseGateCheck[];
  nextStep: string;
  releaseCommand: string;
  markdown: string;
};

export type MaintainerFocusPlanItem = {
  id: string;
  priority: "critical" | "high" | "normal";
  source: "release" | "sla" | "review" | "command";
  title: string;
  detail: string;
  url: string;
  estimatedMinutes: number;
  reason: string;
  expectedOutcome: string;
};

export type MaintainerFocusPlan = {
  summary: string;
  totalEstimatedMinutes: number;
  items: MaintainerFocusPlanItem[];
  markdown: string;
};

export type ContributorStatusBriefFocusItem = {
  title: string;
  priority: MaintainerFocusPlanItem["priority"];
  source: MaintainerFocusPlanItem["source"];
  estimatedMinutes: number;
  url: string;
};

export type ContributorStatusBriefWaitingItem = {
  contributor: string;
  title: string;
  status: ResponseSlaItem["status"];
  waitDays: number;
  url: string;
  nextStep: string;
};

export type ContributorStatusBriefOpportunity = {
  title: string;
  difficulty: ContributorStarterKitItem["difficulty"];
  url: string;
  suggestedBranch: string;
};

export type ContributorStatusBrief = {
  title: string;
  summary: string;
  releaseStatus: string;
  maintainerFocus: ContributorStatusBriefFocusItem[];
  waitingOnMaintainer: ContributorStatusBriefWaitingItem[];
  contributorOpportunities: ContributorStatusBriefOpportunity[];
  markdown: string;
};

export type OssEvidencePack = {
  programUrl: string;
  roleDraft: string;
  qualificationDraft: string;
  creditUseDraft: string;
  anythingElseDraft: string;
  evidence: string[];
  applicationPacket: CodexOssApplicationPacket;
  markdown: string;
};

export type CodexOssApplicationPacket = {
  repositoryUrl: string;
  maintainerRole: "Primary maintainer" | "Core maintainer";
  interests: Array<"Codex Security" | "API credits for my project">;
  qualificationAnswer: string;
  creditUseAnswer: string;
  anythingElseAnswer: string;
  formFields: Array<{
    label: string;
    value: string;
  }>;
  markdown: string;
};

export type ContributorUnblockKitItem = {
  id: string;
  contributor: string;
  title: string;
  url: string;
  actionId: string;
  commentDraft: string;
  commands: string[];
};

export type ContributorUnblockKit = {
  summary: string;
  items: ContributorUnblockKitItem[];
  markdown: string;
};
