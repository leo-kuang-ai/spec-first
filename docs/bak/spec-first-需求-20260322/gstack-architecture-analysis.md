# gstack 项目架构篇

文档日期：2026-03-22
分析对象：`/Users/kuang/xiaobu/gstack`
版本基线：`package.json` 中版本 `0.3.3`

## 1. 项目一句话定义

gstack 不是单一工具，而是一套“给 AI 代理分配角色和流程”的软件工厂。

它由两部分组成：

1. 一组结构化 `SKILL.md` 工作流，负责让 AI 在不同阶段扮演 CEO、工程经理、评审、QA、设计师、发布工程师等角色。
2. 一个高频、低延迟、可持久化状态的浏览器运行时 `/browse`，给 AI 真实的“眼睛和手”。

可以把它理解为：

```text
             gstack
                |
    +-----------+-----------+
    |                       |
Skill 工作流层          Browser 运行时层
    |                       |
规划/评审/测试/发布       真浏览器、真页面、真点击
    |                       |
让 AI 按团队流程工作       让 AI 能操作真实 Web
```

## 2. 顶层目录结构

```text
gstack/
├── README.md                 项目定位、安装、使用方式
├── ARCHITECTURE.md           架构设计说明
├── AGENTS.md                 技能清单与开发约定
├── SKILL.md                  顶层共享模板产物，提供 preamble/遥测/提问协议
├── SKILL.md.tmpl             顶层模板
├── setup                     安装与构建入口
├── package.json              Bun 工程定义
├── scripts/                  文档生成、校验、评估、分析脚本
├── browse/                   浏览器子系统源码与测试
├── review/ qa/ ship/...      各 skill 目录
├── docs/                     深入文档
├── test/                     skill/parser/e2e/eval 测试
├── supabase/                 遥测上报 schema / function
└── .agents/skills/           Codex/Gemini/Cursor 兼容产物
```

核心判断：

- `browse/` 是唯一真正意义上的“程序核心”。
- 其余大多数 skill 目录本质是“模板化的流程定义”。
- `scripts/gen-skill-docs.ts` 是把模板与代码元数据粘合起来的关键枢纽。

## 3. 核心设计思想

### 3.1 AI 不是直接“写代码”，而是按团队流程分工

gstack 的核心思想不是“给 AI 更多 prompt”，而是“把软件团队的角色和阶段显式化”：

```text
想法 -> 产品重构 -> 工程定案 -> 设计定案 -> 实现 -> Review -> QA -> Ship -> Retro
  |         |             |            |         |         |       |       |
office   ceo-review   eng-review  design-review  dev    review    qa    retro
hours
```

结果是：

- 用户不再把一个模糊需求一次性交给 AI。
- 每个 skill 只解决一个明确阶段的问题。
- 前一个 skill 的产物会喂给下一个 skill，形成流水线。

### 3.2 浏览器必须是持久化守护进程

`/browse` 的判断非常明确：

- 如果每次命令都冷启动浏览器，AI 的交互速度会塌到不可用。
- 如果浏览器不持久，cookie、登录态、tab、localStorage 都会丢失。

所以 gstack 采用：

```text
AI Agent
   |
   |  命令: $B snapshot / click / fill
   v
CLI 二进制
   |
   |  HTTP + Bearer Token
   v
本地 browse server
   |
   |  Playwright / CDP
   v
持久化 Chromium
```

特性：

- 首次启动约 3 秒。
- 后续命令约 100-200ms。
- 30 分钟空闲后自动关闭。
- 二进制版本变化会触发自动重启，避免 server/cli 版本错位。

### 3.3 SKILL.md 不是手写文档，而是“模板 + 源码元数据”产物

gstack 明确避免“文档和代码漂移”问题。

生成链路如下：

```text
SKILL.md.tmpl
    +
commands.ts / snapshot.ts / 生成器内置片段
    |
    v
scripts/gen-skill-docs.ts
    |
    +--> Claude 版 SKILL.md
    |
    +--> Codex 版 .agents/skills/gstack-*/SKILL.md
```

这里最关键的点：

- 浏览器命令表从 `browse/src/commands.ts` 自动生成。
- `snapshot` 参数说明从 `browse/src/snapshot.ts` 自动生成。
- 公共 preamble、提问格式、遥测逻辑、升级检查也由生成器插入。
- 因此 skill 文档本身是“可执行流程说明”，不是纯手写 prose。

## 4. 项目运行主链路

### 4.1 安装 / setup 链路

`setup` 脚本负责把仓库变成一个可运行、可被 agent 发现的技能系统。

主流程：

```text
检查 bun
  -> 解析 --host=claude|codex|auto
  -> 如有需要构建 browse 二进制
  -> 确保 Playwright Chromium 可启动
  -> 创建 ~/.gstack/projects
  -> 安装 Claude skill 软链
  -> 安装 Codex skill 软链
  -> 创建 .agents/skills/gstack sidecar 运行时软链
```

设计含义：

- 安装不是 `npm install -g` 思维，而是“把技能仓库挂到 agent 的技能目录”。
- Codex 与 Claude 共享同一仓库，但生成目标不同。
- `browse` 二进制是 setup 的硬前置条件，因为 QA/设计/Cookie 导入等都依赖它。

### 4.2 构建 / build 链路

`package.json` 的 `build` 做了四件事：

1. 生成 Claude 版 skill 文档。
2. 生成 Codex 版 skill 文档。
3. 编译 `browse` 和 `find-browse` 二进制。
4. 构建 Node 兼容 server bundle，并写入 `.version`。

这说明 build 的本质不是“前端打包”，而是：

- 技能文档编译。
- 浏览器命令行编译。
- 多宿主兼容产物编译。

### 4.3 校验 / test 链路

测试分为三层：

```text
Tier 1  静态校验
  - skill parser 校验 SKILL.md 内命令是否合法
  - 模板新鲜度校验

Tier 2  E2E
  - 真实 agent 会话运行 skill

Tier 3  LLM Judge
  - 用模型评价清晰度、可执行性、完备性
```

意味着这个仓库测试的对象并不只是 TypeScript 代码，还包括：

- prompt/skill 文档本身是否可执行。
- agent 是否能按文档正确调用命令。
- 文档与命令实现是否一致。

## 5. browse 子系统逻辑

`browse` 是整个仓库最像传统软件系统的部分。

### 5.1 主要模块

```text
browse/src/
├── cli.ts                 CLI 入口，确保 server 可用后发命令
├── server.ts              持久 server，负责 HTTP 路由与命令分发
├── browser-manager.ts     浏览器/上下文/tab/ref/dialog 生命周期
├── commands.ts            命令注册表，单一真相源
├── read-commands.ts       只读命令
├── write-commands.ts      写命令
├── meta-commands.ts       snapshot/screenshot/tabs/server 等命令
├── snapshot.ts            @ref 系统、annotate、diff、cursor-interactive
├── cookie-import-*.ts     浏览器 cookie 导入
├── buffers.ts             console/network/dialog 环形缓冲
└── config.ts/platform.ts  状态目录、路径、平台适配
```

### 5.2 命令分发模型

`commands.ts` 是单一真相源，定义三类命令：

- `READ_COMMANDS`
- `WRITE_COMMANDS`
- `META_COMMANDS`

分发流程：

```text
HTTP POST /command
  -> server.ts
  -> 读取 command
  -> 判断属于 READ / WRITE / META
  -> 调用对应 handler
  -> 返回纯文本结果
```

价值：

- 命令表同时被 runtime、文档生成器、skill 校验器复用。
- 新增命令时，文档、help、校验逻辑自动收敛到同一来源。

### 5.3 浏览器守护进程逻辑

`cli.ts` 的职责不是执行浏览器逻辑，而是“保证有一个健康的 server”。

流程如下：

```text
读取 .gstack/browse.json
  -> 判断 PID 是否仍存活
  -> 检查 server health
  -> 检查二进制版本是否变化
  -> 必要时自动 kill + restart
  -> 发送 HTTP 命令
```

关键状态文件：

```json
{
  "pid": 12345,
  "port": 34567,
  "token": "uuid",
  "startedAt": "...",
  "binaryVersion": "git-sha"
}
```

### 5.4 BrowserManager 逻辑

`browser-manager.ts` 管四类状态：

1. 浏览器实例与 context。
2. tab 集合与当前 active tab。
3. `@e1/@e2/@c1` ref 映射。
4. 对话框、错误计数、handoff 状态。

其设计原则：

- 浏览器崩溃时直接让 server 退出，不做“悄悄自愈”。
- 保持错误显式，让 CLI 在下一次调用时重启。
- tab、cookie、localStorage 尽量在 context 级别保存。

### 5.5 Snapshot / Ref 系统

这是 gstack 最关键的交互创新之一。

流程：

```text
snapshot
  -> 调 page.accessibility / ariaSnapshot
  -> 解析可访问树
  -> 为元素分配 @e1 @e2 ...
  -> 用 Playwright Locator 建立 refMap
  -> 输出带 ref 的树

后续:
click @e3
  -> resolveRef(@e3)
  -> 找到 Locator
  -> 执行 locator.click()
```

为什么不往 DOM 注入属性：

- 可能触发 CSP。
- 可能被 React/Vue 重绘抹掉。
- Shadow DOM 不稳定。

所以这里采用外部 Locator，不改 DOM。

补充能力：

- `-D`：对比前一次 snapshot。
- `-a`：生成带框截图。
- `-C`：补捉 ARIA 树外但有交互性的元素，比如 `cursor:pointer` 的 `div`。

### 5.6 日志与可观测性

三类日志：

- console
- network
- dialog

实现方式：

```text
浏览器事件
  -> 内存环形缓冲区
  -> 每秒 flush 到 .gstack/*.log
```

这样兼顾了：

- 低延迟。
- 崩溃后仍保留最近日志。
- 不让磁盘 IO 阻塞请求处理。

### 5.7 安全模型

browse server 的安全边界非常明确：

- 只绑定 `localhost`。
- 命令请求必须带 Bearer token。
- token 存在 `0o600` 权限的 state file。
- cookie 仅在内存解密并注入，不落盘明文。

其本质是“本机受限控制面”，不是对外服务。

## 6. SKILL 系统公共逻辑

所有大型 skill 基本都带同一套共享 preamble。

### 6.1 顶层共享 preamble

顶层 `SKILL.md` 提供所有 skill 的公共启动协议：

```text
运行前:
  - 检查是否有 gstack 新版本
  - 记录 session
  - 判断 contributor mode
  - 判断 proactive suggestion 开关
  - 判断是否需要介绍 Completeness Principle
  - 判断是否需要首次 telemetry 询问

运行中:
  - 统一 AskUserQuestion 格式
  - 统一 Completion Status Protocol

运行后:
  - 遥测记录
```

这意味着每个 skill 都不是一段孤立 prompt，而是被一个“公共技能运行时”包裹。

### 6.2 Completeness Principle

gstack 的流程基调是：

- AI 把“做完整”边际成本大幅降低。
- 所以如果 A 是完整方案、B 是只省一点点时间的捷径，应优先推荐 A。
- 它把这种立场写进所有 skill 的公共前言里。

这直接影响各 skill 的推荐倾向：

- 更倾向补齐测试。
- 更倾向覆盖边界条件。
- 更倾向做全设计态、错误态、文档态。

### 6.3 AskUserQuestion 协议

统一提问格式是 gstack 的一个重要产品化设计：

1. 重新锚定项目、分支、当前计划。
2. 用非内部术语解释问题。
3. 明确给出推荐选项。
4. 列出 lettered options。

价值：

- 用户切回窗口时不会丢上下文。
- 多窗口并行时问题仍可被快速理解。
- skill 风格保持一致。

### 6.4 遥测逻辑

遥测设计为显式 opt-in。

本地总会记：

- `~/.gstack/analytics/skill-usage.jsonl`

远端可选记：

- skill 名称
- 时长
- 成败
- gstack 版本
- OS

明确不上传：

- 代码
- 仓库名
- 文件路径
- prompt 内容

## 7. 安全技能逻辑

### 7.1 `/careful`

定位：命令级破坏性操作预警。

实现方式：

- 使用 `PreToolUse` hook 拦截 `Bash`。
- 由 `careful/bin/check-careful.sh` 解析命令。

检测内容：

- `rm -r` / `rm -rf`
- `DROP TABLE` / `DROP DATABASE`
- `TRUNCATE`
- `git push --force`
- `git reset --hard`
- `git checkout .` / `git restore .`
- `kubectl delete`
- `docker rm -f` / `docker system prune`

特例白名单：

- 删除 `node_modules`、`dist`、`.next`、`coverage` 等构建产物不会触发。

逻辑图：

```text
Bash 命令
  -> careful hook
  -> 命令模式匹配
  -> 若命中危险模式
       -> 返回 permissionDecision=ask
     否则
       -> 放行
```

### 7.2 `/freeze`

定位：把编辑权限锁定在单一目录。

实现方式：

- `PreToolUse` hook 拦截 `Edit` 和 `Write`。
- 由 `freeze/bin/check-freeze.sh` 检查目标文件路径是否在 freeze boundary 内。

底层机制：

- 边界保存在 `~/.gstack/freeze-dir.txt`。
- 文件路径会被归一化为绝对路径后再比较前缀。

效果：

- 超出边界的编辑会被直接 deny，不只是提醒。

### 7.3 `/guard`

定位：`/careful + /freeze` 的组合态。

实现方式：

- 对 `Bash` 套 careful hook。
- 对 `Edit/Write` 套 freeze hook。

本质上是“命令破坏 + 文件越界”双重保护。

### 7.4 `/unfreeze`

定位：解除 freeze 边界。

作用很简单，但在 gstack 体系里它是状态恢复指令，不是普通 prompt。

## 8. skill 之间的依赖与协作关系

### 8.1 典型主流程

```text
/brainstorm
    |
    v
/plan-ceo-review
    |
    v
/plan-eng-review
    |
    +------> /plan-design-review
    |
    v
实现阶段
    |
    +------> /review
    +------> /design-review
    +------> /qa 或 /qa-only
    |
    v
/ship
    |
    v
/document-release
    |
    v
/retro
```

### 8.2 browse 依赖链

依赖 `/browse` 的 skill：

- `/qa`
- `/qa-only`
- `/design-review`
- `/design-consultation` 的研究/截图环节
- `/setup-browser-cookies`

### 8.3 安全技能依赖链

- `/investigate` 默认和 freeze 思路天然耦合。
- `/guard` 是 `/careful + /freeze` 的组合。
- 所有需要高风险执行的 skill 都可被 `/careful` 护航。

## 9. 项目最关键的工程取舍

### 9.1 “浏览器是真程序，skill 是流程代码”

这是整个项目最重要的结构性事实。

- `browse` 解决的是性能、状态、交互、可观测性这些硬技术问题。
- skill 解决的是阶段切分、角色约束、提问协议、交付格式这些软流程问题。

两者组合后，AI 才像一个“带工具的团队”，而不是“一个超长 prompt”。

### 9.2 用模板系统管理 prompt 演进

很多 agent 项目把 prompt 写死成散文件，结果很快漂移。

gstack 的做法更像正规软件工程：

- 命令表单一真相源。
- 文档由源码生成。
- skill 也要测试。
- 宿主差异通过生成目标处理。

### 9.3 用本地状态目录把“多轮、多 skill、多窗口”串起来

`~/.gstack/` 里保存的不只是缓存，而是整个“软件工厂的状态层”：

- session 计数
- telemetry
- freeze boundary
- project design docs
- review / test plan / retro 痕迹

这让 gstack 不是单次 prompt，而是跨会话工作系统。

## 10. 如何理解整个项目

如果用一句更工程化的话总结：

```text
gstack = 技能模板编译系统
       + 浏览器守护进程
       + 本地状态目录
       + 安全钩子
       + 软件团队流程编排
```

如果用组织结构来理解：

```text
用户
 |
 +--> 产品负责人: /brainstorm /plan-ceo-review
 |
 +--> 工程负责人: /plan-eng-review /review /investigate
 |
 +--> 设计负责人: /plan-design-review /design-consultation /design-review
 |
 +--> QA 负责人: /browse /setup-browser-cookies /qa /qa-only
 |
 +--> 发布负责人: /ship /document-release /retro
 |
 +--> 安全与维护: /careful /freeze /guard /unfreeze /gstack-upgrade /codex
```

## 11. 结论

这个仓库的真正价值不在“有 21 个 skill”，而在它把 AI 开发工作抽象成了一个完整的软件生产系统：

- 有角色。
- 有阶段。
- 有前后依赖。
- 有底层浏览器执行器。
- 有文档编译。
- 有安全钩子。
- 有测试与回归。
- 有发布与复盘。

所以从本质上说，gstack 不是一个技能包，而是一个面向 AI 代理的软件工程操作系统。
