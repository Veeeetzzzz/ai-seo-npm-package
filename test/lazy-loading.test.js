import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import './setup.js';
import { LazySchema } from '../index.js';

describe('Lazy Loading System v1.5.0', () => {
  beforeEach(() => {
    // Clean up any existing schemas
    const scripts = document.querySelectorAll('script[data-ai-seo]');
    scripts.forEach(script => script.remove());
  });

  afterEach(() => {
    // Clean up after tests
    const scripts = document.querySelectorAll('script[data-ai-seo]');
    scripts.forEach(script => script.remove());
    
    const placeholders = document.querySelectorAll('[data-lazy-schema]');
    placeholders.forEach(placeholder => placeholder.remove());
  });

  describe('LazySchema Construction', () => {
    it('should create a LazySchema instance with default settings', () => {
      const lazy = new LazySchema('Product');
      
      assert.strictEqual(lazy.schemaType, 'Product');
      assert.strictEqual(lazy.loadCondition, 'immediate');
      assert.strictEqual(lazy.loaded, false);
    });

    it('should configure load conditions', () => {
      const lazy = new LazySchema('Article')
        .loadWhen('visible')
        .withData(() => ({ name: 'Test Article' }));
      
      assert.strictEqual(lazy.loadCondition, 'visible');
      assert.ok(lazy.dataProvider);
    });

    it('should configure custom load conditions', () => {
      const customFn = () => Math.random() > 0.5;
      const lazy = new LazySchema('Event')
        .loadWhen('custom', customFn);
      
      assert.strictEqual(lazy.loadCondition, 'custom');
      assert.strictEqual(lazy.customCondition, customFn);
    });
  });

  describe('Immediate Loading', () => {
    it('should load schema immediately when condition is immediate', () => {
      const lazy = new LazySchema('Product')
        .loadWhen('immediate')
        .withData(() => ({
          name: 'Test Product',
          description: 'A test product'
        }));

      const result = lazy.inject({ debug: true });
      
      assert.ok(result);
      assert.strictEqual(lazy.loaded, true);
      
      // Check that script was injected
      const scripts = document.querySelectorAll('script[data-ai-seo-type="Product"]');
      assert.strictEqual(scripts.length, 1);
    });

    it('should work without data provider', () => {
      const lazy = new LazySchema('Organization')
        .loadWhen('immediate');

      const result = lazy.inject();
      
      assert.ok(result);
      assert.strictEqual(lazy.loaded, true);
    });

    it('should handle errors gracefully', () => {
      const lazy = new LazySchema('Product')
        .loadWhen('immediate')
        .withData(() => {
          throw new Error('Data provider error');
        });

      const result = lazy.inject();
      
      // Should return null on error but not crash
      assert.strictEqual(result, null);
    });
  });

  describe('Visibility-based Loading', () => {
    it('should create placeholder for visibility tracking', async () => {
      const lazy = new LazySchema('Product')
        .loadWhen('visible')
        .withData(() => ({ name: 'Visible Product' }));

      const result = lazy.inject();
      
      // Should return placeholder element
      assert.ok(result);
      assert.strictEqual(result.getAttribute('data-lazy-schema'), 'true');
      assert.strictEqual(result.getAttribute('data-schema-type'), 'Product');
      
      // Schema should not be loaded yet (immediately)
      assert.strictEqual(lazy.loaded, false);
      
      // Wait for IntersectionObserver callback
      await global.waitForAsync(20);
      
      // Now it should be loaded
      assert.strictEqual(lazy.loaded, true);
    });

    it('should configure intersection observer options', () => {
      const lazy = new LazySchema('Article')
        .loadWhen('visible')
        .configure({
          rootMargin: '100px',
          threshold: 0.5
        });

      assert.strictEqual(lazy.config.rootMargin, '100px');
      assert.strictEqual(lazy.config.threshold, 0.5);
    });

    it('should fallback to immediate loading without IntersectionObserver', () => {
      // Mock IntersectionObserver as undefined
      const originalIO = global.IntersectionObserver;
      const originalWindowIO = window.IntersectionObserver;
      global.IntersectionObserver = undefined;
      window.IntersectionObserver = undefined;

      const lazy = new LazySchema('Product')
        .loadWhen('visible')
        .withData(() => ({ name: 'Fallback Product' }));

      const result = lazy.inject();
      
      // Should fallback to immediate loading
      assert.ok(result);
      assert.strictEqual(lazy.loaded, true);
      
      // Restore IntersectionObserver
      global.IntersectionObserver = originalIO;
      window.IntersectionObserver = originalWindowIO;
    });
  });

  describe('Interaction-based Loading', () => {
    it('should setup interaction listeners', () => {
      const lazy = new LazySchema('Product')
        .loadWhen('interaction')
        .withData(() => ({ name: 'Interactive Product' }));

      const result = lazy.inject();
      
      // Should return listener info
      assert.ok(result);
      assert.strictEqual(result.type, 'interaction-listener');
      assert.ok(Array.isArray(result.events));
      assert.ok(result.events.includes('click'));
      assert.ok(result.events.includes('scroll'));
      
      // Schema should not be loaded yet
      assert.strictEqual(lazy.loaded, false);
    });

    it('should load on user interaction', async () => {
      const lazy = new LazySchema('Product')
        .loadWhen('interaction')
        .withData(() => ({ name: 'Click Product' }));

      lazy.inject();
      
      // Simulate click event
      const clickEvent = new Event('click', { bubbles: true });
      document.dispatchEvent(clickEvent);
      
      // Wait for event handler to process
      await global.waitForAsync(10);
      
      // Schema should be loaded now
      assert.strictEqual(lazy.loaded, true);
      
      const scripts = document.querySelectorAll('script[data-ai-seo-type="Product"]');
      assert.strictEqual(scripts.length, 1);
    });

    it('should fallback to immediate loading without browser environment', () => {
      // Mock non-browser environment
      const originalWindow = global.window;
      const originalDocument = global.document;
      
      try {
        global.window = undefined;
        global.document = undefined;

        const lazy = new LazySchema('Product')
          .loadWhen('interaction')
          .withData(() => ({ name: 'Non-browser Product' }));

        const result = lazy.inject();
        
        // In non-browser environment, initSEO returns null
        // So the fallback attempts to load but gets null from initSEO
        assert.strictEqual(result, null);
      } finally {
        // Always restore window and document
        global.window = originalWindow;
        global.document = originalDocument;
      }
    });
  });

  describe('Custom Loading Conditions', () => {
    it('should use custom condition function', async () => {
      let shouldLoad = false;
      
      const lazy = new LazySchema('Product')
        .loadWhen('custom', () => shouldLoad)
        .withData(() => ({ name: 'Custom Product' }));

      // First injection - should not load
      let result = lazy.inject();
      await global.waitForAsync(10);
      assert.strictEqual(result, null);
      assert.strictEqual(lazy.loaded, false);
      
      // Change condition and try again
      shouldLoad = true;
      result = lazy.inject();
      await global.waitForAsync(10);
      assert.ok(result);
      assert.strictEqual(lazy.loaded, true);
    });

    it('should handle custom condition errors', async () => {
      const lazy = new LazySchema('Product')
        .loadWhen('custom', () => {
          throw new Error('Custom condition error');
        })
        .withData(() => ({ name: 'Error Product' }));

      // Should fallback to loading on error
      const result = lazy.inject();
      await global.waitForAsync(10);
      assert.ok(result);
      assert.strictEqual(lazy.loaded, true);
    });
  });

  describe('Schema Building and Configuration', () => {
    it('should build schema with provided data', async () => {
      const testData = {
        name: 'Test Product',
        description: 'A test description',
        price: 99.99
      };

      const lazy = new LazySchema('Product')
        .loadWhen('immediate')
        .withData(() => testData);

      lazy.inject();
      
      // Wait for immediate loading to complete
      await global.waitForAsync(10);
      
      const scripts = document.querySelectorAll('script[data-ai-seo-type="Product"]');
      assert.strictEqual(scripts.length, 1);
      
      const schema = JSON.parse(scripts[0].textContent);
      assert.strictEqual(schema['@context'], 'https://schema.org');
      assert.strictEqual(schema['@type'], 'Product');
      assert.strictEqual(schema.name, 'Test Product');
      assert.strictEqual(schema.description, 'A test description');
      assert.strictEqual(schema.price, 99.99);
    });

    it('should configure debug mode', async () => {
      const lazy = new LazySchema('Product')
        .loadWhen('immediate')
        .configure({ debug: true });

      assert.strictEqual(lazy.config.debug, true);
      
      // Debug mode should produce formatted JSON
      lazy.inject();
      
      // Wait for immediate loading to complete
      await global.waitForAsync(10);
      
      const scripts = document.querySelectorAll('script[data-ai-seo-type="Product"]');
      const scriptContent = scripts[0].textContent;
      
      // Debug mode produces multi-line JSON
      assert.ok(scriptContent.includes('\n'));
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should cleanup observer and elements', async () => {
      const lazy = new LazySchema('Product')
        .loadWhen('visible');

      const placeholder = lazy.inject();
      
      // Check placeholder exists before IntersectionObserver triggers
      assert.ok(placeholder);
      assert.ok(placeholder.parentNode);
      
      // Cleanup should remove elements and observers
      lazy.cleanup();
      
      assert.strictEqual(lazy.observer, null);
      assert.strictEqual(lazy.element, null);
    });

    it('should prevent duplicate loading', async () => {
      const lazy = new LazySchema('Product')
        .loadWhen('immediate')
        .withData(() => ({ name: 'Duplicate Test' }));

      // Load once
      const result1 = lazy.inject();
      await global.waitForAsync(10);
      
      assert.ok(result1);
      assert.strictEqual(lazy.loaded, true);
      
      // Try to load again
      const result2 = lazy._executeLoad();
      await global.waitForAsync(10);
      
      assert.strictEqual(result2, null); // Should return null as already loaded
      
      // Should still only have one script
      const scripts = document.querySelectorAll('script[data-ai-seo-type="Product"]');
      assert.strictEqual(scripts.length, 1);
    });
  });

  describe('Integration with Performance Monitoring', () => {
    it('should generate unique IDs for lazy-loaded schemas', async () => {
      const lazy1 = new LazySchema('Product').loadWhen('immediate');
      const lazy2 = new LazySchema('Product').loadWhen('immediate');

      const result1 = lazy1.inject();
      
      // Small delay to ensure different timestamps
      await global.waitForAsync(2);
      
      const result2 = lazy2.inject();
      
      // Wait for immediate loading to complete
      await global.waitForAsync(10);
      
      // Check that both results are valid
      assert.ok(result1, 'First lazy schema should inject successfully');
      assert.ok(result2, 'Second lazy schema should inject successfully');
      
      const id1 = result1.getAttribute('data-ai-seo-id');
      const id2 = result2.getAttribute('data-ai-seo-id');
      
      assert.ok(id1, 'First schema should have an ID');
      assert.ok(id2, 'Second schema should have an ID');
      assert.ok(id1.startsWith('lazy-product-'));
      assert.ok(id2.startsWith('lazy-product-'));
      assert.notStrictEqual(id1, id2);
    });
  });
});
