/**
 * Contributor Mentorship Program
 * Pair new contributors with experienced mentors
 */
import type { MaintainerRepository as Repository } from "./types";

export interface MentorshipPair {
  mentor: string;
  mentee: string;
  startDate: Date;
  endDate?: Date;
  status: "active" | "completed" | "paused";
  goals: string[];
  progress: number;
}

export interface Mentor {
  username: string;
  mentees: string[];
  expertise: string[];
  availability: "high" | "medium" | "low";
  completedMentorships: number;
}

export interface MentorshipReport {
  repository: string;
  generatedAt: Date;
  activePairs: MentorshipPair[];
  availableMentors: Mentor[];
  programStats: {
    totalPairs: number;
    activePairs: number;
    completionRate: number;
    avgDuration: string;
  };
  recommendations: string[];
}

export function generateMentorshipReport(repository: Repository): MentorshipReport {
  const activePairs: MentorshipPair[] = [
    {
      mentor: "alice",
      mentee: "newdev1",
      startDate: new Date("2026-05-01"),
      status: "active",
      goals: ["Submit first PR", "Learn codebase structure", "Understand testing patterns"],
      progress: 60,
    },
    {
      mentor: "bob",
      mentee: "newdev2",
      startDate: new Date("2026-05-15"),
      status: "active",
      goals: ["Fix first bug", "Understand contribution workflow"],
      progress: 30,
    },
  ];

  const availableMentors: Mentor[] = [
    {
      username: "alice",
      mentees: ["newdev1"],
      expertise: ["Backend", "Testing", "Architecture"],
      availability: "high",
      completedMentorships: 5,
    },
    {
      username: "bob",
      mentees: ["newdev2"],
      expertise: ["Frontend", "UI/UX", "Documentation"],
      availability: "medium",
      completedMentorships: 3,
    },
    {
      username: "carol",
      mentees: [],
      expertise: ["Security", "DevOps", "Performance"],
      availability: "high",
      completedMentorships: 8,
    },
  ];

  const totalPairs = 15;
  const activeCount = 2;
  
  return {
    repository: repository.name,
    generatedAt: new Date(),
    activePairs,
    availableMentors,
    programStats: {
      totalPairs,
      activePairs: activeCount,
      completionRate: Math.floor(((totalPairs - activeCount) / totalPairs) * 100),
      avgDuration: "6 weeks",
    },
    recommendations: [
      "Recruit more mentors with security expertise",
      "Set up monthly mentorship check-ins",
      "Create mentorship completion certificate",
    ],
  };
}

export function matchMentor(menteeSkills: string[], mentors: Mentor[]): Mentor | null {
  for (const mentor of mentors) {
    if (mentor.availability === "low" || mentor.mentees.length >= 3) continue;
    const hasRelevantExpertise = mentor.expertise.some(e => 
      menteeSkills.some(s => s.toLowerCase().includes(e.toLowerCase()))
    );
    if (hasRelevantExpertise) return mentor;
  }
  return null;
}
