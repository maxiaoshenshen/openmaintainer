import { describe, it, expect } from "vitest";
import { MaintainerRoadmap } from "./maintainer-roadmap";

describe("MaintainerRoadmap", () => {
  const roadmap = new MaintainerRoadmap();

  it("adds roadmap items", () => {
    const item = roadmap.addItem({
      title: "Add dark mode",
      description: "Implement dark mode support",
      status: "planned",
      priority: "high",
      category: "feature",
      estimatedEffort: "medium",
      dependencies: [],
    });

    expect(item.id).toBeDefined();
    expect(item.title).toBe("Add dark mode");
    expect(item.status).toBe("planned");
  });

  it("updates items", () => {
    const item = roadmap.addItem({
      title: "Test feature",
      description: "Test",
      status: "planned",
      priority: "low",
      category: "feature",
      estimatedEffort: "small",
      dependencies: [],
    });

    const updated = roadmap.updateItem(item.id, { status: "in-progress", priority: "high" });
    expect(updated?.status).toBe("in-progress");
    expect(updated?.priority).toBe("high");
  });

  it("calculates metrics", () => {
    const r = new MaintainerRoadmap();
    r.addItem({ title: "1", description: "", status: "completed", priority: "medium", category: "feature", estimatedEffort: "small", dependencies: [] });
    r.addItem({ title: "2", description: "", status: "in-progress", priority: "high", category: "maintenance", estimatedEffort: "medium", dependencies: [] });
    r.addItem({ title: "3", description: "", status: "planned", priority: "critical", category: "security", estimatedEffort: "large", dependencies: [] });

    const metrics = r.getMetrics();
    expect(metrics.totalItems).toBe(3);
    expect(metrics.completedItems).toBe(1);
    expect(metrics.inProgressItems).toBe(1);
    expect(metrics.plannedItems).toBe(1);
    expect(metrics.criticalItems).toBe(1);
  });

  it("gets items by priority", () => {
    const r = new MaintainerRoadmap();
    r.addItem({ title: "Low Priority Item", description: "", status: "planned", priority: "low", category: "feature", estimatedEffort: "small", dependencies: [] });
    r.addItem({ title: "Critical Priority Item", description: "", status: "planned", priority: "critical", category: "feature", estimatedEffort: "small", dependencies: [] });

    const critical = r.getItemsByPriority("critical");
    expect(critical.length).toBe(1);
    expect(critical[0].title).toBe("Critical Priority Item");
  });

  it("generates markdown", () => {
    const r = new MaintainerRoadmap();
    r.addItem({ title: "Done Task", description: "Completed task", status: "completed", priority: "medium", category: "feature", estimatedEffort: "small", dependencies: [] });

    const md = r.generateMarkdown();
    expect(md).toContain("Done Task");
    expect(md).toContain("[x]");
  });
});
