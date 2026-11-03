# Skill 优化方案 v2：质量导向的务实路径

日期：2026-11-03。类型：advisory + execution。状态：Phase 0 可立即启动；Phase 1+ 需要 Phase 0 结果指导。

本文件是对 `2026-11-03-skill-optimization-official-practices.md` 的务实化调整，基于**「打造高质量的研发流程 skill，帮助研发高质量完成需求开发」**这一最终目标。

---

## 最终目标与价值排序

### 最终目标

**打造高质量的研发流程 skill，帮助研发高质量完成需求开发。**

### 价值排序

| 优先级 | 价值维度 | 度量指标 | 不可牺牲项 |
|---|---|---|---|
| **P0** | **任务质量** | 正确性、完整性、可维护性 | 授权边界、验证诚实性、source/runtime 纪律 |
| **P1** | **研发效率** | 减少返工、加快交付、降低认知负担 | 必要的验证步骤 |
| **P2** | **资源成本** | Token、时间、费用 | 前两者 |

**核心原则**：
- 质量问题不能用效率或成本改善抵消
- 效率优化必须保持或提升质量
- 成本优化是质量和效率保持前提下的附加收益

---

## 核心调整

### 原方案的优势
- ✅ 优化方向与官方最佳实践对齐（选、读、弹、证）
- ✅ 质量优先（关键回归零容忍）
- ✅ 证据边界清晰（observed/proxy/unavailable）
- ✅ 合法的终止条件（no-opportunity、pending-evidence）

### 原方案的不足
- ⚠️ 实验设计过于严格（A/B、holdout、judge 校准对所有项目都要求）
- ⚠️ 缺少快速验证路径（从调查到推广周期过长）
- ⚠️ 忽略用户感知（优先级基于理论完备性，而非真实痛点）
- ⚠️ 单 Skill 视角（缺少跨 Skill 协同优化）

### v2 的调整

| 方面 | 原方案 | v2 调整 |
|---|---|---|
| **启动方式** | 直接进入 U2（基线采集） | Phase 0：用户痛点调研 + 观察性研究 |
| **优先级** | O01-O12 按理论顺序 | 基于痛点重排：P0（入口）、P1（高频）、P2（质量债） |
| **验证强度** | 所有项目都要 A/B 测试 | 按影响面分级：观察性 → 对照 → A/B |
| **推广门** | 全部通过才推广 | 增加"试用期"：5-20% 改善可观察 |
| **优化范围** | 12 个单 Skill | 增加 O13-O14：跨 Skill 协同 |

**权衡逻辑**：
- 保留严格的推广门（质量零容忍）
- 但降低调查阶段的启动成本
- 优先解决用户真实痛点，而非理论完备性

---

## Phase 0: 用户痛点调研与快速验证

### 目标

**在不运行付费实验的前提下，回答三个问题：**
1. 用户当前最痛的是什么？
2. 哪些 Skill 有明显的优化机会？
3. O01-O12 的优先级应该如何调整？

### 方法

#### 步骤 0.1：日志分析（2 小时）

```bash
# 分析最近 50 次 spec-first 使用（如果有日志）
# 如果没有集中日志，分析 Git 历史中的 workflow artifact

cd /Users/kuang/xiaobu/spec-first

# 统计每个 Skill 的调用频率
find .spec-first/workflows -name "*.yaml" -o -name "*.json" | \
  xargs grep -h "skill:" | sort | uniq -c | sort -rn > /tmp/skill-usage.txt

# 统计失败的 workflow
find docs/validation docs/ideation docs/plans -name "*.md" | \
  xargs grep -l "失败\|回归\|阻塞" | wc -l

# 统计平均任务时长（如果有记录）
# ...
```

**输出**：`docs/research/phase0-usage-analysis.md`

**关键指标**：
- 调用频率 Top 5 Skill
- 失败率 Top 3 Skill
- 用户反馈提到的痛点

#### 步骤 0.2：源码健康度检查（4 小时）

```bash
# 检查每个 Skill 的复杂度
for skill in skills/spec-*/SKILL.md; do
  echo "$skill: $(wc -l < "$skill") lines, $(find $(dirname "$skill")/references -name "*.md" 2>/dev/null | wc -l) refs"
done | sort -t: -k2 -rn > /tmp/skill-complexity.txt

# 检查 Skill 之间的依赖
grep -r "spec-.*\b" skills/*/SKILL.md | \
  grep -E "调用|invoke|dispatch" | \
  cut -d: -f1,2 > /tmp/skill-dependencies.txt

# 检查未覆盖的边界
grep -r "TODO\|FIXME\|待.*\|已知问题" skills/*/SKILL.md > /tmp/skill-todos.txt
```

**输出**：`docs/research/phase0-health-check.md`

**关键发现**：
- 最复杂的 3 个 Skill（行数 + references 数）
- 依赖最多的 Skill（被调用次数）
- 已知问题数量

#### 步骤 0.3：用户访谈（可选，6 小时）

如果有活跃用户，访谈 3-5 人：

**问题清单**：
1. 你最常用哪 3 个 Skill？
2. 哪个 Skill 让你觉得慢或繁琐？
3. 有没有遇到过误触发或反复转交？
4. 有没有遇到过"明明授权了但还反复问"的情况？
5. 有没有遇到过"说完成了但实际没完成"的情况？

**输出**：`docs/research/phase0-user-interviews.md`

#### 步骤 0.4：观察性研究（8 小时）

**针对 Top 3 高频 Skill，各运行 3 个真实任务，手工分析 trace**

**观察清单**：
- 读取了哪些文件？payload 多大？
- 有没有明显的重复读取？
- 有没有明显的无关内容读取？
- 任务总耗时？模型思考 vs 等待工具？
- 有没有质量问题？

**输出**：`docs/research/phase0-observational-study/`
- `spec-plan-task1-trace-analysis.md`
- `spec-plan-task2-trace-analysis.md`
- ...

**决策规则**：
- 如果某 Skill 的 3 个任务中有 ≥2 个发现明显问题 → 进入 Phase 1
- 如果没有明显问题 → 记录 `no-opportunity`

### Phase 0 交付物

```
docs/research/
├── phase0-usage-analysis.md          # 日志分析
├── phase0-health-check.md            # 源码健康度
├── phase0-user-interviews.md         # 用户访谈（可选）
├── phase0-observational-study/       # 观察性研究
│   ├── spec-plan-task1-trace-analysis.md
│   ├── spec-work-task1-trace-analysis.md
│   └── ...
└── phase0-priority-recommendation.md # 优先级建议
```

### Phase 0 成本估算

| 活动 | 时间 | 新增费用 |
|---|---|---|
| 日志分析 | 2 小时 | 0 |
| 源码健康度检查 | 4 小时 | 0 |
| 用户访谈 | 6 小时（可选） | 0 |
| 观察性研究 | 8 小时（3 Skill × 3 任务） | 每个任务约 $0.5-2（按当前 model 估算），合计 $4.5-18 |
| **合计** | **14-20 小时** | **$5-20** |

**决策点**：Phase 0 完成后，根据发现的机会和优先级，决定 Phase 1 启动哪些项目。

---

## Phase 1: 优先级重排与分级验证

### 基于 Phase 0 的优先级框架

| 优先级 | 判断标准 | 验证强度 | 推广门 |
|---|---|---|---|
| **P0** | 用户普遍痛点 + 高频 + 影响第一印象 | 观察性 + 正反例 | 质量门 + 用户确认 |
| **P1** | 高频 + 有明显机会 | 对照实验（baseline vs candidate） | 质量门 + 成本改善 ≥10% |
| **P2** | 低频或质量债 | A/B 测试（如果需要） | 质量门 + 成本改善 ≥20% |

### 预期的优先级调整（Phase 0 后可能变化）

#### P0：入口与触发

| 编号 | Skill | 原优先级 | 调整后 | 理由 |
|---|---|---|---|
| O02 | using-spec-first | P1 | **P0** | 入口是第一印象，误触发影响最大 |

**快速验证路径**：
1. 收集最近 20 次误触发或反复转交的案例
2. 分析触发规则与实际意图的差距
3. 调整 description 或触发条件
4. 在 10 个新任务中观察误触发率

**推广门**：
- 误触发率下降 ≥50%
- 无新增漏触发
- 用户确认体验改善

#### P1：高频优化

| 编号 | Skill | 原优先级 | 调整后 | 理由 |
|---|---|---|---|
| O01 | spec-plan | P1 | **P1** | 保持，但简化启动 |
| O06 | spec-debug | P2 | **P1** | 如果 debug 是高频痛点 |
| O03 | spec-work | P2 | **P1** | 如果 work 是高频 Skill |

**快速验证路径（以 O01 为例）**：
1. Phase 0 观察性研究确认有重复读取
2. 手工构造 1 个候选（只改读取逻辑）
3. 在 5 个任务中对比 baseline vs candidate
4. 如果质量保持 + 成本改善 ≥10%，进入完整 A/B

**推广门**：
- 质量门通过（4 层 × 10+ cases）
- 成本改善 ≥10%（配对中位数）
- fresh-source 复核通过

#### P2：质量债与低频优化

| 编号 | Skill | 原优先级 | 调整后 | 理由 |
|---|---|---|---|
| O04/O05 | brainstorm/prd | P2 | **P2** | 相对低频 |
| O07 | code-review | P2 | **P2** | 按需触发，非核心路径 |
| O08 | handoff | P2 | **P2** | 跨会话场景，相对低频 |
| O09/O10 | compound/refresh | P2 | **P2** | 知识管理，非核心路径 |
| O11/O12 | commit/push-pr | **P0** | **P0**（但独立） | Git 副作用验证是质量债，但不阻塞其他优化 |

**快速验证路径（以 O11 为例）**：
1. 在隔离仓库中运行真实宿主
2. 记录暂存前是否触发分支门禁
3. 如果发现问题，修复后重跑
4. 不需要 A/B 测试，只需要"行为符合预期"

**推广门**：
- 行为验证通过（隔离环境）
- 真实宿主测试通过
- 无新增副作用

---

## Phase 2: 跨 Skill 协同优化（O13-O14）

### O13：改善跨 Skill 的 artifact 传递

**问题**：
- spec-plan 生成的 plan 文件，spec-work 要重新解析
- spec-work 的执行上下文，spec-debug 无法复用
- spec-compound 的知识，spec-debug 不知道如何查询

**优化方向**：
- 定义标准的 artifact schema（例如 plan v2、execution-context v1）
- 改善 handoff 的结构化程度
- 建立 artifact 版本兼容性保证

**快速验证路径**：
1. 分析 3 个 plan → work 任务，记录 work 重新读取了哪些信息
2. 设计 plan v2 schema，包含 work 需要的上下文
3. 在 2 个任务中对比 v1 vs v2
4. 如果 work 的读取量下降 ≥20%，推广

### O14：workflow 级别的端到端优化

**问题**：
- plan → work → review 的整体效率，不等于各 Skill 的效率之和
- 可能存在"局部最优、全局次优"的情况

**优化方向**：
- 测量 plan → work → review 的端到端时间
- 识别 handoff 的等待时间、重复工作
- 优化 workflow 级别的上下文传递

**快速验证路径**：
1. 选择 5 个完整的 plan → work → review 任务
2. 记录每个阶段的耗时、读取量、handoff 成本
3. 识别瓶颈（例如 work 启动慢、review 重新读取大量上下文）
4. 设计针对性优化

---

## 试用期机制

### 动机

**问题**：原方案要求成本改善 ≥20% 才推广，但如果某候选"质量保持、成本改善 10%"，直接记 `no-change` 可能错失渐进改善的机会。

**解决**：引入"试用期"机制。

### 试用期规则

| 候选结果 | 处置 |
|---|---|
| 质量门失败 | `reject/rollback`，不进入试用期 |
| 质量保持 + 成本改善 ≥20% | 直接推广 |
| 质量保持 + 成本改善 10-20% | 进入试用期（3-6 个月） |
| 质量保持 + 成本改善 5-10% | 进入试用期（6-12 个月） |
| 质量保持 + 成本改善 <5% | `no-change` |

**试用期的含义**：
- 候选进入正式源码，但标记为 `experimental`
- 在真实任务中积累更多证据
- 试用期结束后，重新评估：
  - 如果积累的证据支持收益，正式推广
  - 如果发现质量问题或收益不足，回滚

**试用期的观察指标**：
- 真实任务的成功率
- 用户反馈
- 长期成本趋势

---

## 更新后的 O01-O14 清单

| 编号 | Skill | 优先级 | 验证强度 | 快速验证路径 | 当前状态 |
|---|---|---|---|---|---|
| **O02** | using-spec-first | **P0** | 观察性 + 正反例 | 收集误触发案例 → 调整触发规则 → 观察 10 个新任务 | Phase 0 后启动 |
| **O11** | spec-commit | **P0**（独立） | 行为验证 | 隔离仓库 + 真实宿主测试 | Phase 0 后启动 |
| **O12** | spec-commit-push-pr | **P0**（独立） | 行为验证 | 隔离仓库 + 真实宿主测试 | Phase 0 后启动 |
| **O01** | spec-plan | **P1** | 观察性 → 对照 → A/B | Phase 0 观察 → 5 任务对照 → 完整 A/B | Phase 0 观察性研究中 |
| **O06** | spec-debug | **P1**（待确认） | 观察性 → 对照 | Phase 0 观察 → 短路径候选 → 5 任务对照 | Phase 0 后确认 |
| **O03** | spec-work | **P1**（待确认） | 观察性 → 对照 | Phase 0 观察 → 风险分级候选 → 5 任务对照 | Phase 0 后确认 |
| O04 | spec-brainstorm | P2 | 对照 | 需求闭合场景 → 3 任务对照 | Phase 1 后启动 |
| O05 | spec-prd | P2 | 对照 | 单领域/跨领域输入 → 3 任务对照 | Phase 1 后启动 |
| O07 | spec-code-review | P2 | 对照 | 小 diff/高风险样本 → 3 任务对照 | Phase 1 后启动 |
| O08 | spec-handoff | P2 | 对照 | 恢复场景 → 3 任务对照 | Phase 1 后启动 |
| O09 | spec-compound | P2 | A/B（如需要） | 假因果反例 → 判断质量对照 | Phase 1 后启动 |
| O10 | spec-compound-refresh | P2 | A/B（如需要） | 固定状态 judge + 中断恢复验证 | Phase 1 后启动 |
| **O13** | artifact 传递 | **P1**（新增） | 观察性 → 对照 | 分析 handoff 成本 → schema v2 → 2 任务对照 | Phase 0 后启动 |
| **O14** | workflow 端到端 | **P2**（新增） | 观察性 → 优化 | 5 个完整任务 → 瓶颈分析 → 针对性优化 | Phase 1 后启动 |

---

## 与原方案的对应关系

| 原方案 | v2 调整 |
|---|---|
| 直接进入 U2（基线采集） | Phase 0：用户痛点调研 + 观察性研究 |
| O01-O12 固定顺序 | 基于 Phase 0 重排：P0（入口）、P1（高频）、P2（质量债） |
| 所有项目 A/B 测试 | 分级验证：观察性 → 对照 → A/B |
| 20% 硬门 | 试用期：10-20% 可观察，5-10% 长期观察 |
| 12 个单 Skill | 增加 O13-O14：跨 Skill 协同 |
| U1-U6 Implementation Units | 保留，但作为 Phase 1+ 的执行细节 |

**保留的严格部分**：
- 质量硬门（关键回归零容忍）
- 候选隔离（独立 worktree）
- 推广条件（质量 + 成本 + 复核 + consumer + projection）
- 证据边界（observed/proxy/unavailable）

**简化的部分**：
- 启动成本（Phase 0 只需 $5-20）
- 验证强度（按影响面分级）
- 推广门（增加试用期）

---

## 下一步行动

### 立即可做（Phase 0）

1. **日志分析**（2 小时，$0）
   - 统计 Skill 调用频率、失败率
   - 识别 Top 3 高频 Skill

2. **源码健康度检查**（4 小时，$0）
   - 统计 Skill 复杂度、依赖关系
   - 识别已知问题

3. **观察性研究**（8 小时，$5-20）
   - 针对 Top 3 Skill，各运行 3 个真实任务
   - 手工分析 trace，识别明显机会

4. **优先级建议**（2 小时，$0）
   - 综合 Phase 0 发现
   - 更新 O01-O14 的优先级
   - 决定 Phase 1 启动哪些项目

### Phase 0 后（需授权）

5. **P0 项目**：O02（入口）、O11/O12（Git 副作用）
   - 快速验证路径
   - 推广门：质量 + 用户确认

6. **P1 项目**：O01/O06/O03（根据 Phase 0 确认）+ O13（artifact）
   - 观察性 → 对照 → A/B（如需要）
   - 推广门：质量 + 成本 ≥10%

7. **P2 项目**：O04/O05/O07/O08/O09/O10 + O14
   - Phase 1 完成后启动
   - 推广门：质量 + 成本 ≥20%

---

## 风险与降级

| 风险 | 检测信号 | 处置 |
|---|---|---|
| Phase 0 未发现明显机会 | 观察性研究无明显问题 | 记录 `no-opportunity`，不强行优化 |
| 用户痛点与理论分析不一致 | Phase 0 发现不同优先级 | 调整 O01-O14 排序 |
| 试用期发现质量问题 | 真实任务失败率上升 | 立即回滚，不等试用期结束 |
| 跨 Skill 优化影响面过大 | O13/O14 涉及多个 consumer | 分阶段推广，保留 v1 兼容 |

---

## 总结

**v2 的核心价值**：
- ✅ 保留原方案的严格推广门
- ✅ 降低调查阶段的启动成本（Phase 0：$5-20）
- ✅ 基于用户痛点排序，而非理论完备性
- ✅ 增加快速验证路径，缩短反馈周期
- ✅ 增加试用期机制，避免错失渐进改善
- ✅ 增加跨 Skill 协同优化（O13-O14）

**下一步**：执行 Phase 0（预计 14-20 小时，$5-20），根据发现的机会和优先级，决定 Phase 1 启动哪些项目。
