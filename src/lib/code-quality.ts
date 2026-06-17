/**
 * Code Quality Analyzer - Automated code quality checks and improvements
 */

export type QualityLevel = "excellent" | "good" | "needs-improvement" | "poor";

export interface QualityMetric {
  name: string;
  score: number; // 0-100
  level: QualityLevel;
  details: string;
  suggestions: string[];
}

export interface CodeQualityReport {
  overallScore: number;
  overallLevel: QualityLevel;
  metrics: QualityMetric[];
  summary: string;
  recommendations: QualityRecommendation[];
}

export interface QualityRecommendation {
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
  impact: "high" | "medium" | "low";
}

export interface LintResult {
  file: string;
  line?: number;
  column?: number;
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  fix?: string;
}

export interface CodeComplexity {
  file: string;
  function: string;
  cyclomatic: number;
  cognitive: number;
  lines: number;
  maintainability: number;
}

/**
 * Calculate code quality score
 */
export function calculateQualityScore(metrics: QualityMetric[]): { score: number; level: QualityLevel } {
  if (metrics.length === 0) {
    return { score: 0, level: "poor" };
  }
  
  const totalScore = metrics.reduce((sum, m) => sum + m.score, 0);
  const avgScore = totalScore / metrics.length;
  
  let level: QualityLevel;
  if (avgScore >= 90) level = "excellent";
  else if (avgScore >= 70) level = "good";
  else if (avgScore >= 50) level = "needs-improvement";
  else level = "poor";
  
  return { score: Math.round(avgScore), level };
}

/**
 * Analyze code complexity
 */
export function analyzeComplexity(
  cyclomatic: number,
  lines: number,
  params: number
): QualityMetric {
  let score = 100;
  const suggestions: string[] = [];
  
  // Cyclomatic complexity scoring
  if (cyclomatic > 20) {
    score -= 40;
    suggestions.push("Reduce cyclomatic complexity (currently " + cyclomatic + ")");
  } else if (cyclomatic > 10) {
    score -= 20;
    suggestions.push("Consider extracting some logic into helper functions");
  } else if (cyclomatic > 5) {
    score -= 5;
  }
  
  // Line count scoring
  if (lines > 200) {
    score -= 20;
    suggestions.push("Function is too long (" + lines + " lines). Consider splitting.");
  } else if (lines > 100) {
    score -= 10;
    suggestions.push("Function could benefit from being broken down");
  }
  
  // Parameter count scoring
  if (params > 5) {
    score -= 15;
    suggestions.push("Too many parameters (" + params + "). Consider using an options object.");
  } else if (params > 3) {
    score -= 5;
  }
  
  const level: QualityLevel = score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "needs-improvement" : "poor";
  
  return {
    name: "Complexity",
    score: Math.max(0, score),
    level,
    details: `Cyclomatic: ${cyclomatic}, Lines: ${lines}, Params: ${params}`,
    suggestions,
  };
}

/**
 * Analyze test coverage
 */
export function analyzeTestCoverage(
  linesCovered: number,
  totalLines: number,
  branchesCovered: number,
  totalBranches: number
): QualityMetric {
  const lineCoverage = totalLines > 0 ? (linesCovered / totalLines) * 100 : 0;
  const branchCoverage = totalBranches > 0 ? (branchesCovered / totalBranches) * 100 : 0;
  
  const score = (lineCoverage * 0.6 + branchCoverage * 0.4);
  const suggestions: string[] = [];
  
  if (lineCoverage < 50) {
    suggestions.push("Critical: Test coverage is below 50%. Prioritize adding tests.");
  } else if (lineCoverage < 80) {
    suggestions.push("Test coverage could be improved. Target 80% minimum.");
  }
  
  if (branchCoverage < lineCoverage - 10) {
    suggestions.push("Some branches are not being tested. Check conditional paths.");
  }
  
  const level: QualityLevel = score >= 90 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "needs-improvement" : "poor";
  
  return {
    name: "Test Coverage",
    score: Math.round(score),
    level,
    details: `Lines: ${lineCoverage.toFixed(1)}%, Branches: ${branchCoverage.toFixed(1)}%`,
    suggestions,
  };
}

/**
 * Analyze code duplication
 */
export function analyzeDuplication(
  duplicateLines: number,
  totalLines: number,
  duplicateBlocks: number
): QualityMetric {
  const duplicationRatio = totalLines > 0 ? (duplicateLines / totalLines) * 100 : 0;
  
  let score = 100 - duplicationRatio * 2;
  const suggestions: string[] = [];
  
  if (duplicationRatio > 15) {
    suggestions.push("High duplication detected. Consider extracting common logic.");
  } else if (duplicationRatio > 5) {
    suggestions.push("Some duplicate code found. Review for potential refactoring.");
  }
  
  if (duplicateBlocks > 5) {
    suggestions.push(`${duplicateBlocks} duplicate code blocks found`);
  }
  
  const level: QualityLevel = score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "needs-improvement" : "poor";
  
  return {
    name: "Duplication",
    score: Math.max(0, Math.round(score)),
    level,
    details: `${duplicationRatio.toFixed(1)}% duplicated (${duplicateBlocks} blocks)`,
    suggestions,
  };
}

/**
 * Analyze naming conventions
 */
export function analyzeNaming(text: string, patterns: Record<string, RegExp>): QualityMetric {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  let issues = 0;
  const suggestions: string[] = [];
  
  for (const line of lines) {
    for (const [patternName, regex] of Object.entries(patterns)) {
      if (!regex.test(line)) {
        issues++;
      }
    }
  }
  
  const score = Math.max(0, 100 - issues * 5);
  
  if (issues > 10) {
    suggestions.push("Multiple naming convention violations found");
  }
  
  const level: QualityLevel = score >= 90 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "needs-improvement" : "poor";
  
  return {
    name: "Naming Conventions",
    score,
    level,
    details: `${issues} naming issues found`,
    suggestions,
  };
}

/**
 * Generate comprehensive code quality report
 */
export function generateQualityReport(
  metrics: QualityMetric[]
): CodeQualityReport {
  const { score, level } = calculateQualityScore(metrics);
  
  const recommendations: QualityRecommendation[] = [];
  
  for (const metric of metrics) {
    if (metric.level === "needs-improvement" || metric.level === "poor") {
      for (const suggestion of metric.suggestions) {
        recommendations.push({
          priority: metric.level === "poor" ? "high" : "medium",
          category: metric.name,
          title: `Improve ${metric.name}`,
          description: suggestion,
          effort: "medium",
          impact: "medium",
        });
      }
    }
  }
  
  // Sort by priority
  recommendations.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
  
  const summaryParts: string[] = [];
  summaryParts.push(`Overall Score: ${score}/100 (${level})`);
  summaryParts.push(`${metrics.filter(m => m.level === "excellent").length} excellent, ${metrics.filter(m => m.level === "good").length} good, ${metrics.filter(m => m.level === "needs-improvement").length} needs improvement, ${metrics.filter(m => m.level === "poor").length} poor metrics`);
  
  return {
    overallScore: score,
    overallLevel: level,
    metrics,
    summary: summaryParts.join(" | "),
    recommendations,
  };
}

/**
 * Parse lint results into structured format
 */
export function parseLintResults(rawOutput: string): LintResult[] {
  // Simple parser for common lint output formats
  const results: LintResult[] = [];
  const lines = rawOutput.split("\n");
  
  for (const line of lines) {
    // Match common format: file:line:column: severity: message
    const match = line.match(/^(.+?):(\d+):(\d+):\s*(\w+):\s*(.+)$/);
    if (match) {
      results.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        severity: match[4].toLowerCase() as "error" | "warning" | "info",
        message: match[5],
        rule: "unknown",
      });
    }
  }
  
  return results;
}

/**
 * Calculate maintainability index
 */
export function calculateMaintainabilityIndex(
  halsteadVolume: number,
  cyclomatic: number,
  linesOfCode: number
): number {
  // MI = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC)
  // where V = volume, G = cyclomatic complexity, LOC = lines of code
  
  if (linesOfCode <= 0 || halsteadVolume <= 0) return 100;
  
  const mi = 171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomatic - 16.2 * Math.log(linesOfCode);
  
  return Math.max(0, Math.min(100, mi));
}

/**
 * Generate code quality dashboard data
 */
export function buildQualityDashboard(report: CodeQualityReport) {
  const metricBreakdown = report.metrics.map(m => ({
    name: m.name,
    score: m.score,
    level: m.level,
  }));
  
  const topIssues = report.recommendations
    .filter(r => r.priority === "critical" || r.priority === "high")
    .slice(0, 5);
  
  const trend = report.overallScore >= 80 ? "improving" : report.overallScore >= 60 ? "stable" : "needs-attention";
  
  return {
    overallScore: report.overallScore,
    overallLevel: report.overallLevel,
    metricBreakdown,
    topIssues,
    trend,
    summary: report.summary,
  };
}
