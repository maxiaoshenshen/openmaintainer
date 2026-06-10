// Kanban Board View for Issues and PRs
import type { MaintainerAnalysis } from "./types";

export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  items: BoardItem[];
}

export interface BoardItem {
  id: string;
  type: "issue" | "pr";
  title: string;
  number: number;
  author: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  comments: number;
  priority: "high" | "medium" | "low";
  assignee?: string;
  url: string;
}

export type Priority = "high" | "medium" | "low";

export function getPriorityFromLabels(labels: string[]): Priority {
  const labelLower = labels.map(l => l.toLowerCase());
  if (labelLower.some(l => l.includes("urgent") || l.includes("critical") || l.includes("p0"))) {
    return "high";
  }
  if (labelLower.some(l => l.includes("medium") || l.includes("p1") || l.includes("enhancement"))) {
    return "medium";
  }
  return "low";
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    high: "border-l-red-500",
    medium: "border-l-yellow-500",
    low: "border-l-green-500",
  };
  return colors[priority];
}

export function getPriorityBgColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    high: "bg-red-500/10 text-red-400",
    medium: "bg-yellow-500/10 text-yellow-400",
    low: "bg-green-500/10 text-green-400",
  };
  return colors[priority];
}

export function buildBoardFromAnalysis(analysis: MaintainerAnalysis): BoardColumn[] {
  const issues: Array<{ number: number; title: string; author: string; labels: string[]; createdAt: string; updatedAt: string; comments: number; assignee?: string; url: string; state: string }> = analysis.inbox.issues || [];
  const pullRequests: Array<{ number: number; title: string; author: string; labels: string[]; createdAt: string; updatedAt: string; comments: number; assignee?: string; url: string; state: string; additions: number; deletions: number; changedFiles: number }> = analysis.inbox.pullRequests || [];
  
  // Group by state
  const columns: Record<string, BoardItem[]> = {
    "needs-triage": [],
    "in-progress": [],
    "needs-review": [],
    "blocked": [],
    "resolved": [],
  };

  // Categorize issues
  issues.forEach(issue => {
    const item: BoardItem = {
      id: `issue-${issue.number}`,
      type: "issue",
      title: issue.title,
      number: issue.number,
      author: issue.author,
      labels: issue.labels,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      comments: issue.commentCount,
      priority: getPriorityFromLabels(issue.labels),
      assignee: issue.assignee,
      url: issue.url,
    };

    // Simple categorization based on labels and state
    const labels = issue.labels.map(l => l.toLowerCase());
    if (labels.some(l => l.includes("blocked") || l.includes("waiting"))) {
      columns["blocked"].push(item);
    } else if (labels.some(l => l.includes("in-progress") || l.includes("doing"))) {
      columns["in-progress"].push(item);
    } else if (labels.some(l => l.includes("needs-review") || l.includes("pr-review"))) {
      columns["needs-review"].push(item);
    } else if (issue.state === "closed" || labels.some(l => l.includes("resolved") || l.includes("done"))) {
      columns["resolved"].push(item);
    } else {
      columns["needs-triage"].push(item);
    }
  });

  // Categorize PRs
  pullRequests.forEach(pr => {
    const item: BoardItem = {
      id: `pr-${pr.number}`,
      type: "pr",
      title: pr.title,
      number: pr.number,
      author: pr.author,
      labels: pr.labels,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
      comments: pr.commentCount,
      priority: getPriorityFromLabels(pr.labels),
      assignee: pr.assignee,
      url: pr.url,
    };

    const labels = pr.labels.map(l => l.toLowerCase());
    if (labels.some(l => l.includes("blocked") || l.includes("waiting"))) {
      columns["blocked"].push(item);
    } else if (labels.some(l => l.includes("changes-requested") || l.includes("review"))) {
      columns["needs-review"].push(item);
    } else if (pr.state === "merged" || pr.state === "closed") {
      columns["resolved"].push(item);
    } else if (pr.state === "open") {
      columns["needs-triage"].push(item);
    }
  });

  // Sort items by priority within each column
  Object.values(columns).forEach(items => {
    items.sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  });

  return [
    { id: "needs-triage", title: "Needs Triage", color: "border-l-blue-500", items: columns["needs-triage"] },
    { id: "in-progress", title: "In Progress", color: "border-l-purple-500", items: columns["in-progress"] },
    { id: "needs-review", title: "Needs Review", color: "border-l-orange-500", items: columns["needs-review"] },
    { id: "blocked", title: "Blocked", color: "border-l-red-500", items: columns["blocked"] },
    { id: "resolved", title: "Resolved", color: "border-l-green-500", items: columns["resolved"] },
  ];
}

export function countBoardItems(columns: BoardColumn[]): Record<string, number> {
  return columns.reduce((acc, col) => {
    acc[col.id] = col.items.length;
    return acc;
  }, {} as Record<string, number>);
}
