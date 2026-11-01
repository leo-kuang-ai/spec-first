# spec-ideate 全量源码对照审查

- 状态：`source_review_complete`；仅表示源码理解、比较与融合裁定完成。
- 两方包内共 48 个文本文件、5626 行：入口、全部 references/agents/renderers、eval 和 fixture 全部逐段审读；fixture 的已有全文记录按当前 SHA-256 复用。截断区段已补读。
- 本地 source：`skills/spec-ideate/`；CE source：`/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/`。逐文件 hash、范围及 disposition 见 `../file-tables/spec-ideate.md`。
- 本轮只写审查材料，没有实施建议或修改 runtime。当前单模型 inline 审查，不宣称独立 reviewer 或真实模型收益。

## 意图与执行链

双方都解决“围绕真实项目，先产生足够多有依据的方向，再逐一反驳筛选”的发现问题；不承担需求、实现计划或代码 owner。执行链是 output/resume → subject/mode/substance/scaling → grounding → axes/scouts → 六类发散视角 → basis verification/owner arbitration → ranked artifact → 选中方向的 Brainstorm seed。

本地保留 CE 的主要研发能力：证据与指令分路；`direct/external/reasoned` 依据；主题轴与最多两轴恢复；tactical/go-deep 的碰撞处理；阶段性 checkpoint；HTML/Markdown 同内容不同呈现；选中想法的 focused handoff。不能把当前差异理解为“CE 全部尚未融合”。

## 能力与融合裁定

| 研发场景 | CE 源码事实 | spec-first 源码事实 | 裁定与最小优化 | 成本与验证 |
| --- | --- | --- | --- | --- |
| 从源代码而非通用清单找创新点 | `references/grounding.md:18` 起按 focus 定向 scan，缺 solutions 可跳过 learnings | 本地 `references/grounding.md:15` 起先 root orientation，再 repo facts，支持本次运行复用与事实来源 | 保留本地 source/context 边界；窄化吸收 focus-directed scan 和空知识库快速跳过，避免无关上下文挤占 | 低；比较有/无 focus、空 solutions 的实际读取与最终依据，不能仅用 token 数判质量 |
| 同时输入两个目录下同名调研文档 | CE `references/user-research-artifacts.md:18` 用 basename + absolute-path digest，并先检查本轮唯一性 | 本地同文件 `:10` 仅由 filename 派生 slug，`:12` 使用单个 dossier 路径 | **建议优先集成** collision-resistant slug 和本轮唯一性检查；serial fallback 同样存在覆盖风险 | 低；两个 `report.md` 验证不同 dossier、gist 指向及各自归因；未执行真实 distiller |
| 从 tracker 找高价值系统问题 | CE analyst `:7-16,96,104` 按 prevalence/severity/recurrence/breadth 判杠杆；区分 lifecycle/workflow state；closed momentum 可降低或提高关注度 | 本地 analyst `:11-28` 已有 staged call、真实能力、授权与非 GH 路径，但 `:140` 仍按 issue_count 排序；入口初始角色也写 GitHub issues | **建议集成语义目标**和实际 tracker typed-state 解释，保留精确目标及授权。不要恢复硬编码 MCP alias/工具 allowlist 或“有工具就能访问” | 中；用少量高危反复问题 vs 大量低危重复题的离线事实集验证排名、两轴状态和 unknown coverage |
| 初始 bounded scan 偏向最近/高优先级 | CE analyst `:61,71,106` 记录 fetch bounds，必要时在授权 scope 内补取欠代表 strata，并明确非全量 | 本地 issue reference `:8` 与 analyst `:14` 要 CLUSTER 不 refetch collection；本地已要求覆盖 accounting | **有条件集成**被 cap 时的有限补取与有依据的代表性；不把“禁止重复抓同集合”误当“永不补齐缺失层”。有外部读取需现有准确范围授权 | 中；mock 分层样本与 capped scan；无真实 tracker 覆盖验证，不能保证全量或自动宣称 saturation |
| frame 选择不能丢掉高影响低置信信号 | CE divergent `:70` 按 leverage 选 theme，confidence 仅在相近杠杆时打破平局 | 本地 divergent `:53` 只将 high/medium-confidence theme 作为 frame | 建议将 confidence 作为证据限制而非全局丢弃条件；低置信但高影响候选保留为待证假设，不升级为事实 | 低至中；离线主题集验证 source refs 和不确定性；不得直接执行候选建议 |
| 用户要求 top 3 或更高 raw total | CE divergent `:30-56`、post `:39-42`、universal `:102` 明确保留数量优先、小 raw total 当 survivor count，增量时恢复普通验证预算并披露每 idea 深度下降 | 本地 scope `:105` 起/软件与 universal generation 已携带 raw/survivor，post `:39-42` 和 universal `:95` 仍默认 5–7；divergent `:20` tactical 仍 2–3 reads | 建议统一已解析状态在 generation、verifier、final cut 的消费；吸收 CE 的预算与数量配对及诚实深度声明，不恢复刚性机队或固定模型 | 低；top3、3ideas、100ideas+quick、go-deep+quick、issue fallback 的真实产物/依据检查 |
| 缺可用/获授权 worker 时完成发现 | CE 默认派发五或六 worker，允许派发失败后自评 | 本地 SKILL `:56-79` 分离授权、能力、隔离、模型与并行事实；references 分别继承，inline 保留六视角且披露非独立 | **保留本地更强实现**；不将“工具存在/深度选择/费用提示”当 dispatch 授权。多视角自评不能称独立验证 | 不新增中央编排器；真实 fresh-context eval 未运行 |
| 研究与 provider 的数据边界 | CE grounding 常开 web；Slack opt-in；web cache 查 sibling runs | 本地 SKILL `:97-105` 外部研究独立 opt-in；private scratch 仅单次 invocation、不可跨运行复用 | **保留本地增强**；CE cross-run cache 和常开研究不适合直接迁入。可统一 grounding “within a session” 与 cache “this run” 用语 | 低；缺授权时零调用、两次 invocation 不读 sibling、cleanup 后不依赖 scratch 的行为 eval |
| 自动交付与恢复 | CE 无 repo 时 artifact 可仅放 temp；scratch 留给 OS；后续可发布 Proof | 本地 post `:54-64,144` 无 durable owner 时完整 inline/用户选路径，清理仅在 durable/inline 完成后；没有 Proof 产品面 | **保留本地设计**，不引入发布连接器/CE config 层。需统一 scope 的 “auto-written local file remains” 与此 fallback；下一步菜单也不能在 inline-only 时声称已保存 | 低；无 repo+无 durable path、写失败、resume、same-day fresh collision 的结果检查 |
| selected idea → Brainstorm 仍保持证据来源 | CE post `:115-120` 仅 title/description/basis/rationale/tradeoffs + provenance | 本地 post `:108-113` 增加 snapshot/dirty/stale/limitations/assumptions/一个邻接拒绝项，只有用户看过取舍才携带 transient settled brief；Brainstorm 单 durable owner | **已有更强融合**；保持 seed 轻量，不传整份 HTML、不从 ideation 跳到 Plan。通用题目的后续 Plan 由 Brainstorm 接管，并非无条件进入 Work | 直接核对本地 Brainstorm entry、universal 与 settled 协议；4套静态测试不等于真实 handoff 行为 |
| artifact 可读/可消费 | 双方 section contract 禁 idea status；两 renderer 保持 source 文本语义与图示非权威、prose 完整；CE 新增 optional work-relationship semantic marker | 本地 lifecycle 交由 section contract、HTML Doc-review report-only，Work 只接 implementation-ready software plan | 保留本地 consumer/owner 边界。不将 CE HTML mutation 和可变目录配置直接导入；work-relationship marker 是 Plan/Review 闭包议题，ideation 不应新建该字段 | 静态 parity 已验证；未渲染真实浏览器，不声称视觉可用性 |

## 已确认的源码冲突与待验证风险

1. **研究 dossier 命名冲突（P2，确定性路径推导，未运行真实 worker）**：本地 `user-research-artifacts.md:10-12` 对 `q3/report.md` 和 `q4/report.md` 都给出 `evidence-user-research-report.md`；后写可覆盖先写，两个 gist 仍指同文件。CE 的 full-path digest 是直接可采纳补丁。先在调度前判本轮路径唯一，不需要引入持久 registry。
2. **主题排序合同自相矛盾（P2，源码语义事实）**：本地 analyst `:14` 说 leverage，`:140` 说 count descending；issue reference `:8` 期待 leverage-ranked。另 divergent `:53` 可丢弃低置信但高危主题。需统一消费者与 producer；没有宣称已观察真实优先级误判。
3. **数量/验证预算状态未闭合（P2，源码语义事实）**：本地 post `:39-42`、universal `:95` 无 explicit survivor override；divergent `:20` 无 raised-volume 恢复 reads 的例外。CE 已有明确处理；要通过产物与引用验证，而非关键词“top 3”存在即放行。
4. **预算与全部核验存在张力（语义候选）**：verifier 能读实际依据，但没有明确定义对所有 surviving load-bearing bases 的核验最低覆盖；不能因为 dossier 未进主 owner context 就把 gist 当 confirmed evidence。保留当前 producer/consumer 证据层，并记录哪些引用实际读过。
5. **共有 renderer 的事实链接与语言约束（P2候选）**：本地 HTML `:242-245` /CE对应段总拼 `blob/main`，无法保证指向已读 revision，dirty 内容更不在 main；应使用确认的 commit/ref 或留 repo-relative，并披露 dirty。Markdown `:18-20` 要 ASCII headings，与中文自然语言要求需要界定为稳定协议 heading 及 anchor，不应强制全部用户标题英文。未探测真实远端链接。
6. **评测只检查输出文本，未证明实际工作**：E2E case 只要求输出含 `docs/ideation` 和 `.html`，没有校验文件存在、内容/引用/完整 rejection/写入边界。refine 路由只是输出出现 Skill 名；问句脚本只能证明形状。不能把这些 eval 当真实交付验收。

另：Slack researcher 将 silence 描述为 weak consent，最多属于组织上下文线索，不能生成用户授权或 settled provenance。其工具特定规则不能覆盖主入口当前会话能力发现与准确授权边界。双方 issue-agent 的“脚本总触发人工权限”是宿主假设，应按真实平台而非固定禁令处理。

## 资产与验证

- 本地独有 6 cases + eval config 保留测试意图，但上述 outcome/evidence coverage 需增强；fixture 根据当前 hash 复用已有全文审读，未把排除 Skill 的记录作为完成依据。
- 四个 agents 全读：learnings 的 knowledge/bug 双轨与现事实冲突优先已融合；Slack/web 结构化摘要、untrusted handling 与 relevance stop 已融合；其 CE 大量变化只是术语/路径适配，不值得重写本地。
- 实际运行：`jest --runInBand --runTestsByPath` 对 `spec-ideate-phase-contracts`、`spec-ideate-clarification-handoff-contracts`、`requirements-rendering-parity`、`settled-decisions-contracts`：**4 suites / 15 tests passed**。证据 `../ideate-tests.json`、`../ideate-tests.log`。
- 只证明当前磁盘的静态契约和 renderer parity；没有执行 skill-upper/fresh-model、真实 provider、tracker、Slack、真实浏览器或用户研发收益验证。没有 dispatch 授权，不派 reviewer。

## 最小融合顺序

先修唯一 dossier 路径、数量与杠杆排序的局部自洽；再在既有授权/预算边界内加入 capped scan 的分层补充和依据覆盖披露；最后做可复跑的真实产物 eval 与少量研发任务对照，判断 focus-directed grounding 是否提升质量。保持一个 workflow owner、单次 private scratch、Brainstorm 单 durable 产品决策 owner，不新增流程引擎、状态图或第二知识/发布系统。
