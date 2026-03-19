# first Skill 最小支撑层改造实施计划

**目标：** 将 `first` 重构为 Skill 负责工作流和多 Agent 编排，CLI 只保留启动、持久化、校验和宿主集成这层最小支撑能力。

**架构：** 本次改造会移除 `src/core/skill-runtime/first*` 中脚本主导的项目认知生成逻辑，并把 `skills/spec-first/00-first/` 重新拉回控制平面。runtime JSON 继续作为机器真源并保持 schema 稳定；docs 作为人类阅读产物，只做存在性检查，不再承载文档真源语义。

**技术栈：** TypeScript、Node.js、Vitest、现有 spec-first skill/runtime 架构

---

## 任务 1：冻结范围与合同

**文件：**
- 修改：`docs/analysis/2026-03-19-first-generation-refactor-plan.md`
- 参考：`src/core/skill-runtime/first-runtime-types.ts`
- 参考：`src/core/skill-runtime/context-resolver.ts`
- 参考：`src/core/skill-runtime/dispatcher.ts`

**步骤：**
1. 确认 9 个 runtime 资产文件名和 runtime JSON schema 保持不变。
2. 确认 `readFirst*()`、`context-resolver.ts`、`dispatcher.ts` 的消费合同保持不变。
3. 标记需要删除的旧语义：docs 作为文档真源、docs 内容漂移作为系统错误、synthetic cognition building。

## 任务 2：先重写 Skill 控制平面

**文件：**
- 修改：`skills/spec-first/00-first/SKILL.md`
- 修改：`skills/spec-first/00-first/references/execution-flow.md`
- 修改：`skills/spec-first/00-first/references/subagent-architecture.md`
- 修改：`skills/spec-first/00-first/references/agents-*.md`

**步骤：**
1. 重写 `SKILL.md`，只定义 `deep` 模式、runtime/docs 输出、skill 与 CLI 边界、成功标准。
2. 重写 `execution-flow.md`，描述 skill 层执行流和与支撑层的交接点。
3. 重写 `subagent-architecture.md`，定义波次、依赖、重试策略、skill 层结果合并规则。
4. 重写 `agents-*.md`，定义输入证据、必需输出、禁止猜测边界和验收规则。

## 任务 3：替换 CLI 入口语义

**文件：**
- 修改：`src/cli/commands/first.ts`

**步骤：**
1. 重写帮助文案，移除 bootstrap / compiler / projection 叙事。
2. 删除旧 refresh 分支语义。
3. 保留稳定退出码和 `--check-health` 行为。

## 任务 4：重建最小支撑入口

**文件：**
- 修改：`src/core/skill-runtime/first-bootstrap.ts`
- 新增：`src/core/skill-runtime/first-support-handoff.ts`
- 按需新增：`src/core/skill-runtime/first-evidence-pack.ts`
- 按需新增：`src/core/skill-runtime/first-runtime-validator.ts`
- 按需新增：`src/core/skill-runtime/first-docs-check.ts`

**步骤：**
1. 先建立明确交接协议：skill 结果优先落到 `.spec-first/tmp/first-handoff/`。
2. `first-bootstrap.ts` 优先消费 handoff 结果，再执行 runtime 校验、runtime 写盘、docs 写盘、docs 存在性检查。
3. handoff 缺失时直接失败，不再退回当前本地推断逻辑。
4. 禁止新增 TS 侧多 Agent 执行器。

## 任务 5：压缩旧 projection 逻辑

**文件：**
- 修改或删除：`src/core/skill-runtime/first-doc-projection.ts`
- 修改：`src/core/skill-runtime/first-context.ts`

**步骤：**
1. 先从 `first-context.ts` 去掉旧 import 和调用，再删除/收缩 projection 代码。
2. 删除所有 `buildSynthetic*`、fallback asset 构造和 projection-driven 建模逻辑。
3. 只有在它仍然承担固定路径 docs 写盘价值时，才保留 `first-doc-projection.ts`。

## 任务 6：收缩 runtime 协调层

**文件：**
- 修改：`src/core/skill-runtime/first-context.ts`
- 修改：`src/core/skill-runtime/first-artifact-mapping.ts`

**步骤：**
1. 将 `first-context.ts` 收缩为只处理 runtime/background 协调。
2. 将 `first-artifact-mapping.ts` 收缩为最小 runtime 影响映射。
3. 删除 projection registry 和文档真源语义。

## 任务 7：清理旧治理与 docs 内容漂移语义

**文件：**
- 修改：`src/core/skill-runtime/first-change-detector.ts`
- 修改或删除：`src/core/skill-runtime/first-incremental-update.ts`
- 修改：`src/core/skill-runtime/first-governance.ts`
- 修改：`src/cli/commands/doctor.ts`
- 修改：`src/cli/commands/status.ts`
- 修改：`src/core/gate-engine/sca.ts`

**步骤：**
1. 重写健康语义：runtime schema/health 重要，docs 缺失重要，docs 内容漂移不再重要。
2. 删除 projection-refresh-driven 代码。
3. 只保留围绕 runtime 资产状态和 docs existence 状态的最小治理。

## 任务 8：保护消费端合同

**文件：**
- 参考：`src/core/skill-runtime/context-resolver.ts`
- 参考：`src/core/skill-runtime/dispatcher.ts`

**步骤：**
1. 验证 runtime 文件名、schema 和 `readFirst*()` 行为保持稳定。
2. 验证 `first-runtime-context` 注入形状保持稳定。
3. 拒绝任何让 docs 重新进入 machine truth 的改动。

## 任务 9：测试与验证

**文件：**
- 修改/新增：相关 `tests/unit/first-*.test.ts`

**步骤：**
1. 删除覆盖 synthetic fallback 和 docs 内容漂移语义的旧测试。
2. 增加针对 runtime 合同稳定、docs existence-only 检查、移除 docs 内容漂移报告的聚焦测试。
3. 运行 `npm run typecheck` 和相关 first 测试。

## 任务 10：最终集成检查

**文件：**
- runtime 输出：`.spec-first/runtime/first/*`
- docs 输出：`docs/first/*`

**步骤：**
1. 准备 skill handoff 后运行 `spec-first first --force`。
2. 验证 runtime 资产已写入，docs 已写入。
3. 验证帮助文案、doctor、status、sca 中不再残留 docs 内容漂移语义。
4. 最后人工审查 skill 文档与 CLI 语义是否一致。
