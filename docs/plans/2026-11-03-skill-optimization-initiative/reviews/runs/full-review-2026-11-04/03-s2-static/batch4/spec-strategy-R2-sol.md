# spec-strategy 评审（R2）

## 逐项裁决表

本表仅裁决 `structure_contract` 静态合同，基于冻结版本 `5b59293bb1aecb40c4894549a89f8b045dfa40fe` 的当前源码；工作区读取时干净。消费者清单仅含标题、未列 tests/src 文件，因此额外检查了直接合同测试、入口投射登记及三个声明中的下游消费点。未运行行为评测，不据此扣减静态裁决，也不推断运行质量或收益。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | fail | `skills/spec-strategy/SKILL.md:71-73`；`skills/spec-strategy/references/strategy-template.md:92` | 两轮后接受未解决答案的出口，与固定指标/工作轨道数量检查缺少例外衔接。 |
| D02 | pass | `skills/spec-strategy/references/interview.md:17-112` | 提供问题诊断、指导性选择、用户情境、结果指标与投入领域的具体反模式，不让脚本代替战略判断。 |
| D03 | fail | `skills/spec-strategy/references/strategy-template.md:83-93`；`skills/spec-strategy/evals/cases/targeted-update-metrics.yaml:3-6,19-22`；`skills/spec-strategy/evals/fixtures/scripts/asks-a-question.sh:17-23` | 存在 prose 检查清单，但定向更新评测仅检查泛化问句，不能兑现其声明的定向性与保留其他内容核验。 |
| D04 | pass | `skills/spec-strategy/references/grounding.md:15-20`；`skills/spec-plan/references/research.md:22`；`skills/spec-ideate/references/grounding.md:58`；`skills/spec-brainstorm/references/dialogue.md:13-15` | 生产者与已检查消费者均采用 STRATEGY 优先、按含义消费、尊重实际来源与项目权威的约定。 |
| D05 | fail | `skills/spec-strategy/references/update-run.md:16`；`skills/spec-strategy/evals/cases/existing-asks-which-section.yaml:3-6`；`tests/unit/spec-strategy-contracts.test.js:21-28` | 更新范围的一句话内同时要求检查所有章节和不审其他章节，且评测说明仍允许已被入口合同排除的旧顺序。 |
| D06 | pass | `skills/spec-strategy/SKILL.md:24-26`；`skills/spec-strategy/references/grounding.md:3,11` | 不绑定特定模型能力；问答工具按能力发现，缺失或调用失败可退回聊天，空仓库有诚实降级路径。 |
| D07 | pass | `tests/unit/spec-strategy-contracts.test.js:21-84`；`skills/spec-strategy/evals/cases/check-owned-update.yaml:4-18` | 有针对更新顺序、作者保护、共享文档和实际字节结果的维护检查；不承担自动经验晋升职责。 |
| D08 | pass | `skills/spec-strategy/SKILL.md:30,57,73,77`；`skills/spec-strategy/references/grounding.md:5-11` | grounding 必读、首跑与更新按分支加载、模板在成稿时读取，并要求有限范围回源。 |
| B01 | pass | `skills/spec-strategy/SKILL.md:3,15-20,34,38,85-90` | 正向入口是创建/维护战略锚点；功能、排期、需求、实施、指标计算均有职责排除或明确去向。 |
| B02 | fail | `skills/spec-strategy/SKILL.md:71-73`；`skills/spec-strategy/references/interview.md:10,150`；`skills/spec-strategy/references/strategy-template.md:92` | 输入可以在追问上限后保留不完整答案，但输出检查没有表示这种合法降级的方式。 |
| B03 | pass | `skills/spec-strategy/SKILL.md:19,73`；`skills/spec-strategy/references/update-run.md:7-12,20`；`skills/spec-strategy/references/grounding.md:17-20` | 写入须在当前授权内，文件形状和 Git 历史不授予权限，保护作者批准内容及旧文件，不重复索取已覆盖的写入授权。 |
| B04 | pass | `src/cli/contracts/dual-host-governance/skills-governance.json:533-547`；`skills/spec-strategy/SKILL.md:11`；`skills/spec-strategy/evals/eval.yaml:3-11` | source 将其登记为 standalone skill，产物是项目 STRATEGY 而非宿主镜像；非隔离评测不能被当作 fresh-source 加载证明，本轮未作此声称。 |
| B05 | pass | `skills/spec-strategy/SKILL.md:24,41,71`；`skills/spec-strategy/references/grounding.md:3,11`；`skills/spec-strategy/references/update-run.md:7-21` | 对本地短访谈职责，已有工具失败回退、缺来源披露、追问上限、重跑分流和写前 diff/保护检查；不承担长任务隔离或后台重试。 |
| B06 | fail | `skills/spec-strategy/evals/cases/update-reads-existing-doc.yaml:3-6,19-28`；`skills/spec-strategy/evals/cases/features-route-to-brainstorm.yaml:3-6,19-27` | 两个评测把“真实完整读取”或“不得写入”的目标简化为输出关键词，可能把关键违约结果判为成功。 |
| X01 | not-applicable | `skills/spec-strategy/SKILL.md:17,38,85-89` | 本 Skill 只维护短战略锚点，不拥有复杂实现的模块分解、依赖编排或集成恢复；这些不能因战略影响面大而强加进来。 |
| X02 | not-applicable | `skills/spec-strategy/SKILL.md:17,85-89`；`skills/spec-strategy/references/grounding.md:15-20` | 不拥有 API、架构或版本迁移；其实际承担的旧战略文档整合已按保留旧源、fold/link 与冲突询问审查，不需新增 ADR/回滚机制。 |
| X03 | not-applicable | `skills/spec-strategy/SKILL.md:85-90`；`skills/spec-strategy/references/update-run.md:12` | 不实施、发布或部署高风险系统；本地共享文档修改的授权与作者保护已纳入 B03，不冒充交付验证。 |
| X04 | pass | `skills/spec-strategy/SKILL.md:11,79-83`；`skills/spec-strategy/references/grounding.md:9,17-20`；`skills/spec-strategy/references/update-run.md:7-12,21`；`skills/spec-ideate/references/grounding.md:58` | 有明确持久产物、内容 ownership、日期、旧源引用和下游回读路径；这是文档型协作交接，不声称构成独立验证或已晋升知识。 |

## Findings

### F1 · P2：追问上限后的合法降级与输出检查不一致

- **位置：** `skills/spec-strategy/SKILL.md:71-73`；`skills/spec-strategy/references/interview.md:10,150`；`skills/spec-strategy/references/strategy-template.md:92`。
- **事实：** 入口要求最多追问两轮，之后记录用户已有答案、不编造、不阻塞整个访谈；模板检查却无条件要求指标为 3–5 个、Tracks 为 2–4 个。
- **触发与后果：** 用户两轮后只确认两个指标或一个投入领域时，执行者无法同时满足两类要求，容易继续追问、补造条目，或无说明地跳过检查。
- **最小修复建议：** 在模板检查中区分“期望质量”与“可写入底线”；明确允许保留用户确认但未达期望数量的内容，并标注待重访。不得为凑数生成战略决定。
- **归属：** 入口/reference/template 的静态合同冲突，不是模型能力不足。

### F2 · P2：更新范围与评测说明存在顺序漂移

- **位置：** `skills/spec-strategy/references/update-run.md:16`；`skills/spec-strategy/evals/cases/existing-asks-which-section.yaml:3-6`；`tests/unit/spec-strategy-contracts.test.js:21-28`。
- **事实：**
  - 更新步骤同一句要求“compare every section”，随后又说“a targeted update does not review other sections”。
  - 评测说明允许 Phase 0 先问目标章节、摘要后置；当前入口与单测则要求先加载更新规则，再做摘要、漂移检查和提问。
- **触发与后果：** 定向更新时可能无谓审查全篇；维护者也可能按旧评测说明接受与当前入口相反的执行顺序。
- **最小修复建议：** 明确区分“全篇读取以保护原有内容”与“目标章节的语义漂移检查”，统一评测说明和当前入口顺序。

### F3 · P2：部分评测的成功判据弱于其声明目标

- **位置：**
  - `skills/spec-strategy/evals/cases/targeted-update-metrics.yaml:3-6,19-22`
  - `skills/spec-strategy/evals/fixtures/scripts/asks-a-question.sh:17-23`
  - `skills/spec-strategy/evals/cases/update-reads-existing-doc.yaml:3-6,19-28`
  - `skills/spec-strategy/evals/cases/features-route-to-brainstorm.yaml:3-6,19-27`
- **事实：**
  - 定向指标更新用例的 judge 只要求出现问号或通用索取词，不检查问题是否针对指标。
  - “真实读取现有文档”用例只检查两个词，不检查读取轨迹或完整摘要。
  - “不得把功能排期写入策略”用例只检查输出提及 `spec-brainstorm`，不检查文件是否被修改。
- **触发与后果：** 泛化提问、复述关键词，乃至先错误写入再建议正确入口，都可能满足成功判据。评测结果不能支持用例描述中的完整 claim。
- **最小修复建议：** 泛化问句检查保留为窄范围 smoke；定向性增加语义判定，禁止写入/保留内容增加实际字节或 diff 核验。读取轨迹无法可靠取得时，收缩用例声明，而非把关键词当作读取证明。
- **已有可复用机制：** `skills/spec-strategy/evals/fixtures/scripts/check-owned-update.sh:52-68,96-97` 已展示基线身份和精确字节差异核验，无需另建评测框架。

## 主责深挖面发现

### B01：入口职责成立，保持现状

`skills/spec-strategy/SKILL.md:34,38,85-90` 将 focus hint 限定为章节选择，并明确功能、排期和实施的其他 owner。策略中的 Tracks 与可选 Milestones 也不是偷偷扩张为任务计划：`references/interview.md:98-112,118-122` 分别约束为投入领域和真实外部里程碑。

**保持现状成立：** 不应强迫所有产品任务先经过 strategy，也不应把“改变 roadmap”的入口描述扩成自动排期权限。

### B02：产物与消费者基本匹配，缺口在降级表达

- 新产物为根目录 `STRATEGY.md`，消费者按含义而非固定标题读取，允许已有文件保留本来结构。
- fold/link 路径保留旧源、不删除旧文件，已检查消费者也支持必要时读取 legacy 内容。
- 不应将 `core/08-skill-contract-protocol.md:29-289` 的主链路拟议 YAML 套给 strategy：该文件未定义 strategy 专属 schema，执行检查表也明确禁止把拟议数量阈值直接视为现行合同（`process/REVIEW-EXECUTION-WORKFLOW.md:45,62`）。
- 实际应修的是 F1，而非新增统一 schema 或强制结构化 handoff 包。

### B03：ownership 分类不是授权，保护规则成立

`references/update-run.md:9-12` 的 solely-owned/multi-writer 是维护形状分类，不是“见到模板标题便获得改写权”。同段明确要求授权、保护非目标正文、禁止动 `author-approved` 内容；`references/grounding.md:17-20` 也不授权删除旧源。

**保持现状成立：** 不应因形状分类启发式本身，就断言存在越权。当前文本已有更高优先级的显式保护规则。相应承诺属于 LLM 执行约定，不能称为工具硬 gate。

### B04：源码身份清楚，常规宿主加载未被本轮验证

入口投射登记覆盖八个宿主，但本 Skill 使用能力匹配和聊天回退，没有宣称专属 API feature parity。`evals/eval.yaml:3-11` 使用 `environment: none` 和 `claude_code` 引擎，因此未来行为评测仍需单独证明实际加载来自哪一份 source/runtime。

**保持现状成立：** 本轮直接读取 worktree 源码，不调用被审 Skill 代替源码评审，也未修改 generated runtime；静态 pass 不外推八宿主实际行为通过。

### X01—X03：维持职责排除，不补建工程编排能力

复杂战略可以影响多模块、高风险实现和架构迁移，但 strategy 本身不拥有这些执行职责。现有边界允许下游根据战略作具体计划，而非让战略文档承载依赖图、测试矩阵、发布检查或回滚脚本。

**保持现状成立：** 这些扩展场景不构成新增 strategy 功能的依据。

### X04：文档型交接成立，勿提升为验证证据

持久根文档、更新日期、作者保护、旧源引用及消费者回读路径，足以支持其声明的战略 grounding 职责。`references/update-run.md:17` 还明确把近期活动视为漂移候选，而非战略变化的裁决。

**限制：** `last_updated` 是文档更新时间，不应被下游解释为每个章节均经重新确认；STRATEGY 是用户方向的记录，不是产品效果已验证的证明。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取请求返回尚未获授权；未绕过权限。后果是无法核对其中额外全局约束，不影响已读取的被审源码、检查表和合同基线定位。
- `skills/spec-ideate/references/grounding.md`：仅补读第 35–67 行的直接消费路径，其余未读；不覆盖 ideate 的完整研究、分发及产物合同。
- `skills/spec-brainstorm/references/dialogue.md`：仅补读第 1–26 行的策略消费与当前树校准路径，其余未读；不覆盖 brainstorm 全访谈行为。
- `skills/spec-plan/references/research.md`：仅补读第 1–90 行，其余未读；不覆盖后续外部研究和计划深化行为。
- `src/cli/contracts/dual-host-governance/skills-governance.json`：仅读取包含 strategy 的登记片段；未展开全部 generator/adapter，故不证明八宿主实际投射或 drift 状态。
- `tests/unit/plugin-modules.test.js`、`tests/unit/ce-u28-outcome-calibration.test.js`、`tests/unit/project-graph-consumption-contracts.test.js`：搜索发现关联后未展开；不对通用投射、跨 Skill judge 校准或 project-graph 行为作结论。
- `skills/spec-product-pulse/references/setup.md`、`skills/spec-product-pulse/references/report-template.md`、`skills/spec-product-pulse/references/strategy-source.md`：由已读合同测试发现的额外消费者，超出入口声明的三个消费者，本轮未展开；因此 D04/X04 的通过不覆盖 product-pulse 消费边。

**必读覆盖：** 被审 `SKILL.md`、全部四份 references、全部 eval 配置/用例/fixture/脚本，以及检查表和合同基线均已完整读取。指定消费者清单只有标题，无列出的 tests/src 文件。未运行测试或行为 eval，未写任何文件。

## 结论一句话

`spec-strategy` 的入口、授权、source/runtime 和文档型交接边界基本成立，但两处静态合同漂移及部分评测过度声明应修正；本轮静态审查完成，不支持宣称对象全项通过或实际收益已验证。
