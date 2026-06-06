/**
 * Issue Manager
 * Intelligent issue triage, labeling, and management
 */

export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';
export type IssueStatus = 'open' | 'in_progress' | 'closed' | 'duplicate';
export type IssueType = 'bug' | 'feature' | 'how' | 'discussion';

export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  author: string;
  labels: string[];
  priority: IssuePriority;
  status: IssueStatus;
  type: IssueType;
  createdAt: Date;
  updatedAt: Date;
  assignee?: string;
  commentCount: number;
  reactions: {
    thumbsUp: number;
    heart: number;
    eyes: number;
    rocket: number;
  };
}

export interface IssueSummary {
  total: number;
  open: number;
  closed: number;
  byPriority: Record<IssuePriority, number>;
  byType: Record<IssueType, number>;
  avgResponseTime: number; // hours
  avgResolutionTime: number; // hours
}

export interface TriageResult {
  suggestedLabels: string[];
  suggestedPriority: IssuePriority;
  suggestedType: IssueType;
  confidence: number;
  similarIssues: Issue[];
  duplicateOf?: string;
}

/**
 * Analyze issue content and suggest labels
 */
export function analyzeIssueContent(issue: Pick<Issue, 'title' | 'body'>): TriageResult {
  const content = `${issue.title} ${issue.body}`.toLowerCase();
  
  const labelPatterns = [
    { pattern: /bug|error|crash|fix|broken|fail/i, labels: ['bug'] },
    { pattern: /feature|enhancement|improve|add|new/i, labels: ['enhancement'] },
    { pattern: /how|how|what|why|\?/i, labels: ['how'] },
    { pattern: /security|vulnerability|exploit|injection/i, labels: ['security'] },
    { pattern: /documentation|docs|readme|guide/i, labels: ['documentation'] },
    { pattern: /performance|slow|optimize|faster/i, labels: ['performance'] },
    { pattern: /breaking|change|upgrade|migration/i, labels: ['breaking-change'] },
  ];

  const suggestedLabels: string[] = [];
  labelPatterns.forEach(({ pattern, labels }) => {
    if (pattern.test(content)) {
      suggestedLabels.push(...labels);
    }
  });

  // Determine type
  let suggestedType: IssueType = 'discussion';
  if (/bug|error|crash|broken/i.test(content)) suggestedType = 'bug';
  else if (/feature|enhancement|add|new/i.test(content)) suggestedType = 'feature';
  else if (/how|how|what/i.test(content)) suggestedType = 'how';

  // Determine priority
  let suggestedPriority: IssuePriority = 'medium';
  if (/critical|urgent|crash|fatal/i.test(content)) suggestedPriority = 'critical';
  else if (/security|vulnerability/i.test(content)) suggestedPriority = 'high';

  // Calculate confidence
  const confidence = Math.min(100, suggestedLabels.length * 25 + 30);

  return {
    suggestedLabels,
    suggestedPriority,
    suggestedType,
    confidence,
    similarIssues: [],
  };
}

/**
 * Calculate issue summary statistics
 */
export function calculateIssueSummary(issues: Issue[]): IssueSummary {
  const open = issues.filter(i => i.status === 'open').length;
  const closed = issues.filter(i => i.status === 'closed').length;

  const byPriority: Record<IssuePriority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const byType: Record<IssueType, number> = {
    bug: 0,
    feature: 0,
    how: 0,
    discussion: 0,
  };

  issues.forEach(issue => {
    byPriority[issue.priority]++;
    byType[issue.type]++;
  });

  return {
    total: issues.length,
    open,
    closed,
    byPriority,
    byType,
    avgResponseTime: 12, // placeholder
    avgResolutionTime: 48, // placeholder
  };
}

/**
 * Sort issues by priority and activity
 */
export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => {
    // Critical first
    const priorityOrder: Record<IssuePriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by comment count (more discussion = higher priority)
    return b.commentCount - a.commentCount;
  });
}

/**
 * Generate issue report
 */
export function generateIssueReport(summary: IssueSummary): string {
  let report = '📊 **Issue Report**\n\n';
  report += `Total: ${summary.total} | Open: ${summary.open} | Closed: ${summary.closed}\n\n`;
  
  report += '**By Priority:**\n';
  for (const [priority, count] of Object.entries(summary.byPriority)) {
    if (count > 0) {
      const emoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[priority as IssuePriority];
      report += `${emoji} ${priority}: ${count}\n`;
    }
  }
  
  report += '\n**By Type:**\n';
  for (const [type, count] of Object.entries(summary.byType)) {
    if (count > 0) {
      report += `- ${type}: ${count}\n`;
    }
  }
  
  return report;
}
