/**
 * Activity Stream - Track and display maintainer activities
 */

export type ActivityType = 
  | 'issue_opened' | 'issue_closed' | 'issue_commented'
  | 'pr_opened' | 'pr_merged' | 'pr_closed' | 'pr_reviewed'
  | 'release_published' | 'commit_pushed'
  | 'member_joined' | 'member_left'
  | 'milestone_created' | 'milestone_completed'
  | 'deploy_started' | 'deploy_completed';

export interface Activity {
  id: string;
  type: ActivityType;
  actor: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  repository: string;
  target?: {
    type: 'issue' | 'pr' | 'release' | 'commit' | 'member' | 'deployment';
    id: string;
    title: string;
    url?: string;
  };
  metadata: Record<string, unknown>;
  timestamp: Date;
  visibility: 'public' | 'private';
}

export interface ActivityFeed {
  repository: string;
  activities: Activity[];
  lastUpdated: Date;
}

export interface FilterOptions {
  type?: ActivityType[];
  actorId?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}

export class ActivityStream {
  private activities: Activity[] = [];
  private feeds: Map<string, ActivityFeed> = new Map();
  private subscribers: Map<string, Set<(activity: Activity) => void>> = new Map();

  publish(activity: Omit<Activity, 'id' | 'timestamp'>): Activity {
    const fullActivity: Activity = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.activities.push(fullActivity);

    if (this.feeds.has(activity.repository)) {
      this.feeds.get(activity.repository)!.activities.unshift(fullActivity);
      this.feeds.get(activity.repository)!.lastUpdated = new Date();
    }

    const subscribers = this.subscribers.get(activity.repository);
    if (subscribers) {
      for (const callback of subscribers) {
        try {
          callback(fullActivity);
        } catch (e) {
          console.error('Subscriber error:', e);
        }
      }
    }

    if (this.activities.length > 10000) {
      this.activities = this.activities.slice(-5000);
    }

    return fullActivity;
  }

  subscribe(repository: string, callback: (activity: Activity) => void): () => void {
    if (!this.subscribers.has(repository)) {
      this.subscribers.set(repository, new Set());
    }
    this.subscribers.get(repository)!.add(callback);

    return () => {
      this.subscribers.get(repository)?.delete(callback);
    };
  }

  getActivities(filters?: FilterOptions): Activity[] {
    let results = [...this.activities];

    if (filters?.type && filters.type.length > 0) {
      results = results.filter(a => filters.type!.includes(a.type));
    }

    if (filters?.actorId) {
      results = results.filter(a => a.actor.id === filters.actorId);
    }

    if (filters?.since) {
      results = results.filter(a => a.timestamp >= filters.since!);
    }

    if (filters?.until) {
      results = results.filter(a => a.timestamp <= filters.until!);
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  getRepositoryFeed(repository: string, limit?: number): Activity[] {
    const feed = this.feeds.get(repository);
    if (!feed) return [];

    let activities = [...feed.activities];
    if (limit) {
      activities = activities.slice(0, limit);
    }
    return activities;
  }

  createFeed(repository: string): ActivityFeed {
    const feed: ActivityFeed = {
      repository,
      activities: [],
      lastUpdated: new Date()
    };
    this.feeds.set(repository, feed);
    return feed;
  }

  getFeed(repository: string): ActivityFeed | undefined {
    return this.feeds.get(repository);
  }

  deleteFeed(repository: string): boolean {
    return this.feeds.delete(repository);
  }

  getStatistics(): {
    totalActivities: number;
    byType: Record<ActivityType, number>;
    byRepository: Record<string, number>;
    byActor: Record<string, number>;
    last24Hours: number;
    last7Days: number;
  } {
    const byType: Record<ActivityType, number> = {} as any;
    const byRepository: Record<string, number> = {};
    const byActor: Record<string, number> = {};

    const now = Date.now();
    const dayAgo = now - 86400000;
    const weekAgo = now - 604800000;

    let last24Hours = 0;
    let last7Days = 0;

    for (const activity of this.activities) {
      const type = activity.type;
      byType[type] = (byType[type] || 0) + 1;
      byRepository[activity.repository] = (byRepository[activity.repository] || 0) + 1;
      byActor[activity.actor.id] = (byActor[activity.actor.id] || 0) + 1;

      const time = activity.timestamp.getTime();
      if (time > dayAgo) last24Hours++;
      if (time > weekAgo) last7Days++;
    }

    return {
      totalActivities: this.activities.length,
      byType,
      byRepository,
      byActor,
      last24Hours,
      last7Days
    };
  }

  generateTimeline(repository: string, days: number = 7): {
    date: string;
    count: number;
    types: Record<string, number>;
  }[] {
    const feed = this.feeds.get(repository);
    if (!feed) return [];

    const result: Map<string, { count: number; types: Record<string, number> }> = new Map();
    const now = Date.now();
    const startTime = now - (days * 86400000);

    for (const activity of feed.activities) {
      if (activity.timestamp.getTime() < startTime) break;

      const date = activity.timestamp.toISOString().split('T')[0];
      if (!result.has(date)) {
        result.set(date, { count: 0, types: {} });
      }

      const entry = result.get(date)!;
      entry.count++;
      entry.types[activity.type] = (entry.types[activity.type] || 0) + 1;
    }

    return Array.from(result.entries()).map(([date, data]) => ({ date, ...data }));
  }

  searchActivities(query: string, filters?: FilterOptions): Activity[] {
    const lowerQuery = query.toLowerCase();
    return this.getActivities(filters).filter(activity => {
      if (activity.target?.title.toLowerCase().includes(lowerQuery)) return true;
      if (activity.metadata && JSON.stringify(activity.metadata).toLowerCase().includes(lowerQuery)) return true;
      return false;
    });
  }

  exportActivities(repository: string, format: 'json' | 'csv' = 'json'): string {
    const activities = this.getRepositoryFeed(repository);

    if (format === 'json') {
      return JSON.stringify(activities, null, 2);
    }

    const headers = ['id', 'type', 'actor', 'repository', 'target', 'timestamp', 'visibility'];
    const rows = activities.map(a => [
      a.id,
      a.type,
      a.actor.username,
      a.repository,
      a.target?.title || '',
      a.timestamp.toISOString(),
      a.visibility
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  clearOldActivities(olderThanDays: number): number {
    const cutoff = new Date(Date.now() - olderThanDays * 86400000);
    const before = this.activities.length;
    this.activities = this.activities.filter(a => a.timestamp >= cutoff);
    return before - this.activities.length;
  }
}

export const createActivityStream = () => new ActivityStream();
