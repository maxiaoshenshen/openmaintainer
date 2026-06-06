/**
 * Maintainer Streak Tracker
 * Track maintainer activity streaks and engagement
 */

import type { MaintainerRepository } from "./types";

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  activityHistory: ActivityDay[];
  totalActiveDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
  badges: StreakBadge[];
};

export type ActivityDay = {
  date: string;
  actions: number;
  type: "maintenance" | "review" | "release" | "community";
};

export type StreakBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
};

export function calculateStreak(
  repo: MaintainerRepository,
  savedStreak?: StreakData
): StreakData {
  const now = new Date();
  const activityHistory: ActivityDay[] = [];
  
  // Calculate activity from issues and PRs
  const activityDates = new Map<string, number>();
  
  [...repo.issues, ...repo.pullRequests].forEach(item => {
    const date = new Date(item.updatedAt || item.createdAt).toISOString().split("T")[0];
    activityDates.set(date, (activityDates.get(date) || 0) + 1);
  });
  
  // Build activity history for last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const actions = activityDates.get(dateStr) || 0;
    
    if (actions > 0) {
      let type: ActivityDay["type"] = "maintenance";
      if (actions > 10) type = "review";
      else if (actions > 5) type = "community";
      
      activityHistory.push({ date: dateStr, actions, type });
    }
  }
  
  // Calculate current streak
  let currentStreak = 0;
  const today = now.toISOString().split("T")[0];
  let checkDate = new Date(now);
  
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const hasActivity = activityDates.has(dateStr) || activityHistory.some(d => d.date === dateStr);
    
    if (hasActivity) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    } else if (dateStr === today) {
      // Today might not have activity yet
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
    
    if (currentStreak > 365) break; // Safety limit
  }
  
  // Calculate longest streak
  const savedStreakValue = savedStreak?.longestStreak || 0;
  const longestStreak = Math.max(currentStreak, savedStreakValue, calculateHistoricalLongest(activityHistory));
  
  // Calculate last activity
  const lastActivity = activityHistory.length > 0 
    ? activityHistory[activityHistory.length - 1].date 
    : today;
  
  // Calculate weekly progress
  const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const weeklyActiveDays = activityHistory.filter(d => new Date(d.date) >= weekStart).length;
  
  return {
    currentStreak,
    longestStreak,
    lastActivityDate: lastActivity,
    activityHistory,
    totalActiveDays: activityDates.size,
    weeklyGoal: 5,
    weeklyProgress: weeklyActiveDays,
    badges: generateStreakBadges(currentStreak, longestStreak)
  };
}

function calculateHistoricalLongest(history: ActivityDay[]): number {
  if (history.length === 0) return 0;
  
  let longest = 1;
  let current = 1;
  
  for (let i = 1; i < history.length; i++) {
    const prevDate = new Date(history[i - 1].date);
    const currDate = new Date(history[i].date);
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  
  return longest;
}

function generateStreakBadges(current: number, longest: number): StreakBadge[] {
  const badges: StreakBadge[] = [
    {
      id: "first-week",
      name: "First Week",
      description: "7 day streak",
      icon: "fire",
      unlocked: longest >= 7
    },
    {
      id: "two-weeks",
      name: "Consistent",
      description: "14 day streak",
      icon: "flame",
      unlocked: longest >= 14
    },
    {
      id: "monthly",
      name: "Monthly Hero",
      description: "30 day streak",
      icon: "trophy",
      unlocked: longest >= 30
    },
    {
      id: "quarterly",
      name: "Quarterly Champion",
      description: "90 day streak",
      icon: "crown",
      unlocked: longest >= 90
    },
    {
      id: "half-year",
      name: "Half Year Legend",
      description: "180 day streak",
      icon: "star",
      unlocked: longest >= 180
    },
    {
      id: "year",
      name: "Full Year Master",
      description: "365 day streak",
      icon: "diamond",
      unlocked: longest >= 365
    },
    {
      id: "active-week",
      name: "This Week",
      description: "Active today",
      icon: "check",
      unlocked: current > 0
    }
  ];
  
  return badges;
}

export function formatStreakMessage(streak: StreakData): string {
  if (streak.currentStreak === 0) {
    return "Start your maintenance streak today!";
  }
  
  if (streak.currentStreak === 1) {
    return "Day 1! Keep it going!";
  }
  
  if (streak.currentStreak < 7) {
    return `${streak.currentStreak} day streak! Building momentum.`;
  }
  
  if (streak.currentStreak < 30) {
    return `${streak.currentStreak} day streak! You're on fire!`;
  }
  
  if (streak.currentStreak < 100) {
    return `${streak.currentStreak} days! True dedication!`;
  }
  
  return `${streak.currentStreak} days! You're a maintenance legend!`;
}

export function getStreakEmoji(streak: number): string {
  if (streak === 0) return "💤";
  if (streak < 3) return "🌱";
  if (streak < 7) return "🔥";
  if (streak < 14) return "⚡";
  if (streak < 30) return "🌟";
  if (streak < 90) return "🏆";
  if (streak < 365) return "👑";
  return "💎";
}
