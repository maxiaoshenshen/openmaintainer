/**
 * Stale Bot - Automatically manage stale issues and PRs
 */

export interface StaleConfig {
  daysUntilStale: number;
  daysUntilClose: number;
  staleLabel: string;
  closeLabel?: string;
  exemptLabels?: string[];
  onlyLabels?: string[];
  onlyMilestones?: string[];
}

export interface Activity {
  type: 'opened' | 'commented' | 'labeled' | 'milestoned';
  date: Date;
  actor: string;
}

export interface IssueStatus {
  number: number;
  title: string;
  isStale: boolean;
  isExempt: boolean;
  lastActivity: Date;
  daysSinceActivity: number;
  action: 'stale' | 'close' | 'none';
}

const DEFAULT_CONFIG: StaleConfig = {
  daysUntilStale: 60,
  daysUntilClose: 7,
  staleLabel: 'stale',
  exemptLabels: ['pinned', 'security'],
  onlyLabels: [],
  onlyMilestones: []
};

/**
 * Check if issue should be exempt
 */
export function isExempt(
  labels: string[],
  milestones: string[],
  config: StaleConfig
): boolean {
  if (config.exemptLabels?.some(label => labels.includes(label))) {
    return true;
  }
  if (config.onlyLabels.length > 0 && !config.onlyLabels.some(label => labels.includes(label))) {
    return true;
  }
  if (config.onlyMilestones?.length > 0 && !config.onlyMilestones.some(m => milestones.includes(m))) {
    return true;
  }
  return false;
}

/**
 * Calculate days since activity
 */
export function daysSinceActivity(activities: Activity[]): number {
  if (activities.length === 0) return Infinity;
  const lastActivity = activities.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  const now = new Date();
  return Math.floor((now.getTime() - lastActivity.date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determine action for issue
 */
export function determineAction(
  issueActivities: Activity[],
  labels: string[],
  milestones: string[],
  config: Partial<StaleConfig> = {}
): 'stale' | 'close' | 'none' {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const days = daysSinceActivity(issueActivities);

  if (isExempt(labels, milestones, fullConfig)) {
    return 'none';
  }

  if (days >= fullConfig.daysUntilStale + fullConfig.daysUntilClose) {
    return 'close';
  }

  if (days >= fullConfig.daysUntilStale) {
    return 'stale';
  }

  return 'none';
}

/**
 * Check all issues and determine actions
 */
export function checkStaleIssues(
  issues: Array<{
    number: number;
    title: string;
    labels: string[];
    milestones: string[];
    activities: Activity[];
  }>,
  config: Partial<StaleConfig> = {}
): IssueStatus[] {
  return issues.map(issue => ({
    number: issue.number,
    title: issue.title,
    isStale: daysSinceActivity(issue.activities) >= (config.daysUntilStale || DEFAULT_CONFIG.daysUntilStale),
    isExempt: isExempt(issue.labels, issue.milestones, { ...DEFAULT_CONFIG, ...config }),
    lastActivity: issue.activities.sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.date || new Date(0),
    daysSinceActivity: daysSinceActivity(issue.activities),
    action: determineAction(issue.activities, issue.labels, issue.milestones, config)
  }));
}

/**
 * Generate stale bot comment
 */
export function generateStaleComment(daysUntilClose: number, labels: string[]): string {
  let comment = `This issue has been automatically marked as stale because it has not had recent activity. `;
  comment += `It will be closed in ${daysUntilClose} days after removing the stale label. `;
  if (labels.includes('bug')) {
    comment += `\n\n**Bug users**: Please provide a reproduction case.`;
  }
  if (labels.includes('enhancement')) {
    comment += `\n\n**Enhancement users**: Please describe your use case.`;
  }
  comment += `\n\nThank you for your contribution!`;
  return comment;
}

/**
 * Get stale statistics
 */
export function getStaleStats(issues: IssueStatus[]): {
  total: number;
  stale: number;
  closeable: number;
  exempt: number;
  percentage: number;
} {
  const stale = issues.filter(i => i.action === 'stale').length;
  const closeable = issues.filter(i => i.action === 'close').length;
  const exempt = issues.filter(i => i.isExempt).length;
  return {
    total: issues.length,
    stale,
    closeable,
    exempt,
    percentage: issues.length > 0 ? Math.round((stale / issues.length) * 100) : 0
  };
}
