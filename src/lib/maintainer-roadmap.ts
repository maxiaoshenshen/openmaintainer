/**
 * Maintainer Roadmap - Plan and track project evolution
 */

export type RoadmapStatus = "planning" | "planned" | "in-progress" | "completed" | "cancelled" | "deferred";
export type RoadmapPriority = "low" | "medium" | "high" | "critical";
export type RoadmapCategory = "feature" | "improvement" | "bugfix" | "documentation" | "infrastructure" | "research";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  priority: RoadmapPriority;
  category: RoadmapCategory;
  targetVersion?: string;
  estimatedEffort?: number; // story points
  actualEffort?: number;
  assignees: string[];
  labels: string[];
  relatedIssues: number[];
  relatedPRs: number[];
  dependencies: string[]; // IDs of blocking items
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  milestone?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate?: number;
  items: string[]; // RoadmapItem IDs
  status: RoadmapStatus;
  progress: number; // 0-100
}

export interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  startDate?: number;
  endDate?: number;
  milestones: Milestone[];
  items: RoadmapItem[];
}

export interface RoadmapMetrics {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  plannedItems: number;
  completionRate: number;
  averageCycleTime: number; // days
  velocity: number; // points per sprint
  itemsByCategory: Record<RoadmapCategory, number>;
  itemsByPriority: Record<RoadmapPriority, number>;
}

/**
 * Create a new roadmap item
 */
export function createRoadmapItem(
  params: Omit<RoadmapItem, "id" | "createdAt" | "updatedAt" | "labels" | "relatedIssues" | "relatedPRs" | "dependencies" | "assignees">
): RoadmapItem {
  return {
    ...params,
    id: `roadmap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    labels: [],
    relatedIssues: [],
    relatedPRs: [],
    dependencies: [],
    assignees: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Update roadmap item status
 */
export function updateRoadmapStatus(
  item: RoadmapItem,
  newStatus: RoadmapStatus
): RoadmapItem {
  const updated = { ...item, status: newStatus, updatedAt: Date.now() };
  
  if (newStatus === "in-progress" && !item.startedAt) {
    updated.startedAt = Date.now();
  }
  
  if (newStatus === "completed" && !item.completedAt) {
    updated.completedAt = Date.now();
  }
  
  return updated;
}

/**
 * Calculate roadmap metrics
 */
export function calculateRoadmapMetrics(items: RoadmapItem[]): RoadmapMetrics {
  const completed = items.filter(i => i.status === "completed");
  const inProgress = items.filter(i => i.status === "in-progress");
  const planned = items.filter(i => i.status === "planning" || i.status === "planned");
  
  // Calculate average cycle time
  const completedWithDuration = completed.filter(i => i.startedAt && i.completedAt);
  const cycleTimes = completedWithDuration.map(
    i => (i.completedAt! - i.startedAt!) / (24 * 60 * 60 * 1000)
  );
  const averageCycleTime = cycleTimes.length > 0
    ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
    : 0;
  
  // Calculate velocity (points completed per "sprint" - approximated as 2 weeks)
  const totalPoints = completed.reduce((sum, i) => sum + (i.estimatedEffort || 0), 0);
  const daysSinceFirst = completed.length > 0 && completed[0].completedAt
    ? (Date.now() - completed[0].completedAt!) / (24 * 60 * 60 * 1000)
    : 14;
  const sprints = Math.max(1, Math.floor(daysSinceFirst / 14));
  const velocity = totalPoints / sprints;
  
  // Count by category
  const itemsByCategory = {} as Record<RoadmapCategory, number>;
  for (const item of items) {
    itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + 1;
  }
  
  // Count by priority
  const itemsByPriority = {} as Record<RoadmapPriority, number>;
  for (const item of items) {
    itemsByPriority[item.priority] = (itemsByPriority[item.priority] || 0) + 1;
  }
  
  return {
    totalItems: items.length,
    completedItems: completed.length,
    inProgressItems: inProgress.length,
    plannedItems: planned.length,
    completionRate: items.length > 0 ? (completed.length / items.length) * 100 : 0,
    averageCycleTime,
    velocity,
    itemsByCategory,
    itemsByPriority,
  };
}

/**
 * Create a milestone from roadmap items
 */
export function createMilestone(
  title: string,
  description: string,
  items: RoadmapItem[],
  dueDate?: number
): Milestone {
  const itemIds = items.map(i => i.id);
  const completedCount = items.filter(i => i.status === "completed").length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  
  let status: RoadmapStatus = "planning";
  if (items.every(i => i.status === "completed")) {
    status = "completed";
  } else if (items.some(i => i.status === "in-progress")) {
    status = "in-progress";
  } else if (items.every(i => i.status === "planned" || i.status === "planning")) {
    status = "planned";
  }
  
  return {
    id: `milestone_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    description,
    dueDate,
    items: itemIds,
    status,
    progress,
  };
}

/**
 * Build a roadmap phase from items
 */
export function buildRoadmapPhase(
  name: string,
  description: string,
  items: RoadmapItem[],
  startDate?: number,
  endDate?: number
): RoadmapPhase {
  const milestones = groupItemsIntoMilestones(items);
  
  return {
    id: `phase_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    description,
    startDate,
    endDate,
    milestones,
    items,
  };
}

function groupItemsIntoMilestones(items: RoadmapItem[]): Milestone[] {
  const milestoneMap = new Map<string, RoadmapItem[]>();
  
  for (const item of items) {
    const key = item.milestone || "Unplanned";
    if (!milestoneMap.has(key)) {
      milestoneMap.set(key, []);
    }
    milestoneMap.get(key)!.push(item);
  }
  
  return Array.from(milestoneMap.entries()).map(([title, groupItems]) =>
    createMilestone(title, `${title} items`, groupItems)
  );
}

/**
 * Generate roadmap recommendations
 */
export function generateRoadmapRecommendations(
  metrics: RoadmapMetrics,
  items: RoadmapItem[]
): { priority: "low" | "medium" | "high"; action: string; reason: string }[] {
  const recommendations: { priority: "low" | "medium" | "high"; action: string; reason: string }[] = [];
  
  // Check for stalled items
  const stalledItems = items.filter(i => {
    const daysSinceUpdate = (Date.now() - i.updatedAt) / (24 * 60 * 60 * 1000);
    return i.status === "in-progress" && daysSinceUpdate > 14;
  });
  
  if (stalledItems.length > 0) {
    recommendations.push({
      priority: "high",
      action: "Review stalled items",
      reason: `${stalledItems.length} item(s) have been in progress for over 2 weeks`,
    });
  }
  
  // Check for backlog imbalance
  if (metrics.plannedItems > metrics.inProgressItems * 3) {
    recommendations.push({
      priority: "medium",
      action: "Focus on planned items",
      reason: "Too many items in backlog, consider starting planned work",
    });
  }
  
  // Check for low velocity
  if (metrics.velocity < 3 && metrics.totalItems > 10) {
    recommendations.push({
      priority: "medium",
      action: "Improve team velocity",
      reason: "Average velocity is low, consider breaking down large items",
    });
  }
  
  // Check for critical items not started
  const criticalNotStarted = items.filter(
    i => i.priority === "critical" && i.status !== "in-progress" && i.status !== "completed"
  );
  
  if (criticalNotStarted.length > 0) {
    recommendations.push({
      priority: "high",
      action: "Prioritize critical items",
      reason: `${criticalNotStarted.length} critical item(s) not yet started`,
    });
  }
  
  return recommendations;
}

/**
 * Create default roadmap template for OSS projects
 */
export function createDefaultRoadmapTemplate(): RoadmapItem[] {
  const now = Date.now();
  const month = 30 * 24 * 60 * 60 * 1000;
  
  return [
    createRoadmapItem({
      title: "Improve Documentation",
      description: "Comprehensive documentation update including API docs, examples, and guides",
      status: "planning",
      priority: "medium",
      category: "documentation",
      targetVersion: "2.0.0",
      estimatedEffort: 5,
    }),
    createRoadmapItem({
      title: "Performance Optimization",
      description: "Profile and optimize critical paths, reduce bundle size",
      status: "planning",
      priority: "high",
      category: "improvement",
      targetVersion: "2.0.0",
      estimatedEffort: 8,
    }),
    createRoadmapItem({
      title: "Security Audit Fixes",
      description: "Address findings from security audit",
      status: "planned",
      priority: "critical",
      category: "bugfix",
      targetVersion: "1.5.1",
      estimatedEffort: 3,
    }),
    createRoadmapItem({
      title: "API v2 Design",
      description: "Design next generation API with breaking improvements",
      status: "planning",
      priority: "high",
      category: "feature",
      targetVersion: "2.0.0",
      estimatedEffort: 13,
    }),
    createRoadmapItem({
      title: "CI/CD Pipeline Upgrade",
      description: "Migrate to new CI/CD platform, improve build times",
      status: "planned",
      priority: "medium",
      category: "infrastructure",
      estimatedEffort: 5,
    }),
  ];
}

/**
 * Export roadmap to common formats
 */
export function exportRoadmap(
  items: RoadmapItem[],
  format: "json" | "markdown" | "csv"
): string {
  switch (format) {
    case "json":
      return JSON.stringify(items, null, 2);
    
    case "markdown":
      return generateRoadmapMarkdown(items);
    
    case "csv":
      return generateRoadmapCSV(items);
    
    default:
      return "";
  }
}

function generateRoadmapMarkdown(items: RoadmapItem[]): string {
  let md = "# Project Roadmap\n\n";
  
  // Group by status
  const grouped = {
    "in-progress": items.filter(i => i.status === "in-progress"),
    "completed": items.filter(i => i.status === "completed"),
    "planned": items.filter(i => i.status === "planned" || i.status === "planning"),
  };
  
  for (const [status, statusItems] of Object.entries(grouped)) {
    if (statusItems.length === 0) continue;
    
    md += `## ${status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}\n\n`;
    
    for (const item of statusItems) {
      md += `- [ ] **${item.title}** (${item.priority})\n`;
      md += `  - ${item.description}\n`;
      if (item.targetVersion) md += `  - Target: v${item.targetVersion}\n`;
      if (item.estimatedEffort) md += `  - Effort: ${item.estimatedEffort} points\n`;
      md += "\n";
    }
  }
  
  return md;
}

function generateRoadmapCSV(items: RoadmapItem[]): string {
  const headers = ["ID", "Title", "Status", "Priority", "Category", "Version", "Effort", "Assignees"];
  const rows = items.map(i => [
    i.id,
    `"${i.title.replace(/"/g, '""')}"`,
    i.status,
    i.priority,
    i.category,
    i.targetVersion || "",
    i.estimatedEffort?.toString() || "",
    `"${i.assignees.join(", ")}"`,
  ]);
  
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
