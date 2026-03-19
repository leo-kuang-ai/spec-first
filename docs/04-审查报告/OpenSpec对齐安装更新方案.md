# Spec-First 对齐 OpenSpec 的安装与更新方案

> 状态：待评审
> 目标：将 Spec-First 的安装/更新体验对齐为 OpenSpec 风格（全局安装 + 项目 init + 项目 update）

## 1. 背景与问题

当前 Spec-First 已具备较完整能力（`init/setup/hooks/doctor/viewer`），但在用户心智上仍存在分散：

- 首次接入需要记住多条命令（安装、注册、hooks、viewer）。
- 升级后缺少统一的“项目刷新”入口（类似 OpenSpec 的 `openspec update`）。
- 新项目中用户容易误用源码路径命令（如 `node scripts/...`）。

对标 OpenSpec，建议统一为三步模型：

```bash
npm install -g spec-first@latest
cd your-project
spec-first init
spec-first update
```

---

## 2. 方案目标

### 2.1 用户体验目标

1. 全局安装后，进入任意项目只需记两条项目命令：`init`、`update`。
2. `init` 负责首建项目规范工作区。
3. `update` 负责升级后项目内规范资产刷新。

### 2.2 工程目标

1. 保持现有命令兼容（不破坏已有自动化流程）。
2. 将“可覆盖资产”与“用户资产”边界清晰化。
3. update 执行幂等：重复执行不产生额外副作用。

---

## 3. 目标使用方式（对外文档）

### 3.1 全局安装

```bash
npm install -g spec-first@latest
# 或
pnpm add -g spec-first@latest
```

### 3.2 初始化项目（首次）

```bash
cd your-project
spec-first init
```

### 3.3 升级后刷新项目

```bash
npm install -g spec-first@latest
cd your-project
spec-first update
```

### 3.4 零安装临时使用（补充）

```bash
npx -y spec-first@latest init
npx -y spec-first@latest update
```

---

## 4. 命令职责定义

## 4.1 `spec-first init`（首次建立）

职责：

- 生成 `.spec-first/config.yaml`（若不存在）。
- 初始化 `.spec-first/layer2/` 默认平台模板（若不存在）。
- 注册项目级 AI 指令与 slash 命令（Claude/Codex）。
- 安装 Git hooks（Git 仓库场景）。
- 输出下一步建议（创建 Feature / 查看状态 / 启动 viewer）。

约束：

- 对已存在用户文件采用“补齐/提示”策略，不直接覆盖用户自定义内容。

## 4.2 `spec-first update`（升级刷新）

职责：

- 刷新项目托管命令资产（Claude/Codex）。
- 重新对齐 hooks（幂等安装/修复）。
- 补齐 config 新增默认项（保留用户已有配置）。
- 同步内置 layer2 模板（仅托管模板范围）。
- 输出变更摘要（更新项、跳过项、风险提示）。

建议参数：

- `--dry-run`：仅输出将发生的变更。
- `--force`：覆盖托管文件（非托管文件仍不覆盖）。
- `--global`：仅刷新用户级命令注册（可选）。

---

## 5. 资产边界（关键）

为避免 update 误伤业务内容，需定义托管清单。

## 5.1 可覆盖（托管资产）

- `.claude/commands/spec-first/*.md`
- `~/.claude/commands/spec-first/*.md`（全局模式）
- `~/.codex/skills/spec-first/*`（全局模式）
- `.git/hooks/prepare-commit-msg`（spec-first 托管部分）
- `.git/hooks/commit-msg`（spec-first 托管部分）
- `.git/hooks/pre-push`（spec-first 托管部分）
- `.git/hooks/pre-commit`（spec-first 托管部分）
- `.spec-first/layer2/<builtin>.yaml`（仅内置模板）

## 5.2 仅补齐不覆盖

- `.spec-first/config.yaml`

策略：按键补齐（deep-merge 默认值），已有键保持用户值。

## 5.3 绝不覆盖（用户资产）

- `specs/**`
- 业务源码与文档
- 用户新增 layer2 自定义平台模板
- 非 spec-first 管理的 git hooks 内容

---

## 6. 技术实现建议

## 6.1 CLI 结构

新增命令：`src/cli/commands/update.ts`

在 `src/cli/index.ts` 注册：

- `registerCommand('update', '升级后刷新项目规范资产', handleUpdate)`

## 6.2 update 处理流程

1. 解析 `projectRoot`。
2. 检查是否为有效项目（`.spec-first` 或可初始化目录）。
3. 执行托管资产刷新：
   - `ensureSkillCommands(...)`
   - `installHooks(...)`（Git 场景）
   - `syncBuiltinLayer2Templates(...)`
   - `mergeConfigDefaults(...)`
4. 汇总结果并输出：updated/skipped/warn。
5. 返回 ExitCode。

## 6.3 幂等与回滚

- 幂等：同一版本重复执行 update，不应产生文件 diff。
- 回滚（建议）：可在 `.spec-first/runtime/backup/` 保存覆盖前快照（P1）。

---

## 7. 与现有能力关系

- 保留现有 `setup` / `hooks`：作为底层能力命令，不对外主路径强调。
- 文档对外主路径改为：`install -> init -> update`。
- `viewer` 保持：`spec-first viewer open --print-url`，不再推荐 `node scripts/...`。

---

## 8. 风险与对策

## 8.1 风险：update 覆盖用户手改命令文件

对策：

- 明确托管目录与文件头标识（例如 `managed-by: spec-first`）。
- 默认只覆盖托管文件；无标识文件仅告警。

## 8.2 风险：hooks 与团队现有 hooks 冲突

对策：

- 支持“链式调用”模式（保留原 hooks，注入 spec-first 片段）。
- `spec-first hooks status` 报告冲突并给修复建议。

## 8.3 风险：平台模板升级破坏项目个性化

对策：

- 仅同步内置模板名单；自定义模板不动。
- 对内置模板提供 `--dry-run` 差异预览。

---

## 9. 验收标准

1. 新项目执行 `spec-first init` 后可直接进入流程。
2. 升级后执行 `spec-first update`，能刷新命令/hook/template。
3. `update --dry-run` 输出准确，不改文件。
4. 同版本连续执行两次 `update`，第二次无变更。
5. 文档示例命令均可在全局安装与 `npx` 下运行。

---

## 10. 分阶段落地计划

## P0（最小闭环）

- 新增 `update` 命令。
- 复用 `setup + hooks + config/layer2 同步`。
- 增加 `--dry-run`。
- 更新安装/使用文档主路径。

## P1（增强）

- `init` 无参交互优化（更贴近 OpenSpec）。
- 托管文件标识机制。
- 变更备份与回滚。

## P2（体验优化）

- `spec-first update` 输出 markdown 摘要报告。
- 在 Claude/Codex session-start 自动提示“可执行 update”。

---

## 11. 待确认项

1. 是否将 `spec-first init` 设为“无参默认交互”主模式（保留原参数直传）？
2. `update` 是否默认执行 hooks 安装（建议默认执行）？
3. `update` 是否默认刷新全局命令入口（建议默认仅项目级，`--global` 单独触发）？
4. 是否引入托管文件头标识作为覆盖判定标准（建议引入）？

