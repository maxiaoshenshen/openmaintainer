import type { Repository } from './types';

/**
 * Contributor Manager - Manages and analyzes project contributors
 */
export interface Contributor {
  id: string;
  username: string;
  avatarUrl?: string;
  contributions: number;
  role: 'maintainer' | 'contributor' | 'first-timer';
  joinedAt: Date;
  lastActiveAt: Date;
  specialties: string[];
  mergedPRs: number;
  openIssues: number;
}

export interface ContributorStats {
  totalContributors: number;
  activeContributors: number;
  newContributors: number;
  contributorsByRole: Record<string, number>;
  topContributors: Contributor[];
  retentionRate: number;
}

export interface ContributorReport {
  repository: Repository;
  contributors: Contributor[];
  stats: ContributorStats;
  generatedAt: Date;
}

export function createContributorManager() {
  const generateReport = (repo: Repository): ContributorReport => {
    const contributors = generateMockContributors(repo);
    
    const stats: ContributorStats = {
      totalContributors: contributors.length,
      activeContributors: contributors.filter(c => 
        c.lastActiveAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      newContributors: contributors.filter(c => 
        c.joinedAt > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      ).length,
      contributorsByRole: {
        maintainer: contributors.filter(c => c.role === 'maintainer').length,
        contributor: contributors.filter(c => c.role === 'contributor').length,
        'first-timer': contributors.filter(c => c.role === 'first-timer').length
      },
      topContributors: contributors
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 5),
      retentionRate: 0.78
    };

    return {
      repository: repo,
      contributors,
      stats,
      generatedAt: new Date()
    };
  };

  const generateMockContributors = (repo: Repository): Contributor[] => {
    const names = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry'];
    const specialties = ['TypeScript', 'Rust', 'Python', 'Go', 'DevOps', 'Documentation', 'Testing'];
    
    return names.map((name, i) => ({
      id: `contrib-${i}`,
      username: name,
      avatarUrl: `https://avatars.githubusercontent.com/${name}`,
      contributions: Math.floor(Math.random() * 200) + 10,
      role: i === 0 ? 'maintainer' : i < 3 ? 'contributor' : 'first-timer',
      joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      specialties: [specialties[i % specialties.length], specialties[(i + 2) % specialties.length]],
      mergedPRs: Math.floor(Math.random() * 50),
      openIssues: Math.floor(Math.random() * 10)
    }));
  };

  const getContributorHealth = (report: ContributorReport): string => {
    const { activeContributors, totalContributors, retentionRate } = report.stats;
    
    if (activeContributors >= totalContributors * 0.6 && retentionRate > 0.7) {
      return 'healthy';
    } else if (activeContributors >= totalContributors * 0.3) {
      return 'needs-attention';
    }
    return 'at-risk';
  };

  const generateRecommendations = (report: ContributorReport): string[] => {
    const recs: string[] = [];
    
    if (report.stats.newContributors < 2) {
      recs.push('Consider running a "good first issue" campaign to attract new contributors');
    }
    
    if (report.stats.retentionRate < 0.6) {
      recs.push('Focus on contributor retention - review onboarding experience');
    }
    
    if (report.stats.activeContributors < 3) {
      recs.push('Build a contributor community - consider virtual meetups or Discord');
    }
    
    recs.push('Recognize top contributors publicly');
    recs.push('Create detailed CONTRIBUTING guidelines');
    
    return recs;
  };

  return {
    generateReport,
    getContributorHealth,
    generateRecommendations,
    roles: ['maintainer', 'contributor', 'first-timer'] as const
  };
}
