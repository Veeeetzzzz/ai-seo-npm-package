/**
 * Rate Limiter - v1.12.0
 * Intelligent rate limiting with backoff strategies
 * 
 * Features:
 * - Configurable rate limits
 * - Exponential backoff
 * - Request queuing
 * - Per-domain limits
 * - Statistics tracking
 */

export class RateLimiter {
  constructor(options = {}) {
    this.options = {
      maxRequests: options.maxRequests || 10, // Requests per window
      windowMs: options.windowMs || 60000, // 1 minute default
      strategy: options.strategy || 'fixed', // 'fixed' or 'sliding'
      backoff: options.backoff || 'exponential', // 'exponential' or 'linear'
      maxRetries: options.maxRetries || 3,
      enabled: options.enabled !== false
    };

    // Track requests per domain
    this.domains = new Map();
    
    // Request queue
    this._queue = [];
    this._processing = false;

    // Statistics
    this.stats = {
      total: 0,
      allowed: 0,
      limited: 0,
      queued: 0,
      retries: 0
    };
  }

  /**
   * Check if request is allowed
   * @param {string} url - URL to check
   * @returns {Object} Result with allowed status
   */
  async check(url) {
    if (!this.options.enabled) {
      this.stats.allowed++;
      return { allowed: true, wait: 0 };
    }

    const domain = this._extractDomain(url);
    const now = Date.now();

    if (!this.domains.has(domain)) {
      this.domains.set(domain, {
        requests: [],
        retryCount: 0,
        lastRequest: 0
      });
    }

    const domainData = this.domains.get(domain);

    // Clean old requests
    this._cleanOldRequests(domainData, now);

    // Check if limit reached
    if (domainData.requests.length >= this.options.maxRequests) {
      this.stats.limited++;
      
      const oldestRequest = domainData.requests[0];
      const wait = this.options.windowMs - (now - oldestRequest);
      
      return { 
        allowed: false, 
        wait,
        retryAfter: now + wait
      };
    }

    // Allow request
    domainData.requests.push(now);
    domainData.lastRequest = now;
    this.stats.allowed++;
    this.stats.total++;

    return { allowed: true, wait: 0 };
  }

  /**
   * Wait for rate limit availability
   * @param {string} url - URL to wait for
   * @returns {Promise<void>}
   */
  async waitFor(url) {
    const result = await this.check(url);
    
    if (!result.allowed) {
      await new Promise(resolve => setTimeout(resolve, result.wait));
      return this.waitFor(url); // Recursive retry
    }
  }

  /**
   * Execute function with rate limiting
   * @param {string} url - URL for rate limiting
   * @param {Function} fn - Function to execute
   * @returns {Promise<*>} Function result
   */
  async execute(url, fn) {
    await this.waitFor(url);
    return fn();
  }

  /**
   * Queue request for later execution
   * @param {string} url - URL
   * @param {Function} fn - Function to execute
   * @returns {Promise<*>} Queued promise
   */
  async enqueue(url, fn) {
    this.stats.queued++;
    
    return new Promise((resolve, reject) => {
      this._queue.push({
        url,
        fn,
        resolve,
        reject,
        attempts: 0,
        addedAt: Date.now()
      });

      this._processQueue();
    });
  }

  /**
   * Process queued requests
   * @private
   */
  async _processQueue() {
    if (this._processing || this._queue.length === 0) {
      return;
    }

    this._processing = true;

    while (this._queue.length > 0) {
      const item = this._queue[0];
      
      try {
        await this.waitFor(item.url);
        const result = await item.fn();
        item.resolve(result);
        this._queue.shift();
      } catch (error) {
        item.attempts++;
        
        if (item.attempts >= this.options.maxRetries) {
          item.reject(error);
          this._queue.shift();
        } else {
          this.stats.retries++;
          
          // Calculate backoff wait time
          const backoffWait = this._calculateBackoff(item.attempts);
          await new Promise(resolve => setTimeout(resolve, backoffWait));
        }
      }
    }

    this._processing = false;
  }

  /**
   * Calculate backoff wait time
   * @private
   */
  _calculateBackoff(attempts) {
    if (this.options.backoff === 'exponential') {
      return Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
    } else {
      return Math.min(1000 * attempts, 10000); // Max 10 seconds
    }
  }

  /**
   * Extract domain from URL
   * @private
   */
  _extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Clean old requests from tracking
   * @private
   */
  _cleanOldRequests(domainData, now) {
    const cutoff = now - this.options.windowMs;
    domainData.requests = domainData.requests.filter(time => time > cutoff);
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this._queue.length,
      domains: this.domains.size,
      limitRate: this.stats.total > 0 
        ? ((this.stats.limited / this.stats.total) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Get domain statistics
   * @param {string} domain - Domain name
   * @returns {Object} Domain stats
   */
  getDomainStats(domain) {
    if (!this.domains.has(domain)) {
      return null;
    }

    const data = this.domains.get(domain);
    const now = Date.now();
    this._cleanOldRequests(data, now);

    return {
      domain,
      currentRequests: data.requests.length,
      maxRequests: this.options.maxRequests,
      remaining: this.options.maxRequests - data.requests.length,
      lastRequest: data.lastRequest,
      timeSinceLastRequest: now - data.lastRequest
    };
  }

  /**
   * Reset domain rate limit
   * @param {string} domain - Domain to reset
   */
  resetDomain(domain) {
    this.domains.delete(domain);
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.domains.clear();
    this._queue = [];
    this.stats = {
      total: 0,
      allowed: 0,
      limited: 0,
      queued: 0,
      retries: 0
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    for (const item of this._queue) {
      item.reject(new Error('Queue cleared'));
    }
    this._queue = [];
  }

  /**
   * Get queue size
   * @returns {number} Queue size
   */
  getQueueSize() {
    return this._queue.length;
  }

  /**
   * Batch process URLs with rate limiting
   * @param {string[]} urls - URLs to process
   * @param {Function} fn - Function to call for each URL
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Results
   */
  async batchProcess(urls, fn, options = {}) {
    const {
      concurrency = 3,
      onProgress = null
    } = options;

    const results = [];
    const active = new Set();

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      // Wait if we're at concurrency limit
      while (active.size >= concurrency) {
        await Promise.race(active);
      }

      const promise = this.execute(url, () => fn(url))
        .then(result => {
          results[i] = result;
          active.delete(promise);
          
          if (onProgress) {
            onProgress(url, i + 1, urls.length);
          }
          
          return result;
        })
        .catch(error => {
          results[i] = { error: error.message, url };
          active.delete(promise);
          return results[i];
        });

      active.add(promise);
    }

    // Wait for remaining promises
    await Promise.all(active);

    return results;
  }
}

// Global rate limiter instance
let globalLimiter = null;

/**
 * Get global rate limiter instance
 * @param {Object} options - Limiter options
 * @returns {RateLimiter} Rate limiter instance
 */
export function getRateLimiter(options = {}) {
  if (!globalLimiter) {
    globalLimiter = new RateLimiter(options);
  }
  return globalLimiter;
}

/**
 * Reset global rate limiter
 */
export function resetRateLimiter() {
  if (globalLimiter) {
    globalLimiter.resetAll();
  }
  globalLimiter = null;
}

