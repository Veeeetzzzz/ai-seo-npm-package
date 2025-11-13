// Data Extraction Tests - v1.12.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DataExtractors } from '../src/data-extractors.js';

describe('Data Extraction - v1.12.0', () => {
  
  describe('Product Extraction', () => {
    
    it('should extract complete product data', () => {
      const parsed = {
        title: 'Wireless Headphones Pro',
        description: 'Premium noise-cancelling headphones',
        content: 'These headphones feature active noise cancelling. Price: $199.99. Brand: AudioTech. In stock. SKU: WH-PRO-001. Rating: 4.5 stars (127 reviews)',
        meta: {},
        openGraph: {},
        images: ['headphones1.jpg', 'headphones2.jpg'],
        url: 'https://example.com/product'
      };

      const product = DataExtractors.extractProduct(parsed);
      
      assert.strictEqual(product['@type'], 'Product');
      assert.strictEqual(product.name, 'Wireless Headphones Pro');
      assert.ok(product.description.includes('noise-cancelling'));
      assert.ok(product.offers, 'Should have offers');
      assert.strictEqual(product.offers.price, '199.99');
      assert.strictEqual(product.offers.priceCurrency, 'USD');
      assert.strictEqual(product.brand.name, 'AudioTech');
      assert.strictEqual(product.aggregateRating.ratingValue, 4.5);
      assert.strictEqual(product.aggregateRating.reviewCount, 127);
      assert.strictEqual(product.sku, 'WH-PRO-001');
    });

    it('should extract price from various formats', () => {
      const testCases = [
        { text: 'Price: $99.99', expected: '99.99' },
        { text: 'Only 1234 USD', expected: '1234' },
        { text: '$1,234.56 today', expected: '1234.56' }
      ];

      testCases.forEach(test => {
        const parsed = {
          title: 'Product',
          description: '',
          content: test.text,
          meta: {},
          openGraph: {},
          images: []
        };

        const product = DataExtractors.extractProduct(parsed);
        assert.strictEqual(product.offers.price, test.expected, `Failed for: ${test.text}`);
      });
    });

    it('should extract availability status', () => {
      const parsed = {
        title: 'Product',
        description: '',
        content: 'This item is in stock and ready to ship. Price: $99.99',
        meta: {},
        openGraph: {},
        images: []
      };

      const product = DataExtractors.extractProduct(parsed);
      assert.ok(product.offers, 'Should have offers object');
      assert.strictEqual(product.offers.availability, 'https://schema.org/InStock');
    });

  });

  describe('Article Extraction', () => {
    
    it('should extract complete article data', () => {
      const parsed = {
        title: 'How to Build Great Software',
        description: 'A comprehensive guide to software development',
        content: 'Published January 15, 2024 by Jane Smith. This article explores best practices in software development. Tags: software, development, coding.',
        meta: { 
          author: 'Jane Smith',
          keywords: 'software, development, coding'
        },
        openGraph: { site_name: 'Tech Blog' },
        url: 'https://example.com/article'
      };

      const article = DataExtractors.extractArticle(parsed);
      
      assert.strictEqual(article['@type'], 'Article');
      assert.strictEqual(article.headline, 'How to Build Great Software');
      assert.ok(article.description.includes('comprehensive'));
      assert.strictEqual(article.author.name, 'Jane Smith');
      assert.ok(article.datePublished, 'Should have publication date');
      assert.strictEqual(article.publisher.name, 'Tech Blog');
      assert.ok(article.keywords.includes('software'));
      assert.strictEqual(article.url, 'https://example.com/article');
    });

    it('should extract author from content', () => {
      const parsed = {
        title: 'Test Article',
        description: '',
        content: 'Written by John Doe, this article discusses various topics.',
        meta: {},
        openGraph: {},
        url: ''
      };

      const article = DataExtractors.extractArticle(parsed);
      assert.strictEqual(article.author.name, 'John Doe');
    });

    it('should extract dates from various formats', () => {
      const parsed = {
        title: 'Article',
        description: '',
        content: 'Published on 2024-01-15',
        meta: {},
        openGraph: {},
        url: ''
      };

      const article = DataExtractors.extractArticle(parsed);
      assert.ok(article.datePublished, 'Should extract date');
      assert.ok(article.datePublished.includes('2024'), 'Should be 2024');
    });

  });

  describe('LocalBusiness Extraction', () => {
    
    it('should extract complete business data', () => {
      const parsed = {
        title: 'Best Coffee Shop',
        description: 'Great coffee downtown',
        content: `
          Visit us at 123 Main Street, New York, NY 10001.
          Call us at (555) 123-4567.
          Hours: Mon-Fri 7:00 am - 6:00 pm
        `,
        meta: {
          latitude: '40.7128',
          longitude: '-74.0060'
        },
        openGraph: {},
        images: []
      };

      const business = DataExtractors.extractLocalBusiness(parsed);
      
      assert.strictEqual(business['@type'], 'LocalBusiness');
      assert.strictEqual(business.name, 'Best Coffee Shop');
      assert.ok(business.address, 'Should have address');
      assert.ok(business.address.streetAddress.includes('123 Main Street'));
      assert.strictEqual(business.address.postalCode, '10001');
      assert.strictEqual(business.address.addressRegion, 'NY');
      assert.ok(business.telephone, 'Should have phone');
      assert.ok(business.geo, 'Should have geo coordinates');
      assert.strictEqual(business.geo.latitude, 40.7128);
    });

    it('should extract phone numbers in various formats', () => {
      const testCases = [
        '(555) 123-4567',
        '555-123-4567',
        '+1 555 123 4567'
      ];

      testCases.forEach(phone => {
        const parsed = {
          title: 'Business',
          description: '',
          content: `Call us at ${phone}`,
          meta: {},
          openGraph: {},
          images: []
        };

        const business = DataExtractors.extractLocalBusiness(parsed);
        assert.ok(business.telephone, `Should extract phone: ${phone}`);
      });
    });

  });

  describe('Event Extraction', () => {
    
    it('should extract complete event data', () => {
      const parsed = {
        title: 'Web Development Conference 2024',
        description: 'Annual web dev conference',
        content: `
          Join us on March 15, 2024 at the Convention Center.
          Organizer: Tech Events Inc
        `,
        meta: {},
        openGraph: {},
        images: []
      };

      const event = DataExtractors.extractEvent(parsed);
      
      assert.strictEqual(event['@type'], 'Event');
      assert.strictEqual(event.name, 'Web Development Conference 2024');
      assert.ok(event.startDate, 'Should have start date');
      assert.strictEqual(event.location.name, 'Convention Center');
      assert.strictEqual(event.organizer.name, 'Tech Events Inc');
    });

  });

  describe('Recipe Extraction', () => {
    
    it('should extract recipe data', () => {
      const parsed = {
        title: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        content: `
          Prep time: 15 minutes
          Cook time: 12 minutes
          Ingredients:
          2 cups flour
          1 cup sugar
          2 eggs
          Instructions: Mix ingredients and bake at 350F.
        `,
        meta: {},
        openGraph: {},
        images: []
      };

      const recipe = DataExtractors.extractRecipe(parsed);
      
      assert.strictEqual(recipe['@type'], 'Recipe');
      assert.strictEqual(recipe.name, 'Chocolate Chip Cookies');
      assert.ok(recipe.recipeIngredient, 'Should have ingredients');
      assert.ok(recipe.recipeIngredient.length > 0);
      assert.strictEqual(recipe.prepTime, 'PT15M');
      assert.strictEqual(recipe.cookTime, 'PT12M');
    });

  });

  describe('Video Extraction', () => {
    
    it('should extract video data', () => {
      const parsed = {
        title: 'How to Code',
        description: 'Tutorial video',
        content: '',
        meta: { 'video:duration': '600' },
        openGraph: { image: 'thumbnail.jpg' },
        images: []
      };

      const video = DataExtractors.extractVideo(parsed);
      
      assert.strictEqual(video['@type'], 'VideoObject');
      assert.strictEqual(video.name, 'How to Code');
      assert.strictEqual(video.duration, 'PT600S');
      assert.strictEqual(video.thumbnailUrl, 'thumbnail.jpg');
    });

  });

  describe('Helper Methods', () => {
    
    it('should truncate long text', () => {
      const longText = 'a'.repeat(500);
      const truncated = DataExtractors._truncate(longText, 100);
      
      assert.ok(truncated.length <= 104); // 100 + '...'
      assert.ok(truncated.endsWith('...'));
    });

    it('should normalize dates to ISO format', () => {
      const normalized = DataExtractors._normalizeDate('2024-01-15');
      assert.ok(normalized.includes('2024'));
      assert.ok(normalized.includes('T')); // ISO format includes T
    });

    it('should extract address components', () => {
      const text = '123 Main Street, New York, NY 10001';
      const address = DataExtractors._extractAddress(text);
      
      assert.ok(address);
      assert.ok(address.streetAddress);
      assert.strictEqual(address.postalCode, '10001');
      assert.strictEqual(address.addressRegion, 'NY');
    });

  });

  describe('Error Handling', () => {
    
    it('should handle missing data gracefully', () => {
      const parsed = {
        title: '',
        description: '',
        content: '',
        meta: {},
        openGraph: {},
        images: []
      };

      const product = DataExtractors.extractProduct(parsed);
      
      assert.ok(product);
      assert.strictEqual(product['@type'], 'Product');
      assert.ok(product.name); // Should have some default
    });

    it('should handle malformed data', () => {
      const parsed = {
        title: null,
        description: undefined,
        content: 'Some content',
        meta: null,
        openGraph: {},
        images: null
      };

      // Should not throw
      const product = DataExtractors.extractProduct(parsed);
      assert.ok(product);
    });

  });

});

// Run with: node --test test/data-extraction.test.js

