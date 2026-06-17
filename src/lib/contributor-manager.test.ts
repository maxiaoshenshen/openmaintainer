import { describe, it, expect, beforeEach } from "vitest";
import { ContributorManager } from "./contributor-manager";

describe("ContributorManager", () => {
  let manager: ContributorManager;

  beforeEach(() => {
    manager = new ContributorManager();
  });

  describe("addContributor", () => {
    it("should add a contributor", () => {
      manager.addContributor({
        login: "user1",
        avatarUrl: "https://avatar.com/1",
        contributions: 10,
        type: "user",
      });

      const contributor = manager.getContributor("user1");
      expect(contributor).toBeDefined();
      expect(contributor?.login).toBe("user1");
    });

    it("should calculate tier based on contributions", () => {
      manager.addContributor({ login: "new", avatarUrl: "", contributions: 3, type: "user" });
      manager.addContributor({ login: "active", avatarUrl: "", contributions: 25, type: "user" });
      manager.addContributor({ login: "core", avatarUrl: "", contributions: 200, type: "user" });

      expect(manager.getContributor("new")?.tier).toBe("new");
      expect(manager.getContributor("active")?.tier).toBe("regular");
      expect(manager.getContributor("core")?.tier).toBe("core");
    });
  });

  describe("updateActivity", () => {
    it("should update last active timestamp", () => {
      manager.addContributor({ login: "user1", avatarUrl: "", contributions: 10, type: "user" });
      
      const before = Date.now();
      manager.updateActivity("user1");
      const after = Date.now();

      const contributor = manager.getContributor("user1");
      expect(contributor?.lastActiveAt).toBeGreaterThanOrEqual(before);
      expect(contributor?.lastActiveAt).toBeLessThanOrEqual(after);
    });
  });

  describe("recognize", () => {
    it("should recognize a contributor", () => {
      manager.addContributor({ login: "user1", avatarUrl: "", contributions: 10, type: "user" });
      
      const recognition = manager.recognize("user1", "star", "Great work!");
      
      expect(recognition.type).toBe("star");
      expect(recognition.message).toBe("Great work!");
    });

    it("should auto-add badge for recognition", () => {
      manager.addContributor({ login: "user1", avatarUrl: "", contributions: 10, type: "user" });
      
      manager.recognize("user1", "star", "Great work!");
      
      const contributor = manager.getContributor("user1");
      expect(contributor?.badges).toContain("⭐ Star Contributor");
    });
  });

  describe("getMetrics", () => {
    it("should return correct metrics", () => {
      manager.addContributor({ login: "user1", avatarUrl: "", contributions: 100, type: "user" });
      manager.addContributor({ login: "user2", avatarUrl: "", contributions: 10, type: "user" });
      
      manager.updateActivity("user1");
      manager.updateActivity("user2");

      const metrics = manager.getMetrics();
      
      expect(metrics.totalContributors).toBe(2);
      expect(metrics.activeContributors).toBe(2);
      expect(metrics.topContributors).toHaveLength(2);
    });
  });

  describe("getInactiveContributors", () => {
    it("should return inactive contributors after threshold", () => {
      manager.addContributor({ login: "user1", avatarUrl: "", contributions: 100, type: "user" });
      manager.updateActivity("user1");
      
      // Simulate inactive by setting lastActiveAt to 60 days ago
      const contributor = manager.getContributor("user1")!;
      contributor.lastActiveAt = Date.now() - (60 * 24 * 60 * 60 * 1000);

      const inactive = manager.getInactiveContributors();
      expect(inactive.length).toBe(1);
    });
  });
});
