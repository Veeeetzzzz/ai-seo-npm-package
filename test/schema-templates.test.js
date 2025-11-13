// Schema Templates Tests - v1.12.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SchemaTemplates } from '../src/schema-templates.js';

describe('Schema Templates - v1.12.0', () => {
  
  describe('Template Availability', () => {
    
    it('should return list of available templates', () => {
      const templates = SchemaTemplates.getAvailableTemplates();
      
      assert.ok(Array.isArray(templates));
      assert.ok(templates.length > 0);
      assert.ok(templates.includes('Product'));
      assert.ok(templates.includes('Article'));
      assert.ok(templates.includes('LocalBusiness'));
    });

    it('should have at least 15 templates', () => {
      const templates = SchemaTemplates.getAvailableTemplates();
      assert.ok(templates.length >= 15);
    });

  });

  describe('Product Template', () => {
    
    it('should create basic Product template', () => {
      const product = SchemaTemplates.create('Product', {
        name: 'Test Product',
        description: 'A test product',
        price: '99.99'
      });

      assert.strictEqual(product['@context'], 'https://schema.org');
      assert.strictEqual(product['@type'], 'Product');
      assert.strictEqual(product.name, 'Test Product');
      assert.strictEqual(product.description, 'A test product');
      assert.ok(product.offers);
      assert.strictEqual(product.offers.price, '99.99');
    });

    it('should include brand when provided', () => {
      const product = SchemaTemplates.create('Product', {
        name: 'Branded Product',
        brand: 'Test Brand'
      });

      assert.ok(product.brand);
      assert.strictEqual(product.brand['@type'], 'Brand');
      assert.strictEqual(product.brand.name, 'Test Brand');
    });

    it('should include rating when provided', () => {
      const product = SchemaTemplates.create('Product', {
        name: 'Rated Product',
        rating: {
          ratingValue: '4.5',
          reviewCount: '100'
        }
      });

      assert.ok(product.aggregateRating);
      assert.strictEqual(product.aggregateRating.ratingValue, '4.5');
      assert.strictEqual(product.aggregateRating.reviewCount, '100');
    });

  });

  describe('Article Template', () => {
    
    it('should create basic Article template', () => {
      const article = SchemaTemplates.create('Article', {
        headline: 'Test Article',
        description: 'Article description',
        author: 'John Doe'
      });

      assert.strictEqual(article['@type'], 'Article');
      assert.strictEqual(article.headline, 'Test Article');
      assert.ok(article.author);
      assert.strictEqual(article.author.name, 'John Doe');
    });

    it('should include publisher when provided', () => {
      const article = SchemaTemplates.create('Article', {
        headline: 'Published Article',
        publisher: {
          name: 'Test Publisher',
          logo: 'https://example.com/logo.png'
        }
      });

      assert.ok(article.publisher);
      assert.strictEqual(article.publisher.name, 'Test Publisher');
      assert.ok(article.publisher.logo);
      assert.strictEqual(article.publisher.logo.url, 'https://example.com/logo.png');
    });

    it('should set publication dates', () => {
      const article = SchemaTemplates.create('Article', {
        headline: 'Dated Article'
      });

      assert.ok(article.datePublished);
      assert.ok(article.dateModified);
    });

  });

  describe('LocalBusiness Template', () => {
    
    it('should create basic LocalBusiness template', () => {
      const business = SchemaTemplates.create('LocalBusiness', {
        name: 'Test Business',
        telephone: '555-1234',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345'
        }
      });

      assert.strictEqual(business['@type'], 'LocalBusiness');
      assert.strictEqual(business.name, 'Test Business');
      assert.strictEqual(business.telephone, '555-1234');
      assert.ok(business.address);
      assert.strictEqual(business.address.streetAddress, '123 Main St');
    });

    it('should include geo coordinates when provided', () => {
      const business = SchemaTemplates.create('LocalBusiness', {
        name: 'Geo Business',
        latitude: '37.7749',
        longitude: '-122.4194'
      });

      assert.ok(business.geo);
      assert.strictEqual(business.geo.latitude, '37.7749');
      assert.strictEqual(business.geo.longitude, '-122.4194');
    });

  });

  describe('Restaurant Template', () => {
    
    it('should create Restaurant template (extends LocalBusiness)', () => {
      const restaurant = SchemaTemplates.create('Restaurant', {
        name: 'Test Restaurant',
        servesCuisine: 'Italian',
        telephone: '555-5678'
      });

      assert.strictEqual(restaurant['@type'], 'Restaurant');
      assert.strictEqual(restaurant.name, 'Test Restaurant');
      assert.strictEqual(restaurant.servesCuisine, 'Italian');
      assert.strictEqual(restaurant.acceptsReservations, true);
    });

  });

  describe('Event Template', () => {
    
    it('should create basic Event template', () => {
      const event = SchemaTemplates.create('Event', {
        name: 'Test Event',
        startDate: '2025-12-01T19:00:00',
        location: {
          name: 'Event Venue',
          address: {
            city: 'San Francisco',
            state: 'CA'
          }
        }
      });

      assert.strictEqual(event['@type'], 'Event');
      assert.strictEqual(event.name, 'Test Event');
      assert.strictEqual(event.startDate, '2025-12-01T19:00:00');
      assert.ok(event.location);
      assert.strictEqual(event.location.name, 'Event Venue');
    });

    it('should include organizer when provided', () => {
      const event = SchemaTemplates.create('Event', {
        name: 'Organized Event',
        organizer: 'Event Org'
      });

      assert.ok(event.organizer);
      assert.strictEqual(event.organizer.name, 'Event Org');
    });

  });

  describe('Recipe Template', () => {
    
    it('should create basic Recipe template', () => {
      const recipe = SchemaTemplates.create('Recipe', {
        name: 'Test Recipe',
        author: 'Chef John',
        prepTime: 'PT15M',
        cookTime: 'PT30M',
        ingredients: ['flour', 'sugar', 'eggs'],
        instructions: ['Mix ingredients', 'Bake at 350°F']
      });

      assert.strictEqual(recipe['@type'], 'Recipe');
      assert.strictEqual(recipe.name, 'Test Recipe');
      assert.strictEqual(recipe.prepTime, 'PT15M');
      assert.ok(Array.isArray(recipe.recipeIngredient));
      assert.strictEqual(recipe.recipeIngredient.length, 3);
    });

    it('should include nutrition when provided', () => {
      const recipe = SchemaTemplates.create('Recipe', {
        name: 'Nutritious Recipe',
        nutrition: {
          calories: '250',
          proteinContent: '15g'
        }
      });

      assert.ok(recipe.nutrition);
      assert.strictEqual(recipe.nutrition.calories, '250');
      assert.strictEqual(recipe.nutrition.proteinContent, '15g');
    });

  });

  describe('VideoObject Template', () => {
    
    it('should create basic VideoObject template', () => {
      const video = SchemaTemplates.create('VideoObject', {
        name: 'Test Video',
        description: 'Video description',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        duration: 'PT5M30S'
      });

      assert.strictEqual(video['@type'], 'VideoObject');
      assert.strictEqual(video.name, 'Test Video');
      assert.strictEqual(video.duration, 'PT5M30S');
      assert.strictEqual(video.thumbnailUrl, 'https://example.com/thumb.jpg');
    });

    it('should include view count when provided', () => {
      const video = SchemaTemplates.create('VideoObject', {
        name: 'Popular Video',
        views: '10000'
      });

      assert.ok(video.interactionStatistic);
      assert.strictEqual(video.interactionStatistic.userInteractionCount, '10000');
    });

  });

  describe('FAQPage Template', () => {
    
    it('should create FAQPage template with questions', () => {
      const faq = SchemaTemplates.create('FAQPage', {
        questions: [
          { question: 'What is this?', answer: 'This is a test.' },
          { question: 'Why test?', answer: 'Testing is important.' }
        ]
      });

      assert.strictEqual(faq['@type'], 'FAQPage');
      assert.ok(Array.isArray(faq.mainEntity));
      assert.strictEqual(faq.mainEntity.length, 2);
      assert.strictEqual(faq.mainEntity[0]['@type'], 'Question');
      assert.strictEqual(faq.mainEntity[0].name, 'What is this?');
    });

  });

  describe('HowTo Template', () => {
    
    it('should create HowTo template with steps', () => {
      const howto = SchemaTemplates.create('HowTo', {
        name: 'How to Test',
        steps: [
          { name: 'Step 1', text: 'Do this first' },
          { name: 'Step 2', text: 'Then do this' }
        ]
      });

      assert.strictEqual(howto['@type'], 'HowTo');
      assert.ok(Array.isArray(howto.step));
      assert.strictEqual(howto.step.length, 2);
      assert.strictEqual(howto.step[0].position, 1);
      assert.strictEqual(howto.step[0].name, 'Step 1');
    });

  });

  describe('Template Cleaning', () => {
    
    it('should remove undefined values', () => {
      const template = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test',
        brand: undefined,
        price: null,
        sku: '123'
      };

      const cleaned = SchemaTemplates.cleanTemplate(template);

      assert.strictEqual(cleaned.name, 'Test');
      assert.strictEqual(cleaned.sku, '123');
      assert.ok(!('brand' in cleaned));
      assert.ok(!('price' in cleaned));
    });

    it('should remove empty arrays', () => {
      const template = {
        '@type': 'Product',
        name: 'Test',
        images: [],
        tags: ['tag1']
      };

      const cleaned = SchemaTemplates.cleanTemplate(template);

      assert.ok(!('images' in cleaned));
      assert.ok('tags' in cleaned);
    });

    it('should clean nested objects', () => {
      const template = {
        '@type': 'Product',
        offers: {
          price: '99.99',
          discount: undefined,
          seller: null
        }
      };

      const cleaned = SchemaTemplates.cleanTemplate(template);

      assert.ok(cleaned.offers);
      assert.strictEqual(cleaned.offers.price, '99.99');
      assert.ok(!('discount' in cleaned.offers));
      assert.ok(!('seller' in cleaned.offers));
    });

  });

  describe('Template Merging', () => {
    
    it('should merge data with template', () => {
      const product = SchemaTemplates.create('Product', {
        name: 'Merged Product',
        price: '49.99',
        brand: 'TestBrand',
        sku: 'SKU123'
      });

      assert.strictEqual(product.name, 'Merged Product');
      assert.strictEqual(product.offers.price, '49.99');
      assert.strictEqual(product.brand.name, 'TestBrand');
      assert.strictEqual(product.sku, 'SKU123');
    });

  });

  describe('Fallback Template', () => {
    
    it('should create generic Thing template for unknown types', () => {
      const thing = SchemaTemplates.create('CustomType', {
        name: 'Custom Thing',
        description: 'Custom description'
      });

      assert.strictEqual(thing['@context'], 'https://schema.org');
      assert.strictEqual(thing['@type'], 'CustomType');
      assert.strictEqual(thing.name, 'Custom Thing');
      assert.strictEqual(thing.description, 'Custom description');
    });

  });

});

// Run with: node --test test/schema-templates.test.js

