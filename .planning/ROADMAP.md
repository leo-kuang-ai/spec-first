# Roadmap: spec-first Skill System Architecture Optimization

## Overview

This roadmap transforms the spec-first skill system from its current state into a well-documented, modular, and extensible architecture. The journey proceeds from architecture audit (documenting what exists) through module decoupling (structuring for scale), clear boundaries (ensuring isolation), to quality infrastructure enhancement (optimizing testing and evaluation).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Architecture Audit & Foundation** - Document placeholders, patterns, and architecture decisions
- [ ] **Phase 2: Module Decoupling & Structure** - Extract shared libraries and standardize skill patterns
- [ ] **Phase 3: Clear Boundaries & Isolation** - Ensure skills work independently with explicit contracts
- [ ] **Phase 4: Quality Infrastructure Enhancement** - Optimize testing selection and evaluation tooling

## Phase Details

### Phase 1: Architecture Audit & Foundation
**Goal**: Developers can understand and trust the skill system architecture through comprehensive documentation
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05
**Success Criteria** (what must be TRUE):
  1. All placeholders are documented in a central registry with their input sources and output behavior
  2. gen-skill-docs.ts uses a resolver plugin pattern without special-case conditionals
  3. CI fails if generated SKILL.md files are out of sync with .tmpl sources
  4. SKILL.md files are marked as generated in .gitattributes
  5. Architecture decisions are recorded in ADR documents for future reference
**Plans**: TBD

### Phase 2: Module Decoupling & Structure
**Goal**: Skills share common utilities through a well-organized library structure
**Depends on**: Phase 1
**Requirements**: DECO-01, DECO-02, DECO-03, DECO-04, DECO-05
**Success Criteria** (what must be TRUE):
  1. Shared utilities (context, preamble, output) are extracted to lib/ and imported by skills
  2. All skill descriptions contain explicit trigger phrases for LLM routing
  3. All SKILL.md files are under 800 lines, with large skills using resources/ for details
  4. All file paths use HostPaths interface without hardcoded platform-specific paths
  5. A new skill can be created by copying a template and following documented patterns
**Plans**: TBD

### Phase 3: Clear Boundaries & Isolation
**Goal**: Each skill can run independently without hidden dependencies
**Depends on**: Phase 2
**Requirements**: BOND-01, BOND-02, BOND-03, BOND-04
**Success Criteria** (what must be TRUE):
  1. Each skill runs successfully in isolation without requiring other skills to be present
  2. Skill prerequisites are documented and verified before execution
  3. Skills communicate through explicit file contracts (not global state or implicit coupling)
  4. SkillManifest interface defines skill metadata structure for tooling
**Plans**: TBD

### Phase 4: Quality Infrastructure Enhancement
**Goal**: Testing and evaluation provide fast, accurate feedback on skill quality
**Depends on**: Phase 3
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04
**Success Criteria** (what must be TRUE):
  1. Diff-based test selection runs only tests affected by code changes
  2. LLM judge prompts produce consistent, actionable quality scores
  3. Eval comparison tool shows clear before/after diffs for quality regression detection
  4. Quality metrics dashboard shows skill health at a glance
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Architecture Audit & Foundation | 0/TBD | Not started | - |
| 2. Module Decoupling & Structure | 0/TBD | Not started | - |
| 3. Clear Boundaries & Isolation | 0/TBD | Not started | - |
| 4. Quality Infrastructure Enhancement | 0/TBD | Not started | - |
