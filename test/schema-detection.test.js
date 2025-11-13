// Schema Detection Tests - v1.12.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SchemaDetector } from '../src/schema-detector.js';

describe('Schema Detection - v1.12.0', () => {
  
  describe('Product Detection', () => {
    
    it('should detect Product from e-commerce page', () => {
      const parsed = {
        title: 'Amazing Wireless Headphones - Buy Now',
        description: 'Premium headphones with noise cancelling. Price: $199.99',
        content: 'These headphones are in stock. Add to cart now. Brand: AudioTech. SKU: AH-100. Rating: 4.5 stars (127 reviews)',
        meta: {},
        openGraph: { type: 'product' },
        images: ['product.jpg']
      };

      const detected = SchemaDetector.detect(parsed);
      
      assert.strictEqual(detected[0].type, 'Product');
      assert.ok(detected[0].confidence > 0.7, 'Confidence should be high for clear product page');
      assert.ok(detected[0].indicators.length > 0, 'Should have indicators');
    });

    it('should detect price patterns', () => {
      const parsed = {
        title: 'Test Product',
        description: '',
        content: 'Price: $99.99. Buy now!',
        meta: {},
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      const product = detected.find(d => d.type === 'Product');
      
      assert.ok(product, 'Should detect Product type');
      assert.ok(product.confidence > 0, 'Should have some confidence');
      assert.ok(product.indicators.some(i => i.includes('price')), 'Should detect price');
    });

    it('should detect product keywords', () => {
      const parsed = {
        title: 'Shop Now',
        description: '',
        content: 'Add to cart. In stock. Free shipping. Brand: TestBrand',
        meta: {},
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      const product = detected.find(d => d.type === 'Product');
      
      assert.ok(product, 'Should detect Product type');
      assert.ok(product.indicators.some(i => i.includes('keyword')), 'Should detect keywords');
    });

  });

  describe('Article Detection', () => {
    
    it('should detect Article from blog post', () => {
      const parsed = {
        title: 'How to Build a Great Website',
        description: 'A comprehensive guide to web development',
        content: `Published January 15, 2024 by John Smith. 
                  In this article, we will explore the fundamentals of web development.
                  Continue reading to learn more. Share this article.
                  Tags: web development, coding, tutorial.
                  This is a long article with substantial content that discusses various topics in detail.
                  Related articles: Getting Started with React, Advanced CSS Techniques.`,
        meta: { author: 'John Smith' },
        openGraph: { type: 'article' },
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      
      assert.strictEqual(detected[0].type, 'Article');
      assert.ok(detected[0].confidence > 0.7, 'Confidence should be high for clear article');
      assert.ok(detected[0].indicators.some(i => i.includes('article')), 'Should have article indicators');
    });

    it('should detect author patterns', () => {
      const parsed = {
        title: 'Test Article',
        description: 'by Jane Doe',
        content: 'Article content here. Published on 2024-01-15.',
        meta: {},
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      const article = detected.find(d => d.type === 'Article');
      
      assert.ok(article, 'Should detect Article type');
      assert.ok(article.indicators.some(i => i.includes('author') || i.includes('date')), 'Should detect author or date');
    });

  });

  describe('LocalBusiness Detection', () => {
    
    it('should detect LocalBusiness from business page', () => {
      const parsed = {
        title: 'Best Coffee Shop - Downtown',
        description: 'Visit us at 123 Main Street',
        content: `
          Visit us at our location: 123 Main Street, New York, NY 10001
          Hours: Mon-Fri 7:00 am - 6:00 pm, Sat-Sun 8:00 am - 5:00 pm
          Call us: (555) 123-4567
          Email us at info@coffee.com
          Directions to our store. Open now.
        `,
        meta: {},
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      
      assert.ok(detected.some(d => d.type === 'LocalBusiness'), 'Should detect LocalBusiness');
      const business = detected.find(d => d.type === 'LocalBusiness');
      assert.ok(business.confidence > 0.5, 'Should have decent confidence');
      assert.ok(business.indicators.some(i => i.includes('address') || i.includes('phone')), 'Should detect contact info');
    });

  });

  describe('Event Detection', () => {
    
    it('should detect Event from event page', () => {
      const parsed = {
        title: 'Web Development Conference 2024',
        description: 'Join us for an amazing event',
        content: `
          Register now for the conference!
          When: March 15, 2024
          Where: Convention Center, Downtown
          Get tickets today. RSVP required.
          Event details and venue information.
        `,
        meta: {},
        openGraph: { type: 'event' },
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      const event = detected.find(d => d.type === 'Event');
      
      assert.ok(event, 'Should detect Event type');
      assert.ok(event.confidence > 0.5, 'Should have decent confidence');
    });

  });

  describe('Recipe Detection', () => {
    
    it('should detect Recipe from recipe page', () => {
      const parsed = {
        title: 'Chocolate Chip Cookies Recipe',
        description: 'Delicious homemade cookies',
        content: `
          Ingredients: 2 cups flour, 1 cup sugar, 2 eggs, 1 tsp vanilla
          Prep time: 15 minutes
          Cook time: 12 minutes
          Servings: 24 cookies
          Instructions: Mix dry ingredients. Stir in wet ingredients. Bake at 350°F.
          Nutrition: 150 calories per cookie
        `,
        meta: {},
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      const recipe = detected.find(d => d.type === 'Recipe');
      
      assert.ok(recipe, 'Should detect Recipe type');
      assert.ok(recipe.confidence > 0.5, 'Should have decent confidence');
    });

  });

  describe('Confidence Scoring', () => {
    
    it('should return confidence scores between 0 and 1', () => {
      const parsed = {
        title: 'Test Page',
        description: 'Test description',
        content: 'Some content here',
        meta: {},
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      
      detected.forEach(detection => {
        assert.ok(detection.confidence >= 0 && detection.confidence <= 1, 
          `Confidence ${detection.confidence} should be between 0 and 1`);
      });
    });

    it('should sort results by confidence (highest first)', () => {
      const parsed = {
        title: 'Product Article',
        description: 'A product with an article',
        content: 'Price: $99. Published by John Smith. Add to cart.',
        meta: {},
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      
      for (let i = 0; i < detected.length - 1; i++) {
        assert.ok(detected[i].confidence >= detected[i + 1].confidence, 
          'Results should be sorted by confidence descending');
      }
    });

    it('should boost confidence for target types', () => {
      const parsed = {
        title: 'Maybe a product',
        description: 'Could be many things',
        content: 'Some generic content',
        meta: {},
        openGraph: {},
        images: []
      };

      const withoutHint = SchemaDetector.detect(parsed);
      const withHint = SchemaDetector.detect(parsed, ['Product']);
      
      const productWithoutHint = withoutHint.find(d => d.type === 'Product');
      const productWithHint = withHint.find(d => d.type === 'Product');
      
      if (productWithoutHint && productWithHint) {
        assert.ok(productWithHint.confidence >= productWithoutHint.confidence, 
          'Target type hint should boost confidence');
      }
    });

  });

  describe('Fallback Behavior', () => {
    
    it('should default to WebPage for generic content', () => {
      const parsed = {
        title: 'Generic Page',
        description: 'Just a regular webpage',
        content: 'Nothing special here',
        meta: {},
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      
      assert.ok(detected.length > 0, 'Should always return at least one detection');
      assert.ok(detected.some(d => d.type === 'WebPage'), 'Should include WebPage as fallback');
    });

    it('should handle empty content gracefully', () => {
      const parsed = {
        title: '',
        description: '',
        content: '',
        meta: {},
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      
      assert.ok(detected.length > 0, 'Should return at least WebPage');
      assert.strictEqual(detected[0].type, 'WebPage', 'Should default to WebPage');
    });

  });

  describe('Multiple Type Detection', () => {
    
    it('should detect multiple types when applicable', () => {
      const parsed = {
        title: 'Product Review Article',
        description: 'Reviewing the best products',
        content: `
          Published by John Smith on January 15, 2024.
          This product costs $99.99 and is available for purchase.
          Add to cart. Rating: 4.5 stars.
          Read more about this product in our article.
        `,
        meta: { author: 'John Smith' },
        openGraph: {},
        images: []
      };

      const detected = SchemaDetector.detect(parsed);
      
      assert.ok(detected.length > 1, 'Should detect multiple types');
      assert.ok(detected.some(d => d.type === 'Product'), 'Should detect Product');
      assert.ok(detected.some(d => d.type === 'Article'), 'Should detect Article');
    });

  });

});

// Run with: node --test test/schema-detection.test.js

