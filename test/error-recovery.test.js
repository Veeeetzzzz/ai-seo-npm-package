// Error Recovery Tests - v1.12.0
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ErrorRecovery, getErrorRecovery, resetErrorRecovery, retry } from '../src/error-recovery.js';

describe('Error Recovery - v1.12.0', () => {
  
  let recovery;

  beforeEach(() => {
    recovery = new ErrorRecovery({ enabled: true });
    resetErrorRecovery();
  });

  describe('Basic Retry', () => {
    
    it('should retry on failure and succeed', async () => {
      let attempts = 0;
      
      const result = await recovery.retry(async () => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('FETCH_ERROR');
          error.code = 'FETCH_ERROR';
          throw error;
        }
        return 'success';
      });

      assert.strictEqual(result, 'success');
      assert.strictEqual(attempts, 3);
    });

    it('should not retry non-retryable errors', async () => {
      try {
        await recovery.retry(async () => {
          throw new Error('NOT_RETRYABLE');
        });
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('NOT_RETRYABLE'));
      }
    });

    it('should respect maxRetries', async () => {
      let attempts = 0;
      
      try {
        await recovery.retry(async () => {
          attempts++;
          const error = new Error('FETCH_ERROR');
          error.code = 'FETCH_ERROR';
          throw error;
        }, { maxRetries: 2 });
        
        assert.fail('Should have thrown');
      } catch (error) {
        assert.strictEqual(attempts, 3); // Initial + 2 retries
      }
    });

  });

  describe('Batch with Partial Results', () => {
    
    it('should handle partial success', async () => {
      const items = [1, 2, 3, 4, 5];
      
      const results = await recovery.batchWithPartialResults(items, async (item) => {
        if (item === 3) {
          throw new Error('Item 3 failed');
        }
        return item * 2;
      });

      assert.strictEqual(results.successCount, 4);
      assert.strictEqual(results.failureCount, 1);
      assert.strictEqual(results.successful.length, 4);
      assert.strictEqual(results.failed.length, 1);
    });

    it('should continue on error by default', async () => {
      const items = [1, 2, 3];
      
      const results = await recovery.batchWithPartialResults(items, async (item) => {
        if (item === 2) {
          throw new Error('Failed');
        }
        return item;
      });

      assert.strictEqual(results.successCount, 2);
      assert.strictEqual(results.total, 3);
    });

    it('should stop on error when configured', async () => {
      const items = [1, 2, 3, 4];
      
      const results = await recovery.batchWithPartialResults(items, async (item) => {
        if (item === 2) {
          throw new Error('Failed');
        }
        return item;
      }, { continueOnError: false });

      assert.strictEqual(results.successCount, 1); // Only item 1
    });

  });

  describe('Fallback Strategy', () => {
    
    it('should use fallback on failure', async () => {
      const result = await recovery.withFallback(
        async () => {
          throw new Error('Primary failed');
        },
        async () => {
          return 'fallback result';
        }
      );

      assert.strictEqual(result, 'fallback result');
    });

    it('should try primary first', async () => {
      const result = await recovery.withFallback(
        async () => {
          return 'primary result';
        },
        async () => {
          return 'fallback result';
        }
      );

      assert.strictEqual(result, 'primary result');
    });

    it('should throw if both fail', async () => {
      try {
        await recovery.withFallback(
          async () => {
            throw new Error('Primary failed');
          },
          async () => {
            throw new Error('Fallback failed');
          }
        );
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('Both primary and fallback failed'));
      }
    });

  });

  describe('Circuit Breaker', () => {
    
    it('should open circuit after threshold', async () => {
      let calls = 0;
      
      const protectedFn = recovery.createCircuitBreaker(async () => {
        calls++;
        throw new Error('Always fail');
      }, { failureThreshold: 3 });

      // First 3 calls should reach function
      for (let i = 0; i < 3; i++) {
        try {
          await protectedFn();
        } catch (e) {
          // Expected
        }
      }

      // Circuit should be open now
      try {
        await protectedFn();
        assert.fail('Should have thrown circuit breaker error');
      } catch (error) {
        assert.ok(error.message.includes('Circuit breaker is open'));
      }

      assert.strictEqual(calls, 3); // Should not have called function the 4th time
    });

    it('should close circuit after success', async () => {
      let calls = 0;
      
      const protectedFn = recovery.createCircuitBreaker(async () => {
        calls++;
        if (calls < 3) {
          throw new Error('Fail');
        }
        return 'success';
      }, { failureThreshold: 5 });

      // Fail twice
      for (let i = 0; i < 2; i++) {
        try {
          await protectedFn();
        } catch (e) {
          // Expected
        }
      }

      // Should succeed and close circuit
      const result = await protectedFn();
      assert.strictEqual(result, 'success');
    });

  });

  describe('Statistics', () => {
    
    it('should track retry statistics', async () => {
      let attempts = 0;
      
      await recovery.retry(async () => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('FETCH_ERROR');
          error.code = 'FETCH_ERROR';
          throw error;
        }
        return 'success';
      });

      const stats = recovery.getStats();
      
      assert.ok(stats.totalAttempts > 0);
      assert.ok(stats.successfulRetries > 0);
    });

    it('should track partial results', async () => {
      await recovery.batchWithPartialResults([1, 2, 3], async (item) => {
        if (item === 2) throw new Error('Failed');
        return item;
      });

      const stats = recovery.getStats();
      assert.strictEqual(stats.partialResults, 1);
    });

    it('should reset statistics', () => {
      recovery.stats.totalAttempts = 10;
      recovery.resetStats();
      
      assert.strictEqual(recovery.stats.totalAttempts, 0);
    });

  });

  describe('Global Recovery', () => {
    
    it('should provide global instance', () => {
      const recovery1 = getErrorRecovery();
      const recovery2 = getErrorRecovery();
      
      assert.strictEqual(recovery1, recovery2);
    });

    it('should use global retry function', async () => {
      let attempts = 0;
      
      const result = await retry(async () => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('FETCH_ERROR');
          error.code = 'FETCH_ERROR';
          throw error;
        }
        return 'success';
      });

      assert.strictEqual(result, 'success');
    });

  });

  describe('Edge Cases', () => {
    
    it('should handle empty batch', async () => {
      const results = await recovery.batchWithPartialResults([], async () => {});
      
      assert.strictEqual(results.total, 0);
      assert.strictEqual(results.successCount, 0);
    });

    it('should handle single item batch', async () => {
      const results = await recovery.batchWithPartialResults([1], async (item) => item);
      
      assert.strictEqual(results.total, 1);
      assert.strictEqual(results.successCount, 1);
    });

  });

});

// Run with: node --test test/error-recovery.test.js

