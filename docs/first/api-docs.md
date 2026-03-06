---
last_updated: 2026-03-06
mode: deep
project_type: backend
---

# API 文档

## CLI 命令接口

spec-first 提供 19 个 CLI 命令，作为主要的 API 接口。

### 核心命令

#### init - 初始化 Feature 工作区

```bash
spec-first init [options]
```

初始化新的 Feature 工作区，创建目录结构和配置文件。

#### stage - 阶段流转管理

```bash
spec-first stage <subcommand>
```

子命令:
- `current` - 查看当前阶段
- `advance` - 推进到下一阶段
- `cancel` - 取消 Feature

#### id - 追溯 ID 管理

```bash
spec-first id <subcommand>
```

子命令:
- `next <type>` - 生成下一个 ID
- `validate <id>` - 校验 ID 格式
- `search <pattern>` - 搜索 ID

支持的 ID 类型: FR, DS, TASK, TC, RFC, REQ, SYS, ARCH, MOD, ATP, STP, ITP, UTP


#### gate - 质量门禁评估

```bash
spec-first gate [stage]
```

评估指定阶段的质量门禁条件，返回 PASS/FAIL 状态。

#### matrix - 追踪矩阵同步

```bash
spec-first matrix
```

同步追踪矩阵，计算覆盖率指标（C1-C9）。

#### rfc - RFC 变更管理

```bash
spec-first rfc <subcommand>
```

子命令:
- `create` - 创建 RFC
- `approve <id>` - 批准 RFC
- `reject <id>` - 拒绝 RFC
- `list` - 列出所有 RFC

#### defect - 缺陷管理

```bash
spec-first defect <subcommand>
```

子命令:
- `create` - 创建缺陷
- `update <seq>` - 更新缺陷状态
- `list` - 列出所有缺陷

### 辅助命令

#### feature - Feature 管理

```bash
spec-first feature <subcommand>
```

子命令:
- `list` - 列出所有 Feature
- `switch <id>` - 切换当前 Feature
- `current` - 查看当前 Feature

#### ai - AI 上下文管理

```bash
spec-first ai <subcommand>
```

子命令:
- `catchup <feature-id>` - 恢复会话上下文
- `context` - 生成上下文摘要

#### doctor - 环境诊断

```bash
spec-first doctor
```

诊断项目环境配置，检查依赖和配置完整性。

#### metrics - 度量指标

```bash
spec-first metrics
```

输出覆盖率度量和健康评分。

#### commit - 规范提交

```bash
spec-first commit
```

执行规范化 git commit，自动关联追溯 ID。

#### analyze - 一致性分析

```bash
spec-first analyze
```

执行跨产物一致性分析，检查文档间的矛盾。

### 工具命令

#### setup - 注册 Skill 命令

```bash
spec-first setup
```

注册 Claude Code 和 Codex Skill 命令。

#### hooks - Git Hooks 管理

```bash
spec-first hooks <subcommand>
```

子命令:
- `install` - 安装 Git Hooks
- `status` - 查看 Hooks 状态

#### viewer - Stage Viewer

```bash
spec-first viewer
```

启动 Stage Viewer 可视化面板。

#### update - 升级刷新

```bash
spec-first update
```

升级后刷新 Skill/MCP/Hooks 配置。

#### uninstall - 清理配置

```bash
spec-first uninstall
```

卸载前清理宿主配置。

#### golive - 上线检查

```bash
spec-first golive
```

执行上线就绪检查与批准。

## 退出码

| 退出码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1 | Gate 失败 |
| 2 | 校验错误 |
| 3 | 配置错误 |
| 4 | IO 错误 |
| 5 | 未知错误 |
