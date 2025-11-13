/**
 * Test file for V1.10.0 AI Search Engine Revolution
 * Tests AI search optimization for ChatGPT, Bard, Perplexity, Voice, and Visual search
 */

import { test, describe } from 'node:test';
import { strictEqual, ok, deepStrictEqual } from 'node:assert';
import { 
  AISearchEngines,
  ChatGPTOptimizer,
  BardOptimizer,
  PerplexityOptimizer,
  VoiceSearchOptimizer,
  VisualSearchOptimizer,
  AISearchOptimizer
} from '../index.js';

describe('V1.10.0 Features - AI Search Engine Revolution', () => {
  
  describe('AISearchEngines Core System', () => {
    test('AISearchEngines class should be available', () => {
      ok(AISearchEngines, 'AISearchEngines class should exist');
    });

    test('should create AI search engines instance', () => {
      const aiSearch = new AISearchEngines();
      
      ok(aiSearch, 'AISearchEngines instance should be created');
      ok(aiSearch.optimizers, 'Should have optimizers map');
      ok(aiSearch.analytics, 'Should have analytics map');
      ok(aiSearch.config, 'Should have configuration');
    });

    test('should register all optimizers', () => {
      const aiSearch = new AISearchEngines();
      
      strictEqual(aiSearch.optimizers.size, 5, 'Should register 5 optimizers');
      ok(aiSearch.isOptimizerAvailable('chatgpt'), 'ChatGPT optimizer should be available');
      ok(aiSearch.isOptimizerAvailable('bard'), 'Bard optimizer should be available');
      ok(aiSearch.isOptimizerAvailable('perplexity'), 'Perplexity optimizer should be available');
      ok(aiSearch.isOptimizerAvailable('voice'), 'Voice optimizer should be available');
      ok(aiSearch.isOptimizerAvailable('visual'), 'Visual optimizer should be available');
    });

    test('should get available optimizers', () => {
      const aiSearch = new AISearchEngines();
      const optimizers = aiSearch.getAvailableOptimizers();
      
      ok(Array.isArray(optimizers), 'Should return array of optimizers');
      strictEqual(optimizers.length, 5, 'Should have 5 optimizers');
      ok(optimizers.includes('chatgpt'), 'Should include ChatGPT');
      ok(optimizers.includes('bard'), 'Should include Bard');
      ok(optimizers.includes('perplexity'), 'Should include Perplexity');
    });

    test('should configure AI search engines', () => {
      const aiSearch = new AISearchEngines();
      const newConfig = {
        defaultTargets: ['chatgpt', 'bard'],
        performanceTracking: false
      };
      
      const updatedConfig = aiSearch.configure(newConfig);
      
      deepStrictEqual(updatedConfig.defaultTargets, ['chatgpt', 'bard']);
      strictEqual(updatedConfig.performanceTracking, false);
      strictEqual(updatedConfig.adaptiveOptimization, true); // Should keep existing values
    });

    test('global AISearchOptimizer should be available', () => {
      ok(AISearchOptimizer, 'Global AISearchOptimizer should exist');
      ok(typeof AISearchOptimizer.optimizeForAll === 'function', 'Should have optimizeForAll method');
      ok(typeof AISearchOptimizer.optimizeFor === 'function', 'Should have optimizeFor method');
      ok(typeof AISearchOptimizer.deploy === 'function', 'Should have deploy method');
    });
  });

  describe('Schema Optimization', () => {
    test('should optimize for specific AI search engine', async () => {
      const aiSearch = new AISearchEngines();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Test Product',
        'description': 'This is a test product for AI optimization'
      };

      const result = await aiSearch.optimizeFor('chatgpt', testSchema);
      
      ok(result, 'Should return optimization result');
      ok(result.original, 'Should include original schema');
      ok(result.optimized, 'Should include optimized schema');
      ok(result.metadata, 'Should include metadata');
      strictEqual(result.target, 'chatgpt', 'Should specify correct target');
      ok(result.metadata.processingTime >= 0, 'Should track processing time');
    });

    test('should optimize for all AI search engines', async () => {
      const aiSearch = new AISearchEngines();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'AI Search Revolution',
        'description': 'The future of search is AI-powered',
        'author': 'AI Researcher'
      };

      const result = await aiSearch.optimizeForAll(testSchema, {
        targets: ['chatgpt', 'bard', 'perplexity']
      });
      
      ok(result, 'Should return optimization result');
      ok(result.original, 'Should include original schema');
      ok(result.optimized, 'Should include optimized schemas');
      ok(result.metadata, 'Should include metadata');
      
      // Check optimized schemas
      ok(result.optimized.chatgpt, 'Should have ChatGPT optimized schema');
      ok(result.optimized.bard, 'Should have Bard optimized schema');
      ok(result.optimized.perplexity, 'Should have Perplexity optimized schema');
      
      // Check metadata
      strictEqual(result.metadata.targets.length, 3, 'Should process 3 targets');
      ok(result.metadata.processingTime >= 0, 'Should track processing time');
      ok(result.metadata.success, 'Should indicate success');
    });

    test('should handle optimization errors gracefully', async () => {
      const aiSearch = new AISearchEngines();
      
      // Test with invalid target
      try {
        await aiSearch.optimizeFor('invalid-target', {});
      } catch (error) {
        ok(error.message.includes('Optimizer not found'), 'Should throw appropriate error');
      }
    });

    test('should track optimization analytics', async () => {
      const aiSearch = new AISearchEngines();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Analytics Test Product'
      };

      // Perform optimization to generate analytics
      await aiSearch.optimizeFor('chatgpt', testSchema);
      
      const analytics = aiSearch.getAnalytics();
      
      ok(analytics, 'Should return analytics');
      ok(typeof analytics.totalOptimizations === 'number', 'Should have total optimizations');
      ok(typeof analytics.averageProcessingTime === 'number', 'Should have average processing time');
      ok(typeof analytics.successRate === 'number', 'Should have success rate');
      ok(analytics.popularTargets, 'Should have popular targets');
      ok(Array.isArray(analytics.recentOptimizations), 'Should have recent optimizations');
    });
  });

  describe('ChatGPT Optimizer', () => {
    test('ChatGPTOptimizer class should be available', () => {
      ok(ChatGPTOptimizer, 'ChatGPTOptimizer class should exist');
    });

    test('should create ChatGPT optimizer instance', () => {
      const optimizer = new ChatGPTOptimizer();
      
      ok(optimizer, 'Optimizer instance should be created');
      ok(optimizer.config, 'Should have configuration');
      strictEqual(optimizer.config.model, 'gpt-4', 'Should default to GPT-4');
      strictEqual(optimizer.config.conversationalOptimization, true, 'Should enable conversational optimization');
    });

    test('should optimize schema for ChatGPT', async () => {
      const optimizer = new ChatGPTOptimizer();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Wireless Headphones',
        'description': 'Premium wireless headphones with noise cancellation'
      };

      const optimized = await optimizer.optimize(testSchema);
      
      ok(optimized, 'Should return optimized schema');
      strictEqual(optimized['@context'], 'https://schema.org', 'Should preserve @context');
      strictEqual(optimized['@type'], 'Product', 'Should preserve @type');
      ok(optimized._aiOptimization, 'Should add AI optimization metadata');
      strictEqual(optimized._aiOptimization.engine, 'chatgpt', 'Should specify ChatGPT engine');
      strictEqual(optimized._aiOptimization.version, '1.10.0', 'Should specify version');
      ok(Array.isArray(optimized._aiOptimization.optimizations), 'Should list optimizations applied');
    });

    test('should add conversational structure', async () => {
      const optimizer = new ChatGPTOptimizer();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'AI Revolution in Search',
        'description': 'How AI is changing the search landscape'
      };

      const optimized = await optimizer.optimize(testSchema);
      
      ok(optimized.potentialAction, 'Should add potential actions');
      ok(optimized.mainEntity, 'Should add FAQ structure');
      ok(optimized.alternateName, 'Should add alternate names');
    });

    test('should enhance factual accuracy', async () => {
      const optimizer = new ChatGPTOptimizer();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Test Article',
        'author': 'Test Author'
      };

      const optimized = await optimizer.optimize(testSchema);
      
      ok(optimized.dateModified, 'Should add modification date');
      ok(optimized.about, 'Should add about information');
      ok(typeof optimized.author === 'object', 'Should enhance author information');
      strictEqual(optimized.author['@type'], 'Person', 'Should structure author as Person');
    });

    test('should add source attribution', async () => {
      const optimizer = new ChatGPTOptimizer();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Test Article'
      };

      const optimized = await optimizer.optimize(testSchema);
      
      ok(optimized.citation, 'Should add citation');
      ok(optimized.publisher, 'Should add publisher information');
      strictEqual(optimized.publisher['@type'], 'Organization', 'Should structure publisher as Organization');
    });

    test('should optimize for NLP', async () => {
      const optimizer = new ChatGPTOptimizer();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Natural Language Processing in Modern AI Systems',
        'description': 'This article explores the advanced capabilities of natural language processing in artificial intelligence systems and their applications in modern technology.'
      };

      const optimized = await optimizer.optimize(testSchema);
      
      ok(optimized.keywords, 'Should extract semantic keywords');
      ok(Array.isArray(optimized.keywords), 'Keywords should be an array');
      ok(optimized.keywords.length > 0, 'Should have extracted keywords');
      ok(optimized.about, 'Should add related concepts');
    });

    test('should configure ChatGPT optimizer', () => {
      const optimizer = new ChatGPTOptimizer();
      const newConfig = {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        conversationalOptimization: false
      };
      
      const updatedConfig = optimizer.configure(newConfig);
      
      strictEqual(updatedConfig.model, 'gpt-3.5-turbo', 'Should update model');
      strictEqual(updatedConfig.temperature, 0.5, 'Should update temperature');
      strictEqual(updatedConfig.conversationalOptimization, false, 'Should update optimization setting');
      strictEqual(updatedConfig.factCheckingMode, true, 'Should keep existing settings');
    });
  });

  describe('Other AI Optimizers', () => {
    test('BardOptimizer should be available', () => {
      ok(BardOptimizer, 'BardOptimizer class should exist');
      const optimizer = new BardOptimizer();
      ok(optimizer, 'Should create instance');
    });

    test('PerplexityOptimizer should be available', () => {
      ok(PerplexityOptimizer, 'PerplexityOptimizer class should exist');
      const optimizer = new PerplexityOptimizer();
      ok(optimizer, 'Should create instance');
    });

    test('VoiceSearchOptimizer should be available', () => {
      ok(VoiceSearchOptimizer, 'VoiceSearchOptimizer class should exist');
      const optimizer = new VoiceSearchOptimizer();
      ok(optimizer, 'Should create instance');
    });

    test('VisualSearchOptimizer should be available', () => {
      ok(VisualSearchOptimizer, 'VisualSearchOptimizer class should exist');
      const optimizer = new VisualSearchOptimizer();
      ok(optimizer, 'Should create instance');
    });

    test('placeholder optimizers should return placeholder schemas', async () => {
      const bardOptimizer = new BardOptimizer();
      const testSchema = { '@context': 'https://schema.org', '@type': 'Product' };
      
      const optimized = await bardOptimizer.optimize(testSchema);
      
      ok(optimized, 'Should return optimized schema');
      ok(optimized._aiOptimization, 'Should have AI optimization metadata');
      strictEqual(optimized._aiOptimization.engine, 'bard', 'Should specify Bard engine');
      strictEqual(optimized._aiOptimization.status, 'placeholder', 'Should indicate placeholder status');
    });
  });

  describe('Schema Deployment', () => {
    test('should deploy to web platform', async () => {
      const aiSearch = new AISearchEngines();
      const optimizedSchemas = {
        optimized: {
          chatgpt: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            'name': 'Test Product'
          }
        }
      };

      const result = await aiSearch.deploy(optimizedSchemas, {
        platforms: ['web']
      });
      
      ok(result, 'Should return deployment result');
      ok(result.deployments, 'Should have deployments object');
      ok(result.deployments.web, 'Should have web deployment');
      ok(Array.isArray(result.platforms), 'Should have platforms array');
    });

    test('should handle unsupported platforms', async () => {
      const aiSearch = new AISearchEngines();
      const optimizedSchemas = { optimized: {} };

      const result = await aiSearch.deploy(optimizedSchemas, {
        platforms: ['unsupported-platform']
      });
      
      ok(result.deployments['unsupported-platform'], 'Should handle unsupported platform');
      ok(result.deployments['unsupported-platform'].error, 'Should indicate error for unsupported platform');
    });

    test('should indicate future platform implementations', async () => {
      const aiSearch = new AISearchEngines();
      const optimizedSchemas = { optimized: { chatgpt: {} } };

      const result = await aiSearch.deploy(optimizedSchemas, {
        platforms: ['chatgpt-plugin', 'voice-assistants']
      });
      
      strictEqual(result.deployments['chatgpt-plugin'].status, 'not_implemented', 'Should indicate ChatGPT plugin not implemented');
      strictEqual(result.deployments['voice-assistants'].status, 'not_implemented', 'Should indicate voice assistants not implemented');
    });
  });

  describe('Performance and Analytics', () => {
    test('should track performance metrics', async () => {
      const aiSearch = new AISearchEngines();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Performance Test Product'
      };

      // Perform multiple optimizations
      await aiSearch.optimizeFor('chatgpt', testSchema);
      await aiSearch.optimizeFor('bard', testSchema);
      
      const analytics = aiSearch.getAnalytics();
      
      ok(analytics.totalOptimizations >= 2, 'Should track multiple optimizations');
      ok(analytics.averageProcessingTime >= 0, 'Should calculate average processing time');
      ok(analytics.popularTargets.chatgpt >= 1, 'Should track ChatGPT usage');
      ok(analytics.popularTargets.bard >= 1, 'Should track Bard usage');
    });

    test('should handle empty analytics', () => {
      const aiSearch = new AISearchEngines();
      const analytics = aiSearch.getAnalytics();
      
      strictEqual(analytics.totalOptimizations, 0, 'Should handle no optimizations');
      strictEqual(analytics.averageProcessingTime, 0, 'Should handle no processing time');
      strictEqual(analytics.successRate, 0, 'Should handle no success rate');
      deepStrictEqual(analytics.popularTargets, {}, 'Should have empty targets');
      strictEqual(analytics.recentOptimizations.length, 0, 'Should have no recent optimizations');
    });

    test('should limit analytics storage', async () => {
      const aiSearch = new AISearchEngines();
      aiSearch.analytics.clear(); // Start fresh
      
      // Simulate storage limit by directly manipulating analytics
      for (let i = 0; i < 1005; i++) {
        aiSearch.analytics.set(`test-${i}`, { timestamp: Date.now() });
      }
      
      // Add one more to trigger cleanup
      const testSchema = { '@context': 'https://schema.org', '@type': 'Test' };
      await aiSearch.optimizeFor('chatgpt', testSchema);
      
      ok(aiSearch.analytics.size <= 1000, 'Should limit analytics storage to 1000 entries');
    });
  });

  describe('Integration Tests', () => {
    test('should work with existing AI-SEO features', async () => {
      const aiSearch = new AISearchEngines();
      const testSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Integration Test Product',
        'description': 'Testing integration with existing features'
      };

      // Test optimization
      const optimized = await aiSearch.optimizeForAll(testSchema);
      ok(optimized, 'Should optimize successfully');

      // Test deployment
      const deployed = await aiSearch.deploy(optimized, { platforms: ['web'] });
      ok(deployed, 'Should deploy successfully');

      // Test analytics
      const analytics = aiSearch.getAnalytics();
      ok(analytics.totalOptimizations > 0, 'Should track optimizations');
    });

    test('should maintain backward compatibility', () => {
      // Test that new features don't break existing functionality
      ok(AISearchOptimizer, 'Global optimizer should be available');
      ok(typeof AISearchOptimizer.optimizeForAll === 'function', 'Should have new methods');
      
      // Test that existing exports still work
      const { initSEO, addFAQ } = require('../index.js');
      ok(initSEO, 'Existing initSEO should still work');
      ok(addFAQ, 'Existing addFAQ should still work');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid schemas gracefully', async () => {
      const aiSearch = new AISearchEngines();
      
      try {
        await aiSearch.optimizeFor('chatgpt', null);
      } catch (error) {
        ok(error instanceof Error, 'Should throw proper Error object');
      }
    });

    test('should handle optimizer failures gracefully', async () => {
      const aiSearch = new AISearchEngines();
      const invalidSchema = { invalid: 'schema' };

      const result = await aiSearch.optimizeForAll(invalidSchema);
      
      ok(result, 'Should return result even with failures');
      ok(result.metadata, 'Should include metadata');
      // Should not throw, but may have errors in individual optimizers
    });

    test('should handle deployment failures gracefully', async () => {
      const aiSearch = new AISearchEngines();
      const invalidSchemas = { optimized: { chatgpt: null } };

      const result = await aiSearch.deploy(invalidSchemas);
      
      ok(result, 'Should return deployment result');
      ok(result.deployments, 'Should have deployments object');
      // Should handle null schemas without throwing
    });
  });
});
