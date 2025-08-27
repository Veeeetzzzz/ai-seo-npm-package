export interface SEOOptions {
  pageType?: string;
  questionType?: string;
  answerType?: string;
  schema?: Record<string, any>;
  debug?: boolean;
  validate?: boolean;
  allowDuplicates?: boolean;
  id?: string | null;
  analytics?: boolean | ((data: any) => void);
}

export interface SchemaInfo {
  id: string;
  type: string;
  timestamp: number;
  element: HTMLScriptElement;
}

export interface SchemaRegistryEntry {
  element: HTMLScriptElement;
  schema: Record<string, any>;
  timestamp: number;
}

export interface MultipleSchemaResult {
  schema: Record<string, any>;
  element: HTMLScriptElement | null;
  success: boolean;
  index: number;
}

export interface MultipleSchemaOptions {
  debug?: boolean;
  validate?: boolean;
  allowDuplicates?: boolean;
  id?: string;
  analytics?: boolean | ((data: any) => void);
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number;
}

export interface ValidationOptions {
  strict?: boolean;
  suggestions?: boolean;
}

export interface AnalyticsEvent {
  action: string;
  schema_type?: string;
  timestamp: string;
  page_url?: string;
  [key: string]: any;
}

export interface SchemaMetrics {
  total_schemas: number;
  schema_types: Record<string, number>;
  injection_timestamps: number[];
  page_url: string;
  collected_at: string;
}

// Schema Helper Types
export interface ProductSchemaOptions {
  name?: string;
  description?: string;
  image?: string | string[];
  brand?: string | Record<string, any>;
  offers?: Record<string, any>;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    [key: string]: any;
  };
  review?: Record<string, any> | Record<string, any>[];
  sku?: string;
  mpn?: string;
  gtin?: string;
  [key: string]: any;
}

export interface ArticleSchemaOptions {
  headline?: string;
  description?: string;
  author?: string | Record<string, any>;
  datePublished?: string;
  dateModified?: string;
  image?: string | string[];
  publisher?: string | Record<string, any>;
  url?: string;
  wordCount?: number;
  articleSection?: string;
  keywords?: string | string[];
  [key: string]: any;
}

export interface LocalBusinessSchemaOptions {
  name?: string;
  description?: string;
  address?: string | Record<string, any>;
  telephone?: string;
  openingHours?: string | string[];
  url?: string;
  image?: string | string[];
  priceRange?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    [key: string]: any;
  };
  geo?: {
    latitude: number;
    longitude: number;
    [key: string]: any;
  };
  businessType?: string;
  [key: string]: any;
}

export interface EventSchemaOptions {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string | Record<string, any>;
  organizer?: string | Record<string, any>;
  offers?: Record<string, any> | Record<string, any>[];
  image?: string | string[];
  url?: string;
  eventStatus?: string;
  eventAttendanceMode?: string;
  [key: string]: any;
}

export interface SSRScriptOptions {
  pretty?: boolean;
  id?: string | null;
  dataAttributes?: Record<string, string>;
}

export interface SocialMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

export interface NextJSHeadContent {
  jsonLd: string;
  socialMeta: string;
  combined: string;
}

export interface NuxtHeadConfig {
  script: Array<{
    type: string;
    innerHTML: string;
  }>;
  meta?: Array<{
    property?: string;
    name?: string;
    content: string;
  }>;
}

// Schema Composer Class
export declare class SchemaComposer {
  constructor(type?: string);
  name(value: string): SchemaComposer;
  description(value: string): SchemaComposer;
  url(value: string): SchemaComposer;
  image(value: string | string[]): SchemaComposer;
  address(value: string | Record<string, any>): SchemaComposer;
  telephone(value: string): SchemaComposer;
  email(value: string): SchemaComposer;
  brand(value: string | Record<string, any>): SchemaComposer;
  offers(priceOptions: Record<string, any> | Record<string, any>[]): SchemaComposer;
  author(value: string | Record<string, any>): SchemaComposer;
  publisher(value: string | Record<string, any>): SchemaComposer;
  datePublished(value: string): SchemaComposer;
  dateModified(value: string): SchemaComposer;
  keywords(value: string | string[]): SchemaComposer;
  startDate(value: string): SchemaComposer;
  endDate(value: string): SchemaComposer;
  location(value: string | Record<string, any>): SchemaComposer;
  organizer(value: string | Record<string, any>): SchemaComposer;
  rating(ratingValue: number, reviewCount: number, bestRating?: number, worstRating?: number): SchemaComposer;
  review(reviewData: Record<string, any> | Record<string, any>[]): SchemaComposer;
  geo(latitude: number, longitude: number): SchemaComposer;
  openingHours(hours: string | string[]): SchemaComposer;
  priceRange(range: string): SchemaComposer;
  addProperty(key: string, value: any): SchemaComposer;
  merge(otherSchema: Record<string, any>): SchemaComposer;
  build(): Record<string, any>;
  inject(options?: SEOOptions): HTMLScriptElement | null;
}

// Factory Functions
export declare function createSchema(type: string): SchemaComposer;
export declare function product(): SchemaComposer;
export declare function article(): SchemaComposer;
export declare function organization(): SchemaComposer;
export declare function localBusiness(businessType?: string): SchemaComposer;
export declare function event(): SchemaComposer;
export declare function person(): SchemaComposer;
export declare function website(): SchemaComposer;
export declare function webpage(): SchemaComposer;

// Framework Integrations
export declare const Frameworks: {
  React: {
    useSEO: (schemaOrFunction: any, deps?: any[]) => {
      schema: any;
      update: () => void;
      cleanup: () => void;
    };
    useMultipleSEO: (schemasOrFunction: any, deps?: any[]) => {
      elements: HTMLScriptElement[];
      update: () => void;
      cleanup: () => void;
    };
    withSEO: (Component: any, schemaOrFunction: any) => any;
  };
  Vue: {
    useSEO: (schemaOrRef: any, options?: any) => {
      element: HTMLScriptElement | null;
      update: () => void;
      cleanup: () => void;
    };
    useMultipleSEO: (schemasOrRef: any, options?: any) => {
      elements: HTMLScriptElement[];
      update: () => void;
      cleanup: () => void;
    };
  };
  Svelte: {
    createSEOStore: (initialSchema?: any) => {
      subscribe: (callback: (schema: any) => void) => () => void;
      set: (schema: any) => void;
      update: (updater: (schema: any) => any) => void;
      get: () => any;
    };
    createMultipleSEOStore: (initialSchemas?: any[]) => {
      subscribe: (callback: (schemas: any[]) => void) => () => void;
      set: (schemas: any[]) => void;
      update: (updater: (schemas: any[]) => any[]) => void;
      get: () => any[];
    };
  };
};

// Templates
export declare const Templates: {
  ecommerce: {
    productPage: (productData: any) => Record<string, any>;
    onlineStore: (storeData: any) => Record<string, any>;
  };
  restaurant: {
    restaurant: (restaurantData: any) => Record<string, any>;
    menuItem: (itemData: any) => Record<string, any>;
  };
  healthcare: {
    medicalOrganization: (practiceData: any) => Record<string, any>;
    physician: (doctorData: any) => Record<string, any>;
  };
  realEstate: {
    realEstateProperty: (propertyData: any) => Record<string, any>;
    realEstateAgency: (agencyData: any) => Record<string, any>;
  };
  education: {
    school: (schoolData: any) => Record<string, any>;
    course: (courseData: any) => Record<string, any>;
  };
  professional: {
    lawFirm: (firmData: any) => Record<string, any>;
    consultingFirm: (firmData: any) => Record<string, any>;
  };
  events: {
    conference: (eventData: any) => Record<string, any>;
    workshop: (workshopData: any) => Record<string, any>;
  };
  jobs: {
    jobPosting: (jobData: any) => Record<string, any>;
    company: (companyData: any) => Record<string, any>;
  };
  recipe: {
    recipe: (recipeData: any) => Record<string, any>;
    menu: (menuData: any) => Record<string, any>;
  };
  media: {
    video: (videoData: any) => Record<string, any>;
    podcast: (episodeData: any) => Record<string, any>;
    software: (appData: any) => Record<string, any>;
  };
  content: {
    blogPost: (postData: any) => Record<string, any>;
    faqPage: (faqData: any) => Record<string, any>;
  };
};

// Analytics
export declare const Analytics: {
  trackSchemaInjection: (schema: Record<string, any>, options?: any) => void;
  trackValidation: (schema: Record<string, any>, validationResult: ValidationResult, options?: any) => void;
  measurePerformance: <T>(operation: string, fn: () => T, options?: any) => T;
  getSchemaMetrics: () => SchemaMetrics | null;
  exportAnalytics: (format?: 'json' | 'csv') => string | null;
};

// Schema Helpers
export declare const SchemaHelpers: {
  createProduct(options?: ProductSchemaOptions): Record<string, any>;
  createArticle(options?: ArticleSchemaOptions): Record<string, any>;
  createLocalBusiness(options?: LocalBusinessSchemaOptions): Record<string, any>;
  createEvent(options?: EventSchemaOptions): Record<string, any>;
};

// SSR Utilities
export declare const SSR: {
  generateScriptTag(schema: Record<string, any>, options?: SSRScriptOptions): string;
  generateMultipleScriptTags(schemas: Record<string, any>[], options?: SSRScriptOptions): string;
  generateJSONString(schema: Record<string, any>, pretty?: boolean): string;
  generateSocialMeta(data?: SocialMetaOptions): string;
  frameworks: {
    nextJS: {
      generateHeadContent(schema: Record<string, any>, socialMeta?: SocialMetaOptions): NextJSHeadContent;
    };
    nuxt: {
      generateHeadConfig(schema: Record<string, any>, socialMeta?: SocialMetaOptions): NuxtHeadConfig;
    };
  };
};

// Enhanced Validation
export declare function validateSchemaEnhanced(schema: Record<string, any>, options?: ValidationOptions): ValidationResult;
export declare function validateSchemaRealtime(schema: Record<string, any>, options?: RealtimeValidationOptions): ValidationResult | Promise<ValidationResult>;
export declare function analyzeSchemaQuality(schema: Record<string, any>, options?: QualityAnalysisOptions): QualityAnalysisResult;
export declare function optimizeSchema(schema: Record<string, any>, options?: OptimizationOptions): OptimizationResult;
export declare function getSchemaSupgestions(schemaType: string): string[];
export declare function getSchemaSuggestions(schemaType: string): string[];

export interface RealtimeValidationOptions {
  live?: boolean;
  callback?: (result: ValidationResult) => void;
  debounceMs?: number;
  includeWarnings?: boolean;
  includeSuggestions?: boolean;
}

export interface QualityAnalysisOptions {
  includeCompetitorAnalysis?: boolean;
  includePerformanceMetrics?: boolean;
  includeSEOImpact?: boolean;
}

export interface OptimizationOptions {
  autoFix?: boolean;
  aggressive?: boolean;
  preserveCustom?: boolean;
}

export interface QualityAnalysisResult extends ValidationResult {
  qualityMetrics: {
    completeness: number;
    seoOptimization: number;
    technicalCorrectness: number;
    richResultsEligibility: {
      eligible: boolean;
      score: number;
      missing: string[];
      type: string;
    };
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    property: string;
    message: string;
    example: string;
  }>;
  benchmarks: {
    averageScore: number;
    topPercentileScore: number;
    commonIssues: string[];
  };
  performanceMetrics?: {
    schemaSize: number;
    compressionRatio: number;
    loadImpact: string;
  };
  seoImpact?: {
    richResultsScore: number;
    searchVisibilityScore: number;
    competitorAdvantage: any;
  };
}

export interface OptimizationResult {
  original: Record<string, any>;
  optimized: Record<string, any>;
  optimizations: Array<{
    type: 'fix' | 'optimization' | 'enhancement';
    property: string;
    action: string;
    reason: string;
  }>;
  qualityImprovement: {
    scoreImprovement: number;
    issuesFixed: number;
    enhancementsAdded: number;
  };
  recommendations: Array<{
    priority: string;
    property: string;
    message: string;
    example: string;
  }>;
}

/**
 * Initialize AI-friendly SEO schema injection with enhanced features
 * @param options - Configuration options for the schema
 * @returns The created script element or null if not in browser environment or validation fails
 */
export function initSEO(options?: SEOOptions): HTMLScriptElement | null;

/**
 * Inject multiple schemas at once
 * @param schemas - Array of schema objects to inject
 * @param options - Configuration options
 * @returns Array of injection results
 */
export function injectMultipleSchemas(schemas: Record<string, any>[], options?: MultipleSchemaOptions): MultipleSchemaResult[];

/**
 * Quick FAQ setup - simplified alias for initSEO
 * @param question - The FAQ question
 * @param answer - The FAQ answer
 * @param options - Additional options to pass to initSEO
 * @returns The created script element or null if not in browser environment
 */
export function addFAQ(question: string, answer: string, options?: Omit<SEOOptions, 'questionType' | 'answerType'>): HTMLScriptElement | null;

/**
 * Remove a specific schema by its ID
 * @param schemaId - The ID of the schema to remove
 * @returns True if the schema was successfully removed, false otherwise
 */
export function removeSchema(schemaId: string): boolean;

/**
 * Remove all ai-seo injected schemas from the page
 * @returns The number of schemas that were removed
 */
export function removeAllSchemas(): number;

/**
 * List all currently injected schemas
 * @returns Array of schema information objects
 */
export function listSchemas(): SchemaInfo[];

/**
 * Get schema data by ID
 * @param schemaId - The ID of the schema to retrieve
 * @returns Schema registry entry or null if not found
 */
export function getSchema(schemaId: string): SchemaRegistryEntry | null; 