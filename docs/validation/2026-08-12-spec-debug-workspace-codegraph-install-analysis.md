# `spec-debug`：workspace graph 触发 CodeGraph 全局安装与 `UserPromptSubmit` 超时分析

- **日期：** 2026-08-12
- **仓库：** `/Users/kuang/xiaobu/spec-first`
- **分析范围：** `spec-runtime-setup` 的 workspace graph 路径、CodeGraph installer 的职责边界、Claude `UserPromptSubmit` 超时
- **本文件性质：** 诊断分析（analysis-only）
- **本轮未做：** 未修改 `skills/`、`src/cli/`、测试、`CHANGELOG.md`、generated runtime、用户级宿主配置或 `/Users/kuang/xiaobu/codegraph`

## 1. 结论摘要

不能把“全局安装”本身判定为错误，也不能直接删除 `codegraph install`。

CodeGraph 全局安装有合理且必要的运行时目的：

- 将 `codegraph` CLI 安装到 PATH，使宿主能够启动 `codegraph serve --mcp`；
- 将 MCP server entry 写入选定宿主配置，使一个用户级/宿主级配置可以服务多个项目；
- 保持 CodeGraph 官方的使用模型：全局安装一次，随后每个项目分别执行 `codegraph init`，跨项目查询通过 `projectPath`。

当前真正的问题是 ownership 与调用时机：

> `spec-runtime-setup --workspace-graph` 在构建父工作区双层图时，再次隐式调用 CodeGraph 自带的宽泛 `codegraph install --yes`，绕过了 `spec-runtime-setup` 已有的 provider dependency、host-config 和 launcher verification owner。

因此，待用户批准修复时，目标不应是“删掉 CodeGraph 全局安装能力”，而应是：

1. 保留并验证全局 CLI/MCP readiness；
2. 让标准 Runtime Setup 成为该能力的唯一安装与宿主配置 owner；
3. 让 workspace graph build 只消费已验证的 CodeGraph launcher，并执行 workspace-specific 的 `init`/`sync`；
4. 阻止 workspace build 隐式选择 CodeGraph 的所有宿主、权限和 prompt hook。

## 2. 用户可见症状与因果链

### 2.1 症状

用户看到：

```text
$spec-debug UserPromptSubmit hook timed out after 30s — output discarded. Raise the hook's "timeout" to allow more time.
```

这里的 30 秒是 Claude 对该 hook command 的默认执行预算；当前 CodeGraph hook entry 没有在用户配置中显式设置 timeout。

### 2.2 当前调用链

```text
spec-runtime-setup --workspace-graph
  -> setup.cjs: runWorkspaceGraphSetup
  -> workspace-graph-executor.cjs: runWorkspaceGraphBuild
  -> workspace-provider-runners.cjs: makeWorkspaceRunners
  -> workspace-graph-build.cjs: buildWorkspaceGraphs
  -> runners.codegraphInstallGlobal()
  -> codegraph install --yes
  -> CodeGraph installer 自动探测并配置多个宿主
  -> Claude UserPromptSubmit: codegraph prompt-hook
  -> hook 运行结构化 prompt 的 CodeGraph 查询
  -> 查询/索引/磁盘较慢时超过 Claude 默认 30 秒
  -> Claude 丢弃 hook 输出
```

直接导致超时的不是 `codegraph init` 或 Graphify merge，而是 installer 的副作用开启了 `codegraph prompt-hook`。该 hook 的设计目标是对结构化问题预先执行 `codegraph_explore`，因此它天然可能比普通配置写入耗时更长。

## 3. 为什么全局安装原本有原因

### 3.1 CodeGraph 上游的官方运行模型

CodeGraph CLI 的 installer 明确说明：

- `codegraph install --yes` 默认是 `--location=global --target=auto`；
- installer 将 MCP server 配置写入一个或多个 agent；
- 安装不负责建图，项目图由后续 `codegraph init` 建立；
- “one global `codegraph install` covers every project”。

这说明“全局”不是偶然实现，而是 CodeGraph 的宿主接入模型。

### 3.2 `spec-first` 当前 registry 也承认全局 CLI 的必要性

`skills/spec-runtime-setup/setup-registry.json` 中 CodeGraph 当前定义包括：

- `installation.kind = global-npm`；
- `safety.risk_flags` 包含 `global-npm-install`；
- 各宿主通过 `codegraph serve --mcp` 接入；
- `.codegraph/codegraph.db` 是项目级 first-generation artifact。

所以不能用“全局”这一词本身作为删除理由。更准确的风险判断是：全局安装是高影响动作，必须由有明确 registry、preview、host scope 和 post-write verification 的 owner 执行。

### 3.3 workspace graph 为什么需要共享的宿主能力

父工作区模式有两个不同层次：

| 层次 | 目标 | 正确范围 |
|---|---|---|
| 宿主/provider readiness | 让 Claude、Codex 等宿主能启动 CodeGraph MCP | 由 Runtime Setup 按 registry 选择 host 并配置 |
| workspace graph build | 为多个 child repo 建 `.codegraph/`，并用 `projectPath` 查询 | 由 workspace orchestrator 执行 child `init`/`sync` 与 Graphify merge |

workspace build 依赖第一层已经 ready，但不应在第二层重新执行第一层的宽泛 installer。

## 4. 当前实现中的边界错位

### 4.1 `workspace-provider-runners.cjs`

当前 runner 暴露：

```js
codegraphInstallGlobal() {
  return exec(codegraphCommand, ['install', '--yes'], ...);
}
```

该 API 把宿主级安装能力暴露给 workspace graph build，导致 workspace 编排器可以触发 CodeGraph 自己的多宿主自动探测。

### 4.2 `workspace-graph-build.cjs`

当前 build 在 child repo 循环前执行一次 global install，并将结果放入：

```js
global_codegraph_install
```

随后 `deriveWorkspaceBuildOutcome()` 把 global install 成功作为 `complete` 的必要条件。这把“宿主配置完成”和“workspace 图产物完成”绑定成了一个结果合同。

### 4.3 `setup.cjs` 的正常路径其实已有正确方向

`resolveWorkspaceGraphExecutionContext()` 会调用 `providers.codegraph.resolveCodegraphCommand()`，该 resolver：

- 从 PATH 中解析实际 launcher；
- 要求绝对路径；
- 校验 pinned version；
- 再把已验证 launcher 传入 workspace executor。

这表明当前项目已经有“先由 Runtime Setup 验证 provider，再由 workspace build 消费 launcher”的机制，只是旧的 global installer 编排仍残留。

### 4.4 仍需审查的 fallback

`runWorkspaceGraphSetup()` 在 `runtimeProjectionSelection.targets.length === 0` 时构造裸的：

```js
codegraphCommand: 'codegraph'
graphifyCommand: 'graphify'
```

当前 executor 会因没有 confirmed child repo 提前返回 `needs-confirmation`，因此尚未证明这条 fallback 一定会造成 provider mutation。但它构成潜在的 verified-launcher 绕过面，应由回归测试确认；若可达，必须 fail closed 或继续使用 resolver。

## 5. 第 2 点是否脱离 `spec-first` 项目

没有脱离。

第 2 点修改的是：

- `skills/spec-runtime-setup/scripts/lib/workspace-graph-build.cjs` 的 build outcome contract；
- `skills/spec-runtime-setup/scripts/lib/workspace-provider-runners.cjs` 的 runner API；
- `skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs` 的组合边界；
- `skills/spec-runtime-setup/scripts/setup.cjs` 的 launcher fallback。

这些都是 `spec-first` checked-in canonical source，决定了 `spec-first` 如何编排外部 provider。它不是修改 CodeGraph 的内部实现，也不是脱离项目去修上游。

应保持的边界是：

```text
CodeGraph：拥有 CLI、MCP server、prompt hook 和 provider-native index 行为
spec-first：拥有 setup readiness、host-config transaction、workspace build orchestration 和 evidence contract
```

## 6. 候选方案与取舍

### 方案 A：继续在 workspace build 中调用 `codegraph install --yes`

不建议原样保留。

优点：保持历史设计最少改动，确保 CLI/MCP 与宿主配置一起出现。

缺点：

- `--yes` 默认扩大到 `target=auto`、global location 和 auto-allow；
- 可能写入 Claude、Cursor、Codex、OpenCode、Gemini、Kiro 等用户级或项目级配置；
- 可能开启 Claude `UserPromptSubmit` prompt hook；
- 绕过 `spec-runtime-setup` 的 selected-host、repair、preview 和 verification 合同；
- workspace build 的 complete 状态会错误地依赖宿主 installer 成功。

### 方案 B：删除 workspace build 的 installer 调用，但保留标准 Runtime Setup 的全局安装

这是当前最小、边界最清晰的候选方案，**但本文件不批准实施**。

前提：workspace graph 命令在 mutation 前必须确认 CodeGraph CLI 和所需 host MCP readiness 已由标准 Runtime Setup 完成；缺失时返回明确 `action-required`，而不是自行安装。

优点：

- 保留全局 CLI/MCP 的真实必要性；
- 消除 workspace build 的跨宿主副作用；
- 不改变 CodeGraph 上游；
- 保持 `init`/`sync`/Graphify build 的 workspace ownership。

风险：需要补齐 workspace graph 对 provider readiness 的显式前置检查和错误提示，避免从“隐式安装”变成“静默失败”。

### 方案 C：workspace build 调用受限的 CodeGraph installer

例如显式指定 host、location 和关闭 prompt hook，而不是 `--yes`。

这比方案 A 安全，但仍把宿主配置 mutation 放进 workspace graph 生命周期，仍会与 Runtime Setup 的 host-config owner 重叠；除非上游提供稳定、可验证、可按 target 精确调用的 installer API，否则不应作为首选。

### 方案 D：在 `spec-first` 中重建 CodeGraph installer

不建议。这样会复制 provider 的宿主适配、配置格式和升级/卸载语义，违反“provider 内部实现不泄漏成 workflow contract”和“不要重建宿主 primitive”的边界。

## 7. 建议的后续决策顺序（非实施授权）

1. 先确认产品要求：workspace graph 是否必须同时完成“宿主 MCP 接入”和“项目图构建”。
2. 若答案是必须，仍将其拆成两个 readiness/build 阶段，不能用一个宽泛 installer 隐式完成。
3. 确认 Runtime Setup 是否已经能为当前 host 提供：pinned CLI、绝对 launcher、host config entry、post-write verification。
4. 为 workspace graph 定义缺失 readiness 时的明确 reason code 和 next action。
5. 仅在上述合同明确后，决定采用方案 B，或设计一个有明确 target 参数的方案 C。
6. 再更新源码、测试、SKILL 文档和 CHANGELOG；本次分析不执行这些修改。

## 8. 现有超时的正确处理边界

提高 Claude hook timeout 可以是用户级缓解措施，但不能作为 `spec-first` 根因修复：

- timeout 只改变宿主等待时间；
- 它不限制 CodeGraph installer 的 host scope；
- 它不解决 workspace build 绕过 Runtime Setup owner；
- 它可能把昂贵的 prompt hook 延迟从 30 秒扩大到更长，继续影响交互。

若未来决定保留 prompt hook，应由 CodeGraph 上游负责 hook 的 timeout/快速失败/预算控制；`spec-first` 不应直接 patch 用户级 `settings.json`。

## 9. 意外外部变更与证据限制

前序排查中曾因 shell 查询文本包含未转义反引号，意外执行了一次真实的：

```text
codegraph install --yes
```

只读检查确认当前 `~/.claude/settings.json` 含有：

```json
"UserPromptSubmit": [{"hooks": [{"command": "codegraph prompt-hook"}]}]
```

但当前证据不能确定该 entry 是本次意外调用新建、此前已存在，还是由其他 CodeGraph 安装留下。因此：

- 不将其作为 `spec-first` 源码变更证据；
- 不自动删除或回滚；
- 不修改 `/Users/kuang/xiaobu/codegraph`；
- 后续若要治理残留，应单独取得用户授权，先做完整用户级配置 inventory 和 ownership 对账。

## 10. 当前分析结论的 claim ceiling

已确认：

- `spec-first` workspace graph 源码确实暴露并调用 `codegraph install --yes`；
- CodeGraph 全局安装本身有 CLI PATH 与多宿主 MCP wiring 的合理用途；
- `--yes` 会默认开启 Claude prompt hook，且当前 hook entry 没有显式 timeout；
- workspace build 与 Runtime Setup provider/host-config owner 存在重叠。

尚未确认：

- 当前所有宿主是否都必须由一次全局 install 配置；
- Runtime Setup 当前每个 host 的 CodeGraph readiness 是否已覆盖 workspace build 的全部前置需求；
- `targets.length === 0` 的裸 launcher fallback 是否在任何真实 mutation path 可达；
- 用户级 hook 当前是否确实由本次安装调用创建。

本文件因此只支持“进入方案决策/补充验证”，不支持“已修复”“应立即删除全局安装”或“已完成外部配置回滚”等结论。
