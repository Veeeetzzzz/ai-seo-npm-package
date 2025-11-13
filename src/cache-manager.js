/**
 * Cache Manager - v1.12.0
 * Intelligent caching system for generated schemas
 * 
 * Features:
 * - In-memory caching with TTL
 * - File system caching
 * - Cache invalidation
 * - Size management
 * - Statistics tracking
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

export class CacheManager {
  constructor(options = {}) {
    this.options = {
      ttl: options.ttl || 3600000, // 1 hour default
      maxSize: options.maxSize || 100, // Max cached items
      storage: options.storage || 'memory', // 'memory' or 'file'
      cacheDir: options.cacheDir || './.cache/ai-seo',
      enabled: options.enabled !== false
    };

    // In-memory cache
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };

    // Initialize file cache if needed
    if (this.options.storage === 'file' && this.options.enabled) {
      this._initFileCache();
    }
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  get(key) {
    if (!this.options.enabled) {
      return null;
    }

    // Try memory cache first
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      
      // Check if expired
      if (Date.now() > entry.expires) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update access time
      entry.accessed = Date.now();
      this.stats.hits++;
      return entry.value;
    }

    // Try file cache if enabled
    if (this.options.storage === 'file') {
      const fileEntry = this._getFromFile(key);
      if (fileEntry) {
        // Load into memory cache
        this.cache.set(key, fileEntry);
        this.stats.hits++;
        return fileEntry.value;
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in ms (optional)
   */
  set(key, value, ttl = null) {
    if (!this.options.enabled) {
      return;
    }

    const entry = {
      value,
      created: Date.now(),
      accessed: Date.now(),
      expires: Date.now() + (ttl || this.options.ttl)
    };

    // Check size limits
    if (this.cache.size >= this.options.maxSize) {
      this._evictOldest();
    }

    // Store in memory
    this.cache.set(key, entry);
    this.stats.sets++;

    // Store in file if enabled
    if (this.options.storage === 'file') {
      this._saveToFile(key, entry);
    }
  }

  /**
   * Delete cached value
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.stats.deletes++;
    }

    if (this.options.storage === 'file') {
      this._deleteFromFile(key);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    
    if (this.options.storage === 'file') {
      this._clearFileCache();
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: hitRate.toFixed(2) + '%',
      enabled: this.options.enabled
    };
  }

  /**
   * Generate cache key from URL and options
   * @param {string} url - URL
   * @param {Object} options - Generation options
   * @returns {string} Cache key
   */
  static generateKey(url, options = {}) {
    const data = JSON.stringify({
      url,
      targetTypes: options.targetTypes || [],
      optimizeFor: options.optimizeFor || []
    });

    return createHash('md5').update(data).digest('hex');
  }

  /**
   * Initialize file cache directory
   * @private
   */
  _initFileCache() {
    if (!existsSync(this.options.cacheDir)) {
      mkdirSync(this.options.cacheDir, { recursive: true });
    }
  }

  /**
   * Get entry from file cache
   * @private
   */
  _getFromFile(key) {
    try {
      const filePath = join(this.options.cacheDir, `${key}.json`);
      
      if (!existsSync(filePath)) {
        return null;
      }

      const data = readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(data);

      // Check if expired
      if (Date.now() > entry.expires) {
        this._deleteFromFile(key);
        return null;
      }

      return entry;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save entry to file cache
   * @private
   */
  _saveToFile(key, entry) {
    try {
      const filePath = join(this.options.cacheDir, `${key}.json`);
      writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * Delete entry from file cache
   * @private
   */
  _deleteFromFile(key) {
    try {
      const filePath = join(this.options.cacheDir, `${key}.json`);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * Clear file cache
   * @private
   */
  _clearFileCache() {
    try {
      if (!existsSync(this.options.cacheDir)) {
        return;
      }

      const files = readdirSync(this.options.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          unlinkSync(join(this.options.cacheDir, file));
        }
      }
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * Evict oldest entry from cache
   * @private
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessed < oldestTime) {
        oldestTime = entry.accessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    const toDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.delete(key);
    }

    return toDelete.length;
  }

  /**
   * Get cache size in bytes (approximate)
   * @returns {number} Size in bytes
   */
  getSize() {
    let size = 0;

    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry.value).length;
    }

    return size;
  }

  /**
   * Export cache to JSON
   * @returns {Object} Cache data
   */
  export() {
    const data = {};

    for (const [key, entry] of this.cache.entries()) {
      data[key] = entry;
    }

    return data;
  }

  /**
   * Import cache from JSON
   * @param {Object} data - Cache data
   */
  import(data) {
    this.clear();

    for (const [key, entry] of Object.entries(data)) {
      this.cache.set(key, entry);
    }
  }
}

// Global cache instance
let globalCache = null;

/**
 * Get global cache instance
 * @param {Object} options - Cache options
 * @returns {CacheManager} Cache instance
 */
export function getCache(options = {}) {
  if (!globalCache) {
    globalCache = new CacheManager(options);
  }
  return globalCache;
}

/**
 * Reset global cache instance
 */
export function resetCache() {
  if (globalCache) {
    globalCache.clear();
  }
  globalCache = null;
}

