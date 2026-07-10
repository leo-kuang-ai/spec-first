---
doc_role: template-index
artifact_kind: prd-template-guide
status: active
related:
  - docs/brainstorms/2026-05-30-003-spec-prd-owner-final-requirements.md
  - docs/需求文档模版/原始模版/
created: 2026-05-30
author: leokuang
industry: securities
---

# 标准需求文档模板 — 证券行业使用指南

本目录是从 `docs/需求文档模版/原始模版/` 的 7 份真实团队模板提炼出的**证券行业增量需求模板集**。它服务于 `spec-prd`（增量需求迭代 PRD）的产物形态，遵循 spec-first 的 **WHAT not HOW** 边界。runtime 的通用骨架已内嵌在 `skills/spec-prd/references/prd-output-template.md` 的 embedded runtime skeleton 中；本目录是 human-facing mirror、设计说明和本仓库项目本地行业 overlay 示例，不作为 packaged runtime 的必需读取路径。

> **`spec-prd` 的目标(workflow 定位)**：让产品 owner 在**已有系统**上，把一句话增量需求、低质量碎片或已有 PRD，低成本转成**研发可直接规划的 PRD-grade requirements**——核心区别于"写更长的文档"在于:先结合代码现状与证据对齐系统现实，再确认增量(keep/extend/replace/remove/unknown)，最后产出带优先级、验收、证据标注、行业合规边界的 Markdown PRD，使下游 `spec-plan` 无需发明 WHAT。它**不是** 0-1 产品探索(那是 `spec-brainstorm`)，**不替代** `spec-plan` 决定 HOW，也**不替代**合规/法务确认。本模板库就是这个目标的 human-facing 产物形态。

## 一、行业定位与使用前提

本模板默认面向券商/证券互联网产品，包括 App 客户端、运营/合规/风控 Admin、中台服务、行情、交易、资金、开户、KYC、适当性、审计留痕等增量需求。

与 `docs/brainstorms/2026-05-30-003-spec-prd-owner-final-requirements.md` 的关系：

- 本目录是 **human-facing 标准模板库**，给产品 owner、研发、测试、评审者直接使用。
- `skills/spec-prd/references/prd-output-template.md` 是 `spec-prd` 的 **runtime authoring contract**，其中包含 core section、surface lens、project-local overlay 叠加机制和 embedded runtime skeleton，不依赖本 `docs/` 路径。
- **分层 drift 范围**：通用骨架（core section + surface lens + overlay 叠加机制）由 `prd-output-template.md` 内置、随 workflow assets 分发，drift test 只锁定 embedded runtime skeleton 与本目录通用部分一致；证券行业 C1-C20 checklist 是本仓库项目本地 overlay 示例，不随通用 runtime 默认分发，也不是合规/法务事实源。下游项目可提供自己的本地 overlay。
- 本目录新增或调整通用 core section、surface lens 后，应同步评估并更新 `skills/spec-prd/references/prd-output-template.md`；新增或调整证券 checklist 时，只需评估项目本地 overlay 与 docs mirror，不要求 runtime 内置。
- 本目录里的 checklist 是澄清展示与评审提示，不是 checker 语义校验源。脚本只检查确定性结构与 machine-owned safety section；普通 core-section 缺口最多给 `template_structure_hint`，内容质量由 `$spec-prd` readiness / `$spec-doc-review` 语义判断。

使用前必须先确定四个边界：

| 边界 | PRD 必须写清 |
| --- | --- |
| 监管辖区/展业地 | 中国内地、香港、美国、新加坡或机构自有展业地；跨辖区时不得混用规则 |
| 业务域 | 开户、行情、交易、资金、持仓、风控、投教、客服、运营、合规等 |
| 客户与产品范围 | 零售/专业投资者、现金/保证金账户、股票/基金/期权/债券/衍生品等 |
| 数据与审计边界 | 是否涉及个人信息、交易记录、资金记录、适当性记录、双录、操作留痕、导出 |

本模板不是法务合规意见。监管规则、交易所规则、清结算口径、适当性与 AML 规则必须以目标展业地、牌照主体和合规确认的当期口径为准；不确定项写入 `Outstanding Questions`，不得在 PRD 中写成事实。

## 二、模板清单与如何选

| 模板 | 用途 | 对应 `spec-prd` domain lens |
| --- | --- | --- |
| `00-通用增量需求模板.md` | **主模板**，适配所有 surface 的 80% 场景 | generic（R16/R16b core+conditional 骨架） |
| `10-App客户端需求模板.md` | App/客户端增量需求 | App lens（展业地/灰度/适当性/风险揭示/行情交易/多语言/交互细节） |
| `20-Admin中后台需求模板.md` | Admin/中后台增量需求 | Admin lens（菜单/权限矩阵/任务队列/四眼复核/列表/表单/审计/导出） |
| `30-Backend中台服务需求模板.md` | 后台/中台服务增量需求 | Backend lens（状态语义/业务契约/订单资金一致性/风控/对账/配置/上线） |
| `40-H5-PC端需求模板.md` | H5/PC 浏览器端增量需求 | H5/PC lens（路由/表单/响应式/浏览器行为/登录态/分享/SEO） |
| `50-CLI-DevTool需求模板.md` | CLI、开发者工具、agent-facing workflow 需求 | CLI/DevTool lens（命令/参数/preview-first/输出契约/失败恢复/双宿主） |
| `60-Mixed跨端需求模板.md` | 多端/跨系统/producer-consumer 需求 | Mixed lens（source-of-truth/跨端一致性/异步同步/降级/E2E 验收） |
| `70-大需求总索引模板.md` | 大需求拆成多篇子文档时的**总索引**（只放导航与边界，不承载规则） | index（子文档清单/跨文档依赖/术语指针/整体验收与会签汇总） |
| `90-证券行业需求关注点与参考附录.md` | 共享行业清单、枚举、术语、监管参考 | securities reference lens |

选模板步骤：

1. 先判断 surface。单端明确 → 用对应 lens 模板；多端/跨系统 → 用 `00-通用` + 按需叠加多个 lens 的关注点。
2. 所有 lens 模板都以 `00-通用` 的 **core section** 为底；lens 模板只在其上叠加 surface 专属 section。
3. 写任何证券行业 PRD 前，先读 `90-证券行业需求关注点与参考附录.md` 的横切清单；命中的行业项必须回填到正文。
4. **H5/PC、CLI/DevTool、Mixed 已按扁平文件命名补齐专属 human-facing 模板**。它们仍以 `00-通用` 的 core section 为底，只补 surface 专属澄清视图；不构成第二 runtime template tree。

## 三、证券 PRD 的最小完成标准

一份可进入 `spec-plan` 的证券行业 PRD，至少满足：

| 检查项 | 完成标准 |
| --- | --- |
| 业务边界 | 明确展业地、市场、产品类型、客户类型、账户类型和本期不做 |
| 合规边界 | 标注是否触及监管/适当性/AML/KYC/风险揭示/双录/内容发布审核 |
| 资金交易边界 | 说明是否影响下单、撤单、成交、持仓、购买力、冻结解冻、出入金、交收、对账 |
| 风控边界 | 写清触发条件、拦截/提示/放行结果、人工复核或降级规则 |
| 数据边界 | 标注个人信息、交易记录、资金记录、敏感字段、脱敏、导出、保存期口径 |
| 审计边界 | 写清关键操作是否留痕、留哪些产品级证据、谁可查询、保存口径待谁确认 |
| 多展业地差异 | 差异集中写表，不把地区规则散落在正文 |
| 证据姿态 | 现状和规则均带 evidence tag；无法确认的进入 Outstanding Questions |

## 四、core + conditional 分层（必读）

所有模板遵循 `spec-prd` 的两层模板规则：

- **[core] 始终必填**：PRD 元数据（surface 模板叫「属性确认」）、Summary、Change Delta、Requirements（含优先级分级）、Acceptance Examples、Scope Boundaries（含 Non-Goals）、Evidence And Assumptions、行业横切关注点自检。这是下游 `spec-plan` 消费的最小骨架，缺任一项 plan 就得发明 WHAT。需求优先级（P0/P1/P2 或 MoSCoW + 可降级/是否阻塞上线）是 core 的一部分——专业 PRD 必须回答"排期被砍时先砸哪些"。
- **[conditional] 按需展开**：Problem Frame、Current System Snapshot、Goals / Success Metrics、Glossary、领域模型 / 核心实体、Actors、Use Cases、Interaction、Exception、Data / Compliance Boundaries、非功能需求(NFR)、数据留存期限、需求追溯矩阵、合规/风控会签(Sign-off)、Dependencies / Constraints / Risks、Release Checklist、Outstanding Questions 等。小增量可折叠或省略；**省略项若有未决点，必须落入 Outstanding Questions，不得静默丢弃**。Success Metrics 有可信证据才写目标值，无证据写可观察口径或进入 Assumptions。领域模型仅在需求涉及多个相互关联业务对象时展开；Dependencies / Constraints / Risks 命中外部依赖或高风险时必填。
- 对应 surface 命中时，conditional 升为必填。例如 App 命中交易/行情时必须写交互与展示规则；Backend 命中订单/资金时必须写状态语义、幂等、对账和异常。

## 五、WHAT not HOW 边界（必读）

这套模板写**产品需求**，不写技术方案。原始模板里的接口字段、数据库 schema、状态机副作用、biztype 映射、Nacos/Apollo 配置实现等，已在标准模板中**降级为产品级约束**：

| 写（WHAT，产品约束） | 不写（HOW，留给 `spec-plan`/接口文档） |
| --- | --- |
| 「下单前必须完成适当性校验，不通过则拦截并提示」 | 适当性服务接口、规则引擎实现、字段名 |
| 「该操作必须幂等，重复提交不应产生重复订单/资金变动」 | 幂等键叫什么、用哪个缓存或表实现 |
| 「状态：待审/通过/驳回，通过后不可回退」 | 状态机如何调 MQ/落库 |
| 「配置未设时走老逻辑兜底」 | 配置存 Nacos 还是 Apollo、key 命名 |
| 「行情无权限时展示延时行情并明确标注」 | 行情网关协议、datatype 编码 |
| 「需要操作审计日志，包含操作人/对象/前后值/原因」 | 日志表结构、字段类型 |

PRD 里每条 current-state claim 应带 evidence tag（`confirmed-source` / `user-stated` / `source-candidate` / `external-research` / `assumption`）；无证据内容进 Assumptions 或 Outstanding Questions，不得写成系统事实。

## 六、拆分规则（大需求必读）

一篇文档只写一个独立模块/能力。**不要把多个独立模块塞进一篇大文档**（AI 读取上下文过大、规则互相干扰、验收口径混乱）。

拆分原则：

1. 按业务模块拆：开户 / KYC / CRA / 入金 / 出金 / 下单 / 撤单 / 持仓 / 资金流水分开。
2. 按页面拆：列表 / 详情 / 操作弹窗 / 配置页 / 审批页分开。
3. 按流程节点拆：提交 / 初审 / 复审 / 驳回 / 补材料 / 撤回 / 归档分开。
4. 按用户角色拆：客户侧 / 运营端 / 风控端 / 合规端 / 主管端分开。
5. 通用能力单独写：备注 / 附件 / 操作日志 / 权限 / 导出 / 风险揭示 / 双录不要散落。

建议单篇 ≤ 800 行 / ≤ 20K tokens。超出继续拆子文档。多个文档属同一大需求时，建总索引文档（只放导航和边界，不承载具体规则）——用 `70-大需求总索引模板.md`。跨文档引用写明文档名 + 章节名，不写「见上文」。

## 七、需求质量反模式清单（写之前自检）

提炼自客户端开发组沉淀的真实踩坑，并补充证券行业高频风险：

1. **视角局限于当前模块**，缺乏跨模块/跨链路一致性 → 相同逻辑各自实现、规则不一致。
2. **上下文不足**，过度依赖开发经验补全 → 只写结果，缺背景/意图/上下游影响。
3. **历史逻辑复用描述模糊** → 「沿用历史逻辑」「与之前一致」隐藏隐性改动，必须写差异点与影响范围。
4. **需求边界不清，夹带需求** → 与核心目标无关的内容混入，范围膨胀。
5. **异常/极限场景不足** → 只关注主流程，忽略异常输入、边界、状态切换、并发、弱网、部分成功、数据一致性。
6. **金融规则不精确** → 只说"美股"不说市场/证券类型/订单类型/交易时段/账户类型；价格/数量缺精度、单位、最小变动价位。
7. **资金/交易副作用未声明** → 没写是否影响购买力、冻结、成交、清算、对账、账单展示。
8. **适当性和风险揭示缺失** → 高风险产品或复杂服务未写客户分类、风险匹配、确认留痕。
9. **AML/KYC 触发条件不清** → 开户、资料变更、入出金、异常交易、证件过期等未写审核和限制口径。
10. **缺交互细节与状态定义** → 按钮状态、加载态、异常提示、动效、禁用逻辑描述不足。
11. **多语言/配置化数据缺失** → 只给界面可见文案，隐藏逻辑文案/配置/埋点缺失，导致返工。
12. **UI 设计稿与产品稿不同步**。

### 七b、交付前自检清单（handoff 给 spec-plan / doc-review 之前）

§7 是"写之前"防错；本清单是"交付前"过一遍的 gate（与 `prd-readiness-lens` 互补、human-facing 版）：

**完整性**
- [ ] 每条 core 需求都有优先级、验收样例、证据 tag
- [ ] Change Delta 分清 keep/extend/replace/remove/unknown，历史逻辑写了差异不是"沿用一致"
- [ ] 命中的行业关注点(C1-C20)都标了"适用/不涉及"，无留空
- [ ] 触及资金/交易/权限/数据/审计时，边界与合规点已显式标注或入 Outstanding Questions

**质量**
- [ ] 无模糊词："等"、"相关"、"合适的"、"更好"、"优化体验"——每条都换成可验收表述
- [ ] 有量化口径(数量/时延/精度/状态)而非定性描述
- [ ] 现状 claim 与用户说法冲突时已标 contradiction + source tag，未把猜测写成事实
- [ ] 不含 HOW(接口字段/schema/表结构/任务拆解)——那是 `spec-plan`

**可读性 / 一致性**
- [ ] 术语在 Glossary 有定义且全文一致(同一概念不混用账户/客户/用户)
- [ ] 前后无矛盾(Scope 说不做的，需求里没偷偷出现)
- [ ] 表格对齐、层级清晰、流程图与文字一致

**修改建议格式（refine intent 用）**：给反馈时用 `原文 → 建议 → 原因` 三段，让作者能直接改，而非泛泛"建议完善"。

## 八、与 spec-first 链路衔接

```text
spec-prd（用本目录模板产出 PRD）
  → docs/brainstorms/*-requirements.md（PRD artifact）
  → spec-plan（HOW：技术方案、接口、schema、任务）
  → spec-write-tasks → spec-work → spec-code-review → spec-compound
```

PRD 完成后：产品行为已明确、下游无需发明 WHAT → 进 `spec-plan`；需查完整性 → `spec-doc-review`；**不要**直接进 `spec-work`。

## 九、原始模板 ↔ 标准库校准映射（沉淀,供对照）

本标准库由 `docs/需求文档模版/原始模版/` 的 7 份真实团队模板(AI友好大纲、PRD标准模板、通用、Admin前端、基础、客户端开发组、中台一组)结合业界标准 PRD 实践(Spec Kit、ProductPlan、Atlassian、Aha、Lenny)提炼。下表固化"原始内容去了哪 / 为什么有些没进标准库",避免后续对照原始模板时重复质疑。

**产品级内容 → 已覆盖映射**

| 原始模板内容 | 标准库落点 |
| --- | --- |
| 一句话需求 / 背景 / 范围(做/不做) | `00` Summary / Problem Frame / Scope Boundaries |
| 需求属性(展业地/灰度/合规/第三方/大字号) | `00` PRD 元数据 + `10`/`30` 属性确认 |
| 需求目标 / 衡量标准 | `00` Goals / Success Metrics |
| 用户角色 / 使用场景 / 用户故事 | `00` Actors / Use Cases（UC+EARS 取代裸 user story） |
| 业务规则 / 异常 / 验收 | `00` Requirements+BR / Exception / Acceptance(GWT) |
| 功能优先级 / 可降级 / 阻塞上线 | `00` Requirements 优先级分级 |
| 名词解释 / 核心实体 / 实体关系 | `00` Glossary / 领域模型 |
| 数据字段「含义」/ 数据口径 | `00` Data / Compliance Boundaries |
| 状态机流转 | `30` Backend 状态语义 |
| 与线上对比 / 历史版本 / 存量数据 | `30` Backend + `00` Change Delta |
| 配置项 / 生效时效 / 上线 Checklist | `30` Backend / `00` Release Readiness |
| 业务域依赖 / 依赖事项 | `00` Dependencies / Constraints / Risks + `30` 业务域依赖 |
| 菜单 / 权限 / 列表 / 表单 / 枚举 / 脱敏 | `20` Admin |
| 多语言文案 / 埋点 | `10` App |
| 非功能(性能/兼容) | `20` Admin 非功能 + `30` 契约期望 |
| 责任人 / 版本记录 / 相关文档 | `00` PRD 元数据 / 变更记录 |

**有意排除(WHAT-not-HOW 边界,不是遗漏)**

这些原始模板有、标准库**故意不收**,因为属 HOW,归 `spec-plan` 与接口文档:

- 接口清单 / 入参出参 / 接口详情（原始「通用」§9、「中台一组」附录、「PRD标准模板」前端描述）
- 数据字段的类型 / 唯一约束 / 自增逻辑 / 命名（「PRD标准模板」§3.6 数据字段定义）
- Biztype / Bizcode 映射（「中台一组」§9.2）
- 事件定义 MQ 生产/消费 / 事件键（原始「通用」§9.3）
- 状态机的副作用调用、落库、配置中间件选型

**暂不收(归 v2 大需求场景)**

- 「PRD标准模板」§3.7 需求列表(功能模块→一级/二级功能树):是功能清单分解视角,与 v1 的"R 编号 + 优先级"是两种组织方式,更接近 v2 packet 分解,留给 `docs/02-架构设计/需求拆分/大需求拆分.md` 描述的演化阶段。

> 校准基线:7 份原始模板的**产品级**内容已被标准库完整覆盖,排除项落在 WHAT-not-HOW 正确边界,无失真。新增原始模板后应回到本表评估增量。
