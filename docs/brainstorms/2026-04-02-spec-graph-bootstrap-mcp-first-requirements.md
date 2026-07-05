---
date: 2026-04-02
topic: spec-graph-bootstrap-mcp-first
type: requirements
status: approved
origin: user-request
---

# spec-graph-bootstrap MCP-first 需求

## Problem Frame

当前 `spec-graph-bootstrap` 在 Phase 1 中同时承担了宿主环境准备和目标项目分析两类职责，导致用户路径不清晰，也让分析模式判断建立在“工具存在”而非“当前可用”之上。结果是：

- 用户不知道是否应该先运行 `spec-mcp-setup`
- `spec-graph-bootstrap` 会在缺少前置环境时继续尝试分析，产生误导性的错误和降级
- 工具未真正就绪时，仍可能被误判为 `Full` 或 `Enhanced` 可用

本次改造要把流程明确为：

`spec-mcp-setup` → 重启 Claude Code → `spec-graph-bootstrap`

其中 `mcp-setup` 负责宿主环境准备，`spec-graph-bootstrap` 负责项目级分析与上下文生成。

## Requirements

**Workflow Gate**
- R1. `spec-graph-bootstrap` 在开始项目分析前，必须先检查 Claude Code 宿主是否已完成 `mcp-setup` 所需的基础准备。
- R2. 如果宿主未完成 `mcp-setup`，`spec-graph-bootstrap` 必须输出明确引导信息，告诉用户先执行 `spec-mcp-setup`，并在输出后立即停止本次 bootstrap。
- R3. 当 `spec-graph-bootstrap` 因缺少 `mcp-setup` 前置条件而停止时，不得继续进入 `Basic` 模式，也不得继续执行任何项目分析、PRD 生成或 worker dispatch。
- R4. `spec-graph-bootstrap` 不再承担“临时补装工具”或“隐式修环境”的职责；前置环境问题统一通过 `mcp-setup` 解决。
- R5. 如果宿主已经完成 `mcp-setup`，但 Claude Code 尚未重启以加载新的 MCP 配置，`spec-graph-bootstrap` 必须明确提示用户先重启 Claude Code，再重新运行 `spec-graph-bootstrap`，并在提示后立即停止本次 bootstrap。

**Setup And Readiness**
- R6. `mcp-setup` 必须成为 `spec-graph-bootstrap` 的标准前置步骤，并在完成时明确提示用户下一步是“重启 Claude Code”后再运行 `spec-graph-bootstrap`。
- R7. `mcp-setup` 的职责边界是宿主级准备，包括依赖、工具安装、MCP 配置和宿主级验证；`spec-graph-bootstrap` 的职责边界是项目级 readiness 检查与上下文生成。
- R8. `spec-graph-bootstrap` 判定“宿主已完成 `mcp-setup`”时，必须依赖一个明确的宿主级验证结果，而不能仅根据命令存在、MCP 配置存在或单个工具已安装来放行。
- R9. `spec-graph-bootstrap` 的分析模式选择必须建立在项目级 readiness 上，而不是仅建立在命令存在、MCP 配置存在或工具已安装上。
- R10. 宿主级前置条件通过后，项目级 probe 失败不得导致整个 bootstrap 被前置门阻断；此类失败应按现有分析模式语义降级处理：优先尝试 `Full`，否则降级为 `Enhanced`，再否则降级为 `Basic`。

**User Guidance**
- R11. 当 `spec-graph-bootstrap` 检测到缺少前置环境或缺少宿主重启时，用户提示必须说明三件事：为什么当前不能继续、应该执行什么命令或动作、完成后下一步是什么。
- R12. 阻断提示应面向当前工作流，避免暴露无关的底层错误细节或让用户自行推断正确顺序。

**Platform Scope**
- R13. 本次 MCP-first 改造只覆盖 Claude Code 工作流：`spec-mcp-setup` → 重启 Claude Code → `spec-graph-bootstrap`。
- R14. Codex 不在本次需求范围内；相关支持可以在后续工作中单独规划，不作为本次改造的交付条件。

## Success Criteria

- 当用户在未完成 `mcp-setup` 的情况下运行 `spec-graph-bootstrap`，系统会明确提示先执行 `spec-mcp-setup`，并立即结束流程。
- 当用户已完成 `mcp-setup` 但尚未重启 Claude Code 时，系统会明确提示先重启，再重新运行 `spec-graph-bootstrap`，并立即结束流程。
- 当用户完成 `mcp-setup` 且重启 Claude Code 后，再运行 `spec-graph-bootstrap`，流程会进入正常的项目级 readiness 检查，而不是再次要求处理宿主级准备。
- 当宿主级前置条件已满足，但 `GitNexus`、`ABCoder` 或 `Serena` 对当前项目不 ready 时，`spec-graph-bootstrap` 会按 `Full → Enhanced → Basic` 的语义降级，而不是把项目级失败误判为宿主级前置失败。
- 用户能够从提示信息中直接理解标准执行顺序，而不需要阅读额外文档或推测工作流关系。
- `spec-graph-bootstrap` 不再尝试在运行中隐式安装、配置或修复宿主级 MCP 环境。

## Scope Boundaries

- 本次只定义工作流顺序、阻断行为、职责边界和用户提示，不展开具体脚本实现细节。
- 本次不重写 `spec-graph-bootstrap` 的 contexts 产物结构、worker 划分、backup/restore 策略或数据库文档格式。
- 本次不要求新增 Codex 版 `mcp-setup` 或 Codex 版 MCP-first 主链。
- 本次不要求在 brainstorm 阶段决定具体的 readiness probe 命令、脚本参数或文件改动位置。

## Key Decisions

- **前置策略：强制阻断**：当宿主未完成 `mcp-setup` 时，`spec-graph-bootstrap` 不允许继续执行，必须先引导用户完成前置步骤。
- **重启策略：强制阻断**：当 `mcp-setup` 已完成但宿主尚未重启时，`spec-graph-bootstrap` 同样不允许继续执行，必须先引导用户重启 Claude Code。
- **主链顺序：MCP-first**：标准入口顺序固定为 `spec-mcp-setup` → 重启 Claude Code → `spec-graph-bootstrap`。
- **平台范围：仅 Claude Code**：本次改造先只覆盖 Claude Code，避免在同一轮需求中混入 Codex 差异。
- **职责边界：宿主级 vs 项目级**：`mcp-setup` 负责宿主环境，`spec-graph-bootstrap` 负责项目分析，二者不再重叠。
- **失败分层：宿主阻断、项目降级**：宿主级前置失败会阻断 bootstrap；项目级工具 readiness 失败不会触发前置门，而是驱动分析模式降级。

## Dependencies / Assumptions

- 假设 `mcp-setup` 仍然是 MCP 工具安装与配置的唯一官方入口。
- 假设 Claude Code 在 MCP 配置发生变更后仍需要重启才能稳定生效。
- 假设 planning 阶段会进一步细化“宿主级验证结果”的具体实现方式，以及“如何实现项目级 readiness probe”。

## Outstanding Questions

### Deferred to Planning
- [Affects R6][Technical] `mcp-setup` 应如何输出标准化的下一步提示，以及是否需要新增专门的宿主级验证阶段。
- [Affects R8][Technical] “宿主级验证结果”应落在什么介质上：脚本返回、配置标记、缓存文件，还是运行时即时校验。
- [Affects R9][Technical] `spec-graph-bootstrap` 的项目级 readiness 检查应如何拆分为 `Serena`、`GitNexus`、`ABCoder` 和数据库路径的独立 probe。
- [Affects R11][Technical] 阻断提示与“请先重启”提示的最终文案和格式是否需要统一为固定模板。

## Next Steps

→ 设计方案：`docs/plans/2026-04-02-spec-graph-bootstrap-mcp-first-design.md`
