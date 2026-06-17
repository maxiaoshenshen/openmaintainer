/**
 * AI Reviewer - AI-powered code review and suggestions
 */

import type { PullRequest, Repository } from './types';

export interface ReviewComment {
  file?: string;
  line?: number;
  type: 'suggestion' | 'issue' | 'praise' | 'question';
  severity?: 'critical' | 'warning' | 'info';
  title: string;
  body: string;
  suggestion?: string;
  reasoning?: string;
}

export interface AIReview {
  summary: string;
  score: number;
  comments: ReviewComment[];
  approvals: string[];
  changeRequests: string[];
  nitpicks: string[];
  strengths: string[];
  canAutoMerge: boolean;
}

export interface ReviewConfig {
  enableSuggestions: boolean;
  enableSecurityScan: boolean;
  enablePerformanceCheck: boolean;
  enableStyleGuide: boolean;
  minConfidenceScore: number;
  maxComments: number;
}

const DEFAULT_CONFIG: ReviewConfig = {
  enableSuggestions: true,
  enableSecurityScan: true,
  enablePerformanceCheck: true,
  enableStyleGuide: true,
  minConfidenceScore: 0.7,
  maxComments: 50,
};

export function createAIReviewer(config: Partial<ReviewConfig> = {}): AIReviewer {
  return new AIReviewer({ ...DEFAULT_CONFIG, ...config });
}

class AIReviewer {
  private config: ReviewConfig;

  constructor(config: ReviewConfig) {
    this.config = config;
  }

  reviewPullRequest(pr: PullRequest, repo: Repository): AIReview {
    const comments: ReviewComment[] = [];

    if (this.config.enableSecurityScan) {
      comments.push(...this.scanForSecurityIssues(pr));
    }

    if (this.config.enablePerformanceCheck) {
      comments.push(...this.checkPerformance(pr));
    }

    if (this.config.enableStyleGuide) {
      comments.push(...this.checkStyleGuide(pr));
    }

    if (this.config.enableSuggestions) {
      comments.push(...this.generateSuggestions(pr, repo));
    }

    const limitedComments = comments.slice(0, this.config.maxComments);

    return this.formatReview(limitedComments, pr, repo);
  }

  private scanForSecurityIssues(pr: PullRequest): ReviewComment[] {
    const comments: ReviewComment[] = [];

    const diff = (pr as any).additionsList || [];
    
    for (const line of diff) {
      if (/eval\s*\(/.test(line)) {
        comments.push({
          file: (pr as any).files?.[0],
          type: 'issue',
          severity: 'critical',
          title: 'Security: Avoid using eval()',
          body: 'eval() can execute arbitrary code and poses a significant security risk.',
          suggestion: 'Consider using safer alternatives like JSON.parse() for data parsing.',
        });
      }

      if (/innerHTML\s*=/.test(line)) {
        comments.push({
          file: (pr as any).files?.[0],
          type: 'issue',
          severity: 'warning',
          title: 'Security: Potential XSS vulnerability',
          body: 'Direct innerHTML assignment can lead to cross-site scripting (XSS) attacks.',
          suggestion: 'Use textContent or sanitize input with DOMPurify.',
        });
      }

      if (/password\s*[=:]\s*['"][^'"]+['"]/i.test(line)) {
        comments.push({
          file: (pr as any).files?.[0],
          type: 'issue',
          severity: 'critical',
          title: 'Security: Hardcoded credentials detected',
          body: 'Credentials should not be hardcoded in source code.',
          suggestion: 'Use environment variables: process.env.PASSWORD',
        });
      }
    }

    return comments;
  }

  private checkPerformance(pr: PullRequest): ReviewComment[] {
    const comments: ReviewComment[] = [];

    const lines = (pr as any).additionsList || [];
    const fileCount = (pr as any).files?.length || 0;

    if (lines.some(l => l.includes('for (') && l.includes('async'))) {
      comments.push({
        type: 'suggestion',
        severity: 'info',
        title: 'Performance: Nested async in loop',
        body: 'Consider using Promise.all() for parallel async operations instead of awaiting in a loop.',
        suggestion: 'const results = await Promise.all(items.map(item => processAsync(item)));',
      });
    }

    if (fileCount > 10 && (pr.additions || 0) > 500) {
      comments.push({
        type: 'suggestion',
        severity: 'info',
        title: 'Performance: Large PR detected',
        body: 'This PR makes many changes. Consider breaking it into smaller, focused PRs.',
      });
    }

    return comments;
  }

  private checkStyleGuide(pr: PullRequest): ReviewComment[] {
    const comments: ReviewComment[] = [];
    const lines = (pr as any).additionsList || [];

    if (lines.some(l => l.includes('console.log'))) {
      comments.push({
        type: 'nitpick',
        title: 'Style: Remove debug statements',
        body: 'console.log statements should be removed before merging.',
      });
    }

    if (lines.some(l => /\/\/[^\s].*[a-z]/.test(l) && !l.includes('TODO') && !l.includes('FIXME'))) {
      comments.push({
        type: 'question',
        title: 'Style: Inconsistent comments',
        body: 'Consider using consistent comment formatting.',
      });
    }

    return comments;
  }

  private generateSuggestions(pr: PullRequest, repo: Repository): ReviewComment[] {
    const suggestions: ReviewComment[] = [];

    if (pr.additions && pr.additions > 100) {
      suggestions.push({
        type: 'suggestion',
        title: 'Consider adding tests',
        body: 'This PR adds significant new code. Consider adding or updating tests.',
      });
    }

    if (repo.communityHealth?.hasDiscussions && !(pr.comments && pr.comments > 0)) {
      suggestions.push({
        type: 'question',
        title: 'Documentation: Update docs',
        body: 'Consider updating documentation to reflect these changes.',
      });
    }

    return suggestions;
  }

  private formatReview(
    comments: ReviewComment[],
    pr: PullRequest,
    repo: Repository
  ): AIReview {
    const critical = comments.filter(c => c.severity === 'critical');
    const warnings = comments.filter(c => c.severity === 'warning');

    const score = Math.max(
      0,
      100 - critical.length * 20 - warnings.length * 5 - (comments.length > 10 ? 5 : 0)
    );

    const approvals = [];
    const changeRequests = [];

    if (critical.length === 0 && score >= 80) {
      approvals.push('Code quality looks good');
    }

    if (critical.length > 0) {
      changeRequests.push(`Address ${critical.length} critical issue(s) before merging`);
    }

    return {
      summary: this.generateSummary(comments, score),
      score,
      comments,
      approvals,
      changeRequests,
      nitpicks: comments.filter(c => c.type === 'nitpick').map(c => c.title),
      strengths: this.identifyStrengths(pr),
      canAutoMerge: score >= 90 && critical.length === 0,
    };
  }

  private generateSummary(comments: ReviewComment[], score: number): string {
    const critical = comments.filter(c => c.severity === 'critical');
    const warnings = comments.filter(c => c.severity === 'warning');
    const suggestions = comments.filter(c => c.type === 'suggestion');

    let summary = `**Overall Score: ${score}/100**\n\n`;

    if (critical.length > 0) {
      summary += `⚠️ **${critical.length} critical issue(s)** must be addressed.\n`;
    }

    if (warnings.length > 0) {
      summary += `⚡ **${warnings.length} warning(s)** to consider.\n`;
    }

    if (suggestions.length > 0) {
      summary += `💡 **${suggestions.length} suggestion(s)** for improvement.\n`;
    }

    if (comments.length === 0) {
      summary += '✅ No issues detected. This PR looks great!';
    }

    return summary;
  }

  private identifyStrengths(pr: PullRequest): string[] {
    const strengths: string[] = [];

    if (pr.additions && pr.additions > 50 && pr.deletions && pr.deletions > 10) {
      strengths.push('Balanced changes (additions and deletions)');
    }

    if (pr.labels?.some(l => l.toLowerCase().includes('test'))) {
      strengths.push('Includes tests');
    }

    if (pr.labels?.some(l => l.toLowerCase().includes('documentation'))) {
      strengths.push('Documentation updated');
    }

    return strengths;
  }
}

export function generateReviewTemplate(review: AIReview): string {
  let template = `# AI Code Review\n\n`;
  template += `## Summary\n${review.summary}\n\n`;

  if (review.strengths.length > 0) {
    template += `## ✅ Strengths\n`;
    review.strengths.forEach(s => (template += `- ${s}\n`));
    template += '\n';
  }

  if (review.comments.length > 0) {
    template += `## Comments\n`;
    review.comments.forEach((c, i) => {
      template += `### ${i + 1}. ${c.title}\n`;
      template += `**Type:** ${c.type}`;
      if (c.severity) template += ` | **Severity:** ${c.severity}`;
      template += `\n\n${c.body}\n`;
      if (c.suggestion) {
        template += `\n**Suggestion:**\n\`\`\`\n${c.suggestion}\n\`\`\`\n`;
      }
      template += '\n';
    });
  }

  if (review.approvals.length > 0) {
    template += `## Approvals\n`;
    review.approvals.forEach(a => (template += `- ${a}\n`));
    template += '\n';
  }

  if (review.changeRequests.length > 0) {
    template += `## ⚠️ Changes Requested\n`;
    review.changeRequests.forEach(r => (template += `- ${r}\n`));
    template += '\n';
  }

  template += `---\n*Review generated by AI*`;

  return template;
}
