import type { MaintainerRepository as Repository, MaintainerIssue as Issue, MaintainerPullRequest as PullRequest } from "./types";
// Local contributor type for sprint planning
type Contributor = { contributions: number; name?: string };

export interface SprintGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  issues: number[];
}

export interface SprintPlan {
  repository: string;
  currentSprint: SprintGoal;
  upcomingSprints: SprintGoal[];
  velocity: number;
  capacity: number;
  recommendations: string[];
}

export interface BurndownData {
  date: Date;
  remaining: number;
  ideal: number;
}

export function createSprintPlan(
  repo: Repository,
  issues: Issue[],
  prs: PullRequest[],
  contributors: Contributor[]
): SprintPlan {
  const currentDate = new Date();
  const twoWeeksFromNow = new Date(currentDate);
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

  const openIssues = issues.filter((i) => i.state === "open");
  const prioritizedIssues = prioritizeIssues(openIssues);

  const currentSprint = createCurrentSprint(prioritizedIssues, twoWeeksFromNow);
  const upcomingSprints = createUpcomingSprints(prioritizedIssues);

  return {
    repository: repo.identity.fullName,
    currentSprint,
    upcomingSprints,
    velocity: calculateVelocity(contributors),
    capacity: calculateTeamCapacity(contributors),
    recommendations: generateSprintRecommendations(
      currentSprint,
      calculateVelocity(contributors)
    ),
  };
}

function prioritizeIssues(issues: Issue[]): (Issue & { priority: number })[] {
  return issues
    .map((issue) => ({
      ...issue,
      priority: calculateIssuePriority(issue),
    }))
    .sort((a, b) => b.priority - a.priority);
}

function calculateIssuePriority(issue: Issue): number {
  let priority = 50;

  // Higher priority for more comments (community interest)
  priority += Math.min(issue.commentCount * 2, 20);

  // Priority boost for issues with assignees
  if ((issue.assignees || []).length > 0) priority += 15;

  // Priority boost for labeled issues
  priority += Math.min(issue.labels.length * 5, 15);

  return priority;
}

function createCurrentSprint(
  prioritizedIssues: (Issue & { priority: number })[],
  targetDate: Date
): SprintGoal {
  const sprintIssues = prioritizedIssues.slice(0, 10);
  const completedCount = sprintIssues.filter(
    (i) => i.state === "closed"
  ).length;

  return {
    id: `sprint-${Date.now()}`,
    title: "Current Sprint Goals",
    description: "Focus on high-priority issues and critical bug fixes",
    targetDate,
    progress: sprintIssues.length > 0
      ? (completedCount / sprintIssues.length) * 100
      : 0,
    issues: sprintIssues.map((i) => i.id),
  };
}

function createUpcomingSprints(
  prioritizedIssues: (Issue & { priority: number })[]
): SprintGoal[] {
  const remaining = prioritizedIssues.slice(10, 30);
  const sprints: SprintGoal[] = [];

  for (let i = 0; i < 3; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14 * (i + 1));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14);

    const sprintIssues = remaining.slice(i * 7, (i + 1) * 7);

    sprints.push({
      id: `sprint-future-${i + 1}`,
      title: `Sprint ${i + 2} Goals`,
      description: `Planned work for the next cycle`,
      targetDate: endDate,
      progress: 0,
      issues: sprintIssues.map((issue) => issue.id),
    });
  }

  return sprints;
}

function calculateVelocity(contributors: Contributor[]): number {
  const activeContributors = contributors.filter(
    (c) => c.contributions > 0
  ).length;
  return Math.round(activeContributors * 3.5);
}

function calculateTeamCapacity(contributors: Contributor[]): number {
  const totalCapacity = contributors.reduce(
    (sum, c) => sum + Math.min(c.contributions * 2, 10),
    0
  );
  return Math.round(totalCapacity);
}

function generateSprintRecommendations(
  sprint: SprintGoal,
  velocity: number
): string[] {
  const recs: string[] = [];

  if (sprint.progress < 50 && sprint.issues.length > velocity) {
    recs.push(
      `Consider reducing sprint scope - ${sprint.issues.length} issues may exceed team velocity of ${velocity}`
    );
  }

  if (sprint.issues.length === 0) {
    recs.push("No issues assigned to current sprint - consider triaging backlog");
  }

  if (velocity > 20) {
    recs.push("Team velocity is high - consider taking on ambitious goals");
  }

  return recs;
}

export function generateBurndownData(
  sprint: SprintGoal,
  startDate: Date
): BurndownData[] {
  const data: BurndownData[] = [];
  const totalIssues = sprint.issues.length;
  const daysUntilTarget = Math.ceil(
    (sprint.targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  for (let i = 0; i <= daysUntilTarget; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const idealRemaining = totalIssues - (totalIssues / daysUntilTarget) * i;
    const actualRemaining = i < daysUntilTarget * (1 - sprint.progress / 100)
      ? totalIssues * (1 - sprint.progress / 100)
      : totalIssues * (1 - sprint.progress / 100) * (1 - (i / daysUntilTarget) * (sprint.progress / 100));

    data.push({
      date,
      remaining: Math.max(0, Math.round(actualRemaining)),
      ideal: Math.max(0, Math.round(idealRemaining)),
    });
  }

  return data;
}

export function estimateReleaseDate(
  remainingIssues: number,
  velocity: number,
  currentSprint: SprintGoal
): Date {
  const sprintsNeeded = Math.ceil(remainingIssues / velocity);
  const estimatedDate = new Date(currentSprint.targetDate);
  estimatedDate.setDate(estimatedDate.getDate() + sprintsNeeded * 14);
  return estimatedDate;
}
