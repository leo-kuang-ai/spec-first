# spec-first 解决方案详细路线图

**制定日期**：2026-08-02  
**目标**：通过系统性解决方案，降低采纳门槛、外显价值、兑现承诺、建立生态

---

## 解决方案总览

| 优先级 | 目标 | 时间线 | 关键方案 |
|--------|------|--------|----------|
| P0 | 降低采纳门槛 | Q1 (0-1月) | Golden Path、渐进披露、Before/After |
| P1 | 外显可信价值 | Q2 (1-3月) | 内置度量、典型案例、多宿主验证 |
| P2 | 兑现跨宿主承诺 | Q3 (3-6月) | Host Matrix、版本化承诺 |
| P3 | 建立生态位 | Q4+ (6+月) | 成功案例库、插件生态 |

---

## P0：降低采纳门槛（Q1，0-1 个月）

### 目标
time-to-first-value 从 30 分钟降至 5 分钟

### 方案 1：Golden Path 快速体验

**问题**：
- 当前需要 8 个步骤才能看到第一个 artifact
- 用户在 Step 3/5/6 容易流失
- 缺少"一键体验"选项

**解决方案**：

实现 `spec-first quickstart` 命令：

```bash
$ spec-first quickstart

🚀 Welcome to spec-first!

Detecting your environment...
✓ Found Claude Code
✓ Git repository detected
✓ Node.js 20.x

Setting up for Claude Code...
✓ Generated runtime assets
✓ Configured MCP providers
✓ Installed helpers

Your first task (or press Enter for demo):
> [用户输入或使用默认]

Running spec-brainstorm...
✓ Generated: docs/plans/2026-08-02-001-quickstart-demo-plan.md

🎉 Success! Your first artifact is ready.

Next steps:
  1. Open: docs/plans/2026-08-02-001-quickstart-demo-plan.md
  2. Run: spec-plan (to create implementation plan)
  3. Learn more: spec-first docs
```

**技术实现**：

```javascript
// src/cli/commands/quickstart.js
async function quickstart(options) {
  // 1. 自动检测环境
  const env = await detectEnvironment();
  
  // 2. 自动 doctor + init + runtime-setup（合并为一个流程）
  await autoSetup(env);
  
  // 3. 提供预置任务或接受用户输入
  const task = options.demo 
    ? "Add unit tests for the main function"
    : await promptTask();
  
  // 4. 在后台自动运行 spec-brainstorm
  const artifact = await runBrainstorm(task);
  
  // 5. 显示成功消息和下一步建议
  showSuccess(artifact);
}
```

**预期成果**：
- 新用户从 `npm install -g spec-first` 到看到第一个 artifact < 5 分钟
- 减少决策点（自动检测宿主、自动配置）
- 提供即时满足感（立即看到可验证的输出）

**工作量**：2-3 周
- Week 1：设计交互流程、实现自动检测
- Week 2：整合 doctor + init + runtime-setup
- Week 3：测试、文档、polishing

---

### 方案 2：渐进式能力披露

**问题**：
- 首次安装时暴露 15+ workflow 入口，用户困惑
- 文档假设用户理解所有概念
- 缺少"学习路径"引导

**解决方案**：

**阶段 1：核心三件套**（首次体验）
```
spec-brainstorm  - 从想法到需求
spec-work        - 执行开发工作
spec-code-review - 审查代码质量
```

**阶段 2：完整工作流**（日常使用）
```
spec-prd         - 处理遗留需求文档
spec-plan        - 创建实现计划
spec-write-tasks - 拆分任务
spec-doc-review  - 审查文档
spec-debug       - 诊断问题
```

**阶段 3：高级特性**（深度使用）
```
spec-handoff     - 跨会话上下文传递
spec-compound    - 沉淀可复用知识
spec-optimize    - 优化 workflow
spec-write-skill - 创作自定义 skill
```

**技术实现**：

1. **首次运行时只暴露阶段 1**
```javascript
// 在 .spec-first/user-state.json 记录用户阶段
{
  "phase": "core",  // core | full | advanced
  "workflows_used": ["brainstorm", "work"],
  "total_runs": 5
}
```

2. **自动升级触发**
```javascript
// 当用户使用核心 workflow 5+ 次后
if (state.total_runs >= 5 && state.phase === 'core') {
  console.log(`
    🎉 You've mastered the basics! 
    
    Ready for more? Try:
      spec-plan        - Create detailed implementation plans
      spec-write-tasks - Split work into manageable tasks
      spec-debug       - Diagnose issues systematically
    
    Run 'spec-first unlock-full' to enable all workflows.
  `);
}
```

3. **在每个 artifact 末尾添加"下一步建议"**
```markdown
---

## 下一步建议

✅ 已完成：需求文档（brainstorm）

建议接下来：
1. 创建实现计划：在当前 host 会话运行 `spec-plan`
2. 或直接开始工作：运行 `spec-work` 并引用此 plan

💡 提示：完成 5 个 workflow 后可解锁高级特性
```

**预期成果**：
- 降低初始认知负担（3 个入口 vs 15 个入口）
- 用户按需学习，而非预先学习所有概念
- 建立"进阶感"和成就感

**工作量**：1-2 周
- Week 1：设计阶段机制、实现 unlock 逻辑
- Week 2：更新文档、添加引导提示

---

### 方案 3：Before/After 对比展示

**问题**：
- "可信变更"价值抽象，难以直观理解
- 缺少具体场景的对比
- 潜在用户无法快速判断是否适合自己

**解决方案**：

**对比表格**（README 中增加）：

| 场景 | 没有 spec-first | 使用 spec-first | 价值 |
|------|----------------|-----------------|------|
| **需求变更** | 对话窗口关闭后，需求和架构决策消失，下次从零开始 | 需求文档留存在 `docs/plans/`，带决策理由和 trade-offs | 知识不丢失，决策可追溯 |
| **代码审查** | 只能看 diff，不知道"为什么这样改"、"考虑了哪些方案" | 有完整的 plan、task、verification evidence 链路 | 审查效率提升 50%+ |
| **Bug 修复** | 修复后没有记录，下次可能重犯；解决方案散落在聊天记录中 | 诊断过程、root cause、验证方法记录在 `docs/solutions/` | 避免重复调试 |
| **跨会话工作** | 每次新会话都要重新解释上下文，agent 失忆 | `spec-handoff` 保存结构化上下文，下次会话直接继续 | 减少 30% 上下文重建时间 |
| **团队协作** | AI 生成的代码缺少上下文，reviewer 不知道从何审起 | 每个变更都有 spec → plan → task → review 的证据链 | 团队信任度提升 |
| **验证正确性** | Agent 说"测试通过"，但无法确认 | 有 verification-run-summary 记录实际执行的命令和输出 | 可信度提升，返工减少 |

**2 分钟演示视频脚本**：

```
[0:00-0:15] 问题：AI 生成代码很快，但如何确保可信？
[0:15-0:30] 场景 1：没有 spec-first
  - 在 Claude Code 中快速生成代码
  - 对话关闭后，决策消失
  - 下次需求变更时，不知道为什么这样设计
  
[0:30-1:00] 场景 2：使用 spec-first
  - 同样的任务，先 spec-brainstorm
  - 生成可追溯的需求文档
  - spec-plan 生成实现计划
  - spec-work 执行并记录 verification evidence
  - spec-code-review 结构化审查
  
[1:00-1:30] 展示 artifacts
  - docs/plans/xxx-plan.md（需求 + 决策）
  - docs/tasks/xxx-tasks.md（可执行任务）
  - verification-run-summary.json（验证证据）
  - docs/solutions/xxx.md（可复用知识）
  
[1:30-2:00] 总结
  - 不只是代码，是可信变更
  - 不只是快速，是可追溯
  - 不只是个人，是团队可复用
  - 开始使用：npm install -g spec-first
```

**真实案例截图**（脱敏后）：

示例 1：需求文档
```markdown
# 用户认证系统实现需求

## 决策记录

### 为什么选择 JWT 而非 Session？
- **Trade-off**：无状态 vs 可撤销性
- **选择 JWT 的原因**：
  1. 微服务架构，避免共享 session 存储
  2. 前端需要离线工作能力
  3. 通过 refresh token 机制解决撤销问题
- **风险缓解**：
  - 短过期时间（15 分钟）
  - Refresh token 存储在 Redis
  - 记录 token 使用审计日志
```

示例 2：验证证据
```json
{
  "verification_type": "test_suite",
  "commands": [
    "npm test -- --coverage",
    "npm run test:integration"
  ],
  "results": {
    "unit_tests": "47/47 passed",
    "integration_tests": "12/12 passed",
    "coverage": "92.3%"
  },
  "evidence_path": ".spec-first/workflows/2026-08-02-001/test-output.log"
}
```

**预期成果**：
- 价值从抽象变具体
- 潜在用户快速判断"这解决了我的痛点"
- 提供可分享的营销素材

**工作量**：1 周
- Day 1-2：制作对比表格和文案
- Day 3-4：录制演示视频
- Day 5：收集和脱敏真实案例

---

## P1：外显可信变更价值（Q2，1-3 个月）

### 目标
让用户可观察、可量化地感受到效率提升

### 方案 4：内置轻量度量

**问题**：
- 用户无法回答"使用 spec-first 后效率提升了多少？"
- 缺少可观察的成功指标
- 难以向团队或管理层证明价值

**解决方案**：

**度量维度**：

```javascript
// .spec-first/metrics/summary.json
{
  "period": "2026-08",
  "workflows": {
    "total_runs": 45,
    "by_type": {
      "brainstorm": 12,
      "plan": 10,
      "work": 15,
      "review": 8
    }
  },
  "artifacts": {
    "total": 38,
    "by_type": {
      "plans": 12,
      "tasks": 10,
      "solutions": 5,
      "reviews": 11
    }
  },
  "verification": {
    "total_claims": 15,
    "with_evidence": 14,
    "pass_rate": "93.3%"
  },
  "knowledge": {
    "solutions_created": 5,
    "solutions_reused": 3
  },
  "efficiency": {
    "avg_workflow_time": "8.5min",
    "review_finding_density": "2.1 per 100 lines",
    "context_reuse_rate": "42%"
  }
}
```

**CLI 命令**：

```bash
$ spec-first stats

📊 spec-first 使用统计（本月）

工作流执行：
  ✓ 45 次 workflow 运行
  ✓ 38 个可验证 artifact
  ✓ 15 个带证据的变更

质量指标：
  ✓ 93.3% verification 通过率
  ✓ 2.1 findings per 100 lines（行业平均 5.2）
  ✓ 5 个可复用 solutions

效率提升：
  ✓ 42% 上下文复用率
  ✓ 平均 workflow 时间：8.5 分钟
  ✓ 知识复用节省约 3.2 小时

💡 提示：运行 'spec-first stats --detailed' 查看详细报告
```

**可视化 Dashboard**（可选，终端 UI）：

```
┌─────────────────────────────────────────────────────┐
│ spec-first Monthly Dashboard                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Workflows  ████████████████░░░░░░░░  45 / 60 goal │
│ Artifacts  ██████████████████████░░  38 / 40       │
│ Solutions  ███████░░░░░░░░░░░░░░░░░   5 / 15       │
│                                                     │
│ Verification Pass Rate:  93.3% ↑                   │
│ Review Finding Density:   2.1  ↓                   │
│ Context Reuse Rate:      42.0% ↑                   │
│                                                     │
│ 🎯 This month you achieved "Trusted Velocity"      │
│    badge for maintaining >90% verification rate!   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**技术实现**：

```javascript
// 在每个 workflow 完成后自动记录
async function recordMetrics(workflow, artifact, duration) {
  const metrics = await loadMetrics();
  metrics.workflows.total_runs++;
  metrics.workflows.by_type[workflow]++;
  metrics.efficiency.total_time += duration;
  await saveMetrics(metrics);
}

// 定期生成趋势报告
async function generateTrendReport() {
  const current = await loadMetrics('current');
  const previous = await loadMetrics('previous');
  return {
    workflow_increase: calculateGrowth(current, previous),
    quality_trend: calculateQualityTrend(current, previous)
  };
}
```

**预期成果**：
- 用户可以量化观察到"我用 spec-first 后，review finding 密度下降了 60%"
- 建立正向反馈循环："我用得越多，效率越高"
- 提供向团队/管理层汇报的数据支持

**工作量**：3-4 周
- Week 1：设计度量维度和数据结构
- Week 2：实现数据收集和存储
- Week 3：实现 stats 命令和报告生成
- Week 4：测试、文档、可视化优化

---

### 方案 5：典型场景完整演示

**问题**：
- 新用户不知道"完整的 workflow 链路"是什么样的
- 缺少"从需求到代码到知识"的端到端示例
- 文档多为概念解释，缺少实操指南

**解决方案**：

在 `docs/examples/` 提供 3-5 个端到端案例：

**案例 1：修复 TypeScript 类型错误**

```
docs/examples/01-fix-type-error/
  ├── README.md（案例说明）
  ├── scenario.md（初始场景描述）
  ├── artifacts/
  │   ├── 01-brainstorm.md
  │   ├── 02-plan.md
  │   ├── 03-work-evidence.json
  │   ├── 04-code-review.md
  │   └── 05-solution.md
  └── replay.sh（自动重放脚本）
```

**README.md 内容**：

```markdown
# 案例 1：修复 TypeScript 类型错误

## 场景
用户报告：调用 `getUserProfile()` 时 TypeScript 报错
"Property 'email' does not exist on type 'User'"

## 完整 Workflow

### Step 1: 理解问题（spec-brainstorm）
- 输入：错误信息和相关代码路径
- 输出：`artifacts/01-brainstorm.md`
- 关键决策：确认是类型定义不匹配，而非运行时错误

### Step 2: 制定修复计划（spec-plan）
- 输入：brainstorm 文档
- 输出：`artifacts/02-plan.md`
- 实现方案：
  1. 更新 User 类型定义
  2. 检查所有使用 User 的地方
  3. 添加测试覆盖

### Step 3: 执行修复（spec-work）
- 输入：plan 文档
- 代码变更：src/types/user.ts, src/services/user-service.ts
- 验证：npm test 通过
- 输出：`artifacts/03-work-evidence.json`

### Step 4: 代码审查（spec-code-review）
- 审查发现：
  - ✅ 类型定义完整
  - ⚠️ 缺少 null 处理
  - ✅ 测试覆盖充分
- 输出：`artifacts/04-code-review.md`

### Step 5: 沉淀知识（spec-compound）
- 可复用经验：
  - TypeScript 类型不匹配的诊断方法
  - User 类型的标准字段列表
  - 类型变更的测试 checklist
- 输出：`artifacts/05-solution.md`

## 关键学习

1. **完整证据链**：从问题 → 分析 → 方案 → 实现 → 验证 → 知识
2. **可追溯决策**：为什么选择方案 A 而非方案 B
3. **可复用知识**：下次遇到类似问题，直接参考 solution

## 自己尝试

运行 `./replay.sh` 会在你的测试仓库中重现此案例。
```

**案例 2：实现新 API Endpoint**

```markdown
# 案例 2：实现 POST /api/users API

完整链路：
spec-prd（处理产品需求）
  → spec-plan（技术方案）
  → spec-write-tasks（任务拆分）
  → spec-work（实现）
  → spec-code-review（审查）
  → spec-dogfood（手动测试）

重点展示：
- 如何从模糊的产品需求提取清晰的技术 spec
- 如何拆分复杂任务
- 如何验证 API 正确性（单元测试 + 集成测试 + 手动测试）
```

**案例 3：重构遗留模块**

```markdown
# 案例 3：重构 Payment 模块

完整链路：
spec-doc-review（审查现有代码）
  → spec-plan（重构方案）
  → spec-work（增量重构）
  → spec-code-review（验证没有破坏现有功能）

重点展示：
- 如何处理没有文档的遗留代码
- 如何设计安全的重构路径
- 如何验证行为等价性
```

**Replay 脚本**：

```bash
#!/bin/bash
# replay.sh - 在测试仓库中重现案例

echo "🎬 Replaying: Fix TypeScript Type Error"

# 1. 设置测试环境
mkdir -p /tmp/spec-first-example-01
cd /tmp/spec-first-example-01
git init

# 2. 创建初始代码（有问题的版本）
cat > src/types/user.ts << 'EOF'
export interface User {
  id: string;
  name: string;
  // email 字段缺失
}
EOF

# 3. 复制 artifacts
cp -r artifacts/ docs/

# 4. 显示每个 artifact 并解释
cat docs/artifacts/01-brainstorm.md
echo "按 Enter 继续..."
read

cat docs/artifacts/02-plan.md
echo "按 Enter 继续..."
read

# ... 依次展示所有 artifacts

echo "✅ Replay 完成！查看 docs/artifacts/ 了解完整链路"
```

**预期成果**：
- 新用户可以"观察"完整流程再动手
- 降低"不知道该怎么用"的认知负担
- 提供可分享的教学素材

**工作量**：2-3 周
- Week 1：设计 3 个典型案例
- Week 2：制作完整 artifacts（基于真实项目脱敏）
- Week 3：编写说明、replay 脚本、测试

---

### 方案 6：多宿主验证矩阵

**问题**：
- 4 个宿主（Cursor/Kiro/Qoder/OpenCode）标注为 preview
- 缺少实际验证证据
- 用户不确定是否真的可用

**解决方案**：

**Host Support Matrix**（README 中增加）：

| 宿主 | 状态 | Runtime生成 | Loader验证 | Workflows | User Journeys | 限制 |
|------|------|------------|-----------|-----------|---------------|------|
| Claude Code | ✅ Stable | ✅ | ✅ | 15/15 | 20+ | 无 |
| Codex | ✅ Stable | ✅ | ✅ | 15/15 | 15+ | 无 |
| Cursor | ⚠️ Beta | ✅ | ⚠️ | 12/15 | 5 | Rules 交互待验证 |
| Kiro | ⚠️ Beta | ✅ | ⚠️ | 10/15 | 3 | Specs 集成待验证 |
| Qoder | ⚠️ Alpha | ✅ | ❌ | 8/15 | 1 | Hooks 机制待确认 |
| OpenCode | ⚠️ Alpha | ✅ | ❌ | 8/15 | 1 | Loader 证据不足 |

**状态定义**：
- ✅ Stable：完整验证，可生产使用
- ⚠️ Beta：核心功能验证，部分限制
- ⚠️ Alpha：基础功能验证，限制较多
- ❌ Experimental：架构就绪，未验证

**E2E Host Tests**：

```javascript
// tests/e2e-host/cursor/test-workflow-loading.js
describe('Cursor Host Support', () => {
  beforeEach(async () => {
    await setupCursorTestEnvironment();
  });

  test('Runtime generation creates correct skill files', async () => {
    await runCommand('spec-first init --cursor -y');
    
    expect('.cursor/skills/spec-brainstorm/').toExist();
    expect('.cursor/skills/spec-plan/').toExist();
    // ... 验证所有 skills
  });

  test('Cursor can discover and load skills', async () => {
    // 这需要实际启动 Cursor 或使用其 API
    const skills = await queryCursorSkills();
    expect(skills).toInclude('spec-brainstorm');
  });

  test('spec-brainstorm workflow produces valid artifact', async () => {
    // 在 Cursor 中模拟运行 spec-brainstorm
    const result = await runInCursor('spec-brainstorm "test task"');
    expect(result.artifact).toExist();
    expect(result.artifact).toMatchSchema(PLAN_SCHEMA);
  });
});
```

**User Journey Tests**：

```javascript
// tests/e2e-host/cursor/journey-01-simple-feature.js
describe('Journey: Simple Feature Implementation in Cursor', () => {
  test('Complete workflow: brainstorm → plan → work → review', async () => {
    // 1. Brainstorm
    await cursorSession.run('spec-brainstorm "Add login button"');
    const plan = await readArtifact('docs/plans/...');
    expect(plan).toContain('login button');

    // 2. Plan
    await cursorSession.run('spec-plan');
    const detailedPlan = await readArtifact('docs/plans/...');
    expect(detailedPlan).toContain('implementation steps');

    // 3. Work
    await cursorSession.run('spec-work');
    const changes = await git.diff();
    expect(changes).toInclude('LoginButton.tsx');

    // 4. Review
    await cursorSession.run('spec-code-review');
    const review = await readArtifact('docs/reviews/...');
    expect(review).toHaveProperty('findings');
  });
});
```

**验证报告**：

```markdown
# Cursor Support Verification Report

**Date**: 2026-08-15
**Version**: spec-first@1.14.0, Cursor@0.41.0

## Test Results

### Runtime Generation ✅
- All skills generated correctly
- MCP config written to .cursor/mcp.json
- Rules pointer created at .cursor/rules/spec-first.mdc

### Loader Verification ⚠️
- Skills appear in Cursor UI: ✅ (confirmed via screenshot)
- Skills are invocable: ⚠️ (12/15 workflows tested)
- Untested workflows: spec-optimize, spec-decompose, spec-lfg

### Workflow Coverage
- spec-brainstorm: ✅ (3 user journeys)
- spec-plan: ✅ (2 user journeys)
- spec-work: ⚠️ (1 user journey, mutation不足)
- spec-code-review: ✅ (2 user journeys)
- spec-doc-review: ✅ (1 user journey)

### Known Limitations
1. Cursor native rules 优先级高于 spec-first，可能产生冲突
2. MCP user-scope 需要显式 --user-scope 标志
3. Browser helper 在 Cursor 中未测试

### Upgrade Path to Stable
- [ ] 完成所有 15 个 workflows 的至少 1 次 user journey
- [ ] 解决 rules 冲突问题
- [ ] 记录 10+ 真实用户案例
- [ ] 建立 Cursor-specific troubleshooting 文档
```

**预期成果**：
- 从"声称支持"变成"证明支持"
- 用户可以根据 matrix 选择合适的宿主
- 建立"升级到 Stable"的明确路径

**工作量**：4-6 周
- Week 1-2：建立 E2E 测试框架
- Week 3-4：完成 Cursor 和 Kiro 的完整验证
- Week 5-6：完成 Qoder 和 OpenCode 的初步验证
- 持续：收集用户 journey 证据

---

## P2：兑现跨宿主承诺（Q3，3-6 个月）

### 方案 7：Host Support Matrix 持续维护

**解决方案**：

1. **公开 matrix，定期更新**
2. **为每个宿主建立专属文档**
3. **建立用户反馈渠道**

**工作量**：持续，每月 2-3 天

---

### 方案 8：版本化兑现承诺

**解决方案**：

在 CHANGELOG 和 Release Notes 中明确标注：
- 哪些能力从 aspirational → confirmed
- 哪些 preview → stable
- 每个版本的"能力兑现率"

**工作量**：持续，每次发版 1 天

---

## P3：建立生态位（Q4+，6+ 个月）

### 方案 9：用户成功案例库

**解决方案**：

```
docs/case-studies/
  ├── README.md
  ├── 01-startup-mvp-velocity.md
  ├── 02-enterprise-audit-trail.md
  ├── 03-open-source-pr-review.md
  └── template.md
```

**工作量**：持续，每月收集 1-2 个案例

---

### 方案 10：贡献者与插件生态

**解决方案**：

1. **Good First Issues 标签**
2. **贡献者指南**
3. **Skill 模板和发布渠道**
4. **每月 office hours**

**工作量**：6+ 个月，需要持续投入

---

## 实施优先级总结

**立即行动（本周）**：
1. Golden Path 设计
2. Before/After 对比表格
3. 识别典型案例

**近期推进（本月）**：
4. 完成 quickstart 命令
5. 录制演示视频
6. 启动多宿主验证

**持续优化**：
7. 内置度量
8. 案例库
9. 生态建设

---

**下一步**：制定详细的实施计划和资源分配。
