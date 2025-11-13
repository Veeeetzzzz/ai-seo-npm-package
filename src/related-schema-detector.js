/**
 * Related Schema Detector - v1.12.0
 * Detects and generates related schemas from content
 * 
 * Features:
 * - Detect related entities (author, organization, location)
 * - Generate breadcrumb schemas
 * - Create related article schemas
 * - Build schema relationships
 */

export class RelatedSchemaDetector {
  /**
   * Detect and generate related schemas
   * @param {Object} primarySchema - Primary schema
   * @param {Object} parsed - Parsed HTML content
   * @param {Object} analysis - Content analysis results
   * @returns {Array} Related schemas
   */
  static detectRelated(primarySchema, parsed, analysis) {
    const relatedSchemas = [];

    if (!primarySchema || !primarySchema['@type']) {
      return relatedSchemas;
    }

    const type = primarySchema['@type'];

    // Generate breadcrumbs
    if (parsed.url) {
      const breadcrumb = this._generateBreadcrumb(parsed.url);
      if (breadcrumb) {
        relatedSchemas.push(breadcrumb);
      }
    }

    // Type-specific related schemas
    switch (type) {
      case 'Article':
      case 'BlogPosting':
      case 'NewsArticle':
        relatedSchemas.push(...this._detectArticleRelated(primarySchema, parsed, analysis));
        break;

      case 'Product':
        relatedSchemas.push(...this._detectProductRelated(primarySchema, parsed, analysis));
        break;

      case 'LocalBusiness':
        relatedSchemas.push(...this._detectBusinessRelated(primarySchema, parsed, analysis));
        break;

      case 'Event':
        relatedSchemas.push(...this._detectEventRelated(primarySchema, parsed, analysis));
        break;
    }

    // Generate WebSite schema if we have enough info
    if (parsed.url) {
      const website = this._generateWebSiteSchema(parsed);
      if (website) {
        relatedSchemas.push(website);
      }
    }

    return relatedSchemas;
  }

  /**
   * Generate breadcrumb navigation schema
   * @private
   */
  static _generateBreadcrumb(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);

      if (pathParts.length === 0) {
        return null; // Homepage, no breadcrumb needed
      }

      const breadcrumbItems = [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${urlObj.origin}/`
        }
      ];

      let currentPath = '';
      pathParts.forEach((part, index) => {
        currentPath += `/${part}`;
        breadcrumbItems.push({
          '@type': 'ListItem',
          position: index + 2,
          name: this._formatBreadcrumbName(part),
          item: `${urlObj.origin}${currentPath}`
        });
      });

      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Format breadcrumb name from URL part
   * @private
   */
  static _formatBreadcrumbName(part) {
    return part
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Detect article-related schemas
   * @private
   */
  static _detectArticleRelated(primarySchema, parsed, analysis) {
    const related = [];

    // Generate Person schema for author
    if (primarySchema.author && typeof primarySchema.author === 'object' && primarySchema.author.name) {
      const person = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: primarySchema.author.name
      };

      // Add more info from analysis if available
      if (analysis?.entities?.people) {
        const authorInEntities = analysis.entities.people.find(p => 
          p.includes(primarySchema.author.name)
        );
        if (authorInEntities) {
          // Could add more details here
        }
      }

      related.push(person);
    }

    // Generate Organization schema for publisher
    if (primarySchema.publisher && typeof primarySchema.publisher === 'object' && primarySchema.publisher.name) {
      const org = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: primarySchema.publisher.name
      };

      if (primarySchema.publisher.logo) {
        org.logo = primarySchema.publisher.logo;
      }

      if (parsed.url) {
        try {
          const urlObj = new URL(parsed.url);
          org.url = urlObj.origin;
        } catch (e) {
          // Ignore
        }
      }

      related.push(org);
    }

    // Generate WebPage schema
    if (parsed.url) {
      const webpage = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': parsed.url,
        url: parsed.url,
        name: parsed.title || primarySchema.headline,
        description: parsed.description,
        isPartOf: {
          '@type': 'WebSite',
          '@id': parsed.url.split('/').slice(0, 3).join('/') + '/'
        }
      };

      if (parsed.images && parsed.images.length > 0) {
        webpage.primaryImageOfPage = {
          '@type': 'ImageObject',
          url: parsed.images[0]
        };
      }

      related.push(webpage);
    }

    return related;
  }

  /**
   * Detect product-related schemas
   * @private
   */
  static _detectProductRelated(primarySchema, parsed, analysis) {
    const related = [];

    // Generate Brand schema if product has brand
    if (primarySchema.brand && typeof primarySchema.brand === 'object' && primarySchema.brand.name) {
      const brand = {
        '@context': 'https://schema.org',
        '@type': 'Brand',
        name: primarySchema.brand.name
      };

      // Add organization info if detected
      if (analysis?.entities?.organizations) {
        const brandOrg = analysis.entities.organizations.find(org => 
          org.includes(primarySchema.brand.name)
        );
        if (brandOrg) {
          brand['@type'] = 'Organization';
        }
      }

      related.push(brand);
    }

    // Generate Organization schema for seller/manufacturer
    if (analysis?.entities?.organizations && analysis.entities.organizations.length > 0) {
      const mainOrg = analysis.entities.organizations[0];
      const org = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: mainOrg
      };

      if (parsed.url) {
        try {
          const urlObj = new URL(parsed.url);
          org.url = urlObj.origin;
        } catch (e) {
          // Ignore
        }
      }

      related.push(org);
    }

    return related;
  }

  /**
   * Detect business-related schemas
   * @private
   */
  static _detectBusinessRelated(primarySchema, parsed, analysis) {
    const related = [];

    // Generate Place schema if we have address
    if (primarySchema.address) {
      const place = {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: primarySchema.name,
        address: primarySchema.address
      };

      if (primarySchema.geo) {
        place.geo = primarySchema.geo;
      }

      related.push(place);
    }

    // Generate PostalAddress as separate entity
    if (primarySchema.address && typeof primarySchema.address === 'object') {
      const address = {
        '@context': 'https://schema.org',
        '@type': 'PostalAddress',
        ...primarySchema.address
      };

      related.push(address);
    }

    return related;
  }

  /**
   * Detect event-related schemas
   * @private
   */
  static _detectEventRelated(primarySchema, parsed, analysis) {
    const related = [];

    // Generate Place schema for event location
    if (primarySchema.location && typeof primarySchema.location === 'object') {
      const place = {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: primarySchema.location.name || 'Event Location'
      };

      if (primarySchema.location.address) {
        place.address = primarySchema.location.address;
      }

      if (primarySchema.location.geo) {
        place.geo = primarySchema.location.geo;
      }

      related.push(place);
    }

    // Generate Organization schema for organizer
    if (primarySchema.organizer && typeof primarySchema.organizer === 'object') {
      const org = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: primarySchema.organizer.name || primarySchema.organizer
      };

      if (primarySchema.organizer.url) {
        org.url = primarySchema.organizer.url;
      }

      related.push(org);
    }

    // Generate Person schema for performer
    if (primarySchema.performer && typeof primarySchema.performer === 'object') {
      const person = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: primarySchema.performer.name || primarySchema.performer
      };

      related.push(person);
    }

    return related;
  }

  /**
   * Generate WebSite schema
   * @private
   */
  static _generateWebSiteSchema(parsed) {
    try {
      const urlObj = new URL(parsed.url);
      const siteUrl = `${urlObj.origin}/`;

      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': siteUrl,
        url: siteUrl,
        name: this._extractSiteName(parsed),
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract site name from parsed content
   * @private
   */
  static _extractSiteName(parsed) {
    // Try OpenGraph site name
    if (parsed.openGraph && parsed.openGraph['og:site_name']) {
      return parsed.openGraph['og:site_name'];
    }

    // Try to extract from title (before | or -)
    if (parsed.title) {
      const parts = parsed.title.split(/[|\-–]/);
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
    }

    // Try to extract from URL
    try {
      const urlObj = new URL(parsed.url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (e) {
      return 'Website';
    }
  }

  /**
   * Build relationships between schemas
   * @param {Object} primarySchema - Primary schema
   * @param {Array} relatedSchemas - Related schemas
   * @returns {Array} Schemas with relationships
   */
  static buildRelationships(primarySchema, relatedSchemas) {
    const enhanced = JSON.parse(JSON.stringify(primarySchema)); // Deep clone

    for (const related of relatedSchemas) {
      const type = related['@type'];

      switch (type) {
        case 'Person':
          if (enhanced['@type'] === 'Article' && !enhanced.author) {
            enhanced.author = { '@id': related['@id'] || related.name };
          }
          break;

        case 'Organization':
          if (enhanced['@type'] === 'Article' && !enhanced.publisher) {
            enhanced.publisher = { '@id': related['@id'] || related.name };
          }
          if (enhanced['@type'] === 'Product' && !enhanced.manufacturer) {
            enhanced.manufacturer = { '@id': related['@id'] || related.name };
          }
          break;

        case 'Place':
          if (enhanced['@type'] === 'Event' && !enhanced.location) {
            enhanced.location = { '@id': related['@id'] || related.name };
          }
          break;

        case 'WebPage':
          if (!enhanced.isPartOf) {
            enhanced.isPartOf = { '@id': related['@id'] };
          }
          break;
      }
    }

    return [enhanced, ...relatedSchemas];
  }
}

