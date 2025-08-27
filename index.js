// Simple AI-friendly SEO utility with enhanced features

// Global registry to track injected schemas
const schemaRegistry = new Map();

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

  // Schema validation
  if (validate) {
    const validation = validateSchema(jsonLd);
    if (!validation.valid) {
      debugLog(`Schema validation failed: ${validation.error}`, 'error', debug);
      if (debug) {
        console.error('[ai-seo] Invalid schema:', jsonLd);
      }
      return null;
    }
    debugLog('Schema validation passed', 'info', debug);
  }

  try {
    // Create and inject script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd, null, debug ? 2 : 0);
    script.setAttribute('data-ai-seo', 'true');
    script.setAttribute('data-ai-seo-id', schemaId);
    script.setAttribute('data-ai-seo-type', jsonLd['@type']);
    
    document.head.appendChild(script);
    
    // Register in global registry for cleanup
    schemaRegistry.set(schemaId, {
      element: script,
      schema: jsonLd,
      timestamp: Date.now()
    });
    
    debugLog(`Schema injected successfully with ID: ${schemaId}`, 'info', debug);
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