import { Issue, PullRequest, Contributor, Repository } from './types';

export interface CoverageMetrics {
  files: FileCoverage[];
  totalLines: number;
  coveredLines: number;
  totalBranches: number;
  coveredBranches: number;
  totalFunctions: number;
  coveredFunctions: number;
  overallPercentage: number;
  branchPercentage: number;
  functionPercentage: number;
}

export interface FileCoverage {
  path: string;
  linesTotal: number;
  linesCovered: number;
  branchesTotal: number;
  branchesCovered: number;
  functionsTotal: number;
  functionsCovered: number;
  uncoveredLines: number[];
  uncoveredBranches: number[];
  percentage: number;
}

export interface CoverageTrend {
  date: string;
  percentage: number;
  delta: number;
}

export interface CoverageBadge {
  label: string;
  value: string;
  color: string;
  format: 'svg' | 'json';
}

export function analyzeCoverage(coverageData: any): CoverageMetrics {
  const files: FileCoverage[] = [];
  let totalLines = 0, coveredLines = 0;
  let totalBranches = 0, coveredBranches = 0;
  let totalFunctions = 0, coveredFunctions = 0;

  if (coverageData.files) {
    coverageData.files.forEach((file: any) => {
      const fileCoverage = calculateFileCoverage(file);
      files.push(fileCoverage);
      
      totalLines += fileCoverage.linesTotal;
      coveredLines += fileCoverage.linesCovered;
      totalBranches += fileCoverage.branchesTotal;
      coveredBranches += fileCoverage.branchesCovered;
      totalFunctions += fileCoverage.functionsTotal;
      coveredFunctions += fileCoverage.functionsCovered;
    });
  } else if (coverageData.lines) {
    const fileCoverage = calculateFileCoverage(coverageData);
    files.push(fileCoverage);
    totalLines = fileCoverage.linesTotal;
    coveredLines = fileCoverage.linesCovered;
    totalBranches = fileCoverage.branchesTotal;
    coveredBranches = fileCoverage.branchesCovered;
    totalFunctions = fileCoverage.functionsTotal;
    coveredFunctions = fileCoverage.functionsCovered;
  }

  return {
    files,
    totalLines,
    coveredLines,
    totalBranches,
    coveredBranches,
    totalFunctions,
    coveredFunctions,
    overallPercentage: totalLines > 0 ? Math.round((coveredLines / totalLines) * 10000) / 100 : 0,
    branchPercentage: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 10000) / 100 : 0,
    functionPercentage: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 10000) / 100 : 0
  };
}

function calculateFileCoverage(file: any): FileCoverage {
  const linesTotal = file.lines?.length || 0;
  const linesCovered = file.lines?.filter((l: any) => l.hits > 0).length || 0;
  const uncoveredLines = file.lines?.filter((l: any) => l.hits === 0).map((l: any) => l.line) || [];
  
  const branchesTotal = file.branches?.length || 0;
  const branchesCovered = file.branches?.filter((b: any) => b.hits > 0).length || 0;
  const uncoveredBranches = file.branches?.filter((b: any) => b.hits === 0).map((b: any) => b.line) || [];
  
  const functionsTotal = file.functions?.length || 0;
  const functionsCovered = file.functions?.filter((f: any) => f.hits > 0).length || 0;

  const percentage = linesTotal > 0 ? Math.round((linesCovered / linesTotal) * 10000) / 100 : 0;

  return {
    path: file.path || file.name || 'unknown',
    linesTotal,
    linesCovered,
    branchesTotal,
    branchesCovered,
    functionsTotal,
    functionsCovered,
    uncoveredLines,
    uncoveredBranches,
    percentage
  };
}

export function identifyCoverageGaps(metrics: CoverageMetrics, threshold: number = 80): {
  lowCoverageFiles: FileCoverage[];
  criticalGaps: { path: string; lines: number[] }[];
} {
  const lowCoverageFiles = metrics.files
    .filter(f => f.percentage < threshold)
    .sort((a, b) => a.percentage - b.percentage);

  const criticalGaps = lowCoverageFiles
    .filter(f => f.percentage < threshold / 2)
    .map(f => ({
      path: f.path,
      lines: f.uncoveredLines.slice(0, 10)
    }));

  return { lowCoverageFiles, criticalGaps };
}

export function generateCoverageTrend(history: { date: string; percentage: number }[]): CoverageTrend[] {
  return history.map((item, index) => ({
    date: item.date,
    percentage: item.percentage,
    delta: index > 0 ? item.percentage - history[index - 1].percentage : 0
  }));
}

export function createCoverageBadge(percentage: number, format: 'svg' | 'json' = 'svg'): CoverageBadge {
  const color = percentage >= 90 ? 'brightgreen' 
    : percentage >= 80 ? 'green' 
    : percentage >= 70 ? 'yellow' 
    : percentage >= 60 ? 'orange' 
    : 'red';

  const label = 'coverage';
  const value = `${percentage}%`;

  if (format === 'json') {
    return { label, value, color, format };
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${90 + value.length * 6}" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="100%" height="100%" rx="3"/>
  </clipPath>
  <rect width="54" height="20" fill="#555"/>
  <rect x="54" width="${(percentage / 100) * (90 + value.length * 6 - 54)}" height="20" fill="${getColorHex(color)}"/>
  <rect width="100%" height="100%" fill="url(#s)"/>
  <text x="29" y="14" fill="#010101" fill-opacity=".3" font-size="11" font-family="sans-serif" font-weight="bold">${label}</text>
  <text x="29" y="13" fill="#fff" font-size="11" font-family="sans-serif" font-weight="bold">${label}</text>
  <text x="${60 + (percentage / 100) * (90 + value.length * 6 - 54) / 2}" y="14" fill="#010101" fill-opacity=".3" font-size="11" font-family="sans-serif" font-weight="bold">${value}</text>
  <text x="${59 + (percentage / 100) * (90 + value.length * 6 - 54) / 2}" y="13" fill="#fff" font-size="11" font-family="sans-serif" font-weight="bold">${value}</text>
</svg>`;

  return { label, value, color, format: 'svg' } as any;
}

function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    brightgreen: '#4c1',
    green: '#97ca00',
    yellow: '#dfb317',
    orange: '#fe7d37',
    red: '#e05d44'
  };
  return colors[color] || '#9f9f9f';
}

export function calculateCoverageTarget(
  currentCoverage: number,
  targetCoverage: number,
  sprintDays: number
): { dailyIncrease: number; estimatedCompletion: string } {
  const remaining = targetCoverage - currentCoverage;
  const dailyIncrease = remaining / sprintDays;
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + sprintDays);

  return {
    dailyIncrease: Math.round(dailyIncrease * 100) / 100,
    estimatedCompletion: completionDate.toISOString().split('T')[0]
  };
}

export function generateCoverageReport(metrics: CoverageMetrics): string {
  const { lowCoverageFiles, criticalGaps } = identifyCoverageGaps(metrics);
  
  const status = metrics.overallPercentage >= 90 ? 'excellent'
    : metrics.overallPercentage >= 80 ? 'good'
    : metrics.overallPercentage >= 70 ? 'needs improvement'
    : 'critical';

  return `
# Test Coverage Report

## Summary
- **Overall Coverage**: ${metrics.overallPercentage}%
- **Branch Coverage**: ${metrics.branchPercentage}%
- **Function Coverage**: ${metrics.functionPercentage}%
- **Status**: ${status.toUpperCase()}

## Metrics
| Type | Covered | Total | Percentage |
|------|---------|-------|------------|
| Lines | ${metrics.coveredLines} | ${metrics.totalLines} | ${metrics.overallPercentage}% |
| Branches | ${metrics.coveredBranches} | ${metrics.totalBranches} | ${metrics.branchPercentage}% |
| Functions | ${metrics.coveredFunctions} | ${metrics.totalFunctions} | ${metrics.functionPercentage}% |

## Files Needing Attention
${lowCoverageFiles.length > 0 ? lowCoverageFiles.slice(0, 10).map(f => 
  `- ${f.path}: ${f.percentage}%`
).join('\n') : 'All files above threshold'}

${criticalGaps.length > 0 ? `
## Critical Gaps
${criticalGaps.map(g => `
### ${g.path}
Uncovered lines: ${g.lines.join(', ')}
`).join('\n')}` : ''}
`.trim();
}

export function suggestCoverageImprovements(metrics: CoverageMetrics): string[] {
  const suggestions: string[] = [];

  if (metrics.overallPercentage < 80) {
    suggestions.push('Focus on increasing overall line coverage first');
  }

  if (metrics.branchPercentage < metrics.functionPercentage) {
    suggestions.push('Add tests for edge cases to improve branch coverage');
  }

  const untestedFiles = metrics.files.filter(f => f.percentage < 50);
  if (untestedFiles.length > 0) {
    suggestions.push(`Priority: Add tests for ${untestedFiles.length} files below 50% coverage`);
  }

  const largeFiles = metrics.files
    .filter(f => f.linesTotal > 100 && f.percentage < 70)
    .sort((a, b) => b.linesTotal - a.linesTotal);

  if (largeFiles.length > 0) {
    suggestions.push(`High impact: ${largeFiles[0].path} (${largeFiles[0].linesTotal} lines, ${largeFiles[0].percentage}% coverage)`);
  }

  return suggestions;
}
