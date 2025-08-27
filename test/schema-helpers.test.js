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

      expect(product).toEqual({
        "@context": "https://schema.org",
        "@type": "Product",
        name: 'Test Product',
        description: 'A test product'
      });
    });

    it('should handle offers correctly', () => {
      const product = SchemaHelpers.createProduct({
        name: 'Test Product',
        offers: {
          price: 29.99,
          priceCurrency: 'USD'
        }
      });

      expect(product.offers).toEqual({
        "@type": "Offer",
        priceCurrency: 'USD',
        price: 29.99,
        availability: "https://schema.org/InStock"
      });
    });

    it('should handle aggregate rating', () => {
      const product = SchemaHelpers.createProduct({
        name: 'Test Product',
        aggregateRating: {
          ratingValue: 4.5,
          reviewCount: 100
        }
      });

      expect(product.aggregateRating).toEqual({
        "@type": "AggregateRating",
        ratingValue: 4.5,
        reviewCount: 100
      });
    });

    it('should handle brand as string', () => {
      const product = SchemaHelpers.createProduct({
        name: 'Test Product',
        brand: 'Test Brand'
      });

      expect(product.brand).toEqual({
        "@type": "Brand",
        name: 'Test Brand'
      });
    });

    it('should handle images as array', () => {
      const product = SchemaHelpers.createProduct({
        name: 'Test Product',
        image: ['image1.jpg', 'image2.jpg']
      });

      expect(product.image).toEqual(['image1.jpg', 'image2.jpg']);
    });
  });

  describe('createArticle', () => {
    it('should create a basic article schema', () => {
      const article = SchemaHelpers.createArticle({
        headline: 'Test Article',
        description: 'A test article',
        author: 'John Doe'
      });

      expect(article).toEqual({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: 'Test Article',
        description: 'A test article',
        author: {
          "@type": "Person",
          name: 'John Doe'
        }
      });
    });

    it('should handle publisher as string', () => {
      const article = SchemaHelpers.createArticle({
        headline: 'Test Article',
        publisher: 'Test Publisher'
      });

      expect(article.publisher).toEqual({
        "@type": "Organization",
        name: 'Test Publisher'
      });
    });

    it('should handle keywords as array', () => {
      const article = SchemaHelpers.createArticle({
        headline: 'Test Article',
        keywords: ['test', 'article', 'seo']
      });

      expect(article.keywords).toEqual(['test', 'article', 'seo']);
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

      expect(business).toEqual({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: 'Test Business',
        description: 'A test business',
        address: {
          "@type": "PostalAddress",
          streetAddress: '123 Test St'
        },
        telephone: '+1-555-0123'
      });
    });

    it('should handle geo coordinates', () => {
      const business = SchemaHelpers.createLocalBusiness({
        name: 'Test Business',
        geo: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      });

      expect(business.geo).toEqual({
        "@type": "GeoCoordinates",
        latitude: 40.7128,
        longitude: -74.0060
      });
    });

    it('should handle custom business type', () => {
      const business = SchemaHelpers.createLocalBusiness({
        name: 'Test Restaurant',
        businessType: 'Restaurant'
      });

      expect(business["@type"]).toBe('Restaurant');
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

      expect(event).toEqual({
        "@context": "https://schema.org",
        "@type": "Event",
        name: 'Test Event',
        description: 'A test event',
        startDate: '2024-12-25T10:00:00Z',
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: 'Test Venue'
        }
      });
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

      expect(event.location).toEqual({
        "@type": "Place",
        name: 'Test Venue',
        address: {
          "@type": "PostalAddress",
          streetAddress: '123 Event St',
          addressLocality: 'Test City',
          postalCode: '12345'
        }
      });
    });

    it('should handle organizer as string', () => {
      const event = SchemaHelpers.createEvent({
        name: 'Test Event',
        organizer: 'Test Organization'
      });

      expect(event.organizer).toEqual({
        "@type": "Organization",
        name: 'Test Organization'
      });
    });
  });
}); 