/**
 * Rate Limiter - API rate limiting and quota management
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
  skipFailedRequests?: boolean;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitRecord {
  key: string;
  count: number;
  resetTime: number;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  reset: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  current: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * In-memory rate limit store
 */
export class RateLimitStore {
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.records) {
        if (record.resetTime < now) {
          this.records.delete(key);
        }
      }
    }, 60000);
  }

  get(key: string): RateLimitRecord | undefined {
    return this.records.get(key);
  }

  set(key: string, record: RateLimitRecord) {
    this.records.set(key, record);
  }

  increment(key: string, windowMs: number, maxRequests: number): RateLimitRecord {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || record.resetTime < now) {
      const newRecord: RateLimitRecord = {
        key,
        count: 1,
        resetTime: now + windowMs,
      };
      this.records.set(key, newRecord);
      return newRecord;
    }

    record.count++;
    return record;
  }

  reset(key: string) {
    this.records.delete(key);
  }

  resetAll() {
    this.records.clear();
  }

  getStats() {
    return {
      totalKeys: this.records.size,
      blockedKeys: Array.from(this.records.values()).filter(r => r.count > 0).length,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Rate Limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;
  private defaultKeyGenerator: (req: any) => string;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = config;
    this.store = store || new RateLimitStore();
    this.defaultKeyGenerator = (req: any) => {
      return req.ip || req.headers?.["x-forwarded-for"] || req.userId || "anonymous";
    };
  }

  private getKey(req: any): string {
    return this.config.keyGenerator?.(req) || this.defaultKeyGenerator(req);
  }

  private getCurrentCount(key: string): number {
    const record = this.store.get(key);
    if (!record || record.resetTime < Date.now()) return 0;
    return record.count;
  }

  check(req: any): RateLimitResult {
    const key = this.getKey(req);
    const count = this.getCurrentCount(key);
    const now = Date.now();
    const record = this.store.get(key);

    const remaining = Math.max(0, this.config.maxRequests - count);
    const resetTime = record?.resetTime || (now + this.config.windowMs);

    return {
      success: remaining > 0,
      limit: this.config.maxRequests,
      current: count,
      remaining,
      reset: Math.ceil(resetTime / 1000),
    };
  }

  consume(req: any): RateLimitResult {
    const key = this.getKey(req);
    const currentCount = this.getCurrentCount(key);
    const now = Date.now();
    
    // Check if already over limit
    if (currentCount >= this.config.maxRequests) {
      const record = this.store.get(key)!;
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return {
        success: false,
        limit: this.config.maxRequests,
        current: currentCount,
        remaining: 0,
        reset: Math.ceil(record.resetTime / 1000),
        retryAfter: retryAfter > 0 ? retryAfter : 0,
      };
    }

    // Increment counter
    const record = this.store.increment(key, this.config.windowMs, this.config.maxRequests);
    const newCount = record.count;
    const remaining = Math.max(0, this.config.maxRequests - newCount);

    return {
      success: true,
      limit: this.config.maxRequests,
      current: newCount,
      remaining,
      reset: Math.ceil(record.resetTime / 1000),
    };
  }

  getInfo(req: any): RateLimitInfo {
    const result = this.check(req);
    return {
      limit: result.limit,
      current: result.current,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  reset(req: any) {
    const key = this.getKey(req);
    this.store.reset(key);
  }

  getStats() {
    return this.store.getStats();
  }
}

/**
 * Create default rate limiter for API endpoints
 */
export function createApiRateLimiter() {
  return new RateLimiter({
    windowMs: 60000,
    maxRequests: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Create strict rate limiter for authentication endpoints
 */
export function createAuthRateLimiter() {
  return new RateLimiter({
    windowMs: 900000,
    maxRequests: 5,
    standardHeaders: true,
  });
}

/**
 * Create webhooks rate limiter
 */
export function createWebhookRateLimiter() {
  return new RateLimiter({
    windowMs: 1000,
    maxRequests: 10,
    standardHeaders: true,
  });
}
