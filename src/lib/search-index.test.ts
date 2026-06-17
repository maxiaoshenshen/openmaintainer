import { describe, it, expect, beforeEach } from "vitest";
import { SearchIndex, type SearchDocument } from "./search-index";

describe("Search Index", () => {
  let index: SearchIndex;

  beforeEach(() => {
    index = new SearchIndex();
  });

  describe("addDocument", () => {
    it("should add document to index", () => {
      const doc: SearchDocument = {
        id: "1",
        type: "issue",
        title: "Bug report",
        body: "Found a bug",
        metadata: {},
        tags: ["bug"],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      index.addDocument(doc);
      expect(index.getStats().totalDocs).toBe(1);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      index.addDocument({
        id: "1",
        type: "issue",
        title: "Login bug",
        body: "Cannot login",
        metadata: {},
        tags: ["bug", "urgent"],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });
      index.addDocument({
        id: "2",
        type: "pr",
        title: "Fix login",
        body: "Login fix",
        metadata: {},
        tags: ["fix", "urgent"],
        createdAt: "2024-01-02",
        updatedAt: "2024-01-02",
      });
      index.addDocument({
        id: "3",
        type: "doc",
        title: "API guide",
        body: "Documentation",
        metadata: {},
        tags: ["docs"],
        createdAt: "2024-01-03",
        updatedAt: "2024-01-03",
      });
    });

    it("should find documents by query", () => {
      const { results, total } = index.search({ query: "login" });
      expect(total).toBeGreaterThan(0);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should filter by type", () => {
      const { results, total } = index.search({
        query: "login",
        filters: { type: "issue" }
      });
      expect(total).toBeGreaterThan(0);
      expect(results[0].document.type).toBe("issue");
    });

    it("should filter by tags", () => {
      const { results, total } = index.search({
        query: "fix",
        filters: { tags: ["fix"] }
      });
      expect(total).toBeGreaterThan(0);
    });

    it("should paginate results", () => {
      const { results, total } = index.search({
        query: "login fix",
        pagination: { page: 1, perPage: 1 }
      });
      expect(results).toHaveLength(1);
    });

    it("should sort by date", () => {
      const { results } = index.search({
        query: "login fix",
        sort: "date"
      });
      expect(results.length).toBeGreaterThan(0);
    });

    it("should generate highlights", () => {
      const { results } = index.search({ query: "login" });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("deleteDocument", () => {
    it("should remove document", () => {
      index.addDocument({
        id: "1",
        type: "issue",
        title: "Test",
        body: "Content",
        metadata: {},
        tags: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });
      index.deleteDocument("1");
      expect(index.getStats().totalDocs).toBe(0);
    });
  });
});
