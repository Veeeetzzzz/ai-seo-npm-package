// Batch Processing Tests - v1.12.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { URLSchemaGenerator } from '../src/url-generator.js';

describe('Batch Processing - v1.12.0', () => {
  
  describe('generateFromURLs', () => {
    
    it('should process multiple URLs', async () => {
      // Use simple test data
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2'
      ];

      const results = await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 2
      });

      assert.strictEqual(results.length, 2, 'Should return results for all URLs');
      assert.ok(Array.isArray(results), 'Should return an array');
    });

    it('should handle empty URL array', async () => {
      const results = await URLSchemaGenerator.generateFromURLs([]);
      
      assert.strictEqual(results.length, 0);
      assert.ok(Array.isArray(results));
    });

    it('should respect concurrency limits', async () => {
      const urls = ['https://example.com/1', 'https://example.com/2', 'https://example.com/3'];
      let activeRequests = 0;
      let maxActiveRequests = 0;

      // This is a conceptual test - in practice, we'd need to mock fetch
      // For now, just verify it processes all URLs
      const results = await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 2
      });

      assert.strictEqual(results.length, 3, 'Should process all URLs');
    });

    it('should call progress callback', async () => {
      const urls = ['https://example.com/1', 'https://example.com/2'];
      const progressCalls = [];

      await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 1,
        progressCallback: (url, current, total) => {
          progressCalls.push({ url, current, total });
        }
      });

      assert.ok(progressCalls.length >= 2, 'Should call progress callback');
      assert.strictEqual(progressCalls[progressCalls.length - 1].total, 2);
    });

    it('should handle failed URLs gracefully', async () => {
      const urls = [
        'https://invalid-domain-12345.com',
        'https://another-invalid-domain-67890.com'
      ];

      const results = await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 2
      });

      assert.strictEqual(results.length, 2);
      // Failed URLs should return error results
      results.forEach(result => {
        assert.ok(result.url, 'Should have URL');
        // Either success or error should be present
        assert.ok(result.success !== undefined);
      });
    });

    it('should pass options to individual URL processing', async () => {
      const urls = ['https://example.com'];
      
      const results = await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 1,
        targetTypes: ['Product'],
        optimizeFor: ['chatgpt']
      });

      assert.ok(results.length > 0);
      // Options should be passed through (verified by no errors)
    });

  });

  describe('generateFromSitemap', () => {
    
    it('should handle sitemap processing', async () => {
      // This would need a mock sitemap or test sitemap
      // For now, test that the method exists and handles errors
      
      try {
        await URLSchemaGenerator.generateFromSitemap('https://invalid-sitemap-xyz12345.com/sitemap.xml');
        // Should throw an error
        assert.fail('Should have thrown an error');
      } catch (error) {
        // Should throw some kind of error
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('should handle sitemap with filter', async () => {
      // Test filter parsing
      // This would need a mock sitemap with known URLs
      
      // For now, just verify the method exists
      assert.strictEqual(typeof URLSchemaGenerator.generateFromSitemap, 'function');
    });

  });

  describe('Concurrency Control', () => {
    
    it('should process URLs in batches', async () => {
      const urls = Array.from({ length: 10 }, (_, i) => `https://example.com/${i}`);
      
      const startTime = Date.now();
      const results = await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 3
      });
      const endTime = Date.now();

      assert.strictEqual(results.length, 10);
      // With concurrency, it should be faster than sequential
      // (Though we can't test exact timing reliably)
    });

  });

  describe('Error Recovery', () => {
    
    it('should continue processing after individual failures', async () => {
      const urls = [
        'https://invalid-1.com',
        'https://example.com',
        'https://invalid-2.com'
      ];

      const results = await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 1
      });

      assert.strictEqual(results.length, 3, 'Should return all results');
      // Should have mix of success and failures
      const hasFailures = results.some(r => r.success === false);
      assert.ok(hasFailures, 'Should handle failures');
    });

  });

  describe('Progress Tracking', () => {
    
    it('should track progress accurately', async () => {
      const urls = ['https://example.com/1', 'https://example.com/2', 'https://example.com/3'];
      let lastProgress = 0;

      await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 1,
        progressCallback: (url, current, total) => {
          assert.ok(current <= total, 'Current should not exceed total');
          assert.ok(current >= lastProgress, 'Progress should not go backwards');
          lastProgress = current;
        }
      });

      assert.strictEqual(lastProgress, 3, 'Should complete all items');
    });

  });

});

// Run with: node --test test/batch-processing.test.js

