import { Repository, Contributor } from './types';

export interface CommitAnalysis {
  author: string;
  totalCommits: number;
  additions: number;
  deletions: number;
  filesChanged: number;
  commitTypes: Record<string, number>;
  avgCommitSize: number;
  productivity: number;
}

export interface CommitTrend {
  date: Date;
  commits: number;
  additions: number;
  deletions: number;
  authors: string[];
}

export interface CommitPatterns {
  peakHours: number[];
  peakDays: string[];
  avgCommitsPerDay: number;
  burstActivity: boolean;
}

export interface RepoCommitStats {
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  activeDays: number;
  contributorCount: number;
  avgCommitsPerContributor: number;
}

export function analyzeCommitAuthor(
  commits: { sha: string; author: string; additions: number; deletions: number; files: number; message: string; date: Date }[]
): CommitAnalysis[] {
  const byAuthor = new Map<string, typeof commits>();
  
  commits.forEach(c => {
    if (!byAuthor.has(c.author)) byAuthor.set(c.author, []);
    byAuthor.get(c.author)!.push(c);
  });

  const analyses: CommitAnalysis[] = [];
  
  byAuthor.forEach((authorCommits, author) => {
    const totalAdditions = authorCommits.reduce((sum, c) => sum + c.additions, 0);
    const totalDeletions = authorCommits.reduce((sum, c) => sum + c.deletions, 0);
    const totalFiles = authorCommits.reduce((sum, c) => sum + c.files, 0);
    
    const commitTypes: Record<string, number> = {};
    authorCommits.forEach(c => {
      const type = extractCommitType(c.message);
      commitTypes[type] = (commitTypes[type] || 0) + 1;
    });

    const avgSize = authorCommits.length > 0 
      ? (totalAdditions + totalDeletions) / authorCommits.length 
      : 0;

    const productivity = calculateProductivity(
      authorCommits.length,
      totalAdditions,
      totalFiles,
      authorCommits.length > 0 ? 30 : 0
    );

    analyses.push({
      author,
      totalCommits: authorCommits.length,
      additions: totalAdditions,
      deletions: totalDeletions,
      filesChanged: totalFiles,
      commitTypes,
      avgCommitSize: Math.round(avgSize),
      productivity: Math.round(productivity * 100) / 100
    });
  });

  return analyses.sort((a, b) => b.totalCommits - a.totalCommits);
}

function extractCommitType(message: string): string {
  const match = message.match(/^(\w+)(\([^)]+\))?:/);
  return match ? match[1] : 'other';
}

function calculateProductivity(commits: number, additions: number, files: number, days: number): number {
  return (commits * 2 + additions / 100 + files * 0.5) / Math.max(1, days / 30);
}

export function analyzeCommitTrends(
  commits: { date: Date; author: string; additions: number; deletions: number }[]
): CommitTrend[] {
  const byDate = new Map<string, typeof commits>();
  
  commits.forEach(c => {
    const dateKey = c.date.toISOString().split('T')[0];
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(c);
  });

  const trends: CommitTrend[] = [];
  
  byDate.forEach((dayCommits, dateStr) => {
    const uniqueAuthors = [...new Set(dayCommits.map(c => c.author))];
    trends.push({
      date: new Date(dateStr),
      commits: dayCommits.length,
      additions: dayCommits.reduce((sum, c) => sum + c.additions, 0),
      deletions: dayCommits.reduce((sum, c) => sum + c.deletions, 0),
      authors: uniqueAuthors
    });
  });

  return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function detectCommitPatterns(
  commits: { date: Date; message: string }[]
): CommitPatterns {
  const hourCounts = new Array(24).fill(0);
  const dayCounts: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  const days = new Set(commits.map(c => c.date.toISOString().split('T')[0])).size;

  commits.forEach(c => {
    hourCounts[c.date.getHours()]++;
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][c.date.getDay()];
    dayCounts[dayName]++;
  });

  const peakHours = hourCounts
    .map((count, hour) => ({ count, hour }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(h => h.hour);

  const peakDays = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(d => d[0]);

  const avgCommitsPerDay = commits.length / Math.max(1, days);
  
  const burstActivity = avgCommitsPerDay > 5;

  return {
    peakHours,
    peakDays,
    avgCommitsPerDay: Math.round(avgCommitsPerDay * 100) / 100,
    burstActivity
  };
}

export function calculateRepoCommitStats(
  commits: { sha: string; author: string; additions: number; deletions: number }[]
): RepoCommitStats {
  const uniqueDays = new Set(commits.map(c => c.date.toISOString().split('T')[0])).size;
  const uniqueAuthors = new Set(commits.map(c => c.author)).size;
  const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);

  return {
    totalCommits: commits.length,
    totalAdditions,
    totalDeletions,
    activeDays: uniqueDays,
    contributorCount: uniqueAuthors,
    avgCommitsPerContributor: uniqueAuthors > 0 
      ? Math.round((commits.length / uniqueAuthors) * 100) / 100 
      : 0
  };
}
