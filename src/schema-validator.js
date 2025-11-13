/**
 * Schema Validator - v1.12.0
 * Smart validation with Google Rich Results integration
 * 
 * Features:
 * - Google Rich Results validation
 * - Auto-fix suggestions
 * - Missing field detection
 * - Best practice recommendations
 */

export class SchemaValidator {
  /**
   * Validate schema with comprehensive checks
   * @param {Object} schema - Schema to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation results
   */
  static validate(schema, options = {}) {
    const {
      strict = false,
      checkGoogleGuidelines = true,
      suggestFixes = true
    } = options;

    const results = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      fixes: [],
      score: 100
    };

    if (!schema || typeof schema !== 'object') {
      results.valid = false;
      results.errors.push('Schema must be a valid object');
      results.score = 0;
      return results;
    }

    // Basic required fields
    this._validateBasicStructure(schema, results, strict);

    // Type-specific validation
    if (schema['@type']) {
      this._validateTypeSpecific(schema, results, strict);
    }

    // Google Rich Results guidelines
    if (checkGoogleGuidelines) {
      this._validateGoogleGuidelines(schema, results);
    }

    // Generate auto-fix suggestions
    if (suggestFixes) {
      this._generateFixes(schema, results);
    }

    // Calculate final score
    results.score = this._calculateScore(results);
    results.valid = results.errors.length === 0;

    return results;
  }

  /**
   * Validate basic schema structure
   * @private
   */
  static _validateBasicStructure(schema, results, strict) {
    // Check @context
    if (!schema['@context']) {
      results.errors.push('Missing required @context field');
    } else if (schema['@context'] !== 'https://schema.org') {
      results.warnings.push('@context should be "https://schema.org"');
    }

    // Check @type
    if (!schema['@type']) {
      results.errors.push('Missing required @type field');
    }

    // Check name
    if (!schema.name && !schema.headline) {
      results.warnings.push('Missing name or headline - important for identification');
    }

    // Check description
    if (!schema.description) {
      if (strict) {
        results.warnings.push('Missing description - recommended for better visibility');
      }
    }
  }

  /**
   * Validate type-specific requirements
   * @private
   */
  static _validateTypeSpecific(schema, results, strict) {
    const type = schema['@type'];

    switch (type) {
      case 'Product':
        this._validateProduct(schema, results, strict);
        break;
      case 'Article':
      case 'BlogPosting':
      case 'NewsArticle':
        this._validateArticle(schema, results, strict);
        break;
      case 'LocalBusiness':
      case 'Restaurant':
      case 'Store':
        this._validateBusiness(schema, results, strict);
        break;
      case 'Event':
        this._validateEvent(schema, results, strict);
        break;
      case 'Recipe':
        this._validateRecipe(schema, results, strict);
        break;
      case 'VideoObject':
        this._validateVideo(schema, results, strict);
        break;
    }
  }

  /**
   * Validate Product schema
   * @private
   */
  static _validateProduct(schema, results, strict) {
    // Required: offers
    if (!schema.offers) {
      results.errors.push('Product: Missing required offers field');
    } else {
      // Validate offers
      if (!schema.offers.price) {
        results.warnings.push('Product: Missing price in offers');
      }
      if (!schema.offers.priceCurrency) {
        results.warnings.push('Product: Missing priceCurrency in offers');
      }
      if (!schema.offers.availability) {
        results.suggestions.push('Product: Add availability status for better user experience');
      }
    }

    // Recommended: image
    if (!schema.image) {
      results.warnings.push('Product: Missing image - highly recommended');
    }

    // Recommended: brand
    if (!schema.brand) {
      results.suggestions.push('Product: Add brand information');
    }

    // Optional but beneficial: ratings
    if (!schema.aggregateRating && !schema.review) {
      results.suggestions.push('Product: Consider adding customer ratings or reviews');
    }
  }

  /**
   * Validate Article schema
   * @private
   */
  static _validateArticle(schema, results, strict) {
    // Required: headline
    if (!schema.headline && !schema.name) {
      results.errors.push('Article: Missing required headline or name');
    }

    // Required: image
    if (!schema.image) {
      results.warnings.push('Article: Missing image - required for Google Rich Results');
    }

    // Required: datePublished
    if (!schema.datePublished) {
      results.warnings.push('Article: Missing datePublished - important for search results');
    }

    // Required: author
    if (!schema.author) {
      results.warnings.push('Article: Missing author information');
    }

    // Required: publisher
    if (!schema.publisher) {
      results.warnings.push('Article: Missing publisher - required for Google Rich Results');
    } else if (schema.publisher && !schema.publisher.logo) {
      results.suggestions.push('Article: Add publisher logo for better visibility');
    }
  }

  /**
   * Validate LocalBusiness schema
   * @private
   */
  static _validateBusiness(schema, results, strict) {
    // Required: address
    if (!schema.address) {
      results.errors.push('LocalBusiness: Missing required address');
    } else {
      // Validate address completeness
      if (!schema.address.streetAddress) {
        results.warnings.push('LocalBusiness: Missing street address');
      }
      if (!schema.address.addressLocality) {
        results.warnings.push('LocalBusiness: Missing city (addressLocality)');
      }
      if (!schema.address.addressRegion) {
        results.suggestions.push('LocalBusiness: Add state/region');
      }
      if (!schema.address.postalCode) {
        results.suggestions.push('LocalBusiness: Add postal code');
      }
    }

    // Recommended: telephone
    if (!schema.telephone) {
      results.warnings.push('LocalBusiness: Add telephone number');
    }

    // Recommended: openingHours
    if (!schema.openingHoursSpecification && !schema.openingHours) {
      results.suggestions.push('LocalBusiness: Add opening hours');
    }

    // Recommended: geo
    if (!schema.geo) {
      results.suggestions.push('LocalBusiness: Add geographic coordinates (latitude/longitude)');
    }
  }

  /**
   * Validate Event schema
   * @private
   */
  static _validateEvent(schema, results, strict) {
    // Required: startDate
    if (!schema.startDate) {
      results.errors.push('Event: Missing required startDate');
    }

    // Required: location
    if (!schema.location) {
      results.errors.push('Event: Missing required location');
    } else {
      if (!schema.location.name && !schema.location.address) {
        results.warnings.push('Event: Location should have name or address');
      }
    }

    // Recommended: offers (for ticketed events)
    if (!schema.offers) {
      results.suggestions.push('Event: Add ticket/pricing information if applicable');
    }

    // Recommended: eventStatus
    if (!schema.eventStatus) {
      results.suggestions.push('Event: Add eventStatus (scheduled, cancelled, etc.)');
    }
  }

  /**
   * Validate Recipe schema
   * @private
   */
  static _validateRecipe(schema, results, strict) {
    // Required: image
    if (!schema.image) {
      results.warnings.push('Recipe: Missing image - highly recommended');
    }

    // Required: recipeIngredient
    if (!schema.recipeIngredient || schema.recipeIngredient.length === 0) {
      results.errors.push('Recipe: Missing required ingredients list');
    }

    // Required: recipeInstructions
    if (!schema.recipeInstructions || schema.recipeInstructions.length === 0) {
      results.errors.push('Recipe: Missing required instructions');
    }

    // Recommended: prepTime, cookTime
    if (!schema.prepTime && !schema.totalTime) {
      results.suggestions.push('Recipe: Add preparation/cooking time');
    }

    // Recommended: nutrition
    if (!schema.nutrition) {
      results.suggestions.push('Recipe: Add nutrition information if available');
    }
  }

  /**
   * Validate VideoObject schema
   * @private
   */
  static _validateVideo(schema, results, strict) {
    // Required: thumbnailUrl
    if (!schema.thumbnailUrl) {
      results.warnings.push('VideoObject: Missing thumbnail URL');
    }

    // Required: uploadDate
    if (!schema.uploadDate) {
      results.warnings.push('VideoObject: Missing upload date');
    }

    // Required: description
    if (!schema.description) {
      results.warnings.push('VideoObject: Missing description');
    }

    // Recommended: contentUrl or embedUrl
    if (!schema.contentUrl && !schema.embedUrl) {
      results.suggestions.push('VideoObject: Add contentUrl or embedUrl');
    }

    // Recommended: duration
    if (!schema.duration) {
      results.suggestions.push('VideoObject: Add video duration in ISO 8601 format');
    }
  }

  /**
   * Validate against Google Rich Results guidelines
   * @private
   */
  static _validateGoogleGuidelines(schema, results) {
    const type = schema['@type'];

    // General guidelines
    if (!schema.url) {
      results.suggestions.push('Google: Add canonical URL for this content');
    }

    // Type-specific Google guidelines
    switch (type) {
      case 'Product':
        // Google requires valid price format
        if (schema.offers && schema.offers.price) {
          const price = schema.offers.price.toString();
          if (!price.match(/^\d+(\.\d{1,2})?$/)) {
            results.warnings.push('Google: Price should be in decimal format (e.g., "99.99")');
          }
        }
        break;

      case 'Article':
      case 'BlogPosting':
        // Google requires structured image
        if (schema.image && typeof schema.image === 'string') {
          results.suggestions.push('Google: Image should be structured as ImageObject for best results');
        }

        // Google requires specific publisher structure
        if (schema.publisher && !schema.publisher['@type']) {
          results.warnings.push('Google: Publisher should have @type: "Organization"');
        }
        break;

      case 'Recipe':
        // Google prefers HowToSection or HowToStep for instructions
        if (schema.recipeInstructions && Array.isArray(schema.recipeInstructions)) {
          const hasStructuredInstructions = schema.recipeInstructions.some(
            inst => typeof inst === 'object' && inst['@type']
          );
          if (!hasStructuredInstructions) {
            results.suggestions.push('Google: Use structured HowToStep for recipe instructions');
          }
        }
        break;
    }
  }

  /**
   * Generate auto-fix suggestions
   * @private
   */
  static _generateFixes(schema, results) {
    // Fix missing @context
    if (!schema['@context']) {
      results.fixes.push({
        field: '@context',
        value: 'https://schema.org',
        reason: 'Required field missing'
      });
    }

    // Fix missing name
    if (!schema.name && !schema.headline && schema.description) {
      results.fixes.push({
        field: 'name',
        value: schema.description.substring(0, 50),
        reason: 'Use truncated description as name'
      });
    }

    // Type-specific fixes
    const type = schema['@type'];

    if (type === 'Product' && schema.offers && !schema.offers['@type']) {
      results.fixes.push({
        field: 'offers.@type',
        value: 'Offer',
        reason: 'Offers should have @type: "Offer"'
      });
    }

    if (type === 'Article' && schema.publisher && typeof schema.publisher === 'string') {
      results.fixes.push({
        field: 'publisher',
        value: {
          '@type': 'Organization',
          name: schema.publisher
        },
        reason: 'Convert publisher string to structured Organization'
      });
    }

    if (type === 'LocalBusiness' && schema.address && typeof schema.address === 'string') {
      results.fixes.push({
        field: 'address',
        value: {
          '@type': 'PostalAddress',
          streetAddress: schema.address
        },
        reason: 'Convert address string to structured PostalAddress'
      });
    }
  }

  /**
   * Calculate validation score
   * @private
   */
  static _calculateScore(results) {
    let score = 100;

    // Deduct points for errors
    score -= results.errors.length * 20;

    // Deduct points for warnings
    score -= results.warnings.length * 10;

    // Deduct small amount for suggestions
    score -= results.suggestions.length * 2;

    return Math.max(0, score);
  }

  /**
   * Apply auto-fixes to schema
   * @param {Object} schema - Original schema
   * @param {Array} fixes - Fixes to apply
   * @returns {Object} Fixed schema
   */
  static applyFixes(schema, fixes) {
    const fixed = JSON.parse(JSON.stringify(schema)); // Deep clone

    for (const fix of fixes) {
      const parts = fix.field.split('.');
      let current = fixed;

      // Navigate to the field
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      // Apply fix
      const lastPart = parts[parts.length - 1];
      current[lastPart] = fix.value;
    }

    return fixed;
  }

  /**
   * Get validation summary
   * @param {Object} results - Validation results
   * @returns {string} Human-readable summary
   */
  static getSummary(results) {
    const lines = [];

    if (results.valid) {
      lines.push('✓ Schema is valid');
    } else {
      lines.push('✗ Schema has validation issues');
    }

    lines.push(`Score: ${results.score}/100`);

    if (results.errors.length > 0) {
      lines.push(`Errors: ${results.errors.length}`);
    }

    if (results.warnings.length > 0) {
      lines.push(`Warnings: ${results.warnings.length}`);
    }

    if (results.suggestions.length > 0) {
      lines.push(`Suggestions: ${results.suggestions.length}`);
    }

    if (results.fixes.length > 0) {
      lines.push(`Auto-fixes available: ${results.fixes.length}`);
    }

    return lines.join('\n');
  }
}

