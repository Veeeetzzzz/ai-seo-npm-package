import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import './setup.js';
import { Performance, initSEO, product, Cache } from '../index.js';

describe('Performance Monitoring v1.5.0', () => {
  beforeEach(() => {
    // Clear performance data and cache
    Performance.clear();
    Cache.clear();
    
    // Clean up any existing schemas
    const scripts = document.querySelectorAll('script[data-ai-seo]');
    scripts.forEach(script => script.remove());
  });

  afterEach(() => {
    // Clean up after tests
    const scripts = document.querySelectorAll('script[data-ai-seo]');
    scripts.forEach(script => script.remove());
    Performance.clear();
    Cache.clear();
  });

  describe('Performance Metrics Recording', () => {
    it('should record schema injection performance', () => {
      Performance.recordInjection(2.5, false, 'Product');
      Performance.recordInjection(1.2, true, 'Article');
      Performance.recordInjection(3.1, false, 'Event');
      
      const metrics = Performance.getReport();
      
      assert.strictEqual(metrics.schemaInjections.length, 3);
      assert.strictEqual(metrics.totalSchemas, 3);
      assert.ok(metrics.averageInjectionTime > 0);
      assert.ok(metrics.cacheHitRate >= 0);
    });

    it('should calculate average injection time correctly', () => {
      Performance.recordInjection(2.0, false, 'Product');
      Performance.recordInjection(4.0, false, 'Article');
      Performance.recordInjection(6.0, false, 'Event');
      
      const metrics = Performance.getReport();
      
      assert.strictEqual(metrics.averageInjectionTime, 4.0); // (2+4+6)/3
    });

    it('should calculate cache hit rate correctly', () => {
      Performance.recordInjection(1.0, true, 'Product');   // cache hit
      Performance.recordInjection(1.0, true, 'Product');   // cache hit
      Performance.recordInjection(1.0, false, 'Article');  // cache miss
      Performance.recordInjection(1.0, true, 'Event');     // cache hit
      
      const metrics = Performance.getReport();
      
      assert.strictEqual(metrics.cacheHitRate, 75); // 3 hits out of 4 total
    });

    it('should limit injection history to 100 entries', () => {
      // Add 150 injections
      for (let i = 0; i < 150; i++) {
        Performance.recordInjection(1.0, false, 'Product');
      }
      
      const metrics = Performance.getReport();
      
      assert.strictEqual(metrics.schemaInjections.length, 100);
      assert.strictEqual(metrics.totalSchemas, 100);
    });
  });

  describe('Performance Score Calculation', () => {
    it('should start with perfect score', () => {
      const metrics = Performance.getReport();
      assert.strictEqual(metrics.performanceScore, 100);
    });

    it('should deduct points for slow injections', () => {
      // Add slow injections (>5ms)
      Performance.recordInjection(10.0, false, 'Product');
      Performance.recordInjection(8.0, false, 'Article');
      
      const metrics = Performance.getReport();
      
      assert.ok(metrics.averageInjectionTime > 5);
      assert.ok(metrics.performanceScore < 100);
    });

    it('should deduct points for low cache hit rate', () => {
      // Add many cache misses
      for (let i = 0; i < 20; i++) {
        Performance.recordInjection(1.0, false, 'Product');
      }
      // Add few cache hits
      for (let i = 0; i < 2; i++) {
        Performance.recordInjection(1.0, true, 'Product');
      }
      
      const metrics = Performance.getReport();
      
      assert.ok(metrics.cacheHitRate < 20);
      assert.ok(metrics.performanceScore < 100);
    });

    it('should add bonus points for good cache hit rate', () => {
      // Add many cache hits
      for (let i = 0; i < 20; i++) {
        Performance.recordInjection(1.0, true, 'Product');
      }
      // Add few cache misses
      for (let i = 0; i < 2; i++) {
        Performance.recordInjection(1.0, false, 'Product');
      }
      
      const metrics = Performance.getReport();
      
      assert.ok(metrics.cacheHitRate > 80);
      assert.ok(metrics.performanceScore >= 100); // Can go above 100 with bonus
    });

    it('should deduct points for too many schemas', () => {
      // Add many schemas
      for (let i = 0; i < 60; i++) {
        Performance.recordInjection(1.0, false, 'Product');
      }
      
      const metrics = Performance.getReport();
      
      assert.ok(metrics.totalSchemas > 50);
      assert.ok(metrics.performanceScore < 100);
    });
  });

  describe('Performance Recommendations', () => {
    it('should recommend caching for slow injections', () => {
      Performance.recordInjection(10.0, false, 'Product');
      
      const report = Performance.getReport();
      const perfRecommendations = report.recommendations.filter(r => r.type === 'performance');
      
      assert.ok(perfRecommendations.length > 0);
      assert.strictEqual(perfRecommendations[0].severity, 'high');
      assert.ok(perfRecommendations[0].message.includes('slow'));
      assert.ok(perfRecommendations[0].action.includes('caching'));
    });

    it('should recommend cache optimization for low hit rates', () => {
      // Many schemas with low cache hit rate
      for (let i = 0; i < 15; i++) {
        Performance.recordInjection(1.0, false, 'Product');
      }
      for (let i = 0; i < 2; i++) {
        Performance.recordInjection(1.0, true, 'Product');
      }
      
      const report = Performance.getReport();
      const cacheRecommendations = report.recommendations.filter(r => r.type === 'caching');
      
      assert.ok(cacheRecommendations.length > 0);
      assert.strictEqual(cacheRecommendations[0].severity, 'medium');
      assert.ok(cacheRecommendations[0].message.includes('cache hit rate'));
    });

    it('should recommend lazy loading for many schemas', () => {
      // Many schemas
      for (let i = 0; i < 25; i++) {
        Performance.recordInjection(1.0, false, 'Product');
      }
      
      const report = Performance.getReport();
      const optRecommendations = report.recommendations.filter(r => r.type === 'optimization');
      
      assert.ok(optRecommendations.length > 0);
      assert.strictEqual(optRecommendations[0].severity, 'medium');
      assert.ok(optRecommendations[0].message.includes('Many schemas'));
      assert.ok(optRecommendations[0].action.includes('LazySchema'));
    });

    it('should congratulate excellent performance', () => {
      // Few fast injections with good cache hit rate
      Performance.recordInjection(0.5, true, 'Product');
      Performance.recordInjection(0.8, true, 'Article');
      Performance.recordInjection(0.3, true, 'Event');
      
      const report = Performance.getReport();
      const successRecommendations = report.recommendations.filter(r => r.type === 'success');
      
      assert.ok(successRecommendations.length > 0);
      assert.strictEqual(successRecommendations[0].severity, 'info');
      assert.ok(successRecommendations[0].message.includes('Excellent'));
    });
  });

  describe('Integration with initSEO', () => {
    it('should automatically record performance when using initSEO', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Performance Test Product"
      };

      initSEO({ schema, debug: false });
      
      const metrics = Performance.getReport();
      
      assert.strictEqual(metrics.schemaInjections.length, 1);
      assert.strictEqual(metrics.totalSchemas, 1);
      assert.ok(metrics.averageInjectionTime >= 0);
      assert.strictEqual(metrics.schemaInjections[0].schemaType, 'Product');
      assert.strictEqual(metrics.schemaInjections[0].fromCache, false);
    });

    it('should track cache hits correctly', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Cache Test Product"
      };

      // First injection - should be cache miss
      const script1 = initSEO({ schema, debug: false });
      script1.remove();
      
      // Second injection - should be cache hit
      initSEO({ schema, debug: false });
      
      const metrics = Performance.getReport();
      
      assert.strictEqual(metrics.schemaInjections.length, 2);
      assert.strictEqual(metrics.schemaInjections[0].fromCache, false); // First injection
      assert.strictEqual(metrics.schemaInjections[1].fromCache, true);  // Second injection (cached)
      assert.strictEqual(metrics.cacheHitRate, 50); // 1 hit out of 2
    });

    it('should work with Schema Composer', () => {
      product()
        .name('Composer Performance Test')
        .description('Testing performance with Schema Composer')
        .inject({ debug: false });
      
      const metrics = Performance.getReport();
      
      assert.strictEqual(metrics.schemaInjections.length, 1);
      assert.strictEqual(metrics.schemaInjections[0].schemaType, 'Product');
    });
  });

  describe('Performance Data Management', () => {
    it('should clear all performance data', () => {
      Performance.recordInjection(1.0, false, 'Product');
      Performance.recordInjection(2.0, true, 'Article');
      
      let metrics = Performance.getReport();
      assert.strictEqual(metrics.totalSchemas, 2);
      
      Performance.clear();
      
      metrics = Performance.getReport();
      assert.strictEqual(metrics.totalSchemas, 0);
      assert.strictEqual(metrics.schemaInjections.length, 0);
      assert.strictEqual(metrics.averageInjectionTime, 0);
      assert.strictEqual(metrics.cacheHitRate, 0);
      assert.strictEqual(metrics.performanceScore, 100);
    });

    it('should include timestamp in performance report', () => {
      const before = Date.now();
      const report = Performance.getReport();
      const after = Date.now();
      
      const reportTime = new Date(report.timestamp).getTime();
      
      assert.ok(reportTime >= before);
      assert.ok(reportTime <= after);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty metrics gracefully', () => {
      const metrics = Performance.getReport();
      
      assert.strictEqual(metrics.averageInjectionTime, 0);
      assert.strictEqual(metrics.cacheHitRate, 0);
      assert.strictEqual(metrics.totalSchemas, 0);
      assert.strictEqual(metrics.performanceScore, 100);
      assert.ok(Array.isArray(metrics.recommendations));
    });

    it('should handle edge case calculations', () => {
      // Test with only cache misses
      Performance.recordInjection(1.0, false, 'Product');
      
      let metrics = Performance.getReport();
      assert.strictEqual(metrics.cacheHitRate, 0);
      
      Performance.clear();
      
      // Test with only cache hits
      Performance.recordInjection(1.0, true, 'Product');
      
      metrics = Performance.getReport();
      assert.strictEqual(metrics.cacheHitRate, 100);
    });

    it('should maintain metric bounds', () => {
      // Test extreme values
      Performance.recordInjection(1000.0, false, 'Product'); // Very slow
      
      const metrics = Performance.getReport();
      
      // Performance score should be bounded to 0-100+ range
      assert.ok(metrics.performanceScore >= 0);
      assert.ok(metrics.averageInjectionTime > 0);
    });
  });
});
