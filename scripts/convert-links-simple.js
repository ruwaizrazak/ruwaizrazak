#!/usr/bin/env node

import fs from 'fs';
import { glob } from 'glob';

/**
 * Simple and reliable markdown link converter
 * Usage:
 * node scripts/convert-links-simple.js - Convert all files
  node scripts/convert-links-simple.js --dry-run - Preview changes
  node scripts/convert-links-simple.js src/content/notes/example.mdx - Convert specific file
 * 
 */
function convertMarkdownLinks(content) {
  // Convert markdown links [text](url) to <Link href="url">text</Link>
  let converted = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    // Skip if URL starts with # (anchor links) or if it's already a Link component
    if (url.startsWith('#') || match.includes('<Link')) {
      return match;
    }
    
    return `<Link href="${url}">${text}</Link>`;
  });

  // Check if we need to add the import statement
  const hasNewLinks = converted !== content;
  const hasImport = converted.includes("import Link from '../../components/mdxComponents/Link.astro'");
  
  if (hasNewLinks && !hasImport) {
    // Find the end of frontmatter and add import
    const frontmatterEnd = converted.indexOf('---', 3);
    if (frontmatterEnd !== -1) {
      const insertPos = frontmatterEnd + 3;
      converted = converted.slice(0, insertPos) + "\n\nimport Link from '../../components/mdxComponents/Link.astro';\n" + converted.slice(insertPos);
    }
  }

  return converted;
}

/**
 * Process a single file
 */
function processFile(filePath, dryRun = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const convertedContent = convertMarkdownLinks(content);
    
    if (content !== convertedContent) {
      if (dryRun) {
        console.log(`📝 Would convert: ${filePath}`);
        
        // Count markdown links
        const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
        console.log(`   Found ${links.length} markdown links to convert`);
        
        return true;
      } else {
        fs.writeFileSync(filePath, convertedContent, 'utf8');
        console.log(`✅ Converted: ${filePath}`);
        return true;
      }
    } else {
      console.log(`⏭️  No changes: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const specificFile = args.find(arg => arg.endsWith('.md') || arg.endsWith('.mdx'));
  
  let filesToProcess = [];
  
  if (specificFile) {
    if (fs.existsSync(specificFile)) {
      filesToProcess = [specificFile];
    } else {
      console.error(`❌ File not found: ${specificFile}`);
      process.exit(1);
    }
  } else {
    // Find all markdown files
    const patterns = ['src/content/**/*.md', 'src/content/**/*.mdx'];
    patterns.forEach(pattern => {
      const matches = glob.sync(pattern);
      filesToProcess.push(...matches);
    });
  }
  
  if (filesToProcess.length === 0) {
    console.log('No markdown files found to process.');
    return;
  }
  
  console.log(`Found ${filesToProcess.length} files to process...`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  let convertedCount = 0;
  
  filesToProcess.forEach(filePath => {
    if (processFile(filePath, dryRun)) {
      convertedCount++;
    }
  });
  
  console.log(`\n✨ Conversion complete! ${convertedCount} files processed.`);
  
  if (dryRun) {
    console.log('\nTo actually apply these changes, run the script without --dry-run');
  }
}

main();
