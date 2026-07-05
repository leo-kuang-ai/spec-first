---
title: fix: 逐项修复 code-review 11 个残留问题
date: 2026-05-05
status: completed
type: fix
spec_id: 2026-05-05-004-code-review-findings
target_repo: spec-first
origin: spec-code-review finding set on branch leo-2026-05-05-update-self
priority: P1
scope: review-findings-remediation
---

# fix: 逐项修复 code-review 11 个残留问题

## Overview

本计划承接当前分支 `spec-code-review` 复核出的 11 个问题，目标是在不手改 generated runtime、不新增无必要 agent、不引入 auto-rewrite system 的前提下，逐项修复 source truth、脚本建议、安全扫描、Codex runtime projection、self-reflection contract 覆盖和用户入口文档漂移。

本计划只定义修复方案和验证门禁；真正修改代码、文档、测试和 staging 由后续 `spec-work` 或等价执行阶段完成。

## Success Criteria

- 11 个 finding 均有明确修复动作、文件范围、验证命令和完成证据。
- 每完成一个 finding 修复，追加一条记录到 `docs/2026-05-05-skill-agent-audit/fix-log.md`。
- 每个 source-changing patch 同步 `CHANGELOG.md`，不把 changelog 当成逐项修复日志。
- 不直接修改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors。
- 脚本只做 deterministic detection / suggestion / validation，不做语义决策。
- Codex 与 Claude 两端入口文案保持各自 host 语义，不再出现 `spec-*`、`spec-*` 或 `--claude|--codex` 错误投影。
- 修复后重新运行 targeted tests、`npm run typecheck`、`git diff --check`，并用 `spec-code-review` 或等价 report-only review 复核残留风险。

## Non-Goals

- 不新增 `spec-evolve`。
- 不新增 agent profile。
- 不新增 central state machine 或 auto-rewrite system。
- 不让 scripts 判断 capability gap、CUD priority、review 结论或文档语义质量。
- 不把 untracked runtime mirror 或 host-local runtime 状态提交为 source truth。
- 不扩大到当前 11 个 finding 之外的历史文档整理；新增发现只记录为 follow-up，除非阻塞当前修复。

## Source And Runtime Boundary

Source-of-truth 修复范围：

- `skills/`
- `src/cli/`
- `tests/`
- `docs/`
- `CHANGELOG.md`

Generated runtime 范围：

- `.claude/`
- `.codex/`
- `.agents/skills/`

Runtime 目录只能通过 `spec-first init --claude|--codex` 从 source 重新生成。若需要验证 Codex runtime rendering，优先使用 adapter/unit tests 或临时 fixture project，不手改当前 runtime mirror。

## Requirements Trace

| ID | Finding | Severity | Planned outcome |
|---|---|---:|---|
| R1 | ECC 替换文档未纳入 git | P1 | 保留旧文件删除意图时，确保替代 ECC 文档全部进入 tracked source；否则恢复旧文件并清理 untracked duplicates。 |
| R2 | PR 回复命令对不可信文本做 shell 插值 | P1 | 改为 stdin / temp file / `--body-file` 安全写法，并补 contract tests。 |
| R3 | Linux/WSL node/npm/npx 建议绕过平台包管理器 | P2 | node/npm/npx 复用 package-manager suggestion helper，installer 仅作无包管理器 fallback。 |
| R4 | pacman 建议使用 partial-upgrade 风险命令 | P2 | 改为 safe full-sync / needed install guidance，并同步 tests。 |
| R5 | scanner 漏 PowerShell remote script pipe | P2 | 扩展 `REMOTE_SCRIPT_PIPE` 检测 `irm/iwr/Invoke-WebRequest | iex/Invoke-Expression`。 |
| R6 | `.env` secret pattern 边界过窄 | P2 | 覆盖 Windows path、`--env-file=.env` 等形式，同时继续避免 `process.env` 误报。 |
| R7 | Codex Task fallback 漏 `unsafe` | P2 | adapter 输出与 source skills 的 `unavailable, explicitly disabled, or unsafe` 对齐。 |
| R8 | Codex adapter 全局 `--claude` 改写破坏 host-comparative prose | P2 | 将 host option rewriting 收窄到明确 Codex runtime examples，host-comparative prose 保留双宿主表达。 |
| R9 | self-reflection workflow contract 没有 test anchor | P2 | 新增最小 contract test 锁定 report set、frontmatter、provider freshness 和 CUD 边界。 |
| R10 | self-reflection roadmap 已完成/待办状态矛盾 | P2 | 将已落地 handoff 与剩余 future work 拆开，避免下一轮重复执行。 |
| R11 | 需求拆分文档暴露不存在或 host 错误入口 | P2 | 改为双宿主入口和 standalone/future proposal 口径，不把 `spec-write-tasks` 或 `spec-requirements` 写成已存在 slash command。 |

## Execution Guardrails

1. 每个 finding 修复前，先确认当前 file content，避免覆盖用户或其他 agent 的并行改动。
2. 每个 finding 修复后，立即追加 `docs/2026-05-05-skill-agent-audit/fix-log.md`，记录：
   - finding id
   - changed files
   - decision
   - validation run or validation deferred reason
   - source/runtime boundary note
3. 每个 source-changing batch 更新 `CHANGELOG.md`。如果多个 finding 在同一个 patch 中合并修复，changelog 可合并描述，但 fix-log 必须逐项。
4. 不执行 `git reset --hard`、`git checkout --` 或删除 untracked files，除非用户明确要求。
5. 不手改 runtime mirrors。需要 runtime refresh 时，仅在 source 修复后运行 `spec-first init --codex` / `spec-first init --claude`，并把 runtime drift 作为本地生成结果处理。

## Per-Finding Fix Plan

### F1. ECC replacement docs are untracked

Problem:

- Tracked diff deletes `docs/02-架构设计/ECC集成/ECC 专家能力整合技术方案.md`.
- Replacement ECC docs remain untracked under `docs/02-架构设计/ECC集成/`.
- Current commit would remove the old document without adding the new source truth.

Decision:

- Treat the no-space filename migration and new ECC baseline docs as intended source changes, unless execution-time inspection finds they are drafts.
- Do not restore the old spaced filename if references already point to no-space replacement.

Files:

- `docs/02-架构设计/ECC集成/ECC专家能力整合技术方案.md`
- `docs/02-架构设计/ECC集成/ECCAgent重叠治理V1技术方案.md`
- `docs/02-架构设计/ECC集成/ECC子代理清单.md`
- `docs/02-架构设计/ECC集成/ECC技能清单.md`
- `docs/02-架构设计/ECC集成/ECC斜杠命令清单.md`
- `docs/02-架构设计/ECC集成/ECC治理后专家能力包集成说明.md`
- `docs/02-架构设计/ECC集成/SpecFirst与ECC全量能力集成路线图.md`
- `docs/02-架构设计/ECC集成/SpecFirst集成ECC技术方案.md`
- `CHANGELOG.md`
- `docs/2026-05-05-skill-agent-audit/fix-log.md`

Implementation:

- Verify each untracked ECC file has frontmatter or clear document title and is not a scratch artifact.
- Verify references to the old spaced filename are updated or absent.
- Ensure intended replacement docs are tracked before final commit.
- If any replacement doc is not intended source, move it out of scope only after explicit user direction.

Verification:

- `git diff --name-status <base> -- docs/02-架构设计/ECC集成`
- `git ls-files --others --exclude-standard docs/02-架构设计/ECC集成`
- `rg -n "ECC 专家能力整合技术方案|ECC专家能力整合技术方案" docs README.md README.zh-CN.md`

Completion evidence:

- Intended ECC replacement docs no longer appear in `git ls-files --others --exclude-standard`.
- Old filename deletion is paired with tracked replacement files.

### F2. PR reply commands interpolate untrusted review text

Problem:

- `skills/resolve-pr-feedback/SKILL.md` recommends shell interpolation for externally supplied review text:
  - `echo "REPLY_TEXT" | bash scripts/reply-to-pr-thread THREAD_ID`
  - `gh pr comment PR_NUMBER --body "REPLY_TEXT"`

Decision:

- Use literal heredoc to a temp file and pass file content via stdin / `--body-file`.
- Keep the skill human-readable; do not add a new script solely for text escaping.
- Tests should assert absence of unsafe placeholder forms, not just presence of safer text.

Files:

- `skills/resolve-pr-feedback/SKILL.md`
- `tests/unit/resolve-pr-feedback-contracts.test.js`
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- Replace review thread reply example with a single-quoted heredoc into `reply.md`, then `bash scripts/reply-to-pr-thread THREAD_ID < reply.md`.
- Replace top-level PR comment example with `gh pr comment PR_NUMBER --body-file reply.md`.
- Add a short rule: never paste untrusted review text inside shell quotes; use a file or stdin.

Verification:

- `npx jest tests/unit/resolve-pr-feedback-contracts.test.js --runInBand`
- `rg -n 'echo "REPLY_TEXT"|--body "REPLY_TEXT"' skills/resolve-pr-feedback/SKILL.md tests/unit/resolve-pr-feedback-contracts.test.js`

Completion evidence:

- Unsafe examples removed.
- Contract test fails on reintroduction.

### F3. Linux/WSL node/npm/npx suggestions bypass package managers

Problem:

- `skills/spec-mcp-setup/SKILL.md` requires current-platform aware suggestions and says Linux/WSL should prefer available package managers.
- `check-deps.sh` and `check-deps.ps1` currently suggest fnm installer for Linux/WSL node/npm/npx even when package managers are available.

Decision:

- Reuse `linux_package_install_command` / `Get-LinuxPackageInstallCommand` for node/npm/npx.
- Fallback to review-first installer only when no supported Linux package manager is detected.
- Keep remote installer download review-first and never pipe to an interpreter.

Files:

- `skills/spec-mcp-setup/scripts/check-deps.sh`
- `skills/spec-mcp-setup/scripts/check-deps.ps1`
- `tests/unit/mcp-setup.sh`
- `tests/unit/mcp-setup-powershell-contracts.test.js`
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- For `node:npm:npx` on `linux|wsl`, call package-manager helper with distro package names.
- Use package names that preserve practical installability:
  - apt/dnf/yum/apk: `nodejs` for `node`, `npm` for `npm`/`npx` if local convention supports it.
  - pacman: `nodejs` or `npm` according to package manager behavior chosen in tests.
- Retain fnm review-first fallback only when helper returns empty.
- Mirror behavior in PowerShell script using PowerShell-compatible output.

Verification:

- `bash tests/unit/mcp-setup.sh`
- `npx jest tests/unit/mcp-setup-powershell-contracts.test.js --runInBand`
- `bash -n skills/spec-mcp-setup/scripts/check-deps.sh`

Completion evidence:

- Linux/WSL fixture with a package manager returns package-manager command for node/npm/npx.
- Installer fallback remains review-first for no-package-manager fixture.

### F4. pacman suggestion uses unsafe partial-upgrade command

Problem:

- `linux_package_install_command` and PowerShell equivalent return `sudo pacman -Sy --noconfirm`.
- Tests currently lock this unsafe string.

Decision:

- Replace with a command that does not instruct partial upgrade.
- Prefer a conservative user-visible suggestion such as `sudo pacman -Syu --needed <pkg>`; if project chooses to avoid automatic full upgrade in suggested command, print an explicit two-step instruction rather than `-Sy`.

Files:

- `skills/spec-mcp-setup/scripts/check-deps.sh`
- `skills/spec-mcp-setup/scripts/check-deps.ps1`
- `tests/unit/mcp-setup.sh`
- `tests/unit/mcp-setup-powershell-contracts.test.js`
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- Update shell and PowerShell helper output.
- Update tests to reject `pacman -Sy --noconfirm` and assert the selected safe command.
- Keep `--noconfirm` only if the command still performs full sync/upgrade and local policy accepts noninteractive suggestions; otherwise remove it.

Verification:

- `bash tests/unit/mcp-setup.sh`
- `npx jest tests/unit/mcp-setup-powershell-contracts.test.js --runInBand`
- `rg -n "pacman -Sy --noconfirm" skills tests`

Completion evidence:

- No source or tests assert partial-upgrade command.

### F5. Security scanner misses PowerShell remote script pipe

Problem:

- `REMOTE_SCRIPT_PIPE` detects `curl|wget | bash|sh`.
- It does not detect PowerShell forms such as `irm ... | iex` or `Invoke-WebRequest ... | Invoke-Expression`.

Decision:

- Expand scanner patterns for PowerShell pipe-to-expression.
- Keep scanner deterministic; it flags dangerous syntax, not semantic intent.

Files:

- `skills/spec-skill-audit/scripts/lib/security-patterns.js`
- `tests/unit/skill-audit-scripts.test.js`
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- Extend `REMOTE_SCRIPT_PIPE` regex or split it into shell and PowerShell variants with the same reason code.
- Cover common aliases:
  - `irm`
  - `iwr`
  - `Invoke-RestMethod`
  - `Invoke-WebRequest`
  - `iex`
  - `Invoke-Expression`
- Add positive tests for both alias and full-name forms.
- Preserve existing curl/wget coverage.

Verification:

- `node --check skills/spec-skill-audit/scripts/lib/security-patterns.js`
- `npx jest tests/unit/skill-audit-scripts.test.js --runInBand`

Completion evidence:

- PowerShell pipe-to-expression examples produce `REMOTE_SCRIPT_PIPE`.

### F6. `.env` secret pattern misses common path forms

Problem:

- Current `.env` boundary only catches selected Unix-ish forms.
- It misses Windows path and CLI option forms such as `C:\repo\.env` and `--env-file=.env`.

Decision:

- Expand path boundary to include backslash, `=`, and common option delimiters.
- Preserve the current `process.env` non-match.

Files:

- `skills/spec-skill-audit/scripts/lib/security-patterns.js`
- `tests/unit/skill-audit-scripts.test.js`
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- Update `SECRET_READ` regex for `.env` to support:
  - `.env`
  - `.env.local`
  - `./.env`
  - `C:\repo\.env`
  - `--env-file=.env`
- Add explicit negative tests for:
  - `process.env`
  - `dotenvFile` variable names without file access
  - prose words containing `env` without dotfile path

Verification:

- `node --check skills/spec-skill-audit/scripts/lib/security-patterns.js`
- `npx jest tests/unit/skill-audit-scripts.test.js --runInBand`

Completion evidence:

- New positive/negative tests cover path and option boundaries.

### F7. Codex Task conversion fallback omits unsafe condition

Problem:

- Source review skills say fallback applies when dispatch is unavailable, explicitly disabled, or unsafe.
- `src/cli/adapters/codex.js` renders legacy `Task spec-*` shorthand with fallback only for unavailable or explicitly disabled.

Decision:

- Adapter generated text must include unsafe as a first-class fallback condition.
- Tests should assert the exact safer phrase and reject the old phrase when it appears as a complete condition.

Files:

- `src/cli/adapters/codex.js`
- `tests/unit/spec-dispatch-boundary-contracts.test.js`
- `tests/unit/runtime-plan-contracts.test.js`
- possibly `tests/unit/spec-code-review-contracts.test.js`
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- Update the generated fallback text to `unavailable, explicitly disabled, or unsafe`.
- Update tests that currently assert old fallback wording.
- Confirm source skills already use the same phrase; avoid duplicating governance prose across many tests unless needed.

Verification:

- `npx jest tests/unit/spec-dispatch-boundary-contracts.test.js tests/unit/runtime-plan-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/spec-doc-review-contracts.test.js --runInBand`
- `node --check src/cli/adapters/codex.js`

Completion evidence:

- Adapter-rendered Task shorthand includes unsafe fallback.

### F8. Codex adapter rewrites host-comparative `--claude` prose

Problem:

- `rewriteSharedPaths` globally rewrites `--claude` to `--codex`.
- Host-comparative prose can become invalid, e.g. `spec-first init --codex or --codex`.
- `HOST_COMPARATIVE_RUNTIME_SKILLS` currently only includes `spec-update`, so `using-spec-first` host-comparative install notes are still vulnerable.

Decision:

- Stop global option rewriting.
- Replace broad `--claude` rewrite with narrow runtime-path/example rewrites where the source clearly describes a current-host runtime command.
- Add explicit adapter tests for host-comparative prose.

Files:

- `src/cli/adapters/codex.js`
- `src/cli/host-comparative-workflows.js`
- `tests/unit/using-spec-first-contracts.test.js`
- `tests/unit/spec-update-contracts.test.js`
- `tests/unit/runtime-plan-contracts.test.js`
- `tests/unit/init-dry-run.test.js` if init fixture expectations change
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- Remove or replace `.replace(/--claude\b/g, '--codex')`.
- Preserve dual-host phrases in `using-spec-first`, especially `spec-first init --claude` or `spec-first init --codex`.
- Keep Codex runtime examples correct where the command truly targets Codex runtime.
- If host-comparative allowlist remains necessary, include `using-spec-first` and any other skill with explicit dual-host prose; otherwise make the transformation context-driven enough that the allowlist is not needed.
- Add a direct adapter unit case:
  - input: `Repair with spec-first init --claude or spec-first init --codex`
  - Codex output must preserve both hosts.
  - input: a Claude-only runtime path under `.claude/commands/spec/*.md` should still rewrite to `.agents/skills/spec-*/SKILL.md` where appropriate.

Verification:

- `node --check src/cli/adapters/codex.js`
- `npx jest tests/unit/using-spec-first-contracts.test.js tests/unit/spec-update-contracts.test.js tests/unit/runtime-plan-contracts.test.js tests/unit/init-dry-run.test.js --runInBand`

Completion evidence:

- No adapter-rendered `--codex or --codex`.
- Host-comparative prose remains dual-host.

### F9. Self-reflection contract lacks tests

Problem:

- `docs/contracts/workflows/self-reflection-capability-upgrade.md` is a new source contract.
- No tests currently anchor its required report set, frontmatter, provider freshness vocabulary, or CUD boundary.

Decision:

- Add a focused contract test rather than a broad schema validator.
- Test source text invariants; do not build a semantic validator or auto-rewrite system.

Files:

- `tests/unit/self-reflection-contracts.test.js` or an existing docs contract suite if one clearly fits
- `docs/contracts/workflows/self-reflection-capability-upgrade.md`
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- Assert required report set contains:
  - `00-summary.md`
  - `01-composition-baseline.md`
  - `02-capability-gaps.md`
  - `03-industry-github-best-practices.md`
  - `04-capability-upgrade-decisions.md`
  - `05-prioritized-roadmap.md`
  - `06-next-self-reflection-input.md`
  - `07-continuous-iteration-loop.md`
- Assert frontmatter keys are documented.
- Assert provider freshness vocabulary includes `current`, `stale`, `partial`, `definitions-only`, `unavailable`, `not-used`.
- Assert contract says structural checks must not decide semantic quality or upgrade priority.
- Assert no `spec-evolve` or new agent is required by the contract.

Verification:

- `npx jest tests/unit/self-reflection-contracts.test.js --runInBand`
- Include the new test in any relevant broader suite only if local test organization requires it.

Completion evidence:

- Future contract drift breaks a narrow unit test.

### F10. Self-reflection roadmap contradicts landed vs pending work

Problem:

- `docs/2026-05-05-self-reflection-upgrade/05-prioritized-roadmap.md` says P0/P1 follow-up created plan/contract/review/compound artifacts.
- The same file still lists the same P0/P1 work as pending roadmap items.

Decision:

- Reframe P0/P1 as completed Cycle 0 follow-up when the artifacts exist.
- Move remaining future ideas into a separate `Remaining / Future` section.
- Keep the document advisory; do not convert roadmap into execution status state machine.

Files:

- `docs/2026-05-05-self-reflection-upgrade/05-prioritized-roadmap.md`
- optionally `docs/2026-05-05-self-reflection-upgrade/06-next-self-reflection-input.md` if next-cycle input references the old pending state
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- Rename `## P0` / `## P1` sections to `## Landed Follow-up` or mark each item as `completed by`.
- Preserve CUD traceability without implying duplicate next work.
- Keep P2 future ideas as explicitly future and optional.

Verification:

- `rg -n "Follow-up Handoff Status|## P0|## P1|completed|pending|CUD-001|CUD-005" docs/2026-05-05-self-reflection-upgrade/05-prioritized-roadmap.md`
- `npx jest tests/unit/self-reflection-contracts.test.js --runInBand` if the new tests read roadmap artifacts.

Completion evidence:

- Roadmap no longer presents completed P0/P1 as unstarted work.

### F11. Requirements split doc uses invalid entrypoints

Problem:

- `docs/02-架构设计/需求拆分/大需求拆分.md` shows a Claude-only `spec-*` main chain inside a dual-host project.
- It lists `spec-write-tasks`, but `spec-write-tasks` is standalone skill, not a command-backed workflow.
- It lists future `spec-requirements ...` commands that are not implemented.

Decision:

- Convert examples to dual-host-aware language:
  - Claude workflow entrypoints use `spec-*`.
  - Codex workflow entrypoints use `spec-*`.
  - `spec-write-tasks` remains standalone.
- Mark `spec-requirements` as future proposal / maintenance skill concept, not available slash command.

Files:

- `docs/02-架构设计/需求拆分/大需求拆分.md`
- optional tests if existing entrypoint lint covers docs; otherwise add a narrow docs contract test only if the pattern is likely to regress
- `docs/2026-05-05-skill-agent-audit/fix-log.md`
- `CHANGELOG.md`

Implementation:

- Replace the main chain example with:
  - `spec-brainstorm` / `spec-brainstorm`
  - `spec-plan` / `spec-plan`
  - optional standalone `spec-write-tasks`
  - `spec-work` / `spec-work`
  - `spec-code-review` / `spec-code-review`
  - `spec-compound` / `spec-compound`
- Rewrite `spec-requirements` command semantics section as proposed capability API, not current public command.
- Add wording that no `spec-requirements` or `spec-requirements` entrypoint exists today.

Verification:

- `rg -n "spec-write-tasks|\\spec-write-tasks|spec-requirements|\\spec-requirements" docs/02-架构设计/需求拆分/大需求拆分.md`
- `npm run lint:skill-entrypoints`
- `npx jest tests/unit/spec-work-contracts.test.js tests/unit/spec-work-beta-contracts.test.js tests/unit/using-spec-first-contracts.test.js --runInBand`

Completion evidence:

- User-facing doc no longer advertises invalid workflow commands.

## Implementation Sequence

### Wave 0. Hygiene and baseline

- Re-read current content for all files touched by the 11 findings.
- Capture base command evidence:
  - `git status --porcelain`
  - `git diff --name-status <base>`
  - `git diff --name-only <base> -- .claude .codex .agents`
- Confirm `docs/2026-05-05-skill-agent-audit/fix-log.md` exists.

### Wave 1. Commit-shape and shell safety

- Fix F1 ECC tracking.
- Fix F2 PR reply shell safety.
- Append F1/F2 fix-log entries.
- Run focused docs/path and resolve-pr-feedback tests.

Rationale: P1 issues affect whether the PR contains the intended source truth and whether users are guided into unsafe shell commands.

### Wave 2. mcp-setup multi-platform dependency guidance

- Fix F3 package-manager-aware node/npm/npx suggestions.
- Fix F4 pacman partial-upgrade command.
- Append F3/F4 fix-log entries.
- Run shell and PowerShell mcp-setup tests.

Rationale: These two issues share helper functions and tests; fixing separately risks contradictory package-manager behavior.

### Wave 3. skill-audit scanner safety coverage

- Fix F5 PowerShell remote script pipe scanner.
- Fix F6 `.env` boundary scanner.
- Append F5/F6 fix-log entries.
- Run scanner tests.

Rationale: Both changes touch `security-patterns.js`; they should be verified together while preserving negative cases.

### Wave 4. Codex runtime projection and dispatch fallback

- Fix F7 Task fallback unsafe wording.
- Fix F8 host-comparative `--claude` rewriting.
- Append F7/F8 fix-log entries.
- Run adapter and dual-host runtime tests.

Rationale: Both changes affect Codex runtime projection; tests must prove Codex-specific rendering still works without corrupting dual-host prose.

### Wave 5. self-reflection docs contract and roadmap clarity

- Fix F9 test anchor.
- Fix F10 roadmap contradiction.
- Append F9/F10 fix-log entries.
- Run the new self-reflection contract test and any touched docs tests.

Rationale: Test anchor should lock the same source contract that the roadmap now points to as landed follow-up.

### Wave 6. requirements split user guidance

- Fix F11 invalid entrypoint examples.
- Append F11 fix-log entry.
- Run entrypoint lint and related workflow contract tests.

Rationale: This is user-facing documentation and should be checked against public workflow governance.

### Wave 7. Final validation and review

- Run the narrow full bundle:
  - `npm run typecheck`
  - `npx jest tests/unit/resolve-pr-feedback-contracts.test.js tests/unit/mcp-setup-powershell-contracts.test.js tests/unit/skill-audit-scripts.test.js tests/unit/spec-dispatch-boundary-contracts.test.js tests/unit/runtime-plan-contracts.test.js tests/unit/using-spec-first-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/spec-doc-review-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-work-beta-contracts.test.js --runInBand`
  - `bash tests/unit/mcp-setup.sh`
  - `npm run lint:skill-entrypoints`
  - `git diff --check`
- If runtime projection changed, optionally run `spec-first init --codex` in a temp fixture or use existing init tests; do not commit generated mirrors unless project policy explicitly says they are checked-in source slices.
- Run `spec-code-review mode:report-only` or an equivalent final review pass.

## Test Matrix

| Area | Commands |
|---|---|
| Syntax | `npm run typecheck`; `node --check src/cli/adapters/codex.js`; `node --check skills/spec-skill-audit/scripts/lib/security-patterns.js`; `bash -n skills/spec-mcp-setup/scripts/check-deps.sh` |
| PR feedback safety | `npx jest tests/unit/resolve-pr-feedback-contracts.test.js --runInBand` |
| MCP setup | `bash tests/unit/mcp-setup.sh`; `npx jest tests/unit/mcp-setup-powershell-contracts.test.js --runInBand` |
| Skill audit scanner | `npx jest tests/unit/skill-audit-scripts.test.js --runInBand` |
| Codex projection | `npx jest tests/unit/spec-dispatch-boundary-contracts.test.js tests/unit/runtime-plan-contracts.test.js tests/unit/using-spec-first-contracts.test.js tests/unit/spec-update-contracts.test.js tests/unit/init-dry-run.test.js --runInBand` |
| Self-reflection contract | `npx jest tests/unit/self-reflection-contracts.test.js --runInBand` |
| Workflow entrypoints | `npm run lint:skill-entrypoints`; `npx jest tests/unit/spec-work-contracts.test.js tests/unit/spec-work-beta-contracts.test.js tests/unit/using-spec-first-contracts.test.js --runInBand` |
| Whitespace and runtime boundary | `git diff --check`; `git diff --name-only <base> -- .claude .codex .agents` |

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Package-manager suggestions differ by distro and package names | Keep helper deterministic, add fixture coverage for package-manager selection, use installer fallback only when no supported manager is detected. |
| Security regex becomes too broad and creates noisy false positives | Add paired positive and negative tests, especially `process.env` and prose-only env words. |
| Removing global `--claude` rewrite breaks Codex runtime path conversion | Test path conversion and host option prose separately; rewrite paths and host flags through different rules. |
| Docs-only entrypoint cleanup misses other invalid examples | Use `rg` and existing lint where possible; add a narrow test only for newly touched docs if needed. |
| Untracked docs include drafts | Inspect titles/frontmatter and current references; if uncertain, stop for user decision rather than deleting or staging blindly. |

## Review Gate

After implementation, run a final review with findings-first output. The review must check:

- all 11 fix-log entries exist;
- changelog records the source changes;
- no generated runtime mirror was hand-edited;
- P1 findings are closed;
- P2 findings either closed or explicitly deferred with reason;
- tests listed above were executed or have concrete non-execution reasons.

## Compound Handoff

If the final review confirms a reusable lesson, run `spec-compound` for one concise solution note covering:

- safe shell handoff for untrusted review text;
- package-manager-aware setup suggestions;
- host-comparative prose projection boundary.

Do not write compound docs before the fixes pass review; otherwise the learning may encode an unverified solution.
