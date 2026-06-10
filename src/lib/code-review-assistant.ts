import type { PullRequest, Repository, Contributor } from "./types";

export interface CodeReviewRequest {
  pr: PullRequest;
  repo: Repository;
  reviewer: Contributor | null;
}

export interface CodeReviewResult {
  request: CodeReviewRequest;
  score: number;
  findings: CodeReviewFinding[];
  suggestions: CodeReviewSuggestion[];
  approvalRecommendation: "approve" | "request_changes" | "comment";
  summary: string;
}

export interface CodeReviewFinding {
  type: "issue" | "suggestion" | "praise";
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  description: string;
  line?: number;
  file?: string;
}

export interface CodeReviewSuggestion {
  category: string;
  title: string;
  description: string;
  codeSnippet?: string;
  rationale: string;
}

export function performCodeReview(request: CodeReviewRequest): CodeReviewResult {
  const findings = analyzeCode(request.pr);
  const suggestions = generateSuggestions(request.pr, findings);
  const score = calculateReviewScore(findings);
  const recommendation = determineRecommendation(score, findings);

  return {
    request,
    score,
    findings,
    suggestions,
    approvalRecommendation: recommendation,
    summary: generateSummary(findings, score),
  };
}

function analyzeCode(pr: PullRequest): CodeReviewFinding[] {
  const findings: CodeReviewFinding[] = [];

  // Check PR size
  if (pr.additions > 500) {
    findings.push({
      type: "suggestion",
      severity: "info",
      category: "Size",
      title: "Large PR - consider splitting",
      description: `This PR adds ${pr.additions} lines. Consider breaking it into smaller, focused PRs for easier review.`,
    });
  } else if (pr.additions < 50) {
    findings.push({
      type: "praise",
      severity: "info",
      category: "Size",
      title: "Small, focused PR",
      description: `Good job keeping this PR small with ${pr.additions} additions.`,
    });
  }

  // Check file changes
  if (pr.changedFiles > 20) {
    findings.push({
      type: "suggestion",
      severity: "warning",
      category: "Scope",
      title: "Many files changed",
      description: `${pr.changedFiles} files modified. Ensure each change is related and necessary.`,
    });
  }

  // Check description
  if (!pr.body || pr.body.length < 20) {
    findings.push({
      type: "warning",
      severity: "warning",
      category: "Documentation",
      title: "PR description is missing or too brief",
      description: "A clear PR description helps reviewers understand the context and motivation.",
    });
  }

  // Check commits
  if (pr.commits > 10) {
    findings.push({
      type: "suggestion",
      severity: "info",
      category: "History",
      title: "Many commits in PR",
      description: `${pr.commits} commits. Consider squashing for a cleaner history.`,
    });
  } else if (pr.commits === 1) {
    findings.push({
      type: "praise",
      severity: "info",
      category: "History",
      title: "Single commit PR",
      description: "Great! This makes the PR easy to revert if needed.",
    });
  }

  // Simulate code quality findings based on additions/deletions ratio
  const changeRatio = pr.additions / (pr.deletions || 1);
  if (changeRatio > 10) {
    findings.push({
      type: "warning",
      severity: "warning",
      category: "Code Quality",
      title: "High additions to deletions ratio",
      description: "The ratio suggests refactoring might be needed. Consider cleaning up unused code first.",
    });
  }

  // Check for test coverage (simulated)
  if (pr.additions > 100 && !pr.labels.some((l) => l.toLowerCase().includes("test"))) {
    findings.push({
      type: "suggestion",
      severity: "info",
      category: "Testing",
      title: "Consider adding tests",
      description: "This substantial change might benefit from test coverage.",
    });
  }

  return findings;
}

function generateSuggestions(
  pr: PullRequest,
  findings: CodeReviewFinding[]
): CodeReviewSuggestion[] {
  const suggestions: CodeReviewSuggestion[] = [];

  // Generate suggestions based on findings
  findings.forEach((finding) => {
    if (finding.type === "suggestion" || finding.type === "warning") {
      suggestions.push({
        category: finding.category,
        title: `Address: ${finding.title}`,
        description: finding.description,
        rationale: "Following this suggestion improves code quality and maintainability.",
      });
    }
  });

  // Add generic good practices
  if (!pr.labels.some((l) => l.toLowerCase().includes("breaking"))) {
    suggestions.push({
      category: "Documentation",
      title: "Update relevant documentation",
      description: "Ensure README, API docs, or guides are updated if needed.",
      rationale: "Keeping documentation in sync prevents user confusion.",
    });
  }

  suggestions.push({
    category: "Security",
    title: "Security review for external inputs",
    description: "If this PR handles user input or external data, ensure proper validation.",
    rationale: "Security is easier to address during development than after release.",
  });

  return suggestions;
}

function calculateReviewScore(findings: CodeReviewFinding[]): number {
  let score = 100;

  findings.forEach((finding) => {
    switch (finding.severity) {
      case "critical":
        score -= 25;
        break;
      case "warning":
        score -= 10;
        break;
      case "info":
        if (finding.type === "praise") {
          score += 5;
        } else {
          score -= 3;
        }
        break;
    }
  });

  return Math.max(0, Math.min(100, score));
}

function determineRecommendation(
  score: number,
  findings: CodeReviewFinding[]
): CodeReviewResult["approvalRecommendation"] {
  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasWarnings = findings.some((f) => f.severity === "warning");

  if (hasCritical) return "request_changes";
  if (hasWarnings || score < 70) return "request_changes";
  if (score >= 85) return "approve";
  return "comment";
}

function generateSummary(
  findings: CodeReviewFinding[],
  score: number
): string {
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const praiseCount = findings.filter((f) => f.type === "praise").length;

  let summary = `Review Score: ${score}/100. `;

  if (praiseCount > 0) {
    summary += `Notable positives: ${praiseCount} items. `;
  }

  if (criticalCount > 0) {
    summary += `${criticalCount} critical issue(s) must be addressed. `;
  } else if (warningCount > 0) {
    summary += `${warningCount} warning(s) to consider. `;
  } else {
    summary += "No issues detected. ";
  }

  return summary.trim();
}

export function formatFindingIcon(finding: CodeReviewFinding): string {
  switch (finding.type) {
    case "praise":
      return "✅";
    case "suggestion":
      return "💡";
    case "issue":
      return "❌";
  }
}

export function formatSeverityColor(severity: CodeReviewFinding["severity"]): string {
  switch (severity) {
    case "critical":
      return "text-red-600 bg-red-100";
    case "warning":
      return "text-yellow-600 bg-yellow-100";
    case "info":
      return "text-blue-600 bg-blue-100";
  }
}

export function formatRecommendationBadge(
  recommendation: CodeReviewResult["approvalRecommendation"]
): { label: string; color: string } {
  switch (recommendation) {
    case "approve":
      return { label: "Approve", color: "bg-green-100 text-green-800" };
    case "request_changes":
      return { label: "Request Changes", color: "bg-red-100 text-red-800" };
    case "comment":
      return { label: "Comment", color: "bg-gray-100 text-gray-800" };
  }
}
