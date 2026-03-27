# Agent 到 Skill 的调用链路

这份文档说明 Everything Claude Code, 也就是 ECC, 是怎么把命令、
agent、skill 和不同 harness 的运行时加载串起来的。

先给结论:

- 命令通常先选 agent
- agent 再指向一个或多个 skill
- skill 通过静态目录和元数据暴露给 harness
- 仓库里没有一个本地的“技能评分器”去决定最终选哪个 skill
- 真正的自动选择发生在 Codex、Antigravity 这类运行时

## 为什么要分清这条链路

ECC 同时维护了很多 agent 和 skill，而且还要适配多个 harness。
如果不把链路拆开，很容易混淆下面几件事:

- 命令注册表
- agent 角色定义
- skill 文档
- 安装时的文件映射
- 运行时的自动激活逻辑

这份文档把这些层分开讲。

## 总览

```text
用户请求
  |
  v
 slash command 或直接调用 agent
  |
  +--> 命令 -> agent 映射
  |       (docs/COMMAND-AGENT-MAP.md)
  |
  v
 agent 定义
  |
  +--> 角色说明
  +--> 对 skill 的引用
  |
  v
 skill 包
  |
  +--> SKILL.md
  +--> agents/openai.yaml
  |
  v
 harness 发现
  |
  +--> Codex 自动加载 .agents/skills/
  +--> Antigravity 以 `.agents/skills/` 作为静态来源，并在运行时使用 `.agent/skills/`
  |
  v
 运行时激活
  |
  +--> 显式调用
  +--> 元数据允许时的隐式调用
  +--> harness 根据上下文做匹配
```

## 第一层: 命令到 Agent

第一步通常发生在命令层。

例子:

- `/tdd` 会路由到 `tdd-guide`
- `/code-review` 会路由到 `code-reviewer`
- `/security-scan` 会路由到 `security-reviewer`

权威映射在 [docs/COMMAND-AGENT-MAP.md](/Users/kuang/xiaobu/everything-claude-code/docs/COMMAND-AGENT-MAP.md#L1)。

```text
/tdd            -> tdd-guide
/code-review    -> code-reviewer
/security-scan  -> security-reviewer
/plan           -> planner
```

这份文件就是命令到 agent 的人类可读索引。

## 第二层: Agent 到 Skill

agent 是用户动作和具体工作流之间的桥梁。
很多 agent 会直接指向一个 backing skill。

例子:

- [agents/tdd-guide.md](/Users/kuang/xiaobu/everything-claude-code/agents/tdd-guide.md#L80) 引用了 `skill: tdd-workflow`
- [agents/security-reviewer.md](/Users/kuang/xiaobu/everything-claude-code/agents/security-reviewer.md#L104) 引用了 `skill: security-review`
- [agents/docs-lookup.md](/Users/kuang/xiaobu/everything-claude-code/agents/docs-lookup.md#L1) 是一个文档型 agent，直接使用 Context7 工具，而不是再转到别的 workflow skill

一个典型的调用链是:

```text
/tdd
  -> tdd-guide agent
  -> tdd-workflow skill
  -> TDD 工作流说明、示例和检查清单
```

另一个例子:

```text
/security-scan
  -> security-reviewer agent
  -> security-review skill
  -> 安全检查清单和修复流程
```

这里最重要的区别是:

- agent 负责角色和运行风格
- skill 负责具体方法、检查项和示例

## 第三层: Skill 包结构

ECC 把每个 skill 组织成一个小包，核心文件有两个:

- `SKILL.md`
- `agents/openai.yaml`

`SKILL.md` 里放工作流、触发条件、示例和约束。

`agents/openai.yaml` 里放 harness 能读到的元数据，用于展示和隐式激活。

常见字段包括:

- `display_name`
- `short_description`
- `brand_color`
- `default_prompt`
- `allow_implicit_invocation`

示例:

```yaml
interface:
  display_name: "Frontend Patterns"
  short_description: "React and Next.js patterns and best practices"
  brand_color: "#8B5CF6"
  default_prompt: "Apply React/Next.js patterns and best practices"
policy:
  allow_implicit_invocation: true
```

这些字段在实际运行中的作用:

- `short_description` 帮 harness 展示候选 skill
- `default_prompt` 帮手动调用时给出默认提示
- `allow_implicit_invocation: true` 允许 harness 根据上下文自动激活 skill

## 第四层: 运行时发现

对于 Codex，这个仓库明确写了 skills 会从 `.agents/skills/` 自动加载。
`.codex/AGENTS.md` 说明每个 skill 由 `SKILL.md` 和 `agents/openai.yaml`
组成。

对于 Antigravity，指南说明同样的元数据用于支持隐式调用。
`.agents/skills/<skill-name>/agents/openai.yaml` 是仓库里的静态来源文件，
而实际运行目录是 `.agent/skills/`。

这说明运行时并不是在仓库里找一个“最佳 skill”函数。
它是先把所有可用 skill 载入，再由 harness 根据上下文决定用哪个。

## 安装时链路

仓库里还有一条很容易和运行时搞混的链路。

这条链路负责把文件按目标 harness 的布局复制到正确位置。

```text
安装请求
  -> parseInstallArgs
  -> normalizeInstallRequest
  -> loadInstallManifests
  -> resolveInstallPlan
  -> target adapter
  -> 文件操作
  -> 目标目录
```

关键文件:

- [scripts/lib/install/request.js](/Users/kuang/xiaobu/everything-claude-code/scripts/lib/install/request.js#L11) 负责解析安装参数并标准化请求
- [scripts/lib/install-manifests.js](/Users/kuang/xiaobu/everything-claude-code/scripts/lib/install-manifests.js#L286) 负责加载模块和 component catalog，并生成安装计划
- [scripts/lib/install-targets/antigravity-project.js](/Users/kuang/xiaobu/everything-claude-code/scripts/lib/install-targets/antigravity-project.js#L34) 负责把路径重映射为:
  - `rules` -> `.agent/rules/`
  - `commands` -> `.agent/workflows/`
  - `agents` -> `.agent/skills/`
- [scripts/lib/install-targets/helpers.js](/Users/kuang/xiaobu/everything-claude-code/scripts/lib/install-targets/helpers.js#L204) 提供通用的 adapter 逻辑

这条链路决定的是“文件放哪儿”，不是“某个任务最终激活哪个 skill”。

## Manifest 里编码了什么

安装清单定义了仓库里有哪些可安装内容。

### `manifests/install-modules.json`

这个文件把仓库组织成多个模块，例如:

- `agents-core`
- `commands-core`
- `platform-configs`
- `framework-language`
- `workflow-quality`
- `security`
- `research-apis`
- `business-content`
- `social-distribution`
- `media-generation`
- `orchestration`

其中 `framework-language`、`workflow-quality`、`security` 等模块下面包含大量 skill。

### `manifests/install-components.json`

这个文件再往上一层，提供更用户友好的 component catalog。

其中的 family 包括:

- `agent`
- `skill`
- `capability`

它帮助 installer 和文档从“更大的 bundle”角度展示可选内容。

## 仓库级默认 Skill

ECC 还带了一个仓库专属 skill:

- [`.claude/skills/everything-claude-code/SKILL.md`](/Users/kuang/xiaobu/everything-claude-code/.claude/skills/everything-claude-code/SKILL.md#L20)
- [`.agents/skills/everything-claude-code/SKILL.md`](/Users/kuang/xiaobu/everything-claude-code/.agents/skills/everything-claude-code/SKILL.md#L20)
- [`.agents/skills/everything-claude-code/agents/openai.yaml`](/Users/kuang/xiaobu/everything-claude-code/.agents/skills/everything-claude-code/agents/openai.yaml#L1)

这个 skill 会说自己应该在“修改这个仓库”时启用，也就是它是 ECC 工作里最明显的通用默认 skill 候选。

## 具体链路示例

### 示例 1: TDD

```text
用户想实现一个功能
  -> /tdd 命令
  -> tdd-guide agent
  -> tdd-workflow skill
  -> 先写测试
  -> 再写最小实现
  -> 验证覆盖率
```

### 示例 2: 安全审查

```text
用户想检查安全敏感代码
  -> /security-scan 命令
  -> security-reviewer agent
  -> security-review skill
  -> 跑安全清单
  -> 找漏洞
  -> 给修复建议
```

### 示例 3: 文档 / API 问题

```text
用户询问某个库或 API
  -> docs-lookup agent
  -> Context7 resolve-library-id
  -> Context7 query-docs
  -> 返回最新文档摘要
```

这个例子和前两个不同，因为这里的 agent 本身就是一个直接使用工具的角色，
而不是主要负责把任务转给另一个 workflow skill。

## 两条 ASCII 主链路

```text
                     运行时链路

 用户请求
     |
     v
 命令 / 直接 agent 调用
     |
     v
 agent 角色文件
     |
     v
 skill 文件 + skill 元数据
     |
     v
 harness 自动加载 .agents/skills/
     |
     v
 根据上下文进行激活


                     安装链路

 安装命令 / profile / module 选择
     |
     v
 安装请求解析器
     |
     v
 manifest 解析器
     |
     v
 target adapter
     |
     v
 文件操作
     |
     v
 输出到 .agent/ / .codex/ / .claude/
```

## 这个仓库里没有什么

仓库里没有一个很明显的本地源码文件，负责:

- 按相关度给 skill 打分
- 在运行时给 skill 排序
- 用自定义启发式引擎挑选 skill

仓库提供的是:

- skill 包
- 元数据
- 命令和 agent 的引用关系
- 安装时的目录映射规则

真正的自动选择逻辑在 harness runtime 里。

## 维护规则

当你新增或修改 agent / skill 时，通常要同步这些地方:

1. 如果 agent 角色变了，更新 `agents/` 下的 agent 文件
2. 如果 workflow 变了，更新 `skills/<name>/SKILL.md`
3. 如果需要 Codex 支持，把 skill 镜像到 `.agents/skills/<name>/`
4. 如果希望隐式调用顺滑，更新 `.agents/skills/<name>/agents/openai.yaml`
5. 如果 slash command 有变化，更新 `docs/COMMAND-AGENT-MAP.md`
6. 如果安装目录布局变化，更新 `manifests/install-modules.json` 和
   `manifests/install-components.json`

## 关键文件

- `docs/COMMAND-AGENT-MAP.md`
- `agents/*.md`
- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`
- `.codex/AGENTS.md`
- `docs/ANTIGRAVITY-GUIDE.md`
- `scripts/lib/install/request.js`
- `scripts/lib/install-manifests.js`
- `scripts/lib/install-targets/helpers.js`
- `scripts/lib/install-targets/antigravity-project.js`
- `manifests/install-modules.json`
- `manifests/install-components.json`

## 一句话总结

ECC 里的 agent 到 skill 调用链，本质上是由文档、元数据和 harness
约定拼出来的:

- 命令先选 agent
- agent 再引用 skill
- skill 提供细节工作流
- harness 从静态目录自动加载 skill
- `allow_implicit_invocation` 让 harness 可以基于上下文自动激活

如果你想改变“某类任务最终用哪个 skill”，通常要改的是 skill 元数据、
agent 引用和命令映射，而不是在仓库里加一个新的运行时选择器。
