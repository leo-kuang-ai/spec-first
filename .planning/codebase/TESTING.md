# Testing Patterns

**Analysis Date:** 2026-03-23

## Test Framework

**Runner:**
- Framework: Bun test (`bun:test`)
- Version: Bun >=1.0.0 (from package.json engines)
- Config: No config file (uses Bun defaults)

**Assertion Library:**
- Bun's built-in `expect` - Jest-compatible API
- Chainable matchers: `.toBe()`, `.toHaveLength()`, `.toContain()`, `.toBeGreaterThan()`, `.toThrow()`

**Run Commands:**
```bash
bun test                                        # Run free tests (Tier 1: <2s)
bun run test:evals                               # Run paid tests (Tier 2+3), diff-based (~$4/run max)
bun run test:evals:all                           # Run ALL paid tests regardless of diff
bun run test:e2e                                 # Run E2E tests only, diff-based (~$3.85/run max)
bun run test:e2e:all                             # Run ALL E2E tests
bun run test:e2e:fast                            # Run E2E excluding 8 slowest Opus tests (~5-7min)
bun run eval:select                              # Preview which tests would run based on current diff
bun run eval:list                                # List all eval runs from ~/.spec-first-dev/evals/
bun run eval:compare                             # Compare two eval runs (auto-picks most recent)
bun run eval:summary                             # Aggregate stats across all eval runs
```

**Test tiers:**
- **Tier 1 (free, <2s):** Static validation, generator quality checks, browse integration tests
- **Tier 2 (paid, ~$3.85/run):** E2E via `claude -p` subprocess (subprocess, not Agent SDK)
- **Tier 3 (paid, ~$0.15/run):** LLM-as-judge quality evals (Anthropic API direct calls)

**Diff-based test selection:**
- `test:evals` and `test:e2e` auto-select tests based on `git diff` against base branch
- Each test declares its file dependencies ("touchfiles") in `test/helpers/touchfiles.ts`
- Changes to global touchfiles (session-runner, eval-store, llm-judge, gen-skill-docs) trigger all tests
- Override with `EVALS_ALL=1` or use `:all` script variants to force all tests
- Use `eval:select` to preview which tests would run

## Test File Organization

**Location:**
- Pattern: Co-located with source code + separate test directories
- Browse tests: `browse/test/*.test.ts`
- Skill tests: `test/*.test.ts`
- Test helpers: `test/helpers/*.ts`
- Test fixtures: `test/fixtures/*`, `browse/test/fixtures/*`

**Naming:**
- Test files: `*.test.ts` pattern
- Helper files: `kebab-case.ts` (no `.test.` suffix)
- Fixture files: descriptive names (e.g., `qa-eval-ground-truth.json`, `review-eval-vuln.rb`)

**Structure:**
```
spec-first/
├── browse/
│   ├── src/                          # Source code
│   └── test/                         # Integration tests
│       ├── commands.test.ts          # Browse command tests
│       ├── snapshot.test.ts          # Snapshot system tests
│       ├── fixtures/                 # Test HTML files
│       └── test-server.ts            # Test HTTP server
├── test/                             # Skill validation + eval tests
│   ├── helpers/                      # Shared test utilities
│   │   ├── skill-parser.ts           # Static skill validator
│   │   ├── session-runner.ts         # Claude CLI subprocess runner
│   │   ├── llm-judge.ts              # LLM-as-judge helpers
│   │   ├── eval-store.ts             # Test result persistence
│   │   ├── e2e-helpers.ts            # E2E test setup utilities
│   │   └── touchfiles.ts             # Diff-based test selection
│   ├── fixtures/                     # Test data
│   │   ├── eval-baselines.json       # LLM-judge score baselines
│   │   ├── qa-eval-ground-truth.json # QA test expectations
│   │   └── review-eval-vuln.rb       # Planted bugs for review tests
│   ├── skill-validation.test.ts      # Tier 1: static validation (free, <1s)
│   ├── gen-skill-docs.test.ts        # Tier 1: generator quality (free, <1s)
│   ├── skill-llm-eval.test.ts        # Tier 3: LLM-as-judge (~$0.15/run)
│   ├── skill-e2e-plan.test.ts        # Tier 2: plan review E2E
│   ├── skill-e2e-review.test.ts      # Tier 2: code review E2E
│   ├── skill-e2e-qa-workflow.test.ts # Tier 2: QA workflow E2E
│   ├── skill-e2e-browse.test.ts      # Tier 2: browse skill E2E
│   ├── skill-e2e-design.test.ts      # Tier 2: design review E2E
│   ├── skill-e2e-deploy.test.ts      # Tier 2: deploy workflow E2E
│   ├── skill-e2e-workflow.test.ts    # Tier 2: general workflow E2E
│   ├── skill-e2e-qa-bugs.test.ts     # Tier 2: QA bug detection E2E
│   ├── skill-routing-e2e.test.ts     # Tier 2: skill routing E2E
│   ├── codex-e2e.test.ts             # Tier 2: Codex host E2E
│   └── gemini-e2e.test.ts            # Tier 2: Gemini host E2E
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { startTestServer } from './test-server';
import { BrowserManager } from '../src/browser-manager';

let testServer: ReturnType<typeof startTestServer>;
let bm: BrowserManager;
let baseUrl: string;

beforeAll(async () => {
  testServer = startTestServer(0);
  baseUrl = testServer.url;
  bm = new BrowserManager();
  await bm.launch();
});

afterAll(() => {
  try { testServer.server.stop(); } catch {}
  setTimeout(() => process.exit(0), 500);
});

describe('Snapshot', () => {
  test('snapshot returns accessibility tree with refs', async () => {
    await handleWriteCommand('goto', [baseUrl + '/snapshot.html'], bm);
    const result = await handleMetaCommand('snapshot', [], bm, shutdown);
    expect(result).toContain('@e');
    expect(result).toContain('[heading]');
    expect(result).toContain('"Snapshot Test"');
  });

  test('snapshot -i returns only interactive elements', async () => {
    await handleWriteCommand('goto', [baseUrl + '/snapshot.html'], bm);
    const result = await handleMetaCommand('snapshot', ['-i'], bm, shutdown);
    expect(result).toContain('[button]');
    expect(result).toContain('[link]');
    expect(result).not.toContain('[heading]');
  });
});
```

**Patterns:**
- `beforeAll`: Set up shared resources (browser, test server, temp directories)
- `afterAll`: Clean up resources (stop server, delete temp files, close browser)
- `describe`: Group related tests by feature or component
- `test`: Individual test cases with descriptive names

## Mocking

**Framework:** No mocking framework - use real dependencies or fixtures

**What to Mock:**
- Rarely mocked: Browser interactions (use real Playwright), file system (use temp directories), network requests (use real HTTP)
- Not mocked: External APIs (use real API keys), LLM calls (use real Anthropic API)

**What NOT to Mock:**
- Browser automation - use real Chromium via Playwright
- File operations - use temp directories and cleanup in `afterAll`
- CLI subprocess - spawn real `claude -p` processes

**Why no mocking:**
Tests verify real behavior (browser automation, CLI subprocess execution, LLM responses). Mocking would hide integration issues.

## Fixtures and Factories

**Test Data:**
```typescript
// Ground truth for QA tests
test/fixtures/qa-eval-ground-truth.json       // Expected bugs for static QA test
test/fixtures/qa-eval-spa-ground-truth.json   // Expected bugs for SPA test
test/fixtures/qa-eval-checkout-ground-truth.json // Expected bugs for checkout test

// Planted bugs for review tests
test/fixtures/review-eval-vuln.rb             // SQL injection vulnerability
test/fixtures/review-eval-enum.rb             // Enum handling bug
test/fixtures/review-eval-design-slop.*       // Design quality issues

// Baselines for regression detection
test/fixtures/eval-baselines.json             // LLM-judge score baselines
```

**Location:**
- Test fixtures: `test/fixtures/`
- Browse fixtures: `browse/test/fixtures/`
- Format: JSON for structured data, source files for code review tests

**Usage:**
```typescript
const baselinesPath = path.join(ROOT, 'test', 'fixtures', 'eval-baselines.json');
const baselines = JSON.parse(fs.readFileSync(baselinesPath, 'utf-8'));

for (const dim of ['clarity', 'completeness', 'actionability'] as const) {
  if (cmdScores[dim] < baselines.command_reference[dim]) {
    regressions.push(`command_reference.${dim}: ${cmdScores[dim]} < baseline ${baselines.command_reference[dim]}`);
  }
}
```

## Coverage

**Requirements:** No enforced coverage target - tests focus on quality, not percentages

**What IS tested:**
- All browse commands (validation ensures `$B` commands are valid)
- All snapshot flags (validation ensures flags are recognized)
- All generated SKILL.md files (freshness checks, no unresolved placeholders)
- Critical workflows (E2E tests cover QA, review, ship, plan)

**What is NOT tested:**
- Edge cases in some browse command error paths
- Visual rendering (screenshots checked for existence, not content)
- Performance (no benchmarks in test suite)

**View Coverage:**
- No coverage reporting (Bun doesn't have built-in coverage tools)
- Alternative: Test count and quality gates
- Tier 1 tests must pass (CI enforced via GitHub Actions)
- Tier 2/3 tests must pass before ship (manual requirement)

## Test Types

**Unit Tests:**
- Scope: Static validation, parsing, utility functions
- Approach: Direct function calls with various inputs
- Examples: `skill-parser.ts` validation, `matchGlob` glob matching

**Integration Tests:**
- Scope: Browse commands, server communication, file operations
- Approach: Real browser via Playwright, real HTTP server, real file system
- Examples: `browse/test/commands.test.ts`, `browse/test/snapshot.test.ts`

**E2E Tests:**
- Framework: Custom session runner spawning `claude -p` as subprocess
- Scope: Full skill workflows (QA, review, plan, ship, deploy)
- Approach: Spawn Claude CLI as independent process, pipe prompt via stdin, stream NDJSON output
- Examples: `test/skill-e2e-qa-workflow.test.ts`, `test/skill-e2e-review.test.ts`

## Common Patterns

**Async Testing:**
```typescript
test('async operation completes', async () => {
  const result = await handleWriteCommand('goto', [url], bm);
  expect(result).toContain('Navigated');
}, 30_000);  // Custom timeout for slow operations
```

**Error Testing:**
```typescript
test('throws on invalid input', async () => {
  try {
    await handleMetaCommand('snapshot', ['--bogus'], bm, shutdown);
    expect(true).toBe(false); // Should not reach here
  } catch (err: any) {
    expect(err.message).toContain('Unknown snapshot flag');
  }
});
```

**Conditional Tests:**
```typescript
// Skip if file doesn't exist
const qaSkill = path.join(ROOT, 'qa', 'SKILL.md');
if (!fs.existsSync(qaSkill)) return;  // skip if missing
const result = validateSkill(qaSkill);
expect(result.invalid).toHaveLength(0);

// Environment-based skipping
const evalsEnabled = !!process.env.EVALS;
const describeEval = evalsEnabled ? describe : describe.skip;

describeEval('LLM-as-judge quality evals', () => {
  // Tests only run if EVALS=1
});
```

**Diff-based Test Selection:**
```typescript
// test/helpers/touchfiles.ts
export const E2E_TOUCHFILES: Record<string, string[]> = {
  'browse-basic':    ['browse/src/**'],
  'browse-snapshot': ['browse/src/**'],
  'qa-quick':        ['qa/**', 'browse/src/**'],
  'review-sql-injection': ['review/**', 'test/fixtures/review-eval-vuln.rb'],
};

export const GLOBAL_TOUCHFILES = [
  'test/helpers/session-runner.ts',
  'test/helpers/llm-judge.ts',
  'scripts/gen-skill-docs.ts',
];

// In test file
let selectedTests: string[] | null = null;

if (evalsEnabled && !process.env.EVALS_ALL) {
  const baseBranch = detectBaseBranch(ROOT) || 'master';
  const changedFiles = getChangedFiles(baseBranch, ROOT);

  if (changedFiles.length > 0) {
    const selection = selectTests(changedFiles, E2E_TOUCHFILES, GLOBAL_TOUCHFILES);
    selectedTests = selection.selected;
    process.stderr.write(`\nE2E selection (${selection.reason}): ${selection.selected.length} tests\n`);
  }
}

function testIfSelected(testName: string, fn: () => Promise<void>, timeout: number) {
  const shouldRun = selectedTests === null || selectedTests.includes(testName);
  ;(shouldRun ? test : test.skip)(testName, fn, timeout);
}
```

## CI/CD Test Requirements

**GitHub Actions:**
- Workflow: `.github/workflows/skill-docs.yml`
- Trigger: On push and pull request
- Steps:
  1. `bun install`
  2. `bun run gen:skill-docs` (Claude host)
  3. `git diff --exit-code` (fail if SKILL.md files stale)
  4. `bun run gen:skill-docs --host codex` (Codex host)
  5. `git diff --exit-code -- .agents/` (fail if Codex SKILL.md files stale)

**Requirements:**
- All Tier 1 tests must pass (free, <2s)
- Generated SKILL.md files must be fresh (no stale placeholders)
- No unresolved template placeholders

**Not enforced in CI:**
- Tier 2/3 tests (paid, require API keys)
- These are run manually before shipping

## Test Result Persistence

**Location:** `~/.spec-first-dev/evals/`

**Structure:**
```
~/.spec-first-dev/evals/
├── llm-judge-2026-03-23T10-30-45.json
├── e2e-2026-03-23T10-35-22.json
└── ...
```

**Format:**
```typescript
interface EvalRun {
  timestamp: string;
  tier: 'llm-judge' | 'e2e';
  tests: Array<{
    name: string;
    suite: string;
    tier: string;
    passed: boolean;
    duration_ms: number;
    cost_usd?: number;
    judge_scores?: Record<string, number>;
    judge_reasoning?: string;
    model?: string;
    exitReason?: string;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration_ms: number;
    cost_usd: number;
  };
  git: {
    branch: string;
    commit: string;
    baseBranch: string;
  };
}
```

**Usage:**
```typescript
const evalCollector = new EvalCollector('llm-judge');

evalCollector.addTest({
  name: 'command reference table',
  suite: 'LLM-as-judge quality evals',
  tier: 'llm-judge',
  passed: scores.clarity >= 4,
  duration_ms: Date.now() - t0,
  cost_usd: 0.02,
  judge_scores: { clarity: scores.clarity, completeness: scores.completeness },
  judge_reasoning: scores.reasoning,
});

await evalCollector.finalize();  // Writes to ~/.spec-first-dev/evals/
```

**Comparison:**
```bash
bun run eval:list      # List all runs
bun run eval:compare   # Compare last two runs
bun run eval:summary   # Aggregate stats across all runs
```

## Special Testing Patterns

**Session Runner (for E2E tests):**
```typescript
export interface SkillTestResult {
  toolCalls: Array<{ tool: string; input: any; output: string }>;
  browseErrors: string[];
  exitReason: string;
  duration: number;
  output: string;
  costEstimate: CostEstimate;
  transcript: any[];
  model: string;
  firstResponseMs: number;
  maxInterTurnMs: number;
}

export async function runSkillTest(opts: {
  testName: string;
  prompt: string;
  workingDirectory: string;
  maxTurns?: number;
  timeout?: number;
  model?: string;
  runId: string;
}): Promise<SkillTestResult>
```

**LLM-as-Judge:**
```typescript
export interface JudgeScore {
  clarity: number;       // 1-5
  completeness: number;  // 1-5
  actionability: number; // 1-5
  reasoning: string;
}

export async function callJudge<T>(prompt: string): Promise<T> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Judge returned non-JSON: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]) as T;
}
```

---

*Testing analysis: 2026-03-23*
