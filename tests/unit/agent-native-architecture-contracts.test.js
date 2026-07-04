'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills/agent-native-architecture/SKILL.md');
const EVALS_PATH = path.join(REPO_ROOT, 'skills/agent-native-architecture/evals/examples.json');
const REFERENCES_DIR = path.join(REPO_ROOT, 'skills/agent-native-architecture/references');
const AUDIT_PLAYBOOK_PATH = path.join(REFERENCES_DIR, 'audit-playbook.md');
const CHECKLISTS_PATH = path.join(REFERENCES_DIR, 'checklists.md');
const GOVERNANCE_PATH = path.join(REPO_ROOT, 'src/cli/contracts/dual-host-governance/skills-governance.json');
const GUARDRAILS_PATH = path.join(REFERENCES_DIR, 'runtime-production-guardrails.md');
const PRINCIPLES_PATH = path.join(REFERENCES_DIR, 'agent-native-principles.md');
const TESTING_PATH = path.join(REFERENCES_DIR, 'agent-native-testing.md');
const MCP_TOOL_DESIGN_PATH = path.join(REFERENCES_DIR, 'mcp-tool-design.md');
const PRODUCT_IMPLICATIONS_PATH = path.join(REFERENCES_DIR, 'product-implications.md');
const SELF_MODIFICATION_PATH = path.join(REFERENCES_DIR, 'self-modification.md');
const LOCAL_MANIFEST_PATH = path.join(REPO_ROOT, 'skills/agent-native-architecture/manifest.json');
const REVIEWER_AGENT_PATH = path.join(REPO_ROOT, 'agents/spec-agent-native-reviewer.agent.md');
const BEST_PRACTICES_RESEARCHER_PATH = path.join(REPO_ROOT, 'agents/spec-best-practices-researcher.agent.md');
const PERSONA_CATALOG_PATH = path.join(REPO_ROOT, 'skills/spec-code-review/references/persona-catalog.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function sectionBetween(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker, start + startMarker.length);

  expect(start).not.toBe(-1);
  expect(end).not.toBe(-1);

  return content.slice(start, end);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function numberedBoldLabels(section) {
  return Array.from(section.matchAll(/^\d+\.\s+\*\*(.+?)\*\*/gm), (match) => match[1]);
}

function expectNoPublicAgentNativeCommandReference(content) {
  expect(content).not.toContain('`/agent-native-architecture`');
  expect(content).not.toMatch(/(^|[^A-Za-z0-9_.-])\/agent-native-architecture\b/);
}

describe('agent-native-architecture contracts', () => {
  test('source skill declares internal invocation and runtime/source boundaries', () => {
    const skill = read(SKILL_PATH);
    const governance = JSON.parse(read(GOVERNANCE_PATH));
    const targetGovernance = governance.skills.find((entry) => entry.skill_name === 'agent-native-architecture');

    expect(targetGovernance).toMatchObject({
      entry_surface: 'internal_only',
      command_name: null,
      host_delivery: {
        claude: 'internal',
        codex: 'internal',
        kiro: 'internal',
        qoder: 'internal',
      },
    });

    [
      '## Purpose',
      '## Invocation Boundary',
      '## When To Use',
      '## When Not To Use',
      '## Inputs',
      '## Outputs',
      '## Workflow',
      '## Failure Modes',
      '## Runtime/Source Boundary',
    ].forEach((heading) => {
      expect(skill).toContain(heading);
    });

    expect(skill).toContain('internal architecture reference/helper');
    expect(skill).toContain('not a public `spec-*` workflow');
    expect(skill).toContain('Generated runtime mirrors are not source-of-truth');
    expectNoPublicAgentNativeCommandReference(skill);
  });

  test('source skill preserves identity and routes long principles to references', () => {
    const skill = read(SKILL_PATH);
    const principles = read(PRINCIPLES_PATH);

    expect(skill).toContain('name: agent-native-architecture');
    expect(skill).toContain('references/agent-native-principles.md');
    expect(skill).not.toContain('<why_now>');
    expect(skill).not.toContain('<core_principles>');
    expect(skill).not.toContain('<quick_start>');

    expect(principles).toContain('### 1. Parity');
    expect(principles).toContain('### 2. Granularity');
    expect(principles).toContain('### 3. Composability');
    expect(principles).toContain('### 4. Emergent Capability');
    expect(principles).toContain('### 5. Improvement Over Time');
    expect(principles).toContain('Whatever the user can do through the UI, the agent should be able to achieve through tools.');
    expect(principles).toContain('Features are outcomes achieved by an agent operating in a loop.');
    expect(principles).toContain('Can you add a new feature by writing a new prompt section, without adding new code?');
  });

  test('source skill exposes canonical taxonomy for adjacent assets', () => {
    const skill = read(SKILL_PATH);

    expect(skill).toContain('## Canonical Taxonomy');
    [
      'Action parity',
      'Primitive tools',
      'Shared workspace',
      'Context injection',
      'Prompt-native features',
      'Production guardrails',
      'Eval readiness',
    ].forEach((term) => {
      expect(skill).toContain(term);
    });
  });

  test('source skill preserves compact reference routing and architecture checklist contracts', () => {
    const skill = read(SKILL_PATH);
    const checklists = read(CHECKLISTS_PATH);

    expect(skill).toContain('## Reference Routing');
    expect(skill).toContain('Read only the track that matches the task');

    [
      'references/agent-native-principles.md',
      'references/architecture-patterns.md',
      'references/files-universal-interface.md',
      'references/shared-workspace-architecture.md',
      'references/checklists.md',
      'references/mcp-tool-design.md',
      'references/from-primitives-to-domain-tools.md',
      'references/system-prompt-design.md',
      'references/dynamic-context-injection.md',
      'references/agent-execution-patterns.md',
      'references/action-parity-discipline.md',
      'references/audit-playbook.md',
      'references/runtime-production-guardrails.md',
      'references/self-modification.md',
      'references/product-implications.md',
      'references/mobile-patterns.md',
      'references/agent-native-testing.md',
      'references/refactoring-to-prompt-native.md',
    ].forEach((referencePath) => {
      expect(skill).toContain(referencePath);
    });

    expect(skill).toContain('For full-codebase agent-native architecture audits, read `references/audit-playbook.md`');
    expect(skill).toContain('Production autonomy or self-modification');
    expect(skill).toContain('evals/examples.json');
    expect(skill).not.toContain('<architecture_checklist>');
    expect(skill).not.toContain('<anti_patterns>');
    expect(skill).not.toContain('<success_criteria>');
    expect(skill).not.toContain('## What aspect of agent-native architecture do you need help with?');
    expect(skill).not.toContain('**Wait for response before proceeding.**');

    expect(checklists).toContain('## Architecture Review Checklist');
    expect(checklists).toContain('## Anti-Patterns');
    expect(checklists).toContain('## Success Criteria');
    expect(checklists).toContain('**CRUD Completeness:** Every entity has create, read, update, AND delete');
    expect(checklists).toContain('**Completion Signals:** Agent has explicit `complete_task` tool');
    expect(checklists).toContain('THE CARDINAL SIN');
    expect(checklists).toContain('The Ultimate Test');
  });

  test('runtime transforms preserve host-specific naming and core contracts', () => {
    const sourceSkill = read(SKILL_PATH);
    const claude = new ClaudeAdapter();
    const codex = new CodexAdapter();
    const claudeRuntime = claude.transformSkillContent(sourceSkill);
    const codexRuntime = codex.transformSkillContent(sourceSkill, {
      skillName: 'agent-native-architecture',
    });

    expect(claudeRuntime).toContain('name: agent-native-architecture');
    expect(codexRuntime).toContain('name: agent-native-architecture');
    expect(claudeRuntime).toContain('references/checklists.md');
    expect(codexRuntime).toContain('references/checklists.md');
    expect(claudeRuntime).toContain('references/audit-playbook.md');
    expect(codexRuntime).toContain('references/audit-playbook.md');
    expect(claudeRuntime).not.toContain('compound-engineering');
    expect(codexRuntime).not.toContain('compound-engineering');
  });

  test('uses centralized governance instead of a local yao manifest', () => {
    const skill = read(SKILL_PATH);
    const governance = JSON.parse(read(GOVERNANCE_PATH));
    const targetGovernance = governance.skills.find((entry) => entry.skill_name === 'agent-native-architecture');

    expect(fs.existsSync(LOCAL_MANIFEST_PATH)).toBe(false);
    expect(targetGovernance).toBeDefined();
    expect(skill).toContain('centralized governance in `src/cli/contracts/dual-host-governance/skills-governance.json`');
    expect(skill).toContain('Do not add a per-skill manifest as a second governance source.');
  });

  test('declares eval examples as review-time boundary evidence', () => {
    const skill = read(SKILL_PATH);
    const evals = JSON.parse(read(EVALS_PATH));

    expect(skill).toContain('Route and boundary examples live in `evals/examples.json`');
    expect(skill).toContain('not as runtime state');
    expect(evals.skill).toBe('agent-native-architecture');
    expect(Array.isArray(evals.examples)).toBe(true);
  });

  test('reference examples avoid dated provider model ids', () => {
    const references = fs.readdirSync(REFERENCES_DIR)
      .filter((entry) => entry.endsWith('.md'))
      .map((entry) => read(path.join(REFERENCES_DIR, entry)))
      .join('\n');

    expect(references).not.toMatch(/claude-3-/);
    expect(references).not.toMatch(/claude-sonnet-4-\d{8}/);
    expect(references).not.toMatch(/claude-opus-4-\d{8}/);
    expect(references).toContain('Config.models.fast');
    expect(references).toContain('Config.models.frontier');
  });

  test('production guardrails reference is discoverable and provider-neutral', () => {
    const skill = read(SKILL_PATH);
    const checklists = read(CHECKLISTS_PATH);
    const testing = read(TESTING_PATH);
    const mcpToolDesign = read(MCP_TOOL_DESIGN_PATH);
    const productImplications = read(PRODUCT_IMPLICATIONS_PATH);
    const selfModification = read(SELF_MODIFICATION_PATH);
    const guardrails = read(GUARDRAILS_PATH);

    expect(skill).toContain('references/runtime-production-guardrails.md');
    expect(checklists).toContain('runtime-production-guardrails.md');
    [testing, mcpToolDesign, productImplications, selfModification].forEach((reference) => {
      expect(reference).toContain('runtime-production-guardrails.md');
    });

    [
      'External facts and social sources',
      'Workspace authority and sandbox boundaries',
      'Least privilege',
      'Secret redaction',
      'Network and firewall posture',
      'Approval by stakes and reversibility',
      'Audit logs and tracing',
      'Checkpoints and rollback',
      'Completion semantics',
      'Human-in-the-loop escalation',
      'Eval gates',
    ].forEach((category) => {
      expect(guardrails).toContain(category);
    });

    expect(guardrails).toContain('## Dimension to workflow application index');
    [
      'External facts and social sources',
      'Workspace authority and sandbox boundaries',
      'Least privilege',
      'Secret redaction',
      'Network and firewall posture',
      'Approval by stakes and reversibility',
      'Audit logs and tracing',
      'Checkpoints and rollback',
      'Completion semantics',
      'Human-in-the-loop escalation',
      'Eval gates',
    ].forEach((category) => {
      expect(guardrails).toMatch(new RegExp(`\\| ${escapeRegExp(category)} \\|[^\\n]+\\|[^\\n]+\\|`));
    });
    expect(guardrails).toContain('advisory evidence pressure, not confirmed source truth');
    expect(guardrails).toContain('`spec-plan`');
    expect(guardrails).toContain('`spec-work`');
    expect(guardrails).toContain('`spec-code-review`');
    expect(guardrails).toContain('`spec-mcp-setup`');
    expect(guardrails).toContain('`spec-skill-audit`');
    expect(guardrails).toContain('Provider notes are advisory pressure, not spec-first contract fields.');
    expect(guardrails).not.toMatch(/comprehensive security/i);
    expect(guardrails).not.toMatch(/provider-specific contract fields/i);
  });
});

describe('agent-native audit playbook deterministic prompt drift contracts', () => {
  test('agent-native-audit is no longer a standalone governed skill', () => {
    const governance = JSON.parse(read(GOVERNANCE_PATH));
    const auditGovernance = governance.skills.find((entry) => entry.skill_name === 'agent-native-audit');

    expect(auditGovernance).toBeUndefined();
    expect(fs.existsSync(path.join(REPO_ROOT, 'skills/agent-native-audit/SKILL.md'))).toBe(false);
  });

  test('audit playbook points to the stable action parity source and shared workspace label', () => {
    const auditPlaybook = read(AUDIT_PLAYBOOK_PATH);

    expect(auditPlaybook).toContain('## Adapter Contract');
    expect(auditPlaybook).toContain('Reference-only adapter; no public command, standalone skill, or direct runtime route');
    expect(auditPlaybook).toContain('Read-only analysis; no file edits, runtime regeneration, or hidden implementation');
    expect(auditPlaybook).toContain('Sequential current-agent audit when dispatch is unavailable');
    expect(auditPlaybook).toContain('1. **Action Parity**');
    expect(auditPlaybook).toContain('read `skills/agent-native-architecture/SKILL.md`');
    expect(auditPlaybook).toContain('skills/agent-native-architecture/references/action-parity-discipline.md');
    expect(auditPlaybook).not.toMatch(/option \d+ \(Action parity\)/i);
    expect(auditPlaybook).toContain('Audit for SHARED WORKSPACE - "Agent and user work in the same data space"');
    expect(auditPlaybook).toContain('Use `spec-skill-audit` for that.');
    expect(auditPlaybook).toContain('Use `spec-code-review` and its `spec-agent-native-reviewer`.');
    expectNoPublicAgentNativeCommandReference(auditPlaybook);
    expect(auditPlaybook).not.toContain('Select option 1 (action parity)');
    expect(auditPlaybook).not.toContain('Select option 7 (action parity)');
    expect(auditPlaybook).not.toContain('SHARED WORKSPASpec-First');
  });

  test('adjacent assets map to agent-native-architecture canonical taxonomy', () => {
    const auditPlaybook = read(AUDIT_PLAYBOOK_PATH);
    const reviewerAgent = read(REVIEWER_AGENT_PATH);
    const researcherAgent = read(BEST_PRACTICES_RESEARCHER_PATH);
    const personaCatalog = read(PERSONA_CATALOG_PATH);
    const adjacentAssets = [
      auditPlaybook,
      reviewerAgent,
      researcherAgent,
      personaCatalog,
    ].join('\n');

    expect(auditPlaybook).toContain('canonical taxonomy from `skills/agent-native-architecture/SKILL.md`');
    expect(reviewerAgent).toContain('maps its review categories to the `agent-native-architecture` canonical taxonomy');
    expect(researcherAgent).toContain('AI/Agents → `skills/agent-native-architecture/SKILL.md`');
    expect(researcherAgent).toContain('current source checkout path `skills/<skill-name>/SKILL.md`');
    expect(researcherAgent).toContain('curated internal source');
    expect(personaCatalog).toContain('agent-native-architecture canonical taxonomy');
    expect(adjacentAssets).not.toContain('spec-agent-native-architecture');
  });

  test('adjacent taxonomy adapters map every local principle label', () => {
    const auditPlaybook = read(AUDIT_PLAYBOOK_PATH);
    const reviewerAgent = read(REVIEWER_AGENT_PATH);
    const auditSection = sectionBetween(auditPlaybook, '## Audit Lenses', '## Workflow');
    const reviewerSection = sectionBetween(reviewerAgent, '## Core Principles', '## Review Process');

    expect(numberedBoldLabels(auditSection)).toEqual([
      'Action Parity',
      'Tools as Primitives',
      'Context Injection',
      'Shared Workspace',
      'CRUD Completeness',
      'UI Integration',
      'Capability Discovery',
      'Prompt-Native Features',
    ]);

    numberedBoldLabels(auditSection).forEach((label) => {
      expect(auditSection).toMatch(new RegExp(`\\*\\*${escapeRegExp(label)}\\*\\* maps to \\*\\*`));
    });

    expect(numberedBoldLabels(reviewerSection)).toEqual([
      'Action Parity',
      'Context Parity',
      'Shared Workspace',
      'Primitives over Workflows',
      'Dynamic Context Injection',
    ]);

    numberedBoldLabels(reviewerSection).forEach((label) => {
      expect(reviewerSection).toMatch(new RegExp(`\\b${escapeRegExp(label)}\\b[^.\\n]*\\bmap`, 'i'));
    });
  });
});
