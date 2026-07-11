'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  inspectInstructionBootstrap,
  removeManagedBootstrapBlock,
} = require('../../src/cli/instruction-bootstrap');
const {
  applyManagedBlock,
  buildManagedBlock,
  LANG_END,
  LANG_START,
  WORKFLOW_ENTRY_ANCHOR,
} = require('../../src/cli/lang-policy');

const adapter = {
  instructionFile: 'AGENTS.md',
  skillsRoot: '.agents/skills',
};

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-instruction-bootstrap-'));
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function installRuntimeSkill(projectRoot) {
  writeText(
    path.join(projectRoot, adapter.skillsRoot, 'using-spec-first', 'SKILL.md'),
    '---\nname: using-spec-first\n---\n',
  );
}

describe('instruction bootstrap contract', () => {
  test.each(['zh', 'en'])('managed %s block uses a host-neutral installed-skill anchor', (lang) => {
    const block = buildManagedBlock(lang);

    expect(block).toContain(WORKFLOW_ENTRY_ANCHOR);
    expect(block).toContain('`using-spec-first`');
    expect(block).not.toContain('skills/using-spec-first/SKILL.md');
    expect(block).not.toContain('CHANGELOG.md');
    expect(block).not.toContain('### Changelog');
  });

  test('inspection requires one balanced managed block and the installed runtime skill', () => {
    const projectRoot = tempProject();
    installRuntimeSkill(projectRoot);
    writeText(path.join(projectRoot, adapter.instructionFile), buildManagedBlock('en'));

    expect(inspectInstructionBootstrap(projectRoot, adapter)).toMatchObject({
      status: 'installed',
      message: 'workflow entry guidance and installed using-spec-first runtime are present',
    });
  });

  test('inspection rejects a pointer-only block when the runtime skill is missing', () => {
    const projectRoot = tempProject();
    writeText(path.join(projectRoot, adapter.instructionFile), buildManagedBlock('en'));

    expect(inspectInstructionBootstrap(projectRoot, adapter)).toMatchObject({
      status: 'missing',
      message: '.agents/skills/using-spec-first/SKILL.md is missing',
    });
  });

  test('inspection rejects managed content drift even when the anchor and runtime skill remain', () => {
    const projectRoot = tempProject();
    installRuntimeSkill(projectRoot);
    const driftedBlock = buildManagedBlock('en').replace(
      'that skill provides the full entry routing map and boundaries.',
      'the full entry routing map and boundaries live in `skills/using-spec-first/SKILL.md`.',
    );
    writeText(path.join(projectRoot, adapter.instructionFile), driftedBlock);

    expect(inspectInstructionBootstrap(projectRoot, adapter)).toMatchObject({
      status: 'drifted',
      message: 'managed language/governance block drifted from expected content',
    });
  });

  test('inspection accepts generated managed content with CRLF line endings', () => {
    const projectRoot = tempProject();
    installRuntimeSkill(projectRoot);
    writeText(
      path.join(projectRoot, adapter.instructionFile),
      buildManagedBlock('en').replace(/\n/g, '\r\n'),
    );

    expect(inspectInstructionBootstrap(projectRoot, adapter)).toMatchObject({
      status: 'installed',
    });
  });

  test.each([
    ['duplicate pair', `${buildManagedBlock('en')}\n${buildManagedBlock('en')}`],
    ['dangling start', `${LANG_START}\n${WORKFLOW_ENTRY_ANCHOR}`],
    ['dangling end', `${WORKFLOW_ENTRY_ANCHOR}\n${LANG_END}`],
  ])('inspection rejects %s markers', (_label, contents) => {
    const projectRoot = tempProject();
    installRuntimeSkill(projectRoot);
    writeText(path.join(projectRoot, adapter.instructionFile), contents);

    expect(inspectInstructionBootstrap(projectRoot, adapter)).toMatchObject({
      status: 'partial',
      message: 'managed language/governance markers must form exactly one balanced pair',
    });
  });

  test.each([
    ['duplicate pair', `${buildManagedBlock('en')}\n${buildManagedBlock('en')}`],
    ['dangling start', `${LANG_START}\nuser content`],
    ['dangling end', `user content\n${LANG_END}`],
  ])('managed-block update fails closed for %s markers', (_label, contents) => {
    expect(() => applyManagedBlock(contents, buildManagedBlock('zh'))).toThrow(
      'managed language/governance markers must form exactly one balanced pair',
    );
  });

  test.each([
    [
      'marked legacy block',
      [
        '# User guidance',
        '',
        '<!-- spec-first:bootstrap:start -->',
        '## Workflow Entry Governance',
        '',
        '- This block is only a `using-spec-first` source pointer; the full entry routing map and boundaries live in `skills/using-spec-first/SKILL.md`',
        '<!-- spec-first:bootstrap:end -->',
        '',
      ].join('\n'),
    ],
    [
      'unmarked legacy body',
      [
        '# User guidance',
        '',
        '## Workflow Entry Governance',
        '',
        '- This block is only a `using-spec-first` source pointer; the full entry routing map and boundaries live in `skills/using-spec-first/SKILL.md`',
        '',
      ].join('\n'),
    ],
  ])('removes %s without deleting user guidance', (_label, contents) => {
    expect(removeManagedBootstrapBlock(contents)).toBe('# User guidance\n');
  });
});
