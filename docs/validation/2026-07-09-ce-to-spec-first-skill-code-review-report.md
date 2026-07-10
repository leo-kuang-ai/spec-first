# CE 到 Spec-First Skill 迁移代码审查报告

## 元数据

- 报告状态: in_progress
- 产出方: Codex goal execution
- 方案来源: `docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-plan.md`
- 已加载角色契约: `docs/10-prompt/结构化项目角色契约.md`
- 最近更新: 2026-07-10 15:32:38 CST
- 新鲜度: 以该时间点的当前工作树为准；已有的无关 dirty 文件未被本报告修改。
- 局限: Phase 1 确定性扫描已完成；Phase 2 逐 skill 语义审查已完成 Batch 1 全部 8 个 skill、Batch 2 全部 7 个 skill、Batch 3 全部 7 个 skill、Batch 4 全部 7 个 skill、Batch 5 已完成 `spec-prd` 与 `spec-write-tasks`。当前 HEAD 为 `98e50159`，仓库 `tests/` 目录已被清理删除，本轮 Jest focused / changelog-format 验证因此失败在测试基础设施缺失；`spec-write-tasks` output-quality eval 也因指向已缺失的 `tests/fixtures/spec-write-tasks/**` 而降级。
- 下一步: 审查 Batch 5 / `using-spec-first`。

## 审查进度

| Skill | Tier | 状态 | Verdict | 最近更新 | 备注 |
|---|---|---|---|---|---|
| spec-test-xcode | B | done | pass | 2026-07-10 11:54:59 CST | CE 迁移对齐；无已确认问题 |
| spec-polish | B | done | pass | 2026-07-10 11:56:35 CST | CE 迁移对齐；无已确认问题 |
| spec-explain | B | done | pass | 2026-07-10 11:58:08 CST | CE 迁移对齐；共享 cache 已由 parity test 覆盖 |
| spec-pov | B | done | pass | 2026-07-10 12:16:16 CST | CE 迁移对齐；共享 cache 已由 parity test 覆盖 |
| spec-dogfood | B | done | pass | 2026-07-10 12:18:49 CST | CE 迁移对齐；无已确认问题 |
| spec-strategy | B | done | pass | 2026-07-10 12:22:24 CST | CE 迁移对齐；无已确认问题 |
| spec-simplify-code | B | done | pass | 2026-07-10 12:25:49 CST | CE 迁移对齐；无已确认问题 |
| spec-commit | B | done | pass | 2026-07-10 12:26:57 CST | CE 迁移对齐；保留默认分支和 commit message 安全增强 |
| spec-commit-push-pr | B | done | issues_found | 2026-07-10 12:32:38 CST | 确认 `mode:pipeline` 被调用方语义缺失；`New concepts:` trailer 合同悬空 |
| spec-optimize | B | done | issues_found | 2026-07-10 12:35:59 CST | 确认 spec validation 从 schema `validation_rules` 全量校验退化为手写子集 |
| spec-promote | B | done | pass | 2026-07-10 12:40:05 CST | CE 迁移对齐；`disable-model-invocation` 与 Spiral opt-out config contract 已覆盖 |
| spec-proof | B | done | pass | 2026-07-10 12:46:31 CST | CE Publish Mode 已恢复为主能力；HITL 作为 spec-first 增强保留 |
| spec-resolve-pr-feedback | A | done | issues_found | 2026-07-10 12:51:02 CST | 核心 skill contract 保留；focused tests 与迁移后的 source path / skill-local prompt asset 漂移 |
| spec-test-browser | B | done | issues_found | 2026-07-10 12:57:43 CST | Pipeline 模式仍可能在 human verification / failure handling 处阻塞；internal helper frontmatter 未显式 `user-invocable: false` |
| spec-worktree | A | done | issues_found | 2026-07-10 13:05:48 CST | 确定性脚本、安全增强和 runtime delivery 测试通过；existing-ref/PR isolation 合同未实现 |
| spec-debug | A | done | issues_found | 2026-07-10 13:14:01 CST | CE debug flow 已投影；发现 ignored `__pycache__` 污染 source skill 目录 |
| spec-compound | A | done | issues_found | 2026-07-10 13:24:01 CST | CE 投影基本保留；发现中文 frontmatter locale 失败、template category 覆盖不全和 ignored `__pycache__` 污染 |
| spec-compound-refresh | A | done | issues_found | 2026-07-10 13:28:09 CST | Lifecycle contract 基本保留；共享 validator/template 问题同 `spec-compound`，另有 `plugin AGENTS.md` wording 和 ignored `__pycache__` |
| spec-sweep | A | done | issues_found | 2026-07-10 13:40:07 CST | Sweep state / ack / plan contract 基本保留；first-run config 写入清单漏列 lease TTL |
| spec-mcp-setup | A | done | issues_found | 2026-07-10 13:50:16 CST | near-parity；provider readiness / config template / source inventory 发现问题 |
| spec-riffrec-feedback-analysis | A | done | issues_found | 2026-07-10 13:58:30 CST | CE Riffrec capture analysis 保留；`spec-brainstorm` durable output 文案漂移 |
| spec-product-pulse | B | done | issues_found | 2026-07-10 14:09:18 CST | Product pulse CE 投影基本保留；report-template top-N error count 与当前不可配置合同矛盾 |
| spec-brainstorm | A | done | issues_found | 2026-07-10 14:16:39 CST | 核心 Product Contract / handoff 保留；共享 repo-profile parity 与 Markdown 结构发现问题 |
| spec-plan | A | done | issues_found | 2026-07-10 14:27:54 CST | 核心 plan artifact / handoff contract 保留；focused migration contract 的 CE file-set 断言与当前 source divergence 漂移 |
| spec-doc-review | A | done | issues_found | 2026-07-10 14:40:26 CST | 核心 persona review / synthesis / walkthrough contract 基本保留；CE missing-document gate 丢失 |
| spec-code-review | A | done | issues_found | 2026-07-10 14:44:56 CST | 核心 code review / mode:agent / cross-model / validator contract 基本保留；deployment checklist 可验证性约束退化 |
| spec-work | A | done | pass | 2026-07-10 15:03:14 CST | 核心 implementation / return-to-caller / shipping tail contract 保留；未发现迁移阻断问题 |
| spec-ideate | A | done | issues_found | 2026-07-10 15:07:21 CST | CE ideation contract 基本保留；发现 ignored `__pycache__` 污染 source skill 目录 |
| spec-lfg | A | done | pass | 2026-07-10 15:17:11 CST | CE hands-off pipeline 投影保留；引用既有 downstream pipeline 风险但未新增问题 |
| spec-prd | C | done | issues_found | 2026-07-10 15:25:28 CST | 原生 PRD workflow；producer finalize/receipt contract 强，但 `spec-plan` 消费端 verify-receipt handoff 缺口已确认 |
| spec-write-tasks | C | done | issues_found | 2026-07-10 15:32:38 CST | 原生 plan-to-task derived layer；runtime validator 健康，但 file-backed eval fixture 断裂 |
| using-spec-first | C | pending | - | 2026-07-10 11:52:39 CST | Batch 5 原生/拆分 skill |
| spec-write-skill | C | pending | - | 2026-07-10 11:52:39 CST | Batch 5 原生/拆分 skill |
| spec-app-consistency-audit | C | pending | - | 2026-07-10 11:52:39 CST | Batch 5 原生/拆分 skill |
| spec-rule-miner | C | pending | - | 2026-07-10 11:52:39 CST | Batch 5 原生/拆分 skill |

## Phase 1 全局依赖图谱

### CE 基线

- 命令: `git -C /Users/kuang/xiaobu/compound-engineering-plugin rev-parse HEAD`
- 结果: `fc0395b8c09331808e30e4a2f4cf27342d684d81`
- 方案期望前缀: `fc0395b8`
- 状态: confirmed_current

### Skill 清单

- 命令: `find skills -mindepth 1 -maxdepth 1 -type d | sort`
- 数量: 35 个 source skill 目录。
- 状态: 与方案一致。

### 上下文预算基线

- 命令: `wc -l skills/*/SKILL.md`
- 总计: 35 个 `SKILL.md` 共 9720 行。
- 超过方案建议 500 行上下文预算的文件:
  - `skills/spec-code-review/SKILL.md`: 837
  - `skills/spec-compound-refresh/SKILL.md`: 679
  - `skills/spec-compound/SKILL.md`: 758
  - `skills/spec-optimize/SKILL.md`: 760
  - `skills/spec-plan/SKILL.md`: 809
- 状态: 待语义审查；行数本身仅作为 advisory signal。

### 全覆盖自动化扫描

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| CE 基线 | `git -C /Users/kuang/xiaobu/compound-engineering-plugin rev-parse HEAD` | pass | 与 `fc0395b8` baseline 一致 |
| Skill 数量 | `find skills -mindepth 1 -maxdepth 1 -type d \| wc -l` | pass | 35 |
| CE residual 扫描 | `rg -n "\bce-\|compound-engineering\|\.compound-engineering\|ce-unified-plan\|/tmp/compound-engineering" skills/` | advisory_hits | 7 个命中，均为 `spec-mcp-setup/scripts/*` 下对 `compound-engineering.local.md` legacy setup markdown 的检测；延后到 `spec-mcp-setup` 审查中分类 |
| 上下文排除扫描 | `rg -n "\.claude/\|\.codex/\|\.agents/skills/\|\.cursor/skills/\|\.kiro/skills/\|\.qoder/skills/" skills/ --glob '*.md'` | advisory_hits | 包含大量显式 source/runtime 边界提醒；也包含 `spec-polish` 的 `.claude/launch.json` 配置引用，以及 best-practices researcher 对 runtime skill lookup 的引用。逐 skill 分类时确认 |
| 入口治理 lint | `npm run lint:skill-entrypoints` | pass | 扫描 268 个文件 |
| Typecheck | `npm run typecheck` | pass | 检查 114 个文件 |
| Shell 语法 | `bash -lc 'status=0; while IFS= read -r f; do bash -n "$f" \|\| status=1; done < <(find skills -path "*/scripts/*.sh" -type f \| sort); exit $status'` | pass | 无输出 |
| Python 语法初次运行 | `bash -lc 'PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile $(find skills -path "*/scripts/*.py" -type f \| sort)'` | degraded | Python 试图写入 `/Users/kuang/Library/Caches/com.apple.python/...`，被 sandbox 拒绝；不是脚本语法失败 |
| Python 语法重跑 | `bash -lc 'PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile $(find skills -path "*/scripts/*.py" -type f \| sort)'` | pass | 使用可写 pycache 后通过 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |
| 迁移脚本契约 | `npx jest tests/unit/migrated-skill-scripts-contracts.test.js --runInBand` | pass | 2 个测试通过 |
| Repo profile cache parity | `npx jest tests/unit/repo-profile-cache-parity.test.js --runInBand` | pass | 2 个测试通过 |

### 共享脚本清单

状态: pending_global_cross_check。

计划检查:
- `scripts/repo-profile-cache.py` 的 9 个消费者副本。
- `scripts/analyze_riffrec_zip.py` 在 `spec-sweep` 和 `spec-riffrec-feedback-analysis` 中的副本。
- `references/agents/repo-profiler.md` 的 9 个消费者副本。
- `scripts/validate-frontmatter.py` 在 `spec-compound` 和 `spec-compound-refresh` 中的副本。
- `scripts/validate-doc-claims.py` 在 `spec-compound` 和 `spec-compound-refresh` 中的副本。

### 配置键覆盖矩阵

状态: pending_global_cross_check。

待按方案验证的配置键:
- `feedback_sources`
- `sweep_*`
- `pulse_*`
- `spec_promote_spiral_optout`
- `work_delegate_*`
- `plan_skip_scoping_confirm`
- `verification_profile_path`
- `ideate_output`

### Artifact / Handoff 路由图

状态: pending_global_cross_check。

待验证主链路:

```text
spec-brainstorm -> spec-plan -> spec-write-tasks -> spec-work -> spec-code-review -> spec-compound
                                                        |
                                              spec-simplify-code
                                                        |
                                              spec-commit-push-pr
                                                        |
                                                   spec-lfg
```

## 逐 Skill 审查发现

### Batch 1

#### spec-test-xcode

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-test-xcode/SKILL.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-xcode/SKILL.md`
- CE parity: applicable。spec-first 文件结构上与 CE 对齐，只在预期投影点存在差异:
  - frontmatter name 和扩展后的 description 位于 `skills/spec-test-xcode/SKILL.md:2-3`
  - blocking question tool 列表收窄到 Claude Code 和 Codex，位于 `skills/spec-test-xcode/SKILL.md:112`
  - quick usage examples 投影为 `spec-test-xcode`，位于 `skills/spec-test-xcode/SKILL.md:193-203`
  - 下游集成投影为 `spec-code-review`，位于 `skills/spec-test-xcode/SKILL.md:206-208`
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - `spec-code-review` 下游引用存在于 source inventory 中，是 CE `ce-code-review` 的预期投影。
  - 该 skill 除 code-review 集成外，未声明 artifact contract、config key、shared script 或额外 handoff route。
- 上下文管理验证结果:
  - `SKILL.md` 共 208 行，低于方案建议的 500 行上下文预算。
  - 该 skill 没有 `references/`、`scripts/`、schemas 或 assets，因此不存在 triggered-reference 完整性缺口。
  - `skills/spec-test-xcode/SKILL.md` 中没有 generated runtime 路径。
- 安全 / residual 检查:
  - 对 `skills/spec-test-xcode` 的 CE residual 扫描无 spec-first residual 命中。
  - 安全 grep 只命中 `skills/spec-test-xcode/SKILL.md:106` 的 `Push notifications` 文案；这是 `push` 误报，不是 git 操作。
- 未检查 / degraded checks:
  - 未实际运行 XcodeBuildMCP；本审查检查 source 迁移正确性，不验证 simulator 可用性。

#### spec-polish

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-polish/SKILL.md`
  - `skills/spec-polish/references/` 下全部文件
  - `skills/spec-polish/scripts/` 下全部文件
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-polish/` 下对应 CE 文件
- CE parity: applicable。文件集合与 CE 一致。差异均为预期且有理由:
  - frontmatter name 从 `ce-polish` 投影为 `spec-polish`，位于 `skills/spec-polish/SKILL.md:2`
  - 新增 Workflow Contract Summary，位于 `skills/spec-polish/SKILL.md:12-36`；它澄清 inputs、outputs、artifacts、failure modes 和 downstream consumers，不改变 CE 核心循环
  - `SKILL_DIR` prose 从 CE 投影到 spec-first，位于 `skills/spec-polish/SKILL.md:46`
  - browser helper fallback 从 host-generic 改为 `agent-browser` + `spec-mcp-setup` degraded-mode guidance，位于 `skills/spec-polish/SKILL.md:112-113`
  - dev-server detection docs 明确不 grep `AGENTS.md` / `CLAUDE.md`，位于 `skills/spec-polish/references/dev-server-detection.md:40` 和 `skills/spec-polish/references/dev-server-rails.md:26`
  - `ide-detection.md` 删除退役 CE host 示例，同时保留 terminal fallback，位于 `skills/spec-polish/references/ide-detection.md:23-29`
  - `detect-project-type.sh` 将 word-splitting loop 改为 newline-safe read，位于 `skills/spec-polish/scripts/detect-project-type.sh:178-228`
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - Summary 中提到的 downstream consumers 是宽口径 workflow consumers（`spec-work`、release/review workflows）；该 skill 不产出严格 artifact contract。
  - `spec-mcp-setup` 引用是 browser automation helper 缺失时的 degraded-mode setup handoff，不是硬依赖。
- 上下文管理验证结果:
  - `SKILL.md` 共 137 行，低于方案建议的 500 行上下文预算。
  - References 在 `skills/spec-polish/SKILL.md:118-131` 明确列出，并按需加载。
  - `.claude/launch.json` 引用是目标项目 dev-server 配置兼容路径，不是把 generated runtime 当 source 修复。该点保留为 Phase 3 context-exclusion 分类的 advisory signal。
- 安全 / residual 检查:
  - 对 `skills/spec-polish` 的 CE residual 扫描无 CE namespace residual 命中。
  - 脚本语法已在 Phase 1 全局 `bash -n` 中通过。
  - 安全 grep 命中 `skills/spec-polish/scripts/detect-project-type.sh:148-162` 的 `eval`；人工审读确认被 eval 的 find 表达式由硬编码 exclude dirs 和 signature filenames 构成，不拼接用户输入。作为已审查 advisory 记录，不作为 confirmed issue。
  - `resolve-package-manager.sh` 和 `resolve-port.sh` 的 path 参数在使用前均被引用并做目录检查。
- 未检查 / degraded checks:
  - 未运行 browser/dev-server 流程；本审查检查 source 迁移和安全性，不验证目标项目 runtime 可用性。

#### spec-explain

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-explain/SKILL.md`
  - `skills/spec-explain/references/agents/repo-profiler.md`
  - `skills/spec-explain/references/agents/work-recap-scout.md`
  - `skills/spec-explain/references/check-in.md`
  - `skills/spec-explain/references/destinations.md`
  - `skills/spec-explain/references/explainer-html.md`
  - `skills/spec-explain/references/explainer-markdown.md`
  - `skills/spec-explain/references/intake.md`
  - `skills/spec-explain/references/repo-profile-cache.md`
  - `skills/spec-explain/scripts/repo-profile-cache.py`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-explain/` 下对应 CE 文件清单与 diff
- CE parity: applicable。文件集合与 CE 一致。差异均为预期且有理由:
  - `ce-explain` -> `spec-explain` identity projection，位于 `skills/spec-explain/SKILL.md:2`
  - 删除 host argument placeholder，改为使用 conversation input，位于 `skills/spec-explain/SKILL.md:12`
  - blocking question tool 列表收窄到 Claude Code 和 Codex，位于 `skills/spec-explain/SKILL.md:20`
  - scratch path 投影到 `/tmp/spec-first/spec-explain`，位于 `skills/spec-explain/SKILL.md:44`
  - 下游 skill 名称投影为 `spec-brainstorm`、`spec-ideate`、`spec-simplify-code`、`spec-polish`、`spec-pov` 和 `spec-compound`，位于 `skills/spec-explain/SKILL.md:61` 与 `skills/spec-explain/SKILL.md:91-101`
  - Proof destination 投影为 `spec-proof` 和 Spec-First identity，位于 `skills/spec-explain/references/destinations.md:24-26`
  - explainer footer 命名为 `spec-explain`，位于 `skills/spec-explain/references/explainer-html.md:11`
  - shared repo-profile cache 路径投影为 `/tmp/spec-first/repo-profile`，位于 `skills/spec-explain/references/repo-profile-cache.md:25-29` 和 `skills/spec-explain/scripts/repo-profile-cache.py:25-58`
  - shared cache script 包含当前 git quoted-path fix，位于 `skills/spec-explain/scripts/repo-profile-cache.py:177-221`，已由 `repo-profile-cache-parity.test.js` 覆盖
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - 下游引用均指向 inventory 中存在的 spec-first skill。
  - 共享的 `repo-profile-cache.py`、`repo-profile-cache.md` 和 `references/agents/repo-profiler.md` 已由 Phase 1 的 `repo-profile-cache-parity.test.js` 覆盖。
- 上下文管理验证结果:
  - `SKILL.md` 共 101 行，低于方案建议的 500 行上下文预算。
  - References 按明确 phase trigger 加载: Phase 1 加载 intake，Phase 3 加载 check-in，Phase 4 加载 rendering reference，Phase 6 加载 destinations，repo-profile cache 仅在 repo-touching input 时加载。
  - cache reference 明确 question-specific grounding 永不缓存、必须 fresh gather，位于 `skills/spec-explain/references/repo-profile-cache.md:17-23`，保留 advisory cache 边界。
- 安全 / residual 检查:
  - 对 `skills/spec-explain` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 命中 `repo-profile-cache.py` 中的 `subprocess`；人工审读确认它使用固定 argv `git` 调用且无 `shell=True`，位于 `skills/spec-explain/scripts/repo-profile-cache.py:224-234` 和 `skills/spec-explain/scripts/repo-profile-cache.py:245-292`。
  - cache 写入使用 `tempfile.mkstemp` + `os.replace`，位于 `skills/spec-explain/scripts/repo-profile-cache.py:415-438`；cache 读取会拒绝非当前用户拥有的文件，位于 `skills/spec-explain/scripts/repo-profile-cache.py:335-345`。
- 未检查 / degraded checks:
  - 未执行完整 explainer run 或 subagent dispatch；Tier B 审查聚焦迁移正确性、source 安全和上下文管理。

#### spec-pov

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-pov/SKILL.md`
  - `skills/spec-pov/references/agents/external-evidence-researcher.md`
  - `skills/spec-pov/references/agents/precedent-activity-scout.md`
  - `skills/spec-pov/references/agents/project-grounding-scout.md`
  - `skills/spec-pov/references/agents/repo-profiler.md`
  - `skills/spec-pov/references/boundaries.md`
  - `skills/spec-pov/references/intake.md`
  - `skills/spec-pov/references/invocation.md`
  - `skills/spec-pov/references/method.md`
  - `skills/spec-pov/references/repo-profile-cache.md`
  - `skills/spec-pov/references/report.md`
  - `skills/spec-pov/scripts/repo-profile-cache.py`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-pov/` 下对应 CE 文件清单与 diff
- CE parity: applicable。文件集合与 CE 一致。差异均为预期且有理由:
  - `ce-pov` -> `spec-pov` identity projection，位于 `skills/spec-pov/SKILL.md:2`
  - 删除 host argument placeholder，改为使用 conversation input，位于 `skills/spec-pov/SKILL.md:11`
  - blocking question tool 列表收窄到 Claude Code 和 Codex，位于 `skills/spec-pov/SKILL.md:21`
  - 输出模式、warm invocation 和 durable capture 从 `ce-pov`/`ce-compound` 投影为 `spec-pov`/`spec-compound`，位于 `skills/spec-pov/SKILL.md:37-39`
  - 选择边界和下游 handoff 投影为 `spec-ideate`、`spec-brainstorm`、`spec-plan`、`spec-work`、`spec-compound`，位于 `skills/spec-pov/SKILL.md:45` 和 `skills/spec-pov/SKILL.md:101-119`
  - scratch path 投影到 `/tmp/spec-first/spec-pov`，位于 `skills/spec-pov/SKILL.md:67-73`
  - Proof destination 投影为 `spec-proof`，位于 `skills/spec-pov/references/report.md:23-27`
  - shared repo-profile cache 路径投影为 `/tmp/spec-first/repo-profile`，位于 `skills/spec-pov/references/repo-profile-cache.md:25-29`
  - shared cache script 包含当前 git quoted-path fix，位于 `skills/spec-pov/scripts/repo-profile-cache.py:224-292`，已由 Phase 1 的 `repo-profile-cache-parity.test.js` 覆盖
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - 下游引用 `spec-ideate`、`spec-brainstorm`、`spec-plan`、`spec-work`、`spec-compound` 和 `spec-proof` 均指向 inventory 中存在的 spec-first skill。
  - `spec-pov` 默认输出是 chat verdict；完整报告和 durable decision capture 均为 opt-in，不声明固定 artifact contract，因此未发现 artifact path mismatch。
  - 共享的 `repo-profile-cache.py`、`repo-profile-cache.md` 和 `references/agents/repo-profiler.md` 属于 9 份 byte-duplicated cache 资产，已由 Phase 1 的 parity test 覆盖。
- 上下文管理验证结果:
  - `SKILL.md` 共 121 行，低于方案建议的 500 行上下文预算。
  - References 按 phase trigger 加载: warm invocation 时读 `references/invocation.md`，边界不清时读 `references/intake.md` / `references/boundaries.md`，Phase 2 前读 `references/method.md`，完整报告 opt-in 时读 `references/report.md`。
  - two-floor gate 明确要求 project floor 和 external floor 均为 verified evidence，且 conversation claim 不可替代 verified facts，位于 `skills/spec-pov/SKILL.md:15-17` 和 `skills/spec-pov/references/method.md:17-24`。
  - verdict 输出要求引用 dossier 证据而非粘贴全文，位于 `skills/spec-pov/references/method.md:46-53`，符合 handoff/context economy 原则。
- 安全 / residual 检查:
  - 对 `skills/spec-pov` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 命中 `repo-profile-cache.py` 中的 `subprocess`；人工审读确认它使用固定 argv `git` 调用且无 `shell=True`，位于 `skills/spec-pov/scripts/repo-profile-cache.py:224-234` 和 `skills/spec-pov/scripts/repo-profile-cache.py:245-292`。
  - cache 写入使用 `tempfile.mkstemp` + `os.replace`，位于 `skills/spec-pov/scripts/repo-profile-cache.py:415-438`；cache 读取会拒绝非当前用户拥有的文件，位于 `skills/spec-pov/scripts/repo-profile-cache.py:335-345`。
  - 安全 grep 中 `token`、`push` 命中均为 prose 或变量名语境，未发现 git force push、secret 输出或危险 shell 命令。
- 未检查 / degraded checks:
  - 未执行完整 POV verdict run、web research 或 subagent dispatch；Tier B 审查聚焦迁移正确性、source 安全和上下文管理。

#### spec-dogfood

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-dogfood/SKILL.md`
  - `skills/spec-dogfood/references/dogfood-report-template.md`
  - `skills/spec-dogfood/references/test-matrix-taxonomy.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-dogfood/` 下对应 CE 文件清单与 diff
- CE parity: applicable。文件集合与 CE 一致。差异均为预期且有理由:
  - `ce-dogfood` -> `spec-dogfood` identity projection，位于 `skills/spec-dogfood/SKILL.md:2`
  - description 从 manual-only CE 入口扩展为 PR/branch dogfood 使用边界，并明确不用于 polish、smoke test、code review、planning 或 broad exploration，位于 `skills/spec-dogfood/SKILL.md:3`
  - 新增 Workflow Contract Summary，明确 inputs、outputs、artifacts、failure modes 和 downstream consumers，位于 `skills/spec-dogfood/SKILL.md:14-38`
  - `agent-browser` 缺失时从 `/ce-setup` 投影为 `spec-mcp-setup` degraded-mode 指引，位于 `skills/spec-dogfood/SKILL.md:44-53`
  - 可复用 skill 从 `ce-worktree`、`ce-debug`、`ce-commit`、`ce-compound` 投影为 `spec-worktree`、`spec-debug`、`spec-commit`、`spec-compound`，位于 `skills/spec-dogfood/SKILL.md:55-64`
  - PR/trunk guard 和 worktree isolation 中的 invocation 示例投影为 `spec-dogfood` / `spec-worktree`，位于 `skills/spec-dogfood/SKILL.md:82-90`
  - fix loop 中 root-cause、commit 和 learning handoff 投影为 `spec-debug`、`spec-commit`、`spec-compound`，位于 `skills/spec-dogfood/SKILL.md:199-218`
  - 报告模板和 finalization prose 中的 generator / learning handoff 投影为 `spec-dogfood` 与 `spec-compound`，位于 `skills/spec-dogfood/references/dogfood-report-template.md:1-7`、`skills/spec-dogfood/references/dogfood-report-template.md:75-81` 和 `skills/spec-dogfood/SKILL.md:220-224`
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - 下游/复用引用 `spec-worktree`、`spec-debug`、`spec-commit`、`spec-compound`、`spec-code-review`、`spec-work`、`spec-polish` 和 `spec-test-browser` 均指向 inventory 中存在的 spec-first skill。
  - 输出 artifact 路径 `docs/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md` 在 summary、resumability 和 finalization 中一致，位于 `skills/spec-dogfood/SKILL.md:25-29`、`skills/spec-dogfood/SKILL.md:92-99` 和 `skills/spec-dogfood/SKILL.md:220-224`。
  - `agent-browser` 是该 skill 的硬运行依赖；缺失时明确 stop 并转 `spec-mcp-setup` 查看安装命令，位于 `skills/spec-dogfood/SKILL.md:40-53`。
- 上下文管理验证结果:
  - `SKILL.md` 共 224 行，低于方案建议的 500 行上下文预算。
  - `references/test-matrix-taxonomy.md` 只在 Phase 2 matrix derivation 时加载，位于 `skills/spec-dogfood/SKILL.md:158-164`；`references/dogfood-report-template.md` 在创建和最终校验报告时加载，位于 `skills/spec-dogfood/SKILL.md:92-99` 和 `skills/spec-dogfood/SKILL.md:220-224`。
  - 该 skill 的可恢复状态落在 report doc 和 task list 双轨，其中 report doc 是跨会话 source of truth，位于 `skills/spec-dogfood/SKILL.md:92-99`，符合长任务 handoff discipline。
- 安全 / residual 检查:
  - 对 `skills/spec-dogfood` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 无命中；该 skill 没有 `scripts/`，Phase 1 shell/Python 语法检查不适用。
  - git/gh 操作限定为 diff、checkout、PR checkout 和 trunk detection；未发现 `force push`、`rm -rf`、`sudo`、`curl | bash` 或 secret 输出。
  - transient screenshot 明确写入 OS temp，不写 repo root，位于 `skills/spec-dogfood/SKILL.md:175-191`。
- 未检查 / degraded checks:
  - 未实际运行 `agent-browser`、dev server、PR checkout 或完整 dogfood matrix；Tier B 审查聚焦迁移正确性、source 安全和上下文管理。

#### spec-strategy

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-strategy/SKILL.md`
  - `skills/spec-strategy/references/interview.md`
  - `skills/spec-strategy/references/strategy-template.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-strategy/` 下对应 CE 文件清单与 diff
- CE parity: applicable。文件集合与 CE 一致。差异均为预期且有理由:
  - `ce-strategy` -> `spec-strategy` identity projection，位于 `skills/spec-strategy/SKILL.md:2`
  - description 和核心正文中的下游 grounding 从 `ce-ideate`、`ce-brainstorm`、`ce-plan` 投影为 `spec-ideate`、`spec-brainstorm`、`spec-plan`，位于 `skills/spec-strategy/SKILL.md:3` 和 `skills/spec-strategy/SKILL.md:11`
  - blocking question tool 列表收窄到 Claude Code 和 Codex，位于 `skills/spec-strategy/SKILL.md:15-19`
  - 删除 host argument placeholder，改为将当前用户请求解释为 optional focus，位于 `skills/spec-strategy/SKILL.md:21-23`
  - "Anchor, not plan" 和 downstream handoff 中的 `ce-*` 引用投影为 `spec-*`，位于 `skills/spec-strategy/SKILL.md:25-30` 和 `skills/spec-strategy/SKILL.md:80-90`
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - 下游引用 `spec-ideate`、`spec-brainstorm` 和 `spec-plan` 均指向 inventory 中存在的 spec-first skill。
  - 主要 artifact 是 repo root `STRATEGY.md`；`SKILL.md`、interview reference 和 template 对该路径一致，位于 `skills/spec-strategy/SKILL.md:11`、`skills/spec-strategy/SKILL.md:36-42`、`skills/spec-strategy/SKILL.md:61-78` 和 `skills/spec-strategy/references/strategy-template.md:1-4`。
  - Template 的 post-write checklist 要求 frontmatter、ISO date、placeholder 清理、metrics/tracks 数量与 problem/approach 连接，位于 `skills/spec-strategy/references/strategy-template.md:79-89`。
- 上下文管理验证结果:
  - `SKILL.md` 共 95 行，低于方案建议的 500 行上下文预算。
  - `references/interview.md` 仅在 Phase 1 或目标 section 更新时加载，位于 `skills/spec-strategy/SKILL.md:44-61` 和 `skills/spec-strategy/SKILL.md:63-78`；`references/strategy-template.md` 仅在写入前加载，位于 `skills/spec-strategy/SKILL.md:61`。
  - 该 skill 采用 preview-first 写入: 先在 chat 中呈现完整 draft 并提供一轮 edits，再写 `STRATEGY.md`，位于 `skills/spec-strategy/SKILL.md:61`。
- 安全 / residual 检查:
  - 对 `skills/spec-strategy` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 命中均为 prose 中的 `push back` / `pushback`，非 shell、git 或 secret 语境。
  - 该 skill 没有 `scripts/`，Phase 1 shell/Python 语法检查不适用。
- 未检查 / degraded checks:
  - 未实际运行 strategy interview 或写入 `STRATEGY.md`；Tier B 审查聚焦迁移正确性、source 安全和上下文管理。

#### spec-simplify-code

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-simplify-code/SKILL.md`
  - `skills/spec-simplify-code/references/personas/code-quality-reviewer.md`
  - `skills/spec-simplify-code/references/personas/code-reuse-reviewer.md`
  - `skills/spec-simplify-code/references/personas/efficiency-reviewer.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-simplify-code/` 下对应 CE 文件清单与 diff
- CE parity: applicable。文件集合与 CE 一致。差异均为预期且有理由:
  - `ce-simplify-code` -> `spec-simplify-code` identity projection，位于 `skills/spec-simplify-code/SKILL.md:2`
  - description 中 bug workflow 从 `ce-debug` 投影为 `spec-debug`，位于 `skills/spec-simplify-code/SKILL.md:3`
  - blocking question tool 列表收窄到 Claude Code 和 Codex，位于 `skills/spec-simplify-code/SKILL.md:17`
  - 三个 persona reference 与 CE 对应文件无 diff；保留 code reuse、code quality、efficiency 三维审查语义，位于 `skills/spec-simplify-code/SKILL.md:19-33`
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - 下游/分流引用 `spec-debug` 指向 inventory 中存在的 spec-first skill。
  - 该 skill 不声明持久 artifact contract、config key 或共享脚本；输出是直接代码修改后的 summary 与 verification evidence。
  - persona dispatch payload 明确要求读取 prompt asset 并传 full file content，避免靠记忆复述 rubrics，位于 `skills/spec-simplify-code/SKILL.md:21-29`。
- 上下文管理验证结果:
  - `SKILL.md` 共 62 行，低于方案建议的 500 行上下文预算。
  - 三个 persona references 仅在 Step 2 dispatch 时加载，位于 `skills/spec-simplify-code/SKILL.md:19-33`；常驻上下文只保留主流程、边界和验证要求。
  - Step 3/4 明确要求行为保持、保留安全检查、运行 typecheck/lint/tests，并禁止弱化断言或跳过测试来制造通过，位于 `skills/spec-simplify-code/SKILL.md:35-56`。
- 安全 / residual 检查:
  - 对 `skills/spec-simplify-code` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 无命中；该 skill 没有 `scripts/`，Phase 1 shell/Python 语法检查不适用。
  - `skills/spec-simplify-code/SKILL.md:41` 明确禁止简化掉 trust boundary 输入校验、授权、escaping、sanitization 和 accessibility affordances；这是该 skill 的关键安全 guardrail。
- 未检查 / degraded checks:
  - 未实际运行三 persona simplification pass 或改代码；Tier B 审查聚焦迁移正确性、source 安全和上下文管理。

#### spec-commit

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-commit/SKILL.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-commit/SKILL.md`
- CE parity: applicable。文件集合与 CE 一致。差异均为预期且有理由:
  - `ce-commit` -> `spec-commit` identity projection，位于 `skills/spec-commit/SKILL.md:2`
  - description 从简短 CE 入口扩展为 commit/save 触发语义和 conventional commit fallback，位于 `skills/spec-commit/SKILL.md:3`
  - non-Claude context fallback 从单个 interleaved shell command 改为分开运行 `git status`、`git diff HEAD`、`git branch --show-current`、`git log --oneline -10` 和 default-branch probe，位于 `skills/spec-commit/SKILL.md:31-43`
  - detached HEAD blocking question tool 列表收窄到 Claude Code 和 Codex，位于 `skills/spec-commit/SKILL.md:61-66`
  - 默认分支保护前移到 staging/commit 之前，并要求 `git check-ref-format --branch` 校验分支名，位于 `skills/spec-commit/SKILL.md:87-100`
  - commit message 从 inline command substitution heredoc 改为 `mktemp` temp file + `git commit -F`，避免 shell interpolation 并保留多行 body，位于 `skills/spec-commit/SKILL.md:106-118`
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - 该 skill 不引用其他 `spec-*` skill，不声明持久 artifact contract、config key、references 或 scripts。
  - 输出 artifact 是 git commit；Step 5 要求提交后运行 `git status` 并报告 commit hash 和 subject，位于 `skills/spec-commit/SKILL.md:120-122`。
- 上下文管理验证结果:
  - `SKILL.md` 共 122 行，低于方案建议的 500 行上下文预算。
  - 该 skill 无 triggered references；常驻上下文保持单文件流程。
  - Context fallback 明确要求分开采集命令输出，避免 interleaved output 干扰解析，位于 `skills/spec-commit/SKILL.md:31-43`。
- 安全 / residual 检查:
  - 对 `skills/spec-commit` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 命中 `sensitive files (.env, credentials)`，是安全防护说明而非 secret 泄漏，位于 `skills/spec-commit/SKILL.md:106`。
  - Git 操作安全: 默认分支禁止直接提交；branch name 先经 `git check-ref-format --branch`；branch creation 失败时 stop before staging；staging 偏好具体文件名而非 `git add -A` 或 `git add .`，位于 `skills/spec-commit/SKILL.md:87-118`。
  - 该 skill 没有 `scripts/`，Phase 1 shell/Python 语法检查不适用。
- 未检查 / degraded checks:
  - 未实际创建 git commit 或 feature branch；本审查检查 source 迁移、安全 guardrail 和上下文管理。

### Batch 2

#### spec-commit-push-pr

- Tier: B
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-commit-push-pr/SKILL.md`
  - `skills/spec-commit-push-pr/references/branch-creation.md`
  - `skills/spec-commit-push-pr/references/pr-description-writing.md`
  - `skills/spec-lfg/SKILL.md`
  - `tests/unit/spec-commit-push-pr-contracts.test.js`
  - `tests/unit/spec-sweep-lfg-migration-contracts.test.js`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-commit-push-pr/SKILL.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-commit-push-pr/references/pr-description-writing.md` 的相关命中
- CE parity: applicable。spec-first 版本保留了 commit/push/PR 主流程、PR body `--body-file` 安全写入、fresh-base branch creation 和 value-first PR description writing，但相对 CE baseline 存在两个已确认 contract divergence，且当前 source 未声明为 intentional:
  - CE baseline 在 `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-commit-push-pr/SKILL.md:17` 明确定义 `mode:pipeline` 为非交互 modifier；当前 `skills/spec-commit-push-pr/SKILL.md:4` 只在 `argument-hint` 暴露该 token，正文 Mode detection 未定义它。
  - CE baseline 在 `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-commit-push-pr/SKILL.md:106-135` 包含 concept teaching gate、archive 和 `New concepts:` trailer；当前 `skills/spec-commit-push-pr/references/pr-description-writing.md:255-281` 只组装 Summary/body/evidence/badge，不再产生 `## New concepts`。
- 发现:
  1. high — `skills/spec-commit-push-pr/SKILL.md:4`、`skills/spec-commit-push-pr/SKILL.md:11`、`skills/spec-commit-push-pr/SKILL.md:112-114`、`skills/spec-commit-push-pr/SKILL.md:180-183`、`skills/spec-commit-push-pr/SKILL.md:215-220`、`skills/spec-lfg/SKILL.md:70-72`: `spec-lfg` 以 `mode:pipeline` 调用该 skill，并声明它会非交互 commit/push/PR；但被调用 skill 没有解析或定义 `mode:pipeline`，仍在 detached/default branch、evidence capture、existing PR rewrite 等路径使用 blocking ask。影响是 LFG hands-off pipeline 可能在 step 8 停住，或在无交互环境下错误 fallback。建议修复方向: 在 `spec-commit-push-pr` 中恢复/投影 CE 的 `mode:pipeline` modifier 语义，明确每个 suppressed ask 的保守默认；同时新增 contract test 锁定被调用方包含非交互定义，而不只锁 `spec-lfg` 调用字符串。
  2. medium — `skills/spec-lfg/SKILL.md:72`、`skills/spec-lfg/SKILL.md:127`、`skills/spec-commit-push-pr/references/pr-description-writing.md:255-281`、`tests/unit/spec-sweep-lfg-migration-contracts.test.js:133-142`: `spec-lfg` 和测试仍保留 `New concepts:` trailer 消费合同，但当前 `spec-commit-push-pr` 已移除 CE 的 concept teaching / archive / trailer 生产路径。影响是全局迁移报告和 contract test 误认为该链路仍被保留，后续维护者会把悬空 trailer 当成有效能力。建议修复方向: 二选一收敛合同：若 spec-first 仍需要该能力，则恢复 Spec-First 版 concept teaching gate、`New concepts:` section/trailer 和 `spec-explain` follow-up；若该能力有意删除，则从 `spec-lfg` 和测试中删除 trailer 消费，并在迁移审查中记录 intentional divergence。
- 依赖关系验证结果:
  - `spec-lfg` 是主要下游消费者，当前依赖 `spec-commit-push-pr mode:pipeline` 非交互 shipping 语义；该依赖存在 confirmed mismatch。
  - `branch-creation.md` 引用存在且内容比 CE 更安全: 校验 base/branch 名称、fetch fresh remote base、处理 stale-base contamination、checkout collision stash/retry，并禁止 silently branch from local HEAD。
  - `pr-description-writing.md` 引用存在，并包含 PR range resolution、fork/API fallback、value-first writing、`--body-file` PR body 应用约束和 Spec-First badge；不再包含 concept teaching step。
  - 该 skill 不声明 config key；`archive:on|off` 仍在 argument-hint 中，但当前正文无 active consumer，归入 finding 2 的 trailer/archival 悬空合同。
- 上下文管理验证结果:
  - `SKILL.md` 共 234 行，低于方案建议的 500 行上下文预算。
  - `references/pr-description-writing.md` 仅在 description update 或 Step 6 composition 时加载，`references/branch-creation.md` 仅在 default-branch/branch creation 路径加载，符合 triggered-reference 纪律。
  - Context fallback 已拆分为独立命令，避免 CE baseline 中单个 `printf; command; ...` 输出交织。
- 安全 / residual 检查:
  - 对 `skills/spec-commit-push-pr` 的 CE residual 扫描无 CE namespace residual 命中。
  - PR body 写入要求 `mktemp` + platform file-write tool + `--body-file`，并在 create/edit 后用 `gh pr view ... body` 校验非空，位于 `skills/spec-commit-push-pr/SKILL.md:82-91`、`skills/spec-commit-push-pr/SKILL.md:193-208` 和 `skills/spec-commit-push-pr/SKILL.md:223-227`。
  - commit message 当前示例仍展示 heredoc 写 temp file，位于 `skills/spec-commit-push-pr/SKILL.md:151-158`；风险低于 inline command substitution，但后续修复 pipeline 时可顺手改为明确要求 platform file-write tool，避免示例诱导 shell heredoc 拼接复杂内容。
  - Git 操作安全: 避免 `git add -A` / `git add .`，位于 `skills/spec-commit-push-pr/SKILL.md:150`；push 固定为 `git push -u origin HEAD`，其无 remote 场景由 `spec-lfg` shipping precondition 在上游绕开，位于 `skills/spec-lfg/SKILL.md:36` 和 `skills/spec-lfg/SKILL.md:72`。
- 未检查 / degraded checks:
  - 未实际执行 commit、push、PR create/edit 或 `gh` 网络调用；本审查只验证 source contract、迁移 parity 和下游一致性。
  - `New concepts:` 是否应恢复为 Spec-First 产品能力需要 owner 判断；本报告只确认当前 producer/consumer contract 不一致。

#### spec-optimize

- Tier: B
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-optimize/SKILL.md`
  - `skills/spec-optimize/README.md`
  - `skills/spec-optimize/evals/examples.json`
  - `skills/spec-optimize/references/optimize-spec-schema.yaml`
  - `skills/spec-optimize/references/experiment-log-schema.yaml`
  - `skills/spec-optimize/references/usage-guide.md`
  - `skills/spec-optimize/references/example-hard-spec.yaml`
  - `skills/spec-optimize/references/example-judge-spec.yaml`
  - `skills/spec-optimize/references/experiment-prompt-template.md`
  - `skills/spec-optimize/references/judge-prompt-template.md`
  - `skills/spec-optimize/references/agents/learnings-researcher.md`
  - `skills/spec-optimize/references/agents/repo-profiler.md`
  - `skills/spec-optimize/references/agents/repo-research-analyst.md`
  - `skills/spec-optimize/references/repo-profile-cache.md`
  - `skills/spec-optimize/scripts/experiment-worktree.sh`
  - `skills/spec-optimize/scripts/measure.sh`
  - `skills/spec-optimize/scripts/parallel-probe.sh`
  - `skills/spec-optimize/scripts/repo-profile-cache.py`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-optimize/` 下对应 CE 文件清单与 diff
  - `tests/unit/spec-optimize-contracts.test.js`
  - `tests/unit/high-risk-execution-contracts.test.js` 的 `spec-optimize` 相关段落
- CE parity: applicable。spec-first 版本保留 CE 的 metric-driven optimization loop、measurement scaffold、parallel/worktree experiment、judge evaluation、experiment log 和 resume 纪律，并增加 spec-first 治理增强:
  - `ce-optimize` -> `spec-optimize` identity projection，位于 `skills/spec-optimize/SKILL.md:2-4`
  - 新增 Workflow Contract Summary、Scenario Capability、Examples As Context、Admission/Budget Gate、Runtime Context Exclusion、Evidence Utilization Boundary 和 Dispatch/Backend Boundary，位于 `skills/spec-optimize/SKILL.md:11-119`
  - scratch path 从 `.context/compound-engineering/ce-optimize/<spec-name>/` 投影为 `.spec-first/workflows/spec-optimize/<spec-name>/`，位于 `skills/spec-optimize/SKILL.md:127`、`skills/spec-optimize/SKILL.md:168-175`、`skills/spec-optimize/SKILL.md:292` 和 `skills/spec-optimize/SKILL.md:319-322`
  - helper script invocation 明确使用 skill-local `SKILL_DIR` 绝对路径，位于 `skills/spec-optimize/SKILL.md:330-358`、`skills/spec-optimize/SKILL.md:399-412`、`skills/spec-optimize/SKILL.md:537-543` 和 `skills/spec-optimize/SKILL.md:575-579`
  - worktree helper 相对 CE 增加 `--copy-env` 显式 opt-in、secret deny、symlink/path traversal cleanup 保护和 `.env-copy.log` 审计，位于 `skills/spec-optimize/scripts/experiment-worktree.sh:133-199`、`skills/spec-optimize/scripts/experiment-worktree.sh:257-305`、`skills/spec-optimize/scripts/experiment-worktree.sh:307-353` 和 `skills/spec-optimize/scripts/experiment-worktree.sh:425-500`
  - 共享 `repo-profile-cache.py` 路径投影为 `/tmp/spec-first/repo-profile` 并包含 git quoted-path fix，位于 `skills/spec-optimize/scripts/repo-profile-cache.py:25-58` 和 `skills/spec-optimize/scripts/repo-profile-cache.py:184-292`，已由 Phase 1 `repo-profile-cache-parity.test.js` 覆盖
- 发现:
  1. medium — `skills/spec-optimize/SKILL.md:197-213`、`skills/spec-optimize/references/optimize-spec-schema.yaml:377-393`、`/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-optimize/SKILL.md:124-127`: CE baseline 要求按 `references/optimize-spec-schema.yaml` 的 `validation_rules` 全量校验，且明确不要依赖记忆中的子集；当前 `spec-optimize` 改为手写清单，漏掉至少 `parallel.exclusive_resources` 非空时应使用 serial、`metric.judge.singleton_sample > 0` 时必须提供 `singleton_rubric`、以及 `stopping` 至少使用默认或非默认 criterion 等 schema 规则。影响是 spec 文件可能绕过 source-of-truth schema 的条件规则，进入昂贵或语义失真的优化循环。建议修复方向: 恢复 CE 的“validate every rule in `validation_rules`”表述，或让手写清单逐项覆盖 `skills/spec-optimize/references/optimize-spec-schema.yaml:377-394` 并新增 contract test 锁定 `SKILL.md` 不得遗漏 schema 条件规则。
- 依赖关系验证结果:
  - `spec-work`、code review、benchmark/release reviewers 和 human consumers 是 summary 声明的 downstream consumers；该 skill 不被 `spec-lfg` 主链路直接调用。
  - `README.md` 是 spec-first 新增友好入口文档，引用的 `references/example-hard-spec.yaml`、`references/example-judge-spec.yaml`、`references/usage-guide.md`、`references/optimize-spec-schema.yaml` 和 `references/experiment-log-schema.yaml` 均存在。
  - `evals/examples.json` 仅在编辑/审查 workflow prompt 或 fresh-source eval 时作为 examples-as-context 使用，`skills/spec-optimize/SKILL.md:50-52` 明确不是普通运行时 deterministic router。
  - `repo-profile-cache.py`、`repo-profile-cache.md` 和 `references/agents/repo-profiler.md` 属于 9 份 byte-duplicated cache 资产，已由 Phase 1 parity test 覆盖。
- 上下文管理验证结果:
  - `SKILL.md` 共 760 行，高于方案建议的 500 行上下文预算，作为 advisory context signal 记录；它承载长时 optimization loop 的完整 state/persistence 纪律，后续若重构应优先把 Phase 细节下沉到 triggered references。
  - `Runtime Context Exclusion` 明确排除 generated mirrors 和 `.spec-first/audits/**`、`.spec-first/governance/**`，并把 `.spec-first/workflows/spec-optimize/**` 限定为 workflow local scratch，位于 `skills/spec-optimize/SKILL.md:107-109`。
  - Persistence Discipline 明确 experiment log 是 single source of truth，每个 checkpoint 都要 write-then-read verify，位于 `skills/spec-optimize/SKILL.md:123-183` 和 `skills/spec-optimize/SKILL.md:605-609`。
- 安全 / residual 检查:
  - 对 `skills/spec-optimize` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 命中 `measure.sh` 中 `bash -c "$COMMAND"`；人工审读确认该 command 来自用户批准的 optimization spec measurement harness，并被 admission gate、baseline approval 和 timeout 包裹，位于 `skills/spec-optimize/SKILL.md:91-105`、`skills/spec-optimize/SKILL.md:350-364` 和 `skills/spec-optimize/scripts/measure.sh:47-90`。
  - `experiment-worktree.sh` 中的 `rm -rf` 路径均在 realpath 和 `.worktrees` containment 检查后执行，相关保护由 `tests/unit/high-risk-execution-contracts.test.js:180-225` 覆盖。
  - `.env*` 默认不复制，只有 `--copy-env` opt-in 才复制，并写入不含 secret 内容的 `.env-copy.log`；由 `tests/unit/high-risk-execution-contracts.test.js:57-76` 和 `tests/unit/high-risk-execution-contracts.test.js:227-296` 覆盖。
  - shared files 必须是 exact repo-relative path，拒绝 secret-denied path、包含 secret-denied 子路径的目录和 symlink，位于 `skills/spec-optimize/scripts/experiment-worktree.sh:307-353`，并由 `tests/unit/high-risk-execution-contracts.test.js:96-178` 覆盖。
- 未检查 / degraded checks:
  - 未实际运行 optimization loop、measurement command、worktree creation 或 judge subagent；Tier B 审查聚焦迁移正确性、source 安全、contract 和上下文管理。
  - `parallel-probe.sh` 的 advisory JSON 仅做窄范围 heuristic，不作为 confirmed readiness；本报告未将其结果视为确定性并行安全证明。

#### spec-promote

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-promote/SKILL.md`
  - `skills/spec-promote/references/spiral-cli.md`
  - `skills/spec-mcp-setup/SKILL.md` 的 local config consumer 段落
  - `skills/spec-mcp-setup/references/config-template.yaml` 的 promotion helper 段落
  - `tests/unit/spec-migrated-standalone-skills-contracts.test.js`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-promote/SKILL.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-promote/references/spiral-cli.md`
  - `docs/validation/2026-07-08-ce-to-spec-first-reviewed-skills-parity-audit-report.md` 的 `spec-promote` 既有 finding
- CE parity: applicable。文件集合与 CE 一致，差异均为预期且已被当前 source/测试覆盖:
  - `ce-promote` -> `spec-promote` identity projection，位于 `skills/spec-promote/SKILL.md:2`、`skills/spec-promote/SKILL.md:8`、`skills/spec-promote/SKILL.md:14` 和 `skills/spec-promote/SKILL.md:20-24`
  - 旧 `/ce-promote` 示例投影为 `spec-promote`，位于 `skills/spec-promote/SKILL.md:131-139`
  - `references/spiral-cli.md` 中 `.compound-engineering/config.local.yaml` / `ce_promote_spiral_optout` 投影为 `.spec-first/config.local.yaml` / `spec_promote_spiral_optout`，位于 `skills/spec-promote/references/spiral-cli.md:24-32` 和 `skills/spec-promote/references/spiral-cli.md:63-72`
  - blocking question tool 列表收窄到 Claude Code 和 Codex，位于 `skills/spec-promote/references/spiral-cli.md:34-38`
  - 2026-07-08 parity audit 曾记录 `disable-model-invocation` 缺失风险；当前 `skills/spec-promote/SKILL.md:4` 已包含 `disable-model-invocation: true`，并由 `tests/unit/spec-migrated-standalone-skills-contracts.test.js:35-49` 锁定
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - `spec-promote` 只依赖 optional Spiral CLI；`skills/spec-promote/SKILL.md:14-16` 和 `skills/spec-promote/references/spiral-cli.md:1-18` 明确 missing/unauthed/erroring CLI 不阻断，直接走 direct drafting。
  - `spec_promote_spiral_optout` 被 `spec-promote` 读写，同时在 setup local config consumer list 中登记，位于 `skills/spec-mcp-setup/SKILL.md:109-116`。
  - config template 中存在注释示例，且文案强调只有 uncommented top-level key 才生效，位于 `skills/spec-mcp-setup/references/config-template.yaml:51-56` 和 `skills/spec-promote/references/spiral-cli.md:24-32`。
  - `tests/unit/mcp-setup-config-template-contracts.test.js` 对该 config key 和 active consumer 文案已有覆盖；本 skill 未声明其他 artifact contract 或 shared scripts。
- 上下文管理验证结果:
  - `SKILL.md` 共 139 行，低于方案建议的 500 行上下文预算。
  - `references/spiral-cli.md` 仅在 Phase 3 Spiral setup/ready path 时按需读取，位于 `skills/spec-promote/SKILL.md:70-84`。
  - 主流程明确 drafts-only，不发布、不提交、不开 PR，位于 `skills/spec-promote/SKILL.md:16` 和 `skills/spec-promote/SKILL.md:127-129`，避免把宣传 draft workflow 扩展为 mutation workflow。
- 安全 / residual 检查:
  - 对 `skills/spec-promote` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 命中的 `post` / `publish` 均处于禁止动作语境；该 skill 不含 `scripts/`，Phase 1 shell/Python 语法检查不适用。
  - Spiral login flow 明确 API key 不进入 agent chat，设备码/浏览器 approval 后由 server->CLI 交换 credential，位于 `skills/spec-promote/references/spiral-cli.md:38` 和 `skills/spec-promote/references/spiral-cli.md:51-55`。
  - opt-out 写入 `.spec-first/config.local.yaml` 时使用 local git exclude 而非修改 tracked `.gitignore`，位于 `skills/spec-promote/references/spiral-cli.md:63-72`；该写入是用户明确 declining 后的 local preference，不是 source 变更。
- 未检查 / degraded checks:
  - 未实际运行 `spiral`、login、draft generation 或 opt-out 写入；Tier B 审查聚焦迁移正确性、source contract、config key 和安全边界。

#### spec-proof

- Tier: B
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-proof/SKILL.md`
  - `skills/spec-proof/references/hitl-review.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-proof/SKILL.md`
  - `tests/unit/spec-proof-contracts.test.js`
  - `tests/unit/helper-skill-resolvability-contracts.test.js`
  - `src/cli/contracts/dual-host-governance/skills-governance.json` 的 `spec-proof` 记录
  - `docs/validation/2026-07-08-ce-to-spec-first-reviewed-skills-parity-audit-report.md` 的 `spec-proof` finding
  - `docs/validation/2026-06-19-ce-recent-diff-comparison.md` 的 Proof 产品边界决议
  - `skills/spec-brainstorm/references/handoff.md`
  - `skills/spec-ideate/references/post-ideation-workflow.md`
  - `skills/spec-plan/SKILL.md` 与 `skills/spec-plan/references/plan-handoff.md` 的 Proof handoff 命中
- CE parity: applicable。2026-07-08 parity audit 曾把 `spec-proof` 标为“主流程替换；需 owner 决策”，因为当时判断为 spec-first 以 HITL Review Mode 替代 CE 的 one-way Publish Mode。当前 source 已收敛该风险:
  - CE 的 primary use 是 one-way Publish Mode，本地 markdown 仍为 canonical，位于 `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-proof/SKILL.md:27-37`。
  - 当前 `spec-proof` 明确恢复 Publish Mode 为主能力，位于 `skills/spec-proof/SKILL.md:27-34`，并要求从 local source file 用 `jq --rawfile` 发布，位于 `skills/spec-proof/SKILL.md:330-379`。
  - HITL Review Mode 保留为 spec-first 增强，位于 `skills/spec-proof/SKILL.md:36-41` 和 `skills/spec-proof/references/hitl-review.md:1-393`；这与 `docs/validation/2026-06-19-ce-recent-diff-comparison.md:42-44`、`docs/validation/2026-06-19-ce-recent-diff-comparison.md:57-58`、`docs/validation/2026-06-19-ce-recent-diff-comparison.md:72` 的产品边界判断一致: 不直接删除 HITL sync loop，但 one-way publish 是当前 handoff 主路径。
  - Proof identity 已从 CE `ai:compound-engineering` / `Compound Engineering` 投影为 `ai:spec-first` / `Spec-First`，位于 `skills/spec-proof/SKILL.md:20-25`、`skills/spec-proof/references/hitl-review.md:19`，并由 `tests/unit/spec-proof-contracts.test.js:59-77` 覆盖。
- 发现: 无已确认问题。
- 依赖关系验证结果:
  - 下游 `spec-brainstorm`、`spec-ideate`、`spec-plan` 当前都将 Proof handoff 写为 “Publish to Proof” / shareable link / one-way local canonical 语义，分别位于 `skills/spec-brainstorm/references/handoff.md:58-59`、`skills/spec-brainstorm/references/handoff.md:109-125`、`skills/spec-ideate/references/post-ideation-workflow.md:90-108`、`skills/spec-plan/SKILL.md:773-790`、`skills/spec-plan/references/plan-handoff.md:48` 和 `skills/spec-plan/references/plan-handoff.md:87-96`。
  - `spec-proof` 在治理表中仍是 `internal_only`，位于 `src/cli/contracts/dual-host-governance/skills-governance.json:48-59`。这与 `skills/spec-proof/SKILL.md:40` 的说明一致: 用户明确命名 Proof 可以触发该 helper，但它不是公开 routable workflow menu item。
  - `tests/unit/helper-skill-resolvability-contracts.test.js:12-21` 把 `spec-proof` 标为 host-provided helper，覆盖当前 `Load the spec-proof skill` 委托不会被误判为 source/runtime 断裂。
  - `tests/unit/spec-proof-contracts.test.js:21-77` 覆盖 comment-filtered state read、batch comment mutations、窄 `/edit/v2` edit strategy、baseToken/idempotency 和 spec-first identity。
- 上下文管理验证结果:
  - `SKILL.md` 共 418 行，低于方案建议的 500 行上下文预算；`references/hitl-review.md` 共 393 行，仅在 HITL Review Mode 被请求时加载，位于 `skills/spec-proof/SKILL.md:38` 和 `skills/spec-proof/references/hitl-review.md:7`。
  - Publish Mode 不加载 HITL reference，按主文件的 Create and Share workflow 处理；HITL 的重流程下沉到 reference，符合 triggered-reference 纪律。
  - HITL reference 的返回 shape 包含 `status`、`localPath`、`localSynced`、`docUrl`、`openThreadCount`、`revision`，位于 `skills/spec-proof/references/hitl-review.md:21-29`，支持上游 caller 依据 `localSynced` 判断本地是否 stale。
- 安全 / residual 检查:
  - 对 `skills/spec-proof` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 的 `token` 命中均为 Proof share token / `baseToken` / `Idempotency-Key` 的 API 语境；未发现硬编码 secret、`rm -rf`、`sudo`、`chmod 777`、`curl | bash`、`eval`、`os.system`、`subprocess` 或 git force push。
  - Publish workflow 使用 `jq --rawfile` 从 local source file 构造 JSON，避免手写 placeholder 或 shell 插值破坏 markdown，位于 `skills/spec-proof/SKILL.md:336-339`。
  - Pull-to-local workflow 使用 `mktemp` 读取 state、`jq -jr` streaming 写入 sibling temp，再 `mv` 原子替换，位于 `skills/spec-proof/SKILL.md:395-407`；当 pull 是 side-effect 时要求确认，位于 `skills/spec-proof/SKILL.md:409`。
  - HITL end-sync 在内容未变化时跳过写入，在内容变化时先问用户是否同步，再写本地文件，位于 `skills/spec-proof/references/hitl-review.md:238-263` 和 `skills/spec-proof/references/hitl-review.md:265-274`。
- 未检查 / degraded checks:
  - 未实际调用 Proof Web API、Local Bridge、curl 网络请求或 blocking question tool；Tier B 审查聚焦 source 迁移、contract、下游 handoff 和安全边界。
  - `spec-proof` 的 host-provided runtime 可用性由宿主/插件生态承担；本轮只确认 source 委托有治理记录和测试覆盖，不声称当前本机 Proof 服务可达。

#### spec-resolve-pr-feedback

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-resolve-pr-feedback/SKILL.md`
  - `skills/spec-resolve-pr-feedback/references/evaluation-rubric.md`
  - `skills/spec-resolve-pr-feedback/references/full-mode.md`
  - `skills/spec-resolve-pr-feedback/references/targeted-mode.md`
  - `skills/spec-resolve-pr-feedback/references/agents/pr-comment-resolver.md`
  - `skills/spec-resolve-pr-feedback/scripts/get-pr-comments`
  - `skills/spec-resolve-pr-feedback/scripts/get-thread-for-comment`
  - `skills/spec-resolve-pr-feedback/scripts/reply-to-pr-thread`
  - `skills/spec-resolve-pr-feedback/scripts/resolve-pr-thread`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-resolve-pr-feedback/` 下全部对应 CE 文件
  - `tests/unit/spec-resolve-pr-feedback-contracts.test.js`
  - `tests/unit/spec-resolve-pr-feedback-pagination.test.js`
  - `tests/unit/spec-pr-comment-resolver-contracts.test.js`
  - `docs/validation/2026-07-08-ce-to-spec-first-reviewed-skills-parity-audit-report.md` 的 `spec-resolve-pr-feedback` finding
  - `docs/validation/2026-06-19-ce-recent-diff-comparison.md` 的 `resolve-pr-feedback` 产品边界判断
- CE parity: applicable。文件集合与 CE 一致，核心 CE contract 保留，并带有 spec-first 增强:
  - 入口与 helper path 通过 loaded skill directory 解析，位于 `skills/spec-resolve-pr-feedback/SKILL.md:31-38`、`skills/spec-resolve-pr-feedback/references/full-mode.md:12-17`、`skills/spec-resolve-pr-feedback/references/targeted-mode.md:20-25`。
  - Orchestrator-owned legitimacy gate 已恢复: 先读 `references/evaluation-rubric.md`，由 orchestrator 在全局上下文中判断 `fix-list` / `reply-list` / `human-list`，resolver 只执行已批准 fix，位于 `skills/spec-resolve-pr-feedback/SKILL.md:35`、`skills/spec-resolve-pr-feedback/references/evaluation-rubric.md:1-10`、`skills/spec-resolve-pr-feedback/references/full-mode.md:53-64` 和 `skills/spec-resolve-pr-feedback/references/targeted-mode.md:29-39`。
  - Mutating resolver dispatch boundary 明确保留在 main entrypoint，orchestrator owns combined validation、staging、commits、pushes、PR replies 和 thread resolution，位于 `skills/spec-resolve-pr-feedback/SKILL.md:41-46` 和 `skills/spec-resolve-pr-feedback/references/full-mode.md:69-123`。
  - 2026-07-08 parity audit 的结论为 “CE parity 加可保留增强”，位于 `docs/validation/2026-07-08-ce-to-spec-first-reviewed-skills-parity-audit-report.md:200-211`；当前 source 与该结论一致。
- 发现:
  1. medium — `tests/unit/spec-resolve-pr-feedback-contracts.test.js:63-66`、`tests/unit/spec-resolve-pr-feedback-contracts.test.js:79-99`、`tests/unit/spec-resolve-pr-feedback-contracts.test.js:184-194` vs `skills/spec-resolve-pr-feedback/references/full-mode.md:12-17`、`skills/spec-resolve-pr-feedback/references/full-mode.md:190-205`、`skills/spec-resolve-pr-feedback/references/full-mode.md:220-227`、`skills/spec-resolve-pr-feedback/references/targeted-mode.md:20-25`: source 已改为 `$SKILL_DIR/scripts/...` loaded-directory helper resolution，但 focused contract test 仍断言 `bash skills/spec-resolve-pr-feedback/scripts/...` 以及 adapter transform 后的 `.claude/skills/...` / `.agents/skills/...` 静态路径。实测 `npx jest tests/unit/spec-resolve-pr-feedback-contracts.test.js --runInBand` 3 个断言失败。影响是该 focused test 不能再证明当前 source 的真实 helper-resolution contract，且会在相关测试链路中阻塞。建议修复方向: 更新测试到 `$SKILL_DIR/scripts/...` contract，删除已不适用的 adapter path transform 断言，或如果 runtime projection 仍必须把 helper path 重写为 runtime root，则先明确 source/runtime contract 再修 source 与测试。
  2. medium — `tests/unit/spec-pr-comment-resolver-contracts.test.js:6-10`、`tests/unit/spec-pr-comment-resolver-contracts.test.js:21-24` vs `skills/spec-resolve-pr-feedback/references/agents/pr-comment-resolver.md:1-56`: resolver prompt asset 已迁移为 skill-local reference，但测试仍读取退役路径 `agents/spec-pr-comment-resolver.agent.md`。实测 `npx jest tests/unit/spec-resolve-pr-feedback-pagination.test.js tests/unit/spec-pr-comment-resolver-contracts.test.js --runInBand` 中 pagination suite pass，`spec-pr-comment-resolver-contracts.test.js` 因 `ENOENT` 2 个测试失败。影响是 skill-local resolver prompt 的 declined/default-to-fix contract 未被当前测试覆盖，旧 agent-path 测试成为 stale source-of-truth。建议修复方向: 将测试目标改为 `skills/spec-resolve-pr-feedback/references/agents/pr-comment-resolver.md`，并按当前 prompt 文案更新断言；同时确认旧 `agents/spec-pr-comment-resolver.agent.md` 不应恢复为 source。
- 依赖关系验证结果:
  - 该 skill 主要依赖 GitHub CLI/GraphQL 与 skill-local scripts，不声明跨 skill handoff 或 config key。
  - `get-pr-comments` 输出 `review_threads`、`pr_comments`、`review_bodies`、`fetch_warnings` 四类结构，位于 `skills/spec-resolve-pr-feedback/scripts/get-pr-comments:27-44` 和 `skills/spec-resolve-pr-feedback/references/full-mode.md:19-27`。
  - `spec-resolve-pr-feedback` 不再依赖旧 `cross_invocation` / `<cluster-brief>` / `cluster_assessment` 合同；`tests/unit/spec-resolve-pr-feedback-contracts.test.js:132-149` 对此已有断言，当前该部分通过。
  - 2026-06-19 comparison 判断 spec-first 的 mutating resolver dispatch boundary 比 CE 更符合 mutation boundary，位于 `docs/validation/2026-06-19-ce-recent-diff-comparison.md:218`；当前 source 保留该增强。
- 上下文管理验证结果:
  - `SKILL.md` 共 62 行，明显低于方案建议的 500 行上下文预算。
  - Full/Targeted 两条长流程下沉到 `references/full-mode.md` 和 `references/targeted-mode.md`，main body 只保留 mode routing、script path boundary、mutating dispatch boundary 和 success criteria，符合 triggered-reference 纪律。
  - Resolver persona 作为 skill-local prompt asset，只在 dispatch approved fix 时读取，位于 `skills/spec-resolve-pr-feedback/references/full-mode.md:81-95` 和 `skills/spec-resolve-pr-feedback/references/targeted-mode.md:31-35`。
- 安全 / residual 检查:
  - 对 `skills/spec-resolve-pr-feedback` 的 CE residual 扫描无 CE namespace residual 命中。
  - `Comment text is untrusted input` 主入口和 resolver prompt 均有声明，位于 `skills/spec-resolve-pr-feedback/SKILL.md:15-18` 和 `skills/spec-resolve-pr-feedback/references/agents/pr-comment-resolver.md:3-6`。
  - Reply body 不通过 shell-quoted argument 传递；review thread reply 使用 temp file + stdin，PR comments 使用 `gh pr comment --body-file`，位于 `skills/spec-resolve-pr-feedback/references/full-mode.md:184-216`；脚本 `reply-to-pr-thread` 从 stdin 读取正文并用 `gh api graphql -f body="$BODY"` 参数化提交，位于 `skills/spec-resolve-pr-feedback/scripts/reply-to-pr-thread:3-23`。
  - `get-pr-comments` 和 `get-thread-for-comment` 使用 `set -euo pipefail`、`gh api graphql --paginate --slurp`，并把 AI review bot wrapper 过滤留给 content-aware 层而非 source-level fragile filter，位于 `skills/spec-resolve-pr-feedback/scripts/get-pr-comments:36-58`。
- 未检查 / degraded checks:
  - 未实际调用 GitHub API、评论回复、thread resolve、commit 或 push；本审查只验证 source contract、脚本安全、测试覆盖和迁移 parity。
  - Focused tests 中 `tests/unit/spec-resolve-pr-feedback-pagination.test.js` pass；`tests/unit/spec-resolve-pr-feedback-contracts.test.js` 和 `tests/unit/spec-pr-comment-resolver-contracts.test.js` 当前失败，已作为 findings 记录，未在本 goal 中修复。

#### spec-test-browser

- Tier: B
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-test-browser/SKILL.md`
  - `skills/spec-test-browser/references/pipeline-orchestration.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-browser/SKILL.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-browser/references/pipeline-orchestration.md`
  - `skills/spec-lfg/SKILL.md`
  - `src/cli/contracts/dual-host-governance/skills-governance.json` 的 `spec-test-browser` 记录
  - `tests/unit/browser-helper-tool-contracts.test.js`
  - `docs/catalog/runtime-capabilities.md`
  - `docs/validation/2026-07-08-ce-to-spec-first-reviewed-skills-parity-audit-report.md` 的 `spec-test-browser` finding
- CE parity: applicable。文件集合与 CE 一致，且当前 source 已保留/增强大部分 browser helper 迁移合同:
  - `agent-browser` exclusive browser automation boundary 保留并投影到 Codex/Claude host 说明，位于 `skills/spec-test-browser/SKILL.md:11-19`；缺失时指向 `spec-mcp-setup` helper readiness，而不是旧 `/ce-setup`，位于 `skills/spec-test-browser/SKILL.md:35` 和 `skills/spec-test-browser/SKILL.md:49`。
  - `mode:pipeline` 不再只是调用方字符串；主文件要求读取 `references/pipeline-orchestration.md`，并声明默认 headless、跳过 headed/headless question、由 pipeline owns free-port/server startup，位于 `skills/spec-test-browser/SKILL.md:51-55`。
  - pipeline reference 要求一条 shell block 内完成 free-port scan + server startup，避免 shell 变量跨 tool call 丢失，位于 `skills/spec-test-browser/references/pipeline-orchestration.md:11-50`；日志路径已投影到 `/tmp/spec-test-browser-dev-server-${PORT}.log`，位于 `skills/spec-test-browser/references/pipeline-orchestration.md:31-45`。
  - 端口探测不默认 grep `AGENTS.md` / `CLAUDE.md`，位于 `skills/spec-test-browser/SKILL.md:107-115`，与 `skills/spec-polish/references/dev-server-detection.md:40` 一致。
- 发现:
  1. high — `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-browser/SKILL.md:167-195` vs `skills/spec-test-browser/SKILL.md:225-273`、`skills/spec-lfg/SKILL.md:68`: CE baseline 明确规定 pipeline mode 遇到 human verification 不暂停、记录 Skip 后继续，测试失败也不询问如何继续；当前 `spec-test-browser` 只在 headed/headless、free-port 和 dev-server startup 上定义 pipeline override，但 Human Verification 和 Handle Failures 仍要求 pause / ask user。影响是 `spec-lfg` 的 hands-off step 7 在 OAuth/email/payment/SMS/external API 或任意失败页面上仍可能阻塞，破坏 `mode:pipeline` 非交互 contract。建议修复方向: 在 `spec-test-browser` 主流程恢复 CE 的 pipeline 分支语义: external flows 记录 `Skip` + reason 后继续，failure path 截图/记录 repro/继续，不调用 blocking question tool；同时扩展 `tests/unit/browser-helper-tool-contracts.test.js` 锁定这两条 unattended 语义。
  2. low — `skills/spec-test-browser/SKILL.md:1-5` vs `src/cli/contracts/dual-host-governance/skills-governance.json:453-465`、`docs/catalog/runtime-capabilities.md:90-95`: governance 将 `spec-test-browser` 登记为 `internal_only` 且当前 runtime catalog 说明它是 governance-only internal record，但 source frontmatter 未显式 `user-invocable: false`。方案维度 10 要求 internal helper（含 `spec-test-browser`）应标注该字段；当前 runtime governance 可能避免用户面暴露，但 source-local frontmatter 与审查规则不一致，且缺少类似 `spec-worktree` 的 contract test。建议修复方向: 在 `skills/spec-test-browser/SKILL.md` frontmatter 增加 `user-invocable: false`，并补 focused contract test，避免未来 packaging 或 host discovery 误把它当普通用户入口。
- 依赖关系验证结果:
  - `spec-lfg` step 7 直接调用 `spec-test-browser mode:pipeline`，位于 `skills/spec-lfg/SKILL.md:68`；该调用方不传额外 pipeline token，因此本轮未发现 token mismatch，问题集中在被调用方 pipeline 行为不完整。
  - `spec-dogfood` 将 ordinary browser smoke tests 明确分给 delegated `spec-test-browser`，位于 `skills/spec-dogfood/SKILL.md:20`，职责边界清楚。
  - `tests/unit/browser-helper-tool-contracts.test.js:299-315` 覆盖 agent-browser exclusive boundary、pipeline reference 存在、instruction-file port grep 禁止和日志路径，但未覆盖 human verification / failure handling 的 pipeline no-ask contract。
  - 该 skill 不声明持久 artifact schema、local config key 或共享脚本；输出为 browser test summary、screenshots、failure repro steps。
- 上下文管理验证结果:
  - `SKILL.md` 共 356 行，低于方案建议的 500 行上下文预算。
  - 长的 unattended server orchestration 下沉到 `references/pipeline-orchestration.md`，仅在 `mode:pipeline` 时读取，位于 `skills/spec-test-browser/SKILL.md:53` 和 `skills/spec-test-browser/references/pipeline-orchestration.md:3`。
  - `agent-browser skills get core` 仅作为更深 upstream usage / troubleshooting guidance，位于 `skills/spec-test-browser/SKILL.md:37`；没有要求加载 deleted local `skills/agent-browser` source。
- 安全 / residual 检查:
  - 对 `skills/spec-test-browser` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 仅命中 `skills/spec-test-browser/SKILL.md:292` 的 `Requires payment credentials` 文案；这是测试摘要中的外部支付凭据说明，不是硬编码 secret。
  - pipeline/server snippets 写入 `/tmp/spec-test-browser-dev-server-${PORT}.log`，未使用 `rm -rf`、`sudo`、`chmod 777`、`curl | bash`、`eval`、`os.system`、`subprocess` 或 git force push。
- 未检查 / degraded checks:
  - 未实际启动 dev server 或运行 `agent-browser`；Tier B 审查聚焦 source 迁移正确性、pipeline contract、helper boundary 和安全扫描。
  - 未运行 `tests/unit/browser-helper-tool-contracts.test.js`；该 suite 的现有断言不覆盖本轮确认的 human verification / failure handling pipeline 缺口。

#### spec-worktree

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-worktree/SKILL.md`
  - `skills/spec-worktree/scripts/worktree-manager.sh`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-worktree/SKILL.md`
  - `tests/unit/spec-worktree-contracts.test.js`
  - `skills/spec-dogfood/SKILL.md`
  - `skills/spec-work/SKILL.md`
  - `src/cli/contracts/dual-host-governance/skills-governance.json` 的 `spec-worktree` 记录
  - `docs/validation/2026-07-08-ce-to-spec-first-reviewed-skills-parity-audit-report.md` 的 `spec-worktree` finding
- CE parity: applicable。当前 `spec-worktree` 是 intentional divergence / repaired helper，不是 CE 的最小投影；多数 divergence 已在 2026-07-08 parity audit 中记录为可保留增强:
  - CE baseline 是 prose-only fallback，强调 `detect existing isolation -> prefer native worktree tool -> fall back to plain git`，位于 `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-worktree/SKILL.md:8-17`、`/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-worktree/SKILL.md:39-56`。
  - 当前 source 改为 internal helper + deterministic script facts contract，frontmatter 明确 `user-invocable: false` 和窄 `allowed-tools`，位于 `skills/spec-worktree/SKILL.md:1-5`；governance 也登记为 `internal_only`，位于 `src/cli/contracts/dual-host-governance/skills-governance.json:33-44`。
  - `detect --json` 输出 `spec-worktree-detect.v1`，区分 `ordinary-checkout`、`linked-worktree`、`submodule` 和 `unknown`，位于 `skills/spec-worktree/SKILL.md:17-44` 和 `skills/spec-worktree/scripts/worktree-manager.sh:115-203`。
  - Runtime source path 通过 `${CLAUDE_SKILL_DIR}` + repo-root fallback wrapper 进入 `worktree-manager.sh`，位于 `skills/spec-worktree/SKILL.md:19-23` 和 `skills/spec-worktree/SKILL.md:48-52`；`tests/unit/spec-worktree-contracts.test.js:100-118` 和 `tests/unit/spec-worktree-contracts.test.js:510-545` 覆盖 source/runtime path rewrite 和 drift 检查。
  - Env copy 改为 `--copy-env` opt-in，默认不复制 `.env*`，audit log 不写 secret 内容，位于 `skills/spec-worktree/SKILL.md:70-75`、`skills/spec-worktree/scripts/worktree-manager.sh:322-390`，并由 `tests/unit/spec-worktree-contracts.test.js:120-146`、`tests/unit/spec-worktree-contracts.test.js:339-498` 覆盖。
- 发现:
  1. medium — `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-worktree/SKILL.md:12-17`、`/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-worktree/SKILL.md:51-56`、`skills/spec-dogfood/SKILL.md:87-89` vs `skills/spec-worktree/SKILL.md:46-68`、`skills/spec-worktree/scripts/worktree-manager.sh:216-220`、`skills/spec-worktree/scripts/worktree-manager.sh:464-525`: CE baseline 支持两种模式: new work 和 isolate existing ref；其中 existing ref 可 attach 现有 branch/tag/PR，并遵守“同一 branch 只能在一个 worktree checkout”的约束。当前 `spec-dogfood` 仍声明 `spec-worktree` 会隔离目标 PR / branch、attach target ref、处理 already-checked-out verdict；但 `spec-worktree` source 和脚本只实现 `create [--copy-env] <branch-name> [from-branch]`，且总是 `git worktree add -b "$branch_name" "$worktree_path" "$base_ref"` 新建分支。影响是 `spec-dogfood <PR>` 或不同 branch 的 isolation 选项没有被调用方承诺的实现路径，可能无法在不切换主 checkout 的情况下测试目标 ref，或错误地从目标 ref 新建另一个分支而不是 dogfood 原 PR/branch。建议修复方向: 二选一收敛合同：要么在 `spec-worktree` 脚本和 SKILL.md 中恢复 CE 的 existing-ref / PR attach 模式并补 already-checked-out 检测与 tests；要么修改 `spec-dogfood` 不再声称 delegated helper 支持 attach target ref，改由 dogfood 自己显式处理 PR/branch checkout fallback。
- 依赖关系验证结果:
  - `spec-work` 仍把 `spec-worktree` 作为 Option B，用于从默认分支创建新 worktree，位于 `skills/spec-work/SKILL.md:112-117`；这与当前 helper 能力匹配。
  - `spec-dogfood` 依赖 `spec-worktree` 隔离 PR/branch target ref，位于 `skills/spec-dogfood/SKILL.md:87-89`；这是本轮确认的跨 skill 合同漂移。
  - `tests/unit/spec-worktree-contracts.test.js:500-508` 断言 `spec-worktree` 是唯一 delivered agent-facing internal skill，未作为 public workflow/standalone skill 暴露。
  - `tests/unit/spec-worktree-contracts.test.js:510-545` 覆盖 Claude/Codex runtime delivery rewrite；本审查不修改 generated mirrors。
- 上下文管理验证结果:
  - `SKILL.md` 共 117 行，低于方案建议的 500 行上下文预算。
  - 重型确定性逻辑下沉到 `scripts/worktree-manager.sh`，由脚本输出 facts；SKILL.md 负责语义边界、调用 wrapper 和消费方指导，符合 “scripts prepare facts; LLM decides” 边界。
  - `detect --json` 的 non-zero path 仍输出 parseable reason_code，位于 `skills/spec-worktree/scripts/worktree-manager.sh:180-203`，避免 consumer 在 unknown state 下猜测。
- 安全 / residual 检查:
  - 对 `skills/spec-worktree` 的 CE residual 扫描无 CE namespace residual 命中。
  - 安全 grep 命中均在 tests fixture 的 `.env` secret 样例与 no-leak 断言中，位于 `tests/unit/spec-worktree-contracts.test.js:52`、`tests/unit/spec-worktree-contracts.test.js:342-344`、`tests/unit/spec-worktree-contracts.test.js:381-412`、`tests/unit/spec-worktree-contracts.test.js:439`、`tests/unit/spec-worktree-contracts.test.js:472`；source script 未硬编码 secrets。
  - `bash -n skills/spec-worktree/scripts/worktree-manager.sh` pass。
  - `npx jest tests/unit/spec-worktree-contracts.test.js --runInBand` pass，19 个测试通过。
  - `.gitignore` symlink、env destination symlink、env copy log symlink、separate git dir anchoring、linked-worktree refusal、submodule classification、runtime drift 等风险均有 focused tests 覆盖。
- 未检查 / degraded checks:
  - 未实际创建真实远端 PR worktree、未调用 GitHub PR checkout、未验证 harness-native `EnterWorktree` / `WorktreeCreate` primitive；当前 Codex 环境没有可确认的 native worktree primitive contract，且本轮默认只审查 source，不修复 helper。
  - `spec-worktree` 的 existing-ref / PR attach 缺口已作为 finding 记录，未在本 goal 中修复。

Batch 2 已完成；下一项 `spec-debug`。

### Batch 3

#### spec-debug

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-debug/SKILL.md`
  - `skills/spec-debug/references/agents/repo-profiler.md`
  - `skills/spec-debug/references/anti-patterns.md`
  - `skills/spec-debug/references/defense-in-depth.md`
  - `skills/spec-debug/references/investigation-techniques.md`
  - `skills/spec-debug/references/repo-profile-cache.md`
  - `skills/spec-debug/scripts/repo-profile-cache.py`
  - `skills/spec-debug/scripts/__pycache__/repo-profile-cache.cpython-312.pyc`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/` 下全部对应 CE 文件
  - `docs/validation/2026-07-08-ce-to-spec-first-skill-review-plan.md` 的 `ce-debug` -> `spec-debug` 裁决记录
  - `tests/unit/repo-profile-cache-parity.test.js`
- CE parity: applicable。当前工作树中的 `skills/spec-debug/SKILL.md` 处于 modified 状态，本轮按当前 source truth 审查。文件集合与 CE 基线基本一致；差异均为预期或已审查的 spec-first 修正:
  - frontmatter name 从 `ce-debug` 投影为 `spec-debug`，位于 `skills/spec-debug/SKILL.md:1-5`。
  - Phase 2 blocking question tool 从 Antigravity / Pi / CE host 扩展收敛为 Claude Code 与 Codex，位于 `skills/spec-debug/SKILL.md:173`；这与当前 host 边界一致。
  - 设计重想、post-fix simplify/review/commit/compound 路由从 `/ce-*` 投影为 `spec-*`，位于 `skills/spec-debug/SKILL.md:177-179`、`skills/spec-debug/SKILL.md:195-198`、`skills/spec-debug/SKILL.md:212`、`skills/spec-debug/SKILL.md:266-270`、`skills/spec-debug/SKILL.md:285-309`。
  - repo-profile cache path 从 `/tmp/compound-engineering/repo-profile` 投影为 `/tmp/spec-first/repo-profile`，位于 `skills/spec-debug/references/repo-profile-cache.md:25-29` 和 `skills/spec-debug/scripts/repo-profile-cache.py:25-58`。
  - `repo-profile-cache.py` 保留 deterministic get/put 边界，并带有当前共享脚本的 git quoted-path fix，位于 `skills/spec-debug/scripts/repo-profile-cache.py:177-221`；`npx jest tests/unit/repo-profile-cache-parity.test.js --runInBand` 通过。
  - trivial-bug fast-path 已从 CE 的“跳到 Phase 4 summary”修正为“只跳过 Phase 3 test-first ceremony，仍完整 hand off through Phase 4”，位于 `skills/spec-debug/SKILL.md:46`；该修正避免 skill-created branch 上的一行修复停留在未提交状态。
- 发现:
  1. low — `skills/spec-debug/scripts/__pycache__/repo-profile-cache.cpython-312.pyc`、`.gitignore:50`: `spec-debug` source skill 目录中存在 Python bytecode 产物，`diff -qr /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug skills/spec-debug` 显示 `Only in skills/spec-debug/scripts: __pycache__`；`git status --ignored --short -- skills/spec-debug/scripts/__pycache__/repo-profile-cache.cpython-312.pyc` 显示 `!! skills/spec-debug/scripts/__pycache__/`，`git ls-files` 无输出，说明它被忽略且未被 git 跟踪。影响是普通 source inventory / 人工 parity 审查会看到 generated artifact，增加误判和打包卫生风险；当前不构成 tracked source regression。建议修复方向: 清理本地 `skills/spec-debug/scripts/__pycache__/`，并在后续全局检查中确认其他 source skill 目录没有同类 ignored bytecode 产物。
- 依赖关系验证结果:
  - `spec-debug` 的 downstream 路由指向 inventory 中存在的 `spec-brainstorm`、`spec-simplify-code`、`spec-code-review`、`spec-commit-push-pr`、`spec-commit` 和 `spec-compound`。
  - Debug post-fix tail 明确把 review scope 限定为 skill-created branch、`base:<pre-fix-HEAD>` 或 fix-owned files，位于 `skills/spec-debug/SKILL.md:266-270`；这与方案中 debug -> code-review 的 fix-scope 传递关注点一致。
  - `spec-debug` 不声明持久 artifact schema 或 config key；主要输出为 Debug Summary、Post-Fix Quality block、PR/commit handoff 和可选 learning capture。
  - 共享 `repo-profile-cache.py`、`repo-profile-cache.md`、`references/agents/repo-profiler.md` 已由 `repo-profile-cache-parity.test.js` 覆盖 9 处 byte-identical parity。
- 上下文管理验证结果:
  - `SKILL.md` 共 309 行，低于方案建议的 500 行上下文预算。
  - 重型调查技巧、anti-patterns、defense-in-depth 和 repo-profile protocol 均下沉到 `references/`，由 Phase trigger 按需读取。
  - repo-profile cache 明确不缓存 `docs/solutions/` 枚举、subdirectory-scoped instruction files 和 question-specific grounding，位于 `skills/spec-debug/references/repo-profile-cache.md:17-23`，保留 advisory cache 边界。
- 安全 / residual 检查:
  - 对 `skills/spec-debug` 的 CE residual 扫描无 active CE namespace residual 命中: `rg -n "\bce-|compound-engineering|\.compound-engineering|ce-unified-plan|/tmp/compound-engineering|agy|ask_question|ask_user|pi-ask-user" skills/spec-debug` 无输出。
  - 安全 grep 命中 `repo-profile-cache.py` 中的 `subprocess`；人工审读确认只使用固定 argv `git` 调用且无 `shell=True`，位于 `skills/spec-debug/scripts/repo-profile-cache.py:224-234` 和 `skills/spec-debug/scripts/repo-profile-cache.py:245-292`。
  - cache 读取会拒绝非当前用户拥有的 `/tmp` cache 文件，位于 `skills/spec-debug/scripts/repo-profile-cache.py:335-345`；写入使用 `tempfile.mkstemp` + `os.replace` 原子替换，位于 `skills/spec-debug/scripts/repo-profile-cache.py:415-438`。
  - `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-debug/scripts/repo-profile-cache.py` pass。
- 未检查 / degraded checks:
  - 未运行真实 debug workflow、issue tracker fetch、browser reproduction、commit 或 PR；本审查只验证 source contract、迁移 parity、共享脚本和安全边界。
  - 当前没有 focused `tests/unit/spec-debug-contracts.test.js`；历史方案记录该旧增强测试已删除，本轮没有把缺少专属测试作为单独 finding，留到 Phase 3 测试覆盖缺口全局分析。

#### spec-compound

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-compound/SKILL.md`
  - `skills/spec-compound/assets/resolution-template.md`
  - `skills/spec-compound/references/agents/best-practices-researcher.md`
  - `skills/spec-compound/references/agents/data-integrity-guardian.md`
  - `skills/spec-compound/references/agents/framework-docs-researcher.md`
  - `skills/spec-compound/references/agents/pattern-recognition-specialist.md`
  - `skills/spec-compound/references/agents/performance-oracle.md`
  - `skills/spec-compound/references/agents/repo-profiler.md`
  - `skills/spec-compound/references/agents/security-sentinel.md`
  - `skills/spec-compound/references/agents/session-historian.md`
  - `skills/spec-compound/references/concepts-vocabulary.md`
  - `skills/spec-compound/references/grounding-validation.md`
  - `skills/spec-compound/references/repo-profile-cache.md`
  - `skills/spec-compound/references/schema.yaml`
  - `skills/spec-compound/references/yaml-schema.md`
  - `skills/spec-compound/scripts/repo-profile-cache.py`
  - `skills/spec-compound/scripts/session-history/discover-sessions.sh`
  - `skills/spec-compound/scripts/session-history/extract-errors.py`
  - `skills/spec-compound/scripts/session-history/extract-metadata.py`
  - `skills/spec-compound/scripts/session-history/extract-skeleton.py`
  - `skills/spec-compound/scripts/validate-doc-claims.py`
  - `skills/spec-compound/scripts/validate-frontmatter.py`
  - `skills/spec-compound/scripts/session-history/__pycache__/extract-skeleton.cpython-312.pyc`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/` 下对应 CE 文件集合与 diff
  - `tests/unit/spec-compound-contracts.test.js`
  - `tests/unit/frontmatter-validator.test.js`
  - `tests/unit/migrated-skill-scripts-contracts.test.js`
  - `tests/unit/repo-profile-cache-parity.test.js`
- CE parity: applicable。文件集合与 CE 基线基本一致；差异主要是预期 spec-first 投影或当前已知增强:
  - frontmatter、usage、下游 workflow 从 `ce-compound` / `ce-*` 投影为 `spec-compound` / `spec-*`，位于 `skills/spec-compound/SKILL.md:1-24`、`skills/spec-compound/SKILL.md:399-446`、`skills/spec-compound/SKILL.md:755-758`。
  - scratch path 从 `/tmp/compound-engineering/ce-compound` 投影为 `/tmp/spec-first/spec-compound/<run-id>/`，Phase 1 artifact contract 位于 `skills/spec-compound/SKILL.md:102-112` 和 `skills/spec-compound/SKILL.md:139-168`。
  - session history enrichment 从旧 CE session wording 投影为 skill-local `scripts/session-history/`，并支持 Claude/Codex/Cursor/Pi transcript discovery/extraction，位于 `skills/spec-compound/SKILL.md:246-308`、`skills/spec-compound/scripts/session-history/discover-sessions.sh:1-130`、`skills/spec-compound/scripts/session-history/extract-metadata.py:395-432`、`skills/spec-compound/scripts/session-history/extract-skeleton.py:515-575`。
  - validator、repo-profile cache 和 prompt assets 通过 `$SKILL_DIR` / skill-local reference 定位，位于 `skills/spec-compound/SKILL.md:53-67`、`skills/spec-compound/SKILL.md:337-356`、`skills/spec-compound/SKILL.md:490-506`。
  - `references/schema.yaml` 与 CE 仅注释投影不同；`references/yaml-schema.md` 将脚注改为 root `AGENTS.md`，与当前 source/runtime 边界一致。
  - `diff -qr /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound skills/spec-compound` 的非预期额外项是本地 ignored `scripts/session-history/__pycache__`。
- 发现:
  1. medium — `skills/spec-compound/scripts/validate-frontmatter.py:54-55`、`skills/spec-compound-refresh/scripts/validate-frontmatter.py:54-55`、`tests/unit/frontmatter-validator.test.js:104-125`: validator 用 `open(doc_path)` 读取 frontmatter，未显式 `encoding='utf-8'`。在 `LC_ALL=C`、`LANG=C`、`PYTHONUTF8=0`、`PYTHONCOERCECLOCALE=0` 下，包含中文标题的合法 frontmatter 触发 `UnicodeDecodeError`，实测 `npx jest tests/unit/spec-compound-contracts.test.js tests/unit/frontmatter-validator.test.js tests/unit/migrated-skill-scripts-contracts.test.js tests/unit/repo-profile-cache-parity.test.js --runInBand` 中 `frontmatter-validator.test.js` 2 个 UTF-8 用例失败。影响是中文 docs/solutions 文档在非 UTF-8 locale 环境下无法通过 parser-safety validator，直接违反当前仓库中文文档输出要求。建议修复方向: 在 `spec-compound` 与 `spec-compound-refresh` 两份 `validate-frontmatter.py` 中使用 `open(doc_path, encoding='utf-8')`，并保留现有 cross-copy parity test。
  2. medium — `skills/spec-compound/assets/resolution-template.md:55-58` vs `skills/spec-compound/references/schema.yaml:25-35`、`skills/spec-compound/references/yaml-schema.md:16-19`、`skills/spec-compound/SKILL.md:600-608`: Knowledge Track Template 的 “Use for” 只列出 `best_practice`、`documentation_gap`、`workflow_issue`、`developer_experience`，遗漏当前 schema 和 SKILL.md 已支持的 `architecture_pattern`、`design_pattern`、`tooling_decision`、`convention`。CE 模板也存在同样遗漏，因此不是迁移投影 regression，但当前 spec-first artifact template 与 schema/source guide 不一致。影响是用模板新建 durable learning 时会弱化较窄 category 的可发现性，诱导作者回退到 `best_practice`。建议修复方向: 同步更新 template 的 Knowledge Track “Use for” 列表，并考虑补 focused contract test 锁定 template 与 `schema.yaml` knowledge enums 一致。
  3. low — `skills/spec-compound/scripts/session-history/__pycache__/extract-skeleton.cpython-312.pyc`、`.gitignore:50`: `spec-compound` source skill 目录中存在 Python bytecode 产物；`git status --ignored --short -- skills/spec-compound/scripts/session-history/__pycache__/extract-skeleton.cpython-312.pyc` 显示 `!! skills/spec-compound/scripts/session-history/__pycache__/`，`git ls-files` 无输出，`git check-ignore -v` 指向 `.gitignore:50:__pycache__/`。影响是普通 source inventory / parity diff 会看到 generated artifact，增加人工审查噪音；当前未被 git 跟踪。建议修复方向: 清理本地 `skills/spec-compound/scripts/session-history/__pycache__/`，并在全局 hygiene sweep 中统一检查 source skill 目录内 ignored bytecode。
- 依赖关系验证结果:
  - `spec-compound` 下游 lifecycle handoff 指向存在的 `spec-compound-refresh`，CONCEPTS bootstrap redirect 与 selective refresh 位于 `skills/spec-compound/SKILL.md:30` 和 `skills/spec-compound/SKILL.md:399-446`。
  - Debug/review/work 等上游可把 post-fix learning 交给 `spec-compound`；本轮未发现 active CE route residual，`rg -n "\bce-|/ce-|compound-engineering|\.compound-engineering|ce-unified-plan|/tmp/compound-engineering|CLAUDE_SKILL_DIR|agy|ask_question|ask_user|pi-ask-user|ce-sessions|ce-session" skills/spec-compound` 无输出。
  - Knowledge lifecycle schema 的完整一致性仍留到 Phase 3 全局交叉验证；本轮已确认 `spec-compound` 本地 `schema.yaml` / `yaml-schema.md` / SKILL.md category guidance 内部一致，template 例外已作为 finding 记录。
  - 共享 `repo-profile-cache.py`、`repo-profile-cache.md`、`references/agents/repo-profiler.md` 已由 `npx jest tests/unit/repo-profile-cache-parity.test.js --runInBand` 覆盖 9 处 byte-identical parity。
- 上下文管理验证结果:
  - `SKILL.md` 共 758 行，超过方案建议的 500 行 advisory budget；本轮没有把行数本身作为问题，因为 workflow phase、artifact contract、session-history、grounding validation 和 success output 均有明确执行价值。
  - Full mode 中 session-history、repo-profile cache、grounding validation、optional enhancement 都按 phase trigger 读取；agent prompt assets 位于 `references/agents/`，不暴露为 standalone skills。
  - `best-practices-researcher.md` 中对 `.claude/skills`、`.codex/skills`、`.agents/skills` 的 runtime lookup 是目标项目可用 skill inventory 调研语境，不是把 generated runtime mirror 当 source 修复；保留为已分类 context-exclusion advisory hit。
  - repo-profile cache 明确不缓存 `docs/solutions/` 枚举、subdirectory instruction files 或 question-specific grounding，位于 `skills/spec-compound/references/repo-profile-cache.md:17-23`，符合 advisory cache 边界。
- 安全 / residual 检查:
  - `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-compound/scripts/repo-profile-cache.py skills/spec-compound/scripts/validate-doc-claims.py skills/spec-compound/scripts/validate-frontmatter.py skills/spec-compound/scripts/session-history/extract-errors.py skills/spec-compound/scripts/session-history/extract-metadata.py skills/spec-compound/scripts/session-history/extract-skeleton.py` pass。
  - `bash -n skills/spec-compound/scripts/session-history/discover-sessions.sh` pass。
  - `npx jest tests/unit/spec-compound-contracts.test.js tests/unit/migrated-skill-scripts-contracts.test.js tests/unit/repo-profile-cache-parity.test.js --runInBand` 对应 suites pass；同一次聚焦命令中的 `tests/unit/frontmatter-validator.test.js` 失败，已作为中文 frontmatter locale finding 记录。
  - 安全 grep 命中已人工分类: `repo-profile-cache.py` 和 `validate-doc-claims.py` 使用固定 argv `git` / subprocess、无 `shell=True`; `session-historian.md` 明确会话可能含 credential 但只提取技术内容；`security-sentinel.md` 的 secret 文案属于安全审查 persona; `yaml-schema.md` 的 `sudo dscacheutil...` 是文档示例。
- 未检查 / degraded checks:
  - 未实际运行完整 `spec-compound` workflow、未写入 `docs/solutions/`、未执行 helper agent dispatch 或 web research；本审查只验证 source contract、CE parity、脚本安全和 focused tests。
  - 未清理 ignored `__pycache__`，也未修复 validator/template source；本 goal 默认记录审查发现，不直接修 source。

#### spec-compound-refresh

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-compound-refresh/SKILL.md`
  - `skills/spec-compound-refresh/assets/resolution-template.md`
  - `skills/spec-compound-refresh/references/concepts-vocabulary.md`
  - `skills/spec-compound-refresh/references/per-action-flows.md`
  - `skills/spec-compound-refresh/references/schema.yaml`
  - `skills/spec-compound-refresh/references/yaml-schema.md`
  - `skills/spec-compound-refresh/scripts/validate-doc-claims.py`
  - `skills/spec-compound-refresh/scripts/validate-frontmatter.py`
  - `skills/spec-compound-refresh/scripts/__pycache__/validate-doc-claims.cpython-312.pyc`
  - `skills/spec-compound-refresh/scripts/__pycache__/validate-frontmatter.cpython-312.pyc`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound-refresh/` 下对应 CE 文件集合与 diff
  - `tests/unit/spec-compound-contracts.test.js`
  - `tests/unit/frontmatter-validator.test.js`
  - `tests/unit/migrated-skill-scripts-contracts.test.js`
  - `tests/unit/knowledge-harness-contracts.test.js`
- CE parity: applicable。当前 `spec-compound-refresh` 是 CE `ce-compound-refresh` 的投影版本，核心 lifecycle contract 保留:
  - 入口 identity、headless mode、CONCEPTS bootstrap disambiguation、Claude/Codex blocking question tool 收敛位于 `skills/spec-compound-refresh/SKILL.md:1-44`。
  - Keep / Update / Consolidate / Replace / Delete 五类维护模型保留，位于 `skills/spec-compound-refresh/SKILL.md:68-96`、`skills/spec-compound-refresh/SKILL.md:296-390`、`skills/spec-compound-refresh/references/per-action-flows.md:5-100`。
  - Phase 1.75 document-set analysis、overlap / supersession / canonical doc 选择和 retrieval-value test 保留，位于 `skills/spec-compound-refresh/SKILL.md:213-270`。
  - Replace flow 继续要求把 `references/schema.yaml`、`references/yaml-schema.md`、`assets/resolution-template.md` 传给 replacement subagent，并运行 bundled validators，位于 `skills/spec-compound-refresh/references/per-action-flows.md:47-84`。
  - Vocabulary capture 与 discoverability check 保留，位于 `skills/spec-compound-refresh/SKILL.md:499-522` 和 `skills/spec-compound-refresh/SKILL.md:637-679`。
  - `schema.yaml` 与 `spec-compound` 完全一致；`validate-doc-claims.py` 和 `validate-frontmatter.py` 与 `spec-compound` 完全一致。
- 发现:
  1. medium — `skills/spec-compound-refresh/scripts/validate-frontmatter.py:54-55`、`tests/unit/frontmatter-validator.test.js:104-125`: 与 `spec-compound` 同一跨 skill 问题，validator 用默认 locale 打开 Markdown，中文 frontmatter 在非 UTF-8 locale 下失败。本问题已在 `spec-compound` 小节计入一次 medium；本处不重复计数。建议修复方向同上: 两份 validator 都改为 `open(doc_path, encoding='utf-8')`，保留副本一致性测试。
  2. medium — `skills/spec-compound-refresh/assets/resolution-template.md:55-58` vs `skills/spec-compound-refresh/references/schema.yaml:25-35`、`skills/spec-compound-refresh/references/yaml-schema.md:16-19`: 与 `spec-compound` 同一跨 skill 问题，Knowledge Track Template 漏列 `architecture_pattern`、`design_pattern`、`tooling_decision`、`convention`。本问题已在 `spec-compound` 小节计入一次 medium；本处不重复计数。建议修复方向同上: 同步更新两份 template，并用 schema enum 一致性测试锁住。
  3. low — `skills/spec-compound-refresh/references/yaml-schema.md:116-118`、`tests/unit/spec-compound-contracts.test.js:418-427`: refresh 的 YAML safety reference 仍写 “see plugin `AGENTS.md`”，而 `spec-compound/references/yaml-schema.md` 对应文案已投影为 “see root `AGENTS.md`”。当前 focused test 甚至显式允许 `compoundYamlSchema.replace('see root', 'see plugin')`，说明测试把 legacy plugin wording 固化为例外。影响是 spec-first source 文档中继续暴露旧产品/插件口径，削弱 root instruction source-of-truth 表达；不影响 runtime 执行。建议修复方向: 将 refresh 文案改为 root `AGENTS.md`，同步更新 `tests/unit/spec-compound-contracts.test.js` 中的例外断言，让 compound 与 refresh YAML schema 文案真正一致。
  4. low — `skills/spec-compound-refresh/scripts/__pycache__/validate-doc-claims.cpython-312.pyc`、`skills/spec-compound-refresh/scripts/__pycache__/validate-frontmatter.cpython-312.pyc`、`.gitignore:50`: source skill 目录中存在两份 Python bytecode 产物；`git status --ignored --short` 显示 `!! skills/spec-compound-refresh/scripts/__pycache__/`，`git ls-files` 无输出，`git check-ignore -v` 指向 `.gitignore:50:__pycache__/`。影响是人工 source inventory / parity diff 噪音；当前未被 git 跟踪。建议修复方向: 清理本地 `skills/spec-compound-refresh/scripts/__pycache__/`，并在全局 hygiene sweep 中统一检查 source skill 目录内 ignored bytecode。
- 依赖关系验证结果:
  - 与 `spec-compound` 的 lifecycle contract 连接存在: `spec-compound` 将 repo-wide concept bootstrap redirect 和 selective refresh 交给 `spec-compound-refresh`，refresh 自身也在 Replace insufficient evidence 时建议后续 `spec-compound`，位于 `skills/spec-compound-refresh/SKILL.md:31-36` 和 `skills/spec-compound-refresh/SKILL.md:628-633`。
  - `spec-compound-refresh` 不引入 structured promotion gate 或新 schema 字段；`npx jest tests/unit/knowledge-harness-contracts.test.js --runInBand` pass，确认 structured promotion contract 仍由 `docs/contracts/knowledge/knowledge-harness.md` 拥有，refresh 复用 CE-aligned documentation contracts。
  - `npx jest tests/unit/spec-compound-contracts.test.js --runInBand` pass，覆盖 per-action reference 下沉、validator degraded mode、template/support files 与 CE-first schema contract。
  - 对 `skills/spec-compound-refresh` 的 CE residual 扫描无 active CE namespace residual 命中。
- 上下文管理验证结果:
  - `SKILL.md` 共 679 行，超过方案建议的 500 行 advisory budget；本轮没有把行数本身作为问题，因为 refresh lifecycle、document-set analysis、CONCEPTS capture、discoverability 和 commit flow 都是该 workflow 的核心语义。
  - Phase 4 具体 Keep/Update/Consolidate/Replace/Delete flow 下沉到 `references/per-action-flows.md`，`tests/unit/spec-compound-contracts.test.js:260-281` 锁定 main skill 不内联 per-action flow。
  - Replacement subagent 被限制为单个 successor learning，并由 orchestrator 处理删除和 metadata updates，位于 `skills/spec-compound-refresh/SKILL.md:289-294`，符合 mutation ownership 边界。
- 安全 / residual 检查:
  - `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-compound-refresh/scripts/validate-doc-claims.py skills/spec-compound-refresh/scripts/validate-frontmatter.py` pass。
  - 安全 grep 命中 `validate-doc-claims.py` 的 `subprocess`；人工审读确认只通过固定 argv 调用 `git`，无 `shell=True`。`yaml-schema.md` 中的 `sudo dscacheutil...` 是 YAML safety 示例，不是执行指令。
  - `npx jest tests/unit/spec-compound-contracts.test.js tests/unit/migrated-skill-scripts-contracts.test.js --runInBand` pass；同批包含 `tests/unit/frontmatter-validator.test.js` 时，该 suite 因中文 UTF-8 locale 问题失败，已作为跨 skill finding 记录。
- 未检查 / degraded checks:
  - 未运行真实 `spec-compound-refresh` workflow、未扫描或修改 `docs/solutions/`、未执行 replacement subagent、未提交或打开 PR；本审查只验证 source contract、CE parity、脚本语法、安全边界和 focused tests。
  - 未清理 ignored `__pycache__`，也未修复 validator/template/yaml-schema source；本 goal 默认记录审查发现，不直接修 source。

#### spec-sweep

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-sweep/SKILL.md`
  - `skills/spec-sweep/references/agents/media-analyzer.md`
  - `skills/spec-sweep/references/interview.md`
  - `skills/spec-sweep/references/model-tiers.md`
  - `skills/spec-sweep/references/plan-template.md`
  - `skills/spec-sweep/references/sources/email.md`
  - `skills/spec-sweep/references/sources/github-issues.md`
  - `skills/spec-sweep/references/sources/slack.md`
  - `skills/spec-sweep/references/state-schema.md`
  - `skills/spec-sweep/references/subagent-template.md`
  - `skills/spec-sweep/scripts/analyze_riffrec_zip.py`
  - `skills/spec-sweep/scripts/sweep-state.py`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/` 下对应 CE 文件集合与 diff
  - `tests/unit/spec-sweep-lfg-migration-contracts.test.js`
  - `tests/unit/mcp-setup-config-template-contracts.test.js`
  - `tests/unit/migrated-skill-scripts-contracts.test.js`
- CE parity: applicable。当前 `spec-sweep` 是 CE `ce-sweep` 的 repaired/replaced 投影，核心能力保留且 divergence 有明确 spec-first 理由:
  - 入口 identity、`.spec-first/config.local.yaml`、`docs/plans/feedback-sweep-plan.md` 和 `spec-lfg` handoff 已投影为 spec-first，位于 `skills/spec-sweep/SKILL.md:1-5`、`skills/spec-sweep/SKILL.md:52-61`、`skills/spec-sweep/SKILL.md:134-153`。
  - 状态写入集中到 bundled engine，`SKILL.md` 明确 `scripts/sweep-state.py` 是 sweep state 的唯一 writer，位于 `skills/spec-sweep/SKILL.md:19`；schema 也要求所有 peer agent 只能通过 engine subcommands mutation，位于 `skills/spec-sweep/references/state-schema.md:3-7`。
  - `mode:headless` no-prompt / defer 语义保留，位于 `skills/spec-sweep/SKILL.md:29-36`，first-run setup 明确 interactive-only，位于 `skills/spec-sweep/references/interview.md:3-10`。
  - Ack correctness core 保留 write -> read-back -> state upsert -> cursor advance 的顺序，位于 `skills/spec-sweep/SKILL.md:107-116`；`cursor-advance` 会拒绝未 upsert item 和 cursor regression，位于 `skills/spec-sweep/scripts/sweep-state.py:475-490`。
  - Fix verification 对 untrusted fix ref 先做形状校验，只接受 PR number 或 commit SHA，再进入 `gh` / `git` 命令，位于 `skills/spec-sweep/SKILL.md:125-131`。
  - Plan reconciliation 只写 `docs/plans/feedback-sweep-plan.md` 的 machine-owned region，并保护 Human Notes，位于 `skills/spec-sweep/SKILL.md:134-140` 和 `skills/spec-sweep/references/plan-template.md:57-63`。
  - Media analyzer subagent 被限制为单个 scratch artifact 写入，不编辑项目、不切分支、不 commit/push/PR，位于 `skills/spec-sweep/references/subagent-template.md:35-47` 和 `skills/spec-sweep/references/agents/media-analyzer.md:50-53`。
  - Source connectors 均为 facts-only persona: Slack 只允许 configured reaction-add，GitHub 只允许 configured label-add，Email read-only / precondition-gated，分别位于 `skills/spec-sweep/references/sources/slack.md:57-61`、`skills/spec-sweep/references/sources/github-issues.md:55-59`、`skills/spec-sweep/references/sources/email.md:54-57`。
- 发现:
  1. low — `skills/spec-sweep/references/interview.md:145-150` vs `skills/spec-sweep/SKILL.md:55`、`skills/spec-sweep/references/interview.md:180-190`、`skills/spec-mcp-setup/references/config-template.yaml:27-30`、`tests/unit/mcp-setup-config-template-contracts.test.js:129-135`: first-run interview 的 “Write these keys” 清单只列出 `feedback_sources`、`sweep_state_path`、`sweep_ack_cap`、`sweep_shared_branch`，漏列同一文件 config example 和 notes 都声明会写入的 `sweep_lease_ttl_minutes`。影响是按步骤实现 setup 的 agent 可能不把 lease TTL 写入 `.spec-first/config.local.yaml`，尽管运行时会按 `SKILL.md:55` fallback 到默认 `60`，因此不阻断 sweep。建议修复方向: 在 section 8 的写入清单加入 `sweep_lease_ttl_minutes`，并补 focused test 锁定 interview 写入清单与 config template 的 sweep keys 一致。
- pending_global_cross_check:
  - `skills/spec-sweep/scripts/analyze_riffrec_zip.py` 与 `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py` 只有两处 durable output wording 差异: `spec-sweep` 写 `docs/plans/` / durable unified plan，`spec-riffrec-feedback-analysis` 写 `docs/brainstorms/` / durable requirements document。当前 `spec-sweep` 自身 handoff 依赖 `spec-brainstorm` 后续产出 unified plan，并由 `tests/unit/spec-sweep-lfg-migration-contracts.test.js:122-130` 覆盖；是否应统一共享 analyzer 文案留到 Phase 3 共享脚本 divergence 统一裁决。
- 依赖关系验证结果:
  - `spec-sweep` 读取的 config keys 与 `spec-mcp-setup` config template 基本对齐；`tests/unit/mcp-setup-config-template-contracts.test.js:126-150` 覆盖 `feedback_sources`、`sweep_state_path`、`sweep_ack_cap`、`sweep_lease_ttl_minutes`、`sweep_shared_branch` 在 template 中可发现。
  - `spec-sweep` 输出的 rolling plan frontmatter 是 `artifact_contract: spec-unified-plan/v1`、`artifact_readiness: requirements-only`、`product_contract_source: spec-sweep`，位于 `skills/spec-sweep/references/plan-template.md:9-17`。`spec-lfg docs/plans/feedback-sweep-plan.md` handoff 依赖 `spec-lfg` 先经 `spec-plan` enrich requirements-only plan，而不是直接把 requirements-only 当 implementation-ready 执行；该跨 workflow依赖留到 Phase 3 plan/lfg 链路端到端复核。
  - `diff -qr /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep skills/spec-sweep` 的差异集中在预期投影文件: `SKILL.md`、media analyzer、interview、plan template、state schema、subagent template、`analyze_riffrec_zip.py`、`sweep-state.py`。未发现额外 source 文件遗漏。
  - `rg -n "\bce-|/ce-|compound-engineering|\.compound-engineering|ce-unified-plan|/tmp/compound-engineering|CLAUDE_SKILL_DIR|agy|ask_question|ask_user|pi-ask-user" skills/spec-sweep` 无输出，说明 active source 下无 CE namespace / legacy host residual。
- 上下文管理验证结果:
  - `SKILL.md` 共 153 行，低于方案建议的 500 行上下文预算。
  - 复杂状态 contract、first-run interview、source connectors、media analyzer 和 plan reconciliation rules 均下沉到 `references/`，由 Phase 触发读取；SKILL.md 保持 front-controller / state-machine driver 角色。
  - 状态 schema 明确 state file 内容为 untrusted / injection sink，并在 `load_state` 中拒绝非当前用户拥有的 state file，位于 `skills/spec-sweep/scripts/sweep-state.py:253-268`；sensitive item 会在 write time 删除 `body` / `quote`，位于 `skills/spec-sweep/scripts/sweep-state.py:451-459`。
  - Media flow 使用 `/tmp/spec-first/spec-sweep/<run-id>/` scratch，raw media never committed，位于 `skills/spec-sweep/SKILL.md:118-124`。
- 安全 / residual 检查:
  - `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-sweep/scripts/sweep-state.py skills/spec-sweep/scripts/analyze_riffrec_zip.py` pass。
  - `npx jest tests/unit/spec-sweep-lfg-migration-contracts.test.js tests/unit/mcp-setup-config-template-contracts.test.js tests/unit/migrated-skill-scripts-contracts.test.js --runInBand` pass，3 个 suites / 17 个 tests 通过。
  - `git status --ignored --short -- skills/spec-sweep` 无输出，未发现 `spec-sweep` source skill 目录下 ignored `__pycache__` 污染。
  - `analyze_riffrec_zip.py` 的 zip extract 有路径穿越 guard，位于 `skills/spec-sweep/scripts/analyze_riffrec_zip.py:88-103`；`curl` / `ffmpeg` / `subprocess` 调用均使用 fixed argv 且无 `shell=True`，关键转录和截图调用位于 `skills/spec-sweep/scripts/analyze_riffrec_zip.py:301-348`、`skills/spec-sweep/scripts/analyze_riffrec_zip.py:510-545`。
  - `sweep-state.py` 写入使用 `tempfile.mkstemp` + `os.replace`，位于 `skills/spec-sweep/scripts/sweep-state.py:290-307`；mutating commands 通过 OS advisory lock 序列化，位于 `skills/spec-sweep/scripts/sweep-state.py:750-789`。
- 未检查 / degraded checks:
  - 未实际连接 Slack / GitHub / email 工具，未执行真实 source-side ack / close-out，也未运行真实 media analyzer subagent；本审查只验证 source contract、state engine、migration projection 和 focused tests。
  - 未实际运行 `spec-lfg docs/plans/feedback-sweep-plan.md`；requirements-only plan 进入 `spec-lfg` 后是否经 `spec-plan` enrichment 正确升级，留到 Phase 3 全局 plan/lfg 链路复核。
  - 未修复 interview 写入清单；本 goal 默认记录审查发现，不直接修改 source skill。

#### spec-mcp-setup

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-mcp-setup/SKILL.md`
  - `skills/spec-mcp-setup/references/config-template.yaml`
  - `skills/spec-mcp-setup/scripts/check-health`
  - `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh`
  - `skills/spec-mcp-setup/scripts/verify-tools.sh`
  - `skills/spec-mcp-setup/scripts/install-helpers.sh`
  - `skills/spec-mcp-setup/scripts/provider-readiness-renderer.cjs`
  - `skills/spec-mcp-setup/scripts/setup-plan-renderer.cjs`
  - `skills/spec-mcp-setup/scripts/lib/registry-loader.cjs`
  - `skills/spec-mcp-setup/scripts/lib/exec.cjs`
  - `skills/spec-mcp-setup/scripts/lib/platform.cjs`
  - `skills/spec-product-pulse/SKILL.md`
  - `skills/spec-product-pulse/references/interview.md`
  - `skills/spec-ideate/SKILL.md`
  - `tests/unit/mcp-setup-config-template-contracts.test.js`
  - `tests/unit/browser-helper-tool-contracts.test.js`
  - `tests/unit/mcp-setup-powershell-contracts.test.js`
  - `tests/unit/registry-loader-v7-contracts.test.js`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-setup/SKILL.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-setup/references/config-template.yaml`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-setup/scripts/check-health`
- CE parity: near-parity applicable。当前 `spec-mcp-setup` 不是 CE `ce-setup` 的直接同构迁移，而是把 CE 的 lightweight health check / repo-local config helper 扩展为 spec-first 多宿主 runtime readiness setup。核心 CE 能力被保留并合理扩展:
  - CE 的诊断优先、不 bulk-install optional dependencies 的原则保留为 Default Diagnose Flow，位于 `skills/spec-mcp-setup/SKILL.md:130-162`；裸调用不执行 provider first-generation。
  - CE 的 obsolete `compound-engineering.local.md` 检测被保留为 legacy signal，不是 active CE residual，位于 `skills/spec-mcp-setup/SKILL.md:57`、`skills/spec-mcp-setup/SKILL.md:80`、`skills/spec-mcp-setup/SKILL.md:246` 和 `skills/spec-mcp-setup/scripts/check-health:489-491`；删除仍需要显式 `--delete-legacy-markdown`，位于 `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh:17-30`。
  - CE 的 config example / local config / gitignore helper 被投影到 `.spec-first/config.local.example.yaml`、`.spec-first/config.local.yaml`、`.spec-first/*.local.yaml`，位于 `skills/spec-mcp-setup/SKILL.md:48-58` 和 `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh:288-340`。
  - spec-first 扩展的 host authority fail-closed 语义明确要求 mutation scripts 只接受 `MCP_SETUP_HOST=claude|codex|kiro|qoder|cursor`，位于 `skills/spec-mcp-setup/SKILL.md:122-129`，并由 `install-mcp.sh` / `configure-host.sh` / `uninstall-mcp.sh` 实现。
  - setup-owned facts、provider readiness v2、generated runtime manifest freshness 和 project-local config status 都属于 deterministic facts；`SKILL.md:9-23` 明确 scripts prepare facts、LLM workflows decide。
- 发现:
  1. medium — `skills/spec-mcp-setup/references/config-template.yaml:32-49` vs `skills/spec-product-pulse/SKILL.md:58-73`、`skills/spec-product-pulse/references/interview.md:215-221`、`skills/spec-product-pulse/references/interview.md:231-250`: setup local config template 声明覆盖 active `pulse_*` consumer，但漏列 `pulse_schedule`。`spec-product-pulse` SKILL.md 把 `pulse_schedule` 列为 config key，first-run interview 会写入 `pulse_schedule: daily | weekly | manual | ask-again-after-3-runs`；template 缺失会让 setup 产出的 `.spec-first/config.local.example.yaml` 不能完整展示 active product-pulse config surface。建议修复方向: 在 `config-template.yaml` 的 Product pulse block 中加入 commented `# pulse_schedule: manual` 或等价 allowed values，并补 `mcp-setup-config-template-contracts` 覆盖所有 `spec-product-pulse` 声明的 active `pulse_*` keys。
  2. medium — `skills/spec-mcp-setup/SKILL.md:118`、`skills/spec-mcp-setup/references/config-template.yaml:58-67` vs `skills/spec-ideate/SKILL.md:81-100`: setup 文档把 `ideate_output` 与 `plan_output`、`brainstorm_output` 一起标成 “reserved future hints unless an implemented consumer and focused tests exist”，但 `spec-ideate` 当前已主动读取 active、非注释的 `ideate_output:` 并据此切换 `md` / `html` 输出格式。影响是 setup 的 config consumer matrix 与实际 active consumer 漂移，容易让后续审查误判 `ideate_output` 为 inert key。建议修复方向: 将 `ideate_output` 从 reserved-future 口径中移出，明确它已有 active consumer；若 HTML sidecar 仍有 downstream 限制，应只把 `plan_output` / `brainstorm_output` 保持 reserved，或精确说明 `ideate_output` 仅影响 `spec-ideate` 自身 artifact。
  3. medium — `skills/spec-mcp-setup/scripts/provider-readiness-renderer.cjs:211-214`、`skills/spec-mcp-setup/scripts/provider-readiness-renderer.cjs:265-284`、`skills/spec-mcp-setup/scripts/install-helpers.sh:1219-1224` vs `skills/spec-mcp-setup/SKILL.md:124`: `SKILL.md` 和 host mutation scripts 已把 Cursor 纳入 canonical host，但 provider readiness renderer 与 Graphify project platform helper 仍只接受 `claude|codex|kiro|qoder`，其他值回落 `codex`。当 `verify-tools.sh:848-869` 把 detected host 透传为 `SPEC_FIRST_PROVIDER_HOST="$RECONCILIATION_HOST"` 时，Cursor 项目的 provider readiness / project skill configured 判断会查 `.codex/skills` / `.agents/skills` 而不是 `.cursor/skills`，Graphify project platform 也会按 Codex 写入说明。建议修复方向: 在 `currentProviderHost()` 和 `graphify_project_platform()` 中加入 `cursor`，并补 focused test 覆盖 `SPEC_FIRST_PROVIDER_HOST=cursor` 时 project skill candidate、provider readiness 和 Graphify instruction platform 不回落 Codex。
  4. medium — `tests/unit/registry-loader-v7-contracts.test.js:19` vs `git status --short -- skills/spec-mcp-setup` / `git ls-files skills/spec-mcp-setup`: `tests/unit/registry-loader-v7-contracts.test.js` 直接 `require('../../skills/spec-mcp-setup/scripts/lib/registry-loader.cjs')`，但当前 `skills/spec-mcp-setup/scripts/lib/registry-loader.cjs`、`exec.cjs`、`platform.cjs` 和 `scripts/providers/.gitkeep` 均为 untracked source-like 文件，不在 `git ls-files skills/spec-mcp-setup` 中。当前 dirty tree 下测试可读取这些文件，但 clean checkout / package source 可能缺失该 required module，导致 registry loader test 或后续 consumer 失败。建议修复方向: 明确这些文件是 intended source 时纳入版本控制并补 packaging/runtime source coverage；若只是实验残留，则移除测试依赖或迁移到 tracked source path。
- 依赖关系验证结果:
  - CE residual 扫描中的 7 个 `compound-engineering.local.md` 命中属于 intentionally retained legacy setup markdown signal，与 CE `ce-setup/SKILL.md:48-50`、`ce-setup/SKILL.md:79-83` 的 obsolete local config cleanup 一致，不作为 active CE namespace 漏迁问题。
  - `mcp-tools.json`、`helper-tools.json`、`provider-tools.json` 分别承担 required MCP baseline、manual-command helper 和 optional provider readiness source-of-truth；`SKILL.md:34-47` 明确这些 JSON registry 是 source，generated runtime mirrors 不是 source。
  - `verify-tools.sh` 会在 selected repo root 下写入 `.spec-first/workspace/*` readiness summaries，并通过 symlink guard / marker dir write check 降低越界写风险；`verify-tools.sh:852-869` 同步聚合 generated runtime manifest、helper readiness、configured dependencies 和 provider readiness。
  - Config key 覆盖存在上方 confirmed gaps: `pulse_schedule` template 缺失，`ideate_output` active/reserved 分类漂移；其他已抽查 key（`feedback_sources`、`sweep_*`、`spec_promote_spiral_optout`、`work_delegate_*`、`plan_skip_scoping_confirm`、`verification_profile_path`）与当前 template / consumer 声明基本对齐，最终完整矩阵留到 Phase 3。
- 上下文管理验证结果:
  - `SKILL.md` 共 277 行，低于方案建议的 500 行上下文预算。
  - `SKILL.md` 保持 setup front-controller 角色，细节下沉到 `mcp-tools.json` / `helper-tools.json` / `provider-tools.json` / scripts / `references/config-template.yaml`。
  - Provider readiness display fields 被明确声明为 human UI，不是 downstream semantic truth，位于 `skills/spec-mcp-setup/SKILL.md:45-47`。
  - Setup 明确不得调用 `spec-rule-miner`、不得生成语义 rules、不得把 CodeGraph/Graphify readiness 变成 ordinary work 前置 requirement，位于 `skills/spec-mcp-setup/SKILL.md:23`。
- 安全 / residual 检查:
  - `bash -n` 已在 Phase 1 覆盖所有 `skills/*/scripts/*.sh`，其中包括 `spec-mcp-setup` shell scripts。
  - `check-health` human output 会把 missing agent-browser 当 optional helper 分支继续输出 install command / URL，而不是计入 CLI capability ready；缺 CLI 或缺 global skill 会进入 skill/tool status 分组，位于 `skills/spec-mcp-setup/scripts/check-health:431-473`。
  - `bootstrap-project-config.sh` 对 `.spec-first`、config files、workspace summaries 和 `.gitignore` 都有 symlink escape guard；删除 legacy markdown 需要显式 flag，未发现 silent delete。
  - `provider-readiness-renderer.cjs` 和 `setup-plan-renderer.cjs` 对 Graphify scope 有 absolute / escaping / missing workspace 检查；但 Cursor provider host fallback 已记录为 medium finding。
- 未检查 / degraded checks:
  - 未执行真实 host MCP install/configure/uninstall mutation，也未运行 `spec-first init`；本审查只读取 source 与运行 focused tests。
  - 未实际生成 CodeGraph / Graphify provider artifacts；provider readiness 仅按 source logic、tests 和 registry 进行审查。
  - 当前 `skills/spec-mcp-setup/SKILL.md` 在工作树中已有未提交改动，本报告按当前工作树审查，不回退或归因该改动。
  - 未修复上述 findings；本 goal 默认记录审查发现，不直接修改 source skill。

#### spec-riffrec-feedback-analysis

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-riffrec-feedback-analysis/SKILL.md`
  - `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md`
  - `skills/spec-riffrec-feedback-analysis/references/install-riffrec.md`
  - `skills/spec-riffrec-feedback-analysis/references/quick-bug-report.md`
  - `skills/spec-riffrec-feedback-analysis/references/spec-first-feedback-format.md`
  - `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py`
  - `skills/spec-sweep/scripts/analyze_riffrec_zip.py`
  - `skills/spec-brainstorm/SKILL.md`
  - `skills/spec-brainstorm/references/brainstorm-sections.md`
  - `skills/spec-plan/SKILL.md`
  - `tests/unit/spec-brainstorm-contracts.test.js`
  - `tests/unit/migrated-skill-scripts-contracts.test.js`
  - `tests/unit/spec-migrated-standalone-skills-contracts.test.js`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-riffrec-feedback-analysis/` 下对应 CE 文件集合与 diff
- CE parity: applicable。当前 `spec-riffrec-feedback-analysis` 是 CE `ce-riffrec-feedback-analysis` 的 repaired/replaced 投影，核心 Riffrec consumption 能力保留:
  - 三路径分流保留: setup 只指导安装/录制，quick bug report 走 temp output 且默认 inline，extensive analysis 生成完整 evidence/kickoff artifact 并进入 brainstorm，位于 `skills/spec-riffrec-feedback-analysis/SKILL.md:10-18`。
  - raw recordings、audio chunks、zip contents、session dumps、extracted screenshots 均 local-only by default；text/metadata artifact 仅在 traceability 需要且无敏感数据时可提交，位于 `skills/spec-riffrec-feedback-analysis/SKILL.md:20-24`。
  - analyzer 支持 Riffrec zip、standalone video/audio、meeting notes，并生成 `analysis.md`、`problem-analysis.md`、`review-prompt.md`、`source-materials.md`、`requirements-kickoff.md`、`analysis.json`、`frames/`、`raw/`，位于 `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:92-105`。
  - quick path 明确不自动 handoff 到 `spec-brainstorm`，不写 `docs/brainstorms/...`，位于 `skills/spec-riffrec-feedback-analysis/references/quick-bug-report.md:16-21` 和 `skills/spec-riffrec-feedback-analysis/references/quick-bug-report.md:36-40`。
  - CE identity 已投影为 spec-first: `ce-brainstorm` -> `spec-brainstorm`、`ce-debug` -> `spec-debug`、`compound-engineering-feedback-format.md` -> `spec-first-feedback-format.md`；CE residual scan 对该 skill 无命中。
- 发现:
  1. medium — `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:54`、`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:61`、`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1117` vs `skills/spec-brainstorm/SKILL.md:11-24`、`skills/spec-brainstorm/SKILL.md:96-102`、`skills/spec-brainstorm/SKILL.md:276-285`、`tests/unit/spec-brainstorm-contracts.test.js:47-62`: Riffrec extensive path 和 analyzer help/结尾输出仍声称 `spec-brainstorm` 会把 durable requirements document 写到 `docs/brainstorms/`，但当前 `spec-brainstorm` source 和 focused tests 明确新输出是 `docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.<md|html>` 下的 `artifact_contract: spec-unified-plan/v1`、`artifact_readiness: requirements-only` unified plan；`docs/brainstorms/*-requirements.*` 仅是 legacy input。影响是 Riffrec handoff 可能误导用户和后续 agent 把 evidence/kickoff exception 当 durable brainstorm output，破坏 Phase 3 plan artifact contract 链路。建议修复方向: 将 Riffrec `extensive-analysis.md` 和 analyzer help/final print 改为 “`docs/brainstorms/riffrec-feedback/` 仅为 evidence/kickoff artifact exception；`spec-brainstorm` 的 durable requirements-only unified plan 写入 `docs/plans/`”，并补 focused test 锁定 `spec-riffrec-feedback-analysis` 与 `spec-brainstorm` output contract 一致。
- pending_global_cross_check:
  - `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py` 与 `skills/spec-sweep/scripts/analyze_riffrec_zip.py` 只有 durable output wording 两处差异: Riffrec standalone 当前写 `docs/brainstorms/` / durable requirements document，Sweep 写 `docs/plans/` / durable unified plan。鉴于当前 `spec-brainstorm` contract 已确认 `docs/plans/`，该差异不只是 harmless wording；最终是否统一两个 analyzer 副本、是否共享实现，留到 Phase 3 共享脚本 divergence 统一裁决。
- 依赖关系验证结果:
  - `spec-brainstorm` handoff 目标存在，且 current source 明确 consumer 是 requirements-only unified plan；Riffrec analyzer 生成的 `requirements-kickoff.md` 是 upstream evidence/kickoff 输入，不应被当作 final Product Contract。
  - `spec-plan` 对 legacy `docs/brainstorms/*-requirements.{md,html}` 仍可读，但当前 Riffrec 的 `requirements-kickoff.md` 不匹配 legacy filename contract；因此正常路径必须先经过 `spec-brainstorm`，不能直接跳到 `spec-plan`。
  - `tests/unit/migrated-skill-scripts-contracts.test.js:60-62` 只覆盖 analyzer 脚本存在；`tests/unit/spec-migrated-standalone-skills-contracts.test.js:105-125` 只覆盖 CE residual / format reference rename，未覆盖 durable output contract。
- 上下文管理验证结果:
  - `SKILL.md` 共 37 行，低于方案建议的 500 行上下文预算；主入口只做路由，具体 setup/quick/extensive 规则下沉到 references。
  - `SKILL.md:12` 明确只读取匹配路径 reference，不加载其他 reference，符合 triggered context 管理。
  - `source-materials.md` 被定义为 raw feedback、transcript、frames、chunks、analysis artifacts 的 source-of-truth manifest，位于 `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:16-19`；这有助于后续 brainstorm/planning 保持证据链。
- 安全 / residual 检查:
  - `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py` pass。
  - `python3 skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py --help` pass，并暴露了本小节记录的 `docs/brainstorms/` durable output wording 漂移。
  - `safe_extract` 在解压 zip 前用 resolved path 检查成员路径不逃逸目标目录，位于 `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:88-102`。
  - `curl` / `ffmpeg` 调用均使用 argv list 和 `subprocess.run(..., shell=False default)`；关键转录和截图调用位于 `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:314-328`、`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:526-540`。
  - `git status --ignored --short -- skills/spec-riffrec-feedback-analysis` 无输出，未发现当前 source skill 目录下 ignored `__pycache__` 或 untracked 污染。
- 未检查 / degraded checks:
  - 未调用 OpenAI transcription API、未执行真实 `curl` 转录、未用 `ffmpeg` 处理真实媒体，也未运行真实 Riffrec zip；本审查只验证 source contract、脚本语法/help、安全关键路径和 CE projection。
  - 未实际调用 `spec-brainstorm` 处理 `requirements-kickoff.md`；artifact contract 漂移由 `spec-brainstorm` source 和 focused tests 确认。
  - 未修复 durable output wording；本 goal 默认记录审查发现，不直接修改 source skill。

#### spec-product-pulse

- Tier: B
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-product-pulse/SKILL.md`
  - `skills/spec-product-pulse/references/interview.md`
  - `skills/spec-product-pulse/references/report-template.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-product-pulse/SKILL.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-product-pulse/references/interview.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-product-pulse/references/report-template.md`
- CE parity: applicable。当前 `spec-product-pulse` 是 CE `ce-product-pulse` 的低差异投影，核心 Product Pulse 能力保留:
  - 文件集合与 CE 对齐，`diff -qr` 只显示 `SKILL.md` 与 `references/interview.md` 差异；`references/report-template.md` 与 CE 无差异。
  - identity、local config、downstream entry 和 schedule handoff 已从 CE 投影到 spec-first: `ce-product-pulse` -> `spec-product-pulse`、`.compound-engineering/config.local.yaml` -> `.spec-first/config.local.yaml`、`ce-strategy` -> `spec-strategy`，位于 `skills/spec-product-pulse/SKILL.md:17-19`、`skills/spec-product-pulse/SKILL.md:53-73`、`skills/spec-product-pulse/SKILL.md:86-93`、`skills/spec-product-pulse/SKILL.md:114-116`。
  - blocking question host surface 从 CE 的 Claude/Codex/Antigravity/Pi 收敛为当前 source 支持的 Claude/Codex，位于 `skills/spec-product-pulse/SKILL.md:23-25`。
  - lookback window 改为解析当前请求而不是 CE 的 host argument tag，位于 `skills/spec-product-pulse/SKILL.md:29-37`。
  - first-run interview 继续坚持 SMART metric bar、最小 data-source set、read-only DB refusal、no credentials in config 和 MCP nudge，位于 `skills/spec-product-pulse/references/interview.md:9-20`、`skills/spec-product-pulse/references/interview.md:108-161`。
  - scheduling 从 CE 的 in-plugin schedule skill 改为 current harness scheduling primitive / platform-native fallback，并新增 `pulse_schedule` key，位于 `skills/spec-product-pulse/SKILL.md:116`、`skills/spec-product-pulse/SKILL.md:159-166`、`skills/spec-product-pulse/references/interview.md:200-221`、`skills/spec-product-pulse/references/interview.md:231-250`。
- 发现:
  1. medium — `skills/spec-product-pulse/references/report-template.md:66`、`skills/spec-product-pulse/references/report-template.md:76` vs `skills/spec-product-pulse/SKILL.md:144-149`、`skills/spec-product-pulse/references/interview.md:253-258`: report template 仍允许 “Error count customized at setup” 并要求按 configured count 输出，但主流程固定写 “top 5 errors”，interview 的 config notes 又明确 top-N error count / latency on-off 本版不可配置、报告始终包含 top 5 errors 和 p50/p95/p99 latency。影响是 report assembler 可能寻找并遵循并不存在的配置键，或在没有配置来源的情况下接受 top 3/top 10 变体，破坏 Product Pulse artifact 的可重复 contract。建议修复方向: 如果本版确实不可配置，则把 `report-template.md` 的 variation/checklist 改为固定 top 5；如果要恢复 configurability，则补 `pulse_error_count` / latency opt config key、interview capture、setup config template 和 focused tests。
- 依赖关系验证结果:
  - `spec-strategy` 引用存在，作为 strategy seeding 前置建议，不是硬依赖。
  - `spec-mcp-setup` 对 `pulse_schedule` 的 config template 漏列已在 `spec-mcp-setup` 小节计为 medium；本小节不重复计数，只记录该 dependency gap 已确认。
  - `pulse_*` config surface 由 `SKILL.md:58-73` 与 `interview.md:231-250` 定义；`report-template.md` 新发现的 “configured count” 未在这两个 source-of-truth 中出现。
  - `search_mcp_registry` / `suggest_connectors` 在 `interview.md:138-145` 中作为 MCP discovery/setup primitive 出现；当前 focused standalone tests 未覆盖其 runtime availability。本轮未单独记录为 confirmed issue，因为该部分属于 provider/harness primitive 适配，需 Phase 3 测试覆盖缺口或 setup readiness 统一判断。
- 上下文管理验证结果:
  - `SKILL.md` 共 178 行，低于方案建议的 500 行上下文预算；first-run interview 和 report template 下沉到 triggered references。
  - 该 skill 没有 scripts、schemas 或 assets；不存在脚本语法、共享脚本 divergence 或 generated bytecode hygiene 问题。
  - 保存报告路径固定为 `docs/pulse-reports/YYYY-MM-DD_HH-MM.md`，位于 `skills/spec-product-pulse/SKILL.md:153-157`；报告明确 no PII，位于 `skills/spec-product-pulse/SKILL.md:41-47`、`skills/spec-product-pulse/references/report-template.md:7-16`。
- 安全 / residual 检查:
  - 对 `skills/spec-product-pulse` 的 CE residual / generated runtime context 扫描无输出。
  - `git status --short -- skills/spec-product-pulse` 无输出，当前 source skill 目录无 tracked/untracked dirty 变化。
  - `npx jest tests/unit/spec-migrated-standalone-skills-contracts.test.js tests/unit/mcp-setup-config-template-contracts.test.js --runInBand` pass，2 个 suites / 13 个 tests 通过；这些 tests 未覆盖本小节记录的 top-N report-template 矛盾。
- 未检查 / degraded checks:
  - 未实际连接 analytics / tracing / payments / read-only DB，也未生成真实 `docs/pulse-reports/` artifact；本审查只验证 source contract、CE projection、配置 surface 和 focused tests。
  - 未执行真实 MCP registry / connector discovery；provider primitive availability 留到 Phase 3 测试覆盖缺口统一复核。
  - 未修复 report-template 矛盾；本 goal 默认记录审查发现，不直接修改 source skill。

下一项 `spec-brainstorm`。

### Batch 4

#### spec-brainstorm

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-brainstorm/SKILL.md`
  - `skills/spec-brainstorm/references/agents/repo-profiler.md`
  - `skills/spec-brainstorm/references/agents/slack-researcher.md`
  - `skills/spec-brainstorm/references/blindspot-pass.md`
  - `skills/spec-brainstorm/references/brainstorm-sections.md`
  - `skills/spec-brainstorm/references/handoff.md`
  - `skills/spec-brainstorm/references/html-rendering.md`
  - `skills/spec-brainstorm/references/markdown-rendering.md`
  - `skills/spec-brainstorm/references/model-tiers.md`
  - `skills/spec-brainstorm/references/product-pressure-test.md`
  - `skills/spec-brainstorm/references/repo-profile-cache.md`
  - `skills/spec-brainstorm/references/synthesis-summary.md`
  - `skills/spec-brainstorm/references/universal-brainstorming.md`
  - `skills/spec-brainstorm/references/verdict-routing.md`
  - `skills/spec-brainstorm/references/visual-probes.md`
  - `skills/spec-brainstorm/scripts/repo-profile-cache.py`
  - `skills/spec-brainstorm/scripts/visual-probe-server.js`
  - `tests/unit/spec-brainstorm-contracts.test.js`
  - `tests/unit/repo-profile-cache-parity.test.js`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-brainstorm/` 下对应 CE 文件集合与 diff
- CE parity: applicable。当前 `spec-brainstorm` 是 CE `ce-brainstorm` 的 replaced/repaired 投影，核心 WHAT-before-HOW 能力和 requirements-only unified plan 合同保留:
  - durable output 从 CE identity 投影为 `docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.<md|html>`、`artifact_contract: spec-unified-plan/v1`、`artifact_readiness: requirements-only`、`product_contract_source: spec-brainstorm`，位于 `skills/spec-brainstorm/SKILL.md:11-15`、`skills/spec-brainstorm/SKILL.md:274-285`、`skills/spec-brainstorm/references/brainstorm-sections.md:23-53`。
  - `spec-plan` handoff、`spec-doc-review` pressure-test、`spec-proof` publish、HTML local open 和 `lfg` autonomous path 已投影，位于 `skills/spec-brainstorm/references/handoff.md:55-60`、`skills/spec-brainstorm/references/handoff.md:70-127`、`skills/spec-brainstorm/references/handoff.md:140-166`。
  - intake 的 `spec-pov` verdict-shape carve-out 保留，位于 `skills/spec-brainstorm/SKILL.md:120-126` 和 `skills/spec-brainstorm/references/verdict-routing.md:1-26`。
  - non-software route 明确不写 `spec-unified-plan/v1`，转由 `spec-plan` 选择 universal/knowledge-work artifact shape，位于 `skills/spec-brainstorm/SKILL.md:104-118`、`skills/spec-brainstorm/references/universal-brainstorming.md:1-11`、`skills/spec-brainstorm/references/universal-brainstorming.md:64-73`。
  - visual-probe gate 和 display-only helper 保留，位于 `skills/spec-brainstorm/SKILL.md:202-208`、`skills/spec-brainstorm/references/visual-probes.md:17-40`、`skills/spec-brainstorm/references/visual-probes.md:67-90`、`skills/spec-brainstorm/scripts/visual-probe-server.js:253-292`。
  - CE `references/reasoning-elevation.md` 未迁入当前 spec source；该文件是 Claude/Fable 专属、含 `.compound-engineering` / `ce-*` config 与 marker 路径，当前 `model-tiers.md:1-9` 改为 host/model-name-free tiering，`tests/unit/spec-brainstorm-contracts.test.js:9-27` 也把 file surface 锁定为无该 reference。本轮视为合理 divergence，不计问题。
- 发现:
  1. medium — `tests/unit/repo-profile-cache-parity.test.js:8-23`、`tests/unit/repo-profile-cache-parity.test.js:31-38`、`skills/spec-brainstorm/references/repo-profile-cache.md:5` vs 其他 repo-grounding consumers: `repo-profile-cache-parity` 要求 `references/repo-profile-cache.md`、`scripts/repo-profile-cache.py`、`references/agents/repo-profiler.md` 在 9 个消费者中 byte-identical。当前 `spec-brainstorm/references/repo-profile-cache.md` 已写当前测试路径 `tests/unit/repo-profile-cache-parity.test.js`，但至少一个其他消费者副本仍写旧路径 `tests/repo-profile-cache-parity.test.ts`，实测 parity suite 失败。影响是共享 repo-grounding contract 失去 single-copy parity，后续修订可能只改一个 skill 的 cache protocol 文案或脚本，造成跨 workflow drift。建议修复方向: 统一 9 个消费者的 `references/repo-profile-cache.md`，保留当前 Jest 路径或明确新路径，然后重跑 `tests/unit/repo-profile-cache-parity.test.js`；同时先处理当前工作树中 `spec-code-review/scripts/repo-profile-cache.py` 缺失导致的 ENOENT，避免 parity suite 被无关缺失阻断。
  2. low — `skills/spec-brainstorm/SKILL.md:278-281`、`skills/spec-brainstorm/references/markdown-rendering.md:31-38`: 当前 source 中 Phase 3 compose list 的第一项前有 4 个空格，Markdown 会把它渲染成代码块而不是同级 bullet；`markdown-rendering.md` 中 `Definition of Done` continuation 过度缩进，并重复两次 “Requirements-only artifacts omit the plan-only sections”。影响是 agent 仍能读懂大意，但 source prose 的结构信号和 section contract 可读性变差，focused `spec-brainstorm-contracts` 未覆盖该格式漂移。建议修复方向: 去掉 `SKILL.md:280` 的多余缩进，让两个 compose inputs 成为同级 bullets；整理 `markdown-rendering.md:35-37` 为单个 continuation 句子，并补小型 contract 断言防止 required sections prose 被重复/缩进成代码块。
- 依赖关系验证结果:
  - `spec-plan` 下游消费 `artifact_contract: spec-unified-plan/v1`、`artifact_readiness: requirements-only`、`product_contract_source: spec-brainstorm` 的链路存在，最终端到端仍留到 Phase 3 与 `spec-plan` / `spec-lfg` 一并复核。
  - `lfg` handoff 当前 reference 直接写 `lfg <plan-path>`，而公开 workflow 名称方案一般统一为 `spec-*`；该处是否应改为 `spec-lfg` 留到 `spec-lfg` / Phase 3 pipeline 上下文传递完整性统一判断，本小节不重复计数。
  - `spec-proof` 只在 markdown artifact 下展示；HTML artifact 下改为 local browser open，符合 exclusive output mode。
  - `CONCEPTS.md` vocabulary capture 只在根文件存在时静默更新，位于 `skills/spec-brainstorm/SKILL.md:287-297`；该写入属于 project source mutation，后续若修改 skill 行为需考虑 changelog/source boundary，但当前不作为迁移问题。
- 上下文管理验证结果:
  - `SKILL.md` 共 301 行，低于方案建议的 500 行上下文预算；大量写作规则、handoff、visual probe、universal route、synthesis summary 和 rendering 下沉到 references。
  - `references/html-rendering.md` 为 631 行，较重，但只在 `OUTPUT_FORMAT=html` 的 Phase 3 被触发加载，符合 deferred context discipline。
  - grounding scout 会把 repo facts 写入 `/tmp/spec-first/spec-brainstorm/<run-id>/grounding.md`，后续对话只携带 gist，位于 `skills/spec-brainstorm/SKILL.md:178-182`。
- 安全 / residual 检查:
  - 对 `skills/spec-brainstorm` 的 active CE residual 扫描无 `ce-*` / `.compound-engineering` / `/tmp/compound-engineering` 命中。
  - `npx jest tests/unit/spec-brainstorm-contracts.test.js --runInBand` pass，4 个测试通过。
  - `node --check skills/spec-brainstorm/scripts/visual-probe-server.js` pass。
  - `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-brainstorm/scripts/repo-profile-cache.py` pass。
  - `git diff --check -- skills/spec-brainstorm tests/unit/spec-brainstorm-contracts.test.js` pass。
  - `npx jest tests/unit/spec-brainstorm-contracts.test.js tests/unit/migrated-skill-scripts-contracts.test.js tests/unit/repo-profile-cache-parity.test.js --runInBand` 中 `spec-brainstorm-contracts` 通过；`migrated-skill-scripts-contracts` 因当前工作树 `skills/spec-code-review/scripts/cross-model-adversarial-review.sh` / `repo-profile-cache.py` 缺失失败；`repo-profile-cache-parity` 同时暴露本小节记录的 shared reference divergence 和同一 `spec-code-review/scripts/repo-profile-cache.py` ENOENT。
- 未检查 / degraded checks:
  - 未实际运行 `spec-brainstorm` 交互、未生成 `docs/plans/` artifact、未启动真实 visual probe server 的 `start` 长驻进程，也未调用 `spec-plan` / `spec-doc-review` / `spec-proof` / `lfg` handoff。
  - 当前 `skills/spec-brainstorm` 多个 source 文件在工作树中已有未提交改动；本报告按当前工作树审查，不回退或归因这些改动。
  - 未修复上述 findings；本 goal 默认记录审查发现，不直接修改 source skill。

下一项 `spec-plan`。

#### spec-plan

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-plan/references/agents/` 下全部 prompt assets 文件清单与当前 diff
  - `skills/spec-plan/references/approach-altitude.md`
  - `skills/spec-plan/references/deepening-workflow.md`
  - `skills/spec-plan/references/html-rendering.md`
  - `skills/spec-plan/references/markdown-rendering.md`
  - `skills/spec-plan/references/plan-handoff.md`
  - `skills/spec-plan/references/plan-sections.md`
  - `skills/spec-plan/references/repo-profile-cache.md`
  - `skills/spec-plan/references/synthesis-summary.md`
  - `skills/spec-plan/references/universal-planning.md`
  - `skills/spec-plan/scripts/repo-profile-cache.py`
  - `tests/unit/spec-plan-contracts.test.js`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-plan/` 下对应 CE 文件集合与 diff
- CE parity: applicable。当前 `spec-plan` 保留 CE `ce-plan` 的核心 planning 能力，并完成 spec-first 投影:
  - direct planning、requirements-only unified plan enrichment、approach-altitude、universal-planning、synthesis confirmation、repo-profile cache、confidence-check deepening、headless `spec-doc-review` 和 post-generation handoff 仍在主流程中，位于 `skills/spec-plan/SKILL.md:11-15`、`skills/spec-plan/SKILL.md:28-34`、`skills/spec-plan/SKILL.md:145-162`、`skills/spec-plan/SKILL.md:174-215`、`skills/spec-plan/SKILL.md:307-314`、`skills/spec-plan/SKILL.md:680-716`、`skills/spec-plan/SKILL.md:780-803`。
  - plan artifact contract 投影为 `artifact_contract: spec-unified-plan/v1`、`artifact_readiness: implementation-ready`、`product_contract_source: spec-brainstorm | spec-plan-bootstrap` 和 `execution: code`，位于 `skills/spec-plan/SKILL.md:178-179`、`skills/spec-plan/SKILL.md:215`、`skills/spec-plan/SKILL.md:715`、`skills/spec-plan/references/plan-sections.md:22-63`。
  - `spec-work` / `/goal` / `spec-doc-review` / `spec-proof` handoff 保留，且 `spec-work` 与 `/goal` 都受 `implementation-ready` + `execution: code` gate 约束，位于 `skills/spec-plan/references/plan-handoff.md:50-85`、`skills/spec-plan/references/plan-handoff.md:87-98`、`skills/spec-plan/SKILL.md:788-803`。
  - HTML output 的 `spec-doc-review` markdown-only 降级路径明确记录 synthetic skipped envelope，位于 `skills/spec-plan/references/plan-handoff.md:5-18`、`skills/spec-plan/references/plan-handoff.md:44-48`、`skills/spec-plan/references/plan-handoff.md:56-76`。
  - 当前 uncommitted source diff 把固定 “current year is 2026” 改为从 active host context 取当前日期，新增中文 Contract Summary，并增加 `docs/contracts/governance-boundaries.md` 可选边界参考。未发现这些改动直接破坏已确认的 plan artifact 或 handoff contract；其中 `docs/contracts/governance-boundaries.md` 当前不存在，source 写法为 “if it exists”，因此是 optional advisory pointer 而非硬依赖。
- 发现:
  1. medium — `tests/unit/spec-plan-contracts.test.js:53-67`、`/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-plan/references/reasoning-elevation.md:1-63` vs `skills/spec-plan/`: focused migration contract 仍要求 `specFiles` 与 CE `ce-plan` 文件集合完全相等，但当前 spec source 缺少 CE 的 `references/reasoning-elevation.md`。实测 `npx jest tests/unit/spec-plan-contracts.test.js --runInBand` 失败在 `keeps the spec-plan source file set aligned with CE ce-plan`，其余 4 个测试通过。该 CE 文件是 Claude/Fable 专用 elevation engine，仍含 `ce-plan`、`.compound-engineering/config.local.yaml`、`~/.config/compound-engineering/fable-nudge-seen` 和 CE host gate；当前 `spec-plan` 无任何引用。影响是测试合同和 source divergence 没有达成一致: 如果该能力应迁移，则当前 source 缺少一条 CE 承重能力；如果该能力有意删除，则 focused test 仍把 CE-only 文件当必需 source，阻塞验证并误导后续维护者。建议修复方向: 二选一收敛合同：要么迁移为 spec-first 版、host-neutral 或 Claude-gated `reasoning-elevation` 能力并清理 CE namespace/config/marker；要么在 `tests/unit/spec-plan-contracts.test.js` 中像已排除 `references/governance-boundaries.md` 等 retired files 一样显式排除 `references/reasoning-elevation.md`，并在迁移审查文档记录 intentional divergence 与替代能力。
- 依赖关系验证结果:
  - `spec-brainstorm` -> `spec-plan` -> `spec-work` 主链路 metadata 在 `SKILL.md` 与 `plan-sections.md` 中匹配；requirements-only artifact 不是 resume target，而是 enrichment input。
  - `plan_skip_scoping_confirm` 被 `spec-plan` 读取并在 `synthesis-summary.md` 中作为 opt-in scoping confirmation skip 使用，位于 `skills/spec-plan/SKILL.md:109-116`、`skills/spec-plan/references/synthesis-summary.md:141`。
  - `spec-proof` publish handoff 使用 `identity: ai:spec-first / Spec-First`，位于 `skills/spec-plan/references/plan-handoff.md:87-92`。
  - `spec-doc-review` 对 HTML plan 的 markdown-only 降级已在 handoff 中显式说明；是否需要 HTML-aware doc review 留待后续产品能力，不在本迁移 finding 中重复计数。
- 上下文管理验证结果:
  - `SKILL.md` 共 809 行，超过方案建议的 500 行 advisory budget；本轮没有把行数本身作为问题，因为 Phase 0-5、artifact metadata、handoff gate 和 output mode 规则仍是该 workflow 的主执行合同。后续若继续膨胀，应优先把非入口判断的长段落下沉到 triggered references。
  - Deepening research prompt assets 通过 `references/agents/<name>.md` skill-local 文件按需加载，`deepening-workflow.md:98-100` 明确不要使用 typed `Agent` names 或 platform-level registration。
  - repo-profile cache 通过 `SKILL_DIR` anchor 调用 co-located script，cache miss/error/NO-CACHE 均降级为 fresh derive，位于 `skills/spec-plan/SKILL.md:307-314`、`skills/spec-plan/references/repo-profile-cache.md:36-63`。
- 安全 / residual 检查:
  - `npx jest tests/unit/spec-plan-contracts.test.js --runInBand` issues_found: 1 个 file-set 测试失败，其余 entrypoint/path/artifact/handoff、planning behavior、repo-profile cache 和 runtime projection 测试通过。
  - `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-plan/scripts/repo-profile-cache.py` pass。
  - `docs/contracts/governance-boundaries.md` 当前不存在；`skills/spec-plan/SKILL.md:63` 使用 “if it exists” 条件，不构成 missing hard dependency。
  - 对 `skills/spec-plan` 的 active CE residual 扫描仍需在 Phase 3 全局 residual sweep 中统一复核；本轮已确认唯一缺失 CE file 自身不在 spec source 中。
- 未检查 / degraded checks:
  - 未实际运行 `spec-plan` 交互、未生成或 enrich `docs/plans/` artifact、未调用 `spec-doc-review`、`spec-work`、`spec-proof` 或 `create_goal`。
  - 当前 `skills/spec-plan` 多个 source 文件在工作树中已有未提交改动；本报告按当前工作树审查，不回退或归因这些改动。
  - 未修复上述 finding；本 goal 默认记录审查发现，不直接修改 source skill。

下一项 `spec-doc-review`。

#### spec-doc-review

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-doc-review/SKILL.md`
  - `skills/spec-doc-review/references/bulk-preview.md`
  - `skills/spec-doc-review/references/findings-schema.json`
  - `skills/spec-doc-review/references/open-questions-defer.md`
  - `skills/spec-doc-review/references/review-output-template.md`
  - `skills/spec-doc-review/references/subagent-template.md`
  - `skills/spec-doc-review/references/synthesis-and-presentation.md`
  - `skills/spec-doc-review/references/walkthrough.md`
  - `skills/spec-doc-review/references/personas/` 下 7 个 persona prompt assets
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-doc-review/` 下对应 CE 文件集合与 diff
- CE parity: applicable。当前 `spec-doc-review` 保留 CE `ce-doc-review` 的核心 document review 能力，并完成主要 spec-first 投影:
  - 文件集合与 CE baseline 一致，覆盖 `SKILL.md`、`references/*.md`、`references/findings-schema.json` 和 7 个 persona prompt assets。
  - `ce-doc-review` / `ce-unified-plan/v1` / `ce-brainstorm` / `ce-plan-bootstrap` / `ce-plan` / `ce-work` / `ce-code-review` 已投影为 `spec-doc-review`、`spec-unified-plan/v1`、`spec-brainstorm`、`spec-plan-bootstrap`、`spec-plan`、`spec-work`、`spec-code-review`。
  - generic subagents、bounded parallelism、skill-local `references/personas/<reviewer-name>.md` prompt asset 加载、dispatch-time model tiering 和不依赖 platform-level custom-agent registration 的边界保留，位于 `skills/spec-doc-review/SKILL.md:155-163`。
  - subagent payload slots 和 unified artifact section slicing 保留，位于 `skills/spec-doc-review/SKILL.md:165-182`；unified artifacts 不默认把全文传给所有 reviewer。
  - 单个 reviewer failed/timed out 不阻塞整体 review，位于 `skills/spec-doc-review/SKILL.md:221-223`。
  - synthesis pipeline 保留 validate、anchor gate、dedup、same-persona collapse、cross-persona promotion、premise-dependency chain、`safe_auto` / `gated_auto` / `manual` / FYI routing、headless structured envelope 和 user-facing vocabulary，位于 `skills/spec-doc-review/references/synthesis-and-presentation.md:1-416`。
  - interactive walkthrough 保留四选项 routing、per-finding walkthrough、best-judgment bulk path、no-fix guard、Open Questions defer 和 in-memory state，位于 `skills/spec-doc-review/references/walkthrough.md:1-284`。
- 发现:
  1. medium — `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-doc-review/SKILL.md:40`、`/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-doc-review/SKILL.md:46-49` vs `skills/spec-doc-review/SKILL.md:40-44`: CE baseline 在读取文档路径失败或文件不在磁盘时有明确 missing-document gate，要求在任何 persona dispatch 前停止，并分别给 interactive/headless caller 输出缺失路径说明；当前 `spec-doc-review` 只写 “Read it, then proceed.”，且只处理 headless 未传路径，不处理传入路径不可读。影响是用户传入只存在于未 checkout branch 的文档路径时，workflow 可能继续 dispatch persona team，让多个 reviewer 无意义失败，headless caller 也拿不到 deterministic missing-path failure。建议修复方向: 恢复并投影 CE missing-document gate 到 `spec-doc-review` 文案，明确所有 resolved document paths 必须先由 Read 成功确认；补 focused contract test 锁定 unreadable path 不得 dispatch personas。
- 依赖关系验证结果:
  - `spec-plan` 通过 headless `spec-doc-review` review plan artifact，当前 `spec-doc-review` 支持 `mode:headless`，并对 `.html` unified artifacts 明确 report-only / markdown-only mutation skip，位于 `skills/spec-doc-review/SKILL.md:16-36`、`skills/spec-doc-review/SKILL.md:50-55`。
  - `spec-unified-plan/v1` 的 `requirements-only` / `implementation-ready` 分类与 `spec-brainstorm`、`spec-plan` 当前 artifact contract 口径一致，位于 `skills/spec-doc-review/SKILL.md:50-55`。
  - 对 `skills/spec-doc-review` 的 active CE residual 扫描无命中；`rg` 未发现 `ce-*`、`compound-engineering`、`.compound-engineering`、`ce-unified-plan` 或 `/tmp/compound-engineering` 残留。
- 上下文管理验证结果:
  - `SKILL.md` 共 243 行，低于方案建议的 500 行 advisory budget。
  - 重内容下沉到 triggered references: `synthesis-and-presentation.md` 416 行、`walkthrough.md` 284 行、`bulk-preview.md` 128 行、`open-questions-defer.md` 155 行。
  - Persona prompt assets 无 frontmatter/tools，按 skill-local `references/personas/<name>.md` 加载，符合当前 source/runtime 边界。
- 安全 / residual 检查:
  - `node -e "JSON.parse(require('fs').readFileSync('skills/spec-doc-review/references/findings-schema.json','utf8')); console.log('json ok')"` pass，输出 `json ok`。
  - `npx jest tests/unit/spec-doc-review-contracts.test.js --runInBand` degraded: 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于配置中的 `<rootDir>/tests/jest-setup.js` 不存在，未能执行到 `spec-doc-review` focused assertions。
  - `git log --all --name-status -- tests/unit/spec-doc-review-contracts.test.js` 显示该 focused test 在 `98e50159 test(cleanup): 清理过期测试 fixtures、老旧契约测试与开发脚本` 中被删除；本报告不回退该删除，只按当前工作树记录验证能力缺口。
- 未检查 / degraded checks:
  - 未实际运行 `spec-doc-review` 交互、headless review、subagent dispatch、safe-auto document mutation 或 Open Questions defer。
  - 当前缺少可执行 Jest 测试基础设施，无法用 focused test 证明 `spec-doc-review` contract；该全局测试覆盖缺口留到 Phase 3 统一复核。
  - 未修复上述 finding；本 goal 默认记录审查发现，不直接修改 source skill。

下一项 `spec-code-review`。

#### spec-code-review

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-code-review/SKILL.md`
  - `skills/spec-code-review/references/action-class-rubric.md`
  - `skills/spec-code-review/references/cross-model-review.md`
  - `skills/spec-code-review/references/diff-scope.md`
  - `skills/spec-code-review/references/findings-schema.json`
  - `skills/spec-code-review/references/persona-catalog.md`
  - `skills/spec-code-review/references/repo-profile-cache.md`
  - `skills/spec-code-review/references/review-output-template.md`
  - `skills/spec-code-review/references/subagent-template.md`
  - `skills/spec-code-review/references/validator-template.md`
  - `skills/spec-code-review/references/agents/repo-profiler.md`
  - `skills/spec-code-review/references/personas/` 下全部 15 个 persona / local prompt assets
  - `skills/spec-code-review/scripts/cross-model-adversarial-review.sh`
  - `skills/spec-code-review/scripts/repo-profile-cache.py`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/` 下对应 CE 文件集合与 diff
- CE parity: applicable。当前 `spec-code-review` 保留 CE `ce-code-review` 的核心 code review 能力，并完成主要 spec-first 投影:
  - 文件集合与 CE baseline 一致，覆盖 `SKILL.md`、references、persona prompt assets、repo-profiler agent asset 和 2 个 scripts。
  - `ce-code-review`、CE local prompt assets、CE artifact path、`ce-work`、`ce-brainstorm` / `ce-plan`、`ce-unified-plan/v1` 和 `/tmp/compound-engineering` 已投影为 `spec-code-review`、spec-first local prompt assets、`spec-work`、`spec-brainstorm` / `spec-plan`、`spec-unified-plan/v1` 和 `/tmp/spec-first`。
  - `mode:agent` JSON-only report contract、`mode:headless` alias、no blocking prompts、no checkout / no push、PR remote vs local-aligned scope split、remote review 不读 stale workspace 文件、requirements completeness、protected artifacts、small-diff fail-closed gate、bounded subagent dispatch、quote-the-line gate、validator pass、Stage 5c default-mode apply / `mode:agent` no-mutation handoff、run artifacts 与 `review.json` 均保留，位于 `skills/spec-code-review/SKILL.md:19-80`、`skills/spec-code-review/SKILL.md:130-169`、`skills/spec-code-review/SKILL.md:194-316`、`skills/spec-code-review/SKILL.md:423-552`、`skills/spec-code-review/SKILL.md:554-750`。
  - Cross-model adversarial pass 保留 host self-id、peer CLI shell-out、read-only flags、timeout / process-group reap、schema-shaped JSON fold-in 和 non-blocking skip 语义，位于 `skills/spec-code-review/references/cross-model-review.md:1-63`、`skills/spec-code-review/scripts/cross-model-adversarial-review.sh:1-220`。
  - Repo-profile cache 保留 shared `/tmp/spec-first/repo-profile` 路径，并包含当前 `git_unquote` 修复以避免 quoted-path under-invalidation，位于 `skills/spec-code-review/scripts/repo-profile-cache.py:55-174`、`skills/spec-code-review/scripts/repo-profile-cache.py:268-276`。
- 发现:
  1. medium — `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/personas/deployment-verification-agent.md:157` vs `skills/spec-code-review/references/personas/deployment-verification-agent.md:157`: CE baseline 要求 “Every checklist item must name the command or observable signal that proves the step succeeded.”，当前 spec-first prompt 退化为 “Be thorough. Be specific. Produce executable checklists, not vague recommendations.”。影响是高风险数据部署的 checklist 可能重新出现不可验证的泛化项，削弱 deployment notes 作为 review artifact 的 confirmed evidence / operational gate 价值。建议修复方向: 恢复 CE 的每项 checklist 必须带 command 或 observable signal 的硬约束，可保留当前泛化质量提醒作为补充；补 focused prompt contract 或 review-output test 锁定 deployment checklist 的可验证性要求。
- 依赖关系验证结果:
  - 下游 `spec-work` 可通过 `mode:agent` 消费 JSON `actionable_findings`，且 `mode:agent` 明确不 apply / 不输出 markdown 包裹，位于 `skills/spec-code-review/SKILL.md:706-750`。
  - `spec-unified-plan/v1` 的 plan completeness 分类与 `spec-brainstorm` / `spec-plan` 当前 artifact readiness 口径一致，位于 `skills/spec-code-review/SKILL.md:144-169`。
  - `docs/brainstorms/`、`docs/plans/`、`docs/solutions/` 被声明为 protected artifacts，避免 reviewer 把 pipeline artifacts 当 cleanup target，位于 `skills/spec-code-review/SKILL.md:134-142`。
  - `learnings-researcher` 的 module pre-filter 从 CE `compound-engineering` 投影为 `spec-first`，位于 `skills/spec-code-review/references/personas/learnings-researcher.md:77-80`。
- 上下文管理验证结果:
  - `SKILL.md` 共 837 行，超过方案建议的 500 行 advisory budget；本轮不把行数本身计为 finding，因为该文件承载 scope detection、remote-safety、dispatch、synthesis、validator、apply 和 JSON handoff 等主执行合同。后续若要瘦身，应优先把非入口判断的长段落继续下沉到 references，并用 focused tests / fresh-source eval 锁住边界。
  - References 全部按 stage 触发加载，且 `SKILL.md:822-837` 明确不要重新引入 `@` eager includes。
  - Persona prompt assets 和 repo-profiler agent asset 均为 skill-local source，不依赖 generated runtime mirrors 或 platform-level custom-agent registration。
- 安全 / residual 检查:
  - Active CE residual scan 对 `skills/spec-code-review` 无命中。
  - `bash -n skills/spec-code-review/scripts/cross-model-adversarial-review.sh` pass。
  - `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-code-review/scripts/repo-profile-cache.py` pass。
  - `node -e "JSON.parse(require('fs').readFileSync('skills/spec-code-review/references/findings-schema.json','utf8')); console.log('json ok')"` pass，输出 `json ok`。
  - `npx jest tests/unit/spec-code-review-contracts.test.js --runInBand` degraded: 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于 `<rootDir>/tests/jest-setup.js` 不存在，未能执行到 `spec-code-review` focused assertions。
- 未检查 / degraded checks:
  - 未实际运行 `spec-code-review` review、PR remote fetch、cross-model peer CLI、subagent dispatch、validator wave、Stage 5c default apply 或 `mode:agent` JSON parse consumer。
  - 当前缺少可执行 Jest 测试基础设施，无法用 focused test 证明 `spec-code-review` contract；该全局测试覆盖缺口留到 Phase 3 统一复核。
  - 未修复上述 finding；本 goal 默认记录审查发现，不直接修改 source skill。

下一项 `spec-work`。

#### spec-work

- Tier: A
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-work/SKILL.md`
  - `skills/spec-work/references/execution-engines.md`
  - `skills/spec-work/references/non-code-execution.md`
  - `skills/spec-work/references/review-findings-followup.md`
  - `skills/spec-work/references/shipping-workflow.md`
  - `skills/spec-work/references/tracker-defer.md`
  - `skills/spec-work/references/agents/figma-design-sync.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-work/` 下对应 CE 文件清单与 diff
- CE parity: applicable。文件集合与 CE baseline 一致。当前 divergence 均为预期 spec-first 投影或已解释的 host scope 收敛:
  - `artifact_contract` 从 `ce-unified-plan/v1` 投影为 `spec-unified-plan/v1`，requirements-only artifact 必须先交给 `spec-plan`，implementation-ready + `execution: code` 才继续执行，位于 `skills/spec-work/SKILL.md:29-37`。
  - bare-prompt 大任务 handoff 从 `/ce-brainstorm` / `/ce-plan` 投影为 `spec-brainstorm` / `spec-plan`，位于 `skills/spec-work/SKILL.md:47-53`。
  - plan 是 decision artifact，`spec-work` 不编辑 plan body，进度由 git/task tracker/envelope 承载，位于 `skills/spec-work/SKILL.md:61-73`。
  - execution engine 文档保留 inline/subagent、goal-mode、dynamic-workflow 三类选择，并明确 engine 不拥有 shipping tail；Codex `create_goal` 只用于 standalone，不用于 return-to-caller，位于 `skills/spec-work/SKILL.md:142-144` 与 `skills/spec-work/references/execution-engines.md:1-19`、`skills/spec-work/references/execution-engines.md:39-48`、`skills/spec-work/references/execution-engines.md:72-85`。
  - parallel safety、harness-owned isolation、bounded unit packet、worker verification evidence 和 orchestrator-owned commit / integration contract 保留，位于 `skills/spec-work/SKILL.md:154-195`。
  - quality tail 投影为 `spec-simplify-code`、`spec-code-review`、`spec-commit-push-pr` / `spec-commit`，shipping workflow 中 `mode:agent` review-only + caller-owned apply/fix + Residual Work Gate 路径保留，位于 `skills/spec-work/SKILL.md:351-361`、`skills/spec-work/references/shipping-workflow.md:27-57` 和 `skills/spec-work/references/review-findings-followup.md:1-65`。
  - Return-to-Caller Mode 保留 `status`、`changed_files`、`u_ids_*`、`verification_results`、`verification_evidence`、`behavior_change` 与 `standalone_shipping_skipped: true` envelope，并要求行为变更必须有 verification evidence 或 deliberate exception，位于 `skills/spec-work/SKILL.md:363-391`。
- 发现: 未发现迁移阻断问题。
- 依赖关系验证结果:
  - `spec-lfg` 对 `spec-work mode:return-to-caller <plan-path>` 的调用要求与 `spec-work` envelope 字段匹配，位于 `skills/spec-lfg/SKILL.md:18-22` 与 `skills/spec-work/SKILL.md:371-384`。
  - `spec-code-review` 的默认交互模式可 Stage 5c apply safe fixes，但 `spec-work` shipping path 通过 `mode:agent` 调用，并在 `review-findings-followup.md:5` 明确“在此上下文 review-only，caller owns apply/fix policy”。因此本轮不把 `spec-work/SKILL.md:357` 的简化表述单独计为 confirmed issue；该跨 skill mode 契约仍留到 Phase 3 pipeline/context 端到端复核。
  - `tracker-defer.md` 的 residual filing reference 已投影到 `/tmp/spec-first/spec-code-review/<run-id>/` artifact path 和 `spec-code-review` caller 边界；未发现 active CE path residual。
- 上下文管理验证结果:
  - `SKILL.md` 共 432 行，低于方案建议的 500 行 advisory budget；reference 总量 1091 行，但按 Phase 0 knowledge-work、Phase 1 engine selection、Phase 3-4 shipping tail、review follow-up、tracker defer 和 Figma sync 触发加载。
  - unified plan 大文档读取策略使用 heading map + active U-ID bounded read，不要求 worker 读取 whole plan，位于 `skills/spec-work/SKILL.md:61-62` 与 `skills/spec-work/SKILL.md:169-174`。
  - return-to-caller 明确不发 copyable goal/workflow prompt，避免 caller-owned tail 被手动 paste 步骤 stranded，位于 `skills/spec-work/SKILL.md:386-391` 与 `skills/spec-work/references/execution-engines.md:43-48`。
- 安全 / residual 检查:
  - Active CE residual scan 对 `skills/spec-work` 无命中。
  - `diff -ru /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-work skills/spec-work` 只显示预期的 `ce-*` -> `spec-*`、`ce-unified-plan/v1` -> `spec-unified-plan/v1`、`/tmp/compound-engineering` -> `/tmp/spec-first`、badge / host question-tool list 收敛、以及删除 Pi / Antigravity 等非当前 supported host 示例。
  - 该 skill 没有 `scripts/` 目录，因此无 Bash/Python 语法检查项。
- 未检查 / degraded checks:
  - 未实际运行 `spec-work`、`spec-lfg` pipeline、subagent dispatch、goal-mode、dynamic-workflow、`spec-code-review mode:agent` JSON consumer、Residual Work Gate 或 PR shipping tail；本轮只验证 source contract、CE parity 和跨 skill 静态引用。
  - `npx jest tests/unit/spec-work-contracts.test.js --runInBand` degraded: 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于 `<rootDir>/tests/jest-setup.js` 不存在，未执行到该 suite。
  - 当前缺少可执行 Jest 测试基础设施，无法用 focused test 证明 `spec-work` contract；该全局测试覆盖缺口留到 Phase 3 统一复核。

下一项 `spec-ideate`。

#### spec-ideate

- Tier: A
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-ideate/SKILL.md`
  - `skills/spec-ideate/references/divergent-ideation.md`
  - `skills/spec-ideate/references/html-rendering.md`
  - `skills/spec-ideate/references/ideation-sections.md`
  - `skills/spec-ideate/references/markdown-rendering.md`
  - `skills/spec-ideate/references/post-ideation-workflow.md`
  - `skills/spec-ideate/references/repo-profile-cache.md`
  - `skills/spec-ideate/references/universal-ideation.md`
  - `skills/spec-ideate/references/web-research-cache.md`
  - `skills/spec-ideate/references/agents/` 下全部 5 个 local prompt assets
  - `skills/spec-ideate/scripts/repo-profile-cache.py`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/` 下对应 CE 文件清单与 diff
- CE parity: applicable。除本小节记录的 ignored bytecode 产物外，文件集合与 CE baseline 一致。核心能力和 spec-first 投影保留:
  - `ce-ideate` -> `spec-ideate`、`ce-brainstorm` -> `spec-brainstorm`、`ce-plan` -> `spec-plan`，且 ideation 明确不产出 requirements / plan / code，位于 `skills/spec-ideate/SKILL.md:12-18`。
  - output mode exclusive contract、默认 HTML、active `ideate_output` config、pipeline 强制 markdown、`output:` token parsing 与不自动传播到 `spec-brainstorm` 保留，位于 `skills/spec-ideate/SKILL.md:64-89`。
  - subject-identification gate、surprise-me、mode classification、elsewhere non-software routing 和 context-substance gate 保留，位于 `skills/spec-ideate/SKILL.md:115-203`。
  - scratch path 已从 `/tmp/compound-engineering/ce-ideate/<run-id>` 投影为 `/tmp/spec-first/spec-ideate/<run-id>`，位于 `skills/spec-ideate/SKILL.md:253-260`、`skills/spec-ideate/references/web-research-cache.md:21-30` 和 `skills/spec-ideate/references/post-ideation-workflow.md:52-60`。
  - Phase 2 divergent ideation 的 fleet、cache-friendly grounding payload、basis requirement、axis coverage recovery 和 raw candidate checkpoint 保留，位于 `skills/spec-ideate/references/divergent-ideation.md:5-32`、`skills/spec-ideate/references/divergent-ideation.md:55-89`。
  - Phase 3 fresh-context verifier、automatic deliverable write、concise summary、Phase 5 next-step menu、Proof / `spec-brainstorm` handoff 和 no direct-to-implementation guard 保留，位于 `skills/spec-ideate/references/post-ideation-workflow.md:5-33`、`skills/spec-ideate/references/post-ideation-workflow.md:42-120`。
  - artifact section contract 保持 ideation 是 human-facing discovery document、无 status lifecycle、ranked ideas 带 basis/rationale/downsides/confidence/complexity，位于 `skills/spec-ideate/references/ideation-sections.md:13-39`、`skills/spec-ideate/references/ideation-sections.md:53-74`。
- 发现:
  1. low — `skills/spec-ideate/scripts/__pycache__/repo-profile-cache.cpython-312.pyc`、`.gitignore:50`: `spec-ideate` source skill 目录中存在 Python bytecode 产物，`diff -ru /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate skills/spec-ideate` 显示 `Only in skills/spec-ideate/scripts: __pycache__`；`git status --ignored --short -- skills/spec-ideate/scripts/__pycache__/repo-profile-cache.cpython-312.pyc` 显示 `!! skills/spec-ideate/scripts/__pycache__/`，`git ls-files` 无输出，说明它被忽略且未被 git 跟踪。影响是 source inventory / 人工 parity 审查会看到 generated artifact，增加误判和打包卫生风险；当前不构成 tracked source regression。建议修复方向: 清理本地 `skills/spec-ideate/scripts/__pycache__/`，并在 Phase 3 全局 source hygiene 检查中统一确认所有 source skill 目录没有 ignored bytecode 产物。
- 依赖关系验证结果:
  - `spec-ideate` 只把一个幸存 idea 交给 `spec-brainstorm`，并构造 substance seed + provenance pointer，不直接交给 `spec-plan` 或 `spec-work`，位于 `skills/spec-ideate/references/post-ideation-workflow.md:110-120`。
  - `spec-proof` 仅在 markdown 输出的 Publish to Proof 选项中触发，HTML 是本地 canonical artifact，位于 `skills/spec-ideate/references/post-ideation-workflow.md:100-108`。
  - `repo-profile-cache.py` 与 `repo-profile-cache.md` 使用 `/tmp/spec-first/repo-profile`，并包含当前 `git_unquote` 修复，位于 `skills/spec-ideate/scripts/repo-profile-cache.py:25-58`、`skills/spec-ideate/scripts/repo-profile-cache.py:177-221` 和 `skills/spec-ideate/references/repo-profile-cache.md:25-63`。
- 上下文管理验证结果:
  - `SKILL.md` 共 414 行，低于方案建议的 500 行 advisory budget；总 source 3142 行，主要长文件为 HTML / Markdown rendering reference，且 `SKILL.md:87` 明确到 write time 才加载 `ideation-sections.md` 与对应 rendering reference。
  - Phase 2 必须加载 `divergent-ideation.md`，Phase 2 完成后才加载 `post-ideation-workflow.md`，位于 `skills/spec-ideate/SKILL.md:410-414`；该分段避免把渲染和后处理细节提前塞进 grounding/ideation dispatch。
  - evidence dossiers、web research cache 和 survivor/raw candidate checkpoints 都在 `<scratch-dir>` 下传递，不要求主会话读回大文件内容，位于 `skills/spec-ideate/SKILL.md:253-260`、`skills/spec-ideate/references/divergent-ideation.md:16-32`、`skills/spec-ideate/references/divergent-ideation.md:87-89` 和 `skills/spec-ideate/references/post-ideation-workflow.md:46-59`。
- 安全 / residual 检查:
  - Active CE residual scan 对 `skills/spec-ideate` 无命中。
  - `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-ideate/scripts/repo-profile-cache.py` pass。
  - `repo-profile-cache.py` 使用固定 argv `git` 调用且无 `shell=True`，cache 写入使用 `tempfile.mkstemp` + `os.replace` 原子替换，相关实现位于 `skills/spec-ideate/scripts/repo-profile-cache.py:224-234` 和 `skills/spec-ideate/scripts/repo-profile-cache.py:415-438`。
- 未检查 / degraded checks:
  - 未实际运行 `spec-ideate`、web research、issue intelligence、Slack research、subagent dispatch、HTML/Markdown rendering、Proof publish 或 `spec-brainstorm` handoff；本轮只验证 source contract、CE parity、静态依赖和脚本语法。
  - `npx jest tests/unit/spec-ideate-contracts.test.js --runInBand` degraded: 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于 `<rootDir>/tests/jest-setup.js` 不存在，未执行到该 suite。
  - 未清理 ignored `__pycache__`；本 goal 默认记录审查发现，不直接修改 source skill。

下一项 `spec-lfg`。

#### spec-lfg

- Tier: A
- 状态: done
- Verdict: pass
- 已读取 source 文件:
  - `skills/spec-lfg/SKILL.md`
  - `skills/spec-lfg/references/review-followup.md`
  - `skills/spec-lfg/references/tracker-defer.md`
  - `/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/` 下对应 CE 文件清单与 diff
  - `skills/spec-work/SKILL.md` 的 Return-to-Caller Mode 片段
  - `skills/spec-work/references/execution-engines.md` 的 tail ownership / return-to-caller 片段
  - `skills/spec-test-browser/SKILL.md` 与 `skills/spec-test-browser/references/pipeline-orchestration.md` 的 pipeline mode 命中
  - `skills/spec-commit-push-pr/SKILL.md` 与 `skills/spec-commit-push-pr/references/pr-description-writing.md` 的 pipeline / `New concepts:` 命中
- CE parity: applicable。文件集合与 CE baseline 一致。差异均为预期投影:
  - `lfg` -> `spec-lfg` identity projection，位于 `skills/spec-lfg/SKILL.md:2`。
  - plugin namespace 示例从 `compound-engineering:ce-plan` 投影为 `spec-first:spec-plan`，位于 `skills/spec-lfg/SKILL.md:10`。
  - Pipeline steps 从 `ce-plan`、`ce-work`、`ce-simplify-code`、`ce-code-review`、`ce-test-browser`、`ce-commit-push-pr` 投影为对应 `spec-*` skill，位于 `skills/spec-lfg/SKILL.md:12-72`。
  - Plan metadata gate 从 `artifact_contract: ce-unified-plan/v1` 投影为 `artifact_contract: spec-unified-plan/v1`，且仍只接受 `artifact_readiness: implementation-ready` + `execution: code`，位于 `skills/spec-lfg/SKILL.md:16`。
  - `spec-work` return-to-caller retry、review-only `mode:agent`、shipping precondition、residual durable sink、CI autofix loop 和 DONE promise 保留，位于 `skills/spec-lfg/SKILL.md:18-127`。
  - `tracker-defer.md` 将 code-review artifact path 从 `/tmp/compound-engineering/ce-code-review/<run-id>/` 投影为 `/tmp/spec-first/spec-code-review/<run-id>/`，位于 `skills/spec-lfg/references/tracker-defer.md:97-102`。
  - CE baseline 末尾 `/ce-explain` follow-up 已投影为 `spec-explain`，位于 `skills/spec-lfg/SKILL.md:127`。
- 发现: 无新增已确认问题。
- 依赖关系验证结果:
  - `spec-work mode:return-to-caller <plan-path>` 调用方要求的 envelope 字段与被调用方 `Return-to-Caller Mode` 返回字段匹配: `status`、`plan_path`、`changed_files`、`u_ids_attempted`、`u_ids_completed`、`verification_results`、`verification_evidence`、`blockers`、`behavior_change`、`standalone_shipping_skipped: true`，位于 `skills/spec-lfg/SKILL.md:18-22` 与 `skills/spec-work/SKILL.md:371-384`。
  - `spec-work` 明确 return-to-caller 不运行 simplify/review/PR/CI tail，caller owns tail；这与 `spec-lfg` step 3-9 的 caller-owned shipping pipeline 一致，位于 `skills/spec-work/references/execution-engines.md:79-85`。
  - `spec-code-review mode:agent` review-only + LFG apply fixes 的合同与 `review-followup.md` 一致，位于 `skills/spec-lfg/SKILL.md:30-40` 和 `skills/spec-lfg/references/review-followup.md:1-44`。
  - `spec-test-browser mode:pipeline` 与 `spec-commit-push-pr mode:pipeline` 调用字符串存在；被调用方 pipeline 语义不完整已分别在 `spec-test-browser` 和 `spec-commit-push-pr` 小节计为 high/medium，本小节不重复计数。
  - `New concepts:` trailer 消费仍在 `spec-lfg` step 8/10 中存在；producer/consumer 悬空问题已在 `spec-commit-push-pr` 小节计为 medium，本小节不重复计数。
- 上下文管理验证结果:
  - `SKILL.md` 共 129 行，reference 总计 193 行，整体 322 行，低于方案建议的 500 行 advisory budget。
  - `references/review-followup.md` 只在 step 5 加载；`references/tracker-defer.md` 只在 step 6 residual handoff 需要时以 non-interactive mode 加载，位于 `skills/spec-lfg/SKILL.md:38-47`。
  - Tracker defer non-interactive mode 明确跳过 blocking questions，并将无 durable tracker 时的结果返回 `no_sink` 交由 LFG 写入 PR body 或 fallback file，位于 `skills/spec-lfg/references/tracker-defer.md:19-28`。
- 安全 / residual 检查:
  - Active CE residual scan 对 `skills/spec-lfg` 无命中。
  - `git status --ignored --short -- skills/spec-lfg` 无输出，未发现本地 ignored artifact 污染该 source skill 目录。
  - `spec-lfg` 自身不含 scripts；Phase 1 shell/Python 语法检查不适用。
  - Git/gh mutation 均位于 pipeline steps 中，且有 no-remote shipping precondition 和 PR body `--body-file` temp-file path，位于 `skills/spec-lfg/SKILL.md:36-64` 与 `skills/spec-lfg/SKILL.md:74-123`。
- 未检查 / degraded checks:
  - 未实际运行完整 `spec-lfg` hands-off pipeline、`spec-plan`、`spec-work`、`spec-simplify-code`、`spec-code-review`、`spec-test-browser`、`spec-commit-push-pr`、`gh` PR/CI 操作或 DONE promise；本轮只验证 source contract、CE parity 和跨 skill 静态引用。
  - `npx jest tests/unit/spec-sweep-lfg-migration-contracts.test.js --runInBand` degraded: 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于 `<rootDir>/tests/jest-setup.js` 不存在，未执行到该 suite。
  - `spec-lfg` pipeline 是否能端到端 hands-off 成功仍受已记录的 `spec-test-browser mode:pipeline` 和 `spec-commit-push-pr mode:pipeline` 下游问题影响；这些不是 `spec-lfg` 新增迁移 regression。

下一项 `spec-prd`。

### Batch 5

#### spec-prd

- Tier: C
- 状态: done
- Verdict: issues_found
- 已读取 source 文件:
  - `skills/spec-prd/SKILL.md`
  - `skills/spec-prd/references/evidence-and-topology.md`
  - `skills/spec-prd/references/domain-language-and-decision-ledger.md`
  - `skills/spec-prd/references/grill-with-docs-integration.md`
  - `skills/spec-prd/references/product-expert-lens.md`
  - `skills/spec-prd/references/design-source-evidence.md`
  - `skills/spec-prd/references/large-input-checkpoint.md`
  - `skills/spec-prd/references/prd-output-template.md`
  - `skills/spec-prd/references/prd-readiness-lens.md`
  - `skills/spec-prd/references/evaluation-governance.md`
  - `skills/spec-prd/scripts/check-prd-artifact.js`
  - `skills/spec-prd/scripts/finalize-prd-artifact.js`
  - `skills/spec-prd/scripts/run-evals.js`
  - `skills/spec-prd/scripts/check-glossary-drift.js`
  - `skills/spec-prd/scripts/lib/reason-codes.js`
  - `skills/spec-prd/evals/examples.json`
  - cross-skill consumer spot check: `skills/spec-plan/SKILL.md`
- CE parity: not_applicable。`spec-prd` 是 spec-first 原生 / 拆分 PRD workflow，不做 CE 等价要求；本轮按 source 质量、artifact contract、脚本确定性、跨 skill handoff 和治理边界审查。
- 正向结论:
  - PRD artifact topology 明确固定为 `docs/brainstorms/*-requirements.md` + `artifact_kind: prd-requirements`，并禁止 `docs/prds/`、实现计划、代码实现和 generated runtime mirror 编辑，位于 `skills/spec-prd/SKILL.md:18`。
  - Source/runtime 边界和 Codex degraded guard 说清楚: Claude 有 `prd-prewrite-guard`，Codex 无等价 managed prewrite/Stop hook，必须依赖 producer finalize 与 consumer verify discipline，不伪称等价硬 gate，位于 `skills/spec-prd/SKILL.md:20`、`skills/spec-prd/SKILL.md:236-238`。
  - Project graph / code graph 候选被明确标为 advisory `provider_untrusted`，必须回源确认，位于 `skills/spec-prd/SKILL.md:75-77`。
  - Reference Trigger Map 覆盖 9 个 reference，避免把长上下文全部常驻加载，位于 `skills/spec-prd/SKILL.md:115-127`。
  - Readiness / finalize gate 把脚本事实与 LLM readiness 判断分开: `finalize-prd-artifact.js` 写入或验证 machine-owned receipt，`check-prd-artifact.js` 产出 `spec-prd-artifact-check.v1` facts，LLM 不手填 `readiness_verified_*` 字段，位于 `skills/spec-prd/SKILL.md:278-290`、`skills/spec-prd/references/prd-output-template.md:317-340`、`skills/spec-prd/references/prd-readiness-lens.md:37-41`。
  - Eval fixture 当前通过，`node skills/spec-prd/scripts/run-evals.js --json` 输出 `schema_version: spec-prd-eval-run.v1`、`status: passed`、`case_count: 111`、`missing_required_buckets: []`、`invalid_cases: []`。
- 发现:
  1. medium — `skills/spec-prd/SKILL.md:238`、`skills/spec-prd/SKILL.md:289`、`skills/spec-prd/references/prd-readiness-lens.md:37-41`、`skills/spec-prd/scripts/finalize-prd-artifact.js:157-226` vs `skills/spec-plan/SKILL.md:161-167`: `spec-prd` producer 明确把 current-source finalize receipt 和 `spec-plan` consumer `--verify-receipt` 作为 mandatory handoff discipline，且 `finalize-prd-artifact.js --help` 暴露 `--verify-receipt` 为 consumer-only read check；但 `spec-plan` 对 `docs/brainstorms/*-requirements.{md,html}` 仍只按 legacy origin 读取并写入新 unified plan，未要求检查 `artifact_kind: prd-requirements`、`readiness_verified_by`、`readiness_checker_schema`、hash receipt 或 `can_enter_spec_plan: yes`。影响是一个未 finalize、receipt stale 或 `can_enter_spec_plan: no` 的 PRD artifact 仍可能被 `spec-plan` 当成可规划输入消费，削弱 `spec-prd` 为防止 planning invent WHAT 建立的 producer/consumer handoff gate。建议修复方向: 在 `spec-plan` 0.2 legacy requirements input 分支中识别 `artifact_kind: prd-requirements`，调用当前 source/runtime `finalize-prd-artifact.js --verify-receipt` 或等价只读检查；验证失败时要求回到 `spec-prd` revise/ask-owner/finalize，而不是直接创建 implementation plan；同时补 focused contract test 锁定 `spec-plan` 消费 PRD artifact 前必须检查 receipt。
- 非计数观察:
  - `can_enter_spec-plan` / `can_enter_spec_plan` 拼写在 prose 中同时出现，但 `check-prd-artifact.js:1073` 使用 `can_enter_spec[-_]?plan` 兼容两者，模板 canonical 字段为 `can_enter_spec_plan`，位于 `skills/spec-prd/references/prd-output-template.md:332`。本轮不计为独立问题；若后续修文案，可统一为 underscore 以降低阅读摩擦。
- 依赖关系验证结果:
  - `spec-plan`、`spec-doc-review`、`spec-brainstorm`、`spec-app-consistency-audit`、`spec-work`、`spec-debug` 均为存在的公开 workflow / skill 引用。
  - `spec-prd` producer-local ready receipt contract 自身清晰；消费端 `spec-plan` verify 缺口已作为 medium finding 计入。
  - `reason-codes.js` 中 blocking reason code 被 readiness lens 消费，未发现 active CE namespace 残留。
- 上下文管理验证结果:
  - `SKILL.md` 共 293 行，低于方案建议的 500 行入口预算；长内容下沉到 references、scripts 和 evals。
  - Reference trigger map 按输入类型加载，`evaluation-governance.md` 明确只在治理或生命周期问题时加载，不参与普通 PRD authoring。
- 安全 / residual 检查:
  - `for f in skills/spec-prd/scripts/*.js skills/spec-prd/scripts/lib/*.js; do node --check "$f" || exit 1; done` pass。
  - `node skills/spec-prd/scripts/check-prd-artifact.js --help` pass。
  - `node skills/spec-prd/scripts/finalize-prd-artifact.js --help` pass，并显示 `--verify-receipt` consumer-only read check。
  - `node skills/spec-prd/scripts/run-evals.js --json` pass，111 个 fixture case 通过。
  - Active CE residual scan 仅命中 `Workflow Contract Summary`、`dispatch_authorization_missing` reason code 和 eval 中的 negative `task-pack` case，均为允许命中。
  - `git status --ignored --short -- skills/spec-prd` 无输出，未发现 ignored artifact 污染 source skill 目录。
- 未检查 / degraded checks:
  - 未实际运行 `spec-prd` 交互式 PRD authoring/refinement、Claude `prd-prewrite-guard`、Stop hook、或 `spec-plan` 真实消费 PRD artifact；本轮只验证 current source contract、scripts/evals 和静态 cross-skill handoff。
  - 未运行 focused Jest suite；当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 配置仍引用 `<rootDir>/tests/jest-setup.js`，本轮 changelog-format 验证会在测试基础设施缺失处 degraded。

下一项 `spec-write-tasks`。

## 全局交叉验证

| 区域 | 状态 | 备注 |
|---|---|---|
| Plan artifact contract 链路端到端 | pending | Phase 3 |
| Knowledge lifecycle schema 一致性 | pending | Phase 3 |
| Config key 完整性 | pending | Phase 3 |
| Pipeline 上下文传递完整性 | pending | Phase 3 |
| 常驻上下文排除纪律 | pending | 上下文扫描已产出 advisory hits |
| 测试覆盖缺口 | pending | Phase 3 |
| 共享脚本 divergence | pending | Phase 3 |

## 汇总指标

| 严重程度 | 数量 |
|---|---:|
| critical | 0 |
| high | 2 |
| medium | 18 |
| low | 8 |
| info | 0 |

当前状态: 已确认 2 个 high、18 个 medium、8 个 low 问题；涉及 `spec-commit-push-pr` / `spec-lfg` pipeline 合同、`New concepts:` trailer 合同、`spec-optimize` schema validation 口径、`spec-resolve-pr-feedback` focused tests 与当前 source contract 漂移、`spec-test-browser` pipeline no-ask 语义和 internal helper frontmatter、`spec-worktree` existing-ref / PR isolation 合同缺失、`spec-debug` source skill 目录存在 ignored `__pycache__` 产物，`spec-compound` / `spec-compound-refresh` 中文 frontmatter locale 失败、Knowledge Track template category 覆盖不全、ignored `__pycache__` 产物，`spec-compound-refresh` 的 legacy `plugin AGENTS.md` wording，`spec-sweep` first-run interview 写入清单漏列 `sweep_lease_ttl_minutes`，`spec-mcp-setup` 的 product-pulse config key 漏列、`ideate_output` active/reserved 分类漂移、Cursor provider readiness host fallback 和 untracked registry-loader source-like 文件，`spec-riffrec-feedback-analysis` 对 `spec-brainstorm` durable output 目录的 `docs/brainstorms/` vs `docs/plans/` 合同漂移，`spec-product-pulse` report-template top-N error count 与当前不可配置合同矛盾，`spec-brainstorm` 共享 repo-profile reference parity 与 Markdown 结构漂移问题，`spec-plan` focused migration contract 对 CE `reasoning-elevation.md` 的 file-set 断言与当前 source divergence 不一致，`spec-doc-review` 迁移时丢失 CE missing-document gate，`spec-code-review` deployment checklist 可验证性约束退化，`spec-ideate` source skill 目录存在 ignored `__pycache__` 产物，以及 `spec-prd` producer finalize receipt 与 `spec-plan` consumer verify-receipt handoff 缺口。`spec-lfg` 本轮未新增计数，但其端到端 pipeline 仍受已记录的下游 `mode:pipeline` 风险影响。

## 验证命令记录

已执行命令见 `Phase 1 全覆盖自动化扫描`。最终 closeout 会在 Phase 2 和 Phase 3 之后重跑必要验证，或明确说明未重跑/未覆盖的原因。

### 增量验证（2026-07-10 12:22:24 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 12:26:57 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 12:32:38 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 12:35:59 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 12:40:05 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 13:40:07 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-sweep Python 语法 | `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-sweep/scripts/sweep-state.py skills/spec-sweep/scripts/analyze_riffrec_zip.py` | pass | 无输出 |
| spec-sweep focused contracts | `npx jest tests/unit/spec-sweep-lfg-migration-contracts.test.js tests/unit/mcp-setup-config-template-contracts.test.js tests/unit/migrated-skill-scripts-contracts.test.js --runInBand` | pass | 3 个 suites / 17 个 tests 通过 |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 13:50:16 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-mcp-setup preflight JSON | `bash skills/spec-mcp-setup/scripts/check-health --json` | pass | 输出 `spec-mcp-setup-preflight.v2`，本机 setup facts/runtime capabilities 为 ready，generated runtime manifest 为 current；provider readiness 仍按 advisory 处理 |
| spec-mcp-setup focused contracts | `npx jest tests/unit/mcp-setup-config-template-contracts.test.js tests/unit/browser-helper-tool-contracts.test.js tests/unit/mcp-setup-powershell-contracts.test.js tests/unit/registry-loader-v7-contracts.test.js --runInBand` | pass | 4 个 suites / 51 个 tests 通过；`browser-helper-tool-contracts` 期间出现 runtime drift reset warning，属于 test fixture 输出 |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 13:58:30 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-riffrec analyzer syntax | `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py` | pass | 无输出 |
| spec-riffrec analyzer help | `python3 skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py --help` | pass | 输出帮助文本，同时暴露已记录的 `docs/brainstorms/` durable output wording 漂移 |
| spec-riffrec / brainstorm focused contracts | `npx jest tests/unit/migrated-skill-scripts-contracts.test.js tests/unit/spec-migrated-standalone-skills-contracts.test.js tests/unit/spec-brainstorm-contracts.test.js --runInBand` | issues_found | `spec-brainstorm-contracts` 与 `spec-migrated-standalone-skills-contracts` 通过；`migrated-skill-scripts-contracts` 失败在当前工作树 `skills/spec-code-review/scripts/cross-model-adversarial-review.sh` / `repo-profile-cache.py` 缺失，与本轮 `spec-riffrec-feedback-analysis` 审查不同面，但作为当前验证事实记录 |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 14:09:18 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-product-pulse focused contracts | `npx jest tests/unit/spec-migrated-standalone-skills-contracts.test.js tests/unit/mcp-setup-config-template-contracts.test.js --runInBand` | pass | 2 个 suites / 13 个 tests 通过；未覆盖已记录的 report-template top-N 自相矛盾 |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 14:16:39 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-brainstorm focused contract | `npx jest tests/unit/spec-brainstorm-contracts.test.js --runInBand` | pass | 4 个测试通过 |
| spec-brainstorm script syntax | `node --check skills/spec-brainstorm/scripts/visual-probe-server.js` | pass | 无输出 |
| spec-brainstorm repo-profile Python syntax | `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-brainstorm/scripts/repo-profile-cache.py` | pass | 无输出 |
| spec-brainstorm source whitespace | `git diff --check -- skills/spec-brainstorm tests/unit/spec-brainstorm-contracts.test.js` | pass | 无输出 |
| spec-brainstorm + shared focused contracts | `npx jest tests/unit/spec-brainstorm-contracts.test.js tests/unit/migrated-skill-scripts-contracts.test.js tests/unit/repo-profile-cache-parity.test.js --runInBand` | issues_found | `spec-brainstorm-contracts` 通过；`migrated-skill-scripts-contracts` 因当前工作树 `spec-code-review/scripts` 缺失既有脚本失败；`repo-profile-cache-parity` 暴露 shared reference divergence 与同一 `spec-code-review` ENOENT |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 14:27:54 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-plan focused contract | `npx jest tests/unit/spec-plan-contracts.test.js --runInBand` | issues_found | 5 个测试中 4 个通过；file-set parity 失败在当前 spec source 缺少 CE `references/reasoning-elevation.md`，已记录为 `spec-plan` medium finding |
| spec-plan repo-profile Python syntax | `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-plan/scripts/repo-profile-cache.py` | pass | 无输出 |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 14:40:26 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-doc-review schema JSON | `node -e "JSON.parse(require('fs').readFileSync('skills/spec-doc-review/references/findings-schema.json','utf8')); console.log('json ok')"` | pass | 输出 `json ok` |
| spec-doc-review active CE residual scan | `rg -n "\bce-\|compound-engineering\|\.compound-engineering\|ce-unified-plan\|/tmp/compound-engineering\|CLAUDE_SKILL_DIR\|/spec:\|\$spec-\|task-pack\|dispatch_authorization_missing\|Workflow Contract Summary\|docs/contracts/context-governance.md\|review-finding.v1" skills/spec-doc-review` | pass | 无输出 |
| spec-doc-review focused contract | `npx jest tests/unit/spec-doc-review-contracts.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于 `<rootDir>/tests/jest-setup.js` 不存在，未执行到该 suite |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 配置仍引用 `<rootDir>/tests/jest-setup.js`，命令失败在 setupFiles 缺失 |

### 增量验证（2026-07-10 14:44:56 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-code-review active CE residual scan | `rg -n "\bce-\|compound-engineering\|\.compound-engineering\|ce-unified-plan\|/tmp/compound-engineering\|CLAUDE_SKILL_DIR\|/spec:\|\$spec-\|task-pack\|dispatch_authorization_missing\|Workflow Contract Summary\|review-finding.v1\|Gemini\|Antigravity\|\bPi\b\|agy\|ask_question\|ask_user" skills/spec-code-review` | pass | 无输出 |
| spec-code-review cross-model Bash syntax | `bash -n skills/spec-code-review/scripts/cross-model-adversarial-review.sh` | pass | 无输出 |
| spec-code-review repo-profile Python syntax | `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-code-review/scripts/repo-profile-cache.py` | pass | 无输出 |
| spec-code-review schema JSON | `node -e "JSON.parse(require('fs').readFileSync('skills/spec-code-review/references/findings-schema.json','utf8')); console.log('json ok')"` | pass | 输出 `json ok` |
| spec-code-review focused contract | `npx jest tests/unit/spec-code-review-contracts.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于 `<rootDir>/tests/jest-setup.js` 不存在，未执行到该 suite |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 配置仍引用 `<rootDir>/tests/jest-setup.js`，命令失败在 setupFiles 缺失 |

### 增量验证（2026-07-10 15:03:14 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-work active CE residual scan | `rg -n "\bce-\|compound-engineering\|\.compound-engineering\|ce-unified-plan\|/tmp/compound-engineering\|/ce-\|ce-work\|ce-code-review\|ce-plan\|ce-lfg\|ce-simplify-code\|ce-commit" skills/spec-work` | pass | 无输出 |
| spec-work file set | `find skills/spec-work -type f \| sort` 和 `find /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-work -type f \| sort` | pass | 文件集合一致；均为 `SKILL.md` + 6 个 reference 文件 |
| spec-work line count | `wc -l skills/spec-work/SKILL.md skills/spec-work/references/*.md skills/spec-work/references/agents/*.md` | advisory | `SKILL.md` 432 行，skill 总计 1091 行 |
| spec-work focused contract | `npx jest tests/unit/spec-work-contracts.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于 `<rootDir>/tests/jest-setup.js` 不存在，未执行到该 suite |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 配置仍引用 `<rootDir>/tests/jest-setup.js`，命令失败在 setupFiles 缺失 |

### 增量验证（2026-07-10 15:07:21 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-ideate active CE residual scan | `rg -n "\bce-\|compound-engineering\|\.compound-engineering\|ce-unified-plan\|/tmp/compound-engineering\|/ce-\|ce-ideate\|ce-brainstorm\|ce-plan\|ce-proof\|ce-work\|ce-explain\|ce-code-review\|CLAUDE_SKILL_DIR\|/spec:\|\$spec-\|task-pack\|dispatch_authorization_missing\|Workflow Contract Summary\|review-finding.v1\|Gemini\|Antigravity\|\bPi\b\|agy\|ask_question\|ask_user" skills/spec-ideate` | pass | 无输出 |
| spec-ideate ignored artifact check | `git status --ignored --short -- skills/spec-ideate/scripts/__pycache__/repo-profile-cache.cpython-312.pyc && git ls-files skills/spec-ideate/scripts/__pycache__/repo-profile-cache.cpython-312.pyc` | issues_found | 输出 `!! skills/spec-ideate/scripts/__pycache__/`，`git ls-files` 无输出；已记录为 low finding |
| spec-ideate repo-profile Python syntax | `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-ideate/scripts/repo-profile-cache.py` | pass | 无输出 |
| spec-ideate focused contract | `npx jest tests/unit/spec-ideate-contracts.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于 `<rootDir>/tests/jest-setup.js` 不存在，未执行到该 suite |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 配置仍引用 `<rootDir>/tests/jest-setup.js`，命令失败在 setupFiles 缺失 |

### 增量验证（2026-07-10 15:17:11 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-lfg active CE residual scan | `rg -n "\bce-\|compound-engineering\|\.compound-engineering\|ce-unified-plan\|/tmp/compound-engineering\|/ce-\|ce-lfg\|ce-plan\|ce-work\|ce-code-review\|ce-test-browser\|ce-commit-push-pr\|/spec:\|\$spec-\|CLAUDE_SKILL_DIR\|Gemini\|Antigravity\|\bPi\b\|agy\|ask_question\|ask_user" skills/spec-lfg` | pass | 无输出 |
| spec-lfg ignored artifact check | `git status --ignored --short -- skills/spec-lfg` | pass | 无输出 |
| spec-lfg line count | `wc -l skills/spec-lfg/SKILL.md skills/spec-lfg/references/*.md` | advisory | `SKILL.md` 129 行，skill 总计 322 行 |
| spec-lfg focused contract | `npx jest tests/unit/spec-sweep-lfg-migration-contracts.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 先失败于 `<rootDir>/tests/jest-setup.js` 不存在，未执行到该 suite |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 配置仍引用 `<rootDir>/tests/jest-setup.js`，命令失败在 setupFiles 缺失 |

### 增量验证（2026-07-10 15:25:28 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-prd script syntax | `for f in skills/spec-prd/scripts/*.js skills/spec-prd/scripts/lib/*.js; do node --check "$f" \|\| exit 1; done` | pass | 无输出 |
| spec-prd checker help | `node skills/spec-prd/scripts/check-prd-artifact.js --help` | pass | 输出 `spec-prd-artifact-check.v1` checker usage |
| spec-prd finalize help | `node skills/spec-prd/scripts/finalize-prd-artifact.js --help` | pass | 输出 `--verify-receipt` consumer-only read check |
| spec-prd eval fixture | `node skills/spec-prd/scripts/run-evals.js --json` | pass | `status: passed`，111 个 cases，`missing_required_buckets: []`，`invalid_cases: []` |
| spec-prd active CE residual scan | `rg -n "\bce-\|compound-engineering\|\.compound-engineering\|ce-unified-plan\|/tmp/compound-engineering\|CLAUDE_SKILL_DIR\|/spec:\|\$spec-\|task-pack\|dispatch_authorization_missing\|Workflow Contract Summary" skills/spec-prd` | advisory_hits | 命中 `Workflow Contract Summary`、`dispatch_authorization_missing` reason code 和 eval negative `task-pack` case，均为允许命中 |
| spec-prd ignored artifact check | `git status --ignored --short -- skills/spec-prd` | pass | 无输出 |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | degraded | 当前 HEAD `98e50159` 已删除 `tests/` 目录，Jest 配置仍引用 `<rootDir>/tests/jest-setup.js`，命令失败在 setupFiles 缺失 |

### 增量验证（2026-07-10 12:46:31 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 12:51:02 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 12:59:22 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 13:07:40 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-worktree focused contracts | `npx jest tests/unit/spec-worktree-contracts.test.js --runInBand` | pass | 19 个测试通过 |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 13:14:01 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-debug cache script syntax | `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-debug/scripts/repo-profile-cache.py` | pass | 无输出 |
| repo-profile cache parity | `npx jest tests/unit/repo-profile-cache-parity.test.js --runInBand` | pass | 2 个测试通过 |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 13:24:01 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-compound Python scripts syntax | `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-compound/scripts/repo-profile-cache.py skills/spec-compound/scripts/validate-doc-claims.py skills/spec-compound/scripts/validate-frontmatter.py skills/spec-compound/scripts/session-history/extract-errors.py skills/spec-compound/scripts/session-history/extract-metadata.py skills/spec-compound/scripts/session-history/extract-skeleton.py` | pass | 无输出 |
| spec-compound shell script syntax | `bash -n skills/spec-compound/scripts/session-history/discover-sessions.sh` | pass | 无输出 |
| spec-compound focused contracts | `npx jest tests/unit/spec-compound-contracts.test.js tests/unit/frontmatter-validator.test.js tests/unit/migrated-skill-scripts-contracts.test.js tests/unit/repo-profile-cache-parity.test.js --runInBand` | issues_found | `spec-compound-contracts`、`migrated-skill-scripts-contracts`、`repo-profile-cache-parity` 通过；`frontmatter-validator.test.js` 2 个中文 UTF-8 locale 用例失败，已记录为 `spec-compound` finding |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |

### 增量验证（2026-07-10 13:28:09 CST）

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| spec-compound-refresh Python scripts syntax | `PYTHONDONTWRITEBYTECODE=1 PYTHONPYCACHEPREFIX=/private/tmp/spec-first-pycache python3 -m py_compile skills/spec-compound-refresh/scripts/validate-doc-claims.py skills/spec-compound-refresh/scripts/validate-frontmatter.py` | pass | 无输出 |
| spec-compound-refresh focused contracts | `npx jest tests/unit/spec-compound-contracts.test.js tests/unit/frontmatter-validator.test.js tests/unit/migrated-skill-scripts-contracts.test.js --runInBand` | issues_found | `spec-compound-contracts`、`migrated-skill-scripts-contracts` 通过；`frontmatter-validator.test.js` 2 个中文 UTF-8 locale 用例失败，已记录为跨 skill finding |
| Knowledge harness contracts | `npx jest tests/unit/knowledge-harness-contracts.test.js --runInBand` | pass | 8 个测试通过 |
| 报告 / Changelog whitespace | `git diff --check -- CHANGELOG.md docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md` | pass | 无输出 |
| Changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` | pass | 2 个测试通过 |
