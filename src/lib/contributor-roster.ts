/**
 * Contributor Roster - Manage and track your contributor team
 */

export interface ContributorProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  role: 'maintainer' | 'core' | 'contributor' | 'occasional';
  joinedAt: string;
  specialties: string[];
  contributionStats: {
    prs: number;
    issues: number;
    reviews: number;
    commits: number;
  };
  availability: 'active' | 'limited' | 'away' | 'inactive';
  timezone?: string;
  preferredLanguages?: string[];
  contact?: {
    email?: string;
    twitter?: string;
    github?: string;
  };
}

export interface RosterConfig {
  autoRoleByPRs?: boolean;
  minPRsForCore?: number;
  minPRsForContributor?: number;
  inactivityThresholdDays?: number;
}

const DEFAULT_CONFIG: RosterConfig = {
  autoRoleByPRs: true,
  minPRsForCore: 10,
  minPRsForContributor: 3,
  inactivityThresholdDays: 90,
};

export function createRoster(config: Partial<RosterConfig> = {}): RosterManager {
  return new RosterManager({ ...DEFAULT_CONFIG, ...config });
}

class RosterManager {
  private contributors: Map<string, ContributorProfile> = new Map();
  private config: RosterConfig;

  constructor(config: RosterConfig) {
    this.config = config;
  }

  addContributor(contributor: ContributorProfile): void {
    if (this.config.autoRoleByPRs) {
      contributor.role = this.calculateRole(contributor.contributionStats.prs);
    }
    contributor.availability = this.calculateAvailability(contributor.joinedAt);
    this.contributors.set(contributor.id, contributor);
  }

  removeContributor(id: string): boolean {
    return this.contributors.delete(id);
  }

  getContributor(id: string): ContributorProfile | undefined {
    return this.contributors.get(id);
  }

  getAllContributors(): ContributorProfile[] {
    return Array.from(this.contributors.values());
  }

  getContributorsByRole(role: ContributorProfile['role']): ContributorProfile[] {
    return this.getAllContributors().filter(c => c.role === role);
  }

  getContributorsByAvailability(availability: ContributorProfile['availability']): ContributorProfile[] {
    return this.getAllContributors().filter(c => c.availability === availability);
  }

  getTeamStats(): {
    total: number;
    byRole: Record<string, number>;
    byAvailability: Record<string, number>;
    totalContributions: number;
  } {
    const contributors = this.getAllContributors();
    return {
      total: contributors.length,
      byRole: this.groupBy(contributors, 'role'),
      byAvailability: this.groupBy(contributors, 'availability'),
      totalContributions: contributors.reduce(
        (sum, c) => sum + c.contributionStats.prs + c.contributionStats.commits,
        0
      ),
    };
  }

  findAvailableReviewers(requiredSpecialties: string[] = [], limit = 5): ContributorProfile[] {
    return this.getAllContributors()
      .filter(c => c.availability === 'active')
      .filter(c => 
        requiredSpecialties.length === 0 ||
        requiredSpecialties.some(s => c.specialties.includes(s))
      )
      .sort((a, b) => b.contributionStats.reviews - a.contributionStats.reviews)
      .slice(0, limit);
  }

  generateOnboardingTasks(contributorId: string): string[] {
    const contributor = this.getContributor(contributorId);
    if (!contributor) return [];

    const tasks: string[] = [
      'Set up development environment',
      'Read the contribution guidelines',
      'Review the code of conduct',
      'Complete security awareness training',
    ];

    if (contributor.role === 'maintainer' || contributor.role === 'core') {
      tasks.push(
        'Get added to the repository as a collaborator',
        'Set up 2FA on GitHub',
        'Join the maintainers Slack/Discord channel',
        'Review the release process documentation'
      );
    }

    if (contributor.specialties.includes('testing')) {
      tasks.push(
        'Review the testing strategy document',
        'Set up local testing environment'
      );
    }

    return tasks;
  }

  generateRecognitionReport(): {
    topContributors: ContributorProfile[];
    mostActive: ContributorProfile[];
    risingStars: ContributorProfile[];
    milestoneContributors: { username: string; milestone: string }[];
  } {
    const contributors = this.getAllContributors();
    const sorted = [...contributors].sort(
      (a, b) => this.totalContributions(b) - this.totalContributions(a)
    );

    return {
      topContributors: sorted.slice(0, 5),
      mostActive: sorted.filter(c => c.availability === 'active').slice(0, 5),
      risingStars: this.findRisingStars(contributors),
      milestoneContributors: this.findMilestones(contributors),
    };
  }

  private calculateRole(prCount: number): ContributorProfile['role'] {
    if (prCount >= this.config.minPRsForCore!) return 'core';
    if (prCount >= this.config.minPRsForContributor!) return 'contributor';
    return 'occasional';
  }

  private calculateAvailability(joinedAt: string): ContributorProfile['availability'] {
    const daysSinceJoined = Math.floor(
      (Date.now() - new Date(joinedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceJoined < 7) return 'active';
    if (daysSinceJoined < 30) return 'limited';
    if (daysSinceJoined < this.config.inactivityThresholdDays!) return 'away';
    return 'inactive';
  }

  private totalContributions(c: ContributorProfile): number {
    return c.contributionStats.prs + 
           c.contributionStats.issues + 
           c.contributionStats.reviews + 
           c.contributionStats.commits;
  }

  private groupBy<T extends Record<string, any>, K extends keyof T>(
    items: T[],
    key: K
  ): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private findRisingStars(contributors: ContributorProfile[]): ContributorProfile[] {
    return contributors
      .filter(c => c.contributionStats.prs >= 1 && c.contributionStats.prs <= 5)
      .filter(c => {
        const joinedDate = new Date(c.joinedAt);
        const monthsSinceJoined = (Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsSinceJoined <= 3;
      })
      .sort((a, b) => b.contributionStats.prs - a.contributionStats.prs)
      .slice(0, 3);
  }

  private findMilestones(
    contributors: ContributorProfile[]
  ): { username: string; milestone: string }[] {
    const milestones = [10, 25, 50, 100, 250, 500];
    const result: { username: string; milestone: string }[] = [];

    for (const contributor of contributors) {
      const total = this.totalContributions(contributor);
      for (const milestone of milestones) {
        if (total >= milestone) {
          result.push({
            username: contributor.username,
            milestone: `${milestone} contributions! 🎉`,
          });
        }
      }
    }

    return result.sort((a, b) => 
      parseInt(b.milestone) - parseInt(a.milestone)
    );
  }
}

export function importContributorsFromGitHub(data: any[]): ContributorProfile[] {
  return data.map((user, index) => ({
    id: String(user.id || index),
    username: user.login || user.username,
    avatarUrl: user.avatar_url || user.avatarUrl,
    role: 'contributor' as const,
    joinedAt: user.created_at || user.joinedAt || new Date().toISOString(),
    specialties: user.specialties || [],
    contributionStats: {
      prs: user.prs || user.contributions || 0,
      issues: user.issues || 0,
      reviews: user.reviews || 0,
      commits: user.commits || 0,
    },
    availability: 'active' as const,
    timezone: user.timezone,
    preferredLanguages: user.languages || user.preferredLanguages,
    contact: user.contact || {
      github: user.login,
    },
  }));
}
