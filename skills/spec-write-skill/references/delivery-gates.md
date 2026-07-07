# Delivery Gates

本 reference 定义 `spec-write-skill` 的 risk-based 交付 gate：按质量层级和改动风险选择最窄验证。提高 rigor 优先增加必要 references/evals/tests，不扩大 `SKILL.md` 初始加载，也不把更多 gate 当作默认更好。

## Quality Tiers

| Tier | 使用场景 | 默认交付物 | 最小验证 |
| --- | --- | --- | --- |
| `scaffold` | 探索性、个人、短期、低误触发风险 | `SKILL.md`，必要时 1 个 small reference | `npm run lint:skill-entrypoints`、`git diff --check`；目标 package 提供 `quick_validate.py` 时加跑 |
| `production` | 团队复用、route confusion 真实存在、输出质量重要 | lean `SKILL.md`、必要 references、trigger/boundary eval | scaffold 验证 + 聚焦 Jest contract + `spec-skill-audit` target run |
| `library` | 共享基础能力，或会影响其他 skill 写作/治理 | trigger positive/negative/near-neighbor eval、packaging readiness、维护说明 | production 验证 + package smoke 或 runtime sync test |
| `governed` | 安全、合规、发布、事故、组织规范、高权限脚本 | owner、review cadence、rollback boundary、trust/security notes | library 验证 + owner/review evidence 或 proposal-only 限制 |

默认从 `scaffold` 起步；只有复用、误触发、治理或分发风险真实存在时才升级。

## Resource Boundary

资源放置映射的概念 owner 见 [Skill Quality Vocabulary](skill-quality-vocabulary.md) 的 Information Hierarchy；本节只定义交付 gate 专属的准入规则（baseline 排除、非空目录必须被指向）。

资源只在当前需求需要时添加：

- `SKILL.md`：触发面、核心执行骨架、输出合同、branch selection、安全默认值。
- `references/`：长规则、模式、示例、schema、tier/gate 细节。
- `scripts/`：确定性、重复、容易手写错的逻辑。
- `assets/`：输出中会复制或改造的模板/素材。
- `evals/`：路由、边界或输出质量需要可回归证据。

不要创建空目录、装饰性 reports、未引用 references、未请求 adapters、宽泛配置旋钮。新增非空目录必须被 `SKILL.md` 指向，或被测试/packaging contract 覆盖。

## Gate Selection

按改动类型选择最窄 gate：

| 改动 | 需要的证据 |
| --- | --- |
| `description` / route 边界 | trigger/boundary eval，near-neighbor case，`npm run lint:skill-entrypoints` |
| branch / context pointer / information hierarchy | branch list or reviewer note，`SKILL.md` pointer 说明读取条件，failure/expected eval 覆盖弱 pointer 或 sprawl 风险 |
| source/runtime 边界 | contract test 或 runtime sync test，禁止手改 generated mirrors |
| 新增 standalone skill | `skills-governance.json`、runtime catalog、public workflow summary test |
| 新增 reference | `SKILL.md` 有清晰读取条件；入口 lint / 可用 quick validate 通过 |
| 新增 eval | normalized cases valid；覆盖 positive、negative/near-neighbor 或 boundary |
| 可分发 package | 目标 package 提供时运行官方 `quick_validate.py`；可行时 package smoke，确认不依赖 maintainer-only evidence |
| 写入脚本或 shell 行为 | 脚本语法/单测、安全边界、失败 reason_code |
| 复杂或高风险语义行为 | fresh-source eval、forward-testing 或人工 reviewer note；若未执行，记录 `not_checked_with_reason` |

如果改动来自外部 skill 借鉴，证据还要说明 external benchmark -> local fit 的转换结果：哪些 pattern 被吸收，哪些 invocation 假设、wording 或平台能力没有复制。

## Packaging Readiness

对 package-ready 或 library/governed skill，必须说明：

- runtime 用户是否需要 `agents/openai.yaml` 或其他 host metadata。
- package-local runtime 依赖只来自 `SKILL.md`、`references/`、必要 `scripts/`、必要 `assets/`。
- `evals/`、reports、历史计划、repo-local validation docs 默认是 maintainer evidence，不是 runtime 必读依赖。
- target-specific packaging claims 必须有实际 target 或明确 `not_checked_with_reason`。

## Output Eval Boundary

只有当 skill 负责生成用户可见报告、教程、文档、UI/视觉证据或可审查 artifact 时，才要求 output eval。普通 authoring scaffold 不强制。

输出 eval 至少包含：

- real prompt / task shape
- required input files when file-backed
- required sections, paths, contracts, or boundary language
- forbidden generic placeholders or unsafe actions
- human review note when质量判断不能机械断言

不要把 fixture 或 recorded sample 描述成 provider-backed model evidence；没有真实 runner 时标记为 review input。

## Skill Quality Eval Boundary

当本次改动改变 skill 写作方法、触发边界、信息层级或 completion criteria 时，优先补结构性 eval fixture。fixture 至少覆盖一个会漂移的行为，而不是只重复 happy path：

- `failure`：弱 context pointer、模糊 completion criterion、over-split granularity、package leak、auto-rewrite audit。
- `expected`：branch-first 资源分配、sentence-level no-op pruning、source/runtime closeout、near-neighbor route。

这些 fixture 是维护者 review input；没有真实 runner 或 fresh-source eval 时，不要把它描述成已证明模型行为改善。

## Forward Testing Boundary

使用 forward-testing 只验证 skill 是否能泛化，不把它变成泄漏答案的二次 review。

- 只在复杂、团队复用、迁移、分发或高风险语义行为时要求；普通 scaffold 可标记 `not_checked_with_reason`。
- 使用新上下文或 subagent 时，传入 skill 路径、真实请求形态和 raw artifact；不要传入预期答案、已知 bug、intended fix 或上轮结论。
- 如果 forward-testing 会耗时很长、需要额外授权或会修改生产系统，先把拟运行 prompt 和风险交给用户确认。
- 结果只作为语义证据；仍需结合 source patch、contract tests、可用 validator 和 audit smoke 判断是否可交付。

fresh-source eval 与 forward-testing 一样只提供语义证据。修改 skill/agent prose 后，如果宿主调度能力、时间或授权不足，记录 `not_checked_with_reason`；不要用当前会话已加载的旧 skill 行为冒充 fresh-source 验证。

## Closeout

交付时说明：

- mode 和 quality tier
- changed source files
- deterministic checks actually run
- semantic limits / residual risks
- generated runtime mirrors 是否未刷新，以及是否需要用户后续运行 `spec-first init`
