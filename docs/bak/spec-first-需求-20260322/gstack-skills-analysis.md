# gstack skill 逐个详解篇

文档日期：2026-03-22
分析对象：`/Users/kuang/xiaobu/gstack`
版本基线：`package.json` 中版本 `0.3.3`

## 1. skill 总览

gstack 当前可见的 skill 共 21 个：

```text
产品与规划
  /brainstorm
  /plan-ceo-review
  /plan-eng-review
  /plan-design-review
  /design-consultation

开发质量与实现闭环
  /review
  /investigate
  /design-review
  /qa
  /qa-only
  /ship
  /document-release
  /retro

浏览器与会话能力
  /browse
  /setup-browser-cookies

增强与运维
  /codex
  /gstack-upgrade

安全控制
  /careful
  /freeze
  /guard
  /unfreeze
```

如果按软件迭代流程去看，它们组成的是：

```text
想法
  -> /brainstorm
  -> /plan-ceo-review
  -> /plan-eng-review
  -> /plan-design-review
  -> 实现
  -> /review
  -> /design-review
  -> /qa 或 /qa-only
  -> /ship
  -> /document-release
  -> /retro
```

## 2. 每个 skill 的逐个逻辑

## 2.1 `/brainstorm`

定位：产品/想法阶段入口。

触发：

- 用户说要 brainstorm。
- 用户有新点子、新产品、新 feature 方向。
- 所有 plan 类 skill 之前的推荐入口。

主逻辑：

```text
收集上下文
  -> 判断是 Startup Mode 还是 Builder Mode
  -> 追问真实痛点 / 约束 / 现有替代方案
  -> 质疑原始 framing
  -> 提炼核心 premise
  -> 给出 2-3 条实现路线
  -> 推荐最小可验证 wedge
  -> 产出设计文档
```

特点：

- 更像 YC 合伙人，不像普通产品经理。
- 重心是“重新定义问题”，不是拆任务。
- 是后续 CEO/Eng review 的输入源。

## 2.2 `/plan-ceo-review`

定位：创始人视角的范围与愿景复盘。

触发：

- 用户要“想得更大”“重构范围”“评估是否足够 ambitious”。

主逻辑：

```text
读取已有设计文档/计划
  -> 识别当前 scope
  -> 进入四种模式之一
     - Scope Expansion
     - Selective Expansion
     - Hold Scope
     - Scope Reduction
  -> 按用户价值和产品势能挑战当前方案
  -> 逐项提出 scope 决策
  -> 持久化愿景与选择
```

价值：

- 防止 AI 机械执行 ticket。
- 把“真正要做的产品”从“表面功能”中剥离出来。

## 2.3 `/plan-eng-review`

定位：工程经理模式，确保方案可实现。

触发：

- 已有产品方向，需要锁定架构、数据流、边界条件、测试。

主逻辑：

```text
读取计划/设计文档
  -> 检查是否缺 design doc
  -> 审查架构边界
  -> 绘制/要求 ASCII 图
  -> 分析数据流、状态迁移、失败路径
  -> 明确测试策略与风险
  -> 产出 test plan
```

它关注的不是“值不值得做”，而是“这样做能不能稳地落地”。

## 2.4 `/plan-design-review`

定位：设计方案评审，发生在写代码前。

触发：

- 计划里有 UI/UX 但设计描述不充分。

主逻辑：

```text
读取计划
  -> 做多轮设计维度打分
  -> 识别缺失的 loading / empty / error / mobile / hierarchy 定义
  -> 对明显问题直接修文档
  -> 对真实 tradeoff 发 AskUserQuestion
  -> 让设计计划从模糊变成可执行
```

核心关注：

- 信息层级
- 交互态完整性
- 用户旅程
- AI slop 风险
- 设计系统一致性
- 响应式与可访问性

## 2.5 `/design-consultation`

定位：从零搭建设计系统。

触发：

- 新产品没有设计系统。
- 用户要 `DESIGN.md`、品牌风格、颜色/字体/动效方案。

主逻辑：

```text
Phase 0 预检查
  -> Phase 1 收集产品与业务语境
  -> Phase 2 若用户同意则做设计参考研究
  -> Phase 3 提完整设计系统提案
  -> Phase 4 按用户反馈做 drill-down
  -> 产出 DESIGN.md 与预览建议
```

它不是做像素级实现，而是定义视觉语言和设计源文件。

## 2.6 `/review`

定位：PR 落地前的工程质量评审。

触发：

- 用户说 review / code review / check my diff。

主逻辑：

```text
检测 base branch
  -> 检查当前分支与 scope drift
  -> 读取 review checklist
  -> 如有 Greptile 评论则纳入
  -> 拉取 diff
  -> 两遍 review
     - 第一遍找结构性风险
     - 第二遍找遗漏/回归
  -> 必要时附加 design review
```

侧重点：

- SQL 安全
- LLM 信任边界
- 条件分支副作用
- 容易过 CI 但线上炸的问题

## 2.7 `/investigate`

定位：严格调试流程。

触发：

- 用户报告 bug、异常、错误、莫名其妙的问题。

主逻辑：

```text
Phase 1 调查根因
  -> Phase 2 分析模式
  -> Phase 3 假设验证
  -> Phase 4 实施修复
  -> Phase 5 验证与汇报
```

铁律：

- 没找到 root cause 之前不许直接修。

附加机制：

- 编辑会受 freeze 边界约束。
- 防止“顺手把别的也改了”。

## 2.8 `/design-review`

定位：对已存在界面做设计审计并修复。

触发：

- 用户要看页面是否顺眼、是否有 AI slop、需要 polish。

主逻辑：

```text
Setup
  -> 检查 browse 可用
  -> 检查测试框架/截图能力
  -> 打开页面并截图
  -> 做视觉与交互审计
  -> 按问题逐项修
  -> 每次修复后重新验证并对比前后
```

它和 `/plan-design-review` 的区别：

- `plan-design-review` 审计划。
- `design-review` 审真实页面并落代码修。

## 2.9 `/qa`

定位：测试、修复、回归验证的一体化 QA。

触发：

- 用户要测试站点、找 bug 并修。

主逻辑：

```text
Setup
  -> browse 环境检查
  -> 检测项目测试框架，必要时 bootstrap
  -> 根据 tier 设定范围
     - Quick
     - Standard
     - Exhaustive
  -> 执行手工/浏览器 QA
  -> 发现 bug 后原子修复
  -> 为修复补回归测试
  -> 再跑验证
  -> 输出健康度前后对比
```

它是 gstack 最强的闭环 skill 之一，因为它从“看到问题”直接走到“修完并验证”。

## 2.10 `/qa-only`

定位：纯报告模式 QA。

触发：

- 用户只想拿 bug report，不要动代码。

主逻辑：

```text
Setup
  -> 选择模式
     - Diff-aware
     - Full
     - Quick
     - Regression
  -> 用 browse 跑测试流
  -> 截图、记录重现步骤、打严重级别
  -> 输出结构化 QA 报告
```

区别点：

- 不修。
- 不改代码。
- 只交付证据与报告。

## 2.11 `/ship`

定位：发布工程师。

触发：

- 用户要 ship / deploy / push / create PR。

主逻辑：

```text
检测 base branch
  -> 预检 dashboard
  -> 先合并 base branch
  -> 检查/引导测试框架
  -> 跑测试
  -> 检查 diff 与覆盖率
  -> bump VERSION / CHANGELOG
  -> commit / push / create PR
```

它把多个发布前动作串成一个高约束流程，避免“测完了但没同步 main”或“开 PR 前文档没更新”这类问题。

## 2.12 `/document-release`

定位：发版后的文档同步器。

触发：

- 用户要更新文档、同步 README/ARCHITECTURE/CONTRIBUTING 等。

主逻辑：

```text
检测 base branch
  -> 分析 diff
  -> 审计每个关键文档文件
  -> 自动更新明显漂移内容
  -> 对高风险改动询问用户
  -> 统一 CHANGELOG 口吻
  -> 校验文档间一致性
  -> 清理 TODOS
```

本质上是一个“文档对账器”。

## 2.13 `/retro`

定位：周度工程复盘。

触发：

- 用户要 weekly retro / shipped what / engineering retrospective。

主逻辑：

```text
检测默认分支
  -> 收集指定时间窗 commit
  -> 统计作者、文件、增删行、测试占比
  -> 聚合 shipping streak / 质量趋势
  -> 生成人员维度与团队维度复盘
```

特点：

- 不是简单 git log 汇总。
- 有“团队感知”和“趋势感知”。

## 2.14 `/browse`

定位：底层浏览器操作 skill。

触发：

- 用户要打开站点、截图、点击、检查元素、验证部署、跑流程。

主逻辑：

```text
运行 preamble
  -> 先做 browse setup check
  -> 调用 $B 命令
     - 导航
     - 读取
     - 交互
     - 检查
     - 视觉
     - snapshot
     - tabs/server
  -> 返回纯文本观察结果
```

这是大量上层 skill 的基础依赖。

## 2.15 `/setup-browser-cookies`

定位：把真实浏览器登录态带进 headless 会话。

触发：

- 用户要登录受保护页面、导入 cookie、测试认证态页面。

主逻辑：

```text
找到 browse 二进制
  -> 跑 browse setup
  -> 打开 cookie picker UI
  -> 用户选择 domain
  -> 从 Chrome/Arc/Brave/Edge/Comet 导入 cookie
  -> 回到 browse 会话验证
```

意义：

- 把“真实用户会话”嫁接给 AI 测试流。

## 2.16 `/codex`

定位：跨模型第二意见。

触发：

- 用户要 codex review / challenge / consult。

主逻辑：

```text
检测 base branch
  -> 检查 codex binary 是否可用
  -> 自动识别模式
     - Review
     - Challenge
     - Consult
  -> 调用 OpenAI Codex CLI
  -> 汇总结果
  -> 若与 /review 同时存在，可做 cross-model 分析
```

本质是“引入另一个模型视角来补盲区”。

## 2.17 `/gstack-upgrade`

定位：gstack 自更新。

触发：

- 用户说 upgrade gstack / update gstack。
- 或公共 preamble 检测到有升级。

主逻辑：

```text
Step 1 询问用户或根据配置自动升级
  -> Step 2 检测安装类型
     - 全局安装
     - vendored 到项目
  -> Step 3 记录旧版本
  -> Step 4 执行升级
  -> Step 4.5 同步本地 vendored 副本
  -> Step 5 写标记并清缓存
  -> Step 6 展示 What's New
  -> Step 7 回到原 skill 流程
```

这是系统级维护技能，不参与业务流程，但影响所有 skill 的新鲜度。

## 2.18 `/careful`

定位：命令级破坏性操作预警。

触发：

- 用户要求进入安全模式。
- 即将执行高风险 shell 操作。

主逻辑：

```text
拦截 Bash
  -> 匹配危险命令模式
  -> 命中则 ask
  -> 未命中则放行
```

适合：

- prod、共享环境、删库删文件前。

## 2.19 `/freeze`

定位：把修 bug 时的编辑面收窄到一个目录。

触发：

- 用户要求只允许改某个目录。
- 调试时需要防止 agent 越界编辑。

主逻辑：

```text
拦截 Edit/Write
  -> 读取 freeze boundary
  -> 解析目标文件绝对路径
  -> 在边界内则允许
  -> 越界则 deny
```

## 2.20 `/guard`

定位：高风险任务的默认安全模式。

触发：

- 用户要求 full safety / guard mode。

主逻辑：

```text
对 Bash 套 careful
  + 对 Edit/Write 套 freeze
  -> 同时防 bash 破坏和编辑越界
```

## 2.21 `/unfreeze`

定位：解除 freeze 边界。

触发：

- 用户要求取消目录限制。

主逻辑：

```text
清理 freeze 状态
  -> 恢复完整编辑能力
```

## 3. skill 之间的协同关系

### 3.1 规划链

```text
/brainstorm
  -> /plan-ceo-review
  -> /plan-eng-review
  -> /plan-design-review
```

### 3.2 交付链

```text
实现完成
  -> /review
  -> /design-review
  -> /qa 或 /qa-only
  -> /ship
  -> /document-release
  -> /retro
```

### 3.3 能力支撑链

```text
/browse
  -> 支撑 /qa /qa-only /design-review /setup-browser-cookies

/careful /freeze /guard /unfreeze
  -> 支撑高风险执行时的安全边界

/codex
  -> 为 /review 提供异模型补充视角
```

## 4. 总结

这 21 个 skill 不是 21 段互不相干的 prompt，而是一套覆盖完整软件生命周期的角色系统：

- 前段负责定义问题和锁定方向。
- 中段负责实现、评审、设计、调试、测试。
- 后段负责发布、文档、复盘。
- 底层由 `/browse` 提供真实交互能力。
- 侧边由安全 skill 和升级 skill 提供运行保护。

如果把 gstack 看成一个 AI 软件团队，这份 skill 集合就是这支团队的组织结构图和作业手册。
