/**
 * PR Review Assistant - AI-powered PR review automation
 */

export interface PRFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
  contents?: string;
}

export interface PRReview {
  prNumber: number;
  summary: string;
  comments: ReviewComment[];
  score: number;
  recommendation: 'approve' | 'request_changes' | 'comment';
}

export interface ReviewComment {
  file: string;
  line?: number;
  type: 'suggestion' | 'issue' | 'question' | 'praise';
  body: string;
  severity?: 'blocker' | 'major' | 'minor' | 'info';
}

export interface CodeQualityMetrics {
  testCoverage: number;
  codeDuplication: number;
  complexity: number;
  maintainability: number;
}

export function analyzeFileChanges(files: PRFile[]): {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  areasOfConcern: string[];
} {
  const summary: string[] = [];
  const concerns: string[] = [];
  
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);
  const newFiles = files.filter(f => f.status === 'added').length;
  const deletedFiles = files.filter(f => f.status === 'deleted').length;

  summary.push(`+${totalAdditions} / -${totalDeletions} lines`);
  summary.push(`${newFiles} new file(s), ${deletedFiles} deleted`);

  // Identify concerns
  const largeFiles = files.filter(f => f.additions > 300);
  if (largeFiles.length) {
    concerns.push(`${largeFiles.length} large file(s) (>300 lines added)`);
  }

  const configChanges = files.filter(f => 
    f.filename.includes('.github') || 
    f.filename.includes('package.json') ||
    f.filename.includes('Dockerfile')
  );
  if (configChanges.length) {
    concerns.push(`${configChanges.length} configuration file(s) changed`);
  }

  const riskLevel = concerns.length > 2 ? 'high' : concerns.length > 0 ? 'medium' : 'low';

  return {
    summary: summary.join(' • '),
    riskLevel,
    areasOfConcern: concerns,
  };
}

export function detectCommonIssues(files: PRFile[]): ReviewComment[] {
  const comments: ReviewComment[] = [];

  files.forEach(file => {
    // Check for console.log in code
    if (file.contents?.includes('console.log')) {
      comments.push({
        file: file.filename,
        type: 'issue',
        severity: 'minor',
        body: 'Consider removing console.log statements before merging',
      });
    }

    // Check for TODO comments
    if (file.contents?.match(/TODO|FIXME|HACK/)) {
      comments.push({
        file: file.filename,
        type: 'issue',
        severity: 'info',
        body: 'Found TODO/FIXME comments - consider addressing before merging',
      });
    }

    // Check for large files
    if (file.additions > 500) {
      comments.push({
        file: file.filename,
        type: 'suggestion',
        severity: 'minor',
        body: 'This file is large (>500 lines). Consider splitting it.',
      });
    }

    // Check for secrets in code
    if (file.contents?.match(/(password|secret|api_key|token)\s*=/i)) {
      comments.push({
        file: file.filename,
        type: 'issue',
        severity: 'blocker',
        body: 'Potential hardcoded secret detected. Use environment variables instead.',
      });
    }
  });

  return comments;
}

export function generateReviewSummary(review: PRReview): string {
  const emoji = {
    approve: '✅',
    request_changes: '❌',
    comment: '💬',
  }[review.recommendation];

  let summary = `${emoji} **PR #${review.prNumber} Review Summary**\n\n`;
  summary += `**Overall Score:** ${review.score}/100\n`;
  summary += `**Recommendation:** ${review.recommendation.replace('_', ' ')}\n\n`;
  summary += `---\n\n`;
  summary += `**Summary:** ${review.summary}\n\n`;

  if (review.comments.length > 0) {
    summary += `**Issues Found:** ${review.comments.length}\n\n`;
    
    const blockers = review.comments.filter(c => c.severity === 'blocker');
    const major = review.comments.filter(c => c.severity === 'major');
    
    if (blockers.length > 0) {
      summary += `🚫 **Blockers:** ${blockers.length}\n`;
    }
    if (major.length > 0) {
      summary += `⚠️ **Major Issues:** ${major.length}\n`;
    }
  }

  return summary;
}

export function calculatePRScore(metrics: CodeQualityMetrics, files: PRFile[]): number {
  let score = 100;

  // Deduct for low test coverage
  if (metrics.testCoverage < 50) score -= 30;
  else if (metrics.testCoverage < 80) score -= 15;

  // Deduct for code duplication
  if (metrics.codeDuplication > 10) score -= 20;
  else if (metrics.codeDuplication > 5) score -= 10;

  // Deduct for complexity
  if (metrics.complexity > 20) score -= 15;
  else if (metrics.complexity > 10) score -= 5;

  // Deduct for maintainability issues
  if (metrics.maintainability < 50) score -= 15;
  else if (metrics.maintainability < 70) score -= 5;

  // Deduct for large PRs
  const totalChanges = files.reduce((sum, f) => sum + f.additions + f.deletions, 0);
  if (totalChanges > 1000) score -= 10;
  else if (totalChanges > 500) score -= 5;

  return Math.max(0, Math.min(100, score));
}

export function suggestReviewers(files: PRFile[], teamMembers: string[]): string[] {
  const suggestions: string[] = [];
  const fileTypes = new Set(files.map(f => f.filename.split('.').pop()));

  // Simple round-robin suggestion based on file types
  const typeToReviewer: Record<string, string[]> = {
    ts: ['@frontend-team', '@backend-team'],
    js: ['@frontend-team'],
    py: ['@backend-team'],
    go: ['@backend-team'],
    rs: ['@systems-team'],
    md: ['@docs-team'],
  };

  fileTypes.forEach(type => {
    const reviewers = typeToReviewer[type];
    if (reviewers) {
      reviewers.forEach(r => {
        if (!suggestions.includes(r)) suggestions.push(r);
      });
    }
  });

  // Always suggest maintainer for significant changes
  if (files.length > 5) {
    suggestions.push('@maintainer');
  }

  return suggestions.slice(0, 3);
}
