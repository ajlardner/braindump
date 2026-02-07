/**
 * LLM Enhancer
 * Optional AI-powered enhancement of brain dump extraction
 */

const SYSTEM_PROMPT = `You are extracting structured information from a brain dump. The user dumps thoughts in whatever order they come out. Your job is to find:

1. ACTION ITEMS - things that need to be done (explicit or implicit)
2. PEOPLE - anyone mentioned or implied
3. DEADLINES - dates, timeframes, urgency indicators
4. QUESTIONS - decisions that need to be made
5. BLOCKERS - things preventing progress
6. IDEAS - possibilities to explore later

For each action item, be aggressive about finding implicit ones:
- "John owes me X" → implies "follow up with John about X"
- "Haven't heard back from X" → implies "follow up with X"
- "X is broken" → implies "fix X"

Output as JSON with this structure:
{
  "actions": [{"text": "...", "priority": "high|medium|low", "confidence": 0.0-1.0}],
  "people": [{"name": "...", "context": "..."}],
  "dates": [{"text": "...", "urgency": "high|medium|low"}],
  "questions": ["..."],
  "ideas": ["..."],
  "blockers": ["..."]
}

Be concise. Clean up text but stay faithful to the original meaning.`;

/**
 * Call OpenAI-compatible API
 */
async function callOpenAI(text, options = {}) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  const model = options.model || 'gpt-4o-mini';
  const baseUrl = options.baseUrl || 'https://api.openai.com/v1';

  if (!apiKey) {
    throw new Error('OpenAI API key required. Set OPENAI_API_KEY or pass apiKey option.');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

/**
 * Call Anthropic API
 */
async function callAnthropic(text, options = {}) {
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
  const model = options.model || 'claude-3-haiku-20240307';

  if (!apiKey) {
    throw new Error('Anthropic API key required. Set ANTHROPIC_API_KEY or pass apiKey option.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: text },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  // Extract JSON from response (Anthropic doesn't have json_object mode)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Anthropic response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Enhance extraction with LLM
 * @param {string} text - Raw brain dump text
 * @param {object} options - Configuration options
 * @param {string} options.provider - 'openai' or 'anthropic' (default: 'openai')
 * @param {string} options.model - Model to use (provider-specific defaults)
 * @param {string} options.apiKey - API key (defaults to env var)
 */
export async function enhance(text, options = {}) {
  const provider = options.provider || 'openai';
  
  try {
    if (provider === 'anthropic') {
      return await callAnthropic(text, options);
    } else {
      return await callOpenAI(text, options);
    }
  } catch (error) {
    // Re-throw with context
    throw new Error(`LLM enhancement failed (${provider}): ${error.message}`);
  }
}

/**
 * Merge regex results with LLM results
 * LLM results are tagged with source: 'llm' and include confidence
 */
export function mergeResults(regexResult, llmResult) {
  const merged = { ...regexResult };
  
  // Helper to check if an item already exists (fuzzy match)
  const isDuplicate = (existing, newItem) => {
    const existingLower = existing.map(e => 
      (typeof e === 'string' ? e : e.text).toLowerCase()
    );
    const newLower = (typeof newItem === 'string' ? newItem : newItem.text).toLowerCase();
    
    return existingLower.some(e => 
      e.includes(newLower) || newLower.includes(e) || 
      levenshteinSimilarity(e, newLower) > 0.7
    );
  };
  
  // Merge actions
  if (llmResult.actions) {
    for (const action of llmResult.actions) {
      if (!isDuplicate(merged.actions, action)) {
        merged.actions.push({
          text: action.text,
          priority: action.priority || 'medium',
          confidence: action.confidence || 0.8,
          source: 'llm',
        });
      }
    }
  }
  
  // Merge people
  if (llmResult.people) {
    for (const person of llmResult.people) {
      const name = typeof person === 'string' ? person : person.name;
      if (!merged.people.some(p => p.toLowerCase() === name.toLowerCase())) {
        merged.people.push(name);
      }
    }
  }
  
  // Merge dates
  if (llmResult.dates) {
    for (const date of llmResult.dates) {
      const dateText = typeof date === 'string' ? date : date.text;
      if (!isDuplicate(merged.dates, dateText)) {
        merged.dates.push(dateText);
      }
    }
  }
  
  // Merge questions
  if (llmResult.questions) {
    for (const q of llmResult.questions) {
      if (!isDuplicate(merged.questions, q)) {
        merged.questions.push(q);
      }
    }
  }
  
  // Merge ideas
  if (llmResult.ideas) {
    for (const idea of llmResult.ideas) {
      if (!isDuplicate(merged.ideas, idea)) {
        merged.ideas.push(idea);
      }
    }
  }
  
  // Merge blockers
  if (llmResult.blockers) {
    for (const blocker of llmResult.blockers) {
      if (!isDuplicate(merged.blockers, blocker)) {
        merged.blockers.push(blocker);
      }
    }
  }
  
  // Update stats
  merged.stats.llm_enhanced = true;
  merged.stats.action_count = merged.actions.length;
  merged.stats.people_mentioned = merged.people.length;
  
  return merged;
}

/**
 * Simple Levenshtein similarity (0-1)
 */
function levenshteinSimilarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i-1] === a[j-1]) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return 1 - (distance / maxLen);
}

export default { enhance, mergeResults };
