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
- ✅ **Tested** - Comprehensive test suite with Vitest
- 📦 **Tree-shakable** - Optimized for modern bundlers
- ⚡ **Schema Composer** - Fluent API for building complex schemas
- 🎭 **Framework Integrations** - React hooks, Vue composables, Svelte stores
- 📋 **Industry Templates** - Pre-built schemas for common use cases
- 🔍 **Enhanced Validation** - Detailed error messages and quality scoring
- 📈 **Analytics Integration** - Track schema performance and effectiveness

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

function ProductPage({ product }) {
  // Hook automatically manages schema lifecycle
  const { schema, cleanup } = Frameworks.React.useSEO(() => 
    product()
      .name(product.name)
      .brand(product.brand)
      .offers({ price: product.price })
      .build()
  );

  return <div>Product: {product.name}</div>;
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

### NEW! Enhanced Validation 🔍

Get detailed feedback on your schemas:

```javascript
import { validateSchemaEnhanced, getSchemaSupgestions } from 'ai-seo';

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
const tips = getSchemaSupgestions('Product');
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
// pages/_document.js or app/layout.js
import { SSR, SchemaHelpers } from 'ai-seo';

export default function MyApp() {
  const schema = SchemaHelpers.createOrganization({
    name: 'Your Company',
    url: 'https://yoursite.com'
  });

  const { jsonLd, socialMeta } = SSR.frameworks.nextJS.generateHeadContent(
    schema,
    {
      title: 'Your Page Title',
      description: 'Your page description',
      image: 'https://yoursite.com/og-image.jpg'
    }
  );

  return (
    <Head>
      <div dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div dangerouslySetInnerHTML={{ __html: socialMeta }} />
    </Head>
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

## �� Changelog

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
