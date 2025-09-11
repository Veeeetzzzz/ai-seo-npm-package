/**
 * AI-SEO CLI - Developer Tools TypeScript Definitions
 * V1.7.0 - Developer Experience Revolution
 */

export interface CLIConfig {
  framework: 'vanilla' | 'nextjs' | 'react' | 'vue' | 'svelte';
  ai: {
    optimization: {
      target: ('chatgpt' | 'bard' | 'claude' | 'perplexity')[];
      semanticEnhancement: boolean;
      voiceOptimization: boolean;
    };
  };
  validation?: {
    strict: boolean;
    suggestions: boolean;
  };
  performance?: {
    caching: boolean;
    lazyLoading: boolean;
  };
  ssr?: boolean;
  hooks?: boolean;
}

export interface AnalysisResult {
  recommendedType: string;
  confidence: number;
  keywords?: string[];
  entities?: {
    people: string[];
    places: string[];
    organizations: string[];
  };
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  typeScores: Record<string, number>;
}

export interface ValidationResult {
  score: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface GenerationResult {
  schema: any;
  confidence: number;
  type: string;
  metrics?: {
    readabilityScore: number;
    keywordDensity: number;
    semanticRichness: number;
  };
}

export interface CLIOptions {
  verbose?: boolean;
  strict?: boolean;
  voice?: boolean;
  multiple?: boolean;
  metrics?: boolean;
}

/**
 * Main CLI class for AI-SEO developer tools
 */
export default class CLI {
  constructor();
  
  /**
   * Run CLI with provided arguments
   */
  run(args: string[]): Promise<void>;
  
  /**
   * Initialize AI-SEO in a project
   */
  initCommand(params: string[]): void;
  
  /**
   * Analyze content or URLs with AI
   */
  analyzeCommand(params: string[]): Promise<void>;
  
  /**
   * Validate existing schema file
   */
  validateCommand(params: string[]): void;
  
  /**
   * Optimize schema with AI for LLMs
   */
  optimizeCommand(params: string[]): Promise<void>;
  
  /**
   * Generate schema from content using AI
   */
  generateCommand(params: string[]): Promise<void>;
  
  /**
   * Build optimized schemas for production
   */
  buildCommand(params: string[]): void;
  
  /**
   * Show help information
   */
  helpCommand(): void;
  
  /**
   * Show version information
   */
  versionCommand(): void;
}

/**
 * Utility functions for CLI operations
 */
export declare function colorize(text: string, color: string): string;
export declare function log(message: string, color?: string): void;
export declare function error(message: string): never;
export declare function success(message: string): void;
export declare function warning(message: string): void;
export declare function info(message: string): void;
