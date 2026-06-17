import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should start in closed state', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, successThreshold: 2, timeout: 1000 });
    expect(cb.getState()).toBe('closed');
  });

  it('should execute function in closed state', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, successThreshold: 2, timeout: 1000 });
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await cb.execute(fn);
    expect(result).toBe('success');
    expect(cb.getState()).toBe('closed');
  });

  it('should open after failure threshold', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, successThreshold: 2, timeout: 1000 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    
    for (let i = 0; i < 3; i++) {
      try { await cb.execute(fn); } catch {}
    }
    
    expect(cb.getState()).toBe('open');
  });

  it('should reject when open', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, successThreshold: 1, timeout: 1000 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    
    for (let i = 0; i < 2; i++) {
      try { await cb.execute(fn); } catch {}
    }
    
    await expect(cb.execute(fn)).rejects.toThrow('Circuit breaker is open');
  });

  it('should transition to half-open after timeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, successThreshold: 1, timeout: 1000 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    
    try { await cb.execute(fn); } catch {}
    expect(cb.getState()).toBe('open');
    
    vi.advanceTimersByTime(1001);
    const fn2 = vi.fn().mockResolvedValue('success');
    await cb.execute(fn2);
    expect(cb.getState()).toBe('closed');
  });

  it('should call onStateChange callback', async () => {
    const onStateChange = vi.fn();
    const cb = new CircuitBreaker({ failureThreshold: 1, successThreshold: 1, timeout: 1000, onStateChange });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    
    await cb.execute(fn).catch(() => {});
    await vi.runAllTimersAsync();
    
    expect(cb.getState()).toBe('open');
    expect(onStateChange).toHaveBeenCalledWith('open');
  });

  it('should allow reset', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, successThreshold: 1, timeout: 1000 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    
    await cb.execute(fn).catch(() => {});
    await vi.runAllTimersAsync();
    
    expect(cb.getState()).toBe('open');
    
    cb.reset();
    expect(cb.getState()).toBe('closed');
  });
});
