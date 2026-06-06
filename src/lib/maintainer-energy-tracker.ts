// Maintainer Energy Tracker for OpenMaintainer
// Tracks energy levels and suggests work patterns

import type { Repository } from './types';

export interface EnergyLevel {
  level: 'high' | 'medium' | 'low' | 'depleted';
  score: number; // 0-100
  factors: string[];
}

export interface WorkSession {
  startTime: Date;
  endTime?: Date;
  type: 'review' | 'code' | 'documentation' | 'community';
  energyLevel: EnergyLevel;
  tasks: string[];
}

export interface WeeklyPattern {
  dayOfWeek: number;
  averageEnergy: number;
  peakHours: number[];
  recommendedTasks: string[];
}

export interface EnergyRecommendation {
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
}

export interface EnergyReport {
  currentEnergy: EnergyLevel;
  weeklyPatterns: WeeklyPattern[];
  recommendations: EnergyRecommendation[];
  sessions: WorkSession[];
  sustainablePace: {
    maxSessionsPerDay: number;
    recommendedBreakMinutes: number;
    warningThreshold: number;
  };
}

class EnergyTracker {
  private sessions: WorkSession[] = [];
  private energyHistory: EnergyLevel[] = [];

  recordSession(session: Omit<WorkSession, 'energyLevel'>): WorkSession {
    const energyLevel = this.calculateCurrentEnergy();
    const fullSession: WorkSession = { ...session, energyLevel };
    this.sessions.push(fullSession);
    return fullSession;
  }

  private calculateCurrentEnergy(): EnergyLevel {
    const recentSessions = this.sessions.slice(-5);
    if (recentSessions.length === 0) {
      return { level: 'high', score: 100, factors: ['Fresh start'] };
    }

    const avgScore = recentSessions.reduce((sum, s) => sum + s.energyLevel.score, 0) / recentSessions.length;
    const sessionCount = recentSessions.length;
    const timeSinceLastBreak = this.getTimeSinceLastBreak();
    
    let score = Math.min(100, avgScore - (sessionCount * 5) + (timeSinceLastBreak / 60));
    score = Math.max(0, Math.min(100, score));

    const factors: string[] = [];
    if (sessionCount > 4) factors.push('Multiple sessions today');
    if (timeSinceLastBreak > 120) factors.push('Long time since break');
    if (score > 80) factors.push('High productivity potential');
    if (score < 40) factors.push('Consider taking a break');

    return {
      level: score > 80 ? 'high' : score > 50 ? 'medium' : score > 20 ? 'low' : 'depleted',
      score: Math.round(score),
      factors,
    };
  }

  private getTimeSinceLastBreak(): number {
    const now = Date.now();
    const lastSession = this.sessions[this.sessions.length - 1];
    if (!lastSession?.endTime) return 0;
    return (now - lastSession.endTime.getTime()) / (1000 * 60);
  }

  analyzeWeeklyPatterns(): WeeklyPattern[] {
    const patterns: WeeklyPattern[] = [];
    
    for (let day = 0; day < 7; day++) {
      const daySessions = this.sessions.filter(s => s.startTime.getDay() === day);
      const avgEnergy = daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + s.energyLevel.score, 0) / daySessions.length
        : 75; // Default for new days

      patterns.push({
        dayOfWeek: day,
        averageEnergy: Math.round(avgEnergy),
        peakHours: this.calculatePeakHours(daySessions),
        recommendedTasks: this.getRecommendedTasks(day),
      });
    }

    return patterns;
  }

  private calculatePeakHours(sessions: WorkSession[]): number[] {
    if (sessions.length === 0) return [9, 10, 14, 15];
    
    const hourCounts = new Map<number, number>();
    sessions.forEach(s => {
      const hour = s.startTime.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const sortedHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    return sortedHours.length > 0 ? sortedHours : [9, 10, 14];
  }

  private getRecommendedTasks(dayOfWeek: number): string[] {
    const taskMap: Record<number, string[]> = {
      0: ['Code review', 'Documentation'], // Sunday
      1: ['Planning', 'Complex features'], // Monday
      2: ['Feature development', 'Testing'], // Tuesday
      3: ['Community engagement', 'Issue triage'], // Wednesday
      4: ['Feature development', 'Code review'], // Thursday
      5: ['Release prep', 'Documentation'], // Friday
      6: ['Rest', 'Light contributions'], // Saturday
    };
    return taskMap[dayOfWeek] || ['General tasks'];
  }

  generateRecommendations(): EnergyRecommendation[] {
    const currentEnergy = this.calculateCurrentEnergy();
    const recommendations: EnergyRecommendation[] = [];
    const today = new Date().getDay();

    // Energy-based recommendations
    if (currentEnergy.score < 30) {
      recommendations.push({
        action: 'Take a 15-minute break',
        reason: 'Energy level is low. A short break can help restore focus.',
        priority: 'high',
        estimatedMinutes: 15,
      });
    }

    if (currentEnergy.score > 80) {
      recommendations.push({
        action: 'Tackle challenging tasks',
        reason: 'High energy! This is a good time for complex work.',
        priority: 'high',
        estimatedMinutes: 120,
      });
    }

    // Day-based recommendations
    if (today === 1) {
      recommendations.push({
        action: 'Review weekly goals',
        reason: 'Monday is a good day for planning the week ahead.',
        priority: 'medium',
        estimatedMinutes: 30,
      });
    }

    if (today === 5) {
      recommendations.push({
        action: 'Prepare release notes',
        reason: 'Friday is ideal for release preparation and documentation.',
        priority: 'medium',
        estimatedMinutes: 60,
      });
    }

    // Pattern-based recommendations
    const yesterday = this.sessions.filter(s => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return s.startTime.toDateString() === d.toDateString();
    });

    if (yesterday.length > 10) {
      recommendations.push({
        action: 'Pace yourself today',
        reason: 'You had many sessions yesterday. Consider a lighter workload.',
        priority: 'medium',
        estimatedMinutes: 0,
      });
    }

    return recommendations;
  }

  generateFullReport(): EnergyReport {
    return {
      currentEnergy: this.calculateCurrentEnergy(),
      weeklyPatterns: this.analyzeWeeklyPatterns(),
      recommendations: this.generateRecommendations(),
      sessions: this.sessions.slice(-20),
      sustainablePace: {
        maxSessionsPerDay: 6,
        recommendedBreakMinutes: 15,
        warningThreshold: 8,
      },
    };
  }

  getStreak(): { current: number; longest: number } {
    let current = 0;
    let longest = 0;
    let streak = 0;

    const sortedDates = [...new Set(this.sessions.map(s => s.startTime.toDateString()))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null;
      
      if (i === 0) {
        // Check if today or yesterday
        const today = new Date();
        const diff = today.getTime() - currentDate.getTime();
        if (diff < 48 * 60 * 60 * 1000) {
          streak = 1;
        }
      }

      if (prevDate) {
        const diff = prevDate.getTime() - currentDate.getTime();
        if (diff < 48 * 60 * 60 * 1000) {
          streak++;
        } else {
          streak = 1;
        }
      }

      longest = Math.max(longest, streak);
      if (i === 0) current = streak;
    }

    return { current, longest };
  }
}

export const energyTracker = new EnergyTracker();

export function createEnergyTracker(): EnergyTracker {
  return new EnergyTracker();
}

export { EnergyTracker };
