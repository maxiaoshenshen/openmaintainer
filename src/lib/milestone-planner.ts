/**
 * Milestone Planner
 * Helps plan and track release milestones
 */

export type MilestoneStatus = 'open' | 'in-progress' | 'completed' | 'overdue';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: MilestoneStatus;
  issues: number[];
  completedIssues: number[];
  progress: number; // 0-100
  labels: string[];
  assignees: string[];
}

export interface MilestonePlan {
  milestones: Milestone[];
  upcoming: Milestone[];
  overdue: Milestone[];
  completed: Milestone[];
  velocity: number; // issues per week
  onTrack: boolean;
  risks: string[];
  recommendations: string[];
}

export interface ReleaseScope {
  milestone: Milestone;
  includedIssues: MilestoneIssue[];
  excludedIssues: MilestoneIssue[];
  estimatedSize: 'small' | 'medium' | 'large';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MilestoneIssue {
  number: number;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'bug' | 'feature' | 'enhancement' | 'task';
  labels: string[];
  assignee?: string;
  estimate?: string;
}

/**
 * Create a new milestone
 */
export function createMilestone(params: {
  title: string;
  description: string;
  dueDate: string;
  targetIssues?: number[];
  labels?: string[];
  assignees?: string[];
}): Milestone {
  return {
    id: `milestone-${Date.now()}`,
    title: params.title,
    description: params.description,
    dueDate: params.dueDate,
    status: 'open',
    issues: params.targetIssues || [],
    completedIssues: [],
    progress: 0,
    labels: params.labels || [],
    assignees: params.assignees || [],
  };
}

/**
 * Analyze milestone progress
 */
export function analyzeMilestone(params: {
  milestone: Milestone;
  issues: MilestoneIssue[];
}): { progress: number; daysRemaining: number; onTrack: boolean } {
  const { milestone, issues } = params;
  const now = new Date();
  const dueDate = new Date(milestone.dueDate);
  const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const totalIssues = issues.length;
  const completedIssues = issues.filter(i => milestone.completedIssues.includes(i.number)).length;
  const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  // Calculate expected progress based on time
  const totalDays = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = totalDays > 0 ? Math.max(0, 30 - daysRemaining) : 30;
  const expectedProgress = Math.min(100, (daysPassed / 30) * 100);

  const onTrack = progress >= expectedProgress * 0.8;

  return { progress, daysRemaining, onTrack };
}

/**
 * Plan release scope based on milestone
 */
export function planReleaseScope(params: {
  milestone: Milestone;
  allIssues: MilestoneIssue[];
}): ReleaseScope {
  const { milestone, allIssues } = params;
  
  const milestoneIssues = allIssues.filter(i => milestone.issues.includes(i.number));
  const completed = milestoneIssues.filter(i => milestone.completedIssues.includes(i.number));
  const remaining = milestoneIssues.filter(i => !milestone.completedIssues.includes(i.number));

  // Sort remaining by priority
  const sorted = [...remaining].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Estimate size
  const estimatedSize = getEstimatedSize(remaining);
  const riskLevel = calculateRisk(remaining, milestone.dueDate);

  return {
    milestone,
    includedIssues: [...completed, ...sorted],
    excludedIssues: [],
    estimatedSize,
    riskLevel,
  };
}

function getEstimatedSize(issues: MilestoneIssue[]): 'small' | 'medium' | 'large' {
  const criticalCount = issues.filter(i => i.priority === 'critical' || i.priority === 'high').length;
  const totalCount = issues.length;

  if (criticalCount > 5 || totalCount > 20) return 'large';
  if (criticalCount > 2 || totalCount > 10) return 'medium';
  return 'small';
}

function calculateRisk(issues: MilestoneIssue[], dueDate: string): 'low' | 'medium' | 'high' {
  const daysRemaining = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const criticalCount = issues.filter(i => i.priority === 'critical').length;

  if (criticalCount > 0 && daysRemaining < 7) return 'high';
  if (criticalCount > 2 || daysRemaining < 3) return 'high';
  if (criticalCount > 0 || daysRemaining < 7) return 'medium';
  return 'low';
}

/**
 * Generate milestone plan from milestones and issues
 */
export function generateMilestonePlan(params: {
  milestones: Milestone[];
  issues: MilestoneIssue[];
  currentVelocity?: number;
}): MilestonePlan {
  const { milestones, issues, currentVelocity = 3 } = params;
  const now = new Date();

  const upcoming: Milestone[] = [];
  const overdue: Milestone[] = [];
  const completed: Milestone[] = [];

  for (const milestone of milestones) {
    const dueDate = new Date(milestone.dueDate);
    
    if (milestone.status === 'completed') {
      completed.push(milestone);
    } else if (dueDate < now) {
      milestone.status = 'overdue';
      overdue.push(milestone);
    } else {
      milestone.status = milestone.issues.some(i => milestone.completedIssues.includes(i)) 
        ? 'in-progress' 
        : 'open';
      upcoming.push(milestone);
    }
  }

  // Calculate risks and recommendations
  const risks: string[] = [];
  const recommendations: string[] = [];

  if (overdue.length > 0) {
    risks.push(`${overdue.length} milestone(s) are overdue`);
    recommendations.push('Consider extending or closing overdue milestones');
  }

  for (const milestone of upcoming) {
    const analysis = analyzeMilestone({ milestone, issues });
    if (!analysis.onTrack) {
      risks.push(`"${milestone.title}" is behind schedule (${analysis.progress}% complete, ${analysis.daysRemaining} days left)`);
      recommendations.push(`Focus on completing critical issues in "${milestone.title}"`);
    }
  }

  const totalCompleted = [...completed, ...milestones.filter(m => m.status === 'completed')]
    .reduce((sum, m) => sum + m.completedIssues.length, 0);

  return {
    milestones,
    upcoming: upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    overdue,
    completed,
    velocity: currentVelocity,
    onTrack: overdue.length === 0 && risks.filter(r => r.includes('behind')).length === 0,
    risks,
    recommendations,
  };
}

/**
 * Suggest issues for a milestone based on criteria
 */
export function suggestMilestoneIssues(params: {
  allIssues: MilestoneIssue[];
  milestoneLabels: string[];
  milestoneAssignees: string[];
  maxIssues?: number;
}): MilestoneIssue[] {
  const { allIssues, milestoneLabels, milestoneAssignees, maxIssues = 10 } = params;

  const scored = allIssues.map(issue => {
    let score = 0;

    // Match labels
    for (const label of milestoneLabels) {
      if (issue.labels.some(l => l.toLowerCase().includes(label.toLowerCase()))) {
        score += 10;
      }
    }

    // Match assignees
    if (issue.assignee && milestoneAssignees.includes(issue.assignee)) {
      score += 5;
    }

    // Prioritize higher priority issues
    const priorityScores = { critical: 20, high: 15, medium: 10, low: 5 };
    score += priorityScores[issue.priority];

    return { issue, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxIssues)
    .map(s => s.issue);
}

/**
 * Generate milestone report
 */
export function generateMilestoneReport(plan: MilestonePlan): string {
  const lines: string[] = [];

  lines.push('# Milestone Report\n');

  if (plan.upcoming.length > 0) {
    lines.push('## Upcoming Milestones\n');
    for (const m of plan.upcoming) {
      lines.push(`- **${m.title}**: Due ${m.dueDate}, ${m.progress}% complete`);
    }
    lines.push('');
  }

  if (plan.overdue.length > 0) {
    lines.push('## ⚠️ Overdue Milestones\n');
    for (const m of plan.overdue) {
      lines.push(`- **${m.title}**: Was due ${m.dueDate}`);
    }
    lines.push('');
  }

  if (plan.risks.length > 0) {
    lines.push('## Risks\n');
    for (const risk of plan.risks) {
      lines.push(`- ${risk}`);
    }
    lines.push('');
  }

  if (plan.recommendations.length > 0) {
    lines.push('## Recommendations\n');
    for (const rec of plan.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  lines.push(`**Status**: ${plan.onTrack ? '✅ On Track' : '⚠️ Needs Attention'}`);
  lines.push(`**Velocity**: ${plan.velocity} issues/week`);

  return lines.join('\n');
}
