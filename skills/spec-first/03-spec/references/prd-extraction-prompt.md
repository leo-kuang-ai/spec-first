# PRD 提取 Prompt 模板

> 用于从需求文档/图片中提取结构化需求信息

---

## 使用方法

1. 在 Claude Code 中上传需求文档（PDF/Word/图片）
2. 复制下方 prompt 发送给 Claude
3. 将 Claude 的输出保存为 `specs/{featureId}/raw-requirement.md`

---

## Prompt 模板

```
请分析这份需求文档，提取以下信息并输出为 Markdown 格式：

---
feature_id: "FSREQ-YYYYMMDD-FEAT-NNN"
source_type: "pdf/docx/png"
source_paths: ["文件名"]
generated_at: "当前时间"
---

## 1. 原始需求摘录

[完整内容摘要，保留所有关键细节，包括：
- 背景与问题陈述
- 目标用户与使用场景
- 核心功能描述
- 数据流程与交互逻辑
- 如果是图片，描述图中的流程/架构/UI 设计]

## 2. 结构化要点

### 业务目标
- 问题陈述:
- 目标用户:
- 使用场景:
- 预期收益:

### 功能边界
- 范围内（In Scope）:
  - [功能 1]
  - [功能 2]
- 范围外（Out of Scope）:
  - [不做的功能 1]

### 约束条件
- 技术约束:
- 业务约束:
- 时间约束:

### 成功标准
- [可量化指标 1]
- [可量化指标 2]

## 3. 待澄清项（自动标注）

[识别所有不明确、模糊、矛盾的地方，格式：]
- [NEEDS CLARIFICATION][BOUNDARY] 问题描述？候选答案 A/B/C
- [NEEDS CLARIFICATION][TERM] 术语"XXX"的定义是什么？
- [NEEDS CLARIFICATION][SEMANTIC] 这里有两种理解：A/B，哪个正确？

[类型说明：
- BOUNDARY: 边界值不明确
- TERM: 术语未定义
- SEMANTIC: 语义多解
- ERROR: 异常处理未定义
- PRIORITY: 优先级冲突
- DEPENDENCY: 外部依赖缺失]

## 4. 关键实体与术语

[列出文档中的关键实体、角色、模块、系统]
- 实体 1: 定义
- 实体 2: 定义

---

**输出要求**：
1. 保持 Markdown 格式
2. 待澄清项必须具体，提供候选答案
3. 如果是图片，详细描述图中的需求信息
4. 保留原文关键细节，不要过度概括
```

---

## 示例输出

见 `prd-extraction-example.md`
