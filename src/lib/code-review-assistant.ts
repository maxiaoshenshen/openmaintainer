/**
 * Code Review Assistant
 * Helps maintainers review PRs efficiently with AI-powered suggestions
 */
export interface ReviewCriteria {
  testCoverage?: boolean;
  documentation?: boolean;
  breakingChanges?: boolean;
  performance?: boolean;
  security?: boolean;
  backwardsCompatibility?: boolean;
}

export interface ReviewSuggestion {
  type: 'approve' | 'request-changes' | 'comment' | 'praise';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'code-quality' | 'testing' | 'docs' | 'security' | 'performance' | 'style';
  title: string;
  description: string;
  file?: string;
  line?: number;
  effort: number; // estimated minutes to address
}

export interface ReviewAnalysis {
  pr: {
    title: string;
    description: string;
    additions: number;
    deletions: number;
    changedFiles: number;
    author: string;
    isNewContributor: boolean;
  };
  suggestions: ReviewSuggestion[];
  summary: string;
  estimatedReviewTime: number; // minutes
  riskLevel: 'low' | 'medium' | 'high';
}

export function analyzePRForReview(
  pr: ReviewAnalysis['pr'],
  criteria: ReviewCriteria,
): ReviewAnalysis {
  const suggestions: ReviewSuggestion[] = [];
  const now = new Date();

  // Check for breaking changes
  if (criteria.breakingChanges !== false && (pr.additions > 500 || pr.deletions > 200)) {
    suggestions.push({
      type: 'comment',
      priority: 'high',
      category: 'code-quality',
      title: 'Large PR - Verify Breaking Changes',
      description: 'This PR makes significant changes. Please confirm no breaking changes to existing APIs.',
      effort: 5,
    });
  }

  // New contributor handling
  if (pr.isNewContributor) {
    suggestions.push({
      type: 'praise',
      priority: 'low',
      category: 'code-quality',
      title: 'Welcome New Contributor',
      description: 'This is a new contributor. Consider being extra encouraging in your review.',
      effort: 2,
    });
  }

  // Test coverage check
  if (criteria.testCoverage) {
    suggestions.push({
      type: 'request-changes',
      priority: 'high',
      category: 'testing',
      title: 'Add Tests',
      description: 'PR description does not mention test coverage. Please add relevant tests.',
      effort: 30,
    });
  }

  // Documentation check
  if (criteria.documentation && pr.changedFiles > 3) {
    suggestions.push({
      type: 'comment',
      priority: 'medium',
      category: 'docs',
      title: 'Update Documentation',
      description: 'Multiple files changed. Ensure documentation is updated accordingly.',
      effort: 15,
    });
  }

  // Security check for large PRs
  if (criteria.security && (pr.additions > 200 || pr.deletions > 100)) {
    suggestions.push({
      type: 'request-changes',
      priority: 'critical',
      category: 'security',
      title: 'Security Review Required',
      description: 'Large changes detected. Please verify no security vulnerabilities introduced.',
      effort: 20,
    });
  }

  // Performance check
  if (criteria.performance) {
    suggestions.push({
      type: 'comment',
      priority: 'medium',
      category: 'performance',
      title: 'Check Performance Impact',
      description: 'Consider running benchmarks if this affects core functionality.',
      effort: 10,
    });
  }

  // Calculate estimated review time
  const baseTime = 5;
  const effortTime = suggestions.reduce((sum, s) => sum + s.effort, 0);
  const estimatedReviewTime = baseTime + effortTime;

  // Determine risk level
  const criticalCount = suggestions.filter(s => s.priority === 'critical').length;
  const highCount = suggestions.filter(s => s.priority === 'high').length;
  const riskLevel = criticalCount > 0 ? 'high' : highCount > 2 ? 'high' : highCount > 0 ? 'medium' : 'low';

  // Generate summary
  const needsChanges = suggestions.filter(s => s.type === 'request-changes').length;
  const summary = needsChanges > 0
    ? `${needsChanges} change request(s) needed. Estimated review time: ${estimatedReviewTime} minutes.`
    : `Looks good! Estimated review time: ${estimatedReviewTime} minutes.`;

  return {
    pr,
    suggestions,
    summary,
    estimatedReviewTime,
    riskLevel,
  };
}

export function generateReviewComment(analysis: ReviewAnalysis): string {
  const lines: string[] = [
    '## Code Review Analysis',
    '',
  ];

  // Risk badge
  const riskEmoji = analysis.riskLevel === 'high' ? '🔴' : analysis.riskLevel === 'medium' ? '🟡' : '🟢';
  lines.push(`**Risk Level:** ${riskEmoji} ${analysis.riskLevel.toUpperCase()}`);
  lines.push(`**Estimated Review Time:** ${analysis.estimatedReviewTime} minutes`);
  lines.push('');

  // Group by type
  const byType = {
    'request-changes': analysis.suggestions.filter(s => s.type === 'request-changes'),
    'comment': analysis.suggestions.filter(s => s.type === 'comment'),
    'approve': analysis.suggestions.filter(s => s.type === 'approve'),
    'praise': analysis.suggestions.filter(s => s.type === 'praise'),
  };

  if (byType['request-changes'].length > 0) {
    lines.push('### Changes Requested');
    for (const s of byType['request-changes']) {
      lines.push(`- **[${s.category}]** ${s.title}: ${s.description}`);
    }
    lines.push('');
  }

  if (byType['praise'].length > 0) {
    lines.push('### Praise');
    for (const s of byType['praise']) {
      lines.push(`- ${s.title}: ${s.description}`);
    }
    lines.push('');
  }

  lines.push(`_${analysis.summary}_`);

  return lines.join('\n');
}
