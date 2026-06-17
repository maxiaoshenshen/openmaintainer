export type SLAItemType = 'issue' | 'pull_request' | 'review' | 'security' | 'bug';

export type SLAPriority = 'critical' | 'high' | 'medium' | 'low';

export type SLAStatus = 'on_track' | 'at_risk' | 'breached' | 'met' | 'extended';

export interface SLADefinition {
  id: string;
  name: string;
  description: string;
  itemType: SLAItemType;
  priority: SLAPriority;
  targetResponseTime: number; // in hours
  targetResolutionTime: number; // in hours
  businessHoursOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SLA里程碑 {
  id: string;
  slaId: string;
  name: string;
  targetTime: Date;
  completedAt?: Date;
  status: SLAStatus;
}

export interface SLAMetric {
  slaId: string;
  itemId: string;
  itemType: SLAItemType;
  priority: SLAPriority;
  createdAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  currentStatus: SLAStatus;
  timeRemaining: number; // in hours, negative if breached
  breachedAt?: Date;
}

export interface SLAReport {
  period: { start: Date; end: Date };
  totalItems: number;
  itemsMetSLA: number;
  itemsBreached: number;
  itemsAtRisk: number;
  metPercentage: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  byPriority: Record<SLAPriority, { total: number; met: number; breached: number }>;
  byType: Record<SLAItemType, { total: number; met: number; breached: number }>;
}

export class SLATracker {
  private definitions: Map<string, SLADefinition> = new Map();
  private milestones: Map<string, SLA里程碑[]> = new Map();
  private metrics: Map<string, SLAMetric> = new Map();

  constructor() {
    // Initialize with default SLA definitions
    this.initializeDefaultSLAs();
  }

  private initializeDefaultSLAs(): void {
    const defaults: SLADefinition[] = [
      {
        id: 'SLA-CRITICAL-ISSUE',
        name: 'Critical Issue Response',
        description: 'First response to critical security issues',
        itemType: 'issue',
        priority: 'critical',
        targetResponseTime: 1,
        targetResolutionTime: 24,
        businessHoursOnly: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'SLA-HIGH-ISSUE',
        name: 'High Priority Issue',
        description: 'Response to high priority bugs',
        itemType: 'issue',
        priority: 'high',
        targetResponseTime: 4,
        targetResolutionTime: 72,
        businessHoursOnly: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'SLA-MEDIUM-ISSUE',
        name: 'Medium Priority Issue',
        description: 'Response to medium priority issues',
        itemType: 'issue',
        priority: 'medium',
        targetResponseTime: 24,
        targetResolutionTime: 168,
        businessHoursOnly: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'SLA-PR-REVIEW',
        name: 'PR Review Time',
        description: 'Time to first review on pull requests',
        itemType: 'pull_request',
        priority: 'high',
        targetResponseTime: 24,
        targetResolutionTime: 72,
        businessHoursOnly: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'SLA-SECURITY',
        name: 'Security Advisory',
        description: 'Security vulnerability response',
        itemType: 'security',
        priority: 'critical',
        targetResponseTime: 1,
        targetResolutionTime: 48,
        businessHoursOnly: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaults.forEach(sla => this.definitions.set(sla.id, sla));
  }

  async createSLADefinition(data: Omit<SLADefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<SLADefinition> {
    const sla: SLADefinition = {
      id: `SLA-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.definitions.set(sla.id, sla);
    return sla;
  }

  async getSLADefinition(id: string): Promise<SLADefinition | null> {
    return this.definitions.get(id) || null;
  }

  async getAllSLADefinitions(): Promise<SLADefinition[]> {
    return Array.from(this.definitions.values());
  }

  async updateSLADefinition(id: string, updates: Partial<SLADefinition>): Promise<SLADefinition | null> {
    const sla = this.definitions.get(id);
    if (!sla) return null;

    Object.assign(sla, updates, { updatedAt: new Date() });
    return sla;
  }

  async deleteSLADefinition(id: string): Promise<boolean> {
    return this.definitions.delete(id);
  }

  async startTracking(itemId: string, itemType: SLAItemType, priority: SLAPriority): Promise<SLAMetric> {
    const sla = this.findMatchingSLA(itemType, priority);
    const now = new Date();

    const metric: SLAMetric = {
      slaId: sla?.id || 'DEFAULT',
      itemId,
      itemType,
      priority,
      createdAt: now,
      currentStatus: 'on_track',
      timeRemaining: sla?.targetResponseTime || 24,
    };

    this.metrics.set(itemId, metric);
    return metric;
  }

  async recordFirstResponse(itemId: string): Promise<SLAMetric | null> {
    const metric = this.metrics.get(itemId);
    if (!metric) return null;

    const now = new Date();
    metric.firstResponseAt = now;

    const sla = this.definitions.get(metric.slaId);
    const responseTime = (now.getTime() - metric.createdAt.getTime()) / (1000 * 60 * 60);
    metric.timeRemaining = sla ? sla.targetResolutionTime - responseTime : metric.timeRemaining - responseTime;

    if (metric.timeRemaining <= 0) {
      metric.currentStatus = 'breached';
      metric.breachedAt = now;
    } else if (metric.timeRemaining <= (sla?.targetResponseTime || 24) * 0.25) {
      metric.currentStatus = 'at_risk';
    }

    return metric;
  }

  async recordResolution(itemId: string): Promise<SLAMetric | null> {
    const metric = this.metrics.get(itemId);
    if (!metric) return null;

    const now = new Date();
    metric.resolvedAt = now;

    const sla = this.definitions.get(metric.slaId);
    const totalTime = (now.getTime() - metric.createdAt.getTime()) / (1000 * 60 * 60);

    if (metric.timeRemaining > 0) {
      metric.currentStatus = 'met';
    } else {
      metric.currentStatus = 'breached';
      metric.breachedAt = now;
    }

    return metric;
  }

  async getMetric(itemId: string): Promise<SLAMetric | null> {
    return this.metrics.get(itemId) || null;
  }

  async getAllMetrics(filters?: {
    status?: SLAStatus;
    priority?: SLAPriority;
    itemType?: SLAItemType;
  }): Promise<SLAMetric[]> {
    let metrics = Array.from(this.metrics.values());

    if (filters?.status) {
      metrics = metrics.filter(m => m.currentStatus === filters.status);
    }
    if (filters?.priority) {
      metrics = metrics.filter(m => m.priority === filters.priority);
    }
    if (filters?.itemType) {
      metrics = metrics.filter(m => m.itemType === filters.itemType);
    }

    return metrics.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAtRiskMetrics(): Promise<SLAMetric[]> {
    return this.getAllMetrics({ status: 'at_risk' });
  }

  async getBreachedMetrics(): Promise<SLAMetric[]> {
    return this.getAllMetrics({ status: 'breached' });
  }

  async getReport(startDate: Date, endDate: Date): Promise<SLAReport> {
    const allMetrics = Array.from(this.metrics.values())
      .filter(m => m.createdAt >= startDate && m.createdAt <= endDate);

    const met = allMetrics.filter(m => m.currentStatus === 'met');
    const breached = allMetrics.filter(m => m.currentStatus === 'breached');
    const atRisk = allMetrics.filter(m => m.currentStatus === 'at_risk');

    const byPriority: SLAReport['byPriority'] = {
      critical: { total: 0, met: 0, breached: 0 },
      high: { total: 0, met: 0, breached: 0 },
      medium: { total: 0, met: 0, breached: 0 },
      low: { total: 0, met: 0, breached: 0 },
    };

    const byType: SLAReport['byType'] = {
      issue: { total: 0, met: 0, breached: 0 },
      pull_request: { total: 0, met: 0, breached: 0 },
      review: { total: 0, met: 0, breached: 0 },
      security: { total: 0, met: 0, breached: 0 },
      bug: { total: 0, met: 0, breached: 0 },
    };

    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseCount = 0;
    let resolutionCount = 0;

    for (const metric of allMetrics) {
      byPriority[metric.priority].total++;
      if (metric.currentStatus === 'met') byPriority[metric.priority].met++;
      if (metric.currentStatus === 'breached') byPriority[metric.priority].breached++;

      byType[metric.itemType].total++;
      if (metric.currentStatus === 'met') byType[metric.itemType].met++;
      if (metric.currentStatus === 'breached') byType[metric.itemType].breached++;

      if (metric.firstResponseAt) {
        totalResponseTime += (metric.firstResponseAt.getTime() - metric.createdAt.getTime()) / (1000 * 60 * 60);
        responseCount++;
      }

      if (metric.resolvedAt) {
        totalResolutionTime += (metric.resolvedAt.getTime() - metric.createdAt.getTime()) / (1000 * 60 * 60);
        resolutionCount++;
      }
    }

    return {
      period: { start: startDate, end: endDate },
      totalItems: allMetrics.length,
      itemsMetSLA: met.length,
      itemsBreached: breached.length,
      itemsAtRisk: atRisk.length,
      metPercentage: allMetrics.length > 0 ? (met.length / allMetrics.length) * 100 : 100,
      avgResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      avgResolutionTime: resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0,
      byPriority,
      byType,
    };
  }

  private findMatchingSLA(itemType: SLAItemType, priority: SLAPriority): SLADefinition | undefined {
    return Array.from(this.definitions.values()).find(
      s => s.itemType === itemType && s.priority === priority
    ) || Array.from(this.definitions.values()).find(
      s => s.itemType === itemType
    );
  }
}
