/**
 * Maintainer Vacation Mode
 * Enable vacation/away mode to pause responsibilities
 */
export interface VacationMode {
  maintainer: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  coveragePlan: {
    issues: string;
    prs: string;
    emergencies: string;
  };
  autoResponseMessage: string;
}

export interface VacationSchedule {
  upcomingVacations: VacationMode[];
  coverageGaps: { startDate: Date; endDate: Date; uncoveredBy: string[] }[];
  recommendations: string[];
}

const sampleVacations: VacationMode[] = [
  {
    maintainer: "alice",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-14"),
    isActive: false,
    coveragePlan: {
      issues: "bob will handle triaging",
      prs: "carol will review",
      emergencies: "escalate to admin@example.com",
    },
    autoResponseMessage: "I'm on vacation until July 14. For urgent issues, please contact bob.",
  },
];

export function getVacationSchedule(): VacationSchedule {
  const now = new Date();
  const upcomingVacations = sampleVacations.filter(v => v.startDate > now);
  
  const coverageGaps = [];
  
  // Check for overlapping vacations
  for (let i = 0; i < upcomingVacations.length; i++) {
    for (let j = i + 1; j < upcomingVacations.length; j++) {
      const v1 = upcomingVacations[i];
      const v2 = upcomingVacations[j];
      
      // Check if dates overlap
      if (v1.startDate < v2.endDate && v2.startDate < v1.endDate) {
        coverageGaps.push({
          startDate: v1.startDate,
          endDate: v1.endDate,
          uncoveredBy: [v1.maintainer, v2.maintainer],
        });
      }
    }
  }

  const recommendations = [];
  if (coverageGaps.length > 0) {
    recommendations.push("Plan coverage for overlapping vacation periods");
  }
  if (upcomingVacations.length < 2) {
    recommendations.push("Encourage maintainers to schedule vacation in advance");
  }

  return {
    upcomingVacations,
    coverageGaps,
    recommendations,
  };
}

export function isMaintainerOnVacation(maintainer: string, date: Date = new Date()): VacationMode | null {
  return sampleVacations.find(v => 
    v.maintainer === maintainer && 
    v.startDate <= date && 
    v.endDate >= date &&
    v.isActive
  ) || null;
}
