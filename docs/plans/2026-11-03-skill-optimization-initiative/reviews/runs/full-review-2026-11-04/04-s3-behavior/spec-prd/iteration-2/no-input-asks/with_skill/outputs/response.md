spec-prd 已加载。当前会话没有附带任何需求输入，工作目录里也没有现成的代码库或 PRD 材料（仅 `.claude` 里的技能本身），因此运行在 `input_posture: no-input` 状态，按技能约定必须先问清目标才能进入后续阶段。

**Run 决策卡（当前）**
- `intent`: 待定（取决于你的输入）
- `input_posture: no-input`
- `question_delivery: chat-fallback`（当前工具列表无阻塞式提问工具，采用编号选项并等待回复）
- 边界：本工作流只做存量系统增量的 PRD 级 WHAT/WHY 需求（create/refine/validate），不写实现代码、不做实现计划、不做 0-1 产品探索。

**请选择本次运行的目标**（也可以直接自由输入描述）：

1. **create** —— 你描述一个对现有系统的增量改动（功能/缺陷/策略/流程变化），我基于源码证据澄清后产出 PRD。*推荐，如果你手上有一个想清楚要做什么的改动。*
2. **refine** —— 提供一份已有 PRD / 需求草稿路径（Markdown、会议纪要、聊天记录等均可），我诊断并重写为 PRD 级文档。
3. **validate** —— 提供一份已有 PRD 路径，我只做只读的 planning 就绪检查并出报告，不改文件。
4. **实际是别的阶段** —— 如果是 0-1 新产品探索、实现排期、修 bug、PRD/代码一致性审计，我会按规则 route-out 到对应工作流（如 `spec-brainstorm` / `spec-plan` / `spec-debug`），并明确说明移交目标。

另外请注意：spec-prd 是 brownfield 工作流，目标系统需要真实存在（有仓库/源码可查证）。如果目标代码库在别的路径，请在回复里一并给出仓库位置。
