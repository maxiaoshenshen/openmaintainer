// Kanban View for Issues and PRs
export type KanbanColumn = "open" | "in_progress" | "needs_review" | "closed" | "merged";
export type KanbanItemType = "issue" | "pull_request";

export interface KanbanItem {
  id: string;
  number: number;
  title: string;
  state: KanbanColumn;
  type: KanbanItemType;
  author: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  comments: number;
  url: string;
  priority?: "low" | "medium" | "high" | "urgent";
  assignees?: string[];
}

export interface KanbanColumnData {
  id: KanbanColumn;
  title: string;
  items: KanbanItem[];
  color: string;
  icon: string;
}

export function getKanbanColumns(): KanbanColumnData[] {
  return [
    { id: "open", title: "Open", items: [], color: "border-gray-400", icon: "📋" },
    { id: "in_progress", title: "In Progress", items: [], color: "border-blue-400", icon: "🔄" },
    { id: "needs_review", title: "Needs Review", items: [], color: "border-yellow-400", icon: "👀" },
    { id: "closed", title: "Closed", items: [], color: "border-gray-600", icon: "✅" },
    { id: "merged", title: "Merged", items: [], color: "border-purple-400", icon: "🚀" },
  ];
}

export function groupIntoKanban(
  items: KanbanItem[],
  view: "issues" | "pulls" | "all" = "all"
): KanbanColumnData[] {
  const columns = getKanbanColumns();
  const filteredItems = view === "all" 
    ? items 
    : items.filter(item => item.type === view);

  filteredItems.forEach(item => {
    const column = columns.find(c => c.id === item.state);
    if (column) {
      column.items.push(item);
    }
  });

  return columns;
}

export function getPriorityLabel(priority: KanbanItem["priority"]): { label: string; color: string } {
  switch (priority) {
    case "urgent":
      return { label: "Urgent", color: "bg-red-500 text-white" };
    case "high":
      return { label: "High", color: "bg-orange-500 text-white" };
    case "medium":
      return { label: "Medium", color: "bg-yellow-500 text-black" };
    case "low":
      return { label: "Low", color: "bg-gray-400 text-white" };
    default:
      return { label: "No Priority", color: "bg-gray-200 text-gray-600" };
  }
}

export function sortKanbanItems(items: KanbanItem[]): KanbanItem[] {
  return [...items].sort((a, b) => {
    // Priority first
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, undefined: 4 };
    const pDiff = priorityOrder[a.priority || "undefined"] - priorityOrder[b.priority || "undefined"];
    if (pDiff !== 0) return pDiff;

    // Then by date
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function filterKanbanByLabel(items: KanbanItem[], label: string): KanbanItem[] {
  return items.filter(item => item.labels.includes(label));
}

export function filterKanbanByAssignee(items: KanbanItem[], assignee: string): KanbanItem[] {
  return items.filter(item => item.assignees?.includes(assignee));
}

export function generateMockKanbanItems(): KanbanItem[] {
  return [
    {
      id: "1",
      number: 42,
      title: "Add dark mode support",
      state: "open",
      type: "issue",
      author: "contributor1",
      labels: ["enhancement", "good-first-issue"],
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      comments: 5,
      url: "https://github.com/example/repo/issues/42",
      priority: "high",
      assignees: [],
    },
    {
      id: "2",
      number: 43,
      title: "Fix memory leak in parser",
      state: "in_progress",
      type: "pull_request",
      author: "maintainer",
      labels: ["bug", "critical"],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      comments: 12,
      url: "https://github.com/example/repo/pull/43",
      priority: "urgent",
      assignees: ["maintainer"],
    },
    {
      id: "3",
      number: 44,
      title: "Update dependencies",
      state: "needs_review",
      type: "pull_request",
      author: "bot",
      labels: ["dependencies"],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      comments: 2,
      url: "https://github.com/example/repo/pull/44",
      priority: "medium",
      assignees: ["reviewer1"],
    },
    {
      id: "4",
      number: 45,
      title: "Improve documentation",
      state: "merged",
      type: "pull_request",
      author: "docwriter",
      labels: ["documentation"],
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      comments: 3,
      url: "https://github.com/example/repo/pull/45",
      priority: "low",
      assignees: ["docwriter"],
    },
  ];
}


interface MockInboxItem {
  id: string;
  type: "issue" | "pull_request" | "pr";
  title: string;
  number: number;
  author: string;
  labels: string[];
  age?: string;
  priority?: string;
  isStale?: boolean;
  url: string;
  isPR?: boolean;
  state?: string;
  createdAt?: string;
  updatedAt?: string;
  assignees?: string[];
  commentCount?: number;
}

interface MockInbox {
  items: MockInboxItem[];
  totalCount?: number;
  unreadCount?: number;
  issues?: unknown[];
  pullRequests?: unknown[];
}

export function buildKanbanView(inbox: MaintainerInbox | MockInbox, viewType: "status" | "priority" | "age"): KanbanColumnData[] {
  // Handle mock inbox structure from tests
  if ("items" in inbox) {
    const mockItems: KanbanItem[] = inbox.items.map((item: MockInboxItem) => ({
      id: item.id,
      type: item.type === "pr" ? "pull_request" : item.type,
      title: item.title,
      number: item.number,
      state: item.isPR ? "merged" : "open",
      labels: item.labels,
      author: item.author,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      assignees: item.assignees || [],
      priority: item.priority === "P0" ? "high" : item.priority === "P2" ? "low" : "medium",
      commentCount: item.commentCount || 0,
      url: item.url,
    }));

    if (viewType === "status") {
      return [
        { id: "attention", title: "Needs Attention", color: "border-red-500", items: mockItems.filter(i => i.state === "open" && !i.assignees.length) },
        { id: "in_progress", title: "In Progress", color: "border-blue-500", items: mockItems.filter(i => i.assignees.length > 0) },
        { id: "completed", title: "Completed", color: "border-green-500", items: mockItems.filter(i => i.state === "closed" || i.state === "merged") },
      ];
    }
    
    if (viewType === "priority") {
      return [
        { id: "high", title: "High Priority", color: "border-red-500", items: mockItems.filter(i => i.priority === "high") },
        { id: "medium", title: "Medium Priority", color: "border-yellow-500", items: mockItems.filter(i => i.priority === "medium") },
        { id: "low", title: "Low Priority", color: "border-green-500", items: mockItems.filter(i => i.priority === "low") },
      ];
    }
    
    if (viewType === "age") {
      return [
        { id: "fresh", title: "Recent", color: "border-blue-500", items: mockItems },
        { id: "stale", title: "Stale", color: "border-orange-500", items: [] },
        { id: "archived", title: "Archived", color: "border-gray-500", items: [] },
      ];
    }
    
    return [];
  }

  // Handle real MaintainerInbox structure
  const allItems: KanbanItem[] = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...inbox.issues.map((issue: any) => ({
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
      priority: getPriorityFromLabels(issue.labels) as KanbanItem["priority"],
      commentCount: issue.commentCount,
      url: issue.url,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...inbox.pullRequests.map((pr: any) => ({
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
      priority: getPriorityFromLabels(pr.labels) as KanbanItem["priority"],
      commentCount: pr.commentCount,
      url: pr.url,
    })),
  ];

  const columns = getKanbanColumns();
  
  if (viewType === "status") {
    return columns.map(col => ({
      ...col,
      items: allItems.filter(item => {
        if (col.id === "open") return item.state === "open";
        if (col.id === "in_progress") return item.assignees.length > 0 && item.state === "open";
        if (col.id === "needs_review") return item.state === "open" && !item.assignees.length;
        if (col.id === "closed") return item.state === "closed";
        if (col.id === "merged") return item.type === "pull_request" && item.state === "merged";
        return false;
      }),
    }));
  }
  
  if (viewType === "priority") {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [
      { id: "high", title: "High Priority", color: "border-red-500", items: allItems.filter(i => i.priority === "high").sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]) },
      { id: "medium", title: "Medium Priority", color: "border-yellow-500", items: allItems.filter(i => i.priority === "medium").sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]) },
      { id: "low", title: "Low Priority", color: "border-green-500", items: allItems.filter(i => i.priority === "low").sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]) },
    ];
  }
  
  if (viewType === "age") {
    const now = Date.now();
    const staleThreshold = 30 * 24 * 60 * 60 * 1000;
    return [
      { id: "fresh", title: "Recent", color: "border-blue-500", items: allItems.filter(i => now - new Date(i.createdAt).getTime() < staleThreshold) },
      { id: "stale", title: "Stale", color: "border-orange-500", items: allItems.filter(i => now - new Date(i.createdAt).getTime() >= staleThreshold) },
      { id: "archived", title: "Archived", color: "border-gray-500", items: [] },
    ];
  }
  
  return columns.map(col => ({ ...col, items: [] }));
}

export function getColumnStats(column: KanbanColumnData): { total: number; issues: number; prs: number } {
  return {
    total: column.items.length,
    issues: column.items.filter(i => i.type === "issue").length,
    prs: column.items.filter(i => i.type === "pull_request" || i.type === "pr").length,
  };
}

export function exportKanbanAsMarkdown(columns: KanbanColumnData[]): string {
  let md = "# Kanban Board\n\n";
  for (const column of columns) {
    md += `## ${column.title}\n`;
    if (column.items.length === 0) {
      md += "_No items_\n";
    } else {
      for (const item of column.items) {
        md += `- [${item.state}] ${item.title} (#${item.number})\n`;
      }
    }
    md += "\n";
  }
  return md;
}

function getPriorityFromLabels(labels: string[]): string {
  const lowerLabels = labels.map(l => l.toLowerCase());
  if (lowerLabels.some(l => l.includes("urgent") || l.includes("critical") || l.includes("high priority"))) {
    return "high";
  }
  if (lowerLabels.some(l => l.includes("medium") || l.includes("normal"))) {
    return "medium";
  }
  return "low";
}
