/**
 * Maintainer Workload Module
 * Track and balance maintainer workload
 */

export interface Maintainer {
  id: string;
  username: string;
  email?: string;
  role: 'owner' | 'maintainer' | 'contributor';
  joinedAt: string;
  isActive: boolean;
}

export interface WorkloadMetrics {
  openIssues: number;
  openPRs: number;
  closedThisWeek: number;
  avgResponseTime: number; // hours
  commitCount: number;
  lastActive: string;
}

export interface WorkloadBalance {
  maintainerId: string;
  metrics: WorkloadMetrics;
  score: number; // 0-100, higher = more overloaded
  recommendations: string[];
}

export interface BurnoutRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
  suggestions: string[];
}

export class MaintainerWorkload {
  private maintainers: Map<string, Maintainer> = new Map();
  private workloads: Map<string, WorkloadMetrics> = new Map();

  /**
   * Register a maintainer
   */
  register(data: {
    username: string;
    email?: string;
    role?: 'owner' | 'maintainer' | 'contributor';
  }): Maintainer {
    const id = `user_${data.username}`;
    const maintainer: Maintainer = {
      id,
      username: data.username,
      email: data.email,
      role: data.role || 'contributor',
      joinedAt: new Date().toISOString(),
      isActive: true,
    };
    this.maintainers.set(id, maintainer);
    this.workloads.set(id, {
      openIssues: 0,
      openPRs: 0,
      closedThisWeek: 0,
      avgResponseTime: 0,
      commitCount: 0,
      lastActive: new Date().toISOString(),
    });
    return maintainer;
  }

  /**
   * Update maintainer metrics
   */
  updateMetrics(
    maintainerId: string,
    metrics: Partial<WorkloadMetrics>
  ): void {
    const existing = this.workloads.get(maintainerId);
    if (existing) {
      Object.assign(existing, metrics);
      existing.lastActive = new Date().toISOString();
    }
  }

  /**
   * Get maintainer workload
   */
  getWorkload(maintainerId: string): WorkloadMetrics | undefined {
    return this.workloads.get(maintainerId);
  }

  /**
   * Calculate workload balance for all maintainers
   */
  calculateBalance(): WorkloadBalance[] {
    const balances: WorkloadBalance[] = [];

    for (const [id, maintainer] of this.maintainers) {
      const metrics = this.workloads.get(id);
      if (!metrics) continue;

      const score = this.calculateScore(metrics);
      const recommendations = this.generateRecommendations(id, metrics, score);

      balances.push({
        maintainerId: id,
        metrics,
        score,
        recommendations,
      });
    }

    return balances.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate workload score
   */
  private calculateScore(metrics: WorkloadMetrics): number {
    let score = 0;

    // Open issues contribute to workload
    score += Math.min(metrics.openIssues * 2, 30);

    // Open PRs contribute
    score += Math.min(metrics.openPRs * 3, 30);

    // Slow response time adds burden
    if (metrics.avgResponseTime > 48) score += 20;
    else if (metrics.avgResponseTime > 24) score += 10;

    // Recent activity is good
    const daysSinceActive = (Date.now() - new Date(metrics.lastActive).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive > 30) score += 20;
    else if (daysSinceActive > 7) score += 10;

    // High commit count might indicate burnout risk
    if (metrics.commitCount > 50) score += 10;

    return Math.min(100, score);
  }

  /**
   * Generate workload recommendations
   */
  private generateRecommendations(
    maintainerId: string,
    metrics: WorkloadMetrics,
    score: number
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.openIssues > 20) {
      recommendations.push('Consider triaging or closing stale issues');
    }
    if (metrics.openPRs > 10) {
      recommendations.push('Prioritize reviewing pending pull requests');
    }
    if (metrics.avgResponseTime > 48) {
      recommendations.push('Set up automated responses for common issues');
    }
    if (score > 70) {
      recommendations.push('Consider delegating some responsibilities');
    }
    if (metrics.closedThisWeek < 2) {
      recommendations.push('Focus on closing resolved items');
    }

    return recommendations;
  }

  /**
   * Assess burnout risk
   */
  assessBurnoutRisk(maintainerId: string): BurnoutRisk {
    const metrics = this.workloads.get(maintainerId);
    if (!metrics) {
      return { level: 'low', score: 0, factors: [], suggestions: [] };
    }

    const factors: string[] = [];
    let riskScore = 0;

    // High open issues
    if (metrics.openIssues > 30) {
      factors.push('High number of open issues');
      riskScore += 30;
    } else if (metrics.openIssues > 15) {
      riskScore += 15;
    }

    // High open PRs
    if (metrics.openPRs > 20) {
      factors.push('Large PR backlog');
      riskScore += 25;
    } else if (metrics.openPRs > 10) {
      riskScore += 10;
    }

    // Slow response
    if (metrics.avgResponseTime > 168) {
      factors.push('Very slow average response time');
      riskScore += 20;
    } else if (metrics.avgResponseTime > 72) {
      riskScore += 10;
    }

    // High commit volume
    if (metrics.commitCount > 100) {
      factors.push('High commit frequency');
      riskScore += 15;
    }

    // Inactivity
    const daysSinceActive = (Date.now() - new Date(metrics.lastActive).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive > 14) {
      factors.push('Recent inactivity');
      riskScore += 10;
    }

    // Determine level
    let level: BurnoutRisk['level'] = 'low';
    if (riskScore >= 70) level = 'critical';
    else if (riskScore >= 50) level = 'high';
    else if (riskScore >= 30) level = 'medium';

    // Generate suggestions
    const suggestions = this.generateBurnoutSuggestions(level, factors);

    return { level, score: riskScore, factors, suggestions };
  }

  /**
   * Generate burnout mitigation suggestions
   */
  private generateBurnoutSuggestions(level: BurnoutRisk['level'], factors: string[]): string[] {
    const suggestions: string[] = [];

    if (level === 'critical' || level === 'high') {
      suggestions.push('Take a break - consider a vacation');
      suggestions.push('Delegate responsibilities temporarily');
      suggestions.push('Communicate with community about delays');
    }

    if (factors.includes('High number of open issues')) {
      suggestions.push('Use issue templates to reduce duplicates');
      suggestions.push('Archive or close stale issues');
    }

    if (factors.includes('Large PR backlog')) {
      suggestions.push('Set clear PR review guidelines');
      suggestions.push('Consider automated PR merging for well-tested changes');
    }

    suggestions.push('Automate repetitive tasks where possible');
    suggestions.push('Reach out to other maintainers for support');

    return suggestions;
  }

  /**
   * Get team health summary
   */
  getTeamHealth(): {
    totalMaintainers: number;
    activeMaintainers: number;
    avgWorkload: number;
    highRiskCount: number;
    burnoutRiskDistribution: Record<BurnoutRisk['level'], number>;
  } {
    let totalWorkload = 0;
    let highRiskCount = 0;
    const burnoutDistribution: Record<BurnoutRisk['level'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const [id] of this.maintainers) {
      const balance = this.calculateBalance().find(b => b.maintainerId === id);
      if (balance) {
        totalWorkload += balance.score;
        if (balance.score > 70) highRiskCount++;
      }

      const risk = this.assessBurnoutRisk(id);
      burnoutDistribution[risk.level]++;
    }

    const activeMaintainers = Array.from(this.maintainers.values())
      .filter(m => m.isActive).length;

    return {
      totalMaintainers: this.maintainers.size,
      activeMaintainers,
      avgWorkload: this.maintainers.size > 0 ? Math.round(totalWorkload / this.maintainers.size) : 0,
      highRiskCount,
      burnoutRiskDistribution: burnoutDistribution,
    };
  }

  /**
   * Suggest workload rebalancing
   */
  suggestRebalancing(): {
    from: string;
    to: string;
    reason: string;
    items: string[];
  }[] {
    const suggestions: { from: string; to: string; reason: string; items: string[] }[] = [];
    const balance = this.calculateBalance();

    if (balance.length < 2) return suggestions;

    const mostLoaded = balance[0];
    const leastLoaded = balance[balance.length - 1];

    if (mostLoaded.score - leastLoaded.score > 30) {
      suggestions.push({
        from: mostLoaded.maintainerId,
        to: leastLoaded.maintainerId,
        reason: 'Workload imbalance detected',
        items: ['Open issues', 'Pending PRs'],
      });
    }

    return suggestions;
  }

  /**
   * List all maintainers
   */
  listMaintainers(): Maintainer[] {
    return Array.from(this.maintainers.values());
  }

  /**
   * Deactivate maintainer
   */
  deactivate(maintainerId: string): boolean {
    const maintainer = this.maintainers.get(maintainerId);
    if (maintainer) {
      maintainer.isActive = false;
      return true;
    }
    return false;
  }
}

export const maintainerWorkload = new MaintainerWorkload();
