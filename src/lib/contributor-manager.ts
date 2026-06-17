/**
 * Contributor Manager - Manage and recognize project contributors
 */

export interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
  type: "user" | "bot" | "organization";
  joinedAt?: string;
  lastActiveAt?: number;
  tier: "new" | "active" | "regular" | "core" | "emeritus";
  badges: string[];
  skills: string[];
  contact?: string;
}

export interface ContributorMetrics {
  totalContributors: number;
  activeContributors: number;
  byTier: Record<string, number>;
  topContributors: Contributor[];
  recentlyActive: Contributor[];
  newContributors: Contributor[];
}

export interface Recognition {
  id: string;
  contributor: string;
  type: "star" | "champion" | "mentor" | "helper" | "first-contribution";
  message: string;
  givenBy: string;
  timestamp: number;
}

export class ContributorManager {
  private contributors: Map<string, Contributor> = new Map();
  private recognitions: Recognition[] = [];
  private inactivityThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days

  addContributor(data: Omit<Contributor, "tier" | "badges">): void {
    const existing = this.contributors.get(data.login);
    const tier = this.calculateTier(data.contributions, existing?.lastActiveAt);

    this.contributors.set(data.login, {
      ...data,
      tier,
      badges: existing?.badges || [],
    });
  }

  private calculateTier(contributions: number, lastActive?: number): Contributor["tier"] {
    if (contributions < 5) return "new";
    if (contributions < 20) return "active";
    if (contributions < 100) return "regular";
    if (contributions < 500) return "core";
    return "emeritus";
  }

  updateActivity(login: string): void {
    const contributor = this.contributors.get(login);
    if (contributor) {
      contributor.lastActiveAt = Date.now();
      contributor.tier = this.calculateTier(contributor.contributions, contributor.lastActiveAt);
    }
  }

  incrementContributions(login: string): void {
    const contributor = this.contributors.get(login);
    if (contributor) {
      contributor.contributions++;
      contributor.lastActiveAt = Date.now();
      contributor.tier = this.calculateTier(contributor.contributions, contributor.lastActiveAt);
    }
  }

  addBadge(login: string, badge: string): void {
    const contributor = this.contributors.get(login);
    if (contributor && !contributor.badges.includes(badge)) {
      contributor.badges.push(badge);
    }
  }

  recognize(contributor: string, type: Recognition["type"], message: string, givenBy = "system"): Recognition {
    const recognition: Recognition = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      contributor,
      type,
      message,
      givenBy,
      timestamp: Date.now(),
    };

    this.recognitions.unshift(recognition);

    // Auto-add badges based on recognition type
    const badgeMap: Record<string, string> = {
      star: "⭐ Star Contributor",
      champion: "🏆 Champion",
      mentor: "🎓 Mentor",
      helper: "💪 Helpful",
      "first-contribution": "🌟 First Contribution",
    };
    this.addBadge(contributor, badgeMap[type] || type);

    return recognition;
  }

  getContributor(login: string): Contributor | undefined {
    return this.contributors.get(login);
  }

  getAllContributors(): Contributor[] {
    return Array.from(this.contributors.values()).sort((a, b) => b.contributions - a.contributions);
  }

  getMetrics(): ContributorMetrics {
    const all = this.getAllContributors();
    const now = Date.now();

    const byTier: Record<string, number> = {};
    let activeContributors = 0;

    for (const c of all) {
      byTier[c.tier] = (byTier[c.tier] || 0) + 1;
      if (c.lastActiveAt && now - c.lastActiveAt < this.inactivityThreshold) {
        activeContributors++;
      }
    }

    return {
      totalContributors: all.length,
      activeContributors,
      byTier,
      topContributors: all.slice(0, 10),
      recentlyActive: all
        .filter((c) => c.lastActiveAt && now - c.lastActiveAt < this.inactivityThreshold)
        .sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0))
        .slice(0, 10),
      newContributors: all.filter((c) => c.tier === "new").slice(0, 10),
    };
  }

  getRecognitions(contributor?: string): Recognition[] {
    if (contributor) {
      return this.recognitions.filter((r) => r.contributor === contributor);
    }
    return this.recognitions;
  }

  getInactiveContributors(): Contributor[] {
    const now = Date.now();
    return this.getAllContributors().filter(
      (c) => c.lastActiveAt && now - c.lastActiveAt > this.inactivityThreshold
    );
  }

  findContributorsBySkill(skill: string): Contributor[] {
    return this.getAllContributors().filter((c) => c.skills.includes(skill));
  }

  exportContributors(): string {
    return JSON.stringify(Array.from(this.contributors.values()), null, 2);
  }
}
