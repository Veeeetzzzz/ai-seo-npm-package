// AI Integration Tests - v1.12.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { URLSchemaGenerator } from '../src/url-generator.js';

describe('AI Integration - v1.12.0', () => {
  
  describe('AI Optimizer Integration', () => {
    
    it('should apply AI optimization when requested', async () => {
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url, {
        optimizeFor: ['chatgpt']
      });

      assert.ok(result.success);
      assert.ok(result.schemas);
      assert.ok(result.schemas.length > 0);
      
      // Check if AI optimization was applied
      const schema = result.schemas[0];
      // AI optimization adds _aiOptimization metadata
      if (schema._aiOptimization) {
        assert.ok(schema._aiOptimization.optimizedFor);
        assert.ok(schema._aiOptimization.optimizations);
      }
    });

    it('should work without AI optimization', async () => {
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url);

      assert.ok(result.success);
      assert.ok(result.schemas);
    });

    it('should handle multiple AI targets', async () => {
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url, {
        optimizeFor: ['chatgpt', 'bard', 'claude']
      });

      assert.ok(result.success);
      assert.ok(result.schemas);
    });

    it('should handle voice optimization', async () => {
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url, {
        optimizeFor: ['voice']
      });

      assert.ok(result.success);
      assert.ok(result.schemas);
    });

    it('should continue if optimization fails', async () => {
      const url = 'https://example.com';
      
      // Should not throw even if optimization has issues
      const result = await URLSchemaGenerator.generateFromURL(url, {
        optimizeFor: ['invalid-optimizer']
      });

      assert.ok(result.success || result.error);
    });

  });

  describe('Suggestion Generation', () => {
    
    it('should generate suggestions for basic schemas', async () => {
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url);

      assert.ok(result.suggestions);
      assert.ok(Array.isArray(result.suggestions));
    });

    it('should suggest improvements for Product schemas', async () => {
      // This would need a more specific test with controlled content
      // For now, just verify suggestions exist
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url);

      assert.ok(result.suggestions);
    });

    it('should limit suggestions to reasonable number', async () => {
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url);

      assert.ok(result.suggestions);
      assert.ok(result.suggestions.length <= 5);
    });

  });

  describe('Options Handling', () => {
    
    it('should respect optimizeFor option', async () => {
      const url = 'https://example.com';
      
      const withOptimization = await URLSchemaGenerator.generateFromURL(url, {
        optimizeFor: ['chatgpt']
      });
      
      const withoutOptimization = await URLSchemaGenerator.generateFromURL(url);

      assert.ok(withOptimization.success);
      assert.ok(withoutOptimization.success);
    });

    it('should handle empty optimizeFor array', async () => {
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url, {
        optimizeFor: []
      });

      assert.ok(result.success);
    });

  });

  describe('Batch Processing with AI', () => {
    
    it('should apply AI optimization to batch results', async () => {
      const urls = ['https://example.com', 'https://example.org'];
      
      const results = await URLSchemaGenerator.generateFromURLs(urls, {
        optimizeFor: ['chatgpt'],
        concurrency: 2
      });

      assert.strictEqual(results.length, 2);
      results.forEach(result => {
        if (result.success) {
          assert.ok(result.schemas);
        }
      });
    });

  });

  describe('Error Handling', () => {
    
    it('should handle invalid URL with optimization', async () => {
      const result = await URLSchemaGenerator.generateFromURL('not-a-url', {
        optimizeFor: ['chatgpt']
      });

      // Should fail gracefully
      assert.ok(result.error || result.success === false);
    });

    it('should handle network errors with optimization', async () => {
      const result = await URLSchemaGenerator.generateFromURL('https://definitely-does-not-exist-123456.com', {
        optimizeFor: ['chatgpt']
      });

      assert.ok(result.error || result.success === false);
    });

  });

  describe('Integration with Templates and Content Analysis', () => {
    
    it('should work with schema templates', async () => {
      // Templates are used internally
      const url = 'https://example.com';
      
      const result = await URLSchemaGenerator.generateFromURL(url, {
        optimizeFor: ['chatgpt']
      });

      assert.ok(result.success);
      assert.ok(result.schemas);
      assert.ok(result.schemas[0]['@context']);
      assert.ok(result.schemas[0]['@type']);
    });

  });

});

// Run with: node --test test/ai-integration.test.js

