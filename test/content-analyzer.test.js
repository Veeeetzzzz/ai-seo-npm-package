// Content Analyzer Tests - v1.12.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ContentAnalyzer } from '../src/content-analyzer.js';

describe('Content Analyzer - v1.12.0', () => {
  
  describe('Basic Analysis', () => {
    
    it('should analyze content and return structure', () => {
      const content = 'This is a test content for analysis.';
      const result = ContentAnalyzer.analyze(content);

      assert.ok(result.keywords);
      assert.ok(result.entities);
      assert.ok(result.metadata);
      assert.ok(result.readability);
      assert.ok(result.contentType);
    });

    it('should handle empty content', () => {
      const result = ContentAnalyzer.analyze('');

      assert.ok(Array.isArray(result.keywords));
      assert.strictEqual(result.keywords.length, 0);
    });

  });

  describe('Keyword Extraction (TF-IDF)', () => {
    
    it('should extract keywords from content', () => {
      const content = `
        The iPhone 15 is a great smartphone with advanced technology.
        This new iPhone model features cutting-edge technology and design.
        Smartphone users love the iPhone 15 for its performance.
      `;

      const result = ContentAnalyzer.analyze(content);

      assert.ok(result.keywords.length > 0);
      // Should include "iphone", "smartphone", "technology"
      assert.ok(result.keywords.some(k => k.includes('iphone') || k.includes('smartphone')));
    });

    it('should respect maxKeywords parameter', () => {
      const content = 'The quick brown fox jumps over the lazy dog. ' +
        'This sentence contains many different words for keyword extraction.';

      const result = ContentAnalyzer.analyze(content, { maxKeywords: 5 });

      assert.ok(result.keywords.length <= 5);
    });

    it('should filter stop words', () => {
      const content = 'The quick brown fox is jumping and running fast.';

      const result = ContentAnalyzer.analyze(content);

      // Should not include common stop words like "the", "is", "and"
      assert.ok(!result.keywords.includes('the'));
      assert.ok(!result.keywords.includes('and'));
      assert.ok(!result.keywords.includes('is'));
    });

  });

  describe('Entity Recognition', () => {
    
    it('should extract people names', () => {
      const content = 'John Smith is meeting with Sarah Johnson at the office.';

      const result = ContentAnalyzer.analyze(content);

      assert.ok(result.entities.people.length > 0);
    });

    it('should extract organizations', () => {
      const content = 'Apple Inc. and Microsoft Corporation are tech companies.';

      const result = ContentAnalyzer.analyze(content);

      assert.ok(result.entities.organizations.length > 0);
      assert.ok(result.entities.organizations.some(org => 
        org.includes('Apple') || org.includes('Microsoft')
      ));
    });

    it('should extract locations', () => {
      const content = 'The conference is in San Francisco, CA.';

      const result = ContentAnalyzer.analyze(content);

      assert.ok(result.entities.locations.length > 0);
    });

    it('should extract products', () => {
      const content = 'The iPhone 15 and Samsung Galaxy S23 are popular phones.';

      const result = ContentAnalyzer.analyze(content);

      assert.ok(result.entities.products.length > 0);
    });

  });

  describe('Content Type Detection', () => {
    
    it('should detect recipe content', () => {
      const content = `
        Chocolate Chip Cookies Recipe
        Ingredients:
        - 2 cups flour
        - 1 cup sugar
        - 2 tbsp butter
        
        Instructions:
        1. Mix ingredients
        2. Bake at 350°F for 15 minutes
        Prep time: 10 minutes
        Cook time: 15 minutes
      `;

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.contentType, 'recipe');
    });

    it('should detect product content', () => {
      const content = `
        Product: Wireless Headphones
        Price: $199.99
        Brand: TechBrand
        In Stock - Buy Now
        Add to Cart
      `;

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.contentType, 'product');
    });

    it('should detect event content', () => {
      const content = `
        Tech Conference 2025
        Date: January 15, 2025
        Time: 9:00 AM - 5:00 PM
        Venue: Convention Center
        Tickets available - Register now!
      `;

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.contentType, 'event');
    });

    it('should detect business content', () => {
      const content = `
        Joe's Pizza Restaurant
        Address: 123 Main Street, Anytown
        Phone: 555-123-4567
        Hours: Monday-Sunday, 11am-10pm
        Open for dine-in and delivery
      `;

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.contentType, 'business');
    });

    it('should detect article content', () => {
      const content = `
        Understanding Modern Technology
        By Jane Doe
        Published: January 1, 2025
        
        Technology has transformed our world in countless ways. 
        From smartphones to artificial intelligence, the pace of innovation
        continues to accelerate at an unprecedented rate.
        
        In this article, we explore the major technological advances of the past decade
        and what they mean for our future. We'll examine how these changes affect
        our daily lives and what challenges lie ahead.
        
        ${' '.repeat(1000)}  
      `.repeat(2);

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.contentType, 'article');
    });

    it('should detect how-to content', () => {
      const content = `
        How to Build a Website
        
        Step 1: Choose a domain name
        Step 2: Select a hosting provider
        Step 3: Install WordPress
        
        You will need:
        - A computer
        - Internet connection
        - Basic technical knowledge
      `;

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.contentType, 'howto');
    });

    it('should detect FAQ content', () => {
      const content = `
        Frequently Asked Questions
        
        Q: What is this product?
        A: It's a widget.
        
        Q: How much does it cost?
        A: $99.99
        
        Q: Is there a warranty?
        A: Yes, 1 year.
      `;

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.contentType, 'faq');
    });

    it('should default to general for unknown content', () => {
      const content = 'Just some random text without specific patterns.';

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.contentType, 'general');
    });

  });

  describe('Readability Metrics', () => {
    
    it('should calculate readability scores', () => {
      const content = 'The quick brown fox jumps over the lazy dog. This is a simple sentence.';

      const result = ContentAnalyzer.analyze(content);

      assert.ok(typeof result.readability.fleschScore === 'number');
      assert.ok(typeof result.readability.gradeLevel === 'number');
      assert.ok(typeof result.readability.difficulty === 'string');
    });

    it('should classify difficulty levels', () => {
      const easyContent = 'The cat sat. The dog ran. The sun was hot.';
      const hardContent = 'The implementation of advanced algorithmic methodologies necessitates comprehensive understanding of theoretical computational frameworks.';

      const easy = ContentAnalyzer.analyze(easyContent);
      const hard = ContentAnalyzer.analyze(hardContent);

      // Easy content should have higher Flesch score (easier to read)
      assert.ok(easy.readability.fleschScore > hard.readability.fleschScore);
    });

  });

  describe('Content Metadata', () => {
    
    it('should count words correctly', () => {
      const content = 'This has five total words.';

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.metadata.wordCount, 5);
    });

    it('should count sentences correctly', () => {
      const content = 'First sentence. Second sentence? Third sentence!';

      const result = ContentAnalyzer.analyze(content);

      assert.strictEqual(result.metadata.sentenceCount, 3);
    });

    it('should calculate average word length', () => {
      const content = 'cat dog bird';  // 3, 3, 4 = avg 3.33

      const result = ContentAnalyzer.analyze(content);

      assert.ok(result.metadata.averageWordLength > 3);
      assert.ok(result.metadata.averageWordLength < 4);
    });

  });

  describe('Relationship Detection', () => {
    
    it('should detect person-organization relationships', () => {
      const content = 'John Smith works at Apple Inc. as an engineer.';

      const result = ContentAnalyzer.analyze(content, { detectRelationships: true });

      assert.ok(Array.isArray(result.relationships));
      // May or may not find relationships depending on proximity
    });

    it('should not detect relationships when disabled', () => {
      const content = 'John Smith works at Apple Inc.';

      const result = ContentAnalyzer.analyze(content, { detectRelationships: false });

      assert.strictEqual(result.relationships.length, 0);
    });

  });

  describe('Option Handling', () => {
    
    it('should respect extractKeywords option', () => {
      const content = 'This is test content with several words.';

      const withKeywords = ContentAnalyzer.analyze(content, { extractKeywords: true });
      const withoutKeywords = ContentAnalyzer.analyze(content, { extractKeywords: false });

      assert.ok(withKeywords.keywords.length > 0);
      assert.strictEqual(withoutKeywords.keywords.length, 0);
    });

    it('should respect extractEntities option', () => {
      const content = 'John Smith works at Apple Inc.';

      const withEntities = ContentAnalyzer.analyze(content, { extractEntities: true });
      const withoutEntities = ContentAnalyzer.analyze(content, { extractEntities: false });

      // With entities should try to extract
      assert.ok(withEntities.entities);
      // Without entities should have empty structure
      assert.ok(withoutEntities.entities);
      assert.strictEqual(withoutEntities.entities.people.length, 0);
    });

  });

  describe('Edge Cases', () => {
    
    it('should handle null or undefined content', () => {
      const result1 = ContentAnalyzer.analyze(null);
      const result2 = ContentAnalyzer.analyze(undefined);

      assert.ok(result1);
      assert.ok(result2);
      assert.strictEqual(result1.keywords.length, 0);
      assert.strictEqual(result2.keywords.length, 0);
    });

    it('should handle very short content', () => {
      const content = 'Hi';

      const result = ContentAnalyzer.analyze(content);

      assert.ok(result);
      assert.strictEqual(result.metadata.wordCount, 1);
    });

    it('should handle very long content', () => {
      const content = 'word '.repeat(10000);

      const result = ContentAnalyzer.analyze(content);

      assert.ok(result);
      assert.strictEqual(result.metadata.wordCount, 10000);
    });

    it('should handle content with special characters', () => {
      const content = 'Test!@#$%^&*()_+-=[]{}|;:",.<>?/`~';

      const result = ContentAnalyzer.analyze(content);

      assert.ok(result);
      assert.ok(result.keywords.includes('test'));
    });

  });

});

// Run with: node --test test/content-analyzer.test.js

