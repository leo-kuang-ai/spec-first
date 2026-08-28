---
name: spec-project-rules
description: "Use this standalone skill when the user asks to build or refresh a project architecture knowledge base before development in a multi-end monorepo (app/h5/admin/backend services in one workspace), capture which end owns what, dependency direction, and shared-layer reuse contracts into a fixed directory, or incrementally write newly confirmed conventions back into that knowledge base during development. Do not use for mining coding-style rules only, capturing a single solved problem as learning, code review/debug/refactor work, linter/formatter configuration, or generated runtime mirror edits."
---

# Spec Project Rules

## Purpose

`spec-project-rules` 把多端 monorepo 中依赖"人对项目的理解"的架构边界知识——各端职责归属、依赖方向禁区、shared 层复用契约、高价值隐式约定——从代码证据梳理成目标仓库固定目录下的结构化知识库，并让 `AGENTS.md` / `CLAUDE.md` 指向它。它是 standalone skill，不是 `spec-*` public workflow。

解决的问题是：AI 会话每次进入多端 workspace 都是白纸，只能临时读代码猜边界，导致跨端改动破坏归属、重复造轮子、违背项目约定。知识库把这类理解外显为 AI 可消费、随项目演化而更新的持久资产。

一级产物是架构边界知识；编码约定是二级产物，只收影响 AI 生成正确性的高信号规则，不收纯风格偏好。

## When To Use

- 使用本 skill：用户要“梳理项目架构/边界规范（各端职责、依赖方向、复用边界）”“开发前建立架构知识库”“整理这个 monorepo 各端职责/依赖方向/复用边界”，或开发中明确要“把这条新确认的约定回写进知识库”“更新 docs/architecture/”。
- 单端或无 shared 层的仓库在用户明确要求时也可降级运行（见 Failure Modes）；知识库价值以多端 workspace 为设计目标，仅挖编码风格规则仍走 `spec-rule-miner`。

## When Not To Use

- 不使用本 skill：用户只要挖掘编码风格规则（`spec-rule-miner`）、沉淀单个已解决问题的经验（`spec-compound`）、审查 diff（`spec-code-review`）、修复或重构代码（`spec-work` / `spec-debug`）、写 lint/format 配置、生成通用语言规范。
- 全量业务词汇表归 `CONCEPTS.md` / `spec-compound`，本 skill 只管理与边界/契约直接相关的术语。
- 近邻路由：只问编码风格习惯走 `spec-rule-miner`；问题粒度 learning 走 `spec-compound`；创建或修改 spec-first source skill 走 `spec-write-skill`；CodeGraph/Graphify readiness 走 `spec-runtime-setup`。
- 与 `spec-rule-miner` 的边界：`spec-rule-miner` 产出编码风格规则（`docs/ai/project-rules.md`）；本 skill 产出架构边界知识库（`docs/architecture/`），编码约定只作为附带小节。两者同时存在时互不改写对方产物。

## Inputs

- `target_repo`：必须是一个明确的本地目标仓库；父级多仓工作区必须先锁定一个目标仓库，不清楚时只问一个问题。
- 当前仓库的人写源码、测试、构建配置、已有文档（README/ADR/目录说明）和已有 agent rule 文件。
- update 模式额外需要：用户说明本次要沉淀的约定或声称的边界变化。

## Outputs

- `knowledge_base`：写入 `docs/architecture/` 的五个文件（`index.md` 含 pre-development 指针区骨架：只放各族 owner 路径，治理/动态两族待后续版本加入）——`index.md`、`workspace-map.md`、`dependency-rules.md`、`reuse-contracts.md`、`coding-rules.md`；managed block 使用 `spec-project-rules-start` / `spec-project-rules-end` markers。结构见 [Knowledge Format](references/knowledge-format.md)。
- `evidence_summary`：每个规则/边界的代表性 source refs 与证据等级（`confirmed` / `inferred`）；不写入知识库正文，除非用户明确要求。
- `target_files`：知识库目录内文件（默认 `docs/architecture/`，用户显式指定目录时为该目录且五文件结构不变）与 AGENTS.md/CLAUDE.md pointer。
- `module_files`：分层装载启用时，`docs/architecture/modules/<module>.md` 与对应模块目录的入口 pointer；未启用时无此项。
- `limitations`：抽样范围、未覆盖端、样本不足、混合语言、生成代码占比、历史例外、冲突模式跳过、refresh no-op、headless 默认写入等限制。

## Hard Boundaries

- 目标仓库只读；唯一允许写入的是知识库目录（默认 `docs/architecture/`，用户显式指定目录时跟随；分层启用时含其 `modules/` 子目录）与仓库根及模块目录下 `AGENTS.md` / `CLAUDE.md` 的 managed pointer。不改业务源码、测试、构建配置、formatter/linter 配置，不合并不改写 `docs/ai/project-rules.md` 等其他 skill 的产物（只读冲突检测口径见 [Knowledge Format](references/knowledge-format.md)）。
- Host-projected copies are outside this skill's targets；具体禁区见 [Knowledge Format](references/knowledge-format.md)。宿主投影过期时从 source 运行 `spec-first init` 修复。
- 写入前必须 preview 知识库内容与目标文件；交互可用时等待用户确认。允许跳过等待、直接使用默认目标的只有两种情形：
  - 用户明确要求直接写入；
  - 宿主或调用参数明确证明当前运行是 headless/non-interactive（普通聊天里用户暂未回复不算 headless）。
  跳过等待时必须在 closeout 记录 `headless_default_write`、判定依据、目标文件和限制。
- 不覆盖用户已有内容：只替换 markers 内的 managed block；无 markers 时追加；疑似旧版无 marker 输出时先询问。
- 每条边界/规则必须有当前仓库证据：存在性证据（支撑"必须/总是如此"类规则）默认至少 2 个文件支撑；缺失性证据（支撑"禁止/无此依赖"类规则）记录可复现的检索式与命中数，不适用 2 文件门槛（写法见 [Knowledge Format](references/knowledge-format.md)）；小仓库样本不足时降级说明 sample-size；50/50 分裂的模式不写成规则。证据分级：团队明文（README/ADR/规范文档）支撑为 `confirmed`，代码反推为 `inferred` 且必须带 source refs。
- 编码约定价值密度门槛：只收偏离语言默认且影响 AI 生成正确性的隐式约定（hidden associations、anti-patterns、"必须走某封装"类规则）；formatter/linter 已强制的只记"已由工具处理"，纯风格偏好不进知识库。
- 既有架构违规只能写成"历史例外"并收窄措辞（"新增代码优先沿用主模式""不要扩大例外"），不得把违规现状写成规则或绝对禁令。
- 不泄露敏感信息：密钥、内部 URL、私有包名、账号、生产路径、安全实现细节只用于判断，不进入知识库。

## Workflow

1. 明确 `target_repo`，按判定序确定模式（先命中先赢）：
   - 用户明确要求全量 refresh 或重建 → bootstrap/refresh 模式；同时带新约定时，全量重取证据后在合成阶段一并纳入，不进 update 分支。
   - 五个知识库文件存在且含本 skill markers，且用户要求的是校验而非变更 → verify 模式：运行 `scripts/verify-deps.cjs`（构建系统受支持时）重提取依赖图核对 DEP 表，并扫描各规则 source refs 存活，输出 stale/违规候选清单（stale 候选须标注双原因：code-drift 或 model-obsolescence）；不写知识库文件。构建系统不受支持时降级为 refs 存活扫描并在输出中说明。
   - 五个知识库文件存在且含本 skill markers，用户描述了新约定/边界变化 → update 模式。
   - 其余情形（目录不存在；目录存在但为空或缺 managed 文件；目录内是用户手写文档）→ bootstrap 模式；与已有文档并存时在 preview 中给出共存或迁移选项，交用户裁决。
2. 盘点 workspace 拓扑：识别各端（app/h5/admin/后台服务等）、包/构建单元边界、主要技术栈、shared 层位置、依赖与生成物目录、已有 agent rule 文件。端识别启发式见 [Mining Method](references/mining-method.md)。依赖图优先运行 `scripts/extract-deps.cjs <repoRoot> [--alias-file <Deps 表>]` 获取确定性 facts（npm workspaces 与 Gradle 直引/别名表；脚本只产事实，分层归类仍是语义判断）；脚本不支持或不可用时回退 bounded reads，不阻塞。
3. 过滤读取范围：跳过依赖、构建产物、锁文件、minified 文件、二进制、vendored/generated 代码；大仓库使用分层抽样并在 preview 和 closeout 中披露样本端/包与未覆盖范围。超大仓库（>500 源码文件）默认分批执行：第一批 bootstrap 只做骨架（确定性构建层 + 共享层 + 明文规范吸收，coding-rules 允许为最小集），之后按模块群/端用 update 模式分批补深，每批在 limitations 披露覆盖范围；模块专属规则按 [Knowledge Format](references/knowledge-format.md) 分层装载节下沉到模块文件与模块入口 pointer。
4. 按 [Mining Method](references/mining-method.md) 取证：架构类别（workspace 拓扑、依赖方向、复用契约、既有违规）优先，编码约定类别收窄取证；大仓库可用 `code-graph` / `project-graph` 候选缩小阅读范围，但证据必须回到当前源码。
5. 证据分级并合成知识库：每条边界/规则标注 `confirmed` / `inferred`、适用端范围与例外；`dependency-rules.md` 使用结构化规则行（规则 id、from、to、方向、等级、source refs）；区分跨端通用、单端专属、历史例外；除非证据压倒性一致，不使用全仓库绝对措辞。
6. Preview：展示将写入的五个文件内容（或 update 模式下的 diff）、入口 pointer、证据等级分布、采样/证据限制、适用范围、历史例外，以及每条规则的代表性 source refs。
7. 写入前读 [Knowledge Format](references/knowledge-format.md)，按 marker、frontmatter、pointer 规则执行；默认让 `AGENTS.md` 与 `CLAUDE.md` 指向 `docs/architecture/index.md`。
8. update 模式：按用户声称变化的范围裁剪步骤 2-5 的取证（只取相关端/路径），不重跑全量盘点；分层启用时只更新声称涉及的模块文件。对每条声称回源验证——新约定须有存在性代码证据（至少 2 个文件），规则失效须有反证（最低检索深度见 [Mining Method](references/mining-method.md)），回写内容同样过敏感信息过滤；失效条目不删除，改标 `status: stale(reason: code-drift / model-obsolescence, evidence: 反证 refs 或三问重测记录)`（条目值内禁用 `|` 字符）；无实质变化时不重写文件，closeout 记录 `refresh_noop`。
9. 收尾输出：列出写入文件、confirmed/inferred 条数、是否采样、limitations、未写入的近邻目标；未写文件时说明 preview-only 状态；headless 默认写入必须说明证据来源。可选减法审查：当用户告知宿主模型已大版本更新时发起（本 skill 无法自判模型版本；可选元数据 `verified_against_model` 记录用户口供）——对知识库逐条重测准入三问，model-obsolescence 候选在 preview 中列出交 owner 裁决，不自动删除。

## Failure Modes

- 目标仓库没有可分析源码：不生成空知识库，说明需要先有代码样本。
- 单端仓库或无 shared 层：仍可运行，但 `dependency-rules.md` / `reuse-contracts.md` 降级为最简内容并在 limitations 说明适用性。
- 用户要求写 `.cursorrules`、`.kiro/steering/**` 或其他未支持规则文件：说明不在当前支持范围，不猜路径。
- 旧版无 marker 输出无法安全识别：先询问"迁移为 managed block 还是追加"。
- 证据不足、模式冲突或生成代码占比过高：降级为 limitations，不把不确定模式写成规则。
- update 模式声称的变化回源后不成立：不写入，输出反证 source refs 并说明。

## Quality Checks

- 规则准入三问（见 [Mining Method](references/mining-method.md)）：AI 不知道/默认会错/只属于这里——三问全否的候选不写入。
- 每条边界/规则都能指向当前目标仓库真实存在的路径；`inferred` 条目必带 source refs。
- 架构边界优先于编码约定；`coding-rules.md` 宁缺毋滥，收纯风格项即为失败。
- 规则只描述"当前项目如何组织"，不提出重构建议，不评价现状好坏。
- 多端仓库中，跨端规则只写稳定通用模式；单端规则必须带适用范围。
- `docs/architecture/index.md` 记录 freshness（梳理时间与源 commit）；refresh 无实质变化时不更新时间戳。
