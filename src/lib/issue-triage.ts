import type { Repository, Issue } from './types';

/**
 * Issue Triage System - Automatically categorizes and prioritizes issues
 */
export interface TriageResult {
  issue: Issue;
  category: IssueCategory;
  priority: Priority;
  confidence: number;
  suggestedLabels: string[];
  suggestedAssignee?: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  relatedIssues?: string[];
  triageReason: string;
}

export type IssueCategory = 
  | 'bug' 
  | 'feature-request' 
  | 'documentation' 
  | 'question' 
  | 'duplicate'
  | 'security'
  | 'performance'
  | 'enhancement';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface TriageSummary {
  totalIssues: number;
  byCategory: Record<IssueCategory, number>;
  byPriority: Record<Priority, number>;
  un triaged: number;
  averageAge: number;
  oldestIssue: Issue | null;
  recentlyTriaged: number;
}

export function createIssueTriageSystem() {
  const categorizeIssue = (issue: Issue): TriageResult => {
    const title = issue.title.toLowerCase();
    const body = issue.body?.toLowerCase() || '';
    const combined = `${title} ${body}`;

    let category: IssueCategory = 'question';
    let priority: Priority = 'medium';
    let confidence = 0.5;
    const labels: string[] = [];
    let effort: TriageResult['estimatedEffort'] = 'medium';
    let reason = 'Default categorization';

    // Bug detection
    if (combined.includes('crash') || combined.includes('broken') || combined.includes('not working')) {
      category = 'bug';
      priority = 'high';
      confidence = 0.85;
      labels.push('bug');
      effort = 'high';
      reason = 'Issue describes a broken or non-functional feature';
    }

    // Security detection
    if (combined.includes('security') || combined.includes('vulnerability') || combined.includes('cve') || combined.includes('xss') || combined.includes('injection')) {
      category = 'security';
      priority = 'critical';
      confidence = 0.95;
      labels.push('security', 'priority:critical');
      effort = 'high';
      reason = 'Security-related issue requires immediate attention';
    }

    // Feature request
    if (combined.includes('would be nice') || combined.includes('feature') || combined.includes('add') || combined.includes('support for')) {
      category = 'feature-request';
      priority = 'medium';
      confidence = 0.8;
      labels.push('enhancement');
      effort = 'high';
      reason = 'New feature or capability requested';
    }

    // Documentation
    if (combined.includes('docs') || combined.includes('documentation') || combined.includes('readme') || combined.includes('typo')) {
      category = 'documentation';
      priority = 'low';
      confidence = 0.75;
      labels.push('documentation');
      effort = 'low';
      reason = 'Documentation improvement or correction';
    }

    // Performance
    if (combined.includes('slow') || combined.includes('performance') || combined.includes('memory leak') || combined.includes('optimize')) {
      category = 'performance';
      priority = 'high';
      confidence = 0.8;
      labels.push('performance');
      effort = 'medium';
      reason = 'Performance-related issue detected';
    }

    // Question
    if (combined.includes('how to') || combined.includes('?') || combined.includes('can i')) {
      category = 'question';
      priority = 'low';
      confidence = 0.7;
      labels.push('question');
      effort = 'low';
      reason = 'User question that can be answered directly';
    }

    // Duplicate
    if (combined.includes('duplicate') || combined.includes('already reported')) {
      category = 'duplicate';
      priority = 'low';
      confidence = 0.9;
      labels.push('duplicate');
      reason = 'Issue marked as duplicate';
    }

    return {
      issue,
      category,
      priority,
      confidence,
      suggestedLabels: labels,
      estimatedEffort: effort,
      triageReason: reason
    };
  };

  const triageIssues = (issues: Issue[]): TriageResult[] => {
    return issues.map(issue => categorizeIssue(issue));
  };

  const generateTriageSummary = (results: TriageResult[]): TriageSummary => {
    const byCategory = {} as Record<IssueCategory, number>;
    const byPriority = {} as Record<Priority, number>;
    let totalAge = 0;
    let oldest: Issue | null = null;
    let oldestAge = 0;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const categories: IssueCategory[] = ['bug', 'feature-request', 'documentation', 'question', 'duplicate', 'security', 'performance', 'enhancement'];
    const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];

    categories.forEach(c => byCategory[c] = 0);
    priorities.forEach(p => byPriority[p] = 0);

    results.forEach(result => {
      byCategory[result.category]++;
      byPriority[result.priority]++;

      const age = Date.now() - new Date(result.issue.createdAt).getTime();
      totalAge += age;

      if (age > oldestAge) {
        oldestAge = age;
        oldest = result.issue;
      }
    });

    const untriaged = results.filter(r => r.confidence < 0.6).length;
    const recentlyTriaged = results.filter(r => 
      new Date(r.issue.createdAt).getTime() > thirtyDaysAgo
    ).length;

    return {
      totalIssues: results.length,
      byCategory,
      byPriority,
      untriaged,
      averageAge: results.length > 0 ? totalAge / results.length / (24 * 60 * 60 * 1000) : 0,
      oldestIssue: oldest,
      recentlyTriaged
    };
  };

  const getPriorityColor = (priority: Priority): string => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#f59e0b',
      low: '#10b981'
    };
    return colors[priority];
  };

  const getCategoryColor = (category: IssueCategory): string => {
    const colors = {
      bug: '#ef4444',
      'feature-request': '#8b5cf6',
      documentation: '#06b6d4',
      question: '#6366f1',
      duplicate: '#6b7280',
      security: '#dc2626',
      performance: '#f59e0b',
      enhancement: '#10b981'
    };
    return colors[category];
  };

  return {
    categorizeIssue,
    triageIssues,
    generateTriageSummary,
    getPriorityColor,
    getCategoryColor,
    categories: ['bug', 'feature-request', 'documentation', 'question', 'duplicate', 'security', 'performance', 'enhancement'] as const,
    priorities: ['critical', 'high', 'medium', 'low'] as const
  };
}
