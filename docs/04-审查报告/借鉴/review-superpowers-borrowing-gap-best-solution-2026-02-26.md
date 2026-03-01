# Spec-First 借鉴 Superpowers 要素问题与最佳解决方案

> 日期：2026-02-26  
> 输入文档：`docs/01需求文档/v2/优势借鉴分析/Spec-First 可借鉴 Superpowers 的要素分析.md`  
> 结论基线：13 项要素中，8 项完成，5 项部分完成

## 修复进度更新（2026-02-26）

> 本节为最新修复状态；上方“结论基线”保留为初审快照。

### 总体进度

- 已完成：5/5
- 部分完成：0/5
- 未启动：0/5

### 分项进度

| 问题ID | 问题 | 最新状态 | 关键落地点 |
|---|---|---|---|
| P0-1 | Session Hook 路由表 + 1% 规则 | ✅ 已完成 | `src/core/tool-integration/session-hook.ts`、`tests/unit/session-hook.test.ts` |
| P1-2 | Graphviz 决策图覆盖不足 | ✅ 已完成 | `skills/spec-first/03-spec/SKILL.md`、`skills/spec-first/04-design/SKILL.md`、`skills/spec-first/13-orchestrate/SKILL.md` |
| P1-3 | Worktree First 运行时守卫不足 | ✅ 已完成 | `src/core/skill-runtime/hard-gate.ts`、`tests/unit/hard-gate.test.ts` |
| P1-4 | Hook Hardening 缺少 doctor 可达性诊断 | ✅ 已完成 | `src/cli/commands/doctor.ts`、`tests/unit/cli-metrics-doctor.test.ts` |
| P2-5 | Fresh Context Per Task 执行闭环不足 | ✅ 已完成 | `src/core/ai-orchestrator/todo-runner.ts`、`src/core/ai-orchestrator/context-pack.ts`、`tests/unit/todo-runner.test.ts` |

### 验证结果

- `npm run -s typecheck`：通过
- `npm test`：通过（58 个测试文件，596/596 用例通过）

### 备注

- 本轮最后收口项为 P1-4：`doctor` 在 SessionStart 条目缺失时统一输出“内容不完整 + 缺失片段”，消除诊断分支不稳定问题。

## 1. 问题总览

| 优先级 | 问题 | 当前状态 | 目标状态 |
|---|---|---|---|
| P0 | Session Hook 未落地“技能优先路由表 + 1% 规则” | 部分完成 | 会话首轮即注入路由与强约束 |
| P1 | Graphviz 决策图覆盖不足 | 部分完成 | `spec/design/orchestrate` 全覆盖 |
| P1 | Worktree First 缺少运行时守卫 | 部分完成 | 高风险场景可拦截或强确认 |
| P1 | Hook Hardening 缺少 doctor 可达性诊断与 Linux 实机闭环 | 部分完成 | 可诊断、可回归、跨平台验收 |
| P2 | Fresh Context Per Task 偏规则化，缺少执行闭环 | 部分完成 | 每 TASK 真正独立上下文执行 |

## 2. 问题与最佳解决方案

### P0-1 Session Hook 未落地“技能优先路由表 + 1% 规则”

- 现状证据：
  - `src/core/tool-integration/session-hook.ts` 仅输出 catchup 提示 + viewer 启动。
  - `skills/spec-first/AGENTS.md` 只有 Session Hook 决策树说明，没有意图到 skill 的路由表注入。
- 最佳解决方案：
  1. 在 `buildSessionStartCommand` 注入精简 bootstrap 文本，包含固定路由表（init/spec/design/task/code/code-review/verify/catchup）。
  2. 在 bootstrap 文本加入“1% 规则”：有 1% 相关性也先走 skill 检查。
  3. 保持“失败静默降级”不变，避免影响现有启动稳定性。
  4. 增加 `session-hook` 单测：断言命令串包含路由表关键字与 1% 规则关键语句。
- 验收标准：
  - 新会话首轮可见技能路由提示。
  - `tests/unit/session-hook.test.ts` 新增用例通过。
  - 不影响现有 viewer 自动启动与 catchup 提示。

### P1-2 Graphviz 决策图覆盖不足

- 现状证据：
  - 当前仅 `skills/spec-first/11-plan/SKILL.md` 有 `digraph`。
  - `03-spec/04-design/13-orchestrate` 尚未加入 Graphviz。
- 最佳解决方案：
  1. 在 `03-spec` 增加 AC 可验证性决策图。
  2. 在 `04-design` 增加 HARD-GATE 前置与产物完整性决策图。
  3. 在 `13-orchestrate` 增加批次推进/阻塞暂停/advance 决策图。
  4. 统一采用简短 DOT 模板，控制 token 负担。
- 验收标准：
  - 三个 skill 均包含 `digraph`。
  - 图中分支能对应现有执行阶段与守卫规则。

### P1-3 Worktree First 缺少运行时守卫

- 现状证据：
  - `07-code` 与 `AGENTS.md` 有“建议使用 worktree”，但 `orchestrate` 与运行时无强约束。
- 最佳解决方案：
  1. 在 `hard-gate.ts` 扩展 `code/orchestrate` 校验：检测当前分支是否 `main/master`。
  2. 引入“高风险变更”判定开关（如跨目录重构、并行修复标记）；命中时要求 `worktree` 或显式确认字段。
  3. 在 `13-orchestrate` 增加前置检查条目与阻断文案。
  4. 补 `skill-runtime` 单测，覆盖阻断与放行路径。
- 验收标准：
  - 高风险场景在主分支会触发 BLOCKED 或强确认。
  - `loadSkill` 注入的 HARD-GATE 提示可复核到该结论。

### P1-4 Hook Hardening 缺少 doctor 可达性诊断与 Linux 实机闭环

- 现状证据：
  - Hook 脚本有跨平台 awk 与降级机制。
  - `doctor.ts` 目前没有 SessionStart 可达性/首轮注入有效性检查。
  - 开发清单中 P1-17 仍标记 Linux 实机验收待补。
- 最佳解决方案：
  1. 在 `doctor` 增加两项检查：
     - `.claude/settings.json` 中 `hooks.SessionStart` 是否存在 spec-first 条目。
     - 条目是否包含 catchup 提示与 viewer 启动命令。
  2. 在 CI 增加 Linux 回归脚本，执行 session/ai hook 关键测试集。
  3. 产出 `docs/02开发任务` 的跨平台验收记录，关闭 P1-17 阻塞状态。
- 验收标准：
  - `spec-first doctor` 可直接报告 Session Hook 可达性与修复建议。
  - Linux 回归至少 1 轮通过并留存记录。

### P2-5 Fresh Context Per Task 缺少执行闭环

- 现状证据：
  - `13-orchestrate` 已定义“每 TASK 新鲜上下文”规则。
  - 运行时已有 `context-pack/todo-runner/catchup` 基础能力，但未形成“每 TASK 独立上下文执行器”闭环。
- 最佳解决方案：
  1. 新增 `buildTaskContextPack(taskId, featureId)`：仅装载 TASK + traces 关联 FR/DS/API。
  2. 在 orchestrate 执行层按 TASK 调用该 pack，禁止透传上一个 TASK 的执行日志。
  3. 每 TASK 结束写入 `todo-state.json` + `findings.md` 检查点，失败时只回放本 TASK 上下文。
  4. 增加集成测试：两个相邻 TASK 不共享调试历史，且可独立重试。
- 验收标准：
  - 多 TASK 场景下上下文包体积稳定，且无跨 TASK 污染。
  - 阻塞重试仅回放当前 TASK 所需上下文。

## 3. 推荐实施顺序

1. 本周先做 P0-1（收益最高，改动小）。  
2. 同步落 P1-2 与 P1-3（规则可视化 + 运行时守卫）。  
3. 再收口 P1-4（doctor + Linux 验收），关闭当前阻塞。  
4. 最后做 P2-5（涉及执行器改造，放在稳定期）。  

## 4. 交付物清单（建议）

- 代码：
  - `src/core/tool-integration/session-hook.ts`
  - `src/core/skill-runtime/hard-gate.ts`
  - `src/cli/commands/doctor.ts`
- Skill：
  - `skills/spec-first/03-spec/SKILL.md`
  - `skills/spec-first/04-design/SKILL.md`
  - `skills/spec-first/13-orchestrate/SKILL.md`
- 测试：
  - `tests/unit/session-hook.test.ts`
  - `tests/unit/skill-runtime.test.ts`
  - `tests/unit/cli-metrics-doctor.test.ts`
  - `tests/integration/skill-integration.test.ts`（按需）
