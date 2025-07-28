import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    removeAllSchemas();
  });

  describe('initSEO', () => {
    it('should inject a basic FAQ schema', () => {
      const result = initSEO({
        questionType: 'What is this?',
        answerType: 'This is a test'
      });

      expect(result).toBeInstanceOf(HTMLScriptElement);
      expect(result.type).toBe('application/ld+json');
      expect(result.getAttribute('data-ai-seo')).toBe('true');
      
      const schema = JSON.parse(result.textContent);
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity[0].name).toBe('What is this?');
    });

    it('should inject a custom schema', () => {
      const customSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Test Org"
      };

      const result = initSEO({ schema: customSchema });
      
      expect(result).toBeInstanceOf(HTMLScriptElement);
      const injectedSchema = JSON.parse(result.textContent);
      expect(injectedSchema).toEqual(customSchema);
    });

    it('should validate schemas when enabled', () => {
      const invalidSchema = { name: 'Invalid' }; // Missing @context and @type
      
      const result = initSEO({ 
        schema: invalidSchema, 
        validate: true,
        debug: true 
      });

      expect(result).toBeNull();
    });

    it('should allow duplicate schemas when specified', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Test Org"
      };

      const first = initSEO({ schema, allowDuplicates: true });
      const second = initSEO({ schema, allowDuplicates: true });

      expect(first).toBeInstanceOf(HTMLScriptElement);
      expect(second).toBeInstanceOf(HTMLScriptElement);
      expect(first).not.toBe(second);
    });

    it('should use custom ID when provided', () => {
      const result = initSEO({
        questionType: 'Test?',
        answerType: 'Answer',
        id: 'custom-id'
      });

      expect(result.getAttribute('data-ai-seo-id')).toBe('custom-id');
    });
  });

  describe('addFAQ', () => {
    it('should create FAQ schema with simple parameters', () => {
      const result = addFAQ('What is this?', 'This is a test');
      
      expect(result).toBeInstanceOf(HTMLScriptElement);
      const schema = JSON.parse(result.textContent);
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity[0].name).toBe('What is this?');
      expect(schema.mainEntity[0].acceptedAnswer.text).toBe('This is a test');
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
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.element instanceof HTMLScriptElement)).toBe(true);
      
      // Check that all schemas were injected
      const injectedScripts = document.querySelectorAll('script[data-ai-seo]');
      expect(injectedScripts).toHaveLength(3);
    });

    it('should handle empty or invalid schemas array', () => {
      const results1 = injectMultipleSchemas([]);
      const results2 = injectMultipleSchemas();
      
      expect(results1).toEqual([]);
      expect(results2).toEqual([]);
    });

    it('should validate individual schemas', () => {
      const schemas = [
        { "@context": "https://schema.org", "@type": "Organization", "name": "Valid" },
        { "name": "Invalid - missing context and type" }
      ];

      const results = injectMultipleSchemas(schemas, { validate: true });
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Schema Management', () => {
    it('should list all schemas', () => {
      addFAQ('Q1', 'A1', { id: 'faq-1' });
      addFAQ('Q2', 'A2', { id: 'faq-2' });

      const schemas = listSchemas();
      expect(schemas).toHaveLength(2);
      expect(schemas.map(s => s.id)).toContain('faq-1');
      expect(schemas.map(s => s.id)).toContain('faq-2');
    });

    it('should get schema by ID', () => {
      addFAQ('Test Q', 'Test A', { id: 'test-schema' });
      
      const schema = getSchema('test-schema');
      expect(schema).toBeTruthy();
      expect(schema.schema['@type']).toBe('FAQPage');
    });

    it('should remove schema by ID', () => {
      addFAQ('Test Q', 'Test A', { id: 'removable' });
      
      expect(getSchema('removable')).toBeTruthy();
      
      const removed = removeSchema('removable');
      expect(removed).toBe(true);
      expect(getSchema('removable')).toBeNull();
    });

    it('should remove all schemas', () => {
      addFAQ('Q1', 'A1');
      addFAQ('Q2', 'A2');
      addFAQ('Q3', 'A3');

      expect(listSchemas()).toHaveLength(3);
      
      const removedCount = removeAllSchemas();
      expect(removedCount).toBe(3);
      expect(listSchemas()).toHaveLength(0);
    });
  });
}); 