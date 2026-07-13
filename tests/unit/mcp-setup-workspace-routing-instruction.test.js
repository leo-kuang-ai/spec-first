'use strict';

const {
  renderRoutingInstruction,
  upsertRoutingBlock,
  stripRoutingBlock,
  BLOCK_START,
  BLOCK_END,
} = require('../../skills/spec-mcp-setup/scripts/lib/workspace-routing-instruction.cjs');

describe('renderRoutingInstruction — A2/CR10 routing guidance', () => {
  const repos = [{ repo_id: 'api' }, { repo_id: 'web' }];

  test('includes best-effort projectPath, merged graph, launch-from-child fallback, isolation', () => {
    const text = renderRoutingInstruction({ workspaceRoot: '/tmp/需求A', repos });
    expect(text).toContain('projectPath');
    expect(text).toContain('best-effort');
    expect(text).toContain('.graphify/merged-graph.json');
    expect(text.toLowerCase()).toContain('fallback');
    expect(text).toContain('another requirement folder'); // isolation guidance
    expect(text).toContain('`api`');
    expect(text).toContain('`web`');
    expect(text.startsWith(BLOCK_START)).toBe(true);
    expect(text.trimEnd().endsWith(BLOCK_END)).toBe(true);
  });

  test('adds an honest CodeGraph degradation note for kiro/qoder only', () => {
    expect(renderRoutingInstruction({ workspaceRoot: '/w', repos, host: 'kiro' })).toContain('honest-degraded');
    expect(renderRoutingInstruction({ workspaceRoot: '/w', repos, host: 'qoder' })).toContain('honest-degraded');
    expect(renderRoutingInstruction({ workspaceRoot: '/w', repos, host: 'claude' })).not.toContain('honest-degraded');
    expect(renderRoutingInstruction({ workspaceRoot: '/w', repos, host: 'codex' })).not.toContain('honest-degraded');
    const sharedAgents = renderRoutingInstruction({
      workspaceRoot: '/w',
      repos,
      hosts: ['codex', 'cursor', 'kiro', 'qoder'],
    });
    expect(sharedAgents).toContain('honest-degraded');
    expect(sharedAgents).toContain('kiro/qoder');
  });
});

describe('upsert/strip routing block — idempotent managed block', () => {
  test('upsert into empty doc yields exactly one block', () => {
    const block = renderRoutingInstruction({ workspaceRoot: '/w', repos: [{ repo_id: 'api' }] });
    const doc = upsertRoutingBlock('', block);
    expect(doc.split(BLOCK_START).length - 1).toBe(1);
  });

  test('upsert preserves surrounding content and replaces a stale block (idempotent)', () => {
    const first = renderRoutingInstruction({ workspaceRoot: '/w', repos: [{ repo_id: 'api' }] });
    let doc = `# Host instructions\n\nUser content.\n`;
    doc = upsertRoutingBlock(doc, first);
    expect(doc).toContain('User content.');

    // Re-render with an added repo and upsert again → still one block, updated.
    const second = renderRoutingInstruction({ workspaceRoot: '/w', repos: [{ repo_id: 'api' }, { repo_id: 'web' }] });
    doc = upsertRoutingBlock(doc, second);
    expect(doc.split(BLOCK_START).length - 1).toBe(1);
    expect(doc).toContain('`web`');
    expect(doc).toContain('User content.');
  });

  test('strip removes the block and leaves user content intact', () => {
    const block = renderRoutingInstruction({ workspaceRoot: '/w', repos: [{ repo_id: 'api' }] });
    const doc = upsertRoutingBlock('# Doc\n\nkeep me\n', block);
    const stripped = stripRoutingBlock(doc);
    expect(stripped).toContain('keep me');
    expect(stripped).not.toContain(BLOCK_START);
  });
});
