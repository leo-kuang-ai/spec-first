---
date: 2026-04-01
topic: readme-optimization
---

# README 优化需求

## Problem Frame

spec-first 的 README 是项目的首要入口，同时服务两类读者：**新用户**（评估是否值得使用）和**贡献者**（了解如何参与）。

当前 README 存在以下核心问题：
- 访客打开页面 30 秒内无法直观感受工具价值——只有抽象架构图，缺乏真实运行演示
- 章节顺序不符合访客决策路径（架构图在演示之前）
- 先决条件分散、不够显眼

## Requirements

**演示内容**
- R1. 在"概述"后、"为什么需要它"前，新增"实际效果 / See It In Action"区块
- R2. 该区块展示真实 terminal 输出，至少覆盖 `spec-first init --claude` + 第一个工作流命令（如 `spec-brainstorm`）的执行过程
- R3. 演示内容采用 GIF 动图或高质量 terminal 截图；若尚未制作，可先以代码块格式的示例输出占位，后续替换

**章节顺序（价值优先重排）**
- R4. README 章节顺序调整为：头部 → 概述 → 实际效果 → 为什么需要它 → 你会得到什么 → 核心工作流 → 架构视图 → 快速开始 → CLI 命令 → 适用场景 → 开源特性 → 文档导航 → 本地开发 → 贡献 → License
- R5. "实际效果"区块不超过 5 行说明文字 + 演示内容，保持简洁

**先决条件明确化**
- R6. 在"快速开始"的"安装 CLI"步骤之前，用独立子章节列出先决条件：Node.js `>=20`、Claude Code 或 Codex 至少一个；当前先决条件作为普通文本散落在安装步骤下，不够显眼

**双语一致性**
- R7. 新增的"实际效果"区块标题和简短说明保持中英双语，与现有风格一致
- R8. 确保所有章节的英文内容与中文内容信息量对等，不出现一方只有一句话而另一方有完整段落的情况

**内容质量**
- R9. 不新增非必要章节（无社区渠道入口、无 Roadmap、无赞助板块）

## Success Criteria

- 新用户打开 README，在不滚动页面的情况下能看到工具的实际运行效果
- 访客在 30 秒内能判断"这是否能解决我的问题"
- 贡献者阅读路径清晰：快速开始 → 本地开发 → 贡献指南

## Scope Boundaries

- 不重构双语策略（保持中英并列）
- 不添加社区渠道（Discord、群组等）
- 不添加 Roadmap 章节
- 不添加赞助/支持板块
- 演示素材（GIF/截图）制作为独立任务，需求文档只定义内容规格

## Key Decisions

- **演示前置而非附后**：访客决策发生在首屏，演示需要出现在"为什么需要它"之前，不能放在快速开始之后
- **占位文本先行**：GIF 素材制作周期较长，先用 terminal 代码块占位，保证结构完整
- **先决条件独立**：从安装步骤正文中提取，升格为独立子节，降低读者遗漏概率

## Dependencies / Assumptions

- 演示 GIF/截图素材需要在真实环境中录制，独立于本次结构调整
- 现有 SVG 资产（`spec-first-overview.svg`、`spec-first-workflow.svg` 等）继续保留

## Outstanding Questions

### Deferred to Planning

- [Affects R2][Needs research] 演示输出最能体现价值的场景是哪一段？建议在实施时先梳理 `spec-first init` + `spec-brainstorm` 的典型输出，再决定截取哪段作为演示内容
- [Affects R3][Technical] GIF 制作工具选择（asciinema、VHS、录屏等）留到素材制作阶段决定

## Next Steps

→ `spec-plan` 进行结构化实施规划
