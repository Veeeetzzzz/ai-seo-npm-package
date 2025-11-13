// Cache Integration Tests - v1.12.0
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { URLSchemaGenerator } from '../src/url-generator.js';
import { CacheManager, resetCache } from '../src/cache-manager.js';

describe('Cache Integration - v1.12.0', () => {
  
  let cache;

  beforeEach(() => {
    cache = new CacheManager({ enabled: true });
    resetCache();
  });

  afterEach(() => {
    cache.clear();
    resetCache();
  });

  describe('URL Generation with Cache', () => {
    
    it('should cache generated schemas', async () => {
      const url = 'https://example.com';
      
      const result1 = await URLSchemaGenerator.generateFromURL(url, {
        cache: cache
      });

      assert.ok(result1.success);
      assert.strictEqual(result1.cached, false);

      const result2 = await URLSchemaGenerator.generateFromURL(url, {
        cache: cache
      });

      assert.ok(result2.success);
      assert.strictEqual(result2.cached, true);
      assert.ok(result2.cacheKey);
    });

    it('should not cache when disabled', async () => {
      const url = 'https://example.com';
      
      const result1 = await URLSchemaGenerator.generateFromURL(url, {
        useCache: false
      });

      const result2 = await URLSchemaGenerator.generateFromURL(url, {
        useCache: false
      });

      assert.strictEqual(result1.cached, false);
      assert.strictEqual(result2.cached, false);
    });

    it('should use different cache keys for different options', async () => {
      const url = 'https://example.com';
      
      const result1 = await URLSchemaGenerator.generateFromURL(url, {
        optimizeFor: ['chatgpt'],
        cache: cache
      });

      const result2 = await URLSchemaGenerator.generateFromURL(url, {
        optimizeFor: ['voice'],
        cache: cache
      });

      // Both should be cache misses (different options = different keys)
      assert.strictEqual(result1.cached, false);
      assert.strictEqual(result2.cached, false);
    });

    it('should respect custom TTL', async () => {
      const url = 'https://example.com';
      
      await URLSchemaGenerator.generateFromURL(url, {
        cache: cache,
        cacheTTL: 50 // 50ms TTL
      });

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await URLSchemaGenerator.generateFromURL(url, {
        cache: cache
      });

      assert.strictEqual(result.cached, false);
    });

  });

  describe('Batch Processing with Cache', () => {
    
    it('should cache batch results', async () => {
      const urls = ['https://example.com', 'https://example.org'];
      
      // First batch
      await URLSchemaGenerator.generateFromURLs(urls, {
        cache: cache,
        concurrency: 2
      });

      // Second batch (should hit cache)
      const results = await URLSchemaGenerator.generateFromURLs(urls, {
        cache: cache,
        concurrency: 2
      });

      const cachedCount = results.filter(r => r.cached).length;
      assert.ok(cachedCount > 0);
    });

    it('should improve performance with cache', async () => {
      const url = 'https://example.com';
      
      // First generation (no cache)
      const start1 = Date.now();
      await URLSchemaGenerator.generateFromURL(url, { cache: cache });
      const time1 = Date.now() - start1;

      // Second generation (cached)
      const start2 = Date.now();
      await URLSchemaGenerator.generateFromURL(url, { cache: cache });
      const time2 = Date.now() - start2;

      // Cached should be significantly faster
      assert.ok(time2 < time1);
    });

  });

  describe('Cache Statistics', () => {
    
    it('should track cache hits and misses', async () => {
      const url = 'https://example.com';
      
      await URLSchemaGenerator.generateFromURL(url, { cache: cache });
      await URLSchemaGenerator.generateFromURL(url, { cache: cache });
      await URLSchemaGenerator.generateFromURL('https://example.org', { cache: cache });

      const stats = cache.getStats();
      
      assert.ok(stats.hits > 0);
      assert.ok(stats.misses > 0);
      assert.ok(parseFloat(stats.hitRate) > 0);
    });

  });

  describe('Cache Key Generation', () => {
    
    it('should generate consistent keys', () => {
      const key1 = CacheManager.generateKey('https://example.com', {});
      const key2 = CacheManager.generateKey('https://example.com', {});
      
      assert.strictEqual(key1, key2);
    });

    it('should generate different keys for different URLs', () => {
      const key1 = CacheManager.generateKey('https://example.com', {});
      const key2 = CacheManager.generateKey('https://example.org', {});
      
      assert.notStrictEqual(key1, key2);
    });

    it('should include options in key', () => {
      const key1 = CacheManager.generateKey('https://example.com', { 
        optimizeFor: ['chatgpt'] 
      });
      const key2 = CacheManager.generateKey('https://example.com', { 
        optimizeFor: ['voice'] 
      });
      
      assert.notStrictEqual(key1, key2);
    });

  });

  describe('Error Handling with Cache', () => {
    
    it('should not cache errors', async () => {
      const url = 'https://definitely-does-not-exist-12345.com';
      
      const result1 = await URLSchemaGenerator.generateFromURL(url, {
        cache: cache
      });

      const result2 = await URLSchemaGenerator.generateFromURL(url, {
        cache: cache
      });

      // Errors should not be cached
      assert.strictEqual(result1.cached, false);
      assert.strictEqual(result2.cached, false);
    });

  });

  describe('Cache Configuration', () => {
    
    it('should use custom cache instance', async () => {
      const customCache = new CacheManager({ ttl: 5000 });
      
      const result = await URLSchemaGenerator.generateFromURL('https://example.com', {
        cache: customCache
      });

      assert.ok(result.success);
    });

    it('should work with default global cache', async () => {
      const result1 = await URLSchemaGenerator.generateFromURL('https://example.com');
      const result2 = await URLSchemaGenerator.generateFromURL('https://example.com');

      assert.strictEqual(result1.cached, false);
      assert.strictEqual(result2.cached, true);
    });

  });

});

// Run with: node --test test/cache-integration.test.js

