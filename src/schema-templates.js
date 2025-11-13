/**
 * Schema Templates - v1.12.0
 * Pre-built schema templates with best practices
 * 
 * Provides ready-to-use templates for common schema types with:
 * - Required fields pre-populated
 * - Optional fields as placeholders
 * - Best practice structures
 * - Easy customization
 */

export class SchemaTemplates {
  /**
   * Get all available template types
   * @returns {string[]} Array of template type names
   */
  static getAvailableTemplates() {
    return [
      'Product',
      'Article',
      'BlogPosting',
      'NewsArticle',
      'LocalBusiness',
      'Restaurant',
      'Store',
      'Event',
      'Recipe',
      'VideoObject',
      'WebPage',
      'Organization',
      'Person',
      'FAQPage',
      'HowTo'
    ];
  }

  /**
   * Get a template by type
   * @param {string} type - Schema type
   * @param {Object} data - Initial data to populate template
   * @returns {Object} Schema template
   */
  static getTemplate(type, data = {}) {
    const templateMethod = `_create${type}Template`;
    
    if (typeof this[templateMethod] === 'function') {
      return this[templateMethod](data);
    }
    
    // Fallback to generic Thing template
    return this._createThingTemplate(type, data);
  }

  /**
   * Create Product template
   * @private
   */
  static _createProductTemplate(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.name || '[Product Name]',
      description: data.description || '[Product Description]',
      image: data.image || data.images || [],
      brand: data.brand ? {
        '@type': 'Brand',
        name: data.brand
      } : undefined,
      offers: {
        '@type': 'Offer',
        url: data.url || data.offers?.url,
        priceCurrency: data.priceCurrency || data.offers?.priceCurrency || 'USD',
        price: data.price || data.offers?.price || '0.00',
        availability: data.availability || data.offers?.availability || 'https://schema.org/InStock',
        priceValidUntil: data.priceValidUntil || data.offers?.priceValidUntil,
        itemCondition: data.itemCondition || data.offers?.itemCondition || 'https://schema.org/NewCondition'
      },
      aggregateRating: data.rating || data.aggregateRating ? {
        '@type': 'AggregateRating',
        ratingValue: data.rating?.ratingValue || data.aggregateRating?.ratingValue || '0',
        reviewCount: data.rating?.reviewCount || data.aggregateRating?.reviewCount || '0'
      } : undefined,
      review: data.reviews || data.review,
      sku: data.sku,
      mpn: data.mpn,
      gtin: data.gtin,
      gtin13: data.gtin13,
      gtin8: data.gtin8
    };
  }

  /**
   * Create Article template
   * @private
   */
  static _createArticleTemplate(data = {}) {
    const now = new Date().toISOString();
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.headline || data.name || '[Article Headline]',
      description: data.description || '[Article Description]',
      image: data.image || data.images || [],
      author: data.author ? {
        '@type': 'Person',
        name: typeof data.author === 'string' ? data.author : data.author.name
      } : undefined,
      publisher: data.publisher ? {
        '@type': 'Organization',
        name: typeof data.publisher === 'string' ? data.publisher : data.publisher.name,
        logo: data.publisher.logo ? {
          '@type': 'ImageObject',
          url: data.publisher.logo
        } : undefined
      } : undefined,
      datePublished: data.datePublished || now,
      dateModified: data.dateModified || now,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.url || data.mainEntityOfPage
      },
      articleBody: data.articleBody || data.text,
      wordCount: data.wordCount,
      keywords: data.keywords,
      articleSection: data.articleSection || data.section
    };
  }

  /**
   * Create BlogPosting template (extends Article)
   * @private
   */
  static _createBlogPostingTemplate(data = {}) {
    const article = this._createArticleTemplate(data);
    return {
      ...article,
      '@type': 'BlogPosting',
      blogPost: data.blogPost
    };
  }

  /**
   * Create NewsArticle template (extends Article)
   * @private
   */
  static _createNewsArticleTemplate(data = {}) {
    const article = this._createArticleTemplate(data);
    return {
      ...article,
      '@type': 'NewsArticle',
      dateline: data.dateline,
      printColumn: data.printColumn,
      printEdition: data.printEdition,
      printPage: data.printPage,
      printSection: data.printSection
    };
  }

  /**
   * Create LocalBusiness template
   * @private
   */
  static _createLocalBusinessTemplate(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: data.name || '[Business Name]',
      description: data.description,
      image: data.image || data.images || [],
      address: data.address ? {
        '@type': 'PostalAddress',
        streetAddress: data.address.streetAddress || data.address.street,
        addressLocality: data.address.addressLocality || data.address.city,
        addressRegion: data.address.addressRegion || data.address.state,
        postalCode: data.address.postalCode || data.address.zip,
        addressCountry: data.address.addressCountry || data.address.country || 'US'
      } : undefined,
      geo: data.geo || (data.latitude && data.longitude) ? {
        '@type': 'GeoCoordinates',
        latitude: data.latitude || data.geo?.latitude,
        longitude: data.longitude || data.geo?.longitude
      } : undefined,
      telephone: data.telephone || data.phone,
      url: data.url || data.website,
      priceRange: data.priceRange,
      openingHoursSpecification: data.openingHours || data.openingHoursSpecification,
      aggregateRating: data.rating || data.aggregateRating ? {
        '@type': 'AggregateRating',
        ratingValue: data.rating?.ratingValue || data.aggregateRating?.ratingValue || '0',
        reviewCount: data.rating?.reviewCount || data.aggregateRating?.reviewCount || '0'
      } : undefined,
      servesCuisine: data.servesCuisine,
      acceptsReservations: data.acceptsReservations
    };
  }

  /**
   * Create Restaurant template (extends LocalBusiness)
   * @private
   */
  static _createRestaurantTemplate(data = {}) {
    const business = this._createLocalBusinessTemplate(data);
    return {
      ...business,
      '@type': 'Restaurant',
      servesCuisine: data.servesCuisine || data.cuisine,
      acceptsReservations: data.acceptsReservations !== false,
      menu: data.menu
    };
  }

  /**
   * Create Store template (extends LocalBusiness)
   * @private
   */
  static _createStoreTemplate(data = {}) {
    const business = this._createLocalBusinessTemplate(data);
    return {
      ...business,
      '@type': 'Store',
      paymentAccepted: data.paymentAccepted,
      currenciesAccepted: data.currenciesAccepted
    };
  }

  /**
   * Create Event template
   * @private
   */
  static _createEventTemplate(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: data.name || '[Event Name]',
      description: data.description,
      image: data.image || data.images || [],
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate,
      eventStatus: data.eventStatus || 'https://schema.org/EventScheduled',
      eventAttendanceMode: data.eventAttendanceMode || 'https://schema.org/OfflineEventAttendanceMode',
      location: data.location ? {
        '@type': data.location.isVirtual ? 'VirtualLocation' : 'Place',
        name: data.location.name,
        address: data.location.address ? {
          '@type': 'PostalAddress',
          streetAddress: data.location.address.streetAddress || data.location.address.street,
          addressLocality: data.location.address.addressLocality || data.location.address.city,
          addressRegion: data.location.address.addressRegion || data.location.address.state,
          postalCode: data.location.address.postalCode || data.location.address.zip,
          addressCountry: data.location.address.addressCountry || data.location.address.country
        } : undefined,
        url: data.location.url
      } : undefined,
      organizer: data.organizer ? {
        '@type': 'Organization',
        name: typeof data.organizer === 'string' ? data.organizer : data.organizer.name,
        url: data.organizer.url
      } : undefined,
      performer: data.performer ? {
        '@type': 'Person',
        name: typeof data.performer === 'string' ? data.performer : data.performer.name
      } : undefined,
      offers: data.offers || data.price ? {
        '@type': 'Offer',
        url: data.offers?.url || data.url,
        price: data.offers?.price || data.price,
        priceCurrency: data.offers?.priceCurrency || data.priceCurrency || 'USD',
        availability: data.offers?.availability || 'https://schema.org/InStock',
        validFrom: data.offers?.validFrom
      } : undefined
    };
  }

  /**
   * Create Recipe template
   * @private
   */
  static _createRecipeTemplate(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: data.name || '[Recipe Name]',
      description: data.description,
      image: data.image || data.images || [],
      author: data.author ? {
        '@type': 'Person',
        name: typeof data.author === 'string' ? data.author : data.author.name
      } : undefined,
      datePublished: data.datePublished,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      totalTime: data.totalTime,
      recipeYield: data.recipeYield || data.servings,
      recipeCategory: data.recipeCategory || data.category,
      recipeCuisine: data.recipeCuisine || data.cuisine,
      recipeIngredient: data.recipeIngredient || data.ingredients || [],
      recipeInstructions: data.recipeInstructions || data.instructions || [],
      nutrition: data.nutrition ? {
        '@type': 'NutritionInformation',
        calories: data.nutrition.calories,
        fatContent: data.nutrition.fatContent,
        carbohydrateContent: data.nutrition.carbohydrateContent,
        proteinContent: data.nutrition.proteinContent
      } : undefined,
      aggregateRating: data.rating || data.aggregateRating ? {
        '@type': 'AggregateRating',
        ratingValue: data.rating?.ratingValue || data.aggregateRating?.ratingValue || '0',
        reviewCount: data.rating?.reviewCount || data.aggregateRating?.reviewCount || '0'
      } : undefined,
      keywords: data.keywords
    };
  }

  /**
   * Create VideoObject template
   * @private
   */
  static _createVideoObjectTemplate(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: data.name || '[Video Title]',
      description: data.description,
      thumbnailUrl: data.thumbnailUrl || data.thumbnail || data.image,
      uploadDate: data.uploadDate || new Date().toISOString(),
      duration: data.duration,
      contentUrl: data.contentUrl || data.url,
      embedUrl: data.embedUrl,
      interactionStatistic: data.views ? {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/WatchAction',
        userInteractionCount: data.views
      } : undefined,
      publisher: data.publisher ? {
        '@type': 'Organization',
        name: typeof data.publisher === 'string' ? data.publisher : data.publisher.name,
        logo: data.publisher.logo ? {
          '@type': 'ImageObject',
          url: data.publisher.logo
        } : undefined
      } : undefined
    };
  }

  /**
   * Create WebPage template
   * @private
   */
  static _createWebPageTemplate(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: data.name || data.title || '[Page Title]',
      description: data.description,
      url: data.url,
      inLanguage: data.inLanguage || 'en',
      isPartOf: data.isPartOf,
      primaryImageOfPage: data.primaryImageOfPage || data.image ? {
        '@type': 'ImageObject',
        url: data.primaryImageOfPage || data.image
      } : undefined,
      datePublished: data.datePublished,
      dateModified: data.dateModified,
      author: data.author ? {
        '@type': 'Person',
        name: typeof data.author === 'string' ? data.author : data.author.name
      } : undefined
    };
  }

  /**
   * Create Organization template
   * @private
   */
  static _createOrganizationTemplate(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: data.name || '[Organization Name]',
      description: data.description,
      url: data.url || data.website,
      logo: data.logo ? {
        '@type': 'ImageObject',
        url: data.logo
      } : undefined,
      contactPoint: data.contactPoint || data.phone || data.email ? {
        '@type': 'ContactPoint',
        telephone: data.contactPoint?.telephone || data.phone,
        email: data.contactPoint?.email || data.email,
        contactType: data.contactPoint?.contactType || 'customer service'
      } : undefined,
      address: data.address ? {
        '@type': 'PostalAddress',
        streetAddress: data.address.streetAddress || data.address.street,
        addressLocality: data.address.addressLocality || data.address.city,
        addressRegion: data.address.addressRegion || data.address.state,
        postalCode: data.address.postalCode || data.address.zip,
        addressCountry: data.address.addressCountry || data.address.country
      } : undefined,
      sameAs: data.sameAs || data.socialMedia
    };
  }

  /**
   * Create Person template
   * @private
   */
  static _createPersonTemplate(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: data.name || '[Person Name]',
      givenName: data.givenName || data.firstName,
      familyName: data.familyName || data.lastName,
      email: data.email,
      telephone: data.telephone || data.phone,
      url: data.url || data.website,
      image: data.image || data.photo,
      jobTitle: data.jobTitle,
      worksFor: data.worksFor ? {
        '@type': 'Organization',
        name: typeof data.worksFor === 'string' ? data.worksFor : data.worksFor.name
      } : undefined,
      sameAs: data.sameAs || data.socialMedia,
      address: data.address ? {
        '@type': 'PostalAddress',
        streetAddress: data.address.streetAddress || data.address.street,
        addressLocality: data.address.addressLocality || data.address.city,
        addressRegion: data.address.addressRegion || data.address.state,
        postalCode: data.address.postalCode || data.address.zip,
        addressCountry: data.address.addressCountry || data.address.country
      } : undefined
    };
  }

  /**
   * Create FAQPage template
   * @private
   */
  static _createFAQPageTemplate(data = {}) {
    const questions = data.questions || data.faqs || [];
    
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: questions.map(q => ({
        '@type': 'Question',
        name: q.question || q.name,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.answer || q.text
        }
      }))
    };
  }

  /**
   * Create HowTo template
   * @private
   */
  static _createHowToTemplate(data = {}) {
    const steps = data.steps || data.instructions || [];
    
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: data.name || '[How-To Title]',
      description: data.description,
      image: data.image || data.images || [],
      totalTime: data.totalTime,
      estimatedCost: data.estimatedCost,
      tool: data.tool || data.tools,
      supply: data.supply || data.supplies || data.materials,
      step: steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name || step.title || `Step ${index + 1}`,
        text: step.text || step.description,
        image: step.image,
        url: step.url
      }))
    };
  }

  /**
   * Create generic Thing template (fallback)
   * @private
   */
  static _createThingTemplate(type, data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type': type || 'Thing',
      name: data.name || `[${type} Name]`,
      description: data.description,
      url: data.url,
      image: data.image || data.images || []
    };
  }

  /**
   * Clean template by removing undefined/null values
   * @param {Object} template - Template to clean
   * @returns {Object} Cleaned template
   */
  static cleanTemplate(template) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(template)) {
      if (value === undefined || value === null) {
        continue;
      }
      
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleaned[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        const cleanedObj = this.cleanTemplate(value);
        if (Object.keys(cleanedObj).length > 0) {
          cleaned[key] = cleanedObj;
        }
      } else {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  /**
   * Merge template with custom data
   * @param {string} type - Schema type
   * @param {Object} data - Data to merge
   * @returns {Object} Merged schema
   */
  static create(type, data = {}) {
    const template = this.getTemplate(type, data);
    const cleaned = this.cleanTemplate(template);
    return cleaned;
  }
}

