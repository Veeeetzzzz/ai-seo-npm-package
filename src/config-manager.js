/**
 * Config Manager - v1.12.0
 * Manage configuration files and formats
 * 
 * Features:
 * - Load/save configuration files
 * - Multiple output formats (JSON, CSV, HTML)
 * - Config validation
 * - Format conversion
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export class ConfigManager {
  constructor(options = {}) {
    this.options = {
      configFile: options.configFile || '.aiseorc.json',
      searchPaths: options.searchPaths || [process.cwd(), process.env.HOME || process.env.USERPROFILE]
    };

    this.config = this._getDefaultConfig();
  }

  /**
   * Get default configuration
   * @private
   */
  _getDefaultConfig() {
    return {
      cache: {
        enabled: true,
        ttl: 3600000,
        storage: 'memory'
      },
      rateLimiting: {
        enabled: true,
        maxRequests: 10,
        windowMs: 60000
      },
      performance: {
        enabled: true,
        trackMemory: true,
        warnThreshold: 5000
      },
      generation: {
        concurrency: 3,
        retryOnFail: true,
        maxRetries: 3,
        useCache: true,
        optimizeFor: []
      },
      output: {
        format: 'json',
        pretty: true
      }
    };
  }

  /**
   * Load configuration from file
   * @param {string} path - Config file path (optional)
   * @returns {boolean} Success status
   */
  load(path = null) {
    const configPath = path || this._findConfigFile();
    
    if (!configPath) {
      return false;
    }

    try {
      const content = readFileSync(configPath, 'utf-8');
      const loaded = JSON.parse(content);
      
      // Merge with defaults
      this.config = this._mergeConfig(this._getDefaultConfig(), loaded);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save configuration to file
   * @param {string} path - Config file path (optional)
   * @returns {boolean} Success status
   */
  save(path = null) {
    const configPath = path || join(process.cwd(), this.options.configFile);
    
    try {
      const content = JSON.stringify(this.config, null, 2);
      writeFileSync(configPath, content, 'utf-8');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find configuration file
   * @private
   */
  _findConfigFile() {
    for (const searchPath of this.options.searchPaths) {
      const configPath = join(searchPath, this.options.configFile);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    return null;
  }

  /**
   * Merge configurations
   * @private
   */
  _mergeConfig(defaults, custom) {
    const merged = { ...defaults };
    
    for (const key in custom) {
      if (typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
        merged[key] = { ...defaults[key], ...custom[key] };
      } else {
        merged[key] = custom[key];
      }
    }
    
    return merged;
  }

  /**
   * Get configuration value
   * @param {string} key - Config key (supports dot notation)
   * @returns {*} Config value
   */
  get(key) {
    const parts = key.split('.');
    let value = this.config;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Set configuration value
   * @param {string} key - Config key (supports dot notation)
   * @param {*} value - Value to set
   */
  set(key, value) {
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  /**
   * Validate configuration
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];
    
    // Validate cache settings
    if (this.config.cache) {
      if (typeof this.config.cache.ttl !== 'number' || this.config.cache.ttl < 0) {
        errors.push('cache.ttl must be a positive number');
      }
      if (!['memory', 'file'].includes(this.config.cache.storage)) {
        errors.push('cache.storage must be "memory" or "file"');
      }
    }
    
    // Validate rate limiting
    if (this.config.rateLimiting) {
      if (typeof this.config.rateLimiting.maxRequests !== 'number' || this.config.rateLimiting.maxRequests < 1) {
        errors.push('rateLimiting.maxRequests must be a positive number');
      }
    }
    
    // Validate generation settings
    if (this.config.generation) {
      if (typeof this.config.generation.concurrency !== 'number' || this.config.generation.concurrency < 1) {
        errors.push('generation.concurrency must be a positive number');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export configuration
   * @returns {Object} Configuration
   */
  export() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.config = this._getDefaultConfig();
  }
}

/**
 * Format result to different output formats
 */
export class OutputFormatter {
  /**
   * Format result to JSON
   * @param {*} data - Data to format
   * @param {boolean} pretty - Pretty print
   * @returns {string} Formatted JSON
   */
  static toJSON(data, pretty = true) {
    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  /**
   * Format result to CSV
   * @param {Array|Object} data - Data to format
   * @returns {string} Formatted CSV
   */
  static toCSV(data) {
    // Handle array of objects
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '';
      }
      
      const headers = Object.keys(data[0]);
      const rows = [headers.join(',')];
      
      for (const item of data) {
        const values = headers.map(h => {
          const value = item[h];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        });
        rows.push(values.join(','));
      }
      
      return rows.join('\n');
    }
    
    // Handle single object
    const rows = ['key,value'];
    for (const [key, value] of Object.entries(data)) {
      rows.push(`${key},${value}`);
    }
    
    return rows.join('\n');
  }

  /**
   * Format result to HTML
   * @param {*} data - Data to format
   * @returns {string} Formatted HTML
   */
  static toHTML(data) {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>AI-SEO Results</title>\n';
    html += '<style>\n';
    html += 'body { font-family: Arial, sans-serif; margin: 20px; }\n';
    html += 'table { border-collapse: collapse; width: 100%; }\n';
    html += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n';
    html += 'th { background-color: #4CAF50; color: white; }\n';
    html += 'pre { background: #f4f4f4; padding: 10px; overflow: auto; }\n';
    html += '</style>\n</head>\n<body>\n';
    html += '<h1>AI-SEO Results</h1>\n';
    
    if (Array.isArray(data)) {
      html += '<table>\n';
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        html += '<tr>';
        for (const header of headers) {
          html += `<th>${header}</th>`;
        }
        html += '</tr>\n';
        
        for (const item of data) {
          html += '<tr>';
          for (const header of headers) {
            const value = item[header];
            if (typeof value === 'object') {
              html += `<td><pre>${JSON.stringify(value, null, 2)}</pre></td>`;
            } else {
              html += `<td>${value}</td>`;
            }
          }
          html += '</tr>\n';
        }
      }
      html += '</table>\n';
    } else {
      html += '<pre>' + JSON.stringify(data, null, 2) + '</pre>\n';
    }
    
    html += '</body>\n</html>';
    return html;
  }

  /**
   * Auto-detect and format
   * @param {*} data - Data to format
   * @param {string} format - Output format
   * @param {Object} options - Format options
   * @returns {string} Formatted output
   */
  static format(data, format = 'json', options = {}) {
    switch (format.toLowerCase()) {
      case 'json':
        return this.toJSON(data, options.pretty !== false);
      case 'csv':
        return this.toCSV(data);
      case 'html':
        return this.toHTML(data);
      default:
        return this.toJSON(data);
    }
  }
}

// Global config instance
let globalConfig = null;

/**
 * Get global config manager
 * @param {Object} options - Config options
 * @returns {ConfigManager} Config manager
 */
export function getConfigManager(options = {}) {
  if (!globalConfig) {
    globalConfig = new ConfigManager(options);
    globalConfig.load(); // Auto-load if file exists
  }
  return globalConfig;
}

/**
 * Reset global config
 */
export function resetConfigManager() {
  globalConfig = null;
}

