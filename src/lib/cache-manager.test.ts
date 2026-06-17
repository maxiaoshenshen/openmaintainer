import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from './cache-manager';

describe('CacheManager', () => {
  let cache: CacheManager<string>;

  beforeEach(() => {
    cache = new CacheManager({ ttl: 1000, maxSize: 3 });
  });

  it('should store and retrieve values', () => {
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });

  it('should return undefined for missing keys', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('should expire entries after TTL', async () => {
    cache.set('key', 'value', 50);
    expect(cache.get('key')).toBe('value');
    
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(cache.get('key')).toBeUndefined();
  });

  it('should evict LRU entries when max size reached', () => {
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    
    cache.get('a');
    cache.set('d', '4');
    
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe('3');
    expect(cache.get('d')).toBe('4');
  });

  it('should check existence with has()', () => {
    cache.set('key', 'value');
    expect(cache.has('key')).toBe(true);
    expect(cache.has('missing')).toBe(false);
  });

  it('should delete entries', () => {
    cache.set('key', 'value');
    expect(cache.delete('key')).toBe(true);
    expect(cache.has('key')).toBe(false);
  });

  it('should clear all entries', () => {
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('should call onEvict callback', () => {
    const onEvict = vi.fn();
    const cache = new CacheManager({ ttl: 1000, maxSize: 2, onEvict });
    
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    
    expect(onEvict).toHaveBeenCalledWith('a', '1');
  });

  it('should clean expired entries', async () => {
    cache.set('a', '1', 50);
    cache.set('b', '2', 1000);
    
    await new Promise(resolve => setTimeout(resolve, 60));
    
    const cleaned = cache.clean();
    expect(cleaned).toBe(1);
    expect(cache.size()).toBe(1);
  });

  it('should return all keys', () => {
    cache.set('a', '1');
    cache.set('b', '2');
    expect(cache.keys()).toEqual(['a', 'b']);
  });

  it('should return stats', () => {
    const stats = cache.stats();
    expect(stats.size).toBe(0);
    expect(stats.maxSize).toBe(3);
    expect(stats.ttl).toBe(1000);
  });
});
