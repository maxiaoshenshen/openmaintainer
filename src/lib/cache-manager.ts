/**
 * Cache Manager - In-memory cache with TTL and LRU eviction
 */

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  onEvict?: (key: string, value: unknown) => void;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessCount: number;
}

export class CacheManager<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number;
  private maxSize: number;
  private onEvict?: (key: string, value: unknown) => void;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 60000;
    this.maxSize = options.maxSize ?? 1000;
    this.onEvict = options.onEvict;
  }

  set(key: string, value: T, ttl?: number): void {
    this.evictIfNeeded();
    
    const expiresAt = Date.now() + (ttl ?? this.ttl);
    this.cache.set(key, { value, expiresAt, accessCount: 0 });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }

    entry.accessCount++;
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.onEvict?.(key, entry.value);
      return this.cache.delete(key);
    }
    return false;
  }

  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.cache) {
        this.onEvict(key, entry.value);
      }
    }
    this.cache.clear();
  }

  private evictIfNeeded(): void {
    while (this.cache.size >= this.maxSize) {
      const lruKey = this.findLRUKey();
      if (lruKey) {
        const entry = this.cache.get(lruKey);
        if (entry) {
          this.onEvict?.(lruKey, entry.value);
        }
        this.cache.delete(lruKey);
      } else {
        break;
      }
    }
  }

  private findLRUKey(): string | undefined {
    let oldest: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < oldestTime) {
        oldestTime = entry.accessCount;
        oldest = key;
      }
    }
    return oldest;
  }

  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

// Backward compatibility export
export const cacheManager = new CacheManager();
