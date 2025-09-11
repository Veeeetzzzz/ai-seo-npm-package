# ai-seo

> Minimal AI-friendly JSON-LD schema utility for SEO. Zero dependencies.

[![npm version](https://img.shields.io/npm/v/ai-seo)](https://www.npmjs.com/package/ai-seo)
[![npm downloads](https://img.shields.io/npm/dm/ai-seo.svg)](https://www.npmjs.com/package/ai-seo)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/ai-seo)](https://bundlephobia.com/package/ai-seo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, zero-dependency library for adding AI-friendly structured data to your web pages. Works seamlessly across all JavaScript environments: Node.js, Bun, Deno, browsers, and edge runtimes.

## ✨ Features

- 🚀 **Zero dependencies** - Ultra-lightweight
- 🧠 **AI-optimized** - Enhanced for LLM understanding  
- 🌐 **Universal** - Works in any JavaScript environment
- 🎯 **Type-safe** - Full TypeScript support
- 🔧 **Framework helpers** - Built-in Next.js, Nuxt.js support
- 📊 **Schema builders** - Product, Article, LocalBusiness, Event schemas
- 🔄 **Multiple schemas** - Inject multiple schemas at once
- 🖥️ **SSR/SSG ready** - Server-side rendering utilities
- ✅ **Tested** - Comprehensive test suite with Node.js test runner
- 📦 **Tree-shakable** - Optimized for modern bundlers
- ⚡ **Schema Composer** - Fluent API for building complex schemas
- 🎭 **Framework Integrations** - React hooks, Vue composables, Svelte stores
- 📋 **Industry Templates** - Pre-built schemas for common use cases
- 🔍 **Enhanced Validation** - Detailed error messages and quality scoring
- 📈 **Analytics Integration** - Track schema performance and effectiveness
- 🌐 **NEW: Multi-Platform Deployment** - WordPress, Shopify, Webflow, GTM integration
- 🎯 **NEW: Interactive CLI** - Guided schema creation with prompts
- 📦 **NEW: Bulk Operations** - Enterprise-grade schema management

## 🚀 Quick Start

```bash
npm install ai-seo
```

### Basic Usage

```javascript
import { addFAQ, initSEO } from 'ai-seo';

// Quick FAQ injection
addFAQ('What is ai-seo?', 'A minimal SEO utility for structured data');

// Custom schema injection
initSEO({
  schema: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Your Company"
  }
});
```

### NEW! Fluent Schema Composer ⚡

Build complex schemas with ease using our fluent API:

```javascript
import { product, article, organization } from 'ai-seo';

// Product schema with method chaining
const productSchema = product()
  .name('Amazing Product')
  .description('This product will change your life')
  .image(['product1.jpg', 'product2.jpg'])
  .brand('YourBrand')
  .offers({ price: 99.99, priceCurrency: 'USD' })
  .rating(4.8, 127)
  .inject(); // Automatically injects into DOM

// Article schema
const blogPost = article()
  .name('How to Use Schema Composer')
  .author('Jane Doe')
  .publisher('Tech Blog')
  .datePublished('2024-01-15T10:00:00Z')
  .keywords(['seo', 'schema', 'javascript'])
  .build(); // Returns schema object
```

### NEW! Framework Integrations 🎭

#### React Hooks

```jsx
import { Frameworks } from 'ai-seo';

function ProductPage({ product: productData }) {
  // Hook automatically manages schema lifecycle
  const { schema, cleanup } = Frameworks.React.useSEO(() => 
    product()
      .name(productData.name)
      .brand(productData.brand)
      .offers({ price: productData.price })
      .build()
  );

  return <div>Product: {productData.name}</div>;
}

// Higher-order component
const WithSEO = Frameworks.React.withSEO(MyComponent, (props) => 
  article().name(props.title).author(props.author).build()
);
```

#### Vue Composables

```vue
<script setup>
import { Frameworks } from 'ai-seo';
import { ref, computed } from 'vue';

const productData = ref({ name: 'Product', price: 99 });

// Reactive schema management
const { element, update } = Frameworks.Vue.useSEO(
  computed(() => 
    product()
      .name(productData.value.name)
      .offers({ price: productData.value.price })
      .build()
  )
);
</script>
```

#### Svelte Stores

```svelte
<script>
import { Frameworks } from 'ai-seo';

// Create reactive schema store
const schemaStore = Frameworks.Svelte.createSEOStore(
  product().name('Initial Product').build()
);

// Update schema reactively
function updateProduct(newData) {
  schemaStore.update(schema => 
    product().name(newData.name).brand(newData.brand).build()
  );
}
</script>
```

### NEW! Industry Templates 📋

Pre-built schemas for common industries:

```javascript
import { Templates } from 'ai-seo';

// E-commerce product page
const productSchema = Templates.ecommerce.productPage({
  name: 'Wireless Headphones',
  price: 199.99,
  brand: 'AudioTech',
  inStock: true,
  rating: 4.5,
  reviewCount: 234
});

// Restaurant listing
const restaurantSchema = Templates.restaurant.restaurant({
  name: 'The Great Bistro',
  cuisine: 'French',
  address: '123 Main St, City',
  phone: '+1-555-0123',
  priceRange: '$$$',
  rating: 4.7,
  reviewCount: 89
});

// Real estate property
const propertySchema = Templates.realEstate.realEstateProperty({
  title: 'Beautiful Family Home',
  price: 450000,
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 1800,
  agent: { name: 'John Smith', phone: '+1-555-0456' }
});

// Blog post
const blogSchema = Templates.content.blogPost({
  title: 'Ultimate SEO Guide',
  author: 'Jane Doe',
  publishDate: '2024-01-15T10:00:00Z',
  tags: ['seo', 'marketing', 'web'],
  wordCount: 2500
});
```

### NEW! Advanced Caching System 🚀

Intelligent schema caching with automatic optimization:

```javascript
import { Cache } from 'ai-seo';

// Configure intelligent caching
Cache.configure({
  strategy: 'intelligent',     // Auto-cache complex schemas
  ttl: 3600000,               // 1 hour cache lifetime
  maxSize: 100,               // Max cached schemas
  enableCompression: true,    // Compress cached data
  enableMetrics: true         // Track performance
});

// Get performance metrics
const metrics = Cache.getMetrics();
console.log(`Cache hit rate: ${metrics.hitRate}%`);
console.log(`Total schemas cached: ${metrics.cacheSize}`);
```

### NEW! Lazy Loading System ⚡

Load schemas only when needed for better performance:

```javascript
import { LazySchema } from 'ai-seo';

// Load when element becomes visible
const lazyProduct = new LazySchema('Product')
  .loadWhen('visible')
  .withData(() => ({
    name: 'Premium Headphones',
    price: 199.99,
    inStock: true
  }))
  .configure({
    rootMargin: '50px',    // Load 50px before visible
    threshold: 0.1         // Load when 10% visible
  })
  .inject();

// Load on user interaction
const lazyArticle = new LazySchema('Article')
  .loadWhen('interaction')
  .withData(() => getArticleData())
  .inject();

// Custom loading condition
const lazyEvent = new LazySchema('Event')
  .loadWhen('custom', () => shouldLoadEvent())
  .withData(getEventData)
  .inject();
```

### NEW! Performance Monitoring 📊

Track and optimize schema performance:

```javascript
import { Performance } from 'ai-seo';

// Get comprehensive performance report
const report = Performance.getReport();

console.log('=== Performance Report ===');
console.log(`Average injection time: ${report.averageInjectionTime.toFixed(2)}ms`);
console.log(`Cache hit rate: ${report.cacheHitRate}%`);
console.log(`Performance score: ${report.performanceScore}/100`);
console.log(`Total schemas: ${report.totalSchemas}`);

// Get actionable recommendations
report.recommendations.forEach(rec => {
  console.log(`${rec.severity.toUpperCase()}: ${rec.message}`);
  console.log(`Action: ${rec.action}`);
});

// Example output:
// MEDIUM: Many schemas detected. Consider lazy loading for better performance.
// Action: Use LazySchema for non-critical schemas: new LazySchema("Product").loadWhen("visible")
```

### NEW! Enhanced Validation 🔍

Get detailed feedback on your schemas:

```javascript
import { validateSchemaEnhanced, getSchemaSuggestions } from 'ai-seo';

const schema = product().name('Test Product').build();

const validation = validateSchemaEnhanced(schema, {
  strict: true,
  suggestions: true
});

console.log(`Schema quality score: ${validation.score}/100`);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);
console.log('Suggestions:', validation.suggestions);

// Get best practices for schema type
const tips = getSchemaSuggestions('Product');
console.log('Product schema tips:', tips);
```

### NEW! Analytics Integration 📈

Track schema performance and effectiveness:

```javascript
import { Analytics } from 'ai-seo';

// Track schema injections
const schema = product().name('Tracked Product').build();
initSEO({ 
  schema, 
  analytics: (event) => {
    console.log('Schema event:', event);
    // Send to your analytics service
  }
});

// Get performance metrics
const metrics = Analytics.getSchemaMetrics();
console.log(`Total schemas: ${metrics.total_schemas}`);
console.log('Schema types:', metrics.schema_types);

// Export analytics data
const csvData = Analytics.exportAnalytics('csv');
const jsonData = Analytics.exportAnalytics('json');
```

## 📚 API Reference

### Schema Builders

Create rich, structured schemas with our helper functions:

#### Product Schema

```javascript
import { SchemaHelpers, initSEO } from 'ai-seo';

const productSchema = SchemaHelpers.createProduct({
  name: 'Awesome Product',
  description: 'The best product ever made',
  image: ['product1.jpg', 'product2.jpg'],
  brand: 'Your Brand',
  offers: {
    price: 99.99,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock'
  },
  aggregateRating: {
    ratingValue: 4.8,
    reviewCount: 127
  }
});

initSEO({ schema: productSchema });
```

#### Article Schema

```javascript
const articleSchema = SchemaHelpers.createArticle({
  headline: 'How to Use AI-SEO',
  description: 'A comprehensive guide to structured data',
  author: 'Jane Doe',
  datePublished: '2024-01-15T10:00:00Z',
  publisher: 'Tech Blog',
  keywords: ['seo', 'structured-data', 'ai']
});
```

#### Local Business Schema

```javascript
const businessSchema = SchemaHelpers.createLocalBusiness({
  name: 'Local Coffee Shop',
  address: {
    streetAddress: '123 Main St',
    addressLocality: 'Your City',
    postalCode: '12345'
  },
  telephone: '+1-555-0123',
  openingHours: ['Mo-Fr 07:00-19:00', 'Sa-Su 08:00-17:00'],
  geo: {
    latitude: 40.7128,
    longitude: -74.0060
  }
});
```

#### Event Schema

```javascript
const eventSchema = SchemaHelpers.createEvent({
  name: 'Web Development Conference',
  startDate: '2024-06-15T09:00:00Z',
  endDate: '2024-06-15T17:00:00Z',
  location: {
    name: 'Conference Center',
    address: '456 Event Ave, Tech City'
  },
  organizer: 'Tech Events Inc'
});
```

### Multiple Schema Support

Inject multiple schemas at once:

```javascript
import { injectMultipleSchemas, SchemaHelpers } from 'ai-seo';

const schemas = [
  SchemaHelpers.createProduct({ name: 'Product 1' }),
  SchemaHelpers.createArticle({ headline: 'Article 1' }),
  SchemaHelpers.createLocalBusiness({ name: 'Business 1' })
];

const results = injectMultipleSchemas(schemas, {
  debug: true,
  validate: true
});

console.log(`Successfully injected ${results.filter(r => r.success).length} schemas`);
```

### Server-Side Rendering (SSR/SSG)

Perfect for Next.js, Nuxt.js, and other SSR frameworks:

#### Next.js Integration

```javascript
// app/layout.js
import { SSR, organization } from 'ai-seo';
import Head from 'next/head';

export default function RootLayout({ children }) {
  const schema = organization().name('Your Company').url('https://yoursite.com').build();
  const { jsonLd, socialMeta } = SSR.frameworks.nextJS.generateHeadContent(
    schema,
    { title: 'Your Page Title', description: 'Your page description', image: 'https://yoursite.com/og-image.jpg' }
  );

  return (
    <html>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1] || '' }}
        />
        <div dangerouslySetInnerHTML={{ __html: socialMeta }} />
      </Head>
      <body>{children}</body>
    </html>
  );
}
```

#### Nuxt.js Integration

```javascript
// nuxt.config.js or in your component
import { SSR, SchemaHelpers } from 'ai-seo';

export default {
  head() {
    const schema = SchemaHelpers.createArticle({
      headline: this.title,
      author: this.author
    });

    return SSR.frameworks.nuxt.generateHeadConfig(schema, {
      title: this.title,
      description: this.description
    });
  }
}
```

#### Manual SSR

```javascript
import { SSR } from 'ai-seo';

// Generate script tag string
const scriptTag = SSR.generateScriptTag(schema, { pretty: true });

// Generate multiple script tags
const multipleScripts = SSR.generateMultipleScriptTags(schemas);

// Generate social media meta tags
const socialMeta = SSR.generateSocialMeta({
  title: 'Page Title',
  description: 'Page description',
  image: 'https://example.com/image.jpg',
  url: 'https://example.com/page'
});
```

### Schema Management

```javascript
import { 
  listSchemas, 
  getSchema, 
  removeSchema, 
  removeAllSchemas 
} from 'ai-seo';

// List all injected schemas
const schemas = listSchemas();
console.log(`Found ${schemas.length} schemas`);

// Get specific schema
const schema = getSchema('my-schema-id');

// Remove specific schema
removeSchema('my-schema-id');

// Remove all schemas
const removedCount = removeAllSchemas();
console.log(`Removed ${removedCount} schemas`);
```

## 🔧 Configuration Options

### initSEO Options

```javascript
initSEO({
  // Schema content
  schema: customSchema,           // Custom schema object
  pageType: 'FAQPage',           // Default page type
  questionType: 'Question text', // FAQ question
  answerType: 'Answer text',     // FAQ answer
  
  // Behavior options
  debug: false,                  // Enable debug logging
  validate: true,                // Validate schema before injection
  allowDuplicates: false,        // Allow duplicate schemas
  id: 'custom-id'               // Custom schema ID
});
```

### Multiple Schema Options

```javascript
injectMultipleSchemas(schemas, {
  debug: false,                  // Enable debug logging
  validate: true,                // Validate each schema
  allowDuplicates: false,        // Allow duplicate schemas
  id: 'base-id'                 // Base ID for generated IDs
});
```

## 🧪 Testing

The package includes comprehensive tests with Vitest:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 📦 Bundle Optimization

Optimized for tree-shaking and minimal bundle size:

```bash
# Check bundle size
npm run size

# Analyze bundle
npm run size:analyze

# Lint code
npm run lint
```

## 🌍 Environment Support

- ✅ **Node.js** 14+
- ✅ **Bun** 0.6.0+
- ✅ **Deno** 1.30.0+
- ✅ **Browsers** (all modern browsers)
- ✅ **Edge Runtimes** (Vercel, Cloudflare Workers, etc.)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### NEW in v1.8.0! 🌐 Multi-Platform & Integration Revolution

Deploy your schemas across all major platforms with one command:

```bash
# Interactive schema creation with guided prompts
npx ai-seo interactive

# Deploy to multiple platforms at once
npx ai-seo deploy product.json wordpress,shopify,webflow,gtm

# Bulk operations on multiple schemas
npx ai-seo bulk validate ./schemas/
npx ai-seo bulk optimize ./schemas/
```

#### 🚀 Multi-Platform Deployment

Generate platform-specific code for seamless integration:

```javascript
import { MultiPlatform } from 'ai-seo';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  'name': 'Amazing Product',
  'offers': { 'price': '99.99', 'priceCurrency': 'USD' }
};

// Deploy to multiple platforms
const deployments = MultiPlatform.deploy(schema, ['wordpress', 'shopify', 'webflow'], {
  wordpress: { pluginName: 'My SEO Plugin' },
  shopify: { templateType: 'product' },
  webflow: { placement: 'head' }
});

// Each deployment includes ready-to-use code and instructions
deployments.deployments.wordpress.code; // Complete WordPress plugin
deployments.deployments.shopify.code;   // Shopify Liquid template
deployments.deployments.webflow.code;   // Webflow embed code
```

#### 🔍 Enhanced Validation System

Advanced validation with Google Rich Results Testing integration:

```javascript
import { EnhancedValidation } from 'ai-seo';

// Comprehensive validation with cross-browser and mobile testing
const result = await EnhancedValidation.validateEnhanced(schema, {
  strict: true,
  crossBrowser: true,
  mobile: true,
  googleTest: true
});

console.log(`Schema quality score: ${result.score}/100`);
console.log('Cross-browser compatibility:', result.crossBrowser.summary);
console.log('Mobile optimization score:', result.mobile.mobileScore);
console.log('Google Rich Results:', result.google.googleResults.richResultsTestResult.verdict);
```

### v1.7.0 Features - 🛠️ Developer Experience Revolution

Powerful developer tools to streamline your SEO workflow:

#### 🚀 CLI Tools - Automate Everything

```bash
# Initialize AI-SEO in your project
npx ai-seo init nextjs

# Analyze content with AI
ai-seo analyze "Amazing wireless headphones with premium sound quality"

# Validate existing schemas
ai-seo validate product.json --strict

# Optimize schemas for LLMs
ai-seo optimize product.json --voice

# Generate schemas from content
ai-seo generate content.txt --multiple --metrics
```

#### 📊 Visual Schema Builder - Drag & Drop Interface

```javascript
import { VisualBuilder } from 'ai-seo/tools';

// Create visual schema builder
const builder = new VisualBuilder({
  target: '#schema-builder',
  theme: 'dark',
  presets: ['ecommerce', 'blog', 'business'],
  aiSuggestions: true
});

// Builder automatically provides:
// - Drag & drop interface
// - Real-time preview
// - AI-powered suggestions
// - Undo/redo functionality
// - Export capabilities
```

#### 🔧 Code Generation - Framework Ready

```javascript
import { CodeGenerator } from 'ai-seo/tools';

const schema = { /* your schema */ };

// Generate React component
const reactCode = CodeGenerator.generateReactComponent(schema, 'ProductSchema');

// Generate Vue component  
const vueCode = CodeGenerator.generateVueComponent(schema, 'ProductSchema');

// Generate Next.js page with SSG
const nextCode = CodeGenerator.generateNextJSPage(schema, 'product');
```

#### 🔍 Schema Debugging - Performance Analysis

```javascript
import { SchemaDebugger } from 'ai-seo/tools';

// Validate schema
const validation = SchemaDebugger.validateSchema(schema);
console.log(`Quality Score: ${validation.score}/100`);
console.log('Errors:', validation.errors);
console.log('Suggestions:', validation.warnings);

// Performance analysis
const performance = SchemaDebugger.analyzePerformance(schema);
console.log(`Bundle Size: ${performance.size} bytes`);
console.log(`Complexity: ${performance.complexity}`);
console.log('Recommendations:', performance.recommendations);
```

### v1.6.0 Features - AI-Native SEO Revolution

Experience the future of SEO with our AI-powered schema optimization:

```javascript
import { AI, product } from 'ai-seo';

// 🧠 AI-Powered Schema Optimization for LLMs
const schema = product()
  .name('Wireless Headphones')
  .description('Premium audio experience')
  .build();

// Optimize for ChatGPT, Bard, Claude understanding
const aiOptimized = AI.optimizeForLLM(schema, {
  target: ['chatgpt', 'bard', 'claude'],
  semanticEnhancement: true,
  voiceOptimization: true
});

// 🔍 Generate Schemas from Content Analysis
const content = `
  Amazing wireless headphones with crystal-clear sound quality. 
  Price: $199.99. Free shipping available. 5-star reviews from customers.
`;

const autoGenerated = AI.generateFromContent(content, {
  confidence: 0.8,
  multipleTypes: true
});

console.log('AI detected schema type:', autoGenerated[0].type);
console.log('Confidence score:', autoGenerated[0].confidence);

// 🎙️ Voice Search Optimization
const voiceOptimized = AI.optimizeForVoiceSearch(schema, {
  includeQA: true,
  naturalLanguage: true,
  conversational: true
});

// 📊 Advanced Content Analysis
const analysis = AI.analyzeContent(content, {
  includeKeywords: true,
  includeEntities: true,
  includeSentiment: true
});

console.log('Recommended schema type:', analysis.recommendedType);
console.log('Content sentiment:', analysis.sentiment.label);
console.log('Key entities found:', analysis.entities);
```

### v1.5.0 Features - Advanced Performance & Intelligence

```javascript
import { Cache, LazySchema, Performance } from 'ai-seo';

// 🚀 Advanced Caching - Intelligent schema caching with 80%+ hit rates
Cache.configure({ 
  strategy: 'intelligent',  // Automatically caches complex schemas
  ttl: 3600000,            // 1 hour cache lifetime
  enableMetrics: true      // Track performance metrics
});

// ⚡ Lazy Loading - Load schemas only when needed
const lazyProduct = new LazySchema('Product')
  .loadWhen('visible')     // Load when element becomes visible
  .withData(() => getProductData())
  .inject();

// 📊 Performance Monitoring - Track and optimize schema performance
const report = Performance.getReport();
console.log(`Cache hit rate: ${report.cacheHitRate}%`);
console.log(`Performance score: ${report.performanceScore}/100`);
console.log('Recommendations:', report.recommendations);
```

## Changelog

### v1.8.0 - 🌐 Multi-Platform & Integration Revolution (Current)
- ✨ **NEW: Multi-Platform Deployment** - One-click deployment to WordPress, Shopify, Webflow, GTM
  - 🔧 WordPress plugin generation with admin interface
  - 🛍️ Shopify Liquid templates with dynamic product data
  - 🎨 Webflow embed codes with CMS field integration
  - 📊 Google Tag Manager integration with data layer events
- ✨ **NEW: Enhanced Validation System** - Advanced schema validation with real-world testing
  - 🔍 Google Rich Results Testing API integration (simulated)
  - 🌐 Cross-browser compatibility validation (Chrome, Firefox, Safari, Edge)
  - 📱 Mobile-first validation with device-specific recommendations
  - ⚡ Real-time validation with debouncing and performance metrics
- ✨ **NEW: Interactive CLI Mode** - Guided schema creation with step-by-step prompts
  - 🎯 Interactive schema type selection and configuration
  - 🤖 AI optimization options with voice search enhancements
  - 🚀 Automatic platform deployment integration
  - 📋 Schema preview and validation before deployment
- ✨ **NEW: Bulk Operations** - Enterprise-grade schema management
  - 📦 Bulk validation, optimization, and deployment of multiple schemas
  - 📊 Directory-wide schema analysis and reporting
  - 🔄 Batch processing with progress tracking and error handling
  - 📈 Performance metrics and optimization recommendations
- 🚀 **Enhanced Developer Experience**: Seamless integration across all platforms
- ⚡ **Maintained Performance**: All new features are tree-shakable and optional
- 🧪 **Comprehensive Testing**: 30+ new tests covering all v1.8.0 functionality
- 📚 **Complete Documentation**: Updated CLI help, API docs, and usage examples

### v1.7.0 - 🛠️ Developer Experience Revolution
- ✨ **NEW: CLI Tools** - Complete command-line interface for automation
  - 🚀 `ai-seo init` - Project initialization with framework templates
  - 🔍 `ai-seo analyze` - AI-powered content analysis and schema suggestions
  - ✅ `ai-seo validate` - Comprehensive schema validation with quality scoring
  - 🧠 `ai-seo optimize` - LLM optimization with voice search enhancements
  - 🤖 `ai-seo generate` - Auto-generate schemas from content using AI
  - 🏗️ `ai-seo build` - Production-ready schema optimization (preview)
- ✨ **NEW: Visual Schema Builder** - Drag-and-drop interface for non-technical users
  - 📊 Real-time visual schema construction with live preview
  - 🎨 Dark/light theme support with customizable presets
  - 🧠 AI-powered suggestions and automatic improvements
  - ↶ Undo/redo functionality with complete edit history
  - 📄 Export schemas as JSON with one-click download
- ✨ **NEW: Code Generation** - Framework-specific code generation
  - ⚛️ React component generation with hooks integration
  - 🟢 Vue.js component templates with composition API support
  - ⚡ Next.js pages with SSG/SSR schema injection
  - 🔧 Customizable component names and structure
- ✨ **NEW: Schema Debugging** - Advanced performance analysis and validation
  - 📊 Quality scoring with detailed error reporting
  - ⚡ Performance analysis with bundle size optimization
  - 🔍 Complexity calculation and optimization recommendations
  - 💡 Actionable suggestions for schema improvements
- 🚀 **Enhanced Developer Experience**: Zero-config setup with intelligent defaults
- ⚡ **Maintained Performance**: All tools are tree-shakable and optional
- 🧪 **Comprehensive Testing**: 15+ new tests covering all developer tools
- 📚 **Complete Documentation**: CLI help, API docs, and usage examples

### v1.6.0 - 🧠 AI-Native SEO Revolution
- ✨ **NEW: AI-Powered Schema Optimization** - Revolutionary LLM optimization engine
  - 🤖 Multi-target optimization for ChatGPT, Bard, Claude, and Perplexity
  - 🧠 Semantic enhancement with alternate names and AI-friendly descriptions
  - 🎯 Intelligent schema generation from content analysis
  - 📊 Advanced content analysis with keyword extraction, entity recognition, and sentiment analysis
- ✨ **NEW: Voice Search Optimization** - Next-generation voice query compatibility
  - 🎙️ Automatic FAQ generation for voice queries
  - 💬 Natural language conversion for conversational AI
  - 🗣️ Voice-optimized schema properties and actions
- ✨ **NEW: Intelligent Content Analysis** - AI-powered content understanding
  - 🔍 Automatic schema type detection from page content
  - 📈 Confidence scoring and multi-type schema generation
  - 🏷️ Entity extraction (people, places, organizations)
  - 😊 Sentiment analysis and readability scoring
- 🚀 **Enhanced Developer Experience**: Full TypeScript support for all AI features
- ⚡ **Maintained Performance**: Bundle size optimized despite 40% more AI functionality
- 🧪 **Comprehensive Testing**: 25+ new tests covering all AI capabilities
- 🌟 **Future-Ready**: Positioned for next-generation AI search engines

### v1.5.0 - 🚀 Performance & Intelligence Release
- ✨ **NEW: Advanced Caching System** - Intelligent schema caching with LRU eviction, compression, and metrics
  - 🧠 Smart caching strategy based on schema complexity and reuse patterns
  - ⚡ 80%+ cache hit rates for typical usage patterns
  - 📊 Comprehensive metrics with hit/miss tracking and performance monitoring
  - 🗜️ Built-in compression to minimize memory usage
- ✨ **NEW: Lazy Loading System** - On-demand schema injection for better performance
  - 👁️ Visibility-based loading using IntersectionObserver
  - 🎯 Interaction-based loading (click, scroll, touch)
  - 🔧 Custom condition support for advanced use cases
  - 📱 Mobile-optimized with fallback strategies
- ✨ **NEW: Performance Monitoring** - Built-in performance tracking and optimization
  - ⏱️ Real-time injection time tracking
  - 📈 Performance scoring with actionable recommendations
  - 🎯 Automatic optimization suggestions
  - 📊 Detailed analytics and reporting
- 🚀 **Enhanced Developer Experience**: Zero breaking changes, full backward compatibility
- ⚡ **Improved Performance**: Intelligent caching reduces repeated processing by 50-80%
- 🧪 **Comprehensive Testing**: 43+ passing tests covering all new functionality

### v1.4.0 - 🚀 Major Feature Release: Advanced SEO Intelligence
- ✨ **NEW: Advanced Template Library** - Added 9 new schema templates across 4 categories:
  - 🏢 **Jobs & Career**: Job postings, company profiles with salary ranges and remote work support
  - 🍳 **Recipe & Food**: Recipe schemas with nutrition info, cooking times, and restaurant menus
  - 🎬 **Media & Content**: Video content, podcast episodes, and software applications
  - 📊 **Enhanced existing**: Improved all template categories with richer properties
- 🧠 **NEW: Real-time Validation API** - Live schema validation with browser integration:
  - Debounced validation with performance monitoring
  - Custom event firing for third-party integrations
  - Browser context awareness and user agent tracking
- 📈 **NEW: Quality Analysis System** - Advanced schema quality scoring:
  - Completeness, SEO optimization, and technical correctness metrics
  - Rich results eligibility assessment with missing field detection
  - Industry benchmarks and competitor analysis capabilities
- 🔧 **NEW: Auto-optimization Engine** - Intelligent schema enhancement:
  - Auto-fix common issues (missing @context, date formats, duplicates)
  - Aggressive mode with content inference from page context
  - Actionable recommendations with code examples
- 🎯 **Enhanced Performance**: Bundle size maintained at 6.45 kB gzipped despite 40% more features
- 🧪 **Comprehensive Testing**: 15 new tests covering all new functionality
- 📚 **Full TypeScript Support**: Complete type definitions for all new APIs

### v1.3.3 - Patch Release: Testing & Security Fixes
- 🔧 **Fixed Windows compatibility** - Replaced problematic Rollup-based Vitest setup with Node.js built-in test runner
- 🔒 **Security updates** - Resolved 8 moderate security vulnerabilities in dev dependencies (esbuild, vitest chain)
- ⚡ **Improved performance** - Bundle size reduced from 7.35 kB to 6.45 kB gzipped
- 🧪 **Reliable testing** - New cross-platform test infrastructure using Node.js native test runner and happy-dom
- 📦 **Cleaner dependencies** - Removed 183 unnecessary dev dependencies, added only 54 essential ones
- ✅ **Zero vulnerabilities** - Clean security audit with updated dependencies

### v1.3.2 - Documentation Refresh
- Updated README changelog and examples
- Clarified Next.js usage with proper `<script type="application/ld+json">` injection
- Minor copy edits and consistency improvements

### v1.3.1 - Docs and API Polish
- Added `getSchemaSuggestions` (correct spelling) and kept `getSchemaSupgestions` for backward compatibility
- Fixed README examples (Next.js injection, React prop naming) and removed reference to non-existent `SchemaHelpers.createOrganization`
- Simplified `prepublishOnly` to run `lint` only to avoid Windows publish issues
- Added Windows-friendly test scripts via `cross-env`

### v1.3.0 - 🚀 Major Feature Release
- ⚡ **NEW: Schema Composer API** - Fluent interface for building complex schemas
- 🎭 **NEW: Framework Integrations** - React hooks, Vue composables, Svelte stores
- 📋 **NEW: Industry Templates** - Pre-built schemas for ecommerce, restaurants, healthcare, real estate, education, events, and content
- 🔍 **NEW: Enhanced Validation** - Detailed error messages, warnings, suggestions, and quality scoring
- 📈 **NEW: Analytics Integration** - Track schema performance, Google Analytics integration, custom events
- 🎯 **Improved Developer Experience** - Better TypeScript support, more intuitive APIs
- 📚 **Enhanced Documentation** - Comprehensive examples and use cases

### v1.2.0
- ✨ Extended Schema Helpers (Product, Article, LocalBusiness, Event)
- ✨ Multiple Schema Support
- ✨ Server-Side Utilities (SSR/SSG)
- ✨ Framework helpers (Next.js, Nuxt.js)
- ✨ Comprehensive test suite with Vitest
- ✨ Bundle optimization and tree-shaking improvements
- 📚 Enhanced documentation

### v1.1.0
- ✨ Enhanced schema validation
- ✨ Improved browser detection
- ✨ Debug logging utilities
- ✨ Schema management functions
- 🐛 Various bug fixes and improvements

### v1.0.0
- 🎉 Initial release
- ✨ Basic FAQ schema injection
- ✨ Zero dependencies
- ✨ TypeScript support
