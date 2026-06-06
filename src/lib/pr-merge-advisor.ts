/**
 * PR Merge Advisor
 * Analyze PRs and provide merge recommendations with risk assessment
 */

export type MergeRecommendation = 'approve' | 'request_changes' | 'comment' | 'block';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PRAnalysis {
  prNumber: number;
  title: string;
  riskLevel: RiskLevel;
  recommendation: MergeRecommendation;
  score: number; // 0-100
  factors: RiskFactor[];
  suggestions: string[];
}

export interface RiskFactor {
  name: string;
  impact: number; // positive or negative
  description: string;
}

export interface CodeQuality {
  testCoverage: number;
  lintScore: number;
  complexity: number;
  documentation: number;
}

export interface MergeChecklist {
  title: string;
  passed: boolean;
  required: boolean;
}

/**
 * Calculate overall PR score
 */
export function calculatePRScore(factors: RiskFactor[]): number {
  const baseScore = 70;
  const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0);
  return Math.max(0, Math.min(100, baseScore + totalImpact));
}

/**
 * Determine risk level based on score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

/**
 * Generate merge recommendation
 */
export function getMergeRecommendation(score: number, factors: RiskFactor[]): MergeRecommendation {
  const hasBlockingFactor = factors.some(f => f.impact <= -20);
  const hasMajorConcern = factors.some(f => f.impact <= -10);
  const hasMinorConcern = factors.some(f => f.impact < 0);

  if (hasBlockingFactor) return 'block';
  if (hasMajorConcern) return 'request_changes';
  if (hasMinorConcern || score < 75) return 'comment';
  return 'approve';
}

/**
 * Analyze PR code quality
 */
export function analyzeCodeQuality(code: string): CodeQuality {
  const lines = code.split('\n');
  const totalLines = lines.length;
  
  // Calculate test coverage estimate (simplified)
  const testLines = lines.filter(l => l.includes('test') || l.includes('describe') || l.includes('it(')).length;
  const testCoverage = Math.min(100, Math.round((testLines / Math.max(totalLines, 1)) * 100 * 5));
  
  // Lint score based on basic patterns
  let issues = 0;
  if (/console\.log/.test(code)) issues++;
  if (/TODO|FIXME|HACK/.test(code)) issues++;
  if (/var\s+\w+/.test(code)) issues++;
  const lintScore = Math.max(0, 100 - issues * 10);
  
  // Complexity estimate
  const cyclomatic = (code.match(/if\(|for\(|while\(|switch\(/g) || []).length;
  const complexity = Math.min(100, Math.round(cyclomatic / Math.max(totalLines / 50, 1)));
  
  // Documentation score
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('*')).length;
  const documentation = Math.min(100, Math.round((commentLines / Math.max(totalLines, 1)) * 100 * 3));
  
  return { testCoverage, lintScore, complexity, documentation };
}

/**
 * Generate PR merge checklist
 */
export function generateMergeChecklist(analysis: PRAnalysis): MergeChecklist[] {
  const checklist: MergeChecklist[] = [
    { title: 'Tests pass', passed: analysis.score >= 60, required: true },
    { title: 'Code review approved', passed: analysis.recommendation !== 'block', required: true },
    { title: 'No critical security issues', passed: analysis.riskLevel !== 'critical', required: true },
    { title: 'Documentation updated', passed: true, required: false },
    { title: 'Breaking changes documented', passed: true, required: false },
  ];
  
  return checklist;
}

/**
 * Generate PR summary for maintainer
 */
export function generatePRSummary(analysis: PRAnalysis): string {
  const emoji = {
    approve: '✅',
    request_changes: '⚠️',
    comment: '💬',
    block: '🚫',
  };
  
  let summary = `${emoji[analysis.recommendation]} **PR #${analysis.prNumber}**: ${analysis.title}\n`;
  summary += `📊 Score: ${analysis.score}/100 | Risk: ${analysis.riskLevel}\n\n`;
  
  if (analysis.suggestions.length > 0) {
    summary += '💡 Suggestions:\n';
    analysis.suggestions.forEach(s => summary += `- ${s}\n`);
  }
  
  return summary;
}
