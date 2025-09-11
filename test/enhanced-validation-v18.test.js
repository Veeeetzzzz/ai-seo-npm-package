import { test, describe } from 'node:test';
import assert from 'node:assert';
import { EnhancedValidation } from '../index.js';

describe('Enhanced Validation System - V1.8.0', () => {
  const validProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': 'Test Product',
    'description': 'A test product',
    'offers': {
      '@type': 'Offer',
      'price': '99.99',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock'
    },
    'brand': 'TestBrand',
    'image': 'https://example.com/product.jpg'
  };

  const invalidSchema = {
    'name': 'Missing Context and Type'
  };

  describe('Google Rich Results Testing', () => {
    test('should analyze schema for rich results eligibility', async () => {
      const result = await EnhancedValidation.testWithGoogle(validProductSchema);
      
      assert.ok(result.success);
      assert.ok(result.googleResults);
      assert.equal(result.googleResults.testStatus.status, 'COMPLETE');
      assert.ok(result.googleResults.richResultsTestResult);
      assert.ok(Array.isArray(result.googleResults.richResultsTestResult.detectedItems));
      assert.ok(Array.isArray(result.recommendations));
      assert.ok(result.timestamp);
    });

    test('should detect product rich snippet', async () => {
      const result = await EnhancedValidation.testWithGoogle(validProductSchema);
      
      const detectedTypes = result.googleResults.richResultsTestResult.detectedItems;
      assert.ok(detectedTypes.includes('Product Rich Snippet'));
    });

    test('should find issues with incomplete product schema', async () => {
      const incompleteProduct = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Incomplete Product'
        // Missing offers, price, etc.
      };

      const result = await EnhancedValidation.testWithGoogle(incompleteProduct);
      
      assert.ok(result.success);
      const issues = result.googleResults.richResultsTestResult.issues;
      assert.ok(issues.length > 0);
      assert.ok(issues.some(issue => issue.property === 'offers.price'));
    });
  });

  describe('Cross-Browser Validation', () => {
    test('should validate across multiple browsers', () => {
      const result = EnhancedValidation.validateCrossBrowser(validProductSchema);
      
      assert.ok(result.results);
      assert.ok(result.summary);
      assert.ok(result.results.chrome);
      assert.ok(result.results.firefox);
      assert.ok(result.results.safari);
      assert.ok(result.results.edge);
      assert.ok(result.timestamp);
    });

    test('should include desktop and mobile results', () => {
      const result = EnhancedValidation.validateCrossBrowser(validProductSchema, {
        mobile: true
      });
      
      Object.values(result.results).forEach(browserResult => {
        assert.ok(browserResult.desktop);
        assert.ok(browserResult.mobile);
        assert.ok(typeof browserResult.desktop.score === 'number');
        assert.ok(typeof browserResult.mobile.score === 'number');
      });
    });

    test('should provide summary statistics', () => {
      const result = EnhancedValidation.validateCrossBrowser(validProductSchema);
      
      assert.ok(typeof result.summary.averageScore === 'number');
      assert.ok(typeof result.summary.totalIssues === 'number');
      assert.ok(typeof result.summary.compatibility === 'boolean');
    });
  });

  describe('Mobile-First Validation', () => {
    test('should validate mobile-specific requirements', () => {
      const result = EnhancedValidation.validateMobile(validProductSchema);
      
      assert.ok(typeof result.mobileScore === 'number');
      assert.ok(Array.isArray(result.issues));
      assert.ok(Array.isArray(result.optimizations));
      assert.ok(result.deviceContext);
      assert.ok(result.timestamp);
    });

    test('should detect missing geo coordinates for local business', () => {
      const localBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': 'Test Business',
        'address': '123 Main St'
        // Missing geo coordinates
      };

      const result = EnhancedValidation.validateMobile(localBusinessSchema);
      
      assert.ok(result.issues.some(issue => 
        issue.property === 'geo' && 
        issue.message.includes('geographic coordinates')
      ));
    });

    test('should suggest mobile-optimized images', () => {
      const schemaWithImages = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Product with Images',
        'image': ['https://example.com/large-image.jpg', 'https://example.com/another-image.png']
      };

      const result = EnhancedValidation.validateMobile(schemaWithImages);
      
      assert.ok(result.optimizations.some(opt => 
        opt.type === 'image' && 
        opt.message.includes('mobile-optimized')
      ));
    });

    test('should accept custom mobile viewport', () => {
      const customViewport = { width: 414, height: 896 }; // iPhone 11
      const result = EnhancedValidation.validateMobile(validProductSchema, {
        viewport: customViewport,
        connection: '4g'
      });
      
      assert.equal(result.deviceContext.viewport.width, 414);
      assert.equal(result.deviceContext.viewport.height, 896);
      assert.equal(result.deviceContext.connection, '4g');
    });
  });

  describe('Enhanced Validation Integration', () => {
    test('should perform comprehensive validation', async () => {
      const result = await EnhancedValidation.validateEnhanced(validProductSchema, {
        strict: true,
        crossBrowser: true,
        mobile: true,
        googleTest: true,
        includeMetrics: true
      });
      
      assert.ok(result.success);
      assert.ok(typeof result.score === 'number');
      assert.ok(Array.isArray(result.errors));
      assert.ok(Array.isArray(result.warnings));
      assert.ok(Array.isArray(result.suggestions));
      assert.ok(result.crossBrowser);
      assert.ok(result.mobile);
      assert.ok(result.google);
      assert.ok(result.metrics);
      assert.ok(result.timestamp);
    });

    test('should handle invalid schema properly', async () => {
      const result = await EnhancedValidation.validateEnhanced(invalidSchema, {
        strict: true
      });
      
      assert.equal(result.success, false);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors.some(error => error.property === '@context'));
      assert.ok(result.errors.some(error => error.property === '@type'));
      assert.ok(result.score <= 20); // Score should be very low for critical errors
    });

    test('should calculate accurate scores', async () => {
      // Valid schema should have high score
      const validResult = await EnhancedValidation.validateEnhanced(validProductSchema);
      assert.ok(validResult.score >= 80);
      
      // Invalid schema should have low score
      const invalidResult = await EnhancedValidation.validateEnhanced(invalidSchema);
      assert.ok(invalidResult.score <= 20);
    });

    test('should provide performance metrics', async () => {
      const result = await EnhancedValidation.validateEnhanced(validProductSchema, {
        includeMetrics: true
      });
      
      assert.ok(result.metrics);
      assert.ok(typeof result.metrics.validationTime === 'number');
      assert.ok(result.metrics.testsRun);
      assert.ok(result.metrics.testsRun.basic === true);
      assert.ok(result.metrics.testsRun.compliance === true);
    });

    test('should provide actionable suggestions', async () => {
      const minimalSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Minimal Product'
        // Missing many optional but recommended fields
      };

      const result = await EnhancedValidation.validateEnhanced(minimalSchema, {
        strict: true
      });
      
      assert.ok(result.suggestions.length > 0);
      assert.ok(result.suggestions.some(suggestion => 
        suggestion.property === 'brand' || 
        suggestion.message.includes('brand')
      ));
    });
  });

  describe('Helper Methods', () => {
    test('should analyze rich results eligibility correctly', () => {
      // Complete product should be eligible
      const eligible = EnhancedValidation._analyzeSchemaForRichResults({
        '@type': 'Product',
        'price': '99.99',
        'availability': 'InStock',
        'review': { rating: 5 }
      });
      assert.equal(eligible, 'RICH_RESULTS_ELIGIBLE');
      
      // Incomplete product should be partially eligible (has 2 out of 3 fields)
      const partial = EnhancedValidation._analyzeSchemaForRichResults({
        '@type': 'Product',
        'offers': { 'price': '99.99', 'availability': 'InStock' } // Has price and availability but missing review
      });
      assert.equal(partial, 'PARTIALLY_ELIGIBLE');
      
      // Very incomplete product should not be eligible
      const notEligible = EnhancedValidation._analyzeSchemaForRichResults({
        '@type': 'Product',
        'name': 'Just a name'
      });
      assert.equal(notEligible, 'NOT_ELIGIBLE');
    });

    test('should detect rich result types correctly', () => {
      const productTypes = EnhancedValidation._detectRichResultTypes({
        '@type': 'Product',
        'offers': { price: '99.99' }
      });
      assert.ok(productTypes.includes('Product Rich Snippet'));
      
      const articleTypes = EnhancedValidation._detectRichResultTypes({
        '@type': 'Article',
        'author': 'John Doe'
      });
      assert.ok(articleTypes.includes('Article Rich Snippet'));
      
      const businessTypes = EnhancedValidation._detectRichResultTypes({
        '@type': 'LocalBusiness',
        'address': '123 Main St'
      });
      assert.ok(businessTypes.includes('Local Business Rich Snippet'));
    });
  });
});
