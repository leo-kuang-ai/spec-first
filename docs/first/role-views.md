---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 角色视图

## 产品经理视角

**关注点**: Specification-driven development process engine

### 核心能力
- Feature lifecycle management
- Stage state machine
- Traceability matrix
- Quality gates
- RFC and defect tracking

### 关键价值
- 规范驱动的研发流程
- 全链路追溯能力
- 质量门禁保障

---

## Developer

## 开发者视角

**关注点**: Specification-driven development process engine

### 核心模块
- cli - 命令行接口
- process-engine - 流程引擎
- skill-runtime - 技能运行时
- ai-orchestrator - AI 编排
- gate-engine - 门禁引擎
- trace-engine - 追溯引擎
- change-mgr - 变更管理
- template - 模板系统
- tool-integration - 工具集成
- metrics-engine - 度量引擎
- shared - 共享层
- config - 配置管理

### 开发入口
- `src/cli/index.ts`
- `src/core/process-engine/stage-machine.ts`
- `src/core/skill-runtime/dispatcher.ts`

---

## QA 视角

**关注点**: Specification-driven development process engine

### 测试重点
- Feature lifecycle management
- Stage state machine
- Traceability matrix
- Quality gates
- RFC and defect tracking

### 验证链路
- CLI 命令测试
- 状态机流转测试
- 追溯矩阵验证

---

## 架构师视角

**关注点**: Specification-driven development process engine

### 平台类型
- CLI Tool

### 关键入口
- `src/cli/index.ts`
- `src/core/process-engine/stage-machine.ts`
- `src/core/skill-runtime/dispatcher.ts`

### 架构约束
- ESM Only
- Named exports
- TypeScript Strict Mode
