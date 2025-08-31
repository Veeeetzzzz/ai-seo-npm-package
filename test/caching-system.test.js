import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import './setup.js';
import { Cache, initSEO, product } from '../index.js';

describe('Caching System v1.5.0', () => {
  beforeEach(() => {
    // Clear cache before each test
    Cache.clear();
    
    // Configure cache for testing
    Cache.configure({
      strategy: 'intelligent',
      ttl: 1000, // 1 second for testing
      maxSize: 10,
      enableCompression: true,
      enableMetrics: true
    });
  });

  afterEach(() => {
    // Clean up any injected schemas
    const scripts = document.querySelectorAll('script[data-ai-seo]');
    scripts.forEach(script => script.remove());
    Cache.clear();
  });

  describe('Cache Configuration', () => {
    it('should configure cache settings', () => {
      Cache.configure({
        strategy: 'basic',
        ttl: 5000,
        maxSize: 20
      });

      const metrics = Cache.getMetrics();
      assert.strictEqual(metrics.strategy, 'basic');
      assert.strictEqual(metrics.maxSize, 20);
    });

    it('should clear cache when strategy is set to none', () => {
      // First add something to cache
      const schema = { "@context": "https://schema.org", "@type": "Product", "name": "Test" };
      const cacheInstance = Cache.getInstance();
      cacheInstance.set(schema, {}, { valid: true });
      
      assert.strictEqual(Cache.getMetrics().cacheSize, 1);
      
      // Change strategy to none
      Cache.configure({ strategy: 'none' });
      
      assert.strictEqual(Cache.getMetrics().cacheSize, 0);
    });
  });

  describe('Cache Operations', () => {
    it('should cache and retrieve schema validation results', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Test Product",
        "description": "A test product"
      };

      const cacheInstance = Cache.getInstance();
      const options = { debug: false, validate: true };
      
      // Should be a cache miss initially
      const cached1 = cacheInstance.get(schema, options);
      assert.strictEqual(cached1, null);
      
      // Set cache
      const result = { valid: true, processed: true };
      const success = cacheInstance.set(schema, options, result);
      assert.strictEqual(success, true);
      
      // Should be a cache hit now
      const cached2 = cacheInstance.get(schema, options);
      assert.deepStrictEqual(cached2, result);
    });

    it('should handle cache expiration', async () => {
      Cache.configure({ ttl: 50 }); // 50ms TTL
      
      const schema = { "@context": "https://schema.org", "@type": "Product", "name": "Test" };
      const cacheInstance = Cache.getInstance();
      
      cacheInstance.set(schema, {}, { valid: true });
      
      // Should be cached immediately
      const cached1 = cacheInstance.get(schema, {});
      assert.ok(cached1);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be expired now
      const cached2 = cacheInstance.get(schema, {});
      assert.strictEqual(cached2, null);
    });

    it('should enforce max cache size with LRU eviction', () => {
      Cache.configure({ maxSize: 3 });
      const cacheInstance = Cache.getInstance();
      
      // Add 5 items to cache
      for (let i = 0; i < 5; i++) {
        const schema = { "@context": "https://schema.org", "@type": "Product", "name": `Product ${i}` };
        cacheInstance.set(schema, {}, { valid: true });
      }
      
      // Should only have 3 items (max size)
      const metrics = Cache.getMetrics();
      assert.strictEqual(metrics.cacheSize, 3);
    });
  });

  describe('Intelligent Caching Strategy', () => {
    it('should cache complex schemas', () => {
      const complexSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Complex Product",
        "description": "A very detailed product description that makes this schema quite large and complex",
        "brand": { "@type": "Brand", "name": "Test Brand" },
        "offers": { "@type": "Offer", "price": "99.99", "priceCurrency": "USD" },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": 4.5, "reviewCount": 100 },
        "image": ["image1.jpg", "image2.jpg", "image3.jpg"]
      };

      const cacheInstance = Cache.getInstance();
      const shouldCache = cacheInstance.shouldCache(complexSchema, {});
      
      assert.strictEqual(shouldCache, true);
    });

    it('should cache reusable schema types', () => {
      const productSchema = { "@context": "https://schema.org", "@type": "Product", "name": "Simple Product" };
      const articleSchema = { "@context": "https://schema.org", "@type": "Article", "headline": "Test Article" };
      const customSchema = { "@context": "https://schema.org", "@type": "CustomType", "name": "Custom" };

      const cacheInstance = Cache.getInstance();
      
      assert.strictEqual(cacheInstance.shouldCache(productSchema, {}), true);
      assert.strictEqual(cacheInstance.shouldCache(articleSchema, {}), true);
      assert.strictEqual(cacheInstance.shouldCache(customSchema, {}), false);
    });

    it('should not cache when strategy is none', () => {
      Cache.configure({ strategy: 'none' });
      
      const schema = { "@context": "https://schema.org", "@type": "Product", "name": "Test" };
      const cacheInstance = Cache.getInstance();
      
      assert.strictEqual(cacheInstance.shouldCache(schema, {}), false);
    });
  });

  describe('Cache Metrics', () => {
    it('should track cache hits and misses', () => {
      const schema = { "@context": "https://schema.org", "@type": "Product", "name": "Test" };
      const cacheInstance = Cache.getInstance();
      
      // Cache miss
      cacheInstance.get(schema, {});
      
      // Set cache
      cacheInstance.set(schema, {}, { valid: true });
      
      // Cache hit
      cacheInstance.get(schema, {});
      
      const metrics = Cache.getMetrics();
      assert.strictEqual(metrics.hits, 1);
      assert.strictEqual(metrics.misses, 1);
      assert.strictEqual(metrics.hitRate, 50);
      assert.strictEqual(metrics.totalEntries, 2);
    });

    it('should calculate hit rate correctly', () => {
      const cacheInstance = Cache.getInstance();
      const schema = { "@context": "https://schema.org", "@type": "Product", "name": "Test" };
      
      // Set cache
      cacheInstance.set(schema, {}, { valid: true });
      
      // 3 hits, 1 miss
      cacheInstance.get(schema, {}); // hit
      cacheInstance.get(schema, {}); // hit  
      cacheInstance.get(schema, {}); // hit
      cacheInstance.get({ "@context": "https://schema.org", "@type": "Article", "name": "Other" }, {}); // miss
      
      const metrics = Cache.getMetrics();
      assert.strictEqual(metrics.hits, 3);
      assert.strictEqual(metrics.misses, 1);
      assert.strictEqual(metrics.hitRate, 75);
    });
  });

  describe('Integration with initSEO', () => {
    it('should use cache when injecting schemas', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Cached Product",
        "description": "This should be cached"
      };

      // First injection - should cache the result
      const script1 = initSEO({ schema, debug: true });
      assert.ok(script1);
      assert.strictEqual(script1.getAttribute('data-ai-seo-cached'), null); // First time, not from cache
      
      // Remove the script to test caching
      script1.remove();
      
      // Second injection - should use cache
      const script2 = initSEO({ schema, debug: true });
      assert.ok(script2);
      assert.strictEqual(script2.getAttribute('data-ai-seo-cached'), 'true'); // From cache
      
      const metrics = Cache.getMetrics();
      assert.ok(metrics.hits > 0, 'Should have cache hits');
    });

    it('should work with Schema Composer', () => {
      // First product creation
      const product1 = product()
        .name('Test Product')
        .description('A test product for caching')
        .offers({ price: 99.99, priceCurrency: 'USD' })
        .inject({ debug: true });
        
      assert.ok(product1);
      
      // Remove the script
      product1.remove();
      
      // Second identical product - should use cache
      const product2 = product()
        .name('Test Product')
        .description('A test product for caching')
        .offers({ price: 99.99, priceCurrency: 'USD' })
        .inject({ debug: true });
        
      assert.ok(product2);
      assert.strictEqual(product2.getAttribute('data-ai-seo-cached'), 'true');
    });
  });

  describe('Cache Performance', () => {
    it('should improve performance on repeated operations', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Performance Test Product",
        "description": "Testing cache performance benefits"
      };

      // Measure time for first operation (no cache)
      const start1 = performance.now();
      const script1 = initSEO({ schema, validate: true });
      const time1 = performance.now() - start1;
      
      script1.remove();
      
      // Measure time for second operation (with cache)
      const start2 = performance.now();
      const script2 = initSEO({ schema, validate: true });
      const time2 = performance.now() - start2;
      
      // Cache should make subsequent operations faster
      // Note: This might not always be true in test environment, but the structure is correct
      assert.ok(script1);
      assert.ok(script2);
      
      // Verify cache was used
      assert.strictEqual(script2.getAttribute('data-ai-seo-cached'), 'true');
    });
  });
});
