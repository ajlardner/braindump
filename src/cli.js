#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { processDump, formatAsMarkdown, summarize } from './processor.js';

program
  .name('braindump')
  .description('Turn messy brain dumps into structured actions')
  .version('0.1.0');

program
  .command('process')
  .description('Process a brain dump from stdin or file')
  .option('-f, --file <path>', 'Read from file instead of stdin')
  .option('-o, --output <path>', 'Write output to file')
  .option('--json', 'Output as JSON instead of markdown')
  .action(async (options) => {
    let text;
    
    if (options.file) {
      if (!existsSync(options.file)) {
        console.error(`File not found: ${options.file}`);
        process.exit(1);
      }
      text = readFileSync(options.file, 'utf-8');
    } else {
      // Read from stdin
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      text = Buffer.concat(chunks).toString('utf-8');
    }
    
    if (!text.trim()) {
      console.error('No input provided');
      process.exit(1);
    }
    
    const result = processDump(text);
    const output = options.json 
      ? JSON.stringify(result, null, 2)
      : formatAsMarkdown(result);
    
    if (options.output) {
      writeFileSync(options.output, output);
      console.log(`Written to ${options.output}`);
      console.log(summarize(result));
    } else {
      console.log(output);
    }
  });

program
  .command('quick <text...>')
  .description('Quickly process text from command line')
  .action((textParts) => {
    const text = textParts.join(' ');
    const result = processDump(text);
    
    console.log('\\n' + summarize(result) + '\\n');
    
    if (result.actions.length) {
      console.log('Actions:');
      result.actions.forEach(a => console.log(`  - [ ] ${a}`));
    }
    
    if (result.people.length) {
      console.log('People:', result.people.join(', '));
    }
    
    if (result.dates.length) {
      console.log('Dates:', result.dates.join(', '));
    }
    
    if (result.decisions.length) {
      console.log('Decisions needed:', result.decisions.join(', '));
    }
    
    if (result.questions.length) {
      console.log('Questions:', result.questions.join(', '));
    }
  });

program.parse();
