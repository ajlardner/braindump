/**
 * Brain Dump Processor
 * Extracts structured information from unstructured text
 */

// Patterns for extraction
const patterns = {
  // Action items: "need to", "should", "have to", "must", "todo:", "- [ ]"
  actions: [
    /(?:need to|have to|should|must|gotta|gonna)\s+(.+?)(?:\.|$|,)/gi,
    /(?:todo|task|action):\s*(.+?)(?:\.|$|\n)/gi,
    /[-•]\s*\[\s*\]\s*(.+?)(?:\n|$)/gi,
    /(?:remind me to|don't forget to)\s+(.+?)(?:\.|$)/gi,
  ],
  
  // People: "@name" or "talk to X", "email X", "call X"
  people: [
    /@(\w+)/g,
    /(?:talk to|email|call|text|message|ping|ask)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  ],
  
  // Dates: "tomorrow", "next week", "on Monday", "by Friday"
  dates: [
    /\b(today|tomorrow|tonight)\b/gi,
    /\b(next\s+(?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi,
    /\b(on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi,
    /\b(by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|end of (?:day|week|month)))\b/gi,
    /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/g,
  ],
  
  // Questions/decisions needed
  questions: [
    /(?:should (?:I|we)|do (?:I|we) need to|what if|how (?:do|should) (?:I|we))\s+(.+?\?)/gi,
    /\?\s*$/gm,
  ],
  
  // Ideas (often start with "what if", "maybe", "could")
  ideas: [
    /(?:what if|maybe|could|idea:)\s+(.+?)(?:\.|$|\n)/gi,
    /(?:might be cool to|would be nice to)\s+(.+?)(?:\.|$)/gi,
  ],
  
  // Blockers/problems
  blockers: [
    /(?:blocked on|waiting for|need .+ before|can't .+ until)\s+(.+?)(?:\.|$)/gi,
    /(?:problem:|issue:|blocker:)\s*(.+?)(?:\.|$|\n)/gi,
  ],
};

/**
 * Extract matches from text using a pattern
 */
function extractMatches(text, patternList) {
  const matches = new Set();
  
  for (const pattern of patternList) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const extracted = match[1] || match[0];
      if (extracted && extracted.trim()) {
        matches.add(extracted.trim());
      }
    }
  }
  
  return Array.from(matches);
}

/**
 * Process a brain dump and extract structured data
 */
export function processDump(text) {
  const result = {
    raw: text,
    processed_at: new Date().toISOString(),
    
    // Extracted items
    actions: extractMatches(text, patterns.actions),
    people: extractMatches(text, patterns.people),
    dates: extractMatches(text, patterns.dates),
    questions: extractMatches(text, patterns.questions),
    ideas: extractMatches(text, patterns.ideas),
    blockers: extractMatches(text, patterns.blockers),
    
    // Summary stats
    stats: {},
  };
  
  // Calculate stats
  result.stats = {
    word_count: text.split(/\s+/).length,
    action_count: result.actions.length,
    people_mentioned: result.people.length,
    has_deadlines: result.dates.length > 0,
    has_blockers: result.blockers.length > 0,
  };
  
  return result;
}

/**
 * Format extracted data as markdown
 */
export function formatAsMarkdown(result) {
  const lines = [];
  const date = new Date(result.processed_at).toLocaleDateString();
  
  lines.push(`# Brain Dump - ${date}`);
  lines.push('');
  
  if (result.actions.length > 0) {
    lines.push('## Action Items');
    for (const action of result.actions) {
      lines.push(`- [ ] ${action}`);
    }
    lines.push('');
  }
  
  if (result.dates.length > 0) {
    lines.push('## Dates/Deadlines');
    for (const date of result.dates) {
      lines.push(`- ${date}`);
    }
    lines.push('');
  }
  
  if (result.people.length > 0) {
    lines.push('## People');
    for (const person of result.people) {
      lines.push(`- ${person}`);
    }
    lines.push('');
  }
  
  if (result.questions.length > 0) {
    lines.push('## Questions/Decisions');
    for (const q of result.questions) {
      lines.push(`- ${q}`);
    }
    lines.push('');
  }
  
  if (result.ideas.length > 0) {
    lines.push('## Ideas');
    for (const idea of result.ideas) {
      lines.push(`- ${idea}`);
    }
    lines.push('');
  }
  
  if (result.blockers.length > 0) {
    lines.push('## Blockers');
    for (const blocker of result.blockers) {
      lines.push(`- ⚠️ ${blocker}`);
    }
    lines.push('');
  }
  
  lines.push('## Original');
  lines.push('```');
  lines.push(result.raw);
  lines.push('```');
  
  return lines.join('\n');
}

/**
 * Quick summary for display
 */
export function summarize(result) {
  const parts = [];
  
  if (result.actions.length) {
    parts.push(`${result.actions.length} action(s)`);
  }
  if (result.people.length) {
    parts.push(`${result.people.length} people`);
  }
  if (result.dates.length) {
    parts.push(`${result.dates.length} date(s)`);
  }
  if (result.blockers.length) {
    parts.push(`${result.blockers.length} blocker(s)`);
  }
  
  return parts.length > 0 
    ? `Found: ${parts.join(', ')}`
    : 'No structured items found';
}
