import { describe, it, expect } from "vitest";
import {
  buildKanbanBoard,
  getPriorityFromLabels,
  getPriorityColor,
} from "./kanban-board";
import { createDemoAnalysis } from "./demo-data";

describe("kanban-board", () => {
  describe("getPriorityFromLabels", () => {
    it("should detect high priority", () => {
      expect(getPriorityFromLabels(["urgent", "bug"])).toBe("high");
      expect(getPriorityFromLabels(["critical"])).toBe("high");
    });

    it("should detect medium priority", () => {
      expect(getPriorityFromLabels(["medium"])).toBe("medium");
      expect(getPriorityFromLabels(["normal"])).toBe("medium");
    });

    it("should default to low priority", () => {
      expect(getPriorityFromLabels(["enhancement"])).toBe("low");
      expect(getPriorityFromLabels([])).toBe("low");
    });
  });

  describe("buildKanbanBoard", () => {
    it("should build kanban board with columns", () => {
      const analysis = createDemoAnalysis();
      const board = buildKanbanBoard(analysis);
      expect(board.columns.length).toBe(4);
      expect(board.stats.total).toBeGreaterThan(0);
    });

    it("should categorize items correctly", () => {
      const analysis = createDemoAnalysis();
      const board = buildKanbanBoard(analysis);
      const needsReview = board.columns.find(c => c.id === "needs-review");
      const inProgress = board.columns.find(c => c.id === "in-progress");
      expect(needsReview).toBeDefined();
      expect(inProgress).toBeDefined();
    });
  });

  describe("getPriorityColor", () => {
    it("should return correct colors", () => {
      expect(getPriorityColor("high")).toBe("bg-red-500");
      expect(getPriorityColor("medium")).toBe("bg-yellow-500");
      expect(getPriorityColor("low")).toBe("bg-green-500");
    });
  });
});
