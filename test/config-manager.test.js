// Config Manager Tests - v1.12.0
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { ConfigManager, OutputFormatter, getConfigManager, resetConfigManager } from '../src/config-manager.js';
import { existsSync, unlinkSync, writeFileSync } from 'fs';

describe('Config Manager - v1.12.0', () => {
  
  let config;
  const testConfigFile = '.aiseorc.test.json';

  beforeEach(() => {
    config = new ConfigManager();
  });

  afterEach(() => {
    if (existsSync(testConfigFile)) {
      unlinkSync(testConfigFile);
    }
    resetConfigManager();
  });

  describe('Default Configuration', () => {
    
    it('should have default config', () => {
      assert.ok(config.config.cache);
      assert.ok(config.config.rateLimiting);
      assert.ok(config.config.generation);
    });

    it('should get config values', () => {
      const cacheEnabled = config.get('cache.enabled');
      assert.strictEqual(cacheEnabled, true);
    });

    it('should get nested values with dot notation', () => {
      const ttl = config.get('cache.ttl');
      assert.strictEqual(typeof ttl, 'number');
    });

  });

  describe('Get and Set', () => {
    
    it('should set config values', () => {
      config.set('cache.enabled', false);
      assert.strictEqual(config.get('cache.enabled'), false);
    });

    it('should set nested values', () => {
      config.set('generation.concurrency', 5);
      assert.strictEqual(config.get('generation.concurrency'), 5);
    });

    it('should create missing paths', () => {
      config.set('new.nested.value', 123);
      assert.strictEqual(config.get('new.nested.value'), 123);
    });

  });

  describe('Load and Save', () => {
    
    it('should save config to file', () => {
      config.set('cache.enabled', false);
      const success = config.save(testConfigFile);
      
      assert.strictEqual(success, true);
      assert.ok(existsSync(testConfigFile));
    });

    it('should load config from file', () => {
      // Create test config
      const testConfig = { cache: { enabled: false, ttl: 1000 } };
      writeFileSync(testConfigFile, JSON.stringify(testConfig));
      
      const newConfig = new ConfigManager();
      const success = newConfig.load(testConfigFile);
      
      assert.strictEqual(success, true);
      assert.strictEqual(newConfig.get('cache.enabled'), false);
      assert.strictEqual(newConfig.get('cache.ttl'), 1000);
    });

    it('should merge with defaults when loading', () => {
      const testConfig = { cache: { enabled: false } };
      writeFileSync(testConfigFile, JSON.stringify(testConfig));
      
      const newConfig = new ConfigManager();
      newConfig.load(testConfigFile);
      
      // Should have loaded value
      assert.strictEqual(newConfig.get('cache.enabled'), false);
      // Should have default value
      assert.ok(newConfig.get('rateLimiting'));
    });

  });

  describe('Validation', () => {
    
    it('should validate correct config', () => {
      const result = config.validate();
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should detect invalid cache.ttl', () => {
      config.set('cache.ttl', -1);
      const result = config.validate();
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('cache.ttl')));
    });

    it('should detect invalid rate limiting', () => {
      config.set('rateLimiting.maxRequests', 0);
      const result = config.validate();
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('rateLimiting')));
    });

  });

  describe('Export and Reset', () => {
    
    it('should export config', () => {
      const exported = config.export();
      
      assert.ok(exported.cache);
      assert.ok(exported.rateLimiting);
    });

    it('should reset to defaults', () => {
      config.set('cache.enabled', false);
      config.reset();
      
      assert.strictEqual(config.get('cache.enabled'), true);
    });

  });

  describe('Global Config', () => {
    
    it('should provide global config manager', () => {
      const config1 = getConfigManager();
      const config2 = getConfigManager();
      
      assert.strictEqual(config1, config2);
    });

  });

});

describe('Output Formatter - v1.12.0', () => {
  
  describe('JSON Formatting', () => {
    
    it('should format to JSON', () => {
      const data = { test: 'value' };
      const json = OutputFormatter.toJSON(data);
      
      assert.ok(typeof json === 'string');
      assert.ok(json.includes('test'));
    });

    it('should format pretty JSON', () => {
      const data = { test: 'value' };
      const json = OutputFormatter.toJSON(data, true);
      
      assert.ok(json.includes('\n'));
    });

  });

  describe('CSV Formatting', () => {
    
    it('should format array to CSV', () => {
      const data = [
        { name: 'Item1', value: 100 },
        { name: 'Item2', value: 200 }
      ];
      const csv = OutputFormatter.toCSV(data);
      
      assert.ok(csv.includes('name,value'));
      assert.ok(csv.includes('Item1'));
    });

    it('should format object to CSV', () => {
      const data = { key1: 'value1', key2: 'value2' };
      const csv = OutputFormatter.toCSV(data);
      
      assert.ok(csv.includes('key,value'));
      assert.ok(csv.includes('key1'));
    });

    it('should handle commas in values', () => {
      const data = [{ name: 'Item, with comma' }];
      const csv = OutputFormatter.toCSV(data);
      
      assert.ok(csv.includes('"Item, with comma"'));
    });

  });

  describe('HTML Formatting', () => {
    
    it('should format to HTML', () => {
      const data = [{ name: 'Test', value: 123 }];
      const html = OutputFormatter.toHTML(data);
      
      assert.ok(html.includes('<!DOCTYPE html>'));
      assert.ok(html.includes('<table>'));
      assert.ok(html.includes('Test'));
    });

    it('should handle objects in HTML', () => {
      const data = { nested: { key: 'value' } };
      const html = OutputFormatter.toHTML(data);
      
      assert.ok(html.includes('pre'));
    });

  });

  describe('Auto Format', () => {
    
    it('should auto-format to JSON', () => {
      const data = { test: 'value' };
      const output = OutputFormatter.format(data, 'json');
      
      assert.ok(typeof output === 'string');
      assert.ok(output.includes('test'));
    });

    it('should auto-format to CSV', () => {
      const data = [{ name: 'Test' }];
      const output = OutputFormatter.format(data, 'csv');
      
      assert.ok(output.includes('name'));
    });

    it('should default to JSON for unknown format', () => {
      const data = { test: 'value' };
      const output = OutputFormatter.format(data, 'unknown');
      
      assert.ok(output.includes('test'));
    });

  });

});

// Run with: node --test test/config-manager.test.js

