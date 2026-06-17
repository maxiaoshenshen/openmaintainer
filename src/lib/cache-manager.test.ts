import { describe, it, expect, beforeEach } from "vitest";
import { CacheManager, createGitHubCache, createSessionCache } from "./cache-manager";

describe("Cache Manager", () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({ ttl: 1000, maxEntries: 10 });
  });

  describe("set and get", () => {
    it("should store and retrieve values", () => {
      cache.set("key1", { data: "test" });
      expect(cache.get("key1")).toEqual({ data: "test" });
    });

    it("should return undefined for missing keys", () => {
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("should overwrite existing values", () => {
      cache.set("key1", "value1");
      cache.set("key1", "value2");
      expect(cache.get("key1")).toBe("value2");
    });
  });

  describe("expiry", () => {
    it("should expire entries after TTL", async () => {
      const shortCache = new CacheManager({ ttl: 50, maxEntries: 10 });
      shortCache.set("expiring", "data");
      
      expect(shortCache.get("expiring")).toBe("data");
      
      await new Promise(r => setTimeout(r, 100));
      expect(shortCache.get("expiring")).toBeUndefined();
    });

    it("should respect custom TTL", async () => {
      cache.set("custom", "data", 50);
      expect(cache.get("custom")).toBe("data");
      
      await new Promise(r => setTimeout(r, 100));
      expect(cache.get("custom")).toBeUndefined();
    });
  });

  describe("has", () => {
    it("should return true for existing keys", () => {
      cache.set("test", "value");
      expect(cache.has("test")).toBe(true);
    });

    it("should return false for missing keys", () => {
      expect(cache.has("missing")).toBe(false);
    });

    it("should return false for expired keys", async () => {
      const shortCache = new CacheManager({ ttl: 50, maxEntries: 10 });
      shortCache.set("expired", "data");
      
      await new Promise(r => setTimeout(r, 100));
      expect(shortCache.has("expired")).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete existing keys", () => {
      cache.set("deleteMe", "value");
      expect(cache.delete("deleteMe")).toBe(true);
      expect(cache.get("deleteMe")).toBeUndefined();
    });

    it("should return false for missing keys", () => {
      expect(cache.delete("missing")).toBe(false);
    });
  });

  describe("clear", () => {
    it("should clear all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();
      
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
    });
  });

  describe("stats", () => {
    it("should track hits and misses", () => {
      cache.set("key1", "value1");
      cache.get("key1");
      cache.get("missing");
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it("should calculate hit rate", () => {
      cache.set("key", "value");
      cache.get("key");
      cache.get("key");
      cache.get("missing");
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it("should count keys", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      
      expect(cache.getStats().keys).toBe(2);
    });
  });

  describe("prune", () => {
    it("should remove expired entries", async () => {
      const shortCache = new CacheManager({ ttl: 50, maxEntries: 10 });
      shortCache.set("expiring", "data");
      shortCache.set("persistent", "data", 10000);
      
      await new Promise(r => setTimeout(r, 100));
      const pruned = shortCache.prune();
      
      expect(pruned).toBeGreaterThanOrEqual(1);
      expect(shortCache.get("persistent")).toBe("data");
    });
  });

  describe("createGitHubCache", () => {
    it("should create cache with default settings", () => {
      const ghCache = createGitHubCache();
      ghCache.set("repo", { name: "test" });
      expect(ghCache.get("repo")).toEqual({ name: "test" });
    });
  });

  describe("createSessionCache", () => {
    it("should create cache with session settings", () => {
      const sessionCache = createSessionCache();
      sessionCache.set("session1", { userId: "123" });
      expect(sessionCache.get("session1")).toEqual({ userId: "123" });
    });
  });

  describe("keys", () => {
    it("should list all keys", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      
      const keys = cache.keys();
      expect(keys).toContain("key1");
      expect(keys).toContain("key2");
    });
  });
});
