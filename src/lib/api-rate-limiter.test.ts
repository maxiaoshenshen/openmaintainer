import { describe, it, expect } from "vitest";
import { APIRateLimiter, APIMultiLimiter, TokenBucket } from "./api-rate-limiter";

describe("APIRateLimiter", () => {
  it("allows requests under limit", () => {
    const limiter = new APIRateLimiter({ maxRequests: 10, windowMs: 1000 });
    const result = limiter.check();
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("blocks requests over limit", () => {
    const limiter = new APIRateLimiter({ maxRequests: 2, windowMs: 1000 });
    limiter.check();
    limiter.check();
    const result = limiter.check();
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window", async () => {
    const limiter = new APIRateLimiter({ maxRequests: 2, windowMs: 100 });
    limiter.check();
    limiter.check();
    expect(limiter.check().allowed).toBe(false);
    
    await new Promise(r => setTimeout(r, 150));
    const result = limiter.check();
    expect(result.allowed).toBe(true);
  });

  it("creates GitHub limiter with multiple APIs", () => {
    const limiter = APIRateLimiter.createGitHubLimiter();
    expect(limiter).toBeInstanceOf(APIMultiLimiter);
  });
});

describe("APIMultiLimiter", () => {
  it("manages multiple API limits", () => {
    const limiter = new APIMultiLimiter([
      { name: "api1", config: { maxRequests: 5, windowMs: 1000 } },
      { name: "api2", config: { maxRequests: 3, windowMs: 1000 } },
    ]);

    expect(limiter.check("api1").remaining).toBe(4);
    expect(limiter.check("api2").remaining).toBe(2);
  });

  it("returns unlimited for unknown API", () => {
    const limiter = new APIMultiLimiter([
      { name: "api1", config: { maxRequests: 5, windowMs: 1000 } },
    ]);

    expect(limiter.check("unknown").allowed).toBe(true);
    expect(limiter.check("unknown").remaining).toBe(Infinity);
  });
});

describe("TokenBucket", () => {
  it("consumes tokens", () => {
    const bucket = new TokenBucket(5, 1);
    expect(bucket.consume()).toBe(true);
    expect(bucket.getTokens()).toBeLessThan(5);
  });

  it("refuses when empty", () => {
    const bucket = new TokenBucket(1, 0.1);
    bucket.consume();
    expect(bucket.consume()).toBe(false);
  });
});
