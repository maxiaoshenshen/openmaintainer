export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  strategy?: "sliding" | "fixed";
}

export interface RateLimitState {
  requests: number;
  resetAt: number;
  remaining: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export class APIRateLimiter {
  private config: Required<RateLimitConfig>;
  private state: RateLimitState;

  constructor(config: RateLimitConfig) {
    this.config = {
      strategy: config.strategy ?? "sliding",
      ...config,
    };

    this.state = {
      requests: 0,
      resetAt: Date.now() + config.windowMs,
      remaining: config.maxRequests,
    };
  }

  check(): RateLimitResult {
    const now = Date.now();

    if (now >= this.state.resetAt) {
      this.reset();
    }

    if (this.state.remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: this.state.resetAt,
        retryAfter: Math.ceil((this.state.resetAt - now) / 1000),
      };
    }

    this.state.requests++;
    this.state.remaining--;

    return {
      allowed: true,
      remaining: this.state.remaining,
      resetAt: this.state.resetAt,
    };
  }

  reserve(): RateLimitResult {
    const result = this.check();

    if (!result.allowed) {
      throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter} seconds.`);
    }

    return result;
  }

  private reset(): void {
    this.state = {
      requests: 0,
      resetAt: Date.now() + this.config.windowMs,
      remaining: this.config.maxRequests,
    };
  }

  getState(): RateLimitState {
    return { ...this.state };
  }

  waitForReset(): Promise<void> {
    return new Promise((resolve) => {
      const waitMs = this.state.resetAt - Date.now();
      setTimeout(resolve, Math.max(0, waitMs));
    });
  }

  static createGitHubLimiter(): APIMultiLimiter {
    return new APIMultiLimiter([
      { name: "rest", config: { maxRequests: 5000, windowMs: 3600000 } },
      { name: "graphql", config: { maxRequests: 5000, windowMs: 3600000 } },
      { name: "search", config: { maxRequests: 30, windowMs: 60000 } },
    ]);
  }
}

export class APIMultiLimiter {
  private limiters: Map<string, APIRateLimiter> = new Map();

  constructor(limiters: { name: string; config: RateLimitConfig }[]) {
    for (const { name, config } of limiters) {
      this.limiters.set(name, new APIRateLimiter(config));
    }
  }

  check(apiName: string): RateLimitResult {
    const limiter = this.limiters.get(apiName);
    if (!limiter) {
      return { allowed: true, remaining: Infinity, resetAt: 0 };
    }
    return limiter.check();
  }

  reserve(apiName: string): RateLimitResult {
    const limiter = this.limiters.get(apiName);
    if (!limiter) {
      return { allowed: true, remaining: Infinity, resetAt: 0 };
    }
    return limiter.reserve();
  }

  getAllStates(): Record<string, RateLimitState> {
    const states: Record<string, RateLimitState> = {};
    for (const [name, limiter] of this.limiters) {
      states[name] = limiter.getState();
    }
    return states;
  }

  async waitForAnyReset(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const limiter of this.limiters.values()) {
      promises.push(limiter.waitForReset());
    }
    await Promise.any(promises);
  }
}

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number,
    initialTokens?: number
  ) {
    this.tokens = initialTokens ?? capacity;
    this.lastRefill = Date.now();
  }

  consume(count: number = 1): boolean {
    this.refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  waitForTokens(count: number = 1): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.consume(count)) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
}
