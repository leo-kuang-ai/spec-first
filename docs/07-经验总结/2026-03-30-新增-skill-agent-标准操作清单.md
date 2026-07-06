# 新增 Skill / Agent 标准操作清单

## 适用范围

这份清单适用于当前 `spec-first` 仓库中新增或调整以下资产：

- `skills/<skill-name>/SKILL.md`
- `agents/<category>/<agent-name>.md`
- 需要同时兼容 Claude Code 和 Codex 的工作流入口

目标不是只让“文件存在”，而是让它能通过当前 CLI 打包、初始化、平台适配和真实入口验证。

## 一条核心原则

**源码资产只维护在 `skills/` 和 `agents/` 下，平台运行时目录一律视为生成物，不直接手改。**

也就是说，不要把以下目录当成源码去维护：

- `.claude/`
- `.codex/`
- `.agents/skills/`

这些目录都应该通过 `spec-first init --claude` 或 `spec-first init --codex` 生成。

## 新增 Skill 的标准步骤

### 1. 创建源码目录

在仓库中新增：

```text
skills/<skill-name>/SKILL.md
```

建议：

- 目录名全部使用 kebab-case
- 尽量语义稳定，不要频繁改名
- 如果这是面向用户的入口型 workflow，优先用 `spec-*` 前缀

### 2. 保持 skill 名称一致

`SKILL.md` 的 frontmatter `name:` 应与目录名一致。

正确示例：

```markdown
---
name: spec-brainstorm
description: ...
---
```

避免这种不一致：

```markdown
---
name: brainstorm-workflow
description: ...
---
```

原因：

- Claude Code 对这个问题容忍度更高
- Codex 的 skill 发现对 `name:` 更敏感
- 目录名与 `name:` 脱节时，Codex runtime 的 `spec-*` 很容易不命中

注意区分两层：

- source `skills/<skill-name>/SKILL.md` 可以保留仓库内部命名，例如 `brainstorm-workflow`
- Codex runtime 生成后的 `name:` 需要与 `.agents/skills/<skill-name>/` 目录名一致

### 3. 内容里不要硬编码平台私有路径

在 skill 正文里，不要直接把某个平台运行时目录写成唯一真相，例如：

- `.codex/commands/spec/...`
- `.agents/skills/...`
- `.agents/plugins/...`

当前仓库的设计是：

- canonical skill 源写在 `skills/`
- Claude/Codex 运行时路径由 adapter 转换

所以 skill 内容要尽量引用“源码语义”或“仓库约定名”，不要反向依赖生成目录。

### 4. 如果需要调用 agent，统一使用仓库约定名

推荐使用：

```text
spec-first:<category>:<agent-name>
```

或者：

```text
Task spec-first:<category>:<agent-name>(...)
```

例如：

```text
Task spec-first:review:correctness-reviewer(Review the current diff for correctness risks)
```

不要直接在 skill 源里写：

```text
.codex/agents/review/correctness-reviewer.md
```

原因：

- Claude 和 Codex 的 agent 运行时路径不同
- 当前 Codex adapter 已经负责把 `spec-first:<category>:<agent-name>` 改写成 `.codex/agents/...`

### 5. 判断它是不是“核心工作流 skill”

普通 skill 和核心 workflow skill 的处理不同。

普通 skill：

- 只需新增 `skills/<skill-name>/SKILL.md`
- 通常不需要修改 `src/cli/contracts/dual-host-governance/skills-governance.json`

核心 workflow skill：

- 既要能作为 Claude 的 `spec-*` 命令被调用
- 又要能作为 Codex 的 `spec-*` skill 被发现
- 不再生成 `.codex/commands/spec/<name>.md`；Codex 正式 discovery 以 `.agents/skills/spec-<name>/` 为准

如果是新增核心 workflow，还必须继续执行下面的“新增核心 workflow”步骤。

## 新增 Agent 的标准步骤

### 1. 选择正确分类

在仓库中新增：

```text
agents/<category>/<agent-name>.md
```

优先复用已有分类：

- `review/`
- `research/`
- `workflow/`
- `design/`
- `docs/`

只有在现有分类明显不适合时，才新增新目录。

### 2. 命名保持稳定

命名建议：

- reviewer 类：`*-reviewer`
- analyst 类：`*-analyst`
- strategist 类：`*-strategist`
- specialist 类：`*-specialist`

不要同时出现两套意思相近但命名漂移的 agent，例如：

- `security-reviewer`
- `security-review-agent`
- `security-checker`

这会让 skill 编排和后续维护都变乱。

### 3. 只在源码 agent 中描述能力，不写平台路径

agent 文件本身只描述：

- 角色职责
- 审查视角
- 输出标准
- 使用边界

不要在 agent 源里写某个平台专用调用方式。

## 新增核心 Workflow 的额外步骤

如果你新增的是新的主链路入口，例如想增加：

- Claude: `spec-triage`
- Codex: `spec-triage`

那除了新增 skill，还要同步以下资产。

### 1. 更新 manifest

修改：

- `src/cli/contracts/dual-host-governance/skills-governance.json`

新增 command 项：

- `name`
- `filename`
- `description`
- `argumentHint`
- `skill`

其中 `skill` 应指向对应 skill 名，例如：

```json
{
  "name": "triage",
  "filename": "triage.md",
  "description": "Run the Spec-First triage workflow",
  "argumentHint": "[issue or problem]",
  "skill": "spec-triage"
}
```

### 2. 新增 Claude command template

新增：

```text
templates/claude/commands/spec/triage.md
```

这一步是为了让 Claude Code 继续通过 `spec-triage` 进入 workflow。

### 3. 新增对应 skill

新增：

```text
skills/spec-triage/SKILL.md
```

这样 Codex 在生成 runtime 后，才会出现：

```text
spec-triage
```

## 同时兼容 Claude 和 Codex 的检查点

每次新增 skill / agent 后，至少检查以下几点。

### 1. 目录和命名是否一致

- skill 目录名是否正确
- source `SKILL.md` 的 `name:` 是否符合仓库内部命名约定
- 如是核心 workflow，Codex runtime 的 `name:` 是否与 `.agents/skills/<skill-name>/` 目录名一致
- agent 文件名是否与引用名一致

### 2. 引用是否使用 canonical 形式

- skill 中引用 agent 时，是否使用 `spec-first:<category>:<agent-name>`
- 是否误写了 `.codex/agents/...`
- 是否把 `.agents/skills/...` 当成源码真源写进 skill 正文

### 3. 是否不小心把平台运行时目录当成源码改了

如果你修改的是：

- `.claude/...`
- `.codex/...`
- `.agents/skills/...`

那大概率改错地方了，应该回到 `skills/` 或 `agents/`。

## 标准自测流程

### A. 基础测试

```bash
bash tests/smoke/cli.sh
npm test
```

目标：

- smoke 通过
- integration 通过

### B. 重新生成 Claude runtime

```bash
spec-first clean --claude
spec-first init --claude
spec-first doctor --claude
```

确认：

- Claude 的 commands / skills / agents 都生成成功

### C. 重新生成 Codex runtime

```bash
spec-first clean --codex
spec-first init --codex
spec-first doctor --codex
```

确认：

- `.agents/skills/<skill-name>/SKILL.md` 存在
- `.codex/agents/<category>/<agent-name>.md` 存在
- `doctor --codex` 正常

### D. 入口验证

如果你新增的是普通辅助 skill：

- 确认它在 Claude runtime 和 Codex runtime 都被生成

如果你新增的是核心 workflow：

还要做真实入口验证。

Claude Code：

```text
spec-*
```

Codex：

```text
spec-*
```

至少确认目标平台可以看到该入口。

## 提交前自查清单

- [ ] skill 源写在 `skills/`，agent 源写在 `agents/`
- [ ] 没有直接把 `.claude/`、`.codex/`、`.agents/skills/` 当源码改
- [ ] source skill 的 `name:` 符合仓库内部命名约定；如是核心 workflow，已验证 Codex runtime `name:` 与目录名一致
- [ ] 引用 agent 时使用 `spec-first:<category>:<agent-name>`
- [ ] 如果是核心 workflow，已同步更新 `src/cli/contracts/dual-host-governance/skills-governance.json`
- [ ] 如果是核心 workflow，已新增 `templates/claude/commands/spec/<name>.md`
- [ ] Claude 和 Codex 的 `init` / `doctor` 都验证过
- [ ] smoke / integration 都通过
- [ ] 如有用户入口变化，README 和用户手册已同步更新

## 常见错误总结

### 错误 1：只新增了 skill，没有补 Claude command

结果：

- Codex 可能能用 `spec-xxx`
- Claude 里却没有 `spec-xxx`

### 错误 2：skill 目录名和 `name:` 不一致

结果：

- source 层不一定有问题
- 但 Codex runtime 不一定能按预期 skill 名发现

### 错误 3：在 skill 里写死 `.codex/agents/...`

结果：

- 失去平台适配能力
- Claude 和未来平台更难兼容

### 错误 4：改了生成目录，以为已经改了源码

结果：

- 本地测试可能暂时看起来正常
- 下一次 `init` 会把这些改动全部覆盖掉

## 一句话准则

**先写 canonical 源资产，再让 adapter 负责平台落地；不要反过来围着运行时目录做设计。**
