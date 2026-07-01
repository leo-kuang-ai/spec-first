'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-brainstorm', 'SKILL.md');
const UNIVERSAL_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'universal-brainstorming.md',
);
const REQUIREMENTS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'requirements-capture.md',
);
const BRAINSTORM_SECTIONS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'brainstorm-sections.md',
);
const MARKDOWN_RENDERING_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'markdown-rendering.md',
);
const HTML_RENDERING_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'html-rendering.md',
);
const VISUAL_COMMUNICATION_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'visual-communication.md',
);
const HANDOFF_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'handoff.md',
);
const SYNTHESIS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'synthesis-summary.md',
);
const INTERACTION_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'interaction-rules.md',
);
const CONTEXT_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'context-and-evidence.md',
);
const DISCOVERY_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'discovery-flow.md',
);
const APPROACH_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'approach-exploration.md',
);
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readBrainstormSurface() {
  return [
    SKILL_PATH,
    INTERACTION_PATH,
    CONTEXT_PATH,
    DISCOVERY_PATH,
    APPROACH_PATH,
  ].map(readFile).join('\n');
}

describe('spec-brainstorm host entrypoint contract', () => {
  test('consumes domain context before questions without fixed ADR directory mandates', () => {
    const text = readBrainstormSurface();

    expect(text).toContain('Domain Language And Decision Ledger');
    expect(text).toContain('consume existing context before asking questions that repo/docs can answer');
    expect(text).toContain('already-loaded project standards and host instructions, `docs/contracts/`, existing brainstorms/plans/solutions');
    expect(text).toContain('Read `AGENTS.md` / `CLAUDE.md` source only under `docs/contracts/context-governance.md`\'s Host Instruction Reuse Policy');
    expect(text).toContain('repo-local glossary or ADR-like artifacts that actually exist');
    expect(text).toContain('If `CONCEPTS.md` exists, treat it as repo-local advisory vocabulary for naming consistency only');
    expect(text).toContain('it is not a PRD, ADR, workflow contract, source-of-truth override, or setup requirement');
    expect(text).toContain('Do not require a fixed `CONTEXT.md`, `CONCEPTS.md`, `docs/adr/`, or glossary directory.');
    expect(text).toContain('If those artifacts are absent, record the gap as advisory context and continue');
    expect(text).toContain('`question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason`');
    expect(text).toContain('`confirmed`, `advisory`, `session-local`, `stale`, or `user`');
    expect(text).toContain('hard to reverse, would be surprising without context, and reflects a real tradeoff');
    expect(text).not.toContain('must use `CONTEXT.md`');
    expect(text).not.toContain('must use `CONCEPTS.md`');
    expect(text).not.toContain('must use `docs/adr/`');
  });

  test('constraint check reuses loaded host instructions before reading instruction source', () => {
    const text = readBrainstormSurface();

    expect(text).toContain('Constraint Check');
    expect(text).toContain('Use already-loaded host/project instructions first');
    expect(text).toContain('Read `AGENTS.md` / `CLAUDE.md` source only when `docs/contracts/context-governance.md`\'s Host Instruction Reuse Policy allows it');
    expect(text).toContain('If a source read is needed, record the reason briefly');
    expect(text).not.toContain('Check project instruction files (`AGENTS.md`');
  });

  test('external-tool context stays lightweight and cannot back-drive requirements', () => {
    const text = readBrainstormSurface();

    expect(text).toContain('External-Tool Context');
    expect(text).toContain('Use only lightweight read-only evidence as session-local pointers');
    expect(text).toContain('Confirm important claims with direct source reads before writing them into requirements');
    expect(text).toContain('Do not route mutation, refresh, broad impact, or maintenance operations through brainstorm by default');
    expect(text).toContain('External-tool evidence must not expand product scope or let implementation details back-drive user-facing requirements.');
  });

  test('optional claim verification degrades without becoming a hard dependency', () => {
    const text = readFile(CONTEXT_PATH);

    expect(text).toContain('Optional Claim Verification Helper');
    expect(text).toContain('checkable source claims that may enter a requirements document');
    expect(text).toContain('`confirmed`');
    expect(text).toContain('`refuted`');
    expect(text).toContain('`unverifiable`');
    expect(text).toContain('`unverified assumption`');
    expect(text).toContain('dispatch is explicitly authorized and available');
    expect(text).toContain('verify inline with targeted reads or use `unverified assumption`');
    expect(text).toContain('Never block brainstorm on helper availability');
    expect(text).toContain('Do not require a dossier, model-tier choice, hidden background dispatch, or provider-specific contract');
  });

  test('shared understanding scope loop resolves material branches before synthesis', () => {
    const interaction = readFile(INTERACTION_PATH);
    const discovery = readFile(DISCOVERY_PATH);
    const synthesis = readFile(SYNTHESIS_PATH);

    expect(interaction).toContain('Shared Understanding Scope Loop');
    expect(interaction).toContain('Use this loop only for material scope decisions that affect WHAT, success, non-goals, trade-offs, or handoff readiness');
    expect(interaction).toContain('Ask the single sharpest next question');
    expect(interaction).toContain('recommended answer and why');
    expect(interaction).toContain('If a branch is answerable from the codebase, read it instead of asking.');
    expect(interaction).toContain('If source or docs can answer the branch, read them instead of asking.');
    expect(interaction).toContain('Resolve parent decisions before children');
    expect(discovery).toContain('internal material-branch check');
    expect(discovery).toContain('Ask only when an unresolved parent branch would force `spec-plan` to invent WHAT');
    expect(discovery).toContain('Technical HOW or implementation-time unknowns can be deferred to planning');
    expect(synthesis).toContain('blocking branch that affects WHAT');
  });

  test('phase 0 splits oversized multi-scope openings before detailed dialogue', () => {
    const discovery = readFile(DISCOVERY_PATH);

    expect(discovery).toContain('Multi-Scope Split Check');
    expect(discovery).toContain('before detailed product probes');
    expect(discovery).toContain('multiple actor journeys');
    expect(discovery).toContain('requirements set too large for one safe `spec-plan` handoff');
    expect(discovery).toContain('not task decomposition');
    expect(discovery).toContain('Name 2-4 candidate sub-scopes by user outcome or scope boundary, not implementation module');
    expect(discovery).toContain('smallest, highest-value slice');
    expect(discovery).toContain('Continue the brainstorm only for the selected slice');
    expect(discovery).toContain('Do not build a roadmap, implementation module split, or plan waves');
  });

  test('brainstorm entry contract routes near-neighbor requests out early', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)[1];

    expect(frontmatter).toContain('Discover WHAT for a selected feature/problem before PRD or planning');
    expect(frontmatter).toContain('behavior, scope, users, success criteria, or handoff context remain unresolved');
    expect(frontmatter).toContain('open-ended ideation');
    expect(frontmatter).toContain('brownfield PRD authoring/refinement/validation');
    expect(frontmatter).toContain('clear HOW planning/task compilation');
    expect(frontmatter).toContain('implementation/debug/review/setup');
    expect(frontmatter).toContain('generated runtime mirror fixes');

    expect(skill).toContain('Use when the user has a selected or user-framed problem, feature, or improvement');
    expect(skill).toContain('Do not use for open-ended idea generation, brownfield PRD authoring/refinement/validation');
    expect(skill).toContain('## Near-Neighbor Exit Cues');
    expect(skill).toContain('idea_generation->ideation');
    expect(skill).toContain('brownfield_prd->PRD');
    expect(skill).toContain('clear_plan_request->plan');
    expect(skill).toContain('direct_cleanup->direct');
    expect(skill).toContain('status: not_applicable | handoff | degraded');
    expect(skill).toContain('recommended_next_action: <current-host entrypoint or direct action>');
    expect(skill).toContain('source_refs: <repo-relative paths when source evidence was read>');
    expect(skill).not.toContain('even if they don\'t explicitly ask to brainstorm');
  });

  test('planning handoffs use current-host entrypoint wording', () => {
    const combined = [
      fs.readFileSync(SKILL_PATH, 'utf8'),
      fs.readFileSync(UNIVERSAL_PATH, 'utf8'),
      fs.readFileSync(REQUIREMENTS_PATH, 'utf8'),
      fs.readFileSync(HANDOFF_PATH, 'utf8'),
      fs.readFileSync(SYNTHESIS_PATH, 'utf8'),
    ].join('\n');

    expect(combined).toContain('current host\'s plan entrypoint');
    expect(combined).toContain('current host\'s brainstorm entrypoint');
    expect(combined).not.toContain('precedes `/spec:plan`');
    expect(combined).not.toContain('hand off to `/spec:plan`');
    expect(combined).not.toContain('`-> /spec:plan`');
    expect(combined).not.toContain('`-> Resume /spec:brainstorm`');
    expect(combined).not.toContain('/spec:plan` on Claude Code');
    expect(combined).not.toContain('$spec-plan` on Codex');
    expect(combined).not.toContain('/spec:brainstorm on Claude Code');
    expect(combined).not.toContain('$spec-brainstorm on Codex');
  });

  test('synthesis checkpoint is required before requirements capture', () => {
    const skill = readFile(SKILL_PATH);
    const synthesis = readFile(SYNTHESIS_PATH);
    const combined = [skill, synthesis].join('\n');

    expect(skill).toContain('Phase 2.5: Synthesis Summary');
    expect(skill).toContain('Read `references/synthesis-summary.md`');
    expect(combined).toContain('announce-mode');
    expect(combined).toContain('do not write the requirements doc in the same turn');
    expect(synthesis).toContain('Two-stage shape: internal draft, then chat-time scoping synthesis');
    expect(synthesis).toContain('Three-Bucket Structure');
    expect(synthesis).toContain('Do not paste this draft verbatim into chat');
    expect(synthesis).toContain('Stage 2: Chat-Time Scoping Synthesis');
    expect(synthesis).toContain('**What we\'re building**');
    expect(synthesis).toContain('**Key trade-offs**');
    expect(synthesis).toContain('**What\'s not in scope**');
    expect(synthesis).toContain('**Call outs**');
    expect(synthesis).toContain('Path A / Path B Gate');
    expect(synthesis).toContain('Path A — no blocking questions fired and tier is Lightweight');
    expect(synthesis).toContain('Path B — any blocking question fired, or tier is Standard / Deep-feature / Deep-product');
    expect(synthesis).toContain('Follow the local `SKILL.md` announce-mode rule');
    expect(synthesis).toContain('do not write the requirements doc in the same turn');
    expect(synthesis).toContain('internal three-bucket draft');
    expect(synthesis).toContain('Compose the internal three-bucket draft');
    expect(synthesis).toContain('Use Path A announce-mode shape only');
    expect(synthesis).toContain('Affirmability test');
    expect(synthesis).toContain('Detail test');
    expect(synthesis).toContain('Read-aloud test');
    expect(synthesis).toContain('Single-sentence test');
    expect(synthesis).toContain('Pre-Flight Re-Review');
    expect(synthesis).toContain('If it looks like a miniature requirements document');
    expect(synthesis).toContain('raise the abstraction level instead of increasing the cap');
    expect(synthesis).toContain('## Worked Example');
    expect(synthesis).toContain('Compressed Stage 2');
    expect(synthesis).toContain('implementation paths, file names, method names, or class names');
    expect(synthesis).toContain('No open scope decisions to weigh in on');
    expect(synthesis).toContain('**Stated**');
    expect(synthesis).toContain('**Inferred**');
    expect(synthesis).toContain('**Out of scope**');
    expect(synthesis).toContain('## Assumptions');
    expect(synthesis).toContain('current-host entrypoint');
    expect(synthesis).not.toContain('STRATEGY.md');
    expect(synthesis).not.toContain('/ce-');
    expect(synthesis).not.toContain('write the requirements doc now');
    expect(synthesis).not.toContain('proceed to Phase 3 doc-write in the same turn');
    expect(skill).not.toContain('emit the Stated / Inferred / Out-of-scope synthesis');
  });

  test('requirements template uses Summary and Assumptions without durable Next Steps', () => {
    const text = fs.readFileSync(REQUIREMENTS_PATH, 'utf8');

    expect(text).toContain('| Summary |');
    expect(text).toContain('## Summary');
    expect(text).toContain('## Summary vs Problem Frame discipline');
    expect(text).toContain('## Assumptions');
    expect(text).toContain('behavioral-conditional requirements');
    expect(text).not.toContain('## Next Steps');
    expect(text).not.toContain('`-> current host');
  });

  test('requirements section and rendering references keep markdown canonical with optional HTML sidecar only', () => {
    const skill = readFile(SKILL_PATH);
    const sections = readFile(BRAINSTORM_SECTIONS_PATH);
    const markdown = readFile(MARKDOWN_RENDERING_PATH);
    const html = readFile(HTML_RENDERING_PATH);

    expect(skill).toContain('`references/brainstorm-sections.md`, `references/requirements-capture.md`, and `references/markdown-rendering.md`');
    expect(skill).toContain('canonical markdown requirements capture');
    expect(skill).toContain('optional sidecar only');
    expect(skill).toContain('do not replace markdown without focused downstream consumer tests');
    expect(sections).toContain('Markdown requirements documents remain canonical');
    expect(sections).toContain('`requirements-capture.md` remains the concrete markdown template and readiness gate');
    expect(sections).toContain('Brainstorm artifacts have no `active` to `completed` status lifecycle.');
    expect(sections).toContain('optional HTML sidecar');
    expect(markdown).toContain('YAML frontmatter appears at the top');
    expect(markdown).toContain('Markdown stays markdown.');
    expect(markdown).toContain('behavioral-conditional requirements covered by acceptance examples');
    expect(html).toContain('optional HTML sidecar');
    expect(html).toContain('not an exclusive output mode');
    expect(html).toContain('write the markdown requirements document first');
    expect(html).toContain('not add or omit load-bearing content');
    for (const text of [sections, markdown, html]) {
      expect(text).not.toContain('.compound-engineering');
      expect(text).not.toMatch(/\bce-[a-z]/);
      expect(text).not.toContain('output mode is exclusive');
    }
  });

  test('requirements prose economy improves handoff without cutting precision', () => {
    const sections = readFile(BRAINSTORM_SECTIONS_PATH);
    const capture = readFile(REQUIREMENTS_PATH);

    expect(sections).toContain('## Prose Economy');
    expect(sections).toContain('One sentence carries one idea');
    expect(sections).toContain('One requirement carries one intent plus at most one necessary qualifier');
    expect(sections).toContain('Move unresolved forks to `Outstanding Questions`');
    expect(sections).toContain('Cut hedges, intensifiers, transcript residue, and process narration');
    expect(sections).toContain('Resolve superseded text in place');
    expect(sections).toContain('Precision is not padding');
    expect(capture).toContain('Prose economy scan');
    expect(capture).toContain('one requirement intent plus necessary qualifier');
    expect(capture).toContain('superseded text resolved in place');
    expect(capture).toContain('Precision is not padding');
  });

  test('chat handoff uses absolute paths while docs stay portable', () => {
    const text = fs.readFileSync(HANDOFF_PATH, 'utf8');

    expect(text).toContain('Use absolute paths for chat-output file references');
    expect(text).toContain('<absolute path to requirements doc>');
    expect(text).toContain('Generated requirements documents themselves must still use repo-relative file references');
  });

  test('requirements readiness gate replaces the flat finalization checklist with six dimensions', () => {
    const text = fs.readFileSync(REQUIREMENTS_PATH, 'utf8');

    expect(text).toContain('## Requirements Readiness Gate');
    expect(text).toContain('**Clarity & Non-ambiguity**');
    expect(text).toContain('**Evidence & Inference provenance**');
    expect(text).toContain('**Traceability & Coverage**');
    expect(text).toContain('**Testability**');
    expect(text).toContain('**Boundary integrity**');
    expect(text).toContain('**Planning-invention & Handoff readiness**');
    // Lightweight pre-scan absorbed from the predecessor preflight self-check.
    expect(text).toContain('Placeholder scan');
    expect(text).toContain('Contradiction scan');
    // The old flat name must be gone, not duplicated alongside the gate.
    expect(text).not.toContain('## Finalization checklist');
  });

  test('gate preserves load-bearing checks so the refactor loses nothing', () => {
    const text = fs.readFileSync(REQUIREMENTS_PATH, 'utf8');

    // Imperative clauses, not just headers — these are the behavior, locked against silent drift.
    expect(text).toContain('Do Success Criteria cover both human outcome');
    expect(text).toContain('infrastructure is absent');
    expect(text).toContain('invent product behavior');
    // Improvement prompts demoted to a named non-blocking subsection, not dropped.
    expect(text).toContain('Beyond pass/fail');
  });

  test('requirements readiness gate blocks only material planning risks', () => {
    const text = fs.readFileSync(REQUIREMENTS_PATH, 'utf8');

    expect(text).toContain('Materiality calibration');
    expect(text).toContain('force `spec-plan` to invent WHAT');
    expect(text).toContain('misunderstand scope/non-goals/success');
    expect(text).toContain('confuse `Stated` vs `Inferred`');
    expect(text).toContain('allow opposite implementations');
    expect(text).toContain('leave a user/product decision unresolved');
    expect(text).toContain('Do not block finalization for style polish');
    expect(text).toContain('technical HOW unknowns that naturally belong in planning');
    expect(text).toContain('would two competent planners produce materially different product outcomes');
  });

  test('gate carries provenance and handoff checks', () => {
    const text = fs.readFileSync(REQUIREMENTS_PATH, 'utf8');

    expect(text).toContain('references/synthesis-summary.md');
    expect(text).toContain('must not be presented as a user-confirmed requirement');
    expect(text).toContain('Is `Resolve Before Planning` empty?');
  });

  test('acceptance examples carry triggered EARS-style guidance', () => {
    const text = fs.readFileSync(REQUIREMENTS_PATH, 'utf8');

    expect(text).toContain('EARS-style phrasing');
    expect(text).toContain('When <trigger>, then <observable result>');
    expect(text).toContain('Always-on behavior');
    expect(text).toContain('Structural / governance rule');
    // Triggered, not mandatory — the gate must not force fixed syntax onto every requirement.
    expect(text).toContain('triggered, not mandatory');
  });

  test('gate excludes decomposition and points at the existing size heuristic', () => {
    const text = fs.readFileSync(REQUIREMENTS_PATH, 'utf8');

    expect(text).toContain('decomposed');
    expect(text).toContain('## Size heuristics');
    expect(text).toContain('the gate flags, it does not decide the split');
  });

  test('constraint check scans docs/solutions without back-driving implementation', () => {
    const text = readBrainstormSurface();

    expect(text).toContain('docs/solutions/');
    expect(text).toContain('prior problem framing and decision rationale');
    expect(text).toContain('must not let implementation details back-drive user-facing requirements');
  });

  test('pressure test scopes evidence/counterfactual gaps to product-discovery, not engineering evolution', () => {
    const text = readFile(DISCOVERY_PATH);

    // Engineering-evolution brainstorms must not be forced through product-validation probes.
    expect(text).toContain('For engineering evolution of an existing product or system');
    expect(text).toContain('this gap is N/A by default');
    expect(text).toContain('Same N/A-by-default rule for engineering-evolution brainstorms');
    // The 1.3 mandatory-probe clause must stay consistent with the 1.2 N/A carve-out.
    expect(text).toContain('For engineering-evolution work, evidence and counterfactual are N/A by default');
  });

  test('phase 4 handoff defaults to planning with review and work guardrails', () => {
    const text = fs.readFileSync(HANDOFF_PATH, 'utf8');

    expect(text).toContain('Terminal action defaults');
    expect(text).toContain('Default to `spec-plan` when the requirements are ready');
    expect(text).toContain('Recommend written-doc review before planning for Standard/Deep requirements');
    expect(text).toContain('prefer `spec-doc-review` when the doc is complex or high-risk');
    expect(text).toContain('`Assumptions`, `Outstanding Questions`, multiple `Key Decisions`, or Deep-product scope boundaries');
    expect(text).toContain('This is a recommendation, not a hard approval gate');
    expect(text).toContain('Offer `spec-work` only when the direct-to-work gate passes');
    expect(text).toContain('Do not recommend `spec-plan` or `spec-work` while planning would still need to invent product intent.');
  });

  test('visual aids can support dialogue without replacing canonical requirements', () => {
    const text = fs.readFileSync(VISUAL_COMMUNICATION_PATH, 'utf8');

    expect(text).toContain('## During Dialogue');
    expect(text).toContain('only when seeing the shape is clearer than reading another paragraph');
    expect(text).toContain('UI layout, screen flow, multi-role relationships, multi-step workflows');
    expect(text).toContain('A/B/C visual differences');
    expect(text).toContain('source/runtime/artifact-chain relationships');
    expect(text).toContain('Ask the user before switching into a visual artifact');
    expect(text).toContain('Default to lightweight Markdown tables, Mermaid, or ASCII');
    expect(text).toContain('browser prototypes, Proof, or HTML sidecars only when the user explicitly opts in');
    expect(text).toContain('Dialogue-time visuals are thinking aids, not canonical requirements');
    expect(text).toContain('Do not let a diagram replace the markdown requirements document');
    expect(text).toContain('introduce implementation architecture');
  });

});
