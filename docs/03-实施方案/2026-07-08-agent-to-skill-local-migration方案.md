# Agent 迁移到 Skill-local Prompt 资产实施方案

> 文档角色：`agents/` 独立 agent 向 `skills/<skill>/references/{agents,personas}/` 迁移的执行方案
>
> 日期：`2026-07-08`
>
> 范围：参考 compound-engineering 的 skill-local prompt 资产模式，梳理 `spec-first` 旧独立 agent 与当前 workflow skill 的对应关系，并规划迁移、调度改写、清理和验证步骤。

## 1. 结论先行

本次迁移的目标不是“删除 agent 能力”，而是把 agent 从独立暴露面收敛为对应 workflow skill 的内部 prompt 资产。

推荐路径：

1. 先产出完整映射表，确认每个 `agents/*.agent.md` 的目标 skill、目标 prompt 文件名、迁移类型和保留/退役判断。
2. 再分批迁移 prompt 内容到 `skills/<skill>/references/agents/` 或 `skills/<skill>/references/personas/`。
3. 同步改写 workflow skill 的 dispatch 说明，禁止继续把独立 agent 名称或 generated runtime mirror 当作 source。
4. 最后移除或降级 `agents/` 的用户可见暴露，并补 legacy cleanup / runtime projection / contract tests。

迁移应保持 `source-first`：修改 `skills/`、`docs/`、`src/cli/`、`templates/` 等 source；不手改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors。需要刷新 runtime 时走 `spec-first init`。

## 2. Goals

- 建立 `agents/*.agent.md` 到目标 skill 的一一可审计映射。
- 将 workflow 私有 persona/researcher/writer prompt 放回对应 skill 目录，降低全局 agent 暴露面。
- 让每个 workflow skill 自己拥有它调度的 prompt 资产、读取时机、输出 contract 和降级行为。
- 保留现有 code-review、doc-review、plan、ideate、compound、sessions、work 等 workflow 的行为能力。
- 为删除或退役独立 agent 暴露面提供可验证迁移路径，而不是一次性大删。

## 3. Non-goals

- 不把所有 agent 合并成一个通用 prompt。
- 不新增中心化 agent registry 作为第二真相源。
- 不让脚本决定语义迁移归属；脚本只做文件发现、命名校验、frontmatter 检查和引用扫描。
- 不修改 generated runtime mirrors 来证明迁移成功。
- 不在迁移方案阶段重写各 workflow 的审查策略、调度算法或 finding schema。

## 4. Source-of-truth 边界

| 类型 | Source | 迁移处理 |
|---|---|---|
| 旧 agent source | `agents/*.agent.md` | 作为迁移输入，逐个归档到映射表 |
| 目标 skill source | `skills/<skill>/SKILL.md` | 更新内部 prompt 资产读取和 dispatch 说明 |
| 目标 prompt 资产 | `skills/<skill>/references/agents/*.md`、`skills/<skill>/references/personas/*.md` | 迁移后的 prompt 正文位置 |
| workflow/agent 地图 | `docs/workflow-skill-agent-map.md`、`docs/contracts/agents/agent-lifecycle-catalog.md` | 迁移后同步改为 skill-local 视角 |
| runtime mirrors | `.claude/`、`.codex/`、`.agents/skills/` | 不手改；由 `spec-first init` 投射 |
| tests / contracts | `tests/unit/**` | 增加迁移不变量守护 |

## 5. 迁移分类

| 分类 | 含义 | 处理方式 |
|---|---|---|
| 精确迁移 | 旧 agent 与某个 workflow 内部 persona/agent 一一对应 | 删除 frontmatter 后迁入目标 skill 的 `references/agents/` 或 `references/personas/` |
| 多 skill 复用 | 同一旧 agent 被多个 workflow 真实消费 | 按“skill 自包含”原则复制到每个消费 skill；不要跨 skill 引用 |
| 合并迁移 | 多个旧 agent 语义重叠，应由一个当前 persona 承接 | 迁入合并后的目标 prompt，并在映射表记录旧名来源 |
| 替代迁移 | 旧 agent 能力由新 workflow/skill 机制承接，但不保留原 persona 名 | 迁移到替代 prompt 或 workflow 说明，旧名登记为 legacy |
| 退役 | 当前没有明确 consumer 或价值被现有 workflow 覆盖 | 不迁移 prompt；登记清理与文档说明 |

## 6. 目标目录规范

| Prompt 类型 | 目标目录 | 示例 |
|---|---|---|
| research / strategist / helper agent | `skills/<skill>/references/agents/` | `skills/spec-plan/references/agents/repo-research-analyst.md` |
| code-review / doc-review persona | `skills/<skill>/references/personas/` | `skills/spec-code-review/references/personas/correctness-reviewer.md` |
| schema / template / dispatch helper | `skills/<skill>/references/` | `skills/spec-code-review/references/findings-schema.json` |

迁移后的 prompt 文件要求：

- 文件名去掉 `spec-` 前缀，使用 ASCII kebab-case。
- 不保留 YAML frontmatter；模型、工具、权限和 dispatch 策略由调用 skill 控制。
- 只能引用同一 skill 目录树内的文件。
- 需要跨 skill 复用时复制 prompt，而不是相对路径穿越到 sibling skill。
- 执行脚本必须使用 skill-dir anchor 模式，不能依赖 host 专属变量。

## 7. 分阶段执行方案

### Phase 0：冻结盘点口径

产物：

- `agents/*.agent.md` 完整清单。
- `skills/*/SKILL.md` 完整清单。
- 当前 workflow 到 agent 的消费关系清单。

步骤：

1. 用文件扫描统计旧 agent 数量和 skill 数量。
2. 从 `docs/workflow-skill-agent-map.md` 与 `docs/contracts/agents/agent-lifecycle-catalog.md` 提取当前消费者。
3. 扫描 `skills/**` 中对 `spec-*-reviewer`、`spec-*-researcher` 等旧名的引用。
4. 标记已删除、已修改或当前分支中正在变化的 agent，避免覆盖并行工作。

完成条件：

- 所有旧 agent 都进入盘点表。
- 所有当前 workflow consumer 都有来源证据。
- 明确本轮不处理 generated runtime mirrors。

### Phase 1：产出迁移映射表

产物建议：

- `docs/contracts/agents/agent-skill-local-migration-map.md`

表格字段：

| 字段 | 说明 |
|---|---|
| 旧 agent 名称 | 原 `agents/spec-*.agent.md` 名称 |
| 生命周期 | always-on / conditional / deep-dive / deprecated candidate |
| 当前消费者 | 当前哪些 workflow 或手动场景使用它 |
| CE 对应 agent/persona | 参考 compound-engineering 模式后的对应名称 |
| 目标 spec-first skill | 迁移后归属哪个 `skills/<skill>` |
| 目标 prompt 路径 | 迁移后文件路径 |
| 迁移类型 | 精确迁移 / 多 skill 复用 / 合并迁移 / 替代迁移 / 退役 |
| 输出 contract | prose / research digest / code-review schema / doc-review finding 等 |
| 备注 | 合并原因、退役理由、未决问题 |

完成条件：

- 旧 agent 覆盖率 100%。
- 每个非退役 agent 都有目标 skill 和目标 prompt 路径。
- 每个退役 agent 都有退役理由和 cleanup 处理方式。

### Phase 2：迁移低风险 researcher / strategist prompt

优先迁移：

- `spec-plan` 研究类 agent。
- `spec-ideate` 研究类 agent。
- `spec-compound` deep-dive agent。
- `spec-sessions` 的 `session-historian`。
- `spec-slack-research` 的 `slack-researcher`。

原因：

- 多数输出为 prose/research digest。
- 机器可读 schema 依赖少。
- 迁移风险低于 code-review/doc-review personas。

完成条件：

- 目标 prompt 文件已存在于对应 skill。
- 调用 skill 改为读取本 skill 内部 prompt 文件。
- 不再要求用户或 workflow 直接 dispatch 独立 agent 名称。

### Phase 3：迁移 review personas

优先顺序：

1. `spec-doc-review` personas。
2. `spec-code-review` always-on personas。
3. `spec-code-review` conditional personas。
4. stack-specific 和 deep-dive personas。

注意事项：

- `spec-code-review` 的 reviewer JSON schema 仍归 `skills/spec-code-review/references/findings-schema.json`。
- `spec-doc-review` 的 persona 输出 contract 由它自己的 subagent template 注入。
- persona prompt 不重复 schema 全文，只说明角色边界、触发条件、不要报告什么、输出姿态。
- 如果多个旧 migration/data/schema reviewer 合并，合并后的 prompt 必须明确覆盖旧能力边界。

完成条件：

- review skill 能从 skill-local `references/personas/` 读取所有需要的 persona。
- contract tests 覆盖 no-frontmatter、路径自包含、旧独立 agent 引用清理。
- 至少对 `spec-code-review` 和 `spec-doc-review` 做 fresh-source eval 或等价 read-only 语义审查。

### Phase 4：改写调度与生成逻辑

需要检查的 surface：

- `skills/*/SKILL.md`
- `templates/**`
- `src/cli/**`
- `docs/workflow-skill-agent-map.md`
- `docs/contracts/agents/agent-lifecycle-catalog.md`
- runtime projection / package install / clean / doctor 相关测试

改写原则：

- 公开 workflow 仍是用户入口。
- skill 内部 dispatch 使用 generic subagent + skill-local prompt 内容。
- source 文档不再指向 `.claude/agents`、`.codex/agents` 或 `.agents/skills` runtime mirror。
- generated runtime 可以继续由 CLI 投射，但不作为 source。

完成条件：

- `rg` 扫描旧 standalone dispatch 写法不再命中 source。
- runtime generation 测试仍能通过。
- `spec-first init` 仍可从 source 生成 host runtime assets。

### Phase 5：清理旧独立 agent 暴露面

处理策略：

1. 首先从用户文档中降级独立 agent 为 legacy source。
2. 再从 runtime projection 中停止生成独立 agent，或只保留兼容期 warning。
3. 最后删除或保留 `agents/` legacy source，取决于 cleanup 能力和 release 风险。

如果项目已有 legacy cleanup 机制：

- 登记旧 agent 名称。
- 清理 stale flat-install artifacts。
- 测试不会误删用户自定义文件。

如果项目暂时没有 cleanup 机制：

- 先不删除用户机器上的旧 runtime assets。
- 在 `doctor` 或 release notes 中提示旧入口已迁移。

完成条件：

- source 中独立 agent 不再是当前推荐入口。
- 清理策略 preview-first，不 silent delete。
- generated runtime mirrors 可由 source 重新生成并保持一致。

### Phase 6：验证与收口

最小验证：

- `npm run lint:skill-entrypoints`
- `npm run typecheck`
- 受影响 workflow 的聚焦 unit tests
- `git diff --check`
- `npx jest tests/unit/changelog-format.test.js --runInBand`

建议新增或更新的 contract tests：

| 测试目标 | 建议断言 |
|---|---|
| prompt 文件自包含 | `skills/*/references/{agents,personas}` 不跨 skill 引用 |
| prompt 文件无 frontmatter | skill-local prompt asset 不以 `---` YAML frontmatter 开头 |
| 旧 agent 覆盖 | 映射表覆盖所有 `agents/*.agent.md` |
| 调度边界 | workflow dispatch 读取 skill-local prompt，不引用 runtime mirror |
| runtime source 边界 | `.claude/`、`.codex/`、`.agents/skills/` 不作为 source 输入 |
| cleanup 安全 | stale agent 清理只处理 spec-first managed artifacts |

语义验证：

- 对 `spec-code-review`、`spec-doc-review`、`spec-plan`、`spec-work` 做 fresh-source eval 或 read-only reviewer。
- 重点看触发边界、输出 contract、降级行为和 source/runtime 边界有没有漂移。

## 8. 推荐落地顺序

| 批次 | 内容 | 风险 | 说明 |
|---|---|---|---|
| Batch A | 迁移映射表 + 本方案 + 引用扫描 | 低 | 不改变行为，只建立事实基线 |
| Batch B | research/strategist prompt 迁移 | 中低 | prose 输出为主，schema 风险低 |
| Batch C | doc-review personas 迁移 | 中 | 输出 contract 需保持稳定 |
| Batch D | code-review personas 迁移 | 高 | JSON schema、merge/dedupe、confidence gate 需重点验证 |
| Batch E | projection / cleanup / docs 收口 | 高 | 影响用户可见 runtime 与旧入口 |

不要把 Batch B-E 合进一个巨大 PR。每批都应有独立验证和 changelog。

## 9. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 映射错误 | workflow 调错 persona 或丢能力 | 先做映射表审查，再迁移 |
| 多 skill 共享 prompt 后漂移 | 同名 prompt 在多个 skill 中不一致 | 只复制必要 prompt；为 byte-identical 复用资产加 parity test |
| 删除独立 agent 太早 | 用户旧入口失效 | 先降级为 legacy，release 后再 cleanup |
| schema persona 迁移破坏 review 输出 | downstream merge/dedupe 失败 | `spec-code-review` / `spec-doc-review` 聚焦测试和 fresh-source eval |
| runtime mirror 被误当 source | 手改 runtime 后 source 漂移 | 文档和测试都固定 source/runtime 边界 |
| 过度中心化 registry | 又形成第二真相源 | 映射表只做迁移 artifact；迁移完成后以 skill-local prompt 为 owner |

## 10. 完成定义

本迁移完成需要同时满足：

- `agents/` 中每个旧 agent 都有明确状态：已迁移、已合并、已替代、已退役或 legacy-only。
- 当前 workflow 文档与 source 不再把独立 agent 当作推荐调度入口。
- 每个需要 prompt 的 workflow 都能从自己的 skill 目录读取 prompt 资产。
- generated runtime mirrors 可由 source 重新生成，不需要手工修补。
- docs、CHANGELOG、contract tests 和 fresh-source eval 记录能解释迁移边界与验证结果。

## 11. 下一步

建议下一步先执行 Batch A：

1. 新增 `docs/contracts/agents/agent-skill-local-migration-map.md`。
2. 用脚本或一次性扫描生成旧 agent 初始清单。
3. 人工按 consumer 和 CE 对照关系补齐目标 skill 与迁移类型。
4. 做一次 `spec-doc-review` 或 read-only fresh-source review，确认映射表没有高风险遗漏。

Batch A 不迁移文件、不删除旧 agent、不改 runtime projection；它只建立后续迁移的确认基线。
