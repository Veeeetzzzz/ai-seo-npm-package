// Cache Manager Tests - v1.12.0
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { CacheManager, getCache, resetCache } from '../src/cache-manager.js';
import { existsSync, rmSync } from 'fs';

describe('Cache Manager - v1.12.0', () => {
  
  let cache;

  beforeEach(() => {
    cache = new CacheManager({ enabled: true });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    
    it('should set and get values', () => {
      cache.set('key1', { data: 'value1' });
      const result = cache.get('key1');

      assert.ok(result);
      assert.strictEqual(result.data, 'value1');
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('nonexistent');
      assert.strictEqual(result, null);
    });

    it('should delete values', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      
      const result = cache.get('key1');
      assert.strictEqual(result, null);
    });

    it('should clear all cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      assert.strictEqual(cache.get('key1'), null);
      assert.strictEqual(cache.get('key2'), null);
    });

  });

  describe('TTL (Time To Live)', () => {
    
    it('should expire entries after TTL', (t, done) => {
      cache = new CacheManager({ ttl: 100 }); // 100ms TTL
      
      cache.set('key1', 'value1');
      
      setTimeout(() => {
        const result = cache.get('key1');
        assert.strictEqual(result, null);
        done();
      }, 150);
    });

    it('should allow custom TTL per entry', (t, done) => {
      cache.set('key1', 'value1', 50); // 50ms TTL
      
      setTimeout(() => {
        const result = cache.get('key1');
        assert.strictEqual(result, null);
        done();
      }, 100);
    });

    it('should not expire before TTL', (t, done) => {
      cache = new CacheManager({ ttl: 200 });
      cache.set('key1', 'value1');
      
      setTimeout(() => {
        const result = cache.get('key1');
        assert.ok(result);
        done();
      }, 50);
    });

  });

  describe('Size Management', () => {
    
    it('should respect maxSize limit', () => {
      cache = new CacheManager({ maxSize: 3 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict oldest
      
      assert.ok(cache.cache.size <= 3);
    });

    it('should evict oldest accessed entry', (t, done) => {
      cache = new CacheManager({ maxSize: 3 });
      
      cache.set('key1', 'value1');
      setTimeout(() => {
        cache.set('key2', 'value2');
        setTimeout(() => {
          cache.set('key3', 'value3');
          setTimeout(() => {
            cache.get('key1'); // Access key1 (making it newer)
            cache.get('key3'); // Access key3 (making it newer)
            // key2 is now the least recently accessed
            cache.set('key4', 'value4'); // Should evict key2
            
            // key2 should be evicted (least recently accessed)
            assert.strictEqual(cache.get('key2'), null);
            // key1 and key3 should still exist (recently accessed)
            assert.ok(cache.get('key1'));
            assert.ok(cache.get('key3'));
            done();
          }, 10);
        }, 10);
      }, 10);
    });

  });

  describe('Statistics', () => {
    
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      cache.get('key1'); // Hit
      
      const stats = cache.getStats();
      assert.strictEqual(stats.hits, 2);
      assert.strictEqual(stats.misses, 1);
    });

    it('should calculate hit rate', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      
      const stats = cache.getStats();
      assert.strictEqual(stats.hitRate, '50.00%');
    });

    it('should track sets and deletes', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.delete('key1');
      
      const stats = cache.getStats();
      assert.strictEqual(stats.sets, 2);
      assert.strictEqual(stats.deletes, 1);
    });

  });

  describe('Key Generation', () => {
    
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

    it('should consider options in key generation', () => {
      const key1 = CacheManager.generateKey('https://example.com', { 
        optimizeFor: ['chatgpt'] 
      });
      const key2 = CacheManager.generateKey('https://example.com', { 
        optimizeFor: ['voice'] 
      });
      
      assert.notStrictEqual(key1, key2);
    });

  });

  describe('Clean Expired', () => {
    
    it('should clean expired entries', (t, done) => {
      cache = new CacheManager({ ttl: 50 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      setTimeout(() => {
        const cleaned = cache.cleanExpired();
        assert.ok(cleaned >= 2);
        done();
      }, 100);
    });

  });

  describe('Cache Size', () => {
    
    it('should calculate cache size', () => {
      cache.set('key1', 'small');
      cache.set('key2', { large: 'data'.repeat(100) });
      
      const size = cache.getSize();
      assert.ok(size > 0);
    });

  });

  describe('Import/Export', () => {
    
    it('should export cache data', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const exported = cache.export();
      
      assert.ok(exported.key1);
      assert.ok(exported.key2);
    });

    it('should import cache data', () => {
      const data = {
        key1: {
          value: 'value1',
          created: Date.now(),
          accessed: Date.now(),
          expires: Date.now() + 10000
        }
      };
      
      cache.import(data);
      
      const result = cache.get('key1');
      assert.strictEqual(result, 'value1');
    });

  });

  describe('Disabled Cache', () => {
    
    it('should not cache when disabled', () => {
      cache = new CacheManager({ enabled: false });
      
      cache.set('key1', 'value1');
      const result = cache.get('key1');
      
      assert.strictEqual(result, null);
    });

  });

  describe('File Storage', () => {
    
    const testCacheDir = './.cache/test-cache';

    afterEach(() => {
      // Clean up test cache directory
      if (existsSync(testCacheDir)) {
        rmSync(testCacheDir, { recursive: true, force: true });
      }
    });

    it('should store to file system', () => {
      cache = new CacheManager({ 
        storage: 'file',
        cacheDir: testCacheDir
      });
      
      cache.set('key1', 'value1');
      
      assert.ok(existsSync(testCacheDir));
    });

    it('should retrieve from file system', () => {
      cache = new CacheManager({ 
        storage: 'file',
        cacheDir: testCacheDir
      });
      
      cache.set('key1', 'value1');
      
      // Clear memory cache but keep file
      cache.cache.clear();
      
      // Should load from file
      const result = cache.get('key1');
      assert.strictEqual(result, 'value1');
    });

  });

  describe('Global Cache', () => {
    
    afterEach(() => {
      resetCache();
    });

    it('should provide global cache instance', () => {
      const cache1 = getCache();
      const cache2 = getCache();
      
      assert.strictEqual(cache1, cache2);
    });

    it('should reset global cache', () => {
      const cache1 = getCache();
      cache1.set('key1', 'value1');
      
      resetCache();
      
      const cache2 = getCache();
      assert.strictEqual(cache2.get('key1'), null);
    });

  });

});

// Run with: node --test test/cache-manager.test.js

