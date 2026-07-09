# spec-first 全量战略体检报告(负责人视角)

- **日期**:2026-05-30
- **审查者角色**:Spec-First Evolution Architect
- **审查形态**:全量战略体检式质量审计(非 diff review)。覆盖 `skills/`、`agents/`、`src/cli/`、`src/cli/contracts/`、`templates/`、生成骨架。维度化抽样,6 维度并行 reviewer。
- **审查基线**:`docs/10-prompt/结构化项目角色契约.md` v2.0 + `CLAUDE.md` + `AGENTS.md`
- **取证策略**:GitNexus 当前为 definitions-only(`query_global_graph: true`、`impact_context: false`),仅用作 orientation pointer;所有 finding 均经 Bash/Read direct source 复核。2026-05-31 复核时 canonical graph artifacts 已 stale,下文不声称 graph-fresh evidence。
- **资产规模(已复核)**:38 skill(19 command-backed / 19 no-command)、51 agent、19 个公开 `spec-*` command 模板。

---

## 结论先行

项目地基**扎实**,**无 P0**。

核心哲学(Light contract / Scripts-prepare-LLM-decides / advisory-vs-confirmed / 反状态机)在脚本与 skill 层被高度一致地遵守;skill 治理有三层正式机制(`filteredAssetSet` + `DELIVERED_INTERNAL_SKILLS` + `skills-governance.json`);CLI 工程质量高(plan 路径有 realpath 逃逸守卫、git 调用无注入、preview-first 到位)。

真正值钱的发现集中在三处**系统性缺口**:
1. **Codex 双宿主退化**(确凿 bug,Claude 正常 / Codex 退化)
2. **agent 侧缺 skill 侧那种治理** → 孤儿自动泄漏 runtime
3. **schema 校验器静默放行** → 侵蚀"确定性事实"承诺

> 判断问题:这次体检指向的演化,是否让 AI coding 更可治理、可验证、可复用、可沉淀?
> 答案:#1 的根因修复(用确定性 agent basename 事实源替代后缀启发式)是典型的"用 20% 机制关掉 80% 隐患";#5 属于更大的 agent delivery governance 设计,应单独规划,不阻塞 #1。

---

## 审计方法与边界

- **script-owned facts**(orchestrator 确定性采集,可直接采信):资产清单、引用计数、入口注册对齐、生成机制、白名单匹配测试。
- **LLM-owned judgment**(维度化 reviewer 语义判断 + orchestrator 复核):边界违规、过度设计、哲学侵蚀、契约缺口。
- **6 个维度**:① 孤儿资产/80-20 ② source/runtime+双宿主 ③ CLI 正确性/契约 ④ 哲学一致性 ⑤ workflow 入口治理 ⑥ skill/agent prose 边界。
- **confidence-gate**:保留 ≥75;P0/P1 即使 50+ 也保留(critical-but-uncertain 不静默丢弃)。

**事实自我校正**:初次采集报告"36 skill",经入口治理 reviewer 双向差集核对 governance JSON 并经 orchestrator 复核,实际为 **38 skill / 19 command-backed / 19 no-command**。本报告以 38 为准。

---

## P1 — 应尽快修

### #1 Codex adapter agent 名重写白名单漏掉 `analyzer`,spec-plan 在 Codex 上退化(`iterator` 为未交付 source 风险) ⚠️ 头号发现

- **位置**:`src/cli/adapters/codex.js:212`
- **confidence**:100(source/runtime + prose 双维印证,orchestrator 已直接复核)
- **维度**:source/runtime 边界与双宿主

**问题**:Codex 没有 Claude 的 agent 注册表,必须靠 `.codex/agents/*.agent.md` 显式路径定位 agent profile。重写正则用**手写后缀白名单**而非真实 agent 名集合:

```
/`(spec-[a-z0-9-]+(?:agent|reviewer|researcher|analyst|specialist|oracle|sentinel|guardian|strategist|expert|detector|sync|resolver|historian|writer))`/g
```

白名单**不含 `analyzer`**。实测确认 2 个已注册 agent 的反引号引用在 Codex runtime 仍是裸名、无法解析:

| 漏重写 agent | 被几个 skill 反引号引用 | 影响 |
|---|---|---|
| `spec-spec-flow-analyzer` | 2 | spec-plan deepening 核心子分析 |
| `spec-git-history-analyzer` | 1 | spec-plan deepening |

agent 实体已被 `syncAgents` 全量部署到 `.codex/agents/`,但 skill prose 不指向它 → **Claude 正常、Codex 退化的真实双宿主不一致**。

复核校准:`spec-design-iterator` 也属于后缀白名单外的 agent,但它当前出现在 `frontend-design` source prose 中;`frontend-design` 在 governance 中为 `internal_only` 且默认未交付到 runtime,所以它是同类未来风险,不是当前默认 Codex runtime 的第三个实测命中。

**根因**:用启发式后缀猜测代替确定性事实(`listBundledAgents()`)。违反"scripts produce deterministic facts"。任何新增 agent 用了白名单外后缀都会静默漏重写,无编译期信号。

**附带盲区**:`src/cli/plugin.js:50` 的 `CODEX_UNREWRITTEN_PATH_PATTERNS` 只匹配 `.claude/` 路径泄漏和 `ce:` canonical 名,不匹配"本应重写成 `.codex/agents/` 但仍是裸名"的引用 → 该问题在 doctor/inspect 里被判 PASS。

**修复**:
1. 用 `listBundledAgents()` 派生的真实 agent basename 集合做重写匹配,消除后缀维护负担;保留 `Task spec-x(...)` 形式处理。
2. 在 Codex drift 检测补一条 `codex_agent_rewrite_drift` 规则(扫描反引号 `spec-<已注册agent名>` 仍为裸名即报),与重写共享同一份"已注册 agent 名"事实源。
3. 补 Codex contract test 断言 spec-plan 运行时这两个 analyzer 被重写为 `.codex/agents/...agent.md`,并用 synthetic analyzer/iterator fixture 防止新增后缀再次漏重写。

---

### #2 schema-validator 在缺 `type:object` 时静默跳过 required 校验

- **位置**:`src/contracts/schema-validator.js:113`
- **confidence**:100(reviewer 已实测复现)
- **维度**:CLI 正确性与契约

**问题**:`required`/`properties`/`additionalProperties` 校验被包在 `schemaAllowsType(schema,'object')` 守卫里。任何省略 `type:"object"` 的子 schema(合法 JSON Schema 写法)会让 required 缺失字段**不报错**。

实测:`validateAgainstSchema({required:['a'],properties:{a:{type:'string'}}}, {})` → `{valid:true}`。

doctor 的 verification-evidence 校验、session-store、spec-work-run-artifact 都依赖此校验器做 readiness/证据判定。漏校验 → "simulated/verified" 等结论可能建立在未真正验证的输入上,直接侵蚀"确定性事实"承诺。当前所有消费中的 schema 恰好都写了 `type:object`,属侥幸未触雷。

**修复**:当 schema 含 `required`/`properties`/`additionalProperties` 且 value 是普通对象时,无条件执行对象级校验,不以 `type:object` 显式声明为前提。

---

### #3 公开 workflow prose 委托加载的 helper 在两宿主均被 skip,runtime 不可解析

- **位置**:`skills/spec-work/references/shipping-workflow.md:127`、`skills/spec-brainstorm/references/handoff.md:77` 等
- **confidence**:75(仓库交付契约缺口明确;宿主外部是否另行提供同名 skill 仍有歧义)
- **维度**:workflow 入口治理
- **关联**:延续 `docs/项目审查/2026-05-07-source-code-comprehensive-review.md:154` 的 P1-6 未闭环

**问题**:spec-work 让 agent `Load the git-commit-push-pr skill`(line 127)/`load the git-commit skill`(line 137),spec-brainstorm/spec-ideate/spec-plan 让 agent `Load the proof skill`。但这些 skill 在 governance 标 `internal_only` + `host_delivery=internal`,且不在 `DELIVERED_INTERNAL_SKILLS` allowlist(只有 git-worktree),`buildFilteredAssetSet` 实测它们进入 skipped(16 个),Claude/Codex runtime 目录里不存在对应 SKILL.md。用户在主体工作完成后的收尾阶段才会遇到"加载不到 skill"的断裂。

置信度校准:作为 **spec-first 自身 source→runtime delivery contract** 的缺口,该 finding 可直接由 governance + runtime plan 复核;唯一不确定的是这些名称是否由某个宿主外部生态另行提供。若确属宿主外部依赖,公开 workflow prose 必须显式声明来源与缺失 fallback,不能让仓库 bundle 的 skipped source 形成多真相源。

**修复**:在 governance contract 明确区分"spec-first 交付的 internal helper"与"依赖宿主自带的能力"两类;新增 source→runtime delivery verifier:扫描所有公开 workflow 中的 `Load the <skill> skill`,断言目标在当前宿主 runtime 可解析,否则报错或要求 prose 写明宿主依赖与缺失 fallback。

---

### #4 read-only reviewer/researcher 缺 `tools` 约束,prose 只读承诺无工具层兜底

- **位置**:`agents/spec-session-historian.agent.md`、`agents/spec-slack-researcher.agent.md`
- **confidence**:100
- **维度**:skill/agent prose 边界

**问题**:spec-session-historian 正文明确写"Never write any files. Return text findings only."(line 43),但 frontmatter 无 `tools` 字段 → 运行时继承宿主全部工具(含 Write/Edit/Bash)。prose 契约与实际工具授权矛盾:正文的只读承诺没有工具层兜底,一旦模型偏离 prose 就能写文件。spec-slack-researcher(纯检索摘要)同样无 tools 约束。对比:多数审查 agent 已显式钉住 `Read, Grep, Glob, Bash`,少数研究/实现 agent 另有 Web/MCP 或写入能力边界。

**修复**:给 spec-session-historian 补明确 read-only tools。spec-slack-researcher 需要先确认当前 host agent frontmatter 是否能表达 Slack MCP read-only allowlist;若能表达,补 `Read, Grep, Glob, Bash` + Slack read-only MCP tools;若不能表达,必须在 orchestrator dispatch contract/linter 中建显式例外与降级说明,不能简单加 `Read, Grep, Glob, Bash` 导致 Slack 检索能力被静默剪掉。skill-review linter 增加"reviewer/researcher 必须显式声明工具边界或登记例外"校验。

---

## P2 — 该修但不紧急

### #5 agent 部署缺 allowlist/governance,孤儿自动泄漏 runtime(架构不对称)

- **位置**:`src/cli/plugin.js:460`(`listBundledAgents()`) | confidence 100 | 维度:孤儿资产/80-20

skills 有三层治理(`filteredAssetSet` 分类 + `DELIVERED_INTERNAL_SKILLS` allowlist + `skills-governance.json` contract),能精确控制 standalone/internal/workflow 的部署与暴露;agents 走 `listBundledAgents()` 全目录扫描,**无 allowlist、无 governance contract、无 internal/external 分类**。任何孤儿 agent 一旦放进 `agents/` 就自动全量部署到 `.claude/agents/` 等 runtime(51 个源 agent 与 runtime 1:1),治理只能靠人工 docs 审查兜底。

**修复**(Light contract,避免照搬 skill 完整 contract):先引入轻量 agent metadata/manifest,至少记录 `delivery_intent`、`dispatch_surface`、`dispatched_by` 或 `manual_only`。第一步只做 lint/report:报告"声明但无 consumer"、"manual-only 但自动部署"、"被 workflow 引用但未声明"。是否跳过 runtime 部署必须由显式 metadata 决定,不要由 0-dispatch grep 结果自动推断,否则脚本会越界替代语义判断。#1 可以先独立用 bundled agent basename 修复;#5 不应阻塞 #1。

### #6 孤儿 agent `spec-ankane-readme-writer`

`agents/spec-ankane-readme-writer.agent.md` | confidence 100 | 维度:孤儿资产

0 dispatch(skills/src/templates 中零真实调度引用,所有出现都在 agents/ 自身与 docs 审查表)。Ruby gem README writer 对 Node.js CLI harness 自身无任何触发路径。已被部署进 `.claude/agents/`(2607 bytes)。**修复**:若判定对下游 Ruby 用户仍是预留能力,显式纳入一个 standalone docs workflow 并标 manual-only;否则从 `agents/` 移除。不应默默全量部署。

### #7 孤儿 agent `spec-design-implementation-reviewer`(carrying-cost 倒挂)

`agents/spec-design-implementation-reviewer.agent.md` | confidence 100 | 维度:孤儿资产 + prose 双维印证

0 dispatch,却在 `docs/plans/` 里被两次 browser 重构计划显式列为 Modify 目标 → **被改但不被用,维护成本 > 调用价值的倒挂**。同时与已被调度的 spec-figma-design-sync 职责重叠(前者偏"报告 fix",后者偏"直接改代码"),但 prose 无任何 mutually-exclusive 边界声明。**修复**:补边界声明;若无独立价值则合并进 figma-design-sync 或移除。

### #8 using-spec-first 漏覆盖 2 个公开入口

`skills/using-spec-first/SKILL.md:211` | confidence 100 | 维度:入口治理

19 个 command-backed workflow 中,`app-consistency-audit` 与 `skill-review` 在 Route Map 和 Scenario Routing 里一次都没出现。governor 自我定位为 entry governor 理应覆盖全部公开入口,但 guide mode 永远不会推荐这两个。**修复**:Route Map 补两行意图→入口映射。

### #9 git-commit-push-pr 分类自相矛盾

`skills/using-spec-first/SKILL.md:230` | confidence 75 | 维度:入口治理

该 skill 在 governance 是 `internal_only`/`host_delivery=internal`,却被写进 Route Map(line 230,"PR description writing"),与同文档 line 268("Internal-only skills remain source/runtime support assets, not menu items")和 Hard Rule 8(line 304)直接冲突。对比正确做法:git-worktree 既进 allowlist 又 `user-invocable:false` 又只在 prose 内被委托,从不进 Route Map。**修复**:二选一对齐——从 Route Map 删除改为仅 prose 内委托,或重新归类为 `standalone_skill`。

### #10 internal_only skill 的 frontmatter 仍用用户触发语

`src/cli/contracts/dual-host-governance/skills-governance.json:94` | confidence 75 | 维度:入口治理

git-commit("Use when the user says commit")、frontend-design("Use for any frontend work")、gemini-imagegen、test-browser 等 frontmatter 是典型 standalone 用户触发语,而非 internal-helper 框架语。对比模范:git-worktree("Internal helper...use only when delegated by spec-work")、lfg("Internal-only; do not recommend")。当前因 skip 而用户触达不到,属低实际损害但分类意图不清。**修复**:统一收敛到 internal 框架语;在 governance README 补"为何 bundle source 却全部 skip"的 rationale。

### #11 spec-security-sentinel 契约弱于同族

`agents/spec-security-sentinel.agent.md` | confidence 75 | 维度:prose 边界

security 三件套整体是刻意分层(reviewer=diff 级 persona / lens=plan 级 / sentinel=deep audit),分层合理且各有 wiring。但 sentinel 契约明显更弱:无 anchored confidence 校准、无结构化 JSON findings schema、无误报抑制规则,自动路由里最易产噪声、最难被 synthesis 去重。**修复**:对齐 deep-audit 契约(补 anchored confidence + 误报抑制 + 结构化输出),或明确标注"用户显式调用的深度审计,不进默认 dispatch"。

### #12 imperative sync* 与 plan 路径双实现,删除路径缺逃逸守卫

`src/cli/plugin.js:737` | confidence 75 | 维度:CLI 正确性

`syncSkills`/`syncAgents` 直接 `fs.rmSync(targetDir,{recursive,force})`,没有 `state.js` 中 `applyOperationPlan` 的 realpath 容器校验(`assertOperationTargetContained`)。当前生产 init/clean 走 plan 路径(有守卫),imperative sync* 仅被单测调用——但它们是导出 API,若未来被新调用方接入会绕过统一逃逸防护,且两套逻辑易语义漂移。**修复**:若仅供测试,降级为测试 helper 或收窄导出 + 注释标注;若保留为公共 API,复用 plan 路径或补同等 realpath 校验。

### #13 schema-validator 忽略已声明未实现的关键字,静默放行

`src/contracts/schema-validator.js:170` | confidence 100 | 维度:CLI 正确性

只实现 `minimum`/`maximum`,未实现 `exclusiveMinimum`/`exclusiveMaximum`/`uniqueItems`/`multipleOf`;`format` 当前在测试里被明确当作 advisory/ignored keyword,且大量 schema 使用 `$schema`/`$id`/`title`/`description` 等 annotation keyword。实测 `{type:'integer',exclusiveMinimum:0}` 对值 `0` 返回 `valid:true`。**修复**:不要对所有未知 keyword 一刀切 fail-closed;应区分 annotation keyword 与 assertion keyword。对未实现但会改变约束语义的 assertion keyword fail-closed 或补实现;对 `$schema`/`$id`/`title`/`description`/`format` 等已明确 advisory/annotation 的 keyword 建 allow-ignore 清单,并用测试锁定。

---

## P3 — 小改进(择期)

| # | 问题 | 位置 |
|---|------|------|
| #14 | 空的 `tests/e2e/` 目录误导:e2e 实际在 `tests/integration/e2e.sh`(`scripts/run-test-suite.cjs:113` 调用),CLAUDE.md 的 e2e 覆盖声明属实,但空目录造成组织歧义 | `tests/e2e/` |
| #15 | atomic-write 重复实现:`init.js:1644` 与 `gitnexus-instruction-block.js:317` 各内联一份弱版 `writeJsonFileAtomic`(无 tmp 清理),应复用 `src/cli/atomic-write.js` | init.js / gitnexus-instruction-block.js |
| #16 | `spec-dhh-rails-style` 目录名 vs frontmatter `name: dhh-rails-style` 不一致——已被 `lint-skill-structure.js` 的 `ALLOWED_FRONTMATTER_NAME_ALIASES` 白名单治理,非 bug,加一行注释即可 | `skills/spec-dhh-rails-style/SKILL.md:2` |
| #17 | graph-bootstrap 脚本随 reason_code 附带较长 remediation 散文,确定性合规但临界,建议收敛以防脚本散文滑向 next-action 权威 | `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh:2091` |
| #18 | `secret-deny` 的 `**/*token*` 等宽匹配误报面大(globToRegex 实现本身正确),应确认消费方当 advisory 而非硬 block | `src/cli/contracts/security/secret-deny-patterns.json:25` |
| #19 | `writeFileAtomicIfAbsent` 依赖 `linkSync` 的 EEXIST 语义,跨设备(EXDEV)/不支持硬链接的 FS 上行为退化未被区分处理 | `src/cli/atomic-write.js:30` |

---

## 重要纠偏(防止过度反应)

- **"51 agent 多数未被调度"不成立**:初始引用计数显示大量 agent 仅 1 引用,经核实那 1 个引用 100% 是真实 conditional workflow dispatch(如 spec-architecture-strategist ← spec-plan/deepening、spec-code-simplicity-reviewer ← spec-compound、spec-web-researcher ← spec-ideate)。**真孤儿只有 2 个**(#6/#7),agent 调度覆盖率约 96%。**不要因引用计数低而误删被 conditional workflow 调度的 agent。**
- **stack-specific reviewer 不是 80/20 违规**:swift-ios/dhh-rails/julik-frontend-races/kieran-* 对 Node.js CLI 自身不触发,但是面向下游 Rails/Swift/iOS 用户的合法预留能力包,且已有健康的 diff-gated 条件 dispatch(不命中就不 spawn,执行期边际成本=0)。**不应裁撤**,唯一可改进是未来按 stack gating 部署以降低单用户 runtime 噪声。
- **受保护 artifact**:`docs/brainstorms/*`、`docs/plans/*.md`、`docs/solutions/*.md` 是 pipeline artifact,任何 finding 都不建议删除它们。

---

## 负面证据(健康,值得保持)

- **哲学一致性极强**:`bootstrap-providers.sh` 的 result_class 分类器仅按数组存在性 + FTS 诊断做确定性归类,SKILL.md 明确禁止脚本按扩展名/Git 状态判定文档库,把语义判断交 LLM;`compile-workspace-gitnexus-readiness.js` 全部 payload 标 `advisory:true` 带 reason_code;`resolve-base.sh` 只输出 `BASE:<sha>`/`ERROR:<msg>`;`verify-tools.sh` 的 `baseline_ready` 是布尔合取的投影而非语义结论。
- **advisory-vs-confirmed 纪律**:spec-code-review/spec-work 反复声明"Provider evidence is advisory: findings still need direct source confirmation""definitions-only 仅作 local file/symbol pointers",与当前 graph-facts(`impact_context:false`)真实能力完全吻合。
- **反状态机**:spec-work 明确"plan is a decision artifact; progress lives in git commits",忽略 legacy checkbox 作为 state。
- **CLI 安全**:plan 路径有 realpath symlink 逃逸守卫 + project-root 等于目标的拒绝;git 调用统一 `spawnSync` + 数组参数 + `GIT_LITERAL_PATHSPECS`,无命令注入;init 销毁性 reset 有 tmp 备份 + 回滚。
- **模范治理样本**:git-worktree、lfg、using-spec-first、spec-write-tasks 的分类是标杆;38 skill 与 governance contract 一一对应(双向差集为空);19 Claude command 与 19 workflow_command 严格 1:1(validateManifest 强制)。
- **research/security/design 系 agent 重叠主要是刻意分层**(structured persona vs lens vs deep-dive manual),非冗余。

---

## 最高杠杆的演化动作(负责人视角排序)

按"边际价值 / 边际成本"排:

1. **先独立修 #1 Codex agent 重写** — 用 `listBundledAgents()` 派生真实 basename 集合替代后缀白名单,补 `codex_agent_rewrite_drift` 和 spec-plan runtime contract test。这是窄而高价值的双宿主 bugfix,不应等待 agent governance 设计。
2. **修 #2 schema-validator** — 它守护整个 harness 的"确定性事实"承诺,放行 bug 影响面最广。窄修复,可直接用当前 host 的 work workflow。
3. **加 source→runtime helper 可解析性 verifier(#3)** — 把一类反复出现(2026-05-07 已记录)的断裂从人工审查变成持续可验证约束;同时为宿主外部 skill 依赖建立显式声明口径。
4. **#4 补 read-only agent 的 tools 约束** — session-historian 是窄修复;slack-researcher 需先确认 Slack MCP tool allowlist 表达方式,避免误剪能力。
5. **单独规划 #5 agent governance/allowlist** — 这是 source/runtime delivery contract 变更,需要 `spec-plan`/`spec-plan` 正式拆解。最小第一步是 metadata + lint/report,不是直接按 0-dispatch 跳过部署。

---

## 附:审计取证命令(可复现)

```bash
# agent 孤儿检测(引用计数)
for f in agents/*.agent.md; do base=$(basename "$f" .agent.md); \
  grep -rl "$base" skills/ templates/ src/ docs/contracts/ | grep -v "^agents/" | wc -l; done

# Codex 重写白名单漏匹配测试
WL="agent|reviewer|researcher|analyst|specialist|oracle|sentinel|guardian|strategist|expert|detector|sync|resolver|historian|writer"
for f in agents/*.agent.md; do base=$(basename "$f" .agent.md); \
  echo "$base" | grep -qE "(${WL})\$" || echo "MISS: $base"; done

# skill 计数核对
find skills -maxdepth 2 -name SKILL.md | wc -l                          # 38
grep -c '"skill_name"' src/cli/contracts/dual-host-governance/skills-governance.json  # 38
```
