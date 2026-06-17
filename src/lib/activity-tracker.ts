/**
 * Activity Tracker - Monitor repository activity patterns
 */

export interface ActivityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByDay: Record<string, number>;
  averageEventsPerDay: number;
  peakActivityDay: string;
  peakActivityHour: number;
  contributorActivity: Record<string, number>;
  responseTime: Record<string, number>; // Average response time by contributor
}

export interface ActivityEvent {
  id: string;
  type: string;
  actor: string;
  repository: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export class ActivityTracker {
  private events: ActivityEvent[] = [];
  private maxEvents = 1000;

  track(type: string, actor: string, repository: string, metadata?: Record<string, unknown>): void {
    this.events.unshift({
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      actor,
      repository,
      timestamp: Date.now(),
      metadata,
    });

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
  }

  getMetrics(): ActivityMetrics {
    const eventsByType: Record<string, number> = {};
    const eventsByDay: Record<string, number> = {};
    const contributorActivity: Record<string, number> = {};
    const hourlyDistribution: Record<number, number> = {};

    for (const event of this.events) {
      // By type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // By day
      const day = new Date(event.timestamp).toISOString().split("T")[0];
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;

      // By contributor
      contributorActivity[event.actor] = (contributorActivity[event.actor] || 0) + 1;

      // By hour
      const hour = new Date(event.timestamp).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    }

    // Find peak day
    let peakDay = "";
    let maxDayCount = 0;
    for (const [day, count] of Object.entries(eventsByDay)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        peakDay = day;
      }
    }

    // Find peak hour
    let peakHour = 0;
    let maxHourCount = 0;
    for (const [hour, count] of Object.entries(hourlyDistribution)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = parseInt(hour);
      }
    }

    // Calculate average events per day
    const days = Object.keys(eventsByDay);
    const averageEventsPerDay = days.length > 0
      ? this.events.length / days.length
      : 0;

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsByDay,
      averageEventsPerDay: Math.round(averageEventsPerDay * 10) / 10,
      peakActivityDay: peakDay,
      peakActivityHour: peakHour,
      contributorActivity,
      responseTime: {}, // Would require tracking specific response events
    };
  }

  getRecentEvents(limit = 50): ActivityEvent[] {
    return this.events.slice(0, limit);
  }

  getEventsByContributor(actor: string): ActivityEvent[] {
    return this.events.filter((e) => e.actor === actor);
  }

  getEventsByType(type: string): ActivityEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  getEventsByRepository(repository: string): ActivityEvent[] {
    return this.events.filter((e) => e.repository === repository);
  }

  clear(): void {
    this.events = [];
  }
}
