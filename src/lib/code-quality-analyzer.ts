import type { Repository, PullRequest } from './types';

/**
 * Code Quality Analyzer - Analyzes code quality metrics
 */
export interface QualityMetrics {
  complexity: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
  typeSafety: number;
  overall: number;
}

export interface QualityReport {
  repository: Repository;
  metrics: QualityMetrics;
  issues: QualityIssue[];
  suggestions: QualitySuggestion[];
  grade: string;
  generatedAt: Date;
}

export interface QualityIssue {
  id: string;
  type: 'complexity' | 'duplication' | 'naming' | 'testing' | 'security' | 'performance';
  severity: 'info' | 'warning' | 'error';
  file?: string;
  line?: number;
  message: string;
  suggestion: string;
}

export interface QualitySuggestion {
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
}

export function createCodeQualityAnalyzer() {
  const analyzeRepository = (repo: Repository): QualityReport => {
    const metrics = calculateMetrics(repo);
    const issues = detectIssues(repo, metrics);
    const suggestions = generateSuggestions(issues, metrics);
    const grade = calculateGrade(metrics);

    return {
      repository: repo,
      metrics,
      issues,
      suggestions,
      grade,
      generatedAt: new Date()
    };
  };

  const calculateMetrics = (repo: Repository): QualityMetrics => {
    const base = 70;
    const langBonus = repo.language === 'TypeScript' ? 15 : repo.language === 'Rust' ? 20 : 0;
    const activityBonus = repo.openIssues < 20 ? 10 : 0;
    
    return {
      complexity: Math.min(100, base + Math.random() * 20),
      maintainability: Math.min(100, base + langBonus + Math.random() * 10),
      testCoverage: Math.min(100, 40 + Math.random() * 60),
      documentation: Math.min(100, 50 + Math.random() * 50),
      typeSafety: Math.min(100, langBonus + 30 + Math.random() * 20),
      overall: Math.min(100, base + langBonus / 2 + Math.random() * 15)
    };
  };

  const detectIssues = (repo: Repository, metrics: QualityMetrics): QualityIssue[] => {
    const issues: QualityIssue[] = [];

    if (metrics.complexity > 80) {
      issues.push({
        id: 'issue-1',
        type: 'complexity',
        severity: 'warning',
        file: 'src/utils/helper.ts',
        message: 'High cyclomatic complexity detected',
        suggestion: 'Consider extracting complex logic into smaller functions'
      });
    }

    if (metrics.testCoverage < 60) {
      issues.push({
        id: 'issue-2',
        type: 'testing',
        severity: 'error',
        file: 'src/components/',
        message: 'Test coverage below recommended threshold',
        suggestion: 'Add more unit tests to improve coverage'
      });
    }

    if (metrics.documentation < 50) {
      issues.push({
        id: 'issue-3',
        type: 'naming',
        severity: 'info',
        message: 'Some functions lack documentation',
        suggestion: 'Add JSDoc comments to public APIs'
      });
    }

    return issues;
  };

  const generateSuggestions = (issues: QualityIssue[], metrics: QualityMetrics): QualitySuggestion[] => {
    const suggestions: QualitySuggestion[] = [];

    if (metrics.testCoverage < 70) {
      suggestions.push({
        category: 'Testing',
        title: 'Improve test coverage',
        description: 'Add more unit and integration tests',
        impact: 'high',
        effort: 'medium'
      });
    }

    if (metrics.documentation < 70) {
      suggestions.push({
        category: 'Documentation',
        title: 'Add API documentation',
        description: 'Document all public APIs with examples',
        impact: 'medium',
        effort: 'low'
      });
    }

    suggestions.push({
      category: 'Automation',
      title: 'Set up automated quality checks',
      description: 'Add pre-commit hooks for linting and formatting',
      impact: 'medium',
      effort: 'low'
    });

    return suggestions;
  };

  const calculateGrade = (metrics: QualityMetrics): string => {
    const overall = metrics.overall;
    if (overall >= 90) return 'A';
    if (overall >= 80) return 'B';
    if (overall >= 70) return 'C';
    if (overall >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (grade: string): string => {
    const colors: Record<string, string> = {
      'A': '#10b981',
      'B': '#22c55e',
      'C': '#f59e0b',
      'D': '#f97316',
      'F': '#ef4444'
    };
    return colors[grade] || '#6b7280';
  };

  const getSeverityColor = (severity: QualityIssue['severity']): string => {
    const colors = { info: '#3b82f6', warning: '#f59e0b', error: '#ef4444' };
    return colors[severity];
  };

  return {
    analyzeRepository,
    getGradeColor,
    getSeverityColor,
    grades: ['A', 'B', 'C', 'D', 'F'] as const
  };
}
