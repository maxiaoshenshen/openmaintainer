/**
 * AI Insights Engine
 * Generates actionable insights from repository data using AI patterns
 */
export interface Insight {
  id: string;
  category: 'health' | 'growth' | 'risk' | 'opportunity' | 'efficiency';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  recommendations: string[];
  dataPoints: Record<string, unknown>;
  generatedAt: Date;
}

export interface InsightsContext {
  repository: {
    name: string;
    stars: number;
    forks: number;
    openIssues: number;
    openPRs: number;
    lastReleaseAt?: Date;
  };
  contributors: {
    total: number;
    active: number;
    newThisMonth: number;
    churned: number;
  };
  activity: {
    issuesPerWeek: number;
    prsPerWeek: number;
    avgResponseTime: number; // hours
    reviewTime: number; // hours
  };
  health: {
    issueResolutionRate: number;
    prMergeRate: number;
    communityEngagement: number;
  };
}

export function generateInsights(context: InsightsContext): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // Health insights
  if (context.health.issueResolutionRate < 0.5) {
    insights.push({
      id: `insight-${Date.now()}-1`,
      category: 'health',
      title: 'Low Issue Resolution Rate',
      description: `Only ${(context.health.issueResolutionRate * 100).toFixed(0)}% of issues are being resolved. Consider triaging old issues or adding automation.`,
      impact: context.health.issueResolutionRate < 0.3 ? 'critical' : 'high',
      confidence: 0.9,
      recommendations: [
        'Use /close command for stale issues after 30 days',
        'Create issue templates to improve quality',
        'Automate first response with GitHub Actions',
      ],
      dataPoints: { resolutionRate: context.health.issueResolutionRate },
      generatedAt: now,
    });
  }

  // Growth insights
  if (context.contributors.newThisMonth > context.contributors.churned) {
    insights.push({
      id: `insight-${Date.now()}-2`,
      category: 'growth',
      title: 'Healthy Contributor Growth',
      description: `${context.contributors.newThisMonth} new contributors this month, outpacing churn. Great momentum!`,
      impact: 'medium',
      confidence: 0.85,
      recommendations: [
        'Recognize top contributors publicly',
        'Create mentorship pairing program',
        'Document contributor journey',
      ],
      dataPoints: {
        newContributors: context.contributors.newThisMonth,
        churned: context.contributors.churned,
      },
      generatedAt: now,
    });
  } else if (context.contributors.newThisMonth < context.contributors.churned) {
    insights.push({
      id: `insight-${Date.now()}-3`,
      category: 'risk',
      title: 'Contributor Churn Risk',
      description: `More contributors leaving (${context.contributors.churned}) than joining (${context.contributors.newThisMonth}).`,
      impact: 'high',
      confidence: 0.8,
      recommendations: [
        'Review recent contributor experience',
        'Add "good first issue" labels',
        'Improve PR review turnaround time',
        'Create contribution guidelines',
      ],
      dataPoints: {
        newContributors: context.contributors.newThisMonth,
        churned: context.contributors.churned,
      },
      generatedAt: now,
    });
  }

  // Efficiency insights
  if (context.activity.avgResponseTime > 72) {
    insights.push({
      id: `insight-${Date.now()}-4`,
      category: 'efficiency',
      title: 'Slow Response Time',
      description: `Average issue response time is ${context.activity.avgResponseTime.toFixed(0)} hours. This may frustrate contributors.`,
      impact: context.activity.avgResponseTime > 168 ? 'critical' : 'high',
      confidence: 0.95,
      recommendations: [
        'Set up automated acknowledgment',
        'Use GitHub Actions for triaging',
        'Create response templates',
        'Consider co-maintainers',
      ],
      dataPoints: { avgResponseTime: context.activity.avgResponseTime },
      generatedAt: now,
    });
  }

  // Opportunity insights
  if (!context.repository.lastReleaseAt) {
    insights.push({
      id: `insight-${Date.now()}-5`,
      category: 'opportunity',
      title: 'No Recent Release',
      description: 'Repository has no recent releases. Regular releases build trust and engagement.',
      impact: 'medium',
      confidence: 0.7,
      recommendations: [
        'Schedule regular release cadence',
        'Use automated changelog generation',
        'Create release checklist',
      ],
      dataPoints: {},
      generatedAt: now,
    });
  } else {
    const daysSinceRelease = (now.getTime() - context.repository.lastReleaseAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRelease > 90) {
      insights.push({
        id: `insight-${Date.now()}-6`,
        category: 'opportunity',
        title: 'Stale Release',
        description: `${daysSinceRelease.toFixed(0)} days since last release. Consider a new version.`,
        impact: 'medium',
        confidence: 0.8,
        recommendations: [
          'Review pending changes for release',
          'Update CHANGELOG',
          'Announce to community',
        ],
        dataPoints: { daysSinceRelease },
        generatedAt: now,
      });
    }
  }

  // Activity insights
  if (context.activity.prsPerWeek < 1 && context.repository.stars > 100) {
    insights.push({
      id: `insight-${Date.now()}-7`,
      category: 'risk',
      title: 'Low PR Activity',
      description: `Only ${context.activity.prsPerWeek} PRs per week despite ${context.repository.stars} stars. Potential for more engagement.`,
      impact: 'medium',
      confidence: 0.75,
      recommendations: [
        'Promote contribution opportunities',
        'Review PR review process for bottlenecks',
        'Add "help wanted" labels',
      ],
      dataPoints: {
        prsPerWeek: context.activity.prsPerWeek,
        stars: context.repository.stars,
      },
      generatedAt: now,
    });
  }

  // Sort by impact and confidence
  const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return insights.sort((a, b) => {
    const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
    if (impactDiff !== 0) return impactDiff;
    return b.confidence - a.confidence;
  });
}

export function summarizeInsights(insights: Insight[]): string {
  const byImpact = {
    critical: insights.filter(i => i.impact === 'critical'),
    high: insights.filter(i => i.impact === 'high'),
    medium: insights.filter(i => i.impact === 'medium'),
    low: insights.filter(i => i.impact === 'low'),
  };

  const parts: string[] = [];
  if (byImpact.critical.length > 0) {
    parts.push(`${byImpact.critical.length} critical issue(s) need immediate attention.`);
  }
  if (byImpact.high.length > 0) {
    parts.push(`${byImpact.high.length} high-priority insight(s) to address.`);
  }
  if (byImpact.medium.length > 0) {
    parts.push(`${byImpact.medium.length} opportunity/optimization found.`);
  }

  return parts.join(' ') || 'Repository looks healthy!';
}
