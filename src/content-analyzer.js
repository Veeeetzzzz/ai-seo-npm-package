/**
 * Content Analyzer - v1.12.0
 * Analyzes content to extract keywords, entities, and suggest schema types
 * 
 * Features:
 * - TF-IDF keyword extraction
 * - Named entity recognition  
 * - Content type detection
 * - Schema relationship analysis
 */

export class ContentAnalyzer {
  /**
   * Analyze content and extract insights
   * @param {string} content - Text content to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} Analysis results
   */
  static analyze(content, options = {}) {
    const {
      extractKeywords = true,
      extractEntities = true,
      detectRelationships = true,
      maxKeywords = 10
    } = options;

    const analysis = {
      keywords: [],
      entities: {
        people: [],
        organizations: [],
        locations: [],
        products: [],
        events: []
      },
      relationships: [],
      contentType: 'unknown',
      readability: {},
      metadata: {}
    };

    if (!content || typeof content !== 'string') {
      return analysis;
    }

    // Extract keywords using TF-IDF
    if (extractKeywords) {
      analysis.keywords = this.extractKeywords(content, maxKeywords);
    }

    // Extract named entities
    if (extractEntities) {
      analysis.entities = this.extractEntities(content);
    }

    // Detect content type
    analysis.contentType = this.detectContentType(content, analysis);

    // Calculate readability metrics
    analysis.readability = this.calculateReadability(content);

    // Extract relationships
    if (detectRelationships) {
      analysis.relationships = this.detectRelationships(content, analysis);
    }

    // Add metadata
    analysis.metadata = {
      wordCount: this.countWords(content),
      sentenceCount: this.countSentences(content),
      paragraphCount: this.countParagraphs(content),
      averageWordLength: this.calculateAverageWordLength(content)
    };

    return analysis;
  }

  /**
   * Extract keywords using TF-IDF
   * @param {string} content - Text content
   * @param {number} maxKeywords - Maximum number of keywords
   * @returns {Array} Keywords with scores
   */
  static extractKeywords(content, maxKeywords = 10) {
    // Tokenize and clean
    const words = this._tokenize(content);
    
    // Calculate term frequency
    const tf = this._calculateTermFrequency(words);
    
    // Calculate IDF (simplified - using common words list)
    const idf = this._calculateIDF(words);
    
    // Calculate TF-IDF scores
    const tfidf = [];
    for (const [term, freq] of Object.entries(tf)) {
      const score = freq * (idf[term] || 1);
      tfidf.push({ term, score, frequency: freq });
    }
    
    // Sort by score and return top keywords
    return tfidf
      .sort((a, b) => b.score - a.score)
      .slice(0, maxKeywords)
      .map(k => k.term);
  }

  /**
   * Extract named entities from content
   * @param {string} content - Text content
   * @returns {Object} Entities by type
   */
  static extractEntities(content) {
    const entities = {
      people: [],
      organizations: [],
      locations: [],
      products: [],
      events: []
    };

    // Extract people (capitalized names)
    const peoplePattern = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g;
    const peopleMatches = content.matchAll(peoplePattern);
    for (const match of peopleMatches) {
      const fullName = `${match[1]} ${match[2]}`;
      if (!entities.people.includes(fullName) && !this._isCommonPhrase(fullName)) {
        entities.people.push(fullName);
      }
    }

    // Extract organizations (Inc, LLC, Corp, etc.)
    const orgPattern = /\b([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Company|Corporation|Ltd|Limited)\.?)\b/g;
    const orgMatches = content.matchAll(orgPattern);
    for (const match of orgMatches) {
      if (!entities.organizations.includes(match[1])) {
        entities.organizations.push(match[1]);
      }
    }

    // Extract locations (cities, states, countries)
    const locationPattern = /\b(?:in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)\b/g;
    const locationMatches = content.matchAll(locationPattern);
    for (const match of locationMatches) {
      const location = match[1].trim();
      if (!entities.locations.includes(location) && !this._isCommonPhrase(location)) {
        entities.locations.push(location);
      }
    }

    // Extract products (brand names with model numbers/names)
    const productPattern = /\b([A-Z][a-z]+)\s+([A-Z0-9][A-Za-z0-9\-]+)\b/g;
    const productMatches = content.matchAll(productPattern);
    for (const match of productMatches) {
      const product = `${match[1]} ${match[2]}`;
      // Only add if it looks like a product (has numbers or starts with capital)
      if ((/[0-9]/.test(match[2]) || /^[A-Z]/.test(match[2])) && !entities.products.includes(product)) {
        entities.products.push(product);
      }
    }

    // Limit results
    entities.people = entities.people.slice(0, 10);
    entities.organizations = entities.organizations.slice(0, 10);
    entities.locations = entities.locations.slice(0, 10);
    entities.products = entities.products.slice(0, 10);

    return entities;
  }

  /**
   * Detect content type from text and analysis
   * @param {string} content - Text content
   * @param {Object} analysis - Current analysis results
   * @returns {string} Content type
   */
  static detectContentType(content, analysis) {
    const lower = content.toLowerCase();

    // FAQ indicators (check first to avoid conflicts)
    if (this._hasFAQPatterns(content)) {
      return 'faq';
    }

    // Recipe indicators
    if (this._hasRecipePatterns(lower)) {
      return 'recipe';
    }

    // Product indicators
    if (this._hasProductPatterns(lower)) {
      return 'product';
    }

    // Event indicators
    if (this._hasEventPatterns(lower)) {
      return 'event';
    }

    // Business indicators
    if (this._hasBusinessPatterns(lower)) {
      return 'business';
    }

    // Article/blog indicators
    if (this._hasArticlePatterns(lower)) {
      return 'article';
    }

    // How-to indicators
    if (this._hasHowToPatterns(lower)) {
      return 'howto';
    }

    return 'general';
  }

  /**
   * Calculate readability metrics
   * @param {string} content - Text content
   * @returns {Object} Readability scores
   */
  static calculateReadability(content) {
    const words = this.countWords(content);
    const sentences = this.countSentences(content);
    const syllables = this._countSyllables(content);

    // Flesch Reading Ease
    const fleschScore = words > 0 && sentences > 0
      ? 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
      : 0;

    // Flesch-Kincaid Grade Level
    const gradeLevel = words > 0 && sentences > 0
      ? 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
      : 0;

    return {
      fleschScore: Math.max(0, Math.min(100, fleschScore)),
      gradeLevel: Math.max(0, gradeLevel),
      difficulty: this._getDifficultyLevel(fleschScore)
    };
  }

  /**
   * Detect relationships between entities and concepts
   * @param {string} content - Text content
   * @param {Object} analysis - Current analysis
   * @returns {Array} Relationships
   */
  static detectRelationships(content, analysis) {
    const relationships = [];

    // Person-Organization relationships
    if (analysis.entities.people.length > 0 && analysis.entities.organizations.length > 0) {
      for (const person of analysis.entities.people) {
        for (const org of analysis.entities.organizations) {
          // Check if person and org appear near each other
          const personIndex = content.indexOf(person);
          const orgIndex = content.indexOf(org);
          if (personIndex >= 0 && orgIndex >= 0 && Math.abs(personIndex - orgIndex) < 200) {
            relationships.push({
              type: 'worksFor',
              subject: person,
              object: org,
              confidence: 0.7
            });
          }
        }
      }
    }

    // Product-Organization relationships
    if (analysis.entities.products.length > 0 && analysis.entities.organizations.length > 0) {
      for (const product of analysis.entities.products) {
        for (const org of analysis.entities.organizations) {
          const productIndex = content.indexOf(product);
          const orgIndex = content.indexOf(org);
          if (productIndex >= 0 && orgIndex >= 0 && Math.abs(productIndex - orgIndex) < 150) {
            relationships.push({
              type: 'manufacturer',
              subject: product,
              object: org,
              confidence: 0.6
            });
          }
        }
      }
    }

    // Event-Location relationships
    if (analysis.entities.events.length > 0 && analysis.entities.locations.length > 0) {
      for (const event of analysis.entities.events) {
        for (const location of analysis.entities.locations) {
          const eventIndex = content.indexOf(event);
          const locationIndex = content.indexOf(location);
          if (eventIndex >= 0 && locationIndex >= 0 && Math.abs(eventIndex - locationIndex) < 100) {
            relationships.push({
              type: 'location',
              subject: event,
              object: location,
              confidence: 0.8
            });
          }
        }
      }
    }

    return relationships;
  }

  // ==================== Helper Methods ====================

  /**
   * Tokenize text into words
   * @private
   */
  static _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this._isStopWord(word));
  }

  /**
   * Calculate term frequency
   * @private
   */
  static _calculateTermFrequency(words) {
    const tf = {};
    const totalWords = words.length;

    for (const word of words) {
      tf[word] = (tf[word] || 0) + 1;
    }

    // Normalize by total words
    for (const word in tf) {
      tf[word] = tf[word] / totalWords;
    }

    return tf;
  }

  /**
   * Calculate inverse document frequency (simplified)
   * @private
   */
  static _calculateIDF(words) {
    const idf = {};
    const uniqueWords = new Set(words);

    for (const word of uniqueWords) {
      // Simplified IDF: penalize very common words
      if (this._isVeryCommonWord(word)) {
        idf[word] = 0.1;
      } else if (this._isCommonWord(word)) {
        idf[word] = 0.5;
      } else {
        idf[word] = 1.0;
      }
    }

    return idf;
  }

  /**
   * Check if word is a stop word
   * @private
   */
  static _isStopWord(word) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their'
    ]);
    return stopWords.has(word);
  }

  /**
   * Check if word is very common
   * @private
   */
  static _isVeryCommonWord(word) {
    const veryCommon = new Set([
      'about', 'also', 'any', 'because', 'both', 'each', 'even', 'every',
      'how', 'into', 'just', 'like', 'make', 'many', 'more', 'most', 'much',
      'new', 'not', 'now', 'only', 'other', 'our', 'out', 'over', 'some',
      'such', 'than', 'then', 'there', 'through', 'time', 'very', 'way',
      'what', 'when', 'where', 'which', 'who', 'why', 'your'
    ]);
    return veryCommon.has(word);
  }

  /**
   * Check if word is common
   * @private
   */
  static _isCommonWord(word) {
    const common = new Set([
      'after', 'all', 'best', 'between', 'come', 'day', 'different', 'down',
      'find', 'first', 'get', 'give', 'good', 'great', 'help', 'here', 'know',
      'last', 'life', 'long', 'look', 'man', 'need', 'never', 'next', 'old',
      'people', 'place', 'right', 'same', 'say', 'see', 'take', 'tell',
      'think', 'too', 'two', 'under', 'use', 'want', 'well', 'work', 'world',
      'year'
    ]);
    return common.has(word);
  }

  /**
   * Check if phrase is common (not a real entity)
   * @private
   */
  static _isCommonPhrase(phrase) {
    const commonPhrases = [
      'The Best', 'The New', 'The Old', 'New York', 'Los Angeles',
      'San Francisco', 'United States', 'North America', 'South America'
    ];
    return commonPhrases.includes(phrase);
  }

  /**
   * Check for recipe patterns
   * @private
   */
  static _hasRecipePatterns(text) {
    const patterns = [
      /ingredients?:/i,
      /instructions?:/i,
      /\d+\s*(?:cups?|tbsp|tsp|oz|lbs?|grams?|ml)/i,
      /bake|cook|stir|mix|blend|preheat/i,
      /prep time|cook time|servings/i
    ];
    return patterns.filter(p => p.test(text)).length >= 2;
  }

  /**
   * Check for product patterns
   * @private
   */
  static _hasProductPatterns(text) {
    const patterns = [
      /\$\d+/,
      /price|cost|buy|purchase|order/i,
      /in stock|out of stock|available/i,
      /brand|model|sku/i,
      /add to cart|buy now/i
    ];
    return patterns.filter(p => p.test(text)).length >= 2;
  }

  /**
   * Check for event patterns
   * @private
   */
  static _hasEventPatterns(text) {
    const patterns = [
      /\d{1,2}:\d{2}\s*(?:am|pm)/i,
      /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
      /tickets?|registration|rsvp/i,
      /venue|location|address/i,
      /starts?|begins?|ends?/i
    ];
    return patterns.filter(p => p.test(text)).length >= 2;
  }

  /**
   * Check for business patterns
   * @private
   */
  static _hasBusinessPatterns(text) {
    const patterns = [
      /\d{3}[-.]?\d{3}[-.]?\d{4}/,  // Phone
      /\d+\s+\w+\s+(?:street|st|avenue|ave|road|rd|drive|dr)/i,  // Address
      /hours?:|open|closed/i,
      /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
      /restaurant|store|shop|business|company/i
    ];
    return patterns.filter(p => p.test(text)).length >= 2;
  }

  /**
   * Check for article patterns
   * @private
   */
  static _hasArticlePatterns(text) {
    const hasAuthor = /by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i.test(text);
    const hasDate = /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i.test(text);
    const isLong = text.length > 1000;
    const hasParagraphs = (text.match(/\n\n/g) || []).length > 3;
    
    return (hasAuthor || hasDate) && (isLong || hasParagraphs);
  }

  /**
   * Check for how-to patterns
   * @private
   */
  static _hasHowToPatterns(text) {
    const patterns = [
      /how to/i,
      /step \d+/i,
      /first,|second,|third,|finally,/i,
      /you will need|materials|tools/i
    ];
    return patterns.filter(p => p.test(text)).length >= 2;
  }

  /**
   * Check for FAQ patterns
   * @private
   */
  static _hasFAQPatterns(text) {
    const questionCount = (text.match(/\?/g) || []).length;
    const hasFAQHeader = /faq|frequently asked|common questions/i.test(text);
    const hasQAPattern = /Q:|A:/gi.test(text);
    return (questionCount >= 3 && hasQAPattern) || hasFAQHeader;
  }

  /**
   * Count words
   * @private
   */
  static countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Count sentences
   * @private
   */
  static countSentences(text) {
    return (text.match(/[.!?]+/g) || []).length;
  }

  /**
   * Count paragraphs
   * @private
   */
  static countParagraphs(text) {
    return (text.match(/\n\n+/g) || []).length + 1;
  }

  /**
   * Calculate average word length
   * @private
   */
  static calculateAverageWordLength(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return totalLength / words.length;
  }

  /**
   * Count syllables (approximation)
   * @private
   */
  static _countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/);
    let syllables = 0;

    for (const word of words) {
      // Simple syllable counting (vowel groups)
      const matches = word.match(/[aeiouy]+/g);
      syllables += matches ? matches.length : 0;
    }

    return syllables;
  }

  /**
   * Get difficulty level from Flesch score
   * @private
   */
  static _getDifficultyLevel(score) {
    if (score >= 90) return 'very easy';
    if (score >= 80) return 'easy';
    if (score >= 70) return 'fairly easy';
    if (score >= 60) return 'standard';
    if (score >= 50) return 'fairly difficult';
    if (score >= 30) return 'difficult';
    return 'very difficult';
  }
}

