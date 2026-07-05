---
date: 2026-04-28
topic: readme-structural-reorganization
spec_id: 2026-04-28-002-readme-structural-reorganization
---

# README 结构重组

## Problem Frame

`README.md` 和 `README.zh-CN.md` 的现有章节是按添加时间积累而成，顺序不符合读者的认知路径：重要的上手信息被夹在详细参考资料中间，"Current Scope"和"Design Boundary"在头尾重复说明同一件事，"Runtime Assets"的内部计数表格对新用户意义不大。目标是按渐进披露原则重新组织，让读者能沿着"是什么 → 怎么装 → 能干什么 → 如何深入"的路径自然遍历。

---

## Requirements

**结构与章节顺序**

- R1. 两个文件均采用渐进披露顺序：Title + 一句话定位 → Install → Workflow Entry Points → Context & Graph Readiness → CLI Reference → Development → Design Boundary。
- R2. 删除独立的 "Current Scope" 节；其摘要信息合并入标题段落或 Install 节的引言中，不超过 3~4 行。
- R3. "Workflow Entry Points" 表格提升至 Install 之后，成为文档主体前半段的核心内容，以便读者在了解安装方法后立即看到工具能做什么。
- R4. "Context & Graph Readiness" 节（描述 mcp-setup → graph-bootstrap → plan 的准备路径）保留独立节，但位置调整到 Workflow Entry Points 之后、CLI Reference 之前。
- R5. "Design Boundary" 节移至末尾，作为设计哲学收尾，不再夹在其他参考内容之间。

**内容精简**

- R6. "Runtime Assets" 表格保留，但去掉内部分发计数数字（如 "39 skills, 51 agents"）；若需要展示数量，改为通过 `spec-first doctor` 命令查看，不在 README 中硬编码。
- R7. "Documentation" 节合并进 Development 节末尾或作为独立末尾节，内容不变，不再孤立于底部。

**双语同步**

- R8. `README.md`（英文）与 `README.zh-CN.md`（中文）采用相同的新章节结构，两者结构一致。
- R9. 中文版章节标题使用中文，英文版使用英文；各自语言版本的正文和表格文字保持现有翻译对应关系，不引入新内容。

---

## Success Criteria

- 按新顺序阅读 README，第一次接触工具的读者能在不跳跃章节的情况下完成"安装 → 初始化 → 了解工作流入口 → 运行第一个命令"的心智路径。
- 两个文件的章节数量和顺序完全一致。
- 没有重复描述"这是什么"的独立节（合并后只在引言中保留一次）。
- `spec-plan` 或执行者不需要自行决定哪些内容保留/删除，需求文档已经明确了每个现有节的去向。

---

## Scope Boundaries

- 不更改任何章节的实质内容（文字、表格数据、命令示例）—— 只调整结构和位置。
- R6 的精简仅限去除硬编码计数；其余 Runtime Assets 表格内容不改。
- 不新增文档 docs/ 中尚未存在的内容，不引入任何 README 现在没有的章节。
- 不修改 CLAUDE.md、AGENTS.md 或其他治理文件。

---

## Key Decisions

- **方向 A（渐进披露）优于方向 C（最小改动）**：根本结构问题（顺序不对）需要修正，只压缩冗余节并不足够。
- **两个文件同步改**：README.md 和 README.zh-CN.md 是镜像关系，结构不同步会产生维护漂移。
- **Runtime Assets 内部计数不硬编码**：数字随版本变化频繁，靠 `spec-first doctor` 查看比 README 更准确。

---

## Next Steps

-> `spec-plan` 进行结构化实现规划
