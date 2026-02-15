# Spec-First 全面代码审查报告

- 审查日期: 2026-02-11
- 审查范围: `docs/03开发任务` 对应实现（A/B/C 全阶段）
- 代码范围: `src/`、`packages/`、`scripts/`、`templates/`、`tests/`
- 审查方式: 文档对照 + 代码静态审查 + 自动化验证

## 执行结果

- `npm run typecheck`: 通过
- `npm test`: 通过（39 文件 / 443 用例）
- 结论: 可运行，但存在多处关键流程正确性与任务一致性问题，需分批修复后再验收。

## 关键发现（按严重级别）

### P0 严重

1. `stage advance` 未接入真实 Gate 校验
- 现状: `advance()` 内部固定抛 `GateUnavailableError`，不会执行 Gate 评估。
- 影响: 可在未过 Gate 的情况下推进阶段（依赖 `pilot_mode` 或 `--force`）。
- 定位: `src/core/process-engine/advance.ts:106`, `src/core/process-engine/advance.ts:110`
- 对照: `docs/03开发任务/phase-C-扩展优化.md:121`

2. `gate-history.jsonl` 混合 schema，GL-01 可误判通过
- 现状: `advance` 写入的是 `action/from/to/gateResult`；`golive` 读取最后一条并按 `status !== 'FAIL'` 判定。
- 影响: 若最后一条无 `status` 字段，会被判为“非 FAIL”，导致错误放行。
- 定位: `src/core/process-engine/advance.ts:136`, `src/core/gate-engine/golive.ts:44`, `src/core/gate-engine/golive.ts:107`, `src/core/gate-engine/gate-evaluator.ts:313`

3. 豁免匹配逻辑错误（非精确匹配）
- 现状: 任一有效 Exception 都会把“第一个 FAIL 条件”改成 `WAIVER`。
- 影响: 不相关失败条件可能被错误豁免。
- 定位: `src/core/gate-engine/gate-evaluator.ts:262`, `src/core/gate-engine/gate-evaluator.ts:266`

### P1 高

4. Gate 侧 RFC 状态读取路径错误
- 现状: 读 `specs/<feature>/rfcs.json`，而 RFC 实际存储在 `specs/<feature>/rfc/*.rfc.json`。
- 影响: Exception 有效性判断失真。
- 定位: `src/core/gate-engine/gate-evaluator.ts:320`, `src/core/change-mgr/rfc.ts:33`, `src/core/change-mgr/rfc.ts:37`

5. Gate 条件路径与项目实际产物路径不一致
- 现状: Gate 检查 `01_specify/spec.md`、`02_design/design.md`、`07_release/reports/*`；其余模块大量使用根级 `spec.md/design.md/reports/*`。
- 影响: Gate 误报 FAIL 或验收口径漂移。
- 定位: `src/core/gate-engine/gate-evaluator.ts:72`, `src/core/gate-engine/gate-evaluator.ts:93`, `src/core/gate-engine/gate-evaluator.ts:209`, `src/core/process-engine/init.ts:206`, `src/core/template/artifact-checker.ts:56`, `src/core/template/artifact-checker.ts:75`, `src/core/process-engine/layer-merger.ts:71`

6. pre-push Hook 不阻断且命令参数错误
- 现状: `npx spec-first matrix check` 未传 `featureId`，失败仅 warning 不阻断 push。
- 影响: 无法承担发布前质量门职责。
- 定位: `src/core/tool-integration/hook-installer.ts:104`, `src/core/tool-integration/hook-installer.ts:106`, `src/cli/commands/matrix.ts:25`
- 对照: `docs/03开发任务/phase-B-质量闭环.md:439`

7. AI Runtime Hook 与 CLI 契约不一致，注册未落地
- 现状:
  - `gate check --quiet`（CLI 无该参数）
  - `matrix check --incremental`（CLI 无该参数）
  - `ai progress-append`（CLI 无该子命令）
  - `registerAIHooks()` 仅返回列表，未写宿主配置
- 影响: Hook 机制在真实环境不可用或失效。
- 定位: `src/core/tool-integration/ai-runtime-hook.ts:32`, `src/core/tool-integration/ai-runtime-hook.ts:37`, `src/core/tool-integration/ai-runtime-hook.ts:41`, `src/core/tool-integration/ai-runtime-hook.ts:47`, `src/cli/commands/gate.ts:39`, `src/cli/commands/matrix.ts:25`, `src/cli/commands/ai.ts:13`

8. VS Code 插件与 CLI 协议不匹配
- 现状: 调用 `id list --json`，但 CLI 不支持 `--json`；文档要求补全来源是 `id search`。
- 影响: 插件缓存刷新失败，补全不可用。
- 定位: `packages/vscode-spec-first/src/extension.ts:47`, `src/cli/commands/id.ts:90`
- 对照: `docs/03开发任务/phase-C-扩展优化.md:209`

### P2 中

9. GoLive 降级/回滚任务落地不足
- 现状: 缺少文档要求的独立能力与持久化动作（降级写回 state、回滚审计日志等）。
- 定位: `docs/03开发任务/phase-B-质量闭环.md:748`, `docs/03开发任务/phase-B-质量闭环.md:773`, `src/core/gate-engine/golive.ts:91`, `src/core/gate-engine/rollback.ts:27`

10. `commit` 命令不符合“message 可选”要求
- 现状: 未提供 `--message` 直接返回校验错误。
- 定位: `src/cli/commands/commit.ts:23`
- 对照: `docs/03开发任务/phase-B-质量闭环.md:460`

11. Skill 语义映射中 defect 子命令错误
- 现状: 映射到 `defect transition`，实际 CLI 为 `defect update`。
- 定位: `src/core/skill-runtime/dispatcher.ts:23`, `src/cli/commands/defect.ts:24`

12. Gate CLI 参数契约与文档不一致
- 现状: 未实现 `gate check/conditions --stage`；`golive check` 实现要求 `featureId`。
- 定位: `src/cli/commands/gate.ts:37`, `src/cli/commands/gate.ts:90`, `src/cli/commands/gate.ts:121`
- 对照: `docs/03开发任务/phase-B-质量闭环.md:105`, `docs/03开发任务/phase-B-质量闭环.md:108`

13. Doctor 提示了不存在的命令
- 现状: 提示 `spec-first hooks install`，但 CLI 未注册 `hooks` 命令。
- 定位: `src/cli/commands/doctor.ts:125`, `src/cli/index.ts:21`

14. AI 编排实现与任务目标存在差距
- 现状: Context slicing/consistency/catchup 的若干要求未完整覆盖（比例预算、stale 检测告警、邻居加载等）。
- 定位: `src/core/ai-orchestrator/context-slicing.ts:44`, `src/core/ai-orchestrator/context-pack.ts:57`, `src/core/ai-orchestrator/catchup.ts:123`
- 对照: `docs/03开发任务/phase-B-质量闭环.md:145`, `docs/03开发任务/phase-B-质量闭环.md:169`, `docs/03开发任务/phase-B-质量闭环.md:202`

15. E2E 对门禁主路径覆盖不足
- 现状: 核心 E2E 主要走 `--force` + `pilot_mode=true` 路径。
- 影响: 难以暴露真实 Gate 集成缺陷。
- 定位: `tests/e2e/core-flow.test.ts:20`, `tests/e2e/core-flow.test.ts:81`

## 风险评估

- 发布风险: 高
- 主要风险面:
  - 质量门禁误放行/误阻断
  - Hook/IDE/AI 集成在真实环境不可用
  - 文档宣称能力与实际行为不一致，影响验收可信度

## 修复优先级建议

1. 先修门禁主链路
- 打通 `advance -> evaluateGate`，统一 gate history schema，修复 GL-01 判定。

2. 修豁免与 RFC 关联
- 修正 RFC 状态读取来源；按条件范围精确匹配 waiver，不得“首个 FAIL 兜底”。

3. 统一产物路径口径
- 在 Gate/Init/ArtifactChecker/LayerMerger/AI Context 中统一路径规范并补回归测试。

4. 修工具集成契约
- pre-push 改为可阻断；AI Hook 命令改为真实 CLI；补 `hooks` CLI 或修 Doctor 提示。

5. 修 VS Code 插件
- 改用 `id search` 或为 `id list` 增加 `--json`，并补扩展侧容错。

6. 补测试
- 增加非 `--force` 的 stage advance、waiver 精确匹配、hook 命令契约、extension/CLI 契约回归。

## 复验建议

- 先完成 P0/P1 后执行:
  - 全量单测
  - 新增回归用例
  - 一次“非 force、非 pilot”的端到端门禁演练
- 再进行 Phase B/C 验收复核。
