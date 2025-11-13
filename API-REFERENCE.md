# AI-SEO API Reference v1.12.0

Complete API documentation for the ai-seo npm package.

---

## Table of Contents

1. [URLSchemaGenerator](#urlschemagenerator)
2. [SchemaTemplates](#schematemplates)
3. [ContentAnalyzer](#contentanalyzer)
4. [SchemaValidator](#schemavalidator)
5. [RelatedSchemaDetector](#relatedschemadetector)
6. [CacheManager](#cachemanager)
7. [RateLimiter](#ratelimiter)
8. [PerformanceMonitor](#performancemonitor)
9. [ConfigManager](#configmanager)
10. [ErrorRecovery](#errorrecovery)
11. [OutputFormatter](#outputformatter)
12. [AI Optimizers](#ai-optimizers)

---

## URLSchemaGenerator

Automatically generate structured data schemas from any URL.

### Methods

#### `generateFromURL(url, options)`

Generate schema from a single URL.

**Parameters:**
- `url` (string) - The URL to scrape and analyze
- `options` (object) - Optional configuration
  - `targetTypes` (string[]) - Hint at expected schema types
  - `includeRelated` (boolean) - Generate related schemas (default: true)
  - `optimizeFor` (string[]) - AI optimizers to apply (['chatgpt', 'voice', etc])
  - `validateWithGoogle` (boolean) - Validate with Google guidelines
  - `useCache` (boolean) - Use caching (default: true)
  - `cache` (CacheManager) - Custom cache instance
  - `cacheTTL` (number) - Cache time-to-live in ms

**Returns:** `Promise<Object>`
```javascript
{
  success: boolean,
  url: string,
  detectedType: string,
  confidence: number,
  schemas: Array<Object>,
  metadata: {
    title: string,
    description: string,
    images: string[],
    existingSchemas: Array
  },
  suggestions: string[],
  validation: Object,
  cached: boolean
}
```

**Example:**
```javascript
const result = await URLSchemaGenerator.generateFromURL('https://example.com/product', {
  optimizeFor: ['chatgpt', 'voice'],
  validateWithGoogle: true
});

console.log(result.schemas); // Generated schemas
console.log(result.detectedType); // 'Product'
console.log(result.confidence); // 0.95
```

#### `generateFromURLs(urls, options)`

Generate schemas from multiple URLs with batch processing.

**Parameters:**
- `urls` (string[]) - Array of URLs to process
- `options` (object) - Optional configuration
  - `concurrency` (number) - Concurrent requests (default: 3)
  - `retryOnFail` (boolean) - Retry failed requests (default: true)
  - `progressCallback` (function) - Progress callback `(url, index, total) => {}`

**Returns:** `Promise<Array<Object>>` - Array of results

**Example:**
```javascript
const urls = ['https://example.com/1', 'https://example.com/2'];
const results = await URLSchemaGenerator.generateFromURLs(urls, {
  concurrency: 5,
  progressCallback: (url, current, total) => {
    console.log(`Processing ${current}/${total}: ${url}`);
  }
});
```

#### `generateFromSitemap(sitemapUrl, options)`

Process URLs from a sitemap.

**Parameters:**
- `sitemapUrl` (string) - URL of the sitemap
- `options` (object) - Processing options (same as generateFromURLs)

**Returns:** `Promise<Array<Object>>`

---

## SchemaTemplates

Pre-built schema templates for various types.

### Methods

#### `create(type, data)`

Create a schema from a template.

**Parameters:**
- `type` (string) - Schema type ('Product', 'Article', 'LocalBusiness', etc.)
- `data` (object) - Data to populate the template

**Returns:** `Object` - Complete schema

**Example:**
```javascript
const product = SchemaTemplates.create('Product', {
  name: 'Wireless Headphones',
  price: '199.99',
  priceCurrency: 'USD',
  brand: 'TechBrand',
  description: 'Premium wireless headphones'
});
```

#### `getTemplate(type)`

Get a base template without data.

**Returns:** `Object` - Template structure

#### `mergeWithTemplate(template, data)`

Merge data with an existing template.

**Returns:** `Object` - Merged schema

#### `getAvailableTemplates()`

Get list of available template types.

**Returns:** `string[]` - Array of template names

---

## ContentAnalyzer

Analyze content for keywords, entities, and insights.

### Methods

#### `analyze(content, options)`

Perform comprehensive content analysis.

**Parameters:**
- `content` (string) - Text content to analyze
- `options` (object) - Analysis options
  - `extractKeywords` (boolean) - Extract keywords (default: true)
  - `maxKeywords` (number) - Maximum keywords to extract (default: 10)
  - `extractEntities` (boolean) - Extract named entities (default: true)
  - `calculateReadability` (boolean) - Calculate readability scores (default: true)
  - `detectRelationships` (boolean) - Detect entity relationships (default: true)

**Returns:** `Object`
```javascript
{
  keywords: Array<{term: string, score: number}>,
  entities: {
    people: string[],
    organizations: string[],
    locations: string[],
    products: string[]
  },
  contentType: string,
  readability: {
    fleschScore: number,
    gradeLevel: number,
    difficulty: string
  },
  metadata: {
    wordCount: number,
    sentenceCount: number,
    avgWordLength: number
  },
  relationships: Array<{from: string, to: string, type: string}>
}
```

**Example:**
```javascript
const analysis = ContentAnalyzer.analyze(`
  Apple Inc. announces new iPhone 15 in Cupertino.
  The device features advanced AI capabilities.
`);

console.log(analysis.keywords); // ['apple', 'iphone', 'ai', ...]
console.log(analysis.entities.organizations); // ['Apple Inc.']
console.log(analysis.entities.locations); // ['Cupertino']
console.log(analysis.contentType); // 'product'
```

#### `detectContentType(content, analysis)`

Detect the type of content.

**Returns:** `string` - Content type ('product', 'recipe', 'event', etc.)

---

## SchemaValidator

Validate schemas with Google Rich Results guidelines.

### Methods

#### `validate(schema, options)`

Validate a schema.

**Parameters:**
- `schema` (object) - Schema to validate
- `options` (object) - Validation options
  - `strict` (boolean) - Strict validation mode
  - `checkGoogleGuidelines` (boolean) - Check Google guidelines (default: true)
  - `suggestFixes` (boolean) - Generate auto-fix suggestions (default: true)

**Returns:** `Object`
```javascript
{
  valid: boolean,
  errors: string[],
  warnings: string[],
  suggestions: string[],
  fixes: Array<{field: string, value: any, reason: string}>,
  score: number  // 0-100
}
```

**Example:**
```javascript
const validation = SchemaValidator.validate(schema, {
  strict: true,
  checkGoogleGuidelines: true
});

if (!validation.valid) {
  console.log('Errors:', validation.errors);
  console.log('Score:', validation.score);
  
  // Apply fixes
  const fixed = SchemaValidator.applyFixes(schema, validation.fixes);
}
```

#### `applyFixes(schema, fixes)`

Apply auto-generated fixes to a schema.

**Returns:** `Object` - Fixed schema

#### `getSummary(results)`

Get human-readable validation summary.

**Returns:** `string`

---

## RelatedSchemaDetector

Detect and generate related schemas.

### Methods

#### `detectRelated(primarySchema, parsed, analysis)`

Detect related schemas.

**Parameters:**
- `primarySchema` (object) - Primary schema
- `parsed` (object) - Parsed HTML content
- `analysis` (object) - Content analysis

**Returns:** `Array<Object>` - Related schemas

**Example:**
```javascript
const related = RelatedSchemaDetector.detectRelated(articleSchema, parsed, analysis);
// Returns: [BreadcrumbList, Person, Organization, WebPage, WebSite]
```

#### `buildRelationships(primarySchema, relatedSchemas)`

Build relationships between schemas.

**Returns:** `Array<Object>` - Schemas with relationships

---

## CacheManager

Intelligent caching system with TTL and storage options.

### Constructor

```javascript
new CacheManager(options)
```

**Options:**
- `ttl` (number) - Time to live in ms (default: 3600000)
- `maxSize` (number) - Max cached items (default: 100)
- `storage` (string) - 'memory' or 'file' (default: 'memory')
- `cacheDir` (string) - Directory for file cache (default: './.cache/ai-seo')
- `enabled` (boolean) - Enable caching (default: true)

### Methods

#### `get(key)`

Get cached value.

**Returns:** Value or null

#### `set(key, value, ttl)`

Set cached value.

**Parameters:**
- `key` (string) - Cache key
- `value` (any) - Value to cache
- `ttl` (number) - Optional custom TTL

#### `delete(key)`

Delete cached value.

#### `clear()`

Clear all cache.

#### `getStats()`

Get cache statistics.

**Returns:**
```javascript
{
  hits: number,
  misses: number,
  sets: number,
  deletes: number,
  evictions: number,
  size: number,
  hitRate: string
}
```

#### `static generateKey(url, options)`

Generate cache key from URL and options.

**Example:**
```javascript
const cache = new CacheManager({ ttl: 3600000, storage: 'file' });

cache.set('key1', { data: 'value' });
const value = cache.get('key1');

console.log(cache.getStats());
// { hits: 1, misses: 0, hitRate: '100.00%' }
```

---

## RateLimiter

Rate limiting with backoff strategies.

### Constructor

```javascript
new RateLimiter(options)
```

**Options:**
- `maxRequests` (number) - Requests per window (default: 10)
- `windowMs` (number) - Time window in ms (default: 60000)
- `strategy` (string) - 'fixed' or 'sliding' (default: 'fixed')
- `backoff` (string) - 'exponential' or 'linear' (default: 'exponential')
- `maxRetries` (number) - Max retry attempts (default: 3)

### Methods

#### `check(url)`

Check if request is allowed.

**Returns:** `Promise<Object>`
```javascript
{
  allowed: boolean,
  wait: number,  // ms to wait if not allowed
  retryAfter: number  // timestamp
}
```

#### `waitFor(url)`

Wait for rate limit availability.

**Returns:** `Promise<void>`

#### `execute(url, fn)`

Execute function with rate limiting.

**Returns:** `Promise<any>` - Function result

#### `enqueue(url, fn)`

Queue request for later execution.

**Returns:** `Promise<any>`

#### `batchProcess(urls, fn, options)`

Batch process with rate limiting.

**Example:**
```javascript
const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });

// Check and wait
const result = await limiter.check('https://example.com');
if (!result.allowed) {
  await new Promise(resolve => setTimeout(resolve, result.wait));
}

// Or use execute (auto-waits)
await limiter.execute('https://example.com', async () => {
  return await fetchData();
});

// Batch processing
const results = await limiter.batchProcess(urls, processURL, {
  concurrency: 3,
  onProgress: (url, current, total) => console.log(`${current}/${total}`)
});
```

---

## PerformanceMonitor

Track and optimize performance metrics.

### Constructor

```javascript
new PerformanceMonitor(options)
```

**Options:**
- `enabled` (boolean) - Enable monitoring (default: true)
- `trackMemory` (boolean) - Track memory usage (default: true)
- `trackTiming` (boolean) - Track timing (default: true)
- `warnThreshold` (number) - Warn threshold in ms (default: 5000)
- `maxEntries` (number) - Max entries to store (default: 1000)

### Methods

#### `start(name, metadata)`

Start tracking an operation.

**Returns:** `string` - Operation ID

#### `end(id)`

End tracking an operation.

**Returns:** `Object` - Performance metrics

#### `measure(name, fn)`

Measure async function execution.

**Returns:** `Promise<any>` - Function result

#### `getStats()`

Get performance statistics.

#### `getSlowest(limit)`

Get slowest operations.

#### `getMostFrequent(limit)`

Get most frequent operations.

#### `getSuggestions()`

Get optimization suggestions.

#### `generateReport()`

Generate formatted performance report.

**Example:**
```javascript
const monitor = new PerformanceMonitor();

// Track manually
const id = monitor.start('fetch-data');
await fetchData();
const metrics = monitor.end(id);
console.log(`Took ${metrics.duration}ms`);

// Or use measure
const result = await monitor.measure('process', async () => {
  return await processData();
});

// Get insights
console.log(monitor.generateReport());
const slowest = monitor.getSlowest(5);
const suggestions = monitor.getSuggestions();
```

---

## ConfigManager

Manage configuration files and settings.

### Constructor

```javascript
new ConfigManager(options)
```

**Options:**
- `configFile` (string) - Config file name (default: '.aiseorc.json')
- `searchPaths` (string[]) - Paths to search for config

### Methods

#### `load(path)`

Load configuration from file.

#### `save(path)`

Save configuration to file.

#### `get(key)`

Get configuration value (supports dot notation).

#### `set(key, value)`

Set configuration value.

#### `validate()`

Validate configuration.

**Returns:** `Object` - `{valid: boolean, errors: string[]}`

#### `export()`

Export configuration.

#### `reset()`

Reset to defaults.

**Example:**
```javascript
const config = new ConfigManager();
config.load(); // Auto-loads .aiseorc.json

const cacheEnabled = config.get('cache.enabled');
config.set('generation.concurrency', 5);

config.save(); // Save changes

const validation = config.validate();
if (!validation.valid) {
  console.log('Config errors:', validation.errors);
}
```

---

## OutputFormatter

Format output in multiple formats.

### Static Methods

#### `toJSON(data, pretty)`

Format to JSON.

#### `toCSV(data)`

Format to CSV.

#### `toHTML(data)`

Format to HTML.

#### `format(data, format, options)`

Auto-format to specified format.

**Example:**
```javascript
const data = [
  { url: 'https://example.com', type: 'Product', score: 95 },
  { url: 'https://example.org', type: 'Article', score: 88 }
];

const json = OutputFormatter.toJSON(data, true);
const csv = OutputFormatter.toCSV(data);
const html = OutputFormatter.toHTML(data);

// Or auto-format
const output = OutputFormatter.format(data, 'csv');
```

---

## ErrorRecovery

Robust error handling and recovery.

### Constructor

```javascript
new ErrorRecovery(options)
```

**Options:**
- `maxRetries` (number) - Max retry attempts (default: 3)
- `initialDelay` (number) - Initial delay in ms (default: 1000)
- `maxDelay` (number) - Max delay in ms (default: 30000)
- `backoffMultiplier` (number) - Backoff multiplier (default: 2)
- `retryableErrors` (string[]) - Error codes to retry

### Methods

#### `retry(fn, options)`

Execute function with retry logic.

#### `batchWithPartialResults(items, fn, options)`

Process batch with partial results.

**Returns:**
```javascript
{
  successful: Array,
  failed: Array,
  total: number,
  successCount: number,
  failureCount: number
}
```

#### `withFallback(fn, fallback)`

Execute with fallback strategy.

#### `createCircuitBreaker(fn, options)`

Create circuit breaker protected function.

**Example:**
```javascript
const recovery = new ErrorRecovery({ maxRetries: 3 });

// Retry with exponential backoff
const result = await recovery.retry(async () => {
  return await fetchFromAPI();
});

// Batch with partial results
const results = await recovery.batchWithPartialResults(urls, async (url) => {
  return await processURL(url);
}, { continueOnError: true });

console.log(`Success: ${results.successCount}/${results.total}`);

// Fallback
const data = await recovery.withFallback(
  async () => await fetchFromAPI(),
  async () => ({ fallback: true })
);
```

---

## AI Optimizers

Optimize schemas for AI search engines.

### `AI.optimizeForLLM(schema, options)`

Optimize schema for large language models.

**Parameters:**
- `schema` (object) - Schema to optimize
- `options` (object)
  - `target` (string[]) - Target platforms (['chatgpt', 'bard', 'claude', 'voice'])
  - `semanticEnhancement` (boolean) - Add semantic properties (default: true)
  - `voiceOptimization` (boolean) - Optimize for voice (default: false)

**Returns:** `Object` - Optimized schema

**Example:**
```javascript
const optimized = AI.optimizeForLLM(schema, {
  target: ['chatgpt', 'voice'],
  semanticEnhancement: true,
  voiceOptimization: true
});
```

---

## Global Functions

### `getCache(options)`
Get global cache instance.

### `getRateLimiter(options)`
Get global rate limiter instance.

### `getPerformanceMonitor(options)`
Get global performance monitor instance.

### `getConfigManager(options)`
Get global config manager instance.

### `getErrorRecovery(options)`
Get global error recovery instance.

### `measure(name, fn)`
Convenience function to measure performance.

### `retry(fn, options)`
Convenience function to retry operations.

---

## Configuration File Format

`.aiseorc.json` example:

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000,
    "storage": "memory"
  },
  "rateLimiting": {
    "enabled": true,
    "maxRequests": 10,
    "windowMs": 60000
  },
  "performance": {
    "enabled": true,
    "trackMemory": true,
    "warnThreshold": 5000
  },
  "generation": {
    "concurrency": 3,
    "retryOnFail": true,
    "maxRetries": 3,
    "useCache": true,
    "optimizeFor": ["chatgpt", "voice"]
  },
  "output": {
    "format": "json",
    "pretty": true
  }
}
```

---

## TypeScript Support

The package includes TypeScript definitions. Import types:

```typescript
import {
  URLSchemaGenerator,
  SchemaTemplates,
  ContentAnalyzer,
  CacheManager,
  RateLimiter
} from 'ai-seo';
```

---

## Error Handling

All async methods return promises. Handle errors:

```javascript
try {
  const result = await URLSchemaGenerator.generateFromURL(url);
  if (!result.success) {
    console.error('Generation failed:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

---

## Best Practices

1. **Use Caching** - Significant performance improvement
2. **Rate Limiting** - Respect server limits
3. **Error Recovery** - Handle network failures gracefully
4. **Performance Monitoring** - Track and optimize bottlenecks
5. **Configuration** - Use config files for team consistency
6. **Validation** - Always validate generated schemas
7. **Batch Processing** - Use batch methods for multiple URLs
8. **AI Optimization** - Optimize for target platforms

---

For more examples and tutorials, see [EXAMPLES.md](./EXAMPLES.md)

For changelog and release notes, see [RELEASE_NOTES_v1.12.0.md](./RELEASE_NOTES_v1.12.0.md)

