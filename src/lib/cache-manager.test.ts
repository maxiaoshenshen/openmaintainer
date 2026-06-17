import { describe, it, expect, beforeEach } from "vitest";
import { cacheManager, CacheManager } from "./cache-manager";

describe("CacheManager", () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
  });

  describe("basic operations", () => {
    it("should store and retrieve data", () => {
      cache.set("test-key", { value: "test-data" });
      expect(cache.get("test-key")).toEqual({ value: "test-data" });
    });

    it("should return null for missing keys", () => {
      expect(cache.get("nonexistent")).toBeNull();
    });

    it("should overwrite existing values", () => {
      cache.set("test-key", { value: "first" });
      cache.set("test-key", { value: "second" });
      expect(cache.get("test-key")).toEqual({ value: "second" });
    });
  });

  describe("expiration", () => {
    it("should respect custom TTL", () => {
      cache.set("test-key", { value: "test" }, 10);
      const entry = (cache as any).cache.get("test-key");
      expect(entry.ttl).toBe(10);
    });
  });

  describe("invalidation", () => {
    it("should invalidate by pattern", () => {
      cache.set("repo:owner/repo1", { data: "1" });
      cache.set("repo:owner/repo2", { data: "2" });
      cache.set("analysis:owner/repo1", { data: "3" });
      
      cache.invalidate("repo1");
      expect(cache.get("repo:owner/repo1")).toBeNull();
      expect(cache.get("repo:owner/repo2")).toEqual({ data: "2" });
      expect(cache.get("analysis:owner/repo1")).toBeNull();
    });

    it("should clear all entries", () => {
      cache.set("key1", { value: "1" });
      cache.set("key2", { value: "2" });
      cache.clear();
      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
    });
  });

  describe("stats", () => {
    it("should return cache statistics", () => {
      cache.set("key1", { value: "1" });
      const stats = cache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(100);
    });
  });
});

describe("global cacheManager", () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  it("should cache analysis results", () => {
    const mockAnalysis = { score: 85, actions: [] };
    cacheManager.cacheAnalysis("owner/repo", mockAnalysis as any);
    const cached = cacheManager.getAnalysis("owner/repo");
    expect(cached).toEqual(mockAnalysis);
  });

  it("should cache repository data", () => {
    const mockRepo = { name: "test-repo", stars: 100 };
    cacheManager.cacheRepository("owner/repo", mockRepo);
    const cached = cacheManager.getRepository("owner/repo");
    expect(cached).toEqual(mockRepo);
  });
});
