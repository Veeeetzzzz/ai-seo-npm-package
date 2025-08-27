import { describe, it } from 'node:test';
import assert from 'node:assert';
import './setup.js';
import { 
  validateSchemaRealtime, 
  analyzeSchemaQuality, 
  optimizeSchema,
  validateSchemaEnhanced 
} from '../index.js';

describe('Enhanced Validation v1.4.0', () => {
  describe('Real-time Validation', () => {
    it('should perform real-time validation in browser environment', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Test Product"
      };

      const result = validateSchemaRealtime(schema, {
        live: false,
        includeSuggestions: true
      });

      assert.strictEqual(result.validationType, 'realtime');
      assert.ok(result.timestamp);
      assert.ok(result.browserContext);
      assert.ok(typeof result.validationTime === 'number');
    });

    it('should fall back to enhanced validation outside browser', () => {
      // Mock non-browser environment temporarily
      const originalWindow = global.window;
      delete global.window;

      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Test Product"
      };

      const result = validateSchemaRealtime(schema);
      assert.ok(result.valid);
      assert.ok(!result.validationType); // Should not have real-time specific properties

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Quality Analysis', () => {
    it('should analyze schema quality with detailed metrics', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "High Quality Product",
        "description": "A very detailed description of this amazing product",
        "image": ["product1.jpg", "product2.jpg"],
        "brand": "Premium Brand",
        "offers": {
          "@type": "Offer",
          "price": "99.99",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": 4.8,
          "reviewCount": 150
        }
      };

      const analysis = analyzeSchemaQuality(schema, {
        includePerformanceMetrics: true,
        includeSEOImpact: true
      });

      assert.ok(analysis.qualityMetrics);
      assert.ok(typeof analysis.qualityMetrics.completeness === 'number');
      assert.ok(typeof analysis.qualityMetrics.seoOptimization === 'number');
      assert.ok(typeof analysis.qualityMetrics.technicalCorrectness === 'number');
      assert.ok(analysis.qualityMetrics.richResultsEligibility);
      assert.ok(Array.isArray(analysis.recommendations));
      assert.ok(analysis.benchmarks);
      assert.ok(analysis.performanceMetrics);
      assert.ok(analysis.seoImpact);
    });

    it('should assess rich results eligibility correctly', () => {
      const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Test Product",
        "image": "product.jpg",
        "offers": { "price": "99.99" }
      };

      const analysis = analyzeSchemaQuality(productSchema);
      const eligibility = analysis.qualityMetrics.richResultsEligibility;
      
      assert.strictEqual(eligibility.type, 'Product');
      assert.ok(eligibility.eligible);
      assert.strictEqual(eligibility.score, 100); // All required fields present
    });
  });

  describe('Schema Optimization', () => {
    it('should optimize schema with auto-fix enabled', () => {
      const schema = {
        "@type": "Product", // Missing @context
        "name": "Test Product",
        "datePublished": "2024-01-15", // Wrong date format
        "image": ["img1.jpg", "img2.jpg", "img1.jpg"] // Duplicate images
      };

      const result = optimizeSchema(schema, {
        autoFix: true,
        aggressive: false
      });

      assert.strictEqual(result.optimized['@context'], 'https://schema.org');
      assert.ok(result.optimized.datePublished.includes('T')); // ISO format
      assert.strictEqual(result.optimized.image.length, 2); // Duplicates removed
      assert.ok(result.optimizations.length > 0);
      assert.ok(result.qualityImprovement.issuesFixed > 0);
    });

    it('should provide enhancement suggestions in aggressive mode', () => {
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Test Article"
        // Missing publisher - should be inferred in aggressive mode
      };

      const result = optimizeSchema(articleSchema, {
        autoFix: true,
        aggressive: true
      });

      // Should have inferred publisher from page context
      assert.ok(result.optimized.publisher);
      assert.strictEqual(result.optimized.publisher['@type'], 'Organization');
    });

    it('should generate actionable recommendations', () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Basic Product"
        // Missing many recommended fields
      };

      const result = optimizeSchema(schema);
      
      assert.ok(Array.isArray(result.recommendations));
      const imageRec = result.recommendations.find(r => r.property === 'image');
      assert.ok(imageRec);
      assert.strictEqual(imageRec.priority, 'medium');
      assert.ok(imageRec.example);
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle invalid schemas gracefully', () => {
      const invalidSchema = null;
      
      const result = validateSchemaEnhanced(invalidSchema);
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should provide detailed validation for incomplete schemas', () => {
      const incompleteSchema = {
        "@context": "https://schema.org",
        "@type": "JobPosting"
        // Missing required fields
      };

      const result = validateSchemaEnhanced(incompleteSchema, { strict: true });
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(error => error.includes('title')));
    });
  });
});
