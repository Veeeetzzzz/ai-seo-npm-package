/**
 * Performance Monitor - v1.12.0
 * Track and optimize performance metrics
 * 
 * Features:
 * - Execution time tracking
 * - Memory usage monitoring
 * - Performance profiling
 * - Bottleneck detection
 * - Optimization suggestions
 */

export class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      trackMemory: options.trackMemory !== false,
      trackTiming: options.trackTiming !== false,
      warnThreshold: options.warnThreshold || 5000, // 5 seconds
      maxEntries: options.maxEntries || 1000
    };

    this.metrics = {
      timings: [],
      memory: [],
      operations: new Map()
    };

    this.activeOperations = new Map();
  }

  /**
   * Start tracking an operation
   * @param {string} name - Operation name
   * @param {Object} metadata - Additional metadata
   * @returns {string} Operation ID
   */
  start(name, metadata = {}) {
    if (!this.options.enabled) {
      return null;
    }

    const id = `${name}_${Date.now()}_${Math.random()}`;
    const operation = {
      id,
      name,
      startTime: Date.now(),
      startMemory: this._getMemoryUsage(),
      metadata
    };

    this.activeOperations.set(id, operation);
    return id;
  }

  /**
   * End tracking an operation
   * @param {string} id - Operation ID from start()
   * @returns {Object} Performance metrics
   */
  end(id) {
    if (!this.options.enabled || !id) {
      return null;
    }

    const operation = this.activeOperations.get(id);
    if (!operation) {
      return null;
    }

    const endTime = Date.now();
    const endMemory = this._getMemoryUsage();
    const duration = endTime - operation.startTime;

    const metrics = {
      name: operation.name,
      duration,
      startTime: operation.startTime,
      endTime,
      memoryDelta: endMemory - operation.startMemory,
      metadata: operation.metadata
    };

    // Store timing
    if (this.options.trackTiming) {
      this.metrics.timings.push({
        name: operation.name,
        duration,
        timestamp: endTime
      });

      this._cleanOldMetrics();
    }

    // Store memory
    if (this.options.trackMemory) {
      this.metrics.memory.push({
        name: operation.name,
        memoryDelta: metrics.memoryDelta,
        timestamp: endTime
      });

      this._cleanOldMetrics();
    }

    // Update operation statistics
    if (!this.metrics.operations.has(operation.name)) {
      this.metrics.operations.set(operation.name, {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0
      });
    }

    const stats = this.metrics.operations.get(operation.name);
    stats.count++;
    stats.totalDuration += duration;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.avgDuration = stats.totalDuration / stats.count;

    // Clean up
    this.activeOperations.delete(id);

    // Warn if slow
    if (duration > this.options.warnThreshold) {
      console.warn(`[Performance] Slow operation: ${operation.name} took ${duration}ms`);
    }

    return metrics;
  }

  /**
   * Measure async function execution
   * @param {string} name - Operation name
   * @param {Function} fn - Function to measure
   * @returns {Promise<*>} Function result
   */
  async measure(name, fn) {
    const id = this.start(name);
    try {
      const result = await fn();
      this.end(id);
      return result;
    } catch (error) {
      this.end(id);
      throw error;
    }
  }

  /**
   * Get memory usage
   * @private
   */
  _getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Clean old metrics to prevent memory growth
   * @private
   */
  _cleanOldMetrics() {
    if (this.metrics.timings.length > this.options.maxEntries) {
      this.metrics.timings = this.metrics.timings.slice(-this.options.maxEntries);
    }

    if (this.metrics.memory.length > this.options.maxEntries) {
      this.metrics.memory = this.metrics.memory.slice(-this.options.maxEntries);
    }
  }

  /**
   * Get performance statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const operations = {};
    for (const [name, stats] of this.metrics.operations.entries()) {
      operations[name] = { ...stats };
    }

    return {
      operations,
      activeOperations: this.activeOperations.size,
      totalTimings: this.metrics.timings.length,
      totalMemoryPoints: this.metrics.memory.length,
      currentMemory: this._getMemoryUsage()
    };
  }

  /**
   * Get slowest operations
   * @param {number} limit - Number of operations to return
   * @returns {Array} Slowest operations
   */
  getSlowest(limit = 10) {
    return Array.from(this.metrics.operations.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  /**
   * Get most frequent operations
   * @param {number} limit - Number of operations to return
   * @returns {Array} Most frequent operations
   */
  getMostFrequent(limit = 10) {
    return Array.from(this.metrics.operations.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get optimization suggestions
   * @returns {Array} Suggestions
   */
  getSuggestions() {
    const suggestions = [];

    for (const [name, stats] of this.metrics.operations.entries()) {
      // Slow operations
      if (stats.avgDuration > this.options.warnThreshold) {
        suggestions.push({
          type: 'slow',
          operation: name,
          avgDuration: stats.avgDuration.toFixed(2) + 'ms',
          suggestion: `Consider optimizing ${name} - average duration exceeds threshold`
        });
      }

      // High frequency operations
      if (stats.count > 100) {
        suggestions.push({
          type: 'frequency',
          operation: name,
          count: stats.count,
          suggestion: `${name} called ${stats.count} times - consider caching or batching`
        });
      }

      // Variable duration
      const variance = stats.maxDuration - stats.minDuration;
      if (variance > stats.avgDuration * 2) {
        suggestions.push({
          type: 'variance',
          operation: name,
          variance: variance.toFixed(2) + 'ms',
          suggestion: `${name} has high duration variance - investigate inconsistent performance`
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate performance report
   * @returns {string} Formatted report
   */
  generateReport() {
    const stats = this.getStats();
    const slowest = this.getSlowest(5);
    const suggestions = this.getSuggestions();

    let report = '=== Performance Report ===\n\n';

    report += `Active Operations: ${stats.activeOperations}\n`;
    report += `Total Operations Tracked: ${Object.keys(stats.operations).length}\n`;
    report += `Current Memory: ${stats.currentMemory.toFixed(2)} MB\n\n`;

    report += '--- Slowest Operations ---\n';
    for (const op of slowest) {
      report += `${op.name}: avg ${op.avgDuration.toFixed(2)}ms (${op.count} calls)\n`;
    }

    if (suggestions.length > 0) {
      report += '\n--- Optimization Suggestions ---\n';
      for (const suggestion of suggestions) {
        report += `[${suggestion.type}] ${suggestion.suggestion}\n`;
      }
    }

    return report;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      timings: [],
      memory: [],
      operations: new Map()
    };
    this.activeOperations.clear();
  }

  /**
   * Export metrics to JSON
   * @returns {Object} Metrics data
   */
  export() {
    return {
      timings: this.metrics.timings,
      memory: this.metrics.memory,
      operations: Array.from(this.metrics.operations.entries()).map(([name, stats]) => ({
        name,
        ...stats
      }))
    };
  }
}

// Global monitor instance
let globalMonitor = null;

/**
 * Get global performance monitor
 * @param {Object} options - Monitor options
 * @returns {PerformanceMonitor} Monitor instance
 */
export function getPerformanceMonitor(options = {}) {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(options);
  }
  return globalMonitor;
}

/**
 * Reset global monitor
 */
export function resetPerformanceMonitor() {
  if (globalMonitor) {
    globalMonitor.reset();
  }
  globalMonitor = null;
}

/**
 * Measure async function (convenience function)
 * @param {string} name - Operation name
 * @param {Function} fn - Function to measure
 * @returns {Promise<*>} Function result
 */
export async function measure(name, fn) {
  const monitor = getPerformanceMonitor();
  return monitor.measure(name, fn);
}

