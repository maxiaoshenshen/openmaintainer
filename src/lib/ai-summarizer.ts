/**
 * AI-Powered Issue/PR Summarizer
 * Generate concise summaries for issues and pull requests
 */

import type { MaintainerIssue, MaintainerPullRequest } from "./types";

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

// Extract key information from issue body
function extractKeyPoints(title: string, body: string, labels: string[]): string[] {
  const points: string[] = [];
  
  // Extract potential error messages
  const errorMatches = body.match(/Error[:\s]+([^\n]{10,80})/gi) || [];
  errorMatches.slice(0, 2).forEach(match => points.push(match.substring(0, 60)));
  
  // Extract potential steps to reproduce
  if (body.toLowerCase().includes("step") || body.toLowerCase().includes("reproduce")) {
    points.push("Steps to reproduce provided");
  }
  
  // Extract version/platform info
  const versionMatch = body.match(/(?:version|os|platform)[:\s]+([^\n]{5,30})/gi);
  if (versionMatch) {
    versionMatch.slice(0, 1).forEach(match => points.push(match.substring(0, 50)));
  }
  
  // Add labels as indicators
  if (labels.some(l => l.toLowerCase().includes("bug"))) {
    points.push("Bug report - requires investigation");
  }
  if (labels.some(l => l.toLowerCase().includes("feature"))) {
    points.push("Feature request - needs evaluation");
  }
  if (labels.some(l => l.toLowerCase().includes("enhancement"))) {
    points.push("Enhancement proposal");
  }
  
  return [...new Set(points)].slice(0, 4);
}

// Determine sentiment from text
function analyzeSentiment(title: string, body: string): "positive" | "neutral" | "negative" | "urgent" {
  const combined = (title + " " + body).toLowerCase();
  
  const urgentKeywords = ["critical", "urgent", "asap", "blocking", "production down", "broken"];
  if (urgentKeywords.some(k => combined.includes(k))) return "urgent";
  
  const negativeKeywords = ["doesn't work", "fails", "error", "crash", "broken", "wrong", "issue", "problem", "disappointed"];
  if (negativeKeywords.some(k => combined.includes(k))) return "negative";
  
  const positiveKeywords = ["thank", "great", "awesome", "love", "nice", "helpful", "works well"];
  if (positiveKeywords.some(k => combined.includes(k))) return "positive";
  
  return "neutral";
}

// Estimate effort
function estimateEffort(title: string, body: string, pr?: { additions: number; deletions: number }): "low" | "medium" | "high" {
  if (pr) {
    const changes = pr.additions + pr.deletions;
    if (changes < 50) return "low";
    if (changes < 300) return "medium";
    return "high";
  }
  
  const combined = (title + " " + body).toLowerCase();
  if (combined.length < 100) return "low";
  if (combined.length < 500) return "medium";
  return "high";
}

// Categorize issue
function categorizeIssue(labels: string[], title: string, body: string): string {
  const labelLower = labels.map(l => l.toLowerCase());
  
  if (labelLower.some(l => l.includes("bug") || l.includes("fix"))) return "bug";
  if (labelLower.some(l => l.includes("feature") || l.includes("enhancement"))) return "feature";
  if (labelLower.some(l => l.includes("question") || l.includes("help"))) return "question";
  if (labelLower.some(l => l.includes("docs") || l.includes("documentation"))) return "docs";
  if (labelLower.some(l => l.includes("performance") || l.includes("optimization"))) return "performance";
  
  // Heuristic from content
  const combined = (title + " " + body).toLowerCase();
  if (combined.includes("how") || combined.includes("?")) return "question";
  if (combined.includes("would be nice") || combined.includes("suggest")) return "feature";
  if (combined.includes("crash") || combined.includes("error")) return "bug";
  
  return "general";
}

// Generate brief summary for issue
function summarizeIssue(issue: MaintainerIssue): SummarizedItem {
  const keyPoints = extractKeyPoints(issue.title, issue.body, issue.labels);
  const sentiment = analyzeSentiment(issue.title, issue.body);
  const effort = estimateEffort(issue.title, issue.body);
  
  // Generate concise summary
  let summary = issue.title;
  if (issue.body.length > 0) {
    const firstLine = issue.body.split("\n").find(l => l.trim().length > 20);
    if (firstLine) {
      summary = issue.title + ": " + firstLine.substring(0, 80) + (firstLine.length > 80 ? "..." : "");
    }
  }
  
  // Determine if action needed
  const actionNeeded = sentiment === "urgent" || 
    (issue.state === "open" && issue.labels.length === 0) ||
    (issue.comments === 0 && !issue.body.includes("?"));
  
  // Suggest labels based on content
  const suggestedLabels: string[] = [];
  if (sentiment === "urgent") suggestedLabels.push("priority:critical");
  if (issue.labels.length === 0) suggestedLabels.push("needs-triage");
  if (issue.comments > 0) suggestedLabels.push("waiting-for-maintainer");
  
  return {
    id: `issue-${issue.number}`,
    type: "issue",
    number: issue.number,
    title: issue.title,
    summary,
    keyPoints,
    actionNeeded,
    suggestedLabels,
    sentiment,
    effort
  };
}

// Generate summary for PR
function summarizePR(pr: MaintainerPullRequest): SummarizedItem {
  const sentiment = analyzeSentiment(pr.title, pr.body);
  const effort = estimateEffort(pr.title, pr.body, { additions: pr.additions, deletions: pr.deletions });
  
  // Generate concise summary
  let summary = pr.title;
  if (pr.body && pr.body.length > 0) {
    const firstLine = pr.body.split("\n").find(l => l.trim().length > 20);
    if (firstLine) {
      summary = pr.title + ": " + firstLine.substring(0, 80) + (firstLine.length > 80 ? "..." : "");
    }
  }
  
  // Determine action needed
  const actionNeeded = pr.state === "open" && (
    pr.reviewStatus === "pending" ||
    !pr.reviewStatus ||
    pr.reviewStatus === "changes_requested"
  );
  
  // Suggest labels
  const suggestedLabels: string[] = [];
  if (pr.isDraft) suggestedLabels.push("status:draft");
  if (pr.additions > 500) suggestedLabels.push("size:large");
  else if (pr.additions > 100) suggestedLabels.push("size:medium");
  else suggestedLabels.push("size:small");
  if (pr.state === "merged") suggestedLabels.push("status:merged");
  
  return {
    id: `pr-${pr.number}`,
    type: "pr",
    number: pr.number,
    title: pr.title,
    summary,
    keyPoints: [
      `+${pr.additions} -${pr.deletions} lines`,
      `${pr.changedFiles} files changed`,
      pr.mergeable === "mergeable" ? "Ready to merge" : pr.mergeable === "behind" ? "Needs rebase" : "Has conflicts"
    ],
    actionNeeded,
    suggestedLabels,
    sentiment,
    effort
  };
}

// Batch summarize multiple items
export function summarizeItems(issues: MaintainerIssue[], prs: MaintainerPullRequest[]): BatchSummary {
  const items = [
    ...issues.map(summarizeIssue),
    ...prs.map(summarizePR)
  ];
  
  // Sort by priority: urgent > needs-action > others
  items.sort((a, b) => {
    if (a.sentiment === "urgent" && b.sentiment !== "urgent") return -1;
    if (b.sentiment === "urgent" && a.sentiment !== "urgent") return 1;
    if (a.actionNeeded && !b.actionNeeded) return -1;
    if (b.actionNeeded && !a.actionNeeded) return 1;
    return 0;
  });
  
  const categoryBreakdown: Record<string, number> = {};
  items.forEach(item => {
    const category = categorizeIssue(
      item.suggestedLabels,
      item.title,
      ""
    );
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
  });
  
  return {
    items,
    totalCount: items.length,
    urgentCount: items.filter(i => i.sentiment === "urgent").length,
    actionRequiredCount: items.filter(i => i.actionNeeded).length,
    categoryBreakdown
  };
}

// Get top priority items
export function getPriorityItems(issues: MaintainerIssue[], prs: MaintainerPullRequest[], limit: number = 5): SummarizedItem[] {
  const summary = summarizeItems(issues, prs);
  return summary.items.slice(0, limit);
}
