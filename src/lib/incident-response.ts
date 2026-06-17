export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'detected' | 'investigating' | 'mitigating' | 'resolved' | 'postmortem';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedComponents: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  assignee?: string;
  timeline: IncidentEvent[];
}

export interface IncidentEvent {
  timestamp: Date;
  action: string;
  actor: string;
  details?: string;
}

export interface IncidentMetrics {
  totalIncidents: number;
  resolvedIncidents: number;
  avgResolutionTime: number;
  incidentsBySeverity: Record<IncidentSeverity, number>;
  incidentsByStatus: Record<IncidentStatus, number>;
}

export class IncidentResponse {
  private incidents: Map<string, Incident> = new Map();
  private notificationCallbacks: Array<(incident: Incident) => void> = [];

  async createIncident(data: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    affectedComponents: string[];
  }): Promise<Incident> {
    const incident: Incident = {
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      status: 'detected',
      detectedAt: new Date(),
      timeline: [
        {
          timestamp: new Date(),
          action: 'Incident created',
          actor: 'system',
          details: data.description,
        },
      ],
    };

    this.incidents.set(incident.id, incident);
    this.notify(incident);
    return incident;
  }

  async updateStatus(id: string, status: IncidentStatus, actor: string, details?: string): Promise<Incident | null> {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    incident.status = status;
    incident.timeline.push({
      timestamp: new Date(),
      action: `Status changed to ${status}`,
      actor,
      details,
    });

    if (status === 'resolved') {
      incident.resolvedAt = new Date();
    }

    this.notify(incident);
    return incident;
  }

  async assignIncident(id: string, assignee: string): Promise<Incident | null> {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    incident.assignee = assignee;
    incident.timeline.push({
      timestamp: new Date(),
      action: 'Assignee updated',
      actor: 'system',
      details: `Assigned to ${assignee}`,
    });

    this.notify(incident);
    return incident;
  }

  async getIncident(id: string): Promise<Incident | null> {
    return this.incidents.get(id) || null;
  }

  async getAllIncidents(filters?: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
  }): Promise<Incident[]> {
    let incidents = Array.from(this.incidents.values());

    if (filters?.status) {
      incidents = incidents.filter(i => i.status === filters.status);
    }
    if (filters?.severity) {
      incidents = incidents.filter(i => i.severity === filters.severity);
    }

    return incidents.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  async getMetrics(): Promise<IncidentMetrics> {
    const incidents = Array.from(this.incidents.values());
    const resolved = incidents.filter(i => i.status === 'resolved' && i.resolvedAt);
    
    const totalResolutionTime = resolved.reduce((sum, i) => {
      return sum + (i.resolvedAt!.getTime() - i.detectedAt.getTime());
    }, 0);

    const incidentsBySeverity = {
      critical: incidents.filter(i => i.severity === 'critical').length,
      high: incidents.filter(i => i.severity === 'high').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      low: incidents.filter(i => i.severity === 'low').length,
    };

    const incidentsByStatus = {
      detected: incidents.filter(i => i.status === 'detected').length,
      investigating: incidents.filter(i => i.status === 'investigating').length,
      mitigating: incidents.filter(i => i.status === 'mitigating').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      postmortem: incidents.filter(i => i.status === 'postmortem').length,
    };

    return {
      totalIncidents: incidents.length,
      resolvedIncidents: resolved.length,
      avgResolutionTime: resolved.length > 0 ? totalResolutionTime / resolved.length : 0,
      incidentsBySeverity,
      incidentsByStatus,
    };
  }

  async addTimelineEvent(id: string, action: string, actor: string, details?: string): Promise<Incident | null> {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    incident.timeline.push({
      timestamp: new Date(),
      action,
      actor,
      details,
    });

    this.notify(incident);
    return incident;
  }

  onNotification(callback: (incident: Incident) => void): void {
    this.notificationCallbacks.push(callback);
  }

  private notify(incident: Incident): void {
    this.notificationCallbacks.forEach(cb => cb(incident));
  }
}
