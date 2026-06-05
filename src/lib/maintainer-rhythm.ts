import type { MaintainerRepository, MaintainerAnalysis } from "./types";

export type RhythmType = "daily" | "weekly" | "biweekly" | "monthly";
export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface RhythmTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  category: "review" | "triage" | "release" | "community" | "maintenance";
  completed: boolean;
}

export interface MaintainerRhythm {
  type: RhythmType;
  date: string;
  tasks: RhythmTask[];
  focusBlocks: FocusBlock[];
  tips: string[];
}

export interface FocusBlock {
  start: string;
  end: string;
  activity: string;
  energyLevel: "high" | "medium" | "low";
}

export interface DailyRhythmPlan {
  morning: RhythmTask[];
  afternoon: RhythmTask[];
  evening: RhythmTask[];
  focusWindows: FocusBlock[];
  dailyTip: string;
}

export interface WeeklyRhythmReport {
  weekOf: string;
  completed: number;
  pending: number;
  productivity: number; // percentage
  patterns: string[];
  recommendations: string[];
}

function generateDailyTasks(repo: MaintainerRepository, analysis: MaintainerAnalysis): RhythmTask[] {
  const tasks: RhythmTask[] = [];
  
  // Triage tasks - critical
  if (analysis.inbox.urgentIssues.length > 0) {
    tasks.push({
      id: "triage-urgent",
      title: `Triage ${analysis.inbox.urgentIssues.length} urgent issues`,
      description: "Review and categorize issues flagged as urgent priority",
      priority: "critical",
      estimatedMinutes: 30,
      category: "triage",
      completed: false,
    });
  }
  
  if (analysis.inbox.questions.length > 0) {
    tasks.push({
      id: "respond-questions",
      title: `Respond to ${analysis.inbox.questions.length} questions`,
      description: "Reply to community questions within SLA",
      priority: "high",
      estimatedMinutes: 20 * Math.min(analysis.inbox.questions.length, 5),
      category: "community",
      completed: false,
    });
  }
  
  // Review tasks
  if (analysis.inbox.reviewRequests.length > 0) {
    tasks.push({
      id: "review-prs",
      title: `Review ${analysis.inbox.reviewRequests.length} PRs`,
      description: "Review pending pull requests in the queue",
      priority: "high",
      estimatedMinutes: 45,
      category: "review",
      completed: false,
    });
  }
  
  // Maintenance tasks
  if (analysis.sla.overdue > 0) {
    tasks.push({
      id: "clear-sla",
      title: `Clear ${analysis.sla.overdue} overdue SLA items`,
      description: "Address contributor threads that have exceeded response time",
      priority: "high",
      estimatedMinutes: 25 * analysis.sla.overdue,
      category: "community",
      completed: false,
    });
  }
  
  // Starter kit promotion
  if (analysis.starterKit && analysis.starterKit.issues && analysis.starterKit.issues.length > 0 && analysis.starterKit.issues.length < 3) {
    tasks.push({
      id: "promote-starters",
      title: "Refresh starter issues",
      description: "Review and update good-first-issue labels",
      priority: "medium",
      estimatedMinutes: 15,
      category: "community",
      completed: false,
    });
  }
  
  return tasks;
}

export function generateDailyRhythm(
  repo: MaintainerRepository,
  analysis: MaintainerAnalysis
): DailyRhythmPlan {
  const tasks = generateDailyTasks(repo, analysis);
  
  // Sort by priority
  tasks.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
  
  // Assign to time blocks based on priority and energy requirements
  const morning: RhythmTask[] = [];
  const afternoon: RhythmTask[] = [];
  const evening: RhythmTask[] = [];
  
  for (const task of tasks) {
    if (task.priority === "critical" || task.priority === "high") {
      morning.push(task);
    } else if (task.category === "review") {
      afternoon.push(task); // Reviews need fresh eyes
    } else {
      evening.push(task);
    }
  }
  
  return {
    morning,
    afternoon,
    evening,
    focusWindows: [
      {
        start: "09:00",
        end: "11:30",
        activity: "Deep work: reviews and complex triage",
        energyLevel: "high",
      },
      {
        start: "14:00",
        end: "16:00",
        activity: "Reviews and community responses",
        energyLevel: "medium",
      },
      {
        start: "20:00",
        end: "21:00",
        activity: "Light triage and planning",
        energyLevel: "low",
      },
    ],
    dailyTip: getDailyTip(tasks),
  };
}

function getDailyTip(tasks: RhythmTask[]): string {
  const criticalCount = tasks.filter((t) => t.priority === "critical").length;
  const reviewCount = tasks.filter((t) => t.category === "review").length;
  
  if (criticalCount > 0) {
    return "Focus on critical items first. Clear your inbox before starting anything else.";
  }
  if (reviewCount > 2) {
    return "Batch similar reviews together to maintain context and move faster.";
  }
  return "Keep responses concise and actionable. A quick reply is better than a perfect one.";
}

export function generateWeeklyRhythm(
  repo: MaintainerRepository,
  analysis: MaintainerAnalysis
): WeeklyRhythmReport {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  
  const patterns: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze patterns
  if (analysis.health.score > 80) {
    patterns.push("Repository health is strong this week");
  } else if (analysis.health.score < 50) {
    patterns.push("Repository needs attention - consider dedicated cleanup session");
    recommendations.push("Schedule a 2-hour maintenance block this week");
  }
  
  if (analysis.sla.overdue > 3) {
    patterns.push(`${analysis.sla.overdue} threads exceeded SLA`);
    recommendations.push("Prioritize clearing SLA backlog before new work");
  }
  
  if (repo.pullRequests.length > 10) {
    patterns.push("PR queue is growing - consider async review strategy");
    recommendations.push("Batch review similar PRs together");
  }
  
  return {
    weekOf: weekStart.toISOString().split("T")[0],
    completed: 0, // Would track from history
    pending: analysis.inbox.total,
    productivity: calculateProductivity(analysis),
    patterns,
    recommendations,
  };
}

function calculateProductivity(analysis: MaintainerAnalysis): number {
  // Simplified productivity score
  const base = 50;
  const inboxBonus = Math.max(0, 20 - analysis.inbox.total);
  const slaBonus = Math.max(0, 20 - analysis.sla.overdue * 5);
  const healthBonus = Math.floor(analysis.health.score / 5);
  
  return Math.min(100, base + inboxBonus + slaBonus + healthBonus);
}

export function formatRhythmAsMarkdown(plan: DailyRhythmPlan): string {
  let md = "## Today's Maintainer Rhythm\n\n";
  
  md += "### Morning Focus (High Energy)\n";
  if (plan.morning.length === 0) {
    md += "- ✅ No critical tasks - enjoy a relaxed start!\n";
  } else {
    for (const task of plan.morning) {
      md += `- [ ] **${task.title}** (${task.estimatedMinutes}min)\n`;
      md += `  ${task.description}\n`;
    }
  }
  
  md += "\n### Afternoon (Reviews & Community)\n";
  if (plan.afternoon.length === 0) {
    md += "- ✅ No pending reviews\n";
  } else {
    for (const task of plan.afternoon) {
      md += `- [ ] **${task.title}** (${task.estimatedMinutes}min)\n`;
    }
  }
  
  md += "\n### Evening (Light Tasks)\n";
  if (plan.evening.length === 0) {
    md += "- ✅ Day complete!\n";
  } else {
    for (const task of plan.evening) {
      md += `- [ ] **${task.title}** (${task.estimatedMinutes}min)\n`;
    }
  }
  
  md += `\n---\n\n💡 **Tip**: ${plan.dailyTip}\n`;
  
  return md;
}
