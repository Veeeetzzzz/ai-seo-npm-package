// HTML Fetching & Parsing Tests - v1.12.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { URLSchemaGenerator } from '../src/url-generator.js';
import { HTMLParser } from '../src/html-parser.js';

describe('HTML Fetching - v1.12.0', () => {
  
  describe('HTMLParser', () => {
    
    it('should extract title from HTML', () => {
      const html = '<html><head><title>Test Page</title></head><body></body></html>';
      const parsed = HTMLParser.parse(html, 'https://example.com');
      
      assert.strictEqual(parsed.title, 'Test Page');
    });

    it('should extract meta description', () => {
      const html = '<html><head><meta name="description" content="Test description"></head></html>';
      const parsed = HTMLParser.parse(html, 'https://example.com');
      
      assert.strictEqual(parsed.description, 'Test description');
    });

    it('should extract OpenGraph data', () => {
      const html = `
        <html><head>
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
        </head></html>
      `;
      const parsed = HTMLParser.parse(html, 'https://example.com');
      
      assert.strictEqual(parsed.openGraph.title, 'OG Title');
      assert.strictEqual(parsed.openGraph.description, 'OG Description');
    });

    it('should extract images', () => {
      const html = `
        <html><body>
          <img src="/image1.jpg">
          <img src="https://example.com/image2.jpg">
        </body></html>
      `;
      const parsed = HTMLParser.parse(html, 'https://example.com');
      
      assert.ok(parsed.images.length >= 2);
      assert.ok(parsed.images.some(img => img.includes('image1.jpg')));
    });

    it('should extract existing JSON-LD schemas', () => {
      const html = `
        <html><body>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Test Product"
          }
          </script>
        </body></html>
      `;
      const parsed = HTMLParser.parse(html, 'https://example.com');
      
      assert.strictEqual(parsed.existing.length, 1);
      assert.strictEqual(parsed.existing[0]['@type'], 'Product');
      assert.strictEqual(parsed.existing[0].name, 'Test Product');
    });

    it('should clean HTML entities from text', () => {
      const html = '<html><head><title>Test &amp; Example &lt;tag&gt;</title></head></html>';
      const parsed = HTMLParser.parse(html, 'https://example.com');
      
      assert.strictEqual(parsed.title, 'Test & Example <tag>');
    });

    it('should handle missing title gracefully', () => {
      const html = '<html><body>No title here</body></html>';
      const parsed = HTMLParser.parse(html, 'https://example.com');
      
      assert.strictEqual(typeof parsed.title, 'string');
    });

  });

  describe('URL Fetching', () => {
    
    it('should handle fetch errors gracefully', async () => {
      const result = await URLSchemaGenerator.generateFromURL('https://invalid-domain-that-does-not-exist-12345.com');
      
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.suggestion);
    });

    // Note: Testing with real URLs in CI can be flaky
    // In production, mock the fetch or use fixture files

  });

});

// Run with: node --test test/html-fetching.test.js

