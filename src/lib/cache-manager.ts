/**
 * Cache Manager - Intelligent caching system for maintainer operations
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiry: number;
  createdAt: number;
  hits: number;
  size?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  size: number;
  hitRate: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize?: number;
  maxEntries?: number;
  compression?: boolean;
}

/**
 * LRU Cache with TTL support
 */
export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats = { hits: 0, misses: 0 };

  constructor(config: CacheConfig) {
    this.config = config;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiry = now + (ttl || this.config.ttl);

    // Enforce max entries
    if (this.cache.size >= (this.config.maxEntries || 1000) && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      key,
      value,
      expiry,
      createdAt: now,
      hits: 0,
      size: this.estimateSize(value),
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  private evictLRU(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.hits === 0 && entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldest = key;
      }
    }

    if (oldest) {
      this.cache.delete(oldest);
    } else {
      // If all have hits, delete oldest by creation time
      for (const [key, entry] of this.cache) {
        if (entry.createdAt < oldestTime) {
          oldestTime = entry.createdAt;
          oldest = key;
        }
      }
      if (oldest) this.cache.delete(oldest);
    }
  }

  private estimateSize(value: T): number {
    return JSON.stringify(value).length;
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.cache.size,
      size: Array.from(this.cache.values()).reduce((sum, e) => sum + (e.size || 0), 0),
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.cache) {
      if (entry.expiry < now) {
        this.cache.delete(key);
        pruned++;
      }
    }
    return pruned;
  }
}

/**
 * Create a cache for GitHub API responses
 */
export function createGitHubCache(ttl = 60000): CacheManager {
  return new CacheManager({ ttl, maxEntries: 500 });
}

/**
 * Create a cache for user sessions
 */
export function createSessionCache(ttl = 3600000): CacheManager {
  return new CacheManager({ ttl, maxEntries: 10000 });
}
