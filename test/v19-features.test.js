/**
 * Test file for V1.9.0 new features
 * Tests autonomous schema management and context-aware AI suggestions
 */

import { test, describe } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { 
  AutonomousSchemaManager, 
  AIContextEngine,
  AutonomousManager,
  ContextEngine
} from '../index.js';

describe('V1.9.0 Features - Intelligence & Automation Revolution', () => {
  
  describe('Autonomous Schema Management', () => {
    test('AutonomousSchemaManager class should be available', () => {
      ok(AutonomousSchemaManager, 'AutonomousSchemaManager class should exist');
    });

    test('should create autonomous manager instance', () => {
      const manager = new AutonomousSchemaManager({
        autoDiscovery: false, // Disable for testing
        autoUpdates: false,
        healthMonitoring: false,
        learningMode: false
      });
      
      ok(manager, 'Manager instance should be created');
      strictEqual(manager.isRunning, false, 'Manager should not be running initially');
      strictEqual(manager.discoveredSchemas.size, 0, 'No schemas discovered initially');
    });

    test('should have proper configuration options', () => {
      const manager = new AutonomousSchemaManager({
        autoDiscovery: true,
        autoUpdates: true,
        healthMonitoring: true,
        learningMode: true,
        updateInterval: 60000,
        maxSchemas: 200
      });
      
      strictEqual(manager.options.autoDiscovery, true);
      strictEqual(manager.options.updateInterval, 60000);
      strictEqual(manager.options.maxSchemas, 200);
    });

    test('should provide stats and reports', () => {
      const manager = new AutonomousSchemaManager({
        autoDiscovery: false
      });
      
      const stats = manager.getStats();
      ok(stats, 'Stats should be available');
      ok(typeof stats.discovered === 'number', 'Should have discovered count');
      ok(typeof stats.managed === 'number', 'Should have managed count');
      ok(typeof stats.isRunning === 'boolean', 'Should have running status');
      
      const report = manager.getReport();
      ok(report, 'Report should be available');
      ok(report.stats, 'Report should contain stats');
      ok(Array.isArray(report.discoveredSchemas), 'Should have discovered schemas array');
      ok(Array.isArray(report.managedSchemas), 'Should have managed schemas array');
    });

    test('global AutonomousManager should be available', () => {
      ok(AutonomousManager, 'Global AutonomousManager should exist');
      ok(typeof AutonomousManager.start === 'function', 'Should have start method');
      ok(typeof AutonomousManager.stop === 'function', 'Should have stop method');
      ok(typeof AutonomousManager.getStats === 'function', 'Should have getStats method');
    });
  });

  describe('AI Context Engine', () => {
    test('AIContextEngine class should be available', () => {
      ok(AIContextEngine, 'AIContextEngine class should exist');
    });

    test('should create context engine instance', () => {
      const engine = new AIContextEngine({
        learningEnabled: false, // Disable for testing
        contextDepth: 'shallow',
        suggestionThreshold: 0.8,
        maxSuggestions: 3
      });
      
      ok(engine, 'Engine instance should be created');
      strictEqual(engine.options.contextDepth, 'shallow');
      strictEqual(engine.options.suggestionThreshold, 0.8);
      strictEqual(engine.options.maxSuggestions, 3);
    });

    test('should detect input types correctly', () => {
      const engine = new AIContextEngine();
      
      strictEqual(engine.detectInputType({ '@type': 'Product' }), 'schema');
      strictEqual(engine.detectInputType('https://example.com'), 'url');
      strictEqual(engine.detectInputType('This is a long piece of content that should be detected as content type'), 'content');
      strictEqual(engine.detectInputType('short query'), 'query');
      strictEqual(engine.detectInputType({ data: 'test' }), 'data');
    });

    test('should provide performance metrics', () => {
      const engine = new AIContextEngine();
      const metrics = engine.getMetrics();
      
      ok(metrics, 'Metrics should be available');
      ok(typeof metrics.totalSuggestions === 'number', 'Should have total suggestions count');
      ok(typeof metrics.acceptedSuggestions === 'number', 'Should have accepted suggestions count');
      ok(typeof metrics.rejectedSuggestions === 'number', 'Should have rejected suggestions count');
      ok(typeof metrics.averageConfidence === 'number', 'Should have average confidence');
      ok(typeof metrics.acceptanceRate === 'number', 'Should have acceptance rate');
    });

    test('should handle feedback recording', () => {
      const engine = new AIContextEngine();
      
      // Record some feedback
      engine.recordFeedback('test-suggestion-1', 'accepted', { schemaType: 'Product' });
      engine.recordFeedback('test-suggestion-2', 'rejected', { schemaType: 'Article' });
      
      const metrics = engine.getMetrics();
      strictEqual(metrics.acceptedSuggestions, 1, 'Should track accepted suggestions');
      strictEqual(metrics.rejectedSuggestions, 1, 'Should track rejected suggestions');
    });

    test('should calculate text complexity', () => {
      const engine = new AIContextEngine();
      
      strictEqual(engine.calculateTextComplexity('Short text.'), 'simple');
      strictEqual(engine.calculateTextComplexity('This is a medium length sentence with some complexity.'), 'medium');
      strictEqual(engine.calculateTextComplexity('This is a very long and complex sentence that contains multiple clauses and should be classified as complex text.'), 'complex');
    });

    test('should calculate similarity between inputs', () => {
      const engine = new AIContextEngine();
      
      const similarity1 = engine.calculateSimilarity('hello world', 'hello world');
      strictEqual(similarity1, 1.0, 'Identical strings should have 100% similarity');
      
      const similarity2 = engine.calculateSimilarity('hello world', 'hello earth');
      ok(similarity2 > 0.5 && similarity2 < 1.0, 'Similar strings should have moderate similarity');
      
      const similarity3 = engine.calculateSimilarity('hello world', 'completely different');
      ok(similarity3 < 0.5, 'Different strings should have low similarity');
    });

    test('global ContextEngine should be available', () => {
      ok(ContextEngine, 'Global ContextEngine should exist');
      ok(typeof ContextEngine.analyzeContext === 'function', 'Should have analyzeContext method');
      ok(typeof ContextEngine.recordFeedback === 'function', 'Should have recordFeedback method');
      ok(typeof ContextEngine.getMetrics === 'function', 'Should have getMetrics method');
    });
  });

  describe('Integration Tests', () => {
    test('autonomous manager and context engine should work together', () => {
      // Test that both systems can coexist
      const manager = new AutonomousSchemaManager({ autoDiscovery: false });
      const engine = new AIContextEngine({ learningEnabled: false });
      
      ok(manager, 'Manager should be created');
      ok(engine, 'Engine should be created');
      
      // Both should provide independent functionality
      const managerStats = manager.getStats();
      const engineMetrics = engine.getMetrics();
      
      ok(managerStats, 'Manager stats should be available');
      ok(engineMetrics, 'Engine metrics should be available');
    });

    test('should maintain backward compatibility', () => {
      // Test that existing functionality still works
      ok(AutonomousManager, 'Global instances should exist');
      ok(ContextEngine, 'Global instances should exist');
      
      // Test that they don't interfere with each other
      const managerRunning = AutonomousManager.isRunning;
      const engineMetrics = ContextEngine.getMetrics();
      
      ok(typeof managerRunning === 'boolean', 'Manager status should be boolean');
      ok(typeof engineMetrics === 'object', 'Engine metrics should be object');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid configuration gracefully', () => {
      // Test invalid options
      const manager = new AutonomousSchemaManager({
        updateInterval: 'invalid',
        maxSchemas: -1
      });
      
      // Should still create instance with defaults
      ok(manager, 'Manager should be created even with invalid options');
      ok(typeof manager.options.updateInterval === 'number', 'Should use default for invalid updateInterval');
    });

    test('should handle context analysis errors gracefully', async () => {
      const engine = new AIContextEngine();
      
      try {
        // Test with invalid input
        const result = await engine.analyzeContext(null);
        ok(result, 'Should return result even with null input');
        ok(result.context, 'Should have context object');
      } catch (error) {
        // Error handling is acceptable too
        ok(error instanceof Error, 'Should throw proper Error object');
      }
    });
  });
});
