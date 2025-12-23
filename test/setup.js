// Test setup for Node.js test runner
import { Window } from 'happy-dom';

// Setup DOM environment
const window = new Window();
global.window = window;
global.document = window.document;
global.HTMLScriptElement = window.HTMLScriptElement;
Object.defineProperty(global, 'navigator', {
  value: window.navigator,
  writable: true
});

// Mock IntersectionObserver for lazy loading tests
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observations = new Set();
  }
  
  observe(element) {
    this.observations.add(element);
    // Simulate immediate visibility for testing
    setTimeout(() => {
      if (this.callback && this.observations.has(element)) {
        this.callback([{
          target: element,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: element.getBoundingClientRect ? element.getBoundingClientRect() : {},
          intersectionRect: element.getBoundingClientRect ? element.getBoundingClientRect() : {},
          rootBounds: null,
          time: Date.now()
        }], this);
      }
    }, 0);
  }
  
  unobserve(element) {
    this.observations.delete(element);
  }
  
  disconnect() {
    this.observations.clear();
    this.callback = null;
  }
};

// Make IntersectionObserver available on window
if (typeof window !== 'undefined') {
  window.IntersectionObserver = global.IntersectionObserver;
}

// Helper function for async tests
global.waitForAsync = (ms = 10) => new Promise(resolve => setTimeout(resolve, ms));

// Clean up function for tests
export function cleanupDOM() {
  const existingSchemas = document.querySelectorAll('script[data-ai-seo]');
  existingSchemas.forEach(el => el.remove());
  
  // Clean up lazy loading placeholders
  const placeholders = document.querySelectorAll('[data-lazy-schema]');
  placeholders.forEach(el => el.remove());
} 