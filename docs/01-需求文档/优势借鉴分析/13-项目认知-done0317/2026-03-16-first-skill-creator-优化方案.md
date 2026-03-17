---
title: First Skill Creator 优化方案
date: 2026-03-16
status: draft
owner: codex
---

# First Skill Creator 优化方案

> 目标：基于 `skill-creator` 的最佳实践，审查并优化 `skills/spec-first/00-first`，使其成为一份高触发率、低上下文成本、强 contract、低歧义的高质量 skill。

---

## 一、结论

当前 `00-first` skill 已基本完成从旧的 Agent/Markdown 直出模型向 `runtime-first + projection + governance` 模型的收口，但从 `skill-creator` 的标准看，仍存在以下结构性问题：

1. `SKILL.md` 仍偏重，承担了过多总设计文档职责。
2. 主 skill 的目录导航和 QA 文档仍把“Agent”当正式对象，历史标签没有彻底降级。
3. 多个 `references/*.md` 文件名与正文角色仍带有旧 Agent 心智负担。
4. 触发描述不够强，未充分覆盖真实用户表达。
5. reference 层的渐进披露设计还不够理想。
6. active skill 中仍残留 `Phase 3` 等规划态语义。
7. 中文输出 contract 已定义，但没有完全形成强执行门禁。
8. 文档测试仍混有历史升级轨迹断言，质量门禁不够聚焦。

因此，最佳方案不是继续微调单个文件，而是按 `skill-creator` 的方法，对 `00-first` 做一次 **“轻主文件、正式对象收口、按需主题 reference、迁出规划语义、聚焦测试门禁”** 的系统性优化。

---

## 二、优化目标

本轮优化的终态应满足以下 7 条目标：

1. `SKILL.md` 只保留触发、contract、最小流程和 reference 导航。
2. `references/` 按职责清晰分层，历史标签只作为注释，不再作为正式对象。
3. active skill 不再承载规划路线图，只描述当前正式实现。
4. skill 的 frontmatter `description` 能覆盖主要真实触发场景。
5. Codex 在触发 skill 后，可以最小成本决定“还需要读哪个 reference”。
6. 文档语言、产物 contract、条件型规则都形成明确执行门禁。
7. skill 文档测试只守护当前正式模型，不再守护历史迁移阶段。

---

## 三、现状问题

### 3.1 `SKILL.md` 过重

当前 `SKILL.md` 同时承担：

- 产品定位说明
- runtime 分层模型
- 文档产物全清单
- 成功标准
- reference 索引总表
- 执行模型说明

这导致两个问题：

1. 主文件上下文成本偏高。
2. 与 `references/` 容易重复，后续漂移风险高。

按 `skill-creator` 原则，主文件应是另一个 Codex 的“最小上手说明”，而不是完整设计稿。

### 3.2 reference 命名仍带旧模型负担

当前还保留：

- `structure-analysis.md`
- `api-and-dependencies.md`
- `conventions-and-setup.md`
- `domain-model-analysis.md`
- `database-conditional-projection.md`

虽然正文已经在往新模型收口，但文件名仍然暗示“运行时 Agent 直出”。

这会带来两个问题：

1. 对维护者造成持续认知噪音。
2. 让 skill 看起来像“旧模型修补版”，而不是“新模型正式版”。

### 3.3 “Agent” 术语仍被当成正式对象

当前 `SKILL.md` 和 `quality-assurance-rules.md` 中，仍存在以下问题：

- 用“Agent 规格”组织核心 reference
- 用“所有 Agent 必读”描述质量规则
- 用 `Agent 最低要求矩阵` 表示正式文档质量门槛

这会产生一个严重的心智偏差：

- 当前实现明明是 `runtime-first + projection`
- 但 skill 文档仍在把“Agent”重新升格成正式执行对象

更合理的做法是：

- 历史标签只作为理解分析主题的辅助术语
- 正式对象统一改为 `runtime assets`、`projection docs`、`分析主题`、`质量门禁`

### 3.4 frontmatter 触发描述不够强

当前 `description` 能表达“项目认知编译”，但对真实用户说法覆盖还不够完整。

缺失的高频触发表达包括：

- 接手老项目
- 快速了解项目
- 生成或刷新 `docs/first`
- 重建项目认知
- 校验项目认知产物是否完整

`skill-creator` 明确指出：trigger 信息应尽可能集中写在 `description` 中，而不是依赖正文。

### 3.5 渐进披露不够彻底

当前 `references/` 中有些文件属于核心 reference：

- `execution-flow.md`
- `quality-assurance-rules.md`
- `testing-strategy.md`
- `detection-rules.md`

但也有一些文件属于低频专项资料：

- `database-config.md`

如果主文件不明确告诉执行者“什么情况下才读这个文件”，就会造成 reference 被过度加载。

### 3.6 active skill 中仍残留规划态语义

当前 active skill 中仍可见：

- `Phase 3`
- “新增 Phase 3 测试用例”
- 面向未来复合类型优化的规划章节

这类内容适合放在方案文档或路线图里，不适合保留在活跃 skill 中。

原因是：

1. active skill 应只描述当前正式实现。
2. 未落地规划混入执行规范，会降低可信度。
3. 文档测试也会因此被迫守护未来计划，而不是当前 contract。

### 3.7 中文输出 contract 缺少强执行门禁

当前 skill 已规定：

- Markdown 默认中文
- 技术术语和代码标识符保留英文

但还缺一个关键约束：

> 如果实现输出与语言 contract 不一致，应优先修 projection renderer 和测试，而不是接受偏差。

没有这条，语言要求更像“风格偏好”，不是“实现约束”。

### 3.8 文档测试门禁不够聚焦

`first-skill-docs.test.ts` 目前已经比之前更好，但仍存在：

- 历史 Phase 2/3 规划性断言
- skip 测试过多
- 一部分断言仍在为旧升级过程服务

高质量 skill 的测试应只锁定：

- 当前正式 contract
- 当前正式 reference 结构
- 当前禁止行为

而不是锁定历史演进过程。

---

## 四、最佳实践原则

本轮优化建议严格遵循 `skill-creator` 的 7 条最佳实践。

### 4.1 主文件最小化

`SKILL.md` 只保留：

1. skill 是什么
2. 何时触发
3. 当前正式 contract
4. 最小执行流程
5. 何时读取哪个 reference

其余详细说明全部下沉到 `references/`。

### 4.2 正式对象必须与当前实现一致

如果当前正式模型不是运行时 Agent，就不应继续把：

- `Agent 规格`
- `Agent 最低要求矩阵`
- `所有 Agent 必读`

写成正式主心智模型。

最佳做法是先统一“正式对象”：

- `runtime assets`
- `projection docs`
- `分析主题`
- `质量门禁`

然后再处理 reference 文件名。

### 4.3 reference 命名必须反映当前模型

如果当前正式模型不是运行时 Agent，reference 文件名就不应再继续叫 `agent-*` / `agents-*`。

最佳做法是直接按主题命名，而不是按旧执行角色命名。

### 4.4 active skill 只保留当前正式实现

规划路线图、未来阶段、未落地优化，应该下沉到设计/方案文档，而不是 active skill。

### 4.5 触发描述写在 frontmatter，不写在正文里等待被看见

`description` 必须同时覆盖：

- skill 做什么
- 用户会怎么表达这个需求
- 哪些命令和情景应该触发 skill

### 4.6 渐进披露要明确到“什么时候读哪个 reference”

主文件中应明确：

- 默认读哪些核心 reference
- 哪些是数据库专项
- 哪些是质量审查专项
- 哪些是端类型识别专项

### 4.7 测试守护正式模型，不守护历史包袱

skill 文档测试应优先保护：

- `runtime-first`
- `projection-only docs`
- `no ghost outputs`
- `conditional status semantics`
- `中文输出 contract`

---

## 五、推荐优化方案

### 方案总览

推荐采用：

> **轻主文件 + 正式对象收口 + 主题 reference + 强触发 description + 严格渐进披露 + 聚焦测试门禁**

这是当前最优方案。

原因是：

1. 能显著降低 skill 触发后的上下文成本。
2. 能彻底消除旧 Agent 模型重新升格的问题。
3. 能提升 skill 的自动触发率。
4. 能降低后续 reference 漂移风险。
5. 能让实现约束、文档约束和测试约束三者一致。

---

## 六、具体改造建议

### 6.1 收缩 `SKILL.md`

建议保留的章节：

1. skill 简介
2. 触发条件
3. 当前正式 contract
4. 最小执行流程
5. reference 读取规则
6. 核心硬约束

建议移出或压缩的内容：

- 详细产物全清单
- 成功标准长列表
- 过长 reference 索引表
- 过细的历史术语说明

建议新增一节：

#### 按需读取规则

示例：

- Phase C 重命名前，使用当前文件名进行导航；Phase C 完成后，统一切换为新文件名
- 默认只读：`execution-flow.md`、`quality-assurance-rules.md`
- 涉及端类型检测、端类型不明确、或用户显式指定 `--type` 时，再读：`detection-rules.md`、`platform-document-mapping.md`
- 检测到数据库线索、数据库配置识别失败、或用户明确要求数据库认知/诊断时，才读：`database-conditional-projection.md`、`database-config.md`
- 涉及文档质量审查、文档 contract 验证、或测试补齐时，再读：`testing-strategy.md`

同时建议删除或降级以下组织方式：

- `Agent 规格`
- `所有 Agent 必读`
- 过长的“参考清单”表格

改成：

- 核心 reference
- 条件型专项 reference
- 低频质量/审查 reference

### 6.2 先收口正式对象，再重命名 reference

在重命名文件前，先改掉这些正式术语：

| 当前术语 | 建议替换 |
|----------|----------|
| `Agent 规格` | `主题 reference` |
| `所有 Agent 必读` | `全部正式文档共用规则` |
| `Agent 最低要求矩阵` | `正式文档类型最低要求矩阵` |
| `Agent D 特例` | `数据库主题特例` |

这样可以先让主心智模型正确，再处理文件命名。

### 6.3 重命名 5 个专题 reference

建议改名为：

| 当前文件 | 建议新文件名 |
|----------|-------------|
| `structure-analysis.md` | `structure-analysis.md` |
| `api-and-dependencies.md` | `api-and-dependencies.md` |
| `conventions-and-setup.md` | `conventions-and-setup.md` |
| `domain-model-analysis.md` | `domain-model-analysis.md` |
| `database-conditional-projection.md` | `database-conditional-projection.md` |

理由：

- 文件名直接表达当前职责
- 不再误导为运行时 Agent contract
- 更符合 `skill-creator` 强调的“让另一个 Codex 快速理解”

额外说明：

- `subagent-architecture.md` 本轮**不纳入正式重命名清单**
- 原因：它当前更像架构/并发策略文档，而不是主题 reference，优先先改正文角色与标题
- 如后续仍需重命名，可在下一轮统一改为更中性的流水线/并发文档名

### 6.4 移除 active skill 中的规划语义

建议从 active skill 中删除或迁出：

- `Phase 3`
- “新增 Phase 3 测试用例”
- 未落地复合类型检测优化章节

保留原则：

- active skill 只描述当前正式实现
- 路线图写入方案文档
- 测试只守当前 contract

### 6.5 强化 frontmatter `description`

建议把触发条件扩展为覆盖以下语义：

- 接手老项目
- 快速了解项目
- 生成项目认知
- 刷新 `docs/first`
- 重建 `.spec-first/runtime/first`
- 校验 `first` 输出是否完整

建议风格：

- `description` 只描述 **when to use**，不总结 skill 的流程、实现方式或工作步骤
- 先写触发场景与使用时机
- 再覆盖典型用户表达
- 避免把 “生成哪些文档”“如何执行 builder/projection” 这类过程信息写进 `description`

原因：

- 这与本地 `writing-skills` 的规范一致
- 触发描述越聚焦于使用时机，越不容易让模型把 frontmatter 当成正文替代品

### 6.6 把中文输出升级为强执行门禁

建议在 `SKILL.md` 与 `quality-assurance-rules.md` 都补充：

- 如果 Markdown 输出未满足中文 contract，优先修 projection renderer 与测试
- 不接受“skill 要求中文，但实现先英文凑合”的状态

### 6.7 精简 `database-config.md` 的定位

当前它容易被误读成核心 reference。

建议改为：

- 明确标注“低频专项资料”
- 只有在 `database-schema` 识别或配置问题出现时才读取
- 不删除该文件；它是现有有效资料，但不应继续出现在主 skill 的默认阅读路径

### 6.8 重写 `first-skill-docs.test.ts`

建议保留的断言组：

1. `SKILL.md` 的 frontmatter 版本与 description
2. runtime-first 正式口径
3. references 不再承诺 ghost outputs
4. 条件型数据库规则一致
5. 中文输出 contract 存在
6. reference 导航与实际文件一致
7. 统一证据格式仍为核心 contract（不应 skip）

建议删除或长期 skip 的断言组：

- 历史 Phase 2/3 升级轨迹
- 旧 Agent 依赖链断言
- 旧波次超时策略断言

特别说明：

- `should keep unified evidence format in SKILL.md` 应恢复为正式断言，不应继续 skip
- `should keep timeout policy consistent at 60/120/300` 可继续 skip 或删除，因为它属于可演进实现策略，不属于长期正式 contract

---

## 七、推荐实施顺序

### Phase A：主文件收缩

1. 精简 `SKILL.md`
2. 改写 frontmatter `description`
3. 增加“按需读取 reference”规则

### Phase B：正式对象收口

1. 把 `Agent 规格` 等术语替换为主题/正式文档术语
2. 重写 `quality-assurance-rules.md` 的标题与矩阵命名
3. 删除 active skill 中的 `Phase 3` 规划语义

### Phase C：reference 正名

1. 重命名 5 个专题 reference
2. 更新 `SKILL.md` 中的引用
3. 更新文档测试中的路径断言

### Phase D：门禁收口

1. 把中文输出写成强执行门禁
2. 把 `database-config.md` 标记为低频专项资料
3. 精简测试断言到当前正式模型

### Phase E：最终验收

1. skill 文档测试通过
2. reference 名称与正文角色一致
3. 不再存在把历史 Agent 标签当正式对象的写法
4. 触发描述覆盖主要真实场景

---

## 八、优化边界：避免内容失真

本轮优化的重点是**结构收口**，不是**信息删减**。

要避免在优化过程中导致内容失真，必须遵守以下边界。

### 8.1 必须保留的内容

以下内容属于当前 `00-first` skill 的正式 contract，不得因为“主文件收缩”而被删除：

- `runtime-first + projection + governance` 的正式模型
- `.spec-first/runtime/first/` 是机器真源、`docs/first/` 是投影视图
- 正式文档全集与条件型文档规则
- 条件型状态语义：`healthy / not_applicable / degraded`
- 禁止 ghost outputs
- 证据要求与抽样验证要求
- 中文输出 contract
- 数据库条件型能力边界
- 核心 reference 的读取时机

原则：

> 可以换位置、换组织方式、换表达，但不能删除这些正式规则。

### 8.2 只能降级、不能直接删除的内容

以下内容虽然不应继续作为正式对象，但仍有认知价值，应该降级为辅助说明，而不是粗暴删除：

- A1/A2/A3/B/C1/C2/A4/D 历史标签
- 并发/主题划分的辅助理解信息
- 数据库专项中的安全与凭证防护规则
- 端类型识别中的例外与降级策略

正确做法：

- 历史标签只作为“分析主题标签”保留
- 不再作为运行时 Agent contract
- 不再主导主 skill 导航与测试命名

### 8.3 应迁出 active skill 的内容

以下内容不应继续放在活跃 skill 中，但应迁移到设计或方案文档：

- `Phase 2` / `Phase 3` 路线图语义
- 未落地的未来优化计划
- 历史迁移过程说明
- 面向长期演进的规划章节

原则：

> 规划内容可以保留，但不应继续污染 active skill 的正式执行语义。

### 8.4 可以直接清理的内容

以下内容属于纯噪音或误导项，可以直接删除：

- 将历史 Agent 标签写成正式对象的表述
- 暗示“运行时多 Agent 直出 Markdown”的文案
- 未注册产物承诺
- 为历史迁移阶段服务、但已不再反映当前实现的测试断言

### 8.5 一句话执行原则

> 压缩入口，不压缩 contract；清理历史语义，不删除有效知识；迁出规划内容，不弱化当前正式规则。

---

## 九、逐文件审查与改造建议

本节从 active skill 的实际文件出发，逐个说明问题与建议，避免后续执行只停留在抽象原则。

### 9.1 `SKILL.md`

当前问题：

- 主文件仍然过重，同时承载产物清单、reference 总表、成功标准、历史标签说明。
- 仍使用“Agent 规格”“所有 Agent 必读”等表述组织主导航。
- frontmatter `description` 对真实触发语句覆盖不足。

建议改造：

- 收缩为：skill 简介、触发条件、正式 contract、最小执行流程、按需读取规则、核心硬约束。
- 删除“Agent 规格”这一层，统一改为“主题 reference”或“按需 reference”。
- 强化 `description`，纳入“接手老项目”“快速了解项目”“生成或刷新 docs/first”“重建 runtime truth”“审查 first 输出完整性”等表达。

### 9.2 `references/execution-flow.md`

当前问题：

- 整体已基本健康，但仍保留少量历史标签辅助说明。

建议改造：

- 继续保留为核心 reference。
- 只描述当前正式执行链：定位/检测 → runtime 构建 → docs projection → governance。
- 历史标签如保留，只能作为辅助说明，不再主导流程结构。

### 9.3 `references/subagent-architecture.md`

当前问题：

- 正文已说明不是运行时多 Agent 直出 Markdown，但文件名与标题仍暗示 subagent 心智模型。

建议改造：

- 本轮不强制重命名，先修正文角色与标题。
- 如后续仍保留较强 `subagent` 心智负担，再在下一轮改为更中性的并发/流水线主题文档名。
- 保留其“并发边界、降级策略、依赖链约束”的有效内容。

### 9.4 `references/structure-analysis.md`

当前问题：

- 正文已收口，但文件名仍保留 `agents-*` 历史语义。

建议改造：

- 重命名为 `structure-analysis.md` 或等价主题名。
- 继续保留“结构概览 / 架构 / 调用链”三类分析职责。

### 9.5 `references/api-and-dependencies.md`

当前问题：

- 内容健康，主要问题是旧文件名。

建议改造：

- 重命名为 `api-and-dependencies.md`。
- 保留其“对外接口识别 + 外部依赖识别”的主题划分。

### 9.6 `references/conventions-and-setup.md`

当前问题：

- 内容健康，但命名仍保留旧 Agent 语义。

建议改造：

- 重命名为 `conventions-and-setup.md`。
- 保留“规范”和“本地环境”两个主题，不要再映射到运行时 Agent。

### 9.7 `references/domain-model-analysis.md`

当前问题：

- 内容已较简洁，问题主要是命名。

建议改造：

- 重命名为 `domain-model-analysis.md`。
- 继续坚持“先结构化领域事实，再投影 Markdown”的正式边界。

### 9.8 `references/database-conditional-projection.md`

当前问题：

- 内容边界清楚，但命名仍有旧语义。

建议改造：

- 重命名为 `database-conditional-projection.md`。
- 继续保留：
  - `database-schema.json` 是条件型真源
  - `database-er.md` 是条件型文档
  - 明确不生成 `database-index.md` / `database-{name}.md`

### 9.9 `references/detection-rules.md`

当前问题：

- 仍出现“Agent 派发策略”表述。
- active skill 中仍保留 `Phase 3` 规划章节。

建议改造：

- 删除规划态内容，active skill 只保留当前正式识别规则。
- 把“Agent 派发策略”改成“内容侧重点调整”或“分析主题适配”。
- 保留语言/框架/端类型检测、降级策略、Context7 密钥治理等已落地规则。

### 9.10 `references/quality-assurance-rules.md`

当前问题：

- 规则内容有价值，但“全部 Agent 共用”“Agent 最低要求矩阵”“Agent D 特例”会把历史标签重新升格。

建议改造：

- 改名或改标题为“正式文档质量规则”。
- 把 `Agent 最低要求矩阵` 改成 `正式文档类型最低要求矩阵`。
- 把 `Agent D 特例` 改成 `数据库主题特例`。
- 保留证据格式、抽样验证、安全规则等核心质量约束。

### 9.11 `references/testing-strategy.md`

当前问题：

- 核心测试矩阵已正确收口到 runtime-first。
- 仍保留 `Phase 3` 的版本历史记录。

建议改造：

- active skill 中只保留当前正式测试矩阵。
- 删除或迁出路线图式历史版本记录。
- 测试目标聚焦到：registry、projection、governance、条件型状态、中文输出。

### 9.12 `references/platform-document-mapping.md`

当前问题：

- 当前内容与 runtime-first 正式模型一致，问题较少。

建议改造：

- 保持现状。
- 继续明确：正式文档全集固定，端类型只影响内容侧重点与条件型能力适用性。

### 9.13 `references/database-config.md`

当前问题：

- 内容本身有效，但在主 skill 中的层级过高，容易被误读为核心 reference。

建议改造：

- 明确标记为“低频专项资料”。
- 只在数据库线索存在、配置识别失败、或用户明确要求数据库诊断时加载。
- 不再放在主 skill 的核心默认阅读路径里。

### 9.14 `tests/unit/first-skill-docs.test.ts`

当前问题：

- 仍混有历史 `Phase 2/3` 断言与 skip 测试。
- 一部分断言仍在守护迁移过程，而非当前正式 contract。

建议改造：

- 保留：
  - runtime-first 正式口径
  - 无 ghost outputs
  - 条件型数据库规则
  - 中文输出 contract
  - reference 导航与文件存在性一致
- 删除或长期停用：
  - Phase 2/3 路线图断言
  - 历史依赖链断言
  - 旧波次/旧超时模型断言

### 9.15 优先级建议

`P0`

- `SKILL.md`
- `references/quality-assurance-rules.md`
- `references/detection-rules.md`
- `references/testing-strategy.md`

`P1`

- `references/subagent-architecture.md` 的正文角色与标题收口（本轮不强制改文件名）
- 5 个 `agent/agents-*` 主题 reference 的重命名与引用更新

`P2`

- `references/database-config.md`
- `tests/unit/first-skill-docs.test.ts`

顺序说明：

- 不建议把 reference 重命名提前到主文件与正式对象收口之前
- 更优顺序仍是：先修主心智模型，再改文件名
- 否则容易出现“文件名已是新模型，但正文和导航仍在使用旧对象语义”的半收口状态

---

## 十、终态标准

优化完成后，`00-first` skill 应满足：

1. `SKILL.md` 足够短，能在低上下文成本下快速上手。
2. active skill 中的正式对象已全部与 runtime-first 实现一致。
3. `references/` 文件名与当前职责一致。
4. 不再存在“旧 Agent 直出 Markdown”的暗示，也不再把历史标签当正式对象。
5. active skill 中不再残留 `Phase 2 / Phase 3` 路线图语义。
6. `description` 足以高质量触发 skill，且只描述使用时机。
7. Codex 能清楚知道什么时候该读哪个 reference。
8. skill 文档测试只保护当前正式 contract。

---

## 十一、一句话建议

最佳实践不是继续在旧结构上补丁式修文案，而是把 `00-first` skill 彻底优化成：

> **一个由精简主文件驱动、由正确正式对象建模、由按需主题 reference 支撑、由测试锁定正式 contract 的 runtime-first skill。**
