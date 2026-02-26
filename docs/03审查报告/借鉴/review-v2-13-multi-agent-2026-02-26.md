# 深度审查报告：v2-13-orchestrate-auto-loop（多 Agent）

- 审查日期：2026-02-26
- 审查对象：`docs/02技术方案/V2/v2-13-orchestrate-auto-loop.md`（v1.3）
- 审查方式：3 个评审视角并行交叉（架构 Agent / 运行时 Agent / 质量与运维 Agent）
- 审查基线：当前仓库最新代码（`src/`、`skills/`、`tests/`）

## 审查结论（先给结论）

该方案方向正确、覆盖面完整，但**仍存在 3 个 Critical 级设计缺口**，会直接导致“文档可读但无法无歧义落地”。

在修复 Critical 前，不建议按当前版本直接进入实现阶段。

---

## Findings（按严重级别）

### CRITICAL-1 配置设计与配置实现脱节，新增配置会被静默忽略

- 评审 Agent：架构 Agent
- 证据：
  - 文档定义了 `runtime.auto_orchestrate / completion_guard / slop_check / audit_log`：`v2-13-orchestrate-auto-loop.md:371-383`
  - 当前配置实现仅解析 `runtime.max_iterations / max_self_corrections / kv_cache_hard_gate`：`src/shared/config-schema.ts:101-110`
- 风险：用户配置看似生效，实际被忽略，形成“伪可配置”系统。
- 修复建议：
  1. 扩展 `SpecFirstConfig` 类型与 `DEFAULT_SPEC_FIRST_CONFIG`。
  2. 在 `mergeWithDefaults` 显式解析新增字段。
  3. 在 `validate` 增加范围校验。
  4. 对未知配置键输出 warning（避免静默忽略）。

### CRITICAL-2 `orchestrate --auto/--resume/--unattended` 参数入口未定义到真实执行载体

- 评审 Agent：架构 Agent
- 证据：
  - 文档要求新增参数入口：`v2-13-orchestrate-auto-loop.md:442`
  - orchestrate 当前是 Skill 命令：`skills/spec-first/13-orchestrate/SKILL.md:12`
  - CLI 注册中没有 `orchestrate` 命令：`src/cli/index.ts:34-44`
- 风险：实现阶段无法确定参数由谁解析（CLI、Skill runtime、或 prompt parser），会造成多套入口并存。
- 修复建议：
  1. 在文档明确唯一入口协议（推荐：Skill runtime 参数协议）。
  2. 定义解析位置与格式（示例：`/spec-first:orchestrate --auto --resume` 的 tokenizer/validator）。
  3. 说明 CLI 是否提供同名代理命令（可选），避免双栈分叉。

### CRITICAL-3 TASK 状态词汇统一方案未闭环，仍存在三套语义

- 评审 Agent：运行时 Agent
- 证据：
  - 文档将 canonical 定义为 `done`：`v2-13-orchestrate-auto-loop.md:426-432`
  - todo-runner 状态类型为 `pending/in_progress/blocked/done`：`src/core/ai-orchestrator/todo-runner.ts:6`
  - orchestrate skill 文案仍使用 `complete/verified`：`skills/spec-first/13-orchestrate/SKILL.md:120,125`
  - Hook 脚本也兼容 `complete/done/verified`：`src/core/tool-integration/ai-runtime-hook-scripts.ts:46,104`
- 风险：续航推进、停止守卫、统计摘要出现判定分裂。
- 修复建议：
  1. 定义统一状态字典（canonical + alias）。
  2. 在单点做 normalize（读取任务计划/Hook/runner 前统一归一）。
  3. 同步修改 skill 文案与测试断言，避免“文档与行为”偏移。

### HIGH-1 P4→P2 回退写入了方案，但未定义与现有状态机/测试契约的变更清单

- 评审 Agent：运行时 Agent
- 证据：
  - 文档要求新增 `P4_WRITE -> P2_GENERATE`：`v2-13-orchestrate-auto-loop.md:197-205,410-415`
  - 当前状态机未支持：`src/core/skill-runtime/phase-machine.ts:32`
  - 现有测试依赖当前转移集合与数量：`tests/unit/skill-runtime.test.ts:346-348`
- 风险：实现时容易只改状态机，不改测试与 3-strike 规则，造成行为回归。
- 修复建议：在文档 Phase B 增加“契约更新清单”：状态机、3-strike 边界、单测快照、集成测试路径。

### HIGH-2 `completion_markers` 与 `required_mcps` 都依赖 Front Matter 解析，但文档未定义统一解析层

- 评审 Agent：运行时 Agent
- 证据：
  - 文档新增 Front Matter 字段：`v2-13-orchestrate-auto-loop.md:214-224,329-335`
  - 当前 `loadSkill` 只读文本并装配，不解析 Front Matter：`src/core/skill-runtime/dispatcher.ts:180-214`
- 风险：两个能力的实现会重复造轮子、校验标准不一致。
- 修复建议：先定义统一 `parseSkillFrontMatter()`（返回 `meta + body`），再让 completion guard 与 MCP 声明共用。

### HIGH-3 slop 检测被挂到 SCA 子模块，但执行时机与 SCA 现有模型不一致

- 评审 Agent：质量与运维 Agent
- 证据：
  - 文档要求 P4 写后扫描变更文件：`v2-13-orchestrate-auto-loop.md:280-282`
  - 当前 SCA 是阶段/矩阵一致性检查，不接收“本轮变更文件集”：`src/core/gate-engine/sca.ts:46-63,137-153`
- 风险：实现时把“文件级规则”硬塞到“阶段级检查”，导致接口扭曲。
- 修复建议：
  1. 保留 `sca.ts` 作为阶段一致性检查。
  2. 新增独立 `slop-checker` 接口（输入：changed files，输出：finding list）。
  3. 在 PhaseMachine 的 P4→P5 间编排调用。

### MEDIUM-1 `_context.md` 自动加载缺少“任务到模块路径”映射算法

- 评审 Agent：质量与运维 Agent
- 证据：
  - 文档要求按 TASK 涉及路径加载 `_context.md`：`v2-13-orchestrate-auto-loop.md:323-325`
  - 当前 Task Context Pack 仅基于 TASK 文本与 trace 关系，不产出模块文件路径：`src/core/ai-orchestrator/context-pack.ts:273-294`
- 风险：实现阶段会退化为“全量扫描 + 猜测匹配”，命中率低且成本高。
- 修复建议：先定义最小路径来源优先级（TASK 显式 path > matrix API path > git diff）。

### MEDIUM-2 `stalled` 被写入结束态，但 `TodoStatus` 未纳入该状态

- 评审 Agent：运行时 Agent
- 证据：
  - 文档写了 `stalled` 结束态：`v2-13-orchestrate-auto-loop.md:444,453`
  - 类型未包含 `stalled`：`src/core/ai-orchestrator/todo-runner.ts:6`
- 风险：实现会在“新增状态”与“复用 haltReason”之间摇摆，影响统计与恢复策略。
- 修复建议：文档里明确二选一：
  1. `stalled` 作为 item status；或
  2. 仅作为 run-level haltReason，不新增 item status。

---

## 多 Agent 共识（保留项）

以下设计是正确方向，建议保留：

1. 单一状态源（统一到 `todo-state.json`）方向正确，可避免双文件一致性问题。
2. 有限回退（`max_retry_per_task`）可有效抑制死循环。
3. 原子写入 + 审计日志组合，适合作为 Durable Execution 的 MVP。

---

## 最小修订建议（进入实现前）

建议先做一次文档 v1.4 最小修订，仅补“接口契约”，不扩充范围：

1. 增加“参数入口协议”小节（CRITICAL-2）。
2. 增加“配置 schema 变更表”小节（CRITICAL-1）。
3. 增加“状态词汇统一字典”小节（CRITICAL-3）。
4. 增加“Front Matter 统一解析层”小节（HIGH-2）。
5. 在实施计划中新增“契约测试清单”行（HIGH-1/HIGH-3/MEDIUM-2）。

完成以上 5 点后，再进入代码实现，返工成本最低。
