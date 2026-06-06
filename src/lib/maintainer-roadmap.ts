export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: "planned" | "in-progress" | "completed" | "cancelled";
  priority: "critical" | "high" | "medium" | "low";
  category: "feature" | "maintenance" | "documentation" | "community" | "security";
  estimatedEffort: "small" | "medium" | "large";
  targetMilestone?: string;
  dependencies: string[];
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  version: string;
  targetDate: string;
  items: string[];
  status: "planning" | "active" | "completed";
}

export interface RoadmapMetrics {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  plannedItems: number;
  completionRate: number;
  criticalItems: number;
  overdueItems: number;
}

export class MaintainerRoadmap {
  private items: RoadmapItem[] = [];

  addItem(item: Omit<RoadmapItem, "id" | "createdAt" | "updatedAt">): RoadmapItem {
    const now = new Date().toISOString();
    const newItem: RoadmapItem = {
      ...item,
      id: `roadmap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(newItem);
    return newItem;
  }

  updateItem(id: string, updates: Partial<RoadmapItem>): RoadmapItem | null {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.items[index] = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.items[index];
  }

  getItemsByStatus(status: RoadmapItem["status"]): RoadmapItem[] {
    return this.items.filter(item => item.status === status);
  }

  getItemsByPriority(priority: RoadmapItem["priority"]): RoadmapItem[] {
    return this.items.filter(item => item.priority === priority);
  }

  getItemsByCategory(category: RoadmapItem["category"]): RoadmapItem[] {
    return this.items.filter(item => item.category === category);
  }

  getMetrics(): RoadmapMetrics {
    const total = this.items.length;
    const completed = this.items.filter(i => i.status === "completed").length;
    const inProgress = this.items.filter(i => i.status === "in-progress").length;
    const planned = this.items.filter(i => i.status === "planned").length;
    const critical = this.items.filter(i => i.priority === "critical").length;
    const overdue = this.items.filter(i => {
      if (!i.targetMilestone) return false;
      const milestone = this.getMilestones().find(m => m.id === i.targetMilestone);
      return milestone && new Date(milestone.targetDate) < new Date() && i.status !== "completed";
    }).length;

    return {
      totalItems: total,
      completedItems: completed,
      inProgressItems: inProgress,
      plannedItems: planned,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      criticalItems: critical,
      overdueItems: overdue,
    };
  }

  getMilestones(): Milestone[] {
    const milestoneMap = new Map<string, Milestone>();

    for (const item of this.items) {
      if (!item.targetMilestone) continue;

      if (!milestoneMap.has(item.targetMilestone)) {
        milestoneMap.set(item.targetMilestone, {
          id: item.targetMilestone,
          title: item.targetMilestone,
          version: item.targetMilestone,
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items: [],
          status: "planning",
        });
      }
      milestoneMap.get(item.targetMilestone)!.items.push(item.id);
    }

    return Array.from(milestoneMap.values());
  }

  getNextPriorityItems(count: number = 5): RoadmapItem[] {
    return this.items
      .filter(item => item.status !== "completed")
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, count);
  }

  generateMarkdown(): string {
    const lines: string[] = [];
    lines.push("# Maintainer Roadmap");
    lines.push("");

    const metrics = this.getMetrics();
    lines.push("## Progress");
    lines.push(`- Total: ${metrics.totalItems}`);
    lines.push(`- Completed: ${metrics.completedItems} (${metrics.completionRate}%)`);
    lines.push(`- In Progress: ${metrics.inProgressItems}`);
    lines.push(`- Critical Items: ${metrics.criticalItems}`);
    lines.push("");

    const byStatus = {
      "in-progress": this.getItemsByStatus("in-progress"),
      planned: this.getItemsByStatus("planned"),
      completed: this.getItemsByStatus("completed"),
    };

    for (const [status, items] of Object.entries(byStatus)) {
      if (items.length === 0) continue;
      lines.push(`## ${status.replace("-", " ").replace(/^\w/, c => c.toUpperCase())}`);
      lines.push("");
      for (const item of items) {
        const checkbox = item.status === "completed" ? "[x]" : "[ ]";
        lines.push(`- ${checkbox} **[${item.priority}]** ${item.title}`);
        if (item.description) lines.push(`  - ${item.description}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }
}
