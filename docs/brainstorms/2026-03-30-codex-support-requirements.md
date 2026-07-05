# Spec-First Codex 平台支持需求文档

**日期**: 2026-03-30
**状态**: Ready for Planning
**范围**: 标准

## 1. 目标

在不破坏现有 Claude 链路的前提下，为 Spec-First 增加 Codex 平台支持，将架构从"Claude-only 运行态"演进为"统一资产源 + 多平台适配器"模型。

## 2. 核心问题

当前 Spec-First 实现对 Claude 平台有硬编码依赖：
- 目标目录固定为 `.claude/`
- `init` 命令只接受 `--claude` 参数
- 状态文件和开发者元数据路径写死
- 内容转换逻辑是 Claude 专用的

需要支持 Codex 平台，但不能破坏现有 Claude 用户体验。

## 3. 用户场景

### 3.1 Claude 用户（现有）
```bash
npm install -g spec-first
spec-first init --claude
spec-first doctor
spec-first clean --claude
```

### 3.2 Codex 用户（新增）
```bash
npm install -g spec-first
spec-first init --codex
spec-first doctor --codex
spec-first clean --codex
```

## 4. 技术方案

### 4.1 架构演进

**当前架构**:
```
canonical assets → Claude runtime (hardcoded)
```

**目标架构**:
```
canonical assets → platform adapter → platform-specific runtime
                   ├── Claude adapter → .claude/
                   └── Codex adapter → .codex/
```

### 4.2 平台适配器接口

每个平台适配器需要提供：

```javascript
{
  id: 'claude' | 'codex',
  runtimeRoot: '.claude' | '.codex',
  managedRoot: '.claude/spec-first' | '.codex/spec-first',
  commandRoot: '.claude/commands/spec' | '.codex/commands/spec',
  skillsRoot: '.claude/skills' | '.codex/skills',
  agentsRoot: '.claude/agents' | '.codex/agents',
  stateFile: '.claude/spec-first/state.json',
  developerFile: '.claude/spec-first/.developer',
  transformSkillContent(content),
  transformAgentContent(content),
  inspect(projectRoot),
}
```

### 4.3 代码改造范围

| 文件 | 改造内容 |
|------|----------|
| `src/cli/index.js` | 支持平台参数解析 |
| `src/cli/commands/init.js` | 通过 adapter 初始化，不直接写死路径 |
| `src/cli/commands/doctor.js` | 通过 adapter 检查平台资产 |
| `src/cli/commands/clean.js` | 通过 adapter 清理平台资产 |
| `src/cli/plugin.js` | 拆分为 asset layer + adapter layer |
| `src/cli/state.js` | 路径参数化，支持多平台 |

## 5. 设计原则

1. **Canonical 资产不变** - `templates/`, `skills/`, `agents/`, `.claude-plugin/plugin.json` 保持平台无关
2. **运行态由适配器生成** - 所有平台差异在运行态生成阶段处理
3. **现有 Claude 不退化** - 保持向后兼容
4. **平台边界显式化** - 通过适配器统一管理，不散落在各命令中

## 6. 实现阶段

### 阶段 1: 抽取适配器层
- 定义平台适配器接口
- 将 Claude 逻辑迁移到 Claude adapter
- 命令层改为通过 adapter 调用

### 阶段 2: 接入 Codex
- 实现 Codex adapter
- 支持 `init --codex` 生成 `.codex/` 运行态
- 补充 Codex 平台测试

### 阶段 3: 文档和验证
- 更新 README 和用户手册
- 补充平台识别信息
- 验证兼容性

## 7. 成功标准

- ✅ `spec-first init --claude` 行为和输出不变
- ✅ `spec-first init --codex` 成功生成 `.codex/` 运行态
- ✅ `doctor` 和 `clean` 支持双平台
- ✅ Canonical 资产保持平台无关
- ✅ 现有测试通过，新增 Codex 测试覆盖

## 8. 非目标

- ❌ 不重做 plugin-first / marketplace 模型
- ❌ 不改变 canonical 资产结构
- ❌ 不要求用户迁移现有 Claude 配置

## 9. 风险与对策

| 风险 | 对策 |
|------|------|
| 平台逻辑扩散到各命令 | 强制通过 adapter 调用 |
| Canonical 和运行态混淆 | 文档和代码明确区分 |
| Codex 约定与猜测不一致 | 集中在 adapter 配置，易调整 |
| 测试只覆盖 Claude | 分层补齐 adapter 单测和平台 smoke test |

## 10. 下一步

进入 `spec-plan` 阶段，设计详细实现方案。
