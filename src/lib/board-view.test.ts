import { describe, it, expect } from "vitest";
import {
  getPriorityFromLabels,
  getPriorityColor,
  buildBoardFromAnalysis,
  countBoardItems,
} from "./board-view";

describe("board-view", () => {
  describe("getPriorityFromLabels", () => {
    it("should detect high priority from urgent labels", () => {
      expect(getPriorityFromLabels(["urgent", "bug"])).toBe("high");
      expect(getPriorityFromLabels(["critical"])).toBe("high");
      expect(getPriorityFromLabels(["P0"])).toBe("high");
    });

    it("should detect medium priority", () => {
      expect(getPriorityFromLabels(["medium"])).toBe("medium");
      expect(getPriorityFromLabels(["P1"])).toBe("medium");
    });

    it("should default to low priority", () => {
      expect(getPriorityFromLabels(["question"])).toBe("low");
      expect(getPriorityFromLabels([])).toBe("low");
    });
  });

  describe("getPriorityColor", () => {
    it("should return correct border colors", () => {
      expect(getPriorityColor("high")).toContain("red");
      expect(getPriorityColor("medium")).toContain("yellow");
      expect(getPriorityColor("low")).toContain("green");
    });
  });

  describe("buildBoardFromAnalysis", () => {
    it("should create 5 columns", () => {
      const mockAnalysis = {
        inbox: {
          issues: [
            {
              number: 1,
              title: "Test Issue",
              author: "user1",
              labels: ["bug"],
              createdAt: "2024-01-01",
              updatedAt: "2024-01-01",
              comments: 0,
              url: "https://github.com/test/1",
              state: "open" as const,
            },
          ],
          pullRequests: [],
        },
      };
      
      
      const columns = buildBoardFromAnalysis(mockAnalysis);
      expect(columns).toHaveLength(5);
      expect(columns[0].id).toBe("needs-triage");
    });

    it("should categorize blocked items", () => {
      const mockAnalysis = {
        inbox: {
          issues: [
            {
              number: 1,
              title: "Blocked Issue",
              author: "user1",
              labels: ["blocked"],
              createdAt: "2024-01-01",
              updatedAt: "2024-01-01",
              comments: 0,
              url: "https://github.com/test/1",
              state: "open" as const,
            },
          ],
          pullRequests: [],
        },
      };
      
      
      const columns = buildBoardFromAnalysis(mockAnalysis);
      const blockedColumn = columns.find(c => c.id === "blocked");
      expect(blockedColumn?.items).toHaveLength(1);
    });
  });

  describe("countBoardItems", () => {
    it("should count items per column", () => {
      const columns = [
        { id: "col1", title: "Column 1", color: "blue", items: [{ id: "1" }, { id: "2" }] },
        { id: "col2", title: "Column 2", color: "red", items: [{ id: "3" }] },
      ];
      const counts = countBoardItems(columns);
      expect(counts.col1).toBe(2);
      expect(counts.col2).toBe(1);
    });
  });
});
