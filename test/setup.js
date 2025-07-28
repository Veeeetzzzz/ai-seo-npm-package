// Test setup for Vitest
import { beforeEach, afterEach } from 'vitest';

// Mock browser environment
global.document = global.window.document;
global.HTMLScriptElement = global.window.HTMLScriptElement;

// Clean up DOM between tests
beforeEach(() => {
  // Clear any existing schemas
  const existingSchemas = document.querySelectorAll('script[data-ai-seo]');
  existingSchemas.forEach(el => el.remove());
});

afterEach(() => {
  // Clean up after each test
  const existingSchemas = document.querySelectorAll('script[data-ai-seo]');
  existingSchemas.forEach(el => el.remove());
}); 