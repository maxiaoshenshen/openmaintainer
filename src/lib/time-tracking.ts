export interface TimeEntry {
  id: string;
  issueId?: string;
  prId?: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  category: 'development' | 'review' | 'documentation' | 'meeting' | 'other';
  description?: string;
}

export interface SprintTimeAllocation {
  sprintId: string;
  totalHours: number;
  byCategory: Record<string, number>;
  byContributor: Record<string, number>;
  velocity: number;
}

export interface TimeReport {
  period: { start: Date; end: Date };
  totalHours: number;
  entries: TimeEntry[];
  byCategory: Record<string, number>;
  byContributor: Record<string, number>;
  dailyAverage: number;
}

export interface BurndownPoint {
  date: Date;
  planned: number;
  actual: number;
  remaining: number;
}

export function createTimeEntry(
  userId: string,
  category: TimeEntry['category'],
  duration: number,
  description?: string
): TimeEntry {
  const startTime = new Date(Date.now() - duration * 60 * 60 * 1000);
  return {
    id: `time-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    startTime,
    endTime: new Date(),
    duration,
    category,
    description
  };
}

export function calculateSprintAllocation(entries: TimeEntry[], sprintId: string): SprintTimeAllocation {
  const sprintEntries = entries.filter(e => e.issueId?.includes(sprintId));
  
  const byCategory: Record<string, number> = {};
  const byContributor: Record<string, number> = {};
  
  sprintEntries.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.duration;
    byContributor[e.userId] = (byContributor[e.userId] || 0) + e.duration;
  });

  const totalHours = sprintEntries.reduce((sum, e) => sum + e.duration, 0);
  const velocity = totalHours > 0 ? sprintEntries.length / (totalHours / 8) : 0;

  return {
    sprintId,
    totalHours,
    byCategory,
    byContributor,
    velocity: Math.round(velocity * 100) / 100
  };
}

export function generateTimeReport(
  entries: TimeEntry[],
  startDate: Date,
  endDate: Date
): TimeReport {
  const filtered = entries.filter(e => e.startTime >= startDate && e.startTime <= endDate);
  
  const byCategory: Record<string, number> = {};
  const byContributor: Record<string, number> = {};
  
  filtered.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.duration;
    byContributor[e.userId] = (byContributor[e.userId] || 0) + e.duration;
  });

  const totalHours = filtered.reduce((sum, e) => sum + e.duration, 0);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const dailyAverage = days > 0 ? totalHours / days : 0;

  return {
    period: { start: startDate, end: endDate },
    totalHours,
    entries: filtered,
    byCategory,
    byContributor,
    dailyAverage: Math.round(dailyAverage * 100) / 100
  };
}

export function calculateBurndown(
  totalPoints: number,
  entries: TimeEntry[],
  sprintStart: Date,
  sprintEnd: Date
): BurndownPoint[] {
  const points: BurndownPoint[] = [];
  const totalDays = Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (24 * 60 * 60 * 1000));
  const dailyIdealBurn = totalPoints / totalDays;
  
  let remaining = totalPoints;
  const now = new Date();

  for (let i = 0; i <= totalDays; i++) {
    const date = new Date(sprintStart.getTime() + i * 24 * 60 * 60 * 1000);
    const planned = Math.max(0, totalPoints - dailyIdealBurn * i);
    const completed = entries
      .filter(e => e.startTime <= date && e.endTime && e.endTime >= sprintStart)
      .length * 3;
    
    points.push({
      date,
      planned: Math.round(planned * 10) / 10,
      actual: Math.max(0, remaining - completed),
      remaining: Math.max(0, remaining - completed)
    });
  }

  return points;
}

export function estimateCompletionTime(
  remainingPoints: number,
  recentVelocity: number
): Date {
  const daysNeeded = recentVelocity > 0 ? remainingPoints / recentVelocity : 999;
  return new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000);
}

export function getProductivityScore(report: TimeReport): number {
  const categoryWeights: Record<string, number> = {
    development: 1.0,
    review: 0.8,
    documentation: 0.6,
    meeting: 0.4,
    other: 0.3
  };

  let weightedScore = 0;
  let totalHours = 0;

  Object.entries(report.byCategory).forEach(([category, hours]) => {
    weightedScore += hours * (categoryWeights[category] || 0.5);
    totalHours += hours;
  });

  return totalHours > 0 ? Math.round((weightedScore / totalHours) * 100) : 0;
}
