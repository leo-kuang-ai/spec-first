# andrej-karpathy-skills 架构分析

## 1. 一句话定义

`andrej-karpathy-skills` 不是一个多代理系统，也不是项目脚手架，而是一个 **单一行为约束 skill 的多分发仓库**。

可以压缩成一句：

> `andrej-karpathy-skills = 1 个核心行为 skill + 1 份 CLAUDE.md + 1 层 Claude Plugin 包装`

它的目标不是组织复杂工作流，而是把一套高密度的编码行为原则，以几种不同安装形态交付给 Claude Code 用户。

---

## 2. 定义层：它要解决什么问题

这个项目直接对准一类非常具体的问题：  
LLM 在编码场景下常见的行为失真。

README 里归纳的问题主要有：

- 代替用户做错误假设
- 遇到歧义时不暴露困惑
- 过度工程、抽象膨胀
- 修改与任务无关的代码和注释
- 没有明确成功标准，执行不可验证

因此它提出的解法不是“增加更多能力”，而是“约束行为”：

1. `Think Before Coding`
2. `Simplicity First`
3. `Surgical Changes`
4. `Goal-Driven Execution`

这说明它的本质是一个 **行为治理包**，而不是功能扩展包。

---

## 3. 架构层：核心组成部件

### 3.1 顶层结构

这个仓库当前非常小，核心内容只有 4 类：

| 模块 | 作用 |
| --- | --- |
| `skills/karpathy-guidelines/SKILL.md` | 唯一核心 skill，本体内容 |
| `CLAUDE.md` | 可直接追加到项目中的行为指导文件 |
| `.claude-plugin/` | Claude Plugin 安装元数据和 marketplace 信息 |
| `README.md` / `EXAMPLES.md` | 安装说明、原理说明、示例演示 |

这说明它不是“仓库中包含很多技能”，而是“围绕一个技能提供多种分发壳层”。

### 3.2 真正核心只有一个 skill

`skills/karpathy-guidelines/SKILL.md` 就是整个项目的语义中心。  
仓库里的其他文件都在服务于它：

- `CLAUDE.md` 是同一套原则的文件版
- `plugin.json` 是它的插件安装壳
- `marketplace.json` 是它的市场发布壳
- `EXAMPLES.md` 是它的解释和示范材料

所以这个仓库的结构不是：

```text
many skills -> one platform
```

而是：

```text
one skill -> many delivery formats
```

### 3.3 Plugin 层只是分发封装

`.claude-plugin/plugin.json` 声明的很清楚：

- 插件名：`andrej-karpathy-skills`
- skills 列表只有一个：`./skills/karpathy-guidelines`

`.claude-plugin/marketplace.json` 则继续把它包装成 marketplace entry。

因此插件层并不引入新的运行机制，它只是为了：

- 让 skill 能被 Claude Code 插件系统安装
- 让用户通过 marketplace 发现和安装

它是“分发层”，不是“运行层”。

---

## 4. Skill 明细：唯一 skill 的功能

### 4.1 核心 skill 表

| Skill | 类别 | 主要功能 | 典型输入 | 典型输出 | 自动化强度 |
| --- | --- | --- | --- | --- | --- |
| `karpathy-guidelines` | 行为治理 | 约束编码前思考、反过度工程、限制无关改动、要求可验证目标 | 写代码、重构、review、修 bug、实现需求 | 更克制的实现方式、显式假设、简短计划、测试导向执行 | 弱 |

### 4.2 四条核心原则

这个 skill 的全部能力几乎都收敛在 4 条原则里：

| 原则 | 解决的问题 |
| --- | --- |
| `Think Before Coding` | 防止无声假设、隐藏困惑、遗漏权衡 |
| `Simplicity First` | 防止过度抽象、超前设计、代码膨胀 |
| `Surgical Changes` | 防止顺手改无关代码、误删注释、扩散式修改 |
| `Goal-Driven Execution` | 防止没有可验证成功标准、缺少验证闭环 |

这四条原则并不定义“做什么功能”，而是定义“做功能时怎么做”。

### 4.3 示例文档的作用

`EXAMPLES.md` 不是附属宣传材料，而是 skill 的重要组成部分。  
它通过大量正反例，把抽象原则落到真实编码情境：

- 隐性假设
- 静默选择方案
- 过度抽象
- 预埋未来功能
- drive-by refactoring

因此这个仓库实际上由两层内容构成：

1. 原则层：`SKILL.md` / `CLAUDE.md`
2. 示范层：`EXAMPLES.md`

---

## 5. 运行层：它如何真正工作

### 5.1 没有复杂运行时

这个项目里没有：

- 没有脚本
- 没有 hooks
- 没有状态目录
- 没有 CLI
- 没有测试
- 没有多代理编排

它的运行方式极其简单：

```text
安装 skill / 合并 CLAUDE.md
-> Claude 在会话中读取这套行为原则
-> 后续所有编码任务受这套原则影响
```

所以它的“执行”不是主动型自动化，而是 **被动型行为塑形**。

### 5.2 三种交付形态

从 README 看，这个仓库至少支持 3 种交付形态：

| 形态 | 用法 | 适用场景 |
| --- | --- | --- |
| `CLAUDE.md` 文件 | 直接下载/追加到项目 | 单项目、最简单集成 |
| Claude Plugin | `/plugin install` | 在 Claude Code 中全局安装 |
| Marketplace entry | `/plugin marketplace add` | 便于发现和统一分发 |

这说明它的重点不是增加系统复杂度，而是尽量降低采用门槛。

### 5.3 自动化边界

它有一定的“行为自动化”价值，但没有“流程自动化”价值。

它能自动影响的东西：

- 是否先澄清再写代码
- 是否倾向最小实现
- 是否避免无关改动
- 是否补上验证标准

它不能自动完成的东西：

- 不会自动拆任务
- 不会自动委派代理
- 不会自动维护状态
- 不会自动执行测试
- 不会自动更新项目结构

因此它属于：

> “行为风格自动化”，而不是“工作流自动化”。

---

## 6. 设计特点：为什么它很特别

### 6.1 极度收敛

和前面那些项目相比，这个仓库最显著的特征就是收敛：

- 一个 skill
- 一组原则
- 一个目标问题域
- 几种安装方式

没有试图变成平台，没有试图变成 agent framework。  
这是非常刻意的设计选择。

### 6.2 它交付的是“约束”，不是“能力”

很多 skill 仓库的目标是给 agent 更多能力，比如：

- 搜索
- 文档生成
- 多代理编排
- hooks 注入
- 状态持久化

而这个仓库交付的不是能力扩展，而是：

- 风格限制
- 决策纪律
- 改动边界
- 验证习惯

它更像一个“工程行为补丁”。

### 6.3 和 `CLAUDE.md` 高度同构

这个仓库和很多 skill 仓库的另一个差异，是它的核心内容既能作为 skill，也能直接作为 `CLAUDE.md`。

这意味着它的设计不是围绕复杂 skill 机制展开，而是围绕：

> “如何让这套原则尽可能容易地进入 Claude 的上下文”

展开。

---

## 7. 与前面项目的定位差异

放到你已经分析的这组项目里，它的位置非常独特：

| 项目 | 本质定位 |
| --- | --- |
| `skills` | workflow 素材库 |
| `superpowers` | 会话级纪律框架 |
| `cc-sdd` | spec workflow 安装器 |
| `planning-with-files` | 持久化工作记忆 skill |
| `everything-claude-code` | 多层 agent harness 系统 |
| `OpenSpec` | artifact-guided workflow engine |
| `spec-kit` | spec-driven bootstrap toolkit |
| `Trellis` | 项目内常驻 AI 工作流框架 |
| `omo-skills` | 角色型多代理 skill 组织包 |
| `andrej-karpathy-skills` | 单一行为治理 skill 的多分发仓库 |

如果和 `omo-skills` 对比：

- `omo-skills` 强调角色分工
- `andrej-karpathy-skills` 强调行为约束

如果和 `superpowers` 对比：

- `superpowers` 是大规模会话纪律系统
- `andrej-karpathy-skills` 是最小化的纪律注入包

如果和 `Trellis` 对比：

- `Trellis` 有项目状态层、hooks、update、迁移
- `andrej-karpathy-skills` 只有原则、示例和分发元数据

---

## 8. 最终判断

### 8.1 核心结论

`andrej-karpathy-skills` 最准确的理解方式不是“技能库”，而是：

> 一个把 Karpathy 风格的编码行为原则，封装成 skill、CLAUDE.md 和插件三种形态的轻量治理包。

### 8.2 最短公式

```text
andrej-karpathy-skills = behavioral coding principles
                        + Claude-compatible packaging
                        + examples for calibration
```

### 8.3 一句话总结

```text
这个项目不负责让 AI 做更多事，而是负责让 AI 少做错事。
```

