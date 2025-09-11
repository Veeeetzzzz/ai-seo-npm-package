/**
 * AI-SEO Developer Tools - Visual Builder & Utilities
 * V1.8.0 - Multi-Platform & Integration Revolution
 */

import { AI } from '../index.js';

// Visual Schema Builder Class
export class VisualBuilder {
  constructor(options = {}) {
    this.options = {
      target: '#ai-seo-builder',
      theme: 'light',
      presets: ['product', 'article', 'business'],
      autoSave: true,
      realTimePreview: true,
      aiSuggestions: true,
      ...options
    };
    
    this.schema = {
      '@context': 'https://schema.org',
      '@type': 'Thing'
    };
    
    this.history = [];
    this.currentStep = 0;
    this.elements = new Map();
    
    if (typeof window !== 'undefined') {
      this.init();
    }
  }
  
  init() {
    this.createContainer();
    this.setupEventListeners();
    this.loadPresets();
    this.render();
  }
  
  createContainer() {
    const target = document.querySelector(this.options.target);
    if (!target) {
      throw new Error(`Target element not found: ${this.options.target}`);
    }
    
    target.innerHTML = `
      <div class="ai-seo-builder ${this.options.theme}">
        <div class="builder-header">
          <h2>🧠 AI-SEO Visual Builder</h2>
          <div class="builder-controls">
            <button id="undo" disabled>↶ Undo</button>
            <button id="redo" disabled>↷ Redo</button>
            <button id="ai-optimize">🧠 AI Optimize</button>
            <button id="validate">✓ Validate</button>
            <button id="export">📄 Export</button>
          </div>
        </div>
        
        <div class="builder-content">
          <div class="builder-sidebar">
            <div class="presets-section">
              <h3>📋 Presets</h3>
              <div id="presets-list"></div>
            </div>
            
            <div class="properties-section">
              <h3>⚙️ Properties</h3>
              <div id="properties-panel"></div>
            </div>
            
            <div class="ai-suggestions">
              <h3>🧠 AI Suggestions</h3>
              <div id="suggestions-panel"></div>
            </div>
          </div>
          
          <div class="builder-main">
            <div class="schema-canvas">
              <h3>🏗️ Schema Builder</h3>
              <div id="schema-canvas"></div>
            </div>
            
            <div class="preview-panel">
              <h3>👁️ Live Preview</h3>
              <pre id="schema-preview"></pre>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.injectStyles();
  }
  
  injectStyles() {
    if (document.getElementById('ai-seo-builder-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'ai-seo-builder-styles';
    styles.textContent = `
      .ai-seo-builder {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        background: #ffffff;
        min-height: 600px;
      }
      
      .ai-seo-builder.dark {
        background: #1a1a1a;
        border-color: #333;
        color: #ffffff;
      }
      
      .builder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e1e5e9;
        background: #f8f9fa;
      }
      
      .dark .builder-header {
        background: #2a2a2a;
        border-color: #333;
      }
      
      .builder-controls button {
        margin-left: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
      }
      
      .builder-controls button:hover {
        background: #f0f0f0;
      }
      
      .builder-controls button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .builder-content {
        display: flex;
        height: 500px;
      }
      
      .builder-sidebar {
        width: 300px;
        border-right: 1px solid #e1e5e9;
        padding: 1rem;
        overflow-y: auto;
      }
      
      .dark .builder-sidebar {
        border-color: #333;
      }
      
      .builder-main {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .schema-canvas {
        flex: 1;
        padding: 1rem;
        border-bottom: 1px solid #e1e5e9;
      }
      
      .dark .schema-canvas {
        border-color: #333;
      }
      
      .preview-panel {
        height: 200px;
        padding: 1rem;
        background: #f8f9fa;
        overflow-y: auto;
      }
      
      .dark .preview-panel {
        background: #2a2a2a;
      }
      
      #schema-preview {
        margin: 0;
        font-size: 0.85rem;
        color: #666;
        white-space: pre-wrap;
      }
      
      .dark #schema-preview {
        color: #ccc;
      }
      
      .preset-item {
        padding: 0.5rem;
        margin: 0.25rem 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        background: white;
      }
      
      .dark .preset-item {
        background: #333;
        border-color: #555;
        color: #fff;
      }
      
      .preset-item:hover {
        background: #f0f0f0;
      }
      
      .dark .preset-item:hover {
        background: #444;
      }
      
      .property-field {
        margin: 0.5rem 0;
      }
      
      .property-field label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
        font-size: 0.9rem;
      }
      
      .property-field input, .property-field select, .property-field textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
      }
      
      .dark .property-field input, 
      .dark .property-field select, 
      .dark .property-field textarea {
        background: #333;
        border-color: #555;
        color: #fff;
      }
      
      .suggestion-item {
        padding: 0.5rem;
        margin: 0.25rem 0;
        background: #e3f2fd;
        border-radius: 4px;
        font-size: 0.85rem;
        cursor: pointer;
      }
      
      .dark .suggestion-item {
        background: #1e3a8a;
      }
      
      .suggestion-item:hover {
        background: #bbdefb;
      }
      
      .dark .suggestion-item:hover {
        background: #1e40af;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  setupEventListeners() {
    // Control buttons
    document.getElementById('undo')?.addEventListener('click', () => this.undo());
    document.getElementById('redo')?.addEventListener('click', () => this.redo());
    document.getElementById('ai-optimize')?.addEventListener('click', () => this.aiOptimize());
    document.getElementById('validate')?.addEventListener('click', () => this.validate());
    document.getElementById('export')?.addEventListener('click', () => this.export());
  }
  
  loadPresets() {
    const presetsList = document.getElementById('presets-list');
    if (!presetsList) return;
    
    const presets = [
      { id: 'product', name: '📦 Product', description: 'E-commerce product schema' },
      { id: 'article', name: '📰 Article', description: 'Blog post or news article' },
      { id: 'business', name: '🏢 Local Business', description: 'Restaurant, store, or service' },
      { id: 'event', name: '🎭 Event', description: 'Conference, concert, or meeting' },
      { id: 'person', name: '👤 Person', description: 'Individual person profile' },
      { id: 'recipe', name: '🍳 Recipe', description: 'Cooking recipe with ingredients' }
    ];
    
    presets.forEach(preset => {
      const element = document.createElement('div');
      element.className = 'preset-item';
      element.innerHTML = `
        <strong>${preset.name}</strong>
        <div style="font-size: 0.8rem; color: #666;">${preset.description}</div>
      `;
      element.addEventListener('click', () => this.loadPreset(preset.id));
      presetsList.appendChild(element);
    });
  }
  
  loadPreset(presetId) {
    const presets = {
      product: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Product Name',
        'description': 'Product description',
        'brand': 'Brand Name',
        'offers': {
          '@type': 'Offer',
          'price': '99.99',
          'priceCurrency': 'USD'
        }
      },
      article: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Article Title',
        'description': 'Article description',
        'author': 'Author Name',
        'datePublished': new Date().toISOString().split('T')[0]
      },
      business: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': 'Business Name',
        'description': 'Business description',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': '123 Main St',
          'addressLocality': 'City',
          'postalCode': '12345'
        },
        'telephone': '+1-555-0123'
      },
      event: {
        '@context': 'https://schema.org',
        '@type': 'Event',
        'name': 'Event Name',
        'description': 'Event description',
        'startDate': new Date().toISOString(),
        'location': 'Event Location'
      },
      person: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': 'Person Name',
        'description': 'Person description',
        'jobTitle': 'Job Title'
      },
      recipe: {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        'name': 'Recipe Name',
        'description': 'Recipe description',
        'recipeIngredient': ['Ingredient 1', 'Ingredient 2'],
        'recipeInstructions': 'Cooking instructions'
      }
    };
    
    this.schema = presets[presetId] || presets.product;
    this.saveToHistory();
    this.render();
    this.generateAISuggestions();
  }
  
  render() {
    this.renderPropertiesPanel();
    this.renderPreview();
    this.updateControls();
  }
  
  renderPropertiesPanel() {
    const panel = document.getElementById('properties-panel');
    if (!panel) return;
    
    panel.innerHTML = '';
    
    // Schema type selector
    const typeField = this.createField('select', '@type', 'Schema Type', this.schema['@type'], [
      'Product', 'Article', 'LocalBusiness', 'Event', 'Person', 'Recipe', 'Organization'
    ]);
    panel.appendChild(typeField);
    
    // Dynamic fields based on schema type
    const fields = this.getFieldsForType(this.schema['@type']);
    fields.forEach(field => {
      const element = this.createField(
        field.type, 
        field.key, 
        field.label, 
        this.getNestedValue(this.schema, field.key),
        field.options
      );
      panel.appendChild(element);
    });
  }
  
  getFieldsForType(type) {
    const commonFields = [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' }
    ];
    
    const typeFields = {
      Product: [
        { key: 'brand', label: 'Brand', type: 'text' },
        { key: 'offers.price', label: 'Price', type: 'text' },
        { key: 'offers.priceCurrency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP'] }
      ],
      Article: [
        { key: 'author', label: 'Author', type: 'text' },
        { key: 'datePublished', label: 'Published Date', type: 'date' }
      ],
      LocalBusiness: [
        { key: 'address.streetAddress', label: 'Street Address', type: 'text' },
        { key: 'address.addressLocality', label: 'City', type: 'text' },
        { key: 'telephone', label: 'Phone', type: 'text' }
      ],
      Event: [
        { key: 'startDate', label: 'Start Date', type: 'datetime-local' },
        { key: 'location', label: 'Location', type: 'text' }
      ],
      Person: [
        { key: 'jobTitle', label: 'Job Title', type: 'text' }
      ],
      Recipe: [
        { key: 'recipeIngredient', label: 'Ingredients (one per line)', type: 'textarea' },
        { key: 'recipeInstructions', label: 'Instructions', type: 'textarea' }
      ]
    };
    
    return [...commonFields, ...(typeFields[type] || [])];
  }
  
  createField(type, key, label, value, options = []) {
    const field = document.createElement('div');
    field.className = 'property-field';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    field.appendChild(labelElement);
    
    let input;
    
    if (type === 'select') {
      input = document.createElement('select');
      options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        optionElement.selected = option === value;
        input.appendChild(optionElement);
      });
    } else if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
      input.value = Array.isArray(value) ? value.join('\n') : (value || '');
    } else {
      input = document.createElement('input');
      input.type = type;
      input.value = value || '';
    }
    
    input.addEventListener('input', () => {
      this.updateSchemaValue(key, input.value, type);
    });
    
    field.appendChild(input);
    return field;
  }
  
  updateSchemaValue(key, value, type) {
    const keys = key.split('.');
    let current = this.schema;
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Set the value
    const finalKey = keys[keys.length - 1];
    
    if (type === 'textarea' && finalKey === 'recipeIngredient') {
      current[finalKey] = value.split('\n').filter(line => line.trim());
    } else {
      current[finalKey] = value;
    }
    
    this.saveToHistory();
    this.renderPreview();
    
    if (this.options.aiSuggestions) {
      this.debounceAISuggestions();
    }
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  renderPreview() {
    const preview = document.getElementById('schema-preview');
    if (preview) {
      preview.textContent = JSON.stringify(this.schema, null, 2);
    }
  }
  
  saveToHistory() {
    this.history = this.history.slice(0, this.currentStep + 1);
    this.history.push(JSON.parse(JSON.stringify(this.schema)));
    this.currentStep = this.history.length - 1;
    this.updateControls();
  }
  
  updateControls() {
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');
    
    if (undoBtn) undoBtn.disabled = this.currentStep <= 0;
    if (redoBtn) redoBtn.disabled = this.currentStep >= this.history.length - 1;
  }
  
  undo() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.schema = JSON.parse(JSON.stringify(this.history[this.currentStep]));
      this.render();
    }
  }
  
  redo() {
    if (this.currentStep < this.history.length - 1) {
      this.currentStep++;
      this.schema = JSON.parse(JSON.stringify(this.history[this.currentStep]));
      this.render();
    }
  }
  
  async aiOptimize() {
    try {
      const optimized = AI.optimizeForLLM(this.schema, {
        target: ['chatgpt', 'bard', 'claude'],
        semanticEnhancement: true,
        voiceOptimization: true
      });
      
      this.schema = optimized;
      this.saveToHistory();
      this.render();
      this.showNotification('🧠 Schema optimized with AI!', 'success');
    } catch (error) {
      this.showNotification('❌ AI optimization failed: ' + error.message, 'error');
    }
  }
  
  validate() {
    // This would use the validation from the main library
    // For now, show a simple validation
    const requiredFields = ['@context', '@type', 'name'];
    const missing = requiredFields.filter(field => !this.schema[field]);
    
    if (missing.length === 0) {
      this.showNotification('✅ Schema validation passed!', 'success');
    } else {
      this.showNotification(`❌ Missing required fields: ${missing.join(', ')}`, 'error');
    }
  }
  
  export() {
    const dataStr = JSON.stringify(this.schema, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema-${this.schema['@type'].toLowerCase()}-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('📄 Schema exported successfully!', 'success');
  }
  
  debounceAISuggestions() {
    clearTimeout(this.suggestionsTimeout);
    this.suggestionsTimeout = setTimeout(() => {
      this.generateAISuggestions();
    }, 1000);
  }
  
  async generateAISuggestions() {
    if (!this.options.aiSuggestions) return;
    
    const panel = document.getElementById('suggestions-panel');
    if (!panel) return;
    
    panel.innerHTML = '<div style="padding: 0.5rem; color: #666;">🧠 Generating AI suggestions...</div>';
    
    try {
      // Simulate AI suggestions based on schema content
      const suggestions = this.getAISuggestions();
      
      panel.innerHTML = '';
      suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
          <strong>${suggestion.title}</strong>
          <div style="font-size: 0.8rem; margin-top: 0.25rem;">${suggestion.description}</div>
        `;
        item.addEventListener('click', () => {
          suggestion.apply(this.schema);
          this.saveToHistory();
          this.render();
          this.showNotification(`✨ Applied: ${suggestion.title}`, 'success');
        });
        panel.appendChild(item);
      });
      
    } catch (error) {
      panel.innerHTML = '<div style="padding: 0.5rem; color: #999;">No suggestions available</div>';
    }
  }
  
  getAISuggestions() {
    const suggestions = [];
    
    // Add image suggestion if missing
    if (!this.schema.image && ['Product', 'Article', 'Person'].includes(this.schema['@type'])) {
      suggestions.push({
        title: '🖼️ Add Image',
        description: 'Images improve search visibility and click-through rates',
        apply: (schema) => {
          schema.image = 'https://example.com/image.jpg';
        }
      });
    }
    
    // Add rating suggestion for products
    if (this.schema['@type'] === 'Product' && !this.schema.aggregateRating) {
      suggestions.push({
        title: '⭐ Add Ratings',
        description: 'Customer ratings can improve search rankings',
        apply: (schema) => {
          schema.aggregateRating = {
            '@type': 'AggregateRating',
            'ratingValue': '4.5',
            'reviewCount': '127'
          };
        }
      });
    }
    
    // Add FAQ for better voice search
    if (!this.schema.mainEntity) {
      suggestions.push({
        title: '❓ Add FAQ',
        description: 'FAQ sections improve voice search compatibility',
        apply: (schema) => {
          schema.mainEntity = [{
            '@type': 'Question',
            'name': `What is ${schema.name}?`,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': schema.description || `${schema.name} is a great choice.`
            }
          }];
        }
      });
    }
    
    return suggestions;
  }
  
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Code Generation Utilities
export class CodeGenerator {
  static generateReactComponent(schema, componentName = 'SchemaComponent') {
    return `import React from 'react';
import { initSEO } from 'ai-seo';

const ${componentName} = () => {
  React.useEffect(() => {
    const schema = ${JSON.stringify(schema, null, 2)};
    initSEO({ schema });
  }, []);

  return null; // This component just injects the schema
};

export default ${componentName};`;
  }
  
  static generateVueComponent(schema, componentName = 'SchemaComponent') {
    return `<template>
  <!-- This component just injects the schema -->
</template>

<script>
import { initSEO } from 'ai-seo';

export default {
  name: '${componentName}',
  mounted() {
    const schema = ${JSON.stringify(schema, null, 2)};
    initSEO({ schema });
  }
};
</script>`;
  }
  
  static generateNextJSPage(schema, pageName = 'page') {
    return `import { SSR } from 'ai-seo';

export default function ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}() {
  return (
    <div>
      <h1>Your Page Content</h1>
    </div>
  );
}

export async function getStaticProps() {
  const schema = ${JSON.stringify(schema, null, 2)};
  const { jsonLd } = SSR.generateScriptTag(schema);
  
  return {
    props: {
      jsonLd
    }
  };
}`;
  }
}

// Schema Debugging Utilities
export class SchemaDebugger {
  static validateSchema(schema) {
    const errors = [];
    const warnings = [];
    
    // Basic validation
    if (!schema['@context']) {
      errors.push('Missing @context property');
    }
    
    if (!schema['@type']) {
      errors.push('Missing @type property');
    }
    
    if (!schema.name) {
      warnings.push('Missing name property - recommended for better SEO');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 10))
    };
  }
  
  static analyzePerformance(schema) {
    const size = JSON.stringify(schema).length;
    const complexity = this.calculateComplexity(schema);
    
    return {
      size,
      complexity,
      recommendations: this.getPerformanceRecommendations(size, complexity)
    };
  }
  
  static calculateComplexity(obj, depth = 0) {
    if (depth > 10) return 0; // Prevent infinite recursion
    
    let complexity = 1;
    
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        complexity += this.calculateComplexity(obj[key], depth + 1);
      } else {
        complexity += 0.1;
      }
    }
    
    return complexity;
  }
  
  static getPerformanceRecommendations(size, complexity) {
    const recommendations = [];
    
    if (size > 5000) {
      recommendations.push('Schema is quite large - consider lazy loading');
    }
    
    if (complexity > 50) {
      recommendations.push('Schema is complex - consider breaking into multiple schemas');
    }
    
    if (size < 500) {
      recommendations.push('Schema could be enhanced with more properties');
    }
    
    return recommendations;
  }
}

export default {
  VisualBuilder,
  CodeGenerator,
  SchemaDebugger
};
