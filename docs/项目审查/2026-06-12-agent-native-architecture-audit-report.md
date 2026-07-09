---
doc_role: review-report
authority: review-evidence
status: current
review_date: 2026-06-12
last_updated: 2026-06-13
review_method: agent-native-audit rubric + 10-lens bounded parallel explorers + adversarial verification (43 agents) + source re-confirmation; consolidates the 2026-06-12 8-principle pass
note: 本文是对 spec-first 当前仓库的 agent-native architecture audit 报告。2026-06-13 经三轮收敛：(1) 10-lens + 对抗验证重跑并与 2026-06-12 首轮汇总；(2) 对 W1 做项目深挖 + 业界调研；(3) 对每个存活发现（W2-W6/L1-L4）逐条源码深挖 + 业界调研 + 修正建议。期间修正了本报告自身多处高估（W2 两轮下修、W3/W4 降为 Observation、L1 dead-fixture 诊断推翻、L3 update-check-only 前提 stale、W6 维度数 8→11），均记入 §5。发现与建议是 review evidence，不是已拍板实施计划；落地前仍需回源核对当前 source。
---

# spec-first agent-native architecture audit 报告（2026-06-12 首轮 + 2026-06-13 收敛）

## 0. 结论先行

**spec-first 本身就是一个高度成熟的 agent-native 系统，并且是同类中的范本级实现。** 它把 agent-native taxonomy 几乎 1:1 落到自身工程哲学上：核心信条 **"Scripts prepare, LLM decides / Light contract + Explicit boundaries / Gate the exits, not the thinking"** 正是 "primitive tools + prompt-native judgment" 的精确表述。

递归映射（spec-first 作为被审计的 agent-native 系统）：

| Taxonomy 概念 | spec-first 对应物 |
| --- | --- |
| Users | 开发者（驱动 Claude/Codex 的人） |
| Agents | 执行 `spec-*` / `spec-*` workflow 的 Claude/Codex（在 loop 中运行） |
| Primitive tools | CLI（init/doctor/clean/update/tasks/session）+ skill scripts + MCP provider |
| Prompt-native features | SKILL.md / agent profile / template prose |
| Shared workspace | git repo + `.spec-first/**` artifacts |
| Context injection | SessionStart 注入 + CLAUDE.md/AGENTS.md managed blocks |
| Production guardrails | mutation gate、redaction、honest-closeout、source/runtime 边界 |

**两轮综合判断：10-lens 简单平均 74%；剔除两个 Partial 维度后 82%。** 这个差值本身就是结论：**8 个架构核心 lens 全部 ≥71%（其中 6 个 ≥83%），只有 CRUD(50%) 与 Eval 覆盖(30%) 两项把均值拖低。** 但**其中 CRUD 的 50% 经 2026-06-13 复核后属低估**——W2（plan 归档）被撤回，CRUD 的真实缺口仅剩一个 status 口径 lint，实际健康度远高于 50%。因此**真正的系统性短板只有一个：Eval 覆盖广度**。架构层面（parity / prompt-native / shared-workspace / source-runtime 边界）已是范本级，无需结构性改动。

**对抗验证 + 逐条深挖的价值在本轮非常显著：** 2026-06-13 重跑的初判 10 Critical / 21 Warning 中，**6 个被证伪 drop、约 13 个降为 Observation**。随后对**每个存活发现再做源码深挖 + 业界调研**（见 §3/§4），又进一步修正：W2 两轮下修到"CI 接线"（XS）、W3/W4 下修为 Observation、L1 的"dead fixture"诊断被推翻（实为 e2e.sh 接线的 live-but-vestigial）、L3 的"update 是 check-only"前提已 stale（现真执行升级）、W6 维度数从 8 更正为 11。**净结论：经两轮收敛，真正值得动手的只剩少量加固项，无一架构缺陷；且本报告自身的多处高估已被逐条记录（见 §5）。**

---

## 1. 审计方式与边界

### 1.1 三轮执行方式

| 轮次 | 日期 | 方法 | 覆盖 |
| --- | --- | --- | --- |
| 首轮 | 2026-06-12 | 8-principle rubric，bounded parallel first（5 项）+ 3 项 sequential fallback | `skills/agent-native-audit/SKILL.md` 8 原则 |
| 收敛轮 | 2026-06-13 | 10-lens（8 原则 + production-guardrails + eval-readiness），全并行 explorer + **对抗式二次验证**（43 agents，2.2M tokens），高分发现回源独立复核 | canonical taxonomy 全量 |
| 深挖轮 | 2026-06-13 | 对每个存活发现派专属 agent（需对标的用可联网 agent，纯核验用 Explore）做"源码核验 + 业界/项目自有最佳实践 + 修正建议 + 反过度工程边界"；W1 单独做项目深挖 + 业界调研（6 agent） | W1-W6 + L1-L4 逐条 |

收敛轮把 Critical/Warning 全部送入对抗 reviewer（默认证伪立场）。深挖轮进一步修正了本报告自身多处高估，关键修正（W2/L1/L3/L4/W6）由审查者本人回源核对 file:line。

### 1.2 适配口径

`spec-first` 不是传统带前端 UI 的业务应用，而是 Node.js CLI + 双宿主 workflow harness。agent-native 术语按仓库实际形态适配：

| Agent-native 术语 | 本仓库审计映射 |
| --- | --- |
| UI/user action | 用户可见 CLI、公开 `spec-*` / `spec-*` workflow、README/doctor/help 引导、source docs 中的操作路径 |
| Agent tool | skills、agents、workflow prompts、CLI/scripts、host runtime adapters、MCP/provider readiness |
| UI integration | source 变更到 host runtime mirror、preview-first 写入、doctor/init/update 提示、workflow 输出反馈 |
| Shared workspace | 用户与 agent 共同操作的 git worktree、source-of-truth 文件、generated runtime mirror 边界、`.spec-first/**` artifacts |
| CRUD entity | spec/plan/tasks/review/knowledge、runtime assets、contracts、provider readiness facts、changelog、developer profile |

### 1.3 非目标

- 不审计业务安全、性能或发布流程。
- 不把 generated runtime mirrors（`.claude/`、`.codex/`、`.agents/skills/`）当作 source 修复目标。
- 不运行 `spec-first init`、`clean`、`update` 等 state-changing runtime 修复命令。
- 不生成 `.spec-first/audits/**` 审计 artifact；本文是 `docs/项目审查/` 下的 durable review report。
- 未运行 fresh-source eval：本轮为只读源码审查，未触发 agent/skill prose 变更，无会话缓存风险；如需对 reviewer agent 行为做行为级验证，应另跑 fresh-source eval。

---

## 2. 总评分表（2026-06-13 对抗验证后）

| Core Principle (canonical lens) | Score | 状态 | 说明 |
| --- | ---: | --- | --- |
| Action Parity | 27/30 (90%) | ✅ Excellent | 全生命周期可达；3 个 CLI-only（init/clean/repair-worktree）是有意边界 |
| Primitive Tools | 34/48 (71%) | ✅ Good | 验证后绝大多数"违规"是误判；真实残留：check-health URL 重复(W5)、validator reason_code(W4，已降 Obs)、3 个 live-but-vestigial legacy 脚本(L1，被 e2e.sh 接线，整组删除) |
| Context Injection | 13/17 (76%) | ✅ Good | 注入机制健全；可强化显式能力图/readiness facts 注入 |
| Shared Workspace | 8/9 (88%) | ✅ Excellent | 单一 source-of-truth，无 sandbox/sync-layer 反模式 |
| CRUD Completeness | 5/10 (50%) | ⚠️ Partial→✅ | 验证后多数"缺 DELETE"被证伪；**W2 复核后亦撤回**——plan 状态流转流程里已有，物理删除对决策证据有害。唯一真实残留：status 口径漂移（小 lint 可解）。实际 CRUD 健康度高于 50% |
| UI Integration（no silent write） | 15/18 (83%) | ✅ Excellent | preview-first + 路径播报，无 silent action |
| Capability Discovery | 18/21 (86%) | ✅ Excellent | 路由表 + README + guide mode + 故意隐藏 internal helper |
| Prompt-Native Features | 18/20 (90%) | ✅ Excellent | workflow 逻辑全在 prose，CLI 仅做确定性 prep——**零降级发现** |
| Production Guardrails | 7/11 (64%) | ✅ Good | guardrails 文档实为 **11 个维度**（原写 8 系笔误）；redaction/tracing/checkpoint/completion 齐备；W3 经深挖确认 clean 属"可逆可 auto-apply"非违规 |
| Eval Readiness | 11/37 (30%) | ⚠️ Partial | **唯一系统性短板**。方法论方向正确（已对标业界），真实缺口是覆盖广度 + schema 发散；30% 部分被评分器文件名匹配人为压低（详见 W1） |

**综合 agent-native 成熟度：10-lens 简单平均 74%；剔除 CRUD/Eval 两个 Partial 维度后 82%。** 计算口径：10 项百分比简单平均（不按分母加权）= 73.9%；若只看 8 个架构核心 lens（剔除 CRUD 50%、Eval 30%）= 82.4%。状态分布：8 项 Excellent/Good，2 项 Partial（CRUD、Eval）。短板集中在覆盖广度，非架构。

> 与 2026-06-12 首轮（8 原则简单平均 79%）方向一致。本轮 10-lens 全平均（74%）低于首轮，主要因为新增的 Eval Readiness(30%) 是首轮未单列的维度；CRUD 的 50% 在 2026-06-13 复核后已确认为低估（W2 撤回），其真实健康度高于评分。架构核心 lens 两轮均为高分，两轮无方向性冲突。**净结论：扣分集中于 Eval 覆盖单一维度。**

**分数消费口径：** 上表 Score 保留审计 rubric 的历史打分与对抗验证后的解释，不是当前实施优先级或 deterministic gate。落地排序应以逐条回源后的 `验证` / `严重度` / `effort` / `ROI` 为准：CRUD 50% 是已确认低估的 historical score，不应继续驱动整改；Eval readiness 30% 才是当前唯一系统性短板。

---

## 3. 逐条深挖后的发现（每条经源码核验 + 业界调研 + 修正建议）

> **本节方法：** 2026-06-13 对每个存活发现派一个专属 agent 做"源码核验 → 业界/项目自有最佳实践 → 最小化建议 + 反过度工程边界"，关键修正由审查者本人回源复核（W2/L1/L3/L4/W6 已逐一核对 file:line）。删除线标题表示该发现经深挖被下修或前提被推翻。严重度与 effort 已据深挖更新。

### W1 · Eval readiness 是唯一系统性短板 ⚠️ 最高优先级
**Lens:** eval-readiness · **验证:** partially-confirmed（从 Critical 降级）；2026-06-13 经项目深挖 + 业界调研后细化建议

> **方法学结论先行：** 业界对"prompt/skill 定义的能力"的 eval 共识恰恰是**轻量**的——结构化 golden examples + 廉价断言（CI 每次跑）+ LLM/人工抽查（按节奏跑），**明确反对快照断言 prose 输出、反对追求 100% 覆盖、反对硬 gate**。**spec-first 的 eval 方法论方向是对的**（它不是"没做 eval"，而是做了正确的最小形态）；真实缺口是**覆盖广度 + 内部一致性**，而非方法。

**事实（已核对源码，修正此前计数）：**
- 18 个 public `workflow_command` 中**仅 4 个有 `evals/`**（22%）：`spec-work`、`spec-doc-review`、`spec-prd`、`retired-skill-review`。另两个常被一起提的 `spec-write-tasks`（standalone skill）与 `using-spec-first`（meta skill）不是 public workflow_command。原报告"14/18 缺、6 个有"的口径已据此更正。
- 测试只做**结构校验**（`tests/unit/*eval*`、`*contracts*`：文件存在、`schema_version`、id 唯一、enum/coverage_tags 覆盖、`source_refs` 路径有效且非 mirror），**不跑模型**——语义判断交给 fresh-source-eval。这正是 "scripts 验结构、LLM 判语义" 边界，与业界 L1 层一致。
- 评分器是**文件名匹配**（已核对 `skills/retired-skill-review/scripts/write-audit-artifacts.js:261-264`：`/trigger/i`、`/boundary/i` 等 regex 命中文件名）。后果：`using-spec-first` 有内容充实的 `routing-cases.json`（带 `expected_outcome`/`dispatch_decision`/`fallback_reason`），却因文件名不含 `trigger`/`boundary` 被评 "partial"——**30% 这个分数被命名漂移人为压低**。

**为何降级而非 Critical：** `eval-readiness-rubric.md:12` 明确 eval 是 "recommended for high-traffic" 而非全量强制；`skill-agent-quality-governance.md:77` 显式豁免 optional/internal skill；`retired-skill-review/SKILL.md` 亦定 "scorecards are signals, not gates"。"14 个全算 Critical" 是过度判定。

**深挖出的两个真实缺陷（此前文档未点明）：**
- **缺陷 A — fixture schema 发散：** 现有 5 套并存且字段名漂移——`spec-write-tasks`(enum-coverage 4 文件: `expected_decision`/`expected_failure`)、`prompt-examples/v1`(work/doc-review/using-spec-first 共用: `user_intent`/`expected_posture`/`negative_signal`)、`spec-prd-evals.v1`(40+ id 大集)、`agent-native...eval-examples.v1`(`coverage_tags`/`forbidden_signals`)、`skill-review`(极简 singleton)。无统一公共契约。
- **缺陷 B — 评分器文件名匹配**（见上），污染 readiness 分数。

**业界对标（一手来源，已抓取）：**
- Anthropic skill 指导（support.claude.com/creating-custom-skills）：测**触发精度**，用触发/不触发示例 prompt 跑并迭代 `description`——**无快照断言 prose 的建议**。
- Anthropic tool/MCP eval（anthropic.com/engineering/writing-tools-for-agents）：golden 任务 + **灵活 verifier** + held-out 集；明确警告"避免过严 verifier 因格式/标点/换词判错""避免过度指定策略"。
- Hamel Husain 分层（hamel.dev/blog/posts/evals）：L1 断言(每次)／L2 人工+LLM-judge(按节奏，**先对齐人工标注再信 judge**)／L3 A/B；**"pass rate 不必 100%，是产品决策"**。
- 防 fixture-as-spec 五法：对 rubric/reference 评分而非精确串、fixture 带 source_refs 溯源、threshold 断言集、版本化快照、meta-eval 校验 judge。spec-first 已具备其中 `forbidden_signals` + `source_refs` 两项。

**修正后的建议（替换原"补 fixture"粗建议，按 ROI 排序）：**
1. **P1 统一 fixture schema 契约**（解决缺陷 A，最高 ROI）：定一个最小公共 envelope（`id` / `input`或`user_intent` / `expected_outcome` / `boundary_note` / `forbidden_signals[]` / `source_refs[]`），各 skill 特定字段作扩展——把 5 套收敛为 1 套 + adapter，正是仓库自己的 "canonical + 局部 adapter" 范式。
2. **P2 评分器改为读 `coverage_tags`/schema 而非文件名 regex**（解决缺陷 B）：改完 `using-spec-first` 等会立即升为真实状态，readiness 分数更诚实。
3. **P3 只给 4 个高频+高风险 workflow 补 trigger+boundary 两类**（风险优先，非全覆盖）：`spec-plan / spec-code-review / spec-debug / spec-compound`，**不强求 failure/expected 四件套**（rubric:12 也是这个优先级）。
4. **P4 把 fresh-source-eval 从"手动"变成有节奏的 L2**：PR 模板放 fresh-source-eval 输出占位 + 抽样做 judge↔人工 agreement。**不做硬 CI gate**（违反 light-contract，随机系统会 flaky）。
5. **P5（可选）路由 eval 加聚合视图**：`using-spec-first` routing-cases 汇总成 confusion-matrix / per-class pass-rate，让"过度触发"趋势可见。

**反过度工程红线：** 不引入重型 eval 框架（promptfoo/LangSmith/Braintrust——OSS MVP 共识就是"golden JSON + 廉价断言 + 抽查"，引入外部框架制造 provider 依赖，违反 provider-neutral）；不快照断言 prose；不硬 gate（eval 是 advisory 护栏）。

### W2 · ~~Plan 实体缺 DELETE/归档~~ → 经深挖大幅下修：enum 测试已存在，仅剩"CI 接线 + 1 个 tracker 出格"
**Lens:** crud-completeness · **验证:** 二次深挖后**进一步下修**（XS，conf 0.95）

> **2026-06-13 两次修正：** (1) 用户质询后撤回 "plan 缺归档功能"；(2) 深挖后再发现——**校验机制已经存在**，原"需要新增 status enum 校验测试"的建议也基本被现有资产满足。

- **状态流转已自动化：** `spec-work/SKILL.md:223` 规定 closeout 自动写回 `status: active → completed`，写不动记 `completion_status.reason_code` 降级——非人工补登。
- **enum 契约 + 测试已存在（深挖新发现）：** `tests/unit/plan-status-taxonomy.test.js:9` 已定义 canonical `PLAN_STATUSES = {active, partially-shipped, completed, superseded}`，`plan-template.md:11` 同步该 enum，测试只校验 `feat/fix/refactor` 类型 plan。**原报告说的"缺确定性校验"是不准确的。**
- **"口径漂移"经核对大半是误报：** `complete`(1) 与 `"derived"`(1) 都在 **markdown code-fence 里的示例**（非真实 frontmatter）；`closed`(1) 是 `type: tracker` 文档，测试有意跳过。**真正出格的只有 1 个**（`2026-05-08-001` tracker），且不在 plan-type 范围。129 个 `completed` / 20 个 `superseded` / 3 个 `active` 全部合规。
- **物理删除仍不该做：** plan 是决策证据 artifact，删 completed 丢 provenance，违反 "可信证据优先"——与 knowledge 用 stale-mark 同理。
- **修正后建议（XS）：** 唯一剩余动作是把已存在的 `plan-status-taxonomy.test.js` 纳入 **GitHub CI 触发路径**（它已经属于 `npm run test:unit` / `npm test`，但现有 GitHub workflows 不直接运行该 Jest slice），让 `docs/plans/**`、`tests/unit/plan-status-taxonomy.test.js` 或 `skills/spec-plan/references/plan-template.md` 变更时能自动拦截漂移。**不新增** schema/archive/迁移；不动 129 个合规条目。
- **自查反思：** 本条经两轮下修——Critical→Warning→XS（CI 接线）。是本报告**自身最大的高估**，已计入 §5 诚实度记录。

### W3 · ~~破坏性 mutation 缺强制确认门~~ → 深挖下修为 Observation（按项目自有 guardrail 阶梯，auto-apply 合规）
**Lens:** production-guardrails · **验证:** 源码确认但**严重度下修**（Observation，S，conf 0.86）

- **事实（源码确认）：** `clean.js:107` 主路径（`--claude/--codex` 非 `--dry-run`）直接 `applyOperationPlan` 且**应用前无任何预览输出**；对比 `--workspace-orphans` 先 `printWorkspaceOrphanPreview` 再要求 `--confirm`（196-200）。CLI 既有 skip-prompt 约定是 **`-y/--yes`**（见 `init.js:239`），**非 `--force`**——原建议"或要求 --yes"用词需纠正。
- **为何下修为 Observation（深挖新论据）：** `clean` 仅移除 spec-first **managed** assets（`buildCleanPlan` 372-422），全部可由 `init` 重建。按项目**自有** guardrail 文档 `runtime-production-guardrails.md:38-43` 的 stakes/reversibility 阶梯，"低 stakes + 易回滚"档**显式允许 auto-apply**。所以这不是 guardrail 违规，只是 UX 不一致。
- **修正后建议（最小，S）：** (1) 应用前 **echo 既有 dry-run plan 摘要**（`clean.js:107` 前）；(2) `printHelp` 补 `--dry-run` 提示。(3) 可选：仅当出现具体非交互/CI 需求时，加 `-y/--yes` + TTY-aware soft confirm（镜像 `init.js`）。
- **反过度工程：** **不**在主路径强制 y/N 硬 prompt，**不**加 `--force`，**不**加 checkpoint/rollback/审计字段——op 可逆，硬门违反 "gate the exits not the thinking"。

### W4 · ~~schema-validator 缺 reason_code~~ → 深挖下修为 Observation（无消费者被阻塞，按需再做）
**Lens:** primitive-tools · **验证:** 事实成立但**下修为 Observation**（S，conf 0.85）

- **事实：** `schema-validator.js` 的 `validateAgainstSchema()` 输出 prose 错误串，无结构化 reason_code。
- **为何下修（深挖新论据）：** (a) 现有 `errors[]` prose 数组是**被 6+ 测试和多消费者钉死的 load-bearing 契约**，替换是 breaking change 且当前零收益；(b) **没有任何消费者**正在 parse prose 做分类判断——做了 reason_code 也无人用，属 speculative surface。
- **修正后建议（仅在有真实消费者时，S）：** 用**向后兼容的附加式**——不动 `errors[]`，并行 push 一个 `details[]`，每项 `{ keyword, instanceLocation }`，其中 `keyword` 复用已在作用域内的 JSON Schema 关键字（`type`/`enum`/`required`/`pattern`…）。**对齐 JSON Schema 关键字命名**，不自造第二套词汇。
- **反过度工程：** **不**引入 AJV（违反 light-contract，hand-rolled validator 是有意为之）；**不**加 2020-12 detailed/verbose 嵌套树；**不**把"可恢复 vs 阻断"分类逻辑塞进 validator（那是消费者的语义判断）；无消费者就**先不做**。

### W5 · check-health 残留硬编码 helper URL（与 registry 双份维护）⚠️
**Lens:** primitive-tools · **验证:** confirmed（XS，conf 0.99；bash + PowerShell 两侧均确认）

- **事实（源码确认）：** `check-health:56-68`（bash）与 `check-health.ps1:51-64`（PowerShell）**两侧都**把 7-8 个 helper URL 内联在 case/switch 里——而同文件的 install-command 路径已分别委派给 `lib-helper-registry.sh` / `lib-helper-registry.ps1`，且 `helper-tools.json` 的 `safety.source_repo` 字段**已含全部 8 个 helper（含 `ast-grep-skill`）且 URL 完全一致**。
- **修正后建议（纯重构，XS）：** 给两个 registry lib 各加一个访问器（`helper_registry_project_url()` / `Get-HelperProjectUrl()`，jq / 对象属性查询，复用现有同款模式），`build_project_url()` 改为委派。删 ~12 行静态维护代码，零行为变化。
- **反过度工程：** 不新建 URL registry 文件、不改 `helper-tools.json` 结构、不加运行时 HTTP 拉取。

### W6 · runtime-production-guardrails 缺"维度→workflow"映射索引 ⚠️
**Lens:** eval-readiness · **验证:** 成立，**修正：是 11 个维度不是 8 个**（S，conf 0.9）

- **事实（已核对）：** `runtime-production-guardrails.md` 实际有 **11 个 `##` 维度**（原报告全文写 "8" 系笔误：external-facts / workspace-authority / least-privilege / secret-redaction / network-posture / approval / audit-tracing / checkpoints / completion / HITL / eval-gates）。其中 10 个被 `agent-native-architecture-contracts.test.js:195-206` 锁住；`External facts and social sources` 当前未进入该测试锚点。
- **gap 真实但是 Observation 级：** guardrail 约束**确实分散存在**于各 workflow（深挖抽样 5 个 SKILL 逐条确认：spec-work `review_gate`/`stop_if`/honest-closeout、spec-code-review `sensitive_diff`/`gated_auto`、spec-mcp-setup `explicit_consent_required`、spec-debug context-exclusion、spec-plan completion-check），且各自通过自己的 contract test——只是**无单一索引**。
- **修正后建议（S，复用项目自有范式）：** 在 `runtime-production-guardrails.md` **末尾**追加一张 `## Guardrail dimension → workflow application` 表（~11 行，prose-as-data），仿 `agent-native-audit` 的 **Adapter map** 范式（项目已有的"canonical + 局部 adapter"写法）。**防腐做法（关键）：** 先决定 `External facts and social sources` 是否进入 application 索引；若进入，则把它补进测试锚点并断言 11 个 dimension 都有行；若不进入，则在表前明示它是 evidence-intake guardrail 而非 workflow-application 维度。测试只断言 dimension 行存在，**不断言右列具体 workflow 名**（那是会 churn 的语义判断）。
- **反过度工程：** 不建 `docs/contracts/` 新文件、不建 schema/generator、不从 source 解析 keyword 生成表（keyword 出现≠语义应用，且会把 LLM 判断重编码进 script）。约 15 行 markdown + 6 行测试封顶。

---

## 4. 首轮（2026-06-12）独有发现 + 本轮深挖修正

收敛轮的 lens 聚焦 `src/cli/` + `skills/*/scripts/`，未扫顶层 `scripts/*.sh` 与命名口径漂移。以下首轮发现经 2026-06-13 逐条深挖，**其中 L1、L3 的原表述被修正**：

### L1 · ~~Legacy 脚本是 dead fixture~~ → 修正：它们是 live-but-vestigial（被 e2e.sh 接线），整组删除
**验证:** Observation，但**原"零消费者"诊断被推翻**（XS，conf 0.88）

- **原报告错误：** 我此前说三个 legacy 脚本"未被任何 live 代码 wire、是 dead fixture"。**这是错的。**
- **深挖回源更正：** `tests/integration/e2e.sh` 在 **14 处**调用这三个脚本（`task-manager.sh`/`stage-gate.sh`/`review-judge.sh`），而 `scripts/run-test-suite.cjs:100` 在 `test:integration`（属 `npm test`）里跑 e2e.sh——**它们每次 CI 都执行**，不是 inert。缓解事实：(a) 不随包发布（`package.json files` 白名单排除 `scripts/*.sh` + `tests/`）；(b) 自 2026-03-29 创建后再无功能演进。
- **本质：** 这是被废弃的强状态机设计的**化石**——`review-judge.sh` 在 shell 里输出 `pass:false` 语义裁决，违反 "scripts 不做语义决策"；真实 review 路径早已迁到 skills/agents。
- **修正后建议（XS）：** **整组删除 4 个文件**（3 脚本 + `tests/integration/e2e.sh`，e2e.sh 唯一用途就是驱动这三个、不测任何当前产品行为）+ 删 `run-test-suite.cjs:100` 那行 + 跑 `npm test` 确认绿 + CHANGELOG 记录（非 user-visible）。删除前需确认当前 integration 覆盖仍由 `verification-gate.integration.test.js` 与 `spec-work-closeout-producer.test.js` 承载；不为 legacy shell path 重造替代 e2e。CLAUDE.md "不删预存死代码除非被要求" 的豁免条件已满足（审查 P3 + 2026-06-10 P1-10 均已点名退役）。
- **反过度工程：** 不写 "primitive validator 替代品"（无 live workflow 需要这些 primitive）、不建 legacy 归档目录、不加 deprecation header——未发布的内部化石，git history 即恢复网。

### L2 · `spec-runtime-setup` alias 口径漂移（出现在 3 处）⚠️
**验证:** Warning（XS，conf 0.95）；**比原报告更严重——是 3 处不是 1 处**

- **深挖回源：** `spec-runtime-setup` 作为"未来入口"出现在 **3 个 source**：`templates/claude/commands/spec/mcp-setup.md:10`、`skills/spec-mcp-setup/SKILL.md:9`、及其 generated mirror。无 `runtime-setup.md` 命令文件、governance 无 `command_aliases` 实现；`using-spec-first/SKILL.md:230` 路由表只认 `spec-mcp-setup`。违反项目自有的 "不广告不存在的命令" 规则。alias 实现已在 `2026-06-08-004` 单独 tracked/deferred。
- **修正后建议（XS）：** 把 2 个 source 的 prose 从"recommended future entrypoint"改为明确当前入口 + deferral 注记（指向 tracked plan）；generated mirror 由 `init` 重生，不手改。可选：加 skill-review 断言扫描"广告未实现命令"的 prose 模式。

### L3 · ~~update 是 check-only~~ → 修正：前提已 STALE，update 现在真执行升级；真实 drift 只剩 1 行 help text
**验证:** Warning，但**原前提被推翻**（XS，conf 0.95）

- **原报告/首轮错误：** 反复说 "update 是 check-only / 从不自动升级"。**这已 stale。**
- **深挖回源更正：** `2026-06-12-003-feat-update-perform-upgrade-plan` 已 `completed`；`src/cli/commands/update.js:36-39` 现在**无条件执行 `npm install -g spec-first@latest`**，旧 `--json/--claude/--codex` check-only flag 已移除（只接受 `-h`），升级后提示用户跑 `init`。
- **真实 drift 只剩 1 行：** `src/cli/index.js:161` 的 help text 仍写 `(check-only; never auto-upgrades)`——**唯一过期处**。README/README.zh-CN/version-reminder/using-spec-first 路由**均已正确**。首轮"多 surface 口径漂移"是**过度描述**。
- **修正后建议（XS）：** 改 `index.js:161` 一行为"Upgrade the spec-first CLI package to latest version"。可选加一个 grep-lint 防 help/README 再漂移。**不建** command-metadata schema。

### L4 · runtime drift 可见性 — 确认一个真实 `.pyc` false-positive bug（plugin.js 完整性遍历）⚠️
**验证:** Warning，(a) 确认真 bug，(b)(c) 原表述过度（S，conf 0.92）

- **(a) 真 bug（已核对）：** `plugin.js` 的 skill-support-integrity 遍历（`listDirectoryFiles` → `skillSupportFileIntegrityIssues`）递归 source skill 目录**无 ignore 过滤**，把每个非 `SKILL.md` 文件当 runtime support file。仓库实际有 **10 个 `.pyc`**（`skills/gemini-imagegen/scripts/__pycache__/*` 等，`.gitignore:72-73` 已声明为非 source、git 未跟踪）。跑过 Python skill 脚本后，`doctor` 会报**虚假 drift** 并催用户跑 `init`；且同款无过滤遍历也用于 copy，`init` 会把 `.pyc` propagate 进 mirror。
- **(b)(c) 原表述过度（深挖更正）：** `doctor --json` **已有**分层 freshness 模型（`runtime_asset_health`、`workflow_runnability_basis`、`evidence_freshness`），`checkManagedState` **已检测** manifest-version staleness——只是没单独 labeled 字段。per-host refresh guidance（`formatInitGuidance`）和 source→runtime→cache 区分（CLAUDE.md）**也已存在**。真实 gap 比"freshness 未暴露"窄得多。
- **修正后建议：** (a) **现在做**——在 `plugin.js` 的 `listDirectoryFiles` 加一个集中的小 ignore set（`__pycache__`/`.DS_Store`/`node_modules`/`.git` + `.pyc`/`.pyo`），copy/plan 同款遍历共用；加 1 个单测。(b) 可选/低成本——把已算出的 manifest-version staleness 提升为 `doctor --json` 顶层 `runtime_catalog_freshness` 字段（不新建遍历）。(c) 纯文档——CLAUDE.md closeout 加一行 `runtime impact: none|init claude|init codex|both`。
- **反过度工程：** 不建完整 catalog/manifest-hash 子系统、不建可配置 ignore-glob 引擎、不运行时读 `.gitignore`；ignore set 保持单个小 hardcoded Set。

---

## 5. 被对抗验证证伪 / 降级的发现（审查诚实度记录）

以下 2026-06-13 初判**不应进入待办**，因为误读了有意设计：

| 初判 | 结论 | 为何被推翻 |
| --- | --- | --- |
| `instruction-bootstrap.js` 做"策略判断"（Critical） | misframed→Observation | marker-based 块管理是确定性文本操作，非语义决策 |
| `task-pack.js deriveValidity()` 做"语义分类"（Warning） | misframed→Observation | 是 schema 校验输出 validity，非架构判断 |
| readiness facts 未在 SessionStart 注入（Critical） | misframed→Observation | 故意：setup 产 facts，workflow 按需消费，非启动期强注入 |
| Requirements/TaskPack/Review/Changelog "缺 DELETE" | refuted→drop | TaskPack 故意 derived/ephemeral；Changelog 是 append-only 设计；均非真实缺口 |
| public workflow "无 Failure Modes section"（Critical） | refuted→drop | 测试用 case-insensitive 文本匹配，所有 20 个 skill 实际都有（表格或 h3 形式），测试 PASS |
| fresh-source eval "未强制执行"（Critical） | refuted→Observation | 故意 conditional：dispatch 不可用时记录 `not_run` + fallback evidence，强制化会违反 light-contract |
| "无单一清单列出隐藏 skill"（Warning） | refuted→drop | 每个 internal skill 自带 `disable-model-invocation`/internal notice，分布式标记有效 |
| **W2 "Plan 缺 DELETE/归档"（Warning）** | **两轮下修 → XS（CI 接线）** | ①状态流转已自动写回；②深挖再发现 enum+测试已存在（`plan-status-taxonomy.test.js`），"口径漂移"大半是 code-fence 示例误读，真出格仅 1 个 tracker。本报告**最大高估** |
| **W3 "clean 缺确认门"（Warning）** | **深挖 → Observation** | 按项目自有 guardrail 阶梯，"可逆+易重建"显式允许 auto-apply；非违规，仅 UX 不一致 |
| **W4 "validator 缺 reason_code"（Warning）** | **深挖 → Observation** | `errors[]` 是被 6+ 测试钉死的契约；无消费者 parse prose，做了也无人用，speculative |
| **L1 "legacy 脚本是 dead fixture"（Observation）** | **诊断被推翻** | 实为 e2e.sh 14 处接线、`npm test` 执行的 live-but-vestigial；处置从"退役为 fixture"改为"整组删除 4 文件" |
| **L3 "update 是 check-only"（Observation）** | **前提已 stale** | `2026-06-12-003` 已落地，update 现真执行升级；真实 drift 只剩 `index.js:161` 1 行 help text |
| **W6 "8 类 guardrail"** | **计数更正 → 11 类** | guardrails 文档实有 11 个 `##` 维度；原报告全文 "8" 系笔误 |

---

## 6. 做得卓越的地方（Top 7）

1. **Prompt-native 纯度满分（零降级发现）：** workflow 逻辑 100% 在 SKILL.md prose，`src/cli/adapters` 只做确定性路径改写，**无 workflow 状态机硬编码**——完美贯彻 "gate the exits, not the thinking"。
2. **Shared-workspace 无反模式：** 单一 source-of-truth（repo + `.spec-first/`），source/runtime split 由 contract test 机械强制，**无 sandbox 隔离、无 sync-layer、无 dual-write**。
3. **Source/runtime 边界是教科书级 guardrail：** generated mirror（`.claude/.codex/.agents/skills`）被测试套件阻止当 source 改，唯一再生路径是 `spec-first init`。
4. **honest-closeout 完成语义：** closeout claim 必须指向结构化 evidence；诚实上报 `not-run/failed/degraded` 会降级 verdict 而非伪造通过——直击 "completion semantics + tracing" 两大 guardrail。
5. **Preview-first 落地：** init 强制 diagnostics→preview→confirm→apply→announce，artifact 路径带 emoji 播报，atomic write 防半写，**无 silent action**。
6. **Context governance 显式化：** 默认排除 runtime/audit/mirror，summary-first + reason_code，cache-friendly prompt layout（稳定前缀 + 动态后缀）。
7. **双宿主对称 + 路由成熟：** Claude/Codex 特性对等，using-spec-first 路由表覆盖全意图且不强制 brainstorm-first，internal helper 正确隐藏。

---

## 7. 行动清单（按优先级与可并行性）

Effort 口径：XS≈单文件几行；S≈一个聚焦改动+窄测试；M≈跨文件/需设计。所有项均 light-contract（无硬 gate、无重型框架）。**优先级不等于 effort：W1 是主线系统性整改，XS 项是可并行的卫生收敛。**

**主线｜Eval readiness 系统性收敛（最高优先级）**

| 行动 | 来源 | Effort | 说明 |
| --- | --- | --- | --- |
| **统一 fixture schema 契约**（5 套发散→1 套最小 envelope + adapter） | W1-P1 | M | 最高 ROI；先定公共字段与扩展边界，再迁移评分器和 fixture |
| eval 评分器改读 `coverage_tags`/schema 而非文件名 regex（`write-audit-artifacts.js:261-264`） | W1-P2 | S | 让 readiness 分数反映真实覆盖，而不是文件名命中 |
| 给 spec-plan/code-review/debug/compound 补 `trigger`+`boundary` fixture（仅这 4 个，不求四件套） | W1-P3 | M | 风险优先，不追求全 workflow 覆盖 |
| fresh-source-eval 升为有节奏的 L2（PR 模板占位 + judge↔人工 agreement 抽样，**不做硬 gate**） | W1-P4 | S–M | 保持 advisory，不把非确定性 judge 变成 release blocker |

**并行卫生批｜XS/S 确定性收敛**

| 行动 | 来源 | Effort |
| --- | --- | --- |
| `index.js:161` help text 改掉过期的 "check-only; never auto-upgrades"（update 现真升级） | L3 | XS |
| `check-health` build_project_url 改读 registry（bash + ps1 两侧），删 ~12 行硬编码 URL | W5 | XS |
| L2 两处 source prose 去掉 "未来入口 `spec-runtime-setup`"，改当前入口 + deferral 注记 | L2 | XS |
| 把既有 `plan-status-taxonomy.test.js` 接入 GitHub CI 触发路径（不新增 schema/archive） | W2 | XS |
| 整组删除 4 个 legacy 文件（review-judge/stage-gate/task-manager.sh + e2e.sh）+ 删 run-test-suite:100 那行；确认当前 Jest integration tests 仍承载现有覆盖 | L1 | XS |
| `plugin.js` 完整性/copy 遍历加集中 ignore set（`__pycache__`/`.pyc`/`.DS_Store`…），修 `.pyc` 虚假 drift；加 1 单测 | L4(a) | S |
| `runtime-production-guardrails.md` 末尾加 "维度→workflow" 索引表；先处理 external-facts 是否入测试锚点，再断言维度行存在 | W6 | S |
| 可选：`clean` 主路径应用前 echo dry-run 摘要 + help 补 `--dry-run` 提示（**不**加硬 prompt/`--force`） | W3 | S |

**条件项｜有消费者或明确需求后再做**

| 行动 | 来源 | Effort |
| --- | --- | --- |
| validator 加向后兼容 `details[].{keyword,instanceLocation}`（**仅当有消费者**） | W4 | S |
| `doctor --json` 把 manifest staleness 提升为 `runtime_catalog_freshness` 字段；CLAUDE.md closeout 加 `runtime impact` 一行 | L4(b)(c) | S |

**一句话总结：** spec-first 在 agent-native 架构层面已是范本级实现，eval 方法论方向也对（已对标业界）。经两轮收敛，**唯一系统性维度是 eval 覆盖**（W1：统一 schema > 修评分器 > 补 4 个高频 > judge 对齐）；其余全是 XS/S 级确定性卫生收敛，可并行做但不应稀释 W1 的主线优先级。架构无需改动，不引入重型 eval 框架，不加硬 gate。

---

## 8. 证据、局限与后续使用

### 8.1 Review evidence ledger

| 证据层 | 当前可用证据 | 不可复放 / 限制 |
| --- | --- | --- |
| 报告正文 | 本文保留每条 finding 的 source path、line hint、验证口径与下修记录 | 原始 explorer/verifier 输出未落地为 `.spec-first/audits/**` 机器 artifact |
| 源码回源 | W1/W2/L1/L3/L4/W6 的关键修正由审查者回源核对；W3/W4/W5/L2 带 source_check 引用 | 落地任一行动前仍需对当前 HEAD 重新核对 source/test，因为本文是 review evidence，不是 deterministic verdict |
| 外部调研 | W1 记录 Anthropic/Hamel 等一手来源与抓取限制 | 部分 provider docs 抓取受限；外部结论只作为 design pressure，不写入 spec-first contract 字段 |
| 运行验证 | 未运行 state-changing runtime 修复命令；未运行 fresh-source eval | 无完整可重跑审计 run id、token trace、agent transcript；不能据本文声称“43 agents 输出可复验” |

后续 `spec-plan` / `spec-work` 消费本文时，应把本 ledger 当作 handoff boundary：先回源确认当前 source，再按第 7 节拆小切片执行，不能把分数或旧 agent 输出当作 confirmed truth。

### 8.2 直接证据路径

- `skills/agent-native-architecture/SKILL.md` + `references/checklists.md` + `references/runtime-production-guardrails.md`（rubric）
- `skills/agent-native-audit/SKILL.md`、`agents/spec-agent-native-reviewer.agent.md`
- `skills/using-spec-first/SKILL.md`（router = capability discovery + context injection）
- `src/cli/index.js`、`src/cli/instruction-bootstrap.js`、`src/cli/commands/clean.js`
- `src/contracts/schema-validator.js`、`skills/spec-mcp-setup/scripts/check-health`
- `docs/contracts/context-governance.md`、`docs/contracts/workflows/honest-closeout.md`
- `docs/10-prompt/结构化项目角色契约.md`、`templates/claude/commands/spec/mcp-setup.md`
- `skills/agent-native-architecture/evals/examples.json`、`tests/unit/agent-native-architecture-eval-readiness.test.js`
- `docs/validation/2026-05-12-plan-lifecycle-cleanup.md`
- W1 深挖（2026-06-13）：`skills/retired-skill-review/scripts/write-audit-artifacts.js:261-264`、`skills/retired-skill-review/references/eval-readiness-rubric.md`、`docs/contracts/workflows/skill-agent-quality-governance.md:77`、`docs/contracts/workflows/fresh-source-eval-checklist.md`、`src/cli/contracts/dual-host-governance/skills-governance.json`、5 套 evals/ fixture（spec-write-tasks / prompt-examples-v1 / spec-prd / agent-native / skill-review）
- W1 业界来源（2026-06-13，一手抓取）：Anthropic「Creating custom skills」(support.claude.com)、「Writing effective tools for agents」(anthropic.com/engineering)、Hamel Husain「Your AI Product Needs Evals」(hamel.dev)、MT-Bench (arXiv:2306.05685)、Length-Controlled AlpacaEval (arXiv:2404.04475)、promptfoo / OpenAI Evals / Inspect(AISI) / Braintrust / DeepEval 文档；Anthropic 部分 docs 区域受限未能抓取，已标注
- 深挖轮（2026-06-13）核对文件：`tests/unit/plan-status-taxonomy.test.js:9`（W2 enum 已存在）、`tests/integration/e2e.sh` + `scripts/run-test-suite.cjs:100`（L1 接线）、`src/cli/commands/update.js:36-39` + `src/cli/index.js:161`（L3 升级已落地/help 过期）、`src/cli/plugin.js`（L4 `.pyc` 遍历）、`skills/agent-native-architecture/references/runtime-production-guardrails.md`（W6 实为 11 维度）、`skills/spec-mcp-setup/scripts/check-health.ps1` + `lib-helper-registry.{sh,ps1}`（W5 两侧确认）、`src/cli/commands/clean.js:372-422`（W3 仅删 managed）、`templates/claude/commands/spec/mcp-setup.md:10` + `skills/spec-mcp-setup/SKILL.md:9`（L2 三处 alias）
- 前序：`docs/项目审查/2026-06-10-全项目综合审查报告.md`、本文 2026-06-12 首轮

### 8.3 局限声明

- 收敛轮 10 lens 全并行 + 对抗验证（43 agents，2.2M tokens）；深挖轮逐发现 9 agent + W1 6 agent。其中 W2/L1/L3/L4/W6 的关键修正由审查者本人回源核对 file:line；W3/W4/W5/L2 依赖深挖 agent 的 source_check（已附引用行号，未逐条二次复核）。
- 深挖轮纠正了本报告自身多处高估（见 §5），这是审查诚实度的体现，也提示：**首轮/收敛轮的 source_check 在覆盖广度上有盲区**（如 L1 漏看 e2e.sh 接线、L3 漏看 update 已升级、W6 维度计数笔误）——落地任何一条前仍应回源再确认。
- 业界调研存在抓取局限：WebSearch 在本环境返回降级结果，外部引用主要经 `mcp__fetch__fetch` 抓取一手来源；Anthropic 部分 docs 区域受限未能抓取，相关结论已标注为 established-knowledge 而非新抓取。
- 原始 explorer/verifier 输出在会话上下文中，未写入 `.spec-first/audits/**`。本文是收敛后的 durable review report，不是机器可复放的审计 artifact；因此所有行动项落地前必须以当前 source/test/log 重新确认。
- 分数是 LLM-owned judgment，依赖 source 证据与 audit rubric；不是 deterministic script verdict。
- 未运行 runtime 修复命令；未运行 fresh-source eval（本轮无 prose 变更）。

### 8.4 建议消费方式

本报告可作为后续 `spec-plan` 或 `spec-work` 的输入证据，但不应被直接当作实施计划。落地整改建议按第 7 节拆成小切片，每个切片重新回源确认：目标/非目标、source-of-truth 与 generated runtime 边界、script-owned facts 与 LLM-owned judgment 分工、README/docs/CHANGELOG 是否同步、Claude/Codex runtime impact、focused tests 或 doc-contract checks。
