---
mode: quick
---

# Spec-First CLI 命令规范

> 入口命令: `spec-first`

---

## 核心工作流命令

### init - 初始化 Feature 工作区

```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...>
```

**参数**:
- `--feat <abbr>` - Feature 缩写 (如 AUTH、REPORT)
- `--mode <N|I>` - N(新功能) | I(增量迭代)
- `--size <S|M|L>` - 项目规模
- `--platforms <list>` - 平台列表 (逗号分隔)
- `--title <text>` - Feature 标题 (可选)
- `--feature-id <id>` - 指定 Feature ID (可选)
- `--bootstrap` - 执行宿主环境自修复

**前置条件**: 需先执行 `/spec-first:first` 完成项目认知

---

### stage - 阶段管理

```bash
spec-first stage <subcommand> <featureId>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `current` | 查看当前阶段状态 |
| `suggest` | 输出阶段建议与阻塞原因 |
| `advance` | 推进到下一阶段 (需通过 Gate) |
| `cancel --reason "<text>"` | 取消 Feature |

---

### gate - 质量门禁校验

```bash
spec-first gate <subcommand> <featureId>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `check` | 校验当前阶段 Gate 条件 |
| `history` | 查看 Gate 评估历史 |
| `conditions` | 列出当前阶段 Gate 条件 |
| `validate-config` | 验证 Profile 配置 |

**选项**:
- `--json` - JSON 格式输出
- `--no-persist` - 不持久化结果

---

### feature - Feature 管理

```bash
spec-first feature <subcommand>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `list` | 列出所有 Feature |
| `current` | 查看当前 Feature 详情 |
| `switch <featureId>` | 切换当前 Feature |

---

## 追溯与度量

### matrix - 追踪矩阵管理

```bash
spec-first matrix <subcommand> <featureId>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `check` | 检查追踪矩阵完整性 |
| `export` | 导出追踪矩阵 (--format markdown/yaml) |
| `update` | 更新追踪矩阵条目 |

**更新选项**:
- `--status <value>` - 状态 (Planned/Implemented/Verified/Accepted/Deferred/Cancelled/Exception)
- `--title <text>` - 标题
- `--upstream <ids>` - 上游依赖 ID (逗号分隔)
- `--downstream <ids>` - 下游影响 ID (逗号分隔)

---

### metrics - 指标计算

```bash
spec-first metrics <subcommand> <featureId>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `coverage` | 核心覆盖率指标 (C3/C4/C6/C8/C9) |
| `report` | 完整度量报告 |
| `health` | 健康分与关键风险 |

**选项**:
- `--json` - JSON 格式输出
- `--all` - 展示全量原始值

---

### id - ID 生成/搜索

```bash
spec-first id <subcommand>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `next <type> <abbr> --feature <featureId>` | 生成下一个 ID |
| `validate <id>` | 校验 ID 格式 |
| `search <query> --feature <featureId>` | 按关键字搜索 ID |
| `list --feature <featureId>` | 列出全部 ID |

**ID 类型**: FR, DS, TASK, TC, RFC, REQ, SYS, ARCH, MOD, ATP, STP, ITP, UTP

---

### trace - 追溯链管理

```bash
spec-first trace <subcommand> <featureId>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `fix` | 自动修复追溯链断裂 |
| `validate` | 校验追溯链完整性 (C3/C8) |

---

## 变更管理

### defect - 缺陷管理

```bash
spec-first defect <subcommand> <featureId>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `register` | 登记新缺陷 (--severity, --title, --reporter) |
| `update <seq> --status <status>` | 变更缺陷状态 |
| `list` | 列出缺陷 (--status, --severity 筛选) |
| `get <seq>` | 查看缺陷详情 |
| `escape-rate` | 计算缺陷逃逸率 |

**严重级别**: S1, S2, S3, S4
**状态**: open, fixing, fixed, verified, wontfix

---

### rfc - 变更请求管理

```bash
spec-first rfc <subcommand>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `create <featureId> --title "<title>"` | 创建 RFC |
| `submit <rfcId> --feature <featureId>` | 提交 RFC |
| `transition <rfcId> <status> --feature <featureId>` | 流转状态 |
| `list <featureId>` | 列出 RFC |
| `get <rfcId> --feature <featureId>` | 查看 RFC 详情 |

**级别**: Minor, Major, Critical
**状态**: draft, approved, closed, rejected

---

## AI 辅助

### ai - AI 上下文管理

```bash
spec-first ai <subcommand> <featureId>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `context` | 生成上下文包 (--full, --expand) |
| `catchup` | 执行 6 步会话恢复 |
| `stats` | 查看 AI 调用统计 |

---

### skill - Skill 渲染

```bash
spec-first skill render <skill-name> [--feature <featureId>] [--input <rawInput>]
```

---

## 环境与诊断

### doctor - 环境诊断

```bash
spec-first doctor [featureId]
```

检查项包括: Node.js 版本、Git、目录结构、配置文件、Hooks 状态、Session Hook、First Runtime 等

---

### first - 项目快速认知

```bash
spec-first first [--quick|--deep] [--type=<value>] [--force] [--skip] [--check-health]
```

**选项**:
- `--quick` - 快速模式 (<5min)
- `--deep` - 深度模式 (<10min)
- `--type=<value>` - 指定平台类型
- `--force` - 强制重新生成
- `--skip` - 跳过 AI 分析，仅恢复产物
- `--check-health` - 检查产物健康状态

---

### hooks - Git Hooks 管理

```bash
spec-first hooks <subcommand>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `install` | 安装 spec-first Git hooks |
| `uninstall` | 卸载 spec-first Git hooks |
| `status` | 查看 hooks 安装状态 |

---

### update - 升级刷新

```bash
spec-first update [--dry-run] [--skip-mcp] [--skip-hooks] [--host <target>] [--component <set>]
```

**选项**:
- `--dry-run` - 仅输出变更，不写文件
- `--skip-mcp` - 跳过 MCP 配置补齐
- `--skip-hooks` - 跳过 Git hooks 刷新
- `--host <target>` - 指定宿主 (claude|codex|gemini|cursor|generic|all)
- `--component <set>` - 组件安装计划 (skills|mcp|hooks|viewer)

---

### viewer - Stage 查看器

```bash
spec-first viewer [start|open|url] [options]
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `start` | 启动可视化服务 (默认) |
| `open` | 启动并打开浏览器 |
| `url` | 输出可视化地址 |

**选项**:
- `--project-root <path>` - 项目根目录
- `--host <host>` - 监听地址
- `--port <port>` - 指定端口
- `--open` - 自动打开浏览器
- `--print-url` - 输出可视化地址
- `--background` - 非阻塞模式

---

## 校验与分析

### validate - 校验命令

```bash
spec-first validate <subcommand> <featureId>
```

**子命令**:
| 子命令 | 说明 |
|--------|------|
| `format` | 校验产物格式 |
| `matrix` | 校验追溯矩阵 |
| `all` | 执行全部校验 |

---

### analyze - 一致性分析

```bash
spec-first analyze <featureId> [--out <path>]
```

执行跨产物一致性分析并生成 analysis-report.md

---

## 其他命令

### golive - 上线检查

```bash
spec-first golive check <featureId>
```

---

### onboarding - 新手引导

```bash
spec-first onboarding [--role=<role>] [--task=<task>] [--size=<size>]
```

交互式新手引导，建议通过 `/spec-first:onboarding` 调用

---

### uninstall - 卸载

```bash
spec-first uninstall
```

卸载 spec-first 集成 (移除 Hooks、Skills、MCP 配置)

---

## Skill 命令调用格式

通过 AI 助手调用 Skill:

```
/spec-first:<skill-name>
```

**常用 Skill**:
- `/spec-first:first` - 项目快速认知
- `/spec-first:init` - 初始化 Feature
- `/spec-first:code` - 代码实现
- `/spec-first:task` - 任务拆解
- `/spec-first:gate` - Gate 校验
- `/spec-first:catchup` - 会话恢复
- `/spec-first:analyze` - 一致性分析
- `/spec-first:review` - 代码评审
- `/spec-first:research` - 研究分析
