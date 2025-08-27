import { describe, it } from 'node:test';
import assert from 'node:assert';
import './setup.js';
import { cleanupDOM } from './setup.js';
import { initSEO, addFAQ } from '../index.js';

describe('Quick Tests', () => {
  it('should inject a basic FAQ schema', () => {
    cleanupDOM();
    const result = initSEO({
      questionType: 'What is this?',
      answerType: 'This is a test'
    });

    assert.ok(result instanceof HTMLScriptElement);
    assert.strictEqual(result.type, 'application/ld+json');
    assert.strictEqual(result.getAttribute('data-ai-seo'), 'true');
    
    const schema = JSON.parse(result.textContent);
    assert.strictEqual(schema['@type'], 'FAQPage');
    assert.strictEqual(schema.mainEntity[0].name, 'What is this?');
  });

  it('should inject FAQ with addFAQ helper', () => {
    cleanupDOM();
    const result = addFAQ('Test question?', 'Test answer');
    
    assert.ok(result instanceof HTMLScriptElement);
    const schema = JSON.parse(result.textContent);
    assert.strictEqual(schema['@type'], 'FAQPage');
    assert.strictEqual(schema.mainEntity[0].name, 'Test question?');
    assert.strictEqual(schema.mainEntity[0].acceptedAnswer.text, 'Test answer');
  });
});
