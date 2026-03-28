---
topic: {Topic}
output_file: {Output File Path}
output_date: {YYYY-MM-DD}
output_version: v{n}
source_language: {Source Language}
output_language: {Output Language}
language_detection_basis: {Language Detection Basis}
notes: {Optional Notes}
---

# {Original Document Title}

<!-- 正文必须按源文档原始结构展开，不要重新组织成报告模板 -->
<!-- 保留原标题、标题编号、标题层级、段落顺序、列表关系、表格位置和图文相邻关系 -->
<!-- 一级 / 二级 / 三级标题分别使用 # / ## / ###；更深层级继续按 Markdown 标题深度递进 -->
<!-- 表格必须按 Markdown 标准表格完整还原，保留示例数据、备注、特殊符号和中英文内容 -->
<!-- 图片必须在原文位置内联处理；当图片承载需求信息时，补 ASCII 描述，并在其后提取核心需求点 / 设计要求 / 开发备注 -->

{Original Document Content}

<!-- 参考内联图片块结构（仅在源文档对应位置使用，不要额外汇总到文末） -->

<!--
**图片说明：{Original Caption or Generated Label}**
- 源锚点：`relative/path/to/source-file.ext | locator | optional-sub-locator`
- 可见文字 / OCR：{Visible Text}
- 备注：
  - {Only grounded visible observations}

```text
{ASCII description of layout / flow / screen structure}
```

**核心需求点：**
- {Requirement directly confirmed from the image}

**设计要求：**
- {Design requirement directly confirmed from the image}

**开发备注：**
- {Developer note directly confirmed from the image}
-->

<!-- 仅当确实存在不清晰项时，在文末追加 Clarifications 附录；否则省略 -->

<!--
## 附录：待确认项

| ID | 源锚点 | 问题 | 不清楚原因 | 影响 | 需要确认的内容 |
|----|--------|------|------------|------|----------------|
| C1 | `relative/path/to/source-file.ext \| locator \| optional-sub-locator` | {Issue} | {Why Unclear} | {Impact} | {Needed Confirmation} |
-->
