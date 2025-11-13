import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import './setup.js';
import { cleanupDOM } from './setup.js';
import { 
  initSEO, 
  addFAQ, 
  injectMultipleSchemas,
  removeSchema, 
  removeAllSchemas, 
  listSchemas, 
  getSchema 
} from '../index.js';

describe('Core Functionality', () => {
  beforeEach(() => {
    // Clear any existing schemas
    cleanupDOM();
    removeAllSchemas();
  });

  afterEach(() => {
    // Clean up after each test
    cleanupDOM();
    removeAllSchemas();
  });

  describe('initSEO', () => {
    it('should inject a basic FAQ schema', () => {
      const result = initSEO({
        questionType: 'What is this?',
        answerType: 'This is a test'
      });

      assert.ok(result instanceof HTMLScriptElement);
      assert.strictEqual(result.type, 'application/ld+json');
      assert.strictEqual(result.getAttribute('data-ai-seo'), 'true');
      
      const schema = JSON.parse(result.textContent);
      assert.strictEqual(schema['@type'], 'FAQPage');
      assert.strictEqual(schema.mainEntity[0].name, 'What is this?');
    });

    it('should inject a custom schema', () => {
      const customSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Test Org"
      };

      const result = initSEO({ schema: customSchema });
      
      assert.ok(result instanceof HTMLScriptElement);
      const injectedSchema = JSON.parse(result.textContent);
      assert.strictEqual(injectedSchema['@context'], customSchema['@context']);
      assert.strictEqual(injectedSchema['@type'], customSchema['@type']);
      assert.strictEqual(injectedSchema.name, customSchema.name);
    });

    it('should validate schemas when enabled', () => {
      const invalidSchema = { name: 'Invalid' }; // Missing @context and @type
      
      const result = initSEO({ 
        schema: invalidSchema, 
        validate: true,
        debug: false 
      });

      // Should return null or undefined for invalid schema
      assert.ok(result === null || result === undefined);
    });

    it('should allow duplicate schemas when specified', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Test Org"
      };

      const first = initSEO({ schema, allowDuplicates: true });
      const second = initSEO({ schema, allowDuplicates: true });

      assert.ok(first instanceof HTMLScriptElement);
      assert.ok(second instanceof HTMLScriptElement);
      assert.notStrictEqual(first, second);
    });

    it('should use custom ID when provided', () => {
      const result = initSEO({
        questionType: 'Test?',
        answerType: 'Answer',
        id: 'custom-id'
      });

      assert.strictEqual(result.getAttribute('data-ai-seo-id'), 'custom-id');
    });
  });

  describe('addFAQ', () => {
    it('should create FAQ schema with simple parameters', () => {
      const result = addFAQ('What is this?', 'This is a test');
      
      assert.ok(result instanceof HTMLScriptElement);
      const schema = JSON.parse(result.textContent);
      assert.strictEqual(schema['@type'], 'FAQPage');
      assert.strictEqual(schema.mainEntity[0].name, 'What is this?');
      assert.strictEqual(schema.mainEntity[0].acceptedAnswer.text, 'This is a test');
    });
  });

  describe('injectMultipleSchemas', () => {
    it('should inject multiple schemas successfully', () => {
      const schemas = [
        { "@context": "https://schema.org", "@type": "Organization", "name": "Org 1" },
        { "@context": "https://schema.org", "@type": "Organization", "name": "Org 2" },
        { "@context": "https://schema.org", "@type": "Person", "name": "John Doe" }
      ];

      const results = injectMultipleSchemas(schemas);
      
      assert.strictEqual(results.length, 3);
      assert.ok(results.every(r => r.success));
      assert.ok(results.every(r => r.element instanceof HTMLScriptElement));
      
      // Check that all schemas were injected
      const injectedScripts = document.querySelectorAll('script[data-ai-seo]');
      assert.ok(injectedScripts.length >= 3);
    });

    it('should handle empty or invalid schemas array', () => {
      const results1 = injectMultipleSchemas([]);
      const results2 = injectMultipleSchemas();
      
      assert.deepStrictEqual(results1, []);
      assert.deepStrictEqual(results2, []);
    });

    it('should validate individual schemas', () => {
      const schemas = [
        { "@context": "https://schema.org", "@type": "Organization", "name": "Valid" },
        { "name": "Invalid - missing context and type" }
      ];

      const results = injectMultipleSchemas(schemas, { validate: true });
      
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].success, true);
      assert.strictEqual(results[1].success, false);
    });
  });

  describe('Schema Management', () => {
    it('should list all schemas', () => {
      addFAQ('Q1', 'A1', { id: 'faq-1' });
      addFAQ('Q2', 'A2', { id: 'faq-2' });

      const schemas = listSchemas();
      assert.strictEqual(schemas.length, 2);
      const ids = schemas.map(s => s.id);
      assert.ok(ids.includes('faq-1'));
      assert.ok(ids.includes('faq-2'));
    });

    it('should get schema by ID', () => {
      addFAQ('Test Q', 'Test A', { id: 'test-schema' });
      
      const schema = getSchema('test-schema');
      assert.ok(schema);
      assert.strictEqual(schema.schema['@type'], 'FAQPage');
    });

    it('should remove schema by ID', () => {
      addFAQ('Test Q', 'Test A', { id: 'removable' });
      
      assert.ok(getSchema('removable'));
      
      const removed = removeSchema('removable');
      assert.strictEqual(removed, true);
      assert.strictEqual(getSchema('removable'), null);
    });

    it('should remove all schemas', () => {
      addFAQ('Q1', 'A1');
      addFAQ('Q2', 'A2');
      addFAQ('Q3', 'A3');

      assert.strictEqual(listSchemas().length, 3);
      
      const removedCount = removeAllSchemas();
      assert.strictEqual(removedCount, 3);
      assert.strictEqual(listSchemas().length, 0);
    });
  });
}); 