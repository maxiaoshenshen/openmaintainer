import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RetryMechanism } from './retry-mechanism';

describe('RetryMechanism', () => {
  describe('basic retry behavior', () => {
    it('should succeed on first attempt', async () => {
      const retry = new RetryMechanism({ maxAttempts: 3 });
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await retry.execute(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const retry = new RetryMechanism({ maxAttempts: 3, initialDelay: 10 });
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      
      const result = await retry.execute(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      const retry = new RetryMechanism({ maxAttempts: 3, initialDelay: 5 });
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));
      
      await expect(retry.execute(fn)).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const retry = new RetryMechanism({ maxAttempts: 3, initialDelay: 5, onRetry });
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      
      await retry.execute(fn);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), 5);
    });

    it('should filter retryable errors', async () => {
      const retry = new RetryMechanism({
        maxAttempts: 3,
        initialDelay: 5,
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
        initialDelay: 10,
        backoffMultiplier: 2,
        onRetry: (_, __, delay) => delays.push(delay)
      });
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      
      await retry.execute(fn);
      
      expect(delays).toEqual([10, 20]);
    });
  });
});
