# API 文档

> 生成时间: 2026-03-17 | 类型: cli-tool

## CLI 命令

### 核心命令

#### init

初始化 spec-first 到新项目或现有项目。

```bash
spec-first init [--type=<value>]
```

**选项**:
- `--type`: 手动指定项目类型

**证据**: `src/cli/index.ts:36-98` — `[显式]`

---

#### stage

管理 Feature 生命周期阶段。

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `advance` | 推进 Feature 到下一阶段 |
| `current` | 显示当前阶段 |
| `history` | 显示阶段历史 |
| `suggest` | 基于当前状态建议下一阶段 |

**示例**:
```bash
spec-first stage advance --feature <featureId>
spec-first stage current
spec-first stage history --feature <featureId>
```

---

#### gate

执行 Gate 质量检查。

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `check` | 检查当前阶段的 Gate 条件 |
| `conditions` | 列出可用的 Gate 条件 |
| `validate-config` | 验证 Gate 配置 |

**示例**:
```bash
spec-first gate check --feature <featureId>
spec-first gate check --feature <featureId> --stage 03_plan
```

**证据**: `src/core/gate-engine/gate-evaluator.ts` — `[显式]`

---

#### matrix

管理追溯矩阵。

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `check` | 检查追溯矩阵 |
| `sync` | 同步追溯矩阵 |
| `export` | 导出矩阵到各种格式 |

**示例**:
```bash
spec-first matrix sync --feature <featureId>
```

**证据**: `src/core/trace-engine/matrix.ts` — `[显式]`

---

#### feature

Feature 管理命令。

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `current` | 显示当前 Feature |
| `switch` | 切换到另一个 Feature |
| `list` | 列出所有 Feature |

**示例**:
```bash
spec-first feature current
spec-first feature switch FSREQ-20260313-UIOPT-001
```

---

#### id

追溯 ID 管理。

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `next` | 生成下一个 ID |
| `validate` | 验证 ID 格式 |
| `search` | 搜索 ID 引用 |

**示例**:
```bash
spec-first id generate FR --feature <featureId>
spec-first id search FR-UIOPT-001
```

**证据**: `src/core/trace-engine/id-validator.ts:9-22` — `[显式]`

---

#### rfc

RFC（变更请求）管理。

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `create` | 创建新 RFC |
| `list` | 列出 RFC |
| `get` | 获取 RFC 详情 |

**示例**:
```bash
spec-first rfc create --feature <featureId>
```

**证据**: `src/core/change-mgr/rfc-machine.ts` — `[显式]`

---

#### defect

缺陷管理。

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `register` | 注册新缺陷 |
| `update` | 更新缺陷状态 |
| `list` | 列出缺陷 |

**示例**:
```bash
spec-first defect create --feature <featureId>
```

**证据**: `src/core/change-mgr/defect-machine.ts` — `[显式]`

---

#### first

生成项目认知产物（runtime-first）。

```bash
spec-first first [--type] [--force] [--skip]
```

**选项**:
- `--type`: 项目类型
- `--force`: 强制重新生成
- `--skip`: 跳过某些步骤

---

#### skill

Skill 管理。

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `render` | 渲染 Skill 与上下文 |

**示例**:
```bash
spec-first skill render --skill 00-first
```

**证据**: `src/core/skill-runtime/dispatcher.ts` — `[显式]`

---

## 退出码

| 退出码 | 名称 | 说明 |
|--------|------|------|
| 0 | SUCCESS | 成功 |
| 1 | GATE_FAILED | Gate 校验失败 |
| 2 | VALIDATION_ERROR | 验证错误 |
| 3 | CONFIG_ERROR | 配置错误 |
| 4 | IO_ERROR | I/O 错误 |
| 5 | UNKNOWN_ERROR | 未知错误 |
| 6 | INVALID_ARGS | 无效参数 |
| 7 | GENERAL_ERROR | 通用错误 |

**证据**: `src/shared/types.ts:57-66` — `[显式]`

## 错误处理

| 错误类型 | 输出 | 退出码 |
|----------|------|--------|
| 验证错误 | Usage hint to stderr | VALIDATION_ERROR |
| Gate 失败 | Failed conditions list | GATE_FAILED |
| 需要确认 | 危险操作需要 --yes flag | VALIDATION_ERROR |

**证据**: `src/cli/index.ts:36-98` — `[显式]`
