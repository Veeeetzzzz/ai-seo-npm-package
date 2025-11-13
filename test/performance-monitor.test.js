// Performance Monitor Tests - v1.12.0
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { PerformanceMonitor, getPerformanceMonitor, resetPerformanceMonitor, measure } from '../src/performance-monitor.js';

describe('Performance Monitor - v1.12.0', () => {
  
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor({ enabled: true });
  });

  afterEach(() => {
    monitor.reset();
  });

  describe('Basic Tracking', () => {
    
    it('should track operation timing', async () => {
      const id = monitor.start('test-operation');
      await new Promise(resolve => setTimeout(resolve, 50));
      const metrics = monitor.end(id);

      assert.ok(metrics);
      assert.ok(metrics.duration >= 50);
      assert.strictEqual(metrics.name, 'test-operation');
    });

    it('should handle multiple operations', async () => {
      const id1 = monitor.start('op1');
      const id2 = monitor.start('op2');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      monitor.end(id1);
      monitor.end(id2);

      const stats = monitor.getStats();
      assert.ok(stats.operations['op1']);
      assert.ok(stats.operations['op2']);
    });

    it('should return null when disabled', () => {
      monitor = new PerformanceMonitor({ enabled: false });
      
      const id = monitor.start('test');
      const metrics = monitor.end(id);

      assert.strictEqual(id, null);
      assert.strictEqual(metrics, null);
    });

  });

  describe('Statistics', () => {
    
    it('should calculate operation statistics', async () => {
      for (let i = 0; i < 3; i++) {
        const id = monitor.start('repeated-op');
        await new Promise(resolve => setTimeout(resolve, 10));
        monitor.end(id);
      }

      const stats = monitor.getStats();
      const opStats = stats.operations['repeated-op'];

      assert.strictEqual(opStats.count, 3);
      assert.ok(opStats.avgDuration > 0);
      assert.ok(opStats.minDuration > 0);
      assert.ok(opStats.maxDuration > 0);
    });

    it('should track active operations', () => {
      monitor.start('op1');
      monitor.start('op2');

      const stats = monitor.getStats();
      assert.strictEqual(stats.activeOperations, 2);
    });

    it('should track memory usage', () => {
      const id = monitor.start('memory-test');
      monitor.end(id);

      const stats = monitor.getStats();
      assert.ok(typeof stats.currentMemory === 'number');
    });

  });

  describe('Measure Function', () => {
    
    it('should measure async function', async () => {
      const result = await monitor.measure('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'success';
      });

      assert.strictEqual(result, 'success');

      const stats = monitor.getStats();
      assert.ok(stats.operations['async-test']);
    });

    it('should handle function errors', async () => {
      try {
        await monitor.measure('error-test', async () => {
          throw new Error('Test error');
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'Test error');
      }

      // Should still record the operation
      const stats = monitor.getStats();
      assert.ok(stats.operations['error-test']);
    });

  });

  describe('Slowest Operations', () => {
    
    it('should identify slowest operations', async () => {
      await monitor.measure('fast', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      await monitor.measure('slow', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const slowest = monitor.getSlowest(5);
      
      assert.ok(slowest.length > 0);
      assert.strictEqual(slowest[0].name, 'slow');
    });

    it('should limit results', async () => {
      for (let i = 0; i < 10; i++) {
        await monitor.measure(`op${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      }

      const slowest = monitor.getSlowest(3);
      assert.strictEqual(slowest.length, 3);
    });

  });

  describe('Most Frequent Operations', () => {
    
    it('should identify most frequent operations', async () => {
      for (let i = 0; i < 10; i++) {
        await monitor.measure('frequent', async () => {});
      }

      await monitor.measure('infrequent', async () => {});

      const frequent = monitor.getMostFrequent(5);
      
      assert.ok(frequent.length > 0);
      assert.strictEqual(frequent[0].name, 'frequent');
      assert.strictEqual(frequent[0].count, 10);
    });

  });

  describe('Optimization Suggestions', () => {
    
    it('should suggest caching for frequent operations', async () => {
      for (let i = 0; i < 150; i++) {
        await monitor.measure('very-frequent', async () => {});
      }

      const suggestions = monitor.getSuggestions();
      
      const cacheSuggestion = suggestions.find(s => s.type === 'frequency');
      assert.ok(cacheSuggestion);
      assert.ok(cacheSuggestion.suggestion.includes('caching'));
    });

    it('should warn about slow operations', async () => {
      await monitor.measure('very-slow', async () => {
        await new Promise(resolve => setTimeout(resolve, 6000));
      });

      const suggestions = monitor.getSuggestions();
      
      const slowSuggestion = suggestions.find(s => s.type === 'slow');
      assert.ok(slowSuggestion);
    });

  });

  describe('Performance Report', () => {
    
    it('should generate formatted report', async () => {
      await monitor.measure('test-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const report = monitor.generateReport();
      
      assert.ok(typeof report === 'string');
      assert.ok(report.includes('Performance Report'));
      assert.ok(report.includes('test-op'));
    });

  });

  describe('Reset and Export', () => {
    
    it('should reset metrics', async () => {
      await monitor.measure('test', async () => {});
      
      monitor.reset();
      
      const stats = monitor.getStats();
      assert.strictEqual(Object.keys(stats.operations).length, 0);
    });

    it('should export metrics', async () => {
      await monitor.measure('test', async () => {});
      
      const exported = monitor.export();
      
      assert.ok(exported.timings);
      assert.ok(exported.memory);
      assert.ok(exported.operations);
      assert.ok(Array.isArray(exported.operations));
    });

  });

  describe('Edge Cases', () => {
    
    it('should handle invalid operation ID', () => {
      const metrics = monitor.end('invalid-id');
      assert.strictEqual(metrics, null);
    });

    it('should handle metadata', () => {
      const id = monitor.start('with-metadata', { key: 'value' });
      const metrics = monitor.end(id);

      assert.ok(metrics.metadata);
      assert.strictEqual(metrics.metadata.key, 'value');
    });

    it('should clean old metrics', async () => {
      const smallMonitor = new PerformanceMonitor({ maxEntries: 5 });
      
      for (let i = 0; i < 10; i++) {
        await smallMonitor.measure('test', async () => {});
      }

      assert.ok(smallMonitor.metrics.timings.length <= 5);
    });

  });

  describe('Global Monitor', () => {
    
    afterEach(() => {
      resetPerformanceMonitor();
    });

    it('should provide global monitor', () => {
      const monitor1 = getPerformanceMonitor();
      const monitor2 = getPerformanceMonitor();
      
      assert.strictEqual(monitor1, monitor2);
    });

    it('should use global measure function', async () => {
      const result = await measure('global-test', async () => {
        return 'success';
      });

      assert.strictEqual(result, 'success');
    });

    it('should reset global monitor', async () => {
      await measure('test', async () => {});
      
      resetPerformanceMonitor();
      
      const monitor = getPerformanceMonitor();
      const stats = monitor.getStats();
      assert.strictEqual(Object.keys(stats.operations).length, 0);
    });

  });

});

// Run with: node --test test/performance-monitor.test.js

