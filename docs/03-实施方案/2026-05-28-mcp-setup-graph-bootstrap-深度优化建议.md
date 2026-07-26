# `mcp-setup` 与 `graph-bootstrap` 深度优化建议报告

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

> 视角:Spec-First Evolution Architect / AI Coding Harness 守护者
> 评估对象:`/Users/kuang/xiaobu/kaz-mvp`(Android Gradle 多仓 workspace,顶层 git 已损坏,6 个 child git 子仓 + 数十个非 git Gradle 子模块)
> 实测时间:2026-05-28
> 实测结果:`mcp-setup` 全部 ready(6/6),`graph-bootstrap` 全部 ready(6/6,耗时 88.9s)
> 输出基线:`docs/10-prompt/结构化项目角色契约.md`

---

## 0. 结论先行

**两个 skill 在 happy path 上是工作的——但当前实现把"workspace = git child repos 的并集"作为隐性公理,导致 4 类深度问题被系统性忽略。** 它们不是边缘 bug,而是**与 Harness 6 层模型直接冲突的设计缺口**:Evidence Harness 在多仓拓扑下产出**自相矛盾的事实**(顶层 stale 产物和子仓 fresh 产物并存却没有任何 invalidation),Context Harness 在**复合型仓库(混合 git child + non-git Gradle module)**下产生**系统性盲区**(本次实测中 `app-kaz`/`app-core`/`annotation`/`annotationprocessor`/`hszq-version` 等 17 个顶层 Gradle 模块**完全不在任何 graph 内**),Governance Harness 缺**顶层污染检测/隔离/清理**的对称机制(setup 写时识别 multi-repo,但读时不识别 stale parent artifacts;它知道不该写,却不知道该清),Evaluation Harness 没有任何**可度量指标**反馈真实研发增益。

**最关键的一刀**:把 graph readiness 的"完整性"概念从"每个 git child repo 都 ready"升级为"workspace 内每个语义 build target(Gradle module / 非 git folder root)都被覆盖,且与跨仓 reuse 实际语义边界一致"。当前实现忽略了 Gradle settings.gradle 这条**比 git 边界更准确的语义边界 source**。

下面分四块展开,顺序按"先证据后判断、先核心契约后边缘优化"。

---

## 1. 实测产物分析(Evidence)

### 1.1 已生成的产物清单(graph-bootstrap 后)

| 层级 | 路径 | 状态 |
|---|---|---|
| Workspace 顶层(advisory) | `.spec-first/workspace/graph-bootstrap-summary.json` | fresh,2026-05-28T04:46:47Z,run_id 一致 |
| Workspace 顶层 | `.spec-first/workspace/graph-targets.json` | fresh |
| Workspace 顶层 | `.spec-first/workspace/gitnexus-readiness.json` | fresh,script-mode-no-mcp |
| Workspace 顶层 | `.spec-first/workspace/mcp-setup-summary.json` / `mcp-verify-summary.json` | fresh |
| **Workspace 顶层(污染)** | `.spec-first/graph/graph-facts.json` 等 | **5/6 残留,repo_root=`/Users/lynwang/...`,含已 retired `code-review-graph`** |
| **Workspace 顶层(污染)** | `.spec-first/config/graph-providers.json`、`runtime-capabilities.json` | **5/6 残留,指向 lynwang 路径** |
| **Workspace 顶层(污染)** | `.spec-first/providers/code-review-graph/` | **已 retired provider 残留** |
| **Workspace 顶层(污染)** | `.gitnexus/`(meta.json 指向 `kaz-app` 而非 `kaz-mvp`) | **跨机器残留** |
| Child(每个 git child repo) | `.spec-first/graph/graph-facts.json` 等 | fresh,新 schema |
| Child(每个 git child repo) | `.spec-first/providers/gitnexus/{raw,normalized,status.json}` | fresh,含 query.log/impact.log |
| Child(每个 git child repo) | `.spec-first/impact/bootstrap-impact-capabilities.json` | fresh |
| Child(每个 git child repo) | `.gitnexus/` 子 repo 索引(common/biz-common/web/userinfo/hscomp/resources) | fresh,2026-05-28 |

### 1.2 产物间的关联关系(已验证)

- ✅ `runtime-capabilities.json.host_ledger_pointer.path` 指向 `/Users/kuang/.claude/spec-first/host-setup.json`(child 仓内正确;parent 顶层错误)
- ✅ `graph-providers.json.providers.gitnexus.commands.query_probe` 与 child 仓的 `provider-status.json.commands.query_probe` 命令一致(setup 写,bootstrap 消费)
- ✅ `query_probe_policy.candidates[]`(setup 写)与 `query_probe_attempts[]`(bootstrap 写)的 token 一致
- ✅ `graph-bootstrap-summary.json.results[].overall_status` 覆盖了 6 个 child,`run_id` 与每个 child status 的 `parent_run_id` 一致(observability OK)
- ✅ 每个 child 的 `provider-status.json.command_results[]` 包含 4 类:`bootstrap`、`status`、`query_probe`、`impact_probe`(GitNexus 升级后新增 impact_probe,**这是 1.6.6-rc.76 的能力**——`spec-graph-bootstrap` 已经接入了 impact 探针,output 含 `byDepth` / `affected_processes` / `risk` 字段)
- ✅ host_instruction_normalization=drift-detected 写入了每个 child 的 provider-status,parent 的 summary 也写入了 `parent_host_instruction_normalization`(advisory,正确没自动写入 host instruction)
- ❌ **严重问题**:parent 顶层 `.spec-first/graph/*` 与 child `.spec-first/graph/*` **并存**,且 parent 的产物指向另一台机器的路径,但**没有任何机制把它标记为 invalidated/stale**。下游消费者(plan/work/review/debug)如果误读 parent 顶层路径,会得到**完全错误的事实**。

### 1.3 目录覆盖率分析(关键缺口)

实测 `kaz-mvp` 的 build 边界(从 `find build.gradle*`):

| 模块 | 类型 | git 边界 | **当前 graph 覆盖** | **gap** |
|---|---|---|---|---|
| `app-kaz/` | 顶层 Gradle module | parent 内,无独立 .git | ❌ 完全不覆盖 | **盲区** |
| `app-core/` | 顶层 Gradle module | parent 内,无独立 .git | ❌ 完全不覆盖 | **盲区** |
| `annotation/` | 顶层 Gradle module | parent 内,无独立 .git | ❌ 完全不覆盖 | **盲区** |
| `annotationprocessor/` | 顶层 Gradle module | parent 内,无独立 .git | ❌ 完全不覆盖 | **盲区** |
| `app-gradle/` | 顶层 Gradle module | parent 内,无独立 .git | ❌ 完全不覆盖 | **盲区** |
| `core/core-ui-kit`、`core/core-utils` | 共享 Gradle module | parent 内,无独立 .git | ❌ 完全不覆盖 | **盲区** |
| `contract/{quotes,trade,platform}` | KTS Gradle module | parent 内,无独立 .git | ❌ 完全不覆盖 | **盲区** |
| `feature/`、`foundation_layer/`、`hsconfig/`、`hszq-version/`、`jacocoreport/`、`scm/`、`tmpmob/`、`pager_reach/` | 顶层目录(部分有 build.gradle) | parent 内 | ❌ 完全不覆盖 | **盲区** |
| `common/`、`resources/` | 顶层 Gradle module **且**独立 git | child git repo | ✅ 完整覆盖 | OK |
| `submodules/{web,biz-common,userinfo,hscomponents}` | git submodule | child git repo | ✅ 完整覆盖 | OK |

**估计盲区**:用 `find` 找到的 `build.gradle*` 共 **20+** 个,只有 6 个被覆盖,**~70% 的 build target 不在任何 graph 内**。

`app-kaz` 是这个仓库的应用入口模块(基于 settings.gradle 与命名,极有可能依赖 common/、resources/ 和大量 submodules/)。下游 review / impact / plan workflow 在询问 "如果改 IRouter 接口,会影响哪些 Activity?" 时,得到的答案**只能命中 6 个子仓**,无法跨到 app-kaz 的 Activity 链——而 app-kaz 才是真正"调用方密度最高"的层。**这违反了 Context Harness 的核心承诺:给 AI 正确上下文,不给残缺上下文还谎称完整。**

### 1.4 设计契约层面的具体缺陷(从产物倒推)

| # | 缺陷 | 严重度 | 证据 |
|---|---|---|---|
| D1 | parent 顶层 stale `.spec-first/{graph,config,providers}/**` 与 `.gitnexus/` 在 multi-repo workspace 模式下**没有任何 invalidation/quarantine 机制** | **高** | `graph-facts.json.repo_root=/Users/lynwang/...`,`generated_at=2026-05-06`,但 setup/bootstrap 都没标记 stale |
| D2 | "graph 完整性"边界等同于"git child repo 边界",**忽略 Gradle settings.gradle / 顶层非 git build target** | **高** | 17+ 个 Gradle 模块完全不在任何 graph 中 |
| D3 | GitNexus repo label 与 directory basename / git remote basename **存在多源不一致**,本次顶层 `.gitnexus.meta.json` label=kaz-app(historical) 但当前 directory=kaz-mvp,5/6 的旧 query 全部失败 | **中** | `provider-status.json` 旧产物中 6 次 query_probe 全 exit_code=1,Error: Repository "kaz-mvp" not found. Available: kaz-app |
| D4 | `runtime-capabilities.json` 的 `host_ledger_pointer.path` 在 parent 顶层**没被刷新**,仍指向 lynwang | **中** | parent `.spec-first/config/runtime-capabilities.json.host_ledger_pointer.path=/Users/lynwang/.claude/...` |
| D5 | host_instruction_normalization=drift-detected,**只是 advisory,不会自动修复**,但 setup 知道 source(`spec-first init`),却不主动 handoff | **低** | summary.parent_host_instruction_normalization.action="would-normalize",但用户体验上没有清晰 next-step trigger |
| D6 | graph-bootstrap 在 dirty worktree 下采用 warn-and-continue,但**dirty 文件具体是什么、对哪些 query 不可信**,没有 LLM 可消费的精细信号 | **中** | `dirty_classification=graph-affecting-blocked` + `dirty_paths_breakdown` 计数有,但**未列出具体路径** |
| D7 | `query_probe_policy.candidates[]` 上限固定 5,且**与 build target / module 边界无关**,无法表达"每个核心模块至少 1 个 probe" | **低** | 单个 child 只 5 个 token,common 这种含 router/widget/trade/quote 多领域的子仓只能挑 5 个 |
| D8 | 没有 Evaluation Harness 指标,无法判断 graph 真的对下游有用 | **高** | `graph-to-finding-ratio` / `definitions-only-vs-process` / `degraded-fallback rate` 这些指标全部缺失,角色契约要求由 artifact 产出而非 LLM 自评,但当前 artifact 没产出 |

---

## 2. 与最佳实践 / 角色契约 / Harness 模型的对比

### 2.1 核心哲学回归

角色契约第 3 节:**Light contract · Explicit boundaries · Let the LLM decide**。两个 skill 的设计**整体方向正确**(scripts 准备事实、LLM 决策、artifact 留证),但在三处出现"脚本越界做语义判断"或"LLM 没有足够信号判断"的失衡:

| 失衡点 | 当前实现 | 角色契约判断 |
|---|---|---|
| GitNexus repo label 选择 | 脚本按 `meta.json.remoteUrl basename → git remote → directory basename` 三级 fallback **直接落字段** | 这是**确定性事实**(读元数据),OK,但**没有冲突暴露**——3 个来源不一致时(本次顶层就是),应记 `repo_label_conflict[]` 让 LLM 看见 |
| Build target 边界 | 脚本默认假设 git child repo = build target | 这是**语义判断**(什么算独立分析单元?),应该让 LLM 用 settings.gradle / pyproject / package.json / go.mod 等 build manifest 判断,而不是脚本固定取 git |
| dirty 影响面 | 脚本计数 `dirty_paths_breakdown.{setup_owned,non_graph_metadata,graph_affecting}` | 计数是事实,但**具体哪些路径让哪个 token 不可信**应当列表化(LLM 决策需要),目前下游消费者拿到的就是一个数字 |

### 2.2 Harness 6 层覆盖矩阵

| Harness 层 | 当前覆盖 | 实测漏洞 | 是否 mcp-setup / graph-bootstrap 应该补 |
|---|---|---|---|
| **Context Harness** | graph-facts、provider-status、impact_capabilities | 顶层 17+ 个 Gradle module 不在 graph 内;dirty 路径不可见 | **是**——graph readiness 必须能表达 build-target-level 完整性 |
| **Execution Harness** | install-mcp / verify-tools / bootstrap-providers 流式产物 | run_id / parent_run_id 一致,但**没有 phase-level timing breakdown**(只有 child 级 duration) | 部分(下游 spec-work 主责) |
| **Evidence Harness** | raw logs + normalized + status.json + bootstrap-fingerprint.v1 | 顶层 stale 产物**没有 quarantine 标记**;parent 顶层 `.gitnexus/` 完全失控 | **是**——需要 quarantine + drift detection 对称机制 |
| **Evaluation Harness** | timing.duration_ms | 没有 graph-to-finding-ratio / probe success rate / per-module coverage / parent-pollution incidents | **是**——artifact 必须含可度量字段,角色契约第 7 节明确要求 |
| **Governance Harness** | mutation boundary、redaction、provider readiness、unsafe parent write | parent 顶层 stale 产物没人管;ledger drift 只 advisory 不修 | **是**——需要 setup-owned cleanup contract |
| **Knowledge Harness** | docs/solutions、spec-compound | bootstrap-report.md 是面向人的报告,**没有面向 plan/work 的精炼摘要** | 部分(下游主责),但 bootstrap-report 应该提供给 spec-compound 的 hook 字段 |

### 2.3 与外部最佳实践的对照

参考 Karpathy "context is the new compute"、Anthropic 的 prompt caching、code intelligence 工具(Sourcegraph/SCIP、tree-sitter、Stack Graphs、ast-grep)的设计共识:

- **多语言/多 build-system 仓库**:Sourcegraph 的 `code intel` 和 Bazel 的 BUILD 文件治理都把"build target / language indexer 单元"作为最小覆盖原子,而不是 git 边界。`spec-first` 当前实现绑死 git 边界,与社区共识不一致。
- **Index 失效信号**:Sourcegraph、JetBrains IDE 都有"index 是否覆盖当前 worktree"的明确字段(`indexedRevision`、`coverage`),不是 dirty 与否的二值,而是路径级覆盖率。`graph-facts.v1` 的 `worktree_dirty=true` + `worktree_status_hash` 在多仓 + 多模块组合下颗粒度太粗。
- **Capability discovery**:GitNexus 1.6.6 已经有 `query`/`status`/`impact`/`mcp` 多个 surface,setup 写入了 `native_capabilities` baseline——但没有把 GitNexus 实际版本暴露的 surface 与 mcp-tools.json 的 baseline 做"diff 报告",让用户/LLM 知道 "本次升级到 1.6.6-rc.76 多了 impact 探针,baseline 还停留在 1.6.5 的能力描述"。这个 drift 报告是 evidence harness 的合理职责。

---

## 3. 优化建议(按优先级与最小落地)

### Tier-1(高 ROI · 最小改动 · 服务核心链路)

#### T1.1 Parent-workspace stale artifact quarantine(治 D1/D4)

**问题**:multi-repo workspace 模式下,parent 顶层旧 `.spec-first/{graph,config,providers}/**` 不被任何 skill 写,但**也不被任何 skill 标 stale**,下游 LLM 误读概率非零。

**方案**:`mcp-setup` 在识别到 multi-repo workspace 时,**preview-first** 写一个 `.spec-first/workspace/parent-artifact-quarantine.json`:

```json
{
  "schema_version": "parent-artifact-quarantine.v1",
  "topology": "multi-repo-workspace",
  "advisory": true,
  "quarantined_paths": [
    {
      "path": ".spec-first/graph/graph-facts.json",
      "reason_code": "parent-workspace-must-not-have-repo-local-graph",
      "stale_indicator": "repo_root mismatches workspace_root",
      "last_generated_at": "2026-05-06T03:56:57Z",
      "fingerprint_origin": "/Users/lynwang/..."
    },
    {
      "path": ".gitnexus/",
      "reason_code": "parent-workspace-must-not-have-graph-index",
      "label_mismatch": "kaz-app vs kaz-mvp"
    }
  ],
  "next_action": "Confirm before deletion; spec-first clean --workspace-orphans is the dedicated cleanup command."
}
```

同时在 `mcp-setup-summary.json` 增加 `parent_workspace_pollution_count` 和"建议的 cleanup 命令"。**LLM 看到**就会知道"parent 顶层产物不可信",而不是默默选 stale。

提供 `spec-first clean --workspace-orphans` 显式删除入口(不是 setup 自动删——那是越界)。

#### T1.2 Build-target awareness via settings.gradle / package.json(治 D2)

**问题**:graph 完整性只看 git,看不到 Gradle module。

**方案**:`graph-targets.json` 增加 `non_git_build_modules[]` 字段——脚本只做**事实采集**(读 settings.gradle / package.json workspaces / pyproject 子项目 / go.mod),**不做语义决策**(每个 module 是否值得独立索引)。

```json
{
  "non_git_build_modules": [
    {"path": "app-kaz", "kind": "gradle-module", "manifest": "app-kaz/build.gradle", "in_settings_gradle": true, "covered_by_child_repo": null, "graph_coverage": "uncovered"},
    {"path": "app-core", "kind": "gradle-module", "manifest": "app-core/build.gradle", "in_settings_gradle": true, "graph_coverage": "uncovered"}
  ],
  "coverage_summary": {
    "total_build_targets": 23,
    "covered_by_git_children": 6,
    "uncovered_build_modules": 17,
    "coverage_ratio": 0.26
  }
}
```

**LLM 决策点**:plan/review/work 看到 `coverage_ratio=0.26` 会自动降级 confidence,主动建议"是否考虑把顶层作为单 git repo 跑 GitNexus 一次,还是只在 child repo 跑"。

GitNexus 本身能不能索引非 git 目录?根据 1.6.6 的 `analyze` 行为——它需要 git 元数据(`Indexed commit`、`status` 都依赖 git)。**所以这个问题暴露的是 GitNexus 当前能力边界**,scripts 应该忠实暴露,不应该假装"只覆盖 git 边界就是完整"。

进一步,可以在 `gitnexus-readiness.json` 引入 `graph_coverage_class` 字段:`full` / `git-roots-only` / `partial-build-targets` / `none`,让下游 workflow 用这个字段判断是否需要 fallback 到 ast-grep / Read 直读。

#### T1.3 Drill-down dirty paths(治 D6)

**问题**:`dirty_paths_breakdown` 是计数,不是路径。

**方案**:`graph-facts.v1` 增加 `dirty_paths_sample[]`(bounded,如 ≤30),记录代表性路径与所属 build module:

```json
{
  "dirty_paths_breakdown": {"graph_affecting_count": 2, "setup_owned_count": 1},
  "dirty_paths_sample": [
    {"path": "app-kaz/src/main/java/.../HomeFragment.kt", "build_module": "app-kaz", "graph_affecting": true},
    {"path": "common/src/main/java/com/example/router/Router.java", "build_module": "common", "graph_affecting": true}
  ]
}
```

LLM 在 review/plan 时看到这个采样,可以**针对性**做 bounded direct read,而不是全仓不可信。

#### T1.4 Repo-label conflict surface(治 D3)

**问题**:GitNexus repo label 来自三源,冲突时直接默默选一个。

**方案**:`provider-status.json.gitnexus` 增加 `repo_label_resolution`:

```json
{
  "repo_label_resolution": {
    "selected": "web",
    "selected_source": "git_remote_basename",
    "candidates": [
      {"source": "gitnexus_meta_remote_url_basename", "value": "web"},
      {"source": "git_remote_url_basename", "value": "web"},
      {"source": "directory_basename", "value": "web"}
    ],
    "conflict": false
  }
}
```

冲突时 `conflict=true` + `next_action="rerun spec-mcp-setup or run gitnexus analyze --force"`。本次实测的 parent 顶层 .gitnexus 就是 `kaz-app vs kaz-mvp` 的典型冲突,目前完全失声。

#### T1.5 Drift→handoff 自动化(治 D5)

`host_instruction_normalization=drift-detected` 时,setup 的 `next_step prompt` 已经会建议跑 `spec-first init`。但 `graph-bootstrap` 也检测到 drift,却不在 final response contract 中**强制要求**显示 handoff 行。

**方案**:graph-bootstrap 的 final-response 模板增加固定行——若 `parent_host_instruction_normalization.status="drift-detected"`,必须输出:

```
- Host instruction drift detected (advisory). Run: spec-first init  to refresh AGENTS.md / CLAUDE.md GitNexus blocks.
```

这是 prose 级的小改,但保证 handoff 不丢失。

### Tier-2(中 ROI · 中等改动)

#### T2.1 Evaluation Harness 字段化(治 D8)

`graph-bootstrap-summary.json` 顶层增加 `quality_signals`:

```json
{
  "quality_signals": {
    "schema_version": "graph-quality-signals.v1",
    "child_count": 6,
    "process_results_rate": 1.0,
    "definitions_only_rate": 0.0,
    "command_failed_rate": 0.0,
    "average_query_probe_duration_ms": 1827,
    "impact_probe_with_test_provenance_rate": 0.0,
    "build_target_coverage_ratio": 0.26,
    "dirty_advisory_child_rate": 0.83,
    "host_instruction_drift_rate": 1.0
  }
}
```

这些是脚本可计算的事实。downstream 可以用 `process_results_rate < 0.5` 触发"图谱质量降级"提示,用 `build_target_coverage_ratio < 0.5` 触发覆盖率警告。`spec-optimize` 可以直接消费这些指标做循环优化。

#### T2.2 Setup-owned cleanup contract

补全 `spec-first` CLI 的 `clean --workspace-orphans`:基于 T1.1 的 quarantine 文件,preview-first 删除 parent 污染的 `.spec-first/{graph,providers,impact}` + 顶层 `.gitnexus/`。**绝不**自动删——require 用户/LLM 显式确认。

#### T2.3 GitNexus capability surface diff 报告

setup 在写 `runtime-capabilities.json` 时,把 `mcp-tools.json.native_capabilities`(baseline,基于 1.6.5)与运行时探测到的 `gitnexus --version` + `gitnexus analyze --help` 输出做 diff,产出 `native_capability_drift`:

```json
{
  "native_capability_drift": {
    "baseline_version": "1.6.5",
    "actual_version": "1.6.6-rc.76",
    "added_surfaces": ["impact"],
    "removed_surfaces": [],
    "advisory": true
  }
}
```

这能让 mcp-tools.json 维护跟得上上游版本演化,而不是悄悄漂移。

#### T2.4 Probe candidate 多样性(治 D7)

`query_probe_policy.candidates[]` 上限 5 不变,但**改候选构造算法**:从"全 child repo basename 排序前 5"改为"每个**顶层 module / package**至少 1 个候选,直到达到上限"。这样 `submodules/web` 不会全是 web 路由文件,而是包含 `bridge`、`error`、`ui` 各 1 个 entry,probe 失败时 fallback 路径也更分散。

### Tier-3(低 ROI · 大改动)

#### T3.1 Build-target-level GitNexus indexing(可选,实验性)

如果上游 GitNexus 加 `--non-git-root` 支持,spec-first 可以在 multi-build-target 仓里**显式**跑 `gitnexus analyze` on `app-kaz/`、`app-core/` 等,把它们当 virtual repo 索引。这是大改,需要上游支持,作为 roadmap 不作为本期 scope。

#### T3.2 推翻"git-only graph readiness" 假设(战略级)

更激进:把 graph readiness 的最小单元从 git repo 改为 "build manifest detected unit"。这要求 schema bump(`graph-providers.v2`),provider command 配置粒度从 repo 级降到 module 级。**慎重**:大改,会破坏所有下游 contract。除非 80/20 评估证明 build-target 缺口是头部痛点(本次 kaz-mvp 实测显示是,但单点不够)。

---

## 4. Goals / Non-goals / Artifact / Consumer / Risk

### 4.1 Goals(本期建议覆盖)

- 让 multi-repo workspace 模式下的 graph readiness 事实**自洽**(无 stale 残留误导下游)
- 暴露 build-target-level 覆盖率与 dirty 影响面,使 LLM 能正确判断 graph 是否够用
- 把 host_instruction drift / capability drift / repo_label conflict 三类沉默信号显式化
- 引入最小可行的 Evaluation Harness 字段,使 spec-optimize 有可消费的指标

### 4.2 Non-goals(本期不做)

- 不实现非 git 目录的 GitNexus 索引(等上游)
- 不破坏现有 schema(只增加字段,不重命名/删除)
- 不让 setup/bootstrap 自动删除 parent 污染(只 quarantine + 提供显式 clean 入口)
- 不引入新 provider(spec-first 仍 GitNexus-only)

### 4.3 Artifact 增量

| 文件 | schema bump | 增加字段 |
|---|---|---|
| `.spec-first/workspace/parent-artifact-quarantine.json` | 新文件,`parent-artifact-quarantine.v1` | 全部 |
| `.spec-first/workspace/graph-targets.json` | 不 bump | `non_git_build_modules[]`、`coverage_summary` |
| `.spec-first/workspace/graph-bootstrap-summary.json` | 不 bump | `quality_signals` |
| `.spec-first/graph/graph-facts.json` | 不 bump | `dirty_paths_sample[]`、`graph_coverage_class` |
| `.spec-first/providers/gitnexus/status.json` | 不 bump | `repo_label_resolution`、`native_capability_drift` |

每个新增字段必须有 `additive=true` 的 contract 测试覆盖,确保 downstream consumer 可以忽略未知字段。

### 4.4 Consumers 影响

- `spec-plan`:读 `graph_coverage_class` 决定是否补 ast-grep 直读
- `spec-work`:读 `dirty_paths_sample[]` 做精准 build-target 范围验证
- `spec-code-review`:读 `quality_signals.impact_probe_with_test_provenance_rate` 决定是否要求补 related-tests
- `spec-debug`:读 `repo_label_resolution.conflict` 提早识别 GitNexus 误导
- `spec-optimize`:读 `quality_signals` 做循环优化基线
- `using-spec-first` guide mode:读 `parent-artifact-quarantine.v1` 在 routing 时建议先跑 `spec-first clean --workspace-orphans`

### 4.5 风险与反模式

- **反模式 1**:不要让脚本删除 parent 污染——LLM 决策 + 显式命令是边界,自动删是越界。
- **反模式 2**:不要把 `quality_signals` 字段当"graph 是否能用"的硬 gate——它是 evidence harness 信号,downstream LLM 最终决策。
- **风险 1**:T1.2 的 build-target 检测会扩大事实面,可能让"原来 ready"的 workspace 被识别为 "partial-build-targets"——这是**正确暴露**,不是回归;通过 docs + CHANGELOG (user-visible) 沟通。
- **风险 2**:`quality_signals.host_instruction_drift_rate=1.0` 在每次未跑 `spec-first init` 的会话都会持续报警——需要 advisory 限速或 onboarding 文档优化。

---

## 5. 最小可维护落地顺序

按 Tier-1 到 Tier-3,每个 PR 独立可发布、独立可回滚:

1. **P0 - T1.1 quarantine**:新文件 + 1 个新 schema + 1 个新 CLI 子命令(clean --workspace-orphans 的 read-only 版本,只列不删)。改动小,价值大。
2. **P1 - T1.4 repo_label_resolution**:provider-status.json 增字段。脚本侧 ~50 行。修复 D3 的隐性误导。
3. **P2 - T1.3 dirty_paths_sample**:graph-facts.json 增字段。修复 dirty 影响面盲区。
4. **P3 - T1.5 drift handoff prose**:final response 模板加一行强制输出。改动最小。
5. **P4 - T1.2 build-target awareness**:graph-targets.json 增字段。**改动量评估:中→大**。原因:
   - **Gradle**:`settings.gradle`(Groovy)与 `settings.gradle.kts`(KTS)语法不同;`include` / `includeBuild` / `apply from:` / 动态 `rootProject.children` 递归引用;子项目可在 `include ':a:b:c'` 这种冒号路径里
   - **Maven**:`pom.xml` 的 `<modules>` 节,需 XML 解析,继承结构复杂
   - **Bazel**:`BUILD` / `BUILD.bazel` 文件 + `WORKSPACE`,语义最强但需要专门解析
   - **npm/pnpm/yarn**:`package.json.workspaces`(string[] / object)+ `pnpm-workspace.yaml`,语义清晰但 3 套写法
   - **pyproject**:Poetry / Hatch / setuptools 各家 multi-package 写法不同
   - **Go**:`go.work` (Go 1.18+) 与传统单 go.mod,差异大
   建议落地顺序:先 Gradle(kaz-mvp 真实需求驱动) + npm(社区面广),其他作为后续 PR 增量。每个 ecosystem 解析器作为独立 helper 模块,失败时退回 `coverage_inference: skipped + reason_code` 而非阻塞。
6. **P5 - T2.1 quality_signals**:summary 增字段,值由其他 P0-P4 字段计算。
7. **P6 - T2.2 clean CLI**:从 P0 read-only 升级为 preview-first 删除。
8. **P7 - T2.3 capability drift**:setup 引入 GitNexus --version probe(轻量探测)。
9. **P8 - T2.4 probe candidate 多样性**:write-provider-config 算法调整。
10. **P9 - T3.x**:roadmap,不在本期。

每步都满足 80/20:用最小新增 contract 解决高频痛点(parent 污染、覆盖盲区、dirty 失声、drift 失声)。

---

## 6. 已执行的验证

- ✅ 在 `/Users/kuang/xiaobu/kaz-mvp` 实跑 `mcp-setup` 全链路(check-health → resolve-project-target → install-mcp → verify-tools),overall_status=ready,6/6 child 成功
- ✅ 在 `/Users/kuang/xiaobu/kaz-mvp` 实跑 `graph-bootstrap`(parent default all-repos),overall_status=ready,6/6 child 成功,total 88.9s
- ✅ 校对了所有产物路径与 schema(graph-facts.v1、provider-status.v1、workspace-graph-targets.v1、graph-providers.v1、runtime-capabilities.v1、bootstrap-impact-capabilities.v1、parent advisory summaries)
- ✅ 比对了 setup 写 / bootstrap 读 / final response 输出三方关联(query_probe_policy → query_probe_attempts → query_usability_counts 串得通)
- ✅ 验证了顶层污染:`graph-facts.json.repo_root=/Users/lynwang/...`、`generated_at=2026-05-06`、含已 retired `code-review-graph` provider、`.gitnexus/meta.json.repoPath=/Users/mantou/...`、label `kaz-app` ≠ directory `kaz-mvp`
- ✅ 用 `find` 对比了 build target 总数与 graph 覆盖数(20+ build.gradle / 6 covered)
- ⚠️ 未执行:Live MCP probe 验证(当前会话的 GitNexus MCP 连接状态未单独验证;不影响 CLI 层结论)
- ⚠️ 未执行:跨 OS / Codex 双宿主验证(报告聚焦 macOS + Claude Code,Windows PowerShell 路径同样需要照搬这些字段,这是必须的对称工作)

---

## 7. CHANGELOG 判断

本报告**不直接修改任何 source / skill / CLI / contract**——它是 `docs/03-实施方案/` 下的规划文档。

按本仓库 `CLAUDE.md` "## Changelog" 节要求("任何项目 source 新增、删除或修改,都必须同步更新根目录 `CHANGELOG.md`"),`docs/` 在 source-of-truth 列表内,**应**追加一条 docs 行(**非 user-visible**),格式按仓库现行 changelog 规则。

如果按 P0-P8 落地实施,每个 PR 都属于 user-visible(改变了 artifact schema / CLI 行为),都应在 `CHANGELOG.md` 加 `(user-visible)` 标记,并对应更新 `README.md` / `README.zh-CN.md` 与 `docs/05-用户手册/` 相关章节。
