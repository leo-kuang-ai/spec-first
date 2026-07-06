# Agent 命名空间短期优化方案

> **代码审查发现**：2026-03-29 通过实际调用日志确认，agent 显示 0 tool uses 的根本原因是命名空间不匹配导致 agent 无法被加载。

## 目标

在不推翻当前 `npm install -g spec-first` + `spec-first init --claude` 主链路的前提下，修复目标项目运行态中 `skill -> agent` 引用失配的问题，并为未来接入 `Codex` 等多平台保留统一资产模型。

## 背景

当前仓库已经同时具备两层模型：

1. **源码资产层**
   - npm 包内发布 `skills/`、`agents/`、`templates/`、`.claude-plugin/plugin.json`
   - 这里的 `skill` 内容使用 fully-qualified agent 名称，例如：
     - `spec-first:research:repo-research-analyst`
     - `spec-first:review:correctness-reviewer`

2. **目标项目运行态**
   - 用户执行 `spec-first init --claude`
   - CLI 把资产同步到目标项目：
     - `.claude/commands/spec/`
     - `.claude/skills/`
     - `.claude/agents/`

当前问题出在第二层：目标项目实际拿到的是本地目录结构，但没有真正注册 `spec-first` 这个运行时插件命名空间。

## 根因分析

### 代码审查实证（2026-03-29）

**实际调用日志**：
```
spec-first:research:repo-research-analyst (分析仓库技术栈和结构) · 0 tool uses
spec-first:research:learnings-researcher (查找相关经验) · 0 tool uses
```

**验证结果**：
- Agent 文件存在：`.claude/agents/research/repo-research-analyst.md` ✓
- Agent 定义正确：`name: repo-research-analyst` ✓
- 当前运行态缺少 adapter：`spec-first:research:xxx` 与本地展开目录之间没有桥接 ✗
- `research:repo-research-analyst` 是当前短期方案的**目标输出格式**，仍需通过实现与测试验证

**影响范围统计**：
- 当前已确认受影响的高风险 skill 文件：7+ 个
- 当前已确认存在 fully-qualified 运行态引用的命名空间：research / review / workflow / design / spec-doc-review
- 仍需对 `agents/` 全目录做全量扫描，避免遗漏其他分类

### 1. 打包发布层没有问题

`package.json` 当前会把下列目录打进发布物：

- `bin/`
- `src/`
- `.claude-plugin/`
- `agents/`
- `skills/`
- `templates/`

这说明发布物已经包含完整插件资产，不是”agent 文件没打进去”。

### 2. 最终产物路径决定了当前运行态语义

`spec-first init --claude` 的实际产物路径是：

- `.claude/commands/spec/*.md`
- `.claude/skills/<skill>/SKILL.md`
- `.claude/agents/<group>/<agent>.md`

也就是说，当前目标项目运行时看到的是**本地展开后的文件资产**，不是“已注册的 `spec-first` 插件”。

### 3. 失配点在于 skill 引用仍保留了插件限定名

例如：

- skill 中写的是：`spec-first:research:repo-research-analyst`
- 目标项目里实际存在的是：`.claude/agents/research/repo-research-analyst.md`
- agent frontmatter 中的 `name:` 仍是裸名：`repo-research-analyst`

在没有 plugin namespace 注册的前提下，当前短期方案**计划适配为**：

- `research:repo-research-analyst`
- `review:correctness-reviewer`

而不是：

- `spec-first:research:repo-research-analyst`

因此，现象不是“agent 文件缺失”，而是**安装后的运行态引用格式与当前平台解析方式之间缺少适配层**。

## 短期方案定位

### 结论

短期方案不应该：

- 全仓库批量删除源码中的 `spec-first:`
- 把 canonical 资产永久改成 Claude 本地目录专用格式
- 现在就强推 plugin-first 安装模型

短期方案应该：

- 保留源码层的 canonical 插件资产
- 在 `init --claude` 阶段做一次 **Claude 运行态适配**
- 让目标项目中的 `.claude/skills/` 使用 Claude 本地可解析的 agent 引用格式

## 核心设计

### 设计原则

1. **源码层保持 canonical**
   - 仓库中的 `skills/`、`agents/`、`.claude-plugin/plugin.json` 继续作为统一事实来源
   - fully-qualified 名称仍保留在源码层

2. **生成层负责适配**
   - `spec-first init --claude` 在复制 skill 文件到目标项目时，执行一次文本转换
   - 把 `spec-first:<group>:<agent>` 转成 `<group>:<agent>`

3. **平台差异只留在 adapter**
   - Claude 是第一个平台 adapter
   - 未来加 `Codex` 时，不修改 canonical 源码，只新增 `Codex` adapter

## 具体改造项

### 1. 在同步层引入 Claude 命名空间适配

调整点：

- `src/cli/plugin.js`
- 可能新增 `src/cli/adapters/claude.js` 或等价模块

目标：

- 同步 `skills/` 时，不只是 `cp`
- 对复制后的 `SKILL.md` 和必要的 reference markdown 做转换

转换规则：

```text
spec-first:research:repo-research-analyst  -> research:repo-research-analyst
spec-first:review:correctness-reviewer     -> review:correctness-reviewer
spec-first:workflow:pr-comment-resolver    -> workflow:pr-comment-resolver
spec-first:design:design-iterator          -> design:design-iterator
spec-first:spec-doc-review:coherence-reviewer -> spec-doc-review:coherence-reviewer
```

注意：

- 只转换 **agent type** 引用
- 不要误伤 `/spec-first:*` slash command 文本
- 不要误删普通 prose 中作为“源码 canonical 示例”的说明，除非该文本属于运行时执行指令
- 以上是 Claude adapter 的目标规则，必须以落地代码和 smoke test 结果为准

### 2. 明确转换边界

需要转换的对象：

- `.claude/skills/*/SKILL.md`
- `.claude/skills/*/references/*.md` 中被运行时引用的 agent 名称说明

当前优先处理：

- 已确认受影响命名空间：`research`、`review`、`workflow`、`design`、`spec-doc-review`

全量扫描要求：

- `agents/` 目录下的所有分类都要纳入扫描
- 但只有在运行态 skill 里真的被引用时，才进入本轮转换实现

不需要转换的对象：

- 仓库源码下的 `skills/`
- `.claude-plugin/plugin.json`
- `templates/`
- 文档目录 `docs/`

关于 `templates/` 的边界：

- 当前 `templates/claude/commands/spec/*.md` 必须继续同步到目标项目
- 但命名空间适配默认只作用于运行态 `skills/`
- 只有当后续确认模板正文里也包含运行态 agent type 引用时，才把对应模板纳入转换范围

### 3. 给 doctor 增加运行态一致性检查

在 `spec-first doctor` 中增加一类检查：

- 抽样或扫描 `.claude/skills/` 下是否仍存在 `spec-first:research:`、`spec-first:review:`、`spec-first:workflow:` 等本地不可解析形式

输出建议：

- 如果发现残留，提示重新执行 `spec-first init --claude`
- 或提示当前项目运行态与当前 CLI 版本不一致

### 4. 为 smoke test 增加回归覆盖

至少补三类测试：

1. `init --claude` 后，关键运行态 skill 中不再残留 `spec-first:research:` 等形式
2. 关键 slash command 仍保持不变：
   - `spec-brainstorm`
   - `spec-plan`
   - `spec-work`
   - `spec-code-review`
   - `spec-compound`
3. 重新执行 `init --claude` 时，转换结果稳定、幂等

建议重点覆盖：

- `spec-plan`
- `spec-code-review`
- `resolve-pr-feedback`
- `todo-resolve`

### 5. 修正文档口径

需要同步更新：

- `docs/Agent命名空间错误修复指南.md`
- `docs/02-架构设计/02-目录结构.md`
- `docs/05-用户手册/06-本地源码安装.md`

统一后的文档口径应为：

- 源码层允许使用 `spec-first:<group>:<agent>` 作为 canonical 名称
- Claude 本地运行态是展开目录模型
- `spec-first init --claude` 会自动完成运行态命名空间适配
- 用户不应手工批量替换 `.claude/skills/` 中的 `spec-first:`

## 非目标

本次短期方案不做以下事情：

- 不把当前安装方式改成真正 plugin-first
- 不要求 Claude 运行时注册 `spec-first` namespace
- 不删除 `templates/`
- 不修改仓库源码中的 canonical fully-qualified 引用
- 不启动 `Codex` 平台适配实现

## 为什么这套短期方案对未来多平台友好

因为它把平台差异放在**生成层**，而不是**源码层**。

这样未来接入 `Codex` 时，可以继续复用：

- `.claude-plugin/plugin.json`
- `skills/`
- `agents/`

然后新增：

- `init --codex`
- `Codex` 命名空间/目录适配规则

而不需要再把源码里的 agent 引用全部改回去。

## 实施顺序

1. 新增 Claude 运行态命名空间适配逻辑
2. 先覆盖已确认受影响命名空间，再补全量扫描保护
3. 补 smoke test 验证 skill 运行态文本已转换
4. 补 `doctor` 一致性检查
5. 重写 `docs/Agent命名空间错误修复指南.md`
6. 更新安装和架构文档

## 验收标准

满足以下条件即可认为短期方案完成：

1. `npm pack` 产物不变，仍包含 `skills/`、`agents/`、`templates/`、`.claude-plugin/plugin.json`
2. `spec-first init --claude` 后，目标项目的 `.claude/skills/` 中关键运行态引用已被转换到 Claude adapter 的目标格式
3. `spec-plan`、`spec-code-review`、`/resolve-pr-feedback` 不再因 agent 名称失配出现 `0 tool uses`
4. `spec-first doctor` 能识别运行态命名空间残留问题
5. 文档不再建议用户手工删除源码中的 `spec-first:` 前缀

### 验收测试用例

**测试 1：Agent 调用成功**
```
执行：spec-plan
预期：research:repo-research-analyst 显示 >0 tool uses
实际：调用成功，执行 Glob/Read 等工具
```

**测试 2：命名空间转换正确**
```bash
# 检查转换后的 skill 文件
grep -r "spec-first:research:" .claude/skills/
# 预期：无匹配结果（已全部转换）
```

**测试 3：关键 skill 可用**
- `spec-brainstorm` - 正常执行
- `spec-plan` - 调用 research/review agents 成功
- `spec-code-review` - 调用 review agents 成功
- `/resolve-pr-feedback` - 调用 workflow agents 成功

## 风险与控制

### 风险 1：误替换 slash command

控制：

- 只对 `agent type` 模式做定向替换
- 对 `/spec-first:*` 这类命令语法不做处理

### 风险 2：reference 文档和执行文档不一致

控制：

- 只对运行态必须读取的 reference 文件做转换
- 文档目录 `docs/` 保留源码口径说明

### 风险 3：未来 plugin-first 时再次迁移

控制：

- 明确 canonical 在源码层，不在运行态层
- 未来只替换 adapter，不回改资产源文件

## 决策结论

短期内最稳、最正确的修复方式是：

**保持 canonical 插件资产不变，在 `spec-first init --claude` 阶段增加 Claude 运行态命名空间适配层。**

这既能修复当前 `skill -> agent` 失配问题，也不会阻断未来接入 `Codex` 等多平台的演进路径。
