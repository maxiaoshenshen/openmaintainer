/**
 * Code Review Assistant - AI-powered code review and suggestions
 */

export type ReviewCommentType = 'suggestion' | 'issue' | 'question' | 'praise' | 'nitpick';
export type SeverityLevel = 'blocker' | 'critical' | 'major' | 'minor' | 'info';

export interface ReviewComment {
  id: string;
  type: ReviewCommentType;
  severity: SeverityLevel;
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
  explanation?: string;
  canApply?: boolean;
}

export interface CodeReview {
  id: string;
  prNumber: number;
  repository: string;
  createdAt: number;
  comments: ReviewComment[];
  summary: ReviewSummary;
  score: number;
}

export interface ReviewSummary {
  totalComments: number;
  blockers: number;
  criticalIssues: number;
  suggestions: number;
  praise: number;
  canMerge: boolean;
  reviewTime: number; // estimated minutes
}

export interface ReviewConfig {
  languages?: string[];
  checkSecurity?: boolean;
  checkPerformance?: boolean;
  checkBestPractices?: boolean;
  strictMode?: boolean;
}

/**
 * Generate review comments for code changes
 */
export function generateReviewComments(
  changes: CodeChange[],
  config?: ReviewConfig
): ReviewComment[] {
  const comments: ReviewComment[] = [];

  for (const change of changes) {
    // Security checks
    if (config?.checkSecurity !== false) {
      comments.push(...checkSecurity(change));
    }

    // Performance checks
    if (config?.checkPerformance !== false) {
      comments.push(...checkPerformance(change));
    }

    // Best practices
    if (config?.checkBestPractices !== false) {
      comments.push(...checkBestPractices(change));
    }

    // General patterns
    comments.push(...checkGeneralPatterns(change));
  }

  return comments;
}

interface CodeChange {
  file: string;
  language?: string;
  diff: string;
  additions: number;
  deletions: number;
}

function checkSecurity(change: CodeChange): ReviewComment[] {
  const comments: ReviewComment[] = [];
  const { file, diff } = change;

  // Check for hardcoded secrets
  if (/password|secret|api[_-]?key|token/i.test(diff)) {
    comments.push({
      id: generateId(),
      type: 'issue',
      severity: 'critical',
      file,
      message: 'Potential hardcoded secret detected',
      explanation: 'Hardcoded secrets can be exposed in version control. Use environment variables or a secrets manager.',
      suggestion: 'Replace with `process.env.SECRET_NAME` or use a secrets manager.',
    });
  }

  // SQL injection risk
  if (/SELECT|UPDATE|DELETE|INSERT/i.test(diff) && /\$\{|`.*\$\{/i.test(diff)) {
    comments.push({
      id: generateId(),
      type: 'issue',
      severity: 'blocker',
      file,
      message: 'Potential SQL injection vulnerability',
      explanation: 'String concatenation in SQL queries can lead to SQL injection attacks.',
      suggestion: 'Use parameterized queries or an ORM.',
    });
  }

  // XSS risk in frontend code
  if (/\.(tsx?|jsx?)$/.test(file) && /innerHTML|dangerouslySetInnerHTML/i.test(diff)) {
    comments.push({
      id: generateId(),
      type: 'issue',
      severity: 'critical',
      file,
      message: 'Potential XSS vulnerability',
      explanation: 'Direct HTML injection can lead to cross-site scripting attacks.',
      suggestion: 'Use textContent or sanitize HTML libraries like DOMPurify.',
    });
  }

  return comments;
}

function checkPerformance(change: CodeChange): ReviewComment[] {
  const comments: ReviewComment[] = [];
  const { file, diff } = change;

  // Nested loops
  if (diff.includes('for') && diff.match(/for.*\{[^}]*for/s)) {
    comments.push({
      id: generateId(),
      type: 'suggestion',
      severity: 'minor',
      file,
      message: 'Nested loops detected - consider algorithm optimization',
      explanation: 'Nested loops can lead to O(n²) or worse time complexity.',
    });
  }

  // N+1 query pattern
  if (diff.includes('forEach') && diff.includes('.find') || diff.includes('for') && diff.includes('.find')) {
    if (diff.includes('db.') || diff.includes('query') || diff.includes('fetch')) {
      comments.push({
        id: generateId(),
        type: 'suggestion',
        severity: 'major',
        file,
        message: 'Potential N+1 query pattern',
        explanation: 'Multiple database calls in a loop can cause performance issues.',
        suggestion: 'Consider batch queries or eager loading.',
      });
    }
  }

  return comments;
}

function checkBestPractices(change: CodeChange): ReviewComment[] {
  const comments: ReviewComment[] = [];
  const { file, diff } = change;

  // TODO comments
  const todoMatches = diff.match(/\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK/gi);
  if (todoMatches) {
    comments.push({
      id: generateId(),
      type: 'nitpick',
      severity: 'info',
      file,
      message: `Found ${todoMatches.length} TODO/FIXME comment(s)`,
      explanation: 'TODO comments should be tracked as issues for better visibility.',
    });
  }

  // Long lines
  const longLines = diff.split('\n').filter(line => line.length > 120);
  if (longLines.length > 0) {
    comments.push({
      id: generateId(),
      type: 'nitpick',
      severity: 'info',
      file,
      message: 'Lines exceeding 120 characters',
      explanation: 'Long lines reduce readability. Consider breaking them up.',
    });
  }

  // Magic numbers
  const magicNumbers = diff.match(/\b\d{3,}\b/g);
  if (magicNumbers) {
    comments.push({
      id: generateId(),
      type: 'suggestion',
      severity: 'minor',
      file,
      message: 'Magic numbers detected',
      explanation: 'Using named constants improves code readability and maintainability.',
    });
  }

  return comments;
}

function checkGeneralPatterns(change: CodeChange): ReviewComment[] {
  const comments: ReviewComment[] = [];
  const { file, diff, additions } = change;

  // Large PR suggestion
  if (additions > 500) {
    comments.push({
      id: generateId(),
      type: 'question',
      severity: 'info',
      file,
      message: 'This file has significant changes',
      explanation: 'Large changes are harder to review. Consider splitting into smaller, focused changes.',
    });
  }

  return comments;
}

/**
 * Generate review summary
 */
export function generateReviewSummary(comments: ReviewComment[]): ReviewSummary {
  const blockers = comments.filter(c => c.severity === 'blocker').length;
  const critical = comments.filter(c => c.severity === 'critical').length;
  const suggestions = comments.filter(c => c.type === 'suggestion').length;
  const praise = comments.filter(c => c.type === 'praise').length;

  // Estimate review time: 2 min per blocker/critical, 1 min per other
  const reviewTime = blockers * 2 + critical * 2 + (comments.length - blockers - critical) * 1;

  return {
    totalComments: comments.length,
    blockers,
    criticalIssues: critical,
    suggestions,
    praise,
    canMerge: blockers === 0 && critical === 0,
    reviewTime,
  };
}

/**
 * Calculate overall PR score (0-100)
 */
export function calculatePRScore(review: CodeReview): number {
  let score = 100;

  // Deduct for issues
  const blockers = review.summary.blockers;
  const critical = review.summary.criticalIssues;
  
  score -= blockers * 20;
  score -= critical * 10;

  // Cap at 0
  return Math.max(0, score);
}

function generateId(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
