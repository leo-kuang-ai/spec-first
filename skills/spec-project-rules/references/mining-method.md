# Mining Method

本参考在取证前读取，用来组织证据、防止只写表层描述、并把架构边界知识置于编码约定之前。只把当前目标仓库中稳定、重复、可回源的模式写入知识库。

## 基础策略

- **规则准入三问**（写入前逐条过，三问全否的候选不写入）：AI 不知道这个吗（私有事实，不存在于训练分布）？AI 的默认会错吗（偏离——模型默认行为与本项目冲突）？这条只属于这里吗（公司特性/明文红线）？通识、语言/框架默认、模型已不生成的 anti-pattern 一律挡在门外；依据：Anthropic 2026-07 删除 80%+ 系统提示词且编码评测无损——通识入规则零收益。
- 默认证据阈值：同一规则/边界至少出现在 2 个文件（同一文件内多处证据只算 1 个文件）；禁止/缺失类规则使用缺失性证据——记录可复现的检索式与命中数（如全仓 `rg` 0 命中），不适用 2 文件门槛；中大型仓库只把 80%+ 一致的模式写成规则。
- 大仓库（>500 个源码文件或上下文预算不足）：100% 阅读核心/shared 模块与各端入口，按目录比例抽样剩余源码；preview 中披露抽样范围。
- 多端/monorepo/workspace：先识别端级与包级边界；跨端规则只写稳定通用模式，单端规则必须写明适用端范围，并提醒改具体端先跟随本端现有结构。
- 小仓库（<5 个源码文件）：可以输出知识库，但必须标注样本小；允许单文件证据的条目，降级为带 sample-size 说明的 inferred 条目。
- 混合语言/技术栈：按端或语言分节；跨端规则只写目录布局、依赖方向、提交约定这类共同模式。
- 生成代码占比高：跳过 generated/scaffolded 文件；若 >80% 是生成代码，先警告并只写人工源码证据。
- 冲突模式：50/50 分裂不写规则；可在 `limitations` 中说明"未生成规则"。
- 历史例外：存在高频主模式和少量旧代码反例时，写成"新增代码优先沿用主模式"或"不要扩大历史例外"；不要写成全仓库事实或绝对禁令。
- 超大仓库两阶段执行（>500 源码文件默认启用）：第一批 bootstrap 骨架 = 确定性构建层（settings/build 文件与依赖图，配合 `scripts/extract-deps.cjs`）+ 共享层职责 + 明文规范吸收；第二批起按模块群/端用 update 模式补 coding-rules 与深挖。一次性全量深挖在单会话上下文装不下时是错误执行方式。第二批产出中，单一模块/包 scope 的规则下沉到 `docs/architecture/modules/<module>.md` 并在模块目录放置入口 pointer（启用门槛、结构与合并规则见 [Knowledge Format](references/knowledge-format.md) 分层装载节）。
- 仓外依赖（git submodule、二进制制品/AAR、以 maven/npm 坐标消费且无本地源码的库）：证据只能来自调用点 import 与构建声明；此类条目 grade 上限为 inferred，正文标注"无本地源码，仅调用点取证"，不得据此生成实现层规则。
- 失效反证深度：判定既有规则失效（标 stale）前，至少完成目标路径/导出的存在性检查 + 全仓引用检索（记录检索式与命中数）；仅当检索零命中或命中均已失效时才可标 stale。
- 绝对化措辞：除非证据在目标适用范围内压倒性一致，不要使用"统一""只""永远""不得""禁止"等全称表达；需要强约束时必须同时给出 scope 或例外边界。

## 大仓候选导航

大仓库、monorepo 或依赖关系难以直接定位时，可以把 `code-graph` / `project-graph` capability-class 输出作为 `provider_untrusted` 候选导航，用来决定下一批 source refs。遵守当前仓库 `docs/contracts/project-graph-consumption.md` 的 candidate-only 口径；若该合同在运行目标不可见，按本小节最小边界执行。

- 候选只回答"先看哪里"，不能证明边界归属、依赖方向、复用契约、频率或一致性。
- 每条进入知识库的模式仍必须由当前目标仓库源码、测试、配置、构建定义或已有明文文档确认；记录代表性 source refs。
- 候选不可用、stale、unknown、unverified、失败或不安全时，直接回退到 bounded source reads、`rg`、ast-grep 和分层抽样；不要阻塞梳理。
- 不从本 skill 运行图谱刷新、索引生成、repair 或 mutation；不要读取完整 raw graph artifact，例如 `graph.json`。
- 如果候选影响了阅读顺序，在 preview/closeout 的 `limitations` 或 `evidence_summary` 里说明查询摘要、采纳/拒绝的候选和回源确认结果。

## 架构类别（一级，优先取证）

### A1. Workspace 拓扑与端识别

识别 workspace 中的端与构建单元：移动 app、H5/web、admin 控制台、后台服务、shared/公共包、工具链。启发式：目录名（`app/`、`h5/`、`admin/`、`server/`、`packages/`、`apps/`）、多个 `package.json`/`build.gradle`/`Podfile` 等构建定义、技术栈指纹（React Native/Flutter/Vue/Spring 等）、部署配置（Dockerfile、CI matrix）。为每端记录：目录、技术栈、职责边界、明确"不该放什么"的反例（带 source refs）；找不到反例证据时显式写"暂无代码反例"并在 limitations 披露，不虚构反例。词汇只管理与边界/契约直接相关的术语（如"自选股域归 watchlist-core"）；全量业务词汇表归 CONCEPTS.md/`spec-compound`，本 skill 不建词表。

### A2. 依赖方向

取证各端与 shared 层之间的引用方向：import/require、模块引用、DI 注册、远程调用边界。记录允许方向与禁区（例如 admin 不得引用 app 的业务模块、端内不得绕过 shared 层直接依赖底层库）。既有违规按 A4 处理。证据来源：import 语句、构建依赖声明、模块边界配置（如有）。

### A3. 复用契约

取证 shared/公共层的暴露面：导出 API 的形态与稳定性、哪些是跨端通用、哪些实际只被单端使用（复用信号退化）、跨端重复实现信号（同名工具/常量在多端各有一份）。为每项记录：归属、预期消费端、known 非目标（"不属于 shared 的东西"反例）。

### A4. 既有违规与历史例外

发现的架构违规（越界依赖、绕过封装、跨端复制）不写成规则，写成历史例外条目：现象、涉及路径、收窄措辞。它们是边界规则的反证或例外输入，不是规范本身。

### A5. 明文规范吸收

目标仓库已有的 README 架构节、ADR、contribution guide、目录说明文档中已明文规定的边界，直接吸收为 `confirmed` 条目并引用原文位置；与代码现状冲突时并列记录并标注冲突。

### A6. 演化证据（git 历史）

用 `git log` 区分"新增代码主模式"与历史存量：如 `git log --since=<date> --diff-filter=A --name-only --pretty=format: -- "*.kt" | wc -l` 对比新增文件的语言/目录分布，判定"新增代码优先 Kotlin""旧包区不再扩大"这类边界。证据记录检索式与时间窗；无 git 历史或浅克隆时跳过并说明。

## 编码类别（二级，收窄取证）

只收影响 AI 生成正确性的高信号规则；这一节产出写入 `coding-rules.md`，宁缺毋滥。

### C1. Hidden Associations（必查，最高价值）

总是一起出现、不写就错的隐性耦合：service 与 types 文件、handler 与 validation、route 与 registry、请求必须经过的封装层、数据库访问的 transaction wrapper、跨端共享的类型定义位置。至少写一条，除非证据明确不存在。

### C2. Anti-Patterns（必查）

项目几乎从不使用、AI 默认却常生成的写法：默认导出、`any`、直接 `process.env`、直接调用外部 SDK、未包装错误、绕过 shared 层的本地复制。只写当前仓库证据支持的禁用项。

### C3. 封装强制约定

"必须走某封装而不是直接调用"类规则：统一请求客户端、统一错误处理入口、统一路由注册、统一权限检查。这类规则 AI 最容易违背，优先收录。

### C4 查重义务（存在性知识的行为化）

识别"AI 最可能重复造轮子的域"（utils/组件/HTTP 客户端/格式化/校验等），每个域产出一条义务规则：先查哪里（含可复现检索式）→ 不存在才新建 → 新建后归位共享层。落位双轨：能力指针条目（住址+查法）以 `REUSE-` 前缀落 reuse-contracts.md；查重义务条目（行为约束）以 `RULE-` 前缀落 coding-rules.md。禁止产出条目级组件清单——清单必腐烂，义务不会。

### 明确排除

纯风格偏好（命名、格式、注释密度、import 顺序——formatter/linter 已强制的只记"已由工具处理"）、语言/framework 默认习惯、生成代码的习惯、个人偏好分歧项。这些归 `spec-rule-miner` 的领地或根本不该成为规则。

## 条件补充

按目标仓库实际形态补充取证：前端（组件状态与数据获取边界）、后端（response envelope、middleware 顺序、事务边界）、移动端（navigation/平台分支约定）、桌面端。仅在对应端真实存在时使用，不硬套。
