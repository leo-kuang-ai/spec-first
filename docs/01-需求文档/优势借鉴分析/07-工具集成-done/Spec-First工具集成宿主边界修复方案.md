# Spec-First 工具集成宿主边界修复方案

## 1. 文档目标

本文档用于收敛当前 `Spec-First` 工具集成链路中关于宿主目标范围、全局安装默认行为、定向更新、卸载清理边界的实现问题，并给出一套最小且可执行的修复方案。

本次修复不重写“安装场景默认宿主识别规则”，而是以当前安装行为为真源，重点解决以下问题：

1. `update` 内部宿主目标判定不一致。
2. `postinstall` 的安装引导短路条件错误。
3. `uninstall` 尚未与 `update` 对齐同一套宿主边界模型。

---

## 2. 现状结论

### 2.1 安装场景当前语义

当前“全局安装”场景的主入口是：

- `src/postinstall.ts`
- `src/cli/commands/update.ts`

实际语义是：

1. `postinstall` 负责判断当前是否为全局安装。
2. 若为全局安装，则触发 `spec-first update --from-postinstall`。
3. 宿主目标的实际执行语义，由 `update` 下游的默认 `hosts === undefined` 逻辑决定。

也就是说，当前安装场景“默认全局行为”已经存在，且用户确认该语义是正确的。本次修复不应重建一套新的自动识别模型。

### 2.2 当前实现中的三类写入域

结合代码，当前工具集成动作可以稳定分成三类：

#### A. `host-user`

指宿主用户目录下的安装产物或配置：

- skills 同步
- MCP 写入
- Claude 命令目录
- Codex/Gemini/Cursor skills

#### B. `claude-home`

指 Claude 用户目录下的 `SessionStart`/viewer wiring：

- `~/.claude/settings.json` 中的 managed `SessionStart Hook`

#### C. `project-local`

指当前项目内的本地集成：

- `.claude/settings.json` 中的 AI hooks
- `.git/hooks/*` 中的 Git hooks

这三类动作当前已经在实现上存在，但没有被显式建模为统一边界。

---

## 3. 当前问题

### 3.1 问题一：`update` 的宿主边界不一致

#### 代码现状

`src/cli/commands/update.ts` 中：

- `ensureSkillCommands(...)` 已接收 `hosts`
- `ensureHostBootstrap(...)` 已接收 `hosts`
- 但 `registerSessionHooks(...)` 仅受 `viewer` 组件控制，不受 `hosts` 约束

这会导致：

- `spec-first update --host gemini,cursor`
- 仍然可能改写 `~/.claude/settings.json`

#### 根因

`update` 内部同时存在两套宿主判定逻辑：

1. `skills/mcp` 使用宿主目标集合
2. `Session Hook / viewer` 使用组件开关直接执行

这违反了“同一命令内所有宿主级写入动作应共享同一目标集合”的原则。

#### 风险

- 定向更新产生跨宿主副作用
- `Gemini/Cursor` 定向安装时仍修改 Claude 配置
- 用户无法预期 `--host` 的真实边界

---

### 3.2 问题二：`postinstall` 短路条件错误

#### 代码现状

`src/postinstall.ts` 当前使用类似如下逻辑：

```ts
if (skillsRegistered.claude || skillsRegistered.codex) {
  return;
}
```

#### 问题

这意味着：

- 只要 `Claude` 已注册，即使 `Codex` 未注册，也会直接退出
- 只要 `Codex` 已注册，即使 `Claude` 未注册，也会直接退出

这不符合安装引导的真实目标。安装引导应当基于“是否还有缺口”，而不是“是否至少成功一项”。

#### 风险

- 半完成状态下错误静默
- 用户看不到剩余缺口
- 与 `doctor/update` 的 `missing/remediation` 模型不一致

---

### 3.3 问题三：`uninstall` 尚未纳入同一套宿主边界

#### 代码现状

`src/cli/commands/uninstall.ts` 当前采取“全量清理”模式：

- 清全局 skills 缓存
- 清 Claude 命令
- 清 Codex/Gemini/Cursor skills
- 清 Claude `SessionStart Hook`
- 清项目 AI hooks
- 清 Git hooks

#### 根因

`uninstall` 当前没有：

- 宿主目标集合
- 动作归属
- `host-user / claude-home / project-local` 分层

#### 风险

如果 `update` 修成“按宿主定向更新”，而 `uninstall` 仍保持“全量删除”，就会出现正反操作语义不对称：

- 更新只动 `Gemini/Cursor`
- 卸载却顺手删掉 `Claude` 和项目本地 hooks

这会导致宿主边界模型失效。

---

## 4. 修复原则

### 4.1 不重建安装默认语义

本次修复不重写“默认宿主集合”的判断规则。

统一原则是：

- 默认行为继续复用当前安装场景的正确语义
- `--host` 仅作为显式覆盖

### 4.2 单一宿主目标集合

对于任一命令，凡是涉及宿主级配置写入或删除的动作，都必须消费同一个“最终目标宿主集合”。

### 4.3 动作归属明确

所有动作都必须属于以下之一：

- `host-user`
- `claude-home`
- `project-local`

不得再混用“组件开关 + 局部宿主判断”的方式做隐式执行。

### 4.4 `project-local` 在 `update` 与 `uninstall` 中采用不同边界

当前实现已落地为：

- `AI Hooks`
- `Git Hooks`

属于 `project-local`。

- 在 `update` 中：默认不受 `--host` 过滤
- 在 `uninstall` 中：若传入 `--host`，则跳过 `project-local` 清理

### 4.5 先修行为，再扩 CLI

本次优先修复实现层不一致，不在第一阶段大规模扩展 CLI 参数。

优先顺序：

1. 修 `update`
2. 修 `postinstall`
3. 重构 `uninstall` 内部结构
4. 为 `uninstall` 增加 `--host`

---

## 5. 目标模型

### 5.1 最终目标宿主集合

建议在执行层引入统一概念：

- `effective host set`

语义：

1. 若传入 `--host`
   - 使用显式宿主集合
2. 若未传入 `--host`
   - 复用当前安装场景默认语义

注意：

这个集合不是“重写自动识别规则”，而是“统一复用当前默认规则的结果”。

### 5.2 动作归属矩阵

| 动作 | 归属 | 是否受 `--host` 约束 |
|------|------|----------------------|
| `ensureSkillCommands` | `host-user` | 是 |
| `ensureHostBootstrap` | `host-user` | 是 |
| `registerSessionHooks` | `claude-home` | 是 |
| viewer 摘要/提示 | `claude-home` | 是 |
| `installHooks` | `project-local` | 否 |
| `registerAIHooks` | `project-local` | 否 |
| `removeSessionHook` | `claude-home` | 未来是 |
| 删除宿主 skills/MCP/命令 | `host-user` | 未来是 |
| 删除项目 AI hooks/Git hooks | `project-local` | 否 |

---

## 6. 详细修复方案

### 6.1 修复一：统一 `update` 的宿主边界

#### 目标

让 `update` 内所有宿主级动作共享同一套目标集合。

#### 方案

在 `src/cli/commands/update.ts` 内引入一个很小的执行层入口，例如：

- `resolveEffectiveHostTargets(...)`
- `shouldApplyClaudeHomeAction(...)`

要求：

1. `skills` 与 `mcp` 继续使用当前宿主集合语义
2. `Session Hook / viewer` 改为使用同一集合
3. `project-local` 逻辑保持不变

#### 预期行为

`spec-first update --host gemini,cursor`

- 会同步 Gemini/Cursor skills
- 会写 Gemini/Cursor MCP
- 不会注册 Claude `SessionStart Hook`
- 不会输出 Claude viewer 已安装的假阳性摘要

`spec-first update --host claude`

- 会更新 Claude 相关 skills/MCP
- 会注册 Claude `SessionStart Hook`

默认 `spec-first update`

- 行为与当前安装默认语义一致

#### 最小实现建议

先不要在多个模块中扩散 helper。

第一阶段仅在 `update.ts` 做最小封装即可，后续若 `doctor/uninstall` 需要复用，再提炼到共享模块。

---

### 6.2 修复二：将 `postinstall` 改为缺口驱动

#### 目标

安装引导应基于“是否仍有 stable host 缺口”决定是否继续提示。

#### 方案

在 `src/postinstall.ts` 中引入小型 gap helper，例如：

- `getMissingStableHostRegistrations(...)`

逻辑：

1. 计算 stable hosts 当前缺失列表
2. 若缺失为空，则不提示
3. 若仍有缺失，则继续输出引导与宿主状态

#### 推荐 stable hosts 范围

当前阶段以现有稳定宿主为准：

- `claude`
- `codex`

`gemini/cursor` 仍按 experimental 处理，不应改变“stable host gap”定义。

#### 预期行为

| 状态 | 预期 |
|------|------|
| `claude=true`, `codex=true` | 不提示 |
| `claude=true`, `codex=false` | 继续提示 |
| `claude=false`, `codex=true` | 继续提示 |
| `claude=false`, `codex=false` | 继续提示 |

---

### 6.3 修复三：拆分 `uninstall` 的内部结构

#### 目标

让 `uninstall` 在不立即改变默认 CLI 行为的前提下，与 `update` 对齐相同的边界模型。

#### 方案

将 `runUninstall()` 内部执行流拆成三段：

1. `removeHostUserArtifacts(...)`
2. `removeClaudeHomeArtifacts(...)`
3. `removeProjectLocalArtifacts(...)`

#### 建议映射

##### A. `removeHostUserArtifacts(...)`

包含：

- 全局 skills 缓存
- Claude 命令
- Codex skills
- Gemini skills
- Cursor skills
- CC Switch skills

##### B. `removeClaudeHomeArtifacts(...)`

包含：

- `removeSessionHook(...)`

##### C. `removeProjectLocalArtifacts(...)`

包含：

- `removeAIHooks(...)`
- `removeGitHooks(...)`

#### 当前阶段的决定

当前实现：

- 已完成内部重构
- 默认 CLI 语义保留“全量卸载”
- 已增加 `--host`
- 传入 `--host` 时，仅执行宿主级与 `claude-home` 清理，跳过 `project-local`

---

## 7. 实施顺序

### Phase 1：修行为错误

1. 修 `update` 的 `claude-home` 越界写入
2. 修 `postinstall` 的缺口驱动短路

### Phase 2：修结构对齐

3. 拆 `uninstall` 的三段式执行结构

### Phase 3：补测试与文档

4. 补 unit / integration 回归
5. 更新工具集成开发任务文档与路线图

---

## 8. 测试方案

### 8.1 `update` 回归

建议新增或修正以下断言：

#### Unit

文件：

- `tests/unit/update.test.ts`

场景：

1. `--host gemini,cursor`
   - `registerSessionHooks` 不被调用
2. `--host claude`
   - `registerSessionHooks` 被调用
3. 默认 `update`
   - 既有行为不变

#### Integration

文件：

- `tests/integration/update-doctor-baseline.test.ts`

场景：

1. `update --host gemini,cursor --skip-mcp --skip-hooks`
   - 不改写 `~/.claude/settings.json`
2. `update --host gemini,cursor --skip-hooks`
   - 仅写 Gemini/Cursor MCP

### 8.2 `postinstall` 回归

文件：

- `tests/unit/postinstall.test.ts`
- 如有必要：`tests/integration/postinstall-host-bootstrap.test.ts`

场景：

1. `claude=true, codex=false`
   - 仍然输出引导
2. `claude=false, codex=true`
   - 仍然输出引导
3. `claude=true, codex=true`
   - 不再重复引导

### 8.3 `uninstall` 回归

文件：

- `tests/unit/uninstall.test.ts`

目标：

1. 三段式拆分后默认行为不变
2. `host-user` 删除逻辑仍正确
3. `claude-home` 删除逻辑仍正确
4. `project-local` 删除逻辑仍正确

---

## 9. 验收标准

完成本轮修复后，应满足以下条件：

1. `update` 不再出现跨宿主越界写入
2. `postinstall` 在 stable host 半完成状态下不会错误静默
3. `uninstall` 的内部结构与 `update` 对齐为同一套边界模型
4. 默认安装/更新语义不发生漂移
5. 现有功能无回归

---

## 10. 明确不做的事

本轮不做以下改动：

1. 不重写默认宿主自动识别规则
2. 不把 `project-local` 纳入 `--host`
3. 不立即为 `uninstall` 增加新的 CLI 参数
4. 不扩大到新的宿主支持策略改造

---

## 11. 结论

当前问题的本质不是“宿主支持不够多”，而是“同一套工具集成链路里没有把宿主边界建模成统一规则”。

因此最佳实践不是继续在 `update/postinstall/uninstall` 中局部补条件，而是：

1. 保持现有安装默认语义不变
2. 为宿主级动作建立统一的最终目标宿主集合
3. 为动作建立清晰的归属边界
4. 先修 `update` 行为错误，再修 `postinstall` 引导，再对齐 `uninstall`

这样可以用最小改动修掉当前真实 bug，同时为后续 `Host Adapter` 和更细的组件化安装保留稳定演进空间。
