/**
 * Team Manager - Manage contributor teams and roles
 */

export type Role = "owner" | "maintainer" | "reviewer" | "contributor" | "member";

export interface TeamMember {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  role: Role;
  joinedAt: number;
  contributions: number;
  lastActive?: number;
  skills?: string[];
  timezone?: string;
  availability?: "active" | "busy" | "away" | "inactive";
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: number;
  repository?: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  dueDate?: number;
}

export interface WorkloadDistribution {
  member: string;
  assigned: number;
  completed: number;
  percentage: number;
}

/**
 * Create a team
 */
export function createTeam(name: string, repository?: string): Team {
  return {
    id: `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    description: "",
    members: [],
    createdAt: Date.now(),
    repository,
  };
}

/**
 * Add member to team
 */
export function addMember(team: Team, member: Omit<TeamMember, "id" | "joinedAt">): TeamMember {
  const newMember: TeamMember = {
    ...member,
    id: `member_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    joinedAt: Date.now(),
  };
  team.members.push(newMember);
  return newMember;
}

/**
 * Update member role
 */
export function updateMemberRole(team: Team, memberId: string, newRole: Role): boolean {
  const member = team.members.find(m => m.id === memberId);
  if (!member) return false;
  member.role = newRole;
  return true;
}

/**
 * Get members by role
 */
export function getMembersByRole(team: Team, role: Role): TeamMember[] {
  return team.members.filter(m => m.role === role);
}

/**
 * Calculate member score for task assignment
 */
export function calculateMemberScore(member: TeamMember): number {
  const roleWeights: Record<Role, number> = {
    owner: 1.0,
    maintainer: 0.9,
    reviewer: 0.7,
    contributor: 0.5,
    member: 0.3,
  };

  const availabilityScores: Record<NonNullable<TeamMember["availability"]>, number> = {
    active: 1.0,
    busy: 0.5,
    away: 0.2,
    inactive: 0,
  };

  let score = roleWeights[member.role] || 0.3;
  
  if (member.availability) {
    score *= availabilityScores[member.availability];
  }

  // Recency factor
  if (member.lastActive) {
    const daysSinceActive = (Date.now() - member.lastActive) / (1000 * 60 * 60 * 24);
    if (daysSinceActive > 30) {
      score *= 0.3;
    } else if (daysSinceActive > 7) {
      score *= 0.7;
    }
  }

  return score;
}

/**
 * Suggest best member for task
 */
export function suggestAssignee(
  team: Team,
  taskType?: "review" | "code" | "docs" | "test"
): TeamMember | null {
  const available = team.members.filter(m => {
    if (m.role === "owner" || m.role === "maintainer") {
      return m.availability !== "inactive" && m.availability !== "away";
    }
    return m.availability === "active";
  });

  if (available.length === 0) return null;

  return available.reduce((best, current) => {
    const bestScore = calculateMemberScore(best);
    const currentScore = calculateMemberScore(current);
    return currentScore > bestScore ? current : best;
  });
}

/**
 * Calculate workload distribution
 */
export function calculateWorkload(
  team: Team,
  tasks: OnboardingTask[]
): WorkloadDistribution[] {
  const distributions = team.members.map(member => {
    const assigned = tasks.filter(t => t.assignee === member.username).length;
    const completed = tasks.filter(
      t => t.assignee === member.username && t.completed
    ).length;
    
    return {
      member: member.username,
      assigned,
      completed,
      percentage: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
    };
  });

  return distributions.sort((a, b) => b.assigned - a.assigned);
}

/**
 * Generate onboarding checklist
 */
export function generateOnboardingTasks(
  newMember: TeamMember,
  hasCodeAccess: boolean,
  hasCI: boolean,
  hasDocs: boolean
): OnboardingTask[] {
  const tasks: OnboardingTask[] = [
    {
      id: "intro",
      title: "Introduce yourself",
      description: "Post a brief introduction in the community channel",
      completed: false,
      priority: "high",
    },
    {
      id: "repo-access",
      title: "Get repository access",
      description: "Fork the repository and add upstream remote",
      completed: hasCodeAccess,
      priority: "high",
    },
    {
      id: "dev-setup",
      title: "Development setup",
      description: "Clone repo, install dependencies, run tests locally",
      completed: false,
      priority: "high",
    },
    {
      id: "first-pr",
      title: "First pull request",
      description: "Find a good first issue and submit your first PR",
      completed: false,
      priority: "medium",
    },
    {
      id: "read-docs",
      title: "Read documentation",
      description: "Review CONTRIBUTING.md and code of conduct",
      completed: hasDocs,
      priority: "medium",
    },
    {
      id: "ci-setup",
      title: "Understand CI pipeline",
      description: "Review the CI configuration and what checks are run",
      completed: hasCI,
      priority: "low",
    },
  ];

  return tasks;
}

/**
 * Check team health
 */
export function checkTeamHealth(team: Team): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for missing roles
  const owners = getMembersByRole(team, "owner");
  if (owners.length === 0) {
    issues.push("No team owner defined");
    recommendations.push("Assign at least one team owner");
  }

  // Check for inactive members
  const inactive = team.members.filter(
    m => m.lastActive && Date.now() - m.lastActive > 30 * 24 * 60 * 60 * 1000
  );
  if (inactive.length > team.members.length * 0.3) {
    issues.push(`${inactive.length} members are inactive for >30 days`);
    recommendations.push("Reach out to inactive members or remove them");
  }

  // Check role distribution
  const maintainers = getMembersByRole(team, "maintainer");
  if (maintainers.length < 2 && team.members.length > 5) {
    issues.push("Limited maintainer coverage");
    recommendations.push("Consider promoting trusted contributors to maintainers");
  }

  // Calculate health score
  let score = 100;
  score -= issues.length * 15;
  score -= inactive.length * 5;
  score = Math.max(0, score);

  return { score, issues, recommendations };
}

/**
 * Generate team statistics
 */
export function getTeamStats(team: Team): {
  totalMembers: number;
  byRole: Record<Role, number>;
  totalContributions: number;
  avgContributions: number;
  mostActive: TeamMember[];
  recentActivity: number;
} {
  const byRole: Record<Role, number> = {
    owner: 0,
    maintainer: 0,
    reviewer: 0,
    contributor: 0,
    member: 0,
  };

  for (const member of team.members) {
    byRole[member.role]++;
  }

  const totalContributions = team.members.reduce(
    (sum, m) => sum + m.contributions, 0
  );
  const avgContributions = team.members.length > 0
    ? Math.round(totalContributions / team.members.length)
    : 0;

  const mostActive = [...team.members]
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 5);

  const recentActivity = team.members.filter(
    m => m.lastActive && Date.now() - m.lastActive < 7 * 24 * 60 * 60 * 1000
  ).length;

  return {
    totalMembers: team.members.length,
    byRole,
    totalContributions,
    avgContributions,
    mostActive,
    recentActivity,
  };
}
