export type HealthScore = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type ActivityLevel = 'very-high' | 'high' | 'medium' | 'low' | 'very-low';

export interface CommunityMetrics {
  activeContributors: number;
  totalContributors: number;
  openIssues: number;
  closedIssues: number;
  openPRs: number;
  mergedPRs: number;
  responseTimeAvg: number;
  issueResolutionTimeAvg: number;
  communityEngagement: number;
}

export interface HealthReport {
  repoId: string;
  score: HealthScore;
  metrics: CommunityMetrics;
  trends: {
    contributors: number;
    issues: number;
    prs: number;
    engagement: number;
  };
  recommendations: string[];
  lastUpdated: Date;
}

export class CommunityHealth {
  private reports: Map<string, HealthReport> = new Map();

  async assessHealth(repoId: string, metrics: CommunityMetrics): Promise<HealthReport> {
    const score = this.calculateScore(metrics);
    const trends = this.calculateTrends(metrics);
    const recommendations = this.generateRecommendations(score, metrics);

    const report: HealthReport = {
      repoId,
      score,
      metrics,
      trends,
      recommendations,
      lastUpdated: new Date(),
    };

    this.reports.set(repoId, report);
    return report;
  }

  private calculateScore(metrics: CommunityMetrics): HealthScore {
    const contributorRatio = metrics.activeContributors / Math.max(metrics.totalContributors, 1);
    const issueCloseRate = metrics.closedIssues / Math.max(metrics.closedIssues + metrics.openIssues, 1);
    const prMergeRate = metrics.mergedPRs / Math.max(metrics.mergedPRs + metrics.openPRs, 1);
    const engagementScore = metrics.communityEngagement / 100;

    const composite = (contributorRatio * 0.2 + issueCloseRate * 0.3 + prMergeRate * 0.3 + engagementScore * 0.2);

    if (composite >= 0.85) return 'excellent';
    if (composite >= 0.70) return 'good';
    if (composite >= 0.50) return 'fair';
    if (composite >= 0.30) return 'poor';
    return 'critical';
  }

  private calculateTrends(metrics: CommunityMetrics): HealthReport['trends'] {
    return {
      contributors: metrics.activeContributors > 5 ? 1 : metrics.activeContributors > 2 ? 0 : -1,
      issues: metrics.openIssues < 20 ? 1 : metrics.openIssues < 50 ? 0 : -1,
      prs: metrics.mergedPRs > 10 ? 1 : metrics.mergedPRs > 5 ? 0 : -1,
      engagement: metrics.communityEngagement > 70 ? 1 : metrics.communityEngagement > 40 ? 0 : -1,
    };
  }

  private generateRecommendations(score: HealthScore, metrics: CommunityMetrics): string[] {
    const recs: string[] = [];

    if (metrics.activeContributors < 3) {
      recs.push('Consider more outreach to grow the contributor base');
    }

    if (metrics.openIssues > 50) {
      recs.push('High open issue count - prioritize triaging and closing stale issues');
    }

    if (metrics.responseTimeAvg > 48) {
      recs.push('Improve response time by setting clear SLAs for issue triage');
    }

    if (metrics.communityEngagement < 40) {
      recs.push('Boost engagement through regular updates and community events');
    }

    if (score === 'critical' || score === 'poor') {
      recs.push('Consider conducting a community health audit');
    }

    return recs;
  }

  async getHealthReport(repoId: string): Promise<HealthReport | null> {
    return this.reports.get(repoId) || null;
  }

  async getHealthScoreColor(score: HealthScore): Promise<string> {
    const colors: Record<HealthScore, string> = {
      excellent: '#22c55e',
      good: '#84cc16',
      fair: '#eab308',
      poor: '#f97316',
      critical: '#ef4444',
    };
    return colors[score];
  }

  async compareCommunities(repoId1: string, repoId2: string): Promise<{
    winner: string;
    differences: Record<string, number>;
  } | null> {
    const report1 = this.reports.get(repoId1);
    const report2 = this.reports.get(repoId2);

    if (!report1 || !report2) return null;

    const scoreValues: Record<HealthScore, number> = {
      excellent: 5, good: 4, fair: 3, poor: 2, critical: 1,
    };

    const winner = scoreValues[report1.score] >= scoreValues[report2.score] ? repoId1 : repoId2;

    return {
      winner,
      differences: {
        activeContributors: report1.metrics.activeContributors - report2.metrics.activeContributors,
        engagement: report1.metrics.communityEngagement - report2.metrics.communityEngagement,
        openIssues: report1.metrics.openIssues - report2.metrics.openIssues,
      },
    };
  }
}
