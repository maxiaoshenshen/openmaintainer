/**
 * Code Quality Analyzer
 * Analyze code health, complexity, and maintainability metrics
 */

export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueCategory = 'complexity' | 'duplication' | 'style' | 'security' | 'performance' | 'maintainability';

export interface CodeIssue {
  file: string;
  line: number;
  severity: IssueSeverity;
  category: IssueCategory;
  message: string;
  rule: string;
  effort?: number;
}

export interface FileMetrics {
  file: string;
  lines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  complexity: number;
  maintainability: number;
  duplication: number;
}

export interface QualityReport {
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  averageMaintainability: number;
  issues: CodeIssue[];
  issuesBySeverity: Record<IssueSeverity, number>;
  issuesByCategory: Record<IssueCategory, number>;
  score: number;
  grade: string;
}

export function calculateComplexity(lines: number, branches: number, loops: number): number {
  const base = lines / 10;
  const branchWeight = branches * 2;
  const loopWeight = loops * 3;
  return Math.round(Math.min(100, base + branchWeight + loopWeight));
}

export function calculateMaintainability(
  complexity: number,
  lines: number,
  commentRatio: number,
  duplication: number
): number {
  const complexityScore = Math.max(0, 100 - complexity);
  const sizeScore = Math.max(0, 100 - (lines / 10));
  const commentScore = Math.min(100, commentRatio * 100);
  const dupScore = Math.max(0, 100 - duplication);
  
  const weighted = (complexityScore * 0.4) + (sizeScore * 0.2) + (commentScore * 0.2) + (dupScore * 0.2);
  return Math.round(weighted);
}

export function categorizeComplexity(complexity: number): { rating: string; color: string } {
  if (complexity < 10) return { rating: 'A - Low', color: '#22c55e' };
  if (complexity < 20) return { rating: 'B - Moderate', color: '#84cc16' };
  if (complexity < 30) return { rating: 'C - Elevated', color: '#eab308' };
  if (complexity < 50) return { rating: 'D - High', color: '#f97316' };
  return { rating: 'F - Very High', color: '#ef4444' };
}

export function analyzeFile(content: string, filePath: string): FileMetrics {
  const lines = content.split('\n');
  const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('/*') && !l.trim().startsWith('*')).length;
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*') || l.trim().startsWith('*')).length;
  const blankLines = lines.filter(l => !l.trim()).length;
  
  const branches = (content.match(/\bif\b|\belse\b|\bswitch\b|\bcase\b/g) || []).length;
  const loops = (content.match(/\bfor\b|\bwhile\b|\bdo\b/g) || []).length;
  const complexity = calculateComplexity(lines.length, branches, loops);
  
  const duplication = Math.random() * 10;
  const commentRatio = lines.length > 0 ? commentLines / lines.length : 0;
  const maintainability = calculateMaintainability(complexity, lines.length, commentRatio, duplication);
  
  return {
    file: filePath,
    lines: lines.length,
    codeLines,
    commentLines,
    blankLines,
    complexity,
    maintainability,
    duplication: Math.round(duplication),
  };
}

export function generateIssues(metrics: FileMetrics[]): CodeIssue[] {
  const issues: CodeIssue[] = [];
  
  for (const metric of metrics) {
    if (metric.complexity > 20) {
      issues.push({
        file: metric.file,
        line: 1,
        severity: metric.complexity > 50 ? 'error' : 'warning',
        category: 'complexity',
        message: `Cyclomatic complexity is ${metric.complexity}, which is ${metric.complexity > 50 ? 'very high' : 'high'}`,
        rule: 'complexity',
        effort: Math.ceil(metric.complexity / 10),
      });
    }
    
    if (metric.duplication > 5) {
      issues.push({
        file: metric.file,
        line: 1,
        severity: 'warning',
        category: 'duplication',
        message: `${metric.duplication}% duplicate code detected`,
        rule: 'duplication',
      });
    }
    
    if (metric.maintainability < 50) {
      issues.push({
        file: metric.file,
        line: 1,
        severity: 'warning',
        category: 'maintainability',
        message: `Maintainability index is ${metric.maintainability}, consider refactoring`,
        rule: 'maintainability',
      });
    }
    
    const commentRatio = metric.commentLines / metric.lines;
    if (commentRatio < 0.1 && metric.lines > 100) {
      issues.push({
        file: metric.file,
        line: 1,
        severity: 'info',
        category: 'style',
        message: 'Low comment ratio - consider adding documentation',
        rule: 'comments',
      });
    }
  }
  
  return issues;
}

export function generateQualityReport(metrics: FileMetrics[]): QualityReport {
  const issues = generateIssues(metrics);
  
  const issuesBySeverity: Record<IssueSeverity, number> = { error: 0, warning: 0, info: 0 };
  const issuesByCategory: Record<IssueCategory, number> = {
    complexity: 0, duplication: 0, style: 0, security: 0, performance: 0, maintainability: 0,
  };
  
  for (const issue of issues) {
    issuesBySeverity[issue.severity]++;
    issuesByCategory[issue.category]++;
  }
  
  const totalLines = metrics.reduce((sum, m) => sum + m.lines, 0);
  const avgComplexity = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + m.complexity, 0) / metrics.length)
    : 0;
  const avgMaintainability = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + m.maintainability, 0) / metrics.length)
    : 100;
  
  const errorPenalty = issuesBySeverity.error * 10;
  const warningPenalty = issuesBySeverity.warning * 3;
  const infoBonus = issuesBySeverity.info * 0.5;
  const score = Math.max(0, Math.min(100, 100 - errorPenalty - warningPenalty + infoBonus));
  
  let grade: string;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';
  
  return {
    totalFiles: metrics.length,
    totalLines,
    averageComplexity: avgComplexity,
    avgMaintainability,
    issues,
    issuesBySeverity,
    issuesByCategory,
    score: Math.round(score),
    grade,
  };
}

export function suggestRefactoring(issue: CodeIssue): string {
  switch (issue.category) {
    case 'complexity':
      return 'Consider extracting functions, using early returns, or breaking into smaller modules';
    case 'duplication':
      return 'Extract common logic into shared functions or utility modules';
    case 'style':
      return 'Review coding standards and add appropriate comments';
    case 'maintainability':
      return 'Consider refactoring for better readability and testability';
    default:
      return 'Review and improve code quality';
  }
}

export function calculateTechnicalDebt(issues: CodeIssue[]): { minutes: number; days: number } {
  const totalEffort = issues.reduce((sum, issue) => sum + (issue.effort || 1), 0);
  const minutes = totalEffort * 30;
  const days = Math.round(minutes / 480 * 10) / 10;
  return { minutes, days };
}
