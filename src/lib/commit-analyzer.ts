/**
 * Commit Analyzer - Analyze commit patterns and quality
 */

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  filesChanged: number;
  additions: number;
  deletions: number;
}

export interface CommitPattern {
  type: 'feature' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore' | 'other';
  scope?: string;
  breaking: boolean;
}

export interface CommitAnalysis {
  totalCommits: number;
  commitTypes: Record<string, number>;
  averageCommitsPerWeek: number;
  topContributors: Array<{ author: string; count: number }>;
  busiestDays: string[];
  commitSizeDistribution: {
    small: number;    // < 50 lines
    medium: number;   // 50-200 lines
    large: number;    // 200-500 lines
    xlarge: number;   // > 500 lines
  };
  qualityScore: number;  // 0-100
}

export function parseCommitType(message: string): CommitPattern {
  const conventionalCommitRegex = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)/;
  const match = message.match(conventionalCommitRegex);
  
  if (!match) {
    return { type: 'other', breaking: false };
  }

  const [, type, scope, breaking] = match;
  const validTypes = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'ci', 'build'];
  
  return {
    type: (validTypes.includes(type) ? type : 'other') as CommitPattern['type'],
    scope,
    breaking: !!breaking,
  };
}

export function analyzeCommits(commits: CommitInfo[]): CommitAnalysis {
  const commitTypes: Record<string, number> = {};
  const authorCounts: Record<string, number> = {};
  const dayCounts: Record<string, number> = {};
  const sizeDistribution = { small: 0, medium: 0, large: 0, xlarge: 0 };

  commits.forEach(commit => {
    const pattern = parseCommitType(commit.message);
    commitTypes[pattern.type] = (commitTypes[pattern.type] || 0) + 1;
    
    authorCounts[commit.author] = (authorCounts[commit.author] || 0) + 1;
    
    const day = new Date(commit.date).toLocaleDateString('en-US', { weekday: 'long' });
    dayCounts[day] = (dayCounts[day] || 0) + 1;

    const totalChanges = commit.additions + commit.deletions;
    if (totalChanges < 50) sizeDistribution.small++;
    else if (totalChanges < 200) sizeDistribution.medium++;
    else if (totalChanges < 500) sizeDistribution.large++;
    else sizeDistribution.xlarge++;
  });

  const topContributors = Object.entries(authorCounts)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const busiestDays = Object.entries(dayCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([day]) => day);

  // Calculate quality score
  const conventionalRatio = commits.filter(c => parseCommitType(c.message).type !== 'other').length / commits.length;
  const smallCommitRatio = sizeDistribution.small / commits.length;
  const qualityScore = Math.round((conventionalRatio * 0.4 + smallCommitRatio * 0.3 + Math.min(1, commits.length / 100) * 0.3) * 100);

  return {
    totalCommits: commits.length,
    commitTypes,
    averageCommitsPerWeek: commits.length / 52,
    topContributors,
    busiestDays,
    commitSizeDistribution: sizeDistribution,
    qualityScore,
  };
}

export function generateCommitMessage(type: string, scope?: string, description?: string): string {
  if (!description) {
    const templates: Record<string, string> = {
      feat: 'Add new feature',
      fix: 'Fix bug',
      refactor: 'Refactor code',
      docs: 'Update documentation',
      test: 'Add tests',
      chore: 'Update dependencies',
    };
    description = templates[type] || 'Make changes';
  }

  const scopePart = scope ? `(${scope})` : '';
  return `${type}${scopePart}: ${description}`;
}
