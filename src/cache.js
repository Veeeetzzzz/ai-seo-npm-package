// Advanced Caching System for ai-seo v1.5.0
// Extracted for better tree-shaking

export class SchemaCache {
  constructor() {
    this.cache = new Map();
    this.config = {
      strategy: 'intelligent', // 'none', 'basic', 'intelligent'
      ttl: 3600000, // 1 hour default
      maxSize: 50,
      maxEntrySize: 1048576, // 1MB max entry size (v1.10.4)
      enableCompression: true,
      enableMetrics: true
    };
    this.metrics = {
      hits: 0,
      misses: 0,
      compressionSavings: 0,
      averageAccessTime: 0,
      rejectedEntries: 0 // Track entries rejected due to size (v1.10.4)
    };
    this.accessTimes = [];
  }

  configure(options = {}) {
    this.config = { ...this.config, ...options };
    
    // Clear cache if strategy changed to 'none'
    if (this.config.strategy === 'none') {
      this.clear();
    }
    
    // Enforce max size
    if (this.cache.size > this.config.maxSize) {
      this._enforceMaxSize();
    }
  }

  _generateKey(schema, options = {}) {
    // Improved cache key generation for better performance (v1.10.4)
    // Only include essential parts of schema to reduce key computation time
    const keyData = {
      type: schema['@type'],
      // Use a subset of schema for smaller schemas, full for complex ones
      content: this._getSchemaFingerprint(schema),
      options: Object.keys(options).length > 0 ? JSON.stringify(options) : ''
    };
    
    // Simple hash function for cache key
    return this._hash(`${keyData.type}:${keyData.content}:${keyData.options}`);
  }

  _getSchemaFingerprint(schema) {
    // Generate a lightweight fingerprint instead of stringifying entire schema
    const schemaStr = JSON.stringify(schema);
    if (schemaStr.length < 500) {
      return schemaStr;
    }
    // For large schemas, create a fingerprint from key properties
    const fingerprint = {
      t: schema['@type'],
      n: schema.name || '',
      d: schema.description ? schema.description.substring(0, 50) : '',
      l: schemaStr.length
    };
    return JSON.stringify(fingerprint);
  }

  _hash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  _compress(data) {
    if (!this.config.enableCompression) return data;
    
    // Simple compression simulation (in real implementation, use actual compression)
    const original = JSON.stringify(data);
    const compressed = original.replace(/\s+/g, ' ').trim();
    
    if (this.config.enableMetrics) {
      this.metrics.compressionSavings += (original.length - compressed.length);
    }
    
    return compressed;
  }

  _decompress(data) {
    if (!this.config.enableCompression) return data;
    return typeof data === 'string' ? JSON.parse(data) : data;
  }

  _enforceMaxSize() {
    if (this.cache.size <= this.config.maxSize) return;
    
    // LRU eviction: remove oldest entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  _isExpired(entry) {
    if (!this.config.ttl) return false;
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  _recordAccess(hit = true) {
    const accessTime = performance.now();
    
    if (this.config.enableMetrics) {
      if (hit) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }
      
      this.accessTimes.push(accessTime);
      
      // Keep only last 50 access times for better memory efficiency
      // Reduced from 100 to 50 in v1.10.3 for improved performance
      if (this.accessTimes.length > 50) {
        this.accessTimes = this.accessTimes.slice(-50);
      }
      
      // Calculate average only if we have access times
      if (this.accessTimes.length > 0) {
        this.metrics.averageAccessTime = this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length;
      }
    }
  }

  get(schema, options = {}) {
    if (this.config.strategy === 'none') return null;
    
    const startTime = performance.now();
    const key = this._generateKey(schema, options);
    const entry = this.cache.get(key);
    
    if (!entry || this._isExpired(entry)) {
      this._recordAccess(false);
      if (entry) this.cache.delete(key); // Remove expired entry
      return null;
    }
    
    // Update last accessed time
    entry.lastAccessed = Date.now();
    this.cache.set(key, entry);
    
    this._recordAccess(true);
    return this._decompress(entry.data);
  }

  set(schema, options = {}, result) {
    if (this.config.strategy === 'none') return false;
    
    // Check entry size limit before caching (v1.10.4)
    const resultStr = JSON.stringify(result);
    const entrySize = resultStr.length;
    
    if (entrySize > this.config.maxEntrySize) {
      // Entry too large, don't cache
      if (this.config.enableMetrics) {
        this.metrics.rejectedEntries++;
      }
      return false;
    }
    
    const key = this._generateKey(schema, options);
    const compressedData = this._compress(result);
    
    const entry = {
      data: compressedData,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      schemaType: schema['@type'],
      size: entrySize
    };
    
    this.cache.set(key, entry);
    this._enforceMaxSize();
    
    return true;
  }

  clear() {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      compressionSavings: 0,
      averageAccessTime: 0,
      rejectedEntries: 0
    };
    this.accessTimes = [];
  }

  getMetrics() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 
      : 0;
    
    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      maxSize: this.config.maxSize,
      strategy: this.config.strategy,
      totalEntries: this.metrics.hits + this.metrics.misses
    };
  }

  // Intelligent caching strategies
  shouldCache(schema, options = {}) {
    if (this.config.strategy === 'none') return false;
    if (this.config.strategy === 'basic') return true;
    
    // Intelligent strategy: cache based on schema complexity and reuse patterns
    if (this.config.strategy === 'intelligent') {
      const schemaSize = JSON.stringify(schema).length;
      const isComplex = schemaSize > 500; // Cache complex schemas
      const hasMultipleProperties = Object.keys(schema).length > 5;
      const isReusableType = ['Product', 'Article', 'LocalBusiness', 'Event'].includes(schema['@type']);
      
      return isComplex || hasMultipleProperties || isReusableType;
    }
    
    return true;
  }
}

// Global cache instance
const globalSchemaCache = new SchemaCache();

// Cache configuration API
export const Cache = {
  configure: (options) => globalSchemaCache.configure(options),
  clear: () => globalSchemaCache.clear(),
  getMetrics: () => globalSchemaCache.getMetrics(),
  getInstance: () => globalSchemaCache
};

export { globalSchemaCache };
