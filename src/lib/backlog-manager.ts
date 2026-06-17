/**
 * Backlog Manager Module
 * Manage and prioritize issue backlog
 */

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type IssueType = 'bug' | 'feature' | 'enhancement' | 'docs' | 'question';

export interface BacklogItem {
  id: string;
  title: string;
  description: string;
  type: IssueType;
  priority: Priority;
  state: 'open' | 'in_progress' | 'resolved' | 'closed';
  labels: string[];
  estimatedHours?: number;
  actualHours?: number;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  milestone?: string;
  dependencies: string[];
}

export interface BacklogStats {
  total: number;
  byPriority: Record<Priority, number>;
  byType: Record<IssueType, number>;
  byState: Record<string, number>;
  totalEstimatedHours: number;
  highPriorityCount: number;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  items: string[];
  velocity: number;
  goal?: string;
}

export class BacklogManager {
  private items: Map<string, BacklogItem> = new Map();
  private sprints: Map<string, Sprint> = new Map();
  private idCounter = 0;
  private sprintCounter = 0;

  /**
   * Add item to backlog
   */
  add(data: {
    title: string;
    description?: string;
    type?: IssueType;
    priority?: Priority;
    labels?: string[];
    estimatedHours?: number;
    assignee?: string;
  }): BacklogItem {
    if (!data.title) {
      throw new Error('Title is required');
    }

    const id = `backlog_${++this.idCounter}`;
    const now = new Date().toISOString();

    const item: BacklogItem = {
      id,
      title: data.title,
      description: data.description || '',
      type: data.type || 'feature',
      priority: data.priority || 'medium',
      state: 'open',
      labels: data.labels || [],
      estimatedHours: data.estimatedHours,
      assignee: data.assignee,
      createdAt: now,
      updatedAt: now,
      dependencies: [],
    };

    this.items.set(id, item);
    return item;
  }

  /**
   * Get item by ID
   */
  get(id: string): BacklogItem | undefined {
    return this.items.get(id);
  }

  /**
   * Update item
   */
  update(id: string, updates: Partial<Omit<BacklogItem, 'id' | 'createdAt'>>): BacklogItem | undefined {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updated: BacklogItem = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);
    return updated;
  }

  /**
   * Set priority
   */
  setPriority(id: string, priority: Priority): BacklogItem | undefined {
    return this.update(id, { priority });
  }

  /**
   * Add dependency
   */
  addDependency(itemId: string, dependsOnId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || !this.items.has(dependsOnId)) return false;

    if (!item.dependencies.includes(dependsOnId)) {
      item.dependencies.push(dependsOnId);
      item.updatedAt = new Date().toISOString();
    }

    return true;
  }

  /**
   * Get prioritized backlog
   */
  getPrioritized(): BacklogItem[] {
    const priorityOrder: Record<Priority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return Array.from(this.items.values())
      .filter(item => item.state === 'open')
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  /**
   * Get backlog by type
   */
  getByType(type: IssueType): BacklogItem[] {
    return Array.from(this.items.values()).filter(item => item.type === type);
  }

  /**
   * Get backlog by label
   */
  getByLabel(label: string): BacklogItem[] {
    return Array.from(this.items.values())
      .filter(item => item.labels.includes(label));
  }

  /**
   * Get backlog statistics
   */
  getStats(): BacklogStats {
    const all = Array.from(this.items.values());
    
    const byPriority: Record<Priority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    
    const byType: Record<IssueType, number> = {
      bug: 0,
      feature: 0,
      enhancement: 0,
      docs: 0,
      question: 0,
    };
    
    const byState: Record<string, number> = {};
    let totalEstimatedHours = 0;
    let highPriorityCount = 0;

    for (const item of all) {
      byPriority[item.priority]++;
      byType[item.type]++;
      byState[item.state] = (byState[item.state] || 0) + 1;
      
      if (item.estimatedHours) {
        totalEstimatedHours += item.estimatedHours;
      }
      
      if (item.priority === 'critical' || item.priority === 'high') {
        highPriorityCount++;
      }
    }

    return {
      total: all.length,
      byPriority,
      byType,
      byState,
      totalEstimatedHours,
      highPriorityCount,
    };
  }

  /**
   * Create sprint
   */
  createSprint(data: {
    name: string;
    startDate: string;
    endDate: string;
    goal?: string;
  }): Sprint {
    const id = `sprint_${++this.sprintCounter}`;
    
    const sprint: Sprint = {
      id,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      items: [],
      velocity: 0,
      goal: data.goal,
    };

    this.sprints.set(id, sprint);
    return sprint;
  }

  /**
   * Add items to sprint
   */
  addToSprint(sprintId: string, itemIds: string[]): boolean {
    const sprint = this.sprints.get(sprintId);
    if (!sprint) return false;

    for (const itemId of itemIds) {
      if (this.items.has(itemId) && !sprint.items.includes(itemId)) {
        sprint.items.push(itemId);
        this.update(itemId, { state: 'in_progress', milestone: sprintId });
      }
    }

    return true;
  }

  /**
   * Complete sprint
   */
  completeSprint(sprintId: string): Sprint | undefined {
    const sprint = this.sprints.get(sprintId);
    if (!sprint) return undefined;

    const completedItems = sprint.items
      .map(id => this.items.get(id))
      .filter(item => item?.state === 'resolved' || item?.state === 'closed');

    sprint.velocity = completedItems.reduce((sum, item) => {
      return sum + (item?.estimatedHours || 0);
    }, 0);

    return sprint;
  }

  /**
   * Get sprint by ID
   */
  getSprint(id: string): Sprint | undefined {
    return this.sprints.get(id);
  }

  /**
   * List all sprints
   */
  listSprints(): Sprint[] {
    return Array.from(this.sprints.values());
  }

  /**
   * Delete item
   */
  delete(id: string): boolean {
    return this.items.delete(id);
  }

  /**
   * Detect circular dependencies
   */
  hasCircularDependency(itemId: string, visited = new Set<string>()): boolean {
    if (visited.has(itemId)) return true;
    
    const item = this.items.get(itemId);
    if (!item) return false;

    visited.add(itemId);

    for (const depId of item.dependencies) {
      if (this.hasCircularDependency(depId, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get item workload estimate
   */
  getWorkloadEstimate(assignee?: string): number {
    const items = assignee
      ? Array.from(this.items.values()).filter(i => i.assignee === assignee)
      : Array.from(this.items.values());

    return items.reduce((sum, item) => sum + (item.estimatedHours || 0), 0);
  }
}

export const backlogManager = new BacklogManager();
