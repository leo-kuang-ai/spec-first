# GSD-2 vs Get-Shit-Done 对比分析

> **分析日期**: 2026-03-15
> **项目版本**: GSD-2 v2.10.10 | Get-Shit-Done v1.22.4

---

## 一、核心结论

### 1.1 项目关系

**GSD-2 是 Get-Shit-Done 的专业升级版**，但两者并行维护：

```
Get-Shit-Done (v1)          GSD-2 (v2)
     │                          │
     │    ──── 演进关系 ────▶   │
     │                          │
     ▼                          ▼
  Prompt 框架              独立代理应用
  (轻量、易上手)           (功能完整、自动化)
     │                          │
     └──── 两者并行维护 ────────┘
```

| 维度 | Get-Shit-Done (v1) | GSD-2 (v2) |
|------|-------------------|------------|
| **定位** | Prompt 工程框架 | 独立编码代理 |
| **运行方式** | 注入宿主 AI 命令系统 | 独立 CLI 二进制 |
| **自动化程度** | 半自主 (用户推进) | 真正自主 (状态机驱动) |
| **依赖** | 仅宿主 AI | Pi SDK + 多个工具 |
| **安装复杂度** | 一行命令 | 需要原生二进制 |

---

## 二、功能对比矩阵

### 2.1 工作流阶段

两者都实现 **4 阶段开发闭环**：

```
Research → Plan → Execute → Verify
```

| 阶段 | Get-Shit-Done | GSD-2 | 差异 |
|------|--------------|-------|------|
| **Research** | 4 个并行 Agent | 自动调研单元 | GSD-2 更自动化 |
| **Plan** | gsd-planner Agent | plan_slice 单元 | 相似 |
| **Execute** | gsd-executor Agent | execute_task 单元 | GSD-2 有原子提交 |
| **Verify** | gsd-verifier Agent | must-haves 校验 | 相似 |

### 2.2 独有功能对比

| GSD-2 独有 | Get-Shit-Done 独有 |
|-----------|-------------------|
| 真正的自动模式 (`/gsd auto`) | 多运行时支持 (Claude/OpenCode/Gemini/Codex) |
| 崩溃恢复 + 会话取证 | Quick 模式快速任务 |
| 成本追踪 + Dashboard | 批量讨论 (`--batch`) |
| 三层超时监督 | Skills 系统 (Codex) |
| 浏览器工具 (Playwright) | 简单安装 (npx 一行) |
| 语音输入 (macOS/Linux) | 社区移植生态 |
| Worktree 生命周期管理 | — |

### 2.3 状态管理对比

| 维度 | Get-Shit-Done | GSD-2 |
|------|--------------|-------|
| **状态源** | `.planning/` | `.gsd/` |
| **项目描述** | `PROJECT.md` | `PROJECT.md` |
| **决策记录** | `STATE.md` | `DECISIONS.md` |
| **路线图** | `ROADMAP.md` | `{milestone}-ROADMAP.md` |
| **阶段计划** | `{phase}-PLAN.md` | `{slice}-PLAN.md` |
| **任务摘要** | `{phase}-SUMMARY.md` | `{task}-SUMMARY.md` |

---

## 三、技术架构对比

### 3.1 代码规模

| 项目 | 核心代码 | 语言 | 架构 |
|------|---------|------|------|
| GSD-2 | ~14,000 行 | TypeScript | Monorepo (5 packages) |
| Get-Shit-Done | ~5,400 行 | CommonJS | Commands + Agents |

### 3.2 关键模块

**GSD-2 核心模块** (`src/resources/extensions/gsd/`):

| 文件 | 行数 | 功能 |
|------|------|------|
| `auto.ts` | ~3,500 | 自动机器状态机 |
| `files.ts` | ~900 | 文件解析 |
| `git-service.ts` | ~1,100 | Git 操作 |
| `preferences.ts` | ~800 | 配置系统 |
| `doctor.ts` | ~850 | 诊断修复 |
| `session-forensics.ts` | ~500 | 崩溃恢复 |

**Get-Shit-Done 核心模块** (`get-shit-done/bin/lib/`):

| 文件 | 行数 | 功能 |
|------|------|------|
| `init.cjs` | ~700 | 初始化上下文 |
| `verify.cjs` | ~950 | 验证套件 |
| `state.cjs` | ~850 | 状态管理 |
| `phase.cjs` | ~900 | 阶段操作 |
| `commands.cjs` | ~550 | 命令分发 |

### 3.3 Agent 体系

**Get-Shit-Done Agents** (12 个):
```
gsd-planner          # 计划制定
gsd-executor         # 任务执行
gsd-verifier         # 结果验证
gsd-debugger         # 调试分析
gsd-researcher-*     # 调研系列 (4个)
gsd-roadmapper       # 路线图
gsd-codebase-mapper  # 代码库映射
gsd-integration-checker
gsd-nyquist-auditor
gsd-plan-checker
```

**GSD-2 Agents** (3 个):
```
scout      # 快速代码库侦察
researcher # 网络调研
worker     # 通用执行
```

---

## 四、Spec-First 可借鉴点

### 4.1 从 GSD-2 借鉴

| 功能 | 借鉴价值 | 实现难度 |
|------|---------|---------|
| **自动模式状态机** | ⭐⭐⭐⭐⭐ | 高 |
| **崩溃恢复 + 会话取证** | ⭐⭐⭐⭐ | 中 |
| **成本追踪 Dashboard** | ⭐⭐⭐⭐ | 中 |
| **三层超时监督** | ⭐⭐⭐⭐ | 中 |
| **Branch-per-slice + Squash merge** | ⭐⭐⭐⭐ | 低 |
| **Stuck 检测 (重复派发)** | ⭐⭐⭐ | 低 |

### 4.2 从 Get-Shit-Done 借鉴

| 功能 | 借鉴价值 | 实现难度 |
|------|---------|---------|
| **多运行时支持设计** | ⭐⭐⭐⭐ | 中 |
| **Wave 执行调度** | ⭐⭐⭐⭐⭐ | 中 |
| **Agent frontmatter 规范** | ⭐⭐⭐⭐ | 低 |
| **gsd-tools CLI 工具集模式** | ⭐⭐⭐⭐ | 低 |
| **批量讨论 (--batch)** | ⭐⭐⭐ | 低 |
| **Quick 模式快速任务** | ⭐⭐⭐⭐ | 低 |

### 4.3 优先实现建议

**P0 - 立即借鉴**:
1. Wave 执行调度 (并行任务编排)
2. Stuck 检测机制
3. Quick 模式快速任务入口

**P1 - 短期规划**:
1. 三层超时监督
2. 成本追踪基础版
3. Branch-per-slice Git 策略

**P2 - 长期规划**:
1. 自动模式状态机
2. 崩溃恢复系统
3. Dashboard 可视化

---

## 五、选型建议

```
                    需要真正自动化？
                          │
              ┌───────────┴───────────┐
              │                       │
             是                       否
              │                       │
              ▼                       ▼
         使用 GSD-2            使用 Get-Shit-Done
              │                       │
              │               ┌───────┴───────┐
              │               │               │
              │         需要多运行时？    仅用 Claude Code？
              │               │               │
              │              是               否
              │               │               │
              │               ▼               ▼
              │          Get-Shit-Done   两者皆可
```

**适用场景**:

| 场景 | 推荐 |
|------|------|
| 大型项目长期开发 | GSD-2 |
| 快速原型验证 | Get-Shit-Done |
| 团队协作 (独立运行时) | GSD-2 |
| 多 AI CLI 用户 | Get-Shit-Done |
| 需要浏览器自动化 | GSD-2 |
| 需要精细控制每一步 | Get-Shit-Done |

---

## 六、参考资源

- GSD-2 GitHub: https://github.com/gsd-build/gsd-pi
- Get-Shit-Done GitHub: https://github.com/glittercowboy/get-shit-done
- Pi SDK: https://github.com/badlogic/pi-mono

---

*分析完成于 2026-03-15*
