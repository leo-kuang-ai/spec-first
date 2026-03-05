# OpenSpec 项目 Skill 详细列表

> **版本**: 1.1.0 | **更新日期**: 2026-03-03 | **Skill 源**: `/Users/kuang/xiaobu/OpenSpec/src/core/templates/workflows/`

---

## 概述

OpenSpec 项目共包含 **12 个 Skill**，采用 OPSX (OpenSpec eXperimental) 工作流系统，设计理念为"fluid, iterative workflow"（流动迭代工作流）。

---

## Skill 列表

### 核心工作流 Skills (4 个)

#### 1. explore
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-explore` |
| **命令** | `/opsx:explore` |
| **描述** | 探索模式 - 思考伙伴，用于探索想法、调查问题、澄清需求 |

**核心姿态**:
- 好奇而非教条 - 自然地提出问题
- 开放线程而非审问 - 呈现多个有趣的方向
- 视觉化 - 大量使用 ASCII 图表
- 适应性 - 跟随有趣的主题
- 耐心 - 不急于得出结论

**流程节点**:
1. 检查现有变更上下文
2. 探索问题空间
3. 调查代码库
4. 比较选项
5. 可视化
6. 发现风险和未知

**重要约束**: 不实现代码 - 只能读取文件、搜索代码、调查代码库
---

#### 2. propose
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-propose` |
| **命令** | `/opsx:propose` |
| **描述** | 提议新变更 - 一步创建变更并生成所有工件 |

**创建的工件**:
- `proposal.md` (what & why)
- `specs/` (requirements & scenarios)
- `design.md` (how)
- `tasks.md` (implementation steps)

**流程节点**:
1. 如果没有明确输入，询问用户想要构建什么
2. 创建变更目录
3. 获取工件构建顺序
4. 按依赖顺序创建工件直到可应用状态
5. 显示最终状态
---

#### 3. apply
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-apply-change` |
| **命令** | `/opsx:apply` |
| **描述** | 实现变更中的任务 |

**流程节点**:
1. 选择变更（如未指定，从上下文推断或提示选择）
2. 检查状态理解 schema
3. 获取应用指令
4. 读取上下文文件
5. 显示当前进度
6. 实现任务（循环直到完成或阻塞）
7. 完成或暂停时显示状态

**状态处理**:
- `blocked`: 缺少工件，建议使用 continue
- `all_done`: 祝贺，建议归档
- 其他: 继续实现
---

#### 4. archive
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-archive-change` |
| **命令** | `/opsx:archive` |
| **描述** | 归档已完成的变更 |

**流程节点**:
1. 如果没有提供变更名称，提示选择
2. 检查工件完成状态
3. 检查任务完成状态
4. 评估 delta spec 同步状态
5. 执行归档（移动到 `openspec/changes/archive/YYYY-MM-DD-<name>/`）
6. 显示摘要
---

### 扩展工作流 Skills (7 个)

#### 5. new-change
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-new-change` |
| **命令** | `/opsx:new` |
| **描述** | 启动新变更脚手架（分步创建工件） |

**流程节点**:
1. 如果没有明确输入，询问想要构建什么
2. 确定工作流 schema
3. 创建变更目录
4. 显示工件状态
5. 获取第一个工件的指令
6. **停止并等待用户指示**

**重要约束**: 不创建任何工件 - 只显示指令
---

#### 6. continue-change
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-continue-change` |
| **命令** | `/opsx:continue` |
| **描述** | 通过创建下一个工件继续处理变更 |

**流程节点**:
1. 如果没有提供变更名称，提示选择
2. 检查当前状态
3. 根据状态行动：
   - 如果所有工件完成：建议实现或归档
   - 如果有就绪工件：创建第一个就绪工件
   - 如果所有工件阻塞：显示状态并建议检查
4. 创建工件后显示进度

**重要约束**: 每次调用只创建一个工件
---

#### 7. ff-change
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-ff-change` |
| **命令** | `/opsx:ff` |
| **描述** | 快进模式 - 一次性创建开始实现所需的所有工件 |

**流程节点**:
1. 如果没有明确输入，询问想要构建什么
2. 创建变更目录
3. 获取工件构建顺序
4. 按依赖顺序创建工件直到所有 `applyRequires` 工件完成
5. 显示最终状态
---

#### 8. verify
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-verify-change` |
| **命令** | `/opsx:verify` |
| **描述** | 验证实现与变更工件的一致性 |

**三个验证维度**:
1. **Completeness (完整性)**: 任务完成度、规范覆盖率
2. **Correctness (正确性)**: 需求实现映射、场景覆盖
3. **Coherence (一致性)**: 设计遵循度、代码模式一致性

**流程节点**:
1. 如果没有提供变更名称，提示选择
2. 检查状态理解 schema
3. 获取变更目录并加载工件
4. 初始化验证报告结构
5. 验证完整性
6. 验证正确性
7. 验证一致性
8. 生成验证报告
---

#### 9. sync-specs
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-sync-specs` |
| **命令** | `/opsx:sync` |
| **描述** | 将 delta specs 从变更同步到主 specs |

**Delta Spec 操作类型**:
- `## ADDED Requirements` - 新增需求
- `## MODIFIED Requirements` - 修改需求
- `## REMOVED Requirements` - 删除需求
- `## RENAMED Requirements` - 重命名需求

**关键原则**: 智能合并 - delta 代表意图而非完全替换
---

#### 10. bulk-archive
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-bulk-archive-change` |
| **命令** | `/opsx:bulk-archive` |
| **描述** | 批量归档多个已完成的变更 |
---

#### 11. onboard
| 属性 | 值 |
|------|-----|
| **名称** | `openspec-onboard` |
| **命令** | `/opsx:onboard` |
| **描述** | 引导式入门 - 通过叙述和实际代码库工作走完完整工作流程周期 |

**阶段**:
1. Preflight: 检查 CLI 安装
2. Phase 1-11: Welcome → Task Selection → Explore Demo → Create Change → Proposal → Specs → Design → Tasks → Apply → Archive → Recap
---

### 辅助 Skill (1 个)

#### 12. feedback
| 属性 | 值 |
|------|-----|
| **名称** | `feedback` |
| **命令** | `/feedback` |
| **描述** | 收集并提交用户反馈（带上下文增强和匿名化） |

**匿名化规则**:
- 文件路径 → `<path>`
- API keys/tokens → `<redacted>`
- 公司/组织名 → `<company>`
- 个人姓名 → `<user>`
- 特定 URL → `<url>`
---

## 工件依赖图 (DAG)

```
                      proposal
                     (root node)
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
         specs                       design
      (requires:                  (requires:
       proposal)                   proposal)
            │                           │
            └─────────────┬─────────────┘
                          │
                          ▼
                       tasks
                   (requires:
                   specs, design)
                          │
                          ▼
                  ┌──────────────┐
                  │ APPLY PHASE  │
                  └──────────────┘
```

**状态转换**:
```
BLOCKED ────────────────► READY ────────────────► DONE
   │                        │                       │
Missing                  All deps               File exists
dependencies             are DONE               on filesystem
```

---

## 工作流模式

### 核心工作流（快速路径）
```
/opsx:explore → /opsx:propose → /opsx:apply → /opsx:archive
```

### 扩展工作流（细粒度控制）
```
/opsx:explore → /opsx:new → /opsx:continue (多次) → /opsx:apply → /opsx:verify → /opsx:archive
```

### 快进工作流
```
/opsx:explore → /opsx:ff → /opsx:apply → /opsx:verify → /opsx:archive
```
