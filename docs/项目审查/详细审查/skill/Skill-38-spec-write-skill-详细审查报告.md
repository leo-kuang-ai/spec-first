# Skill-38 `spec-write-skill` 详细审查报告

## 1. 基本信息

| 项 | 内容 |
|---|---|
| Skill 名称 | `spec-write-skill` |
| 文件路径 | `skills/spec-write-skill/SKILL.md` |
| 当前行数 | 75 行 |
| entry surface | public workflow command |
| 当前 source 证据 | `docs/catalog/runtime-capabilities.md` 将其列为 `spec-write-skill` / `spec-write-skill` public workflow |

## 2. 职责定位

`spec-write-skill` 是创建、改写、迁移或按 audit findings 修复 spec-first source skill 的公开 workflow。它先判断请求是否值得做成 skill，再更新 `skills/<skill-name>/SKILL.md`、必要 references/evals/resources、governance JSON、tests、docs 和 `CHANGELOG.md`。它不是 `spec-skill-audit` 的替代品，只把明确目标转成 source patch。

## 3. 适用与不适用场景

| 类型 | 结论 |
|---|---|
| 适用 | 新建/改写/迁移/修复 `skills/<skill-name>/` source skill 的触发、边界、I/O、资源、治理或验证 |
| 不适用 | 一次性回答、解释/总结/翻译、只审计、文档导出、第三方安装、普通 review、普通实现/调试/评审 workflow、generated mirror 修补 |
| 边界质量 | 清晰；When To Use / When Not To Use、Hard Boundaries 和 Quality Tiers 覆盖主要误用 |

## 4. 输入契约

输入包括用户目标、目标 skill、相邻 skill、repo 契约、`skills-governance.json`、audit findings 和必要外部 skill 文本。契约覆盖充分，特别强调 near-neighbor exclusions、quality tier、entry surface 和 first eval target。

## 5. 执行步骤

Workflow 11 步，顺序符合专家路径：

1. 资格判断。
2. 目标模糊时只问影响 package 设计的问题。
3. 明确 mode/tier/target repo/skill name/entry surface。
4. 读取相邻 skill、治理记录和项目契约。
5. 先列真实 branch，再写 trigger contract。
6. 设计信息层级。
7. 写 completion criterion。
8. 做 sentence-level no-op pruning。
9. 更新 source-owned consumers。
10. 跑 tier 对应 delivery gates。
11. 输出变更摘要、验证、runtime mirror 状态和 residual risks。

执行逻辑成熟，且能避免把 skill authoring 降级成 prompt 扩写。

## 6. 输出产物

| 输出 | 评价 |
|---|---|
| `do-not-create-skill` | 能防止一次性任务被错误沉淀为 skill |
| near-neighbor route | 能减少 catalog 噪声 |
| source patch | 明确只改 source，不手改 generated mirrors |
| governance/tests/docs/CHANGELOG | 与仓库治理要求一致 |
| validation/residual risks | 能支撑 downstream review |

## 7. 上下游关系

| 上游 | 下游 |
|---|---|
| audit findings、用户 skill authoring 请求、相邻 skill source、governance records | `spec-work`、`spec-skill-audit`、runtime catalog、skill 维护者、最终用户 |

## 8. 成熟度评分

| 评分项 | 分数 | 依据 |
|---|---:|---|
| 目标与边界 | 10/10 | public workflow identity 与 non-goals 清楚 |
| 输入契约 | 9/10 | 输入覆盖 user goal、adjacent skill、governance、audit findings |
| 执行逻辑 | 18/20 | 资格判断→写 patch→验证闭环完整 |
| 判断规则 | 14/15 | repeated use、near-neighbor、quality tier 清楚 |
| 输出产物 | 14/15 | source patch/governance/tests/docs/CHANGELOG 明确 |
| 上下游衔接 | 9/10 | 与 spec-work/spec-skill-audit/runtime catalog 关系清楚 |
| 失败处理 | 4/5 | failure modes 有，但输出 envelope 可更结构化 |
| 证据要求 | 4/5 | delivery gates 有，真实 forward-testing 样例可补 |
| 文档化程度 | 5/5 | authoring/delivery/vocabulary references 完整 |
| 可复用与治理 | 5/5 | governed tier 与 consumers 明确 |
| 总分 | 92/100 | A，团队标准 skill |

## 9. 核心优点

- 先判断是否值得做成 skill，能防止 catalog 膨胀。
- 明确 generated runtime mirrors 只能由 `spec-first init` 投影。
- Quality Tiers 避免所有 skill 都按同一重量级治理。
- sentence-level no-op pruning 有助于保持 light contract。

## 10. 核心问题

| 问题 | 影响 | 优先级 |
|---|---|---|
| 旧详细审查未覆盖该 public workflow，本报告已补齐 | 若后续不刷新索引，skill authoring 入口会再次缺 current 全量审查证据 | 已关闭；后续按 P1 freshness 守护 |
| Output Contract 比 `spec-code-review` 等 workflow 更轻 | 机器消费 residual risks / validation 状态较弱 | P2 |
| delivery gates 依赖 references，入口中未列具体 gate 摘要 | 执行者可能漏读关键 gate | P2 |

## 11. 优化建议

1. 保持本报告纳入详细审查索引后的 current coverage 口径，后续新增/删除 skill 时同步刷新。
2. 增加最小 headless/report output envelope，至少包含 `mode/tier/entry_surface/source_files_changed/tests_run/generated_runtime_status/residual_risks`。
3. 为 `do-not-create-skill`、near-neighbor route、source patch 三种路径各补一个 trigger/output eval。
4. 在 `spec-skill-audit` 输出到 `spec-write-skill` 的 handoff 中要求带 finding ID、source refs、target skill、recommended tier。

## 12. 是否建议重构

不建议重构。建议保持 public workflow 形态，补 output envelope 和 eval。

## 13. 最终结论

`spec-write-skill` 是 spec-first 自身演化质量的关键入口，source 结构成熟。旧全量详细审查漏覆盖是历史交付缺口，本报告已补齐；当前主要改进空间是 output envelope 和 eval，而不是 workflow 本身缺少核心能力。
