# spec-prd Pareto 修复执行记录与后续跟进

> 日期：2026-07-01
> 范围：基于 `docs/02-架构设计/2026-06-30-spec-prd真实运行日志复盘与优化建议.md` 的帕累托执行切线。

## 1. 本轮结论

本轮只做 3 个高杠杆事项：

1. **PRD-LOG-005 最小修复**：checker findings 追加可忽略的 `expected_shape` / `remediation_hint`；finalize JSON 透传 compact `checker.findings[]`，不删除旧字段。
2. **PRD-LOG-006 最小修复**：checker/finalize 增加 `source_inputs` / `prd_input` frontmatter 输入诊断；新增 `--inputs-from-frontmatter`，避免手动 CLI 复验因漏传 `--inputs` 误判 hash/stale。
3. **Claude `Update` payload 探针**：新增红acted payload-shape probe，只记录 hook/tool 名、key、路径与字符串长度摘要，不把未证实的 `Update` 加入 managed matcher。

不做全量状态机、不做新视觉资产 schema、不把更多语义 lens 脚本化。

## 2. 本轮纳入的 diff 分组

应纳入本轮的 source/test/doc 变更：

- `skills/spec-prd/scripts/check-prd-artifact.js`
- `skills/spec-prd/scripts/finalize-prd-artifact.js`
- `skills/spec-prd/SKILL.md`
- `skills/spec-prd/references/prd-output-template.md`
- `skills/spec-prd/references/prd-readiness-lens.md`
- `scripts/probe-claude-hook-payload.js`
- `tests/unit/spec-prd-checker-unit.test.js`
- `tests/unit/spec-prd-finalize.test.js`
- `tests/unit/spec-prd-contracts.test.js`
- `tests/unit/claude-hook-payload-probe.test.js`
- `package.json`
- `docs/02-架构设计/2026-06-30-spec-prd真实运行日志复盘与优化建议.md`
- `docs/02-架构设计/2026-07-01-spec-prd-pareto修复执行记录与后续跟进.md`
- `CHANGELOG.md`

当前工作树中以下 dirty diff 不属于本轮，不应混入提交说明或完成证据：

- `.claude/**` generated runtime projection 状态
- `AGENTS.md` / `CLAUDE.md` managed block drift
- `.gitignore`
- `templates/claude/hooks/prd-prewrite-guard`
- `tests/unit/prd-prewrite-guard-hook.test.js`
- `docs/plans/2026-06-15-004-feat-peer-summary-schema-review-work-gate-plan.md`
- `docs/项目审查/2026-06-30-spec-first-战略方向判断-弱模型主攻假设.md`
- `docs/brainstorms/2026-06-30-004-spec-code-review-superpowers60-integration-requirements.md`

这些文件可能来自上一轮 hardening、runtime init 或并行文档工作；本轮只与其共存，不回滚、不声称完成。

## 3. 已完成项

### 3.1 PRD-LOG-005：remediation hints

落地内容：

- `check-prd-artifact.js` 对高频 UX 阻断码追加 `expected_shape` 与 `remediation_hint`。
- 覆盖首批 reason codes：
  - `decision_card_undeclared`
  - `open_oq_without_owner_closure`
  - `owner_decision_trace_required_but_absent`
  - `design_source_coverage_undeclared`
  - `design_sources_unread_undeclared`
  - `design_partial_coverage_unaccepted`
  - `ready_receipt_stale`
  - `input_refs_unavailable`
- `finalize-prd-artifact.js` 在 `checker.findings[]` 里透传 compact hint 记录。

边界：

- 不删除 `checker.finding_count`、`checker.blocking_finding_count`、`checker.reason_codes`。
- Stop hook 人类可读阻断文案还没有消费这些 hints；这是后续项。

### 3.2 PRD-LOG-006：inputs/hash 诊断

落地内容：

- 新增 frontmatter-bounded parser：`extractSourceInputsFromFrontmatterText()`。
- 支持 `source_inputs:` 与 legacy `prd_input:`。
- 支持 `- value` 与 `path: value` 形式。
- 不越过 frontmatter 边界读取正文 bullet。
- checker facts 新增：
  - `source_inputs_present`
  - `source_inputs_field`
  - `frontmatter_source_input_count`
  - `inputs_argument_count`
  - `effective_input_count`
  - `inputs_from_frontmatter_requested`
  - `inputs_from_frontmatter_used_count`
  - `input_scan_status`
  - `receipt_stale_possible_due_to_missing_inputs`
  - `input_scan_hint`
- checker/finalize CLI 新增 `--inputs-from-frontmatter`。
- finalize/verify receipt 使用同一 effective inputs 解析，避免写 receipt 与复验 receipt 的 hash 输入集不一致。

边界：

- `--inputs` 仍优先于 frontmatter；脚本不替用户做语义选择。
- 不改变 Claude Stop hook 自动路径；Stop hook 原本已经读 frontmatter 并传 `--inputs`。
- `--inputs-from-frontmatter` 是手动 CLI / Codex degraded discipline 的便利入口。

### 3.3 Claude `Update` payload 探针

落地内容：

- 新增 `scripts/probe-claude-hook-payload.js`。
- 读取 hook stdin JSON，输出 NDJSON 摘要。
- 摘要只保留：
  - `hook_event_name`
  - `tool_name`
  - top-level keys
  - `tool_input` keys
  - path-like fields
  - string fields 的长度和是否换行
- 不保存 `content`、`old_string`、`new_string` 原文。
- 测试确认 managed PRD matcher 仍是 `Write|Edit|MultiEdit`，未把 `Update` 盲目加入 matcher。

临时观测用法：

```bash
node scripts/probe-claude-hook-payload.js --output .spec-first/diagnostics/claude-hook-payload-probe.ndjson
```

使用方式应是用户自管临时 hook 或 wrapper，把 Claude hook payload pipe 给该脚本。收集到真实 `tool_name=Update` 且 payload 形态可安全重建后，再补 fixture 并扩 matcher。

## 4. 后续跟进项

### 4.1 已在后续轻量轮完成

| 项 | 完成内容 | 验证 |
| --- | --- | --- |
| Stop hook display 消费 `remediation_hint` | Claude `prd-prewrite-guard` 保留 checker report，并在 block stderr 中显示最多 3 条 compact `checker_remediation_hints`。 | `tests/unit/prd-prewrite-guard-hook.test.js` |
| PRD-LOG-007 Design Source Coverage 可复制模板 | `prd-output-template.md` 将 Design Source Coverage 收紧为可复制 machine field block，明确 `- none`、coverage enum、`design_degraded_owner_acceptance_ref` 与 partial/degraded ready 边界。 | `tests/unit/spec-prd-contracts.test.js` |
| PRD-LOG-008a OQ closure vocabulary 收敛 | `SKILL.md` 与模板明确 `closure_disposition` 是关闭理由，`closure_state` 只允许 `open/closed/deferred/blocked`，不把 owner/source disposition 写进 state。 | `tests/unit/spec-prd-contracts.test.js` |

### 4.2 仍保留跟进

| 项 | 建议优先级 | 触发条件 | 下一步 |
| --- | --- | --- | --- |
| PRD-LOG-004 通用 OQ self-close 防护 | P1 gated | 多个样本证明非设计 OQ 自闭合导致 planning 发明 WHAT | 先做 replay matrix / fresh-source eval，再决定 skill prose 或 checker advisory |
| PRD-LOG-008b checker advisory | P2 | vocabulary prose 后仍高频误写 | 只做 advisory finding，不进入 blocking set |
| PRD-LOG-009 视觉资产协议 | P2 | 多个 UI-heavy PRD 证明现有 design inventory 不够表达 viewport/state/export freshness | 先复用 design inventory；必要时再设计独立协议 |
| `Update` matcher 扩展 | P1 gated | probe 证明确有 raw `tool_name=Update` 且 payload 可重建或可 fail-closed | 加 raw fixture，再扩 `src/cli/claude-settings.js` matcher 与 hook tests |
| checker/frontmatter parser 进一步共享 | P2 | Stop hook 与 checker parser 再次漂移 | 抽共享 helper 或生成测试 fixture；避免为一次解析新增复杂 runtime 架构 |
| 全量 replay/eval 平台 | P2 | 有 3+ 真实 PRD 日志样本需要横向比较 | 先定义样本真实性与 owner；不把 eval 平台作为当前 P0 |

## 5. 验证记录

已执行：

```bash
npx jest tests/unit/spec-prd-checker-unit.test.js tests/unit/spec-prd-finalize.test.js --runInBand
npx jest tests/unit/claude-hook-payload-probe.test.js --runInBand
npx jest tests/unit/spec-prd-checker-unit.test.js tests/unit/spec-prd-finalize.test.js tests/unit/spec-prd-contracts.test.js tests/unit/claude-hook-payload-probe.test.js --runInBand
npx jest tests/unit/prd-prewrite-guard-hook.test.js --runInBand
npx jest tests/unit/spec-prd-contracts.test.js --runInBand
node skills/spec-prd/scripts/run-evals.js --json
node --check scripts/probe-claude-hook-payload.js && node --check skills/spec-prd/scripts/check-prd-artifact.js && node --check skills/spec-prd/scripts/finalize-prd-artifact.js
npm run typecheck
git diff --check
npx jest tests/unit/changelog-format.test.js --runInBand
npm run build
```

结果：以上命令均已通过。
