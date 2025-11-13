// Schema Validator Tests - v1.12.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SchemaValidator } from '../src/schema-validator.js';

describe('Schema Validator - v1.12.0', () => {
  
  describe('Basic Validation', () => {
    
    it('should validate valid schema', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test Product',
        offers: {
          '@type': 'Offer',
          price: '99.99',
          priceCurrency: 'USD'
        }
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.valid);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should detect missing @context', () => {
      const schema = {
        '@type': 'Product',
        name: 'Test'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.errors.some(e => e.includes('@context')));
    });

    it('should detect missing @type', () => {
      const schema = {
        '@context': 'https://schema.org',
        name: 'Test'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.errors.some(e => e.includes('@type')));
    });

    it('should handle null or invalid input', () => {
      const result = SchemaValidator.validate(null);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

  });

  describe('Product Validation', () => {
    
    it('should require offers for Product', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test Product'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.errors.some(e => e.includes('offers')));
    });

    it('should validate complete Product', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Complete Product',
        description: 'Full description',
        image: 'https://example.com/image.jpg',
        brand: {
          '@type': 'Brand',
          name: 'TestBrand'
        },
        offers: {
          '@type': 'Offer',
          price: '99.99',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        }
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.valid);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should suggest adding brand', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Product',
        offers: { price: '99' }
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.suggestions.some(s => s.includes('brand')));
    });

  });

  describe('Article Validation', () => {
    
    it('should require headline for Article', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.errors.some(e => e.includes('headline')));
    });

    it('should validate complete Article', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        description: 'Article description',
        image: 'https://example.com/image.jpg',
        author: {
          '@type': 'Person',
          name: 'John Doe'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Publisher',
          logo: {
            '@type': 'ImageObject',
            url: 'https://example.com/logo.jpg'
          }
        },
        datePublished: '2025-01-01'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.valid);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should warn about missing image', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.warnings.some(w => w.includes('image')));
    });

  });

  describe('LocalBusiness Validation', () => {
    
    it('should require address for LocalBusiness', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Test Business'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.errors.some(e => e.includes('address')));
    });

    it('should validate complete LocalBusiness', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Test Business',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main St',
          addressLocality: 'City',
          addressRegion: 'State',
          postalCode: '12345'
        },
        telephone: '555-1234'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.valid);
      assert.strictEqual(result.errors.length, 0);
    });

  });

  describe('Event Validation', () => {
    
    it('should require startDate for Event', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Test Event'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.errors.some(e => e.includes('startDate')));
    });

    it('should require location for Event', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Test Event',
        startDate: '2025-01-01'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.errors.some(e => e.includes('location')));
    });

  });

  describe('Recipe Validation', () => {
    
    it('should require ingredients for Recipe', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: 'Test Recipe'
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.errors.some(e => e.includes('ingredients') || e.includes('recipeIngredient')));
    });

    it('should require instructions for Recipe', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: 'Test Recipe',
        recipeIngredient: ['flour']
      };

      const result = SchemaValidator.validate(schema);

      assert.ok(result.errors.some(e => e.includes('instructions') || e.includes('recipeInstructions')));
    });

  });

  describe('Google Guidelines', () => {
    
    it('should check Google-specific requirements', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test',
        offers: {
          price: 'invalid-price',
          priceCurrency: 'USD'
        }
      };

      const result = SchemaValidator.validate(schema, { checkGoogleGuidelines: true });

      assert.ok(result.warnings.length > 0 || result.suggestions.length > 0);
    });

    it('should suggest canonical URL', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test'
      };

      const result = SchemaValidator.validate(schema, { checkGoogleGuidelines: true });

      assert.ok(result.suggestions.some(s => s.includes('URL') || s.includes('url')));
    });

  });

  describe('Auto-Fix Generation', () => {
    
    it('should generate fixes for missing @context', () => {
      const schema = {
        '@type': 'Product',
        name: 'Test'
      };

      const result = SchemaValidator.validate(schema, { suggestFixes: true });

      assert.ok(result.fixes.length > 0);
      assert.ok(result.fixes.some(f => f.field === '@context'));
    });

    it('should not generate fixes when disabled', () => {
      const schema = {
        '@type': 'Product',
        name: 'Test'
      };

      const result = SchemaValidator.validate(schema, { suggestFixes: false });

      assert.strictEqual(result.fixes.length, 0);
    });

  });

  describe('Fix Application', () => {
    
    it('should apply fixes to schema', () => {
      const schema = {
        '@type': 'Product',
        name: 'Test'
      };

      const validation = SchemaValidator.validate(schema);
      const fixed = SchemaValidator.applyFixes(schema, validation.fixes);

      assert.ok(fixed['@context']);
      assert.strictEqual(fixed['@context'], 'https://schema.org');
    });

    it('should not modify original schema', () => {
      const schema = {
        '@type': 'Product',
        name: 'Test'
      };

      const validation = SchemaValidator.validate(schema);
      SchemaValidator.applyFixes(schema, validation.fixes);

      // Original should be unchanged
      assert.ok(!schema['@context']);
    });

  });

  describe('Scoring', () => {
    
    it('should calculate score based on issues', () => {
      const perfect = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Perfect Product',
        description: 'Description',
        image: 'image.jpg',
        offers: {
          '@type': 'Offer',
          price: '99.99',
          priceCurrency: 'USD'
        }
      };

      const imperfect = {
        '@type': 'Product',
        name: 'Imperfect'
      };

      const perfectResult = SchemaValidator.validate(perfect);
      const imperfectResult = SchemaValidator.validate(imperfect);

      assert.ok(perfectResult.score > imperfectResult.score);
    });

    it('should give higher score to complete schemas', () => {
      const complete = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Complete Article',
        description: 'Description',
        image: 'image.jpg',
        author: { '@type': 'Person', name: 'Author' },
        publisher: { '@type': 'Organization', name: 'Publisher' },
        datePublished: '2025-01-01'
      };

      const result = SchemaValidator.validate(complete);

      assert.ok(result.score >= 80);
    });

  });

  describe('Validation Summary', () => {
    
    it('should generate human-readable summary', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test',
        offers: { price: '99' }
      };

      const validation = SchemaValidator.validate(schema);
      const summary = SchemaValidator.getSummary(validation);

      assert.ok(typeof summary === 'string');
      assert.ok(summary.length > 0);
      assert.ok(summary.includes('Score'));
    });

  });

  describe('Strict Mode', () => {
    
    it('should be more strict when enabled', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test',
        offers: { price: '99' }
      };

      const normal = SchemaValidator.validate(schema, { strict: false });
      const strict = SchemaValidator.validate(schema, { strict: true });

      // Strict mode should have more or equal issues
      const normalTotal = normal.errors.length + normal.warnings.length;
      const strictTotal = strict.errors.length + strict.warnings.length;

      assert.ok(strictTotal >= normalTotal);
    });

  });

});

// Run with: node --test test/schema-validator.test.js

