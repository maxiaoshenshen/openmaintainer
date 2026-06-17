/**
 * Milestone Tracker Module
 * Track and manage project milestones and goals
 */

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  state: 'open' | 'closed' | 'completed';
  progress: number;
  issues: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneStats {
  totalMilestones: number;
  openMilestones: number;
  closedMilestones: number;
  completedOnTime: number;
  completedLate: number;
  averageProgress: number;
  upcomingDeadlines: Milestone[];
}

export interface MilestoneFilter {
  state?: 'open' | 'closed' | 'completed';
  assignee?: string;
  overdue?: boolean;
  upcoming?: number; // days
}

export class MilestoneTracker {
  private milestones: Map<string, Milestone> = new Map();
  private idCounter = 0;

  /**
   * Create a new milestone
   */
  create(data: {
    title: string;
    description?: string;
    dueDate: string;
    assignees?: string[];
    issues?: string[];
  }): Milestone {
    if (!data.title || !data.dueDate) {
      throw new Error('Title and due date are required');
    }

    const id = `milestone_${++this.idCounter}`;
    const now = new Date().toISOString();
    
    const milestone: Milestone = {
      id,
      title: data.title,
      description: data.description || '',
      dueDate: data.dueDate,
      state: 'open',
      progress: 0,
      issues: data.issues || [],
      assignees: data.assignees || [],
      createdAt: now,
      updatedAt: now,
    };

    this.milestones.set(id, milestone);
    return milestone;
  }

  /**
   * Get milestone by ID
   */
  get(id: string): Milestone | undefined {
    return this.milestones.get(id);
  }

  /**
   * Update milestone
   */
  update(id: string, updates: Partial<Omit<Milestone, 'id' | 'createdAt'>>): Milestone | undefined {
    const milestone = this.milestones.get(id);
    if (!milestone) return undefined;

    const updated: Milestone = {
      ...milestone,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Auto-close if progress is 100%
    if (updated.progress >= 100 && updated.state === 'open') {
      updated.state = 'completed';
    }

    this.milestones.set(id, updated);
    return updated;
  }

  /**
   * Add issue to milestone
   */
  addIssue(milestoneId: string, issueId: string): boolean {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return false;

    if (!milestone.issues.includes(issueId)) {
      milestone.issues.push(issueId);
      milestone.updatedAt = new Date().toISOString();
      this.recalculateProgress(milestoneId);
    }

    return true;
  }

  /**
   * Remove issue from milestone
   */
  removeIssue(milestoneId: string, issueId: string): boolean {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return false;

    const index = milestone.issues.indexOf(issueId);
    if (index > -1) {
      milestone.issues.splice(index, 1);
      milestone.updatedAt = new Date().toISOString();
      this.recalculateProgress(milestoneId);
    }

    return true;
  }

  /**
   * Recalculate milestone progress based on issues
   */
  private recalculateProgress(milestoneId: string): void {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return;

    // Simulate: progress based on issue count and some random completion
    const baseProgress = Math.min(100, (milestone.issues.length * 10));
    milestone.progress = Math.min(100, baseProgress + Math.floor(Math.random() * 20));
    milestone.updatedAt = new Date().toISOString();
  }

  /**
   * List milestones with optional filter
   */
  list(filter?: MilestoneFilter): Milestone[] {
    let result = Array.from(this.milestones.values());

    if (filter) {
      if (filter.state) {
        result = result.filter(m => m.state === filter.state);
      }
      if (filter.assignee) {
        result = result.filter(m => m.assignees.includes(filter.assignee!));
      }
      if (filter.overdue) {
        result = result.filter(m => this.isOverdue(m));
      }
      if (filter.upcoming !== undefined) {
        result = result.filter(m => this.isUpcoming(m, filter.upcoming!));
      }
    }

    return result.sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  /**
   * Check if milestone is overdue
   */
  isOverdue(milestone: Milestone): boolean {
    if (milestone.state === 'closed' || milestone.state === 'completed') {
      return false;
    }
    return new Date(milestone.dueDate) < new Date();
  }

  /**
   * Check if milestone is upcoming within specified days
   */
  isUpcoming(milestone: Milestone, days: number): boolean {
    if (milestone.state === 'closed' || milestone.state === 'completed') {
      return false;
    }
    const now = new Date();
    const due = new Date(milestone.dueDate);
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  }

  /**
   * Get statistics
   */
  getStats(): MilestoneStats {
    const all = Array.from(this.milestones.values());
    const open = all.filter(m => m.state === 'open');
    const completed = all.filter(m => m.state === 'completed');
    const completedOnTime = completed.filter(m => !this.isOverdue(m));
    const completedLate = completed.filter(m => this.isOverdue(m));
    const overdue = all.filter(m => this.isOverdue(m));
    const upcoming = all.filter(m => this.isUpcoming(m, 7));

    return {
      totalMilestones: all.length,
      openMilestones: open.length,
      closedMilestones: all.filter(m => m.state === 'closed').length,
      completedOnTime: completedOnTime.length,
      completedLate: completedLate.length,
      averageProgress: all.length > 0 
        ? Math.round(all.reduce((sum, m) => sum + m.progress, 0) / all.length)
        : 0,
      upcomingDeadlines: [...overdue, ...upcoming].slice(0, 5),
    };
  }

  /**
   * Close a milestone
   */
  close(id: string): Milestone | undefined {
    return this.update(id, { state: 'closed' });
  }

  /**
   * Reopen a milestone
   */
  reopen(id: string): Milestone | undefined {
    return this.update(id, { state: 'open' });
  }

  /**
   * Delete milestone
   */
  delete(id: string): boolean {
    return this.milestones.delete(id);
  }

  /**
   * Get milestone timeline
   */
  getTimeline(): { date: string; milestone: Milestone }[] {
    return Array.from(this.milestones.values())
      .map(m => ({ date: m.dueDate, milestone: m }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculate velocity towards milestone
   */
  calculateVelocity(id: string, daysConsidered: number = 7): number {
    const milestone = this.milestones.get(id);
    if (!milestone) return 0;

    const now = new Date();
    const dueDate = new Date(milestone.dueDate);
    const daysLeft = Math.max(0, (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const progressNeeded = 100 - milestone.progress;

    if (daysLeft === 0) return progressNeeded > 0 ? Infinity : 0;
    
    return progressNeeded / daysLeft;
  }
}

export const milestoneTracker = new MilestoneTracker();
