# spec-first 项目质量深度评估

**评估日期**：2026-08-02  
**评估范围**：架构设计、工程质量、能力现状、短板识别

---

## 一、架构质量评估

### 1.1 核心架构原则

spec-first 基于五项不可违反原则构建：

1. **Light contract**：顶层契约只保留 durable invariants，达到语义充分后停止扩张
2. **Deterministic floor, semantic judgment**：Scripts 强制确定性不变量，LLM 判断语义充分性
3. **Gate the exits, not the thinking**：硬 gate 只守 mutation/verification/source-runtime/handoff/knowledge
4. **Evidence over confidence**：证据必须与 claim 匹配
5. **Bounded autonomy, reversible learning**：有界、可恢复、可停止

**评估结论**：✅ **优秀**

- 这些原则体现了对 AI coding harness 本质的深刻理解
- 与全球 AI coding 趋势高度对齐（可信度 > 自动化）
- 为长期演化提供了清晰的判断框架

### 1.2 Source/Runtime 边界纪律

**边界定义**：

**Source-of-truth**（人工维护）：
- `CLAUDE.md`、`AGENTS.md`（checked-in host 入口）
- `skills/`（workflow 实现）
- `templates/`（host runtime 模板）
- `src/cli/`（CLI 实现）
- `docs/`（文档）
- `package.json`、`CHANGELOG.md`

**Generated runtime**（可重建）：
- `.claude/`、`.codex/`、`.agents/skills/`
- `.cursor/`、`.kiro/`、`.qoder/`、`.opencode/`
- 所有 `spec-*` workflow 入口
- Host-specific 配置文件

**边界强制机制**：
- `spec-first init` 从 source 重新生成 runtime
- `spec-first clean` 移除 generated assets
- `spec-first doctor` 检测 drift
- `.gitignore` 默认排除 generated paths

**评估结论**：✅ **优秀**

- 边界清晰且有工具强制
- 避免了"手改 generated file 被覆盖"的常见陷阱
- 支持多宿主而不产生 source divergence

**改进建议**：
- 增加 `spec-first validate-source-runtime` 命令，检测人工修改 generated files
- 在 doctor 中增加"source 变更但 runtime 未同步"的警告

### 1.3 Deterministic Floor 设计

**确定性责任边界**：

**Scripts/Tools 负责**（可机械判定）：
- 文件路径存在性检查
- Schema 校验
- Hash 计算
- Git 状态读取
- Dependency readiness 检查
- Exit code 和 raw logs

**LLM 负责**（语义判断）：
- 需求是否明确
- 架构方案是否合理
- Review finding 是否成立
- Root cause 分析
- Task 优先级排序

**评估结论**：✅ **优秀**

- 职责分明，避免了"用脚本做架构判断"或"用 LLM 假装校验文件"的反模式
- Deterministic floor 为 LLM 提供可信的事实基础
- 符合"Scripts enforce, LLM decide"的最佳实践

**实际案例**（从 CHANGELOG 2026-08-01）：
```
修复 F-003/F-004：process identity unknown 不粗暴升级为 stale
- 在 async refresh status 增加可注入 identity observer
- 使 live-PID reuse 回归测试不依赖并发环境下的真实 ps/proc/PowerShell
- 确认 deterministic baseline 恢复
```

这显示项目在持续强化 deterministic floor 的可靠性。

### 1.4 Evidence Harness 完整性

**Evidence 分类**：

| Evidence Type | Authority | Requirements |
|---------------|-----------|--------------|
| `confirmed` | 有验证依据的事实 | Source read、test pass、log evidence、schema check |
| `advisory` | 候选信息，需确认 | CodeGraph output、Graphify navigation、MCP suggestions |
| `generated` | 派生产物 | Runtime assets、summaries、计算结果 |
| `degraded` | 降级模式 | 缺少理想证据时的 fallback |

**Provenance tracking**：
- 每个 artifact 标注来源（brainstorm、prd、plan、work）
- Verification evidence 记录实际执行的命令和输出路径
- Review findings 保留 reviewer identity 和 verification 状态

**Freshness management**：
- CodeGraph/Graphify 标注生成时间
- Knowledge solutions 带 invalidation condition
- Cross-session handoff 包含 freshness disclosure

**评估结论**：✅ **优秀**

- Evidence 分类清晰，避免"把 advisory 当 confirmed"
- Provenance tracking 支持可追溯性
- Freshness 机制防止 stale knowledge 误导

**改进建议**：
- 考虑增加 evidence 的"置信度评分"（如 high/medium/low confidence）
- 为 degraded evidence 提供明确的"升级路径"（如何从 degraded 变成 confirmed）

---

## 二、工程质量保障

### 2.1 测试覆盖体系

**测试层次**：

```
Unit Tests (tests/unit/)
  ├─ Shell script unit tests
  └─ Jest unit tests for CLI modules

Smoke Tests (tests/smoke/)
  ├─ CLI help commands
  ├─ Installation paths
  └─ Doctor & init basic flow

Integration Tests (tests/integration/)
  ├─ Workflow-level integration
  ├─ Multi-file coordination
  └─ Contract validation

MCP Setup Tests (npm run test:mcp-setup)
  ├─ Provider installation
  ├─ Runtime projection
  └─ Readiness contracts

Skill Lint (npm run lint:skill-entrypoints)
  ├─ Skill metadata validation
  └─ Entrypoint governance
```

**覆盖率现状**（从 2026-08-01 审计）：
- Owner suites: 4 suites / 82 tests ✅
- Ledger tests: 3/3 ✅
- Complete npm test: passed ✅
- Typecheck: 208 files ✅
- Skill lint: 315 files ✅
- Build: 743 files ✅

**评估结论**：✅ **优秀**

- 分层测试策略清晰
- 覆盖了从 unit 到 integration 的完整链路
- 有专门的 contract validation 测试

**改进建议**：
- 增加 E2E host tests（测试在真实 Claude Code/Codex 环境中的表现）
- 考虑 mutation testing（检验测试的有效性）
- 增加性能回归测试（防止 workflow 变慢）

### 2.2 Contract 验证机制

**Contract 层次**：

1. **Schema contracts**（JSON Schema）
   - `verification-run-summary.v1`
   - `honest-closeout.v1`
   - `spec-work-run-artifact/v2`
   - `workspace-graph-state.v3`

2. **Behavioral contracts**（docs/contracts/）
   - `source-runtime-customization-boundary.md`
   - `workflows/honest-closeout.md`
   - `workflows/worker-dispatch-capability.md`
   - `project-graph-consumption.md`

3. **Governance contracts**
   - Source-of-truth 边界
   - Mutation authority
   - Evidence provenance

**验证方式**：
- Schema validator 自动校验
- Contract tests 检查实现符合性
- Doctor 检查 runtime 健康状态
- Audit reports 定期全面审查

**评估结论**：✅ **优秀**

- 多层次 contract 覆盖了从数据结构到行为语义的完整范围
- 有自动化验证机制
- 定期审计确保 contract 不漂移

**实际案例**（2026-08-01 审计）：
```
F-001: 在 current tree 已降至 874 行并通过 contract
F-002: inventory 为 35 skills/559 files，manifest 校验通过
```

### 2.3 Fresh-Source Eval 机制

**问题背景**：
- Agent/skill prose 变更后，宿主可能缓存旧定义
- 同会话内的 typed-agent/skill 调用可能测试旧内容

**解决方案**：
- 把当前磁盘上的 agent/skill 源文件注入到全新 subagent 的 prompt 中评估
- 或使用 fresh read-only reviewer

**Checklist**（docs/contracts/workflows/fresh-source-eval-checklist.md）：
1. 读取当前磁盘 source
2. 注入到新 subagent
3. 执行评估任务
4. 记录 dispatch 授权状态
5. 不依赖当前会话缓存

**评估结论**：✅ **优秀**（机制先进）⚠️（执行受限）

- 机制设计正确，避免了"测试缓存而非当前代码"的陷阱
- 但执行依赖 helper agents 授权，当前有 3 个用例因未获授权而未完成（F-005）

**改进建议**：
- 建立 fresh-source eval 的自动化 CI 流程（不依赖交互式授权）
- 提供 `--skip-fresh-eval` 选项用于快速迭代
- 记录每次 eval 的 model version 和结果

---

## 三、当前能力盘点

### 3.1 多宿主支持现状

| 宿主 | 支持级别 | 验证状态 | 主要限制 |
|------|----------|----------|----------|
| Claude Code | ✅ Stable | Verified | 无 |
| Codex | ✅ Stable | Verified | 无 |
| Cursor | ⚠️ Preview | Generated runtime only | Loader evidence 不足 |
| Kiro | ⚠️ Preview | Generated runtime only | Loader evidence 不足 |
| Qoder | ⚠️ Preview | Generated runtime only | Loader evidence 不足 |
| OpenCode | ⚠️ Preview | Generated runtime only | Loader evidence 不足 |

**Stable 的定义**：
- Runtime 生成正确 ✅
- Host 成功加载 ✅
- Workflow 可调用 ✅
- Artifact 正确生成 ✅
- 有 journey evidence ✅

**Preview 的限制**：
- Runtime 生成正确 ✅
- Host 加载证据不足 ⚠️
- Workflow 调用未验证 ⚠️
- 缺少 journey tests ❌

**评估结论**：⚠️ **部分兑现**

- 核心宿主（Claude Code、Codex）已验证，质量可信
- Preview 宿主架构就绪，但实际验证不足
- 存在"声称支持"与"证明支持"的差距

**改进建议**（详见解决方案路线图）：
- 建立 tests/e2e-host/ 测试套件
- 为每个 preview 宿主记录 10+ user journeys
- 建立 "Preview → Stable" 的明确 checklist

### 3.2 Workflow 覆盖度

**核心工作流链路**：`Codebase → Spec → Plan → Tasks → Code → Review → Knowledge`

| Workflow | Entry | Artifact | 成熟度 | 验证状态 |
|----------|-------|----------|--------|----------|
| 需求澄清 | `spec-ideate` | `docs/ideation/` | Stable | ✅ |
| 需求文档 | `spec-brainstorm` | `docs/plans/` (requirements-only) | Stable | ✅ |
| 遗留需求 | `spec-prd` | `docs/brainstorms/` | Stable | ✅ |
| 实现计划 | `spec-plan` | `docs/plans/` | Stable | ✅ |
| 任务拆分 | `spec-write-tasks` | `docs/tasks/` | Stable | ✅ |
| 执行工作 | `spec-work` | source changes + evidence | Stable | ✅ |
| 代码审查 | `spec-code-review` | structured findings | Stable | ✅ |
| 文档审查 | `spec-doc-review` | structured findings | Stable | ✅ |
| 调试诊断 | `spec-debug` | debug evidence | Stable | ✅ |
| 知识沉淀 | `spec-compound` | `docs/solutions/` | Stable | ✅ |
| 上下文交接 | `spec-handoff` | `.spec-first/workflows/` | Stable | ✅ |
| 浏览器验证 | `spec-dogfood` | `docs/dogfood-reports/` | Beta | ⚠️ |
| Skill 创作 | `spec-write-skill` | project-owned skill | Beta | ⚠️ |
| 运行时设置 | `spec-runtime-setup` | MCP/helper readiness | Stable | ✅ |

**覆盖度分析**：
- 核心链路（Spec → Plan → Code → Review → Knowledge）完整且稳定 ✅
- 支持性流程（debug、handoff、runtime-setup）齐备 ✅
- 高级能力（dogfood、write-skill）在持续完善中 ⚠️

**评估结论**：✅ **优秀**

- 核心 workflow 覆盖完整
- 每个 workflow 都有明确的 artifact 输出
- 有清晰的成熟度标注

**改进建议**：
- 为 Beta workflow 建立"升级到 Stable"的 checklist
- 增加 workflow 间的"推荐路径"（如"brainstorm 后应该 plan"）
- 考虑增加"快速修复"workflow（小 bug 不需要完整 plan）

### 3.3 验证机制成熟度

**Verification 层次**：

1. **Syntax/Schema 验证**（Deterministic）
   - 文件语法检查 ✅
   - JSON Schema 验证 ✅
   - Git 状态检查 ✅

2. **Test 验证**（Deterministic + Semantic）
   - Unit tests ✅
   - Integration tests ✅
   - Regression tests ✅

3. **Review 验证**（Semantic）
   - Code review findings ✅
   - Doc review findings ✅
   - Independent reviewer ⚠️（依赖授权）

4. **Field 验证**（Outcome）
   - Dogfood reports ⚠️
   - User journey evidence ⚠️
   - Production metrics ❌（未内置）

**Honest Closeout 合同**：
- Verification claim 必须匹配 evidence
- Self-check ≠ independent verification
- 记录实际执行的命令和输出路径

**评估结论**：✅ **良好**（deterministic 层次完善）⚠️（field 层次待加强）

- Deterministic 验证机制完善且可信
- Semantic review 机制就绪，但执行依赖授权
- Field outcome 验证较弱，缺少内置度量

**改进建议**：
- 增加内置的"工作效率度量"（详见解决方案路线图）
- 建立 user journey 的自动化回放和验证
- 考虑 A/B 测试框架（对比使用 spec-first 前后的效率）

---

## 四、短板深度分析

### 4.1 采纳门槛过高

**现状**：
```
Step 1: npm install -g spec-first
Step 2: spec-first doctor
Step 3: spec-first init (选择宿主、确认配置)
Step 4: 重启宿主
Step 5: spec-runtime-setup (安装 MCP/helpers)
Step 6: 理解何时用 brainstorm vs prd vs plan vs work
Step 7: 执行第一个 workflow
Step 8: 检查生成的 artifact
```

**time-to-first-value**：~30-60 分钟（包括阅读文档和理解概念）

**用户流失点**：
1. **Step 3**：init 的交互式确认，用户不确定选项含义
2. **Step 5**：runtime-setup 可能失败（Python/uv 不存在），错误信息不够友好
3. **Step 6**：workflow 选择困惑（"我的任务应该用哪个入口？"）
4. **Step 8**：不知道生成的 artifact 在哪里、应该看什么

**竞品对比**：
- Cursor：安装 IDE → 开始使用，~5 分钟
- GitHub Copilot：安装插件 → 开始使用，~2 分钟
- spec-first：~30-60 分钟 ⚠️

**根本原因**：
1. **概念密度高**：需要理解 source/runtime、deterministic floor、evidence lanes
2. **步骤多**：安装、配置、理解、执行 分离
3. **缺少"快乐路径"**：没有"一键体验"选项
4. **文档假设背景知识**：假设用户理解 AI coding harness 的价值

**影响**：
- 早期用户流失率高
- 只有"已经感受到痛点"的用户才会坚持
- 阻碍了"先试用再深入"的自然路径

**优先级**：🔴 **P0**（影响采纳的最大障碍）

### 4.2 价值外显不足

**现状**：

README 的价值主张：
```
"spec-first helps Claude Code... become easier to trust in real projects:
one-off AI coding conversations become repo-backed requirements, plans,
scoped work, review, and reusable learning."
```

**问题**：
1. **抽象**："easier to trust"、"repo-backed"对新用户较抽象
2. **功能导向而非结果导向**：描述"做什么"多于"解决什么痛点"
3. **缺少量化**：没有"time-to-trusted-change 减少 X%"的数据
4. **缺少对比**：没有明确的 before/after 对比

**用户疑问**（假设）：
- "我为什么需要 repo-backed requirements？现在不也能写代码吗？"
- "可信变更"具体是什么？我如何知道变更是否可信？"
- "这会让我变快还是变慢？"
- "其他人用了有什么效果？"

**竞品对比**：

Cursor 的价值主张：
```
"The AI Code Editor
Build software faster in an editor designed for pair-programming with AI"
→ 清晰、直接、结果导向
```

Devin 的价值主张：
```
"AI teammate that codes, debugs, and deploys for you"
→ 能力清晰、价值直观
```

spec-first 的价值主张：
```
"easier to trust"、"repo-backed"、"reusable learning"
→ 需要理解"为什么信任很重要"才能 appreciate
```

**影响**：
- 潜在用户无法快速判断"这是否解决我的问题"
- 即使安装了，也可能因"看不到明显价值"而放弃
- 难以向团队或管理层"推销"spec-first

**优先级**：🔴 **P0**（影响价值认知和采纳决策）

### 4.3 能力兑现差距

**承诺**（从 README）：
```
"An AI Coding Harness for Claude Code, Codex, Kiro, Qoder, Cursor, and OpenCode."
```

**实际**（从项目分析）：
- Claude Code：✅ Stable
- Codex：✅ Stable
- Cursor：⚠️ Preview（runtime 生成，但 loader evidence 不足）
- Kiro：⚠️ Preview
- Qoder：⚠️ Preview
- OpenCode：⚠️ Preview

**差距**：
- 对外声称"支持 6 个宿主"
- 实际只有 2 个是 verified stable
- 4 个是"架构支持但未验证"

**用户感知风险**：
- Cursor 用户安装后，不确定是否真的可用
- 如果遇到问题，不知道是"自己操作不对"还是"确实不支持"
- "Preview"标签降低信任度

**类比**：
- 这类似于软件标注"支持 Windows/Mac/Linux"
- 但实际只在 Windows 上测试过
- Mac/Linux "理论上应该能用"

**影响**：
- 跨宿主可移植性的价值无法兑现
- 用户期望与实际体验不匹配
- 可能导致负面口碑（"说支持 Cursor 但用不了"）

**优先级**：🟡 **P1**（影响核心价值主张的兑现）

### 4.4 生态建设不足

**现状**：

**用户规模**：
- GitHub stars：~100（估算，基于项目规模）
- npm 周下载：~10-50（估算）
- 活跃贡献者：1-2 人

**社区活动**：
- GitHub Issues：少量内部问题跟踪
- 外部贡献：基本没有
- 讨论渠道：无公开 Discord/Slack/Forum

**成功案例**：
- 无公开的用户成功案例
- 无"谁在使用"列表
- 无第三方博客/视频推荐

**插件/扩展**：
- 无第三方 skill
- 无社区贡献的 workflow
- 无集成示例（CI/CD、监控等）

**对比**（优秀开源项目）：

Langchain：
- 活跃社区、大量第三方集成、成功案例丰富
- 但也经历了早期的"只有核心团队使用"阶段

Cursor：
- 虽然闭源，但有活跃的 Discord 社区
- 大量用户分享使用技巧和成功案例

**影响**：
- 缺少"社会证明"（social proof）
- 潜在用户担心"是否有其他人在用？"
- 难以形成"网络效应"和"增长飞轮"
- 依赖核心维护者，可持续性风险

**优先级**：🟢 **P2-P3**（重要但不紧急，需要先有用户基础）

---

## 五、竞争力分析

### 5.1 核心竞争优势

1. **架构深度**：source/runtime 分离、deterministic floor 是深思熟虑的设计，不易被快速模仿
2. **证据闭环**：完整的 evidence harness 是独特能力，竞品都没有系统性解决
3. **跨宿主可移植**：唯一支持多宿主的 project-owned harness
4. **工程纪律**：完整的契约体系、测试覆盖、审计机制

### 5.2 潜在威胁

1. **宿主原生整合**：Claude Code/Cursor 内置类似能力
   - 缓解：保持"跨宿主"和"project-owned"的差异化
   
2. **Agentic 平台竞争**：Devin/Replit 的端到端自动化
   - 缓解：定位在"可信 harness"而非"autonomous agent"
   
3. **复杂度障碍**：用户因学习成本放弃
   - 缓解：降低采纳门槛（P0 优先级）
   
4. **生态碎片化**：标准快速演进导致落后
   - 缓解：保持对 MCP、AGENTS.md 等标准的跟进

### 5.3 竞争策略建议

1. **聚焦差异化**：持续强化"可信变更"和"跨宿主"的独特价值
2. **降低门槛**：让用户"先用起来，再理解深度"
3. **建立信任**：10 个深度用户案例 > 1000 个浅度试用
4. **拥抱标准**：积极采纳 MCP、AGENTS.md 等新兴标准

---

## 六、总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构设计 | 9/10 | 先进且深思熟虑，符合最佳实践 |
| 工程质量 | 9/10 | 测试完善、契约清晰、审计严格 |
| 核心能力 | 8/10 | Workflow 覆盖完整，验证机制成熟 |
| 多宿主支持 | 6/10 | 架构就绪但验证不足 |
| 用户体验 | 5/10 | 采纳门槛高、价值外显不足 |
| 生态建设 | 3/10 | 用户规模小、社区活动少 |
| **综合评分** | **7/10** | **优秀的技术基础，但需要改善采纳和生态** |

---

## 七、关键建议

### 立即行动

1. **降低采纳门槛**：实现 Golden Path 快速体验
2. **外显价值**：制作 before/after 对比和演示视频
3. **补齐验证**：完成多宿主 loader evidence

### 近期优化

4. **内置度量**：让用户看到量化的效率提升
5. **典型案例**：展示完整的 workflow 链路
6. **建立信任**：收集并发布用户成功案例

### 长期战略

7. **生态建设**：插件市场、贡献者社区
8. **企业采纳**：合规性、可审计性增强
9. **标准引领**：参与 AI coding 标准制定

---

**结论**：spec-first 已经建立了优秀的技术基础和正确的战略方向。当前最关键的是**让这些价值被更多人看到、体验到、信任到**。
