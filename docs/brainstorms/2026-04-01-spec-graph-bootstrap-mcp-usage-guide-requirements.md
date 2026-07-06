---
date: 2026-04-01
topic: spec-graph-bootstrap-mcp-usage-guide
---

# spec-graph-bootstrap MCP 工具使用指引补充

## Problem Frame

spec-graph-bootstrap 从 Trellis 移植时简化了 MCP 工具使用指引。当前 SKILL.md 的 Prerequisites 节只列出工具名称，没有告诉外部开发者：
- 如何安装这些工具
- 如何使用这些工具
- 工具调用的具体示例

这导致外部开发者无法启用 Full/Enhanced 模式，spec-graph-bootstrap 只能在 Basic 模式运行，分析深度和产物质量大打折扣。

现有 mcp-setup skill 已解决"安装"问题，但 spec-graph-bootstrap 需要补充"使用"指引，形成完整的"安装 → 使用"路径。

---

## Requirements

**Prerequisites 节补充（R1-R3）**

- R1. 在 Prerequisites 节第 4 条后新增"MCP Tools Setup"小节，引导用户使用 `spec-mcp-setup quick` 一键安装所需工具，并说明安装后需重启 Claude Code
- R2. 在"MCP Tools Setup"小节后新增"Tool Usage Guide"小节，补充 GitNexus、ABCoder、Serena 三类工具的使用示例，包括：常用工具调用格式、典型使用场景、推荐工作流
- R3. 工具使用示例应与 `references/prd-template.md` 中的"Tools Available"节保持一致（如果 prd-template 已补充工具示例的话）

**内容要求（R4-R5）**

- R4. GitNexus 示例覆盖：`gitnexus_query`（查找执行流）、`gitnexus_context`（360° 符号视图）、`gitnexus_cypher`（图查询）
- R5. ABCoder 示例覆盖：4 层钻取模式（`list_repos` → `get_repo_structure` → `get_file_structure` → `get_ast_node`）
- R6. Serena 示例覆盖：`get_symbols_overview`（文件结构）、`find_symbol`（定位符号）、`search_for_pattern`（模式搜索）

---

## Success Criteria

- 外部开发者阅读 Prerequisites 节后，知道如何安装 MCP 工具（通过 `spec-mcp-setup`）
- 外部开发者阅读 Tool Usage Guide 后，知道如何手动调用这些工具进行代码分析
- spec-graph-bootstrap 的工具使用指引与 prd-template 中的工具说明保持一致

---

## Scope Boundaries

- 不修改 mcp-setup skill 的内容（安装逻辑已完善）
- 不修改 spec-graph-bootstrap 的执行逻辑（Phase 1/2/3 流程不变）
- 不创建独立的 `references/mcp-usage-guide.md`（直接在 SKILL.md 中补充）
- 工具使用指引仅作为参考，不强制 worker 必须使用这些工具

---

## Key Decisions

- **方案选择**：采用方案A（在 SKILL.md 中补充 + 引用 mcp-setup），而非方案B（创建独立 references 文件）
  - 理由：维护成本低，用户路径清晰（`spec-mcp-setup` → 重启 → `spec-graph-bootstrap`）
- **内容深度**：提供调用示例和典型场景，不展开完整教程
  - 理由：SKILL.md 是执行指引，不是工具手册；详细文档由各工具官方提供

---

## Next Steps

→ `spec-plan` for structured implementation planning
