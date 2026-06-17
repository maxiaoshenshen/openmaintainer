import type { Repository, PullRequest } from './types';

/**
 * PR Merge Advisor - Suggests optimal merge timing and strategy
 */
export interface MergeRecommendation {
  pullRequest: PullRequest;
  canMerge: boolean;
  mergeStrategy: MergeStrategy;
  score: number;
  blockers: MergeBlocker[];
  suggestions: string[];
  estimatedReviewTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  conflictResolution?: string;
}

export type MergeStrategy = 'squash' | 'merge' | 'rebase';

export interface MergeBlocker {
  type: 'conflict' | 'review' | 'test' | 'status' | 'draft' | 'stale';
  severity: 'blocking' | 'warning';
  message: string;
  fixSuggestion: string;
}

export interface BatchMergeResult {
  recommendedOrder: PullRequest[];
  batchGroups: BatchGroup[];
  estimatedCompletionTime: number;
  warnings: string[];
}

export interface BatchGroup {
  priority: number;
  prs: PullRequest[];
  reason: string;
}

export function createPRMergeAdvisor() {
  const analyzePR = (pr: PullRequest, repo: Repository): MergeRecommendation => {
    const blockers: MergeBlocker[] = [];
    let score = 100;
    const suggestions: string[] = [];

    // Check draft status
    if (pr.state === 'draft') {
      blockers.push({
        type: 'draft',
        severity: 'blocking',
        message: 'PR is in draft state',
        fixSuggestion: 'Mark PR as ready for review or close draft status'
      });
      score -= 30;
    }

    // Check test coverage
    if (pr.additions > 50 && !pr.body?.includes('test')) {
      blockers.push({
        type: 'test',
        severity: 'warning',
        message: 'Large PR without test information',
        fixSuggestion: 'Add test plan or include test coverage'
      });
      score -= 15;
    }

    // Check review status
    if (!pr.labels?.includes('approved') && pr.additions > 100) {
      blockers.push({
        type: 'review',
        severity: 'blocking',
        message: 'Large PR needs review before merge',
        fixSuggestion: 'Request review from maintainers'
      });
      score -= 25;
    }

    // Check CI status
    if (!pr.body?.includes('ci') && !pr.body?.includes('CI')) {
      suggestions.push('Verify CI/CD pipelines passed');
      score -= 5;
    }

    // Check stale PRs
    const updatedDays = Math.floor((Date.now() - new Date(pr.updatedAt).getTime()) / (24 * 60 * 60 * 1000));
    if (updatedDays > 14) {
      blockers.push({
        type: 'stale',
        severity: 'warning',
        message: `PR is ${updatedDays} days old`,
        fixSuggestion: 'Rebase or update with recent changes'
      });
      score -= 10;
    }

    // Size-based recommendations
    if (pr.additions > 500) {
      suggestions.push('Consider splitting large PR into smaller ones');
      score -= 20;
    }

    const canMerge = !blockers.some(b => b.severity === 'blocking');
    const mergeStrategy = determineMergeStrategy(pr);
    const riskLevel = score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high';
    const estimatedReviewTime = calculateReviewTime(pr);

    return {
      pullRequest: pr,
      canMerge,
      mergeStrategy,
      score: Math.max(0, score),
      blockers,
      suggestions,
      estimatedReviewTime,
      riskLevel
    };
  };

  const determineMergeStrategy = (pr: PullRequest): MergeStrategy => {
    if (pr.additions > 300) return 'squash';
    if (pr.title.includes('refactor')) return 'rebase';
    return 'merge';
  };

  const calculateReviewTime = (pr: PullRequest): number => {
    const baseTime = 5;
    const sizeTime = Math.floor(pr.additions / 50) * 3;
    const complexityTime = Math.floor((pr.additions + pr.deletions) / 100) * 2;
    return baseTime + sizeTime + complexityTime;
  };

  const createBatchMergePlan = (prs: PullRequest[], repo: Repository): BatchMergeResult => {
    const analyzed = prs.map(pr => ({ pr, rec: analyzePR(pr, repo) }));
    
    // Sort by merge readiness
    analyzed.sort((a, b) => {
      if (a.rec.canMerge !== b.rec.canMerge) return a.rec.canMerge ? -1 : 1;
      return b.rec.score - a.rec.score;
    });

    const batchGroups: BatchGroup[] = [
      { priority: 1, prs: analyzed.filter(a => a.rec.canMerge).map(a => a.pr), reason: 'Ready to merge' },
      { priority: 2, prs: analyzed.filter(a => !a.rec.canMerge && a.rec.score >= 50).map(a => a.pr), reason: 'Needs minor fixes' },
      { priority: 3, prs: analyzed.filter(a => a.rec.score < 50).map(a => a.pr), reason: 'Requires significant work' }
    ].filter(g => g.prs.length > 0);

    const estimatedTime = analyzed
      .filter(a => a.rec.canMerge)
      .reduce((sum, a) => sum + a.rec.estimatedReviewTime, 0);

    const warnings = analyzed
      .filter(a => a.rec.riskLevel === 'high')
      .map(a => `⚠️ ${a.pr.title} has high risk level`);

    return {
      recommendedOrder: analyzed.map(a => a.pr),
      batchGroups,
      estimatedCompletionTime: estimatedTime,
      warnings
    };
  };

  const getMergeScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const formatMergeRecommendation = (rec: MergeRecommendation): string => {
    const lines = [
      `# Merge Recommendation: #${rec.pullRequest.number}`,
      '',
      `**Status**: ${rec.canMerge ? '✅ Ready to Merge' : '❌ Not Ready'}`,
      `**Score**: ${rec.score}/100`,
      `**Strategy**: ${rec.mergeStrategy}`,
      `**Risk**: ${rec.riskLevel.toUpperCase()}`,
      ''
    ];

    if (rec.blockers.length > 0) {
      lines.push('## Blockers');
      rec.blockers.forEach(b => {
        lines.push(`- [${b.severity}] ${b.message}`);
      });
      lines.push('');
    }

    if (rec.suggestions.length > 0) {
      lines.push('## Suggestions');
      rec.suggestions.forEach(s => lines.push(`- ${s}`));
      lines.push('');
    }

    lines.push(`**Estimated Review Time**: ${rec.estimatedReviewTime} minutes`);

    return lines.join('\n');
  };

  return {
    analyzePR,
    createBatchMergePlan,
    getMergeScoreColor,
    formatMergeRecommendation,
    mergeStrategies: ['squash', 'merge', 'rebase'] as const,
    riskLevels: ['low', 'medium', 'high'] as const
  };
}
