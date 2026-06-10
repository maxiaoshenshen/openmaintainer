import type { MaintainerRepository as Repository, MaintainerPullRequest as PullRequest, MaintainerIssue as Issue } from "./types";

export interface ReleasePlan {
  version: string;
  releaseDate: Date;
  type: "major" | "minor" | "patch";
  features: ReleaseFeature[];
  bugfixes: BugFix[];
  breakingChanges: BreakingChange[];
  knownIssues: Issue[];
  changelog: string;
  checklist: ReleaseChecklistItem[];
}

export interface ReleaseFeature {
  title: string;
  pr: PullRequest;
  contributor: string;
  description: string;
}

export interface BugFix {
  title: string;
  pr: PullRequest;
  issue: Issue | null;
  severity: "critical" | "high" | "medium" | "low";
}

export interface BreakingChange {
  title: string;
  description: string;
  migration: string;
  affectedAPIs: string[];
}

export interface ReleaseChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  critical: boolean;
}

export function planRelease(
  repo: Repository,
  mergedPRs: PullRequest[],
  closedIssues: Issue[],
  previousVersion?: string
): ReleasePlan {
  const version = calculateNextVersion(mergedPRs, previousVersion);
  const releaseType = determineReleaseType(version);
  const features = extractFeatures(mergedPRs);
  const bugfixes = extractBugfixes(mergedPRs, closedIssues);
  const breakingChanges = extractBreakingChanges(mergedPRs);
  const knownIssues = extractKnownIssues(closedIssues);

  return {
    version,
    releaseDate: calculateReleaseDate(),
    type: releaseType,
    features,
    bugfixes,
    breakingChanges,
    knownIssues,
    changelog: generateChangelog(version, features, bugfixes, breakingChanges),
    checklist: generateReleaseChecklist(breakingChanges, bugfixes),
  };
}

function calculateNextVersion(
  prs: PullRequest[],
  previousVersion?: string
): string {
  const current = previousVersion || "0.0.0";
  const parts = current.split(".").map(Number);

  // Check for breaking changes
  const hasBreaking = prs.some(
    (pr) =>
      pr.body?.toLowerCase().includes("breaking") ||
      pr.labels.some((l) => l.toLowerCase().includes("breaking"))
  );

  // Check for new features
  const hasFeatures = prs.some((pr) => pr.additions > 100);

  if (hasBreaking) {
    return `${parts[0] + 1}.0.0`;
  }
  if (hasFeatures) {
    return `${parts[0]}.${parts[1] + 1}.0`;
  }
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

function determineReleaseType(version: string): "major" | "minor" | "patch" {
  const parts = version.split(".").map(Number);
  if (parts[1] === 0 && parts[2] === 0) return "major";
  if (parts[2] === 0) return "minor";
  return "patch";
}

function calculateReleaseDate(): Date {
  const date = new Date();
  // Schedule for next Thursday (common release day)
  const daysUntilThursday = (4 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilThursday);
  return date;
}

function extractFeatures(prs: PullRequest[]): ReleaseFeature[] {
  return prs
    .filter(
      (pr) =>
        pr.additions > 100 &&
        !pr.labels.some((l) => l.toLowerCase().includes("bug"))
    )
    .map((pr) => ({
      title: pr.title,
      pr,
      contributor: pr.author,
      description: pr.body || pr.title,
    }));
}

function extractBugfixes(
  prs: PullRequest[],
  issues: Issue[]
): BugFix[] {
  return prs
    .filter((pr) =>
      pr.labels.some((l) => l.toLowerCase().includes("bug"))
    )
    .map((pr) => {
      const relatedIssue = issues.find(
        (i) => i.title.toLowerCase().includes(pr.title.toLowerCase().split(" ")[0])
      );
      return {
        title: pr.title,
        pr,
        issue: relatedIssue || null,
        severity: determineBugSeverity(pr),
      };
    });
}

function determineBugSeverity(pr: PullRequest): BugFix["severity"] {
  if (pr.body?.toLowerCase().includes("critical")) return "critical";
  if (pr.labels.some((l) => l.toLowerCase().includes("critical"))) return "critical";
  if ((pr.commentCount || 0) > 10) return "high";
  if ((pr.commentCount || 0) > 3) return "medium";
  return "low";
}

function extractBreakingChanges(prs: PullRequest[]): BreakingChange[] {
  return prs
    .filter(
      (pr) =>
        pr.body?.toLowerCase().includes("breaking") ||
        pr.labels.some((l) => l.toLowerCase().includes("breaking"))
    )
    .map((pr) => ({
      title: pr.title,
      description: extractBreakingDescription(pr.body || ""),
      migration: "See migration guide in PR description",
      affectedAPIs: extractAffectedAPIs(pr.body || ""),
    }));
}

function extractBreakingDescription(body: string): string {
  const match = body.match(/breaking[:\s]+(.+?)(?=\n\n|$)/is);
  return match ? match[1] : "No description provided";
}

function extractAffectedAPIs(body: string): string[] {
  const apiMatches = body.match(/`[\w.]+`/g);
  return apiMatches ? [...new Set(apiMatches.map((m) => m.replace(/`/g, "")))] : [];
}

function extractKnownIssues(issues: Issue[]): Issue[] {
  return issues
    .filter((i) => i.labels.some((l) => l.toLowerCase().includes("known")))
    .slice(0, 5);
}

function generateChangelog(
  version: string,
  features: ReleaseFeature[],
  bugfixes: BugFix[],
  breakingChanges: BreakingChange[]
): string {
  const lines: string[] = [];
  lines.push(`## [${version}] - ${new Date().toISOString().split("T")[0]}`);

  if (breakingChanges.length > 0) {
    lines.push("");
    lines.push("### ⚠️ Breaking Changes");
    breakingChanges.forEach((change) => {
      lines.push(`- ${change.title}`);
    });
  }

  if (features.length > 0) {
    lines.push("");
    lines.push("### ✨ Features");
    features.forEach((feature) => {
      lines.push(`- ${feature.title} (@${feature.contributor})`);
    });
  }

  if (bugfixes.length > 0) {
    lines.push("");
    lines.push("### 🐛 Bug Fixes");
    bugfixes.forEach((fix) => {
      lines.push(`- ${fix.title}`);
    });
  }

  return lines.join("\n");
}

function generateReleaseChecklist(
  breakingChanges: BreakingChange[],
  bugfixes: BugFix[]
): ReleaseChecklistItem[] {
  const checklist: ReleaseChecklistItem[] = [
    { id: "tests", title: "All tests passing", completed: false, critical: true },
    { id: "docs", title: "Documentation updated", completed: false, critical: false },
    { id: "changelog", title: "Changelog generated", completed: false, critical: true },
    { id: "version", title: "Version bumped", completed: false, critical: true },
    { id: "release-notes", title: "Release notes drafted", completed: false, critical: false },
  ];

  if (breakingChanges.length > 0) {
    checklist.push({
      id: "migration",
      title: "Migration guide created",
      completed: false,
      critical: true,
    });
    checklist.push({
      id: "announce",
      title: "Breaking changes announced",
      completed: false,
      critical: true,
    });
  }

  const criticalBugs = bugfixes.filter((b) => b.severity === "critical");
  if (criticalBugs.length > 0) {
    checklist.push({
      id: "security-review",
      title: "Security review completed",
      completed: false,
      critical: true,
    });
  }

  return checklist;
}

export function getReleaseReadiness(report: ReleasePlan): {
  score: number;
  status: "ready" | "almost-ready" | "not-ready";
  blockers: string[];
} {
  const criticalItems = report.checklist.filter((item) => item.critical);
  const completedCritical = criticalItems.filter((item) => item.completed).length;
  const score = Math.round((completedCritical / criticalItems.length) * 100);

  const blockers = criticalItems
    .filter((item) => !item.completed)
    .map((item) => item.title);

  return {
    score,
    status: blockers.length === 0 ? "ready" : score > 50 ? "almost-ready" : "not-ready",
    blockers,
  };
}
