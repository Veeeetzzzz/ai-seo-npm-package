// Simple AI-friendly SEO utility with enhanced features

// Global registry to track injected schemas
const schemaRegistry = new Map();

// Advanced Caching System for v1.5.0
class SchemaCache {
  constructor() {
    this.cache = new Map();
    this.config = {
      strategy: 'intelligent', // 'none', 'basic', 'intelligent'
      ttl: 3600000, // 1 hour default
      maxSize: 50,
      enableCompression: true,
      enableMetrics: true
    };
    this.metrics = {
      hits: 0,
      misses: 0,
      compressionSavings: 0,
      averageAccessTime: 0
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
    // Create a stable cache key based on schema content and options
    const keyData = {
      type: schema['@type'],
      content: JSON.stringify(schema),
      options: JSON.stringify(options)
    };
    
    // Simple hash function for cache key
    return this._hash(JSON.stringify(keyData));
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
    this.accessTimes.push(accessTime);
    
    if (this.config.enableMetrics) {
      if (hit) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }
      
      // Keep only last 100 access times for average calculation
      if (this.accessTimes.length > 100) {
        this.accessTimes = this.accessTimes.slice(-100);
      }
      
      this.metrics.averageAccessTime = this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length;
    }
  }

  get(schema, options = {}) {
    if (this.config.strategy === 'none') return null;
    
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
    
    const key = this._generateKey(schema, options);
    const compressedData = this._compress(result);
    
    const entry = {
      data: compressedData,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      schemaType: schema['@type'],
      size: JSON.stringify(result).length
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
      averageAccessTime: 0
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
  shouldCache(schema) {
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

// Lazy Schema Loading System for v1.5.0
export class LazySchema {
  constructor(type = 'Thing') {
    this.schemaType = type;
    this.loadCondition = 'immediate'; // 'immediate', 'visible', 'interaction', 'custom'
    this.dataProvider = null;
    this.element = null;
    this.observer = null;
    this.loaded = false;
    this.config = {
      rootMargin: '50px',
      threshold: 0.1,
      debug: false
    };
  }

  // Configure when to load the schema
  loadWhen(condition, customFn = null) {
    this.loadCondition = condition;
    if (condition === 'custom' && typeof customFn === 'function') {
      this.customCondition = customFn;
    }
    return this;
  }

  // Set data provider function
  withData(dataFn) {
    if (typeof dataFn === 'function') {
      this.dataProvider = dataFn;
    }
    return this;
  }

  // Configure lazy loading options
  configure(options = {}) {
    this.config = { ...this.config, ...options };
    return this;
  }

  // Create placeholder element for visibility tracking
  _createPlaceholder() {
    if (!isBrowserEnvironment()) return null;
    
    const placeholder = document.createElement('div');
    placeholder.setAttribute('data-lazy-schema', 'true');
    placeholder.setAttribute('data-schema-type', this.schemaType);
    placeholder.style.height = '1px';
    placeholder.style.width = '1px';
    placeholder.style.position = 'absolute';
    placeholder.style.top = '0';
    placeholder.style.left = '0';
    placeholder.style.pointerEvents = 'none';
    placeholder.style.opacity = '0';
    
    return placeholder;
  }

  // Load schema immediately
  _loadImmediate() {
    return this._executeLoad();
  }

  // Setup visibility observer
  _setupVisibilityObserver() {
    if (!isBrowserEnvironment() || !window.IntersectionObserver) {
      // Fallback to immediate loading if IntersectionObserver not available
      return this._loadImmediate();
    }

    this.element = this._createPlaceholder();
    if (!this.element) return null;

    document.body.appendChild(this.element);

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loaded) {
          this._executeLoad();
          this.observer.disconnect();
          this.element.remove();
        }
      });
    }, {
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold
    });

    this.observer.observe(this.element);
    return this.element;
  }

  // Setup interaction observer
  _setupInteractionObserver() {
    if (!isBrowserEnvironment()) {
      return this._loadImmediate();
    }

    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    const loadOnInteraction = () => {
      if (!this.loaded) {
        this._executeLoad();
        events.forEach(event => {
          document.removeEventListener(event, loadOnInteraction, { passive: true });
        });
      }
    };

    events.forEach(event => {
      document.addEventListener(event, loadOnInteraction, { passive: true });
    });

    return { type: 'interaction-listener', events };
  }

  // Execute the actual schema loading
  _executeLoad() {
    if (this.loaded) return null;

    try {
      const data = this.dataProvider ? this.dataProvider() : {};
      const schema = this._buildSchema(data);
      
      const result = initSEO({ 
        schema, 
        debug: this.config.debug,
        id: `lazy-${this.schemaType.toLowerCase()}-${Date.now()}`
      });
      
      this.loaded = true;
      
      if (this.config.debug) {
        console.log(`[ai-seo] Lazy loaded ${this.schemaType} schema`);
      }
      
      return result;
    } catch (error) {
      console.error('[ai-seo] Error in lazy schema loading:', error);
      return null;
    }
  }

  // Build schema from data
  _buildSchema(data) {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": this.schemaType
    };

    // Merge with provided data
    return { ...baseSchema, ...data };
  }

  // Custom condition checking
  _checkCustomCondition() {
    if (typeof this.customCondition === 'function') {
      try {
        return this.customCondition();
      } catch (error) {
        console.error('[ai-seo] Error in custom condition:', error);
        return true; // Fallback to loading
      }
    }
    return true;
  }

  // Main injection method
  inject(options = {}) {
    this.config = { ...this.config, ...options };

    switch (this.loadCondition) {
      case 'immediate':
        return this._loadImmediate();
      
      case 'visible':
        return this._setupVisibilityObserver();
      
      case 'interaction':
        return this._setupInteractionObserver();
      
      case 'custom':
        if (this._checkCustomCondition()) {
          return this._loadImmediate();
        }
        return null;
      
      default:
        return this._loadImmediate();
    }
  }

  // Cleanup method
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }
}

// Performance Monitoring System for v1.5.0
export const Performance = {
  metrics: {
    schemaInjections: [],
    averageInjectionTime: 0,
    cacheHitRate: 0,
    totalSchemas: 0,
    performanceScore: 100
  },

  // Record schema injection performance
  recordInjection(duration, fromCache = false, schemaType = 'Unknown') {
    const metric = {
      duration,
      fromCache,
      schemaType,
      timestamp: Date.now()
    };

    this.metrics.schemaInjections.push(metric);
    
    // Keep only last 100 measurements
    if (this.metrics.schemaInjections.length > 100) {
      this.metrics.schemaInjections = this.metrics.schemaInjections.slice(-100);
    }

    this._updateMetrics();
  },

  // Update calculated metrics
  _updateMetrics() {
    const injections = this.metrics.schemaInjections;
    if (injections.length === 0) return;

    // Calculate average injection time
    const totalTime = injections.reduce((sum, m) => sum + m.duration, 0);
    this.metrics.averageInjectionTime = totalTime / injections.length;

    // Calculate cache hit rate
    const cacheHits = injections.filter(m => m.fromCache).length;
    this.metrics.cacheHitRate = (cacheHits / injections.length) * 100;

    // Update total schemas
    this.metrics.totalSchemas = injections.length;

    // Calculate performance score
    this._calculatePerformanceScore();
  },

  // Calculate overall performance score
  _calculatePerformanceScore() {
    let score = 100;
    
    // Deduct points for slow injections
    if (this.metrics.averageInjectionTime > 5) score -= 20;
    else if (this.metrics.averageInjectionTime > 2) score -= 10;
    
    // Add points for good cache hit rate
    if (this.metrics.cacheHitRate > 80) score += 10;
    else if (this.metrics.cacheHitRate < 20) score -= 15;
    
    // Deduct points for too many schemas (performance impact)
    if (this.metrics.totalSchemas > 50) score -= 10;
    
    this.metrics.performanceScore = Math.max(0, Math.min(100, score));
  },

  // Get performance report
  getReport() {
    const report = {
      ...this.metrics,
      recommendations: this._generateRecommendations(),
      timestamp: new Date().toISOString()
    };

    return report;
  },

  // Generate performance recommendations
  _generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.averageInjectionTime > 5) {
      recommendations.push({
        type: 'performance',
        severity: 'high',
        message: 'Schema injection time is slow. Consider enabling caching or reducing schema complexity.',
        action: 'Enable intelligent caching: Cache.configure({ strategy: "intelligent" })'
      });
    }
    
    if (this.metrics.cacheHitRate < 30 && this.metrics.totalSchemas > 10) {
      recommendations.push({
        type: 'caching',
        severity: 'medium',
        message: 'Low cache hit rate detected. Review caching strategy.',
        action: 'Optimize for reusable schemas or increase cache size: Cache.configure({ maxSize: 100 })'
      });
    }
    
    if (this.metrics.totalSchemas > 20) {
      recommendations.push({
        type: 'optimization',
        severity: 'medium',
        message: 'Many schemas detected. Consider lazy loading for better performance.',
        action: 'Use LazySchema for non-critical schemas: new LazySchema("Product").loadWhen("visible")'
      });
    }
    
    if (this.metrics.performanceScore > 90) {
      recommendations.push({
        type: 'success',
        severity: 'info',
        message: 'Excellent performance! Your schema implementation is optimized.',
        action: 'Continue monitoring performance as your application grows.'
      });
    }
    
    return recommendations;
  },

  // Clear performance data
  clear() {
    this.metrics = {
      schemaInjections: [],
      averageInjectionTime: 0,
      cacheHitRate: 0,
      totalSchemas: 0,
      performanceScore: 100
    };
  }
};

// Schema builder helpers for common schema types
export const SchemaHelpers = {
  /**
   * Create a Product schema
   */
  createProduct({
    name,
    description,
    image,
    brand,
    offers = {},
    aggregateRating,
    review,
    sku,
    mpn,
    gtin,
    ...additionalProps
  } = {}) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description,
      ...additionalProps
    };

    if (image) schema.image = Array.isArray(image) ? image : [image];
    if (brand) schema.brand = typeof brand === 'string' ? { "@type": "Brand", name: brand } : brand;
    if (sku) schema.sku = sku;
    if (mpn) schema.mpn = mpn;
    if (gtin) schema.gtin = gtin;
    
    if (offers && Object.keys(offers).length > 0) {
      schema.offers = {
        "@type": "Offer",
        priceCurrency: offers.priceCurrency || "USD",
        price: offers.price,
        availability: offers.availability || "https://schema.org/InStock",
        ...offers
      };
    }

    if (aggregateRating) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
        ...aggregateRating
      };
    }

    if (review) {
      schema.review = Array.isArray(review) ? review.map(r => ({
        "@type": "Review",
        reviewRating: r.rating ? { "@type": "Rating", ratingValue: r.rating } : undefined,
        author: r.author ? { "@type": "Person", name: r.author } : undefined,
        ...r
      })) : [review];
    }

    return schema;
  },

  /**
   * Create an Article schema
   */
  createArticle({
    headline,
    description,
    author,
    datePublished,
    dateModified,
    image,
    publisher,
    url,
    wordCount,
    articleSection,
    keywords,
    ...additionalProps
  } = {}) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline,
      description,
      ...additionalProps
    };

    if (author) {
      schema.author = typeof author === 'string' 
        ? { "@type": "Person", name: author }
        : author;
    }

    if (datePublished) schema.datePublished = datePublished;
    if (dateModified) schema.dateModified = dateModified;
    if (image) schema.image = Array.isArray(image) ? image : [image];
    if (url) schema.url = url;
    if (wordCount) schema.wordCount = wordCount;
    if (articleSection) schema.articleSection = articleSection;
    if (keywords) schema.keywords = Array.isArray(keywords) ? keywords : [keywords];

    if (publisher) {
      schema.publisher = typeof publisher === 'string'
        ? { "@type": "Organization", name: publisher }
        : publisher;
    }

    return schema;
  },

  /**
   * Create a LocalBusiness schema
   */
  createLocalBusiness({
    name,
    description,
    address,
    telephone,
    openingHours,
    url,
    image,
    priceRange,
    aggregateRating,
    geo,
    businessType = "LocalBusiness",
    ...additionalProps
  } = {}) {
    const schema = {
      "@context": "https://schema.org",
      "@type": businessType,
      name,
      description,
      ...additionalProps
    };

    if (address) {
      schema.address = typeof address === 'string'
        ? { "@type": "PostalAddress", streetAddress: address }
        : { "@type": "PostalAddress", ...address };
    }

    if (telephone) schema.telephone = telephone;
    if (url) schema.url = url;
    if (image) schema.image = Array.isArray(image) ? image : [image];
    if (priceRange) schema.priceRange = priceRange;
    
    if (openingHours) {
      schema.openingHours = Array.isArray(openingHours) ? openingHours : [openingHours];
    }

    if (aggregateRating) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
        ...aggregateRating
      };
    }

    if (geo) {
      schema.geo = {
        "@type": "GeoCoordinates",
        latitude: geo.latitude,
        longitude: geo.longitude,
        ...geo
      };
    }

    return schema;
  },

  /**
   * Create an Event schema
   */
  createEvent({
    name,
    description,
    startDate,
    endDate,
    location,
    organizer,
    offers,
    image,
    url,
    eventStatus = "https://schema.org/EventScheduled",
    eventAttendanceMode = "https://schema.org/OfflineEventAttendanceMode",
    ...additionalProps
  } = {}) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name,
      description,
      startDate,
      eventStatus,
      eventAttendanceMode,
      ...additionalProps
    };

    if (endDate) schema.endDate = endDate;
    if (url) schema.url = url;
    if (image) schema.image = Array.isArray(image) ? image : [image];

    if (location) {
      if (typeof location === 'string') {
        schema.location = {
          "@type": "Place",
          name: location
        };
      } else if (location.address || location.geo) {
        schema.location = {
          "@type": "Place",
          name: location.name,
          address: location.address ? {
            "@type": "PostalAddress",
            ...(typeof location.address === 'string' 
              ? { streetAddress: location.address } 
              : location.address)
          } : undefined,
          geo: location.geo ? {
            "@type": "GeoCoordinates",
            latitude: location.geo.latitude,
            longitude: location.geo.longitude
          } : undefined,
          ...location
        };
      } else {
        schema.location = { "@type": "Place", ...location };
      }
    }

    if (organizer) {
      schema.organizer = typeof organizer === 'string'
        ? { "@type": "Organization", name: organizer }
        : organizer;
    }

    if (offers) {
      schema.offers = Array.isArray(offers) ? offers.map(offer => ({
        "@type": "Offer",
        priceCurrency: offer.priceCurrency || "USD",
        ...offer
      })) : {
        "@type": "Offer",
        priceCurrency: offers.priceCurrency || "USD",
        ...offers
      };
    }

    return schema;
  }
};

// Schema Composer API - Fluent interface for complex schema building
export class SchemaComposer {
  constructor(type = 'Thing') {
    this.schema = {
      "@context": "https://schema.org",
      "@type": type
    };
  }

  // Core properties
  name(value) {
    this.schema.name = value;
    return this;
  }

  description(value) {
    this.schema.description = value;
    return this;
  }

  url(value) {
    this.schema.url = value;
    return this;
  }

  image(value) {
    this.schema.image = Array.isArray(value) ? value : [value];
    return this;
  }

  // Organization/Business specific
  address(value) {
    if (typeof value === 'string') {
      this.schema.address = { "@type": "PostalAddress", streetAddress: value };
    } else {
      this.schema.address = { "@type": "PostalAddress", ...value };
    }
    return this;
  }

  telephone(value) {
    this.schema.telephone = value;
    return this;
  }

  email(value) {
    this.schema.email = value;
    return this;
  }

  // Product specific
  brand(value) {
    this.schema.brand = typeof value === 'string' 
      ? { "@type": "Brand", name: value } 
      : value;
    return this;
  }

  offers(priceOptions) {
    if (Array.isArray(priceOptions)) {
      this.schema.offers = priceOptions.map(offer => ({
        "@type": "Offer",
        priceCurrency: offer.priceCurrency || "USD",
        ...offer
      }));
    } else {
      this.schema.offers = {
        "@type": "Offer",
        priceCurrency: priceOptions.priceCurrency || "USD",
        ...priceOptions
      };
    }
    return this;
  }

  // Article specific
  author(value) {
    this.schema.author = typeof value === 'string'
      ? { "@type": "Person", name: value }
      : value;
    return this;
  }

  publisher(value) {
    this.schema.publisher = typeof value === 'string'
      ? { "@type": "Organization", name: value }
      : value;
    return this;
  }

  datePublished(value) {
    this.schema.datePublished = value;
    return this;
  }

  dateModified(value) {
    this.schema.dateModified = value;
    return this;
  }

  keywords(value) {
    this.schema.keywords = Array.isArray(value) ? value : [value];
    return this;
  }

  // Event specific
  startDate(value) {
    this.schema.startDate = value;
    return this;
  }

  endDate(value) {
    this.schema.endDate = value;
    return this;
  }

  location(value) {
    if (typeof value === 'string') {
      this.schema.location = { "@type": "Place", name: value };
    } else {
      this.schema.location = { "@type": "Place", ...value };
    }
    return this;
  }

  organizer(value) {
    this.schema.organizer = typeof value === 'string'
      ? { "@type": "Organization", name: value }
      : value;
    return this;
  }

  // Rating and reviews
  rating(ratingValue, reviewCount, bestRating = 5, worstRating = 1) {
    this.schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
      bestRating,
      worstRating
    };
    return this;
  }

  review(reviewData) {
    if (!this.schema.review) this.schema.review = [];
    
    const reviews = Array.isArray(reviewData) ? reviewData : [reviewData];
    this.schema.review.push(...reviews.map(review => ({
      "@type": "Review",
      reviewRating: review.rating ? { "@type": "Rating", ratingValue: review.rating } : undefined,
      author: review.author ? { "@type": "Person", name: review.author } : undefined,
      ...review
    })));
    return this;
  }

  // Geographic coordinates
  geo(latitude, longitude) {
    this.schema.geo = {
      "@type": "GeoCoordinates",
      latitude,
      longitude
    };
    return this;
  }

  // Opening hours for businesses
  openingHours(hours) {
    this.schema.openingHours = Array.isArray(hours) ? hours : [hours];
    return this;
  }

  // Price range
  priceRange(range) {
    this.schema.priceRange = range;
    return this;
  }

  // Custom properties
  addProperty(key, value) {
    this.schema[key] = value;
    return this;
  }

  // Merge with another schema
  merge(otherSchema) {
    this.schema = { ...this.schema, ...otherSchema };
    return this;
  }

  // Build and return the schema
  build() {
    return { ...this.schema };
  }

  // Build and inject into DOM
  inject(options = {}) {
    const schema = this.build();
    return initSEO({ schema, ...options });
  }
}

// Convenience factory functions
export const createSchema = (type) => new SchemaComposer(type);
export const product = () => new SchemaComposer('Product');
export const article = () => new SchemaComposer('Article');
export const organization = () => new SchemaComposer('Organization');
export const localBusiness = (businessType = 'LocalBusiness') => new SchemaComposer(businessType);
export const event = () => new SchemaComposer('Event');
export const person = () => new SchemaComposer('Person');
export const website = () => new SchemaComposer('WebSite');
export const webpage = () => new SchemaComposer('WebPage');

// Framework Integrations
export const Frameworks = {
  /**
   * React Hooks
   */
  React: {
    // Hook for managing single schema
    useSEO: (schemaOrFunction) => {
      // Note: In real React environment, this would use actual React hooks
      // This is a compatible interface that works in any environment
      let currentSchema = null;
      let cleanup = null;

      const updateSchema = () => {
        // Clean up previous schema
        if (cleanup) cleanup();
        
        // Get new schema
        const schema = typeof schemaOrFunction === 'function' 
          ? schemaOrFunction() 
          : schemaOrFunction;
        
        if (schema) {
          const element = initSEO({ schema });
          if (element) {
            cleanup = () => {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            };
            currentSchema = schema;
          }
        }
      };

      // Initial setup
      updateSchema();

      return {
        schema: currentSchema,
        update: updateSchema,
        cleanup: () => cleanup && cleanup()
      };
    },

    // Hook for managing multiple schemas
    useMultipleSEO: (schemasOrFunction) => {
      let currentElements = [];
      let cleanup = null;

      const updateSchemas = () => {
        // Clean up previous schemas
        if (cleanup) cleanup();
        
        const schemas = typeof schemasOrFunction === 'function'
          ? schemasOrFunction()
          : schemasOrFunction;
        
        if (schemas && schemas.length > 0) {
          const results = injectMultipleSchemas(schemas);
          currentElements = results.filter(r => r.success).map(r => r.element);
          
          cleanup = () => {
            currentElements.forEach(el => {
              if (el && el.parentNode) {
                el.parentNode.removeChild(el);
              }
            });
            currentElements = [];
          };
        }
      };

      updateSchemas();

      return {
        elements: currentElements,
        update: updateSchemas,
        cleanup: () => cleanup && cleanup()
      };
    },

    // HOC for easy schema injection
    withSEO: (Component, schemaOrFunction) => {
      return (props) => {
        const schema = typeof schemaOrFunction === 'function'
          ? schemaOrFunction(props)
          : schemaOrFunction;
        
        if (schema) {
          initSEO({ schema });
        }
        
        return Component(props);
      };
    }
  },

  /**
   * Vue Composables
   */
  Vue: {
    // Composable for managing single schema
    useSEO: (schemaOrRef, options = {}) => {
      let currentElement = null;
      let cleanup = null;

      const updateSchema = () => {
        if (cleanup) cleanup();
        
        const schema = typeof schemaOrRef === 'function'
          ? schemaOrRef()
          : (schemaOrRef?.value || schemaOrRef);
        
        if (schema) {
          const element = initSEO({ schema, ...options });
          if (element) {
            currentElement = element;
            cleanup = () => {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            };
          }
        }
      };

      updateSchema();

      return {
        element: currentElement,
        update: updateSchema,
        cleanup: () => cleanup && cleanup()
      };
    },

    // Composable for multiple schemas
    useMultipleSEO: (schemasOrRef, options = {}) => {
      let currentElements = [];
      let cleanup = null;

      const updateSchemas = () => {
        if (cleanup) cleanup();
        
        const schemas = typeof schemasOrRef === 'function'
          ? schemasOrRef()
          : (schemasOrRef?.value || schemasOrRef);
        
        if (schemas && schemas.length > 0) {
          const results = injectMultipleSchemas(schemas, options);
          currentElements = results.filter(r => r.success).map(r => r.element);
          
          cleanup = () => {
            currentElements.forEach(el => {
              if (el && el.parentNode) {
                el.parentNode.removeChild(el);
              }
            });
            currentElements = [];
          };
        }
      };

      updateSchemas();

      return {
        elements: currentElements,
        update: updateSchemas,
        cleanup: () => cleanup && cleanup()
      };
    }
  },

  /**
   * Svelte Stores
   */
  Svelte: {
    // Schema store
    createSEOStore: (initialSchema = null) => {
      const subscribers = [];
      let currentSchema = initialSchema;
      let currentElement = null;

      const subscribe = (callback) => {
        subscribers.push(callback);
        callback(currentSchema);
        
        return () => {
          const index = subscribers.indexOf(callback);
          if (index > -1) subscribers.splice(index, 1);
        };
      };

      const set = (schema) => {
        // Clean up previous
        if (currentElement && currentElement.parentNode) {
          currentElement.parentNode.removeChild(currentElement);
        }
        
        currentSchema = schema;
        
        // Inject new schema
        if (schema) {
          currentElement = initSEO({ schema });
        }
        
        // Notify subscribers
        subscribers.forEach(callback => callback(currentSchema));
      };

      const update = (updater) => {
        set(updater(currentSchema));
      };

      // Initial injection
      if (initialSchema) {
        currentElement = initSEO({ schema: initialSchema });
      }

      return {
        subscribe,
        set,
        update,
        get: () => currentSchema
      };
    },

    // Multiple schemas store
    createMultipleSEOStore: (initialSchemas = []) => {
      const subscribers = [];
      let currentSchemas = initialSchemas;
      let currentElements = [];

      const subscribe = (callback) => {
        subscribers.push(callback);
        callback(currentSchemas);
        
        return () => {
          const index = subscribers.indexOf(callback);
          if (index > -1) subscribers.splice(index, 1);
        };
      };

      const set = (schemas) => {
        // Clean up previous
        currentElements.forEach(el => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
        
        currentSchemas = schemas;
        
        // Inject new schemas
        if (schemas && schemas.length > 0) {
          const results = injectMultipleSchemas(schemas);
          currentElements = results.filter(r => r.success).map(r => r.element);
        } else {
          currentElements = [];
        }
        
        // Notify subscribers
        subscribers.forEach(callback => callback(currentSchemas));
      };

      const update = (updater) => {
        set(updater(currentSchemas));
      };

      // Initial injection
      if (initialSchemas.length > 0) {
        const results = injectMultipleSchemas(initialSchemas);
        currentElements = results.filter(r => r.success).map(r => r.element);
      }

      return {
        subscribe,
        set,
        update,
        get: () => currentSchemas
      };
    }
  }
};

// Schema Templates - Pre-built templates for common industries
export const Templates = {
  /**
   * E-commerce Templates
   */
  ecommerce: {
    // Product listing page
    productPage: (productData) => {
      return product()
        .name(productData.name)
        .description(productData.description)
        .image(productData.images || productData.image)
        .brand(productData.brand)
        .offers({
          price: productData.price,
          priceCurrency: productData.currency || 'USD',
          availability: productData.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: productData.seller
        })
        .rating(productData.rating, productData.reviewCount)
        .addProperty('sku', productData.sku)
        .addProperty('gtin', productData.gtin || productData.upc)
        .build();
    },

    // Online store
    onlineStore: (storeData) => {
      return organization()
        .name(storeData.name)
        .description(storeData.description)
        .url(storeData.website)
        .email(storeData.email)
        .telephone(storeData.phone)
        .addProperty('@type', 'OnlineStore')
        .addProperty('paymentAccepted', storeData.paymentMethods || ['Credit Card', 'PayPal'])
        .addProperty('currenciesAccepted', storeData.currencies || ['USD'])
        .build();
    }
  },

  /**
   * Restaurant & Food Service Templates
   */
  restaurant: {
    // Restaurant listing
    restaurant: (restaurantData) => {
      return localBusiness('Restaurant')
        .name(restaurantData.name)
        .description(restaurantData.description)
        .address(restaurantData.address)
        .telephone(restaurantData.phone)
        .url(restaurantData.website)
        .openingHours(restaurantData.hours)
        .priceRange(restaurantData.priceRange || '$$')
        .rating(restaurantData.rating, restaurantData.reviewCount)
        .geo(restaurantData.latitude, restaurantData.longitude)
        .addProperty('servesCuisine', restaurantData.cuisine)
        .addProperty('acceptsReservations', restaurantData.acceptsReservations || true)
        .build();
    },

    // Menu item
    menuItem: (itemData) => {
      return createSchema('MenuItem')
        .name(itemData.name)
        .description(itemData.description)
        .image(itemData.image)
        .offers({
          price: itemData.price,
          priceCurrency: itemData.currency || 'USD'
        })
        .addProperty('nutrition', itemData.nutrition)
        .addProperty('suitableForDiet', itemData.dietaryRestrictions)
        .build();
    }
  },

  /**
   * Healthcare Templates
   */
  healthcare: {
    // Medical practice
    medicalOrganization: (practiceData) => {
      return localBusiness('MedicalOrganization')
        .name(practiceData.name)
        .description(practiceData.description)
        .address(practiceData.address)
        .telephone(practiceData.phone)
        .url(practiceData.website)
        .openingHours(practiceData.hours)
        .addProperty('medicalSpecialty', practiceData.specialties)
        .addProperty('acceptedInsurance', practiceData.insurance)
        .build();
    },

    // Healthcare provider
    physician: (doctorData) => {
      return person()
        .name(doctorData.name)
        .addProperty('@type', 'Physician')
        .addProperty('medicalSpecialty', doctorData.specialties)
        .addProperty('affiliation', doctorData.hospital)
        .addProperty('alumniOf', doctorData.education)
        .addProperty('availableService', doctorData.services)
        .build();
    }
  },

  /**
   * Real Estate Templates
   */
  realEstate: {
    // Property listing
    realEstateProperty: (propertyData) => {
      return createSchema('RealEstateListing')
        .name(propertyData.title)
        .description(propertyData.description)
        .image(propertyData.images)
        .address(propertyData.address)
        .addProperty('listingAgent', {
          '@type': 'RealEstateAgent',
          name: propertyData.agent.name,
          telephone: propertyData.agent.phone
        })
        .addProperty('price', {
          '@type': 'PriceSpecification',
          price: propertyData.price,
          priceCurrency: propertyData.currency || 'USD'
        })
        .addProperty('numberOfRooms', propertyData.bedrooms)
        .addProperty('numberOfBathroomsTotal', propertyData.bathrooms)
        .addProperty('floorSize', propertyData.squareFeet)
        .build();
    },

    // Real estate agency
    realEstateAgency: (agencyData) => {
      return localBusiness('RealEstateAgent')
        .name(agencyData.name)
        .description(agencyData.description)
        .address(agencyData.address)
        .telephone(agencyData.phone)
        .url(agencyData.website)
        .email(agencyData.email)
        .addProperty('areaServed', agencyData.serviceAreas)
        .build();
    }
  },

  /**
   * Education Templates
   */
  education: {
    // Educational institution
    school: (schoolData) => {
      return organization()
        .name(schoolData.name)
        .description(schoolData.description)
        .address(schoolData.address)
        .telephone(schoolData.phone)
        .url(schoolData.website)
        .addProperty('@type', 'EducationalOrganization')
        .addProperty('foundingDate', schoolData.founded)
        .addProperty('numberOfStudents', schoolData.enrollment)
        .build();
    },

    // Online course
    course: (courseData) => {
      return createSchema('Course')
        .name(courseData.title)
        .description(courseData.description)
        .addProperty('provider', {
          '@type': 'Organization',
          name: courseData.provider
        })
        .addProperty('courseCode', courseData.code)
        .addProperty('educationalLevel', courseData.level)
        .addProperty('timeRequired', courseData.duration)
        .offers({
          price: courseData.price || 0,
          priceCurrency: courseData.currency || 'USD'
        })
        .build();
    }
  },

  /**
   * Professional Services Templates
   */
  professional: {
    // Law firm
    lawFirm: (firmData) => {
      return localBusiness('LegalService')
        .name(firmData.name)
        .description(firmData.description)
        .address(firmData.address)
        .telephone(firmData.phone)
        .url(firmData.website)
        .email(firmData.email)
        .addProperty('areaOfLaw', firmData.practiceAreas)
        .addProperty('jurisdiction', firmData.jurisdictions)
        .build();
    },

    // Consulting firm
    consultingFirm: (firmData) => {
      return localBusiness('ProfessionalService')
        .name(firmData.name)
        .description(firmData.description)
        .address(firmData.address)
        .telephone(firmData.phone)
        .url(firmData.website)
        .email(firmData.email)
        .addProperty('serviceType', firmData.services)
        .addProperty('areaServed', firmData.serviceAreas)
        .build();
    }
  },

  /**
   * Event Templates
   */
  events: {
    // Conference
    conference: (eventData) => {
      return event()
        .name(eventData.name)
        .description(eventData.description)
        .startDate(eventData.startDate)
        .endDate(eventData.endDate)
        .location({
          name: eventData.venue,
          address: eventData.address
        })
        .organizer(eventData.organizer)
        .offers({
          price: eventData.ticketPrice,
          priceCurrency: eventData.currency || 'USD',
          url: eventData.ticketUrl
        })
        .addProperty('eventAttendanceMode', 
          eventData.isVirtual ? 'https://schema.org/OnlineEventAttendanceMode' : 
          'https://schema.org/OfflineEventAttendanceMode')
        .build();
    },

    // Workshop
    workshop: (workshopData) => {
      return event()
        .name(workshopData.name)
        .description(workshopData.description)
        .startDate(workshopData.startDate)
        .endDate(workshopData.endDate)
        .location(workshopData.location)
        .organizer(workshopData.instructor)
        .addProperty('maximumAttendeeCapacity', workshopData.maxAttendees)
        .addProperty('educationalLevel', workshopData.level)
        .offers({
          price: workshopData.price,
          priceCurrency: workshopData.currency || 'USD'
        })
        .build();
    }
  },

  /**
   * Job & Career Templates
   */
  jobs: {
    // Job posting
    jobPosting: (jobData) => {
      return createSchema('JobPosting')
        .name(jobData.title)
        .description(jobData.description)
        .addProperty('datePosted', jobData.datePosted || new Date().toISOString())
        .addProperty('validThrough', jobData.validThrough)
        .addProperty('employmentType', jobData.employmentType || 'FULL_TIME')
        .addProperty('hiringOrganization', {
          '@type': 'Organization',
          name: jobData.company,
          sameAs: jobData.companyWebsite,
          logo: jobData.companyLogo
        })
        .addProperty('jobLocation', {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            streetAddress: jobData.location?.address,
            addressLocality: jobData.location?.city,
            addressRegion: jobData.location?.state,
            postalCode: jobData.location?.zipCode,
            addressCountry: jobData.location?.country || 'US'
          }
        })
        .addProperty('baseSalary', jobData.salary ? {
          '@type': 'MonetaryAmount',
          currency: jobData.salary.currency || 'USD',
          value: {
            '@type': 'QuantitativeValue',
            minValue: jobData.salary.min,
            maxValue: jobData.salary.max,
            unitText: jobData.salary.period || 'YEAR'
          }
        } : undefined)
        .addProperty('workFromHome', jobData.remote)
        .addProperty('qualifications', jobData.requirements)
        .addProperty('responsibilities', jobData.responsibilities)
        .addProperty('skills', jobData.skills)
        .addProperty('benefits', jobData.benefits)
        .addProperty('industry', jobData.industry)
        .addProperty('occupationalCategory', jobData.category)
        .build();
    },

    // Company profile
    company: (companyData) => {
      return organization()
        .name(companyData.name)
        .description(companyData.description)
        .url(companyData.website)
        .address(companyData.address)
        .telephone(companyData.phone)
        .email(companyData.email)
        .addProperty('logo', companyData.logo)
        .addProperty('foundingDate', companyData.founded)
        .addProperty('numberOfEmployees', companyData.employeeCount)
        .addProperty('industry', companyData.industry)
        .addProperty('slogan', companyData.slogan)
        .addProperty('awards', companyData.awards)
        .build();
    }
  },

  /**
   * Recipe & Food Templates
   */
  recipe: {
    // Recipe schema
    recipe: (recipeData) => {
      return createSchema('Recipe')
        .name(recipeData.name)
        .description(recipeData.description)
        .image(recipeData.images)
        .author(recipeData.author)
        .datePublished(recipeData.datePublished)
        .addProperty('recipeYield', recipeData.servings)
        .addProperty('prepTime', recipeData.prepTime) // ISO 8601 duration
        .addProperty('cookTime', recipeData.cookTime)
        .addProperty('totalTime', recipeData.totalTime)
        .addProperty('recipeCategory', recipeData.category)
        .addProperty('recipeCuisine', recipeData.cuisine)
        .addProperty('keywords', recipeData.keywords)
        .addProperty('recipeIngredient', recipeData.ingredients)
        .addProperty('recipeInstructions', recipeData.instructions?.map(step => ({
          '@type': 'HowToStep',
          text: step.text,
          image: step.image,
          name: step.name
        })))
        .addProperty('nutrition', recipeData.nutrition ? {
          '@type': 'NutritionInformation',
          calories: recipeData.nutrition.calories,
          proteinContent: recipeData.nutrition.protein,
          fatContent: recipeData.nutrition.fat,
          carbohydrateContent: recipeData.nutrition.carbs,
          fiberContent: recipeData.nutrition.fiber,
          sugarContent: recipeData.nutrition.sugar,
          sodiumContent: recipeData.nutrition.sodium
        } : undefined)
        .rating(recipeData.rating, recipeData.reviewCount)
        .addProperty('video', recipeData.videoUrl ? {
          '@type': 'VideoObject',
          name: recipeData.name,
          description: recipeData.description,
          contentUrl: recipeData.videoUrl,
          thumbnailUrl: recipeData.videoThumbnail
        } : undefined)
        .build();
    },

    // Restaurant menu
    menu: (menuData) => {
      const menuSections = menuData.sections?.map(section => ({
        '@type': 'MenuSection',
        name: section.name,
        description: section.description,
        hasMenuItem: section.items?.map(item => ({
          '@type': 'MenuItem',
          name: item.name,
          description: item.description,
          offers: {
            '@type': 'Offer',
            price: item.price,
            priceCurrency: item.currency || 'USD'
          },
          nutrition: item.nutrition,
          suitableForDiet: item.dietaryRestrictions
        }))
      }));

      return createSchema('Menu')
        .name(menuData.name)
        .description(menuData.description)
        .addProperty('hasMenuSection', menuSections)
        .addProperty('provider', {
          '@type': 'Restaurant',
          name: menuData.restaurant
        })
        .build();
    }
  },

  /**
   * Media & Content Templates
   */
  media: {
    // Video content
    video: (videoData) => {
      return createSchema('VideoObject')
        .name(videoData.title)
        .description(videoData.description)
        .addProperty('contentUrl', videoData.videoUrl)
        .addProperty('embedUrl', videoData.embedUrl)
        .addProperty('thumbnailUrl', videoData.thumbnail)
        .addProperty('uploadDate', videoData.uploadDate)
        .addProperty('duration', videoData.duration) // ISO 8601 duration
        .addProperty('contentRating', videoData.rating)
        .addProperty('genre', videoData.genre)
        .addProperty('keywords', videoData.tags)
        .addProperty('creator', {
          '@type': 'Person',
          name: videoData.creator,
          url: videoData.creatorUrl
        })
        .addProperty('publisher', {
          '@type': 'Organization',
          name: videoData.publisher,
          logo: videoData.publisherLogo
        })
        .addProperty('interactionStatistic', [
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/WatchAction',
            userInteractionCount: videoData.viewCount
          },
          {
            '@type': 'InteractionCounter', 
            interactionType: 'https://schema.org/LikeAction',
            userInteractionCount: videoData.likeCount
          }
        ])
        .build();
    },

    // Podcast episode
    podcast: (episodeData) => {
      return createSchema('PodcastEpisode')
        .name(episodeData.title)
        .description(episodeData.description)
        .url(episodeData.url)
        .addProperty('episodeNumber', episodeData.episodeNumber)
        .addProperty('seasonNumber', episodeData.seasonNumber)
        .addProperty('datePublished', episodeData.publishDate)
        .addProperty('duration', episodeData.duration)
        .addProperty('associatedMedia', {
          '@type': 'MediaObject',
          contentUrl: episodeData.audioUrl,
          encodingFormat: episodeData.audioFormat || 'audio/mpeg'
        })
        .addProperty('partOfSeries', {
          '@type': 'PodcastSeries',
          name: episodeData.podcastName,
          url: episodeData.podcastUrl
        })
        .addProperty('creator', episodeData.hosts?.map(host => ({
          '@type': 'Person',
          name: host.name,
          url: host.url
        })))
        .addProperty('keywords', episodeData.tags)
        .build();
    },

    // Software application
    software: (appData) => {
      return createSchema('SoftwareApplication')
        .name(appData.name)
        .description(appData.description)
        .url(appData.website)
        .image(appData.screenshots)
        .addProperty('applicationCategory', appData.category)
        .addProperty('applicationSubCategory', appData.subcategory)
        .addProperty('operatingSystem', appData.operatingSystems)
        .addProperty('softwareVersion', appData.version)
        .addProperty('datePublished', appData.releaseDate)
        .addProperty('fileSize', appData.fileSize)
        .addProperty('downloadUrl', appData.downloadUrl)
        .addProperty('installUrl', appData.installUrl)
        .rating(appData.rating, appData.reviewCount)
        .offers({
          price: appData.price || 0,
          priceCurrency: appData.currency || 'USD'
        })
        .addProperty('author', {
          '@type': 'Organization',
          name: appData.developer,
          url: appData.developerUrl
        })
        .addProperty('permissions', appData.permissions)
        .addProperty('requirements', appData.systemRequirements)
        .build();
    }
  },

  /**
   * Blog & Content Templates
   */
  content: {
    // Blog post
    blogPost: (postData) => {
      return article()
        .name(postData.title)
        .description(postData.excerpt)
        .author(postData.author)
        .publisher(postData.publisher || postData.website)
        .datePublished(postData.publishDate)
        .dateModified(postData.modifiedDate)
        .keywords(postData.tags)
        .image(postData.featuredImage)
        .url(postData.url)
        .addProperty('@type', 'BlogPosting')
        .addProperty('wordCount', postData.wordCount)
        .build();
    },

    // FAQ page
    faqPage: (faqData) => {
      const mainEntity = faqData.questions.map(qa => ({
        '@type': 'Question',
        name: qa.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: qa.answer
        }
      }));

      return createSchema('FAQPage')
        .name(faqData.title)
        .description(faqData.description)
        .addProperty('mainEntity', mainEntity)
        .build();
    }
  }
};

// Multiple schema injection support
export function injectMultipleSchemas(schemas = [], options = {}) {
  const { debug = false, validate = true, allowDuplicates = false } = options;
  
  if (!Array.isArray(schemas) || schemas.length === 0) {
    debugLog('No schemas provided or invalid schemas array', 'warn', debug);
    return [];
  }

  const results = [];
  
  for (let i = 0; i < schemas.length; i++) {
    const schema = schemas[i];
    const schemaOptions = {
      schema,
      debug,
      validate,
      allowDuplicates,
      id: options.id ? `${options.id}-${i}` : null,
      ...options
    };
    
    const result = initSEO(schemaOptions);
    results.push({
      schema,
      element: result,
      success: result !== null,
      index: i
    });
  }
  
  debugLog(`Injected ${results.filter(r => r.success).length}/${schemas.length} schemas`, 'info', debug);
  return results;
}

// Server-Side Rendering (SSR/SSG) utilities
export const SSR = {
  /**
   * Generate JSON-LD script tag string for server-side rendering
   */
  generateScriptTag(schema, options = {}) {
    const { pretty = false, id = null, dataAttributes = {} } = options;
    
    if (!schema || typeof schema !== 'object') {
      throw new Error('Invalid schema provided');
    }

    const jsonString = JSON.stringify(schema, null, pretty ? 2 : 0);
    const attributes = Object.entries({
      'type': 'application/ld+json',
      'data-ai-seo': 'true',
      'data-ai-seo-type': schema['@type'],
      ...(id && { 'data-ai-seo-id': id }),
      ...dataAttributes
    }).map(([key, value]) => `${key}="${value}"`).join(' ');

    return `<script ${attributes}>${jsonString}</script>`;
  },

  /**
   * Generate multiple JSON-LD script tags
   */
  generateMultipleScriptTags(schemas, options = {}) {
    if (!Array.isArray(schemas)) {
      throw new Error('Schemas must be an array');
    }

    return schemas.map((schema, index) => {
      const scriptOptions = {
        ...options,
        id: options.id ? `${options.id}-${index}` : null
      };
      return this.generateScriptTag(schema, scriptOptions);
    }).join(options.pretty ? '\n' : '');
  },

  /**
   * Generate schema-only JSON string (useful for Next.js, Nuxt, etc.)
   */
  generateJSONString(schema, pretty = false) {
    if (!schema || typeof schema !== 'object') {
      throw new Error('Invalid schema provided');
    }
    return JSON.stringify(schema, null, pretty ? 2 : 0);
  },

  /**
   * Generate head meta tags for social sharing (Open Graph, Twitter)
   */
  generateSocialMeta(data = {}) {
    const { title, description, image, url, type = 'website', siteName } = data;
    const tags = [];

    // Open Graph tags
    if (title) tags.push(`<meta property="og:title" content="${title}" />`);
    if (description) tags.push(`<meta property="og:description" content="${description}" />`);
    if (image) tags.push(`<meta property="og:image" content="${image}" />`);
    if (url) tags.push(`<meta property="og:url" content="${url}" />`);
    if (type) tags.push(`<meta property="og:type" content="${type}" />`);
    if (siteName) tags.push(`<meta property="og:site_name" content="${siteName}" />`);

    // Twitter tags
    if (title) tags.push(`<meta name="twitter:title" content="${title}" />`);
    if (description) tags.push(`<meta name="twitter:description" content="${description}" />`);
    if (image) tags.push(`<meta name="twitter:image" content="${image}" />`);
    tags.push(`<meta name="twitter:card" content="summary_large_image" />`);

    return tags.join('\n');
  },

  /**
   * Framework-specific helpers
   */
  frameworks: {
    /**
     * Next.js Head component helper
     */
    nextJS: {
      generateHeadContent(schema, socialMeta = {}) {
        const scriptTag = SSR.generateScriptTag(schema, { pretty: true });
        const socialTags = Object.keys(socialMeta).length > 0 
          ? SSR.generateSocialMeta(socialMeta) 
          : '';
        
        return {
          jsonLd: scriptTag,
          socialMeta: socialTags,
          combined: [scriptTag, socialTags].filter(Boolean).join('\n')
        };
      }
    },

    /**
     * Nuxt.js helper
     */
    nuxt: {
      generateHeadConfig(schema, socialMeta = {}) {
        const scriptContent = SSR.generateJSONString(schema);
        const headConfig = {
          script: [{
            type: 'application/ld+json',
            innerHTML: scriptContent
          }]
        };

        if (Object.keys(socialMeta).length > 0) {
          headConfig.meta = [];
          const { title, description, image, url, type = 'website', siteName } = socialMeta;
          
          if (title) {
            headConfig.meta.push(
              { property: 'og:title', content: title },
              { name: 'twitter:title', content: title }
            );
          }
          if (description) {
            headConfig.meta.push(
              { property: 'og:description', content: description },
              { name: 'twitter:description', content: description }
            );
          }
          if (image) {
            headConfig.meta.push(
              { property: 'og:image', content: image },
              { name: 'twitter:image', content: image }
            );
          }
          if (url) headConfig.meta.push({ property: 'og:url', content: url });
          if (type) headConfig.meta.push({ property: 'og:type', content: type });
          if (siteName) headConfig.meta.push({ property: 'og:site_name', content: siteName });
          headConfig.meta.push({ name: 'twitter:card', content: 'summary_large_image' });
        }

        return headConfig;
      }
    }
  }
};

// Basic schema validation
function validateSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return { valid: false, error: 'Schema must be a valid object' };
  }
  
  if (!schema['@context']) {
    return { valid: false, error: 'Schema missing @context property' };
  }
  
  if (!schema['@type']) {
    return { valid: false, error: 'Schema missing @type property' };
  }
  
  return { valid: true };
}

// Real-time validation API for browser environments
export function validateSchemaRealtime(schema, options = {}) {
  const { 
    live = true, 
    callback = null, 
    debounceMs = 300,
    includeSuggestions = true 
  } = options;
  
  if (!isBrowserEnvironment()) {
    return validateSchemaEnhanced(schema, options);
  }
  
  let validationTimeout;
  
  const performValidation = () => {
    const result = validateSchemaEnhanced(schema, {
      strict: true,
      suggestions: includeSuggestions
    });
    
    // Add real-time specific enhancements
    result.timestamp = new Date().toISOString();
    result.validationType = 'realtime';
    result.browserContext = {
      userAgent: navigator.userAgent.substring(0, 100),
      url: window.location.href,
      timestamp: Date.now()
    };
    
    // Performance measurement
    const startTime = performance.now();
    const endTime = performance.now();
    result.validationTime = endTime - startTime;
    
    // Trigger callback if provided
    if (callback && typeof callback === 'function') {
      callback(result);
    }
    
    // Fire custom event for other listeners
    if (window.dispatchEvent) {
      const event = new CustomEvent('ai-seo-validation', {
        detail: { schema, result }
      });
      window.dispatchEvent(event);
    }
    
    return result;
  };
  
  if (live && debounceMs > 0) {
    // Debounced real-time validation
    return new Promise((resolve) => {
      clearTimeout(validationTimeout);
      validationTimeout = setTimeout(() => {
        resolve(performValidation());
      }, debounceMs);
    });
  }
  
  return performValidation();
}

// Schema quality analyzer with actionable insights
export function analyzeSchemaQuality(schema, options = {}) {
  const { 
    includeCompetitorAnalysis = false,
    includePerformanceMetrics = true,
    includeSEOImpact = true 
  } = options;
  
  const validation = validateSchemaEnhanced(schema, { strict: true, suggestions: true });
  const analysis = {
    ...validation,
    qualityMetrics: {
      completeness: calculateSchemaCompleteness(schema),
      seoOptimization: calculateSEOOptimization(schema),
      technicalCorrectness: validation.score,
      richResultsEligibility: assessRichResultsEligibility(schema)
    },
    recommendations: generateActionableRecommendations(schema, validation),
    benchmarks: generateSchemaBenchmarks(schema)
  };
  
  if (includePerformanceMetrics && isBrowserEnvironment()) {
    analysis.performanceMetrics = {
      schemaSize: JSON.stringify(schema).length,
      compressionRatio: estimateCompressionRatio(schema),
      loadImpact: estimateLoadImpact(schema)
    };
  }
  
  if (includeSEOImpact) {
    analysis.seoImpact = {
      richResultsScore: calculateRichResultsScore(schema),
      searchVisibilityScore: calculateSearchVisibilityScore(schema),
      competitorAdvantage: includeCompetitorAnalysis ? analyzeCompetitorAdvantage(schema) : null
    };
  }
  
  return analysis;
}

// Schema optimization suggestions with auto-fix capabilities
export function optimizeSchema(schema, options = {}) {
  const { autoFix = false, aggressive = false } = options;
  
  const analysis = analyzeSchemaQuality(schema);
  const optimizations = [];
  const optimizedSchema = { ...schema };
  
  // Auto-fix common issues
  if (autoFix) {
    // Fix missing required properties
    if (!optimizedSchema['@context']) {
      optimizedSchema['@context'] = 'https://schema.org';
      optimizations.push({
        type: 'fix',
        property: '@context',
        action: 'added',
        reason: 'Required property was missing'
      });
    }
    
    // Optimize image arrays
    if (optimizedSchema.image && Array.isArray(optimizedSchema.image)) {
      // Remove duplicates
      const uniqueImages = [...new Set(optimizedSchema.image)];
      if (uniqueImages.length !== optimizedSchema.image.length) {
        optimizedSchema.image = uniqueImages;
        optimizations.push({
          type: 'optimization',
          property: 'image',
          action: 'deduplicated',
          reason: 'Removed duplicate images'
        });
      }
    }
    
    // Fix date formats
    ['datePublished', 'dateModified', 'startDate', 'endDate'].forEach(dateField => {
      if (optimizedSchema[dateField] && typeof optimizedSchema[dateField] === 'string') {
        const date = new Date(optimizedSchema[dateField]);
        if (!isNaN(date.getTime())) {
          const isoDate = date.toISOString();
          if (optimizedSchema[dateField] !== isoDate) {
            optimizedSchema[dateField] = isoDate;
            optimizations.push({
              type: 'fix',
              property: dateField,
              action: 'formatted',
              reason: 'Converted to ISO 8601 format'
            });
          }
        }
      }
    });
    
    // Add missing structured data enhancements
    if (aggressive) {
      // Add publisher for articles if missing
      if (optimizedSchema['@type'] === 'Article' && !optimizedSchema.publisher) {
        if (isBrowserEnvironment()) {
          optimizedSchema.publisher = {
            '@type': 'Organization',
            name: document.title || 'Website',
            url: window.location.origin
          };
          optimizations.push({
            type: 'enhancement',
            property: 'publisher',
            action: 'inferred',
            reason: 'Added publisher from page context'
          });
        }
      }
      
      // Add breadcrumb context for products
      if (optimizedSchema['@type'] === 'Product' && !optimizedSchema.category) {
        // Try to infer from page URL or content
        if (isBrowserEnvironment()) {
          const pathSegments = window.location.pathname.split('/').filter(Boolean);
          if (pathSegments.length > 1) {
            optimizedSchema.category = pathSegments[pathSegments.length - 2];
            optimizations.push({
              type: 'enhancement',
              property: 'category',
              action: 'inferred',
              reason: 'Inferred category from URL structure'
            });
          }
        }
      }
    }
  }
  
  return {
    original: schema,
    optimized: optimizedSchema,
    optimizations,
    qualityImprovement: {
      scoreImprovement: calculateSchemaScore(optimizedSchema, [], []) - analysis.score,
      issuesFixed: optimizations.filter(opt => opt.type === 'fix').length,
      enhancementsAdded: optimizations.filter(opt => opt.type === 'enhancement').length
    },
    recommendations: analysis.recommendations.filter(rec => 
      !optimizations.some(opt => opt.property === rec.property)
    )
  };
}

// Enhanced schema validation with detailed feedback
export function validateSchemaEnhanced(schema, options = {}) {
  const { strict = false, suggestions = true } = options;
  const errors = [];
  const warnings = [];
  const tips = [];

  // Basic structure validation
  if (!schema || typeof schema !== 'object') {
    return {
      valid: false,
      errors: ['Schema must be a valid object'],
      warnings: [],
      suggestions: suggestions ? ['Ensure you pass a valid JavaScript object as the schema'] : []
    };
  }

  // Required properties
  if (!schema['@context']) {
    errors.push('Missing required @context property');
    if (suggestions) {
      tips.push('Add "@context": "https://schema.org" to your schema');
    }
  } else if (schema['@context'] !== 'https://schema.org') {
    warnings.push('Non-standard @context value detected');
    if (suggestions) {
      tips.push('Consider using "https://schema.org" as the @context value');
    }
  }

  if (!schema['@type']) {
    errors.push('Missing required @type property');
    if (suggestions) {
      tips.push('Add a valid Schema.org type like "Product", "Article", "Organization", etc.');
    }
  }

  // Schema-specific validation
  const schemaType = schema['@type'];
  
  if (schemaType === 'Product') {
    if (!schema.name) {
      errors.push('Product schema missing required "name" property');
    }
    if (!schema.offers && !schema.price) {
      warnings.push('Product schema should include offers or price information');
      if (suggestions) {
        tips.push('Add offers: { price: "X.XX", priceCurrency: "USD" } to your product schema');
      }
    }
    if (!schema.image) {
      warnings.push('Product schema should include image(s)');
    }
  }

  if (schemaType === 'Article' || schemaType === 'BlogPosting') {
    if (!schema.headline && !schema.name) {
      errors.push('Article schema missing required "headline" or "name" property');
    }
    if (!schema.author) {
      warnings.push('Article schema should include author information');
      if (suggestions) {
        tips.push('Add author: { "@type": "Person", "name": "Author Name" }');
      }
    }
    if (!schema.datePublished) {
      warnings.push('Article schema should include publication date');
    }
    if (!schema.publisher) {
      warnings.push('Article schema should include publisher information');
    }
  }

  if (schemaType === 'LocalBusiness' || schemaType === 'Organization') {
    if (!schema.name) {
      errors.push('Business schema missing required "name" property');
    }
    if (!schema.address) {
      warnings.push('Business schema should include address information');
    }
    if (!schema.telephone && !schema.email) {
      warnings.push('Business schema should include contact information');
    }
  }

  if (schemaType === 'Event') {
    if (!schema.name) {
      errors.push('Event schema missing required "name" property');
    }
    if (!schema.startDate) {
      errors.push('Event schema missing required "startDate" property');
      if (suggestions) {
        tips.push('Add startDate in ISO 8601 format: "2024-12-25T10:00:00Z"');
      }
    }
    if (!schema.location) {
      warnings.push('Event schema should include location information');
    }
  }

  if (schemaType === 'JobPosting') {
    if (!schema.name && !schema.title) {
      errors.push('JobPosting schema missing required "title" property');
    }
    if (!schema.description) {
      errors.push('JobPosting schema missing required "description" property');
    }
    if (!schema.hiringOrganization) {
      errors.push('JobPosting schema missing required "hiringOrganization" property');
      if (suggestions) {
        tips.push('Add hiringOrganization: { "@type": "Organization", "name": "Company Name" }');
      }
    }
    if (!schema.jobLocation) {
      warnings.push('JobPosting schema should include jobLocation information');
    }
  }

  if (schemaType === 'FAQPage') {
    if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
      errors.push('FAQPage schema missing required "mainEntity" array');
      if (suggestions) {
        tips.push('Add mainEntity with an array of Question objects');
      }
    } else {
      schema.mainEntity.forEach((item, index) => {
        if (item['@type'] !== 'Question') {
          warnings.push(`FAQ item ${index + 1} should have @type: "Question"`);
        }
        if (!item.name) {
          errors.push(`FAQ question ${index + 1} missing "name" property`);
        }
        if (!item.acceptedAnswer) {
          errors.push(`FAQ question ${index + 1} missing "acceptedAnswer" property`);
        }
      });
    }
  }

  // Common property validation
  if (schema.image) {
    if (typeof schema.image === 'string') {
      // Single image - check if it looks like a URL
      if (!schema.image.startsWith('http') && !schema.image.startsWith('/')) {
        warnings.push('Image should be a full URL or absolute path');
      }
    } else if (Array.isArray(schema.image)) {
      schema.image.forEach((img, index) => {
        if (typeof img === 'string' && !img.startsWith('http') && !img.startsWith('/')) {
          warnings.push(`Image ${index + 1} should be a full URL or absolute path`);
        }
      });
    }
  }

  if (schema.url && typeof schema.url === 'string') {
    if (!schema.url.startsWith('http')) {
      warnings.push('URL should be a full URL starting with http:// or https://');
    }
  }

  // Date validation
  ['datePublished', 'dateModified', 'startDate', 'endDate'].forEach(dateField => {
    if (schema[dateField] && typeof schema[dateField] === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
      if (!dateRegex.test(schema[dateField])) {
        warnings.push(`${dateField} should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)`);
        if (suggestions) {
          tips.push(`Example: "${dateField}": "2024-01-15T10:00:00Z"`);
        }
      }
    }
  });

  // Strict mode additional checks
  if (strict) {
    if (!schema.description) {
      warnings.push('Schema should include a description for better SEO');
    }
    if (schemaType === 'Product' && !schema.brand) {
      warnings.push('Product schema should include brand information');
    }
    if ((schemaType === 'LocalBusiness' || schemaType === 'Organization') && !schema.url) {
      warnings.push('Business schema should include website URL');
    }
  }

  const isValid = errors.length === 0;
  const result = {
    valid: isValid,
    errors,
    warnings,
    suggestions: tips,
    score: calculateSchemaScore(schema, errors, warnings)
  };

  return result;
}

// Calculate a quality score for the schema
function calculateSchemaScore(schema, errors, warnings) {
  let score = 100;
  
  // Deduct points for errors and warnings
  score -= errors.length * 20;
  score -= warnings.length * 5;
  
  // Bonus points for good practices
  if (schema.description) score += 5;
  if (schema.image) score += 5;
  if (schema.url) score += 5;
  
  // Schema-specific bonuses
  if (schema['@type'] === 'Product') {
    if (schema.brand) score += 3;
    if (schema.offers) score += 3;
    if (schema.aggregateRating) score += 5;
  }
  
  if (schema['@type'] === 'Article') {
    if (schema.author) score += 3;
    if (schema.publisher) score += 3;
    if (schema.datePublished) score += 3;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Helper functions for advanced validation features
function calculateSchemaCompleteness(schema) {
  const schemaType = schema['@type'];
  const requiredFields = getRequiredFieldsForType(schemaType);
  const recommendedFields = getRecommendedFieldsForType(schemaType);
  
  let score = 0;
  
  requiredFields.forEach(field => {
    if (schema[field]) score += 2; // Required fields worth more
  });
  
  recommendedFields.forEach(field => {
    if (schema[field]) score += 1;
  });
  
  return Math.min(100, (score / (requiredFields.length * 2 + recommendedFields.length)) * 100);
}

function calculateSEOOptimization(schema) {
  let score = 0;
  let maxScore = 0;
  
  // Check for SEO-critical properties
  const seoProperties = [
    'name', 'description', 'image', 'url', 
    'datePublished', 'author', 'publisher'
  ];
  
  seoProperties.forEach(prop => {
    maxScore += 10;
    if (schema[prop]) {
      score += 10;
      // Bonus for quality content
      if (typeof schema[prop] === 'string' && schema[prop].length > 20) {
        score += 5;
        maxScore += 5;
      }
    }
  });
  
  return Math.min(100, (score / maxScore) * 100);
}

function assessRichResultsEligibility(schema) {
  const type = schema['@type'];
  const eligibilityChecks = {
    'Product': ['name', 'image', 'offers'],
    'Article': ['headline', 'image', 'author', 'datePublished'],
    'Recipe': ['name', 'image', 'author', 'datePublished'],
    'Event': ['name', 'startDate', 'location'],
    'JobPosting': ['title', 'description', 'hiringOrganization', 'jobLocation'],
    'LocalBusiness': ['name', 'address', 'telephone']
  };
  
  const required = eligibilityChecks[type] || [];
  const present = required.filter(field => schema[field]);
  
  return {
    eligible: present.length >= required.length * 0.8, // 80% threshold
    score: (present.length / required.length) * 100,
    missing: required.filter(field => !schema[field]),
    type
  };
}

function generateActionableRecommendations(schema) {
  const recommendations = [];
  const type = schema['@type'];
  
  // Type-specific recommendations
  if (type === 'Product' && !schema.offers) {
    recommendations.push({
      priority: 'high',
      property: 'offers',
      message: 'Add pricing information to improve product rich results',
      example: 'offers: { price: "99.99", priceCurrency: "USD" }'
    });
  }
  
  if (type === 'Article' && !schema.author) {
    recommendations.push({
      priority: 'medium',
      property: 'author',
      message: 'Add author information for better article credibility',
      example: 'author: { "@type": "Person", "name": "Author Name" }'
    });
  }
  
  if (!schema.image) {
    recommendations.push({
      priority: 'medium',
      property: 'image',
      message: 'Add images to improve visual appeal in search results',
      example: 'image: ["image1.jpg", "image2.jpg"]'
    });
  }
  
  return recommendations;
}

function generateSchemaBenchmarks(schema) {
  const type = schema['@type'];
  
  // Industry benchmarks (simplified for demo)
  const benchmarks = {
    'Product': {
      averageScore: 75,
      topPercentileScore: 90,
      commonIssues: ['Missing brand', 'No reviews', 'Incomplete offers']
    },
    'Article': {
      averageScore: 80,
      topPercentileScore: 95,
      commonIssues: ['Missing publisher', 'No publication date', 'Missing author']
    },
    'LocalBusiness': {
      averageScore: 70,
      topPercentileScore: 85,
      commonIssues: ['Missing hours', 'No address', 'Missing contact info']
    }
  };
  
  return benchmarks[type] || {
    averageScore: 75,
    topPercentileScore: 90,
    commonIssues: ['Incomplete required fields']
  };
}

function calculateRichResultsScore(schema) {
  const eligibility = assessRichResultsEligibility(schema);
  return eligibility.score;
}

function calculateSearchVisibilityScore(schema) {
  let score = calculateSEOOptimization(schema);
  
  // Bonus for structured data best practices
  if (schema['@context'] === 'https://schema.org') score += 5;
  if (schema.url && schema.url.startsWith('https://')) score += 5;
  if (schema.dateModified) score += 3;
  
  return Math.min(100, score);
}

function analyzeCompetitorAdvantage() {
  // Simplified competitor analysis (would typically involve external data)
  return {
    advantages: ['Structured data present', 'Rich results eligible'],
    disadvantages: ['Could improve completeness score'],
    opportunities: ['Add more detailed properties', 'Include reviews/ratings']
  };
}

function estimateCompressionRatio(schema) {
  const jsonString = JSON.stringify(schema);
  // Simulate gzip compression ratio
  return Math.round((jsonString.length * 0.3) / jsonString.length * 100) / 100;
}

function estimateLoadImpact(schema) {
  const size = JSON.stringify(schema).length;
  if (size < 1000) return 'minimal';
  if (size < 5000) return 'low';
  if (size < 10000) return 'moderate';
  return 'high';
}

function getRequiredFieldsForType(type) {
  const required = {
    'Product': ['name'],
    'Article': ['headline', 'author'],
    'Event': ['name', 'startDate'],
    'JobPosting': ['title', 'description', 'hiringOrganization'],
    'LocalBusiness': ['name', 'address'],
    'Recipe': ['name', 'recipeIngredient', 'recipeInstructions']
  };
  return required[type] || ['name'];
}

function getRecommendedFieldsForType(type) {
  const recommended = {
    'Product': ['description', 'image', 'brand', 'offers', 'aggregateRating'],
    'Article': ['image', 'datePublished', 'publisher', 'description'],
    'Event': ['description', 'location', 'offers', 'organizer'],
    'JobPosting': ['datePosted', 'employmentType', 'jobLocation', 'baseSalary'],
    'LocalBusiness': ['telephone', 'url', 'openingHours', 'priceRange'],
    'Recipe': ['image', 'author', 'datePublished', 'prepTime', 'cookTime', 'recipeYield']
  };
  return recommended[type] || ['description', 'image', 'url'];
}

// Schema suggestions based on type
export function getSchemaSupgestions(schemaType) {
  const suggestions = {
    'Product': [
      'Include high-quality images',
      'Add detailed product description',
      'Include price and availability information',
      'Add brand information',
      'Include customer reviews and ratings'
    ],
    'Article': [
      'Include author information',
      'Add publication and modification dates',
      'Include featured image',
      'Add publisher information',
      'Include article keywords'
    ],
    'LocalBusiness': [
      'Include complete address information',
      'Add opening hours',
      'Include contact information (phone, email)',
      'Add business description',
      'Include customer reviews'
    ],
    'Event': [
      'Include detailed event description',
      'Add location information',
      'Include ticket pricing',
      'Add organizer information',
      'Include event images'
    ]
  };
  
  return suggestions[schemaType] || [
    'Include a clear name/title',
    'Add detailed description', 
    'Include relevant images',
    'Add appropriate URLs'
  ];
}

// Correctly-spelled alias; keep both exports for backward compatibility
export function getSchemaSuggestions(schemaType) {
  return getSchemaSupgestions(schemaType);
}

// Analytics and Performance Tracking
export const Analytics = {
  // Track schema injection events
  trackSchemaInjection: (schema, options = {}) => {
    if (!isBrowserEnvironment() || !options.analytics) return;
    
    const eventData = {
      action: 'schema_injected',
      schema_type: schema['@type'],
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      user_agent: navigator.userAgent.substring(0, 100) // Truncate for privacy
    };

    // Custom analytics callback
    if (typeof options.analytics === 'function') {
      options.analytics(eventData);
    }
    
    // Google Analytics 4 integration
    if (typeof gtag !== 'undefined' && options.gtag !== false) {
      gtag('event', 'schema_injection', {
        custom_schema_type: schema['@type'],
        page_location: window.location.href
      });
    }
    
    // Google Analytics Universal integration
    if (typeof ga !== 'undefined' && options.ga !== false) {
      ga('send', 'event', 'Schema', 'Injection', schema['@type']);
    }
    
    // Custom event for other analytics tools
    if (options.customEvent !== false && window.dispatchEvent) {
      const customEvent = new CustomEvent('ai-seo-schema-injected', {
        detail: eventData
      });
      window.dispatchEvent(customEvent);
    }
  },

  // Schema validation tracking
  trackValidation: (schema, validationResult, options = {}) => {
    if (!isBrowserEnvironment() || !options.analytics) return;
    
    const eventData = {
      action: 'schema_validated',
      schema_type: schema['@type'],
      validation_score: validationResult.score,
      errors_count: validationResult.errors.length,
      warnings_count: validationResult.warnings.length,
      timestamp: new Date().toISOString()
    };

    if (typeof options.analytics === 'function') {
      options.analytics(eventData);
    }
  },

  // Performance metrics
  measurePerformance: (operation, fn, options = {}) => {
    if (!isBrowserEnvironment()) return fn();
    
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (options.analytics) {
      const eventData = {
        action: 'performance_measured',
        operation,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      };
      
      if (typeof options.analytics === 'function') {
        options.analytics(eventData);
      }
    }
    
    return result;
  },

  // Schema effectiveness tracking
  getSchemaMetrics: () => {
    if (!isBrowserEnvironment()) return null;
    
    const schemas = document.querySelectorAll('script[data-ai-seo]');
    const metrics = {
      total_schemas: schemas.length,
      schema_types: {},
      injection_timestamps: [],
      page_url: window.location.href,
      collected_at: new Date().toISOString()
    };
    
    schemas.forEach(script => {
      const type = script.getAttribute('data-ai-seo-type');
      if (type) {
        metrics.schema_types[type] = (metrics.schema_types[type] || 0) + 1;
      }
      
      // Try to get timestamp from schema registry
      const id = script.getAttribute('data-ai-seo-id');
      if (id && schemaRegistry.has(id)) {
        metrics.injection_timestamps.push(schemaRegistry.get(id).timestamp);
      }
    });
    
    return metrics;
  },

  // Export analytics data
  exportAnalytics: (format = 'json') => {
    const metrics = Analytics.getSchemaMetrics();
    if (!metrics) return null;
    
    const data = {
      ...metrics,
      registry_data: Array.from(schemaRegistry.entries()).map(([id, data]) => ({
        id,
        type: data.schema['@type'],
        timestamp: data.timestamp,
        schema_size: JSON.stringify(data.schema).length
      }))
    };
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = [
        ['Schema ID', 'Type', 'Timestamp', 'Size (bytes)'],
        ...data.registry_data.map(item => [
          item.id,
          item.type,
          new Date(item.timestamp).toISOString(),
          item.schema_size
        ])
      ];
      
      return csvData.map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(data, null, 2);
  }
};

// Enhanced browser environment detection
function isBrowserEnvironment() {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' && 
         typeof document.createElement === 'function';
}

// Debug logging utility
function debugLog(message, level = 'info', debug = false) {
  if (!debug) return;
  
  const prefix = '[ai-seo]';
  switch (level) {
    case 'error':
      console.error(`${prefix} ERROR:`, message);
      break;
    case 'warn':
      console.warn(`${prefix} WARNING:`, message);
      break;
    default:
      console.log(`${prefix}`, message);
  }
}

export function initSEO({
  pageType = 'FAQPage',
  questionType,
  answerType,
  schema,
  debug = false,
  validate = true,
  allowDuplicates = false,
  id = null
} = {}) {
  // Enhanced browser detection with debug logging
  if (!isBrowserEnvironment()) {
    debugLog('Not in browser environment - skipping schema injection', 'warn', debug);
    return null;
  }

  // Enhanced document.head check
  if (!document.head) {
    debugLog('document.head not available - cannot inject schema', 'error', debug);
    return null;
  }

  // Generate or use provided ID for tracking
  const schemaId = id || `ai-seo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Duplicate prevention
  if (!allowDuplicates) {
    const existingScript = document.querySelector(`script[data-ai-seo-id="${schemaId}"]`);
    if (existingScript) {
      debugLog(`Schema with ID "${schemaId}" already exists`, 'warn', debug);
      return existingScript;
    }

    // Check for similar schemas if no specific ID provided
    if (!id) {
      const existingSchemas = document.querySelectorAll('script[data-ai-seo]');
      if (existingSchemas.length > 0 && !allowDuplicates) {
        debugLog(`Found ${existingSchemas.length} existing schema(s). Use allowDuplicates: true or specific ID to override`, 'warn', debug);
      }
    }
  }

  // Build schema object
  const jsonLd = schema || {
    "@context": "https://schema.org",
    "@type": pageType,
    ...(questionType && answerType && {
      "mainEntity": [{
        "@type": "Question",
        "name": questionType,
        "acceptedAnswer": { "@type": "Answer", "text": answerType }
      }]
    })
  };

  // Check cache for pre-validated schemas (v1.5.0 feature)
  const cacheOptions = { debug, validate, allowDuplicates, id };
  const cachedResult = globalSchemaCache.get(jsonLd, cacheOptions);
  if (cachedResult && globalSchemaCache.shouldCache(jsonLd)) {
    debugLog(`Cache hit for schema type: ${jsonLd['@type']}`, 'info', debug);
    
    // For cached results, we still need to inject the script element
    if (cachedResult.valid !== false) {
      try {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLd, null, debug ? 2 : 0);
        script.setAttribute('data-ai-seo', 'true');
        script.setAttribute('data-ai-seo-id', schemaId);
        script.setAttribute('data-ai-seo-type', jsonLd['@type']);
        script.setAttribute('data-ai-seo-cached', 'true');
        
        document.head.appendChild(script);
        
        // Record cache hit performance
        Performance.recordInjection(1.0, true, jsonLd['@type']); // Cache hits are fast (~1ms)
        
        // Register in global registry
        schemaRegistry.set(schemaId, {
          element: script,
          schema: jsonLd,
          timestamp: Date.now(),
          fromCache: true
        });
        
        debugLog(`Cached schema injected successfully with ID: ${schemaId}`, 'info', debug);
        return script;
      } catch (error) {
        debugLog(`Failed to inject cached schema: ${error.message}`, 'error', debug);
        // Fall through to normal processing
      }
    }
  }

  // Schema validation
  let validationResult = { valid: true };
  if (validate) {
    validationResult = validateSchema(jsonLd);
    if (!validationResult.valid) {
      debugLog(`Schema validation failed: ${validationResult.error}`, 'error', debug);
      if (debug) {
        console.error('[ai-seo] Invalid schema:', jsonLd);
      }
      
      // Cache failed validation to avoid reprocessing
      if (globalSchemaCache.shouldCache(jsonLd)) {
        globalSchemaCache.set(jsonLd, cacheOptions, { valid: false, error: validationResult.error });
      }
      
      return null;
    }
    debugLog('Schema validation passed', 'info', debug);
  }

  try {
    // Performance monitoring start (v1.5.0)
    const perfStart = performance.now();
    
    // Create and inject script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd, null, debug ? 2 : 0);
    script.setAttribute('data-ai-seo', 'true');
    script.setAttribute('data-ai-seo-id', schemaId);
    script.setAttribute('data-ai-seo-type', jsonLd['@type']);
    
    document.head.appendChild(script);
    
    // Performance monitoring end
    const perfEnd = performance.now();
    const injectionTime = perfEnd - perfStart;
    const wasFromCache = false; // This is a new injection, not from cache
    
    // Record performance metrics
    Performance.recordInjection(injectionTime, wasFromCache, jsonLd['@type']);
    
    // Register in global registry for cleanup
    schemaRegistry.set(schemaId, {
      element: script,
      schema: jsonLd,
      timestamp: Date.now(),
      performance: {
        injectionTime,
        fromCache: wasFromCache
      }
    });
    
    // Cache successful schema processing for future use (v1.5.0 feature)
    if (globalSchemaCache.shouldCache(jsonLd)) {
      globalSchemaCache.set(jsonLd, cacheOptions, {
        valid: true,
        processed: true,
        schemaId,
        timestamp: Date.now()
      });
      debugLog(`Schema cached for future use`, 'info', debug);
    }
    
    debugLog(`Schema injected successfully with ID: ${schemaId} (${injectionTime.toFixed(2)}ms)`, 'info', debug);
    return script;
    
  } catch (error) {
    debugLog(`Failed to inject schema: ${error.message}`, 'error', debug);
    return null;
  }
}

// Export a simpler alias for quick FAQ setup
export const addFAQ = (question, answer, options = {}) => {
  return initSEO({ 
    questionType: question, 
    answerType: answer,
    ...options
  });
};

// Cleanup utilities
export function removeSchema(schemaId) {
  if (!isBrowserEnvironment()) return false;
  
  if (schemaRegistry.has(schemaId)) {
    const { element } = schemaRegistry.get(schemaId);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      schemaRegistry.delete(schemaId);
      return true;
    }
  }
  
  // Fallback: try to find by DOM attribute
  const element = document.querySelector(`script[data-ai-seo-id="${schemaId}"]`);
  if (element) {
    element.parentNode.removeChild(element);
    return true;
  }
  
  return false;
}

export function removeAllSchemas() {
  if (!isBrowserEnvironment()) return 0;
  
  const elements = document.querySelectorAll('script[data-ai-seo]');
  let removedCount = 0;
  
  elements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
      removedCount++;
    }
  });
  
  // Clear registry
  schemaRegistry.clear();
  
  return removedCount;
}

export function listSchemas() {
  if (!isBrowserEnvironment()) return [];
  
  const schemas = [];
  schemaRegistry.forEach((data, id) => {
    schemas.push({
      id,
      type: data.schema['@type'],
      timestamp: data.timestamp,
      element: data.element
    });
  });
  
  return schemas;
}

// Get schema by ID
export function getSchema(schemaId) {
  return schemaRegistry.get(schemaId) || null;
}

// ==========================================
// AI-POWERED FEATURES - NEW IN V1.6.0 🧠
// ==========================================

// AI Engine for LLM optimization and content analysis
export const AI = {
  /**
   * Optimize schemas for Large Language Model understanding
   * Enhances schemas to be more AI-friendly and searchable
   */
  optimizeForLLM: (schema, options = {}) => {
    const {
      target = ['chatgpt', 'bard', 'claude'],
      semanticEnhancement = true,
      voiceOptimization = false
    } = options;
    
    if (!schema || typeof schema !== 'object') {
      throw new Error('AI.optimizeForLLM requires a valid schema object');
    }
    
    const optimizedSchema = { ...schema };
    
    // Add LLM-friendly properties
    if (semanticEnhancement) {
      optimizedSchema['@context'] = [
        'https://schema.org',
        {
          'ai': 'https://ai-search.org/',
          'llm': 'https://llm-optimization.org/'
        }
      ];
      
      // Add semantic clarity
      if (optimizedSchema.name && !optimizedSchema.alternateName) {
        optimizedSchema.alternateName = AI._generateAlternateNames(optimizedSchema.name);
      }
      
      // Enhance descriptions for AI understanding
      if (optimizedSchema.description) {
        optimizedSchema.description = AI._enhanceDescriptionForAI(optimizedSchema.description, target);
      }
    }
    
    // Add voice search optimization
    if (voiceOptimization) {
      optimizedSchema.potentialAction = optimizedSchema.potentialAction || [];
      optimizedSchema.potentialAction.push({
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'search?q={search_term_string}',
          'actionPlatform': ['voice', 'mobile', 'desktop']
        },
        'query-input': 'required name=search_term_string'
      });
    }
    
    // Add AI-specific metadata
    optimizedSchema.additionalProperty = optimizedSchema.additionalProperty || [];
    optimizedSchema.additionalProperty.push({
      '@type': 'PropertyValue',
      'name': 'ai-optimized',
      'value': 'true',
      'description': `Optimized for ${target.join(', ')} understanding`
    });
    
    return optimizedSchema;
  },
  
  /**
   * Generate schema from content analysis
   * Automatically detects and creates appropriate schemas from page content
   */
  generateFromContent: (content, options = {}) => {
    const {
      confidence = 0.8,
      multipleTypes = true,
      includeMetrics = false
    } = options;
    
    if (!content || typeof content !== 'string') {
      throw new Error('AI.generateFromContent requires valid content string');
    }
    
    const analysis = AI._analyzeContent(content);
    const schemas = [];
    
    // Generate schemas based on content analysis
    for (const [type, score] of Object.entries(analysis.typeScores)) {
      if (score >= confidence) {
        const schema = AI._generateSchemaFromAnalysis(type, analysis, content);
        if (schema) {
          schemas.push({
            schema,
            confidence: score,
            type,
            metrics: includeMetrics ? analysis.metrics : undefined
          });
        }
        
        if (!multipleTypes) break;
      }
    }
    
    // Sort by confidence score
    schemas.sort((a, b) => b.confidence - a.confidence);
    
    return multipleTypes ? schemas : schemas[0] || null;
  },
  
  /**
   * Analyze content and extract semantic information
   * Returns detailed analysis for schema generation
   */
  analyzeContent: (content, options = {}) => {
    const { includeKeywords = true, includeEntities = true, includeSentiment = false } = options;
    
    if (!content) return null;
    
    const analysis = AI._analyzeContent(content);
    
    const result = {
      typeScores: analysis.typeScores,
      confidence: Math.max(...Object.values(analysis.typeScores)),
      recommendedType: Object.keys(analysis.typeScores).reduce((a, b) => 
        analysis.typeScores[a] > analysis.typeScores[b] ? a : b
      )
    };
    
    if (includeKeywords) {
      result.keywords = AI._extractKeywords(content);
    }
    
    if (includeEntities) {
      result.entities = AI._extractEntities(content);
    }
    
    if (includeSentiment) {
      result.sentiment = AI._analyzeSentiment(content);
    }
    
    return result;
  },
  
  /**
   * Optimize schema for voice search
   * Enhances schemas for voice query compatibility
   */
  optimizeForVoiceSearch: (schema, options = {}) => {
    const { includeQA = true, naturalLanguage = true, conversational = true } = options;
    
    const optimized = { ...schema };
    
    if (includeQA && schema['@type'] !== 'FAQPage') {
      // Add FAQ section for voice queries
      optimized.mainEntity = optimized.mainEntity || [];
      
      const voiceQuestions = AI._generateVoiceQuestions(schema);
      voiceQuestions.forEach(qa => {
        optimized.mainEntity.push({
          '@type': 'Question',
          'name': qa.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': qa.answer
          }
        });
      });
    }
    
    if (naturalLanguage && optimized.description) {
      optimized.description = AI._convertToNaturalLanguage(optimized.description);
    }
    
    if (conversational) {
      optimized.potentialAction = optimized.potentialAction || [];
      optimized.potentialAction.push({
        '@type': 'AskAction',
        'target': {
          '@type': 'EntryPoint',
          'contentType': 'application/json',
          'httpMethod': 'GET'
        }
      });
    }
    
    return optimized;
  },
  
  // Private helper methods
  _analyzeContent: (content) => {
    const words = content.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Simple content type detection based on keywords and patterns
    const typeIndicators = {
      'Product': ['price', 'buy', 'purchase', 'product', 'item', 'sale', 'discount', 'shipping', 'brand', 'model'],
      'Article': ['author', 'published', 'article', 'blog', 'post', 'news', 'story', 'report', 'opinion'],
      'LocalBusiness': ['address', 'phone', 'hours', 'location', 'business', 'store', 'shop', 'restaurant', 'service'],
      'Event': ['event', 'date', 'time', 'venue', 'ticket', 'registration', 'conference', 'meeting', 'concert'],
      'Recipe': ['ingredients', 'recipe', 'cook', 'bake', 'preparation', 'cooking time', 'serves', 'calories'],
      'Person': ['born', 'age', 'biography', 'career', 'education', 'achievements', 'awards', 'personal'],
      'Organization': ['founded', 'company', 'organization', 'corporation', 'headquarters', 'employees', 'mission']
    };
    
    const typeScores = {};
    
    for (const [type, indicators] of Object.entries(typeIndicators)) {
      let score = 0;
      indicators.forEach(indicator => {
        const matches = words.filter(word => word.includes(indicator.toLowerCase())).length;
        score += matches / words.length;
      });
      typeScores[type] = Math.min(score * 2, 1); // Normalize to 0-1
    }
    
    return {
      typeScores,
      wordCount: words.length,
      sentenceCount: sentences.length,
      metrics: {
        readabilityScore: AI._calculateReadability(sentences, words),
        keywordDensity: AI._calculateKeywordDensity(words),
        semanticRichness: Object.values(typeScores).reduce((a, b) => a + b, 0)
      }
    };
  },
  
  _generateAlternateNames: (name) => {
    if (!name) return [];
    
    const alternates = [];
    
    // Add common variations
    if (name.includes(' ')) {
      alternates.push(name.replace(/\s+/g, ''));
      alternates.push(name.replace(/\s+/g, '-'));
    }
    
    // Add acronym if applicable
    const words = name.split(' ');
    if (words.length > 1) {
      alternates.push(words.map(w => w[0]).join('').toUpperCase());
    }
    
    return alternates.filter(alt => alt !== name);
  },
  
  _enhanceDescriptionForAI: (description, targets) => {
    if (!description) return description;
    
    // Add context markers for AI understanding
    let enhanced = description;
    
    // Add semantic markers
    if (!enhanced.includes('This is')) {
      enhanced = `This is ${enhanced}`;
    }
    
    // Add target-specific enhancements
    if (targets.includes('chatgpt')) {
      enhanced += ' [Optimized for conversational AI understanding]';
    }
    
    return enhanced;
  },
  
  _generateSchemaFromAnalysis: (type, analysis, content) => {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': type
    };
    
    // Extract basic information based on type
    switch (type) {
      case 'Product':
        return {
          ...baseSchema,
          'name': AI._extractTitle(content),
          'description': AI._extractDescription(content, 160),
          'category': AI._extractCategory(content)
        };
        
      case 'Article':
        return {
          ...baseSchema,
          'headline': AI._extractTitle(content),
          'description': AI._extractDescription(content, 160),
          'articleBody': `${content.substring(0, 500)}...`,
          'wordCount': analysis.wordCount
        };
        
      case 'LocalBusiness':
        return {
          ...baseSchema,
          'name': AI._extractTitle(content),
          'description': AI._extractDescription(content, 160),
          'address': AI._extractAddress(content)
        };
        
      default:
        return {
          ...baseSchema,
          'name': AI._extractTitle(content),
          'description': AI._extractDescription(content, 160)
        };
    }
  },
  
  _extractKeywords: (content) => {
    const words = content.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const frequency = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  },
  
  _extractEntities: (content) => {
    // Simple entity extraction (in production, use NLP libraries)
    const entities = {
      people: content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [],
      places: content.match(/\b[A-Z][a-z]+(?:, [A-Z][a-z]+)*\b/g) || [],
      organizations: content.match(/\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd)\b/g) || []
    };
    
    return entities;
  },
  
  _analyzeSentiment: (content) => {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];
    
    const words = content.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return {
      score: score / words.length,
      label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
    };
  },
  
  _generateVoiceQuestions: (schema) => {
    const questions = [];
    const type = schema['@type'];
    
    if (type === 'Product' && schema.name) {
      questions.push({
        question: `What is ${schema.name}?`,
        answer: schema.description || `${schema.name} is a product available for purchase.`
      });
      
      if (schema.offers && schema.offers.price) {
        questions.push({
          question: `How much does ${schema.name} cost?`,
          answer: `${schema.name} costs ${schema.offers.priceCurrency || '$'}${schema.offers.price}.`
        });
      }
    }
    
    return questions;
  },
  
  _convertToNaturalLanguage: (text) => {
    return text.replace(/\b(is|are|was|were)\b/g, match => `${match} naturally`)
               .replace(/\.$/, '. This information is optimized for voice search.');
  },
  
  _calculateReadability: (sentences, words) => {
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((acc, word) => acc + AI._countSyllables(word), 0) / words.length;
    
    // Simplified Flesch Reading Ease
    return Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)));
  },
  
  _countSyllables: (word) => {
    return word.toLowerCase().match(/[aeiouy]+/g)?.length || 1;
  },
  
  _calculateKeywordDensity: (words) => {
    const frequency = {};
    words.forEach(word => frequency[word] = (frequency[word] || 0) + 1);
    
    const maxFreq = Math.max(...Object.values(frequency));
    return maxFreq / words.length;
  },
  
  _extractTitle: (content) => {
    // Extract first line or sentence as title
    const firstLine = content.split('\n')[0].trim();
    return firstLine.length > 0 && firstLine.length < 100 ? firstLine : `${content.substring(0, 60)}...`;
  },
  
  _extractDescription: (content, maxLength = 160) => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let description = sentences[0] || content.substring(0, maxLength);
    
    if (description.length > maxLength) {
      description = `${description.substring(0, maxLength - 3)}...`;
    }
    
    return description.trim();
  },
  
  _extractCategory: (content) => {
    const categoryKeywords = {
      'Electronics': ['computer', 'phone', 'laptop', 'device', 'electronic'],
      'Clothing': ['shirt', 'pants', 'dress', 'clothing', 'apparel', 'fashion'],
      'Books': ['book', 'novel', 'author', 'pages', 'chapter', 'reading'],
      'Food': ['food', 'recipe', 'cooking', 'ingredient', 'meal', 'dish']
    };
    
    const words = content.toLowerCase().split(/\s+/);
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => words.some(word => word.includes(keyword)))) {
        return category;
      }
    }
    
    return 'General';
  },
  
  _extractAddress: (content) => {
    // Simple address pattern matching
    const addressPattern = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)/i;
    const match = content.match(addressPattern);
    return match ? match[0] : null;
  }
};

// Multi-Platform Deployment System - V1.8.0 Feature
export const MultiPlatform = {
  // WordPress Plugin Code Generation
  wordpress: {
    generatePlugin: (schema, options = {}) => {
      if (!schema || typeof schema !== 'object') {
        throw new Error('MultiPlatform.wordpress.generatePlugin requires a valid schema object');
      }
      
      const {
        pluginName = 'AI SEO Schema',
        version = '1.0.0',
        author = 'AI-SEO',
        description = 'Auto-generated schema plugin'
      } = options;

      const pluginCode = `<?php
/**
 * Plugin Name: ${pluginName}
 * Description: ${description}
 * Version: ${version}
 * Author: ${author}
 * Generated by ai-seo v1.8.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class AISEOSchema {
    public function __construct() {
        add_action('wp_head', array($this, 'inject_schema'));
        add_action('admin_menu', array($this, 'admin_menu'));
    }
    
    public function inject_schema() {
        $schema = '${JSON.stringify(schema, null, 2).replace(/'/g, "\\'")}';
        echo '<script type="application/ld+json">' . $schema . '</script>';
    }
    
    public function admin_menu() {
        add_options_page(
            '${pluginName} Settings',
            '${pluginName}',
            'manage_options',
            'ai-seo-schema',
            array($this, 'admin_page')
        );
    }
    
    public function admin_page() {
        echo '<div class="wrap">';
        echo '<h1>${pluginName}</h1>';
        echo '<p>Schema is active and injecting on all pages.</p>';
        echo '<pre>' . htmlspecialchars('${JSON.stringify(schema, null, 2)}') . '</pre>';
        echo '</div>';
    }
}

new AISEOSchema();
?>`;

      return {
        code: pluginCode,
        filename: `${pluginName.toLowerCase().replace(/\s+/g, '-')}.php`,
        instructions: [
          '1. Upload the generated PHP file to your WordPress /wp-content/plugins/ directory',
          '2. Activate the plugin in your WordPress admin panel',
          '3. The schema will automatically be injected into all pages',
          `4. Check Settings > ${  pluginName  } to verify installation`
        ]
      };
    },

    generateThemeIntegration: (schema, options = {}) => {
      const { hookPosition = 'wp_head' } = options;
      
      return {
        code: `<?php
// Add this to your theme's functions.php file
function ai_seo_inject_schema() {
    $schema = '${JSON.stringify(schema, null, 2).replace(/'/g, "\\'")}';
    echo '<script type="application/ld+json">' . $schema . '</script>';
}
add_action('${hookPosition}', 'ai_seo_inject_schema');
?>`,
        instructions: [
          '1. Copy the generated code',
          '2. Paste it into your theme\'s functions.php file',
          '3. Save the file',
          '4. The schema will be injected on all pages'
        ]
      };
    }
  },

  // Shopify Integration
  shopify: {
    generateLiquidTemplate: (schema, options = {}) => {
      const { templateType = 'product' } = options;
      
      const liquidCode = `<!-- AI-SEO Schema - Generated for Shopify -->
<!-- Place this in your ${templateType}.liquid template -->
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)
  .replace(/"([^"]+)":/g, (match, key) => {
    // Convert static values to Shopify liquid variables where applicable
    if (key === 'name' && templateType === 'product') return '"name": "{{ product.title }}",';
    if (key === 'description' && templateType === 'product') return '"description": "{{ product.description | strip_html | truncate: 160 }}",';
    if (key === 'image' && templateType === 'product') return '"image": "{{ product.featured_image | img_url: \'master\' }}",';
    if (key === 'price' && templateType === 'product') return '"price": "{{ product.price | money_without_currency }}",';
    return match;
  })}
</script>`;

      return {
        code: liquidCode,
        filename: `schema-${templateType}.liquid`,
        instructions: [
          '1. Copy the generated Liquid template code',
          `2. Paste it into your theme's ${  templateType  }.liquid file`,
          '3. Place it within the <head> section',
          '4. Save and publish your theme',
          '5. The schema will dynamically populate with product data'
        ]
      };
    },

    generateAppIntegration: (schema, options = {}) => {
      const { appName = 'AI SEO Schema App' } = options;
      
      return {
        code: `// Shopify App Integration - ${appName}
// Place this in your app's main JavaScript file

class AISEOShopifyApp {
  constructor() {
    this.schema = ${JSON.stringify(schema, null, 2)};
    this.init();
  }
  
  init() {
    // Initialize when Shopify app loads
    document.addEventListener('DOMContentLoaded', () => {
      this.injectSchema();
    });
  }
  
  injectSchema() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(this.schema);
    document.head.appendChild(script);
  }
  
  updateSchema(newSchema) {
    this.schema = { ...this.schema, ...newSchema };
    // Remove old schema
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) existingScript.remove();
    // Inject updated schema
    this.injectSchema();
  }
}

// Initialize the app
new AISEOShopifyApp();`,
        instructions: [
          '1. Include this JavaScript in your Shopify app',
          '2. The schema will be automatically injected',
          '3. Use updateSchema() method to modify schema dynamically',
          '4. Test in Shopify\'s development environment first'
        ]
      };
    }
  },

  // Webflow Integration
  webflow: {
    generateEmbedCode: (schema, options = {}) => {
      const { placement = 'head' } = options;
      
      return {
        code: `<!-- AI-SEO Schema for Webflow -->
<!-- Place in ${placement === 'head' ? 'Site Settings > Custom Code > Head Code' : 'Page Settings > Custom Code'} -->
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`,
        instructions: [
          '1. Copy the generated embed code',
          placement === 'head' 
            ? '2. Go to Site Settings > Custom Code > Head Code'
            : '2. Go to Page Settings > Custom Code',
          '3. Paste the code',
          '4. Publish your site',
          '5. The schema will be active on your Webflow site'
        ]
      };
    },

    generateCollectionIntegration: (schema, collectionFields = {}) => {
      let dynamicSchema = JSON.stringify(schema, null, 2);
      
      // Replace static values with Webflow CMS field references
      Object.entries(collectionFields).forEach(([schemaKey, cmsField]) => {
        const regex = new RegExp(`"${schemaKey}":\\s*"[^"]*"`, 'g');
        dynamicSchema = dynamicSchema.replace(regex, `"${schemaKey}": "{{wf {&quot;path&quot;:&quot;${cmsField}&quot;} }}"`);
      });
      
      return {
        code: `<!-- Dynamic AI-SEO Schema for Webflow CMS -->
<!-- Place in Collection Page template -->
<script type="application/ld+json">
${dynamicSchema}
</script>`,
        instructions: [
          '1. Add this code to your Collection Page template',
          '2. Place in Page Settings > Custom Code > Head Code',
          '3. The schema will dynamically populate from CMS fields',
          '4. Publish your collection template'
        ]
      };
    }
  },

  // Google Tag Manager Integration
  gtm: {
    generateDataLayerPush: (schema, options = {}) => {
      const { eventName = 'ai_seo_schema_ready' } = options;
      
      return {
        code: `// AI-SEO Schema - Google Tag Manager Integration
// Place this code where you want to trigger the schema injection

dataLayer.push({
  'event': '${eventName}',
  'schema_data': ${JSON.stringify(schema)},
  'ai_seo_version': '1.8.0'
});

// Optional: Direct injection function
function injectAISEOSchema() {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(${JSON.stringify(schema)});
  document.head.appendChild(script);
}`,
        instructions: [
          '1. Add this code to your website',
          '2. In GTM, create a Custom HTML tag',
          `3. Set trigger to fire on the "${  eventName  }" event`,
          '4. Add the schema injection code to the tag',
          '5. Test and publish your GTM container'
        ]
      };
    },

    generateGTMTag: (schema, options = {}) => {
      const { tagName = 'AI SEO Schema Injection' } = options;
      
      return {
        tagConfig: {
          name: tagName,
          type: 'Custom HTML',
          html: `<script>
  (function() {
    const schema = ${JSON.stringify(schema)};
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  })();
</script>`,
          trigger: 'All Pages'
        },
        instructions: [
          '1. In Google Tag Manager, create a new Custom HTML tag',
          '2. Copy the provided HTML code',
          '3. Set the trigger to "All Pages" or customize as needed',
          '4. Save and publish your container',
          '5. Verify schema injection in browser dev tools'
        ]
      };
    }
  },

  // Universal deployment method
  deploy: (schema, platforms, options = {}) => {
    const deployments = {};
    
    platforms.forEach(platform => {
      switch (platform.toLowerCase()) {
        case 'wordpress':
          deployments.wordpress = MultiPlatform.wordpress.generatePlugin(schema, options.wordpress || {});
          break;
        case 'shopify':
          deployments.shopify = MultiPlatform.shopify.generateLiquidTemplate(schema, options.shopify || {});
          break;
        case 'webflow':
          deployments.webflow = MultiPlatform.webflow.generateEmbedCode(schema, options.webflow || {});
          break;
        case 'gtm':
          deployments.gtm = MultiPlatform.gtm.generateDataLayerPush(schema, options.gtm || {});
          break;
      }
    });
    
    return {
      deployments,
      summary: {
        platforms: platforms.length,
        generated: Object.keys(deployments).length,
        timestamp: new Date().toISOString()
      }
    };
  }
};

// Enhanced Validation System - V1.8.0 Feature
export const EnhancedValidation = {
  // Google Rich Results Testing Integration
  async testWithGoogle(schema, options = {}) {
    // Note: url and userAgent would be used in real Google API integration
    const { 
      url = 'https://example.com',
      userAgent = 'ai-seo-validator/1.8.0'
    } = options;
    
    // Prevent unused variable warnings
    void url;
    void userAgent;

    // Note: This would integrate with Google's Rich Results Testing API
    // For now, we'll simulate the response structure
    try {
      const mockGoogleResponse = {
        testStatus: {
          status: 'COMPLETE'
        },
        loadingExperience: {
          loadingExperienceStatus: 'LOADING_EXPERIENCE_SUCCEEDED'
        },
        richResultsTestResult: {
          verdict: this._analyzeSchemaForRichResults(schema),
          detectedItems: this._detectRichResultTypes(schema),
          issues: this._findRichResultIssues(schema)
        }
      };

      return {
        success: true,
        googleResults: mockGoogleResponse,
        recommendations: this._generateGoogleRecommendations(mockGoogleResponse),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Cross-browser schema validation
  validateCrossBrowser(schema, options = {}) {
    const { 
      browsers = ['chrome', 'firefox', 'safari', 'edge'],
      mobile = true 
    } = options;

    const results = {};

    browsers.forEach(browser => {
      results[browser] = {
        desktop: this._validateForBrowser(schema, browser, false),
        ...(mobile && { mobile: this._validateForBrowser(schema, browser, true) })
      };
    });

    return {
      results,
      summary: this._summarizeCrossBrowserResults(results),
      timestamp: new Date().toISOString()
    };
  },

  // Mobile-first validation
  validateMobile(schema, options = {}) {
    const {
      viewport = { width: 375, height: 667 }, // iPhone SE
      connection = '3g',
      deviceType = 'mobile'
    } = options;

    const mobileIssues = [];
    const mobileOptimizations = [];

    // Check for mobile-specific schema properties
    if (schema['@type'] === 'LocalBusiness' && !schema.geo) {
      mobileIssues.push({
        severity: 'warning',
        message: 'Missing geographic coordinates for mobile location services',
        property: 'geo',
        suggestion: 'Add latitude and longitude for better mobile experience'
      });
    }

    // Check for mobile-friendly image sizes
    if (schema.image) {
      const images = Array.isArray(schema.image) ? schema.image : [schema.image];
      images.forEach((img, index) => {
        if (typeof img === 'string' && !img.includes('mobile') && !img.includes('responsive')) {
          mobileOptimizations.push({
            type: 'image',
            message: `Consider mobile-optimized image for image ${index + 1}`,
            current: img,
            suggestion: 'Use responsive images or mobile-specific URLs'
          });
        }
      });
    }

    return {
      mobileScore: this._calculateMobileScore(schema, mobileIssues),
      issues: mobileIssues,
      optimizations: mobileOptimizations,
      deviceContext: { viewport, connection, deviceType },
      timestamp: new Date().toISOString()
    };
  },

  // Comprehensive enhanced validation
  async validateEnhanced(schema, options = {}) {
    const {
      strict = false,
      crossBrowser = false,
      mobile = false,
      googleTest = false,
      includeMetrics = true
    } = options;

    const startTime = performance.now();
    const results = {
      success: true,
      score: 100,
      errors: [],
      warnings: [],
      suggestions: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Basic validation
      const basicValidation = this._validateBasicStructure(schema, strict);
      results.errors.push(...basicValidation.errors);
      results.warnings.push(...basicValidation.warnings);

      // Schema.org compliance
      const complianceValidation = this._validateSchemaCompliance(schema);
      results.suggestions.push(...complianceValidation.suggestions);

      // Cross-browser validation
      if (crossBrowser) {
        const browserValidation = this.validateCrossBrowser(schema);
        results.crossBrowser = browserValidation;
      }

      // Mobile validation
      if (mobile) {
        const mobileValidation = this.validateMobile(schema);
        results.mobile = mobileValidation;
        results.warnings.push(...mobileValidation.issues);
        results.suggestions.push(...mobileValidation.optimizations);
      }

      // Google Rich Results testing
      if (googleTest) {
        const googleValidation = await this.testWithGoogle(schema);
        results.google = googleValidation;
        if (googleValidation.success) {
          results.suggestions.push(...googleValidation.recommendations);
        }
      }

      // Calculate final score
      results.score = this._calculateOverallScore(results);
      results.success = results.errors.length === 0;

      // Add metrics
      if (includeMetrics) {
        const endTime = performance.now();
        results.metrics = {
          validationTime: endTime - startTime,
          testsRun: {
            basic: true,
            compliance: true,
            crossBrowser,
            mobile,
            google: googleTest
          }
        };
      }

    } catch (error) {
      results.success = false;
      results.error = error.message;
      results.score = 0;
    }

    return results;
  },

  // Helper methods
  _analyzeSchemaForRichResults(schema) {
    const richResultTypes = {
      'Product': ['price', 'availability', 'review'],
      'Article': ['author', 'datePublished', 'headline'],
      'LocalBusiness': ['address', 'telephone', 'openingHours'],
      'Event': ['startDate', 'location', 'organizer']
    };

    const requiredFields = richResultTypes[schema['@type']] || [];
    if (requiredFields.length === 0) {
      return 'NOT_ELIGIBLE'; // Unknown schema type
    }
    
    // Check for nested properties like offers.price
    const missingFields = requiredFields.filter(field => {
      if (field === 'price') {
        // Check if price exists directly or in offers
        return !schema.price && !(schema.offers && schema.offers.price);
      }
      if (field === 'availability') {
        return !schema.availability && !(schema.offers && schema.offers.availability);
      }
      return !schema[field];
    });

    if (missingFields.length === 0) {
      return 'RICH_RESULTS_ELIGIBLE';
    } else if (missingFields.length <= requiredFields.length / 2) {
      return 'PARTIALLY_ELIGIBLE';
    } else {
      return 'NOT_ELIGIBLE';
    }
  },

  _detectRichResultTypes(schema) {
    const detectedTypes = [];
    
    if (schema['@type'] === 'Product' && schema.offers) {
      detectedTypes.push('Product Rich Snippet');
    }
    if (schema['@type'] === 'Article' && schema.author) {
      detectedTypes.push('Article Rich Snippet');
    }
    if (schema['@type'] === 'LocalBusiness' && schema.address) {
      detectedTypes.push('Local Business Rich Snippet');
    }

    return detectedTypes;
  },

  _findRichResultIssues(schema) {
    const issues = [];
    
    if (schema['@type'] === 'Product') {
      if (!schema.offers || !schema.offers.price) {
        issues.push({
          severity: 'ERROR',
          message: 'Product schema missing price information',
          property: 'offers.price'
        });
      }
    }

    return issues;
  },

  _generateGoogleRecommendations(googleResponse) {
    const recommendations = [];
    
    if (googleResponse.richResultsTestResult.verdict !== 'RICH_RESULTS_ELIGIBLE') {
      recommendations.push({
        type: 'improvement',
        message: 'Schema not fully eligible for rich results',
        action: 'Add missing required properties for your schema type'
      });
    }

    return recommendations;
  },

  _validateForBrowser(schema, browser, mobile) {
    const issues = [];
    
    if (browser === 'safari' && mobile && schema.image) {
      issues.push({
        severity: 'info',
        message: 'Consider WebP format for better Safari mobile performance',
        property: 'image'
      });
    }

    return {
      compatible: issues.length === 0 || issues.every(i => i.severity === 'info'),
      issues,
      score: Math.max(0, 100 - (issues.length * 10))
    };
  },

  _summarizeCrossBrowserResults(results) {
    let totalScore = 0;
    let testCount = 0;

    Object.entries(results).forEach(([, browserResult]) => {
      ['desktop', 'mobile'].forEach(platform => {
        if (browserResult[platform]) {
          totalScore += browserResult[platform].score;
          testCount++;
        }
      });
    });

    return {
      averageScore: testCount > 0 ? Math.round(totalScore / testCount) : 0,
      totalIssues: 0,
      compatibility: testCount > 0 ? (totalScore / testCount) > 80 : false
    };
  },

  _calculateMobileScore(schema, issues) {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'error':
          score -= 20;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  },

  _validateBasicStructure(schema, strict) {
    const errors = [];
    const warnings = [];

    if (!schema['@context']) {
      errors.push({
        severity: 'error',
        message: 'Missing required @context property',
        property: '@context'
      });
    }

    if (!schema['@type']) {
      errors.push({
        severity: 'error',
        message: 'Missing required @type property',
        property: '@type'
      });
    }

    if (strict && !schema.name && !schema.headline) {
      warnings.push({
        severity: 'warning',
        message: 'Missing name or headline property',
        property: 'name'
      });
    }

    return { errors, warnings };
  },

  _validateSchemaCompliance(schema) {
    const suggestions = [];

    if (schema['@type'] === 'Product' && !schema.brand) {
      suggestions.push({
        type: 'enhancement',
        message: 'Consider adding brand information',
        property: 'brand',
        benefit: 'Improves product rich snippet appearance'
      });
    }

    return { suggestions };
  },

  _calculateOverallScore(results) {
    let score = 100;
    
    // Major deduction for errors
    score -= results.errors.length * 20;
    score -= results.warnings.length * 10;
    
    // If there are critical errors (missing @context or @type), score should be very low
    const hasCriticalErrors = results.errors.some(error => 
      error.property === '@context' || error.property === '@type'
    );
    
    if (hasCriticalErrors) {
      score = Math.min(score, 20); // Cap at 20 for critical errors
    }
    
    if (results.mobile) {
      score = (score + results.mobile.mobileScore) / 2;
    }

    return Math.max(0, Math.round(score));
  }
};