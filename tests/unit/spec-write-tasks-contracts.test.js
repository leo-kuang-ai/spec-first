'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CodexAdapter = require('../../src/cli/adapters/codex');
const { syncSkills } = require('../../src/cli/plugin');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'SKILL.md');
const SCHEMA_PATH = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'references', 'task-pack-schema.md');
const GUIDE_PATH = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'references', 'task-quality-guide.md');
const OPENAI_PATH = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'agents', 'openai.yaml');
const SPEC_WORK_PATH = path.join(REPO_ROOT, 'skills', 'spec-work', 'SKILL.md');
const SPEC_WORK_BETA_PATH = path.join(REPO_ROOT, 'skills', 'spec-work-beta', 'SKILL.md');
const PLAN_HANDOFF_PATH = path.join(REPO_ROOT, 'skills', 'spec-plan', 'references', 'plan-handoff.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-write-tasks contracts', () => {
  test('source skill preserves derived-task-pack boundaries and task-ready flow', () => {
    const skill = read(SKILL_PATH);

    expect(skill).toContain('name: spec-write-tasks');
    expect(skill).toContain('optional derived layer between `spec-plan` and `spec-work`');
    expect(skill).toContain('`spec-plan` is always the single source of truth');
    expect(skill).toContain('A task pack is a derived artifact; it must not become a second plan.');
    expect(skill).toContain('Task-Ready Check');
    expect(skill).toContain('`compile`: the plan is clear enough');
    expect(skill).toContain('`skip`: the plan is small');
    expect(skill).toContain('`return-to-plan`: key scope');
    expect(skill).toContain('`draft-only`: a non-executable draft');
    expect(skill).toContain('Compilation Algorithm');
    expect(skill).toContain('not a script state machine');
    expect(skill).toContain('Quality Pass Before Output');
    expect(skill).toContain('Final Decision Envelope');
    expect(skill).toContain('decision: compile | skip | return-to-plan | draft-only | validate-only');
    expect(skill).toContain('semantic_posture');
    expect(skill).toContain('next_action');
    expect(skill).toContain('orientation:');
    expect(skill).toContain('evidence_refs');
    expect(skill).toContain('Source Summary');
    expect(skill).toContain('Traceability Matrix');
    expect(skill).toContain('Orientation Evidence');
    expect(skill).toContain('Task Quality Guide');
    expect(skill).toContain('If deterministic hash tooling is unavailable, report the task pack as unverifiable handoff');
    expect(skill).toContain('A task pack that can be handed to `spec-work` must include `spec_id`');
    expect(skill).toContain('If the source plan is a legacy plan without `spec_id`, do not write an executable task pack');
    expect(skill).toContain('copying `spec_id` from the source plan');
    expect(skill).toContain('A mismatch is a wrong-chain handoff');
    expect(skill).toContain('bounded source orientation');
    expect(skill).toContain('targeted direct repo reads first');
    expect(skill).toContain('optionally use Serena/LSP when available');
    expect(skill).toContain('Serena/LSP provider rule');
    expect(skill).toContain('Do not let LSP references automatically expand task scope');
    expect(skill).toContain('top-level `target_repo` for single-repo work or per-unit `target_repo` for cross-repo work');
    expect(skill).toContain('do not invent child repo targets while deriving tasks');
    expect(skill).toContain('inspect `target_repo` inheritance or per-task `target_repo` values');
    expect(skill).toContain('current deterministic validation does not prove workspace repo scope');
    expect(skill).toContain('Deterministic contract fields validated by `spec-first tasks validate`');
    expect(skill).toContain('LLM/human quality fields that should be present when they reduce execution context');
    expect(skill).toContain('The deterministic validator only proves frontmatter identity/freshness plus the `Task Pack Contract` machine-readable structure');
    expect(skill).not.toContain('spec-first ' + 'crg hook');
    expect(skill).not.toContain('$spec-' + 'graph' + '-bootstrap');
    expect(skill).not.toContain('/spec:' + 'graph' + '-bootstrap');
  });

  test('task pack schema requires executable handoff metadata and quality structures', () => {
    const schema = read(SCHEMA_PATH);

    expect(schema).toContain('spec_id: "YYYY-MM-DD-NNN-<slug>"');
    expect(schema).toContain('source_plan_hash: "sha256:<64-hex>"');
    expect(schema).toContain('Concrete repo-relative POSIX file path to the single source plan');
    expect(schema).toContain('`spec_id` and `source_plan_hash` have separate jobs');
    expect(schema).toContain('canonical source plan body hashing');
    expect(schema).toContain('Task Pack Contract');
    expect(schema).toContain('only machine-readable task-card source for validators');
    expect(schema).not.toContain('"done_signal": "Validator tests pass.",\n      "done_signal": "Validator tests pass.",');
    expect(schema).toContain('Orientation Evidence');
    expect(schema).toContain('provider');
    expect(schema).toContain('`direct-repo-reads`, `serena-lsp`, `mixed`, or `skipped`');
    expect(schema).toContain('evidence_refs');
    expect(schema).toContain('limitations');
    expect(schema).toContain('A task pack whose `spec_id` does not match the source plan is a wrong-chain handoff');
    expect(schema).toContain('If the source plan lacks `spec_id`, do not write an executable task pack');
    expect(schema).toContain('Executable handoff must be `derived`');
    expect(schema).toContain('transient slices are not stable `spec-work` input');
    expect(schema).toContain('do not write an executable handoff');
    expect(schema).toContain('Traceability Matrix');
    expect(schema).toContain('Current deterministic validation only checks frontmatter identity/freshness and the `Task Pack Contract` JSON structure');
    expect(schema).toContain('Executable task cards must include these deterministic fields');
    expect(schema).toContain('Quality Task Fields');
    expect(schema).toContain('MVP required task fields');
    expect(schema).toContain('Wave ids must be strings or numbers.');
    expect(schema).toContain('Non-empty concrete repo-relative POSIX file paths; no globs, directories, `.`, `..`, `...`, or backslash separators');
    expect(schema).toContain('Boolean hint for whether the task can run in parallel');
    expect(schema).toContain('`stop_if`');
    expect(schema).toContain('`target_repo`');
    expect(schema).toContain('| `test_focus` | Primary verification focus |');
    expect(schema).toContain('Granularity Guide');
    expect(schema).toContain('Scripts must not judge task splitting quality');
    expect(schema).toContain('If `spec_id` does not match the current source plan, execution must be rejected');
    expect(schema).not.toContain('`crg`');
  });

  test('quality guide owns quality examples without redefining schema fields', () => {
    const guide = read(GUIDE_PATH);

    expect(guide).toContain('Task Quality Guide');
    expect(guide).toContain('`task-pack-schema.md` remains the source of truth for required fields');
    expect(guide).toContain('The quality bar is not whether every field is filled');
    expect(guide).toContain('Bad Smells');
    expect(guide).toContain('### Good');
    expect(guide).toContain('### Bad');
    expect(guide).toContain('Field Writing Guide');
    expect(guide).toContain('Task Pack Review Checklist');
    expect(guide).toContain('Current deterministic validation treats `context_refs` as auxiliary context, not as a replacement for `source_unit` or `requirement_refs`.');
    expect(guide).toContain('Use non-empty concrete repo-relative POSIX file paths');
    expect(guide).toContain('orientation_evidence');
    expect(guide).toContain('provider, posture, evidence_refs, and limitations');
    expect(guide).toContain('without turning LSP/current code state into source-plan scope');
    expect(guide).not.toContain('CR' + 'G');
  });

  test('spec-work variants validate task packs before creating execution tasks', () => {
    for (const filePath of [SPEC_WORK_PATH, SPEC_WORK_BETA_PATH]) {
      const skill = read(filePath);

      expect(skill).toContain('If the work document is a task pack, validate it before creating execution tasks');
      expect(skill).toContain('read its frontmatter and confirm `type: task-pack`, `generated_by: spec-write-tasks`, `status: derived`, and `mode: derived`');
      expect(skill).toContain('treat that plan as the single source of truth');
      expect(skill).toContain('read `spec_id` from the task pack and source plan');
      expect(skill).toContain('If the task pack lacks `spec_id`, stop as missing identity');
      expect(skill).toContain('reject the task pack as wrong-chain handoff before implementation');
      expect(skill).toContain('missing-spec-id, spec-id-mismatch');
      expect(skill).toContain('`sha256:<64-hex>`');
      expect(skill).toContain('spec-first tasks validate <task-pack-path> --json');
      expect(skill).toContain('Task Pack Contract');
      expect(skill).toContain('if that tooling is unavailable, treat the task pack as unverifiable and stop');
      expect(skill).toContain('non-POSIX repo-relative paths, invalid wave ids, and non-boolean `parallelizable`');
      expect(skill).toContain('do not repair task-pack JSON in the executor');
      expect(skill).toContain('reject draft, transient, missing-source, missing-spec-id, spec-id-mismatch, missing-hash, unavailable-hash-tooling, unverifiable-hash, or hash-mismatch task packs before implementation');
      expect(skill).toContain('do not silently fall back to executing stale task cards');
      expect(skill).toContain("honor each task's `stop_if`");
      expect(skill).toContain('do not create execution tasks until the task-pack validation checks above have passed');
      expect(skill).toContain('optional task-pack suitability check before `before-work --plan`');
      expect(skill).toContain('offer the diversion once only when the plan has strong signals');
      expect(skill).toContain('load the standalone `spec-write-tasks` skill with the plan path');
      expect(skill).toContain('do not prompt again in this work run');
      expect(skill).not.toContain('run `spec-write-tasks <plan-path>`');
    }
  });

  test('openai metadata keeps task compilation optional and host-neutral', () => {
    const metadata = read(OPENAI_PATH);

    expect(metadata).toContain('Compile settled plans into optional derived task packs');
    expect(metadata).toContain('first decide whether task compilation is warranted');
    expect(metadata).toContain('the appropriate spec-work workflow');
    expect(metadata).toContain('allow_implicit_invocation: false');
    expect(metadata).not.toContain('$spec-work');
    expect(metadata).not.toContain('/spec:work');
  });

  test('codex runtime sync preserves task-quality guardrails without stale wording', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-tasks-codex-runtime-'));
    const codex = new CodexAdapter();

    try {
      syncSkills(projectRoot, codex);

      const runtimeSkill = read(path.join(projectRoot, '.agents', 'skills', 'spec-write-tasks', 'SKILL.md'));
      const runtimeMetadata = read(path.join(projectRoot, '.agents', 'skills', 'spec-write-tasks', 'agents', 'openai.yaml'));

      expect(runtimeSkill).toContain('name: write-tasks');
      expect(runtimeSkill).toContain('Task-Ready Check');
      expect(runtimeSkill).toContain('Quality Pass Before Output');
      expect(runtimeSkill).toContain('If deterministic hash tooling is unavailable, report the task pack as unverifiable handoff');
      expect(runtimeSkill).toContain('A mismatch is a wrong-chain handoff');
      expect(runtimeSkill).not.toContain('source_plan_hash: pending-tooling');
      expect(runtimeMetadata).toContain('first decide whether task compilation is warranted');
      expect(runtimeMetadata).toContain('the appropriate spec-work workflow');
      expect(runtimeMetadata).toContain('allow_implicit_invocation: false');
      expect(runtimeMetadata).not.toContain('$spec-work');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('spec-plan handoff only offers task-pack execution for executable task packs', () => {
    const handoff = read(PLAN_HANDOFF_PATH);

    expect(handoff).toContain('Load the standalone `spec-write-tasks` skill with the plan path');
    expect(handoff).toContain('If it writes an executable task pack with matching `spec_id` and verifiable `source_plan_hash`');
    expect(handoff).toContain('offer to proceed with the current host\'s work entrypoint');
    expect(handoff).toContain('using the task-pack path');
    expect(handoff).toContain('If it returns `skip`, `return-to-plan`, `draft-only`, unverifiable identity/hash, or a non-executable task pack');
    expect(handoff).toContain('do not offer task-pack execution');
    expect(handoff).not.toContain('/spec:work <task-pack-path>` on Claude Code');
    expect(handoff).not.toContain('$spec-work <task-pack-path>` on Codex');
  });
});
