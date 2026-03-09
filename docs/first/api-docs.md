# API 接口规范文档

> **mode**: quick
> **生成时间**: 2026-03-09
> **项目**: spec-first
> **类型**: CLI 工具

---

## 1. 项目类型说明

**spec-first** 是一个 CLI 工具，不提供 HTTP API。本文档分析其命令行接口规范。

---

## 2. CLI 接口规范

### 2.1 统一响应格式

**退出码（ExitCode）**：

```typescript
enum ExitCode {
  SUCCESS = 0,           // 成功
  GATE_FAILED = 1,       // 门禁失败
  VALIDATION_ERROR = 2,  // 参数校验错误
  CONFIG_ERROR = 3,      // 配置错误
  IO_ERROR = 4,          // 文件 I/O 错误
  UNKNOWN_ERROR = 5,     // 未知错误
}
```

**输出规范**：
- 成功信息输出到 `stdout`
- 错误信息输出到 `stderr`
- 所有命令返回标准退出码

### 2.2 命令注册机制

**注册接口**：

```typescript
registerCommand(
  name: string,              // 命令名称
  description: string,       // 命令描述
  handler: CommandHandler,   // 处理函数
  options?: {
    requiresConfirmation?: boolean | ((args: string[]) => boolean)
  }
)
```

**处理器签名**：

```typescript
type CommandHandler = (args: string[]) => Promise<number> | number;
```

### 2.3 确认策略

**确认机制**：
- 危险操作需要 `--yes` 标志确认
- 支持静态确认（`requiresConfirmation: true`）
- 支持动态确认（基于子命令参数判断）

**策略评估**：
```typescript
evaluatePolicy({
  mode: 'N' | 'I',           // Normal / Interactive
  size: 'S' | 'M' | 'L',     // Small / Medium / Large
  hasNfrSec: boolean,        // 是否涉及安全 NFR
  hasNewExternalApi: boolean // 是否新增外部 API
})
```

### 2.4 参数解析规范

**标志解析**：
- 使用 `--flag value` 格式
- 通过 `parseFlag(args, '--flag')` 提取值
- 支持位置参数和命名参数混合

**示例**：
```bash
spec-first id next FR login --feature FSREQ-001 --level UT
```

---

## 3. 核心命令接口

### 3.1 追溯 ID 管理（id）

**命令**: `spec-first id <subcommand>`

**子命令**：

| 子命令 | 参数 | 说明 |
|--------|------|------|
| `next` | `<type> <abbr> --feature <id> [--level <level>]` | 生成新 ID |
| `validate` | `<id>` | 校验 ID 格式 |
| `search` | `<id> [--type <type>]` | 搜索 ID |
| `list` | `[--type <type>]` | 列出所有 ID |

**类型枚举**：
- NextIdType: `FR`, `DS`, `TASK`, `TC`, `RFC`, `REQ`, `SYS`, `ARCH`, `MOD`, `ATP`, `STP`, `ITP`, `UTP`
- TcLevel: `UT`, `IT`, `E2E`, `ST`

### 3.2 阶段管理（stage）

**命令**: `spec-first stage <subcommand>`

**子命令**：

| 子命令 | 确认要求 | 说明 |
|--------|----------|------|
| `current` | 否 | 查看当前阶段 |
| `suggest` | 否 | 建议下一步操作 |
| `advance` | 是 | 推进到下一阶段 |
| `cancel` | 是 | 取消 Feature |

**阶段枚举**：
```
00_init → 01_specify → 02_design → 03_plan → 04_implement
→ 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled
```

### 3.3 变更管理（rfc）

**命令**: `spec-first rfc <subcommand>`

**子命令**：
- `create <title> --level <L1|L2|L3>`
- `approve <rfcId>`
- `reject <rfcId>`
- `list`

**确认要求**: 所有子命令需要确认

### 3.4 缺陷管理（defect）

**命令**: `spec-first defect <subcommand>`

**子命令**：
- `create <title> --severity <severity>`
- `resolve <defectId>`
- `close <defectId>`
- `list`

**确认要求**: 所有子命令需要确认

### 3.5 质量门禁（gate）

**命令**: `spec-first gate <subcommand>`

**子命令**：
- `eval [--stage <stage>]` - 评估门禁条件
- `conditions [--stage <stage>]` - 列出门禁条件
- `history` - 查看门禁历史
- `waive <conditionId> --rfc <rfcId>` - 豁免条件

**门禁状态**：
- `PASS` - 通过
- `PASS_WITH_WAIVER` - 豁免通过
- `FAIL` - 失败

### 3.6 追踪矩阵（matrix）

**命令**: `spec-first matrix <subcommand>`

**子命令**：
- `check` - 检查矩阵完整性
- `export` - 导出矩阵
- `update <sourceId> <targetId>` - 更新关联（需确认）

### 3.7 度量分析（metrics）

**命令**: `spec-first metrics <subcommand>`

**子命令**：
- `coverage [--type <type>]` - 查看覆盖率
- `health` - 健康度评分
- `bottleneck` - 瓶颈分析

### 3.8 Feature 管理（feature）

**命令**: `spec-first feature <subcommand>`

**子命令**：
- `list` - 列出所有 Feature
- `current` - 查看当前 Feature
- `switch <featureId>` - 切换 Feature（需确认）
- `info [<featureId>]` - 查看详情

### 3.9 AI 辅助（ai）

**命令**: `spec-first ai <subcommand>`

**子命令**：
- `catchup` - 生成上下文摘要
- `context` - 构建上下文包
- `validate-size` - 校验上下文大小

### 3.10 工具集成

| 命令 | 说明 | 确认要求 |
|------|------|----------|
| `commit` | 规范提交并关联追溯 ID | 是 |
| `hooks <install\|uninstall\|status>` | Git Hooks 管理 | 条件 |
| `setup` | 注册 Claude Code + Codex Skill | 是 |
| `update` | 升级后刷新配置 | 是 |
| `uninstall` | 清理宿主配置 | 是 |

### 3.11 诊断与校验

| 命令 | 说明 |
|------|------|
| `doctor` | 环境诊断与修复 |
| `validate <format\|matrix\|all>` | 产物格式校验 |
| `analyze` | 跨产物一致性分析 |
| `trace <check\|repair>` | 追溯链修复与校验 |

### 3.12 可视化

**命令**: `spec-first viewer`

**功能**: 启动 Stage Viewer 可视化面板（Web UI）

---

## 4. 命令路由架构

### 4.1 三层路由机制

```
用户输入
  ↓
1. Semantic Map（语义映射）
  ↓
2. Runtime Route（运行时路由）
  ↓
3. Skill Route（技能路由）
  ↓
命令处理器
```

### 4.2 分发流程

```typescript
dispatch(args: string[]) → {
  1. 解析命令名和参数
  2. 查找命令注册表
  3. 评估确认策略
  4. 调用处理器
  5. 返回退出码
}
```

---

## 5. 错误处理规范

### 5.1 错误输出格式

```
错误：<错误信息>
```

### 5.2 帮助信息触发

- 未知命令 → 提示运行 `--help`
- 参数错误 → 显示用法说明
- 子命令错误 → 显示子命令列表

### 5.3 异常捕获

```typescript
try {
  return await handler(args);
} catch (err) {
  console.error(`错误：${err.message}`);
  return ExitCode.UNKNOWN_ERROR;
}
```

---

## 6. 命名规范

### 6.1 命令命名

- 使用小写英文单词
- 多词用连字符（如 `stage-viewer`）
- 动词优先（如 `init`, `advance`, `validate`）

### 6.2 参数命名

- 标志使用 `--kebab-case` 格式
- 布尔标志无需值（如 `--yes`）
- 枚举值使用大写（如 `--level UT`）

### 6.3 ID 命名

**格式**: `<TYPE>-<ABBR>-<SEQ>`

**示例**:
- `FR-LOGIN-001` - 功能需求
- `TC-UT-AUTH-001` - 单元测试用例
- `RFC-SEC-001` - 变更请求

---

## 7. 接口示例

### 7.1 生成追溯 ID

```bash
$ spec-first id next FR login --feature FSREQ-001
已生成：FR-LOGIN-001
$ echo $?
0
```

### 7.2 推进阶段（需确认）

```bash
$ spec-first stage advance
命令 stage 需要确认：policy=manual。请追加 --yes 重试。
$ echo $?
2

$ spec-first stage advance --yes
✓ 已从 01_specify 推进到 02_design
$ echo $?
0
```

### 7.3 门禁评估

```bash
$ spec-first gate eval
门禁评估结果：FAIL
  ✗ C1-FR-COVERAGE: FR 覆盖率不足 (50% < 80%)
  ✓ C2-DS-COMPLETE: 设计文档完整
$ echo $?
2
```

### 7.4 查看帮助

```bash
$ spec-first --help
用法：spec-first <command> <subcommand> [args] [--flags]

命令：
  id            追溯 ID 生成、校验与检索
  matrix        同步追踪矩阵
  init          初始化 Feature 工作区
  stage         阶段流转管理（current/suggest/advance/cancel）
  ...
```

---

## 8. 扩展性设计

### 8.1 命令注册机制

- 插件化命令注册
- 支持动态加载处理器
- 统一错误处理和日志

### 8.2 确认策略扩展

- 支持自定义策略函数
- 基于上下文动态评估
- 可配置默认行为

### 8.3 Skill 集成

- 通过 `resolveSkillPath()` 搜索技能定义
- 支持 Handlebars 模板渲染
- 与 AI 运行时集成

---

## 9. 总结

spec-first 采用标准化的 CLI 接口设计：

1. **统一退出码** - 5 种标准退出码覆盖所有场景
2. **命令注册机制** - 插件化、可扩展的命令路由
3. **确认策略** - 危险操作强制确认，支持动态策略
4. **类型安全** - TypeScript 枚举确保参数类型正确
5. **错误处理** - 统一的异常捕获和错误输出
6. **三层路由** - 语义映射 → 运行时路由 → 技能路由

所有命令遵循 `spec-first <command> <subcommand> [args] [--flags]` 的统一格式，确保用户体验一致性。
