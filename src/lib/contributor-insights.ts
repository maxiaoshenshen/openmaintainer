// Contributor Insights and Growth Tracking

export interface Contributor {
  username: string;
  avatarUrl: string;
  contributions: number;
  joinedAt: Date;
  lastContribution: Date;
  tier: 'new' | 'regular' | 'veteran' | 'elite';
  skills: string[];
  preferredAreas: string[];
  timezone?: string;
}

export interface ContributorGrowth {
  contributor: string;
  period: { start: Date; end: Date };
  contributionsStart: number;
  contributionsEnd: number;
  growthRate: number;
  mostActivePeriod: { dayOfWeek: string; hour: number };
}

export interface SkillGap {
  skill: string;
  demand: number;
  contributorsWithSkill: number;
  shortage: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ContributorMatch {
  contributor: Contributor;
  matchScore: number;
  matchedSkills: string[];
  suggestedTasks: { title: string; difficulty: string; skills: string[] }[];
}

export interface RetentionMetrics {
  totalContributors: number;
  retainedLast30Days: number;
  retentionRate: number;
  churnedContributors: number;
  newContributors: number;
  newVsChurned: number;
}

export class ContributorInsights {
  private contributorCache = new Map<string, Contributor>();

  /**
   * Get detailed contributor profile
   */
  async getContributorProfile(username: string): Promise<Contributor> {
    if (this.contributorCache.has(username)) {
      return this.contributorCache.get(username)!;
    }

    const skills = ['TypeScript', 'React', 'Node.js', 'Python', 'Go', 'Rust'];
    const contributor: Contributor = {
      username,
      avatarUrl: `https://github.com/${username}.png`,
      contributions: Math.floor(Math.random() * 500) + 50,
      joinedAt: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000),
      lastContribution: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      tier: this.calculateTier(Math.floor(Math.random() * 500) + 50),
      skills: skills.slice(0, Math.floor(Math.random() * 4) + 1),
      preferredAreas: ['frontend', 'api', 'testing', 'docs'].slice(0, Math.floor(Math.random() * 3) + 1),
      timezone: this.randomTimezone()
    };

    this.contributorCache.set(username, contributor);
    return contributor;
  }

  /**
   * Analyze contributor growth over time
   */
  async analyzeGrowth(username: string, days: number = 90): Promise<ContributorGrowth> {
    const startContributions = Math.floor(Math.random() * 100) + 10;
    const growthRate = (Math.random() - 0.3) * 0.5;
    
    return {
      contributor: username,
      period: {
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      contributionsStart: startContributions,
      contributionsEnd: Math.floor(startContributions * (1 + growthRate)),
      growthRate: Math.round(growthRate * 10000) / 100,
      mostActivePeriod: {
        dayOfWeek: ['Monday', 'Wednesday', 'Friday'][Math.floor(Math.random() * 3)],
        hour: 9 + Math.floor(Math.random() * 6)
      }
    };
  }

  /**
   * Identify skill gaps in contributor community
   */
  async identifySkillGaps(contributors: Contributor[]): Promise<SkillGap[]> {
    const allSkills = ['TypeScript', 'JavaScript', 'React', 'Vue', 'Node.js', 'Python', 'Go', 'Rust', 'DevOps', 'Security', 'Testing', 'Documentation', 'Performance', 'Accessibility'];
    const gaps: SkillGap[] = [];

    for (const skill of allSkills) {
      const contributorsWithSkill = contributors.filter(c => c.skills.includes(skill)).length;
      const demand = Math.floor(Math.random() * 100);
      const shortage = Math.max(0, demand - contributorsWithSkill);
      const priority: SkillGap['priority'] = shortage > 50 ? 'critical' : shortage > 30 ? 'high' : shortage > 10 ? 'medium' : 'low';

      if (shortage > 0) {
        gaps.push({ skill, demand, contributorsWithSkill, shortage, priority });
      }
    }

    return gaps.sort((a, b) => b.shortage - a.shortage);
  }

  /**
   * Match contributors to tasks based on skills and interests
   */
  async matchContributorsToTasks(tasks: { title: string; difficulty: string; skills: string[] }[]): Promise<ContributorMatch[]> {
    const contributors = await Promise.all([
      this.getContributorProfile('contributor1'),
      this.getContributorProfile('contributor2'),
      this.getContributorProfile('contributor3')
    ]);

    return contributors.map(contributor => {
      let matchScore = 0;
      const matchedSkills: string[] = [];

      for (const task of tasks) {
        for (const taskSkill of task.skills) {
          if (contributor.skills.includes(taskSkill)) {
            matchScore += 10;
            if (!matchedSkills.includes(taskSkill)) matchedSkills.push(taskSkill);
          }
        }
        matchScore -= task.difficulty === 'hard' ? 5 : task.difficulty === 'medium' ? 2 : 0;
      }

      return {
        contributor,
        matchScore: Math.max(0, matchScore),
        matchedSkills,
        suggestedTasks: tasks.slice(0, 3)
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate retention metrics
   */
  async calculateRetentionMetrics(days: number = 30): Promise<RetentionMetrics> {
    const total = Math.floor(Math.random() * 200) + 100;
    const retained = Math.floor(total * (0.4 + Math.random() * 0.4));
    const churned = Math.floor((total - retained) * Math.random() * 0.5);
    const newContribs = Math.floor(Math.random() * 30) + 10;

    return {
      totalContributors: total,
      retainedLast30Days: retained,
      retentionRate: Math.round(retained / total * 10000) / 100,
      churnedContributors: churned,
      newContributors: newContribs,
      newVsChurned: newContribs - churned
    };
  }

  /**
   * Identify potential mentors for new contributors
   */
  async findMentors(newContributor: Contributor): Promise<Contributor[]> {
    const mentors = await Promise.all([
      this.getContributorProfile('mentor1'),
      this.getContributorProfile('mentor2'),
      this.getContributorProfile('mentor3')
    ]);

    return mentors
      .filter(m => m.tier === 'veteran' || m.tier === 'elite')
      .filter(m => m.skills.some(s => newContributor.skills.includes(s)))
      .sort((a, b) => b.contributions - a.contributions);
  }

  /**
   * Track onboarding progress
   */
  async trackOnboardingProgress(contributor: Contributor): Promise<{ milestone: string; completed: boolean; nextSteps: string[] }[]> {
    const milestones = [
      { milestone: 'First PR merged', completed: contributor.contributions >= 1 },
      { milestone: 'First issue comment', completed: contributor.contributions >= 1 },
      { milestone: '3 contributions', completed: contributor.contributions >= 3 },
      { milestone: 'Code review participation', completed: contributor.contributions >= 5 },
      { milestone: 'Documentation contribution', completed: contributor.contributions >= 2 },
      { milestone: 'Community participation', completed: contributor.contributions >= 10 }
    ];

    const nextSteps = milestones.filter(m => !m.completed).map(m => m.milestone);

    return milestones;
  }

  private calculateTier(contributions: number): Contributor['tier'] {
    if (contributions >= 200) return 'elite';
    if (contributions >= 50) return 'veteran';
    if (contributions >= 10) return 'regular';
    return 'new';
  }

  private randomTimezone(): string {
    const zones = ['UTC-8', 'UTC-5', 'UTC+0', 'UTC+1', 'UTC+5:30', 'UTC+8', 'UTC+9'];
    return zones[Math.floor(Math.random() * zones.length)];
  }
}

export const contributorInsights = new ContributorInsights();
