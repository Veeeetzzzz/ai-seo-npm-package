export interface SEOOptions {
  pageType?: string;
  questionType?: string;
  answerType?: string;
  schema?: Record<string, any>;
}

/**
 * Initialize AI-friendly SEO schema injection
 * @param options - Configuration options for the schema
 * @returns The created script element or null if not in browser environment
 */
export function initSEO(options?: SEOOptions): HTMLScriptElement | null;

/**
 * Quick FAQ setup - simplified alias for initSEO
 * @param question - The FAQ question
 * @param answer - The FAQ answer
 * @returns The created script element or null if not in browser environment
 */
export function addFAQ(question: string, answer: string): HTMLScriptElement | null; 