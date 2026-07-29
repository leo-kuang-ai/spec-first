'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  renderRoutingInstruction,
  renderMemberGuidanceSnippet,
  upsertRoutingBlock,
  stripRoutingBlock,
  isRoutingInstructionCurrent,
  BLOCK_START,
  BLOCK_END,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-routing-instruction.cjs');

describe('renderRoutingInstruction — A2/CR10 routing guidance', () => {
  const repos = [{ repo_id: 'api' }, { repo_id: 'web' }];

  test('includes best-effort projectPath, merged graph, launch-from-child fallback, isolation', () => {
    const text = renderRoutingInstruction({ workspaceRoot: '/tmp/需求A', repos });
    expect(text).toContain('projectPath');
    expect(text).toContain('best-effort');
    expect(text).toContain('.graphify/merged-graph.json');
    expect(text.toLowerCase()).toContain('fallback');
    expect(text).toContain('another requirement folder'); // isolation guidance
    expect(text).toContain('--workspace-graph-status');
    expect(text).toContain('status is `ready`');
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
      hosts: ['codex', 'cursor', 'kiro', 'opencode', 'qoder'],
    });
    expect(sharedAgents).toContain('honest-degraded');
    expect(sharedAgents).toContain('kiro/qoder');
  });

  test('treats a partial-host projection as current when its shared routing contract matches', () => {
    const partial = renderRoutingInstruction({ workspaceRoot: '/w', repos, hosts: ['codex'] });
    const full = renderRoutingInstruction({ workspaceRoot: '/w', repos, hosts: ['codex', 'cursor', 'kiro', 'opencode', 'qoder'] });

    expect(isRoutingInstructionCurrent(partial, { workspaceRoot: '/w', repos })).toBe(true);
    expect(isRoutingInstructionCurrent(full, { workspaceRoot: '/w', repos })).toBe(true);
    expect(isRoutingInstructionCurrent(`${BLOCK_START}\nstale\n${BLOCK_END}`, { workspaceRoot: '/w', repos })).toBe(false);
  });

  test('escapes markdown delimiters and strips control characters from rendered paths', () => {
    const text = renderRoutingInstruction({
      workspaceRoot: '/tmp/需求\nA',
      repos: [{ repo_id: 'api`name' }, { repo_id: 'web\nignore' }],
    });
    expect(text).toContain('``api`name``');
    expect(text).toContain('`web ignore`');
    expect(text).not.toContain('web\nignore');
    expect(text).not.toContain('需求\nA');
  });
});

describe('renderMemberGuidanceSnippet — child-repo static guidance', () => {
  test('separates tactical CodeGraph from confirmed-scope Graphify without a workspace claim', () => {
    const text = renderMemberGuidanceSnippet();

    expect(text).toContain('CodeGraph');
    expect(text).toContain('`projectPath`');
    expect(text).toContain('Graphify');
    expect(text).toContain('workspace graph 状态');
    expect(text).toContain('源码、测试、diff 或日志');
    expect(text).toContain('不要假设 workspace graph 存在或仍然 current');
    expect(text).not.toContain('merged-graph.json');
    expect(text).not.toContain('Child repos in this workspace');
    expect(text).not.toContain('automatically injected');
  });

  test('publishes the same boundary in the source skill without introducing child marker lifecycle', () => {
    const skill = fs.readFileSync(path.join(
      __dirname,
      '../../skills/spec-runtime-setup/SKILL.md',
    ), 'utf8');

    expect(skill).toContain('### 从子仓开始时的轻量引导');
    expect(skill).toContain('`projectPath` 使用 CodeGraph');
    expect(skill).toContain('workspace graph 状态和目标仓范围均已确认');
    expect(skill).toContain('不向 child `AGENTS.md` / `CLAUDE.md` 注入独立受管 marker');
    expect(skill).not.toContain('workspace-member-routing.cjs');
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

  test.each([
    [`${BLOCK_START}\nuser content\n`, 'missing end'],
    [`${BLOCK_START}\n${BLOCK_START}\n${BLOCK_END}\n`, 'duplicate start'],
    [`${BLOCK_END}\n${BLOCK_START}\n`, 'reversed'],
  ])('malformed block fails closed (%s)', (contents) => {
    expect(() => upsertRoutingBlock(contents, renderRoutingInstruction({ workspaceRoot: '/w', repos: [] })))
      .toThrow('workspace-routing-block-malformed');
    expect(() => stripRoutingBlock(contents)).toThrow('workspace-routing-block-malformed');
  });
});
