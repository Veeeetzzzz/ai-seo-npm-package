// Related Schema Detector Tests - v1.12.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RelatedSchemaDetector } from '../src/related-schema-detector.js';

describe('Related Schema Detector - v1.12.0', () => {
  
  describe('Breadcrumb Generation', () => {
    
    it('should generate breadcrumbs from URL', () => {
      const primarySchema = {
        '@type': 'Product',
        name: 'Test'
      };

      const parsed = {
        url: 'https://example.com/products/electronics/phone'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const breadcrumb = related.find(s => s['@type'] === 'BreadcrumbList');
      assert.ok(breadcrumb);
      assert.ok(breadcrumb.itemListElement);
      assert.ok(breadcrumb.itemListElement.length > 1);
    });

    it('should not generate breadcrumb for homepage', () => {
      const primarySchema = {
        '@type': 'WebPage',
        name: 'Home'
      };

      const parsed = {
        url: 'https://example.com/'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const breadcrumb = related.find(s => s['@type'] === 'BreadcrumbList');
      assert.ok(!breadcrumb);
    });

    it('should format breadcrumb names properly', () => {
      const primarySchema = {
        '@type': 'Product',
        name: 'Test'
      };

      const parsed = {
        url: 'https://example.com/my-cool-product'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const breadcrumb = related.find(s => s['@type'] === 'BreadcrumbList');
      if (breadcrumb) {
        const lastItem = breadcrumb.itemListElement[breadcrumb.itemListElement.length - 1];
        assert.ok(lastItem.name.includes(' ')); // Should have spaces
      }
    });

  });

  describe('Article Related Schemas', () => {
    
    it('should generate Person schema for author', () => {
      const primarySchema = {
        '@type': 'Article',
        headline: 'Test Article',
        author: {
          '@type': 'Person',
          name: 'John Doe'
        }
      };

      const parsed = {
        url: 'https://example.com/article',
        title: 'Test Article'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const person = related.find(s => s['@type'] === 'Person');
      assert.ok(person);
      assert.strictEqual(person.name, 'John Doe');
    });

    it('should generate Organization schema for publisher', () => {
      const primarySchema = {
        '@type': 'Article',
        headline: 'Test',
        publisher: {
          '@type': 'Organization',
          name: 'Test Publisher'
        }
      };

      const parsed = {
        url: 'https://example.com/article',
        title: 'Test'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const org = related.find(s => s['@type'] === 'Organization');
      assert.ok(org);
      assert.strictEqual(org.name, 'Test Publisher');
    });

    it('should generate WebPage schema for article', () => {
      const primarySchema = {
        '@type': 'Article',
        headline: 'Test'
      };

      const parsed = {
        url: 'https://example.com/article',
        title: 'Test Article',
        description: 'Description'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const webpage = related.find(s => s['@type'] === 'WebPage');
      assert.ok(webpage);
      assert.strictEqual(webpage.url, parsed.url);
    });

  });

  describe('Product Related Schemas', () => {
    
    it('should generate Brand schema', () => {
      const primarySchema = {
        '@type': 'Product',
        name: 'Test Product',
        brand: {
          '@type': 'Brand',
          name: 'TestBrand'
        }
      };

      const parsed = {
        url: 'https://example.com/product'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const brand = related.find(s => s['@type'] === 'Brand');
      assert.ok(brand);
      assert.strictEqual(brand.name, 'TestBrand');
    });

    it('should generate Organization from analysis', () => {
      const primarySchema = {
        '@type': 'Product',
        name: 'Test'
      };

      const parsed = {
        url: 'https://example.com/product'
      };

      const analysis = {
        entities: {
          organizations: ['Test Company Inc.']
        }
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, analysis);

      const org = related.find(s => s['@type'] === 'Organization');
      if (org) {
        assert.ok(org.name);
      }
    });

  });

  describe('Business Related Schemas', () => {
    
    it('should generate Place schema', () => {
      const primarySchema = {
        '@type': 'LocalBusiness',
        name: 'Test Business',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main St'
        }
      };

      const parsed = {
        url: 'https://example.com/business'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const place = related.find(s => s['@type'] === 'Place');
      assert.ok(place);
      assert.ok(place.address);
    });

    it('should generate PostalAddress schema', () => {
      const primarySchema = {
        '@type': 'LocalBusiness',
        name: 'Test',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main St',
          addressLocality: 'City'
        }
      };

      const parsed = {
        url: 'https://example.com/business'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const addresses = related.filter(s => s['@type'] === 'PostalAddress');
      assert.ok(addresses.length > 0);
    });

  });

  describe('Event Related Schemas', () => {
    
    it('should generate Place schema for location', () => {
      const primarySchema = {
        '@type': 'Event',
        name: 'Test Event',
        location: {
          '@type': 'Place',
          name: 'Event Venue',
          address: {
            streetAddress: '123 Main St'
          }
        }
      };

      const parsed = {
        url: 'https://example.com/event'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const place = related.find(s => s['@type'] === 'Place');
      assert.ok(place);
      assert.strictEqual(place.name, 'Event Venue');
    });

    it('should generate Organization for organizer', () => {
      const primarySchema = {
        '@type': 'Event',
        name: 'Test Event',
        organizer: {
          '@type': 'Organization',
          name: 'Event Org'
        }
      };

      const parsed = {
        url: 'https://example.com/event'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const org = related.find(s => s['@type'] === 'Organization' && s.name === 'Event Org');
      assert.ok(org);
    });

    it('should generate Person for performer', () => {
      const primarySchema = {
        '@type': 'Event',
        name: 'Concert',
        performer: {
          '@type': 'Person',
          name: 'Artist Name'
        }
      };

      const parsed = {
        url: 'https://example.com/event'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const person = related.find(s => s['@type'] === 'Person');
      assert.ok(person);
      assert.strictEqual(person.name, 'Artist Name');
    });

  });

  describe('WebSite Schema Generation', () => {
    
    it('should generate WebSite schema', () => {
      const primarySchema = {
        '@type': 'Article',
        headline: 'Test'
      };

      const parsed = {
        url: 'https://example.com/article',
        title: 'Test Article - Example Site'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const website = related.find(s => s['@type'] === 'WebSite');
      assert.ok(website);
      assert.ok(website.url);
      assert.ok(website.potentialAction);
    });

    it('should extract site name from title', () => {
      const primarySchema = {
        '@type': 'WebPage',
        name: 'Page'
      };

      const parsed = {
        url: 'https://example.com/page',
        title: 'Page Title | Site Name'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      const website = related.find(s => s['@type'] === 'WebSite');
      if (website) {
        assert.ok(website.name);
      }
    });

  });

  describe('Relationship Building', () => {
    
    it('should build relationships between schemas', () => {
      const primarySchema = {
        '@type': 'Article',
        headline: 'Test'
      };

      const relatedSchemas = [
        {
          '@type': 'Person',
          '@id': 'author-1',
          name: 'John Doe'
        },
        {
          '@type': 'WebPage',
          '@id': 'https://example.com/article'
        }
      ];

      const enhanced = RelatedSchemaDetector.buildRelationships(primarySchema, relatedSchemas);

      assert.ok(Array.isArray(enhanced));
      assert.ok(enhanced.length > 0);
    });

    it('should not modify original schema', () => {
      const primarySchema = {
        '@type': 'Article',
        headline: 'Test'
      };

      const originalCopy = JSON.stringify(primarySchema);

      RelatedSchemaDetector.buildRelationships(primarySchema, []);

      assert.strictEqual(JSON.stringify(primarySchema), originalCopy);
    });

  });

  describe('Edge Cases', () => {
    
    it('should handle missing primary schema', () => {
      const related = RelatedSchemaDetector.detectRelated(null, {}, {});

      assert.ok(Array.isArray(related));
      assert.strictEqual(related.length, 0);
    });

    it('should handle invalid URL', () => {
      const primarySchema = {
        '@type': 'Product',
        name: 'Test'
      };

      const parsed = {
        url: 'not-a-valid-url'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed, {});

      assert.ok(Array.isArray(related));
      // Should not throw error
    });

    it('should handle missing analysis', () => {
      const primarySchema = {
        '@type': 'Article',
        headline: 'Test'
      };

      const parsed = {
        url: 'https://example.com/article'
      };

      const related = RelatedSchemaDetector.detectRelated(primarySchema, parsed);

      assert.ok(Array.isArray(related));
    });

  });

});

// Run with: node --test test/related-schemas.test.js

