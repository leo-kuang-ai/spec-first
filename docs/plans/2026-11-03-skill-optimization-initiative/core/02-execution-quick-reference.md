# Phase 0 快速参考卡

**用途**：1 页纸快速上手指南  
**适合**：第一次执行 Phase 0 的人员  
**阅读时间**：5 分钟

---

## 🎯 Phase 0 是什么？

**目标**：追踪 11 个真实任务，识别哪些 Skill 需要优化

**不是**：
- ❌ 优化 Skill（那是 Phase 1）
- ❌ 写新代码
- ❌ 主观评价

**是**：
- ✅ 数据收集
- ✅ 客观记录
- ✅ 模式识别

---

## ⏱️ 时间规划

```
Phase -1（试点）：4 小时
  ├── 选择 1 个简单任务
  ├── 完整追踪
  └── 决策是否继续

Phase 0（正式）：44 小时
  ├── 最小样本（5 个任务）：10h
  ├── 标准样本（11 个任务）：18h
  ├── 模式识别：6h
  ├── 多路径评估：4h
  └── Phase 0 报告：2h

总计：48 小时（6 个工作日）
```

---

## 📝 核心任务

### 1. 选择任务（2 小时）

**标准**：
- 5 个历史任务（回顾性）
- 6 个新任务（前瞻性，实时追踪）
- 覆盖 5 种类型：
  - 小功能开发（3 个）
  - 跨模块需求（2 个）
  - 缺陷修复（2 个）
  - PR 反馈处理（2 个）
  - 跨会话续做（2 个）

### 2. 追踪任务（每个 2 小时）

**记录内容**：
- 基本信息（任务描述、时间）
- 流程（需求 → PRD → Plan → Work → Review → 提交）
- 阻力点（信息丢失、重复、验证缺失、衔接断裂）
- Contract/Protocol 检查
- 根因归因（Skill / 模型 / 外部 / 工具）

**格式**：YAML（见示例）

### 3. 分析模式（6 小时）

**统计**：
- 各类阻力点频率
- 根因分布
- Contract/Protocol 合规率

**识别**：
- 高频问题（≥60%）
- 影响面 ≥50% 且导致返工 ≥30% 的 Skill

### 4. 给出建议（4 小时）

**输出**：
- 哪些 Skill 需要优化（优先级排序）
- 是否有其他路径（工具、流程、模型）
- Phase 1 预估投入

---

## 🔑 关键概念

### 阻力点 4 类

1. **信息丢失**：上游已确定，下游未使用
2. **信息重复**：上游已确定，下游又询问
3. **验证缺失**：声称完成，但未验证
4. **衔接断裂**：上游输出与下游输入不匹配

### 根因 4 类

1. **Skill 问题**：Skill 指令不清晰、缺少步骤
2. **模型能力**：模型理解不足、推理能力限制
3. **外部因素**：需求模糊、用户改需求、技术债务
4. **工具链**：缺少测试工具、代码分析工具

### Contract/Protocol

- **Contract**：Skill 的输入/输出约定
- **Protocol**：Skill 间的数据传递约定
- **检查**：输出是否符合 Contract？是否遵守 Protocol？

---

## 📂 输出物

```
phase0-results/
├── task-selection.md（任务选择说明）
├── task-flow-traces/
│   ├── task-01.yaml
│   ├── task-02.yaml
│   └── ... (11 个)
├── friction-pattern-analysis.md（模式分析）
├── contract-protocol-analysis.md（Contract/Protocol 分析）
├── root-cause-attribution.md（根因归因）
├── multi-path-evaluation.md（多路径评估）
└── priority-recommendation.md（优先级建议）
```

---

## 🛠️ 必备工具

```bash
# Git 工具
git log --graph --oneline --since="2 months ago"
git show <commit-hash>

# PR 查看
gh pr view <pr-number>  # GitHub
glab mr view <mr-id>    # GitLab

# 文档编辑
vim / VSCode / 任何 Markdown 编辑器

# YAML 验证
yamllint task-01.yaml
```

---

## ⚠️ 常见陷阱

### 陷阱 1：主观判断

❌ **错误**："我觉得 spec-plan 不好"  
✅ **正确**："spec-plan 在 7/11 个任务中缺少边界条件处理"

### 陷阱 2：简化追踪

❌ **错误**：只记录"有问题"，不记录具体表现  
✅ **正确**：记录"PRD 定义了 5 个边界条件，Plan 只处理了 2 个"

### 陷阱 3：归因错误

❌ **错误**：把模型能力问题归因为 Skill  
✅ **正确**：区分 Skill 可解决 vs 需要模型升级

### 陷阱 4：遗漏 Contract/Protocol 检查

❌ **错误**：只记录流程，不检查 Contract  
✅ **正确**：每个阶段都检查输出是否符合 Contract

---

## 📞 需要帮助？

**先查看**：
- 02-execution-checklist.md（完整执行清单）
- phase0-results/examples/（示例文件）
- 08-skill-contract-protocol.md（Contract/Protocol 定义）

**仍有问题**：
- 联系项目负责人
- 或在项目 Issue 中提问

---

## ✅ 快速检查清单

Phase -1（试点）：
- [ ] 选择 1 个简单任务
- [ ] 完整追踪（2 小时）
- [ ] 评估可行性
- [ ] 决策：继续 / 调整 / 暂停

Phase 0（正式）：
- [ ] 选择 11 个任务（5 历史 + 6 新）
- [ ] 追踪所有任务（每个 2 小时）
- [ ] 模式识别（6 小时）
- [ ] 多路径评估（4 小时）
- [ ] Phase 0 报告（2 小时）

---

**完成 Phase 0 后**：进入 Phase 1 决策或直接启动 Phase 1

**预期收益**：数据驱动的 Skill 优化建议，避免主观猜测

**关键原则**：客观记录 > 主观判断，数据分析 > 经验直觉
