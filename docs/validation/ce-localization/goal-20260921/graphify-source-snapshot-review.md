---
artifact_type: advisory
status: source-review
date: 2026-09-21
scope: real-graphify-first log and Graphify source/provider boundary
claim_ceiling: C1
---

# Graphify `source-changed-during-generation` 有界定位

本记录只解释 `docs/validation/ce-localization/goal-20260921/logs/real-graphify-first.log` 的两条真实 Graphify dogfood 失败，不修改 provider、测试或 runtime。结论分别属于测试 fixture 误设和 setup 内部写入顺序问题，不能合并成“Graphify 原生构图随机污染 source”。

## 1. 两条失败不是同一根因

### external hooksPath：fixture 没有首个 commit

真实日志第 1–35 行显示 external case 的实际失败是 `readiness_status: unknown`，期望为 `fresh`；没有 `source-changed-during-generation`。测试 fixture 在 `tests/integration/runtime-setup-graphify-hook-boundary.integration.test.js:35-50` 只执行 `git init`，没有首个 commit。`source-snapshot.cjs:63-80` 在 `git rev-parse --verify HEAD` 失败时将 `source_kind` 设为 `unknown`；已有单测 `tests/unit/mcp-setup-providers.test.js:1160` 明确无 HEAD 的 Git 目录即使成功构图也保持 unknown。因此期望 `fresh` 与当前 contract 冲突。

最小修复是测试 fixture 在 setup 前创建一个确定的 baseline commit（或将期望改为 unknown，并明确这是无 HEAD 的 Git 目录）。不能把无 HEAD 的目录升级为 fresh，也不应修改 source snapshot 规则来迁就该 fixture。

### contained hooksPath：setup 自己在两次 source snapshot 之间写入源范围

执行顺序如下：

1. `graphify.cjs:505-511` 在 `first-generation` 前调用 `captureSourceSnapshot`，随后运行原生 `graphify extract`。
2. `graphify.cjs:566-569` 在构图/查询后调用 `applyGraphifyHookCapability`。
3. `graphify.cjs:957-1003` 对 project-contained hooks 执行 `graphify hook status/install`，并在 `:992-995` 运行 `normalizePythonGraphifyHooks`。
4. `graphify.cjs:570-575` 再次 `captureSourceSnapshot`，并把两次不一致统一报告为 `graphify-source-changed-during-generation`。

这里的“期间”并不表示 Graphify extract 修改了业务源码；setup 在构图动作之后、最终 snapshot 之前安装/规范化 hook，才是已确认的变更窗口。

原生 Graphify 0.9.57 的直接证据：

- `graphify/hooks.py:793-818` 的 `hook install` 写入两个 hook，并调用 `_register_merge_driver`；
- `graphify/hooks.py:680-725` 的 merge driver 写入仓库 `.git/config` 和根 `.gitattributes`；
- contained fixture 的 hooksPath 是 `.githooks`（测试 `:234-245`），该目录不在 `source-snapshot.cjs:110-117` 的排除列表中；
- `.gitattributes` 同样不是排除项。`.git` 本身被排除，但 `.githooks` 和 `.gitattributes` 会被 Git snapshot 纳入（`source-snapshot.cjs:123-148`）。

因此当前 source snapshot 对“用户源变化”和“setup 为完成授权 hook 能力而写入的 managed files”没有时序区分。日志第 589–625 行的 `source_reason_code` 与实际写入顺序一致，但命名会让人误以为原生 provider 在 extract 中改了源文件。

## 2. 原生 extract 产物边界

当前真实调用使用 `graphify extract ... --code-only`。原生 CLI 在 `cli.py:3365-3392` 创建并写入 `graphify-out` 的 build configuration；provider 的 `GENERATED_SOURCE_ROOTS` 在 `source-snapshot.cjs:110-120` 排除 `graphify-out`、`.graphify` 等生成目录。因此这些预期产物不会直接导致 source hash 漂移。

原生 CLI 的 code-only 分支在 `cli.py:3549-3563` 仅跳过 docs/images semantic extraction；未发现它在项目源根写入除 Graphify artifact root 外的业务文件。已确认的 source-range 写入来自 hook install 的 `.githooks` / `.gitattributes`，不是 graph 目录。

### 隔离原生 hook 复现

在临时 Git repo 中设置 local `core.hooksPath=.githooks`，先创建一个 baseline commit，再运行真实 `graphify hook install`（隔离 `HOME`、`GIT_CONFIG_NOSYSTEM=1` 和临时 global config）。结果为：

```text
new_files = .gitattributes, .githooks/post-checkout, .githooks/post-commit
merge driver = registered (graphify-out/graph.json merge=graphify)
git status = ?? .gitattributes / ?? .githooks/post-checkout / ?? .githooks/post-commit
```

该复现没有运行 Graphify extract，也没有触碰主仓；它只确认 hook capability 本身会在 source snapshot 当前纳入的项目路径产生三个新文件。临时 fixture 已清理。

## 3. 最小修复顺序

1. **先修测试 fixture：** external fixture 首次 setup 前创建 baseline commit，使其满足 `source_kind=git`、拥有 HEAD；保留无 HEAD 单测的 unknown 语义。
2. **再修 setup 时序：** 在 `first-generation` / `refresh` 的 generation snapshot 之前完成已授权的 project-contained hook install/normalization，或把 hook mutation 单独作为 generation 前置阶段；完成后再捕获 generation snapshot，再执行 extract。不要把 `.githooks`、`.gitattributes` 或任意用户源路径加入全局排除列表来掩盖变化。
3. **保留后置验证：** hook install 后仍需执行 status/structural verification，并在 extract 后进行最终 source snapshot；若用户在 setup 期间改变其它源文件，仍必须报告 source drift。
4. **改进 reason code 文案：** 若实现采用“setup-managed mutation”时序，可将该路径区分为 `graphify-setup-managed-source-change`；只有两次 snapshot 间存在非 managed 变化时才使用 `graphify-source-changed-during-generation`。如果暂不改枚举，至少在 receipt limitation 中写明可能是 setup hook mutation，避免把 provider 行为误判为业务源码污染。

## 4. 验收边界

- external case：有首个 commit 时 `readiness_status=fresh`；无 HEAD 时仍为 `unknown`，不计 workflow 通过。
- contained case：hook 与 `.gitattributes` 安装/规范化成功，Graphify 图、query、hook structural verification 均成功，且 generation snapshot 在 managed hook mutation 之后取得；测试还需证明 setup 期间额外修改业务源文件会保持 drift 阻断。
- 本次检查只读日志、项目 provider、source snapshot、真实 Graphify hooks/CLI 和相关测试；未再次运行 Graphify、未修改源码、未改变全局 hooks 配置、未提交或推送。原始 real run 仍是失败证据，不能被本报告升级为通过。
