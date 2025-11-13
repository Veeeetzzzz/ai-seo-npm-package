// CLI Command: generate-url-batch
// Generate schemas from multiple URLs - v1.12.0

import chalk from 'chalk';
import { URLSchemaGenerator } from '../../src/url-generator.js';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function generateUrlBatchCommand(inputFile, options = {}) {
  console.log(chalk.blue('🌐 Batch URL Schema Generator - v1.12.0\n'));
  
  try {
    // Read URLs from file
    if (!existsSync(inputFile)) {
      console.log(chalk.red(`❌ File not found: ${inputFile}`));
      return;
    }

    const fileContent = await readFile(inputFile, 'utf-8');
    const urls = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // Filter empty and comments

    if (urls.length === 0) {
      console.log(chalk.yellow('⚠️  No URLs found in file'));
      return;
    }

    console.log(chalk.gray(`Found ${urls.length} URLs to process`));
    console.log(chalk.gray(`Concurrency: ${options.concurrency || 3}\n`));

    // Progress tracking
    let completed = 0;
    let successful = 0;
    let failed = 0;

    const progressCallback = (url, current, total) => {
      const percentage = Math.round((current / total) * 100);
      process.stdout.write(`\r${chalk.cyan('Progress:')} ${current}/${total} (${percentage}%) - ${url.substring(0, 50)}...`);
    };

    // Process URLs
    const results = await URLSchemaGenerator.generateFromURLs(urls, {
      ...options,
      concurrency: options.concurrency || 3,
      progressCallback
    });

    console.log('\n'); // New line after progress

    // Count results
    results.forEach(result => {
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    });

    // Display summary
    console.log(chalk.green(`\n✅ Batch processing complete!\n`));
    console.log(chalk.bold('Summary:'));
    console.log(chalk.green(`  ✓ Successful: ${successful}`));
    if (failed > 0) {
      console.log(chalk.red(`  ✗ Failed: ${failed}`));
    }
    console.log(chalk.gray(`  Total: ${results.length}`));

    // Save results
    if (options.outputDir) {
      const outputDir = options.outputDir;
      const fs = await import('fs');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save each result
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.success) {
          const filename = `${outputDir}/schema-${i + 1}.json`;
          await writeFile(filename, JSON.stringify(result, null, 2));
        }
      }

      console.log(chalk.green(`\n📁 Saved to: ${outputDir}/`));
    } else if (options.output) {
      // Save all results to single file
      await writeFile(options.output, JSON.stringify(results, null, 2));
      console.log(chalk.green(`\n📄 Saved to: ${options.output}`));
    }

    // Show failed URLs
    if (failed > 0 && !options.quiet) {
      console.log(chalk.red('\n❌ Failed URLs:'));
      results.forEach((result, i) => {
        if (!result.success) {
          console.log(chalk.dim(`  ${i + 1}. ${result.url}`));
          console.log(chalk.dim(`     Error: ${result.error}`));
        }
      });
    }

  } catch (error) {
    console.log(chalk.red('\n❌ Error:'), error.message);
    if (options.debug) {
      console.log(chalk.dim(error.stack));
    }
  }
}

