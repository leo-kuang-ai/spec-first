---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 代码结构概览

## 模块划分

### 1. cli
- **路径**: `src/cli/`
- **职责**: CLI 命令层，命令注册、路由分发、参数解析
- **文件数**: 25
- **关键文件**: `index.ts`, `router.ts`, `commands/*.ts`

### 2. process-engine
- **路径**: `src/core/process-engine/`
- **职责**: 阶段状态机，驱动 Feature 生命周期流转 (00_init → 08_done/09_cancelled)
- **文件数**: 8
- **关键文件**: `stage-machine.ts`, `advance.ts`, `feature.ts`

### 3. skill-runtime
- **路径**: `src/core/skill-runtime/`
- **职责**: Skill 分发、prompt 组装、三层路由、编排参数解析
- **文件数**: 22
- **关键文件**: `dispatcher.ts`, `prompt-assembler.ts`, `hard-gate.ts`

### 4. ai-orchestrator
- **路径**: `src/core/ai-orchestrator/`
- **职责**: AI 自动循环、上下文恢复、context-pack、重试控制
- **文件数**: 15
- **关键文件**: `auto-loop.ts`, `catchup.ts`, `context-pack.ts`

### 5. gate-engine
- **路径**: `src/core/gate-engine/`
- **职责**: 质量门禁评估、安全扫描、SCA、上线/回滚门禁
- **文件数**: 7
- **关键文件**: `gate-evaluator.ts`, `security.ts`, `golive.ts`

### 6. trace-engine
- **路径**: `src/core/trace-engine/`
- **职责**: 追溯 ID 生成/校验/搜索、覆盖率矩阵 (C1-C9)
- **文件数**: 9
- **关键文件**: `id-generator.ts`, `matrix.ts`, `coverage.ts`

### 7. change-mgr
- **路径**: `src/core/change-mgr/`
- **职责**: RFC + Defect 状态机、影响分析、同步机制
- **文件数**: 6
- **关键文件**: `rfc-machine.ts`, `defect-machine.ts`, `impact.ts`

### 8. template
- **路径**: `src/core/template/`
- **职责**: Handlebars 模板渲染、产物检查、变更分类
- **文件数**: 6
- **关键文件**: `renderer.ts`, `artifact-checker.ts`, `hash-registry.ts`

### 9. tool-integration
- **路径**: `src/core/tool-integration/`
- **职责**: AI runtime hooks、会话钩子、上下文同步
- **文件数**: 6
- **关键文件**: `ai-runtime-hook.ts`, `session-hook.ts`, `context-sync.ts`

### 10. metrics-engine
- **路径**: `src/core/metrics-engine/`
- **职责**: 健康度评分、瓶颈分析
- **文件数**: 2
- **关键文件**: `health-score.ts`, `bottleneck.ts`

### 11. shared
- **路径**: `src/shared/`
- **职责**: 共享类型定义 (Stage, ExitCode, ID types) 与工具函数
- **文件数**: 1
- **关键文件**: `types.ts`

### 12. config
- **路径**: `src/config/`
- **职责**: 配置管理
- **文件数**: 1

## 开发入口

1. **CLI 入口**: `src/cli/index.ts`
2. **状态机入口**: `src/core/process-engine/stage-machine.ts`
3. **Skill 分发入口**: `src/core/skill-runtime/dispatcher.ts`

## 项目统计

- **总文件数**: 10,110
- **核心模块数**: 12
- **Serena 可用**: ✅
