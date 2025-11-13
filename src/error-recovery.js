/**
 * Error Recovery - v1.12.0
 * Robust error handling and recovery strategies
 * 
 * Features:
 * - Retry mechanisms with exponential backoff
 * - Partial result handling
 * - Graceful degradation
 * - Error classification
 * - Recovery strategies
 */

export class ErrorRecovery {
  constructor(options = {}) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      backoffMultiplier: options.backoffMultiplier || 2,
      retryableErrors: options.retryableErrors || ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'FETCH_ERROR'],
      enabled: options.enabled !== false
    };

    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      partialResults: 0
    };
  }

  /**
   * Execute function with retry logic
   * @param {Function} fn - Function to execute
   * @param {Object} options - Retry options
   * @returns {Promise<*>} Function result
   */
  async retry(fn, options = {}) {
    const maxRetries = options.maxRetries || this.options.maxRetries;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      this.stats.totalAttempts++;

      try {
        const result = await fn();
        
        if (attempt > 0) {
          this.stats.successfulRetries++;
        }
        
        return result;
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this._isRetryable(error)) {
          throw error;
        }

        // Last attempt, throw error
        if (attempt === maxRetries) {
          this.stats.failedRetries++;
          throw error;
        }

        // Calculate backoff delay
        const delay = this._calculateBackoff(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   * @private
   */
  _isRetryable(error) {
    if (!this.options.enabled) {
      return false;
    }

    const errorCode = error.code || error.message || '';
    
    return this.options.retryableErrors.some(retryable => 
      errorCode.includes(retryable)
    );
  }

  /**
   * Calculate exponential backoff delay
   * @private
   */
  _calculateBackoff(attempt) {
    const delay = Math.min(
      this.options.initialDelay * Math.pow(this.options.backoffMultiplier, attempt),
      this.options.maxDelay
    );
    
    // Add jitter (random ±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    
    return Math.round(delay + jitter);
  }

  /**
   * Process batch with partial result handling
   * @param {Array} items - Items to process
   * @param {Function} fn - Processing function
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Results with success/failure breakdown
   */
  async batchWithPartialResults(items, fn, options = {}) {
    const {
      continueOnError = true,
      collectErrors = true
    } = options;

    const results = {
      successful: [],
      failed: [],
      total: items.length,
      successCount: 0,
      failureCount: 0
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        const result = await this.retry(() => fn(item, i));
        results.successful.push({ item, result, index: i });
        results.successCount++;
      } catch (error) {
        results.failureCount++;
        
        if (collectErrors) {
          results.failed.push({ 
            item, 
            error: error.message,
            index: i 
          });
        }

        if (!continueOnError) {
          break;
        }
      }
    }

    if (results.failureCount > 0) {
      this.stats.partialResults++;
    }

    return results;
  }

  /**
   * Graceful degradation wrapper
   * @param {Function} fn - Primary function
   * @param {Function} fallback - Fallback function
   * @returns {Promise<*>} Result
   */
  async withFallback(fn, fallback) {
    try {
      return await this.retry(fn);
    } catch (error) {
      console.warn(`[ErrorRecovery] Primary function failed, using fallback: ${error.message}`);
      
      try {
        return await fallback(error);
      } catch (fallbackError) {
        throw new Error(`Both primary and fallback failed: ${error.message}, ${fallbackError.message}`);
      }
    }
  }

  /**
   * Circuit breaker pattern
   * @param {Function} fn - Function to protect
   * @param {Object} options - Circuit breaker options
   * @returns {Function} Protected function
   */
  createCircuitBreaker(fn, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000
    } = options;

    let state = 'closed'; // closed, open, half-open
    let failureCount = 0;
    let lastFailureTime = 0;

    return async (...args) => {
      // Check if circuit should reset
      if (state === 'open' && Date.now() - lastFailureTime > resetTimeout) {
        state = 'half-open';
        failureCount = 0;
      }

      // Circuit is open, fail fast
      if (state === 'open') {
        throw new Error('Circuit breaker is open');
      }

      try {
        const result = await fn(...args);
        
        // Success - close circuit
        if (state === 'half-open') {
          state = 'closed';
        }
        failureCount = 0;
        
        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = Date.now();

        // Open circuit if threshold reached
        if (failureCount >= failureThreshold) {
          state = 'open';
        }

        throw error;
      }
    };
  }

  /**
   * Get recovery statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalAttempts > 0
        ? ((this.stats.successfulRetries / this.stats.totalAttempts) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      partialResults: 0
    };
  }
}

// Global recovery instance
let globalRecovery = null;

/**
 * Get global error recovery instance
 * @param {Object} options - Recovery options
 * @returns {ErrorRecovery} Recovery instance
 */
export function getErrorRecovery(options = {}) {
  if (!globalRecovery) {
    globalRecovery = new ErrorRecovery(options);
  }
  return globalRecovery;
}

/**
 * Reset global recovery
 */
export function resetErrorRecovery() {
  if (globalRecovery) {
    globalRecovery.resetStats();
  }
  globalRecovery = null;
}

/**
 * Retry helper function
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<*>} Result
 */
export async function retry(fn, options = {}) {
  const recovery = getErrorRecovery();
  return recovery.retry(fn, options);
}

