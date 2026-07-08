'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const AGENT_PATH = path.join(REPO_ROOT, 'skills/spec-ideate/references/agents/web-researcher.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('web researcher contracts', () => {
  test('does not frontmatter-limit capability-based web tooling to built-in names', () => {
    const agent = read(AGENT_PATH);
    const frontmatter = agent.match(/^---\n([\s\S]*?)\n---/);

    expect(frontmatter).not.toBeNull();
    expect(frontmatter[1]).not.toMatch(/^tools:\s*WebSearch,\s*WebFetch\s*$/m);
    expect(frontmatter[1]).not.toMatch(/^tools:/m);
  });

  test('uses capability-based web tool checks without hardcoding a calendar year', () => {
    const agent = read(AGENT_PATH);

    expect(agent).toContain('dedicated web-search and web-fetch tools');
    expect(agent).toContain('Identify the web-search and web-fetch capabilities reachable from this agent');
    expect(agent).toContain('built-in tools, MCP-provided tools, dedicated CLIs, or any other purpose-built web mechanism');
    expect(agent).toContain('Both capabilities are required');
    expect(agent).toContain('a single purpose-built tool that covers both responsibilities counts');
    expect(agent).toContain('use the web-search and web-fetch tools Step 1 identified');

    expect(agent).not.toContain('This agent depends on `WebSearch` and `WebFetch`.');
    expect(agent).not.toContain('Use `WebSearch` and `WebFetch` only.');
    expect(agent).not.toMatch(/\b20\d{2}\b/);
  });

  test('requires dedicated web tooling and rejects generic network command substitution', () => {
    const agent = read(AGENT_PATH);

    expect(agent).toContain('purpose-built web tool, not a generic network command');
    expect(agent).toContain('Do not substitute generic shell/network commands (`curl`, `wget`)');
    expect(agent).toContain('Web research unavailable: web-search or web-fetch capability not available in this environment.');
  });

  test('keeps the structured grounding output contract stable', () => {
    const agent = read(AGENT_PATH);

    expect(agent).toContain('**Research value: high** -- [one-sentence justification]');
    expect(agent).toContain('### Prior Art');
    expect(agent).toContain('### Adjacent Solutions');
    expect(agent).toContain('### Market and Competitor Signals');
    expect(agent).toContain('### Cross-Domain Analogies');
    expect(agent).toContain('### Sources');
    expect(agent).toContain('External signal on [topic] is thin after a phased search');
    expect(agent).toContain('Do not include sources that were searched but not consulted in the final synthesis.');
  });
});
