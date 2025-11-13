// Rate Limiter Tests - v1.12.0
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { RateLimiter, getRateLimiter, resetRateLimiter } from '../src/rate-limiter.js';

describe('Rate Limiter - v1.12.0', () => {
  
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 1000, // 1 second window for testing
      enabled: true
    });
  });

  afterEach(() => {
    limiter.resetAll();
  });

  describe('Basic Rate Limiting', () => {
    
    it('should allow requests under limit', async () => {
      const url = 'https://example.com';
      
      const result1 = await limiter.check(url);
      const result2 = await limiter.check(url);
      const result3 = await limiter.check(url);

      assert.strictEqual(result1.allowed, true);
      assert.strictEqual(result2.allowed, true);
      assert.strictEqual(result3.allowed, true);
    });

    it('should block requests over limit', async () => {
      const url = 'https://example.com';
      
      await limiter.check(url);
      await limiter.check(url);
      await limiter.check(url);
      
      const result4 = await limiter.check(url);

      assert.strictEqual(result4.allowed, false);
      assert.ok(result4.wait > 0);
    });

    it('should reset after time window', async () => {
      const url = 'https://example.com';
      
      await limiter.check(url);
      await limiter.check(url);
      await limiter.check(url);
      
      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await limiter.check(url);
      assert.strictEqual(result.allowed, true);
    });

  });

  describe('Per-Domain Limiting', () => {
    
    it('should limit per domain separately', async () => {
      const url1 = 'https://example.com/page1';
      const url2 = 'https://example.org/page1';
      
      // Fill limit for example.com
      await limiter.check(url1);
      await limiter.check(url1);
      await limiter.check(url1);
      
      // example.org should still be allowed
      const result = await limiter.check(url2);
      assert.strictEqual(result.allowed, true);
    });

    it('should track multiple domains', async () => {
      await limiter.check('https://example.com');
      await limiter.check('https://example.org');
      await limiter.check('https://example.net');

      const stats = limiter.getStats();
      assert.strictEqual(stats.domains, 3);
    });

  });

  describe('Wait and Execute', () => {
    
    it('should wait for rate limit availability', async () => {
      const url = 'https://example.com';
      
      // Fill the limit
      await limiter.check(url);
      await limiter.check(url);
      await limiter.check(url);
      
      const start = Date.now();
      await limiter.waitFor(url);
      const elapsed = Date.now() - start;

      // Should have waited at least close to window time
      assert.ok(elapsed >= 900); // Allow for some timing variance
    });

    it('should execute function with rate limiting', async () => {
      const url = 'https://example.com';
      let executed = false;

      const result = await limiter.execute(url, () => {
        executed = true;
        return 'success';
      });

      assert.strictEqual(executed, true);
      assert.strictEqual(result, 'success');
    });

  });

  describe('Request Queue', () => {
    
    it('should queue requests when limit reached', async () => {
      const url = 'https://example.com';
      
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(limiter.enqueue(url, () => `result${i}`));
      }

      assert.ok(limiter.getQueueSize() > 0);

      const results = await Promise.all(promises);
      assert.strictEqual(results.length, 5);
    });

    it('should process queue in order', async () => {
      const url = 'https://example.com';
      const results = [];

      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(limiter.enqueue(url, () => {
          results.push(i);
          return i;
        }));
      }

      await Promise.all(promises);

      assert.deepStrictEqual(results, [0, 1, 2]);
    });

  });

  describe('Statistics', () => {
    
    it('should track allowed and limited requests', async () => {
      const url = 'https://example.com';
      
      await limiter.check(url); // Allowed
      await limiter.check(url); // Allowed
      await limiter.check(url); // Allowed
      await limiter.check(url); // Limited

      const stats = limiter.getStats();
      assert.strictEqual(stats.allowed, 3);
      assert.strictEqual(stats.limited, 1);
    });

    it('should track queued requests', async () => {
      const url = 'https://example.com';
      
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(limiter.enqueue(url, () => 'result'));
      }

      const stats = limiter.getStats();
      assert.ok(stats.queued >= 5);

      await Promise.all(promises);
    });

    it('should calculate limit rate', async () => {
      const url = 'https://example.com';
      
      await limiter.check(url);
      await limiter.check(url);
      await limiter.check(url);
      await limiter.check(url); // This will be limited

      const stats = limiter.getStats();
      assert.ok(parseFloat(stats.limitRate) > 0);
    });

  });

  describe('Domain Statistics', () => {
    
    it('should provide domain-specific stats', async () => {
      const url = 'https://example.com';
      
      await limiter.check(url);
      await limiter.check(url);

      const domainStats = limiter.getDomainStats('example.com');
      
      assert.ok(domainStats);
      assert.strictEqual(domainStats.currentRequests, 2);
      assert.strictEqual(domainStats.remaining, 1);
    });

    it('should return null for unknown domain', () => {
      const stats = limiter.getDomainStats('unknown.com');
      assert.strictEqual(stats, null);
    });

  });

  describe('Reset Functionality', () => {
    
    it('should reset specific domain', async () => {
      const url = 'https://example.com';
      
      await limiter.check(url);
      await limiter.check(url);
      await limiter.check(url);
      
      limiter.resetDomain('example.com');
      
      const result = await limiter.check(url);
      assert.strictEqual(result.allowed, true);
    });

    it('should reset all domains', async () => {
      await limiter.check('https://example.com');
      await limiter.check('https://example.org');
      
      limiter.resetAll();
      
      const stats = limiter.getStats();
      assert.strictEqual(stats.total, 0);
      assert.strictEqual(stats.domains, 0);
    });

  });

  describe('Batch Processing', () => {
    
    it('should process batch with rate limiting', async () => {
      const urls = [
        'https://example.com/1',
        'https://example.com/2',
        'https://example.com/3',
        'https://example.com/4'
      ];

      const results = await limiter.batchProcess(urls, (url) => {
        return { url, processed: true };
      }, { concurrency: 2 });

      assert.strictEqual(results.length, 4);
      assert.ok(results.every(r => r.processed));
    });

    it('should call progress callback', async () => {
      const urls = ['https://example.com/1', 'https://example.com/2'];
      let progressCalls = 0;

      await limiter.batchProcess(urls, (url) => ({ url }), {
        onProgress: () => { progressCalls++; }
      });

      assert.strictEqual(progressCalls, 2);
    });

    it('should handle errors in batch', async () => {
      const urls = ['https://example.com/1', 'https://example.com/2'];

      const results = await limiter.batchProcess(urls, (url) => {
        if (url.includes('/2')) {
          throw new Error('Test error');
        }
        return { url };
      });

      assert.ok(results[0].url);
      assert.ok(results[1].error);
    });

  });

  describe('Disabled Limiter', () => {
    
    it('should allow all requests when disabled', async () => {
      limiter = new RateLimiter({ enabled: false });
      
      const url = 'https://example.com';
      
      // Try to exceed limit
      for (let i = 0; i < 10; i++) {
        const result = await limiter.check(url);
        assert.strictEqual(result.allowed, true);
      }
    });

  });

  describe('Global Limiter', () => {
    
    afterEach(() => {
      resetRateLimiter();
    });

    it('should provide global limiter instance', () => {
      const limiter1 = getRateLimiter();
      const limiter2 = getRateLimiter();
      
      assert.strictEqual(limiter1, limiter2);
    });

    it('should reset global limiter', async () => {
      const limiter1 = getRateLimiter();
      await limiter1.check('https://example.com');
      
      resetRateLimiter();
      
      const limiter2 = getRateLimiter();
      const stats = limiter2.getStats();
      assert.strictEqual(stats.total, 0);
    });

  });

  describe('Edge Cases', () => {
    
    it('should handle invalid URLs', async () => {
      const result = await limiter.check('not-a-valid-url');
      assert.strictEqual(result.allowed, true);
    });

    it('should handle empty queue clear', () => {
      limiter.clearQueue();
      assert.strictEqual(limiter.getQueueSize(), 0);
    });

    it('should handle concurrent requests', async () => {
      const url = 'https://example.com';
      
      const promises = Array(10).fill(null).map(() => 
        limiter.enqueue(url, () => 'done')
      );

      const results = await Promise.all(promises);
      assert.strictEqual(results.length, 10);
    });

  });

});

// Run with: node --test test/rate-limiter.test.js

