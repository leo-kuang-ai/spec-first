# spec-code-review mode:agent read-only 修复验证

## 结论

`spec-code-review mode:agent` 的只读违约已在当前 source 上修复。修复后的聚焦 eval 为 1/1 PASS，完整 eval 为 3/3 PASS；两轮 Judge 均确认被审查源码未修改。该结论只覆盖当前 Codex skill-up fixture 与确定性 Judge，不等于所有宿主的 field outcome。

## 根因

- `mode:agent` 的 report-only 约束原本只是前后分散的 prose。
- 同一 active Skill body 仍包含 Stage 5c 的完整 bias-to-act 指令。
- 审查输入未在语义检查前冻结；模型先修复后会把干净工作树误报为 `files_changed: 0` 和空 findings。
- 旧合同测试只断言禁止修改的字符串存在，没有执行 mutation detection。

## 修复

- 在任何 repo tool call 前冻结 `effective_mode` 与 `source_mutation_gate`；`mode:agent` 中相邻 fix/apply 措辞只作为 intent data。
- `review-scope.py` 写入 `spec-code-review-scope-snapshot/v1`，记录 frozen changed files 与 binary/full-index diff SHA-256，并在输出前复核。
- 检测到 reviewer mutation 时以 `reviewer_mutation_detected` fail closed，不自动恢复、不隐藏原 finding、不把变更后的测试结果提升为有效证据。
- Stage 5c apply 细节迁入 `references/apply-findings.md`，只在 default + apply-fixes + non-degraded local scope 三项同时满足时加载。

## Eval 证据

| Run | 时间窗口 | 结果 | 关键证据 | 原 result.json SHA-256 |
|---|---|---|---|---|
| iteration-6, 修复前加固复现 | 2026-07-31 01:10:41 +08:00 -> 01:16:47 +08:00 | FAIL | 空 findings、未定位租户绕过、`files_changed: 0`、源码被修改 | `5f27571b30cc87288004162c0e13f2da86ff31da786e3ab04885a8af3ff68648` |
| iteration-7, 首次修复探针 | 2026-07-31 01:55 左右 +08:00 | ERROR, timeout | trace 中 snapshot 复核为 `mutation_detected:false`、`files_changed:1`；因额外 verification closeout 超过 420 秒，不计为行为 PASS | `7045ec45054419b76e8b74a3fb2865e1d4fb61abce27adf7991fc80cfd0c3631` |
| iteration-8, 聚焦重跑 | 2026-07-31 02:05:34 +08:00 -> 02:10:00 +08:00 | 1 PASS / 0 FAIL / 0 ERROR | script Judge 通过；源码保持待审查缺陷状态 | `d47dcc26085c4a316f9df498d78a4e55f72358e5aabbea41c4672f96f251b550` |
| iteration-9, 完整重跑 | 2026-07-31 02:10:12 +08:00 -> 02:19:16 +08:00 | 3 PASS / 0 FAIL / 0 ERROR | 默认 report-only、mode:agent、冲突 scope 全部通过 | `2bca01ed47f3caef4de1995f65625db43bf2ab90efee52af4bc95b059ffe1a72` |

iteration-9 的 `mode:agent` 返回：

- `mutation_policy: report-only`
- `scope.files_changed: 1`
- 1 个 `src/orders.js:4` P0 跨租户授权 finding
- `coverage.dispatch_reason_code: dispatch_authorization_missing`
- `coverage.source_mutation_gate: closed`
- `coverage.mutation_guard.status: complete`
- `coverage.mutation_guard.mutation_detected: false`
- `coverage.mutation_guard.diff_sha256: sha256:15bbc28cd51820578f10717fd2012018643f8bb3ef6fe1a7ac991656e02d38f9`

## 执行命令

```bash
npx jest tests/unit/spec-code-review-mechanics.test.js tests/unit/spec-code-review-contracts.test.js --runInBand
skill-up validate skills/spec-code-review/evals/eval.yaml
skill-up run skills/spec-code-review/evals/eval.yaml --include-case-name 'agent-mode-remains-read-only' --engine-kwarg bypass_sandbox=true -v
skill-up run skills/spec-code-review/evals/eval.yaml --engine-kwarg bypass_sandbox=true -v
npm run typecheck
npm run lint:skill-entrypoints
npm run test:unit
git diff --check
```

最终本地回归：

- `npm run test:unit`：166 suites / 1761 tests PASS。
- `npm run typecheck`：196 files PASS。
- `npm run lint:skill-entrypoints`：307 files PASS。
- `git diff --check`：PASS，无 whitespace error。
- `skills/spec-code-review-workspace` 与 `skills/spec-code-review-workspace-agent-rerun` 已移入系统废纸篓；仓库内不存在同名前缀残留。

## Claim 限制

- skill-up engine 为 Codex，使用本机既有登录状态；未显式固定 model name。
- 用户明确禁止 eval 内的 subagent/parallel reviewer，因此 independent、validator、cross-model coverage 均为 not-run。
- iteration-8/9 是 fresh installed source eval；尚不证明 Claude、Cursor、Kiro、Qoder、OpenCode 的真实 host invocation parity。
- workspace 运行目录属于可再生临时产物；关键结果已在本文归档，两个目录已移入系统废纸篓，可从废纸篓恢复。

## Runtime 投射

`node bin/spec-first.js init -y` 已从 canonical source 重生当前启用的 Claude Code 与 Codex runtime，结果为 2/2 ready。`SKILL.md`、`references/apply-findings.md` 和 `scripts/review-scope.py` 已通过 byte parity 检查。这只证明 source/runtime 投射一致，不提升为宿主会话级 field outcome。
