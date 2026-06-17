/**
 * Issue Manager - Smart issue tracking and management
 */

export type IssueState = "open" | "closed" | "all";
export type IssuePriority = "low" | "medium" | "high" | "critical";
export type IssueType = "bug" | "feature" | "question" | "enhancement" | "documentation" | "help-wanted" | "good-first-issue";

export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  author: string;
  state: IssueState;
  type?: IssueType;
  priority?: IssuePriority;
  labels: string[];
  assignees: string[];
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
  comments: number;
  reactions?: Record<string, number>;
}

export interface IssueTemplate {
  name: string;
  description: string;
  title?: string;
  body: string[];
  labels?: string[];
  assignees?: string[];
}

export interface IssueSearch {
  query: string;
  filters: IssueSearchFilters;
  sort: IssueSort;
  results: Issue[];
}

export interface IssueSearchFilters {
  state?: IssueState;
  type?: IssueType;
  priority?: IssuePriority;
  labels?: string[];
  assignees?: string[];
  author?: string;
  createdAfter?: number;
  updatedAfter?: number;
  hasAssignee?: boolean;
  noAssignee?: boolean;
}

export type IssueSort = "created" | "updated" | "comments" | "reactions";

const TYPE_LABELS: Record<IssueType, string> = {
  bug: "bug",
  feature: "enhancement",
  question: "question",
  enhancement: "enhancement",
  documentation: "documentation",
  "help-wanted": "help wanted",
  "good-first-issue": "good first issue",
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  critical: "priority: critical",
  high: "priority: high",
  medium: "priority: medium",
  low: "priority: low",
};

/**
 * Parse issue from GitHub API format
 */
export function parseIssue(data: any): Issue {
  return {
    id: data.id?.toString() || `issue_${Date.now()}`,
    number: data.number || 0,
    title: data.title || "",
    body: data.body || "",
    author: data.user?.login || data.author?.login || "unknown",
    state: data.state === "closed" ? "closed" : "open",
    labels: data.labels?.map((l: any) => l.name) || [],
    assignees: data.assignees?.map((a: any) => a.login) || [],
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    closedAt: data.closed_at ? new Date(data.closed_at).getTime() : undefined,
    comments: data.comments || 0,
    reactions: data.reactions ? {
      "+1": data.reactions["+1"] || 0,
      "-1": data.reactions["-1"] || 0,
      heart: data.reactions.heart || 0,
      rocket: data.reactions.rocket || 0,
    } : undefined,
  };
}

/**
 * Detect issue type from content
 */
export function detectIssueType(issue: Issue): IssueType | null {
  const title = issue.title.toLowerCase();
  const body = issue.body.toLowerCase();
  const combined = title + " " + body;

  if (combined.includes("bug") || combined.includes("crash") || combined.includes("error")) {
    return "bug";
  }
  if (combined.includes("feature") || combined.includes("would be nice") || combined.includes("add ")) {
    return "feature";
  }
  if (combined.includes("?") || combined.includes("how to") || combined.includes("question")) {
    return "question";
  }
  if (combined.includes("docs") || combined.includes("documentation") || combined.includes("readme")) {
    return "documentation";
  }
  if (combined.includes("help") || combined.includes("need assistance") || combined.includes("stuck")) {
    return "help-wanted";
  }
  if (combined.includes("easy") || combined.includes("beginner") || combined.includes("starter")) {
    return "good-first-issue";
  }

  return null;
}

/**
 * Detect priority from content and reactions
 */
export function detectPriority(issue: Issue): IssuePriority {
  const title = issue.title.toLowerCase();
  const body = issue.body.toLowerCase();
  const combined = title + " " + body;

  // Check for critical indicators
  if (
    combined.includes("critical") ||
    combined.includes("urgent") ||
    combined.includes("security") ||
    combined.includes("data loss") ||
    combined.includes("production down")
  ) {
    return "critical";
  }

  // Check for high priority indicators
  if (
    combined.includes("high priority") ||
    combined.includes("important") ||
    combined.includes("broken") ||
    combined.includes("blocked")
  ) {
    return "high";
  }

  // Check reactions for community priority
  const upvotes = issue.reactions?.["+1"] || 0;
  if (upvotes >= 10) return "high";
  if (upvotes >= 5) return "medium";

  return "medium";
}

/**
 * Generate issue title suggestions
 */
export function suggestIssueTitle(type: IssueType, description: string): string {
  const suggestions: Record<IssueType, string[]> = {
    bug: [
      `Bug: ${description.slice(0, 50)}`,
      `Fix: ${description.slice(0, 50)}`,
      `${description.slice(0, 50)} not working`,
    ],
    feature: [
      `Feature: ${description.slice(0, 50)}`,
      `Add ${description.slice(0, 50)}`,
      `Implement ${description.slice(0, 50)}`,
    ],
    question: [
      `Question: ${description.slice(0, 50)}`,
      `How to ${description.slice(0, 50)}?`,
    ],
    enhancement: [
      `Enhancement: ${description.slice(0, 50)}`,
      `Improve ${description.slice(0, 50)}`,
    ],
    documentation: [
      `Docs: ${description.slice(0, 50)}`,
      `Document ${description.slice(0, 50)}`,
    ],
    "help-wanted": [
      `Help needed: ${description.slice(0, 50)}`,
      `Assistance required for ${description.slice(0, 50)}`,
    ],
    "good-first-issue": [
      `Good first issue: ${description.slice(0, 50)}`,
      `Starter task: ${description.slice(0, 50)}`,
    ],
  };

  return suggestions[type]?.[0] || description.slice(0, 100);
}

/**
 * Search issues with filters
 */
export function searchIssues(issues: Issue[], filters: IssueSearchFilters): Issue[] {
  return issues.filter(issue => {
    if (filters.state && issue.state !== filters.state) return false;
    if (filters.type) {
      const detectedType = detectIssueType(issue);
      if (detectedType !== filters.type) return false;
    }
    if (filters.priority) {
      const detectedPriority = detectPriority(issue);
      if (detectedPriority !== filters.priority) return false;
    }
    if (filters.labels && filters.labels.length > 0) {
      if (!filters.labels.some(l => issue.labels.includes(l))) return false;
    }
    if (filters.assignees && filters.assignees.length > 0) {
      if (!filters.assignees.some(a => issue.assignees.includes(a))) return false;
    }
    if (filters.author && issue.author !== filters.author) return false;
    if (filters.createdAfter && issue.createdAt < filters.createdAfter) return false;
    if (filters.updatedAfter && issue.updatedAt < filters.updatedAfter) return false;
    if (filters.hasAssignee && issue.assignees.length === 0) return false;
    if (filters.noAssignee && issue.assignees.length > 0) return false;

    return true;
  });
}

/**
 * Sort issues
 */
export function sortIssues(issues: Issue[], sort: IssueSort, ascending = false): Issue[] {
  const sorted = [...issues].sort((a, b) => {
    let comparison = 0;

    switch (sort) {
      case "created":
        comparison = a.createdAt - b.createdAt;
        break;
      case "updated":
        comparison = a.updatedAt - b.updatedAt;
        break;
      case "comments":
        comparison = a.comments - b.comments;
        break;
      case "reactions":
        const aReactions = Object.values(a.reactions || {}).reduce((sum, v) => sum + v, 0);
        const bReactions = Object.values(b.reactions || {}).reduce((sum, v) => sum + v, 0);
        comparison = aReactions - bReactions;
        break;
    }

    return ascending ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Create standard issue templates
 */
export function createStandardTemplates(): IssueTemplate[] {
  return [
    {
      name: "Bug Report",
      description: "Report a bug in the project",
      body: [
        "## Bug Description",
        "[Describe the bug clearly and concisely]",
        "",
        "## Steps to Reproduce",
        "1. [First step]",
        "2. [Second step]",
        "3. [And so on...]",
        "",
        "## Expected Behavior",
        "[What you expected to happen]",
        "",
        "## Actual Behavior",
        "[What actually happened]",
        "",
        "## Screenshots/Logs",
        "[If applicable, add screenshots or logs]",
        "",
        "## Environment",
        "- OS: [e.g., macOS, Windows, Linux]",
        "- Version: [e.g., 1.0.0]",
      ],
      labels: ["bug"],
    },
    {
      name: "Feature Request",
      description: "Suggest a new feature or enhancement",
      body: [
        "## Feature Description",
        "[Describe the feature you want to add]",
        "",
        "## Problem it Solves",
        "[What problem does this feature solve?]",
        "",
        "## Proposed Solution",
        "[Describe your proposed solution]",
        "",
        "## Alternatives Considered",
        "[Describe any alternative solutions you've considered]",
        "",
        "## Additional Context",
        "[Add any other context about the feature request]",
      ],
      labels: ["enhancement"],
    },
    {
      name: "Question",
      description: "Ask a question about the project",
      body: [
        "## Question",
        "[Your question here]",
        "",
        "## Context",
        "[Provide context for your question]",
        "",
        "## What I've Tried",
        "[If applicable, describe what you've already tried]",
      ],
      labels: ["question"],
    },
    {
      name: "Good First Issue",
      description: "For new contributors - a good first issue to work on",
      body: [
        "## Description",
        "[Description of the issue]",
        "",
        "## Hints/Tips",
        "[Any helpful hints for solving this issue]",
        "",
        "## Related Files",
        "[List any related files that might need to be modified]",
        "",
        "## Expected Outcome",
        "[What the expected result should be]",
      ],
      labels: ["good first issue", "help wanted"],
    },
  ];
}

/**
 * Calculate issue statistics
 */
export function calculateIssueStats(issues: Issue[]): {
  total: number;
  open: number;
  closed: number;
  byType: Record<IssueType, number>;
  byPriority: Record<IssuePriority, number>;
  unassigned: number;
  avgResponseTime?: number;
  avgResolutionTime?: number;
} {
  const open = issues.filter(i => i.state === "open");
  const closed = issues.filter(i => i.state === "closed");

  const byType: Record<IssueType, number> = {
    bug: 0, feature: 0, question: 0, enhancement: 0,
    documentation: 0, "help-wanted": 0, "good-first-issue": 0,
  };

  const byPriority: Record<IssuePriority, number> = {
    low: 0, medium: 0, high: 0, critical: 0,
  };

  for (const issue of issues) {
    const type = detectIssueType(issue);
    if (type) byType[type]++;

    const priority = detectPriority(issue);
    byPriority[priority]++;
  }

  const unassigned = open.filter(i => i.assignees.length === 0).length;

  // Calculate average response time (time from creation to first comment)
  // This is simplified - real implementation would need comment timestamps
  const avgResponseTime = undefined;

  // Calculate average resolution time
  const resolutionTimes = closed
    .filter(i => i.closedAt)
    .map(i => (i.closedAt! - i.createdAt) / (1000 * 60 * 60 * 24)); // days

  const avgResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
    : undefined;

  return {
    total: issues.length,
    open: open.length,
    closed: closed.length,
    byType,
    byPriority,
    unassigned,
    avgResponseTime,
    avgResolutionTime,
  };
}

/**
 * Suggest issue labels based on content
 */
export function suggestLabels(issue: Issue): string[] {
  const labels: string[] = [];
  const title = issue.title.toLowerCase();
  const body = issue.body.toLowerCase();
  const combined = title + " " + body;

  // Type labels
  if (combined.includes("bug") || combined.includes("crash")) {
    labels.push("bug");
  }
  if (combined.includes("feature") || combined.includes("request")) {
    labels.push("enhancement");
  }
  if (combined.includes("question") || combined.includes("?")) {
    labels.push("question");
  }
  if (combined.includes("docs") || combined.includes("documentation")) {
    labels.push("documentation");
  }
  if (combined.includes("security") || combined.includes("vulnerability")) {
    labels.push("security");
  }
  if (combined.includes("performance") || combined.includes("slow")) {
    labels.push("performance");
  }

  // Priority labels
  if (combined.includes("critical") || combined.includes("urgent")) {
    labels.push("priority: critical");
  }
  if (combined.includes("high priority") || combined.includes("important")) {
    labels.push("priority: high");
  }

  // Difficulty labels
  if (combined.includes("easy") || combined.includes("beginner") || combined.includes("starter")) {
    labels.push("good first issue");
  }
  if (combined.includes("help") || combined.includes("assistance")) {
    labels.push("help wanted");
  }

  // Platform labels
  if (combined.includes("windows")) labels.push("windows");
  if (combined.includes("macos") || combined.includes("mac os")) labels.push("macos");
  if (combined.includes("linux")) labels.push("linux");

  return [...new Set(labels)]; // Remove duplicates
}
