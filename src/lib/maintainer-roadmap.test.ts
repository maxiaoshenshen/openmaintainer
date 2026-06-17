import { describe, it, expect } from "vitest";
import {
  createRoadmapItem,
  updateRoadmapStatus,
  calculateRoadmapMetrics,
  createMilestone,
  buildRoadmapPhase,
  generateRoadmapRecommendations,
  createDefaultRoadmapTemplate,
  exportRoadmap,
} from "./maintainer-roadmap";

describe("Maintainer Roadmap", () => {
  describe("createRoadmapItem", () => {
    it("should create a roadmap item with defaults", () => {
      const item = createRoadmapItem({
        title: "New Feature",
        description: "Add a new feature",
        status: "planning",
        priority: "high",
        category: "feature",
      });

      expect(item.id).toBeDefined();
      expect(item.title).toBe("New Feature");
      expect(item.labels).toEqual([]);
      expect(item.assignees).toEqual([]);
      expect(item.createdAt).toBeDefined();
    });

    it("should create item with optional fields", () => {
      const item = createRoadmapItem({
        title: "Bug Fix",
        description: "Fix critical bug",
        status: "planned",
        priority: "critical",
        category: "bugfix",
        targetVersion: "1.5.0",
        estimatedEffort: 3,
      });

      expect(item.targetVersion).toBe("1.5.0");
      expect(item.estimatedEffort).toBe(3);
    });
  });

  describe("updateRoadmapStatus", () => {
    it("should update status to in-progress", () => {
      const item = createRoadmapItem({
        title: "Test",
        description: "Test",
        status: "planning",
        priority: "medium",
        category: "feature",
      });

      const updated = updateRoadmapStatus(item, "in-progress");

      expect(updated.status).toBe("in-progress");
      expect(updated.startedAt).toBeDefined();
      expect(updated.updatedAt).toBeGreaterThanOrEqual(item.updatedAt);
    });

    it("should update status to completed", () => {
      const item = createRoadmapItem({
        title: "Test",
        description: "Test",
        status: "in-progress",
        priority: "medium",
        category: "feature",
      });

      const updated = updateRoadmapStatus(item, "completed");

      expect(updated.status).toBe("completed");
      expect(updated.completedAt).toBeDefined();
    });

    it("should not reset startedAt if already set", () => {
      const item = createRoadmapItem({
        title: "Test",
        description: "Test",
        status: "in-progress",
        priority: "medium",
        category: "feature",
      });
      item.startedAt = Date.now() - 100000;

      const updated = updateRoadmapStatus(item, "completed");

      expect(updated.startedAt).toBe(item.startedAt);
    });
  });

  describe("calculateRoadmapMetrics", () => {
    it("should calculate basic metrics", () => {
      const items = [
        createRoadmapItem({ title: "1", description: "", status: "completed", priority: "high", category: "feature", estimatedEffort: 5 }),
        createRoadmapItem({ title: "2", description: "", status: "in-progress", priority: "medium", category: "improvement", estimatedEffort: 3 }),
        createRoadmapItem({ title: "3", description: "", status: "planned", priority: "low", category: "documentation", estimatedEffort: 2 }),
      ];

      const metrics = calculateRoadmapMetrics(items);

      expect(metrics.totalItems).toBe(3);
      expect(metrics.completedItems).toBe(1);
      expect(metrics.inProgressItems).toBe(1);
      expect(metrics.plannedItems).toBe(1);
      expect(metrics.completionRate).toBeCloseTo(33.33, 1);
    });

    it("should count by category", () => {
      const items = [
        createRoadmapItem({ title: "1", description: "", status: "completed", priority: "high", category: "feature" }),
        createRoadmapItem({ title: "2", description: "", status: "completed", priority: "medium", category: "feature" }),
        createRoadmapItem({ title: "3", description: "", status: "completed", priority: "low", category: "bugfix" }),
      ];

      const metrics = calculateRoadmapMetrics(items);

      expect(metrics.itemsByCategory.feature).toBe(2);
      expect(metrics.itemsByCategory.bugfix).toBe(1);
    });
  });

  describe("createMilestone", () => {
    it("should create a milestone", () => {
      const items = [
        createRoadmapItem({ title: "1", description: "", status: "completed", priority: "high", category: "feature" }),
        createRoadmapItem({ title: "2", description: "", status: "in-progress", priority: "medium", category: "feature" }),
      ];

      const milestone = createMilestone("v1.0", "First release", items);

      expect(milestone.title).toBe("v1.0");
      expect(milestone.progress).toBe(50);
      expect(milestone.items).toEqual(items.map(i => i.id));
    });
  });

  describe("buildRoadmapPhase", () => {
    it("should build phase with milestones", () => {
      const items = [
        createRoadmapItem({ title: "1", description: "", status: "planning", priority: "high", category: "feature", milestone: "Phase 1" }),
        createRoadmapItem({ title: "2", description: "", status: "planning", priority: "medium", category: "feature", milestone: "Phase 1" }),
      ];

      const phase = buildRoadmapPhase("Launch", "Product launch", items);

      expect(phase.name).toBe("Launch");
      expect(phase.milestones.length).toBe(1);
      expect(phase.items).toEqual(items);
    });
  });

  describe("generateRoadmapRecommendations", () => {
    it("should recommend stalled items review", () => {
      const stalledItem = createRoadmapItem({
        title: "Stalled",
        description: "",
        status: "in-progress",
        priority: "high",
        category: "feature",
      });
      stalledItem.updatedAt = Date.now() - 20 * 24 * 60 * 60 * 1000; // 20 days ago

      const metrics = calculateRoadmapMetrics([stalledItem]);
      const recs = generateRoadmapRecommendations(metrics, [stalledItem]);

      expect(recs.some(r => r.action.includes("stalled"))).toBe(true);
    });

    it("should recommend critical item prioritization", () => {
      const criticalItem = createRoadmapItem({
        title: "Critical",
        description: "",
        status: "planning",
        priority: "critical",
        category: "bugfix",
      });

      const metrics = calculateRoadmapMetrics([criticalItem]);
      const recs = generateRoadmapRecommendations(metrics, [criticalItem]);

      expect(recs.some(r => r.action.includes("critical"))).toBe(true);
    });
  });

  describe("createDefaultRoadmapTemplate", () => {
    it("should create default roadmap items", () => {
      const items = createDefaultRoadmapTemplate();

      expect(items.length).toBeGreaterThan(0);
      expect(items.every(i => i.status === "planning" || i.status === "planned")).toBe(true);
    });

    it("should have diverse categories", () => {
      const items = createDefaultRoadmapTemplate();
      const categories = new Set(items.map(i => i.category));

      expect(categories.size).toBeGreaterThan(2);
    });
  });

  describe("exportRoadmap", () => {
    it("should export as JSON", () => {
      const items = [
        createRoadmapItem({ title: "Test", description: "Test item", status: "planning", priority: "high", category: "feature" }),
      ];

      const json = exportRoadmap(items, "json");
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe("Test");
    });

    it("should export as Markdown", () => {
      const items = [
        createRoadmapItem({ title: "Feature A", description: "Desc", status: "in-progress", priority: "high", category: "feature" }),
        createRoadmapItem({ title: "Feature B", description: "Desc", status: "completed", priority: "medium", category: "improvement" }),
      ];

      const md = exportRoadmap(items, "markdown");

      expect(md).toContain("# Project Roadmap");
      expect(md).toContain("Feature A");
      expect(md).toContain("In Progress");
    });

    it("should export as CSV", () => {
      const items = [
        createRoadmapItem({ title: "Test", description: "", status: "planning", priority: "high", category: "feature" }),
      ];

      const csv = exportRoadmap(items, "csv");

      expect(csv).toContain("ID,Title,Status");
      expect(csv).toContain("Test");
    });
  });
});
