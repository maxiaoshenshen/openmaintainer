import { describe, it, expect } from "vitest";
import {
  createTeam,
  addMember,
  updateMemberRole,
  getMembersByRole,
  calculateMemberScore,
  suggestAssignee,
  calculateWorkload,
  generateOnboardingTasks,
  checkTeamHealth,
  getTeamStats,
  type Role,
} from "./team-manager";

describe("TeamManager", () => {
  describe("createTeam", () => {
    it("should create team with defaults", () => {
      const team = createTeam("Test Team", "org/repo");
      expect(team.name).toBe("Test Team");
      expect(team.repository).toBe("org/repo");
      expect(team.members).toEqual([]);
    });
  });

  describe("addMember", () => {
    it("should add member to team", () => {
      const team = createTeam("Test");
      const member = addMember(team, {
        username: "developer",
        role: "contributor",
        contributions: 10,
      });
      expect(team.members.length).toBe(1);
      expect(member.username).toBe("developer");
      expect(member.joinedAt).toBeDefined();
    });
  });

  describe("updateMemberRole", () => {
    it("should update member role", () => {
      const team = createTeam("Test");
      addMember(team, { username: "dev", role: "contributor", contributions: 5 });
      const updated = updateMemberRole(team, team.members[0].id, "maintainer");
      expect(updated).toBe(true);
      expect(team.members[0].role).toBe("maintainer");
    });

    it("should return false for non-existent member", () => {
      const team = createTeam("Test");
      const updated = updateMemberRole(team, "fake-id", "maintainer");
      expect(updated).toBe(false);
    });
  });

  describe("getMembersByRole", () => {
    it("should filter members by role", () => {
      const team = createTeam("Test");
      addMember(team, { username: "owner", role: "owner", contributions: 100 });
      addMember(team, { username: "dev1", role: "contributor", contributions: 10 });
      addMember(team, { username: "dev2", role: "contributor", contributions: 20 });
      
      const owners = getMembersByRole(team, "owner");
      const contributors = getMembersByRole(team, "contributor");
      
      expect(owners.length).toBe(1);
      expect(contributors.length).toBe(2);
    });
  });

  describe("calculateMemberScore", () => {
    it("should score owners higher", () => {
      const owner = { id: "1", username: "o", role: "owner" as Role, contributions: 0, joinedAt: 1 };
      const member = { id: "2", username: "m", role: "member" as Role, contributions: 0, joinedAt: 1 };
      
      expect(calculateMemberScore(owner)).toBeGreaterThan(calculateMemberScore(member));
    });

    it("should reduce score for inactive members", () => {
      const active = { id: "1", username: "a", role: "maintainer" as Role, contributions: 10, joinedAt: 1, lastActive: Date.now(), availability: "active" as const };
      const inactive = { id: "2", username: "i", role: "maintainer" as Role, contributions: 10, joinedAt: 1, lastActive: Date.now() - 60 * 24 * 60 * 60 * 1000, availability: "inactive" as const };
      
      expect(calculateMemberScore(active)).toBeGreaterThan(calculateMemberScore(inactive));
    });
  });

  describe("suggestAssignee", () => {
    it("should suggest available maintainer", () => {
      const team = createTeam("Test");
      addMember(team, { username: "busy", role: "maintainer", contributions: 100, availability: "busy" });
      addMember(team, { username: "active", role: "maintainer", contributions: 50, availability: "active" });
      
      const assignee = suggestAssignee(team);
      expect(assignee?.username).toBe("active");
    });

    it("should return null for empty team", () => {
      const team = createTeam("Test");
      expect(suggestAssignee(team)).toBeNull();
    });
  });

  describe("calculateWorkload", () => {
    it("should calculate workload distribution", () => {
      const team = createTeam("Test");
      addMember(team, { username: "dev1", role: "contributor", contributions: 10 });
      
      const tasks = [
        { id: "1", title: "T1", description: "", assignee: "dev1", completed: true, priority: "high" as const },
        { id: "2", title: "T2", description: "", assignee: "dev1", completed: false, priority: "high" as const },
      ];
      
      const workload = calculateWorkload(team, tasks);
      expect(workload[0].assigned).toBe(2);
      expect(workload[0].completed).toBe(1);
      expect(workload[0].percentage).toBe(50);
    });
  });

  describe("generateOnboardingTasks", () => {
    it("should generate tasks for new member", () => {
      const member = { id: "1", username: "new", role: "member" as Role, contributions: 0, joinedAt: Date.now() };
      const tasks = generateOnboardingTasks(member, false, true, true);
      
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.find(t => t.id === "first-pr")).toBeDefined();
    });

    it("should mark completed tasks based on flags", () => {
      const member = { id: "1", username: "new", role: "member" as Role, contributions: 0, joinedAt: Date.now() };
      const tasks = generateOnboardingTasks(member, true, false, true);
      
      const repoTask = tasks.find(t => t.id === "repo-access");
      expect(repoTask?.completed).toBe(true);
    });
  });

  describe("checkTeamHealth", () => {
    it("should detect missing owner", () => {
      const team = createTeam("Test");
      addMember(team, { username: "dev", role: "contributor", contributions: 10 });
      
      const health = checkTeamHealth(team);
      expect(health.issues).toContain("No team owner defined");
    });

    it("should score 100 for healthy team", () => {
      const team = createTeam("Test");
      addMember(team, { username: "owner", role: "owner", contributions: 100, lastActive: Date.now(), availability: "active" });
      
      const health = checkTeamHealth(team);
      expect(health.score).toBe(100);
    });
  });

  describe("getTeamStats", () => {
    it("should calculate statistics", () => {
      const team = createTeam("Test");
      addMember(team, { username: "o", role: "owner", contributions: 100 });
      addMember(team, { username: "m1", role: "maintainer", contributions: 50 });
      addMember(team, { username: "m2", role: "maintainer", contributions: 30 });
      
      const stats = getTeamStats(team);
      expect(stats.totalMembers).toBe(3);
      expect(stats.totalContributions).toBe(180);
      expect(stats.avgContributions).toBe(60);
      expect(stats.byRole.owner).toBe(1);
      expect(stats.byRole.maintainer).toBe(2);
    });
  });
});
