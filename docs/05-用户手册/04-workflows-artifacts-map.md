# `.spec-first/` 产物目录映射

本文说明当前 spec-first 会写入哪些 runtime/control-plane 产物、它们由谁生成、后续如何被使用，以及哪些目录不应提交到 Git。

## 总览

| 目录 | 写入阶段 | 触发方式 | 主要作用 | 写入/消费源码 | 主要产物 |
| --- | --- | --- | --- | --- | --- |
| `.spec-first/workspace/` | CRG workspace preflight 阶段 | `spec-first crg workspace scan/status/context --root=<workspace>` | 父目录 workspace 的 child repo registry、readiness 与 advisory candidates | 写入：`src/crg/workspace/*`、`src/crg/commands/workspace.js`；消费：workflow skills 与 LLM | `workspace-config.json`、`workspace-index.json`、`workspace-status.json` |
| `.spec-first/graph/` | CRG 图索引阶段 | `spec-first crg build --repo=<repo>` | 代码事实真源、repo-local topology 与低 token 导航索引 | 写入：`src/crg/cli/build.js`；消费：`src/crg/commands/*`、`src/crg/workflow-context/*` | `graph.db`、`repo-topology.json`、`graph-index-status.json`、`code-navigation.json`、`graph-operations.jsonl`、`work-runs/` |
| `.spec-first/workflows/verification/<slug>/` | verification evidence 产物阶段 | 上游 verification 流程写入，`doctor` 读取 | 作为 verification 证据投递目录 | 消费：`src/cli/commands/doctor.js` | `verification-evidence.json` |
| `.spec-first/workflows/quality-gates/ai-dev-quality-gate/` | AI Dev Quality Gate 阶段 | `npm run test:ai-dev:gate` | 记录质量门结果与反馈主题 | 写入：`scripts/run-ai-dev-quality-gate.js`；消费：`src/verification/quality-feedback.js` | `crg-runtime-contracts.junit.json`、`ai-dev-quality-gate-result.json`、`quality-feedback-topics.json` |
| `.spec-first/workflows/spec-work/<slug>/<run-id>/` | `spec-work` 执行阶段 | `spec-first crg hook before-work/after-work` 与 workflow contract | 记录一次 work run handoff，供 review 复用 | 写入/读取：`src/crg/work-runs.js`、`src/crg/hooks/*` | `run.json` |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/` | `spec-standards` proposal 阶段 | `$spec-standards` + `spec-first specs write-proposal/validate-run/promote` | 记录规范草案、preview 与 evidence map；promote 前不正式生效 | 写入：`src/cli/commands/specs.js`；消费：人工审查、`promote` | `preview.md`、`run-state.json`、`detected-profiles.json`、`evidence-map.json`、`drafts/**`、`rejected/**`、`promote-report.json` |
| `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/` | standards refresh proposal-request 阶段 | `spec-first specs refresh --changed/--files` | 记录 changed refresh 的规范草案请求；不直接修改正式规范 | 写入：`src/cli/commands/specs.js`；消费：`$spec-standards`、人工审查 | `refresh-request.json`、`preview.md`、`check.jsonl` |
| `.spec-first/workflows/<consumer>/<task-id>/` | standards resolve 消费阶段 | `spec-first specs resolve --consumer <workflow> --task-id <id>` | 记录某个任务应加载哪些正式规范，供 plan/work/review 按需读取 | 写入：`src/cli/commands/specs.js`；消费：对应 workflow skill | `resolve-result.json`、`implement.jsonl`、`check.jsonl` |
| `docs/specs/` | 正式规范资产阶段 | `spec-first specs init/promote/index/check` 与人工维护 | 团队共享的正式规范源，后续 resolve/check 以此为输入 | 写入：人工、`src/cli/commands/specs.js`；消费：后续 standards resolve/check 与 workflow skills | `README.md`、`SPEC.md`、`common/**`、`backend/**`、`custom/**`、`_index/**`、`reports/**` |
| `.spec-first/workflows/spec-code-review/<run-id>/` | `spec-code-review` 执行阶段 | 运行可写 review 模式时写入 | 记录 review findings、applied fixes 与 residual work | contract：`skills/spec-code-review/SKILL.md` | review run artifact |

## 用途总览

| 目录类型 | 主要作用 | 典型后续用途 |
| --- | --- | --- |
| `workspace/` | 父目录 workspace 的 child repo 发现与候选输入 | `workspace context` 后由 LLM/user 选择 child repo，再运行 repo-local hooks |
| `graph/` | CRG 代码事实与查询控制面 | `locate`、`path`、`explain`、`impact`、`review-context`、workflow hooks |
| `verification/*` | 验证证据投递目录 | `doctor` 校验与汇总 |
| `quality-gates/*` | 质量门机器结果 | gate 结果留痕与失败主题沉淀 |
| `spec-work/*` | work run handoff | `before-review` 复用上游 work-run id |
| `spec-standards/*` | 规范生成草案 | 人工审查 preview/evidence/drafts；promote 后才进入 `docs/specs/**` |
| `<consumer>/<task-id>` | standards resolve 上下文 | plan/work/review 读取任务级规范加载计划，不全量读取 `docs/specs/**` |
| `docs/specs/*` | 正式规范源 | 后续 standards resolve/check 与 plan/work/review 按需加载 |
| `spec-code-review/*` | review 留档 | 复盘、审计、残余工作 handoff |

## 阶段 → 读取方速查

| 产物目录 | 主要读取方 | 读取发生阶段 | 读取目的 |
| --- | --- | --- | --- |
| `workspace/` | `src/crg/commands/workspace.js`、workflow skills | graph-bootstrap / plan / work / review preflight | 防止父目录被误当成一个 repo graph，给出 child repo candidates |
| `graph/` | `src/crg/commands/*`、`src/crg/workflow-context/*` | plan / work / review | 查询候选修改点、影响面、调用路径、候选测试与图状态 |
| `graph/work-runs/` | `src/crg/hooks/before-review.js`、`src/crg/hooks/after-work.js` | work 完成后、review 开始前后 | 复用上游 work handoff，不靠口头总结 |
| `verification/<slug>` | `src/cli/commands/doctor.js` | `doctor` 检查阶段 | 校验 verification evidence 是否存在、有效、足够新 |
| `quality-gates/ai-dev-quality-gate` | `scripts/run-ai-dev-quality-gate.js`、`src/verification/quality-feedback.js` | AI gate 执行后 | 记录 gate 结果并提取失败主题 |
| `workflows/spec-standards/<target-slug>/<run-id>` | 人工审查、promote helper | standards proposal 生成后 | 审查 CRG-first 规范草案、证据和 rejected/uncertain/conflict 候选 |
| `docs/specs/_index` | 后续 standards resolve/check 与 workflow skills | `spec-first specs index` 后 | 不全量加载规范，先读索引再按需加载 summary/full |
| `workflows/<consumer>/<task-id>/resolve-result.json` | 对应 consumer workflow skill | plan/work/review 执行前 | 获得 `load_full`、`load_summary`、`load_reference` 与 `excluded`，辅助 LLM 准确加载规范 |

## 1. workspace/

| 项目 | 内容 |
| --- | --- |
| 阶段 | 父目录 workspace preflight |
| 触发 | `spec-first crg workspace scan/status/context --root=<workspace>` |
| 目录形状 | `.spec-first/workspace/` |
| 关键源码 | `src/crg/workspace/*`、`src/crg/commands/workspace.js`、`src/crg/artifact-paths.js` |
| 事实真源 | child repo registry/status；不是代码图 |

### 写入内容

| 文件 | 角色 |
| --- | --- |
| `workspace-config.json` | 可选显式 scope：include roots、exclude globs、max depth |
| `workspace-index.json` | validated child git roots、relationship、signals、stale entries、limitations |
| `workspace-status.json` | 每个 child repo 的 graph readiness、stats、capabilities、limitations |

workspace 层只准备确定性输入事实，不做语义 repo 选择。`workspace context` 可以返回 candidates、reason codes 与推荐 repo-local commands，但不能输出 `selected_repo` / `target_repo` / `final_repo` 这类最终选择字段。父目录 workspace 不拥有合并 `graph.db`；child repo 的 CRG graph 仍写在各自 `<child>/.spec-first/graph/`。

典型流程：

```bash
spec-first crg workspace scan --root=<workspace>
spec-first crg workspace status --root=<workspace>
spec-first crg workspace context --root=<workspace> --task="<task>"
spec-first crg workspace build --root=<workspace> --repo=<child-slug-or-path>
spec-first crg hook before-plan --repo=<child-repo> --task="<task>"
```

如果任务跨多个 child repos，workflow 应拆成显式顺序 repo-local runs；当前不生成一个 combined workspace work-run。

## 2. graph/

| 项目 | 内容 |
| --- | --- |
| 阶段 | CRG 图索引与查询控制面 |
| 触发 | `spec-first crg build --repo=<repo>` |
| 目录形状 | `.spec-first/graph/` |
| 关键源码 | `src/crg/cli/build.js`、`src/crg/artifact-paths.js` |
| 事实真源 | `graph.db` |

### 写入内容

| 文件 | 角色 |
| --- | --- |
| `graph.db` | SQLite 代码图，作为 CRG 查询事实真源 |
| `current.json` / `generations/` / `last-known-good.json` | generation 生命周期与 last-known-good 管理 |
| `input-fingerprints.json` | 输入文件指纹，用于增量构建 |
| `graph-index-status.json` | 图状态、能力位、stats、limitations |
| `code-navigation.json` | 低 token 导航索引，帮助 LLM 决定下一步 query |
| `repo-topology.json` | repo-local module/package topology；module 不是独立 graph |
| `graph-operations.jsonl` | build/promote/degrade 等操作审计线索 |
| `work-runs/` | `spec-work` lifecycle handoff |

### 作用与后续用途

CRG 的职责是准备确定性代码事实；LLM 负责基于这些事实做工程判断。常见消费入口：

- `spec-first crg workflow-context --stage=plan|work|review`
- `spec-first crg hook before-plan|before-work|after-work|before-review`
- `spec-first crg locate/path/explain/impact/review-context`

单个 git repo 下的多 module 项目仍只有一个 repo-local graph。当前 module topology 首先支持 Maven `<modules>` detector，写入 `repo-topology.json` 作为 advisory decision input。

## 3. verification/<slug>

| 项目 | 内容 |
| --- | --- |
| 阶段 | verification evidence 证据层 |
| 触发 | 上游 verification 流程写入 |
| 目录形状 | `.spec-first/workflows/verification/<slug>/` |
| 关键消费源码 | `src/cli/commands/doctor.js` |
| 关键文件 | `verification-evidence.json` |

这个目录是验证证据投递目录。当前默认 workflow 不再通过 Stage-0 runtime 汇总它，但 `doctor` 仍可读取并校验 evidence 文件，帮助判断运行时验证是否可信。

## 4. quality-gates/ai-dev-quality-gate

| 项目 | 内容 |
| --- | --- |
| 阶段 | AI Dev Quality Gate |
| 触发 | `npm run test:ai-dev:gate` |
| 目录形状 | `.spec-first/workflows/quality-gates/ai-dev-quality-gate/` |
| 关键源码 | 写入：`scripts/run-ai-dev-quality-gate.js`；反馈主题：`src/verification/quality-feedback.js` |

### 写入内容

| 文件 | 说明 |
| --- | --- |
| `crg-runtime-contracts.junit.json` | CRG runtime contract Jest 套件输出 |
| `ai-dev-quality-gate-result.json` | quality gate 主结果 |
| `quality-feedback-topics.json` | 失败主题，供后续知识沉淀参考 |

## 5. spec-work/<slug>/<run-id>

| 项目 | 内容 |
| --- | --- |
| 阶段 | `spec-work` 执行阶段 |
| 触发 | `spec-first crg hook before-work` 创建 run，`after-work` 收口 |
| 目录形状 | `.spec-first/graph/work-runs/<run-id>.json` |
| 关键源码 | `src/crg/work-runs.js`、`src/crg/hooks/*` |

work run 是 CRG query-first 后的执行交接事实。它记录 work-start ref、planned surface 和 closure summary，`before-review --work-run=<id>` 可以复用这些输入。

## 6. spec-standards/<target-slug>/<run-id>

| 项目 | 内容 |
| --- | --- |
| 阶段 | `spec-standards` proposal 生成与人工确认阶段 |
| 触发 | `$spec-standards` 生成 payload 后调用 `spec-first specs write-proposal`；人工确认后调用 `spec-first specs promote --accept-all` |
| 目录形状 | `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/` |
| 关键源码 | `src/cli/commands/specs.js`、`skills/spec-standards/SKILL.md` |
| 正式性 | promote 前 proposal-only；promote 后对应 draft 才写入 `docs/specs/**` |

### 写入内容

| 文件 | 说明 |
| --- | --- |
| `preview.md` | 给人审查的规范草案摘要、limitations 与下一步建议 |
| `run-state.json` | run id、target、consumer、evidence mode 与 completed/failed 状态 |
| `detected-profiles.json` | 本次识别到的端类型、语言、框架与证据 |
| `evidence-map.json` | CRG generation、source queries、draft 映射与 redaction/limitation 信息 |
| `drafts/**.md` | 待人工确认的规范文档草案 |
| `rejected/inferred-rules.md` | 被拒绝升格为规范的 inferred 候选 |
| `rejected/uncertain-rules.md` | 证据不足或需要人工判断的候选 |
| `rejected/conflicts.md` | 规范冲突或事实冲突候选 |
| `promote-report.json` | 人工确认写回后的 promoted/skipped/index 摘要 |

`spec-standards` 的 proposal run 不是团队共享规范源。只有人工 confirm/promote 才能把内容写入 `docs/specs/**`，并重建正式索引。

## 7. docs/specs/

| 项目 | 内容 |
| --- | --- |
| 阶段 | 正式规范资产阶段 |
| 触发 | `spec-first specs init`、人工维护、`spec-first specs promote`、`spec-first specs index` |
| 目录形状 | `docs/specs/` |
| 关键源码 | `src/cli/commands/specs.js`、`skills/spec-standards/SKILL.md` |
| 正式性 | 团队可版本化共享规范源 |

### 写入内容

| 文件 | 说明 |
| --- | --- |
| `README.md` / `SPEC.md` | 规范入口与加载原则 |
| `common/**` / `frontend/**` / `backend/**` / `mobile/**` / `desktop/**` | 按端和领域组织的正式规范 |
| `custom/**` | 人工最高优先级规范，不允许被 promote 覆盖 |
| `_index/specs-index.json` | 规范文件索引，含 source file hash / freshness metadata |
| `_index/rules-map.json` | 规则级索引 |
| `_index/profiles.json` | 由规范索引推导的 profile 摘要 |
| `_index/last-scan.json` | 最近一次索引扫描摘要 |
| `reports/spec-check-report.json` / `reports/spec-check-report.md` | `spec-first specs check` 生成的规范检查辅助报告；不是 hard gate |
| `reports/spec-refresh-report.json` / `reports/spec-refresh-report.md` | `spec-first specs refresh --index-only` 生成的刷新报告；不修改规范正文 |

## 8. standards resolve consumer context

| 项目 | 内容 |
| --- | --- |
| 阶段 | standards resolve 消费阶段 |
| 触发 | `spec-first specs resolve --target <repo> --task <task> --files <files> --consumer <workflow> --task-id <id>` |
| 目录形状 | `.spec-first/workflows/<consumer>/<task-id>/` |
| 关键源码 | `src/cli/commands/specs.js` |
| 正式性 | runtime handoff；不进入 Git；不是规范真相源 |

### 写入内容

| 文件 | 说明 |
| --- | --- |
| `resolve-result.json` | 完整加载计划，含 `load_full`、`load_summary`、`load_reference`、`excluded`、`metadata.hard_gate=false` |
| `implement.jsonl` | 编码执行阶段建议加载的规范文件与 full/summary 模式 |
| `check.jsonl` | 检查阶段建议加载的规范文件与 full/summary 模式 |

`resolve` 只读取正式规范索引和规则映射，不写 `docs/specs/**`。它提升输入质量，但不替代 plan/work/review 的 LLM 判断。

## 9. standards check reports

| 项目 | 内容 |
| --- | --- |
| 阶段 | standards check 辅助审查阶段 |
| 触发 | `spec-first specs check --target <repo> --changed --base <ref>` 或 `--files <comma-list>` |
| 目录形状 | `docs/specs/reports/` 与 `.spec-first/workflows/spec-check/<task-id>/` |
| 关键源码 | `src/cli/commands/specs.js` |
| 正式性 | generated report；不是规范真相源；不是 hard gate |

### 写入内容

| 文件 | 说明 |
| --- | --- |
| `docs/specs/reports/spec-check-report.json` | 机器可读检查辅助报告，含 loaded standards、review items、`hard_gate=false` |
| `docs/specs/reports/spec-check-report.md` | 人可读检查辅助报告 |
| `.spec-first/workflows/spec-check/<task-id>/resolve-result.json` | check 复用的 standards resolve 结果 |
| `.spec-first/workflows/spec-check/<task-id>/check.jsonl` | review 阶段建议加载的规范文件 |

`check` 只准备审查输入。它可以产生 `blocking_suggestion`，但不能替代 LLM/reviewer 基于 diff evidence 做最终 finding。

## 10. standards refresh reports

| 项目 | 内容 |
| --- | --- |
| 阶段 | standards refresh 辅助刷新阶段 |
| 触发 | `spec-first specs refresh --target <repo> --index-only` 或 `--changed/--files` |
| 目录形状 | `docs/specs/_index/`、`docs/specs/reports/` 与 `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/` |
| 关键源码 | `src/cli/commands/specs.js` |
| 正式性 | generated report；不是规范真相源；不是 hard gate |

### 写入内容

| 文件 | 说明 |
| --- | --- |
| `docs/specs/_index/**` | 重新生成的机器可读索引 |
| `docs/specs/reports/spec-refresh-report.json` | 机器可读刷新报告，含 `mode=index-only|changed`、`hard_gate=false`、`modified_standards` |
| `docs/specs/reports/spec-refresh-report.md` | 人可读刷新报告 |
| `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/refresh-request.json` | `refresh --changed/--files` 生成的 proposal request，供 `$spec-standards` 继续生成草案 |
| `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/preview.md` | 人可读 changed refresh 请求预览 |
| `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/check.jsonl` | changed refresh 关联的规范加载上下文 |

`refresh --index-only` 只重建索引，不修改正式规范正文。`refresh --changed/--files` 只生成 proposal request 和报告，不直接改写 `docs/specs/**`；真正进入正式规范仍需要 `$spec-standards` 生成 proposal，再由人工 promote。

## 11. standards list / validate

| 项目 | 内容 |
| --- | --- |
| 阶段 | standards 只读查看与校验 |
| 触发 | `spec-first specs list --target <repo> [--scope <scope>]`、`spec-first specs validate --target <repo>` |
| 目录形状 | 读取 `docs/specs/**` 与 `docs/specs/_index/**` |
| 关键源码 | `src/cli/commands/specs.js` |
| 正式性 | read-only helper；不写文件 |

`list` 用于查看当前索引中生效的规范；`validate` 用于校验正式规范 frontmatter，缺失 frontmatter 的人工文档会以 warning 形式提示，由 index 继续推断 metadata。

## 12. Git 边界

- `.spec-first/workspace/`、`.spec-first/graph/` 与 `.spec-first/workflows/` 默认不进入 Git。
- `docs/specs/**`、`docs/solutions/`、`docs/plans/` 才是长期协作文档层。
- CRG 查询结果是当前代码事实的投影，不要把它改造成第二套手工维护事实源。
