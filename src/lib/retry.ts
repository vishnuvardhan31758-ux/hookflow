/**
 * Exponential Backoff with Decorrelated / Full Jitter
 * Reference: AWS Architecture Blog - "Exponential Backoff And Jitter"
 * Formula: sleep = min(cap, base * 2 ** attempt) + random_jitter
 *
 * Prevents the "Thundering Herd Problem" where multiple retrying clients synchronize
 * their retry storms and repeatedly take down recovering servers.
 */

export interface BackoffConfig {
  baseDelayMs: number; // e.g. 1000ms (1s)
  maxDelayMs: number;  // e.g. 60000ms (60s)
  factor: number;      // e.g. 2
  jitter: boolean;     // whether to apply random jitter
}

export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  baseDelayMs: 1000,
  maxDelayMs: 32000,
  factor: 2,
  jitter: true,
};

export function calculateBackoffDelay(
  attempt: number,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG
): number {
  if (attempt <= 0) return 0;

  // Calculate exponential delay: base * factor^(attempt - 1)
  const exponential = config.baseDelayMs * Math.pow(config.factor, attempt - 1);
  const capped = Math.min(config.maxDelayMs, exponential);

  if (!config.jitter) {
    return Math.floor(capped);
  }

  // Full jitter: uniformly distributed random delay between 0 and capped
  // In practice, we ensure at least baseDelay/2 so it doesn't fire instantaneously
  const minJitter = config.baseDelayMs * 0.5;
  const jitterRange = capped - minJitter;
  const delay = minJitter + Math.random() * (jitterRange > 0 ? jitterRange : capped);

  return Math.floor(delay);
}

export function shouldRetry(statusCode?: number): boolean {
  if (!statusCode) return true; // Network errors (timeout, DNS failure, ECONNRESET) are retryable

  // 4xx errors are client errors (e.g. 400 Bad Request, 401 Unauthorized, 404 Not Found)
  // Exception: 429 Too Many Requests is retryable
  if (statusCode === 429) return true;

  if (statusCode >= 400 && statusCode < 500) {
    return false; // Do not retry client errors; payload is fundamentally flawed
  }

  // 5xx errors are server errors (500, 502, 503, 504) and are retryable
  return statusCode >= 500 && statusCode <= 599;
}
