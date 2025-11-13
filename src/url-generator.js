// URLSchemaGenerator - v1.12.0
// Automatically generate schemas from any URL

/**
 * URLSchemaGenerator
 * 
 * Generates structured data schemas from web pages automatically.
 * Uses AI-powered content analysis and schema type detection.
 * 
 * @example
 * const result = await URLSchemaGenerator.generateFromURL('https://example.com/product');
 * console.log(result.schemas); // Generated Product schema
 */
export class URLSchemaGenerator {
  /**
   * Generate schema from a single URL
   * 
   * @param {string} url - The URL to scrape and analyze
   * @param {Object} options - Generation options
   * @param {string[]} [options.targetTypes] - Hint at expected schema types
   * @param {boolean} [options.includeRelated=true] - Generate related schemas
   * @param {string[]} [options.optimizeFor] - AI optimizers to apply
   * @param {boolean} [options.validateWithGoogle=false] - Validate with Google guidelines
   * @param {Object} [options.fetchOptions] - Custom fetch options
   * @param {boolean} [options.useCache=true] - Use caching
   * @param {Object} [options.cache] - Custom cache instance
   * @returns {Promise<Object>} Generated schemas with metadata
   */
  static async generateFromURL(url, options = {}) {
    // Step 1 - Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    // Step 1.5 - Check cache
    const useCache = options.useCache !== false;
    if (useCache) {
      const { CacheManager, getCache } = await import('./cache-manager.js');
      const cache = options.cache || getCache();
      const cacheKey = CacheManager.generateKey(url, options);
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return {
          ...cached,
          cached: true,
          cacheKey
        };
      }
    }

    try {
      // TODO: Step 2 - Fetch HTML content
      const html = await this._fetchHTML(url, options.fetchOptions);
      
      // TODO: Step 3 - Parse HTML and extract metadata
      const parsed = await this._parseHTML(html, url);
      
      // TODO: Step 4 - Detect probable schema types
      const detected = await this._detectSchemaTypes(parsed, options.targetTypes);
      
      // TODO: Step 5 - Extract structured data
      const schemas = await this._extractSchemas(parsed, detected);
      
      // TODO: Step 6 - Apply AI optimizers (if requested)
      let optimizedSchemas = schemas;
      if (options.optimizeFor && options.optimizeFor.length > 0) {
        optimizedSchemas = await this._applyOptimizers(schemas, options.optimizeFor);
      }
      
      // TODO: Step 7 - Validate with Google (if requested)
      let validation = null;
      if (options.validateWithGoogle) {
        // Will integrate with GoogleValidator in Phase 2
        validation = { pending: true };
      }
      
      // Step 8 - Generate suggestions
      const suggestions = this._generateSuggestions(schemas, parsed);
      
      const result = {
        success: true,
        url,
        detectedType: detected[0]?.type || 'Unknown',
        confidence: detected[0]?.confidence || 0,
        schemas: optimizedSchemas,
        metadata: {
          title: parsed.title,
          description: parsed.description,
          images: parsed.images,
          existingSchemas: parsed.existing
        },
        suggestions,
        validation,
        cached: false
      };

      // Step 9 - Cache the result
      if (useCache) {
        const { CacheManager, getCache } = await import('./cache-manager.js');
        const cache = options.cache || getCache();
        const cacheKey = CacheManager.generateKey(url, options);
        cache.set(cacheKey, result, options.cacheTTL);
      }

      return result;
      
    } catch (error) {
      return {
        success: false,
        url,
        error: error.message,
        suggestion: 'Check if URL is accessible and returns valid HTML',
        cached: false
      };
    }
  }

  /**
   * Generate schemas from multiple URLs
   * 
   * @param {string[]} urls - Array of URLs to process
   * @param {Object} options - Batch processing options
   * @param {number} [options.concurrency=3] - Number of concurrent requests
   * @param {boolean} [options.retryOnFail=true] - Retry failed requests
   * @param {Function} [options.progressCallback] - Progress callback (url, index, total)
   * @returns {Promise<Object[]>} Array of results
   */
  static async generateFromURLs(urls, options = {}) {
    const {
      concurrency = 3,
      retryOnFail = true,
      progressCallback
    } = options;

    if (!urls || urls.length === 0) {
      return [];
    }

    const results = [];
    let completed = 0;

    // Process URLs in batches with concurrency control
    const processBatch = async (batch) => {
      const promises = batch.map(async (url) => {
        try {
          const result = await this.generateFromURL(url, options);
          completed++;
          
          if (progressCallback) {
            progressCallback(url, completed, urls.length);
          }
          
          return result;
        } catch (error) {
          completed++;
          
          if (progressCallback) {
            progressCallback(url, completed, urls.length);
          }
          
          // Return error result
          return {
            success: false,
            url,
            error: error.message,
            suggestion: 'Check if URL is accessible'
          };
        }
      });

      return await Promise.all(promises);
    };

    // Split URLs into batches based on concurrency
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await processBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Generate schemas from sitemap XML
   * 
   * @param {string} sitemapUrl - Sitemap URL
   * @param {Object} options - Generation options
   * @param {string} [options.filter] - URL filter pattern (e.g., "*/products/*")
   * @returns {Promise<Object[]>} Array of results
   */
  static async generateFromSitemap(sitemapUrl, options = {}) {
    try {
      // Fetch sitemap
      const response = await fetch(sitemapUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.status}`);
      }

      const xml = await response.text();

      // Extract URLs from sitemap (simple regex approach)
      const urlMatches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
      let urls = Array.from(urlMatches, match => match[1]);

      // Apply filter if provided
      if (options.filter) {
        const filterPattern = options.filter
          .replace(/\*/g, '.*')  // Convert * to .*
          .replace(/\?/g, '.');   // Convert ? to .
        
        const regex = new RegExp(filterPattern);
        urls = urls.filter(url => regex.test(url));
      }

      // Process URLs with batch generator
      return await this.generateFromURLs(urls, options);

    } catch (error) {
      throw new Error(`Sitemap processing failed: ${error.message}`);
    }
  }

  /**
   * Fetch HTML content from URL
   * @private
   */
  static async _fetchHTML(url, fetchOptions = {}) {
    const defaultOptions = {
      headers: {
        'User-Agent': 'ai-seo-bot/1.12.0 (Schema Generator)'
      },
      timeout: 10000,
      maxRetries: 2
    };

    const options = { ...defaultOptions, ...fetchOptions };
    let lastError;

    // Retry logic
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        // Fetch with timeout
        const response = await fetch(url, {
          headers: options.headers,
          signal: controller.signal,
          redirect: 'follow'
        });

        clearTimeout(timeoutId);

        // Check response status
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Get HTML content
        const html = await response.text();

        if (!html || html.trim().length === 0) {
          throw new Error('Empty response received');
        }

        return html;

      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${options.timeout}ms`);
        }

        if (error.message.includes('HTTP 4')) {
          // Don't retry on 4xx errors (client errors)
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < options.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to fetch URL after ${options.maxRetries + 1} attempts: ${lastError.message}`);
  }

  /**
   * Parse HTML and extract content
   * @private
   */
  static async _parseHTML(html, url) {
    // Dynamic import to avoid loading HTMLParser if not needed
    const { HTMLParser } = await import('./html-parser.js');
    return HTMLParser.parse(html, url);
  }

  /**
   * Detect probable schema types from content
   * @private
   */
  static async _detectSchemaTypes(parsed, targetTypes = []) {
    // Import SchemaDetector
    const { SchemaDetector } = await import('./schema-detector.js');
    return SchemaDetector.detect(parsed, targetTypes);
  }

  /**
   * Extract structured data based on detected types
   * @private
   */
  static async _extractSchemas(parsed, detected) {
    // Dynamic import
    const { DataExtractors } = await import('./data-extractors.js');
    
    const schemas = [];
    
    // Generate schema for top detection (highest confidence)
    if (detected && detected.length > 0) {
      const topDetection = detected[0];
      
      try {
        let schema;
        
        switch (topDetection.type) {
          case 'Product':
            schema = DataExtractors.extractProduct(parsed);
            break;
          case 'Article':
            schema = DataExtractors.extractArticle(parsed);
            break;
          case 'LocalBusiness':
            schema = DataExtractors.extractLocalBusiness(parsed);
            break;
          case 'Event':
            schema = DataExtractors.extractEvent(parsed);
            break;
          case 'Recipe':
            schema = DataExtractors.extractRecipe(parsed);
            break;
          case 'VideoObject':
            schema = DataExtractors.extractVideo(parsed);
            break;
          default:
            // Fallback to WebPage
            schema = {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              'name': parsed.title || 'Untitled',
              'description': parsed.description || ''
            };
        }
        
        if (schema) {
          schemas.push(schema);
        }
      } catch (error) {
        // If extraction fails, create basic schema
        schemas.push({
          '@context': 'https://schema.org',
          '@type': topDetection.type,
          'name': parsed.title || 'Untitled',
          'description': parsed.description || ''
        });
      }
    }
    
    return schemas;
  }

  /**
   * Apply AI optimizers to schemas
   * @private
   */
  static async _applyOptimizers(schemas, optimizers) {
    // Import AI optimizer from main package
    const { AI } = await import('../index.js');
    
    const optimizedSchemas = [];
    
    for (const schema of schemas) {
      try {
        // Apply AI.optimizeForLLM with specified targets
        const optimized = AI.optimizeForLLM(schema, {
          target: optimizers,
          semanticEnhancement: true,
          voiceOptimization: optimizers.includes('voice')
        });
        
        optimizedSchemas.push(optimized);
      } catch (error) {
        // If optimization fails, use original schema
        console.warn(`Failed to optimize schema: ${error.message}`);
        optimizedSchemas.push(schema);
      }
    }
    
    return optimizedSchemas;
  }

  /**
   * Generate improvement suggestions
   * @private
   */
  static _generateSuggestions(schemas, parsed) {
    const suggestions = [];
    
    // Check if schema is too basic
    if (schemas.length === 1 && schemas[0]['@type'] === 'WebPage') {
      suggestions.push('Consider adding more specific schema type (Product, Article, LocalBusiness, etc.)');
    }
    
    // Check for missing images
    if (schemas.length > 0 && !schemas[0].image && parsed.images?.length > 0) {
      suggestions.push('Add images from page to improve schema visibility');
    }
    
    // Check for missing description
    if (schemas.length > 0 && !schemas[0].description && parsed.description) {
      suggestions.push('Add description to improve search result appearance');
    }
    
    // Schema-specific suggestions
    for (const schema of schemas) {
      switch (schema['@type']) {
        case 'Product':
          if (!schema.offers || !schema.offers.price) {
            suggestions.push('Product schema: Add price information for better visibility');
          }
          if (!schema.brand) {
            suggestions.push('Product schema: Add brand information');
          }
          if (!schema.aggregateRating) {
            suggestions.push('Product schema: Consider adding customer ratings');
          }
          break;
          
        case 'Article':
        case 'BlogPosting':
          if (!schema.author) {
            suggestions.push('Article schema: Add author information');
          }
          if (!schema.datePublished) {
            suggestions.push('Article schema: Add publication date');
          }
          if (!schema.publisher) {
            suggestions.push('Article schema: Add publisher information');
          }
          break;
          
        case 'LocalBusiness':
          if (!schema.address) {
            suggestions.push('Business schema: Add complete address');
          }
          if (!schema.telephone) {
            suggestions.push('Business schema: Add phone number');
          }
          if (!schema.openingHours) {
            suggestions.push('Business schema: Add opening hours');
          }
          break;
          
        case 'Event':
          if (!schema.location) {
            suggestions.push('Event schema: Add event location');
          }
          if (!schema.startDate) {
            suggestions.push('Event schema: Add start date/time');
          }
          if (!schema.offers) {
            suggestions.push('Event schema: Consider adding ticket information');
          }
          break;
      }
    }
    
    // Limit suggestions to avoid overwhelming
    return suggestions.slice(0, 5);
  }
}

// Helper function for debugging
export function debugLog(message, enabled = false) {
  if (enabled) {
    console.log(`[URLSchemaGenerator] ${message}`);
  }
}

