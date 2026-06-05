import { describe, it, expect } from "vitest";
import {
  buildKanbanView,
  getColumnStats,
  exportKanbanAsMarkdown,
  type KanbanColumn,
} from "./kanban-view";

describe("kanban-view", () => {
  const mockInbox = {
    items: [
      {
        id: "1",
        type: "issue" as const,
        title: "Bug report",
        number: 1,
        author: "user1",
        labels: ["bug"],
        age: "2 days",
        priority: "P0",
        isStale: false,
        url: "https://github.com/repo/issues/1",
        isPR: false,
      },
      {
        id: "2",
        type: "pr" as const,
        title: "Feature PR",
        number: 2,
        author: "user2",
        labels: ["enhancement"],
        age: "20 days",
        priority: "P2",
        isStale: true,
        url: "https://github.com/repo/pull/2",
        isPR: true,
      },
      {
        id: "3",
        type: "issue" as const,
        title: "Question",
        number: 3,
        author: "user3",
        labels: [],
        age: "1 day",
        priority: "P3",
        isStale: false,
        url: "https://github.com/repo/issues/3",
        isPR: false,
      },
    ],
    totalCount: 3,
    unreadCount: 2,
  };

  describe("buildKanbanView", () => {
    it("should build status kanban", () => {
      const columns = buildKanbanView(mockInbox, "status");
      expect(columns.length).toBe(3);
      expect(columns.find(c => c.id === "attention")).toBeDefined();
    });

    it("should build priority kanban", () => {
      const columns = buildKanbanView(mockInbox, "priority");
      expect(columns.length).toBe(3);
      expect(columns.find(c => c.id === "high")).toBeDefined();
    });

    it("should build age kanban", () => {
      const columns = buildKanbanView(mockInbox, "age");
      expect(columns.length).toBe(3);
      expect(columns.find(c => c.id === "stale")).toBeDefined();
    });
  });

  describe("getColumnStats", () => {
    it("should count items correctly", () => {
      const column: KanbanColumn = {
        id: "test",
        title: "Test",
        color: "border-blue-500",
        items: [
          { id: "1", type: "issue", title: "Issue 1", number: 1, author: "a", labels: [], age: "1d", priority: "low", isStale: false, url: "" },
          { id: "2", type: "pr", title: "PR 1", number: 2, author: "b", labels: [], age: "2d", priority: "low", isStale: false, url: "" },
          { id: "3", type: "issue", title: "Issue 2", number: 3, author: "c", labels: [], age: "3d", priority: "low", isStale: false, url: "" },
        ],
      };
      const stats = getColumnStats(column);
      expect(stats.total).toBe(3);
      expect(stats.issues).toBe(2);
      expect(stats.prs).toBe(1);
    });
  });

  describe("exportKanbanAsMarkdown", () => {
    it("should export as valid markdown", () => {
      const columns: KanbanColumn[] = [
        {
          id: "open",
          title: "Open",
          color: "border-blue-500",
          items: [
            { id: "1", type: "issue", title: "Test Issue", number: 1, author: "user", labels: [], age: "1d", priority: "low", isStale: false, url: "https://github.com/test" },
          ],
        },
      ];
      const md = exportKanbanAsMarkdown(columns);
      expect(md).toContain("# Kanban Board");
      expect(md).toContain("Open");
      expect(md).toContain("Test Issue");
    });
  });
});
