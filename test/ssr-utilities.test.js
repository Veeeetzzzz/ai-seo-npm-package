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
      
      expect(scriptTag).toContain('<script');
      expect(scriptTag).toContain('type="application/ld+json"');
      expect(scriptTag).toContain('data-ai-seo="true"');
      expect(scriptTag).toContain('data-ai-seo-type="Organization"');
      expect(scriptTag).toContain(JSON.stringify(testSchema));
      expect(scriptTag).toContain('</script>');
    });

    it('should format JSON with pretty printing when requested', () => {
      const scriptTag = SSR.generateScriptTag(testSchema, { pretty: true });
      
      expect(scriptTag).toContain('{\n  "@context"');
    });

    it('should include custom ID when provided', () => {
      const scriptTag = SSR.generateScriptTag(testSchema, { id: 'custom-id' });
      
      expect(scriptTag).toContain('data-ai-seo-id="custom-id"');
    });

    it('should include custom data attributes', () => {
      const scriptTag = SSR.generateScriptTag(testSchema, {
        dataAttributes: {
          'data-custom': 'value',
          'data-test': 'attribute'
        }
      });
      
      expect(scriptTag).toContain('data-custom="value"');
      expect(scriptTag).toContain('data-test="attribute"');
    });

    it('should throw error for invalid schema', () => {
      expect(() => SSR.generateScriptTag(null)).toThrow('Invalid schema provided');
      expect(() => SSR.generateScriptTag('invalid')).toThrow('Invalid schema provided');
    });
  });

  describe('generateMultipleScriptTags', () => {
    it('should generate multiple script tags', () => {
      const schemas = [
        testSchema,
        { "@context": "https://schema.org", "@type": "Person", "name": "John Doe" }
      ];

      const scriptTags = SSR.generateMultipleScriptTags(schemas);
      
      expect(scriptTags.split('<script').length - 1).toBe(2);
      expect(scriptTags).toContain('Organization');
      expect(scriptTags).toContain('Person');
    });

    it('should format with newlines when pretty is enabled', () => {
      const schemas = [testSchema, testSchema];
      const scriptTags = SSR.generateMultipleScriptTags(schemas, { pretty: true });
      
      expect(scriptTags).toContain('</script>\n<script');
    });

    it('should generate unique IDs for each schema', () => {
      const schemas = [testSchema, testSchema];
      const scriptTags = SSR.generateMultipleScriptTags(schemas, { id: 'multi' });
      
      expect(scriptTags).toContain('data-ai-seo-id="multi-0"');
      expect(scriptTags).toContain('data-ai-seo-id="multi-1"');
    });

    it('should throw error for non-array input', () => {
      expect(() => SSR.generateMultipleScriptTags('invalid')).toThrow('Schemas must be an array');
    });
  });

  describe('generateJSONString', () => {
    it('should generate JSON string', () => {
      const jsonString = SSR.generateJSONString(testSchema);
      
      expect(jsonString).toBe(JSON.stringify(testSchema));
    });

    it('should generate pretty JSON when requested', () => {
      const jsonString = SSR.generateJSONString(testSchema, true);
      
      expect(jsonString).toContain('{\n  "@context"');
    });

    it('should throw error for invalid schema', () => {
      expect(() => SSR.generateJSONString(null)).toThrow('Invalid schema provided');
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

      expect(socialMeta).toContain('property="og:title"');
      expect(socialMeta).toContain('content="Test Title"');
      expect(socialMeta).toContain('name="twitter:title"');
      expect(socialMeta).toContain('property="og:description"');
      expect(socialMeta).toContain('property="og:image"');
      expect(socialMeta).toContain('property="og:url"');
      expect(socialMeta).toContain('name="twitter:card"');
    });

    it('should handle optional parameters', () => {
      const socialMeta = SSR.generateSocialMeta({
        title: 'Test Title',
        siteName: 'Test Site'
      });

      expect(socialMeta).toContain('property="og:title"');
      expect(socialMeta).toContain('property="og:site_name"');
      expect(socialMeta).not.toContain('og:description');
    });
  });

  describe('Framework Helpers', () => {
    describe('Next.js', () => {
      it('should generate Next.js head content', () => {
        const headContent = SSR.frameworks.nextJS.generateHeadContent(
          testSchema,
          { title: 'Test Title', description: 'Test Description' }
        );

        expect(headContent.jsonLd).toContain('<script');
        expect(headContent.socialMeta).toContain('property="og:title"');
        expect(headContent.combined).toContain('<script');
        expect(headContent.combined).toContain('property="og:title"');
      });

      it('should handle schema without social meta', () => {
        const headContent = SSR.frameworks.nextJS.generateHeadContent(testSchema);

        expect(headContent.jsonLd).toContain('<script');
        expect(headContent.socialMeta).toBe('');
        expect(headContent.combined).toContain('<script');
        expect(headContent.combined).not.toContain('property="og:');
      });
    });

    describe('Nuxt.js', () => {
      it('should generate Nuxt.js head config', () => {
        const headConfig = SSR.frameworks.nuxt.generateHeadConfig(
          testSchema,
          { title: 'Test Title', description: 'Test Description' }
        );

        expect(headConfig.script).toHaveLength(1);
        expect(headConfig.script[0].type).toBe('application/ld+json');
        expect(headConfig.script[0].innerHTML).toContain('Organization');
        
        expect(headConfig.meta).toBeDefined();
        expect(headConfig.meta.length).toBeGreaterThan(0);
        
        const titleMeta = headConfig.meta.find(m => m.property === 'og:title');
        expect(titleMeta.content).toBe('Test Title');
      });

      it('should handle schema without social meta', () => {
        const headConfig = SSR.frameworks.nuxt.generateHeadConfig(testSchema);

        expect(headConfig.script).toHaveLength(1);
        expect(headConfig.meta).toBeUndefined();
      });
    });
  });
}); 