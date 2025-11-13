# AI-SEO Examples and Use Cases

Real-world examples demonstrating v1.12.0 features.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Single URL Generation](#single-url-generation)
3. [Batch Processing](#batch-processing)
4. [E-commerce Use Case](#e-commerce-use-case)
5. [Blog/Content Site](#blogcontent-site)
6. [Local Business](#local-business)
7. [Event Management](#event-management)
8. [With Caching](#with-caching)
9. [With Rate Limiting](#with-rate-limiting)
10. [With Error Recovery](#with-error-recovery)
11. [Full Production Setup](#full-production-setup)
12. [CLI Usage](#cli-usage)

---

## Quick Start

```javascript
import { URLSchemaGenerator } from 'ai-seo';

// Generate schema from any URL
const result = await URLSchemaGenerator.generateFromURL('https://example.com/product');

console.log(result.detectedType); // 'Product'
console.log(result.schemas); // Generated schemas
console.log(result.suggestions); // Improvement suggestions
```

---

## Single URL Generation

### Basic Usage

```javascript
import { URLSchemaGenerator } from 'ai-seo';

const url = 'https://mystore.com/products/wireless-headphones';

const result = await URLSchemaGenerator.generateFromURL(url);

if (result.success) {
  console.log('✓ Schema generated successfully');
  console.log(`Type: ${result.detectedType}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  
  // Use the schemas
  result.schemas.forEach(schema => {
    console.log(JSON.stringify(schema, null, 2));
  });
} else {
  console.error('✗ Generation failed:', result.error);
}
```

### With AI Optimization

```javascript
const result = await URLSchemaGenerator.generateFromURL(url, {
  optimizeFor: ['chatgpt', 'voice'],
  validateWithGoogle: true
});

// Schemas are now optimized for ChatGPT and voice search
// And validated against Google Rich Results guidelines
```

### With Validation

```javascript
import { URLSchemaGenerator, SchemaValidator } from 'ai-seo';

const result = await URLSchemaGenerator.generateFromURL(url);

// Validate the generated schema
const validation = SchemaValidator.validate(result.schemas[0]);

console.log(`Validation score: ${validation.score}/100`);

if (!validation.valid) {
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);
  
  // Apply auto-fixes
  const fixed = SchemaValidator.applyFixes(result.schemas[0], validation.fixes);
  console.log('✓ Schema fixed');
}
```

---

## Batch Processing

### Process Multiple URLs

```javascript
import { URLSchemaGenerator } from 'ai-seo';

const urls = [
  'https://mystore.com/products/item1',
  'https://mystore.com/products/item2',
  'https://mystore.com/products/item3',
  // ... more URLs
];

const results = await URLSchemaGenerator.generateFromURLs(urls, {
  concurrency: 5, // Process 5 at a time
  progressCallback: (url, current, total) => {
    console.log(`[${current}/${total}] Processing: ${url}`);
  }
});

// Process results
const successful = results.filter(r => r.success);
const failed = results.filter(r => !r.success);

console.log(`✓ ${successful.length} successful`);
console.log(`✗ ${failed.length} failed`);

// Save results
import fs from 'fs';
fs.writeFileSync('schemas.json', JSON.stringify(successful, null, 2));
```

### From Sitemap

```javascript
const sitemapUrl = 'https://mystore.com/sitemap.xml';

const results = await URLSchemaGenerator.generateFromSitemap(sitemapUrl, {
  concurrency: 3,
  filter: (url) => url.includes('/products/'), // Only product pages
  progressCallback: (url, current, total) => {
    console.log(`Processing ${current}/${total}`);
  }
});
```

---

## E-commerce Use Case

### Complete Product Page Optimization

```javascript
import {
  URLSchemaGenerator,
  SchemaValidator,
  ContentAnalyzer,
  AI
} from 'ai-seo';

async function optimizeProductPage(url) {
  // 1. Generate schema
  const result = await URLSchemaGenerator.generateFromURL(url, {
    targetTypes: ['Product'],
    optimizeFor: ['chatgpt', 'voice']
  });
  
  if (!result.success) {
    throw new Error(`Failed: ${result.error}`);
  }
  
  const productSchema = result.schemas[0];
  
  // 2. Validate
  const validation = SchemaValidator.validate(productSchema, {
    strict: true,
    checkGoogleGuidelines: true
  });
  
  console.log(`Validation score: ${validation.score}/100`);
  
  // 3. Apply fixes if needed
  let finalSchema = productSchema;
  if (validation.fixes.length > 0) {
    finalSchema = SchemaValidator.applyFixes(productSchema, validation.fixes);
    console.log(`✓ Applied ${validation.fixes.length} fixes`);
  }
  
  // 4. Analyze content for keywords
  if (result.metadata.description) {
    const analysis = ContentAnalyzer.analyze(result.metadata.description);
    console.log('Top keywords:', analysis.keywords.slice(0, 5));
    console.log('Detected entities:', analysis.entities);
  }
  
  // 5. Return optimized result
  return {
    schema: finalSchema,
    validation,
    metadata: result.metadata,
    suggestions: result.suggestions
  };
}

// Use it
const optimized = await optimizeProductPage('https://store.com/products/123');
console.log(JSON.stringify(optimized.schema, null, 2));
```

### Bulk Product Import

```javascript
import { URLSchemaGenerator, OutputFormatter } from 'ai-seo';
import fs from 'fs';

async function bulkImportProducts(csvFile) {
  // Read product URLs from CSV
  const urls = fs.readFileSync(csvFile, 'utf-8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.split(',')[0]); // Assuming URL is first column
  
  console.log(`Processing ${urls.length} products...`);
  
  // Generate schemas
  const results = await URLSchemaGenerator.generateFromURLs(urls, {
    concurrency: 5,
    progressCallback: (url, current, total) => {
      process.stdout.write(`\r[${current}/${total}] ${url.substring(0, 50)}...`);
    }
  });
  
  console.log('\n✓ Generation complete');
  
  // Filter successful
  const successful = results.filter(r => r.success);
  
  // Save as JSON
  fs.writeFileSync(
    'product-schemas.json',
    JSON.stringify(successful, null, 2)
  );
  
  // Save as CSV for spreadsheet analysis
  const csvData = successful.map(r => ({
    url: r.url,
    type: r.detectedType,
    confidence: (r.confidence * 100).toFixed(0) + '%',
    name: r.schemas[0]?.name || 'N/A',
    price: r.schemas[0]?.offers?.price || 'N/A'
  }));
  
  fs.writeFileSync(
    'product-summary.csv',
    OutputFormatter.toCSV(csvData)
  );
  
  console.log(`✓ Exported ${successful.length} products`);
  
  return successful;
}

// Use it
await bulkImportProducts('product-urls.csv');
```

---

## Blog/Content Site

### Article Schema Generation

```javascript
import { URLSchemaGenerator, RelatedSchemaDetector } from 'ai-seo';

async function optimizeArticle(url) {
  const result = await URLSchemaGenerator.generateFromURL(url, {
    targetTypes: ['Article', 'BlogPosting'],
    optimizeFor: ['chatgpt']
  });
  
  const articleSchema = result.schemas[0];
  
  // Detect related schemas
  const analysis = ContentAnalyzer.analyze(result.metadata.description || '');
  const related = RelatedSchemaDetector.detectRelated(
    articleSchema,
    result.metadata,
    analysis
  );
  
  console.log('Related schemas:', related.map(s => s['@type']));
  // Might include: BreadcrumbList, Person (author), Organization (publisher), WebPage
  
  return {
    article: articleSchema,
    related,
    breadcrumbs: related.find(s => s['@type'] === 'BreadcrumbList'),
    author: related.find(s => s['@type'] === 'Person'),
    publisher: related.find(s => s['@type'] === 'Organization')
  };
}

// Process all blog posts
const blogUrls = [
  'https://blog.example.com/post-1',
  'https://blog.example.com/post-2',
  // ...
];

for (const url of blogUrls) {
  const optimized = await optimizeArticle(url);
  console.log(`✓ ${url}: ${optimized.article.headline}`);
}
```

---

## Local Business

### Complete Business Profile

```javascript
import { SchemaTemplates, SchemaValidator } from 'ai-seo';

// Create complete local business schema
const business = SchemaTemplates.create('LocalBusiness', {
  name: 'Best Pizza Restaurant',
  description: 'Family-owned Italian restaurant serving authentic pizza',
  telephone: '+1-555-123-4567',
  email: 'info@bestpizza.com',
  address: {
    streetAddress: '123 Main Street',
    addressLocality: 'New York',
    addressRegion: 'NY',
    postalCode: '10001',
    addressCountry: 'US'
  },
  geo: {
    latitude: 40.7589,
    longitude: -73.9851
  },
  openingHours: [
    'Mo-Fr 11:00-22:00',
    'Sa-Su 12:00-23:00'
  ],
  priceRange: '$$',
  servesCuisine: ['Italian', 'Pizza'],
  acceptsReservations: true
});

// Validate
const validation = SchemaValidator.validate(business);

if (validation.score < 80) {
  console.log('Suggestions:', validation.suggestions);
}

// Export
console.log(JSON.stringify(business, null, 2));
```

---

## Event Management

### Generate Event Schemas

```javascript
import { SchemaTemplates } from 'ai-seo';

function createEventSchema(eventData) {
  return SchemaTemplates.create('Event', {
    name: eventData.name,
    description: eventData.description,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    location: {
      name: eventData.venueName,
      address: eventData.address
    },
    organizer: {
      name: eventData.organizerName,
      url: eventData.organizerUrl
    },
    offers: {
      price: eventData.ticketPrice,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: eventData.ticketUrl
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
  });
}

// Create from event data
const event = createEventSchema({
  name: 'Tech Conference 2025',
  description: 'Annual technology conference',
  startDate: '2025-06-15T09:00:00-05:00',
  endDate: '2025-06-17T18:00:00-05:00',
  venueName: 'Convention Center',
  address: {
    streetAddress: '456 Conference Ave',
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '94102'
  },
  organizerName: 'Tech Events Inc',
  organizerUrl: 'https://techevents.com',
  ticketPrice: '299.00',
  ticketUrl: 'https://techevents.com/tickets'
});
```

---

## With Caching

### Enable Caching for Performance

```javascript
import { URLSchemaGenerator, CacheManager } from 'ai-seo';

// Create cache instance
const cache = new CacheManager({
  ttl: 3600000, // 1 hour
  maxSize: 100,
  storage: 'file', // Persists between runs
  cacheDir: './cache'
});

// Use with URL generator
async function generateWithCache(url) {
  const result = await URLSchemaGenerator.generateFromURL(url, {
    cache,
    useCache: true
  });
  
  if (result.cached) {
    console.log('✓ Cache hit! Much faster');
  } else {
    console.log('⟳ Cache miss - generated and cached');
  }
  
  return result;
}

// First call - generates and caches
await generateWithCache('https://example.com');

// Second call - returns from cache instantly
await generateWithCache('https://example.com');

// Check cache stats
console.log(cache.getStats());
// { hits: 1, misses: 1, hitRate: '50.00%' }
```

---

## With Rate Limiting

### Respect Server Limits

```javascript
import { RateLimiter, URLSchemaGenerator } from 'ai-seo';

// Create rate limiter
const limiter = new RateLimiter({
  maxRequests: 10, // 10 requests
  windowMs: 60000  // per minute
});

async function processWithRateLimit(urls) {
  const results = [];
  
  for (const url of urls) {
    // Check rate limit
    const check = await limiter.check(url);
    
    if (!check.allowed) {
      console.log(`Rate limit reached. Waiting ${check.wait}ms...`);
      await new Promise(resolve => setTimeout(resolve, check.wait));
    }
    
    // Process URL
    const result = await URLSchemaGenerator.generateFromURL(url);
    results.push(result);
    
    console.log(`✓ Processed: ${url}`);
  }
  
  return results;
}

// Or use built-in batch processing with rate limiting
const results = await limiter.batchProcess(urls, async (url) => {
  return await URLSchemaGenerator.generateFromURL(url);
}, {
  concurrency: 3,
  onProgress: (url, current, total) => {
    console.log(`[${current}/${total}] ${url}`);
  }
});
```

---

## With Error Recovery

### Handle Network Failures

```javascript
import { ErrorRecovery, URLSchemaGenerator } from 'ai-seo';

// Create error recovery instance
const recovery = new ErrorRecovery({
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2
});

async function generateWithRetry(url) {
  return await recovery.retry(async () => {
    return await URLSchemaGenerator.generateFromURL(url);
  });
}

// Will retry on network errors with exponential backoff
const result = await generateWithRetry('https://example.com');

// Batch with partial results
const results = await recovery.batchWithPartialResults(urls, async (url) => {
  return await URLSchemaGenerator.generateFromURL(url);
}, {
  continueOnError: true
});

console.log(`Success: ${results.successCount}/${results.total}`);
console.log(`Failed URLs:`, results.failed.map(f => f.item));

// Use fallback strategy
const data = await recovery.withFallback(
  async () => await URLSchemaGenerator.generateFromURL(url),
  async () => ({
    success: false,
    fallback: true,
    schemas: []
  })
);
```

---

## Full Production Setup

### Complete Production-Ready Configuration

```javascript
import {
  URLSchemaGenerator,
  CacheManager,
  RateLimiter,
  PerformanceMonitor,
  ErrorRecovery,
  ConfigManager,
  SchemaValidator
} from 'ai-seo';

// Setup configuration
const config = new ConfigManager();
config.load(); // Loads .aiseorc.json

// Setup caching
const cache = new CacheManager({
  ttl: config.get('cache.ttl'),
  storage: config.get('cache.storage'),
  maxSize: 200
});

// Setup rate limiting
const limiter = new RateLimiter({
  maxRequests: config.get('rateLimiting.maxRequests'),
  windowMs: config.get('rateLimiting.windowMs')
});

// Setup performance monitoring
const monitor = new PerformanceMonitor({
  enabled: config.get('performance.enabled'),
  warnThreshold: config.get('performance.warnThreshold')
});

// Setup error recovery
const recovery = new ErrorRecovery({
  maxRetries: config.get('generation.maxRetries')
});

// Production-ready processing function
async function processURL(url) {
  return await monitor.measure('full-process', async () => {
    return await recovery.retry(async () => {
      // Wait for rate limit
      await limiter.waitFor(url);
      
      // Generate schema
      const result = await URLSchemaGenerator.generateFromURL(url, {
        cache,
        useCache: config.get('generation.useCache'),
        optimizeFor: config.get('generation.optimizeFor'),
        validateWithGoogle: true
      });
      
      if (result.success) {
        // Validate
        const validation = SchemaValidator.validate(result.schemas[0]);
        
        if (validation.score < 70) {
          // Apply fixes
          result.schemas[0] = SchemaValidator.applyFixes(
            result.schemas[0],
            validation.fixes
          );
        }
      }
      
      return result;
    });
  });
}

// Process multiple URLs
async function processURLs(urls) {
  console.log(`Processing ${urls.length} URLs...`);
  
  const results = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      const result = await processURL(urls[i]);
      results.push(result);
      console.log(`[${i + 1}/${urls.length}] ✓ ${urls[i]}`);
    } catch (error) {
      console.error(`[${i + 1}/${urls.length}] ✗ ${urls[i]}: ${error.message}`);
      results.push({ success: false, url: urls[i], error: error.message });
    }
  }
  
  // Performance report
  console.log('\n' + monitor.generateReport());
  
  // Cache stats
  console.log('\nCache Stats:', cache.getStats());
  
  // Rate limiter stats
  console.log('\nRate Limiter Stats:', limiter.getStats());
  
  return results;
}

// Run
const urls = [
  'https://example.com/product1',
  'https://example.com/product2',
  // ...
];

const results = await processURLs(urls);

// Save results
import fs from 'fs';
fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
```

---

## CLI Usage

### Command Line Examples

```bash
# Generate from single URL
ai-seo generate-url https://example.com/product

# With options
ai-seo generate-url https://example.com/product \
  --optimize chatgpt,voice \
  --validate \
  --output schema.json

# Batch processing
ai-seo generate-url-batch urls.txt \
  --output-dir ./schemas \
  --concurrency 5 \
  --format json

# From sitemap
ai-seo generate-url-batch https://example.com/sitemap.xml \
  --output-dir ./schemas \
  --filter "/products/" \
  --concurrency 3

# With configuration file
# Create .aiseorc.json first
ai-seo generate-url-batch urls.txt

# Export as CSV
ai-seo generate-url-batch urls.txt --format csv --output results.csv

# Export as HTML report
ai-seo generate-url-batch urls.txt --format html --output report.html
```

---

## Integration Examples

### Express.js API

```javascript
import express from 'express';
import { URLSchemaGenerator, getCache, getRateLimiter } from 'ai-seo';

const app = express();
const cache = getCache();
const limiter = getRateLimiter();

app.get('/api/generate-schema', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }
  
  try {
    // Check rate limit
    const rateCheck = await limiter.check(url);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateCheck.wait
      });
    }
    
    // Generate schema
    const result = await URLSchemaGenerator.generateFromURL(url, {
      cache,
      optimizeFor: ['chatgpt']
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});
```

### Next.js API Route

```javascript
// pages/api/schema.js
import { URLSchemaGenerator } from 'ai-seo';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { url, optimizeFor = [] } = req.body;
  
  try {
    const result = await URLSchemaGenerator.generateFromURL(url, {
      optimizeFor,
      validateWithGoogle: true
    });
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## Testing Examples

### Unit Testing Your Integration

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { URLSchemaGenerator, SchemaValidator } from 'ai-seo';

describe('Schema Generation', () => {
  it('should generate valid product schema', async () => {
    const result = await URLSchemaGenerator.generateFromURL(
      'https://example.com/product'
    );
    
    assert.ok(result.success);
    assert.strictEqual(result.detectedType, 'Product');
    
    // Validate schema
    const validation = SchemaValidator.validate(result.schemas[0]);
    assert.strictEqual(validation.valid, true);
    assert.ok(validation.score > 70);
  });
});
```

---

For complete API documentation, see [API-REFERENCE.md](./API-REFERENCE.md)

For changelog and release notes, see [RELEASE_NOTES_v1.12.0.md](./RELEASE_NOTES_v1.12.0.md)

