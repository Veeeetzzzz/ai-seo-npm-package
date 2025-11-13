import { describe, it } from 'node:test';
import assert from 'node:assert';
import './setup.js';
import { SchemaHelpers } from '../index.js';

describe('SchemaHelpers', () => {
  describe('createProduct', () => {
    it('should create a basic product schema', () => {
      const product = SchemaHelpers.createProduct({
        name: 'Test Product',
        description: 'A test product'
      });

      assert.strictEqual(product['@context'], 'https://schema.org');
      assert.strictEqual(product['@type'], 'Product');
      assert.strictEqual(product.name, 'Test Product');
      assert.strictEqual(product.description, 'A test product');
    });

    it('should handle offers correctly', () => {
      const product = SchemaHelpers.createProduct({
        name: 'Test Product',
        offers: {
          price: 29.99,
          priceCurrency: 'USD'
        }
      });

      assert.ok(product.offers);
      assert.strictEqual(product.offers['@type'], 'Offer');
      assert.strictEqual(product.offers.priceCurrency, 'USD');
      assert.strictEqual(product.offers.price, 29.99);
      assert.strictEqual(product.offers.availability, 'https://schema.org/InStock');
    });

    it('should handle aggregate rating', () => {
      const product = SchemaHelpers.createProduct({
        name: 'Test Product',
        aggregateRating: {
          ratingValue: 4.5,
          reviewCount: 100
        }
      });

      assert.ok(product.aggregateRating);
      assert.strictEqual(product.aggregateRating['@type'], 'AggregateRating');
      assert.strictEqual(product.aggregateRating.ratingValue, 4.5);
      assert.strictEqual(product.aggregateRating.reviewCount, 100);
    });

    it('should handle brand as string', () => {
      const product = SchemaHelpers.createProduct({
        name: 'Test Product',
        brand: 'Test Brand'
      });

      assert.ok(product.brand);
      assert.strictEqual(product.brand['@type'], 'Brand');
      assert.strictEqual(product.brand.name, 'Test Brand');
    });

    it('should handle images as array', () => {
      const product = SchemaHelpers.createProduct({
        name: 'Test Product',
        image: ['image1.jpg', 'image2.jpg']
      });

      assert.deepStrictEqual(product.image, ['image1.jpg', 'image2.jpg']);
    });
  });

  describe('createArticle', () => {
    it('should create a basic article schema', () => {
      const article = SchemaHelpers.createArticle({
        headline: 'Test Article',
        description: 'A test article',
        author: 'John Doe'
      });

      assert.strictEqual(article['@context'], 'https://schema.org');
      assert.strictEqual(article['@type'], 'Article');
      assert.strictEqual(article.headline, 'Test Article');
      assert.strictEqual(article.description, 'A test article');
      assert.ok(article.author);
      assert.strictEqual(article.author['@type'], 'Person');
      assert.strictEqual(article.author.name, 'John Doe');
    });

    it('should handle publisher as string', () => {
      const article = SchemaHelpers.createArticle({
        headline: 'Test Article',
        publisher: 'Test Publisher'
      });

      assert.ok(article.publisher);
      assert.strictEqual(article.publisher['@type'], 'Organization');
      assert.strictEqual(article.publisher.name, 'Test Publisher');
    });

    it('should handle keywords as array', () => {
      const article = SchemaHelpers.createArticle({
        headline: 'Test Article',
        keywords: ['test', 'article', 'seo']
      });

      assert.deepStrictEqual(article.keywords, ['test', 'article', 'seo']);
    });
  });

  describe('createLocalBusiness', () => {
    it('should create a basic local business schema', () => {
      const business = SchemaHelpers.createLocalBusiness({
        name: 'Test Business',
        description: 'A test business',
        address: '123 Test St',
        telephone: '+1-555-0123'
      });

      assert.strictEqual(business['@context'], 'https://schema.org');
      assert.strictEqual(business['@type'], 'LocalBusiness');
      assert.strictEqual(business.name, 'Test Business');
      assert.strictEqual(business.description, 'A test business');
      assert.ok(business.address);
      assert.strictEqual(business.address['@type'], 'PostalAddress');
      assert.strictEqual(business.address.streetAddress, '123 Test St');
      assert.strictEqual(business.telephone, '+1-555-0123');
    });

    it('should handle geo coordinates', () => {
      const business = SchemaHelpers.createLocalBusiness({
        name: 'Test Business',
        geo: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      });

      assert.ok(business.geo);
      assert.strictEqual(business.geo['@type'], 'GeoCoordinates');
      assert.strictEqual(business.geo.latitude, 40.7128);
      assert.strictEqual(business.geo.longitude, -74.0060);
    });

    it('should handle custom business type', () => {
      const business = SchemaHelpers.createLocalBusiness({
        name: 'Test Restaurant',
        businessType: 'Restaurant'
      });

      assert.strictEqual(business['@type'], 'Restaurant');
    });
  });

  describe('createEvent', () => {
    it('should create a basic event schema', () => {
      const event = SchemaHelpers.createEvent({
        name: 'Test Event',
        description: 'A test event',
        startDate: '2024-12-25T10:00:00Z',
        location: 'Test Venue'
      });

      assert.strictEqual(event['@context'], 'https://schema.org');
      assert.strictEqual(event['@type'], 'Event');
      assert.strictEqual(event.name, 'Test Event');
      assert.strictEqual(event.description, 'A test event');
      assert.strictEqual(event.startDate, '2024-12-25T10:00:00Z');
      assert.strictEqual(event.eventStatus, 'https://schema.org/EventScheduled');
      assert.strictEqual(event.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
      assert.ok(event.location);
      assert.strictEqual(event.location['@type'], 'Place');
      assert.strictEqual(event.location.name, 'Test Venue');
    });

    it('should handle complex location with address', () => {
      const event = SchemaHelpers.createEvent({
        name: 'Test Event',
        location: {
          name: 'Test Venue',
          address: {
            streetAddress: '123 Event St',
            addressLocality: 'Test City',
            postalCode: '12345'
          }
        }
      });

      assert.ok(event.location);
      assert.strictEqual(event.location['@type'], 'Place');
      assert.strictEqual(event.location.name, 'Test Venue');
      assert.ok(event.location.address);
      // Address may or may not have @type depending on implementation
      assert.strictEqual(event.location.address.streetAddress, '123 Event St');
      assert.strictEqual(event.location.address.addressLocality, 'Test City');
      assert.strictEqual(event.location.address.postalCode, '12345');
    });

    it('should handle organizer as string', () => {
      const event = SchemaHelpers.createEvent({
        name: 'Test Event',
        organizer: 'Test Organization'
      });

      assert.ok(event.organizer);
      assert.strictEqual(event.organizer['@type'], 'Organization');
      assert.strictEqual(event.organizer.name, 'Test Organization');
    });
  });
});
