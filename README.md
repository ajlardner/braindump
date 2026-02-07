# Braindump

Turn messy brain dumps into structured actions.

## The Problem

You have thoughts. They come out messy. You lose the actionable stuff in the chaos.

## The Solution

Dump your thoughts. Get back:
- ✅ Action items
- 📅 Dates/deadlines  
- 👤 People mentioned
- ❓ Questions to answer
- 💡 Ideas to explore
- 🚧 Blockers

## Install

```bash
npm install -g braindump
```

## Usage

### Quick processing
```bash
braindump quick "need to email john by friday about the project. should we use postgres or mysql? also talk to sarah about the design"
```

Output:
```
Found: 2 action(s), 2 people, 1 date(s)

Actions:
  - [ ] email john by friday about the project
  - [ ] talk to sarah about the design
People: john, sarah
Dates: by friday
```

### Process a file
```bash
braindump process -f my-notes.txt -o structured.md
```

### Pipe from stdin
```bash
cat notes.txt | braindump process
```

### JSON output
```bash
braindump process -f notes.txt --json
```

### LLM Enhancement (experimental)

Add `--llm` for smarter extraction using AI. Catches implicit actions and adds priority.

```bash
# Using OpenAI (default)
export OPENAI_API_KEY=sk-...
braindump quick "john never got back to me about that report" --llm

# Using Anthropic
export ANTHROPIC_API_KEY=sk-ant-...
braindump quick "john never got back to me" --llm --provider anthropic
```

LLM enhancement finds implicit actions like "follow up with John" from context.

Supported providers:
- `openai` (default) - gpt-4o-mini
- `anthropic` - claude-3-haiku

## API

```javascript
import { processDump, formatAsMarkdown } from 'braindump';

const dump = `
  need to finish the report by tomorrow
  talk to mike about the budget
  what if we used a different approach?
  blocked on waiting for API access
`;

const result = await processDump(dump);
console.log(result.actions);  // ['finish the report by tomorrow', 'talk to mike about the budget']

// With LLM enhancement
const enhanced = await processDump(dump, { llm: true });
console.log(enhanced.stats.llm_enhanced);  // true
console.log(result.people);   // ['mike']
console.log(result.dates);    // ['tomorrow']
console.log(result.blockers); // ['waiting for API access']

// Or get markdown
console.log(formatAsMarkdown(result));
```

## Patterns Detected

| Type | Examples |
|------|----------|
| Actions | "need to X", "have to X", "should X", "todo: X" |
| People | "@name", "talk to John", "email Sarah" |
| Dates | "tomorrow", "by Friday", "next week", "on Monday" |
| Questions | "should we X?", "what if X?" |
| Ideas | "what if X", "maybe X", "idea: X" |
| Blockers | "blocked on X", "waiting for X", "can't X until Y" |

## Roadmap

- [x] LLM enhancement for context-aware extraction
- [ ] Voice input (transcription → processing)
- [ ] Calendar integration
- [ ] Todo app integrations (Todoist, Things, etc.)
- [ ] Learn personal patterns over time
- [ ] Local LLM support (Ollama)

## License

MIT
