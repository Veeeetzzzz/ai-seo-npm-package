/**
 * AI-SEO Developer Tools TypeScript Definitions
 * V1.7.0 - Developer Experience Revolution
 */

export interface VisualBuilderOptions {
  target?: string;
  theme?: 'light' | 'dark';
  presets?: string[];
  autoSave?: boolean;
  realTimePreview?: boolean;
  aiSuggestions?: boolean;
}

export interface SchemaField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'datetime-local';
  options?: string[];
}

export interface AISuggestion {
  title: string;
  description: string;
  apply: (schema: any) => void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export interface PerformanceAnalysis {
  size: number;
  complexity: number;
  recommendations: string[];
}

/**
 * Visual Schema Builder with drag-and-drop interface
 */
export declare class VisualBuilder {
  options: VisualBuilderOptions;
  schema: any;
  history: any[];
  currentStep: number;
  elements: Map<string, HTMLElement>;
  
  constructor(options?: VisualBuilderOptions);
  
  /**
   * Initialize the visual builder
   */
  init(): void;
  
  /**
   * Create the builder container and UI
   */
  createContainer(): void;
  
  /**
   * Inject CSS styles for the builder
   */
  injectStyles(): void;
  
  /**
   * Setup event listeners for UI interactions
   */
  setupEventListeners(): void;
  
  /**
   * Load available schema presets
   */
  loadPresets(): void;
  
  /**
   * Load a specific preset by ID
   */
  loadPreset(presetId: string): void;
  
  /**
   * Render the current state of the builder
   */
  render(): void;
  
  /**
   * Render the properties panel
   */
  renderPropertiesPanel(): void;
  
  /**
   * Get field definitions for a schema type
   */
  getFieldsForType(type: string): SchemaField[];
  
  /**
   * Create a form field element
   */
  createField(type: string, key: string, label: string, value: any, options?: string[]): HTMLElement;
  
  /**
   * Update a schema value
   */
  updateSchemaValue(key: string, value: any, type: string): void;
  
  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj: any, path: string): any;
  
  /**
   * Render the schema preview
   */
  renderPreview(): void;
  
  /**
   * Save current state to history
   */
  saveToHistory(): void;
  
  /**
   * Update control button states
   */
  updateControls(): void;
  
  /**
   * Undo last action
   */
  undo(): void;
  
  /**
   * Redo last undone action
   */
  redo(): void;
  
  /**
   * Optimize schema with AI
   */
  aiOptimize(): Promise<void>;
  
  /**
   * Validate current schema
   */
  validate(): void;
  
  /**
   * Export schema as JSON file
   */
  export(): void;
  
  /**
   * Generate AI suggestions for schema improvement
   */
  generateAISuggestions(): Promise<void>;
  
  /**
   * Get AI suggestions based on current schema
   */
  getAISuggestions(): AISuggestion[];
  
  /**
   * Show notification message
   */
  showNotification(message: string, type?: 'info' | 'success' | 'error'): void;
}

/**
 * Code generation utilities for different frameworks
 */
export declare class CodeGenerator {
  /**
   * Generate React component with schema injection
   */
  static generateReactComponent(schema: any, componentName?: string): string;
  
  /**
   * Generate Vue component with schema injection
   */
  static generateVueComponent(schema: any, componentName?: string): string;
  
  /**
   * Generate Next.js page with SSG schema injection
   */
  static generateNextJSPage(schema: any, pageName?: string): string;
}

/**
 * Schema debugging and performance analysis utilities
 */
export declare class SchemaDebugger {
  /**
   * Validate schema structure and content
   */
  static validateSchema(schema: any): ValidationResult;
  
  /**
   * Analyze schema performance characteristics
   */
  static analyzePerformance(schema: any): PerformanceAnalysis;
  
  /**
   * Calculate schema complexity score
   */
  static calculateComplexity(obj: any, depth?: number): number;
  
  /**
   * Get performance optimization recommendations
   */
  static getPerformanceRecommendations(size: number, complexity: number): string[];
}

/**
 * Default export with all tools
 */
declare const tools: {
  VisualBuilder: typeof VisualBuilder;
  CodeGenerator: typeof CodeGenerator;
  SchemaDebugger: typeof SchemaDebugger;
};

export default tools;
