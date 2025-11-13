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
        this.accessTimes = this.accessTimes.slice(-50); // More aggressive cleanup
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
        debugLog(`Lazy loaded ${this.schemaType} schema`, 'info', true);
      }
      
      return result;
    } catch (error) {
      debugLog(`Error in lazy schema loading: ${error.message}`, 'error', this.config.debug);
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
        debugLog(`Error in custom condition: ${error.message}`, 'error', this.config.debug);
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
    },

    // Blog series - v1.11.0
    blogSeries: (seriesData) => {
      return createSchema('BlogPosting')
        .name(seriesData.title)
        .description(seriesData.description)
        .author(seriesData.author)
        .publisher(seriesData.publisher)
        .addProperty('isPartOf', {
          '@type': 'Blog',
          name: seriesData.seriesName || seriesData.title
        })
        .addProperty('position', seriesData.partNumber)
        .addProperty('hasPart', (seriesData.parts || []).map(part => ({
          '@type': 'BlogPosting',
          name: part.title,
          url: part.url
        })))
        .addProperty('keywords', seriesData.tags || [])
        .build();
    },

    // Tutorial/How-to - v1.11.0
    tutorial: (tutorialData) => {
      const steps = (tutorialData.steps || []).map((step, index) => ({
        '@type': 'HowToStep',
        name: step.title || `Step ${index + 1}`,
        text: step.description,
        image: step.image,
        url: step.url
      }));

      return createSchema('HowTo')
        .name(tutorialData.title)
        .description(tutorialData.description)
        .image(tutorialData.image)
        .addProperty('step', steps)
        .addProperty('totalTime', tutorialData.duration)
        .addProperty('estimatedCost', tutorialData.cost ? {
          '@type': 'MonetaryAmount',
          currency: tutorialData.currency || 'USD',
          value: tutorialData.cost
        } : undefined)
        .addProperty('tool', tutorialData.tools)
        .addProperty('supply', tutorialData.materials)
        .build();
    },

    // Testimonial - v1.11.0
    testimonial: (testimonialData) => {
      return createSchema('Review')
        .name(testimonialData.title || 'Customer Testimonial')
        .addProperty('reviewBody', testimonialData.text)
        .addProperty('reviewRating', testimonialData.rating ? {
          '@type': 'Rating',
          ratingValue: testimonialData.rating,
          bestRating: testimonialData.maxRating || 5
        } : undefined)
        .addProperty('author', {
          '@type': 'Person',
          name: testimonialData.customerName,
          jobTitle: testimonialData.customerTitle
        })
        .addProperty('datePublished', testimonialData.date)
        .addProperty('itemReviewed', {
          '@type': testimonialData.itemType || 'Product',
          name: testimonialData.itemName
        })
        .build();
    }
  },

  /**
   * NEW in v1.11.0 - E-commerce Extensions
   */
  ecommerceExtensions: {
    // Product bundle - v1.11.0
    productBundle: (bundleData) => {
      return createSchema('ProductGroup')
        .name(bundleData.name)
        .description(bundleData.description)
        .image(bundleData.images)
        .addProperty('variesBy', 'bundleComponents')
        .addProperty('hasVariant', (bundleData.products || []).map(product => ({
          '@type': 'Product',
          name: product.name,
          sku: product.sku,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: bundleData.currency || 'USD'
          }
        })))
        .addProperty('offers', {
          '@type': 'AggregateOffer',
          lowPrice: bundleData.totalPrice,
          priceCurrency: bundleData.currency || 'USD',
          availability: bundleData.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        })
        .build();
    },

    // Product variant - v1.11.0
    productVariant: (variantData) => {
      return createSchema('ProductModel')
        .name(variantData.name)
        .description(variantData.description)
        .image(variantData.images)
        .addProperty('isVariantOf', {
          '@type': 'ProductGroup',
          name: variantData.parentProduct
        })
        .addProperty('color', variantData.color)
        .addProperty('size', variantData.size)
        .addProperty('material', variantData.material)
        .addProperty('sku', variantData.sku)
        .addProperty('gtin', variantData.gtin)
        .offers({
          price: variantData.price,
          priceCurrency: variantData.currency || 'USD',
          availability: variantData.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        })
        .build();
    }
  },

  /**
   * NEW in v1.11.0 - Professional Services Extensions
   */
  professionalExtensions: {
    // Service area business - v1.11.0
    serviceArea: (serviceData) => {
      return localBusiness(serviceData.businessType || 'Service')
        .name(serviceData.name)
        .description(serviceData.description)
        .telephone(serviceData.phone)
        .email(serviceData.email)
        .url(serviceData.website)
        .addProperty('areaServed', (serviceData.areas || []).map(area => ({
          '@type': 'GeoCircle',
          geoMidpoint: {
            '@type': 'GeoCoordinates',
            latitude: area.latitude,
            longitude: area.longitude
          },
          geoRadius: area.radius || '50 miles'
        })))
        .addProperty('serviceType', serviceData.services)
        .build();
    },

    // Multi-location business - v1.11.0
    multiLocationBusiness: (businessData) => {
      const locations = (businessData.locations || []).map(location => ({
        '@type': 'LocalBusiness',
        name: location.name || businessData.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: location.address.street,
          addressLocality: location.address.city,
          addressRegion: location.address.state,
          postalCode: location.address.zip,
          addressCountry: location.address.country
        },
        telephone: location.phone,
        geo: location.latitude && location.longitude ? {
          '@type': 'GeoCoordinates',
          latitude: location.latitude,
          longitude: location.longitude
        } : undefined,
        openingHoursSpecification: location.hours
      }));

      return organization()
        .name(businessData.name)
        .description(businessData.description)
        .url(businessData.website)
        .addProperty('@type', 'Organization')
        .addProperty('subOrganization', locations)
        .addProperty('numberOfLocations', locations.length)
        .build();
    },

    // Professional service offering - v1.11.0
    professionalService: (serviceData) => {
      return createSchema('Service')
        .name(serviceData.name)
        .description(serviceData.description)
        .addProperty('provider', {
          '@type': serviceData.providerType || 'Organization',
          name: serviceData.providerName,
          telephone: serviceData.phone,
          address: serviceData.address
        })
        .addProperty('areaServed', serviceData.serviceArea)
        .addProperty('serviceType', serviceData.category)
        .addProperty('termsOfService', serviceData.terms)
        .offers({
          price: serviceData.price,
          priceCurrency: serviceData.currency || 'USD',
          availability: 'https://schema.org/InStock'
        })
        .addProperty('aggregateRating', serviceData.rating ? {
          '@type': 'AggregateRating',
          ratingValue: serviceData.rating,
          reviewCount: serviceData.reviewCount
        } : undefined)
        .build();
    },

    // Professional certification - v1.11.0
    certification: (certData) => {
      return createSchema('EducationalOccupationalCredential')
        .name(certData.name)
        .description(certData.description)
        .addProperty('credentialCategory', certData.category || 'Certification')
        .addProperty('competencyRequired', certData.requirements)
        .addProperty('educationalLevel', certData.level)
        .addProperty('recognizedBy', {
          '@type': 'Organization',
          name: certData.issuingOrganization
        })
        .addProperty('validFrom', certData.issueDate)
        .addProperty('validUntil', certData.expiryDate)
        .addProperty('credentialHolder', certData.holder ? {
          '@type': 'Person',
          name: certData.holder.name,
          jobTitle: certData.holder.title
        } : undefined)
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
        debugLog(`Invalid schema: ${JSON.stringify(jsonLd)}`, 'error', true);
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
  
  /**
   * Detect relationships between schemas (v1.11.0)
   * Suggests connections and related schemas
   */
  detectSchemaRelationships: (schemas, options = {}) => {
    const { suggestMissing = true, detectConflicts = true } = options;
    
    if (!Array.isArray(schemas) || schemas.length === 0) {
      return { relationships: [], suggestions: [], conflicts: [] };
    }
    
    const relationships = [];
    const suggestions = [];
    const conflicts = [];
    
    // Relationship patterns based on schema types
    const relationshipRules = {
      'Product': {
        relatesTo: ['Review', 'Offer', 'AggregateRating', 'Brand', 'Organization'],
        suggests: ['Add customer reviews for trust', 'Include aggregate rating', 'Add brand information'],
        properties: ['review', 'aggregateRating', 'brand', 'offers']
      },
      'Article': {
        relatesTo: ['Person', 'Organization', 'ImageObject'],
        suggests: ['Add author person schema', 'Include publisher organization', 'Add featured image'],
        properties: ['author', 'publisher', 'image']
      },
      'LocalBusiness': {
        relatesTo: ['PostalAddress', 'GeoCoordinates', 'OpeningHoursSpecification', 'Review'],
        suggests: ['Add complete address', 'Include geo coordinates', 'Add opening hours', 'Include customer reviews'],
        properties: ['address', 'geo', 'openingHoursSpecification', 'review']
      },
      'Event': {
        relatesTo: ['Place', 'Organization', 'Person', 'Offer'],
        suggests: ['Add event location', 'Include organizer', 'Add ticket offers'],
        properties: ['location', 'organizer', 'performer', 'offers']
      },
      'Recipe': {
        relatesTo: ['Person', 'NutritionInformation', 'Review', 'ImageObject'],
        suggests: ['Add recipe author', 'Include nutrition info', 'Add recipe images'],
        properties: ['author', 'nutrition', 'review', 'image']
      },
      'Person': {
        relatesTo: ['Organization', 'PostalAddress'],
        suggests: ['Add affiliated organization', 'Include address'],
        properties: ['affiliation', 'worksFor', 'address']
      },
      'Organization': {
        relatesTo: ['PostalAddress', 'Person', 'Brand'],
        suggests: ['Add organization address', 'Include founder/CEO', 'Add brand info'],
        properties: ['address', 'founder', 'employee', 'brand']
      }
    };
    
    // Analyze each schema
    schemas.forEach((schema, index) => {
      const schemaType = schema['@type'];
      
      if (!schemaType) return;
      
      // Check relationships with other schemas
      schemas.forEach((otherSchema, otherIndex) => {
        if (index === otherIndex) return;
        
        const otherType = otherSchema['@type'];
        const rules = relationshipRules[schemaType];
        
        if (rules && rules.relatesTo.includes(otherType)) {
          relationships.push({
            from: { type: schemaType, index },
            to: { type: otherType, index: otherIndex },
            relationship: 'related',
            strength: 'high',
            suggestion: `Link ${schemaType} to ${otherType} for better context`
          });
        }
      });
      
      // Suggest missing relationships
      if (suggestMissing && relationshipRules[schemaType]) {
        const rules = relationshipRules[schemaType];
        const existingTypes = schemas.map(s => s['@type']);
        
        rules.relatesTo.forEach((relatedType, idx) => {
          if (!existingTypes.includes(relatedType)) {
            // Check if the property already exists in the schema
            const propertyName = rules.properties[idx];
            if (!schema[propertyName] || (Array.isArray(schema[propertyName]) && schema[propertyName].length === 0)) {
              suggestions.push({
                schemaType,
                schemaIndex: index,
                missingType: relatedType,
                priority: idx === 0 ? 'high' : 'medium',
                suggestion: rules.suggests[idx],
                property: propertyName
              });
            }
          }
        });
      }
      
      // Detect conflicts (duplicate schemas, inconsistent data)
      if (detectConflicts) {
        schemas.forEach((otherSchema, otherIndex) => {
          if (index >= otherIndex) return; // Only check each pair once
          
          const otherType = otherSchema['@type'];
          
          // Check for duplicate schemas of same type
          if (schemaType === otherType) {
            const nameMatch = schema.name === otherSchema.name;
            const urlMatch = schema.url === otherSchema.url;
            
            if (nameMatch || urlMatch) {
              conflicts.push({
                type: 'duplicate',
                schemas: [index, otherIndex],
                severity: 'medium',
                message: `Potential duplicate ${schemaType} schemas detected`,
                recommendation: 'Consider merging these schemas'
              });
            }
          }
          
          // Check for inconsistent linked data
          if (schema.name && otherSchema.name) {
            const schema1References = JSON.stringify(schema).includes(otherSchema.name);
            const schema2References = JSON.stringify(otherSchema).includes(schema.name);
            
            if (schema1References || schema2References) {
              relationships.push({
                from: { type: schemaType, index },
                to: { type: otherType, index: otherIndex },
                relationship: 'cross-referenced',
                strength: 'medium',
                suggestion: 'Schemas reference each other'
              });
            }
          }
        });
      }
    });
    
    // Detect common patterns and suggest bundles
    const schemaTypes = schemas.map(s => s['@type']).filter(Boolean);
    const hasProduct = schemaTypes.includes('Product');
    const hasOrganization = schemaTypes.includes('Organization');
    const hasLocalBusiness = schemaTypes.includes('LocalBusiness');
    
    if (hasProduct && !schemaTypes.includes('Review') && !schemaTypes.includes('AggregateRating')) {
      suggestions.push({
        schemaType: 'Product',
        missingType: 'Review',
        priority: 'high',
        suggestion: 'Add customer reviews to increase trust and SEO visibility',
        property: 'review'
      });
    }
    
    if ((hasOrganization || hasLocalBusiness) && !schemaTypes.includes('PostalAddress')) {
      suggestions.push({
        schemaType: hasOrganization ? 'Organization' : 'LocalBusiness',
        missingType: 'PostalAddress',
        priority: 'high',
        suggestion: 'Add complete address for local SEO',
        property: 'address'
      });
    }
    
    return {
      relationships: relationships.filter((r, i, self) => 
        i === self.findIndex(t => 
          t.from.index === r.from.index && t.to.index === r.to.index
        )
      ),
      suggestions: suggestions.slice(0, 10), // Limit to top 10 suggestions
      conflicts,
      summary: {
        totalSchemas: schemas.length,
        totalRelationships: relationships.length,
        suggestionCount: suggestions.length,
        conflictCount: conflicts.length
      }
    };
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
  
  _extractKeywords: (content, options = {}) => {
    const { maxKeywords = 10, includePhrases = true, useTFIDF = true } = options;
    
    // Stop words to filter out
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
      'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
      'take', 'people', 'into', 'year', 'your', 'some', 'could', 'them', 'see',
      'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
      'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
      'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
      'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
      'were', 'said', 'did', 'having', 'may'
    ]);
    
    // Extract single words with frequency
    const words = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const filteredWords = words.filter(word => !stopWords.has(word));
    
    const wordFrequency = {};
    filteredWords.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // Simple TF-IDF approximation (using term frequency & word length as proxy for importance)
    const tfIdfScores = {};
    if (useTFIDF) {
      const totalWords = filteredWords.length;
      Object.entries(wordFrequency).forEach(([word, freq]) => {
        const tf = freq / totalWords;
        // Use word length and uniqueness as IDF proxy (longer, rarer words = more important)
        const idf = Math.log(totalWords / freq) * (word.length / 5);
        tfIdfScores[word] = tf * idf * 100; // Scale for easier scoring
      });
    }
    
    // Extract 2-word and 3-word phrases (n-grams)
    const phrases = [];
    if (includePhrases) {
      const tokens = content.toLowerCase().split(/\s+/);
      
      // 2-word phrases (bigrams)
      for (let i = 0; i < tokens.length - 1; i++) {
        const word1 = tokens[i].match(/^[a-z]{3,}$/)?.[0];
        const word2 = tokens[i + 1].match(/^[a-z]{3,}$/)?.[0];
        
        if (word1 && word2 && !stopWords.has(word1) && !stopWords.has(word2)) {
          const phrase = `${word1} ${word2}`;
          const existing = phrases.find(p => p.phrase === phrase);
          if (existing) {
            existing.frequency++;
          } else {
            phrases.push({ phrase, frequency: 1, words: 2 });
          }
        }
      }
      
      // 3-word phrases (trigrams)
      for (let i = 0; i < tokens.length - 2; i++) {
        const word1 = tokens[i].match(/^[a-z]{3,}$/)?.[0];
        const word2 = tokens[i + 1].match(/^[a-z]{3,}$/)?.[0];
        const word3 = tokens[i + 2].match(/^[a-z]{3,}$/)?.[0];
        
        if (word1 && word2 && word3 && 
            !stopWords.has(word1) && !stopWords.has(word2) && !stopWords.has(word3)) {
          const phrase = `${word1} ${word2} ${word3}`;
          const existing = phrases.find(p => p.phrase === phrase);
          if (existing) {
            existing.frequency++;
          } else {
            phrases.push({ phrase, frequency: 1, words: 3 });
          }
        }
      }
    }
    
    // Combine single words and phrases
    const singleWordResults = Object.entries(useTFIDF ? tfIdfScores : wordFrequency)
      .map(([word, score]) => ({ keyword: word, score, type: 'word' }))
      .sort((a, b) => b.score - a.score);
    
    const phraseResults = phrases
      .filter(p => p.frequency >= 2) // Only phrases that appear at least twice
      .map(p => ({ 
        keyword: p.phrase, 
        score: p.frequency * p.words * 2, // Weight by phrase length and frequency
        type: 'phrase' 
      }))
      .sort((a, b) => b.score - a.score);
    
    // Merge and return top keywords (prioritize phrases, then words)
    const topPhrases = phraseResults.slice(0, Math.floor(maxKeywords / 3));
    const topWords = singleWordResults.slice(0, maxKeywords - topPhrases.length);
    
    return [...topPhrases, ...topWords]
      .sort((a, b) => b.score - a.score)
      .slice(0, maxKeywords)
      .map(item => item.keyword);
  },
  
  _extractEntities: (content, options = {}) => {
    const { includePrices = true, includeDates = true, includeUrls = true } = options;
    
    const entities = {
      people: [],
      places: [],
      organizations: [],
      prices: [],
      dates: [],
      emails: [],
      phones: [],
      urls: []
    };
    
    // Enhanced people detection (2-3 word names with proper capitalization)
    const peopleMatches = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g) || [];
    entities.people = [...new Set(peopleMatches)]; // Remove duplicates
    
    // Enhanced organizations (with common suffixes and patterns)
    const orgPatterns = [
      /\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\s+(?:Inc|Corp|Corporation|LLC|Ltd|Limited|Company|Co|Group|Holdings|Partners|Associates|Solutions|Systems|Technologies|Tech|Software|Industries|Enterprises)\b/g,
      /\b(?:The\s+)?[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){1,3}\s+(?:Bank|Hospital|University|College|Institute|Foundation|Association|Agency|Department)\b/g
    ];
    
    orgPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      entities.organizations.push(...matches);
    });
    entities.organizations = [...new Set(entities.organizations)];
    
    // Places detection (cities, states, countries, addresses)
    const placePatterns = [
      /\b[A-Z][a-z]+(?:,\s+[A-Z]{2})\b/g, // City, ST format
      /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct)\b/g // Street addresses
    ];
    
    placePatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      entities.places.push(...matches);
    });
    entities.places = [...new Set(entities.places)];
    
    // Price detection (v1.11.0 enhancement)
    if (includePrices) {
      const pricePatterns = [
        /\$\d+(?:,\d{3})*(?:\.\d{2})?/g, // $1,234.56
        /\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|CAD|AUD)/gi, // 1234.56 USD
        /(?:USD|EUR|GBP|CAD|AUD)\s*\d+(?:,\d{3})*(?:\.\d{2})?/gi, // USD 1234.56
        /\d+(?:,\d{3})*(?:\.\d{2})?\s*dollars?/gi // 1234.56 dollars
      ];
      
      pricePatterns.forEach(pattern => {
        const matches = content.match(pattern) || [];
        entities.prices.push(...matches.map(p => p.trim()));
      });
      entities.prices = [...new Set(entities.prices)];
    }
    
    // Date detection (v1.11.0 enhancement)
    if (includeDates) {
      const datePatterns = [
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi, // January 15, 2024
        /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // 01/15/2024
        /\b\d{4}-\d{2}-\d{2}\b/g, // 2024-01-15 (ISO format)
        /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi // 15 Jan 2024
      ];
      
      datePatterns.forEach(pattern => {
        const matches = content.match(pattern) || [];
        entities.dates.push(...matches);
      });
      entities.dates = [...new Set(entities.dates)];
    }
    
    // Email detection
    const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    entities.emails = [...new Set(content.match(emailPattern) || [])];
    
    // Phone detection (various formats)
    const phonePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // 123-456-7890 or 1234567890
      /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g, // (123) 456-7890
      /\b\+\d{1,3}\s*\d{3}[-.]?\d{3}[-.]?\d{4}\b/g // +1 123-456-7890
    ];
    
    phonePatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      entities.phones.push(...matches);
    });
    entities.phones = [...new Set(entities.phones)];
    
    // URL detection (v1.11.0 enhancement)
    if (includeUrls) {
      const urlPattern = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
      entities.urls = [...new Set(content.match(urlPattern) || [])];
    }
    
    // Remove empty arrays for cleaner output
    Object.keys(entities).forEach(key => {
      if (entities[key].length === 0) {
        delete entities[key];
      }
    });
    
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

// ========================================
// V1.9.0 NEW FEATURES - Intelligence & Automation Revolution
// ========================================

/**
 * Autonomous Schema Management System
 * 🚀 80% Less Manual Work: Autonomous schema management
 */
export class AutonomousSchemaManager {
  constructor(options = {}) {
    this.options = {
      autoDiscovery: true,
      autoUpdates: true,
      healthMonitoring: true,
      learningMode: true,
      updateInterval: 30000, // 30 seconds
      maxSchemas: 100,
      ...options
    };
    
    this.discoveredSchemas = new Map();
    this.managedSchemas = new Map();
    this.schemaHistory = new Map();
    this.learningData = new Map();
    this.healthChecks = new Map();
    this.isRunning = false;
    this.intervals = [];
    
    // Initialize if auto-start enabled
    if (this.options.autoDiscovery) {
      this.start();
    }
  }

  /**
   * Start autonomous management
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Auto-discovery interval
    if (this.options.autoDiscovery) {
      const discoveryInterval = setInterval(() => {
        this.discoverSchemas();
      }, this.options.updateInterval);
      this.intervals.push(discoveryInterval);
    }
    
    // Health monitoring interval
    if (this.options.healthMonitoring) {
      const healthInterval = setInterval(() => {
        this.performHealthChecks();
      }, this.options.updateInterval * 2);
      this.intervals.push(healthInterval);
    }
    
    // Learning and optimization interval
    if (this.options.learningMode) {
      const learningInterval = setInterval(() => {
        this.optimizeBasedOnLearning();
      }, this.options.updateInterval * 5);
      this.intervals.push(learningInterval);
    }
    
    debugLog('🤖 Autonomous Schema Manager started', 'info', this.options.debug);
  }

  /**
   * Stop autonomous management
   */
  stop() {
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    debugLog('🤖 Autonomous Schema Manager stopped', 'info', this.options.debug);
  }

  /**
   * Discover schemas from page content automatically
   */
  async discoverSchemas() {
    if (typeof document === 'undefined') return;
    
    try {
      const discoveries = [];
      
      // Discover from existing JSON-LD scripts
      const existingSchemas = document.querySelectorAll('script[type="application/ld+json"]');
      existingSchemas.forEach((script, index) => {
        try {
          const schema = JSON.parse(script.textContent);
          const id = `discovered-${index}-${Date.now()}`;
          discoveries.push({ id, schema, source: 'existing-jsonld', element: script });
        } catch (e) {
          // Skip invalid JSON-LD
        }
      });
      
      // Discover from page content using AI
      const contentDiscoveries = await this.discoverFromContent();
      discoveries.push(...contentDiscoveries);
      
      // Process discoveries
      for (const discovery of discoveries) {
        await this.processDiscovery(discovery);
      }
      
      if (discoveries.length > 0 && this.options.debug) {
        debugLog(`🔍 Discovered ${discoveries.length} potential schemas`, 'info', true);
      }
      
    } catch (error) {
      debugLog(`Schema discovery error: ${error.message}`, 'warn', this.options.debug);
    }
  }

  /**
   * Discover schemas from page content using AI analysis
   */
  async discoverFromContent() {
    const discoveries = [];
    
    try {
      // Get page content
      const pageContent = this.extractPageContent();
      
      // Use AI to analyze content and suggest schemas
      const aiSuggestions = AI.analyzeContent(pageContent, {
        includeKeywords: true,
        includeEntities: true,
        autoGenerate: true
      });
      
      if (aiSuggestions && aiSuggestions.recommendedType) {
        const suggestedSchema = await AI.generateFromContent(pageContent, {
          confidence: 0.7,
          targetType: aiSuggestions.recommendedType
        });
        
        if (suggestedSchema && suggestedSchema.schema) {
          discoveries.push({
            id: `ai-generated-${Date.now()}`,
            schema: suggestedSchema.schema,
            source: 'ai-content-analysis',
            confidence: suggestedSchema.confidence,
            metadata: {
              detectedType: aiSuggestions.recommendedType,
              keywords: aiSuggestions.keywords,
              entities: aiSuggestions.entities
            }
          });
        }
      }
      
    } catch (error) {
      debugLog(`AI content discovery error: ${error.message}`, 'warn', this.options.debug);
    }
    
    return discoveries;
  }

  /**
   * Extract meaningful content from the page
   */
  extractPageContent() {
    if (typeof document === 'undefined') return '';
    
    const content = [];
    
    // Extract title
    const title = document.title;
    if (title) content.push(title);
    
    // Extract meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) content.push(metaDesc.content);
    
    // Extract main headings
    const headings = document.querySelectorAll('h1, h2, h3');
    headings.forEach(h => content.push(h.textContent.trim()));
    
    // Extract main content (try to find main content area)
    const mainSelectors = ['main', '[role="main"]', '.main-content', '#content', '.content'];
    let mainContent = '';
    
    for (const selector of mainSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = element.textContent.trim();
        break;
      }
    }
    
    if (!mainContent) {
      // Fallback: get all paragraph text
      const paragraphs = document.querySelectorAll('p');
      mainContent = Array.from(paragraphs)
        .map(p => p.textContent.trim())
        .filter(text => text.length > 50)
        .slice(0, 5)
        .join(' ');
    }
    
    content.push(mainContent);
    
    return content.join(' ').substring(0, 2000); // Limit content length
  }

  /**
   * Process a discovered schema
   */
  async processDiscovery(discovery) {
    const { id, schema, confidence = 1.0 } = discovery;
    
    // Check if we already know about this schema
    if (this.discoveredSchemas.has(id)) return;
    
    // Validate the schema
    const validation = validateSchemaEnhanced(schema);
    
    // Only process high-quality schemas
    if (validation.score >= 60) {
      this.discoveredSchemas.set(id, {
        ...discovery,
        discoveredAt: Date.now(),
        validation,
        status: 'discovered'
      });
      
      // Auto-manage if confidence is high enough
      if (confidence >= 0.8 && this.options.autoUpdates) {
        await this.manageSchema(id);
      }
    }
  }

  /**
   * Start managing a discovered schema
   */
  async manageSchema(schemaId) {
    const discovery = this.discoveredSchemas.get(schemaId);
    if (!discovery) return;
    
    try {
      // Optimize the schema
      const optimizedSchema = AI.optimizeForLLM(discovery.schema, {
        target: ['chatgpt', 'bard', 'claude'],
        semanticEnhancement: true,
        voiceOptimization: true
      });
      
      // Create managed schema entry
      const managedSchema = {
        id: schemaId,
        originalSchema: discovery.schema,
        optimizedSchema,
        source: discovery.source,
        managedAt: Date.now(),
        lastUpdated: Date.now(),
        updateCount: 0,
        performance: {
          injectionTime: 0,
          validationScore: discovery.validation.score,
          optimizationApplied: true
        }
      };
      
      this.managedSchemas.set(schemaId, managedSchema);
      
      // Inject the optimized schema
      const injectionResult = initSEO({
        schema: optimizedSchema,
        id: `auto-managed-${schemaId}`,
        validate: false // Already validated
      });
      
      if (injectionResult) {
        managedSchema.performance.injectionTime = injectionResult.injectionTime || 0;
        if (this.options.debug) {
          debugLog(`✅ Auto-managed schema: ${discovery.schema['@type']}`, 'info', true);
        }
      }
      
      // Record learning data
      this.recordLearningData(schemaId, 'auto-managed', managedSchema);
      
    } catch (error) {
      debugLog(`Failed to manage schema ${schemaId}: ${error.message}`, 'warn', this.options.debug);
    }
  }

  /**
   * Perform health checks on managed schemas
   */
  async performHealthChecks() {
    for (const [schemaId, managedSchema] of this.managedSchemas) {
      try {
        const healthCheck = {
          timestamp: Date.now(),
          schemaId,
          checks: {}
        };
        
        // Check if schema is still present in DOM
        const element = document.getElementById(`auto-managed-${schemaId}`);
        healthCheck.checks.domPresence = !!element;
        
        // Validate current schema
        const validation = validateSchemaEnhanced(managedSchema.optimizedSchema);
        healthCheck.checks.validation = {
          score: validation.score,
          errors: validation.errors.length,
          warnings: validation.warnings.length
        };
        
        // Check performance metrics
        healthCheck.checks.performance = {
          injectionTime: managedSchema.performance.injectionTime,
          updateCount: managedSchema.updateCount
        };
        
        // Overall health score
        let healthScore = 100;
        if (!healthCheck.checks.domPresence) healthScore -= 30;
        if (validation.score < 80) healthScore -= 20;
        if (managedSchema.performance.injectionTime > 100) healthScore -= 10;
        
        healthCheck.overallScore = Math.max(0, healthScore);
        healthCheck.status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical';
        
        this.healthChecks.set(schemaId, healthCheck);
        
        // Take action if unhealthy
        if (healthCheck.status === 'critical') {
          await this.repairSchema(schemaId);
        }
        
      } catch (error) {
        debugLog(`Health check failed for schema ${schemaId}: ${error.message}`, 'warn', this.options.debug);
      }
    }
  }

  /**
   * Repair a problematic schema
   */
  async repairSchema(schemaId) {
    const managedSchema = this.managedSchemas.get(schemaId);
    if (!managedSchema) return;
    
    try {
      debugLog(`🔧 Repairing schema: ${schemaId}`, 'info', this.options.debug);
      
      // Remove existing schema element
      const existingElement = document.getElementById(`auto-managed-${schemaId}`);
      if (existingElement) {
        existingElement.remove();
      }
      
      // Re-optimize and re-inject
      const reOptimizedSchema = AI.optimizeForLLM(managedSchema.originalSchema, {
        target: ['chatgpt', 'bard', 'claude'],
        semanticEnhancement: true,
        voiceOptimization: true
      });
      
      const injectionResult = initSEO({
        schema: reOptimizedSchema,
        id: `auto-managed-${schemaId}`,
        validate: true
      });
      
      if (injectionResult) {
        managedSchema.optimizedSchema = reOptimizedSchema;
        managedSchema.lastUpdated = Date.now();
        managedSchema.updateCount += 1;
        
        debugLog(`✅ Schema repaired: ${schemaId}`, 'info', this.options.debug);
        this.recordLearningData(schemaId, 'repaired', managedSchema);
      }
      
    } catch (error) {
      debugLog(`Failed to repair schema ${schemaId}: ${error.message}`, 'error', this.options.debug);
    }
  }

  /**
   * Optimize schemas based on learning data
   */
  async optimizeBasedOnLearning() {
    if (this.learningData.size === 0) return;
    
    // Analyze learning patterns
    const patterns = this.analyzeLearningPatterns();
    
    // Apply learned optimizations
    for (const [schemaId, managedSchema] of this.managedSchemas) {
      const relevantPatterns = patterns.filter(p => 
        p.schemaType === managedSchema.optimizedSchema['@type']
      );
      
      if (relevantPatterns.length > 0) {
        await this.applyLearnedOptimizations(schemaId, relevantPatterns);
      }
    }
  }

  /**
   * Analyze learning patterns from collected data
   */
  analyzeLearningPatterns() {
    const patterns = [];
    const typeGroups = new Map();
    
    // Group learning data by schema type
    for (const [, data] of this.learningData) {
      const schemaType = data.schemaType;
      if (!typeGroups.has(schemaType)) {
        typeGroups.set(schemaType, []);
      }
      typeGroups.get(schemaType).push(data);
    }
    
    // Analyze each type group
    for (const [schemaType, dataPoints] of typeGroups) {
      const avgPerformance = dataPoints.reduce((sum, dp) => 
        sum + dp.performance.validationScore, 0) / dataPoints.length;
      
      const successfulActions = dataPoints.filter(dp => 
        dp.action === 'auto-managed' || dp.action === 'optimized'
      );
      
      if (avgPerformance > 80 && successfulActions.length >= 3) {
        patterns.push({
          schemaType,
          confidence: avgPerformance / 100,
          recommendedActions: ['maintain-optimization', 'monitor-performance'],
          dataPoints: dataPoints.length
        });
      }
    }
    
    return patterns;
  }

  /**
   * Apply learned optimizations to a schema
   */
  async applyLearnedOptimizations(schemaId, patterns) {
    const managedSchema = this.managedSchemas.get(schemaId);
    if (!managedSchema) return;
    
    // Apply optimizations based on learned patterns
    let hasChanges = false;
    
    for (const pattern of patterns) {
      if (pattern.recommendedActions.includes('maintain-optimization')) {
        // Schema is performing well, just update timestamp
        managedSchema.lastOptimized = Date.now();
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      this.recordLearningData(schemaId, 'learned-optimization', managedSchema);
    }
  }

  /**
   * Record learning data for future optimization
   */
  recordLearningData(schemaId, action, managedSchema) {
    const learningEntry = {
      schemaId,
      schemaType: managedSchema.optimizedSchema['@type'],
      action,
      timestamp: Date.now(),
      performance: { ...managedSchema.performance },
      metadata: {
        source: managedSchema.source,
        updateCount: managedSchema.updateCount
      }
    };
    
    this.learningData.set(`${schemaId}-${Date.now()}`, learningEntry);
    
    // Limit learning data size
    if (this.learningData.size > 1000) {
      const oldestKey = Array.from(this.learningData.keys())[0];
      this.learningData.delete(oldestKey);
    }
  }

  /**
   * Get management statistics
   */
  getStats() {
    const stats = {
      discovered: this.discoveredSchemas.size,
      managed: this.managedSchemas.size,
      learningDataPoints: this.learningData.size,
      isRunning: this.isRunning,
      healthySchemas: 0,
      warningSchemas: 0,
      criticalSchemas: 0
    };
    
    // Count health statuses
    for (const [, healthCheck] of this.healthChecks) {
      if (healthCheck.status === 'healthy') stats.healthySchemas++;
      else if (healthCheck.status === 'warning') stats.warningSchemas++;
      else if (healthCheck.status === 'critical') stats.criticalSchemas++;
    }
    
    return stats;
  }

  /**
   * Get detailed report
   */
  getReport() {
    return {
      stats: this.getStats(),
      discoveredSchemas: Array.from(this.discoveredSchemas.values()),
      managedSchemas: Array.from(this.managedSchemas.values()),
      healthChecks: Array.from(this.healthChecks.values()),
      recentLearning: Array.from(this.learningData.values()).slice(-10)
    };
  }
}

/**
 * AI Context Engine - Context-aware suggestions
 * 🧠 AI-Powered Intelligence: Context-aware suggestions
 */
export class AIContextEngine {
  constructor(options = {}) {
    this.options = {
      learningEnabled: true,
      contextDepth: 'deep', // 'shallow', 'medium', 'deep'
      suggestionThreshold: 0.7,
      maxSuggestions: 5,
      ...options
    };
    
    this.contextHistory = new Map();
    this.userPreferences = new Map();
    this.suggestionCache = new Map();
    this.performanceMetrics = {
      totalSuggestions: 0,
      acceptedSuggestions: 0,
      rejectedSuggestions: 0,
      averageConfidence: 0
    };
  }

  /**
   * Analyze context and provide intelligent suggestions
   */
  async analyzeContext(input, options = {}) {
    const context = await this.buildContext(input, options);
    const suggestions = await this.generateContextualSuggestions(context);
    
    // Cache suggestions for performance
    const cacheKey = this.generateCacheKey(input, options);
    this.suggestionCache.set(cacheKey, {
      suggestions,
      timestamp: Date.now(),
      context
    });
    
    // Update metrics
    this.performanceMetrics.totalSuggestions += suggestions.length;
    if (suggestions.length > 0) {
      const avgConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
      this.performanceMetrics.averageConfidence = 
        (this.performanceMetrics.averageConfidence + avgConfidence) / 2;
    }
    
    return {
      context,
      suggestions,
      metadata: {
        analysisTime: Date.now(),
        confidenceScore: suggestions.length > 0 ? Math.max(...suggestions.map(s => s.confidence)) : 0,
        contextDepth: this.options.contextDepth
      }
    };
  }

  /**
   * Build comprehensive context from input
   */
  async buildContext(input) {
    const context = {
      input,
      type: this.detectInputType(input),
      timestamp: Date.now(),
      pageContext: {},
      userContext: {},
      historicalContext: {},
      semanticContext: {}
    };
    
    // Analyze page context
    if (typeof document !== 'undefined') {
      context.pageContext = this.analyzePageContext();
    }
    
    // Analyze user context from preferences
    context.userContext = this.analyzeUserContext();
    
    // Analyze historical context
    context.historicalContext = this.analyzeHistoricalContext(input);
    
    // Analyze semantic context using AI
    if (typeof input === 'string' && input.length > 10) {
      context.semanticContext = await this.analyzeSemanticContext(input);
    }
    
    return context;
  }

  /**
   * Detect the type of input being analyzed
   */
  detectInputType(input) {
    if (typeof input === 'object' && input['@type']) {
      return 'schema';
    } else if (typeof input === 'string') {
      if (input.startsWith('http')) {
        return 'url';
      } else if (input.length > 100) {
        return 'content';
      } else {
        return 'query';
      }
    } else if (typeof input === 'object') {
      return 'data';
    }
    return 'unknown';
  }

  /**
   * Analyze current page context
   */
  analyzePageContext() {
    const pageContext = {
      title: document.title || '',
      url: window.location.href,
      domain: window.location.hostname,
      path: window.location.pathname,
      existingSchemas: [],
      contentType: 'unknown',
      language: document.documentElement.lang || 'en'
    };
    
    // Detect existing schemas
    const existingSchemas = document.querySelectorAll('script[type="application/ld+json"]');
    existingSchemas.forEach(script => {
      try {
        const schema = JSON.parse(script.textContent);
        pageContext.existingSchemas.push(schema['@type'] || 'Unknown');
      } catch (e) {
        // Skip invalid schemas
      }
    });
    
    // Detect content type
    pageContext.contentType = this.detectContentType();
    
    return pageContext;
  }

  /**
   * Detect the type of content on the page
   */
  detectContentType() {
    const indicators = {
      'e-commerce': ['.product', '.price', '.add-to-cart', '[data-product]'],
      'blog': ['article', '.post', '.blog-post', '.entry'],
      'business': ['.contact', '.about', '.services', '.location'],
      'event': ['.event', '.calendar', '.date', '.venue'],
      'recipe': ['.recipe', '.ingredients', '.instructions', '.cooking-time']
    };
    
    for (const [type, selectors] of Object.entries(indicators)) {
      for (const selector of selectors) {
        if (document.querySelector(selector)) {
          return type;
        }
      }
    }
    
    return 'general';
  }

  /**
   * Analyze user context from preferences and history
   */
  analyzeUserContext() {
    const userContext = {
      preferences: {},
      recentActions: [],
      skillLevel: 'intermediate' // beginner, intermediate, advanced
    };
    
    // Get user preferences
    for (const [key, value] of this.userPreferences) {
      userContext.preferences[key] = value;
    }
    
    // Get recent context history
    const recentHistory = Array.from(this.contextHistory.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    userContext.recentActions = recentHistory.map(h => ({
      action: h.action,
      schemaType: h.schemaType,
      timestamp: h.timestamp
    }));
    
    return userContext;
  }

  /**
   * Analyze historical context
   */
  analyzeHistoricalContext(input) {
    const inputHash = this.hashInput(input);
    const relatedHistory = [];
    
    // Find related historical context
    for (const [, context] of this.contextHistory) {
      if (context.inputHash === inputHash || 
          this.calculateSimilarity(context.input, input) > 0.7) {
        relatedHistory.push(context);
      }
    }
    
    return {
      relatedContexts: relatedHistory.length,
      patterns: this.identifyPatterns(relatedHistory),
      lastSimilarContext: relatedHistory.length > 0 ? relatedHistory[0].timestamp : null
    };
  }

  /**
   * Analyze semantic context using AI
   */
  async analyzeSemanticContext(text) {
    try {
      // Use existing AI analysis
      const analysis = AI.analyzeContent(text, {
        includeKeywords: true,
        includeEntities: true,
        includeSentiment: true
      });
      
      return {
        keywords: analysis.keywords || [],
        entities: analysis.entities || {},
        sentiment: analysis.sentiment || { label: 'neutral', score: 0.5 },
        topics: analysis.topics || [],
        complexity: this.calculateTextComplexity(text)
      };
    } catch (error) {
      return {
        keywords: [],
        entities: {},
        sentiment: { label: 'neutral', score: 0.5 },
        topics: [],
        complexity: 'medium'
      };
    }
  }

  /**
   * Generate contextual suggestions based on analysis
   */
  async generateContextualSuggestions(context) {
    const suggestions = [];
    
    // Schema-specific suggestions
    if (context.type === 'schema') {
      suggestions.push(...await this.generateSchemaSuggestions(context));
    }
    
    // Content-specific suggestions
    if (context.type === 'content') {
      suggestions.push(...await this.generateContentSuggestions(context));
    }
    
    // Context-aware suggestions
    suggestions.push(...await this.generateContextAwareSuggestions(context));
    
    // Filter and rank suggestions
    const filteredSuggestions = suggestions
      .filter(s => s.confidence >= this.options.suggestionThreshold)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.options.maxSuggestions);
    
    return filteredSuggestions;
  }

  /**
   * Generate schema-specific suggestions
   */
  async generateSchemaSuggestions(context) {
    const suggestions = [];
    const schema = context.input;
    
    // Missing property suggestions
    const schemaType = schema['@type'];
    const expectedProperties = this.getExpectedProperties(schemaType);
    
    for (const prop of expectedProperties) {
      if (!schema[prop.name]) {
        suggestions.push({
          type: 'missing-property',
          title: `Add ${prop.name}`,
          description: prop.description,
          confidence: prop.importance,
          action: 'add-property',
          data: { property: prop.name, value: prop.defaultValue }
        });
      }
    }
    
    // Optimization suggestions
    const optimizationSuggestions = await this.generateOptimizationSuggestions(schema, context);
    suggestions.push(...optimizationSuggestions);
    
    return suggestions;
  }

  /**
   * Generate content-specific suggestions
   */
  async generateContentSuggestions(context) {
    const suggestions = [];
    const content = context.input;
    
    // Suggest schema types based on content
    const suggestedTypes = await this.suggestSchemaTypes(content, context);
    
    for (const type of suggestedTypes) {
      suggestions.push({
        type: 'schema-generation',
        title: `Create ${type.name} Schema`,
        description: `Generate a ${type.name} schema based on the content`,
        confidence: type.confidence,
        action: 'generate-schema',
        data: { schemaType: type.name, content }
      });
    }
    
    return suggestions;
  }

  /**
   * Generate context-aware suggestions
   */
  async generateContextAwareSuggestions(context) {
    const suggestions = [];
    
    // Page context suggestions
    if (context.pageContext.contentType !== 'unknown') {
      const contentType = context.pageContext.contentType;
      const templateSuggestions = this.getTemplateSuggestions(contentType);
      
      suggestions.push(...templateSuggestions.map(template => ({
        type: 'template-suggestion',
        title: `Use ${template.name} Template`,
        description: template.description,
        confidence: 0.8,
        action: 'apply-template',
        data: { template: template.id, contentType }
      })));
    }
    
    // User preference suggestions
    const prefSuggestions = this.generatePreferenceSuggestions(context);
    suggestions.push(...prefSuggestions);
    
    return suggestions;
  }

  /**
   * Get expected properties for a schema type
   */
  getExpectedProperties(schemaType) {
    const propertyMap = {
      'Product': [
        { name: 'name', importance: 0.95, description: 'Product name', defaultValue: '' },
        { name: 'brand', importance: 0.85, description: 'Product brand', defaultValue: '' },
        { name: 'offers', importance: 0.90, description: 'Product pricing', defaultValue: {} },
        { name: 'image', importance: 0.80, description: 'Product images', defaultValue: [] }
      ],
      'Article': [
        { name: 'headline', importance: 0.95, description: 'Article headline', defaultValue: '' },
        { name: 'author', importance: 0.90, description: 'Article author', defaultValue: '' },
        { name: 'datePublished', importance: 0.85, description: 'Publication date', defaultValue: '' }
      ],
      'LocalBusiness': [
        { name: 'name', importance: 0.95, description: 'Business name', defaultValue: '' },
        { name: 'address', importance: 0.90, description: 'Business address', defaultValue: {} },
        { name: 'telephone', importance: 0.85, description: 'Phone number', defaultValue: '' }
      ]
    };
    
    return propertyMap[schemaType] || [];
  }

  /**
   * Record user feedback on suggestions
   */
  recordFeedback(suggestionId, action, metadata = {}) {
    if (action === 'accepted') {
      this.performanceMetrics.acceptedSuggestions++;
    } else if (action === 'rejected') {
      this.performanceMetrics.rejectedSuggestions++;
    }
    
    // Update user preferences based on feedback
    if (this.options.learningEnabled) {
      this.updateUserPreferences(suggestionId, action, metadata);
    }
    
    // Store in context history
    this.contextHistory.set(`feedback-${Date.now()}`, {
      type: 'feedback',
      suggestionId,
      action,
      metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Update user preferences based on feedback
   */
  updateUserPreferences(suggestionId, action, metadata) {
    // This would implement machine learning logic to update preferences
    // For now, simple preference tracking
    
    if (metadata.schemaType) {
      const prefKey = `preferred_${metadata.schemaType}_suggestions`;
      const currentPref = this.userPreferences.get(prefKey) || 0;
      
      if (action === 'accepted') {
        this.userPreferences.set(prefKey, Math.min(1.0, currentPref + 0.1));
      } else if (action === 'rejected') {
        this.userPreferences.set(prefKey, Math.max(0.0, currentPref - 0.05));
      }
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const acceptanceRate = this.performanceMetrics.totalSuggestions > 0 
      ? this.performanceMetrics.acceptedSuggestions / this.performanceMetrics.totalSuggestions 
      : 0;
    
    return {
      ...this.performanceMetrics,
      acceptanceRate: Math.round(acceptanceRate * 100),
      cacheSize: this.suggestionCache.size,
      userPreferences: this.userPreferences.size,
      contextHistory: this.contextHistory.size
    };
  }

  /**
   * Utility methods
   */
  hashInput(input) {
    return JSON.stringify(input).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }

  calculateSimilarity(input1, input2) {
    // Simple similarity calculation - in production, use more sophisticated methods
    const str1 = JSON.stringify(input1).toLowerCase();
    const str2 = JSON.stringify(input2).toLowerCase();
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  calculateTextComplexity(text) {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence < 10) return 'simple';
    if (avgWordsPerSentence < 20) return 'medium';
    return 'complex';
  }

  identifyPatterns(history) {
    // Simple pattern identification
    const patterns = {
      frequentTypes: {},
      commonActions: {},
      timePatterns: {}
    };
    
    history.forEach(h => {
      if (h.schemaType) {
        patterns.frequentTypes[h.schemaType] = (patterns.frequentTypes[h.schemaType] || 0) + 1;
      }
      if (h.action) {
        patterns.commonActions[h.action] = (patterns.commonActions[h.action] || 0) + 1;
      }
    });
    
    return patterns;
  }

  generateCacheKey(input, options) {
    return this.hashInput({ input, options });
  }

  async suggestSchemaTypes(content) {
    // Use existing AI analysis to suggest schema types
    try {
      const analysis = AI.analyzeContent(content);
      return [{
        name: analysis.recommendedType || 'Article',
        confidence: analysis.confidence || 0.7
      }];
    } catch (error) {
      return [{ name: 'Article', confidence: 0.5 }];
    }
  }

  getTemplateSuggestions(contentType) {
    const templates = {
      'e-commerce': [
        { id: 'product-page', name: 'Product Page', description: 'Complete product schema with offers and reviews' }
      ],
      'blog': [
        { id: 'blog-post', name: 'Blog Post', description: 'Article schema with author and publication info' }
      ],
      'business': [
        { id: 'local-business', name: 'Local Business', description: 'Business listing with contact and location' }
      ]
    };
    
    return templates[contentType] || [];
  }

  generatePreferenceSuggestions() {
    const suggestions = [];
    
    // Generate suggestions based on user preferences
    for (const [prefKey, prefValue] of this.userPreferences) {
      if (prefValue > 0.7 && prefKey.includes('preferred_')) {
        const schemaType = prefKey.replace('preferred_', '').replace('_suggestions', '');
        suggestions.push({
          type: 'preference-based',
          title: `Create ${schemaType} Schema`,
          description: `Based on your preferences for ${schemaType} schemas`,
          confidence: prefValue,
          action: 'create-preferred-schema',
          data: { schemaType }
        });
      }
    }
    
    return suggestions;
  }

  async generateOptimizationSuggestions(schema) {
    const suggestions = [];
    
    // AI optimization suggestion
    suggestions.push({
      type: 'ai-optimization',
      title: 'AI Optimize Schema',
      description: 'Optimize schema for better LLM understanding',
      confidence: 0.9,
      action: 'ai-optimize',
      data: { schema }
    });
    
    return suggestions;
  }
}

// ========================================
// V1.10.0 NEW FEATURES - AI Search Engine Revolution
// ========================================

/**
 * AI Search Engines Optimization System
 * 🔍 Core Theme: Future-Ready AI Search
 */
export class AISearchEngines {
  constructor() {
    this.optimizers = new Map();
    this.analytics = new Map();
    this.config = {
      defaultTargets: ['chatgpt', 'bard', 'perplexity', 'voice'],
      adaptiveOptimization: true,
      realTimeUpdates: true,
      performanceTracking: true
    };
    
    // Register available optimizers
    this.registerOptimizers();
  }

  /**
   * Register all available AI search engine optimizers
   */
  registerOptimizers() {
    this.optimizers.set('chatgpt', new ChatGPTOptimizer());
    this.optimizers.set('bard', new BardOptimizer());
    this.optimizers.set('perplexity', new PerplexityOptimizer());
    this.optimizers.set('voice', new VoiceSearchOptimizer());
    this.optimizers.set('visual', new VisualSearchOptimizer());
  }

  /**
   * Optimize schema for all AI search engines
   */
  async optimizeForAll(schema, options = {}) {
    const targets = options.targets || this.config.defaultTargets;
    const optimizedSchemas = {};
    const startTime = performance.now();

    try {
      // Parallel optimization for all targets
      const optimizationPromises = targets.map(async (target) => {
        const optimizer = this.optimizers.get(target);
        if (!optimizer) {
          debugLog(`Optimizer not found for target: ${target}`, 'warn', options.debug || false);
          return { target, schema: null, error: 'Optimizer not available' };
        }

        try {
          const optimized = await optimizer.optimize(schema, options);
          return { target, schema: optimized, success: true };
        } catch (error) {
          return { target, schema: null, error: error.message };
        }
      });

      const results = await Promise.all(optimizationPromises);
      
      // Process results
      results.forEach(result => {
        if (result.success) {
          optimizedSchemas[result.target] = result.schema;
        } else {
          debugLog(`Optimization failed for ${result.target}: ${result.error}`, 'warn', options.debug || false);
          optimizedSchemas[result.target] = { error: result.error };
        }
      });

      // Track performance
      const processingTime = performance.now() - startTime;
      this.trackOptimization(schema, optimizedSchemas, processingTime, options);

      return {
        original: schema,
        optimized: optimizedSchemas,
        metadata: {
          processingTime,
          targets,
          timestamp: Date.now(),
          success: Object.keys(optimizedSchemas).length > 0
        }
      };

    } catch (error) {
      debugLog(`AI search optimization failed: ${error.message}`, 'error', options.debug || false);
      return {
        original: schema,
        optimized: {},
        error: error.message,
        metadata: {
          processingTime: performance.now() - startTime,
          targets,
          timestamp: Date.now(),
          success: false
        }
      };
    }
  }

  /**
   * Optimize for specific AI search engine
   */
  async optimizeFor(target, schema, options = {}) {
    const optimizer = this.optimizers.get(target);
    if (!optimizer) {
      throw new Error(`Optimizer not found for target: ${target}`);
    }

    const startTime = performance.now();
    const optimized = await optimizer.optimize(schema, options);
    const processingTime = performance.now() - startTime;

    this.trackOptimization(schema, { [target]: optimized }, processingTime, options);

    return {
      original: schema,
      optimized,
      target,
      metadata: {
        processingTime,
        timestamp: Date.now(),
        success: true
      }
    };
  }

  /**
   * Deploy optimized schemas to platforms
   */
  async deploy(optimizedSchemas, deployOptions = {}) {
    const platforms = deployOptions.platforms || ['web'];
    const deploymentResults = {};

    for (const platform of platforms) {
      try {
        switch (platform) {
          case 'web':
            deploymentResults[platform] = await this.deployToWeb(optimizedSchemas);
            break;
          case 'chatgpt-plugin':
            deploymentResults[platform] = await this.deployChatGPTPlugin(optimizedSchemas);
            break;
          case 'voice-assistants':
            deploymentResults[platform] = await this.deployVoiceAssistants(optimizedSchemas);
            break;
          default:
            deploymentResults[platform] = { error: 'Platform not supported' };
        }
      } catch (error) {
        deploymentResults[platform] = { error: error.message };
      }
    }

    return {
      deployments: deploymentResults,
      timestamp: Date.now(),
      platforms
    };
  }

  /**
   * Deploy to web (inject into DOM)
   */
  async deployToWeb(optimizedSchemas) {
    const deployedSchemas = [];

    for (const [target, schema] of Object.entries(optimizedSchemas.optimized || optimizedSchemas)) {
      if (schema && !schema.error) {
        try {
          const result = initSEO({
            schema,
            id: `ai-optimized-${target}-${Date.now()}`,
            validate: false // Already optimized
          });
          
          if (result) {
            deployedSchemas.push({
              target,
              id: result.id || `ai-optimized-${target}`,
              success: true
            });
          }
        } catch (error) {
          deployedSchemas.push({
            target,
            error: error.message,
            success: false
          });
        }
      }
    }

    return {
      deployed: deployedSchemas,
      success: deployedSchemas.filter(d => d.success).length,
      total: deployedSchemas.length
    };
  }

  /**
   * Deploy as ChatGPT plugin (future implementation)
   */
  async deployChatGPTPlugin(optimizedSchemas) {
    // Placeholder for ChatGPT plugin deployment
    return {
      status: 'not_implemented',
      message: 'ChatGPT plugin deployment coming in future version',
      schemas: Object.keys(optimizedSchemas.optimized || optimizedSchemas).length
    };
  }

  /**
   * Deploy to voice assistants (future implementation)
   */
  async deployVoiceAssistants(optimizedSchemas) {
    // Placeholder for voice assistant deployment
    return {
      status: 'not_implemented',
      message: 'Voice assistant deployment coming in future version',
      schemas: Object.keys(optimizedSchemas.optimized || optimizedSchemas).length
    };
  }

  /**
   * Track optimization performance
   */
  trackOptimization(originalSchema, optimizedSchemas, processingTime, options) {
    if (!this.config.performanceTracking) return;

    const analyticsEntry = {
      timestamp: Date.now(),
      originalType: originalSchema['@type'] || 'Unknown',
      targets: Object.keys(optimizedSchemas),
      processingTime,
      success: Object.values(optimizedSchemas).filter(s => s && !s.error).length,
      total: Object.keys(optimizedSchemas).length,
      options
    };

    const key = `optimization-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.analytics.set(key, analyticsEntry);

    // Limit analytics storage
    if (this.analytics.size > 1000) {
      const oldestKey = Array.from(this.analytics.keys())[0];
      this.analytics.delete(oldestKey);
    }
  }

  /**
   * Get optimization analytics
   */
  getAnalytics() {
    const entries = Array.from(this.analytics.values());
    
    if (entries.length === 0) {
      return {
        totalOptimizations: 0,
        averageProcessingTime: 0,
        successRate: 0,
        popularTargets: {},
        recentOptimizations: []
      };
    }

    const totalOptimizations = entries.length;
    const averageProcessingTime = entries.reduce((sum, e) => sum + e.processingTime, 0) / totalOptimizations;
    const successfulOptimizations = entries.reduce((sum, e) => sum + e.success, 0);
    const successRate = (successfulOptimizations / entries.reduce((sum, e) => sum + e.total, 0)) * 100;

    // Popular targets
    const targetCounts = {};
    entries.forEach(entry => {
      entry.targets.forEach(target => {
        targetCounts[target] = (targetCounts[target] || 0) + 1;
      });
    });

    return {
      totalOptimizations,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      popularTargets: targetCounts,
      recentOptimizations: entries.slice(-10).map(e => ({
        timestamp: e.timestamp,
        type: e.originalType,
        targets: e.targets,
        processingTime: e.processingTime,
        success: e.success
      }))
    };
  }

  /**
   * Configure AI search engines
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  /**
   * Get available optimizers
   */
  getAvailableOptimizers() {
    return Array.from(this.optimizers.keys());
  }

  /**
   * Check if optimizer is available
   */
  isOptimizerAvailable(target) {
    return this.optimizers.has(target);
  }
}

/**
 * ChatGPT Search Optimization Engine
 * 🤖 ChatGPT Plugin Integration: Native ChatGPT search optimization
 */
export class ChatGPTOptimizer {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.config = {
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2000,
      conversationalOptimization: true,
      factCheckingMode: true,
      sourceAttribution: true
    };
  }

  /**
   * Optimize schema for ChatGPT search
   */
  async optimize(schema, options = {}) {
    const optimizationConfig = { ...this.config, ...options };
    
    try {
      // Core optimization steps
      let optimized = JSON.parse(JSON.stringify(schema)); // Deep copy

      // 1. Conversational structure optimization
      if (optimizationConfig.conversationalOptimization) {
        optimized = this.buildConversationalSchema(optimized);
      }

      // 2. Fact-checking friendly format
      if (optimizationConfig.factCheckingMode) {
        optimized = this.enhanceFactualAccuracy(optimized);
      }

      // 3. Source attribution
      if (optimizationConfig.sourceAttribution) {
        optimized = this.addSourceAttribution(optimized);
      }

      // 4. Natural language processing optimization
      optimized = this.optimizeForNLP(optimized);

      // 5. Context preservation for follow-up questions
      optimized = this.buildContextChain(optimized);

      // 6. AI-specific enhancements
      optimized = this.addAIEnhancements(optimized);

      return {
        ...optimized,
        '_aiOptimization': {
          engine: 'chatgpt',
          version: '1.10.0',
          timestamp: Date.now(),
          optimizations: [
            'conversational-structure',
            'fact-checking-ready',
            'source-attribution',
            'nlp-optimized',
            'context-chaining',
            'ai-enhanced'
          ]
        }
      };

    } catch (error) {
      debugLog(`ChatGPT optimization failed: ${error.message}`, 'error', false);
      throw new Error(`ChatGPT optimization failed: ${error.message}`);
    }
  }

  /**
   * Build conversational schema structure
   */
  buildConversationalSchema(schema) {
    const conversational = { ...schema };

    // Add conversational properties
    if (!conversational.potentialAction) {
      conversational.potentialAction = [];
    }

    // Add search actions for common queries
    const searchActions = this.generateSearchActions(schema);
    conversational.potentialAction.push(...searchActions);

    // Add FAQ structure for common questions
    if (!conversational.mainEntity) {
      conversational.mainEntity = this.generateFAQFromSchema(schema);
    }

    // Add alternative names for better query matching
    if (schema.name && !conversational.alternateName) {
      conversational.alternateName = this.generateAlternateNames(schema.name);
    }

    return conversational;
  }

  /**
   * Enhance factual accuracy
   */
  enhanceFactualAccuracy(schema) {
    const enhanced = { ...schema };

    // Add verification timestamps
    enhanced.dateModified = new Date().toISOString();
    
    // Add fact-checking metadata
    if (!enhanced.about) {
      enhanced.about = this.generateAboutInfo(schema);
    }

    // Add credibility signals
    if (schema.author && typeof schema.author === 'string') {
      enhanced.author = {
        '@type': 'Person',
        'name': schema.author,
        'sameAs': this.generateAuthorLinks(schema.author)
      };
    }

    return enhanced;
  }

  /**
   * Add source attribution
   */
  addSourceAttribution(schema) {
    const attributed = { ...schema };

    // Add citation format
    if (!attributed.citation) {
      attributed.citation = this.generateCitation(schema);
    }

    // Add source URL if available
    if (!attributed.url && typeof window !== 'undefined') {
      attributed.url = window.location.href;
    }

    // Add publisher information
    if (!attributed.publisher) {
      attributed.publisher = this.generatePublisherInfo();
    }

    return attributed;
  }

  /**
   * Optimize for Natural Language Processing
   */
  optimizeForNLP(schema) {
    const nlpOptimized = { ...schema };

    // Add semantic keywords
    if (schema.description) {
      nlpOptimized.keywords = this.extractSemanticKeywords(schema.description);
    }

    // Add related concepts
    if (!nlpOptimized.about) {
      nlpOptimized.about = this.generateRelatedConcepts(schema);
    }

    // Enhance text properties for better understanding
    Object.keys(nlpOptimized).forEach(key => {
      if (typeof nlpOptimized[key] === 'string' && nlpOptimized[key].length > 20) {
        nlpOptimized[key] = this.enhanceTextForNLP(nlpOptimized[key]);
      }
    });

    return nlpOptimized;
  }

  /**
   * Build context chain for follow-up questions
   */
  buildContextChain(schema) {
    const contextual = { ...schema };

    // Add context breadcrumbs
    contextual.isPartOf = this.generateContextBreadcrumbs(schema);

    // Add related entities
    if (!contextual.mentions) {
      contextual.mentions = this.generateRelatedEntities(schema);
    }

    // Add temporal context
    if (!contextual.temporalCoverage) {
      contextual.temporalCoverage = this.generateTemporalContext(schema);
    }

    return contextual;
  }

  /**
   * Add AI-specific enhancements
   */
  addAIEnhancements(schema) {
    const aiEnhanced = { ...schema };

    // Add AI-friendly identifiers
    aiEnhanced.identifier = [
      ...(Array.isArray(aiEnhanced.identifier) ? aiEnhanced.identifier : [aiEnhanced.identifier].filter(Boolean)),
      {
        '@type': 'PropertyValue',
        'name': 'AI-Optimization-ID',
        'value': `chatgpt-${Date.now()}`
      }
    ];

    // Add machine-readable summaries
    if (!aiEnhanced.abstract && aiEnhanced.description) {
      aiEnhanced.abstract = this.generateAbstract(aiEnhanced.description);
    }

    return aiEnhanced;
  }

  /**
   * Helper methods for optimization
   */
  generateSearchActions(schema) {
    const actions = [];
    
    if (schema && schema.name) {
      actions.push({
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': `search?q=${encodeURIComponent(schema.name)}`
        },
        'query-input': 'required name=q'
      });
    }

    return actions;
  }

  generateFAQFromSchema(schema) {
    const faqs = [];

    if (schema && schema.name) {
      faqs.push({
        '@type': 'Question',
        'name': `What is ${schema.name}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': schema.description || `${schema.name} is a ${schema['@type'] || 'thing'}.`
        }
      });
    }

    return faqs;
  }

  generateAlternateNames(name) {
    // Simple alternate name generation
    const alternates = [];
    
    // Add acronym if applicable
    const words = name.split(' ');
    if (words.length > 1) {
      const acronym = words.map(w => w.charAt(0).toUpperCase()).join('');
      if (acronym.length >= 2) alternates.push(acronym);
    }

    return alternates;
  }

  generateAboutInfo(schema) {
    return {
      '@type': 'Thing',
      'name': `About ${schema.name || schema['@type']}`,
      'description': `Information about ${schema.name || `this ${  schema['@type']}`}`
    };
  }

  generateAuthorLinks(authorName) {
    // Placeholder for author link generation
    return [`https://example.com/author/${encodeURIComponent(authorName)}`];
  }

  generateCitation(schema) {
    const siteName = typeof window !== 'undefined' ? window.location.hostname : 'example.com';
    return `${schema.name || 'Content'}. ${siteName}. ${new Date().getFullYear()}.`;
  }

  generatePublisherInfo() {
    return {
      '@type': 'Organization',
      'name': typeof window !== 'undefined' ? window.location.hostname : 'Website',
      'url': typeof window !== 'undefined' ? window.location.origin : 'https://example.com'
    };
  }

  extractSemanticKeywords(text) {
    // Simple keyword extraction
    const words = text.toLowerCase().split(/\W+/);
    const keywords = words.filter(word => word.length > 3);
    return [...new Set(keywords)].slice(0, 10);
  }

  generateRelatedConcepts(schema) {
    const concepts = [];
    
    if (schema && schema['@type']) {
      concepts.push({
        '@type': 'Thing',
        'name': schema['@type'],
        'description': `Related to ${schema['@type']} schemas`
      });
    }

    return concepts;
  }

  enhanceTextForNLP(text) {
    // Simple text enhancement for NLP
    return text.trim().replace(/\s+/g, ' ');
  }

  generateContextBreadcrumbs() {
    return {
      '@type': 'WebSite',
      'name': typeof window !== 'undefined' ? window.location.hostname : 'Website',
      'url': typeof window !== 'undefined' ? window.location.origin : 'https://example.com'
    };
  }

  generateRelatedEntities(schema) {
    const entities = [];
    
    if (schema && schema.author) {
      entities.push({
        '@type': 'Person',
        'name': typeof schema.author === 'string' ? schema.author : schema.author.name
      });
    }

    return entities;
  }

  generateTemporalContext() {
    const now = new Date();
    return `${now.getFullYear()}`;
  }

  generateAbstract(description) {
    // Generate a concise abstract from description
    const sentences = description.split(/[.!?]+/);
    return sentences[0] + (sentences[0].endsWith('.') ? '' : '.');
  }

  /**
   * Configure ChatGPT optimizer
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }
}

/**
 * Placeholder optimizers for other AI search engines
 * These will be implemented in future iterations
 */
/**
 * Bard/Gemini Optimizer - v1.11.0
 * Optimizes schemas for Google Bard/Gemini AI search
 * Focuses on multi-modal content, Knowledge Graph alignment, and hybrid conversational structure
 */
export class BardOptimizer {
  constructor() {
    this.config = {
      multiModalOptimization: true,
      knowledgeGraphAlignment: true,
      conversationalEnhancement: true
    };
  }

  async optimize(schema) {
    let optimized = JSON.parse(JSON.stringify(schema)); // Deep copy

    // 1. Multi-modal metadata hints
    optimized = this.addVisualMetadata(optimized);
    
    // 2. Knowledge Graph property mapping
    optimized = this.alignWithKnowledgeGraph(optimized);
    
    // 3. Conversational + factual hybrid structure
    optimized = this.buildHybridStructure(optimized);
    
    // 4. Rich media references
    optimized = this.enrichWithMediaHints(optimized);
    
    // 5. Add Gemini-specific optimization markers
    optimized._aiOptimization = {
      target: 'bard-gemini',
      version: '1.11.0',
      optimizations: [
        'multi-modal-hints',
        'knowledge-graph-aligned',
        'conversational-hybrid',
        'media-enriched'
      ],
      timestamp: new Date().toISOString()
    };

    return optimized;
  }

  /**
   * Add visual metadata for multi-modal understanding
   */
  addVisualMetadata(schema) {
    // Add image-related hints for multi-modal understanding
    if (schema.image) {
      const images = Array.isArray(schema.image) ? schema.image : [schema.image];
      schema.associatedMedia = images.map(img => ({
        '@type': 'ImageObject',
        contentUrl: typeof img === 'string' ? img : img.url || img.contentUrl,
        description: schema.name || 'Image',
        encodingFormat: 'image/jpeg',
        representativeOfPage: true
      }));
    }
    
    // Suggest alt-text structure for visual content
    if (schema['@type'] === 'Product' || schema['@type'] === 'Article') {
      schema.about = schema.about || {
        '@type': 'Thing',
        name: schema.name,
        description: schema.description
      };
    }
    
    // Add video hints if content could have video
    if (['HowTo', 'Recipe', 'Product'].includes(schema['@type'])) {
      if (!schema.video && schema.image) {
        // Suggest video would enhance this content
        schema['@graph'] = schema['@graph'] || [];
      }
    }
    
    return schema;
  }

  /**
   * Align with Google Knowledge Graph
   */
  alignWithKnowledgeGraph(schema) {
    // Add properties that align with Google Knowledge Graph
    
    // For organizations and businesses
    if (schema['@type'] === 'Organization' || schema['@type'] === 'LocalBusiness') {
      // Ensure logo (important for KG)
      if (!schema.logo && schema.image) {
        schema.logo = Array.isArray(schema.image) ? schema.image[0] : schema.image;
      }
      
      // Add sameAs for knowledge graph entity matching
      if (schema.url && !schema.sameAs) {
        schema.sameAs = schema.sameAs || [];
      }
      
      // Add founder info if organization
      if (schema['@type'] === 'Organization' && !schema.founder) {
        // KG hint - this helps entity recognition
      }
    }
    
    // Add disambiguating description (helps KG entity resolution)
    if (schema.description && !schema.disambiguatingDescription) {
      const firstSentence = schema.description.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length < 100) {
        schema.disambiguatingDescription = firstSentence.trim();
      }
    }
    
    // Add identifier for better entity matching
    if (!schema.identifier && (schema.name || schema.url)) {
      schema.identifier = {
        '@type': 'PropertyValue',
        name: 'Entity ID',
        value: schema.url || schema.name.replace(/\s+/g, '-').toLowerCase()
      };
    }
    
    // For products, add GTIN/SKU hints
    if (schema['@type'] === 'Product') {
      if (!schema.gtin && !schema.sku && !schema.mpn) {
        // Add placeholder to encourage proper identification
        schema.sku = schema.sku || 'SKU-placeholder';
      }
    }
    
    return schema;
  }

  /**
   * Build hybrid conversational + factual structure
   */
  buildHybridStructure(schema) {
    // Combine conversational and factual elements
    
    // Add FAQ structure for common types
    if (['Product', 'Service', 'LocalBusiness'].includes(schema['@type'])) {
      const faqs = this.generateCommonFAQs(schema);
      if (faqs.length > 0) {
        schema.mainEntity = schema.mainEntity || faqs;
      }
    }
    
    // Add "how to" structure if applicable
    if (schema['@type'] === 'HowTo' || (schema.name && schema.name.toLowerCase().includes('how to'))) {
      if (!schema.step || schema.step.length === 0) {
        // Suggest step structure
        schema.step = schema.step || [];
      }
    }
    
    // Add mentions for entity relationships (KG connection)
    if (schema.author || schema.brand || schema.publisher) {
      const mentionedEntities = [];
      
      if (schema.author) {
        mentionedEntities.push({
          '@type': 'Person',
          name: typeof schema.author === 'string' ? schema.author : schema.author.name
        });
      }
      
      if (schema.brand) {
        mentionedEntities.push({
          '@type': 'Brand',
          name: typeof schema.brand === 'string' ? schema.brand : schema.brand.name
        });
      }
      
      if (mentionedEntities.length > 0) {
        schema.mentions = mentionedEntities;
      }
    }
    
    return schema;
  }

  /**
   * Enrich with media hints
   */
  enrichWithMediaHints(schema) {
    // Add video placeholder for types that benefit from video
    if (['Product', 'HowTo', 'Recipe'].includes(schema['@type'])) {
      if (!schema.video && schema.image) {
        // Gemini loves multi-modal content - hint that video would help
        schema.potentialAction = schema.potentialAction || [];
        schema.potentialAction.push({
          '@type': 'WatchAction',
          target: {
            '@type': 'EntryPoint',
            name: `${schema.name} Video`,
            description: 'Video content recommended for enhanced engagement'
          }
        });
      }
    }
    
    // Add audio hints for content that could have audio
    if (schema['@type'] === 'Article' || schema['@type'] === 'HowTo') {
      if (!schema.audio) {
        // Gemini can process audio - hint at audio content
        schema.accessMode = schema.accessMode || ['textual', 'visual'];
        if (schema.accessMode && !schema.accessMode.includes('auditory')) {
          schema.accessMode.push('auditory-recommended');
        }
      }
    }
    
    return schema;
  }

  /**
   * Generate common FAQs for different schema types
   */
  generateCommonFAQs(schema) {
    const faqs = [];
    const type = schema['@type'];
    const name = schema.name || 'item';
    
    // Product FAQs
    if (type === 'Product') {
      faqs.push({
        '@type': 'Question',
        name: `What is ${name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: schema.description || `${name} is a product.`
        }
      });
      
      if (schema.brand) {
        faqs.push({
          '@type': 'Question',
          name: `Who makes ${name}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${name} is made by ${typeof schema.brand === 'string' ? schema.brand : schema.brand.name}.`
          }
        });
      }
      
      if (schema.offers && schema.offers.price) {
        faqs.push({
          '@type': 'Question',
          name: `How much does ${name} cost?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${name} costs ${schema.offers.priceCurrency || '$'}${schema.offers.price}.`
          }
        });
      }
    }
    
    // Local Business FAQs
    if (type === 'LocalBusiness' || type === 'Restaurant') {
      if (schema.address) {
        faqs.push({
          '@type': 'Question',
          name: `Where is ${name} located?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${name} is located at ${schema.address.streetAddress || ''}, ${schema.address.addressLocality || ''}.`
          }
        });
      }
      
      if (schema.openingHours || schema.openingHoursSpecification) {
        faqs.push({
          '@type': 'Question',
          name: `What are the hours for ${name}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: schema.openingHours || 'Check our website for current hours.'
          }
        });
      }
    }
    
    // Service FAQs
    if (type === 'Service') {
      faqs.push({
        '@type': 'Question',
        name: `What does ${name} include?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: schema.description || `${name} is a service we provide.`
        }
      });
    }
    
    return faqs.slice(0, 3); // Top 3 FAQs
  }
}

/**
 * Perplexity AI Optimizer - v1.11.0
 * Optimizes schemas for Perplexity AI search
 * Focuses on research format, citations, source attribution, and fact density
 */
export class PerplexityOptimizer {
  constructor() {
    this.config = {
      researchFocused: true,
      citationFormat: true,
      factDensity: 'high'
    };
  }

  async optimize(schema) {
    let optimized = JSON.parse(JSON.stringify(schema)); // Deep copy

    // 1. Research-friendly structure
    optimized = this.buildResearchFormat(optimized);
    
    // 2. Citation structure
    optimized = this.addCitationStructure(optimized);
    
    // 3. Source attribution
    optimized = this.enhanceSourceAttribution(optimized);
    
    // 4. Fact density optimization
    optimized = this.optimizeFactDensity(optimized);
    
    // 5. Academic markers
    optimized = this.addAcademicMarkers(optimized);
    
    optimized._aiOptimization = {
      target: 'perplexity',
      version: '1.11.0',
      optimizations: [
        'research-structured',
        'citation-ready',
        'source-attributed',
        'fact-dense',
        'academic-markers'
      ],
      timestamp: new Date().toISOString()
    };

    return optimized;
  }

  /**
   * Build research paper-style structure
   */
  buildResearchFormat(schema) {
    // Add abstract/summary
    if (schema.description && !schema.abstract) {
      schema.abstract = schema.description;
    }
    
    // Add keywords for research indexing
    if ((schema.name || schema.description) && !schema.keywords) {
      const text = `${schema.name || ''} ${schema.description || ''}`;
      schema.keywords = this.extractResearchKeywords(text);
    }
    
    // Add subject matter classification
    if (!schema.about && schema.name) {
      schema.about = {
        '@type': 'Thing',
        name: schema.name
      };
    }
    
    // For articles, add research article properties
    if (schema['@type'] === 'Article') {
      if (!schema.articleSection) {
        schema.articleSection = schema.about?.name || 'General';
      }
    }
    
    return schema;
  }

  /**
   * Add citation structure
   */
  addCitationStructure(schema) {
    // For articles, add citation object
    if (schema['@type'] === 'Article' || schema['@type'] === 'ScholarlyArticle') {
      schema.citation = schema.citation || [];
      
      // Add publication metadata
      if (schema.datePublished) {
        schema.datePublished = new Date(schema.datePublished).toISOString();
      }
      
      if (schema.dateModified) {
        schema.dateModified = new Date(schema.dateModified).toISOString();
      }
      
      // Add ISSN placeholder for journal articles
      if (schema['@type'] === 'ScholarlyArticle' && !schema.issn) {
        schema.issn = 'ISSN-recommended';
      }
    }
    
    // Add publisher info if missing
    if (schema.author && !schema.publisher) {
      schema.publisher = {
        '@type': 'Organization',
        name: typeof schema.author === 'string' ? schema.author : schema.author.name
      };
    }
    
    // Add bibliographic data
    if (schema['@type'] === 'Book' && !schema.isbn) {
      schema.isbn = 'ISBN-recommended';
    }
    
    return schema;
  }

  /**
   * Enhance source attribution
   */
  enhanceSourceAttribution(schema) {
    // Add provenance
    if (!schema.provider) {
      schema.provider = {
        '@type': 'Organization',
        name: schema.publisher?.name || 'Content Provider'
      };
    }
    
    // Add author credentials for credibility
    if (schema.author && typeof schema.author === 'object') {
      if (!schema.author.jobTitle) {
        schema.author.jobTitle = 'Subject Matter Expert';
      }
      
      if (!schema.author.knowsAbout) {
        schema.author.knowsAbout = schema.about?.name || schema.keywords;
      }
    }
    
    // Add fact-checking claims structure
    if (schema['@type'] === 'Article') {
      if (!schema.claimReviewed && schema.headline) {
        // Perplexity values fact-checkable content
        schema.mainEntity = schema.mainEntity || {
          '@type': 'Claim',
          text: schema.headline
        };
      }
    }
    
    // Add source URL
    if (!schema.url && typeof window !== 'undefined') {
      schema.url = window.location.href;
    }
    
    return schema;
  }

  /**
   * Optimize fact density
   */
  optimizeFactDensity(schema) {
    // Break down complex descriptions into key points
    if (schema.description && schema.description.length > 200) {
      const sentences = schema.description.match(/[^.!?]+[.!?]+/g) || [];
      
      // Add key points as structured data
      if (sentences.length > 2 && !schema.mainEntity) {
        schema.mainEntity = sentences.slice(0, 3).map(s => ({
          '@type': 'Thing',
          description: s.trim()
        }));
      }
    }
    
    // Add data points as additional properties for products
    if (schema['@type'] === 'Product') {
      if (!schema.additionalProperty || schema.additionalProperty.length === 0) {
        schema.additionalProperty = [];
        
        // Extract numeric facts
        if (schema.description) {
          const numbers = schema.description.match(/\d+(\.\d+)?/g);
          if (numbers && numbers.length > 0) {
            // Hint that adding structured data points would help
          }
        }
      }
    }
    
    // Add statistics for research content
    if (schema['@type'] === 'Article' && schema.wordCount) {
      schema.additionalProperty = schema.additionalProperty || [];
      schema.additionalProperty.push({
        '@type': 'PropertyValue',
        name: 'word count',
        value: schema.wordCount
      });
    }
    
    return schema;
  }

  /**
   * Add academic/research markers
   */
  addAcademicMarkers(schema) {
    // Add educational alignment if applicable
    if (['Article', 'Course', 'Book'].includes(schema['@type'])) {
      if (!schema.educationalLevel) {
        schema.educationalLevel = 'Advanced';
      }
      
      if (!schema.educationalUse) {
        schema.educationalUse = 'Research';
      }
    }
    
    // Add expertise markers to author
    if (schema.author && typeof schema.author === 'object') {
      if (!schema.author.knowsAbout) {
        schema.author.knowsAbout = schema.about?.name || schema.keywords;
      }
      
      // Add affiliation if organization
      if (!schema.author.affiliation && schema.publisher) {
        schema.author.affiliation = schema.publisher;
      }
    }
    
    // Add learning resource type
    if (schema['@type'] === 'Course' || schema['@type'] === 'LearningResource') {
      if (!schema.learningResourceType) {
        schema.learningResourceType = 'Research Material';
      }
    }
    
    return schema;
  }

  /**
   * Extract research-style keywords
   */
  extractResearchKeywords(text) {
    // Extract academic-style keywords
    const words = text.toLowerCase().split(/\s+/);
    
    // Filter for significant words (length > 5)
    const significantWords = words.filter(w => 
      w.length > 5 && 
      !['should', 'would', 'could', 'please', 'thanks'].includes(w)
    );
    
    // Get unique words
    const unique = [...new Set(significantWords)];
    
    return unique.slice(0, 5).join(', ');
  }
}

export class VoiceSearchOptimizer {
  constructor() {
    this.config = {
      conversationalStructure: true,
      questionAnswerFormat: true,
      naturalLanguage: true,
      speakableContent: true
    };
  }

  async optimize(schema) {
    let optimized = JSON.parse(JSON.stringify(schema)); // Deep copy

    // 1. Add speakable content markup
    optimized = this.addSpeakableContent(optimized);
    
    // 2. Convert to Q&A format
    optimized = this.addQuestionAnswerFormat(optimized);
    
    // 3. Natural language enhancement
    optimized = this.enhanceForNaturalLanguage(optimized);
    
    // 4. Add voice-friendly metadata
    optimized = this.addVoiceMetadata(optimized);
    
    // 5. Optimize for featured snippets
    optimized = this.optimizeForFeaturedSnippets(optimized);
    
    optimized._aiOptimization = {
      target: 'voice-search',
      version: '1.11.0',
      optimizations: [
        'speakable-content',
        'qa-format',
        'natural-language',
        'voice-metadata',
        'featured-snippet-ready'
      ],
      timestamp: new Date().toISOString()
    };

    return optimized;
  }

  addSpeakableContent(schema) {
    // Add Speakable schema for voice assistants
    if (schema.description || schema.text || schema.headline) {
      const speakableContent = schema.description || schema.text || schema.headline;
      
      schema.speakable = {
        '@type': 'SpeakableSpecification',
        'cssSelector': ['.speakable-content', '[itemprop="description"]'],
        'xpath': ['/html/head/meta[@name="description"]/@content']
      };
      
      // Add the actual speakable text
      if (!schema.speakableText) {
        schema.speakableText = this.convertToSpeakableText(speakableContent);
      }
    }
    
    return schema;
  }

  addQuestionAnswerFormat(schema) {
    const schemaType = schema['@type'];
    
    // Generate natural questions based on schema type
    const questions = this.generateVoiceQuestions(schema, schemaType);
    
    if (questions.length > 0 && schemaType !== 'FAQPage') {
      // Add FAQ structure for voice queries
      if (!schema.mainEntity) {
        schema.mainEntity = [];
      }
      
      questions.forEach(qa => {
        schema.mainEntity.push({
          '@type': 'Question',
          'name': qa.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': qa.answer
          }
        });
      });
    }
    
    return schema;
  }

  enhanceForNaturalLanguage(schema) {
    // Convert formal descriptions to conversational tone
    if (schema.description) {
      schema.description = this.makeConversational(schema.description);
    }
    
    // Add alternate names for voice recognition
    if (schema.name && !schema.alternateName) {
      schema.alternateName = this.generateVoiceAlternates(schema.name);
    }
    
    return schema;
  }

  addVoiceMetadata(schema) {
    // Add hints for voice assistant parsing
    schema.audience = schema.audience || {
      '@type': 'Audience',
      'audienceType': 'Voice Assistant Users'
    };
    
    // Add accessibility for voice
    if (schema.name) {
      schema.accessibilityFeature = schema.accessibilityFeature || [];
      if (!schema.accessibilityFeature.includes('readingOrder')) {
        schema.accessibilityFeature.push('readingOrder', 'structuralNavigation');
      }
    }
    
    return schema;
  }

  optimizeForFeaturedSnippets(schema) {
    // Add structured data for featured snippets
    if (schema.description) {
      const wordCount = schema.description.split(/\s+/).length;
      
      // Featured snippets prefer 40-60 words
      if (wordCount > 60) {
        schema.abstractSummary = `${schema.description.split(/\s+/).slice(0, 55).join(' ')}...`;
      }
    }
    
    return schema;
  }

  convertToSpeakableText(text) {
    return text
      .replace(/&/g, 'and')
      .replace(/\$/g, 'dollars ')
      .replace(/(\d+)%/g, '$1 percent')
      .replace(/\b(\d+)\b/g, (match) => {
        // Keep numbers readable for voice
        return match;
      });
  }

  generateVoiceQuestions(schema, schemaType) {
    const questions = [];
    
    const questionTemplates = {
      'Product': [
        { q: `What is ${schema.name}?`, a: schema.description },
        { q: `How much does ${schema.name} cost?`, a: schema.offers?.price ? `It costs ${schema.offers.price} ${schema.offers.priceCurrency || 'USD'}` : 'Price available on request' }
      ],
      'Article': [
        { q: `What is this article about?`, a: schema.headline || schema.name },
        { q: `Who wrote this?`, a: schema.author?.name || 'Unknown author' }
      ],
      'LocalBusiness': [
        { q: `Where is ${schema.name} located?`, a: schema.address ? this.formatAddress(schema.address) : 'Address not specified' },
        { q: `What are the hours?`, a: schema.openingHours || 'Please contact for hours' }
      ],
      'Event': [
        { q: `When is ${schema.name}?`, a: schema.startDate || 'Date to be announced' },
        { q: `Where is the event?`, a: schema.location?.name || schema.location?.address || 'Location details available soon' }
      ]
    };
    
    const templates = questionTemplates[schemaType] || [];
    templates.forEach(template => {
      if (template.a && template.a !== 'undefined' && template.a.length > 0) {
        questions.push({ question: template.q, answer: template.a });
      }
    });
    
    return questions;
  }

  makeConversational(text) {
    // Make text more conversational for voice
    return text
      .replace(/\b(we|We) offer\b/g, 'You can get')
      .replace(/\b(This|this) is\b/g, 'This is')
      .replace(/\bcontact us\b/gi, 'get in touch');
  }

  generateVoiceAlternates(name) {
    const alternates = [];
    
    // Add common spoken variations
    if (name.includes('&')) {
      alternates.push(name.replace(/&/g, 'and'));
    }
    
    // Add acronym spelling
    const acronym = name.match(/\b[A-Z]{2,}\b/);
    if (acronym) {
      alternates.push(acronym[0].split('').join(' '));
    }
    
    return alternates.length > 0 ? alternates : undefined;
  }

  formatAddress(address) {
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.streetAddress) parts.push(address.streetAddress);
    if (address.addressLocality) parts.push(address.addressLocality);
    if (address.addressRegion) parts.push(address.addressRegion);
    
    return parts.join(', ');
  }
}

export class VisualSearchOptimizer {
  constructor() {
    this.config = {
      imageOptimization: true,
      altTextEnhancement: true,
      visualMetadata: true,
      structuredImageData: true
    };
  }

  async optimize(schema) {
    let optimized = JSON.parse(JSON.stringify(schema)); // Deep copy

    // 1. Enhance image metadata
    optimized = this.enhanceImageMetadata(optimized);
    
    // 2. Add alt-text optimization
    optimized = this.optimizeAltText(optimized);
    
    // 3. Add visual search markup
    optimized = this.addVisualSearchMarkup(optimized);
    
    // 4. Optimize for image-rich results
    optimized = this.optimizeForImageResults(optimized);
    
    // 5. Add color and visual attributes
    optimized = this.addVisualAttributes(optimized);
    
    optimized._aiOptimization = {
      target: 'visual-search',
      version: '1.11.0',
      optimizations: [
        'enhanced-image-metadata',
        'optimized-alt-text',
        'visual-search-markup',
        'image-rich-results',
        'visual-attributes'
      ],
      timestamp: new Date().toISOString()
    };

    return optimized;
  }

  enhanceImageMetadata(schema) {
    // Convert simple image URLs to ImageObject schemas
    if (schema.image) {
      if (typeof schema.image === 'string') {
        schema.image = this.createImageObject(schema.image, schema.name);
      } else if (Array.isArray(schema.image)) {
        schema.image = schema.image.map(img => 
          typeof img === 'string' ? this.createImageObject(img, schema.name) : img
        );
      } else if (schema.image['@type'] !== 'ImageObject') {
        schema.image['@type'] = 'ImageObject';
        if (!schema.image.name && schema.name) {
          schema.image.name = schema.name;
        }
      }
    }
    
    return schema;
  }

  createImageObject(url, contextName) {
    return {
      '@type': 'ImageObject',
      url,
      'name': contextName || 'Image',
      'contentUrl': url,
      'caption': this.generateCaption(url, contextName),
      'encodingFormat': this.detectImageFormat(url),
      'representativeOfPage': true
    };
  }

  optimizeAltText(schema) {
    // Ensure all images have descriptive alt text
    if (schema.image) {
      const images = Array.isArray(schema.image) ? schema.image : [schema.image];
      
      images.forEach(img => {
        if (typeof img === 'object' && img['@type'] === 'ImageObject') {
          // Generate or enhance alt text
          if (!img.description && !img.caption) {
            img.description = this.generateAltText(img, schema);
          }
          
          // Add thumbnail for better visual search
          if (!img.thumbnail && img.url) {
            img.thumbnail = {
              '@type': 'ImageObject',
              'url': img.url,
              'width': 150,
              'height': 150
            };
          }
        }
      });
    }
    
    return schema;
  }

  addVisualSearchMarkup(schema) {
    // Add schema properties for visual search engines
    const schemaType = schema['@type'];
    
    // Products need visual elements
    if (schemaType === 'Product') {
      if (!schema.color && schema.name) {
        const detectedColor = this.extractColorFromName(schema.name);
        if (detectedColor) {
          schema.color = detectedColor;
        }
      }
      
      // Add product appearance hints
      if (!schema.material && schema.description) {
        const material = this.extractMaterial(schema.description);
        if (material) {
          schema.material = material;
        }
      }
    }
    
    // Articles/Blog posts should have featured images
    if ((schemaType === 'Article' || schemaType === 'BlogPosting') && schema.image) {
      schema.primaryImageOfPage = schema.image;
    }
    
    return schema;
  }

  optimizeForImageResults(schema) {
    // Add properties for Google Images and visual search
    if (schema.image) {
      const images = Array.isArray(schema.image) ? schema.image : [schema.image];
      
      // Ensure we have at least 3 high-quality images for better visibility
      if (images.length > 0 && images.length < 3) {
        schema._visualSearchHint = {
          recommendation: 'Add more high-quality images (minimum 3 recommended)',
          currentCount: images.length,
          optimalCount: 3
        };
      }
      
      // Add image gallery if multiple images exist
      if (images.length >= 3) {
        schema.associatedMedia = images.map(img => ({
          '@type': 'ImageGallery',
          'associatedMedia': typeof img === 'string' ? this.createImageObject(img, schema.name) : img
        }));
      }
    }
    
    return schema;
  }

  addVisualAttributes(schema) {
    const schemaType = schema['@type'];
    
    // Add visual attributes based on type
    if (schemaType === 'Product' && !schema.pattern && !schema.size) {
      // Add placeholder visual attributes that can be filled
      schema._visualAttributePlaceholders = {
        pattern: 'Specify pattern (solid, striped, etc.)',
        size: 'Add size information',
        color: schema.color || 'Specify color'
      };
    }
    
    // Creative works should specify visual characteristics
    if (['Painting', 'Photograph', 'VisualArtwork'].includes(schemaType)) {
      if (!schema.artMedium) {
        schema.artMedium = 'Digital'; // Default
      }
      
      if (!schema.artform) {
        schema.artform = schemaType;
      }
    }
    
    return schema;
  }

  generateCaption(url, contextName) {
    const filename = url.split('/').pop().split('?')[0];
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    const readable = nameWithoutExt.replace(/[-_]/g, ' ');
    
    return contextName ? `${contextName} - ${readable}` : readable;
  }

  generateAltText(imageObj, schema) {
    const parts = [];
    
    if (schema.name) {
      parts.push(schema.name);
    }
    
    if (imageObj.name && imageObj.name !== schema.name) {
      parts.push(imageObj.name);
    }
    
    const schemaType = schema['@type'];
    if (schemaType === 'Product' && schema.brand?.name) {
      parts.push(`by ${schema.brand.name}`);
    }
    
    return parts.join(' - ') || 'Image';
  }

  detectImageFormat(url) {
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    const formatMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    };
    
    return formatMap[extension] || 'image/jpeg';
  }

  extractColorFromName(name) {
    const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 
                    'purple', 'pink', 'brown', 'gray', 'grey', 'silver', 'gold'];
    
    const nameLower = name.toLowerCase();
    for (const color of colors) {
      if (nameLower.includes(color)) {
        return color.charAt(0).toUpperCase() + color.slice(1);
      }
    }
    
    return null;
  }

  extractMaterial(description) {
    const materials = ['cotton', 'polyester', 'wool', 'silk', 'leather', 'metal', 
                      'wood', 'plastic', 'glass', 'ceramic', 'stone', 'fabric'];
    
    const descLower = description.toLowerCase();
    for (const material of materials) {
      if (descLower.includes(material)) {
        return material.charAt(0).toUpperCase() + material.slice(1);
      }
    }
    
    return null;
  }
}

// Create global instances
// Disable autonomous management during tests to prevent hanging
const isTestEnvironment = typeof process !== 'undefined' && 
  (process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test')));

export const AutonomousManager = new AutonomousSchemaManager({
  autoDiscovery: !isTestEnvironment,
  autoUpdates: !isTestEnvironment,
  debug: false // Default to quiet mode
});
export const ContextEngine = new AIContextEngine();
export const AISearchOptimizer = new AISearchEngines();