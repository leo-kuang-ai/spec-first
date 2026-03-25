# Findings & Decisions — FSREQ-19700101-LEGACY-BASELINE

## Plan Summary

| Field | Value |
|------|-------|
| Target Stage | 04_implement |
| Next Action | 补齐宿主安装态、命令注册与外部边界证据 |
| Blockers | none |
| Risk Level | LOW |
| Suggested Command | `/spec-first:code` |

## Decision Log

| Time | Stage | Decision | Rationale |
|------|-------|----------|-----------|

## Current Capability Map

| 层次 | 主要入口 | 证据路径 | 结论 |
|------|----------|----------|------|
| CLI / Router | `src/cli/index.ts`, `src/cli/router.ts`, `src/cli/commands/*` | `src/cli/index.ts`, `src/cli/router.ts` | 命令入口、路由与子命令清晰可见 |
| Core / Process | `src/core/process-engine/*` | `src/core/process-engine/feature.ts`, `transition.ts`, `stage-machine.ts` | 阶段流转与特征状态是主运行态骨架 |
| Skill Runtime | `src/core/skill-runtime/*` | `src/core/skill-runtime/dispatcher.ts`, `prompt-assembler.ts`, `skill-checklist.ts` | 技能分发、上下文拼装和检查链路可定位 |
| Batch Executor | `src/core/batch-executor/*` | `src/core/batch-executor/index.ts`, `context-packer.ts`, `report-generator.ts` | 批量执行与 checkpoint/report 链路已落地 |
| Host / Integration | `src/shared/*`, `src/core/host-adapters/*`, `src/postinstall.ts` | `src/shared/host-bootstrap.ts`, `src/core/host-adapters/codex-adapter.ts`, `src/postinstall.ts` | 宿主安装态、适配器和同步链路已存在 |
| Template / Docs | `src/core/template/*`, `templates/*`, `skills/*` | `templates/init/stage-state.json.hbs`, `templates/docs/document-links.yaml.hbs`, `skills/README.md` | 模板、文档关联和 skill 资产已扁平化可读 |

## Host & Boundary Snapshot

| 维度 | 证据 | 结论 |
|------|------|------|
| `~/.spec-first/skills` | `/Users/kuang/.spec-first/skills/*` 扁平目录已存在 | 宿主 skills 安装态已扁平化，符合当前基线假设 |
| `~/.codex/skills` | `/Users/kuang/.codex/skills/*` 扁平目录已存在 | Codex 宿主 skills 安装态正常 |
| 宿主健康 | `spec-first doctor` 返回 0 error / 2 warning | 宿主基线可用，Gemini/Cursor 仍为实验性/部分接入 |
| 外部边界 | `spec.md` / `design.md` 已将仓库可见外部集成与部署边界纳入范围；`rg` 仅找到 docs/legacy 中的部署示例 | 当前仓库没有真实生产部署证据，外部边界应按“可见证据 + 补充信息”记录 |

## Execution Evidence

| Time | Type | Evidence | Result |
|------|------|----------|--------|
| 2026-03-25T00:30:00.000Z | spec | specs/FSREQ-19700101-LEGACY-BASELINE/spec.md | 已生成基线 spec 草案 |
| 2026-03-25T00:30:00.000Z | prd | specs/FSREQ-19700101-LEGACY-BASELINE/prd.md | 已将 PRD 从占位模板具体化 |
| 2026-03-25T00:45:00.000Z | review | specs/FSREQ-19700101-LEGACY-BASELINE/checklists/spec-review.md | spec-review 完成，C10=100% |
| 2026-03-25T00:55:00.000Z | scope | specs/FSREQ-19700101-LEGACY-BASELINE/spec.md | 宿主安装态与外部边界正式纳入基线范围 |
| 2026-03-25T01:05:00.000Z | design | specs/FSREQ-19700101-LEGACY-BASELINE/design.md | 已生成基线 design 草案 |
| 2026-03-25T01:20:00.000Z | task | specs/FSREQ-19700101-LEGACY-BASELINE/task_plan.md | 已将任务计划收口为 4 个可执行任务，并补齐步骤/验收标准 |
| 2026-03-25T01:25:00.000Z | task | specs/FSREQ-19700101-LEGACY-BASELINE/task_plan.md | 现有能力盘点任务已切入 in_progress |
| 2026-03-25T01:30:00.000Z | inventory | src/, skills/, templates/ | 已确认当前仓库包含 CLI/Core/Skill/Template/Host/Batch/Metric/AI-Orchestrator 等核心层次，且 skills/ 为扁平结构 |
| 2026-03-25T01:35:00.000Z | task | specs/FSREQ-19700101-LEGACY-BASELINE/task_plan.md | 现有能力盘点任务已完成，宿主安装态与外部边界任务已切入 in_progress |
| 2026-03-25T01:40:00.000Z | task | specs/FSREQ-19700101-LEGACY-BASELINE/task_plan.md | 宿主安装态与外部边界任务已完成，基线文档包与追溯链任务已切入 in_progress |
| 2026-03-25T01:45:00.000Z | task | specs/FSREQ-19700101-LEGACY-BASELINE/task_plan.md / specs/FSREQ-19700101-LEGACY-BASELINE/document-links.yaml | 基线文档包已收口，document-links.yaml 已纳入 findings.md 并通过本地结构校验 |
| 2026-03-25T01:50:00.000Z | task | specs/FSREQ-19700101-LEGACY-BASELINE/task_plan.md | 设计一致性复核已完成，任务计划全部收口为 done |
| 2026-03-24T23:37:24Z | verify | specs/FSREQ-19700101-LEGACY-BASELINE/verify.md | 已生成 verify 报告，Gate 状态为 PASS_WITH_WAIVER |
| 2026-03-24T23:37:24Z | wrap_up | specs/FSREQ-19700101-LEGACY-BASELINE/wrap_up.md / specs/FSREQ-19700101-LEGACY-BASELINE/retro.md | 已补齐收尾与归档产物，准备进入 release handoff |
| 2026-03-24T23:37:24Z | release | specs/FSREQ-19700101-LEGACY-BASELINE/reports/smoke-test-report.md / specs/FSREQ-19700101-LEGACY-BASELINE/reports/release-note.md | 已补齐发布产物，可收尾到 release |

## Risks & Blockers

- runtime 真源仍缺失，当前盘点只能基于仓库代码与技能资产
- docs 输出仍缺失，后续需要靠任务计划继续补齐可追溯证据链

## Next Steps

1. 如需最终归档，推进 release 收口并保留当前 release note
2. 如需补工具链，再单独处理 gate/docs links 子命令缺口

## Process Review

| Severity | Issue | Evidence | Suggested Fix |
|----------|-------|----------|---------------|
| MUST FIX | `06_wrap_up` / `07_release` 的 `completedAt` 早于 `startedAt`，时间线不可审计 | `specs/FSREQ-19700101-LEGACY-BASELINE/stage-state.json` | 用真实完成时间重写运行态历史，避免逆序时间戳 |
| SHOULD FIX | `archive` 相关产物命名存在双轨：`wrap_up.md`、`retro.md` 同时存在且来源不一致 | `skills/10-archive/SKILL.md`、`src/core/process-engine/layer-merger.ts`、`src/core/skill-runtime/skill-checklist.ts` | 统一阶段正式产物命名，并同步技能检查与运行态契约 |
| SHOULD FIX | `templates/docs/document-links.yaml.hbs` 默认未纳入 `findings.md`，而当前基线包已手工补入 | `templates/docs/document-links.yaml.hbs`、`specs/FSREQ-19700101-LEGACY-BASELINE/document-links.yaml` | 更新默认模板，使未来特征自动继承当前基线闭环 |
| SHOULD FIX | 验证阶段依赖 `PASS_WITH_WAIVER` 绕过缺失的 `gate/docs links` 命令，工具链闭环未完整 | `specs/FSREQ-19700101-LEGACY-BASELINE/verify.md` | 补齐官方 CLI 子命令，或在技能文档中明确替代验证路径为正式支持项 |
