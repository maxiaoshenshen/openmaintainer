/**
 * Repository Insights Module
 * Deep analytics and insights for repositories
 */

export interface RepoMetrics {
  totalStars: number;
  totalForks: number;
  totalWatchers: number;
  totalIssues: number;
  totalPRs: number;
  openIssues: number;
  openPRs: number;
  closedIssues: number;
  mergedPRs: number;
  contributors: number;
  commits: number;
  branches: number;
  releases: number;
  age: number; // days since creation
}

export interface ActivityMetrics {
  dailyCommits: Map<string, number>;
  weeklyCommits: number;
  monthlyCommits: number;
  commitFrequency: number; // commits per week
  issueResponseTime: number; // hours
  prMergeTime: number; // hours
  codeReviewTime: number; // hours
}

export interface ContributorMetrics {
  login: string;
  contributions: number;
  lastContribution: string;
  commitCount: number;
  issueCount: number;
  prCount: number;
  linesAdded: number;
  linesDeleted: number;
}

export interface Insight {
  category: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success';
  recommendation?: string;
}

export class RepositoryInsights {
  private metrics: RepoMetrics;
  private activity: ActivityMetrics;
  private contributors: ContributorMetrics[] = [];
  private insights: Insight[] = [];

  constructor(data?: Partial<RepoMetrics>) {
    this.metrics = {
      totalStars: data?.totalStars || 0,
      totalForks: data?.totalForks || 0,
      totalWatchers: data?.totalWatchers || 0,
      totalIssues: data?.totalIssues || 0,
      totalPRs: data?.totalPRs || 0,
      openIssues: data?.openIssues || 0,
      openPRs: data?.openPRs || 0,
      closedIssues: data?.closedIssues || 0,
      mergedPRs: data?.mergedPRs || 0,
      contributors: data?.contributors || 0,
      commits: data?.commits || 0,
      branches: data?.branches || 0,
      releases: data?.releases || 0,
      age: data?.age || 0,
    };

    this.activity = {
      dailyCommits: new Map(),
      weeklyCommits: 0,
      monthlyCommits: 0,
      commitFrequency: 0,
      issueResponseTime: 0,
      prMergeTime: 0,
      codeReviewTime: 0,
    };
  }

  /**
   * Set repository metrics
   */
  setMetrics(metrics: Partial<RepoMetrics>): void {
    Object.assign(this.metrics, metrics);
  }

  /**
   * Get all metrics
   */
  getMetrics(): RepoMetrics {
    return { ...this.metrics };
  }

  /**
   * Calculate key ratios
   */
  getRatios() {
    const { totalStars, totalForks, contributors, age } = this.metrics;
    
    return {
      forkToStarRatio: totalStars > 0 ? (totalForks / totalStars) : 0,
      starsPerDay: age > 0 ? (totalStars / age) : totalStars,
      contributorsPerMonth: age > 0 ? (contributors / (age / 30)) : contributors,
      issuesPerWeek: age > 0 ? (this.metrics.totalIssues / (age / 7)) : this.metrics.totalIssues,
    };
  }

  /**
   * Calculate health score (0-100)
   */
  calculateHealthScore(): number {
    let score = 50; // Base score

    // Activity bonus
    if (this.activity.commitFrequency > 10) score += 15;
    else if (this.activity.commitFrequency > 5) score += 10;
    else if (this.activity.commitFrequency > 0) score += 5;

    // Community engagement
    if (this.metrics.openIssues < 20) score += 10;
    if (this.metrics.openPRs < 10) score += 10;
    
    // Responsiveness
    if (this.activity.issueResponseTime < 24) score += 10;
    else if (this.activity.issueResponseTime < 72) score += 5;

    // Maintenance
    if (this.metrics.releases > 0) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get health status
   */
  getHealthStatus(): { status: string; score: number; color: string } {
    const score = this.calculateHealthScore();
    
    if (score >= 80) return { status: 'Excellent', score, color: 'green' };
    if (score >= 60) return { status: 'Good', score, color: 'blue' };
    if (score >= 40) return { status: 'Needs Attention', score, color: 'yellow' };
    return { status: 'At Risk', score, color: 'red' };
  }

  /**
   * Add contributor data
   */
  addContributor(data: Omit<ContributorMetrics, never>): void {
    const existing = this.contributors.find(c => c.login === data.login);
    if (existing) {
      Object.assign(existing, data);
    } else {
      this.contributors.push(data);
    }
  }

  /**
   * Get top contributors
   */
  getTopContributors(limit: number = 10): ContributorMetrics[] {
    return [...this.contributors]
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, limit);
  }

  /**
   * Get contributor statistics
   */
  getContributorStats() {
    if (this.contributors.length === 0) {
      return { total: 0, active: 0, average: 0 };
    }

    const total = this.contributors.reduce((sum, c) => sum + c.contributions, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const active = this.contributors.filter(c => 
      new Date(c.lastContribution) > thirtyDaysAgo
    ).length;

    return {
      total: this.contributors.length,
      active,
      average: Math.round(total / this.contributors.length),
    };
  }

  /**
   * Set activity metrics
   */
  setActivityMetrics(data: Partial<ActivityMetrics>): void {
    Object.assign(this.activity, data);
    if (data.dailyCommits) {
      this.activity.dailyCommits = new Map(data.dailyCommits);
    }
  }

  /**
   * Analyze and generate insights
   */
  analyze(): Insight[] {
    this.insights = [];

    // Check issue backlog
    if (this.metrics.openIssues > 50) {
      this.insights.push({
        category: 'Issues',
        title: 'High Issue Backlog',
        description: `${this.metrics.openIssues} open issues need attention`,
        severity: 'warning',
        recommendation: 'Consider adding issue templates and better triage',
      });
    }

    // Check PR backlog
    if (this.metrics.openPRs > 20) {
      this.insights.push({
        category: 'Pull Requests',
        title: 'Stale PR Queue',
        description: `${this.metrics.openPRs} open pull requests`,
        severity: 'warning',
        recommendation: 'Review and respond to pending PRs',
      });
    }

    // Check activity level
    if (this.activity.commitFrequency < 1 && this.metrics.age > 30) {
      this.insights.push({
        category: 'Activity',
        title: 'Low Activity',
        description: 'Repository has low commit frequency',
        severity: 'info',
        recommendation: 'Regular updates help maintain user interest',
      });
    }

    // Check contributor diversity
    if (this.contributors.length > 5) {
      this.insights.push({
        category: 'Community',
        title: 'Good Contributor Diversity',
        description: `${this.contributors.length} contributors`,
        severity: 'success',
      });
    }

    // Check response time
    if (this.activity.issueResponseTime < 24) {
      this.insights.push({
        category: 'Community',
        title: 'Fast Response Time',
        description: 'Issues are typically resolved within 24 hours',
        severity: 'success',
      });
    } else if (this.activity.issueResponseTime > 168) {
      this.insights.push({
        category: 'Community',
        title: 'Slow Response Time',
        description: `Average response time: ${this.activity.issueResponseTime} hours`,
        severity: 'warning',
        recommendation: 'Consider triaging issues or adding more maintainers',
      });
    }

    // Star growth
    if (this.getRatios().starsPerDay > 10) {
      this.insights.push({
        category: 'Growth',
        title: 'Strong Star Growth',
        description: `${this.getRatios().starsPerDay.toFixed(1)} stars/day`,
        severity: 'success',
      });
    }

    return this.insights;
  }

  /**
   * Get commit heatmap data
   */
  getCommitHeatmap(): { date: string; count: number }[] {
    const result: { date: string; count: number }[] = [];
    
    this.activity.dailyCommits.forEach((count, date) => {
      result.push({ date, count });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate summary report
   */
  generateReport(): {
    summary: string;
    metrics: RepoMetrics;
    health: { status: string; score: number };
    topContributors: ContributorMetrics[];
    insights: Insight[];
  } {
    return {
      summary: this.generateSummary(),
      metrics: this.getMetrics(),
      health: this.getHealthStatus(),
      topContributors: this.getTopContributors(5),
      insights: this.analyze(),
    };
  }

  /**
   * Generate text summary
   */
  private generateSummary(): string {
    const health = this.getHealthStatus();
    const ratios = this.getRatios();
    
    return `Repository with ${this.metrics.totalStars} stars, ${this.metrics.totalForks} forks, and ${this.metrics.contributors} contributors. ` +
      `Health score: ${health.score}/100 (${health.status}). ` +
      `Currently ${this.metrics.openIssues} open issues and ${this.metrics.openPRs} open PRs. ` +
      `Average star growth: ${ratios.starsPerDay.toFixed(1)} stars/day.`;
  }

  /**
   * Predict project trajectory
   */
  predictGrowth(months: number = 3): {
    predictedStars: number;
    predictedContributors: number;
    confidence: number;
  } {
    const ratios = this.getRatios();
    const monthlyGrowth = ratios.starsPerDay * 30;
    const contributorGrowth = ratios.contributorsPerMonth;

    return {
      predictedStars: Math.round(this.metrics.totalStars + (monthlyGrowth * months)),
      predictedContributors: Math.round(this.metrics.contributors + (contributorGrowth * months)),
      confidence: this.metrics.age > 90 ? 0.8 : 0.5,
    };
  }
}

export const repositoryInsights = new RepositoryInsights();
