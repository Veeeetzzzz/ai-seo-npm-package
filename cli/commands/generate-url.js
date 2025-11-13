// CLI Command: generate-url
// Generate schema from URL - v1.12.0

import chalk from 'chalk';
import { URLSchemaGenerator } from '../../src/url-generator.js';

export async function generateUrlCommand(url, options = {}) {
  console.log(chalk.blue('🌐 URL Schema Generator - v1.12.0\n'));
  
  try {
    console.log(chalk.gray(`Generating schema from: ${url}\n`));
    
    const result = await URLSchemaGenerator.generateFromURL(url, {
      targetTypes: options.type?.split(','),
      includeRelated: options.related !== false,
      optimizeFor: options.optimize?.split(','),
      validateWithGoogle: options.validate || false
    });

    if (!result.success) {
      console.log(chalk.red('❌ Failed to generate schema\n'));
      console.log(chalk.yellow('Error:'), result.error);
      console.log(chalk.dim('Suggestion:'), result.suggestion);
      return;
    }

    console.log(chalk.green('✅ Schema generated successfully\n'));
    console.log(chalk.bold('Detected Type:'), result.detectedType);
    console.log(chalk.bold('Confidence:'), `${(result.confidence * 100).toFixed(1)}%`);
    console.log(chalk.bold('Schemas Generated:'), result.schemas.length);
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(chalk.yellow('\n💡 Suggestions:'));
      result.suggestions.forEach(s => console.log(chalk.dim(`  • ${s}`)));
    }

    // Output to file if requested
    if (options.output) {
      const fs = await import('fs/promises');
      await fs.writeFile(
        options.output,
        JSON.stringify(result, null, 2)
      );
      console.log(chalk.green(`\n📄 Saved to: ${options.output}`));
    } else {
      // Display schemas
      console.log(chalk.cyan('\n📦 Generated Schema:\n'));
      console.log(JSON.stringify(result.schemas[0], null, 2));
      
      if (result.metadata) {
        console.log(chalk.cyan('\n📋 Metadata:\n'));
        console.log(chalk.dim(`Title: ${result.metadata.title}`));
        console.log(chalk.dim(`Description: ${result.metadata.description?.substring(0, 100)}...`));
        console.log(chalk.dim(`Images: ${result.metadata.images?.length || 0}`));
      }
    }
    
  } catch (error) {
    console.log(chalk.red('❌ Error:'), error.message);
    if (options.debug) {
      console.log(chalk.dim(error.stack));
    }
  }
}

