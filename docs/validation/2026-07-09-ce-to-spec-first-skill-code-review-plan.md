# CE 到 Spec-First Skill 迁移代码审查方案

## 结论

本审查对当前 `skills/` 下全部 35 个 source skill 按风险分级审查(自动化扫描全覆盖,高风险 skill 逐文件深审),其中 29 个为 CE 迁移相关 skill(含 `spec-mcp-setup`),6 个为 spec-first 原生 / 拆分 skill。审查重点覆盖迁移正确性、代码质量、安全性、跨 skill 依赖关系和上下文管理。

审查不替代迁移审查报告的结论,而是在其基础上验证实际 source 代码是否与审查结论一致,并发现迁移审查未覆盖的问题。

## 目标

- 对当前 `skills/` 下全部 35 个 source skill 按「审查深度分级」审查 SKILL.md、references、scripts、schemas/assets:自动化扫描全覆盖,Tier A 逐文件深审,Tier B/C 扫描 + 抽查 / source 质量审查。
- 验证 CE 承重能力是否在 source 中被正确保留。
- 对 spec-first 原生 / 拆分 skill 不做 CE 等价要求,但仍审查其入口语义、source/runtime 边界、依赖关系、artifact contract、脚本安全和上下文管理。
- 验证跨 skill 依赖关系(文件引用、artifact contract、handoff 路由、配置键)是否全部正确。
- 验证上下文管理(常驻 vs 触发、脚本产出质量、handoff 上下文传递)是否符合 spec-first 架构原则。
- 产出一份合并报告,记录按严重程度分类的发现和修复建议。

## 非目标

- 不重复迁移审查报告已确认的结论;只关注 source 代码层面的验证和新发现。
- 不修改 generated runtime mirrors(`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/`)。
- 不在审查阶段做 runtime regeneration;如需 runtime refresh,作为单独显式步骤。
- 不对 spec-first 原生 / 拆分 skills(`spec-prd`、`spec-write-tasks`、`using-spec-first`、`spec-write-skill`、`spec-app-consistency-audit`、`spec-rule-miner`)做 CE 等价审查;这些 skill 仍纳入全量 source 审查,并可用于解释合理 divergence。

## CE 基线(parity source of truth)

- **权威 CE source**:`~/xiaobu/compound-engineering-plugin`,commit `fc0395b8`(v3.19.0);该工作副本含 `ce-setup` 与全部 `ce-*` skill,是逐文件 parity 比对的唯一基准。
- 已安装的 marketplace 副本(v3.14.3)与 plugin cache 均较旧,**不作为**比对基准,以避免 False parity / False drift。
- **Phase 1 前置**:任何 parity 维度(维度 1、14b)运行前,先执行 `git -C ~/xiaobu/compound-engineering-plugin rev-parse HEAD` 记录基线 commit 并写入合并报告「全局依赖图谱」头部;若工作副本已偏离 `fc0395b8`,先说明漂移再继续。

## 审查范围

### Skill 清单与批次

| 批次 | Skills | 审查口径 | 文件量预估 |
|---|---|---|---|
| **Batch 1**(低差异快审) | spec-test-xcode, spec-polish, spec-explain, spec-pov, spec-dogfood, spec-strategy, spec-simplify-code, spec-commit | 全部 aligned | ~20 |
| **Batch 2**(helper 与尾项) | spec-commit-push-pr, spec-optimize, spec-promote, spec-proof, spec-resolve-pr-feedback, spec-test-browser, spec-worktree | 5 aligned + 2 repaired | ~40 |
| **Batch 3**(支撑链路) | spec-debug, spec-compound, spec-compound-refresh, spec-sweep, **spec-mcp-setup**, spec-riffrec-feedback-analysis, spec-product-pulse | 1 partial + 5 repaired/replaced + 1 near-parity | ~60 |
| **Batch 4**(核心链路深审) | spec-brainstorm, spec-plan, spec-doc-review, spec-code-review, spec-work, spec-ideate, spec-lfg | 全部 replaced/repaired | ~80 |
| **Batch 5**(spec-first 原生 / 拆分 skill 全量审查) | spec-prd, spec-write-tasks, using-spec-first, spec-write-skill, spec-app-consistency-audit, spec-rule-miner | 不做 CE 等价;做 source 质量、依赖、上下文与治理边界审查 | ~60 |

**特殊说明**:`spec-mcp-setup` 是从 `ce-setup` 的近似映射(near-parity),不是直接 parity target。审查需额外关注 divergence 是否合理、provider readiness 和 runtime freshness 检查是否完整。

### 审查深度分级(risk-based scoping)

本审查不对全部 35 个 skill 一律满深度手审,而是按迁移风险分级投放注意力;批次「审查口径」标签据此成为分级依据(不再仅描述性)。基线是 `2026-07-08-ce-to-spec-first-reviewed-skills-parity-audit-report.md`——本审查验证其结论的 delta 与未覆盖项,而非从零重推。

- **全覆盖自动化扫描(所有 skill,不分层)**:CE residual grep、上下文排除扫描、`npm run lint:skill-entrypoints`、相关 CI 契约测试(见「验证命令」)。这些确定性扫描先于分级手审运行,任何 skill 不豁免。
- **Tier A — replaced/repaired + near-parity**(Batch 3 的 partial/repaired 项、Batch 4 全部、`spec-mcp-setup`):对权威 CE 基线做全部适用维度的逐文件深审(含 CE parity 与维度 14b)。迁移风险集中于此。
- **Tier B — aligned 低差异**(Batch 1、Batch 2 的 aligned 项):自动化扫描 + 迁移正确性核心(维度 1、3)+ 残差抽查;仅当扫描或抽查暴露异常时升级为深审。不默认跑全部 23 维。
- **Tier C — 原生 / 拆分,无 CE 基线**(Batch 5):做 source 质量、依赖、artifact contract、脚本安全与治理边界审查;**不做 CE parity**;上下文维度 16-22 仅按需(该组审查通用架构质量而非迁移正确性,对无 CE 基线的原生 skill 不作强制满深度)。

**维度合并执行(避免同一产物重复审查)**:维度 15(安全深度)作为维度 3 的深度清单合并执行,不单列重复;维度 13 的共享 persona/agent 一致性与维度 6 的共享脚本一致性合并为一次共享资产核对;维度 22「常驻」行的 SKILL.md 精简度判断并入维度 16。维度编号与总数保持不变,仅执行时不双跑。

## 审查维度(23 项)

### 基础维度(4 项)

#### 维度 1:迁移正确性

| 检查项 | 验证方式 |
|---|---|
| CE 承重能力是否完整保留 | 逐文件对比 CE source 与 spec-first source |
| CE residual 扫描 | `rg -n "\bce-\|compound-engineering\|\\.compound-engineering\|ce-unified-plan\|/tmp/compound-engineering"`(用 `\bce-` 词边界,避免 `source-of` 等误匹配) |
| 路径/命名投影是否正确 | `/tmp/compound-engineering/` → `/tmp/spec-first/`、`.compound-engineering` → `.spec-first`、`ce-*` → `spec-*` |
| spec-first divergence 是否合理 | 每处 divergence 必须有明确理由 |

#### 维度 2:代码质量

| 检查项 | 验证方式 |
|---|---|
| SKILL.md 入口语义、description、trigger 准确性 | 逐文件审读 |
| 执行流程、handoff rules、fallback modes 一致性 | 逐文件审读 |
| References 完整性、与 SKILL.md 一致性 | 对比 SKILL.md 中引用的 references 与实际文件 |
| 脚本语法、确定性行为、错误处理 | `bash -n`、`python3 -m py_compile`、审读错误处理逻辑 |

#### 维度 3:安全性

| 检查项 | 验证方式 |
|---|---|
| 无硬编码 secrets | grep `password\|secret\|token\|api_key\|credential` |
| 无危险命令(rm -rf、sudo 等) | grep `rm -rf\|sudo\|chmod 777\|curl.*\|bash` |
| 文件操作安全(temp file 命名、原子写入) | 审读脚本中 temp file 创建逻辑 |
| 输入验证、路径注入防护 | 审读脚本中用户输入处理 |
| Git 操作安全(branch protection、force push 防护) | 审读 git 命令 |
| Shell 注入(subprocess、eval、os.system) | 审读 Python/Shell 脚本 |

#### 维度 4:下游一致性

| 检查项 | 验证方式 |
|---|---|
| 对其他 `spec-*` skill 的引用是否正确 | 全局 grep + 交叉验证 |
| Artifact contract 路径是否一致 | 产出方 vs 消费方路径匹配 |
| 下游消费者输入是否正确 | 检查每个 skill 声明的 downstream consumers |

### 核心维度(12 项)

#### 维度 5:跨 Skill 依赖关系

**Phase 1 先构建全局依赖图谱:**

| 依赖类型 | 采集方式 | 示例 |
|---|---|---|
| Skill 间引用 | grep `spec-*` 在所有 SKILL.md 和 references 中 | `spec-brainstorm` → `spec-plan` |
| Artifact 产出 | 每个 skill 声明的 output path | `spec-brainstorm` 产出 `docs/plans/` |
| Artifact 消费 | 每个 skill 声明的 input path | `spec-plan` 消费 `docs/plans/` unified plan |
| Handoff 路由 | 每个 skill 声明的 next-step / downstream | `spec-sweep` → `spec-lfg` |
| 脚本依赖 | scripts 中的 cross-skill 调用 | `spec-lfg` 调用 `spec-commit-push-pr` |
| 配置键依赖 | `.spec-first/config.local.yaml` 的 key 消费者 | `spec-sweep` 读取 `feedback_sources` |

**交叉验证规则:**

1. 引用目标存在 — 被引用的 `spec-*` skill 确实存在
2. Artifact 路径匹配 — 下游消费的路径 = 上游声明的产出路径
3. Handoff 双向一致 — A 说"交给 B",B 确实有对应 intake 逻辑
4. 无悬空 CE 引用 — 不存在指向 `ce-*` 的 active 路由
5. 配置键一致性 — `spec-mcp-setup` config template 中的 key 覆盖所有下游消费者
6. Pipeline 链路完整性 — `spec-lfg` 的 pipeline 中每个 step 的 handoff 目标都正确

**重点依赖链路:**

```
spec-brainstorm → spec-plan → spec-write-tasks → spec-work → spec-code-review → spec-compound
                                                        ↓
                                              spec-simplify-code
                                                        ↓
                                              spec-commit-push-pr
                                                        ↓
                                                   spec-lfg (full pipeline)
```

横向依赖:
- `spec-mcp-setup` → 所有需要 helper/provider readiness 的 skill
- `spec-debug` → `spec-code-review`、`spec-simplify-code`、`spec-compound`(post-fix tail)
- `spec-sweep` → `spec-lfg`、`spec-brainstorm`、`spec-riffrec-feedback-analysis`
- `spec-compound` ↔ `spec-compound-refresh`(learning lifecycle)
- `spec-dogfood` → `spec-worktree`、`spec-debug`、`spec-compound`

#### 维度 6:共享脚本一致性

| 共享脚本 | 出现的 skill | 审查重点 |
|---|---|---|
| `scripts/repo-profile-cache.py` | spec-brainstorm, spec-code-review, spec-compound, spec-debug, spec-explain, spec-ideate, spec-optimize, spec-plan, spec-pov | 9 处副本是否一致?divergence 是否有理由?(spec-compound-refresh 无此脚本) |
| `scripts/analyze_riffrec_zip.py` | spec-sweep, spec-riffrec-feedback-analysis | 两处是否一致? |
| `references/agents/repo-profiler.md` | spec-brainstorm, spec-code-review, spec-compound, spec-debug, spec-explain, spec-ideate, spec-optimize, spec-plan, spec-pov | 9 处副本 persona 定义是否一致? |
| `scripts/validate-frontmatter.py` | spec-compound, spec-compound-refresh | 验证逻辑是否一致? |
| `scripts/validate-doc-claims.py` | spec-compound, spec-compound-refresh | 同上 |

**审查规则**:同名脚本如果内容不一致,必须能解释 divergence 原因;如果一致,应考虑是否可以共享。

#### 维度 7:Plan Artifact Contract 链路端到端验证

```
spec-brainstorm (产出)
  → artifact_contract: spec-unified-plan/v1
  → artifact_readiness: requirements-only
  → product_contract_source: spec-brainstorm
  → 输出路径: docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.<md|html>

spec-plan (消费 + 产出)
  → 读取 requirements-only unified plan
  → 产出 artifact_readiness: implementation-ready
  → 保留 artifact_contract: spec-unified-plan/v1

spec-write-tasks (消费)
  → 读取 implementation-ready plan
  → 产出 task pack

spec-lfg (消费 + gate)
  → 检查 artifact_contract: spec-unified-plan/v1
  → 只接受 artifact_readiness: implementation-ready + execution: code
  → 拒绝 requirements-only / knowledge-work / approach-plan / answer-seeking

spec-work (消费)
  → 读取 plan metadata / section map
  → 按 active unit 读取 Goal Capsule / Verification Contract / DoD
```

**验证点**:每个环节产出的 metadata 字段,必须与下游消费方检查的字段完全匹配。

#### 维度 8:Knowledge Lifecycle Schema 一致性

```
spec-compound (写入)
  → YAML frontmatter: category, tags, related, ...
  → references/schema.yaml 定义 schema

spec-compound-refresh (维护)
  → 读取同一 schema
  → Keep/Update/Consolidate/Replace/Delete 操作
  → validate-frontmatter.py + validate-doc-claims.py 验证

spec-plan / spec-work / spec-code-review / spec-debug (消费)
  → 作为 advisory recall 读取
  → 必须按 advisory trust boundary 处理
```

**验证点**:schema.yaml 在 compound 和 compound-refresh 之间是否一致;消费方是否正确地将 learning 标记为 advisory。

#### 维度 9:Mode / Flag 跨 Skill 契约一致性

| Mode 值 | 使用方 | 期望行为 | 验证点 |
|---|---|---|---|
| `mode:headless` | spec-compound, compound-refresh, sweep, doc-review, dogfood | 不问问题,安全动作写入,歧义保守处理 | 各 skill 对 headless 的定义是否一致? |
| `mode:agent` | spec-code-review | report-only JSON 输出 | spec-lfg 调用 `mode:agent` 的参数是否匹配? |
| `mode:pipeline` | spec-test-browser, spec-commit-push-pr | 非交互,按 token 执行 | spec-lfg 调用时的 pipeline token 是否一致? |
| `mode:return-to-caller` | spec-work | 完成实现但不 shipping,交回控制权 | spec-lfg 读取 return 值的字段是否匹配? |

#### 维度 10:Frontmatter / Governance 元数据一致性

- `name`: 与目录名一致
- `description`: 与 skills-lock.json / governance.json 分类一致
- `argument-hint`: CE 有则保留,CE 无则不新增
- `user-invocable`: 内部 helper(spec-worktree, spec-test-browser)应为 `false`
- `workflow_command` vs `standalone_skill` 分类是否正确

#### 维度 11:Temp / Scratch 路径命名一致性

```
/tmp/spec-first/<skill-name>/<run-id>/    ← 标准模式
/tmp/spec-first/repo-profile/             ← 共享 cache
/tmp/spec-first/spec-<skill>/             ← 无 run-id 的简单模式
```

**验证点**:是否有 skill 仍在使用 `/tmp/compound-engineering/` 或不一致的路径命名。

#### 维度 12:测试覆盖缺口分析

| 被删测试 | 原因 | 是否留下覆盖缺口? |
|---|---|---|
| `spec-work-contracts.test.js` | 锁定 spec-only contract | spec-work 的 CE-first 行为是否有其他测试覆盖? |
| `spec-ideate-contracts.test.js` | 锁定 spec-only opt-in | spec-ideate 的 CE-first 行为是否有覆盖? |
| `public-workflow-contract-summary.test.js` | 要求所有 workflow 有 Summary | 删除后是否还有其他 governance 测试? |
| 多个 context-governance / dispatch-boundary 测试收窄 | 移除旧 spec-only 增强断言 | 收窄后是否仍覆盖核心 dispatch 边界? |

**验证点**:每个被删除/收窄的测试,检查是否有替代覆盖;如果存在覆盖缺口,记录为 medium 风险发现。

#### 维度 13:Persona / Agent Reference 一致性

- spec-code-review: `references/personas/*.md`(16 个 persona)
- spec-doc-review: `references/personas/*.md`(7 个 persona)
- 共享的 `references/agents/repo-profiler.md`

**验证点**:同名 persona 在不同 skill 中的定义是否一致;agent dispatch 是否正确引用 skill-local prompt assets。

#### 维度 14:Config Key 完整性

| Config Key | 定义方 | 消费方 | 验证 |
|---|---|---|---|
| `feedback_sources` | spec-mcp-setup config-template.yaml | spec-sweep | 待验证 |
| `sweep_*` | spec-mcp-setup config-template.yaml | spec-sweep | 待验证 |
| `pulse_*` | spec-mcp-setup config-template.yaml | spec-product-pulse | 待验证 |
| `spec_promote_spiral_optout` | spec-mcp-setup config-template.yaml | spec-promote | 待验证 |
| `work_delegate_*` | spec-mcp-setup config-template.yaml | spec-work (consumer-gated) | 待验证 |
| `plan_skip_scoping_confirm` | spec-mcp-setup config-template.yaml | spec-plan (consumer-gated) | 待验证 |
| `verification_profile_path` | spec-mcp-setup config-template.yaml | verification profile loader | 待验证 |
| `ideate_output` | spec-mcp-setup config-template.yaml | spec-ideate | 待验证 |

**验证规则**:config template 中定义的每个 key 都有对应的消费者;没有消费者读取未定义的 key。

#### 维度 14b:spec-mcp-setup 产物覆盖完整性

`spec-mcp-setup` 是从 `ce-setup` 的近似映射(near-parity),不是直接 parity target。必须验证 spec-mcp-setup 的产物**完全覆盖** ce-setup 的所有产物,且下游 skill 能正确找到和使用这些产物。

**审查方式**:先读取 CE `ce-setup` source 和 spec-first `spec-mcp-setup` source,逐项比对产物清单,再交叉验证下游消费者。

**CE 产物 → spec-first 产物覆盖矩阵:**

| CE 产物 / 行为 | CE source | spec-first 对应产物 | spec-first 路径 | 覆盖状态 | 下游消费者 | 验证点 |
|---|---|---|---|---|---|---|
| 三阶段 setup(诊断/修复/汇总) | `ce-setup/SKILL.md`、`scripts/check-health` | 三阶段 setup | `spec-mcp-setup/SKILL.md` | 待验证 | 全部依赖 setup 的 skill | Stage 1/2/3 流程是否完整 |
| Optional capability diagnostic 表 | `scripts/check-health` | `helper_tools` / `items[]` 诊断 | `tool-facts.json` | 待验证 | plan/work/review/debug | JSON 字段是否完整(status/result/next_action) |
| `agent-browser` optional check | `scripts/check-health` | browser helper readiness | `tool-facts.json` | 待验证 | spec-dogfood, spec-polish, spec-test-browser, spec-code-review | 缺失时是否给安装命令而非阻断 |
| `gh`、`jq`、`ast-grep`、`ffmpeg` checks | `scripts/check-health` | helper registry 与 baseline readiness | `tool-facts.json` | 待验证 | spec-sweep, spec-riffrec, spec-rule-miner, review/debug | 分层是否正确(required/optional/provider) |
| `.compound-engineering/config.local.example.yaml` | `references/config-template.yaml` | `.spec-first/config.local.example.yaml` | `skills/spec-mcp-setup/references/config-template.yaml` | 待验证 | 所有读取 local config 的 skill | 模板是否包含所有下游需要的 key |
| 可选 `.compound-engineering/config.local.yaml` | `ce-setup/SKILL.md` | `.spec-first/config.local.yaml` | 用户创建 | 待验证 | spec-sweep, spec-product-pulse, spec-promote | 旧路径是否已 retired |
| `.compound-engineering/*.local.yaml` gitignore | `scripts/check-health` | `.spec-first/*.local.yaml` gitignore | `.gitignore` | 待验证 | gitignore policy | 保护规则是否存在且正确 |
| `compound-engineering.local.md` legacy cleanup | `scripts/check-health` | legacy markdown signal / manual cleanup | human status block | 待验证 | check-health legacy signal | 是否只提示不自动删除 |
| CE config template keys | `references/config-template.yaml` | spec-first config keys | `config-template.yaml` | 待验证 | 所有 local config 消费者 | 每个 CE key 是否有对应 spec-first key |
| work delegation keys | `references/config-template.yaml` | `work_delegate_*` | `config-template.yaml` | 待验证 | spec-work (consumer-gated) | 是否为 inert setup 偏好而非自动委托 |
| plan skip scoping confirm | `references/config-template.yaml` | `plan_skip_scoping_confirm` | `config-template.yaml` | 待验证 | spec-plan (consumer-gated) | 同上 |
| setup summary | `scripts/check-health` | grouped status block | human status | 待验证 | humans repairing setup | blocking/degraded/optional/advisory 是否区分清晰 |
| 不批量安装 optional tools | `ce-setup/SKILL.md` | 默认 setup 不自动安装 optional helper | install-helpers.* | 待验证 | install-helpers.* | 是否保留 CE 的授权边界 |

**spec-first 新增产物(CE 中不存在的)验证:**

| 新增产物 | 路径 | 下游消费者 | 验证点 |
|---|---|---|---|
| `tool-facts.json` | `.spec-first/config/tool-facts.json` | plan/work/review/debug workflows | 是否被下游 skill 正确读取?字段是否完整? |
| `runtime-capabilities.json` | `.spec-first/config/runtime-capabilities.json` | using-spec-first, plan/work/review | 是否承载 direct evidence posture? |
| `generated_runtime_manifest.status` | setup facts | doctor/update guidance | `current`/`stale`/`missing`/`unknown` 判断是否正确? |
| `provider_readiness[]` | setup facts | spec-plan, spec-work, spec-code-review | provider 输出是否标记为 advisory? |
| `configured_dependencies[]` | setup facts | multi-host setup | host MCP 依赖检查是否完整? |
| `scenario-fingerprint-setup.json` | `.spec-first/workspace/` | 后续 setup drift 判断 | wrapper 失败时是否 warn-and-continue? |
| Bash + PowerShell parity scripts | `scripts/check-health` + `check-health.ps1` | 跨平台 setup | macOS/Linux/Windows 行为是否等价? |

**产物路径验证规则:**

1. **路径迁移正确性**:CE 路径 → spec-first 路径的映射是否完整,无遗漏
2. **路径可达性**:下游 skill 引用的产物路径,在 spec-mcp-setup 运行后确实存在
3. **产物字段完整性**:每个产物的字段是否覆盖下游 skill 需要读取的所有字段
4. **产物数量对等**:CE setup 产出的产物类型数量 ≤ spec-mcp-setup 产出的产物类型数量(含合理新增)
5. **retired 产物处理**:CE 中存在但 spec-first 中 retired 的产物,确认没有下游 skill 仍在读取
6. **新增产物的消费验证**:spec-first 新增的产物(tool-facts.json 等)是否确实被下游 skill 消费,而非产出后无人使用
7. **产物格式一致性**:同一产物在 SKILL.md 中声明的格式与脚本实际输出的格式是否一致
8. **产物刷新时机**:哪些产物在 `--check` 模式下不产出?哪些在 `--verify-only` 下产出?下游 skill 是否能处理产物缺失的情况

#### 维度 15:安全深度检查

| 检查项 | 验证方式 |
|---|---|
| Git 操作安全 | spec-commit, spec-commit-push-pr, spec-worktree, spec-lfg 中的 git 命令是否有 branch protection、force push 防护 |
| 路径遍历 | scripts 中用户输入(如 `--repo`、`--requirement-workspace`)是否做了路径验证 |
| Shell 注入 | Python/Shell 脚本中 `subprocess` / `eval` / `os.system` 调用是否安全 |
| 临时文件竞争 | `/tmp/` 下文件创建是否使用 `mktemp` 或安全命名 |
| Secret 泄漏 | artifacts 和 logs 中是否有 token / key / credential 输出 |

### 新增维度:上下文管理(7 项)

#### 维度 16:SKILL.md 上下文预算与渐进式披露

spec-first 的 "Front Controller + Triggered Reference" 架构要求 SKILL.md 保持精简,重内容延迟到 references:

| 审查点 | 检查内容 | 风险 |
|---|---|---|
| **SKILL.md 体积** | 每个文件多少行?是否超出合理范围(建议 <500 行)?过大会浪费 LLM context window | medium |
| **always-on vs triggered 边界** | SKILL.md 应只包含:路由准入、执行主线、边界提醒、reference-trigger 决策。场景特化规则应放在 references/ 中按需加载 | high |
| **trigger 信号完整性** | 每个 reference 是否有明确的触发条件?是否存在"总是需要但没在 SKILL.md 中触发"的 reference? | high |
| **Workflow Contract Summary** | CE-first 迁移后部分 skill 删除了 Summary。保留的 skill 中 Summary 是否仍有价值?删除的 skill 中关键信息是否在主流程中可达? | medium |
| **重复内容** | 多个 skill 重复相同指令(如 source/runtime 边界、provider trust boundary)。是自包含设计(可接受)还是冗余(应提取为共享 contract)? | medium |

#### 维度 17:脚本上下文产出质量

| 审查点 | 检查内容 |
|---|---|
| **输出格式** | JSON(machine-readable)vs human-readable。skill 是否明确指定用哪种?pipeline 调用应输出 JSON,人机交互应输出 human-readable |
| **输出大小** | 脚本输出是否过大?是否包含 LLM 不需要的冗余信息? |
| **结构化 reason_code** | 失败时是否输出结构化 reason_code 而非自由文本?下游 LLM 是否能据此决策? |
| **fact vs judgment 边界** | 脚本是否只产出确定性 facts?还是越界做了语义判断? |
| **幂等性** | 脚本是否可安全重复运行? |
| **错误传播** | 脚本失败时退出码是否正确?stderr 是否输出结构化诊断?stdout 是否干净? |
| **跨平台** | shell 脚本是否在 macOS/Linux 都可用?PowerShell 脚本是否有 parity? |
| **SKILL_DIR anchor** | 脚本是否通过 `${SKILL_DIR:-}` 调用而非 project-relative 路径? |

#### 维度 18:跨 Skill 上下文传递(Handoff Context)

| 链路 | 传递内容 | 审查点 |
|---|---|---|
| brainstorm → plan | requirements-only unified plan | 传递的是完整 artifact 路径还是 inline?plan intake 能否正确解析 metadata? |
| plan → work | implementation-ready plan + Goal Capsule + Verification Contract + DoD | work 读取策略是否正确?是否过度读取? |
| plan → write-tasks | plan + task pack derivation | task pack 是否只包含派生信息,不复制 plan 全文? |
| work → code-review | diff + changed files + verification evidence | 传递的是 diff scope 还是完整 repo? |
| lfg → 各 step | pipeline token + plan path + mode | 每个 step 的 handoff 是否只传必要上下文?是否有 context bloat? |
| debug → code-review | fix scope + residual findings | 传递的是 fix scope 还是整个 branch? |
| sweep → lfg | `docs/plans/feedback-sweep-plan.md` | rolling plan 是否只写 machine-owned region? |
| compound → consumers | `docs/solutions/` learning as advisory | 消费方是否正确标记为 advisory? |

**核心原则验证**: handoff 是否遵循 "summary-first, source refs, freshness, limitations" 原则?

#### 维度 19:上下文排除纪律

AGENTS.md 明确了上下文排除范围。验证每个 skill 是否遵守:

```
应排除的上下文:
  .spec-first/audits/**       → 只在 audit/governance bug 中读取
  .spec-first/governance/**   → 只在 governance bug 中读取
  .claude/**                  → 不可作为 source
  .codex/**                   → 不可作为 source
  .agents/skills/**           → 不可作为 source
  .cursor/skills/**           → 不可作为 source
  .kiro/skills/**             → 不可作为 source
  .qoder/skills/**            → 不可作为 source
  host-local config           → 不可作为 source
```

**验证方式**: grep 所有 SKILL.md 和 references,检查是否有 skill 引用 generated runtime paths 作为 source-of-truth。

#### 维度 20:Persona / Subagent 上下文隔离

| 审查点 | 检查内容 |
|---|---|
| **persona prompt 大小** | `references/personas/*.md` 是否精简?dispatch 时是否只加载当前需要的 persona? |
| **dispatch payload** | subagent 收到的上下文是否只包含必要信息?是否泄露了 orchestrator 的完整上下文? |
| **return shape** | subagent 返回的是结构化 findings 还是自由文本?orchestrator 是否正确解析? |
| **same-persona collapse** | 多个 persona 审查同一文档时,是否有 dedup/collapse 机制? |
| **cross-model adversarial** | `cross-model-adversarial-review.sh` 调用 peer model 时传递的上下文是否正确 scoped? |

#### 维度 21:会话恢复 / 上下文重建

| 审查点 | 检查内容 |
|---|---|
| **artifact 可重建性** | 只凭 artifact(plan, task pack, review findings)能否重建工作状态?是否有关键状态只存在于对话中? |
| **state 文件** | spec-sweep 的 `state.yml`, spec-optimize 的 run state 是否可恢复? |
| **session-history** | spec-compound 的 session-history 脚本是否正确保存和恢复? |
| **in-progress 标记** | 是否有 "work in progress" 标记可用于恢复判断? |

#### 维度 22:常驻上下文 vs 运行时上下文

| 类型 | 内容 | 审查点 |
|---|---|---|
| **常驻** | SKILL.md 主体 + frontmatter | 是否精简?是否包含不必要的场景规则? |
| **常驻** | AGENTS.md managed blocks | 项目的常驻约束(language, source/runtime, changelog) |
| **运行时触发** | `references/*.md` | trigger 条件是否明确? |
| **运行时触发** | `references/personas/*.md` | 只在 dispatch 时加载? |
| **运行时触发** | `references/agents/*.md` | 只在 dispatch 时加载? |
| **运行时产出** | 脚本输出 facts | 是否只产出必要 facts? |
| **运行时读取** | 项目 source/test/log | 是否 bounded read?是否排除了 generated runtime? |

**验证规则**: 常驻上下文中不应出现"如果 X 则参考 references/Y.md"以外的 Y.md 内容;Y.md 的内容只在 trigger 条件满足时加载。

## 审查流程

```
Phase 1: 全局依赖图谱 + 共享资源清单 + 上下文预算基线
  ├── Skill 间引用关系 + artifact 产出/消费映射
  ├── 共享脚本清单(跨 skill 同名脚本对比)
  ├── 配置键定义/消费映射
  ├── 各 SKILL.md 行数统计(上下文预算基线)
  └── 常驻 vs 触发内容边界标注

Phase 2: 逐批次代码审查 (Batch 1 → 2 → 3 → 4 → 5)
  ├── 维度 1-4: 迁移/质量/安全/一致性(基础)
  ├── 维度 5-15(含 14b): 依赖/共享脚本/contract/mode/metadata(核心)
  └── 维度 16-22: 上下文预算/产出/handoff/排除/隔离/恢复(上下文管理)
  注意:批次内可并行读取文件;批次间串行执行;各 batch 按「审查深度分级」投放维度深度。Batch 5(Tier C)不做 CE parity 判定,但完成全量 source 质量/依赖/治理审查。

Phase 3: 全局交叉验证
  ├── Plan artifact contract 链路端到端
  ├── Knowledge lifecycle schema 一致性
  ├── Config key 完整性
  ├── Pipeline 上下文传递完整性
  ├── 常驻上下文排除纪律验证
  ├── 测试覆盖缺口分析
  └── 共享脚本 divergence 报告

Phase 4: 输出合并报告
```

### 长任务执行与上下文续跑纪律

本审查预期跨越多个会话上下文,不得把单个 skill 的审查结论只保存在对话中。执行时采用**增量落盘 + 可恢复续跑**:

1. Phase 1 先创建合并报告骨架,至少包含 CE 基线 commit、审查范围、分级规则、全局依赖图谱占位、逐 Batch / Skill 章节、审查进度表、严重程度定义和验证命令占位。
2. 每完成一个 skill 审查,立即更新合并报告中对应 skill 小节和顶部进度表;不得等全部 skill 审完后再集中回填。
3. 每个 skill 小节至少记录:Tier、status、verdict、已读取 source 文件、适用/不适用的 CE parity 结论、发现列表(文件:行号、严重程度、描述、修复建议)、依赖/artifact/config/context 结论、未检查项及原因。
4. 对尚未完成的全局交叉验证,单个 skill 审查时可先记录局部 evidence / candidate finding,但必须标注为 `pending_global_cross_check`;Phase 3 再统一确认或降级。
5. 当上下文接近上限或需要压缩/换会话时,先把当前 skill 的中间结论落盘为 `status: in_progress` 或 `status: done`,并写明 freshness、source refs、limitations 和 next skill;下一轮只从方案 + 合并报告进度表 + 最近小节恢复,不得依赖上一轮对话记忆。
6. 续跑开始时先读取合并报告的进度表、最近一个已审 skill 小节和下一个待审 skill 的 source,再继续追加;如发现报告与源码当前状态不一致,先标注 freshness drift,再回源确认。

这条纪律是 handoff gate 的具体落点:审查结论必须成为可恢复 artifact,而不是 transcript 声明。

### Goal 启动 Prompt

在新会话中启动本审查时,使用以下中文 prompt。该 prompt 的目标不是让 agent 只给计划,而是要求它创建/使用 `goal` 持续完成全量审查,并把每个 skill 的结论增量写入合并报告。

```text
请创建并使用一个 active goal 完成 CE 到 Spec-First Skill 迁移代码审查全量工作。

目标:
- 按 `docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-plan.md` 审查当前 `skills/` 下全部 35 个 source skill。
- 最终维护并完成合并报告: `docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md`。
- 报告内容必须使用简体中文;路径、命令、字段值、verdict/status 等技术标识可以保留英文。

开始前必须读取:
1. `skills/using-spec-first/SKILL.md`
2. `docs/10-prompt/结构化项目角色契约.md`
3. `docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-plan.md`
4. `docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md`(如果已存在)

执行纪律:
- 这是 skill/source prompt 治理审计,按 `using-spec-first` 的 bounded source review 执行;不要启动公开 `spec-*` workflow。
- 不手改 generated runtime mirrors: `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/`。
- 默认只记录审查发现,不修 source skill 问题;除非用户明确要求修复。
- 每审完一个 skill,立即更新合并报告的顶部进度表和该 skill 小节,不要等全部审完后集中回填。
- 每个 skill 小节至少记录 Tier、status、verdict、已读取 source 文件、CE parity 结论或不适用原因、发现列表(文件:行号、严重程度、描述、修复建议)、依赖/artifact/config/context 结论、未检查项及原因。
- 对尚未完成的跨 skill/global 结论,先标注 `pending_global_cross_check`;Phase 3 再统一确认或降级。
- 如果上下文接近上限或需要压缩,先把当前 skill 的中间结论写入报告,标注 freshness、source refs、limitations 和 next skill;下一轮从方案和报告恢复,不要依赖 transcript。
- 每次更新报告后同步更新 `CHANGELOG.md`,并运行最窄验证:
  - `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md`
  - `npx jest tests/unit/changelog-format.test.js --runInBand`

完成条件:
- Phase 1-4 全部完成。
- 35 个 source skill 均有 `done` 状态和明确 verdict。
- 全局依赖、artifact contract、config key、共享脚本、上下文排除和测试覆盖缺口均已交叉验证。
- 合并报告与 `CHANGELOG.md` 已更新,验证命令结果已记录。
- 满足以上条件后才把 goal 标记为 complete;否则保持 active goal 并继续下一个 skill。
```

续跑时使用以下短 prompt:

```text
继续 active goal: CE 到 Spec-First Skill 迁移代码审查。
请先读取方案和合并报告,从报告进度表识别下一个待审 skill,继续审查并把本轮结论追加到合并报告和 `CHANGELOG.md`。
不要依赖上一轮 transcript;如果发现报告 freshness 与当前 source 不一致,先回源确认并记录 drift。
```

## 审查输出

最终产出一份合并报告:

```text
docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md
```

### 报告结构

```markdown
# CE 到 Spec-First Skill 迁移代码审查报告

## 审查进度
  | Skill | Tier | Status | Verdict | Last updated | Notes |
  |---|---|---|---|---|---|

## 全局依赖图谱
  - Skill 间引用关系图
  - Artifact 产出/消费映射表
  - Handoff 路由完整性表
  - 共享脚本 divergence 报告
  - 配置键覆盖矩阵

## 逐 Skill 审查发现

  ### Batch 1
    #### spec-test-xcode
    - Tier: A / B / C
    - Status: pending / in_progress / done
    - Verdict: pass / issues_found / critical_issues
    - Source files read
    - CE parity: applicable / not_applicable + conclusion
    - 发现列表(文件:行号, 严重程度, 描述, 修复建议)
    - 依赖关系验证结果
    - 上下文管理验证结果
    - Not checked / degraded checks + reason
  ### Batch 2 ... (同上)
  ### Batch 3 ... (同上,含 spec-mcp-setup)
  ### Batch 4 ... (同上)
  ### Batch 5 ... (同上,不含 CE 等价 verdict)

## 全局交叉验证
  - 悬空引用
  - Artifact 路径不匹配
  - Handoff 断裂
  - 配置键缺失
  - 共享脚本 divergence
  - 上下文排除违规
  - 测试覆盖缺口

## 汇总指标
  - 总 critical/high/medium/low/info 问题数
  - 各批次 pass rate
  - 依赖问题汇总
  - 上下文管理问题汇总
```

### 发现严重程度定义

| 严重程度 | 定义 | 示例 |
|---|---|---|
| **critical** | 导致 skill 无法正确执行或安全风险 | 指向不存在的 skill、硬编码 secret、危险命令 |
| **high** | 影响核心功能或跨 skill 链路断裂 | artifact 路径不匹配、handoff 丢失关键字段、mode 契约不一致 |
| **medium** | 影响质量但可降级运行 | 共享脚本 divergence、上下文过大、测试覆盖缺口 |
| **low** | 改进建议,不影响功能 | 命名不一致、文档措辞、冗余内容 |
| **info** | 记录性发现,无需修复 | 合理 divergence 记录、CE 历史说明 |

## 验证命令

审查完成后运行:

```bash
# 语法检查
npm run typecheck
bash -n skills/*/scripts/*.sh
PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile skills/*/scripts/*.py

# 入口治理
npm run lint:skill-entrypoints

# CE residual 全量扫描
rg -n "\bce-|compound-engineering|\.compound-engineering|ce-unified-plan|/tmp/compound-engineering" skills/

# 上下文排除扫描
rg -n "\.claude/|\.codex/|\.agents/skills/|\.cursor/skills/|\.kiro/skills/|\.qoder/skills/" skills/ --glob '*.md'

# 相关 focused contract tests
npx jest tests/unit/changelog-format.test.js --runInBand
npx jest tests/unit/migrated-skill-scripts-contracts.test.js --runInBand
npx jest tests/unit/repo-profile-cache-parity.test.js --runInBand
```

## 风险与反模式

- **False parity**: 把文件或名称匹配当作语义等价。
- **False drift**: 把 `spec-prd` 或 `spec-write-tasks` 等有意识的 spec-first 拆分误判为 CE 行为缺失。
- **Stale compatibility as contract**: 留下用户可能照着执行的 `ce-*` 示例。
- **Runtime mirror patching**: 通过编辑 generated mirrors 修复 skill 行为。
- **Over-scripted semantics**: 用 deterministic scans 裁决语义充分性,而不是把它们作为 LLM 判断的事实输入。
- **Downstream breakage**: 在未确认 `spec-plan`、`spec-doc-review`、`spec-work`、`spec-lfg` consumers 的情况下修改 brainstorm 或 plan artifact contracts。
- **Context bloat**: SKILL.md 过大或 references 无 trigger 控制导致常驻上下文膨胀。
- **Handoff context leak**: 传递过多上下文导致下游 skill context window 浪费。
- **False shared parity**: 同名脚本内容不一致但未标注 divergence 理由。

## 完成标准

当每个审查 skill 都具备以下内容时,本审查完成:

- CE 迁移相关 skill 的 CE 与 spec-first 两侧 source files 均已读取(或迁移审查已确认且无变化的低风险项可引用结论);spec-first 原生 / 拆分 skill 的 spec-first source files 均已读取,并记录其无 CE parity 目标。
- 各 skill 按「审查深度分级」完成对应维度:Tier A 完成全部适用维度(共 23 项,含 14b)深审;Tier B 完成自动化扫描 + 维度 1、3 + 残差抽查;Tier C 完成 source 质量/依赖/治理维度(上下文维度 16-22 按需),不做 CE parity。全覆盖自动化扫描对所有 skill 已运行。
- 有带 risk level 的 verdict(pass / issues_found / critical_issues)。
- 发现按严重程度分类(critical / high / medium / low / info)。
- 每个发现包含具体文件和行号。
- 全局依赖图谱已完成,所有跨 skill 引用已交叉验证。
- 共享脚本 divergence 已分类。
- 上下文管理问题已记录。
- 测试覆盖缺口已分析。
- 合并报告已输出。
- 每个已完成 skill 的结论已增量写入合并报告,顶部进度表与逐 skill 小节一致;如发生上下文压缩/续跑,报告中保留 freshness、source refs、limitations 和 next skill。

## 复审决议(2026-07-10 spec-doc-review)

本轮 `spec-doc-review` 发现已全部处置,记录如下。

**已直接修正(经源码核实):**
- skill 总数 36→35,native 7→6,移除已退役的 `retired-skill-review`(结论 / 目标 / 非目标 / Batch 5)。
- CE residual grep 改用 `\bce-` 词边界(实测 698→7 行,消除 `source-of` 等误匹配)。
- 维度 6/13 共享脚本副本清单更正为实际 9 处(`repo-profile-cache.py`、`repo-profiler.md`),剔除无该脚本的 `spec-compound-refresh`。

**判断类发现的决议:**
- **[P0] CE 基线**:固定 `~/xiaobu/compound-engineering-plugin` @ `fc0395b8`(v3.19.0)为唯一 parity 基准(见「CE 基线」小节)。
- **[P1] 审查规模**:改为风险分级(见「审查深度分级」)——自动化扫描全覆盖 + Tier A 深审 + Tier B/C 扫描抽查;批次标签成为分级依据;复用 2026-07-08 parity 审查报告的结论,仅验证 delta 与未覆盖项。据此 bespoke 全量矩阵不再与 `spec-code-review` 冗余满投,batch 标签产生实际优先级作用。
- **[P1] 上下文维度**:维度 16-22 对无 CE 基线的 Tier C 原生 skill 仅按需,不作强制满深度。
- **[P2] 维度计数**:14b 认定为第 12 个核心维度,核心「11 项」→「12 项」,总数保持 23,Phase 2 表述改为「维度 5-15(含 14b)」。
- **[P2] 维度重叠**:维度 15↔3、13↔6、22↔16 合并执行(见「审查深度分级」末),编号与总数不变。
