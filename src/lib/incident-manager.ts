// Incident Management and Response Tracking

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'triggered' | 'acknowledged' | 'investigating' | 'mitigating' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedServices: string[];
  affectedUsers?: number;
  startedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  assignee?: string;
  timeline: IncidentEvent[];
  rootCause?: string;
  lessonsLearned?: string[];
}

export interface IncidentEvent {
  timestamp: Date;
  type: 'status_change' | 'comment' | 'escalation' | 'notification' | 'mitigation';
  actor: string;
  message: string;
}

export interface IncidentMetrics {
  totalIncidents: number;
  openIncidents: number;
  avgResolutionTime: number;
  mttrBySeverity: { severity: IncidentSeverity; mttr: number }[];
  incidentsByService: { service: string; count: number }[];
  incidentsTrend: { date: Date; count: number; severity: IncidentSeverity }[];
}

export interface OnCallSchedule {
  id: string;
  user: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  isPrimary: boolean;
}

export class IncidentManager {
  private incidents: Map<string, Incident> = new Map();

  /**
   * Create a new incident
   */
  createIncident(title: string, description: string, severity: IncidentSeverity, affectedServices: string[]): Incident {
    const incident: Incident = {
      id: `INC-${Date.now()}`,
      title,
      description,
      severity,
      status: 'triggered',
      affectedServices,
      startedAt: new Date(),
      timeline: [{
        timestamp: new Date(),
        type: 'status_change',
        actor: 'system',
        message: `Incident ${severity} created`
      }]
    };
    this.incidents.set(incident.id, incident);
    return incident;
  }

  /**
   * Acknowledge an incident
   */
  acknowledgeIncident(incidentId: string, assignee: string): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = 'acknowledged';
    incident.acknowledgedAt = new Date();
    incident.assignee = assignee;
    incident.timeline.push({
      timestamp: new Date(),
      type: 'status_change',
      actor: assignee,
      message: `Incident acknowledged by ${assignee}`
    });

    return incident;
  }

  /**
   * Add event to incident timeline
   */
  addEvent(incidentId: string, type: IncidentEvent['type'], actor: string, message: string): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    incident.timeline.push({ timestamp: new Date(), type, actor, message });

    if (type === 'mitigation' && incident.status === 'investigating') {
      incident.status = 'mitigating';
    }
  }

  /**
   * Resolve an incident
   */
  resolveIncident(incidentId: string, rootCause?: string, lessonsLearned?: string[]): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = 'resolved';
    incident.resolvedAt = new Date();
    if (rootCause) incident.rootCause = rootCause;
    if (lessonsLearned) incident.lessonsLearned = lessonsLearned;
    incident.timeline.push({
      timestamp: new Date(),
      type: 'status_change',
      actor: 'system',
      message: 'Incident resolved'
    });

    return incident;
  }

  /**
   * Calculate incident metrics
   */
  async calculateMetrics(): Promise<IncidentMetrics> {
    const all = Array.from(this.incidents.values());
    const open = all.filter(i => i.status !== 'resolved');
    const resolved = all.filter(i => i.resolvedAt);

    const totalResolutionTime = resolved.reduce((sum, i) => {
      const duration = i.resolvedAt!.getTime() - i.startedAt.getTime();
      return sum + duration / (1000 * 60);
    }, 0);
    const avgResolutionTime = resolved.length > 0 ? totalResolutionTime / resolved.length : 0;

    const mttrBySeverity: { severity: IncidentSeverity; mttr: number }[] = ['critical', 'high', 'medium', 'low'].map(sev => {
      const sevIncidents = resolved.filter(i => i.severity === sev);
      const totalTime = sevIncidents.reduce((sum, i) => {
        return sum + (i.resolvedAt!.getTime() - i.startedAt.getTime()) / (1000 * 60);
      }, 0);
      return { severity: sev, mttr: sevIncidents.length > 0 ? totalTime / sevIncidents.length : 0 };
    });

    const serviceCounts = new Map<string, number>();
    for (const incident of all) {
      for (const service of incident.affectedServices) {
        serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1);
      }
    }

    return {
      totalIncidents: all.length,
      openIncidents: open.length,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
      mttrBySeverity,
      incidentsByService: Array.from(serviceCounts.entries()).map(([service, count]) => ({ service, count })),
      incidentsTrend: this.generateTrend(all)
    };
  }

  /**
   * Get current on-call schedule
   */
  getOnCallSchedule(): OnCallSchedule[] {
    const now = new Date();
    const primary: OnCallSchedule = {
      id: 'schedule-1',
      user: 'oncall-primary',
      startTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      timezone: 'UTC',
      isPrimary: true
    };
    const backup: OnCallSchedule = { ...primary, id: 'schedule-2', user: 'oncall-backup', isPrimary: false };
    return [primary, backup];
  }

  /**
   * Escalate an incident
   */
  escalateIncident(incidentId: string, escalatedTo: string): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.timeline.push({
      timestamp: new Date(),
      type: 'escalation',
      actor: escalatedTo,
      message: `Incident escalated to ${escalatedTo}`
    });

    return incident;
  }

  /**
   * Get incident by ID
   */
  getIncident(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Get all incidents
   */
  getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  private generateTrend(incidents: Incident[]): { date: Date; count: number; severity: IncidentSeverity }[] {
    const trend: { date: Date; count: number; severity: IncidentSeverity }[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayIncidents = incidents.filter(inc => {
        const incDate = new Date(inc.startedAt);
        return incDate.toDateString() === date.toDateString();
      });
      const sevCounts = { critical: 0, high: 0, medium: 0, low: 0 };
      dayIncidents.forEach(inc => sevCounts[inc.severity]++);
      const dominantSeverity = Object.entries(sevCounts).sort((a, b) => b[1] - a[1])[0][0] as IncidentSeverity;

      trend.push({ date, count: dayIncidents.length, severity: dominantSeverity });
    }

    return trend;
  }
}

export const incidentManager = new IncidentManager();
