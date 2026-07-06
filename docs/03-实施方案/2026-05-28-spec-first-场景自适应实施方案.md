# spec-first 研发场景自适应实施方案

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

> 视角:Spec-First Evolution Architect / AI Coding Harness 守护者
> 输出基线:`docs/10-prompt/结构化项目角色契约.md`
> 触发证据:`docs/03-实施方案/2026-05-28-mcp-setup-graph-bootstrap-深度优化建议.md`(kaz-mvp 实测,multi-repo + multi-build-target + cross-machine-residual 复合场景全链路暴露)
> 类型:中型(影响 setup / graph-bootstrap / using-spec-first / 所有下游 workflow 的契约层)
> 状态:实施方案草案,尚未进入 spec-plan

---

## 0. 结论先行

当前 spec-first 的隐性假设是 **"单 git 仓库 + 标准 npm/Python/Go 项目 + clean worktree"**。其他场景全部走 `degraded-fallback`,但 fallback 不分级、不指引——LLM 在 multi-repo / multi-build-target / 跨机器残留 / dirty / 多语言混合场景下看到的是"事实不完整 + 不知道为什么不完整"。

**最关键的一刀**:把"研发场景"提升为**一等公民事实**——scripts 识别 → LLM 路由 → 各 workflow 按场景能力矩阵自动降级或增强。这一刀下去,kaz-mvp 这种复合拓扑会自然进入正确路径,新场景接入也不需要改每一个 workflow。

具体落地为三件事:

1. **Developer Scenario Fingerprint**(新增 `.spec-first/workspace/scenario-fingerprint.json`)
2. **Scenario Capability Matrix**(每个 workflow SKILL.md 增加一节,契约化降级路径)
3. **场景驱动的 Entry Router**(`using-spec-first` guide mode 强制读指纹做路由)

三件事都不引入 schema bump,不引入新 provider,不增加状态机思维。

---

## 1. 现状与问题(为什么要做)

### 1.1 实测证据(kaz-mvp,2026-05-28)

- `mcp-setup` 全部 ready(6/6 child),`graph-bootstrap` 全部 ready(6/6 child),耗时 88.9s
- 但顶层 17+ 个 Gradle module(`app-kaz`、`app-core`、`annotation` 等)**完全不在任何 graph 内**(`build_target_coverage_ratio ≈ 0.26`)
- 顶层 `.spec-first/{graph,config,providers}/**` 是 2026-05-06 的 lynwang/mantou 残留,**没有任何 invalidation 标记**
- 顶层 `.gitnexus/meta.json` label=`kaz-app`,与当前目录 `kaz-mvp` 冲突,**没有任何 conflict 暴露**
- 6 个 child 全 `dirty-graph-affecting`,但**dirty 路径具体是什么、影响哪些 query**,LLM 拿到的只是计数

### 1.2 根因:隐性单点判断散落在每个 workflow

每个 workflow 都在自己代码里做了**隐性场景判断**——
- `mcp-setup` 用 `resolve-project-target` 检测 multi-repo
- `graph-bootstrap` 用 `resolve-workspace-graph-targets` 检测 dirty
- `using-spec-first` 用 prose 判断"是否需要 setup"
- `spec-code-review` / `spec-plan` 用 graph-facts 自行解读

这些判断**没有被聚合成一个统一的场景指纹**,也**没有被下游 workflow 消费**——结果是每个 workflow 各自实现一遍场景适配,接缝处全是漏洞。

### 1.3 与 Harness 6 层模型的冲突

| Harness 层 | 当前缺口 |
|---|---|
| Context Harness | LLM 拿到的 context 不知道"残缺在哪里" |
| Execution Harness | 每个 workflow 自己判断场景,接缝处漏洞 |
| Evidence Harness | parent 污染失声、跨机器残留无标记 |
| Evaluation Harness | 没有 graph-to-finding ratio、scenario coverage 指标 |
| Governance Harness | 知道"不该写",不知道"该清" |
| Knowledge Harness | bootstrap-report 是给人看的,LLM 不消费 |

---

## 2. Goals / Non-goals

### 2.1 Goals

- 让 spec-first 在 **任意研发场景**下,LLM 都能从 artifact 中读出"当前场景的关键特征 + 在该场景下我能做什么 / 不能做什么"
- 让 setup / graph-bootstrap / using-spec-first / 所有下游 workflow **共享一份场景事实**(scenario-fingerprint)
- 让每个 workflow 的**降级行为契约化**(Scenario Capability Matrix),可测试、可审计
- 让 cross-machine-residual / git-misaligned-build-targets / definitions-only-provider 等今天的"隐性 degraded"场景**显式化**为 LLM 可消费的字段
- 不破坏既有 schema,不引入新 provider

### 2.2 Non-goals

- 不实现"自动决策"——LLM 永远是最终路由者,scenario-fingerprint 是事实不是结论
- 不引入状态机/中心化流程引擎
- 不在 fingerprint 里埋"建议命令"——命令建议是 routing 层职责
- 不为非 git 目录跑 GitNexus(等上游能力)
- 不替代 graph-facts.json / graph-targets.json / runtime-capabilities.json,只在它们之上补一层"场景视角"

---

## 3. 核心机制设计

### 3.1 研发场景的维度向量

研发场景不是一维标签,而是多维向量。Fingerprint 必须捕获以下维度:

| 维度 | 取值空间 | 来源 | 类别 |
|---|---|---|---|
| 仓库拓扑 | `single-repo` / `multi-repo-workspace` / `monorepo` / `submodule-heavy` / `non-git` | `resolve-project-target` + git submodule 扫描 | 确定性事实 |
| Build system | `npm` / `gradle` / `maven` / `cargo` / `go` / `python` / `mixed` | manifest 文件存在性扫描 | 确定性事实 |
| 索引边界对齐 | `git-aligned` / `git-misaligned` / `no-git` | 比较 build manifest 数 vs git child repo 数 | 确定性事实 |
| 语言 | `kotlin` / `java` / `typescript` / `python` / ... | provider status 或 file 扩展名采样 | 确定性事实 |
| Worktree 状态 | `clean` / `dirty-graph-affecting` / `dirty-non-graph` / `cross-machine-residual` | dirty paths breakdown + foreign owner 检测 | 确定性事实 |
| Provider 能力 | `full-process-graph` / `definitions-only` / `partial` / `unavailable` | provider-status.json 解读 | 派生事实 |
| 协作位置 | `local-dev` / `ci` / `cross-machine-clone` / `worktree` | git worktree 指针 + 路径来源对比 | 派生事实 |
| 团队规模信号 | `solo` / `small-team` / `enterprise-multi-repo` | git remote 域名采样 + child repo 数 | 派生事实 |
| 复杂度评分 | `0.0~1.0` | 上述维度加权 | 派生数字 |

**注意**:这些都是**事实采集**,不是"建议"。LLM 拿到事实后,结合任务意图(implement / review / debug / plan)做路由。

### 3.2 scenario-fingerprint 两层 schema(setup-time + bootstrap-time)

**关键设计修订**:fingerprint 不是一份单一文件,而是**两层叠加产物**——避免"setup 阶段产出却依赖 bootstrap 才知道的字段"的内在矛盾。

#### 3.2.1 setup-time 层:`scenario-fingerprint-setup.v1`

由 `spec-mcp-setup` 在 `verify-tools` 阶段产出,落到 `.spec-first/workspace/scenario-fingerprint-setup.json`。**只含 setup 阶段可以确定的事实**。

```json
{
  "schema_version": "developer-scenario-fingerprint-setup.v1",
  "generated_by": "spec-mcp-setup",
  "generated_at": "2026-05-28T04:46:47Z",
  "advisory": true,
  "freshness": {
    "source_revision": "n/a-multi-repo-workspace",
    "child_revisions": {
      "common": "89fd420cd4daa731961a031da85d5c8907a86400",
      "resources": "818fcb9cace2c1659ff9b4121cee964bd16de678"
    },
    "setup_generated_at": "2026-05-28T04:46:47Z"
  },
  "topology": {
    "repo_topology": "multi-repo-workspace",
    "submodule_heavy": true,
    "child_repo_count": 6,
    "git_misaligned_build_targets_pending": "see-build-target-scan-on-P4"
  },
  "build_systems": {
    "primary": "gradle",
    "secondary": ["gradle-kts"],
    "manifests_detected": ["settings.gradle", "build.gradle", "build.gradle.kts"]
  },
  "languages_inferred_from_manifests": ["kotlin", "java"],
  "worktree_setup_signals": {
    "state_class": "foreign-residual",
    "foreign_residual_indicators": [
      {
        "path": ".gitnexus/meta.json",
        "reason_code": "foreign-absolute-path-stat-failed",
        "evidence": "meta.json contains repoPath=/Users/mantou/... that does not exist on current host"
      },
      {
        "path": ".spec-first/graph/graph-facts.json",
        "reason_code": "foreign-absolute-path-stat-failed",
        "evidence": "graph-facts.repo_root=/Users/lynwang/... does not exist on current host"
      }
    ]
  },
  "collaboration_position": "cross-machine-clone-with-foreign-residual",
  "team_signals": {
    "git_remote_hosts": ["gitlab.inzwc.com"],
    "estimated_scale": "enterprise-multi-repo"
  },
  "complexity_dimensions": {
    "topology_complex": true,
    "build_system_mixed": false,
    "worktree_foreign_residual": true,
    "git_alignment_pending_scan": true
  },
  "affected_downstream_workflows": ["spec-plan", "spec-code-review", "spec-work", "spec-debug"],
  "recommended_repair_workflows_when_relevant": ["spec-first-clean", "spec-first-init", "spec-mcp-setup", "spec-graph-bootstrap"],
  "tags": ["multi-repo-workspace", "gradle", "kotlin", "foreign-residual", "enterprise-multi-repo"]
}
```

#### 3.2.2 bootstrap-time 层:`scenario-fingerprint.v1`

由 `spec-graph-bootstrap` 在 bootstrap 完成后产出,落到 `.spec-first/workspace/scenario-fingerprint.json`。**merge** setup 层 + bootstrap 阶段新增的事实。

```json
{
  "schema_version": "developer-scenario-fingerprint.v1",
  "generated_by": "spec-graph-bootstrap",
  "generated_at": "2026-05-28T04:46:50Z",
  "advisory": true,
  "freshness": {
    "setup_layer_ref": ".spec-first/workspace/scenario-fingerprint-setup.json",
    "setup_generated_at": "2026-05-28T04:46:47Z",
    "bootstrap_generated_at": "2026-05-28T04:46:50Z",
    "child_revisions_at_bootstrap": {
      "common": "89fd420cd4daa731961a031da85d5c8907a86400"
    },
    "stale_setup_layer": false
  },
  "topology": {
    "repo_topology": "multi-repo-workspace",
    "submodule_heavy": true,
    "child_repo_count": 6,
    "git_misaligned_build_targets": 17,
    "build_target_coverage_ratio": 0.26
  },
  "build_systems": "ref:setup_layer",
  "languages": "ref:setup_layer",
  "worktree": {
    "state_class": "foreign-residual+dirty-graph-affecting",
    "dirty_child_count": 6,
    "foreign_residual_indicators": "ref:setup_layer"
  },
  "providers_status_refs": {
    "gitnexus": {
      "ref_provider_status": "common/.spec-first/providers/gitnexus/status.json",
      "ref_field_chain": ["status", "command_results[].result_class"],
      "child_repo": "common"
    }
  },
  "complexity_dimensions": {
    "topology_complex": true,
    "build_system_mixed": false,
    "worktree_foreign_residual": true,
    "worktree_dirty_graph_affecting": true,
    "git_alignment_broken": true,
    "build_target_coverage_partial": true,
    "provider_evidence_partial": true
  },
  "affected_downstream_workflows": ["spec-plan", "spec-code-review", "spec-work", "spec-debug", "spec-doc-review"],
  "recommended_repair_workflows_when_relevant": ["spec-first-clean", "spec-first-init"],
  "tags": ["multi-repo-workspace", "gradle", "kotlin", "foreign-residual", "enterprise-multi-repo", "dirty-graph-affecting", "git-misaligned", "process-graph-partial-coverage"]
}
```

#### 3.2.3 字段语义边界(严格)

**Scripts-owned 确定性事实**(都是从已有信号采集,不做解读):
- `topology.*`、`build_systems.*`、`languages*`、`worktree.state_class`(枚举)、`worktree.foreign_residual_indicators[]`(基于 stat 检查的硬事实)、`team_signals.git_remote_hosts`、`freshness.*`

**Scripts-owned 派生事实**(由上述事实按公开规则推算,不含语义判断):
- `collaboration_position`(枚举,由 worktree.state_class + git worktree 指针推导)
- `team_signals.estimated_scale`(枚举,由 child_repo_count + git_remote_hosts 推导)
- `complexity_dimensions.*`(全部 boolean,**每个维度独立**,不合成单一评分)
- `affected_downstream_workflows[]`、`recommended_repair_workflows_when_relevant[]`(均为**枚举数组**,不是 prose 建议,只暴露事实而不写"该怎么做")
- `tags[]`(枚举数组,LLM 可 parse)

**Scripts-owned 引用字段**(避免多真相源):
- `providers_status_refs.*` 引用 child 仓 provider-status.json 的具体字段路径,**不复制语义**
- `build_systems`、`languages`、`foreign_residual_indicators` 在 bootstrap 层用 `"ref:setup_layer"` 引用,不重复存储

**已删除的字段**(对应审查中的 Critical):
- `scenario_complexity_score`:状态机苗头,改为维度向量 `complexity_dimensions.*`
- `scenario_summary_label`:prose 拼接不可 parse,改为 `tags[]` 枚举数组
- `downstream_routing_hints.*`:scripts 越界写 prose 路由建议,改为 `affected_downstream_workflows[]` 枚举
- `provider_capability_class`:与 provider-status.json 多真相源,改为 `providers_status_refs.*` 引用

**永远固定**:`advisory: true`,这两个文件都不是 confirmed truth。

#### 3.2.4 freshness 与 stale 判断

`scenario-fingerprint.json.freshness.stale_setup_layer` 标记 setup 层是否过期:
- 当 child_repo 的 git revision 在 bootstrap 时已变 → `stale_setup_layer: true`
- 当 setup 层不存在(用户跳过了 mcp-setup 直接跑 bootstrap)→ bootstrap 拒绝产出 fingerprint 层,只产出原 graph artifacts
- 当 bootstrap 后 child 仓 dirty 状态再次变化 → fingerprint 层标 stale,下次 bootstrap 或显式 refresh 时更新

LLM 看到 `stale_setup_layer: true` 时必须主动判断"是否需要重新跑 setup"——这是 advisory,不是 hard gate。

#### 3.2.5 为什么不放进 graph-facts.json / graph-targets.json

- graph-facts / provider-status 是 **child-local repo-level** 产物,scenario fingerprint 是 **workspace-level** 视角
- setup 层 fingerprint **不依赖 graph 是否 ready**,可在 setup 阶段就给 `using-spec-first` 用
- 保持各 artifact 的语义内聚:graph-facts 谈"图谱本身",fingerprint 谈"场景本身"
- fingerprint 中所有重叠语义都通过 `ref:` 字段引用,不复制定义

### 3.3 Scenario Capability Matrix(分级契约,不是全 workflow 复制)

**关键设计修订**:不要求每个公开 workflow 都内嵌一份完整矩阵——那是 80% 工作量解决场景适配,违反 light contract。改为**分级契约**:

#### 3.3.1 一份外置 default matrix

新增 `docs/contracts/workflows/scenario-capability-matrix.md`,作为**全 workflow 默认契约**。所有公开 workflow **默认遵循该 matrix**,SKILL.md 中只需要一行声明:

```markdown
## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: <none | list overrides>
```

#### 3.3.2 仅 high-risk workflow 内嵌完整 override

只有以下 **high-risk workflow**(写入 / 决策性强)在 SKILL.md 中内嵌完整 matrix,覆盖 default:

- `spec-work`:实际写代码,边界违反代价最高
- `spec-code-review`:产出 review 结论,partial coverage 不显式声明会误导
- `spec-debug`:在 dirty / stale 状态下下结论代价高

其他 workflow(`spec-plan` / `spec-doc-review` / `spec-brainstorm` / `spec-ideate` / `spec-compound` / `spec-optimize` 等)继承 default,只在需要 override 时写"Overrides"行。

#### 3.3.3 矩阵格式(强制列)

| Scenario class | Capability class | Required Evidence | Fallback path | LLM 决策点 |

**Capability class 取值(全 workflow 统一,枚举):**
- `full`:可以按 SKILL 默认契约执行
- `bounded`:可以执行,但必须显式限定边界(例如 target_repo / 路径范围)
- `partial`:能力有缺口,必须在 artifact 中声明 limitations
- `fallback-only`:graph/provider 不可用,只用 ast-grep / Read 直读
- `blocked-action-required`:不应继续,必须先跑某个修复 workflow

**Scenario class 取值(枚举,首版由 calibration 确定,见 §7 PA-pre)**:
- `single-repo-clean`
- `multi-repo-clean`
- `multi-repo-dirty-graph-affecting`
- `git-misaligned-build-targets`
- `foreign-residual`(对应 kaz-mvp 这种异常拷贝场景)
- `first-time-on-new-machine`(对应正常 git clone 后首次 setup)
- `definitions-only-provider`
- `unavailable-provider`
- `no-git`

Scenario class 取值新增/修改走 RFC,由 `using-spec-first` SKILL.md 的 routing 段落统一维护。

#### 3.3.4 示例:`spec-code-review` 的 override matrix

| Scenario class | Capability class | Required Evidence | Fallback path | LLM 决策点 |
|---|---|---|---|---|
| single-repo-clean | full | graph + impact_probe + tests | n/a | 直接给 finding |
| multi-repo-dirty-graph-affecting | bounded | per-target_repo graph + dirty_paths_sample | bounded ast-grep on dirty paths | 必须显示 dirty 列表给用户确认 |
| git-misaligned-build-targets | partial | covered child graphs + uncovered ast-grep | direct read on uncovered modules | 在 review report 顶部声明覆盖盲区 |
| foreign-residual | blocked-action-required | none | 不开始 review | 必须先跑 spec-first clean,显式 next_action |
| first-time-on-new-machine | bounded | 必须先跑 mcp-setup + graph-bootstrap | bounded fallback | 提示重跑 setup |
| definitions-only-provider | partial | definitions + ast-grep | ast-grep 补 process flow | 不声称有 impact 半径 |
| unavailable-provider | fallback-only | ast-grep + Read | 全部 fallback | confidence=low |

#### 3.3.5 测试要求

- `docs/contracts/workflows/scenario-capability-matrix.md` 的 default matrix 必须有 contract test,覆盖每个 Capability class
- 每个 high-risk workflow 的 SKILL.md override matrix 必须有 override 项的专属 contract test
- 非 high-risk workflow 通过 default matrix 间接覆盖,不需要单独 capability test

**改动量影响**:从原方案的 "7-8 workflow × ~30 单元 ≈ 210 单元 + 7-8 套 contract test" **压缩到** "1 份 default + 3 套 high-risk override + 4 套 contract test",符合 80/20。

### 3.4 using-spec-first 升级:场景驱动的 Entry Router

`using-spec-first` 当前是 prose-based guide mode。升级后:

- **优先读** `.spec-first/workspace/scenario-fingerprint.json`(bootstrap 层),否则读 `scenario-fingerprint-setup.json`(setup 层);两者都不存在时建议先跑 `spec-mcp-setup`
- 当 `freshness.stale_setup_layer: true` 或 `child_revisions_at_bootstrap` 与当前 git revision 不一致时,提示用户考虑重新跑 setup
- 路由判断**按维度独立判断**(不合成单一评分),按从高到低优先级:

| 优先级 | 触发条件 | 推荐入口 | 一句话理由 |
|---|---|---|---|
| 1 | `worktree.state_class == "foreign-residual"` 或 `foreign_residual_indicators.length > 0` | `spec-first clean --workspace-orphans` + `spec-first init` | 顶层产物来自外部机器,继续工作会读到错误事实 |
| 2 | `worktree.state_class == "first-time-on-new-machine"` | `spec-mcp-setup` | 新机器首次工作,需要重新生成 host_ledger_pointer 与 setup-owned 产物 |
| 3 | `complexity_dimensions.git_alignment_broken == true` **且**任务涉及 impact/review/refactor | 告知覆盖盲区,询问是否继续或先做 git-align repair | 17 个 build module 不在图谱内,impact 半径不可信 |
| 4 | `providers_status_refs.gitnexus` 引用的 status 为 `unavailable` 或 `query-unverified` | `spec-graph-bootstrap` 或显式 fallback | graph 不可用,需要重建或降级 |
| 5 | `complexity_dimensions.worktree_dirty_graph_affecting == true` **且**任务涉及 commit/PR | 提示 dirty 列表,询问是否先 commit/stash | dirty 状态下 graph 与代码可能不一致 |
| 6 | 上述都不命中 | 按用户意图正常路由(plan/work/review/debug) | 场景常规 |

**核心原则**:
- 每个维度独立判断,**不合成单一评分**——避免状态机思维
- Entry Router 推荐"一个入口、一个理由、一个动作"。不串联 workflow
- 不替代 LLM 最终判断:LLM 仍可决定"虽然命中条件 3,但任务只是只读问答,可继续"
- 所有推荐**优先级 1-5 都是 advisory**,LLM 可越级

---

## 4. Artifact 增量

### 4.1 Artifact 清单

| 文件 | 类型 | 产出方 | 消费方 |
|---|---|---|---|
| `.spec-first/workspace/scenario-fingerprint-setup.json` | **新增**,schema `developer-scenario-fingerprint-setup.v1` | `spec-mcp-setup`(`verify-tools.*` 阶段) | `using-spec-first`、`spec-graph-bootstrap`(作为输入) |
| `.spec-first/workspace/scenario-fingerprint.json` | **新增**,schema `developer-scenario-fingerprint.v1` | `spec-graph-bootstrap`(bootstrap 完成后) | `using-spec-first`、high-risk workflow、`spec-optimize` |
| `docs/contracts/workflows/scenario-capability-matrix.md` | **新增 default 契约** | spec-first 治理 owner | 所有公开 workflow 默认遵循 |
| 3 个 high-risk workflow 的 SKILL.md(`spec-work` / `spec-code-review` / `spec-debug`) | **新增 Scenario Capability override 节** | 各 workflow owner | LLM 按 override 矩阵降级 |
| 其他公开 workflow 的 SKILL.md | **新增一行声明**(继承 default) | 各 workflow owner | 声明继承关系 |
| `skills/using-spec-first/SKILL.md` 内 router 段落 | **修改** | using-spec-first owner | Entry router 行为 |
| `docs/contracts/developer-scenario-fingerprint.md` | **新增 schema 契约** | spec-first 治理 owner | schema 单一真相 |
| Contract test(default matrix + 3 高风险 override) | **新增** | 各 owner | CI |

**不改**:graph-providers.v1 / runtime-capabilities.v1 / graph-facts.v1 / provider-status.v1 / workspace-graph-targets.v1 / 任何既有 schema 版本号。

### 4.2 Cross-platform Fingerprint Invariants

Bash 和 PowerShell 两条脚本路径必须产出**完全等价**的 fingerprint JSON。以下不变式必须由 contract test 验证:

| 不变式 | 规则 |
|---|---|
| 路径风格 | fingerprint JSON 中所有 path 字段使用 **POSIX 风格**;Windows 反斜杠在 PowerShell 侧写入时必须转为 `/` |
| `foreign_owner` / `foreign_residual_indicators` 提取 | 跨平台一致:对 `.gitnexus/meta.json.repoPath`、`graph-facts.repo_root`、`runtime-capabilities.repo_root` 做 stat 检查;stat 失败 + 路径前缀与当前用户 home 不一致 → 标 foreign |
| `state_class` 枚举值 | 跨平台同名;不允许 platform-specific 取值 |
| `manifests_detected` 枚举值 | 跨平台同名;基于文件名匹配,不基于操作系统 |
| `git_remote_hosts` 提取 | 跨平台一致:从 `git remote -v` 输出 parse,只保留 hostname 部分(去除协议、user、path) |
| `child_revisions` 取值 | 跨平台同名,值为 git revision 字符串(40 字符 hex) |
| 时间戳 | 跨平台统一使用 RFC3339 UTC `2026-05-28T04:46:47Z` |
| 编码 | JSON 文件统一 UTF-8 无 BOM;PowerShell 路径必须显式 `-Encoding utf8NoBOM` |
| 字段顺序 | JSON 字段无顺序要求,但 contract test 用字段集 / 取值集对比,不用文本 diff |

### 4.3 Double-host 对称

- Claude 和 Codex 双宿主都读同一份 fingerprint(`using-spec-first` 是双宿主共享 source)
- `host_ledger_pointer` 通过 fingerprint 间接传递:fingerprint 不复制 ledger path,只暴露 `worktree.foreign_residual_indicators` 中 host_ledger 相关条目
- Codex / Claude 各自的 router 实现读同一字段,行为契约一致

---

## 5. 与角色契约的一致性自检

| 角色契约要求 | 本方案 |
|---|---|
| Scripts prepare, LLM decides | ✅ scripts 输出 fingerprint 事实字段(枚举 + boolean + 引用),不写 prose 路由建议;LLM 按 capability matrix + 维度向量判断路由 |
| Light contract | ✅ 2 个新文件(setup 层 + bootstrap 层)+ 1 份 default matrix + 3 个 high-risk override;不改既有 schema 版本号 |
| Explicit boundaries | ✅ `advisory: true` 固定;clean / init 是显式入口;LLM 是最终决策者;router 推荐永远是 advisory |
| 不引入状态机 | ✅ 删除 `scenario_complexity_score` 单一评分,改为 `complexity_dimensions.*` 维度向量;capability matrix 是契约不是 FSM |
| 不引入多真相源 | ✅ provider 状态通过 `providers_status_refs.*` 引用 provider-status.json,不复制定义;setup 层与 bootstrap 层通过 `ref:` 引用避免重复 |
| 服务核心链路 | ✅ Codebase→Graph 阶段就介入(setup 层),Spec→Plan→Tasks→Code→Review 全链消费(bootstrap 层) |
| 80/20 | ✅ 1 份 default matrix + 3 个 high-risk override 解决全部 workflow 适配,不要求 7-8 个 workflow 各自维护 |
| 双宿主对称 | ✅ Claude / Codex 共享 fingerprint;§4.2 cross-platform invariants 显式约束 Bash / PowerShell 对称 |
| 不把 advisory 当 confirmed | ✅ fingerprint 永远 advisory + freshness 字段;LLM 必须叠加 graph + 直读验证 |
| Schema 单一样本风险 | ✅ §7 PA-pre 强制 ≥3 仓库 calibration 后才 freeze schema |

---

## 6. 风险与反模式

| 类别 | 项目 | 缓解 |
|---|---|---|
| 反模式 | 让 fingerprint 变成"自动决策机" | 维度向量 `complexity_dimensions.*` 是 boolean,不合成评分;capability matrix 保留 "LLM 决策点" 列;router 推荐永远 advisory |
| 反模式 | 让 Capability Matrix 变成 FSM | 矩阵是契约不是流程图;LLM 可越级降级或升级 |
| 反模式 | 单一评分倾向状态机思维 | 已删除 `scenario_complexity_score`;`complexity_dimensions.*` 是独立 boolean,LLM 按任务意图判断哪些维度重要 |
| 反模式 | scripts 越界写 prose 路由建议 | 已删除 `downstream_routing_hints.*`,改为 `affected_downstream_workflows[]` / `recommended_repair_workflows_when_relevant[]` 枚举数组 |
| 反模式 | 多真相源(fingerprint 复制 provider-status 语义) | 已改为 `providers_status_refs.*` 引用,fingerprint 不自定义 provider 状态枚举 |
| 风险 | build_target 检测扩大事实面,会让原"ready"workspace 显示 `partial-build-targets` | 这是**正确暴露**,不是回归;通过 CHANGELOG (user-visible) + docs 沟通 |
| 风险 | **foreign-residual** 与 **first-time-on-new-machine** 被混淆 | §3.4 router 优先级 1/2 分别处理;`foreign_residual_indicators[]` 严格用 stat 失败 + 路径前缀 mismatch 双重判断,避免 WSL/Docker/NFS 误判 |
| 风险 | foreign-residual 在每次新 clone 都报警 | 严格的 stat-failed 检测确保只在异常拷贝时触发;正常 clone 不命中 |
| 风险 | fingerprint 误判(例如把 single-repo 误标成 multi-repo) | fingerprint advisory + LLM 仍叠加 graph-facts 核对;contract test 覆盖典型拓扑;PA-pre calibration 在 ≥3 仓库实测 |
| 风险 | high-risk workflow 维护 capability matrix 增加维护成本 | 限定 3 个 high-risk workflow,其他继承 default;矩阵 6 行 5 列上限;新 scenario class 加入走 `using-spec-first` SKILL.md RFC 流程 |
| 风险 | setup 层与 bootstrap 层 fingerprint 不一致(stale_setup_layer) | `freshness.stale_setup_layer` 字段显式暴露;router 检测到 stale 时主动提示;LLM 看到 stale 时必须主动判断重跑 |
| 风险 | Cross-platform 不对称导致 Codex 体验下降 | §4.2 cross-platform invariants 表格 + contract test 强制对齐 |

---

## 7. 落地序列

继承前一份报告(`2026-05-28-mcp-setup-graph-bootstrap-深度优化建议.md`)的 P0-P9,在前面插入 **PA-pre / PA / PB**,中间插入 PC、PD,并调整 PD 时序使 Evaluation Harness 与产物同步。

每步独立可发布、独立可回滚。

| Step | 内容 | 依赖 | 改动量 | 价值 |
|---|---|---|---|---|
| **PA-pre** | Calibration:在 ≥3 个真实仓库(spec-first 本仓、kaz-mvp、外部 npm 项目)实测,收集 Scenario class 取值与维度向量的真实分布;RFC 收口枚举值 | - | 小(调研性) | 避免 schema 单样本过度泛化 |
| **PA-1** | `developer-scenario-fingerprint-setup.v1` schema 冻结 + `mcp-setup` 在 verify-tools 阶段产出 setup 层 + 双宿主对称 | PA-pre | 中 | setup 阶段就有场景事实可用 |
| **PA-2** | `developer-scenario-fingerprint.v1` schema 冻结 + `graph-bootstrap` 产出 bootstrap 层(merge setup 层) | PA-1 + P0~P4 增量字段 | 中 | 完整事实闭环 |
| **PB** | `using-spec-first` 读 fingerprint(优先 bootstrap 层,fallback setup 层)+ 维度独立路由 | PA-1(可早跑,PA-2 后字段更全) | 小 | 立刻改善 foreign-residual / blocked 场景体验 |
| P0 | parent-artifact-quarantine.v1 + clean read-only 列举 | PA-1(消费 foreign_residual_indicators) | 小 | 修补 Evidence Harness |
| P1 | provider-status.json 增 repo_label_resolution | - | 小 | 修补 repo_label 隐性误导 |
| P2 | graph-facts.json 增 dirty_paths_sample | - | 小 | 修补 dirty 影响面盲区 |
| P3 | graph-bootstrap final response 强制 drift handoff 行 | - | 极小 | 防止 handoff 丢失 |
| **P5-min** | graph-bootstrap-summary.json 增 quality_signals 最小子集(child_count / process_results_rate / command_failed_rate / dirty_advisory_child_rate)| P0-P3 | 小 | Evaluation Harness 与产物同步发布;不等 P4 完成 |
| **PD-min** | spec-optimize 接入 P5-min 子集作为基线指标 | P5-min | 小 | Evaluation Harness 即刻闭环 |
| P4 | graph-targets.json 增 non_git_build_modules / coverage_summary;Gradle + npm 优先,其他 ecosystem 后续 PR | PA-1(共享 build manifest scan helper) | 中→大 | 提供 git_misaligned_build_targets 输入;按文档 A §5 P4 已细化的 ecosystem 解析器策略落地 |
| **PC** | `docs/contracts/workflows/scenario-capability-matrix.md` 默认契约 + 3 个 high-risk workflow override + contract test | PA-2 + P0~P4 | 中(收窄后) | Execution Harness 契约化;符合 80/20 |
| P5-full | quality_signals 补全 build_target_coverage_ratio / impact_probe_with_test_provenance_rate / host_instruction_drift_rate | P4 + P5-min | 小 | Evaluation Harness 字段集完整 |
| PD-full | spec-optimize 扩展使用 P5-full 全集 + 维度向量做循环优化 | P5-full + PA-2 | 中 | 真正闭环 |
| P6 | spec-first clean --workspace-orphans 升级为 preview-first 实际删除 | P0 | 小 | Governance Harness 闭环 |
| P7 | GitNexus capability surface diff 报告 | - | 中 | 跟上 provider 演化 |
| P8 | probe candidate 多样性 | - | 小 | 提升 fallback 分散性 |
| P9 | (roadmap)build-target-level GitNexus indexing,等上游 | - | 大 | 战略级 |

### 7.1 关键依赖路径(已 unwind 循环依赖)

- **PA-pre → PA-1**:calibration 决定 schema 取值,**必须先做**
- **PA-1 → P0/P1/P2/P3**:setup 层 fingerprint 提供 foreign_residual_indicators 等字段
- **PA-1 + P0-P3 → PA-2**:bootstrap 层 fingerprint merge setup 层 + bootstrap 阶段新增字段
- **P4 解耦**:P4 build-target scan 是 **PA-2 字段 `build_target_coverage_ratio` 的依赖**;PA-2 在 P4 完成前可以发布,但该字段值为 `null` + `reason_code: pending-build-target-scan`,P4 完成后回填——**消除循环依赖**
- **P5-min 与 PD-min 早**:Evaluation Harness 不等 P4 完成就先发布最小子集,符合角色契约 §7"新机制发布与评估指标同步"
- **PC 在 PA-2 之后**:capability matrix Required Evidence 列引用的字段必须存在
- **PB 时序灵活**:可以在 PA-1 后就发布(只读 setup 层),PA-2 后增强(优先读 bootstrap 层)

### 7.2 发布节奏建议

按 2-3 周一个里程碑:

- **M1**:PA-pre + PA-1 + PB(场景指纹首版可用)
- **M2**:P0 + P1 + P2 + P3 + P5-min + PD-min(Evidence + Evaluation 同步)
- **M3**:PA-2 + P4(Gradle) + PC(完整闭环)
- **M4**:P4(npm) + P5-full + PD-full + P6(深化)
- **M5**:P7 + P8(优化)
- **Roadmap**:P9(等上游)

---

## 8. 测试与验证策略

| 层级 | 测试 | 覆盖目标 |
|---|---|---|
| Schema 测试 | `developer-scenario-fingerprint.v1` 字段校验 | 必填/可选字段、enum 取值、advisory 固定 true |
| Unit 测试 | fingerprint 产出函数对各拓扑的输入输出 | single-repo / multi-repo / non-git / cross-machine / submodule-heavy / mixed-build-system |
| Contract 测试 | 各 workflow Scenario Capability Matrix 完备性 | 每个 Scenario class 至少 1 行;每个 Capability class 至少 1 测试案例 |
| Integration 测试 | `mcp-setup → using-spec-first` 端到端 | router 在每个优先级条件下推荐正确入口 |
| Smoke 测试 | 实际仓库回归 | spec-first 本仓 + kaz-mvp(multi-repo) + 临时构造的 non-git 仓 |
| Fresh-source eval | using-spec-first / 各 workflow 行为语义 | 按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 跑 |
| 双宿主 | Bash 与 PowerShell 输出 fingerprint 字段一致 | 字段集 + 取值范围一致 |

---

## 9. 文档与 Changelog

### 9.1 必须同步更新

- `CHANGELOG.md`:每个 P 步骤的 user-visible 行为变化(scenario-fingerprint 暴露场景、using-spec-first router 行为改变、各 workflow 降级路径契约化)
- `README.md` / `README.zh-CN.md`:简介中提及"场景自适应"作为核心能力之一
- `docs/05-用户手册/`:新增章节"研发场景与降级路径"
- `docs/contracts/`:新增 `developer-scenario-fingerprint.md` 描述 schema 与产出语义
- `docs/contracts/workflows/`:新增 `scenario-capability-matrix.md` 描述矩阵的统一格式与 Scenario class 取值
- `skills/spec-mcp-setup/SKILL.md`:在 Outputs / Workflow 节中加入 fingerprint 产出步骤
- `skills/using-spec-first/SKILL.md`:在 router 段落引入 fingerprint 优先级判断
- `skills/spec-*/SKILL.md`(各公开 workflow):统一增加 Scenario Capability Matrix 节

### 9.2 不更新

本实施方案文档本身不属于 source 变更(它是 docs/03-实施方案 下的规划),无需 CHANGELOG 记录。
实际落地 P0-P9 各步骤时,**每个 PR** 必须按 user-visible 规则更新 CHANGELOG。

---

## 10. 决策与开放问题

### 10.1 已决策(本次修订后)

- fingerprint 拆分为 **setup-time 层** 与 **bootstrap-time 层**,两份独立文件,bootstrap 层 merge setup 层并显式 `freshness.stale_setup_layer` 标记(原方案的单层"setup 时产出却含 bootstrap 字段"自相矛盾问题解决)
- fingerprint 永远 `advisory: true`,不会成为硬 gate
- **删除 `scenario_complexity_score`**,改为 `complexity_dimensions.*` 维度向量(避免状态机思维)
- **删除 `downstream_routing_hints.*` prose 字段**,改为 `affected_downstream_workflows[]` 与 `recommended_repair_workflows_when_relevant[]` 枚举(避免 scripts 越界)
- **删除 `provider_capability_class` 自定义枚举**,改为 `providers_status_refs.*` 引用既有 provider-status.json 字段(避免多真相源)
- **删除 `scenario_summary_label` prose 拼接**,改为 `tags[]` 枚举数组(LLM 可 parse)
- Capability Matrix 分级:**1 份外置 default + 3 个 high-risk workflow override**(`spec-work` / `spec-code-review` / `spec-debug`),其他 workflow 继承 default(避免 80% 工作量)
- 矩阵列固定(Scenario class / Capability class / Required Evidence / Fallback path / LLM 决策点)
- Scenario class 与 Capability class 取值全 workflow 统一,新增走 RFC(由 `using-spec-first` SKILL.md 维护)
- **PA-pre calibration 必须在 schema freeze 前完成**(≥3 仓库实测)
- PA-1 → PA-2 顺序固定;PB 可在 PA-1 后即发布;PC 必须在 PA-2 之后
- Evaluation Harness 与产物同步:**P5-min + PD-min 提前到 P3 之后**,不等 P4 完成
- §4.2 Cross-platform Fingerprint Invariants 表格 + contract test 强制 Bash / PowerShell 对称
- `state_class` 取值严格区分 `foreign-residual`(异常拷贝)与 `first-time-on-new-machine`(正常 clone),用 stat 失败 + 路径前缀双重判断

### 10.2 开放问题(待 plan/brainstorm 阶段细化)

1. **Build manifest 扫描深度**:PA-pre draft 校准建议默认 depth=4。kaz-mvp 的 Gradle manifest 在 `feature/*/*` 与 `submodules/*/*` 下出现,depth=3 会低估 build target 覆盖。
2. **PA-pre calibration 样本选择**:第 3 个样本已先用本地临时 pnpm workspaces 最小样本验证字段形态;本地执行环境无法直接联系 ≥3 个真实使用场景开发者,因此记录为 limitation,不阻断 PA-1 provisional freeze。
3. **Scenario class 命名空间**:PA-pre draft 建议 9 个 provisional class:`clean-single-repo`、`dirty-single-repo`、`first-time-git-repo`、`multi-repo-workspace`、`multi-repo-dirty-workspace`、`foreign-residual-workspace`、`non-git-folder`、`non-git-build-workspace`、`provider-degraded`;新增/修改走 RFC。
4. **维度向量字段集**:PA-pre provisional freeze 建议首版 7 个 boolean:`multi_repo_workspace`、`non_git_folder_target`、`non_git_build_targets_present`、`git_alignment_broken`、`parent_repo_local_artifacts_present`、`worktree_dirty_graph_affecting`、`provider_query_degraded`;M3 证据回放后再决定是否 RFC 调整。
5. **High-risk workflow 选定**:`spec-work` / `spec-code-review` / `spec-debug` 是否覆盖全部 high-risk?`spec-doc-review` 是否也需要?在 PC 阶段决定
6. **`tags[]` 命名空间**:首版枚举值如何统一?建议在 docs/contracts/developer-scenario-fingerprint.md 中维护
7. **PB router 维度优先级配置化**:§3.4 6 个优先级是否固定写死,还是允许用户配置?默认固定;配置化作为后续 PR
8. **`recommended_repair_workflows_when_relevant[]` 与 `affected_downstream_workflows[]` 的边界**:两者都是枚举,但前者是"修复入口"后者是"受影响的下游",contract 中需要明确取值集合不重叠

---

## 11. 已执行的验证

- ✅ 基于 kaz-mvp 实测产物(2026-05-28)推导设计
- ✅ 与角色契约 10 项要求做一致性自检(§5,本次修订扩展到 10 项)
- ✅ 与前一份优化建议报告(P0-P9 序列)对齐落地序列
- ✅ 多 lens 审查与修订(coherence / feasibility / scope-guardian / adversarial / product-lens)在 2026-05-28 完成,Critical 4 项 + Major 6 项全部修订(详见 §13 修订历史)
- ⚠️ 未执行(明确为 plan 阶段任务):
  - PA-pre calibration:在 spec-first 本仓 + kaz-mvp + 标准 npm monorepo(待选)实测 fingerprint 取值分布
  - 多 ecosystem build manifest scan 原型(Gradle 优先,见 §7 P4)
  - 双宿主对称性验证(Bash + PowerShell)
  - PB router 在每个优先级条件下的端到端 LLM 路由行为验证
- ⚠️ 零原型实施成本评估:本方案的改动量评估**基于推断**,不含 prototype 实际测量;plan 阶段必须用最小 prototype 验证 PA-1 + PB 改动量

---

## 12. 一句话总结

> **当前 spec-first 是"单 git repo 隐性默认 + 多场景靠每个 workflow 各自打补丁"。本方案把场景适配从 prose 判断升级为契约化事实——两层 fingerprint(setup-time + bootstrap-time)+ 维度向量(不合成评分)+ 1 份 default capability matrix + 3 个 high-risk override + 1 个维度驱动 entry router——让 spec-first 在任意研发场景下都能高质量辅助交付,且新场景接入不需要改每一个 workflow,也不引入状态机思维或多真相源。**

---

## 13. 修订历史

### 2026-05-28 v0.2(本次修订)

基于审查报告(`docs/03-实施方案/2026-05-28-spec-first-场景自适应实施方案.md` 的多 lens 评审)修订 4 项 Critical + 6 项 Major + 6 项 Minor:

**Critical 修订**:
- C1 删除 `downstream_routing_hints.*` prose 字段(scripts 越界),改 `affected_downstream_workflows[]` 枚举(§3.2)
- C2 fingerprint 拆分为 setup-time / bootstrap-time 两层,解决产出时机矛盾(§3.2)
- C3 删除 `scenario_complexity_score` 单一评分,改 `complexity_dimensions.*` 维度向量(§3.2 / §3.4)
- C4 `provider_capability_class` 改为 `providers_status_refs.*` 引用,消除多真相源(§3.2)

**Major 修订**:
- M1 Capability Matrix 改为 default + 3 个 high-risk override,不要求每个 workflow 内嵌(§3.3)
- M2 `state_class` 严格区分 `foreign-residual`(异常)与 `first-time-on-new-machine`(正常)(§3.2 / §3.4 / §6)
- M3 Evaluation Harness 提前:P5-min + PD-min 在 P3 之后即发布(§7)
- M4 新增 PA-pre calibration 步骤,schema freeze 基于 ≥3 仓库样本(§7)
- M5 fingerprint 增 `freshness.stale_setup_layer` 显式标记,LLM 看到 stale 主动重跑(§3.2.4)
- M6 §4.2 新增 Cross-platform Fingerprint Invariants 子节 + contract test 强制对齐(§4.2)

**Minor 修订**:
- m1 删除 `scenario_summary_label` prose 拼接,改 `tags[]` 枚举(§3.2)
- m2 §7 落地序列 unwind PA 与 P4 循环依赖(PA-2 字段先空 + P4 回填)(§7.1)
- m3 §10.2 清理已通过修订解决的开放问题(`downstream_routing_hints` 语言、`scenario_complexity_score` 公式)
- m4 §11 已执行验证补充零原型成本评估说明
- m5 §6 风险表补充 stale_setup_layer / cross-platform 不对称两条
- m6 §5 一致性自检从 8 项扩展到 10 项,增加 schema 单一样本风险与状态机思维两项

### 2026-05-28 v0.1(初版)

初稿,基于 kaz-mvp 实测推导。

---

## 附录 A:与 `2026-05-28-mcp-setup-graph-bootstrap-深度优化建议.md` 的关系

| 维度 | 前一份报告 | 本方案(v0.2) |
|---|---|---|
| 视角 | 两个 skill 内部优化 | 跨 workflow 的场景自适应架构 |
| 触发 | kaz-mvp 实测发现 D1-D8 缺陷 | 把 D1-D8 抽象为场景维度,系统化解决 |
| 改动面 | mcp-setup + graph-bootstrap | + using-spec-first + 3 个 high-risk workflow + default matrix |
| 新增产物 | parent-artifact-quarantine.v1 等 | + developer-scenario-fingerprint-setup.v1 / developer-scenario-fingerprint.v1 / scenario-capability-matrix.md |
| 落地序列 | P0-P9 | 在前插 PA-pre / PA-1 / PA-2 / PB,中间插 PC / PD,P5/PD 拆 min 与 full 两阶段提前 |
| 关系 | 子集(Tier-1) | 超集(架构层),前一份报告作为本方案的执行基础 |
| 与角色契约对齐 | 高 | v0.1 中→低,v0.2 高(经修订) |

**结论**:本方案 v0.2 修订完成后,可与前一份报告一起进入 spec-plan,合并为一个 Milestone。前一份报告的 P0-P9 作为本方案的 Tier-1 实现基础,本方案的 PA-pre / PA-1 / PA-2 / PB / PC 在前者之上叠加场景维度。
