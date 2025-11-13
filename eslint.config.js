export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        HTMLScriptElement: 'readonly'
      }
    },
    rules: {
      // Tree-shaking friendly rules
      'no-unused-vars': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      
      // Code quality
      'no-console': 'warn', // Prefer debugLog utility over direct console usage
      'no-debugger': 'error',
      'no-alert': 'error',
      
      // Modern JS
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error'
    }
  }
]; 