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
    expect(skill).toContain('Prefer CRG evidence when graph state is ready');
    expect(skill).toContain('Serena/LSP may be introduced as a Phase 2 orientation provider');
    expect(skill).toContain('Phase 2 provider rule');
    // T003: draft-only frontmatter cross-reference (§3.1 fix)
    expect(skill).toContain('status: "draft"');
    expect(skill).toContain('mode: "transient"');
    expect(skill).toContain('task_pack_validity: draft');
    // T004: wave serialization definition (§3.3 fix)
    expect(skill).toContain('wave + 1');
    // T005: semantic_posture definition table (§3.7 fix)
    expect(skill).toContain('generated-this-run');
    expect(skill).toContain('reviewed-existing');
    expect(skill).toContain('unchecked-existing');
    // T002: stop_if routing routing sentence (§3.5 fix)
    expect(skill).toContain('rerun `spec-write-tasks`');
  });

  test('task pack schema requires executable handoff metadata and quality structures', () => {
    const schema = read(SCHEMA_PATH);

    expect(schema).toContain('spec_id: "YYYY-MM-DD-NNN-<slug>"');
    expect(schema).toContain('source_plan_hash: "sha256:<64-hex>"');
    expect(schema).toContain('`spec_id` and `source_plan_hash` have separate jobs');
    expect(schema).toContain('canonical source plan body hashing');
    expect(schema).toContain('Task Pack Contract');
    expect(schema).toContain('only machine-readable task-card source for validators');
    expect(schema).toContain('Orientation Evidence');
    expect(schema).toContain('provider');
    expect(schema).toContain('evidence_refs');
    expect(schema).toContain('limitations');
    expect(schema).toContain('A task pack whose `spec_id` does not match the source plan is a wrong-chain handoff');
    expect(schema).toContain('If the source plan lacks `spec_id`, do not write an executable task pack');
    expect(schema).toContain('Executable handoff must be `derived`');
    expect(schema).toContain('transient slices are not stable `spec-work` input');
    expect(schema).toContain('do not write an executable handoff');
    expect(schema).toContain('Traceability Matrix');
    expect(schema).toContain('Every task card must include these fields');
    expect(schema).toContain('MVP required task fields');
    expect(schema).toContain('`stop_if`');
    expect(schema).toContain('Optional Task Fields');
    expect(schema).toContain('| `test_focus` | Primary verification focus |');
    expect(schema).toContain('Granularity Guide');
    expect(schema).toContain('Scripts must not judge task splitting quality');
    expect(schema).toContain('If `spec_id` does not match the current source plan, execution must be rejected');
    // T001: orientation_evidence in Optional Task Fields (§3.2 fix)
    expect(schema).toContain('orientation_evidence');
    expect(schema).toContain('Optional task-level record');
    // T004: wave serialization definition (§3.3 fix)
    expect(schema).toContain('wave + 1');
    // T005: task_id consistency rule (§3.6 fix)
    expect(schema).toContain('JSON block is authoritative');
    expect(schema).toContain('two sets are equal');
    // T005: Regeneration Rules tasks hash hint (§3.4 fix)
    expect(schema).toContain('spec-first tasks hash');
    // T005: Schema Version and Migration section (§4.2 fix)
    expect(schema).toContain('Schema Version and Migration');
    expect(schema).toContain('task-pack/v1');
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
    expect(guide).toContain('orientation_evidence');
    expect(guide).toContain('provider, posture, evidence_refs, and limitations');
    expect(guide).toContain('without turning CRG/LSP/current code state into source-plan scope');
    // T001: orientation_evidence labelled as optional task field (§3.2 fix)
    expect(guide).toContain('Optional task field');
    // T002: stop_if routing classification table (§3.5 fix)
    expect(guide).toContain('Plan boundary unclear');
    expect(guide).toContain('Recommended destination');
    expect(guide).toContain('Rerun `spec-write-tasks`');
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
      expect(skill).toContain('reject draft, transient, missing-source, missing-spec-id, spec-id-mismatch, missing-hash, unavailable-hash-tooling, unverifiable-hash, or hash-mismatch task packs before implementation');
      expect(skill).toContain('do not silently fall back to executing stale task cards');
      expect(skill).toContain("honor each task's `stop_if`");
      expect(skill).toContain('do not create execution tasks until the task-pack validation checks above have passed');
      expect(skill).toContain('optional task-pack suitability check before `before-work --plan`');
      expect(skill).toContain('offer the diversion once only when the plan has strong signals');
      expect(skill).toContain('do not prompt again in this work run');
    }
  });

  test('openai metadata keeps task compilation optional and host-neutral', () => {
    const metadata = read(OPENAI_PATH);

    expect(metadata).toContain('Compile settled plans into optional derived task packs');
    expect(metadata).toContain('first decide whether task compilation is warranted');
    expect(metadata).toContain('the appropriate spec-work workflow');
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
      expect(runtimeMetadata).not.toContain('$spec-work');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('spec-plan handoff only offers task-pack execution for executable task packs', () => {
    const handoff = read(PLAN_HANDOFF_PATH);

    expect(handoff).toContain('Load the standalone `spec-write-tasks` skill with the plan path');
    expect(handoff).toContain('If it writes an executable task pack with matching `spec_id` and verifiable `source_plan_hash`');
    expect(handoff).toContain('offer to proceed to `/spec:work <task-pack-path>`');
    expect(handoff).toContain('If it returns `skip`, `return-to-plan`, `draft-only`, unverifiable identity/hash, or a non-executable task pack');
    expect(handoff).toContain('do not offer task-pack execution');
  });
});
