/**
 * Stale Issue/PR Manager
 * Identifies and manages stale issues and pull requests
 */

export interface StaleItem {
  number: number;
  type: 'issue' | 'pull_request';
  title: string;
  author: string;
  createdAt: string;
  lastActivityAt: string;
  daysSinceActivity: number;
  labels: string[];
  reason: string;
  shouldClose: boolean;
  shouldPing: boolean;
}

export interface StaleConfig {
  issueDaysUntilStale: number;
  issueDaysUntilClose: number;
  prDaysUntilStale: number;
  prDaysUntilClose: number;
  exemptLabels: string[];
  exemptAuthors: string[];
}

export interface StaleReport {
  staleIssues: StaleItem[];
  stalePRs: StaleItem[];
  needsClosing: StaleItem[];
  needsPing: StaleItem[];
  stats: {
    totalStaleIssues: number;
    totalStalePRs: number;
    avgDaysSinceActivity: number;
    closeableCount: number;
  };
}

const DEFAULT_CONFIG: StaleConfig = {
  issueDaysUntilStale: 60,
  issueDaysUntilClose: 90,
  prDaysUntilStale: 14,
  prDaysUntilClose: 21,
  exemptLabels: ['pinned', 'security', 'keep-open'],
  exemptAuthors: ['dependabot', 'renovate'],
};

const STALE_REASONS = {
  noActivity: (days: number) => `No activity for ${days} days`,
  waitingOnAuthor: (days: number) => `Waiting on author response for ${days} days`,
  needsReview: (days: number) => `Needs review for ${days} days`,
  pendingFeedback: (days: number) => `Pending feedback for ${days} days`,
};

/**
 * Analyze items for staleness
 */
export function analyzeStaleItems(params: {
  issues: Array<{
    number: number;
    title: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    labels?: string[];
    state?: string;
  }>;
  pullRequests: Array<{
    number: number;
    title: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    labels?: string[];
    state?: string;
    draft?: boolean;
  }>;
  config?: Partial<StaleConfig>;
}): StaleReport {
  const config = { ...DEFAULT_CONFIG, ...params.config };
  const now = new Date();

  const staleIssues: StaleItem[] = [];
  const stalePRs: StaleItem[] = [];
  const needsClosing: StaleItem[] = [];
  const needsPing: StaleItem[] = [];

  // Process issues
  for (const issue of params.issues) {
    if (issue.state === 'closed') continue;
    if (isExempt(issue.labels || [], issue.author, config)) continue;

    const daysSinceActivity = getDaysDifference(new Date(issue.updatedAt), now);
    const daysSinceCreation = getDaysDifference(new Date(issue.createdAt), now);

    if (daysSinceActivity >= config.issueDaysUntilStale) {
      const shouldClose = daysSinceActivity >= config.issueDaysUntilClose;
      const reason = getStaleReason(daysSinceActivity, 'issue');

      const item: StaleItem = {
        number: issue.number,
        type: 'issue',
        title: issue.title,
        author: issue.author,
        createdAt: issue.createdAt,
        lastActivityAt: issue.updatedAt,
        daysSinceActivity,
        labels: issue.labels || [],
        reason,
        shouldClose,
        shouldPing: !shouldClose,
      };

      staleIssues.push(item);
      
      if (shouldClose) {
        needsClosing.push(item);
      } else if (daysSinceActivity >= config.issueDaysUntilStale) {
        needsPing.push(item);
      }
    }
  }

  // Process PRs
  for (const pr of params.pullRequests) {
    if (pr.state === 'closed' || pr.state === 'merged') continue;
    if (pr.draft) continue;
    if (isExempt(pr.labels || [], pr.author, config)) continue;

    const daysSinceActivity = getDaysDifference(new Date(pr.updatedAt), now);
    const daysSinceCreation = getDaysDifference(new Date(pr.createdAt), now);

    if (daysSinceActivity >= config.prDaysUntilStale) {
      const shouldClose = daysSinceActivity >= config.prDaysUntilClose;
      const reason = getStaleReason(daysSinceActivity, 'pr');

      const item: StaleItem = {
        number: pr.number,
        type: 'pull_request',
        title: pr.title,
        author: pr.author,
        createdAt: pr.createdAt,
        lastActivityAt: pr.updatedAt,
        daysSinceActivity,
        labels: pr.labels || [],
        reason,
        shouldClose,
        shouldPing: !shouldClose,
      };

      stalePRs.push(item);
      
      if (shouldClose) {
        needsClosing.push(item);
      } else {
        needsPing.push(item);
      }
    }
  }

  const allStale = [...staleIssues, ...stalePRs];
  const avgDays = allStale.length > 0
    ? Math.round(allStale.reduce((sum, item) => sum + item.daysSinceActivity, 0) / allStale.length)
    : 0;

  return {
    staleIssues,
    stalePRs,
    needsClosing,
    needsPing,
    stats: {
      totalStaleIssues: staleIssues.length,
      totalStalePRs: stalePRs.length,
      avgDaysSinceActivity: avgDays,
      closeableCount: needsClosing.length,
    },
  };
}

function isExempt(labels: string[], author: string, config: StaleConfig): boolean {
  // Check exempt labels
  for (const label of labels) {
    if (config.exemptLabels.some(el => label.toLowerCase().includes(el.toLowerCase()))) {
      return true;
    }
  }

  // Check exempt authors
  if (config.exemptAuthors.some(ea => author.toLowerCase().includes(ea))) {
    return true;
  }

  return false;
}

function getDaysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function getStaleReason(days: number, type: 'issue' | 'pr'): string {
  if (type === 'pr') {
    return STALE_REASONS.needsReview(days);
  }
  
  if (days > 60) {
    return STALE_REASONS.waitingOnAuthor(days);
  }
  if (days > 30) {
    return STALE_REASONS.pendingFeedback(days);
  }
  return STALE_REASONS.noActivity(days);
}

/**
 * Generate close message for stale items
 */
export function generateCloseMessage(item: StaleItem): string {
  const type = item.type === 'pull_request' ? 'PR' : 'Issue';
  
  return `## ${type} #${item.number} marked as stale

This ${item.type} has been inactive for ${item.daysSinceActivity} days.

**Title:** ${item.title}

${item.reason}

I'm closing this for housekeeping. If you're still interested in this ${item.type === 'pull_request' ? 'PR' : 'issue'}, please feel free to reopen it or create a new one with updated information.`;
}

/**
 * Generate ping message for stale items
 */
export function generatePingMessage(item: StaleItem): string {
  return `Hey @${item.author}! Just checking in on this ${item.type === 'pull_request' ? 'PR' : 'issue'}.

**${item.title}** (#${item.number})

${item.reason}

Is this still something you're working on? Let us know if you need any help or have any questions!`;
}

/**
 * Generate stale report summary
 */
export function generateStaleSummary(report: StaleReport): string {
  const lines: string[] = [];
  
  lines.push('# Stale Items Report\n');
  
  if (report.staleIssues.length > 0) {
    lines.push(`## Stale Issues (${report.staleIssues.length})`);
    lines.push('');
    for (const issue of report.staleIssues.slice(0, 5)) {
      lines.push(`- #${issue.number}: ${issue.title} (${issue.daysSinceActivity}d stale)`);
    }
    if (report.staleIssues.length > 5) {
      lines.push(`- ... and ${report.staleIssues.length - 5} more`);
    }
    lines.push('');
  }
  
  if (report.stalePRs.length > 0) {
    lines.push(`## Stale PRs (${report.stalePRs.length})`);
    lines.push('');
    for (const pr of report.stalePRs.slice(0, 5)) {
      lines.push(`- #${pr.number}: ${pr.title} (${pr.daysSinceActivity}d stale)`);
    }
    if (report.stalePRs.length > 5) {
      lines.push(`- ... and ${report.stalePRs.length - 5} more`);
    }
    lines.push('');
  }
  
  lines.push('## Summary');
  lines.push(`- Total stale issues: ${report.stats.totalStaleIssues}`);
  lines.push(`- Total stale PRs: ${report.stats.totalStalePRs}`);
  lines.push(`- Items to close: ${report.stats.closeableCount}`);
  lines.push(`- Average days stale: ${report.stats.avgDaysSinceActivity}`);
  
  return lines.join('\n');
}
