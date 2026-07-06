---
date: 2026-04-03
topic: spec-first-blog-series-outline
focus: 输出连载博客
source: docs/ideation/2026-04-03-spec-first-blog-series-ideation.md
---

# Spec-First 连载博客大纲

这份文档把前一轮 ideation 收敛成适合直接开写的连载结构。主线保持一致：

**从 Vibe Coding 到工程系统：Spec-First 的完整演进叙事**

目标不是写功能公告，而是把 `spec-first` 讲成一条连续升级的故事线：

- 为什么需要它
- 它怎么搭起来
- 它怎么跑起来
- 它怎么长期可用
- 它怎么越用越强

这条主线现在可以明确放进一个更大的业界语境里：

- `Vibe Coding` 代表“先把东西生成出来”
- `Harness engineering` 代表“先把 Agent 的工作环境、约束和验证回路设计出来”
- `spec-first` 代表“在 harness 思想之上，把跨宿主工作流、治理和知识复利产品化”

## 系列总标题

- `从 Vibe Coding 到工程系统：Spec-First 的完整演进`
- 备选：`从 Vibe Coding 到 Harness Engineering：Spec-First 如何把 AI 编程变成工程系统`
- 备选：`Spec-First：把 AI 编程变成一套工程系统`

## 方法论定位

连载里对 `Harness engineering` 的使用方式，不是把它当成唯一标签，而是把它当成外部参照系：

- 它提供了一个更准确的上位概念：人的价值从“亲手写代码”转向“设计 Agent 能可靠工作的环境”
- 它强调仓库内事实来源、约束编码、验证回路、执行环境设计，这些都和 `spec-first` 当前方向高度一致
- 但 `spec-first` 不止于 harness，它还覆盖 `Stage-0`、多阶段工作流、语言治理、Changelog 治理、知识沉淀和双宿主适配

换句话说，这组连载可以把 `spec-first` 解释为：

- 对 `Vibe Coding` 的升级
- 对 `Harness engineering` 的流程化、产品化落地

## 建议发布顺序

1. 总论
2. Stage-0 篇
3. 冷启动篇
4. 治理篇
5. 可靠性篇
6. 知识闭环篇
7. 双宿主篇

## 文章标题集

### 1. 总论

- `为什么 AI 编程需要一套工程系统，而不只是一个更强的模型`
- 备选：`从 Vibe Coding 到 Harness Engineering：Spec-First 想解决什么`
- 备选：`从 Vibe Coding 到工程系统：Spec-First 想解决什么`

**讲什么**

- AI 编程为什么会“短期爽，长期乱”
- 单次对话为什么不够
- `Harness engineering` 为什么把焦点从“教模型”转到“设计环境”
- `spec-first` 不是 prompt 集合，而是工程工作流系统
- 全系列地图

### 2. Stage-0 篇

- `为什么要先建上下文，再谈执行`
- 备选：`Stage-0 的真正价值：Spec-First 如何把项目理解变成底座`

**讲什么**

- 上下文为什么是 AI 工程的第一性问题
- `spec-graph-bootstrap` 做了什么
- PRD、worker、文件边界为什么重要
- 这一步如何影响后续流程

### 3. 冷启动篇

- `从安装到第一次可用：Spec-First 的冷启动路径`
- 备选：`mcp-setup + doctor + init：把 AI 工作流真正跑起来`

**讲什么**

- 用户第一次接触时最容易卡在哪里
- `doctor` 的意义
- `mcp-setup` 为什么不是安装脚本，而是落地路径
- `init` 和 `clean` 的系统角色

### 4. 治理篇

- `把治理写进工具：语言、Changelog 和版本提醒`
- 备选：`AI 工具如何长期可用，而不是只在第一次好用`

**讲什么**

- `lang-governance` 解决什么
- 为什么 `CHANGELOG.md` 不是形式主义
- `version-reminder` 为什么值得做
- 治理如何降低长期摩擦

### 5. 可靠性篇

- `可靠性不是附加题：Spec-First 为什么必须可恢复、可校验、可回滚`
- 备选：`从 Bash 兼容到一致性校验：工程系统的底线怎么建`

**讲什么**

- Bash 3.2 兼容
- MCP 一致性校验
- 原子写入、失败恢复、回滚
- 为什么“能跑”不等于“可靠”

### 6. 知识闭环篇

- `从修复到资产：Review 到 Compound 的知识复利`
- 备选：`为什么一个好的 AI 工程系统会越用越懂你`

**讲什么**

- review 的作用
- `solutions` 的作用
- `compound` 的作用
- 为什么经验不能停留在聊天记录里

### 7. 双宿主篇

- `Claude Code 和 Codex 如何共享同一套工作流底座`
- 备选：`为什么 Spec-First 不是绑定某个宿主，而是一套可迁移的方法`

**讲什么**

- `spec-*` 和 `spec-*` 的双平台差异
- 为什么要做双宿主
- 同一套流程、同一套治理、同一套知识沉淀
- 为什么这代表一套可迁移的方法

## 每篇固定结构

- 开头：提出一个真实痛点
- 中段：解释 `spec-first` 里怎么解决
- 中后段：落到仓库里的真实工件
- 结尾：引出下一篇

## 推荐写作节奏

1. 先写总论
2. 再写 Stage-0
3. 再写冷启动
4. 再写治理
5. 再写可靠性
6. 再写知识闭环
7. 最后写双宿主收束

## 参考来源

- [Spec-First 连载博客方向](./2026-04-03-spec-first-blog-series-ideation.md)
- [Spec-First 连载首篇详细大纲](./2026-04-03-spec-first-blog-series-article-1-outline.md)
- [Spec-First 连载首篇正文初稿](./2026-04-03-spec-first-blog-series-article-1-draft.md)
- [Harness Engineering 指南](../../../spec-first-doc/业界学习/01-外部文章/2026-04-03-Qoder-工程实践：Harness-Engineering-指南.md)
- OpenAI 官方文章：<https://openai.com/index/harness-engineering/>
