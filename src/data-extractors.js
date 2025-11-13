// Data Extractors - v1.12.0
// Extract structured data for specific schema types

/**
 * DataExtractors
 * 
 * Specialized extractors for each schema type.
 * Takes parsed HTML content and extracts relevant properties.
 */
export class DataExtractors {
  
  /**
   * Extract Product schema data
   */
  static extractProduct(parsed) {
    const { title, description, content, meta, openGraph, images } = parsed;
    const combinedText = `${title} ${description} ${content}`;

    const product = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': this._extractProductName(title, openGraph),
      'description': this._extractProductDescription(description, content),
      'image': this._extractProductImages(images, openGraph)
    };

    // Extract price
    const price = this._extractPrice(combinedText, meta, openGraph);
    if (price) {
      product.offers = {
        '@type': 'Offer',
        'price': price.amount,
        'priceCurrency': price.currency || 'USD'
      };

      // Extract availability
      const availability = this._extractAvailability(combinedText);
      if (availability) {
        product.offers.availability = availability;
      }
    }

    // Extract brand
    const brand = this._extractBrand(combinedText, meta, openGraph);
    if (brand) {
      product.brand = {
        '@type': 'Brand',
        'name': brand
      };
    }

    // Extract rating
    const rating = this._extractRating(combinedText);
    if (rating) {
      product.aggregateRating = {
        '@type': 'AggregateRating',
        'ratingValue': rating.value,
        'reviewCount': rating.count
      };
    }

    // Extract SKU
    const sku = this._extractSKU(combinedText);
    if (sku) {
      product.sku = sku;
    }

    return product;
  }

  /**
   * Extract Article schema data
   */
  static extractArticle(parsed) {
    const { title, description, content, meta, openGraph, url } = parsed;

    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': this._extractArticleHeadline(title, openGraph),
      'description': description || this._truncate(content, 200)
    };

    // Extract author
    const author = this._extractAuthor(content, meta, openGraph);
    if (author) {
      article.author = {
        '@type': 'Person',
        'name': author
      };
    }

    // Extract publication date
    const datePublished = this._extractDate(content, meta, openGraph, 'published');
    if (datePublished) {
      article.datePublished = datePublished;
    }

    const dateModified = this._extractDate(content, meta, openGraph, 'modified');
    if (dateModified) {
      article.dateModified = dateModified;
    }

    // Extract publisher
    const publisher = this._extractPublisher(meta, openGraph);
    if (publisher) {
      article.publisher = {
        '@type': 'Organization',
        'name': publisher
      };
    }

    // Extract keywords
    const keywords = this._extractKeywords(content, meta);
    if (keywords && keywords.length > 0) {
      article.keywords = keywords.join(', ');
    }

    // Add URL if available
    if (url) {
      article.url = url;
    }

    return article;
  }

  /**
   * Extract LocalBusiness schema data
   */
  static extractLocalBusiness(parsed) {
    const { title, description, content, meta } = parsed;
    const combinedText = `${title} ${description} ${content}`;

    const business = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': title,
      'description': description
    };

    // Extract address
    const address = this._extractAddress(combinedText);
    if (address) {
      business.address = {
        '@type': 'PostalAddress',
        ...address
      };
    }

    // Extract phone
    const telephone = this._extractPhone(combinedText);
    if (telephone) {
      business.telephone = telephone;
    }

    // Extract opening hours
    const hours = this._extractOpeningHours(combinedText);
    if (hours && hours.length > 0) {
      business.openingHours = hours;
    }

    // Extract geo coordinates
    const geo = this._extractGeoCoordinates(meta);
    if (geo) {
      business.geo = {
        '@type': 'GeoCoordinates',
        'latitude': geo.latitude,
        'longitude': geo.longitude
      };
    }

    return business;
  }

  /**
   * Extract Event schema data
   */
  static extractEvent(parsed) {
    const { title, description, content, meta, openGraph } = parsed;
    const combinedText = `${title} ${description} ${content}`;

    const event = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      'name': title,
      'description': description
    };

    // Extract start date
    const startDate = this._extractDate(combinedText, meta, openGraph, 'start');
    if (startDate) {
      event.startDate = startDate;
    }

    // Extract end date
    const endDate = this._extractDate(combinedText, meta, openGraph, 'end');
    if (endDate) {
      event.endDate = endDate;
    }

    // Extract location
    const location = this._extractEventLocation(combinedText);
    if (location) {
      event.location = {
        '@type': 'Place',
        'name': location
      };
    }

    // Extract organizer
    const organizer = this._extractOrganizer(combinedText, meta);
    if (organizer) {
      event.organizer = {
        '@type': 'Organization',
        'name': organizer
      };
    }

    return event;
  }

  /**
   * Extract Recipe schema data
   */
  static extractRecipe(parsed) {
    const { title, description, content } = parsed;

    const recipe = {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      'name': title,
      'description': description || this._truncate(content, 200)
    };

    // Extract ingredients
    const ingredients = this._extractIngredients(content);
    if (ingredients && ingredients.length > 0) {
      recipe.recipeIngredient = ingredients;
    }

    // Extract instructions
    const instructions = this._extractInstructions(content);
    if (instructions) {
      recipe.recipeInstructions = instructions;
    }

    // Extract cook time
    const cookTime = this._extractCookTime(content);
    if (cookTime) {
      recipe.cookTime = cookTime;
    }

    // Extract prep time
    const prepTime = this._extractPrepTime(content);
    if (prepTime) {
      recipe.prepTime = prepTime;
    }

    return recipe;
  }

  /**
   * Extract VideoObject schema data
   */
  static extractVideo(parsed) {
    const { title, description, meta, openGraph } = parsed;

    const video = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': title,
      'description': description
    };

    // Extract duration
    if (meta['video:duration']) {
      video.duration = `PT${meta['video:duration']}S`;
    }

    // Extract thumbnail
    if (openGraph.image) {
      video.thumbnailUrl = openGraph.image;
    }

    // Extract upload date
    if (openGraph['video:release_date']) {
      video.uploadDate = openGraph['video:release_date'];
    }

    return video;
  }

  // ============ Helper Methods ============

  static _extractProductName(title, openGraph) {
    return openGraph?.title || title || 'Untitled Product';
  }

  static _extractProductDescription(description, content) {
    return description || this._truncate(content, 300);
  }

  static _extractProductImages(images, openGraph) {
    if (images && images.length > 0) {
      return images.slice(0, 5); // Max 5 images
    }
    if (openGraph?.image) {
      return [openGraph.image];
    }
    return [];
  }

  static _extractPrice(text, meta, openGraph) {
    // Try meta tags first (with null checks)
    if (meta && meta['product:price:amount']) {
      return {
        amount: meta['product:price:amount'],
        currency: meta['product:price:currency'] || 'USD'
      };
    }
    if (openGraph && openGraph['product:price:amount']) {
      return {
        amount: openGraph['product:price:amount'],
        currency: openGraph['product:price:currency'] || 'USD'
      };
    }

    // Try pattern matching
    const patterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/, // $99.99 or $1,234.56
      /(\d+(?:\.\d{2})?)\s*(USD|EUR|GBP)/i, // 99.99 USD
      /price[:\s]+\$?(\d+(?:\.\d{2})?)/i // Price: $99.99
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          amount: match[1].replace(/,/g, ''),
          currency: match[2] || 'USD'
        };
      }
    }

    return null;
  }

  static _extractAvailability(text) {
    if (/in\s+stock/i.test(text)) {
      return 'https://schema.org/InStock';
    }
    if (/out\s+of\s+stock/i.test(text)) {
      return 'https://schema.org/OutOfStock';
    }
    if (/pre-?order/i.test(text)) {
      return 'https://schema.org/PreOrder';
    }
    return null;
  }

  static _extractBrand(text, meta, openGraph) {
    // Try meta tags (with null checks)
    if (meta && meta.brand) {
      return meta.brand;
    }
    if (openGraph && openGraph.brand) {
      return openGraph.brand;
    }

    // Try pattern matching
    const brandMatch = text.match(/brand[:\s]+([A-Z][A-Za-z\s&]+)(?:[,.\n]|$)/i);
    if (brandMatch) {
      return brandMatch[1].trim();
    }

    return null;
  }

  static _extractRating(text) {
    // Match patterns like "4.5 stars" or "4.5 out of 5" or "Rating: 4.5"
    // Look for rating pattern first (with decimal point)
    const ratingMatch = text.match(/(?:rating|rated)[:\s]*(\d+\.?\d*)\s*(?:stars?|out\s+of)?/i) ||
                        text.match(/(\d+\.?\d*)\s*stars?/i);
    const reviewMatch = text.match(/(\d+)\s*reviews?/i);

    if (ratingMatch) {
      return {
        value: parseFloat(ratingMatch[1]),
        count: reviewMatch ? parseInt(reviewMatch[1]) : 1
      };
    }

    return null;
  }

  static _extractSKU(text) {
    const skuMatch = text.match(/sku[:\s]+([A-Z0-9-]+)/i);
    return skuMatch ? skuMatch[1] : null;
  }

  static _extractArticleHeadline(title, openGraph) {
    return openGraph?.title || title || 'Untitled Article';
  }

  static _extractAuthor(text, meta, openGraph) {
    // Try meta tags first (with null checks)
    if (meta && meta.author) {
      return meta.author;
    }
    if (openGraph && openGraph.author) {
      return openGraph.author;
    }

    // Try pattern matching "by Author Name"
    const byMatch = text.match(/by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (byMatch) {
      return byMatch[1];
    }

    // Try "written by" or "posted by"
    const writtenMatch = text.match(/(?:written|posted)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (writtenMatch) {
      return writtenMatch[1];
    }

    return null;
  }

  static _extractDate(text, meta, openGraph, type = 'published') {
    // Try meta tags first
    const metaKeys = {
      'published': ['article:published_time', 'datePublished', 'date'],
      'modified': ['article:modified_time', 'dateModified'],
      'start': ['event:start_time', 'startDate'],
      'end': ['event:end_time', 'endDate']
    };

    for (const key of metaKeys[type] || []) {
      if (meta[key] || openGraph[key]) {
        return this._normalizeDate(meta[key] || openGraph[key]);
      }
    }

    // Try pattern matching
    const patterns = [
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[Z\+\-]\d{2}:\d{2})/, // ISO 8601
      /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
      /((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return this._normalizeDate(match[1]);
      }
    }

    return null;
  }

  static _normalizeDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toISOString();
    } catch {
      return dateStr; // Return as-is if can't parse
    }
  }

  static _extractPublisher(meta, openGraph) {
    return meta['og:site_name'] || openGraph['site_name'] || null;
  }

  static _extractKeywords(text, meta) {
    if (meta.keywords) {
      return meta.keywords.split(',').map(k => k.trim());
    }

    // Extract from content (simple approach - first 5 capitalized words)
    const words = text.match(/\b[A-Z][a-z]{3,}\b/g) || [];
    return [...new Set(words)].slice(0, 5);
  }

  static _extractAddress(text) {
    const address = {};

    // Street address
    const streetMatch = text.match(/(\d+\s+[A-Z][a-z]+\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln))/i);
    if (streetMatch) {
      address.streetAddress = streetMatch[1];
    }

    // ZIP code
    const zipMatch = text.match(/\b(\d{5}(?:-\d{4})?)\b/);
    if (zipMatch) {
      address.postalCode = zipMatch[1];
    }

    // State
    const stateMatch = text.match(/\b([A-Z]{2})\s+\d{5}/);
    if (stateMatch) {
      address.addressRegion = stateMatch[1];
    }

    return Object.keys(address).length > 0 ? address : null;
  }

  static _extractPhone(text) {
    const patterns = [
      /\((\d{3})\)\s*(\d{3})-(\d{4})/, // (555) 123-4567
      /(\d{3})-(\d{3})-(\d{4})/, // 555-123-4567
      /\+1\s*(\d{3})\s*(\d{3})\s*(\d{4})/ // +1 555 123 4567
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  static _extractOpeningHours(text) {
    const hours = [];
    const pattern = /(mon|tue|wed|thu|fri|sat|sun)[a-z]*-?(mon|tue|wed|thu|fri|sat|sun)?[a-z]*[:\s]+(\d{1,2}:\d{2}\s*[ap]m)\s*-\s*(\d{1,2}:\d{2}\s*[ap]m)/gi;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const day1 = match[1].substring(0, 2).toUpperCase();
      const day2 = match[2] ? match[2].substring(0, 2).toUpperCase() : day1;
      hours.push(`${day1}-${day2} ${match[3]}-${match[4]}`);
    }

    return hours;
  }

  static _extractGeoCoordinates(meta) {
    if (meta.latitude && meta.longitude) {
      return {
        latitude: parseFloat(meta.latitude),
        longitude: parseFloat(meta.longitude)
      };
    }

    if (meta['geo.position']) {
      const [lat, lon] = meta['geo.position'].split(';');
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      };
    }

    return null;
  }

  static _extractEventLocation(text) {
    // Try multiple patterns
    let locationMatch = text.match(/(?:location|venue|at\s+the)[:\s]+([A-Z][A-Za-z\s,]+?)(?:[.\n]|$)/i);
    if (!locationMatch) {
      // Try "at the [Location]"
      locationMatch = text.match(/at\s+the\s+([A-Z][A-Za-z\s]+?)(?:[.\n,]|$)/i);
    }
    return locationMatch ? locationMatch[1].trim() : null;
  }

  static _extractOrganizer(text, meta) {
    if (meta.organizer) {
      return meta.organizer;
    }

    const organizerMatch = text.match(/organizer[:\s]+([A-Z][A-Za-z\s&]+?)(?:[,.\n]|$)/i);
    return organizerMatch ? organizerMatch[1].trim() : null;
  }

  static _extractIngredients(text) {
    // Simple approach: look for lines starting with amounts
    const lines = text.split('\n');
    const ingredients = [];

    for (const line of lines) {
      if (/^\s*\d+\s*(cup|tbsp|tsp|oz|lb|gram|ml)/i.test(line)) {
        ingredients.push(line.trim());
      }
    }

    return ingredients.length > 0 ? ingredients : null;
  }

  static _extractInstructions(text) {
    // Look for numbered steps or instruction section
    const instructionMatch = text.match(/instructions?[:\s]+([\s\S]{50,500})/i);
    return instructionMatch ? instructionMatch[1].trim() : null;
  }

  static _extractCookTime(text) {
    const timeMatch = text.match(/cook\s+time[:\s]+(\d+)\s*(min|hour)/i);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase().startsWith('h') ? 'H' : 'M';
      return `PT${value}${unit}`;
    }
    return null;
  }

  static _extractPrepTime(text) {
    const timeMatch = text.match(/prep\s+time[:\s]+(\d+)\s*(min|hour)/i);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase().startsWith('h') ? 'H' : 'M';
      return `PT${value}${unit}`;
    }
    return null;
  }

  static _truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
}

