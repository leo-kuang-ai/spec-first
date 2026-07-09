# 业界最佳实践对标审查方案

## 结论

本方案基于业界 AI coding 发展趋势、同类项目方法论和最佳实践,对 spec-first 的 28 个迁移 skill 进行对标审查。审查维度来源于:

1. **Anthropic Context Engineering 指南** — context rot、attention budget、compaction、progressive disclosure
2. **Spec-Driven Development 工具全景(specdriven.com)** — Kiro、GitHub Spec Kit、BMAD、OpenSpec 等的 capability dimensions 和 executability gap
3. **Agent Skills 生态** — SKILL.md 跨工具标准、skill evals in CI、trigger precision 挑战
4. **AI Agent Observability** — Datadog harness-first agents、Sentry agent observability guide、structured tracing

本方案独立于 [CE→Spec-First 迁移代码审查方案](./2026-07-09-ce-to-spec-first-skill-code-review-plan.md),聚焦于"spec-first 是否符合业界最佳实践"而非"迁移是否正确"。

## 目标

- 对标业界 AI coding harness 的能力维度,识别 spec-first 在以下方面的差距和优势
- 产出按优先级排序的改进建议
- 为后续 skill 演化提供业界参照基线

## 非目标

- 不重复迁移正确性审查(已由主审查方案覆盖)
- 不对 spec-first 的架构设计做整体重写建议
- 不替代 spec-skill-audit 的治理审查

## 审查范围

与主审查方案一致:28 个迁移 skill(Batch 1-4),按批次顺序执行。

## 审查维度(8 项)

### 维度 1:Skill 可发现性与 Trigger 精度

**业界来源**:Minko Gechev 指出"改一段话可能导致 skill 完全无法被发现"是 agent skills 的重大挑战。Agent Skills Guide 2026 将 trigger precision 列为 cross-tool portability 的核心障碍。

**业界参照**:

- [Agent Skill Regression with Evals in CI](https://www.linkedin.com/posts/mgechev_github-mgechevskill-eval-unit-tests-for-activity-7436824406938759168-UO9L) — "changing a paragraph may regress your skill or make it completely non-discoverable"
- [AI Agent Skills Guide 2026](https://serenitiesai.com/articles/agent-skills-guide-2026) — SKILL.md 跨工具标准
- [A Comprehensive Survey on Agent Skills](https://arxiv.org/html/2605.07358v1) — skills as agent's "muscle memory"

**审查清单**:

| 审查点 | 检查内容 | 风险 | 验证方式 |
|---|---|---|---|
| description 精度 | 每个 SKILL.md 的 description 是否足够精确,让 host 能正确路由?是否有模糊描述导致 false-positive? | high | 逐文件审读,模拟用户输入判断是否触发正确 skill |
| near-neighbor 排除 | 相似 skill 之间是否有明确的 exclusion 说明?重点检查以下 pair:spec-brainstorm vs spec-ideate vs spec-prd;spec-debug vs spec-simplify-code;spec-code-review vs spec-doc-review;spec-work vs spec-lfg;spec-compound vs spec-compound-refresh | high | 对比每对 skill 的 "When to use" / "When not to use" |
| trigger 完整性 | 用户输入什么会触发这个 skill?是否有 false-negative(应该触发但没触发)? | high | 检查 description 中的 trigger 词汇覆盖度 |
| description 一致性 | source `skills/` 中的 description 与 runtime mirror(`.qoder/skills/`)中的是否一致? | medium | diff source vs runtime description |
| argument-hint 准确性 | 参数提示是否反映了实际支持的参数?CE 有则保留,是否有遗漏? | medium | 对比 SKILL.md argument-hint 与实际参数处理 |
| skill 名称与路由 | skill 名称是否符合 `spec-*` 命名约定?`using-spec-first` 路由表是否覆盖所有 skill? | medium | 检查 using-spec-first SKILL.md 路由表 |

**重点检查的 near-neighbor pair**:

```
spec-brainstorm ↔ spec-ideate    (需求发现 vs 想法生成)
spec-brainstorm ↔ spec-prd       (rough idea vs existing PRD)
spec-debug ↔ spec-simplify-code  (bug 修复 vs 代码简化)
spec-code-review ↔ spec-doc-review (代码审查 vs 文档审查)
spec-work ↔ spec-lfg             (单步执行 vs 完整流水线)
spec-compound ↔ spec-compound-refresh (写入 vs 维护)
spec-optimize ↔ spec-debug        (性能优化 vs 性能 regression 调试)
spec-polish ↔ spec-dogfood       (UI polish vs hands-off QA)
spec-explain ↔ spec-pov          (学习材料 vs 项目判断)
```

### 维度 2:Spec 可执行性差距(Executability Gap)

**业界来源**:specdriven.com 指出几乎所有 SDD 工具(Kiro、GitHub Spec Kit、BMAD、OpenSpec)都使用 markdown prose,"Readable, yes. Verifiable? No."。BDD 时代建立的"spec 应该是 executable"的共识在 LLM 时代被大量遗忘。

**业界参照**:

- [The Spec-Driven Tool Landscape](https://specdriven.com/landscape) — "Most use markdown prose. Readable, yes. Verifiable? No."
- Martin Fowler 的三种模式分析:spec-first、spec-anchored、spec-as-source
- GitHub Spec Kit 的批评:"a sea of markdown"、"The Waterfall Strikes Back"

**审查清单**:

| 审查点 | 检查内容 | 风险 | 验证方式 |
|---|---|---|---|
| artifact schema 验证 | 产出的 artifact(plan, task pack, review findings, learning)是否有 schema 验证? | high | 检查 `references/schema.yaml`、`references/findings-schema.json` 等 |
| spec-code drift 检测 | 是否有机制检测 spec/artifact 与实际 code 之间的 drift? | medium | 检查 `validate-doc-claims.py` 等脚本的覆盖范围 |
| deterministic validation | 脚本是否验证 artifact 的结构完整性(frontmatter, required fields, cited paths, commit SHAs, relative links)? | medium | 审读 validator 脚本逻辑 |
| executable vs prose-only 分类 | 哪些 artifact 是 executable contract(可机器验证),哪些是 prose-only(仅可读)?分类是否清晰? | medium | 列出所有 artifact 并分类 |
| spec-as-source 程度 | spec-first 接近 Martin Fowler 的哪种模式?spec-first(brainstorm/plan 在前)、spec-anchored(plan 指导但不生成)、还是 spec-as-source(spec 是 source of truth)? | low | 架构分析 |

**spec-first 与业界工具对比**:

| 能力 | GitHub Spec Kit | Kiro | BMAD | spec-first | 审查点 |
|---|---|---|---|---|---|
| Spec 格式 | Markdown templates | Markdown (EARS) | Multi-artifact markdown | Markdown + YAML frontmatter | 格式是否可验证? |
| 可执行性 | No | No | No | Partial(scripts validate structure) | spec-first 是否超越了行业基线? |
| 开源 | Yes (MIT) | Yes | Yes | Yes (MIT) | — |
| Brownfield 支持 | Partial | No | Partial | Yes | spec-first 的 brownfield 优势是否体现? |
| Traceability | Git-versioned | Limited | Git-versioned | artifact + source refs | 追溯链是否完整? |

### 维度 3:跨工具可移植性

**业界来源**:SKILL.md 正在成为跨 Claude Code、Cursor、Codex、Gemini CLI 的通用标准。Agent Skills Guide 2026 列出了 16+ 支持 SKILL.md 的工具。

**业界参照**:

- [AI Agent Skills Guide 2026](https://serenitiesai.com/articles/agent-skills-guide-2026) — 跨工具 SKILL.md 标准
- [AI Agent Skills in 2026: The Complete SKILL.md Guide](https://milkeyai.com/blog/ai-agent-skills-skill-md-guide) — 跨工具 portability 挑战

**审查清单**:

| 审查点 | 检查内容 | 风险 | 验证方式 |
|---|---|---|---|
| host-specific 假设 | skill prose 中是否硬编码了特定 host 的假设(如"Claude Code 的 blocking question tool")?是否同时覆盖所有支持的 host? | medium | grep `Claude Code\|Codex\|Cursor\|Kiro\|Qoder` 在所有 SKILL.md |
| platform-specific 命令 | scripts 中是否有只在特定平台可用的命令?是否同时提供 macOS/Linux/Windows 等价物? | medium | 检查 shell 脚本的 `uname` 分支、PowerShell parity |
| SKILL_DIR anchor 可移植性 | 脚本是否通过 `${SKILL_DIR:-}` 调用,而非依赖特定 host 的路径约定(如 `CLAUDE_SKILL_DIR`)? | high | grep `SKILL_DIR\|CLAUDE_SKILL_DIR` 在所有脚本 |
| host pointer 一致性 | `.cursor/rules/spec-first.mdc`、`.kiro/steering/spec-first.md`、`.qoder/rules/spec-first.md` 是否都正确指向 `AGENTS.md`? | low | 逐文件检查 |
| host runtime 生成一致性 | `spec-first init` 生成的 runtime assets 在不同 host 下是否语义一致? | medium | 检查 adapter 实现的 parity |

### 维度 4:Eval 与回归基础设施

**业界来源**:Minko Gechev 的 skill-eval 项目将 evals 集成到 CI 中,检测 prose 变更引入的 regression。Anthropic 的 "Demystifying Evals for AI Agents" 提供了 eval 设计方法论。

**业界参照**:

- [skill-eval: Unit tests for AI agent skills](https://github.com/mgechev/skill-eval) — CI 集成的 skill 回归检测
- [Demystifying Evals for AI Agents](https://www.anthropic.com/research/demystifying-evals-for-ai-agents) — eval 设计方法论
- AGENTS.md 中的 fresh-source eval checklist: `docs/contracts/workflows/fresh-source-eval-checklist.md`

**审查清单**:

| 审查点 | 检查内容 | 风险 | 验证方式 |
|---|---|---|---|
| eval fixture 存在性 | 哪些 skill 有 `evals/examples.json`?哪些应该有但没有? | medium | 列出所有 skill 的 eval 目录 |
| eval 覆盖 trigger 精度 | eval 是否测试 trigger/discoverability,而不只是执行正确性? | high | 审读 eval fixture 内容 |
| prose 变更回归检测 | 修改一段 SKILL.md prose 后,是否有机制检测是否引入了 regression? | high | 检查是否有 prose-level diff test |
| fresh-source eval 路径 | 是否有 fresh-source eval checklist?当前是否可执行?AGENTS.md 要求如果不可用必须记录原因 | medium | 检查 `docs/contracts/workflows/fresh-source-eval-checklist.md` |
| eval fixture 与 CE-first 一致性 | 迁移后删除的 eval fixture 是否留下了测试盲区?新增的 fixture 是否测试 CE-first 行为? | medium | 对比迁移前后 eval fixture 变化 |
| eval 在 CI 中的集成 | eval fixture 是否被 `npm run test:eval-fixtures` 执行?是否有 CI gate? | medium | 检查 package.json scripts 和 CI 配置 |

**业界对比**:

| 能力 | Minko Gechev skill-eval | Anthropic evals | spec-first 当前 | 审查点 |
|---|---|---|---|---|
| CI 集成 | Yes (GitHub Actions) | Yes | Partial (`test:eval-fixtures`) | 是否完整? |
| Trigger 测试 | Yes | Yes | 未知 | 是否覆盖? |
| Prose regression | Yes | N/A | 未知 | 是否覆盖? |
| Fresh-source eval | N/A | Yes | Checklist 存在但执行未确认 | 是否可执行? |

### 维度 5:Agent 可观测性与可追溯性

**业界来源**:Datadog 的 "harness-first agents" 提出 verification loop = deterministic testing + formal methods + observability。Sentry 的 agent observability guide 强调 structured tracing over unstructured logs。

**业界参照**:

- [Closing the verification loop: Observability-driven harnesses](https://www.datadoghq.com/blog/ai/harness-first-agents/) — Datadog
- [AI agent observability: The developer's guide](https://blog.sentry.io/ai-agent-observability-developers-guide-to-agent-monitoring/) — Sentry
- [AI Observability for Coding Agents](https://blaxel.ai/blog/ai-observability) — Blaxel

**审查清单**:

| 审查点 | 检查内容 | 风险 | 验证方式 |
|---|---|---|---|
| 端到端 trace | 能否从一个 workflow 的开始到结束,通过 artifacts 追踪完整执行路径? | high | 模拟 spec-lfg pipeline 追踪 |
| structured tracing | 是否有结构化 trace(而非自由文本 log)能重建推理链? | medium | 检查 artifact 是否包含 structured metadata |
| failure attribution | 失败时能否归因到具体 skill 的具体 phase? | high | 检查 error handling 和 reason_code |
| artifact 可追溯性 | 每个 artifact 是否包含 source refs(产生它的 skill、输入 artifact、时间戳)? | medium | 检查 artifact frontmatter / metadata |
| handoff 证据链 | skill 间 handoff 是否留下可检查的证据(不是仅存在于对话中)? | high | 检查 handoff 是否写入 artifact |
| context bundle | spec-first 的 context bundle contract 是否起到 trace 作用? | medium | 检查 `docs/contracts/context-bundle.md` |

**业界对比**:

| 能力 | Datadog harness | Sentry agent obs | spec-first 当前 | 审查点 |
|---|---|---|---|---|
| Structured tracing | Yes | Yes | Partial (artifact metadata) | 是否足够? |
| Failure attribution | Yes | Yes | Partial (reason_code) | 是否完整? |
| End-to-end trace | Yes | Yes | Partial (artifact chain) | 链是否完整? |
| Real-time monitoring | Yes | Yes | No (CLI-only) | 是否需要? |

### 维度 6:Context Compaction 韧性

**业界来源**:Anthropic 的 Context Engineering 指南详细描述了 context rot 现象:随着 context window 中 token 数量增加,模型准确回忆信息的能力下降。三种应对策略:compaction、structured note-taking、sub-agent architectures。

**业界参照**:

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Anthropic
- Claude Code 的 compaction 实现:summarize + 5 most recently accessed files
- Anthropic memory tool (public beta):file-based persistent memory outside context window

**审查清单**:

| 审查点 | 检查内容 | 风险 | 验证方式 |
|---|---|---|---|
| compaction 恢复 | 如果 context 在 skill 执行中途被 compact,skill 能否从 artifact 恢复? | high | 模拟 compaction 场景:删除对话历史,仅凭 artifact 继续 |
| 关键指令持久性 | 关键指令是否只存在于对话中?是否也写入了 artifact? | high | 检查哪些关键状态只在对话中 vs 在 artifact 中 |
| artifact 作为 structured notes | artifact 是否起到 Anthropic 所说的 "structured note-taking" 作用?能在 context reset 后被重新读取? | medium | 检查 artifact 是否自包含(不依赖对话上下文) |
| state 文件恢复 | spec-sweep state.yml、spec-optimize run state 是否能在 compaction 后恢复? | medium | 检查 state 文件的恢复逻辑 |
| subagent context 隔离 | subagent dispatch 是否实现了 Anthropic 的 "clean context window" 模式?subagent 返回是否为 condensed summary? | medium | 检查 subagent dispatch 和 return shape |
| context budget 意识 | skill 是否有 context budget 意识(如 "如果 context 接近上限,先 compact 再继续")? | low | 检查 SKILL.md 中是否有 context 管理指导 |

**Anthropic 三种策略对标**:

| 策略 | Anthropic 描述 | spec-first 对应 | 审查点 |
|---|---|---|---|
| Compaction | summarize context + reinitiate | 依赖 host(compaction 由 host 处理) | skill 是否 compaction-safe? |
| Structured note-taking | agent writes notes to memory outside context | artifact 写入 docs/ | artifact 是否自包含? |
| Sub-agent architectures | specialized subagents with clean context | persona/agent dispatch | return 是否为 condensed summary? |

### 维度 7:工具重叠与歧义

**业界来源**:Anthropic 指出"如果人类工程师无法明确说该用哪个工具,AI agent 也做不到。"Tool overlap 和 ambiguity 是 agent 可靠性的核心威胁。

**业界参照**:

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — "bloated tool sets that cover too much functionality or lead to ambiguous decision points"
- [Writing tools for AI agents – with AI agents](https://www.anthropic.com/engineering/writing-tools-for-ai-agents-with-ai-agents) — tool design best practices

**审查清单**:

| 审查点 | 检查内容 | 风险 | 验证方式 |
|---|---|---|---|
| skill 重叠 | 是否有 skill 功能重叠导致歧义 dispatch? | high | 逐 pair 分析功能边界 |
| dispatch 明确性 | 在给定场景下,人类能否明确说该用哪个 skill? | high | 模拟用户场景测试 |
| 路由指导完整性 | SKILL.md 中的 "When to use" / "When not to use" 是否足以消除歧义? | medium | 审读每个 skill 的路由边界 |
| using-spec-first 路由 | `using-spec-first` 的路由表是否覆盖所有 skill 的 near-neighbor 排除? | medium | 检查 using-spec-first SKILL.md |
| tool 最小集原则 | 是否有可以合并的 skill?是否有过度细分? | low | 架构分析 |

**重点检查的歧义场景**:

| 用户场景 | 候选 skill | 歧义风险 | 审查点 |
|---|---|---|---|
| "我想改进这段代码" | spec-simplify-code / spec-debug / spec-optimize / spec-polish | high | 边界是否清晰? |
| "我要做需求分析" | spec-brainstorm / spec-ideate / spec-prd / spec-strategy | high | 边界是否清晰? |
| "我要审查我的工作" | spec-code-review / spec-doc-review / spec-skill-audit | medium | 边界是否清晰? |
| "我要发布功能" | spec-commit / spec-commit-push-pr / spec-promote / spec-lfg | medium | 边界是否清晰? |
| "我要理解一个概念" | spec-explain / spec-pov / using-spec-first | medium | 边界是否清晰? |

### 维度 8:组合性与模块化

**业界来源**:specdriven.com 的 Evaluation Framework 定义了 capability dimensions:modularity、composability、cross-cutting expressiveness、reconcilability。Martin Fowler 警告 MDD 失败的部分原因是模型过于刚性。

**业界参照**:

- [The Spec-Driven Tool Landscape - Evaluation Framework](https://specdriven.com/landscape) — capability dimensions
- Martin Fowler 的 MDD 类比:LLMs 是否解决了 MDD 的灵活性问题,还是引入了新问题?
- BMAD-METHOD:多 agent 框架,每个 agent 是 "Agent-as-Code" markdown 文件

**审查清单**:

| 审查点 | 检查内容 | 风险 | 验证方式 |
|---|---|---|---|
| 非设计组合 | skill 是否能在设计者未预见的组合中工作? | medium | 检查 handoff 是否过度耦合 |
| 耦合度 | skill 之间是否有不必要的耦合? | medium | 检查 skill 间依赖是否最小化 |
| 独立可用性 | 每个 skill 是否能独立使用,不强制依赖其他 skill? | high | 检查每个 skill 的最小依赖集 |
| artifact 格式标准化 | 不同 skill 产出的 artifact 是否遵循一致的格式约定? | medium | 对比所有 artifact 的 frontmatter / metadata |
| rigid vs flexible | spec-first 的 workflow 是否过于刚性(像 MDD)?还是足够灵活? | low | 架构分析 |
| agent-as-code 模式 | skill 是否采用 BMAD 的 "Agent-as-Code" 模式?persona/agent 定义是否为可版本控制的 markdown? | low | 检查 references/agents/ 和 references/personas/ |

**BMAD 对比**:

| 能力 | BMAD-METHOD | spec-first | 审查点 |
|---|---|---|---|
| Agent 定义 | Agent-as-Code markdown | SKILL.md + references/agents/ + references/personas/ | 模式是否一致? |
| 生命周期 | Analysis → Planning → Solutioning → Implementation | brainstorm → plan → work → review → compound | 是否更灵活? |
| Traceability | Git-versioned artifacts | docs/ artifacts + source refs | 追溯是否完整? |
| 跨工具 | Claude Code, Cursor, VS Code | Claude Code, Codex, Cursor, Kiro, Qoder | 覆盖更广? |

## 审查流程

```
Phase 1: 业界基线建立
  ├── 读取业界参照文档(已在方案中引用)
  ├── 确定 spec-first 与业界工具的对比基线
  └── 建立每个维度的 pass/fail 判断标准

Phase 2: 逐 skill 审查(与主审查方案同步执行)
  ├── 维度 1: Trigger 精度 — 检查 description、exclusion、argument-hint
  ├── 维度 3: 跨工具可移植性 — 检查 host 假设、platform 命令、SKILL_DIR
  ├── 维度 6: Compaction 韧性 — 检查 artifact 自包含性、state 恢复
  ├── 维度 7: 工具重叠 — 检查 near-neighbor 边界
  └── 维度 8: 组合性 — 检查耦合度、独立可用性

Phase 3: 全局交叉验证
  ├── 维度 2: Spec 可执行性 — 全局 artifact schema 覆盖分析
  ├── 维度 4: Eval 基础设施 — 全局 eval fixture 覆盖矩阵
  ├── 维度 5: 可观测性 — 全局端到端 trace 验证
  └── 维度 7: 工具重叠 — 全局歧义场景测试

Phase 4: 输出合并报告
  ├── 业界对标评分表
  ├── gap 分析
  └── 改进建议(按优先级排序)
```

## 输出格式

### 业界对标评分表

每个维度按以下标准评分:

| 评分 | 定义 |
|---|---|
| **leading** | 超越业界基线,可作为最佳实践输出 |
| **aligned** | 与业界基线持平 |
| **gap** | 存在差距,需要改进 |
| **critical_gap** | 存在严重差距,影响核心可靠性 |

### 报告结构

```markdown
# 业界最佳实践对标审查报告

## 评分汇总

| 维度 | 评分 | 关键发现 | 改进优先级 |
|---|---|---|---|
| Skill 可发现性与 Trigger 精度 | aligned/gap | ... | P1/P2/P3 |
| Spec 可执行性差距 | ... | ... | ... |
| ... | ... | ... | ... |

## 逐维度详细发现

### 维度 1: Skill 可发现性与 Trigger 精度
- 评分: aligned / gap / critical_gap
- 业界基线: ...
- spec-first 现状: ...
- 发现: ...
- 改进建议: ...

### 维度 2: Spec 可执行性差距
...

## 业界工具对比矩阵

| 能力 | GitHub Spec Kit | Kiro | BMAD | spec-first | 评分 |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## 改进建议(按优先级排序)

### P1 — 高优先级
- ...

### P2 — 中优先级
- ...

### P3 — 低优先级
- ...
```

## 验证命令

```bash
# Trigger 精度: 检查所有 skill 的 description
rg -n "^description:" skills/*/SKILL.md

# 跨工具: 检查 host-specific 假设
rg -n "Claude Code|Codex|Cursor|Kiro|Qoder" skills/*/SKILL.md --glob '*.md'

# 跨工具: 检查 SKILL_DIR 使用
rg -n "SKILL_DIR|CLAUDE_SKILL_DIR" skills/*/scripts/ skills/*/SKILL.md

# Eval: 列出所有 eval fixture
find skills/ -path "*/evals/*" -type f | sort

# Eval: 检查 CI 集成
grep -r "eval-fixtures\|test:eval" package.json

# 可观测性: 检查 artifact metadata
rg -n "source_ref\|produced_by\|artifact_contract\|artifact_readiness" skills/*/SKILL.md

# 工具重叠: 检查 near-neighbor exclusion
rg -n "not to use\|do not use\|instead of\|use.*for" skills/*/SKILL.md
```

## 风险与注意事项

- **业界基线时效性**: AI coding 领域发展极快,本方案基于 2025-2026 年中的业界状态。审查时如发现新的重大变化,应更新基线。
- **主观判断风险**: "aligned" vs "gap" 的判断有一定主观性,应基于具体证据(代码、artifact、测试)而非感觉。
- **不替代 spec-skill-audit**: 本方案聚焦业界对标,不替代 spec-first 内部的 skill-audit 治理审查。
- **不要求全盘对标**: spec-first 有自己的设计哲学(light contract, deterministic floor + LLM judgment),不需要在所有维度都与业界工具对齐。差距分析应区分"应该改进"和"有意 divergence"。

## 完成标准

- 8 个维度均已审查。
- 每个维度有评分(leading / aligned / gap / critical_gap)。
- 每个维度有关键发现和具体证据(文件:行号)。
- 业界工具对比矩阵已完成。
- 改进建议按优先级排序。
- 与主审查方案的发现已交叉引用(避免重复记录同一问题)。
