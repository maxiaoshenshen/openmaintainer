/**
 * Issue Lifecycle Manager
 * Track and manage issue lifecycle stages
 */
export type IssueStage = "new" | "triaged" | "ready" | "in-progress" | "resolved" | "closed";

export interface StageTransition {
  from: IssueStage;
  to: IssueStage;
  timestamp: Date;
  actor: string;
  note?: string;
}

export interface IssueLifecycle {
  issueId: string;
  title: string;
  currentStage: IssueStage;
  transitions: StageTransition[];
  stageAges: Record<IssueStage, number>; // hours spent in each stage
  expectedResolution?: Date;
}

export interface LifecycleReport {
  generatedAt: Date;
  issuesByStage: Record<IssueStage, number>;
  avgTimeInStage: Record<IssueStage, number>;
  bottlenecks: { stage: IssueStage; avgHours: number }[];
  recommendations: string[];
}

const sampleLifecycle: IssueLifecycle[] = [
  {
    issueId: "#123",
    title: "Bug in login flow",
    currentStage: "in-progress",
    transitions: [
      { from: "new", to: "triaged", timestamp: new Date("2026-06-01"), actor: "triager" },
      { from: "triaged", to: "ready", timestamp: new Date("2026-06-02"), actor: "maintainer" },
      { from: "ready", to: "in-progress", timestamp: new Date("2026-06-03"), actor: "contributor" },
    ],
    stageAges: { new: 2, triaged: 24, ready: 48, "in-progress": 12, resolved: 0, closed: 0 },
  },
];

export function generateLifecycleReport(): LifecycleReport {
  const issuesByStage: Record<IssueStage, number> = {
    new: 15,
    triaged: 8,
    ready: 12,
    "in-progress": 6,
    resolved: 45,
    closed: 120,
  };

  const avgTimeInStage: Record<IssueStage, number> = {
    new: 4,
    triaged: 36,
    ready: 72,
    "in-progress": 48,
    resolved: 2,
    closed: 0,
  };

  const bottlenecks = Object.entries(avgTimeInStage)
    .filter(([, hours]) => hours > 48)
    .map(([stage, hours]) => ({ stage: stage as IssueStage, avgHours: hours }));

  const recommendations = [
    bottlenecks.some(b => b.stage === "ready") ? "Review 'ready' stage - issues waiting too long" : "Stage timing looks good",
    "Consider automated triaging for duplicate issues",
    "Add labels to track issue priority",
  ];

  return {
    generatedAt: new Date(),
    issuesByStage,
    avgTimeInStage,
    bottlenecks,
    recommendations,
  };
}

export function getTimeInCurrentStage(issue: IssueLifecycle): number {
  const lastTransition = issue.transitions[issue.transitions.length - 1];
  const hoursInStage = (Date.now() - lastTransition.timestamp.getTime()) / (1000 * 60 * 60);
  return Math.floor(hoursInStage);
}
