材料读取充分，输出裁决。

# spec-compound 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-compound/SKILL.md:26（counterfactual 写入门槛）；references/modes.md:36（high-risk 不得降级）；references/research.md:88-89（PR 号优于 SHA） | 多数约束可追溯到真实失败模式（PR #695、2026-04-16 plan 标题教训写入 validator 注释），未见过时/矛盾/过度指导证据 |
| D02 | pass | references/schema.yaml:13-36（双 track 封闭枚举）；references/concepts-vocabulary.md:24-29（seed goal/scope）；references/yaml-schema.md:33（选 demonstrated cause） | 沉淀的是项目知识分类、词汇与归因规则，脚本仅机械校验，语义充分性明确留给 LLM（assembly.md:51） |
| D03 | pass | references/assembly.md:33-49（frontmatter 机械 gate + 手工 fallback）；references/assembly.md:83-92（claims 机械检查）；references/promotion.md:7（promotion 语义决定脚本不做） | 两级确定性校验（validate-frontmatter.py、validate-doc-claims.py）存在且被明确标注为"非 gate 的 flag 需 adjudicate"，未把语义判断伪装成机械判定 |
| D04 | pass | SKILL.md:22（consumers 声明）；docs/contracts/knowledge/knowledge-harness.md:25,27,50,58（L4/L6 recall trust boundary 与 promotion boundary）；tests/unit/compound-promotion-contracts.test.js:99-126（compound/refresh 消费同一 promotion 合同） | 下游 recall-as-advisory、source_refs 回源、promotion 出口字段在 harness 合同与消费者测试中均被消费 |
| D05 | pass | SKILL.md 61 行 + 11 个 reference 均 <150 行；SKILL.md:49（按需读取纪律）；tests/unit/spec-compound-reference-contracts.test.js:18-34（入口路由完整性锁定） | 关键规则可定位、重复有限（promotion 边界在 promotion.md/lightweight.md/harness 三处但内容一致且有 byte-identical 测试锁定共享文件），删减风险可控 |
| D06 | pass | references/modes.md:18-27（dispatch 能力探针字段与 inline fallback）；references/grounding-validation.md:92（无 dispatch 时 inline 语义校验并标记非独立）；scripts/run-python.sh:7-25（python3→python→py -3 可移植解析） | 能力假设均以运行时事实表达并有显式降级路径，未假设特定宿主 dispatch primitive |
| D07 | pass | references/schema.yaml:103-112（promotion_required_fields: source_refs + invalidation_condition）；references/refresh-and-discoverability.md:9-23（选择性 refresh 触发/不触发条件）；references/concepts-vocabulary.md:9-11（删除需正向证据，uncertainty leaves the entry standing） | 知识带失效条件、有真实消费者（plan/work/debug/review 经 harness L4 召回）、refresh 路由明确 |
| D08 | pass | SKILL.md:49（"Read each reference when its step is reached"）；references/research.md:116-128（grep-first 过滤、frontmatter-only 预筛）；references/session-history.md:52（escalation gate 只在相关命中时付昂贵 synthesis） | 按需加载、廉价探针先行、昂贵阶段有 gate；少读场景（Lightweight）不豁免 promotion 义务 |
| B01 | pass | SKILL.md:3（description 正向触发）；SKILL.md:32（standalone CONCEPTS.md bootstrap 路由到 spec-compound-refresh 并退出）；evals/cases/bootstrap-routes-refresh.yaml（负例 case）；skills/using-spec-first/references/public-route-map.md:15,31（入口路由一致） | 触发边界与 spec-compound-refresh 的职责切分清晰且有行为 case 锁定 |
| B02 | pass | SKILL.md:16-22（Inputs/Outputs/Consumers）；references/schema.yaml:99-112（promotion exit 字段）；references/report.md:21-47（headless 输出形状）；compound-promotion-contracts.test.js:212-215（与 refresh 共享文件 byte-identical） | 入口/reference/script/template/consumer 五面一致；设计推断处均标注（如 lightweight.md:12"不是 token 节省承诺"） |
| B03 | pass | SKILL.md:40（research role 不写产品文件）；SKILL.md:43（session 读取需独立 restricted-read 授权）；SKILL.md:45（不授权 commit/push/source 修改）；references/modes.md:27（workflow 调用不授权 dispatch）；references/refresh-and-discoverability.md:83（instruction 文件编辑需 blocking question 同意） | 写权限、委派、私有数据、外发均按独立授权门控，边界表述与测试一致 |
| B04 | pass | compound-promotion-contracts.test.js:212-215（spec-compound 与 spec-compound-refresh 共享 schema/yaml-schema/template/validator byte-identical）；python-runtime-resolution-contracts.test.js:24-29（run-python.sh 跨 5 skill byte-identical）；knowledge-harness.md:15（canonical schema 归属） | 共享合同以测试锁字节级同源，真相源归属明确，未见手改镜像风险点 |
| B05 | pass | references/promotion.md:10（partial publication 精确报告、多目标非事务）；references/research.md:3-5,60（worker 启动失败 inline fallback、artifact 写失败 inline 返回）；references/assembly.md:36-41（脚本不可解析时手工 gate，禁止静默跳过）；references/session-history.md:44,61（脚本缺失时显式跳过并声明）；scripts/run-python.sh:22-25（无可用解释器 exit 127 诚实报错） | 工具缺失、部分成功、写失败、中断路径均有显式处置；B05 复核未发现盲目重试或静默降级 |
| B06 | pass | SKILL.md:26（无合格 learning 就写 nothing 并说明）；references/report.md:3（部分发布绝不暗示全部不变）；evals/examples.json（9 个 promotion 边界 case，含 transcript-only、假因果、multi-target partial）；evals/cases/unsolved-no-write.yaml（未解决不得写） | 完成语义、未完成披露、误报/漏报边界（adjudicate-not-auto-fix）均有静态承诺与行为 case；B06 复核成立 |
| X01 | not-applicable | references/research.md:62-64（单 learning 单 run、顺序执行） | 本 Skill 职责为单篇沉淀，不编排多模块/长任务分解；该维度按触发条件不适用 |
| X02 | pass | references/schema.yaml:224-232（backward compatibility：legacy 文档可读、不批量迁移）；references/yaml-schema.md:35（material rewrite 才重评分类）；knowledge-harness.md:54（legacy_unstructured_advisory 语义） | schema 演化有明确兼容与迁移边界，ADR 式取舍留档 |
| X03 | pass | references/modes.md:36（high-risk 定义与 Full 强制）；references/promotion.md:7（高风险建议独立 reviewer）；references/grounding-validation.md:41-87（semantic validator 三类 claim 裁决） | 高风险知识有专门验证对账路径（独立/inline 语义校验、merge-state 远端核验） |
| X04 | pass | references/session-history.md:8-52（restricted-read 授权门 + 两阶段探针）；references/report.md:3,83（报告含执行限制与 refresh 建议、返回 active caller）；references/concepts-vocabulary.md:12（coherence neighborhood 检查） | 跨会话读取授权化、知识消费与失效边界、交接报告要素齐备 |

## Findings

1. **P3 — research.md 内部步骤引用悬空**。`references/research.md:51` 与 `:64` 引用 "step 3"/"step 4 below"，但 research.md 自身无编号 step（编号列表只见于 Phase 0.5 的 1-5），"step 4" 实际指 session-history.md 中的 `#### 4.` 小节。后果：执行者需在两个文件间自行推断指代，属轻微可读性缺陷，不致路由错误。最小修复：把 "step 3"/"step 4 below" 改为显式引用（如 "references/session-history.md 的 Session History 小节"）。
2. **P3 — modes.md 与 session-history.md 对同一 Phase 的表述粒度差异**。`references/modes.md:39,41` 称 session history 为 "Phase 1 step 4"，而 SKILL.md 的 Full Mode 列表（SKILL.md:52）把 session history 列为顶层第 2 步，两套编号体系并存。后果：与 finding 1 同源，跨文件编号不一致增加误读成本。最小修复：统一为名称引用（"session-history probe"），弃用数字 step。
3. **保持现状成立 — 历史 O09"消除假因果"归因已关闭**。core/03-optimization-candidates.md:35 登记 O09（spec-compound 知识质量/假因果）；当前源码已有 grounding-validation.md 语义校验 + evals/examples.json 的 `plausible-but-false-causal-learning`/`false-causal-claim` case + knowledge-causality-judge.test.js 合成反事实判定，机制存在且被测试锁定。维持归因：该候选已在静态层兑现，行为层兑现属 S3 范围。

## 主责深挖面发现（B05/B06 + 归因验证）

- **B05 复核**：失败路径覆盖完整且互不冲突——worker 启动失败→inline fallback（research.md:3）；artifact 写失败→inline 返回完整输出（research.md:60）；脚本不可解析→手工 gate 且必须在输出中声明（assembly.md:38-49）；session 脚本缺失→显式跳过话术（session-history.md:44）；发布中途失败→报告精确 partial publication 且不得 emit complete（promotion.md:10、lightweight.md:37、report.md:3）。三处关于 partial publication 的表述语义一致，且被 spec-compound-reference-contracts.test.js:43-47 锁定。无盲目重试条款；唯一 "correct once"（research.md:3 参数拒绝）有次数上限。
- **B06 复核**：完成信号纪律三态分立（complete/skipped/精确 partial）在 SKILL.md:14、report.md:21-47、lightweight.md:41-60 一致；evals/cases/headless-no-qualifying-no-complete.yaml 与 unsolved-no-write.yaml 用可执行 fixture 锁定负例。审查质量面：grounding-validation.md:16 明确 "flag 是问题不是失败"、禁止自动改写，误报路径（确认 intentional/annotate）与漏报路径（NOTE 也要复核，含 Lightweight，grounding-validation.md:22）均有交代。
- **归因复核结论**：O09（假因果）维持"机制已建立"归因并建议关闭候选状态；未发现新机制性缺口。finding 1/2 为同根因（跨文件编号引用不一致）的文档级 P3，与历史归因无涉。

## 未读文件

- `scripts/validate-doc-claims.py`（421 行）、`scripts/session-history/extract-*.py` 三件套（共 1362 行）、`scripts/session-history/discover-sessions.sh`（130 行）：只读了 docstring 与测试侧合同（session-history-scripts.test.js、compound-candidate-claims.test.js 共 300+ 行断言覆盖其行为边界），未逐行通读实现。理由：本轮为静态合同层评审，脚本行为已由分层单测锁定，逐行读实现不改变 D03/B05 的静态裁决。未覆盖后果：实现内若存在与测试未覆盖分支相关的缺陷（如特定平台路径解析边角），本轮不能排除。
- `references/agents/` 下 6 个 enhancement agent 资产中，只通读了 best-practices-researcher.md 与 security-sentinel.md 头部合同段，performance-oracle/data-integrity-guardian/pattern-recognition-specialist 仅确认存在与 invocation contract 模式。理由：它们是可选项（Phase 2.46），不阻塞主链路裁决。未覆盖后果：个别 agent 资产若含越权或过时指令未被发现。
- evals fixtures 的 `repos/*` 与 `scripts/check-*.sh`：抽查了 check 脚本存在性与 case 绑定，未逐行核 fixture 源码。理由：fixture 语义由 knowledge-causality-judge.test.js 等行为测试直接执行锁定。未覆盖后果：fixture 过期风险由 CI 而非本轮承担。

## 结论一句话

spec-compound 静态合同层 18 项全部 pass/合理 not-applicable：知识沉淀的"确定性地板 + 语义裁决 + 诚实降级"三层机制完整且被测试与行为 eval 双面锁定，仅余两处 P3 级跨文件编号引用不一致值得顺手清理。
