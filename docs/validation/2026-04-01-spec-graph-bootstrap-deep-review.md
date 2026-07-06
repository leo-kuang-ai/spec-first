# spec-graph-bootstrap 深度审查与优化方案

> 审查时间: 2026-04-01
> 审查对象: `skills/spec-graph-bootstrap/SKILL.md`、`skills/spec-graph-bootstrap/references/prd-template.md`、`skills/spec-graph-bootstrap/references/database-prd-template.md`
> 参考工件: `templates/claude/commands/spec/graph-bootstrap.md`、`docs/plans/2026-03-31-spec-graph-bootstrap-design.md`、`tests/smoke/cli.sh`
> 审查目标: 评估 `spec-graph-bootstrap` 的 prompt 契约质量、执行可靠性和后续优化优先级

---

## 一、审查结论

### 1.1 总体判断

`spec-graph-bootstrap` 的核心设计是成立的，且已经具备较强的工程约束：

- 三阶段编排清晰：Phase 1 分析，Phase 2 写 PRD，Phase 3 分发 worker
- 文件所有权边界明确：worker 只写各自持有的上下文文件
- 降级链完整：分析能力从 Full → Enhanced → Basic，数据库访问从 MCP → CLI → ORM inference
- 安全约束明确：不写密码、不信任预配置 MCP 连接、失败时有 backup/restore 策略

它当前的主要问题，不是“无法执行”，而是“执行契约还可以更稳”：

1. 有些关键步骤仍偏抽象，跨宿主平台时容易出现执行风格不一致
2. PRD 模板已有验收标准，但缺少更强的自检提示，容易影响 AI 遵从度
3. 文档中混用中英文术语，增加了 prompt 消费时的格式漂移风险
4. 若想把这套模式推广到其他 supporting workflow，还缺少显式的设计规范沉淀

### 1.2 重新校准后的评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 概念设计 | ★★★★★ | 三阶段编排、PRD 合同、文件边界、降级链都比较成熟 |
| 执行完整性 | ★★★★☆ | 已可执行，但部分提示可进一步具体化 |
| AI 可理解性 | ★★★☆☆ | 结构清晰，但中英混用和部分抽象指令会降低稳定性 |
| 安全设计 | ★★★★★ | 凭证保护、MCP 一致性校验、失败恢复都很强 |
| 可复用规范 | ★★★☆☆ | 设计模式已隐含存在，但尚未抽成显式规范 |
| 模板质量 | ★★★★☆ | 模板骨架完整，建议补 few-shot 与自检强化 |

### 1.3 审查边界

本报告基于当前仓库静态工件交叉审查，不包含一次真实 `spec-graph-bootstrap` 运行的端到端实测。

因此，本文将问题分为两类：

- **确认问题**: 可以直接从现有文件中证明，且优化方向明确
- **优化建议**: 当前实现仍可工作，但通过补充契约可提升一致性和复用性

---

## 二、确认问题

### P1-1: Worker Dispatch 过于抽象，容易导致跨平台执行风格不一致

**位置**

- `skills/spec-graph-bootstrap/SKILL.md` §3.2
- `docs/plans/2026-03-31-spec-graph-bootstrap-design.md` §执行模型

**现状**

`SKILL.md` 已明确要求：

- worker 读取 `.context/spec-first/bootstrap/<slug>/tasks/<task-id>/prd.md`
- 只写 `Files to Fill`
- 不改源码
- 不跑 git 命令
- 可并行执行

这说明主契约已经存在，不能把它定性为“阻塞缺陷”。

但它仍然偏宿主无关的抽象描述，没有进一步说明：

- 编排器给 worker 的最小提示词应包含哪些固定字段
- 什么时候可以安全并行
- worker 完成后需要回报哪些最小结果

**影响**

在 Claude、Codex 或未来其他宿主中，执行结果仍可能一致，但执行风格和失败报告格式会不一致，增加维护成本。

**建议**

保留平台无关设计，不要把文档硬编码为某个 `Agent(...)` API。

更好的做法是在 `SKILL.md` 中增加一个“平台无关 dispatch contract”小节，明确以下最小契约：

```markdown
### 3.2 Worker Dispatch Contract

For each task, the orchestrator must pass the worker:

- task id
- absolute or repo-relative PRD path
- ownership boundary ("write only Files to Fill")
- execution guardrails ("no source changes", "no git commands")
- completion contract ("report produced files and any missing evidence")

Workers with no file overlap may run in parallel.
If a worker exceeds 20 minutes, treat it as failed and apply Phase 3.4.
```

这样既保留跨平台能力，也减少执行歧义。

---

### P1-2: PRD 模板有验收标准，但缺少显式自检提示

**位置**

- `skills/spec-graph-bootstrap/references/prd-template.md` §Acceptance Criteria

**现状**

当前模板已经包含以下检查项：

- 文件都已生成且非空
- 不含占位符
- 至少引用 2 个真实代码工件
- 使用结构化 Markdown
- 不改源码
- `index.md` 与实际输出一致

所以“完全缺少自检”这个说法并不准确。

真正的问题是：这些标准目前是“交付验收条件”，而不是“提交前必须逐项自查的操作指令”。

**影响**

对 AI worker 来说，显式的 `Before reporting completion, verify ...` 往往比被动的 checklist 更容易提高遵从度。

**建议**

在 `Acceptance Criteria` 之后补一段简短 `Self-Check`，不必重复发明新规则，只要把现有标准转成执行前动作即可：

```markdown
### Self-Check

Before reporting completion, verify:

1. every owned file is present and non-empty
2. no placeholder text remains
3. each file references concrete project artifacts
4. no source code file was modified
5. `index.md` only links to files that actually exist
```

这属于提示增强，不属于阻塞修复。

---

### P1-3: 语言混杂会放大输出漂移

**位置**

- `skills/spec-graph-bootstrap/SKILL.md` §1.3、§1.5、§3.3
- `skills/spec-graph-bootstrap/references/database-prd-template.md` §2.4、§3.1

**现状**

文档主体偏英文，但其中混入了中文状态标记和中文实体类型，例如：

- `检测可用工具并输出模式`
- `[MCP 已验证 ✓]`
- `主数据 / 事务 / 关系/明细 / 配置 / 审计 / 缓存`

**影响**

- 同一 worker 在不同段落之间可能切换语言
- 输出文档命名与正文语言可能不一致
- 后续如果把这些文档作为其他 workflow 的上下文输入，检索和复用会变得更不稳定

**建议**

二选一，不要混用：

1. 全英文主文档，中文术语放附录
2. 全中文主文档，保留必要英文关键字和文件路径

鉴于本仓库大量用户文档为中文，且 `.developer` 已有 `lang` 约定，短期更现实的是方案 2：保持中文优先，同时把状态标记样式统一。

---

## 三、优化建议

### P2-1: 增加 PRD 质量门，减少“上下文不足”的 worker 输出

**位置**

- `skills/spec-graph-bootstrap/SKILL.md` Phase 2 与 Phase 3 之间

**原因**

当前设计要求编排器把 Phase 1 的发现直接写进 PRD，但没有一个显式门槛说明“什么样的 PRD 才足够交给 worker 执行”。

这不是功能缺失，因为 worker 仍然可以工作；但如果 PRD 里的 `Context` 过于泛化，输出质量会明显下降。

**建议**

增加一个轻量级质量门，而不是复杂的人审流程：

```markdown
### 2.5 PRD Quality Gate

Before dispatching a worker, verify:

- Goal is specific to the task
- Context includes concrete project evidence
- Files to Fill are exact paths, not abstract categories
- Technical Notes include at least one project-specific constraint
```

重点是“防止空泛 PRD”，不是引入新的审批环节。

---

### P2-2: 为数据库过滤规则补参考 SQL，但保留“启发式”表述

**位置**

- `skills/spec-graph-bootstrap/references/database-prd-template.md` §2.2

**现状**

当前文档已经给出了：

- 后缀规则
- 前缀规则
- 日期模式
- stale heuristic

这足以表达规则意图，因此不能算“缺失关键逻辑”。

但如果希望不同 worker 在 CLI/MCP 下尽量采用一致策略，增加参考 SQL 会更稳。

**建议**

补充一小段“Reference SQL (optional)”即可，注意不要把 SQL 写成唯一实现方式。这里仍应保留当前文档的启发式定位，因为：

- 不同 MySQL 版本元数据字段可用性不同
- MCP 与 CLI 的查询路径并不完全相同
- stale heuristic 本质上就带判断色彩

---

### P2-3: 为 PRD 模板增加一个精简 few-shot 示例

**位置**

- `skills/spec-graph-bootstrap/references/prd-template.md`

**原因**

现有模板结构完整，但全是占位符。对于文档型 worker，给一个短小但完整的实例，通常能明显降低格式漂移和空话输出。

**建议**

在模板末尾补一个精简示例，覆盖以下字段即可：

- Goal
- Context
- Tools Available
- Files to Fill
- Technical Notes

不需要写满所有章节，也不需要引入虚构复杂案例；重点是示范“应该填多具体”。

---

### P2-4: 把隐式设计模式抽成显式规范

**价值**

`spec-graph-bootstrap` 已经沉淀出一套很值得复用的 prompt 工程模式：

1. **PRD Task Contract**: 主控生成任务合同，worker 只消费合同
2. **File Ownership Boundary**: 用输出文件边界替代口头职责边界
3. **Conditional Generation**: 检测驱动输出，而不是先生成空模板
4. **Multi-Level Degradation**: 工具能力不足时按能力退化，而不是整体失败
5. **Failure Recovery**: rerun 时先 backup，再按结果决定 restore 或保留 partial

**建议**

这些内容更适合沉淀到架构文档里，而不是继续散落在单个 skill 中。可以新增一份专门文档，例如：

- `docs/02-架构设计/03-agent-workflow-patterns.md`

这会比在当前报告里做“业界横向对比”更有实际价值。

---

## 四、不建议继续坚持的判断

以下结论不够稳，建议从文档里删除或降级为备注：

### 4.1 “缺少 Agent tool 调用模板，所以 worker 无法正常工作”

不成立。

原因是 `spec-graph-bootstrap` 从设计上就是跨宿主平台的 supporting workflow：

- `skills/spec-graph-bootstrap/SKILL.md` 同时声明 Claude 与 Codex 入口
- `templates/claude/commands/spec/graph-bootstrap.md` 只是 Claude 命令入口，不是 skill 主契约
- `docs/plans/2026-03-31-spec-graph-bootstrap-design.md` 明确写了当前设计“不做 platform gating”

因此，最合理的方向是补“平台无关的 dispatch contract”，而不是写死某个宿主 API。

### 4.2 “目录预创建缺失是 P0 阻塞问题”

证据不足。

这条建议不是没价值，而是目前缺少足够证据证明：

- 当前宿主写文件时一定不会自动创建父目录
- Phase 3 的实际运行里已经因为这个问题失败

更稳妥的写法是：如果后续运行中观察到目录创建失败，再把它提升为确认问题；否则先作为防御性优化建议保留即可。

### 4.3 “所有 skill 都严格遵循命令-Skill-代理三层解耦”

超出审查边界。

本报告只审查了 `spec-graph-bootstrap` 相关工件，不应对“所有 skill”下全局判断。更准确的表述应该是：

> `spec-graph-bootstrap` 及其当前命令入口，符合命令入口与 skill 主契约分层的设计方向。

### 4.4 无证据的业界对标和“唯一性”表述

不建议保留。

像“目前唯一”“某框架都不具备某能力”这类说法，如果没有可复现来源和对标方法，会显著拉低整份工程文档的可信度。

对这类内部优化文档来说，最重要的是：

- 是否准确描述了当前实现
- 是否明确区分了缺陷与增强项
- 是否给出了低风险、可落地的下一步

这比外部竞品对标更重要。

---

## 五、推荐实施顺序

### 第一批: 低风险高收益

1. 在 `SKILL.md` 增加平台无关的 `Worker Dispatch Contract`
2. 在 `prd-template.md` 增加简短 `Self-Check`
3. 统一 `spec-graph-bootstrap` 相关文档的语言和状态标记样式

### 第二批: 提升输出稳定性

1. 在 Phase 2 后增加轻量 `PRD Quality Gate`
2. 在 `prd-template.md` 增加一个精简 few-shot 示例
3. 在 `database-prd-template.md` 补充 optional reference SQL

### 第三批: 形成可复用规范

1. 把 PRD 合同、文件所有权、降级链、恢复策略抽成架构文档
2. 再决定是否要引入更强的状态机图或结构化执行日志

---

## 六、总结

`spec-graph-bootstrap` 当前更准确的评价是：

- **设计层面已经成熟**
- **执行层面已经可用**
- **契约层面仍有一批值得补强的细节**

因此，这份优化方案不应再把问题表述成“系统性执行缺陷”或“多个 P0 阻塞项”。

更合理的结论是：

1. 保留现有三阶段编排、PRD 合同、文件所有权、降级链与恢复策略
2. 用少量文档增强来提高 worker 一致性，而不是重写整体执行模型
3. 优先补强平台无关 dispatch contract、自检提示、语言统一和 PRD 质量门

按这个路径推进，能在不破坏现有设计边界的前提下，明显提高 `spec-graph-bootstrap` 的 prompt 稳定性和复用价值。
