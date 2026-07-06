---
date: 2026-05-27
topic: mixed-topology-broken-worktree-optimization
spec_id: 2026-05-27-002-mixed-topology-broken-worktree-optimization-proposal
status: draft
revision: v0.2
revision_log:
  - v0.1 (2026-05-27): 初稿,P0/P1/P2/P3 分级,7 个 Open Questions
  - v0.2 (2026-05-27): 第一轮审查闭合 — 锁定 P0→P1→spike→P2 顺序;R2 emit 条件收敛到 workspace-* mode;R4 并发风险文案;R6 path 解析规则(workspace_root 基,拒绝 `..` 上溯);R7 CLI 显式参数优先于配置;P0 新增 schema_version 全仓 grep;P2 新增父级索引耗时实测前置;Open Question 2/4/5 解决并下沉到对应需求/Out of Scope
---

# spec-first 优化方案：适配混合拓扑 + broken worktree 场景

## Summary

本方案针对 spec-first 在"父级 git worktree 失效 + 子目录混合独立 git repo + 大量非 git 业务模块"这一真实工作区拓扑下的诊断盲区与覆盖缺口，提出按 P0/P1/P2/P3 分级的源码优化路径。核心判断是：spec-first 当前 `--folder` non-git-folder 模式已经是 first-class 能力，缺的是 **诊断诚实性**（broken worktree 检测、未覆盖目录可见性）和 **配置驱动的混合拓扑表达**，而不是新增 capability。

P0 让用户立刻看见"为什么只跑了 N 个"的真实原因，P1 提供 preview-first 的修复脚本，P2 用 `.spec-first/config.local.yaml` 显式声明拓扑覆盖规则，P3（混合拓扑 first-class）作为 future work 暂不立项。

**执行顺序锁定为 P0 → P1 → GitNexus multi-target spike → P2**，不是 P0/P1/P2 并行。理由：P2 R8 的"bootstrap-providers --all-repos 追加 --folder 调用"强依赖 spike 验证 `.gitnexus/meta.json` 在多 target 并存时的 label 行为，spike 不通过则 P2 整体降级或推迟。P0 是用户当下最痛的信息差消除，独立可落地；P1 是 P0 next_action 文案的闭环动作；spike 是 P2 的前置事实校验；P2 在 spike 通过后立项。

---

## Problem Frame

### 真实触发场景（kaz-mvp）

工作区根 `/Users/kuang/xiaobu/kaz-mvp` 拓扑：

```
kaz-mvp/
├── .git                   ← 文件 82 字节，内容为 `gitdir: /Users/lynwang/...`(失效路径)
├── annotation/ annotationprocessor/ app-core/ app-gradle/ app-kaz/
├── contract/ core/ feature/ foundation_layer/ hsconfig/ hszq-version/
├── pager_reach/ repo/ scm/ tmpmob/ 参考代码userinfo/        ← ~30+ 个非独立 git 业务模块
├── common/ resources/                                        ← 2 个独立 child Git repo
└── submodules/biz-common, hscomponents, userinfo, web        ← 4 个独立 child Git repo
```

`spec-mcp-setup` + `spec-graph-bootstrap --all-repos` 跑完后，用户问："当前项目下那么多文件夹，为何只跑了 6 个？"

### 当前 spec-first 行为分析

1. `skills/spec-mcp-setup/scripts/resolve-project-target.sh:114` 用
   ```bash
   CWD_GIT_ROOT="$(git -C "$INVOCATION_CWD" rev-parse --show-toplevel 2>/dev/null || true)"
   ```
   把 stderr 全部吞掉，broken worktree pointer、损坏 gitdir、真的不是 git repo 三种情况完全无法区分。
2. `discover_candidates`（resolve-project-target.sh:148-191）只把"自己有 `.git` 且 `git rev-parse` 能成功"的子目录加入候选；其他非 git 子目录在 emit 输出里**完全不出现**。
3. 输出 schema `project-target.v1` 没有 `git_health`、`coverage_gap`、`worktree_pointer` 等诊断字段。
4. workspace-multi-repo 模式下，父级被静默放弃，下游 workflow 无从知道：父级 30+ 业务模块的代码没有任何 graph readiness target 覆盖。

### 真正的能力盲点（不是缺失，是隐藏）

`--folder` non-git-folder 模式已是 first-class：
- `resolve-project-target.sh:230-239` 支持 `mode=non-git-folder` / `target_kind=non-git-folder`。
- `bootstrap-providers.sh:809-1322` 多处分支处理 `TARGET_KIND="non-git-folder"`，包含 content fingerprint、incremental 屏蔽、folder snapshot、impact-capability 分支。
- GitNexus 官方支持 `analyze --skip-git`（在 [2026-05-25-001 gitnexus-only-graph-provider requirements](./2026-05-25-001-gitnexus-only-graph-provider-requirements.md) 已确认）。

但用户必须**显式传 `--folder <path>`**，且 workspace-multi-repo 模式下没有任何 advisory 提示这条路径存在。

---

## Actors

- A1. Developer：在混合拓扑 / broken worktree / 团队间分发 worktree 等场景下使用 spec-first，希望快速理解"为什么我的 30 个核心模块没被建图"并选择修复路径。
- A2. `spec-mcp-setup`：preflight 阶段需要诚实暴露 git_health 与 coverage_gap，不再静默把 broken worktree 当作 not-git。
- A3. `spec-graph-bootstrap`：消费 setup 产出的 git_health / coverage_gap / additional_folder_targets 配置，决定是否对父级 folder target 也跑一次 GitNexus。
- A4. `using-spec-first`：guide mode 在 broken-worktree 状态下推荐第一步使用 `spec-first repair-worktree`，而不是直接跳 plan/work。
- A5. spec-first 维护者：愿意以最小改动暴露诊断信息，不愿意立即引入混合拓扑 first-class（P3）。

---

## Key Flows

### F1. broken worktree 诊断暴露

- **Trigger:** `spec-mcp-setup` 在父级或 child 子目录存在 broken worktree 的工作区运行
- **Actors:** A1, A2
- **Steps:** `resolve-project-target` 调用 `git rev-parse` 失败时，捕获 stderr，读取 `.git` 文件内容判断是 worktree pointer 还是 gitdir 文件，验证目标路径存在性，输出 `git_health.status="broken-worktree"` + `worktree_pointer.exists=false` + 诊断摘要。同一逻辑也在 `discover_candidates` 内部对每个有 `.git` 但 `git rev-parse` 失败的 child 子目录执行——broken child 不进 `candidate_roots`，但其诊断信息记入 `candidates_diagnostics[]` 附属输出，避免静默跳过。`check-health` 把这些字段冒泡到 preflight JSON，`verify-tools` 写入 readiness ledger v2 的 `parent_workspace_advisory.git_health`。
- **Outcome:** 用户在 setup 报告中第一时间看到"父级 .git 是失效 worktree pointer，指向 X，X 不存在"；如有 child broken worktree，也能看到"子目录 Y 有 .git 但 worktree pointer 失效，未纳入候选"。
- **Covered by:** R1, R2

### F2. 未覆盖目录可见性（coverage gap）

- **Trigger:** workspace-multi-repo 模式下，发现 N 个 child git repo，但父级还有 M 个非 git 顶级目录
- **Actors:** A1, A2
- **Steps:** `resolve-project-target` 在 `discover_candidates` 后再扫一次顶级目录，统计"既不是 child git repo、也不在 spec-first 已知忽略列表"的目录数；emit `coverage_gap.uncovered_top_level_dirs` 计数 + `sample[]` 前若干个目录名 + `advisory` 文案。
- **Outcome:** 用户清楚看到"6 个 child git repo + 30+ 个未覆盖目录"，并被引导考虑修复 / `--folder .` / 配置 additional_folder_targets。
- **Covered by:** R2, R3

### F3. 修复指引（preview-first）

- **Trigger:** 用户运行 `spec-first repair-worktree`（默认 dry-run）
- **Actors:** A1, A4
- **Steps:** 脚本读取 `.git` 现状，确认是 broken-worktree 后给出 unlink preview + 两条手动 git 修复的文案建议，等用户加 `--apply` 才真正执行 unlink。
- **Outcome:** 用户从诊断结果一步走到具体修复选择，无需 google "broken git worktree pointer"。
- **Covered by:** R4, R5

### F4. 显式拓扑配置覆盖

- **Trigger:** 用户在 `.spec-first/config.local.yaml` 写 `workspace.additional_folder_targets[]`
- **Actors:** A1, A3
- **Steps:** `resolve-project-target` 优先读这个配置，输出 `mode="workspace-mixed-topology"` 并 emit `additional_folder_targets[]`（含自动合并 discovered child git roots + ignore list 到 `computed_exclude`）。`bootstrap-providers --all-repos` loop 在每个 child 之后按 `additional_folder_targets[]` 追加 `--folder` 调用，写入 child-equivalent 的 `.spec-first/graph/*` artifacts；parent advisory summary 增 `additional_folder_targets[]` 行。
- **Outcome:** 一次配置之后，每次 `--all-repos` 都自动覆盖父级业务模块，不需要每次手动 `--folder .`。
- **Covered by:** R6, R7, R8

### F5. 当前可用 workaround（不改 spec-first）

- **Trigger:** 在 P0/P1/P2 落地前，用户已经面对 broken worktree
- **Actors:** A1
- **Steps:** 直接跑 `bash .claude/spec-first/workflows/spec-graph-bootstrap/scripts/bootstrap-providers.sh --folder /Users/kuang/xiaobu/kaz-mvp`，把整个父目录作为 non-git-folder target 索引；如果担心和 child git repo 重复索引，先在 `.gitnexus/ignore`（或 GitNexus 等价配置）排除 6 个 child path。
- **Outcome:** 立刻拿到父级 30+ 业务模块的 GitNexus 图谱，但需要用户自己知道这条路径——这正是 P0 要消除的信息差。

---

## Requirements

### R1. broken worktree 检测

`resolve-project-target.{sh,ps1}` 必须在**两个位置**区分以下三类 git 失败：

1. **父级入口**（L114 `CWD_GIT_ROOT` 判断）
2. **child 发现阶段**（`discover_candidates` L169-176，对每个有 `.git` 但 `git rev-parse` 失败的子目录）

三类 git 失败分类：

| 状态 | 触发条件 | git_health.status |
| ---- | -------- | ----------------- |
| 真不是 git | 没有 `.git` 文件 / 目录 | `not-git` |
| broken worktree | `.git` 是文件，内容为 `gitdir: <path>`，但 `<path>` 不存在 | `broken-worktree` |
| 损坏 gitdir | `.git` 是目录但 `git rev-parse` 失败（HEAD 损坏、refs 缺失等） | `corrupted-gitdir` |
| 健康 | `git rev-parse --show-toplevel` 成功 | `ok` |

**父级输出字段**（schema `project-target.v2`，向下兼容）：

```json
{
  "schema_version": "project-target.v2",
  "git_health": {
    "status": "broken-worktree",
    "git_file_path": "/Users/kuang/xiaobu/kaz-mvp/.git",
    "worktree_pointer": {
      "gitdir_path": "/Users/lynwang/CompanySource/kaz-worktree/kaz-repo/.git/worktrees/kaz-mvp",
      "exists": false
    },
    "diagnostic_summary": "git rev-parse failed: fatal: not a git repository: '/Users/lynwang/...'"
  }
}
```

**child 发现阶段**：broken child 不进 `candidate_roots`（行为不变），但诊断信息记入 `candidates_diagnostics[]`：

```json
{
  "candidates_diagnostics": [
    {
      "path": "some-child",
      "git_health": {
        "status": "broken-worktree",
        "worktree_pointer": { "gitdir_path": "/old/path/.git/worktrees/some-child", "exists": false }
      }
    }
  ]
}
```

`candidates_diagnostics` 仅在有 broken/corrupted child 时出现，空数组不输出。

诊断检测**必须 read-only**，绝不自动修复。

### R2. coverage_gap 输出

**Emit 条件**：仅当 `mode` 属于以下集合时 emit `coverage_gap`：

- `workspace-multi-repo`
- `workspace-single-candidate`
- `workspace-no-git-candidates`
- `workspace-mixed-topology`（P2 引入）

明确**不** emit 的 mode：

- `git-repo`（用户已 `--repo` 锁定 child；advisory 噪声）
- `non-git-folder`（用户已 `--folder` 显式覆盖；意图已经表达）
- `invalid-target`（错误路径上无需 advisory）

理由：coverage_gap 是"workspace 发现阶段"的副产品；一旦用户已经表达 target 意图，下游 workflow 不应再被父级未覆盖目录刷屏。

具体 emit 内容：

```json
{
  "coverage_gap": {
    "uncovered_top_level_dirs": 35,
    "sample": ["app-core", "app-kaz", "feature", "core", "contract", "foundation_layer", "hszq-version"],
    "ignored_dir_patterns": [".git", "node_modules", "vendor", ".claude", ".codex", ".agents", ".spec-first", "build", ".cache", ".direnv", ".venv"],
    "advisory": "These dirs are not standalone git repos. If parent .git is broken, fix it (spec-first repair-worktree) or rerun with --folder . to index parent as non-git target."
  }
}
```

`uncovered_top_level_dirs` 计数必须 reuse `discover_candidates` 的忽略列表（`resolve-project-target.sh:163-167`），把 spec-first 自己生成的 mirror 目录、build 产物、依赖目录都排除掉。`sample[]` 取前 7 个按字典序排序的目录名。

**显式变更：** `build` 目录当前不在 `discover_candidates` L163-167 的 case 语句中。本需求要求**同步修改** `discover_candidates` 的忽略列表，使其与 `coverage_gap.ignored_dir_patterns` 保持一致。即 L163-167 的 case 模式从：

```
.git|node_modules|vendor|.claude|.codex|.agents|.spec-first|.cache|.direnv|.venv)
```

变为：

```
.git|node_modules|vendor|.claude|.codex|.agents|.spec-first|build|.cache|.direnv|.venv)
```

两处忽略列表必须由同一个 shell 变量 / 数组维护，避免未来分叉。

### R3. next_action 拓展

`reason_code="workspace-target-required"` 的 next_action 需要按 git_health 分支：

| git_health.status | next_action 文案 |
| ----------------- | ---------------- |
| `broken-worktree` | `Parent .git points to a missing worktree gitdir. Run 'spec-first repair-worktree --dry-run' to see fix options, or rerun graph-bootstrap with --folder . to index parent as non-git target.` |
| `corrupted-gitdir` | `Parent .git directory is corrupted. Inspect with 'git fsck' or rerun graph-bootstrap with --folder . to bypass.` |
| `not-git` | 现有 `Choose a child Git repo and rerun with --repo <child>.` 文案保留 |

### R4. spec-first repair-worktree 子命令

新增 `bin/spec-first.js` 子命令 + `skills/spec-mcp-setup/scripts/repair-worktree.{sh,ps1}`。

入口形式：`spec-first repair-worktree [--dry-run|--apply]`

**默认 dry-run。** `--apply` 才会真正写文件。

**P1 只实现 `--unlink`（唯一内置动作）：**

| 动作 | 行为 | 适用场景 |
| ------ | ---- | -------- |
| unlink（默认且唯一） | 删除 broken `.git` pointer 文件，目录变 not-git | 用户决定改用 `--folder` 模式 |

**其余修复路径降级为诊断文案建议（不实现为子命令）：**

dry-run 输出中，除了 unlink preview，还会打印两条手动修复建议：

```
Suggested manual fixes (not automated by spec-first):

  1. Convert to standalone repo:
     rm .git && git init && git remote add origin <your-remote-url> && git fetch

  2. Retarget worktree pointer:
     echo "gitdir: /correct/path/.git/worktrees/<name>" > .git
```

理由：`git init + remote add + fetch` 和 worktree pointer 重定向都是通用 git 操作，出错时的故障面（remote URL 错误、fetch 失败、worktree 元数据不匹配）超出 spec-first 的诊断/引导职责。保持 spec-first 只做 detect → suggest → 最小修复。

无论 dry-run 还是 apply，`repair-worktree` 都必须先确认当前 `.git` 状态是 `broken-worktree`；在非 broken-worktree 状态下拒绝操作（避免误操作健康 repo 或健康 worktree）。**绝不在 spec-mcp-setup 自动调用**——保持 spec-first 一贯的 detect-then-suggest 原则。

**并发风险与 dry-run 重检：**

- `--apply` 必须在 unlink 前**重新执行**一次 `detect_git_health()`，而不是信任 dry-run 时的状态；两次检测之间 `.git` 可能被外部修改（git GC、IDE 自动 fetch、其他 worktree 操作）。
- 重检结果非 `broken-worktree` 时，apply 拒绝执行并退出 reason_code `repair-worktree-state-changed`，提示用户重跑 dry-run。
- dry-run 输出文案开头必须包含 advisory：

```
Note: This is a snapshot at <ISO8601 timestamp>. Before running --apply, ensure no
other git operation is in progress (IDE fetch, manual `git worktree`, GC). --apply
will re-check .git status and refuse to proceed if it changed.
```

- 整个 unlink 操作（detect → unlink）必须在同一进程内顺序执行，不引入外部锁文件（spec-first 不在 git 仓库上加锁）。

### R5. setup readiness ledger v2 暴露 git_health

`verify-tools.{sh,ps1}` 把 `git_health` 与 `coverage_gap` 写入 readiness ledger 的 `parent_workspace_advisory` 节点：

```json
{
  "schema_version": "v2",
  "baseline_ready": true,
  "parent_workspace_advisory": {
    "git_health": { "...": "..." },
    "coverage_gap": { "...": "..." },
    "repair_action_available": true,
    "repair_command": "spec-first repair-worktree --dry-run"
  }
}
```

`parent_workspace_advisory` **不进入 `baseline_ready` 计算**——它是 advisory，不阻塞下游 workflow。

### R6. workspace 配置段（.spec-first/config.local.yaml）

新增 `workspace` 段，只支持 `additional_folder_targets[]` 声明——有此字段即意味着混合拓扑：

```yaml
workspace:
  additional_folder_targets:
    - path: "."
      label: "kaz-mvp-parent"
      extra_exclude:
        - "build"
        - "node_modules"
```

设计原则：

- **无 `parent_role` 枚举**。`monorepo` / `multi-repo-workspace` / `advisory-only` 都是现有默认行为的自动推断结果，无需配置。配置 `additional_folder_targets` 即隐含 `non-git-folder-target` 语义。其他 parent_role 候选值（monorepo、multi-repo-workspace、advisory-only）留作 P3，等 ≥2 个组织再次报告同类需求再立项。
- **`extra_exclude` 是增量声明，不是全量声明**。`discover_candidates` 发现的所有 child git roots **自动合并**到 exclude 列表（脚本负责确定性工作），用户只需声明脚本不知道的额外排除项（如 build 产物、大型 vendor 目录）。

**`additional_folder_targets[].path` 解析规则**：

1. **基准目录**：相对路径以 `workspace_root` 为基（不是 `INVOCATION_CWD`，不是配置文件所在目录）。`workspace_root` 在 resolve-project-target 中由 `CWD_GIT_ROOT` 或 `INVOCATION_CWD` 决定。
2. **`.` 是合法值**，等价于 `workspace_root` 本身（最常见用法）。
3. **拒绝 `..` 上溯**：解析后路径必须严格在 `workspace_root` 内（含等于 `workspace_root`）。即使 `../sibling` 解析后仍在 workspace 内（极少出现于嵌套 worktree），仍拒绝；理由是配置文件层面允许 `..` 会让 review 文案和审计输出难以理解。失败 reason_code `additional-folder-target-uses-parent-ref`。
4. **绝对路径**：允许，但同样必须落在 `workspace_root` 内；不在则 reason_code `additional-folder-target-outside-workspace`。
5. **路径不存在 / 不是目录 / 是符号链接指向 workspace 外**：分别 reason_code `additional-folder-target-not-found` / `additional-folder-target-not-directory` / `additional-folder-target-symlink-escape`。
6. **`extra_exclude` pattern 形式**：简单相对路径前缀 + 末尾 `*` 通配（例如 `build`、`build/*`、`vendor`）；**不引入完整 glob 库**。`*` 只能在末尾段，不支持 `**` 跨层匹配。复杂 ignore 需求引导用户使用 GitNexus 原生 `.gitnexus/ignore`。

自动 exclude 合并行为：

```
final_exclude = discovered_child_git_roots
              ∪ discover_candidates_ignore_list  (.git, node_modules, vendor, .claude, .codex, .agents, .spec-first, .cache, .direnv, .venv, build)
              ∪ user_extra_exclude
```

`write-provider-config` 在写入前输出 computed `final_exclude` 用于审计，但不要求用户手动列出 child git roots。

### R7. resolve-project-target 优先读 workspace 配置

**优先级（从高到低）：**

1. CLI 显式参数 `--folder <path>` → `mode="non-git-folder"`，**忽略** `workspace.additional_folder_targets` 配置，行为与现状完全一致。
2. CLI 显式参数 `--repo <path>` → `mode="git-repo"`，**忽略** `workspace.additional_folder_targets` 配置。
3. 无显式 CLI 参数 + `CWD_GIT_ROOT` 非空 → `mode="git-repo"`（cwd-git-root 自动选择），**忽略** `workspace.additional_folder_targets`。
4. 无显式 CLI 参数 + `CWD_GIT_ROOT` 为空 + `workspace.additional_folder_targets[]` 存在 → `mode="workspace-mixed-topology"`。
5. 无显式 CLI 参数 + `CWD_GIT_ROOT` 为空 + 无配置 → 现有 `workspace-multi-repo` / `workspace-single-candidate` / `workspace-no-git-candidates`。

理由：CLI 显式参数代表用户当前会话意图，配置代表常态默认。配置只在用户没有显式表达意图时生效。

如果走到分支 4，`resolve-project-target` 必须：

1. 读取配置，按 R6 规则解析 `additional_folder_targets[].path` 为绝对路径并完成所有校验；
2. 在正常的 workspace-multi-repo 判断之后（即仍然跑 `discover_candidates` 拿到 child git roots），额外 emit `additional_folder_targets` 字段到输出 JSON；
3. `mode` 输出从 `workspace-multi-repo` 变为 `workspace-mixed-topology`（新 mode），标识下游需要双轨处理。

```json
{
  "schema_version": "project-target.v2",
  "mode": "workspace-mixed-topology",
  "additional_folder_targets": [
    {
      "path": "/Users/kuang/xiaobu/kaz-mvp",
      "label": "kaz-mvp-parent",
      "computed_exclude": ["common", "resources", "submodules/biz-common", "..."],
      "exclude_source": { "auto_child_git_roots": 6, "auto_ignore_list": 10, "user_extra_exclude": 2 }
    }
  ]
}
```

无 `workspace.additional_folder_targets` 配置时，行为完全不变（`workspace-multi-repo` / `git-repo` 等现有 mode 保持）。

旧消费者遇到 `workspace-mixed-topology` mode 时，因不识别该 mode，fallback 到 `next_action` 提示用户升级 spec-first。

### R8. bootstrap-providers --all-repos 覆盖 additional_folder_targets

`bootstrap-providers.{sh,ps1}` 的 all-repos loop 在原有 child loop 之后，按 `additional_folder_targets[]` 追加 `--folder <path>` 调用，写入：

- 子目录路径下 `.spec-first/graph/*`、`.spec-first/providers/gitnexus/*`、`.spec-first/impact/*`（与现有 child target 写入位置一致）
- parent advisory summary `.spec-first/workspace/graph-bootstrap-summary.json` 的 `additional_folder_targets[]` 节点

repo label 由 `additional_folder_targets[].label` 显式指定，避免和 child git repo label 冲突。

`--folder` 调用时传入 `computed_exclude`（由 R6 定义的 `discovered_child_git_roots ∪ ignore_list ∪ user_extra_exclude` 自动合并结果），确保 GitNexus 不重复索引 child git repo 已覆盖的内容。

---

## Out of Scope

- **P3 混合拓扑 first-class**：让 graph-providers.json 支持 multi-target 数组、bootstrap 单次调用统一处理 child + folder targets。改动面太大（reader scripts、verify-tools、advisory schema），且 P2 已经覆盖 90% 实际需求。等 ≥2 个组织再次报告同类痛点再启动。
- **P3 parent_role 枚举扩展**：`monorepo` / `multi-repo-workspace` / `advisory-only` 等 parent_role 候选值推迟到有真实需求再立项。当前只需 `additional_folder_targets` 隐含的 non-git-folder-target 语义。
- **P3 repair-worktree 高级修复**：`--convert-to-repo`（git init + remote add + fetch）和 `--retarget-worktree`（修改 worktree pointer）超出 spec-first 诊断/引导职责，出错的故障面过大。P1 只实现 `--unlink`，其余作为手动 git 命令在 dry-run 文案中建议。
- **GitNexus 1.6.5 native crash 兜底**：`hscomponents` / `userinfo` 在 all-repos 串行模式下连续 `npx -y gitnexus@1.6.5 analyze` 触发 `Napi::Error`，是 GitNexus upstream 问题，不在本提案范围。本提案只在 P0 readiness ledger 多记录一个 `provider_runtime_advisory.crash_frequency` advisory 字段，给 LLM 知道"这个 provider 偶发 native crash"，让它不再误以为是 spec-first 配置问题。
- **自动 broken worktree 修复**：repair-worktree 永远 preview-first，spec-mcp-setup 不会自动调它。

---

## Files Changed

### P0（诊断诚实性）

**前置审计**：开发前先全仓 grep `"project-target.v1"`、`project-target\.v1`、`schema_version` 在 `resolve-project-target` 输出附近的所有硬编码判断点，输出影响面清单到 plan 文档：

```bash
rg -n '"project-target\.v1"|project-target\.v1' --type-add 'sh:*.{sh,bash}' -t sh -t js -t ps1 -t md
rg -n 'schema_version.*project-target' --type-add 'sh:*.{sh,bash}' -t sh -t js -t ps1
```

预期出现位置：`resolve-project-target.{sh,ps1}`、`write-provider-config.{sh,ps1}`、`verify-tools.{sh,ps1}`、`bootstrap-providers.{sh,ps1}`、相关 contract tests、SKILL.md prose。每个出现点必须按以下二选一明确：

- **接受 v2 超集**：消费者只读字段是否存在，不校验 `schema_version` 字面值（推荐路径）。
- **显式版本判断**：消费者按 `schema_version in {v1, v2}` 分支，旧字段缺失时降级行为明确。

| 文件 | 改动 |
| ---- | ---- |
| `skills/spec-mcp-setup/scripts/resolve-project-target.sh` | 新增 `detect_git_health()` + `compute_coverage_gap()`；提取忽略列表为共享变量（加入 `build`）；schema bump 到 `project-target.v2`；emit `git_health` / `coverage_gap`（按 R2 emit 条件） / `candidates_diagnostics`；`discover_candidates` 内部对 broken child 记录诊断而非静默 skip；按 git_health 拓展 `next_action` 分支 |
| `skills/spec-mcp-setup/scripts/resolve-project-target.ps1` | 与 sh 同步实现；`.git` 文件解析须处理 CRLF 规范化和 Windows 反斜杠路径 |
| `skills/spec-mcp-setup/scripts/check-health.sh` `.ps1` | 把 git_health/coverage_gap/candidates_diagnostics 接进 preflight JSON |
| `skills/spec-mcp-setup/scripts/verify-tools.sh` `.ps1` | readiness ledger v2 增 `parent_workspace_advisory` 节点（不进 baseline_ready） |
| `skills/spec-mcp-setup/SKILL.md` | Workspace Repo Targeting 段补 git_health / coverage_gap / candidates_diagnostics / 拓展 next_action 语义说明 |
| `templates/claude/commands/spec/mcp-setup.md` | 同步描述（如有可见 prose） |
| `tests/integration/spec-mcp-setup/` | 新增 broken-worktree fixture（含父级和 child 两种场景）、coverage-gap fixture、CRLF + Windows 路径 fixture、对应 contract 测试 |
| `tests/unit/resolve-project-target.*.test.js`（如有） | git_health 三态、child candidates_diagnostics、coverage_gap 计数与忽略列表对齐、忽略列表共享变量校验 |
| `docs/02-架构设计/`、`docs/05-用户手册/` | 用户手册补 broken-worktree 章节，架构设计同步 v2 schema |

### P1（修复脚本）

| 文件 | 改动 |
| ---- | ---- |
| `skills/spec-mcp-setup/scripts/repair-worktree.sh` `.ps1` | 新增，仅实现 unlink（dry-run preview + --apply 执行）+ 手动 git 修复文案建议输出 |
| `bin/spec-first.js` | 新增 `repair-worktree` 子命令路由到上面脚本 |
| `tests/integration/spec-mcp-setup/repair-worktree.*` | broken-worktree fixture 跑 unlink 的 dry-run 与 --apply 路径 |
| `docs/05-用户手册/` | 增 repair-worktree 使用文档 |

### P2（配置驱动拓扑）

**前置条件（两项,必须全部通过才能进入 P2 开发）：**

1. **GitNexus multi-target label spike**：验证 `.gitnexus/meta.json` 是否支持同一 workspace 下多 target 并存（父 folder + N child git repo 同时写入 canonical artifacts）。spike 不通过则 R8 降级为文档引导手动分次调用。
2. **父 folder target 索引耗时实测**：在 kaz-mvp 真实场景（~30 个非 git 顶级目录）跑一次 `bootstrap-providers --folder .`，记录端到端耗时。
   - **耗时 ≤ 5 分钟**：直接进入 P2，无额外文案。
   - **耗时 > 5 分钟**：P2 R7 必须在 emit `additional_folder_targets[]` 时附带 `estimated_index_duration_seconds`（按实测向上取整 + 20% buffer），并在 R5 readiness ledger advisory 中加上"父级 folder target 首次索引预计耗时 X 分钟,可考虑后台跑或在 CI off-peak 触发"文案。
   - **耗时 > 15 分钟**：触发"是否在 P2 引入 background mode"的二次设计讨论，本提案不直接 commit。

实测数据连同 spike 结论一起记入 P2 plan 的 Decisions 段。

| 文件 | 改动 |
| ---- | ---- |
| `templates/spec-first/config.local.example.yaml` | 增 workspace.additional_folder_targets 段示例 + 注释说明（无 parent_role 枚举） |
| `skills/spec-mcp-setup/scripts/resolve-project-target.{sh,ps1}` | 优先读 `.spec-first/config.local.yaml.workspace.additional_folder_targets`；新增 `workspace-mixed-topology` mode；emit `computed_exclude` 含自动合并逻辑 |
| `skills/spec-mcp-setup/scripts/write-provider-config.{sh,ps1}` | 输出 computed `final_exclude` 用于审计；校验 additional_folder_targets 路径在 workspace 内 |
| `skills/spec-graph-bootstrap/scripts/bootstrap-providers.{sh,ps1}` | all-repos loop 追加 `--folder` 调用（传入 computed_exclude）；parent advisory summary 增 `additional_folder_targets[]` 节点 |
| `tests/integration/spec-graph-bootstrap/mixed-topology-*` | 混合拓扑 fixture 验证 child + folder 双轨写入、auto-exclude 合并、advisory summary |
| `docs/contracts/graph-provider-consumption.md` | 加 mixed-topology 段，明确 repo label 不冲突约束 |

---

## Compatibility Strategy

- `project-target.v1` 与 `v2` 同时存在：v2 是超集，新增字段 `schema_version="project-target.v2"` 与 `git_health` / `coverage_gap` / `candidates_diagnostics`。已有消费者（write-provider-config、verify-tools、bootstrap-providers）按字段是否存在做向后兼容判断。
- readiness ledger v2 已是 setup 当前 schema，本提案在 `parent_workspace_advisory` 节点下扩展，不涉及 `baseline_ready` 语义。
- `workspace-mixed-topology` 是唯一新 mode，旧消费者遇到时按 `mode!="git-repo" && mode!="non-git-folder"` 仍能落到 workspace 分支；明确不识别时 fallback 到 `next_action` 提示用户升级 spec-first。
- 旧 `.spec-first/config.local.yaml` 没有 `workspace.additional_folder_targets` 段时，行为完全不变。
- `repair-worktree` 是新增子命令，不影响现有 CLI surface。

---

## Test Coverage

### P0

- broken-worktree fixture（父级）：`.git` 文件指向不存在路径 → `git_health.status="broken-worktree"`，emit `worktree_pointer.exists=false`，`next_action` 含 repair-worktree 提示。
- broken-worktree fixture（child）：子目录有 `.git` worktree pointer 但指向失效路径 → 不进 `candidate_roots`，但出现在 `candidates_diagnostics[]` 中，status 为 `broken-worktree`。
- corrupted-gitdir fixture：`.git` 是目录但 HEAD 缺失 → `git_health.status="corrupted-gitdir"`。
- coverage-gap fixture：mock 父级有 N 个非 git 子目录 + M 个 child git repo → `uncovered_top_level_dirs=N`，`sample[]` 不包含 child git repo。
- CRLF + Windows 路径 fixture：`.git` 文件内容为 `gitdir: C:\Users\foo\...\r\n` → `detect_git_health()` 正确解析为 `broken-worktree`（路径规范化后 exists=false）。
- 忽略列表共享校验：`discover_candidates` case 语句和 `coverage_gap.ignored_dir_patterns` 引用同一变量，fixture 验证两者对 `build` 目录的一致行为。
- 现有 not-git workspace 与 single git repo 用例继续通过。

### P1

- repair-worktree dry-run 在 broken-worktree fixture 下的 preview 文案（含 unlink preview + 手动 git 修复建议两段）。
- `--apply` 在 fixture 上真正删除 `.git` 文件，之后 `detect_git_health()` 返回 `not-git`。
- 拒绝在非 broken-worktree 状态下 apply（健康 repo、健康 worktree、corrupted-gitdir 三种情况均拒绝）。

### P2

- GitNexus multi-target label spike 通过后方可执行以下测试。
- 混合拓扑 fixture：父级有 30 个非 git 模块 + 6 个 child git repo + 配置 `additional_folder_targets[{path:".", label:"parent"}]` + `extra_exclude: ["build"]` → `computed_exclude` 自动包含 6 个 child git roots + ignore list + user extra_exclude；bootstrap-providers --all-repos 写入 7 套 canonical artifacts（6 child + 1 parent folder），parent advisory summary `additional_folder_targets[].written=true`。
- 无 `extra_exclude` 时 `computed_exclude` 仍自动包含所有 child git roots（不需要用户手动列出）。
- `additional_folder_targets[].path` 解析后在 workspace 外时报错 `additional-folder-target-outside-workspace`。
- 无 `workspace.additional_folder_targets` 配置时，行为完全等同旧版（mode 不变、无 computed_exclude 输出）。

---

## Definition of Done

- P0 落地后，运行 `spec-mcp-setup` 在 kaz-mvp 这种 broken-worktree workspace 时，setup 报告里能看到：
  - `git_health.status="broken-worktree"` 与失效路径
  - 如有 child broken worktree，`candidates_diagnostics[]` 列出受影响的子目录
  - `coverage_gap.uncovered_top_level_dirs=35` 与 sample
  - `next_action` 明确说"运行 spec-first repair-worktree 或加 --folder ."
  - `discover_candidates` 和 `coverage_gap` 的忽略列表来自同一共享变量（含 `build`）
- P1 落地后，`spec-first repair-worktree --dry-run` 对 kaz-mvp `.git` 文件能给出 unlink preview + 两条手动 git 修复建议文案。`--apply` 只执行 unlink（删除 broken `.git` 文件）。
- P2 落地后（需 GitNexus multi-target spike 通过），用户在 `.spec-first/config.local.yaml` 写 `workspace.additional_folder_targets`，然后 `spec-graph-bootstrap` 一次性覆盖 6 child git repo + 1 parent folder target，`computed_exclude` 自动包含 child git roots，无需手动 `--folder` 或手动列出 exclude。
- 所有改动遵守 spec-first source-only 原则（不动 generated runtime mirror）。
- CHANGELOG / `docs/05-用户手册/` / `docs/02-架构设计/` 同步更新；anti-regression 测试加入 `tests/integration/` 与 contract 测试矩阵。

---

## Open Questions

### 已闭合（v0.2）

1. ~~**GitNexus non-git folder 索引在 multi-target 场景下的 `--repo` label 全局唯一性**~~：**已升级为 P2 前置 spike**（见 P2 Prerequisites 第 1 项）。
2. ~~**broken-worktree 检测在 Windows PowerShell 下的实现**~~：**已下沉到 R1 实现细节 + P0 Test Coverage**。`.git` 文件解析须处理 CRLF 规范化和 Windows 反斜杠路径,fixture case 已列入。
4. ~~**P2 的 exclude pattern 是 glob 还是路径前缀**~~：**已下沉到 R6 path 解析规则**——简单相对路径前缀 + 末尾 `*` 通配,不支持 `**` 跨层匹配,不引入 glob 库。
5. ~~**混合拓扑下 GitNexus 索引时间预估**~~：**已升级为 P2 前置实测**（见 P2 Prerequisites 第 2 项）,>5min 触发 advisory,>15min 触发 background mode 二次设计。

### 仍待回答

3. **`spec-first init` 是否在交互式向导识别 broken worktree 并主动提示 repair-worktree**？与 P1 的"preview-first,不自动调用"原则冲突,但能提升首次使用体验。当前建议折中:init 只检测并打印 advisory + 建议命令,仍不自动调 repair-worktree。**待 P1 落地后用真实用户反馈再决策**。
6. **`workspace.additional_folder_targets[]` 数组上限**？kaz-mvp 场景只需 1 个,但理论上用户可能配 N 个独立 folder target（例如不同语言子树各跑一次）。当前未设上限;若 P2 实测发现 N>3 时 readiness ledger 与 bootstrap loop 输出过载,再考虑加 schema 上限。
7. **配置版本字段**？`.spec-first/config.local.yaml` 是否需要 `version:` 字段来支持未来的 schema 迁移？目前其他段都没有,本提案不强制引入,等首次破坏性变更再统一引入。

---

## References

- 真实触发场景：`/Users/kuang/xiaobu/kaz-mvp` 工作区在 2026-05-27 的 spec-first 1.8.2 setup + graph-bootstrap 调用记录
- 当前 spec-first 源码定位：
  - `skills/spec-mcp-setup/scripts/resolve-project-target.sh:114`（broken worktree 静默吞掉）
  - `skills/spec-mcp-setup/scripts/resolve-project-target.sh:148-191`（discover_candidates 只列独立 git repo）
  - `skills/spec-mcp-setup/scripts/resolve-project-target.sh:230-239`（已有 non-git-folder 模式实现）
  - `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh:809-1322`（已有 non-git-folder target 处理分支）
- 相关已落地需求：
  - [2026-05-25-001 GitNexus-only graph provider](./2026-05-25-001-gitnexus-only-graph-provider-requirements.md)（`analyze --skip-git` 非 git 索引能力）
  - [2026-04-28-005 workspace-target-readiness](../plans/2026-04-28-005-feat-workspace-target-readiness-plan.md)（workspace target 已有结构）
  - [2026-04-26-003 crg-workspace-topology](../plans/2026-04-26-003-feat-crg-workspace-topology-plan.md)（早期 workspace 拓扑探索）
