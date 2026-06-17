/**
 * Retry Mechanism - Automatic retry with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

export class RetryMechanism {
  private readonly maxAttempts: number;
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly backoffMultiplier: number;
  private readonly retryableErrors: (error: unknown) => boolean;
  private readonly onRetry: (attempt: number, error: unknown, delay: number) => void;

  constructor(options: RetryOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 3;
    this.initialDelay = options.initialDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 30000;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
    this.retryableErrors = options.retryableErrors ?? (() => true);
    this.onRetry = options.onRetry ?? (() => {});
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    let delay = this.initialDelay;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === this.maxAttempts) break;
        if (!this.retryableErrors(error)) throw error;

        this.onRetry(attempt, error, delay);
        await this.sleep(delay);
        delay = Math.min(delay * this.backoffMultiplier, this.maxDelay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const retry = new RetryMechanism();
