/**
 * Team Collaboration - Multi-maintainer support for OSS projects
 */

export interface TeamMember {
  id: string;
  username: string;
  displayName: string;
  role: "owner" | "admin" | "maintainer" | "reviewer";
  avatarUrl: string;
  joinedAt: number;
  lastActive: number;
}

export interface TeamAssignment {
  id: string;
  task: string;
  taskType: "issue" | "pr" | "review" | "release";
  assignee: string;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
  dueDate?: number;
  createdAt: number;
}

export interface Team {
  repository: string;
  members: TeamMember[];
  assignments: TeamAssignment[];
  createdAt: number;
}

const TEAM_KEY = "openmaintainer:team";

/**
 * Create a new team
 */
export function createTeam(repository: string, ownerUsername: string, ownerDisplayName: string): Team {
  const owner: TeamMember = {
    id: `member-${Date.now()}`,
    username: ownerUsername,
    displayName: ownerDisplayName,
    role: "owner",
    avatarUrl: `https://github.com/${ownerUsername}.png`,
    joinedAt: Date.now(),
    lastActive: Date.now(),
  };

  return {
    repository,
    members: [owner],
    assignments: [],
    createdAt: Date.now(),
  };
}

/**
 * Read team from localStorage
 */
export function readTeam(storage: Storage, repository: string): Team | null {
  try {
    const teams = readAllTeams(storage);
    return teams.find((t) => t.repository === repository) || null;
  } catch {
    return null;
  }
}

/**
 * Read all teams
 */
export function readAllTeams(storage: Storage): Team[] {
  try {
    const data = storage.getItem(TEAM_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Write all teams
 */
export function writeAllTeams(storage: Storage, teams: Team[]): void {
  storage.setItem(TEAM_KEY, JSON.stringify(teams));
}

/**
 * Save or update team
 */
export function saveTeam(storage: Storage, team: Team): void {
  const teams = readAllTeams(storage);
  const index = teams.findIndex((t) => t.repository === team.repository);
  if (index >= 0) {
    teams[index] = team;
  } else {
    teams.push(team);
  }
  writeAllTeams(storage, teams);
}

/**
 * Add member to team
 */
export function addTeamMember(
  storage: Storage,
  repository: string,
  username: string,
  displayName: string,
  role: TeamMember["role"] = "reviewer"
): TeamMember | null {
  const team = readTeam(storage, repository);
  if (!team) return null;

  // Check if member already exists
  if (team.members.some((m) => m.username === username)) {
    return null;
  }

  const newMember: TeamMember = {
    id: `member-${Date.now()}`,
    username,
    displayName,
    role,
    avatarUrl: `https://github.com/${username}.png`,
    joinedAt: Date.now(),
    lastActive: Date.now(),
  };

  team.members.push(newMember);
  saveTeam(storage, team);
  return newMember;
}

/**
 * Remove member from team
 */
export function removeTeamMember(storage: Storage, repository: string, memberId: string): boolean {
  const team = readTeam(storage, repository);
  if (!team) return false;

  team.members = team.members.filter((m) => m.id !== memberId);
  saveTeam(storage, team);
  return true;
}

/**
 * Create assignment
 */
export function createAssignment(
  storage: Storage,
  repository: string,
  task: string,
  taskType: TeamAssignment["taskType"],
  assignee: string,
  priority: TeamAssignment["priority"] = "medium"
): TeamAssignment | null {
  const team = readTeam(storage, repository);
  if (!team) return null;

  const assignment: TeamAssignment = {
    id: `assign-${Date.now()}`,
    task,
    taskType,
    assignee,
    status: "pending",
    priority,
    createdAt: Date.now(),
  };

  team.assignments.push(assignment);
  saveTeam(storage, team);
  return assignment;
}

/**
 * Update assignment status
 */
export function updateAssignmentStatus(
  storage: Storage,
  repository: string,
  assignmentId: string,
  status: TeamAssignment["status"]
): boolean {
  const team = readTeam(storage, repository);
  if (!team) return false;

  const assignment = team.assignments.find((a) => a.id === assignmentId);
  if (!assignment) return false;

  assignment.status = status;
  saveTeam(storage, team);
  return true;
}

/**
 * Get team statistics
 */
export function getTeamStats(team: Team): {
  totalMembers: number;
  activeMembers: number;
  pendingAssignments: number;
  completedAssignments: number;
} {
  const now = Date.now();
  const activeThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

  return {
    totalMembers: team.members.length,
    activeMembers: team.members.filter((m) => now - m.lastActive < activeThreshold).length,
    pendingAssignments: team.assignments.filter((a) => a.status === "pending" || a.status === "in_progress").length,
    completedAssignments: team.assignments.filter((a) => a.status === "completed").length,
  };
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: TeamMember["role"], locale: "en" | "zh" = "en"): string {
  const roles: Record<TeamMember["role"], { en: string; zh: string }> = {
    owner: { en: "Owner", zh: "所有者" },
    admin: { en: "Admin", zh: "管理员" },
    maintainer: { en: "Maintainer", zh: "维护者" },
    reviewer: { en: "Reviewer", zh: "评审" },
  };
  return roles[role][locale];
}
