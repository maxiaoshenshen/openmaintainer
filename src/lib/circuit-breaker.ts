/**
 * Circuit Breaker - Prevent cascading failures
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  onStateChange?: (state: CircuitState) => void;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private nextAttempt = 0;

  constructor(private options: Required<CircuitBreakerOptions>) {}

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
      this.options.onStateChange?.('half-open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.reset();
      }
    }
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.successes = 0;

    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.options.timeout;
      this.options.onStateChange?.('open');
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = 0;
    this.options.onStateChange?.('closed');
  }
}

export const createCircuitBreaker = (options?: CircuitBreakerOptions) => {
  return new CircuitBreaker({
    failureThreshold: options?.failureThreshold ?? 5,
    successThreshold: options?.successThreshold ?? 2,
    timeout: options?.timeout ?? 60000,
    onStateChange: options?.onStateChange
  });
};
