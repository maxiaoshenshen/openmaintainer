/**
 * Crisis Alert System
 * Proactive monitoring and alerting for maintainer burnout and project risks
 */
export type AlertSeverity = 'info' | 'warning' | 'urgent' | 'critical';
export type AlertCategory = 'health' | 'security' | 'community' | 'maintenance' | 'compliance';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  actionRequired: boolean;
  suggestedActions: string[];
  relatedMetrics?: Record<string, unknown>;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface CrisisThresholds {
  issueResponseHours: number;
  prReviewHours: number;
  openIssueCount: number;
  burnoutScore: number;
  vulnerabilityCount: number;
  inactiveDays: number;
}

export const DEFAULT_THRESHOLDS: CrisisThresholds = {
  issueResponseHours: 168, // 1 week
  prReviewHours: 336, // 2 weeks
  openIssueCount: 100,
  burnoutScore: 70,
  vulnerabilityCount: 1,
  inactiveDays: 30,
};

export interface CrisisStatus {
  level: 0 | 1 | 2 | 3; // 0=green, 1=yellow, 2=orange, 3=red
  label: string;
  description: string;
  alerts: Alert[];
}

export function evaluateCrisisStatus(
  metrics: {
    avgIssueResponseTime: number;
    avgPrReviewTime: number;
    openIssueCount: number;
    openPrCount: number;
    burnoutScore: number;
    vulnerabilityCount: number;
    daysSinceLastCommit: number;
    daysSinceLastRelease: number;
    contributorChurnRate: number;
  },
  thresholds: CrisisThresholds = DEFAULT_THRESHOLDS
): CrisisStatus {
  const alerts: Alert[] = [];

  // Critical: Security vulnerabilities
  if (metrics.vulnerabilityCount >= thresholds.vulnerabilityCount) {
    alerts.push({
      id: `alert-${Date.now()}-security`,
      severity: 'critical',
      category: 'security',
      title: 'Security Vulnerabilities Detected',
      description: `${metrics.vulnerabilityCount} known security vulnerabilities require immediate attention.`,
      timestamp: new Date(),
      source: 'dependency-scanner',
      actionRequired: true,
      suggestedActions: [
        'Review GitHub Security Advisories',
        'Update affected dependencies',
        'Consider security audit',
        'Notify community if exploits are public',
      ],
      relatedMetrics: { vulnerabilityCount: metrics.vulnerabilityCount },
      acknowledged: false,
    });
  }

  // Urgent: Maintainer burnout
  if (metrics.burnoutScore >= thresholds.burnoutScore) {
    alerts.push({
      id: `alert-${Date.now()}-burnout`,
      severity: 'urgent',
      category: 'health',
      title: 'Maintainer Burnout Risk',
      description: `Burnout score is ${metrics.burnoutScore}/100. Consider delegating or taking breaks.`,
      timestamp: new Date(),
      source: 'burnout-detector',
      actionRequired: true,
      suggestedActions: [
        'Delegate review responsibilities',
        'Enable vacation mode',
        'Recruit co-maintainers',
        'Set boundaries for response times',
      ],
      relatedMetrics: { burnoutScore: metrics.burnoutScore },
      acknowledged: false,
    });
  }

  // Warning: Slow response
  if (metrics.avgIssueResponseTime > thresholds.issueResponseHours) {
    alerts.push({
      id: `alert-${Date.now()}-response`,
      severity: 'warning',
      category: 'maintenance',
      title: 'Slow Issue Response',
      description: `Average issue response time is ${metrics.avgIssueResponseTime.toFixed(0)} hours (threshold: ${thresholds.issueResponseHours}h).`,
      timestamp: new Date(),
      source: 'sla-monitor',
      actionRequired: false,
      suggestedActions: [
        'Use automated triage',
        'Create response templates',
        'Consider triaging old issues',
      ],
      relatedMetrics: { avgIssueResponseTime: metrics.avgIssueResponseTime },
      acknowledged: false,
    });
  }

  // Warning: Slow PR review
  if (metrics.avgPrReviewTime > thresholds.prReviewHours) {
    alerts.push({
      id: `alert-${Date.now()}-review`,
      severity: 'warning',
      category: 'maintenance',
      title: 'Slow PR Reviews',
      description: `Average PR review time is ${metrics.avgPrReviewTime.toFixed(0)} hours. Contributors may be frustrated.`,
      timestamp: new Date(),
      source: 'sla-monitor',
      actionRequired: false,
      suggestedActions: [
        'Prioritize smaller PRs',
        'Use PR templates',
        'Ask for help from contributors',
      ],
      relatedMetrics: { avgPrReviewTime: metrics.avgPrReviewTime },
      acknowledged: false,
    });
  }

  // Warning: Issue backlog
  if (metrics.openIssueCount > thresholds.openIssueCount) {
    alerts.push({
      id: `alert-${Date.now()}-backlog`,
      severity: 'warning',
      category: 'maintenance',
      title: 'Issue Backlog Growing',
      description: `${metrics.openIssueCount} open issues (threshold: ${thresholds.openIssueCount}). Consider triaging.`,
      timestamp: new Date(),
      source: 'issue-tracker',
      actionRequired: false,
      suggestedActions: [
        'Triage and close stale issues',
        'Add "help wanted" labels',
        'Use /close for inactive issues',
      ],
      relatedMetrics: { openIssueCount: metrics.openIssueCount },
      acknowledged: false,
    });
  }

  // Warning: Inactive project
  if (metrics.daysSinceLastCommit > thresholds.inactiveDays) {
    alerts.push({
      id: `alert-${Date.now()}-inactive`,
      severity: metrics.daysSinceLastCommit > 60 ? 'urgent' : 'warning',
      category: 'community',
      title: 'Project Inactivity',
      description: `${metrics.daysSinceLastCommit} days since last commit. Community may lose trust.`,
      timestamp: new Date(),
      source: 'activity-monitor',
      actionRequired: true,
      suggestedActions: [
        'Make a small commit to show activity',
        'Post an update to community',
        'Consider archiving or transferring',
      ],
      relatedMetrics: { daysSinceLastCommit: metrics.daysSinceLastCommit },
      acknowledged: false,
    });
  }

  // Info: High contributor churn
  if (metrics.contributorChurnRate > 0.3) {
    alerts.push({
      id: `alert-${Date.now()}-churn`,
      severity: 'warning',
      category: 'community',
      title: 'High Contributor Churn',
      description: `${(metrics.contributorChurnRate * 100).toFixed(0)}% of contributors have become inactive.`,
      timestamp: new Date(),
      source: 'contributor-tracker',
      actionRequired: false,
      suggestedActions: [
        'Survey former contributors',
        'Improve onboarding',
        'Recognize contributor efforts',
      ],
      relatedMetrics: { contributorChurnRate: metrics.contributorChurnRate },
      acknowledged: false,
    });
  }

  // Determine overall crisis level
  let level: CrisisStatus['level'] = 0;
  const hasCritical = alerts.some(a => a.severity === 'critical');
  const hasUrgent = alerts.some(a => a.severity === 'urgent');
  const hasWarning = alerts.some(a => a.severity === 'warning');

  if (hasCritical) level = 3;
  else if (hasUrgent) level = 2;
  else if (hasWarning) level = 1;

  const labels: Record<number, CrisisStatus['label']> = {
    0: 'Healthy',
    1: 'Monitoring',
    2: 'Attention Needed',
    3: 'Crisis',
  };

  const descriptions: Record<number, string> = {
    0: 'All systems normal. Keep up the great work!',
    1: `${hasWarning ? alerts.filter(a => a.severity === 'warning').length : 0} warning(s) require attention.`,
    2: `${hasUrgent ? alerts.filter(a => a.severity === 'urgent').length : 0} urgent issue(s) need resolution.`,
    3: 'Critical situation! Immediate action required.',
  };

  return {
    level,
    label: labels[level],
    description: descriptions[level],
    alerts,
  };
}

export function acknowledgeAlert(alerts: Alert[], alertId: string): Alert[] {
  return alerts.map(alert =>
    alert.id === alertId ? { ...alert, acknowledged: true } : alert
  );
}

export function resolveAlert(alerts: Alert[], alertId: string): Alert[] {
  return alerts.map(alert =>
    alert.id === alertId ? { ...alert, acknowledged: true, resolvedAt: new Date() } : alert
  );
}

export function getSeverityColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    urgent: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[severity];
}

export function getSeverityIcon(severity: AlertSeverity): string {
  const icons: Record<AlertSeverity, string> = {
    info: 'info',
    warning: 'warning',
    urgent: 'urgent',
    critical: 'critical',
  };
  return icons[severity];
}
