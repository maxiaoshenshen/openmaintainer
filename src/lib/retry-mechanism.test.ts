import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetryMechanism } from './retry-mechanism';

describe('RetryMechanism', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should succeed on first attempt', async () => {
    const retry = new RetryMechanism({ maxAttempts: 3 });
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await retry.execute(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const retry = new RetryMechanism({ maxAttempts: 3, initialDelay: 100 });
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    
    const promise = retry.execute(fn);
    await vi.runAllTimersAsync();
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max attempts', async () => {
    const retry = new RetryMechanism({ maxAttempts: 3, initialDelay: 100 });
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    
    const promise = retry.execute(fn);
    await vi.runAllTimersAsync();
    
    await expect(promise).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn();
    const retry = new RetryMechanism({ maxAttempts: 3, initialDelay: 100, onRetry });
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    
    const promise = retry.execute(fn);
    await vi.runAllTimersAsync();
    await promise;
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), 100);
  });

  it('should filter retryable errors', async () => {
    const retry = new RetryMechanism({
      maxAttempts: 3,
      initialDelay: 100,
      retryableErrors: (e) => (e as Error).message !== 'no-retry'
    });
    const fn = vi.fn().mockRejectedValue(new Error('no-retry'));
    
    await expect(retry.execute(fn)).rejects.toThrow('no-retry');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    const delays: number[] = [];
    const retry = new RetryMechanism({
      maxAttempts: 4,
      initialDelay: 100,
      backoffMultiplier: 2,
      onRetry: (_, __, delay) => delays.push(delay)
    });
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    
    const promise = retry.execute(fn);
    await vi.runAllTimersAsync();
    await promise;
    
    expect(delays).toEqual([100, 200]);
  });
});
