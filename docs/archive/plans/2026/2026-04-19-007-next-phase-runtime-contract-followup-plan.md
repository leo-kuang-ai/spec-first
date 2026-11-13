---
title: Next Phase Runtime Contract Follow-up Plan
created: 2026-04-19
status: superseded
owner: engineering
origin: 2026-04-19 当前 runtime truth / preview-apply 同构收口后的下一阶段待办汇总
scope: clean plan 化、adapter runtime plan contract 测试、preview/apply 同构回归保护、doctor freshness 解释增强、plan builder 下沉、文档漂移清理、hook 权限守护、单一真相源继续收敛
---

# Next Phase Runtime Contract Follow-up Plan

## 1. 目标

把当前已经收紧到位的 `doctor evidence truth` 与 `init runtime sync plan` 继续往下推，完成下一阶段 8 项待办的统一规划，核心目标仍然是：

1. 继续减少 preview / apply 漂移。
2. 提高 runtime contract 的可验证性。
3. 提高 `doctor` 与 workflow 对决策输入的可解释性。
4. 压缩多处真相源，避免“命令内拼一套、adapter 再来一套、文档再写第三套”。

## 2. 当前代码事实基线

### 2.1 已完成的收口

当前仓库已经完成两项重要收口：

1. `tests/unit/doctor-json-contract.test.js` 已移除绝对时间戳导致的时间炸弹，fresh/stale 证据改为相对当前时间生成。
2. `src/cli/commands/init.js` 已把 platform runtime sync 收敛到 adapter 级 `planRuntimeFilesSync()`，dry-run preview 与真实 apply 复用同一份 `initWritePlan`。

涉及的当前真源代码主要包括：

- `src/cli/commands/init.js`
- `src/cli/adapters/base.js`
- `src/cli/adapters/claude.js`
- `src/cli/adapters/codex.js`
- `src/cli/commands/doctor.js`

### 2.2 仍然存在的下一阶段缺口

尽管 `init` 已完成 preview/apply 共用 plan，下一阶段仍有 4 类明显缺口：

1. `clean --dry-run` 的 runtime cleanup preview 仍在命令内局部拼装。
2. adapter runtime plan 目前主要靠 `init/clean smoke` 间接覆盖，缺少直接 contract 测试。
3. 缺少“preview 所列写入/删除面 == 真实 apply 行为面”的回归保护。
4. `doctor` 的 freshness 输出已经存在，但解释性仍偏弱，plan helper 也还有局部重复。

## 3. 待办总览

## 3.1 最高优先级

1. 先建立 preview/apply 同构回归护栏，再推进 `clean --dry-run` plan 化。
2. 给 adapter runtime plan 增加专门的 contract 测试。
3. 收敛 `clean --dry-run` 成真正的 plan source of truth。

## 3.2 第二梯队

4. 收紧 `doctor` 的 freshness contract 输出。
5. 把 operation plan 的公共构建逻辑继续下沉。
6. 清理文档中的旧术语和旧实现描述。
7. 补“文件权限 / 可执行位”专项测试。
8. 继续压缩多处真相源。

## 4. 实施单元

## Unit 1: preview/apply 同构回归护栏前置

### 问题

当前已经修复了一部分 preview/apply 分叉，但还没有一个显式测试去证明：

```text
preview 声称会做什么
==
真实 apply 最终实际做了什么
```

如果下一步直接改 `clean` 的 plan 结构，而没有先把 parity 护栏立起来，仍然会出现“先改行为、后补保护”的回归窗口。

### 涉及文件

- `tests/unit/init-dry-run.test.js`
- `tests/unit/clean-dry-run.test.js`
- 视需要新增 `tests/integration/runtime-preview-apply-parity.test.js`

### 设计

先把同构护栏写出来，不只检查 dry-run 文案存在，而是检查：

1. `init --dry-run` 列出的高价值路径与真实 `init` 最终落盘面一致。
2. `clean --dry-run` 列出的删除/更新面与真实 `clean` 行为一致。
3. Claude / Codex 两个平台都至少覆盖一条代表路径。
4. 断言应以 contract surface 为主，而不是对大对象做脆弱 snapshot。

### Done Signals

1. preview/apply contract 退化可被自动发现。
2. `clean` 重构前先有明确护栏。
3. 后续继续 plan 化时不会再次出现“实现先行、保护滞后”。

## Unit 2: adapter runtime plan contract 测试

### 问题

`planRuntimeFilesSync()` 现在已经是 runtime sync 的真实 contract，但缺少直接、窄范围、可解释的 unit test。

### 涉及文件

- `src/cli/adapters/base.js`
- `src/cli/adapters/claude.js`
- `src/cli/adapters/codex.js`
- 新增 `tests/unit/runtime-plan-contracts.test.js`

### 设计

直接断言 adapter plan 的 contract，而不是只通过 smoke 间接观察：

1. Claude:
   - `kind`
   - `path`
   - `contents`
   - `mode`
   - 目标文件存在/不存在时 `write_file` / `update_file` 切换
2. Codex:
   - `remove_dir` 列表是否完整
   - 路径是否与 runtime cleanup 边界一致

### Done Signals

1. runtime plan 的 contract 回归会先在 unit 层暴露。
2. `init` 的 preview/apply 共用 plan 不再只靠 smoke 间接守护。

## Unit 3: `clean --dry-run` plan 化

### 问题

当前 `clean` 虽然能更真实地 preview：

- `CLAUDE.md`
- `.claude/hooks/session-start`
- `.claude/settings.json`

但 runtime cleanup 仍由 `src/cli/commands/clean.js` 在命令内部拼出 `buildRuntimeCleanupPreview()`，而不是完全由可复用 plan contract 生成。

### 涉及文件

- `src/cli/commands/clean.js`
- `src/cli/claude-settings.js`
- `src/cli/instruction-bootstrap.js`
- `src/cli/state.js`
- `tests/unit/clean-dry-run.test.js`
- `tests/smoke/cli.sh`

### 设计

1. 把 instruction cleanup、Claude settings cleanup、runtime hook removal 统一到共享 plan。
2. `clean --dry-run` 与真实 `clean` 尽量共用同一条 operation data path。
3. Unit 1 的 parity 护栏与本单元同步维护，确保每次 plan 化推进都可回归验证。
4. 继续保持“轻 contract”，不把 clean 变成重编排事务框架。

### Done Signals

1. `clean --dry-run` 的 update/remove 判定不再由命令内临时拼接主导。
2. 预览面与真实删除/更新面进一步同构。
3. `clean` 仍然保持当前幂等性与 custom asset 保留边界。

## Unit 4: `doctor` freshness / provenance 解释增强

### 问题

`src/cli/commands/doctor.js` 现在已经输出：

- `evidence_schema_valid`
- `evidence_freshness`
- `fallback_reason`

但对下游 workflow 与人类操作者来说，解释性仍然偏弱。

### 涉及文件

- `src/cli/commands/doctor.js`
- `tests/unit/doctor-json-contract.test.js`

### 设计

在不增加 orchestration 厚度的前提下，增强 evidence 可解释性，但必须先固定聚合语义，避免多条 evidence 时长出第二套“解释层真相源”。

建议不要直接新增语义含混的裸字段 `captured_at` / `age_ms`，而是输出一个稳定的聚合对象，例如：

```json
{
  "evidence_age_summary": {
    "oldest_captured_at": "<ISO-8601|null>",
    "oldest_age_ms": 12345,
    "newest_captured_at": "<ISO-8601|null>",
    "newest_age_ms": 2345,
    "max_age_ms": 604800000
  }
}
```

固定语义如下：

1. `oldest_*` 代表当前 effective evidence 集合里最早的一条证据，用来解释为什么整体会被判 stale。
2. `newest_*` 代表当前 effective evidence 集合里最新的一条证据，用来解释最近一次验证发生在何时。
3. `max_age_ms` 直接复用当前 freshness 判定阈值，不再由下游猜测。
4. 当 evidence 集合为空时，以上时间字段统一为 `null`，不输出伪默认值。
5. `fallback_reason` 继续作为 machine-readable 主锚点；解释字段只能补充事实，不能替代判定字段。

### Done Signals

1. stale/fresh 判定更容易被下游消费，且多 evidence 聚合口径唯一。
2. `doctor --json` 继续坚持“事实输入”定位，而不是长成执行树。
3. 不引入新的语义含混字段，避免解释层再次成为第二真相源。

## Unit 5: operation plan helper 下沉

### 问题

当前 `init.js` 里仍保留局部 plan helper，例如：

- `buildPlanFileOperation()`
- `summarizePlanOperations()`

随着 `clean` 继续 plan 化，局部 helper 重复的风险会继续升高。

### 涉及文件

- `src/cli/commands/init.js`
- `src/cli/commands/clean.js`
- `src/cli/state.js`

### 设计

1. 把真正通用的 plan builder / summary helper 下沉到共享层。
2. command 层只保留 merge / apply / report。
3. adapter 层只产 plan，不负责额外解释。

### Done Signals

1. `init` / `clean` 不再各自长一套 plan helper。
2. 多处真相源继续减少。

## Unit 6: 文档漂移与旧术语清理

### 问题

仓库中仍可能残留旧描述，例如：

- `syncBundledAssets`
- 旧 bootstrap 命名
- 旧 runtime 生成链路

### 涉及文件

- `README.md`
- `README.zh-CN.md`（若存在）
- `CLAUDE.md`
- `AGENTS.md`
- `docs/10-prompt/`
- 其他描述 runtime/install/doctor 的 docs

### 设计

做一次 source-of-truth 导向的文档校对：

1. 以当前代码事实为准。
2. 优先清理用户可见文档。
3. 不重写愿景，不做宣传式更新，只修正事实漂移。

### Done Signals

1. 关键文档不再继续描述旧实现。
2. 用户心智与当前代码边界对齐。

## Unit 7: hook 权限 / 可执行位专项测试

### 问题

Claude hook 现在改为 plan 写入，依赖 `mode: 0o755`。这类权限 contract 很容易在后续重构中静默丢失。

### 涉及文件

- `src/cli/adapters/claude.js`
- `tests/unit/claude-settings.test.js`
- 或新增 `tests/unit/runtime-hook-permissions.test.js`

### 设计

新增针对 hook 文件的专项断言：

1. 内容正确
2. 可执行位存在
3. 重复 init 后权限不丢

### Done Signals

1. hook 运行 contract 不只靠 smoke 的间接行为守护。
2. runtime plan 的 `mode` 字段有直接回归保护。

## Unit 8: 继续压缩多处真相源

### 问题

虽然这几轮已经明显改善，但仍有“command 内拼 summary / adapter 内拼 operation / docs 再写另一套”的自然回弹风险。

### 涉及文件

- `src/cli/commands/init.js`
- `src/cli/commands/clean.js`
- `src/cli/commands/doctor.js`
- `src/cli/adapters/*.js`
- `CLAUDE.md`
- `AGENTS.md`

### 设计

继续坚持一个更清楚的层次：

1. adapter 只产 runtime plan / inspect facts
2. command 只 merge / apply / report
3. doctor 只读事实，不额外猜测
4. docs 只描述代码已实现的 contract

### Done Signals

1. “一层一个问题”的边界继续清晰。
2. 代码与文档事实的漂移速度继续下降。

## 5. 验证矩阵

| 单元 | 主要验证 |
| --- | --- |
| Unit 1 | `tests/unit/init-dry-run.test.js`、`tests/unit/clean-dry-run.test.js`、必要时补 parity integration test |
| Unit 2 | 新增 adapter runtime plan unit tests |
| Unit 3 | `tests/unit/clean-dry-run.test.js`、`tests/smoke/cli.sh`、复用 Unit 1 parity 护栏 |
| Unit 4 | `tests/unit/doctor-json-contract.test.js` |
| Unit 5 | 相关 unit tests + `npm test` |
| Unit 6 | 文档 grep / contract tests / 必要的 smoke 断言 |
| Unit 7 | hook permissions unit/smoke tests |
| Unit 8 | `npm test` + 代码走查 |

## 6. 推荐执行顺序

1. Unit 1: preview/apply 同构回归护栏前置
2. Unit 2: adapter runtime plan contract 测试
3. Unit 3: `clean --dry-run` plan 化
4. Unit 7: hook 权限专项测试
5. Unit 4: `doctor` freshness 解释增强
6. Unit 5: operation plan helper 下沉
7. Unit 6: 文档漂移清理
8. Unit 8: 单一真相源继续压缩

理由：

1. 先补 parity 护栏，再动 `clean` 的 plan 结构，避免保护滞后。
2. adapter runtime plan contract 测试与 `clean` plan 化一起，把已形成的 contract 固化住。
3. 之后再做解释增强、helper 下沉和文档清理，避免边做边漂。

## 7. 风险与边界

### 风险 1：为了“完全同构”把 command 抽象得过重

缓解：

- 只抽已被两处以上消费的 helper
- 不引入事务框架
- 不引入状态机

### 风险 2：runtime plan 测试过细导致高维护成本

缓解：

- 只守 contract 字段
- 不守普通文案
- 不做无意义 snapshot 大对象测试

### 风险 3：`doctor` 解释增强重新长成 orchestration 输出

缓解：

- 继续以 provenance / freshness / confidence / fallback_reason 为核心
- 不增加“下一步必须怎么跑”的厚执行树

## 8. 自审

这份 plan 与当前仓库指导思想一致：

1. 继续做“轻 contract + 明确边界 + 让 LLM 决策”。
2. 不把质量门做成重编排状态机。
3. 优先改善真实、稳定、低漂移的决策输入。
4. 优先压缩多处真相源，而不是增加更多流程控制面。
