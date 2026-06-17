/**
 * PR Analyzer - Analyze pull requests for quality and merge readiness
 */

export type PRState = "open" | "closed" | "merged";
export type MergeStrategy = "merge" | "squash" | "rebase";

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string;
  author: string;
  state: PRState;
  base: string;
  head: string;
  labels: string[];
  reviewers: string[];
  requestedReviewers: string[];
  assignees: string[];
  createdAt: number;
  updatedAt: number;
  mergedAt?: number;
  closedAt?: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  commits: number;
  checks?: PRChecks;
}

export interface PRChecks {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  skipped: number;
  details?: CheckDetail[];
}

export interface CheckDetail {
  name: string;
  status: "success" | "failure" | "pending" | "skipped";
  conclusion?: string;
  url?: string;
  duration?: number;
}

export interface PRAnalysis {
  pr: PullRequest;
  quality: PRQuality;
  suggestions: string[];
  blockers: string[];
  reviewStatus: ReviewStatus;
  mergeReady: boolean;
}

export interface PRQuality {
  score: number; // 0-100
  title: QualityAspect;
  description: QualityAspect;
  size: QualityAspect;
  tests: QualityAspect;
  documentation: QualityAspect;
}

export interface QualityAspect {
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
}

export interface ReviewStatus {
  approved: boolean;
  changesRequested: boolean;
  pending: number;
  approvedBy: string[];
  changesRequestedBy: string[];
}

/**
 * Parse PR from GitHub API format
 */
export function parsePullRequest(data: any): PullRequest {
  return {
    id: data.id?.toString() || `pr_${Date.now()}`,
    number: data.number || 0,
    title: data.title || "",
    body: data.body || "",
    author: data.user?.login || data.author?.login || "unknown",
    state: data.merged ? "merged" : data.state === "closed" ? "closed" : "open",
    base: data.base?.ref || "main",
    head: data.head?.ref || "feature",
    labels: data.labels?.map((l: any) => l.name) || [],
    reviewers: data.requested_reviewers?.map((r: any) => r.login) || [],
    requestedReviewers: data.requested_reviewers?.map((r: any) => r.login) || [],
    assignees: data.assignees?.map((a: any) => a.login) || [],
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    mergedAt: data.merged_at ? new Date(data.merged_at).getTime() : undefined,
    closedAt: data.closed_at ? new Date(data.closed_at).getTime() : undefined,
    additions: data.additions || 0,
    deletions: data.deletions || 0,
    changedFiles: data.changed_files || 0,
    comments: data.comments || 0,
    commits: data.commits || 0,
  };
}

/**
 * Analyze PR quality
 */
export function analyzePR(pr: PullRequest): PRAnalysis {
  const quality = calculateQuality(pr);
  const suggestions: string[] = [];
  const blockers: string[] = [];

  // Check for blockers
  if (pr.checks) {
    if (pr.checks.failed > 0) {
      blockers.push(`${pr.checks.failed} check(s) failed`);
    }
    if (pr.checks.pending > 0) {
      blockers.push(`${pr.checks.pending} check(s) pending`);
    }
  }

  if (pr.state === "open" && pr.reviewers.length === 0) {
    blockers.push("No reviewers requested");
  }

  if (quality.title.score < 50) {
    blockers.push(quality.title.issues.join(", ") || "Title needs improvement");
  }

  if (quality.description.score < 30) {
    blockers.push("PR description is missing or too short");
  }

  if (quality.size.score < 30) {
    blockers.push("PR is too large - consider splitting");
  }

  // Collect suggestions
  suggestions.push(...quality.title.suggestions);
  suggestions.push(...quality.description.suggestions);
  suggestions.push(...quality.size.suggestions);
  suggestions.push(...quality.tests.suggestions);
  suggestions.push(...quality.documentation.suggestions);

  const reviewStatus = getReviewStatus(pr);
  const mergeReady = blockers.length === 0 && reviewStatus.approved && pr.checks?.passed === pr.checks?.total;

  return {
    pr,
    quality,
    suggestions: [...new Set(suggestions)],
    blockers,
    reviewStatus,
    mergeReady,
  };
}

/**
 * Calculate PR quality score
 */
export function calculateQuality(pr: PullRequest): PRQuality {
  return {
    score: 0, // Calculated as weighted average
    title: analyzeTitle(pr.title),
    description: analyzeDescription(pr.body),
    size: analyzeSize(pr),
    tests: analyzeTests(pr),
    documentation: analyzeDocumentation(pr),
  };
}

function analyzeTitle(title: string): QualityAspect {
  const issues: string[] = [];
  const suggestions: string[] = [];

  let score = 100;

  // Check for conventional commit format
  const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?:/;
  if (!conventionalPattern.test(title)) {
    score -= 20;
    suggestions.push("Consider using conventional commit format (e.g., 'feat: add feature')");
  }

  // Check for title length
  if (title.length < 10) {
    score -= 30;
    issues.push("Title is too short");
  } else if (title.length > 100) {
    score -= 20;
    issues.push("Title is too long (max 100 characters)");
  }

  // Check for capitalized first letter
  if (title[0] === title[0]?.toLowerCase()) {
    score -= 10;
    suggestions.push("Start with a capital letter");
  }

  // Check for imperative mood
  const imperativeWords = ["add", "fix", "update", "remove", "change", "improve"];
  const startsWithLowercase = imperativeWords.some(w => title.toLowerCase().startsWith(w));
  if (startsWithLowercase) {
    score += 10; // Bonus for imperative mood
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
  };
}

function analyzeDescription(body: string): QualityAspect {
  const issues: string[] = [];
  const suggestions: string[] = [];

  let score = 100;

  if (!body || body.trim().length === 0) {
    score = 0;
    issues.push("PR description is missing");
  } else if (body.length < 20) {
    score = 30;
    issues.push("PR description is too short");
  } else if (body.length < 50) {
    score = 60;
    suggestions.push("Consider adding more context to the description");
  }

  // Check for common sections
  const hasSections = /##|###|---|\*\*|##\s+(What|Why|How|Fixes|Related)/i.test(body);
  if (body.length > 100 && !hasSections) {
    score -= 20;
    suggestions.push("Consider adding structured sections (What, Why, How)");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
  };
}

function analyzeSize(pr: PullRequest): QualityAspect {
  const issues: string[] = [];
  const suggestions: string[] = [];

  let score = 100;

  // Changed files scoring
  if (pr.changedFiles > 20) {
    score -= 40;
    issues.push(`Too many files changed (${pr.changedFiles})`);
    suggestions.push("Consider splitting into smaller PRs");
  } else if (pr.changedFiles > 10) {
    score -= 20;
    suggestions.push("Consider if this could be split into smaller PRs");
  }

  // Lines changed scoring
  const totalLines = pr.additions + pr.deletions;
  if (totalLines > 1000) {
    score -= 40;
    issues.push(`Too many lines changed (${totalLines})`);
  } else if (totalLines > 500) {
    score -= 20;
  }

  // Addition ratio (high deletion ratio might indicate refactoring)
  if (pr.deletions > pr.additions * 2 && pr.deletions > 200) {
    score -= 15;
    suggestions.push("Large refactoring detected - ensure tests still pass");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
  };
}

function analyzeTests(pr: PullRequest): QualityAspect {
  const issues: string[] = [];
  const suggestions: string[] = [];

  let score = 100;

  // Check for test-related labels
  const hasTests = pr.labels.some(l => 
    l.toLowerCase().includes("test") || 
    l.toLowerCase().includes("spec") ||
    l.toLowerCase().includes("ci")
  );

  // This is simplified - real implementation would check actual test file changes
  if (!hasTests && pr.additions > 100) {
    score -= 30;
    issues.push("No test-related changes detected");
    suggestions.push("Consider adding tests for new functionality");
  }

  // Check for test coverage decrease indication
  if (pr.labels.some(l => l.toLowerCase().includes("breaking"))) {
    suggestions.push("Ensure backward compatibility or update tests");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
  };
}

function analyzeDocumentation(pr: PullRequest): QualityAspect {
  const issues: string[] = [];
  const suggestions: string[] = [];

  let score = 100;

  // Check for docs-related changes
  const hasDocs = pr.labels.some(l => 
    l.toLowerCase().includes("docs") ||
    l.toLowerCase().includes("documentation")
  );

  const isConfigChange = pr.labels.some(l =>
    l.toLowerCase().includes("config") ||
    l.toLowerCase().includes("settings")
  );

  if (!hasDocs && !isConfigChange && pr.additions > 200) {
    score -= 20;
    suggestions.push("Consider updating documentation if API or behavior changed");
  }

  // Check for README changes
  const hasReadme = pr.changedFiles > 0 && false; // Would need actual file check
  if (hasReadme) {
    score += 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
  };
}

/**
 * Get review status from PR
 */
export function getReviewStatus(pr: PullRequest): ReviewStatus {
  // This would typically come from the GitHub API reviews endpoint
  // For now, return a placeholder based on available data
  return {
    approved: false,
    changesRequested: false,
    pending: pr.requestedReviewers.length,
    approvedBy: [],
    changesRequestedBy: [],
  };
}

/**
 * Calculate overall PR score
 */
export function calculatePRScore(analysis: PRAnalysis): number {
  const weights = {
    title: 0.15,
    description: 0.15,
    size: 0.25,
    tests: 0.25,
    documentation: 0.2,
  };

  const weightedScore = 
    analysis.quality.title.score * weights.title +
    analysis.quality.description.score * weights.description +
    analysis.quality.size.score * weights.size +
    analysis.quality.tests.score * weights.tests +
    analysis.quality.documentation.score * weights.documentation;

  // Deduct for blockers
  let finalScore = weightedScore;
  finalScore -= analysis.blockers.length * 10;

  return Math.max(0, Math.min(100, Math.round(finalScore)));
}

/**
 * Suggest merge strategy
 */
export function suggestMergeStrategy(pr: PullRequest): MergeStrategy {
  // If PR has messy history, suggest squash
  if (pr.commits > 5) {
    return "squash";
  }

  // If PR has clean, atomic commits, suggest merge or rebase
  if (pr.commits <= 3 && pr.additions < 200) {
    return "rebase";
  }

  return "merge";
}

/**
 * Calculate PR metrics
 */
export function calculatePRMetrics(pr: PullRequest): {
  size: "xs" | "sm" | "md" | "lg" | "xl";
  complexity: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high";
  reviewPriority: "low" | "normal" | "high" | "urgent";
} {
  // Size
  let size: "xs" | "sm" | "md" | "lg" | "xl" = "xs";
  if (pr.changedFiles > 50) size = "xl";
  else if (pr.changedFiles > 20) size = "lg";
  else if (pr.changedFiles > 10) size = "md";
  else if (pr.changedFiles > 3) size = "sm";

  // Complexity (based on file count and line changes)
  let complexity: "low" | "medium" | "high" = "low";
  if (pr.additions + pr.deletions > 1000) complexity = "high";
  else if (pr.additions + pr.deletions > 300) complexity = "medium";

  // Risk level
  let riskLevel: "low" | "medium" | "high" = "low";
  if (pr.labels.some(l => l.toLowerCase().includes("breaking") || l.toLowerCase().includes("security"))) {
    riskLevel = "high";
  } else if (complexity === "high" || size === "lg" || size === "xl") {
    riskLevel = "medium";
  }

  // Review priority
  let reviewPriority: "low" | "normal" | "high" | "urgent" = "normal";
  if (pr.labels.some(l => l.toLowerCase().includes("urgent") || l.toLowerCase().includes("priority"))) {
    reviewPriority = "urgent";
  } else if (riskLevel === "high") {
    reviewPriority = "high";
  } else if (riskLevel === "low" && pr.changedFiles < 5) {
    reviewPriority = "low";
  }

  return { size, complexity, riskLevel, reviewPriority };
}
