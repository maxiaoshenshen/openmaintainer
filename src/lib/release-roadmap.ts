// Release Roadmap Planning and Management

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
  progress: number;
  issues: { id: string; title: string; completed: boolean }[];
  blockers: string[];
}

export interface RoadmapItem {
  id: string;
  version: string;
  releaseDate: Date;
  features: Feature[];
  improvements: string[];
  breakingChanges: BreakingChange[];
  knownIssues: string[];
  status: 'planning' | 'development' | 'beta' | 'stable' | 'deprecated';
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  priority: 'must-have' | 'should-have' | 'could-have' | 'won\'t-have';
  effort: 'small' | 'medium' | 'large';
  status: 'proposed' | 'approved' | 'in-development' | 'completed';
  assignee?: string;
  labels: string[];
}

export interface BreakingChange {
  type: 'api' | 'behavior' | 'config' | 'deprecation';
  description: string;
  migrationPath?: string;
  affectedUsers: string[];
}

export interface ReleaseTimeline {
  version: string;
  plannedDate: Date;
  actualDate?: Date;
  status: 'on-track' | 'at-risk' | 'delayed' | 'released';
  remainingDays: number;
  completionPercentage: number;
}

export class ReleaseRoadmapPlanner {
  private milestones: Map<string, Milestone> = new Map();
  private roadmap: Map<string, RoadmapItem> = new Map();

  /**
   * Create a new milestone
   */
  createMilestone(title: string, description: string, dueDate: Date): Milestone {
    const milestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title,
      description,
      dueDate,
      status: 'planned',
      progress: 0,
      issues: [],
      blockers: []
    };
    this.milestones.set(milestone.id, milestone);
    return milestone;
  }

  /**
   * Update milestone progress
   */
  updateMilestoneProgress(milestoneId: string): void {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return;

    const completed = milestone.issues.filter(i => i.completed).length;
    milestone.progress = milestone.issues.length > 0 ? Math.round(completed / milestone.issues.length * 100) : 0;

    if (milestone.progress === 100) {
      milestone.status = 'completed';
    } else if (milestone.progress > 0) {
      milestone.status = 'in-progress';
    }

    const daysUntilDue = Math.ceil((milestone.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (daysUntilDue < 0 && milestone.status !== 'completed') {
      milestone.status = 'delayed';
    }
  }

  /**
   * Add feature to roadmap
   */
  addFeatureToRoadmap(version: string, feature: Omit<Feature, 'id' | 'status'>): RoadmapItem {
    if (!this.roadmap.has(version)) {
      this.roadmap.set(version, this.createRoadmapItem(version));
    }

    const roadmapItem = this.roadmap.get(version)!;
    roadmapItem.features.push({
      ...feature,
      id: `feature-${Date.now()}`,
      status: 'proposed'
    });

    return roadmapItem;
  }

  /**
   * Generate release timeline
   */
  generateTimeline(currentVersion: string, versionsAhead: number = 5): ReleaseTimeline[] {
    const timeline: ReleaseTimeline[] = [];
    const now = new Date();
    let baseDate = new Date(now);

    const versionParts = currentVersion.replace(/^v/, '').split('.').map(Number);
    let major = versionParts[0] || 1;
    let minor = versionParts[1] || 0;
    let patch = versionParts[2] || 0;

    for (let i = 0; i <= versionsAhead; i++) {
      const version = `v${major}.${minor}.${patch}`;
      const daysAhead = i * 60;
      const plannedDate = new Date(baseDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const roadmapItem = this.roadmap.get(version);
      let completionPercentage = 0;
      let status: ReleaseTimeline['status'] = 'on-track';

      if (roadmapItem) {
        const completedFeatures = roadmapItem.features.filter(f => f.status === 'completed').length;
        completionPercentage = roadmapItem.features.length > 0 ? Math.round(completedFeatures / roadmapItem.features.length * 100) : 0;

        if (completionPercentage === 100) {
          status = 'released';
        } else if (completionPercentage > 50) {
          status = 'on-track';
        } else if (completionPercentage > 0) {
          status = 'at-risk';
        }
      }

      const remainingDays = Math.ceil((plannedDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      timeline.push({
        version,
        plannedDate,
        status,
        remainingDays,
        completionPercentage
      });

      minor++;
      if (minor > 9) {
        major++;
        minor = 0;
      }
    }

    return timeline;
  }

  /**
   * Identify blockers and risks
   */
  identifyBlockers(): { milestone: string; blockers: string[]; severity: 'high' | 'medium' | 'low' }[] {
    const blockers: { milestone: string; blockers: string[]; severity: 'high' | 'medium' | 'low' }[] = [];

    for (const [id, milestone] of this.milestones) {
      if (milestone.status !== 'completed' && milestone.blockers.length > 0) {
        const daysUntilDue = Math.ceil((milestone.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        const severity: 'high' | 'medium' | 'low' = daysUntilDue < 7 ? 'high' : daysUntilDue < 30 ? 'medium' : 'low';

        blockers.push({
          milestone: milestone.title,
          blockers: milestone.blockers,
          severity
        });
      }
    }

    return blockers.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
  }

  /**
   * Calculate release readiness
   */
  calculateReleaseReadiness(version: string): {
    readiness: number;
    blockersCount: number;
    criticalFeatures: number;
    completedFeatures: number;
    breakingChangesCount: number;
    recommendation: string;
  } {
    const roadmapItem = this.roadmap.get(version);
    const mustHaveFeatures = roadmapItem?.features.filter(f => f.priority === 'must-have') || [];
    const completedMustHave = mustHaveFeatures.filter(f => f.status === 'completed').length;
    const readiness = mustHaveFeatures.length > 0 ? Math.round(completedMustHave / mustHaveFeatures.length * 100) : 100;

    let recommendation = 'Ready for release';
    if (readiness < 50) recommendation = 'Critical features incomplete - delay release';
    else if (readiness < 80) recommendation = 'Some features pending - review blockers';
    else if (readiness < 100) recommendation = 'Consider partial release or feature flags';

    return {
      readiness,
      blockersCount: roadmapItem?.features.filter(f => f.status !== 'completed').length || 0,
      criticalFeatures: mustHaveFeatures.length,
      completedFeatures: completedMustHave,
      breakingChangesCount: roadmapItem?.breakingChanges.length || 0,
      recommendation
    };
  }

  /**
   * Get all milestones
   */
  getAllMilestones(): Milestone[] {
    return Array.from(this.milestones.values());
  }

  /**
   * Get roadmap for a version
   */
  getRoadmap(version: string): RoadmapItem | undefined {
    return this.roadmap.get(version);
  }

  private createRoadmapItem(version: string): RoadmapItem {
    const parts = version.replace(/^v/, '').split('.').map(Number);
    return {
      id: `roadmap-${Date.now()}`,
      version,
      releaseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      features: [],
      improvements: [],
      breakingChanges: [],
      knownIssues: [],
      status: 'planning'
    };
  }
}

export const releaseRoadmapPlanner = new ReleaseRoadmapPlanner();
