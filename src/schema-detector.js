// SchemaDetector - v1.12.0
// Detect probable schema types from parsed HTML content

/**
 * SchemaDetector
 * 
 * Analyzes parsed HTML content to detect the most appropriate schema types.
 * Uses pattern matching and indicator scoring to determine confidence levels.
 * 
 * @example
 * const detected = SchemaDetector.detect(parsedContent);
 * console.log(detected[0]); // { type: 'Product', confidence: 0.92, indicators: [...] }
 */
export class SchemaDetector {
  /**
   * Detect probable schema types from parsed content
   * 
   * @param {Object} parsed - Parsed HTML content from HTMLParser
   * @param {string[]} targetTypes - Optional hint at expected types
   * @returns {Array} Array of detected types sorted by confidence (high to low)
   */
  static detect(parsed, targetTypes = []) {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid parsed content');
    }

    const detections = [];

    // Check for each schema type
    const productScore = this._detectProduct(parsed);
    if (productScore.confidence > 0) {
      detections.push(productScore);
    }

    const articleScore = this._detectArticle(parsed);
    if (articleScore.confidence > 0) {
      detections.push(articleScore);
    }

    const businessScore = this._detectLocalBusiness(parsed);
    if (businessScore.confidence > 0) {
      detections.push(businessScore);
    }

    const eventScore = this._detectEvent(parsed);
    if (eventScore.confidence > 0) {
      detections.push(eventScore);
    }

    const videoScore = this._detectVideo(parsed);
    if (videoScore.confidence > 0) {
      detections.push(videoScore);
    }

    const recipeScore = this._detectRecipe(parsed);
    if (recipeScore.confidence > 0) {
      detections.push(recipeScore);
    }

    // Boost confidence for target types
    if (targetTypes && targetTypes.length > 0) {
      detections.forEach(detection => {
        if (targetTypes.includes(detection.type)) {
          detection.confidence = Math.min(1.0, detection.confidence * 1.2);
          detection.indicators.push('target type hint');
        }
      });
    }

    // Sort by confidence (highest first)
    detections.sort((a, b) => b.confidence - a.confidence);

    // If no strong detection, default to WebPage
    if (detections.length === 0 || detections[0].confidence < 0.3) {
      detections.unshift({
        type: 'WebPage',
        confidence: 0.5,
        indicators: ['default fallback']
      });
    }

    return detections;
  }

  /**
   * Detect Product schema indicators
   * @private
   */
  static _detectProduct(parsed) {
    const indicators = [];
    let score = 0;

    const { content, meta, openGraph, title, description } = parsed;
    const combinedText = `${title} ${description} ${content}`.toLowerCase();

    // Check OpenGraph type
    if (openGraph?.type === 'product') {
      indicators.push('og:type=product');
      score += 0.4;
    }

    // Check for price indicators
    const pricePatterns = [
      /\$\d+\.?\d*/,                    // $99.99
      /\d+\s*(USD|EUR|GBP)/i,          // 99 USD
      /price[:\s]+\$?\d+/i,            // Price: $99
      /\d+\.\d{2}/                      // 99.99
    ];
    
    pricePatterns.forEach(pattern => {
      if (pattern.test(combinedText)) {
        indicators.push('price detected');
        score += 0.15;
      }
    });

    // Check for product-specific keywords
    const productKeywords = [
      'add to cart', 'buy now', 'purchase', 'in stock', 'out of stock',
      'product details', 'product description', 'sku', 'brand',
      'shipping', 'delivery', 'availability', 'add to bag'
    ];

    productKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        indicators.push(`keyword: ${keyword}`);
        score += 0.05;
      }
    });

    // Check meta tags
    if (meta['product:price'] || meta['og:price:amount']) {
      indicators.push('product meta tags');
      score += 0.2;
    }

    // Check for rating/review indicators
    if (combinedText.match(/\d+\.?\d*\s*(stars?|rating)/i)) {
      indicators.push('rating found');
      score += 0.1;
    }

    if (combinedText.match(/\d+\s*reviews?/i)) {
      indicators.push('reviews found');
      score += 0.1;
    }

    // Normalize score to 0-1
    const confidence = Math.min(1.0, score);

    return {
      type: 'Product',
      confidence,
      indicators: [...new Set(indicators)] // Remove duplicates
    };
  }

  /**
   * Detect Article schema indicators
   * @private
   */
  static _detectArticle(parsed) {
    const indicators = [];
    let score = 0;

    const { content, meta, openGraph, title, description } = parsed;
    const combinedText = `${title} ${description} ${content}`.toLowerCase();

    // Check OpenGraph type
    if (openGraph?.type === 'article') {
      indicators.push('og:type=article');
      score += 0.4;
    }

    // Check for article meta tags
    if (meta['article:published_time'] || meta['article:author']) {
      indicators.push('article meta tags');
      score += 0.3;
    }

    // Check for date patterns
    const datePatterns = [
      /published[:\s]+/i,
      /\d{1,2}\/\d{1,2}\/\d{4}/,       // 01/15/2024
      /\d{4}-\d{2}-\d{2}/,              // 2024-01-15
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i
    ];

    datePatterns.forEach(pattern => {
      if (pattern.test(combinedText)) {
        indicators.push('publication date found');
        score += 0.1;
      }
    });

    // Check for author indicators
    if (combinedText.match(/by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/)) {
      indicators.push('author name pattern');
      score += 0.1;
    }

    if (meta.author || openGraph.author) {
      indicators.push('author meta tag');
      score += 0.15;
    }

    // Check for article keywords
    const articleKeywords = [
      'read more', 'continue reading', 'share this article',
      'related articles', 'tags:', 'category:', 'posted in'
    ];

    articleKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        indicators.push(`keyword: ${keyword}`);
        score += 0.05;
      }
    });

    // Long content suggests article
    if (content.length > 1000) {
      indicators.push('substantial content length');
      score += 0.1;
    }

    const confidence = Math.min(1.0, score);

    return {
      type: 'Article',
      confidence,
      indicators: [...new Set(indicators)]
    };
  }

  /**
   * Detect LocalBusiness schema indicators
   * @private
   */
  static _detectLocalBusiness(parsed) {
    const indicators = [];
    let score = 0;

    const { content, meta, title, description } = parsed;
    const combinedText = `${title} ${description} ${content}`.toLowerCase();

    // Check for address patterns
    const addressPatterns = [
      /\d+\s+[A-Z][a-z]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr)/i,
      /\d{5}(-\d{4})?/,  // ZIP code
      /[A-Z]{2}\s+\d{5}/ // State + ZIP
    ];

    addressPatterns.forEach(pattern => {
      if (pattern.test(combinedText)) {
        indicators.push('address pattern found');
        score += 0.15;
      }
    });

    // Check for phone patterns
    const phonePatterns = [
      /\(\d{3}\)\s*\d{3}-\d{4}/,       // (555) 123-4567
      /\d{3}-\d{3}-\d{4}/,              // 555-123-4567
      /\+\d{1,3}\s*\d{3}\s*\d{3}\s*\d{4}/ // +1 555 123 4567
    ];

    phonePatterns.forEach(pattern => {
      if (pattern.test(combinedText)) {
        indicators.push('phone number found');
        score += 0.15;
      }
    });

    // Check for business hours
    if (combinedText.match(/hours?[:\s]+(mon|tue|wed|thu|fri|sat|sun)/i)) {
      indicators.push('business hours found');
      score += 0.15;
    }

    if (combinedText.match(/\d{1,2}:\d{2}\s*(am|pm)/i)) {
      indicators.push('time format found');
      score += 0.1;
    }

    // Check for business keywords
    const businessKeywords = [
      'visit us', 'our location', 'directions', 'contact us',
      'call us', 'email us', 'get in touch', 'store hours',
      'open now', 'closed', 'reservations', 'book now'
    ];

    businessKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        indicators.push(`keyword: ${keyword}`);
        score += 0.05;
      }
    });

    // Check for geo coordinates in meta
    if (meta['geo.position'] || meta.latitude || meta.longitude) {
      indicators.push('geo coordinates in meta');
      score += 0.2;
    }

    const confidence = Math.min(1.0, score);

    return {
      type: 'LocalBusiness',
      confidence,
      indicators: [...new Set(indicators)]
    };
  }

  /**
   * Detect Event schema indicators
   * @private
   */
  static _detectEvent(parsed) {
    const indicators = [];
    let score = 0;

    const { content, meta, openGraph, title } = parsed;
    const combinedText = `${title} ${content}`.toLowerCase();

    // Check OpenGraph type
    if (openGraph?.type === 'event') {
      indicators.push('og:type=event');
      score += 0.4;
    }

    // Check for event-specific meta
    if (meta['event:start_time'] || meta['event:end_time']) {
      indicators.push('event meta tags');
      score += 0.3;
    }

    // Check for event keywords
    const eventKeywords = [
      'register now', 'rsvp', 'buy tickets', 'get tickets',
      'event details', 'venue', 'location:', 'when:', 'where:',
      'join us', 'attend', 'conference', 'workshop', 'seminar'
    ];

    eventKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        indicators.push(`keyword: ${keyword}`);
        score += 0.08;
      }
    });

    // Check for date/time patterns
    if (combinedText.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i)) {
      indicators.push('event date pattern');
      score += 0.1;
    }

    const confidence = Math.min(1.0, score);

    return {
      type: 'Event',
      confidence,
      indicators: [...new Set(indicators)]
    };
  }

  /**
   * Detect Video schema indicators
   * @private
   */
  static _detectVideo(parsed) {
    const indicators = [];
    let score = 0;

    const { content, meta, openGraph } = parsed;
    const combinedText = content.toLowerCase();

    // Check OpenGraph type
    if (openGraph?.type === 'video' || openGraph?.type === 'video.other') {
      indicators.push('og:type=video');
      score += 0.5;
    }

    // Check for video meta tags
    if (meta['og:video'] || meta['video:duration']) {
      indicators.push('video meta tags');
      score += 0.3;
    }

    // Check for video embeds
    if (combinedText.includes('youtube') || combinedText.includes('vimeo')) {
      indicators.push('video platform detected');
      score += 0.2;
    }

    // Check for video keywords
    if (combinedText.match(/\d+:\d+/)) { // Duration format
      indicators.push('duration format found');
      score += 0.1;
    }

    const confidence = Math.min(1.0, score);

    return {
      type: 'VideoObject',
      confidence,
      indicators: [...new Set(indicators)]
    };
  }

  /**
   * Detect Recipe schema indicators
   * @private
   */
  static _detectRecipe(parsed) {
    const indicators = [];
    let score = 0;

    const { content, title } = parsed;
    const combinedText = `${title} ${content}`.toLowerCase();

    // Check for recipe keywords
    const recipeKeywords = [
      'ingredients', 'instructions', 'directions', 'recipe',
      'prep time', 'cook time', 'servings', 'yield',
      'calories', 'nutrition', 'bake', 'mix', 'stir'
    ];

    recipeKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        indicators.push(`keyword: ${keyword}`);
        score += 0.1;
      }
    });

    // Check for measurement patterns
    if (combinedText.match(/\d+\s*(cup|tbsp|tsp|oz|lb|gram|ml)/)) {
      indicators.push('measurement units found');
      score += 0.15;
    }

    const confidence = Math.min(1.0, score);

    return {
      type: 'Recipe',
      confidence,
      indicators: [...new Set(indicators)]
    };
  }
}

