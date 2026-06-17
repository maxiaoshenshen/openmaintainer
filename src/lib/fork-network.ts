// Fork Network Analysis for OSS Projects

export interface Fork {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  isArchived: boolean;
  isFork: boolean;
  parentFullName?: string;
  createdAt: Date;
  pushedAt: Date;
  language: string | null;
  topics: string[];
}

export interface ForkNetwork {
  rootRepo: string;
  forks: Fork[];
  totalForks: number;
  uniqueOwners: number;
  depth: number;
}

export interface ForkCluster {
  id: string;
  forks: Fork[];
  sharedTopics: string[];
  commonCharacteristics: string;
}

export interface ForkAnalytics {
  mostActiveForks: Fork[];
  largestForks: Fork[];
  recentlyUpdatedForks: Fork[];
  distributionByOwner: { owner: string; count: number }[];
  forksByLanguage: { language: string; count: number }[];
  archivedRatio: number;
}

export class ForkNetworkAnalyzer {
  /**
   * Analyze the entire fork network of a repository
   */
  async analyzeNetwork(repo: string): Promise<ForkNetwork> {
    const forks = await this.getForks(repo);
    const uniqueOwners = new Set(forks.map(f => f.owner)).size;
    const maxDepth = this.calculateMaxDepth(forks);

    return {
      rootRepo: repo,
      forks,
      totalForks: forks.length,
      uniqueOwners,
      depth: maxDepth
    };
  }

  /**
   * Get all forks of a repository
   */
  async getForks(repo: string): Promise<Fork[]> {
    return this.generateMockForks(repo);
  }

  /**
   * Identify clusters of similar forks
   */
  identifyClusters(forks: Fork[]): ForkCluster[] {
    const clusters: ForkCluster[] = [];
    const topicGroups = new Map<string, Fork[]>();

    for (const fork of forks) {
      for (const topic of fork.topics) {
        if (!topicGroups.has(topic)) {
          topicGroups.set(topic, []);
        }
        topicGroups.get(topic)!.push(fork);
      }
    }

    let clusterId = 0;
    for (const [topic, groupForks] of topicGroups) {
      if (groupForks.length >= 3) {
        clusters.push({
          id: `cluster-${clusterId++}`,
          forks: groupForks,
          sharedTopics: [topic],
          commonCharacteristics: `Forks with topic: ${topic}`
        });
      }
    }

    return clusters;
  }

  /**
   * Generate analytics from fork data
   */
  analyzeForks(forks: Fork[]): ForkAnalytics {
    const mostActive = [...forks].sort((a, b) => b.openIssues - a.openIssues).slice(0, 10);
    const largest = [...forks].sort((a, b) => b.stars - a.stars).slice(0, 10);
    const recentlyUpdated = [...forks].sort((a, b) => b.pushedAt.getTime() - a.pushedAt.getTime()).slice(0, 10);

    const ownerCounts = new Map<string, number>();
    for (const fork of forks) {
      ownerCounts.set(fork.owner, (ownerCounts.get(fork.owner) || 0) + 1);
    }
    const distributionByOwner = Array.from(ownerCounts.entries())
      .map(([owner, count]) => ({ owner, count }))
      .sort((a, b) => b.count - a.count);

    const languageCounts = new Map<string, number>();
    for (const fork of forks) {
      if (fork.language) {
        languageCounts.set(fork.language, (languageCounts.get(fork.language) || 0) + 1);
      }
    }
    const forksByLanguage = Array.from(languageCounts.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    const archivedCount = forks.filter(f => f.isArchived).length;
    const archivedRatio = forks.length > 0 ? archivedCount / forks.length : 0;

    return {
      mostActiveForks: mostActive,
      largestForks: largest,
      recentlyUpdatedForks: recentlyUpdated,
      distributionByOwner,
      forksByLanguage,
      archivedRatio: Math.round(archivedRatio * 100) / 100
    };
  }

  /**
   * Find influential forks
   */
  findInfluentialForks(forks: Fork[]): Fork[] {
    return forks
      .filter(f => f.stars > 0 || f.forks > 0)
      .sort((a, b) => (b.stars * 10 + b.forks) - (a.stars * 10 + a.forks))
      .slice(0, 20);
  }

  /**
   * Track fork evolution over time
   */
  trackEvolution(forks: Fork[]): { date: Date; totalForks: number; activeForks: number }[] {
    const timeline: { date: Date; totalForks: number; activeForks: number }[] = [];
    const sortedForks = [...forks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    let cumulative = 0;
    const now = new Date();
    
    for (let i = 0; i <= 12; i++) {
      const date = new Date(now.getTime() - (11 - i) * 30 * 24 * 60 * 60 * 1000);
      const createdByDate = sortedForks.filter(f => f.createdAt <= date).length;
      const activeInRange = sortedForks.filter(f => {
        const monthsAgo = (now.getTime() - f.pushedAt.getTime()) / (30 * 24 * 60 * 60 * 1000);
        return monthsAgo <= (12 - i);
      }).length;
      
      timeline.push({ date, totalForks: createdByDate, activeForks: activeInRange });
    }

    return timeline;
  }

  private calculateMaxDepth(forks: Fork[]): number {
    let maxDepth = 0;
    const depthCache = new Map<string, number>();

    for (const fork of forks) {
      const depth = this.getDepth(fork, forks, depthCache);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  private getDepth(fork: Fork, allForks: Fork[], cache: Map<string, number>): number {
    if (cache.has(fork.fullName)) return cache.get(fork.fullName)!;
    if (!fork.parentFullName) {
      cache.set(fork.fullName, 0);
      return 0;
    }

    const parent = allForks.find(f => f.fullName === fork.parentFullName);
    const depth = parent ? this.getDepth(parent, allForks, cache) + 1 : 1;
    cache.set(fork.fullName, depth);
    return depth;
  }

  private generateMockForks(repo: string): Fork[] {
    const forks: Fork[] = [];
    const languages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'Ruby'];
    const topics = ['web', 'api', 'cli', 'database', 'testing', 'documentation', 'devops', 'machine-learning'];

    for (let i = 0; i < 50; i++) {
      const owner = `user${i}`;
      forks.push({
        id: `fork-${i}`,
        fullName: `${owner}/${repo.split('/')[1]}-fork`,
        name: `${repo.split('/')[1]}-fork`,
        owner,
        description: `A fork of ${repo}`,
        stars: Math.floor(Math.random() * 100),
        forks: Math.floor(Math.random() * 10),
        openIssues: Math.floor(Math.random() * 20),
        defaultBranch: 'main',
        isArchived: Math.random() > 0.9,
        isFork: true,
        parentFullName: i === 0 ? undefined : repo,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        pushedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        language: languages[Math.floor(Math.random() * languages.length)],
        topics: topics.slice(0, Math.floor(Math.random() * 4) + 1)
      });
    }

    return forks;
  }
}

export const forkNetworkAnalyzer = new ForkNetworkAnalyzer();
