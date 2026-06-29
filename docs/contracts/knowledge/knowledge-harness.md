# Knowledge Harness 合同

`knowledge-harness.md` 是 spec-first Knowledge Harness 的轻量地图。它把 SCALE 集成父方案 §5.3 的六层知识闭环内化为 file-first、summary-first、recall-as-advisory 的合同边界。它不是新的 workflow、状态机、知识引擎、schema 总线或外部 memory 平台。

## 目标

- 让 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 的最后一环可发现、可回源、可失效。
- 把 context budget、artifact summary、docs/solutions recall 和 verified promotion 放到明确的 source/runtime/provider 边界内。
- 保持 scripts enforce deterministic invariants、scripts prepare facts、LLM workflows decide semantic adequacy above that floor：脚本强制可机械判定的不变量并准备路径、budget、reason code 和校验事实；LLM 判断是否相关、是否需展开、是否可确认。

## 非目标

- 不引入向量库、SQLite 或外部 memory 平台作为默认 source truth。
- 不把 `docs/solutions/` recall 当作 confirmed truth。
- 不新建 `docs/contracts/knowledge/solution-promotion.md` 或 `docs/contracts/knowledge/solution-promotion.schema.json`；`docs/solutions/` frontmatter 的 canonical 合同仍是 `skills/spec-compound/references/schema.yaml`。
- 不让 promotion gate 充当反注入防御。promotion gate 的定位是噪声/质量控制，不是反注入防御。

## 六层 Map

| Layer | 职责 | 可用 skill / artifact | v1.15 状态 | 边界 |
| --- | --- | --- | --- | --- |
| L1 Project Context | 保留项目角色、source/runtime 边界、host 指令和需求上下文 | `docs/10-prompt/结构化项目角色契约.md`, `AGENTS.md`, `CLAUDE.md`, `spec-prd` | L1 已由现有 `spec-prd`/host docs 覆盖 | host docs 是 source 指令，不是 workflow 状态 |
| L2 Context Budget | 用最小高信号 token 集传递上游 artifact、相关路径和验证路径 | `context-bundle.v1`, `artifact-summary.v1`, `spec-plan`, `spec-work`, `spec-code-review` | L2 是 v1.15 completion gate | context budget 复用 `related_paths` / `evidence_paths` / `excluded_context` / `budget_used`，不新增 included/omitted 字段 |
| L3 Code Intelligence | 帮助定位影响面、调用链和候选测试 | external providers, direct `rg`, ast-grep | L3 归 v1.16 capability-aware 协同 | provider 只提供 advisory navigation，不拥有 scope/finding/root-cause authority |
| L4 Memory / Prior Decisions | 从 `docs/solutions/` 召回历史经验和已拒绝方案 | `spec-plan`, `spec-debug`, `spec-learnings-researcher`, `docs/solutions/**` | L4 是 v1.15 completion gate | recall 命中是 advisory candidate，必须回源到 source/test/doc 确认后才可升为 confirmed |
| L5 Skill / Tool Capability | 提醒当前任务可用的 skill、MCP、CLI 和 degraded capability | `tool-facts`, runtime capabilities, skills registry | L5 是 advisory follow-up | setup facts 不替代语义判断；无干净 consumer gate 时不计入 v1.15 completion |
| L6 Evidence / Promotion | 只把已验证、可复用、可失效的经验沉淀进 durable store | `spec-compound`, `spec-compound-refresh`, `skills/spec-compound/references/schema.yaml` | L6 是 v1.15 completion gate | 未验证经验不进 durable knowledge；legacy docs 可 recall 但保持 advisory |

L2/L4/L6 是 v1.15 completion gate。L5 是 advisory follow-up。L1 已覆盖，L3 延后到 v1.16。

## Summary-First Handoff

`artifact-summary.v1` 是 workflow handoff 的默认入口。Producer 应先输出 goal、scope、non-goals、key conclusions、changed facts、evidence paths、limitations 和 `full_artifact_read_triggers`；consumer 先读 summary 和精确 path，只有 trigger 命中时才展开 full artifact。

可断言信号：

- `summary_missing`：上游没有可消费 summary，consumer 必须记录这个信号，并读取最小 explicit path。
- `full_artifact_read_reason`：consumer 展开完整 artifact 时必须记录触发原因，原因必须对应 `full_artifact_read_triggers`。

Expand-on-trigger 条件：

- summary 缺少下游所需的 requirement/task/finding/evidence detail。
- reviewer 需要精确 prose 或 line reference 才能形成 finding。
- 互依赖任务的下游输入依赖上游具体实现细节，而不是只依赖上游结论。

Context budget accounting 复用 `context-bundle.v1`：included 语义映射到 `related_paths` / `evidence_paths`，omitted 语义映射到 `excluded_context` 及其 `reason_code` / `reason`，budget 映射到 `budget` / `budget_used`。不新增 bundle schema 字段。

## Recall Trust Boundary

`docs/solutions/**` recall 只产生 advisory candidate。Consumer 必须把 recall 命中当成候选线索，回到 learning frontmatter 的 `source_refs` 或 evidence summary 的 `source_reads_required`，用当前 source/test/doc、确定性校验或人工 reviewer 确认后，才能把结论升为 confirmed。

这条边界复用 `provider_untrusted` advisory 语义，不新建第二套 evidence enum。回源过程不依赖模型自评；LLM 可以判断要读哪些源、比较是否仍适用，但 confirmed 依据必须来自 source/test/doc、验证命令、review finding 或人工确认。

现有缺少新结构化字段的 solution 是 `legacy_unstructured_advisory`：可以被 recall，但不能因存在于 durable store 就被视为 verified structured knowledge。最小回填 `domain`、`pattern`、`invalidation_condition` 和 `source_refs` 后，才可按新结构化 recall 规则消费。

## Promotion Boundary

新的 `docs/solutions/**` promote 必须走 `skills/spec-compound/references/schema.yaml`，并满足 new promote required 字段：`invalidation_condition` 和 `source_refs`。`source_refs` 是 recall 回源抓手，`invalidation_condition` 是失效边界；`domain`、`pattern`、`rejected_alternatives`、`applicable_versions` 用于提高 grep / summary-first recall 的质量。

Promotion gate 的最小机制是 candidate -> review -> promote。只有 verified learning 进入 durable store；未验证的 session notes、raw tool output、raw diff hunks 或未确认 recall 不写入 `docs/solutions/**`。

此 gate 是 prose / LLM-enforced 边界，不是 machine-validated 硬约束：`validate-frontmatter.py` 等确定性脚本只做 YAML parser-safety 检查，不校验 `new_promote_required_fields` 是否存在。`new_promote_required_fields`(`invalidation_condition` + `source_refs`)由 `spec-compound` / `spec-compound-refresh` 的 promote 路径在 review 时按 prose 规则执行；consumer 不应假设缺字段的新 promote 会被脚本自动拒绝。

## Open Questions / Resolved

- OQ-1 summary-first expand-on-trigger：使用语义触发而不是行数阈值。summary 缺少下游所需的 requirement/task/finding/evidence detail、reviewer 需要精确 prose/line reference、或互依赖任务需要具体实现细节时，consumer 展开 full artifact 并记录 `full_artifact_read_reason`。
- OQ-2 file-first 转 hybrid 信号：v1.15 不实现 hybrid。当前规模远低于需要索引平台的量级；当 grep 召回精度持续下降、单关键词命中过多需多轮过滤，或语义近但用词不同的 recall miss 反复发生时，再评估 hybrid。不得声称 embeddings 已过时。
- OQ-3 recall 回源操作化：recall 命中标 advisory candidate，consumer 使用 `source_refs` / `source_reads_required` 回源到权威 source/test/doc 或人工 reviewer，不依赖模型自评。
- OQ-4 promotion gate 最小机制：结构化 frontmatter + verified gate。`invalidation_condition` 和 `source_refs` 对新 promote 必填(prose / LLM-enforced，非 machine-validated)；不引入额外可选 frontmatter 字段、签名、沙箱或第二套 validator。

## Package Delivery

本合同是 packaged contract surface。`package.json` 的 `files` 必须包含 `docs/contracts/knowledge/knowledge-harness.md`，安装合同测试必须断言 npm pack 包含该路径。
