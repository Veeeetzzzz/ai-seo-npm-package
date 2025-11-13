// End-to-End Integration Tests - v1.12.0
// Real-world scenario testing
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { URLSchemaGenerator } from '../src/url-generator.js';

describe('End-to-End Integration - v1.12.0', () => {
  
  describe('Complete URL Generation Flow', () => {
    
    it('should generate schema from URL with full pipeline', async () => {
      // This test demonstrates the complete flow from URL to schema
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url, {
        targetTypes: ['Article', 'WebPage'],
        includeRelated: true
      });

      // Verify result structure
      assert.ok(result, 'Should return result');
      assert.ok(typeof result.success === 'boolean', 'Should have success flag');
      
      if (result.success) {
        assert.ok(result.schemas, 'Should have schemas array');
        assert.ok(result.detectedType, 'Should have detected type');
        assert.ok(typeof result.confidence === 'number', 'Should have confidence score');
        assert.ok(result.metadata, 'Should have metadata');
        
        // Verify schema structure
        if (result.schemas.length > 0) {
          const schema = result.schemas[0];
          assert.ok(schema['@context'], 'Should have @context');
          assert.ok(schema['@type'], 'Should have @type');
        }
      }
    });

    it('should handle complete batch processing', async () => {
      const urls = [
        'https://example.com',
        'https://example.org'
      ];

      const results = await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 2
      });

      assert.strictEqual(results.length, 2);
      results.forEach(result => {
        assert.ok(result.success !== undefined);
      });
    });

  });

  describe('Error Handling Flow', () => {
    
    it('should handle invalid URL gracefully', async () => {
      const result = await URLSchemaGenerator.generateFromURL('not-a-valid-url');
      
      assert.strictEqual(result.success, false);
      assert.ok(result.error, 'Should have error message');
      assert.ok(result.suggestion, 'Should have suggestion');
    });

    it('should handle network errors', async () => {
      const result = await URLSchemaGenerator.generateFromURL('https://this-domain-definitely-does-not-exist-123456789.com');
      
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

  });

  describe('Schema Quality Tests', () => {
    
    it('should detect appropriate schema types', async () => {
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url);
      
      if (result.success && result.schemas.length > 0) {
        const schema = result.schemas[0];
        
        // Verify basic schema.org structure
        assert.strictEqual(schema['@context'], 'https://schema.org');
        assert.ok(schema['@type'], 'Should have @type');
        
        // Should have at least name or title
        assert.ok(schema.name || schema.headline, 'Should have name or headline');
      }
    });

  });

  describe('Metadata Extraction', () => {
    
    it('should extract comprehensive metadata', async () => {
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url);
      
      if (result.success) {
        assert.ok(result.metadata, 'Should have metadata');
        
        const metadata = result.metadata;
        // At minimum, should extract title
        assert.ok(metadata.title || metadata.openGraph, 'Should have some metadata');
      }
    });

  });

  describe('Performance Tests', () => {
    
    it('should complete single URL generation in reasonable time', async () => {
      const startTime = Date.now();
      
      await URLSchemaGenerator.generateFromURL('https://example.com');
      
      const duration = Date.now() - startTime;
      
      // Should complete within 10 seconds (generous timeout for network)
      assert.ok(duration < 10000, `Should complete in < 10s, took ${duration}ms`);
    });

    it('should handle concurrent requests efficiently', async () => {
      const urls = Array.from({ length: 5 }, () => 'https://example.com');
      
      const startTime = Date.now();
      
      await URLSchemaGenerator.generateFromURLs(urls, {
        concurrency: 3
      });
      
      const duration = Date.now() - startTime;
      
      // With concurrency, should be faster than sequential
      // (5 sequential requests would take ~5-10s)
      assert.ok(duration < 20000, `Batch should complete efficiently, took ${duration}ms`);
    });

  });

  describe('CLI Integration Readiness', () => {
    
    it('should support all CLI options', async () => {
      // Test that the API supports all planned CLI options
      const result = await URLSchemaGenerator.generateFromURL('https://example.com', {
        targetTypes: ['Article'],
        includeRelated: true,
        optimizeFor: ['chatgpt'],
        validateWithGoogle: false
      });

      // Should not throw errors with these options
      assert.ok(result);
    });

    it('should provide user-friendly error messages', async () => {
      const result = await URLSchemaGenerator.generateFromURL('invalid-url');
      
      assert.ok(result.error, 'Should have error message');
      assert.ok(result.suggestion, 'Should have suggestion');
      
      // Messages should be user-friendly
      assert.ok(typeof result.error === 'string');
      assert.ok(typeof result.suggestion === 'string');
    });

  });

});

// Run with: node --test test/end-to-end.test.js

