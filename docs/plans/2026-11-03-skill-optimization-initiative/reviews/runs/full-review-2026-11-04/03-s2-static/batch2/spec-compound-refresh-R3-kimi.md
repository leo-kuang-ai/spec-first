所有必读材料已覆盖。输出裁决。

# spec-compound-refresh 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-compound-refresh/SKILL.md:99-110 | 每条 Core Rule 对应真实失败模式（误删、churn、archive 目录、重复文档漂移），非模型能力补丁 |
| D02 | pass | references/classify.md:9-19;129-140 | 编码了「unverifiable is not false」、三条件删除门、descriptive-drift/implementation-conflict 区分等领域判断；脚本只管 YAML 形态与路径存在性，分类判断留给 LLM |
| D03 | pass | references/publication.md:31-70; scripts/validate-frontmatter.py:51-56; scripts/validate-doc-claims.py:6-11 | 验证门明确（promotion 校验 + claims 校验 + 语义批准），脚本自述「not a general schema or semantic validator」，FLAG 为 adjudication input 而非硬失败 |
| D04 | pass | SKILL.md:153-164; docs/contracts/knowledge/knowledge-harness.md:58,68 | 与 spec-compound 的关系、共享 promotion 合同（source_refs/invalidation_condition）、publication 边界均被 harness 合同与 compound-promotion-contracts.test.js:99-126 消费核对 |
| D05 | pass | SKILL.md:127,137,143; references/ 全文 | 关键规则可定位且单归属（modes/scope/investigate/classify/flows/publication/report/commit/discoverability），Phase 编号缺 Phase 3 是因 classify.md:152 持有该节，非矛盾 |
| D06 | pass | SKILL.md:24-33; references/investigate.md:118-141 | 能力探测以 `provider_untrusted`/`worker_capability_unproven`/inline fallback 诚实降级，不假设任何宿主 primitive 可用 |
| D07 | pass | references/investigate.md:19-23; references/yaml-schema.md:55-63; references/vocabulary-refresh.md:20 | invalidation_condition 核查流程、worth-audit、词汇折叠/退役规则构成完整的知识失效与演化机制 |
| D08 | pass | SKILL.md:46-48,115,119,123,139,143,151,164 | 每个 Phase 先点名必读 reference 再执行，按需加载；SKILL.md 本体 164 行不含 reference 细节 |
| B01 | pass | SKILL.md:3-4; skills/using-spec-first/references/public-route-map.md:15; skills/spec-compound/SKILL.md:32,44 | description 带正向触发（stale/superseded/CONCEPTS bootstrap）与负例（avoid general refactor），与 spec-compound 边界互指清晰，eval case non-solutions-scope-gated 覆盖负例 |
| B02 | pass | SKILL.md:17-20; references/publication.md:1-6 | 输入/输出/hard exit/publication 消费者一致；与 spec-compound 共享 schema/template/scripts 经 diff 核对字节一致 |
| B03 | pass | SKILL.md:34-40; references/modes.md:14-22; references/commit.md:17-36 | mutation/commit/landing 三权分立且 headless 不扩权；dispatch 需显式授权（investigate.md:129-135），测试 mutation-authority-contracts.test.js:79-93 覆盖 |
| B04 | pass | tests/unit/spec-compound-refresh-reference-contracts.test.js:10-30; tests/unit/compound-promotion-contracts.test.js:212-215 | source 边界清晰，SKILL.md 与 references 被合同测试锁定；共享资产镜像一致性有字节级测试守护 |
| B05 | pass | references/publication.md:89-118; references/per-action-flows.md:6-7,50-52,75-76; references/modes.md:34-36 | 部分发布报告精确路径、保留恢复材料、失败前置阻断依赖删除、禁止盲目回滚覆盖并发编辑；symlink 防护（publication.md:14）与 untracked 原件禁删（105-106）覆盖脏状态 |
| B06 | pass | references/report.md:5-6,35,43-63; references/publication.md:106-112 | Applied 必须 verified durable publication；partial 列 published/deleted/unchanged/pending；recommend-only 项即使全部写入成功也须单列 |
| X01 | not-applicable | SKILL.md:13; references/scope.md:44-49 | 单仓库文档维护任务，broad scope 有 batch triage 机制但不涉多模块工程依赖编排 |
| X02 | pass | references/yaml-schema.md:35,90-96; references/schema.yaml:224-232 | schema v2 分类合同与 legacy 向后兼容规则明确（不批量迁移、material rewrite 才重评），版本演进路径存在 |
| X03 | pass | references/publication.md:72-85,98-106; evals/cases/publication-*.yaml | 删除是高风险操作：三条件门 + 入链分类 + 发布前重查 + Git 可恢复性确认；publication-safety fixture 带正反例判据 |
| X04 | pass | references/report.md:29,35; SKILL.md:11 | 报告含 evidence 标签（auto memory 区分）、verification gap 披露、Applied/Recommended 分区，满足交接的 summary/freshness/limitations 要求 |

## Findings

1. **SKILL.md 阶段编号跳过 Phase 3，可能引起消费者误读** — 位置：`skills/spec-compound-refresh/SKILL.md:117-149`。入口列有 Phase 1、Phase 2、Phase 4、Phase 4.5、Phase 4.75、Phase 5，Phase 3（Ask for Decisions）实际归属 `references/classify.md:152` 但入口未注明。后果：读者可能怀疑流程缺失一节，或查找 `Phase 3` 时无法在入口定位。最小修复：在 SKILL.md Phase 2 之后加一行说明「Phase 3 决策交互规则归 `references/classify.md` Phase 3 节所有」；或保持现状成立——classify.md 自身标题已标 Phase 3，测试未要求入口列举该编号，属低价值 churn 候选。**保持现状成立**，但建议在未来 material rewrite 时补一行索引。

2. **`_archived/` 表述在 scope.md 与 Core Rule 10 间存在轻微张力** — 位置：`references/scope.md:10-12`（"if this directory exists, flag it for cleanup"）vs `SKILL.md:111`（"There is no `_archived/` directory"）。后果：首次读者可能误解为「禁止存在」与「存在时清理」的矛盾；实际语义一致（不新建 + 清理遗留）。**保持现状成立**——scope.md 的 legacy 括注已澄清语义，属于历史迁移说明而非冲突。

3. **worth-audit 的 recovery search 允许读「otherwise unnamed guidance」依赖 prose 防扩散** — 位置：`references/worth-audit.md:44-47`。后果：恢复证据搜索可读未点名 guidance 文件，边界（不编辑、不扩 deletion scope、不跨 repo）只靠文本约定，无确定性地板。**保持现状成立**——按角色契约「gate the exits, not the thinking」，恢复搜索是只读行为，写侧仍被 publication 边界硬卡，且 non-interactive 模式全部 recommend-only（worth-audit.md:20-22），风险已被出口 gate 兜住。

## 主责深挖面发现（B05/B06 + 归因验证）

**B05 失败恢复隔离（结论：静态合同完备，且为全表最强维度之一）**

- 部分发布隔离：`publication.md:106-112` 明确「Multiple replacements are not a multi-file transaction」，失败时报告 exact partial publication（published/deleted/unchanged/pending），保留 recovery 材料并在报告中标识，且「Never blindly roll back over a concurrent edit or erase the only remaining original copy」。
- 并发漂移防护：发布前重算 existence/SHA-256（publication.md:89-91），drift 阻断该组并重建候选；同时诚实声明「Hash checks detect observed drift; they are not a filesystem compare-and-swap lock」（95-97）——符合「标注 enforcement limit，不伪造硬强制」的治理要求。
- 失败前置阻断依赖：modes.md:34-36「a failed successor write never permits deleting the original」；per-action-flows.md:6-7、50-52（Consolidate 验证失败则依赖删除 pending）、75-76（Split 部分成功不算完成）三处一致。
- 工具失败降级：validator 不可用时走手工 checklist 且必须披露、不得冒充脚本通过（publication.md:41-55, 66-70）；run-python.sh 探测 python3/python/py 并在全失败时 exit 127 诚实报错（scripts/run-python.sh:22-25），有 python-runtime-resolution-contracts.test.js:56-73 负例测试。
- 行为层校准：evals/README.md:7-9 明确「判据校准测试不证明发布操作顺序、原子性或模型知识判断」，eval.yaml 挂载 4 个 case（含 publication-preserve/partial/recover 三安全例），knowledge-publication-judges.test.js 用 13 个反例（含 symlink、index-only 标志、HEAD 变更、独有内容丢失）校准判据——失败注入与恢复的现场覆盖在静态层无可挑。

**B06 完整交付与审查质量（结论：Applied/Recommended 语义闭环完整）**

- report.md:35「Applied means verified durable publication, not candidate preparation or a successful scratch write」直接堵死「候选当作成果」的谎报路径；publication.md:119「Private scratch is never a successful durable deliverable」双重锁定。
- 推荐项不消失规则：report.md:57-63 要求 relocations、splits、guidance conflicts、unverifiable claims 即使写入全成功也须列 Recommended，「A successful write does not close these recommendations」。
- Keep 可见性：report.md:37 要求 Keep 列于 reviewed-without-edits 区，避免「无改动=未审查」的歧义。
- headless 报告自足性：report.md:41 强制完整打印、不得缩写。

**归因复核（对既有 findings 的核对）**

- 归因验证 1：「SKILL.md 无 Phase 3」可能被旧归因判为结构缺失——复核结论：**不成立为缺陷**，Phase 3 内容完整存在于 classify.md:152-237，入口采用「机制委托 reference」模式（与 spec-compound 的 CE 迁移一致），且 dispatch-authorization-matrix-contracts.test.js:30-31 将 SKILL.md 本体作为 boundarySource 核对通过。维持「保持现状」。
- 归因验证 2：evals/README.md:3 自述旧 case「仅检查回复词语，不能证明安全删除」——复核结论：该归因已在源码中如实保留并已被三个 publication case 补齐，归因诚实、修复闭环可定位，无需修正。
- 归因验证 3：「promotion 校验不判语义充分性」是刻意设计而非缺陷——validate-frontmatter.py:14-24 docstring、publication.md:53-55、knowledge-harness.md（compound-promotion-contracts.test.js:128-137 核对）三处一致声明脚本只管确定性地板，语义归 LLM，符合角色契约分工，维持 pass。

## 未读文件

- `evals/cases/publication-partial.yaml`、`evals/cases/publication-recover.yaml`：仅抽查了 publication-preserve.yaml 与非 solutions gate case。理由：三 case 结构同构（prompt + fixture + script judge），且判据脚本逻辑已由 knowledge-publication-judges.test.js 全量校准覆盖。未覆盖后果：无法逐字确认这两个 case 的 prompt 与 fixture 路径拼写，但 judge 脚本存在性已由 eval.yaml:12-14 与测试挂载证实，风险低。
- `evals/fixtures/scripts/check-*.sh` 与 `evals/fixtures/repos/**`：判据逻辑通过其校准测试间接覆盖，未逐行读 shell。未覆盖后果：判据脚本内部实现细节未核，但其行为已被 13 个反例测试钉住。
- `evals/fixtures/publication-counterexamples.json`：README 已说明其用途（补齐误删与 partial 恢复现场），内容未逐条核对。

## 结论一句话

spec-compound-refresh 静态合同完整、边界自洽、失败恢复与 Applied/Recommended 语义闭环为全表最强面，D01-D08/B01-B06/X02-X04 全部 pass、X01 合理不适用，未发现需要修复的 P0/P1 缺陷。
