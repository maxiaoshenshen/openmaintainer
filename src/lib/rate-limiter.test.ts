import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { RateLimitStore, RateLimiter, createApiRateLimiter } from "./rate-limiter";

describe("Rate Limiter", () => {
  describe("RateLimitStore", () => {
    let store: RateLimitStore;

    beforeEach(() => {
      store = new RateLimitStore();
    });

    afterEach(() => {
      store.destroy();
    });

    it("should track request count", () => {
      const record = store.increment("test", 60000, 10);
      
      expect(record.count).toBe(1);
      expect(record.key).toBe("test");
    });

    it("should increment count", () => {
      store.increment("test", 60000, 10);
      const record = store.increment("test", 60000, 10);
      
      expect(record.count).toBe(2);
    });

    it("should reset individual keys", () => {
      store.increment("test", 60000, 10);
      store.reset("test");
      
      expect(store.get("test")).toBeUndefined();
    });

    it("should return stats", () => {
      store.increment("key1", 60000, 10);
      store.increment("key2", 60000, 10);
      
      const stats = store.getStats();
      expect(stats.totalKeys).toBe(2);
    });
  });

  describe("RateLimiter", () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });
    });

    it("should allow requests within limit", () => {
      for (let i = 0; i < 5; i++) {
        const result = limiter.consume({ ip: "192.168.1.1" });
        expect(result.success).toBe(true);
      }
    });

    it("should block requests over limit", () => {
      for (let i = 0; i < 5; i++) {
        limiter.consume({ ip: "192.168.1.2" });
      }
      
      const result = limiter.consume({ ip: "192.168.1.2" });
      expect(result.success).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it("should track remaining requests", () => {
      const result1 = limiter.consume({ ip: "192.168.1.3" });
      expect(result1.remaining).toBe(4);
      
      const result2 = limiter.consume({ ip: "192.168.1.3" });
      expect(result2.remaining).toBe(3);
    });

    it("should separate by IP address", () => {
      limiter.consume({ ip: "192.168.1.4" });
      const result = limiter.consume({ ip: "192.168.1.5" });
      
      expect(result.remaining).toBe(4);
    });

    it("should reset individual IPs", () => {
      limiter.consume({ ip: "192.168.1.6" });
      limiter.consume({ ip: "192.168.1.6" });
      limiter.reset({ ip: "192.168.1.6" });
      
      const result = limiter.check({ ip: "192.168.1.6" });
      expect(result.remaining).toBe(5);
    });
  });

  describe("createApiRateLimiter", () => {
    it("should create limiter with defaults", () => {
      const limiter = createApiRateLimiter();
      const result = limiter.consume({ ip: "10.0.0.1" });
      
      expect(result.limit).toBe(100);
      expect(result.success).toBe(true);
    });
  });
});
