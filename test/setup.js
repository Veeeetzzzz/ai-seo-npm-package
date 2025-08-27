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

// Clean up function for tests
export function cleanupDOM() {
  const existingSchemas = document.querySelectorAll('script[data-ai-seo]');
  existingSchemas.forEach(el => el.remove());
} 