// Kanban Board for Issue/PR Management
import type { MaintainerAnalysis } from "./types";

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: KanbanItem[];
}

export interface KanbanItem {
  id: string;
  type: "issue" | "pull_request";
  title: string;
  number: number;
  state: string;
  labels: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  assignees: string[];
  priority: "high" | "medium" | "low";
  commentCount: number;
  url: string;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  stats: {
    total: number;
    open: number;
    closed: number;
    inProgress: number;
  };
}

export function getPriorityFromLabels(labels: string[]): KanbanItem["priority"] {
  const lowerLabels = labels.map(l => l.toLowerCase());
  if (lowerLabels.some(l => l.includes("urgent") || l.includes("critical") || l.includes("high priority"))) {
    return "high";
  }
  if (lowerLabels.some(l => l.includes("medium") || l.includes("normal"))) {
    return "medium";
  }
  return "low";
}

export function buildKanbanBoard(analysis: MaintainerAnalysis): KanbanBoard {
  const issues = analysis.inbox.issues.map(issue => ({
    id: `issue-${issue.number}`,
    type: "issue" as const,
    title: issue.title,
    number: issue.number,
    state: issue.state,
    labels: issue.labels,
    author: issue.author,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    assignees: issue.assignees,
    priority: getPriorityFromLabels(issue.labels),
    commentCount: issue.commentCount,
    url: issue.url,
  }));

  const prs = analysis.inbox.pullRequests.map(pr => ({
    id: `pr-${pr.number}`,
    type: "pull_request" as const,
    title: pr.title,
    number: pr.number,
    state: pr.state,
    labels: pr.labels,
    author: pr.author,
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
    assignees: pr.assignees,
    priority: getPriorityFromLabels(pr.labels),
    commentCount: pr.commentCount,
    url: pr.url,
  }));

  const allItems = [...issues, ...prs];

  const columns: KanbanColumn[] = [
    {
      id: "needs-review",
      title: "Needs Review",
      color: "border-yellow-500",
      items: allItems.filter(item => item.state === "open" && !item.assignees.length),
    },
    {
      id: "in-progress",
      title: "In Progress",
      color: "border-blue-500",
      items: allItems.filter(item => item.assignees.length > 0 && item.state === "open"),
    },
    {
      id: "waiting-response",
      title: "Waiting Response",
      color: "border-purple-500",
      items: allItems.filter(item => {
        // Items with recent comments but no response from maintainer
        return item.state === "open" && item.commentCount > 0;
      }),
    },
    {
      id: "closed",
      title: "Closed",
      color: "border-green-500",
      items: allItems.filter(item => item.state === "closed"),
    },
  ];

  return {
    columns,
    stats: {
      total: allItems.length,
      open: allItems.filter(i => i.state === "open").length,
      closed: allItems.filter(i => i.state === "closed").length,
      inProgress: allItems.filter(i => i.assignees.length > 0).length,
    },
  };
}

export function getPriorityColor(priority: KanbanItem["priority"]): string {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
  }
}

export function getPriorityLabel(priority: KanbanItem["priority"]): string {
  switch (priority) {
    case "high":
      return "High Priority";
    case "medium":
      return "Medium Priority";
    case "low":
      return "Low Priority";
  }
}
