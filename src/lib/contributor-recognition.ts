export interface Contributor {
  username: string;
  avatarUrl?: string;
  contributions: number;
  firstContribution?: string;
  lastContribution?: string;
  specialties: string[];
  badges: Badge[];
  impact: {
    issuesClosed: number;
    prsMerged: number;
    reviewsGiven: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  earnedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requirement: number;
  type: "issues" | "prs" | "reviews" | "streak" | "special";
  tier: Badge["tier"];
}

export class ContributorRecognition {
  private achievements: Achievement[] = [
    { id: "first-pr", title: "First Contribution", description: "Merged your first PR", requirement: 1, type: "prs", tier: "bronze" },
    { id: "pr-10", title: "Regular Contributor", description: "Merged 10 PRs", requirement: 10, type: "prs", tier: "bronze" },
    { id: "pr-50", title: "Prolific Contributor", description: "Merged 50 PRs", requirement: 50, type: "prs", tier: "silver" },
    { id: "pr-100", title: "Top Contributor", description: "Merged 100 PRs", requirement: 100, type: "prs", tier: "gold" },
    { id: "pr-500", title: "Legendary Contributor", description: "Merged 500 PRs", requirement: 500, type: "prs", tier: "platinum" },
    { id: "issues-10", title: "Bug Hunter", description: "Closed 10 issues", requirement: 10, type: "issues", tier: "bronze" },
    { id: "issues-50", title: "Problem Solver", description: "Closed 50 issues", requirement: 50, type: "issues", tier: "silver" },
    { id: "reviews-10", title: "Code Reviewer", description: "Submitted 10 reviews", requirement: 10, type: "reviews", tier: "bronze" },
    { id: "streak-7", title: "Weekly Warrior", description: "7 day contribution streak", requirement: 7, type: "streak", tier: "bronze" },
    { id: "streak-30", title: "Monthly Master", description: "30 day contribution streak", requirement: 30, type: "streak", tier: "gold" },
    { id: "mentor", title: "Community Mentor", description: "Helped 10 newcomers", requirement: 10, type: "special", tier: "silver" },
  ];

  evaluateContributor(contributor: Partial<Contributor>): Contributor {
    const full: Contributor = {
      username: contributor.authorname ?? "unknown",
      avatarUrl: contributor.avatarUrl,
      contributions: contributor.contributions ?? 0,
      firstContribution: contributor.firstContribution,
      lastContribution: contributor.lastContribution,
      specialties: contributor.specialties ?? this.detectSpecialties(contributor),
      badges: contributor.badges ?? this.calculateBadges(contributor),
      impact: contributor.impact ?? { issuesClosed: 0, prsMerged: 0, reviewsGiven: 0 },
    };

    return full;
  }

  calculateBadges(contributor: Partial<Contributor>): Badge[] {
    const badges: Badge[] = [];
    const contributions = contributor.contributions ?? 0;
    const issuesClosed = contributor.impact?.issuesClosed ?? 0;
    const prsMerged = contributor.impact?.prsMerged ?? 0;

    for (const achievement of this.achievements) {
      let count = 0;
      switch (achievement.type) {
        case "prs": count = prsMerged; break;
        case "issues": count = issuesClosed; break;
        default: count = contributions;
      }

      if (count >= achievement.requirement) {
        badges.push({
          id: achievement.id,
          name: achievement.title,
          description: achievement.description,
          icon: this.getBadgeIcon(achievement.tier),
          tier: achievement.tier,
          earnedAt: new Date().toISOString(),
        });
      }
    }

    return badges;
  }

  private getBadgeIcon(tier: Badge["tier"]): string {
    const icons: Record<string, string> = {
      bronze: "🥉",
      silver: "🥈",
      gold: "🥇",
      platinum: "💎",
    };
    return icons[tier] ?? "🏅";
  }

  private detectSpecialties(contributor: Partial<Contributor>): string[] {
    const specialties: string[] = [];
    const impact = contributor.impact ?? { issuesClosed: 0, prsMerged: 0, reviewsGiven: 0 };

    if (impact.prsMerged > 20) specialties.push("Code");
    if (impact.issuesClosed > 20) specialties.push("Bug Fixes");
    if (impact.reviewsGiven > 10) specialties.push("Code Review");
    if (contributor.contributions ?? 0 > 100) specialties.push("Active");

    return specialties;
  }

  getLeaderboard(contributors: Contributor[], limit: number = 10): Contributor[] {
    return [...contributors]
      .sort((a, b) => {
        const aScore = this.calculateScore(a);
        const bScore = this.calculateScore(b);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  calculateScore(contributor: Contributor): number {
    const prScore = contributor.impact.prsMerged * 10;
    const issueScore = contributor.impact.issuesClosed * 5;
    const reviewScore = contributor.impact.reviewsGiven * 2;
    const badgeBonus = contributor.badges.reduce((sum, b) => {
      const tierBonus: Record<string, number> = { bronze: 5, silver: 10, gold: 20, platinum: 50 };
      return sum + (tierBonus[b.tier] ?? 0);
    }, 0);

    return prScore + issueScore + reviewScore + badgeBonus;
  }

  generateRecognitionMessage(contributor: Contributor): string {
    const score = this.calculateScore(contributor);
    const topBadge = contributor.badges.sort((a, b) => {
      const order = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
      return order[a.tier] - order[b.tier];
    })[0];

    if (!topBadge) {
      return `Thanks @${contributor.authorname} for your contribution! Keep up the great work!`;
    }

    return `Amazing work @${contributor.authorname}! You've earned the ${topBadge.name} ${topBadge.icon} badge! (Score: ${score})`;
  }

  getProgressToNextBadge(contributor: Contributor): { next: Achievement; progress: number } | null {
    for (const achievement of this.achievements) {
      const hasBadge = contributor.badges.some(b => b.id === achievement.id);
      if (hasBadge) continue;

      let current = 0;
      switch (achievement.type) {
        case "prs": current = contributor.impact.prsMerged; break;
        case "issues": current = contributor.impact.issuesClosed; break;
        default: current = contributor.contributions;
      }

      return {
        next: achievement,
        progress: Math.min(100, Math.round((current / achievement.requirement) * 100)),
      };
    }

    return null;
  }
}
