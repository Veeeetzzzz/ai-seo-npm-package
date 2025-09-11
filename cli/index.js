#!/usr/bin/env node

/**
 * AI-SEO CLI - Developer Tools for Schema Management
 * V1.7.0 - Developer Experience Revolution
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { AI } from '../index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// CLI Version and Info
const CLI_VERSION = '1.8.0';
const CLI_NAME = 'ai-seo';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

function error(message) {
  console.error(colorize(`❌ Error: ${message}`, 'red'));
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// CLI Commands
class CLI {
  constructor() {
    this.commands = new Map();
    this.registerCommands();
  }

  registerCommands() {
    this.commands.set('init', this.initCommand);
    this.commands.set('analyze', this.analyzeCommand);
    this.commands.set('validate', this.validateCommand);
    this.commands.set('optimize', this.optimizeCommand);
    this.commands.set('generate', this.generateCommand);
    this.commands.set('build', this.buildCommand);
    this.commands.set('interactive', this.interactiveCommand);
    this.commands.set('deploy', this.deployCommand);
    this.commands.set('bulk', this.bulkCommand);
    this.commands.set('help', this.helpCommand);
    this.commands.set('version', this.versionCommand);
  }

  async run(args) {
    const [,, command, ...params] = args;

    if (!command || command === 'help') {
      this.helpCommand();
      return;
    }

    if (this.commands.has(command)) {
      try {
        await this.commands.get(command)(params);
      } catch (err) {
        error(`Failed to execute command '${command}': ${err.message}`);
      }
    } else {
      error(`Unknown command: ${command}. Run 'ai-seo help' for available commands.`);
    }
  }

  // Initialize AI-SEO in a project
  initCommand(params) {
    const [framework = 'vanilla'] = params;
    
    log(colorize('🚀 Initializing AI-SEO in your project...', 'bright'));
    
    const templates = {
      vanilla: {
        config: {
          framework: 'vanilla',
          ai: {
            optimization: {
              target: ['chatgpt', 'bard', 'claude'],
              semanticEnhancement: true,
              voiceOptimization: false
            }
          },
          validation: {
            strict: true,
            suggestions: true
          },
          performance: {
            caching: true,
            lazyLoading: true
          }
        },
        example: `import { AI, product, initSEO } from 'ai-seo';

// Basic setup
const schema = product()
  .name('Your Product')
  .description('Amazing product description')
  .build();

// AI-optimize for search engines
const optimized = AI.optimizeForLLM(schema, {
  target: ['chatgpt', 'bard', 'claude'],
  semanticEnhancement: true
});

// Inject into page
initSEO({ schema: optimized });`
      },
      nextjs: {
        config: {
          framework: 'nextjs',
          ai: {
            optimization: {
              target: ['chatgpt', 'bard', 'claude'],
              semanticEnhancement: true,
              voiceOptimization: true
            }
          },
          ssr: true,
          validation: {
            strict: true,
            suggestions: true
          }
        },
        example: `// app/layout.js
import { SSR, organization } from 'ai-seo';

export default function RootLayout({ children }) {
  const schema = organization()
    .name('Your Company')
    .url('https://yoursite.com')
    .build();
    
  const { jsonLd } = SSR.frameworks.nextJS.generateHeadContent(schema);

  return (
    <html>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`
      },
      react: {
        config: {
          framework: 'react',
          ai: {
            optimization: {
              target: ['chatgpt', 'bard', 'claude'],
              semanticEnhancement: true
            }
          },
          hooks: true
        },
        example: `import { Frameworks, product } from 'ai-seo';

function ProductPage({ productData }) {
  const { schema, cleanup } = Frameworks.React.useSEO(() => 
    product()
      .name(productData.name)
      .brand(productData.brand)
      .build()
  );

  return <div>Product: {productData.name}</div>;
}`
      }
    };

    const template = templates[framework] || templates.vanilla;
    
    // Create config file
    const configPath = 'ai-seo.config.json';
    writeFileSync(configPath, JSON.stringify(template.config, null, 2));
    success(`Created ${configPath}`);

    // Create example file
    const examplePath = `ai-seo.example.${framework === 'vanilla' ? 'js' : 'jsx'}`;
    writeFileSync(examplePath, template.example);
    success(`Created ${examplePath}`);

    info('🎉 AI-SEO initialized successfully!');
    info('📖 Edit ai-seo.config.json to customize settings');
    info(`📝 Check ${examplePath} for usage examples`);
    info('🚀 Run `ai-seo analyze` to analyze your content');
  }

  // Analyze content or URLs
  async analyzeCommand(params) {
    const [input, ...options] = params;
    
    if (!input) {
      error('Please provide content or URL to analyze. Example: ai-seo analyze "Your content here"');
    }

    log('🔍 Analyzing content with AI...', 'bright');

    try {
      let content = input;
      
      // If input looks like a URL, fetch content (simplified for demo)
      if (input.startsWith('http')) {
        info(`Fetching content from: ${input}`);
        // In real implementation, would fetch and extract content
        content = `Sample content from ${input}`;
        warning('URL fetching not implemented in this demo - using sample content');
      }

      // Analyze with AI
      const analysis = AI.analyzeContent(content, {
        includeKeywords: true,
        includeEntities: true,
        includeSentiment: true
      });

      if (!analysis) {
        error('Failed to analyze content');
      }

      // Display results
      log('\n📊 Analysis Results:', 'bright');
      log(`🎯 Recommended Schema Type: ${colorize(analysis.recommendedType, 'green')}`);
      log(`📈 Confidence Score: ${colorize((analysis.confidence * 100).toFixed(1) + '%', analysis.confidence > 0.7 ? 'green' : 'yellow')}`);

      if (analysis.keywords) {
        log(`\n🔑 Top Keywords: ${analysis.keywords.slice(0, 5).map(k => colorize(k, 'cyan')).join(', ')}`);
      }

      if (analysis.entities) {
        if (analysis.entities.people.length > 0) {
          log(`👥 People: ${analysis.entities.people.slice(0, 3).join(', ')}`);
        }
        if (analysis.entities.organizations.length > 0) {
          log(`🏢 Organizations: ${analysis.entities.organizations.slice(0, 3).join(', ')}`);
        }
      }

      if (analysis.sentiment) {
        const sentimentColor = analysis.sentiment.label === 'positive' ? 'green' : 
                             analysis.sentiment.label === 'negative' ? 'red' : 'yellow';
        log(`😊 Sentiment: ${colorize(analysis.sentiment.label, sentimentColor)} (${(analysis.sentiment.score * 100).toFixed(1)}%)`);
      }

      // Type scores
      log('\n📋 Schema Type Scores:', 'bright');
      Object.entries(analysis.typeScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([type, score]) => {
          const percentage = (score * 100).toFixed(1);
          const color = score > 0.5 ? 'green' : score > 0.3 ? 'yellow' : 'red';
          log(`  ${type}: ${colorize(percentage + '%', color)}`);
        });

      info('\n💡 Run `ai-seo generate` to create schemas from this analysis');

    } catch (err) {
      error(`Analysis failed: ${err.message}`);
    }
  }

  // Validate existing schema
  async validateCommand(params) {
    const [schemaPath, ...options] = params;
    
    if (!schemaPath) {
      error('Please provide a schema file path. Example: ai-seo validate schema.json');
    }

    if (!existsSync(schemaPath)) {
      error(`Schema file not found: ${schemaPath}`);
    }

    log(`🔍 Validating schema: ${schemaPath}`, 'bright');

    try {
      const schemaContent = readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);

      // Use existing validation from main library
      const mainLib = await import('../index.js');
      const { validateSchemaEnhanced } = mainLib;
      const validation = validateSchemaEnhanced(schema, {
        strict: options.includes('--strict'),
        suggestions: true
      });

      // Display results
      log('\n📊 Validation Results:', 'bright');
      log(`📈 Quality Score: ${colorize(validation.score + '/100', validation.score > 80 ? 'green' : validation.score > 60 ? 'yellow' : 'red')}`);

      if (validation.errors.length > 0) {
        log('\n❌ Errors:', 'red');
        validation.errors.forEach(error => {
          log(`  • ${error}`, 'red');
        });
      }

      if (validation.warnings.length > 0) {
        log('\n⚠️  Warnings:', 'yellow');
        validation.warnings.forEach(warning => {
          log(`  • ${warning}`, 'yellow');
        });
      }

      if (validation.suggestions.length > 0) {
        log('\n💡 Suggestions:', 'cyan');
        validation.suggestions.forEach(suggestion => {
          log(`  • ${suggestion}`, 'cyan');
        });
      }

      if (validation.errors.length === 0) {
        success('Schema validation passed!');
      } else {
        warning('Schema has validation issues. See errors above.');
      }

    } catch (err) {
      error(`Validation failed: ${err.message}`);
    }
  }

  // Optimize existing schema with AI
  async optimizeCommand(params) {
    const [schemaPath, ...options] = params;
    
    if (!schemaPath) {
      error('Please provide a schema file path. Example: ai-seo optimize schema.json');
    }

    if (!existsSync(schemaPath)) {
      error(`Schema file not found: ${schemaPath}`);
    }

    log(`🧠 Optimizing schema with AI: ${schemaPath}`, 'bright');

    try {
      const schemaContent = readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);

      // AI optimize
      const optimized = AI.optimizeForLLM(schema, {
        target: ['chatgpt', 'bard', 'claude'],
        semanticEnhancement: true,
        voiceOptimization: options.includes('--voice')
      });

      // Save optimized version
      const outputPath = schemaPath.replace('.json', '.optimized.json');
      writeFileSync(outputPath, JSON.stringify(optimized, null, 2));

      success(`Optimized schema saved to: ${outputPath}`);
      
      // Show improvements
      const originalSize = JSON.stringify(schema).length;
      const optimizedSize = JSON.stringify(optimized).length;
      const sizeDiff = optimizedSize - originalSize;
      
      log('\n📊 Optimization Results:', 'bright');
      log(`📦 Size change: ${sizeDiff > 0 ? '+' : ''}${sizeDiff} bytes`);
      log(`🧠 AI enhancements: ${colorize('Added', 'green')}`);
      log(`🎯 LLM optimization: ${colorize('Applied', 'green')}`);
      
      if (options.includes('--voice')) {
        log(`🎙️  Voice search: ${colorize('Optimized', 'green')}`);
      }

      info('💡 Use the optimized schema for better AI search engine compatibility');

    } catch (err) {
      error(`Optimization failed: ${err.message}`);
    }
  }

  // Generate schema from content
  async generateCommand(params) {
    const [input, ...options] = params;
    
    if (!input) {
      error('Please provide content to generate schema from. Example: ai-seo generate "Product description here"');
    }

    log('🤖 Generating schema with AI...', 'bright');

    try {
      let content = input;
      
      // If input is a file path, read it
      if (existsSync(input)) {
        content = readFileSync(input, 'utf8');
        info(`Reading content from: ${input}`);
      }

      // Generate with AI
      const results = AI.generateFromContent(content, {
        confidence: 0.6,
        multipleTypes: options.includes('--multiple'),
        includeMetrics: options.includes('--metrics')
      });

      if (!results || (Array.isArray(results) && results.length === 0)) {
        error('Could not generate schema from content. Try providing more descriptive content.');
      }

      const schemas = Array.isArray(results) ? results : [results];

      log('\n🎯 Generated Schemas:', 'bright');
      
      schemas.forEach((result, index) => {
        log(`\n📋 Schema ${index + 1}: ${colorize(result.type, 'cyan')}`);
        log(`📈 Confidence: ${colorize((result.confidence * 100).toFixed(1) + '%', result.confidence > 0.7 ? 'green' : 'yellow')}`);
        
        // Save schema
        const filename = `schema-${result.type.toLowerCase()}-${Date.now()}.json`;
        writeFileSync(filename, JSON.stringify(result.schema, null, 2));
        success(`Saved to: ${filename}`);
        
        if (result.metrics && options.includes('--metrics')) {
          log(`📊 Readability: ${result.metrics.readabilityScore.toFixed(1)}`);
          log(`🔑 Keyword Density: ${(result.metrics.keywordDensity * 100).toFixed(1)}%`);
        }
      });

      info('\n💡 Review and customize the generated schemas before using in production');

    } catch (err) {
      error(`Generation failed: ${err.message}`);
    }
  }

  // Build optimized schemas for production
  buildCommand(params) {
    log('🏗️  Building optimized schemas for production...', 'bright');
    
    // This would implement a build system for schemas
    // For now, show what it would do
    info('📦 Collecting schemas...');
    info('🧠 Applying AI optimizations...');
    info('🗜️  Compressing and minifying...');
    info('📊 Generating performance report...');
    
    success('Build completed! (Feature coming in full implementation)');
    warning('This is a preview - full build system coming soon');
  }

  // Interactive mode for guided schema creation - V1.8.0 NEW
  async interactiveCommand(params) {
    log(colorize('\n🎯 AI-SEO Interactive Mode - Guided Schema Creation\n', 'bright'));
    
    try {
      // Import readline for interactive prompts
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const prompt = (question) => new Promise((resolve) => {
        rl.question(colorize(question, 'cyan'), resolve);
      });

      // Step 1: Schema type selection
      log('📋 Step 1: Choose your schema type');
      log('1. Product');
      log('2. Article/Blog Post');
      log('3. Local Business');
      log('4. Event');
      log('5. Organization');
      log('6. Custom/Other');
      
      const typeChoice = await prompt('\nSelect schema type (1-6): ');
      const schemaTypes = ['', 'Product', 'Article', 'LocalBusiness', 'Event', 'Organization', 'Thing'];
      const selectedType = schemaTypes[parseInt(typeChoice)] || 'Thing';
      
      log(`\n✅ Selected: ${selectedType}`);

      // Step 2: Basic information
      log(colorize('\n📝 Step 2: Basic Information', 'bright'));
      const name = await prompt('Name/Title: ');
      const description = await prompt('Description: ');

      // Step 3: Platform deployment
      log(colorize('\n🌐 Step 3: Platform Deployment', 'bright'));
      log('Which platforms do you want to deploy to?');
      log('1. WordPress');
      log('2. Shopify');
      log('3. Webflow');
      log('4. Google Tag Manager');
      log('5. Custom/Manual');
      
      const platformChoice = await prompt('Select platforms (comma-separated, e.g., 1,2,4): ');
      const platformMap = { '1': 'wordpress', '2': 'shopify', '3': 'webflow', '4': 'gtm', '5': 'custom' };
      const selectedPlatforms = platformChoice.split(',')
        .map(p => platformMap[p.trim()])
        .filter(Boolean);

      // Step 4: AI optimization
      log(colorize('\n🧠 Step 4: AI Optimization', 'bright'));
      const aiOptimization = await prompt('Enable AI optimization for LLMs? (y/n): ');
      const voiceOptimization = await prompt('Enable voice search optimization? (y/n): ');

      rl.close();

      // Create schema
      log(colorize('\n🔧 Creating your schema...', 'bright'));
      
      const baseSchema = {
        '@context': 'https://schema.org',
        '@type': selectedType,
        name: name,
        description: description
      };

      // Apply AI optimization if requested
      let finalSchema = baseSchema;
      if (aiOptimization.toLowerCase() === 'y') {
        const { AI } = await import('../index.js');
        finalSchema = AI.optimizeForLLM(baseSchema, {
          target: ['chatgpt', 'bard', 'claude'],
          semanticEnhancement: true,
          voiceOptimization: voiceOptimization.toLowerCase() === 'y'
        });
        success('AI optimization applied');
      }

      // Generate platform deployments
      if (selectedPlatforms.length > 0) {
        log(colorize('\n🚀 Generating platform deployments...', 'bright'));
        const { MultiPlatform } = await import('../index.js');
        const deployments = MultiPlatform.deploy(finalSchema, selectedPlatforms);
        
        selectedPlatforms.forEach(platform => {
          if (deployments.deployments[platform]) {
            log(colorize(`\n📦 ${platform.toUpperCase()} Integration:`, 'green'));
            log('Code generated successfully!');
            log('Instructions:');
            deployments.deployments[platform].instructions.forEach(instruction => {
              log(`  • ${instruction}`);
            });
          }
        });
      }

      // Display final schema
      log(colorize('\n📋 Final Schema:', 'bright'));
      log(JSON.stringify(finalSchema, null, 2));

      success('\n🎉 Interactive schema creation complete!');
      log('Your schema is ready to deploy to your selected platforms.');

    } catch (err) {
      error(`Interactive mode failed: ${err.message}`);
    }
  }

  // Deploy schema to multiple platforms - V1.8.0 NEW
  async deployCommand(params) {
    const [schemaPath, platformsStr, ...options] = params;
    
    if (!schemaPath || !platformsStr) {
      error('Usage: ai-seo deploy <schema-file> <platforms> [options]');
      log('Example: ai-seo deploy product.json wordpress,shopify,webflow');
      log('Available platforms: wordpress, shopify, webflow, gtm');
      return;
    }

    log(colorize('🚀 Multi-Platform Schema Deployment', 'bright'));
    
    try {
      // Read schema file
      if (!existsSync(schemaPath)) {
        error(`Schema file not found: ${schemaPath}`);
        return;
      }

      const schemaContent = readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Parse platforms
      const platforms = platformsStr.split(',').map(p => p.trim().toLowerCase());
      const validPlatforms = ['wordpress', 'shopify', 'webflow', 'gtm'];
      const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
      
      if (invalidPlatforms.length > 0) {
        error(`Invalid platforms: ${invalidPlatforms.join(', ')}`);
        log(`Valid platforms: ${validPlatforms.join(', ')}`);
        return;
      }

      log(`📋 Schema: ${schema['@type']} - "${schema.name || 'Untitled'}"`);
      log(`🌐 Platforms: ${platforms.join(', ')}`);

      // Import MultiPlatform module
      const { MultiPlatform } = await import('../index.js');
      
      // Generate deployments
      const deployments = MultiPlatform.deploy(schema, platforms, {
        wordpress: { pluginName: `AI SEO ${schema['@type']}` },
        shopify: { templateType: 'product' },
        webflow: { placement: 'head' },
        gtm: { eventName: 'ai_seo_schema_ready' }
      });

      // Output results
      log(colorize('\n📦 Generated Deployments:', 'bright'));
      
      Object.entries(deployments.deployments).forEach(([platform, deployment]) => {
        log(colorize(`\n🔧 ${platform.toUpperCase()}:`, 'green'));
        
        // Write deployment file
        const filename = deployment.filename || `${platform}-deployment.${platform === 'wordpress' ? 'php' : 'txt'}`;
        writeFileSync(filename, deployment.code);
        success(`File saved: ${filename}`);
        
        // Show instructions
        log('Instructions:');
        deployment.instructions.forEach(instruction => {
          log(`  • ${instruction}`);
        });
      });

      log(colorize(`\n📊 Summary:`, 'bright'));
      log(`• Platforms: ${deployments.summary.platforms}`);
      log(`• Generated: ${deployments.summary.generated}`);
      log(`• Timestamp: ${deployments.summary.timestamp}`);
      
      success('\n🎉 Multi-platform deployment complete!');

    } catch (err) {
      error(`Deployment failed: ${err.message}`);
    }
  }

  // Bulk schema management - V1.8.0 NEW
  async bulkCommand(params) {
    const [action, ...options] = params;
    
    if (!action) {
      error('Usage: ai-seo bulk <action> [options]');
      log('Actions:');
      log('  validate <directory>     - Validate all schemas in directory');
      log('  optimize <directory>     - Optimize all schemas with AI');
      log('  deploy <directory> <platforms> - Deploy all schemas');
      log('  analyze <directory>      - Analyze schema quality');
      return;
    }

    log(colorize('📦 Bulk Schema Management', 'bright'));

    try {
      const { readdirSync, statSync } = await import('fs');
      const { join } = await import('path');

      switch (action) {
        case 'validate': {
          const [directory = '.'] = options;
          log(`🔍 Validating schemas in: ${directory}`);
          
          const files = readdirSync(directory)
            .filter(file => file.endsWith('.json'))
            .map(file => join(directory, file));

          let validCount = 0;
          let errorCount = 0;

          for (const file of files) {
            try {
              const content = readFileSync(file, 'utf8');
              const schema = JSON.parse(content);
              
              if (schema['@context'] && schema['@type']) {
                log(`✅ ${file}: Valid`);
                validCount++;
              } else {
                log(`❌ ${file}: Missing @context or @type`);
                errorCount++;
              }
            } catch (err) {
              log(`❌ ${file}: ${err.message}`);
              errorCount++;
            }
          }

          log(colorize(`\n📊 Results: ${validCount} valid, ${errorCount} errors`, 'bright'));
          break;
        }

        case 'optimize': {
          const [directory = '.'] = options;
          log(`🧠 Optimizing schemas in: ${directory}`);
          
          const { AI } = await import('../index.js');
          const files = readdirSync(directory)
            .filter(file => file.endsWith('.json'))
            .map(file => join(directory, file));

          let optimizedCount = 0;

          for (const file of files) {
            try {
              const content = readFileSync(file, 'utf8');
              const schema = JSON.parse(content);
              
              const optimized = AI.optimizeForLLM(schema, {
                target: ['chatgpt', 'bard', 'claude'],
                semanticEnhancement: true
              });
              
              const outputFile = file.replace('.json', '-optimized.json');
              writeFileSync(outputFile, JSON.stringify(optimized, null, 2));
              
              log(`✅ ${file} → ${outputFile}`);
              optimizedCount++;
            } catch (err) {
              log(`❌ ${file}: ${err.message}`);
            }
          }

          success(`🎉 Optimized ${optimizedCount} schemas`);
          break;
        }

        case 'analyze': {
          const [directory = '.'] = options;
          log(`📊 Analyzing schemas in: ${directory}`);
          
          const files = readdirSync(directory)
            .filter(file => file.endsWith('.json'));

          const stats = {
            total: files.length,
            types: {},
            avgSize: 0,
            totalSize: 0
          };

          files.forEach(file => {
            try {
              const filePath = join(directory, file);
              const content = readFileSync(filePath, 'utf8');
              const schema = JSON.parse(content);
              const size = statSync(filePath).size;
              
              stats.types[schema['@type']] = (stats.types[schema['@type']] || 0) + 1;
              stats.totalSize += size;
            } catch (err) {
              // Skip invalid files
            }
          });

          stats.avgSize = Math.round(stats.totalSize / stats.total);

          log(colorize('\n📈 Analysis Results:', 'bright'));
          log(`• Total schemas: ${stats.total}`);
          log(`• Average size: ${stats.avgSize} bytes`);
          log(`• Total size: ${stats.totalSize} bytes`);
          log('\nSchema types:');
          Object.entries(stats.types).forEach(([type, count]) => {
            log(`  • ${type}: ${count}`);
          });
          break;
        }

        default:
          error(`Unknown bulk action: ${action}`);
      }

    } catch (err) {
      error(`Bulk operation failed: ${err.message}`);
    }
  }

  // Show help
  helpCommand() {
    log(colorize(`\n🧠 ${CLI_NAME} v${CLI_VERSION} - AI-Native SEO Developer Tools\n`, 'bright'));
    
    const commands = [
      ['init [framework]', 'Initialize AI-SEO in your project', 'ai-seo init nextjs'],
      ['analyze <content|url>', 'Analyze content with AI for schema suggestions', 'ai-seo analyze "Amazing product description"'],
      ['validate <schema.json>', 'Validate existing schema file', 'ai-seo validate product.json --strict'],
      ['optimize <schema.json>', 'Optimize schema with AI for LLMs', 'ai-seo optimize product.json --voice'],
      ['generate <content|file>', 'Generate schema from content using AI', 'ai-seo generate content.txt --multiple'],
      ['interactive', '🎯 NEW: Guided schema creation with prompts', 'ai-seo interactive'],
      ['deploy <schema> <platforms>', '🚀 NEW: Deploy to WordPress, Shopify, Webflow, GTM', 'ai-seo deploy product.json wordpress,shopify'],
      ['bulk <action> [options]', '📦 NEW: Bulk schema management operations', 'ai-seo bulk validate ./schemas/'],
      ['build', 'Build optimized schemas for production', 'ai-seo build'],
      ['version', 'Show version information', 'ai-seo version'],
      ['help', 'Show this help message', 'ai-seo help']
    ];

    log(colorize('Commands:', 'bright'));
    commands.forEach(([cmd, desc, example]) => {
      log(`  ${colorize(cmd.padEnd(25), 'cyan')} ${desc}`);
      log(`  ${' '.repeat(27)} ${colorize('Example: ' + example, 'yellow')}\n`);
    });

    log(colorize('Global Options:', 'bright'));
    log(`  ${colorize('--help, -h'.padEnd(25), 'cyan')} Show help for any command`);
    log(`  ${colorize('--version, -v'.padEnd(25), 'cyan')} Show version information`);
    log(`  ${colorize('--verbose'.padEnd(25), 'cyan')} Enable verbose output`);

    log(colorize('\n🌟 V1.8.0 Features:', 'bright'));
    log('  🧠 AI-powered schema optimization for ChatGPT, Bard, Claude');
    log('  🔍 Intelligent content analysis and schema generation');
    log('  🎙️  Voice search optimization');
    log('  🌐 Multi-platform deployment (WordPress, Shopify, Webflow, GTM)');
    log('  🎯 Interactive guided schema creation');
    log('  📦 Bulk schema management operations');
    log('  ⚡ Performance monitoring and caching');
    log('  🎭 Framework integrations (React, Vue, Svelte)');

    log(colorize('\n📚 Learn more:', 'bright'));
    log('  📖 Documentation: https://github.com/Veeeetzzzz/ai-seo-npm-package');
    log('  🐛 Report issues: https://github.com/Veeeetzzzz/ai-seo-npm-package/issues');
    log('  💬 Community: https://discord.gg/ai-seo (coming soon)');
  }

  // Show version
  versionCommand() {
    log(colorize(`${CLI_NAME} v${CLI_VERSION}`, 'bright'));
    log('🧠 AI-Native SEO Developer Tools');
    log('🚀 Built with modern web standards');
    log('⚡ Zero runtime dependencies');
  }
}

// Run CLI
const cli = new CLI();
cli.run(process.argv).catch(err => {
  error(`Unexpected error: ${err.message}`);
});

export default CLI;
