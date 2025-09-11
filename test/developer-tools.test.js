import { test, describe } from 'node:test';
import assert from 'node:assert';
import { CodeGenerator, SchemaDebugger } from '../tools/index.js';

describe('Developer Tools - V1.7.0', () => {
  describe('CodeGenerator', () => {
    const testSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': 'Test Product',
      'description': 'A test product for code generation'
    };

    test('should generate React component code', () => {
      const code = CodeGenerator.generateReactComponent(testSchema, 'TestProduct');
      
      assert.ok(code.includes('import React from \'react\''));
      assert.ok(code.includes('import { initSEO } from \'ai-seo\''));
      assert.ok(code.includes('const TestProduct = () =>'));
      assert.ok(code.includes('React.useEffect'));
      assert.ok(code.includes('initSEO({ schema })'));
      assert.ok(code.includes('export default TestProduct'));
      assert.ok(code.includes('Test Product'));
    });

    test('should generate Vue component code', () => {
      const code = CodeGenerator.generateVueComponent(testSchema, 'TestProduct');
      
      assert.ok(code.includes('<template>'));
      assert.ok(code.includes('<script>'));
      assert.ok(code.includes('import { initSEO } from \'ai-seo\''));
      assert.ok(code.includes('name: \'TestProduct\''));
      assert.ok(code.includes('mounted()'));
      assert.ok(code.includes('initSEO({ schema })'));
      assert.ok(code.includes('Test Product'));
    });

    test('should generate Next.js page code', () => {
      const code = CodeGenerator.generateNextJSPage(testSchema, 'product');
      
      assert.ok(code.includes('import { SSR } from \'ai-seo\''));
      assert.ok(code.includes('export default function Product()'));
      assert.ok(code.includes('export async function getStaticProps()'));
      assert.ok(code.includes('SSR.generateScriptTag'));
      assert.ok(code.includes('Test Product'));
    });

    test('should use default names when not provided', () => {
      const reactCode = CodeGenerator.generateReactComponent(testSchema);
      const vueCode = CodeGenerator.generateVueComponent(testSchema);
      const nextCode = CodeGenerator.generateNextJSPage(testSchema);
      
      assert.ok(reactCode.includes('SchemaComponent'));
      assert.ok(vueCode.includes('SchemaComponent'));
      assert.ok(nextCode.includes('function Page()'));
    });
  });

  describe('SchemaDebugger', () => {
    test('should validate complete schema', () => {
      const validSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Valid Product'
      };

      const result = SchemaDebugger.validateSchema(validSchema);
      
      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
      assert.ok(result.score >= 80); // Should have high score
    });

    test('should detect missing @context', () => {
      const invalidSchema = {
        '@type': 'Product',
        'name': 'Invalid Product'
      };

      const result = SchemaDebugger.validateSchema(invalidSchema);
      
      assert.equal(result.isValid, false);
      assert.ok(result.errors.includes('Missing @context property'));
      assert.ok(result.score < 100);
    });

    test('should detect missing @type', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        'name': 'Invalid Product'
      };

      const result = SchemaDebugger.validateSchema(invalidSchema);
      
      assert.equal(result.isValid, false);
      assert.ok(result.errors.includes('Missing @type property'));
    });

    test('should warn about missing name', () => {
      const schemaWithoutName = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'description': 'Product without name'
      };

      const result = SchemaDebugger.validateSchema(schemaWithoutName);
      
      assert.equal(result.isValid, true); // Still valid, just warning
      assert.ok(result.warnings.some(w => w.includes('name')));
    });

    test('should analyze schema performance', () => {
      const complexSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Complex Product',
        'offers': {
          '@type': 'Offer',
          'price': '99.99',
          'seller': {
            '@type': 'Organization',
            'name': 'Seller Name',
            'address': {
              '@type': 'PostalAddress',
              'streetAddress': '123 Main St'
            }
          }
        }
      };

      const analysis = SchemaDebugger.analyzePerformance(complexSchema);
      
      assert.ok(typeof analysis.size === 'number');
      assert.ok(analysis.size > 0);
      assert.ok(typeof analysis.complexity === 'number');
      assert.ok(analysis.complexity > 1);
      assert.ok(Array.isArray(analysis.recommendations));
    });

    test('should calculate complexity correctly', () => {
      const simpleSchema = { '@type': 'Thing' };
      const complexSchema = {
        '@type': 'Product',
        'offers': {
          'seller': {
            'address': {
              'geo': {
                'latitude': 40.7128
              }
            }
          }
        }
      };

      const simpleComplexity = SchemaDebugger.calculateComplexity(simpleSchema);
      const complexComplexity = SchemaDebugger.calculateComplexity(complexSchema);
      
      assert.ok(complexComplexity > simpleComplexity);
      assert.ok(simpleComplexity >= 1);
    });

    test('should provide performance recommendations', () => {
      const largeSize = 6000;
      const highComplexity = 60;
      const smallSize = 300;
      const lowComplexity = 10;

      const largeRecommendations = SchemaDebugger.getPerformanceRecommendations(largeSize, highComplexity);
      const smallRecommendations = SchemaDebugger.getPerformanceRecommendations(smallSize, lowComplexity);
      
      assert.ok(Array.isArray(largeRecommendations));
      assert.ok(Array.isArray(smallRecommendations));
      
      // Large schema should have more recommendations
      assert.ok(largeRecommendations.some(r => r.includes('large')));
      assert.ok(largeRecommendations.some(r => r.includes('complex')));
      
      // Small schema should suggest enhancements
      assert.ok(smallRecommendations.some(r => r.includes('enhanced')));
    });

    test('should handle edge cases in complexity calculation', () => {
      const nullSchema = null;
      const emptySchema = {};
      const circularSchema = {};
      circularSchema.self = circularSchema; // Circular reference

      // Should not throw errors
      assert.doesNotThrow(() => {
        SchemaDebugger.calculateComplexity(nullSchema);
        SchemaDebugger.calculateComplexity(emptySchema);
        SchemaDebugger.calculateComplexity(circularSchema);
      });

      const emptyComplexity = SchemaDebugger.calculateComplexity(emptySchema);
      assert.ok(emptyComplexity >= 1);
    });
  });

  describe('Integration Tests', () => {
    test('should work together for complete workflow', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Integration Test Product',
        'description': 'Testing the complete workflow'
      };

      // Validate
      const validation = SchemaDebugger.validateSchema(schema);
      assert.equal(validation.isValid, true);

      // Analyze performance
      const performance = SchemaDebugger.analyzePerformance(schema);
      assert.ok(performance.size > 0);

      // Generate code
      const reactCode = CodeGenerator.generateReactComponent(schema);
      const vueCode = CodeGenerator.generateVueComponent(schema);
      const nextCode = CodeGenerator.generateNextJSPage(schema);

      // All should contain the schema data
      assert.ok(reactCode.includes('Integration Test Product'));
      assert.ok(vueCode.includes('Integration Test Product'));
      assert.ok(nextCode.includes('Integration Test Product'));
    });

    test('should handle invalid schemas gracefully', () => {
      const invalidSchema = {
        // Missing required fields
        'description': 'Invalid schema for testing'
      };

      // Should not throw errors
      assert.doesNotThrow(() => {
        SchemaDebugger.validateSchema(invalidSchema);
        SchemaDebugger.analyzePerformance(invalidSchema);
        CodeGenerator.generateReactComponent(invalidSchema);
        CodeGenerator.generateVueComponent(invalidSchema);
        CodeGenerator.generateNextJSPage(invalidSchema);
      });

      const validation = SchemaDebugger.validateSchema(invalidSchema);
      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.length > 0);
    });
  });
});
