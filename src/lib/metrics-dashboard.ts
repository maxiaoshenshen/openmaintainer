import type { MaintainerIssue, MaintainerPullRequest } from "./types";

export interface MetricDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface DashboardMetrics {
  overview: {
    totalStars: number;
    totalForks: number;
    totalIssues: number;
    openIssues: number;
    closedIssues: number;
    totalPRs: number;
    openPRs: number;
    mergedPRs: number;
  };
  trends: {
    issuesOverTime: MetricDataPoint[];
    prsOverTime: MetricDataPoint[];
    responseTime: MetricDataPoint[];
    communityActivity: MetricDataPoint[];
  };
  health: {
    issueCloseRate: number;
    prMergeRate: number;
    averageResponseTime: number;
    activeContributors: number;
    communityGrowth: number;
  };
  predictions: {
    projectedStars30d: number;
    projectedForks30d: number;
    burnoutRisk: "low" | "medium" | "high";
  };
}

export class MetricsDashboard {
  generateDashboard(
    issues: MaintainerIssue[],
    pullRequests: MaintainerPullRequest[],
    stats?: { stars?: number; forks?: number }
  ): DashboardMetrics {
    return {
      overview: this.generateOverview(issues, pullRequests, stats),
      trends: this.generateTrends(issues, pullRequests),
      health: this.calculateHealth(issues, pullRequests),
      predictions: this.generatePredictions(issues, pullRequests, stats),
    };
  }

  private generateOverview(
    issues: MaintainerIssue[],
    pullRequests: MaintainerPullRequest[],
    stats?: { stars?: number; forks?: number }
  ) {
    const openIssues = issues.filter(i => i.state === "open").length;
    const openPRs = pullRequests.filter(pr => pr.state === "open" || pr.status === "open").length;
    const mergedPRs = pullRequests.filter(pr => pr.state === "merged" || pr.status === "merged").length;

    return {
      totalStars: stats?.stars ?? 0,
      totalForks: stats?.forks ?? 0,
      totalIssues: issues.length,
      openIssues,
      closedIssues: issues.length - openIssues,
      totalPRs: pullRequests.length,
      openPRs,
      mergedPRs,
    };
  }

  private generateTrends(issues: MaintainerIssue[], pullRequests: MaintainerPullRequest[]) {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const issueTimeline = this.groupByDate(
      issues.filter(i => new Date(i.createdAt).getTime() > thirtyDaysAgo),
      i => i.createdAt
    );

    const prTimeline = this.groupByDate(
      pullRequests.filter(pr => new Date(pr.createdAt).getTime() > thirtyDaysAgo),
      pr => pr.createdAt
    );

    const issuesOverTime = Object.entries(issueTimeline).map(([date, items]) => ({
      date,
      value: items.length,
    }));

    const prsOverTime = Object.entries(prTimeline).map(([date, items]) => ({
      date,
      value: items.length,
    }));

    const responseTime = this.calculateResponseTimeTrend(issues);
    const communityActivity = this.calculateCommunityActivity(issues, pullRequests);

    return { issuesOverTime, prsOverTime, responseTime, communityActivity };
  }

  private groupByDate<T>(items: T[], getDate: (item: T) => string): Record<string, T[]> {
    const grouped: Record<string, T[]> = {};
    for (const item of items) {
      const date = getDate(item).split("T")[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    }
    return grouped;
  }

  private calculateResponseTimeTrend(issues: MaintainerIssue[]): MetricDataPoint[] {
    const now = Date.now();
    const weeklyAvg: MetricDataPoint[] = [];

    for (let w = 0; w < 4; w++) {
      const weekStart = now - (w + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - w * 7 * 24 * 60 * 60 * 1000;
      const weekIssues = issues.filter(i => {
        const created = new Date(i.createdAt).getTime();
        return created >= weekStart && created < weekEnd;
      });

      const avgResponse = weekIssues.length > 0 ? Math.round(weekIssues.length * 2.5) : 0;
      weeklyAvg.push({
        date: new Date(weekStart).toISOString().split("T")[0],
        value: avgResponse,
        label: `Week ${w + 1}`,
      });
    }

    return weeklyAvg.reverse();
  }

  private calculateCommunityActivity(issues: MaintainerIssue[], pullRequests: MaintainerPullRequest[]): MetricDataPoint[] {
    const activity: Record<string, { issues: number; prs: number }> = {};
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    for (const issue of issues) {
      if (new Date(issue.createdAt).getTime() > thirtyDaysAgo) {
        const date = issue.createdAt.split("T")[0];
        if (!activity[date]) activity[date] = { issues: 0, prs: 0 };
        activity[date].issues++;
      }
    }

    for (const pr of pullRequests) {
      if (new Date(pr.createdAt).getTime() > thirtyDaysAgo) {
        const date = pr.createdAt.split("T")[0];
        if (!activity[date]) activity[date] = { issues: 0, prs: 0 };
        activity[date].prs++;
      }
    }

    return Object.entries(activity).map(([date, data]) => ({
      date,
      value: data.issues + data.prs,
    }));
  }

  private calculateHealth(issues: MaintainerIssue[], pullRequests: MaintainerPullRequest[]) {
    const closedIssues = issues.filter(i => i.state === "closed").length;
    const mergedPRs = pullRequests.filter(pr => pr.state === "merged" || pr.status === "merged");
    const openPRs = pullRequests.filter(pr => pr.state === "open" || pr.status === "open");

    const contributors = new Set([
      ...issues.map(i => i.author),
      ...pullRequests.map(pr => pr.author),
    ]);

    const communityGrowth = mergedPRs.length > 0 ? Math.round((contributors.size / mergedPRs.length) * 100) / 100 : 0;

    return {
      issueCloseRate: issues.length > 0 ? Math.round((closedIssues / issues.length) * 100) : 0,
      prMergeRate: pullRequests.length > 0 ? Math.round((mergedPRs.length / pullRequests.length) * 100) : 0,
      averageResponseTime: Math.round(issues.length * 1.5),
      activeContributors: contributors.size,
      communityGrowth: Math.round(communityGrowth * 10) / 10,
    };
  }

  private generatePredictions(
    issues: MaintainerIssue[],
    pullRequests: MaintainerPullRequest[],
    stats?: { stars?: number; forks?: number }
  ) {
    const stars = stats?.stars ?? 1000;
    const forks = stats?.forks ?? 100;
    const mergedPRs = pullRequests.filter(pr => pr.state === "merged" || pr.status === "merged").length;

    const burnoutRisk = this.calculateBurnoutRisk(issues, mergedPRs);

    return {
      projectedStars30d: Math.round(stars * 1.1),
      projectedForks30d: Math.round(forks * 1.05),
      burnoutRisk,
    };
  }

  private calculateBurnoutRisk(issues: MaintainerIssue[], mergedPRs: number): "low" | "medium" | "high" {
    const openIssues = issues.filter(i => i.state === "open").length;
    const recentActivity = issues.filter(i => {
      const daysAgo = (Date.now() - new Date(i.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo < 7;
    }).length;

    if (openIssues > 50 && recentActivity > 20) return "high";
    if (openIssues > 30 && recentActivity > 10) return "medium";
    return "low";
  }

  generateMarkdown(metrics: DashboardMetrics): string {
    const lines: string[] = [];
    lines.push("# Maintainer Dashboard");
    lines.push("");

    lines.push("## Overview");
    lines.push(`- Stars: ${metrics.overview.totalStars}`);
    lines.push(`- Forks: ${metrics.overview.totalForks}`);
    lines.push(`- Open Issues: ${metrics.overview.openIssues}`);
    lines.push(`- Merged PRs: ${metrics.overview.mergedAtPRs}`);
    lines.push("");

    lines.push("## Health");
    lines.push(`- Issue Close Rate: ${metrics.health.issueCloseRate}%`);
    lines.push(`- PR Merge Rate: ${metrics.health.prMergeRate}%`);
    lines.push(`- Active Contributors: ${metrics.health.activeContributors}`);
    lines.push(`- Community Growth: ${metrics.health.communityGrowth}x`);
    lines.push("");

    lines.push("## Predictions");
    lines.push(`- Projected Stars (30d): ${metrics.predictions.projectedStars30d}`);
    lines.push(`- Burnout Risk: ${metrics.predictions.burnoutRisk}`);

    return lines.join("\n");
  }
}
