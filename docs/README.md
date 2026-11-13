# spec-first 文档目录索引

本目录连接当前指南、治理基线、工程契约、workflow 产物、验证证据与可复用知识。按阅读目的进入对应目录；不要仅凭日期、文件名、状态或归档位置判断当前实现和完成情况。

## 按任务阅读

| 你要做什么 | 入口 |
|---|---|
| 安装、首次使用、选择 workflow 或排障 | [用户手册](./user-guide/README.md) |
| 判断产品使命、权威与架构演化边界 | [角色契约](./methodology/结构化项目角色契约.md)、[方法论目录](./methodology/README.md) |
| 查找 workflow、artifact、provider 与验证协议 | [工程契约](./contracts/README.md) |
| 理解架构决策的背景与取舍 | [ADR](./adr/README.md) |
| 查找当前能力目录 | [Catalog](./catalog/README.md) |
| 查找可复用解法 | [工程知识](./solutions/README.md) |
| 查找待推进计划或历史方案 | [计划目录](./plans/README.md)、[历史与其他计划索引](./plans/history-index.md) |
| 查找审查报告和验证依据 | [项目审查](./project-reviews/README.md)、[验证证据](./validation/README.md) |
| 查找归档材料或迁移前路径 | [归档说明](./archive/README.md)、[迁移记录](./archive/migrations/README.md) |

## 目录职责

| 路径 | 类型 | 存放内容与边界 |
|---|---|---|
| [user-guide/](./user-guide/README.md) | 当前指南 | 安装、使用、首次走查、场景与排障 |
| [methodology/](./methodology/README.md) | 当前基线与历史谱系 | 角色契约、方法论、专项提示词；历史快照单独标明 |
| [contracts/](./contracts/README.md) | 当前契约 | 工程协议及 schema；稳定路径，不作为普通资料随意迁移 |
| [adr/](./adr/README.md) | 决策记录 | 背景、取舍、后果及后继决策；编号不等于有效性 |
| [catalog/](./catalog/README.md) | 派生导航 | 能力目录；生成文件遵循各自 producer，不能手写为第二真相源 |
| [solutions/](./solutions/README.md) | 可复用知识 | 有依据、适用范围与失效条件的解法 |
| [ideation/](./ideation/README.md) | 探索产物 | 方向、内容选题、候选想法；不代表已采纳 |
| [brainstorms/](./brainstorms/README.md) | 历史需求产物 | 兼容既有 requirements brief；新产物遵循当前 Skill 合同 |
| [plans/](./plans/README.md) | 计划产物 | 现行操作路径保持平铺；状态不等于验收证据 |
| [tasks/](./tasks/README.md) | 派生产物 | 绑定来源计划与版本的 task pack |
| [validation/](./validation/README.md) | 验证证据 | 按验证项目组织报告、输入、日志和原始证据 |
| [project-reviews/](./project-reviews/README.md) | 审查产物 | 项目级审查、问题判断与改进建议 |
| [research/](./research/README.md) | 研究资料 | 外部调研、比较分析和研究基线 |
| [strategic-reviews/](./strategic-reviews/README.md) | 战略专题 | 战略研究、评估与路线提案；不自动成为当前执行指令 |
| [marketing/](./marketing/README.md) | 表达材料 | 文章、配图设计与传播材料；草稿不等于已发布 |
| [releases/](./releases/README.md) | 版本资料 | 历史版本说明；当前版本以 package.json 为准 |
| [assets/](./assets/README.md) | 静态资产 | 文档图片、SVG、品牌展示素材 |
| [archive/](./archive/README.md) | 归档材料 | 被取代的计划、备份、保留讲稿与迁移记录 |

## 根目录保留文档

- [Workflow 架构全景](./workflow-skill-agent-map.md)：辅助导航，具体入口与资产以当前 source 为准。
- [Workflow 节点增强提案](./workflow-enhancement-proposals.md)：历史建议，不代表已实现或当前路线。

## 生命周期与证据边界

- **当前指南／契约**：持续维护；涉及代码行为时仍回到 `skills/`、`src/cli/`、tests 和直接证据。
- **Workflow 产物**：带来源与时点的记录；读取时核对状态、source revision、后继关系与限制。
- **归档**：退出主要阅读入口并保留追溯，不表示删除、任务完成或结论被验证。
- `active` 只表示文档声明的生命周期；`completed` 不是独立完成证据；`superseded` 不等于其候选能力全部已实现。
- Generated runtime mirrors 不属于本目录的 source；不能从 `.claude/`、`.codex/`、`.agents/skills/` 等反向修改 source。

## 放置与维护规则

1. 优先使用既有分类；同一份正文只保留一个权威位置，跨主题通过链接导航。
2. 新增或调整组织目录时补充 README，说明用途、入口、来源及维护边界。原始日志、冻结快照与 fixture 内不机械添加 README，以免改变证据或测试输入。
3. `docs/plans/*.md`、`docs/contracts/` 和治理基线路径被 CLI、Skill 或测试消费。移动前检查真实消费者；不要把活跃计划分入年份子目录。
4. 归档前核对生命周期、后继关系、未提交改动及活跃引用。迁移保留原文，并记录旧路径、新路径与内容 hash；不要只按日期或状态批量移动。
5. 当前导航随迁移更新；冻结历史快照、manifest 和日志不改写。其旧路径通过迁移记录追溯，不承诺旧路径仍可直接打开。
6. 验证证据按项目整包维护；报告、原始输入、输出、hash 与复现方式保持关联。脚本检查路径和完整性，LLM／owner 判断语义有效性与归档适用性。

本次目录整理说明见 [2026-10-31 迁移记录](./archive/migrations/2026-10-31-docs-organization.md)。

## 目录命名规范

- 普通目录使用小写英文 `kebab-case`，不带排序编号、空格或下划线；README 标题和说明使用简体中文。既有中文文档文件名保持不变。
- 集合目录采用自然复数，如 `plans/`、`contracts/`、`releases/`；抽象类别采用自然表达，如 `research/`、`validation/`、`governance/`；保留常用缩写 `adr/`。
- 新建一次性验证或研究专题采用 `YYYY-MM-DD-<topic>/`；持续维护专题使用 `<topic>/`。已有冻结证据包保留原名，不因新规则批量重命名。
- 归档材料按 `archive/<category>/<year>/` 组织；同一系列分篇可保留一个系列目录，如 `archive/ppt-script-v4/`。不为统一层级创建空目录或拆散证据包。
- 不使用 `latest`、`final`、`最新版`、`终版` 等易失效名称；状态、版本和后继关系写入正文或元数据。
- 阅读顺序通过 README 指定；同一层按职责分类，跨主题通过链接导航，不复制正文。
- 组织目录提供 `README.md`：写明用途、内容入口、来源与维护边界；原始 payload、日志、fixture 和冻结快照不机械补文件。
- `docs/plans/*.md` 维持现行 CLI 的平铺约定；`contracts/`、方法论基线等稳定路径迁移时必须同步真实消费者、相关测试和入口生成规则。

目录改名与旧路径追溯见 [2026-10-31 命名迁移记录](./archive/migrations/2026-10-31-docs-naming.md)。
