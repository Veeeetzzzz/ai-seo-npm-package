import { describe, it } from 'node:test';
import assert from 'node:assert';
import './setup.js';
import { SSR } from '../index.js';

describe('SSR Utilities', () => {
  const testSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Test Organization"
  };

  describe('generateScriptTag', () => {
    it('should generate a basic script tag', () => {
      const scriptTag = SSR.generateScriptTag(testSchema);
      
      assert.ok(scriptTag.includes('<script'));
      assert.ok(scriptTag.includes('type="application/ld+json"'));
      assert.ok(scriptTag.includes('data-ai-seo="true"'));
      assert.ok(scriptTag.includes('data-ai-seo-type="Organization"'));
      assert.ok(scriptTag.includes(JSON.stringify(testSchema)));
      assert.ok(scriptTag.includes('</script>'));
    });

    it('should format JSON with pretty printing when requested', () => {
      const scriptTag = SSR.generateScriptTag(testSchema, { pretty: true });
      
      assert.ok(scriptTag.includes('{\n  "@context"'));
    });

    it('should include custom ID when provided', () => {
      const scriptTag = SSR.generateScriptTag(testSchema, { id: 'custom-id' });
      
      assert.ok(scriptTag.includes('data-ai-seo-id="custom-id"'));
    });

    it('should include custom data attributes', () => {
      const scriptTag = SSR.generateScriptTag(testSchema, {
        dataAttributes: {
          'data-custom': 'value',
          'data-test': 'attribute'
        }
      });
      
      assert.ok(scriptTag.includes('data-custom="value"'));
      assert.ok(scriptTag.includes('data-test="attribute"'));
    });

    it('should throw error for invalid schema', () => {
      assert.throws(() => SSR.generateScriptTag(null), /Invalid schema/);
      assert.throws(() => SSR.generateScriptTag('invalid'), /Invalid schema/);
    });
  });

  describe('generateMultipleScriptTags', () => {
    it('should generate multiple script tags', () => {
      const schemas = [
        testSchema,
        { "@context": "https://schema.org", "@type": "Person", "name": "John Doe" }
      ];

      const scriptTags = SSR.generateMultipleScriptTags(schemas);
      
      assert.strictEqual(scriptTags.split('<script').length - 1, 2);
      assert.ok(scriptTags.includes('Organization'));
      assert.ok(scriptTags.includes('Person'));
    });

    it('should format with newlines when pretty is enabled', () => {
      const schemas = [testSchema, testSchema];
      const scriptTags = SSR.generateMultipleScriptTags(schemas, { pretty: true });
      
      assert.ok(scriptTags.includes('</script>\n<script'));
    });

    it('should generate unique IDs for each schema', () => {
      const schemas = [testSchema, testSchema];
      const scriptTags = SSR.generateMultipleScriptTags(schemas, { id: 'multi' });
      
      assert.ok(scriptTags.includes('data-ai-seo-id="multi-0"'));
      assert.ok(scriptTags.includes('data-ai-seo-id="multi-1"'));
    });

    it('should throw error for non-array input', () => {
      assert.throws(() => SSR.generateMultipleScriptTags('invalid'), /array/i);
    });
  });

  describe('generateJSONString', () => {
    it('should generate JSON string', () => {
      const jsonString = SSR.generateJSONString(testSchema);
      
      assert.strictEqual(jsonString, JSON.stringify(testSchema));
    });

    it('should generate pretty JSON when requested', () => {
      const jsonString = SSR.generateJSONString(testSchema, true);
      
      assert.ok(jsonString.includes('{\n  "@context"'));
    });

    it('should throw error for invalid schema', () => {
      assert.throws(() => SSR.generateJSONString(null), /Invalid schema/);
    });
  });

  describe('generateSocialMeta', () => {
    it('should generate Open Graph and Twitter meta tags', () => {
      const socialMeta = SSR.generateSocialMeta({
        title: 'Test Title',
        description: 'Test Description',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com'
      });

      assert.ok(socialMeta.includes('property="og:title"'));
      assert.ok(socialMeta.includes('content="Test Title"'));
      assert.ok(socialMeta.includes('name="twitter:title"'));
      assert.ok(socialMeta.includes('property="og:description"'));
      assert.ok(socialMeta.includes('property="og:image"'));
      assert.ok(socialMeta.includes('property="og:url"'));
      assert.ok(socialMeta.includes('name="twitter:card"'));
    });

    it('should handle optional parameters', () => {
      const socialMeta = SSR.generateSocialMeta({
        title: 'Test Title',
        siteName: 'Test Site'
      });

      assert.ok(socialMeta.includes('property="og:title"'));
      assert.ok(socialMeta.includes('property="og:site_name"'));
      assert.ok(!socialMeta.includes('og:description'));
    });
  });

  describe('Framework Helpers', () => {
    describe('Next.js', () => {
      it('should generate Next.js head content', () => {
        const headContent = SSR.frameworks.nextJS.generateHeadContent(
          testSchema,
          { title: 'Test Title', description: 'Test Description' }
        );

        assert.ok(headContent.jsonLd.includes('<script'));
        assert.ok(headContent.socialMeta.includes('property="og:title"'));
        assert.ok(headContent.combined.includes('<script'));
        assert.ok(headContent.combined.includes('property="og:title"'));
      });

      it('should handle schema without social meta', () => {
        const headContent = SSR.frameworks.nextJS.generateHeadContent(testSchema);

        assert.ok(headContent.jsonLd.includes('<script'));
        assert.strictEqual(headContent.socialMeta, '');
        assert.ok(headContent.combined.includes('<script'));
        assert.ok(!headContent.combined.includes('property="og:'));
      });
    });

    describe('Nuxt.js', () => {
      it('should generate Nuxt.js head config', () => {
        const headConfig = SSR.frameworks.nuxt.generateHeadConfig(
          testSchema,
          { title: 'Test Title', description: 'Test Description' }
        );

        assert.strictEqual(headConfig.script.length, 1);
        assert.strictEqual(headConfig.script[0].type, 'application/ld+json');
        assert.ok(headConfig.script[0].innerHTML.includes('Organization'));
        
        assert.ok(headConfig.meta);
        assert.ok(headConfig.meta.length > 0);
        
        const titleMeta = headConfig.meta.find(m => m.property === 'og:title');
        assert.strictEqual(titleMeta.content, 'Test Title');
      });

      it('should handle schema without social meta', () => {
        const headConfig = SSR.frameworks.nuxt.generateHeadConfig(testSchema);

        assert.strictEqual(headConfig.script.length, 1);
        assert.strictEqual(headConfig.meta, undefined);
      });
    });
  });
}); 