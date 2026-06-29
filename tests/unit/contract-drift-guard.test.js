'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CodexAdapter = require('../../src/cli/adapters/codex');
const probes = require('./fixtures/contract-capability-probes');

const REPO_ROOT = path.join(__dirname, '..', '..');
const ROLE_CONTRACT_PATH = path.join(REPO_ROOT, 'docs', '10-prompt', '结构化项目角色契约.md');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);
const CLAUDE_COMMAND_TEMPLATE_DIR = path.join(REPO_ROOT, 'templates', 'claude', 'commands', 'spec');
const HARNESS_SECTION = '## 2. 核心链路与 Harness 层';
const WORKFLOW_SECTION = '## 5. Workflow 入口与 Dispatch 边界';
const VALID_HARNESS_LAYERS = [
  'Context Harness',
  'Execution Harness',
  'Evidence Harness',
  'Evaluation Harness',
  'Governance Harness',
  'Knowledge Harness',
];
const EXCLUDED_PREFIXES = [
  '.claude/',
  '.codex/',
  '.agents/skills/',
  '.spec-first/audits/',
  'node_modules/',
  'graphify-out/',
];
const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ps1',
  '.sh',
  '.txt',
  '.yaml',
  '.yml',
]);

function markdownSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim() === heading);
  if (startIndex === -1) {
    throw new Error(`Missing markdown section: ${heading}`);
  }

  const nextIndex = lines.findIndex((line, index) => index > startIndex && /^##\s+/.test(line));
  const endIndex = nextIndex === -1 ? lines.length : nextIndex;
  return {
    text: lines.slice(startIndex, endIndex).join('\n'),
    startLine: startIndex + 1,
  };
}

function tableColumns(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return null;
  }
  const columns = trimmed.split('|').slice(1, -1).map((column) => column.trim());
  if (columns.every((column) => /^:?-{3,}:?$/.test(column))) {
    return null;
  }
  return columns;
}

function parseHarnessTerms(markdown) {
  const section = markdownSection(markdown, HARNESS_SECTION);
  const terms = [];
  const lines = section.text.split(/\r?\n/);

  for (const [offset, line] of lines.entries()) {
    const columns = tableColumns(line);
    if (!columns || columns.length < 3 || !VALID_HARNESS_LAYERS.includes(columns[0])) {
      continue;
    }

    for (const rawTerm of columns[2].split('、')) {
      const hasAspirationalMarker = /\(aspirational\)/.test(rawTerm);
      const termText = rawTerm
        .replace(/\s*\(aspirational\)\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!termText) continue;
      terms.push({
        layer: columns[0],
        term: termText,
        rawTerm: rawTerm.trim(),
        rawCell: columns[2],
        lineNumber: section.startLine + offset,
        hasAspirationalMarker,
      });
    }
  }

  return terms;
}

function keyFor(layer, term) {
  return `${layer}\u0000${term}`;
}

function flattenProbeRegistry(registry) {
  const entries = [];
  const errors = [];
  const seen = new Set();

  for (const [layer, group] of Object.entries(registry || {})) {
    if (!VALID_HARNESS_LAYERS.includes(layer)) {
      errors.push({ reason: 'unknown_layer', layer });
    }

    const rawEntries = Array.isArray(group)
      ? group.map((entry) => [entry && entry.term, entry && entry.probe])
      : Object.entries(group || {});

    for (const [term, probe] of rawEntries) {
      if (!term || typeof term !== 'string') {
        errors.push({ reason: 'invalid_probe_term', layer, term });
        continue;
      }
      const key = keyFor(layer, term);
      if (seen.has(key)) {
        errors.push({ reason: 'duplicate_probe', layer, term });
      }
      seen.add(key);
      entries.push({ layer, term, probe });
    }
  }

  return { entries, errors };
}

function compareTermsAndProbes(contractTerms, registry) {
  const { entries, errors } = flattenProbeRegistry(registry);
  const registryByKey = new Map(entries.map((entry) => [keyFor(entry.layer, entry.term), entry]));
  const registryByTerm = new Map();
  const contractByKey = new Map();
  const contractByTerm = new Map();

  for (const term of contractTerms) {
    const key = keyFor(term.layer, term.term);
    if (contractByKey.has(key)) {
      errors.push({ reason: 'duplicate_contract_term', layer: term.layer, term: term.term, lineNumber: term.lineNumber });
    }
    contractByKey.set(key, term);
    if (!contractByTerm.has(term.term)) contractByTerm.set(term.term, []);
    contractByTerm.get(term.term).push(term);
  }

  for (const entry of entries) {
    if (!registryByTerm.has(entry.term)) registryByTerm.set(entry.term, []);
    registryByTerm.get(entry.term).push(entry);
  }

  for (const term of contractTerms) {
    if (registryByKey.has(keyFor(term.layer, term.term))) {
      continue;
    }
    const otherLayer = registryByTerm.get(term.term);
    errors.push(otherLayer && otherLayer.length > 0
      ? { reason: 'layer_mismatch', term: term.term, contractLayer: term.layer, probeLayers: otherLayer.map((entry) => entry.layer), lineNumber: term.lineNumber }
      : { reason: 'missing_probe', layer: term.layer, term: term.term, lineNumber: term.lineNumber });
  }

  for (const entry of entries) {
    if (contractByKey.has(keyFor(entry.layer, entry.term))) {
      continue;
    }
    const otherLayer = contractByTerm.get(entry.term);
    errors.push(otherLayer && otherLayer.length > 0
      ? { reason: 'layer_mismatch', term: entry.term, probeLayer: entry.layer, contractLayers: otherLayer.map((term) => term.layer) }
      : { reason: 'stale_probe', layer: entry.layer, term: entry.term });
  }

  return errors;
}

function repoRelative(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function isExcluded(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  return EXCLUDED_PREFIXES.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix));
}

function resolveInsideRoot(root, relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
    return null;
  }
  return absolutePath;
}

function collectTextFiles(root, relativePath, errors) {
  const absolutePath = resolveInsideRoot(root, relativePath);
  if (!absolutePath) {
    errors.push({ reason: 'probe_path_outside_root', path: relativePath });
    return [];
  }

  const normalized = repoRelative(root, absolutePath);
  if (isExcluded(normalized)) {
    return [];
  }
  if (!fs.existsSync(absolutePath)) {
    errors.push({ reason: 'content_probe_path_missing', path: relativePath });
    return [];
  }

  const stats = fs.statSync(absolutePath);
  if (stats.isFile()) {
    return TEXT_EXTENSIONS.has(path.extname(absolutePath)) ? [absolutePath] : [];
  }
  if (!stats.isDirectory()) {
    return [];
  }

  const files = [];
  for (const child of fs.readdirSync(absolutePath)) {
    files.push(...collectTextFiles(root, path.join(normalized, child), errors));
  }
  return files;
}

function patternHitCount(text, pattern) {
  if (typeof pattern === 'string') {
    return text.includes(pattern) ? 1 : 0;
  }
  if (pattern instanceof RegExp) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    return [...text.matchAll(matcher)].length;
  }
  return 0;
}

function validateProbeShape(layer, term, probe) {
  if (!probe || typeof probe !== 'object') {
    return [{ reason: 'invalid_probe_shape', layer, term, detail: 'probe must be an object' }];
  }
  if (!['path', 'content', 'aspirational'].includes(probe.type)) {
    return [{ reason: 'invalid_probe_shape', layer, term, detail: 'probe.type is invalid' }];
  }
  if (probe.type === 'path' && (!Array.isArray(probe.anyOf) || probe.anyOf.length === 0)) {
    return [{ reason: 'invalid_probe_shape', layer, term, detail: 'path probe requires non-empty anyOf' }];
  }
  if (probe.type === 'content' && (!Array.isArray(probe.paths) || probe.paths.length === 0 || !probe.pattern)) {
    return [{ reason: 'invalid_probe_shape', layer, term, detail: 'content probe requires non-empty paths and pattern' }];
  }
  if (probe.type === 'aspirational' && typeof probe.reason !== 'string') {
    return [{ reason: 'invalid_probe_shape', layer, term, detail: 'aspirational probe requires reason' }];
  }
  if (probe.type === 'aspirational' && probe.reason.trim() === '') {
    return [{ reason: 'invalid_probe_shape', layer, term, detail: 'aspirational reason must be non-empty' }];
  }
  return [];
}

function executeProbe(entry, { root = REPO_ROOT } = {}) {
  const { layer, term, probe } = entry;
  const shapeErrors = validateProbeShape(layer, term, probe);
  if (shapeErrors.length > 0) return { ok: false, errors: shapeErrors, hits: [] };

  if (probe.type === 'aspirational') {
    return { ok: true, errors: [], hits: [] };
  }

  if (probe.type === 'path') {
    const hits = [];
    const errors = [];
    for (const candidate of probe.anyOf) {
      const absolutePath = resolveInsideRoot(root, candidate);
      if (!absolutePath) {
        errors.push({ reason: 'probe_path_outside_root', layer, term, path: candidate });
        continue;
      }
      const relativePath = repoRelative(root, absolutePath);
      if (isExcluded(relativePath)) {
        errors.push({ reason: 'excluded_probe_path', layer, term, path: candidate });
        continue;
      }
      if (fs.existsSync(absolutePath)) hits.push(relativePath);
    }
    if (hits.length > 0) return { ok: true, errors, hits };
    return {
      ok: false,
      errors: [
        ...errors,
        { reason: 'path_probe_missed', layer, term, anyOf: probe.anyOf },
      ],
      hits,
    };
  }

  const errors = [];
  const hits = [];
  for (const probePath of probe.paths) {
    for (const filePath of collectTextFiles(root, probePath, errors)) {
      const text = fs.readFileSync(filePath, 'utf8');
      const hitCount = patternHitCount(text, probe.pattern);
      if (hitCount > 0) {
        hits.push({ path: repoRelative(root, filePath), count: hitCount });
      }
    }
  }

  if (hits.length > 0) return { ok: true, errors, hits };
  return {
    ok: false,
    errors: [
      ...errors,
      {
        reason: 'content_probe_missed',
        layer,
        term,
        pattern: String(probe.pattern),
        paths: probe.paths,
        hitCount: 0,
      },
    ],
    hits,
  };
}

function validateContractProbes(contractTerms, registry) {
  const { entries, errors } = flattenProbeRegistry(registry);
  const contractByKey = new Map(contractTerms.map((term) => [keyFor(term.layer, term.term), term]));

  for (const entry of entries) {
    const contractTerm = contractByKey.get(keyFor(entry.layer, entry.term));
    if (!contractTerm) continue;

    const shapeErrors = validateProbeShape(entry.layer, entry.term, entry.probe);
    errors.push(...shapeErrors);
    if (shapeErrors.length > 0) continue;

    if (entry.probe.type === 'aspirational') {
      if (!contractTerm.hasAspirationalMarker) {
        errors.push({
          reason: 'aspirational_marker_missing',
          layer: entry.layer,
          term: entry.term,
          lineNumber: contractTerm.lineNumber,
        });
      }
      continue;
    }

    if (contractTerm.hasAspirationalMarker) {
      errors.push({
        reason: 'unexpected_aspirational_marker',
        layer: entry.layer,
        term: entry.term,
        lineNumber: contractTerm.lineNumber,
      });
      continue;
    }

    const result = executeProbe(entry);
    errors.push(...result.errors);
  }

  return errors;
}

function commandNamesFromTemplates(templateDir = CLAUDE_COMMAND_TEMPLATE_DIR) {
  return fs.readdirSync(templateDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.basename(name, '.md'))
    .sort((a, b) => a.localeCompare(b));
}

function validateWorkflowCommandParity({
  governance,
  templateCommands,
  codexHasCommands,
}) {
  const errors = [];
  const workflowRecords = (governance.skills || [])
    .filter((skill) => skill.entry_surface === 'workflow_command');
  const expectedCommands = [];

  for (const record of workflowRecords) {
    if (!record.command_name) {
      errors.push({ reason: 'missing_command_name', skill_name: record.skill_name });
      continue;
    }
    expectedCommands.push(record.command_name);

    if (!record.host_delivery || record.host_delivery.claude !== 'command') {
      errors.push({
        reason: 'invalid_claude_delivery',
        skill_name: record.skill_name,
        command_name: record.command_name,
        actual: record.host_delivery && record.host_delivery.claude,
      });
    }
    if (record.host_scope === 'dual_host' && record.host_delivery && record.host_delivery.codex !== 'skill') {
      errors.push({
        reason: 'invalid_codex_delivery',
        skill_name: record.skill_name,
        command_name: record.command_name,
        actual: record.host_delivery.codex,
      });
    }
  }

  const expectedSet = new Set(expectedCommands);
  const templateSet = new Set(templateCommands);
  const commandToSkill = Object.fromEntries(
    workflowRecords.filter((r) => r.command_name).map((r) => [r.command_name, r.skill_name])
  );
  for (const command of [...expectedSet].sort((a, b) => a.localeCompare(b))) {
    if (!templateSet.has(command)) {
      const skillName = commandToSkill[command];
      const skillMdPath = skillName && path.join(REPO_ROOT, 'skills', skillName, 'SKILL.md');
      if (!skillMdPath || !fs.existsSync(skillMdPath)) {
        errors.push({ reason: 'missing_claude_command_template', command });
      }
    }
  }
  for (const command of [...templateSet].sort((a, b) => a.localeCompare(b))) {
    if (!expectedSet.has(command)) {
      errors.push({ reason: 'stale_claude_command_template', command });
    }
  }

  if (codexHasCommands !== false) {
    errors.push({ reason: 'unexpected_codex_command_delivery', codexHasCommands });
  }

  return errors;
}

function validateRoleContractSection5(sectionText) {
  const errors = [];
  if (sectionText.includes('/spec:update')) {
    errors.push({ reason: 'runtime_cli_misclassified_as_workflow', token: '/spec:update' });
  }
  for (const command of ['spec-first update', 'spec-first init', 'spec-first clean', 'spec-first doctor']) {
    if (!sectionText.includes(command)) {
      errors.push({ reason: 'runtime_cli_command_missing', command });
    }
  }
  return errors;
}

describe('contract-drift-guard harness declaration probes', () => {
  test('role contract revision-history anchor is present when referenced', () => {
    const contract = fs.readFileSync(ROLE_CONTRACT_PATH, 'utf8');
    const revisionHistory = markdownSection(contract, '## 12. 修订历史').text;

    expect(contract).toContain('修订历史见 §12');
    expect(markdownSection(contract, '## 11. 修订纪律（本文件的自指 gate）').text).toContain('价值权重与边界条款');
    expect(revisionHistory).toContain('Origin / 证据');
    expect(revisionHistory).toContain('多 agent 审查指出“修订历史见 §12”但文件缺少 §12');
    expect(revisionHistory).toContain('机械补齐 §12 修订历史锚点');
    expect(revisionHistory).toContain('后续修订若新增/修改价值权重、边界条款或机械锚定条款');
    expect(revisionHistory.split(/\r?\n/).filter((line) => line.startsWith('| 2026-06-28 | v2.0 |')).length)
      .toBeGreaterThanOrEqual(3);
  });

  test('parses §2 terms by layer while keeping backticks and term-local aspirational markers', () => {
    const terms = parseHarnessTerms(`
## 2. 核心链路与 Harness 层

| Harness 层 | 精髓 | spec-first 中的覆盖 |
| --- | --- | --- |
| Context Harness | x | alpha、\`rg\` |
| Evaluation Harness | x | debug 命中率 (aspirational)、review 漏判率 |

## 3. Next
`);

    expect(terms.map((term) => ({
      layer: term.layer,
      term: term.term,
      hasAspirationalMarker: term.hasAspirationalMarker,
    }))).toEqual([
      { layer: 'Context Harness', term: 'alpha', hasAspirationalMarker: false },
      { layer: 'Context Harness', term: '`rg`', hasAspirationalMarker: false },
      { layer: 'Evaluation Harness', term: 'debug 命中率', hasAspirationalMarker: true },
      { layer: 'Evaluation Harness', term: 'review 漏判率', hasAspirationalMarker: false },
    ]);
  });

  test('keeps role contract §2 and test-owned probe registry bidirectionally consistent', () => {
    const contractTerms = parseHarnessTerms(fs.readFileSync(ROLE_CONTRACT_PATH, 'utf8'));

    expect(compareTermsAndProbes(contractTerms, probes)).toEqual([]);
  });

  test('reports missing, stale, duplicate, and layer-mismatched registry entries', () => {
    const contractTerms = [
      { layer: 'Context Harness', term: 'alpha', lineNumber: 1 },
      { layer: 'Evidence Harness', term: 'beta', lineNumber: 2 },
      { layer: 'Governance Harness', term: 'gamma', lineNumber: 3 },
    ];
    const registry = {
      'Context Harness': [
        { term: 'alpha', probe: { type: 'path', anyOf: ['README.md'] } },
        { term: 'alpha', probe: { type: 'path', anyOf: ['README.md'] } },
        { term: 'stale', probe: { type: 'path', anyOf: ['README.md'] } },
      ],
      'Knowledge Harness': {
        beta: { type: 'path', anyOf: ['README.md'] },
      },
    };

    expect(compareTermsAndProbes(contractTerms, registry)).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'duplicate_probe', layer: 'Context Harness', term: 'alpha' }),
      expect.objectContaining({ reason: 'stale_probe', layer: 'Context Harness', term: 'stale' }),
      expect.objectContaining({ reason: 'layer_mismatch', term: 'beta' }),
      expect.objectContaining({ reason: 'missing_probe', layer: 'Governance Harness', term: 'gamma' }),
    ]));
  });

  test('executes path/content probes and enforces term-local aspirational honesty', () => {
    const contractTerms = parseHarnessTerms(fs.readFileSync(ROLE_CONTRACT_PATH, 'utf8'));

    expect(validateContractProbes(contractTerms, probes)).toEqual([]);
  });

  test('probe executor emits deterministic errors and excludes generated runtime paths', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-drift-guard-'));
    fs.mkdirSync(path.join(tempRoot, 'source'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, '.agents', 'skills', 'fake'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, 'graphify-out'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, 'source', 'contract.md'), 'real-source-anchor');
    fs.writeFileSync(path.join(tempRoot, '.agents', 'skills', 'fake', 'SKILL.md'), 'mirror-only-anchor');
    fs.writeFileSync(path.join(tempRoot, 'graphify-out', 'graph.md'), 'mirror-only-anchor');

    expect(executeProbe({
      layer: 'Context Harness',
      term: 'source',
      probe: { type: 'content', paths: ['source'], pattern: 'real-source-anchor' },
    }, { root: tempRoot })).toMatchObject({ ok: true });
    expect(executeProbe({
      layer: 'Context Harness',
      term: 'excluded',
      probe: { type: 'content', paths: ['.agents/skills', 'graphify-out'], pattern: 'mirror-only-anchor' },
    }, { root: tempRoot }).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'content_probe_missed' }),
    ]));
    expect(executeProbe({
      layer: 'Context Harness',
      term: 'bad-path',
      probe: { type: 'path', anyOf: [] },
    }, { root: tempRoot }).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'invalid_probe_shape' }),
    ]));
  });

  test('negative aspirational states fail when marker and registry disagree', () => {
    const termsWithoutMarker = parseHarnessTerms(`
## 2. 核心链路与 Harness 层

| Harness 层 | 精髓 | spec-first 中的覆盖 |
| --- | --- | --- |
| Evaluation Harness | x | debug 命中率 |
`);
    const termsWithMarker = parseHarnessTerms(`
## 2. 核心链路与 Harness 层

| Harness 层 | 精髓 | spec-first 中的覆盖 |
| --- | --- | --- |
| Evaluation Harness | x | workflow 质量反馈 (aspirational) |
`);

    expect(validateContractProbes(termsWithoutMarker, {
      'Evaluation Harness': {
        'debug 命中率': { type: 'aspirational', reason: 'not implemented' },
      },
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'aspirational_marker_missing' }),
    ]));
    expect(validateContractProbes(termsWithMarker, {
      'Evaluation Harness': {
        'workflow 质量反馈': { type: 'path', anyOf: ['README.md'] },
      },
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'unexpected_aspirational_marker' }),
    ]));
  });
});

describe('contract-drift-guard workflow registry and runtime CLI honesty', () => {
  test('derives Claude command parity from skills governance and preserves Codex skill delivery', () => {
    const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
    const codex = new CodexAdapter();

    expect(validateWorkflowCommandParity({
      governance,
      templateCommands: commandNamesFromTemplates(),
      codexHasCommands: codex.hasCommands,
    })).toEqual([]);
  });

  test('workflow registry parity reports stale templates and invalid delivery records', () => {
    const governance = {
      skills: [
        {
          skill_name: 'spec-alpha',
          entry_surface: 'workflow_command',
          command_name: 'alpha',
          host_scope: 'dual_host',
          host_delivery: { claude: 'skill', codex: 'command' },
        },
        {
          skill_name: 'spec-missing',
          entry_surface: 'workflow_command',
          command_name: null,
          host_scope: 'dual_host',
          host_delivery: { claude: 'command', codex: 'skill' },
        },
      ],
    };

    expect(validateWorkflowCommandParity({
      governance,
      templateCommands: ['stale'],
      codexHasCommands: false,
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'invalid_claude_delivery', command_name: 'alpha' }),
      expect.objectContaining({ reason: 'invalid_codex_delivery', command_name: 'alpha' }),
      expect.objectContaining({ reason: 'missing_command_name', skill_name: 'spec-missing' }),
      expect.objectContaining({ reason: 'missing_claude_command_template', command: 'alpha' }),
      expect.objectContaining({ reason: 'stale_claude_command_template', command: 'stale' }),
    ]));
  });

  test('role contract §5 keeps runtime maintenance actions as terminal CLI commands', () => {
    const section = markdownSection(fs.readFileSync(ROLE_CONTRACT_PATH, 'utf8'), WORKFLOW_SECTION);

    expect(validateRoleContractSection5(section.text)).toEqual([]);
    expect(validateRoleContractSection5('/spec:update should not be here\nspec-first init')).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'runtime_cli_misclassified_as_workflow', token: '/spec:update' }),
      expect.objectContaining({ reason: 'runtime_cli_command_missing', command: 'spec-first update' }),
    ]));
  });
});
