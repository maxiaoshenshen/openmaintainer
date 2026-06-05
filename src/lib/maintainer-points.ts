// Maintainer Points & Reputation System
export interface MaintainerPoints {
  totalPoints: number;
  rank: "Newcomer" | "Contributor" | "Reviewer" | "Maintainer" | "Veteran" | "Legend";
  badges: string[];
  level: number;
  progressToNextLevel: number;
  achievements: Achievement[];
  weeklyStats: WeeklyStats;
  allTimeStats: AllTimeStats;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  points: number;
}

export interface WeeklyStats {
  prsMerged: number;
  issuesClosed: number;
  reviewsGiven: number;
  responsesGiven: number;
}

export interface AllTimeStats {
  totalPrsMerged: number;
  totalIssuesClosed: number;
  totalReviewsGiven: number;
  totalResponsesGiven: number;
  yearsActive: number;
}

const POINTS_PER_PR_MERGED = 10;
const POINTS_PER_ISSUE_CLOSED = 5;
const POINTS_PER_REVIEW = 3;
const POINTS_PER_RESPONSE = 1;

const RANK_THRESHOLDS = {
  Newcomer: 0,
  Contributor: 100,
  Reviewer: 500,
  Maintainer: 1000,
  Veteran: 5000,
  Legend: 20000,
};

const ACHIEVEMENTS = [
  { id: "first-pr", name: "First PR Merged", description: "Merged your first pull request", icon: "🎉", points: 50 },
  { id: "first-issue", name: "First Issue Resolved", description: "Closed your first issue", icon: "✅", points: 25 },
  { id: "help-100", name: "Community Helper", description: "Responded to 100 items", icon: "💬", points: 100 },
  { id: "review-50", name: "Code Reviewer", description: "Given 50 reviews", icon: "🔍", points: 75 },
  { id: "consistent", name: "Consistent Contributor", description: "Contributed for 30 consecutive days", icon: "🔥", points: 200 },
  { id: "open-source-champion", name: "Open Source Champion", description: "Total 1000 points earned", icon: "🏆", points: 500 },
  { id: "mentor", name: "Mentor", description: "Helped 10 new contributors", icon: "🌟", points: 150 },
  { id: "speed-demon", name: "Speed Demon", description: "Average response time under 1 hour", icon: "⚡", points: 100 },
];

export function calculateRank(points: number): { rank: MaintainerPoints["rank"]; level: number; progress: number } {
  if (points >= RANK_THRESHOLDS.Legend) {
    return { rank: "Legend", level: 6, progress: 100 };
  }
  if (points >= RANK_THRESHOLDS.Veteran) {
    const progress = ((points - RANK_THRESHOLDS.Veteran) / (RANK_THRESHOLDS.Legend - RANK_THRESHOLDS.Veteran)) * 100;
    return { rank: "Veteran", level: 5, progress };
  }
  if (points >= RANK_THRESHOLDS.Maintainer) {
    const progress = ((points - RANK_THRESHOLDS.Maintainer) / (RANK_THRESHOLDS.Veteran - RANK_THRESHOLDS.Maintainer)) * 100;
    return { rank: "Maintainer", level: 4, progress };
  }
  if (points >= RANK_THRESHOLDS.Reviewer) {
    const progress = ((points - RANK_THRESHOLDS.Reviewer) / (RANK_THRESHOLDS.Maintainer - RANK_THRESHOLDS.Reviewer)) * 100;
    return { rank: "Reviewer", level: 3, progress };
  }
  if (points >= RANK_THRESHOLDS.Contributor) {
    const progress = ((points - RANK_THRESHOLDS.Contributor) / (RANK_THRESHOLDS.Reviewer - RANK_THRESHOLDS.Contributor)) * 100;
    return { rank: "Contributor", level: 2, progress };
  }
  return { rank: "Newcomer", level: 1, progress: (points / RANK_THRESHOLDS.Contributor) * 100 };
}

export function calculatePoints(
  weeklyStats: WeeklyStats,
  allTimeStats: AllTimeStats
): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    "PRs Merged": weeklyStats.prsMerged * POINTS_PER_PR_MERGED,
    "Issues Closed": weeklyStats.issuesClosed * POINTS_PER_ISSUE_CLOSED,
    "Reviews Given": weeklyStats.reviewsGiven * POINTS_PER_REVIEW,
    "Responses Given": weeklyStats.responsesGiven * POINTS_PER_RESPONSE,
  };

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { total, breakdown };
}

export function checkAchievements(
  allTimeStats: AllTimeStats,
  earnedAchievements: string[],
  averageResponseTime: number
): Achievement[] {
  const newAchievements: Achievement[] = [];
  const now = new Date().toISOString();

  const checkAndAdd = (id: string, condition: boolean) => {
    if (condition && !earnedAchievements.includes(id)) {
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        newAchievements.push({ ...achievement, earnedAt: now });
      }
    }
  };

  checkAndAdd("first-pr", allTimeStats.totalPrsMerged >= 1);
  checkAndAdd("first-issue", allTimeStats.totalIssuesClosed >= 1);
  checkAndAdd("help-100", allTimeStats.totalResponsesGiven >= 100);
  checkAndAdd("review-50", allTimeStats.totalReviewsGiven >= 50);
  checkAndAdd("speed-demon", averageResponseTime < 3600); // < 1 hour in seconds
  checkAndAdd("open-source-champion", allTimeStats.totalPrsMerged >= 100);
  checkAndAdd("mentor", allTimeStats.totalResponsesGiven >= 50);
  checkAndAdd("consistent", allTimeStats.yearsActive >= 1);

  return newAchievements;
}

export function buildMaintainerPoints(
  weeklyStats: WeeklyStats,
  allTimeStats: AllTimeStats,
  earnedAchievements: string[] = [],
  averageResponseTime: number = 86400
): MaintainerPoints {
  const { total, breakdown } = calculatePoints(weeklyStats, allTimeStats);
  const { rank, level, progress } = calculateRank(total);
  const newAchievements = checkAchievements(allTimeStats, earnedAchievements, averageResponseTime);
  
  const allAchievements = [
    ...earnedAchievements.map(id => {
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      return achievement ? { ...achievement, earnedAt: new Date().toISOString() } : null;
    }).filter(Boolean) as Achievement[],
    ...newAchievements,
  ];

  return {
    totalPoints: total,
    rank,
    badges: getRankBadges(rank),
    level,
    progressToNextLevel: Math.min(progress, 100),
    achievements: allAchievements,
    weeklyStats,
    allTimeStats,
  };
}

function getRankBadges(rank: MaintainerPoints["rank"]): string[] {
  const badges: Record<MaintainerPoints["rank"], string[]> = {
    Newcomer: ["🌱"],
    Contributor: ["🌱", "⭐"],
    Reviewer: ["🌱", "⭐", "🔧"],
    Maintainer: ["🌱", "⭐", "🔧", "🛡️"],
    Veteran: ["🌱", "⭐", "🔧", "🛡️", "🏅"],
    Legend: ["🌱", "⭐", "🔧", "🛡️", "🏅", "👑"],
  };
  return badges[rank];
}

export function formatPoints(points: number): string {
  if (points >= 10000) {
    return `${(points / 10000).toFixed(1)}k`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return points.toString();
}

export function getRankColor(rank: MaintainerPoints["rank"]): string {
  const colors: Record<MaintainerPoints["rank"], string> = {
    Newcomer: "text-gray-400",
    Contributor: "text-green-400",
    Reviewer: "text-blue-400",
    Maintainer: "text-purple-400",
    Veteran: "text-orange-400",
    Legend: "text-yellow-400",
  };
  return colors[rank];
}
