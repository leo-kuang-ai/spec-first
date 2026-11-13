# SUP Phase 1 恢复机制修复：SUP-23 / SUP-26

**日期：** 2026-11-10  
**范围：** 失败恢复的阶段归属，避免拒绝/失败路径反向造成资产丢失  
**证据来源：** `docs/validation/2026-11-09-harness-full-code-deep-review.md:216-242`

## SUP-23：Windows 配置替换双重失败遗漏恢复状态

### 问题

**位置：** `skills/spec-runtime-setup/scripts/lib/host-config.cjs:1035-1048`（修复前）

Windows `displaced-original` 替换策略先 rename 原配置到 `.replace-old`，再安装新文件。当安装替换与恢复原文件都失败时：

- `replaceFile` 吞掉恢复异常，只抛出普通错误
- 上层 `applyHostConfig` 只在 `replaceFile` 正常返回后设置 `replaced = true`
- 最终报告 `changed=false / restore.status=not-required`，并删除常规 backup
- 原内容实际还留在未披露的 `.replace-old` 文件

### 修复

**文件：** `skills/spec-runtime-setup/scripts/lib/host-config.cjs`

1. `replaceFile` 在恢复位移文件也失败时抛出 `REPLACE_AND_RESTORE_FAILED`，携带：
   - `displaced_path`：位移后的原文件路径
   - `original_error`：安装替换失败原因
   - `restore_error`：恢复失败原因
2. `applyHostConfig` catch 分支识别 `REPLACE_AND_RESTORE_FAILED`：
   - 视为已发生副作用（`changed=true`）
   - 先尝试从 displaced 路径恢复
   - 仍失败时返回 `host-config-restore-failed` + `restore.status=failed` + `recovery.status=manual-required`
   - 保留 backup/displaced 路径并给出 `next_action` 恢复指引
   - `preserveBackup=true` 阻止 finally 清理常规 backup
3. 移除不再使用的 `restored` 局部变量

### 回归测试

**文件：** `tests/unit/mcp-setup-host-config.test.js`（新增 1 例，套件 45/45 PASS）

- 注入 `direct-replace` EACCES、`install-replacement` EACCES 并模拟位移文件在失败后不可用
- 断言：`ok=false`、`changed=true`、`reason_code=host-config-restore-failed`、`restore.status=failed`、`recovery.status=manual-required`、`error.code=REPLACE_AND_RESTORE_FAILED`、保留 backup 文件存在、主配置不存在

## SUP-26：工作区构图备份重命名失败删除原索引

### 问题

**位置：** `skills/spec-runtime-setup/scripts/lib/workspace-graph-build.cjs:329-346`（修复前）

`runFreshCodegraph` 在备份、provider 执行与验证外共用 catch。当原 `.codegraph` 目录 rename 为备份时失败（EACCES），catch 仍无条件递归删除 `.codegraph`，随后又没有 backup 可恢复，造成既有索引丢失。

### 修复

**文件：** `skills/spec-runtime-setup/scripts/lib/workspace-graph-build.cjs`

- 增加 `backupCreated` / `targetCreated` 阶段标记
- 备份 rename 成功后才置 `backupCreated=true`
- provider 执行后置 `targetCreated=true`
- catch 只删除本次调用确认创建的目标，只有成功备份后才尝试 rename 回滚
- 与附近 `promotePath` 的 `backupCreated` / `sourcePromoted` 纪律保持一致

### 回归测试

**文件：** `tests/unit/mcp-setup-workspace-graph-build.test.js`（新增 1 例，套件 34/34 PASS）

- 预置 `.codegraph/original.txt`，注入备份 rename EACCES
- 断言：CodeGraph provider 调用 0 次、`codegraph_status=failed`、`reason_code=codegraph-refresh-failed`、原索引文件内容保持不变

## 与 SUP-22 的共同纪律

SUP-22/23/26 属于同一类问题：失败/拒绝路径缺乏阶段归属，恢复动作反过来破坏原资产。三者修复统一采用「先确认本次调用的副作用边界，再决定是否回滚」：

| 问题 | writer | 失败阶段 | 修复后行为 |
|------|--------|----------|------------|
| SUP-22 | facts 双文件 writer | containment 拒绝符号链接 | 保留原符号链接，不删除 |
| SUP-23 | Windows placed replace | 安装 + 恢复双失败 | 上报 changed=true + manual-required，保留可恢复路径 |
| SUP-26 | CodeGraph 构图 | 备份 rename 失败 | 不调用 provider、不删除原索引 |

## 验证边界

- 测试使用真实 `applyHostConfig` / `buildWorkspaceGraphs` 公开入口，注入故障到 rename/provider 层，不是纯 mock 单元
- SUP-23 在 macOS 上注入 Windows 分支，不冒充 Windows 实机验收
- 未运行真实宿主配置写入或真实 Graphify/CodeGraph 构图
