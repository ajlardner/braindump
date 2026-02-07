import { test, describe } from 'node:test';
import assert from 'node:assert';
import { processDump, formatAsMarkdown, summarize } from '../src/processor.js';

describe('processDump', () => {
  test('extracts action items with "need to"', () => {
    const result = processDump('I need to finish the report by tomorrow');
    assert.ok(result.actions.length > 0);
    assert.ok(result.actions[0].includes('finish'));
  });

  test('extracts action items with "have to"', () => {
    const result = processDump('have to call the doctor');
    assert.ok(result.actions.length > 0);
  });

  test('extracts dates like tomorrow', () => {
    const result = processDump('meeting tomorrow at 3pm');
    assert.ok(result.dates.includes('tomorrow'));
  });

  test('extracts dates with "by friday"', () => {
    const result = processDump('finish this by friday');
    assert.ok(result.dates.some(d => d.toLowerCase().includes('friday')));
  });

  test('extracts people with @mentions', () => {
    const result = processDump('ask @john about the project');
    assert.ok(result.people.includes('john'));
  });

  test('extracts people with "talk to X"', () => {
    const result = processDump('talk to Sarah about the design');
    assert.ok(result.people.some(p => p.toLowerCase().includes('sarah')));
  });

  test('extracts questions ending in ?', () => {
    const result = processDump('should we use postgres or mysql?');
    assert.ok(result.questions.length > 0);
  });

  test('extracts X or Y decisions', () => {
    const result = processDump('use postgres or mysql');
    assert.ok(result.decisions.length > 0);
  });

  test('extracts blockers', () => {
    const result = processDump('blocked on waiting for API access');
    assert.ok(result.blockers.length > 0);
  });

  test('extracts ideas with "what if"', () => {
    const result = processDump('what if we used a different approach');
    assert.ok(result.ideas.length > 0);
  });

  test('handles empty input', () => {
    const result = processDump('');
    assert.equal(result.actions.length, 0);
    assert.equal(result.stats.word_count, 1); // empty string splits to ['']
  });

  test('complex input extracts multiple items', () => {
    const input = `
      need to email john by friday about the project.
      should we use postgres or mysql?
      also talk to sarah about the design.
      blocked on waiting for budget approval.
    `;
    const result = processDump(input);
    
    assert.ok(result.actions.length >= 2, 'should have at least 2 actions');
    assert.ok(result.decisions.length >= 1, 'should have at least 1 decision');
    assert.ok(result.dates.length >= 1, 'should have at least 1 date');
    assert.ok(result.blockers.length >= 1, 'should have at least 1 blocker');
  });
});

describe('formatAsMarkdown', () => {
  test('includes action items section', () => {
    const result = processDump('need to do something');
    const md = formatAsMarkdown(result);
    assert.ok(md.includes('## Action Items'));
    assert.ok(md.includes('- [ ]'));
  });

  test('includes original text', () => {
    const input = 'my original text';
    const result = processDump(input);
    const md = formatAsMarkdown(result);
    assert.ok(md.includes('## Original'));
    assert.ok(md.includes(input));
  });
});

describe('summarize', () => {
  test('returns count of items found', () => {
    const result = processDump('need to do X and Y. talk to John. by friday.');
    const summary = summarize(result);
    assert.ok(summary.includes('action'));
    assert.ok(summary.includes('date'));
  });

  test('returns message when nothing found', () => {
    const result = processDump('the quick brown fox jumps');
    const summary = summarize(result);
    assert.ok(summary.includes('No structured items found'));
  });
});
