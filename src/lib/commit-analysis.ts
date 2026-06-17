export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  date: Date;
  filesChanged: number;
  insertions: number;
  deletions: number;
  type?: CommitType;
  scope?: string;
  breaking?: boolean;
}

export type CommitType = 
  | 'feat' | 'fix' | 'docs' | 'style' | 'refactor' 
  | 'perf' | 'test' | 'build' | 'ci' | 'chore' | 'revert';

export interface CommitStatistics {
  totalCommits: number;
  byAuthor: Record<string, number>;
  byType: Record<CommitType, number>;
  byDay: Record<string, number>;
  byHour: Record<number, number>;
  avgFilesPerCommit: number;
  avgSize: number;
}

export interface CommitTrend {
  date: string;
  commits: number;
  authors: number;
  additions: number;
  deletions: number;
}

export class CommitAnalyzer {
  private commits: CommitInfo[] = [];

  async addCommit(data: Omit<CommitInfo, 'type' | 'scope' | 'breaking'>): Promise<CommitInfo> {
    const commit: CommitInfo = {
      ...data,
      ...this.parseCommitMessage(data.message),
    };

    this.commits.push(commit);
    return commit;
  }

  private parseCommitMessage(message: string): { type?: CommitType; scope?: string; breaking?: boolean } {
    // Parse conventional commit format: type(scope)!: description
    const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?:/);
    
    if (!match) {
      return { type: 'chore' };
    }

    const [, type, scope, breaking] = match;
    
    const validTypes: CommitType[] = [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'build', 'ci', 'chore', 'revert'
    ];

    return {
      type: validTypes.includes(type as CommitType) ? type as CommitType : 'chore',
      scope: scope || undefined,
      breaking: !!breaking,
    };
  }

  async getCommit(sha: string): Promise<CommitInfo | null> {
    return this.commits.find(c => c.sha === sha) || null;
  }

  async getRecentCommits(limit = 50): Promise<CommitInfo[]> {
    return [...this.commits]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async getStatistics(): Promise<CommitStatistics> {
    const byAuthor: Record<string, number> = {};
    const byType: Record<CommitType, number> = {
      feat: 0, fix: 0, docs: 0, style: 0, refactor: 0,
      perf: 0, test: 0, build: 0, ci: 0, chore: 0, revert: 0,
    };
    const byDay: Record<string, number> = {};
    const byHour: Record<number, number> = {};

    let totalFiles = 0;
    let totalSize = 0;

    for (const commit of this.commits) {
      byAuthor[commit.author] = (byAuthor[commit.author] || 0) + 1;
      if (commit.type) {
        byType[commit.type]++;
      }

      const day = commit.date.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;

      const hour = commit.date.getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;

      totalFiles += commit.filesChanged;
      totalSize += commit.insertions + commit.deletions;
    }

    return {
      totalCommits: this.commits.length,
      byAuthor,
      byType,
      byDay,
      byHour,
      avgFilesPerCommit: this.commits.length > 0 ? totalFiles / this.commits.length : 0,
      avgSize: this.commits.length > 0 ? totalSize / this.commits.length : 0,
    };
  }

  async getTrends(days = 30): Promise<CommitTrend[]> {
    const trends: CommitTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayCommits = this.commits.filter(
        c => c.date.toISOString().split('T')[0] === dateStr
      );

      const authors = new Set(dayCommits.map(c => c.author));

      trends.push({
        date: dateStr,
        commits: dayCommits.length,
        authors: authors.size,
        additions: dayCommits.reduce((sum, c) => sum + c.insertions, 0),
        deletions: dayCommits.reduce((sum, c) => sum + c.deletions, 0),
      });
    }

    return trends;
  }

  async getContributors(): Promise<Array<{ author: string; commits: number; lastCommit: Date }>> {
    const authorMap = new Map<string, { commits: number; lastCommit: Date }>();

    for (const commit of this.commits) {
      const existing = authorMap.get(commit.author);
      if (existing) {
        existing.commits++;
        if (commit.date > existing.lastCommit) {
          existing.lastCommit = commit.date;
        }
      } else {
        authorMap.set(commit.author, { commits: 1, lastCommit: commit.date });
      }
    }

    return Array.from(authorMap.entries())
      .map(([author, data]) => ({ author, ...data }))
      .sort((a, b) => b.commits - a.commits);
  }

  async getChangelogs(type?: CommitType): Promise<Record<string, string[]>> {
    const changelogs: Record<string, string[]> = {};

    for (const commit of this.commits) {
      const commitType = type || commit.type || 'chore';
      if (!changelogs[commitType]) {
        changelogs[commitType] = [];
      }
      
      // Extract message without the type prefix
      const message = commit.message.replace(/^\w+(?:\([^)]+\))?!?:\s*/, '');
      changelogs[commitType].push(`- ${message} (${commit.sha.slice(0, 7)})`);
    }

    return changelogs;
  }

  async getBreakingChanges(): Promise<CommitInfo[]> {
    return this.commits.filter(c => c.breaking);
  }

  async searchCommits(query: string): Promise<CommitInfo[]> {
    const lowerQuery = query.toLowerCase();
    return this.commits.filter(
      c => c.message.toLowerCase().includes(lowerQuery) ||
           c.author.toLowerCase().includes(lowerQuery) ||
           c.sha.includes(query)
    );
  }

  async getBurndownData(days = 7): Promise<Array<{ date: string; remaining: number }>> {
    const result: Array<{ date: string; remaining: number }> = [];
    let remaining = this.commits.length;
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const commitsOnDay = this.commits.filter(
        c => c.date.toISOString().split('T')[0] === dateStr
      ).length;

      result.push({ date: dateStr, remaining });
      remaining -= commitsOnDay;
    }

    return result;
  }
}
