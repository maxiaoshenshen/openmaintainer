export type MaintainerLanguage = "en" | "zh";

export type RepositoryIdentity = {
  owner: string;
  name: string;
  fullName: string;
  url: string;
};

export type MaintainerIssue = {
  id: number | string;
  number: number;
  title: string;
  body: string;
  author: string;
  state?: "open" | "closed";
  labels: string[];
  comments: number;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  assignees?: string[];
  milestone?: string | null;
  pullRequest?: boolean | null;
};

export type MaintainerPullRequest = {
  id: number | string;
  number: number;
  title: string;
  body: string;
  author: string;
  state: "open" | "closed" | "merged";
  status?: "open" | "closed" | "merged";
  reviewStatus?: "pending" | "approved" | "changes_requested";
  mergedAt?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
  commentCount?: number;
  assignees?: string[];
  milestone?: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  headRef?: string;
  baseRef?: string;
  isDraft?: boolean;
  mergeable?: "mergeable" | "unmergeable" | "behind" | "unknown";
  reviewRequests?: number;
  comments?: number;
  commits?: number;
};

export type MaintainerRepository = {
  identity: RepositoryIdentity;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  closedIssues?: number;
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

export type MaintainerCommandSafetyLevel = "safe" | "review" | "destructive";

export type MaintainerCommandQueueItem = {
  actionId: string;
  title: string;
  target: MaintainerAction["target"];
  priority: MaintainerAction["priority"];
  url: string;
  commandCount: number;
  commands: string[];
  safetyLevel: MaintainerCommandSafetyLevel;
  safetyReason: string;
  requiresReview: boolean;
  reviewReason: string | null;
};

export type MaintainerCommandQueue = {
  summary: string;
  commandCount: number;
  safetyTotals: Record<MaintainerCommandSafetyLevel, number>;
  items: MaintainerCommandQueueItem[];
  markdown: string;
};

export type MaintainerDecisionLogItem = {
  id: string;
  actionId: string;
  title: string;
  url: string;
  decisionType: "respond" | "review" | "close" | "release";
  status: "ready" | "needs-review" | "blocked";
  risk: "low" | "medium" | "high";
  humanGate: string;
  evidence: string[];
  commands: string[];
};

export type MaintainerDecisionLog = {
  summary: string;
  totals: {
    ready: number;
    needsReview: number;
    blocked: number;
    highRisk: number;
  };
  items: MaintainerDecisionLogItem[];
  markdown: string;
};

export type MaintainerOwnershipRouteItem = {
  id: string;
  ownerRole: "Release captain" | "Triage maintainer" | "Review maintainer" | "Safety reviewer";
  priority: "critical" | "high" | "normal";
  source: "release" | "sla" | "review" | "decision";
  title: string;
  url: string;
  reason: string;
  nextStep: string;
  handoff: string;
};

export type MaintainerOwnershipRouting = {
  summary: string;
  totals: {
    releaseCaptain: number;
    triageMaintainer: number;
    reviewMaintainer: number;
    safetyReviewer: number;
  };
  items: MaintainerOwnershipRouteItem[];
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
  repository: MaintainerRepository;
  inbox: MaintainerInbox;
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
  previousSnapshot?: RepositoryAnalysisSnapshot;
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
  issues?: MaintainerIssue[];
  pullRequests?: MaintainerPullRequest[];
  totalCount?: number;
  unreadCount?: number;
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
  variants: Array<{
    language: MaintainerLanguage;
    label: "English" | "中文";
    body: string;
    githubCommand: string;
  }>;
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

// Duplicate Detection Types
export type DuplicateCandidate = {
  originalIssue: MaintainerIssue;
  potentialDuplicate: MaintainerIssue;
  similarity: number;
  matchingTerms: string[];
  suggestion: string;
};

export type DuplicateDetectionResult = {
  candidates: DuplicateCandidate[];
  totalAnalyzed: number;
  clusters: number;
};

// PR Merge Advisor Types
export type MergeReadiness = "ready" | "needs-changes" | "needs-review" | "blocked";
export type RiskLevel = "low" | "medium" | "high";

export type MergeAdvice = {
  prNumber: number;
  prTitle: string;
  readiness: MergeReadiness;
  riskLevel: RiskLevel;
  blockers: string[];
  suggestions: string[];
  estimatedReviewTime: string;
  mergeConfidence: number;
};

export type MergeAdvisoryReport = {
  mergeable: MergeAdvice[];
  needsReview: MergeAdvice[];
  blocked: MergeAdvice[];
  totalPRs: number;
  readyToMerge: number;
  averageConfidence: number;
};

// Contributor Health Types
export type ActivityLevel = "active" | "engaged" | "dormant";
export type Sentiment = "positive" | "neutral" | "frustrated";

export type ContributorProfile = {
  username: string;
  totalContributions: number;
  prsMerged: number;
  issuesOpened: number;
  avgResponseRate: number;
  lastActive: string;
  activityLevel: ActivityLevel;
  sentiment: Sentiment;
  healthScore: number;
};

export type ContributorHealthReport = {
  contributors: ContributorProfile[];
  atRisk: string[];
  topContributors: string[];
  dormantContributors: string[];
  summary: {
    totalContributors: number;
    activeCount: number;
    averageHealth: number;
  };
};

// Maintainer Rhythm Types
export type RhythmType = "daily" | "weekly" | "biweekly" | "monthly";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type EnergyLevel = "high" | "medium" | "low";

export type RhythmTask = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  category: "review" | "triage" | "release" | "community" | "maintenance";
  completed: boolean;
};

export type FocusBlock = {
  start: string;
  end: string;
  activity: string;
  energyLevel: EnergyLevel;
};

export type DailyRhythmPlan = {
  morning: RhythmTask[];
  afternoon: RhythmTask[];
  evening: RhythmTask[];
  focusWindows: FocusBlock[];
  dailyTip: string;
};

export type WeeklyRhythmReport = {
  weekOf: string;
  completed: number;
  pending: number;
  productivity: number;
  patterns: string[];
  recommendations: string[];
};

// Community Health Radar Types
export type RadarDimension = {
  name: string;
  score: number;
  description: string;
};

export type RadarData = {
  dimensions: RadarDimension[];
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
};

// AI Summarizer Types
export type SummaryType = "brief" | "detailed" | "actionable";

export interface SummarizedItem {
  id: string;
  type: "issue" | "pr";
  number: number;
  title: string;
  summary: string;
  keyPoints: string[];
  actionNeeded: boolean;
  suggestedLabels: string[];
  sentiment: "positive" | "neutral" | "negative" | "urgent";
  effort: "low" | "medium" | "high";
}

export interface BatchSummary {
  items: SummarizedItem[];
  totalCount: number;
  urgentCount: number;
  actionRequiredCount: number;
  categoryBreakdown: Record<string, number>;
}

// Efficiency Types
export type EfficiencyMetric = {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  benchmark: number;
  status: "excellent" | "good" | "needs-improvement" | "critical";
};

export type EfficiencyReport = {
  metrics: EfficiencyMetric[];
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  strengths: string[];
  improvements: string[];
  recommendations: string[];
};

export interface EfficiencyStreak {
  currentStreak: number;
  longestStreak: number;
  itemsProcessed: number;
  lastProcessedDate: string;
}

// Legacy type aliases for backward compatibility
export type Repository = {
  id: number;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  language: string;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
};

export type Contributor = {
  id: number;
  username: string;
  avatarUrl: string;
  contributions: number;
  type: "User" | "Bot";
};

export type Issue = {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  author: string;
  labels: string[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  url: string;
};

export type PullRequest = {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed" | "merged";
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  url: string;
};

export type Analysis = {
  repository: Repository;
  contributors: Contributor[];
  issues: Issue[];
  pullRequests: PullRequest[];
};
