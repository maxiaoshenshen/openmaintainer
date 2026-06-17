export interface DashboardMetrics {
  overview: {
    totalStars: number;
    totalForks: number;
    totalContributors: number;
    totalPRs: number;
    totalIssues: number;
    openIssues: number;
    openPRs: number;
  };
  growth: {
    starsTrend: number;
    forksTrend: number;
    contributorsTrend: number;
    prsTrend: number;
    issuesTrend: number;
  };
  engagement: {
    avgResponseTime: number;
    avgMergeTime: number;
    issueResolutionRate: number;
    prMergeRate: number;
  };
  quality: {
    avgTestCoverage: number;
    avgCodeQuality: number;
    technicalDebt: number;
    openCriticalIssues: number;
  };
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface ContributorActivity {
  contributorId: string;
  contributions: number;
  lastActive: Date;
  avatar?: string;
}

export interface ActivitySummary {
  daily: TimeSeriesData[];
  weekly: TimeSeriesData[];
  monthly: TimeSeriesData[];
  byContributor: ContributorActivity[];
}

export class AnalyticsDashboard {
  private metrics: DashboardMetrics;
  private activityData: TimeSeriesData[] = [];
  private contributors: Map<string, ContributorActivity> = new Map();

  constructor() {
    this.metrics = this.generateInitialMetrics();
    this.generateActivityData();
  }

  private generateInitialMetrics(): DashboardMetrics {
    return {
      overview: {
        totalStars: 1500 + Math.floor(Math.random() * 500),
        totalForks: 200 + Math.floor(Math.random() * 100),
        totalContributors: 30 + Math.floor(Math.random() * 20),
        totalPRs: 150 + Math.floor(Math.random() * 50),
        totalIssues: 100 + Math.floor(Math.random() * 30),
        openIssues: 10 + Math.floor(Math.random() * 10),
        openPRs: 5 + Math.floor(Math.random() * 5),
      },
      growth: {
        starsTrend: 5 + Math.random() * 10,
        forksTrend: 3 + Math.random() * 5,
        contributorsTrend: 2 + Math.random() * 3,
        prsTrend: 10 + Math.random() * 20,
        issuesTrend: 5 + Math.random() * 10,
      },
      engagement: {
        avgResponseTime: 2 + Math.random() * 6, // hours
        avgMergeTime: 24 + Math.random() * 48, // hours
        issueResolutionRate: 0.7 + Math.random() * 0.25,
        prMergeRate: 0.6 + Math.random() * 0.3,
      },
      quality: {
        avgTestCoverage: 70 + Math.random() * 25,
        avgCodeQuality: 7 + Math.random() * 3,
        technicalDebt: 5 + Math.random() * 10, // days
        openCriticalIssues: Math.floor(Math.random() * 3),
      },
    };
  }

  private generateActivityData(): void {
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      this.activityData.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(10 + Math.random() * 40),
      });
    }

    // Generate sample contributors
    const names = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry', 'iris', 'jack'];
    names.forEach((name, index) => {
      this.contributors.set(name, {
        contributorId: name,
        contributions: 10 + Math.floor(Math.random() * 50),
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    });
  }

  async getMetrics(): Promise<DashboardMetrics> {
    return this.metrics;
  }

  async updateMetrics(updates: Partial<DashboardMetrics>): Promise<DashboardMetrics> {
    this.metrics = {
      ...this.metrics,
      ...updates,
      overview: { ...this.metrics.overview, ...updates.overview },
      growth: { ...this.metrics.growth, ...updates.growth },
      engagement: { ...this.metrics.engagement, ...updates.engagement },
      quality: { ...this.metrics.quality, ...updates.quality },
    };
    return this.metrics;
  }

  async getActivitySummary(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<TimeSeriesData[]> {
    if (period === 'daily') {
      return this.activityData;
    }

    if (period === 'weekly') {
      const weekly: TimeSeriesData[] = [];
      for (let i = 0; i < this.activityData.length; i += 7) {
        const week = this.activityData.slice(i, i + 7);
        const total = week.reduce((sum, d) => sum + d.value, 0);
        weekly.push({
          date: week[0].date,
          value: total,
        });
      }
      return weekly;
    }

    // Monthly
    const monthly: TimeSeriesData[] = [];
    const grouped: Record<string, number> = {};
    this.activityData.forEach(d => {
      const month = d.date.substring(0, 7);
      grouped[month] = (grouped[month] || 0) + d.value;
    });
    Object.entries(grouped).forEach(([month, value]) => {
      monthly.push({ date: month, value });
    });
    return monthly;
  }

  async getTopContributors(limit = 10): Promise<ContributorActivity[]> {
    return Array.from(this.contributors.values())
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, limit);
  }

  async addContribution(contributorId: string, count = 1): Promise<void> {
    const existing = this.contributors.get(contributorId);
    if (existing) {
      existing.contributions += count;
      existing.lastActive = new Date();
    } else {
      this.contributors.set(contributorId, {
        contributorId,
        contributions: count,
        lastActive: new Date(),
      });
    }

    // Update overview metrics
    this.metrics.overview.totalContributors = this.contributors.size;
    this.metrics.overview.totalPRs += count;
  }

  async getHealthScore(): Promise<number> {
    const factors = [
      this.metrics.engagement.issueResolutionRate * 25,
      this.metrics.engagement.prMergeRate * 25,
      (this.metrics.quality.avgTestCoverage / 100) * 25,
      Math.max(0, 25 - this.metrics.quality.technicalDebt / 2),
      Math.max(0, 10 - this.metrics.quality.openCriticalIssues * 2),
    ];

    return Math.round(factors.reduce((a, b) => a + b, 0));
  }

  async getAlerts(): Promise<Array<{ type: string; message: string; severity: 'info' | 'warning' | 'critical' }>> {
    const alerts = [];

    if (this.metrics.quality.openCriticalIssues > 0) {
      alerts.push({
        type: 'critical_issues',
        message: `${this.metrics.quality.openCriticalIssues} critical issues need attention`,
        severity: 'critical' as const,
      });
    }

    if (this.metrics.engagement.avgResponseTime > 24) {
      alerts.push({
        type: 'slow_response',
        message: `Average response time is ${this.metrics.engagement.avgResponseTime.toFixed(1)} hours`,
        severity: 'warning' as const,
      });
    }

    if (this.metrics.quality.technicalDebt > 15) {
      alerts.push({
        type: 'tech_debt',
        message: `Technical debt is at ${this.metrics.quality.technicalDebt.toFixed(0)} days`,
        severity: 'warning' as const,
      });
    }

    if (this.metrics.openIssues > 20) {
      alerts.push({
        type: 'issue_backlog',
        message: `${this.metrics.openIssues} open issues need triaging`,
        severity: 'info' as const,
      });
    }

    return alerts;
  }

  async exportDashboardData(): Promise<string> {
    return JSON.stringify({
      metrics: this.metrics,
      activity: await this.getActivitySummary(),
      topContributors: await this.getTopContributors(),
      healthScore: await this.getHealthScore(),
      alerts: await this.getAlerts(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}
