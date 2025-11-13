/**
 * Comprehensive test suite for v1.11.0 features
 * Tests new templates, enhanced analysis, and optimizer implementations
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  Templates,
  AI,
  BardOptimizer,
  PerplexityOptimizer,
  VoiceSearchOptimizer,
  VisualSearchOptimizer
} from '../index.js';

describe('v1.11.0 - New Schema Templates', () => {
  describe('Content Templates', () => {
    it('should create a blog series schema', () => {
      const seriesData = {
        title: 'Complete JavaScript Guide',
        description: 'A comprehensive series on JavaScript',
        author: { name: 'John Doe' },
        publisher: { name: 'Tech Blog' },
        seriesName: 'JavaScript Mastery',
        partNumber: 1,
        parts: [
          { title: 'Part 1: Basics', url: '/js-basics' },
          { title: 'Part 2: Advanced', url: '/js-advanced' }
        ],
        tags: ['javascript', 'tutorial', 'programming']
      };

      const schema = Templates.content.blogSeries(seriesData);

      assert.strictEqual(schema['@context'], 'https://schema.org');
      assert.strictEqual(schema['@type'], 'BlogPosting');
      assert.strictEqual(schema.name, 'Complete JavaScript Guide');
      assert.ok(schema.isPartOf);
      assert.strictEqual(schema.isPartOf.name, 'JavaScript Mastery');
      assert.strictEqual(schema.position, 1);
      assert.strictEqual(schema.hasPart.length, 2);
      assert.deepStrictEqual(schema.keywords, ['javascript', 'tutorial', 'programming']);
    });

    it('should create a tutorial/how-to schema', () => {
      const tutorialData = {
        title: 'How to Bake Bread',
        description: 'Step-by-step bread baking guide',
        image: 'https://example.com/bread.jpg',
        steps: [
          { title: 'Mix ingredients', description: 'Combine flour, water, yeast' },
          { title: 'Knead dough', description: 'Knead for 10 minutes' },
          { title: 'Let rise', description: 'Wait 1 hour' }
        ],
        duration: 'PT2H',
        cost: 10,
        currency: 'USD',
        tools: ['Mixing bowl', 'Oven'],
        materials: ['Flour', 'Yeast', 'Water']
      };

      const schema = Templates.content.tutorial(tutorialData);

      assert.strictEqual(schema['@type'], 'HowTo');
      assert.strictEqual(schema.name, 'How to Bake Bread');
      assert.strictEqual(schema.step.length, 3);
      assert.strictEqual(schema.step[0]['@type'], 'HowToStep');
      assert.strictEqual(schema.totalTime, 'PT2H');
      assert.strictEqual(schema.estimatedCost.value, 10);
      assert.deepStrictEqual(schema.tool, ['Mixing bowl', 'Oven']);
    });

    it('should create a testimonial schema', () => {
      const testimonialData = {
        title: 'Great Product',
        text: 'This product exceeded my expectations!',
        rating: 5,
        maxRating: 5,
        customerName: 'Jane Smith',
        customerTitle: 'Software Engineer',
        date: '2024-01-15',
        itemType: 'Product',
        itemName: 'Premium Widget'
      };

      const schema = Templates.content.testimonial(testimonialData);

      assert.strictEqual(schema['@type'], 'Review');
      assert.strictEqual(schema.reviewBody, 'This product exceeded my expectations!');
      assert.ok(schema.reviewRating);
      assert.strictEqual(schema.reviewRating.ratingValue, 5);
      assert.strictEqual(schema.author.name, 'Jane Smith');
      assert.strictEqual(schema.itemReviewed.name, 'Premium Widget');
    });
  });

  describe('E-commerce Extensions', () => {
    it('should create a product bundle schema', () => {
      const bundleData = {
        name: 'Complete Office Bundle',
        description: 'Everything you need for your office',
        images: ['https://example.com/bundle.jpg'],
        products: [
          { name: 'Desk', sku: 'DESK-001', price: 299 },
          { name: 'Chair', sku: 'CHAIR-001', price: 199 }
        ],
        totalPrice: 449,
        currency: 'USD',
        inStock: true
      };

      const schema = Templates.ecommerceExtensions.productBundle(bundleData);

      assert.strictEqual(schema['@type'], 'ProductGroup');
      assert.strictEqual(schema.name, 'Complete Office Bundle');
      assert.strictEqual(schema.hasVariant.length, 2);
      assert.strictEqual(schema.offers['@type'], 'AggregateOffer');
      assert.strictEqual(schema.offers.lowPrice, 449);
    });

    it('should create a product variant schema', () => {
      const variantData = {
        name: 'T-Shirt - Blue - Large',
        description: 'Comfortable cotton t-shirt',
        images: ['https://example.com/tshirt-blue.jpg'],
        parentProduct: 'Basic T-Shirt',
        color: 'Blue',
        size: 'Large',
        material: 'Cotton',
        sku: 'TSHIRT-BLU-L',
        gtin: '123456789',
        price: 29.99,
        currency: 'USD',
        inStock: true
      };

      const schema = Templates.ecommerceExtensions.productVariant(variantData);

      assert.strictEqual(schema['@type'], 'ProductModel');
      assert.strictEqual(schema.color, 'Blue');
      assert.strictEqual(schema.size, 'Large');
      assert.strictEqual(schema.material, 'Cotton');
      assert.strictEqual(schema.isVariantOf.name, 'Basic T-Shirt');
    });
  });

  describe('Professional Extensions', () => {
    it('should create a service area schema', () => {
      const serviceData = {
        name: 'Plumbing Services',
        description: 'Professional plumbing for your home',
        phone: '555-1234',
        email: 'info@plumbing.com',
        website: 'https://plumbing.com',
        businessType: 'Plumber',
        areas: [
          { latitude: 40.7128, longitude: -74.0060, radius: '25 miles' },
          { latitude: 40.7580, longitude: -73.9855, radius: '15 miles' }
        ],
        services: ['Repairs', 'Installation', 'Emergency']
      };

      const schema = Templates.professionalExtensions.serviceArea(serviceData);

      assert.strictEqual(schema['@type'], 'Plumber');
      assert.strictEqual(schema.name, 'Plumbing Services');
      assert.strictEqual(schema.areaServed.length, 2);
      assert.strictEqual(schema.areaServed[0]['@type'], 'GeoCircle');
      assert.deepStrictEqual(schema.serviceType, ['Repairs', 'Installation', 'Emergency']);
    });

    it('should create a certification schema', () => {
      const certData = {
        name: 'Certified Web Developer',
        description: 'Professional web development certification',
        category: 'Professional Certification',
        requirements: 'Complete course and pass exam',
        level: 'Advanced',
        issuingOrganization: 'Web Dev Institute',
        issueDate: '2024-01-01',
        expiryDate: '2027-01-01',
        holder: {
          name: 'John Developer',
          title: 'Senior Developer'
        }
      };

      const schema = Templates.professionalExtensions.certification(certData);

      assert.strictEqual(schema['@type'], 'EducationalOccupationalCredential');
      assert.strictEqual(schema.name, 'Certified Web Developer');
      assert.strictEqual(schema.credentialCategory, 'Professional Certification');
      assert.strictEqual(schema.recognizedBy.name, 'Web Dev Institute');
      assert.strictEqual(schema.validFrom, '2024-01-01');
      assert.strictEqual(schema.credentialHolder.name, 'John Developer');
    });
  });
});

describe('v1.11.0 - Enhanced Keyword Extraction', () => {
  it('should extract keywords with TF-IDF scoring', () => {
    const content = 'Machine learning and artificial intelligence are transforming the technology industry. ' +
                   'Machine learning algorithms enable computers to learn from data. ' +
                   'Artificial intelligence systems can make intelligent decisions.';

    const keywords = AI._extractKeywords(content);

    assert.ok(Array.isArray(keywords));
    assert.ok(keywords.length > 0);
    assert.ok(keywords.length <= 10);
    
    // Should include important terms
    const keywordStr = keywords.join(' ');
    const hasImportantTerm = ['machine', 'learning', 'artificial', 'intelligence'].some(term => 
      keywordStr.includes(term)
    );
    assert.ok(hasImportantTerm);
  });

  it('should extract multi-word phrases (bigrams/trigrams)', () => {
    const content = 'Web development is important. Web development skills are essential. ' +
                   'Learn web development today. Full stack web development is powerful.';

    const keywords = AI._extractKeywords(content, { includePhrases: true });

    assert.ok(Array.isArray(keywords));
    
    // Should include multi-word phrases
    const hasPhrase = keywords.some(kw => kw.includes(' '));
    assert.ok(hasPhrase);
  });

  it('should filter stop words', () => {
    const content = 'The quick brown fox jumps over the lazy dog and the cat';

    const keywords = AI._extractKeywords(content);

    // Should not include common stop words
    const stopWords = ['the', 'and', 'over'];
    stopWords.forEach(stopWord => {
      assert.ok(!keywords.includes(stopWord));
    });
  });
});

describe('v1.11.0 - Enhanced Entity Recognition', () => {
  it('should extract prices in multiple formats', () => {
    const content = 'The product costs $1,234.56. Another item is 999 USD. ' +
                   'Premium package: USD 2500. Budget option: 49.99 dollars.';

    const entities = AI._extractEntities(content);

    assert.ok(entities.prices);
    assert.ok(entities.prices.length > 0);
    assert.ok(entities.prices.includes('$1,234.56'));
  });

  it('should extract dates in multiple formats', () => {
    const content = 'Event on January 15, 2024. Deadline: 03/20/2024. ' +
                   'Published 2024-01-10. Meeting on 5 Feb 2024.';

    const entities = AI._extractEntities(content);

    assert.ok(entities.dates);
    assert.ok(entities.dates.length > 0);
  });

  it('should extract contact information', () => {
    const content = 'Contact us at info@example.com or call 555-123-4567. ' +
                   'Email: support@test.org Phone: (800) 555-1234';

    const entities = AI._extractEntities(content);

    assert.ok(entities.emails);
    assert.ok(entities.emails.includes('info@example.com'));
    assert.ok(entities.emails.includes('support@test.org'));
    
    assert.ok(entities.phones);
    assert.ok(entities.phones.length > 0);
  });

  it('should extract URLs', () => {
    const content = 'Visit https://example.com for more info. ' +
                   'Documentation at http://docs.example.org/guide';

    const entities = AI._extractEntities(content, { includeUrls: true });

    assert.ok(entities.urls);
    assert.ok(entities.urls.includes('https://example.com'));
  });
});

describe('v1.11.0 - Schema Relationship Detection', () => {
  it('should detect relationships between schemas', () => {
    const schemas = [
      { '@type': 'Product', name: 'Test Product' },
      { '@type': 'Review', reviewBody: 'Great product!' },
      { '@type': 'Organization', name: 'Test Company' }
    ];

    const result = AI.detectSchemaRelationships(schemas);

    assert.ok(result.relationships);
    assert.ok(result.suggestions);
    assert.ok(result.summary);
    assert.strictEqual(result.summary.totalSchemas, 3);
  });

  it('should suggest missing relationships', () => {
    const schemas = [
      { '@type': 'Product', name: 'Widget', description: 'A great widget' }
    ];

    const result = AI.detectSchemaRelationships(schemas, { suggestMissing: true });

    assert.ok(result.suggestions.length > 0);
    
    // Should suggest adding reviews for products
    const reviewSuggestion = result.suggestions.find(s => s.missingType === 'Review');
    assert.ok(reviewSuggestion);
  });

  it('should detect conflicts and duplicates', () => {
    const schemas = [
      { '@type': 'Product', name: 'Widget', url: 'https://example.com/widget' },
      { '@type': 'Product', name: 'Widget', url: 'https://example.com/widget' }
    ];

    const result = AI.detectSchemaRelationships(schemas, { detectConflicts: true });

    assert.ok(result.conflicts.length > 0);
    assert.strictEqual(result.conflicts[0].type, 'duplicate');
  });
});

describe('v1.11.0 - AI Optimizers', () => {
  describe('BardOptimizer (Gemini)', () => {
    it('should optimize schema for Bard/Gemini', async () => {
      const optimizer = new BardOptimizer();
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Smart Camera',
        description: 'High-quality camera with AI features',
        image: 'https://example.com/camera.jpg'
      };

      const optimized = await optimizer.optimize(schema);

      assert.ok(optimized._aiOptimization);
      assert.strictEqual(optimized._aiOptimization.target, 'bard-gemini');
      assert.strictEqual(optimized._aiOptimization.version, '1.11.0');
      assert.ok(optimized._aiOptimization.optimizations.includes('multi-modal-hints'));
    });
  });

  describe('PerplexityOptimizer', () => {
    it('should optimize schema for Perplexity', async () => {
      const optimizer = new PerplexityOptimizer();
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Research on AI',
        description: 'Comprehensive research article',
        author: { name: 'Dr. Smith' }
      };

      const optimized = await optimizer.optimize(schema);

      assert.ok(optimized._aiOptimization);
      assert.strictEqual(optimized._aiOptimization.target, 'perplexity');
      assert.ok(optimized._aiOptimization.optimizations.includes('research-structured'));
      assert.ok(optimized._aiOptimization.optimizations.includes('citation-ready'));
    });
  });

  describe('VoiceSearchOptimizer', () => {
    it('should add speakable content to schema', async () => {
      const optimizer = new VoiceSearchOptimizer();
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Coffee Shop',
        description: 'Best coffee in town'
      };

      const optimized = await optimizer.optimize(schema);

      assert.ok(optimized.speakable);
      assert.strictEqual(optimized.speakable['@type'], 'SpeakableSpecification');
      assert.ok(optimized.speakableText);
    });

    it('should generate Q&A format for voice queries', async () => {
      const optimizer = new VoiceSearchOptimizer();
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Laptop',
        description: 'Powerful laptop for professionals',
        offers: { price: 999, priceCurrency: 'USD' }
      };

      const optimized = await optimizer.optimize(schema);

      assert.ok(optimized.mainEntity);
      assert.ok(optimized.mainEntity.length > 0);
      assert.strictEqual(optimized.mainEntity[0]['@type'], 'Question');
    });

    it('should optimize for featured snippets', async () => {
      const optimizer = new VoiceSearchOptimizer();
      const longDescription = 'Here is a comprehensive guide about various topics covering many subjects in detail. ' +
        'The content includes extensive analysis of multiple factors and considerations for professionals. ' +
        'Additional information provides deeper insights into practical applications across different industries. ' +
        'Furthermore the document explores advanced concepts with examples and case studies from real world scenarios. ' +
        'Each section builds upon previous knowledge to create a complete understanding of the subject matter. ' +
        'Final conclusions summarize key takeaways and actionable recommendations for immediate implementation in your projects.';

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Article Title',
        description: longDescription
      };

      const optimized = await optimizer.optimize(schema);

      // Description should still be present
      assert.ok(optimized.description);
      
      // If description is longer than 60 words, should have abstract summary
      const wordCount = longDescription.split(/\s+/).length;
      if (wordCount > 60) {
        assert.ok(optimized.abstractSummary);
        assert.ok(optimized.abstractSummary.length < optimized.description.length);
      }
    });
  });

  describe('VisualSearchOptimizer', () => {
    it('should enhance image metadata', async () => {
      const optimizer = new VisualSearchOptimizer();
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Blue Jeans',
        image: 'https://example.com/jeans.jpg'
      };

      const optimized = await optimizer.optimize(schema);

      assert.strictEqual(optimized.image['@type'], 'ImageObject');
      assert.strictEqual(optimized.image.url, 'https://example.com/jeans.jpg');
      assert.ok(optimized.image.caption);
    });

    it('should optimize alt text for images', async () => {
      const optimizer = new VisualSearchOptimizer();
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Running Shoes',
        brand: { name: 'Nike' },
        image: {
          '@type': 'ImageObject',
          url: 'https://example.com/shoes.jpg'
        }
      };

      const optimized = await optimizer.optimize(schema);

      assert.ok(optimized.image.description);
      assert.ok(optimized.image.thumbnail);
    });

    it('should detect color from product name', async () => {
      const optimizer = new VisualSearchOptimizer();
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Red Running Shoes',
        description: 'Comfortable shoes'
      };

      const optimized = await optimizer.optimize(schema);

      assert.strictEqual(optimized.color, 'Red');
    });

    it('should detect material from description', async () => {
      const optimizer = new VisualSearchOptimizer();
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Leather Wallet',
        description: 'Premium leather wallet for everyday use'
      };

      const optimized = await optimizer.optimize(schema);

      assert.strictEqual(optimized.material, 'Leather');
    });
  });
});

describe('v1.11.0 - Integration Tests', () => {
  it('should work together: templates + optimizers', async () => {
    // Create a product using template
    const productData = {
      name: 'Smart Watch',
      description: 'Advanced smartwatch with health tracking',
      images: ['https://example.com/watch.jpg'],
      brand: 'TechBrand',
      price: 299,
      currency: 'USD',
      inStock: true,
      rating: 4.5,
      reviewCount: 150
    };

    const schema = Templates.ecommerce.productPage(productData);

    // Optimize for voice search
    const voiceOptimizer = new VoiceSearchOptimizer();
    const optimized = await voiceOptimizer.optimize(schema);

    assert.strictEqual(optimized.name, 'Smart Watch');
    assert.ok(optimized.speakable);
    assert.strictEqual(optimized._aiOptimization.target, 'voice-search');
  });

  it('should detect relationships and provide actionable insights', () => {
    const schemas = [
      { '@type': 'LocalBusiness', name: 'My Restaurant' },
      { '@type': 'Article', headline: 'Our Story' }
    ];

    const relationships = AI.detectSchemaRelationships(schemas);

    assert.strictEqual(relationships.summary.totalSchemas, 2);
    assert.ok(relationships.suggestions.length > 0);
    
    // Should suggest adding address for local business
    const addressSuggestion = relationships.suggestions.find(
      s => s.property === 'address'
    );
    assert.ok(addressSuggestion);
  });
});
