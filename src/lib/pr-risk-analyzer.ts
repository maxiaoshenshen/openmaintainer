/**
 * PR Risk Analyzer
 * Analyzes pull requests for potential risks before merging
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  name: string;
  score: number;
  description: string;
  suggestion?: string;
}

export interface PRRiskAnalysis {
  overallRisk: RiskLevel;
  riskScore: number; // 0-100
  factors: RiskFactor[];
  canAutoMerge: boolean;
  blockers: string[];
  recommendations: string[];
  estimatedReviewTime: string;
}

/**
 * Analyzes a PR for various risk factors
 */
export function analyzePRRisk(params: {
  additions: number;
  deletions: number;
  filesChanged: number;
  hasTests: boolean;
  hasBreakingChanges: boolean;
  isDependencyUpdate: boolean;
  hasDocumentation: boolean;
  commentDensity: number; // comments per 100 lines
  reviewCount: number;
  age: number; // days since created
  isDraft: boolean;
}): PRRiskAnalysis {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // Size risk
  const sizeScore = calculateSizeRisk(params.additions, params.deletions, params.filesChanged);
  factors.push(sizeScore);
  totalScore += sizeScore.score;

  // Test coverage risk
  const testScore = calculateTestRisk(params.hasTests, params.filesChanged);
  factors.push(testScore);
  totalScore += testScore.score;

  // Change complexity risk
  const complexityScore = calculateComplexityRisk(
    params.hasBreakingChanges,
    params.hasDocumentation
  );
  factors.push(complexityScore);
  totalScore += complexityScore.score;

  // Review depth risk
  const reviewScore = calculateReviewRisk(
    params.commentDensity,
    params.reviewCount,
    params.additions + params.deletions
  );
  factors.push(reviewScore);
  totalScore += reviewScore.score;

  // Dependency risk
  const depScore = calculateDependencyRisk(params.isDependencyUpdate);
  factors.push(depScore);
  totalScore += depScore.score;

  // Staleness risk
  const staleScore = calculateStalenessRisk(params.age, params.isDraft);
  factors.push(staleScore);
  totalScore += staleScore.score;

  // Calculate overall risk
  const avgScore = totalScore / factors.length;
  const overallRisk = getRiskLevel(avgScore);
  const canAutoMerge = overallRisk === 'low' && params.reviewCount >= 1;
  
  const blockers = factors
    .filter(f => f.score >= 70)
    .map(f => f.blocker || f.description);

  const recommendations = factors
    .filter(f => f.suggestion)
    .map(f => f.suggestion!);

  return {
    overallRisk,
    riskScore: Math.round(avgScore),
    factors,
    canAutoMerge,
    blockers,
    recommendations,
    estimatedReviewTime: estimateReviewTime(params.additions, params.filesChanged),
  };
}

function calculateSizeRisk(additions: number, deletions: number, files: number): RiskFactor {
  const totalChange = additions + deletions;
  const largePR = totalChange > 500;
  const manyFiles = files > 20;

  let score = 30;
  let suggestion: string | undefined;

  if (totalChange > 1000) {
    score = 85;
    suggestion = 'Consider splitting this large PR into smaller, focused PRs';
  } else if (totalChange > 500) {
    score = 70;
    suggestion = 'This PR makes significant changes; consider adding more detailed descriptions';
  } else if (totalChange > 200) {
    score = 50;
    suggestion = 'Consider adding more inline comments to explain complex changes';
  }

  if (manyFiles) {
    score = Math.min(100, score + 15);
    suggestion = suggestion || 'Many files changed; ensure each change is well-justified';
  }

  return {
    name: 'Size',
    score,
    description: `${files} files, ${additions} additions, ${deletions} deletions`,
    suggestion,
  };
}

function calculateTestRisk(hasTests: boolean, files: number): RiskFactor {
  let score = hasTests ? 20 : 70;
  let suggestion: string | undefined;

  if (!hasTests && files > 3) {
    score = 90;
    suggestion = 'Add tests to ensure your changes work correctly';
  } else if (!hasTests) {
    suggestion = 'Consider adding tests for critical changes';
  }

  return {
    name: 'Test Coverage',
    score,
    description: hasTests ? 'Tests included' : 'No tests detected',
    suggestion,
  };
}

function calculateComplexityRisk(
  hasBreakingChanges: boolean,
  hasDocs: boolean
): RiskFactor {
  let score = hasBreakingChanges ? 80 : 25;
  let suggestion: string | undefined;

  if (hasBreakingChanges) {
    suggestion = 'Document breaking changes clearly and consider adding a migration guide';
  }

  if (!hasDocs) {
    score = Math.min(100, score + 10);
  }

  return {
    name: 'Complexity',
    score,
    description: [
      hasBreakingChanges ? 'Contains breaking changes' : 'No breaking changes',
      hasDocs ? '| Documentation updated' : '| Missing documentation',
    ].join(' '),
    suggestion,
  };
}

function calculateReviewRisk(
  commentDensity: number,
  reviewCount: number,
  totalChange: number
): RiskFactor {
  const expectedReviews = Math.max(1, Math.floor(totalChange / 200));
  
  let score = 30;
  let suggestion: string | undefined;

  if (reviewCount === 0) {
    score = 60;
    suggestion = 'Await at least one review before merging';
  } else if (reviewCount >= expectedReviews) {
    score = 15;
  }

  if (commentDensity < 0.5 && totalChange > 100) {
    score = Math.min(100, score + 10);
    suggestion = suggestion || 'Consider adding more context in code comments or PR description';
  }

  return {
    name: 'Review Depth',
    score,
    description: `${reviewCount} review(s), ${commentDensity.toFixed(1)} comments per 100 lines`,
    suggestion,
  };
}

function calculateDependencyRisk(isDependencyUpdate: boolean): RiskFactor {
  const score = isDependencyUpdate ? 25 : 35;
  
  return {
    name: 'Dependency Risk',
    score,
    description: isDependencyUpdate
      ? 'Dependency updates - typically low risk'
      : 'No dependency changes',
  };
}

function calculateStalenessRisk(age: number, isDraft: boolean): RiskFactor {
  let score = 25;
  let suggestion: string | undefined;

  if (isDraft) {
    score = 15;
  } else if (age > 30) {
    score = 85;
    suggestion = 'This PR is quite stale; consider if it\'s still relevant';
  } else if (age > 14) {
    score = 55;
    suggestion = 'PR is getting stale; try to address feedback or close and reopen';
  } else if (age > 7) {
    score = 40;
  }

  return {
    name: 'Staleness',
    score,
    description: isDraft ? 'Draft PR' : `${age} days old`,
    suggestion,
  };
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function estimateReviewTime(additions: number, files: number): string {
  const minutesPerFile = 3;
  const minutesPerLine = 0.05;
  const estimated = Math.ceil(files * minutesPerFile + additions * minutesPerLine);
  
  if (estimated < 15) return '< 15 min';
  if (estimated < 30) return '15-30 min';
  if (estimated < 60) return '30-60 min';
  return `> 60 min (${Math.ceil(estimated / 60)}h)`;
}

// Quick check for common issues
export function quickRiskCheck(pr: {
  hasTests: boolean;
  reviewCount: number;
  isDraft: boolean;
}): { pass: boolean; message: string } {
  if (pr.isDraft) {
    return { pass: false, message: 'PR is still in draft state' };
  }
  if (pr.reviewCount === 0) {
    return { pass: false, message: 'No reviews yet' };
  }
  if (!pr.hasTests) {
    return { pass: false, message: 'Missing tests' };
  }
  return { pass: true, message: 'PR ready for merge' };
}
