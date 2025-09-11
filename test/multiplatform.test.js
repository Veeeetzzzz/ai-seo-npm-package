import { test, describe } from 'node:test';
import assert from 'node:assert';
import { MultiPlatform } from '../index.js';

describe('Multi-Platform Deployment - V1.8.0', () => {
  const testSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': 'Test Product',
    'description': 'A test product for deployment testing',
    'price': 99.99,
    'brand': 'TestBrand'
  };

  describe('WordPress Integration', () => {
    test('should generate WordPress plugin code', () => {
      const result = MultiPlatform.wordpress.generatePlugin(testSchema, {
        pluginName: 'Test SEO Plugin',
        version: '1.0.0',
        author: 'Test Author'
      });

      assert.ok(result.code);
      assert.ok(result.filename);
      assert.ok(Array.isArray(result.instructions));
      assert.ok(result.code.includes('<?php'));
      assert.ok(result.code.includes('Test SEO Plugin'));
      assert.ok(result.code.includes('class AISEOSchema'));
      assert.ok(result.code.includes('inject_schema'));
      assert.equal(result.filename, 'test-seo-plugin.php');
    });

    test('should generate WordPress theme integration', () => {
      const result = MultiPlatform.wordpress.generateThemeIntegration(testSchema, {
        hookPosition: 'wp_head'
      });

      assert.ok(result.code);
      assert.ok(Array.isArray(result.instructions));
      assert.ok(result.code.includes('<?php'));
      assert.ok(result.code.includes('functions.php'));
      assert.ok(result.code.includes('wp_head'));
      assert.ok(result.code.includes('Test Product'));
    });
  });

  describe('Shopify Integration', () => {
    test('should generate Shopify Liquid template', () => {
      const result = MultiPlatform.shopify.generateLiquidTemplate(testSchema, {
        templateType: 'product'
      });

      assert.ok(result.code);
      assert.ok(result.filename);
      assert.ok(Array.isArray(result.instructions));
      assert.ok(result.code.includes('<!-- AI-SEO Schema - Generated for Shopify -->'));
      assert.ok(result.code.includes('product.liquid'));
      assert.ok(result.code.includes('{{ product.title }}'));
      assert.equal(result.filename, 'schema-product.liquid');
    });

    test('should generate Shopify app integration', () => {
      const result = MultiPlatform.shopify.generateAppIntegration(testSchema, {
        appName: 'Test SEO App'
      });

      assert.ok(result.code);
      assert.ok(Array.isArray(result.instructions));
      assert.ok(result.code.includes('class AISEOShopifyApp'));
      assert.ok(result.code.includes('Test SEO App'));
      assert.ok(result.code.includes('injectSchema'));
      assert.ok(result.code.includes('updateSchema'));
    });
  });

  describe('Webflow Integration', () => {
    test('should generate Webflow embed code', () => {
      const result = MultiPlatform.webflow.generateEmbedCode(testSchema, {
        placement: 'head'
      });

      assert.ok(result.code);
      assert.ok(Array.isArray(result.instructions));
      assert.ok(result.code.includes('<!-- AI-SEO Schema for Webflow -->'));
      assert.ok(result.code.includes('Site Settings > Custom Code > Head Code'));
      assert.ok(result.code.includes('Test Product'));
    });

    test('should generate Webflow collection integration', () => {
      const collectionFields = {
        'name': 'product-name',
        'description': 'product-description'
      };
      
      const result = MultiPlatform.webflow.generateCollectionIntegration(testSchema, collectionFields);

      assert.ok(result.code);
      assert.ok(Array.isArray(result.instructions));
      assert.ok(result.code.includes('Dynamic AI-SEO Schema'));
      assert.ok(result.code.includes('Collection Page template'));
    });
  });

  describe('Google Tag Manager Integration', () => {
    test('should generate GTM data layer push', () => {
      const result = MultiPlatform.gtm.generateDataLayerPush(testSchema, {
        eventName: 'test_schema_ready'
      });

      assert.ok(result.code);
      assert.ok(Array.isArray(result.instructions));
      assert.ok(result.code.includes('dataLayer.push'));
      assert.ok(result.code.includes('test_schema_ready'));
      assert.ok(result.code.includes('ai_seo_version'));
      assert.ok(result.code.includes('injectAISEOSchema'));
    });

    test('should generate GTM tag configuration', () => {
      const result = MultiPlatform.gtm.generateGTMTag(testSchema, {
        tagName: 'Test Schema Tag'
      });

      assert.ok(result.tagConfig);
      assert.ok(Array.isArray(result.instructions));
      assert.equal(result.tagConfig.name, 'Test Schema Tag');
      assert.equal(result.tagConfig.type, 'Custom HTML');
      assert.ok(result.tagConfig.html.includes('<script>'));
      assert.equal(result.tagConfig.trigger, 'All Pages');
    });
  });

  describe('Universal Deploy', () => {
    test('should deploy to multiple platforms', () => {
      const platforms = ['wordpress', 'shopify', 'webflow'];
      const result = MultiPlatform.deploy(testSchema, platforms);

      assert.ok(result.deployments);
      assert.ok(result.summary);
      assert.equal(result.summary.platforms, 3);
      assert.equal(result.summary.generated, 3);
      assert.ok(result.deployments.wordpress);
      assert.ok(result.deployments.shopify);
      assert.ok(result.deployments.webflow);
      assert.ok(result.summary.timestamp);
    });

    test('should handle invalid platforms gracefully', () => {
      const platforms = ['wordpress', 'invalid', 'shopify'];
      const result = MultiPlatform.deploy(testSchema, platforms);

      // Should only deploy to valid platforms
      assert.equal(result.summary.generated, 2);
      assert.ok(result.deployments.wordpress);
      assert.ok(result.deployments.shopify);
      assert.ok(!result.deployments.invalid);
    });

    test('should apply platform-specific options', () => {
      const platforms = ['wordpress'];
      const options = {
        wordpress: {
          pluginName: 'Custom Plugin Name',
          version: '2.0.0'
        }
      };
      
      const result = MultiPlatform.deploy(testSchema, platforms, options);

      assert.ok(result.deployments.wordpress.code.includes('Custom Plugin Name'));
      assert.ok(result.deployments.wordpress.code.includes('Version: 2.0.0'));
    });
  });

  describe('Error Handling', () => {
    test('should handle missing schema gracefully', () => {
      assert.throws(() => {
        MultiPlatform.wordpress.generatePlugin(null);
      });
    });

    test('should handle empty platforms array', () => {
      const result = MultiPlatform.deploy(testSchema, []);
      assert.equal(result.summary.platforms, 0);
      assert.equal(result.summary.generated, 0);
    });
  });
});
