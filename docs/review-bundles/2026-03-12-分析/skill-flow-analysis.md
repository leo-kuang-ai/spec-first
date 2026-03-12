# Skill 流程分析与优化方向

## 当前 Skill 流程

### Skill 列表（19个）
```
00-first        项目快速认知
00-onboarding   新手引导
01-init         初始化
02-catchup      上下文恢复
03-spec         需求规格
04-design       技术设计
05-research     调研
06-task         任务拆解
07-code         代码实现
08-review       实现审查
10-archive      归档复盘
11-plan         计划加载
12-verify       验收校验
13-orchestrate  编排执行
14-status       状态查询
15-doctor       环境诊断
16-sync         状态同步
17-analyze      一致性分析
18-feature      Feature管理
```

## 问题分析

### 1. Skill 流程问题

**过度碎片化**:
```
用户想法: "我要开发一个功能"

当前流程:
  init → spec → design → task → code → review → verify → archive
  (8个步骤，8个命令)

理想流程:
  create-feature → implement → done
  (3个步骤)
```

**职责重叠**:
- `orchestrate` vs `plan`: 都是编排
- `status` vs `catchup`: 都是查状态
- `verify` vs `review`: 都是检查

### 2. 上面方案的优化方向

**既优化指标，也优化节点**:

#### 优化指标（已讨论）
- 12个 → 3-5个
- 简化计算逻辑
- 降低学习成本

#### 优化节点（更重要）
- 19个 skill → 6-8个
- 合并重复职责
- 简化用户操作

## 建议方案

### 方案1: 合并 Skill（推荐）

```
核心 Skill（6个）:
1. init          初始化项目
2. feature       创建/切换 Feature
3. implement     开发（自动：spec→design→task→code）
4. review        审查（自动：code-review + verify）
5. status        状态查询（合并 catchup）
6. doctor        诊断修复
```

**效果**:
- 用户操作: 8步 → 3步
- 学习成本: 19个命令 → 6个命令
- 自动化: 手动编排 → 自动流转

### 方案2: 分层 Skill

```
用户层（3个）:
- feature new    创建功能
- feature dev    开发功能
- feature done   完成功能

系统层（内部调用）:
- spec, design, task, code, review, verify
```

**效果**:
- 用户只需记3个命令
- 系统自动调用内部 skill
- 保持灵活性


## 对比分析

### 当前流程 vs 优化流程

| 维度 | 当前流程 | 方案1（合并） | 方案2（分层） |
|------|----------|--------------|--------------|
| Skill数量 | 19个 | 6个 | 3个（用户层） |
| 开发步骤 | 8步 | 3步 | 1步 |
| 学习成本 | 高 | 中 | 低 |
| 灵活性 | 高 | 中 | 低 |
| 自动化 | 低 | 高 | 最高 |

### 用户体验对比

**当前流程**:
```bash
spec-first init
spec-first spec
spec-first design
spec-first task
spec-first code
spec-first review
spec-first verify
spec-first archive
```
→ 8个命令，用户需要记住顺序

**方案1（合并）**:
```bash
spec-first init
spec-first implement  # 自动执行 spec→design→task→code
spec-first review     # 自动执行 review→verify
```
→ 3个命令，系统自动流转

**方案2（分层）**:
```bash
spec-first feature dev
```
→ 1个命令，完全自动化

## 核心问题

### 问题1: 节点过多
- 19个 skill = 19个概念
- 用户需要理解每个 skill 的职责
- 需要记住调用顺序

### 问题2: 指标过多
- 12个指标 = 12个检查点
- 每个阶段都有 Gate 检查
- 豁免机制复杂

### 问题3: 两者耦合
```
节点多 → 检查点多 → 指标多 → 豁免复杂
```

## 优化方向

### 优先级1: 优化节点（更重要）

**原因**:
- 节点是用户直接交互的界面
- 节点简化 → 用户体验提升
- 节点减少 → 检查点自然减少

**效果**:
```
19个节点 → 6个节点
→ 检查点减少 60%
→ 指标可以从 12个 → 5个
```

### 优先级2: 优化指标

**原因**:
- 指标是系统内部逻辑
- 用户不直接感知
- 但影响 Gate 通过率

**效果**:
```
12个指标 → 5个指标
→ Gate 检查简化
→ 豁免需求减少
```

## 结论

**上面方案是"优化指标"，但更应该"优化节点"**

建议：
1. 先优化节点（19个 → 6个）
2. 再优化指标（12个 → 5个）
3. 最后简化豁免机制

**节点优化的收益 > 指标优化的收益**

